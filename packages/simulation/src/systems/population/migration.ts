import {
  createPopulationCohort,
  type Connection,
  type PopulationCohort,
  type Region,
  type Settlement,
} from "@first-cause/entities";
import type { FactInput, FactLocation } from "@first-cause/causality";
import { InvariantViolationError, assertNonNegative } from "../../core/validation.js";
import type { RngStream } from "../../core/rng.js";
import { clamp } from "../economy/company-ai/decision-framework.js";
import { eligibleLaborForce } from "../economy/labor/employment.js";
import { cohortSingleIdentityKey } from "./cohorts.js";
import { stochasticRound } from "./demography.js";

/**
 * Migration (AI-09, AI Decision Model §58-61; Canonical Decisions
 * POP-006/POP-007/SET-003). "Migracja jest probabilistyczną reakcją na
 * lokalne warunki (push/pull), nie skanowaniem całego świata przez każdą
 * kohortę" (roadmap M13). Struktura modułu jest celowo dwuwarstwowa, tak
 * samo jak M12's `opportunity-scanner.ts`:
 *
 * - kilka małych, czystych funkcji ocenia jeden aspekt kanonicznej
 *   formuły (`MigrationAttraction`, friction, propensity, housing) w
 *   izolacji -- łatwe do przetestowania osobno (Simulation Test Spec
 *   §65-69, FC-MIGRATION-001..005),
 * - `runMigrationPass` spina je w jeden przebieg po całym świecie,
 *   wołany raz na tick z `economy-tick.ts` (PO pętli regionów, żeby
 *   `Region.cached.migrationAttraction` był świeży dla każdego regionu
 *   tego ticka, nie tylko już przetworzonych).
 *
 * Kanoniczna formuła (§58) wymienia więcej składników niż silnik dziś
 * modeluje: `Safety`, `NeedsAvailability`, `CulturalAffinity`,
 * `FamilyConnections`, `Services`, `BorderFriction`, `Conflict`,
 * `EnvironmentalRisk` -- żaden z tych systemów jeszcze nie istnieje
 * (Culture/Nation/State to DEFERRED, tak samo jak M12's SkillAvailability/
 * Risk). Ten moduł pomija je milcząco (nie liczy ich jako 0 w kodzie,
 * po prostu nie ma ich w sumie) zamiast pinować atrapę -- w
 * przeciwieństwie do M12 nie ma tu jednego miejsca, które musiałoby
 * strukturalnie "zostawić dziurę" na te pola, bo formuła jest sumą
 * ważoną, nie sztywnym rekordem czynników.
 *
 * Housing (SET-003) jest twardym limitem tylko wtedy, gdy region
 * docelowy faktycznie ma jakiś Settlement -- puste (jeszcze
 * nieosiedlone) ziemie nie mają pojemności do przekroczenia, więc
 * migranci osiadają tam jako kohorta regionalna (`settlementId ===
 * undefined`), bez ograniczenia. Gdy region MA settlementy, ale
 * wszystkie są pełne, limit jest twardy naprawdę -- migranci NIE trafiają
 * do rural fallbacku (audytowy P0-04, wcześniej oba przypadki błędnie
 * zwracały `Infinity`) -- patrz `selectDestinationSettlement` niżej.
 */

const JOBS_WEIGHT = 0.4; // TODO tuning
const WAGE_WEIGHT = 0.3; // TODO tuning
const HOUSING_COST_WEIGHT = 0.3; // TODO tuning -- FC-MIGRATION-003: wysoki HousingCost musi hamować attraction
const VACANCY_RATE_TARGET = 0.2; // TODO tuning -- wskaźnik wakatów/eligibleLaborForce od tego poziomu już czyta się jako "pełny rynek pracy"
const WAGE_NORMALIZATION = 20; // TODO tuning -- ta sama skala co opportunity-scanner's EXPECTED_MARGIN_NORMALIZATION
const HOUSING_COST_NORMALIZATION = 50; // TODO tuning

/** Region-level "Jobs + ExpectedWage - HousingCost" -- sygnał pull, cache'owany w `Region.cached.migrationAttraction`. */
export interface RegionMigrationSignalsInput {
  readonly vacancies: number;
  readonly eligibleLaborForce: number;
  readonly averageWageOffer: number;
  readonly averageHousingCost: number;
}

