import { describe, expect, it } from "vitest";
import { createInventory } from "@first-cause/entities";
import { addToInventory, removeFromInventory } from "./inventory.js";

function buildInventory() {
  return createInventory({
    id: "inventory_001",
    ownerType: "company",
    ownerId: "company_001",
    locationRegionId: "region_001",
  });
}

describe("addToInventory", () => {
  it("creates a new item when none exists yet", () => {
    const { inventory, fact } = addToInventory(buildInventory(), "flour", 10);
    expect(inventory.items.flour?.quantity).toBe(10);
    expect(fact).toEqual({
      type: "inventory_increased",
      subject: { entityType: "inventoryItem", entityId: "inventory_001:flour" },
      location: { regionId: "region_001" },
      values: { before: 0, after: 10, delta: 10 },
    });
  });

  it("adds to an existing item's quantity", () => {
    const first = addToInventory(buildInventory(), "flour", 10).inventory;
    const { inventory } = addToInventory(first, "flour", 5);
    expect(inventory.items.flour?.quantity).toBe(15);
  });

  it("is a no-op (no fact) for a zero quantity", () => {
    const { inventory, fact } = addToInventory(buildInventory(), "flour", 0);
    expect(inventory.items.flour).toBeUndefined();
    expect(fact).toBeUndefined();
  });

  it("rejects a negative quantity", () => {
    expect(() => addToInventory(buildInventory(), "flour", -1)).toThrow();
  });
});

describe("removeFromInventory", () => {
  it("subtracts from an existing item's quantity", () => {
    const stocked = addToInventory(buildInventory(), "flour", 10).inventory;
    const { inventory, fact } = removeFromInventory(stocked, "flour", 4);
    expect(inventory.items.flour?.quantity).toBe(6);
    expect(fact).toEqual({
      type: "inventory_decreased",
      subject: { entityType: "inventoryItem", entityId: "inventory_001:flour" },
      location: { regionId: "region_001" },
      values: { before: 10, after: 6, delta: -4 },
    });
  });

  it("removes the item entirely once its quantity reaches zero", () => {
    const stocked = addToInventory(buildInventory(), "flour", 10).inventory;
    const { inventory } = removeFromInventory(stocked, "flour", 10);
    expect(inventory.items.flour).toBeUndefined();
  });

  it("fails loud instead of silently clamping when asked to remove more than available (regression guard: same standard as buildCohortFamily/extractFromDeposit)", () => {
    const stocked = addToInventory(buildInventory(), "flour", 5).inventory;
    expect(() => removeFromInventory(stocked, "flour", 6)).toThrow(
      /requested 6, only 5 available/,
    );
  });

  it("rejects a negative quantity", () => {
    expect(() => removeFromInventory(buildInventory(), "flour", -1)).toThrow();
  });
});
