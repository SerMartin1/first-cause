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
    // 5 then 15 out of 100: ratio stays at 0.80, above every reserve
    // milestone threshold -- isolates the rate signal from milestone facts.
    const first = extractFromDeposit(buildFiniteDeposit(100), {
      tick: 0,
      amount: 5,
    }).deposit;
    const result = extractFromDeposit(first, { tick: 1, amount: 15 });
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

describe("extractFromDeposit -- reserve milestones (M19 CH-03 resource_depletion_milestone)", () => {
  it("emits resource_reserve_milestone when a single extraction crosses one threshold", () => {
    // 100 -> 60: ratio 1.0 -> 0.6, crosses only the 0.75 threshold.
    const result = extractFromDeposit(buildFiniteDeposit(100), { tick: 0, amount: 40 });
    const milestones = result.facts.filter((f) => f.type === "resource_reserve_milestone");
    expect(milestones).toHaveLength(1);
    expect(milestones[0]).toMatchObject({
      subject: { entityType: "resourceDeposit", entityId: "deposit_001" },
      location: { regionId: "region_001" },
      values: { before: 1, after: 0.75 },
    });
  });

  it("emits one fact per threshold crossed when a single large extraction skips over several", () => {
    // 100 -> 5: ratio 1.0 -> 0.05, crosses 0.75, 0.5, 0.25 and 0.1 all at once.
    const result = extractFromDeposit(buildFiniteDeposit(100), { tick: 0, amount: 95 });
    const milestones = result.facts.filter((f) => f.type === "resource_reserve_milestone");
    expect(milestones.map((f) => f.values.after)).toEqual([0.75, 0.5, 0.25, 0.1]);
  });

  it("does not re-fire a threshold once already crossed, even across many later calls", () => {
    let deposit = extractFromDeposit(buildFiniteDeposit(100), { tick: 0, amount: 40 }).deposit; // crosses 0.75
    for (let tick = 1; tick <= 3; tick++) {
      const result = extractFromDeposit(deposit, { tick, amount: 0 });
      deposit = result.deposit;
      expect(result.facts.filter((f) => f.type === "resource_reserve_milestone")).toEqual([]);
    }
  });

  it("never fires for a renewable deposit", () => {
    const renewable = createResourceDeposit({
      id: "deposit_renewable",
      resourceDefinitionId: "timber",
      regionId: "region_001",
      initialQuantity: 100,
      renewable: true,
      renewableState: { regenerationRate: 5, sustainableYield: 5, carryingCapacity: 100 },
    });
    const result = extractFromDeposit(renewable, { tick: 0, amount: 95 });
    expect(result.facts.filter((f) => f.type === "resource_reserve_milestone")).toEqual([]);
  });
});
