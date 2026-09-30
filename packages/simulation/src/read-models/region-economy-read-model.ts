import type { WorldState } from "@first-cause/entities";

/**
 * M21-VIS-R4B Economy (Canonical Decisions §52C).
 *
 * Gospodarka REGIONU z istniejącego stanu firm -- bez nowej mechaniki i bez
 * indeksu. Trzy osobne fakty, każdy z własną jednostką:
 *
 * - `employment` -- suma `Company.workforce.employees` aktywnych firm
 *   regionu (osoby; STAN na koniec ostatniego ticka). Zawsze znana: region
 *   bez aktywnych firm = znane 0.
 * - `sales` -- suma `Company.finance.revenue` aktywnych firm (jednostka
 *   pieniężna modelu; PRZEPŁYW za ostatni zakończony miesiąc, po lokalnej
 *   cenie rynku regionu). Przychód powstaje wyłącznie w regionie z Market
 *   i regionalnym Inventory (`economy-tick.ts`, krok 6), więc region poza
 *   modelem rynku ma „brak danych”, nie 0.
 * - `goods` -- wytworzona ilość per towar (jednostka towaru; bez sumy
 *   różnych towarów). `outputLastTick` jest sumą wyjść receptury, więc
 *   rozkład na towary wymaga proporcji `goodOutputsPerBatch` z contentu.
 */
export interface RegionEconomyGood {
  readonly goodId: string;
  /** Wytworzone w ostatnim ticku (jednostka towaru). */
  readonly produced: number;
  readonly companies: number;
  /** Lokalna cena rynku regionu; undefined = brak ceny (region bez rynku / towar nienotowany). */
  readonly localPrice: number | undefined;
}
export type RegionSalesFact =
  | { readonly status: "RECORDED"; readonly value: number; readonly tick: number }
  | {
      readonly status: "NO_DATA";
      readonly reason: "NO_COMPLETED_PERIOD" | "OUTSIDE_MARKET_MODEL";
    };
export interface RegionEconomyView {
  readonly employment: number;
  readonly activeCompanies: number;
  readonly sales: RegionSalesFact;
  readonly goods: readonly RegionEconomyGood[];
  /** Firmy z produkcją, której nie da się przypisać do towaru (nieznana receptura). */
  readonly unattributedCompanies: number;
}

export function buildRegionEconomyReadModels(
  state: WorldState,
  goodOutputsPerBatchByMethodId: Readonly<
    Record<string, Readonly<Record<string, number>>>
  > = {},
): ReadonlyMap<string, RegionEconomyView> {
  const result = new Map<string, RegionEconomyView>();
  const lastTick = state.world.currentTick - 1;
  for (const id of Object.keys(state.regions).sort()) {
    const region = state.regions[id]!;
    const companies = region.economy.companyIds
      .map((cid) => state.companies[cid]!)
      .filter((c) => c.status.active);
    const market = region.economy.marketId
      ? state.markets[region.economy.marketId]
      : undefined;
    const inMarketModel = !!market && !!region.economy.regionalInventoryId;
    const goods = new Map<string, { produced: number; companies: number }>();
    let unattributed = 0;
    for (const company of companies) {
      const methodId = company.production.productionMethodId;
      const outputs = methodId ? goodOutputsPerBatchByMethodId[methodId] : undefined;
      const total = outputs ? Object.values(outputs).reduce((a, b) => a + b, 0) : 0;
      if (!outputs || total <= 0) {
        if (company.production.outputLastTick > 0) unattributed++;
        continue;
      }
      for (const [goodId, perBatch] of Object.entries(outputs)) {
        const entry = goods.get(goodId) ?? { produced: 0, companies: 0 };
        entry.produced += (company.production.outputLastTick * perBatch) / total;
        entry.companies += 1;
        goods.set(goodId, entry);
      }
    }
    result.set(id, {
      employment: companies.reduce((sum, c) => sum + c.workforce.employees, 0),
      activeCompanies: companies.length,
      sales:
        lastTick < 0
          ? { status: "NO_DATA", reason: "NO_COMPLETED_PERIOD" }
          : !inMarketModel
            ? { status: "NO_DATA", reason: "OUTSIDE_MARKET_MODEL" }
            : {
                status: "RECORDED",
                value: companies.reduce((sum, c) => sum + c.finance.revenue, 0),
                tick: lastTick,
              },
      goods: [...goods.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([goodId, g]) => ({
          goodId,
          produced: g.produced,
          companies: g.companies,
          localPrice: market?.goods[goodId]?.localPrice,
        })),
      unattributedCompanies: unattributed,
    });
  }
  return result;
}
