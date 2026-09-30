import {
  createCompany,
  createConnection,
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

/**
 * VERIFICATION SCENARIO (M21-VIS-R4B) -- nie jest contentem gry ani
 * częścią świata Black Mountain. Deterministyczny STAN POCZĄTKOWY dwóch
 * regionów, w których obecny model handlu faktycznie wymienia towar:
 *
 * - „Grain Basin” (eksporter): farma zbożowa (capacity 20) przy 1-osobowej
 *   kohorcie o minimalnym dochodzie -- realna nadwyżka mąki;
 * - „Market Coast” (importer): 200 zatrudnionych konsumentów z dochodem,
 *   bez produkcji mąki -- realny niedobór;
 * - oba mają Market i regionalne Inventory, połączenie z capacity 1000.
 *
 * Żadnych faktów ani wartości wynikowych: handel liczy produkcyjny
 * `WorldRunner.step()` (`runEconomyTick`, krok 10). Ten sam układ co test
 * `economy-tick.test.ts` „trade emits trade_flow_active” -- w pierwszym
 * ticku ocena (`evaluateTradeFlow`) przekracza realny stock eksportera,
 * więc przeniesiona ilość jest mniejsza od ocenionej.
 */
export const TRADE_SCENARIO = {
  seed: "trade-verification-scenario",
  exporterRegionId: "scenario_grain_basin",
  importerRegionId: "scenario_market_coast",
  connectionId: "scenario_connection_basin_coast",
  goodId: "flour",
} as const;

/** Te same wartości co `content/productionMethods/manual_farming.json`. */
export const TRADE_SCENARIO_RECIPES: Readonly<Record<string, ProductionRecipe>> = {
  manual_farming: {
    productionMethodId: "manual_farming",
    employeesPerBatch: 1,
    resourceInputsPerBatch: { grain: 10 },
    goodInputsPerBatch: {},
    goodOutputsPerBatch: { flour: 8 },
    eligibleCompanyArchetypeIds: ["grain_farm"],
  },
};

export function buildTradeScenarioWorldState(): WorldState {
  const S = TRADE_SCENARIO;
  const world = createWorld({
    id: "world_trade_verification",
    seed: S.seed,
    name: "Trade verification scenario",
    configuration: { regionCount: 2, worldSizePreset: "prototype-8-12" },
  });
  const continent = createContinent({
    id: "continent_scenario",
    worldId: world.id,
    name: "Scenario",
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
  const exporter = createRegion({
    id: S.exporterRegionId,
    worldId: world.id,
    continentId: continent.id,
    name: "Grain Basin",
    geography,
  });
  const importer = createRegion({
    id: S.importerRegionId,
    worldId: world.id,
    continentId: continent.id,
    name: "Market Coast",
    geography: { ...geography, coastal: true },
  });
  const connection = createConnection({
    id: S.connectionId,
    regionAId: exporter.id,
    regionBId: importer.id,
    geography: { physicalDistance: 0, terrainDifficulty: 0, seasonalModifier: 1 },
    infrastructure: { level: 1, transportModes: [], capacity: 1000 },
  });
  const markets = [
    {
      ...createMarket({ id: "scenario_market_basin", regionId: exporter.id }),
      goods: { flour: initializeMarketGood(5) },
    },
    {
      ...createMarket({ id: "scenario_market_coast", regionId: importer.id }),
      goods: { flour: initializeMarketGood(5) },
    },
  ];
  const regionInventory = (id: string, regionId: string) =>
    createInventory({
      id,
      ownerType: "region",
      ownerId: regionId,
      locationRegionId: regionId,
    });
  const farmInventory = createInventory({
    id: "scenario_inventory_farm",
    ownerType: "company",
    ownerId: "scenario_company_farm",
    locationRegionId: exporter.id,
  });
  const grainDeposit = {
    ...createResourceDeposit({
      id: "scenario_deposit_grain",
      resourceDefinitionId: "grain",
      regionId: exporter.id,
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
  const farmWorker = {
    ...createPopulationCohort({
      id: "scenario_cohort_farm_worker",
      regionId: exporter.id,
      ageGroup: "AGE_25_44",
      population: 1,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
    employment: 1,
    averageIncome: 1,
  };
  const consumers = {
    ...createPopulationCohort({
      id: "scenario_cohort_coast_consumers",
      regionId: importer.id,
      ageGroup: "AGE_25_44",
      population: 200,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
    employment: 200,
    averageIncome: 5000,
  };
  const baseFarm = createCompany({
    id: "scenario_company_farm",
    archetypeId: "grain_farm",
    name: "Basin Farm",
    foundedTick: 0,
    regionId: exporter.id,
    ownerType: "individual",
    ownerEntityId: farmWorker.id,
    inventoryId: farmInventory.id,
    initialCash: 1000,
    initialWageOffer: 10,
  });
  const farm: Company = {
    ...baseFarm,
    production: {
      ...baseFarm.production,
      productionMethodId: "manual_farming",
      capacity: 20,
      utilization: 1,
    },
    workforce: { ...baseFarm.workforce, employees: 1 },
  };
  return createWorldState({
    world,
    continents: [continent],
    regions: [exporter, importer],
    connections: [connection],
    markets,
    companies: [farm],
    populationCohorts: [farmWorker, consumers],
    inventories: [
      regionInventory("scenario_inventory_basin", exporter.id),
      regionInventory("scenario_inventory_coast", importer.id),
      farmInventory,
    ],
    resourceDeposits: [grainDeposit],
  });
}

/** Produkcyjny runner scenariusza po `ticks` krokach (domyślnie 1). */
export function runTradeScenario(ticks = 1): WorldRunner {
  const worldState = buildTradeScenarioWorldState();
  const runner = createWorldRunner({
    worldState,
    worldSeed: worldState.world.seed,
    startYear: worldState.world.currentDate.year,
    startMonth: worldState.world.currentDate.month,
    productionRecipesByMethodId: TRADE_SCENARIO_RECIPES,
  });
  runner.runTicks(ticks);
  return runner;
}

/**
 * Ilość, którą `evaluateTradeFlow` oceniło dla scenariusza w danym stanie
 * rynków: `min(niedobór importera, capacity, nadwyżka eksportera)` --
 * potrzebne testom, żeby wykazać „ocenione > przeniesione”.
 */
export function tradeScenarioEvaluatedQuantity(worldState: WorldState): number {
  const S = TRADE_SCENARIO;
  const exporterGood =
    worldState.markets[worldState.regions[S.exporterRegionId]!.economy.marketId!]!.goods[
      S.goodId
    ]!;
  const importerGood =
    worldState.markets[worldState.regions[S.importerRegionId]!.economy.marketId!]!.goods[
      S.goodId
    ]!;
  const capacity = worldState.connections[S.connectionId]!.infrastructure.capacity;
  return Math.min(
    Math.max(0, importerGood.demand - importerGood.supply),
    capacity,
    Math.max(0, exporterGood.supply - exporterGood.demand),
  );
}
