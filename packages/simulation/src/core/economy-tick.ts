import {
  createCompany,
  createInventory,
  createWorldState,
  isSettlementActive,
  type Company,
  type Connection,
  type Inventory,
  type Market,
  type PopulationCohort,
  type Region,
  type ResourceDeposit,
  type Settlement,
  type TechnologyState,
  type WorldState,
} from "@first-cause/entities";
import type { CausalFactor, FactInput } from "@first-cause/causality";
import type { ResourceDiscoveryRules } from "@first-cause/content";
import {
  directionalEdgeType,
  offsetCausalLinks,
  type PendingCausalLink,
} from "./causal-links.js";
import { advanceCalendarDate } from "./time.js";
import type { RngStream } from "./rng.js";
import { roundMoney, roundWageRate, transactionValue } from "./rounding.js";
import { groupCohortsIntoFamilies } from "../systems/population/cohorts.js";
import {
  splitMoney,
  SURVIVAL_GOOD_ID,
  SURVIVAL_UNITS_PER_CAPITA,
} from "../systems/population/household-budget.js";
import {
  addConsignment,
  consignmentOf,
  takeConsignment,
} from "../systems/economy/consignment.js";
import {
  liquidationSplit,
  operatingBuffer,
  ownerPayoutAmount,
  recordOperatingCosts,
  resolveOwnerRecipient,
  splitSurplus,
} from "../systems/economy/owner-income.js";
import {
  blendedUnitPrice,
  lotUnitPrice,
  plannedServiceEmployees,
  pruneLotPrices,
  SERVICE_DEMAND_KEY,
  serviceCapacity,
  withLandedPrice,
  type ServiceProviderProfile,
} from "../systems/economy/services.js";
import { applyMonthlyDemography } from "../systems/population/demography.js";
import { applyHouseholdConsumption } from "../systems/population/consumption.js";
import {
  computeMigrationAttraction,
  computeMigrationAttractionBreakdown,
  runMigrationPass,
} from "../systems/population/migration.js";
import {
  evaluateSettlementAbandonment,
  evaluateSettlementGrowth,
} from "../systems/society/settlements.js";
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
  regionAvailableWorkers,
  regionLaborForce,
  layoffWorkers,
  matchEmployment,
} from "../systems/economy/labor/employment.js";
import {
  adjustWageOffer,
  affordableEmployees,
  planWageBounds,
  type WageBounds,
} from "../systems/economy/labor/wages.js";
import { updateMarketGood } from "../systems/economy/markets/price-adjustment.js";
import { evaluateTradeFlow } from "../systems/economy/trade/flows.js";
import {
  DEFAULT_TRANSPORT_MODE_PROFILES,
  type TransportModeProfile,
} from "../systems/economy/transport/modes.js";
import { regenerateDeposit } from "../systems/resources/renewable.js";
import { usableDepositQuantity } from "../systems/resources/deposit-lifecycle.js";
import { evaluateNaturalDepositDiscovery } from "../systems/resources/natural-discovery.js";
import {
  assessFinancialHealth,
  decideLabor,
  decideLifecycle,
  decideProduction,
  EXPANSION_STEP_FRACTION,
  forecastDemand,
  INCREASE_BELOW_MONTHS,
  type PlanGoodMarket,
  evaluateFounding,
} from "../systems/economy/company-ai/index.js";
import { evaluatePmAdoption } from "../systems/economy/company-ai/pm-adoption.js";
import type { DecisionSnapshot } from "../systems/economy/company-ai/decision-snapshot.js";
import { accumulateRegionalKnowledge } from "../systems/technology/knowledge.js";
import {
  detectTierReached,
  evaluateBreakthroughs,
  updateEligibility,
  type DiscoveryEligibilityRule,
} from "../systems/technology/discoveries.js";
import { computeDiffusionPressure, growAvailability } from "../systems/technology/diffusion.js";
import {
  applyIndustryAdoption,
  applyPopulationAccess,
  isProductionMethodAvailable,
  type IndustryAdoptionEvent,
} from "../systems/technology/adoption.js";
import { tickArchitectInfluence } from "../systems/architect/influence.js";

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
 *
 * M12 (Entrepreneurship, AI-07) dodał krok 9: `company-ai/opportunity-
 * scanner.ts::evaluateFounding` per (region, `entrepreneurshipCandidates`
 * entry) -- nowe firmy powstają przez regionalny Opportunity Scan, nie
 * przez losowe spawnienie (AI-007). Domyślnie pusta mapa kandydatów =
 * zero nowych firm, dokładnie tak jak każdy caller sprzed M12 się
 * zachowywał -- pełna wsteczna zgodność, ten sam wzorzec co P0-06's
 * `productionRecipesByMethodId`.
 *
 * M13 (Migration, AI-09) dodał krok 9.5 (`Region.cached.
 * migrationAttraction`, wewnątrz pętli regionów -- świeże dane rynku
 * pracy/housing tego ticka) i krok 11 (`population/migration.
 * ts::runMigrationPass`, PO pętli regionów i handlu, żeby każdy region
 * miał już świeże `migrationAttraction`, nie tylko wcześniej przetworzone
 * w sortowanej kolejności). Wymaga własnego, wymaganego (jak
 * `demographyRng`) strumienia RNG "migration" -- nie ma tu bezpiecznego
 * "domyślnie brak", bo w przeciwieństwie do entrepreneurshipCandidates
 * migracja nie jest opcjonalną treścią, tylko rdzennym systemem M13.
 *
 * M14 (Settlements) dodał krok 12: `society/settlements.
 * ts::evaluateSettlementGrowth` per (region, settlement) -- SettlementPressure,
 * stage transitions (`SET-001` drabina Camp..Metropolis) i housing
 * (capacity/cost/pressure, `society/housing.ts`), ostatni krok przed
 * commitem, żeby widział w pełni rozliczoną populację tego ticka (po
 * migracji I demografii). `settlements` dołącza do mutowalnych map obok
 * `regions`/`companies`/itd. -- do M14 był to jedyny top-level rekord
 * WorldState przepuszczany przez `runEconomyTick` bez zmian.
 *
 * Etap 8 (audyt M12-M14, P0-06/P1-04) naprawił dwa problemy:
 *
 * - Kolejność faz była niekanoniczna (CD SIM-003): Resources/Demography
 *   (fazy #2/#3) wykonywały się PO Production/Trade/Migration (dawne kroki
 *   7-10), więc ten tick's produkcja, founding i migracja operowały na
 *   populacji i zasobach SPRZED tegomiesięcznej demografii/regeneracji.
 *   Regeneracja zasobów i demografia są teraz krokami 1-2, PRZED pętlą
 *   regionów -- reszta pipeline'u (kroki 3-12) nie zmieniła swojej
 *   WEWNĘTRZNEJ względnej kolejności, tylko numerację (dawne 1-7.5 -> 3-9.5,
 *   dawne 7/8/9/10/10.5/11 -> 10/11/1/2/11.5/12). To NIE jest pełne 23-fazowe
 *   SIM-003 (Production Planning/Production/Inventory/itd. pozostają
 *   zespolone w jeden krok "Company AI", tak jak audyt to świadomie
 *   dopuszcza -- "nie chodzi o brak frameworka z 23 klasami").
 * - `World.currentTick`/`currentDate` nigdy nie były aktualizowane --
 *   `WorldRunner.tick` szedł do przodu, ale `WorldSummaryReadModel` (i
 *   każdy inny czytelnik `World`) widział zawsze stan startowy (dwa
 *   niespójne źródła czasu). VALIDATE -> COMMIT niżej przesuwa teraz
 *   `currentDate` o jeden miesiąc (`core/time.ts::advanceCalendarDate`,
 *   SIM-001) i `currentTick` na `tick + 1`.
 */

const EMPLOYEES_PER_CAPACITY_UNIT = 1; // TODO tuning -- most z decyzji produkcyjnej (capacity*utilization) do docelowego zatrudnienia; żaden system tego nie liczy (AI-04 zakłada gotowy target)
const TARGET_FINISHED_GOOD_BUFFER = 5; // TODO tuning -- ile jednostek gotowego dobra firma trzyma jako bufor przed sprzedażą (settleProductionSale)
const EXPANSION_CAPITAL_COST = 100; // TODO tuning -- decideLifecycle wymaga jakiegoś kosztu ekspansji; content/finance model to nie ten etap
const DEFAULT_TRANSPORT_MODE_ID = "cart"; // TODO tuning -- fallback gdy connection.infrastructure.transportModes jest puste/niedopasowane

/**
 * M12 (AI-07 Entrepreneurship): jedna para (`CompanyArchetype`,
 * `ProductionMethod`) rozważana przez `evaluateFounding` w każdym
 * regionie. `capitalRequirement` to `CompanyArchetypeDefinition.
 * capitalRequirement` (M2) wprost, bez transformacji.
 */
type OwnerPayoutTarget = NonNullable<ReturnType<typeof resolveOwnerRecipient>>;
interface ImportOrders {
  unmetNeed: number;
  funds: number;
}

export interface EntrepreneurshipCandidate {
  readonly archetypeId: string;
  readonly productionMethodId: string;
  readonly capitalRequirement: number;
}

export interface RunEconomyTickInput {
  readonly worldState: WorldState;
  readonly tick: number;
  /** Demografia (M6) potrzebuje losowości -- `HeadlessRunner.rngStream("demography", scopeId)` albo dowolne inne źródło o tym samym kształcie (SAVE-003: nazwany, scope'owany strumień). */
  readonly demographyRng: (scopeId: string) => RngStream;
  /** M13: analogicznie dla migracji -- `HeadlessRunner.rngStream("migration", scopeId)`, scope'owany per źródłowa kohorta. */
  readonly migrationRng: (scopeId: string) => RngStream;
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
  /** M12: kandydaci Opportunity Scannera, keyed by `archetypeId`. Domyślnie `{}` -- brak kandydatów, więc żadna firma nigdy się nie zakłada (pełna wsteczna zgodność dla każdego caller'a sprzed M12). */
  readonly entrepreneurshipCandidatesByArchetypeId?: Readonly<
    Record<string, EntrepreneurshipCandidate>
  >;
  /**
   * M15: `HeadlessRunner.rngStream("discovery", scopeId)` -- zarezerwowany,
   * dotąd nieużywany nazwany strumień "discovery" (SAVE-003). Undefined
   * oznacza, że Technology jest wyłączone dla tego wywołania (pełna
   * wsteczna zgodność dla każdego caller'a sprzed M15): akumulacja
   * wiedzy, eligibility, breakthroughs, dyfuzja i population access w
   * całości pomijane, `technologyStates` przechodzi bez zmian.
   */
  readonly discoveryRng?: (scopeId: string) => RngStream;
  /** M15: `content/discoveries/*.json`, sparsowane do natywnych reguł symulacji przez `worldgen`. Domyślnie `{}`. */
  readonly discoveryEligibilityRulesById?: Readonly<Record<string, DiscoveryEligibilityRule>>;
  /** M15: id `content/knowledgeDomains/*.json` -- które domeny akumulują wiedzę co tick. Domyślnie `[]`. */
  readonly knowledgeDomainIds?: readonly string[];
  /**
   * M15: `productionMethodId` -> id odkryć, których wymaga
   * (`ProductionMethodDefinition.discoveries`, M2) -- gate'uje, którzy
   * kandydaci PM w ogóle trafiają do AI-08 (`evaluatePmAdoptionSafely`).
   * Pusta lista (każda production method dziś) oznacza brak gate'owania.
   * Domyślnie `{}`.
   */
  readonly requiredDiscoveryIdsByMethodId?: Readonly<Record<string, readonly string[]>>;
  /**
   * D3 (Canonical Decisions TECH-012): `resource.id` ->
   * `ResourceDefinition.discoveryRules` z contentu. Brak wpisu = zasób nie
   * jest odkrywany naturalnie. Domyślnie `{}` (naturalne odkrywanie
   * wyłączone -- wsteczna zgodność).
   */
  readonly resourceDiscoveryRulesByResourceId?: Readonly<
    Record<string, ResourceDiscoveryRules>
  >;
  /**
   * M17 (CE-07): `"${entityType}:${entityId}:${type}" -> najnowszy fact
   * id`, narastająco budowane przez `WorldRunner` z KAŻDEGO ticka (nie
   * tylko tego, jeszcze niewyemitowanego) -- pozwala systemom cytować
   * realny, cross-tickowy fakt (np. Root Fact interwencji Architekta,
   * `discovery_became_available`) jako `{kind: "priorFact"}` źródło,
   * zamiast zawsze `external`. Klucz MUSI zawierać `type` (nie tylko
   * encję) -- inaczej "najnowszy fakt tej encji" po cichu wskazuje na
   * jakiś PÓŹNIEJSZY, niezwiązany typ faktu tej samej encji (np.
   * `technology_adoption_increased` nadpisujący `discovery_became_
   * available`). Bez tego Architect Influence (CE-07, Test 4 Butterfly
   * Effect) nigdy nie miałby żadnej realnej krawędzi do propagacji przez
   * zwykłe ticki -- domyślnie `{}` (pełna wsteczna zgodność dla każdego
   * caller'a, który tego nie poda).
   */
  readonly priorFactIndex?: Readonly<Record<string, string>>;
  /**
   * Etap 4B (2026-10-01, Canonical §52L): usługodawcy z contentu
   * (`companyArchetype.serviceIds` → `ServiceDefinition`), kluczowani po
   * `archetypeId`. Bez profilu transportu handel działa jak przed 4B (bez
   * przewoźnika i opłaty), bez profilu budowy -- rozbudowa jak przed 4B
   * (koszt bez odbiorcy); dotyczy tylko konfiguracji bez contentu (scenariusze
   * testowe), gra ładuje oba profile.
   */
  readonly serviceProvidersByArchetypeId?: Readonly<Record<string, ServiceProviderProfile>>;
}

export interface RunEconomyTickResult {
  readonly worldState: WorldState;
  readonly facts: readonly FactInput[];
  /** M17 (CE-04..CE-07): rozwiązywane na realne `CausalEdge` przez `core/causal-resolution.ts`, wołane z `WorldRunner.step()`, gdy `facts` ma już realne, przydzielone przez store id. */
  readonly causalLinks: readonly PendingCausalLink[];
}

/** Średnia z ostatnich `DEMAND_SMOOTHING_MONTHS` cen towaru (historia rynku); bez historii -- bieżąca cena, bez towaru -- 0. */
function smoothedPrice(market: Market, goodId: string): number {
  const history = market.history.rollingPrice[goodId];
  const forecast = forecastDemand(history);
  return forecast ?? market.goods[goodId]?.localPrice ?? 0;
}

/**
 * N3: rynek per towar oczami każdej aktywnej firmy regionu (`PlanGoodMarket`).
 * Zapas = magazyn regionu + zapasy firm ponad ich bufor (towar jest albo tu,
 * albo tu -- bez podwójnego liczenia; bufor nie jest wystawiony na sprzedaż). Udział firmy w towarze = jej sprzedaż z poprzedniego
 * miesiąca (`finance.revenue`) wśród producentów tego towaru; firma bez
 * sprzedaży (nowa albo bezczynna) -- według potencjału mocy (capacity ×
 * wyjście × cena), także obok konkurentów ze sprzedażą.
 * Region bez rynku: brak wpisów (plan nie powstaje -- brak danych).
 */
