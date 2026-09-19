import { describe, expect, it } from "vitest";
import {
  createArchitectInfluenceState,
  regenerateInfluence,
  spendInfluence,
} from "./influence.js";
import { InvariantViolationError } from "../core/validation.js";

describe("createArchitectInfluenceState", () => {
  it("starts at the full balance (SS4: recommended VS max 100)", () => {
    expect(createArchitectInfluenceState()).toEqual({ current: 100, max: 100 });
  });

  it("honors a custom max", () => {
    expect(createArchitectInfluenceState(50)).toEqual({ current: 50, max: 50 });
  });

  it("rejects a non-positive max", () => {
    expect(() => createArchitectInfluenceState(0)).toThrow();
  });
});

describe("spendInfluence", () => {
  it("subtracts the amount", () => {
    const state = createArchitectInfluenceState(100);
    expect(spendInfluence(state, 15)).toEqual({ current: 85, max: 100 });
  });

  it("allows spending the entire balance", () => {
    const state = createArchitectInfluenceState(100);
    expect(spendInfluence(state, 100).current).toBe(0);
  });

  it("rejects spending more than the current balance (this is a last-resort guard, not the real validation gate)", () => {
    const state = createArchitectInfluenceState(100);
    expect(() => spendInfluence(state, 101)).toThrow(InvariantViolationError);
  });

  it("rejects a negative amount", () => {
    const state = createArchitectInfluenceState(100);
    expect(() => spendInfluence(state, -5)).toThrow(InvariantViolationError);
  });
});

describe("regenerateInfluence", () => {
  it("adds the per-tick amount", () => {
    const state = spendInfluence(createArchitectInfluenceState(100), 40);
    expect(regenerateInfluence(state, 5)).toEqual({ current: 65, max: 100 });
  });

  it("clamps at max", () => {
    const state = spendInfluence(createArchitectInfluenceState(100), 2);
    expect(regenerateInfluence(state, 10)).toEqual({ current: 100, max: 100 });
  });

  it("accepts a zero rate (regen can be tuned off without special-casing)", () => {
    const state = spendInfluence(createArchitectInfluenceState(100), 10);
    expect(regenerateInfluence(state, 0)).toEqual({ current: 90, max: 100 });
  });

  it("rejects a negative rate", () => {
    expect(() => regenerateInfluence(createArchitectInfluenceState(100), -1)).toThrow(
      InvariantViolationError,
    );
  });
});
