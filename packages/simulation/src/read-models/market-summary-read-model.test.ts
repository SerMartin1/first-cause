import { describe, expect, it } from "vitest";
import {
  createMarket,
  createRegion,
  createRegionGeography,
  createWorld,
  createWorldState,
} from "@first-cause/entities";
import { initializeMarketGood } from "../systems/economy/markets/price-adjustment.js";
import { buildMarketSummaryReadModel } from "./market-summary-read-model.js";

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
  let market = createMarket({ id: "market_001", regionId: region.id });
  market = {
    ...market,
    goods: { flour: initializeMarketGood(2), grain: initializeMarketGood(1) },
  };

  return createWorldState({
    world,
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [region],
    markets: [market],
  });
}

describe("buildMarketSummaryReadModel", () => {
  it("returns undefined for an unknown market", () => {
    expect(buildMarketSummaryReadModel(buildFixtureState(), "nope")).toBeUndefined();
  });

  it("lists every good, sorted by id, with price/supply/demand/shortage", () => {
    const summary = buildMarketSummaryReadModel(buildFixtureState(), "market_001")!;

    expect(summary.regionId).toBe("region_a");
    expect(summary.goods.map((good) => good.goodId)).toEqual(["flour", "grain"]);
    expect(summary.goods[0]).toEqual({
      goodId: "flour",
      localPrice: 2,
      supply: 0,
      demand: 0,
      shortageSeverity: 0,
    });
  });
});
