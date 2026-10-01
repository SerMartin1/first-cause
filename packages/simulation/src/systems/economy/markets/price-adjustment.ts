import type { Market, MarketGoodState, MarketHistory } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { roundPrice } from "../../../core/rounding.js";
import {
  assertNonNegative,
  assertPositive,
  InvariantViolationError,
} from "../../../core/validation.js";
import { directionalEdgeType, type PendingCausalLink } from "../../../core/causal-links.js";
import { aggregateDemand } from "./demand-aggregation.js";
import { classifyShortageSurplus } from "./shortage-surplus.js";

/**
 * Market price adjustment (DATA-006, Vertical Slice Spec SS17, AI-005,
 * Simulation Test Spec SS30-33): the R1 "gospodarka oscyluje" risk (VS
 * Spec SS73) is HIGH-flagged in the roadmap specifically for this
 * milestone, so every one of the four mandatory safeguards VS SS17 lists
 * (price floor, monthly change cap, smoothing, inventory buffer) is
 * applied here, not deferred -- "smoothing/hysteresis od pierwszej wersji
 * (nie dodane później)" per the roadmap's own mitigation note.
 *
 * `PricePressure = Sensitivity * ((Demand - Supply) / NormalSupply)` (VS
 * SS17) needs a NormalSupply reference that does not jump around with a
 * single tick's noise -- that is `Market.history.rollingSupply` (M8,
 * entities/economy/market.ts): the average of the *prior* ROLLING_WINDOW
 * ticks, not the current one, so one bad/good tick cannot move its own
 * baseline. The inventory buffer (`shortage-surplus.ts`) softens the raw
 * gap before it ever reaches pressure; the tick cap and the smoothing
 * factor then each independently bound how much of that pressure lands
 * this tick. All four constants are tuning placeholders (AGENTS.md
 * "undecided tuning value" rule) -- their existence and ordering, not
 * their exact numbers, is what this milestone's Acceptance Gate checks.
 */
