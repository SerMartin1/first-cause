import { describe, expect, it } from "vitest";
import { explainWhy } from "./why-query.js";
import type { CausalEdge } from "./causal-edge.js";
import type { SimulationFact } from "./fact.js";

function fact(id: string, tick: number, type = "test_fact", architect?: SimulationFact["architect"]): SimulationFact {
  return {
    id,
    tick,
    type,
    subject: { entityType: "region", entityId: "region_a" },
    location: { regionId: "region_a" },
    values: { before: undefined, after: undefined },
    ...(architect ? { architect } : {}),
  };
}

function edge(
  id: string,
  sourceFactId: string,
  targetFactId: string,
  contribution: number,
  overrides: Partial<CausalEdge> = {},
): CausalEdge {
  return {
    id,
    sourceFactId,
    targetFactId,
    type: "CONTRIBUTING",
    strength: Math.abs(contribution),
    contribution,
    mechanism: "test-mechanism",
    system: "test-system",
    variable: "test_variable",
    ...overrides,
  };
}

describe("explainWhy (CE-08, M18)", () => {
  it("WHY? Immediate (Level 1): splits positive causes into primary/significant and negative causes into limitingFactors", () => {
    const target = fact("fact_target", 5);
    const strongPositive = fact("fact_strong", 3);
    const weakPositive = fact("fact_weak", 4);
    const negative = fact("fact_negative", 4);
    const edges: CausalEdge[] = [
      edge("edge_1", strongPositive.id, target.id, 0.7, { variable: "supply" }),
      edge("edge_2", weakPositive.id, target.id, 0.35, { variable: "demand" }),
      edge("edge_3", negative.id, target.id, -0.4, { variable: "housing_cost" }),
    ];

    const result = explainWhy({
      targetFactId: target.id,
      facts: [strongPositive, weakPositive, negative, target],
      edges,
    });

    expect(result.primaryCauses.map((c) => c.factId)).toEqual([strongPositive.id]);
    expect(result.significantCauses.map((c) => c.factId)).toEqual([weakPositive.id]);
    expect(result.limitingFactors.map((c) => c.factId)).toEqual([negative.id]);
    expect(result.limitingFactors[0]!.contribution).toBe(-0.4);
  });

  it("WHY? noise test: trivial (TRACE-band) positive causes never appear, even though the edge is real", () => {
    const target = fact("fact_target", 2);
    const trivial = fact("fact_trivial", 1);
    const edges: CausalEdge[] = [edge("edge_1", trivial.id, target.id, 0.02)];

    const result = explainWhy({ targetFactId: target.id, facts: [trivial, target], edges });

    expect(result.primaryCauses).toHaveLength(0);
    expect(result.significantCauses).toHaveLength(0);
  });

  it("WHY? Chain (Level 2): deeperPaths reaches one hop further back from an immediate cause, with Duplicate Path Suppression", () => {
    const root = fact("fact_root", 0);
    const cause = fact("fact_cause", 1);
    const target = fact("fact_target", 2);
    const edges: CausalEdge[] = [
      edge("edge_root_cause_a", root.id, cause.id, 0.8, { mechanism: "root-mechanism" }),
      // duplicate path sharing the same root+mechanism -- must collapse to one deeperPath, keeping the stronger.
      edge("edge_root_cause_b", root.id, cause.id, 0.5, { mechanism: "root-mechanism" }),
      edge("edge_cause_target", cause.id, target.id, 0.9, { variable: "primary" }),
    ];

    const result = explainWhy({
      targetFactId: target.id,
      facts: [root, cause, target],
      edges,
    });

    expect(result.primaryCauses.map((c) => c.factId)).toEqual([cause.id]);
    expect(result.deeperPaths).toHaveLength(1);
    expect(result.deeperPaths[0]!.rootFactId).toBe(root.id);
    // stronger of the two duplicate paths (0.8) wins, not the weaker (0.5).
    expect(result.deeperPaths[0]!.totalStrength).toBeCloseTo(0.8 * 0.9);
  });

  it("architectConnections surfaces a direct Root Fact reached within the computed chain", () => {
    const rootIntervention = fact("fact_root", 0, "resource_discovered", {
      interventionId: "intervention_1",
      influenceStrength: 1,
    });
    const cause = fact("fact_cause", 1);
    const target = fact("fact_target", 2);
    const edges: CausalEdge[] = [
      edge("edge_1", rootIntervention.id, cause.id, 0.8),
      edge("edge_2", cause.id, target.id, 0.9),
    ];

    const result = explainWhy({
      targetFactId: target.id,
      facts: [rootIntervention, cause, target],
      edges,
    });

    const connection = result.architectConnections.find((c) => c.factId === rootIntervention.id);
    expect(connection).toBeDefined();
    expect(connection!.interventionId).toBe("intervention_1");
    expect(connection!.influenceStrength).toBe(1);
  });

  it("determinism: the same graph always produces the same explanation, in the same order", () => {
    const target = fact("fact_target", 3);
    const a = fact("fact_a", 1);
    const b = fact("fact_b", 2);
    const edges: CausalEdge[] = [
      edge("edge_a", a.id, target.id, 0.65),
      edge("edge_b", b.id, target.id, 0.4),
    ];
    const facts = [a, b, target];

    const first = explainWhy({ targetFactId: target.id, facts, edges });
    const second = explainWhy({ targetFactId: target.id, facts, edges });

    expect(first).toEqual(second);
  });

  it("unknown target fact returns an empty-but-well-formed explanation instead of throwing", () => {
    const result = explainWhy({ targetFactId: "fact_missing", facts: [], edges: [] });
    expect(result.primaryCauses).toHaveLength(0);
    expect(result.significantCauses).toHaveLength(0);
    expect(result.limitingFactors).toHaveLength(0);
    expect(result.confidence).toBe(0);
    expect(result.summary).toBe("fact_missing");
  });
});
