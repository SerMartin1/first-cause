import type { AgeGroup, PopulationCohort } from "@first-cause/entities";
import { InvariantViolationError } from "../../core/validation.js";

/**
 * Age-group transition topology (Entity Data Model SS11, POP-002): a
 * cohort ages out of its bracket into exactly the next one; AGE_65_PLUS
 * is terminal -- no further transition, only deaths (Simulation Model
 * SS4.5 "aging transfer between cohorts").
 */
export const AGE_GROUP_ORDER: readonly AgeGroup[] = [
  "AGE_0_14",
  "AGE_15_24",
  "AGE_25_44",
  "AGE_45_64",
  "AGE_65_PLUS",
];

export const NEXT_AGE_GROUP: Readonly<Partial<Record<AgeGroup, AgeGroup>>> = {
  AGE_0_14: "AGE_15_24",
  AGE_15_24: "AGE_25_44",
  AGE_25_44: "AGE_45_64",
  AGE_45_64: "AGE_65_PLUS",
};

/**
 * A "cohort family": exactly one `PopulationCohort` per age group,
 * sharing the same location/socioeconomic identity (regionId,
 * settlementId, economicClass, skillLevel, profession). M6 never
 * changes those identity fields -- social mobility (M9) and skill
 * change (M15) don't exist yet -- so a family's five records are the
 * complete, stable unit that monthly demography redistributes
 * population across.
 */
export type CohortFamily = Readonly<Record<AgeGroup, PopulationCohort>>;

function identityKey(cohort: PopulationCohort): string {
  return JSON.stringify([
    cohort.regionId,
    cohort.settlementId ?? null,
    cohort.economicClass,
    cohort.skillLevel,
    cohort.profession ?? null,
  ]);
}

/**
 * Validates and indexes a flat list of cohorts into a `CohortFamily`:
 * exactly one per age group, all sharing the same identity. Throws
 * rather than silently dropping/mixing population -- same fail-loud
 * policy as `core/validation.ts` -- since a caller passing an
 * incomplete or mismatched set would otherwise corrupt demography
 * silently (population appearing/disappearing with no registered
 * cause, violating the M6 conservation invariant).
 */
export function buildCohortFamily(cohorts: readonly PopulationCohort[]): CohortFamily {
  if (cohorts.length !== AGE_GROUP_ORDER.length) {
    throw new InvariantViolationError(
      `buildCohortFamily: expected exactly ${AGE_GROUP_ORDER.length} cohorts (one per age group), got ${cohorts.length}`,
    );
  }

  const expectedIdentityKey = identityKey(cohorts[0]!);
  const byAgeGroup: Partial<Record<AgeGroup, PopulationCohort>> = {};

  for (const cohort of cohorts) {
    if (identityKey(cohort) !== expectedIdentityKey) {
      throw new InvariantViolationError(
        `buildCohortFamily: cohort ${cohort.id} does not share the family's location/socioeconomic identity`,
      );
    }
    if (byAgeGroup[cohort.ageGroup]) {
      throw new InvariantViolationError(
        `buildCohortFamily: duplicate ageGroup ${cohort.ageGroup} in a single family`,
      );
    }
    byAgeGroup[cohort.ageGroup] = cohort;
  }

  // No two of the `AGE_GROUP_ORDER.length` cohorts share an ageGroup (the
  // loop above would have thrown), and there are exactly that many
  // possible AgeGroup values, so byAgeGroup is necessarily complete here.
  return byAgeGroup as CohortFamily;
}
