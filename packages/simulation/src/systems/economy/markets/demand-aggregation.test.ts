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

  it("gives the exact same result for the same sources regardless of insertion order (regression guard, audit P0-03)", () => {
    // Values chosen so a naive Object.entries insertion-order sum is
    // genuinely associativity-sensitive in IEEE754 -- this is not a
    // hypothetical: (0.1+0.2)+0.3 !== (0.3+0.2)+0.1 in plain JS.
    const insertedAscending = aggregateDemand({ a: 0.1, b: 0.2, c: 0.3 });
    const insertedDescending = aggregateDemand({ c: 0.3, b: 0.2, a: 0.1 });

    expect(insertedDescending).toBe(insertedAscending);
  });
});
