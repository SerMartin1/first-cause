import type { ZodType, ZodTypeDef } from "zod";
import { DefinitionRegistry } from "../registry/definition-registry.js";
import type { LoadResult } from "./load-result.js";

/**
 * Builds a `JSON -> Zod -> semantic validation (duplicate IDs) ->
 * immutable Definition Registry` loader for one content type
 * (Technology Stack Decision SS21). Never throws: structural or
 * duplicate-ID problems come back as `errors` so callers (content pack
 * assembly, CLI, tests) can report them without a crash.
 *
 * Cross-definition semantic validation (missing refs, cycles, phase
 * violations, localization coverage -- Technology Stack Decision SS22)
 * needs every type's registry at once, so it lives in
 * `loaders/content-pack.ts` / `validators/*`, not here.
 */
export function createDefinitionLoader<T extends { readonly id: string }>(
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- the Input type param must stay open: fields with `.default(...)` have Input != Output (see AnyInputZodType in schema/reference-field.ts). */
  schema: ZodType<T, ZodTypeDef, any>,
): (rawDefinitions: readonly unknown[]) => LoadResult<T> {
  return function load(rawDefinitions: readonly unknown[]): LoadResult<T> {
    const errors: string[] = [];
    const parsed: T[] = [];

    rawDefinitions.forEach((raw, index) => {
      const result = schema.safeParse(raw);
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
  };
}
