import { describe, expect, it } from "vitest";
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
} from "@first-cause/entities";
import type { WorldState } from "@first-cause/entities";
import {
  buildConnectionVisualProfile,
  buildRegionVisualProfileReadModel,
} from "./region-visual-profile-read-model.js";
import { discoverDeposit } from "../systems/resources/deposit-lifecycle.js";
import { extractFromDeposit } from "../systems/resources/extraction.js";

function buildFixtureState(overrides?: {
  terrain?: "plains" | "hills" | "mountains" | "forest" | "desert" | "wetland";
  fertility?: number;
  coastal?: boolean;
  waterAccess?: boolean;
}) {
  const geography = createRegionGeography({
    terrain: overrides?.terrain ?? "plains",
    climate: "temperate",
    area: 10,
    fertility: overrides?.fertility ?? 0.2,
    waterAccess: overrides?.waterAccess ?? false,
    coastal: overrides?.coastal ?? false,
    elevationClass: "lowland",
  });
  const world = createWorld({
    id: "world_001",
    seed: "seed-a",
    name: "W",
    configuration: { regionCount: 1, worldSizePreset: "test" },
  });
  const region = createRegion({
    id: "region_a",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region A",
    geography,
  });
  const inventory = createInventory({
    id: "inventory_001",
    ownerType: "company",
    ownerId: "company_001",
    locationRegionId: region.id,
  });
  const cohort = createPopulationCohort({
    id: "cohort_001",
    regionId: region.id,
    ageGroup: "AGE_25_44",
    population: 10,
    economicClass: "WORKING",
    skillLevel: "SKILLED",
  });
  const company = createCompany({
    id: "company_001",
    archetypeId: "farmstead",
    name: "Co",
    foundedTick: 0,
    regionId: region.id,
    ownerType: "individual",
    ownerEntityId: cohort.id,
    inventoryId: inventory.id,
  });

  return { world, region, inventory, cohort, company };
}

