import { fnv1a32 } from "./hash.js";

/**
 * Deterministic RNG core. Custom `xoshiro128**` implementation (no
 * third-party dependency -- Technology Stack Decision SS29), seeded per
 * named stream via `splitmix32`. See `docs/adr/ADR-001-m1-deterministic-core.md`
 * SS1/SS2 for the rationale.
 *
 * Every operation is 32-bit integer bitwise/`Math.imul` arithmetic, which
 * the ECMAScript spec defines exactly -- no floating-point divergence
 * between platforms/engines is possible here.
 */
export const RNG_ALGORITHM = "xoshiro128**" as const;
export const RNG_VERSION = 1 as const;

/** SAVE-003 canonical stream list. */
export const RNG_STREAM_NAMES = [
  "world_generation",
  "demography",
  "company_ai",
  "entrepreneurship",
  "migration",
  "discovery",
  "events",
  "naming",
] as const;

export type RngStreamName = (typeof RNG_STREAM_NAMES)[number];

/** Human-typeable/copyable (World Generation Spec SS50); normalized to a string for hashing. */
export type WorldSeed = string | number;

export interface RngStreamState {
  readonly s0: number;
  readonly s1: number;
  readonly s2: number;
  readonly s3: number;
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/**
 * SplitMix32: expands a single 32-bit seed into a sequence of
 * well-distributed 32-bit words, used only to seed xoshiro128**'s state
 * (avoids the low-quality all-zero/mostly-zero states a raw seed could
 * produce).
 */
function createSplitMix32(seed: number): () => number {
  let state = seed >>> 0;
  return function splitMix32Next(): number {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
    z = (z ^ (z >>> 15)) >>> 0;
    return z;
  };
}

function createStreamState(streamSeed: number): RngStreamState {
  const next = createSplitMix32(streamSeed);
  return { s0: next(), s1: next(), s2: next(), s3: next() };
}

function normalizeSeed(seed: WorldSeed): string {
  return typeof seed === "number" ? String(seed) : seed;
}

function deriveStreamSeed(
  worldSeed: WorldSeed,
  streamName: string,
  scopeId?: string,
): number {
  const key = `${normalizeSeed(worldSeed)}:${streamName}:${scopeId ?? ""}`;
  return fnv1a32(key);
}

/**
 * A single named, independently-advancing RNG stream (Save/Determinism
 * Spec SS13/SS14): advancing `demography` never shifts what `technology`
 * would produce.
 */
export class RngStream {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(state: RngStreamState) {
    this.s0 = state.s0 >>> 0;
    this.s1 = state.s1 >>> 0;
    this.s2 = state.s2 >>> 0;
    this.s3 = state.s3 >>> 0;
  }

  /** Raw 32-bit output, uniform over [0, 2^32). */
  nextUint32(): number {
    const s0 = this.s0;
    const s1 = this.s1;
    const s2 = this.s2;
    const s3 = this.s3;

    const result = Math.imul(rotl(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0;
    const t = (s1 << 9) >>> 0;

    const s2a = (s2 ^ s0) >>> 0;
    const s3a = (s3 ^ s1) >>> 0;
    const s1n = (s1 ^ s2a) >>> 0;
    const s0n = (s0 ^ s3a) >>> 0;
    const s2n = (s2a ^ t) >>> 0;
    const s3n = rotl(s3a, 11);

    this.s0 = s0n;
    this.s1 = s1n;
    this.s2 = s2n;
    this.s3 = s3n;

    return result;
  }

  /** Uniform float in [0, 1), full 32-bit resolution. */
  nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  /**
   * Unbiased uniform integer in [0, maxExclusive) via Lemire's rejection
   * sampling over 32-bit words -- never uses `% maxExclusive` directly on
   * the raw output, which would bias low values whenever maxExclusive
   * does not evenly divide 2^32.
   */
  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError(
        `nextInt: maxExclusive must be a positive integer, got ${String(maxExclusive)}`,
      );
    }
    const range = maxExclusive >>> 0;
    const threshold = (-range >>> 0) % range;
    let r = this.nextUint32();
    while (r < threshold) {
      r = this.nextUint32();
    }
    return r % range;
  }

  getState(): RngStreamState {
    return { s0: this.s0, s1: this.s1, s2: this.s2, s3: this.s3 };
  }

  setState(state: RngStreamState): void {
    this.s0 = state.s0 >>> 0;
    this.s1 = state.s1 >>> 0;
    this.s2 = state.s2 >>> 0;
    this.s3 = state.s3 >>> 0;
  }
}

export type WorldRngState = Readonly<Record<string, RngStreamState>>;

/**
 * Owns every named/scoped RNG stream for one world. Streams are created
 * lazily on first access, deterministically derived from
 * `(worldSeed, streamName, scopeId)` -- see ADR-001 SS2.
 */
export class WorldRng {
  private readonly worldSeed: WorldSeed;
  private readonly streams = new Map<string, RngStream>();

  constructor(worldSeed: WorldSeed, initialState?: WorldRngState) {
    this.worldSeed = worldSeed;
    if (initialState) {
      for (const [key, state] of Object.entries(initialState)) {
        this.streams.set(key, new RngStream(state));
      }
    }
  }

  stream(name: RngStreamName, scopeId?: string): RngStream {
    const key = scopeId ? `${name}:${scopeId}` : name;
    let existing = this.streams.get(key);
    if (!existing) {
      const seed = deriveStreamSeed(this.worldSeed, name, scopeId);
      existing = new RngStream(createStreamState(seed));
      this.streams.set(key, existing);
    }
    return existing;
  }

  /**
   * Snapshot of every stream touched so far. A stream never touched is
   * safely omitted: re-deriving it later from `worldSeed` on first
   * access produces the exact same initial state it would have had.
   */
  getState(): WorldRngState {
    const state: Record<string, RngStreamState> = {};
    for (const [key, stream] of this.streams) {
      state[key] = stream.getState();
    }
    return state;
  }
}

export function createWorldRng(
  worldSeed: WorldSeed,
  initialState?: WorldRngState,
): WorldRng {
  return new WorldRng(worldSeed, initialState);
}
