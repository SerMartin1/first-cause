import type { AgeGroup, Company, PopulationCohort } from "@first-cause/entities";
import type { FactInput, FactLocation } from "@first-cause/causality";
import {
  InvariantViolationError,
  assertNonNegative,
  assertPositive,
} from "../../../core/validation.js";

/**
 * Employment matching (Simulation Model SS11 "Employment & Wages", VS
 * Spec SS23, Simulation Test Spec SS23 "Employment Accounting"). M9 is
 * explicitly "reactive, not strategic" (roadmap "Poza zakresem: AI
 * decyzje firm o zatrudnieniu -- M11"): a company's `vacancies` and
 * `skillDemand` are accepted as already-decided state, the same way
 * `production.ts` (M7) accepts `capacity`/`utilization` as given rather
 * than computing them. `matchEmployment` only fills open positions from
 * a cohort's unemployed labor supply -- it never decides how many
 * vacancies a company *should* want.
 *
 * Only `workforce.employees`/`vacancies` (company) and `employment`/
 * `averageIncome` (cohort) are mutated. `workforce.skillDemand` is read
 * as a per-skill cap, never decremented -- it is the company's *desired*
 * skill mix (AI-owned, M11), not a countdown of remaining slots; owning
 * that distinction the wrong way would fight with M11 recomputing it
 * every tick.
 */
const WORKING_AGE_GROUPS: readonly AgeGroup[] = ["AGE_15_24", "AGE_25_44", "AGE_45_64"];

/**
 * Fraction of working-age population actually in the labor force
 * (Simulation Test Spec SS23 "non-participating" bucket: students,
 * caregivers, the voluntarily idle -- distinct from "unemployed", which
 * *is* looking for work). TODO tuning.
 */
const LABOR_FORCE_PARTICIPATION_RATE = 0.65;

/** Working-age, labor-force population this cohort structurally has (before subtracting who's already employed). */
export function eligibleLaborForce(cohort: PopulationCohort): number {
  if (!WORKING_AGE_GROUPS.includes(cohort.ageGroup)) return 0;
  return cohort.population * LABOR_FORCE_PARTICIPATION_RATE;
}

/** Unemployed, labor-force-eligible workers this cohort has available to hire this tick. */
export function availableWorkers(cohort: PopulationCohort): number {
  return Math.max(0, eligibleLaborForce(cohort) - cohort.employment);
}

function cohortLocation(cohort: PopulationCohort): FactLocation {
  return cohort.settlementId === undefined
    ? { regionId: cohort.regionId }
    : { regionId: cohort.regionId, settlementId: cohort.settlementId };
}

export interface MatchEmploymentInput {
  readonly company: Company;
  readonly cohort: PopulationCohort;
}

export interface MatchEmploymentResult {
  readonly company: Company;
  readonly cohort: PopulationCohort;
  /** How many workers this call actually hired (0 when nothing matched). */
  readonly hired: number;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Hires from exactly one cohort into exactly one company's open
 * positions of that cohort's skill level, capped by whichever of
 * (vacancies, this skill's demand cap, this cohort's available workers)
 * is smallest -- so `employment <= eligible working population`
 * (Simulation Test Spec SS14) holds by construction, not by a separate
 * assertion. Callers matching several (company, cohort) pairs in the
 * same tick must thread each side's updated state into the next call --
 * `employment.test.ts`'s labor-competition test (FC-LABOR-003 skeleton,
 * full version M11) proves this prevents the same unemployed worker
 * being hired twice in one tick.
 */
