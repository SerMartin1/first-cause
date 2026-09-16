import { describe, expect, it } from "vitest";
import { createResourceDeposit } from "@first-cause/entities";
import { extractFromDeposit } from "./extraction.js";
import { regenerateDeposit } from "./renewable.js";

function buildRenewableDeposit(quantity = 1000) {
  return createResourceDeposit({
    id: "deposit_001",
    resourceDefinitionId: "grain",
    regionId: "region_001",
    initialQuantity: quantity,
    renewable: true,
    renewableState: {
      regenerationRate: 0.2,
      sustainableYield: 100,
      carryingCapacity: 2000,
    },
  });
}

describe("regenerateDeposit -- carrying capacity (World Generation Spec SS14)", () => {
  it("is a no-op for a non-renewable deposit", () => {
    const finite = createResourceDeposit({
      id: "deposit_002",
      resourceDefinitionId: "iron_ore",
      regionId: "region_001",
      initialQuantity: 100,
      renewable: false,
    });
    const result = regenerateDeposit(finite);
    expect(result.deposit).toBe(finite);
  });

  it("grows stock toward carryingCapacity but never exceeds it", () => {
    let deposit = buildRenewableDeposit(1900);
    for (let i = 0; i < 50; i++) {
      deposit = regenerateDeposit(deposit).deposit;
      expect(deposit.stock.quantity).toBeLessThanOrEqual(2000);
    }
  });

  it("never regenerates a depleted (quantity 0) deposit above 0", () => {
    let deposit = buildRenewableDeposit(0);
    for (let i = 0; i < 10; i++) {
      deposit = regenerateDeposit(deposit).deposit;
    }
    expect(deposit.stock.quantity).toBe(0);
  });
});

describe("renewable resources stabilize around a sustainable yield under constant demand (M5 Acceptance Gate)", () => {
  // regenerationRate=0.2, carryingCapacity=2000 => the logistic curve's peak
  // (maximum sustainable yield) is r*K/4 = 100, matching this deposit's
  // stated `sustainableYield`. Demand is deliberately held below that
  // peak (60 < 100): logistic-growth-with-harvesting has two equilibria,
  // and only the one below the peak converges to the *stable* (upper)
  // branch instead of the unstable one that collapses to 0.
  it("converges to a stable equilibrium instead of collapsing to 0 or growing unbounded", () => {
    let deposit = buildRenewableDeposit(1000);
    const constantDemand = 60;

    const quantities: number[] = [];
    for (let tick = 0; tick < 500; tick++) {
      deposit = extractFromDeposit(deposit, { tick, amount: constantDemand }).deposit;
      deposit = regenerateDeposit(deposit).deposit;
      quantities.push(deposit.stock.quantity);
    }

    const last20 = quantities.slice(-20);
    const min = Math.min(...last20);
    const max = Math.max(...last20);

    // Stabilized: the last 20 ticks vary by less than 1 unit.
    expect(max - min).toBeLessThan(1);
    // Neither collapsed nor pinned at the ceiling.
    expect(deposit.stock.quantity).toBeGreaterThan(0);
    expect(deposit.stock.quantity).toBeLessThan(2000);
  });
});
