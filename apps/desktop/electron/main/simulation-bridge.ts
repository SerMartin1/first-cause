import { randomUUID } from "node:crypto";
import { Worker } from "node:worker_threads";
import type { WorldRequest, WorldResponse } from "@first-cause/simulation";
import type {
  SimulationRequest,
  SimulationResponse,
  WorkerEnvelope,
  WorkerErrorEnvelope,
} from "@first-cause/shared";

type BridgeResponse = SimulationResponse | WorldResponse;
type WorkerMessage = WorkerEnvelope<BridgeResponse> | WorkerErrorEnvelope;

interface PendingRequest {
  readonly timer: ReturnType<typeof setTimeout>;
  readonly resolve: (response: BridgeResponse) => void;
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
  private state: "running" | "failed" | "disposed" = "running";
  private disposal: Promise<void> | undefined;
  private readonly worker: Worker;
  private readonly pending = new Map<string, PendingRequest>();

  constructor(workerPath: string, workerData?: unknown) {
    this.worker = new Worker(workerPath, { workerData });

    this.worker.on("message", (message: WorkerMessage) => {
      const pending = this.pending.get(message.requestId);
      if (!pending) {
        return;
      }
      this.pending.delete(message.requestId);
      clearTimeout(pending.timer);

      if (isErrorEnvelope(message)) {
        pending.reject(new Error(message.error));
      } else {
        pending.resolve(message.payload);
      }
    });

    this.worker.on("error", (error: Error) => {
      this.fail(error);
    });
    this.worker.on("exit", (code) => {
      this.fail(new Error(`Simulation Worker exited unexpectedly (code ${code})`));
    });
  }

  invoke(request: SimulationRequest | WorldRequest): Promise<BridgeResponse> {
    if (this.state !== "running") {
      return Promise.reject(new Error(`Simulation bridge is ${this.state}`));
    }
    const requestId = randomUUID();
    return new Promise<BridgeResponse>((resolve, reject) => {
      // Wall-clock IPC deadline, unrelated to simulated world time.
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error("Simulation request timed out after 10000 ms"));
      }, 10_000);
      this.pending.set(requestId, { resolve, reject, timer });
      const envelope: WorkerEnvelope<SimulationRequest | WorldRequest> = {
        requestId,
        payload: request,
      };
      try {
        this.worker.postMessage(envelope);
      } catch (error) {
        this.fail(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private rejectPending(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  private fail(error: Error): void {
    if (this.state !== "running") return;
    this.state = "failed";
    this.rejectPending(error);
  }

  dispose(): Promise<void> {
    if (this.disposal) return this.disposal;
    this.state = "disposed";
    this.rejectPending(new Error("Simulation bridge is disposed"));
    this.disposal = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.worker.unref();
        reject(new Error("Simulation Worker shutdown timed out after 5000 ms"));
      }, 5_000);
      Promise.resolve()
        .then(() => this.worker.terminate())
        .then(
          () => {
            clearTimeout(timer);
            resolve();
          },
          (error: unknown) => {
            clearTimeout(timer);
            this.worker.unref();
            reject(error);
          },
        );
    });
    return this.disposal;
  }
}
