import {
  createPopulationCohort,
  type AgeGroup,
  type PopulationCohort,
} from "@first-cause/entities";
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
 * Grupy wieku, z których można się jeszcze zestarzeć dalej (wszystkie
 * poza AGE_65_PLUS). Używane, żeby `agingSpanYears` w demografii nie
 * dało się w ogóle skonfigurować dla grupy terminalnej -- literalnie
 * nie ma dokąd z niej "zestarzeć", więc taki wpis tylko usuwałby ludzi
 * bez żadnego adresata (naprawiony przegląd P2).
 */
export type NonTerminalAgeGroup = Exclude<AgeGroup, "AGE_65_PLUS">;

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

/**
 * Klucz tożsamości kohorty (lokalizacja + status społeczno-ekonomiczny),
 * bez `ageGroup` -- dokładnie to, co dzieli jedna "rodzina kohort"
 * (`CohortFamily`). Eksportowana też dla `population/migration.ts` (M13):
 * migracja musi rozpoznać, czy w miejscu docelowym istnieje już kohorta
 * tej samej tożsamości (scalenie) czy trzeba założyć nową, tym samym
 * kluczem co reszta silnika -- nie osobną, potencjalnie rozjeżdżającą się
 * definicją "tożsamości".
 */
export function cohortIdentityKey(cohort: PopulationCohort): string {
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

  const expectedIdentityKey = cohortIdentityKey(cohorts[0]!);
  const byAgeGroup: Partial<Record<AgeGroup, PopulationCohort>> = {};

  for (const cohort of cohorts) {
    if (cohortIdentityKey(cohort) !== expectedIdentityKey) {
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

function createSyntheticZeroCohort(
  template: PopulationCohort,
  ageGroup: AgeGroup,
): PopulationCohort {
  // `createPopulationCohort` nie przyjmuje `profession` jako argumentu
  // (zawsze ustawia undefined) -- doklejamy je ręcznie z template, żeby
  // syntetyczna kohorta trafiła do tej samej rodziny tożsamości co
  // kohorty, z których ją wyprowadzono (identityKey uwzględnia profession).
  return {
    ...createPopulationCohort({
      id: `${template.id}__synthetic_${ageGroup}`,
      regionId: template.regionId,
      ...(template.settlementId !== undefined
        ? { settlementId: template.settlementId }
        : {}),
      ageGroup,
      population: 0,
      economicClass: template.economicClass,
      skillLevel: template.skillLevel,
    }),
    profession: template.profession,
  };
}

/**
 * Grupuje dowolną, niekoniecznie kompletną wiekowo listę kohort (np.
 * surowe dane świata, gdzie każdy rekord to jedna grupa wieku dla danej
 * tożsamości lokalizacyjno-społeczno-ekonomicznej, a nie gotowa
 * pięcioelementowa rodzina) po tożsamości i dopełnia brakujące grupy
 * wieku syntetyczną kohortą o populacji 0.
 *
 * Pozwala to podać `applyMonthlyDemography` per-rodzina ręcznie
 * przygotowanemu fixture'owi świata (M4), który nigdy nie był budowany
 * z myślą o kompletnych pięcioelementowych rodzinach --
 * `buildCohortFamily` zostaje przy tym równie rygorystyczne (fail-loud,
 * POP-002) jako kontrakt dla wywołujących, którzy już mają kompletną
 * rodzinę.
 */
export function groupCohortsIntoFamilies(
  cohorts: readonly PopulationCohort[],
): readonly CohortFamily[] {
  const groups = new Map<string, PopulationCohort[]>();
  for (const cohort of cohorts) {
    const key = cohortIdentityKey(cohort);
    const group = groups.get(key);
    if (group) {
      group.push(cohort);
    } else {
      groups.set(key, [cohort]);
    }
  }

  const families: CohortFamily[] = [];
  for (const group of groups.values()) {
    const present = new Set(group.map((cohort) => cohort.ageGroup));
    const complete = [...group];
    for (const ageGroup of AGE_GROUP_ORDER) {
      if (present.has(ageGroup)) continue;
      complete.push(createSyntheticZeroCohort(group[0]!, ageGroup));
    }
    families.push(buildCohortFamily(complete));
  }
  return families;
}
