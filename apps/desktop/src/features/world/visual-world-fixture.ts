import {
  createCompany,
  createConnection,
  createInventory,
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createResourceDeposit,
  createSettlement,
  createWorld,
  createWorldState,
  type Company,
  type CreateRegionGeographyInput,
  type ResourceDeposit,
  type SettlementStage,
} from "@first-cause/entities";
import {
  buildWorldSnapshot,
  discoverDeposit,
  extractFromDeposit,
  type BuildRegionVisualProfileOptions,
  type WorldView,
} from "@first-cause/simulation";

/**
 * VISUAL DEVELOPMENT DATA ONLY (M21-VIS-R2 TEST FIXTURE). Nie jest
 * scenariuszem, historią ani prognozą; nie trafia do aplikacji -- używają
 * go wyłącznie testy i harness `visual-tests/world.html`.
 *
 * W odróżnieniu od `visual-stress-fixture.ts` (ręcznie wpisany Read
 * Model) ten fixture buduje prawdziwy `WorldState` fabrykami
 * `@first-cause/entities`, odkrywa i eksploatuje złoża funkcjami
 * `@first-cause/simulation`, a widok wylicza PRODUKCYJNY
 * `buildWorldSnapshot` -- profil wizualny v2 nie jest więc wpisany ręcznie.
 *
 * Referencyjny region „Ironridge” odpowiada Atlas Spec v1.3 §22 (iron +
 * coal, metallurgy, road + rail). Sektory, zasoby i tryby transportu
 * spoza obecnego contentu (coal, limestone, fish, railway, ship; sektory
 * mining / metallurgy / wood_processing / shipbuilding / quarrying) są
 * danymi deweloperskimi tego fixture'u, podanymi przez jego własne mapy
 * rodzin wizualnych -- nie dodają niczego do contentu gry.
 */
export const VISUAL_WORLD_CONTENT: BuildRegionVisualProfileOptions = {
  sectorByCompanyArchetypeId: {
    grain_farm: "agriculture",
    bakery: "food_processing",
    dev_iron_mine: "mining",
    dev_smelter: "metallurgy",
    dev_workshop: "manufacturing",
    dev_sawmill: "wood_processing",
    dev_shipyard: "shipbuilding",
    dev_quarry_company: "quarrying",
  },
  extractionFamilyByResourceId: {
    iron_ore: "shaft_mine",
    grain: "cultivation",
    timber: "logging",
    dev_coal: "open_pit",
    dev_limestone: "quarry",
    dev_fish: "fishing",
  },
  routeFamilyByTransportModeId: {
    foot_porter: "path",
    pack_animal: "path",
    cart: "road",
    river: "waterway",
    dev_railway: "rail",
    dev_ship: "sea_lane",
  },
};

export interface VisualSettlementSpec {
  readonly stage: SettlementStage;
  readonly population: number;
  /** R3: nazwa kolejnej osady regionu (pierwsza dziedziczy nazwę regionu). */
  readonly name?: string;
}

export interface RegionSpec {
  readonly id: string;
  readonly name: string;
  readonly geography: CreateRegionGeographyInput;
  readonly settlement?: VisualSettlementSpec;
  /** R3: wiele osad w jednym regionie (dopisywane po `settlement`). */
  readonly settlements?: readonly VisualSettlementSpec[];
  readonly companies?: readonly {
    readonly archetypeId: string;
    readonly employees: number;
    readonly output: number;
    readonly status?: "active" | "distressed" | "closed";
  }[];
  readonly deposits?: readonly {
    readonly resourceId: string;
    readonly quantity: number;
    readonly renewable?: boolean;
    readonly status: "UNKNOWN" | "DISCOVERED" | "ASSESSED";
    /** Wydobycie w ostatnim ticku; `"deplete"` wybiera cały zasób. */
    readonly extract?: number | "deplete";
    /** Wydobycie historyczne przed ostatnim tickiem (wtedy bieżące = 0, jeśli brak `extract`). */
    readonly history?: number;
  }[];
}

