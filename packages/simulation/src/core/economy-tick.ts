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
import { sortedEntries } from "./determinism.js";
import { advanceCalendarDate } from "./time.js";
import type { RngStream } from "./rng.js";
import { groupCohortsIntoFamilies } from "../systems/population/cohorts.js";
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
  eligibleLaborForce,
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
import { usableDepositQuantity } from "../systems/resources/deposit-lifecycle.js";
import { evaluateNaturalDepositDiscovery } from "../systems/resources/natural-discovery.js";
import {
  assessFinancialHealth,
  decideLabor,
  decideLifecycle,
  decideProduction,
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
const SURVIVAL_UNITS_PER_CAPITA = 3; // TODO tuning -- ile jednostek dobra "survival" jedna osoba potrzebuje na tick; 0.05 z M8+M9 regression test było skalibrowane pod inny scenariusz (jeden dobrze opłacany pracownik kupujący zboże po cenie 10), nie pod ten fixture
const SURVIVAL_GOOD_ID = "flour"; // TODO content -- Etap 1 hardcoded most kategoria->dobro (pełne mapowanie z contentu to osobna praca, patrz plan sekcja 1)
const DEFAULT_TRANSPORT_MODE_ID = "cart"; // TODO tuning -- fallback gdy connection.infrastructure.transportModes jest puste/niedopasowane

/**
 * M12 (AI-07 Entrepreneurship): jedna para (`CompanyArchetype`,
 * `ProductionMethod`) rozważana przez `evaluateFounding` w każdym
 * regionie. `capitalRequirement` to `CompanyArchetypeDefinition.
 * capitalRequirement` (M2) wprost, bez transformacji.
 */
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
}

export interface RunEconomyTickResult {
  readonly worldState: WorldState;
  readonly facts: readonly FactInput[];
  /** M17 (CE-04..CE-07): rozwiązywane na realne `CausalEdge` przez `core/causal-resolution.ts`, wołane z `WorldRunner.step()`, gdy `facts` ma już realne, przydzielone przez store id. */
  readonly causalLinks: readonly PendingCausalLink[];
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
    const industryAdoptionEvents: IndustryAdoptionEvent[] = [];
    // CE-06 (M17, Test 9): `discoveryId -> outer fact index` faktu
    // `production_method_adopted`, który wygenerował ten event -- krok
    // "Zastosuj industry adoption" (poniżej) linkuje `technology_
    // adoption_increased` do TEGO, nie do samego `discovery_occurred`.
    const productionMethodAdoptedFactIndexByDiscoveryId: Record<string, number> = {};

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
      const companyBeforeLifecycle = company;
      const lifecycleDecision = decideLifecycle({
        company,
        tick,
        financialHealth,
        demandPersistenceScore,
        expectedMargin,
        capitalCost: EXPANSION_CAPITAL_COST,
      });
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

      companies[companyId] = company;
      if (!company.status.active) continue;

      // 4. Rynek pracy: wages -> hire/layoff.
      const availableLabor = cohortIds.reduce(
        (sum, cohortId) => sum + availableWorkers(populationCohorts[cohortId]!),
        0,
      );
      if (company.workforce.wageOffer > 0) {
        const wageResult = adjustWageOffer({ company, availableLabor });
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

      // 6. Rozliczenie sprzedaży (fizyczne + finansowe).
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

      const employeesPaidThisTick = Math.max(
        employeesBeforeLaborAction,
        company.workforce.employees,
      );
      const laborCostThisTick = company.workforce.wageOffer * employeesPaidThisTick;
      const financeResult = applyCompanyFinances({
        company,
        revenue: revenueThisTick,
        costs: laborCostThisTick,
      });
      companies[companyId] = financeResult.company;
      facts.push(...financeResult.facts);
    }

