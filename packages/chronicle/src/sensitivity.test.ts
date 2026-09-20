import { describe, expect, it } from "vitest";
import { filterBySensitivity, passesSensitivity } from "./sensitivity.js";
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

function makeEntry(id: string, total: number, turningPoint = false): ChronicleEntry {
  return {
    id,
    startTick: 0,
    endTick: 0,
    titleKey: "t",
    templateKey: "tpl",
    primaryFactRefs: [],
    supportingFactRefs: [],
    causalAnchorRefs: [],
    entityRefs: [],
    regionRefs: [],
    category: "economy",
    eventType: "regional_boom",
    significance: significance(total),
    scope: "REGIONAL",
    architectInfluence: 0,
    turningPoint,
    historicalAnchor: false,
    lifecycleState: "EMERGING",
    dataPayload: {},
  };
}

describe("passesSensitivity", () => {
  it("gates on significance.total against the documented thresholds", () => {
    expect(passesSensitivity(makeEntry("e", 24), "DETAILED")).toBe(false);
    expect(passesSensitivity(makeEntry("e", 25), "DETAILED")).toBe(true);
    expect(passesSensitivity(makeEntry("e", 39), "STANDARD")).toBe(false);
    expect(passesSensitivity(makeEntry("e", 40), "STANDARD")).toBe(true);
    expect(passesSensitivity(makeEntry("e", 59), "CONCISE")).toBe(false);
    expect(passesSensitivity(makeEntry("e", 60), "CONCISE")).toBe(true);
  });

  it("always passes a flagged Turning Point, even under CONCISE with a low score", () => {
    expect(passesSensitivity(makeEntry("e", 5, true), "CONCISE")).toBe(true);
  });
});

describe("filterBySensitivity", () => {
  it("never mutates or clones the entries it keeps (identity preserved)", () => {
    const entry = makeEntry("e1", 50);
    const [kept] = filterBySensitivity([entry], "STANDARD");
    expect(kept).toBe(entry);
  });

  it("DETAILED is a superset of STANDARD which is a superset of CONCISE for the same entry set", () => {
    const entries = [makeEntry("e1", 20), makeEntry("e2", 35), makeEntry("e3", 50), makeEntry("e4", 70)];
    const concise = filterBySensitivity(entries, "CONCISE").map((e) => e.id);
    const standard = filterBySensitivity(entries, "STANDARD").map((e) => e.id);
    const detailed = filterBySensitivity(entries, "DETAILED").map((e) => e.id);
    for (const id of concise) expect(standard).toContain(id);
    for (const id of standard) expect(detailed).toContain(id);
  });
});
