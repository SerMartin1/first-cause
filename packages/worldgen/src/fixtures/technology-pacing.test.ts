import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTechnologyState, type TechnologyState } from "@first-cause/entities";
import {
  accumulateRegionalKnowledge,
  createWorldRng,
  evaluateBreakthroughs,
  growAvailability,
  updateEligibility,
} from "@first-cause/simulation";
import { loadEconomyContent } from "../content/load-economy-content.js";

/**
 * Pasma docelowe tempa technologii (decyzja właściciela 2026-09-26,
 * Roadmap v0.6 „Technology pacing”): kryteria testu, nie zakodowane daty.
 * Izolowany region o stałej populacji, produkcyjne funkcje pipeline'u M15 i
 * prawdziwe reguły 125 odkryć z contentu. Region izolowany jest dolnym
 * oszacowaniem -- dyfuzja w połączonym świecie tylko przyspiesza odkrycia.
 */
const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../..");
const content = loadEconomyContent(REPO_ROOT);
const rules = content.discoveryEligibilityRulesById;

function highestKnownTier(state: TechnologyState): number {
  let tier = -1;
  for (const [id, entry] of Object.entries(state.discoveries))
    if (entry.status !== "UNKNOWN") tier = Math.max(tier, rules[id]?.tier ?? -1);
  return tier;
}

/** Rok (od startu), w którym po raz pierwszy odkryto każdy tier; `tierAt200` = najwyższy tier po 200 latach. */
function simulate(population: number, seed: string) {
  const rng = createWorldRng(seed).stream("discovery", "pacing");
  let state = createTechnologyState({ id: "t", regionId: "r" });
  const firstYearOfTier: Record<number, number> = {};
  for (let tick = 1; tick <= 200 * 12; tick++) {
    state = accumulateRegionalKnowledge({
      technologyState: state,
      domainIds: content.knowledgeDomainIds,
      population,
      rng,
    }).technologyState;
    state = updateEligibility(state, rules).technologyState;
    const breakthroughs = evaluateBreakthroughs({ technologyState: state, regionId: "r", tick, rng });
    state = breakthroughs.technologyState;
    for (const fact of breakthroughs.facts) {
      const tier = rules[fact.subject.entityId]!.tier;
      firstYearOfTier[tier] ??= tick / 12;
    }
    state = growAvailability(state, {}).technologyState;
  }
  return { tierAt200: highestKnownTier(state), firstYearOfTier };
}

const SEEDS = ["pacing-a", "pacing-b"];

describe("technology pacing target bands (200-year VS horizon)", () => {
  it("an isolated settlement (≤100 people) stays within T0–T2", () => {
    for (const seed of SEEDS) {
      expect(simulate(20, seed).tierAt200).toBeLessThanOrEqual(2);
      expect(simulate(100, seed).tierAt200).toBeLessThanOrEqual(2);
    }
  });

  it("~2,000 people reach T3–T4 after 200 years", () => {
    for (const seed of SEEDS) {
      const { tierAt200 } = simulate(2_000, seed);
      expect(tierAt200).toBeGreaterThanOrEqual(3);
      expect(tierAt200).toBeLessThanOrEqual(4);
    }
  });

  it("~20,000 people reach T5 after 200 years", () => {
    for (const seed of SEEDS) expect(simulate(20_000, seed).tierAt200).toBe(5);
  });

  it("a large civilization (200,000) reaches T6 in roughly 100–180 years", () => {
    for (const seed of SEEDS) {
      const year = simulate(200_000, seed).firstYearOfTier[6];
      expect(year).toBeDefined();
      expect(year!).toBeGreaterThanOrEqual(100);
      expect(year!).toBeLessThanOrEqual(180);
    }
  });
});
