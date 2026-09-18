import { describe, expect, it } from "vitest";
import {
  createCompany,
  createConnection,
  createContinent,
  createInventory,
  createMarket,
  createPopulationCohort,
  createRegion,
  createResourceDeposit,
  createSettlement,
  createWorld,
  createWorldState,
  type Company,
  type Connection,
  type Settlement,
  type WorldState,
} from "@first-cause/entities";
import { createWorldRng } from "./rng.js";
import { runEconomyTick, type EntrepreneurshipCandidate } from "./economy-tick.js";
import { roundMoney } from "./rounding.js";
import { initializeMarketGood } from "../systems/economy/markets/price-adjustment.js";
import { eligibleLaborForce } from "../systems/economy/labor/employment.js";
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
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
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
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
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
function buildEntrepreneurshipWorldState(
  settlementOverrides: { readonly withSettlement?: boolean } = {},
): { worldState: WorldState } {
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

  const settlement = settlementOverrides.withSettlement
    ? createSettlement({
        id: "settlement_test",
        regionId: region.id,
        name: "Test Settlement",
        foundedTick: 0,
      })
    : undefined;

  const worldState = createWorldState({
    world,
    continents: [continent],
    regions: [region],
    populationCohorts: [cohort],
    companies: [existingCompany],
    markets: [marketWithGoods],
    inventories: [regionInventory, existingCompanyInventory],
    resourceDeposits: [grainDeposit],
    settlements: settlement ? [settlement] : [],
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
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
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

  it("assigns a settlementId to a newly founded company when the region has a settlement, and its employees feed Settlement.economy.employment (audit P1-07)", () => {
    const { worldState } = buildEntrepreneurshipWorldState({ withSettlement: true });
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
    // Wystarczająco dużo ticków, żeby firma zdążyła powstać I zatrudnić
    // (hiring to osobna decyzja, następny tick po foundingu).
    for (let tick = 0; tick < 30; tick++) {
      const result = runEconomyTick({
        worldState: state,
        tick,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
        productionRecipesByMethodId: { manual_farming: GRAIN_FARM_RECIPE },
        entrepreneurshipCandidatesByArchetypeId: candidates,
      });
      state = result.worldState;

      if (!foundedCompanyId) {
        foundedCompanyId = Object.keys(state.companies).find(
          (id) => !(id in worldState.companies),
        );
      }
      if (
        foundedCompanyId &&
        state.companies[foundedCompanyId]!.workforce.employees > 0
      ) {
        break;
      }
    }

    expect(foundedCompanyId).toBeDefined();
    const founded = state.companies[foundedCompanyId!]!;
    expect(founded.settlementId).toBe("settlement_test"); // M14 czyta jobs po tym polu (RM M12-M14 audyt P1-07)
    expect(founded.workforce.employees).toBeGreaterThan(0); // faktycznie zatrudniła kogoś
    expect(state.settlements.settlement_test!.economy.employment).toBe(
      founded.workforce.employees,
    );
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
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
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
          migrationRng: (scopeId) => rng.stream("migration", scopeId),
          productionRecipesByMethodId: { manual_farming: GRAIN_FARM_RECIPE },
          entrepreneurshipCandidatesByArchetypeId: candidates,
        }).worldState;
      }
      return state;
    }

    expect(runTwelveTicks()).toEqual(runTwelveTicks());
  });
});

/**
 * A settlement whose pressure inputs (population/trade/infrastructure)
 * are deliberately over-provisioned and stable -- `region_other` has no
 * Market, so the trade loop's `if (!marketAId || !marketBId ...) continue`
 * (economy-tick.ts) never touches `connection`, letting the preset
 * `infrastructure.level`/`currentState.utilization` stand in for real
 * trade/investment without needing a Company/Market at all (avoids
 * routing this M14 test through M11's labor/financial-health machinery,
 * which is not what this test is about).
 */
function buildSettlementGrowthWorldState(): { worldState: WorldState } {
  const world = createWorld({
    id: "world_settlement_test",
    seed: "settlement-growth-test",
    name: "Test World",
    configuration: { regionCount: 2, worldSizePreset: "prototype-8-12" },
  });
  const continent = createContinent({
    id: "continent_test",
    worldId: world.id,
    name: "Test Continent",
  });
  const geography = {
    terrain: "plains" as const,
    climate: "temperate" as const,
    area: 100,
    fertility: 0.5,
    waterAccess: true,
    coastal: false,
    elevationClass: "lowland" as const,
  };
  const region = createRegion({
    id: "region_test",
    worldId: world.id,
    continentId: continent.id,
    name: "Test Region",
    geography,
  });
  const regionOther = createRegion({
    id: "region_other",
    worldId: world.id,
    continentId: continent.id,
    name: "Other Region",
    geography,
  });

  const settlementBase = createSettlement({
    id: "settlement_test",
    regionId: region.id,
    name: "Test Settlement",
    foundedTick: 0,
  });
  const settlement: Settlement = {
    ...settlementBase,
    housing: { capacity: 1000, cost: 1, pressure: 0 },
  };

  const cohort = createPopulationCohort({
    id: "cohort_settlement_test",
    regionId: region.id,
    settlementId: settlement.id,
    ageGroup: "AGE_25_44",
    population: 1000,
    economicClass: "WORKING",
    skillLevel: "UNSKILLED",
  });

  const connectionBase = createConnection({
    id: "connection_test",
    regionAId: region.id,
    regionBId: regionOther.id,
    geography: { physicalDistance: 10, terrainDifficulty: 0, seasonalModifier: 1 },
    infrastructure: { level: 5, transportModes: [], capacity: 0 },
  });
  const connection: Connection = {
    ...connectionBase,
    currentState: { utilization: 1, congestion: 0, disrupted: false },
  };

  const worldState = createWorldState({
    world,
    continents: [continent],
    regions: [region, regionOther],
    connections: [connection],
    settlements: [settlement],
    populationCohorts: [cohort],
  });

  return { worldState };
}

