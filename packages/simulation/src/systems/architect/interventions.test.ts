import { describe, expect, it } from "vitest";
import {
  createConnection,
  createRegion,
  createRegionGeography,
  createResourceDeposit,
  createTechnologyState,
  createWorld,
  createWorldState,
  type WorldState,
} from "@first-cause/entities";
import { INTERVENTION_EFFECT_HANDLERS } from "./interventions.js";

function buildFixtureState(): WorldState {
  const world = createWorld({
    id: "world_001",
    seed: "architect-fixture",
    name: "W",
    configuration: { regionCount: 2, worldSizePreset: "test" },
  });
  const geography = createRegionGeography({
    terrain: "hills",
    climate: "temperate",
    area: 10,
    fertility: 0.2,
    waterAccess: true,
    coastal: false,
    elevationClass: "upland",
  });
  const regionA = createRegion({
    id: "region_a",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region A",
    geography,
    // technologyState linked below via technologyStates + knowledge.technologyStateId
  });
  const regionAWithTech = { ...regionA, knowledge: { technologyStateId: "tech_a" } };
  const regionB = createRegion({
    id: "region_b",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region B",
    geography,
  });
  const technologyState = createTechnologyState({ id: "tech_a", regionId: "region_a" });
  const deposit = createResourceDeposit({
    id: "deposit_001",
    resourceDefinitionId: "iron_ore",
    regionId: "region_a",
    initialQuantity: 500,
    renewable: false,
  });
  const connection = createConnection({
    id: "connection_001",
    regionAId: "region_a",
    regionBId: "region_b",
    geography: { physicalDistance: 10, terrainDifficulty: 0, seasonalModifier: 1 },
    friction: { security: 0, borderFriction: 0.5 },
  });

  return createWorldState({
    world,
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [regionAWithTech, regionB],
    connections: [connection],
    resourceDeposits: [deposit],
    technologyStates: [technologyState],
  });
}

describe("reveal_resource_deposit", () => {
  const handler = INTERVENTION_EFFECT_HANDLERS.reveal_resource_deposit!;

  it("validateTarget rejects an unknown deposit", () => {
    const state = buildFixtureState();
    expect(handler.validateTarget(state, { scopeType: "entity", entityIds: ["nope"] }, [])).not.toEqual([]);
  });

  it("apply moves the deposit to DISCOVERED and emits a resource_discovered fact", () => {
    const state = buildFixtureState();
    const result = handler.apply({
      state,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 5,
    });

    expect(result.worldState.resourceDeposits.deposit_001!.discovery.status).toBe("DISCOVERED");
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0]!.type).toBe("resource_discovered");
  });

  it("ARCH-007: still emits a fact (a fallback one) when the deposit was already discovered", () => {
    const state = buildFixtureState();
    const alreadyDiscovered = handler.apply({
      state,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 5,
    }).worldState;

    const second = handler.apply({
      state: alreadyDiscovered,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      tick: 6,
    });
    expect(second.facts).toHaveLength(1);
  });
});

describe("fertility_shift", () => {
  const handler = INTERVENTION_EFFECT_HANDLERS.fertility_shift!;

  it("clamps the resulting fertility to [0, 1]", () => {
    const state = buildFixtureState();
    const result = handler.apply({
      state,
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: { magnitude: 5 }, // absurdly large, must clamp
      tick: 1,
    });
    expect(result.worldState.regions.region_a!.geography.fertility).toBe(1);
  });

  it("emits a region_fertility_shifted fact with before/after/delta", () => {
    const state = buildFixtureState();
    const result = handler.apply({
      state,
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: { magnitude: 0.1 },
      tick: 1,
    });
    expect(result.facts[0]!.type).toBe("region_fertility_shifted");
    const values = result.facts[0]!.values as { before: number; after: number; delta: number };
    expect(values.before).toBe(0.2);
    expect(values.after).toBeCloseTo(0.3, 10);
    expect(values.delta).toBeCloseTo(0.1, 10);
  });
});

describe("knowledge_injection", () => {
  const handler = INTERVENTION_EFFECT_HANDLERS.knowledge_injection!;

  const knowledgeDomainIds = ["agriculture_food", "mining_metallurgy"];

  it("validateTarget rejects a region with no linked TechnologyState", () => {
    const state = buildFixtureState();
    const errors = handler.validateTarget(
      state,
      { scopeType: "region", entityIds: ["region_b", "agriculture_food"] },
      knowledgeDomainIds,
    );
    expect(errors).not.toEqual([]);
  });

  it("validateTarget rejects a domain id that isn't one of the canonical Knowledge Domains", () => {
    const state = buildFixtureState();
    const errors = handler.validateTarget(
      state,
      { scopeType: "region", entityIds: ["region_a", "invented_magic"] },
      knowledgeDomainIds,
    );
    expect(errors).not.toEqual([]);
  });

  it("raises knowledge in the target domain, clamped at 100", () => {
    const state = buildFixtureState();
    const result = handler.apply({
      state,
      target: { scopeType: "region", entityIds: ["region_a", "agriculture_food"] },
      parameters: { magnitude: 15 },
      tick: 1,
    });
    expect(result.worldState.technologyStates.tech_a!.knowledge.agriculture_food).toBe(15);
    expect(result.facts[0]!.type).toBe("knowledge_increased");
  });
});

describe("trade_friction_shift", () => {
  const handler = INTERVENTION_EFFECT_HANDLERS.trade_friction_shift!;

  it("never lets borderFriction go negative", () => {
    const state = buildFixtureState();
    const result = handler.apply({
      state,
      target: { scopeType: "entity", entityIds: ["connection_001"] },
      parameters: { magnitude: -10 },
      tick: 1,
    });
    expect(result.worldState.connections.connection_001!.friction.borderFriction).toBe(0);
  });
});

describe("environmental_shock", () => {
  const handler = INTERVENTION_EFFECT_HANDLERS.environmental_shock!;

  it("raises waterStress, clamped at 1", () => {
    const state = buildFixtureState();
    const result = handler.apply({
      state,
      target: { scopeType: "region", entityIds: ["region_a"] },
      parameters: { magnitude: 0.3 },
      tick: 1,
    });
    expect(result.worldState.regions.region_a!.environment.waterStress).toBe(0.3);
    expect(result.facts[0]!.type).toBe("environmental_shock_applied");
  });
});
