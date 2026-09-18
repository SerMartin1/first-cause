import type { Region, RegionEntrepreneurshipState } from "@first-cause/entities";
import { assertNonNegative } from "../../../core/validation.js";
import { clamp, evaluateHysteresisGate } from "./decision-framework.js";
import { buildDecisionSnapshot, type DecisionSnapshot } from "./decision-snapshot.js";
import { marginPerBatch } from "./pm-adoption.js";
import type { ProductionRecipe } from "../production.js";

/**
 * Entrepreneurship AI / Opportunity Scanner (AI-07, AI Decision Model
 * §42-51; Canonical Decisions AI-007/AI-008). New companies are not
 * spawned randomly -- a region periodically scores candidate
 * `CompanyArchetype`s ("Opportunity Scan") and only founds one once the
 * canonical
 * `OpportunityScore = DemandGap + ExpectedMargin + ResourceAccess +
 * LaborAvailability + SkillAvailability + MarketAccess - Competition -
 * Risk - CapitalRequirement` clears a threshold *and* holds long enough
 * (§45 Founding Decision, §84 Anti-Explosion Rules: no instant
 * entry/exit).
 *
 * The "actor" here is a region evaluating an opportunity that has no
 * Company yet, not an existing Company's own AI cycle -- so the
 * hysteresis/cooldown/persistence bookkeeping (the same primitives
 * `decision-framework.ts` gives every M11 module) lives on
 * `Region.entrepreneurship` (keyed by `CompanyArchetype` id) instead of
 * `Company.ai`. `decision-framework.ts`'s stateful helpers are typed
 * specifically for `Company`, so this module carries its own small,
 * structurally-identical variants scoped to
 * `RegionEntrepreneurshipState` rather than widening a shared module's
 * public API for one new caller.
 *
 * `SkillAvailability`/`Risk` are left structurally present but
 * unpopulated (SkillAvailability pinned at 1, Risk at 0) -- the same
 * "structurally faithful, not fully populated" treatment M11 already
 * gives PM Adoption's SkillGap/EnergyRisk/Uncertainty and Lifecycle's
 * MarketGrowth/InputRisk/LaborRisk/MarketRisk: `skillRequirements` (M2)
 * is an `OpenRecordSchema` placeholder bag no M-milestone has given a
 * concrete shape yet.
 *
 * Capital Formation (§46) is explicitly deferred in the spec itself
 * ("Dokładny system finansowania zostanie rozwinięty później"), ale
 * audytowe P0-03 (M12-M14 audyt): deferred detail nie znosi "no money
 * from nothing" (AI §46). `Region.economy.wealth` -- dotąd zupełnie
 * martwe pole, nic go nigdzie w silniku nie zasilało -- jest teraz
 * jedynym, minimalnym, uzgodnionym źródłem: founding wymaga
 * `capitalRequirement <= region.economy.wealth` jako twardego warunku i
 * faktycznie go obciąża (`Region.economy.wealth -= capitalRequirement`
 * w zwracanym regionie). Dopóki żaden system nie zasila tego pola
 * (accrual to osobna, przyszła praca), founding z niezerowym
 * `capitalRequirement` będzie poprawnie zablokowany -- to jest
 * oczekiwane, nie regresja: oba obecne archetypy JSON mają
 * `capitalRequirement = 0`, więc `initialCash` pozostaje 0 tak jak
 * dotąd dla nich, bez zmiany obserwowalnego zachowania dzisiejszego
 * contentu.
 */
const FOUNDING_ACTIVATE_SCORE = 0.55; // TODO tuning -- max feasible pre-clamp score is ~0.9 (weights below), so this sits meaningfully under that ceiling
const FOUNDING_DEACTIVATE_SCORE = 0.3; // TODO tuning
const FOUNDING_COOLDOWN_TICKS = 12; // TODO tuning -- founding is at least as big/irreversible a decision as EXPAND (lifecycle-decision.ts uses the same 12)
const FOUNDING_PERSISTENCE_TICKS = 6; // TODO tuning -- §84 "no instant entry"

const MIN_ECONOMIC_SCALE_BATCHES = 1; // TODO tuning -- §85: a new company starts at exactly one batch's worth of capacity, never founded for less
const FOUNDING_INITIAL_CAPACITY = MIN_ECONOMIC_SCALE_BATCHES;
const FOUNDING_INITIAL_UTILIZATION = 0.5; // TODO tuning -- same starting point Black Mountain's reference fixture uses for an established company
const FOUNDING_INITIAL_WAGE_OFFER = 10; // TODO tuning -- same seed convention as tests/worldgen fixtures' initialWageOffer

