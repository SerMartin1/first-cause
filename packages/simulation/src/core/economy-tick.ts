import {
  createWorldState,
  type Company,
  type Connection,
  type Inventory,
  type Market,
  type PopulationCohort,
  type ResourceDeposit,
  type WorldState,
} from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { sortedEntries } from "./determinism.js";
import type { RngStream } from "./rng.js";
import { groupCohortsIntoFamilies } from "../systems/population/cohorts.js";
import { applyMonthlyDemography } from "../systems/population/demography.js";
import { applyHouseholdConsumption } from "../systems/population/consumption.js";
import {
  DEFAULT_PRODUCTION_RECIPES,
  runProduction,
  type ProductionRecipe,
} from "../systems/economy/production.js";
import {
  applyCompanyFinances,
  settleHouseholdPurchase,
  settleProductionSale,
  settleTradeFlow,
} from "../systems/economy/settlement.js";
import {
  availableWorkers,
  layoffWorkers,
  matchEmployment,
} from "../systems/economy/labor/employment.js";
import { adjustWageOffer } from "../systems/economy/labor/wages.js";
import { updateMarketGood } from "../systems/economy/markets/price-adjustment.js";
import { evaluateTradeFlow } from "../systems/economy/trade/flows.js";
import {
  DEFAULT_TRANSPORT_MODE_PROFILES,
  type TransportModeProfile,
} from "../systems/economy/transport/modes.js";
import { regenerateDeposit } from "../systems/resources/renewable.js";
import {
  assessFinancialHealth,
  decideLabor,
  decideLifecycle,
  decideProduction,
} from "../systems/economy/company-ai/index.js";
import { evaluatePmAdoption } from "../systems/economy/company-ai/pm-adoption.js";

/**
 * Etap 1 tick-loop integration (audytowe P0-01): pierwsze miejsce, które
 * faktycznie woła M7-M11 przeciw prawdziwemu `WorldState`, zamiast tylko
 * przeciw ręcznie złożonym danym testowym. Świadomie NIE naprawiał wtedy
 * ograniczenia produkcji pracą (P0-02), uzgodnienia zatrudnienia z
 * demografią (P0-04) ani JSON-owych receptur (P0-06) -- używał
 * istniejących funkcji systemowych dokładnie tak, jak były.
 *
 * Etap 2 (audytowe P0-03/P0-05/P0-07) dodał tu: sortowanie kluczy przed
 * sumowaniem (`sortedEntries`, ten sam most co
 * `company-ai/pm-adoption.ts`/`markets/demand-aggregation.ts`) i
 * rozliczenie pieniędzy wyłącznie przez `applyCompanyFinances`
 * (`settlement.ts`), które samo zaokrągla przez `roundMoney`.
 *
 * Etap 3 naprawił P0-02 (`production.ts::ProductionRecipe.employeesPerBatch`
 * -- `runProduction` teraz odrzuca batch, na który nie starcza
 * `Company.workforce.employees`, ten sam wzorzec co zasoby/dobra), P0-04
 * (`population/demography.ts` -- zatrudnienie kohorty jest teraz
 * ograniczane do jej bieżącej populacji po śmierciach/starzeniu, więc
 * martwi ludzie przestają liczyć się jako zatrudnieni) i P0-06:
 * `productionRecipesByMethodId`/`transportModeProfilesByModeId` poniżej są
 * teraz parametrem (domyślnie `DEFAULT_PRODUCTION_RECIPES`/
 * `DEFAULT_TRANSPORT_MODE_PROFILES`, zachowanie identyczne jak dotąd dla
 * caller'a, który nic nie poda) -- realny content-driven caller
 * (`worldgen`'s `loadEconomyContent`) buduje je z `content/
 * productionMethods|transportModes/*.json` przez `production.
 * ts::parseProductionRecipe`/`transport/modes.ts::parseTransportModeProfile`
 * zamiast polegać na hardcoded domyślnych w tym pliku.
 *
 * Kilka drobnych mostów nie istniało wcześniej nigdzie w silniku (żaden
 * system tego nie potrzebował, bo nic ich dotąd nie wołało w pętli) i są
 * tu jawnie, minimalnie zaimplementowane -- patrz stałe `TODO tuning`
 * poniżej oraz `settlement.ts`.
 */

