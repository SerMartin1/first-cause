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
 * M7-M11 (`Company.finance.*`, `MarketGoodState.localPrice`,
 * `CompanyWorkforce.wageOffer`) must land on this function before being
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
