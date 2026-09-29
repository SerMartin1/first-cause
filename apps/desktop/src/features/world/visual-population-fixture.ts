import type { WorldView } from "@first-cause/simulation";
import {
  buildVisualWorldView,
  geo,
  type RegionSpec,
  type VisualSettlementSpec,
} from "./visual-world-fixture.js";
import { civilizationView } from "./visual-morphology-fixture.js";

/**
 * VISUAL DEVELOPMENT DATA ONLY (M21-VIS-R4 TEST FIXTURE). Nie jest
 * scenariuszem ani prognozą; nie trafia do aplikacji -- używają go wyłącznie
 * testy i harness `visual-tests/world.html?fixture=...`. Świat budowany
 * prawdziwymi fabrykami `@first-cause/entities`, widok liczony produkcyjnym
 * `buildWorldSnapshot` (ten sam builder co fixture'y R2/R3).
 *
 * „Brak danych”: symulacja zawsze zna `totalPopulation`, więc stan
 * niedostępnej populacji powstaje tu jako Read Model bez wartości populacji
 * (pole `undefined` po stronie widoku -- tak jak po granicy IPC / w częściowym
 * Read Modelu). Nie zmienia to symulacji ani typu `RegionSummaryReadModel`.
 */
export function withUnavailablePopulation(
  view: WorldView,
  regionIds: readonly string[],
): WorldView {
  const missing = new Set(regionIds);
  return {
    ...view,
    current: {
      ...view.current,
      regions: view.current.regions.map((r) =>
        missing.has(r.regionId)
          ? // Celowe odejście od kontraktu `number`: Read Model bez wartości populacji.
            { ...r, population: undefined as unknown as number }
          : r,
      ),
    },
  };
}

/** Drabina R4: 0 → ~10 → … → ~10M+ oraz brak danych (kolejność = kolejność na mapie). */
export const POPULATION_LADDER: readonly {
  readonly id: string;
  readonly name: string;
  readonly settlement?: VisualSettlementSpec;
  readonly unavailable?: boolean;
}[] = [
  { id: "r4_ladder_0_empty", name: "Known empty" },
  { id: "r4_ladder_1", name: "~10", settlement: { stage: "CAMP", population: 12 } },
  { id: "r4_ladder_2", name: "~100", settlement: { stage: "HAMLET", population: 120 } },
  { id: "r4_ladder_3", name: "~1k", settlement: { stage: "VILLAGE", population: 1_200 } },
  { id: "r4_ladder_4", name: "~10k", settlement: { stage: "TOWN", population: 12_000 } },
  {
    id: "r4_ladder_5",
    name: "~100k",
    settlement: { stage: "CITY", population: 120_000 },
  },
  {
    id: "r4_ladder_6",
    name: "~1M",
    settlement: { stage: "METROPOLIS", population: 1_200_000 },
  },
  {
    id: "r4_ladder_7",
    name: "~10M+",
    settlement: { stage: "METROPOLIS", population: 12_000_000 },
  },
  { id: "r4_ladder_8_nodata", name: "No data", unavailable: true },
];

export function populationLadderView(): WorldView {
  const regions: RegionSpec[] = POPULATION_LADDER.map((r) => ({
    id: r.id,
    name: r.name,
    geography: geo("plains", "temperate", 0.5),
    ...(r.settlement ? { settlement: r.settlement } : {}),
  }));
  return withUnavailablePopulation(
    buildVisualWorldView({
      id: "dev_r4_population_ladder",
      seed: "visual-r4-population-ladder",
      regions,
      connections: [],
    }),
    POPULATION_LADDER.filter((r) => r.unavailable).map((r) => r.id),
  );
}

/** Zero vs brak danych: dwa regiony identyczne we wszystkim poza stanem populacji. */
export const ZERO_REGION_ID = "r4_zero_a";
export const NO_DATA_REGION_ID = "r4_zero_b";

export function zeroVsNoDataView(): WorldView {
  const twin = (id: string, name: string): RegionSpec => ({
    id,
    name,
    geography: geo("plains", "temperate", 0.5, "river"),
  });
  return withUnavailablePopulation(
    buildVisualWorldView({
      id: "dev_r4_zero_vs_no_data",
      seed: "visual-r4-zero-vs-no-data",
      regions: [
        twin(ZERO_REGION_ID, "A · population 0"),
        twin(NO_DATA_REGION_ID, "B · population unavailable"),
      ],
      // Bez połączenia: trasa nie przecina etykiet, porównywane są wyłącznie stany populacji.
      connections: [],
    }),
    [NO_DATA_REGION_ID],
  );
}

/**
 * Terrain vs Population: świat cywilizacji R3 (ten sam builder, te same pozycje
 * i morfologia) z jednym regionem bez danych o populacji -- porównanie trybów
 * na tym samym świecie, łącznie z trzema stanami populacji.
 */
export const CIVILIZATION_NO_DATA_REGION_ID = "r3_civ_empty_south";

export function populationCivilizationView(): WorldView {
  return withUnavailablePopulation(civilizationView(), [CIVILIZATION_NO_DATA_REGION_ID]);
}
