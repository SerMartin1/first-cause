import { describe, expect, it } from "vitest";
import {
  createConnection,
  createContinent,
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createSettlement,
  createWorld,
  createWorldState,
} from "@first-cause/entities";
import { buildAtlasRegionReadModels } from "./atlas-region-read-model.js";

function buildFixtureState() {
  const geography = createRegionGeography({
    terrain: "hills",
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
  const regionB = createRegion({
    id: "region_b",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region B",
    geography,
  });
  const regionA = createRegion({
    id: "region_a",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region A",
    geography,
  });
  const connection = createConnection({
    id: "connection_001",
    regionAId: regionA.id,
    regionBId: regionB.id,
    geography: { physicalDistance: 5, terrainDifficulty: 0, seasonalModifier: 1 },
  });
  const settlement = createSettlement({
    id: "settlement_001",
    regionId: regionA.id,
    name: "S",
    foundedTick: 0,
    stage: "VILLAGE",
  });
  const cohort = createPopulationCohort({
    id: "cohort_001",
    regionId: regionA.id,
    ageGroup: "AGE_25_44",
    population: 5,
    economicClass: "WORKING",
    skillLevel: "SKILLED",
  });

  return createWorldState({
    world,
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    // Deliberately unsorted input order -- output must still be stable (SIM-005).
    regions: [regionB, regionA],
    connections: [connection],
    settlements: [settlement],
    populationCohorts: [cohort],
  });
}

describe("buildAtlasRegionReadModels", () => {
  it("returns one entry per region, sorted by region ID regardless of input order", () => {
    const models = buildAtlasRegionReadModels(buildFixtureState());
    expect(models.map((m) => m.regionId)).toEqual(["region_a", "region_b"]);
  });

  it("resolves the largest settlement stage and population for a populated region", () => {
    const models = buildAtlasRegionReadModels(buildFixtureState());
    const regionA = models.find((m) => m.regionId === "region_a")!;

    expect(regionA.population).toBe(5);
    expect(regionA.largestSettlementStage).toBe("VILLAGE");
  });

  it("a connection appears on both regions it links, with the correct far end", () => {
    const models = buildAtlasRegionReadModels(buildFixtureState());
    const regionA = models.find((m) => m.regionId === "region_a")!;
    const regionB = models.find((m) => m.regionId === "region_b")!;

    expect(regionA.connections).toEqual([
      {
        connectionId: "connection_001",
        toRegionId: "region_b",
        capacity: 0,
        disrupted: false,
      },
    ]);
    expect(regionB.connections).toEqual([
      {
        connectionId: "connection_001",
        toRegionId: "region_a",
        capacity: 0,
        disrupted: false,
      },
    ]);
  });

  it("an empty region has no settlement stage and no connections", () => {
    const world = createWorld({
      id: "world_solo",
      seed: 1,
      name: "Solo World",
      configuration: { regionCount: 1, worldSizePreset: "test" },
    });
    const continent = createContinent({
      id: "continent_solo",
      worldId: world.id,
      name: "Main",
    });
    const state = createWorldState({
      world,
      continents: [continent],
      regions: [
        createRegion({
          id: "region_solo",
          worldId: world.id,
          continentId: continent.id,
          name: "Solo",
          geography: createRegionGeography({
            terrain: "desert",
            climate: "arid",
            area: 1,
            fertility: 0,
            waterAccess: false,
            coastal: false,
            elevationClass: "lowland",
          }),
        }),
      ],
    });
    const models = buildAtlasRegionReadModels(state);
    expect(models).toHaveLength(1);
    expect(models[0]!.largestSettlementStage).toBeUndefined();
    expect(models[0]!.connections).toEqual([]);
  });
});
