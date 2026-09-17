import { describe, expect, it } from "vitest";
import { sortedEntries } from "./determinism.js";

describe("sortedEntries", () => {
  it("returns entries in key order regardless of insertion order", () => {
    const a = sortedEntries({ c: 1, a: 2, b: 3 });
    const b = sortedEntries({ a: 2, b: 3, c: 1 });

    expect(a).toEqual([
      ["a", 2],
      ["b", 3],
      ["c", 1],
    ]);
    expect(a).toEqual(b);
  });

  it("is stable for a record with a single key", () => {
    expect(sortedEntries({ only: 1 })).toEqual([["only", 1]]);
  });

  it("returns an empty array for an empty record", () => {
    expect(sortedEntries({})).toEqual([]);
  });
});
