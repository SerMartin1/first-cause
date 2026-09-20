import { describe, expect, it } from "vitest";
import { aggregateCandidates } from "./aggregation.js";
import type { ChronicleCandidate, SignificanceBreakdown } from "./types.js";

const SIGNIFICANCE: SignificanceBreakdown = {
  magnitude: 0.2,
  duration: 0.2,
  populationAffected: 0.2,
  geographicScope: 0.2,
  novelty: 0,
  causalImpact: 0,
  contextualImportance: 0,
  total: 20,
  category: "MINOR",
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
    status: "PENDING",
    ...overrides,
  };
}

describe("aggregateCandidates", () => {
  it("publishes a lone candidate with no aggregationKey standalone", () => {
    const candidate = makeCandidate({ id: "c1", tick: 0, aggregationKey: undefined });
    const result = aggregateCandidates([candidate]);
    expect(result.published).toHaveLength(1);
    expect(result.published[0]!.status).toBe("PUBLISHED");
    expect(result.candidateStatusById.get("c1")).toBe("PUBLISHED");
  });

  it("folds multiple candidates sharing the same aggregationKey into one published entry, marking the rest AGGREGATED", () => {
    const a = makeCandidate({ id: "c1", tick: 0 });
    const b = makeCandidate({ id: "c2", tick: 3, factRefs: ["fact_3_0"], causalAnchors: ["fact_3_0"] });
    const c = makeCandidate({ id: "c3", tick: 5, factRefs: ["fact_5_0"], causalAnchors: ["fact_5_0"] });

    const result = aggregateCandidates([a, b, c]);
    expect(result.published).toHaveLength(1);
    const folded = result.published[0]!;
    expect(folded.tick).toBe(5); // last tick in the group
    expect(folded.factRefs).toEqual(["fact_0_0", "fact_3_0", "fact_5_0"]);
    expect(result.candidateStatusById.get(folded.id)).toBe("PUBLISHED");
    const others = [a, b, c].filter((x) => x.id !== folded.id);
    for (const other of others) {
      expect(result.candidateStatusById.get(other.id)).toBe("AGGREGATED");
    }
  });

  it("never merges candidates with different aggregationKeys, even if temporally close and same category (no false aggregation, SS30)", () => {
    const a = makeCandidate({ id: "c1", tick: 0, aggregationKey: "company_founded:region:region_1:0" });
    const b = makeCandidate({ id: "c2", tick: 1, aggregationKey: "company_founded:region:region_2:0" });

    const result = aggregateCandidates([a, b]);
    expect(result.published).toHaveLength(2);
    expect(result.candidateStatusById.get("c1")).toBe("PUBLISHED");
    expect(result.candidateStatusById.get("c2")).toBe("PUBLISHED");
  });
});
