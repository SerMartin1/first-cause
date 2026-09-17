import { describe, expect, it } from "vitest";
import {
  InvariantViolationError,
  MONEY_SCALE,
  fromMoneyMinorUnits,
  roundHalfEven,
  roundMoney,
  toMoneyMinorUnits,
} from "./index.js";

describe("roundHalfEven", () => {
  it("rounds non-half values normally", () => {
    expect(roundHalfEven(2.2)).toBe(2);
    expect(roundHalfEven(2.7)).toBe(3);
    expect(roundHalfEven(-2.2)).toBe(-2);
  });

  it("rounds exact halves to the nearest even integer", () => {
    expect(roundHalfEven(2.5)).toBe(2);
    expect(roundHalfEven(3.5)).toBe(4);
    expect(roundHalfEven(-2.5)).toBe(-2);
    expect(roundHalfEven(-3.5)).toBe(-4);
  });

  it("does not accumulate systematic bias over many half-value roundings", () => {
    let total = 0;
    for (let i = 0; i < 1000; i++) {
      total += roundHalfEven(i + 0.5);
    }
    // Round-half-up over 0.5..999.5 would total 500 more than the exact sum;
    // round-half-to-even keeps the accumulated rounding error near zero.
    const exactSum = (999 * 1000) / 2 + 1000 * 0.5;
    expect(Math.abs(total - exactSum)).toBeLessThan(1);
  });
});

describe("money minor units", () => {
  it("MONEY_SCALE is 100 (2 decimal places)", () => {
    expect(MONEY_SCALE).toBe(100);
  });

  it("converts major-unit amounts to integer minor units", () => {
    expect(toMoneyMinorUnits(12.34)).toBe(1234);
    expect(toMoneyMinorUnits(0)).toBe(0);
    expect(toMoneyMinorUnits(1)).toBe(100);
  });

  it("roundtrips through fromMoneyMinorUnits", () => {
    expect(fromMoneyMinorUnits(toMoneyMinorUnits(9.99))).toBeCloseTo(9.99, 6);
  });

  it("rejects non-finite input", () => {
    expect(() => toMoneyMinorUnits(NaN)).toThrow(InvariantViolationError);
  });

  it("rejects amounts that would overflow a safe integer in minor units", () => {
    expect(() => toMoneyMinorUnits(Number.MAX_SAFE_INTEGER)).toThrow(
      InvariantViolationError,
    );
  });
});

describe("roundMoney", () => {
  it("snaps a money value to the nearest cent (regression guard: 999.916 must become 999.92)", () => {
    expect(roundMoney(999.916)).toBe(999.92);
  });

  it("is idempotent -- rounding an already cent-aligned value changes nothing", () => {
    expect(roundMoney(roundMoney(12.34))).toBe(12.34);
  });

  it("rejects non-finite input the same way toMoneyMinorUnits does", () => {
    expect(() => roundMoney(NaN)).toThrow(InvariantViolationError);
  });
});
