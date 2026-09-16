import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import {
  IdRefArraySchema,
  LocalizationKeySchema,
  NonNegativeIntSchema,
  OpenRecordSchema,
  TagArraySchema,
} from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/**
 * DiscoveryDefinition (Content-Localization-Spec SS45). `primaryDomainId`/
 * `secondaryDomainIds` are plain ContentIds, not cross-reference-validated:
 * KnowledgeDomainDefinition is M15 (Technology) scope, not M2.
 * `unlocks` is polymorphic (may point at goods, PMs, archetypes,
 * transport modes, ...) -- validated per-target-type once those
 * consumers exist (M7+), not here.
 */
export const DiscoveryDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  primaryDomainId: ContentIdSchema,
  secondaryDomainIds: z.array(ContentIdSchema).default([]),
  tier: NonNegativeIntSchema,
  prerequisites: IdRefArraySchema,
  knowledgeRequirements: OpenRecordSchema,
  conditions: OpenRecordSchema,
  pressureModifiers: OpenRecordSchema,
  unlocks: z.array(ContentIdSchema).default([]),
  diffusion: OpenRecordSchema,
  adoption: OpenRecordSchema,
  causalityTags: TagArraySchema,
  chronicleSignificance: OpenRecordSchema,
  implementationPhase: ContentPhaseSchema,
});

export type DiscoveryDefinition = z.infer<typeof DiscoveryDefinitionSchema>;

export const discoveryContentTypeSpec: ContentTypeSpec<DiscoveryDefinition> = {
  name: "discovery",
  schema: DiscoveryDefinitionSchema,
  referenceFields: [
    {
      field: "prerequisites",
      targetType: "discovery",
      cardinality: "many",
      cyclic: true,
    },
  ],
  localizationKeyFields: ["nameKey"],
};
