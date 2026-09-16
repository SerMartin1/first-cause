import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import { LocalizationKeySchema, OpenRecordSchema } from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/**
 * EventTypeDefinition (Content-Localization-Spec SS49): unlike the other
 * types, SS49 gives no explicit minimal field list beyond "describes the
 * mechanism, not a finished narrative". This is the smallest shape
 * consistent with that: an event type is identified, named, categorized,
 * and carries open trigger/effect data owned by whichever system defines
 * concrete event types (M20 Events phase in SIM-003).
 */
export const EventTypeDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  category: z.string().min(1),
  triggerConditions: OpenRecordSchema,
  effects: OpenRecordSchema,
  implementationPhase: ContentPhaseSchema,
});

export type EventTypeDefinition = z.infer<typeof EventTypeDefinitionSchema>;

export const eventTypeContentTypeSpec: ContentTypeSpec<EventTypeDefinition> = {
  name: "eventType",
  schema: EventTypeDefinitionSchema,
  referenceFields: [],
  localizationKeyFields: ["nameKey"],
};