const EMPLOYEES_PER_CAPACITY_UNIT = 1; // TODO tuning -- most z decyzji produkcyjnej (capacity*utilization) do docelowego zatrudnienia; żaden system tego nie liczy (AI-04 zakłada gotowy target)
const TARGET_FINISHED_GOOD_BUFFER = 5; // TODO tuning -- ile jednostek gotowego dobra firma trzyma jako bufor przed sprzedażą (settleProductionSale)
const EXPANSION_CAPITAL_COST = 100; // TODO tuning -- decideLifecycle wymaga jakiegoś kosztu ekspansji; content/finance model to nie ten etap
const SURVIVAL_UNITS_PER_CAPITA = 3; // TODO tuning -- ile jednostek dobra "survival" jedna osoba potrzebuje na tick; 0.05 z M8+M9 regression test było skalibrowane pod inny scenariusz (jeden dobrze opłacany pracownik kupujący zboże po cenie 10), nie pod ten fixture
const SURVIVAL_GOOD_ID = "flour"; // TODO content -- Etap 1 hardcoded most kategoria->dobro (pełne mapowanie z contentu to osobna praca, patrz plan sekcja 1)
const DEFAULT_TRANSPORT_MODE_ID = "cart"; // TODO tuning -- fallback gdy connection.infrastructure.transportModes jest puste/niedopasowane

export interface RunEconomyTickInput {
  readonly worldState: WorldState;
  readonly tick: number;
  /** Demografia (M6) potrzebuje losowości -- `HeadlessRunner.rngStream("demography", scopeId)` albo dowolne inne źródło o tym samym kształcie (SAVE-003: nazwany, scope'owany strumień). */
  readonly demographyRng: (scopeId: string) => RngStream;
  /** Firma z tym `productionMethodId` rozważa przejście na wskazaną recepturę (AI-08). */
  readonly pmCandidatesByCurrentMethodId?: Readonly<Record<string, string>>;
  /**
   * Audytowe P0-06: receptury produkcji per `productionMethodId`. Domyślnie
   * `DEFAULT_PRODUCTION_RECIPES` (te same dwie receptury co dotąd,
   * zachowanie identyczne dla każdego caller'a, który nic nie poda) --
   * realny content-driven caller (`worldgen`) buduje tę mapę z
   * `content/productionMethods/*.json` przez `parseProductionRecipe`
   * zamiast polegać na hardcoded domyślnych.
   */
  readonly productionRecipesByMethodId?: Readonly<Record<string, ProductionRecipe>>;
  /** Audytowe P0-06: analogicznie dla kosztów transportu -- domyślnie `DEFAULT_TRANSPORT_MODE_PROFILES`. */
  readonly transportModeProfilesByModeId?: Readonly<Record<string, TransportModeProfile>>;
}

export interface RunEconomyTickResult {
  readonly worldState: WorldState;
  readonly facts: readonly FactInput[];
}

function recipeCost(
  recipe: ProductionRecipe,
  prices: Readonly<Record<string, number>>,
): number {
  let cost = 0;
  for (const [resourceId, quantity] of sortedEntries(recipe.resourceInputsPerBatch)) {
    cost += quantity * (prices[resourceId] ?? 0);
  }
  for (const [goodId, quantity] of sortedEntries(recipe.goodInputsPerBatch)) {
    cost += quantity * (prices[goodId] ?? 0);
  }
  return cost;
}