/**
 * `MigrationAttraction` (§58), ograniczona do modelowanych dziś
 * składników. FC-MIGRATION-001: rosnące `vacancies`/`averageWageOffer`
 * przy stałej reszcie musi podnosić wynik -- oba wchodzą addytywnie,
 * `HousingCost` jedyny odejmowany.
 */
export function computeMigrationAttraction(input: RegionMigrationSignalsInput): number {
  const vacancies = assertNonNegative(
    input.vacancies,
    "computeMigrationAttraction().vacancies",
  );
  const eligibleLaborForce = assertNonNegative(
    input.eligibleLaborForce,
    "computeMigrationAttraction().eligibleLaborForce",
  );
  const averageWageOffer = assertNonNegative(
    input.averageWageOffer,
    "computeMigrationAttraction().averageWageOffer",
  );
  const averageHousingCost = assertNonNegative(
    input.averageHousingCost,
    "computeMigrationAttraction().averageHousingCost",
  );

  const vacancyRate =
    eligibleLaborForce > 0 ? vacancies / eligibleLaborForce : vacancies > 0 ? 1 : 0;
  const jobsScore = clamp(vacancyRate / VACANCY_RATE_TARGET, 0, 1);
  const wageScore = clamp(averageWageOffer / WAGE_NORMALIZATION, 0, 1);
  const housingPenalty = clamp(averageHousingCost / HOUSING_COST_NORMALIZATION, 0, 1);

  return clamp(
    JOBS_WEIGHT * jobsScore +
      WAGE_WEIGHT * wageScore -
      HOUSING_COST_WEIGHT * housingPenalty,
    0,
    1,
  );
}

const DISTANCE_NORMALIZATION = 50; // TODO tuning -- EffectiveDistance tej wielkości już niemal zabija pull

/**
 * Migration Friction (§60 "distance friction"): 1 przy zerowym dystansie,
 * maleje ku 0 wraz z rosnącym `EffectiveDistance` (M10). FC-MIGRATION-002:
 * większy `EffectiveDistance` musi zmniejszać faktyczną migrację.
 */
export function computeDistanceFriction(effectiveDistance: number): number {
  const distance = assertNonNegative(
    effectiveDistance,
    "computeDistanceFriction().effectiveDistance",
  );
  return 1 / (1 + distance / DISTANCE_NORMALIZATION);
}

/** Różnica atrakcyjności (destination - source), otarta friction dystansu -- surowy sygnał push/pull dla jednego kandydata. */
export function computeMigrationPullSignal(input: {
  readonly sourceAttraction: number;
  readonly destinationAttraction: number;
  readonly effectiveDistance: number;
}): number {
  const differential = clamp(input.destinationAttraction - input.sourceAttraction, -1, 1);
  return differential * computeDistanceFriction(input.effectiveDistance);
}

const PROPENSITY_TREND_WEIGHT = 0.3; // TODO tuning -- ta sama waga EMA co decision-framework.ts's updateExpectations

/**
 * `PopulationCohort.migrationPropensity` (§60 "migration propensity"):
 * wygładzona (EMA) skłonność do wyjazdu, aktualizowana najlepszym w tym
 * ticku sygnałem pull spośród kandydatów -- pojedyncze, jedno pole na
 * kohortę (nie per-kandydat), więc opisuje ogólny "niepokój", nie
 * konkretny kierunek. Wygładzenie samo w sobie pełni tu rolę
 * anti-oscylacyjną, jaką dla decyzji firmowych daje hysteresis/cooldown
 * (decision-framework.ts) -- migracja nie potrzebuje osobnej maszyny
 * stanów, bo jest z natury stochastyczna i stopniowa (household inertia
 * poniżej), nie binarnym przełącznikiem.
 */
export function updateMigrationPropensity(
  priorPropensity: number,
  bestPullSignal: number,
): number {
  return clamp(
    priorPropensity * (1 - PROPENSITY_TREND_WEIGHT) +
      bestPullSignal * PROPENSITY_TREND_WEIGHT,
    -1,
    1,
  );
}

const HOUSEHOLD_INERTIA_FRACTION = 0.05; // TODO tuning -- §60 "household inertia": nawet przy maksymalnej propensity co najwyżej ten ułamek kohorty rusza się w jednym miesiącu
const MIGRATION_PROPENSITY_TRIGGER = 0.05; // TODO tuning -- poniżej tego progu propensity traktujemy jako szum, nikt nie wyjeżdża

