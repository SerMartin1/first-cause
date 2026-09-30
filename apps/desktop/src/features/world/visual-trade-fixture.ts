import type { WorldView } from "@first-cause/simulation";
import {
  buildVisualWorldView,
  geo,
  type ConnectionSpec,
  type RegionSpec,
} from "./visual-world-fixture.js";

/**
 * VISUAL DEVELOPMENT DATA ONLY (M21-VIS-R4B TEST FIXTURE). Nie trafia do
 * aplikacji -- używają go wyłącznie testy i harness
 * `visual-tests/world.html?fixture=trade`.
 *
 * Świat budują fabryki `@first-cause/entities` (przez `buildVisualWorldView`),
 * a tabelę Handlu liczy PRODUKCYJNY `buildWorldSnapshot` z faktów
 * `trade_flow_active` w kształcie emitowanym przez `tradeOneDirection`
 * (`<connectionId>:<goodId>`, lokalizacja = importer, `after` = ilość
 * dostarczona). Ilości są deterministyczne i wpisane tu jawnie; towary
 * `dev_*` nie istnieją w contencie gry.
 */
// Id porządkują siatkę diagramu (`atlasPositions` sortuje po id): połączenia łączą sąsiadów.
export const TRADE_REGION = {
  delta: "trade_b_delta",
  harbour: "trade_c_harbour",
  hills: "trade_a_hills",
  mines: "trade_f_mines",
  emporium: "trade_d_emporium",
  quiet: "trade_e_quiet",
  frontier: "trade_g_frontier",
  marsh: "trade_h_marsh",
} as const;
const R = TRADE_REGION;

/** Ostatni zakończony tick (okres tabeli) i bieżący tick świata. */
export const TRADE_PERIOD_TICK = 25;

