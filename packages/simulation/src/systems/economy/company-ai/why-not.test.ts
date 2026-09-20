import { createRegion, createRegionGeography, type Region } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import type { ProductionRecipe } from "../production.js";
import { evaluateFounding, FOUNDING_ACTIVATE_SCORE, type EvaluateFoundingInput } from "./opportunity-scanner.js";
import { explainWhyNot } from "./why-not.js";

const geography = createRegionGeography({
  terrain: "plains",
  climate: "temperate",
  area: 100,
  fertility: 0.6,
  waterAccess: true,
  coastal: false,
  elevationClass: "lowland",
});

function region(): Region {
  const base = createRegion({
    id: "region_001",
    worldId: "world_001",
    continentId: "continent_001",
    name: "Test Region",
    geography,
  });
  return { ...base, population: { ...base.population, totalPopulation: 100 } };
}

const GRAIN_FARM_RECIPE: ProductionRecipe = {
  productionMethodId: "manual_farming",
  employeesPerBatch: 1,
  resourceInputsPerBatch: { grain: 10 },
  goodInputsPerBatch: {},
  goodOutputsPerBatch: { flour: 8 },
  eligibleCompanyArchetypeIds: ["grain_farm"],
};

describe("explainWhyNot (CAUS-007, M18)", () => {
  it("SS33-style example: a marginal opportunity that never clears the activation threshold explains itself with the real score gap and negative factors", () => {
    // A margin too thin, with real competition -- mirrors SS33's own
    // example almost exactly ("expected margin too low", "OpportunityScore
    // 0.43, Required 0.60").
    const conditions: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      archetypeId: "grain_farm",
      recipe: GRAIN_FARM_RECIPE,
      capitalRequirement: 0,
      prices: { grain: 2, flour: 2.5 }, // thin margin
      demandGapSeverity: 0.5,
      unmetDemandQuantity: 1000,
      resourceStockByResourceId: { grain: 50_000 },
      goodStockByGoodId: {},
      availableLabor: 100,
      existingCompetitorCount: 3,
    };

    let r = region();
    let last = evaluateFounding({ region: r, tick: 1, ...conditions });
    r = last.region;
    for (let tick = 2; tick <= 20 && !last.founded; tick++) {
      last = evaluateFounding({ region: r, tick, ...conditions });
      r = last.region;
    }
    expect(last.founded).toBe(false);
    expect(last.opportunityScore).toBeLessThan(FOUNDING_ACTIVATE_SCORE);

    const explanation = explainWhyNot({
      snapshot: last.snapshot,
      expectedAction: "FOUND",
      requiredScore: FOUNDING_ACTIVATE_SCORE,
    });

    expect(explanation.occurred).toBe(false);
    expect(explanation.actualAction).toBe("HOLD");
    expect(explanation.expectedActionScore).toBe(last.opportunityScore);
    expect(explanation.requiredScore).toBe(FOUNDING_ACTIVATE_SCORE);
    expect(explanation.expectedActionScore!).toBeLessThan(explanation.requiredScore!);
    expect(explanation.limitingFactors.some((f) => f.key === "competition")).toBe(true);
    // sorted most-negative-first.
    for (let i = 1; i < explanation.limitingFactors.length; i++) {
      expect(explanation.limitingFactors[i]!.contribution).toBeGreaterThanOrEqual(
        explanation.limitingFactors[i - 1]!.contribution,
      );
    }
  });

  it("occurred is true when the expected action actually was the one selected", () => {
    const conditions: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      archetypeId: "grain_farm",
      recipe: GRAIN_FARM_RECIPE,
      capitalRequirement: 0,
      prices: { grain: 2, flour: 5 },
      demandGapSeverity: 1,
      unmetDemandQuantity: 1000,
      resourceStockByResourceId: { grain: 50_000 },
      goodStockByGoodId: {},
      availableLabor: 100,
      existingCompetitorCount: 0,
    };
    let r = region();
    let last = evaluateFounding({ region: r, tick: 1, ...conditions });
    r = last.region;
    for (let tick = 2; tick <= 10 && !last.founded; tick++) {
      last = evaluateFounding({ region: r, tick, ...conditions });
      r = last.region;
    }
    expect(last.founded).toBe(true);

    const explanation = explainWhyNot({ snapshot: last.snapshot, expectedAction: "FOUND" });
    expect(explanation.occurred).toBe(true);
    expect(explanation.actualAction).toBe("FOUND");
  });
});
