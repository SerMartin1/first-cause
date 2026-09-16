import type { DefinitionRegistry } from "../registry/definition-registry.js";

export interface LoadResult<TDefinition extends { readonly id: string }> {
  readonly ok: boolean;
  readonly registry?: DefinitionRegistry<TDefinition>;
  readonly errors: readonly string[];
}
