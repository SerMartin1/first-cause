import { describe, expect, it } from "vitest";
import type { SimulationFact } from "@first-cause/causality";
import { DefinitionRegistry, type EventTypeDefinition } from "@first-cause/content";
import { buildInterventionConsequenceCandidates } from "./intervention-legacy.js";

function makeFact(overrides: Partial<SimulationFact> & Pick<SimulationFact, "id" | "type">): SimulationFact {
  return {
    tick: 10,
    subject: { entityType: "company", entityId: "co_1" },
    location: { regionId: "region_1" },
    values: { before: 0, after: 1 },
    ...overrides,
  };
}

function makeEventType(overrides: Partial<EventTypeDefinition> = {}): EventTypeDefinition {
  return {
    id: "intervention_major_consequence",
    nameKey: "content.eventType.intervention_major_consequence.name",
    category: "architect",
    baseSignificance: 30,
    candidateThreshold: 20,
    aggregationPolicy: { windowTicks: 1, scope: "entity" },
    noveltyPolicy: { tracksFirst: false, scope: "world" },
    durationPolicy: "STRUCTURAL",
    anchorPolicy: { alwaysAnchor: true },
    implementationPhase: "VS",
    ...overrides,
  };
}

describe("buildInterventionConsequenceCandidates", () => {
  it("returns nothing when the intervention_major_consequence EventTypeDefinition is not loaded", () => {
    const candidates = buildInterventionConsequenceCandidates({
      interventionId: "intervention_1",
      interventionRootFactId: "fact_root",
      newMajorConsequences: [{ fact: makeFact({ id: "fact_a", type: "company_founded" }), effectScore: 0.9, causalDepth: 3 }],
      eventTypes: DefinitionRegistry.fromDefinitions<EventTypeDefinition>([]),
      currentTick: 100,
    });
    expect(candidates).toEqual([]);
  });

  it("produces one candidate per new major consequence, anchored on both the intervention root and the consequence fact", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([makeEventType()]);
    const candidates = buildInterventionConsequenceCandidates({
      interventionId: "intervention_1",
      interventionRootFactId: "fact_root",
      newMajorConsequences: [
        { fact: makeFact({ id: "fact_a", type: "company_founded" }), effectScore: 0.9, causalDepth: 3 },
        { fact: makeFact({ id: "fact_b", type: "settlement_stage_changed" }), effectScore: 0.85, causalDepth: 5 },
      ],
      eventTypes,
      currentTick: 100,
    });
    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({
      eventType: "intervention_major_consequence",
      factRefs: ["fact_a"],
      causalAnchors: ["fact_root", "fact_a"],
      architectInfluence: 0.9,
    });
  });

  it("drops a consequence whose effectScore is too weak to clear candidateThreshold", () => {
    const eventTypes = DefinitionRegistry.fromDefinitions<EventTypeDefinition>([
      makeEventType({ candidateThreshold: 99, baseSignificance: 0 }),
    ]);
    const candidates = buildInterventionConsequenceCandidates({
      interventionId: "intervention_1",
      interventionRootFactId: "fact_root",
      newMajorConsequences: [{ fact: makeFact({ id: "fact_a", type: "company_founded" }), effectScore: 0.1, causalDepth: 1 }],
      eventTypes,
      currentTick: 100,
    });
    expect(candidates).toEqual([]);
  });
});
