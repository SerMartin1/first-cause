import { describe, expect, it } from "vitest";
import { canonicalStringify } from "./serialization.js";

describe("canonicalStringify", () => {
  it("sorts object keys regardless of insertion order", () => {
    const a = canonicalStringify({ b: 1, a: 2, c: 3 });
    const b = canonicalStringify({ c: 3, a: 2, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":2,"b":1,"c":3}');
  });

  it("preserves array order (arrays are already stable)", () => {
    expect(canonicalStringify([3, 1, 2])).toBe("[3,1,2]");
  });

  it("sorts Map entries by key regardless of insertion order", () => {
    const m1 = new Map([
      ["z", 1],
      ["a", 2],
    ]);
    const m2 = new Map([
      ["a", 2],
      ["z", 1],
    ]);
    expect(canonicalStringify(m1)).toBe(canonicalStringify(m2));
  });

  it("sorts Set values regardless of insertion order", () => {
    const s1 = new Set([3, 1, 2]);
    const s2 = new Set([1, 2, 3]);
    expect(canonicalStringify(s1)).toBe(canonicalStringify(s2));
  });

  it("omits undefined object fields", () => {
    expect(canonicalStringify({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it("nests correctly through objects/arrays/Map/Set", () => {
    const value = {
      regions: [
        { id: "r2", deposits: new Set(["iron", "coal"]) },
        { id: "r1", deposits: new Set(["fish"]) },
      ],
      index: new Map([
        ["r1", 0],
        ["r2", 1],
      ]),
    };
    const result = canonicalStringify(value);
    expect(result).toBe(
      '{"index":{"__type":"Map","entries":[["r1",0],["r2",1]]},"regions":[{"deposits":{"__type":"Set","values":["coal","iron"]},"id":"r2"},{"deposits":{"__type":"Set","values":["fish"]},"id":"r1"}]}',
    );
  });

  it("rejects non-finite numbers instead of silently coercing to null", () => {
    expect(() => canonicalStringify({ a: NaN })).toThrow();
    expect(() => canonicalStringify({ a: Infinity })).toThrow();
  });

  it("is stable across repeated calls with structurally-equal but freshly-built values", () => {
    const build = () => ({ x: 1, y: [1, 2, { z: "value" }], m: new Map([["k", 1]]) });
    expect(canonicalStringify(build())).toBe(canonicalStringify(build()));
  });
});
