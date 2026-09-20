import type { CausalEdge, SimulationFact } from "@first-cause/causality";
import type { DefinitionRegistry, DurationState, EventTypeDefinition } from "@first-cause/content";
import type { ActiveProcess, ActiveProcessRegistry } from "./active-process-registry.js";
import type { NoveltyRegistry, NoveltyScope } from "./novelty-registry.js";
import { computeSignificance } from "./significance.js";
import type { ChronicleCandidate, GeographicScope } from "./types.js";

/**
 * CH-03 Candidate Pipeline (Chronicle & Historical Significance Spec
 * SS17-19, SS123 steps 1-4). Deliberately has NO `WorldState`/entities
 * dependency (see `packages/chronicle/package.json`): everything it
 * needs beyond the fact itself comes either from the fact/edges/
 * registries already passed in, or from the optional `ChronicleContext`
 * hook the caller (`WorldRunner`) fills in with real read-model data.
 * Keeping this boundary hard is what lets `significance.ts` stay a pure
 * function testable without a running simulation.
 *
 * SS186 "brak hardcode per region/discovery": which raw `SimulationFact`
 * types are Chronicle-eligible, and how, is entirely driven by
 * `EventTypeDefinition` content (`@first-cause/content`'s `eventType`
 * registry) plus the one small mapping table below from raw fact type to
 * `EventTypeDefinition.id` -- adding a new event type to content data
 * never requires touching this file, UNLESS the new type also needs a
 * pattern detector (see the "not yet wired" list below), which is
 * inherently code, not data.
 */

/**
 * Direct 1:1 mappings from a raw `SimulationFact.type` this codebase
 * actually emits today to the `EventTypeDefinition.id` that scores it.
 * Content authors can add more `EventTypeDefinition`s freely; only a
 * fact type this pipeline can genuinely observe belongs on the left.
 *
 * NOT included here (defined as content, ready for a future detector,
 * intentionally not wired to a candidate yet -- see spec SS35-38,
 * AGENTS.md "nie wymyślaj mechaniki, oznacz TODO"): `regional_boom`/
 * `regional_bust` (genuine multi-signal composite trend detectors --
 * need their own calibrated indicator, not a single raw fact), and
 * `intervention_major_consequence` (Architect Legacy, CH-11, P1 --
 * belongs on top of `queryButterflyEffect`/M18, not this table; wired
 * separately, see `intervention-legacy.ts`).
 *
 * `shortage_resolved`/`migration_wave`/`trade_route_emerged` ARE wired,
 * but through `ActiveProcessRegistry` accumulation/silence detection
 * below, not this table (no single raw fact represents "resolved"/"a
 * sustained wave"/"a persistent route"). `technology_adoption_wave`
 * relies entirely on CH-04 aggregation (`aggregationPolicy.scope:
 * "entity"` in content, i.e. per `discoveryId`) to fold repeated
 * `technology_adoption_increased` ticks for the SAME discovery into one
 * entry -- never across different discoveries, which would be exactly
 * the false aggregation SS30 forbids.
 */
const RAW_FACT_TYPE_TO_EVENT_TYPE_TODO_TUNING: Readonly<Record<string, string>> = {
  resource_discovered: "resource_discovered",
  resource_reserve_milestone: "resource_depletion_milestone",
  company_founded: "company_founded",
  company_expanded: "company_major_expansion",
  company_closed: "company_closed",
  shortage_started: "shortage_started",
  settlement_stage_changed: "settlement_stage_changed",
  discovery_occurred: "discovery_occurred",
  technology_adoption_increased: "technology_adoption_wave",
};

