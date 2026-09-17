import type { Company } from "@first-cause/entities";
import { roundMoney } from "../../../core/rounding.js";
import { assertNonNegative } from "../../../core/validation.js";
import {
  clamp,
  evaluateHysteresisGate,
  isActive,
  isOnCooldown,
  persistenceSatisfied,
  recordDecision,
  setActive,
  updateOpportunityStreak,
} from "./decision-framework.js";
import { buildDecisionSnapshot, type DecisionSnapshot } from "./decision-snapshot.js";
import type { CompanyFinancialHealth } from "./financial-health.js";

/**
 * Expansion / Contraction / Closure (AI-06, AI Decision Model SS32-35).
 * The roadmap's HIGH-risk note for M11 singles these out: they are
 * exactly the "duże, trudne do odwrócenia decyzje" SS20/SS21 want a
 * long cooldown and a persistence requirement for, not just a capped/
 * smoothed dial like `production-decision.ts`'s utilization. Closure is
 * checked first and, if triggered, overrides expansion/contraction for
 * that tick (SS23: a dying company does not also grow).
 *
 * `ExpansionScore` (SS32) is `DemandPersistence + Margin + CapacityPressure
 * + MarketGrowth - CapitalCost - InputRisk - LaborRisk - MarketRisk` in
 * the full model; M11 computes the terms it has real signals for today
 * (DemandPersistence, Margin, CapacityPressure, CapitalCost) and leaves
 * MarketGrowth/InputRisk/LaborRisk/MarketRisk at 0 rather than guessing
 * -- the same "structurally faithful, not fully populated" treatment
 * M10 gave `ImportedCost`'s Tariff term.
 */
const EXPANSION_ACTIVATE_SCORE = 0.7; // TODO tuning -- SS19's own example numbers
const EXPANSION_DEACTIVATE_SCORE = 0.4; // TODO tuning
const EXPANSION_COOLDOWN_TICKS = 12; // TODO tuning -- SS20 "expansion -- długi"
const EXPANSION_PERSISTENCE_TICKS = 6; // TODO tuning -- SS21's own example ("6 miesięcy")
const EXPANSION_STEP_FRACTION = 0.25; // TODO tuning
const EXPANSION_MIN_STEP = 1; // TODO tuning -- additive floor when capacity starts at 0

const CONTRACTION_ACTIVATE_SCORE = 0.6; // TODO tuning
const CONTRACTION_DEACTIVATE_SCORE = 0.3; // TODO tuning
const CONTRACTION_COOLDOWN_TICKS = 6; // TODO tuning
const CONTRACTION_PERSISTENCE_TICKS = 3; // TODO tuning
const CONTRACTION_STEP_FRACTION = 0.2; // TODO tuning

const CLOSURE_CASH_RUNWAY_THRESHOLD = 1; // TODO tuning -- SS34 "bardzo niski cash runway"
const CLOSURE_PERSISTENCE_TICKS = 6; // TODO tuning -- SS34 "wymaga silniejszych warunków niż miesięczna strata"
const CLOSURE_COOLDOWN_TICKS = 1; // closure is terminal (SS20); cooldown only guards re-evaluation of an already-closed company

const EXPANSION_DECISION_TYPE = "capacity_expansion";
const CONTRACTION_DECISION_TYPE = "capacity_contraction";
const CLOSURE_DECISION_TYPE = "closure";

export type LifecycleAction = "EXPAND" | "CONTRACT" | "CLOSE" | "HOLD";

export interface DecideLifecycleInput {
  readonly company: Company;
  readonly tick: number;
  readonly financialHealth: CompanyFinancialHealth;
  /** 0..1: how persistently demand has exceeded supply recently (caller-derived, e.g. from Market shortageSeverity history). */
  readonly demandPersistenceScore: number;
  readonly expectedMargin: number;
  /** Cost of one expansion step, compared against `Company.finance.cash`. */
  readonly capitalCost: number;
}

export interface DecideLifecycleResult {
  readonly company: Company;
  readonly action: LifecycleAction;
  /** Present only when EXPAND/CONTRACT/CLOSE actually happens (SS68: not every tick needs one). */
  readonly snapshot: DecisionSnapshot | undefined;
}

