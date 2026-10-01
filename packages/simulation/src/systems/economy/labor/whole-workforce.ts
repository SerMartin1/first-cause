import type { Company, PopulationCohort, WorldState } from "@first-cause/entities";
import { eligibleLaborForce } from "./employment.js";

/**
 * Decyzja właściciela (2026-10-01): pracownicy to zawsze CAŁE osoby. Silnik
 * < 4 zatrudniał ułamki ludzi (siła robocza `ludność × 0,65` bez
 * zaokrąglenia, np. 6,5 pracownika). Ta czysta funkcja doprowadza taki stan
 * do całych osób -- używa jej migracja zapisu v3 → v4 (`@first-cause/
 * persistence`). Deterministyczna, bez losowości; stan już całkowity
 * zostaje bez zmian (idempotentna).
 *
 * Na region:
 * - firmy: `employees` i `vacancies` w dół do całych osób;
 * - kohorty: `employment` w całych osobach -- najpierw części całkowite,
 *   potem metoda największych reszt (remis: id kohorty), każda kohorta w
 *   granicy `eligibleLaborForce`. Suma docelowa: jeśli w zapisie suma kohort
 *   regionu równała się pracownikom jego aktywnych firm (inwariant P0-05),
 *   zostaje równa ich nowej, całkowitej liczbie; w przeciwnym razie (np.
 *   zatrudnieni bez firm w regionie) = dotychczasowa suma w dół.
 */
export function normalizeWholeWorkforce(state: WorldState): WorldState {
  const companies: Record<string, Company> = {};
  const employeesByRegion = new Map<string, number>();
  const legacyEmployeesByRegion = new Map<string, number>();
  for (const id of Object.keys(state.companies).sort()) {
    const company = state.companies[id]!;
    const employees = wholeDown(company.workforce.employees);
    companies[id] = {
      ...company,
      workforce: {
        ...company.workforce,
        employees,
        vacancies: wholeDown(company.workforce.vacancies),
      },
    };
    if (company.status.active) {
      employeesByRegion.set(
        company.regionId,
        (employeesByRegion.get(company.regionId) ?? 0) + employees,
      );
      legacyEmployeesByRegion.set(
        company.regionId,
        (legacyEmployeesByRegion.get(company.regionId) ?? 0) + company.workforce.employees,
      );
    }
  }

  const cohortsByRegion = new Map<string, PopulationCohort[]>();
  for (const id of Object.keys(state.populationCohorts).sort()) {
    const cohort = state.populationCohorts[id]!;
    const list = cohortsByRegion.get(cohort.regionId) ?? [];
    list.push(cohort);
    cohortsByRegion.set(cohort.regionId, list);
  }
  const populationCohorts: Record<string, PopulationCohort> = {};
  for (const [regionId, cohorts] of cohortsByRegion) {
    const legacyCohortTotal = cohorts.reduce((sum, c) => sum + c.employment, 0);
    const matchedCompanies =
      Math.abs(legacyCohortTotal - (legacyEmployeesByRegion.get(regionId) ?? 0)) < 1e-6;
    const target = matchedCompanies
      ? (employeesByRegion.get(regionId) ?? 0)
      : wholeDown(legacyCohortTotal);
    const entries = cohorts.map((cohort) => {
      const base = wholeDown(cohort.employment);
      return {
        cohort,
        employment: Math.min(base, eligibleLaborForce(cohort)),
        remainder: cohort.employment - base,
        cap: eligibleLaborForce(cohort),
      };
    });
    let total = entries.reduce((sum, e) => sum + e.employment, 0);
    // Za mało: +1 dla największych reszt (w granicy limitu kohorty).
    const byRemainderDesc = [...entries].sort(
      (a, b) => b.remainder - a.remainder || a.cohort.id.localeCompare(b.cohort.id),
    );
    while (total < target) {
      const next = byRemainderDesc.find((e) => e.employment < e.cap);
      if (!next) break;
      next.employment += 1;
      total += 1;
      // Każda kohorta dostaje najwyżej jedną osobę na przebieg listy.
      byRemainderDesc.push(byRemainderDesc.splice(byRemainderDesc.indexOf(next), 1)[0]!);
    }
    // Za dużo: −1 od najmniejszych reszt.
    const byRemainderAsc = [...entries].sort(
      (a, b) => a.remainder - b.remainder || a.cohort.id.localeCompare(b.cohort.id),
    );
    while (total > target) {
      const next = byRemainderAsc.find((e) => e.employment > 0);
      if (!next) break;
      next.employment -= 1;
      total -= 1;
      byRemainderAsc.push(byRemainderAsc.splice(byRemainderAsc.indexOf(next), 1)[0]!);
    }
    for (const e of entries)
      populationCohorts[e.cohort.id] = { ...e.cohort, employment: e.employment };
  }

  return { ...state, companies, populationCohorts };
}

/** W dół do całej osoby; tolerancja na szum zmiennoprzecinkowy (13,000000000000002 → 13, 12,9999999999 → 13). */
function wholeDown(value: number): number {
  return Math.max(0, Math.floor(value + 1e-9));
}
