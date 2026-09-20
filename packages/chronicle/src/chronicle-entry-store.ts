import { classifySignificance } from "./significance.js";
import type { ChronicleCandidate, ChronicleEntityRef, ChronicleEntry, SignificanceBreakdown } from "./types.js";

/** What the caller supplies to render a candidate into an entry's presentation fields -- deliberately separate from `ChronicleCandidate` since it needs a `ChronicleTemplateDefinition` lookup + (later) real entity names the `chronicle` package itself has no access to (see `candidate-pipeline.ts`'s header on why this package carries no `WorldState` dependency). */
export interface ChronicleEntryPresentation {
  readonly titleKey: string;
  readonly templateKey: string;
  readonly dataPayload: Readonly<Record<string, unknown>>;
}

function dedupeEntityRefs(refs: readonly ChronicleEntityRef[]): readonly ChronicleEntityRef[] {
  const byKey = new Map<string, ChronicleEntityRef>();
  for (const ref of refs) byKey.set(`${ref.entityType}:${ref.entityId}`, ref);
  return [...byKey.values()].sort((a, b) =>
    `${a.entityType}:${a.entityId}`.localeCompare(`${b.entityType}:${b.entityId}`),
  );
}

function foldSignificance(a: SignificanceBreakdown, b: SignificanceBreakdown): SignificanceBreakdown {
  const total = Math.round(Math.max(a.total, b.total));
  return {
    magnitude: Math.max(a.magnitude, b.magnitude),
    duration: Math.max(a.duration, b.duration),
    populationAffected: Math.max(a.populationAffected, b.populationAffected),
    geographicScope: Math.max(a.geographicScope, b.geographicScope),
    novelty: Math.max(a.novelty, b.novelty),
    causalImpact: Math.max(a.causalImpact, b.causalImpact),
    contextualImportance: Math.max(a.contextualImportance, b.contextualImportance),
    total,
    category: classifySignificance(total),
  };
}

/**
 * CH-05 Chronicle Entry storage (Chronicle & Historical Significance Spec
 * SS20). Append-and-update, NOT append-only like `FactStore`: SS65 "Entry
 * Revision" explicitly allows a later significance/endTick/turningPoint
 * on the SAME entry, as long as the underlying `SimulationFact`s it
 * anchors to never change (CHRON-002) -- this store only ever revises
 * its own presentation records, never a fact.
 */
export class ChronicleEntryStore {
  private readonly entries = new Map<string, ChronicleEntry>();
  private readonly entryIdByAggregationKey = new Map<string, string>();
  private nextSequence = 0;

  get(id: string): ChronicleEntry | undefined {
    return this.entries.get(id);
  }

  /** Stable order: `startTick` then `id`. */
  all(): readonly ChronicleEntry[] {
    return [...this.entries.values()].sort(
      (a, b) => a.startTick - b.startTick || a.id.localeCompare(b.id),
    );
  }

  get size(): number {
    return this.entries.size;
  }