export const geo = (
  terrain: CreateRegionGeographyInput["terrain"],
  climate: CreateRegionGeographyInput["climate"],
  fertility: number,
  water: "none" | "river" | "coast" = "none",
): CreateRegionGeographyInput => ({
  terrain,
  climate,
  area: 100,
  fertility,
  waterAccess: water !== "none",
  coastal: water === "coast",
  elevationClass:
    terrain === "mountains" ? "highland" : terrain === "hills" ? "upland" : "lowland",
});

const REGIONS: readonly RegionSpec[] = [
  {
    id: "dev_ironridge",
    name: "Ironridge",
    geography: geo("mountains", "continental", 0.15),
    settlement: { stage: "TOWN", population: 14_000 },
    companies: [
      { archetypeId: "dev_iron_mine", employees: 180, output: 90 },
      { archetypeId: "dev_iron_mine", employees: 60, output: 25 },
      { archetypeId: "dev_smelter", employees: 320, output: 140 },
      { archetypeId: "dev_workshop", employees: 12, output: 0 },
    ],
    deposits: [
      {
        resourceId: "iron_ore",
        quantity: 60_000,
        status: "ASSESSED",
        extract: 400,
        history: 12_000,
      },
      {
        resourceId: "dev_coal",
        quantity: 90_000,
        status: "ASSESSED",
        extract: 650,
        history: 20_000,
      },
    ],
  },
  {
    id: "dev_green_plain",
    name: "Green Plain",
    geography: geo("plains", "temperate", 0.85, "river"),
    settlement: { stage: "VILLAGE", population: 1_800 },
    companies: [
      { archetypeId: "grain_farm", employees: 40, output: 120 },
      { archetypeId: "bakery", employees: 8, output: 30 },
    ],
    deposits: [
      {
        resourceId: "grain",
        quantity: 50_000,
        renewable: true,
        status: "DISCOVERED",
        extract: 900,
      },
    ],
  },
  {
    id: "dev_timber_reach",
    name: "Timber Reach",
    geography: geo("forest", "temperate", 0.5, "river"),
    settlement: { stage: "HAMLET", population: 420 },
    companies: [
      { archetypeId: "dev_sawmill", employees: 26, output: 40 },
      { archetypeId: "bakery", employees: 3, output: 0, status: "closed" },
    ],
    deposits: [
      {
        resourceId: "timber",
        quantity: 3_000,
        renewable: true,
        status: "DISCOVERED",
        extract: 140,
      },
    ],
  },
  {
    id: "dev_harbour",
    name: "Harbour Coast",
    geography: geo("plains", "mediterranean", 0.55, "coast"),
    settlement: { stage: "CITY", population: 140_000 },
    companies: [
      { archetypeId: "dev_shipyard", employees: 1_400, output: 12 },
      { archetypeId: "bakery", employees: 90, output: 300 },
      { archetypeId: "dev_workshop", employees: 60, output: 45 },
    ],
    deposits: [
      {
        resourceId: "dev_fish",
        quantity: 8_000,
        renewable: true,
        status: "DISCOVERED",
        extract: 300,
      },
    ],
  },
  {
    id: "dev_greyhills",
    name: "Greyhills",
    geography: geo("hills", "continental", 0.3),
    settlement: { stage: "VILLAGE", population: 900 },
    companies: [
      {
        archetypeId: "dev_quarry_company",
        employees: 14,
        output: 0,
        status: "distressed",
      },
    ],
    deposits: [
      {
        resourceId: "dev_limestone",
        quantity: 2_000,
        status: "ASSESSED",
        extract: "deplete",
      },
      { resourceId: "iron_ore", quantity: 20_000, status: "DISCOVERED" },
    ],
  },
  {
    id: "dev_dry_basin",
    name: "Dry Basin",
    geography: geo("desert", "arid", 0.05),
    settlement: { stage: "HAMLET", population: 150 },
    // Złoże istniejące fizycznie, nieznane światu: warstwa wizualna nie może go ujawnić
    // (TECH-009/TECH-010). Eksploatacja takiego złoża jest niemożliwa (D2).
    deposits: [{ resourceId: "dev_coal", quantity: 40_000, status: "UNKNOWN" }],
  },
  {
    id: "dev_north_tundra",
    name: "North Reach",
    geography: geo("plains", "cold", 0.2),
    settlement: { stage: "HAMLET", population: 260 },
  },
  {
    id: "dev_marsh",
    name: "Reed Marsh",
    geography: geo("wetland", "temperate", 0.45, "river"),
  },
];

