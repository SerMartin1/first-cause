import type { ChronicleCategory, DurationState } from "@first-cause/content";

export type { DurationState } from "@first-cause/content";

/**
 * Historical Significance Spec SS10. Only `SETTLEMENT`/`REGIONAL` are
 * produced by `candidate-pipeline.ts` in M19 P0 (the pipeline only sees
 * one fact's own `FactLocation`, which never carries more than a region
 * + optional settlement) -- the broader levels exist here so
 * `sensitivity-filter.ts`/`chronicle-api.ts` and later aggregation
 * (CH-04 spatial aggregation across regions, `MULTI_REGIONAL`+) have a
 * stable vocabulary to grow into without a breaking type change.
 */
export const GEOGRAPHIC_SCOPES = [
  "LOCAL",
  "SETTLEMENT",
  "REGIONAL",
  "MULTI_REGIONAL",
  "CONTINENTAL",
  "WORLD",
] as const;
export type GeographicScope = (typeof GEOGRAPHIC_SCOPES)[number];

/** SS5 Historical Significance category bands. */
export const SIGNIFICANCE_CATEGORIES = [
  "TRACE",
  "MINOR",
  "NOTABLE",
  "MAJOR",
  "HISTORIC",
  "WORLD_DEFINING",
] as const;
export type SignificanceCategory = (typeof SIGNIFICANCE_CATEGORIES)[number];

/** SS34 Event Lifecycle. */
export const PROCESS_LIFECYCLE_STATES = [
  "EMERGING",
  "CONFIRMED",
  "ONGOING",
  "RESOLVED",
  "HISTORICAL",
] as const;
export type ProcessLifecycleState = (typeof PROCESS_LIFECYCLE_STATES)[number];

/** SS18 Candidate != Entry: what became of one `ChronicleCandidate`. `PENDING` is `candidate-pipeline.ts`'s output, before `aggregation.ts` (SS123 step 5) settles it into a final status. */
export type CandidateStatus = "PENDING" | "PUBLISHED" | "AGGREGATED" | "DEFERRED" | "REJECTED";

export interface ChronicleEntityRef {
  readonly entityType: string;
  readonly entityId: string;
}

/**
 * SS188-190 weighted significance model. Every component is normalized
 * to `0..1` by whichever producer computed it (never raw units) --
 * `total` is the only field on a `0..100` scale. Deliberately NOT a pure
 * product of the six SS4 concepts (SS190: multiplication either zeroes a
 * real event through one weak component or explodes through several
 * strong ones).
 */
export interface SignificanceBreakdown {
  readonly magnitude: number;
  readonly duration: number;
  readonly populationAffected: number;
  readonly geographicScope: number;
  readonly novelty: number;
  readonly causalImpact: number;
  /** SS61 Relative Importance's `ContextualSignificance` component. Always `0` in M19 P0 -- see `significance.ts` header. */
  readonly contextualImportance: number;
  readonly total: number;
  readonly category: SignificanceCategory;
}

/** SS19 Candidate Schema. */
export interface ChronicleCandidate {
  readonly id: string;
  readonly factRefs: readonly string[];
  readonly tick: number;
  readonly entityRefs: readonly ChronicleEntityRef[];
  readonly regionRefs: readonly string[];
  readonly eventType: string;
  readonly category: ChronicleCategory;
  readonly significance: SignificanceBreakdown;
  readonly isFirstOccurrence: boolean;
  readonly scope: GeographicScope;
  readonly durationState: DurationState;
  readonly causalAnchors: readonly string[];
  readonly architectInfluence: number;
  readonly aggregationKey: string | undefined;
  readonly status: CandidateStatus;
}

/** SS20 Chronicle Entry Schema. `generatedText` is deliberately absent: SS322 "generatedText is presentation, not source of truth" -- template rendering is a consumer concern (`chronicle-api.ts`/M21), never stored state. */
export interface ChronicleEntry {
  readonly id: string;
  readonly startTick: number;
  readonly endTick: number;
  readonly titleKey: string;
  readonly templateKey: string;
  readonly primaryFactRefs: readonly string[];
  readonly supportingFactRefs: readonly string[];
  readonly causalAnchorRefs: readonly string[];
  readonly entityRefs: readonly ChronicleEntityRef[];
  readonly regionRefs: readonly string[];
  readonly category: ChronicleCategory;
  readonly eventType: string;
  readonly significance: SignificanceBreakdown;
  readonly scope: GeographicScope;
  readonly architectInfluence: number;
  readonly turningPoint: boolean;
  /** SS79-80 Historical Anchor -- protects `primaryFactRefs`/`causalAnchorRefs` from Causal Memory pruning (`historical-anchor.ts`). */
  readonly historicalAnchor: boolean;
  readonly lifecycleState: ProcessLifecycleState;
  /** SS68 Data Payload -- everything the template named by `templateKey` needs to render, nothing else. */
  readonly dataPayload: Readonly<Record<string, unknown>>;
}
