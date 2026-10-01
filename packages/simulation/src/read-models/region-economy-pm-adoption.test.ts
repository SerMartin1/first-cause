import { describe, expect, it } from "vitest";
import {
  createPmAdoptionScenarioRunner,
  PM_ADOPTION_SCENARIO as S,
  PM_ADOPTION_SCENARIO_OUTPUTS,
  pmAdoptionScenarioEconomy as scenarioEconomy,
  pmAdoptionScenarioProducedInTick as producedInTick,
  stepPmAdoptionScenarioUntilAdoption as stepUntilAdoption,
} from "../verification/pm-adoption-scenario.js";

/*
 * M21-VIS-R4B Economy, regresja: w ticku adopcji metody (AI-08) produkcja
 * idzie jeszcze starą recepturą, a `productionMethodId` wskazuje już nową.
 * Read Model nie może rozdzielić `outputLastTick` według NOWEJ metody.
 * Wszystko przez produkcyjny `WorldRunner.step()` (`runEconomyTick`).
 */

describe("region economy read model across a production-method adoption (real tick)", () => {
  it("adoption tick: production of the old recipe is not split by the new method -- explicit partial data", () => {
    const runner = createPmAdoptionScenarioRunner();
    const adoptionTick = stepUntilAdoption(runner);
    const company = runner.worldState.companies[S.companyId]!;

    // Tick faktycznie produkował STARĄ recepturą: tylko mąka, ilość = outputLastTick.
    const produced = producedInTick(runner, adoptionTick);
    expect(Object.keys(produced)).toEqual(["flour"]);
    expect(company.production.outputLastTick).toBeGreaterThan(0);
    expect(produced.flour).toBe(company.production.outputLastTick);
    // A `productionMethodId` wskazuje już nową metodę (zatwierdzony moment adopcji bez zmian).
    expect(company.production.productionMethodId).toBe(S.toMethodId);
    expect(runner.facts.some((f) => f.tick === adoptionTick && f.type === "production_method_adopted")).toBe(true);

    const economy = scenarioEconomy(runner);
    // Bez zgadywania z nowej metody: brak chleba i brak „mąki 4/10 z outputLastTick”.
    expect(economy.goods).toEqual([]);
    expect(economy.methodChangedCompanies).toBe(1);
    expect(economy.unattributedCompanies).toBe(0);
    // Zatrudnienie i firmy dalej znane -- częściowe są tylko dane o towarach.
    expect(economy.activeCompanies).toBe(1);
    expect(economy.employment).toBe(company.workforce.employees);
  });

  it("next tick: the new recipe really produces flour + bread and the Read Model matches it per good", () => {
    const runner = createPmAdoptionScenarioRunner();
    stepUntilAdoption(runner);
    const nextTick = runner.tick;
    runner.step();
    const produced = producedInTick(runner, nextTick);
    expect(Object.keys(produced).sort()).toEqual(["bread", "flour"]);
    expect(produced.bread! / produced.flour!).toBeCloseTo(6 / 4);

    const economy = scenarioEconomy(runner);
    expect(economy.methodChangedCompanies).toBe(0);
    expect(
      Object.fromEntries(economy.goods.map((g) => [g.goodId, g.produced])),
    ).toEqual(produced);
    // Bez sumy różnych towarów: osobne wiersze, każdy z własną ilością.
    expect(economy.goods.map((g) => g.goodId)).toEqual(["bread", "flour"]);
  });

  it("a method change that keeps the same single output would hide the bug -- this scenario does not", () => {
    // Stara metoda: 8 mąki / partia; nowa: 4 mąki + 6 chleba. Rozkład `outputLastTick`
    // ticka adopcji według nowej metody dałby chleb, którego nikt nie wyprodukował.
    expect(PM_ADOPTION_SCENARIO_OUTPUTS[S.fromMethodId]).toEqual({ flour: 8 });
    expect(PM_ADOPTION_SCENARIO_OUTPUTS[S.toMethodId]).toEqual({ flour: 4, bread: 6 });
  });
});
