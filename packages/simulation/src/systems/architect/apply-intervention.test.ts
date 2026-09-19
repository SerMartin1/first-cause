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
import { createFactStore } from "@first-cause/causality";
import { parseArchitectInterventionRule } from "./definition.js";
import { applyArchitectIntervention } from "./apply-intervention.js";

const revealRule = parseArchitectInterventionRule(
  "reveal_resource_deposit",
  "resources",
  ["entity"],
  {},
  { base: 15 },
  12,
  "resource_discovered",
);

function buildState(architectInfluence = createArchitectInfluenceState(100)): WorldState {
  const world = createWorld({
    id: "world_001",
    seed: "apply-intervention-fixture",
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
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [region],
    resourceDeposits: [deposit],
    architectInfluence,
  });
}

describe("applyArchitectIntervention", () => {
  it("spends exactly the computed cost from Influence and completes the intervention", () => {
    const state = buildState();
    const factStore = createFactStore();

    const result = applyArchitectIntervention(state, revealRule, {
      instanceId: "intervention_001",
      tick: 3,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    }, factStore);

    expect(result.outcome).toBe("COMPLETED");
    if (result.outcome !== "COMPLETED") return;
    expect(result.worldState.architectInfluence.current).toBe(85); // 100 - 15
    expect(result.intervention.status).toBe("COMPLETED");
    expect(result.intervention.cost.total).toBe(15);
  });

  it("blocks the intervention with a readable message when Influence is insufficient, and touches nothing (M16 Acceptance Gate)", () => {
    const state = buildState(createArchitectInfluenceState(5));
    const factStore = createFactStore();

    const result = applyArchitectIntervention(state, revealRule, {
      instanceId: "intervention_001",
      tick: 3,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    }, factStore);

    expect(result.outcome).toBe("REJECTED");
    if (result.outcome !== "REJECTED") return;
    expect(result.errors.join(" ")).toMatch(/insufficient Influence/i);
    // Atomicity (SS183): nothing spent, nothing mutated, nothing emitted.
    expect(state.architectInfluence.current).toBe(5);
    expect(Object.keys(state.interventions)).toHaveLength(0);
    expect(factStore.size).toBe(0);
  });

  it("creates a Root Fact attributed to the intervention (ARCH-007/SS32: influenceStrength 1.0)", () => {
    const state = buildState();
    const factStore = createFactStore();

    const result = applyArchitectIntervention(state, revealRule, {
      instanceId: "intervention_001",
      tick: 3,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    }, factStore);

    expect(result.outcome).toBe("COMPLETED");
    if (result.outcome !== "COMPLETED") return;
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0]!.architect).toEqual({
      interventionId: "intervention_001",
      influenceStrength: 1,
    });
    expect(result.intervention.rootFactIds).toEqual([result.facts[0]!.id]);
    expect(factStore.all()).toHaveLength(1);
  });

  it("rejects before touching state when the target doesn't exist (validation-before-execution, SS26)", () => {
    const state = buildState();
    const factStore = createFactStore();

    const result = applyArchitectIntervention(state, revealRule, {
      instanceId: "intervention_001",
      tick: 3,
      target: { scopeType: "entity", entityIds: ["does_not_exist"] },
      parameters: {},
    }, factStore);

    expect(result.outcome).toBe("REJECTED");
    expect(factStore.size).toBe(0);
    expect(state.architectInfluence.current).toBe(100);
  });

  it("ARCH-008/ARCH-009: completes even when the deposit was already discovered -- no guaranteed downstream outcome, no-effect is not failure", () => {
    const state = buildState();
    const factStore = createFactStore();

    const first = applyArchitectIntervention(state, revealRule, {
      instanceId: "intervention_001",
      tick: 3,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    }, factStore);
    expect(first.outcome).toBe("COMPLETED");
    if (first.outcome !== "COMPLETED") return;

    const second = applyArchitectIntervention(first.worldState, revealRule, {
      instanceId: "intervention_002",
      tick: 20, // past the 12-tick cooldown
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    }, factStore);

    // The deposit's discovery status did not change a second time -- the
    // intervention still completes and still spends Influence (ARCH-009:
    // "brak oczekiwanego efektu downstream nie oznacza failed lub refund").
    expect(second.outcome).toBe("COMPLETED");
    if (second.outcome !== "COMPLETED") return;
    expect(second.intervention.status).toBe("COMPLETED");
    expect(second.worldState.architectInfluence.current).toBe(70); // 100 - 15 - 15
  });

  it("ARCH-002: reveals the deposit's status without founding a company or otherwise mutating anything beyond the declared target", () => {
    const state = buildState();
    const factStore = createFactStore();

    const result = applyArchitectIntervention(state, revealRule, {
      instanceId: "intervention_001",
      tick: 3,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
    }, factStore);

    expect(result.outcome).toBe("COMPLETED");
    if (result.outcome !== "COMPLETED") return;
    expect(Object.keys(result.worldState.companies)).toHaveLength(0);
    expect(result.worldState.regions.region_a).toEqual(state.regions.region_a);
  });
});
