import { createCompany, type Company } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { assessFinancialHealth } from "./financial-health.js";
import { decideLabor } from "./labor-decision.js";

function company(employees: number, cash = 1000): Company {
  const base = createCompany({
    id: "company_001",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: "inventory_001",
    initialCash: cash,
  });
  return { ...base, workforce: { ...base.workforce, employees } };
}

const healthy = assessFinancialHealth(company(0));
const distressed = assessFinancialHealth({
  ...company(0, 1),
  finance: { ...company(0).finance, cash: 1, profit: -100 },
});

describe("decideLabor", () => {
  it("HIREs and opens vacancies when the target exceeds current employees", () => {
    const result = decideLabor({
      company: company(50),
      tick: 1,
      targetEmployment: 80,
      financialHealth: healthy,
    });
    expect(result.action).toBe("HIRE");
    expect(result.company.workforce.vacancies).toBe(30);
    expect(result.layoffTarget).toBe(0);
    expect(result.facts.some((f) => f.type === "vacancies_opened")).toBe(true);
  });

  it("Test Labor Shortage: HOLDs when target already matches current employment", () => {
    const result = decideLabor({
      company: company(50),
      tick: 1,
      targetEmployment: 50,
      financialHealth: healthy,
    });
    expect(result.action).toBe("HOLD");
    expect(result.layoffTarget).toBe(0);
  });

  it("Test Layoff: LAYOFFs when the target is below current employment", () => {
    const result = decideLabor({
      company: company(50),
      tick: 1,
      targetEmployment: 20,
      financialHealth: healthy,
    });
    expect(result.action).toBe("LAYOFF");
    expect(result.layoffTarget).toBe(30);
  });

  it("Financial Survival: distress forces a minimum layoff even when target has already caught up", () => {
    const result = decideLabor({
      company: company(100, 1),
      tick: 1,
      targetEmployment: 100,
      financialHealth: distressed,
    });
    expect(result.action).toBe("LAYOFF");
    expect(result.layoffTarget).toBe(10); // ceil(100 * 0.1)
  });

  it("distress layoff uses the larger of the target gap and the minimum shrink step", () => {
    const result = decideLabor({
      company: company(100, 1),
      tick: 1,
      targetEmployment: 50,
      financialHealth: distressed,
    });
    expect(result.action).toBe("LAYOFF");
    expect(result.layoffTarget).toBe(50);
  });

  it("Test Cooldown: blocks another labor decision within the cooldown window", () => {
    const first = decideLabor({
      company: company(50),
      tick: 1,
      targetEmployment: 80,
      financialHealth: healthy,
    });
    expect(first.action).toBe("HIRE");

    const second = decideLabor({
      company: first.company,
      tick: 2,
      targetEmployment: 20, // would otherwise trigger an immediate LAYOFF
      financialHealth: healthy,
    });
    expect(second.action).toBe("HOLD");
    expect(second.company.workforce.vacancies).toBe(first.company.workforce.vacancies);
  });

  it("allows a new decision once the cooldown clears", () => {
    const first = decideLabor({
      company: company(50),
      tick: 1,
      targetEmployment: 80,
      financialHealth: healthy,
    });
    const second = decideLabor({
      company: first.company,
      tick: 10,
      targetEmployment: 20,
      financialHealth: healthy,
    });
    expect(second.action).toBe("LAYOFF");
  });

  it("audit regression (P1, vacancies rosnące bez końca): vacancies track the current gap instead of accumulating across repeated HIRE ticks", () => {
    // Labor supply never actually arrives (currentEmployees stays 50 every
    // tick, as if matchEmployment found nobody to hire), so the target gap
    // is the same 30 every time -- before the fix, each non-cooldown HIRE
    // tick added another 30 on top, growing without bound.
    let c = company(50);
    for (let tick = 1; tick <= 40; tick += 10) {
      // step past LAYOFF_COOLDOWN_TICKS (2) each iteration
      const result = decideLabor({
        company: c,
        tick,
        targetEmployment: 80,
        financialHealth: healthy,
      });
      expect(result.action).toBe("HIRE");
      expect(result.company.workforce.vacancies).toBe(30);
      c = result.company;
    }
  });

  it("audit regression (P1): vacancies shrink back down when the target drops, instead of only ever growing", () => {
    const opened = decideLabor({
      company: company(50),
      tick: 1,
      targetEmployment: 80,
      financialHealth: healthy,
    });
    expect(opened.company.workforce.vacancies).toBe(30);

    const shrunk = decideLabor({
      company: opened.company,
      tick: 10, // past the cooldown
      targetEmployment: 55, // demand cooled off; still a HIRE, but a much smaller one
      financialHealth: healthy,
    });
    expect(shrunk.action).toBe("HIRE");
    expect(shrunk.company.workforce.vacancies).toBe(5);
  });

  it("audit regression (P1): reaching the target clears any stale unfilled vacancies instead of leaving them dangling", () => {
    const opened = decideLabor({
      company: company(50),
      tick: 1,
      targetEmployment: 80,
      financialHealth: healthy,
    });
    expect(opened.company.workforce.vacancies).toBe(30);

    // Employees never actually arrived at 80 (still 50), but the target
    // itself has now caught back down to exactly what's already employed.
    const settled = decideLabor({
      company: opened.company,
      tick: 10,
      targetEmployment: 50,
      financialHealth: healthy,
    });
    expect(settled.action).toBe("HOLD");
    expect(settled.company.workforce.vacancies).toBe(0);
  });

  it("forces vacancies to 0 on a LAYOFF -- a company should never simultaneously show open positions and lay people off", () => {
    const hired = decideLabor({
      company: company(50),
      tick: 1,
      targetEmployment: 80,
      financialHealth: healthy,
    });
    expect(hired.company.workforce.vacancies).toBe(30);

    const laidOff = decideLabor({
      company: hired.company,
      tick: 10,
      targetEmployment: 10,
      financialHealth: healthy,
    });
    expect(laidOff.action).toBe("LAYOFF");
    expect(laidOff.company.workforce.vacancies).toBe(0);
  });
});
