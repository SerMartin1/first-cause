import { describe, expect, it } from "vitest";
import { createCausalEdgeStore, createFactStore } from "@first-cause/causality";
import {
  createActiveProcessRegistry,
  createChronicleEntryStore,
  createMilestoneRegistry,
  createNoveltyRegistry,
} from "@first-cause/chronicle";
import { createHeadlessRunner, type WorldRunnerState } from "@first-cause/simulation";
import { compactWorldRunnerState } from "./compaction.js";
import { buildFixtureWorldState } from "./test-fixtures.js";

const MINOR_PRICE_TICK = {
  type: "price_changed",
  subject: { entityType: "good", entityId: "iron_ore" },
  location: { regionId: "region_a" },
  values: { before: 1, after: 1.01 },
} as const;

function buildFixtureState(): WorldRunnerState {
  return {
    headless: createHeadlessRunner({ worldSeed: "compaction-fixture", startYear: 1200 }).getState(),
    worldState: buildFixtureWorldState("compaction-fixture"),
    factStore: createFactStore().getState(),
    causalEdgeStore: createCausalEdgeStore().getState(),
    architectInfluenceByFactId: {},
    chronicle: {
      novelty: createNoveltyRegistry().getState(),
      activeProcess: createActiveProcessRegistry().getState(),
      entryStore: createChronicleEntryStore().getState(),
      interventionLegacyMilestone: createMilestoneRegistry().getState(),
    },
  };
}

describe("compactWorldRunnerState", () => {
  it("compresses a run of old, non-anchor facts into one aggregate, shrinking the save (SS72/PERF-007)", () => {
    const factStore = createFactStore();
    for (let tick = 0; tick < 5; tick++) factStore.emit(tick, MINOR_PRICE_TICK);
    const state: WorldRunnerState = { ...buildFixtureState(), factStore: factStore.getState() };

    const compacted = compactWorldRunnerState(state, 1000); // far past the HOT window
    expect(compacted.factStore.facts.length).toBeLessThan(state.factStore.facts.length);
    expect(compacted.factStore.facts).toHaveLength(1);
    expect(compacted.factStore.facts[0]!.type).toBe("causal_aggregate");
  });

  it("never compacts an anchor fact type, even when old (CAUS-010)", () => {
    const factStore = createFactStore();
    factStore.emit(0, { ...MINOR_PRICE_TICK, type: "settlement_stage_changed" });
    const state: WorldRunnerState = { ...buildFixtureState(), factStore: factStore.getState() };

    const compacted = compactWorldRunnerState(state, 1000);
    expect(compacted.factStore.facts).toHaveLength(1);
    expect(compacted.factStore.facts[0]!.type).toBe("settlement_stage_changed");
  });

  it("never resets FactStore.nextSequence, so a fresh emit after compaction never collides with a surviving id", () => {
    const factStore = createFactStore();
    for (let tick = 0; tick < 5; tick++) factStore.emit(tick, MINOR_PRICE_TICK);
    const state: WorldRunnerState = { ...buildFixtureState(), factStore: factStore.getState() };

    const compacted = compactWorldRunnerState(state, 1000);
    expect(compacted.factStore.nextSequence).toBe(state.factStore.nextSequence);
  });

  it("leaves facts inside the HOT window untouched", () => {
    const factStore = createFactStore();
    for (let tick = 0; tick < 5; tick++) factStore.emit(tick, MINOR_PRICE_TICK);
    const state: WorldRunnerState = { ...buildFixtureState(), factStore: factStore.getState() };

    const compacted = compactWorldRunnerState(state, 10); // well inside the HOT window
    expect(compacted.factStore.facts).toHaveLength(state.factStore.facts.length);
  });
});
