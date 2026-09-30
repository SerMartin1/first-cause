import { describe, expect, it } from "vitest";
import {
  createCompany,
  createInventory,
  createMarket,
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createWorld,
  createWorldState,
  type Company,
  type WorldState,
} from "@first-cause/entities";
import { buildRegionEconomyReadModels } from "./region-economy-read-model.js";
import { buildWorldSnapshot } from "./world-view-read-model.js";

const geography = createRegionGeography({
  terrain: "plains",
  climate: "temperate",
  area: 10,
  fertility: 0.5,
  waterAccess: true,
  coastal: false,
  elevationClass: "lowland",
});
const OUTPUTS = {
  farming: { flour: 8 },
  baking: { bread: 4 },
  mixed: { flour: 3, bran: 1 },
};

interface CompanySpec {
  readonly region: string;
  readonly method?: string;
  readonly employees: number;
  readonly output: number;
  readonly revenue: number;
  readonly active?: boolean;
}

/**
 * Regiony: `market` (Market + regionalne Inventory), `nomarket` (firmy bez
 * rynku), `empty` (bez firm), `marketonly` (rynek bez firm).
 */
function economyState(companies: readonly CompanySpec[], tick = 5): WorldState {
  const base = createWorld({
    id: "world_econ_rm",
    seed: "econ-rm",
    name: "Economy RM",
    configuration: { regionCount: 4, worldSizePreset: "test" },
  });
  const world = { ...base, currentTick: tick, currentDate: { year: 2, month: 6 } };
  const withMarket = ["market", "marketonly"];
  const market = createMarket({ id: "market_market", regionId: "market" });
  return createWorldState({
    world,
    continents: [{ id: "c", worldId: world.id, name: "C", regionIds: [], tags: [] }],
    regions: ["market", "nomarket", "empty", "marketonly"].map((id) =>
      createRegion({ id, worldId: world.id, continentId: "c", name: id, geography }),
    ),
    populationCohorts: [
      createPopulationCohort({
        id: "owner",
        regionId: "market",
        ageGroup: "AGE_25_44",
        population: 10,
        economicClass: "WORKING",
        skillLevel: "SKILLED",
      }),
    ],
    markets: [
      {
        ...market,
        goods: {
          flour: {
            supply: 0,
            demand: 0,
            inventory: 0,
            localPrice: 1.25,
            importDemand: 0,
            exportSupply: 0,
            shortageSeverity: 0,
            pricePressure: 0,
          },
        },
      },
      createMarket({ id: "market_marketonly", regionId: "marketonly" }),
    ],
    inventories: [
      ...withMarket.map((id) =>
        createInventory({
          id: `inventory_${id}`,
          ownerType: "region",
          ownerId: id,
          locationRegionId: id,
        }),
      ),
      ...companies.map((_, i) =>
        createInventory({
          id: `inv_c${i}`,
          ownerType: "company",
          ownerId: `c${i}`,
          locationRegionId: companies[i]!.region,
        }),
      ),
    ],
    companies: companies.map((spec, i): Company => {
      const company = createCompany({
        id: `c${i}`,
        archetypeId: "dev",
        name: `c${i}`,
        foundedTick: 0,
        regionId: spec.region,
        ownerType: "individual",
        ownerEntityId: "owner",
        inventoryId: `inv_c${i}`,
      });
      return {
        ...company,
        workforce: { ...company.workforce, employees: spec.employees },
        production: {
          ...company.production,
          productionMethodId: spec.method,
          outputLastTick: spec.output,
        },
        finance: { ...company.finance, revenue: spec.revenue },
        status: { ...company.status, active: spec.active ?? true },
      };
    }),
  });
}

