import type { FactInput, SimulationFact } from "./fact.js";

/**
 * FactStore (CE-01: "IDs, Fact store, indices, emission API").
 *
 * Append-only: a Fact records something that already happened, so it is
 * never edited or removed once emitted (SS0). IDs follow
 * `fact_<tick>_<sequence>` (Save/Determinism Spec SS19's
 * `fact_<tick>_<phase>_<sequence>`, minus `<phase>` -- no tick-phase
 * pipeline exists yet, SIM-003's 23 phases are not wired up until later
 * milestones). `sequence` is a monotonic counter assigned at emit time,
 * never from wall-clock or random (SAVE-004) -- the same determinism
 * contract every other ID generator in this codebase follows.
 */
export class FactStore {
  private readonly facts: SimulationFact[] = [];
  private nextSequence = 0;

  /** Records one fact. Commit-then-emit (SIM-004): call only after the state mutation it describes is already final. */
  emit<TValue>(tick: number, input: FactInput<TValue>): SimulationFact<TValue> {
    if (!Number.isInteger(tick) || tick < 0) {
      throw new RangeError(
        `FactStore.emit: tick must be a non-negative integer, got ${String(tick)}`,
      );
    }
    const fact: SimulationFact<TValue> = {
      id: `fact_${tick}_${this.nextSequence}`,
      tick,
      ...input,
    };
    this.nextSequence += 1;
    this.facts.push(fact);
    return fact;
  }

  /** Records every fact in `inputs`, in order, under the same tick. */
  emitAll<TValue>(
    tick: number,
    inputs: readonly FactInput<TValue>[],
  ): readonly SimulationFact<TValue>[] {
    return inputs.map((input) => this.emit(tick, input));
  }

  /** Stable (emission) order: sufficient here, since emission order is itself deterministic. */
  all(): readonly SimulationFact[] {
    return [...this.facts];
  }

  get size(): number {
    return this.facts.length;
  }

  /** M20 (SAVE-related "Canonical State", SS58): `nextSequence` must round-trip explicitly -- a fresh `FactStore.emit` after load must never reissue an id a restored fact already holds. */
  getState(): FactStoreState {
    return { facts: this.facts.slice(), nextSequence: this.nextSequence };
  }

  /**
   * Direct restore (SS58 Canonical State), not a replay through `.emit`:
   * `state.facts` already carry their real, final ids/ticks, so this
   * just re-seats them and the saved sequence counter as-is -- no
   * re-validation of tick monotonicity happens here, `state` is assumed
   * to already be trustworthy (i.e. it came from a prior `getState()`).
   */
  static fromState(state: FactStoreState): FactStore {
    const store = new FactStore();
    store.facts.push(...state.facts);
    store.nextSequence = state.nextSequence;
    return store;
  }
}

/** M20: `FactStore.getState()`/`static fromState()` round-trip shape. */
export interface FactStoreState {
  readonly facts: readonly SimulationFact[];
  readonly nextSequence: number;
}

export function createFactStore(): FactStore {
  return new FactStore();
}

/**
 * Indices over an already-emitted fact list (CE-01 "indices"). A pure
 * function, not a field on `FactStore`: the indices are always
 * reconstructible from `store.all()`, the same DATA-003 pattern
 * `packages/entities`' `core/indexes.ts` uses -- never a second source
 * of truth.
 */
export interface FactIndices {
  readonly byTick: ReadonlyMap<number, readonly SimulationFact[]>;
  readonly byType: ReadonlyMap<string, readonly SimulationFact[]>;
  readonly byEntityId: ReadonlyMap<string, readonly SimulationFact[]>;
  readonly byRegionId: ReadonlyMap<string, readonly SimulationFact[]>;
}

function groupBy<TKey>(
  facts: readonly SimulationFact[],
  keyOf: (fact: SimulationFact) => TKey,
): Map<TKey, SimulationFact[]> {
  const grouped = new Map<TKey, SimulationFact[]>();
  for (const fact of facts) {
    const key = keyOf(fact);
    const list = grouped.get(key);
    if (list) {
      list.push(fact);
    } else {
      grouped.set(key, [fact]);
    }
  }
  return grouped;
}

export function buildFactIndices(facts: readonly SimulationFact[]): FactIndices {
  return {
    byTick: groupBy(facts, (fact) => fact.tick),
    byType: groupBy(facts, (fact) => fact.type),
    byEntityId: groupBy(facts, (fact) => fact.subject.entityId),
    byRegionId: groupBy(facts, (fact) => fact.location.regionId),
  };
}
