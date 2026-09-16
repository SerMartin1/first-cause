import { describe, expect, it } from "vitest";
import { createPopulationCohort } from "./cohort.js";

describe("createPopulationCohort", () => {
  it("creates a cohort with zeroed needs/economy fields", () => {
    const cohort = createPopulationCohort({
      id: "cohort_001",
      regionId: "region_001",
      ageGroup: "AGE_25_44",
      population: 500,
      economicClass: "WORKING",
      skillLevel: "SKILLED",
    });

    expect(cohort.population).toBe(500);
    expect(cohort.needs.totalSatisfaction).toBe(0);
    expect(cohort.employment).toBe(0);
  });

  it("rejects a negative population (rule 9: no negative stocks)", () => {
    expect(() =>
      createPopulationCohort({
        id: "cohort_001",
        regionId: "region_001",
        ageGroup: "AGE_25_44",
        population: -1,
        economicClass: "WORKING",
        skillLevel: "SKILLED",
      }),
    ).toThrow();
  });
});
