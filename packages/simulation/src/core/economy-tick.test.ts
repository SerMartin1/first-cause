import { describe, expect, it } from "vitest";
import {
  createCompany,
  createContinent,
  createInventory,
  createMarket,
  createPopulationCohort,
  createRegion,
  createResourceDeposit,
  createWorld,
  createWorldState,
  type Company,
  type WorldState,
} from "@first-cause/entities";
import { createWorldRng } from "./rng.js";
import { runEconomyTick, type EntrepreneurshipCandidate } from "./economy-tick.js";
import { roundMoney } from "./rounding.js";
import { initializeMarketGood } from "../systems/economy/markets/price-adjustment.js";
import type { ProductionRecipe } from "../systems/economy/production.js";

/**
 * Minimalny, ręcznie złożony `WorldState` (jeden region, jedna firma,
 * jedna kohorta) do izolowanych testów `runEconomyTick` -- lżejszy niż
 * `worldgen`'s fixture pipeline (`load-world-fixture.ts`), bo nie
 * przechodzi przez JSON/Zod, tylko bezpośrednio przez `@first-cause/
 * entities`'s własne `create*` (ten sam wzorzec co `production.test.ts`'s
 * `buildCompany`).
 */
function buildWorldState(companyOverrides: Partial<Company["workforce"]> = {}): {
  worldState: WorldState;
  companyId: string;
} {
  const world = createWorld({
    id: "world_test",
    seed: "economy-tick-unit-test",
    name: "Test World",
    configuration: { regionCount: 1, worldSizePreset: "prototype-8-12" },
  });
  const continent = createContinent({
    id: "continent_test",
    worldId: world.id,
    name: "Test Continent",
  });
  const region = createRegion({
    id: "region_test",
    worldId: world.id,
    continentId: continent.id,
    name: "Test Region",
    geography: {
      terrain: "plains",
      climate: "temperate",
      area: 100,
      fertility: 0.5,
      waterAccess: true,
      coastal: false,
      elevationClass: "lowland",
    },
  });
  const market = createMarket({ id: "market_test", regionId: region.id });
  const regionInventory = createInventory({
    id: "inventory_region_test",
    ownerType: "region",
    ownerId: region.id,
    locationRegionId: region.id,
  });
  const companyInventory = createInventory({
    id: "inventory_company_test",
    ownerType: "company",
    ownerId: "company_test",
    locationRegionId: region.id,
  });
  const baseCohort = createPopulationCohort({
    id: "cohort_test_workers",
    regionId: region.id,
    ageGroup: "AGE_25_44",
    population: 100,
    economicClass: "WORKING",
    skillLevel: "UNSKILLED",
  });

  const baseCompany = createCompany({
    id: "company_test",
    archetypeId: "test_archetype",
    name: "Test Company",
    foundedTick: 0,
    regionId: region.id,
    ownerType: "individual",
    ownerEntityId: baseCohort.id,
    inventoryId: companyInventory.id,
    initialCash: 1000,
    initialWageOffer: 10,
  });
  const company: Company = {
    ...baseCompany,
    workforce: { ...baseCompany.workforce, ...companyOverrides },
  };
  // `layoffWorkers`/`matchEmployment` require `cohort.employment` and
  // `company.workforce.employees` to already agree (a pre-existing,
  // documented invariant, `labor/employment.ts`) -- seeding only the
  // company side would make the tick loop's layoff loop find nothing to
  // lay off (`Math.min(remaining, cohort.employment, ...)` would be 0).
  const cohort = { ...baseCohort, employment: company.workforce.employees };

  const worldState = createWorldState({
    world,
    continents: [continent],
    regions: [region],
    populationCohorts: [cohort],
    companies: [company],
    markets: [market],
    inventories: [regionInventory, companyInventory],
  });

  return { worldState, companyId: company.id };
}

