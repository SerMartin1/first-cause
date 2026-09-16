import { describe, expect, it } from "vitest";
import { fnv1a32, toHex32 } from "./hash.js";

describe("fnv1a32", () => {
  it("is deterministic for the same input", () => {
    expect(fnv1a32("first-cause")).toBe(fnv1a32("first-cause"));
  });

  it("produces different hashes for different inputs (no trivial collisions)", () => {
    const inputs = ["a", "b", "world_generation", "demography", "seed:1", "seed:2"];
    const hashes = new Set(inputs.map((input) => fnv1a32(input)));
    expect(hashes.size).toBe(inputs.length);
  });

  it("is sensitive to a different seed for the same input", () => {
    expect(fnv1a32("x", 1)).not.toBe(fnv1a32("x", 2));
  });

  it("always returns an unsigned 32-bit integer", () => {
    const hash = fnv1a32("anything");
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
    expect(Number.isInteger(hash)).toBe(true);
  });
});

describe("toHex32", () => {
  it("pads to 8 hex characters", () => {
    expect(toHex32(0)).toBe("00000000");
    expect(toHex32(255)).toBe("000000ff");
    expect(toHex32(0xffffffff)).toBe("ffffffff");
  });
});