/**
 * Pożądany (jeszcze nieograniczony przez housing) odpływ z kohorty w tym
 * ticku: `population * propensity * householdInertia`, zaokrąglone
 * bezstronnie (§60 "seeded probability", ten sam mechanizm co demografia).
 * Ujemna/nieznacząca propensity (kohorta zadowolona z bieżącego miejsca)
 * nie generuje odpływu.
 */
export function evaluateMigrationOutflow(input: {
  readonly population: number;
  readonly propensity: number;
  readonly rng: RngStream;
}): number {
  const population = assertNonNegative(
    input.population,
    "evaluateMigrationOutflow().population",
  );
  const propensity = clamp(input.propensity, -1, 1);
  if (propensity <= MIGRATION_PROPENSITY_TRIGGER || population <= 0) return 0;

  const desired = population * propensity * HOUSEHOLD_INERTIA_FRACTION;
  return stochasticRound(desired, input.rng);
}

export interface DestinationSettlementChoice {
  /**
   * `undefined` ma dwa odrębne znaczenia, rozróżniane przez
   * `remainingCapacity` (audytowy P0-04): `Infinity` = region bez
   * settlementów, migranci osiadają jako kohorta regionalna bez
   * ograniczenia; `0` = region MA settlementy, ale wszystkie są pełne --
   * twardo zablokowane, nie rural fallback.
   */
  readonly settlementId: string | undefined;
  readonly remainingCapacity: number;
}

/**
 * Housing constraint (SET-003, §60 "capacity"): wybiera settlement
 * regionu docelowego z największą pozostałą pojemnością
 * (`housing.capacity - bieżąca_populacja`, deterministyczny tie-break po
 * id). FC-MIGRATION-003: przy dodatniej pojemności wynik nigdy jej nie
 * przekracza.
 *
 * Dwa odrębne przypadki `settlementId === undefined` (audytowy P0-04 --
 * były błędnie zlewane w jeden):
 * - region BEZ żadnego settlementu -- puste, jeszcze nieosiedlone ziemie
 *   faktycznie nie mają pojemności do przekroczenia, więc migranci osiadają
 *   tam jako kohorta regionalna, bez twardego limitu (`Infinity`, patrz
 *   doc comment modułu);
 * - region MA settlementy, ale WSZYSTKIE są już pełne -- to nie jest
 *   "brak osady", tylko realny twardy limit z RM M13/SET-003: `0`, nie
 *   `Infinity`. Poprzednio oba przypadki zwracały `Infinity`, co w
 *   praktyce znosiło housing jako ograniczenie migracji, gdy tylko
 *   region miał jakikolwiek settlement.
 */
export function selectDestinationSettlement(input: {
  readonly destinationRegion: Region;
  readonly settlementsById: Readonly<Record<string, Settlement>>;
  readonly settlementPopulationById: ReadonlyMap<string, number>;
}): DestinationSettlementChoice {
  const settlementIds = [...input.destinationRegion.settlements.settlementIds].sort();
  if (settlementIds.length === 0) {
    return { settlementId: undefined, remainingCapacity: Number.POSITIVE_INFINITY };
  }

  let best: DestinationSettlementChoice | undefined;
  for (const settlementId of settlementIds) {
    const settlement = input.settlementsById[settlementId];
    if (!settlement) continue;
    const currentPopulation = input.settlementPopulationById.get(settlementId) ?? 0;
    const remaining = Math.max(0, settlement.housing.capacity - currentPopulation);
    if (!best || remaining > best.remainingCapacity) {
      best = { settlementId, remainingCapacity: remaining };
    }
  }

  if (!best || best.remainingCapacity <= 0) {
    return { settlementId: undefined, remainingCapacity: 0 };
  }
  return best;
}

function cohortLocation(
  cohort: Pick<PopulationCohort, "regionId" | "settlementId">,
): FactLocation {
  return cohort.settlementId === undefined
    ? { regionId: cohort.regionId }
    : { regionId: cohort.regionId, settlementId: cohort.settlementId };
}

