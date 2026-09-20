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
});