function recipeRevenuePerBatch(
  recipe: ProductionRecipe,
  prices: Readonly<Record<string, number>>,
): number {
  let revenue = 0;
  for (const [goodId, quantity] of sortedEntries(recipe.goodOutputsPerBatch)) {
    revenue += quantity * (prices[goodId] ?? 0);
  }
  return revenue;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** 0..1: czy firma ma na stanie (depozyt/inventory) przynajmniej jeden batch wart wejść. Naiwny, jawnie oznaczony most (pełne AI-02 to osobna praca). */
function computeInputAvailability(
  recipe: ProductionRecipe,
  companyInventory: Inventory,
  depositsByResourceId: Readonly<Record<string, ResourceDeposit>>,
): number {
  let availability = 1;
  for (const [resourceId, quantityPerBatch] of Object.entries(
    recipe.resourceInputsPerBatch,
  )) {
    if (quantityPerBatch <= 0) continue;
    const stock = depositsByResourceId[resourceId]?.stock.quantity ?? 0;
    availability = Math.min(availability, clamp01(stock / quantityPerBatch));
  }
  for (const [goodId, quantityPerBatch] of Object.entries(recipe.goodInputsPerBatch)) {
    if (quantityPerBatch <= 0) continue;
    const stock = companyInventory.items[goodId]?.quantity ?? 0;
    availability = Math.min(availability, clamp01(stock / quantityPerBatch));
  }
  return availability;
}

function selectTransportProfile(
  connection: Connection,
  transportModeProfilesByModeId: Readonly<Record<string, TransportModeProfile>>,
): TransportModeProfile {
  for (const modeId of connection.infrastructure.transportModes) {
    const profile = transportModeProfilesByModeId[modeId];
    if (profile) return profile;
  }
  return transportModeProfilesByModeId[DEFAULT_TRANSPORT_MODE_ID]!;
}

export function runEconomyTick(input: RunEconomyTickInput): RunEconomyTickResult {
  const { worldState, tick, demographyRng } = input;
  const pmCandidates = input.pmCandidatesByCurrentMethodId ?? {};
  const productionRecipesByMethodId =
    input.productionRecipesByMethodId ?? DEFAULT_PRODUCTION_RECIPES;
  const transportModeProfilesByModeId =
    input.transportModeProfilesByModeId ?? DEFAULT_TRANSPORT_MODE_PROFILES;

  const companies: Record<string, Company> = { ...worldState.companies };
  const markets: Record<string, Market> = { ...worldState.markets };
  const inventories: Record<string, Inventory> = { ...worldState.inventories };
  let populationCohorts: Record<string, PopulationCohort> = {
    ...worldState.populationCohorts,
  };
  const resourceDeposits: Record<string, ResourceDeposit> = {
    ...worldState.resourceDeposits,
  };
  const connections: Record<string, Connection> = { ...worldState.connections };
  const facts: FactInput[] = [];

  const regionIds = Object.keys(worldState.regions).sort();

  for (const regionId of regionIds) {
    const region = worldState.regions[regionId]!;
    const marketId = region.economy.marketId;
    const regionInventoryId = region.economy.regionalInventoryId;
    const companyIds = [...region.economy.companyIds].sort();
    const cohortIds = [...region.population.cohortIds].sort();

    const depositIdByResource = new Map<string, string>();
    for (const depositId of region.resources.depositIds) {
      const deposit = resourceDeposits[depositId];
      if (deposit) depositIdByResource.set(deposit.resourceDefinitionId, depositId);
    }

    const supplyByGood: Record<string, number> = {};
    const companyDemandByGood: Record<string, number> = {};
    const householdDemandByGood: Record<string, number> = {};

    for (const companyId of companyIds) {
      let company = companies[companyId]!;
      if (!company.status.active) continue;

      const market = marketId ? markets[marketId] : undefined;
      const prices = market
        ? Object.fromEntries(
            Object.entries(market.goods).map(([goodId, good]) => [
              goodId,
              good.localPrice,
            ]),
          )
        : {};

      const recipe = company.production.productionMethodId
        ? productionRecipesByMethodId[company.production.productionMethodId]
        : undefined;

      // 1. Company AI: OBSERVE (ostatni tick) -> DECIDE.
      const financialHealth = assessFinancialHealth(company);

      const depositsForRecipe: Record<string, ResourceDeposit> = {};
      if (recipe) {
        for (const resourceId of Object.keys(recipe.resourceInputsPerBatch)) {
          const depositId = depositIdByResource.get(resourceId);
          if (depositId) depositsForRecipe[resourceId] = resourceDeposits[depositId]!;
        }
      }

      const companyInventoryBeforeDecision = inventories[company.inventoryId]!;
      const expectedMargin = recipe
        ? recipeRevenuePerBatch(recipe, prices) - recipeCost(recipe, prices)
        : 0;
      const inputAvailability = recipe
        ? computeInputAvailability(
            recipe,
            companyInventoryBeforeDecision,
            depositsForRecipe,
          )
        : 1;
      const primaryOutputGoodId = recipe
        ? Object.keys(recipe.goodOutputsPerBatch)[0]
        : undefined;
      const finishedGoodQuantity = primaryOutputGoodId
        ? (companyInventoryBeforeDecision.items[primaryOutputGoodId]?.quantity ?? 0)
        : 0;
      const inventoryLevel =
        TARGET_FINISHED_GOOD_BUFFER > 0
          ? finishedGoodQuantity / TARGET_FINISHED_GOOD_BUFFER
          : 0;

      const productionDecision = decideProduction({
        company,
        expectedMargin,
        inputAvailability,
        inventoryLevel,
        financialHealth,
      });
      company = productionDecision.company;
      facts.push(...productionDecision.facts);

      const targetEmployment = Math.ceil(
        company.production.capacity *
          company.production.utilization *
          EMPLOYEES_PER_CAPACITY_UNIT,
      );
      const laborDecision = decideLabor({
        company,
        tick,
        targetEmployment,
        financialHealth,
      });
      company = laborDecision.company;
      facts.push(...laborDecision.facts);

      const demandPersistenceScore = primaryOutputGoodId
        ? (market?.goods[primaryOutputGoodId]?.shortageSeverity ?? 0)
        : 0;
      const lifecycleDecision = decideLifecycle({
        company,
        tick,
        financialHealth,
        demandPersistenceScore,
        expectedMargin,
        capitalCost: EXPANSION_CAPITAL_COST,
      });
      company = lifecycleDecision.company;

      const candidateMethodId = company.production.productionMethodId
        ? pmCandidates[company.production.productionMethodId]
        : undefined;
      const candidateRecipe = candidateMethodId
        ? productionRecipesByMethodId[candidateMethodId]
        : undefined;
      if (recipe && candidateRecipe) {
        const pmResult = evaluatePmAdoptionSafely({
          company,
          tick,
          currentRecipe: recipe,
          candidateRecipe,
          prices,
        });
        company = pmResult.company;
      }

      companies[companyId] = company;
      if (!company.status.active) continue;

      // 2. Rynek pracy: wages -> hire/layoff.
      const availableLabor = cohortIds.reduce(
        (sum, cohortId) => sum + availableWorkers(populationCohorts[cohortId]!),
        0,
      );
      if (company.workforce.wageOffer > 0) {
        const wageResult = adjustWageOffer({ company, availableLabor });
        company = wageResult.company;
        facts.push(...wageResult.facts);
      }

      if (laborDecision.action === "HIRE") {
        for (const cohortId of cohortIds) {
          if (company.workforce.vacancies <= 0) break;
          const cohort = populationCohorts[cohortId]!;
          if (cohort.population <= 0) continue;
          // Etap 1 most: nic nie liczy prawdziwego skill mixu (AI-owned,
          // M11) -- cały pozostały pool wakatów traktujemy jako otwarty
          // na skill tej konkretnej kohorty, po kolei.
          company = {
            ...company,
            workforce: {
              ...company.workforce,
              skillDemand: {
                ...company.workforce.skillDemand,
                [cohort.skillLevel]: company.workforce.vacancies,
              },
            },
          };
          const matchResult = matchEmployment({ company, cohort });
          company = matchResult.company;
          populationCohorts[cohortId] = matchResult.cohort;
          facts.push(...matchResult.facts);
        }
      } else if (laborDecision.action === "LAYOFF" && laborDecision.layoffTarget > 0) {
        let remaining = laborDecision.layoffTarget;
        for (const cohortId of cohortIds) {
          if (remaining <= 0) break;
          const cohort = populationCohorts[cohortId]!;
          const count = Math.min(
            remaining,
            cohort.employment,
            company.workforce.employees,
          );
          if (count <= 0) continue;
          const layoffResult = layoffWorkers({ company, cohort, count });
          company = layoffResult.company;
          populationCohorts[cohortId] = layoffResult.cohort;
          facts.push(...layoffResult.facts);
          remaining -= count;
        }
      }
      companies[companyId] = company;

      // 3. Produkcja.
      let companyInventory = inventories[company.inventoryId]!;
      let batchesRun = 0;
      if (recipe) {
        const productionResult = runProduction({
          tick,
          company,
          inventory: companyInventory,
          recipe,
          resourceDeposits: depositsForRecipe,
        });
        company = productionResult.company;
        companyInventory = productionResult.inventory;
        batchesRun = productionResult.batches;
        for (const deposit of Object.values(productionResult.resourceDeposits)) {
          resourceDeposits[deposit.id] = deposit;
        }
        facts.push(...productionResult.facts);

        for (const [goodId, quantityPerBatch] of Object.entries(
          recipe.goodOutputsPerBatch,
        )) {
          supplyByGood[goodId] =
            (supplyByGood[goodId] ?? 0) + quantityPerBatch * batchesRun;
        }
        for (const [goodId, quantityPerBatch] of Object.entries(
          recipe.goodInputsPerBatch,
        )) {
          companyDemandByGood[goodId] =
            (companyDemandByGood[goodId] ?? 0) + quantityPerBatch * batchesRun;
        }
      }
      inventories[company.inventoryId] = companyInventory;
      companies[companyId] = company;

      // 4. Rozliczenie sprzedaży (fizyczne + finansowe).
      let revenueThisTick = 0;
      if (recipe && regionInventoryId && market) {
        let regionInventory = inventories[regionInventoryId]!;
        for (const goodId of Object.keys(recipe.goodOutputsPerBatch).sort()) {
          const price = market.goods[goodId]?.localPrice;
          if (price === undefined) continue;
          const saleResult = settleProductionSale({
            companyInventory: inventories[company.inventoryId]!,
            regionInventory,
            goodId,
            price,
            targetBufferQuantity: TARGET_FINISHED_GOOD_BUFFER,
          });
          inventories[company.inventoryId] = saleResult.companyInventory;
          regionInventory = saleResult.regionInventory;
          revenueThisTick += saleResult.revenue;
          facts.push(...saleResult.facts);
        }
        inventories[regionInventoryId] = regionInventory;
      }

      const laborCostThisTick = company.workforce.wageOffer * company.workforce.employees;
      const financeResult = applyCompanyFinances({
        company,
        revenue: revenueThisTick,
        costs: laborCostThisTick,
      });
      companies[companyId] = financeResult.company;
      facts.push(...financeResult.facts);
    }

    // 5. Gospodarstwa domowe: dochód -> wydatki -> fizyczny zakup.
    if (marketId) {
      const survivalPrice = markets[marketId]!.goods[SURVIVAL_GOOD_ID]?.localPrice;
      for (const cohortId of cohortIds) {
        let cohort = populationCohorts[cohortId]!;
        if (cohort.population <= 0 || cohort.employment <= 0) continue;

        const survivalCost =
          survivalPrice !== undefined
            ? cohort.population * SURVIVAL_UNITS_PER_CAPITA * survivalPrice
            : 0;
        const consumptionResult = applyHouseholdConsumption({
          cohort,
          categoryCost: {
            survival: survivalCost,
            basic: 0,
            services: 0,
            comfort: 0,
            prosperity: 0,
            luxury: 0,
          },
        });
        cohort = consumptionResult.cohort;
        facts.push(...consumptionResult.facts);

        if (survivalPrice !== undefined && regionInventoryId) {
          const desiredQuantity = consumptionResult.spent.survival / survivalPrice;
          householdDemandByGood[SURVIVAL_GOOD_ID] =
            (householdDemandByGood[SURVIVAL_GOOD_ID] ?? 0) + desiredQuantity;

          const purchaseResult = settleHouseholdPurchase({
            regionInventory: inventories[regionInventoryId]!,
            goodId: SURVIVAL_GOOD_ID,
            desiredQuantity,
          });
          inventories[regionInventoryId] = purchaseResult.regionInventory;
          facts.push(...purchaseResult.facts);
        }

        populationCohorts[cohortId] = cohort;
      }
    }

    // 6. Rynek: cena/niedobór na podstawie realnie zaobserwowanego popytu/podaży tego ticku.
    if (marketId) {
      let market = markets[marketId]!;
      const regionInventory = regionInventoryId
        ? inventories[regionInventoryId]
        : undefined;
      for (const goodId of Object.keys(market.goods).sort()) {
        const demandSources: Record<string, number> = {};
        if (companyDemandByGood[goodId])
          demandSources.companies = companyDemandByGood[goodId];
        if (householdDemandByGood[goodId])
          demandSources.households = householdDemandByGood[goodId];

        const updateResult = updateMarketGood({
          market,
          goodId,
          supply: supplyByGood[goodId] ?? 0,
          demandSources,
          inventory: regionInventory?.items[goodId]?.quantity ?? 0,
        });
        market = updateResult.market;
        facts.push(...updateResult.facts);
      }
      markets[marketId] = market;
    }
  }

  // 7. Handel: fizyczne przeniesienie dóbr wzdłuż każdego Connection (M10).
  const connectionIds = Object.keys(worldState.connections).sort();
  for (const connectionId of connectionIds) {
    let connection = connections[connectionId]!;
    const regionA = worldState.regions[connection.regionAId];
    const regionB = worldState.regions[connection.regionBId];
    const marketAId = regionA?.economy.marketId;
    const marketBId = regionB?.economy.marketId;
    if (!marketAId || !marketBId || marketAId === marketBId) continue;

    const transportMode = selectTransportProfile(
      connection,
      transportModeProfilesByModeId,
    );
    const goodIds = Object.keys(markets[marketAId]!.goods)
      .filter((goodId) => markets[marketBId]!.goods[goodId])
      .sort();

    for (const goodId of goodIds) {
      connection = tradeOneDirection({
        connection,
        exportingMarketId: marketAId,
        importingMarketId: marketBId,
        exportingRegionInventoryId: regionA!.economy.regionalInventoryId,
        importingRegionInventoryId: regionB!.economy.regionalInventoryId,
        goodId,
        transportMode,
        markets,
        inventories,
        facts,
      });
      connection = tradeOneDirection({
        connection,
        exportingMarketId: marketBId,
        importingMarketId: marketAId,
        exportingRegionInventoryId: regionB!.economy.regionalInventoryId,
        importingRegionInventoryId: regionA!.economy.regionalInventoryId,
        goodId,
        transportMode,
        markets,
        inventories,
        facts,
      });
    }
    connections[connectionId] = connection;
  }

  // 8. Regeneracja odnawialnych zasobów (M5, już istniejący system): bez
  // tego wywołania każdy `renewable: true` depozyt tylko by się wyczerpywał
  // -- `extractFromDeposit` nigdy nie dodaje zasobu z powrotem, regenerację
  // wykonuje wyłącznie ten oddzielny system.
  for (const depositId of Object.keys(resourceDeposits).sort()) {
    const regenResult = regenerateDeposit(resourceDeposits[depositId]!);
    resourceDeposits[depositId] = regenResult.deposit;
    facts.push(...regenResult.facts);
  }

  // 9. Demografia (M6): populacja ewoluuje; `applyMonthlyDemography` samo
  // uzgadnia teraz zatrudnienie kohort ze spadkiem populacji (audytowe
  // P0-04, patrz demography.ts). Company.workforce.employees nie jest tu
  // korygowane -- Company przechowuje tylko zagregowany headcount, bez
  // rozbicia per-kohorta (świadoma granica M9), więc nie da się przypisać
  // utraconych miejsc pracy do konkretnej firmy; kolejny tick's decideLabor
  // sam to nadgoni przez zwykłe HIRE/LAYOFF wobec już skorygowanej podaży pracy.
  const families = groupCohortsIntoFamilies(Object.values(populationCohorts));
  const nextCohorts: Record<string, PopulationCohort> = {};
  for (const family of families) {
    const familyCohorts = Object.values(family);
    const scopeId = familyCohorts[0]!.id;
    const demographyResult = applyMonthlyDemography(familyCohorts, {
      tick,
      rng: demographyRng(scopeId),
    });
    for (const cohort of demographyResult.cohorts) {
      nextCohorts[cohort.id] = cohort;
    }
    facts.push(...demographyResult.facts);
  }
  populationCohorts = nextCohorts;

  // VALIDATE -> COMMIT (SIM-004): reużywa `createWorldState`'s istniejący,
  // przetestowany walidator referencji zamiast pisać nowy.
  const nextWorldState = createWorldState({
    world: worldState.world,
    continents: Object.values(worldState.continents),
    regions: Object.values(worldState.regions),
    connections: Object.values(connections),
    resourceDeposits: Object.values(resourceDeposits),
    settlements: Object.values(worldState.settlements),
    populationCohorts: Object.values(populationCohorts),
    companies: Object.values(companies),
    markets: Object.values(markets),
    inventories: Object.values(inventories),
    technologyStates: Object.values(worldState.technologyStates),
  });

  return { worldState: nextWorldState, facts };
}

function evaluatePmAdoptionSafely(args: {
  readonly company: Company;
  readonly tick: number;
  readonly currentRecipe: ProductionRecipe;
  readonly candidateRecipe: ProductionRecipe;
  readonly prices: Readonly<Record<string, number>>;
}): { readonly company: Company } {
  // conversionCost stays 0 (TODO tuning/content -- no cost model exists
  // yet for switching production methods); evaluatePmAdoption itself
  // still enforces cooldown/persistence/hard eligibility on cash.
  const result = evaluatePmAdoption({ ...args, conversionCost: 0 });
  return { company: result.company };
}

interface TradeOneDirectionArgs {
  readonly connection: Connection;
  readonly exportingMarketId: string;
  readonly importingMarketId: string;
  readonly exportingRegionInventoryId: string | undefined;
  readonly importingRegionInventoryId: string | undefined;
  readonly goodId: string;
  readonly transportMode: TransportModeProfile;
  readonly markets: Record<string, Market>;
  readonly inventories: Record<string, Inventory>;
  readonly facts: FactInput[];
}

/** Ocenia i fizycznie rozlicza jeden kierunek handlu (importer = strona przekazana jako "importing"). */
function tradeOneDirection(args: TradeOneDirectionArgs): Connection {
  const exportingGood = args.markets[args.exportingMarketId]!.goods[args.goodId];
  const importingGood = args.markets[args.importingMarketId]!.goods[args.goodId];
  if (!exportingGood || !importingGood) return args.connection;

  const desiredImportQuantity = Math.max(0, importingGood.demand - importingGood.supply);
  const tradeResult = evaluateTradeFlow({
    connection: args.connection,
    exportingGood,
    importingGood,
    transportMode: args.transportMode,
    desiredImportQuantity,
  });
  args.facts.push(...tradeResult.facts);

  if (
    tradeResult.importedQuantity > 0 &&
    args.exportingRegionInventoryId &&
    args.importingRegionInventoryId
  ) {
    const settleResult = settleTradeFlow({
      exportingInventory: args.inventories[args.exportingRegionInventoryId]!,
      importingInventory: args.inventories[args.importingRegionInventoryId]!,
      goodId: args.goodId,
      desiredQuantity: tradeResult.importedQuantity,
    });
    args.inventories[args.exportingRegionInventoryId] = settleResult.exportingInventory;
    args.inventories[args.importingRegionInventoryId] = settleResult.importingInventory;
    args.facts.push(...settleResult.facts);
  }

  return tradeResult.connection;
}
