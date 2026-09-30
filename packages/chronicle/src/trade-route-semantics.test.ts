import { describe, expect, it } from "vitest";
import type { SimulationFact } from "@first-cause/causality";
import { DefinitionRegistry, type EventTypeDefinition } from "@first-cause/content";
import { ActiveProcessRegistry, type ActiveProcess } from "./active-process-registry.js";
import { buildChronicleCandidates } from "./candidate-pipeline.js";
import { createNoveltyRegistry } from "./novelty-registry.js";

/*
 * M21-VIS-R4B: granica zmiany znaczenia `trade_flow_active` (silnik < 3:
 * ilość oceniona; silnik >= 3: ilość dostarczona). Próg istotności
 * `trade_route` nigdy nie jest liczony z sumy mieszającej obie miary.
 */

const KEY = "trade_route:connection_1:flour";
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
const tradeFact = (id: string, tick: number, volume: number): SimulationFact => ({
  id,
  tick,
  type: "trade_flow_active",
  subject: { entityType: "connectionGood", entityId: "connection_1:flour" },
  location: { regionId: "region_dest" },
  values: { before: 0, after: volume },
});
const run = (
  registry: ActiveProcessRegistry,
  tick: number,
  facts: SimulationFact[] = [],
) =>
  buildChronicleCandidates({
    facts,
    edges: [],
    architectInfluenceByFactId: new Map(),
    eventTypes,
    currentTick: tick,
    noveltyRegistry: createNoveltyRegistry(),
    activeProcessRegistry: registry,
    tradeRouteSilenceTicks: 6,
  });
/** Otwarty proces w stanie po wczytaniu zapisu (opcjonalnie oznaczony przez migrację v2 -> v3). */
const openProcess = (magnitude: number, legacy: boolean): ActiveProcess => ({
  processKey: KEY,
  processType: "trade_route",
  state: "EMERGING",
  startTick: 0,
  lastSignalTick: 4,
  rootFactId: "fact_legacy_root",
  entryId: undefined,
  accumulatedMagnitude: magnitude,
  ...(legacy ? { magnitudeBasis: "evaluated" as const } : {}),
});
const registryWith = (process: ActiveProcess) =>
  ActiveProcessRegistry.fromState({ processes: [process] });

describe("trade_route at the evaluated → delivered semantic boundary", () => {
  it("only new facts: one homogeneous delivered sum, no legacy marker", () => {
    const registry = new ActiveProcessRegistry();
    run(registry, 0, [tradeFact("f0", 0, 40)]);
    run(registry, 1, [tradeFact("f1", 1, 60)]);
    expect(registry.get(KEY)).toMatchObject({
      accumulatedMagnitude: 100,
      state: "EMERGING",
    });
    expect(registry.get(KEY)!.magnitudeBasis).toBeUndefined();
  });

  it("only old facts: the legacy episode resolves on its own evaluated sum, exactly like the old engine", () => {
    const legacy = run(registryWith(openProcess(700, true)), 11);
    const reference = run(registryWith(openProcess(700, false)), 11);
    expect(legacy).toHaveLength(1);
    expect(legacy[0]!.significance).toEqual(reference[0]!.significance);
    expect(legacy[0]!.factRefs).toEqual(["fact_legacy_root"]); // historia i odniesienia bez zmian
  });

  it("mixed: the first delivered fact closes the legacy episode (evaluated sum only) and starts a fresh delivered one", () => {
    const registry = registryWith(openProcess(700, true));
    const candidates = run(registry, 5, [tradeFact("f_new_5", 5, 3)]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      eventType: "trade_route_emerged",
      aggregationKey: KEY,
      factRefs: ["fact_legacy_root"],
    });
    // Stary epizod oceniony na 700 (ocenione) / skala 2000 -- bez doliczenia 3 (dostarczone).
    expect(candidates[0]!.significance.magnitude).toBe(700 / 2000);
    expect(candidates[0]!.significance.magnitude).not.toBe(703 / 2000);
    // Nowy epizod: tylko ilość dostarczona, bez znacznika, od ticka granicy.
    expect(registry.get(KEY)).toMatchObject({
      state: "EMERGING",
      startTick: 5,
      accumulatedMagnitude: 3,
      rootFactId: "f_new_5",
    });
    expect(registry.get(KEY)!.magnitudeBasis).toBeUndefined();
    // Kolejne dostawy sumują się tylko z dostawami.
    run(registry, 6, [tradeFact("f_new_6", 6, 4)]);
    expect(registry.get(KEY)!.accumulatedMagnitude).toBe(7);
  });

  it("is deterministic and survives getState/fromState (save/load) with the marker intact", () => {
    const once = () => {
      const registry = registryWith(openProcess(700, true));
      const restored = ActiveProcessRegistry.fromState(
        JSON.parse(JSON.stringify(registry.getState())),
      );
      expect(restored.get(KEY)!.magnitudeBasis).toBe("evaluated");
      const candidates = run(restored, 5, [tradeFact("f_new_5", 5, 3)]);
      return { candidates, state: restored.getState() };
    };
    expect(once()).toEqual(once());
  });
});