const RESOURCE_ACCESS_BATCHES_TARGET = 10; // TODO tuning -- deposit stock this many batches deep already reads as "fully accessible"
const LABOR_ACCESS_BATCHES_TARGET = 1; // TODO tuning -- enough available workers for MIN_ECONOMIC_SCALE_BATCHES already reads as "fully available"
const EXPECTED_MARGIN_NORMALIZATION = 20; // TODO tuning -- per-batch margin this large already reads as "maximally attractive"
const COMPETITION_SATURATION_COMPETITORS = 4; // TODO tuning -- §47/§85: this many same-archetype competitors already saturates the region
const CAPITAL_REQUIREMENT_NORMALIZATION = 1000; // TODO tuning

const ENTREPRENEURSHIP_DECISION_TYPE_PREFIX = "entrepreneurship_founding";

function isOpportunityActive(
  state: RegionEntrepreneurshipState,
  archetypeId: string,
): boolean {
  return state.activeStates[archetypeId] ?? false;
}

function setOpportunityActive(
  state: RegionEntrepreneurshipState,
  archetypeId: string,
  active: boolean,
): RegionEntrepreneurshipState {
  return { ...state, activeStates: { ...state.activeStates, [archetypeId]: active } };
}

function isEntrepreneurshipOnCooldown(
  state: RegionEntrepreneurshipState,
  archetypeId: string,
  currentTick: number,
  cooldownTicks: number,
): boolean {
  const last = state.lastDecision[archetypeId];
  return last !== undefined && currentTick - last < cooldownTicks;
}

function recordEntrepreneurshipDecision(
  state: RegionEntrepreneurshipState,
  archetypeId: string,
  tick: number,
): RegionEntrepreneurshipState {
  return { ...state, lastDecision: { ...state.lastDecision, [archetypeId]: tick } };
}

function updateEntrepreneurshipStreak(
  state: RegionEntrepreneurshipState,
  archetypeId: string,
  conditionHeld: boolean,
): RegionEntrepreneurshipState {
  const next = conditionHeld ? (state.opportunityStreak[archetypeId] ?? 0) + 1 : 0;
  return {
    ...state,
    opportunityStreak: { ...state.opportunityStreak, [archetypeId]: next },
  };
}

function entrepreneurshipPersistenceSatisfied(
  state: RegionEntrepreneurshipState,
  archetypeId: string,
  requiredTicks: number,
): boolean {
  return (state.opportunityStreak[archetypeId] ?? 0) >= requiredTicks;
}

export interface EvaluateFoundingInput {
  readonly region: Region;
  readonly tick: number;
  readonly archetypeId: string;
  readonly recipe: ProductionRecipe;
  readonly capitalRequirement: number;
  /** Good/resource id -> observed price, this region's Market (M8) -- Perceived World State (AI-001). */
  readonly prices: Readonly<Record<string, number>>;
  /** 0..1: caller-observed (e.g. `Market.goods[primaryOutput].shortageSeverity`, or 0 when that good has no `MarketGoodState` yet). */
  readonly demandGapSeverity: number;
  /** Raw unmet quantity (demand - supply, clamped >= 0) of the primary output good this tick -- Minimum Economic Scale gate (§85). */
  readonly unmetDemandQuantity: number;
  /**
   * resourceId -> deposit stock quantity available in the region (0/absent
   * = none). Audytowe P1-01: caller musi już wyzerować wpisy dla depozytów
   * z `discovery.status` innym niż DISCOVERED/ASSESSED -- ta funkcja ufa
   * każdej dodatniej wartości jako fizycznie dostępnej, nie zna samego
   * statusu odkrycia (patrz `economy-tick.ts`'s wywołanie).
   */
  readonly resourceStockByResourceId: Readonly<Record<string, number>>;
  /** goodId -> zapas w regionalnym inventory (0/absent = brak) -- audytowe P1-01, wcześniej goodInputsPerBatch w ogóle nie był sprawdzany. */
  readonly goodStockByGoodId: Readonly<Record<string, number>>;
  /** Unemployed, labor-force-eligible workers available in the region (`labor/employment.ts::availableWorkers`, summed). */
  readonly availableLabor: number;
  /** Existing companies of this same archetype already active in the region. */
  readonly existingCompetitorCount: number;
}

export interface FoundingCompanyDraft {
  readonly archetypeId: string;
  readonly productionMethodId: string;
  readonly initialCapacity: number;
  readonly initialUtilization: number;
  readonly initialCash: number;
  readonly initialWageOffer: number;
}