/**
 * Ważona (populacją) średnia dwóch grup łączonych w jedną -- audytowe
 * P1-06. `totalWeight <= 0` (obie grupy puste) zwraca 0 zamiast dzielenia
 * przez zero -- ten sam styl co `computeMigrationAttraction`'s
 * `vacancyRate` ternary.
 */
function weightedTraitAverage(
  existingValue: number,
  existingWeight: number,
  incomingValue: number,
  incomingWeight: number,
): number {
  const totalWeight = existingWeight + incomingWeight;
  return totalWeight > 0
    ? (existingValue * existingWeight + incomingValue * incomingWeight) / totalWeight
    : 0;
}

export interface ApplyMigrationFlowInput {
  readonly sourceCohort: PopulationCohort;
  /** Już ograniczone przez `min(desiredOutflow, sourceCohort.population, destinationRemainingCapacity)` -- ta funkcja tylko fizycznie przenosi. */
  readonly migrantCount: number;
  readonly destinationRegionId: string;
  readonly destinationSettlementId: string | undefined;
  readonly tick: number;
  /** Kohorta w miejscu docelowym o tej samej tożsamości (`cohortSingleIdentityKey` -- rodzina + ageGroup), jeśli już istnieje -- inaczej powstaje nowa. */
  readonly existingDestinationCohort: PopulationCohort | undefined;
}

