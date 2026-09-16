import { describe, expect, it } from "vitest";
import { createWorld } from "./world.js";

describe("createWorld", () => {
  it("creates a world at tick 0 with the given seed/config", () => {
    const world = createWorld({
      id: "world_001",
      seed: "black-mountain",
      name: "Black Mountain",
      configuration: { regionCount: 8, worldSizePreset: "vertical-slice" },
    });

    expect(world.currentTick).toBe(0);
    expect(world.tickLength).toBe("month");
    expect(world.currentDate).toEqual({ year: 1, month: 1 });
    expect(world.continentIds).toEqual([]);
    expect(world.regionIds).toEqual([]);
  });

  it("rejects a negative regionCount", () => {
    expect(() =>
      createWorld({
        id: "world_001",
        seed: 1,
        name: "X",
        configuration: { regionCount: -1, worldSizePreset: "vs" },
      }),
    ).toThrow();
  });

  it("rejects an out-of-range start month", () => {
    expect(() =>
      createWorld({
        id: "world_001",
        seed: 1,
        name: "X",
        configuration: { regionCount: 1, worldSizePreset: "vs" },
        startDate: { year: 1200, month: 13 },
      }),
    ).toThrow(RangeError);
  });
});