export function decideLifecycle(input: DecideLifecycleInput): DecideLifecycleResult {
  const { tick } = input;
  const capitalCost = assertNonNegative(
    input.capitalCost,
    "decideLifecycle().capitalCost",
  );
  let company = input.company;

  const closureEligible =
    input.financialHealth.cashRunwayMonths < CLOSURE_CASH_RUNWAY_THRESHOLD;
  company = updateOpportunityStreak(company, CLOSURE_DECISION_TYPE, closureEligible);
  if (
    closureEligible &&
    persistenceSatisfied(company, CLOSURE_DECISION_TYPE, CLOSURE_PERSISTENCE_TICKS) &&
    !isOnCooldown(company, CLOSURE_DECISION_TYPE, tick, CLOSURE_COOLDOWN_TICKS) &&
    company.status.active
  ) {
    const closed: Company = {
      ...recordDecision(company, CLOSURE_DECISION_TYPE, tick),
      // SS35 Bankruptcy: "W prostym VS ... bankructwo może wynikać z
      // utraty płynności" -- illiquid at the moment of closure (not just
      // a short runway) is exactly that, so closure and bankruptcy share
      // this one path rather than a separate debt/insolvency subsystem.
      status: {
        ...company.status,
        active: false,
        bankrupt: company.finance.cash <= 0,
      },
      closedTick: tick,
    };
    return {
      company: closed,
      action: "CLOSE",
      snapshot: buildDecisionSnapshot({
        actorId: company.id,
        tick,
        decisionType: CLOSURE_DECISION_TYPE,
        options: [
          { action: "HOLD", hardEligible: true, score: 0 },
          { action: "CLOSE", hardEligible: true, score: 1 },
        ],
        selectedAction: "CLOSE",
        factors: [
          {
            key: "cash_runway_months",
            contribution: input.financialHealth.cashRunwayMonths,
          },
        ],
      }),
    };
  }

  const expansionScore = clamp(
    0.4 * clamp(input.demandPersistenceScore, 0, 1) +
      0.3 * Math.max(0, input.expectedMargin) +
      0.3 * company.production.utilization -
      0.3 * (capitalCost / Math.max(1, company.finance.cash)),
    0,
    1,
  );
  const wasExpanding = isActive(company, EXPANSION_DECISION_TYPE);
  const nowExpanding = evaluateHysteresisGate({
    score: expansionScore,
    currentlyActive: wasExpanding,
    activateThreshold: EXPANSION_ACTIVATE_SCORE,
    deactivateThreshold: EXPANSION_DEACTIVATE_SCORE,
  });
  company = setActive(company, EXPANSION_DECISION_TYPE, nowExpanding);
  company = updateOpportunityStreak(company, EXPANSION_DECISION_TYPE, nowExpanding);

  const canAffordExpansion = company.finance.cash >= capitalCost;
  if (
    nowExpanding &&
    !input.financialHealth.distressed &&
    canAffordExpansion &&
    persistenceSatisfied(company, EXPANSION_DECISION_TYPE, EXPANSION_PERSISTENCE_TICKS) &&
    !isOnCooldown(company, EXPANSION_DECISION_TYPE, tick, EXPANSION_COOLDOWN_TICKS)
  ) {
    const priorCapacity = company.production.capacity;
    const nextCapacity =
      priorCapacity > 0
        ? priorCapacity * (1 + EXPANSION_STEP_FRACTION)
        : EXPANSION_MIN_STEP;
    const expanded: Company = {
      ...recordDecision(company, EXPANSION_DECISION_TYPE, tick),
      production: { ...company.production, capacity: nextCapacity },
      finance: {
        ...company.finance,
        cash: roundMoney(company.finance.cash - capitalCost),
      },
    };
    return {
      company: expanded,
      action: "EXPAND",
      snapshot: buildDecisionSnapshot({
        actorId: company.id,
        tick,
        decisionType: EXPANSION_DECISION_TYPE,
        options: [
          { action: "HOLD", hardEligible: true, score: 0 },
          { action: "EXPAND", hardEligible: canAffordExpansion, score: expansionScore },
        ],
        selectedAction: "EXPAND",
        factors: [
          { key: "demand_persistence", contribution: input.demandPersistenceScore },
          { key: "expected_margin", contribution: input.expectedMargin },
          { key: "capacity_pressure", contribution: company.production.utilization },
        ],
      }),
    };
  }

  const contractionScore = clamp(
    0.6 * (1 - company.production.utilization) + 0.4 * Math.max(0, -input.expectedMargin),
    0,
    1,
  );
  const wasContracting = isActive(company, CONTRACTION_DECISION_TYPE);
  const nowContracting = evaluateHysteresisGate({
    score: contractionScore,
    currentlyActive: wasContracting,
    activateThreshold: CONTRACTION_ACTIVATE_SCORE,
    deactivateThreshold: CONTRACTION_DEACTIVATE_SCORE,
  });
  company = setActive(company, CONTRACTION_DECISION_TYPE, nowContracting);
  company = updateOpportunityStreak(company, CONTRACTION_DECISION_TYPE, nowContracting);

  if (
    nowContracting &&
    company.production.capacity > 0 &&
    persistenceSatisfied(
      company,
      CONTRACTION_DECISION_TYPE,
      CONTRACTION_PERSISTENCE_TICKS,
    ) &&
    !isOnCooldown(company, CONTRACTION_DECISION_TYPE, tick, CONTRACTION_COOLDOWN_TICKS)
  ) {
    const priorCapacity = company.production.capacity;
    const nextCapacity = priorCapacity * (1 - CONTRACTION_STEP_FRACTION);
    const contracted: Company = {
      ...recordDecision(company, CONTRACTION_DECISION_TYPE, tick),
      production: { ...company.production, capacity: nextCapacity },
    };
    return {
      company: contracted,
      action: "CONTRACT",
      snapshot: buildDecisionSnapshot({
        actorId: company.id,
        tick,
        decisionType: CONTRACTION_DECISION_TYPE,
        options: [
          { action: "HOLD", hardEligible: true, score: 0 },
          { action: "CONTRACT", hardEligible: true, score: contractionScore },
        ],
        selectedAction: "CONTRACT",
        factors: [
          { key: "low_utilization", contribution: 1 - company.production.utilization },
          { key: "loss", contribution: Math.max(0, -input.expectedMargin) },
        ],
      }),
    };
  }

  return { company, action: "HOLD", snapshot: undefined };
}
