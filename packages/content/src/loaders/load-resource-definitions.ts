import {
  ResourceDefinitionSchema,
  type ResourceDefinition,
} from "../schema/resource-definition.js";
import { DefinitionRegistry } from "../registry/definition-registry.js";

export interface LoadResult<TDefinition extends { readonly id: string }> {
  readonly ok: boolean;
  readonly registry?: DefinitionRegistry<TDefinition>;
  readonly errors: readonly string[];
}

/**
 * Parses and validates raw (already `JSON.parse`d) resource definition
 * data through Zod, then applies semantic validation (duplicate IDs),
 * and builds an immutable DefinitionRegistry.
 *
 * Never throws: structural or semantic problems are returned as `errors`
 * so callers (CLI, loader, tests) can report them without a crash.
 */
export function loadResourceDefinitions(
  rawDefinitions: readonly unknown[],
): LoadResult<ResourceDefinition> {
  const errors: string[] = [];
  const parsed: ResourceDefinition[] = [];

  rawDefinitions.forEach((raw, index) => {
    const result = ResourceDefinitionSchema.safeParse(raw);
    if (!result.success) {
      errors.push(
        `Definition at index ${index} failed schema validation: ${result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")}`,
      );
      return;
    }
    parsed.push(result.data);
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const seenIds = new Set<string>();
  for (const definition of parsed) {
    if (seenIds.has(definition.id)) {
      errors.push(`Duplicate content ID: "${definition.id}"`);
    }
    seenIds.add(definition.id);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    registry: DefinitionRegistry.fromDefinitions(parsed),
    errors: [],
  };
}
