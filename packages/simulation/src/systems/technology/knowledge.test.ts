import { describe, expect, it } from "vitest";
import { createTechnologyState, setDomainKnowledge } from "@first-cause/entities";
import { createWorldRng, type RngStream } from "../../core/rng.js";
import { accumulateRegionalKnowledge } from "./knowledge.js";

function testRng(seed: string): RngStream {
  return createWorldRng(seed).stream("discovery");
}

describe("accumulateRegionalKnowledge", () => {
  it("increases knowledge by exactly the rounded gain (population chosen so the gain is a whole number, no stochastic rounding involved)", () => {
    const technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    // przyrost = 0.5 * (1 + 5000/5000) = dokładnie 1.
    const result = accumulateRegionalKnowledge({
      technologyState,
      domainIds: ["agriculture_food"],
      population: 5000,
      rng: testRng("knowledge-exact"),
    });

    expect(result.technologyState.knowledge.agriculture_food).toBe(1);
    expect(result.facts).toEqual([
      {
        type: "knowledge_increased",
        subject: { entityType: "knowledge_domain", entityId: "agriculture_food" },
        location: { regionId: "r1" },
        values: { before: 0, after: 1, delta: 1 },
      },
    ]);
  });

  it("grows faster in a more populous region (same starting state, larger population)", () => {
    const base = createTechnologyState({ id: "t1", regionId: "r1" });
    // przyrost = 0.5 * (1 + 45000/5000) = dokładnie 5.
    const populous = accumulateRegionalKnowledge({
      technologyState: base,
      domainIds: ["agriculture_food"],
      population: 45000,
      rng: testRng("knowledge-populous"),
    });
    const sparse = accumulateRegionalKnowledge({
      technologyState: base,
      domainIds: ["agriculture_food"],
      population: 5000,
      rng: testRng("knowledge-sparse"),
    });

    expect(populous.technologyState.knowledge.agriculture_food).toBeGreaterThan(
      sparse.technologyState.knowledge.agriculture_food ?? 0,
    );
  });

  it("clamps at 100 and does not emit a fact when the level does not move", () => {
    const atCap = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      100,
    );
    const result = accumulateRegionalKnowledge({
      technologyState: atCap,
      domainIds: ["agriculture_food"],
      population: 5_000_000, // przekroczyłoby 100 bez clamp
      rng: testRng("knowledge-clamp"),
    });

    expect(result.technologyState.knowledge.agriculture_food).toBe(100);
    expect(result.facts).toEqual([]);
  });

  it("accumulates independently per domain, processed in sorted order", () => {
    const technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    const result = accumulateRegionalKnowledge({
      technologyState,
      domainIds: ["science_society", "agriculture_food"],
      population: 5000,
      rng: testRng("knowledge-multi-domain"),
    });

    expect(result.technologyState.knowledge.agriculture_food).toBe(1);
    expect(result.technologyState.knowledge.science_society).toBe(1);
    expect(result.facts.map((f) => f.subject.entityId)).toEqual([
      "agriculture_food",
      "science_society",
    ]);
  });
});
