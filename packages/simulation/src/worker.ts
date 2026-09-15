/**
 * Simulation Worker entry point.
 *
 * Runs inside a Node `worker_threads` Worker, spawned by the Electron
 * main process. Never imports React or Electron (Simulation Core must
 * stay independent of the UI/host runtime).
 *
 * M0 scope: proves the full request/response path end to end. No World
 * State, tick pipeline, or RNG exists yet -- that begins in M1.
 */
import { parentPort } from "node:worker_threads";
import type {
  SimulationRequest,
  WorkerEnvelope,
  WorkerErrorEnvelope,
} from "@first-cause/shared";
import { createSimulationRequestHandler } from "./protocol-handler.js";

if (!parentPort) {
  throw new Error(
    "packages/simulation worker.ts must be run inside a worker_threads Worker.",
  );
}

const port = parentPort;
const handleRequest = createSimulationRequestHandler(Date.now());

port.on("message", (envelope: WorkerEnvelope<SimulationRequest>) => {
  try {
    const response = handleRequest(envelope.payload);
    port.postMessage({
      requestId: envelope.requestId,
      payload: response,
    } satisfies WorkerEnvelope<typeof response>);
  } catch (error: unknown) {
    const errorEnvelope: WorkerErrorEnvelope = {
      requestId: envelope.requestId,
      error: error instanceof Error ? error.message : String(error),
    };
    port.postMessage(errorEnvelope);
  }
});
