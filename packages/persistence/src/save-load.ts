import { WorldRunner, type WorldRunnerRestoreConfig } from "@first-cause/simulation";
import { buildSaveGame, type BuildSaveGameInput, type SaveGame } from "./envelope.js";
import { compactWorldRunnerState } from "./compaction.js";
import { migrateSchema } from "./migrations.js";
import { readSaveFile, writeSaveFile } from "./atomic-write.js";

export interface SaveGameOptions extends Omit<BuildSaveGameInput, "state" | "lastCompactedAtTick"> {
  readonly runner: WorldRunner;
  /** Runs `compaction.ts` before writing. Defaults to `true` -- SS72/PERF-007: history is the dominant save-size risk, so compacting is the save-time default, not an opt-in. */
  readonly compact?: boolean;
}

/** Full save pipeline: (optional) compaction -> envelope -> checksums -> atomic write. */
export async function saveGame(filePath: string, options: SaveGameOptions): Promise<void> {
  const { runner, compact = true, ...metadata } = options;
  const rawState = runner.getState();
  const state = compact ? compactWorldRunnerState(rawState, runner.tick) : rawState;

  const envelope = buildSaveGame({
    ...metadata,
    state,
    ...(compact ? { lastCompactedAtTick: runner.tick } : {}),
  });
  await writeSaveFile(filePath, envelope);
}

export interface LoadGameResult {
  readonly runner: WorldRunner;
  readonly saveGame: SaveGame;
}

/**
 * Full load pipeline (SS57): verify checksum -> migrate schema ->
 * `WorldRunner.fromState` (which itself rebuilds Derived State, SS61).
 * `restoreConfig` is Definition Data (event type registries, production
 * recipes, tuning overrides) the caller supplies fresh -- the save never
 * carries it (DATA-001), same contract as `WorldRunner.fromState` itself.
 */
export async function loadGame(
  filePath: string,
  restoreConfig: WorldRunnerRestoreConfig,
): Promise<LoadGameResult> {
  const { container, checksumsMatch } = await readSaveFile(filePath);
  if (!checksumsMatch) {
    throw new Error(`loadGame: "${filePath}" failed checksum validation (corrupted save)`);
  }

  const migrated = migrateSchema(container.saveGame as unknown as Record<string, unknown>);
  const saveGameData = migrated.raw as unknown as SaveGame;

  const runner = WorldRunner.fromState(saveGameData.worldState, restoreConfig);
  return { runner, saveGame: saveGameData };
}
