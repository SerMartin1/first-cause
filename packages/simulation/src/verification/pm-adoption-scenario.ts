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
import { createWorldRunner, type WorldRunner } from "../core/world-runner.js";
import type { ProductionRecipe } from "../systems/economy/production.js";
import { initializeMarketGood } from "../systems/economy/markets/price-adjustment.js";
import { initialHouseholdSavings } from "../systems/population/household-budget.js";
import { buildWorldSnapshot } from "../read-models/world-view-read-model.js";

/**
 * VERIFICATION SCENARIO (M21-VIS-R4B Economy) -- nie jest contentem gry ani
 * częścią świata Black Mountain. Jeden region z rynkiem i regionalnym
 * Inventory, jedna farma zbożowa i kandydat AI-08 o INNYM zestawie wyjść:
 *
 * - `manual_farming` -- te same wartości co
 *   `content/productionMethods/manual_farming.json` (10 zboża → 8 mąki);
 * - `scenario_mixed_milling` -- tylko tutaj: 10 zboża → 4 mąki + 6 chleba
 *   (towary z contentu, inne wyjścia i proporcje). Recepta ma ten sam
 *   kontrakt `ProductionRecipe` co receptury ładowane z contentu
 *   (`parseProductionRecipe`), łącznie z `eligibleCompanyArchetypeIds`.
 *
 * Przy cenach 5 / 5 kandydat ma wyższą marżę, więc produkcyjny AI-08
 * (`runEconomyTick`, krok 3) przyjmuje go po okresie persistence. W ticku
 * adopcji farma produkuje jeszcze `manual_farming` (krok 5, receptura sprzed
 * decyzji), a `productionMethodId` wskazuje już nową metodę -- to jest
 * przypadek, którego Read Model nie może rozdzielić z nowej metody.
 */
export const PM_ADOPTION_SCENARIO = {
  seed: "pm-adoption-verification-scenario",
  regionId: "scenario_mill_valley",
  companyId: "scenario_company_mill",
  fromMethodId: "manual_farming",
  toMethodId: "scenario_mixed_milling",
} as const;

export const PM_ADOPTION_SCENARIO_RECIPES: Readonly<Record<string, ProductionRecipe>> = {
  manual_farming: {
    productionMethodId: "manual_farming",
    employeesPerBatch: 1,
    resourceInputsPerBatch: { grain: 10 },
    goodInputsPerBatch: {},
    goodOutputsPerBatch: { flour: 8 },
    eligibleCompanyArchetypeIds: ["grain_farm"],
  },
  scenario_mixed_milling: {
    productionMethodId: "scenario_mixed_milling",
    employeesPerBatch: 1,
    resourceInputsPerBatch: { grain: 10 },
    goodInputsPerBatch: {},
    goodOutputsPerBatch: { flour: 4, bread: 6 },
    eligibleCompanyArchetypeIds: ["grain_farm"],
  },
};
export const PM_ADOPTION_SCENARIO_CANDIDATES: Readonly<Record<string, string>> = {
  manual_farming: "scenario_mixed_milling",
};
/** Proporcje wyjść dla Read Modelu -- tak jak `world-session.ts` buduje je z receptur. */
export const PM_ADOPTION_SCENARIO_OUTPUTS: Readonly<
  Record<string, Readonly<Record<string, number>>>
> = Object.fromEntries(
  Object.entries(PM_ADOPTION_SCENARIO_RECIPES).map(([id, r]) => [id, r.goodOutputsPerBatch]),
);