function buildPlanGoodMarkets(args: {
  readonly market: Market | undefined;
  readonly regionInventory: Inventory | undefined;
  readonly companies: readonly Company[];
  readonly inventories: Readonly<Record<string, Inventory>>;
  readonly productionRecipesByMethodId: Readonly<Record<string, ProductionRecipe>>;
}): Map<string, Record<string, PlanGoodMarket>> {
  const result = new Map<string, Record<string, PlanGoodMarket>>();
  const { market } = args;
  if (!market) return result;
  const recipeOf = (c: Company) =>
    c.production.productionMethodId
      ? args.productionRecipesByMethodId[c.production.productionMethodId]
      : undefined;
  const goodIds = new Set<string>();
  for (const c of args.companies) {
    const recipe = recipeOf(c);
    if (!recipe) continue;
    for (const g of Object.keys(recipe.goodOutputsPerBatch)) goodIds.add(g);
    for (const g of Object.keys(recipe.goodInputsPerBatch)) goodIds.add(g);
  }
  const view = new Map<string, { price: number; forecast: number | undefined; stock: number }>();
  for (const goodId of [...goodIds].sort()) {
    const good = market.goods[goodId];
    if (!good) continue;
    // Zapas DOSTĘPNY do sprzedaży: magazyn regionu + to, co firmy mają ponad
    // własny bufor (bufora firma nie wystawia -- `settleProductionSale`).
    // Wcześniej liczone całe stany firm: bufory bezczynnych firm (po 5 jedn.)
    // udawały zapas, którego nikt nie mógł kupić, i blokowały wzrost przy
    // pustym magazynie (diagnoza etapu 2, seed-delta).
    const stock =
      (args.regionInventory?.items[goodId]?.quantity ?? 0) +
      args.companies.reduce(
        (sum, c) =>
          sum +
          Math.max(
            0,
            (args.inventories[c.inventoryId]?.items[goodId]?.quantity ?? 0) -
              TARGET_FINISHED_GOOD_BUFFER,
          ),
        0,
      );
    view.set(goodId, {
      price: good.localPrice,
      forecast: forecastDemand(market.history.rollingDemand[goodId]),
      stock,
    });
  }
  const weights = new Map<string, Map<string, number>>();
  for (const [goodId, v] of view) {
    const producers = args.companies.filter(
      (c) => (recipeOf(c)?.goodOutputsPerBatch[goodId] ?? 0) > 0,
    );
    const w = new Map<string, number>();
    for (const c of producers) {
      const potential =
        c.production.capacity * (recipeOf(c)!.goodOutputsPerBatch[goodId] ?? 0) * v.price;
      w.set(c.id, c.finance.revenue > 0 ? c.finance.revenue : potential);
    }
    weights.set(goodId, w);
  }
  for (const c of args.companies) {
    const goods: Record<string, PlanGoodMarket> = {};
    for (const [goodId, v] of view) {
      const w = weights.get(goodId)!;
      const total = [...w.values()].reduce((a, b) => a + b, 0);
      const own = w.get(c.id);
      const share =
        own === undefined ? 0 : total > 0 ? own / total : 1 / Math.max(1, w.size);
      goods[goodId] = {
        price: v.price,
        forecastDemand: v.forecast,
        totalStock: v.stock,
        share,
      };
    }
    result.set(c.id, goods);
  }
  return result;
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
    // D2 (TECH-010): nieznane złoże nie wnosi żadnej informacji do decyzji produkcji.
    const stock = usableDepositQuantity(depositsByResourceId[resourceId]);
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

/** M15: drugi koniec każdego z połączeń `region` -- lista sąsiadów dla `technology/diffusion`. */
function connectedRegionIds(
  region: Region,
  connections: Readonly<Record<string, Connection>>,
): string[] {
  const neighborIds: string[] = [];
  for (const connectionId of region.connections.connectionIds) {
    const connection = connections[connectionId];
    if (!connection) continue;
    neighborIds.push(
      connection.regionAId === region.id ? connection.regionBId : connection.regionAId,
    );
  }
  return neighborIds;
}

export function runEconomyTick(input: RunEconomyTickInput): RunEconomyTickResult {
  const { worldState, tick, demographyRng, migrationRng } = input;
  const pmCandidates = input.pmCandidatesByCurrentMethodId ?? {};
  const productionRecipesByMethodId =
    input.productionRecipesByMethodId ?? DEFAULT_PRODUCTION_RECIPES;
  const transportModeProfilesByModeId =
    input.transportModeProfilesByModeId ?? DEFAULT_TRANSPORT_MODE_PROFILES;
  const entrepreneurshipCandidatesByArchetypeId =
    input.entrepreneurshipCandidatesByArchetypeId ?? {};
  const discoveryRng = input.discoveryRng;
  const discoveryEligibilityRulesById = input.discoveryEligibilityRulesById ?? {};
  const knowledgeDomainIds = input.knowledgeDomainIds ?? [];
  const requiredDiscoveryIdsByMethodId = input.requiredDiscoveryIdsByMethodId ?? {};
  const resourceDiscoveryRulesByResourceId = input.resourceDiscoveryRulesByResourceId ?? {};
  const priorFactIndex = input.priorFactIndex ?? {};

  const regions: Record<string, Region> = { ...worldState.regions };
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
  const settlements: Record<string, Settlement> = { ...worldState.settlements };
  const technologyStates: Record<string, TechnologyState> = {
    ...worldState.technologyStates,
  };
  const facts: FactInput[] = [];
  const causalLinks: PendingCausalLink[] = [];
  const migrationAttractionBreakdownByRegionId: Record<string, readonly CausalFactor[]> = {};
  // CE-06 (M17, Test 9): `discoveryId -> outer fact index` per region,
  // dla `discovery_became_available` -- krok 3's PM adoption (poniżej)
  // linkuje do TEGO, nigdy bezpośrednio do `discovery_occurred`.
  const availableFactIndexByRegionAndDiscovery: Record<string, Record<string, number>> = {};

  const regionIds = Object.keys(worldState.regions).sort();
  // Etap 2 (N6 min.): wpłaty kupujących dla firm (także z innych regionów) i
  // koszty płac -- finanse firm rozliczane po pętli regionów.
  const salesRevenueByCompanyId: Record<string, number> = {};
  // P14: niezrealizowane, finansowo pokryte zamówienia gospodarstw per
  // `${marketId}:${goodId}` (krok 7b) -- zmniejszane przez faktyczny import
  // (krok 10), żeby to samo zamówienie nie było liczone dwa razy.
  const importOrdersByMarketGood: Record<string, ImportOrders> = {};
  const laborCostByCompanyId: Record<string, number> = {};
  // Dochód właścicielski: zobowiązania najbliższego ticka z bieżącego planu
  // (płaca × pracownicy po decyzji o zatrudnieniu tego ticka).
  const nextTickObligationsByCompanyId: Record<string, number> = {};
  // Etap 4B (Canonical §52L): usługodawcy. Zdolność usługi w tym ticku =
  // pracownicy po decyzji o zatrudnieniu w tym ticku × wydajność (ustawiana w
  // pętli firm; tu wartość startowa); zużywana przez przewozy i budowy.
  const serviceProviders = input.serviceProvidersByArchetypeId ?? {};
  const providerOf = (company: Company): ServiceProviderProfile | undefined =>
    serviceProviders[company.archetypeId];
  const transportServiceEnabled = Object.values(serviceProviders).some(
    (p) => p.kind === "transport",
  );
  const constructionProfile = Object.values(serviceProviders)
    .filter((p) => p.kind === "construction")
    .sort((a, b) => a.archetypeId.localeCompare(b.archetypeId))[0];
  const serviceCapacityRemaining: Record<string, number> = {};
  for (const company of Object.values(worldState.companies)) {
    const profile = providerOf(company);
    if (profile) serviceCapacityRemaining[company.id] = serviceCapacity(company, profile);
  }
  /** Zgłoszony w tym ticku popyt na usługę (jednostki) -- plan zatrudnienia usługodawcy w następnym. */
  const serviceDemandByCompanyId: Record<string, number> = {};
  /** Opłaty za przewóz należne od właścicieli towaru (koszt operacyjny, rozliczany w finansach). */
  const transportCostByCompanyId: Record<string, number> = {};
  /** Region z planem rozbudowy gotowym do opłacenia, ale bez firmy budowlanej (sygnał założenia). */
  const constructionRequestsByRegion: Record<string, boolean> = {};

  // 1. Regeneracja odnawialnych zasobów (M5, już istniejący system): bez
  // tego wywołania każdy `renewable: true` depozyt tylko by się wyczerpywał
  // -- `extractFromDeposit` nigdy nie dodaje zasobu z powrotem, regenerację
  // wykonuje wyłącznie ten oddzielny system. Audytowe P0-06: musi iść
  // PRZED produkcją/foundingiem (CD SIM-003, fazy "Resources" #2 przed
  // "Production Planning"/"Production" #4/#5) -- inaczej ten tick's
  // decyzje i ekstrakcja widziałyby stan zasobów sprzed regeneracji.
  for (const depositId of Object.keys(resourceDeposits).sort()) {
    const regenResult = regenerateDeposit(resourceDeposits[depositId]!);
    resourceDeposits[depositId] = regenResult.deposit;
    facts.push(...regenResult.facts);
  }

  // 2. Demografia (M6): populacja ewoluuje; `applyMonthlyDemography` samo
  // uzgadnia teraz zatrudnienie kohort z `eligibleLaborForce` po spadku
  // populacji (audytowe P0-04 z audytu M7-M11 / P0-05 z audytu M12-M14,
  // patrz demography.ts). Company.workforce.employees NIE jest tu
  // korygowane -- to osobny krok 11.5 niżej. Audytowe P0-06: musi iść
  // PRZED produkcją/migracją tego samego ticka (CD SIM-003, faza
  // "Demography" #3 przed "Production Planning" #4 i długo przed
  // "Migration" #15) -- inaczej produkcja i migracja operują na
  // populacji sprzed demografii danego miesiąca (audytowa reprodukcja:
  // stary porządek liczył ekonomię tego ticka na populacji poprzedniego
  // miesiąca).
  {
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
      {
        const baseIndex = facts.length;
        facts.push(...demographyResult.facts);
        causalLinks.push(...offsetCausalLinks(demographyResult.causalLinks, baseIndex));
      }
    }
    populationCohorts = nextCohorts;
  }

  // 2.5 Technology (M15, `technology/knowledge|discoveries|diffusion`):
  // regionalna wiedza -> eligibility -> breakthroughs (Known) -> wzrost
  // availability napędzany dyfuzją (Available) -> population access.
  // Musi iść PRZED krokiem 3 (Company AI), który gate'uje kandydatów PM
  // świeżo zaktualizowanym w tym ticku `technologyStates`.
  // `discoveryRng === undefined` = Technology wyłączone (pełna wsteczna
  // zgodność, ten sam wzorzec co domyślne `{}` dla
  // `pmCandidatesByCurrentMethodId` oznaczające "brak kandydatów AI-08").
  if (discoveryRng) {
    // Stabilny snapshot sprzed ticka, kluczowany po regionie (nie po
    // TechnologyState.id) -- `technology/diffusion` czyta stan INNYCH
    // regionów sprzed startu tego ticka, ten sam idiom "czytaj
    // worldState, pisz do świeżej kopii", którego krok 10's pętla handlu
    // używa dla `worldState.regions`.
    const technologyStateByRegionId: Record<string, TechnologyState> = {};
    for (const otherRegionId of regionIds) {
      const otherTechnologyStateId =
        worldState.regions[otherRegionId]?.knowledge.technologyStateId;
      const otherTechnologyState = otherTechnologyStateId
        ? worldState.technologyStates[otherTechnologyStateId]
        : undefined;
      if (otherTechnologyState) technologyStateByRegionId[otherRegionId] = otherTechnologyState;
    }

    for (const regionId of regionIds) {
      const region = regions[regionId]!;
      const technologyStateId = region.knowledge.technologyStateId;
      if (!technologyStateId) continue;
      let technologyState = technologyStates[technologyStateId];
      if (!technologyState) continue;
      // Decyzja właściciela 2026-09-26: każdy region ma TechnologyState, ale
      // region bez populacji ma stan nieaktywny -- nie ma kto tworzyć wiedzy
      // ani dokonywać odkryć (także T0 o progu 0). Stan wraca do gry, gdy
      // region zostanie zasiedlony (np. migracją). Strumień RNG regionu nie
      // jest wtedy ruszany, więc inne regiony pozostają deterministyczne.
      if (region.population.totalPopulation <= 0) continue;

      const rng = discoveryRng(regionId);

      // CE-06 (M17): łańcuch knowledge -> eligible -> occurred ->
      // available/diffused jest z natury sekwencją tego samego ticka --
      // każdy krok linkuje do faktu POPRZEDNIEGO kroku przez `sameBatch`
      // (indeksy w OUTER `facts`, śledzone tu w miejscu, bo tylko
      // orchestrator zna oba końce). Test 9 (§97): `technology_adoption_
      // increased` (adoption.ts, poniżej) MUSI linkować do `discovery_
      // became_available`, NIGDY bezpośrednio do `discovery_occurred`.
      const knowledgeFactIndexByDomainId: Record<string, number> = {};
      const knowledgeResult = accumulateRegionalKnowledge({
        technologyState,
        domainIds: knowledgeDomainIds,
        population: region.population.totalPopulation,
        rng,
      });
      technologyState = knowledgeResult.technologyState;
      for (const fact of knowledgeResult.facts) {
        facts.push(fact);
        knowledgeFactIndexByDomainId[fact.subject.entityId] = facts.length - 1;
      }

      const eligibilityResult = updateEligibility(
        technologyState,
        discoveryEligibilityRulesById,
      );
      technologyState = eligibilityResult.technologyState;
      const eligibleFactIndexByDiscoveryId: Record<string, number> = {};
      for (const fact of eligibilityResult.facts) {
        facts.push(fact);
        const discoveryId = fact.subject.entityId;
        eligibleFactIndexByDiscoveryId[discoveryId] = facts.length - 1;
        const primaryDomainId = discoveryEligibilityRulesById[discoveryId]?.primaryDomainId;
        const knowledgeIndex =
          primaryDomainId !== undefined
            ? knowledgeFactIndexByDomainId[primaryDomainId]
            : undefined;
        // CE-06/CE-07: `knowledge_increased` może pochodzić z TEGO ticka
        // (`sameBatch`) albo z wcześniejszego -- naturalnej akumulacji
        // ALBO Architect `knowledge_injection` (ten sam typ/subject faktu,
        // patrz `interventions.ts`) -- `priorFactIndex` jako fallback,
        // żeby Root Fact interwencji mógł realnie zasilić eligibility.
        const priorKnowledgeFactId =
          primaryDomainId !== undefined
            ? priorFactIndex[`knowledge_domain:${primaryDomainId}:knowledge_increased`]
            : undefined;
        causalLinks.push({
          targetIndex: facts.length - 1,
          source:
            knowledgeIndex !== undefined
              ? { kind: "sameBatch", index: knowledgeIndex }
              : priorKnowledgeFactId !== undefined
                ? { kind: "priorFact", factId: priorKnowledgeFactId }
                : { kind: "external", key: `knowledge_domain:${primaryDomainId}` },
          type: "ENABLING",
          factor: { key: "knowledge_threshold", contribution: 1 },
          mechanism: "wiedza regionu przekroczyła próg tieru tego odkrycia",
          system: "technology-discoveries",
        });
      }

      const diffusionSignals = computeDiffusionPressure(
        regionId,
        connectedRegionIds(region, connections),
        technologyStateByRegionId,
        Object.keys(discoveryEligibilityRulesById),
      );
      const diffusionPressureByDiscoveryId = Object.fromEntries(
        Object.entries(diffusionSignals).map(([id, signal]) => [id, signal.pressure]),
      );

      const breakthroughResult = evaluateBreakthroughs({
        technologyState,
        regionId,
        tick,
        rng,
        diffusionPressureByDiscoveryId,
      });
      technologyState = breakthroughResult.technologyState;
      const occurredFactIndexByDiscoveryId: Record<string, number> = {};
      for (const fact of breakthroughResult.facts) {
        facts.push(fact);
        const discoveryId = fact.subject.entityId;
        occurredFactIndexByDiscoveryId[discoveryId] = facts.length - 1;
        const eligibleIndex = eligibleFactIndexByDiscoveryId[discoveryId];
        causalLinks.push({
          targetIndex: facts.length - 1,
          source:
            eligibleIndex !== undefined
              ? { kind: "sameBatch", index: eligibleIndex }
              : { kind: "external", key: `discovery:${discoveryId}:eligible` },
          type: "TRIGGERING",
          factor: { key: "eligibility", contribution: 1 },
          mechanism: "odkrycie było eligible, gdy zaszedł breakthrough (seeded probability)",
          system: "technology-discoveries",
        });
        const pressure = diffusionPressureByDiscoveryId[discoveryId] ?? 0;
        if (pressure > 0) {
          causalLinks.push({
            targetIndex: facts.length - 1,
            source: { kind: "external", key: `discovery:${discoveryId}:diffusion_pressure` },
            type: "AMPLIFYING",
            factor: { key: "diffusion_pressure", contribution: pressure },
            mechanism: "presja dyfuzji z połączonych regionów podniosła szansę breakthroughu",
            system: "technology-discoveries",
          });
        }
      }

      const technologyStateBeforeAvailability = technologyState;
      const availabilityResult = growAvailability(technologyState, diffusionSignals);
      technologyState = availabilityResult.technologyState;
      const availableFactIndexByDiscoveryId: Record<string, number> = {};
      for (const fact of availabilityResult.facts) {
        facts.push(fact);
        const discoveryId = fact.subject.entityId;
        if (fact.type === "discovery_diffused") {
          causalLinks.push({
            targetIndex: facts.length - 1,
            source: {
              kind: "external",
              key: `discovery:${discoveryId}:neighbor_diffusion_pressure`,
            },
            type: "AMPLIFYING",
            factor: { key: "diffusion_pressure", contribution: 1 },
            mechanism: "presja dyfuzji z połączonych regionów zwiększyła availability",
            system: "technology-diffusion",
          });
          continue;
        }
        if (fact.type !== "discovery_became_available") continue;
        availableFactIndexByDiscoveryId[discoveryId] = facts.length - 1;
        const occurredIndex = occurredFactIndexByDiscoveryId[discoveryId];
        causalLinks.push({
          targetIndex: facts.length - 1,
          source:
            occurredIndex !== undefined
              ? { kind: "sameBatch", index: occurredIndex }
              : { kind: "external", key: `discovery:${discoveryId}:occurred` },
          type: "DIRECT",
          factor: { key: "known_discovery", contribution: 1 },
          mechanism: "odkrycie znane (KNOWN) w regionie źródłowym rozprzestrzenia się jako dostępne",
          system: "technology-diffusion",
        });
      }
      availableFactIndexByRegionAndDiscovery[regionId] = availableFactIndexByDiscoveryId;

      // Region wchodzi w nowy tier (decyzja właściciela 2026-09-26): skutek
      // udostępnienia odkrycia z wyższego tieru w TYM ticku.
      const tierFact = detectTierReached(
        technologyStateBeforeAvailability,
        technologyState,
        discoveryEligibilityRulesById,
      );
      if (tierFact) {
        facts.push(tierFact);
        const enablingDiscoveryId = Object.keys(availableFactIndexByDiscoveryId)
          .sort()
          .find(
            (discoveryId) =>
              discoveryEligibilityRulesById[discoveryId]?.tier === tierFact.values.after,
          );
        causalLinks.push({
          targetIndex: facts.length - 1,
          source:
            enablingDiscoveryId !== undefined
              ? { kind: "sameBatch", index: availableFactIndexByDiscoveryId[enablingDiscoveryId]! }
              : { kind: "external", key: `region:${regionId}:technology_tier` },
          type: "DIRECT",
          factor: { key: "tier_discovery_available", contribution: 1 },
          mechanism: "odkrycie z wyższego tieru stało się dostępne w regionie",
          system: "technology-diffusion",
        });
      }

      const populationAccessResult = applyPopulationAccess(technologyState);
      technologyState = populationAccessResult.technologyState;
      for (const fact of populationAccessResult.facts) {
        facts.push(fact);
        const discoveryId = fact.subject.entityId;
        const availableIndex = availableFactIndexByDiscoveryId[discoveryId];
        causalLinks.push({
          targetIndex: facts.length - 1,
          source:
            availableIndex !== undefined
              ? { kind: "sameBatch", index: availableIndex }
              : { kind: "external", key: `discovery:${discoveryId}:available` },
          type: "STRUCTURAL",
          factor: { key: "population_access_growth", contribution: 1 },
          mechanism: "odkrycie dostępne/przyjęte -- populacja stopniowo zyskuje do niego dostęp",
          system: "technology-adoption",
        });
      }

      technologyStates[technologyStateId] = technologyState;
    }
  }

  // 2.6 Naturalne odkrywanie złóż (D3, Canonical Decisions TECH-012):
  // PO technologii (świeże `technologyStates` tego ticka), PRZED Company
  // AI (krok 3) -- złoże potwierdzone w tym ticku gospodarka może ocenić
  // od razu, ale nigdy wcześniej niż jest DISCOVERED (TECH-010). Pusty
  // region sam nie odkrywa (TECH-011). Deterministycznie, bez RNG.
  if (Object.keys(resourceDiscoveryRulesByResourceId).length > 0) {
    for (const regionId of regionIds) {
      const region = regions[regionId]!;
      if (region.population.totalPopulation <= 0) continue;
      const technologyStateId = region.knowledge.technologyStateId;
      const technologyState = technologyStateId
        ? technologyStates[technologyStateId]
        : undefined;
      if (!technologyState) continue;

      for (const depositId of [...region.resources.depositIds].sort()) {
        const deposit = resourceDeposits[depositId];
        if (!deposit) continue;
        const rules = resourceDiscoveryRulesByResourceId[deposit.resourceDefinitionId];
        if (!rules) continue;
        const result = evaluateNaturalDepositDiscovery({
          deposit,
          rules,
          technologyState,
          tick,
        });
        if (result.facts.length === 0) continue;
        resourceDeposits[depositId] = result.deposit;

        const baseIndex = facts.length;
        facts.push(...result.facts);
        causalLinks.push(...offsetCausalLinks(result.causalLinks, baseIndex));
        result.enablingDiscoveryIds.forEach((discoveryId, offset) => {
          const availableIndex =
            availableFactIndexByRegionAndDiscovery[regionId]?.[discoveryId];
          const priorAvailableFactId =
            priorFactIndex[`discovery:${discoveryId}:discovery_became_available`];
          causalLinks.push({
            targetIndex: baseIndex + offset,
            source:
              availableIndex !== undefined
                ? { kind: "sameBatch", index: availableIndex }
                : priorAvailableFactId !== undefined
                  ? { kind: "priorFact", factId: priorAvailableFactId }
                  : { kind: "external", key: `discovery:${discoveryId}:available` },
            type: "ENABLING",
            factor: { key: `discovery:${discoveryId}`, contribution: 1 },
            mechanism:
              "technologia regionu pozwala rozpoznać złoże o tej głębokości (ResourceDefinition.discoveryRules)",
            system: "resource-discovery",
          });
        });
      }
    }
  }

  for (const regionId of regionIds) {
    let region = regions[regionId]!;
    const marketId = region.economy.marketId;
    const regionInventoryId = region.economy.regionalInventoryId;
    // Etap 4B: usługodawcy najpierw -- ich zdolność w tym ticku (pracownicy po
    // decyzji o zatrudnieniu) musi być znana, zanim klienci zamówią usługę.
    const companyIds = [...region.economy.companyIds].sort((a, b) => {
      const providerA = worldState.companies[a] && providerOf(worldState.companies[a]) ? 0 : 1;
      const providerB = worldState.companies[b] && providerOf(worldState.companies[b]) ? 0 : 1;
      return providerA - providerB || a.localeCompare(b);
    });
    const cohortIds = [...region.population.cohortIds].sort();

    const depositIdByResource = new Map<string, string>();
    for (const depositId of region.resources.depositIds) {
      const deposit = resourceDeposits[depositId];
      if (deposit) depositIdByResource.set(deposit.resourceDefinitionId, depositId);
    }

    const supplyByGood: Record<string, number> = {};
    const companyDemandByGood: Record<string, number> = {};
    const householdDemandByGood: Record<string, number> = {};
    const industryAdoptionEvents: IndustryAdoptionEvent[] = [];
    // CE-06 (M17, Test 9): `discoveryId -> outer fact index` faktu
    // `production_method_adopted`, który wygenerował ten event -- krok
    // "Zastosuj industry adoption" (poniżej) linkuje `technology_
    // adoption_increased` do TEGO, nie do samego `discovery_occurred`.
    const productionMethodAdoptedFactIndexByDiscoveryId: Record<string, number> = {};
    // N4: zapotrzebowanie na pracę ponad dostępnych bezrobotnych regionu.
    let unmetLaborNeed = 0;
    // Etap 2: płace wypłacone w tym ticku przez firmy regionu (do gospodarstw).
    let regionWageBill = 0;

    // N3 (etap 1 naprawy po diagnozie Black Mountain, 2026-10-01): rynek per
    // towar dla planów firm -- prognoza popytu (historia rynku), zapas regionu
    // + bufory firm (bez podwójnego liczenia) i udział każdej firmy (sprzedaż
    // z poprzedniego miesiąca; nowa firma -- według mocy). Stan z początku ticka.
    const planGoodsByCompanyId = buildPlanGoodMarkets({
      market: marketId ? markets[marketId] : undefined,
      regionInventory: regionInventoryId ? inventories[regionInventoryId] : undefined,
      companies: companyIds.map((id) => companies[id]!).filter((c) => c.status.active),
      inventories,
      productionRecipesByMethodId,
    });
    // N4: lokalny miesięczny koszt koszyka przetrwania jednej osoby (wygładzona cena).
    const survivalBasketCost = marketId
      ? SURVIVAL_UNITS_PER_CAPITA * smoothedPrice(markets[marketId]!, SURVIVAL_GOOD_ID)
      : 0;

    // N1 (diagnoza Black Mountain 2026-10-01, P6): zamknięta firma zwalnia
    // WSZYSTKICH pracowników -- wcześniej zachowywała `employees`, a kohorty
    // `employment` i dochód, więc ludzie „pracowali” dla nieistniejącej firmy
    // (zawyżony popyt, pomniejszona siła robocza). Ten sam mechanizm co
    // zwykły layoff (`layoffWorkers`, kohorty w kolejności id); nadwyżka bez
    // pokrycia w kohortach (zatrudnienie kohorty zmalało wcześniej przez
    // demografię/migrację) po prostu znika -- tych ludzi już nie ma.
    const releaseClosedCompanyWorkers = (closed: Company): Company => {
      let next = closed;
      for (const cohortId of cohortIds) {
        if (next.workforce.employees <= 0) break;
        const cohort = populationCohorts[cohortId]!;
        const count = Math.min(next.workforce.employees, cohort.employment);
        if (count <= 0) continue;
        const layoffResult = layoffWorkers({ company: next, cohort, count });
        next = layoffResult.company;
        populationCohorts[cohortId] = layoffResult.cohort;
        const baseIndex = facts.length;
        facts.push(...layoffResult.facts);
        causalLinks.push(...offsetCausalLinks(layoffResult.causalLinks, baseIndex));
      }
      return { ...next, workforce: { ...next.workforce, employees: 0, vacancies: 0 } };
    };

    for (const companyId of companyIds) {
      let company = companies[companyId]!;
      if (!company.status.active) {
        // Firma zamknięta wcześniej (np. stary zapis) z pracownikami: zwolnij.
        if (company.workforce.employees > 0 || company.workforce.vacancies > 0)
          companies[companyId] = releaseClosedCompanyWorkers(company);
        continue;
      }

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

      // 3. Company AI: OBSERVE (ostatni tick) -> DECIDE.
      const financialHealth = assessFinancialHealth(company);

      const depositsForRecipe: Record<string, ResourceDeposit> = {};
      if (recipe) {
        for (const resourceId of Object.keys(recipe.resourceInputsPerBatch)) {
          const depositId = depositIdByResource.get(resourceId);
          if (depositId) depositsForRecipe[resourceId] = resourceDeposits[depositId]!;
        }
      }

      const companyInventoryBeforeDecision = inventories[company.inventoryId]!;
      const inputAvailability = recipe
        ? computeInputAvailability(
            recipe,
            companyInventoryBeforeDecision,
            depositsForRecipe,
          )
        : 1;

      // N4: ilu ludzi firma może mieć -- obecni + dostępni bezrobotni regionu.
      const regionAvailableNow = regionAvailableWorkers(
        cohortIds.map((cohortId) => populationCohorts[cohortId]!),
      );
      // N3: plan produkcji (możliwa sprzedaż − wejścia − płace, pokrycie zapasem),
      // tylko w granicach osiągalnych pracowników.
      const productionDecision = recipe
        ? decideProduction({
            company,
            recipe,
            goods: planGoodsByCompanyId.get(company.id) ?? {},
            inputAvailability,
            financialHealth,
            employeesPerCapacityUnit: EMPLOYEES_PER_CAPACITY_UNIT,
            maxEmployees: company.workforce.employees + regionAvailableNow,
          })
        : undefined;
      if (productionDecision) {
        company = productionDecision.company;
        facts.push(...productionDecision.facts);
      }
      const plan = productionDecision?.plan;

      // N4: zatrudnienie wynika z planu i jest ograniczone do obecnych
      // pracowników + dostępnych bezrobotnych regionu (bez planowania ludzi,
      // których nie ma); przy budżecie poniżej płacy-podłogi -- mniejszy plan.
      const wageBoundsForCompany: WageBounds = planWageBounds(plan, survivalBasketCost);
      // Etap 4B: usługodawca planuje pracowników według popytu na usługę
      // zgłoszonego w poprzednim ticku (bez zamówień -- bez pracowników).
      const serviceProfile = providerOf(company);
      // Etap 4B: usługodawca zatrudnia najwyżej tylu ludzi, ilu opłaci z
      // posiadanej gotówki (działalność wymaga finansowania -- bez debetu, który
      // tworzyłby pieniądz). Bez pracowników i bez środków na jednego pracownika
      // zamyka działalność (likwidacja zwraca resztę gotówki właścicielowi);
      // przy kolejnych zamówieniach może powstać nowy usługodawca.
      const affordableServiceStaff =
        serviceProfile && company.workforce.wageOffer > 0
          ? Math.floor(Math.max(0, company.finance.cash) / company.workforce.wageOffer + 1e-9)
          : Number.POSITIVE_INFINITY;
      if (serviceProfile && company.workforce.employees === 0 && affordableServiceStaff === 0) {
        const closed: Company = {
          ...company,
          closedTick: tick,
          status: { ...company.status, active: false, distressed: true },
        };
        facts.push({
          type: "company_closed",
          subject: { entityType: "company", entityId: company.id },
          location: { regionId: company.regionId },
          values: { before: 1, after: 0 },
        });
        causalLinks.push({
          targetIndex: facts.length - 1,
          source: { kind: "external", key: `company:${company.id}:cash` },
          type: "CONSTRAINING",
          factor: { key: "cannot_fund_one_worker", contribution: company.finance.cash },
          mechanism: "usługodawca nie ma pracowników ani środków na płacę jednego pracownika",
          system: "service-provider",
        });
        companies[companyId] = releaseClosedCompanyWorkers(closed);
        continue;
      }
      let plannedEmployees = serviceProfile
        ? Math.min(plannedServiceEmployees(company, serviceProfile), affordableServiceStaff)
        : plan
          ? plan.plannedEmployees
          : Math.ceil(
              company.production.capacity *
                company.production.utilization *
                EMPLOYEES_PER_CAPACITY_UNIT,
            );
      if (
        plan &&
        wageBoundsForCompany.ceiling !== undefined &&
        wageBoundsForCompany.ceiling < wageBoundsForCompany.floor
      )
        plannedEmployees = Math.min(
          plannedEmployees,
          affordableEmployees(plan, wageBoundsForCompany.floor),
        );
      const targetEmployment = Math.min(
        plannedEmployees,
        company.workforce.employees + regionAvailableNow,
      );
      // Zapotrzebowania ponad dostępnych ludzi nie zatrudniamy ani nie
      // podbijamy nim płac, ale zostaje sygnałem „są miejsca pracy” dla
      // migracji (krok 9.5) -- tak jak dawniej robiły to wakaty.
      unmetLaborNeed +=
        Math.max(0, plannedEmployees - targetEmployment) +
        (productionDecision?.unmetLaborNeed ?? 0);
      const laborDecision = decideLabor({
        company,
        tick,
        targetEmployment,
        financialHealth,
      });
      company = laborDecision.company;
      facts.push(...laborDecision.facts);

      // N3: rozbudowa na tych samych sygnałach -- trwały popyt (pokrycie
      // zapasem poniżej progu zwiększania), wynik po płacach (znormalizowany
      // do przychodu), kapitał i wolni pracownicy na nowe moce.
      const coverage = productionDecision?.coverage;
      const demandPersistenceScore =
        coverage?.kind === "MONTHS"
          ? clamp01(1 - coverage.months / INCREASE_BELOW_MONTHS)
          : 0;
      const normalizedResult = plan
        ? plan.expectedRevenue > 0
          ? Math.max(-1, Math.min(1, plan.expectedResult / plan.expectedRevenue))
          : plan.expectedResult < 0
            ? -1
            : 0
        : 0;
      const expansionWorkers = Math.ceil(
        company.production.capacity * EXPANSION_STEP_FRACTION * EMPLOYEES_PER_CAPACITY_UNIT,
      );
      const laborAvailableForExpansion =
        regionAvailableNow - Math.max(0, targetEmployment - company.workforce.employees) >=
        expansionWorkers;

      // Etap 4B (P13 + wykonanie rozbudowy, Canonical §52L): jeden aktywny plan
      // rozbudowy uzasadniony przez istniejące sygnały AI (trwały popyt, wynik,
      // wejścia, wolni pracownicy), oceniany od nowa co tick -- anulowanie
      // zwalnia rezerwę. Rozbudowę wykonuje firma budowlana regionu z wolną
      // zdolnością pracy; bez niej plan zostaje niezrealizowany (sama gotówka
      // nie zwiększa mocy). Bez profilu budowy w konfiguracji -- jak przed 4B.
      let contractorId: string | undefined;
      if (constructionProfile && recipe) {
        const expansionJustified =
          !financialHealth.distressed &&
          demandPersistenceScore > 0 &&
          normalizedResult > 0 &&
          inputAvailability > 0 &&
          laborAvailableForExpansion;
        const reserve = company.finance.investmentReserve ?? 0;
        if (!expansionJustified && reserve > 0) {
          facts.push({
            type: "investment_reserve_released",
            subject: { entityType: "company", entityId: company.id },
            location: { regionId },
            values: { before: reserve, after: 0, delta: -reserve },
          });
          causalLinks.push({
            targetIndex: facts.length - 1,
            source: { kind: "external", key: `company:${company.id}:expansion_plan` },
            type: "CONSTRAINING",
            factor: { key: "expansion_plan_cancelled", contribution: reserve },
            mechanism: "plan rozbudowy nie spełnia już warunków -- rezerwa wraca do wolnej gotówki",
            system: "investment-reserve",
          });
        }
        company = {
          ...company,
          finance: {
            ...company.finance,
            investmentReserve: expansionJustified ? reserve : 0,
          },
          ai: {
            ...company.ai,
            activeStates: { ...company.ai.activeStates, expansion_plan: expansionJustified },
          },
        };
        // Wykonawca: pierwsza (po id) firma budowlana regionu z wolną
        // zdolnością w tym ticku (usługodawcy są przetwarzani wcześniej).
        contractorId = companyIds
          .map((id) => companies[id]!)
          .find(
            (c) =>
              c.status.active &&
              providerOf(c)?.kind === "construction" &&
              (serviceCapacityRemaining[c.id] ?? 0) + 1e-9 >=
                constructionProfile.expansionWorkUnits,
          )?.id;
      }

      const companyBeforeLifecycle = company;
      const decided = decideLifecycle({
        company,
        tick,
        financialHealth,
        demandPersistenceScore,
        expectedMargin: normalizedResult,
        capitalCost: EXPANSION_CAPITAL_COST,
        laborAvailableForExpansion,
      });
      // Etap 4B: decyzja AI zapada normalnie (trwałość, cooldown, gotówka).
      // Gdy wychodzi rozbudowa, a nie ma wolnego wykonawcy -- plan zostaje
      // niezrealizowany: moc, gotówka i cooldown bez zmian, ale stan trwałości
      // sygnału (histereza, licznik) zostaje, a zamówienie budowy trafia do
      // istniejącej firmy budowlanej (plan jej zatrudnienia) albo jest sygnałem
      // założenia firmy budowlanej w regionie.
      const expansionBlocked =
        constructionProfile !== undefined &&
        recipe !== undefined &&
        decided.action === "EXPAND" &&
        contractorId === undefined;
      if (expansionBlocked && constructionProfile) {
        const builder = companyIds
          .map((id) => companies[id]!)
          .find((c) => c.status.active && providerOf(c)?.kind === "construction");
        if (builder)
          serviceDemandByCompanyId[builder.id] =
            (serviceDemandByCompanyId[builder.id] ?? 0) + constructionProfile.expansionWorkUnits;
        else constructionRequestsByRegion[regionId] = true;
      }
      const lifecycleDecision = expansionBlocked
        ? {
            action: "HOLD" as const,
            snapshot: undefined,
            company: {
              ...companyBeforeLifecycle,
              ai: {
                ...companyBeforeLifecycle.ai,
                activeStates: decided.company.ai.activeStates,
                opportunityStreak: decided.company.ai.opportunityStreak,
              },
            },
          }
        : decided;
      company = lifecycleDecision.company;

      // CE-04 (M17): audytowe -- `decideLifecycle` liczy `snapshot`
      // (`causalContext.factors`) od M11, ale nic go dotąd nie
      // konsumowało: EXPAND/CONTRACT/CLOSE nie emitowały żadnego faktu w
      // ogóle. `snapshot.causalContext.factors` to dokładnie ten
      // wieloprzyczynowy rozkład, który ta decyzja potrzebuje --
      // `external`, bo to są zaobserwowane warunki (demand persistence,
      // margin, utilization, cash runway), nie inne fakty.
      if (lifecycleDecision.snapshot) {
        const snapshot = lifecycleDecision.snapshot;
        const factType =
          lifecycleDecision.action === "EXPAND"
            ? "company_expanded"
            : lifecycleDecision.action === "CONTRACT"
              ? "company_contracted"
              : "company_closed";
        const values =
          lifecycleDecision.action === "CLOSE"
            ? { before: 1, after: 0 }
            : {
                before: companyBeforeLifecycle.production.capacity,
                after: company.production.capacity,
                delta:
                  company.production.capacity -
                  companyBeforeLifecycle.production.capacity,
              };
        facts.push({
          type: factType,
          subject: { entityType: "company", entityId: company.id },
          location: { regionId: company.regionId },
          values,
        });
        const targetIndex = facts.length - 1;
        for (const factor of snapshot.causalContext.factors) {
          causalLinks.push({
            targetIndex,
            source: { kind: "external", key: `company:${company.id}:${factor.key}` },
            type: directionalEdgeType(factor.contribution),
            factor,
            mechanism: `${snapshot.decisionType}: ${factor.key}`,
            system: "lifecycle-decision",
          });
        }
      }

      // Etap 4B: rozbudowa wykonana przez firmę budowlaną. Klient zapłacił
      // koszt rozbudowy z gotówki (najpierw z rezerwy) w `decideLifecycle`; ta
      // sama kwota jest przychodem wykonawcy (rozliczenie finansów w tym
      // ticku), a jego płace trafiają do jego pracowników. Plan zakończony,
      // niewykorzystana rezerwa zwolniona.
      if (lifecycleDecision.action === "EXPAND" && contractorId !== undefined && constructionProfile) {
        const expandedFactIndex = facts.length - 1;
        serviceCapacityRemaining[contractorId] = Math.max(
          0,
          (serviceCapacityRemaining[contractorId] ?? 0) - constructionProfile.expansionWorkUnits,
        );
        salesRevenueByCompanyId[contractorId] = roundMoney(
          (salesRevenueByCompanyId[contractorId] ?? 0) + EXPANSION_CAPITAL_COST,
        );
        company = {
          ...company,
          finance: { ...company.finance, investmentReserve: 0 },
          ai: {
            ...company.ai,
            activeStates: { ...company.ai.activeStates, expansion_plan: false },
          },
        };
        facts.push({
          type: "construction_service_paid",
          subject: { entityType: "company", entityId: contractorId },
          location: { regionId },
          values: { before: 0, after: EXPANSION_CAPITAL_COST, delta: EXPANSION_CAPITAL_COST },
        });
        causalLinks.push({
          targetIndex: facts.length - 1,
          source: { kind: "sameBatch", index: expandedFactIndex },
          type: "DIRECT",
          factor: { key: "capacity_expansion_contract", contribution: EXPANSION_CAPITAL_COST },
          mechanism: `firma ${company.id} zapłaciła wykonawcy za rozbudowę mocy`,
          system: "construction-service",
        });
      }

      const candidateMethodId = company.production.productionMethodId
        ? pmCandidates[company.production.productionMethodId]
        : undefined;
      const candidateRecipe = candidateMethodId
        ? productionRecipesByMethodId[candidateMethodId]
        : undefined;
      // M15: kandydat zagate'owany jednym lub więcej odkryciami trafia do
      // AI-08 dopiero, gdy każde z nich jest w tym regionie
      // AVAILABLE/ADOPTED -- pusta `requiredDiscoveryIds` jest zawsze
      // eligible (brak gate'u). Audytowe P0 (2026-09-19): `watermill_
      // milling` (`content/productionMethods/watermill_milling.json`,
      // `discoveries: ["mec_004"]`) jest realnym, niesyntetycznym
      // przykładem tej ścieżki -- `pmCandidates`/`requiredDiscoveryIds`
      // tu poniżej muszą pochodzić z `LoadEconomyContentResult.
      // pmCandidatesByCurrentMethodId`/`requiredDiscoveryIdsByMethodId`
      // (`load-economy-content.ts`), inaczej ten gate jest znowu no-opem.
      const requiredDiscoveryIds = candidateMethodId
        ? (requiredDiscoveryIdsByMethodId[candidateMethodId] ?? [])
        : [];
      const regionTechnologyState = region.knowledge.technologyStateId
        ? technologyStates[region.knowledge.technologyStateId]
        : undefined;
      const technologyGateSatisfied =
        requiredDiscoveryIds.length === 0 ||
        (regionTechnologyState !== undefined &&
          isProductionMethodAvailable(requiredDiscoveryIds, regionTechnologyState));

      if (recipe && candidateRecipe && technologyGateSatisfied) {
        const pmResult = evaluatePmAdoptionSafely({
          company,
          tick,
          currentRecipe: recipe,
          candidateRecipe,
          prices,
        });
        company = pmResult.company;
        if (pmResult.adopted) {
          for (const discoveryId of requiredDiscoveryIds) {
            industryAdoptionEvents.push({ discoveryId });
          }
          // CE-04/CE-06 (M17, Test 9): pierwszy fakt dla PM adoption --
          // dotąd nic go nie emitowało, mimo że `evaluatePmAdoption` liczy
          // `snapshot` od M11. Czynniki finansowe/marżowe (`external`) +
          // discovery/availability (`sameBatch`, gdy ta sama technologia
          // stała się AVAILABLE w TYM regionie w TYM ticku) -- productivity
          // musi iść przez TĘ decyzję, NIGDY bezpośrednio discovery ->
          // productivity.
          if (pmResult.snapshot) {
            const snapshot = pmResult.snapshot;
            facts.push({
              type: "production_method_adopted",
              subject: { entityType: "company", entityId: company.id },
              location: { regionId: company.regionId },
              values: {
                before: recipe.productionMethodId,
                after: candidateRecipe.productionMethodId,
              },
            });
            const targetIndex = facts.length - 1;
            for (const factor of snapshot.causalContext.factors) {
              causalLinks.push({
                targetIndex,
                source: { kind: "external", key: `company:${company.id}:${factor.key}` },
                type: directionalEdgeType(factor.contribution),
                factor,
                mechanism: `${snapshot.decisionType}: ${factor.key}`,
                system: "pm-adoption",
              });
            }
            for (const discoveryId of requiredDiscoveryIds) {
              // CE-06: `discovery_became_available` prawie na pewno padło
              // w JAKIMŚ WCZEŚNIEJSZYM ticku, nie tym samym, w którym AI-08
              // faktycznie przyjmuje metodę (persistence/cooldown gate'y w
              // pm-adoption.ts wymagają wielu ticków) -- `sameBatch` (ten
              // sam tick) to tylko rzadki, szczęśliwy przypadek; ogólny
              // przypadek to cross-tickowy `priorFactIndex` (WorldRunner's
              // `latestFactIdByEntity`, klucz `discovery:<id>` z tego
              // samego faktu subject).
              const availableIndex =
                availableFactIndexByRegionAndDiscovery[regionId]?.[discoveryId];
              const priorAvailableFactId =
                priorFactIndex[`discovery:${discoveryId}:discovery_became_available`];
              causalLinks.push({
                targetIndex,
                source:
                  availableIndex !== undefined
                    ? { kind: "sameBatch", index: availableIndex }
                    : priorAvailableFactId !== undefined
                      ? { kind: "priorFact", factId: priorAvailableFactId }
                      : { kind: "external", key: `discovery:${discoveryId}:available` },
                type: "ENABLING",
                factor: { key: `discovery:${discoveryId}`, contribution: 1 },
                mechanism: "technologia wymagana przez tę metodę produkcji jest dostępna w regionie",
                system: "pm-adoption",
              });
              productionMethodAdoptedFactIndexByDiscoveryId[discoveryId] = targetIndex;
            }
          }
        }
      }

      if (!company.status.active) {
        // CLOSE w tym ticku: pracownicy wracają do kohort od razu (N1).
        companies[companyId] = releaseClosedCompanyWorkers(company);
        continue;
      }
      companies[companyId] = company;

      // 4. Rynek pracy: wages -> hire/layoff. Całe osoby (2026-10-01):
      // dostępni = pula regionu (`floor`), nie suma limitów kohort.
      const regionCohorts = () => cohortIds.map((cohortId) => populationCohorts[cohortId]!);
      const availableLabor = regionAvailableWorkers(regionCohorts());
      if (company.workforce.wageOffer > 0) {
        const wageResult = adjustWageOffer({
          company,
          availableLabor,
          bounds: wageBoundsForCompany,
        });
        company = wageResult.company;
        {
          const baseIndex = facts.length;
          facts.push(...wageResult.facts);
          causalLinks.push(...offsetCausalLinks(wageResult.causalLinks, baseIndex));
        }
      }

      // Audytowe P1 ("layoff nie rozlicza poprawnie pozostałej płacy"):
      // zapamiętane PRZED wykonaniem layoff, żeby zwolnieni tego ticka
      // wciąż dostali zapłatę za czas, w którym byli zatrudnieni -- bez
      // tego `laborCostThisTick` (niżej) liczyłby się już od
      // zredukowanego stanu i zwolnieni nie dostaliby nic za ten tick.
      const employeesBeforeLaborAction = company.workforce.employees;

      if (laborDecision.action === "HIRE") {
        // Łączny limit regionu w całych osobach -- limity kohort (`ceil`) razem
        // mogą go przekraczać, więc zatrudnienie z kohort jest dodatkowo
        // ograniczone pozostałą pulą regionu.
        let regionRemaining = regionAvailableWorkers(regionCohorts());
        for (const cohortId of cohortIds) {
          if (company.workforce.vacancies <= 0 || regionRemaining <= 0) break;
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
                [cohort.skillLevel]: Math.min(company.workforce.vacancies, regionRemaining),
              },
            },
          };
          const matchResult = matchEmployment({ company, cohort });
          company = matchResult.company;
          populationCohorts[cohortId] = matchResult.cohort;
          regionRemaining -= matchResult.hired;
          {
            const baseIndex = facts.length;
            facts.push(...matchResult.facts);
            causalLinks.push(...offsetCausalLinks(matchResult.causalLinks, baseIndex));
          }
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
          {
            const baseIndex = facts.length;
            facts.push(...layoffResult.facts);
            causalLinks.push(...offsetCausalLinks(layoffResult.causalLinks, baseIndex));
          }
          remaining -= count;
        }
      }
      companies[companyId] = company;
      // Etap 4B: zdolność usługodawcy w tym ticku = pracownicy po decyzji o
      // zatrudnieniu × wydajność -- zatrudnieni pracują w miesiącu, za który
      // dostają płacę (budowy klientów w tej pętli, przewozy w kroku 10).
      if (serviceProfile)
        serviceCapacityRemaining[company.id] = serviceCapacity(company, serviceProfile);

      // 5. Produkcja.
      let companyInventory = inventories[company.inventoryId]!;
      let batchesRun = 0;
      if (recipe) {
        const productionMethodIdBeforeProduction = company.production.productionMethodId;
        const productionResult = runProduction({
          tick,
          company,
          inventory: companyInventory,
          recipe,
          resourceDeposits: depositsForRecipe,
        });
        // Audytowe (M15, wykryte pierwszym pełnym wieloticzkowym testem
        // `pmCandidatesByCurrentMethodId` przez `runEconomyTick`):
        // `runProduction` zawsze "odbija" `recipe.productionMethodId`
        // (ten sam `recipe` z GÓRY pętli, celowo sprzed decyzji AI-08 --
        // ten tick produkuje jeszcze starą metodą) z powrotem do
        // `company.production.productionMethodId`. Nieszkodliwe, gdy
        // metoda się nie zmieniła w tym ticku (echo = no-op), ale cofało
        // krok 3's AI-08 adopcję dokonaną chwilę wcześniej w TYM SAMYM
        // ticku. Zachowaj to, co AI-08 właśnie ustawiło.
        company = {
          ...productionResult.company,
          production: {
            ...productionResult.company.production,
            productionMethodId: productionMethodIdBeforeProduction,
          },
        };
        companyInventory = productionResult.inventory;
        batchesRun = productionResult.batches;
        for (const deposit of Object.values(productionResult.resourceDeposits)) {
          resourceDeposits[deposit.id] = deposit;
        }
        {
          const baseIndex = facts.length;
          facts.push(...productionResult.facts);
          causalLinks.push(...offsetCausalLinks(productionResult.causalLinks, baseIndex));
        }

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

      // 6. Sprzedaż do magazynu regionu -- etap 2 (minimalne rozliczenie
      // N6, 2026-10-01): firma oddaje nadwyżkę ponad bufor W KOMIS (rejestr
      // własności `Inventory.consignment`) i NIE dostaje za nią pieniędzy;
      // płaci jej dopiero kupujący (krok 7). Wcześniej magazyn płacił za całą
      // produkcję, także niesprzedaną (diagnoza Black Mountain P1).
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
          regionInventory = addConsignment(
            saleResult.regionInventory,
            goodId,
            company.id,
            saleResult.quantitySold,
          );
          facts.push(...saleResult.facts);
        }
        inventories[regionInventoryId] = regionInventory;
      }

      // Płace: koszt firmy = płaca × opłaceni pracownicy; ta sama kwota trafia
      // do gospodarstw regionu (krok 7a). Finanse firmy rozliczane po pętli
      // regionów, gdy znane są już wszystkie wpłaty kupujących (także z
      // innych regionów, za towar wywieziony w komisie).
      const employeesPaidThisTick = Math.max(
        employeesBeforeLaborAction,
        company.workforce.employees,
      );
      // P12b: stawka ma 6 miejsc; wypłata = jedno zaokrąglenie do grosza. Ta
      // sama kwota jest kosztem firmy i trafia do gospodarstw (krok 7a).
      const laborCostThisTick = transactionValue(
        employeesPaidThisTick,
        company.workforce.wageOffer,
      );
      laborCostByCompanyId[company.id] = laborCostThisTick;
      nextTickObligationsByCompanyId[company.id] = transactionValue(
        company.workforce.employees,
        company.workforce.wageOffer,
      );
      regionWageBill = roundMoney(regionWageBill + laborCostThisTick);
      companies[companyId] = company;
    }

    // 7. Gospodarstwa domowe -- etap 2 (N7 + minimalne rozliczenie N6,
    // decyzja właściciela 2026-10-01): pieniądz faktycznie krąży.
    // 7a. Płace wypłacone przez firmy regionu trafiają do kohort regionu
    // proporcjonalnie do zatrudnienia (firma zna tylko łączną liczbę
    // pracowników; ten sam agregat co `layoffWorkers`).
    if (regionWageBill > 0 && cohortIds.length > 0) {
      const regionCohortList = cohortIds.map((id) => populationCohorts[id]!);
      const employed = regionCohortList.reduce((sum, c) => sum + c.employment, 0);
      const shares = splitMoney(
        regionWageBill,
        regionCohortList.map(
          (c) => [c.id, employed > 0 ? c.employment : c.population] as const,
        ),
      );
      for (const cohort of regionCohortList) {
        const received = shares[cohort.id] ?? 0;
        if (received <= 0) continue;
        populationCohorts[cohort.id] = {
          ...cohort,
          savings: roundMoney(cohort.savings + received),
          averageIncome:
            cohort.employment > 0 ? received / cohort.employment : cohort.averageIncome,
        };
      }
    }
    // Księgowość budżetu (fakty `consumption_budget_changed`): budżet kohorty =
    // faktycznie otrzymana płaca (zatrudnienie × otrzymana stawka).
    for (const cohortId of cohortIds) {
      const cohort = populationCohorts[cohortId]!;
      if (cohort.population <= 0 || cohort.employment <= 0) continue;
      const consumptionResult = applyHouseholdConsumption({
        cohort,
        categoryCost: {
          survival: 0,
          basic: 0,
          services: 0,
          comfort: 0,
          prosperity: 0,
          luxury: 0,
        },
      });
      populationCohorts[cohortId] = consumptionResult.cohort;
      const baseIndex = facts.length;
      facts.push(...consumptionResult.facts);
      causalLinks.push(...offsetCausalLinks(consumptionResult.causalLinks, baseIndex));
    }

    // 7b. Zakup koszyka przetrwania przez gospodarstwa (rodziny kohort --
    // dochody pracujących utrzymują dzieci, starszych i niepracujących; podział
    // wewnątrz rodziny nie tworzy pieniędzy). Popyt opłacalny = min(potrzeby,
    // oszczędności / cena) -- także bez pracy; zakup ograniczony zapasem;
    // przy braku towaru pieniądze zostają na koncie. Zapłata trafia do
    // właścicieli towaru w komisie (pro rata); część bez właściciela (zapas
    // opłacony jeszcze w poprzednim modelu) nie trafia do nikogo.
    // P14 (2026-10-01): dostępne oferty = towar wystawiony w magazynie regionu
    // przed zakupami (produkcja oddana w komis, zapas, import przywieziony w
    // poprzednim ticku); bufory firm i przyszła produkcja się nie liczą.
    const offeredByGood: Record<string, number> = {};
    if (marketId && regionInventoryId)
      for (const goodId of Object.keys(markets[marketId]!.goods))
        offeredByGood[goodId] =
          inventories[regionInventoryId]!.items[goodId]?.quantity ?? 0;
    let householdNeed = 0;
    let householdPurchased = 0;
    let householdFundsAfterPurchase = 0;
    const survivalPrice = marketId
      ? markets[marketId]!.goods[SURVIVAL_GOOD_ID]?.localPrice
      : undefined;
    if (marketId && regionInventoryId && survivalPrice !== undefined && survivalPrice > 0) {
      // N5 (2026-10-01, błąd etapu 2 ujawniony rynkami w kolejnych
      // regionach): rodziny z BIEŻĄCEJ mapy kohort regionu (po demografii, z
      // jej syntetycznymi kohortami), nie z cache `cohortIds` sprzed ticka.
      // Grupowanie niepełnej rodziny z cache tworzyło syntetyczne kohorty o
      // innych id (inny „pierwszy” członek niż w demografii), a zapis salda
      // dla nich dawał rekord bez `id`. Saldo dostają tylko istniejące kohorty.
      const liveRegionCohorts = Object.values(populationCohorts)
        .filter((c) => c.regionId === regionId)
        .sort((a, b) => a.id.localeCompare(b.id));
      const families = groupCohortsIntoFamilies(liveRegionCohorts)
        .map((family) =>
          Object.values(family)
            .filter((c) => populationCohorts[c.id] !== undefined)
            .sort((a, b) => a.id.localeCompare(b.id)),
        )
        .filter((members) => members.length > 0)
        .sort((a, b) => a[0]!.id.localeCompare(b[0]!.id));
      for (const members of families) {
        const need =
          members.reduce((sum, c) => sum + c.population, 0) * SURVIVAL_UNITS_PER_CAPITA;
        const pool = roundMoney(members.reduce((sum, c) => sum + c.savings, 0));
        // Etap 4B: zakup pro rata z lotów po ich cenach (import: cena towaru u
        // eksportera + opłata za przewóz, ustalona przy dostawie; towar
        // regionu: cena lokalna) -- ta sama oferta, którą planował handel.
        const storeBeforePurchase = inventories[regionInventoryId]!;
        const unitPrice = blendedUnitPrice(storeBeforePurchase, SURVIVAL_GOOD_ID, survivalPrice);
        const payable = Math.min(need, pool / unitPrice);
        householdNeed += need;
        householdDemandByGood[SURVIVAL_GOOD_ID] =
          (householdDemandByGood[SURVIVAL_GOOD_ID] ?? 0) + payable;

        const stockBefore =
          inventories[regionInventoryId]!.items[SURVIVAL_GOOD_ID]?.quantity ?? 0;
        const purchaseResult = settleHouseholdPurchase({
          regionInventory: inventories[regionInventoryId]!,
          goodId: SURVIVAL_GOOD_ID,
          desiredQuantity: payable,
        });
        facts.push(...purchaseResult.facts);
        const bought = purchaseResult.quantityPurchased;
        const take = takeConsignment(
          purchaseResult.regionInventory,
          SURVIVAL_GOOD_ID,
          bought,
          stockBefore,
        );
        inventories[regionInventoryId] = pruneLotPrices(take.inventory, SURVIVAL_GOOD_ID);
        householdPurchased += bought;

        // Zapłata co do grosza, nigdy ponad saldo rodziny. Etap 4A (P12): cena
        // modelowa ma 6 miejsc; wartość transakcji (ilość × cena) zaokrąglana
        // do grosza tylko w `transactionValue` -- ta sama kwota schodzi z salda
        // rodziny i trafia do sprzedawcy.
        let paid = 0;
        for (const [ownerId, quantity] of Object.entries(take.takenByOwner).sort(
          ([x], [y]) => x.localeCompare(y),
        )) {
          const money = Math.min(
            transactionValue(
              quantity,
              lotUnitPrice(storeBeforePurchase, SURVIVAL_GOOD_ID, ownerId, survivalPrice),
            ),
            roundMoney(pool - paid),
          );
          if (money <= 0) continue;
          salesRevenueByCompanyId[ownerId] = roundMoney(
            (salesRevenueByCompanyId[ownerId] ?? 0) + money,
          );
          paid = roundMoney(paid + money);
        }
        paid = roundMoney(
          paid +
            Math.max(0, Math.min(transactionValue(take.unowned, survivalPrice), pool - paid)),
        );
        const remaining = splitMoney(
          roundMoney(pool - paid),
          members.map((c) => [c.id, c.population] as const),
        );
        for (const member of members)
          populationCohorts[member.id] = {
            ...populationCohorts[member.id]!,
            savings: remaining[member.id] ?? 0,
          };
        householdFundsAfterPurchase = roundMoney(
          householdFundsAfterPurchase + roundMoney(pool - paid),
        );
      }
      // P14: niezrealizowane zamówienia regionu dla handlu (krok 10) --
      // potrzeby bez zakupu i środki, które gospodarstwom zostały.
      importOrdersByMarketGood[`${marketId}:${SURVIVAL_GOOD_ID}`] = {
        unmetNeed: Math.max(0, householdNeed - householdPurchased),
        funds: householdFundsAfterPurchase,
      };
    }

    // 8. Rynek: cena/niedobór na podstawie realnie zaobserwowanego popytu/podaży tego ticku.
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
          // P14: bez magazynu regionu nie ma gdzie wystawić oferty -- rynek
          // nie jest wtedy śledzony (zachowanie sprzed P14).
          ...(regionInventoryId ? { offered: offeredByGood[goodId] ?? 0 } : {}),
        });
        market = updateResult.market;
        if (goodId === SURVIVAL_GOOD_ID && survivalPrice !== undefined && regionInventoryId) {
          market = {
            ...market,
            goods: {
              ...market.goods,
              [goodId]: { ...market.goods[goodId]!, householdNeed, householdPurchased },
            },
          };
        }
        const baseIndex = facts.length;
        facts.push(...updateResult.facts);
        causalLinks.push(...offsetCausalLinks(updateResult.causalLinks, baseIndex));
      }
      markets[marketId] = market;
    }

    // 9. Entrepreneurship (M12, AI-07): regionalny Opportunity Scan --
    // ocenia każdego kandydata AFTER krok 8, więc widzi tegoticzowy,
    // świeżo zaktualizowany rynek (shortageSeverity/demand/supply), nie
    // stan sprzed tego ticka.
    if (marketId && Object.keys(entrepreneurshipCandidatesByArchetypeId).length > 0) {
      const market = markets[marketId]!;
      const prices = Object.fromEntries(
        Object.entries(market.goods).map(([goodId, good]) => [goodId, good.localPrice]),
      );
      const availableLabor = regionAvailableWorkers(
        cohortIds.map((cohortId) => populationCohorts[cohortId]!),
      );
      // Audytowe P1-01: fizyczny stock nie może ujawniać się scannerowi
      // niezależnie od stanu odkrycia (World Generation Spec §16 -- Black
      // Mountain's Iron Ore MOŻE zaczynać jako hidden/unknown, region "nie
      // ma automatycznie rozwiniętego przemysłu żelaza" -- founding nie
      // może omijać tej granicy). Tylko DISCOVERED/ASSESSED depozyty
      // wnoszą swój stock; UNKNOWN/SUSPECTED liczą się jako 0 dostępne.
      const resourceStockByResourceId: Record<string, number> = {};
      for (const [resourceId, depositId] of depositIdByResource) {
        resourceStockByResourceId[resourceId] = usableDepositQuantity(
          resourceDeposits[depositId],
        );
      }
      // Audytowe P1-01: goodInputsPerBatch (dobra pośrednie) w ogóle nie
      // był sprawdzany -- regionalne inventory (to samo, z którego
      // korzystają settleHouseholdPurchase/settleTradeFlow) jako widoczny
      // dla przedsiębiorcy zapas dóbr.
      const regionInventoryForFounding = regionInventoryId
        ? inventories[regionInventoryId]
        : undefined;
      const goodStockByGoodId: Record<string, number> = {};
      if (regionInventoryForFounding) {
        for (const [goodId, item] of Object.entries(regionInventoryForFounding.items)) {
          goodStockByGoodId[goodId] = item.quantity;
        }
      }

      for (const archetypeId of Object.keys(
        entrepreneurshipCandidatesByArchetypeId,
      ).sort()) {
        const candidate = entrepreneurshipCandidatesByArchetypeId[archetypeId]!;
        const recipe = productionRecipesByMethodId[candidate.productionMethodId];
        if (!recipe) continue;

        const primaryOutputGoodId = Object.keys(recipe.goodOutputsPerBatch).sort()[0];
        const outputGoodState = primaryOutputGoodId
          ? market.goods[primaryOutputGoodId]
          : undefined;
        const demandGapSeverity = outputGoodState?.shortageSeverity ?? 0;
        const unmetDemandQuantity = outputGoodState
          ? Math.max(0, outputGoodState.demand - outputGoodState.supply)
          : 0;
        const existingCompetitorCount = companyIds.filter(
          (id) =>
            companies[id]!.archetypeId === archetypeId && companies[id]!.status.active,
        ).length;

        const foundingResult = evaluateFounding({
          region,
          tick,
          archetypeId,
          recipe,
          capitalRequirement: candidate.capitalRequirement,
          prices,
          demandGapSeverity,
          unmetDemandQuantity,
          resourceStockByResourceId,
          goodStockByGoodId,
          availableLabor,
          existingCompetitorCount,
        });
        region = foundingResult.region;

        // Bez przynajmniej jednej kohorty region nie ma nikogo, kto mógłby
        // zostać właścicielem nowej firmy (Company.ownerEntityId wymaga
        // istniejącej kohorty) -- to samo `population.totalPopulation > 0`
        // hard-eligibility, tylko sprawdzone tu przed faktyczną konstrukcją,
        // nie w samym `evaluateFounding` (który go już wymusza).
        const ownerCohortId = cohortIds[0];
        if (foundingResult.founded && foundingResult.companyDraft && ownerCohortId) {
          const draft = foundingResult.companyDraft;
          const newCompanyId = `company_${draft.archetypeId}_${regionId}_t${tick}`;
          const newInventoryId = `inventory_${newCompanyId}`;
          // TODO tuning -- brak LocationScore (M12's opisany, ale
          // niezaimplementowany "Company location decision", audytowe
          // P1-01) -- pierwszy (po sortowaniu ID) settlement regionu jako
          // placeholder, ten sam wzorzec co `ownerCohortId` niżej. Bez tego
          // `settlementId` firma nigdy nie zasila `Settlement.economy.
          // employment` (audytowe P1-07) mimo że M14 czyta je właśnie po
          // tym polu.
          // SET-LIFECYCLE-001: tylko aktywna osada może przyjąć nową firmę.
          const newCompanySettlementId = [...region.settlements.settlementIds]
            .filter((id) => {
              const settlement = settlements[id];
              return settlement !== undefined && isSettlementActive(settlement);
            })
            .sort()[0];

          const newInventory = createInventory({
            id: newInventoryId,
            ownerType: "company",
            ownerId: newCompanyId,
            locationRegionId: regionId,
          });
          const baseCompany = createCompany({
            id: newCompanyId,
            archetypeId: draft.archetypeId,
            // TODO content -- brak generatora nazw firm (M12 nie wprowadza contentu, patrz plan sekcja "Dane").
            name: `New ${draft.archetypeId} (${region.name})`,
            foundedTick: tick,
            regionId,
            ...(newCompanySettlementId !== undefined
              ? { settlementId: newCompanySettlementId }
              : {}),
            ownerType: "individual",
            // TODO tuning -- brak modelu "kto zostaje przedsiębiorcą" (§46
            // Capital Formation jest celowo uproszczone) -- pierwsza (po
            // sortowaniu ID) kohorta regionu jako placeholder właściciela.
            ownerEntityId: ownerCohortId,
            inventoryId: newInventoryId,
            initialCash: draft.initialCash,
            initialWageOffer: draft.initialWageOffer,
          });
          const newCompany: Company = {
            ...baseCompany,
            production: {
              ...baseCompany.production,
              productionMethodId: draft.productionMethodId,
              capacity: draft.initialCapacity,
              utilization: draft.initialUtilization,
            },
          };

          companies[newCompanyId] = newCompany;
          inventories[newInventoryId] = newInventory;
          // Audytowe P1-02: `evaluateFounding` już budowało
          // `DecisionSnapshot` (options/factors/selectedAction), ale
          // wcześniej nic go stąd nie odbierało -- fakt niósł tylko
          // istnienie 0->1, gubiąc rzeczywiste powody founding (CD
          // AI-010/CAUS-001). M18: `snapshot` jest teraz zawsze zdefiniowany
          // (także na ścieżce HOLD, dla WHY NOT?), więc bez non-null assercji.
          const foundingSnapshot = foundingResult.snapshot;
          facts.push({
            type: "company_founded",
            subject: { entityType: "company", entityId: newCompanyId },
            location: { regionId },
            values: { before: undefined, after: foundingSnapshot },
          });
          // CE-04 (M17): ten fakt już niósł `snapshot` jako swoją wartość
          // (audytowa naprawa P1-02), ale nikt nie zamieniał
          // `causalContext.factors` na edges -- to domyka tamten most.
          const targetIndex = facts.length - 1;
          // CE-07 (M17, Test 4 Butterfly Effect): "resource_access" jest
          // jedynym z tych czynników, który wskazuje na KONKRETNĄ encję
          // (depozyt) -- jeśli ten depozyt ma już jakiś fakt (np. `resource_
          // discovered` z interwencji Architekta), cytuj go realnie
          // (`priorFact`), żeby wpływ mógł faktycznie propagować się przez
          // ten łańcuch, zamiast zawsze `external`.
          const primaryRequiredResourceId = Object.keys(recipe.resourceInputsPerBatch).sort()[0];
          const primaryDepositId = primaryRequiredResourceId
            ? depositIdByResource.get(primaryRequiredResourceId)
            : undefined;
          const depositFactId = primaryDepositId
            ? (priorFactIndex[`resourceDeposit:${primaryDepositId}:resource_assessed`] ??
              priorFactIndex[`resourceDeposit:${primaryDepositId}:resource_discovered`])
            : undefined;
          for (const factor of foundingSnapshot.causalContext.factors) {
            const source =
              factor.key === "resource_access" && depositFactId !== undefined
                ? ({ kind: "priorFact", factId: depositFactId } as const)
                : ({ kind: "external", key: `region:${regionId}:${factor.key}` } as const);
            causalLinks.push({
              targetIndex,
              source,
              type: directionalEdgeType(factor.contribution),
              factor,
              mechanism: `${foundingSnapshot.decisionType}: ${factor.key}`,
              system: "opportunity-scanner",
            });
          }
        }
      }
    }

    // 9.2 Etap 4B (Canonical §52L): założenie usługodawcy -- tylko na sygnał
    // rzeczywistego zamówienia, z wolnym pracownikiem i z kapitałem z
    // istniejących oszczędności inwestora (rodzina regionu z największymi
    // oszczędnościami). Transport: niezrealizowane zamówienia importu z braku
    // przewoźnika w poprzednim ticku (`importDemand` dobra na rynku regionu) i
    // brak firmy transportowej w regionie. Budowa: plan rozbudowy gotowy do
    // opłacenia w tym ticku bez firmy budowlanej w regionie.
    for (const profile of Object.values(serviceProviders).sort((a, b) =>
      a.archetypeId.localeCompare(b.archetypeId),
    )) {
      const regionCompanies = Object.values(companies).filter(
        (c) => c.regionId === regionId && c.status.active,
      );
      if (regionCompanies.some((c) => providerOf(c)?.kind === profile.kind)) continue;
      const market = marketId ? markets[marketId] : undefined;
      const requestedUnits =
        profile.kind === "transport"
          ? Object.values(market?.goods ?? {}).reduce((sum, g) => sum + g.importDemand, 0)
          : constructionRequestsByRegion[regionId]
            ? profile.expansionWorkUnits
            : 0;
      if (!(requestedUnits > 0)) continue;
      const liveCohorts = Object.values(populationCohorts)
        .filter((c) => c.regionId === regionId)
        .sort((a, b) => a.id.localeCompare(b.id));
      if (regionAvailableWorkers(liveCohorts) < 1) continue;
      // Uzasadniona działalność: kapitał startowy musi opłacić miesiąc pracy
      // ludzi potrzebnych do wykonania jednego zlecenia po płacy minimalnej
      // regionu (koszyk przetrwania) -- transport: 1 pracownik, budowa:
      // praca rozbudowy / wydajność. Inaczej firma zamknęłaby się bez
      // wykonania usługi (zakładanie i zamykanie bez działalności).
      const initialWageOffer = roundWageRate(Math.max(survivalBasketCost, 0.01));
      const jobStaff =
        profile.kind === "construction" && profile.unitsPerEmployee > 0
          ? Math.ceil(profile.expansionWorkUnits / profile.unitsPerEmployee - 1e-9)
          : 1;
      if (profile.capitalRequirement < initialWageOffer * Math.max(1, jobStaff)) continue;
      const founded = foundServiceCompany({
        profile,
        region,
        tick,
        liveCohorts,
        settlements,
        initialWageOffer,
        requestedUnits,
      });
      if (!founded) continue;
      companies[founded.company.id] = founded.company;
      inventories[founded.inventory.id] = founded.inventory;
      for (const cohort of founded.cohorts) populationCohorts[cohort.id] = cohort;
      const foundedIndex = facts.length;
      facts.push(...founded.facts);
      causalLinks.push(
        {
          targetIndex: foundedIndex,
          source: { kind: "external", key: `region:${regionId}:${profile.kind}_orders` },
          type: "TRIGGERING",
          factor: { key: `${profile.kind}_service_orders`, contribution: requestedUnits },
          mechanism:
            profile.kind === "transport"
              ? "niezrealizowane zamówienia importu z braku przewoźnika"
              : "plan rozbudowy gotowy do opłacenia bez firmy budowlanej w regionie",
          system: "service-founding",
        },
        {
          targetIndex: foundedIndex + 1,
          source: { kind: "sameBatch", index: foundedIndex },
          type: "DIRECT",
          factor: { key: "founding_capital", contribution: profile.capitalRequirement },
          mechanism: "inwestor przekazał kapitał z własnych oszczędności",
          system: "service-founding",
        },
      );
    }

    // 9.5 Migration attraction (M13, AI-09): region's own pull/push
    // signal, computed fresh this tick from labor market + housing state
    // (post-entrepreneurship, więc widzi ewentualną nowo założoną firmę),
    // cache'owany w `Region.cached.migrationAttraction` -- `runMigrationPass`
    // (krok 11, po pętli regionów) czyta go i jako źródło, i jako pull
    // każdego kandydata docelowego.
    {
      // Wakaty firm + zapotrzebowanie na pracę ponad dostępnych (N4) -- pełny
      // sygnał „są miejsca pracy” dla migracji.
      let vacancies = unmetLaborNeed;
      let wageWeightedSum = 0;
      let wageWeight = 0;
      for (const companyId of companyIds) {
        const company = companies[companyId]!;
        if (!company.status.active) continue;
        vacancies += company.workforce.vacancies;
        const weight = company.workforce.employees > 0 ? company.workforce.employees : 1;
        wageWeightedSum += company.workforce.wageOffer * weight;
        wageWeight += weight;
      }
      const regionEligibleLaborForce = regionLaborForce(
        cohortIds.map((id) => populationCohorts[id]!),
      );
      // SET-LIFECYCLE-001: koszt mieszkania liczą wyłącznie aktywne osady.
      const settlementIdsInRegion = region.settlements.settlementIds.filter((id) => {
        const settlement = worldState.settlements[id];
        return settlement !== undefined && isSettlementActive(settlement);
      });
      const averageHousingCost =
        settlementIdsInRegion.length > 0
          ? settlementIdsInRegion.reduce(
              (sum, id) => sum + (worldState.settlements[id]?.housing.cost ?? 0),
              0,
            ) / settlementIdsInRegion.length
          : 0;

      const migrationSignals = {
        vacancies,
        eligibleLaborForce: regionEligibleLaborForce,
        averageWageOffer: wageWeight > 0 ? wageWeightedSum / wageWeight : 0,
        averageHousingCost,
      };
      const migrationAttraction = computeMigrationAttraction(migrationSignals);
      region = { ...region, cached: { ...region.cached, migrationAttraction } };
      // M17 (CE-05): sam rozkład na czynniki -- patrz `runMigrationPass`
      // (krok 11), gdzie faktycznie staje się `CausalEdge`.
      migrationAttractionBreakdownByRegionId[regionId] =
        computeMigrationAttractionBreakdown(migrationSignals);
    }

    // M15: zastosuj zdarzenia industry adoption tego regionu (zebrane
    // wyżej podczas oceny decyzji AI-08 każdej firmy) na jego TechnologyState.
    const technologyStateId = region.knowledge.technologyStateId;
    if (technologyStateId && industryAdoptionEvents.length > 0) {
      const currentTechnologyState = technologyStates[technologyStateId];
      if (currentTechnologyState) {
        const industryAdoptionResult = applyIndustryAdoption(
          currentTechnologyState,
          industryAdoptionEvents,
        );
        technologyStates[technologyStateId] = industryAdoptionResult.technologyState;
        for (const fact of industryAdoptionResult.facts) {
          facts.push(fact);
          // CE-06 (M17, Test 9): NIGDY bezpośrednio discovery_occurred ->
          // productivity -- ta krawędź zawsze przechodzi przez faktyczną
          // decyzję AI-08 (`production_method_adopted`).
          const discoveryId = fact.subject.entityId;
          const adoptedIndex = productionMethodAdoptedFactIndexByDiscoveryId[discoveryId];
          causalLinks.push({
            targetIndex: facts.length - 1,
            source:
              adoptedIndex !== undefined
                ? { kind: "sameBatch", index: adoptedIndex }
                : { kind: "external", key: `discovery:${discoveryId}:production_method_adopted` },
            type: "DIRECT",
            factor: { key: "industry_adoption", contribution: 1 },
            mechanism: "AI-08 przyjęło production method zagate'owaną tym odkryciem",
            system: "technology-adoption",
          });
        }
      }
    }

    regions[regionId] = region;
  }

  // 10. Handel: fizyczne przeniesienie dóbr wzdłuż każdego Connection (M10).
  // Etap 4B: PRZED rozliczeniem finansów -- opłaty za przewóz (koszt
  // właściciela towaru, przychód przewoźnika) rozliczają się w tym samym
  // ticku, przed wypłatami właścicielskimi. Zakupy gospodarstw już zaszły,
  // więc kolejność nie zmienia popytu ani cen tego ticka.
  const remainingExportByMarketGood: Record<string, number> = {};
  // Etap 4B: `importDemand` = zamówienia importu niezrealizowane z braku
  // przewoźnika w TYM ticku (sygnał założenia firmy transportowej w następnym).
  for (const marketId of Object.keys(markets).sort()) {
    const market = markets[marketId]!;
    if (Object.values(market.goods).every((g) => g.importDemand === 0)) continue;
    markets[marketId] = {
      ...market,
      goods: Object.fromEntries(
        Object.entries(market.goods).map(([goodId, g]) => [goodId, { ...g, importDemand: 0 }]),
      ),
    };
  }
  const transportContext: TransportContext = {
    enabled: transportServiceEnabled,
    companies,
    isCarrier: (company) => providerOf(company)?.kind === "transport",
    capacityRemaining: serviceCapacityRemaining,
    feesOwed: transportCostByCompanyId,
    serviceRevenue: salesRevenueByCompanyId,
    laborCost: laborCostByCompanyId,
    serviceDemand: serviceDemandByCompanyId,
  };
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
        causalLinks,
        importOrders: importOrdersByMarketGood,
        remainingExport: remainingExportByMarketGood,
        transport: transportContext,
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
        causalLinks,
        importOrders: importOrdersByMarketGood,
        remainingExport: remainingExportByMarketGood,
        transport: transportContext,
      });
    }
    connections[connectionId] = connection;
  }

  // Etap 4B: popyt na usługę zgłoszony w tym ticku (przewozy, budowy) staje
  // się planem zatrudnienia usługodawcy w następnym; nowo założona firma
  // zachowuje popyt, który ją uruchomił.
  for (const companyId of Object.keys(companies).sort()) {
    const company = companies[companyId]!;
    if (!providerOf(company) || company.foundedTick === tick) continue;
    companies[companyId] = {
      ...company,
      market: {
        ...company.market,
        expectedDemand: {
          ...company.market.expectedDemand,
          [SERVICE_DEMAND_KEY]: serviceDemandByCompanyId[companyId] ?? 0,
        },
      },
    };
  }

  // Etap 2 (N6 min.): finanse firm po wszystkich regionach -- przychód =
  // faktyczne wpłaty kupujących (także z innych regionów za towar wywieziony
  // w komisie), koszt = płace wypłacone gospodarstwom. Firma zamknięta, której
  // towar sprzedano z komisu, też dostaje zapłatę.
  const financeFactIndexByCompanyId: Record<string, number> = {};
  // Etap 4B: koszt operacyjny = płace + opłaty za przewóz towaru firmy;
  // przychód = wpłaty kupujących + przychód z usług (przewóz, budowa).
  const operatingCostOf = (companyId: string): number =>
    roundMoney((laborCostByCompanyId[companyId] ?? 0) + (transportCostByCompanyId[companyId] ?? 0));
  for (const companyId of [
    ...new Set([
      ...Object.keys(laborCostByCompanyId),
      ...Object.keys(salesRevenueByCompanyId),
      ...Object.keys(transportCostByCompanyId),
    ]),
  ].sort()) {
    const company = companies[companyId];
    if (!company) continue;
    const financeResult = applyCompanyFinances({
      company,
      revenue: salesRevenueByCompanyId[companyId] ?? 0,
      costs: operatingCostOf(companyId),
    });
    companies[companyId] = financeResult.company;
    facts.push(...financeResult.facts);
    if (financeResult.facts.length > 0) financeFactIndexByCompanyId[companyId] = facts.length - 1;
  }

  // 9.9 Dochód właścicielski (decyzja właściciela 2026-10-01, Canonical
  // §52H): po rozliczeniu WSZYSTKICH sprzedaży i kosztów ticka (także wpłat
  // za towar zamkniętych firm z komisu) każda firma wypłaca właścicielowi
  // min(wynik zatrzymany, gotówka − bufor). Kwoty liczone ze stanu sprzed
  // jakiejkolwiek wypłaty (firma-właściciel wypłaci otrzymane środki dopiero w
  // następnym ticku), raz na tick -- handel (krok 10) przenosi tylko towar i
  // własność w komisie, nie pieniądze, więc nie ma drugiego naliczenia.
  // Gospodarstwa wydają otrzymane środki od następnego ticka.
  {
    // Etap 4B: `profit` = wypłata zysku (zmniejsza wynik zatrzymany);
    // `capital` = zwrot kapitału przy likwidacji (nie zysk, nie przychód).
    const payouts: {
      companyId: string;
      amount: number;
      recipient: OwnerPayoutTarget;
      kind: "profit" | "capital";
    }[] = [];
    for (const companyId of Object.keys(companies).sort()) {
      const company = companies[companyId]!;
      const operatingCostHistory = recordOperatingCosts(
        company.finance.operatingCostHistory,
        operatingCostOf(companyId),
      );
      let withHistory: Company = {
        ...company,
        finance: { ...company.finance, operatingCostHistory },
      };
      companies[companyId] = withHistory;

      // Etap 4B -- likwidacja: zamknięta firma (pracownicy już zwolnieni, N1)
      // po rozliczeniu zobowiązań tego ticka oddaje właścicielowi całą wolną
      // gotówkę: niewypłacony zysk + zwrot kapitału. Gotówka spada do 0, więc
      // nic nie wraca drugi raz; późniejsze wpływy z komisu najpierw pokrywają
      // ewentualną ujemną gotówkę, potem są zwykłym zyskiem. Brak odbiorcy --
      // gotówka zostaje w firmie, fakt jeden raz (bez zastępczej rodziny).
      if (!withHistory.status.active) {
        const liquidation = liquidationSplit(withHistory);
        if (liquidation.profit + liquidation.capital <= 0) continue;
        const recipient = resolveOwnerRecipient(withHistory, populationCohorts, companies);
        if (!recipient) {
          if (withHistory.ai.activeStates.liquidation_unclaimed !== true) {
            withHistory = {
              ...withHistory,
              ai: {
                ...withHistory.ai,
                activeStates: { ...withHistory.ai.activeStates, liquidation_unclaimed: true },
              },
            };
            companies[companyId] = withHistory;
            facts.push({
              type: "capital_return_unclaimed",
              subject: { entityType: "company", entityId: companyId },
              location: { regionId: withHistory.regionId },
              values: { before: withHistory.finance.cash, after: withHistory.finance.cash },
            });
            causalLinks.push({
              targetIndex: facts.length - 1,
              source: { kind: "external", key: `company:${companyId}:owner` },
              type: "CONSTRAINING",
              factor: { key: "owner_unavailable", contribution: withHistory.finance.cash },
              mechanism:
                "właściciel zamkniętej firmy nie istnieje albo nie ma skarbu -- brak odbiorcy zwrotu",
              system: "liquidation",
            });
          }
          continue;
        }
        if (liquidation.profit > 0)
          payouts.push({ companyId, amount: liquidation.profit, recipient, kind: "profit" });
        if (liquidation.capital > 0)
          payouts.push({ companyId, amount: liquidation.capital, recipient, kind: "capital" });
        continue;
      }

      const buffer = operatingBuffer(
        operatingCostHistory,
        nextTickObligationsByCompanyId[companyId] ?? 0,
      );
      const eligible = ownerPayoutAmount(withHistory, buffer);
      if (eligible <= 0) continue;
      // P13: przy aktywnym planie rozbudowy część nadwyżki trafia do rezerwy
      // (gotówka zostaje w firmie, niedostępna do wypłaty), reszta do
      // właściciela; rezerwa nie przekracza kosztu jednej rozbudowy.
      const reserve = withHistory.finance.investmentReserve ?? 0;
      const surplus = splitSurplus(
        eligible,
        reserve,
        constructionProfile && withHistory.ai.activeStates.expansion_plan === true
          ? EXPANSION_CAPITAL_COST
          : undefined,
      );
      if (surplus.toReserve > 0) {
        const after = roundMoney(reserve + surplus.toReserve);
        withHistory = {
          ...withHistory,
          finance: { ...withHistory.finance, investmentReserve: after },
        };
        companies[companyId] = withHistory;
        facts.push({
          type: "investment_reserved",
          subject: { entityType: "company", entityId: companyId },
          location: { regionId: withHistory.regionId },
          values: { before: reserve, after, delta: surplus.toReserve },
        });
        causalLinks.push({
          targetIndex: facts.length - 1,
          source: { kind: "external", key: `company:${companyId}:expansion_plan` },
          type: "ENABLING",
          factor: { key: "active_expansion_plan", contribution: surplus.toReserve },
          mechanism: "aktywny plan rozbudowy -- część nadwyżki odłożona na jego finansowanie",
          system: "investment-reserve",
        });
      }
      if (surplus.payout <= 0) continue;
      const recipient = resolveOwnerRecipient(withHistory, populationCohorts, companies);
      if (!recipient) continue;
      payouts.push({ companyId, amount: surplus.payout, recipient, kind: "profit" });
    }
    for (const { companyId, amount, recipient, kind } of payouts) {
      const company = companies[companyId]!;
      const cashAfter = roundMoney(company.finance.cash - amount);
      companies[companyId] = {
        ...company,
        finance: {
          ...company.finance,
          cash: cashAfter,
          retainedEarnings:
            kind === "profit"
              ? roundMoney(company.finance.retainedEarnings - amount)
              : company.finance.retainedEarnings,
          investmentReserve: company.status.active ? (company.finance.investmentReserve ?? 0) : 0,
        },
      };
      facts.push({
        type: kind === "profit" ? "company_owner_payout" : "company_capital_returned",
        subject: { entityType: "company", entityId: companyId },
        location: { regionId: company.regionId },
        values: { before: company.finance.cash, after: cashAfter, delta: -amount },
      });
      const payoutIndex = facts.length - 1;
      const financeIndex = financeFactIndexByCompanyId[companyId];
      causalLinks.push({
        targetIndex: payoutIndex,
        source:
          kind === "capital"
            ? { kind: "external", key: `company:${companyId}:closed` }
            : financeIndex !== undefined
              ? { kind: "sameBatch", index: financeIndex }
              : { kind: "external", key: `company:${companyId}:retained_earnings` },
        type: kind === "capital" ? "DIRECT" : "ENABLING",
        factor:
          kind === "capital"
            ? { key: "liquidation_capital", contribution: amount }
            : { key: "retained_earnings", contribution: company.finance.retainedEarnings },
        mechanism:
          kind === "capital"
            ? "zamknięta firma zwraca właścicielowi wolną gotówkę (zwrot kapitału)"
            : "niewypłacony wynik zatrzymany ponad bufor operacyjny wypłacony właścicielowi",
        system: kind === "capital" ? "liquidation" : "owner-income",
      });
      let receivedFact: FactInput;
      if (recipient.kind === "cohort") {
        const cohort = populationCohorts[recipient.id]!;
        const after = roundMoney(cohort.savings + amount);
        populationCohorts[recipient.id] = { ...cohort, savings: after };
        receivedFact = {
          type: kind === "profit" ? "owner_income_received" : "capital_return_received",
          subject: { entityType: "populationCohort", entityId: cohort.id },
          location: {
            regionId: cohort.regionId,
            ...(cohort.settlementId !== undefined ? { settlementId: cohort.settlementId } : {}),
          },
          values: { before: cohort.savings, after, delta: amount },
        };
      } else {
        const owner = companies[recipient.id]!;
        const after = roundMoney(owner.finance.cash + amount);
        companies[recipient.id] = {
          ...owner,
          finance: {
            ...owner.finance,
            cash: after,
            // Dywidenda od firmy zależnej to wynik właściciela; zwrot kapitału
            // przy likwidacji -- nie (wraca zainwestowany kapitał).
            retainedEarnings:
              kind === "profit"
                ? roundMoney(owner.finance.retainedEarnings + amount)
                : owner.finance.retainedEarnings,
          },
        };
        receivedFact = {
          type: kind === "profit" ? "owner_income_received" : "capital_return_received",
          subject: { entityType: "company", entityId: owner.id },
          location: { regionId: owner.regionId },
          values: { before: owner.finance.cash, after, delta: amount },
        };
      }
      facts.push(receivedFact);
      causalLinks.push({
        targetIndex: facts.length - 1,
        source: { kind: "sameBatch", index: payoutIndex },
        type: "DIRECT",
        factor: { key: kind === "profit" ? "owner_payout" : "capital_return", contribution: amount },
        mechanism:
          kind === "profit"
            ? `wypłata zysku firmy ${companyId} właścicielowi`
            : `zwrot kapitału zamkniętej firmy ${companyId} właścicielowi`,
        system: kind === "profit" ? "owner-income" : "liquidation",
      });
    }
  }

  // 11. Migracja (M13, AI-09): probabilistyczna reakcja na push/pull między
  // bezpośrednio połączonymi regionami (POP-006/POP-007) -- patrz
  // population/migration.ts's doc comment. Uruchamiana PO pętli regionów,
  // żeby `Region.cached.migrationAttraction` był świeży (ten tick, nie
  // poprzedni) dla KAŻDEGO regionu, nie tylko tych wcześniejszych w
  // sortowanej kolejności iteracji kroku 3-9.5. Demografia już policzona
  // (krok 2, na początku ticka) -- migracja więc operuje na populacji PO
  // urodzeniach/zgonach/starzeniu tego miesiąca, nie sprzed nich
  // (audytowe P0-06).
  const migrationResult = runMigrationPass({
    regions,
    connections,
    settlements: worldState.settlements,
    populationCohorts,
    tick,
    rng: migrationRng,
    migrationAttractionBreakdownByRegionId,
  });
  populationCohorts = migrationResult.populationCohorts;
  {
    const baseIndex = facts.length;
    facts.push(...migrationResult.facts);
    causalLinks.push(...offsetCausalLinks(migrationResult.causalLinks, baseIndex));
  }

  // 11.5 Uzgodnienie zatrudnienia firm z realną podażą pracy regionu
  // (audytowe P0-05, "Company headcount reconciliation"). Migracja (krok
  // 11, tuż wyżej) -- ostatni krok zmieniający populację/zatrudnienie tego
  // ticka -- właśnie mogła zmniejszyć region's `eligibleLaborForce`
  // poniżej sumy `Company.workforce.employees`. Demografia (krok 2) i
  // migracja korygują TYLKO `cohort.employment` (własne pole), nic nie
  // wiedzą o Company (M9's świadoma granica, patrz demography.ts). M7-M11
  // audyt (Etap 3) zakładał, że kolejny tick's `decideLabor` sam to
  // nadgoni zwykłym LAYOFF -- w praktyce nie nadgania: firma z dodatnią
  // marżą nigdy dobrowolnie nie zwalnia, więc fantomowi pracownicy
  // przetrwaliby w nieskończoność (M12-M14 audyt, fixture 120 ticków). Ten
  // krok wymusza deterministyczny, przymusowy layoff nadwyżki -- dokładnie
  // ten sam mechanizm (`layoffWorkers`, firmy i kohorty w kolejności
  // sortowanej id) co zwykła decyzja LAYOFF w kroku 4 wyżej, tylko
  // wywołany bezwarunkowo na nadwyżkę ponad `eligibleLaborForce`, nie na
  // decyzji AI. Grupowanie na żywo z `populationCohorts`/`companies` (nie
  // z `region.population.cohortIds`/`region.economy.companyIds` -- te
  // cache'e są sprzed migracji/demografii tego ticka, ten sam "obserwuj
  // na żywo" wzorzec co krok 12 niżej).
  {
    const cohortIdsByRegionId = new Map<string, string[]>();
    for (const cohort of Object.values(populationCohorts)) {
      const list = cohortIdsByRegionId.get(cohort.regionId);
      if (list) list.push(cohort.id);
      else cohortIdsByRegionId.set(cohort.regionId, [cohort.id]);
    }
    const companyIdsByRegionId = new Map<string, string[]>();
    for (const company of Object.values(companies)) {
      if (!company.status.active) continue;
      const list = companyIdsByRegionId.get(company.regionId);
      if (list) list.push(company.id);
      else companyIdsByRegionId.set(company.regionId, [company.id]);
    }

    for (const regionId of regionIds) {
      const regionCohortIds = (cohortIdsByRegionId.get(regionId) ?? []).sort();
      const regionCompanyIds = (companyIdsByRegionId.get(regionId) ?? []).sort();
      if (regionCompanyIds.length === 0) continue;

      const regionEligibleLaborForce = regionLaborForce(
        regionCohortIds.map((id) => populationCohorts[id]!),
      );
      const regionCompanyEmployees = regionCompanyIds.reduce(
        (sum, id) => sum + companies[id]!.workforce.employees,
        0,
      );
      let excess = regionCompanyEmployees - regionEligibleLaborForce;
      if (excess <= 0) continue;

      for (const companyId of regionCompanyIds) {
        if (excess <= 0) break;
        let company = companies[companyId]!;
        for (const cohortId of regionCohortIds) {
          if (excess <= 0) break;
          const cohort = populationCohorts[cohortId]!;
          const count = Math.min(excess, company.workforce.employees, cohort.employment);
          if (count <= 0) continue;
          const layoffResult = layoffWorkers({ company, cohort, count });
          company = layoffResult.company;
          populationCohorts[cohortId] = layoffResult.cohort;
          {
            const baseIndex = facts.length;
            facts.push(...layoffResult.facts);
            causalLinks.push(...offsetCausalLinks(layoffResult.causalLinks, baseIndex));
          }
          excess -= count;
        }
        companies[companyId] = company;
      }
    }
  }

  // 12. Settlement Growth (M14, `society/settlements`): SettlementPressure
  // + stage transitions + housing (capacity/cost/pressure) -- ostatni krok
  // przed commit, żeby osady reagowały na w pełni rozliczoną populację
  // tego ticka (po migracji I demografii), nie na stan sprzed żadnej z nich.
  // Population/employment liczone świeżo z finalnych map (a nie z
  // `Region.population`/`Settlement.economy`, które i tak są tylko
  // cache'em odtwarzanym przez `createWorldState` na końcu -- ten sam
  // "obserwuj na żywo, nie z martwego cache" wzorzec co migrationAttraction
  // w kroku 9.5).
  const companiesBySettlementId = new Map<string, Company[]>();
  for (const company of Object.values(companies)) {
    if (company.settlementId === undefined || !company.status.active) continue;
    const existing = companiesBySettlementId.get(company.settlementId);
    if (existing) existing.push(company);
    else companiesBySettlementId.set(company.settlementId, [company]);
  }
  const populationBySettlementId = new Map<string, number>();
  // Bezrobotni, zdolni do pracy mieszkańcy per settlement (audytowy P1-03)
  // -- twardy limit wzrostu housing.capacity, ten sam "no free creation"
  // wzorzec co P0-05's eligibleLaborForce dla zatrudnienia kohorty.
  const availableConstructionLaborBySettlementId = new Map<string, number>();
  for (const cohort of Object.values(populationCohorts)) {
    if (cohort.settlementId === undefined) continue;
    populationBySettlementId.set(
      cohort.settlementId,
      (populationBySettlementId.get(cohort.settlementId) ?? 0) + cohort.population,
    );
    availableConstructionLaborBySettlementId.set(
      cohort.settlementId,
      (availableConstructionLaborBySettlementId.get(cohort.settlementId) ?? 0) +
        availableWorkers(cohort),
    );
  }

  // SET-LIFECYCLE-001: fakty tego ticka, które zmniejszyły populację osady
  // (zgony z demografii, wyjazdy z migracji) -- przyczyny ewentualnego
  // porzucenia osady, podłączane przez `sameBatch` (indeksy tej tablicy).
  const populationLossFactIndicesBySettlementId = new Map<string, number[]>();
  facts.forEach((fact, index) => {
    const settlementId = fact.location.settlementId;
    if (
      settlementId === undefined ||
      (fact.type !== "population_declined" && fact.type !== "population_migrated_out")
    )
      return;
    const list = populationLossFactIndicesBySettlementId.get(settlementId);
    if (list) list.push(index);
    else populationLossFactIndicesBySettlementId.set(settlementId, [index]);
  });

  for (const regionId of regionIds) {
    const region = regions[regionId]!;
    const allSettlementIds = [...region.settlements.settlementIds].sort();
    if (allSettlementIds.length === 0) continue;

    // SET-LIFECYCLE-001: aktywna osada z populacją dokładnie 0 w TYM ticku
    // przechodzi ACTIVE → ABANDONED (raz; fakt `settlement_abandoned`).
    // ABANDONED pozostaje encją historyczną, ale nie uczestniczy we wzroście,
    // housingu ani presji osadniczej.
    for (const settlementId of allSettlementIds) {
      const settlement = settlements[settlementId];
      if (!settlement) continue;
      const abandonment = evaluateSettlementAbandonment({
        settlement,
        tick,
        population: populationBySettlementId.get(settlementId) ?? 0,
        populationLossFactIndices:
          populationLossFactIndicesBySettlementId.get(settlementId) ?? [],
      });
      if (!abandonment) continue;
      settlements[settlementId] = abandonment.settlement;
      const baseIndex = facts.length;
      facts.push(...abandonment.facts);
      // Tylko `targetIndex` jest względny -- `sameBatch.index` to już indeksy `facts`.
      causalLinks.push(
        ...abandonment.causalLinks.map((link) => ({
          ...link,
          targetIndex: link.targetIndex + baseIndex,
        })),
      );
    }
    const settlementIds = allSettlementIds.filter((id) => {
      const settlement = settlements[id];
      return settlement !== undefined && isSettlementActive(settlement);
    });
    if (settlementIds.length === 0) {
      // Region bez aktywnej osady: ten sam stan co region bez osad (presja 0).
      regions[regionId] = {
        ...region,
        cached: { ...region.cached, settlementPressure: 0 },
      };
      continue;
    }

    let infrastructureSum = 0;
    let utilizationSum = 0;
    let connectionCount = 0;
    for (const connectionId of region.connections.connectionIds) {
      const connection = connections[connectionId];
      if (!connection) continue;
      infrastructureSum += connection.infrastructure.level;
      utilizationSum += connection.currentState.utilization;
      connectionCount += 1;
    }
    const infrastructureLevel =
      connectionCount > 0 ? infrastructureSum / connectionCount : 0;
    const tradeUtilization = connectionCount > 0 ? utilizationSum / connectionCount : 0;

    let urbanizationPressureSum = 0;
    for (const settlementId of settlementIds) {
      const settlement = settlements[settlementId];
      if (!settlement) continue;

      const population = populationBySettlementId.get(settlementId) ?? 0;
      const employment = (companiesBySettlementId.get(settlementId) ?? []).reduce(
        (sum, company) => sum + company.workforce.employees,
        0,
      );

      const growthResult = evaluateSettlementGrowth({
        settlement,
        tick,
        availableConstructionLabor:
          availableConstructionLaborBySettlementId.get(settlementId) ?? 0,
        signals: {
          stage: settlement.stage,
          population,
          employment,
          tradeUtilization,
          infrastructureLevel,
          housingCapacity: settlement.housing.capacity,
        },
      });
      // Audytowe P1-07: `employment` był dotąd liczony tylko na potrzeby
      // `signals` (presja/awans), nigdy nie zapisywany z powrotem --
      // `Settlement.economy.employment` zostawało martwe (zawsze 0).
      settlements[settlementId] = {
        ...growthResult.settlement,
        economy: { ...growthResult.settlement.economy, employment },
      };
      {
        const baseIndex = facts.length;
        facts.push(...growthResult.facts);
        causalLinks.push(...offsetCausalLinks(growthResult.causalLinks, baseIndex));
      }
      urbanizationPressureSum += growthResult.pressure.urbanizationPressure;
    }

    regions[regionId] = {
      ...region,
      cached: {
        ...region.cached,
        settlementPressure: urbanizationPressureSum / settlementIds.length,
      },
    };
  }

  // 13. Architect Influence regeneracja (M16, `architect/influence`):
  // proste, bezwarunkowe per-tick zwiększenie balansu gracza (SS164/
  // OPEN-002, TODO tuning tempa) -- niezależne od wszystkiego powyżej, nie
  // potrzebuje RNG ani stanu regionu. `interventions` przechodzi niżej do
  // `createWorldState` niezmienione -- `applyArchitectIntervention` (poza
  // tick loopem, SS173's Command) jest jedynym miejscem, które je tworzy.
  const nextArchitectInfluence = tickArchitectInfluence(worldState.architectInfluence);

  // VALIDATE -> COMMIT (SIM-004): reużywa `createWorldState`'s istniejący,
  // przetestowany walidator referencji zamiast pisać nowy. `world` dotąd
  // przechodził bez zmian -- `WorldRunner.tick` szedł do przodu, ale
  // `World.currentTick`/`currentDate` zostawały zamrożone na starcie
  // (audytowe P1-04, dwa niespójne źródła czasu -- `WorldSummaryReadModel`
  // czyta właśnie te pola). SIM-001: 1 tick = 1 miesiąc, więc data zawsze
  // przesuwa się o dokładnie jeden miesiąc na wywołanie, niezależnie od
  // liczbowej wartości `tick`.
  const nextWorld = {
    ...worldState.world,
    currentTick: tick + 1,
    currentDate: advanceCalendarDate(worldState.world.currentDate),
  };
  const nextWorldState = createWorldState({
    world: nextWorld,
    continents: Object.values(worldState.continents),
    regions: Object.values(regions),
    connections: Object.values(connections),
    resourceDeposits: Object.values(resourceDeposits),
    settlements: Object.values(settlements),
    populationCohorts: Object.values(populationCohorts),
    companies: Object.values(companies),
    markets: Object.values(markets),
    inventories: Object.values(inventories),
    technologyStates: Object.values(technologyStates),
    architectInfluence: nextArchitectInfluence,
    interventions: Object.values(worldState.interventions),
  });

  return { worldState: nextWorldState, facts, causalLinks };
}

