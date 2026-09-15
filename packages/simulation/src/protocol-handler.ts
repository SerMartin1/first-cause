import type { SimulationRequest, SimulationResponse } from "@first-cause/shared";
import { ENGINE_VERSION } from "./constants.js";

/**
 * Builds a pure request handler for the Simulation Worker protocol.
 *
 * Kept separate from `worker.ts` (the worker_threads plumbing) so the
 * actual response logic can be unit-tested without spinning up a real
 * worker thread -- see Technology Stack Decision SS33 ("Pure calculation").
 *
 * M0 scope: PING/PONG and GET_CORE_STATUS only. No world, tick, or
 * gameplay logic exists yet.
 */
export function createSimulationRequestHandler(
  startedAt: number,
): (request: SimulationRequest) => SimulationResponse {
  return (request: SimulationRequest): SimulationResponse => {
    switch (request.type) {
      case "PING":
        return { type: "PONG", receivedAt: Date.now() };

      case "GET_CORE_STATUS":
        return {
          type: "CORE_STATUS",
          workerOnline: true,
          engineVersion: ENGINE_VERSION,
          startedAt,
          uptimeMs: Date.now() - startedAt,
        };

      default: {
        const exhaustiveCheck: never = request;
        throw new Error(
          `Unhandled simulation request: ${JSON.stringify(exhaustiveCheck)}`,
        );
      }
    }
  };
}
