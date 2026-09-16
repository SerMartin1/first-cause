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
 * Market (Entity Data Model SS15, DATA-006): one market per region --
 * not per settlement. A pure data holder in M3; price adjustment,
 * shortages/surpluses are M8. `price > 0`/`inventory >= 0` invariants
 * apply once M8 starts writing entries into `goods`; an empty market is
 * trivially valid.
 *
 * `history` (rolling price/supply/demand data for smoothing) is
 * omitted until M8 needs it -- it requires a real per-tick window,
 * which M3 does not wire up.
 */
export interface Market {
  readonly id: string;
  readonly regionId: string;
  readonly goods: Readonly<Record<string, MarketGoodState>>;
  readonly services: Readonly<Record<string, MarketServiceState>>;
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
  };
}
