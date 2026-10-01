import {
  createCompany,
  createPopulationCohort,
  createWorldState,
  type Company,
  type PopulationCohort,
  type WorldState,
} from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { WorldRunner } from "../../core/world-runner.js";
import {
  createPmAdoptionScenarioRunner,
  PM_ADOPTION_SCENARIO as S,
  PM_ADOPTION_SCENARIO_RUNNER_CONFIG,
} from "../../verification/pm-adoption-scenario.js";
import { runTradeScenario } from "../../verification/trade-scenario.js";
import { addConsignment } from "./consignment.js";
import {
  OWNER_PAYOUT_BUFFER_MONTHS,
  operatingBuffer,
  ownerPayoutAmount,
  recordOperatingCosts,
  resolveOwnerRecipient,
} from "./owner-income.js";

/*
 * Dochód właścicielski (decyzja właściciela 2026-10-01, Canonical §52H):
 * wypłata = min(max(0, wynik zatrzymany), max(0, gotówka − bufor)), raz na
 * tick, po rozliczeniu sprzedaży i kosztów; do gospodarstwa właściciela.
 */

const OWNER = "scenario_cohort_mill_workers";
const cents = (v: number) => Math.round(v * 100);

/** Scenariusz młyna z nadpisanym stanem firmy / kohort (prawdziwy `WorldRunner`). */
function runnerWith(patch: {
  readonly company?: (c: Company) => Company;
  readonly cohorts?: (cohorts: Record<string, PopulationCohort>) => Record<string, PopulationCohort>;
  readonly world?: (w: WorldState) => WorldState;
}): WorldRunner {
  const fresh = createPmAdoptionScenarioRunner();
  let w = fresh.worldState;
  const company = w.companies[S.companyId]!;
  w = {
    ...w,
    companies: { ...w.companies, [S.companyId]: patch.company ? patch.company(company) : company },
    populationCohorts: patch.cohorts
      ? patch.cohorts({ ...w.populationCohorts })
      : w.populationCohorts,
  };
  if (patch.world) w = patch.world(w);
  // Przebudowa cache regionów (lista kohort) jak po każdym ticku.
  w = createWorldState({
    world: w.world,
    continents: Object.values(w.continents),
    regions: Object.values(w.regions),
    connections: Object.values(w.connections),
    resourceDeposits: Object.values(w.resourceDeposits),
    settlements: Object.values(w.settlements),
    populationCohorts: Object.values(w.populationCohorts),
    companies: Object.values(w.companies),
    markets: Object.values(w.markets),
    inventories: Object.values(w.inventories),
    technologyStates: Object.values(w.technologyStates),
    architectInfluence: w.architectInfluence,
    interventions: Object.values(w.interventions),
  });
  return WorldRunner.fromState({ ...fresh.getState(), worldState: w }, PM_ADOPTION_SCENARIO_RUNNER_CONFIG);
}

const factsOfTick = (runner: WorldRunner, tick: number, type: string) =>
  runner.facts.filter((f) => f.tick === tick && f.type === type);

const totalMoney = (w: WorldState) =>
  cents(
    Object.values(w.populationCohorts).reduce((s, c) => s + c.savings, 0) +
      Object.values(w.companies).reduce((s, c) => s + c.finance.cash, 0),
  );

