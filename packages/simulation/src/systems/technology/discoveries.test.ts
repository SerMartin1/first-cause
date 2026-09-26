import { describe, expect, it } from "vitest";
import { createTechnologyState, setDiscoveryState, setDomainKnowledge } from "@first-cause/entities";
import { createWorldRng, type RngStream } from "../../core/rng.js";
import {
  availableTechnologyTier,
  computeEligibleDiscoveryIds,
  detectTierReached,
  evaluateBreakthroughs,
  updateEligibility,
  type DiscoveryEligibilityRule,
} from "./discoveries.js";

function testRng(seed: string): RngStream {
  return createWorldRng(seed).stream("discovery");
}

function discoveryRule(
  overrides: Partial<DiscoveryEligibilityRule>,
): DiscoveryEligibilityRule {
  return {
    primaryDomainId: "agriculture_food",
    tier: 1,
    prerequisites: [],
    ...overrides,
  };
}

describe("computeEligibleDiscoveryIds (discovery eligibility test)", () => {
  it("excludes a discovery when regional knowledge is below its tier's threshold", () => {
    const technologyState = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      5, // próg dla T1 to 10
    );
    const discoveries = { d1: discoveryRule({ tier: 1 }) };

    expect(computeEligibleDiscoveryIds(technologyState, discoveries)).toEqual([]);
  });

  it("includes a discovery once knowledge meets its tier's threshold", () => {
    const technologyState = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      10,
    );
    const discoveries = { d1: discoveryRule({ tier: 1 }) };

    expect(computeEligibleDiscoveryIds(technologyState, discoveries)).toEqual(["d1"]);
  });

  it("gates on prerequisites regardless of knowledge (a region without the required knowledge chain never becomes eligible)", () => {
    let technologyState = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      100,
    );
    const discoveries = {
      a: discoveryRule({ tier: 0 }),
      b: discoveryRule({ tier: 0, prerequisites: ["a"] }),
    };

    expect(computeEligibleDiscoveryIds(technologyState, discoveries)).toEqual(["a"]);

    technologyState = setDiscoveryState(technologyState, "a", { status: "KNOWN" });
    expect(computeEligibleDiscoveryIds(technologyState, discoveries)).toEqual(["a", "b"]);
  });
});

describe("updateEligibility", () => {
  it("emits discovery_became_eligible only for newly-eligible, still-UNKNOWN discoveries, and does not re-fire on the next tick", () => {
    const technologyState = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      10,
    );
    const discoveries = { d1: discoveryRule({ tier: 1 }) };

    const first = updateEligibility(technologyState, discoveries);
    expect(first.facts).toEqual([
      {
        type: "discovery_became_eligible",
        subject: { entityType: "discovery", entityId: "d1" },
        location: { regionId: "r1" },
        values: { before: false, after: true },
      },
    ]);
    expect(first.technologyState.eligibleDiscoveryIds).toEqual(["d1"]);

    const second = updateEligibility(first.technologyState, discoveries);
    expect(second.facts).toEqual([]);
  });

  it("does not emit for a discovery that is already KNOWN", () => {
    let technologyState = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      10,
    );
    technologyState = setDiscoveryState(technologyState, "d1", { status: "KNOWN" });
    const discoveries = { d1: discoveryRule({ tier: 1 }) };

    const result = updateEligibility(technologyState, discoveries);
    expect(result.facts).toEqual([]);
    expect(result.technologyState.eligibleDiscoveryIds).toEqual(["d1"]);
  });
});

