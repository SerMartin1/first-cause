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
 * intentionally not wired to a candidate yet -- see spec SS35-38, SS44,
 * AGENTS.md "nie wymyślaj mechaniki, oznacz TODO"):
 * `resource_depletion_milestone` (needs a per-deposit reserve-ratio
 * series the simulation doesn't expose yet beyond the single terminal
 * `resource_depleted`), `migration_wave`/`regional_boom`/`regional_bust`/
 * `trade_route_emerged` (genuine multi-signal trend detectors, SS35-38 --
 * each needs its own calibrated threshold, not a guess), and
 * `intervention_major_consequence` (Architect Legacy, CH-11, P1).
 * `shortage_resolved` IS wired, but through `ActiveProcessRegistry`
 * silence detection below, not this table (no raw fact for "resolved").
 */
const RAW_FACT_TYPE_TO_EVENT_TYPE_TODO_TUNING: Readonly<Record<string, string>> = {
  resource_discovered: "resource_discovered",
  company_founded: "company_founded",
  company_expanded: "company_major_expansion",
  company_closed: "company_closed",
  shortage_started: "shortage_started",
  settlement_stage_changed: "settlement_stage_changed",
  discovery_occurred: "discovery_occurred",
};

/** SS7 Relative Magnitude: a 100%+ relative change already saturates the component to `1`. */
const MAGNITUDE_SATURATION_TODO_TUNING = 1;
/** SS115/117: two PRIMARY-band (~1.0 strength) outgoing edges already saturate `causalImpact` to `1`. */
const CAUSAL_IMPACT_SATURATION_TODO_TUNING = 2;
/** SS33 Trend End: ticks of silence (no renewal `shortage_started`) before an open shortage is considered resolved. VS ticks are monthly, so 6 = half a year. */
const SHORTAGE_RESOLUTION_SILENCE_TICKS_TODO_TUNING = 6;
/** How many ticks an unresolved shortage needs to be open before its resolution's `duration` component saturates to `1`. */
const SHORTAGE_DURATION_SATURATION_TICKS_TODO_TUNING = 36;

const DURATION_COMPONENT_TODO_TUNING: Readonly<Record<DurationState, number>> = {
  INSTANTANEOUS: 0.1,
  SHORT: 0.3,
  SUSTAINED: 0.6,
  STRUCTURAL: 0.85,
  MULTI_GENERATIONAL: 1,
};

const GEOGRAPHIC_SCOPE_COMPONENT_TODO_TUNING: Readonly<Record<GeographicScope, number>> = {
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

  return candidates;
}
