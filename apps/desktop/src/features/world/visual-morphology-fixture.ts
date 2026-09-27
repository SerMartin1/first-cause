import type { WorldView } from "@first-cause/simulation";
import {
  buildVisualWorldView,
  geo,
  type ConnectionSpec,
  type RegionSpec,
} from "./visual-world-fixture.js";

/**
 * VISUAL DEVELOPMENT DATA ONLY (M21-VIS-R3 TEST FIXTURE). Nie jest
 * scenariuszem ani prognozą; nie trafia do aplikacji -- używają go wyłącznie
 * testy i harness `visual-tests/world.html?fixture=...`. Świat budowany
 * prawdziwymi fabrykami `@first-cause/entities`, widok liczony produkcyjnym
 * `buildWorldSnapshot` (ten sam builder co fixture R2). Nie zmienia
 * symulacji, ekonomii ani demografii.
 */

/** Drabina skali: jedna osada na region, kolejne rzędy wielkości 10 → 10M+. */
export const LADDER_POPULATIONS = [
  12, 120, 1_200, 12_000, 120_000, 1_200_000, 12_000_000,
] as const;
const LADDER_NAMES = ["~10", "~100", "~1k", "~10k", "~100k", "~1M", "~10M+"] as const;
const LADDER_STAGES = [
  "CAMP",
  "HAMLET",
  "VILLAGE",
  "TOWN",
  "CITY",
  "METROPOLIS",
  "METROPOLIS",
] as const;

export function morphologyLadderView(): WorldView {
  const regions: RegionSpec[] = LADDER_POPULATIONS.map((population, i) => ({
    id: `r3_ladder_${i}`,
    name: LADDER_NAMES[i]!,
    geography: geo("plains", "temperate", 0.5),
    settlement: { stage: LADDER_STAGES[i]!, population },
  }));
  return buildVisualWorldView({
    id: "dev_r3_ladder",
    seed: "visual-r3-ladder",
    regions,
    connections: [],
  });
}

/**
 * Warianty tej samej klasy: trzy osady ~100k i trzy ~10M z różnymi id --
 * różnią się autorskim wariantem (hash id), nie losowaniem. Id dobrane
 * tak, by każda trójka pokrywała warianty 0/1/2 (sprawdza test).
 */
export const VARIANT_REGIONS: readonly {
  readonly id: string;
  readonly name: string;
  readonly population: number;
}[] = [
  { id: "r3_var_a", name: "100k A", population: 130_000 },
  { id: "r3_var_b", name: "100k B", population: 130_000 },
  { id: "r3_var_e", name: "100k C", population: 130_000 },
  { id: "r3_var_d", name: "10M A", population: 11_000_000 },
  { id: "r3_var_f", name: "10M B", population: 11_000_000 },
  { id: "r3_var_g", name: "10M C", population: 11_000_000 },
];

export function morphologyVariantsView(): WorldView {
  return buildVisualWorldView({
    id: "dev_r3_variants",
    seed: "visual-r3-variants",
    regions: VARIANT_REGIONS.map((r) => ({
      id: r.id,
      name: r.name,
      geography: geo("plains", "temperate", 0.5),
      settlement: {
        stage: r.population >= 1_000_000 ? "METROPOLIS" : "CITY",
        population: r.population,
      },
    })),
    connections: [],
  });
}

/**
 * WORLD z kilkoma dużymi centrami cywilizacji: megacity w delcie,
 * metropolia na równinie ze stolicą i miasteczkami satelickimi, port,
 * zagłębie przemysłowe (kopalnie + huta + trasy), region rolniczy z
 * wieloma wsiami (agregacja na WORLD), rzadko zaludnione wyżyny i dwa
 * puste regiony (świat nie jest wszędzie zaludniony).
 */