/** SS7 Relative Magnitude: a 100%+ relative change already saturates the component to `1`. */
const MAGNITUDE_SATURATION_TODO_TUNING = 1;
/** SS115/117: two PRIMARY-band (~1.0 strength) outgoing edges already saturate `causalImpact` to `1`. */
const CAUSAL_IMPACT_SATURATION_TODO_TUNING = 2;
/** SS33 Trend End: ticks of silence (no renewal `shortage_started`) before an open shortage is considered resolved. VS ticks are monthly, so 6 = half a year. */
const SHORTAGE_RESOLUTION_SILENCE_TICKS_TODO_TUNING = 6;
/** How many ticks an unresolved shortage needs to be open before its resolution's `duration` component saturates to `1`. */
const SHORTAGE_DURATION_SATURATION_TICKS_TODO_TUNING = 36;

/** SS33 Trend End: ticks with no renewing `population_migrated_in` before an open migration process is considered resolved. */
const MIGRATION_WAVE_SILENCE_TICKS_TODO_TUNING = 6;
/** Caps a continuously-renewed migration process (`findExceedingDuration`) so decades of steady background migration cannot silently accumulate into one unbounded "wave" that never resolves -- 5 years at monthly VS ticks. */
const MIGRATION_WAVE_MAX_DURATION_TICKS_TODO_TUNING = 60;
/** How many ticks a migration process needs to have run before its resolution's `duration` component saturates to `1`. */
const MIGRATION_WAVE_DURATION_SATURATION_TICKS_TODO_TUNING = 36;
/** SS7: accumulated net migrants reaching this share of the destination's population (via `ChronicleContext.regionPopulation`) saturates `magnitude` to `1` -- SS7's own example ("+500 in a 700-person village") is roughly this scale. */
const MIGRATION_WAVE_POPULATION_SATURATION_RATIO_TODO_TUNING = 0.5;
/** Fallback absolute scale for `magnitude` when no `regionPopulation` context is supplied. */
const MIGRATION_WAVE_FALLBACK_SCALE_TODO_TUNING = 500;

/** SS33 Trend End: ticks with no renewing `trade_flow_active` before an open trade route is considered resolved. */
const TRADE_ROUTE_SILENCE_TICKS_TODO_TUNING = 6;
/** Unlike `migration_wave`, a trade route is a PERSISTENT structural feature (SS176 "Trade Hub Significance... gdy przepływy są trwałe") -- this cap forces a periodic significance re-publish into the SAME entry (via a stable `aggregationKey`, see `tradeRouteProcessKey`) rather than letting one open process run forever unexamined. */
const TRADE_ROUTE_MAX_DURATION_TICKS_TODO_TUNING = 60;
/** How many ticks a trade route episode needs to have run before its `duration` component saturates to `1`. */
const TRADE_ROUTE_DURATION_SATURATION_TICKS_TODO_TUNING = 36;
/** Fallback absolute scale for `magnitude` -- accumulated flow volume across an episode reaching this saturates to `1` (TODO tuning: no per-good/per-region context hook exists yet for a more relative denominator). */
const TRADE_ROUTE_FALLBACK_SCALE_TODO_TUNING = 2000;

/** Exported for `intervention-legacy.ts` -- same duration-classification proxy, one shared table. */
export const DURATION_COMPONENT_TODO_TUNING: Readonly<Record<DurationState, number>> = {
  INSTANTANEOUS: 0.1,
  SHORT: 0.3,
  SUSTAINED: 0.6,
  STRUCTURAL: 0.85,
  MULTI_GENERATIONAL: 1,
};

/** Exported for `intervention-legacy.ts` -- same geographic-scope proxy, one shared table. */
export const GEOGRAPHIC_SCOPE_COMPONENT_TODO_TUNING: Readonly<Record<GeographicScope, number>> = {
  LOCAL: 0.1,
  SETTLEMENT: 0.3,
  REGIONAL: 0.55,
  MULTI_REGIONAL: 0.75,
  CONTINENTAL: 0.9,
  WORLD: 1,
};

/** Per-fact context a caller can supply when it has real read-model data the fact itself doesn't carry (SS7 relative magnitude denominators, SS9 population reach). Every field is optional -- omitted fields fall back to generic, content-agnostic proxies. */
export interface MagnitudeContext {
  readonly relativeDenominator?: number;
  readonly populationAffected?: number;
  readonly populationDenominator?: number;
}

