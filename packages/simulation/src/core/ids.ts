import { assertSafeInteger } from "./validation.js";

/**
 * Deterministic, stable entity IDs (Save/Determinism Spec SS18): a
 * monotonic per-prefix counter, never `crypto.randomUUID()` or a hash of
 * anything non-deterministic (SAVE-004). See ADR-001 SS3.
 *
 * One generator per ID domain (e.g. `company`, `region`) -- created by
 * the domain that owns it (M3+). M1 ships only the generic mechanism.
 */
export interface IdGeneratorState {
  readonly prefix: string;
  readonly nextValue: number;
}

export class IdGenerator {
  private readonly prefix: string;
  private nextValue: number;

  constructor(prefix: string, startAt = 0) {
    this.prefix = prefix;
    this.nextValue = assertSafeInteger(startAt, `IdGenerator(${prefix}).startAt`);
  }

  next(): string {
    const value = this.nextValue;
    this.nextValue = assertSafeInteger(
      this.nextValue + 1,
      `IdGenerator(${this.prefix}).nextValue`,
    );
    return `${this.prefix}_${String(value).padStart(6, "0")}`;
  }

  getState(): IdGeneratorState {
    return { prefix: this.prefix, nextValue: this.nextValue };
  }

  static fromState(state: IdGeneratorState): IdGenerator {
    return new IdGenerator(state.prefix, state.nextValue);
  }
}

export function createIdGenerator(prefix: string): IdGenerator {
  return new IdGenerator(prefix);
}
