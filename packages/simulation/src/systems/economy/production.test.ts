import { describe, expect, it } from "vitest";
import {
  createCompany,
  createInventory,
  createResourceDeposit,
  type Company,
  type Inventory,
  type ResourceDeposit,
} from "@first-cause/entities";
import { addToInventory } from "./inventory.js";
import {
  DEFAULT_PRODUCTION_RECIPES,
  runProduction,
  type ProductionRecipe,
} from "./production.js";

function buildCompany(overrides?: { capacity?: number; utilization?: number }): Company {
  const base = createCompany({
    id: "company_farm",
    archetypeId: "grain_farm",
    name: "Test Grain Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: "inventory_farm",
  });
  return {
    ...base,
    production: {
      ...base.production,
      capacity: overrides?.capacity ?? 10,
      utilization: overrides?.utilization ?? 1,
    },
  };
}

function buildInventory(): Inventory {
  return createInventory({
    id: "inventory_farm",
    ownerType: "company",
    ownerId: "company_farm",
    locationRegionId: "region_001",
  });
}

function buildGrainDeposit(initialQuantity: number): ResourceDeposit {
  return createResourceDeposit({
    id: "deposit_grain",
    resourceDefinitionId: "grain",
    regionId: "region_001",
    initialQuantity,
    renewable: true,
    renewableState: {
      regenerationRate: 0.05,
      sustainableYield: 300,
      carryingCapacity: 2500,
    },
  });
}

const MANUAL_FARMING = DEFAULT_PRODUCTION_RECIPES.manual_farming!;
const MANUAL_FOOD_PROCESSING = DEFAULT_PRODUCTION_RECIPES.manual_food_processing!;

describe("runProduction -- batches (ECO-007, Production-Economy-Master SS11)", () => {
  it("runs capacity-limited batches, extracting the resource and producing the good", () => {
    const result = runProduction({
      tick: 0,
      company: buildCompany({ capacity: 3, utilization: 1 }),
      inventory: buildInventory(),
      recipe: MANUAL_FARMING,
      resourceDeposits: { grain: buildGrainDeposit(1000) },
    });

    expect(result.batches).toBe(3);
    expect(result.resourceDeposits.grain!.stock.quantity).toBe(1000 - 3 * 10);
    expect(result.inventory.items.flour?.quantity).toBe(3 * 8);
    expect(result.company.production.outputLastTick).toBe(3 * 8);
    expect(result.company.production.inputRequirements).toEqual({ grain: 30 });
    expect(result.company.production.productionMethodId).toBe("manual_farming");
  });

  it("floors utilization*capacity to a whole batch count", () => {
    const result = runProduction({
      tick: 0,
      company: buildCompany({ capacity: 10, utilization: 0.25 }),
      inventory: buildInventory(),
      recipe: MANUAL_FARMING,
      resourceDeposits: { grain: buildGrainDeposit(1000) },
    });
    expect(result.batches).toBe(2); // floor(10 * 0.25) = 2
  });

  it("is limited by resource deposit availability, never extracting more than exists (ECO-010, same physical invariant as extractFromDeposit)", () => {
    const result = runProduction({
      tick: 0,
      company: buildCompany({ capacity: 10, utilization: 1 }),
      inventory: buildInventory(),
      recipe: MANUAL_FARMING,
      resourceDeposits: { grain: buildGrainDeposit(25) }, // enough for 2 batches (2*10=20), not 3
    });

    expect(result.batches).toBe(2);
    expect(result.resourceDeposits.grain!.stock.quantity).toBe(5);
    expect(result.resourceDeposits.grain!.stock.quantity).toBeGreaterThanOrEqual(0);
  });

  it("is limited by good-input availability in the company's own Inventory", () => {
    const bakery: Company = {
      ...buildCompany({ capacity: 10, utilization: 1 }),
      id: "company_bakery",
      archetypeId: "bakery",
    };
    const stockedInventory = addToInventory(buildInventory(), "flour", 12).inventory; // enough for 2 batches (2*5=10), not 3

    const result = runProduction({
      tick: 0,
      company: bakery,
      inventory: stockedInventory,
      recipe: MANUAL_FOOD_PROCESSING,
      resourceDeposits: {},
    });

    expect(result.batches).toBe(2);
    expect(result.inventory.items.flour?.quantity).toBe(2); // 12 - 2*5
    expect(result.inventory.items.bread?.quantity).toBe(8); // 2*4
  });

  it("runs zero batches (no-op, no negative stock) when capacity is zero", () => {
    const result = runProduction({
      tick: 0,
      company: buildCompany({ capacity: 0, utilization: 1 }),
      inventory: buildInventory(),
      recipe: MANUAL_FARMING,
      resourceDeposits: { grain: buildGrainDeposit(1000) },
    });

    expect(result.batches).toBe(0);
    expect(result.facts).toEqual([]);
    expect(result.inventory.items.flour).toBeUndefined();
    expect(result.resourceDeposits.grain!.stock.quantity).toBe(1000);
  });

  it("throws instead of silently skipping a required resource with no matching deposit provided", () => {
    expect(() =>
      runProduction({
        tick: 0,
        company: buildCompany(),
        inventory: buildInventory(),
        recipe: MANUAL_FARMING,
        resourceDeposits: {},
      }),
    ).toThrow(/requires resource "grain"/);
  });
});

