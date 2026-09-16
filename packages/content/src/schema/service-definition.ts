import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import { IdRefArraySchema, LocalizationKeySchema, OpenRecordSchema } from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/** ServiceDefinition (Content-Localization-Spec SS46). */
export const ServiceDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  category: z.string().min(1),
  workforce: OpenRecordSchema,
  skills: OpenRecordSchema,
  infrastructure: OpenRecordSchema,
  goodInputs: IdRefArraySchema,
  capacityModel: OpenRecordSchema,
  needTier: z.string().min(1).optional(),
  implementationPhase: ContentPhaseSchema,
});

export type ServiceDefinition = z.infer<typeof ServiceDefinitionSchema>;

export const serviceContentTypeSpec: ContentTypeSpec<ServiceDefinition> = {
  name: "service",
  schema: ServiceDefinitionSchema,
  referenceFields: [{ field: "goodInputs", targetType: "good", cardinality: "many" }],
  localizationKeyFields: ["nameKey"],
};
