import {
  createCompany,
  createInventory,
  createPopulationCohort,
  createRegion,
  createWorld,
  createWorldState,
  type AgeGroup,
  type Company,
  type PopulationCohort,
} from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import {
  availableWorkers,
  eligibleLaborForce,
  regionAvailableWorkers,
  regionLaborForce,
} from "./employment.js";
import { normalizeWholeWorkforce } from "./whole-workforce.js";

/*
 * Decyzja właściciela (2026-10-01): pracownicy to zawsze całe osoby.
 * Przypadek z prawdziwego świata Black Mountain (Green Valley): kohorty w
 * wieku produkcyjnym 1, 4, 1, 1, 2, 1 osób. Silnik < 4 dawał 0,65 + 2,6 +
 * 0,65 + 0,65 + 1,3 + 0,65 = 6,5 pracownika.
 */
const GREEN_VALLEY: readonly (readonly [AgeGroup, number])[] = [
  ["AGE_15_24", 1],
  ["AGE_25_44", 4],
  ["AGE_45_64", 1],
  ["AGE_15_24", 1],
  ["AGE_25_44", 2],
  ["AGE_45_64", 1],
];
const cohort = (i: number, ageGroup: AgeGroup, population: number, employment = 0) => ({
  ...createPopulationCohort({
    id: `c${i}`,
    regionId: "r",
    ageGroup,
    population,
    economicClass: "WORKING",
    skillLevel: "UNSKILLED",
  }),
  employment,
});
const greenValley = (employment: readonly number[] = []): PopulationCohort[] =>
  GREEN_VALLEY.map(([age, pop], i) => cohort(i, age, pop, employment[i] ?? 0));

describe("labor force in whole people (ENGINE_VERSION 4)", () => {
  it("Green Valley: region labor force is 6 whole people, not 6.5", () => {
    const cohorts = greenValley();
    expect(regionLaborForce(cohorts)).toBe(6);
    expect(regionAvailableWorkers(cohorts)).toBe(6);
    // Limit kohorty w górę: 1-osobowa kohorta może dać 1 pracownika.
    expect(cohorts.map(eligibleLaborForce)).toEqual([1, 3, 1, 1, 2, 1]);
    for (const c of cohorts) expect(Number.isInteger(availableWorkers(c))).toBe(true);
  });

  it("integer arithmetic: no floating-point overshoot (20 × 0.65 = 13, not 14)", () => {
    expect(eligibleLaborForce(cohort(0, "AGE_25_44", 20))).toBe(13);
    expect(regionLaborForce([cohort(0, "AGE_25_44", 20)])).toBe(13);
    expect(eligibleLaborForce(cohort(0, "AGE_25_44", 110))).toBe(72); // ceil(71.5)
    expect(regionLaborForce([cohort(0, "AGE_25_44", 110)])).toBe(71); // floor(71.5)
    // Poza wiekiem produkcyjnym: 0.
    expect(eligibleLaborForce(cohort(0, "AGE_0_14", 100))).toBe(0);
    expect(regionLaborForce([cohort(0, "AGE_65_PLUS", 100)])).toBe(0);
    // Jedna osoba w regionie nie tworzy całego pracownika.
    expect(regionLaborForce([cohort(0, "AGE_25_44", 1)])).toBe(0);
  });

  it("region available workers subtract already employed whole people, never below 0", () => {
    expect(regionAvailableWorkers(greenValley([1, 3, 0, 0, 0, 0]))).toBe(2);
    expect(regionAvailableWorkers(greenValley([1, 3, 1, 1, 2, 1]))).toBe(0);
  });
});

describe("normalizeWholeWorkforce (save migration v3 → v4)", () => {
  function legacyState(employees: number, cohortEmployment: readonly number[], vacancies = 2.5) {
    const world = createWorld({
      id: "w",
      seed: "s",
      name: "W",
      configuration: { regionCount: 1, worldSizePreset: "test" },
    });
    const base = createCompany({
      id: "farm",
      archetypeId: "grain_farm",
      name: "Farm",
      foundedTick: 0,
      regionId: "r",
      ownerType: "individual",
      ownerEntityId: "c0",
      inventoryId: "inv",
    });
    const farm: Company = {
      ...base,
      workforce: { ...base.workforce, employees, vacancies },
    };
    return createWorldState({
      world,
      continents: [{ id: "k", worldId: world.id, name: "K", regionIds: [], tags: [] }],
      regions: [
        createRegion({
          id: "r",
          worldId: world.id,
          continentId: "k",
          name: "R",
          geography: {
            terrain: "plains",
            climate: "temperate",
            area: 10,
            fertility: 0.5,
            waterAccess: true,
            coastal: false,
            elevationClass: "lowland",
          },
        }),
      ],
      populationCohorts: greenValley(cohortEmployment),
      companies: [farm],
      inventories: [
        createInventory({ id: "inv", ownerType: "company", ownerId: "farm", locationRegionId: "r" }),
      ],
    });
  }

  it("Green Valley engine-3 state (6.5 employees) becomes 6 whole people on both sides", () => {
    const state = legacyState(6.5, [0.65, 2.6, 0.65, 0.65, 1.3, 0.65]);
    const next = normalizeWholeWorkforce(state);
    const farm = next.companies.farm!;
    expect(farm.workforce.employees).toBe(6);
    expect(farm.workforce.vacancies).toBe(2);
    const employment = Object.values(next.populationCohorts).map((c) => c.employment);
    for (const e of employment) expect(Number.isInteger(e)).toBe(true);
    // Suma kohort = pracownicy firm (inwariant P0-05), każda w limicie kohorty.
    expect(employment.reduce((a, b) => a + b, 0)).toBe(6);
    for (const c of Object.values(next.populationCohorts))
      expect(c.employment).toBeLessThanOrEqual(eligibleLaborForce(c));
    // Deterministyczna i idempotentna; wejście bez zmian.
    expect(normalizeWholeWorkforce(state)).toEqual(next);
    expect(normalizeWholeWorkforce(next)).toEqual(next);
    expect(state.companies.farm!.workforce.employees).toBe(6.5);
  });

  it("already-whole state is unchanged; float noise does not lose a person", () => {
    const whole = legacyState(6, [1, 3, 1, 1, 0, 0], 2);
    expect(normalizeWholeWorkforce(whole)).toEqual(whole);
    const noisy = legacyState(5.999999999999999, [1, 3, 1, 0.9999999999999998, 0, 0], 0);
    const next = normalizeWholeWorkforce(noisy);
    expect(next.companies.farm!.workforce.employees).toBe(6);
    expect(Object.values(next.populationCohorts).map((c) => c.employment)).toEqual([
      1, 3, 1, 1, 0, 0,
    ]);
  });
});