    // 7. Gospodarstwa domowe: dochód -> wydatki -> fizyczny zakup.
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
        {
          const baseIndex = facts.length;
          facts.push(...consumptionResult.facts);
          causalLinks.push(...offsetCausalLinks(consumptionResult.causalLinks, baseIndex));
        }

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
        });
        market = updateResult.market;
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
      const availableLabor = cohortIds.reduce(
        (sum, cohortId) => sum + availableWorkers(populationCohorts[cohortId]!),
        0,
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

    // 9.5 Migration attraction (M13, AI-09): region's own pull/push
    // signal, computed fresh this tick from labor market + housing state
    // (post-entrepreneurship, więc widzi ewentualną nowo założoną firmę),
    // cache'owany w `Region.cached.migrationAttraction` -- `runMigrationPass`
    // (krok 11, po pętli regionów) czyta go i jako źródło, i jako pull
    // każdego kandydata docelowego.
    {
      let vacancies = 0;
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
      const regionEligibleLaborForce = cohortIds.reduce(
        (sum, id) => sum + eligibleLaborForce(populationCohorts[id]!),
        0,
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
      });
    }
    connections[connectionId] = connection;
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

      const regionEligibleLaborForce = regionCohortIds.reduce(
        (sum, id) => sum + eligibleLaborForce(populationCohorts[id]!),
        0,
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
  {
    const baseIndex = args.facts.length;
    args.facts.push(...tradeResult.facts);
    args.causalLinks.push(...offsetCausalLinks(tradeResult.causalLinks, baseIndex));
  }

  // M21-VIS-R4B (Handel): rozliczenie fizyczne liczone PRZED faktem, żeby
  // `trade_flow_active` niósł ilość faktycznie przeniesioną między
  // inventory (`settleTradeFlow` ogranicza ją do realnego stocku), a nie
  // ilość ocenioną przez `evaluateTradeFlow` -- to drugie byłoby
  // zamówieniem, nie dostawą. Kolejność faktów bez zmian (handel, potem
  // inventory). Brak regionalnego inventory = brak fizycznego ruchu.
  const settleResult =
    tradeResult.importedQuantity > 0 &&
    args.exportingRegionInventoryId &&
    args.importingRegionInventoryId
      ? settleTradeFlow({
          exportingInventory: args.inventories[args.exportingRegionInventoryId]!,
          importingInventory: args.inventories[args.importingRegionInventoryId]!,
          goodId: args.goodId,
          desiredQuantity: tradeResult.importedQuantity,
        })
      : undefined;

  if (settleResult && settleResult.quantityMoved > 0) {
    // M19 (Chronicle `trade_route_emerged`, CH-03): a raw per-tick
    // signal that this connection+good actually moved physical volume --
    // `values.after` = `settleTradeFlow(...).quantityMoved` (M21-VIS-R4B:
    // wcześniej `importedQuantity`, które mogło przekraczać realny stock
    // eksportera). Deliberately fires every tick
    // trade flows, not only on change: unlike `extraction.ts`'s
    // `deposit.extraction.currentExtraction`, nothing here persists a
    // "previous tick's flow" to compare against, and inventing that
    // state on `Connection` (which has no per-good slot) is a bigger
    // entity-model change than this fact needs. Whether repeated ticks
    // of the same flow become a Chronicle "route" is `ActiveProcessRegistry`
    // accumulation on the Chronicle side, not a simulation-side concern
    // (same division of labor as `population_migrated_in` -> `migration_wave`).
    args.facts.push({
      type: "trade_flow_active",
      // `<connectionId>:<goodId>`, same "compound entityId for a
      // multiplexed relationship" pattern as `price-adjustment.ts`'s
      // `marketId:goodId` -- one connection can carry many goods, each
      // its own Chronicle-eligible flow.
      subject: { entityType: "connectionGood", entityId: `${args.connection.id}:${args.goodId}` },
      location: { regionId: args.markets[args.importingMarketId]!.regionId },
      values: { before: 0, after: settleResult.quantityMoved },
    });
  }

  if (settleResult) {
    args.inventories[args.exportingRegionInventoryId!] = settleResult.exportingInventory;
    args.inventories[args.importingRegionInventoryId!] = settleResult.importingInventory;
    args.facts.push(...settleResult.facts);
  }

  return tradeResult.connection;
}
