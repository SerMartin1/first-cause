import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import {
  LocalizationKeySchema,
  NonNegativeIntSchema,
  OpenRecordSchema,
  TagArraySchema,
} from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/**
 * ArchitectInterventionDefinition (Content-Localization-Spec SS48).
 * `rootFactType` is a free string: the Causality fact-type vocabulary
 * it names is not defined until M17.
 */
export const InterventionDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  category: z.string().min(1),
  allowedScopes: TagArraySchema,
  parameters: OpenRecordSchema,
  constraints: OpenRecordSchema,
  costs: OpenRecordSchema,
  cooldown: NonNegativeIntSchema,
  stacking: OpenRecordSchema,
  rootFactType: z.string().min(1),
  implementationPhase: ContentPhaseSchema,
});

export type InterventionDefinition = z.infer<typeof InterventionDefinitionSchema>;

export const interventionContentTypeSpec: ContentTypeSpec<InterventionDefinition> = {
  name: "intervention",
  schema: InterventionDefinitionSchema,
  referenceFields: [],
  localizationKeyFields: ["nameKey"],
};
