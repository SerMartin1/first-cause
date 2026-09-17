import { describe, expect, it } from "vitest";
import { InvariantViolationError } from "../../../core/validation.js";
import { classifyShortageSurplus } from "./shortage-surplus.js";

describe("classifyShortageSurplus", () => {
  it("reports 0 severity when supply alone already covers demand", () => {
    const result = classifyShortageSurplus({ supply: 10, demand: 8, inventory: 0 });
    expect(result.shortageSeverity).toBe(0);
    expect(result.effectiveSupply).toBe(10);
  });

  it("reports 0 severity for a surplus (FC-MARKET-002 setup: supply > demand)", () => {
    const result = classifyShortageSurplus({ supply: 20, demand: 5, inventory: 50 });
    expect(result.shortageSeverity).toBe(0);
    expect(result.effectiveSupply).toBeGreaterThan(20);
  });

  it("reports positive severity when demand exceeds buffered supply (FC-MARKET-001 setup: demand > supply)", () => {
    const result = classifyShortageSurplus({ supply: 5, demand: 10, inventory: 0 });
    expect(result.shortageSeverity).toBeGreaterThan(0);
    expect(result.shortageSeverity).toBeLessThanOrEqual(1);
  });

  it("dampens (but does not fully mask) a shortage using the inventory buffer", () => {
    const noBuffer = classifyShortageSurplus({ supply: 5, demand: 10, inventory: 0 });
    const withBuffer = classifyShortageSurplus({ supply: 5, demand: 10, inventory: 10 });
    expect(withBuffer.shortageSeverity).toBeLessThan(noBuffer.shortageSeverity);
    expect(withBuffer.shortageSeverity).toBeGreaterThanOrEqual(0);
  });

  it("caps severity at 1 for an extreme shortage", () => {
    const result = classifyShortageSurplus({ supply: 0, demand: 1000, inventory: 0 });
    expect(result.shortageSeverity).toBe(1);
  });

  it("treats zero demand as zero severity regardless of supply", () => {
    expect(
      classifyShortageSurplus({ supply: 0, demand: 0, inventory: 0 }).shortageSeverity,
    ).toBe(0);
  });

  it("fails loud on negative inputs", () => {
    expect(() =>
      classifyShortageSurplus({ supply: -1, demand: 1, inventory: 0 }),
    ).toThrow(InvariantViolationError);
  });
});