describe("runEconomyTick -- labor cost settlement (audit regression P1, layoff nie rozlicza poprawnie pozostałej płacy)", () => {
  it("pays wages for the headcount that existed before this tick's layoff, not the reduced post-layoff count", () => {
    // capacity/utilization stay at 0 (createCompany's defaults, no
    // production method set), so targetEmployment this tick is 0 --
    // decideLabor lays off the entire existing workforce in one tick, a
    // deterministic, distress-free LAYOFF (gap = 0 - 20 = -20).
    const { worldState } = buildWorldState({ employees: 20, wageOffer: 10 });
    const rng = createWorldRng(worldState.world.seed);

    const result = runEconomyTick({
      worldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
    });

    const company = result.worldState.companies.company_test!;
    expect(company.workforce.employees).toBe(0); // the layoff did execute
    // wageOffer itself may have drifted a little this tick (labor-market
    // feedback, `labor/wages.ts`) -- read the actual post-tick value
    // rather than assuming it stayed exactly 10, and multiply by the
    // PRE-layoff headcount (20). Before the fix this was `wageOffer * 0`
    // (post-layoff employees): the 20 workers let go this tick got paid
    // nothing for it.
    expect(company.finance.costs).toBe(roundMoney(company.workforce.wageOffer * 20));
    expect(company.finance.costs).toBeGreaterThan(0);
  });

  it("still pays only the post-hire headcount on a HIRE tick (unaffected by the fix)", () => {
    const { worldState } = buildWorldState({ employees: 0, wageOffer: 10 });
    // Bump capacity/utilization so targetEmployment > 0, triggering HIRE
    // against the region's ample labor supply.
    const withCapacity: WorldState = {
      ...worldState,
      companies: {
        ...worldState.companies,
        company_test: {
          ...worldState.companies.company_test!,
          production: {
            ...worldState.companies.company_test!.production,
            capacity: 5,
            utilization: 1,
          },
        },
      },
    };
    const rng = createWorldRng(worldState.world.seed);

    const result = runEconomyTick({
      worldState: withCapacity,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
    });

    const company = result.worldState.companies.company_test!;
    expect(company.workforce.employees).toBeGreaterThan(0);
    expect(company.finance.costs).toBe(
      roundMoney(company.workforce.wageOffer * company.workforce.employees),
    );
  });
});

const GRAIN_FARM_RECIPE: ProductionRecipe = {
  productionMethodId: "manual_farming",
  employeesPerBatch: 1,
  resourceInputsPerBatch: { grain: 10 },
  goodInputsPerBatch: {},
  goodOutputsPerBatch: { flour: 8 },
  eligibleCompanyArchetypeIds: ["grain_farm"],
};

/**
 * A region with an existing, tiny grain_farm (capacity 1 -- 8 flour/tick
 * at most) serving a much bigger, already-employed cohort -- real,
 * already-wired household demand (`applyHouseholdConsumption`, M9)
 * massively outstrips that one company's supply, giving the Opportunity
 * Scanner (M12) a genuine, sustained market-gap to found a *second*
 * grain_farm against. `employment`/`averageIncome` are pre-set directly
 * on the cohort rather than reached via `matchEmployment` -- standing in
 * for "this cohort already has an established job/wage history", the
 * same kind of already-settled starting condition a fixture's
 * `initialWageOffer` represents.
 */
