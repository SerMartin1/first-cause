import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import { IdRefArraySchema, LocalizationKeySchema, OpenRecordSchema } from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/**
 * ProductionMethodDefinition (Content-Localization-Spec SS44).
 * `capitalGoods` references Good IDs (capital goods are still goods).
 * `productivity`/`waste`/`environment`/`adoption` are open placeholder
 * bags owned by Production (M7).
 */
export const ProductionMethodDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  companyArchetypeIds: IdRefArraySchema,
  outputs: IdRefArraySchema,
  inputs: IdRefArraySchema,
  resourceRequirements: IdRefArraySchema,
  laborRequirements: OpenRecordSchema,
  skillRequirements: OpenRecordSchema,
  energyRequirements: OpenRecordSchema,
  capitalGoods: IdRefArraySchema,
  knowledgeRequirements: IdRefArraySchema,
  discoveries: IdRefArraySchema,
  infrastructure: OpenRecordSchema,
  productivity: OpenRecordSchema,
  waste: OpenRecordSchema,
  environment: OpenRecordSchema,
  adoption: OpenRecordSchema,
  implementationPhase: ContentPhaseSchema,
});

export type ProductionMethodDefinition = z.infer<typeof ProductionMethodDefinitionSchema>;

export const productionMethodContentTypeSpec: ContentTypeSpec<ProductionMethodDefinition> =
  {
    name: "productionMethod",
    schema: ProductionMethodDefinitionSchema,
    referenceFields: [
      {
        field: "companyArchetypeIds",
        targetType: "companyArchetype",
        cardinality: "many",
      },
      { field: "outputs", targetType: "good", cardinality: "many" },
      { field: "inputs", targetType: "good", cardinality: "many" },
      { field: "resourceRequirements", targetType: "resource", cardinality: "many" },
      { field: "capitalGoods", targetType: "good", cardinality: "many" },
      { field: "knowledgeRequirements", targetType: "discovery", cardinality: "many" },
      { field: "discoveries", targetType: "discovery", cardinality: "many" },
    ],
    localizationKeyFields: ["nameKey"],
  };
