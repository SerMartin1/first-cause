import { classifySignificance } from "./significance.js";
import type { ChronicleCandidate, ChronicleEntityRef, SignificanceBreakdown } from "./types.js";

/**
 * CH-04 Aggregation (Chronicle & Historical Significance Spec SS25-31),
 * within-batch half: candidates produced by ONE `buildChronicleCandidates`
 * call that share the same `aggregationKey` (already encoding event
 * type + aggregation scope + scope ID + time window, SS26) fold into a
 * single published candidate. Cross-TICK aggregation -- the same key
 * recurring in a LATER call, after an entry already exists for it -- is
 * `chronicle-entry-store.ts`'s job (SS64 "Update Existing Entry"), not
 * this file's: a store lookup by `aggregationKey`, not a second grouping
 * pass here.
 *
 * SS30 "zakaz fałszywej agregacji" is structural, not a separate check:
 * two candidates only ever share a group here because they already
 * share the same `aggregationKey`, which itself requires the same event
 * type, the same aggregation scope ID (entity/region/world) and the same
 * time window (SS26) -- never merely similar timing or category alone.
 */
export interface AggregationResult {
  /** One entry per resulting group (or per standalone candidate), each already `status: "PUBLISHED"`. */
  readonly published: readonly ChronicleCandidate[];
  /** Every input candidate's final status -- `"PUBLISHED"` for the one representative of each group, `"AGGREGATED"` for the rest. */
  readonly candidateStatusById: ReadonlyMap<string, "PUBLISHED" | "AGGREGATED">;
}

function dedupeEntityRefs(refs: readonly ChronicleEntityRef[]): readonly ChronicleEntityRef[] {
  const byKey = new Map<string, ChronicleEntityRef>();
  for (const ref of refs) byKey.set(`${ref.entityType}:${ref.entityId}`, ref);
  return [...byKey.values()].sort((a, b) =>
    `${a.entityType}:${a.entityId}`.localeCompare(`${b.entityType}:${b.entityId}`),
  );
}

/** Component-wise max across the group: the group's significance is at least as strong as its strongest member (TODO tuning -- SS114 leaves the exact recompute recipe open). */
function foldSignificance(list: readonly SignificanceBreakdown[]): SignificanceBreakdown {
  const max = (pick: (s: SignificanceBreakdown) => number) => Math.max(...list.map(pick));
  const total = Math.round(max((s) => s.total));
  return {
    magnitude: max((s) => s.magnitude),
    duration: max((s) => s.duration),
    populationAffected: max((s) => s.populationAffected),
    geographicScope: max((s) => s.geographicScope),
    novelty: max((s) => s.novelty),
    causalImpact: max((s) => s.causalImpact),
    contextualImportance: max((s) => s.contextualImportance),
    total,
    category: classifySignificance(total),
  };
}

function foldGroup(group: readonly ChronicleCandidate[]): ChronicleCandidate {
  if (group.length === 1) return group[0]!;
  const sorted = [...group].sort((a, b) => a.tick - b.tick || a.id.localeCompare(b.id));
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;

  return {
    ...first,
    tick: last.tick,
    factRefs: [...new Set(sorted.flatMap((c) => c.factRefs))].sort(),
    entityRefs: dedupeEntityRefs(sorted.flatMap((c) => c.entityRefs)),
    regionRefs: [...new Set(sorted.flatMap((c) => c.regionRefs))].sort(),
    causalAnchors: [...new Set(sorted.flatMap((c) => c.causalAnchors))].sort(),
    significance: foldSignificance(sorted.map((c) => c.significance)),
    architectInfluence: Math.max(...sorted.map((c) => c.architectInfluence)),
    isFirstOccurrence: sorted.some((c) => c.isFirstOccurrence),
    status: "PUBLISHED",
  };
}

export function aggregateCandidates(candidates: readonly ChronicleCandidate[]): AggregationResult {
  const groups = new Map<string, ChronicleCandidate[]>();
  const standalone: ChronicleCandidate[] = [];

  for (const candidate of candidates) {
    if (candidate.aggregationKey === undefined) {
      standalone.push(candidate);
      continue;
    }
    const list = groups.get(candidate.aggregationKey);
    if (list) {
      list.push(candidate);
    } else {
      groups.set(candidate.aggregationKey, [candidate]);
    }
  }

  const published: ChronicleCandidate[] = [];
  const candidateStatusById = new Map<string, "PUBLISHED" | "AGGREGATED">();

  for (const candidate of standalone) {
    published.push({ ...candidate, status: "PUBLISHED" });
    candidateStatusById.set(candidate.id, "PUBLISHED");
  }

  for (const key of [...groups.keys()].sort()) {
    const group = groups.get(key)!;
    const folded = foldGroup(group);
    published.push(folded);
    for (const candidate of group) {
      candidateStatusById.set(candidate.id, candidate.id === folded.id ? "PUBLISHED" : "AGGREGATED");
    }
  }

  published.sort((a, b) => a.tick - b.tick || a.id.localeCompare(b.id));
  return { published, candidateStatusById };
}