const PRICE_SENSITIVITY = 0.5; // TODO tuning
const MAX_TICK_PRICE_CHANGE = 0.1; // TODO tuning -- VS SS17 "miesięczny limit zmiany" (1 tick = 1 month, SIM-001)
const PRICE_SMOOTHING_FACTOR = 0.3; // TODO tuning -- AI-005 hysteresis: fraction of the capped pressure that actually lands this tick
const MIN_PRICE = 0.01; // TODO tuning -- VS SS17 "price floor"
const ROLLING_WINDOW = 6; // TODO tuning -- ticks kept in Market.history for the NormalSupply reference

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Seeds a good's/resource's first `MarketGoodState` from its content
 * `basePrice` (BaseContentPrice, M8 "Dane"). Audytowe P1 ("floor/monthly-
 * cap konflikt"): floored at `MIN_PRICE` the same way `updateMarketGood`
 * floors every later tick -- without this, a `basePrice` under half a
 * cent (e.g. 0.001) would round to exactly 0 (dawniej `roundMoney`; od
 * etapu 4A cena ma 6 miejsc -- `roundPrice` -- ale podłoga zostaje),
 * silently violating both `MIN_PRICE` and the `price > 0`
 * invariant (Entity Data Model SS15) this file's own doc comment already
 * claims. That single inconsistency was the real root of the
 * floor/cap conflict: once a seeded price could start below `MIN_PRICE`,
 * the very next tick's floor-clamp (`Math.max(MIN_PRICE, rawNewPrice)`)
 * could jump it back up by far more than `MAX_TICK_PRICE_CHANGE` allows,
 * since that clamp is unconditional and never itself respects the cap.
 */
export function initializeMarketGood(basePrice: number): MarketGoodState {
  assertPositive(basePrice, "initializeMarketGood(basePrice)");
  return {
    supply: 0,
    demand: 0,
    inventory: 0,
    localPrice: roundPrice(Math.max(MIN_PRICE, basePrice)),
    importDemand: 0, // M10 (handel międzyregionalny) -- placeholder untouched by M8
    exportSupply: 0, // M10 -- placeholder untouched by M8
    shortageSeverity: 0,
    pricePressure: 0,
  };
}

function normalSupply(rollingSupply: readonly number[], currentSupply: number): number {
  if (rollingSupply.length === 0) return currentSupply;
  const sum = rollingSupply.reduce((total, value) => total + value, 0);
  return sum / rollingSupply.length;
}

function pushHistoryPoint(
  existing: readonly number[] | undefined,
  value: number,
): readonly number[] {
  const next = existing ? [...existing, value] : [value];
  return next.length > ROLLING_WINDOW ? next.slice(next.length - ROLLING_WINDOW) : next;
}

function pushRollingHistory(
  history: MarketHistory,
  goodId: string,
  point: { readonly supply: number; readonly demand: number; readonly price: number },
): MarketHistory {
  return {
    rollingSupply: {
      ...history.rollingSupply,
      [goodId]: pushHistoryPoint(history.rollingSupply[goodId], point.supply),
    },
    rollingDemand: {
      ...history.rollingDemand,
      [goodId]: pushHistoryPoint(history.rollingDemand[goodId], point.demand),
    },
    rollingPrice: {
      ...history.rollingPrice,
      [goodId]: pushHistoryPoint(history.rollingPrice[goodId], point.price),
    },
  };
}

export interface UpdateMarketGoodInput {
  readonly market: Market;
  readonly goodId: string;
  /** Physical output actually available this tick (observed, not owned -- DATA-005). */
  readonly supply: number;
  /** Named demand sources for `aggregateDemand` (SS5: household/company/export/... -- only what the caller actually observed). */
  readonly demandSources: Readonly<Record<string, number>>;
  /** Current region `Inventory` quantity for this good (observed, not owned -- DATA-005/DATA-006). */
  readonly inventory: number;
  /**
   * P14 (2026-10-01): dostępne oferty w tym ticku -- towar faktycznie
   * wystawiony w magazynie regionu przed zakupami (bez buforów firm i
   * przyszłej produkcji). Brak = wywołujący nie śledzi ofert (zachowanie
   * sprzed P14, bez zatrzymania presji).
   */
  readonly offered?: number;
}

/**
 * P14 (decyzja właściciela 2026-10-01): okno, po którym trwały brak ofert
 * zatrzymuje automatyczną presję cenową -- to samo okno co historia podaży
 * (`ROLLING_WINDOW`). Krótszy brak ofert po wcześniejszej podaży zachowuje
 * zwykłą reakcję na niedobór.
 */
export const OFFER_WINDOW_TICKS = ROLLING_WINDOW;

/**
 * P14: czy presja cenowa jest zatrzymana. Potrzeby bez dostępnej oferty nie
 * podnoszą ceny bez końca: rynek, który nigdy nie miał oferty, trzyma cenę
 * bazową jako orientacyjną; rynek bez ofert przez całe okno trzyma ostatnią
 * cenę jako orientacyjną. Niedobór (`shortageSeverity`), popyt finansowany i
 * potrzeby liczą się dalej normalnie -- handel, przedsiębiorczość i migracja
 * nadal je widzą.
 */
interface OfferState {
  /** Czy wywołujący śledzi oferty (podał `offered`). */
  readonly tracked: boolean;
  readonly ticksWithoutOffers: number | undefined;
  readonly priceSuspension: MarketGoodState["priceSuspension"] | undefined;
}

function offerState(existing: MarketGoodState, offered: number | undefined): OfferState {
  if (offered === undefined)
    return {
      tracked: false,
      ticksWithoutOffers: existing.ticksWithoutOffers,
      priceSuspension: existing.priceSuspension,
    };
  if (offered > 0) return { tracked: true, ticksWithoutOffers: 0, priceSuspension: undefined };
  if (existing.ticksWithoutOffers === undefined)
    return { tracked: true, ticksWithoutOffers: undefined, priceSuspension: "NEVER_OFFERED" };
  const ticksWithoutOffers = existing.ticksWithoutOffers + 1;
  return {
    tracked: true,
    ticksWithoutOffers,
    priceSuspension: ticksWithoutOffers >= OFFER_WINDOW_TICKS ? "NO_OFFERS_IN_WINDOW" : undefined,
  };
}

/** Bez kluczy o wartości `undefined` (stan zapisu i suma kontrolna bez „pustych” pól). */
function withOptional<T extends object>(base: T, optional: Record<string, unknown>): T {
  const next = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(optional)) {
    if (value === undefined) delete next[key];
    else next[key] = value;
  }
  return next as unknown as T;
}

