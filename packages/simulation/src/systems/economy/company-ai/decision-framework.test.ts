import { createCompany, type Company } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import {
  clamp,
  evaluateHysteresisGate,
  isActive,
  isOnCooldown,
  persistenceSatisfied,
  recordDecision,
  setActive,
  updateExpectations,
  updateMemory,
  updateOpportunityStreak,
} from "./decision-framework.js";

function company(): Company {
  return createCompany({
    id: "company_001",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: "inventory_001",
  });
}

describe("clamp", () => {
  it("bounds a value to [min, max]", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
  });
});

describe("evaluateHysteresisGate", () => {
  it("activates only once the score clears the higher activate threshold", () => {
    expect(
      evaluateHysteresisGate({
        score: 0.5,
        currentlyActive: false,
        activateThreshold: 0.7,
        deactivateThreshold: 0.4,
      }),
    ).toBe(false);
    expect(
      evaluateHysteresisGate({
        score: 0.75,
        currentlyActive: false,
        activateThreshold: 0.7,
        deactivateThreshold: 0.4,
      }),
    ).toBe(true);
  });

  it("does not deactivate until the score drops below the lower threshold (no expand/contract/expand oscillation)", () => {
    // Active with score sitting between the two thresholds: stays active.
    expect(
      evaluateHysteresisGate({
        score: 0.5,
        currentlyActive: true,
        activateThreshold: 0.7,
        deactivateThreshold: 0.4,
      }),
    ).toBe(true);
    expect(
      evaluateHysteresisGate({
        score: 0.35,
        currentlyActive: true,
        activateThreshold: 0.7,
        deactivateThreshold: 0.4,
      }),
    ).toBe(false);
  });

  it("rejects a misconfigured gate (activateThreshold below deactivateThreshold)", () => {
    expect(() =>
      evaluateHysteresisGate({
        score: 0.5,
        currentlyActive: false,
        activateThreshold: 0.2,
        deactivateThreshold: 0.4,
      }),
    ).toThrow(RangeError);
  });
});

describe("isActive / setActive", () => {
  it("defaults to false and round-trips through setActive", () => {
    const c = company();
    expect(isActive(c, "capacity_expansion")).toBe(false);
    const activated = setActive(c, "capacity_expansion", true);
    expect(isActive(activated, "capacity_expansion")).toBe(true);
    expect(isActive(activated, "capacity_contraction")).toBe(false); // unrelated decision type untouched
  });
});

describe("cooldown", () => {
  it("is off before any decision has been recorded", () => {
    expect(isOnCooldown(company(), "capacity_expansion", 10, 12)).toBe(false);
  });

  it("blocks re-decision within the cooldown window and clears afterward", () => {
    const decided = recordDecision(company(), "capacity_expansion", 10);
    expect(isOnCooldown(decided, "capacity_expansion", 15, 12)).toBe(true); // 5 ticks later, still within 12
    expect(isOnCooldown(decided, "capacity_expansion", 25, 12)).toBe(false); // 15 ticks later, cleared
  });

  it("cooldowns for unrelated decision types never interfere", () => {
    const decided = recordDecision(company(), "capacity_expansion", 10);
    expect(isOnCooldown(decided, "closure", 11, 12)).toBe(false);
  });
});

describe("persistence streak", () => {
  it("requires N consecutive ticks of the condition holding", () => {
    let c = company();
    for (let i = 0; i < 5; i++) {
      c = updateOpportunityStreak(c, "capacity_expansion", true);
    }
    expect(persistenceSatisfied(c, "capacity_expansion", 6)).toBe(false);
    c = updateOpportunityStreak(c, "capacity_expansion", true);
    expect(persistenceSatisfied(c, "capacity_expansion", 6)).toBe(true);
  });

  it("resets to 0 the instant the condition stops holding", () => {
    let c = company();
    for (let i = 0; i < 6; i++)
      c = updateOpportunityStreak(c, "capacity_expansion", true);
    expect(persistenceSatisfied(c, "capacity_expansion", 6)).toBe(true);
    c = updateOpportunityStreak(c, "capacity_expansion", false);
    expect(persistenceSatisfied(c, "capacity_expansion", 6)).toBe(false);
  });
});

describe("updateMemory", () => {
  it("appends observations and keeps a bounded rolling window", () => {
    let c = company();
    for (let tick = 0; tick < 20; tick++) {
      c = updateMemory(c, { profit: tick, demand: tick, shortage: 0 });
    }
    expect(c.ai.memory.profitHistory.length).toBeLessThanOrEqual(6);
    expect(c.ai.memory.profitHistory.at(-1)).toBe(19);
  });
});

describe("updateExpectations", () => {
  it("writes into Company.market.expectedPrices/expectedDemand (M3 fields), not a duplicate", () => {
    const c = updateExpectations(company(), "grain", { price: 10, demand: 5 });
    expect(c.market.expectedPrices.grain).toBe(10); // first observation seeds the expectation directly
    expect(c.market.expectedDemand.grain).toBe(5);
  });

  it("blends toward new observations rather than jumping to them", () => {
    let c = updateExpectations(company(), "grain", { price: 10, demand: 5 });
    c = updateExpectations(c, "grain", { price: 20, demand: 5 });
    expect(c.market.expectedPrices.grain).toBeGreaterThan(10);
    expect(c.market.expectedPrices.grain).toBeLessThan(20);
  });
});
