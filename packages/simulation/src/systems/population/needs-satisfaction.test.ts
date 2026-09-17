import { createPopulationCohort, type PopulationCohort } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { allocateSpending, applyHouseholdConsumption } from "./consumption.js";
import {
  applyNeedsSatisfaction,
  computeNeedsSatisfaction,
} from "./needs-satisfaction.js";

function cohort(overrides: Partial<PopulationCohort> = {}): PopulationCohort {
  return {
    ...createPopulationCohort({
      id: "cohort_001",
      regionId: "region_001",
      ageGroup: "AGE_25_44",
      population: 1000,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
    ...overrides,
  };
}

const evenCost = {
  survival: 10,
  basic: 10,
  services: 10,
  comfort: 10,
  prosperity: 10,
  luxury: 10,
};

describe("computeNeedsSatisfaction", () => {
  it("is fully satisfied (1) for a category with no defined cost -- inactive tier, not a deficiency", () => {
    const { spent } = allocateSpending({
      budget: 0,
      categoryCost: { ...evenCost, luxury: 0 },
    });
    const needs = computeNeedsSatisfaction(spent, { ...evenCost, luxury: 0 });
    expect(needs.modern).toBe(1);
  });

  it("is 0 for a fully-funded-nothing cohort with a real cost", () => {
    const { spent } = allocateSpending({ budget: 0, categoryCost: evenCost });
    const needs = computeNeedsSatisfaction(spent, evenCost);
    expect(needs.survival).toBe(0);
    expect(needs.totalSatisfaction).toBe(0);
  });

  it("is 1 for every tier when the budget fully covers every category", () => {
    const { spent } = allocateSpending({ budget: 1000, categoryCost: evenCost });
    const needs = computeNeedsSatisfaction(spent, evenCost);
    expect(needs.survival).toBe(1);
    expect(needs.basic).toBe(1);
    expect(needs.services).toBe(1);
    expect(needs.comfort).toBe(1);
    expect(needs.prosperity).toBe(1);
    expect(needs.modern).toBe(1);
    expect(needs.totalSatisfaction).toBe(1);
  });

  it("is a partial ratio when a tier is partly funded", () => {
    const { spent } = allocateSpending({ budget: 5, categoryCost: evenCost });
    const needs = computeNeedsSatisfaction(spent, evenCost);
    expect(needs.survival).toBe(0.5);
  });
});

describe("applyNeedsSatisfaction", () => {
  it("writes CohortNeeds onto the cohort and emits a fact when totalSatisfaction changes", () => {
    const { spent } = allocateSpending({ budget: 1000, categoryCost: evenCost });
    const result = applyNeedsSatisfaction({
      cohort: cohort(),
      spent,
      categoryCost: evenCost,
    });
    expect(result.cohort.needs.totalSatisfaction).toBe(1);
    expect(result.facts.some((fact) => fact.type === "needs_satisfaction_changed")).toBe(
      true,
    );
  });

  it("emits no fact when totalSatisfaction does not change", () => {
    const { spent } = allocateSpending({ budget: 0, categoryCost: evenCost });
    const result = applyNeedsSatisfaction({
      cohort: cohort(), // already 0 satisfaction by default
      spent,
      categoryCost: evenCost,
    });
    expect(result.cohort.needs.totalSatisfaction).toBe(0);
    expect(result.facts).toEqual([]);
  });
});

describe("Acceptance Gate: employed cohorts have higher needs satisfaction than unemployed ones", () => {
  it("an employed cohort out-satisfies an otherwise identical unemployed one", () => {
    const employed = cohort({ employment: 500, averageIncome: 1 });
    const unemployed = cohort({ employment: 0, averageIncome: 0 });

    const employedConsumption = applyHouseholdConsumption({
      cohort: employed,
      categoryCost: evenCost,
    });
    const unemployedConsumption = applyHouseholdConsumption({
      cohort: unemployed,
      categoryCost: evenCost,
    });

    const employedNeeds = applyNeedsSatisfaction({
      cohort: employedConsumption.cohort,
      spent: employedConsumption.spent,
      categoryCost: evenCost,
    }).cohort.needs;
    const unemployedNeeds = applyNeedsSatisfaction({
      cohort: unemployedConsumption.cohort,
      spent: unemployedConsumption.spent,
      categoryCost: evenCost,
    }).cohort.needs;

    expect(employedNeeds.totalSatisfaction).toBeGreaterThan(
      unemployedNeeds.totalSatisfaction,
    );
  });
});
