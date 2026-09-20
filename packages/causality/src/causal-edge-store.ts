import type { CausalEdge, CausalEdgeInput } from "./causal-edge.js";
import type { SimulationFact } from "./fact.js";

/**
 * CausalEdgeStore (CE-03 "creation, validation, incoming/outgoing
 * indices"). Ten sam append-only kształt co `FactStore` (`fact-store.ts`)
 * -- edge zapisuje powiązanie przyczynowe, które już zostało ustalone,
 * więc nigdy nie jest edytowany ani usuwany po dodaniu (pruning,
 * `causal-pruning.ts`, produkuje NOWY store, nie mutuje tego -- ten sam
 * kontrakt "nigdy nie mutuj, zawsze przebuduj", który `WorldState`
 * mutacje już przestrzegają).
 *
 * Walidacja potrzebuje obu faktów końcowych, nie tylko ich id, dla
 * Temporal Ordering (Causality Engine Spec SS22: "edge do wcześniejszego
 * faktu jest niedozwolony" -- przyczyna nigdy nie może być późniejsza niż
 * efekt) i żeby odrzucić self-loop.
 */
export class CausalEdgeStore {
  private readonly edges: CausalEdge[] = [];
  private nextSequence = 0;
  private readonly outgoing = new Map<string, CausalEdge[]>();
  private readonly incoming = new Map<string, CausalEdge[]>();

  add(
    input: CausalEdgeInput,
    sourceFact: Pick<SimulationFact, "id" | "tick">,
    targetFact: Pick<SimulationFact, "id" | "tick">,
  ): CausalEdge {
    if (sourceFact.id !== input.sourceFactId || targetFact.id !== input.targetFactId) {
      throw new RangeError(
        "CausalEdgeStore.add: sourceFact/targetFact ids must match input.sourceFactId/targetFactId",
      );
    }
    if (input.sourceFactId === input.targetFactId) {
      throw new RangeError(
        `CausalEdgeStore.add: self-loop is not allowed (fact "${input.sourceFactId}")`,
      );
    }
    if (sourceFact.tick > targetFact.tick) {
      throw new RangeError(
        `CausalEdgeStore.add: an edge to an earlier fact is not allowed (source tick ${sourceFact.tick} > target tick ${targetFact.tick})`,
      );
    }

    const edge: CausalEdge = { id: `edge_${this.nextSequence}`, ...input };
    this.nextSequence += 1;
    this.edges.push(edge);

    const outList = this.outgoing.get(edge.sourceFactId) ?? [];
    outList.push(edge);
    this.outgoing.set(edge.sourceFactId, outList);

    const inList = this.incoming.get(edge.targetFactId) ?? [];
    inList.push(edge);
    this.incoming.set(edge.targetFactId, inList);

    return edge;
  }

  outgoingByFact(factId: string): readonly CausalEdge[] {
    return this.outgoing.get(factId) ?? [];
  }

  incomingByFact(factId: string): readonly CausalEdge[] {
    return this.incoming.get(factId) ?? [];
  }

  all(): readonly CausalEdge[] {
    return [...this.edges];
  }

  get size(): number {
    return this.edges.length;
  }

  /** M20: `outgoing`/`incoming` are Derived State (SAVE-009) -- only `edges` + the sequence counter are canonical. */
  getState(): CausalEdgeStoreState {
    return { edges: this.edges.slice(), nextSequence: this.nextSequence };
  }

  /** Direct restore (not a replay through `.add`, which would re-run temporal-ordering/self-loop validation that already-saved edges don't need re-checked): re-seats `state.edges` verbatim and rebuilds the `outgoing`/`incoming` indices from them. */
  static fromState(state: CausalEdgeStoreState): CausalEdgeStore {
    const store = new CausalEdgeStore();
    store.nextSequence = state.nextSequence;
    for (const edge of state.edges) {
      store.edges.push(edge);
      const outList = store.outgoing.get(edge.sourceFactId) ?? [];
      outList.push(edge);
      store.outgoing.set(edge.sourceFactId, outList);
      const inList = store.incoming.get(edge.targetFactId) ?? [];
      inList.push(edge);
      store.incoming.set(edge.targetFactId, inList);
    }
    return store;
  }
}

/** M20: `CausalEdgeStore.getState()`/`static fromState()` round-trip shape. */
export interface CausalEdgeStoreState {
  readonly edges: readonly CausalEdge[];
  readonly nextSequence: number;
}

export function createCausalEdgeStore(): CausalEdgeStore {
  return new CausalEdgeStore();
}
