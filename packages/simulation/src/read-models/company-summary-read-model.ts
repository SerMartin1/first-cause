import type { WorldState } from "@first-cause/entities";

/**
 * CompanySummaryReadModel (Etap 1 tick-loop integration, audytowe P1-06:
 * "Brak wymaganej powierzchni obserwacji systemów" -- M7/M9/M11 nie
 * miały dotąd żadnego read-model, wyłącznie surowy `WorldState`). Nie
 * pretenduje do pełnego AI Debug Inspector (AI-11, R M11 SS100) --
 * wystawia tylko to, co potrzebne, żeby zweryfikować, że produkcja,
 * zatrudnienie i finanse firmy faktycznie się zmieniają tick po ticku.
 */
export interface CompanySummaryReadModel {
  readonly companyId: string;
  readonly name: string;
  readonly archetypeId: string;
  readonly regionId: string;
  readonly active: boolean;
  readonly production: {
    readonly productionMethodId: string | undefined;
    readonly capacity: number;
    readonly utilization: number;
    readonly outputLastTick: number;
  };
  readonly workforce: {
    readonly employees: number;
    readonly vacancies: number;
    readonly wageOffer: number;
  };
  readonly finance: {
    readonly cash: number;
    readonly revenue: number;
    readonly costs: number;
    readonly profit: number;
  };
}

export function buildCompanySummaryReadModel(
  state: WorldState,
  companyId: string,
): CompanySummaryReadModel | undefined {
  const company = state.companies[companyId];
  if (!company) return undefined;

  return {
    companyId: company.id,
    name: company.name,
    archetypeId: company.archetypeId,
    regionId: company.regionId,
    active: company.status.active,
    production: {
      productionMethodId: company.production.productionMethodId,
      capacity: company.production.capacity,
      utilization: company.production.utilization,
      outputLastTick: company.production.outputLastTick,
    },
    workforce: {
      employees: company.workforce.employees,
      vacancies: company.workforce.vacancies,
      wageOffer: company.workforce.wageOffer,
    },
    finance: {
      cash: company.finance.cash,
      revenue: company.finance.revenue,
      costs: company.finance.costs,
      profit: company.finance.profit,
    },
  };
}
