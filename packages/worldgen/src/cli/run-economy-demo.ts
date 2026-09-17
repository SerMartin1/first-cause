#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildCompanySummaryReadModel,
  buildMarketSummaryReadModel,
  createWorldRunner,
} from "@first-cause/simulation";
import { loadWorldFixture } from "../fixtures/load-world-fixture.js";

/**
 * Headless demo: `pnpm --filter @first-cause/worldgen run demo:economy -- <fixture.json> [ticks]`.
 *
 * Manualny, przeglądalny dowód Etapu 1 (P0-01): ładuje DOWOLNY fixture
 * (ścieżka podana z zewnątrz -- World Generation Spec SS16/SS36/SS53
 * zabrania silnikowi znać identity jednego konkretnego scenariusza) i
 * odpala go przez `WorldRunner` (Simulation Core), wypisując stan każdej
 * firmy/rynku po drodze. Żyje w `worldgen`, nie w
 * `packages/simulation/src/cli/sim-run.ts` -- `simulation` nie zależy (i
 * nie powinien zależeć) od `worldgen` (brak cykli w grafie workspace
 * dependencies), więc miejsce, które zna OBA (jak załadować fixture i jak
 * go odpalić), jest tu.
 */
const fixturePath = process.argv[2];
if (!fixturePath) {
  console.error(
    "Usage: demo:economy -- <path-to-world-fixture.json> [ticks]\n" +
      "Point it at any World Fixture Document (Implementation Roadmap M4) -- e.g. one under tests/worldgen/fixtures/.",
  );
  process.exit(1);
}
const ticks = Number(process.argv[3] ?? 24);

const raw = JSON.parse(readFileSync(path.resolve(fixturePath), "utf-8"));
const loaded = loadWorldFixture(raw);
if (!loaded.ok) {
  console.error("[first-cause] Fixture failed to load:", loaded.errors);
  process.exit(1);
}

const runner = createWorldRunner({
  worldSeed: loaded.worldState!.world.seed,
  startYear: loaded.worldState!.world.currentDate.year,
  startMonth: loaded.worldState!.world.currentDate.month,
  worldState: loaded.worldState!,
});

console.log(`[first-cause] Etap 1 economy demo -- running ${ticks} ticks`);
for (let i = 0; i < ticks; i++) {
  runner.step();
}

const companies = Object.keys(runner.worldState.companies)
  .sort()
  .map((id) => buildCompanySummaryReadModel(runner.worldState, id));
const markets = Object.keys(runner.worldState.markets)
  .sort()
  .map((id) => buildMarketSummaryReadModel(runner.worldState, id));

console.log(
  JSON.stringify(
    { tick: runner.tick, factCount: runner.facts.length, companies, markets },
    null,
    2,
  ),
);
