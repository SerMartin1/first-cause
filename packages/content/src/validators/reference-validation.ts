import type { DefinitionRegistry } from "../registry/definition-registry.js";
import { CONTENT_PHASE_RANK, type ContentPhase } from "../schema/content-id.js";
import {
  CONTENT_TYPE_NAMES,
  type AnyContentTypeSpec,
  type ContentTypeName,
  type ReferenceFieldSpec,
} from "../schema/reference-field.js";

type AnyDefinition = { readonly id: string };
type RegistryMap = Partial<
  Readonly<Record<ContentTypeName, DefinitionRegistry<AnyDefinition>>>
>;

export interface ValidateReferencesInput {
  readonly specs: Readonly<Record<ContentTypeName, AnyContentTypeSpec>>;
  readonly registries: RegistryMap;
}

/**
 * Semantic validation beyond what Zod's structural check can express
 * (Technology Stack Decision SS22, Canonical Decisions CONTENT-010):
 * missing references, dependency cycles, and phase violations
 * (CONTENT-009 -- an earlier-phase definition may never depend on a
 * later-phase one). Only checks fields declared as references in each
 * type's `ContentTypeSpec`; a field whose target type is not part of
 * this pack is silently skipped (nothing to validate it against).
 */
export function validateReferences(input: ValidateReferencesInput): readonly string[] {
  const errors: string[] = [];

  for (const typeName of CONTENT_TYPE_NAMES) {
    const registry = input.registries[typeName];
    if (!registry) continue;
    const spec = input.specs[typeName];

    for (const definition of registry.all()) {
      const sourcePhase = readPhase(definition);
      for (const refField of spec.referenceFields) {
        const targetRegistry = input.registries[refField.targetType];
        if (!targetRegistry) continue;

        for (const targetId of readFieldValues(definition, refField)) {
          const targetDefinition = targetRegistry.get(targetId);
          if (!targetDefinition) {
            errors.push(
              `Missing reference: ${typeName} "${definition.id}".${refField.field} -> unknown ${refField.targetType} "${targetId}"`,
            );
            continue;
          }
          const targetPhase = readPhase(targetDefinition);
          if (
            sourcePhase &&
            targetPhase &&
            CONTENT_PHASE_RANK[targetPhase] > CONTENT_PHASE_RANK[sourcePhase]
          ) {
            errors.push(
              `Phase violation (CONTENT-009): ${typeName} "${definition.id}" (${sourcePhase}) depends on ` +
                `${refField.targetType} "${targetId}" (${targetPhase}), which activates later`,
            );
          }
        }
      }
    }
  }

  errors.push(...detectDependencyCycles(input.specs, input.registries));
  return errors;
}

function readPhase(definition: AnyDefinition): ContentPhase | undefined {
  const value = (definition as Record<string, unknown>).implementationPhase;
  return value === "VS" || value === "MVP" || value === "FULL" ? value : undefined;
}

function readFieldValues(
  definition: AnyDefinition,
  refField: ReferenceFieldSpec,
): readonly string[] {
  const raw = (definition as Record<string, unknown>)[refField.field];
  if (refField.cardinality === "one") {
    return typeof raw === "string" ? [raw] : [];
  }
  return Array.isArray(raw)
    ? raw.filter((value): value is string => typeof value === "string")
    : [];
}

function detectDependencyCycles(
  specs: Readonly<Record<ContentTypeName, AnyContentTypeSpec>>,
  registries: RegistryMap,
): string[] {
  const errors: string[] = [];

  for (const typeName of CONTENT_TYPE_NAMES) {
    const registry = registries[typeName];
    if (!registry) continue;
    const spec = specs[typeName];

    for (const refField of spec.referenceFields) {
      if (!refField.cyclic) continue;

      const graph = new Map<string, readonly string[]>();
      for (const definition of registry.all()) {
        graph.set(
          definition.id,
          readFieldValues(definition, refField).filter((id) => registry.has(id)),
        );
      }

      const cycle = findCycle(graph);
      if (cycle) {
        errors.push(
          `Dependency cycle in ${typeName}.${refField.field}: ${cycle.join(" -> ")}`,
        );
      }
    }
  }

  return errors;
}

/** Classic three-color DFS cycle detection. Deterministic: visits IDs in sorted order. */
function findCycle(graph: ReadonlyMap<string, readonly string[]>): string[] | null {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  const path: string[] = [];

  function visit(node: string): string[] | null {
    color.set(node, GRAY);
    path.push(node);

    for (const next of graph.get(node) ?? []) {
      const nextColor = color.get(next) ?? WHITE;
      if (nextColor === WHITE) {
        const found = visit(next);
        if (found) return found;
      } else if (nextColor === GRAY) {
        const cycleStart = path.indexOf(next);
        return [...path.slice(cycleStart), next];
      }
    }

    path.pop();
    color.set(node, BLACK);
    return null;
  }

  for (const id of [...graph.keys()].sort()) {
    if ((color.get(id) ?? WHITE) === WHITE) {
      const found = visit(id);
      if (found) return found;
    }
  }
  return null;
}
