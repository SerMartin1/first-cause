import { describe, expect, it } from "vitest";
import { createResourceDeposit } from "@first-cause/entities";
import { extractFromDeposit } from "./extraction.js";

function buildFiniteDeposit(initialQuantity = 100) {
  return createResourceDeposit({
    id: "deposit_001",
    resourceDefinitionId: "iron_ore",
    regionId: "region_001",
    initialQuantity,
    renewable: false,
  });
}

describe("extractFromDeposit -- physical invariants (rule 9, ECO-010)", () => {
  it("rejects a negative extraction amount", () => {
    expect(() =>
      extractFromDeposit(buildFiniteDeposit(), { tick: 0, amount: -1 }),
    ).toThrow();
  });

  it("never extracts more than exists (extraction cannot create resource)", () => {
    const deposit = buildFiniteDeposit(10);
    const result = extractFromDeposit(deposit, { tick: 0, amount: 1000 });

    expect(result.extracted).toBe(10);
    expect(result.deposit.stock.quantity).toBe(0);
  });

  it("stock quantity never goes negative across repeated extraction", () => {
    let deposit = buildFiniteDeposit(10);
    for (let i = 0; i < 5; i++) {
      deposit = extractFromDeposit(deposit, { tick: i, amount: 7 }).deposit;
      expect(deposit.stock.quantity).toBeGreaterThanOrEqual(0);
    }
  });

  it("finite deposits do not regenerate: quantity only ever decreases", () => {
    let deposit = buildFiniteDeposit(100);
    let previous = deposit.stock.quantity;
    for (let i = 0; i < 10; i++) {
      deposit = extractFromDeposit(deposit, { tick: i, amount: 5 }).deposit;
      expect(deposit.stock.quantity).toBeLessThanOrEqual(previous);
      previous = deposit.stock.quantity;
    }
  });

  it("conservation: cumulativeExtraction + remaining quantity always equals the initial quantity", () => {
    let deposit = buildFiniteDeposit(53);
    const amounts = [7, 12, 3, 40, 100, 0, 5];
    for (const amount of amounts) {
      deposit = extractFromDeposit(deposit, { tick: 0, amount }).deposit;
      expect(deposit.extraction.cumulativeExtraction + deposit.stock.quantity).toBe(53);
    }
  });
});

describe("extractFromDeposit -- depletion", () => {
  it("marks a finite deposit depleted and emits resource_depleted when quantity hits 0", () => {
    const result = extractFromDeposit(buildFiniteDeposit(10), { tick: 3, amount: 10 });

    expect(result.deposit.depleted).toBe(true);
    expect(result.facts.some((f) => f.type === "resource_depleted")).toBe(true);
  });

  it("extraction against an already-depleted deposit is a safe no-op", () => {
    const depleted = extractFromDeposit(buildFiniteDeposit(10), {
      tick: 0,
      amount: 10,
    }).deposit;
    const result = extractFromDeposit(depleted, { tick: 1, amount: 5 });

    expect(result.extracted).toBe(0);
    expect(result.deposit.stock.quantity).toBe(0);
  });
});

describe("extractFromDeposit -- extraction trend facts", () => {
  it("emits extraction_started on the first non-zero extraction", () => {
    const result = extractFromDeposit(buildFiniteDeposit(100), { tick: 0, amount: 10 });
    expect(result.facts).toEqual([
      {
        type: "extraction_started",
        subject: { entityType: "resourceDeposit", entityId: "deposit_001" },
        location: { regionId: "region_001" },
        values: { before: 0, after: 10, delta: 10 },
      },
    ]);
  });

  it("emits extraction_increased when the rate rises", () => {
    const first = extractFromDeposit(buildFiniteDeposit(100), {
      tick: 0,
      amount: 10,
    }).deposit;
    const result = extractFromDeposit(first, { tick: 1, amount: 25 });
    expect(result.facts.map((f) => f.type)).toEqual(["extraction_increased"]);
  });

  it("emits extraction_decreased when the rate falls", () => {
    const first = extractFromDeposit(buildFiniteDeposit(100), {
      tick: 0,
      amount: 25,
    }).deposit;
    const result = extractFromDeposit(first, { tick: 1, amount: 10 });
    expect(result.facts.map((f) => f.type)).toEqual(["extraction_decreased"]);
  });

  it("emits no fact when the rate does not change", () => {
    const first = extractFromDeposit(buildFiniteDeposit(100), {
      tick: 0,
      amount: 10,
    }).deposit;
    const result = extractFromDeposit(first, { tick: 1, amount: 10 });
    expect(result.facts).toEqual([]);
  });
});
