import { describe, expect, it } from "vitest";
import { createContinent } from "./continent.js";

describe("createContinent", () => {
  it("starts with no regions", () => {
    const continent = createContinent({
      id: "continent_001",
      worldId: "world_001",
      name: "Main",
    });
    expect(continent.regionIds).toEqual([]);
    expect(continent.tags).toEqual([]);
  });
});
