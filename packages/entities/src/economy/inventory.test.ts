import { describe, expect, it } from "vitest";
import { createInventory } from "./inventory.js";

describe("createInventory", () => {
  it("starts with no items and zero capacity by default", () => {
    const inventory = createInventory({
      id: "inventory_001",
      ownerType: "company",
      ownerId: "company_001",
      locationRegionId: "region_001",
    });

    expect(inventory.items).toEqual({});
    expect(inventory.capacity).toEqual({
      general: 0,
      refrigerated: 0,
      secure: 0,
      hazardous: 0,
    });
  });

  it("rejects a negative capacity", () => {
    expect(() =>
      createInventory({
        id: "inventory_001",
        ownerType: "region",
        ownerId: "region_001",
        locationRegionId: "region_001",
        capacity: { general: -1 },
      }),
    ).toThrow();
  });
});
