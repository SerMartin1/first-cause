import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WorldRunner, computeChecksum } from "@first-cause/simulation";
import { readSaveFile } from "./atomic-write.js";
import { computeWorldChecksum } from "./checksum.js";
import { loadGame, saveGame } from "./save-load.js";
import { buildFixtureEventTypes, buildFixtureRunner } from "./test-fixtures.js";

const tempDirs: string[] = [];

async function makeTempSavePath(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "first-cause-persistence-test-"));
  tempDirs.push(dir);
  return path.join(dir, "save.json");
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function metadata() {
  return {
    saveId: "save_001",
    saveName: "Test Save",
    createdAt: "2026-01-01T00:00:00.000Z",
    savedAt: "2026-01-01T00:00:00.000Z",
    playtimeSeconds: 0,
    worldName: "W",
  };
}

describe("saveGame / loadGame roundtrip (SS203 Save Roundtrip)", () => {
  it("checksum(state) === checksum(load(save(state)))", async () => {
    const runner = buildFixtureRunner("roundtrip-seed");
    for (let i = 0; i < 10; i++) runner.step();
    const filePath = await makeTempSavePath();

    await saveGame(filePath, { runner, ...metadata() });
    const { runner: loaded } = await loadGame(filePath, { chronicleEventTypes: buildFixtureEventTypes() });

    expect(computeChecksum(loaded.getState())).toBe(computeChecksum(runner.getState()));
  });

  it("preserves the world checksum specifically, matching what was written to disk", async () => {
    const runner = buildFixtureRunner("roundtrip-seed-2");
    for (let i = 0; i < 5; i++) runner.step();
    const filePath = await makeTempSavePath();

    await saveGame(filePath, { runner, ...metadata() });
    const written = JSON.parse(await readFile(filePath, "utf-8")) as {
      checksums: { world: string };
    };
    const { saveGame: loadedSaveGame } = await loadGame(filePath, {
      chronicleEventTypes: buildFixtureEventTypes(),
    });

    expect(computeWorldChecksum(loadedSaveGame)).toBe(written.checksums.world);
  });
});

describe("Save/Load Determinism Test (SS84)", () => {
  it("continuing a save/loaded run matches continuing the original run for the same number of further ticks", async () => {
    // Spec's own procedure at a scale appropriate for a unit test (600/1200 ticks
    // -> 20/40 here): seed S, run N ticks, save, continue to M, checksum A;
    // load save, continue to M, checksum B; A === B.
    const control = buildFixtureRunner("determinism-seed");
    for (let i = 0; i < 20; i++) control.step();
    const filePath = await makeTempSavePath();
    await saveGame(filePath, { runner: control, ...metadata() });

    for (let i = 0; i < 20; i++) control.step(); // continue branch A to tick 40
    const checksumA = computeChecksum(control.getState());

    const { runner: restored } = await loadGame(filePath, { chronicleEventTypes: buildFixtureEventTypes() });
    for (let i = 0; i < 20; i++) restored.step(); // continue branch B (loaded) to tick 40
    const checksumB = computeChecksum(restored.getState());

    expect(checksumB).toBe(checksumA);
  });
});

describe("Atomic write corruption protection (SS47-49)", () => {
  it("readSaveFile detects a checksum mismatch instead of silently trusting corrupted content", async () => {
    const runner = buildFixtureRunner("corruption-seed");
    const filePath = await makeTempSavePath();
    await saveGame(filePath, { runner, ...metadata() });

    // Tamper a field the World Checksum actually covers (metadata like
    // saveName is deliberately EXCLUDED, SS87) without recomputing it --
    // simulates on-disk corruption/manual editing after the fact.
    const raw = JSON.parse(await readFile(filePath, "utf-8")) as {
      saveGame: { worldState: { worldState: { world: { name: string } } } };
    };
    raw.saveGame.worldState.worldState.world.name = "Tampered";
    await writeFile(filePath, JSON.stringify(raw, null, 2), "utf-8");

    const { checksumsMatch } = await readSaveFile(filePath);
    expect(checksumsMatch).toBe(false);
    await expect(loadGame(filePath, { chronicleEventTypes: buildFixtureEventTypes() })).rejects.toThrow(
      /checksum/,
    );
  });

  it("a crashed write (leftover partial .tmp file) never corrupts the last good save", async () => {
    const runner = buildFixtureRunner("interrupted-write-seed");
    const filePath = await makeTempSavePath();
    await saveGame(filePath, { runner, ...metadata() }); // good save #1
    const goodContent = await readFile(filePath, "utf-8");

    // Simulate a crash mid-write: a second save's temp file exists but the
    // process died before the final atomic rename ever ran.
    await writeFile(`${filePath}.tmp`, "{ not even valid json, write was interrupted", "utf-8");

    const stillGood = await readFile(filePath, "utf-8");
    expect(stillGood).toBe(goodContent);
    const { checksumsMatch } = await readSaveFile(filePath);
    expect(checksumsMatch).toBe(true);
  });

  it("backs up the previous save to .bak before replacing it", async () => {
    const first = buildFixtureRunner("backup-seed");
    const filePath = await makeTempSavePath();
    await saveGame(filePath, { runner: first, ...metadata() });
    const firstContent = await readFile(filePath, "utf-8");

    const second = buildFixtureRunner("backup-seed");
    second.step();
    await saveGame(filePath, { runner: second, ...metadata() });

    const backupContent = await readFile(`${filePath}.bak`, "utf-8");
    expect(backupContent).toBe(firstContent);
  });
});

describe("Container Order Test (SS206)", () => {
  it("region insertion order never changes the World Checksum", () => {
    const runnerA = WorldRunner.fromState(buildFixtureRunner("order-seed").getState(), {
      chronicleEventTypes: buildFixtureEventTypes(),
    });
    const state = runnerA.getState();

    // Rebuild the same worldState with regions/resourceDeposits Records
    // constructed in reverse key order -- canonicalStringify must sort
    // keys regardless, so the checksum must not move.
    const reorderedRegions = Object.fromEntries([...Object.entries(state.worldState.regions)].reverse());
    const reorderedDeposits = Object.fromEntries(
      [...Object.entries(state.worldState.resourceDeposits)].reverse(),
    );
    const reordered = {
      ...state,
      worldState: { ...state.worldState, regions: reorderedRegions, resourceDeposits: reorderedDeposits },
    };

    expect(computeChecksum(reordered)).toBe(computeChecksum(state));
  });
});
