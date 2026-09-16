import { describe, expect, it } from "vitest";
import { createTechnologyState } from "./technology-state.js";

describe("createTechnologyState", () => {
  it("starts with no knowledge/discoveries/eligibility", () => {
    const technologyState = createTechnologyState({
      id: "technology_001",
      regionId: "region_001",
    });
    expect(technologyState.knowledge).toEqual({});
    expect(technologyState.discoveries).toEqual({});
    expect(technologyState.eligibleDiscoveryIds).toEqual([]);
  });
});
