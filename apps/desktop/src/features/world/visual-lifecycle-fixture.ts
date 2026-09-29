import {
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createSettlement,
  createWorld,
  createWorldState,
  type WorldState,
} from "@first-cause/entities";
import {
  buildWorldSnapshot,
  runEconomyTick,
  type RngStream,
  type WorldView,
} from "@first-cause/simulation";
import { geo, VISUAL_WORLD_CONTENT } from "./visual-world-fixture.js";

/**
 * VISUAL DEVELOPMENT DATA ONLY (SET-LIFECYCLE-001 TEST FIXTURE). Nie
 * trafia do aplikacji -- używają go wyłącznie testy i harness
 * `visual-tests/world.html?fixture=extinction-before|extinction-after`.
 *
 * Stan „po” NIE jest wpisany ręcznie: świat budują fabryki
 * `@first-cause/entities`, a jeden tick liczy PRODUKCYJNY `runEconomyTick`
 * (demografia → krok 12 Settlement Growth). Kontrolowane jest tylko źródło
 * losowości demografii (kontrakt `demographyRng` dopuszcza dowolne źródło o
 * tym samym kształcie): `nextFloat() = 0` zaokrągla ułamkowy zgon w górę,
 * więc ostatni mieszkaniec „Old Haven” umiera w ticku 0.
 */
export const EXTINCT_REGION_ID = "lifecycle_old_haven_coast";
export const EXTINCT_SETTLEMENT_ID = "lifecycle_old_haven";

function lifecycleWorld(): WorldState {
  const world = createWorld({
    id: "dev_settlement_lifecycle",
    seed: "visual-settlement-lifecycle",
    name: "VISUAL DEVELOPMENT DATA",
    configuration: { regionCount: 2, worldSizePreset: "dev" },
  });
  const region = (id: string, name: string, geography: ReturnType<typeof geo>) =>
    createRegion({
      id,
      worldId: world.id,
      continentId: "dev_continent",
      name,
      geography: createRegionGeography(geography),
    });
  const coast = region(
    EXTINCT_REGION_ID,
    "Old Haven Coast",
    geo("plains", "cold", 0.2, "coast"),
  );
  const valley = region(
    "lifecycle_market_valley",
    "Market Valley",
    geo("plains", "temperate", 0.7, "river"),
  );
  const oldHaven = createSettlement({
    id: EXTINCT_SETTLEMENT_ID,
    regionId: coast.id,
    name: "Old Haven",
    foundedTick: 0,
    stage: "CAMP",
  });
  const town = createSettlement({
    id: "lifecycle_market_town",
    regionId: valley.id,
    name: "Market Town",
    foundedTick: 0,
    stage: "TOWN",
  });
  return createWorldState({
    world,
    continents: [
      { id: "dev_continent", worldId: world.id, name: "Dev", regionIds: [], tags: [] },
    ],
    regions: [coast, valley],
    settlements: [oldHaven, town],
    populationCohorts: [
      createPopulationCohort({
        id: "lifecycle_old_haven_last_resident",
        regionId: coast.id,
        settlementId: oldHaven.id,
        ageGroup: "AGE_65_PLUS",
        population: 1,
        economicClass: "WORKING",
        skillLevel: "UNSKILLED",
      }),
      createPopulationCohort({
        id: "lifecycle_market_town_adults",
        regionId: valley.id,
        settlementId: town.id,
        ageGroup: "AGE_25_44",
        population: 12_000,
        economicClass: "WORKING",
        skillLevel: "SKILLED",
      }),
    ],
    // Bez połączenia: w ticku 0 nikt nie migruje do Old Haven, więc porzucenie
    // wynika wyłącznie z demografii (jedna przyczyna, czytelny scenariusz).
  });
}

function toView(state: WorldState, facts: readonly SimulationFact[]): WorldView {
  const current = buildWorldSnapshot(state, facts, VISUAL_WORLD_CONTENT, []);
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

/** Typ faktu przyjmowanego przez `buildWorldSnapshot` (bez bezpośredniej zależności od `causality`). */
type SimulationFact = Parameters<typeof buildWorldSnapshot>[1][number];

const ROUND_UP = { nextFloat: () => 0 } as unknown as RngStream;

/** Przed: Old Haven (1 mieszkaniec, CAMP) jest aktywną osadą. */
export function extinctionBeforeView(): WorldView {
  return toView(lifecycleWorld(), []);
}

/** Po jednym produkcyjnym ticku: ostatni mieszkaniec zmarł → Old Haven ABANDONED. */
export function extinctionAfterView(): WorldView {
  const result = runEconomyTick({
    worldState: lifecycleWorld(),
    tick: 0,
    demographyRng: () => ROUND_UP,
    migrationRng: () => ROUND_UP,
  });
  const facts = result.facts.map((fact, i): SimulationFact => ({
    ...fact,
    id: `lifecycle_fact_${i}`,
    tick: 0,
  }));
  return toView(result.worldState, facts);
}

export function extinctionAfterState(): WorldState {
  return runEconomyTick({
    worldState: lifecycleWorld(),
    tick: 0,
    demographyRng: () => ROUND_UP,
    migrationRng: () => ROUND_UP,
  }).worldState;
}
