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
import { createWorldRunner } from "./world-runner.js";
import { parseArchitectInterventionRule } from "../systems/architect/definition.js";

/**
 * M19 wiring proof: `@first-cause/chronicle`'s own package (48 tests)
 * already covers the pipeline's logic against real content fixtures --
 * this file only proves `WorldRunner` actually calls into it at the
 * right points (`step()` AND `applyIntervention()`, since an
 * Architect-triggered Root Fact must not silently bypass Chronicle).
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
    seed: "world-runner-chronicle-fixture",
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

  return createWorldState({
    world,
    continents: [{ id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] }],
    regions: [region],
    resourceDeposits: [deposit],
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

describe("WorldRunner Chronicle wiring", () => {
  it("stays fully inert (no entries) when chronicleEventTypes is not configured", () => {
    const runner = createWorldRunner({ worldSeed: "s", startYear: 1200, worldState: buildState() });
    runner.applyIntervention(revealRule, {
      instanceId: "intervention_001",
      tick: 0,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    });
    expect(runner.chronicleEntries).toEqual([]);
  });

  it("applyIntervention's Root Fact reaches Chronicle immediately, not only on the next step()", () => {
    const runner = createWorldRunner({
      worldSeed: "s",
      startYear: 1200,
      worldState: buildState(),
      chronicleEventTypes: buildEventTypes(),
    });

    const result = runner.applyIntervention(revealRule, {
      instanceId: "intervention_001",
      tick: 0,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    });
    expect(result.outcome).toBe("COMPLETED");

    expect(runner.chronicleEntries).toHaveLength(1);
    const entry = runner.chronicleEntries[0]!;
    expect(entry.eventType).toBe("resource_discovered");
    expect(entry.historicalAnchor).toBe(true); // anchorPolicy.alwaysAnchor
    expect(entry.architectInfluence).toBeGreaterThan(0); // Root Fact -- fact.architect.influenceStrength
    if (result.outcome === "COMPLETED") {
      expect(entry.primaryFactRefs).toContain(
        result.facts.find((f) => f.type === "resource_discovered")!.id,
      );
    }
  });

  it("a Chronicle historical anchor from an intervention survives causalPruneIntervalTicks pruning", () => {
    const runner = createWorldRunner({
      worldSeed: "s",
      startYear: 1200,
      worldState: buildState(),
      chronicleEventTypes: buildEventTypes(),
      causalPruneIntervalTicks: 1,
    });
    runner.applyIntervention(revealRule, {
      instanceId: "intervention_001",
      tick: 0,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    });
    const anchorFactId = runner.chronicleEntries[0]!.primaryFactRefs[0]!;

    // Advance far past the HOT window so pruning would otherwise compress/lose old, non-anchor facts.
    for (let i = 0; i < 130; i++) runner.step();

    expect(runner.facts.map((f) => f.id)).toContain(anchorFactId);
  });

  it("maybeRunInterventionLegacy stays inert without chronicleInterventionLegacyIntervalTicks configured, even with a COMPLETED intervention on the books", () => {
    const runner = createWorldRunner({
      worldSeed: "s",
      startYear: 1200,
      worldState: buildState(),
      chronicleEventTypes: buildEventTypes(),
      // chronicleInterventionLegacyIntervalTicks intentionally omitted.
    });
    runner.applyIntervention(revealRule, {
      instanceId: "intervention_001",
      tick: 0,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    });
    const entriesBeforeSteps = runner.chronicleEntries.length;
    for (let i = 0; i < 10; i++) runner.step();
    // No intervention_major_consequence entries appear -- the legacy check never ran.
    expect(runner.chronicleEntries.filter((e) => e.eventType === "intervention_major_consequence")).toEqual([]);
    expect(runner.chronicleEntries.length).toBe(entriesBeforeSteps);
  });

  it("maybeRunInterventionLegacy runs on the configured interval and reports no new consequences when Butterfly finds none (root fact alone, no descendants)", () => {
    const runner = createWorldRunner({
      worldSeed: "s",
      startYear: 1200,
      worldState: buildState(),
      chronicleEventTypes: buildEventTypes(),
      chronicleInterventionLegacyIntervalTicks: 5,
    });
    runner.applyIntervention(revealRule, {
      instanceId: "intervention_001",
      tick: 0,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    });
    // 10 ticks with no further intervention activity: Butterfly has no
    // downstream facts to find (buildEventTypes() only maps
    // resource_discovered, so nothing else this world emits becomes a
    // Chronicle-eligible fact either) -- the legacy check runs (at tick
    // 5 and 10) but never crashes and never fabricates a consequence.
    expect(() => {
      for (let i = 0; i < 10; i++) runner.step();
    }).not.toThrow();
    expect(runner.chronicleEntries.filter((e) => e.eventType === "intervention_major_consequence")).toEqual([]);
  });
});