export interface ConnectionSpec {
  readonly a: string;
  readonly b: string;
  readonly level: number;
  readonly modes: readonly string[];
  readonly disrupted?: boolean;
}

const CONNECTIONS: readonly {
  readonly a: string;
  readonly b: string;
  readonly level: number;
  readonly modes: readonly string[];
  readonly disrupted?: boolean;
}[] = [
  { a: "dev_ironridge", b: "dev_green_plain", level: 4, modes: ["cart", "dev_railway"] },
  { a: "dev_green_plain", b: "dev_harbour", level: 3, modes: ["cart", "river"] },
  {
    a: "dev_green_plain",
    b: "dev_timber_reach",
    level: 1,
    modes: ["foot_porter", "river"],
  },
  { a: "dev_harbour", b: "dev_greyhills", level: 2, modes: ["cart"], disrupted: true },
  { a: "dev_ironridge", b: "dev_greyhills", level: 1, modes: ["pack_animal"] },
  { a: "dev_harbour", b: "dev_dry_basin", level: 1, modes: ["dev_ship"] },
  { a: "dev_timber_reach", b: "dev_north_tundra", level: 0, modes: [] },
  { a: "dev_marsh", b: "dev_green_plain", level: 1, modes: ["dev_unmapped_mode"] },
];

function withCompanyState(
  company: Company,
  spec: NonNullable<RegionSpec["companies"]>[number],
): Company {
  return {
    ...company,
    workforce: { ...company.workforce, employees: spec.employees },
    production: {
      ...company.production,
      capacity: spec.employees,
      outputLastTick: spec.output,
    },
    status: {
      active: spec.status !== "closed",
      distressed: spec.status === "distressed",
      bankrupt: spec.status === "closed",
    },
    closedTick: spec.status === "closed" ? 10 : undefined,
  };
}

function preparedDeposit(
  regionId: string,
  spec: NonNullable<RegionSpec["deposits"]>[number],
): ResourceDeposit {
  let deposit = createResourceDeposit({
    id: `${regionId}_${spec.resourceId}`,
    resourceDefinitionId: spec.resourceId,
    regionId,
    initialQuantity: spec.quantity,
    renewable: spec.renewable ?? false,
    ...(spec.renewable
      ? {
          renewableState: {
            regenerationRate: 0.03,
            sustainableYield: spec.quantity / 50,
            carryingCapacity: spec.quantity,
          },
        }
      : {}),
  });
  if (spec.status !== "UNKNOWN")
    deposit = discoverDeposit(deposit, {
      tick: 1,
      targetStatus: spec.status,
      confidence: 1,
    }).deposit;
  if (spec.history)
    deposit = extractFromDeposit(deposit, { tick: 2, amount: spec.history }).deposit;
  if (spec.extract !== undefined)
    deposit = extractFromDeposit(deposit, {
      tick: 3,
      amount: spec.extract === "deplete" ? deposit.stock.quantity : spec.extract,
    }).deposit;
  else if (spec.history)
    deposit = extractFromDeposit(deposit, { tick: 3, amount: 0 }).deposit;
  return deposit;
}

/** Wszystkie osady regionu: `settlement` (id `<region>_settlement`), potem `settlements[]`. */
function settlementsOf(
  spec: RegionSpec,
): { readonly id: string; readonly spec: VisualSettlementSpec }[] {
  return [
    ...(spec.settlement ? [{ id: `${spec.id}_settlement`, spec: spec.settlement }] : []),
    ...(spec.settlements ?? []).map((settlement, i) => ({
      id: `${spec.id}_settlement_${i + 1}`,
      spec: settlement,
    })),
  ];
}

export function visualWorldView(): WorldView {
  return buildVisualWorldView({
    id: "dev_visual_world",
    seed: "visual-r2",
    regions: REGIONS,
    connections: CONNECTIONS,
  });
}

/**
 * Buduje prawdziwy `WorldState` z opisu regionów i liczy widok
 * PRODUKCYJNYM `buildWorldSnapshot` (R2; R3 dokłada fixture'y morfologii
 * w `visual-morphology-fixture.ts`). VISUAL DEVELOPMENT DATA ONLY.
 */
