import type { PopulationCohort } from "@first-cause/entities";
import type { FactInput, FactLocation } from "@first-cause/causality";
import { assertNonNegative } from "../../core/validation.js";

/**
 * Household income & consumption (Simulation Model SS26 "Household
 * Economy", ECO-014, Simulation Test Spec SS62-63 FC-POP-001/002).
 *
 * Income flow (SS26): `Wages + Transfers + Property Income - Taxes =
 * Disposable Income`. M9 only has Wages -- Transfers/Property Income
 * need a State entity (M17+) and `taxBurden` stays untouched (no tax
 * system exists yet), the same "field exists structurally, not yet
 * computed" rule M7 applied to `Company.finance.taxes`. So
 * `computeHouseholdIncome` is Wages alone: `employment * averageIncome`
 * (both written by `labor/employment.matchEmployment`, M9).
 *
 * Spending order (ECO-014): `Survival -> Basic -> Services -> Comfort ->
 * Prosperity -> Luxury -> Savings`. `Luxury` is the spending-side label
 * for what the needs hierarchy (ECO-013) calls the `Modern` tier -- both
 * documents agree on every other step and list exactly one extra label
 * apiece past `Prosperity`, so `needs-satisfaction.ts` maps them onto
 * the same tier when scoring `CohortNeeds.modern`.
 */
export const SPENDING_ORDER = [
  "survival",
  "basic",
  "services",
  "comfort",
  "prosperity",
  "luxury",
  "savings",
] as const;

export type SpendingCategory = (typeof SPENDING_ORDER)[number];
/** Every spending category except the terminal "savings" bucket -- these are the ones a real need tier can be underfunded on. */
export type NeedSpendingCategory = Exclude<SpendingCategory, "savings">;

/** Wages only (Transfers/Property Income/Taxes are 0 -- see module doc comment). */
export function computeHouseholdIncome(cohort: PopulationCohort): number {
  const employment = assertNonNegative(
    cohort.employment,
    `computeHouseholdIncome(${cohort.id}).employment`,
  );
  const averageIncome = assertNonNegative(
    cohort.averageIncome,
    `computeHouseholdIncome(${cohort.id}).averageIncome`,
  );
  return employment * averageIncome;
}

export interface AllocateSpendingInput {
  readonly budget: number;
  /** Full cost to fully satisfy each need-linked category this tick -- computed by the caller from real goods/Market prices (M9 does not itself own that matching; see roadmap "Poza zakresem"). */
  readonly categoryCost: Readonly<Record<NeedSpendingCategory, number>>;
}

export interface AllocateSpendingResult {
  /** Includes "savings" = whatever was left after every need category. */
  readonly spent: Readonly<Record<SpendingCategory, number>>;
}

/**
 * FC-POP-001 (consumption priority) / FC-POP-002 (no money, no purchase):
 * walks `SPENDING_ORDER` in strict priority order, funding each category
 * only up to what's left of the budget -- a later category never gets
 * anything while an earlier one is still underfunded, and nothing is
 * ever allocated beyond the budget actually available.
 */
export function allocateSpending(input: AllocateSpendingInput): AllocateSpendingResult {
  let remaining = assertNonNegative(input.budget, "allocateSpending().budget");
  const spent: Partial<Record<SpendingCategory, number>> = {};

  for (const category of SPENDING_ORDER) {
    if (category === "savings") {
      spent.savings = remaining;
      remaining = 0;
      continue;
    }
    const cost = assertNonNegative(
      input.categoryCost[category],
      `allocateSpending().categoryCost.${category}`,
    );
    const allocation = Math.min(cost, remaining);
    spent[category] = allocation;
    remaining -= allocation;
  }

  return { spent: spent as Record<SpendingCategory, number> };
}

function cohortLocation(cohort: PopulationCohort): FactLocation {
  return cohort.settlementId === undefined
    ? { regionId: cohort.regionId }
    : { regionId: cohort.regionId, settlementId: cohort.settlementId };
}

export interface ApplyHouseholdConsumptionInput {
  readonly cohort: PopulationCohort;
  readonly categoryCost: Readonly<Record<NeedSpendingCategory, number>>;
}

export interface ApplyHouseholdConsumptionResult {
  readonly cohort: PopulationCohort;
  readonly spent: Readonly<Record<SpendingCategory, number>>;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Advances one cohort's income/spending by exactly one tick: computes
 * Disposable Income, allocates it via `allocateSpending`, and writes
 * `consumptionBudget`/`savingsRate` back onto the cohort (both existing
 * Entity Data Model SS11 fields). Needs satisfaction itself is a
 * separate step -- `needs-satisfaction.ts` -- so a caller who only wants
 * the spending breakdown for `markets/demand-aggregation` (M8) doesn't
 * have to also compute `CohortNeeds`.
 */
export function applyHouseholdConsumption(
  input: ApplyHouseholdConsumptionInput,
): ApplyHouseholdConsumptionResult {
  const { cohort } = input;
  const income = computeHouseholdIncome(cohort);
  const { spent } = allocateSpending({
    budget: income,
    categoryCost: input.categoryCost,
  });
  const savingsRate = income > 0 ? spent.savings / income : 0;

  const nextCohort: PopulationCohort = {
    ...cohort,
    consumptionBudget: income,
    savingsRate,
  };

  const facts: FactInput<number>[] = [];
  if (nextCohort.consumptionBudget !== cohort.consumptionBudget) {
    facts.push({
      type: "consumption_budget_changed",
      subject: { entityType: "populationCohort", entityId: cohort.id },
      location: cohortLocation(cohort),
      values: {
        before: cohort.consumptionBudget,
        after: nextCohort.consumptionBudget,
        delta: nextCohort.consumptionBudget - cohort.consumptionBudget,
      },
    });
  }

  return { cohort: nextCohort, spent, facts };
}
