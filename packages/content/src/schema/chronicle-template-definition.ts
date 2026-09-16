import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import { LocalizationKeySchema, OpenRecordSchema } from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/**
 * ChronicleTemplateDefinition (Content-Localization-Spec SS50). Unlike
 * every other type it has no `nameKey` -- it names a `titleKey`/`bodyKey`
 * pair instead, since a Chronicle entry is a title+body, not a single
 * display name. `factOrEventType` is a free string: the fact/event-type
 * vocabulary it names is not defined until M17/M20.
 */
export const ChronicleTemplateDefinitionSchema = z.object({
  id: ContentIdSchema,
  factOrEventType: z.string().min(1),
  titleKey: LocalizationKeySchema,
  bodyKey: LocalizationKeySchema,
  requiredData: z.array(z.string().min(1)).default([]),
  variants: OpenRecordSchema,
  implementationPhase: ContentPhaseSchema,
});

export type ChronicleTemplateDefinition = z.infer<
  typeof ChronicleTemplateDefinitionSchema
>;

export const chronicleTemplateContentTypeSpec: ContentTypeSpec<ChronicleTemplateDefinition> =
  {
    name: "chronicleTemplate",
    schema: ChronicleTemplateDefinitionSchema,
    referenceFields: [],
    localizationKeyFields: ["titleKey", "bodyKey"],
  };
