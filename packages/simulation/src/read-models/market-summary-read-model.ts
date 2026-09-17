import type { WorldState } from "@first-cause/entities";

/**
 * MarketSummaryReadModel (Etap 1 tick-loop integration, audytowe P1-06):
 * jedyny dotąd sposób obejrzenia `Market.goods` był przez surowy
 * `WorldState` -- ten read-model wystawia je per dobro, w kształcie
 * przydatnym do weryfikacji tick-loopa (cena/podaż/popyt/niedobór).
 */
export interface MarketGoodSummary {
  readonly goodId: string;
  readonly localPrice: number;
  readonly supply: number;
  readonly demand: number;
  readonly shortageSeverity: number;
}

export interface MarketSummaryReadModel {
  readonly marketId: string;
  readonly regionId: string;
  readonly goods: readonly MarketGoodSummary[];
}

export function buildMarketSummaryReadModel(
  state: WorldState,
  marketId: string,
): MarketSummaryReadModel | undefined {
  const market = state.markets[marketId];
  if (!market) return undefined;

  const goods = Object.entries(market.goods)
    .map(([goodId, good]) => ({
      goodId,
      localPrice: good.localPrice,
      supply: good.supply,
      demand: good.demand,
      shortageSeverity: good.shortageSeverity,
    }))
    .sort((a, b) => a.goodId.localeCompare(b.goodId));

  return { marketId: market.id, regionId: market.regionId, goods };
}
