import type { Company } from "@first-cause/entities";
import { assertNonNegative } from "../../../core/validation.js";

/**
 * Common Decision Framework (AI-01, AI Decision Model SS5 "Wspólny
 * Decision Pipeline", SS19 Hysteresis, SS20 Decision Cooldown, SS21
 * Persistence Requirement). Every M11 decision module (production,
 * labor, lifecycle, PM adoption) builds its own SCORE/DECIDE step on
 * these three primitives instead of reinventing anti-oscillation logic
 * per decision type -- the roadmap's HIGH-risk note for M11 ("interakcja
 * wielu poprawnych systemów prowadząca do niestabilnej symulacji", Master
 * Audit SS271) is exactly why hysteresis/cooldown/persistence are shared,
 * not ad hoc.
 *
 * All three read/write `Company.ai`, keyed by an arbitrary
 * `decisionType` string (e.g. `"production_utilization"`,
 * `"capacity_expansion"`) so unrelated decisions never share state.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Hysteresis gate (SS19): the threshold to *enter* a state is higher
 * than the threshold to *leave* it, so a score oscillating around a
 * single threshold does not flip the decision every tick.
 */
export interface HysteresisGateInput {
  readonly score: number;
  readonly currentlyActive: boolean;
  readonly activateThreshold: number;
  readonly deactivateThreshold: number;
}

export function evaluateHysteresisGate(input: HysteresisGateInput): boolean {
  const { score, currentlyActive, activateThreshold, deactivateThreshold } = input;
  if (activateThreshold < deactivateThreshold) {
    throw new RangeError(
      `evaluateHysteresisGate: activateThreshold (${activateThreshold}) must be >= deactivateThreshold (${deactivateThreshold})`,
    );
  }
  return currentlyActive ? score >= deactivateThreshold : score >= activateThreshold;
}

/** Reads/writes `Company.ai.activeStates[decisionType]`, defaulting to `false` (matches `evaluateHysteresisGate`'s `currentlyActive`). */
export function isActive(company: Company, decisionType: string): boolean {
  return company.ai.activeStates[decisionType] ?? false;
}

export function setActive(
  company: Company,
  decisionType: string,
  active: boolean,
): Company {
  return {
    ...company,
    ai: {
      ...company.ai,
      activeStates: { ...company.ai.activeStates, [decisionType]: active },
    },
  };
}

/** Cooldown gate (SS20): `true` while `currentTick - lastDecision < cooldownTicks`. */
export function isOnCooldown(
  company: Company,
  decisionType: string,
  currentTick: number,
  cooldownTicks: number,
): boolean {
  const last = company.ai.lastDecision[decisionType];
  return last !== undefined && currentTick - last < cooldownTicks;
}

export function recordDecision(
  company: Company,
  decisionType: string,
  tick: number,
): Company {
  return {
    ...company,
    ai: {
      ...company.ai,
      lastDecision: { ...company.ai.lastDecision, [decisionType]: tick },
    },
  };
}

/**
 * Persistence requirement (SS21): an opportunity must hold for N
 * consecutive ticks before a decision becomes eligible -- one good/bad
 * month cannot trigger a large, hard-to-reverse action.
 */
export function updateOpportunityStreak(
  company: Company,
  decisionType: string,
  conditionHeld: boolean,
): Company {
  const next = conditionHeld ? (company.ai.opportunityStreak[decisionType] ?? 0) + 1 : 0;
  return {
    ...company,
    ai: {
      ...company.ai,
      opportunityStreak: { ...company.ai.opportunityStreak, [decisionType]: next },
    },
  };
}

export function persistenceSatisfied(
  company: Company,
  decisionType: string,
  requiredTicks: number,
): boolean {
  return (company.ai.opportunityStreak[decisionType] ?? 0) >= requiredTicks;
}

const MEMORY_WINDOW = 6; // TODO tuning -- same rolling-window role as markets/price-adjustment's ROLLING_WINDOW (M8)

function pushBounded(existing: readonly number[], value: number): readonly number[] {
  const next = [...existing, value];
  return next.length > MEMORY_WINDOW ? next.slice(next.length - MEMORY_WINDOW) : next;
}

/** AI-02 Observation & Memory: appends this tick's profit/demand/shortage observations to `Company.ai.memory`'s bounded rolling window. */
export function updateMemory(
  company: Company,
  observation: {
    readonly profit: number;
    readonly demand: number;
    readonly shortage: number;
  },
): Company {
  return {
    ...company,
    ai: {
      ...company.ai,
      memory: {
        profitHistory: pushBounded(company.ai.memory.profitHistory, observation.profit),
        demandHistory: pushBounded(
          company.ai.memory.demandHistory,
          assertNonNegative(observation.demand, "updateMemory().demand"),
        ),
        shortageHistory: pushBounded(
          company.ai.memory.shortageHistory,
          assertNonNegative(observation.shortage, "updateMemory().shortage"),
        ),
      },
    },
  };
}

const EXPECTATION_TREND_WEIGHT = 0.3; // TODO tuning -- SS10 "weighted recent price + trend adjustment"

/**
 * AI-02/SS10 Expectations: writes into the *existing* `Company.market.
 * expectedPrices`/`expectedDemand` (M3 `CompanyMarketState`) rather than
 * a second copy under `ai` -- see `CompanyAiState`'s doc comment. A
 * simple EMA: last expectation blended with the newly observed value,
 * so one tick's noise does not become next tick's expectation outright.
 */
export function updateExpectations(
  company: Company,
  goodId: string,
  observed: { readonly price: number; readonly demand: number },
): Company {
  const priorPrice = company.market.expectedPrices[goodId] ?? observed.price;
  const priorDemand = company.market.expectedDemand[goodId] ?? observed.demand;
  const expectedPrice =
    priorPrice * (1 - EXPECTATION_TREND_WEIGHT) +
    observed.price * EXPECTATION_TREND_WEIGHT;
  const expectedDemand =
    priorDemand * (1 - EXPECTATION_TREND_WEIGHT) +
    observed.demand * EXPECTATION_TREND_WEIGHT;

  return {
    ...company,
    market: {
      ...company.market,
      expectedPrices: { ...company.market.expectedPrices, [goodId]: expectedPrice },
      expectedDemand: { ...company.market.expectedDemand, [goodId]: expectedDemand },
    },
  };
}
