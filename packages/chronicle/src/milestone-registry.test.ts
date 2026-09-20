import { describe, expect, it } from "vitest";
import { createMilestoneRegistry, MilestoneRegistry } from "./milestone-registry.js";

describe("MilestoneRegistry", () => {
  it("fires a milestone exactly once", () => {
    const registry = createMilestoneRegistry();
    expect(registry.hasReached("depletion:deposit_12:75")).toBe(false);
    expect(registry.markReached("depletion:deposit_12:75")).toBe(true);
    expect(registry.hasReached("depletion:deposit_12:75")).toBe(true);
    expect(registry.markReached("depletion:deposit_12:75")).toBe(false);
  });

  it("keeps distinct keys independent", () => {
    const registry = createMilestoneRegistry();
    registry.markReached("depletion:deposit_12:50");
    expect(registry.hasReached("depletion:deposit_12:75")).toBe(false);
    expect(registry.size).toBe(1);
  });

  it("getState/fromState round-trips reached milestones (M20)", () => {
    const registry = createMilestoneRegistry();
    registry.markReached("depletion:deposit_12:75");
    registry.markReached("depletion:deposit_12:50");

    const restored = MilestoneRegistry.fromState(registry.getState());
    expect(restored.hasReached("depletion:deposit_12:75")).toBe(true);
    expect(restored.markReached("depletion:deposit_12:75")).toBe(false); // already reached
    expect(restored.size).toBe(2);
  });
});