describe("owner-income rules (pure)", () => {
  it("buffer = 2 × max(average of available cost observations, next-tick obligations)", () => {
    expect(OWNER_PAYOUT_BUFFER_MONTHS).toBe(2);
    expect(operatingBuffer([], 0)).toBe(0);
    expect(operatingBuffer([], 30)).toBe(60);
    expect(operatingBuffer([10, 20, 30], 5)).toBe(40);
    expect(operatingBuffer([10, 20, 30], 50)).toBe(100);
    // Krótsza historia: dostępne obserwacje.
    expect(operatingBuffer([40], 0)).toBe(80);
    expect(recordOperatingCosts([1, 2, 3], 4)).toEqual([2, 3, 4]);
  });

  it("payout = min(retained result, cash − buffer), never negative", () => {
    const base = createCompany({
      id: "c",
      archetypeId: "a",
      name: "C",
      foundedTick: 0,
      regionId: "r",
      ownerType: "individual",
      ownerEntityId: "o",
      inventoryId: "i",
      initialCash: 500,
    });
    const at = (cash: number, retainedEarnings: number) => ({
      ...base,
      finance: { ...base.finance, cash, retainedEarnings },
    });
    expect(ownerPayoutAmount(at(500, 0), 0)).toBe(0); // kapitał początkowy to nie zysk
    expect(ownerPayoutAmount(at(600, 100), 50)).toBe(100); // ograniczenie wynikiem
    expect(ownerPayoutAmount(at(600, 100), 550)).toBe(50); // ograniczenie buforem i gotówką
    expect(ownerPayoutAmount(at(40, 100), 60)).toBe(0); // gotówka poniżej bufora
    expect(ownerPayoutAmount(at(900, -50), 0)).toBe(0); // niepokryta strata
  });

  it("recipient: owner cohort; empty owner cohort → its living household; none → no recipient", () => {
    const company = createCompany({
      id: "c",
      archetypeId: "a",
      name: "C",
      foundedTick: 0,
      regionId: "r",
      ownerType: "individual",
      ownerEntityId: "owner",
      inventoryId: "i",
    });
    const cohort = (id: string, ageGroup: PopulationCohort["ageGroup"], population: number, economicClass: PopulationCohort["economicClass"] = "WORKING") =>
      createPopulationCohort({ id, regionId: "r", ageGroup, population, economicClass, skillLevel: "SKILLED" });
    const owner = cohort("owner", "AGE_25_44", 3);
    const sibling = cohort("sibling", "AGE_45_64", 2);
    const otherFamily = cohort("other", "AGE_25_44", 9, "POOR");
    expect(resolveOwnerRecipient(company, { owner, sibling, other: otherFamily }, {})).toEqual({ kind: "cohort", id: "owner" });
    const emptied = { ...owner, population: 0 };
    expect(resolveOwnerRecipient(company, { owner: emptied, sibling, other: otherFamily }, {})).toEqual({ kind: "cohort", id: "sibling" });
    expect(resolveOwnerRecipient(company, { owner: emptied, sibling: { ...sibling, population: 0 }, other: otherFamily }, {})).toBeUndefined();
    expect(resolveOwnerRecipient({ ...company, ownerType: "state" }, { owner }, {})).toBeUndefined();
    expect(resolveOwnerRecipient({ ...company, ownerType: "company", ownerEntityId: "p" }, {}, { p: { ...company, id: "p" } })).toEqual({ kind: "company", id: "p" });
  });
});

