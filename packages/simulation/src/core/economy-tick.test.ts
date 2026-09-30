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
  createTechnologyState,
  createWorld,
  createWorldState,
  setDiscoveryState,
  type Company,
  type Connection,
  type Settlement,
  type WorldState,
} from "@first-cause/entities";
import { createWorldRng } from "./rng.js";
import { runEconomyTick, type EntrepreneurshipCandidate } from "./economy-tick.js";
import { roundMoney } from "./rounding.js";
import { createWorldRunner } from "./world-runner.js";
import { buildWorldSnapshot } from "../read-models/world-view-read-model.js";
import { discoverDeposit } from "../systems/resources/deposit-lifecycle.js";
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
  const baseGrainDeposit = createResourceDeposit({
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
  // Audytowe P1-01: founding wymaga teraz DISCOVERED/ASSESSED (World Gen
  // Spec §16 -- discovery nie może być pomijane przez founding). Grain to
  // widoczny, powierzchniowy zasób rolny (w przeciwieństwie do Black
  // Mountain's celowo hidden Iron Ore) -- region już go zna od startu.
  const grainDeposit = {
    ...baseGrainDeposit,
    discovery: { ...baseGrainDeposit.discovery, status: "DISCOVERED" as const },
  };
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

  // SET-LIFECYCLE-001: osada bez mieszkańców zostaje porzucona w pierwszym
  // ticku, więc „region z osadą” oznacza tu osadę, w której ta kohorta żyje.
  const residentCohort = settlement ? { ...cohort, settlementId: settlement.id } : cohort;

  const worldState = createWorldState({
    world,
    continents: [continent],
    regions: [region],
    populationCohorts: [residentCohort],
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
        const foundedFact = result.facts.find((f) => f.type === "company_founded");
        expect(foundedFact).toBeDefined();
        // Audytowe P1-02: fakt musi nieść rzeczywisty DecisionSnapshot
        // (options/selectedAction/causalContext.factors), nie tylko
        // istnienie 0->1 -- inaczej M17 nie odzyska przyczyn foundingu.
        const snapshot = foundedFact!.values.after as
          | { selectedAction?: string; causalContext?: { factors?: unknown[] } }
          | undefined;
        expect(snapshot?.selectedAction).toBe("FOUND");
        expect(snapshot?.causalContext?.factors?.length).toBeGreaterThan(0);
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

  it("does not found a resource-dependent company while the deposit is still undiscovered (audit P1-01, discovery cannot be bypassed by founding)", () => {
    const { worldState } = buildEntrepreneurshipWorldState();
    const undiscoveredDeposit = {
      ...worldState.resourceDeposits.deposit_test_grain!,
      discovery: {
        ...worldState.resourceDeposits.deposit_test_grain!.discovery,
        status: "UNKNOWN" as const,
      },
    };
    const worldStateWithHiddenDeposit: WorldState = {
      ...worldState,
      resourceDeposits: {
        ...worldState.resourceDeposits,
        deposit_test_grain: undiscoveredDeposit,
      },
    };
    const rng = createWorldRng(worldStateWithHiddenDeposit.world.seed);
    const candidates: Readonly<Record<string, EntrepreneurshipCandidate>> = {
      grain_farm: {
        archetypeId: "grain_farm",
        productionMethodId: "manual_farming",
        capitalRequirement: 0,
      },
    };

    let state = worldStateWithHiddenDeposit;
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
    }

    // Fizyczny stock istnieje (50 000), ale nikt w symulacji o nim nie
    // wie -- founding nie może omijać tej granicy (World Gen Spec §16).
    expect(Object.keys(state.companies)).toEqual(["company_existing_farm"]);
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

/**
 * region_source: jedna duża kohorta (10 000, AGE_25_44), zero firm/
 * settlementów -- migrationAttraction = 0 (brak jobs/wage, brak
 * housing cost). region_dest: jedna firma z realną capacity/utilization
 * (target employment > 0 -> HIRE tej samej tury, `workforce.vacancies`
 * naprawdę dodatnie po kroku 4), zero kohort/settlementów -- eligibleLaborForce
 * regionu = 0, więc jobsScore = 1 (pełen wynik: są wakaty, nikt lokalnie
 * ich nie zapełnia). Silny, przewidywalny push/pull bez potrzeby
 * kontrolowania dokładnych liczb rynku pracy.
 */
function buildPhaseOrderWorldState(): { worldState: WorldState } {
  const world = createWorld({
    id: "world_phase_order_test",
    seed: "phase-order-test",
    name: "Phase Order Test World",
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
  const regionSource = createRegion({
    id: "region_source",
    worldId: world.id,
    continentId: continent.id,
    name: "Source",
    geography,
  });
  const regionDest = createRegion({
    id: "region_dest",
    worldId: world.id,
    continentId: continent.id,
    name: "Dest",
    geography,
  });
  const connection = createConnection({
    id: "connection_source_dest",
    regionAId: regionSource.id,
    regionBId: regionDest.id,
    geography: { physicalDistance: 0, terrainDifficulty: 0, seasonalModifier: 1 },
  });

  const cohort = createPopulationCohort({
    id: "cohort_source_workers",
    regionId: regionSource.id,
    ageGroup: "AGE_25_44",
    population: 10_000,
    economicClass: "WORKING",
    skillLevel: "UNSKILLED",
  });

  const destCompanyInventory = createInventory({
    id: "inventory_dest_company",
    ownerType: "company",
    ownerId: "company_dest",
    locationRegionId: regionDest.id,
  });
  const baseDestCompany = createCompany({
    id: "company_dest",
    archetypeId: "test_archetype",
    name: "Dest Company",
    foundedTick: 0,
    regionId: regionDest.id,
    ownerType: "individual",
    ownerEntityId: cohort.id,
    inventoryId: destCompanyInventory.id,
    initialCash: 10_000,
    initialWageOffer: 10,
  });
  const destCompany: Company = {
    ...baseDestCompany,
    production: { ...baseDestCompany.production, capacity: 100, utilization: 1 },
  };

  const worldState = createWorldState({
    world,
    continents: [continent],
    regions: [regionSource, regionDest],
    connections: [connection],
    populationCohorts: [cohort],
    companies: [destCompany],
    inventories: [destCompanyInventory],
  });

  return { worldState };
}

describe("runEconomyTick -- canonical phase order (audit P0-06/P1-04)", () => {
  it("canonical_phase_order_and_world_clock: demography runs before migration within the same tick, and World.currentTick/currentDate actually advance", () => {
    const { worldState } = buildPhaseOrderWorldState();
    const rng = createWorldRng(worldState.world.seed);

    const result = runEconomyTick({
      worldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
    });

    // P1-04: WorldRunner's own tick counter szedł do przodu, ale World
    // samo zostawało zamrożone na starcie -- teraz musi realnie iść razem.
    expect(result.worldState.world.currentTick).toBe(1);
    expect(result.worldState.world.currentDate).toEqual({ year: 1, month: 2 });

    // P0-06: 10 000-osobowa kohorta z domyślnym rocznym death rate
    // (0.008) ma floor(oczekiwanych zgonów) >= 1 niezależnie od losowego
    // zaokrąglenia -- demografia MUSI wyemitować population_declined.
    const demographyFactIndex = result.facts.findIndex(
      (f) => f.type === "population_declined",
    );
    expect(demographyFactIndex).toBeGreaterThanOrEqual(0);

    // Silny push/pull (patrz buildPhaseOrderWorldState's doc comment) ->
    // migracja MUSI wyemitować odpływ z region_source.
    const migrationFactIndex = result.facts.findIndex(
      (f) => f.type === "population_migrated_out",
    );
    expect(migrationFactIndex).toBeGreaterThanOrEqual(0);

    // Rdzeń P0-06: demografia (krok 2, na starcie ticka) MUSI wykonać się
    // PRZED migracją (krok 11, po pętli regionów i handlu) -- stary
    // porządek miał to odwrotnie (migracja/produkcja na populacji sprzed
    // demografii danego miesiąca).
    expect(demographyFactIndex).toBeLessThan(migrationFactIndex);
  });

  it("resource regeneration runs before production within the same tick: a near-empty renewable deposit that regenerates past the batch threshold this tick actually gets used", () => {
    const world = createWorld({
      id: "world_regen_order_test",
      seed: "regen-order-test",
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
    const companyInventory = createInventory({
      id: "inventory_company_test",
      ownerType: "company",
      ownerId: "company_test",
      locationRegionId: region.id,
    });
    // Za mało na jeden batch (potrzeba 10) -- logistyczny wzrost
    // (rate=1, capacity=1000) z quantity=9 daje +8.91, czyli 17.91 po
    // regeneracji -- wystarczy na 1 batch TYLKO jeśli regeneracja
    // wykonała się PRZED produkcją tego ticka (audytowe P0-06).
    // TECH-010: złoże znane światu -- tylko takie produkcja może użyć.
    const deposit = discoverDeposit(
      createResourceDeposit({
        id: "deposit_test",
        resourceDefinitionId: "test_resource",
        regionId: region.id,
        initialQuantity: 9,
        renewable: true,
        renewableState: {
          regenerationRate: 1,
          sustainableYield: 100,
          carryingCapacity: 1000,
        },
      }),
      { tick: 0, targetStatus: "DISCOVERED", confidence: 1 },
    ).deposit;
    const ownerCohort = createPopulationCohort({
      id: "cohort_owner",
      regionId: region.id,
      ageGroup: "AGE_25_44",
      population: 10,
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
      ownerEntityId: ownerCohort.id,
      inventoryId: companyInventory.id,
      initialCash: 10_000,
      initialWageOffer: 10,
    });
    const company: Company = {
      ...baseCompany,
      production: {
        ...baseCompany.production,
        productionMethodId: "test_method",
        capacity: 1,
        utilization: 1,
      },
      workforce: { ...baseCompany.workforce, employees: 1 },
    };
    const recipe: ProductionRecipe = {
      productionMethodId: "test_method",
      employeesPerBatch: 1,
      resourceInputsPerBatch: { test_resource: 10 },
      goodInputsPerBatch: {},
      goodOutputsPerBatch: { test_output: 1 },
      eligibleCompanyArchetypeIds: ["test_archetype"],
    };

    const worldState = createWorldState({
      world,
      continents: [continent],
      regions: [region],
      companies: [company],
      inventories: [companyInventory],
      resourceDeposits: [deposit],
      populationCohorts: [ownerCohort],
    });
    const rng = createWorldRng(worldState.world.seed);

    const result = runEconomyTick({
      worldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
      productionRecipesByMethodId: { test_method: recipe },
    });

    const outputQuantity =
      result.worldState.inventories.inventory_company_test?.items.test_output?.quantity ??
      0;
    expect(outputQuantity).toBeGreaterThan(0); // batch faktycznie wyprodukowany
    expect(result.worldState.resourceDeposits.deposit_test!.stock.quantity).toBeLessThan(
      17.91, // regenerowane + wydobyte tego samego ticka -- mniej niż samo regenerowane 17.91
    );
  });
});

describe("runEconomyTick -- M15 Technology wiring (technology/knowledge|discoveries|diffusion|adoption)", () => {
  function buildWorldStateWithTechnology(): {
    worldState: WorldState;
    technologyStateId: string;
  } {
    const world = createWorld({
      id: "world_tech_test",
      seed: "economy-tick-technology-unit-test",
      name: "Test World",
      configuration: { regionCount: 1, worldSizePreset: "prototype-8-12" },
    });
    const continent = createContinent({
      id: "continent_tech_test",
      worldId: world.id,
      name: "Test Continent",
    });
    const technologyState = createTechnologyState({
      id: "technology_tech_test",
      regionId: "region_tech_test",
    });
    const baseRegion = createRegion({
      id: "region_tech_test",
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
    const region = {
      ...baseRegion,
      knowledge: { technologyStateId: technologyState.id },
    };
    const cohort = createPopulationCohort({
      id: "cohort_tech_test",
      regionId: region.id,
      ageGroup: "AGE_25_44",
      population: 5000,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    });

    const worldState = createWorldState({
      world,
      continents: [continent],
      regions: [region],
      populationCohorts: [cohort],
      technologyStates: [technologyState],
    });

    return { worldState, technologyStateId: technologyState.id };
  }

  it("leaves technologyStates untouched when discoveryRng is not provided (backward compatible with every pre-M15 caller)", () => {
    const { worldState, technologyStateId } = buildWorldStateWithTechnology();
    const rng = createWorldRng(worldState.world.seed);

    const result = runEconomyTick({
      worldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
    });

    expect(result.worldState.technologyStates[technologyStateId]).toEqual(
      worldState.technologyStates[technologyStateId],
    );
  });

  it("accumulates knowledge and, given enough ticks, discovers an eligible technology (discovery eligibility test, full tick-loop integration)", () => {
    const { worldState, technologyStateId } = buildWorldStateWithTechnology();
    const rng = createWorldRng(worldState.world.seed);
    const discoveryEligibilityRulesById = {
      d1: { primaryDomainId: "agriculture_food", tier: 0, prerequisites: [] },
    };

    let currentWorldState = worldState;
    let becameKnown = false;
    for (let tick = 0; tick < 500 && !becameKnown; tick++) {
      const result = runEconomyTick({
        worldState: currentWorldState,
        tick,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
        discoveryRng: (scopeId) => rng.stream("discovery", scopeId),
        discoveryEligibilityRulesById,
        knowledgeDomainIds: ["agriculture_food"],
      });
      currentWorldState = result.worldState;
      becameKnown =
        currentWorldState.technologyStates[technologyStateId]?.discoveries.d1?.status ===
        "KNOWN";
    }

    expect(becameKnown).toBe(true);
    expect(
      currentWorldState.technologyStates[technologyStateId]?.knowledge.agriculture_food,
    ).toBeGreaterThan(0);
  });

  it("gates a discovery-linked production method candidate out of AI-08 until the discovery is AVAILABLE in that region", () => {
    const { worldState: baseWorldState, technologyStateId } = buildWorldStateWithTechnology();
    // Ten sam kształt firmy/receptury co fixtures "audit regression P1"
    // wyżej, zminimalizowany na potrzeby tego testu: jedna firma, obecna
    // vs. ściśle lepsza receptura kandydacka zagate'owana za
    // "gated_discovery".
    const companyInventory = createInventory({
      id: "inventory_company_tech_test",
      ownerType: "company",
      ownerId: "company_tech_test",
      locationRegionId: "region_tech_test",
    });
    const company = createCompany({
      id: "company_tech_test",
      archetypeId: "test_archetype",
      name: "Test Company",
      foundedTick: 0,
      regionId: "region_tech_test",
      ownerType: "individual",
      ownerEntityId: "cohort_tech_test",
      inventoryId: companyInventory.id,
      initialCash: 1000,
    });
    const companyWithMethod: Company = {
      ...company,
      production: { ...company.production, productionMethodId: "current_method" },
    };
    // Porównanie marż w AI-08 wymaga prawdziwego, wycenionego Marketu --
    // bez niego `prices` domyślnie to `{}` i marża każdej receptury
    // wynosi 0 niezależnie od `goodOutputsPerBatch`, więc nic nigdy nie
    // wyglądałoby "advantageous" (ten sam powód, dla którego każdy inny
    // fixture AI-08 w tym pliku go ustawia).
    const market = createMarket({ id: "market_tech_test", regionId: "region_tech_test" });
    const marketWithPrice = {
      ...market,
      goods: { output: initializeMarketGood(1) },
    };
    const regionWithMarket = {
      ...baseWorldState.regions.region_tech_test!,
      economy: { ...baseWorldState.regions.region_tech_test!.economy, marketId: market.id },
    };

    const worldState = createWorldState({
      world: baseWorldState.world,
      continents: Object.values(baseWorldState.continents),
      regions: [regionWithMarket],
      populationCohorts: Object.values(baseWorldState.populationCohorts),
      technologyStates: Object.values(baseWorldState.technologyStates),
      companies: [companyWithMethod],
      inventories: [companyInventory],
      markets: [marketWithPrice],
    });
    const rng = createWorldRng(worldState.world.seed);

    const currentRecipe: ProductionRecipe = {
      productionMethodId: "current_method",
      employeesPerBatch: 1,
      resourceInputsPerBatch: {},
      goodInputsPerBatch: {},
      goodOutputsPerBatch: { output: 1 },
      eligibleCompanyArchetypeIds: [],
    };
    const gatedCandidateRecipe: ProductionRecipe = {
      productionMethodId: "gated_method",
      employeesPerBatch: 1,
      resourceInputsPerBatch: {},
      goodInputsPerBatch: {},
      goodOutputsPerBatch: { output: 100 }, // ogromna przewaga marży -- przyjęta natychmiast, gdyby nie gate
      eligibleCompanyArchetypeIds: [],
    };
    const tickInputBase = {
      worldState,
      demographyRng: (scopeId: string) => rng.stream("demography", scopeId),
      migrationRng: (scopeId: string) => rng.stream("migration", scopeId),
      pmCandidatesByCurrentMethodId: { current_method: "gated_method" },
      productionRecipesByMethodId: {
        current_method: currentRecipe,
        gated_method: gatedCandidateRecipe,
      },
      requiredDiscoveryIdsByMethodId: { gated_method: ["gated_discovery"] },
    };

    let ungatedState = worldState;
    for (let tick = 0; tick < 5; tick++) {
      ungatedState = runEconomyTick({ ...tickInputBase, worldState: ungatedState, tick })
        .worldState;
    }
    expect(ungatedState.companies.company_tech_test?.production.productionMethodId).toBe(
      "current_method", // nigdy nie przyjęta: wymagane odkrycie jest UNKNOWN, nie AVAILABLE
    );

    const availableTechnologyState = setDiscoveryState(
      worldState.technologyStates[technologyStateId]!,
      "gated_discovery",
      { status: "AVAILABLE" },
    );
    const availableWorldState: WorldState = {
      ...worldState,
      technologyStates: {
        ...worldState.technologyStates,
        [technologyStateId]: availableTechnologyState,
      },
    };
    let gatedState = availableWorldState;
    for (let tick = 0; tick < 5; tick++) {
      gatedState = runEconomyTick({ ...tickInputBase, worldState: gatedState, tick })
        .worldState;
    }
    expect(gatedState.companies.company_tech_test?.production.productionMethodId).toBe(
      "gated_method", // teraz przyjęta -- AI-08 ją oceniło i wygrała na marży
    );
    expect(
      gatedState.technologyStates[technologyStateId]?.discoveries.gated_discovery
        ?.industryAdoption,
    ).toBeGreaterThan(0);
  });
});

describe("runEconomyTick -- trade emits trade_flow_active (M19 Chronicle trade_route_emerged)", () => {
  /**
   * `market.goods[goodId].supply`/`.demand` get fully recomputed from
   * real production/consumption at tick step 8 (`updateMarketGood`),
   * BEFORE trade (step 10) reads them -- pre-seeding `MarketGoodState`
   * directly in a fixture is silently overwritten. So this scenario is a
   * real, if minimal, two-region economy: `region_source` runs the same
   * `grain_farm`/`GRAIN_FARM_RECIPE` fixture as the Entrepreneurship
   * tests above but with capacity (20) far exceeding its own tiny
   * (1-person) household's `flour` (== `SURVIVAL_GOOD_ID`) consumption,
   * leaving a real exportable surplus; `region_dest` has a real,
   * well-off consuming cohort (`employment`/`averageIncome` preset, same
   * pattern as `buildEntrepreneurshipWorldState`'s) and produces no
   * `flour` at all, so its demand is entirely unmet locally.
   */
  function buildTradeWorldState(): { worldState: WorldState } {
    const world = createWorld({
      id: "world_trade_flow_test",
      seed: "trade-flow-test",
      name: "Trade Flow Test World",
      configuration: { regionCount: 2, worldSizePreset: "prototype-8-12" },
    });
    const continent = createContinent({ id: "continent_test", worldId: world.id, name: "Test Continent" });
    const geography = {
      terrain: "plains" as const,
      climate: "temperate" as const,
      area: 100,
      fertility: 0.5,
      waterAccess: true,
      coastal: false,
      elevationClass: "lowland" as const,
    };
    const regionSource = createRegion({
      id: "region_source",
      worldId: world.id,
      continentId: continent.id,
      name: "Source",
      geography,
    });
    const regionDest = createRegion({
      id: "region_dest",
      worldId: world.id,
      continentId: continent.id,
      name: "Dest",
      geography,
    });
    const connection = createConnection({
      id: "connection_source_dest",
      regionAId: regionSource.id,
      regionBId: regionDest.id,
      geography: { physicalDistance: 0, terrainDifficulty: 0, seasonalModifier: 1 },
      infrastructure: { level: 1, transportModes: [], capacity: 1000 },
    });

    const marketSource = {
      ...createMarket({ id: "market_source", regionId: regionSource.id }),
      goods: { flour: initializeMarketGood(5) },
    };
    const marketDest = {
      ...createMarket({ id: "market_dest", regionId: regionDest.id }),
      goods: { flour: initializeMarketGood(5) },
    };

    const sourceRegionInventory = createInventory({
      id: "inventory_region_source",
      ownerType: "region",
      ownerId: regionSource.id,
      locationRegionId: regionSource.id,
    });
    const destRegionInventory = createInventory({
      id: "inventory_region_dest",
      ownerType: "region",
      ownerId: regionDest.id,
      locationRegionId: regionDest.id,
    });
    const farmInventory = createInventory({
      id: "inventory_farm",
      ownerType: "company",
      ownerId: "company_farm",
      locationRegionId: regionSource.id,
    });

    const grainDeposit = {
      ...createResourceDeposit({
        id: "deposit_trade_grain",
        resourceDefinitionId: "grain",
        regionId: regionSource.id,
        initialQuantity: 50_000,
        renewable: true,
        renewableState: { regenerationRate: 0.05, sustainableYield: 5000, carryingCapacity: 50_000 },
      }),
      discovery: { status: "DISCOVERED" as const, discoveredTick: 0, discoveredByEntityId: undefined, confidence: 1 },
    };

    const farmWorkerCohort: ReturnType<typeof createPopulationCohort> = {
      ...createPopulationCohort({
        id: "cohort_farm_worker",
        regionId: regionSource.id,
        ageGroup: "AGE_25_44",
        population: 1,
        economicClass: "WORKING",
        skillLevel: "UNSKILLED",
      }),
      employment: 1,
      averageIncome: 1, // minimal purchasing power -- almost none of the farm's own flour output gets consumed locally
    };
    const consumingCohort: ReturnType<typeof createPopulationCohort> = {
      ...createPopulationCohort({
        id: "cohort_dest_consumers",
        regionId: regionDest.id,
        ageGroup: "AGE_25_44",
        population: 200,
        economicClass: "WORKING",
        skillLevel: "UNSKILLED",
      }),
      employment: 200,
      averageIncome: 5000, // real, sustained purchasing power with zero local flour supply
    };

    const baseFarm = createCompany({
      id: "company_farm",
      archetypeId: "grain_farm",
      name: "Export Farm",
      foundedTick: 0,
      regionId: regionSource.id,
      ownerType: "individual",
      ownerEntityId: farmWorkerCohort.id,
      inventoryId: farmInventory.id,
      initialCash: 1000,
      initialWageOffer: 10,
    });
    const farm: Company = {
      ...baseFarm,
      production: { ...baseFarm.production, productionMethodId: "manual_farming", capacity: 20, utilization: 1 },
      workforce: { ...baseFarm.workforce, employees: 1 },
    };

    const worldState = createWorldState({
      world,
      continents: [continent],
      regions: [regionSource, regionDest],
      connections: [connection],
      markets: [marketSource, marketDest],
      companies: [farm],
      populationCohorts: [farmWorkerCohort, consumingCohort],
      inventories: [sourceRegionInventory, destRegionInventory, farmInventory],
      resourceDeposits: [grainDeposit],
    });
    return { worldState };
  }

  it("emits trade_flow_active toward the region with real unmet demand, anchored on the specific connection+good", () => {
    const { worldState } = buildTradeWorldState();
    const rng = createWorldRng(worldState.world.seed);

    const result = runEconomyTick({
      worldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
      productionRecipesByMethodId: { manual_farming: GRAIN_FARM_RECIPE },
    });

    const tradeFacts = result.facts.filter((f) => f.type === "trade_flow_active");
    expect(tradeFacts.length).toBeGreaterThan(0);
    expect(tradeFacts[0]).toMatchObject({
      subject: { entityType: "connectionGood", entityId: "connection_source_dest:flour" },
      location: { regionId: "region_dest" }, // the importing side -- dest has the unmet demand
    });
    expect((tradeFacts[0]!.values as { after: number }).after).toBeGreaterThan(0);
  });

  it("M21-VIS-R4B: trade_flow_active carries the quantity physically moved between inventories, not the evaluated import", () => {
    const { worldState } = buildTradeWorldState();
    const rng = createWorldRng(worldState.world.seed);

    const result = runEconomyTick({
      worldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
      productionRecipesByMethodId: { manual_farming: GRAIN_FARM_RECIPE },
    });

    const tradeFacts = result.facts.filter((f) => f.type === "trade_flow_active");
    expect(tradeFacts).toHaveLength(1);
    const delivered = (tradeFacts[0]!.values as { after: number }).after;
    // Kolejność faktów bez zmian: handel, potem ruch inventory tego przepływu.
    const tradeIndex = result.facts.indexOf(tradeFacts[0]!);
    const shipped = result.facts[tradeIndex + 1]!;
    const received = result.facts[tradeIndex + 2]!;
    expect(shipped).toMatchObject({
      type: "inventory_decreased",
      subject: { entityId: "inventory_region_source:flour" },
    });
    expect(received).toMatchObject({
      type: "inventory_increased",
      subject: { entityId: "inventory_region_dest:flour" },
    });
    // W tym scenariuszu ocena (`evaluateTradeFlow`) przekracza realny stock
    // eksportera -- fakt musi pokazać to, co faktycznie dotarło.
    expect(delivered).toBeGreaterThan(0);
    expect((received.values as { delta: number }).delta).toBe(delivered);
    expect((shipped.values as { delta: number }).delta).toBe(-delivered);
    expect((shipped.values as { after: number }).after).toBe(0);
  });

  it("M21-VIS-R4B: a real tick's delivered flow reaches the region trade Read Model on both sides, for the last completed month", () => {
    const { worldState } = buildTradeWorldState();
    const runner = createWorldRunner({
      worldState,
      worldSeed: worldState.world.seed,
      startYear: worldState.world.currentDate.year,
      startMonth: worldState.world.currentDate.month,
      productionRecipesByMethodId: { manual_farming: GRAIN_FARM_RECIPE },
    });
    runner.step();
    const fact = runner.facts.find((f) => f.type === "trade_flow_active")!;
    const delivered = (fact.values as { after: number }).after;
    const snapshot = buildWorldSnapshot(runner.worldState, runner.facts);
    const dest = snapshot.regions.find((r) => r.regionId === "region_dest")!.trade;
    const source = snapshot.regions.find((r) => r.regionId === "region_source")!.trade;
    if (dest.status !== "RECORDED" || source.status !== "RECORDED") throw new Error("expected RECORDED");
    expect(dest.period.tick).toBe(fact.tick);
    expect(dest.goods).toEqual([
      {
        goodId: "flour",
        imported: { known: delivered, records: 1, unknownRecords: 0 },
        exported: { known: 0, records: 0, unknownRecords: 0 },
        partners: [
          {
            partnerRegionId: "region_source",
            imported: { known: delivered, records: 1, unknownRecords: 0 },
            exported: { known: 0, records: 0, unknownRecords: 0 },
          },
        ],
      },
    ]);
    expect(source.goods[0]!.exported.known).toBe(delivered);
    expect(source.goods[0]!.partners[0]!.partnerRegionId).toBe("region_dest");
  });

  it("emits no trade_flow_active when neither direction has both surplus and demand", () => {
    const world = createWorld({
      id: "world_no_trade_test",
      seed: "no-trade-test",
      name: "No Trade Test World",
      configuration: { regionCount: 2, worldSizePreset: "prototype-8-12" },
    });
    const continent = createContinent({ id: "continent_test", worldId: world.id, name: "Test Continent" });
    const geography = {
      terrain: "plains" as const,
      climate: "temperate" as const,
      area: 100,
      fertility: 0.5,
      waterAccess: true,
      coastal: false,
      elevationClass: "lowland" as const,
    };
    const regionA = createRegion({
      id: "region_a",
      worldId: world.id,
      continentId: continent.id,
      name: "A",
      geography,
    });
    const regionB = createRegion({
      id: "region_b",
      worldId: world.id,
      continentId: continent.id,
      name: "B",
      geography,
    });
    const connection = createConnection({
      id: "connection_a_b",
      regionAId: regionA.id,
      regionBId: regionB.id,
      geography: { physicalDistance: 0, terrainDifficulty: 0, seasonalModifier: 1 },
      infrastructure: { level: 1, transportModes: [], capacity: 1000 },
    });
    // Neither region has any supply or demand for the shared good.
    const marketA = {
      ...createMarket({ id: "market_a", regionId: regionA.id }),
      goods: { grain: initializeMarketGood(2) },
    };
    const marketB = {
      ...createMarket({ id: "market_b", regionId: regionB.id }),
      goods: { grain: initializeMarketGood(2) },
    };

    const worldState = createWorldState({
      world,
      continents: [continent],
      regions: [regionA, regionB],
      connections: [connection],
      markets: [marketA, marketB],
    });

    const rng = createWorldRng(worldState.world.seed);
    const result = runEconomyTick({
      worldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
    });

    expect(result.facts.filter((f) => f.type === "trade_flow_active")).toEqual([]);
  });
});
