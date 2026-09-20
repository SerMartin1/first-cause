import { describe, expect, it } from "vitest";
import type { CausalEdge, SimulationFact } from "@first-cause/causality";
import { getInterventionConsequences, queryButterflyEffect } from "./butterfly.js";

function fact(id: string, tick: number, type = "test_fact"): SimulationFact {
  return {
    id,
    tick,
    type,
    subject: { entityType: "region", entityId: "region_a" },
    location: { regionId: "region_a" },
    values: { before: undefined, after: undefined },
  };
}

function edge(
  id: string,
  sourceFactId: string,
  targetFactId: string,
  strength: number,
  overrides: Partial<CausalEdge> = {},
): CausalEdge {
  return {
    id,
    sourceFactId,
    targetFactId,
    type: "CONTRIBUTING",
    strength,
    contribution: strength,
    mechanism: "test-mechanism",
    system: "test-system",
    variable: "test_variable",
    ...overrides,
  };
}

describe("queryButterflyEffect / getInterventionConsequences (M18)", () => {
  it("direct effects are exactly the depth-1 descendants of the root", () => {
    const root = fact("fact_root", 0);
    const direct = fact("fact_direct", 1);
    const secondOrder = fact("fact_second_order", 2);
    const facts = [root, direct, secondOrder];
    const edges: CausalEdge[] = [
      edge("edge_1", root.id, direct.id, 0.9),
      edge("edge_2", direct.id, secondOrder.id, 0.9),
    ];

    const result = queryButterflyEffect({ rootFactIds: [root.id], facts, edges });

    expect(result.directEffects.map((c) => c.factId)).toEqual([direct.id]);
    expect(result.directEffects[0]!.causalDepth).toBe(1);
  });

  it("influence decays with each hop and never amplifies", () => {
    const root = fact("fact_root", 0);
    const hop1 = fact("fact_hop1", 1);
    const hop2 = fact("fact_hop2", 2);
    const facts = [root, hop1, hop2];
    const edges: CausalEdge[] = [
      edge("edge_1", root.id, hop1.id, 0.9),
      edge("edge_2", hop1.id, hop2.id, 0.9),
    ];

    const result = queryButterflyEffect({ rootFactIds: [root.id], facts, edges });
    const consequence1 = [...result.majorConsequences, ...result.significantConsequences, ...result.minorConsequences].find(
      (c) => c.factId === hop1.id,
    )!;
    const consequence2 = [...result.majorConsequences, ...result.significantConsequences, ...result.minorConsequences].find(
      (c) => c.factId === hop2.id,
    );

    expect(consequence1.pathInfluence).toBeLessThan(1);
    expect(consequence1.pathInfluence).toBeGreaterThan(0);
    if (consequence2) {
      expect(consequence2.pathInfluence).toBeLessThan(consequence1.pathInfluence);
    }
  });

  it("anti-explosion: an unrelated fact reachable only through a different, independent chain never gets influence from this root", () => {
    const root = fact("fact_root", 0);
    const related = fact("fact_related", 1);
    const unrelatedSource = fact("fact_unrelated_source", 0);
    const unrelatedTarget = fact("fact_unrelated_target", 1);
    const facts = [root, related, unrelatedSource, unrelatedTarget];
    const edges: CausalEdge[] = [
      edge("edge_1", root.id, related.id, 0.9),
      edge("edge_2", unrelatedSource.id, unrelatedTarget.id, 0.9),
    ];

    const result = queryButterflyEffect({ rootFactIds: [root.id], facts, edges });
    const allConsequenceIds = [
      ...result.majorConsequences,
      ...result.significantConsequences,
      ...result.minorConsequences,
    ].map((c) => c.factId);

    expect(allConsequenceIds).toContain(related.id);
    expect(allConsequenceIds).not.toContain(unrelatedTarget.id);
  });

  it("anti-explosion: a very long chain of weak edges decays below the minimum-contribution threshold and stops propagating", () => {
    const facts: SimulationFact[] = [fact("fact_0", 0)];
    const edges: CausalEdge[] = [];
    for (let i = 1; i <= 15; i++) {
      facts.push(fact(`fact_${i}`, i));
      edges.push(edge(`edge_${i}`, `fact_${i - 1}`, `fact_${i}`, 0.5));
    }

    const result = queryButterflyEffect({ rootFactIds: ["fact_0"], facts, edges });
    const allConsequenceIds = [
      ...result.majorConsequences,
      ...result.significantConsequences,
      ...result.minorConsequences,
    ].map((c) => c.factId);

    // 0.5 per hop compounds well below the MINOR threshold long before hop 15.
    expect(allConsequenceIds).not.toContain("fact_15");
  });

  it("getInterventionConsequences reads rootFactIds off the intervention instance", () => {
    const root = fact("fact_root", 0);
    const direct = fact("fact_direct", 1);
    const facts = [root, direct];
    const edges: CausalEdge[] = [edge("edge_1", root.id, direct.id, 0.9)];

    const result = getInterventionConsequences({
      intervention: { rootFactIds: [root.id] },
      facts,
      edges,
    });

    expect(result.rootFactIds).toEqual([root.id]);
    expect(result.directEffects.map((c) => c.factId)).toEqual([direct.id]);
  });

  it("determinism: the same graph always produces the same ranked result", () => {
    const root = fact("fact_root", 0);
    const a = fact("fact_a", 1);
    const b = fact("fact_b", 1);
    const facts = [root, a, b];
    const edges: CausalEdge[] = [
      edge("edge_1", root.id, a.id, 0.8),
      edge("edge_2", root.id, b.id, 0.6),
    ];

    const first = queryButterflyEffect({ rootFactIds: [root.id], facts, edges });
    const second = queryButterflyEffect({ rootFactIds: [root.id], facts, edges });

    expect(first).toEqual(second);
  });
});
