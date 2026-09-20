import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import { LocalizationKeySchema, NonNegativeIntSchema, NonNegativeNumberSchema } from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/**
 * Chronicle event categories (Chronicle & Historical Significance Spec
 * SS21). Closed, structural vocabulary -- the same kind of "canonical
 * types" list as `@first-cause/causality`'s `CausalEdgeType` -- not open
 * content: adding a category is a taxonomy decision, adding an *event
 * type* below is ordinary data-driven content.
 */
export const CHRONICLE_CATEGORIES = [
  "population",
  "migration",
  "settlement",
  "economy",
  "company",
  "trade",
  "resources",
  "technology",
  "infrastructure",
  "society",
  "environment",
  "state",
  "conflict",
  "architect",
  "world",
] as const;
export const ChronicleCategorySchema = z.enum(CHRONICLE_CATEGORIES);
export type ChronicleCategory = (typeof CHRONICLE_CATEGORIES)[number];

/** SS26 Aggregation Window: how repeated micro-facts of this type fold into one Entry. */
export const AggregationPolicySchema = z.object({
  windowTicks: NonNegativeIntSchema.default(1),
  scope: z.enum(["entity", "region", "world"]).default("entity"),
});
export type AggregationPolicy = z.infer<typeof AggregationPolicySchema>;

/** SS119 Novelty Registry: whether/where this event type's "first occurrence" should be tracked. */
export const NoveltyPolicySchema = z.object({
  tracksFirst: z.boolean().default(false),
  scope: z.enum(["settlement", "region", "continent", "world"]).default("world"),
});
export type NoveltyPolicy = z.infer<typeof NoveltyPolicySchema>;

/** SS8 Duration: default classification for a single, un-aggregated occurrence of this type. */
export const DURATION_STATES = [
  "INSTANTANEOUS",
  "SHORT",
  "SUSTAINED",
  "STRUCTURAL",
  "MULTI_GENERATIONAL",
] as const;
export const DurationStateSchema = z.enum(DURATION_STATES);
export type DurationState = (typeof DURATION_STATES)[number];

/** SS79-80 Anchor Eligibility: event types that default to protecting their facts from Causal Memory pruning. */
export const AnchorPolicySchema = z.object({
  alwaysAnchor: z.boolean().default(false),
});
export type AnchorPolicy = z.infer<typeof AnchorPolicySchema>;

/**
 * EventTypeDefinition (Chronicle & Historical Significance Spec SS126,
 * milestone M19, module CH-01). Earlier revisions of this file described
 * an open `triggerConditions`/`effects` shape for a not-yet-scoped
 * generic Events mechanic; the Chronicle spec (the actual M19 consumer,
 * confirmed by `chronicle-template-definition.ts`'s `factOrEventType`
 * cross-reference) settles the real shape instead. Chronicle never
 * invents facts (CHRON-001): this type never carries trigger/effect
 * fields -- it only tells the Candidate Pipeline how to SCORE and
 * PRESENT a `SimulationFact` of this type that some other system already
 * emitted, never how to produce one. Matching `ChronicleTemplateDefinition`
 * entries link back via their own `factOrEventType === this.id`, so no
 * forward `templateIds` field is needed here (single source of truth for
 * the link, not two).
 */
export const EventTypeDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  category: ChronicleCategorySchema,
  /** SS23 Event Importance Baseline -- never replaces the dynamic per-occurrence score, only seeds it. */
  baseSignificance: NonNegativeNumberSchema.max(100).default(0),
  /** SS17 Chronicle Candidate: minimum computed significance to become a candidate at all. */
  candidateThreshold: NonNegativeNumberSchema.max(100).default(0),
  aggregationPolicy: AggregationPolicySchema.default({ windowTicks: 1, scope: "entity" }),
  noveltyPolicy: NoveltyPolicySchema.default({ tracksFirst: false, scope: "world" }),
  durationPolicy: DurationStateSchema.default("INSTANTANEOUS"),
  anchorPolicy: AnchorPolicySchema.default({ alwaysAnchor: false }),
  implementationPhase: ContentPhaseSchema,
});

export type EventTypeDefinition = z.infer<typeof EventTypeDefinitionSchema>;

export const eventTypeContentTypeSpec: ContentTypeSpec<EventTypeDefinition> = {
  name: "eventType",
  schema: EventTypeDefinitionSchema,
  referenceFields: [],
  localizationKeyFields: ["nameKey"],
};
