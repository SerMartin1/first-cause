import { assertNonEmpty } from "../core/validation.js";

/** Entity Data Model SS15. */
export interface MarketGoodState {
  readonly supply: number;
  readonly demand: number;
  readonly inventory: number;
  readonly localPrice: number;
  readonly importDemand: number;
  readonly exportSupply: number;
  readonly shortageSeverity: number;
  readonly pricePressure: number;
}

export interface MarketServiceState {
  readonly supplyCapacity: number;
  readonly demand: number;
  readonly price: number;
  readonly accessibility: number;
}

/**
 * Rolling per-good windows (Entity Data Model SS15 `history.rolling*Data`)
 * that `markets/price-adjustment` (M8) reads as the "NormalSupply"
 * reference for `PricePressure = Sensitivity * ((Demand - Supply) /
 * NormalSupply)` (Vertical Slice Spec SS17). Keyed by good id, oldest
 * entry first; `price-adjustment.ts` owns trimming the window length.
 */
export interface MarketHistory {
  readonly rollingSupply: Readonly<Record<string, readonly number[]>>;
  readonly rollingDemand: Readonly<Record<string, readonly number[]>>;
  readonly rollingPrice: Readonly<Record<string, readonly number[]>>;
}

/**
 * Market (Entity Data Model SS15, DATA-006): one market per region --
 * not per settlement. A pure data holder in M3; price adjustment,
 * shortages/surpluses are M8. `price > 0`/`inventory >= 0` invariants
 * apply once M8 starts writing entries into `goods`; an empty market is
 * trivially valid.
 */
export interface Market {
  readonly id: string;
  readonly regionId: string;
  readonly goods: Readonly<Record<string, MarketGoodState>>;
  readonly services: Readonly<Record<string, MarketServiceState>>;
  readonly history: MarketHistory;
}

export interface CreateMarketInput {
  readonly id: string;
  readonly regionId: string;
}

export function createMarket(input: CreateMarketInput): Market {
  assertNonEmpty(input.id, "Market.id");
  assertNonEmpty(input.regionId, "Market.regionId");

  return {
    id: input.id,
    regionId: input.regionId,
    goods: {},
    services: {},
    history: { rollingSupply: {}, rollingDemand: {}, rollingPrice: {} },
  };
}
