import type { WorldState } from "@first-cause/entities";
import {
  initialHouseholdSavings,
  LEGACY_TRADE_FLOW_FACT_TYPE,
  normalizeWholeWorkforce,
  SURVIVAL_GOOD_ID,
  TRADE_FLOW_FACT_TYPE,
} from "@first-cause/simulation";
import { SCHEMA_VERSION } from "./envelope.js";

/**
 * Save Migration (SS39-46, SAVE-008). The pipeline was built ahead of the
 * first real schema change (roadmap: "migracja v1->v2, jeśli wystąpi w
 * trakcie developmentu"); `MIGRATIONS[1]` below is that first change.
 */
export type SchemaMigrator = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * v1 -> v2 (SET-LIFECYCLE-001): każda osada z zapisu v1 dostaje jawny
 * `status: "ACTIVE"` -- w v1 nie istniało porzucanie osad, więc każda
 * zapisana osada była aktywna. Osada, która w zapisie v1 ma już 0
 * mieszkańców, zostaje ACTIVE przy wczytaniu i przechodzi w ABANDONED w
 * pierwszym ticku po wczytaniu (z faktem `settlement_abandoned`) -- migracja
 * nie emituje faktów ani nie wymyśla momentu porzucenia. Czysta funkcja:
 * nowy obiekt, wejście bez zmian, bez losowości i czasu (SAVE-008).
 */
export function migrateV1ToV2(raw: Record<string, unknown>): Record<string, unknown> {
  const runnerState = raw.worldState as Record<string, unknown> | undefined;
  const worldState = runnerState?.worldState as Record<string, unknown> | undefined;
  const settlements = worldState?.settlements as
    Record<string, Record<string, unknown>> | undefined;
  const versions = (raw.versions ?? {}) as Record<string, unknown>;
  if (!runnerState || !worldState || !settlements)
    return { ...raw, versions: { ...versions, schemaVersion: 2 } };
  const migratedSettlements: Record<string, Record<string, unknown>> = {};
  for (const [id, settlement] of Object.entries(settlements))
    migratedSettlements[id] = { ...settlement, status: settlement.status ?? "ACTIVE" };
  return {
    ...raw,
    versions: { ...versions, schemaVersion: 2 },
    worldState: {
      ...runnerState,
      worldState: { ...worldState, settlements: migratedSettlements },
    },
  };
}

/**
 * v2 -> v3 (M21-VIS-R4B): od ENGINE_VERSION 3 `trade_flow_active` niesie
 * ilość faktycznie przeniesioną. Zapis wykonany starszym silnikiem
 * (`versions.engineVersion < 3` albo brak) ma pod tym typem ilości
 * ocenione -- migracja nadaje im `LEGACY_TRADE_FLOW_FACT_TYPE`
 * (`trade_flow_evaluated`; ta sama tożsamość: id, tick, subject, wartości; bez zerowania,
 * usuwania i przeliczania). Zapis v2 wykonany już silnikiem 3 zostaje bez
 * zmian faktów. Czysta funkcja (SAVE-008).
 */
export function migrateV2ToV3(raw: Record<string, unknown>): Record<string, unknown> {
  const versions = (raw.versions ?? {}) as Record<string, unknown>;
  const engineVersion = versions.engineVersion;
  const legacyEngine = typeof engineVersion !== "number" || engineVersion < 3;
  const runnerState = raw.worldState as Record<string, unknown> | undefined;
  const factStore = runnerState?.factStore as Record<string, unknown> | undefined;
  const facts = factStore?.facts as readonly Record<string, unknown>[] | undefined;
  const bumped = { ...raw, versions: { ...versions, schemaVersion: 3 } };
  if (!legacyEngine || !runnerState || !factStore || !Array.isArray(facts)) return bumped;
  return {
    ...bumped,
    worldState: {
      ...runnerState,
      factStore: {
        ...factStore,
        facts: facts.map((fact) =>
          fact.type === TRADE_FLOW_FACT_TYPE
            ? { ...fact, type: LEGACY_TRADE_FLOW_FACT_TYPE }
            : fact,
        ),
      },
      ...markLegacyTradeRouteProcesses(runnerState.chronicle),
    },
  };
}

/**
 * Chronicle (M21-VIS-R4B): otwarty proces `trade_route` z zapisu silnika < 3
 * sumował ilości OCENIONE. Dostaje `magnitudeBasis: "evaluated"` -- detektor
 * zamknie go na granicy (pierwszy fakt z ilością dostarczoną) i oceni na jego
 * własnej sumie, zamiast dodać do niej ilości dostarczone. Suma, stan, ticki,
 * `rootFactId` i `entryId` bez zmian; procesy zamknięte i innych typów bez zmian.
 */