export function buildVisualWorldView(input: {
  readonly id: string;
  readonly seed: string;
  readonly regions: readonly RegionSpec[];
  readonly connections: readonly ConnectionSpec[];
}): WorldView {
  const REGIONS = input.regions;
  const CONNECTIONS = input.connections;
  const world = createWorld({
    id: input.id,
    seed: input.seed,
    name: "VISUAL DEVELOPMENT DATA",
    configuration: { regionCount: REGIONS.length, worldSizePreset: "dev" },
  });
  const regions = REGIONS.map((spec) =>
    createRegion({
      id: spec.id,
      worldId: world.id,
      continentId: "dev_continent",
      name: spec.name,
      geography: createRegionGeography(spec.geography),
    }),
  );
  const settlements = REGIONS.flatMap((spec) =>
    settlementsOf(spec).map(({ id, spec: settlement }, i) =>
      createSettlement({
        id,
        regionId: spec.id,
        name: settlement.name ?? (i === 0 ? spec.name : `${spec.name} ${i + 1}`),
        foundedTick: 0,
        stage: settlement.stage,
      }),
    ),
  );
  // Jedna kohorta na osadę (id pierwszej bez zmian względem R2); region bez osad -- pusta kohorta.
  const cohorts = REGIONS.flatMap((spec) => {
    const own = settlementsOf(spec);
    if (!own.length)
      return [
        createPopulationCohort({
          id: `${spec.id}_cohort`,
          regionId: spec.id,
          ageGroup: "AGE_25_44",
          population: 0,
          economicClass: "WORKING",
          skillLevel: "SKILLED",
        }),
      ];
    return own.map(({ id, spec: settlement }, i) =>
      createPopulationCohort({
        id: i === 0 ? `${spec.id}_cohort` : `${id}_cohort`,
        regionId: spec.id,
        settlementId: id,
        ageGroup: "AGE_25_44",
        population: settlement.population,
        economicClass: "WORKING",
        skillLevel: "SKILLED",
      }),
    );
  });
  const companySpecs = REGIONS.flatMap((spec) =>
    (spec.companies ?? []).map((company, i) => ({ region: spec.id, i, company })),
  );
  const inventories = companySpecs.map(({ region, i }) =>
    createInventory({
      id: `${region}_inventory_${i}`,
      ownerType: "company",
      ownerId: `${region}_company_${i}`,
      locationRegionId: region,
    }),
  );
  const companies = companySpecs.map(({ region, i, company }) =>
    withCompanyState(
      createCompany({
        id: `${region}_company_${i}`,
        archetypeId: company.archetypeId,
        name: `${company.archetypeId} ${i + 1}`,
        foundedTick: 0,
        regionId: region,
        ownerType: "individual",
        ownerEntityId: `${region}_cohort`,
        inventoryId: `${region}_inventory_${i}`,
      }),
      company,
    ),
  );
  const deposits = REGIONS.flatMap((spec) =>
    (spec.deposits ?? []).map((deposit) => preparedDeposit(spec.id, deposit)),
  );
  const connections = CONNECTIONS.map((c, i) => {
    const connection = createConnection({
      id: `dev_connection_${i}`,
      regionAId: c.a,
      regionBId: c.b,
      geography: { physicalDistance: 40, terrainDifficulty: 0.5, seasonalModifier: 1 },
      infrastructure: { level: c.level, transportModes: c.modes, capacity: c.level * 25 },
    });
    return c.disrupted
      ? { ...connection, currentState: { ...connection.currentState, disrupted: true } }
      : connection;
  });
  const state = createWorldState({
    world,
    continents: [
      { id: "dev_continent", worldId: world.id, name: "Dev", regionIds: [], tags: [] },
    ],
    regions,
    settlements,
    populationCohorts: cohorts,
    inventories,
    companies,
    resourceDeposits: deposits,
    connections,
  });
  const current = buildWorldSnapshot(state, [], VISUAL_WORLD_CONTENT, []);
  return {
    type: "WORLD_VIEW",
    current,
    baseline: undefined,
    liveTick: current.summary.currentTick,
    availableTicks: [current.summary.currentTick],
    events: [],
    speed: 0,
  };
}
