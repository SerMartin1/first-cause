import { describe, expect, it } from "vitest";
import { createCompany, createTechnologyState, setDiscoveryState } from "@first-cause/entities";
import { evaluatePmAdoption } from "../economy/company-ai/pm-adoption.js";
import type { ProductionRecipe } from "../economy/production.js";
import {
  ADOPTION_THRESHOLD_TODO_TUNING,
  applyIndustryAdoption,
  applyPopulationAccess,
  isProductionMethodAvailable,
} from "./adoption.js";

describe("isProductionMethodAvailable", () => {
  it("is always available when the production method requires no discoveries", () => {
    const technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    expect(isProductionMethodAvailable([], technologyState)).toBe(true);
  });

  it("is unavailable while the required discovery is UNKNOWN/KNOWN, available once AVAILABLE/ADOPTED", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    expect(isProductionMethodAvailable(["d1"], technologyState)).toBe(false);

    technologyState = setDiscoveryState(technologyState, "d1", { status: "KNOWN" });
    expect(isProductionMethodAvailable(["d1"], technologyState)).toBe(false);

    technologyState = setDiscoveryState(technologyState, "d1", { status: "AVAILABLE" });
    expect(isProductionMethodAvailable(["d1"], technologyState)).toBe(true);

    technologyState = setDiscoveryState(technologyState, "d1", { status: "ADOPTED" });
    expect(isProductionMethodAvailable(["d1"], technologyState)).toBe(true);
  });

  it("requires every listed discovery, not just one", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    technologyState = setDiscoveryState(technologyState, "d1", { status: "AVAILABLE" });
    expect(isProductionMethodAvailable(["d1", "d2"], technologyState)).toBe(false);
  });
});

describe("applyIndustryAdoption", () => {
  it("steps industryAdoption up per event and emits a fact", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    technologyState = setDiscoveryState(technologyState, "d1", { status: "AVAILABLE" });

    const result = applyIndustryAdoption(technologyState, [{ discoveryId: "d1" }]);

    expect(result.technologyState.discoveries.d1?.industryAdoption).toBeCloseTo(0.1);
    expect(result.technologyState.discoveries.d1?.status).toBe("AVAILABLE");
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0]?.type).toBe("technology_adoption_increased");
  });

  it("crosses the threshold and sets status ADOPTED (availability ≠ adoption, until enough events accumulate)", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    technologyState = setDiscoveryState(technologyState, "d1", { status: "AVAILABLE" });

    const eventsNeeded = Math.ceil(ADOPTION_THRESHOLD_TODO_TUNING / 0.1);
    for (let i = 0; i < eventsNeeded - 1; i++) {
      technologyState = applyIndustryAdoption(technologyState, [
        { discoveryId: "d1" },
      ]).technologyState;
    }
    expect(technologyState.discoveries.d1?.status).toBe("AVAILABLE"); // jeszcze nie

    technologyState = applyIndustryAdoption(technologyState, [
      { discoveryId: "d1" },
    ]).technologyState;
    expect(technologyState.discoveries.d1?.status).toBe("ADOPTED");
  });
});

describe("applyPopulationAccess", () => {
  it("only grows populationAccess for AVAILABLE/ADOPTED discoveries", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    technologyState = setDiscoveryState(technologyState, "known_only", { status: "KNOWN" });
    technologyState = setDiscoveryState(technologyState, "available", {
      status: "AVAILABLE",
    });

    const result = applyPopulationAccess(technologyState);

    expect(result.technologyState.discoveries.known_only?.populationAccess).toBe(0);
    expect(result.technologyState.discoveries.available?.populationAccess).toBeGreaterThan(0);
  });
});

// "PM adoption/rejection test" (lista Testy M15 z roadmapy): mechanizm
// gate'owania (isProductionMethodAvailable) złożony z istniejącym,
// niezmodyfikowanym AI-08 (evaluatePmAdoption, M11).
describe("technology-gated PM adoption (integration of isProductionMethodAvailable + AI-08)", () => {
  function company() {
    return createCompany({
      id: "company_001",
      archetypeId: "grain_farm",
      name: "Farm",
      foundedTick: 0,
      regionId: "region_001",
      ownerType: "individual",
      ownerEntityId: "cohort_001",
      inventoryId: "inventory_001",
      initialCash: 1000,
    });
  }

  const currentRecipe: ProductionRecipe = {
    productionMethodId: "manual_farming",
    employeesPerBatch: 1,
    resourceInputsPerBatch: { grain: 10 },
    goodInputsPerBatch: {},
    goodOutputsPerBatch: { flour: 8 },
    eligibleCompanyArchetypeIds: [],
  };
  const betterRecipe: ProductionRecipe = {
    productionMethodId: "improved_farming",
    employeesPerBatch: 1,
    resourceInputsPerBatch: { grain: 10 },
    goodInputsPerBatch: {},
    goodOutputsPerBatch: { flour: 12 },
    eligibleCompanyArchetypeIds: [],
  };
  const prices = { grain: 2, flour: 5 };
  const requiredDiscoveryIds = ["better_farming_discovery"];

  it("a discovery-gated candidate is never even evaluated while the discovery isn't AVAILABLE (region without the technology cannot adopt it)", () => {
    const technologyState = createTechnologyState({ id: "t1", regionId: "region_001" });
    expect(isProductionMethodAvailable(requiredDiscoveryIds, technologyState)).toBe(false);
    // economy-tick.ts w ogóle pominąłby tu wywołanie evaluatePmAdoption --
    // nie ma czego asertować na samym evaluatePmAdoption, sedno to gate.
  });

  it("once AVAILABLE, AI-08 evaluates the candidate on its own merits and can adopt a genuinely better recipe", () => {
    let technologyState = setDiscoveryState(
      createTechnologyState({ id: "t1", regionId: "region_001" }),
      "better_farming_discovery",
      { status: "AVAILABLE" },
    );
    expect(isProductionMethodAvailable(requiredDiscoveryIds, technologyState)).toBe(true);

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

    const industryResult = applyIndustryAdoption(technologyState, [
      { discoveryId: "better_farming_discovery" },
    ]);
    technologyState = industryResult.technologyState;
    expect(technologyState.discoveries.better_farming_discovery?.industryAdoption).toBeGreaterThan(
      0,
    );
  });

  it("AI-08 still rejects an unprofitable discovery-gated candidate even once it's AVAILABLE (SS39: discovery ≠ automatic rollout)", () => {
    const technologyState = setDiscoveryState(
      createTechnologyState({ id: "t1", regionId: "region_001" }),
      "better_farming_discovery",
      { status: "AVAILABLE" },
    );
    const worseRecipe: ProductionRecipe = {
      productionMethodId: "worse_farming",
      employeesPerBatch: 1,
      resourceInputsPerBatch: { grain: 10 },
      goodInputsPerBatch: {},
      goodOutputsPerBatch: { flour: 6 },
      eligibleCompanyArchetypeIds: [],
    };

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
    expect(technologyState.discoveries.better_farming_discovery?.industryAdoption).toBe(0);
  });
});