describe("owner income through the real tick (WorldRunner.step)", () => {
  it("pays the owner's household (not every cohort), bounded by buffer and cash; money conserved to the cent", () => {
    const runner = runnerWith({
      // Inna rodzina w regionie (nie właściciel) -- nie dostaje wypłat.
      cohorts: (cohorts) => ({
        ...cohorts,
        scenario_cohort_poor: {
          ...createPopulationCohort({
            id: "scenario_cohort_poor",
            regionId: S.regionId,
            ageGroup: "AGE_25_44",
            population: 10,
            economicClass: "POOR",
            skillLevel: "UNSKILLED",
          }),
          savings: 150,
        },
      }),
    });
    const before = totalMoney(runner.worldState);
    let payouts = 0;
    for (let i = 0; i < 24; i++) {
      const tick = runner.tick;
      runner.step();
      const expansions = runner.facts.filter((f) => f.type === "company_expanded").length;
      expect(totalMoney(runner.worldState) + expansions * 100 * 100, `tick ${tick}`).toBe(before);
      const paid = factsOfTick(runner, tick, "company_owner_payout");
      const received = factsOfTick(runner, tick, "owner_income_received");
      expect(paid.length).toBeLessThanOrEqual(1); // raz na tick
      expect(received.map((f) => f.subject.entityId)).toEqual(paid.length ? [OWNER] : []);
      if (paid.length === 0) continue;
      payouts += 1;
      const amount = -Number(paid[0]!.values.delta);
      expect(Number(received[0]!.values.delta)).toBe(amount);
      // Ograniczenia: wynik zatrzymany przed wypłatą i gotówka ponad bufor.
      const company = runner.worldState.companies[S.companyId]!;
      const buffer = operatingBuffer(
        company.finance.operatingCostHistory,
        company.workforce.wageOffer * company.workforce.employees,
      );
      expect(cents(amount)).toBeLessThanOrEqual(cents(company.finance.retainedEarnings + amount));
      expect(cents(amount)).toBeLessThanOrEqual(cents(Number(paid[0]!.values.before) - buffer) + 1);
      expect(company.finance.retainedEarnings).toBeGreaterThanOrEqual(0);
    }
    expect(payouts).toBeGreaterThan(0);
  });

  it("initial capital is never paid out; payouts never exceed accumulated profit", () => {
    const runner = createPmAdoptionScenarioRunner();
    let profit = 0;
    let paid = 0;
    for (let i = 0; i < 36; i++) {
      const tick = runner.tick;
      runner.step();
      const c = runner.worldState.companies[S.companyId]!;
      profit += factsOfTick(runner, tick, "company_finances_settled").reduce(
        (s, f) => s + Number(f.values.delta),
        0,
      );
      paid += factsOfTick(runner, tick, "company_owner_payout").reduce(
        (s, f) => s - Number(f.values.delta),
        0,
      );
      expect(cents(paid)).toBeLessThanOrEqual(Math.max(0, cents(profit)));
      expect(cents(c.finance.retainedEarnings)).toBe(cents(profit - paid));
    }
    // Firma bez sprzedaży (bez metody produkcji) ma tylko koszty płac: z
    // kapitału 1000 nic nie trafia do właściciela.
    const idle = runnerWith({
      company: (c) => ({ ...c, production: { ...c.production, productionMethodId: undefined } }),
    });
    for (let i = 0; i < 6; i++) idle.step();
    expect(idle.facts.filter((f) => f.type === "company_owner_payout")).toEqual([]);
    expect(idle.facts.filter((f) => f.type === "owner_income_received")).toEqual([]);
    expect(idle.worldState.companies[S.companyId]!.finance.retainedEarnings).toBeLessThan(0);
  });

  it("later profits first cover earlier losses", () => {
    const runner = runnerWith({
      company: (c) => ({ ...c, finance: { ...c.finance, retainedEarnings: -150 } }),
    });
    let profit = 0;
    let firstPayoutTick: number | undefined;
    for (let i = 0; i < 36; i++) {
      const tick = runner.tick;
      runner.step();
      profit += factsOfTick(runner, tick, "company_finances_settled").reduce(
        (s, f) => s + Number(f.values.delta),
        0,
      );
      const paid = factsOfTick(runner, tick, "company_owner_payout");
      if (paid.length === 0) continue;
      firstPayoutTick ??= tick;
      // Wypłata dopiero, gdy zyski pokryły stratę 150.
      expect(profit).toBeGreaterThan(150);
    }
    expect(firstPayoutTick).toBeDefined();
    expect(firstPayoutTick).toBeGreaterThan(0);
  });

  it("a closed company pays its owner the proceeds of consignment sales", () => {
    const runner = runnerWith({
      company: (c) => ({
        ...c,
        status: { active: false, distressed: false, bankrupt: false },
        closedTick: 0,
        workforce: { ...c.workforce, employees: 0 },
        finance: { ...c.finance, operatingCostHistory: [] },
      }),
      cohorts: (cohorts) => ({ ...cohorts, [OWNER]: { ...cohorts[OWNER]!, employment: 0 } }),
      world: (w) => {
        const regionInv = Object.values(w.inventories).find((i) => i.ownerType === "region")!;
        return {
          ...w,
          inventories: {
            ...w.inventories,
            [regionInv.id]: addConsignment(
              { ...regionInv, items: { flour: { quantity: 10, averageCost: 0, ageBuckets: {} } } },
              "flour",
              S.companyId,
              10,
            ),
          },
        };
      },
    });
    const cashBefore = runner.worldState.companies[S.companyId]!.finance.cash;
    const moneyBefore = totalMoney(runner.worldState);
    runner.step();
    const sale = factsOfTick(runner, 0, "company_finances_settled")[0]!;
    const revenue = Number(sale.values.delta);
    expect(revenue).toBeGreaterThan(0);
    const paid = factsOfTick(runner, 0, "company_owner_payout");
    expect(paid).toHaveLength(1);
    expect(-Number(paid[0]!.values.delta)).toBe(revenue);
    // Etap 4B (likwidacja): zysk z komisu jako wypłata zysku, pozostała gotówka
    // (kapitał) jako zwrot kapitału -- osobny fakt, nie zysk; firma ma 0.
    const returned = factsOfTick(runner, 0, "company_capital_returned");
    expect(returned).toHaveLength(1);
    expect(-Number(returned[0]!.values.delta)).toBe(cashBefore);
    expect(factsOfTick(runner, 0, "capital_return_received")).toHaveLength(1);
    const company = runner.worldState.companies[S.companyId]!;
    expect(company.finance.cash).toBe(0);
    expect(company.finance.retainedEarnings).toBe(0);
    expect(totalMoney(runner.worldState)).toBe(moneyBefore);
    // Następny tick: nic do zwrotu drugi raz.
    runner.step();
    expect(factsOfTick(runner, 1, "company_capital_returned")).toEqual([]);
  });

  it("ownership stays with the household when the owner cohort empties; no household → nothing paid, result kept", () => {
    const sibling = {
      ...createPopulationCohort({
        id: "scenario_cohort_mill_workers_45_64",
        regionId: S.regionId,
        ageGroup: "AGE_45_64",
        population: 20,
        economicClass: "WORKING",
        skillLevel: "UNSKILLED",
      }),
      savings: 0,
    };
    const profitable = (c: Company): Company => ({
      ...c,
      finance: { ...c.finance, retainedEarnings: 200, operatingCostHistory: [20] },
    });
    // Kohorta właściciela bez ludzi (np. wyjazd całej grupy) -- pieniądze do jej gospodarstwa.
    const runner = runnerWith({
      company: profitable,
      cohorts: (cohorts) => ({
        ...cohorts,
        [OWNER]: { ...cohorts[OWNER]!, population: 0, employment: 0 },
        [sibling.id]: sibling,
      }),
    });
    runner.step();
    const received = factsOfTick(runner, 0, "owner_income_received");
    expect(received.map((f) => f.subject.entityId)).toEqual([sibling.id]);

    // Rodzina bez ludzi: brak wypłaty, wynik zostaje w firmie, gotówka nie znika.
    const orphan = runnerWith({
      company: profitable,
      cohorts: (cohorts) => ({ ...cohorts, [OWNER]: { ...cohorts[OWNER]!, population: 0, employment: 0 } }),
    });
    const moneyBefore = totalMoney(orphan.worldState);
    orphan.step();
    expect(factsOfTick(orphan, 0, "company_owner_payout")).toEqual([]);
    const profit = factsOfTick(orphan, 0, "company_finances_settled").reduce(
      (sum, f) => sum + Number(f.values.delta),
      0,
    );
    expect(cents(orphan.worldState.companies[S.companyId]!.finance.retainedEarnings)).toBe(
      cents(200 + profit),
    );
    expect(totalMoney(orphan.worldState)).toBe(moneyBefore);
  });

  it("trade moves goods, not money: at most one payout per company per tick across regions", () => {
    const runner = runTradeScenario(24);
    const byTick = new Map<string, number>();
    for (const f of runner.facts.filter((x) => x.type === "company_owner_payout")) {
      const key = `${f.tick}:${f.subject.entityId}`;
      byTick.set(key, (byTick.get(key) ?? 0) + 1);
    }
    for (const count of byTick.values()) expect(count).toBe(1);
    for (const c of Object.values(runner.worldState.companies))
      expect(c.finance.operatingCostHistory.length).toBeLessThanOrEqual(3);
  });
});
