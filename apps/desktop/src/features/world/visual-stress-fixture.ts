import type { WorldRegionView, WorldView } from "@first-cause/simulation";

/** VISUAL DEVELOPMENT DATA ONLY. Not a scenario, forecast or simulated history.
 * Imported only by tests / the standalone test harness, never by the shipped application. */
export const VISUAL_STAGES = ["EARLY", "DEVELOPING", "INDUSTRIAL", "MODERN"] as const;
export function visualStressView(index: number): WorldView {
  const population = [350, 12_000, 120_000, 1_200_000][index]!;
  const stage = (["HAMLET", "TOWN", "CITY", "METROPOLIS"] as const)[index]!;
  const region: WorldRegionView = {
    regionId: "visual_region",
    name: "Reference region",
    population,
    largestSettlement: { id: "visual_settlement", name: "Reference settlement", stage },
    resourceDefinitionIds: ["iron_ore"],
    companyArchetypeIds: [],
    connectedRegionIds: [],
    migrationAttraction: 0,
    settlementPressure: 0,
    latestExplainedChange: undefined,
    profile: {
      regionId: "visual_region",
      terrain: "mountains",
      water: "none",
      vegetation: "sparse_forest",
      settlement: stage,
      industry: ([undefined, "workshop", "factory", "industrial_complex"] as const)[
        index
      ],
      transport: (["trail", "road", "railway", "highway"] as const)[index],
      energy: undefined,
      landmarkResourceDefinitionId: "iron_ore",
      vignetteSeed: 42,
    },
    settlements: [
      {
        settlementId: "visual_settlement",
        regionId: "visual_region",
        name: "Reference settlement",
        stage,
        population,
        housing: { capacity: population * 1.2, cost: 1, pressure: 0.1 },
        urbanizationPressure: 0,
        declinePressure: 0,
        employment: population / 2,
      },
    ],
    deposits: [
      {
        depositId: "visual_iron",
        regionId: "visual_region",
        resourceDefinitionId: "iron_ore",
        discoveryStatus: "ASSESSED",
        renewable: false,
        quantity: 100_000 - index * 20_000,
        extractionRate: index * 100,
        depleted: false,
      },
    ],
    technology: {
      regionId: "visual_region",
      knowledge: {},
      eligibleDiscoveryIds: [],
      discoveries: {
        visual_discovery: {
          status: "ADOPTED",
          discoveredTick: 0,
          sourceRegionId: undefined,
          diffusionSource: undefined,
          availability: 1,
          industryAdoption: index / 3,
          populationAccess: index / 3,
          institutionalAdoption: index / 3,
        },
      },
    },
    production: index * 1000,
    companies: index * 3,
    housingPressure: 0.1,
    infrastructure: index,
  };
  const current = {
    summary: {
      worldId: "visual",
      worldName: "VISUAL DEVELOPMENT DATA",
      currentTick: index * 12,
      currentDate: { year: index + 1, month: 1 },
      regionCount: 1,
      totalPopulation: population,
      settlementCount: 1,
      activeCompanyCount: region.companies,
      settlementCountByStage: {
        CAMP: 0,
        HAMLET: 0,
        VILLAGE: 0,
        TOWN: 0,
        CITY: 0,
        METROPOLIS: 0,
        [stage]: 1,
      },
    },
    regions: [region],
    connections: [],
    flows: [],
    causalDrivers: [],
  };
  return {
    type: "WORLD_VIEW",
    current,
    baseline: index ? visualStressView(index - 1).current : undefined,
    liveTick: index * 12,
    availableTicks: [0, 12, 24, 36].slice(0, index + 1),
    events: [],
    speed: 0,
  };
}
