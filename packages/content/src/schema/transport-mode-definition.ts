import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import {
  IdRefArraySchema,
  LocalizationKeySchema,
  OpenRecordSchema,
  TagArraySchema,
} from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/** TransportModeDefinition (Content-Localization-Spec SS47). */
export const TransportModeDefinitionSchema = z.object({
  id: ContentIdSchema,
  nameKey: LocalizationKeySchema,
  discoveries: IdRefArraySchema,
  infrastructure: OpenRecordSchema,
  capitalGoods: IdRefArraySchema,
  cost: OpenRecordSchema,
  capacity: OpenRecordSchema,
  terrainCompatibility: TagArraySchema,
  cargoCompatibility: TagArraySchema,
  energy: OpenRecordSchema,
  implementationPhase: ContentPhaseSchema,
});

export type TransportModeDefinition = z.infer<typeof TransportModeDefinitionSchema>;

export const transportModeContentTypeSpec: ContentTypeSpec<TransportModeDefinition> = {
  name: "transportMode",
  schema: TransportModeDefinitionSchema,
  referenceFields: [
    { field: "discoveries", targetType: "discovery", cardinality: "many" },
    { field: "capitalGoods", targetType: "good", cardinality: "many" },
  ],
  localizationKeyFields: ["nameKey"],
};
