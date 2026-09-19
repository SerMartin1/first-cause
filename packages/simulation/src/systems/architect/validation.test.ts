import { describe, expect, it } from "vitest";
import {
  createArchitectInfluenceState,
  createArchitectInterventionInstance,
  createRegion,
  createRegionGeography,
  createResourceDeposit,
  createTechnologyState,
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
  { policy: "allowed" },
  "resource_discovered",
);

const fertilityRule = parseArchitectInterventionRule(
  "fertility_shift",
  "environment",
  ["region"],
  { magnitude: { min: 0.05, max: 0.3 } },
  { base: 10, magnitudePerUnit: 150 },
  24,
  { policy: "limited" },
  "region_fertility_shifted",
);

// `reveal_resource_deposit`'s real content stacking policy is "allowed"
// (`revealRule` above) -- these cooldown-window tests need a "limited"
// policy to exercise `cooldownTicks` at all, so they use a separate rule
// object sharing the same id (the effect handler is looked up by `id`,
// independent of `stackingPolicy`).
const limitedRevealRule = parseArchitectInterventionRule(
  "reveal_resource_deposit",
  "resources",
  ["entity"],
  {},
  { base: 15 },
  12,
  { policy: "limited" },
  "resource_discovered",
);

const forbiddenRule = parseArchitectInterventionRule(
  "environmental_shock",
  "experimental_events",
  ["region"],
  { magnitude: { min: 0.1, max: 0.4 } },
  { base: 20 },
  30,
  { policy: "forbidden" },
  "environmental_shock_applied",
);

const knowledgeDomainIds = ["agriculture_food", "mining_metallurgy"];

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
      instanceId: "intervention_candidate",
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 0,
      knowledgeDomainIds,
    });
    expect(result).toEqual({ ok: true, costTotal: 15 });
  });

  it("rejects a disallowed scope", () => {
    const state = buildState();
    const result = validateIntervention(state, revealRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: {},
      tick: 0,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/scope/);
  });

  it("rejects a missing required parameter", () => {
    const state = buildState();
    const result = validateIntervention(state, fertilityRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: {},
      tick: 0,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/missing required parameter/);
  });

  it("rejects a parameter out of the declared range", () => {
    const state = buildState();
    const result = validateIntervention(state, fertilityRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: { magnitude: 0.9 },
      tick: 0,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/out of range/);
  });

  it("rejects a non-finite parameter value before range-checking it", () => {
    const state = buildState();
    const result = validateIntervention(state, fertilityRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: { magnitude: Number.NaN },
      tick: 0,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/finite number/);
  });

  it("rejects an undeclared parameter", () => {
    const state = buildState();
    const result = validateIntervention(state, fertilityRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: { magnitude: 0.1, extra: 1 },
      tick: 0,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/unexpected parameter/);
  });

  it("rejects a negative or non-integer tick", () => {
    const state = buildState();
    const result = validateIntervention(state, revealRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: -1,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/tick/);
  });

  it("rejects a target with the wrong number of entityIds", () => {
    const state = buildState();
    const result = validateIntervention(state, revealRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "entity", entityIds: ["deposit_001", "extra_id"] },
      parameters: {},
      tick: 0,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/entityIds/);
  });

  it("rejects a duplicate instanceId (ARCH-integrity: instance ids must be unique)", () => {
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
    const result = validateIntervention(state, revealRule, {
      instanceId: "intervention_prev",
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 1,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/already exists/);
  });

  it("rejects a target that doesn't exist", () => {
    const state = buildState();
    const result = validateIntervention(state, revealRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "entity", entityIds: ["nope"] },
      parameters: {},
      tick: 0,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/does not exist/);
  });

  it("rejects a knowledge_injection target whose domain id isn't canonical", () => {
    const knowledgeRule = parseArchitectInterventionRule(
      "knowledge_injection",
      "knowledge",
      ["region"],
      { magnitude: { min: 5, max: 30 } },
      { base: 12 },
      18,
      { policy: "limited" },
      "knowledge_increased",
    );
    const state = buildState();
    const withTech: WorldState = {
      ...state,
      regions: { ...state.regions, region_a: { ...state.regions.region_a!, knowledge: { technologyStateId: "tech_a" } } },
      technologyStates: { tech_a: createTechnologyState({ id: "tech_a", regionId: "region_a" }) },
    };
    const result = validateIntervention(withTech, knowledgeRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "region", entityIds: ["region_a", "invented_magic"] },
      parameters: { magnitude: 10 },
      tick: 0,
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/canonical Knowledge Domain/);
  });

  it("blocks the intervention with a readable message when Influence is insufficient (M16 Acceptance Gate)", () => {
    const state = buildState({ architectInfluence: { current: 5, max: 100 } });
    const result = validateIntervention(state, revealRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 0,
      knowledgeDomainIds,
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

    const result = validateIntervention(completedState, limitedRevealRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 5, // cooldownTicks is 12, so tick 5 is still within the window
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/cooldown/);
  });

  it("rejects any repeat application to the same target when stacking is forbidden, even past the cooldown window", () => {
    const state = buildState({
      interventions: [
        {
          id: "intervention_prev",
          definitionId: "environmental_shock",
          createdTick: 0,
          target: { scopeType: "region", entityIds: ["region_a"] },
          parameters: { magnitude: 0.2 },
          cost: { base: 20, magnitude: 4, duration: 1, scope: 1, naturalness: 1, total: 24 },
        },
      ],
    });
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

    const result = validateIntervention(completedState, forbiddenRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: { magnitude: 0.2 },
      tick: 1000, // far past cooldownTicks (30) -- forbidden must still reject
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/stacking is forbidden/);
  });

  it("allows an immediate repeat application when stacking is allowed, ignoring cooldown", () => {
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
      instanceId: "intervention_candidate",
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 1, // well within cooldownTicks (12) -- "allowed" must ignore it
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(true);
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

    const result = validateIntervention(completedState, limitedRevealRule, {
      instanceId: "intervention_candidate",
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 12, // exactly the cooldown boundary
      knowledgeDomainIds,
    });
    expect(result.ok).toBe(true);
  });
});