/**
 * Etap 4B: założenie usługodawcy z kapitałem inwestora. Inwestor = rodzina
 * kohort regionu z największymi oszczędnościami (remis: id); jej saldo musi
 * pokryć `capitalRequirement`. Kapitał schodzi z oszczędności członków rodziny
 * (proporcjonalnie, co do grosza) i pojawia się jako gotówka firmy;
 * właściciel = najliczniejsza żyjąca kohorta tej rodziny (istniejący model
 * `ownerType: individual`). Brak inwestora albo kapitału -- brak firmy.
 */
function foundServiceCompany(args: {
  readonly profile: ServiceProviderProfile;
  readonly region: Region;
  readonly tick: number;
  readonly liveCohorts: readonly PopulationCohort[];
  readonly settlements: Readonly<Record<string, Settlement>>;
  readonly initialWageOffer: number;
  readonly requestedUnits: number;
}):
  | {
      readonly company: Company;
      readonly inventory: Inventory;
      readonly cohorts: readonly PopulationCohort[];
      readonly facts: readonly FactInput[];
    }
  | undefined {
  const { profile, region, tick } = args;
  const families = groupCohortsIntoFamilies(args.liveCohorts)
    .map((family) =>
      Object.values(family)
        .filter((c) => args.liveCohorts.some((live) => live.id === c.id))
        .sort((a, b) => a.id.localeCompare(b.id)),
    )
    .filter((members) => members.length > 0 && members.some((c) => c.population > 0));
  const ranked = families
    .map((members) => ({
      members,
      savings: roundMoney(members.reduce((sum, c) => sum + c.savings, 0)),
    }))
    .sort((a, b) => b.savings - a.savings || a.members[0]!.id.localeCompare(b.members[0]!.id));
  const investor = ranked[0];
  if (!investor || investor.savings < profile.capitalRequirement) return undefined;
  const owner = [...investor.members]
    .filter((c) => c.population > 0)
    .sort((a, b) => b.population - a.population || a.id.localeCompare(b.id))[0]!;
  const capital = roundMoney(profile.capitalRequirement);
  const deductions =
    capital > 0
      ? splitMoney(
          capital,
          investor.members.map((c) => [c.id, c.savings] as const),
        )
      : {};
  const cohorts = investor.members.map((c) => ({
    ...c,
    savings: roundMoney(c.savings - (deductions[c.id] ?? 0)),
  }));
  if (cohorts.some((c) => c.savings < 0)) return undefined;

  const companyId = `company_${profile.archetypeId}_${region.id}_t${tick}`;
  const inventoryId = `inventory_${companyId}`;
  const settlementId = [...region.settlements.settlementIds]
    .filter((id) => {
      const settlement = args.settlements[id];
      return settlement !== undefined && isSettlementActive(settlement);
    })
    .sort()[0];
  const base = createCompany({
    id: companyId,
    archetypeId: profile.archetypeId,
    // TODO content -- brak generatora nazw firm (jak przy M12).
    name: `New ${profile.archetypeId} (${region.name})`,
    foundedTick: tick,
    regionId: region.id,
    ...(settlementId !== undefined ? { settlementId } : {}),
    ownerType: "individual",
    ownerEntityId: owner.id,
    inventoryId,
    initialCash: capital,
    initialWageOffer: args.initialWageOffer,
  });
  const company: Company = {
    ...base,
    market: {
      ...base.market,
      expectedDemand: { [SERVICE_DEMAND_KEY]: args.requestedUnits },
    },
  };
  const inventory = createInventory({
    id: inventoryId,
    ownerType: "company",
    ownerId: companyId,
    locationRegionId: region.id,
  });
  const facts: FactInput[] = [
    {
      type: "service_company_founded",
      subject: { entityType: "company", entityId: companyId },
      location: { regionId: region.id },
      values: { before: 0, after: 1 },
    },
    {
      type: "founding_capital_invested",
      subject: { entityType: "populationCohort", entityId: owner.id },
      location: { regionId: region.id },
      values: { before: investor.savings, after: roundMoney(investor.savings - capital), delta: -capital },
    },
  ];
  return { company, inventory, cohorts, facts };
}

