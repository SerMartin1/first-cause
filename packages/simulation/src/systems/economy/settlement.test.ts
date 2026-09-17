import { describe, expect, it } from "vitest";
import { createCompany, createInventory } from "@first-cause/entities";
import { addToInventory } from "./inventory.js";
import {
  applyCompanyFinances,
  settleHouseholdPurchase,
  settleProductionSale,
  settleTradeFlow,
} from "./settlement.js";

function buildCompanyInventory(id = "inventory_company_001") {
  return createInventory({
    id,
    ownerType: "company",
    ownerId: "company_001",
    locationRegionId: "region_001",
  });
}

function buildRegionInventory(id = "inventory_region_001") {
  return createInventory({
    id,
    ownerType: "region",
    ownerId: "region_001",
    locationRegionId: "region_001",
  });
}

function buildCompany() {
  return createCompany({
    id: "company_001",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: "inventory_company_001",
    initialCash: 100,
  });
}

describe("settleProductionSale", () => {
  it("sells only the surplus above the target buffer, into the region inventory", () => {
    const companyInventory = addToInventory(
      buildCompanyInventory(),
      "bread",
      30,
    ).inventory;
    const regionInventory = buildRegionInventory();

    const result = settleProductionSale({
      companyInventory,
      regionInventory,
      goodId: "bread",
      price: 2,
      targetBufferQuantity: 10,
    });

    expect(result.quantitySold).toBe(20);
    expect(result.revenue).toBe(40);
    expect(result.companyInventory.items.bread?.quantity).toBe(10);
    expect(result.regionInventory.items.bread?.quantity).toBe(20);
    expect(result.facts).toHaveLength(2);
  });

  it("is a no-op when inventory is at or below the target buffer", () => {
    const companyInventory = addToInventory(
      buildCompanyInventory(),
      "bread",
      5,
    ).inventory;
    const regionInventory = buildRegionInventory();

    const result = settleProductionSale({
      companyInventory,
      regionInventory,
      goodId: "bread",
      price: 2,
      targetBufferQuantity: 10,
    });

    expect(result.quantitySold).toBe(0);
    expect(result.revenue).toBe(0);
    expect(result.facts).toHaveLength(0);
  });
});

describe("applyCompanyFinances", () => {
  it("credits cash by revenue minus costs and records this tick's flow", () => {
    const { company, facts } = applyCompanyFinances({
      company: buildCompany(),
      revenue: 40,
      costs: 15,
    });

    expect(company.finance.cash).toBe(125);
    expect(company.finance.revenue).toBe(40);
    expect(company.finance.costs).toBe(15);
    expect(company.finance.profit).toBe(25);
    expect(facts).toEqual([
      {
        type: "company_finances_settled",
        subject: { entityType: "company", entityId: "company_001" },
        location: { regionId: "region_001" },
        values: { before: 100, after: 125, delta: 25 },
      },
    ]);
  });

  it("debits cash when costs exceed revenue this tick", () => {
    const { company } = applyCompanyFinances({
      company: buildCompany(),
      revenue: 10,
      costs: 40,
    });

    expect(company.finance.cash).toBe(70);
    expect(company.finance.profit).toBe(-30);
  });
});

describe("settleHouseholdPurchase", () => {
  it("removes the desired physical quantity from the region inventory", () => {
    const regionInventory = addToInventory(buildRegionInventory(), "bread", 50).inventory;

    const result = settleHouseholdPurchase({
      regionInventory,
      goodId: "bread",
      desiredQuantity: 20,
    });

    expect(result.quantityPurchased).toBe(20);
    expect(result.regionInventory.items.bread?.quantity).toBe(30);
  });

  it("partially fulfills the purchase when the region is short on physical stock", () => {
    const regionInventory = addToInventory(buildRegionInventory(), "bread", 5).inventory;

    const result = settleHouseholdPurchase({
      regionInventory,
      goodId: "bread",
      desiredQuantity: 20,
    });

    expect(result.quantityPurchased).toBe(5);
    expect(result.regionInventory.items.bread).toBeUndefined();
  });

  it("is a no-op when the region has none of the good at all", () => {
    const regionInventory = buildRegionInventory();

    const result = settleHouseholdPurchase({
      regionInventory,
      goodId: "bread",
      desiredQuantity: 20,
    });

    expect(result.quantityPurchased).toBe(0);
    expect(result.facts).toHaveLength(0);
  });
});

describe("settleTradeFlow", () => {
  it("moves the decided quantity from the exporting to the importing region inventory", () => {
    const exportingInventory = addToInventory(
      buildRegionInventory("inventory_region_export"),
      "grain",
      100,
    ).inventory;
    const importingInventory = buildRegionInventory("inventory_region_import");

    const result = settleTradeFlow({
      exportingInventory,
      importingInventory,
      goodId: "grain",
      desiredQuantity: 40,
    });

    expect(result.quantityMoved).toBe(40);
    expect(result.exportingInventory.items.grain?.quantity).toBe(60);
    expect(result.importingInventory.items.grain?.quantity).toBe(40);
  });

  it("caps the move at the exporting region's real physical stock", () => {
    const exportingInventory = addToInventory(
      buildRegionInventory("inventory_region_export"),
      "grain",
      10,
    ).inventory;
    const importingInventory = buildRegionInventory("inventory_region_import");

    const result = settleTradeFlow({
      exportingInventory,
      importingInventory,
      goodId: "grain",
      desiredQuantity: 40,
    });

    expect(result.quantityMoved).toBe(10);
    expect(result.exportingInventory.items.grain).toBeUndefined();
    expect(result.importingInventory.items.grain?.quantity).toBe(10);
  });
});
