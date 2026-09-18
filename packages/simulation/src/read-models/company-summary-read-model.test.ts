import { describe, expect, it } from "vitest";
import {
  createCompany,
  createInventory,
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createWorld,
  createWorldState,
} from "@first-cause/entities";
import { buildCompanySummaryReadModel } from "./company-summary-read-model.js";

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
    name: "W",
    configuration: { regionCount: 1, worldSizePreset: "test" },
  });
  const region = createRegion({
    id: "region_a",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region A",
    geography,
  });
  const inventory = createInventory({
    id: "inventory_001",
    ownerType: "company",
    ownerId: "company_001",
    locationRegionId: region.id,
  });
  const company = createCompany({
    id: "company_001",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: region.id,
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: inventory.id,
    initialCash: 250,
  });
  const ownerCohort = createPopulationCohort({
    id: "cohort_001",
    regionId: region.id,
    ageGroup: "AGE_25_44",
    population: 10,
    economicClass: "WORKING",
    skillLevel: "UNSKILLED",
  });

  return createWorldState({
    world,
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [region],
    inventories: [inventory],
    companies: [company],
    populationCohorts: [ownerCohort],
  });
}

describe("buildCompanySummaryReadModel", () => {
  it("returns undefined for an unknown company", () => {
    expect(buildCompanySummaryReadModel(buildFixtureState(), "nope")).toBeUndefined();
  });

  it("summarizes production/workforce/finance from the raw Company", () => {
    const summary = buildCompanySummaryReadModel(buildFixtureState(), "company_001")!;

    expect(summary.name).toBe("Farm");
    expect(summary.archetypeId).toBe("grain_farm");
    expect(summary.active).toBe(true);
    expect(summary.production).toEqual({
      productionMethodId: undefined,
      capacity: 0,
      utilization: 0,
      outputLastTick: 0,
    });
    expect(summary.workforce).toEqual({ employees: 0, vacancies: 0, wageOffer: 0 });
    expect(summary.finance.cash).toBe(250);
  });
});
