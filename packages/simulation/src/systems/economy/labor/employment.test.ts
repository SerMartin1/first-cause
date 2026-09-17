import {
  createCompany,
  createPopulationCohort,
  type Company,
} from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { InvariantViolationError } from "../../../core/validation.js";
import { availableWorkers, eligibleLaborForce, matchEmployment } from "./employment.js";

function company(overrides: {
  readonly vacancies: number;
  readonly skillDemand?: Readonly<Record<string, number>>;
  readonly wageOffer?: number;
  readonly regionId?: string;
}): Company {
  const base = createCompany({
    id: "company_farm",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: overrides.regionId ?? "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_owner",
    inventoryId: "inventory_farm",
    initialWageOffer: overrides.wageOffer ?? 10,
  });
  return {
    ...base,
    workforce: {
      ...base.workforce,
      vacancies: overrides.vacancies,
      skillDemand: overrides.skillDemand ?? { UNSKILLED: overrides.vacancies },
    },
  };
}

function cohort(population: number, employment = 0) {
  return {
    ...createPopulationCohort({
      id: "cohort_001",
      regionId: "region_001",
      ageGroup: "AGE_25_44",
      population,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
    employment,
  };
}

describe("eligibleLaborForce / availableWorkers", () => {
  it("is 0 outside working-age brackets", () => {
    const children = createPopulationCohort({
      id: "c_children",
      regionId: "region_001",
      ageGroup: "AGE_0_14",
      population: 100,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    });
    const retirees = createPopulationCohort({
      id: "c_retirees",
      regionId: "region_001",
      ageGroup: "AGE_65_PLUS",
      population: 100,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    });
    expect(eligibleLaborForce(children)).toBe(0);
    expect(eligibleLaborForce(retirees)).toBe(0);
  });

  it("applies the labor force participation rate for working-age brackets", () => {
    const c = cohort(1000);
    expect(eligibleLaborForce(c)).toBe(650);
    expect(availableWorkers(c)).toBe(650);
  });

  it("subtracts already-employed workers from availability", () => {
    const c = cohort(1000, 400);
    expect(availableWorkers(c)).toBe(250);
  });

  it("never goes negative even if employment exceeds the eligible force", () => {
    const c = cohort(10, 1000);
    expect(availableWorkers(c)).toBe(0);
  });
});

describe("matchEmployment", () => {
  it("hires the minimum of vacancies, skill demand and available workers", () => {
    const result = matchEmployment({
      company: company({ vacancies: 100, skillDemand: { UNSKILLED: 30 } }),
      cohort: cohort(1000), // 650 available
    });
    expect(result.hired).toBe(30);
    expect(result.company.workforce.employees).toBe(30);
    expect(result.company.workforce.vacancies).toBe(70);
    expect(result.cohort.employment).toBe(30);
  });

  it("never exceeds the eligible working population (Simulation Test Spec SS14)", () => {
    const result = matchEmployment({
      company: company({ vacancies: 1_000_000, skillDemand: { UNSKILLED: 1_000_000 } }),
      cohort: cohort(1000),
    });
    expect(result.cohort.employment).toBeLessThanOrEqual(
      eligibleLaborForce(cohort(1000)),
    );
    expect(result.hired).toBe(650);
  });

  it("hires 0 and returns identical entities when nothing matches", () => {
    const c = cohort(1000);
    const co = company({ vacancies: 0 });
    const result = matchEmployment({ company: co, cohort: c });
    expect(result.hired).toBe(0);
    expect(result.company).toBe(co);
    expect(result.cohort).toBe(c);
    expect(result.facts).toEqual([]);
  });

  it("does not hire a skill the cohort doesn't have", () => {
    const result = matchEmployment({
      company: company({ vacancies: 100, skillDemand: { SPECIALIST: 100 } }),
      cohort: cohort(1000), // UNSKILLED
    });
    expect(result.hired).toBe(0);
  });

  it("fails loud when a company with an open, matchable vacancy has no seeded wageOffer", () => {
    expect(() =>
      matchEmployment({
        company: company({ vacancies: 10, wageOffer: 0 }),
        cohort: cohort(1000),
      }),
    ).toThrow(InvariantViolationError);
  });

  it("rejects hiring across regions (cross-region matching is migration, M13)", () => {
    expect(() =>
      matchEmployment({
        company: company({ vacancies: 10, regionId: "region_002" }),
        cohort: cohort(1000),
      }),
    ).toThrow(InvariantViolationError);
  });

  it("blends averageIncome as a weighted average across hiring rounds", () => {
    const first = matchEmployment({
      company: company({
        vacancies: 500,
        skillDemand: { UNSKILLED: 500 },
        wageOffer: 10,
      }),
      cohort: cohort(1000),
    });
    expect(first.hired).toBe(500);
    expect(first.cohort.averageIncome).toBe(10);

    const second = matchEmployment({
      company: company({
        vacancies: 500,
        skillDemand: { UNSKILLED: 500 },
        wageOffer: 20,
      }),
      cohort: first.cohort,
    });
    // 650 eligible total, 500 already hired at 10 -> only 150 left, hired at 20.
    expect(second.hired).toBe(150);
    // (500*10 + 150*20) / 650 = 11.538...
    expect(second.cohort.averageIncome).toBeCloseTo((500 * 10 + 150 * 20) / 650, 6);

    const noneLeft = matchEmployment({
      company: company({
        vacancies: 100,
        skillDemand: { UNSKILLED: 100 },
        wageOffer: 30,
      }),
      cohort: second.cohort,
    });
    expect(noneLeft.hired).toBe(0);
    expect(noneLeft.cohort.averageIncome).toBe(second.cohort.averageIncome);
  });

  it("emits an employment_changed fact only when someone is actually hired", () => {
    const hired = matchEmployment({
      company: company({ vacancies: 10, skillDemand: { UNSKILLED: 10 } }),
      cohort: cohort(1000),
    });
    expect(hired.facts.some((fact) => fact.type === "employment_changed")).toBe(true);

    const notHired = matchEmployment({
      company: company({ vacancies: 0 }),
      cohort: cohort(1000),
    });
    expect(notHired.facts).toEqual([]);
  });

  it("FC-LABOR-003 skeleton: two companies competing for the same cohort never double-hire the same worker", () => {
    let sharedCohort = cohort(100); // 65 available
    const companyA = company({
      vacancies: 50,
      skillDemand: { UNSKILLED: 50 },
      wageOffer: 10,
    });
    const companyB = company({
      vacancies: 50,
      skillDemand: { UNSKILLED: 50 },
      wageOffer: 12,
    });

    const resultA = matchEmployment({ company: companyA, cohort: sharedCohort });
    sharedCohort = resultA.cohort;
    const resultB = matchEmployment({ company: companyB, cohort: sharedCohort });
    sharedCohort = resultB.cohort;

    expect(resultA.hired + resultB.hired).toBe(65);
    expect(sharedCohort.employment).toBe(65);
    expect(sharedCohort.employment).toBeLessThanOrEqual(eligibleLaborForce(cohort(100)));
  });
});