export interface ChronicleContext {
  readonly magnitudeContext?: (fact: SimulationFact) => MagnitudeContext | undefined;
  /**
   * Population denominator for accumulator-based detectors that resolve
   * a candidate from an `ActiveProcess`, not a single fact (e.g.
   * `migration_wave`) -- keyed by region, since the process only carries
   * a `regionId`/`settlementId`, not a fact to hand to `magnitudeContext`.
   */
  readonly regionPopulation?: (regionId: string) => number | undefined;
}

export interface BuildChronicleCandidatesInput {
  /** This tick's newly-emitted facts only -- registries carry cross-tick state, this function does not re-scan history. */
  readonly facts: readonly SimulationFact[];
  /** Full edge set so far (bounded 1-hop lookup only, SS117 anti-explosion). */
  readonly edges: readonly CausalEdge[];
  readonly architectInfluenceByFactId: ReadonlyMap<string, number>;
  readonly eventTypes: DefinitionRegistry<EventTypeDefinition>;
  readonly currentTick: number;
  readonly noveltyRegistry: NoveltyRegistry;
  readonly activeProcessRegistry: ActiveProcessRegistry;
  readonly context?: ChronicleContext;
  readonly shortageResolutionSilenceTicks?: number;
  readonly migrationWaveSilenceTicks?: number;
  readonly migrationWaveMaxDurationTicks?: number;
  readonly tradeRouteSilenceTicks?: number;
  readonly tradeRouteMaxDurationTicks?: number;
}

function determineScope(fact: SimulationFact): GeographicScope {
  return fact.location.settlementId !== undefined ? "SETTLEMENT" : "REGIONAL";
}

function computeMagnitudeComponent(fact: SimulationFact, denominator: number | undefined): number {
  const values = fact.values as { before?: unknown; after?: unknown };
  if (typeof values.before !== "number" || typeof values.after !== "number") return 0;
  const delta = Math.abs(values.after - values.before);
  if (delta === 0) return 0;
  const effectiveDenominator = denominator ?? (values.before !== 0 ? Math.abs(values.before) : undefined);
  if (effectiveDenominator === undefined || effectiveDenominator === 0) return 1;
  return Math.min(1, delta / effectiveDenominator / MAGNITUDE_SATURATION_TODO_TUNING);
}

function computePopulationAffectedComponent(
  magnitudeContext: MagnitudeContext | undefined,
  geographicScopeComponent: number,
): number {
  if (
    magnitudeContext?.populationAffected !== undefined &&
    magnitudeContext.populationDenominator !== undefined &&
    magnitudeContext.populationDenominator > 0
  ) {
    return Math.min(1, magnitudeContext.populationAffected / magnitudeContext.populationDenominator);
  }
  // No explicit population read-model supplied: broader geographic scope is the best content-agnostic proxy for reach (SS9).
  return geographicScopeComponent;
}

function computeCausalImpactComponent(
  factId: string,
  outgoingStrengthByFactId: ReadonlyMap<string, number>,
): number {
  const sum = outgoingStrengthByFactId.get(factId) ?? 0;
  return Math.min(1, sum / CAUSAL_IMPACT_SATURATION_TODO_TUNING);
}

function noveltyScopeId(scope: NoveltyScope, fact: SimulationFact): string {
  switch (scope) {
    case "settlement":
      return fact.location.settlementId ?? fact.location.regionId;
    case "region":
      return fact.location.regionId;
    // No continent concept is modeled yet -- falls back to region (documented, not a silent bug: a future continent model narrows this, never loosens it).
    case "continent":
      return fact.location.regionId;
    case "world":
      return "world";
  }
}

function buildAggregationKey(eventType: EventTypeDefinition, fact: SimulationFact): string {
  const policy = eventType.aggregationPolicy;
  const windowTicks = Math.max(1, policy.windowTicks);
  const windowIndex = Math.floor(fact.tick / windowTicks);
  const scopeId =
    policy.scope === "entity"
      ? fact.subject.entityId
      : policy.scope === "region"
        ? fact.location.regionId
        : "world";
  return `${eventType.id}:${policy.scope}:${scopeId}:${windowIndex}`;
}

