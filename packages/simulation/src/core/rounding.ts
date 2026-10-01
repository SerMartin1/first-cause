import { assertFinite, assertSafeInteger } from "./validation.js";

/**
 * Money and rounding policy (resolves OPEN-008 -- see
 * `docs/adr/ADR-001-m1-deterministic-core.md` SS4).
 *
 * Money is never represented as a float source of truth. Internally it
 * is an integer count of minor units ("cents"): `MONEY_SCALE` major-unit
 * fractions per 1 major unit.
 */
export const MONEY_SCALE = 100;

/**
 * Round-half-to-even ("banker's rounding"). Chosen over round-half-away-
 * from-zero because Vertical Slice runs hundreds of simulated years of
 * repeated aggregation (wages/prices/taxes every tick); round-half-to-even
 * does not accumulate a systematic bias the way round-half-up does over
 * that many operations.
 */
export function roundHalfEven(value: number): number {
  assertFinite(value, "roundHalfEven(value)");
  const floor = Math.floor(value);
  const diff = value - floor;

  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  // Exactly .5: round to the even neighbor.
  return floor % 2 === 0 ? floor : floor + 1;
}

/** Converts a fractional major-unit amount (e.g. 12.345) to integer minor units. */
export function toMoneyMinorUnits(majorAmount: number): number {
  assertFinite(majorAmount, "toMoneyMinorUnits(majorAmount)");
  const minor = roundHalfEven(majorAmount * MONEY_SCALE);
  return assertSafeInteger(minor, "toMoneyMinorUnits(result)");
}

/** Converts integer minor units back to a major-unit amount, for display only. */
export function fromMoneyMinorUnits(minorAmount: number): number {
  assertSafeInteger(minorAmount, "fromMoneyMinorUnits(minorAmount)");
  return minorAmount / MONEY_SCALE;
}

/**
 * Rounding-discipline guard (audit P0-07): every money mutation across
 * M7-M11 (`Company.finance.*`, `CompanyWorkforce.wageOffer`; od etapu 4A
 * cena jednostkowa `MarketGoodState.localPrice` używa `roundPrice`, nie
 * tej funkcji) must land on this function before being
 * stored, so the value is always safe-integer and cent-aligned --
 * `roundHalfEven(999.9187...) !== 999.92` on its own; only round-tripping
 * through minor units guarantees that. Storage stays major-unit `number`
 * (a full migration to integer-minor-units-as-storage is a separate,
 * larger decision -- ADR-001 SS4 requires the *representation discipline*
 * here, not a field-width change to every entity in the same pass).
 */
export function roundMoney(majorAmount: number): number {
  return fromMoneyMinorUnits(toMoneyMinorUnits(majorAmount));
}

/**
 * Etap 4A naprawy gospodarki (P12, 2026-10-01): precyzja ceny jednostkowej
 * (`MarketGoodState.localPrice`) jest oddzielona od precyzji pieniędzy.
 * Cena to stawka za jednostkę towaru, nie przelew -- trzyma
 * `PRICE_DECIMALS` miejsc po przecinku. Wcześniej cena szła przez
 * `roundMoney`, więc przy cenie ≤ 0,16 największa miesięczna zmiana (3%)
 * była mniejsza niż pół grosza i zaokrąglenie ją kasowało -- cena zamarzała
 * także przy niedoborze. Salda, przelewy, wypłaty i wartości transakcji
 * nadal rozliczane są w groszach (`roundMoney` / `transactionValue`).
 */
export const PRICE_DECIMALS = 6;
const PRICE_SCALE = 10 ** PRICE_DECIMALS;

/**
 * Cena jednostkowa zaokrąglona (round-half-even) do `PRICE_DECIMALS` miejsc.
 * Bez asercji „safe integer” (w odróżnieniu od `roundMoney`): cena nie jest
 * kwotą w groszach, a przy 6 miejscach taki limit wypadałby już przy cenie
 * ~9·10⁹ -- region z trwałym popytem i zerową podażą (cena +3%/mies. bez
 * górnej granicy, P14) wywracałby symulację po ~700 tickach. Powyżej tego
 * progu tracimy tylko precyzję poniżej 10⁻⁶; wynik zawsze skończony.
 */
export function roundPrice(price: number): number {
  assertFinite(price, "roundPrice(price)");
  return assertFinite(roundHalfEven(price * PRICE_SCALE) / PRICE_SCALE, "roundPrice(result)");
}

/**
 * P12b (2026-10-01): stawka płacy (`CompanyWorkforce.wageOffer`, za osobę na
 * miesiąc) to stawka, nie przelew -- ta sama precyzja `PRICE_DECIMALS` co
 * cena jednostkowa. Przy groszach płaca ≤ 0,16 nie mogła się zmienić (krok
 * ≤ 3% < pół grosza). Faktyczna wypłata: `transactionValue(pracownicy,
 * stawka)` -- grosze, jedno zaokrąglenie.
 */
export function roundWageRate(rate: number): number {
  return roundPrice(rate);
}

/**
 * Wartość transakcji w groszach: ilość × cena modelowa, zaokrąglona
 * dokładnie raz, tutaj. Wywołujący odejmuje tę kwotę kupującemu i dodaje
 * identyczną sprzedawcy.
 */
export function transactionValue(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}
