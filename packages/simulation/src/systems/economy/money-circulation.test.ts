import { createInventory } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { WorldRunner } from "../../core/world-runner.js";
import {
  createPmAdoptionScenarioRunner,
  PM_ADOPTION_SCENARIO as S,
  PM_ADOPTION_SCENARIO_RUNNER_CONFIG,
} from "../../verification/pm-adoption-scenario.js";
import { addConsignment, moveConsignment, takeConsignment } from "./consignment.js";
import {
  initialHouseholdSavings,
  splitMoney,
  survivalBasketCost,
} from "../population/household-budget.js";

/*
 * Etap 2 naprawy gospodarki (N7 + minimalne rozliczenie N6, 2026-10-01):
 * pieniądz krąży między firmami i gospodarstwami bez tworzenia i gubienia.
 */

describe("splitMoney / household budget", () => {
  it("splits to the cent without creating or losing money; remainder to the largest weight", () => {
    const parts = splitMoney(10, [
      ["a", 1],
      ["b", 1],
      ["c", 1],
    ]);
    expect(parts).toEqual({ a: 3.34, b: 3.33, c: 3.33 });
    expect(Object.values(parts).reduce((x, y) => x + y, 0)).toBeCloseTo(10, 10);
    expect(
      splitMoney(5, [
        ["x", 0],
        ["y", 0],
      ]),
    ).toEqual({ x: 5, y: 0 });
  });

  it("initial savings = 3 months of the survival basket at the local price", () => {
    expect(survivalBasketCost(2)).toBe(6);
    expect(initialHouseholdSavings(15, 2)).toBe(270);
    expect(initialHouseholdSavings(15, 0)).toBe(0);
  });
});

describe("consignment register (goods in the regional store owned by producers)", () => {
  const base = createInventory({
    id: "inv",
    ownerType: "region",
    ownerId: "r",
    locationRegionId: "r",
  });

  it("takes pro rata from owners; stock without an owner is reported as unowned", () => {
    let inv = addConsignment(base, "flour", "farm_a", 30);
    inv = addConsignment(inv, "flour", "farm_b", 10);
    // Zapas 50, z czego 40 w komisie: zakup 10 = 6 (a) + 2 (b) + 2 bez właściciela.
    const take = takeConsignment(inv, "flour", 10, 50);
    expect(take.takenByOwner.farm_a).toBeCloseTo(6);
    expect(take.takenByOwner.farm_b).toBeCloseTo(2);
    expect(take.unowned).toBeCloseTo(2);
    expect(take.inventory.consignment?.flour?.farm_a).toBeCloseTo(24);
  });

  it("trade moves ownership together with the goods", () => {
    const from = addConsignment(base, "flour", "farm_a", 20);
    const to = { ...base, id: "inv2" };
    const moved = moveConsignment(from, to, "flour", 5, 20);
    expect(moved.from.consignment?.flour?.farm_a).toBeCloseTo(15);
    expect(moved.to.consignment?.flour?.farm_a).toBeCloseTo(5);
  });
});

describe("money circulation through the real tick (WorldRunner.step)", () => {
  const totalMoney = (runner: WorldRunner) => {
    const w = runner.worldState;
    return (
      Object.values(w.populationCohorts).reduce((sum, c) => sum + c.savings, 0) +
      Object.values(w.companies).reduce((sum, c) => sum + c.finance.cash, 0)
    );
  };

  it("wages reach households, purchases pay the producer: total money is conserved to the cent", () => {
    const runner = createPmAdoptionScenarioRunner();
    const before = totalMoney(runner);
    for (let tick = 0; tick < 24; tick++) {
      runner.step();
      // Jedyny jawny odpływ: rozbudowa mocy (`EXPANSION_CAPITAL_COST` = 100,
      // zakup środków trwałych spoza modelu -- poza zakresem etapu 2).
      const capitalSpent =
        100 * runner.facts.filter((f) => f.type === "company_expanded").length;
      expect(
        Math.abs(totalMoney(runner) + capitalSpent - before),
        `tick ${tick}`,
      ).toBeLessThan(0.005);
    }
    const company = runner.worldState.companies[S.companyId]!;
    // Przychód firmy pochodzi wyłącznie z zakupów: zapis potrzeb / popytu / zakupów na rynku.
    const flour = runner.worldState.markets.scenario_market_mill!.goods.flour!;
    expect(flour.householdNeed).toBe(
      Object.values(runner.worldState.populationCohorts).reduce(
        (s, c) => s + c.population,
        0,
      ) * 3,
    );
    expect(flour.householdPurchased).toBeGreaterThan(0);
    expect(company.finance.revenue).toBeGreaterThan(0);
  });

  it("unemployed households buy survival goods from savings; with no stock the money stays on their account", () => {
    const fresh = createPmAdoptionScenarioRunner();
    const w = fresh.worldState;
    const cohortId = Object.keys(w.populationCohorts)[0]!;
    // Bez pracy, bez firmy: tylko oszczędności i towar w komisie innego właściciela.
    const regionInv = Object.values(w.inventories).find((i) => i.ownerType === "region")!;
    const stocked = addConsignment(
      {
        ...regionInv,
        items: { flour: { quantity: 10, averageCost: 0, ageBuckets: {} } },
      },
      "flour",
      S.companyId,
      10,
    );
    const runner = WorldRunner.fromState(
      {
        ...fresh.getState(),
        worldState: {
          ...w,
          companies: {
            [S.companyId]: {
              ...w.companies[S.companyId]!,
              // Właściciel bez skarbu (`state`): zysk z komisu zostaje w firmie --
              // wypłatę zamkniętej firmy sprawdza `owner-income.test.ts`.
              ownerType: "state",
              status: { active: false, distressed: false, bankrupt: false },
              workforce: { ...w.companies[S.companyId]!.workforce, employees: 0 },
            },
          },
          populationCohorts: {
            ...w.populationCohorts,
            [cohortId]: {
              ...w.populationCohorts[cohortId]!,
              employment: 0,
              savings: 100,
            },
          },
          inventories: { ...w.inventories, [regionInv.id]: stocked },
        },
      },
      PM_ADOPTION_SCENARIO_RUNNER_CONFIG,
    );
    const cashBefore = runner.worldState.companies[S.companyId]!.finance.cash;
    runner.step();
    const after = runner.worldState;
    const bought = 10 - (after.inventories[regionInv.id]!.items.flour?.quantity ?? 0);
    expect(bought).toBeGreaterThan(0); // zakup bez pracy, z oszczędności
    const spent = 100 - after.populationCohorts[cohortId]!.savings;
    expect(spent).toBeGreaterThan(0);
    // Zamknięta firma-właściciel towaru dostaje zapłatę z komisu.
    expect(after.companies[S.companyId]!.finance.cash - cashBefore).toBeCloseTo(spent, 2);

    // Kolejny tick: towaru brak -- pieniądze zostają na koncie.
    const savingsBefore = after.populationCohorts[cohortId]!.savings;
    runner.step();
    expect(runner.worldState.populationCohorts[cohortId]!.savings).toBe(savingsBefore);
  });
});
