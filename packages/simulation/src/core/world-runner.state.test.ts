import { describe, expect, it } from "vitest";
import {
  createArchitectInfluenceState,
  createRegion,
  createRegionGeography,
  createResourceDeposit,
  createWorld,
  createWorldState,
  type WorldState,
} from "@first-cause/entities";
import { DefinitionRegistry, type EventTypeDefinition } from "@first-cause/content";
import { computeChecksum } from "./checksum.js";
import { createWorldRunner, WorldRunner, type WorldRunnerState } from "./world-runner.js";
import { parseArchitectInterventionRule } from "../systems/architect/definition.js";

/**
 * M20 (SS84 Save/Load Determinism Test, SS87 World Checksum): proves
 * `WorldRunner.getState()`/`static fromState()` round-trips EVERYTHING a
 * future tick reads -- WorldState, Causality (facts/edges/Architect
 * Influence) and Chronicle (all 4 registries), not just the `HeadlessRunner`
 * core M1 already covered. Reuses `world-runner.chronicle.test.ts`'s
 * fixture shape (real intervention, real Chronicle wiring) since a
 * roundtrip proof over an empty runner would not exercise most of what
 * `getState()` actually carries.
 */
const revealRule = parseArchitectInterventionRule(
  "reveal_resource_deposit",
  "resources",
  ["entity"],
  {},
  { base: 15 },
  12,
  { policy: "allowed" },
  "resource_discovered",
);

function buildState(): WorldState {
  const world = createWorld({
    id: "world_001",
    seed: "world-runner-state-fixture",
    name: "W",
    configuration: { regionCount: 1, worldSizePreset: "test" },
  });
  const region = createRegion({
    id: "region_a",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region A",
    geography: createRegionGeography({
      terrain: "plains",
      climate: "temperate",
      area: 10,
      fertility: 0.2,
      waterAccess: false,
      coastal: false,
      elevationClass: "lowland",
    }),
  });
  const deposit = createResourceDeposit({
    id: "deposit_001",
    resourceDefinitionId: "iron_ore",
    regionId: "region_a",
    initialQuantity: 100,
    renewable: false,
  });
  const secondDeposit = createResourceDeposit({
    id: "deposit_002",
    resourceDefinitionId: "iron_ore",
    regionId: "region_a",
    initialQuantity: 100,
    renewable: false,
  });

  return createWorldState({
    world,
    continents: [{ id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] }],
    regions: [region],
    resourceDeposits: [deposit, secondDeposit],
    architectInfluence: createArchitectInfluenceState(100),
  });
}

function buildEventTypes(): DefinitionRegistry<EventTypeDefinition> {
  const resourceDiscovered: EventTypeDefinition = {
    id: "resource_discovered",
    nameKey: "content.eventType.resource_discovered.name",
    category: "resources",
    baseSignificance: 30,
    candidateThreshold: 5,
    aggregationPolicy: { windowTicks: 1, scope: "entity" },
    noveltyPolicy: { tracksFirst: true, scope: "region" },
    durationPolicy: "INSTANTANEOUS",
    anchorPolicy: { alwaysAnchor: true },
    implementationPhase: "VS",
  };
  return DefinitionRegistry.fromDefinitions<EventTypeDefinition>([resourceDiscovered]);
}

function buildPopulatedRunner() {
  const eventTypes = buildEventTypes();
  const runner = createWorldRunner({
    worldSeed: "world-runner-state-fixture",
    startYear: 1200,
    worldState: buildState(),
    chronicleEventTypes: eventTypes,
    causalPruneIntervalTicks: 1000, // configured, but never fires within this test's tick count
  });
  runner.applyIntervention(revealRule, {
    instanceId: "intervention_001",
    tick: 0,
    target: { scopeType: "entity", entityIds: ["deposit_001"] },
    parameters: {},
  });
  for (let i = 0; i < 5; i++) runner.step();
  return { runner, eventTypes };
}

describe("WorldRunner.getState / fromState (M20)", () => {
  it("round-trips to an identical World Checksum (SS87)", () => {
    const { runner, eventTypes } = buildPopulatedRunner();
    const before = runner.getState();
    const beforeChecksum = computeChecksum(before);

    const restored = WorldRunner.fromState(before, { chronicleEventTypes: eventTypes });
    const afterChecksum = computeChecksum(restored.getState());

    expect(afterChecksum).toBe(beforeChecksum);
  });

  it("preserves facts, causal edges, Architect Influence and Chronicle entries exactly", () => {
    const { runner, eventTypes } = buildPopulatedRunner();
    const state = runner.getState();
    const restored = WorldRunner.fromState(state, { chronicleEventTypes: eventTypes });

    expect(restored.facts).toEqual(runner.facts);
    expect(restored.causalEdges).toEqual(runner.causalEdges);
    expect([...restored.architectInfluence.entries()]).toEqual([...runner.architectInfluence.entries()]);
    expect(restored.chronicleEntries).toEqual(runner.chronicleEntries);
    expect(restored.tick).toBe(runner.tick);
    expect(restored.worldState).toEqual(runner.worldState);
  });

  it("Save/Load Determinism Test (SS84): continuing after a save/load round-trip matches continuing without one", () => {
    const { runner: control, eventTypes } = buildPopulatedRunner();
    const savedState: WorldRunnerState = control.getState();

    // Branch A: keep ticking the original runner.
    for (let i = 0; i < 5; i++) control.step();
    const checksumA = computeChecksum(control.getState());

    // Branch B: restore from the save point, then tick the same number of times.
    const restored = WorldRunner.fromState(savedState, { chronicleEventTypes: eventTypes });
    for (let i = 0; i < 5; i++) restored.step();
    const checksumB = computeChecksum(restored.getState());

    expect(checksumB).toBe(checksumA);
  });

  it("a fresh applyIntervention() after restore never collides with a restored fact id (FactStore's sequence counter round-trips)", () => {
    const { runner, eventTypes } = buildPopulatedRunner();
    const restored = WorldRunner.fromState(runner.getState(), { chronicleEventTypes: eventTypes });
    const beforeIds = new Set(restored.facts.map((f) => f.id));

    const result = restored.applyIntervention(revealRule, {
      instanceId: "intervention_002",
      tick: restored.tick,
      target: { scopeType: "entity", entityIds: ["deposit_002"] },
      parameters: {},
    });

    expect(result.outcome).toBe("COMPLETED");
    if (result.outcome !== "COMPLETED") return;
    expect(result.facts.length).toBeGreaterThan(0);
    for (const fact of result.facts) {
      expect(beforeIds.has(fact.id)).toBe(false);
    }
  });
});

describe("WorldRunner speed independence (SAVE-005)", () => {
  it("runTicks(N) produces the same World Checksum as N individual step() calls", () => {
    const batch = createWorldRunner({
      worldSeed: "speed-independence-fixture",
      startYear: 1200,
      worldState: buildState(),
    });
    batch.runTicks(10);

    const stepwise = createWorldRunner({
      worldSeed: "speed-independence-fixture",
      startYear: 1200,
      worldState: buildState(),
    });
    for (let i = 0; i < 10; i++) stepwise.step();

    expect(computeChecksum(stepwise.getState())).toBe(computeChecksum(batch.getState()));
  });
});