function scoreFactAsCandidate(
  fact: SimulationFact,
  eventType: EventTypeDefinition,
  outgoingStrengthByFactId: ReadonlyMap<string, number>,
  noveltyRegistry: NoveltyRegistry,
  architectInfluenceByFactId: ReadonlyMap<string, number>,
  context: ChronicleContext | undefined,
  nextId: () => string,
): ChronicleCandidate | undefined {
  const scope = determineScope(fact);
  const geographicScope = GEOGRAPHIC_SCOPE_COMPONENT_TODO_TUNING[scope];
  const magnitudeContext = context?.magnitudeContext?.(fact);
  const magnitude = computeMagnitudeComponent(fact, magnitudeContext?.relativeDenominator);
  const populationAffected = computePopulationAffectedComponent(magnitudeContext, geographicScope);
  const duration = DURATION_COMPONENT_TODO_TUNING[eventType.durationPolicy];

  let novelty = 0;
  let isFirstOccurrence = false;
  if (eventType.noveltyPolicy.tracksFirst) {
    const scopeId = noveltyScopeId(eventType.noveltyPolicy.scope, fact);
    isFirstOccurrence = noveltyRegistry.recordAndCheckFirst(eventType.category, eventType.noveltyPolicy.scope, scopeId);
    novelty = isFirstOccurrence ? 1 : 0;
  }

  const causalImpact = computeCausalImpactComponent(fact.id, outgoingStrengthByFactId);

  const significance = computeSignificance({
    magnitude,
    duration,
    populationAffected,
    geographicScope,
    novelty,
    causalImpact,
    // SS61 ContextualSignificance -- not computed in M19 P0, see significance.ts header.
    contextualImportance: 0,
    baseSignificance: eventType.baseSignificance,
  });

  if (significance.total < eventType.candidateThreshold) return undefined;

  return {
    id: nextId(),
    factRefs: [fact.id],
    tick: fact.tick,
    entityRefs: [fact.subject],
    regionRefs: [fact.location.regionId],
    eventType: eventType.id,
    category: eventType.category,
    significance,
    isFirstOccurrence,
    scope,
    durationState: eventType.durationPolicy,
    causalAnchors: [fact.id],
    architectInfluence: architectInfluenceByFactId.get(fact.id) ?? fact.architect?.influenceStrength ?? 0,
    aggregationKey: buildAggregationKey(eventType, fact),
    status: "PENDING",
  };
}

function shortageProcessKey(fact: SimulationFact): string {
  return `shortage:${fact.location.regionId}:${fact.subject.entityId}`;
}

function buildShortageResolutionCandidate(
  process: ActiveProcess,
  eventType: EventTypeDefinition,
  tick: number,
  nextId: () => string,
): ChronicleCandidate | undefined {
  const elapsedTicks = tick - process.startTick;
  const duration = Math.min(1, elapsedTicks / SHORTAGE_DURATION_SATURATION_TICKS_TODO_TUNING);
  const geographicScope = GEOGRAPHIC_SCOPE_COMPONENT_TODO_TUNING.REGIONAL;

  const significance = computeSignificance({
    magnitude: 0,
    duration,
    populationAffected: geographicScope,
    geographicScope,
    novelty: 0,
    causalImpact: 0,
    contextualImportance: 0,
    baseSignificance: eventType.baseSignificance,
  });

  if (significance.total < eventType.candidateThreshold) return undefined;

  // processKey = `shortage:${regionId}:${marketGoodEntityId}` -- regionId never itself contains ":", so index 1 is always exactly the region.
  const regionId = process.processKey.split(":")[1];

  return {
    id: nextId(),
    factRefs: [process.rootFactId],
    tick,
    entityRefs: [],
    regionRefs: regionId !== undefined ? [regionId] : [],
    eventType: eventType.id,
    category: eventType.category,
    significance,
    isFirstOccurrence: false,
    scope: "REGIONAL",
    durationState: eventType.durationPolicy,
    causalAnchors: [process.rootFactId],
    architectInfluence: 0,
    aggregationKey: undefined,
    status: "PENDING",
  };
}

