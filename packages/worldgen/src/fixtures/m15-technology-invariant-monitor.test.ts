import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { WorldState } from "@first-cause/entities";
import {
  computeEligibleDiscoveryIds,
  createWorldRng,
  runEconomyTick,
} from "@first-cause/simulation";
import { buildTechnologyTestWorld } from "./technology-fixture.js";
import { loadEconomyContent } from "../content/load-economy-content.js";

const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);

const STATUS_RANK: Readonly<Record<string, number>> = {
  UNKNOWN: 0,
  KNOWN: 1,
  AVAILABLE: 2,
  ADOPTED: 3,
};

/**
 * Wieloticzkowy monitor niezmienników M15 (wzorzec:
 * `m12-m14-invariant-monitor.test.ts`), na 3 niezależnych seedach RNG,
 * 120 ticków, przeciwko REALNEMU katalogowi 125 odkryć
 * (`loadEconomyContent`) -- nie syntetycznemu fixture'owi contentu.
 * Świat sam jest syntetyczny (`buildTechnologyTestWorld`), bo Black
 * Mountain nie linkuje dziś swoich regionów do TechnologyState (patrz
 * `technology-fixture.ts`'s doc comment).
 *
 * Sprawdzane WYŁĄCZNIE twarde niezmienniki (nigdy legalnie
 * nienaruszalne, nie tylko "typowe" zachowanie):
 * - `discoveries[id].status` nigdy się nie cofa
 *   (`UNKNOWN < KNOWN < AVAILABLE < ADOPTED`).
 * - `eligibleDiscoveryIds` jest zawsze poprawnym podzbiorem świeżego
 *   `computeEligibleDiscoveryIds` na bieżącym stanie -- NIE identycznym
 *   zbiorem: cache jest liczony w połowie ticka (przed breakthroughs), więc
 *   discovery odblokowane W TYM SAMYM ticku (jako prerequisite nowo-KNOWN
 *   discovery) pojawi się w cache dopiero następny tick. To gwarantowane
 *   przez monotoniczność wiedzy/statusu (nigdy się nie cofają) -- coś
 *   eligible w chwili liczenia cache pozostaje eligible później.
 * - `knowledge[domainId]` w `[0, 100]`.
 * - `availability`/`industryAdoption`/`populationAccess`/
 *   `institutionalAdoption` w `[0, 1]`.
 * - discovery nigdy `AVAILABLE`/`ADOPTED` bez wcześniejszego przejścia
 *   przez `KNOWN` (wynika z monotoniczności statusu, ale sprawdzone
 *   też wprost dla czytelności).
 */
describe("m15-technology-invariant-monitor (syntetyczny świat + realny katalog 125 odkryć)", () => {
  const SEEDS = [
    "m15-invariant-monitor-seed-a",
    "m15-invariant-monitor-seed-b",
    "m15-invariant-monitor-seed-c",
  ];
  const TICKS = 120;

  it.each(SEEDS)("m15_multiseed_120_ticks_with_invariant_monitor (seed: %s)", (seed) => {
    const content = loadEconomyContent(REPO_ROOT);
    expect(content.ok).toBe(true);

    let worldState: WorldState = buildTechnologyTestWorld();
    const rng = createWorldRng(seed);

    const priorStatusRankByKey = new Map<string, number>();

    for (let tick = 0; tick < TICKS; tick++) {
      const result = runEconomyTick({
        worldState,
        tick,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
        discoveryRng: (scopeId) => rng.stream("discovery", scopeId),
        discoveryEligibilityRulesById: content.discoveryEligibilityRulesById,
        knowledgeDomainIds: content.knowledgeDomainIds,
      });
      worldState = result.worldState;

      for (const technologyState of Object.values(worldState.technologyStates)) {
        // knowledge w [0, 100]
        for (const [domainId, level] of Object.entries(technologyState.knowledge)) {
          expect(
            level,
            `tick ${tick}: ${technologyState.id}.knowledge[${domainId}] must be in [0, 100]`,
          ).toBeGreaterThanOrEqual(0);
          expect(level).toBeLessThanOrEqual(100);
        }

        // eligibleDiscoveryIds jako podzbiór świeżego przeliczenia (patrz doc comment wyżej)
        const recomputed = new Set(
          computeEligibleDiscoveryIds(technologyState, content.discoveryEligibilityRulesById),
        );
        for (const discoveryId of technologyState.eligibleDiscoveryIds) {
          expect(
            recomputed.has(discoveryId),
            `tick ${tick}: ${technologyState.id}.eligibleDiscoveryIds contains "${discoveryId}", which a fresh recompute no longer considers eligible (should be impossible -- eligibility is monotonic)`,
          ).toBe(true);
        }

        for (const [discoveryId, adoption] of Object.entries(technologyState.discoveries)) {
          // osie 0..1
          for (const [axisName, value] of [
            ["availability", adoption.availability],
            ["industryAdoption", adoption.industryAdoption],
            ["populationAccess", adoption.populationAccess],
            ["institutionalAdoption", adoption.institutionalAdoption],
          ] as const) {
            expect(
              value,
              `tick ${tick}: ${technologyState.id}.discoveries[${discoveryId}].${axisName} must be in [0, 1]`,
            ).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
          }

          // status monotonicznie do przodu
          const key = `${technologyState.id}:${discoveryId}`;
          const rank = STATUS_RANK[adoption.status]!;
          const priorRank = priorStatusRankByKey.get(key) ?? 0;
          expect(
            rank,
            `tick ${tick}: ${key}.status must never regress (was rank ${priorRank}, now ${rank})`,
          ).toBeGreaterThanOrEqual(priorRank);
          priorStatusRankByKey.set(key, rank);

          // AVAILABLE/ADOPTED implikuje przejście przez KNOWN
          if (adoption.status === "AVAILABLE" || adoption.status === "ADOPTED") {
            expect(
              adoption.discoveredTick,
              `tick ${tick}: ${key} is ${adoption.status} but has no discoveredTick (never went through KNOWN)`,
            ).toBeDefined();
          }
        }
      }
    }
  });
});
