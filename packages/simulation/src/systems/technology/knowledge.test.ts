import { describe, expect, it } from "vitest";
import { createTechnologyState, setDomainKnowledge } from "@first-cause/entities";
import { createWorldRng, type RngStream } from "../../core/rng.js";
import {
  accumulateRegionalKnowledge,
  KNOWLEDGE_GAIN_TODO_TUNING,
  knowledgeGainPerTick,
} from "./knowledge.js";

function testRng(seed: string): RngStream {
  return createWorldRng(seed).stream("discovery");
}

/** Populacja, przy której przyrost przy danej wiedzy wynosi `gain` (odwrócenie wzoru). */
function populationForGain(gain: number, knowledge = 0): number {
  const { ratePerTickAtReference, referencePopulation } = KNOWLEDGE_GAIN_TODO_TUNING;
  return referencePopulation * (gain / (ratePerTickAtReference * (1 - knowledge / 100))) ** 2;
}

describe("knowledgeGainPerTick (owner decision 2026-09-26: variant B + diminishing returns)", () => {
  it("is zero for an empty region -- nobody creates knowledge", () => {
    expect(knowledgeGainPerTick(0, 0)).toBe(0);
  });

  it("scales with the square root of population", () => {
    const base = knowledgeGainPerTick(20_000, 0);
    expect(base).toBeCloseTo(KNOWLEDGE_GAIN_TODO_TUNING.ratePerTickAtReference);
    expect(knowledgeGainPerTick(80_000, 0)).toBeCloseTo(base * 2);
    expect(knowledgeGainPerTick(200, 0)).toBeCloseTo(base / 10);
  });

  it("diminishes as knowledge grows: each further point is harder", () => {
    const fresh = knowledgeGainPerTick(20_000, 0);
    expect(knowledgeGainPerTick(20_000, 50)).toBeCloseTo(fresh / 2);
    expect(knowledgeGainPerTick(20_000, 100)).toBe(0);
  });
});

describe("accumulateRegionalKnowledge", () => {
  it("an empty region never gains knowledge and emits no facts", () => {
    const result = accumulateRegionalKnowledge({
      technologyState: createTechnologyState({ id: "t1", regionId: "r1" }),
      domainIds: ["agriculture_food"],
      population: 0,
      rng: testRng("knowledge-empty"),
    });
    expect(result.technologyState.knowledge.agriculture_food ?? 0).toBe(0);
    expect(result.facts).toEqual([]);
  });

  it("increments below a tier threshold silently (Causality §7: not an event)", () => {
    // Przyrost dokładnie 1 przy wiedzy 1: 1 -> 2, próg T1 = 4 nieprzekroczony.
    const technologyState = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      1,
    );
    const result = accumulateRegionalKnowledge({
      technologyState,
      domainIds: ["agriculture_food"],
      population: populationForGain(1, 1),
      rng: testRng("knowledge-exact"),
    });
    expect(result.technologyState.knowledge.agriculture_food).toBe(2);
    expect(result.facts).toEqual([]);
  });

  it("emits knowledge_increased only when a tier threshold is crossed", () => {
    // Próg T1 = 4: 3 -> 4 przekracza go.
    const technologyState = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      3,
    );
    const result = accumulateRegionalKnowledge({
      technologyState,
      domainIds: ["agriculture_food"],
      population: populationForGain(1, 3),
      rng: testRng("knowledge-threshold"),
    });
    expect(result.facts).toEqual([
      {
        type: "knowledge_increased",
        subject: { entityType: "knowledge_domain", entityId: "agriculture_food" },
        location: { regionId: "r1" },
        values: { before: 3, after: 4, delta: 1 },
      },
    ]);
  });

  it("grows faster in a more populous region (same starting state, larger population)", () => {
    const base = createTechnologyState({ id: "t1", regionId: "r1" });
    const run = (population: number, seed: string) => {
      let state = base;
      const rng = testRng(seed);
      for (let tick = 0; tick < 120; tick++)
        state = accumulateRegionalKnowledge({
          technologyState: state,
          domainIds: ["agriculture_food"],
          population,
          rng,
        }).technologyState;
      return state.knowledge.agriculture_food ?? 0;
    };
    expect(run(200_000, "knowledge-populous")).toBeGreaterThan(run(2_000, "knowledge-sparse"));
  });

  it("never exceeds 100", () => {
    const atCap = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      100,
    );
    const result = accumulateRegionalKnowledge({
      technologyState: atCap,
      domainIds: ["agriculture_food"],
      population: 10_000_000,
      rng: testRng("knowledge-cap"),
    });
    expect(result.technologyState.knowledge.agriculture_food).toBe(100);
    expect(result.facts).toEqual([]);
  });

  it("accumulates independently per domain, processed in sorted order", () => {
    const technologyState = setDomainKnowledge(
      setDomainKnowledge(
        createTechnologyState({ id: "t1", regionId: "r1" }),
        "agriculture_food",
        3,
      ),
      "science_society",
      3,
    );
    const result = accumulateRegionalKnowledge({
      technologyState,
      domainIds: ["science_society", "agriculture_food"],
      population: populationForGain(1, 3),
      rng: testRng("knowledge-multi-domain"),
    });

    expect(result.technologyState.knowledge.agriculture_food).toBe(4);
    expect(result.technologyState.knowledge.science_society).toBe(4);
    expect(result.facts.map((f) => f.subject.entityId)).toEqual([
      "agriculture_food",
      "science_society",
    ]);
  });
});
