import { describe, expect, it } from "vitest";
import { createWorld } from "../world/world.js";
import { createContinent } from "../world/continent.js";
import { createRegion } from "../world/regions.js";
import { createRegionGeography } from "../world/geography.js";
import { createConnection } from "../world/connections.js";
import { createResourceDeposit } from "../economy/resource-deposit.js";
import { createWorldState } from "../world-state.js";
import { buildWorldIndexes } from "./world-indexes.js";

const geography = createRegionGeography({
  terrain: "plains",
  climate: "temperate",
  area: 50,
  fertility: 0.5,
  waterAccess: true,
  coastal: false,
  elevationClass: "lowland",
});

describe("buildWorldIndexes", () => {
  it("is reconstructible: rebuilding from the same canonical state gives an identical result", () => {
    const world = createWorld({
      id: "world_001",
      seed: 1,
      name: "X",
      configuration: { regionCount: 2, worldSizePreset: "vs" },
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
      name: "A",
      geography,
    });
    const regionB = createRegion({
      id: "region_002",
      worldId: world.id,
      continentId: continent.id,
      name: "B",
      geography,
    });
    const connection = createConnection({
      id: "connection_001",
      regionAId: regionA.id,
      regionBId: regionB.id,
      geography: { physicalDistance: 5, terrainDifficulty: 0, seasonalModifier: 1 },
    });
    const deposit = createResourceDeposit({
      id: "deposit_001",
      resourceDefinitionId: "iron_ore",
      regionId: regionA.id,
      initialQuantity: 100,
      renewable: false,
    });

    const state = createWorldState({
      world,
      continents: [continent],
      regions: [regionA, regionB],
      connections: [connection],
      resourceDeposits: [deposit],
    });

    const first = buildWorldIndexes(state);
    const second = buildWorldIndexes(state);

    expect([...first.depositsByRegion.entries()]).toEqual([
      ...second.depositsByRegion.entries(),
    ]);
    expect(first.depositsByRegion.get("region_001")).toEqual(["deposit_001"]);

    // A Connection is bidirectional: it appears under both of its regions.
    expect(first.connectionsByRegion.get("region_001")).toEqual(["connection_001"]);
    expect(first.connectionsByRegion.get("region_002")).toEqual(["connection_001"]);
  });

  it("returns empty maps for a world with no entities of a given kind", () => {
    const world = createWorld({
      id: "world_001",
      seed: 1,
      name: "X",
      configuration: { regionCount: 0, worldSizePreset: "vs" },
    });
    const state = createWorldState({ world });
    const indexes = buildWorldIndexes(state);

    expect(indexes.companiesByRegion.size).toBe(0);
    expect(indexes.cohortsByRegion.size).toBe(0);
  });
});
