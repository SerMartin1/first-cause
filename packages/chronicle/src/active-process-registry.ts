import type { ProcessLifecycleState } from "./types.js";

/**
 * Active Process Registry (Chronicle & Historical Significance Spec
 * SS121, SS34-38): tracks boom/bust/shortage/migration-wave/
 * transformation/recovery as long-lived state machines
 * (EMERGING -> CONFIRMED -> ONGOING -> RESOLVED -> HISTORICAL, SS34)
 * instead of one `ChronicleCandidate` per tick (SS64 "Update Existing
 * Entry"). This registry only holds the state machine; deciding WHEN a
 * process opens, renews or should be considered stale is each detector's
 * job (`candidate-pipeline.ts`).
 */
export interface ActiveProcess {
  readonly processKey: string;
  readonly processType: string;
  readonly state: ProcessLifecycleState;
  readonly startTick: number;
  readonly lastSignalTick: number;
  readonly rootFactId: string;
  readonly entryId: string | undefined;
  /**
   * Running total a detector accumulates across renewals via
   * `openOrRenew`'s `magnitudeIncrement` -- e.g. cumulative net migrants
   * for a `migration_wave` process. A detector that never passes an
   * increment (e.g. `shortage`, which only cares about lifecycle state)
   * simply leaves this at `0` -- it is never read for those processes.
   */
  readonly accumulatedMagnitude: number;
}

export class ActiveProcessRegistry {
  private readonly processes = new Map<string, ActiveProcess>();

  get(processKey: string): ActiveProcess | undefined {
    return this.processes.get(processKey);
  }

  /**
   * Opens a new process, or renews (bumps `lastSignalTick` on) an
   * existing still-open one for the same `processKey`. A `RESOLVED`/
   * `HISTORICAL` process is never renewed -- a later signal starts a
   * fresh process instead (SS33 Trend End: the old process really ended).
   * `magnitudeIncrement` (default `0`) adds to `accumulatedMagnitude` --
   * seeded from it on open, summed on renewal.
   */
  openOrRenew(
    processKey: string,
    processType: string,
    tick: number,
    rootFactId: string,
    magnitudeIncrement = 0,
  ): ActiveProcess {
    const existing = this.processes.get(processKey);
    if (existing && existing.state !== "RESOLVED" && existing.state !== "HISTORICAL") {
      const renewed: ActiveProcess = {
        ...existing,
        lastSignalTick: tick,
        accumulatedMagnitude: existing.accumulatedMagnitude + magnitudeIncrement,
      };
      this.processes.set(processKey, renewed);
      return renewed;
    }
    const created: ActiveProcess = {
      processKey,
      processType,
      state: "EMERGING",
      startTick: tick,
      lastSignalTick: tick,
      rootFactId,
      entryId: undefined,
      accumulatedMagnitude: magnitudeIncrement,
    };
    this.processes.set(processKey, created);
    return created;
  }

  advance(processKey: string, nextState: ProcessLifecycleState, tick: number): ActiveProcess | undefined {
    const existing = this.processes.get(processKey);
    if (!existing) return undefined;
    const advanced: ActiveProcess = { ...existing, state: nextState, lastSignalTick: tick };
    this.processes.set(processKey, advanced);
    return advanced;
  }

  linkEntry(processKey: string, entryId: string): void {
    const existing = this.processes.get(processKey);
    if (!existing) return;
    this.processes.set(processKey, { ...existing, entryId });
  }

  /** Still-open processes with no renewal signal for at least `silenceTicks` -- candidates for a detector to resolve (SS33). Sorted for deterministic iteration. */
  findStale(currentTick: number, silenceTicks: number): readonly ActiveProcess[] {
    return [...this.processes.values()]
      .filter(
        (process) =>
          process.state !== "RESOLVED" &&
          process.state !== "HISTORICAL" &&
          currentTick - process.lastSignalTick >= silenceTicks,
      )
      .sort((a, b) => a.processKey.localeCompare(b.processKey));
  }

  /**
   * Still-open processes running (since `startTick`) at least
   * `maxDurationTicks`, regardless of how recently they were renewed --
   * caps a process a detector keeps renewing indefinitely (e.g. decades
   * of steady background migration) from growing into one unbounded
   * "wave" that silence-detection (`findStale`) alone would never close.
   */
  findExceedingDuration(currentTick: number, maxDurationTicks: number): readonly ActiveProcess[] {
    return [...this.processes.values()]
      .filter(
        (process) =>
          process.state !== "RESOLVED" &&
          process.state !== "HISTORICAL" &&
          currentTick - process.startTick >= maxDurationTicks,
      )
      .sort((a, b) => a.processKey.localeCompare(b.processKey));
  }

  all(): readonly ActiveProcess[] {
    return [...this.processes.values()].sort((a, b) => a.processKey.localeCompare(b.processKey));
  }

  /** M20 (SS58 Canonical State / SS200 Persistence Counters): an open process's `accumulatedMagnitude`/`lastSignalTick`/`startTick` are exactly the kind of "condition must persist N ticks" state a save must carry -- not rebuildable without replaying the full fact history. */
  getState(): ActiveProcessRegistryState {
    return { processes: this.all() };
  }

  static fromState(state: ActiveProcessRegistryState): ActiveProcessRegistry {
    const registry = new ActiveProcessRegistry();
    for (const process of state.processes) {
      registry.processes.set(process.processKey, process);
    }
    return registry;
  }
}

/** M20: `ActiveProcessRegistry.getState()`/`static fromState()` round-trip shape. */
export interface ActiveProcessRegistryState {
  readonly processes: readonly ActiveProcess[];
}

export function createActiveProcessRegistry(): ActiveProcessRegistry {
  return new ActiveProcessRegistry();
}
