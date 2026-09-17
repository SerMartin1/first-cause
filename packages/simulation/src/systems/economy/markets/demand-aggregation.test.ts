import { describe, expect, it } from "vitest";
import { InvariantViolationError } from "../../../core/validation.js";
import { aggregateDemand } from "./demand-aggregation.js";

describe("aggregateDemand", () => {
  it("sums every named demand source", () => {
    expect(aggregateDemand({ households: 10, companies: 5, export: 2 })).toBe(17);
  });

  it("returns 0 for no sources", () => {
    expect(aggregateDemand({})).toBe(0);
  });

  it("fails loud on a negative source instead of silently dropping it", () => {
    expect(() => aggregateDemand({ households: 10, companies: -1 })).toThrow(
      InvariantViolationError,
    );
  });
});
