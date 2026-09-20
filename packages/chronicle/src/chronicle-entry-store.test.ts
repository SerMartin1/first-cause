import { describe, expect, it } from "vitest";
import { createChronicleEntryStore } from "./chronicle-entry-store.js";
import type { ChronicleCandidate, SignificanceBreakdown } from "./types.js";

const SIGNIFICANCE: SignificanceBreakdown = {
  magnitude: 0.3,
  duration: 0.3,
  populationAffected: 0.3,
  geographicScope: 0.3,
  novelty: 0,
  causalImpact: 0,
  contextualImportance: 0,
  total: 30,
  category: "NOTABLE",
};

function makeCandidate(overrides: Partial<ChronicleCandidate> & Pick<ChronicleCandidate, "id" | "tick">): ChronicleCandidate {
  return {
    factRefs: [`fact_${overrides.tick}_0`],
    entityRefs: [{ entityType: "company", entityId: "co_1" }],
    regionRefs: ["region_1"],
    eventType: "company_founded",
    category: "company",
    significance: SIGNIFICANCE,
    isFirstOccurrence: false,
    scope: "REGIONAL",
    durationState: "SHORT",
    causalAnchors: [`fact_${overrides.tick}_0`],
    architectInfluence: 0,
    aggregationKey: "company_founded:region:region_1:0",
    status: "PUBLISHED",
    ...overrides,
  };
}

const PRESENTATION = { titleKey: "t", templateKey: "company_founded_default", dataPayload: {} };

describe("ChronicleEntryStore", () => {
  it("creates a new entry when the aggregationKey has never been seen", () => {
    const store = createChronicleEntryStore();
    const entry = store.upsert(makeCandidate({ id: "c1", tick: 0 }), PRESENTATION);
    expect(entry.startTick).toBe(0);
    expect(entry.endTick).toBe(0);
    expect(entry.lifecycleState).toBe("EMERGING");
    expect(store.size).toBe(1);
  });

  it("folds a later candidate sharing the same aggregationKey into the existing entry instead of duplicating it (SS64)", () => {
    const store = createChronicleEntryStore();
    const first = store.upsert(makeCandidate({ id: "c1", tick: 0 }), PRESENTATION);
    const second = store.upsert(
      makeCandidate({ id: "c2", tick: 4, factRefs: ["fact_4_0"], causalAnchors: ["fact_4_0"] }),
      PRESENTATION,
    );
    expect(second.id).toBe(first.id);
    expect(store.size).toBe(1);
    expect(second.endTick).toBe(4);
    expect(second.supportingFactRefs).toEqual(["fact_4_0"]);
    expect(second.lifecycleState).toBe("ONGOING");
  });

  it("creates a separate entry when a candidate has no aggregationKey", () => {
    const store = createChronicleEntryStore();
    store.upsert(makeCandidate({ id: "c1", tick: 0, aggregationKey: undefined }), PRESENTATION);
    store.upsert(makeCandidate({ id: "c2", tick: 1, aggregationKey: undefined }), PRESENTATION);
    expect(store.size).toBe(2);
  });

  it("markHistoricalAnchor/markTurningPoint revise flags without touching fact refs (SS65)", () => {
    const store = createChronicleEntryStore();
    const entry = store.upsert(makeCandidate({ id: "c1", tick: 0 }), PRESENTATION);
    store.markHistoricalAnchor(entry.id, true);
    store.markTurningPoint(entry.id, true);
    const updated = store.get(entry.id)!;
    expect(updated.historicalAnchor).toBe(true);
    expect(updated.turningPoint).toBe(true);
    expect(updated.primaryFactRefs).toEqual(entry.primaryFactRefs);
  });
});
