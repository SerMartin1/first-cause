import { assertNonEmpty, assertNonNegative } from "../core/validation.js";

/** Entity Data Model SS16. */
export type InventoryOwnerType = "region" | "company" | "settlement";

export interface InventoryItem {
  readonly quantity: number;
  readonly averageCost: number;
  /** Exact bucket semantics belong to the system that needs aged stock (M7+); an open bag for now. */
  readonly ageBuckets: Readonly<Record<string, number>>;
}

export interface InventoryCapacity {
  readonly general: number;
  readonly refrigerated: number;
  readonly secure: number;
  readonly hazardous: number;
}

/**
 * Inventory (Entity Data Model SS16, DATA-005): the physical source of
 * truth for goods. A Market never owns physical stock -- only
 * Inventory does.
 */
export interface Inventory {
  readonly id: string;
  readonly ownerType: InventoryOwnerType;
  readonly ownerId: string;
  readonly locationRegionId: string;
  readonly items: Readonly<Record<string, InventoryItem>>;
  readonly capacity: InventoryCapacity;
  /**
   * Etap 2 naprawy gospodarki (minimalne rozliczenie N6, 2026-10-01): towar
   * oddany przez firmy do magazynu regionu „w komis” -- itemId -> ownerId
   * (firma) -> ilość jeszcze niesprzedana. Kupujący płaci właścicielom pro
   * rata; ilość ponad sumę wpisów nie ma właściciela (np. zapas ze starego
   * modelu, w którym magazyn płacił od razu). Brak pola = brak wpisów.
   */
  readonly consignment?: Readonly<Record<string, Readonly<Record<string, number>>>>;
  /**
   * Etap 4B (2026-10-01): cena wyładunku lotu w komisie -- itemId -> ownerId
   * -> cena za jednostkę (cena towaru u eksportera + opłata za przewóz).
   * Kupujący płaci właścicielowi tę cenę; brak wpisu = cena lokalna rynku
   * (towar wyprodukowany w regionie). Brak pola = brak wpisów.
   */
  readonly consignmentPrice?: Readonly<Record<string, Readonly<Record<string, number>>>>;
}

export interface CreateInventoryInput {
  readonly id: string;
  readonly ownerType: InventoryOwnerType;
  readonly ownerId: string;
  readonly locationRegionId: string;
  readonly capacity?: Partial<InventoryCapacity>;
}

export function createInventory(input: CreateInventoryInput): Inventory {
  assertNonEmpty(input.id, "Inventory.id");
  assertNonEmpty(input.ownerId, "Inventory.ownerId");
  assertNonEmpty(input.locationRegionId, "Inventory.locationRegionId");

  const capacity: InventoryCapacity = {
    general: input.capacity?.general ?? 0,
    refrigerated: input.capacity?.refrigerated ?? 0,
    secure: input.capacity?.secure ?? 0,
    hazardous: input.capacity?.hazardous ?? 0,
  };
  for (const [key, value] of Object.entries(capacity)) {
    assertNonNegative(value, `Inventory.capacity.${key}`);
  }

  return {
    id: input.id,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    locationRegionId: input.locationRegionId,
    items: {},
    capacity,
  };
}
