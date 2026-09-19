import { describe, expect, it } from "vitest";
import {
  createTechnologyState,
  setDiscoveryState,
  setDomainKnowledge,
  setEligibleDiscoveryIds,
} from "./technology-state.js";

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

describe("setDomainKnowledge", () => {
  it("sets a domain's knowledge level immutably", () => {
    const state = createTechnologyState({ id: "t1", regionId: "r1" });
    const next = setDomainKnowledge(state, "agriculture_food", 42);

    expect(next.knowledge).toEqual({ agriculture_food: 42 });
    expect(state.knowledge).toEqual({}); // oryginał nietknięty
  });

  it.each([-1, 101, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an out-of-range level (%s)",
    (level) => {
      const state = createTechnologyState({ id: "t1", regionId: "r1" });
      expect(() => setDomainKnowledge(state, "agriculture_food", level)).toThrow();
    },
  );
});

describe("setDiscoveryState", () => {
  it("creates a discovery entry from UNKNOWN defaults when absent, merging the patch", () => {
    const state = createTechnologyState({ id: "t1", regionId: "r1" });
    const next = setDiscoveryState(state, "agr_001", {
      status: "KNOWN",
      discoveredTick: 5,
      sourceRegionId: "r1",
    });

    expect(next.discoveries.agr_001).toEqual({
      status: "KNOWN",
      discoveredTick: 5,
      sourceRegionId: "r1",
      diffusionSource: undefined,
      availability: 0,
      industryAdoption: 0,
      populationAccess: 0,
      institutionalAdoption: 0,
    });
  });

  it("merges onto an existing entry without clobbering untouched fields", () => {
    const state = setDiscoveryState(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agr_001",
      { status: "KNOWN", discoveredTick: 5 },
    );
    const next = setDiscoveryState(state, "agr_001", { availability: 0.6 });

    expect(next.discoveries.agr_001?.status).toBe("KNOWN");
    expect(next.discoveries.agr_001?.discoveredTick).toBe(5);
    expect(next.discoveries.agr_001?.availability).toBe(0.6);
  });
});

describe("setEligibleDiscoveryIds", () => {
  it("replaces the cache wholesale", () => {
    const state = createTechnologyState({ id: "t1", regionId: "r1" });
    const next = setEligibleDiscoveryIds(state, ["agr_001", "min_001"]);

    expect(next.eligibleDiscoveryIds).toEqual(["agr_001", "min_001"]);
  });
});
