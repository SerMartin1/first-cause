import { assertNonEmpty, assertNonNegative } from "../core/validation.js";

/** Entity Data Model SS11. */
export type AgeGroup =
  "AGE_0_14" | "AGE_15_24" | "AGE_25_44" | "AGE_45_64" | "AGE_65_PLUS";
export type EconomicClass = "POOR" | "WORKING" | "MIDDLE" | "WEALTHY" | "ELITE";
export type SkillLevel = "UNSKILLED" | "SKILLED" | "SPECIALIST";

export interface CohortNeeds {
  readonly survival: number;
  readonly basic: number;
  readonly services: number;
  readonly comfort: number;
  readonly prosperity: number;
  readonly modern: number;
  readonly totalSatisfaction: number;
}

/**
 * PopulationCohort (Entity Data Model SS11): the basic unit of
 * population -- "population is aggregated into cohorts, not full NPCs"
 * (rule 16). A pure data holder in M3; demography (births/deaths,
 * SIM-002) is M6.
 *
 * `identity` (culture/nation) is intentionally omitted: Culture/Nation
 * are not M3-scope entity types (see `world/regions.ts` doc comment for
 * the same "no field referencing a type that can't exist yet" rule).
 */
export interface PopulationCohort {
  readonly id: string;
  readonly regionId: string;
  readonly settlementId: string | undefined;

  readonly ageGroup: AgeGroup;
  readonly population: number;

  readonly economicClass: EconomicClass;
  readonly profession: string | undefined;
  readonly skillLevel: SkillLevel;
  readonly employment: number;
  readonly averageIncome: number;
  readonly averageWealth: number;

  readonly educationLevel: number;
  readonly literacy: number;

  readonly consumptionBudget: number;
  readonly savingsRate: number;
  /**
   * Płynne oszczędności gospodarstw tej kohorty (jednostki pieniężne, suma
   * dla całej kohorty, nie na osobę). Etap 2 naprawy gospodarki (N7,
   * 2026-10-01): saldo = poprzednie + faktycznie otrzymane płace −
   * faktycznie opłacone zakupy; wydawane na przetrwanie także bez pracy.
   */
  readonly savings: number;
  readonly taxBurden: number;
  readonly housingCost: number;

  readonly needs: CohortNeeds;

  readonly migrationPropensity: number;
}

export interface CreatePopulationCohortInput {
  readonly id: string;
  readonly regionId: string;
  readonly settlementId?: string;
  readonly ageGroup: AgeGroup;
  readonly population: number;
  readonly economicClass: EconomicClass;
  readonly skillLevel: SkillLevel;
}

export function createPopulationCohort(
  input: CreatePopulationCohortInput,
): PopulationCohort {
  assertNonEmpty(input.id, "PopulationCohort.id");
  assertNonEmpty(input.regionId, "PopulationCohort.regionId");
  assertNonNegative(input.population, "PopulationCohort.population");

  return {
    id: input.id,
    regionId: input.regionId,
    settlementId: input.settlementId,
    ageGroup: input.ageGroup,
    population: input.population,
    economicClass: input.economicClass,
    profession: undefined,
    skillLevel: input.skillLevel,
    employment: 0,
    averageIncome: 0,
    averageWealth: 0,
    educationLevel: 0,
    literacy: 0,
    consumptionBudget: 0,
    savingsRate: 0,
    savings: 0,
    taxBurden: 0,
    housingCost: 0,
    needs: {
      survival: 0,
      basic: 0,
      services: 0,
      comfort: 0,
      prosperity: 0,
      modern: 0,
      totalSatisfaction: 0,
    },
    migrationPropensity: 0,
  };
}
