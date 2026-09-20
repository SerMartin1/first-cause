import { describe, expect, it } from "vitest";
import { createCausalEdgeStore, createFactStore } from "@first-cause/causality";
import { resolveTickCausality } from "./causal-resolution.js";
import type { PendingCausalLink } from "./causal-links.js";

const BASE_FACT = {
  type: "price_changed",
  subject: { entityType: "good", entityId: "iron_ore" },
  location: { regionId: "region_001" },
  values: { before: 1, after: 1.1 },
} as const;

describe("resolveTickCausality", () => {
  it("creates one CausalEdge per resolvable link", () => {
    const factStore = createFactStore();
    const prior = factStore.emit(0, BASE_FACT);
    const emitted = factStore.emitAll(1, [BASE_FACT]);
    const edgeStore = createCausalEdgeStore();

    const links: PendingCausalLink[] = [
      {
        targetIndex: 0,
        source: { kind: "priorFact", factId: prior.id },
        type: "CONTRIBUTING",
        factor: { key: "supply_drop", contribution: 0.7 },
        mechanism: "test",
        system: "test",
      },
    ];

    const result = resolveTickCausality({
      emittedFacts: emitted,
      causalLinks: links,
      priorFactsById: new Map([[prior.id, prior]]),
      architectInfluenceByFactId: new Map(),
      edgeStore,
    });

    expect(edgeStore.size).toBe(1);
    const edge = edgeStore.all()[0]!;
    expect(edge.sourceFactId).toBe(prior.id);
    expect(edge.targetFactId).toBe(emitted[0]!.id);
    expect(edge.strength).toBeCloseTo(0.7, 10);
    expect(result.architectInfluenceByFactId.size).toBe(0); // no architect influence to propagate
  });

  it("resolves a sameBatch source against the emitted facts of the same tick", () => {
    const factStore = createFactStore();
    const emitted = factStore.emitAll(0, [BASE_FACT, { ...BASE_FACT, type: "shortage_started" }]);
    const edgeStore = createCausalEdgeStore();

    const links: PendingCausalLink[] = [
      {
        targetIndex: 1,
        source: { kind: "sameBatch", index: 0 },
        type: "TRIGGERING",
        factor: { key: "price_spike", contribution: 0.5 },
        mechanism: "test",
        system: "test",
      },
    ];

    resolveTickCausality({
      emittedFacts: emitted,
      causalLinks: links,
      priorFactsById: new Map(),
      architectInfluenceByFactId: new Map(),
      edgeStore,
    });

    expect(edgeStore.size).toBe(1);
    expect(edgeStore.all()[0]!.sourceFactId).toBe(emitted[0]!.id);
    expect(edgeStore.all()[0]!.targetFactId).toBe(emitted[1]!.id);
  });

  it("does not create an edge for an external source (no second fact to link)", () => {
    const factStore = createFactStore();
    const emitted = factStore.emitAll(0, [BASE_FACT]);
    const edgeStore = createCausalEdgeStore();

    const links: PendingCausalLink[] = [
      {
        targetIndex: 0,
        source: { kind: "external", key: "region_fertility" },
        type: "STRUCTURAL",
        factor: { key: "fertility", contribution: 0.3 },
        mechanism: "test",
        system: "test",
      },
    ];

    resolveTickCausality({
      emittedFacts: emitted,
      causalLinks: links,
      priorFactsById: new Map(),
      architectInfluenceByFactId: new Map(),
      edgeStore,
    });

    expect(edgeStore.size).toBe(0);
  });

  it("propagates Architect Influence one hop forward, decayed by edge strength and persistence", () => {
    const factStore = createFactStore();
    const rootFact = factStore.emit(0, {
      ...BASE_FACT,
      type: "resource_discovered",
      architect: { interventionId: "intervention_001", influenceStrength: 1 },
    });
    const emitted = factStore.emitAll(1, [BASE_FACT]);
    const edgeStore = createCausalEdgeStore();

    const links: PendingCausalLink[] = [
      {
        targetIndex: 0,
        source: { kind: "priorFact", factId: rootFact.id },
        type: "TRIGGERING",
        factor: { key: "new_deposit_active", contribution: 1 },
        mechanism: "test",
        system: "test",
      },
    ];

    const result = resolveTickCausality({
      emittedFacts: emitted,
      causalLinks: links,
      priorFactsById: new Map([[rootFact.id, rootFact]]),
      architectInfluenceByFactId: new Map([[rootFact.id, 1]]),
      edgeStore,
    });

    const childInfluence = result.architectInfluenceByFactId.get(emitted[0]!.id);
    expect(childInfluence).toBeDefined();
    expect(childInfluence!).toBeGreaterThan(0);
    expect(childInfluence!).toBeLessThan(1); // decayed, never amplified
  });

  it("combines multiple influential paths to the same fact as a probabilistic OR, never a plain sum", () => {
    const factStore = createFactStore();
    const rootA = factStore.emit(0, { ...BASE_FACT, architect: { interventionId: "a", influenceStrength: 1 } });
    const rootB = factStore.emit(0, { ...BASE_FACT, architect: { interventionId: "b", influenceStrength: 1 } });
    const emitted = factStore.emitAll(1, [BASE_FACT]);
    const edgeStore = createCausalEdgeStore();

    const links: PendingCausalLink[] = [
      {
        targetIndex: 0,
        source: { kind: "priorFact", factId: rootA.id },
        type: "CONTRIBUTING",
        factor: { key: "a", contribution: 1 },
        mechanism: "test",
        system: "test",
      },
      {
        targetIndex: 0,
        source: { kind: "priorFact", factId: rootB.id },
        type: "CONTRIBUTING",
        factor: { key: "b", contribution: 1 },
        mechanism: "test",
        system: "test",
      },
    ];

    const result = resolveTickCausality({
      emittedFacts: emitted,
      causalLinks: links,
      priorFactsById: new Map([[rootA.id, rootA], [rootB.id, rootB]]),
      architectInfluenceByFactId: new Map([[rootA.id, 1], [rootB.id, 1]]),
      edgeStore,
    });

    const combined = result.architectInfluenceByFactId.get(emitted[0]!.id)!;
    expect(combined).toBeLessThan(1); // never exceeds 1.0
    expect(combined).toBeGreaterThan(0);
  });
});
