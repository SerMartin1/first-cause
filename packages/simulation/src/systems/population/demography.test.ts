import { describe, expect, it } from "vitest";
import {
  createPopulationCohort,
  type AgeGroup,
  type PopulationCohort,
} from "@first-cause/entities";
import { AGE_GROUP_ORDER } from "./cohorts.js";
import {
  applyMonthlyDemography,
  DEFAULT_DEMOGRAPHY_RATES,
  type DemographyRates,
} from "./demography.js";

function buildFamily(populationByAgeGroup: Readonly<Record<AgeGroup, number>>) {
  return AGE_GROUP_ORDER.map((ageGroup) =>
    createPopulationCohort({
      id: `cohort_${ageGroup}`,
      regionId: "region_001",
      ageGroup,
      population: populationByAgeGroup[ageGroup],
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
  );
}

const EVEN_FAMILY: Readonly<Record<AgeGroup, number>> = {
  AGE_0_14: 120,
  AGE_15_24: 120,
  AGE_25_44: 120,
  AGE_45_64: 120,
  AGE_65_PLUS: 120,
};

function sumPopulation(cohorts: readonly PopulationCohort[]): number {
  return cohorts.reduce((sum, c) => sum + c.population, 0);
}

describe("applyMonthlyDemography -- age group transitions (POP-002, Simulation Model SS4.5)", () => {
  it("transfers population one bracket forward per month with no death/birth (exact, hand-verified numbers)", () => {
    const rates: DemographyRates = {
      deathRateByAgeGroup: {
        AGE_0_14: 0,
        AGE_15_24: 0,
        AGE_25_44: 0,
        AGE_45_64: 0,
        AGE_65_PLUS: 0,
      },
      birthRate: 0,
      // 1-year span => exact monthly aging fraction of 1/12; 120 * 1/12 = 10 exactly.
      agingSpanYears: { AGE_0_14: 1, AGE_15_24: 1, AGE_25_44: 1, AGE_45_64: 1 },
    };

    const result = applyMonthlyDemography(buildFamily(EVEN_FAMILY), { tick: 0, rates });
    const byAgeGroup = Object.fromEntries(
      result.cohorts.map((c) => [c.ageGroup, c.population]),
    );

    expect(byAgeGroup.AGE_0_14).toBe(110); // 120 - 10 aged out
    expect(byAgeGroup.AGE_15_24).toBe(120); // -10 out, +10 in
    expect(byAgeGroup.AGE_25_44).toBe(120);
    expect(byAgeGroup.AGE_45_64).toBe(120);
    expect(byAgeGroup.AGE_65_PLUS).toBe(130); // terminal bracket, +10 in only

    expect(result.facts).toEqual([
      {
        type: "population_declined",
        subject: { entityType: "populationCohort", entityId: "cohort_AGE_0_14" },
        location: { regionId: "region_001", settlementId: undefined },
        values: { before: 120, after: 110, delta: -10 },
      },
      {
        type: "population_increased",
        subject: { entityType: "populationCohort", entityId: "cohort_AGE_65_PLUS" },
        location: { regionId: "region_001", settlementId: undefined },
        values: { before: 120, after: 130, delta: 10 },
      },
    ]);
  });

  it("AGE_65_PLUS never ages out (terminal bracket, only deaths/inflow apply)", () => {
    const rates: DemographyRates = {
      deathRateByAgeGroup: {
        AGE_0_14: 0,
        AGE_15_24: 0,
        AGE_25_44: 0,
        AGE_45_64: 0,
        AGE_65_PLUS: 0,
      },
      birthRate: 0,
      agingSpanYears: {},
    };
    const result = applyMonthlyDemography(buildFamily(EVEN_FAMILY), { tick: 0, rates });
    const elderly = result.cohorts.find((c) => c.ageGroup === "AGE_65_PLUS")!;
    expect(elderly.population).toBe(120);
  });
});

describe("applyMonthlyDemography -- births (SIM-002)", () => {
  it("adds births only to AGE_0_14, leaving every other bracket (including the childbearing one) untouched", () => {
    const rates: DemographyRates = {
      deathRateByAgeGroup: {
        AGE_0_14: 0,
        AGE_15_24: 0,
        AGE_25_44: 0,
        AGE_45_64: 0,
        AGE_65_PLUS: 0,
      },
      birthRate: 0.076,
      agingSpanYears: {}, // isolate births from aging transfer
    };

    const result = applyMonthlyDemography(buildFamily(EVEN_FAMILY), { tick: 0, rates });
    const byAgeGroup = Object.fromEntries(
      result.cohorts.map((c) => [c.ageGroup, c.population]),
    );

    expect(byAgeGroup.AGE_0_14).toBeGreaterThan(120);
    expect(byAgeGroup.AGE_15_24).toBe(120);
    expect(byAgeGroup.AGE_25_44).toBe(120); // the childbearing bracket itself is not depleted by births
    expect(byAgeGroup.AGE_45_64).toBe(120);
    expect(byAgeGroup.AGE_65_PLUS).toBe(120);
    expect(result.facts).toEqual([
      {
        type: "population_increased",
        subject: { entityType: "populationCohort", entityId: "cohort_AGE_0_14" },
        location: { regionId: "region_001", settlementId: undefined },
        values: expect.objectContaining({ before: 120 }),
      },
    ]);
  });
});

describe("applyMonthlyDemography -- invariants", () => {
  it("delegates family validation to buildCohortFamily (throws on an incomplete family)", () => {
    const incomplete = buildFamily(EVEN_FAMILY).slice(0, 4);
    expect(() => applyMonthlyDemography(incomplete, { tick: 0 })).toThrow(
      /expected exactly 5/,
    );
  });

  it("never produces a negative cohort population, even at a 100% annual death rate", () => {
    const rates: DemographyRates = {
      deathRateByAgeGroup: {
        AGE_0_14: 1,
        AGE_15_24: 1,
        AGE_25_44: 1,
        AGE_45_64: 1,
        AGE_65_PLUS: 1,
      },
      birthRate: 0,
      agingSpanYears: { AGE_0_14: 1, AGE_15_24: 1, AGE_25_44: 1, AGE_45_64: 1 },
    };
    const result = applyMonthlyDemography(buildFamily(EVEN_FAMILY), { tick: 0, rates });
    for (const cohort of result.cohorts) {
      expect(cohort.population).toBe(0);
    }
  });

  it("conservation: every population change across the family is accounted for by an emitted fact", () => {
    let family: readonly PopulationCohort[] = buildFamily({
      AGE_0_14: 2000,
      AGE_15_24: 1500,
      AGE_25_44: 2800,
      AGE_45_64: 2200,
      AGE_65_PLUS: 1200,
    });

    for (let tick = 0; tick < 50; tick++) {
      const before = sumPopulation(family);
      const result = applyMonthlyDemography(family, { tick });
      const after = sumPopulation(result.cohorts);
      const sumOfFactDeltas = result.facts.reduce(
        (sum, f) => sum + (f.values.delta ?? 0),
        0,
      );
      expect(after - before).toBe(sumOfFactDeltas);
      family = result.cohorts;
    }
  });
});

describe("applyMonthlyDemography -- 200-year smoke test (M6 Acceptance Gate)", () => {
  // DEFAULT_DEMOGRAPHY_RATES was numerically tuned (see demography.ts doc
  // comment) so a 2400-tick run lands within roughly +-10% of its start
  // for several starting distributions. The bounds asserted here are
  // deliberately looser (order-of-magnitude) so the test guards against
  // an actual explosion/collapse bug without being fragile to a small,
  // intentional rate retune.
  it("stays within a bounded range over 200 years without going negative", () => {
    let family: readonly PopulationCohort[] = buildFamily({
      AGE_0_14: 2000,
      AGE_15_24: 1500,
      AGE_25_44: 2800,
      AGE_45_64: 2200,
      AGE_65_PLUS: 1200,
    });
    const startTotal = sumPopulation(family);

    for (let tick = 0; tick < 2400; tick++) {
      const result = applyMonthlyDemography(family, {
        tick,
        rates: DEFAULT_DEMOGRAPHY_RATES,
      });
      for (const cohort of result.cohorts) {
        expect(cohort.population).toBeGreaterThanOrEqual(0);
      }
      family = result.cohorts;
    }

    const endTotal = sumPopulation(family);
    expect(endTotal).toBeGreaterThan(startTotal * 0.5);
    expect(endTotal).toBeLessThan(startTotal * 2);
  });
});
