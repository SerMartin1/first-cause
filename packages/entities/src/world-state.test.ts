import { describe, expect, it } from "vitest";
import { createWorld } from "./world/world.js";
import { createContinent } from "./world/continent.js";
import { createRegion } from "./world/regions.js";
import { createRegionGeography } from "./world/geography.js";
import { createConnection } from "./world/connections.js";
import { createResourceDeposit } from "./economy/resource-deposit.js";
import { createSettlement } from "./society/settlement.js";
import { createPopulationCohort } from "./population/cohort.js";
import { createInventory } from "./economy/inventory.js";
import { createCompany } from "./economy/company.js";
import { createMarket } from "./economy/market.js";
import { createTechnologyState } from "./technology/technology-state.js";
import { createWorldState, type CreateWorldStateInput } from "./world-state.js";
import { InvariantViolationError } from "./core/validation.js";
import { createArchitectInfluenceState } from "./architect/influence.js";
import { createArchitectInterventionInstance } from "./architect/intervention.js";

const geography = createRegionGeography({
  terrain: "hills",
  climate: "temperate",
  area: 100,
  fertility: 0.6,
  waterAccess: true,
  coastal: false,
  elevationClass: "upland",
});

/** A small, deterministic two-region fixture -- everything M3 covers, nothing it doesn't (Black Mountain proper is M4). */
function buildFixtureInput(): CreateWorldStateInput {
  const world = createWorld({
    id: "world_001",
    seed: "fixture-seed",
    name: "Fixture World",
    configuration: { regionCount: 2, worldSizePreset: "vertical-slice" },
  });
  const continent = createContinent({
    id: "continent_001",
    worldId: world.id,
    name: "Main",
  });
  const regionA = createRegion({
    id: "region_001",
    worldId: world.id,
    continentId: continent.id,
    name: "Black Mountain",
    geography,
  });
  const regionB = createRegion({
    id: "region_002",
    worldId: world.id,
    continentId: continent.id,
    name: "Green Valley",
    geography,
  });
  const connection = createConnection({
    id: "connection_001",
    regionAId: regionA.id,
    regionBId: regionB.id,
    geography: { physicalDistance: 10, terrainDifficulty: 0.1, seasonalModifier: 1 },
  });
  const deposit = createResourceDeposit({
    id: "deposit_001",
    resourceDefinitionId: "iron_ore",
    regionId: regionA.id,
    initialQuantity: 1000,
    renewable: false,
  });
  const settlement = createSettlement({
    id: "settlement_001",
    regionId: regionA.id,
    name: "Black Mountain Camp",
    foundedTick: 0,
  });
  const cohortInSettlement = createPopulationCohort({
    id: "cohort_001",
    regionId: regionA.id,
    settlementId: settlement.id,
    ageGroup: "AGE_25_44",
    population: 300,
    economicClass: "WORKING",
    skillLevel: "SKILLED",
  });
  const cohortNoSettlement = createPopulationCohort({
    id: "cohort_002",
    regionId: regionB.id,
    ageGroup: "AGE_15_24",
    population: 150,
    economicClass: "POOR",
    skillLevel: "UNSKILLED",
  });
  const inventory = createInventory({
    id: "inventory_001",
    ownerType: "company",
    ownerId: "company_001",
    locationRegionId: regionA.id,
  });
  const company = createCompany({
    id: "company_001",
    archetypeId: "crop_farm",
    name: "Black Mountain Farm",
    foundedTick: 0,
    regionId: regionA.id,
    settlementId: settlement.id,
    ownerType: "individual",
    ownerEntityId: cohortInSettlement.id,
    inventoryId: inventory.id,
  });
  const market = createMarket({ id: "market_001", regionId: regionA.id });
  const technologyState = createTechnologyState({
    id: "technology_001",
    regionId: regionA.id,
  });

  return {
    world,
    continents: [continent],
    regions: [regionA, regionB],
    connections: [connection],
    resourceDeposits: [deposit],
    settlements: [settlement],
    populationCohorts: [cohortInSettlement, cohortNoSettlement],
    companies: [company],
    markets: [market],
    inventories: [inventory],
    technologyStates: [technologyState],
  };
}

