import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import { LocalizationKeySchema, OpenRecordSchema } from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/**
 * KnowledgeDomainDefinition (Entity Data Model SS26, Content-Localization-Spec
 * SS4). 5 domen wg `TECH-004`/`TECH-008` (Canonical Decisions,
 * zaktualizowane 2026-09-18): agriculture_food, mining_metallurgy,
 * construction_mechanics, transport_communication, science_society.
 * `spilloverTargets` to otwarty placeholder (AGENTS.md "configurable
 * placeholder + TODO tuning") -- jego kształt (które domeny zyskują
 * wiedzę od których i ile) definiuje M15's system `technology/knowledge`,
 * nie M2 Data Foundation.
 */
export const KnowledgeDomainDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  spilloverTargets: OpenRecordSchema,
  implementationPhase: ContentPhaseSchema,
});

export type KnowledgeDomainDefinition = z.infer<typeof KnowledgeDomainDefinitionSchema>;

export const knowledgeDomainContentTypeSpec: ContentTypeSpec<KnowledgeDomainDefinition> = {
  name: "knowledgeDomain",
  schema: KnowledgeDomainDefinitionSchema,
  referenceFields: [],
  localizationKeyFields: ["nameKey"],
};
