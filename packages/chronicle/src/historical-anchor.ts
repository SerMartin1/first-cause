import type { ChronicleEntry } from "./types.js";

/**
 * SS79-80 Historical Anchor / Anchor Eligibility: "Typowe: Turning
 * Point, Historic+ event, world first, major intervention, settlement
 * stage transition, major discovery, structural collapse." Which EVENT
 * TYPES count as "major discovery"/"settlement stage transition" is
 * content data (`EventTypeDefinition.anchorPolicy.alwaysAnchor`, set per
 * type in `content/eventTypes/*.json`, e.g. `resource_discovered`,
 * `settlement_stage_changed`, `discovery_occurred`,
 * `intervention_major_consequence`) -- this function stays generic
 * (AGENTS.md "brak hardcode per region/discovery") and only adds the
 * dynamic, entry-shape-driven rules content cannot express upfront:
 * Historic+/World-Defining significance, an already-flagged Turning
 * Point, and strong Architect influence.
 */
const MAJOR_INTERVENTION_INFLUENCE_THRESHOLD_TODO_TUNING = 0.6;

export function shouldBeHistoricalAnchor(entry: ChronicleEntry, eventTypeAlwaysAnchor: boolean): boolean {
  if (eventTypeAlwaysAnchor) return true;
  if (entry.significance.category === "HISTORIC" || entry.significance.category === "WORLD_DEFINING") {
    return true;
  }
  if (entry.turningPoint) return true;
  if (entry.architectInfluence >= MAJOR_INTERVENTION_INFLUENCE_THRESHOLD_TODO_TUNING) return true;
  return false;
}

/**
 * The fact IDs a caller (`WorldRunner`) must union with
 * `@first-cause/causality`'s own `isAnchor()` before pruning (SS135
 * "Historic events nadal posiada wystarczające dane do WHY?" /
 * CAUS-010). `causality` stays unaware of `chronicle` -- this is the
 * one-directional adapter, not a change to `isAnchor`'s signature.
 */
export function collectHistoricalAnchorFactIds(
  entries: readonly ChronicleEntry[],
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (!entry.historicalAnchor) continue;
    for (const ref of entry.primaryFactRefs) ids.add(ref);
    for (const ref of entry.causalAnchorRefs) ids.add(ref);
  }
  return ids;
}
