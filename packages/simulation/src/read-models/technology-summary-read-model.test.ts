import { describe, expect, it } from "vitest";
import {
  createRegion,
  createRegionGeography,
  createTechnologyState,
  createWorld,
  createWorldState,
  setDiscoveryState,
  setDomainKnowledge,
  setEligibleDiscoveryIds,
} from "@first-cause/entities";
import { buildTechnologySummaryReadModel } from "./technology-summary-read-model.js";

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
    configuration: { regionCount: 2, worldSizePreset: "test" },
  });
  const linkedRegion = {
    ...createRegion({
      id: "region_linked",
      worldId: world.id,
      continentId: "continent_001",
      name: "Region z technologią",
      geography,
    }),
    knowledge: { technologyStateId: "technology_001" },
  };
  const unlinkedRegion = createRegion({
    id: "region_unlinked",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region bez technologii",
    geography,
  });

  let technologyState = createTechnologyState({
    id: "technology_001",
    regionId: "region_linked",
  });
  technologyState = setDomainKnowledge(technologyState, "agriculture_food", 42);
  technologyState = setDiscoveryState(technologyState, "agr_001", { status: "KNOWN" });
  technologyState = setEligibleDiscoveryIds(technologyState, ["agr_001", "agr_002"]);

  return createWorldState({
    world,
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [linkedRegion, unlinkedRegion],
    technologyStates: [technologyState],
  });
}

describe("buildTechnologySummaryReadModel", () => {
  it("returns undefined for an unknown region", () => {
    expect(buildTechnologySummaryReadModel(buildFixtureState(), "nope")).toBeUndefined();
  });

  it("returns undefined for a region without a linked TechnologyState", () => {
    expect(
      buildTechnologySummaryReadModel(buildFixtureState(), "region_unlinked"),
    ).toBeUndefined();
  });

  it("surfaces knowledge/discoveries/eligibleDiscoveryIds for a linked region", () => {
    const summary = buildTechnologySummaryReadModel(buildFixtureState(), "region_linked")!;

    expect(summary.regionId).toBe("region_linked");
    expect(summary.knowledge).toEqual({ agriculture_food: 42 });
    expect(summary.discoveries.agr_001?.status).toBe("KNOWN");
    expect(summary.eligibleDiscoveryIds).toEqual(["agr_001", "agr_002"]);
  });
});
