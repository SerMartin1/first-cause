import { mkdir, open, readFile, rename } from "node:fs/promises";
import path from "node:path";
import { computeSaveGameChecksums, type SaveGameChecksums } from "./checksum.js";
import type { SaveGame } from "./envelope.js";

/** SS38 Save Format Version -- the container/compression format, distinct from `SCHEMA_VERSION` (the world model's own structure). JSON today (SS67/69: "v0.1 może rozpocząć od czytelnego formatu developerskiego"). */
export const SAVE_FORMAT_VERSION = "1" as const;

export interface SaveFileContainer {
  readonly saveFormatVersion: string;
  readonly checksums: SaveGameChecksums;
  readonly saveGame: SaveGame;
}

/**
 * Atomic Write (SS47-49): write to `<path>.tmp` -> `fsync` -> rename the
 * EXISTING file (if any) to `<path>.bak` -> atomically rename `.tmp`
 * over `path`. A crash or interruption at any point before the final
 * rename leaves `path` completely untouched -- there is no window where
 * a reader can observe a half-written file at the real save location
 * (`rename` is atomic within the same filesystem/volume on both POSIX
 * and NTFS).
 *
 * The checksum is computed from `saveGame` and baked into the container
 * BEFORE anything is written -- `readSaveFile` re-derives it from the
 * content it actually read and compares, never trusts a
 * possibly-corrupted stored value alone.
 */
export async function writeSaveFile(filePath: string, saveGame: SaveGame): Promise<void> {
  const checksums = computeSaveGameChecksums(saveGame);
  const container: SaveFileContainer = {
    saveFormatVersion: SAVE_FORMAT_VERSION,
    checksums,
    saveGame,
  };
  const serialized = JSON.stringify(container, null, 2);

  await mkdir(path.dirname(filePath), { recursive: true });

  const tempPath = `${filePath}.tmp`;
  const handle = await open(tempPath, "w");
  try {
    await handle.writeFile(serialized, "utf-8");
    await handle.sync();
  } finally {
    await handle.close();
  }

  const backupPath = `${filePath}.bak`;
  try {
    await rename(filePath, backupPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    // ENOENT: no prior save to back up -- a fresh save, not an error.
  }

  await rename(tempPath, filePath);
}

export interface ReadSaveFileResult {
  readonly container: SaveFileContainer;
  /** `true` when the freshly-read content's own checksum matches what the container claims -- `false` signals corruption (SS48), never thrown here so the caller (`save-load.ts`) decides the policy. */
  readonly checksumsMatch: boolean;
}

export async function readSaveFile(filePath: string): Promise<ReadSaveFileResult> {
  const raw = await readFile(filePath, "utf-8");

  let container: SaveFileContainer;
  try {
    container = JSON.parse(raw) as SaveFileContainer;
  } catch (error) {
    throw new Error(
      `readSaveFile: "${filePath}" is not valid JSON (corrupted save) -- ${(error as Error).message}`,
    );
  }
  if (!container.saveGame || !container.checksums) {
    throw new Error(`readSaveFile: "${filePath}" is missing required container fields (corrupted save)`);
  }

  const recomputed = computeSaveGameChecksums(container.saveGame);
  const checksumsMatch = recomputed.world === container.checksums.world;
  return { container, checksumsMatch };
}
