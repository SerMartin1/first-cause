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
