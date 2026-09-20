import { describe, expect, it } from "vitest";
import { classifySignificance, computeSignificance } from "./significance.js";

const ZERO_COMPONENTS = {
  magnitude: 0,
  duration: 0,
  populationAffected: 0,
  geographicScope: 0,
  novelty: 0,
  causalImpact: 0,
  contextualImportance: 0,
  baseSignificance: 0,
};

describe("classifySignificance", () => {
  it("maps boundary values to the documented category bands", () => {
    expect(classifySignificance(0)).toBe("TRACE");
    expect(classifySignificance(9)).toBe("TRACE");
    expect(classifySignificance(10)).toBe("MINOR");
    expect(classifySignificance(24)).toBe("MINOR");
    expect(classifySignificance(25)).toBe("NOTABLE");
    expect(classifySignificance(45)).toBe("MAJOR");
    expect(classifySignificance(65)).toBe("HISTORIC");
    expect(classifySignificance(85)).toBe("WORLD_DEFINING");
    expect(classifySignificance(100)).toBe("WORLD_DEFINING");
  });
});

describe("computeSignificance", () => {
  it("returns 0/TRACE for an all-zero event with no baseline", () => {
    const result = computeSignificance(ZERO_COMPONENTS);
    expect(result.total).toBe(0);
    expect(result.category).toBe("TRACE");
  });

  it("returns 100/WORLD_DEFINING when every component and the baseline are maxed", () => {
    const result = computeSignificance({
      magnitude: 1,
      duration: 1,
      populationAffected: 1,
      geographicScope: 1,
      novelty: 1,
      causalImpact: 1,
      contextualImportance: 1,
      baseSignificance: 100,
    });
    expect(result.total).toBe(100);
    expect(result.category).toBe("WORLD_DEFINING");
  });

  it("never lets one zero component alone zero out an otherwise-strong event (SS190 anti-multiplication)", () => {
    const result = computeSignificance({
      ...ZERO_COMPONENTS,
      magnitude: 1,
      duration: 1,
      populationAffected: 1,
      geographicScope: 1,
      causalImpact: 1,
      // novelty stays 0 -- a pure-multiplication model would zero the whole score.
    });
    expect(result.total).toBeGreaterThan(0);
  });

  it("clamps out-of-range component inputs instead of propagating them", () => {
    const result = computeSignificance({
      ...ZERO_COMPONENTS,
      magnitude: 5,
      baseSignificance: 500,
    });
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("a nonzero baseSignificance alone (all dynamic components 0) still nudges the score above 0", () => {
    const result = computeSignificance({ ...ZERO_COMPONENTS, baseSignificance: 40 });
    expect(result.total).toBeGreaterThan(0);
  });
});