describe("createWorldState -- reconstructed back-references (DATA-003/DATA-004)", () => {
  it("derives every back-reference cache from canonical forward references", () => {
    const state = createWorldState(buildFixtureInput());

    expect(state.world.continentIds).toEqual(["continent_001"]);
    expect(state.world.regionIds).toEqual(["region_001", "region_002"]);
    expect(state.continents.continent_001!.regionIds).toEqual([
      "region_001",
      "region_002",
    ]);

    const regionA = state.regions.region_001!;
    expect(regionA.resources.depositIds).toEqual(["deposit_001"]);
    expect(regionA.settlements.settlementIds).toEqual(["settlement_001"]);
    expect(regionA.economy.companyIds).toEqual(["company_001"]);
    expect(regionA.connections.connectionIds).toEqual(["connection_001"]);
    expect(regionA.population.cohortIds).toEqual(["cohort_001"]);
    expect(regionA.population.totalPopulation).toBe(300);

    const regionB = state.regions.region_002!;
    expect(regionB.connections.connectionIds).toEqual(["connection_001"]);
    expect(regionB.population.totalPopulation).toBe(150);

    const settlement = state.settlements.settlement_001!;
    expect(settlement.population.cohortIds).toEqual(["cohort_001"]);
    expect(settlement.population.totalPopulation).toBe(300);
    expect(settlement.economy.companyIds).toEqual(["company_001"]);
  });

  it("gives the identical result regardless of the input arrays' order (SIM-005)", () => {
    const input = buildFixtureInput();
    const shuffled: CreateWorldStateInput = {
      ...input,
      regions: [...input.regions!].reverse(),
      populationCohorts: [...input.populationCohorts!].reverse(),
    };

    const a = createWorldState(input);
    const b = createWorldState(shuffled);

    expect(a.regions.region_001).toEqual(b.regions.region_001);
    expect(a.world).toEqual(b.world);
  });
});

describe("createWorldState -- referential integrity (rule 9: no dangling references)", () => {
  it("rejects a region referencing an unknown continent", () => {
    const input = buildFixtureInput();
    const brokenRegion = createRegion({
      id: "region_003",
      worldId: input.world.id,
      continentId: "continent_999",
      name: "Nowhere",
      geography,
    });

    expect(() =>
      createWorldState({ ...input, regions: [...input.regions!, brokenRegion] }),
    ).toThrow(InvariantViolationError);
  });

  it("rejects a connection referencing an unknown region", () => {
    const input = buildFixtureInput();
    const brokenConnection = createConnection({
      id: "connection_999",
      regionAId: "region_001",
      regionBId: "region_999",
      geography: { physicalDistance: 1, terrainDifficulty: 0, seasonalModifier: 1 },
    });

    expect(() =>
      createWorldState({
        ...input,
        connections: [...input.connections!, brokenConnection],
      }),
    ).toThrow(InvariantViolationError);
  });

  it("rejects a company referencing an unknown inventory", () => {
    const input = buildFixtureInput();
    const brokenCompany = createCompany({
      id: "company_999",
      archetypeId: "crop_farm",
      name: "Ghost Farm",
      foundedTick: 0,
      regionId: "region_001",
      ownerType: "individual",
      ownerEntityId: "cohort_001",
      inventoryId: "inventory_999",
    });

    expect(() =>
      createWorldState({ ...input, companies: [...input.companies!, brokenCompany] }),
    ).toThrow(InvariantViolationError);
  });

  it("world_commit_rejects_nan_duplicate_ids_and_invalid_ownership: rejects a company whose ownerEntityId references an unknown cohort (audit P1-05)", () => {
    const input = buildFixtureInput();
    const ghostOwnerCompany = createCompany({
      id: "company_999",
      archetypeId: "crop_farm",
      name: "Ghost Owner Farm",
      foundedTick: 0,
      regionId: "region_001",
      ownerType: "individual",
      ownerEntityId: "cohort_999", // no such cohort exists
      inventoryId: "inventory_001",
    });

    expect(() =>
      createWorldState({
        ...input,
        companies: [...input.companies!, ghostOwnerCompany],
      }),
    ).toThrow(/ownerEntityId/);
  });

  it("rejects an Inventory whose ownerId references no entity of its own ownerType (audit P1-05)", () => {
    const input = buildFixtureInput();
    const ghostOwnerInventory = createInventory({
      id: "inventory_999",
      ownerType: "company",
      ownerId: "company_999", // no such company exists
      locationRegionId: "region_001",
    });

    expect(() =>
      createWorldState({
        ...input,
        inventories: [...input.inventories!, ghostOwnerInventory],
      }),
    ).toThrow(/ownerId/);
  });

  it("rejects a PopulationCohort whose settlementId belongs to a different region than the cohort itself (audit P1-05)", () => {
    const input = buildFixtureInput();
    // settlement_001 belongs to region_001 -- placing the cohort in
    // region_002 while still pointing at that settlement is exactly the
    // "settlement exists, but nobody confirmed it's the SAME region" gap.
    const mismatchedCohort = createPopulationCohort({
      id: "cohort_999",
      regionId: "region_002",
      settlementId: "settlement_001",
      ageGroup: "AGE_25_44",
      population: 10,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    });

    expect(() =>
      createWorldState({
        ...input,
        populationCohorts: [...input.populationCohorts!, mismatchedCohort],
      }),
    ).toThrow(/region/i);
  });

  it("rejects a Company whose settlementId belongs to a different region than the company itself (audit P1-05)", () => {
    const input = buildFixtureInput();
    const mismatchedCompany = createCompany({
      id: "company_999",
      archetypeId: "crop_farm",
      name: "Misplaced Farm",
      foundedTick: 0,
      regionId: "region_002", // settlement_001 actually belongs to region_001
      settlementId: "settlement_001",
      ownerType: "individual",
      ownerEntityId: "cohort_001",
      inventoryId: "inventory_001",
    });

    expect(() =>
      createWorldState({
        ...input,
        companies: [...input.companies!, mismatchedCompany],
      }),
    ).toThrow(/region/i);
  });

  it("rejects two entities sharing the same id instead of silently letting the second overwrite the first (audit P1-05)", () => {
    const input = buildFixtureInput();
    const duplicateRegion = createRegion({
      id: "region_001", // collides with the fixture's own region_001
      worldId: input.world.id,
      continentId: "continent_001",
      name: "Duplicate Black Mountain",
      geography,
    });

    expect(() =>
      createWorldState({ ...input, regions: [...input.regions!, duplicateRegion] }),
    ).toThrow(/[Dd]uplicate/);
  });

  it("rejects a NaN that entered a computed field after construction, not caught by any create* constructor (audit P1-05)", () => {
    const input = buildFixtureInput();
    // Reproduces the audit exactly: a Settlement built via spread (the way
    // `society/settlements.ts::evaluateSettlementGrowth` mutates state
    // tick to tick) rather than through `createSettlement` again, so the
    // constructor's own finite-number checks never run on it.
    const settlementWithNaN = {
      ...input.settlements![0]!,
      condition: { ...input.settlements![0]!.condition, urbanizationPressure: NaN },
    };

    expect(() =>
      createWorldState({ ...input, settlements: [settlementWithNaN] }),
    ).toThrow(/finite/);
  });
});