describe("region economy read model (M21-VIS-R4B Economy, §52C)", () => {
  it("sums employment of ACTIVE companies only, in people; region without companies = known 0", () => {
    const view = buildRegionEconomyReadModels(
      economyState([
        { region: "market", method: "farming", employees: 2.5, output: 16, revenue: 13.75 },
        { region: "market", method: "baking", employees: 4, output: 8, revenue: 0 },
        { region: "market", method: "farming", employees: 99, output: 0, revenue: 0, active: false },
        { region: "nomarket", method: "farming", employees: 3, output: 24, revenue: 0 },
      ]),
      OUTPUTS,
    );
    expect(view.get("market")!.employment).toBe(6.5);
    expect(view.get("market")!.activeCompanies).toBe(2);
    expect(view.get("nomarket")!.employment).toBe(3);
    expect(view.get("empty")!.employment).toBe(0);
    expect(view.get("empty")!.activeCompanies).toBe(0);
  });

  it("sales: money in regions with Market + regional Inventory; outside the market model = NO_DATA, never 0", () => {
    const view = buildRegionEconomyReadModels(
      economyState([
        { region: "market", method: "farming", employees: 2, output: 16, revenue: 13.75 },
        { region: "nomarket", method: "farming", employees: 3, output: 24, revenue: 0 },
      ]),
      OUTPUTS,
    );
    expect(view.get("market")!.sales).toEqual({ status: "RECORDED", value: 13.75, tick: 4 });
    expect(view.get("marketonly")!.sales).toEqual({ status: "RECORDED", value: 0, tick: 4 });
    expect(view.get("nomarket")!.sales).toEqual({
      status: "NO_DATA",
      reason: "OUTSIDE_MARKET_MODEL",
    });
    expect(view.get("empty")!.sales).toEqual({
      status: "NO_DATA",
      reason: "OUTSIDE_MARKET_MODEL",
    });
  });

  it("sales before the first completed month = NO_COMPLETED_PERIOD", () => {
    const view = buildRegionEconomyReadModels(economyState([], 0), OUTPUTS);
    expect(view.get("market")!.sales).toEqual({
      status: "NO_DATA",
      reason: "NO_COMPLETED_PERIOD",
    });
  });

  it("production is split per good (recipe proportions), never summed across goods", () => {
    const view = buildRegionEconomyReadModels(
      economyState([
        { region: "market", method: "farming", employees: 1, output: 16, revenue: 0 },
        { region: "market", method: "baking", employees: 1, output: 8, revenue: 0 },
        { region: "market", method: "mixed", employees: 1, output: 8, revenue: 0 },
      ]),
      OUTPUTS,
    );
    expect(view.get("market")!.goods).toEqual([
      { goodId: "bran", produced: 2, companies: 1, localPrice: undefined },
      { goodId: "bread", produced: 8, companies: 1, localPrice: undefined },
      { goodId: "flour", produced: 22, companies: 2, localPrice: 1.25 },
    ]);
    expect(view.get("market")).not.toHaveProperty("production");
  });

  it("output of an unknown production method is flagged, not attributed to a guessed good", () => {
    const view = buildRegionEconomyReadModels(
      economyState([
        { region: "nomarket", method: "unknown", employees: 1, output: 5, revenue: 0 },
        { region: "nomarket", employees: 1, output: 0, revenue: 0 },
      ]),
      OUTPUTS,
    );
    expect(view.get("nomarket")!.goods).toEqual([]);
    expect(view.get("nomarket")!.unattributedCompanies).toBe(1);
  });

  it("world snapshot exposes `economy` and no longer the cross-good `production` sum; deterministic", () => {
    const state = economyState([
      { region: "market", method: "farming", employees: 2, output: 16, revenue: 13.75 },
    ]);
    const a = buildWorldSnapshot(state, [], { goodOutputsPerBatchByMethodId: OUTPUTS });
    const b = buildWorldSnapshot(state, [], { goodOutputsPerBatchByMethodId: OUTPUTS });
    const region = a.regions.find((r) => r.regionId === "market")!;
    expect(region.economy.employment).toBe(2);
    expect(region).not.toHaveProperty("production");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
