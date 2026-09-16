import {
  CommandBoundary,
  createCommandBoundary,
  type CommandBoundaryState,
} from "./commands.js";
import { computeChecksum } from "./checksum.js";
import {
  type RngStream,
  type WorldRng,
  createWorldRng,
  type RngStreamName,
  type WorldRngState,
  type WorldSeed,
} from "./rng.js";
import { SimulationClock, type CalendarDate, type SimulationClockState } from "./time.js";

/**
 * Minimal headless runner (Technology Stack Decision SS93): wires the
 * deterministic clock, RNG and command boundary together so they can be
 * exercised end-to-end (10 000-tick reproducibility, save/restore
 * roundtrip, x1-vs-batch equivalence) before any World State or domain
 * system exists. No gameplay logic lives here -- see M1's "Poza
 * zakresem" in the roadmap.
 */
export interface HeadlessRunnerConfig {
  readonly worldSeed: WorldSeed;
  readonly startYear: number;
  /** 1-12, defaults to 1 (January). */
  readonly startMonth?: number;
}

export interface HeadlessRunnerState {
  readonly worldSeed: WorldSeed;
  readonly clock: SimulationClockState;
  readonly rng: WorldRngState;
  readonly commandBoundary: CommandBoundaryState<unknown>;
}

export class HeadlessRunner {
  readonly worldSeed: WorldSeed;
  private clock: SimulationClock;
  private rng: WorldRng;
  private commandBoundary: CommandBoundary<unknown>;

  constructor(config: HeadlessRunnerConfig) {
    this.worldSeed = config.worldSeed;
    this.clock = new SimulationClock(
      config.startMonth === undefined
        ? { startYear: config.startYear }
        : { startYear: config.startYear, startMonth: config.startMonth },
    );
    this.rng = createWorldRng(config.worldSeed);
    this.commandBoundary = createCommandBoundary<unknown>();
  }

  get tick(): number {
    return this.clock.tick;
  }

  get date(): CalendarDate {
    return this.clock.date;
  }

  get pendingCommandCount(): number {
    return this.commandBoundary.pendingCount;
  }

  enqueueCommand(scheduledForTick: number, command: unknown): void {
    this.commandBoundary.enqueue(scheduledForTick, command);
  }

  rngStream(name: RngStreamName, scopeId?: string): RngStream {
    return this.rng.stream(name, scopeId);
  }

  /**
   * Advances exactly one tick: drains commands due at the current tick
   * boundary (no consumer wired yet -- M1 has no domain systems to hand
   * them to), then advances the clock. Proves the SAVE-006 contract
   * ("commands apply only at a tick boundary") ahead of any real
   * command type existing.
   */
  step(): void {
    this.commandBoundary.drain(this.clock.tick);
    this.clock.advance();
  }

  runTicks(count: number): void {
    for (let i = 0; i < count; i++) {
      this.step();
    }
  }

  getState(): HeadlessRunnerState {
    return {
      worldSeed: this.worldSeed,
      clock: this.clock.getState(),
      rng: this.rng.getState(),
      commandBoundary: this.commandBoundary.getState(),
    };
  }

  /** WorldChecksum (SAVE-010) over the full reconstructible core state. */
  checksum(): string {
    return computeChecksum(this.getState());
  }

  static fromState(state: HeadlessRunnerState): HeadlessRunner {
    const runner = new HeadlessRunner({
      worldSeed: state.worldSeed,
      startYear: state.clock.startYear,
      startMonth: state.clock.startMonth,
    });
    runner.clock = SimulationClock.fromState(state.clock);
    runner.rng = createWorldRng(state.worldSeed, state.rng);
    runner.commandBoundary = new CommandBoundary<unknown>(state.commandBoundary);
    return runner;
  }
}

export function createHeadlessRunner(config: HeadlessRunnerConfig): HeadlessRunner {
  return new HeadlessRunner(config);
}
