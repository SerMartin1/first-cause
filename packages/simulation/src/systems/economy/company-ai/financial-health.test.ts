import { createCompany, type Company } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { assessFinancialHealth } from "./financial-health.js";

function company(finance: { cash: number; revenue: number; profit: number }): Company {
  const base = createCompany({
    id: "company_001",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: "inventory_001",
    initialCash: finance.cash,
  });
  return {
    ...base,
    finance: { ...base.finance, revenue: finance.revenue, profit: finance.profit },
  };
}

describe("assessFinancialHealth", () => {
  it("computes profitMargin as profit/revenue", () => {
    const health = assessFinancialHealth(
      company({ cash: 1000, revenue: 100, profit: 20 }),
    );
    expect(health.profitMargin).toBeCloseTo(0.2, 10);
  });

  it("profitMargin is 0 when revenue is 0, not NaN", () => {
    const health = assessFinancialHealth(company({ cash: 1000, revenue: 0, profit: 0 }));
    expect(health.profitMargin).toBe(0);
  });

  it("cashRunwayMonths is infinite when breaking even or profitable", () => {
    const health = assessFinancialHealth(
      company({ cash: 1000, revenue: 100, profit: 0 }),
    );
    expect(health.cashRunwayMonths).toBe(Number.POSITIVE_INFINITY);
    expect(health.distressed).toBe(false);
  });

  it("cashRunwayMonths is cash / |loss| when losing money", () => {
    const health = assessFinancialHealth(
      company({ cash: 100, revenue: 50, profit: -10 }),
    );
    expect(health.cashRunwayMonths).toBeCloseTo(10, 10);
  });

  it("Financial Survival: flags distressed when the cash runway is short", () => {
    const health = assessFinancialHealth(company({ cash: 5, revenue: 50, profit: -10 })); // 0.5 months
    expect(health.distressed).toBe(true);
  });

  it("flags distressed at 0 or negative cash regardless of profit", () => {
    const health = assessFinancialHealth(company({ cash: 0, revenue: 100, profit: 5 }));
    expect(health.distressed).toBe(true);
  });

  it("is not distressed with ample cash and a long runway", () => {
    const health = assessFinancialHealth(
      company({ cash: 10_000, revenue: 100, profit: -10 }),
    );
    expect(health.distressed).toBe(false);
  });
});
