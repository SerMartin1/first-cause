import { describe, expect, it } from "vitest";
import {
  createCompany,
  createInventory,
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createSettlement,
  createWorld,
  createWorldState,
} from "@first-cause/entities";
import { buildWorldSummaryReadModel } from "./world-summary-read-model.js";

function buildFixtureState() {
  const geography = createRegionGeography({
    terrain: "plains",
    climate: "temperate",
    area: 10,
    fertility: 0.5,
    waterAccess: true,
    coastal: false,
    elevationClass: "lowland",
  });
  const world = createWorld({
    id: "world_001",
    seed: 1,
    name: "Fixture World",
    configuration: { regionCount: 1, worldSizePreset: "test" },
  });
  const region = createRegion({
    id: "region_001",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region One",
    geography,
  });
  const settlementA = createSettlement({
    id: "settlement_001",
    regionId: region.id,
    name: "A",
    foundedTick: 0,
    stage: "HAMLET",
  });
  const settlementB = createSettlement({
    id: "settlement_002",
    regionId: region.id,
    name: "B",
    foundedTick: 0,
    stage: "VILLAGE",
  });
  const cohort = createPopulationCohort({
    id: "cohort_001",
    regionId: region.id,
    ageGroup: "AGE_25_44",
    population: 42,
    economicClass: "WORKING",
    skillLevel: "SKILLED",
  });
  const inventory = createInventory({
    id: "inventory_001",
    ownerType: "company",
    ownerId: "company_001",
    locationRegionId: region.id,
  });
  const company = createCompany({
    id: "company_001",
    archetypeId: "archetype_001",
    name: "Co",
    foundedTick: 0,
    regionId: region.id,
    ownerType: "individual",
    ownerEntityId: cohort.id,
    inventoryId: inventory.id,
  });

  return createWorldState({
    world,
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [region],
    settlements: [settlementA, settlementB],
    populationCohorts: [cohort],
    inventories: [inventory],
    companies: [company],
  });
}

describe("buildWorldSummaryReadModel", () => {
  it("aggregates population, settlements-by-stage and active companies from canonical entities", () => {
    const state = buildFixtureState();
    const summary = buildWorldSummaryReadModel(state);

    expect(summary.worldId).toBe("world_001");
    expect(summary.regionCount).toBe(1);
    expect(summary.totalPopulation).toBe(42);
    expect(summary.settlementCount).toBe(2);
    expect(summary.settlementCountByStage.HAMLET).toBe(1);
    expect(summary.settlementCountByStage.VILLAGE).toBe(1);
    expect(summary.settlementCountByStage.CAMP).toBe(0);
    expect(summary.activeCompanyCount).toBe(1);
  });
});
