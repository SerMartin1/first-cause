/**
 * Entity construction invariant helpers (Entity Data Model SS1 rule 9:
 * "no NaN, Infinity, negative stocks, dangling refs").
 *
 * Deliberately a small local copy of the same assertions in
 * `packages/simulation/src/core/validation.ts`, not a shared import:
 * `packages/entities` must stay free of a *production* dependency on
 * `packages/simulation`, because the Simulation Core will need to import
 * entity types the other way (M5+ systems operate on `Company`,
 * `ResourceDeposit`, ...). Importing simulation's core utils here would
 * set up that future cycle today. If a real shared need emerges, unify
 * both into `packages/shared` then -- not preemptively now.
 */
export class InvariantViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvariantViolationError";
  }
}

export function assertNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new InvariantViolationError(
      `${label} must be a finite number, got ${String(value)}`,
    );
  }
  if (value < 0) {
    throw new InvariantViolationError(`${label} must be >= 0, got ${String(value)}`);
  }
  return value;
}

export function assertPositive(value: number, label: string): number {
  assertNonNegative(value, label);
  if (value <= 0) {
    throw new InvariantViolationError(`${label} must be > 0, got ${String(value)}`);
  }
  return value;
}

export function assertNonEmpty(value: string, label: string): string {
  if (value.length === 0) {
    throw new InvariantViolationError(`${label} must not be empty`);
  }
  return value;
}
