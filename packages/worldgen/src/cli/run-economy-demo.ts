#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  buildCompanySummaryReadModel,
  buildMarketSummaryReadModel,
  createWorldRunner,
} from "@first-cause/simulation";
import { loadWorldFixture } from "../fixtures/load-world-fixture.js";
import { loadEconomyContent } from "../content/load-economy-content.js";

const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);

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
 *
 * Etap 3 (P0-06): receptury produkcji i koszty transportu pochodzą teraz z
 * realnego contentu na dysku (`content/productionMethods|transportModes/
 * *.json`, przez `loadEconomyContent`), nie z hardcoded domyślnych w
 * `economy-tick.ts`. M12: `entrepreneurshipCandidatesByArchetypeId` z
 * tego samego contentu (`companyArchetypes/*.json`) -- nowe firmy mogą
 * się zakładać w trakcie demo, nie tylko te z fixture'a.
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
const content = loadEconomyContent(REPO_ROOT);
if (!content.ok) {
  console.error("[first-cause] Content pack failed to load:", content.errors);
  process.exit(1);
}

// D1: stan początkowy walidowany względem receptur z contentu (World Generation Spec §22).
const loaded = loadWorldFixture(raw, {
  productionRecipesByMethodId: content.productionRecipesByMethodId,
});
if (!loaded.ok) {
  console.error("[first-cause] Fixture failed to load:", loaded.errors);
  process.exit(1);
}

const runner = createWorldRunner({
  worldSeed: loaded.worldState!.world.seed,
  startYear: loaded.worldState!.world.currentDate.year,
  startMonth: loaded.worldState!.world.currentDate.month,
  worldState: loaded.worldState!,
  productionRecipesByMethodId: content.productionRecipesByMethodId,
  transportModeProfilesByModeId: content.transportModeProfilesByModeId,
  entrepreneurshipCandidatesByArchetypeId:
    content.entrepreneurshipCandidatesByArchetypeId,
  discoveryEligibilityRulesById: content.discoveryEligibilityRulesById,
  knowledgeDomainIds: content.knowledgeDomainIds,
  requiredDiscoveryIdsByMethodId: content.requiredDiscoveryIdsByMethodId,
  pmCandidatesByCurrentMethodId: content.pmCandidatesByCurrentMethodId,
  resourceDiscoveryRulesByResourceId: content.resourceDiscoveryRulesByResourceId,
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
