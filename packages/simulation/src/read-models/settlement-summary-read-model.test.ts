import { describe, expect, it } from "vitest";
import {
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createSettlement,
  createWorld,
  createWorldState,
  type Settlement,
} from "@first-cause/entities";
import { buildSettlementSummaryReadModel } from "./settlement-summary-read-model.js";

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
  const baseSettlement = createSettlement({
    id: "settlement_001",
    regionId: region.id,
    name: "Riverside",
    foundedTick: 0,
    stage: "VILLAGE",
  });
  const settlement: Settlement = {
    ...baseSettlement,
    housing: { capacity: 120, cost: 8.5, pressure: 0.2 },
    condition: {
      ...baseSettlement.condition,
      urbanizationPressure: 0.6,
      declinePressure: 0.1,
    },
    economy: { ...baseSettlement.economy, employment: 45 },
  };
  const cohort = createPopulationCohort({
    id: "cohort_001",
    regionId: region.id,
    settlementId: settlement.id,
    ageGroup: "AGE_25_44",
    population: 100,
    economicClass: "WORKING",
    skillLevel: "SKILLED",
  });

  return createWorldState({
    world,
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [region],
    settlements: [settlement],
    populationCohorts: [cohort],
  });
}

describe("buildSettlementSummaryReadModel (audit P1-08)", () => {
  it("returns undefined for an unknown settlement", () => {
    expect(buildSettlementSummaryReadModel(buildFixtureState(), "nope")).toBeUndefined();
  });

  it("exposes housing capacity/cost/pressure, urbanization/decline pressure, and employment -- previously nowhere in any Read Model", () => {
    const summary = buildSettlementSummaryReadModel(
      buildFixtureState(),
      "settlement_001",
    )!;

    expect(summary.regionId).toBe("region_a");
    expect(summary.name).toBe("Riverside");
    expect(summary.stage).toBe("VILLAGE");
    expect(summary.population).toBe(100); // reconstructed from the cohort, DATA-004
    expect(summary.housing).toEqual({ capacity: 120, cost: 8.5, pressure: 0.2 });
    expect(summary.urbanizationPressure).toBe(0.6);
    expect(summary.declinePressure).toBe(0.1);
    expect(summary.employment).toBe(45);
  });
});
