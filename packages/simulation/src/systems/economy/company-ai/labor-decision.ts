import type { Company } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { assertNonNegative } from "../../../core/validation.js";
import { isOnCooldown, recordDecision } from "./decision-framework.js";
import type { CompanyFinancialHealth } from "./financial-health.js";

/**
 * Labor Decision (AI-04, AI Decision Model SS29 Hiring, SS31 Layoff).
 * Decides the *target* headcount only -- it never touches a specific
 * cohort. Hiring executes through `labor/employment.matchEmployment`
 * (M9, raises `workforce.vacancies` here so a future match can fill it);
 * layoffs execute through `labor/employment.layoffWorkers` (M11), which
 * needs a specific cohort to return workers to -- `Company` only stores
 * an aggregate `employees` count, so this function returns `layoffTarget`
 * as a decision, not an action, the same way `evaluateTradeFlow` (M10)
 * returns a decided quantity without touching any Inventory itself.
 *
 * A shared cooldown across both actions (`decision-framework.ts`) is
 * what actually enforces SS31 ("Firma nie powinna zwalniać i zatrudniać
 * tych samych pracowników co tick"): the two actions cannot even
 * alternate within the cooldown window, not just within one tick.
 */
const LAYOFF_COOLDOWN_TICKS = 2; // TODO tuning -- SS20 "hiring -- krótki [cooldown]"
const DISTRESS_MIN_SHRINK_FRACTION = 0.1; // TODO tuning -- minimum shrink step under financial distress
const LABOR_DECISION_TYPE = "labor_headcount";

export type LaborAction = "HIRE" | "LAYOFF" | "HOLD";

export interface DecideLaborInput {
  readonly company: Company;
  readonly tick: number;
  /** Headcount `production-decision.ts`'s target utilization implies this tick is actually needed. */
  readonly targetEmployment: number;
  readonly financialHealth: CompanyFinancialHealth;
}

export interface DecideLaborResult {
  readonly company: Company;
  readonly action: LaborAction;
  /** > 0 only when `action === "LAYOFF"` -- how many jobs to end; execution against a real cohort is `layoffWorkers`'s job. */
  readonly layoffTarget: number;
  readonly facts: readonly FactInput<number>[];
}

export function decideLabor(input: DecideLaborInput): DecideLaborResult {
  const { company, tick } = input;
  const targetEmployment = Math.round(
    assertNonNegative(input.targetEmployment, "decideLabor().targetEmployment"),
  );
  const currentEmployees = company.workforce.employees;

  if (isOnCooldown(company, LABOR_DECISION_TYPE, tick, LAYOFF_COOLDOWN_TICKS)) {
    return { company, action: "HOLD", layoffTarget: 0, facts: [] };
  }

  // SS23/SS31: financial distress forces layoffs even before the target
  // headcount has fully caught up -- survival first, growth later.
  if (input.financialHealth.distressed && currentEmployees > 0) {
    const layoffTarget = Math.min(
      currentEmployees,
      Math.max(
        currentEmployees - targetEmployment,
        Math.ceil(currentEmployees * DISTRESS_MIN_SHRINK_FRACTION),
      ),
    );
    return finish(company, tick, "LAYOFF", layoffTarget, 0);
  }

  const gap = targetEmployment - currentEmployees;
  if (gap > 0) return finish(company, tick, "HIRE", 0, gap);
  if (gap < 0) return finish(company, tick, "LAYOFF", -gap, 0);
  return { company, action: "HOLD", layoffTarget: 0, facts: [] };
}

function finish(
  company: Company,
  tick: number,
  action: "HIRE" | "LAYOFF",
  layoffTarget: number,
  vacanciesToAdd: number,
): DecideLaborResult {
  const withCooldown = recordDecision(company, LABOR_DECISION_TYPE, tick);
  const nextCompany: Company =
    vacanciesToAdd > 0
      ? {
          ...withCooldown,
          workforce: {
            ...withCooldown.workforce,
            vacancies: withCooldown.workforce.vacancies + vacanciesToAdd,
          },
        }
      : withCooldown;

  const facts: FactInput<number>[] = [];
  if (action === "HIRE" && vacanciesToAdd > 0) {
    facts.push({
      type: "vacancies_opened",
      subject: { entityType: "company", entityId: company.id },
      location: { regionId: company.regionId },
      values: {
        before: company.workforce.vacancies,
        after: nextCompany.workforce.vacancies,
        delta: vacanciesToAdd,
      },
    });
  }

  return { company: nextCompany, action, layoffTarget, facts };
}
