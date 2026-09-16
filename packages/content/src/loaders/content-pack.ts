import type { DefinitionRegistry } from "../registry/definition-registry.js";
import { CONTENT_TYPE_SPECS } from "../content-types.js";
import { CONTENT_TYPE_NAMES, type ContentTypeName } from "../schema/reference-field.js";
import type { LocaleBundle } from "../validators/localization-coverage.js";
import { validateLocalizationCoverage } from "../validators/localization-coverage.js";
import { validateReferences } from "../validators/reference-validation.js";
import { createDefinitionLoader } from "./create-definition-loader.js";

type AnyDefinition = { readonly id: string };
type RegistryMap = Partial<
  Readonly<Record<ContentTypeName, DefinitionRegistry<AnyDefinition>>>
>;

export interface LoadContentPackInput {
  /** Raw (already `JSON.parse`d) definitions per type. A type not present is loaded as empty. */
  readonly definitions: Partial<Readonly<Record<ContentTypeName, readonly unknown[]>>>;
  /** locale code -> flat key/value bundle, e.g. `{ en: enCommonJson, pl: plCommonJson }`. */
  readonly locales: Readonly<Record<string, LocaleBundle>>;
  /** Defaults to "en". */
  readonly sourceLocale?: string;
}

export interface ContentPackResult {
  readonly ok: boolean;
  readonly registries: RegistryMap;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  /** Content Statistics (Content-Localization-Spec SS147): definition count per type actually loaded. */
  readonly stats: Partial<Readonly<Record<ContentTypeName, number>>>;
}

/**
 * The full M2 pipeline for one content pack: per-type
 * `JSON -> Zod -> duplicate-ID check -> registry`
 * (`createDefinitionLoader`), then cross-type semantic validation
 * (global ID collisions across types, missing references, dependency
 * cycles, phase violations, localization coverage -- Technology Stack
 * Decision SS22). Never throws.
 *
 * A type whose own definitions fail structural/duplicate-ID validation
 * is excluded from `registries` (and from every cross-type check) so one
 * broken type does not cascade into unrelated false positives; its
 * errors are still reported.
 */
export function loadContentPack(input: LoadContentPackInput): ContentPackResult {
  const errors: string[] = [];
  const registries: Partial<Record<ContentTypeName, DefinitionRegistry<AnyDefinition>>> =
    {};
  const stats: Partial<Record<ContentTypeName, number>> = {};

  for (const typeName of CONTENT_TYPE_NAMES) {
    const raw = input.definitions[typeName] ?? [];
    const spec = CONTENT_TYPE_SPECS[typeName];
    const load = createDefinitionLoader(spec.schema);
    const result = load(raw);

    if (!result.ok || !result.registry) {
      errors.push(...result.errors.map((error) => `[${typeName}] ${error}`));
      continue;
    }

    registries[typeName] = result.registry;
    stats[typeName] = result.registry.size;
  }

  errors.push(...findCrossTypeIdCollisions(registries));
  errors.push(...validateReferences({ specs: CONTENT_TYPE_SPECS, registries }));

  const localization = validateLocalizationCoverage({
    specs: CONTENT_TYPE_SPECS,
    registries,
    locales: input.locales,
    ...(input.sourceLocale === undefined ? {} : { sourceLocale: input.sourceLocale }),
  });
  errors.push(...localization.errors);

  return {
    ok: errors.length === 0,
    registries,
    errors,
    warnings: localization.warnings,
    stats,
  };
}

/** CONTENT-006/Content-Localization-Spec SS23: an ID must not be reused across two different types. */
function findCrossTypeIdCollisions(registries: RegistryMap): string[] {
  const owner = new Map<string, ContentTypeName>();
  const errors: string[] = [];

  for (const typeName of CONTENT_TYPE_NAMES) {
    const registry = registries[typeName];
    if (!registry) continue;

    for (const definition of registry.all()) {
      const existingOwner = owner.get(definition.id);
      if (existingOwner && existingOwner !== typeName) {
        errors.push(
          `Content ID collision across types: "${definition.id}" is used by both ${existingOwner} and ${typeName}`,
        );
      } else {
        owner.set(definition.id, typeName);
      }
    }
  }

  return errors;
}
