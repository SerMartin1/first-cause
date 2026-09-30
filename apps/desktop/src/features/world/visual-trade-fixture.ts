import {
  buildWorldSnapshot,
  LEGACY_TRADE_FLOW_FACT_TYPE,
  runTradeScenario,
  tradeScenarioEvaluatedQuantity,
  type WorldView,
} from "@first-cause/simulation";
import {
  buildVisualWorldView,
  geo,
  VISUAL_WORLD_CONTENT,
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
  // Drugie połączenie Delta–Coal Hollow (rzeka): przypadek graniczny „oba kierunki” niżej.
  { a: R.delta, b: R.mines, level: 1, modes: ["river"] },
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
function flow(
  importer: string,
  exporter: string,
  goodId: string,
  after: unknown,
  connection = connectionId(importer, exporter),
): void {
  facts.push({
    id: `trade_fixture_fact_${facts.length}`,
    tick: TRADE_PERIOD_TICK,
    type: "trade_flow_active",
    subject: {
      entityType: "connectionGood",
      entityId: `${connection}:${goodId}`,
    },
    location: { regionId: importer },
    values: { before: 0, after },
  });
}

// Great Delta -- wyłącznie towary istniejące w contencie gry (poprawne nazwy EN/PL):
// kilku partnerów (zboże), przywóz i wywóz tego samego towaru (mąka), tylko
// wywóz (chleb), tylko przywóz (drewno, ruda żelaza).
flow(R.delta, R.hills, "grain", 70);
flow(R.delta, R.harbour, "grain", 50);
flow(R.delta, R.hills, "flour", 12);
flow(R.harbour, R.delta, "flour", 20);
flow(R.harbour, R.delta, "bread", 60);
flow(R.delta, R.mines, "timber", 45);
flow(R.delta, R.mines, "iron_ore", 30);
// PRZYPADEK GRANICZNY (tylko weryfikacja renderowania łuków): ten sam towar w obu
// kierunkach z tym samym partnerem, po dwóch połączeniach. W obecnym modelu nie
// zdarza się w jednym ticku (nadwyżka i niedobór tego samego towaru naraz), ale
// Read Model i Atlas muszą go poprawnie pokazać.
flow(R.delta, R.mines, "flour", 8, "dev_connection_8");
flow(R.mines, R.delta, "flour", 5, "dev_connection_2");

// Emporium: długa lista (30 towarów TESTOWYCH `dev_*` -- nie ma ich w contencie gry)
// z trzema partnerami.
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

// Reed Marsh: dane częściowe -- dwa RÓŻNE braki: zapis bez ilości (NaN → ilość
// „co najmniej”) oraz zapis ze znaną ilością, ale bez ustalonego partnera.
flow(R.marsh, R.emporium, "grain", 14);
flow(R.marsh, R.emporium, "grain", Number.NaN);
facts.push({
  id: `trade_fixture_fact_${facts.length}`,
  tick: TRADE_PERIOD_TICK,
  type: "trade_flow_active",
  subject: { entityType: "connectionGood", entityId: "dev_connection_missing:timber" },
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
    LONG_LIST_GOODS.map((id) => [
      `content.good.${id}.name`,
      `${id.slice(4, 5).toUpperCase()}${id.slice(5)} (test data)`,
    ]),
  ),
  pl: Object.fromEntries(
    LONG_LIST_GOODS.map((id) => [
      `content.good.${id}.name`,
      `${id.slice(4, 5).toUpperCase()}${id.slice(5)} (dane testowe)`,
    ]),
  ),
};

/**
 * SCENARIUSZ SYMULACYJNY (nie fixture wyglądu): stan początkowy
 * `buildTradeScenarioWorldState` + produkcyjny `WorldRunner.step()`; fakty
 * handlu i wartości tabeli liczy symulacja, nic nie jest wpisane ręcznie.
 */
export function tradeSimulationView(ticks = 1): WorldView {
  const runner = runTradeScenario(ticks);
  return snapshotView(runner.worldState, runner.facts);
}

/**
 * Stan po wczytaniu zapisu starszego silnika (< 3), odwzorowany w pamięci:
 * ten sam scenariusz, a fakt handlu z ilością OCENIONĄ ma typ nadawany przez
 * migrację schematu v2 → v3 (`trade_flow_evaluated`). Właściwy dowód
 * ścieżki zapisu: `packages/persistence/src/trade-legacy-save.test.ts`.
 */
export function tradeLegacySaveView(): WorldView {
  const runner = runTradeScenario(1);
  const evaluated = tradeScenarioEvaluatedQuantity(runner.worldState);
  const facts = runner.facts.map((f) =>
    f.type === "trade_flow_active"
      ? {
          ...f,
          type: LEGACY_TRADE_FLOW_FACT_TYPE,
          values: { ...f.values, after: evaluated },
        }
      : f,
  );
  return snapshotView(runner.worldState, facts);
}

function snapshotView(
  state: Parameters<typeof buildWorldSnapshot>[0],
  facts: Parameters<typeof buildWorldSnapshot>[1],
): WorldView {
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
