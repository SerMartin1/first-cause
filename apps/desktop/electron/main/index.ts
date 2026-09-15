import { join } from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { SIMULATION_IPC_CHANNEL, type SimulationRequest } from "@first-cause/shared";
import { SimulationBridge } from "./simulation-bridge.js";

/**
 * Electron main process -- M0 scope.
 *
 * Owns: window lifecycle, the Simulation Worker, and the one typed IPC
 * channel the renderer is allowed to call. Never renders UI, never
 * simulates gameplay.
 */

let simulationBridge: SimulationBridge | null = null;

function createSimulationBridge(): SimulationBridge {
  const workerPath = require.resolve("@first-cause/simulation/worker");
  return new SimulationBridge(workerPath);
}

function registerSimulationIpcHandler(bridge: SimulationBridge): void {
  ipcMain.handle(SIMULATION_IPC_CHANNEL, async (_event, request: SimulationRequest) =>
    bridge.invoke(request),
  );
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  const rendererDevServerUrl = process.env["ELECTRON_RENDERER_URL"];
  if (rendererDevServerUrl) {
    void window.loadURL(rendererDevServerUrl);
  } else {
    void window.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return window;
}

void app.whenReady().then(() => {
  simulationBridge = createSimulationBridge();
  registerSimulationIpcHandler(simulationBridge);

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

let shutdownStarted = false;
let shutdownComplete = false;
app.on("before-quit", (event) => {
  if (!simulationBridge || shutdownComplete) return;
  event.preventDefault();
  if (shutdownStarted) return;
  shutdownStarted = true;
  ipcMain.removeHandler(SIMULATION_IPC_CHANNEL);
  void simulationBridge
    .dispose()
    .catch((error: unknown) => {
      console.error("Simulation Worker shutdown failed", error);
    })
    .finally(() => {
      shutdownComplete = true;
      app.quit();
    });
});
