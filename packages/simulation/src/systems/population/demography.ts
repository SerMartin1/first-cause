import type { AgeGroup, PopulationCohort } from "@first-cause/entities";
import type { FactInput, FactLocation } from "@first-cause/causality";
import { assertNonNegative } from "../../core/validation.js";
import type { PendingCausalLink } from "../../core/causal-links.js";
import type { RngStream } from "../../core/rng.js";
import { eligibleLaborForce } from "../economy/labor/employment.js";
import {
  AGE_GROUP_ORDER,
  NEXT_AGE_GROUP,
  buildCohortFamily,
  type NonTerminalAgeGroup,
} from "./cohorts.js";

/**
 * Monthly demography (Simulation Model SS4.5, SIM-002): births, natural
 * deaths and aging transfer between cohorts, run once per tick (1 tick =
 * 1 month, SIM-001 -- there is no separate "is this a month boundary"
 * check to make). SS4.5 also lists "crisis mortality" and "migration
 * inflow/outflow" alongside these; both need systems that don't exist
 * yet (war/epidemics; M13 migration) and are out of scope here.
 *
 * All rates are annual (the natural unit for tuning parameters -- SS4.5
 * "wspolczynniki pozostaja parametrami tuningowymi") and converted to a
 * monthly probability by compounding (`1 - (1-annual)^(1/12)`), not by
 * dividing by 12 -- the same "don't reach for a linear approximation
 * when a proper one is this cheap" standard M5's logistic regrowth
 * model set.
 */
export interface DemographyRates {
  readonly deathRateByAgeGroup: Readonly<Record<AgeGroup, number>>;
  /**
   * Annual births as a fraction of the AGE_25_44 bracket's population --
   * the modeled prime childbearing cohort. A single scalar rather than a
   * rate per fertile bracket: finer-grained fertility modelling is
   * exactly the kind of tuning work SS4.5 defers ("coefficients remain
   * tuning parameters"), not something M6's skeleton needs to settle.
   */
  readonly birthRate: number;
  /**
   * Years spent in each non-terminal age bracket before aging into the
   * next one. Typed over `NonTerminalAgeGroup`, not `AgeGroup` -- AGE_65_PLUS
   * has no next bracket to age into, so a span configured for it would
   * only delete population with no destination (przegląd: naprawiony P2).
   */
  readonly agingSpanYears: Readonly<Partial<Record<NonTerminalAgeGroup, number>>>;
}

/**
 * Defaults chosen to land near replacement rather than drifting toward
 * explosion or collapse: numerically verified (before writing the smoke
 * test below, the same discipline M5's renewable-resource stabilization
 * test used) that a 200-year/2400-tick run stays within roughly +-10% of
 * its start across several different starting distributions. Population
 * has no `carryingCapacity` analog the way M5's renewable resources do,
 * so tuning `birthRate` against the death/aging rates is the only lever
 * available.
 */
export const DEFAULT_DEMOGRAPHY_RATES: DemographyRates = {
  deathRateByAgeGroup: {
    AGE_0_14: 0.02,
    AGE_15_24: 0.006,
    AGE_25_44: 0.008,
    AGE_45_64: 0.015,
    AGE_65_PLUS: 0.05,
  },
  birthRate: 0.076,
  agingSpanYears: {
    AGE_0_14: 15,
    AGE_15_24: 10,
    AGE_25_44: 20,
    AGE_45_64: 20,
  },
};

function monthlyRateFromAnnual(annualRate: number): number {
  return 1 - Math.pow(1 - annualRate, 1 / 12);
}

/**
 * Losowe zaokrąglanie w górę/w dół, ważone częścią ułamkową (bezstronne
 * w oczekiwaniu: E[stochasticRound(x)] = x). Naprawia przegląd P1 --
 * `roundHalfEven` zawsze zaokrąglał ułamek < 0.5 w dół do zera, co dla
 * małych populacji (np. 5 kohort po 10 osób) zamrażało urodzenia/zgony/
 * starzenie *na stałe*, bo miesięczny oczekiwany przyrost nigdy nie
 * osiągał 0.5. Tutaj każdy miesiąc ma niezerowe prawdopodobieństwo
 * zdarzenia równe części ułamkowej, więc po dostatecznie wielu
 * miesiącach zdarzenie w końcu zajdzie (P(nigdy) = (1-frac)^N -> 0).
 * Korzysta z dedykowanego, wcześniej zarezerwowanego a nieużywanego
 * strumienia RNG "demography" (SAVE-003).
 *
 * Eksportowana też dla `population/migration.ts` (M13, "seeded
 * probability" -- AI Decision Model §60) -- ta sama bezstronna zasada
 * zaokrąglania dotyczy liczby migrantów co liczby urodzeń/zgonów, więc
 * współdzieli implementację zamiast duplikować ją z innym ziarnem.
 */