function markLegacyTradeRouteProcesses(chronicle: unknown): Record<string, unknown> {
  const state = chronicle as Record<string, unknown> | undefined;
  const activeProcess = state?.activeProcess as Record<string, unknown> | undefined;
  const processes = activeProcess?.processes;
  if (!state || !activeProcess || !Array.isArray(processes)) return {};
  return {
    chronicle: {
      ...state,
      activeProcess: {
        ...activeProcess,
        processes: (processes as Record<string, unknown>[]).map((process) =>
          process.processType === "trade_route" &&
          process.state !== "RESOLVED" &&
          process.state !== "HISTORICAL"
            ? { ...process, magnitudeBasis: "evaluated" }
            : process,
        ),
      },
    },
  };
}

/**
 * v3 -> v4 (decyzja właściciela 2026-10-01, ENGINE_VERSION 4): pracownicy
 * to całe osoby. Silnik < 4 mógł zapisać ułamkowe `employees` /
 * `vacancies` firm i `employment` kohort (np. 6,5); migracja doprowadza je
 * do całych osób (`normalizeWholeWorkforce`: w dół dla firm, kohorty
 * rozdzielone metodą największych reszt tak, by suma kohort regionu =
 * suma pracowników firm). Ludność, fakty i historia bez zmian. Czysta
 * funkcja (SAVE-008); stan już całkowity zostaje bez zmian.
 */
export function migrateV3ToV4(raw: Record<string, unknown>): Record<string, unknown> {
  const versions = (raw.versions ?? {}) as Record<string, unknown>;
  const runnerState = raw.worldState as Record<string, unknown> | undefined;
  const worldState = runnerState?.worldState as WorldState | undefined;
  const bumped = { ...raw, versions: { ...versions, schemaVersion: 4 } };
  if (!runnerState || !worldState?.companies || !worldState.populationCohorts) return bumped;
  return {
    ...bumped,
    worldState: { ...runnerState, worldState: normalizeWholeWorkforce(worldState) },
  };
}

/**
 * v4 -> v5 (etap 2 naprawy gospodarki, N7, decyzja właściciela 2026-10-01):
 * kohorty dostają płynne oszczędności `savings`. Zapis sprzed v5 nie miał
 * salda pieniędzy -- dostaje tę samą regułę co nowy świat: 3 miesiące koszyka
 * przetrwania po lokalnej cenie z zapisu (region bez ceny: 0). `averageWealth`
 * NIE jest zamieniane na gotówkę. Zapas w magazynach regionów nie dostaje
 * właściciela w komisie (w starym modelu był już opłacony). Czysta funkcja
 * (SAVE-008); kohorta z już ustawionym `savings` zostaje bez zmian.
 */
export function migrateV4ToV5(raw: Record<string, unknown>): Record<string, unknown> {
  const versions = (raw.versions ?? {}) as Record<string, unknown>;
  const runnerState = raw.worldState as Record<string, unknown> | undefined;
  const worldState = runnerState?.worldState as WorldState | undefined;
  const bumped = { ...raw, versions: { ...versions, schemaVersion: 5 } };
  if (!runnerState || !worldState?.populationCohorts || !worldState.regions) return bumped;
  const priceOf = (regionId: string): number => {
    const marketId = worldState.regions[regionId]?.economy.marketId;
    return (marketId && worldState.markets?.[marketId]?.goods[SURVIVAL_GOOD_ID]?.localPrice) || 0;
  };
  const populationCohorts = Object.fromEntries(
    Object.entries(worldState.populationCohorts).map(([id, cohort]) => [
      id,
      typeof (cohort as { savings?: unknown }).savings === "number"
        ? cohort
        : { ...cohort, savings: initialHouseholdSavings(cohort.population, priceOf(cohort.regionId)) },
    ]),
  );
  return {
    ...bumped,
    worldState: { ...runnerState, worldState: { ...worldState, populationCohorts } },
  };
}

