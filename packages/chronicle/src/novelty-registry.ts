/**
 * Novelty Registry (Chronicle & Historical Significance Spec SS119): "nie
 * wymaga skanowania pełnej historii za każdym razem" -- an incremental
 * `Set`, the same shape as `@first-cause/causality`'s `CausalEdgeStore`,
 * not a derived query over the full fact/entry history on every tick.
 */
export type NoveltyScope = "settlement" | "region" | "continent" | "world";

export class NoveltyRegistry {
  private readonly seen = new Set<string>();

  private key(category: string, scope: NoveltyScope, scopeId: string): string {
    return `${category}::${scope}::${scopeId}`;
  }

  has(category: string, scope: NoveltyScope, scopeId: string): boolean {
    return this.seen.has(this.key(category, scope, scopeId));
  }

  /**
   * Records this occurrence and reports whether it is the first ever
   * recorded for `(category, scope, scopeId)`. Idempotent: calling it
   * again for the same triple after the first call returns `false`.
   */
  recordAndCheckFirst(category: string, scope: NoveltyScope, scopeId: string): boolean {
    const key = this.key(category, scope, scopeId);
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    return true;
  }

  get size(): number {
    return this.seen.size;
  }

  /** M20 (SS58 Canonical State): which `(category, scope, scopeId)` triples have already fired is history, not rebuildable without replaying every tick's Chronicle pipeline from tick 0. */
  getState(): NoveltyRegistryState {
    return { seen: [...this.seen].sort() };
  }

  static fromState(state: NoveltyRegistryState): NoveltyRegistry {
    const registry = new NoveltyRegistry();
    for (const key of state.seen) registry.seen.add(key);
    return registry;
  }
}

/** M20: `NoveltyRegistry.getState()`/`static fromState()` round-trip shape. */
export interface NoveltyRegistryState {
  readonly seen: readonly string[];
}

export function createNoveltyRegistry(): NoveltyRegistry {
  return new NoveltyRegistry();
}