const CIVILIZATION_REGIONS: readonly RegionSpec[] = [
  {
    id: "r3_civ_basin",
    name: "Coal Basin",
    geography: geo("hills", "continental", 0.3, "river"),
    settlement: { stage: "CITY", population: 160_000 },
    settlements: [
      { stage: "TOWN", population: 18_000, name: "Pit Town" },
      { stage: "VILLAGE", population: 2_400, name: "Slag End" },
    ],
    companies: [
      { archetypeId: "dev_iron_mine", employees: 420, output: 210 },
      { archetypeId: "dev_smelter", employees: 900, output: 320 },
      { archetypeId: "dev_workshop", employees: 140, output: 60 },
    ],
    deposits: [
      { resourceId: "iron_ore", quantity: 90_000, status: "ASSESSED", extract: 120 },
      { resourceId: "dev_coal", quantity: 120_000, status: "DISCOVERED", extract: 200 },
    ],
  },
  {
    id: "r3_civ_capital",
    name: "Capital Plain",
    geography: geo("plains", "temperate", 0.75, "river"),
    settlement: { stage: "METROPOLIS", population: 3_200_000 },
    settlements: [
      { stage: "TOWN", population: 42_000, name: "Northgate" },
      { stage: "TOWN", population: 9_000, name: "Millbrook" },
    ],
    companies: [
      { archetypeId: "dev_workshop", employees: 2_600, output: 900 },
      { archetypeId: "bakery", employees: 700, output: 400 },
    ],
  },
  {
    id: "r3_civ_delta",
    name: "Great Delta",
    geography: geo("plains", "temperate", 0.85, "coast"),
    settlement: { stage: "METROPOLIS", population: 14_000_000 },
    settlements: [{ stage: "VILLAGE", population: 3_000, name: "Reedfield" }],
    companies: [
      { archetypeId: "dev_shipyard", employees: 5_000, output: 1_200 },
      { archetypeId: "dev_workshop", employees: 9_000, output: 2_600 },
    ],
  },
  {
    id: "r3_civ_empty_north",
    name: "Frost Waste",
    geography: geo("plains", "cold", 0.05),
  },
  {
    id: "r3_civ_farmland",
    name: "Green Farmland",
    geography: geo("plains", "temperate", 0.9, "river"),
    settlement: { stage: "VILLAGE", population: 4_200 },
    settlements: [
      { stage: "VILLAGE", population: 1_900, name: "Oakfield" },
      { stage: "VILLAGE", population: 1_100, name: "Barrow" },
      { stage: "HAMLET", population: 380, name: "Five Wells" },
      { stage: "HAMLET", population: 140, name: "Tarn" },
      { stage: "HAMLET", population: 60, name: "Hollow" },
    ],
    companies: [{ archetypeId: "grain_farm", employees: 600, output: 500 }],
    deposits: [
      {
        resourceId: "grain",
        quantity: 40_000,
        renewable: true,
        status: "DISCOVERED",
        extract: 300,
      },
    ],
  },
  {
    id: "r3_civ_highlands",
    name: "Stone Highlands",
    geography: geo("mountains", "cold", 0.1),
    settlement: { stage: "HAMLET", population: 90 },
    settlements: [{ stage: "CAMP", population: 14, name: "Watch Hut" }],
  },
  {
    id: "r3_civ_port",
    name: "Salt Harbour",
    geography: geo("plains", "temperate", 0.4, "coast"),
    settlement: { stage: "CITY", population: 850_000 },
    settlements: [{ stage: "TOWN", population: 22_000, name: "Lighthouse" }],
    companies: [{ archetypeId: "dev_shipyard", employees: 1_200, output: 300 }],
  },
  {
    id: "r3_civ_empty_south",
    name: "Dry Steppe",
    geography: geo("desert", "arid", 0.1),
  },
];

const CIVILIZATION_CONNECTIONS: readonly ConnectionSpec[] = [
  { a: "r3_civ_capital", b: "r3_civ_delta", level: 3, modes: ["dev_railway", "cart"] },
  { a: "r3_civ_capital", b: "r3_civ_basin", level: 3, modes: ["dev_railway"] },
  { a: "r3_civ_capital", b: "r3_civ_farmland", level: 2, modes: ["cart"] },
  { a: "r3_civ_delta", b: "r3_civ_port", level: 2, modes: ["dev_ship", "cart"] },
  { a: "r3_civ_basin", b: "r3_civ_highlands", level: 1, modes: ["pack_animal"] },
  { a: "r3_civ_farmland", b: "r3_civ_port", level: 1, modes: ["river"] },
  { a: "r3_civ_highlands", b: "r3_civ_empty_north", level: 0, modes: [] },
  { a: "r3_civ_port", b: "r3_civ_empty_south", level: 0, modes: [] },
];

export function civilizationView(): WorldView {
  return buildVisualWorldView({
    id: "dev_r3_civilization",
    seed: "visual-r3-civilization",
    regions: CIVILIZATION_REGIONS,
    connections: CIVILIZATION_CONNECTIONS,
  });
}