export function buildPmAdoptionScenarioWorldState(): WorldState {
  const S = PM_ADOPTION_SCENARIO;
  const world = createWorld({
    id: "world_pm_adoption_verification",
    seed: S.seed,
    name: "PM adoption verification scenario",
    configuration: { regionCount: 1, worldSizePreset: "prototype-8-12" },
  });
  const continent = createContinent({
    id: "continent_pm_scenario",
    worldId: world.id,
    name: "Scenario",
  });
  const region = createRegion({
    id: S.regionId,
    worldId: world.id,
    continentId: continent.id,
    name: "Mill Valley",
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
  const market = {
    ...createMarket({ id: "scenario_market_mill", regionId: region.id }),
    goods: { flour: initializeMarketGood(5), bread: initializeMarketGood(5) },
  };
  const regionInventory = createInventory({
    id: "scenario_inventory_mill_valley",
    ownerType: "region",
    ownerId: region.id,
    locationRegionId: region.id,
  });
  const millInventory = createInventory({
    id: "scenario_inventory_mill",
    ownerType: "company",
    ownerId: S.companyId,
    locationRegionId: region.id,
  });
  const grainDeposit = {
    ...createResourceDeposit({
      id: "scenario_deposit_mill_grain",
      resourceDefinitionId: "grain",
      regionId: region.id,
      initialQuantity: 50_000,
      renewable: true,
      renewableState: {
        regenerationRate: 0.05,
        sustainableYield: 5000,
        carryingCapacity: 50_000,
      },
    }),
    discovery: {
      status: "DISCOVERED" as const,
      discoveredTick: 0,
      discoveredByEntityId: undefined,
      confidence: 1,
    },
  };
  const workers = {
    ...createPopulationCohort({
      id: "scenario_cohort_mill_workers",
      regionId: region.id,
      ageGroup: "AGE_25_44",
      population: 50,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
    employment: 2,
    averageIncome: 50,
    // Etap 2 (N7): oszczędności startowe wg reguły świata (3 mies. koszyka po 5,00).
    savings: initialHouseholdSavings(50, 5),
  };
  const baseMill = createCompany({
    id: S.companyId,
    archetypeId: "grain_farm",
    name: "Valley Mill",
    foundedTick: 0,
    regionId: region.id,
    ownerType: "individual",
    ownerEntityId: workers.id,
    inventoryId: millInventory.id,
    initialCash: 1000,
    initialWageOffer: 10,
  });
  const mill: Company = {
    ...baseMill,
    production: {
      ...baseMill.production,
      productionMethodId: S.fromMethodId,
      capacity: 2,
      utilization: 1,
    },
    workforce: { ...baseMill.workforce, employees: 2 },
  };
  return createWorldState({
    world,
    continents: [continent],
    regions: [region],
    markets: [market],
    companies: [mill],
    populationCohorts: [workers],
    inventories: [regionInventory, millInventory],
    resourceDeposits: [grainDeposit],
  });
}

/** Konfiguracja produkcyjnego `WorldRunner` scenariusza (także do odtworzenia po wczytaniu zapisu). */
export const PM_ADOPTION_SCENARIO_RUNNER_CONFIG = {
  productionRecipesByMethodId: PM_ADOPTION_SCENARIO_RECIPES,
  pmCandidatesByCurrentMethodId: PM_ADOPTION_SCENARIO_CANDIDATES,
} as const;

/** Produkcyjny runner scenariusza (bez kroków). */
export function createPmAdoptionScenarioRunner(): WorldRunner {
  const worldState = buildPmAdoptionScenarioWorldState();
  return createWorldRunner({
    worldState,
    worldSeed: worldState.world.seed,
    startYear: worldState.world.currentDate.year,
    startMonth: worldState.world.currentDate.month,
    ...PM_ADOPTION_SCENARIO_RUNNER_CONFIG,
  });
}

/** Faktycznie wytworzone w ticku `tick` (fakty `inventory_increased` magazynu firmy). */
export function pmAdoptionScenarioProducedInTick(runner: WorldRunner, tick: number): Record<string, number> {
  const company = runner.worldState.companies[PM_ADOPTION_SCENARIO.companyId]!;
  const prefix = `${company.inventoryId}:`;
  const produced: Record<string, number> = {};
  for (const fact of runner.facts) {
    if (fact.tick !== tick || fact.type !== "inventory_increased") continue;
    if (!fact.subject.entityId.startsWith(prefix)) continue;
    const goodId = fact.subject.entityId.slice(prefix.length);
    produced[goodId] = (produced[goodId] ?? 0) + Number(fact.values.delta);
  }
  return produced;
}

export const pmAdoptionScenarioEconomy = (runner: WorldRunner) =>
  buildWorldSnapshot(runner.worldState, runner.facts, {
    goodOutputsPerBatchByMethodId: PM_ADOPTION_SCENARIO_OUTPUTS,
  }).regions.find((r) => r.regionId === PM_ADOPTION_SCENARIO.regionId)!.economy;

/** Kroki aż do ticka adopcji; zwraca numer ticka, w którym metoda się zmieniła. */
export function stepPmAdoptionScenarioUntilAdoption(runner: WorldRunner, maxTicks = 24): number {
  for (let i = 0; i < maxTicks; i++) {
    const tick = runner.tick;
    runner.step();
    if (runner.worldState.companies[PM_ADOPTION_SCENARIO.companyId]!.production.productionMethodId === PM_ADOPTION_SCENARIO.toMethodId)
      return tick;
  }
  throw new Error("scenario: AI-08 never adopted the candidate method");
}