const REGIONS: readonly RegionSpec[] = [
  {
    id: R.delta,
    name: "Great Delta",
    geography: geo("plains", "temperate", 0.8, "river"),
    settlement: { stage: "CITY", population: 180_000 },
  },
  {
    id: R.harbour,
    name: "Salt Harbour",
    geography: geo("plains", "temperate", 0.4, "coast"),
    settlement: { stage: "TOWN", population: 24_000 },
  },
  {
    id: R.hills,
    name: "Green Hills",
    geography: geo("hills", "temperate", 0.6),
    settlement: { stage: "VILLAGE", population: 3_200 },
  },
  {
    id: R.mines,
    name: "Coal Hollow",
    geography: geo("mountains", "continental", 0.15),
    settlement: { stage: "TOWN", population: 9_000 },
  },
  {
    id: R.emporium,
    name: "Emporium",
    geography: geo("plains", "temperate", 0.5, "river"),
    settlement: { stage: "METROPOLIS", population: 1_400_000 },
  },
  {
    id: R.quiet,
    name: "Quiet Vale",
    geography: geo("plains", "cold", 0.4),
    settlement: { stage: "HAMLET", population: 180 },
  },
  {
    id: R.frontier,
    name: "Wild Frontier",
    geography: geo("forest", "continental", 0.3),
    settlement: { stage: "HAMLET", population: 60 },
  },
  {
    id: R.marsh,
    name: "Reed Marsh",
    geography: geo("wetland", "temperate", 0.5, "river"),
    settlement: { stage: "VILLAGE", population: 1_100 },
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

/** `dev_connection_<i>` -- id nadawane przez `buildVisualWorldView` po kolejności listy. */
function connectionId(a: string, b: string): string {
  const i = CONNECTIONS.findIndex(
    (c) => (c.a === a && c.b === b) || (c.a === b && c.b === a),
  );
  if (i < 0) throw new Error(`no fixture connection ${a}–${b}`);
  return `dev_connection_${i}`;
}

type Fact = NonNullable<Parameters<typeof buildVisualWorldView>[0]["facts"]>[number];
const facts: Fact[] = [];
/** `importer` przywozi `goodId` od `exporter` (jeden fakt = jedna wymiana na jednym połączeniu). */
function flow(importer: string, exporter: string, goodId: string, after: unknown): void {
  facts.push({
    id: `trade_fixture_fact_${facts.length}`,
    tick: TRADE_PERIOD_TICK,
    type: "trade_flow_active",
    subject: {
      entityType: "connectionGood",
      entityId: `${connectionId(importer, exporter)}:${goodId}`,
    },
    location: { regionId: importer },
    values: { before: 0, after },
  });
}

// Great Delta: przywóz i wywóz tego samego towaru (narzędzia), towar od
// kilku partnerów (zboże), tylko przywóz (węgiel), tylko wywóz (tkaniny),
// jeden partner w obu kierunkach (Coal Hollow: ruda ↔ chleb).
flow(R.delta, R.hills, "grain", 70);
flow(R.delta, R.harbour, "grain", 50);
flow(R.delta, R.mines, "dev_coal", 45);
flow(R.delta, R.hills, "dev_tools", 12);
flow(R.harbour, R.delta, "dev_tools", 20);
flow(R.harbour, R.delta, "dev_cloth", 60);
flow(R.delta, R.mines, "iron_ore", 30);
flow(R.mines, R.delta, "bread", 15);

// Emporium: długa lista (30 towarów) z trzema partnerami.
export const LONG_LIST_GOODS = [
  "dev_amber",
  "dev_barley",
  "dev_beer",
  "dev_bricks",
  "dev_candles",
  "dev_cheese",
  "dev_copper",
  "dev_dyes",
  "dev_furs",
  "dev_glass",
  "dev_honey",
  "dev_leather",
  "dev_linen",
  "dev_nails",
  "dev_oil",
  "dev_paper",
  "dev_pepper",
  "dev_pottery",
  "dev_resin",
  "dev_rope",
  "dev_salt",
  "dev_silk",
  "dev_soap",
  "dev_spice",
  "dev_tar",
  "dev_tea",
  "dev_tin",
  "dev_wax",
  "dev_wine",
  "dev_wool",
] as const;
const PARTNERS = [R.harbour, R.mines, R.marsh] as const;
LONG_LIST_GOODS.forEach((good, i) => {
  const partner = PARTNERS[i % PARTNERS.length]!;
  const amount = 5 + ((i * 37) % 90);
  if (i % 3 !== 2) flow(R.emporium, partner, good, amount);
  if (i % 3 !== 0) flow(partner, R.emporium, good, 3 + ((i * 53) % 70));
});

// Reed Marsh: dane częściowe -- zapis bez ilości (NaN) i zapis bez ustalonego partnera.
flow(R.marsh, R.emporium, "dev_fish", 14);
flow(R.marsh, R.emporium, "dev_fish", Number.NaN);
facts.push({
  id: `trade_fixture_fact_${facts.length}`,
  tick: TRADE_PERIOD_TICK,
  type: "trade_flow_active",
  subject: { entityType: "connectionGood", entityId: "dev_connection_missing:dev_reeds" },
  location: { regionId: R.marsh },
  values: { before: 0, after: 9 },
});

// Starszy okres -- nie może trafić do tabeli (okres = ostatni zakończony tick).
facts.push({
  id: `trade_fixture_fact_${facts.length}`,
  tick: TRADE_PERIOD_TICK - 1,
  type: "trade_flow_active",
  subject: {
    entityType: "connectionGood",
    entityId: `${connectionId(R.delta, R.hills)}:grain`,
  },
  location: { regionId: R.delta },
  values: { before: 0, after: 999 },
});

/**
 * Handel VISUAL DEVELOPMENT DATA: Quiet Vale ma rynek bez wymiany (brak
 * handlu), Wild Frontier nie ma rynku (brak danych).
 */
export function tradeView(): WorldView {
  return buildVisualWorldView({
    id: "dev_trade_world",
    seed: "visual-r4b-trade",
    regions: REGIONS,
    connections: CONNECTIONS,
    tradeRegionIds: [R.delta, R.harbour, R.hills, R.mines, R.emporium, R.quiet, R.marsh],
    currentTick: TRADE_PERIOD_TICK + 1,
    startDate: { year: 3, month: 3 },
    facts,
  });
}

/** Nazwy towarów istniejących wyłącznie w tym fixture (harness i testy). */
export const TRADE_DEV_NAMES: Readonly<Record<"en" | "pl", Record<string, string>>> = {
  en: Object.fromEntries(
    [...LONG_LIST_GOODS, "dev_tools", "dev_cloth", "dev_fish", "dev_reeds"].map((id) => [
      `content.good.${id}.name`,
      `${id.slice(4, 5).toUpperCase()}${id.slice(5)} (dev data)`,
    ]),
  ),
  pl: Object.fromEntries(
    [...LONG_LIST_GOODS, "dev_tools", "dev_cloth", "dev_fish", "dev_reeds"].map((id) => [
      `content.good.${id}.name`,
      `${id.slice(4, 5).toUpperCase()}${id.slice(5)} (dane dev)`,
    ]),
  ),
};
