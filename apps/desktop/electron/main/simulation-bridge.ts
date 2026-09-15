import { randomUUID } from "node:crypto";
import { Worker } from "node:worker_threads";
import type {
  SimulationRequest,
  SimulationResponse,
  WorkerEnvelope,
  WorkerErrorEnvelope,
} from "@first-cause/shared";

type WorkerMessage = WorkerEnvelope<SimulationResponse> | WorkerErrorEnvelope;

interface PendingRequest {
  readonly resolve: (response: SimulationResponse) => void;
  readonly reject: (error: Error) => void;
}

function isErrorEnvelope(message: WorkerMessage): message is WorkerErrorEnvelope {
  return "error" in message;
}

/**
 * Owns the worker_threads Simulation Worker and correlates async
 * request/response pairs so the Electron main process can `await` a
 * reply for a given request, even with multiple requests in flight.
 *
 * This bridge is the *only* place in the app allowed to talk to the
 * worker directly -- the renderer only ever sees typed IPC results via
 * preload (see electron/preload/index.ts).
 */
export class SimulationBridge {
  private readonly worker: Worker;
  private readonly pending = new Map<string, PendingRequest>();

  constructor(workerPath: string) {
    this.worker = new Worker(workerPath);

    this.worker.on("message", (message: WorkerMessage) => {
      const pending = this.pending.get(message.requestId);
      if (!pending) {
        return;
      }
      this.pending.delete(message.requestId);

      if (isErrorEnvelope(message)) {
        pending.reject(new Error(message.error));
      } else {
        pending.resolve(message.payload);
      }
    });

    this.worker.on("error", (error: Error) => {
      for (const pending of this.pending.values()) {
        pending.reject(error);
      }
      this.pending.clear();
    });
  }

  invoke(request: SimulationRequest): Promise<SimulationResponse> {
    const requestId = randomUUID();
    return new Promise<SimulationResponse>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      const envelope: WorkerEnvelope<SimulationRequest> = {
        requestId,
        payload: request,
      };
      this.worker.postMessage(envelope);
    });
  }

  async dispose(): Promise<void> {
    await this.worker.terminate();
  }
}
