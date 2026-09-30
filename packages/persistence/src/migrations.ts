import {
  LEGACY_TRADE_FLOW_FACT_TYPE,
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
    },
  };
}

/** Keyed by the version a migrator upgrades FROM (vN -> vN+1). */
export const MIGRATIONS: Readonly<Record<number, SchemaMigrator>> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
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