describe("createWorldState -- serialization roundtrip (Save/Determinism Spec cross-cutting since M1)", () => {
  it("a JSON.stringify -> JSON.parse roundtrip preserves the state exactly", () => {
    // WorldState is built entirely from plain objects/arrays (no Map/Set),
    // so plain JSON already proves it round-trips structurally intact --
    // no need to reach for packages/simulation's canonicalStringify here
    // (which exists specifically to handle Map/Set ordering, which
    // packages/entities never uses). Doing so would also give
    // packages/entities a real dependency on packages/simulation, which
    // would cycle back against packages/simulation's own dependency on
    // packages/entities for Read Models (M4+).
    const state = createWorldState(buildFixtureInput());
    const roundtripped = JSON.parse(JSON.stringify(state)) as unknown;
    expect(roundtripped).toEqual(state);
  });
});

describe("createWorldState -- architectInfluence/interventions (M16)", () => {
  it("defaults architectInfluence to a full balance and interventions to empty, when the fixture doesn't know about the Architect yet", () => {
    const state = createWorldState(buildFixtureInput());

    expect(state.architectInfluence).toEqual({ current: 100, max: 100 });
    expect(state.interventions).toEqual({});
  });

  it("accepts an explicit architectInfluence balance and a list of interventions, keyed by id", () => {
    const input = buildFixtureInput();
    const intervention = createArchitectInterventionInstance({
      id: "intervention_001",
      definitionId: "reveal_resource_deposit",
      createdTick: 0,
      target: { scopeType: "entity", entityIds: ["deposit_001"] },
      parameters: {},
      cost: { base: 15, magnitude: 0, duration: 1, scope: 1, naturalness: 1, total: 15 },
    });

    const state = createWorldState({
      ...input,
      architectInfluence: createArchitectInfluenceState(80),
      interventions: [intervention],
    });

    expect(state.architectInfluence).toEqual({ current: 80, max: 80 });
    expect(state.interventions.intervention_001).toEqual(intervention);
  });

  it("rejects two interventions sharing the same id (audit P1-05 pattern)", () => {
    const input = buildFixtureInput();
    const build = () =>
      createArchitectInterventionInstance({
        id: "intervention_001",
        definitionId: "reveal_resource_deposit",
        createdTick: 0,
        target: { scopeType: "entity", entityIds: ["deposit_001"] },
        parameters: {},
        cost: { base: 15, magnitude: 0, duration: 1, scope: 1, naturalness: 1, total: 15 },
      });

    expect(() =>
      createWorldState({ ...input, interventions: [build(), build()] }),
    ).toThrow(/[Dd]uplicate/);
  });
});
