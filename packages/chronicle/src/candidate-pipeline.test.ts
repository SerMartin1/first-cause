import { describe, expect, it } from "vitest";
import type { CausalEdge, SimulationFact } from "@first-cause/causality";
import { DefinitionRegistry, type EventTypeDefinition } from "@first-cause/content";
import { createActiveProcessRegistry } from "./active-process-registry.js";
import { buildChronicleCandidates } from "./candidate-pipeline.js";
import { createNoveltyRegistry } from "./novelty-registry.js";

function makeFact(overrides: Partial<SimulationFact> & Pick<SimulationFact, "id" | "type" | "tick">): SimulationFact {
  return {
    subject: { entityType: "resourceDeposit", entityId: "deposit_1" },
    location: { regionId: "region_1" },
    values: { before: 0, after: 100 },
    ...overrides,
  };
}

function makeEventType(overrides: Partial<EventTypeDefinition> & Pick<EventTypeDefinition, "id">): EventTypeDefinition {
  return {
    nameKey: `content.eventType.${overrides.id}.name`,
    category: "resources",
    baseSignificance: 20,
    candidateThreshold: 15,
    aggregationPolicy: { windowTicks: 1, scope: "entity" },
    noveltyPolicy: { tracksFirst: false, scope: "world" },
    durationPolicy: "INSTANTANEOUS",
    anchorPolicy: { alwaysAnchor: false },
    implementationPhase: "VS",
    ...overrides,
  };
}

const EMPTY_EDGES: readonly CausalEdge[] = [];
const EMPTY_INFLUENCE = new Map<string, number>();

