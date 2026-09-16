import { assertInteger, assertSafeInteger } from "./validation.js";

/**
 * Simulation clock: `tick` is an integer counter (Technology Stack
 * Decision SS31); the calendar date is always derived from
 * `(startYear, startMonth, tick)`, never from `Date.now()` (SAVE-004).
 * 1 tick = 1 month (SIM-001).
 */
export interface CalendarDate {
  readonly year: number;
  /** 1-12. */
  readonly month: number;
}

export function tickToDate(
  startYear: number,
  startMonth: number,
  tick: number,
): CalendarDate {
  assertInteger(startYear, "tickToDate(startYear)");
  assertInteger(startMonth, "tickToDate(startMonth)");
  if (startMonth < 1 || startMonth > 12) {
    throw new RangeError(`tickToDate: startMonth must be 1-12, got ${startMonth}`);
  }
  assertInteger(tick, "tickToDate(tick)");
  if (tick < 0) {
    throw new RangeError(`tickToDate: tick must be >= 0, got ${tick}`);
  }

  const totalMonthsFromEpoch = startMonth - 1 + tick;
  const year = startYear + Math.floor(totalMonthsFromEpoch / 12);
  const month = (totalMonthsFromEpoch % 12) + 1;
  return { year, month };
}

export interface SimulationClockState {
  readonly startYear: number;
  readonly startMonth: number;
  readonly tick: number;
}

export interface SimulationClockConfig {
  readonly startYear: number;
  /** 1-12, defaults to 1 (January). */
  readonly startMonth?: number;
}

export class SimulationClock {
  private readonly startYear: number;
  private readonly startMonth: number;
  private currentTick: number;

  constructor(config: SimulationClockConfig) {
    this.startYear = assertInteger(config.startYear, "SimulationClock.startYear");
    this.startMonth = config.startMonth ?? 1;
    if (this.startMonth < 1 || this.startMonth > 12) {
      throw new RangeError(
        `SimulationClock: startMonth must be 1-12, got ${this.startMonth}`,
      );
    }
    this.currentTick = 0;
  }

  get tick(): number {
    return this.currentTick;
  }

  get date(): CalendarDate {
    return tickToDate(this.startYear, this.startMonth, this.currentTick);
  }

  /** Advances the clock by `count` ticks (default 1) and returns the new tick. */
  advance(count = 1): number {
    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError(
        `SimulationClock.advance: count must be a positive integer, got ${count}`,
      );
    }
    this.currentTick = assertSafeInteger(
      this.currentTick + count,
      "SimulationClock.tick",
    );
    return this.currentTick;
  }

  getState(): SimulationClockState {
    return {
      startYear: this.startYear,
      startMonth: this.startMonth,
      tick: this.currentTick,
    };
  }

  static fromState(state: SimulationClockState): SimulationClock {
    const clock = new SimulationClock({
      startYear: state.startYear,
      startMonth: state.startMonth,
    });
    if (state.tick > 0) {
      clock.advance(state.tick);
    }
    return clock;
  }
}
