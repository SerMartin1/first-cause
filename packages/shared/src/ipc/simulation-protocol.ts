/**
 * Typed contract for the IPC channel between the React renderer and the
 * Simulation Worker (via the Electron main process).
 *
 * M0 scope: PING/PONG and GET_CORE_STATUS only. No gameplay/simulation
 * semantics exist yet -- this only proves the full request/response path:
 * React -> preload -> Electron main -> Simulation Worker -> Electron main
 * -> preload -> React.
 */

export const SIMULATION_IPC_CHANNEL = "first-cause:simulation" as const;

export interface PingRequest {
  readonly type: "PING";
}

export interface PongResponse {
  readonly type: "PONG";
  readonly receivedAt: number;
}

export interface GetCoreStatusRequest {
  readonly type: "GET_CORE_STATUS";
}

export interface CoreStatus {
  readonly type: "CORE_STATUS";
  readonly workerOnline: true;
  readonly engineVersion: string;
  readonly startedAt: number;
  readonly uptimeMs: number;
}

/** Requests the renderer/main process may send to the Simulation Worker. */
export type SimulationRequest = PingRequest | GetCoreStatusRequest;

/** Responses the Simulation Worker may send back. */
export type SimulationResponse = PongResponse | CoreStatus;

/** Maps each request type to its corresponding response type. */
export type SimulationResponseFor<TRequest extends SimulationRequest> =
  TRequest extends PingRequest
    ? PongResponse
    : TRequest extends GetCoreStatusRequest
      ? CoreStatus
      : never;

/**
 * Envelope used internally between the Electron main process and the
 * worker_threads Simulation Worker, so multiple in-flight requests can be
 * correlated to their responses. Not exposed to the renderer.
 */
export interface WorkerEnvelope<T> {
  readonly requestId: string;
  readonly payload: T;
}

export interface WorkerErrorEnvelope {
  readonly requestId: string;
  readonly error: string;
}