describe("evaluateBreakthroughs", () => {
  it("never triggers a discovery that never entered the eligible cache (region without required knowledge cannot discover)", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    // eligibleDiscoveryIds zostaje [] -- wiedza nigdy nie osiąga progu.
    const rng = testRng("breakthrough-ineligible");
    for (let tick = 0; tick < 200; tick++) {
      const result = evaluateBreakthroughs({ technologyState, regionId: "r1", tick, rng });
      technologyState = result.technologyState;
      expect(result.facts).toEqual([]);
    }
    expect(technologyState.discoveries.d1?.status ?? "UNKNOWN").toBe("UNKNOWN");
  });

  it("eventually transitions an eligible UNKNOWN discovery to KNOWN (probabilistic, base chance 0.03 -- P(never in 2000 tries) is astronomically small)", () => {
    let technologyState = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      10,
    );
    const discoveries = { d1: discoveryRule({ tier: 1 }) };
    technologyState = updateEligibility(technologyState, discoveries).technologyState;
    expect(technologyState.eligibleDiscoveryIds).toEqual(["d1"]);

    const rng = testRng("breakthrough-eventually");
    let becameKnownAtTick: number | undefined;
    for (let tick = 0; tick < 2000 && becameKnownAtTick === undefined; tick++) {
      const result = evaluateBreakthroughs({ technologyState, regionId: "r1", tick, rng });
      technologyState = result.technologyState;
      if (result.facts.length > 0) {
        becameKnownAtTick = tick;
        expect(result.facts).toEqual([
          {
            type: "discovery_occurred",
            subject: { entityType: "discovery", entityId: "d1" },
            location: { regionId: "r1" },
            values: { before: "UNKNOWN", after: "KNOWN" },
          },
        ]);
      }
    }

    expect(becameKnownAtTick).toBeDefined();
    expect(technologyState.discoveries.d1?.status).toBe("KNOWN");
    expect(technologyState.discoveries.d1?.discoveredTick).toBe(becameKnownAtTick);
    expect(technologyState.discoveries.d1?.sourceRegionId).toBe("r1");

    // discovery ≠ availability (para z "discovery eligibility test"
    // roadmapy): stanie się KNOWN samo z siebie nigdy nie ustawia
    // availability/AVAILABLE.
    expect(technologyState.discoveries.d1?.availability).toBe(0);
  });

  it("does not re-roll a discovery that is already KNOWN", () => {
    let technologyState = setDomainKnowledge(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "agriculture_food",
      10,
    );
    technologyState = setDiscoveryState(technologyState, "d1", {
      status: "KNOWN",
      discoveredTick: 3,
      sourceRegionId: "r1",
    });
    technologyState = { ...technologyState, eligibleDiscoveryIds: ["d1"] };

    const rng = testRng("breakthrough-already-known");
    const result = evaluateBreakthroughs({ technologyState, regionId: "r1", tick: 10, rng });

    expect(result.facts).toEqual([]);
    expect(result.technologyState.discoveries.d1?.discoveredTick).toBe(3);
  });
});

describe("technology tier reached (owner decision 2026-09-26)", () => {
  const rules = {
    t0: discoveryRule({ tier: 0 }),
    t1: discoveryRule({ tier: 1 }),
    t3: discoveryRule({ tier: 3 }),
  };
  const base = createTechnologyState({ id: "t", regionId: "r1" });

  it("a region's tier is the highest tier among its AVAILABLE/ADOPTED discoveries", () => {
    let state = setDiscoveryState(base, "t3", { status: "KNOWN" });
    expect(availableTechnologyTier(state, rules)).toBe(-1);
    state = setDiscoveryState(state, "t1", { status: "AVAILABLE" });
    expect(availableTechnologyTier(state, rules)).toBe(1);
  });

  it("emits technology_tier_reached when the tier rises to T1+, keyed by tier (world novelty = first region)", () => {
    const before = setDiscoveryState(base, "t1", { status: "AVAILABLE" });
    const after = setDiscoveryState(before, "t3", { status: "AVAILABLE" });
    expect(detectTierReached(before, after, rules)).toEqual({
      type: "technology_tier_reached",
      subject: { entityType: "technology_tier", entityId: "tier_3" },
      location: { regionId: "r1" },
      values: { before: 1, after: 3, delta: 2 },
    });
  });

  it("T0 is the starting point, not an event; no change means no fact", () => {
    const t0 = setDiscoveryState(base, "t0", { status: "AVAILABLE" });
    expect(detectTierReached(base, t0, rules)).toBeUndefined();
    expect(detectTierReached(t0, t0, rules)).toBeUndefined();
  });
});