describe("runProduction -- chain (Zboże -> Mąka -> Żywność, Production-Economy-Master SS13)", () => {
  it("chains two companies' production by hand-carrying the output good into the next company's Inventory (no Market yet -- that's M8)", () => {
    const farm = buildCompany({ capacity: 5, utilization: 1 });
    const farmResult = runProduction({
      tick: 0,
      company: farm,
      inventory: buildInventory(),
      recipe: MANUAL_FARMING,
      resourceDeposits: { grain: buildGrainDeposit(1000) },
    });
    expect(farmResult.inventory.items.flour?.quantity).toBe(40); // 5 batches * 8 flour

    const bakery: Company = {
      ...buildCompany({ capacity: 5, utilization: 1 }),
      id: "company_bakery",
      archetypeId: "bakery",
    };
    const bakeryInventory: Inventory = {
      ...createInventory({
        id: "inventory_bakery",
        ownerType: "company",
        ownerId: "company_bakery",
        locationRegionId: "region_001",
      }),
      items: farmResult.inventory.items, // hand-carry: the farm's flour becomes the bakery's stock
    };

    const bakeryResult = runProduction({
      tick: 0,
      company: bakery,
      inventory: bakeryInventory,
      recipe: MANUAL_FOOD_PROCESSING,
      resourceDeposits: {},
    });

    expect(bakeryResult.batches).toBe(5); // 40 flour / 5-per-batch = 8, capped by capacity=5
    expect(bakeryResult.inventory.items.bread?.quantity).toBe(20); // 5 * 4
    expect(bakeryResult.inventory.items.flour?.quantity).toBe(15); // 40 - 5*5
  });
});

describe("runProduction -- M7 Acceptance Gate (real M4 fixture company: Green Valley Grain Farm)", () => {
  // Values replicated from tests/worldgen/fixtures/black_mountain_reference.json
  // (company_green_valley_farm / deposit_green_valley_grain /
  // inventory_green_valley_farm), the same way cohorts.test.ts mirrors the
  // fixture's population shape rather than depending on @first-cause/worldgen.
  it("produces a real good (flour) from real inputs (grain extracted from the fixture's actual deposit), with growing inventory and never-negative stock", () => {
    let company = buildCompany({ capacity: 10, utilization: 1 });
    company = { ...company, id: "company_green_valley_farm", archetypeId: "grain_farm" };
    let inventory: Inventory = {
      ...createInventory({
        id: "inventory_green_valley_farm",
        ownerType: "company",
        ownerId: "company_green_valley_farm",
        locationRegionId: "region_green_valley",
      }),
    };
    let deposits: Readonly<Record<string, ResourceDeposit>> = {
      grain: createResourceDeposit({
        id: "deposit_green_valley_grain",
        resourceDefinitionId: "grain",
        regionId: "region_green_valley",
        initialQuantity: 2000,
        renewable: true,
        renewableState: {
          regenerationRate: 0.05,
          sustainableYield: 300,
          carryingCapacity: 2500,
        },
      }),
    };

    for (let tick = 0; tick < 12; tick++) {
      const result = runProduction({
        tick,
        company,
        inventory,
        recipe: MANUAL_FARMING,
        resourceDeposits: deposits,
      });
      company = result.company;
      inventory = result.inventory;
      deposits = result.resourceDeposits;

      expect(deposits.grain!.stock.quantity).toBeGreaterThanOrEqual(0);
      expect(inventory.items.flour?.quantity ?? 0).toBeGreaterThanOrEqual(0);
    }

    expect(inventory.items.flour?.quantity).toBe(12 * 10 * 8); // 10 batches/tick * 8 flour/batch
    expect(deposits.grain!.stock.quantity).toBe(2000 - 12 * 10 * 10); // 10 batches/tick * 10 grain/batch
    expect(company.production.outputLastTick).toBe(10 * 8);
  });
});

describe("runProduction -- recipe input validation", () => {
  it("rejects a negative quantityPerBatch instead of silently treating it as unbounded", () => {
    const badRecipe: ProductionRecipe = {
      productionMethodId: "broken",
      resourceInputsPerBatch: { grain: -1 },
      goodInputsPerBatch: {},
      goodOutputsPerBatch: {},
    };
    expect(() =>
      runProduction({
        tick: 0,
        company: buildCompany(),
        inventory: buildInventory(),
        recipe: badRecipe,
        resourceDeposits: { grain: buildGrainDeposit(1000) },
      }),
    ).toThrow();
  });
});