export interface EvaluateFoundingResult {
  readonly region: Region;
  readonly founded: boolean;
  readonly opportunityScore: number;
  readonly companyDraft: FoundingCompanyDraft | undefined;
  readonly snapshot: DecisionSnapshot | undefined;
}

function primaryOutputQuantityPerBatch(recipe: ProductionRecipe): number {
  const quantities = Object.values(recipe.goodOutputsPerBatch);
  return quantities.length > 0 ? Math.min(...quantities) : 0;
}

/**
 * Canonical `OpportunityScore` (AI-008), weighted and clamped to `[0,1]`
 * the same way `lifecycle-decision.ts`'s `expansionScore`/
 * `contractionScore` are -- a single bounded quantity the hysteresis gate
 * can compare against a threshold.
 */
function computeOpportunityScore(input: {
  readonly demandGapSeverity: number;
  readonly marginPerBatchValue: number;
  readonly resourceAccess: number;
  readonly laborAvailability: number;
  readonly competitionPenalty: number;
  readonly capitalPenalty: number;
}): number {
  const marginScore = clamp(
    Math.max(0, input.marginPerBatchValue) / EXPECTED_MARGIN_NORMALIZATION,
    0,
    1,
  );
  const skillAvailability = 1; // unmodeled placeholder, see module doc comment
  const marketAccess = 1; // caller only evaluates regions that already have a market (see economy-tick.ts wiring)
  const risk = 0; // unmodeled placeholder, see module doc comment

  return clamp(
    0.3 * clamp(input.demandGapSeverity, 0, 1) +
      0.2 * marginScore +
      0.15 * clamp(input.resourceAccess, 0, 1) +
      0.1 * clamp(input.laborAvailability, 0, 1) +
      0.05 * skillAvailability +
      0.1 * marketAccess -
      0.2 * clamp(input.competitionPenalty, 0, 1) -
      0.1 * clamp(input.capitalPenalty, 0, 1) -
      0 * risk,
    0,
    1,
  );
}