function stateWith(fixture: ReturnType<typeof buildFixtureState>, extra?: {
  settlements?: Parameters<typeof createSettlement>[0][];
  deposits?: Parameters<typeof createResourceDeposit>[0][];
  connections?: Parameters<typeof createConnection>[0][];
}): WorldState {
  const settlements = (extra?.settlements ?? []).map((input) => createSettlement(input));
  const deposits = (extra?.deposits ?? []).map((input) => createResourceDeposit(input));
  const connections = (extra?.connections ?? []).map((input) => createConnection(input));

  return createWorldState({
    world: fixture.world,
    continents: [
      { id: "continent_001", worldId: fixture.world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [fixture.region],
    settlements,
    resourceDeposits: deposits,
    connections,
    populationCohorts: [fixture.cohort],
    inventories: [fixture.inventory],
    companies: [fixture.company],
  });
}

describe("buildRegionVisualProfileReadModel", () => {
  it("returns undefined for an unknown region", () => {
    const fixture = buildFixtureState();
    expect(
      buildRegionVisualProfileReadModel(stateWith(fixture), "nope"),
    ).toBeUndefined();
  });

  it("derives terrain/water/vegetation from real geography, no invented data", () => {
    const fixture = buildFixtureState({
      terrain: "forest",
      coastal: true,
      waterAccess: true,
    });
    const profile = buildRegionVisualProfileReadModel(stateWith(fixture), "region_a")!;

    expect(profile.terrain).toBe("forest");
    expect(profile.water).toBe("coast"); // coastal ma pierwszeństwo przed samym waterAccess
    expect(profile.vegetation).toBe("dense_forest"); // forestPressure domyślnie 0
    expect(profile.settlement).toBeUndefined();
    expect(profile.industry).toBeUndefined(); // nie podano mapy sektorów
    expect(profile.transport).toBeUndefined();
    expect(profile.energy).toBeUndefined();
    expect(profile.landmarkResourceDefinitionId).toBeUndefined();
  });

  it("maps fertile non-forest terrain to grassland, dry terrain to none", () => {
    const fertile = buildFixtureState({ fertility: 0.9 });
    expect(
      buildRegionVisualProfileReadModel(stateWith(fertile), "region_a")!.vegetation,
    ).toBe("grassland");

    const dry = buildFixtureState({ fertility: 0.1 });
    expect(
      buildRegionVisualProfileReadModel(stateWith(dry), "region_a")!.vegetation,
    ).toBe("none");
  });

  it("maps an agriculture sector to fields vegetation and farm industry via the injected sector map", () => {
    const fixture = buildFixtureState({ fertility: 0.9 });
    const profile = buildRegionVisualProfileReadModel(stateWith(fixture), "region_a", {
      sectorByCompanyArchetypeId: { farmstead: "agriculture" },
    })!;

    expect(profile.vegetation).toBe("fields");
    expect(profile.industry?.map((entry) => entry.sector)).toEqual(["agriculture"]);
  });

  it("picks the largest non-CAMP settlement stage, omits CAMP-only regions", () => {
    const fixture = buildFixtureState();
    const withCampOnly = stateWith(fixture, {
      settlements: [
        {
          id: "settlement_camp",
          regionId: "region_a",
          name: "Camp",
          foundedTick: 0,
          stage: "CAMP",
        },
      ],
    });
    expect(
      buildRegionVisualProfileReadModel(withCampOnly, "region_a")!.settlement,
    ).toBeUndefined();

    const withTown = stateWith(fixture, {
      settlements: [
        {
          id: "settlement_camp",
          regionId: "region_a",
          name: "Camp",
          foundedTick: 0,
          stage: "CAMP",
        },
        {
          id: "settlement_town",
          regionId: "region_a",
          name: "Town",
          foundedTick: 0,
          stage: "TOWN",
        },
      ],
    });
    expect(buildRegionVisualProfileReadModel(withTown, "region_a")!.settlement).toBe(
      "TOWN",
    );
  });

  it("derives the vignette transport summary from content route families, never from the level alone", () => {
    const fixture = buildFixtureState();
    const other = createRegion({
      id: "region_b",
      worldId: fixture.world.id,
      continentId: "continent_001",
      name: "Region B",
      geography: fixture.region.geography,
    });

    const noConnections = stateWith(fixture);
    expect(
      buildRegionVisualProfileReadModel(noConnections, "region_a")!.transport,
    ).toBeUndefined();

    const state: WorldState = createWorldState({
      world: fixture.world,
      continents: [
        { id: "continent_001", worldId: fixture.world.id, name: "Main", regionIds: [], tags: [] },
      ],
      regions: [fixture.region, other],
      connections: [
        createConnection({
          id: "connection_001",
          regionAId: "region_a",
          regionBId: "region_b",
          geography: { physicalDistance: 10, terrainDifficulty: 0, seasonalModifier: 1 },
          infrastructure: { level: 5, transportModes: ["cart"], capacity: 10 },
        }),
      ],
      populationCohorts: [fixture.cohort],
      inventories: [fixture.inventory],
      companies: [fixture.company],
    });
    // v1 zgadywał „railway” z samego `level: 5` -- v2 bez mapy rodzin tras nie wie nic.
    expect(buildRegionVisualProfileReadModel(state, "region_a")!.transport).toBeUndefined();
    expect(
      buildRegionVisualProfileReadModel(state, "region_a", {
        routeFamilyByTransportModeId: { cart: "road" },
      })!.transport,
    ).toBe("road");
  });

  it("picks a dominant landmark resource only when discovered/assessed and strictly dominant", () => {
    const fixture = buildFixtureState();

    const undiscovered = stateWith(fixture, {
      deposits: [
        { id: "d1", resourceDefinitionId: "iron_ore", regionId: "region_a", initialQuantity: 100, renewable: false },
      ],
    });
    expect(
      buildRegionVisualProfileReadModel(undiscovered, "region_a")!.landmarkResourceDefinitionId,
    ).toBeUndefined();

    const state = stateWith(fixture, {
      deposits: [
        { id: "d1", resourceDefinitionId: "iron_ore", regionId: "region_a", initialQuantity: 100, renewable: false },
        { id: "d2", resourceDefinitionId: "iron_ore", regionId: "region_a", initialQuantity: 100, renewable: false },
        { id: "d3", resourceDefinitionId: "coal", regionId: "region_a", initialQuantity: 100, renewable: false },
      ],
    });
    const discovered: WorldState = {
      ...state,
      resourceDeposits: Object.fromEntries(
        Object.entries(state.resourceDeposits).map(([id, deposit]) => [
          id,
          { ...deposit, discovery: { ...deposit.discovery, status: "DISCOVERED" as const } },
        ]),
      ),
    };
    expect(
      buildRegionVisualProfileReadModel(discovered, "region_a")!.landmarkResourceDefinitionId,
    ).toBe("iron_ore");
  });

  it("is deterministic: same inputs always produce the same vignetteSeed", () => {
    const fixture = buildFixtureState({ terrain: "hills", fertility: 0.6 });
    const state = stateWith(fixture);

    const first = buildRegionVisualProfileReadModel(state, "region_a")!;
    const second = buildRegionVisualProfileReadModel(state, "region_a")!;
    expect(first.vignetteSeed).toBe(second.vignetteSeed);
    expect(Number.isInteger(first.vignetteSeed)).toBe(true);
  });

  it("changes vignetteSeed when the visual state changes, not on unrelated noise", () => {
    const fixture = buildFixtureState({ terrain: "hills", fertility: 0.6 });
    const baseline = buildRegionVisualProfileReadModel(stateWith(fixture), "region_a")!;

    const changed = buildFixtureState({ terrain: "mountains", fertility: 0.6 });
    const changedProfile = buildRegionVisualProfileReadModel(
      stateWith(changed),
      "region_a",
    )!;

    expect(changedProfile.vignetteSeed).not.toBe(baseline.vignetteSeed);
  });
});

/* ------------------------------------------------------------------ */
/* M21-VIS-R2 -- RegionVisualProfile v2 (Atlas Spec v1.3 §28.1, §28.6) */
/* ------------------------------------------------------------------ */

const SECTORS = {
  farmstead: "agriculture",
  mine: "mining",
  smelter: "metallurgy",
  bakery: "food_processing",
} as const;

type DiscoveryStatus = "UNKNOWN" | "SUSPECTED" | "DISCOVERED" | "ASSESSED";

function multiState(input: {
  companies?: {
    id: string;
    archetypeId: string;
    employees?: number;
    output?: number;
    status?: "active" | "distressed" | "closed";
  }[];
  deposits?: {
    id: string;
    resourceDefinitionId: string;
    status?: DiscoveryStatus;
    extract?: number;
    history?: number;
    quantity?: number;
  }[];
  connections?: { id: string; level: number; modes: string[] }[];
}): WorldState {
  const fixture = buildFixtureState({ fertility: 0.5 });
  const other = createRegion({
    id: "region_b",
    worldId: fixture.world.id,
    continentId: "continent_001",
    name: "Region B",
    geography: fixture.region.geography,
  });
  const companies = (input.companies ?? []).map((spec) => {
    const company = createCompany({
      id: spec.id,
      archetypeId: spec.archetypeId,
      name: spec.id,
      foundedTick: 0,
      regionId: "region_a",
      ownerType: "individual",
      ownerEntityId: fixture.cohort.id,
      inventoryId: `inv_${spec.id}`,
    });
    return {
      ...company,
      workforce: { ...company.workforce, employees: spec.employees ?? 0 },
      production: { ...company.production, outputLastTick: spec.output ?? 0 },
      status: {
        active: spec.status !== "closed",
        distressed: spec.status === "distressed",
        bankrupt: spec.status === "closed",
      },
    };
  });
  const deposits = (input.deposits ?? []).map((spec) => {
    let deposit = createResourceDeposit({
      id: spec.id,
      resourceDefinitionId: spec.resourceDefinitionId,
      regionId: "region_a",
      initialQuantity: spec.quantity ?? 1000,
      renewable: false,
    });
    if (spec.status && spec.status !== "UNKNOWN")
      deposit = discoverDeposit(deposit, {
        tick: 1,
        targetStatus: spec.status,
        confidence: 1,
      }).deposit;
    if (spec.history)
      deposit = extractFromDeposit(deposit, { tick: 2, amount: spec.history }).deposit;
    if (spec.extract !== undefined)
      deposit = extractFromDeposit(deposit, { tick: 3, amount: spec.extract }).deposit;
    return deposit;
  });
  return createWorldState({
    world: fixture.world,
    continents: [
      {
        id: "continent_001",
        worldId: fixture.world.id,
        name: "Main",
        regionIds: [],
        tags: [],
      },
    ],
    regions: [fixture.region, other],
    resourceDeposits: deposits,
    connections: (input.connections ?? []).map((c) =>
      createConnection({
        id: c.id,
        regionAId: "region_a",
        regionBId: "region_b",
        geography: { physicalDistance: 10, terrainDifficulty: 0, seasonalModifier: 1 },
        infrastructure: {
          level: c.level,
          transportModes: c.modes,
          capacity: c.level * 10,
        },
      }),
    ),
    populationCohorts: [fixture.cohort],
    inventories: companies.map((c) =>
      createInventory({
        id: c.inventoryId,
        ownerType: "company",
        ownerId: c.id,
        locationRegionId: "region_a",
      }),
    ),
    companies,
  });
}

const ROUTES = { cart: "road", railway: "rail", river: "waterway" } as const;

describe("RegionVisualProfile v2 (M21-VIS-R2)", () => {
  it("A: a region without industry and extraction has empty lists (sectors known), not invented activity", () => {
    const profile = buildRegionVisualProfileReadModel(multiState({}), "region_a", {
      sectorByCompanyArchetypeId: SECTORS,
    })!;
    expect(profile.industry).toEqual([]);
    expect(profile.extraction).toEqual([]);
    expect(profile.resources).toEqual([]);
  });

  it("B: a region with one activity has exactly one industry entry with scale and state from the data", () => {
    const profile = buildRegionVisualProfileReadModel(
      multiState({
        companies: [{ id: "c1", archetypeId: "farmstead", employees: 12, output: 30 }],
      }),
      "region_a",
      { sectorByCompanyArchetypeId: SECTORS },
    )!;
    expect(profile.industry).toEqual([
      {
        sector: "agriculture",
        activeCompanies: 1,
        closedCompanies: 0,
        employees: 12,
        capacity: 0,
        outputLastTick: 30,
        scale: "manufactory",
        state: "active",
      },
    ]);
  });

  it("C: many industry[] entries coexist -- one per sector, each with its own scale and state", () => {
    const profile = buildRegionVisualProfileReadModel(
      multiState({
        companies: [
          { id: "c1", archetypeId: "mine", employees: 300, output: 50 },
          { id: "c2", archetypeId: "mine", employees: 20, output: 5 },
          { id: "c3", archetypeId: "smelter", employees: 1200, output: 80 },
          {
            id: "c4",
            archetypeId: "bakery",
            employees: 4,
            output: 0,
            status: "distressed",
          },
          { id: "c5", archetypeId: "farmstead", employees: 5, status: "closed" },
          { id: "c6", archetypeId: "not_in_content_map", employees: 99, output: 9 },
        ],
      }),
      "region_a",
      { sectorByCompanyArchetypeId: SECTORS },
    )!;
    expect(
      profile.industry!.map((i) => [i.sector, i.state, i.scale, i.activeCompanies]),
    ).toEqual([
      ["metallurgy", "active", "industrial_complex", 1],
      ["mining", "active", "large_plant", 2],
      ["food_processing", "stressed", "workshop", 1],
      ["agriculture", "closed", undefined, 0],
    ]);
    // Zamknięta farma nie udaje aktywnych pól.
    expect(profile.vegetation).not.toBe("fields");
  });

  it("D: many extraction[] entries, separate from resources[] -- a known deposit may exist without extraction", () => {
    const profile = buildRegionVisualProfileReadModel(
      multiState({
        deposits: [
          {
            id: "d_iron",
            resourceDefinitionId: "iron_ore",
            status: "ASSESSED",
            history: 100,
            extract: 40,
          },
          {
            id: "d_coal",
            resourceDefinitionId: "coal",
            status: "DISCOVERED",
            history: 60,
            extract: 0,
          },
          {
            id: "d_stone",
            resourceDefinitionId: "stone",
            status: "ASSESSED",
            quantity: 50,
            extract: 50,
          },
          { id: "d_copper", resourceDefinitionId: "copper", status: "DISCOVERED" },
        ],
      }),
      "region_a",
      { extractionFamilyByResourceId: { iron_ore: "shaft_mine", coal: "open_pit" } },
    )!;
    expect(profile.extraction.map((e) => [e.depositId, e.family, e.state])).toEqual([
      ["d_coal", "open_pit", "idle"],
      ["d_iron", "shaft_mine", "active"],
      ["d_stone", undefined, "depleted"],
    ]);
    expect(
      profile.extraction.find((e) => e.depositId === "d_iron")!.reserveRatio,
    ).toBeCloseTo(0.86);
    // Złoże bez wydobycia to znany zasób, nie wydobycie; wyczerpane nie jest „znanym zasobem”.
    expect(profile.resources.map((r) => [r.resourceDefinitionId, r.extracted])).toEqual([
      ["coal", true],
      ["copper", false],
      ["iron_ore", true],
    ]);
  });

  it("E: a connection without infrastructure has no routes", () => {
    const state = multiState({ connections: [{ id: "k0", level: 0, modes: [] }] });
    const connection = buildConnectionVisualProfile(state, "k0", {
      routeFamilyByTransportModeId: ROUTES,
    })!;
    expect(connection.routes).toEqual([]);
    expect(connection.level).toBe(0);
    expect(
      buildRegionVisualProfileReadModel(state, "region_a")!.transport,
    ).toBeUndefined();
  });

  it("F: a connection with one transport mode carries one route family on the edge", () => {
    const state = multiState({ connections: [{ id: "k1", level: 2, modes: ["cart"] }] });
    expect(
      buildConnectionVisualProfile(state, "k1", { routeFamilyByTransportModeId: ROUTES })!
        .routes,
    ).toEqual([{ family: "road", transportModeIds: ["cart"] }]);
  });

  it("G: a connection with several infrastructure properties keeps all of them, grouped by family", () => {
    const state = multiState({
      connections: [
        { id: "k2", level: 4, modes: ["river", "cart", "railway", "mystery_mode"] },
      ],
    });
    const connection = buildConnectionVisualProfile(state, "k2", {
      routeFamilyByTransportModeId: ROUTES,
    })!;
    expect(connection.routes).toEqual([
      { family: "rail", transportModeIds: ["railway"] },
      { family: "road", transportModeIds: ["cart"] },
      { family: "waterway", transportModeIds: ["river"] },
      { family: undefined, transportModeIds: ["mystery_mode"] },
    ]);
    // Infrastruktura należy do połączenia; skrót regionu = najlepsza trasa lądowa.
    expect(
      buildRegionVisualProfileReadModel(state, "region_a", {
        routeFamilyByTransportModeId: ROUTES,
      })!.transport,
    ).toBe("railway");
  });

  it("H: missing data is not zero -- no sector map => industry undefined; unmapped family => undefined, not a guess", () => {
    const state = multiState({
      companies: [{ id: "c1", archetypeId: "mine", employees: 10, output: 1 }],
      deposits: [
        { id: "d1", resourceDefinitionId: "iron_ore", status: "ASSESSED", extract: 5 },
      ],
      connections: [{ id: "k1", level: 2, modes: ["cart"] }],
    });
    const noContent = buildRegionVisualProfileReadModel(state, "region_a")!;
    expect(noContent.industry).toBeUndefined();
    expect(noContent.extraction[0]!.family).toBeUndefined();
    expect(buildConnectionVisualProfile(state, "k1")!.routes).toEqual([
      { family: undefined, transportModeIds: ["cart"] },
    ]);
    expect(
      buildRegionVisualProfileReadModel(multiState({}), "region_a", {
        sectorByCompanyArchetypeId: SECTORS,
      })!.industry,
    ).toEqual([]);
  });

  it("I: UNKNOWN / SUSPECTED deposits never leak into extraction[], resources[] or the landmark -- even when extracted", () => {
    const state = multiState({
      deposits: [
        { id: "d_hidden", resourceDefinitionId: "gold", status: "UNKNOWN", extract: 30 },
        {
          id: "d_rumour",
          resourceDefinitionId: "silver",
          status: "SUSPECTED",
          history: 20,
        },
      ],
    });
    const profile = buildRegionVisualProfileReadModel(state, "region_a", {
      extractionFamilyByResourceId: { gold: "shaft_mine", silver: "shaft_mine" },
    })!;
    expect(profile.extraction).toEqual([]);
    expect(profile.resources).toEqual([]);
    expect(profile.landmarkResourceDefinitionId).toBeUndefined();
    expect(JSON.stringify(profile)).not.toMatch(/gold|silver|d_hidden|d_rumour/);
  });

  it("is a pure read: building profiles never mutates WorldState", () => {
    const state = multiState({
      companies: [{ id: "c1", archetypeId: "mine", employees: 10, output: 1 }],
      deposits: [
        { id: "d1", resourceDefinitionId: "iron_ore", status: "ASSESSED", extract: 5 },
      ],
      connections: [{ id: "k1", level: 2, modes: ["cart"] }],
    });
    const before = JSON.stringify(state);
    buildRegionVisualProfileReadModel(state, "region_a", {
      sectorByCompanyArchetypeId: SECTORS,
      routeFamilyByTransportModeId: ROUTES,
    });
    buildConnectionVisualProfile(state, "k1", { routeFamilyByTransportModeId: ROUTES });
    expect(JSON.stringify(state)).toBe(before);
  });
});
