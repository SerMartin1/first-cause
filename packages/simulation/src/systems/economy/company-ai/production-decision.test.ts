import { createCompany, type Company } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { assessFinancialHealth } from "./financial-health.js";
import { decideProduction, type DecideProductionInput } from "./production-decision.js";

function company(utilization = 0): Company {
  const base = createCompany({
    id: "company_001",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: "inventory_001",
    initialCash: 1000,
  });
  return { ...base, production: { ...base.production, utilization } };
}

const healthy = assessFinancialHealth(company());
const distressed = assessFinancialHealth({
  ...company(),
  finance: { ...company().finance, cash: 1, profit: -100 },
});

describe("decideProduction", () => {
  it("Test Production Reaction: a positive margin at target inventory/full input access increases utilization", () => {
    const result = decideProduction({
      company: company(0),
      expectedMargin: 1,
      inputAvailability: 1,
      inventoryLevel: 1,
      financialHealth: healthy,
    });
    expect(result.action).toBe("INCREASE");
    expect(result.company.production.utilization).toBeGreaterThan(0);
    expect(result.bottleneck).toBe("NONE");
  });

  it("Test No Overreaction: an extreme margin shock still moves utilization by a bounded step", () => {
    const result = decideProduction({
      company: company(0.5),
      expectedMargin: 1_000_000,
      inputAvailability: 1,
      inventoryLevel: 1,
      financialHealth: healthy,
    });
    expect(result.company.production.utilization - 0.5).toBeLessThanOrEqual(0.075 + 1e-9);
  });

  it("high inventory pushes utilization down even with a neutral margin", () => {
    const result = decideProduction({
      company: company(0.5),
      expectedMargin: 0,
      inputAvailability: 1,
      inventoryLevel: 3,
      financialHealth: healthy,
    });
    expect(result.action).toBe("REDUCE");
    expect(result.company.production.utilization).toBeLessThan(0.5);
    expect(result.bottleneck).toBe("DEMAND");
  });

  it("bottleneck is INPUT when input availability caps utilization below what margin/inventory alone would set", () => {
    const result = decideProduction({
      company: company(0),
      expectedMargin: 1,
      inputAvailability: 0.05,
      inventoryLevel: 1,
      financialHealth: healthy,
    });
    expect(result.bottleneck).toBe("INPUT");
    expect(result.company.production.utilization).toBeLessThanOrEqual(0.05);
  });

  it("STOPs when there is no input availability at all, regardless of margin", () => {
    const result = decideProduction({
      company: company(0.5),
      expectedMargin: 1000,
      inputAvailability: 0,
      inventoryLevel: 1,
      financialHealth: healthy,
    });
    expect(result.action).toBe("STOP");
    expect(result.company.production.utilization).toBe(0);
  });

  it("Priorytet przetrwania (SS23): a distressed company never increases from margin alone", () => {
    const result = decideProduction({
      company: company(0.5),
      expectedMargin: 1_000_000,
      inputAvailability: 1,
      inventoryLevel: 1,
      financialHealth: distressed,
    });
    expect(result.action).not.toBe("INCREASE");
    expect(result.company.production.utilization).toBe(0.5);
  });

  it("a distressed company can still reduce from a real loss", () => {
    const result = decideProduction({
      company: company(0.5),
      expectedMargin: -1000,
      inputAvailability: 1,
      inventoryLevel: 1,
      financialHealth: distressed,
    });
    expect(result.action).toBe("REDUCE");
  });

  it("100-tick stress test: persistent positive conditions raise utilization monotonically and it saturates at 1 without oscillation", () => {
    let c = company(0);
    let previous = 0;
    for (let tick = 0; tick < 100; tick++) {
      const result = decideProduction({
        company: c,
        expectedMargin: 1,
        inputAvailability: 1,
        inventoryLevel: 1,
        financialHealth: healthy,
      });
      c = result.company;
      expect(c.production.utilization).toBeGreaterThanOrEqual(previous);
      expect(c.production.utilization).toBeLessThanOrEqual(1);
      previous = c.production.utilization;
    }
    expect(previous).toBe(1);
  });

  it("Test Determinism: identical inputs always produce an identical result", () => {
    const input: DecideProductionInput = {
      company: company(0.3),
      expectedMargin: 0.5,
      inputAvailability: 0.9,
      inventoryLevel: 1.2,
      financialHealth: healthy,
    };
    const first = decideProduction(input);
    const second = decideProduction(input);
    expect(second.company.production.utilization).toBe(
      first.company.production.utilization,
    );
    expect(second.action).toBe(first.action);
    expect(second.bottleneck).toBe(first.bottleneck);
  });
});
