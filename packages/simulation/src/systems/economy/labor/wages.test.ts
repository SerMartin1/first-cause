import { createCompany, type Company } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { InvariantViolationError } from "../../../core/validation.js";
import { adjustWageOffer } from "./wages.js";

function company(vacancies: number, wageOffer = 10): Company {
  const base = createCompany({
    id: "company_farm",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_owner",
    inventoryId: "inventory_farm",
    initialWageOffer: wageOffer,
  });
  return { ...base, workforce: { ...base.workforce, vacancies } };
}

describe("adjustWageOffer", () => {
  it("fails loud without a seeded wageOffer", () => {
    expect(() => adjustWageOffer({ company: company(10, 0), availableLabor: 0 })).toThrow(
      InvariantViolationError,
    );
  });

  it("FC-LABOR-001: persistent vacancies + labor shortage raise the wage offer, bounded", () => {
    const result = adjustWageOffer({ company: company(10, 10), availableLabor: 0 });
    expect(result.company.workforce.wageOffer).toBeGreaterThan(10);
    expect(result.laborShortageSeverity).toBeGreaterThan(0);
    const relativeChange = (result.company.workforce.wageOffer - 10) / 10;
    expect(relativeChange).toBeLessThanOrEqual(0.1);
  });

  it("lowers the wage offer under a labor surplus", () => {
    const result = adjustWageOffer({ company: company(5, 10), availableLabor: 1000 });
    expect(result.company.workforce.wageOffer).toBeLessThan(10);
    expect(result.laborShortageSeverity).toBe(0);
  });

  it("leaves the wage offer untouched when supply exactly matches vacancies", () => {
    const result = adjustWageOffer({ company: company(10, 10), availableLabor: 10 });
    expect(result.company.workforce.wageOffer).toBe(10);
    expect(result.facts).toEqual([]);
  });

  it("never drops the wage offer to zero or below under an extreme surplus", () => {
    let c = company(1, 10);
    for (let tick = 0; tick < 50; tick++) {
      const result = adjustWageOffer({ company: c, availableLabor: 1_000_000 });
      c = result.company;
      expect(c.workforce.wageOffer).toBeGreaterThan(0);
      expect(Number.isFinite(c.workforce.wageOffer)).toBe(true);
    }
  });

  it("emits a wage_offer_changed fact only when the wage actually moves", () => {
    const changed = adjustWageOffer({ company: company(10, 10), availableLabor: 0 });
    expect(changed.facts.some((fact) => fact.type === "wage_offer_changed")).toBe(true);

    const unchanged = adjustWageOffer({ company: company(10, 10), availableLabor: 10 });
    expect(unchanged.facts).toEqual([]);
  });

  it("100-tick stress test: a persistent labor shortage drifts wages monotonically, never reversing (no oscillation loop)", () => {
    let c = company(10, 10);
    let previousWage = 10;
    for (let tick = 0; tick < 100; tick++) {
      const result = adjustWageOffer({ company: c, availableLabor: 5 });
      c = result.company;
      expect(c.workforce.wageOffer).toBeGreaterThanOrEqual(previousWage);
      expect(c.workforce.wageOffer / previousWage - 1).toBeLessThanOrEqual(0.1);
      previousWage = c.workforce.wageOffer;
    }
  });
});
