import type { Company } from "@first-cause/entities";
import { assertFinite } from "../../../core/validation.js";

/**
 * Company Financial Health (AI-05, AI Decision Model SS23-24). "Firma
 * najpierw próbuje przetrwać" (SS23): every other M11 decision module
 * checks `distressed` before pursuing growth, so this is computed once
 * and threaded through, not re-derived ad hoc by each module.
 */
const DISTRESS_CASH_RUNWAY_MONTHS = 3; // TODO tuning -- SS24 "cashRunway"

export interface CompanyFinancialHealth {
  readonly profitMargin: number; // profit / revenue, 0 when revenue is 0
  /** Months of cash left at the current burn rate. `Number.POSITIVE_INFINITY` when not losing money (a diagnostic, not a stored World State field -- Finite Numbers, SS18, does not apply to it). */
  readonly cashRunwayMonths: number;
  readonly distressed: boolean;
}

export function assessFinancialHealth(company: Company): CompanyFinancialHealth {
  const { cash, revenue, profit } = company.finance;
  assertFinite(cash, `assessFinancialHealth(${company.id}).finance.cash`);
  assertFinite(revenue, `assessFinancialHealth(${company.id}).finance.revenue`);
  assertFinite(profit, `assessFinancialHealth(${company.id}).finance.profit`);

  const profitMargin = revenue > 0 ? profit / revenue : 0;
  const cashRunwayMonths =
    profit >= 0 ? Number.POSITIVE_INFINITY : cash / Math.abs(profit);

  const distressed = cash <= 0 || cashRunwayMonths < DISTRESS_CASH_RUNWAY_MONTHS;

  return { profitMargin, cashRunwayMonths, distressed };
}
