import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadWorldFixture } from "./load-world-fixture.js";

const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);

function readBlackMountainFixture(): unknown {
  const filePath = path.join(
    REPO_ROOT,
    "tests/worldgen/fixtures/black_mountain_reference.json",
  );
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

describe("loadWorldFixture -- structural (rejects bad JSON with a readable error)", () => {
  it("rejects a non-object", () => {
    const result = loadWorldFixture("not a fixture");
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects a fixture with an invalid enum value", () => {
    const result = loadWorldFixture({
      world: {
        id: "w",
        seed: 1,
        name: "W",
        configuration: { regionCount: 0, worldSizePreset: "x" },
      },
      regions: [
        {
          id: "r1",
          continentId: "c1",
          name: "R1",
          geography: {
            terrain: "not-a-terrain",
            climate: "temperate",
            area: 1,
            fertility: 0.5,
            waterAccess: true,
            coastal: false,
            elevationClass: "lowland",
          },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("terrain"))).toBe(true);
  });

  it("rejects a fixture with a dangling reference (delegated to createWorldState)", () => {
    const result = loadWorldFixture({
      world: {
        id: "w",
        seed: 1,
        name: "W",
        configuration: { regionCount: 1, worldSizePreset: "x" },
      },
      regions: [
        {
          id: "r1",
          continentId: "unknown_continent",
          name: "R1",
          geography: {
            terrain: "plains",
            climate: "temperate",
            area: 1,
            fertility: 0.5,
            waterAccess: true,
            coastal: false,
            elevationClass: "lowland",
          },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("Black Mountain Reference fixture (Implementation Roadmap M4, World Generation Spec SS16/SS35/SS53)", () => {
  const result = loadWorldFixture(readBlackMountainFixture());

  it("loads without validation errors", () => {
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  const state = result.worldState!;

  it("has 8 regions, one continent, ~50 population (World Generation Spec SS64 prototype scale)", () => {
    expect(Object.keys(state.regions)).toHaveLength(8);
    expect(Object.keys(state.continents)).toHaveLength(1);
    const totalPopulation = Object.values(state.regions).reduce(
      (sum, region) => sum + region.population.totalPopulation,
      0,
    );
    expect(totalPopulation).toBe(50);
  });

  it("Black Mountain's Iron Ore exists physically but is hidden/unknown, and mining is not forced (SS16/SS53)", () => {
    const blackMountain = state.regions.region_black_mountain!;
    expect(blackMountain.resources.depositIds).toEqual([
      "deposit_black_mountain_iron_ore",
    ]);

    const deposit = state.resourceDeposits.deposit_black_mountain_iron_ore!;
    expect(deposit.resourceDefinitionId).toBe("iron_ore");
    expect(deposit.stock.quantity).toBeGreaterThan(0);
    expect(deposit.discovery.status).toBe("UNKNOWN");
    expect(blackMountain.economy.companyIds).toEqual([]);
  });

  it("has a route from Black Mountain to an external market (SS53)", () => {
    // Black Mountain -> Highland Pass -> Green Valley -> Riverside (the market region).
    const visited = new Set<string>();
    const queue = ["region_black_mountain"];
    while (queue.length > 0) {
      const regionId = queue.shift()!;
      if (visited.has(regionId)) continue;
      visited.add(regionId);
      for (const connectionId of state.regions[regionId]!.connections.connectionIds) {
        const connection = state.connections[connectionId]!;
        const other =
          connection.regionAId === regionId ? connection.regionBId : connection.regionAId;
        queue.push(other);
      }
    }

    const marketRegionIds = new Set(
      Object.values(state.markets).map((market) => market.regionId),
    );
    const reachesAMarket = [...visited].some((regionId) => marketRegionIds.has(regionId));
    expect(reachesAMarket).toBe(true);
  });

  it("has a food-producing region and a potential labor/migration source distinct from Black Mountain (SS35)", () => {
    const greenValley = state.regions.region_green_valley!;
    expect(greenValley.resources.depositIds).toContain("deposit_green_valley_grain");
    expect(greenValley.population.totalPopulation).toBeGreaterThan(0);

    const coastalReach = state.regions.region_coastal_reach!;
    expect(coastalReach.id).not.toBe("region_black_mountain");
    expect(coastalReach.population.totalPopulation).toBeGreaterThan(0);
  });

  it("has an alternative economic region with a different resource (SS35)", () => {
    const timberland = state.regions.region_timberland!;
    expect(timberland.resources.depositIds).toContain("deposit_timberland_timber");
    const deposit = state.resourceDeposits.deposit_timberland_timber!;
    expect(deposit.resourceDefinitionId).not.toBe("iron_ore");
  });

  it("Black Mountain's connection to the rest of the world has a real (non-trivial) transport cost (SS35)", () => {
    const connection = state.connections.connection_black_mountain_highland_pass!;
    expect(connection.geography.physicalDistance).toBeGreaterThan(0);
    expect(connection.geography.terrainDifficulty).toBeGreaterThan(0);
  });
});
