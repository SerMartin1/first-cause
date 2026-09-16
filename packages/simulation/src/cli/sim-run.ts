#!/usr/bin/env node
/**
 * Headless entry point: `pnpm sim:run`.
 *
 * Technology Stack Decision SS49 requires `packages/simulation` to be
 * runnable without Electron/the desktop app.
 */
import { createSimulationRequestHandler } from "../protocol-handler.js";
import { createHeadlessRunner } from "../core/index.js";

const handleRequest = createSimulationRequestHandler(Date.now());
const status = handleRequest({ type: "GET_CORE_STATUS" });

console.log("[first-cause] Simulation Core -- headless status check");
console.log(JSON.stringify(status, null, 2));

// M1 Deterministic Core demo: no World State or gameplay systems exist
// yet (M3+); this only proves the tick/RNG/checksum skeleton those
// systems will run inside is real and reproducible headless.
const DEMO_TICKS = 12;
const runner = createHeadlessRunner({ worldSeed: "sim-run-demo", startYear: 1200 });
runner.runTicks(DEMO_TICKS);

console.log(`\n[first-cause] Deterministic Core -- ${DEMO_TICKS}-tick headless demo`);
console.log(
  JSON.stringify(
    { tick: runner.tick, date: runner.date, checksum: runner.checksum() },
    null,
    2,
  ),
);
console.log(
  "\nM1 foundation only: no World State, entities, or content exist yet (see M2 onward).",
);
