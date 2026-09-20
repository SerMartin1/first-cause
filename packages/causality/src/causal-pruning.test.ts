import { describe, expect, it } from "vitest";
import { pruneCausalMemory } from "./causal-pruning.js";
import { createFactStore } from "./fact-store.js";
import { createCausalEdgeStore } from "./causal-edge-store.js";

const MINOR_PRICE_TICK = {
  type: "price_changed",
  subject: { entityType: "good", entityId: "iron_ore" },
  location: { regionId: "region_001" },
  values: { before: 1, after: 1.01 },
} as const;

describe("pruneCausalMemory", () => {
  it("compresses a run of old, non-anchor facts of the same entity+type into one aggregate, reducing fact count", () => {
    const factStore = createFactStore();
    for (let tick = 0; tick < 5; tick++) {
      factStore.emit(tick, MINOR_PRICE_TICK);
    }
    const facts = factStore.all();

    const result = pruneCausalMemory({
      facts,
      edges: [],
      architectInfluenceByFactId: new Map(),
      currentTick: 1000, // every fact is far outside the HOT window
      hotWindowTicks: 120,
    });

    expect(result.facts.length).toBeLessThan(facts.length);
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0]!.type).toBe("causal_aggregate");
  });

  it("never prunes facts inside the HOT window", () => {
    const factStore = createFactStore();
    for (let tick = 0; tick < 5; tick++) {
      factStore.emit(tick, MINOR_PRICE_TICK);
    }
    const facts = factStore.all();

    const result = pruneCausalMemory({
      facts,
      edges: [],
      architectInfluenceByFactId: new Map(),
      currentTick: 10, // well inside the HOT window
      hotWindowTicks: 120,
    });

    expect(result.facts).toHaveLength(facts.length);
  });

  it("CAUS-010: never removes the sole surviving cause of an anchor, even if that cause is itself old and unremarkable", () => {
    const factStore = createFactStore();
    const cause = factStore.emit(0, MINOR_PRICE_TICK); // old, unremarkable
    const anchor = factStore.emit(0, { ...MINOR_PRICE_TICK, type: "discovery_occurred" }); // old, but an anchor
    const facts = factStore.all();

    const edgeStore = createCausalEdgeStore();
    edgeStore.add(
      {
        sourceFactId: cause.id,
        targetFactId: anchor.id,
        type: "TRIGGERING",
        strength: 1,
        contribution: 1,
        mechanism: "test",
        system: "test",
        variable: "test",
      },
      cause,
      anchor,
    );

    const result = pruneCausalMemory({
      facts,
      edges: edgeStore.all(),
      architectInfluenceByFactId: new Map(),
      currentTick: 1000,
      hotWindowTicks: 120,
    });

    expect(result.facts.map((f) => f.id)).toContain(cause.id);
    expect(result.facts.map((f) => f.id)).toContain(anchor.id);
  });

  it("never leaves a dangling edge: every edge's endpoints exist in the pruned fact list", () => {
    const factStore = createFactStore();
    const survivorSource = factStore.emit(0, { ...MINOR_PRICE_TICK, type: "discovery_occurred" }); // anchor, survives
    const compressedTargets = [
      factStore.emit(1, MINOR_PRICE_TICK),
      factStore.emit(2, MINOR_PRICE_TICK),
      factStore.emit(3, MINOR_PRICE_TICK),
    ];
    const facts = factStore.all();

    const edgeStore = createCausalEdgeStore();
    for (const target of compressedTargets) {
      edgeStore.add(
        {
          sourceFactId: survivorSource.id,
          targetFactId: target.id,
          type: "CONTRIBUTING",
          strength: 0.2,
          contribution: 0.2,
          mechanism: "test",
          system: "test",
          variable: "test",
        },
        survivorSource,
        target,
      );
    }

    const result = pruneCausalMemory({
      facts,
      edges: edgeStore.all(),
      architectInfluenceByFactId: new Map(),
      currentTick: 1000,
      hotWindowTicks: 120,
    });

    const survivingIds = new Set(result.facts.map((f) => f.id));
    for (const edge of result.edges) {
      expect(survivingIds.has(edge.sourceFactId)).toBe(true);
      expect(survivingIds.has(edge.targetFactId)).toBe(true);
    }
    // The 3 compressed targets collapse into 1 aggregate -- the boundary edge survives, redirected.
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.targetFactId).not.toBe(compressedTargets[0]!.id);
  });

  it("extraMustKeepFactIds protects a fact that isAnchor()/architect influence alone would not (e.g. a Chronicle historical anchor)", () => {
    const factStore = createFactStore();
    const chronicleAnchored = factStore.emit(0, MINOR_PRICE_TICK); // old, unremarkable, NOT an isAnchor() type
    const facts = factStore.all();

    const result = pruneCausalMemory({
      facts,
      edges: [],
      architectInfluenceByFactId: new Map(),
      currentTick: 1000,
      hotWindowTicks: 120,
      extraMustKeepFactIds: new Set([chronicleAnchored.id]),
    });

    expect(result.facts.map((f) => f.id)).toContain(chronicleAnchored.id);
  });

  it("is a pure function: does not mutate its inputs", () => {
    const factStore = createFactStore();
    for (let tick = 0; tick < 3; tick++) {
      factStore.emit(tick, MINOR_PRICE_TICK);
    }
    const facts = factStore.all();
    const frozenLength = facts.length;

    pruneCausalMemory({
      facts,
      edges: [],
      architectInfluenceByFactId: new Map(),
      currentTick: 1000,
      hotWindowTicks: 120,
    });

    expect(facts).toHaveLength(frozenLength);
  });
});