describe("runEconomyTick -- Settlement Growth (M14, society/settlements wired end-to-end)", () => {
  it("advances a settlement's stage after sustained pressure, driven entirely by the tick loop (SET-001/SET-002)", () => {
    const { worldState } = buildSettlementGrowthWorldState();
    const rng = createWorldRng(worldState.world.seed);

    let state = worldState;
    let changedAtTick = -1;
    for (let tick = 0; tick < 20; tick++) {
      const result = runEconomyTick({
        worldState: state,
        tick,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
      });
      state = result.worldState;
      if (state.settlements.settlement_test!.stage !== "CAMP") {
        changedAtTick = tick;
        break;
      }
    }

    expect(changedAtTick).toBeGreaterThanOrEqual(0);
    expect(state.settlements.settlement_test!.stage).toBe("HAMLET");
    expect(
      state.settlements.settlement_test!.condition.urbanizationPressure,
    ).toBeGreaterThan(0);
    expect(state.settlements.settlement_test!.housing.capacity).toBeGreaterThan(0);
  });

  it("keeps housing capacity growing to track population even without any stage change (SET-003, M13 housing-constraint integration)", () => {
    const { worldState } = buildSettlementGrowthWorldState();
    const rng = createWorldRng(worldState.world.seed);

    const result = runEconomyTick({
      worldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
    });

    const settlement = result.worldState.settlements.settlement_test!;
    // M13's `population/migration.ts::selectDestinationSettlement` reads
    // exactly this field as a hard cap -- proving it is a real, live
    // number here (not the M3-era permanent 0) is what "integracja z M13"
    // in the roadmap's M14 Testy section asks for.
    expect(settlement.housing.capacity).toBeGreaterThan(0);
  });

  it("Determinism Test: the same starting state and seed produce byte-identical settlement growth", () => {
    function runTenTicks(): WorldState {
      const { worldState } = buildSettlementGrowthWorldState();
      const rng = createWorldRng(worldState.world.seed);
      let state = worldState;
      for (let tick = 0; tick < 10; tick++) {
        state = runEconomyTick({
          worldState: state,
          tick,
          demographyRng: (scopeId) => rng.stream("demography", scopeId),
          migrationRng: (scopeId) => rng.stream("migration", scopeId),
        }).worldState;
      }
      return state;
    }

    expect(runTenTicks()).toEqual(runTenTicks());
  });
});

describe("runEconomyTick -- company headcount reconciliation (audit P0-05, migration_demography_reconcile_company_and_cohort_labor)", () => {
  it("sheds phantom company employees that exceed the region's eligibleLaborForce within a single tick, even when the normal labor decision is on cooldown", () => {
    // employment=90 na populacji=100 (AGE_25_44) to więcej niż
    // eligibleLaborForce (100*0.65=65) -- audytowa reprodukcja fantomowych
    // pracowników, tym razem zasiana bezpośrednio jako stan startowy
    // (mogłaby równie dobrze powstać z migracji/demografii tego ticka --
    // krok 10.5 nie rozróżnia przyczyny). `ai.lastDecision.labor_headcount`
    // ustawione na tick 0 wymusza cooldown w decideLabor (krok 2), żeby to
    // był NAPRAWDĘ krok 10.5, a nie zwykła decyzja LAYOFF, który usuwa
    // nadwyżkę.
    const { worldState } = buildWorldState({ employees: 90, wageOffer: 10 });
    const companyWithCooldown: Company = {
      ...worldState.companies.company_test!,
      ai: {
        ...worldState.companies.company_test!.ai,
        lastDecision: {
          ...worldState.companies.company_test!.ai.lastDecision,
          labor_headcount: 0,
        },
      },
    };
    const seededWorldState: WorldState = {
      ...worldState,
      companies: { ...worldState.companies, company_test: companyWithCooldown },
      populationCohorts: {
        ...worldState.populationCohorts,
        cohort_test_workers: {
          ...worldState.populationCohorts.cohort_test_workers!,
          employment: 90,
        },
      },
    };

    const rng = createWorldRng(seededWorldState.world.seed);
    const result = runEconomyTick({
      worldState: seededWorldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
    });

    const company = result.worldState.companies.company_test!;
    // Demografia (krok 10, PRZED uzgodnieniem 10.5) mogła w tym samym ticku
    // dołożyć urodzenia/starzenie do innych grup wieku tej samej rodziny
    // (worldState startuje tylko z jedną jawną kohortą -- `applyMonthlyDemography`
    // dopełnia resztę rodziny syntetycznymi kohortami o populacji 0) --
    // region's prawdziwy eligibleLaborForce to suma po WSZYSTKICH kohortach
    // regionu, nie tylko po oryginalnej `cohort_test_workers`.
    const regionEligibleLaborForce = Object.values(result.worldState.populationCohorts)
      .filter((c) => c.regionId === "region_test")
      .reduce((sum, c) => sum + eligibleLaborForce(c), 0);

    expect(company.workforce.employees).toBeLessThan(90); // faktycznie zredukowane
    expect(company.workforce.employees).toBeLessThanOrEqual(
      regionEligibleLaborForce + 1e-9,
    );
  });
});
