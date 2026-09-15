import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";

/**
 * Minimal ResourceDefinition schema -- M0 scope only.
 *
 * This exists to prove the JSON -> Zod -> semantic validation -> immutable
 * Definition Registry pipeline described in the Technology Stack Decision
 * (SS 19-25). It is deliberately not the full economic catalog (that is
 * M5 / Production Economy Master v0.1 scope).
 */
export const ResourceDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: z.string().min(1),
  category: z.enum(["mineral", "agricultural", "forestry", "aquatic"]),
  finite: z.boolean(),
  phase: ContentPhaseSchema,
});

export type ResourceDefinition = z.infer<typeof ResourceDefinitionSchema>;