export function stochasticRound(value: number, rng: RngStream): number {
  const floor = Math.floor(value);
  const fraction = value - floor;
  if (fraction === 0) return floor;
  return rng.nextFloat() < fraction ? floor + 1 : floor;
}

export interface ApplyMonthlyDemographyInput {
  readonly tick: number;
  /** Strumień RNG "demography" (SAVE-003), zwykle scope'owany per rodzina kohort. */
  readonly rng: RngStream;
  readonly rates?: DemographyRates;
}

export interface ApplyMonthlyDemographyResult {
  readonly cohorts: readonly PopulationCohort[];
  readonly facts: readonly FactInput<number>[];
  /** M17 (CE-05): `targetIndex`/`sameBatch.index` względne do WŁASNEJ tablicy `facts` -- patrz `offsetCausalLinks`. */
  readonly causalLinks: readonly PendingCausalLink[];
}

function cohortLocation(cohort: PopulationCohort): FactLocation {
  return cohort.settlementId === undefined
    ? { regionId: cohort.regionId }
    : { regionId: cohort.regionId, settlementId: cohort.settlementId };
}

function populationFact(
  cohort: PopulationCohort,
  before: number,
  after: number,
): FactInput<number> | undefined {
  if (after === before) return undefined;
  return {
    type: after > before ? "population_increased" : "population_declined",
    subject: { entityType: "populationCohort", entityId: cohort.id },
    location: cohortLocation(cohort),
    values: { before, after, delta: after - before },
  };
}

/**
 * Audytowe P0-04 (M7-M11 audyt) / P0-05 (M12-M14 audyt) "phantom
 * employment": `employment` to policzalni ludzie -- nie może przetrwać
 * spadku `population`, który go wyprzedził (śmierć *lub* starzenie się
 * poza `WORKING_AGE_GROUPS`, `labor/employment.ts` nigdy nie przesuwa
 * `employment` razem z tymi przepływami, bo to osobne pole na tym samym
 * rekordzie kohorty).
 *
 * Górny limit to `eligibleLaborForce` (M9) tej kohorty po tym miesiącu,
 * NIE sama `population` (M7-M11 audyt świadomie wybrał wtedy sam
 * `population` jako granicę -- demografia miała nie sięgać po M9's stałą
 * partycypacji rynku pracy przez granicę systemów). M12-M14 audyt
 * (P0-05) pokazał, że to za słaby sufit: kohorta może mieć populację
 * większą niż `population * 0.65` i zatrudnienie mieszczące się w
 * populacji, ale wciąż przekraczające faktyczną siłę roboczą (fantomowi
 * pracownicy, którzy strukturalnie nie mogą istnieć). Czystość granicy
 * modułów ustępuje tu poprawności -- `eligibleLaborForce` jest małą,
 * czystą funkcją bez żadnego stanu M9, więc import nie tworzy realnego
 * sprzężenia.
 *
 * Które konkretnie firmy straciły tych pracowników pozostaje
 * nierozwiązane NA POZIOMIE KOHORTY (Company przechowuje tylko
 * zagregowany `employees`, nie rozbicie per-kohorta -- udokumentowana,
 * świadoma granica M9, patrz `labor/employment.ts` `layoffWorkers` doc
 * comment); zagregowane uzgodnienie `Company.workforce.employees` z
 * realną podażą pracy regionu to osobny krok w `economy-tick.ts`
 * (audytowe P0-05, "Company headcount reconciliation").
 */
function employmentReconciliationFact(
  cohort: PopulationCohort,
  before: number,
  after: number,
): FactInput<number> | undefined {
  if (after === before) return undefined;
  return {
    type: "employment_changed",
    subject: { entityType: "populationCohort", entityId: cohort.id },
    location: cohortLocation(cohort),
    values: { before, after, delta: after - before },
  };
}

/**
 * Advances one cohort family (POP-001: population is cohort-based, never
 * individual NPCs) by exactly one month.
 *
 * Deaths and aging-out are computed from this month's starting
 * population per bracket; births are added to AGE_0_14 from the
 * AGE_25_44 bracket's *starting* population -- order-independent,
 * avoiding a same-tick "deaths before or after births" question that
 * has no canonical answer at this level of abstraction. Every person
 * removed or added is accounted for by construction: each bracket's
 * before/after reconciles to `-deaths -agedOut +agedIn +births`, and
 * the aging terms cancel pairwise across the family, so the family's
 * total change is exactly `births - totalDeaths` with nothing lost or
 * invented in between (see `demography.test.ts`'s conservation audit).
 */
