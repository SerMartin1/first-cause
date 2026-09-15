import type { AppInfo } from "./app-info.js";
import type { CoreStatus, PongResponse } from "./simulation-protocol.js";

/**
 * Shape of the typed bridge the preload script exposes on
 * `window.firstCause`. Deliberately narrow and named-method-only (SS37):
 * never a generic `sendAnything()` / `execute()`.
 */
export interface FirstCauseApi {
  getAppInfo(): AppInfo;
  pingSimulation(): Promise<PongResponse>;
  getSimulationCoreStatus(): Promise<CoreStatus>;
}
