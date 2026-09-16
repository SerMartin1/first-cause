import { describe, expect, it } from "vitest";
import { createSettlement } from "./settlement.js";

describe("createSettlement", () => {
  it("starts at CAMP stage with zeroed housing/economy", () => {
    const settlement = createSettlement({
      id: "settlement_001",
      regionId: "region_001",
      name: "Black Mountain Camp",
      foundedTick: 0,
    });

    expect(settlement.stage).toBe("CAMP");
    expect(settlement.housing).toEqual({ capacity: 0, cost: 0, pressure: 0 });
    expect(settlement.population).toEqual({ cohortIds: [], totalPopulation: 0 });
  });

  it("rejects a negative foundedTick", () => {
    expect(() =>
      createSettlement({
        id: "settlement_001",
        regionId: "region_001",
        name: "X",
        foundedTick: -1,
      }),
    ).toThrow(RangeError);
  });
});
