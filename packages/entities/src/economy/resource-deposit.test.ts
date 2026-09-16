import { describe, expect, it } from "vitest";
import { createResourceDeposit } from "./resource-deposit.js";

describe("createResourceDeposit", () => {
  it("starts UNKNOWN, undiscovered, with quantity == initialQuantity", () => {
    const deposit = createResourceDeposit({
      id: "deposit_001",
      resourceDefinitionId: "iron_ore",
      regionId: "region_001",
      initialQuantity: 1000,
      renewable: false,
    });

    expect(deposit.discovery.status).toBe("UNKNOWN");
    expect(deposit.stock.quantity).toBe(1000);
    expect(deposit.stock.initialQuantity).toBe(1000);
    expect(deposit.depleted).toBe(false);
    expect(deposit.renewableState).toBeUndefined();
  });

  it("rejects a negative initialQuantity", () => {
    expect(() =>
      createResourceDeposit({
        id: "deposit_001",
        resourceDefinitionId: "iron_ore",
        regionId: "region_001",
        initialQuantity: -1,
        renewable: false,
      }),
    ).toThrow();
  });

  it("requires renewableState for a renewable deposit", () => {
    expect(() =>
      createResourceDeposit({
        id: "deposit_001",
        resourceDefinitionId: "fish",
        regionId: "region_001",
        initialQuantity: 500,
        renewable: true,
      }),
    ).toThrow(RangeError);
  });

  it("accepts a renewable deposit with renewableState", () => {
    const deposit = createResourceDeposit({
      id: "deposit_001",
      resourceDefinitionId: "fish",
      regionId: "region_001",
      initialQuantity: 500,
      renewable: true,
      renewableState: { regenerationRate: 0.1, sustainableYield: 50 },
    });
    expect(deposit.renewableState).toEqual({
      regenerationRate: 0.1,
      sustainableYield: 50,
    });
  });
});