export interface UpdateMarketGoodResult {
  readonly market: Market;
  readonly facts: readonly FactInput<number>[];
  /** M17 (CE-04): `targetIndex`/`sameBatch.index` są względne do WŁASNEJ tablicy `facts` tego wyniku -- wywołujący przesuwa je (`offsetCausalLinks`) przed scaleniem do większej, tick-wide tablicy. */
  readonly causalLinks: readonly PendingCausalLink[];
}

/**
 * Advances one `Market.goods[goodId]` entry by exactly one tick. Requires
 * the good to already have a `MarketGoodState` (via `initializeMarketGood`)
 * -- a missing entry is the caller's mistake (forgot to seed a BaseContentPrice),
 * the same fail-loud standard `production.ts` (M7) applies to a missing
 * `ResourceDeposit`, rather than silently fabricating a `localPrice` of 0
 * and breaking the `price > 0` invariant (Entity Data Model SS15).
 */
export function updateMarketGood(input: UpdateMarketGoodInput): UpdateMarketGoodResult {
  const { market, goodId } = input;
  const supply = assertNonNegative(input.supply, `updateMarketGood(${goodId}).supply`);
  if (input.offered !== undefined)
    assertNonNegative(input.offered, `updateMarketGood(${goodId}).offered`);
  const inventory = assertNonNegative(
    input.inventory,
    `updateMarketGood(${goodId}).inventory`,
  );

  const existing = market.goods[goodId];
  if (!existing) {
    throw new InvariantViolationError(
      `updateMarketGood(${market.id}, ${goodId}): no MarketGoodState -- call initializeMarketGood(basePrice) first`,
    );
  }

  const demand = aggregateDemand(input.demandSources);
  const { shortageSeverity, effectiveSupply } = classifyShortageSurplus({
    supply,
    demand,
    inventory,
  });

  const priorSupplyHistory = market.history.rollingSupply[goodId] ?? [];
  const reference = normalSupply(priorSupplyHistory, supply);

  // Brak jakiejkolwiek bazowej podaży (ani historii, ani bieżącego ticka) to
  // stan bez punktu odniesienia dla dzielenia (Finite Numbers, Simulation
  // Test Spec SS18) -- ale to NIE znaczy "brak sygnału". Audytowe P1
  // ("rynek nie reaguje na zerową podaż"): stary kod dawał tu zawsze 0,
  // więc dobro, które nigdy nie miało żadnej podaży (ani tego ticka, ani
  // w historii -- każda podaż=0 dopisuje kolejne 0 do rolling history,
  // więc `reference` samo nigdy się nie podniesie), nie generowało presji
  // cenowej bez względu na to, jak duży był popyt -- realny stockout nigdy
  // nie podnosił ceny. Brak podaży + realny popyt to sam w sobie
  // najsilniejszy możliwy sygnał niedoboru, więc trafia w sufit
  // `MAX_TICK_PRICE_CHANGE` (dalej przechodzi przez to samo smoothing/cap
  // co każda inna presja); brak i podaży, i popytu zostaje przy 0 -- nie
  // ma żadnego sygnału do wygenerowania.
  //
  // N2 (diagnoza Black Mountain 2026-10-01, P7): ta gałąź dawała zawsze
  // maksymalny wzrost, ignorując zapas regionu -- przy 184 jedn. w magazynie
  // i znikomym popycie cena mąki rosła 0,80 → 10 915 w 330 tickach. Teraz
  // punktem odniesienia jest sam popyt, a podaż to `effectiveSupply` (z
  // buforem zapasu), tak jak w gałęzi głównej: bez zapasu wynik jest jak
  // dawniej (pełny wzrost, (d − 0)/d = 1), zapas pokrywający popyt nie
  // podnosi ceny, a jego nadmiar ją obniża.
  const rawPressure =
    reference > 0
      ? PRICE_SENSITIVITY * ((demand - effectiveSupply) / reference)
      : demand > 0
        ? PRICE_SENSITIVITY * ((demand - effectiveSupply) / demand)
        : 0;
  const cappedPressure = clamp(
    rawPressure,
    -MAX_TICK_PRICE_CHANGE,
    MAX_TICK_PRICE_CHANGE,
  );
  // P14: przy trwałym braku ofert (albo rynku bez żadnej oferty) presja = 0 --
  // ostatnia cena zostaje jako orientacyjna; nie ma comiesięcznych +3% ani
  // resetu do ceny bazowej. Limit, wygładzanie i podłoga bez zmian.
  const offers = offerState(existing, input.offered);
  const pricePressure =
    offers.priceSuspension !== undefined ? 0 : cappedPressure * PRICE_SMOOTHING_FACTOR;

  const rawNewPrice = existing.localPrice * (1 + pricePressure);
  // Etap 4A (P12): cena jednostkowa z precyzją `PRICE_DECIMALS` (6 miejsc),
  // nie do grosza -- inaczej przy cenie ≤ 0,16 cały miesięczny ruch (≤ 3%)
  // był kasowany przez zaokrąglenie, w górę i w dół. Limit zmiany,
  // wygładzanie i `MIN_PRICE` bez zmian.
  const localPrice = roundPrice(Math.max(MIN_PRICE, rawNewPrice));

  const nextGoodState: MarketGoodState = withOptional(
    {
      ...existing,
      supply,
      demand,
      inventory,
      localPrice,
      shortageSeverity,
      pricePressure,
    },
    offers.tracked
      ? {
          offered: input.offered,
          ticksWithoutOffers: offers.ticksWithoutOffers,
          priceSuspension: offers.priceSuspension,
        }
      : {},
  );

  const nextMarket: Market = {
    ...market,
    goods: { ...market.goods, [goodId]: nextGoodState },
    history: pushRollingHistory(market.history, goodId, {
      supply,
      demand,
      price: localPrice,
    }),
  };

  const facts: FactInput<number>[] = [];
  const causalLinks: PendingCausalLink[] = [];
  const location = { regionId: market.regionId };
  const subject = { entityType: "marketGood", entityId: `${market.id}:${goodId}` };

  if (localPrice !== existing.localPrice) {
    facts.push({
      type: "price_changed",
      subject,
      location,
      values: {
        before: existing.localPrice,
        after: localPrice,
        delta: roundPrice(localPrice - existing.localPrice),
      },
    });

    // CE-04 (M17): rozkłada ruch ceny na niezależne czynniki (Causality
    // Engine Spec SS64 -- `price_changed` musi umieć powiedzieć, czy
    // stoi za nim spadek podaży, skok popytu czy bufor inventory, nie
    // tylko "demand != supply"). `reference` to już policzona wyżej
    // baseline NormalSupply; znak każdego czynnika to JEGO WŁASNY
    // kierunkowy nacisk (popyt powyżej baseline -> podnosi cenę; podaż
    // poniżej baseline -> podnosi cenę; jakiekolwiek inventory -> zawsze
    // obniża cenę, istnieje właśnie by buforować niedobór) -- niezależnie
    // od innych czynników czy netto delty. `external`: żaden fakt
    // wyższego poziomu jeszcze nie reprezentuje "obserwowanego tego ticka
    // popytu/podaży/inventory" (grupy rollout #2/#8 -- Resources/
    // Production -- pozwolą w przyszłym przebiegu podnieść źródło
    // `supply` do realnego `priorFact`, gdy te systemy zaczną emitować
    // własne fakty).
    const targetIndex = facts.length - 1;
    const demandContribution = clamp((demand - reference) / Math.max(reference, 1), -1, 1);
    causalLinks.push({
      targetIndex,
      source: { kind: "external", key: `market:${market.id}:${goodId}:demand` },
      type: directionalEdgeType(demandContribution),
      factor: { key: "demand", contribution: demandContribution },
      mechanism: "demand relative to the rolling NormalSupply baseline",
      system: "price-adjustment",
    });
    const supplyContribution = clamp((reference - supply) / Math.max(reference, 1), -1, 1);
    causalLinks.push({
      targetIndex,
      source: { kind: "external", key: `market:${market.id}:${goodId}:supply` },
      type: directionalEdgeType(supplyContribution),
      factor: { key: "supply", contribution: supplyContribution },
      mechanism: "supply relative to the rolling NormalSupply baseline",
      system: "price-adjustment",
    });
    if (inventory > 0) {
      const inventoryContribution = -clamp(inventory / Math.max(reference, 1), 0, 1);
      causalLinks.push({
        targetIndex,
        source: { kind: "external", key: `market:${market.id}:${goodId}:inventory` },
        type: "DAMPENING",
        factor: { key: "inventory_buffer", contribution: inventoryContribution },
        mechanism: "regional inventory buffers shortage before it reaches price pressure",
        system: "price-adjustment",
      });
    }
  }
  // P14: powód zatrzymania (i wznowienia) presji cenowej -- diagnostycznie,
  // w faktach i przyczynowości; cena jest wtedy orientacyjna.
  if (offers.priceSuspension !== undefined && existing.priceSuspension === undefined) {
    facts.push({
      type: "price_pressure_suspended",
      subject,
      location,
      values: { before: existing.localPrice, after: localPrice },
    });
    causalLinks.push({
      targetIndex: facts.length - 1,
      source: { kind: "external", key: `market:${market.id}:${goodId}:offers` },
      type: "CONSTRAINING",
      factor: {
        key:
          offers.priceSuspension === "NEVER_OFFERED" ? "never_offered" : "no_offers_in_window",
        contribution: offers.ticksWithoutOffers ?? 0,
      },
      mechanism:
        offers.priceSuspension === "NEVER_OFFERED"
          ? "no available offer has ever existed in this market -- the base price is only indicative"
          : "no available offer for the whole supply-history window -- the last price is only indicative",
      system: "price-adjustment",
    });
  } else if (offers.priceSuspension === undefined && existing.priceSuspension !== undefined) {
    facts.push({
      type: "price_pressure_resumed",
      subject,
      location,
      values: { before: existing.localPrice, after: localPrice },
    });
    causalLinks.push({
      targetIndex: facts.length - 1,
      source: { kind: "external", key: `market:${market.id}:${goodId}:offers` },
      type: "ENABLING",
      factor: { key: "offers_available", contribution: input.offered ?? 0 },
      mechanism: "goods are offered for sale again, so the price reacts to funded demand",
      system: "price-adjustment",
    });
  }
  if (shortageSeverity > 0 && existing.shortageSeverity === 0) {
    facts.push({
      type: "shortage_started",
      subject,
      location,
      values: {
        before: existing.shortageSeverity,
        after: shortageSeverity,
        delta: shortageSeverity,
      },
    });
    causalLinks.push({
      targetIndex: facts.length - 1,
      source: { kind: "external", key: `market:${market.id}:${goodId}:demand` },
      type: "CONTRIBUTING",
      factor: { key: "demand_exceeds_effective_supply", contribution: 1 },
      mechanism: "demand exceeded supply plus the inventory buffer this tick",
      system: "price-adjustment",
    });
  }

  return { market: nextMarket, facts, causalLinks };
}
