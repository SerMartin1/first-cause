import { describe, expect, it } from "vitest";
import { createArchitectInfluenceState } from "@first-cause/entities";
import {
  ARCHITECT_INFLUENCE_REGEN_PER_TICK_TODO_TUNING,
  hasSufficientInfluence,
  tickArchitectInfluence,
} from "./influence.js";

describe("tickArchitectInfluence", () => {
  it("adds the TODO-tuning per-tick amount, clamped at max", () => {
    const state = { current: 90, max: 100 };
    expect(tickArchitectInfluence(state)).toEqual({
      current: 90 + ARCHITECT_INFLUENCE_REGEN_PER_TICK_TODO_TUNING,
      max: 100,
    });
  });

  it("never exceeds max", () => {
    const state = createArchitectInfluenceState(100);
    expect(tickArchitectInfluence(state)).toEqual({ current: 100, max: 100 });
  });
});

describe("hasSufficientInfluence", () => {
  it("true when current >= cost", () => {
    expect(hasSufficientInfluence({ current: 50, max: 100 }, 50)).toBe(true);
  });

  it("false when current < cost", () => {
    expect(hasSufficientInfluence({ current: 49, max: 100 }, 50)).toBe(false);
  });
});
