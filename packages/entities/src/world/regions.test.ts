import { describe, expect, it } from "vitest";
import { createRegion, recomputeRegionTotalPopulation } from "./regions.js";
import { createRegionGeography } from "./geography.js";

const geography = createRegionGeography({
  terrain: "hills",
  climate: "temperate",
  area: 100,
  fertility: 0.6,
  waterAccess: true,
  coastal: false,
  elevationClass: "upland",
});

describe("createRegion", () => {
  it("creates a region with empty back-reference caches and a default environment", () => {
    const region = createRegion({
      id: "region_001",
      worldId: "world_001",
      continentId: "continent_001",
      name: "Black Mountain",
      geography,
    });

    expect(region.population).toEqual({ cohortIds: [], totalPopulation: 0 });
    expect(region.resources.depositIds).toEqual([]);
    expect(region.environment.quality).toBe(1);
  });

  it("rejects an empty id", () => {
    expect(() =>
      createRegion({
        id: "",
        worldId: "world_001",
        continentId: "continent_001",
        name: "X",
        geography,
      }),
    ).toThrow();
  });
});

describe("recomputeRegionTotalPopulation (DATA-004 cache reconstruction)", () => {
  it("sums cohort populations", () => {
    expect(recomputeRegionTotalPopulation([100, 250, 0])).toBe(350);
  });

  it("returns 0 for no cohorts", () => {
    expect(recomputeRegionTotalPopulation([])).toBe(0);
  });

  it("rejects a negative cohort population", () => {
    expect(() => recomputeRegionTotalPopulation([-1])).toThrow();
  });
});