/** Settlement-level when the fact carries one, else region-level -- matches `determineScope`. */
function migrationWaveProcessKey(fact: SimulationFact): string {
  return `migration_wave:${fact.location.regionId}:${fact.location.settlementId ?? "region"}`;
}

/**
 * SS31 Trend Detection (persistence + minimal magnitude) via
 * `ActiveProcessRegistry.accumulatedMagnitude`: unlike shortage
 * (lifecycle-only, magnitude always `0`), a migration wave's `magnitude`
 * IS the accumulated net in-migration -- the single most important
 * signal for "how big was this wave" -- so this candidate is built from
 * the PROCESS's running total, not any one fact.
 */
function buildMigrationWaveCandidate(
  process: ActiveProcess,
  eventType: EventTypeDefinition,
  tick: number,
  nextId: () => string,
  context: ChronicleContext | undefined,
): ChronicleCandidate | undefined {
  const elapsedTicks = Math.max(1, tick - process.startTick);
  const duration = Math.min(1, elapsedTicks / MIGRATION_WAVE_DURATION_SATURATION_TICKS_TODO_TUNING);

  // processKey = `migration_wave:<regionId>:<settlementId | "region">`.
  const [, regionId, settlementPart] = process.processKey.split(":");
  const scope: GeographicScope = settlementPart !== undefined && settlementPart !== "region" ? "SETTLEMENT" : "REGIONAL";
  const geographicScope = GEOGRAPHIC_SCOPE_COMPONENT_TODO_TUNING[scope];

  const populationDenominator = regionId !== undefined ? context?.regionPopulation?.(regionId) : undefined;
  const magnitude =
    populationDenominator !== undefined && populationDenominator > 0
      ? Math.min(
          1,
          process.accumulatedMagnitude / populationDenominator / MIGRATION_WAVE_POPULATION_SATURATION_RATIO_TODO_TUNING,
        )
      : Math.min(1, process.accumulatedMagnitude / MIGRATION_WAVE_FALLBACK_SCALE_TODO_TUNING);

  const significance = computeSignificance({
    magnitude,
    duration,
    populationAffected: magnitude,
    geographicScope,
    novelty: 0,
    causalImpact: 0,
    contextualImportance: 0,
    baseSignificance: eventType.baseSignificance,
  });

  if (significance.total < eventType.candidateThreshold) return undefined;

  return {
    id: nextId(),
    factRefs: [process.rootFactId],
    tick,
    entityRefs: [],
    regionRefs: regionId !== undefined ? [regionId] : [],
    eventType: eventType.id,
    category: eventType.category,
    significance,
    isFirstOccurrence: false,
    scope,
    durationState: eventType.durationPolicy,
    causalAnchors: [process.rootFactId],
    architectInfluence: 0,
    aggregationKey: undefined,
    status: "PENDING",
  };
}

/** One process per (connection, good) -- `trade_flow_active.subject.entityId` is already `<connectionId>:<goodId>` (see `economy-tick.ts`'s `tradeOneDirection`). */
function tradeRouteProcessKey(fact: SimulationFact): string {
  return `trade_route:${fact.subject.entityId}`;
}

/**
 * Unlike `buildMigrationWaveCandidate`/`buildShortageResolutionCandidate`,
 * this candidate carries a STABLE `aggregationKey` with no time-window
 * component: `chronicle-entry-store.ts`'s `upsert` will keep folding
 * every later resolution of the SAME (connection, good) into the ONE
 * entry it already published (extending `endTick`, SS64), rather than
 * spawning a new "route emerged" entry every
 * `TRADE_ROUTE_MAX_DURATION_TICKS_TODO_TUNING` -- a trade route is one
 * ongoing structural fact, not a series of disjoint episodes.
 */
