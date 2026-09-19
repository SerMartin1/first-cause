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
import { buildRegionVisualProfileReadModel } from "./region-visual-profile-read-model.js";

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
    expect(profile.industry).toBe("farm");
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

  it("derives transport tier from the highest connection infrastructure level, undefined when none", () => {
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
    expect(buildRegionVisualProfileReadModel(state, "region_a")!.transport).toBe(
      "railway",
    );
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