function buildEntrepreneurshipWorldState(): { worldState: WorldState } {
  const world = createWorld({
    id: "world_entrepreneurship_test",
    seed: "opportunity-scanner-unit-test",
    name: "Test World",
    configuration: { regionCount: 1, worldSizePreset: "prototype-8-12" },
  });
  const continent = createContinent({
    id: "continent_test",
    worldId: world.id,
    name: "Test Continent",
  });
  const region = createRegion({
    id: "region_test",
    worldId: world.id,
    continentId: continent.id,
    name: "Test Region",
    geography: {
      terrain: "plains",
      climate: "temperate",
      area: 100,
      fertility: 0.5,
      waterAccess: true,
      coastal: false,
      elevationClass: "lowland",
    },
  });
  const market = createMarket({ id: "market_test", regionId: region.id });
  const marketWithGoods = {
    ...market,
    goods: { grain: initializeMarketGood(2), flour: initializeMarketGood(5) },
  };
  const regionInventory = createInventory({
    id: "inventory_region_test",
    ownerType: "region",
    ownerId: region.id,
    locationRegionId: region.id,
  });
  const existingCompanyInventory = createInventory({
    id: "inventory_existing_farm",
    ownerType: "company",
    ownerId: "company_existing_farm",
    locationRegionId: region.id,
  });
  const grainDeposit = createResourceDeposit({
    id: "deposit_test_grain",
    resourceDefinitionId: "grain",
    regionId: region.id,
    initialQuantity: 50_000,
    renewable: true,
    renewableState: {
      regenerationRate: 0.05,
      sustainableYield: 1000,
      carryingCapacity: 50_000,
    },
  });
  const cohort: ReturnType<typeof createPopulationCohort> = {
    ...createPopulationCohort({
      id: "cohort_test_workers",
      regionId: region.id,
      ageGroup: "AGE_25_44",
      population: 200,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
    employment: 1,
    averageIncome: 5000, // large enough that the household consumption budget (employment * averageIncome) covers the full survival-good cost every tick
  };
  const baseExistingCompany = createCompany({
    id: "company_existing_farm",
    archetypeId: "grain_farm",
    name: "Existing Grain Farm",
    foundedTick: 0,
    regionId: region.id,
    ownerType: "individual",
    ownerEntityId: cohort.id,
    inventoryId: existingCompanyInventory.id,
    initialCash: 1000,
    initialWageOffer: 10,
  });
  const existingCompany: Company = {
    ...baseExistingCompany,
    production: {
      ...baseExistingCompany.production,
      productionMethodId: "manual_farming",
      capacity: 1,
      utilization: 1,
    },
    workforce: { ...baseExistingCompany.workforce, employees: 1 },
  };

  const worldState = createWorldState({
    world,
    continents: [continent],
    regions: [region],
    populationCohorts: [cohort],
    companies: [existingCompany],
    markets: [marketWithGoods],
    inventories: [regionInventory, existingCompanyInventory],
    resourceDeposits: [grainDeposit],
  });

  return { worldState };
}

describe("runEconomyTick -- Entrepreneurship (M12, AI-07 Opportunity Scanner wired end-to-end)", () => {
  it("founds a real, correctly-wired company once an unmet-demand opportunity persists across enough ticks", () => {
    const { worldState } = buildEntrepreneurshipWorldState();
    const rng = createWorldRng(worldState.world.seed);
    const candidates: Readonly<Record<string, EntrepreneurshipCandidate>> = {
      grain_farm: {
        archetypeId: "grain_farm",
        productionMethodId: "manual_farming",
        capitalRequirement: 0,
      },
    };

    let state = worldState;
    let foundedCompanyId: string | undefined;
    for (let tick = 0; tick < 12; tick++) {
      const result = runEconomyTick({
        worldState: state,
        tick,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        productionRecipesByMethodId: { manual_farming: GRAIN_FARM_RECIPE },
        entrepreneurshipCandidatesByArchetypeId: candidates,
      });
      state = result.worldState;

      const newCompanyId = Object.keys(state.companies).find(
        (id) => !(id in worldState.companies),
      );
      if (newCompanyId) {
        foundedCompanyId = newCompanyId;
        expect(result.facts.some((f) => f.type === "company_founded")).toBe(true);
        break;
      }
    }

    expect(foundedCompanyId).toBeDefined();
    const founded = state.companies[foundedCompanyId!]!;
    expect(founded.archetypeId).toBe("grain_farm");
    expect(founded.production.productionMethodId).toBe("manual_farming");
    expect(founded.regionId).toBe("region_test");
    expect(state.inventories[founded.inventoryId]).toBeDefined();
    // Back-reference reconstruction (DATA-003/DATA-004, createWorldState):
    // the new company shows up in its region's companyIds without any
    // manual bookkeeping in the entrepreneurship step itself.
    expect(state.regions.region_test!.economy.companyIds).toContain(foundedCompanyId);
  });

  it("never founds a company when no entrepreneurshipCandidatesByArchetypeId is supplied (full backward compatibility)", () => {
    const { worldState } = buildEntrepreneurshipWorldState();
    const rng = createWorldRng(worldState.world.seed);

    let state = worldState;
    for (let tick = 0; tick < 12; tick++) {
      const result = runEconomyTick({
        worldState: state,
        tick,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        productionRecipesByMethodId: { manual_farming: GRAIN_FARM_RECIPE },
        // entrepreneurshipCandidatesByArchetypeId intentionally omitted
      });
      state = result.worldState;
    }

    // The one pre-existing company survives, but no second one ever appears.
    expect(Object.keys(state.companies)).toEqual(["company_existing_farm"]);
  });

  it("Determinism Test: founding the same opportunity twice from the same starting state produces byte-identical results", () => {
    const candidates: Readonly<Record<string, EntrepreneurshipCandidate>> = {
      grain_farm: {
        archetypeId: "grain_farm",
        productionMethodId: "manual_farming",
        capitalRequirement: 0,
      },
    };

    function runTwelveTicks(): WorldState {
      const { worldState } = buildEntrepreneurshipWorldState();
      const rng = createWorldRng(worldState.world.seed);
      let state = worldState;
      for (let tick = 0; tick < 12; tick++) {
        state = runEconomyTick({
          worldState: state,
          tick,
          demographyRng: (scopeId) => rng.stream("demography", scopeId),
          productionRecipesByMethodId: { manual_farming: GRAIN_FARM_RECIPE },
          entrepreneurshipCandidatesByArchetypeId: candidates,
        }).worldState;
      }
      return state;
    }

    expect(runTwelveTicks()).toEqual(runTwelveTicks());
  });
});
