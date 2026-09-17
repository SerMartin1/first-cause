import { describe, expect, it } from "vitest";
import { createPopulationCohort, type AgeGroup } from "@first-cause/entities";
import {
  AGE_GROUP_ORDER,
  buildCohortFamily,
  groupCohortsIntoFamilies,
} from "./cohorts.js";

function buildFamily(overrides?: { regionId?: string; settlementId?: string }) {
  const regionId = overrides?.regionId ?? "region_001";
  const settlementId = overrides?.settlementId;
  return AGE_GROUP_ORDER.map((ageGroup) =>
    createPopulationCohort({
      id: `cohort_${ageGroup}`,
      regionId,
      ...(settlementId !== undefined ? { settlementId } : {}),
      ageGroup,
      population: 100,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
  );
}

describe("buildCohortFamily", () => {
  it("indexes a complete, identity-consistent set of cohorts by age group", () => {
    const family = buildCohortFamily(buildFamily());
    for (const ageGroup of AGE_GROUP_ORDER) {
      expect(family[ageGroup].ageGroup).toBe(ageGroup);
    }
  });

  it("rejects fewer than 5 cohorts", () => {
    const cohorts = buildFamily().slice(0, 4);
    expect(() => buildCohortFamily(cohorts)).toThrow(/expected exactly 5/);
  });

  it("rejects more than 5 cohorts", () => {
    const extra = createPopulationCohort({
      id: "cohort_extra",
      regionId: "region_001",
      ageGroup: "AGE_0_14",
      population: 1,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    });
    expect(() => buildCohortFamily([...buildFamily(), extra])).toThrow(
      /expected exactly 5/,
    );
  });

  it("rejects a duplicate age group", () => {
    const cohorts = buildFamily();
    const duplicated = [...cohorts.slice(0, 4), { ...cohorts[0]!, id: "cohort_dup" }];
    expect(() => buildCohortFamily(duplicated)).toThrow(/duplicate ageGroup/);
  });

  it("rejects cohorts that don't share the same location/socioeconomic identity", () => {
    const mismatched = [
      ...buildFamily().slice(0, 4),
      createPopulationCohort({
        id: "cohort_other_region",
        regionId: "region_999",
        ageGroup: "AGE_65_PLUS" as AgeGroup,
        population: 100,
        economicClass: "WORKING",
        skillLevel: "UNSKILLED",
      }),
    ];
    expect(() => buildCohortFamily(mismatched)).toThrow(/does not share the family/);
  });

  it("treats settlementId as part of the shared identity", () => {
    const worldFamily = buildFamily();
    const settlementFamily = buildFamily({ settlementId: "settlement_001" });
    expect(() =>
      buildCohortFamily([...worldFamily.slice(0, 4), settlementFamily[4]!]),
    ).toThrow(/does not share the family/);
  });
});

describe("groupCohortsIntoFamilies (regression, przegląd P1 #2: fixture M4 -> demografia M6 bez ręcznego przygotowania)", () => {
  it("dopełnia brakujące grupy wieku syntetyczną kohortą o populacji 0, tak jak wygląda fixture Black Mountain (jedna kohorta na tożsamość, nie pięć)", () => {
    // Odwzorowanie kształtu tests/worldgen/fixtures/black_mountain_reference.json:
    // dwie różne tożsamości (economicClass/skillLevel) w tym samym regionie,
    // każda reprezentowana przez tylko jedną grupę wieku.
    const workers = createPopulationCohort({
      id: "cohort_black_mountain_workers",
      regionId: "region_black_mountain",
      settlementId: "settlement_black_mountain_camp",
      ageGroup: "AGE_25_44",
      population: 6,
      economicClass: "WORKING",
      skillLevel: "SKILLED",
    });
    const youth = createPopulationCohort({
      id: "cohort_black_mountain_youth",
      regionId: "region_black_mountain",
      settlementId: "settlement_black_mountain_camp",
      ageGroup: "AGE_15_24",
      population: 4,
      economicClass: "POOR",
      skillLevel: "UNSKILLED",
    });

    const families = groupCohortsIntoFamilies([workers, youth]);

    expect(families).toHaveLength(2);
    for (const family of families) {
      for (const ageGroup of AGE_GROUP_ORDER) {
        expect(family[ageGroup].ageGroup).toBe(ageGroup);
      }
    }

    const workersFamily = families.find((family) => family.AGE_25_44.id === workers.id)!;
    expect(workersFamily.AGE_25_44.population).toBe(6);
    expect(workersFamily.AGE_15_24.population).toBe(0); // syntetyczna, dopełniona
    expect(workersFamily.AGE_15_24.economicClass).toBe("WORKING");
    expect(workersFamily.AGE_15_24.skillLevel).toBe("SKILLED");

    const youthFamily = families.find((family) => family.AGE_15_24.id === youth.id)!;
    expect(youthFamily.AGE_15_24.population).toBe(4);
    expect(youthFamily.AGE_25_44.population).toBe(0);
  });

  it("nie wymyśla populacji -- suma po dopełnieniu równa się sumie przed", () => {
    const cohorts = [
      createPopulationCohort({
        id: "cohort_a",
        regionId: "region_001",
        ageGroup: "AGE_0_14",
        population: 6,
        economicClass: "POOR",
        skillLevel: "UNSKILLED",
      }),
      createPopulationCohort({
        id: "cohort_b",
        regionId: "region_002",
        ageGroup: "AGE_45_64",
        population: 7,
        economicClass: "MIDDLE",
        skillLevel: "SPECIALIST",
      }),
    ];

    const families = groupCohortsIntoFamilies(cohorts);
    const total = families.reduce(
      (sum, family) =>
        sum + AGE_GROUP_ORDER.reduce((s, ageGroup) => s + family[ageGroup].population, 0),
      0,
    );
    expect(total).toBe(6 + 7);
  });

  it("nie dotyka już kompletnej rodziny (przechodzi przez buildCohortFamily bez zmian)", () => {
    const complete = buildFamily();
    const [family] = groupCohortsIntoFamilies(complete);
    for (const ageGroup of AGE_GROUP_ORDER) {
      expect(family![ageGroup]).toBe(
        complete.find((cohort) => cohort.ageGroup === ageGroup),
      );
    }
  });
});
