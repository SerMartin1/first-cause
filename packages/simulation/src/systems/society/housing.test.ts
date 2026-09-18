import { describe, expect, it } from "vitest";
import { createSettlement, type Settlement } from "@first-cause/entities";
import {
  adjustHousingCost,
  computeHousingPressure,
  growHousingCapacity,
  updateSettlementHousing,
} from "./housing.js";

describe("growHousingCapacity", () => {
  it("grows toward population * margin, capped by the construction rate (does not jump straight to target)", () => {
    const next = growHousingCapacity({
      currentCapacity: 0,
      population: 1000,
      availableConstructionLabor: 1_000_000,
    });
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1000 * 1.2); // target margin, not reached in one tick
  });

  it("never exceeds the target even asymptotically over many ticks", () => {
    let capacity = 0;
    for (let i = 0; i < 500; i++) {
      capacity = growHousingCapacity({
        currentCapacity: capacity,
        population: 1000,
        availableConstructionLabor: 1_000_000,
      });
    }
    expect(capacity).toBeLessThanOrEqual(1000 * 1.2);
    expect(capacity).toBeGreaterThan(1000); // converged close to the target after enough ticks
  });

  it("never shrinks when population (and thus the target) drops below current capacity", () => {
    const shrunkTarget = growHousingCapacity({
      currentCapacity: 500,
      population: 10,
      availableConstructionLabor: 1_000_000,
    });
    expect(shrunkTarget).toBe(500); // built housing is never torn down by this system
  });

  it("never grows without idle labor to build it, even with huge unmet demand (audit P1-03, no free creation)", () => {
    const next = growHousingCapacity({
      currentCapacity: 0,
      population: 1000,
      availableConstructionLabor: 0,
    });
    expect(next).toBe(0);
  });

  it("caps growth at the available idle labor when it is scarcer than the construction-rate pace", () => {
    const withLabor = growHousingCapacity({
      currentCapacity: 0,
      population: 1000,
      availableConstructionLabor: 1_000_000,
    });
    const laborLimited = growHousingCapacity({
      currentCapacity: 0,
      population: 1000,
      availableConstructionLabor: 1,
    });
    expect(laborLimited).toBe(1);
    expect(laborLimited).toBeLessThan(withLabor);
  });
});

describe("computeHousingPressure", () => {
  it("is zero when population fits within capacity, even exactly at the limit", () => {
    expect(computeHousingPressure({ population: 100, capacity: 100 })).toBe(0);
    expect(computeHousingPressure({ population: 50, capacity: 100 })).toBe(0);
  });

  it("is the excess ratio when population exceeds capacity", () => {
    expect(computeHousingPressure({ population: 150, capacity: 100 })).toBe(0.5);
  });

  it("is maximal (1) when there is no capacity at all but real population exists", () => {
    expect(computeHousingPressure({ population: 10, capacity: 0 })).toBe(1);
  });

  it("is zero for an empty, capacity-less settlement (no crisis with nobody there)", () => {
    expect(computeHousingPressure({ population: 0, capacity: 0 })).toBe(0);
  });
});

describe("adjustHousingCost", () => {
  it("rises when pressure rises, but does not jump straight to the target (EMA smoothing)", () => {
    const next = adjustHousingCost({ currentCost: 1, pressure: 1 });
    const target = 1 + 1 * 20; // HOUSING_COST_BASELINE + pressure * HOUSING_COST_PRESSURE_WEIGHT
    expect(next).toBeGreaterThan(1);
    expect(next).toBeLessThan(target);
  });

  it("settles back toward the baseline once pressure returns to zero", () => {
    let cost = 21; // high, post-crisis
    for (let i = 0; i < 100; i++) {
      cost = adjustHousingCost({ currentCost: cost, pressure: 0 });
    }
    expect(cost).toBeCloseTo(1, 5);
  });
});

function buildSettlement(overrides: Partial<Settlement> = {}): Settlement {
  return {
    ...createSettlement({
      id: "settlement_test",
      regionId: "region_test",
      name: "Test Settlement",
      foundedTick: 0,
    }),
    ...overrides,
  };
}

describe("updateSettlementHousing (FC-SETTLEMENT-003, urban crisis)", () => {
  it("emits housing_pressure_started exactly on the 0 -> positive transition, not on every pressured tick", () => {
    const settlement = buildSettlement();

    const first = updateSettlementHousing({
      settlement,
      population: 1000,
      availableConstructionLabor: 1_000_000,
    });
    expect(first.housing.pressure).toBeGreaterThan(0); // capacity starts at 0, huge instant overcrowding
    expect(first.facts.some((f) => f.type === "housing_pressure_started")).toBe(true);

    const settlementAfterFirst = { ...settlement, housing: first.housing };
    const second = updateSettlementHousing({
      settlement: settlementAfterFirst,
      population: 1000,
      availableConstructionLabor: 1_000_000,
    });
    expect(second.facts.some((f) => f.type === "housing_pressure_started")).toBe(false);
  });

  it("a sudden population spike outpaces construction, producing real overcrowding pressure this same tick", () => {
    // Osada w spokoju: capacity naturalnie dogoniła małą populację.
    let settlement = buildSettlement();
    for (let i = 0; i < 200; i++) {
      const result = updateSettlementHousing({
        settlement,
        population: 50,
        availableConstructionLabor: 1_000_000,
      });
      settlement = { ...settlement, housing: result.housing };
    }
    expect(settlement.housing.pressure).toBe(0);

    // Nagły skok populacji (np. fala migracji) -- budowa nie nadąża w jednym ticku.
    const crisis = updateSettlementHousing({
      settlement,
      population: 5000,
      availableConstructionLabor: 1_000_000,
    });
    expect(crisis.housing.pressure).toBeGreaterThan(0);
  });
});
