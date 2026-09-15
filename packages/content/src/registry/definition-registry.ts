/**
 * Generic immutable registry for content definitions.
 *
 * DATA-001 (Canonical Decisions): Definition Data is separate from World
 * State. A registry built here is read-only content, never mutated by the
 * running simulation.
 */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export class DefinitionRegistry<TDefinition extends { readonly id: string }> {
  private readonly byId: ReadonlyMap<string, TDefinition>;

  private constructor(byId: ReadonlyMap<string, TDefinition>) {
    this.byId = byId;
  }

  /**
   * Builds a registry from already-validated definitions. Throws if any
   * `id` is duplicated -- duplicate IDs are a data error, not a runtime
   * condition to recover from silently.
   */
  static fromDefinitions<T extends { readonly id: string }>(
    definitions: readonly T[],
  ): DefinitionRegistry<T> {
    const byId = new Map<string, T>();
    for (const definition of definitions) {
      if (byId.has(definition.id)) {
        throw new Error(`Duplicate content ID: "${definition.id}"`);
      }
      // Definitions are validated JSON data: detach caller references, then
      // freeze objects and nested arrays before exposing any references.
      byId.set(definition.id, deepFreeze(structuredClone(definition)));
    }
    return new DefinitionRegistry(byId);
  }

  get(id: string): TDefinition | undefined {
    return this.byId.get(id);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  /** Stable, deterministic order: sorted by ID (canonical ordering). */
  all(): readonly TDefinition[] {
    return [...this.byId.values()].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );
  }

  get size(): number {
    return this.byId.size;
  }
}