export function applyMonthlyDemography(
  familyCohorts: readonly PopulationCohort[],
  input: ApplyMonthlyDemographyInput,
): ApplyMonthlyDemographyResult {
  const family = buildCohortFamily(familyCohorts);
  const rates = input.rates ?? DEFAULT_DEMOGRAPHY_RATES;
  const { rng } = input;

  const deaths: Partial<Record<AgeGroup, number>> = {};
  for (const ageGroup of AGE_GROUP_ORDER) {
    const population = family[ageGroup].population;
    const rate = monthlyRateFromAnnual(rates.deathRateByAgeGroup[ageGroup]);
    deaths[ageGroup] = Math.min(population, stochasticRound(population * rate, rng));
  }

  const births = stochasticRound(
    family.AGE_25_44.population * monthlyRateFromAnnual(rates.birthRate),
    rng,
  );

  const agingOut: Partial<Record<AgeGroup, number>> = {};
  for (const ageGroup of AGE_GROUP_ORDER) {
    // Terminalność bierze się ze struktury (brak wpisu w NEXT_AGE_GROUP),
    // nie z tego, czy `rates.agingSpanYears` akurat coś dla niej ustawia
    // -- inaczej błędnie skonfigurowany `agingSpanYears.AGE_65_PLUS`
    // usuwałby ludzi bez żadnej grupy docelowej (naprawiony przegląd P2).
    if (NEXT_AGE_GROUP[ageGroup] === undefined) continue;
    const span = rates.agingSpanYears[ageGroup as NonTerminalAgeGroup];
    if (span === undefined) continue;
    const remaining = family[ageGroup].population - deaths[ageGroup]!;
    agingOut[ageGroup] = Math.min(
      remaining,
      stochasticRound(remaining * (1 / (span * 12)), rng),
    );
  }

  const nextCohorts: PopulationCohort[] = [];
  const facts: FactInput<number>[] = [];
  const causalLinks: PendingCausalLink[] = [];

  for (const ageGroup of AGE_GROUP_ORDER) {
    const cohort = family[ageGroup];
    const before = cohort.population;
    const agingIn = AGE_GROUP_ORDER.filter((g) => NEXT_AGE_GROUP[g] === ageGroup).reduce(
      (sum, g) => sum + (agingOut[g] ?? 0),
      0,
    );
    const birthsIn = ageGroup === "AGE_0_14" ? births : 0;

    const after = assertNonNegative(
      before - deaths[ageGroup]! - (agingOut[ageGroup] ?? 0) + agingIn + birthsIn,
      `applyMonthlyDemography(${cohort.id}).population`,
    );

    const employmentBefore = cohort.employment;
    const employmentAfter = Math.min(
      employmentBefore,
      eligibleLaborForce({ ...cohort, population: after }),
    );

    nextCohorts.push({ ...cohort, population: after, employment: employmentAfter });
    const fact = populationFact(cohort, before, after);
    let populationFactIndex: number | undefined;
    if (fact) {
      facts.push(fact);
      populationFactIndex = facts.length - 1;
      // CE-05 (M17): urodzenia/śmierci/starzenie to strukturalny,
      // tła-owy proces demograficzny (roczne stopy, SS4.5), nie decyzja
      // reagująca na warunki tego ticka -- jeden czynnik STRUCTURAL,
      // nie wymyślona wieloprzyczynowość tam, gdzie jej nie ma
      // (CAUS-003).
      causalLinks.push({
        targetIndex: populationFactIndex,
        source: { kind: "external", key: `cohort:${cohort.id}:demographic_rate` },
        type: "STRUCTURAL",
        factor: {
          key: fact.type === "population_increased" ? "birth_rate" : "death_rate",
          contribution: Math.sign(after - before),
        },
        mechanism: "roczna stopa urodzeń/śmierci/starzenia, skonwertowana na miesięczne prawdopodobieństwo",
        system: "demography",
      });
    }
    const employmentFact = employmentReconciliationFact(
      cohort,
      employmentBefore,
      employmentAfter,
    );
    if (employmentFact) {
      facts.push(employmentFact);
      const employmentTargetIndex = facts.length - 1;
      causalLinks.push({
        targetIndex: employmentTargetIndex,
        source:
          populationFactIndex !== undefined
            ? { kind: "sameBatch", index: populationFactIndex }
            : { kind: "external", key: `cohort:${cohort.id}:aging_out_of_working_age` },
        type: "TRIGGERING",
        factor: {
          key: "population_change",
          contribution: Math.sign(employmentAfter - employmentBefore),
        },
        mechanism: "zmiana populacji (śmierć/starzenie się poza wiek produkcyjny) wymusiła uzgodnienie zatrudnienia",
        system: "demography",
      });
    }
  }

  return { cohorts: nextCohorts, facts, causalLinks };
}