function buildTradeRouteCandidate(
  process: ActiveProcess,
  eventType: EventTypeDefinition,
  tick: number,
  nextId: () => string,
): ChronicleCandidate | undefined {
  const elapsedTicks = Math.max(1, tick - process.startTick);
  const duration = Math.min(1, elapsedTicks / TRADE_ROUTE_DURATION_SATURATION_TICKS_TODO_TUNING);
  const magnitude = Math.min(1, process.accumulatedMagnitude / TRADE_ROUTE_FALLBACK_SCALE_TODO_TUNING);
  const geographicScope = GEOGRAPHIC_SCOPE_COMPONENT_TODO_TUNING.REGIONAL;

  const significance = computeSignificance({
    magnitude,
    duration,
    populationAffected: geographicScope,
    geographicScope,
    novelty: 0,
    causalImpact: 0,
    contextualImportance: 0,
    baseSignificance: eventType.baseSignificance,
  });

  if (significance.total < eventType.candidateThreshold) return undefined;

  return {
    id: nextId(),
    factRefs: [process.rootFactId],
    tick,
    entityRefs: [],
    // Empty, not a guess: `ActiveProcess` only stores `rootFactId` (a
    // string), not that fact's `location` -- and a trade route spans TWO
    // regions (origin + destination), of which only the destination was
    // ever on the triggering fact anyway. A future pass could extend
    // `ActiveProcess` to carry a snapshot of the opening fact's
    // location/regionRefs; not done here to avoid widening a shared
    // registry type for one detector's need.
    regionRefs: [],
    eventType: eventType.id,
    category: eventType.category,
    significance,
    isFirstOccurrence: false,
    scope: "REGIONAL",
    durationState: eventType.durationPolicy,
    causalAnchors: [process.rootFactId],
    architectInfluence: 0,
    aggregationKey: process.processKey,
    status: "PENDING",
  };
}

/**
 * CH-03: `SimulationFact[] -> ChronicleCandidate[]` (Candidate Schema
 * SS19). Mutates `noveltyRegistry`/`activeProcessRegistry` as a side
 * effect (same stateful-store pattern as
 * `@first-cause/causality`'s `CausalEdgeStore`) while returning a fresh
 * candidate array every call -- never mutates `facts`/`edges`.
 */
