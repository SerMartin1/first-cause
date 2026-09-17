import {
  createCompany,
  createMarket,
  createPopulationCohort,
} from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { matchEmployment } from "./labor/employment.js";
import { adjustWageOffer } from "./labor/wages.js";
import { initializeMarketGood, updateMarketGood } from "./markets/price-adjustment.js";
import { applyHouseholdConsumption } from "../population/consumption.js";

/**
 * Roadmap M9 risk note: "sprzężenie zwrotne płace<->ceny<->popyt może
 * wzmacniać oscylację z M8 -- mitygacja: ten sam test stresowy z M8
 * uruchamiany ponownie po M9". This wires the M9 labor/consumption
 * modules to the M8 market in the same shape a future tick orchestrator
 * would (wages -> employment -> household income -> spending -> Market
 * demand -> price), and re-runs M8's 100-tick "no oscillation" stress
 * test on top of that composition. The glue converting a household's
 * dollar spend on `grain` into a physical demand quantity
 * (`spent / localPrice`) belongs to this test only -- no production
 * module owns that conversion yet, since M9's module list stops at
 * `population/consumption` (money allocated per category), not at a
 * specific Market good.
 */
describe("M8+M9 regression: labor/wages feeding Market demand does not reintroduce oscillation", () => {
  it("100-tick stress test: a persistent labor shortage drives wages, income and demand up without destabilizing the price", () => {
    let market = createMarket({ id: "market_region_001", regionId: "region_001" });
    market = { ...market, goods: { grain: initializeMarketGood(10) } };

    let company = createCompany({
      id: "company_farm",
      archetypeId: "grain_farm",
      name: "Farm",
      foundedTick: 0,
      regionId: "region_001",
      ownerType: "individual",
      ownerEntityId: "cohort_001",
      inventoryId: "inventory_farm",
      initialWageOffer: 10,
    });

    let cohort = createPopulationCohort({
      id: "cohort_001",
      regionId: "region_001",
      ageGroup: "AGE_25_44",
      population: 1000, // 650 eligible -- enough to keep absorbing the 10 vacancies opened each tick
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    });

    let previousPrice = 10;
    let previousWage = 10;

    for (let tick = 0; tick < 100; tick++) {
      // Standing pool of 10 open positions each tick (test-only stand-in
      // for demand planning, which is M11 AI scope -- not something
      // M9's `matchEmployment` decides). Availability stays fixed at 5,
      // below vacancies, so the shortage -- and its wage pressure --
      // persists across the whole run.
      company = {
        ...company,
        workforce: {
          ...company.workforce,
          vacancies: 10,
          skillDemand: { UNSKILLED: 10 },
        },
      };

      // 1. Wages react to the persistent shortage.
      const wageResult = adjustWageOffer({ company, availableLabor: 5 });
      company = wageResult.company;

      // 2. Employment fills whatever it can from the cohort.
      const employmentResult = matchEmployment({ company, cohort });
      company = employmentResult.company;
      cohort = employmentResult.cohort;

      // 3. Household income/spending (only "survival" has a real cost -- the only good with content today).
      const consumption = applyHouseholdConsumption({
        cohort,
        categoryCost: {
          survival: cohort.population * 0.05 * market.goods.grain!.localPrice,
          basic: 0,
          services: 0,
          comfort: 0,
          prosperity: 0,
          luxury: 0,
        },
      });
      cohort = consumption.cohort;

      // 4. Convert survival spend into a physical demand quantity for the Market (future orchestrator's job).
      const householdDemandQuantity =
        consumption.spent.survival / market.goods.grain!.localPrice;

      const marketResult = updateMarketGood({
        market,
        goodId: "grain",
        supply: 20, // fixed physical output this scenario
        demandSources: { households: householdDemandQuantity },
        inventory: 0,
      });
      market = marketResult.market;

      const price = market.goods.grain!.localPrice;
      const wage = company.workforce.wageOffer;

      expect(Number.isFinite(price)).toBe(true);
      expect(price).toBeGreaterThan(0);
      expect(Number.isFinite(wage)).toBe(true);
      expect(wage).toBeGreaterThan(0);
      // Bounded per-tick change on both sides -- no single-tick blowup regardless of the coupling.
      expect(Math.abs(price / previousPrice - 1)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(wage / previousWage - 1)).toBeLessThanOrEqual(0.1);

      previousPrice = price;
      previousWage = wage;
    }
  });
});
