import {
  createConnection,
  createContinent,
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createTechnologyState,
  createWorld,
  createWorldState,
  type WorldState,
} from "@first-cause/entities";

/**
 * Mały, syntetyczny świat na potrzeby testów M15: 3 regiony ze
 * zlinkowanym `TechnologyState` (`Region.knowledge.technologyStateId`)
 * -- istniejące World Fixture Documenty (JSON) mają wpisy w
 * `technologyStates`, ale żaden region się dziś do nich nie linkuje
 * (`load-world-fixture.ts`'s `createRegion` nigdy nie ustawia
 * `knowledge.technologyStateId` -- fixture format go dziś nie obsługuje),
 * więc uruchomienie Technology na takim fixture'cie dziś byłoby no-opem.
 * `region_connected_a`/`region_connected_b` mają wspólne `Connection`
 * (dla `technology/diffusion`); `region_isolated` nie ma żadnego.
 */
export interface TechnologyTestWorldOptions {
  readonly populationPerRegion?: number;
}

export function buildTechnologyTestWorld(
  options: TechnologyTestWorldOptions = {},
): WorldState {
  const populationPerRegion = options.populationPerRegion ?? 20_000;

  const world = createWorld({
    id: "world_technology_test",
    seed: "technology-fixture",
    name: "Technology Test World",
    configuration: { regionCount: 3, worldSizePreset: "prototype-8-12" },
  });
  const continent = createContinent({
    id: "continent_technology_test",
    worldId: world.id,
    name: "Technology Test Continent",
  });
  const geography = createRegionGeography({
    terrain: "plains",
    climate: "temperate",
    area: 100,
    fertility: 0.5,
    waterAccess: true,
    coastal: false,
    elevationClass: "lowland",
  });

  const regionIds = ["region_connected_a", "region_connected_b", "region_isolated"];
  const technologyStates = regionIds.map((regionId) =>
    createTechnologyState({ id: `technology_${regionId}`, regionId }),
  );
  const regions = regionIds.map((regionId, index) => ({
    ...createRegion({
      id: regionId,
      worldId: world.id,
      continentId: continent.id,
      name: regionId,
      geography,
    }),
    knowledge: { technologyStateId: technologyStates[index]!.id },
  }));

  const connection = createConnection({
    id: "connection_a_b",
    regionAId: "region_connected_a",
    regionBId: "region_connected_b",
    geography: { physicalDistance: 10, terrainDifficulty: 0, seasonalModifier: 1 },
  });

  const populationCohorts = regionIds.map((regionId) =>
    createPopulationCohort({
      id: `cohort_${regionId}`,
      regionId,
      ageGroup: "AGE_25_44",
      population: populationPerRegion,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
  );

  return createWorldState({
    world,
    continents: [continent],
    regions,
    connections: [connection],
    populationCohorts,
    technologyStates,
  });
}