export interface ApplyMigrationFlowResult {
  readonly sourceCohort: PopulationCohort;
  readonly destinationCohort: PopulationCohort;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Fizycznie przenosi `migrantCount` osób z `sourceCohort` do kohorty
 * docelowej (scalonej lub nowo utworzonej). `employment` źródła jest
 * przycinane do `eligibleLaborForce` nowej (po odpływie) populacji, nie
 * do samej populacji (audytowy P0-05 -- 65% working-age to twardszy,
 * poprawny sufit: kohorta ze 100 osób i 65 zatrudnionymi, po odpływie 10
 * osób, ma tylko 58,5 miejsca w sile roboczej, więc 65 zatrudnionych
 * byłoby fantomami, mimo że mieści się w nowej populacji 90). Migranci
 * lądują w miejscu docelowym jako bezrobotni -- fizyczna praca nie
 * przenosi się razem z osobą (M9's Company przechowuje tylko zagregowany
 * `employees`, bez rozbicia per-kohorta, ta sama granica co
 * layoffWorkers's doc comment). `OutMigration === InMigration`
 * (FC-MIGRATION-005) z konstrukcji: oba fakty niżej dzielą to samo, raz
 * policzone `migrantCount`. Company.workforce.employees nie jest tu
 * korygowane -- to osobny krok w `economy-tick.ts` (audytowe P0-05,
 * "Company headcount reconciliation"). `averageWealth`/`educationLevel`/
 * `literacy` przenoszą się z migrantem ważoną (populacją) średnią z
 * miejscem docelowym (audytowe P1-06) -- w przeciwieństwie do
 * zatrudnienia to cechy osobiste, nie zawodowe, więc nie ma powodu ich
 * zerować.
 */
export function applyMigrationFlow(
  input: ApplyMigrationFlowInput,
): ApplyMigrationFlowResult {
  const { sourceCohort, existingDestinationCohort } = input;
  const migrantCount = assertNonNegative(
    input.migrantCount,
    "applyMigrationFlow().migrantCount",
  );
  if (migrantCount > sourceCohort.population) {
    throw new InvariantViolationError(
      `applyMigrationFlow: migrantCount (${migrantCount}) exceeds source cohort "${sourceCohort.id}" population (${sourceCohort.population})`,
    );
  }

  const sourcePopulationBefore = sourceCohort.population;
  const sourcePopulationAfter = sourcePopulationBefore - migrantCount;
  const sourceEmploymentAfter = Math.min(
    sourceCohort.employment,
    eligibleLaborForce({ ...sourceCohort, population: sourcePopulationAfter }),
  );
  const nextSourceCohort: PopulationCohort = {
    ...sourceCohort,
    population: sourcePopulationAfter,
    employment: sourceEmploymentAfter,
  };

  const destinationPopulationBefore = existingDestinationCohort?.population ?? 0;
  const destinationPopulationAfter = destinationPopulationBefore + migrantCount;
  // Audytowe P1-06: migranci przynoszą swój majątek i wykształcenie ze
  // sobą -- w przeciwieństwie do zatrudnienia/dochodu (przywiązanych do
  // konkretnej pracy, którą świadomie zostawiają, patrz doc comment tej
  // funkcji), `averageWealth`/`educationLevel`/`literacy` to cechy
  // OSOBISTE, nie zawodowe. Ważona średnia (populacją) zamiast resetu do
  // fabrycznego 0 (nowa kohorta) albo pozostawienia bez zmian (scalenie z
  // istniejącą) -- ten sam kształt co `matchEmployment`'s ważona
  // `averageIncome`. Przy tworzeniu nowej kohorty `destinationPopulationBefore`
  // wynosi 0, więc formuła sama sprowadza się do "migranci przynoszą
  // swoje wartości wprost", bez osobnej gałęzi.
  const nextAverageWealth = weightedTraitAverage(
    existingDestinationCohort?.averageWealth ?? 0,
    destinationPopulationBefore,
    sourceCohort.averageWealth,
    migrantCount,
  );
  const nextEducationLevel = weightedTraitAverage(
    existingDestinationCohort?.educationLevel ?? 0,
    destinationPopulationBefore,
    sourceCohort.educationLevel,
    migrantCount,
  );
  const nextLiteracy = weightedTraitAverage(
    existingDestinationCohort?.literacy ?? 0,
    destinationPopulationBefore,
    sourceCohort.literacy,
    migrantCount,
  );
  const nextDestinationCohort: PopulationCohort = existingDestinationCohort
    ? {
        ...existingDestinationCohort,
        population: destinationPopulationAfter,
        averageWealth: nextAverageWealth,
        educationLevel: nextEducationLevel,
        literacy: nextLiteracy,
      }
    : {
        ...createPopulationCohort({
          // Musi zawierać KAŻDE pole `cohortSingleIdentityKey` (region,
          // settlement, economicClass, skillLevel, profession, ageGroup) --
          // inaczej dwie różne tożsamości (np. dwie profesje migrujące w
          // tym samym ticku do tego samego miejsca) generują identyczny
          // string ID i druga migracja nadpisuje zapis pierwszej w mapie
          // kohort (audytowy P0-02, utrata populacji mimo poprawnego
          // bilansu faktów).
          id: `cohort_migrant_${sourceCohort.ageGroup}_${input.destinationRegionId}${
            input.destinationSettlementId ? `_${input.destinationSettlementId}` : ""
          }_${sourceCohort.economicClass}_${sourceCohort.skillLevel}${
            sourceCohort.profession ? `_${sourceCohort.profession}` : ""
          }_t${input.tick}`,
          regionId: input.destinationRegionId,
          ...(input.destinationSettlementId !== undefined
            ? { settlementId: input.destinationSettlementId }
            : {}),
          ageGroup: sourceCohort.ageGroup,
          population: migrantCount,
          economicClass: sourceCohort.economicClass,
          skillLevel: sourceCohort.skillLevel,
        }),
        // `createPopulationCohort` nie przyjmuje `profession` -- doklejane
        // ręcznie z template, tak samo jak cohorts.ts's createSyntheticZeroCohort.
        profession: sourceCohort.profession,
        averageWealth: nextAverageWealth,
        educationLevel: nextEducationLevel,
        literacy: nextLiteracy,
      };

  if (migrantCount <= 0) {
    return {
      sourceCohort: nextSourceCohort,
      destinationCohort: nextDestinationCohort,
      facts: [],
    };
  }

  const facts: FactInput<number>[] = [
    {
      type: "population_migrated_out",
      subject: { entityType: "populationCohort", entityId: sourceCohort.id },
      location: cohortLocation(sourceCohort),
      values: {
        before: sourcePopulationBefore,
        after: sourcePopulationAfter,
        delta: -migrantCount,
      },
    },
    {
      type: "population_migrated_in",
      subject: { entityType: "populationCohort", entityId: nextDestinationCohort.id },
      location: cohortLocation(nextDestinationCohort),
      values: {
        before: destinationPopulationBefore,
        after: destinationPopulationAfter,
        delta: migrantCount,
      },
    },
  ];

  return {
    sourceCohort: nextSourceCohort,
    destinationCohort: nextDestinationCohort,
    facts,
  };
}

interface NeighborLink {
  readonly regionId: string;
  readonly connection: Connection;
}

/**
 * Migration Candidate Set (POP-007, FC-MIGRATION-004): tylko regiony
 * bezpośrednio połączone Connection z `region` -- "sąsiedzi" i
 * "trade-connected regions" to w tym silniku ten sam graf (Connection
 * jest jedyną drogą przepływu towarów, M10). "Znane centra"/"cultural-
 * family links" pozostają niezamodelowane (brak Culture/reputation
 * systemu -- poza zakresem M13). Gdy dwa Connection łączą tę samą parę
 * regionów, wygrywa krótszy (mniejszy `effectiveDistance`) -- deterministycznie.
 */
function buildNeighborLinks(
  region: Region,
  connections: Readonly<Record<string, Connection>>,
): readonly NeighborLink[] {
  const links = new Map<string, NeighborLink>();
  for (const connectionId of [...region.connections.connectionIds].sort()) {
    const connection = connections[connectionId];
    if (!connection) continue;
    const neighborId =
      connection.regionAId === region.id ? connection.regionBId : connection.regionAId;
    if (neighborId === region.id) continue;

    const existing = links.get(neighborId);
    if (
      !existing ||
      connection.cached.effectiveDistance < existing.connection.cached.effectiveDistance
    ) {
      links.set(neighborId, { regionId: neighborId, connection });
    }
  }
  return [...links.values()].sort((a, b) => a.regionId.localeCompare(b.regionId));
}

export interface RunMigrationPassInput {
  /** Regiony PO pętli głównej ticka (`Region.cached.migrationAttraction` już świeże dla tego ticka). */
  readonly regions: Readonly<Record<string, Region>>;
  readonly connections: Readonly<Record<string, Connection>>;
  readonly settlements: Readonly<Record<string, Settlement>>;
  readonly populationCohorts: Readonly<Record<string, PopulationCohort>>;
  readonly tick: number;
  /** Strumień RNG "migration" (SAVE-003), scope'owany per źródłowa kohorta. */
  readonly rng: (scopeId: string) => RngStream;
}

export interface RunMigrationPassResult {
  readonly populationCohorts: Readonly<Record<string, PopulationCohort>>;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Jeden przebieg migracji po całym świecie: dla każdego regionu (w
 * kolejności sortowanej id -- SIM-005 determinizm) i każdej jego kohorty,
 * ocenia kandydatów (`buildNeighborLinks`), wybiera najlepszy sygnał pull,
 * aktualizuje `migrationPropensity`, liczy pożądany odpływ i ogranicza go
 * pojemnością mieszkaniową miejsca docelowego, po czym fizycznie
 * przenosi populację (`applyMigrationFlow`).
 *
 * `settlementPopulationById` jest aktualizowany na bieżąco w trakcie
 * przebiegu (nie tylko na końcu) -- kolejne strumienie migrantów do tego
 * samego settlementu w tym samym ticku widzą już zajętą przez
 * wcześniejsze przepływy pojemność, więc housing capacity nigdy nie
 * zostaje przekroczona nawet gdy kilka regionów źródłowych celuje w ten
 * sam settlement jednocześnie. Symetrycznie zwalniany przy odpływie
 * (audytowy P2#1) -- osada źródłowa, która sama traci migrantów w tym
 * ticku, od razu widzi mniejszą zajętość dla KOLEJNYCH przepływów tego
 * samego passu (np. gdy jest jednocześnie celem innego regionu).
 */
export function runMigrationPass(input: RunMigrationPassInput): RunMigrationPassResult {
  const { regions, connections, settlements, tick, rng } = input;
  const cohorts: Record<string, PopulationCohort> = { ...input.populationCohorts };
  const facts: FactInput<number>[] = [];

  const settlementPopulationById = new Map<string, number>();
  // Klucz MUSI zawierać `ageGroup` (patrz `cohortSingleIdentityKey`'s doc
  // comment) -- `cohortIdentityKey` samo w sobie to tożsamość rodziny
  // (5 rekordów wiekowych dzieli jeden klucz), więc indeksowanie po nim tu
  // mieszałoby te 5 rekordów pod jednym wpisem (audytowy P0-01).
  const cohortIdentityIndex = new Map<string, string>();
  for (const cohort of Object.values(cohorts)) {
    cohortIdentityIndex.set(cohortSingleIdentityKey(cohort), cohort.id);
    if (cohort.settlementId !== undefined) {
      settlementPopulationById.set(
        cohort.settlementId,
        (settlementPopulationById.get(cohort.settlementId) ?? 0) + cohort.population,
      );
    }
  }

  const regionIds = Object.keys(regions).sort();
  for (const regionId of regionIds) {
    const region = regions[regionId]!;
    const links = buildNeighborLinks(region, connections);
    if (links.length === 0) continue;

    const cohortIds = [...region.population.cohortIds].sort();
    for (const cohortId of cohortIds) {
      const sourceCohort = cohorts[cohortId];
      if (!sourceCohort || sourceCohort.population <= 0) continue;

      let bestLink: NeighborLink | undefined;
      let bestPullSignal = Number.NEGATIVE_INFINITY;
      for (const link of links) {
        const destinationAttraction =
          regions[link.regionId]?.cached.migrationAttraction ?? 0;
        const pullSignal = computeMigrationPullSignal({
          sourceAttraction: region.cached.migrationAttraction,
          destinationAttraction,
          effectiveDistance: link.connection.cached.effectiveDistance,
        });
        if (pullSignal > bestPullSignal) {
          bestPullSignal = pullSignal;
          bestLink = link;
        }
      }
      if (!bestLink) continue;

      const nextPropensity = updateMigrationPropensity(
        sourceCohort.migrationPropensity,
        bestPullSignal,
      );

      const desiredOutflow = evaluateMigrationOutflow({
        population: sourceCohort.population,
        propensity: nextPropensity,
        rng: rng(sourceCohort.id),
      });

      if (desiredOutflow <= 0) {
        cohorts[cohortId] = { ...sourceCohort, migrationPropensity: nextPropensity };
        continue;
      }

      const destinationRegionId = bestLink.regionId;
      const destinationChoice = selectDestinationSettlement({
        destinationRegion: regions[destinationRegionId]!,
        settlementsById: settlements,
        settlementPopulationById,
      });

      const migrantCount = Math.min(
        desiredOutflow,
        sourceCohort.population,
        destinationChoice.remainingCapacity,
      );
      if (migrantCount <= 0) {
        cohorts[cohortId] = { ...sourceCohort, migrationPropensity: nextPropensity };
        continue;
      }

      const destinationIdentity = cohortSingleIdentityKey({
        ...sourceCohort,
        regionId: destinationRegionId,
        settlementId: destinationChoice.settlementId,
      });
      const existingDestinationCohortId = cohortIdentityIndex.get(destinationIdentity);
      const existingDestinationCohort = existingDestinationCohortId
        ? cohorts[existingDestinationCohortId]
        : undefined;

      const flowResult = applyMigrationFlow({
        sourceCohort: { ...sourceCohort, migrationPropensity: nextPropensity },
        migrantCount,
        destinationRegionId,
        destinationSettlementId: destinationChoice.settlementId,
        tick,
        existingDestinationCohort,
      });

      cohorts[cohortId] = flowResult.sourceCohort;
      cohorts[flowResult.destinationCohort.id] = flowResult.destinationCohort;
      cohortIdentityIndex.set(destinationIdentity, flowResult.destinationCohort.id);
      // Audytowy P2#1: odpływ ze SKĄD zwalnia miejsce tak samo na żywo jak
      // przyjazd DOKĄD je zajmuje -- inaczej kolejne strumienie w tym samym
      // ticku, którym KOD źródło jest jednocześnie CELEM innego przepływu
      // (albo które liczą tę samą osadę jako kandydata), widziałyby
      // sztucznie zawyżoną zajętość źródła.
      if (sourceCohort.settlementId !== undefined) {
        settlementPopulationById.set(
          sourceCohort.settlementId,
          (settlementPopulationById.get(sourceCohort.settlementId) ?? 0) - migrantCount,
        );
      }
      if (destinationChoice.settlementId !== undefined) {
        settlementPopulationById.set(
          destinationChoice.settlementId,
          (settlementPopulationById.get(destinationChoice.settlementId) ?? 0) +
            migrantCount,
        );
      }
      facts.push(...flowResult.facts);
    }
  }

  return { populationCohorts: cohorts, facts };
}