/**
 * v5 -> v6 (dochód właścicielski, decyzja właściciela 2026-10-01, Canonical
 * §52H): firmy dostają `finance.retainedEarnings` i
 * `finance.operatingCostHistory`. Zapis sprzed v6 nie pozwala wiarygodnie
 * odtworzyć niewypłaconego wyniku (gotówka miesza kapitał początkowy, zyski,
 * straty i rozbudowy), więc saldo startuje od 0 -- istniejąca gotówka
 * zostaje bez zmian i NIE jest wypłacana jako dochód; wypłaty zaczną się
 * dopiero od zysków rozliczonych po wczytaniu (ograniczenie migracji:
 * zyski sprzed zapisu zostają w firmie). Historia kosztów = jedna
 * obserwacja: `finance.costs` ostatniego ticka z zapisu. Czysta funkcja
 * (SAVE-008), bez wypłat i bez dodatkowych oszczędności; firma z już
 * ustawionymi polami zostaje bez zmian.
 */
export function migrateV5ToV6(raw: Record<string, unknown>): Record<string, unknown> {
  const versions = (raw.versions ?? {}) as Record<string, unknown>;
  const runnerState = raw.worldState as Record<string, unknown> | undefined;
  const worldState = runnerState?.worldState as WorldState | undefined;
  const bumped = { ...raw, versions: { ...versions, schemaVersion: 6 } };
  if (!runnerState || !worldState?.companies) return bumped;
  const companies = Object.fromEntries(
    Object.entries(worldState.companies).map(([id, company]) => {
      const finance = company.finance as Partial<typeof company.finance> & typeof company.finance;
      return [
        id,
        {
          ...company,
          finance: {
            ...finance,
            retainedEarnings:
              typeof finance.retainedEarnings === "number" ? finance.retainedEarnings : 0,
            operatingCostHistory: Array.isArray(finance.operatingCostHistory)
              ? finance.operatingCostHistory
              : [typeof finance.costs === "number" ? finance.costs : 0],
          },
        },
      ];
    }),
  );
  return {
    ...bumped,
    worldState: { ...runnerState, worldState: { ...worldState, companies } },
  };
}

/**
 * v6 -> v7 (P14, decyzja właściciela 2026-10-01, Canonical §52K): dobra
 * rynku dostają licznik `ticksWithoutOffers` (rynek z ofertami vs bez ofert).
 * Zapis v6 nie przechowywał ofert, więc NIE odtwarzamy ich historii: licznik
 * = 0 tylko przy śladzie oferty w zapisanym ostatnim ticku (zapas w
 * magazynie regionu `inventory > 0` albo zakupy gospodarstw
 * `householdPurchased > 0`); bez śladu pole zostaje puste -- rynek jest
 * traktowany jak rynek bez ofert, a jego cena jako orientacyjna, do pierwszej
 * prawdziwej oferty. Ceny, płace, salda i fakty bez zmian. Czysta funkcja
 * (SAVE-008); dobro z już ustawionym licznikiem zostaje bez zmian.
 */
export function migrateV6ToV7(raw: Record<string, unknown>): Record<string, unknown> {
  const versions = (raw.versions ?? {}) as Record<string, unknown>;
  const runnerState = raw.worldState as Record<string, unknown> | undefined;
  const worldState = runnerState?.worldState as WorldState | undefined;
  const bumped = { ...raw, versions: { ...versions, schemaVersion: 7 } };
  if (!runnerState || !worldState?.markets) return bumped;
  const markets = Object.fromEntries(
    Object.entries(worldState.markets).map(([id, market]) => [
      id,
      {
        ...market,
        goods: Object.fromEntries(
          Object.entries(market.goods).map(([goodId, good]) => [
            goodId,
            typeof good.ticksWithoutOffers === "number" ||
            !(good.inventory > 0 || (good.householdPurchased ?? 0) > 0)
              ? good
              : { ...good, ticksWithoutOffers: 0 },
          ]),
        ),
      },
    ]),
  );
  return {
    ...bumped,
    worldState: { ...runnerState, worldState: { ...worldState, markets } },
  };
}

/**
 * v7 -> v8 (etap 4B, decyzja właściciela 2026-10-01, Canonical §52L): firmy
 * dostają `finance.investmentReserve` (rezerwa inwestycyjna) = 0 -- zapis v7
 * nie miał planów rozbudowy z rezerwą, więc nic nie jest wydzielane z gotówki.
 * Ceny lotów w komisie (`Inventory.consignmentPrice`) są opcjonalne: brak
 * wpisu = cena lokalna (towar przywieziony przed 4B sprzedaje się po cenie
 * lokalnej importera, jak dotąd). Gotówka, salda i fakty bez zmian. Czysta
 * funkcja (SAVE-008); firma z ustawioną rezerwą zostaje bez zmian.
 */
