import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import {
  IdRefArraySchema,
  LocalizationKeySchema,
  NonNegativeNumberSchema,
  OpenRecordSchema,
  PositiveNumberSchema,
  TagArraySchema,
} from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/**
 * Rodziny wizualne wydobycia (Living Atlas Visual Asset Spec v1.3 §9.2,
 * §4A.3, §28.1): czysto prezentacyjna metadana contentu -- mówi
 * rendererowi Atlasu, jaką sylwetką narysować eksploatowane złoże tego
 * zasobu. Nie wpływa na symulację. Brak pola = rodzina nieokreślona
 * (renderer używa znaku zagregowanego), nigdy domysł w kodzie.
 */
export const EXTRACTION_VISUAL_FAMILIES = [
  "shaft_mine",
  "open_pit",
  "quarry",
  "oil_field",
  "gas_field",
  "evaporation",
  "logging",
  "fishing",
  "cultivation",
] as const;
export type ExtractionVisualFamily = (typeof EXTRACTION_VISUAL_FAMILIES)[number];

/**
 * Statusy wiedzy o złożu (Entity Data Model §9) w kolejności rosnącej --
 * własna kopia, bo `@first-cause/content` nie zależy od `entities`.
 */
export const DEPOSIT_DISCOVERY_STATUSES = [
  "UNKNOWN",
  "SUSPECTED",
  "DISCOVERED",
  "ASSESSED",
] as const;
export type ContentDepositDiscoveryStatus = (typeof DEPOSIT_DISCOVERY_STATUSES)[number];

const statusRank = (status: ContentDepositDiscoveryStatus): number =>
  DEPOSIT_DISCOVERY_STATUSES.indexOf(status);

/**
 * Jedna reguła naturalnego odkrywania złóż (D3, Canonical Decisions
 * TECH-012): gdy odkrycie `discoveryId` jest w regionie co najmniej
 * AVAILABLE, KAŻDE złoże tego zasobu w regionie z JAWNĄ głębokością w
 * `[minDepth, maxDepth]` (granice włącznie, brak granicy = bez limitu),
 * o bieżącym statusie z `fromStatuses` (domyślnie: każdy niższy niż
 * `targetStatus`), przechodzi do `targetStatus`. Deterministycznie, bez
 * RNG. Złoże bez podanej głębokości nigdy nie spełnia reguły.
 */
export const DepositDetectionRuleSchema = z
  .object({
    discoveryId: ContentIdSchema,
    targetStatus: z.enum(["SUSPECTED", "DISCOVERED", "ASSESSED"]),
    minDepth: NonNegativeNumberSchema.optional(),
    maxDepth: NonNegativeNumberSchema.optional(),
    fromStatuses: z
      .array(z.enum(["UNKNOWN", "SUSPECTED", "DISCOVERED"]))
      .min(1)
      .optional(),
  })
  .strict()
  .refine(
    (rule) =>
      rule.minDepth === undefined ||
      rule.maxDepth === undefined ||
      rule.minDepth <= rule.maxDepth,
    { message: "minDepth must be <= maxDepth" },
  )
  .refine(
    (rule) =>
      (rule.fromStatuses ?? []).every(
        (status) => statusRank(status) < statusRank(rule.targetStatus),
      ),
    {
      message:
        "fromStatuses must all be lower than targetStatus (discovery never regresses)",
    },
  );

export type DepositDetectionRule = z.infer<typeof DepositDetectionRuleSchema>;

/**
 * `ResourceDefinition.discoveryRules` (D3). Brak pola / pusta lista =
 * zasób nie jest odkrywany naturalnie (nadal może go ujawnić Architekt).
 */
export const ResourceDiscoveryRulesSchema = z
  .object({
    detection: z.array(DepositDetectionRuleSchema).default([]),
  })
  .strict()
  .default({ detection: [] });

export type ResourceDiscoveryRules = z.infer<typeof ResourceDiscoveryRulesSchema>;

/**
 * ResourceDefinition (Content-Localization-Spec SS41): the minimal field
 * set for M2. `occurrenceRules` is an open placeholder bag; `discoveryRules` is typed
 * since D3 (`ResourceDiscoveryRulesSchema`) -- their real shape belongs to World Generation (M22) and
 * Resources (M5). `basePrice` (BaseContentPrice, M8 "Dane") seeds
 * `Market.goods[x].localPrice` -- see `PositiveNumberSchema`.
 */
export const ResourceDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  category: z.string().min(1),
  renewable: z.boolean(),
  basePrice: PositiveNumberSchema.optional(),
  occurrenceRules: OpenRecordSchema,
  discoveryRules: ResourceDiscoveryRulesSchema,
  extractionMethodIds: IdRefArraySchema,
  useGoodIds: IdRefArraySchema,
  substituteIds: IdRefArraySchema,
  strategicTags: TagArraySchema,
  /** M21-VIS-R2: rodzina wizualna wydobycia (§9.2); opcjonalna, tylko prezentacja. */
  extractionFamily: z.enum(EXTRACTION_VISUAL_FAMILIES).optional(),
  implementationPhase: ContentPhaseSchema,
});

export type ResourceDefinition = z.infer<typeof ResourceDefinitionSchema>;

export const resourceContentTypeSpec: ContentTypeSpec<ResourceDefinition> = {
  name: "resource",
  schema: ResourceDefinitionSchema,
  referenceFields: [
    { field: "extractionMethodIds", targetType: "productionMethod", cardinality: "many" },
    { field: "useGoodIds", targetType: "good", cardinality: "many" },
    { field: "substituteIds", targetType: "resource", cardinality: "many" },
    {
      field: "discoveryRules.detection[].discoveryId",
      targetType: "discovery",
      cardinality: "many",
    },
  ],
  localizationKeyFields: ["nameKey"],
};
