import { describe, expect, it } from "vitest";
import { DefinitionRegistry, type ChronicleTemplateDefinition } from "@first-cause/content";
import { findTemplateForEventType, getChronicle, getEntityHistory, getWhyItMattered } from "./chronicle-api.js";
import type { ChronicleEntry, SignificanceBreakdown } from "./types.js";

function significance(total: number): SignificanceBreakdown {
  return {
    magnitude: 0.5,
    duration: 0.5,
    populationAffected: 0.5,
    geographicScope: 0.5,
    novelty: 0.5,
    causalImpact: 0.5,
    contextualImportance: 0,
    total,
    category: "NOTABLE",
  };
}

function makeEntry(overrides: Partial<ChronicleEntry> & Pick<ChronicleEntry, "id">): ChronicleEntry {
  return {
    startTick: 0,
    endTick: 0,
    titleKey: "t",
    templateKey: "tpl",
    primaryFactRefs: [],
    supportingFactRefs: [],
    causalAnchorRefs: [],
    entityRefs: [],
    regionRefs: ["region_1"],
    category: "economy",
    eventType: "regional_boom",
    significance: significance(50),
    scope: "REGIONAL",
    architectInfluence: 0,
    turningPoint: false,
    historicalAnchor: false,
    lifecycleState: "EMERGING",
    dataPayload: {},
    ...overrides,
  };
}

describe("getChronicle", () => {
  it("applies sensitivity, then category/entity/region filters together (AND, not OR)", () => {
    const matching = makeEntry({
      id: "match",
      significance: significance(50),
      category: "economy",
      regionRefs: ["region_1"],
      entityRefs: [{ entityType: "company", entityId: "co_1" }],
    });
    const wrongCategory = makeEntry({ id: "wrong_cat", category: "company" });
    const belowThreshold = makeEntry({ id: "low", significance: significance(1) });

    const result = getChronicle([matching, wrongCategory, belowThreshold], "STANDARD", {
      category: "economy",
      regionId: "region_1",
    });
    expect(result.map((e) => e.id)).toEqual(["match"]);
  });
});

describe("getEntityHistory", () => {
  it("returns entries for the entity regardless of sensitivity threshold (SS60 Contextual Promotion)", () => {
    const belowGlobalThreshold = makeEntry({
      id: "local_only",
      significance: significance(5),
      entityRefs: [{ entityType: "settlement", entityId: "riverside" }],
    });
    const unrelated = makeEntry({ id: "unrelated", entityRefs: [{ entityType: "settlement", entityId: "lakeview" }] });

    const result = getEntityHistory([belowGlobalThreshold, unrelated], "riverside");
    expect(result.map((e) => e.id)).toEqual(["local_only"]);
  });

  it("sorts chronologically by startTick", () => {
    const later = makeEntry({ id: "later", startTick: 10, entityRefs: [{ entityType: "x", entityId: "e" }] });
    const earlier = makeEntry({ id: "earlier", startTick: 2, entityRefs: [{ entityType: "x", entityId: "e" }] });
    expect(getEntityHistory([later, earlier], "e").map((e) => e.id)).toEqual(["earlier", "later"]);
  });
});

describe("getWhyItMattered", () => {
  it("surfaces significance/scope/turningPoint/historicalAnchor, nothing causal", () => {
    const entry = makeEntry({ id: "e", turningPoint: true, historicalAnchor: true });
    const result = getWhyItMattered(entry);
    expect(result).toEqual({
      significance: entry.significance,
      scope: entry.scope,
      turningPoint: true,
      historicalAnchor: true,
    });
  });
});

describe("findTemplateForEventType", () => {
  it("finds the template whose factOrEventType matches, and undefined when none does", () => {
    const template: ChronicleTemplateDefinition = {
      id: "settlement_stage_changed_default",
      factOrEventType: "settlement_stage_changed",
      titleKey: "content.chronicleTemplate.settlement_stage_changed_default.title",
      bodyKey: "content.chronicleTemplate.settlement_stage_changed_default.body",
      requiredData: [],
      variants: {},
      implementationPhase: "VS",
    };
    const registry = DefinitionRegistry.fromDefinitions<ChronicleTemplateDefinition>([template]);
    expect(findTemplateForEventType(registry, "settlement_stage_changed")?.id).toBe(
      "settlement_stage_changed_default",
    );
    expect(findTemplateForEventType(registry, "no_such_event_type")).toBeUndefined();
  });
});
