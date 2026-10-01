import type {
  RegionVisualIndustry,
  WorldRegionView,
  WorldView,
} from "@first-cause/simulation";

/** VISUAL DEVELOPMENT DATA ONLY. Not a scenario, forecast or simulated history.
 * Imported only by tests / the standalone test harness, never by the shipped application. */
export const VISUAL_STAGES = ["EARLY", "DEVELOPING", "INDUSTRIAL", "MODERN"] as const;
const sector = (
  name: string,
  activeCompanies: number,
  employees: number,
  scale: NonNullable<RegionVisualIndustry["scale"]>,
): RegionVisualIndustry => ({
  sector: name,
  activeCompanies,
  closedCompanies: 0,
  employees,
  capacity: employees,
  outputLastTick: employees * 2,
  scale,
  state: "active",
});
/** RegionVisualProfile v2 `industry[]` per etap -- kontrakt, nie symulowana historia. */
const STAGE_INDUSTRY: readonly (readonly RegionVisualIndustry[])[] = [
  [],
  [sector("manufacturing", 3, 12, "manufactory")],
  [sector("metallurgy", 3, 180, "factory"), sector("mining", 3, 120, "factory")],
  [
    sector("metallurgy", 4, 2_400, "industrial_complex"),
    sector("mining", 3, 900, "large_plant"),
    sector("manufacturing", 2, 200, "factory"),
  ],
];
export function visualStressView(index: number): WorldView {
  const population = [350, 12_000, 120_000, 1_200_000][index]!;
  const stage = (["HAMLET", "TOWN", "CITY", "METROPOLIS"] as const)[index]!;
  const region: WorldRegionView = {
    regionId: "visual_region",
    name: "Reference region",
    population,
    largestSettlement: { id: "visual_settlement", name: "Reference settlement", stage },
    resourceDefinitionIds: ["iron_ore"],
    suspectedDepositCount: 0,
    companyArchetypeIds: [],
    connectedRegionIds: [],
    migrationAttraction: 0,
    settlementPressure: 0,
    latestExplainedChange: undefined,
    profile: {
      regionId: "visual_region",
      terrain: "mountains",
      climate: "continental",
      elevationClass: "highland",
      fertility: "poor",
      water: "none",
      vegetation: "sparse_forest",
      settlement: stage,
      industry: STAGE_INDUSTRY[index]!,
      extraction:
        index === 0
          ? []
          : [
              {
                depositId: "visual_iron",
                resourceDefinitionId: "iron_ore",
                family: "shaft_mine",
                renewable: false,
                state: "active",
                rate: index * 100,
                cumulative: index * 20_000,
                reserveRatio: (100_000 - index * 20_000) / 100_000,
              },
            ],
      resources: [
        {
          resourceDefinitionId: "iron_ore",
          renewable: false,
          deposits: 1,
          extracted: index > 0,
        },
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
        // D3: szczegóły ASSESSED -- domyślne wartości encji, bez podanej głębokości.
        depth: undefined,
        quality: 1,
        accessibility: 1,
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
    companies: index * 3,
    housingPressure: 0.1,
    infrastructure: index,
    // R4B: ręcznie wpisany Read Model nie ma zakończonego okresu handlu.
    trade: { status: "NO_DATA", reason: "NO_COMPLETED_PERIOD" },
    economy: {
      employment: 0,
      activeCompanies: 0,
      sales: { status: "NO_DATA", reason: "NO_COMPLETED_PERIOD" },
      goods: [],
      unattributedCompanies: 0,
      methodChangedCompanies: 0,
    },
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
