import { describe, expect, it } from "vitest";
import {
  createArchitectInfluenceState,
  createArchitectInterventionInstance,
  createRegion,
  createRegionGeography,
  createResourceDeposit,
  createWorld,
  createWorldState,
  type WorldState,
} from "@first-cause/entities";
import { parseArchitectInterventionRule } from "./definition.js";
import { validateIntervention } from "./validation.js";

const revealRule = parseArchitectInterventionRule(
  "reveal_resource_deposit",
  "resources",
  ["entity"],
  {},
  { base: 15 },
  12,
  "resource_discovered",
);

const fertilityRule = parseArchitectInterventionRule(
  "fertility_shift",
  "environment",
  ["region"],
  { magnitude: { min: 0.05, max: 0.3 } },
  { base: 10, magnitudePerUnit: 150 },
  24,
  "region_fertility_shifted",
);

function buildState(overrides?: {
  architectInfluence?: { current: number; max: number };
  interventions?: Parameters<typeof createArchitectInterventionInstance>[0][];
}): WorldState {
  const world = createWorld({
    id: "world_001",
    seed: "validation-fixture",
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
    architectInfluence: overrides?.architectInfluence ?? createArchitectInfluenceState(100),
    ...(overrides?.interventions
      ? { interventions: overrides.interventions.map((i) => createArchitectInterventionInstance(i)) }
      : {}),
  });
}

describe("validateIntervention", () => {
  it("accepts a well-formed, affordable, in-range intervention", () => {
    const state = buildState();
    const result = validateIntervention(state, revealRule, {
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 0,
    });
    expect(result).toEqual({ ok: true, costTotal: 15 });
  });

  it("rejects a disallowed scope", () => {
    const state = buildState();
    const result = validateIntervention(state, revealRule, {
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: {},
      tick: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/scope/);
  });

  it("rejects a missing required parameter", () => {
    const state = buildState();
    const result = validateIntervention(state, fertilityRule, {
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: {},
      tick: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/missing required parameter/);
  });

  it("rejects a parameter out of the declared range", () => {
    const state = buildState();
    const result = validateIntervention(state, fertilityRule, {
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: { magnitude: 0.9 },
      tick: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/out of range/);
  });

  it("rejects a target that doesn't exist", () => {
    const state = buildState();
    const result = validateIntervention(state, revealRule, {
      target: { scopeType: "entity", entityIds: ["nope"] },
      parameters: {},
      tick: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/does not exist/);
  });

  it("blocks the intervention with a readable message when Influence is insufficient (M16 Acceptance Gate)", () => {
    const state = buildState({ architectInfluence: { current: 5, max: 100 } });
    const result = validateIntervention(state, revealRule, {
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/insufficient Influence/i);
  });

  it("rejects a repeat application to the same target inside the cooldown window", () => {
    const state = buildState({
      interventions: [
        {
          id: "intervention_prev",
          definitionId: "reveal_resource_deposit",
          createdTick: 0,
          target: { scopeType: "entity", entityIds: ["deposit_001"] },
          parameters: {},
          cost: { base: 15, magnitude: 0, duration: 1, scope: 1, naturalness: 1, total: 15 },
        },
      ],
    });
    // completeArchitectIntervention isn't applied here -- PLANNED status,
    // so cooldown shouldn't trigger yet; re-derive a COMPLETED one instead.
    const completedState: WorldState = {
      ...state,
      interventions: {
        intervention_prev: {
          ...state.interventions.intervention_prev!,
          status: "COMPLETED",
          appliedTick: 0,
          rootFactIds: ["fact_0_0"],
        },
      },
    };

    const result = validateIntervention(completedState, revealRule, {
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 5, // cooldownTicks is 12, so tick 5 is still within the window
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/cooldown/);
  });

  it("allows a repeat application once the cooldown has elapsed", () => {
    const state = buildState();
    const planned = createArchitectInterventionInstance({
      id: "intervention_prev",
      definitionId: "reveal_resource_deposit",
      createdTick: 0,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      cost: { base: 15, magnitude: 0, duration: 1, scope: 1, naturalness: 1, total: 15 },
    });
    const completedState: WorldState = {
      ...state,
      interventions: {
        intervention_prev: {
          ...planned,
          status: "COMPLETED",
          appliedTick: 0,
          rootFactIds: ["fact_0_0"],
        },
      },
    };

    const result = validateIntervention(completedState, revealRule, {
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 12, // exactly the cooldown boundary
    });
    expect(result.ok).toBe(true);
  });
});
