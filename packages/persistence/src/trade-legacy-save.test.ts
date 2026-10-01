import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildWorldSnapshot,
  LEGACY_TRADE_FLOW_FACT_TYPE,
  runTradeScenario,
  TRADE_SCENARIO as S,
  TRADE_SCENARIO_RECIPES,
  tradeScenarioEvaluatedQuantity,
  type WorldRunner,
} from "@first-cause/simulation";
import { buildSaveGame, ENGINE_VERSION, SCHEMA_VERSION } from "./envelope.js";
import { writeSaveFile } from "./atomic-write.js";
import { classifyVersionCompatibility, migrateV2ToV3 } from "./migrations.js";
import { loadGame, saveGame } from "./save-load.js";

/*
 * M21-VIS-R4B follow-up: zapis silnika < 3 (fakt `trade_flow_active` z
 * ilością OCENIONĄ) → migracja schematu v2 → v3 → fakt `trade_flow_evaluated`;
 * Read Model nigdy nie pokazuje go jako dostawy, a rozróżnienie przeżywa
 * kolejny zapis i odczyt.
 */

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
async function tempFile(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "first-cause-trade-legacy-"));
  tempDirs.push(dir);
  return path.join(dir, "save.json");
}
const metadata = {
  saveId: "s",
  saveName: "S",
  createdAt: "2026-01-01T00:00:00.000Z",
  savedAt: "2026-01-01T00:00:00.000Z",
  playtimeSeconds: 0,
  worldName: "W",
};
const restore = { productionRecipesByMethodId: TRADE_SCENARIO_RECIPES };

/**
 * Zapis w kształcie, jaki wytworzyłby silnik 2 (schemat 2): ten sam stan,
 * ale fakt handlu niesie ilość ocenioną (tak liczył stary silnik).
 */
async function writeEngine2Save(runner: WorldRunner, filePath: string) {
  const state = runner.getState();
  const evaluated = tradeScenarioEvaluatedQuantity(runner.worldState);
  const legacyState = {
    ...state,
    factStore: {
      ...state.factStore,
      facts: state.factStore.facts.map((f) =>
        f.type === "trade_flow_active"
          ? { ...f, values: { ...f.values, after: evaluated } }
          : f,
      ),
    },
  };
  const envelope = buildSaveGame({ ...metadata, state: legacyState });
  await writeSaveFile(filePath, {
    ...envelope,
    versions: { ...envelope.versions, schemaVersion: 2, engineVersion: 2 },
  });
  return evaluated;
}

const tradeOf = (runner: WorldRunner, regionId: string) =>
  buildWorldSnapshot(runner.worldState, runner.facts).regions.find(
    (r) => r.regionId === regionId,
  )!.trade;