describe("buildChronicleCandidates", () => {
  it("produces no candidate for a fact type with no EventTypeDefinition mapping", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([]);
    const candidates = buildChronicleCandidates({
      facts: [makeFact({ id: "fact_0_0", type: "price_changed", tick: 0 })],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry: createActiveProcessRegistry(),
    });
    expect(candidates).toEqual([]);
  });

  it("produces a PENDING candidate for a mapped, above-threshold fact", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ id: "resource_discovered", candidateThreshold: 5 }),
    ]);
    const candidates = buildChronicleCandidates({
      facts: [makeFact({ id: "fact_0_0", type: "resource_discovered", tick: 0 })],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry: createActiveProcessRegistry(),
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      eventType: "resource_discovered",
      status: "PENDING",
      factRefs: ["fact_0_0"],
    });
  });

  it("filters out a fact whose computed significance stays below candidateThreshold", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ id: "resource_discovered", baseSignificance: 0, candidateThreshold: 99 }),
    ]);
    const candidates = buildChronicleCandidates({
      facts: [makeFact({ id: "fact_0_0", type: "resource_discovered", tick: 0, values: { before: 0, after: 0 } })],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry: createActiveProcessRegistry(),
    });
    expect(candidates).toEqual([]);
  });

  it("marks only the first occurrence in a tracked novelty scope as isFirstOccurrence", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({
        id: "discovery_occurred",
        candidateThreshold: 1,
        noveltyPolicy: { tracksFirst: true, scope: "world" },
      }),
    ]);
    const noveltyRegistry = createNoveltyRegistry();
    const first = buildChronicleCandidates({
      facts: [makeFact({ id: "fact_0_0", type: "discovery_occurred", tick: 0 })],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry,
      activeProcessRegistry: createActiveProcessRegistry(),
    });
    const second = buildChronicleCandidates({
      facts: [makeFact({ id: "fact_1_0", type: "discovery_occurred", tick: 1 })],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 1,
      noveltyRegistry,
      activeProcessRegistry: createActiveProcessRegistry(),
    });
    expect(first[0]?.isFirstOccurrence).toBe(true);
    expect(second[0]?.isFirstOccurrence).toBe(false);
  });

  it("subjectKeyed novelty: first adoption of EACH technology in the world, not only the first technology event", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({
        id: "technology_adoption_wave",
        category: "technology",
        candidateThreshold: 1,
        noveltyPolicy: { tracksFirst: true, scope: "world", subjectKeyed: true },
      }),
    ]);
    const noveltyRegistry = createNoveltyRegistry();
    const adopt = (id: string, discoveryId: string, regionId: string, tick: number) =>
      buildChronicleCandidates({
        facts: [
          makeFact({
            id,
            type: "technology_adoption_increased",
            tick,
            subject: { entityType: "discovery", entityId: discoveryId },
            location: { regionId },
          }),
        ],
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: tick,
        noveltyRegistry,
        activeProcessRegistry: createActiveProcessRegistry(),
      })[0]?.isFirstOccurrence;
    expect(adopt("f1", "mec_004", "region_1", 0)).toBe(true);
    expect(adopt("f2", "agr_003", "region_1", 1)).toBe(true); // inna technologia -- też pierwsza w świecie
    expect(adopt("f3", "mec_004", "region_2", 2)).toBe(false); // ta sama technologia w innym regionie
  });

  it("a strong outgoing causal edge raises significance enough to clear a threshold a bare fact would miss", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ id: "resource_discovered", baseSignificance: 0, candidateThreshold: 25 }),
    ]);
    const fact = makeFact({ id: "fact_0_0", type: "resource_discovered", tick: 0, values: { before: 0, after: 0 } });

    const withoutEdges = buildChronicleCandidates({
      facts: [fact],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry: createActiveProcessRegistry(),
    });
    const strongEdge: CausalEdge = {
      id: "edge_1",
      sourceFactId: "fact_0_0",
      targetFactId: "fact_0_1",
      type: "TRIGGERING",
      strength: 1,
      contribution: 1,
      mechanism: "test",
      system: "test",
      variable: "test",
    };
    const withEdges = buildChronicleCandidates({
      facts: [fact],
      edges: [strongEdge, { ...strongEdge, id: "edge_2", targetFactId: "fact_0_2" }],
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry: createActiveProcessRegistry(),
    });

    expect(withoutEdges).toEqual([]);
    expect(withEdges).toHaveLength(1);
  });

  it("opens a shortage active process and does not resolve it while renewed within the silence window", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ id: "shortage_started", category: "resources", candidateThreshold: 1 }),
      makeEventType({ id: "shortage_resolved", category: "resources", candidateThreshold: 1, baseSignificance: 10 }),
    ]);
    const activeProcessRegistry = createActiveProcessRegistry();
    const shortageFact = makeFact({
      id: "fact_0_0",
      type: "shortage_started",
      tick: 0,
      subject: { entityType: "marketGood", entityId: "market_1:grain" },
      values: { before: 0, after: 1 },
    });

    buildChronicleCandidates({
      facts: [shortageFact],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
      shortageResolutionSilenceTicks: 6,
    });
    expect(activeProcessRegistry.get("shortage:region_1:market_1:grain")?.state).toBe("EMERGING");

    // Renewal at tick 4 (< 6 ticks silence) keeps it open.
    const renewalCandidates = buildChronicleCandidates({
      facts: [{ ...shortageFact, id: "fact_4_0", tick: 4 }],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 4,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
      shortageResolutionSilenceTicks: 6,
    });
    expect(renewalCandidates.some((c) => c.eventType === "shortage_resolved")).toBe(false);
    expect(activeProcessRegistry.get("shortage:region_1:market_1:grain")?.state).toBe("EMERGING");

    // No further renewal: by tick 11 (7 ticks since last signal at 4) it resolves.
    const resolutionCandidates = buildChronicleCandidates({
      facts: [],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 11,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
      shortageResolutionSilenceTicks: 6,
    });
    expect(resolutionCandidates).toHaveLength(1);
    expect(resolutionCandidates[0]).toMatchObject({ eventType: "shortage_resolved", regionRefs: ["region_1"] });
    expect(activeProcessRegistry.get("shortage:region_1:market_1:grain")?.state).toBe("RESOLVED");
  });

  it("maps resource_reserve_milestone facts to resource_depletion_milestone candidates", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ id: "resource_depletion_milestone", candidateThreshold: 5 }),
    ]);
    const candidates = buildChronicleCandidates({
      facts: [
        makeFact({
          id: "fact_0_0",
          type: "resource_reserve_milestone",
          tick: 0,
          values: { before: 1, after: 0.75 },
        }),
      ],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry: createActiveProcessRegistry(),
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ eventType: "resource_depletion_milestone" });
  });

  it("maps technology_adoption_increased facts to technology_adoption_wave, folding repeated ticks of the SAME discovery via CH-04 but never merging a different discovery in (SS30 no false aggregation)", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({
        id: "technology_adoption_wave",
        category: "technology",
        candidateThreshold: 5,
        aggregationPolicy: { windowTicks: 12, scope: "entity" },
      }),
    ]);
    const noveltyRegistry = createNoveltyRegistry();
    const activeProcessRegistry = createActiveProcessRegistry();

    const tick0 = buildChronicleCandidates({
      facts: [
        makeFact({
          id: "fact_0_0",
          type: "technology_adoption_increased",
          tick: 0,
          subject: { entityType: "discovery", entityId: "iron_working" },
          values: { before: 0, after: 0.1 },
        }),
        makeFact({
          id: "fact_0_1",
          type: "technology_adoption_increased",
          tick: 0,
          subject: { entityType: "discovery", entityId: "watermill_milling" },
          values: { before: 0, after: 0.1 },
        }),
      ],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry,
      activeProcessRegistry,
    });
    const tick4 = buildChronicleCandidates({
      facts: [
        makeFact({
          id: "fact_4_0",
          type: "technology_adoption_increased",
          tick: 4,
          subject: { entityType: "discovery", entityId: "iron_working" },
          values: { before: 0.1, after: 0.2 },
        }),
      ],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 4,
      noveltyRegistry,
      activeProcessRegistry,
    });

    const allByEventType = [...tick0, ...tick4].filter((c) => c.eventType === "technology_adoption_wave");
    const ironWorkingKeys = new Set(allByEventType.filter((c) => c.entityRefs.some((r) => r.entityId === "iron_working")).map((c) => c.aggregationKey));
    const watermillKeys = new Set(allByEventType.filter((c) => c.entityRefs.some((r) => r.entityId === "watermill_milling")).map((c) => c.aggregationKey));
    // Same discovery, same 12-tick window: both ticks share one aggregationKey.
    expect(ironWorkingKeys.size).toBe(1);
    // Different discovery: never shares iron_working's key, even in the same region/window.
    for (const key of watermillKeys) expect(ironWorkingKeys.has(key)).toBe(false);
  });

  it("migration_wave: accumulates population_migrated_in across renewals and only emits a candidate once resolved (silence)", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ id: "migration_wave", category: "migration", candidateThreshold: 5, baseSignificance: 25 }),
    ]);
    const activeProcessRegistry = createActiveProcessRegistry();
    const migrationFact = (id: string, tick: number, migrants: number) =>
      makeFact({
        id,
        type: "population_migrated_in",
        tick,
        subject: { entityType: "populationCohort", entityId: "cohort_dest" },
        location: { regionId: "region_1", settlementId: "riverside" },
        values: { before: 0, after: migrants },
      });

    const tick0 = buildChronicleCandidates({
      facts: [migrationFact("fact_0_0", 0, 400)],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
      migrationWaveSilenceTicks: 6,
    });
    expect(tick0.some((c) => c.eventType === "migration_wave")).toBe(false); // no candidate yet -- still open
    expect(activeProcessRegistry.get("migration_wave:region_1:riverside")?.accumulatedMagnitude).toBe(400);

    const tick3 = buildChronicleCandidates({
      facts: [migrationFact("fact_3_0", 3, 200)],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 3,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
      migrationWaveSilenceTicks: 6,
    });
    expect(tick3.some((c) => c.eventType === "migration_wave")).toBe(false);
    expect(activeProcessRegistry.get("migration_wave:region_1:riverside")?.accumulatedMagnitude).toBe(600);

    // Silence for 7 ticks (> 6) since the last signal at tick 3 -> resolves.
    const tick10 = buildChronicleCandidates({
      facts: [],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 10,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
      migrationWaveSilenceTicks: 6,
    });
    expect(tick10).toHaveLength(1);
    expect(tick10[0]).toMatchObject({ eventType: "migration_wave", scope: "SETTLEMENT", regionRefs: ["region_1"] });
    expect(activeProcessRegistry.get("migration_wave:region_1:riverside")?.state).toBe("RESOLVED");
  });

  it("migration_wave: uses ChronicleContext.regionPopulation to normalize magnitude when supplied", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ id: "migration_wave", category: "migration", candidateThreshold: 1, baseSignificance: 0 }),
    ]);
    const activeProcessRegistry = createActiveProcessRegistry();
    const migrationFact = makeFact({
      id: "fact_0_0",
      type: "population_migrated_in",
      tick: 0,
      subject: { entityType: "populationCohort", entityId: "cohort_dest" },
      location: { regionId: "small_region" },
      values: { before: 0, after: 350 }, // 350 / 700 population = 50% -> saturates magnitude to 1 at ratio 0.5
    });
    buildChronicleCandidates({
      facts: [migrationFact],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
    });
    const resolved = buildChronicleCandidates({
      facts: [],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 20,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
      migrationWaveSilenceTicks: 6,
      context: { regionPopulation: (regionId) => (regionId === "small_region" ? 700 : undefined) },
    });
    expect(resolved).toHaveLength(1);
    expect(resolved[0]!.significance.magnitude).toBe(1);
  });

  it("migration_wave: findExceedingDuration force-resolves a process kept alive by continuous renewal", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ id: "migration_wave", category: "migration", candidateThreshold: 1, baseSignificance: 30 }),
    ]);
    const activeProcessRegistry = createActiveProcessRegistry();
    const migrationFact = (id: string, tick: number) =>
      makeFact({
        id,
        type: "population_migrated_in",
        tick,
        subject: { entityType: "populationCohort", entityId: "cohort_dest" },
        location: { regionId: "region_1" },
        values: { before: 0, after: 10 },
      });

    // Renew every 5 ticks so it never goes silent, but let max duration (30) cap it.
    const allCandidates: ReturnType<typeof buildChronicleCandidates>[number][] = [];
    for (let tick = 0; tick <= 35; tick += 5) {
      const candidates = buildChronicleCandidates({
        facts: [migrationFact(`fact_${tick}_0`, tick)],
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: tick,
        noveltyRegistry: createNoveltyRegistry(),
        activeProcessRegistry,
        migrationWaveSilenceTicks: 100, // never silent within this test
        migrationWaveMaxDurationTicks: 30,
      });
      allCandidates.push(...candidates);
    }
    expect(allCandidates.some((c) => c.eventType === "migration_wave")).toBe(true);
  });

  it("trade_route_emerged: accumulates trade_flow_active volume and, once resolved, keeps merging later episodes into the SAME entry via a stable aggregationKey", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ id: "trade_route_emerged", category: "trade", candidateThreshold: 5, baseSignificance: 30 }),
    ]);
    const activeProcessRegistry = createActiveProcessRegistry();
    const tradeFact = (id: string, tick: number, volume: number) =>
      makeFact({
        id,
        type: "trade_flow_active",
        tick,
        subject: { entityType: "connectionGood", entityId: "connection_1:flour" },
        location: { regionId: "region_dest" },
        values: { before: 0, after: volume },
      });

    buildChronicleCandidates({
      facts: [tradeFact("fact_0_0", 0, 500)],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 0,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
    });
    // Silence for > 6 ticks -> first episode resolves.
    const firstResolution = buildChronicleCandidates({
      facts: [],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 10,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
      tradeRouteSilenceTicks: 6,
    });
    expect(firstResolution).toHaveLength(1);
    expect(firstResolution[0]!.aggregationKey).toBe("trade_route:connection_1:flour");

    // Trade resumes and resolves again later -- same (connection, good) key.
    buildChronicleCandidates({
      facts: [tradeFact("fact_20_0", 20, 800)],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 20,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
    });
    const secondResolution = buildChronicleCandidates({
      facts: [],
      edges: EMPTY_EDGES,
      architectInfluenceByFactId: EMPTY_INFLUENCE,
      eventTypes,
      currentTick: 30,
      noveltyRegistry: createNoveltyRegistry(),
      activeProcessRegistry,
      tradeRouteSilenceTicks: 6,
    });
    expect(secondResolution).toHaveLength(1);
    // Same aggregationKey as the first episode -- chronicle-entry-store.ts folds them into one entry.
    expect(secondResolution[0]!.aggregationKey).toBe(firstResolution[0]!.aggregationKey);
  });

  describe("regional_boom / regional_bust", () => {
    const boomBustEventTypes = () =>
      DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
        makeEventType({ id: "regional_boom", category: "economy", candidateThreshold: 5, baseSignificance: 30 }),
        makeEventType({ id: "regional_bust", category: "economy", candidateThreshold: 5, baseSignificance: 30 }),
      ]);
    const employmentFact = (id: string, tick: number, regionId: string, before: number, after: number) =>
      makeFact({
        id,
        type: "employment_changed",
        tick,
        subject: { entityType: "company", entityId: "co_1" },
        location: { regionId },
        values: { before, after },
      });
    const context = { regionPopulation: (regionId: string) => (regionId === "region_1" ? 1000 : undefined) };

    it("a sustained positive employment trend resolves as regional_boom, not regional_bust", () => {
      const eventTypes = boomBustEventTypes();
      const activeProcessRegistry = createActiveProcessRegistry();
      buildChronicleCandidates({
        facts: [employmentFact("fact_0_0", 0, "region_1", 0, 400)], // +400/1000 population = strong positive pulse
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: 0,
        noveltyRegistry: createNoveltyRegistry(),
        activeProcessRegistry,
        context,
      });
      const resolved = buildChronicleCandidates({
        facts: [],
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: 10,
        noveltyRegistry: createNoveltyRegistry(),
        activeProcessRegistry,
        regionalPulseSilenceTicks: 6,
        context,
      });
      expect(resolved).toHaveLength(1);
      expect(resolved[0]).toMatchObject({ eventType: "regional_boom", regionRefs: ["region_1"] });
    });

    it("a sustained negative employment trend resolves as regional_bust, not regional_boom", () => {
      const eventTypes = boomBustEventTypes();
      const activeProcessRegistry = createActiveProcessRegistry();
      buildChronicleCandidates({
        facts: [employmentFact("fact_0_0", 0, "region_1", 400, 0)], // -400/1000 population
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: 0,
        noveltyRegistry: createNoveltyRegistry(),
        activeProcessRegistry,
        context,
      });
      const resolved = buildChronicleCandidates({
        facts: [],
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: 10,
        noveltyRegistry: createNoveltyRegistry(),
        activeProcessRegistry,
        regionalPulseSilenceTicks: 6,
        context,
      });
      expect(resolved).toHaveLength(1);
      expect(resolved[0]).toMatchObject({ eventType: "regional_bust", regionRefs: ["region_1"] });
    });

    it("a pulse that nets out to exactly 0 fires neither event (SS103 silence is valid)", () => {
      const eventTypes = boomBustEventTypes();
      const activeProcessRegistry = createActiveProcessRegistry();
      buildChronicleCandidates({
        facts: [
          employmentFact("fact_0_0", 0, "region_1", 0, 100),
          employmentFact("fact_0_1", 0, "region_1", 100, 0),
        ],
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: 0,
        noveltyRegistry: createNoveltyRegistry(),
        activeProcessRegistry,
        context,
      });
      const resolved = buildChronicleCandidates({
        facts: [],
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: 10,
        noveltyRegistry: createNoveltyRegistry(),
        activeProcessRegistry,
        regionalPulseSilenceTicks: 6,
        context,
      });
      expect(resolved).toEqual([]);
    });

    it("a weak, below-threshold pulse produces no candidate at all", () => {
      const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
        makeEventType({ id: "regional_boom", category: "economy", candidateThreshold: 99, baseSignificance: 0 }),
        makeEventType({ id: "regional_bust", category: "economy", candidateThreshold: 99, baseSignificance: 0 }),
      ]);
      const activeProcessRegistry = createActiveProcessRegistry();
      buildChronicleCandidates({
        facts: [employmentFact("fact_0_0", 0, "region_1", 0, 1)], // negligible relative to population 1000
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: 0,
        noveltyRegistry: createNoveltyRegistry(),
        activeProcessRegistry,
        context,
      });
      const resolved = buildChronicleCandidates({
        facts: [],
        edges: EMPTY_EDGES,
        architectInfluenceByFactId: EMPTY_INFLUENCE,
        eventTypes,
        currentTick: 10,
        noveltyRegistry: createNoveltyRegistry(),
        activeProcessRegistry,
        regionalPulseSilenceTicks: 6,
        context,
      });
      expect(resolved).toEqual([]);
    });
  });
});
