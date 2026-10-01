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
  /**
   * Etap 2 naprawy gospodarki (N7, 2026-10-01), tylko dobro przetrwania:
   * potrzeby mieszkańców (jednostki koszyka × ludność) i faktyczne zakupy
   * gospodarstw w ostatnim ticku. Popyt opłacalny to `demand`. Brak pola =
   * brak danych (rynek bez gospodarstw albo stan sprzed etapu 2).
   */
  readonly householdNeed?: number;
  readonly householdPurchased?: number;
  /**
   * P14 (2026-10-01): dostępne oferty w ostatnim ticku -- towar faktycznie
   * wystawiony na sprzedaż w magazynie regionu przed zakupami (produkcja
   * oddana w komis, zapas, przywieziony import); bez buforów firm i bez
   * przyszłej produkcji. Brak pola = brak danych.
   */
  readonly offered?: number;
  /**
   * P14: liczba kolejnych ticków bez dostępnych ofert (0 = oferty w ostatnim
   * ticku). Brak pola = rynek nie miał jeszcze żadnej oferty (albo stan z
   * zapisu sprzed schematu 7 bez śladu oferty).
   */
  readonly ticksWithoutOffers?: number;
  /**
   * P14: powód zatrzymania automatycznej presji cenowej (cena jest wtedy
   * orientacyjna, niepotwierdzona zakupami): `NEVER_OFFERED` -- rynek bez
   * żadnej oferty; `NO_OFFERS_IN_WINDOW` -- brak ofert przez całe okno
   * historii. Brak pola = cena reaguje normalnie.
   */
  readonly priceSuspension?: "NEVER_OFFERED" | "NO_OFFERS_IN_WINDOW";
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
