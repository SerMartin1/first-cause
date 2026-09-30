import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DefinitionRegistry, type EventTypeDefinition } from "@first-cause/content";
import {
  buildTradeScenarioWorldState,
  createWorldRunner,
  LEGACY_TRADE_FLOW_FACT_TYPE,
  TRADE_SCENARIO as S,
  TRADE_SCENARIO_RECIPES,
  tradeScenarioEvaluatedQuantity,
  type WorldRunner,
} from "@first-cause/simulation";
import { buildSaveGame } from "./envelope.js";
import { writeSaveFile } from "./atomic-write.js";
import { loadGame, saveGame } from "./save-load.js";

/*
 * M21-VIS-R4B (Chronicle): otwarty proces `trade_route` z zapisu silnika < 3
 * (suma ilości OCENIONYCH) przechodzi przez save → load → tick → save → load
 * bez zmieszania z ilościami DOSTARCZONYMI; wynik deterministyczny.
 */

const KEY = `trade_route:${S.connectionId}:${S.goodId}`;
const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
  {
    id: "trade_route_emerged",
    nameKey: "content.eventType.trade_route_emerged.name",
    category: "trade",
    baseSignificance: 30,
    candidateThreshold: 5,
    aggregationPolicy: { windowTicks: 1, scope: "entity" },
    noveltyPolicy: { tracksFirst: false, scope: "world" },
    durationPolicy: "INSTANTANEOUS",
    anchorPolicy: { alwaysAnchor: false },
    implementationPhase: "VS",
  },
]);
const restore = {
  productionRecipesByMethodId: TRADE_SCENARIO_RECIPES,
  chronicleEventTypes: eventTypes,
};
const metadata = {
  saveId: "s",
  saveName: "S",
  createdAt: "2026-01-01T00:00:00.000Z",
  savedAt: "2026-01-01T00:00:00.000Z",
  playtimeSeconds: 0,
  worldName: "W",
};

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
async function tempFile(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "first-cause-trade-route-"));
  tempDirs.push(dir);
  return path.join(dir, "save.json");
}

function scenarioRunner(): WorldRunner {
  const worldState = buildTradeScenarioWorldState();
  return createWorldRunner({
    worldState,
    worldSeed: worldState.world.seed,
    startYear: worldState.world.currentDate.year,
    startMonth: worldState.world.currentDate.month,
    ...restore,
  });
}

/**
 * Zapis w kształcie silnika 2 po `ticks` tickach: fakty handlu i suma procesu
 * `trade_route` niosą ilości OCENIONE (tak liczył stary silnik).
 */
async function writeEngine2Save(ticks: number, filePath: string) {
  const runner = scenarioRunner();
  runner.runTicks(ticks);
  const state = runner.getState();
  const evaluated = tradeScenarioEvaluatedQuantity(runner.worldState);
  const tradeFacts = state.factStore.facts.filter((f) => f.type === "trade_flow_active");
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
    chronicle: {
      ...state.chronicle,
      activeProcess: {
        processes: state.chronicle.activeProcess.processes.map((p) =>
          p.processKey === KEY
            ? { ...p, accumulatedMagnitude: evaluated * tradeFacts.length }
            : p,
        ),
      },
    },
  };
  const envelope = buildSaveGame({ ...metadata, state: legacyState });
  await writeSaveFile(filePath, {
    ...envelope,
    versions: { ...envelope.versions, schemaVersion: 2, engineVersion: 2 },
  });
  return {
    evaluatedSum: evaluated * tradeFacts.length,
    factIds: tradeFacts.map((f) => f.id),
  };
}

const process = (runner: WorldRunner) =>
  runner.getState().chronicle.activeProcess.processes.find((p) => p.processKey === KEY);

describe("trade_route across a legacy save (engine < 3)", () => {
  it("save → load → tick → save → load: legacy sum stays evaluated-only, new sum delivered-only", async () => {
    const first = await tempFile();
    const { evaluatedSum, factIds } = await writeEngine2Save(2, first);

    const { runner: loaded } = await loadGame(first, restore);
    const legacy = process(loaded)!;
    expect(legacy).toMatchObject({
      state: "EMERGING",
      accumulatedMagnitude: evaluatedSum,
      magnitudeBasis: "evaluated",
    });
    const entriesBefore = loaded.chronicleEntries.length;

    loaded.step();
    const delivered = loaded.facts.filter(
      (f) => f.type === "trade_flow_active" && f.tick === loaded.tick - 1,
    );
    expect(delivered).toHaveLength(1);
    const fresh = process(loaded)!;
    // Nowy epizod: tylko ilość dostarczona tego ticka, bez znacznika.
    expect(fresh.accumulatedMagnitude).toBe(delivered[0]!.values.after);
    expect(fresh.magnitudeBasis).toBeUndefined();
    expect(fresh.startTick).toBe(loaded.tick - 1);
    expect(fresh.rootFactId).toBe(delivered[0]!.id);
    // Stary epizod oceniony na granicy (własna suma) → wpis Chronicle z jego faktem źródłowym.
    const entries = loaded.chronicleEntries.slice(entriesBefore);
    expect(entries.map((e) => e.eventType)).toEqual(["trade_route_emerged"]);
    expect(entries[0]!.primaryFactRefs).toEqual([legacy.rootFactId]);
    // Historia faktów zachowana: te same id, typ legacy.
    expect(
      loaded.facts.filter((f) => f.type === LEGACY_TRADE_FLOW_FACT_TYPE).map((f) => f.id),
    ).toEqual(factIds);

    const second = await tempFile();
    await saveGame(second, { runner: loaded, ...metadata, compact: false });
    const { runner: reloaded } = await loadGame(second, restore);
    expect(process(reloaded)).toEqual(fresh);
    expect(reloaded.chronicleEntries).toEqual(loaded.chronicleEntries);
  });

  it("is deterministic for the same state and seed", async () => {
    const once = async () => {
      const file = await tempFile();
      await writeEngine2Save(2, file);
      const { runner } = await loadGame(file, restore);
      runner.runTicks(3);
      return {
        chronicle: runner.getState().chronicle,
        trade: runner.facts
          .filter(
            (f) =>
              f.type === "trade_flow_active" || f.type === LEGACY_TRADE_FLOW_FACT_TYPE,
          )
          .map((f) => [f.id, f.type, f.values.after]),
      };
    };
    expect(await once()).toEqual(await once());
  });
});
