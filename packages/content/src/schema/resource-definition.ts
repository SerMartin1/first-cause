import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import {
  IdRefArraySchema,
  LocalizationKeySchema,
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
 * ResourceDefinition (Content-Localization-Spec SS41): the minimal field
 * set for M2. `occurrenceRules`/`discoveryRules` are open placeholder
 * bags -- their real shape belongs to World Generation (M22) and
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
  discoveryRules: OpenRecordSchema,
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
  ],
  localizationKeyFields: ["nameKey"],
};