function evaluatePmAdoptionSafely(args: {
  readonly company: Company;
  readonly tick: number;
  readonly currentRecipe: ProductionRecipe;
  readonly candidateRecipe: ProductionRecipe;
  readonly prices: Readonly<Record<string, number>>;
}): {
  readonly company: Company;
  readonly adopted: boolean;
  readonly snapshot: DecisionSnapshot | undefined;
} {
  // conversionCost stays 0 (TODO tuning/content -- no cost model exists
  // yet for switching production methods); evaluatePmAdoption itself
  // still enforces cooldown/persistence/hard eligibility on cash.
  const result = evaluatePmAdoption({ ...args, conversionCost: 0 });
  return { company: result.company, adopted: result.adopted, snapshot: result.snapshot };
}

/**
 * Etap 4B (Canonical §52L): kontekst płatnego przewozu. Przewoźnik = aktywna
 * firma transportowa w regionie importera albo eksportera (najpierw
 * importera), z wolną zdolnością w tym ticku. Właściciel towaru (producent w
 * komisie) finansuje przewóz przed sprzedażą -- opłata jest jego kosztem
 * operacyjnym w tym ticku, przychodem przewoźnika w tym samym rozliczeniu.
 */
interface TransportContext {
  /** Czy przewóz jest płatną usługą (profil transportu w konfiguracji). */
  readonly enabled: boolean;
  readonly companies: Record<string, Company>;
  readonly isCarrier: (company: Company) => boolean;
  readonly capacityRemaining: Record<string, number>;
  /** Opłaty należne od właścicieli towaru (koszt operacyjny). */
  readonly feesOwed: Record<string, number>;
  /** Przychody firm z tego ticka (tu: przychód przewoźnika). */
  readonly serviceRevenue: Record<string, number>;
  /** Koszt płac w tym ticku -- ogranicza środki właściciela na opłaty. */
  readonly laborCost: Readonly<Record<string, number>>;
  /** Zgłoszony popyt na usługę (jednostki) -- plan zatrudnienia przewoźnika. */
  readonly serviceDemand: Record<string, number>;
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
  readonly causalLinks: PendingCausalLink[];
  /** P14: niezrealizowane, finansowo pokryte zamówienia importerów (zmniejszane po każdym przepływie). */
  readonly importOrders: Record<string, ImportOrders>;
  /** P14: pozostała nadwyżka eksporterów w tym ticku (`${marketId}:${goodId}`). */
  readonly remainingExport: Record<string, number>;
  readonly transport: TransportContext;
}

