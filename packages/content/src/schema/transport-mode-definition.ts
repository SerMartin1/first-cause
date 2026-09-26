import { z } from "zod";
import { ContentIdSchema, ContentPhaseSchema } from "./content-id.js";
import {
  IdRefArraySchema,
  LocalizationKeySchema,
  OpenRecordSchema,
  TagArraySchema,
} from "./common.js";
import type { ContentTypeSpec } from "./reference-field.js";

/**
 * Rodziny wizualne tras (Living Atlas Visual Asset Spec v1.3 §8, §28.6):
 * prezentacyjna metadana contentu -- jak renderer rysuje dany tryb
 * transportu NA KRAWĘDZI połączenia. Nie wpływa na symulację. Brak pola =
 * trasa nieklasyfikowana (cienka linia bazowa), nigdy domysł w kodzie.
 */
export const ROUTE_VISUAL_FAMILIES = [
  "path",
  "road",
  "rail",
  "waterway",
  "sea_lane",
] as const;
export type RouteVisualFamily = (typeof ROUTE_VISUAL_FAMILIES)[number];

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
  /** M21-VIS-R2: rodzina wizualna trasy (§8); opcjonalna, tylko prezentacja. */
  routeFamily: z.enum(ROUTE_VISUAL_FAMILIES).optional(),
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
