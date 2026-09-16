import { describe, expect, it } from "vitest";
import { CHECKSUM_ALGORITHM, computeChecksum } from "./checksum.js";

describe("computeChecksum", () => {
  it("declares its algorithm/version (ADR-001 SS5)", () => {
    expect(CHECKSUM_ALGORITHM).toBe("fnv1a32x2-v1");
  });

  it("is deterministic for structurally-equal values", () => {
    const a = computeChecksum({ tick: 5, regions: ["r1", "r2"] });
    const b = computeChecksum({ regions: ["r1", "r2"], tick: 5 });
    expect(a).toBe(b);
  });

  it("changes when any value in the state changes", () => {
    const before = computeChecksum({ tick: 5 });
    const after = computeChecksum({ tick: 6 });
    expect(before).not.toBe(after);
  });

  it("is a 16 hex-character string (two concatenated 32-bit hashes)", () => {
    const checksum = computeChecksum({ anything: true });
    expect(checksum).toMatch(/^[0-9a-f]{16}$/);
  });
});
