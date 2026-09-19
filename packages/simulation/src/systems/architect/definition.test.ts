import { describe, expect, it } from "vitest";
import { parseArchitectInterventionRule } from "./definition.js";

describe("parseArchitectInterventionRule", () => {
  it("parses a binary intervention (no continuous parameter)", () => {
    const rule = parseArchitectInterventionRule(
      "reveal_resource_deposit",
      "resources",
      ["entity"],
      {},
      { base: 15 },
      12,
      { policy: "allowed" },
      "resource_discovered",
    );

    expect(rule).toEqual({
      id: "reveal_resource_deposit",
      category: "resources",
      allowedScopes: ["entity"],
      parameters: {},
      costs: { base: 15, magnitudePerUnit: 0, scopeMultiplier: {}, naturalnessMultiplier: 1 },
      cooldownTicks: 12,
      stackingPolicy: "allowed",
      rootFactType: "resource_discovered",
    });
  });

  it("parses a magnitude intervention with scope multipliers and a declared parameter range", () => {
    const rule = parseArchitectInterventionRule(
      "fertility_shift",
      "environment",
      ["region"],
      { magnitude: { min: 0.05, max: 0.3 } },
      { base: 10, magnitudePerUnit: 150, scopeMultiplier: { region: 1.5 }, naturalnessMultiplier: 1.2 },
      24,
      { policy: "limited" },
      "region_fertility_shifted",
    );

    expect(rule.parameters).toEqual({ magnitude: { min: 0.05, max: 0.3 } });
    expect(rule.costs).toEqual({
      base: 10,
      magnitudePerUnit: 150,
      scopeMultiplier: { region: 1.5 },
      naturalnessMultiplier: 1.2,
    });
  });

  it("rejects a non-numeric costs.base", () => {
    expect(() =>
      parseArchitectInterventionRule(
        "bad",
        "resources",
        ["entity"],
        {},
        { base: "fifteen" },
        0,
        { policy: "allowed" },
        "x",
      ),
    ).toThrow(/base/);
  });

  it("rejects a parameter spec with min > max", () => {
    expect(() =>
      parseArchitectInterventionRule(
        "bad",
        "resources",
        ["entity"],
        { magnitude: { min: 0.5, max: 0.1 } },
        { base: 1 },
        0,
        { policy: "allowed" },
        "x",
      ),
    ).toThrow(/min.*max/);
  });

  it("rejects an unknown stacking policy", () => {
    expect(() =>
      parseArchitectInterventionRule(
        "bad",
        "resources",
        ["entity"],
        {},
        { base: 1 },
        0,
        { policy: "sometimes" },
        "x",
      ),
    ).toThrow(/stacking\.policy/);
  });
});
