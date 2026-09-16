import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import {
  IdRefArraySchema,
  LocalizationKeySchema,
  NonNegativeNumberSchema,
  OpenRecordSchema,
} from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/** CompanyArchetypeDefinition (Content-Localization-Spec SS43). */
export const CompanyArchetypeDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  sector: z.string().min(1),
  allowedInputs: IdRefArraySchema,
  allowedOutputs: IdRefArraySchema,
  productionMethodIds: IdRefArraySchema,
  capitalRequirement: NonNegativeNumberSchema,
  workforceProfile: OpenRecordSchema,
  skillProfile: OpenRecordSchema,
  energyProfile: OpenRecordSchema,
  infrastructureRequirements: OpenRecordSchema,
  knowledgeRequirements: IdRefArraySchema,
  implementationPhase: ContentPhaseSchema,
});

export type CompanyArchetypeDefinition = z.infer<typeof CompanyArchetypeDefinitionSchema>;

export const companyArchetypeContentTypeSpec: ContentTypeSpec<CompanyArchetypeDefinition> =
  {
    name: "companyArchetype",
    schema: CompanyArchetypeDefinitionSchema,
    referenceFields: [
      { field: "allowedInputs", targetType: "good", cardinality: "many" },
      { field: "allowedOutputs", targetType: "good", cardinality: "many" },
      {
        field: "productionMethodIds",
        targetType: "productionMethod",
        cardinality: "many",
      },
      { field: "knowledgeRequirements", targetType: "discovery", cardinality: "many" },
    ],
    localizationKeyFields: ["nameKey"],
  };
