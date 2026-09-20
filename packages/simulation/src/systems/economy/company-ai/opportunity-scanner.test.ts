import { createRegion, createRegionGeography, type Region } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import type { ProductionRecipe } from "../production.js";
import { evaluateFounding, type EvaluateFoundingInput } from "./opportunity-scanner.js";

const geography = createRegionGeography({
  terrain: "plains",
  climate: "temperate",
  area: 100,
  fertility: 0.6,
  waterAccess: true,
  coastal: false,
  elevationClass: "lowland",
});

function region(overrides: { totalPopulation?: number; wealth?: number } = {}): Region {
  const base = createRegion({
    id: "region_001",
    worldId: "world_001",
    continentId: "continent_001",
    name: "Test Region",
    geography,
  });
  return {
    ...base,
    population: {
      ...base.population,
      totalPopulation: overrides.totalPopulation ?? 100,
    },
    economy: { ...base.economy, wealth: overrides.wealth ?? 0 },
  };
}

const GRAIN_FARM_RECIPE: ProductionRecipe = {
  productionMethodId: "manual_farming",
  employeesPerBatch: 1,
  resourceInputsPerBatch: { grain: 10 },
  goodInputsPerBatch: {},
  goodOutputsPerBatch: { flour: 8 },
  eligibleCompanyArchetypeIds: ["grain_farm"],
};

