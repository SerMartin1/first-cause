import type { ChronicleCategory, ChronicleTemplateDefinition, DefinitionRegistry } from "@first-cause/content";
import { filterBySensitivity, type ChronicleSensitivity } from "./sensitivity.js";
import type { ChronicleEntry, GeographicScope, SignificanceBreakdown } from "./types.js";

/**
 * CH-07 (Entity/Region Chronicle) + CH-14 (data for M21, not UI itself)
 * subset of the SS205 Chronicle API this milestone actually needs.
 * `getTopEvents`/`getHistoricalThread`/`getTurningPoints`/
 * `getArchitectLegacy` are deliberately absent here -- they read
 * Historical Threads / Turning Points / Architect Legacy state that
 * CH-08/CH-10/CH-11 (P1, not this pass) haven't built yet.
 */
export interface ChronicleQueryFilters {
  readonly category?: ChronicleCategory;
  readonly entityId?: string;
  readonly regionId?: string;
}

/** SS53/SS55: World/Region/Category Chronicle, filtered by sensitivity FIRST (a World Chronicle view must never show more than the sensitivity level allows). */
export function getChronicle(
  entries: readonly ChronicleEntry[],
  sensitivity: ChronicleSensitivity,
  filters: ChronicleQueryFilters = {},
): readonly ChronicleEntry[] {
  return filterBySensitivity(entries, sensitivity)
    .filter((entry) => filters.category === undefined || entry.category === filters.category)
    .filter(
      (entry) =>
        filters.entityId === undefined || entry.entityRefs.some((ref) => ref.entityId === filters.entityId),
    )
    .filter((entry) => filters.regionId === undefined || entry.regionRefs.includes(filters.regionId));
}

/**
 * SS54 Entity Chronicle + SS60 Contextual Promotion: deliberately does
 * NOT filter by sensitivity. An entry that never clears the World
 * Chronicle's threshold can still be a genuinely important part of ONE
 * entity's own history -- filtering by `entityId` membership rather than
 * a global score is what SS60 actually asks for, not a separate
 * `contextualImportance` score (`significance.ts`'s header explains why
 * that component stays `0` in M19 P0; this query is where SS60's real
 * requirement is met instead).
 */
export function getEntityHistory(
  entries: readonly ChronicleEntry[],
  entityId: string,
): readonly ChronicleEntry[] {
  return entries
    .filter((entry) => entry.entityRefs.some((ref) => ref.entityId === entityId))
    .sort((a, b) => a.startTick - b.startTick || a.id.localeCompare(b.id));
}

/** SS200 "Why this mattered" -- distinct from Causality's "why this happened" (SS201, CHRON-003). Never calls `explainWhy`; a consumer that also wants the causal WHY? calls that separately with `entry.primaryFactRefs[0]`. */
export interface WhyItMattered {
  readonly significance: SignificanceBreakdown;
  readonly scope: GeographicScope;
  readonly turningPoint: boolean;
  readonly historicalAnchor: boolean;
}

export function getWhyItMattered(entry: ChronicleEntry): WhyItMattered {
  return {
    significance: entry.significance,
    scope: entry.scope,
    turningPoint: entry.turningPoint,
    historicalAnchor: entry.historicalAnchor,
  };
}

/** CH-13 support: the `ChronicleTemplateDefinition` whose `factOrEventType` names this `eventType`. Linear scan over a ~15-entry registry -- indexing is unnecessary at this scale. */
export function findTemplateForEventType(
  templates: DefinitionRegistry<ChronicleTemplateDefinition>,
  eventType: string,
): ChronicleTemplateDefinition | undefined {
  return templates.all().find((template) => template.factOrEventType === eventType);
}
