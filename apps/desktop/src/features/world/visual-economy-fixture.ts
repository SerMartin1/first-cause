import type { WorldView } from "@first-cause/simulation";
import {
  buildVisualWorldView,
  geo,
  type ConnectionSpec,
  type RegionSpec,
} from "./visual-world-fixture.js";

/**
 * VISUAL DEVELOPMENT DATA ONLY (M21-VIS-R4B Economy, §52C). Nie trafia do
 * aplikacji -- używa go wyłącznie harness
 * `visual-tests/world.html?fixture=economy|economy-low`.
 *
 * Świat budują fabryki `@first-cause/entities`, widok liczy PRODUKCYJNY
 * `buildWorldSnapshot`; wpisane są wyłącznie pola, które symulacja już
 * zapisuje: `Company.workforce.employees`, `production.outputLastTick`,
 * `production.productionMethodId`, `finance.revenue`, `Market.goods.
 * localPrice`. Metody `manual_farming` / `manual_food_processing` /
 * `watermill_milling` i towary `flour` / `bread` pochodzą z contentu gry;
 * `dev_*` istnieją tylko tu.
 */
export const ECONOMY_REGION = {
  hills: "econ_a_hills",
  delta: "econ_b_delta",
  harbour: "econ_c_harbour",
  emporium: "econ_d_emporium",
  quiet: "econ_e_quiet",
  mines: "econ_f_mines",
  frontier: "econ_g_frontier",
  marsh: "econ_h_marsh",
} as const;
const R = ECONOMY_REGION;

/** Proporcje wyjść receptur (`goodOutputsPerBatch`) -- content gry + metody `dev_*`. */
const OUTPUTS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  manual_farming: { flour: 8 },
  watermill_milling: { flour: 12 },
  manual_food_processing: { bread: 4 },
  dev_forging: { dev_tools: 2 },
  dev_sawing: { dev_planks: 6 },
};

type Company = NonNullable<RegionSpec["companies"]>[number];
const farm = (employees: number, output: number, revenue: number): Company => ({
  archetypeId: "grain_farm",
  methodId: "manual_farming",
  employees,
  output,
  revenue,
});
const bakery = (employees: number, output: number, revenue: number): Company => ({
  archetypeId: "bakery",
  methodId: "manual_food_processing",
  employees,
  output,
  revenue,
});
const works = (employees: number, output: number, revenue: number): Company => ({
  archetypeId: "dev_workshop",
  methodId: "dev_forging",
  employees,
  output,
  revenue,
});
const sawmill = (employees: number, output: number, revenue: number): Company => ({
  archetypeId: "dev_sawmill",
  methodId: "dev_sawing",
  employees,
  output,
  revenue,
});

/**
 * Zróżnicowanie zatrudnienia: klasy 1..5, znane 0 (region bez firm oraz firma
 * bez pracowników). Sprzedaż (informacja dodatkowa): znana, 0 przy rynku i
 * „brak danych” poza modelem rynku. Brak danych o zatrudnieniu -- patrz
 * `economyView` (kontrakt prezentacji, jak w Population).
 */
const REGIONS: readonly RegionSpec[] = [
  {
    id: R.hills,
    name: "Green Hills",
    geography: geo("hills", "temperate", 0.6),
    settlement: { stage: "VILLAGE", population: 3_200 },
    // 6 os. (klasa 1); sprzedaż 7.50 (bufor 5 jedn. zostaje w firmie).
    companies: [farm(6, 16, 7.5)],
  },
  {
    id: R.delta,
    name: "Great Delta",
    geography: geo("plains", "temperate", 0.8, "river"),
    settlement: { stage: "CITY", population: 180_000 },
    // 2 320 os. (klasa 4); sprzedaż 6 912.40.
    companies: [
      farm(900, 2_400, 3_120),
      { ...farm(420, 1_800, 2_340), methodId: "watermill_milling" },
      bakery(1_000, 1_100, 1_452.4),
    ],
  },
  {
    id: R.harbour,
    name: "Salt Harbour",
    geography: geo("plains", "temperate", 0.4, "coast"),
    settlement: { stage: "TOWN", population: 24_000 },
    // 480 os. (klasa 3); sprzedaż 12 480 -- mało ludzi, drogie wyroby.
    companies: [works(300, 900, 10_800), bakery(180, 400, 1_680)],
  },
  {
    id: R.emporium,
    name: "Emporium",
    geography: geo("plains", "temperate", 0.5, "river"),
    settlement: { stage: "METROPOLIS", population: 1_400_000 },
    // 12 400 os. (klasa 5); sprzedaż 48 200.
    companies: [
      works(6_000, 14_000, 33_600),
      bakery(4_400, 6_000, 9_600),
      sawmill(2_000, 5_000, 5_000),
    ],
  },
  {
    id: R.quiet,
    name: "Quiet Vale",
    geography: geo("plains", "cold", 0.4),
    settlement: { stage: "HAMLET", population: 180 },
    // Znane 0: aktywna firma bez pracowników, bez produkcji i sprzedaży.
    companies: [farm(0, 0, 0)],
  },
  {
    id: R.mines,
    name: "Coal Hollow",
    geography: geo("mountains", "continental", 0.15),
    settlement: { stage: "TOWN", population: 9_000 },
    // 64 os. (klasa 2); sprzedaż 45; cena narzędzi nienotowana („—”).
    companies: [sawmill(60, 30, 45), works(4, 2, 0)],
  },
  {
    id: R.frontier,
    name: "Wild Frontier",
    geography: geo("forest", "continental", 0.3),
    settlement: { stage: "HAMLET", population: 60 },
    // 0 (brak firm); sprzedaż: brak danych (brak rynku).
  },
  {
    id: R.marsh,
    name: "Reed Marsh",
    geography: geo("wetland", "temperate", 0.5, "river"),
    settlement: { stage: "VILLAGE", population: 1_100 },
    // Zatrudnienie: brak danych (kontrakt prezentacji, `economyView`); sprzedaż:
    // brak danych -- firma produkuje, ale region nie ma rynku (brak ceny „—”).
    companies: [farm(38, 90, 0)],
  },
];

