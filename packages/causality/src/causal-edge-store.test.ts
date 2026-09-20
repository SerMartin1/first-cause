import { describe, expect, it } from "vitest";
import { CausalEdgeStore, createCausalEdgeStore } from "./causal-edge-store.js";
import type { CausalEdgeInput } from "./causal-edge.js";
import { createFactStore } from "./fact-store.js";

const FACT_INPUT = {
  type: "resource_discovered",
  subject: { entityType: "resourceDeposit", entityId: "deposit_001" },
  location: { regionId: "region_001" },
  values: { before: "UNKNOWN", after: "DISCOVERED" },
} as const;

function edgeInput(overrides: Partial<CausalEdgeInput> = {}): CausalEdgeInput {
  return {
    sourceFactId: "fact_0_0",
    targetFactId: "fact_1_0",
    type: "CONTRIBUTING",
    strength: 0.8,
    contribution: 0.8,
    mechanism: "test mechanism",
    system: "test",
    variable: "test_variable",
    ...overrides,
  };
}

describe("CausalEdgeStore.add", () => {
  it("assigns a deterministic id and indexes incoming/outgoing", () => {
    const factStore = createFactStore();
    const a = factStore.emit(0, FACT_INPUT);
    const b = factStore.emit(1, FACT_INPUT);
    const store = createCausalEdgeStore();

    const edge = store.add(edgeInput({ sourceFactId: a.id, targetFactId: b.id }), a, b);

    expect(edge.id).toBe("edge_0");
    expect(store.outgoingByFact(a.id)).toEqual([edge]);
    expect(store.incomingByFact(b.id)).toEqual([edge]);
    expect(store.size).toBe(1);
  });

  it("rejects an edge to an earlier fact (temporal ordering, SS22)", () => {
    const factStore = createFactStore();
    const early = factStore.emit(0, FACT_INPUT);
    const late = factStore.emit(5, FACT_INPUT);
    const store = createCausalEdgeStore();

    expect(() =>
      store.add(edgeInput({ sourceFactId: late.id, targetFactId: early.id }), late, early),
    ).toThrow(RangeError);
  });

  it("rejects a self-loop", () => {
    const factStore = createFactStore();
    const fact = factStore.emit(0, FACT_INPUT);
    const store = createCausalEdgeStore();

    expect(() =>
      store.add(edgeInput({ sourceFactId: fact.id, targetFactId: fact.id }), fact, fact),
    ).toThrow(RangeError);
  });

  it("rejects mismatched fact/id arguments", () => {
    const factStore = createFactStore();
    const a = factStore.emit(0, FACT_INPUT);
    const b = factStore.emit(1, FACT_INPUT);
    const store = createCausalEdgeStore();

    expect(() =>
      store.add(edgeInput({ sourceFactId: "not_a.id", targetFactId: b.id }), a, b),
    ).toThrow(RangeError);
  });
});

describe("CausalEdgeStore.getState / fromState (M20)", () => {
  it("round-trips edges and rebuilds outgoing/incoming indices", () => {
    const factStore = createFactStore();
    const a = factStore.emit(0, FACT_INPUT);
    const b = factStore.emit(1, FACT_INPUT);
    const store = createCausalEdgeStore();
    const edge = store.add(edgeInput({ sourceFactId: a.id, targetFactId: b.id }), a, b);

    const restored = CausalEdgeStore.fromState(store.getState());
    expect(restored.all()).toEqual([edge]);
    expect(restored.outgoingByFact(a.id)).toEqual([edge]);
    expect(restored.incomingByFact(b.id)).toEqual([edge]);
    expect(restored.size).toBe(1);
  });

  it("a fresh add() after restore never reuses a restored id", () => {
    const factStore = createFactStore();
    const a = factStore.emit(0, FACT_INPUT);
    const b = factStore.emit(1, FACT_INPUT);
    const c = factStore.emit(2, FACT_INPUT);
    const store = createCausalEdgeStore();
    store.add(edgeInput({ sourceFactId: a.id, targetFactId: b.id }), a, b);
    const restored = CausalEdgeStore.fromState(store.getState());

    const next = restored.add(edgeInput({ sourceFactId: b.id, targetFactId: c.id }), b, c);
    expect(next.id).not.toBe("edge_0");
    expect(restored.size).toBe(2);
  });
});
