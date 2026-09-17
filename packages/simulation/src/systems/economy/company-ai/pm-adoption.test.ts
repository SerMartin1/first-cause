import { createCompany, type Company } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import type { ProductionRecipe } from "../production.js";
import { evaluatePmAdoption } from "./pm-adoption.js";

function company(cash = 1000): Company {
  return createCompany({
    id: "company_001",
    archetypeId: "grain_farm",
    name: "Farm",
    foundedTick: 0,
    regionId: "region_001",
    ownerType: "individual",
    ownerEntityId: "cohort_001",
    inventoryId: "inventory_001",
    initialCash: cash,
  });
}

const currentRecipe: ProductionRecipe = {
  productionMethodId: "manual_farming",
  resourceInputsPerBatch: { grain: 10 },
  goodInputsPerBatch: {},
  goodOutputsPerBatch: { flour: 8 },
};

const betterRecipe: ProductionRecipe = {
  productionMethodId: "improved_farming",
  resourceInputsPerBatch: { grain: 10 },
  goodInputsPerBatch: {},
  goodOutputsPerBatch: { flour: 12 },
};

const worseRecipe: ProductionRecipe = {
  productionMethodId: "worse_farming",
  resourceInputsPerBatch: { grain: 10 },
  goodInputsPerBatch: {},
  goodOutputsPerBatch: { flour: 6 },
};

const prices = { grain: 2, flour: 5 };

describe("evaluatePmAdoption", () => {
  it("Test PM Adoption: adopts a genuinely better recipe once its advantage has persisted", () => {
    let c = company();
    let adopted = false;
    for (let tick = 1; tick <= 3; tick++) {
      const result = evaluatePmAdoption({
        company: c,
        tick,
        currentRecipe,
        candidateRecipe: betterRecipe,
        prices,
        conversionCost: 5,
      });
      c = result.company;
      adopted = result.adopted;
    }
    expect(adopted).toBe(true);
    expect(c.production.productionMethodId).toBe("improved_farming");
    expect(c.finance.cash).toBe(995);
  });

  it("Test PM Rejection: never adopts a recipe with a worse per-batch margin", () => {
    let c = company();
    let adopted = false;
    for (let tick = 1; tick <= 10; tick++) {
      const result = evaluatePmAdoption({
        company: c,
        tick,
        currentRecipe,
        candidateRecipe: worseRecipe,
        prices,
        conversionCost: 5,
      });
      c = result.company;
      adopted = result.adopted;
    }
    expect(adopted).toBe(false);
    expect(c.production.productionMethodId).toBeUndefined();
  });

  it("Technologia może być nieopłacalna (SS39): a high conversion cost can turn an output gain into a rejection", () => {
    let c = company();
    let adopted = false;
    for (let tick = 1; tick <= 10; tick++) {
      const result = evaluatePmAdoption({
        company: c,
        tick,
        currentRecipe,
        candidateRecipe: betterRecipe,
        prices,
        conversionCost: 10_000, // far exceeds the 20-unit margin gain
      });
      c = result.company;
      adopted = result.adopted;
    }
    expect(adopted).toBe(false);
  });

  it("does not adopt without a single tick of persistence yet", () => {
    const result = evaluatePmAdoption({
      company: company(),
      tick: 1,
      currentRecipe,
      candidateRecipe: betterRecipe,
      prices,
      conversionCost: 5,
    });
    expect(result.adopted).toBe(false);
  });

  it("Early Adopters (SS40): a higher innovationPreference lowers the required advantage", () => {
    // A tiny advantage that would not clear the default bar...
    const tinyAdvantageCandidate: ProductionRecipe = {
      ...betterRecipe,
      goodOutputsPerBatch: { flour: 8.02 }, // margin gain of 0.1, well under the default 0.05 * 1 threshold once conversionCost is subtracted
    };
    let conservative = company();
    let innovative = company();
    for (let tick = 1; tick <= 3; tick++) {
      conservative = evaluatePmAdoption({
        company: conservative,
        tick,
        currentRecipe,
        candidateRecipe: tinyAdvantageCandidate,
        prices,
        conversionCost: 0.08,
      }).company;
      innovative = evaluatePmAdoption({
        company: innovative,
        tick,
        currentRecipe,
        candidateRecipe: tinyAdvantageCandidate,
        prices,
        conversionCost: 0.08,
        innovationPreference: 1,
      }).company;
    }
    expect(conservative.production.productionMethodId).toBeUndefined();
    expect(innovative.production.productionMethodId).toBe("improved_farming");
  });

  it("does not re-adopt within the cooldown window", () => {
    let c = company();
    for (let tick = 1; tick <= 3; tick++) {
      c = evaluatePmAdoption({
        company: c,
        tick,
        currentRecipe,
        candidateRecipe: betterRecipe,
        prices,
        conversionCost: 5,
      }).company;
    }
    const result = evaluatePmAdoption({
      company: c,
      tick: 4,
      currentRecipe: betterRecipe,
      candidateRecipe: currentRecipe, // even reverting would score positively if evaluated -- cooldown should still block it
      prices,
      conversionCost: 0,
    });
    expect(result.adopted).toBe(false);
  });

  it("Test Determinism (regression guard, audit P0-03): a recipe with the same goods in a different key order gives the exact same pmScore/adoption outcome", () => {
    const currentRecipeSingleGood: ProductionRecipe = {
      productionMethodId: "manual_farming",
      resourceInputsPerBatch: {},
      goodInputsPerBatch: {},
      goodOutputsPerBatch: { flour: 0.55 },
    };
    const candidateInsertedAscending: ProductionRecipe = {
      productionMethodId: "improved_farming",
      resourceInputsPerBatch: {},
      goodInputsPerBatch: {},
      goodOutputsPerBatch: { a: 0.1, b: 0.2, c: 0.3 },
    };
    const candidateInsertedDescending: ProductionRecipe = {
      productionMethodId: "improved_farming",
      resourceInputsPerBatch: {},
      goodInputsPerBatch: {},
      goodOutputsPerBatch: { c: 0.3, b: 0.2, a: 0.1 },
    };
    const flatPrices = { flour: 1, a: 1, b: 1, c: 1 };

    function runThreeTicks(candidateRecipe: ProductionRecipe) {
      let c = company();
      let result;
      for (let tick = 1; tick <= 3; tick++) {
        result = evaluatePmAdoption({
          company: c,
          tick,
          currentRecipe: currentRecipeSingleGood,
          candidateRecipe,
          prices: flatPrices,
          conversionCost: 0,
        });
        c = result.company;
      }
      return result!;
    }

    const ascending = runThreeTicks(candidateInsertedAscending);
    const descending = runThreeTicks(candidateInsertedDescending);

    expect(descending.pmScore).toBe(ascending.pmScore);
    expect(descending.adopted).toBe(ascending.adopted);
  });

  it("Test Determinism: identical inputs always produce an identical result", () => {
    const input = {
      company: company(),
      tick: 5,
      currentRecipe,
      candidateRecipe: betterRecipe,
      prices,
      conversionCost: 5,
    };
    const first = evaluatePmAdoption(input);
    const second = evaluatePmAdoption(input);
    expect(second.pmScore).toBe(first.pmScore);
    expect(second.adopted).toBe(first.adopted);
  });
});
