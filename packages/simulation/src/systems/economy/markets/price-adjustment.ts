import type { Market, MarketGoodState, MarketHistory } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import {
  assertFinite,
  assertNonNegative,
  assertPositive,
  InvariantViolationError,
} from "../../../core/validation.js";
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

/** Seeds a good's/resource's first `MarketGoodState` from its content `basePrice` (BaseContentPrice, M8 "Dane"). */
export function initializeMarketGood(basePrice: number): MarketGoodState {
  assertPositive(basePrice, "initializeMarketGood(basePrice)");
  return {
    supply: 0,
    demand: 0,
    inventory: 0,
    localPrice: basePrice,
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
}

export interface UpdateMarketGoodResult {
  readonly market: Market;
  readonly facts: readonly FactInput<number>[];
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
  // stan bez punktu odniesienia -- presja zostaje 0 zamiast dzielić przez
  // zero (Finite Numbers, Simulation Test Spec SS18), zamiast zgadywać.
  const rawPressure =
    reference > 0 ? PRICE_SENSITIVITY * ((demand - effectiveSupply) / reference) : 0;
  const cappedPressure = clamp(
    rawPressure,
    -MAX_TICK_PRICE_CHANGE,
    MAX_TICK_PRICE_CHANGE,
  );
  const pricePressure = cappedPressure * PRICE_SMOOTHING_FACTOR;

  const rawNewPrice = existing.localPrice * (1 + pricePressure);
  const localPrice = assertFinite(
    Math.max(MIN_PRICE, rawNewPrice),
    `updateMarketGood(${goodId}).localPrice`,
  );

  const nextGoodState: MarketGoodState = {
    ...existing,
    supply,
    demand,
    inventory,
    localPrice,
    shortageSeverity,
    pricePressure,
  };

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
        delta: localPrice - existing.localPrice,
      },
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
  }

  return { market: nextMarket, facts };
}
