import { describe, expect, it } from "vitest";
import { parseArchitectInterventionRule } from "./definition.js";
import { computeInterventionCost } from "./cost.js";

const binaryRule = parseArchitectInterventionRule(
  "reveal_resource_deposit",
  "resources",
  ["entity"],
  {},
  { base: 15 },
  12,
  { policy: "allowed" },
  "resource_discovered",
);

const magnitudeRule = parseArchitectInterventionRule(
  "fertility_shift",
  "environment",
  ["region"],
  { magnitude: { min: 0.05, max: 0.3 } },
  { base: 10, magnitudePerUnit: 150, scopeMultiplier: { region: 1.5 }, naturalnessMultiplier: 2 },
  24,
  { policy: "limited" },
  "region_fertility_shifted",
);

describe("computeInterventionCost", () => {
  it("a binary intervention costs exactly base, regardless of parameters", () => {
    const cost = computeInterventionCost(binaryRule, "entity", {});
    expect(cost.total).toBe(15);
    expect(cost.magnitude).toBe(0);
  });

  it("+5% fertility costs less than +20%, which costs less than +50% (SS10: magnitude must not be flat)", () => {
    const small = computeInterventionCost(magnitudeRule, "region", { magnitude: 0.05 });
    const medium = computeInterventionCost(magnitudeRule, "region", { magnitude: 0.2 });
    const large = computeInterventionCost(magnitudeRule, "region", { magnitude: 0.3 });

    expect(small.total).toBeLessThan(medium.total);
    expect(medium.total).toBeLessThan(large.total);
  });

  it("applies scope and naturalness multipliers on top of the base+magnitude sum", () => {
    const cost = computeInterventionCost(magnitudeRule, "region", { magnitude: 0.1 });
    // (10 + 150*0.1) * duration(1) * scope(1.5) * naturalness(2) = 25 * 3 = 75
    expect(cost.total).toBe(75);
    expect(cost.scope).toBe(1.5);
    expect(cost.naturalness).toBe(2);
    expect(cost.duration).toBe(1);
  });

  it("an unlisted scope defaults to a neutral 1x multiplier", () => {
    const cost = computeInterventionCost(magnitudeRule, "world", { magnitude: 0 });
    expect(cost.scope).toBe(1);
  });

  it("uses the absolute value of a negative magnitude (a shift is costed by its size, not its direction)", () => {
    const positive = computeInterventionCost(magnitudeRule, "region", { magnitude: 0.2 });
    const negative = computeInterventionCost(magnitudeRule, "region", { magnitude: -0.2 });
    expect(negative.total).toBe(positive.total);
  });
});
