import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createSettlement, createWorldState } from "@first-cause/entities";
import { computeChecksum, createWorldRunner } from "@first-cause/simulation";
import { SCHEMA_VERSION } from "./envelope.js";
import { migrateSchema, migrateV1ToV2 } from "./migrations.js";
import { loadGame, saveGame } from "./save-load.js";
import { buildFixtureEventTypes, buildFixtureWorldState } from "./test-fixtures.js";

/* SET-LIFECYCLE-001: `Settlement.status` w zapisie (schema v2) i migracja v1 → v2. */

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

function runnerWithAbandonedSettlement() {
  const base = buildFixtureWorldState("settlement-lifecycle-save");
  const abandoned = {
    ...createSettlement({
      id: "settlement_old_haven",
      regionId: "region_a",
      name: "Old Haven",
      foundedTick: 0,
      stage: "HAMLET",
    }),
    status: "ABANDONED" as const,
    abandonedTick: 0,
  };
  const worldState = createWorldState({
    world: base.world,
    continents: Object.values(base.continents),
    regions: Object.values(base.regions),
    resourceDeposits: Object.values(base.resourceDeposits),
    architectInfluence: base.architectInfluence,
    settlements: [abandoned],
  });
  return createWorldRunner({
    worldSeed: "settlement-lifecycle-save",
    startYear: 1200,
    worldState,
    chronicleEventTypes: buildFixtureEventTypes(),
  });
}

describe("SET-LIFECYCLE-001 -- save / load", () => {
  it("L: save → load keeps an ABANDONED settlement ABANDONED (same checksum)", async () => {
    const runner = runnerWithAbandonedSettlement();
    for (let i = 0; i < 3; i++) runner.step();
    const dir = await mkdtemp(path.join(tmpdir(), "first-cause-lifecycle-"));
    tempDirs.push(dir);
    const filePath = path.join(dir, "save.json");
    await saveGame(filePath, {
      runner,
      saveId: "s",
      saveName: "S",
      createdAt: "2026-01-01T00:00:00.000Z",
      savedAt: "2026-01-01T00:00:00.000Z",
      playtimeSeconds: 0,
      worldName: "W",
    });
    const { runner: loaded, saveGame: data } = await loadGame(filePath, {
      chronicleEventTypes: buildFixtureEventTypes(),
    });
    expect(data.versions.schemaVersion).toBe(SCHEMA_VERSION);
    const settlement = loaded.getState().worldState.settlements.settlement_old_haven!;
    expect(settlement.status).toBe("ABANDONED");
    expect(settlement.abandonedTick).toBe(0);
    expect(computeChecksum(loaded.getState())).toBe(computeChecksum(runner.getState()));
  });

  it("v1 → v2 migration marks every v1 settlement ACTIVE (no abandonment existed in v1), purely", () => {
    const v1 = {
      versions: { schemaVersion: 1, contentVersion: 1, engineVersion: 1 },
      worldState: {
        worldState: {
          settlements: {
            a: { id: "a", name: "A", population: { cohortIds: [], totalPopulation: 3 } },
            b: { id: "b", name: "B", population: { cohortIds: [], totalPopulation: 0 } },
          },
        },
      },
    };
    const frozen = JSON.stringify(v1);
    const migrated = migrateV1ToV2(v1) as {
      versions: { schemaVersion: number };
      worldState: { worldState: { settlements: Record<string, { status?: string }> } };
    };
    const settlements = migrated.worldState.worldState.settlements;
    expect(migrated.versions.schemaVersion).toBe(2);
    expect(settlements.a!.status).toBe("ACTIVE");
    // 0 mieszkańców w v1 → ACTIVE; porzucenie (z faktem) nastąpi w pierwszym ticku po wczytaniu.
    expect(settlements.b!.status).toBe("ACTIVE");
    expect(JSON.stringify(v1)).toBe(frozen);
    expect(migrateV1ToV2(v1)).toEqual(migrated);
    // Pełny pipeline v1 → aktualny schemat korzysta z tego migratora.
    const result = migrateSchema(v1);
    expect(result.steps).toEqual([{ fromVersion: 1, toVersion: 2 }]);
  });
});
