import { contextBridge, ipcRenderer } from "electron";
import type { WorldApi } from "@first-cause/simulation";
import {
  SIMULATION_IPC_CHANNEL,
  type AppInfo,
  type CoreStatus,
  type FirstCauseApi,
  type PongResponse,
} from "@first-cause/shared";

/**
 * Minimal typed bridge exposed to the renderer as `window.firstCause`.
 *
 * Deliberately narrow (M0 SS37): named, typed methods only -- never a
 * generic `sendAnything()` / `execute()` / `runArbitraryCommand()`.
 * The renderer never gets direct access to `ipcRenderer`, Node, or the
 * file system.
 */
const firstCauseApi: FirstCauseApi = {
  getAppInfo(): AppInfo {
    return {
      appVersion: process.env["npm_package_version"] ?? "0.0.0",
      engineVersion: "0.0.0-m0",
      environment:
        process.env["NODE_ENV"] === "production" ? "production" : "development",
      platform: process.platform,
    };
  },

  async pingSimulation(): Promise<PongResponse> {
    return ipcRenderer.invoke(SIMULATION_IPC_CHANNEL, { type: "PING" });
  },

  async getSimulationCoreStatus(): Promise<CoreStatus> {
    return ipcRenderer.invoke(SIMULATION_IPC_CHANNEL, {
      type: "GET_CORE_STATUS",
    });
  },
};

contextBridge.exposeInMainWorld("firstCause", firstCauseApi);
const worldApi: WorldApi = {
  getWorld: (years, tick) =>
    ipcRenderer.invoke("first-cause:world", {
      type: "GET_WORLD",
      years,
      ...(tick === undefined ? {} : { tick }),
    }),
  setSpeed: (speed) =>
    ipcRenderer.invoke("first-cause:world", { type: "SET_WORLD_SPEED", speed }),
  step: (ticks) => ipcRenderer.invoke("first-cause:world", { type: "STEP_WORLD", ticks }),
  explain: (factId, tick, context) =>
    ipcRenderer.invoke("first-cause:world", {
      type: "GET_WORLD_WHY",
      factId,
      ...(context ? { context } : {}),
      ...(tick === undefined ? {} : { tick }),
    }),
};
contextBridge.exposeInMainWorld("firstCauseWorld", worldApi);