export function matchEmployment(input: MatchEmploymentInput): MatchEmploymentResult {
  const { company, cohort } = input;
  if (company.regionId !== cohort.regionId) {
    throw new InvariantViolationError(
      `matchEmployment: company "${company.id}" (region ${company.regionId}) and cohort "${cohort.id}" (region ${cohort.regionId}) must share a region -- cross-region hiring is migration (M13), not employment`,
    );
  }

  const vacancies = assertNonNegative(
    company.workforce.vacancies,
    `matchEmployment: Company "${company.id}".workforce.vacancies`,
  );
  const skillCap = assertNonNegative(
    company.workforce.skillDemand[cohort.skillLevel] ?? 0,
    `matchEmployment: Company "${company.id}".workforce.skillDemand.${cohort.skillLevel}`,
  );
  const available = availableWorkers(cohort);

  const hired = Math.min(vacancies, skillCap, available);
  if (hired <= 0) {
    return { company, cohort, hired: 0, facts: [] };
  }

  const wageOffer = assertPositive(
    company.workforce.wageOffer,
    `matchEmployment: Company "${company.id}".workforce.wageOffer must be seeded (createCompany's initialWageOffer) before it can hire`,
  );

  const nextCompany: Company = {
    ...company,
    workforce: {
      ...company.workforce,
      employees: company.workforce.employees + hired,
      vacancies: vacancies - hired,
    },
  };

  const priorEmployment = cohort.employment;
  const nextEmployment = priorEmployment + hired;
  // Ważona średnia stawki -- kohorta może pracować w kilku firmach po
  // różnych stawkach naraz, averageIncome jest jedynym polem, które to
  // reprezentuje (Entity Data Model SS11).
  const nextAverageIncome =
    (cohort.averageIncome * priorEmployment + wageOffer * hired) / nextEmployment;

  const nextCohort: PopulationCohort = {
    ...cohort,
    employment: nextEmployment,
    averageIncome: nextAverageIncome,
  };

  const facts: FactInput<number>[] = [
    {
      type: "employment_changed",
      subject: { entityType: "populationCohort", entityId: cohort.id },
      location: cohortLocation(cohort),
      values: { before: priorEmployment, after: nextEmployment, delta: hired },
    },
  ];

  return { company: nextCompany, cohort: nextCohort, hired, facts };
}

export interface LayoffWorkersInput {
  readonly company: Company;
  readonly cohort: PopulationCohort;
  /** How many of this specific cohort's jobs at this specific company to end. */
  readonly count: number;
}

export interface LayoffWorkersResult {
  readonly company: Company;
  readonly cohort: PopulationCohort;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Layoff (AI Decision Model SS31, M11 `company-ai/labor-decision.ts`):
 * the mechanical mirror of `matchEmployment` -- ends `count` jobs this
 * cohort holds at this company, symmetric fail-loud precondition
 * (`count` cannot exceed what this specific pairing actually employs;
 * Company only stores an aggregate `employees` headcount, not a
 * per-cohort breakdown, so the caller must know which cohort to return
 * the workers to). `averageIncome` is left untouched -- it is a blended
 * rate across every employer this cohort has, and a layoff from one
 * employer does not retroactively change what the remaining jobs pay.
 */
export function layoffWorkers(input: LayoffWorkersInput): LayoffWorkersResult {
  const { company, cohort } = input;
  const count = assertNonNegative(input.count, "layoffWorkers().count");
  if (count === 0) return { company, cohort, facts: [] };

  if (count > company.workforce.employees) {
    throw new InvariantViolationError(
      `layoffWorkers: Company "${company.id}" only has ${company.workforce.employees} employees, cannot lay off ${count}`,
    );
  }
  if (count > cohort.employment) {
    throw new InvariantViolationError(
      `layoffWorkers: Cohort "${cohort.id}" only has ${cohort.employment} employed, cannot lay off ${count}`,
    );
  }

  const nextCompany: Company = {
    ...company,
    workforce: { ...company.workforce, employees: company.workforce.employees - count },
  };
  const priorEmployment = cohort.employment;
  const nextEmployment = priorEmployment - count;
  const nextCohort: PopulationCohort = { ...cohort, employment: nextEmployment };

  const facts: FactInput<number>[] = [
    {
      type: "employment_changed",
      subject: { entityType: "populationCohort", entityId: cohort.id },
      location: cohortLocation(cohort),
      values: { before: priorEmployment, after: nextEmployment, delta: -count },
    },
  ];

  return { company: nextCompany, cohort: nextCohort, facts };
}
