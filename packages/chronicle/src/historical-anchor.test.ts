import { describe, expect, it } from "vitest";
import { collectHistoricalAnchorFactIds, shouldBeHistoricalAnchor } from "./historical-anchor.js";
import type { ChronicleEntry, SignificanceBreakdown } from "./types.js";

function significance(category: SignificanceBreakdown["category"], total: number): SignificanceBreakdown {
  return {
    magnitude: 0.5,
    duration: 0.5,
    populationAffected: 0.5,
    geographicScope: 0.5,
    novelty: 0.5,
    causalImpact: 0.5,
    contextualImportance: 0,
    total,
    category,
  };
}

function makeEntry(overrides: Partial<ChronicleEntry> = {}): ChronicleEntry {
  return {
    id: "chronicle_0_0",
    startTick: 0,
    endTick: 0,
    titleKey: "t",
    templateKey: "tpl",
    primaryFactRefs: ["fact_0_0"],
    supportingFactRefs: [],
    causalAnchorRefs: ["fact_0_0"],
    entityRefs: [],
    regionRefs: ["region_1"],
    category: "economy",
    eventType: "regional_boom",
    significance: significance("NOTABLE", 30),
    scope: "REGIONAL",
    architectInfluence: 0,
    turningPoint: false,
    historicalAnchor: false,
    lifecycleState: "EMERGING",
    dataPayload: {},
    ...overrides,
  };
}

describe("shouldBeHistoricalAnchor", () => {
  it("anchors whenever the event type's content policy says always-anchor, regardless of significance", () => {
    expect(shouldBeHistoricalAnchor(makeEntry({ significance: significance("TRACE", 2) }), true)).toBe(true);
  });

  it("anchors a NOTABLE/MAJOR entry that is not content-flagged, only once it reaches HISTORIC+", () => {
    expect(shouldBeHistoricalAnchor(makeEntry({ significance: significance("MAJOR", 50) }), false)).toBe(false);
    expect(shouldBeHistoricalAnchor(makeEntry({ significance: significance("HISTORIC", 70) }), false)).toBe(true);
    expect(shouldBeHistoricalAnchor(makeEntry({ significance: significance("WORLD_DEFINING", 90) }), false)).toBe(
      true,
    );
  });

  it("anchors a flagged Turning Point regardless of significance", () => {
    expect(shouldBeHistoricalAnchor(makeEntry({ turningPoint: true, significance: significance("MINOR", 12) }), false)).toBe(
      true,
    );
  });

  it("anchors a strong Architect-influenced entry regardless of significance", () => {
    expect(
      shouldBeHistoricalAnchor(makeEntry({ architectInfluence: 0.8, significance: significance("MINOR", 12) }), false),
    ).toBe(true);
  });
});

describe("collectHistoricalAnchorFactIds", () => {
  it("collects primary + causal anchor refs only from entries flagged historicalAnchor", () => {
    const anchored = makeEntry({
      id: "e1",
      historicalAnchor: true,
      primaryFactRefs: ["fact_a"],
      causalAnchorRefs: ["fact_b"],
    });
    const notAnchored = makeEntry({
      id: "e2",
      historicalAnchor: false,
      primaryFactRefs: ["fact_c"],
    });
    const ids = collectHistoricalAnchorFactIds([anchored, notAnchored]);
    expect([...ids].sort()).toEqual(["fact_a", "fact_b"]);
  });
});
