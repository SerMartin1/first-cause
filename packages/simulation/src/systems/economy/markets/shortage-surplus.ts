import { assertNonNegative } from "../../../core/validation.js";

/**
 * Shortage/surplus classification (Vertical Slice Spec SS17 "Rynek":
 * `Shortage Severity` field on `MarketGoodState`; "Obowiązkowe
 * zabezpieczenia" include an "inventory buffer"). Market never owns
 * physical stock (DATA-005/DATA-006, `Market nie jest właścicielem
 * fizycznego zapasu`) -- it only *observes* the region's `Inventory`
 * quantity for this good, supplied by the caller.
 *
 * `INVENTORY_BUFFER_ABSORPTION` is the inventory-buffer safeguard: a raw
 * production shortfall (`demand > supply`) is dampened, not masked, by
 * whatever physical stock is already sitting in warehouses -- full stock
 * softens a shortage instead of hiding it outright, so shortageSeverity
 * still trends toward 1 if the underlying imbalance persists long enough
 * to draw inventory down tick after tick.
 */
const INVENTORY_BUFFER_ABSORPTION = 0.5; // TODO tuning

export interface ShortageSurplusInput {
  readonly supply: number;
  readonly demand: number;
  readonly inventory: number;
}

export interface ShortageSurplusResult {
  /** In [0, 1]: 0 whenever buffered supply already covers demand (includes every surplus). */
  readonly shortageSeverity: number;
  /** Supply cushioned by the inventory buffer -- what `price-adjustment.ts` treats as "available" this tick. */
  readonly effectiveSupply: number;
}

export function classifyShortageSurplus(
  input: ShortageSurplusInput,
): ShortageSurplusResult {
  const supply = assertNonNegative(input.supply, "classifyShortageSurplus().supply");
  const demand = assertNonNegative(input.demand, "classifyShortageSurplus().demand");
  const inventory = assertNonNegative(
    input.inventory,
    "classifyShortageSurplus().inventory",
  );

  const effectiveSupply = supply + inventory * INVENTORY_BUFFER_ABSORPTION;
  const gap = demand - effectiveSupply;
  const shortageSeverity = demand > 0 ? Math.min(1, Math.max(0, gap / demand)) : 0;

  return { shortageSeverity, effectiveSupply };
}
