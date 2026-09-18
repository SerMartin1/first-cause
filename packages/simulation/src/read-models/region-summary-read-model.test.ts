import { describe, expect, it } from "vitest";
import {
  createCompany,
  createConnection,
  createInventory,
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createResourceDeposit,
  createSettlement,
  createWorld,
  createWorldState,
} from "@first-cause/entities";
import type { WorldState } from "@first-cause/entities";
import { buildRegionSummaryReadModel } from "./region-summary-read-model.js";

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
    configuration: { regionCount: 2, worldSizePreset: "test" },
  });
  const regionA = createRegion({
    id: "region_a",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region A",
    geography,
  });
  const regionB = createRegion({
    id: "region_b",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region B",
    geography,
  });
  const connection = createConnection({
    id: "connection_001",
    regionAId: regionA.id,
    regionBId: regionB.id,
    geography: { physicalDistance: 10, terrainDifficulty: 0, seasonalModifier: 1 },
  });
  const deposit = createResourceDeposit({
    id: "deposit_001",
    resourceDefinitionId: "iron_ore",
    regionId: regionA.id,
    initialQuantity: 100,
    renewable: false,
  });
  const settlementSmall = createSettlement({
    id: "settlement_small",
    regionId: regionA.id,
    name: "Small",
    foundedTick: 0,
    stage: "HAMLET",
  });
  const settlementLarge = createSettlement({
    id: "settlement_large",
    regionId: regionA.id,
    name: "Large",
    foundedTick: 0,
    stage: "TOWN",
  });
  const cohort = createPopulationCohort({
    id: "cohort_001",
    regionId: regionA.id,
    ageGroup: "AGE_25_44",
    population: 20,
    economicClass: "WORKING",
    skillLevel: "SKILLED",
  });
  const inventory = createInventory({
    id: "inventory_001",
    ownerType: "company",
    ownerId: "company_001",
    locationRegionId: regionA.id,
  });
  const company = createCompany({
    id: "company_001",
    archetypeId: "smelter",
    name: "Co",
    foundedTick: 0,
    regionId: regionA.id,
    ownerType: "individual",
    ownerEntityId: cohort.id,
    inventoryId: inventory.id,
  });

  return createWorldState({
    world,
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [regionA, regionB],
    connections: [connection],
    resourceDeposits: [deposit],
    settlements: [settlementSmall, settlementLarge],
    populationCohorts: [cohort],
    inventories: [inventory],
    companies: [company],
  });
}

describe("buildRegionSummaryReadModel", () => {
  it("returns undefined for an unknown region", () => {
    expect(buildRegionSummaryReadModel(buildFixtureState(), "nope")).toBeUndefined();
  });

  it("picks the largest settlement by stage, lists resources/archetypes/connections", () => {
    const summary = buildRegionSummaryReadModel(buildFixtureState(), "region_a")!;

    expect(summary.population).toBe(20);
    expect(summary.largestSettlement).toEqual({
      id: "settlement_large",
      name: "Large",
      stage: "TOWN",
    });
    expect(summary.resourceDefinitionIds).toEqual(["iron_ore"]);
    expect(summary.companyArchetypeIds).toEqual(["smelter"]);
    expect(summary.connectedRegionIds).toEqual(["region_b"]);
    // Audytowe P1-08: dotąd nieujawnione żadnym Read Modelem.
    expect(summary.migrationAttraction).toBe(0);
    expect(summary.settlementPressure).toBe(0);
  });

  it("surfaces Region.cached's live migrationAttraction/settlementPressure (audit P1-08)", () => {
    const state = buildFixtureState();
    const withCached: WorldState = {
      ...state,
      regions: {
        ...state.regions,
        region_a: {
          ...state.regions.region_a!,
          cached: {
            ...state.regions.region_a!.cached,
            migrationAttraction: 0.42,
            settlementPressure: 0.73,
          },
        },
      },
    };

    const summary = buildRegionSummaryReadModel(withCached, "region_a")!;
    expect(summary.migrationAttraction).toBe(0.42);
    expect(summary.settlementPressure).toBe(0.73);
  });

  it("returns an empty region with no settlement/resources/connections cleanly", () => {
    const summary = buildRegionSummaryReadModel(buildFixtureState(), "region_b")!;

    expect(summary.population).toBe(0);
    expect(summary.largestSettlement).toBeUndefined();
    expect(summary.resourceDefinitionIds).toEqual([]);
    expect(summary.connectedRegionIds).toEqual(["region_a"]);
  });
});
