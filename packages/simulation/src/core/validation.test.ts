import { describe, expect, it } from "vitest";
import {
  InvariantViolationError,
  assertFinite,
  assertInteger,
  assertNonNegative,
  assertPositive,
  assertSafeInteger,
} from "./validation.js";

describe("validation", () => {
  it("assertFinite accepts finite numbers and rejects NaN/Infinity", () => {
    expect(assertFinite(1.5, "x")).toBe(1.5);
    expect(() => assertFinite(NaN, "x")).toThrow(InvariantViolationError);
    expect(() => assertFinite(Infinity, "x")).toThrow(InvariantViolationError);
    expect(() => assertFinite(-Infinity, "x")).toThrow(InvariantViolationError);
  });

  it("assertNonNegative rejects negative numbers", () => {
    expect(assertNonNegative(0, "x")).toBe(0);
    expect(() => assertNonNegative(-1, "x")).toThrow(InvariantViolationError);
  });

  it("assertPositive rejects zero and negative numbers", () => {
    expect(assertPositive(0.01, "x")).toBe(0.01);
    expect(() => assertPositive(0, "x")).toThrow(InvariantViolationError);
    expect(() => assertPositive(-1, "x")).toThrow(InvariantViolationError);
  });

  it("assertSafeInteger rejects non-integers and unsafe magnitudes", () => {
    expect(assertSafeInteger(42, "x")).toBe(42);
    expect(() => assertSafeInteger(1.5, "x")).toThrow(InvariantViolationError);
    expect(() => assertSafeInteger(Number.MAX_SAFE_INTEGER + 1, "x")).toThrow(
      InvariantViolationError,
    );
  });

  it("assertInteger rejects fractional finite numbers", () => {
    expect(assertInteger(-5, "x")).toBe(-5);
    expect(() => assertInteger(1.1, "x")).toThrow(InvariantViolationError);
  });
});