describe("legacy engine trade facts across save / load", () => {
  it("classifies schema v2 as migratable (existing sequential policy) v3–v7 as migratable and v8 as compatible", () => {
    expect(SCHEMA_VERSION).toBe(8);
    expect(ENGINE_VERSION).toBe(9);
    expect(classifyVersionCompatibility(2)).toBe("migratable");
    expect(classifyVersionCompatibility(3)).toBe("migratable");
    expect(classifyVersionCompatibility(4)).toBe("migratable");
    expect(classifyVersionCompatibility(5)).toBe("migratable");
    expect(classifyVersionCompatibility(6)).toBe("migratable");
    expect(classifyVersionCompatibility(7)).toBe("migratable");
    expect(classifyVersionCompatibility(8)).toBe("compatible");
    expect(classifyVersionCompatibility(9)).toBe("unsupported-newer");
  });

  it("migrateV2ToV3 relabels only engine < 3 trade facts, keeps identity and values, purely", () => {
    const fact = {
      id: "f1",
      tick: 0,
      type: "trade_flow_active",
      subject: { entityType: "connectionGood", entityId: "c:flour" },
      location: { regionId: "r" },
      values: { before: 0, after: 7.87 },
    };
    const other = { ...fact, id: "f2", type: "inventory_increased" };
    const raw = (engineVersion: number | undefined) => ({
      versions: { schemaVersion: 2, contentVersion: 1, engineVersion },
      worldState: { factStore: { facts: [fact, other], nextSequence: 3 } },
    });
    const frozen = JSON.stringify(raw(2));
    const migrated = migrateV2ToV3(raw(2)) as {
      versions: { schemaVersion: number };
      worldState: { factStore: { facts: (typeof fact)[]; nextSequence: number } };
    };
    expect(migrated.versions.schemaVersion).toBe(3);
    expect(migrated.worldState.factStore.facts).toEqual([
      { ...fact, type: LEGACY_TRADE_FLOW_FACT_TYPE },
      other,
    ]);
    expect(migrated.worldState.factStore.nextSequence).toBe(3);
    expect(JSON.stringify(raw(2))).toBe(frozen);
    expect(migrateV2ToV3(raw(2))).toEqual(migrated);
    // Brak wersji silnika = nieznana semantyka → traktowana jak starsza.
    expect(
      (migrateV2ToV3(raw(undefined)) as typeof migrated).worldState.factStore.facts[0]!
        .type,
    ).toBe(LEGACY_TRADE_FLOW_FACT_TYPE);
    // Zapis schematu 2 wykonany już silnikiem 3: fakty bez zmian.
    expect(
      (migrateV2ToV3(raw(3)) as typeof migrated).worldState.factStore.facts[0]!.type,
    ).toBe("trade_flow_active");
  });

  it("load → view → new tick → save → load keeps legacy and new trade facts distinguishable", async () => {
    const original = runTradeScenario(1);
    const first = await tempFile();
    const evaluated = await writeEngine2Save(original, first);

    // D. Bezpośrednio po wczytaniu, przed nowym tickiem.
    const { runner: loaded, saveGame: data } = await loadGame(first, restore);
    expect(data.versions.schemaVersion).toBe(8);
    const legacy = loaded.facts.filter((f) => f.type === LEGACY_TRADE_FLOW_FACT_TYPE);
    expect(legacy).toHaveLength(1);
    expect(legacy[0]!.values.after).toBe(evaluated); // historia zachowana, nie wyzerowana
    expect(loaded.facts.some((f) => f.type === "trade_flow_active")).toBe(false);
    const afterLoad = tradeOf(loaded, S.importerRegionId);
    if (afterLoad.status !== "RECORDED") throw new Error("expected RECORDED");
    expect(afterLoad.legacyRecords).toBe(1);
    expect(afterLoad.goods[0]!.imported).toEqual({
      known: 0,
      records: 1,
      unknownRecords: 1,
    });
    expect(afterLoad.goods[0]!.partners[0]!.partnerRegionId).toBe(S.exporterRegionId);
    // Ilość oceniona nie trafia do warstwy przepływów Atlasu.
    expect(
      buildWorldSnapshot(loaded.worldState, loaded.facts).flows.filter(
        (f) => f.family === "trade",
      ),
    ).toEqual([]);

    // E. Nowy tick: nowy fakt z ilością dostarczoną; okresy się nie mieszają.
    loaded.step();
    const fresh = loaded.facts.filter(
      (f) => f.type === "trade_flow_active" && f.tick === loaded.tick - 1,
    );
    expect(fresh.length).toBeGreaterThan(0);
    const afterTick = tradeOf(loaded, S.importerRegionId);
    if (afterTick.status !== "RECORDED") throw new Error("expected RECORDED");
    expect(afterTick.legacyRecords).toBe(0);
    expect(afterTick.goods[0]!.imported.known).toBe(fresh[0]!.values.after);
    expect(afterTick.goods[0]!.imported.unknownRecords).toBe(0);

    // F. Ponowny zapis (schemat 3, silnik 3) i odczyt -- bez ponownej migracji.
    const second = await tempFile();
    await saveGame(second, { runner: loaded, ...metadata, compact: false });
    const { runner: reloaded, saveGame: data2 } = await loadGame(second, restore);
    expect(data2.versions).toMatchObject({ schemaVersion: 8, engineVersion: 9 });
    const types = (r: WorldRunner) =>
      r.facts
        .filter(
          (f) => f.type === "trade_flow_active" || f.type === LEGACY_TRADE_FLOW_FACT_TYPE,
        )
        .map((f) => [f.id, f.type, f.values.after]);
    expect(types(reloaded)).toEqual(types(loaded));
    expect(types(reloaded)).toContainEqual([
      legacy[0]!.id,
      LEGACY_TRADE_FLOW_FACT_TYPE,
      evaluated,
    ]);
  });
});