export function migrateV7ToV8(raw: Record<string, unknown>): Record<string, unknown> {
  const versions = (raw.versions ?? {}) as Record<string, unknown>;
  const runnerState = raw.worldState as Record<string, unknown> | undefined;
  const worldState = runnerState?.worldState as WorldState | undefined;
  const bumped = { ...raw, versions: { ...versions, schemaVersion: 8 } };
  if (!runnerState || !worldState?.companies) return bumped;
  const companies = Object.fromEntries(
    Object.entries(worldState.companies).map(([id, company]) => [
      id,
      typeof (company.finance as { investmentReserve?: unknown }).investmentReserve === "number"
        ? company
        : { ...company, finance: { ...company.finance, investmentReserve: 0 } },
    ]),
  );
  return {
    ...bumped,
    worldState: { ...runnerState, worldState: { ...worldState, companies } },
  };
}

/** Keyed by the version a migrator upgrades FROM (vN -> vN+1). */
export const MIGRATIONS: Readonly<Record<number, SchemaMigrator>> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
  5: migrateV5ToV6,
  6: migrateV6ToV7,
  7: migrateV7ToV8,
};

/** SS39 Version Compatibility Matrix. */
export type VersionCompatibility =
  "compatible" | "migratable" | "unsupported-newer" | "unsupported-legacy" | "corrupted";

function hasMigrationPath(fromVersion: number, toVersion: number): boolean {
  for (let version = fromVersion; version < toVersion; version++) {
    if (!MIGRATIONS[version]) return false;
  }
  return true;
}

export function classifyVersionCompatibility(
  rawSchemaVersion: unknown,
  targetSchemaVersion: number = SCHEMA_VERSION,
): VersionCompatibility {
  if (
    typeof rawSchemaVersion !== "number" ||
    !Number.isInteger(rawSchemaVersion) ||
    rawSchemaVersion < 0
  ) {
    return "corrupted";
  }
  if (rawSchemaVersion === targetSchemaVersion) return "compatible";
  if (rawSchemaVersion > targetSchemaVersion) return "unsupported-newer";
  return hasMigrationPath(rawSchemaVersion, targetSchemaVersion)
    ? "migratable"
    : "unsupported-legacy";
}

/** SS43 Migration Log entry, one per `vN -> vN+1` step actually applied. */
export interface MigrationLogEntry {
  readonly fromVersion: number;
  readonly toVersion: number;
}

export interface MigrationResult {
  readonly raw: Record<string, unknown>;
  readonly sourceVersion: number;
  readonly targetVersion: number;
  readonly steps: readonly MigrationLogEntry[];
}

/**
 * SS41 Migration Pipeline's "Migrate Schema" step (Load Raw / Validate
 * Container / Read Versions happen in `atomic-write.ts`'s
 * `readSaveFile` before this is called; "Rebuild Derived State"/
 * "Validate World" happen inside `WorldRunner.fromState` after).
 * SAVE-008: deterministic -- the same `rawEnvelope` migrated twice
 * produces an identical result, since every migrator here is a pure
 * function and `MIGRATIONS` is a fixed table, never randomized/
 * timestamped.
 */
export function migrateSchema(
  rawEnvelope: Record<string, unknown>,
  targetSchemaVersion: number = SCHEMA_VERSION,
): MigrationResult {
  const versions = rawEnvelope.versions as { schemaVersion?: unknown } | undefined;
  const sourceVersion = versions?.schemaVersion;
  const compatibility = classifyVersionCompatibility(sourceVersion, targetSchemaVersion);

  if (compatibility === "corrupted") {
    throw new Error(
      `migrateSchema: save envelope has no valid schemaVersion (got ${JSON.stringify(sourceVersion)})`,
    );
  }
  if (compatibility === "unsupported-newer") {
    throw new Error(
      `migrateSchema: save schemaVersion ${String(sourceVersion)} is newer than this engine supports (${targetSchemaVersion})`,
    );
  }
  if (compatibility === "unsupported-legacy") {
    throw new Error(
      `migrateSchema: no migration path from schemaVersion ${String(sourceVersion)} to ${targetSchemaVersion}`,
    );
  }

  let current = rawEnvelope;
  let version = sourceVersion as number;
  const steps: MigrationLogEntry[] = [];
  while (version < targetSchemaVersion) {
    const migrator = MIGRATIONS[version]!;
    current = migrator(current);
    steps.push({ fromVersion: version, toVersion: version + 1 });
    version += 1;
  }

  return {
    raw: current,
    sourceVersion: sourceVersion as number,
    targetVersion: targetSchemaVersion,
    steps,
  };
}
