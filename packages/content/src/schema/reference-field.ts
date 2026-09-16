import type { ZodType, ZodTypeDef } from "zod";

/**
 * Every definition schema mixes required fields with `.default(...)`
 * fields, whose *input* type (`T | undefined`) differs from their
 * *output* type (`T`, since Zod fills the default). Pinning the third
 * (`Input`) type parameter to `any` here means `ContentTypeSpec.schema`
 * only constrains the parsed *output* shape -- which is all callers
 * (`safeParse(raw: unknown)`, never `z.input<>`) actually rely on.
 */
type AnyInputZodType<T> = ZodType<T, ZodTypeDef, any>;

/**
 * The 10 content definition types in M2 scope (Implementation Roadmap
 * v0.2, M2 "Moduły"). `KnowledgeDomainDefinition` (Content-Localization-Spec
 * SS4) is intentionally not included yet -- it belongs to M15 Technology,
 * per "No scope creep" (IMPL-010). Fields that would reference a
 * knowledge domain (e.g. Discovery.primaryDomainId) are typed as plain
 * `ContentId`s but are not cross-reference-validated until that registry
 * exists.
 */
export const CONTENT_TYPE_NAMES = [
  "resource",
  "good",
  "companyArchetype",
  "productionMethod",
  "discovery",
  "service",
  "transportMode",
  "intervention",
  "eventType",
  "chronicleTemplate",
] as const;

export type ContentTypeName = (typeof CONTENT_TYPE_NAMES)[number];

/**
 * Declares that a definition field holds one or more IDs of another
 * (or the same) content type, so the generic validator
 * (`validators/reference-validation.ts`) can check missing references,
 * phase dependencies (CONTENT-009) and -- for `cyclic: true` fields --
 * dependency cycles (Technology Stack Decision SS22).
 */
export interface ReferenceFieldSpec {
  readonly field: string;
  readonly targetType: ContentTypeName;
  readonly cardinality: "one" | "many";
  /**
   * Only true for fields that represent a genuine directed dependency
   * chain within the same type (e.g. a Good's downstream processing
   * chain, a Discovery's prerequisites). Symmetric relations like
   * `substituteIds` are real references but not cycle-checked.
   */
  readonly cyclic?: boolean;
}

export interface ContentTypeSpec<T extends { readonly id: string }> {
  readonly name: ContentTypeName;
  readonly schema: AnyInputZodType<T>;
  readonly referenceFields: readonly ReferenceFieldSpec[];
  /** Fields whose value is a localization key (default elsewhere is `["nameKey"]`). */
  readonly localizationKeyFields: readonly string[];
}

/** A `ContentTypeSpec` with its definition type erased, for heterogeneous collections. */
export type AnyContentTypeSpec = ContentTypeSpec<{ readonly id: string }>;
