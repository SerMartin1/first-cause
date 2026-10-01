import { createCompany, type Company } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import type { ProductionRecipe } from "../production.js";
import { assessFinancialHealth } from "./financial-health.js";
import {
  decideProduction,
  forecastDemand,
  sellableVolume,
  stockCoverage,
  type DecideProductionInput,
  type PlanGoodMarket,
} from "./production-decision.js";

/*
 * AI-03 plan produkcji (etap 1 naprawy po diagnozie Black Mountain,
 * 2026-10-01): wynik = możliwa sprzedaż − wejścia − płace, pokrycie zapasem
 * w miesiącach popytu, opcje w całych partiach.
 */
const FARM: ProductionRecipe = {
  productionMethodId: "manual_farming",
  employeesPerBatch: 1,
  resourceInputsPerBatch: { grain: 10 },
  goodInputsPerBatch: {},
  goodOutputsPerBatch: { flour: 8 },
  eligibleCompanyArchetypeIds: [],
};

function company(capacity: number, utilization: number, wage = 10, profit = 0): Company {
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
    initialWageOffer: wage,
  });
  return {
    ...base,
    production: { ...base.production, capacity, utilization },
    finance: { ...base.finance, profit },
  };
}

const flour = (over: Partial<PlanGoodMarket> = {}): PlanGoodMarket => ({
  price: 2,
  forecastDemand: 24,
  totalStock: 0,
  share: 1,
  ...over,
});

function input(c: Company, over: Partial<DecideProductionInput> = {}): DecideProductionInput {
  return {
    company: c,
    recipe: FARM,
    goods: { flour: flour() },
    inputAvailability: 1,
    financialHealth: assessFinancialHealth(c),
    employeesPerCapacityUnit: 1,
    ...over,
  };
}

describe("decideProduction (AI-03 production plan)", () => {
  it("forecast = average of the last 3 months; empty history = no data (never zero)", () => {
    expect(forecastDemand([10, 20, 30, 40])).toBe(30);
    expect(forecastDemand([12])).toBe(12);
    expect(forecastDemand([])).toBeUndefined();
    expect(forecastDemand(undefined)).toBeUndefined();
  });

  it("coverage: months of forecast demand; zero demand with stock = surplus, not a tiny-number artefact", () => {
    expect(stockCoverage(48, 24)).toEqual({ kind: "MONTHS", months: 2 });
    expect(stockCoverage(5, 0)).toEqual({ kind: "SURPLUS_NO_DEMAND" });
    expect(stockCoverage(0, 0)).toEqual({ kind: "NO_STOCK_NO_DEMAND" });
    expect(stockCoverage(5, undefined)).toEqual({ kind: "NO_DATA" });
  });

  it("sellable volume = demand + restock to the 2-month target, never negative", () => {
    expect(sellableVolume(flour({ totalStock: 0 }))).toBe(72); // 24 + 48
    expect(sellableVolume(flour({ totalStock: 48 }))).toBe(24); // at target
    expect(sellableVolume(flour({ totalStock: 200 }))).toBe(0); // glut
    expect(sellableVolume(flour({ forecastDemand: 0 }))).toBe(0);
  });

  it("increases when coverage < 1 month and the extra batch pays its wage", () => {
    const result = decideProduction(input(company(10, 0.5)));
    expect(result.action).toBe("INCREASE");
    expect(result.plan!.batches).toBe(6);
    expect(result.plan!.plannedEmployees).toBe(6);
    // 48 jedn. sprzedane po 2,00 − 6 × 10 płac.
    expect(result.plan!.expectedResult).toBeCloseTo(96 - 60);
  });

  it("Black Mountain regression: a regional glut (> 3 months) reduces output instead of expanding into it", () => {
    // Zapas 547 jedn. przy popycie 24/mies. -- dawny AI-03 nadal zwiększał produkcję.
    const result = decideProduction(
      input(company(12.5, 1, 15), { goods: { flour: flour({ price: 1, totalStock: 547 }) } }),
    );
    expect(result.coverage).toEqual({ kind: "MONTHS", months: 547 / 24 });
    expect(result.action).toBe("REDUCE");
    expect(result.bottleneck).toBe("DEMAND");
    expect(result.plan!.expectedRevenue).toBe(0); // niesprzedana produkcja nie jest przychodem
  });

  it("unsold output is not revenue; wages make an over-sized plan unattractive", () => {
    const result = decideProduction(
      input(company(10, 1), { goods: { flour: flour({ totalStock: 48 }) } }),
    );
    // Pokrycie 2 mies. (pasmo): tylko utrzymanie/zmniejszenie; 10 partii = 80 jedn., rynek przyjmie 24.
    expect(result.options.every((o) => o.batches <= 10)).toBe(true);
    const full = result.options.find((o) => o.batches === 10)!;
    expect(full.unsoldOutput).toBe(56);
    expect(result.plan!.batches).toBeLessThan(10);
  });

  it("No Overreaction: moves by at most one step of whole batches per tick", () => {
    const result = decideProduction(
      input(company(100, 0.5), { goods: { flour: flour({ forecastDemand: 10_000 }) } }),
    );
    expect(result.plan!.batches - 50).toBeLessThanOrEqual(8); // round(100 × 0,075)
  });

  it("a small company can reach its first whole batch (capacity 1, utilization 0.5)", () => {
    const result = decideProduction(input(company(1, 0.5)));
    expect(result.plan!.batches).toBe(1);
    expect(result.company.production.utilization).toBe(1);
  });

  it("bottleneck is INPUT when input availability caps the plan", () => {
    const result = decideProduction(input(company(10, 0.5), { inputAvailability: 0.3 }));
    expect(result.bottleneck).toBe("INPUT");
    expect(result.company.production.utilization).toBe(0.3);
    expect(result.plan!.batches).toBe(3);
  });

  it("STOPs when there is no input availability at all", () => {
    const result = decideProduction(input(company(10, 0.5), { inputAvailability: 0 }));
    expect(result.action).toBe("STOP");
  });

  it("SS23: a distressed company that is losing money never increases", () => {
    const c = { ...company(10, 0.5, 10, -100), finance: { ...company(10, 0.5).finance, cash: 1, profit: -100 } };
    const result = decideProduction(input(c));
    expect(result.plan!.batches).toBeLessThanOrEqual(5);
  });

  it("no demand history = no data: the company holds its level instead of planning zero sales", () => {
    const result = decideProduction(
      input(company(10, 0.5), { goods: { flour: flour({ forecastDemand: undefined }) } }),
    );
    expect(result.plan).toBeUndefined();
    expect(result.coverage).toEqual({ kind: "NO_DATA" });
    expect(result.action).toBe("MAINTAIN");
    expect(result.company.production.utilization).toBe(0.5);
  });

  it("shares regional demand: a company with half the share plans for half the market", () => {
    const whole = decideProduction(input(company(20, 0.5), { goods: { flour: flour({ totalStock: 48 }) } }));
    const half = decideProduction(
      input(company(20, 0.5), { goods: { flour: flour({ totalStock: 48, share: 0.5 }) } }),
    );
    expect(half.plan!.expectedRevenue).toBeLessThan(whole.plan!.expectedRevenue);
  });

  it("Determinism: identical inputs produce an identical result", () => {
    const a = decideProduction(input(company(10, 0.5)));
    const b = decideProduction(input(company(10, 0.5)));
    expect(a).toEqual(b);
  });

  it("fails loud on a non-finite price (regression guard, audit P0-05)", () => {
    expect(() =>
      decideProduction(input(company(10, 0.5), { goods: { flour: flour({ price: Number.NaN }) } })),
    ).toThrow();
  });
});
