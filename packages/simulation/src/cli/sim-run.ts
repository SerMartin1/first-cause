#!/usr/bin/env node
/**
 * Headless entry point: `pnpm sim:run`.
 *
 * Technology Stack Decision SS49 requires `packages/simulation` to be
 * runnable without Electron/the desktop app. M0 does not have a real
 * simulation yet, so this only proves the headless path exists and
 * reports the same CoreStatus the worker would return over IPC.
 */
import { createSimulationRequestHandler } from "../protocol-handler.js";

const handleRequest = createSimulationRequestHandler(Date.now());
const status = handleRequest({ type: "GET_CORE_STATUS" });

console.log("[first-cause] Simulation Core -- headless status check");
console.log(JSON.stringify(status, null, 2));
console.log(
  "\nM0 foundation only: no world, tick, or gameplay simulation exists yet (see M1 onward).",
);
