import { describe, expect, it } from "vitest";
import { createPopulationCohort, type AgeGroup } from "@first-cause/entities";
import { AGE_GROUP_ORDER, buildCohortFamily } from "./cohorts.js";

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
