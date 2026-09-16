import { describe, expect, it } from "vitest";
import {
  InvariantViolationError,
  assertNonEmpty,
  assertNonNegative,
  assertPositive,
} from "./validation.js";

describe("entities/core/validation", () => {
  it("assertNonNegative rejects negative/NaN/Infinity", () => {
    expect(assertNonNegative(0, "x")).toBe(0);
    expect(() => assertNonNegative(-1, "x")).toThrow(InvariantViolationError);
    expect(() => assertNonNegative(NaN, "x")).toThrow(InvariantViolationError);
    expect(() => assertNonNegative(Infinity, "x")).toThrow(InvariantViolationError);
  });

  it("assertPositive rejects zero", () => {
    expect(assertPositive(1, "x")).toBe(1);
    expect(() => assertPositive(0, "x")).toThrow(InvariantViolationError);
  });

  it("assertNonEmpty rejects an empty string", () => {
    expect(assertNonEmpty("a", "x")).toBe("a");
    expect(() => assertNonEmpty("", "x")).toThrow(InvariantViolationError);
  });
});
