import { SimulationClock, type WorldRunnerState } from "@first-cause/simulation";

/**
 * SaveGame envelope (Save/Determinism/Performance Spec SS31-38, SAVE-007).
 *
 * SS32's "recommended model" lists `rngState`/`architectState`/
 * `historicalState` as SIBLINGS of `worldState`. This codebase's actual
 * architecture already couples them inseparably inside `WorldRunner`
 * (RNG lives on `HeadlessRunner`, Architect Influence and Causality/
 * Chronicle history all read/write together every tick, see
 * `WorldRunner.step()`) -- SS58 Canonical State itself lists "RNG" and
 * "history anchors" as part of the same canonical-state bucket as
 * entities/inventories/prices, so nesting them together under one
 * `worldState: WorldRunnerState` section (instead of inventing four
 * separate top-level fields that would just be a different view of the
 * SAME `WorldRunner.getState()` object) is a deliberate simplification,
 * not a spec violation: SS32 itself is framed as "rekomendowany model",
 * not a mandated literal shape. `worldConfiguration` (SS32) is likewise
 * folded away here -- everything it would hold (`worldSeed`/
 * `startYear`/`startMonth`) already lives inside `worldState.headless`,
 * and `WorldRunner.fromState` reads it from exactly there; a second copy
 * would just be a redundant source of truth.
 */
/**
 * v2 (SET-LIFECYCLE-001, 2026-09-29): `Settlement.status` (`ACTIVE` |
 * `ABANDONED`) + `Settlement.abandonedTick`. Zapisy v1 migruje
 * `MIGRATIONS[1]` (`migrations.ts`).
 */
export const SCHEMA_VERSION = 2;
/** Bumped when `@first-cause/content` definitions change in a save-relevant way (SS36) -- no such change has happened yet. */
export const CONTENT_VERSION = 1;
/** Bumped when simulation SEMANTICS change in a save-relevant way (SS37) -- distinct from `SCHEMA_VERSION` (structure) and `CONTENT_VERSION` (definitions). */
/** v2: osada z populacją 0 przechodzi ACTIVE → ABANDONED w tym samym ticku (SET-LIFECYCLE-001). */
export const ENGINE_VERSION = 2;

export interface SaveGameVersions {
  readonly schemaVersion: number;
  readonly contentVersion: number;
  readonly engineVersion: number;
}

/**
 * SS33 Metadata. `createdAt`/`savedAt` are ISO-8601 wall-clock strings
 * the CALLER supplies (SAVE-004: Simulation Logic itself never reads
 * system time -- `buildSaveGame` doesn't call `Date.now()`, so this
 * module stays a pure function of its inputs) -- SS33 explicitly notes
 * they "nie wpływają na symulację", and `checksum.ts` excludes them from
 * `worldChecksum` for exactly that reason.
 */
export interface SaveGameMetadata {
  readonly saveId: string;
  readonly saveName: string;
  readonly createdAt: string;
  readonly savedAt: string;
  readonly playtimeSeconds: number;
  readonly worldName: string;
  readonly currentYear: number;
  readonly currentMonth: number;
  readonly currentTick: number;
  readonly seed: string;
  readonly worldSize: string;
  readonly regionCount: number;
}

/**
 * SS32 `persistenceState`: bookkeeping ABOUT the save file/history
 * management, not canonical simulation content. Minimal for VS -- SS77
 * Compaction Boundary just needs to know when compaction last ran so a
 * caller can decide whether to run it again, not a full compaction log
 * (TODO tuning: the exact scheduling policy is a caller/UI decision, see
 * `compaction.ts`).
 */
export interface SaveGamePersistenceState {
  readonly lastCompactedAtTick: number | undefined;
}

export interface SaveGame {
  readonly metadata: SaveGameMetadata;
  readonly versions: SaveGameVersions;
  readonly worldState: WorldRunnerState;
  readonly persistenceState: SaveGamePersistenceState;
  /** SS273 UI integration note: presentation state (selected region, viewport, filters, ...), carried opaquely -- `packages/persistence` never reads or validates its shape, only stores/returns it. `undefined` when the caller has none. */
  readonly optionalUiState: Readonly<Record<string, unknown>> | undefined;
}

export interface BuildSaveGameInput {
  /** Already-compacted `WorldRunner.getState()` output, e.g. from `compaction.ts`'s `compactWorldRunnerState` -- `buildSaveGame` itself never compacts, so a caller who skips that step gets exactly what it passed in. */
  readonly state: WorldRunnerState;
  readonly saveId: string;
  readonly saveName: string;
  readonly createdAt: string;
  readonly savedAt: string;
  readonly playtimeSeconds: number;
  readonly worldName: string;
  readonly lastCompactedAtTick?: number;
  readonly optionalUiState?: Readonly<Record<string, unknown>>;
}

/** Pure: never touches wall-clock time or the filesystem itself (see `atomic-write.ts` for that). */
export function buildSaveGame(input: BuildSaveGameInput): SaveGame {
  const state = input.state;
  const date = SimulationClock.fromState(state.headless.clock).date;

  return {
    metadata: {
      saveId: input.saveId,
      saveName: input.saveName,
      createdAt: input.createdAt,
      savedAt: input.savedAt,
      playtimeSeconds: input.playtimeSeconds,
      worldName: input.worldName,
      currentYear: date.year,
      currentMonth: date.month,
      currentTick: state.headless.clock.tick,
      seed: String(state.headless.worldSeed),
      worldSize: state.worldState.world.configuration.worldSizePreset,
      regionCount: Object.keys(state.worldState.regions).length,
    },
    versions: {
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      engineVersion: ENGINE_VERSION,
    },
    worldState: state,
    persistenceState: {
      lastCompactedAtTick: input.lastCompactedAtTick,
    },
    optionalUiState: input.optionalUiState,
  };
}