const ABUNDANT_CONDITIONS: Omit<EvaluateFoundingInput, "region" | "tick"> = {
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

function runUntilDecided(
  initialRegion: Region,
  conditions: Omit<EvaluateFoundingInput, "region" | "tick">,
  maxTicks = 10,
) {
  let r = initialRegion;
  let lastResult;
  for (let tick = 1; tick <= maxTicks; tick++) {
    lastResult = evaluateFounding({ region: r, tick, ...conditions });
    r = lastResult.region;
    if (lastResult.founded) break;
  }
  return lastResult!;
}

describe("evaluateFounding (M12, AI-07 Entrepreneurship / Opportunity Scanner)", () => {
  it("Opportunity Founding Test: founds a new company once a real opportunity persists long enough", () => {
    const result = runUntilDecided(region(), ABUNDANT_CONDITIONS);

    expect(result.founded).toBe(true);
    expect(result.companyDraft).toEqual({
      archetypeId: "grain_farm",
      productionMethodId: "manual_farming",
      initialCapacity: 1,
      initialUtilization: 0.5,
      initialCash: 0,
      initialWageOffer: 10,
    });
    expect(result.snapshot?.selectedAction).toBe("FOUND");
  });

  it("No Opportunity Test: never founds a company without any economic justification", () => {
    const noOpportunity: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      ...ABUNDANT_CONDITIONS,
      demandGapSeverity: 0,
      unmetDemandQuantity: 0,
    };
    let r = region();
    let everFounded = false;
    for (let tick = 1; tick <= 30; tick++) {
      const result = evaluateFounding({ region: r, tick, ...noOpportunity });
      r = result.region;
      if (result.founded) everFounded = true;
    }
    expect(everFounded).toBe(false);
  });

  it("does not found within a single tick -- opportunity must persist (§84 Anti-Explosion Rules: no instant entry)", () => {
    const result = evaluateFounding({
      region: region(),
      tick: 1,
      ...ABUNDANT_CONDITIONS,
    });
    expect(result.founded).toBe(false);
  });

  it("Competition Saturation Test: enough existing competitors can tip a marginal opportunity from founded to not-founded", () => {
    // A marginal opportunity is deliberately used here, not ABUNDANT_CONDITIONS
    // -- AI Decision Model §47 is explicit that "wysoka konkurencja nie
    // blokuje wejścia absolutnie" (high competition never absolutely blocks
    // entry), so an opportunity this good SHOULD still clear the bar
    // without competition, and competition's whole job is to matter at the
    // margin, not to override an overwhelming opportunity.
    const marginal: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      ...ABUNDANT_CONDITIONS,
      demandGapSeverity: 0.6,
      prices: { grain: 2, flour: 3.2 }, // margin per batch = 8*3.2 - 10*2 = 5.6 -> marginScore 0.28
    };

    const uncontested = runUntilDecided(region(), {
      ...marginal,
      existingCompetitorCount: 0,
    });
    expect(uncontested.founded).toBe(true);

    const saturated = runUntilDecided(region(), {
      ...marginal,
      existingCompetitorCount: 10, // far past COMPETITION_SATURATION_COMPETITORS
    });
    expect(saturated.founded).toBe(false);
  });

  it("hard eligibility: a required resource entirely missing from the region blocks founding regardless of score", () => {
    const noResource: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      ...ABUNDANT_CONDITIONS,
      resourceStockByResourceId: {}, // grain deposit doesn't exist in this region at all
    };
    const result = runUntilDecided(region(), noResource, 30);
    expect(result.founded).toBe(false);
  });

  it("hard eligibility: a region with zero population never founds a company (nobody to own it)", () => {
    const result = runUntilDecided(
      region({ totalPopulation: 0 }),
      ABUNDANT_CONDITIONS,
      30,
    );
    expect(result.founded).toBe(false);
  });

  it("Minimum Economic Scale (§85): does not found a company for unmet demand under one batch's worth", () => {
    const tinyDemand: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      ...ABUNDANT_CONDITIONS,
      demandGapSeverity: 1,
      unmetDemandQuantity: 0.1, // primary output is 8 units/batch -- 0.1 is far under one batch
    };
    const result = runUntilDecided(region(), tinyDemand, 30);
    expect(result.founded).toBe(false);
  });

  it("Test Cooldown: does not found a second company of the same archetype immediately after the first", () => {
    const first = runUntilDecided(region(), ABUNDANT_CONDITIONS);
    expect(first.founded).toBe(true);

    const second = evaluateFounding({
      region: first.region,
      tick: 7, // one tick after the founding tick, well inside FOUNDING_COOLDOWN_TICKS
      ...ABUNDANT_CONDITIONS,
    });
    expect(second.founded).toBe(false);
  });

  it("Determinism Test: identical inputs produce an identical score and outcome across independent evaluations", () => {
    const a = evaluateFounding({ region: region(), tick: 5, ...ABUNDANT_CONDITIONS });
    const b = evaluateFounding({ region: region(), tick: 5, ...ABUNDANT_CONDITIONS });
    expect(a.opportunityScore).toBe(b.opportunityScore);
    expect(a.founded).toBe(b.founded);
  });

  it("rejects a negative capitalRequirement instead of silently treating it as a windfall", () => {
    expect(() =>
      evaluateFounding({
        region: region(),
        tick: 1,
        ...ABUNDANT_CONDITIONS,
        capitalRequirement: -100,
      }),
    ).toThrow(/capitalRequirement/);
  });

  it("founding_debits_capital_and_rejects_insufficient_funds: capitalRequirement must be backed by region.economy.wealth (audit P0-03)", () => {
    const requiresCapital: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      ...ABUNDANT_CONDITIONS,
      capitalRequirement: 100,
    };

    // wealth = 0 (region()'s default) -- P0-03's audit reproduction: a
    // region without accumulated wealth may NOT mint capital out of
    // nothing just because the archetype JSON asks for it.
    const blocked = runUntilDecided(region(), requiresCapital, 30);
    expect(blocked.founded).toBe(false);

    // wealth = exactly the requirement -- founds, AND the pool is
    // actually debited (not just checked and ignored).
    const funded = runUntilDecided(region({ wealth: 100 }), requiresCapital);
    expect(funded.founded).toBe(true);
    expect(funded.companyDraft?.initialCash).toBe(100);
    expect(funded.region.economy.wealth).toBe(0);
  });

  it("founding_respects_inputs_labor_pm_and_discovery: hard eligibility now also requires labor, good inputs, and PM/archetype compatibility (audit P1-01)", () => {
    const noLabor: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      ...ABUNDANT_CONDITIONS,
      availableLabor: 0,
    };
    expect(runUntilDecided(region(), noLabor, 30).founded).toBe(false);

    const requiresGood: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      ...ABUNDANT_CONDITIONS,
      recipe: { ...GRAIN_FARM_RECIPE, goodInputsPerBatch: { fertilizer: 1 } },
      goodStockByGoodId: {}, // fertilizer required, none available
    };
    expect(runUntilDecided(region(), requiresGood, 30).founded).toBe(false);

    const goodAvailable: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      ...requiresGood,
      goodStockByGoodId: { fertilizer: 10 },
    };
    expect(runUntilDecided(region(), goodAvailable).founded).toBe(true);

    const wrongArchetype: Omit<EvaluateFoundingInput, "region" | "tick"> = {
      ...ABUNDANT_CONDITIONS,
      archetypeId: "bakery", // recipe.eligibleCompanyArchetypeIds only lists "grain_farm"
    };
    expect(runUntilDecided(region(), wrongArchetype, 30).founded).toBe(false);
  });

  it("M18 (WHY NOT?): a rejected decision still returns a real DecisionSnapshot -- HOLD, with the actual opportunity score and negative factors", () => {
    // A marginal opportunity that clears no threshold on tick 1 (persistence
    // not yet satisfied) -- mirrors the spec's own example (SS33: "Dlaczego
    // nie powstała kopalnia? OpportunityScore 0.43, Required 0.60").
    const result = evaluateFounding({ region: region(), tick: 1, ...ABUNDANT_CONDITIONS });

    expect(result.founded).toBe(false);
    expect(result.snapshot.selectedAction).toBe("HOLD");
    expect(result.snapshot.causalContext.factors.length).toBeGreaterThan(0);
  });
});