  /**
   * Publishes one already-aggregated candidate (`aggregation.ts`'s
   * output) as a new entry, or -- SS64 "Update Existing Entry" -- folds
   * it into the still-tracked entry that a PRIOR call published under
   * the same `aggregationKey`, instead of creating a duplicate. Only
   * called with candidates that already cleared `aggregateCandidates`
   * (i.e. `status === "PUBLISHED"`), so it never needs to know about
   * `"AGGREGATED"` siblings itself.
   */
  upsert(candidate: ChronicleCandidate, presentation: ChronicleEntryPresentation): ChronicleEntry {
    const existingId =
      candidate.aggregationKey !== undefined
        ? this.entryIdByAggregationKey.get(candidate.aggregationKey)
        : undefined;
    const existing = existingId !== undefined ? this.entries.get(existingId) : undefined;

    if (existing) {
      const merged: ChronicleEntry = {
        ...existing,
        endTick: Math.max(existing.endTick, candidate.tick),
        supportingFactRefs: [
          ...new Set([
            ...existing.supportingFactRefs,
            ...candidate.factRefs.filter((ref) => !existing.primaryFactRefs.includes(ref)),
          ]),
        ].sort(),
        causalAnchorRefs: [...new Set([...existing.causalAnchorRefs, ...candidate.causalAnchors])].sort(),
        entityRefs: dedupeEntityRefs([...existing.entityRefs, ...candidate.entityRefs]),
        regionRefs: [...new Set([...existing.regionRefs, ...candidate.regionRefs])].sort(),
        significance: foldSignificance(existing.significance, candidate.significance),
        architectInfluence: Math.max(existing.architectInfluence, candidate.architectInfluence),
        lifecycleState: existing.lifecycleState === "EMERGING" ? "ONGOING" : existing.lifecycleState,
      };
      this.entries.set(merged.id, merged);
      return merged;
    }

    const id = `chronicle_${candidate.tick}_${this.nextSequence}`;
    this.nextSequence += 1;
    const entry: ChronicleEntry = {
      id,
      startTick: candidate.tick,
      endTick: candidate.tick,
      titleKey: presentation.titleKey,
      templateKey: presentation.templateKey,
      primaryFactRefs: candidate.factRefs,
      supportingFactRefs: [],
      causalAnchorRefs: candidate.causalAnchors,
      entityRefs: candidate.entityRefs,
      regionRefs: candidate.regionRefs,
      category: candidate.category,
      eventType: candidate.eventType,
      significance: candidate.significance,
      scope: candidate.scope,
      architectInfluence: candidate.architectInfluence,
      turningPoint: false,
      historicalAnchor: false,
      lifecycleState: "EMERGING",
      dataPayload: presentation.dataPayload,
    };
    this.entries.set(id, entry);
    if (candidate.aggregationKey !== undefined) {
      this.entryIdByAggregationKey.set(candidate.aggregationKey, id);
    }
    return entry;
  }

  /** SS65 Entry Revision escape hatch for fields this store's own `upsert` never sets from a candidate (`turningPoint`, `historicalAnchor`) -- never touches facts or refs. */
  markHistoricalAnchor(id: string, historicalAnchor: boolean): void {
    const existing = this.entries.get(id);
    if (!existing) return;
    this.entries.set(id, { ...existing, historicalAnchor });
  }

  markTurningPoint(id: string, turningPoint: boolean): void {
    const existing = this.entries.get(id);
    if (!existing) return;
    this.entries.set(id, { ...existing, turningPoint });
  }

  /**
   * M20 (SS58 Canonical State): `entryIdByAggregationKey` is saved
   * explicitly rather than re-derived from `entries` on load -- today
   * every entry's `aggregationKey` (when present) maps back to exactly
   * the entry that owns it 1:1, so re-deriving would work, but the
   * index is cheap to save directly and this keeps `fromState` from
   * silently depending on that invariant continuing to hold as CH-08+
   * (Historical Threads) evolves the entry model.
   */
  getState(): ChronicleEntryStoreState {
    return {
      entries: this.all(),
      nextSequence: this.nextSequence,
      entryIdByAggregationKey: Object.fromEntries(
        [...this.entryIdByAggregationKey.entries()].sort(([a], [b]) => a.localeCompare(b)),
      ),
    };
  }

  static fromState(state: ChronicleEntryStoreState): ChronicleEntryStore {
    const store = new ChronicleEntryStore();
    store.nextSequence = state.nextSequence;
    for (const entry of state.entries) store.entries.set(entry.id, entry);
    for (const [key, entryId] of Object.entries(state.entryIdByAggregationKey)) {
      store.entryIdByAggregationKey.set(key, entryId);
    }
    return store;
  }
}

/** M20: `ChronicleEntryStore.getState()`/`static fromState()` round-trip shape. */
export interface ChronicleEntryStoreState {
  readonly entries: readonly ChronicleEntry[];
  readonly nextSequence: number;
  readonly entryIdByAggregationKey: Readonly<Record<string, string>>;
}

export function createChronicleEntryStore(): ChronicleEntryStore {
  return new ChronicleEntryStore();
}
