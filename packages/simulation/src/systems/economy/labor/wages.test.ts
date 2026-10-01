import { createCompany, type Company } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { InvariantViolationError } from "../../../core/validation.js";
import { adjustWageOffer, affordableEmployees, planWageBounds } from "./wages.js";

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

describe("N4 wage bounds (Black Mountain diagnosis, stage 1)", () => {
  const plan = { plannedEmployees: 6, expectedRevenue: 96, inputCosts: 0 };

  it("ceiling = (revenue − non-wage costs − 10% buffer) / planned workers; floor = survival basket", () => {
    const bounds = planWageBounds(plan, 6);
    expect(bounds.ceiling).toBeCloseTo((96 - 9.6) / 6);
    expect(bounds.floor).toBe(6);
    expect(planWageBounds(undefined, 6).ceiling).toBeUndefined();
    expect(affordableEmployees(plan, 20)).toBe(4);
  });

  it("Black Mountain regression: wages no longer spiral above what sales can pay", () => {
    // Dawniej wakaty > siła robocza podnosiły płacę 10 → 18 bez limitu.
    let c = company(7, 10);
    for (let tick = 0; tick < 30; tick++) {
      c = adjustWageOffer({ company: c, availableLabor: 0, bounds: planWageBounds(plan, 6) })
        .company;
    }
    expect(c.workforce.wageOffer).toBeLessThanOrEqual(planWageBounds(plan, 6).ceiling! + 1e-9);
  });

  it("moves at most 3% per tick toward the bounds (gradual), and never below the survival floor", () => {
    const high = adjustWageOffer({
      company: company(0, 20),
      availableLabor: 0,
      bounds: { floor: 6, ceiling: 10 },
    }).company.workforce.wageOffer;
    expect(high).toBeCloseTo(19.4); // −3%, nie skok do 10
    let low = company(0, 1);
    for (let tick = 0; tick < 200; tick++)
      low = adjustWageOffer({ company: low, availableLabor: 100, bounds: { floor: 6, ceiling: 50 } })
        .company;
    expect(low.workforce.wageOffer).toBeCloseTo(6, 1); // rośnie do podłogi mimo nadwyżki pracy
  });
});

describe("P12b: stawka płacy z precyzją 6 miejsc", () => {
  it("płaca 0,16 schodzi ku podłodze 0,06 (dawniej zaokrąglenie do grosza ją zatrzymywało)", () => {
    let c = company(0, 0.16);
    const wages: number[] = [];
    for (let tick = 0; tick < 12; tick++) {
      c = adjustWageOffer({
        company: c,
        availableLabor: 10,
        bounds: { floor: 0.06, ceiling: 0.1 },
      }).company;
      wages.push(c.workforce.wageOffer);
    }
    expect(wages[0]).toBe(0.1552); // 0,16 × (1 − 3%)
    expect(wages.at(-1)!).toBeLessThan(0.12);
    expect(wages.at(-1)!).toBeGreaterThanOrEqual(0.06);
    for (const w of wages) expect(Math.round(w * 1e6) / 1e6).toBe(w);
  });
});
