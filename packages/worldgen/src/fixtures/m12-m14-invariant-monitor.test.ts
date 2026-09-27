import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { WorldState } from "@first-cause/entities";
import {
  createWorldRng,
  eligibleLaborForce,
  runEconomyTick,
  SETTLEMENT_STAGE_ORDER,
} from "@first-cause/simulation";
import { loadWorldFixture } from "./load-world-fixture.js";
import { loadEconomyContent } from "../content/load-economy-content.js";

const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);

function readBlackMountainFixture(): unknown {
  const filePath = path.join(
    REPO_ROOT,
    "tests/worldgen/fixtures/black_mountain_reference.json",
  );
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

const EPSILON = 1e-6; // stochastic rounding / floating point slack, not a real tolerance for the invariant itself

/**
 * Audytowa propozycja `m12_m14_multiseed_120_ticks_with_invariant_monitor`
 * (L4/L5): audyt sam uruchomił 120 ticków Black Mountain z prawdziwym
 * contentem ręcznie, poza repo, i znalazł naruszenia zatrudnienia mimo
 * "PASS bez wyjątku" -- "Nie jest to PASS inwariantów" (audyt §4).
 * Ten monitor odtwarza dokładnie te sprawdzenia jako commitowany test,
 * na 3 niezależnych seedach (RNG strumieni demografii/migracji, nie
 * `worldState.world.seed` z fixture'u -- ten zostaje jako identity pola).
 *
 * Sprawdzane inwarianty (dobrane tak, by były PRAWDZIWE inwariantami --
 * nigdy legalnie nienaruszalne -- nie tylko "typowym" zachowaniem):
 * - P0-05a: `cohort.employment <= eligibleLaborForce(cohort)`.
 * - P0-05b: suma `Company.workforce.employees` (aktywnych firm) regionu
 *   nie przekracza sumy `eligibleLaborForce` regionu.
 * - P1-04: `World.currentTick` idzie dokładnie o 1 do przodu co wywołanie.
 * - `Settlement.housing.capacity` nigdy nie maleje (housing.ts's własny,
 *   udokumentowany niezmiennik -- "nikt nie rozbiera domów").
 * - `Settlement.stage` przesuwa się co najwyżej o jeden szczebel drabiny
 *   na tick (SET-001/FC-SETTLEMENT-002).
 *
 * ŚWIADOMIE NIE sprawdzane: `population <= housing.capacity` jako twardy
 * globalny niezmiennik -- to byłby BŁĘDNY test. Przeludnienie ponad
 * capacity jest legalnym, zamierzonym stanem (`computeHousingPressure`,
 * Urban Crisis, FC-SETTLEMENT-003) -- migracja (P0-04) blokuje tylko
 * NOWY napływ do pełnej osady, demografia (urodzenia) może wciąż
 * stopniowo przekroczyć capacity organicznie. Mylenie tych dwóch
 * rzeczy byłoby dokładnie tym błędem, przed którym ostrzega audyt.
 */
describe("Black Mountain fixture -- M12-M14 multi-seed 120-tick invariant monitor (audit remediation, Etap 11)", () => {
  const SEEDS = [
    "invariant-monitor-seed-a",
    "invariant-monitor-seed-b",
    "invariant-monitor-seed-c",
  ];
  const TICKS = 120;

  it.each(SEEDS)(
    "m12_m14_multiseed_120_ticks_with_invariant_monitor (seed: %s)",
    (seed) => {
      const content = loadEconomyContent(REPO_ROOT);
      expect(content.ok).toBe(true);

      const loaded = loadWorldFixture(readBlackMountainFixture());
      expect(loaded.ok).toBe(true);

      let worldState: WorldState = loaded.worldState!;
      const rng = createWorldRng(seed);

      const priorHousingCapacityBySettlementId = new Map<string, number>();
      const priorStageRankBySettlementId = new Map<string, number>();
      for (const settlement of Object.values(worldState.settlements)) {
        priorHousingCapacityBySettlementId.set(
          settlement.id,
          settlement.housing.capacity,
        );
        priorStageRankBySettlementId.set(
          settlement.id,
          SETTLEMENT_STAGE_ORDER.indexOf(settlement.stage),
        );
      }

      for (let tick = 0; tick < TICKS; tick++) {
        const result = runEconomyTick({
          worldState,
          tick,
          demographyRng: (scopeId) => rng.stream("demography", scopeId),
          migrationRng: (scopeId) => rng.stream("migration", scopeId),
          productionRecipesByMethodId: content.productionRecipesByMethodId,
          transportModeProfilesByModeId: content.transportModeProfilesByModeId,
          entrepreneurshipCandidatesByArchetypeId:
            content.entrepreneurshipCandidatesByArchetypeId,
        });
        worldState = result.worldState;

        // P1-04
        expect(worldState.world.currentTick, `tick ${tick}: World.currentTick`).toBe(
          tick + 1,
        );

        // P0-05a
        const eligibleByRegionId = new Map<string, number>();
        for (const cohort of Object.values(worldState.populationCohorts)) {
          // Populacja to całe osoby (POP-001) -- ułamek wyciekał kiedyś z
          // ułamkowego `housing.capacity` przez limit migracji.
          expect(
            Number.isInteger(cohort.population),
            `tick ${tick}: cohort "${cohort.id}".population must be an integer, got ${cohort.population}`,
          ).toBe(true);
          const eligible = eligibleLaborForce(cohort);
          expect(
            cohort.employment,
            `tick ${tick}: cohort "${cohort.id}".employment must not exceed its own eligibleLaborForce`,
          ).toBeLessThanOrEqual(eligible + EPSILON);
          eligibleByRegionId.set(
            cohort.regionId,
            (eligibleByRegionId.get(cohort.regionId) ?? 0) + eligible,
          );
        }

        // P0-05b
        const employeesByRegionId = new Map<string, number>();
        for (const company of Object.values(worldState.companies)) {
          if (!company.status.active) continue;
          employeesByRegionId.set(
            company.regionId,
            (employeesByRegionId.get(company.regionId) ?? 0) +
              company.workforce.employees,
          );
        }
        for (const [regionId, employees] of employeesByRegionId) {
          expect(
            employees,
            `tick ${tick}: region "${regionId}"'s active company headcount must not exceed its eligibleLaborForce`,
          ).toBeLessThanOrEqual((eligibleByRegionId.get(regionId) ?? 0) + EPSILON);
        }

        // housing.capacity monotonicity + stage single-rung-per-tick
        for (const settlement of Object.values(worldState.settlements)) {
          const priorCapacity =
            priorHousingCapacityBySettlementId.get(settlement.id) ?? 0;
          expect(
            settlement.housing.capacity,
            `tick ${tick}: settlement "${settlement.id}".housing.capacity must never decrease`,
          ).toBeGreaterThanOrEqual(priorCapacity - EPSILON);
          priorHousingCapacityBySettlementId.set(
            settlement.id,
            settlement.housing.capacity,
          );

          const priorRank = priorStageRankBySettlementId.get(settlement.id) ?? 0;
          const nextRank = SETTLEMENT_STAGE_ORDER.indexOf(settlement.stage);
          expect(
            Math.abs(nextRank - priorRank),
            `tick ${tick}: settlement "${settlement.id}".stage must move at most one rung per tick`,
          ).toBeLessThanOrEqual(1);
          priorStageRankBySettlementId.set(settlement.id, nextRank);
        }
      }
    },
  );
});
