import { describe, expect, it } from "vitest";
import { combineInfluences, computeChildInfluence } from "./architect-influence-propagation.js";

describe("computeChildInfluence", () => {
  it("multiplies parent influence by edge strength and persistence (SS36)", () => {
    expect(computeChildInfluence(1, 1, 0.7)).toBeCloseTo(0.7, 10);
    expect(computeChildInfluence(0.7, 0.8, 0.7)).toBeCloseTo(0.392, 10);
  });

  it("a zero-strength edge carries no influence forward", () => {
    expect(computeChildInfluence(1, 0, 0.7)).toBe(0);
  });
});

describe("combineInfluences", () => {
  it("combines multiple independent paths as a probabilistic OR (SS36), never a plain sum", () => {
    const combined = combineInfluences([0.5, 0.5]);
    expect(combined).toBeCloseTo(0.75, 10); // 1 - (1-0.5)(1-0.5) = 0.75, not 1.0
  });

  it("a single path returns exactly that path's influence", () => {
    expect(combineInfluences([0.42])).toBeCloseTo(0.42, 10);
  });

  it("no paths combine to zero", () => {
    expect(combineInfluences([])).toBe(0);
  });

  it("never exceeds 1.0 even with many strong paths", () => {
    const combined = combineInfluences([0.9, 0.9, 0.9, 0.9]);
    expect(combined).toBeLessThan(1);
  });
});