/** Ocenia i fizycznie rozlicza jeden kierunek handlu (importer = strona przekazana jako "importing"). */
function tradeOneDirection(args: TradeOneDirectionArgs): Connection {
  const exportingGood = args.markets[args.exportingMarketId]!.goods[args.goodId];
  const importingGood = args.markets[args.importingMarketId]!.goods[args.goodId];
  if (!exportingGood || !importingGood) return args.connection;
  const transport = args.transport;

  // P14 (2026-10-01): zamówienie importu = niezaspokojone potrzeby z pokryciem
  // w środkach kupujących (krok 7b) minus towar, który już leży w magazynie
  // importera -- ta sama oferta i to samo zamówienie nie są liczone dwa razy
  // (także przez kilka połączeń). Ilość ogranicza cena oferty (etap 4B: cena
  // towaru + opłata za przewóz -- ta sama, którą zapłaci kupujący),
  // przepustowość i nadwyżka eksportera. Rynek bez śledzonych zamówień --
  // zachowanie sprzed P14 (popyt − oferty).
  const orders = args.importOrders[`${args.importingMarketId}:${args.goodId}`];
  const importerStock = args.importingRegionInventoryId
    ? (args.inventories[args.importingRegionInventoryId]?.items[args.goodId]?.quantity ?? 0)
    : 0;
  const desiredImportQuantity = orders
    ? Math.max(0, orders.unmetNeed - importerStock)
    : Math.max(0, importingGood.demand - (importingGood.offered ?? importingGood.supply));
  const exportKey = `${args.exportingMarketId}:${args.goodId}`;
  const exportableLimit = args.remainingExport[exportKey];
  const tradeResult = evaluateTradeFlow({
    connection: args.connection,
    exportingGood,
    importingGood,
    transportMode: args.transportMode,
    desiredImportQuantity,
    ...(orders ? { buyerFunds: orders.funds } : {}),
    importerHasNoOffers: importingGood.offered === 0,
    chargeTransport: transport.enabled,
    ...(exportableLimit !== undefined ? { exportableLimit } : {}),
  });
  {
    const baseIndex = args.facts.length;
    args.facts.push(...tradeResult.facts);
    args.causalLinks.push(...offsetCausalLinks(tradeResult.causalLinks, baseIndex));
  }

  // M21-VIS-R4B (Handel): rozliczenie fizyczne liczone PRZED faktem, żeby
  // `trade_flow_active` niósł ilość faktycznie przeniesioną między
  // inventory (`settleTradeFlow` ogranicza ją do realnego stocku), a nie
  // ilość ocenioną przez `evaluateTradeFlow` -- to drugie byłoby
  // zamówieniem, nie dostawą. Brak regionalnego inventory = brak ruchu.
  const exportingStore = args.exportingRegionInventoryId
    ? args.inventories[args.exportingRegionInventoryId]
    : undefined;
  const exportingStockBefore = exportingStore?.items[args.goodId]?.quantity ?? 0;
  const fee = tradeResult.transportFeePerUnit;

  // Etap 4B: przewóz wymaga przewoźnika z wolną zdolnością i środków
  // właścicieli towaru na opłatę (pro rata do ich części zapasu eksportera).
  let quantity = tradeResult.importedQuantity;
  let carriers: Company[] = [];
  if (transport.enabled && quantity > 0) {
    const importerRegionId = args.markets[args.importingMarketId]!.regionId;
    const exporterRegionId = args.markets[args.exportingMarketId]!.regionId;
    carriers = Object.values(transport.companies)
      .filter(
        (c) =>
          transport.isCarrier(c) &&
          c.status.active &&
          (c.regionId === importerRegionId || c.regionId === exporterRegionId),
      )
      .sort(
        (a, b) =>
          Number(b.regionId === importerRegionId) - Number(a.regionId === importerRegionId) ||
          a.id.localeCompare(b.id),
      );
    const requested = quantity;
    if (carriers.length > 0) {
      const preferred = carriers[0]!.id;
      transport.serviceDemand[preferred] = (transport.serviceDemand[preferred] ?? 0) + requested;
    } else {
      // Brak przewoźnika: zamówienie niezrealizowane -- sygnał dla założenia
      // firmy transportowej w regionie importera (`importDemand`).
      const importing = args.markets[args.importingMarketId]!;
      const good = importing.goods[args.goodId]!;
      args.markets[args.importingMarketId] = {
        ...importing,
        goods: {
          ...importing.goods,
          [args.goodId]: { ...good, importDemand: good.importDemand + requested },
        },
      };
    }
    const carrierCapacity = carriers.reduce(
      (sum, c) => sum + (transport.capacityRemaining[c.id] ?? 0),
      0,
    );
    let fundedByOwners = Number.POSITIVE_INFINITY;
    if (fee > 0 && exportingStore && exportingStockBefore > 0) {
      for (const [ownerId, owned] of Object.entries(consignmentOf(exportingStore, args.goodId))) {
        const share = Math.min(owned, exportingStockBefore) / exportingStockBefore;
        if (!(share > 0)) continue;
        const owner = transport.companies[ownerId];
        const available = owner
          ? owner.finance.cash -
            (transport.laborCost[ownerId] ?? 0) -
            (transport.feesOwed[ownerId] ?? 0)
          : 0;
        fundedByOwners = Math.min(fundedByOwners, Math.max(0, available) / (share * fee));
      }
    }
    quantity = Math.max(0, Math.min(quantity, carrierCapacity, fundedByOwners));
  }

  const settleResult =
    quantity > 0 && args.exportingRegionInventoryId && args.importingRegionInventoryId
      ? settleTradeFlow({
          exportingInventory: args.inventories[args.exportingRegionInventoryId]!,
          importingInventory: args.inventories[args.importingRegionInventoryId]!,
          goodId: args.goodId,
          desiredQuantity: quantity,
        })
      : undefined;

  // N3 (etap 1): zamówienie importera (ilość oceniona, możliwa do
  // rozliczenia -- oba magazyny istnieją) to opłacony popyt na rynku
  // eksportera. Doliczone do popytu tego ticka w historii rynku eksportera,
  // także gdy zapas eksportera nie pozwolił go w pełni zrealizować --
  // inaczej plan eksportera widzi tylko popyt lokalny i handel zanika.
  // Historia popytu służy wyłącznie prognozie planu; cena tego ticka już zapadła.
  if (
    tradeResult.importedQuantity > 0 &&
    args.exportingRegionInventoryId &&
    args.importingRegionInventoryId
  ) {
    const exporting = args.markets[args.exportingMarketId]!;
    const history = exporting.history.rollingDemand[args.goodId] ?? [];
    const ordered = tradeResult.importedQuantity;
    args.markets[args.exportingMarketId] = {
      ...exporting,
      history: {
        ...exporting.history,
        rollingDemand: {
          ...exporting.history.rollingDemand,
          [args.goodId]:
            history.length > 0
              ? [...history.slice(0, -1), history[history.length - 1]! + ordered]
              : [ordered],
        },
      },
    };
  }

  let tradeFactIndex: number | undefined;
  if (settleResult && settleResult.quantityMoved > 0) {
    // M19 (Chronicle `trade_route_emerged`, CH-03): sygnał co tick, w którym
    // połączenie faktycznie przewiozło towar (`quantityMoved`); kumulację w
    // „trasę” robi Chronicle (`ActiveProcessRegistry`).
    args.facts.push({
      type: "trade_flow_active",
      subject: { entityType: "connectionGood", entityId: `${args.connection.id}:${args.goodId}` },
      location: { regionId: args.markets[args.importingMarketId]!.regionId },
      values: { before: 0, after: settleResult.quantityMoved },
    });
    tradeFactIndex = args.facts.length - 1;
  }

  const quantityMoved = settleResult?.quantityMoved ?? 0;
  if (settleResult && quantityMoved > 0) {
    // Etap 2 (N6 min.): własność towaru w komisie przechodzi razem z towarem.
    // Etap 4B: lot dostaje cenę wyładunku = cena lotu u eksportera (towar
    // regionu: cena lokalna eksportera) + opłata za przewóz; tę cenę zapłaci
    // kupujący u importera. Niesprzedany zapas nie daje właścicielowi przychodu.
    const take = takeConsignment(
      settleResult.exportingInventory,
      args.goodId,
      quantityMoved,
      exportingStockBefore,
    );
    let destination = settleResult.importingInventory;
    const ownerIds = Object.keys(take.takenByOwner).sort();
    for (const ownerId of ownerIds) {
      const q = take.takenByOwner[ownerId]!;
      if (!(q > 0)) continue;
      const before = consignmentOf(destination, args.goodId)[ownerId] ?? 0;
      const sourcePrice = exportingStore
        ? lotUnitPrice(exportingStore, args.goodId, ownerId, exportingGood.localPrice)
        : exportingGood.localPrice;
      destination = withLandedPrice(
        addConsignment(destination, args.goodId, ownerId, q),
        args.goodId,
        ownerId,
        before,
        q,
        sourcePrice + fee,
      );
    }
    args.inventories[args.exportingRegionInventoryId!] = pruneLotPrices(
      take.inventory,
      args.goodId,
    );
    args.inventories[args.importingRegionInventoryId!] = destination;
    args.facts.push(...settleResult.facts);

    // Etap 4B: opłaty za przewóz -- właściciel towaru płaci za swoją część
    // (grosze, jedno zaokrąglenie na właściciela); suma trafia do przewoźników
    // proporcjonalnie do przewiezionych przez nich jednostek. Część bez
    // właściciela (zapas sprzed komisu) jest przewożona bez opłaty (luka).
    if (transport.enabled && fee > 0 && carriers.length > 0) {
      let totalFee = 0;
      for (const ownerId of ownerIds) {
        const q = take.takenByOwner[ownerId]!;
        const amount = transactionValue(q, fee);
        if (!(amount > 0)) continue;
        transport.feesOwed[ownerId] = roundMoney((transport.feesOwed[ownerId] ?? 0) + amount);
        totalFee = roundMoney(totalFee + amount);
      }
      const unitsByCarrier: [string, number][] = [];
      let left = quantityMoved;
      for (const carrier of carriers) {
        if (!(left > 0)) break;
        const units = Math.min(left, transport.capacityRemaining[carrier.id] ?? 0);
        if (!(units > 0)) continue;
        transport.capacityRemaining[carrier.id] =
          (transport.capacityRemaining[carrier.id] ?? 0) - units;
        unitsByCarrier.push([carrier.id, units]);
        left -= units;
      }
      const shares = totalFee > 0 ? splitMoney(totalFee, unitsByCarrier) : {};
      for (const [carrierId, amount] of Object.entries(shares).sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        if (!(amount > 0)) continue;
        transport.serviceRevenue[carrierId] = roundMoney(
          (transport.serviceRevenue[carrierId] ?? 0) + amount,
        );
        args.facts.push({
          type: "transport_service_paid",
          subject: { entityType: "company", entityId: carrierId },
          location: { regionId: args.markets[args.importingMarketId]!.regionId },
          values: { before: 0, after: amount, delta: amount },
        });
        args.causalLinks.push({
          targetIndex: args.facts.length - 1,
          source:
            tradeFactIndex !== undefined
              ? { kind: "sameBatch", index: tradeFactIndex }
              : { kind: "external", key: `connection:${args.connection.id}:${args.goodId}` },
          type: "DIRECT",
          factor: { key: "transported_quantity", contribution: quantityMoved },
          mechanism: "właściciel towaru zapłacił przewoźnikowi za faktycznie przewiezioną ilość",
          system: "transport-service",
        });
      }
    }
  }

  // P14: zrealizowany przepływ zmniejsza zamówienia importera (ilość i środki
  // zarezerwowane po cenie oferty) oraz nadwyżkę eksportera w tym ticku.
  if (quantityMoved > 0) {
    if (orders) {
      orders.unmetNeed = Math.max(0, orders.unmetNeed - quantityMoved);
      orders.funds = Math.max(0, orders.funds - quantityMoved * tradeResult.offerUnitPrice);
    }
    const exportable = Math.max(0, exportingGood.supply - exportingGood.demand);
    args.remainingExport[exportKey] = Math.max(
      0,
      (args.remainingExport[exportKey] ?? exportable) - quantityMoved,
    );
  }

  return tradeResult.connection;
}
