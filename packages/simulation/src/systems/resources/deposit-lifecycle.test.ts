import { describe, expect, it } from "vitest";
import { createResourceDeposit } from "@first-cause/entities";
import { discoverDeposit } from "./deposit-lifecycle.js";

function buildHiddenIronOre() {
  return createResourceDeposit({
    id: "deposit_001",
    resourceDefinitionId: "iron_ore",
    regionId: "region_001",
    initialQuantity: 1000,
    renewable: false,
  });
}

describe("discoverDeposit (discovery boundary: TECH-009)", () => {
  it("the deposit exists physically before discovery", () => {
    const deposit = buildHiddenIronOre();
    expect(deposit.discovery.status).toBe("UNKNOWN");
    expect(deposit.stock.quantity).toBe(1000);
  });

  it("advances UNKNOWN -> SUSPECTED and emits no fact (not a listed CE-01 fact type)", () => {
    const deposit = buildHiddenIronOre();
    const result = discoverDeposit(deposit, {
      tick: 5,
      targetStatus: "SUSPECTED",
      confidence: 0.3,
    });

    expect(result.deposit.discovery.status).toBe("SUSPECTED");
    expect(result.deposit.discovery.discoveredTick).toBe(5);
    expect(result.facts).toEqual([]);
  });

  it("advances to DISCOVERED and emits resource_discovered", () => {
    const deposit = buildHiddenIronOre();
    const result = discoverDeposit(deposit, {
      tick: 5,
      targetStatus: "DISCOVERED",
      discoveredByEntityId: "cohort_001",
      confidence: 0.8,
    });

    expect(result.deposit.discovery.status).toBe("DISCOVERED");
    expect(result.deposit.discovery.discoveredByEntityId).toBe("cohort_001");
    expect(result.facts).toEqual([
      {
        type: "resource_discovered",
        subject: { entityType: "resourceDeposit", entityId: "deposit_001" },
        location: { regionId: "region_001" },
        values: { before: "UNKNOWN", after: "DISCOVERED" },
      },
    ]);
  });

  it("advances to ASSESSED and emits resource_assessed", () => {
    const deposit = buildHiddenIronOre();
    const discovered = discoverDeposit(deposit, {
      tick: 5,
      targetStatus: "DISCOVERED",
      confidence: 0.8,
    }).deposit;
    const result = discoverDeposit(discovered, {
      tick: 6,
      targetStatus: "ASSESSED",
      confidence: 1,
    });

    expect(result.deposit.discovery.status).toBe("ASSESSED");
    expect(result.facts[0]?.type).toBe("resource_assessed");
  });

  it("never regresses: re-targeting an earlier status is a no-op", () => {
    const deposit = buildHiddenIronOre();
    const discovered = discoverDeposit(deposit, {
      tick: 5,
      targetStatus: "DISCOVERED",
      confidence: 0.8,
    }).deposit;
    const result = discoverDeposit(discovered, {
      tick: 9,
      targetStatus: "SUSPECTED",
      confidence: 0.9,
    });

    expect(result.deposit).toBe(discovered);
    expect(result.facts).toEqual([]);
  });

  it("does not force a mine/extraction just because a deposit was discovered", () => {
    const deposit = buildHiddenIronOre();
    const result = discoverDeposit(deposit, {
      tick: 5,
      targetStatus: "DISCOVERED",
      confidence: 0.8,
    });
    expect(result.deposit.extraction.currentExtraction).toBe(0);
    expect(result.deposit.stock.quantity).toBe(1000);
  });

  it("rejects an out-of-range confidence", () => {
    const deposit = buildHiddenIronOre();
    expect(() =>
      discoverDeposit(deposit, { tick: 5, targetStatus: "DISCOVERED", confidence: 1.5 }),
    ).toThrow(RangeError);
  });
});
