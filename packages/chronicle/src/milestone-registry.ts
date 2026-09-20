/**
 * Milestone Registry (Chronicle & Historical Significance Spec SS120):
 * "przechowuje osiągnięte progi, aby nie emitować ich wielokrotnie" --
 * an idempotent `Set` of opaque milestone keys. The caller
 * (`candidate-pipeline.ts` or a future detector) owns what a key means
 * (e.g. `"depletion:deposit_12:75"`); this registry only guarantees each
 * key fires once.
 */
export class MilestoneRegistry {
  private readonly reached = new Set<string>();

  hasReached(milestoneKey: string): boolean {
    return this.reached.has(milestoneKey);
  }

  /** Marks the milestone reached; returns `true` the first time, `false` on every later call for the same key. */
  markReached(milestoneKey: string): boolean {
    if (this.reached.has(milestoneKey)) return false;
    this.reached.add(milestoneKey);
    return true;
  }

  get size(): number {
    return this.reached.size;
  }

  /** M20 (SS58 Canonical State): SS200 Persistence Counters -- "reached" is exactly the kind of persistent condition state a save must carry. */
  getState(): MilestoneRegistryState {
    return { reached: [...this.reached].sort() };
  }

  static fromState(state: MilestoneRegistryState): MilestoneRegistry {
    const registry = new MilestoneRegistry();
    for (const key of state.reached) registry.reached.add(key);
    return registry;
  }
}

/** M20: `MilestoneRegistry.getState()`/`static fromState()` round-trip shape. */
export interface MilestoneRegistryState {
  readonly reached: readonly string[];
}

export function createMilestoneRegistry(): MilestoneRegistry {
  return new MilestoneRegistry();
}
