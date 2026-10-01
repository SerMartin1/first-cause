import type { Inventory } from "@first-cause/entities";
import { assertNonNegative } from "../../core/validation.js";

/**
 * Etap 2 naprawy gospodarki (minimalne rozliczenie N6, 2026-10-01): rejestr
 * „komisu” w magazynie regionu (`Inventory.consignment`). Firma oddaje towar
 * do magazynu bez zapłaty; pieniądze dostaje dopiero wtedy, gdy ktoś go
 * faktycznie kupi (diagnoza Black Mountain P1: magazyn płacił za całą
 * produkcję, także niesprzedaną). Ilości właścicieli zmieniają się pro rata
 * do zapasu: zakup lub wywóz zabiera z każdego wpisu ten sam ułamek, a część
 * zapasu bez właściciela (np. stary zapas, już opłacony w poprzednim modelu)
 * nie przynosi nikomu pieniędzy.
 *
 * Funkcje NIE zmieniają `items` -- fizyczny ruch towaru dalej robią
 * `addToInventory`/`removeFromInventory` (fakty `inventory_*`); tu tylko
 * rejestr własności, wywoływany z ilością zapasu sprzed ruchu.
 */
const EPSILON = 1e-9;

export type OwnerQuantities = Readonly<Record<string, number>>;

export function consignmentOf(inventory: Inventory, itemId: string): OwnerQuantities {
  return inventory.consignment?.[itemId] ?? {};
}

function withItemConsignment(
  inventory: Inventory,
  itemId: string,
  owners: Record<string, number>,
): Inventory {
  const cleaned = Object.fromEntries(
    Object.entries(owners)
      .filter(([, q]) => q > EPSILON)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  const consignment = { ...(inventory.consignment ?? {}) };
  if (Object.keys(cleaned).length > 0) consignment[itemId] = cleaned;
  else delete consignment[itemId];
  return { ...inventory, consignment };
}

/** Firma `ownerId` oddaje `quantity` jednostek do magazynu w komis. */
export function addConsignment(
  inventory: Inventory,
  itemId: string,
  ownerId: string,
  quantity: number,
): Inventory {
  assertNonNegative(quantity, "addConsignment().quantity");
  if (quantity <= 0) return inventory;
  const owners = { ...consignmentOf(inventory, itemId) };
  owners[ownerId] = (owners[ownerId] ?? 0) + quantity;
  return withItemConsignment(inventory, itemId, owners);
}

export interface TakeConsignmentResult {
  readonly inventory: Inventory;
  /** ownerId -> ilość zabrana z jego wpisu. */
  readonly takenByOwner: OwnerQuantities;
  /** Część bez właściciela. */
  readonly unowned: number;
}

/**
 * Zabiera `quantity` z rejestru pro rata do zapasu `stockBefore` (ilość w
 * magazynie PRZED fizycznym zdjęciem towaru). Wpisy ponad zapas (np. po
 * zmianie zapasu poza rejestrem) są przycinane do zapasu.
 */
export function takeConsignment(
  inventory: Inventory,
  itemId: string,
  quantity: number,
  stockBefore: number,
): TakeConsignmentResult {
  assertNonNegative(quantity, "takeConsignment().quantity");
  const owners = consignmentOf(inventory, itemId);
  const ids = Object.keys(owners).sort();
  if (quantity <= 0 || stockBefore <= 0 || ids.length === 0)
    return { inventory, takenByOwner: {}, unowned: quantity };
  const ownedTotal = ids.reduce((sum, id) => sum + owners[id]!, 0);
  const scale = ownedTotal > stockBefore ? stockBefore / ownedTotal : 1;
  const fraction = Math.min(1, quantity / stockBefore);
  const takenByOwner: Record<string, number> = {};
  const remaining: Record<string, number> = {};
  let taken = 0;
  for (const id of ids) {
    const own = owners[id]! * scale;
    const take = own * fraction;
    takenByOwner[id] = take;
    remaining[id] = own - take;
    taken += take;
  }
  return {
    inventory: withItemConsignment(inventory, itemId, remaining),
    takenByOwner,
    unowned: Math.max(0, quantity - taken),
  };
}

/** Przeniesienie własności razem z towarem (handel): ci sami właściciele, ten sam ułamek. */
export function moveConsignment(
  from: Inventory,
  to: Inventory,
  itemId: string,
  quantity: number,
  stockBefore: number,
): { readonly from: Inventory; readonly to: Inventory } {
  const take = takeConsignment(from, itemId, quantity, stockBefore);
  let next = to;
  for (const [ownerId, q] of Object.entries(take.takenByOwner).sort(([a], [b]) =>
    a.localeCompare(b),
  ))
    next = addConsignment(next, itemId, ownerId, q);
  return { from: take.inventory, to: next };
}