const CONNECTIONS: readonly ConnectionSpec[] = [
  { a: R.delta, b: R.harbour, level: 3, modes: ["cart", "river"] },
  { a: R.delta, b: R.hills, level: 2, modes: ["cart"] },
  { a: R.delta, b: R.mines, level: 2, modes: ["cart"] },
  { a: R.harbour, b: R.emporium, level: 3, modes: ["cart"] },
  { a: R.hills, b: R.quiet, level: 1, modes: ["foot_porter"] },
  { a: R.mines, b: R.frontier, level: 1, modes: ["pack_animal"] },
  { a: R.emporium, b: R.marsh, level: 2, modes: ["river"] },
  { a: R.emporium, b: R.mines, level: 2, modes: ["cart"] },
];

const MARKET_REGIONS = [R.hills, R.delta, R.harbour, R.emporium, R.quiet, R.mines];
const PRICES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  [R.hills]: { flour: 1.25 },
  [R.delta]: { flour: 1.3, bread: 1.32 },
  [R.harbour]: { bread: 4.2, dev_tools: 12 },
  [R.emporium]: { bread: 1.6, dev_tools: 2.4, dev_planks: 1 },
  [R.quiet]: { flour: 1.9 },
  [R.mines]: { dev_planks: 1.5 },
};

export function economyView(): WorldView {
  const view = buildVisualWorldView({
    id: "dev_economy_world",
    seed: "visual-r4b-economy",
    regions: REGIONS,
    connections: CONNECTIONS,
    tradeRegionIds: MARKET_REGIONS,
    marketPrices: PRICES,
    goodOutputsPerBatchByMethodId: OUTPUTS,
    currentTick: 26,
    startDate: { year: 3, month: 3 },
  });
  // Symulacja zawsze zna zatrudnienie; „brak danych” to kontrakt prezentacji dla
  // Read Modelu bez wartości (jak Population R4) -- tu Reed Marsh bez liczby.
  return {
    ...view,
    current: {
      ...view.current,
      regions: view.current.regions.map((r) =>
        r.regionId === R.marsh
          ? { ...r, economy: { ...r.economy, employment: Number.NaN } }
          : r,
      ),
    },
  };
}

/**
 * „Słaba gospodarka”: rząd wielkości zmierzony w realnym świecie Black
 * Mountain (360 ticków, maks. ~7 zatrudnionych, przychód ≤ ~93 / mies., tylko
 * jeden region z firmami). Dowód, że region pierwszy w rankingu NIE dostaje
 * pełnej intensywności -- klasy są absolutne. Nadal VISUAL DEVELOPMENT DATA.
 */
export function economyLowView(): WorldView {
  const low: RegionSpec[] = REGIONS.map((spec) =>
    spec.id === R.delta
      ? { ...spec, companies: [farm(2, 8, 10), farm(1, 0, 0)] }
      : { ...spec, companies: spec.id === R.quiet ? [farm(0, 0, 0)] : [] },
  );
  return buildVisualWorldView({
    id: "dev_economy_low_world",
    seed: "visual-r4b-economy-low",
    regions: low,
    connections: CONNECTIONS,
    tradeRegionIds: MARKET_REGIONS,
    marketPrices: { [R.delta]: { flour: 1.25 } },
    goodOutputsPerBatchByMethodId: OUTPUTS,
    currentTick: 121,
    startDate: { year: 11, month: 2 },
  });
}

export const ECONOMY_DEV_NAMES: Readonly<Record<"en" | "pl", Record<string, string>>> = {
  en: {
    "content.good.dev_tools.name": "Tools (test data)",
    "content.good.dev_planks.name": "Planks (test data)",
  },
  pl: {
    "content.good.dev_tools.name": "Narzędzia (dane testowe)",
    "content.good.dev_planks.name": "Deski (dane testowe)",
  },
};
