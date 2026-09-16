import type { DefinitionRegistry } from "../registry/definition-registry.js";
import {
  CONTENT_TYPE_NAMES,
  type AnyContentTypeSpec,
  type ContentTypeName,
} from "../schema/reference-field.js";

type AnyDefinition = { readonly id: string };
type RegistryMap = Partial<
  Readonly<Record<ContentTypeName, DefinitionRegistry<AnyDefinition>>>
>;
export type LocaleBundle = Readonly<Record<string, unknown>>;

export interface ValidateLocalizationInput {
  readonly specs: Readonly<Record<ContentTypeName, AnyContentTypeSpec>>;
  readonly registries: RegistryMap;
  readonly locales: Readonly<Record<string, LocaleBundle>>;
  /** Defaults to "en" (CONTENT-002: English is the source locale). */
  readonly sourceLocale?: string;
}

export interface LocalizationValidationResult {
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Content-Localization-Spec SS143/SS144: a missing key in the source
 * locale is a hard failure; a missing key in any other locale is a
 * warning (it falls back to the source locale, per CONTENT-002/SS13),
 * not a build blocker.
 */
export function validateLocalizationCoverage(
  input: ValidateLocalizationInput,
): LocalizationValidationResult {
  const sourceLocale = input.sourceLocale ?? "en";
  const sourceBundle = input.locales[sourceLocale];
  const otherLocales = Object.keys(input.locales)
    .filter((locale) => locale !== sourceLocale)
    .sort();

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const typeName of CONTENT_TYPE_NAMES) {
    const registry = input.registries[typeName];
    if (!registry) continue;
    const spec = input.specs[typeName];

    for (const definition of registry.all()) {
      for (const keyField of spec.localizationKeyFields) {
        const key = (definition as Record<string, unknown>)[keyField];
        if (typeof key !== "string") continue;

        if (!sourceBundle || !(key in sourceBundle)) {
          errors.push(
            `Missing ${sourceLocale} localization key: ${typeName} "${definition.id}".${keyField} -> "${key}"`,
          );
          continue;
        }

        for (const locale of otherLocales) {
          const bundle = input.locales[locale];
          if (!bundle || !(key in bundle)) {
            warnings.push(
              `Missing ${locale} localization key (falls back to ${sourceLocale}): ${typeName} "${definition.id}".${keyField} -> "${key}"`,
            );
          }
        }
      }
    }
  }

  return { errors, warnings };
}
