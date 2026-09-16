import { describe, expect, it } from "vitest";
import { RNG_ALGORITHM, RNG_STREAM_NAMES, RNG_VERSION, createWorldRng } from "./rng.js";

describe("RNG identity", () => {
  it("declares its algorithm and version (ADR-001)", () => {
    expect(RNG_ALGORITHM).toBe("xoshiro128**");
    expect(RNG_VERSION).toBe(1);
  });

  it("exposes exactly the SAVE-003 canonical stream names", () => {
    expect(RNG_STREAM_NAMES).toEqual([
      "world_generation",
      "demography",
      "company_ai",
      "entrepreneurship",
      "migration",
      "discovery",
      "events",
      "naming",
    ]);
  });
});

describe("RNG golden vectors (seed: 'golden-seed-1')", () => {
  it("demography.nextUint32() reproduces its recorded sequence", () => {
    const rng = createWorldRng("golden-seed-1");
    const stream = rng.stream("demography");
    const outputs = Array.from({ length: 5 }, () => stream.nextUint32());
    expect(outputs).toEqual([2209233686, 2069562544, 3375532090, 2393741803, 2528604312]);
  });

  it("company_ai.nextFloat() reproduces its recorded sequence, all in [0, 1)", () => {
    const rng = createWorldRng("golden-seed-1");
    const stream = rng.stream("company_ai");
    const outputs = Array.from({ length: 5 }, () => stream.nextFloat());
    expect(outputs).toEqual([
      0.5390944459941238, 0.7208935841917992, 0.7359782662242651, 0.195548580493778,
      0.8951810516882688,
    ]);
    for (const value of outputs) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("migration.nextInt(6) reproduces its recorded sequence and stays in range", () => {
    const rng = createWorldRng("golden-seed-1");
    const stream = rng.stream("migration");
    const outputs = Array.from({ length: 10 }, () => stream.nextInt(6));
    expect(outputs).toEqual([4, 0, 0, 4, 1, 3, 4, 5, 5, 5]);
    for (const value of outputs) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
    }
  });
});

describe("RNG determinism and stream independence", () => {
  it("same seed + same stream = same sequence", () => {
    const a = createWorldRng("seed-x").stream("naming");
    const b = createWorldRng("seed-x").stream("naming");
    expect(a.nextUint32()).toBe(b.nextUint32());
    expect(a.nextUint32()).toBe(b.nextUint32());
  });

  it("different seeds diverge", () => {
    const a = createWorldRng("seed-x").stream("naming");
    const b = createWorldRng("seed-y").stream("naming");
    expect(a.nextUint32()).not.toBe(b.nextUint32());
  });

  it("advancing one stream never affects another stream from the same world seed", () => {
    const rngA = createWorldRng("golden-seed-1");
    const untouchedFirst = rngA.stream("demography").nextUint32();

    const rngB = createWorldRng("golden-seed-1");
    rngB.stream("events").nextUint32();
    rngB.stream("events").nextUint32();
    rngB.stream("events").nextUint32();
    const stillFirst = rngB.stream("demography").nextUint32();

    expect(stillFirst).toBe(untouchedFirst);
  });

  it("scoped streams (per-region/per-actor) are independent of each other", () => {
    const rng = createWorldRng("golden-seed-1");
    const region1 = rng.stream("company_ai", "region-1").nextUint32();
    const region2 = rng.stream("company_ai", "region-2").nextUint32();
    expect(region1).not.toBe(region2);
  });

  it("numeric and equal-looking string seeds are treated identically", () => {
    const a = createWorldRng(42).stream("discovery").nextUint32();
    const b = createWorldRng("42").stream("discovery").nextUint32();
    expect(a).toBe(b);
  });
});

describe("RngStream.nextInt", () => {
  it("rejects a non-positive-integer bound", () => {
    const stream = createWorldRng("seed-z").stream("naming");
    expect(() => stream.nextInt(0)).toThrow(RangeError);
    expect(() => stream.nextInt(-1)).toThrow(RangeError);
    expect(() => stream.nextInt(1.5)).toThrow(RangeError);
  });

  it("stays within [0, maxExclusive) over many draws", () => {
    const stream = createWorldRng("seed-bounds").stream("naming");
    for (let i = 0; i < 1000; i++) {
      const value = stream.nextInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });
});

describe("RNG state save/restore", () => {
  it("continuing from a restored state matches an uninterrupted run", () => {
    const uninterrupted = createWorldRng("state-seed").stream("company_ai");
    const uninterruptedOutputs = Array.from({ length: 6 }, () =>
      uninterrupted.nextUint32(),
    );

    const first = createWorldRng("state-seed");
    first.stream("company_ai").nextUint32();
    first.stream("company_ai").nextUint32();
    first.stream("company_ai").nextUint32();
    const savedState = first.getState();

    const restored = createWorldRng("state-seed", savedState);
    const resumedOutputs = [
      restored.stream("company_ai").nextUint32(),
      restored.stream("company_ai").nextUint32(),
      restored.stream("company_ai").nextUint32(),
    ];

    expect(resumedOutputs).toEqual(uninterruptedOutputs.slice(3));
  });

  it("a stream never touched before save is unaffected by restore (lazy re-derivation)", () => {
    const first = createWorldRng("state-seed-2");
    first.stream("demography").nextUint32();
    const savedState = first.getState();

    const restored = createWorldRng("state-seed-2", savedState);
    const freshDirect = createWorldRng("state-seed-2").stream("events").nextUint32();
    const freshFromRestored = restored.stream("events").nextUint32();

    expect(freshFromRestored).toBe(freshDirect);
  });
});
