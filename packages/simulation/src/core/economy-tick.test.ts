import { describe, expect, it } from "vitest";
import {
  createCompany,
  createContinent,
  createInventory,
  createMarket,
  createPopulationCohort,
  createRegion,
  createWorld,
  createWorldState,
  type Company,
  type WorldState,
} from "@first-cause/entities";
import { createWorldRng } from "./rng.js";
import { runEconomyTick } from "./economy-tick.js";
import { roundMoney } from "./rounding.js";

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