export function evaluateFounding(input: EvaluateFoundingInput): EvaluateFoundingResult {
  const { region, tick, archetypeId, recipe } = input;
  const capitalRequirement = assertNonNegative(
    input.capitalRequirement,
    "evaluateFounding().capitalRequirement",
  );
  const availableLabor = assertNonNegative(
    input.availableLabor,
    "evaluateFounding().availableLabor",
  );
  const unmetDemandQuantity = assertNonNegative(
    input.unmetDemandQuantity,
    "evaluateFounding().unmetDemandQuantity",
  );

  let state = region.entrepreneurship;

  const requiredResourceIds = Object.keys(recipe.resourceInputsPerBatch).sort();
  const resourceAccess =
    requiredResourceIds.length === 0
      ? 1
      : requiredResourceIds.reduce((sum, resourceId) => {
          const quantityPerBatch = recipe.resourceInputsPerBatch[resourceId]!;
          const stock = input.resourceStockByResourceId[resourceId] ?? 0;
          const target = quantityPerBatch * RESOURCE_ACCESS_BATCHES_TARGET;
          return sum + (target > 0 ? clamp(stock / target, 0, 1) : 1);
        }, 0) / requiredResourceIds.length;
  const everyRequiredResourceAvailable = requiredResourceIds.every(
    (resourceId) => (input.resourceStockByResourceId[resourceId] ?? 0) > 0,
  );

  // Audytowe P1-01: goodInputsPerBatch (dobra pośrednie, nie surowe
  // zasoby) w ogóle nie były sprawdzane -- firma mogła powstać mimo
  // braku wymaganego, niedostępnego dobra wejściowego.
  const requiredGoodIds = Object.keys(recipe.goodInputsPerBatch).sort();
  const everyRequiredGoodAvailable = requiredGoodIds.every(
    (goodId) => (input.goodStockByGoodId[goodId] ?? 0) > 0,
  );

  // Audytowe P1-01: PM dopuszczający inny archetyp -- ten sam
  // "pusta lista = brak ograniczenia" wzorzec co pm-adoption.ts.
  const archetypeEligibleForRecipe =
    recipe.eligibleCompanyArchetypeIds.length === 0 ||
    recipe.eligibleCompanyArchetypeIds.includes(archetypeId);

  const laborTarget = recipe.employeesPerBatch * LABOR_ACCESS_BATCHES_TARGET;
  const laborAvailability =
    laborTarget > 0 ? clamp(availableLabor / laborTarget, 0, 1) : 1;
  // Audytowe P1-01: `laborAvailability` był tylko miękkim (0.1-wagowym)
  // składnikiem wyniku -- founding przy available labor = 0 wciąż mógł
  // przejść próg aktywacji. `laborTarget` to dokładnie tyle pracy, ile
  // potrzebuje pierwszy batch startowej capacity (MIN_ECONOMIC_SCALE_BATCHES
  // === LABOR_ACCESS_BATCHES_TARGET === FOUNDING_INITIAL_CAPACITY).
  const sufficientLaborAvailable = laborTarget <= 0 || availableLabor >= laborTarget;

  const marginPerBatchValue = marginPerBatch(recipe, input.prices);
  const competitionPenalty =
    input.existingCompetitorCount / COMPETITION_SATURATION_COMPETITORS;
  const capitalPenalty = capitalRequirement / CAPITAL_REQUIREMENT_NORMALIZATION;

  const opportunityScore = computeOpportunityScore({
    demandGapSeverity: input.demandGapSeverity,
    marginPerBatchValue,
    resourceAccess,
    laborAvailability,
    competitionPenalty,
    capitalPenalty,
  });

  const minEconomicScaleQuantity =
    primaryOutputQuantityPerBatch(recipe) * MIN_ECONOMIC_SCALE_BATCHES;
  // Audytowe P0-03: kapitał musi mieć źródło -- region.economy.wealth
  // (patrz doc comment modułu). Audytowe P1-01: praca/dobra pośrednie/
  // zgodność archetypu z PM dołączają jako twarde bramki, tym samym
  // wzorcem co istniejący everyRequiredResourceAvailable.
  const sufficientCapitalAvailable = capitalRequirement <= region.economy.wealth;
  const hardEligible =
    region.population.totalPopulation > 0 &&
    everyRequiredResourceAvailable &&
    everyRequiredGoodAvailable &&
    sufficientLaborAvailable &&
    sufficientCapitalAvailable &&
    archetypeEligibleForRecipe &&
    (minEconomicScaleQuantity <= 0 || unmetDemandQuantity >= minEconomicScaleQuantity);

  const wasActive = isOpportunityActive(state, archetypeId);
  const nowActive = evaluateHysteresisGate({
    score: opportunityScore,
    currentlyActive: wasActive,
    activateThreshold: FOUNDING_ACTIVATE_SCORE,
    deactivateThreshold: FOUNDING_DEACTIVATE_SCORE,
  });
  state = setOpportunityActive(state, archetypeId, nowActive);
  state = updateEntrepreneurshipStreak(state, archetypeId, nowActive);

  const decisionType = `${ENTREPRENEURSHIP_DECISION_TYPE_PREFIX}:${archetypeId}`;
  if (
    nowActive &&
    hardEligible &&
    entrepreneurshipPersistenceSatisfied(
      state,
      archetypeId,
      FOUNDING_PERSISTENCE_TICKS,
    ) &&
    !isEntrepreneurshipOnCooldown(state, archetypeId, tick, FOUNDING_COOLDOWN_TICKS)
  ) {
    state = recordEntrepreneurshipDecision(state, archetypeId, tick);
    return {
      // Audytowe P0-03: firma naprawdę obciąża wspólną pulę kapitału
      // regionu -- nie tworzy `initialCash` z niczego.
      region: {
        ...region,
        entrepreneurship: state,
        economy: {
          ...region.economy,
          wealth: region.economy.wealth - capitalRequirement,
        },
      },
      founded: true,
      opportunityScore,
      companyDraft: {
        archetypeId,
        productionMethodId: recipe.productionMethodId,
        initialCapacity: FOUNDING_INITIAL_CAPACITY,
        initialUtilization: FOUNDING_INITIAL_UTILIZATION,
        initialCash: capitalRequirement,
        initialWageOffer: FOUNDING_INITIAL_WAGE_OFFER,
      },
      snapshot: buildDecisionSnapshot({
        actorId: region.id,
        tick,
        decisionType,
        options: [
          { action: "HOLD", hardEligible: true, score: 0 },
          { action: "FOUND", hardEligible, score: opportunityScore },
        ],
        selectedAction: "FOUND",
        factors: [
          { key: "demand_gap", contribution: input.demandGapSeverity },
          { key: "expected_margin", contribution: marginPerBatchValue },
          { key: "resource_access", contribution: resourceAccess },
          { key: "labor_availability", contribution: laborAvailability },
          { key: "competition", contribution: -competitionPenalty },
          { key: "capital_requirement", contribution: -capitalPenalty },
        ],
      }),
    };
  }

  return {
    region: { ...region, entrepreneurship: state },
    founded: false,
    opportunityScore,
    companyDraft: undefined,
    snapshot: undefined,
  };
}
