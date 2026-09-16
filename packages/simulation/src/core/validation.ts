/**
 * Determinism/invariant assertion helpers shared by the rest of
 * `core/*` and by every later Simulation Core system (SIM-004: every
 * mutation is READ -> CALCULATE -> VALIDATE -> COMMIT -> EMIT FACTS).
 *
 * These throw rather than silently clamp/repair, so a violated
 * invariant fails a test/tick loudly instead of quietly corrupting
 * World State.
 */
export class InvariantViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvariantViolationError";
  }
}

export function assertFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new InvariantViolationError(
      `${label} must be a finite number, got ${String(value)}`,
    );
  }
  return value;
}

export function assertNonNegative(value: number, label: string): number {
  assertFinite(value, label);
  if (value < 0) {
    throw new InvariantViolationError(`${label} must be >= 0, got ${String(value)}`);
  }
  return value;
}

export function assertSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new InvariantViolationError(
      `${label} must be a safe integer, got ${String(value)}`,
    );
  }
  return value;
}

export function assertInteger(value: number, label: string): number {
  assertFinite(value, label);
  if (!Number.isInteger(value)) {
    throw new InvariantViolationError(
      `${label} must be an integer, got ${String(value)}`,
    );
  }
  return value;
}