export function buildChronicleCandidates(
  input: BuildChronicleCandidatesInput,
): readonly ChronicleCandidate[] {
  let sequence = 0;
  const nextId = (): string => `candidate_${input.currentTick}_${sequence++}`;

  const outgoingStrengthByFactId = new Map<string, number>();
  for (const edge of input.edges) {
    const current = outgoingStrengthByFactId.get(edge.sourceFactId) ?? 0;
    outgoingStrengthByFactId.set(edge.sourceFactId, current + Math.abs(edge.contribution));
  }

  const candidates: ChronicleCandidate[] = [];

  for (const fact of input.facts) {
    const eventTypeId = RAW_FACT_TYPE_TO_EVENT_TYPE_TODO_TUNING[fact.type];
    const eventType = eventTypeId !== undefined ? input.eventTypes.get(eventTypeId) : undefined;
    if (eventType) {
      const candidate = scoreFactAsCandidate(
        fact,
        eventType,
        outgoingStrengthByFactId,
        input.noveltyRegistry,
        input.architectInfluenceByFactId,
        input.context,
        nextId,
      );
      if (candidate) candidates.push(candidate);
    }

    if (fact.type === "shortage_started") {
      input.activeProcessRegistry.openOrRenew(
        shortageProcessKey(fact),
        "shortage",
        input.currentTick,
        fact.id,
      );
    }

    if (fact.type === "population_migrated_in") {
      const values = fact.values as { before?: unknown; after?: unknown };
      const migrantCount =
        typeof values.before === "number" && typeof values.after === "number"
          ? Math.abs(values.after - values.before)
          : 0;
      input.activeProcessRegistry.openOrRenew(
        migrationWaveProcessKey(fact),
        "migration_wave",
        input.currentTick,
        fact.id,
        migrantCount,
      );
    }

    if (fact.type === "trade_flow_active") {
      const values = fact.values as { after?: unknown };
      const flowVolume = typeof values.after === "number" ? Math.abs(values.after) : 0;
      input.activeProcessRegistry.openOrRenew(
        tradeRouteProcessKey(fact),
        "trade_route",
        input.currentTick,
        fact.id,
        flowVolume,
      );
    }
  }

  const silenceTicks = input.shortageResolutionSilenceTicks ?? SHORTAGE_RESOLUTION_SILENCE_TICKS_TODO_TUNING;
  const resolvedEventType = input.eventTypes.get("shortage_resolved");
  if (resolvedEventType) {
    for (const stale of input.activeProcessRegistry.findStale(input.currentTick, silenceTicks)) {
      if (stale.processType !== "shortage") continue;
      input.activeProcessRegistry.advance(stale.processKey, "RESOLVED", input.currentTick);
      const candidate = buildShortageResolutionCandidate(stale, resolvedEventType, input.currentTick, nextId);
      if (candidate) candidates.push(candidate);
    }
  }

  const migrationSilenceTicks = input.migrationWaveSilenceTicks ?? MIGRATION_WAVE_SILENCE_TICKS_TODO_TUNING;
  const migrationMaxDurationTicks =
    input.migrationWaveMaxDurationTicks ?? MIGRATION_WAVE_MAX_DURATION_TICKS_TODO_TUNING;
  const migrationWaveEventType = input.eventTypes.get("migration_wave");
  if (migrationWaveEventType) {
    const resolvable = new Map<string, ActiveProcess>();
    for (const process of input.activeProcessRegistry.findStale(input.currentTick, migrationSilenceTicks)) {
      if (process.processType === "migration_wave") resolvable.set(process.processKey, process);
    }
    for (const process of input.activeProcessRegistry.findExceedingDuration(
      input.currentTick,
      migrationMaxDurationTicks,
    )) {
      if (process.processType === "migration_wave") resolvable.set(process.processKey, process);
    }
    for (const process of [...resolvable.values()].sort((a, b) => a.processKey.localeCompare(b.processKey))) {
      input.activeProcessRegistry.advance(process.processKey, "RESOLVED", input.currentTick);
      const candidate = buildMigrationWaveCandidate(
        process,
        migrationWaveEventType,
        input.currentTick,
        nextId,
        input.context,
      );
      if (candidate) candidates.push(candidate);
    }
  }

  const tradeRouteSilenceTicks = input.tradeRouteSilenceTicks ?? TRADE_ROUTE_SILENCE_TICKS_TODO_TUNING;
  const tradeRouteMaxDurationTicks =
    input.tradeRouteMaxDurationTicks ?? TRADE_ROUTE_MAX_DURATION_TICKS_TODO_TUNING;
  const tradeRouteEventType = input.eventTypes.get("trade_route_emerged");
  if (tradeRouteEventType) {
    const resolvable = new Map<string, ActiveProcess>();
    for (const process of input.activeProcessRegistry.findStale(input.currentTick, tradeRouteSilenceTicks)) {
      if (process.processType === "trade_route") resolvable.set(process.processKey, process);
    }
    for (const process of input.activeProcessRegistry.findExceedingDuration(
      input.currentTick,
      tradeRouteMaxDurationTicks,
    )) {
      if (process.processType === "trade_route") resolvable.set(process.processKey, process);
    }
    for (const process of [...resolvable.values()].sort((a, b) => a.processKey.localeCompare(b.processKey))) {
      input.activeProcessRegistry.advance(process.processKey, "RESOLVED", input.currentTick);
      const candidate = buildTradeRouteCandidate(process, tradeRouteEventType, input.currentTick, nextId);
      if (candidate) candidates.push(candidate);
    }
  }

  return candidates;
}
