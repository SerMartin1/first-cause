import { createPopulationCohort, type PopulationCohort } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { InvariantViolationError } from "../../core/validation.js";
import {
  SPENDING_ORDER,
  allocateSpending,
  applyHouseholdConsumption,
  computeHouseholdIncome,
} from "./consumption.js";

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

describe("computeHouseholdIncome", () => {
  it("is employment * averageIncome (Wages only -- Transfers/Property Income/Taxes are M17+/untouched)", () => {
    expect(computeHouseholdIncome(cohort({ employment: 100, averageIncome: 5 }))).toBe(
      500,
    );
  });

  it("is 0 for an unemployed cohort", () => {
    expect(computeHouseholdIncome(cohort({ employment: 0, averageIncome: 5 }))).toBe(0);
  });
});

describe("allocateSpending", () => {
  const fullCost = {
    survival: 10,
    basic: 10,
    services: 10,
    comfort: 10,
    prosperity: 10,
    luxury: 10,
  };

  it("FC-POP-001: funds categories strictly in ECO-014 order", () => {
    const { spent } = allocateSpending({ budget: 25, categoryCost: fullCost });
    expect(spent.survival).toBe(10);
    expect(spent.basic).toBe(10);
    expect(spent.services).toBe(5); // budget runs out mid-tier
    expect(spent.comfort).toBe(0);
    expect(spent.prosperity).toBe(0);
    expect(spent.luxury).toBe(0);
    expect(spent.savings).toBe(0);
  });

  it("FC-POP-002: never allocates more than the available budget (no money, no purchase)", () => {
    const { spent } = allocateSpending({ budget: 0, categoryCost: fullCost });
    for (const category of SPENDING_ORDER) {
      expect(spent[category]).toBe(0);
    }
  });

  it("puts every leftover unit into savings once all needs are funded", () => {
    const { spent } = allocateSpending({ budget: 100, categoryCost: fullCost });
    expect(spent.savings).toBe(40); // 100 - (6 * 10)
  });

  it("fails loud on a negative budget or category cost", () => {
    expect(() => allocateSpending({ budget: -1, categoryCost: fullCost })).toThrow(
      InvariantViolationError,
    );
    expect(() =>
      allocateSpending({ budget: 10, categoryCost: { ...fullCost, basic: -1 } }),
    ).toThrow(InvariantViolationError);
  });
});

describe("applyHouseholdConsumption", () => {
  const cheapNeeds = {
    survival: 1,
    basic: 1,
    services: 1,
    comfort: 1,
    prosperity: 1,
    luxury: 1,
  };

  it("writes consumptionBudget and savingsRate from computed income", () => {
    const result = applyHouseholdConsumption({
      cohort: cohort({ employment: 10, averageIncome: 2 }), // income = 20
      categoryCost: cheapNeeds,
    });
    expect(result.cohort.consumptionBudget).toBe(20);
    expect(result.spent.savings).toBe(14); // 20 - 6
    expect(result.cohort.savingsRate).toBeCloseTo(14 / 20, 10);
  });

  it("has a 0 savingsRate for a cohort with no income", () => {
    const result = applyHouseholdConsumption({
      cohort: cohort({ employment: 0, averageIncome: 0 }),
      categoryCost: cheapNeeds,
    });
    expect(result.cohort.savingsRate).toBe(0);
  });

  it("emits a consumption_budget_changed fact only when the budget actually moves", () => {
    const changed = applyHouseholdConsumption({
      cohort: cohort({ employment: 10, averageIncome: 2, consumptionBudget: 0 }),
      categoryCost: cheapNeeds,
    });
    expect(changed.facts.some((fact) => fact.type === "consumption_budget_changed")).toBe(
      true,
    );

    const unchanged = applyHouseholdConsumption({
      cohort: cohort({ employment: 0, averageIncome: 0, consumptionBudget: 0 }),
      categoryCost: cheapNeeds,
    });
    expect(unchanged.facts).toEqual([]);
  });
});
