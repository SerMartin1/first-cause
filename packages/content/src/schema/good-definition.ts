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
 * GoodDefinition (Content-Localization-Spec SS42). `technologyRequirements`
 * is modeled as Discovery references (the domain model's closest in-scope
 * proxy for "technology"; KnowledgeDomain does not exist as a type until
 * M15). `householdNeed` is kept an open string rather than an enum: the
 * Survival->...->Modern tier taxonomy is M9 (Labor & Households) scope.
 * `basePrice` (BaseContentPrice, M8 "Dane") seeds `Market.goods[x].localPrice`
 * -- see `PositiveNumberSchema`.
 */
export const GoodDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  category: z.string().min(1),
  tags: TagArraySchema,
  producerArchetypeIds: IdRefArraySchema,
  productionMethodIds: IdRefArraySchema,
  downstreamGoodIds: IdRefArraySchema,
  householdNeed: z.string().min(1).optional(),
  basePrice: PositiveNumberSchema.optional(),
  demandSources: OpenRecordSchema,
  storageProperties: OpenRecordSchema,
  transportProperties: OpenRecordSchema,
  substituteIds: IdRefArraySchema,
  technologyRequirements: IdRefArraySchema,
  implementationPhase: ContentPhaseSchema,
});

export type GoodDefinition = z.infer<typeof GoodDefinitionSchema>;

export const goodContentTypeSpec: ContentTypeSpec<GoodDefinition> = {
  name: "good",
  schema: GoodDefinitionSchema,
  referenceFields: [
    {
      field: "producerArchetypeIds",
      targetType: "companyArchetype",
      cardinality: "many",
    },
    { field: "productionMethodIds", targetType: "productionMethod", cardinality: "many" },
    { field: "downstreamGoodIds", targetType: "good", cardinality: "many", cyclic: true },
    { field: "substituteIds", targetType: "good", cardinality: "many" },
    { field: "technologyRequirements", targetType: "discovery", cardinality: "many" },
  ],
  localizationKeyFields: ["nameKey"],
};
