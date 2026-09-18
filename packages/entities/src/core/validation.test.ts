import { describe, expect, it } from "vitest";
import {
  InvariantViolationError,
  assertFiniteDeep,
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

  describe("assertFiniteDeep (audit P1-05)", () => {
    it("accepts a nested object/array tree of only finite numbers and non-numbers", () => {
      expect(() =>
        assertFiniteDeep(
          { a: 1, b: { c: [2, 3, { d: "text", e: undefined, f: null }] } },
          "root",
        ),
      ).not.toThrow();
    });

    it("rejects a NaN buried several levels deep", () => {
      expect(() => assertFiniteDeep({ a: { b: [1, 2, { c: NaN }] } }, "root")).toThrow(
        /root\.a\.b\[2\]\.c must be a finite number/,
      );
    });

    it("rejects Infinity at the top level", () => {
      expect(() => assertFiniteDeep(Infinity, "root.value")).toThrow(
        InvariantViolationError,
      );
    });

    it("does not descend into non-plain values it can't usefully walk (strings, booleans, null)", () => {
      expect(() => assertFiniteDeep("NaN", "root")).not.toThrow(); // the literal string, not the number
      expect(() => assertFiniteDeep(null, "root")).not.toThrow();
      expect(() => assertFiniteDeep(true, "root")).not.toThrow();
    });
  });
});
