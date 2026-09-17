import type { Inventory, InventoryItem } from "@first-cause/entities";
import type { FactInput, FactLocation } from "@first-cause/causality";
import {
  assertFinite,
  assertNonNegative,
  InvariantViolationError,
} from "../../core/validation.js";

/**
 * Inventory jako fizyczny rejestr dóbr (Entity Data Model SS16,
 * DATA-005): "the physical source of truth for goods". `production.ts`
 * (M7) jest jedynym miejscem, które dodaje/usuwa pozycje -- Market
 * (M8) nigdy nie posiada fizycznego zapasu, tylko go obserwuje.
 *
 * Oba operatory są czyste (bez efektów ubocznych) i fail-loud: usunięcie
 * więcej niż jest dostępne rzuca `InvariantViolationError`, zamiast po
 * cichu ściąć do zera -- ten sam standard co `buildCohortFamily` (M6) i
 * `extractFromDeposit` (M5), które też nigdy nie "naprawiają" wywołania
 * z błędną ilością, tylko sygnalizują je głośno wywołującemu.
 */

function inventoryLocation(inventory: Inventory): FactLocation {
  return { regionId: inventory.locationRegionId };
}

function inventoryItemFact(
  inventory: Inventory,
  itemId: string,
  before: number,
  after: number,
): FactInput<number> | undefined {
  if (after === before) return undefined;
  return {
    type: after > before ? "inventory_increased" : "inventory_decreased",
    subject: { entityType: "inventoryItem", entityId: `${inventory.id}:${itemId}` },
    location: inventoryLocation(inventory),
    values: { before, after, delta: after - before },
  };
}

export interface InventoryMutationResult {
  readonly inventory: Inventory;
  readonly fact: FactInput<number> | undefined;
}

/** Dodaje `quantity` sztuk `itemId` do inwentarza, tworząc pozycję, jeśli jeszcze nie istnieje. */
export function addToInventory(
  inventory: Inventory,
  itemId: string,
  quantity: number,
): InventoryMutationResult {
  assertNonNegative(quantity, `addToInventory(${itemId}).quantity`);
  if (quantity === 0) return { inventory, fact: undefined };

  const before = inventory.items[itemId]?.quantity ?? 0;
  const after = assertFinite(before + quantity, `addToInventory(${itemId}).result`);
  const existing = inventory.items[itemId];
  const item: InventoryItem = existing
    ? { ...existing, quantity: after }
    : { quantity: after, averageCost: 0, ageBuckets: {} };

  return {
    inventory: { ...inventory, items: { ...inventory.items, [itemId]: item } },
    fact: inventoryItemFact(inventory, itemId, before, after),
  };
}

/**
 * Usuwa `quantity` sztuk `itemId` z inwentarza. Rzuca, jeśli zapas jest
 * niewystarczający -- wywołujący (production.ts) ma obowiązek policzyć
 * bezpieczną ilość *przed* wywołaniem, nie polegać na tym, że to się tu
 * po cichu ograniczy (naprawiony przegląd P1 w M6 pokazał, dlaczego
 * ciche ograniczanie w tym silniku jest złym pomysłem).
 */
export function removeFromInventory(
  inventory: Inventory,
  itemId: string,
  quantity: number,
): InventoryMutationResult {
  assertNonNegative(quantity, `removeFromInventory(${itemId}).quantity`);
  if (quantity === 0) return { inventory, fact: undefined };

  const before = inventory.items[itemId]?.quantity ?? 0;
  if (quantity > before) {
    throw new InvariantViolationError(
      `removeFromInventory(${inventory.id}, ${itemId}): requested ${quantity}, only ${before} available`,
    );
  }
  const after = before - quantity;

  const items = { ...inventory.items };
  if (after === 0) {
    delete items[itemId];
  } else {
    items[itemId] = { ...inventory.items[itemId]!, quantity: after };
  }

  return {
    inventory: { ...inventory, items },
    fact: inventoryItemFact(inventory, itemId, before, after),
  };
}
