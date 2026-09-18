import { createCompany, type Company } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { assessFinancialHealth } from "./financial-health.js";
import { decideLifecycle } from "./lifecycle-decision.js";

function company(
  overrides: { utilization?: number; capacity?: number; cash?: number } = {},
): Company {
  const base = createCompany({
    id: "company_001",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: "inventory_001",
    initialCash: overrides.cash ?? 1000,
  });
  return {
    ...base,
    production: {
      ...base.production,
      utilization: overrides.utilization ?? 0,
      capacity: overrides.capacity ?? 0,
    },
  };
}

const healthy = assessFinancialHealth(company());

describe("decideLifecycle", () => {
  it("Test Hysteresis: a single tick of high demand/margin is not enough to expand (persistence required)", () => {
    const result = decideLifecycle({
      company: company({ utilization: 1 }),
      tick: 1,
      financialHealth: healthy,
      demandPersistenceScore: 1,
      expectedMargin: 1,
      capitalCost: 0,
    });
    expect(result.action).toBe("HOLD");
    expect(result.company.production.capacity).toBe(0);
  });

  it("EXPANDs once demand/margin persist long enough, are affordable, and pass hysteresis", () => {
    let c = company({ utilization: 1 });
    let action = "HOLD";
    for (let tick = 1; tick <= 6; tick++) {
      const result = decideLifecycle({
        company: c,
        tick,
        financialHealth: healthy,
        demandPersistenceScore: 1,
        expectedMargin: 1,
        capitalCost: 0,
      });
      c = result.company;
      action = result.action;
    }
    expect(action).toBe("EXPAND");
    expect(c.production.capacity).toBeGreaterThan(0);
  });

  it("Test Cooldown: does not expand again immediately after just expanding", () => {
    let c = company({ utilization: 1 });
    for (let tick = 1; tick <= 6; tick++) {
      c = decideLifecycle({
        company: c,
        tick,
        financialHealth: healthy,
        demandPersistenceScore: 1,
        expectedMargin: 1,
        capitalCost: 0,
      }).company;
    }
    const capacityAfterExpansion = c.production.capacity;

    const nextTick = decideLifecycle({
      company: c,
      tick: 7,
      financialHealth: healthy,
      demandPersistenceScore: 1,
      expectedMargin: 1,
      capitalCost: 0,
    });
    expect(nextTick.action).not.toBe("EXPAND");
    expect(nextTick.company.production.capacity).toBe(capacityAfterExpansion);
  });

  it("does not expand when it cannot afford the capital cost", () => {
    let c = company({ utilization: 1, cash: 5 });
    let lastAction = "HOLD";
    for (let tick = 1; tick <= 6; tick++) {
      const result = decideLifecycle({
        company: c,
        tick,
        financialHealth: assessFinancialHealth(c),
        demandPersistenceScore: 1,
        expectedMargin: 1,
        capitalCost: 1000,
      });
      c = result.company;
      lastAction = result.action;
    }
    expect(lastAction).not.toBe("EXPAND");
    expect(c.production.capacity).toBe(0);
  });

  it("CONTRACTs on persistent idle capacity and losses", () => {
    let c = company({ utilization: 0, capacity: 10 });
    let action = "HOLD";
    for (let tick = 1; tick <= 3; tick++) {
      const result = decideLifecycle({
        company: c,
        tick,
        financialHealth: healthy,
        demandPersistenceScore: 0,
        expectedMargin: -1,
        capitalCost: 0,
      });
      c = result.company;
      action = result.action;
    }
    expect(action).toBe("CONTRACT");
    expect(c.production.capacity).toBeLessThan(10);
  });

  it("Test Closure: sustained near-zero cash runway eventually closes the company, with a DecisionSnapshot", () => {
    let c = company({ utilization: 0, capacity: 0, cash: 1 });
    const distressed = assessFinancialHealth({
      ...c,
      finance: { ...c.finance, cash: 1, profit: -10 },
    });
    let lastResult = decideLifecycle({
      company: c,
      tick: 1,
      financialHealth: distressed,
      demandPersistenceScore: 0,
      expectedMargin: 0,
      capitalCost: 0,
    });
    c = lastResult.company;
    for (let tick = 2; tick <= 6; tick++) {
      lastResult = decideLifecycle({
        company: c,
        tick,
        financialHealth: distressed,
        demandPersistenceScore: 0,
        expectedMargin: 0,
        capitalCost: 0,
      });
      c = lastResult.company;
    }
    expect(lastResult.action).toBe("CLOSE");
    expect(c.status.active).toBe(false);
    expect(c.closedTick).toBe(6);
    expect(lastResult.snapshot).toBeDefined();
    expect(lastResult.snapshot?.selectedAction).toBe("CLOSE");
  });

  it("Test Bankruptcy: a closure with 0/negative cash also flags bankrupt", () => {
    let c = company({ cash: 0 });
    const distressed = assessFinancialHealth({
      ...c,
      finance: { ...c.finance, cash: 0, profit: -10 },
    });
    for (let tick = 1; tick <= 6; tick++) {
      c = decideLifecycle({
        company: c,
        tick,
        financialHealth: distressed,
        demandPersistenceScore: 0,
        expectedMargin: 0,
        capitalCost: 0,
      }).company;
    }
    expect(c.status.bankrupt).toBe(true);
  });

  it("a closure with positive remaining cash is not flagged bankrupt", () => {
    let c = company({ cash: 50 });
    const distressed = assessFinancialHealth({
      ...c,
      finance: { ...c.finance, cash: 0.5, profit: -10 },
    });
    for (let tick = 1; tick <= 6; tick++) {
      c = decideLifecycle({
        company: c,
        tick,
        financialHealth: distressed,
        demandPersistenceScore: 0,
        expectedMargin: 0,
        capitalCost: 0,
      }).company;
    }
    expect(c.status.bankrupt).toBe(false);
  });

  it("does not close (or expand/contract) a single bad month -- closure requires persistence", () => {
    const c = company({ cash: 1 });
    const distressed = assessFinancialHealth({
      ...c,
      finance: { ...c.finance, cash: 1, profit: -10 },
    });
    const result = decideLifecycle({
      company: c,
      tick: 1,
      financialHealth: distressed,
      demandPersistenceScore: 0,
      expectedMargin: 0,
      capitalCost: 0,
    });
    expect(result.action).toBe("HOLD");
    expect(result.company.status.active).toBe(true);
  });

  it("audit regression (P1): an inactive company never EXPANDs, even when every other gate (score/persistence/cash) is satisfied", () => {
    let c: Company = {
      ...company({ utilization: 1 }),
      status: { ...company().status, active: false },
    };
    let lastResult = decideLifecycle({
      company: c,
      tick: 1,
      financialHealth: healthy,
      demandPersistenceScore: 1,
      expectedMargin: 1,
      capitalCost: 0,
    });
    c = lastResult.company;
    for (let tick = 2; tick <= 6; tick++) {
      lastResult = decideLifecycle({
        company: c,
        tick,
        financialHealth: healthy,
        demandPersistenceScore: 1,
        expectedMargin: 1,
        capitalCost: 0,
      });
      c = lastResult.company;
    }
    expect(lastResult.action).not.toBe("EXPAND");
    expect(c.production.capacity).toBe(0);
  });

  it("audit regression (P1): an inactive company never CONTRACTs, even when every other gate is satisfied", () => {
    let c: Company = {
      ...company({ utilization: 0, capacity: 10 }),
      status: { ...company().status, active: false },
    };
    let lastResult = decideLifecycle({
      company: c,
      tick: 1,
      financialHealth: healthy,
      demandPersistenceScore: 0,
      expectedMargin: -1,
      capitalCost: 0,
    });
    c = lastResult.company;
    for (let tick = 2; tick <= 3; tick++) {
      lastResult = decideLifecycle({
        company: c,
        tick,
        financialHealth: healthy,
        demandPersistenceScore: 0,
        expectedMargin: -1,
        capitalCost: 0,
      });
      c = lastResult.company;
    }
    expect(lastResult.action).not.toBe("CONTRACT");
    expect(c.production.capacity).toBe(10);
  });

  it("audit regression (P1, decision-snapshot niekompletny): EXPAND's snapshot.hardEligible is true on a real, active expansion", () => {
    let c = company({ utilization: 1 });
    let lastResult = decideLifecycle({
      company: c,
      tick: 1,
      financialHealth: healthy,
      demandPersistenceScore: 1,
      expectedMargin: 1,
      capitalCost: 0,
    });
    c = lastResult.company;
    for (let tick = 2; tick <= 6; tick++) {
      lastResult = decideLifecycle({
        company: c,
        tick,
        financialHealth: healthy,
        demandPersistenceScore: 1,
        expectedMargin: 1,
        capitalCost: 0,
      });
      c = lastResult.company;
    }
    expect(lastResult.action).toBe("EXPAND");
    const expandOption = lastResult.snapshot?.options.find((o) => o.action === "EXPAND");
    expect(expandOption?.hardEligible).toBe(true);
  });

  it("fails loud on a negative capitalCost instead of letting expansion mint cash (regression guard, audit P0-05)", () => {
    expect(() =>
      decideLifecycle({
        company: company({ utilization: 1 }),
        tick: 1,
        financialHealth: healthy,
        demandPersistenceScore: 1,
        expectedMargin: 1,
        capitalCost: -100,
      }),
    ).toThrow(/capitalCost/);
  });
});
