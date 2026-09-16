import { describe, expect, it } from "vitest";
import { createMarket } from "./market.js";

describe("createMarket", () => {
  it("starts with no goods/services entries (DATA-006: one market per region)", () => {
    const market = createMarket({ id: "market_001", regionId: "region_001" });
    expect(market.goods).toEqual({});
    expect(market.services).toEqual({});
  });
});
