import type { SimulationFact } from "@first-cause/causality";
import type { DefinitionRegistry, EventTypeDefinition } from "@first-cause/content";
import {
  DURATION_COMPONENT_TODO_TUNING,
  GEOGRAPHIC_SCOPE_COMPONENT_TODO_TUNING,
} from "./candidate-pipeline.js";
import { computeSignificance } from "./significance.js";
import type { ChronicleCandidate, GeographicScope } from "./types.js";

/**
 * `intervention_major_consequence` (Chronicle & Historical Significance
 * Spec SS75-78, "Architect Chronicle"/"Unintended Consequence"). Unlike
 * every detector in `candidate-pipeline.ts`, this one does NOT read raw
 * `SimulationFact.type` at all -- it turns an ALREADY-COMPUTED
 * `queryButterflyEffect`/`getInterventionConsequences` result (M18,
 * `packages/simulation/src/systems/architect/butterfly.ts`) into
 * candidates. Chronicle never re-walks the causal graph itself (SS117
 * anti-explosion already lives in Butterfly's own decay/threshold/depth
 * limits) -- it only scores what Butterfly already found.
 *
 * `packages/chronicle` cannot import `packages/simulation` (wrong
 * dependency direction), so `InterventionConsequence` below is a
 * structural duck-type of `ButterflyConsequence` -- a
 * `QueryButterflyEffectResult.majorConsequences` array satisfies it
 * without either package importing the other's concrete type.
 */
export interface InterventionConsequence {
  readonly fact: SimulationFact;
  /** Butterfly's `EffectScore` (SS41) -- already `Significance x ArchitectInfluence`, roughly `0..1`. */
  readonly effectScore: number;
  readonly causalDepth: number;
}

export interface BuildInterventionConsequenceCandidatesInput {
  readonly interventionId: string;
  readonly interventionRootFactId: string;
  /**
   * Already filtered to consequences this caller has not reported
   * before (e.g. via a `MilestoneRegistry` keyed by
   * `intervention:<interventionId>:<factId>`) -- this function is pure
   * and does not deduplicate across calls itself, unlike
   * `candidate-pipeline.ts`'s own detectors which own their registries
   * directly.
   */
  readonly newMajorConsequences: readonly InterventionConsequence[];
  readonly eventTypes: DefinitionRegistry<EventTypeDefinition>;
  readonly currentTick: number;
}

function determineScope(fact: SimulationFact): GeographicScope {
  return fact.location.settlementId !== undefined ? "SETTLEMENT" : "REGIONAL";
}

/** CH-11 (P1) support, wired early: one candidate per new MAJOR-tier Butterfly consequence of a completed intervention. */
export function buildInterventionConsequenceCandidates(
  input: BuildInterventionConsequenceCandidatesInput,
): readonly ChronicleCandidate[] {
  const eventType = input.eventTypes.get("intervention_major_consequence");
  if (!eventType) return [];

  const candidates: ChronicleCandidate[] = [];
  let sequence = 0;

  for (const consequence of input.newMajorConsequences) {
    const scope = determineScope(consequence.fact);
    const geographicScope = GEOGRAPHIC_SCOPE_COMPONENT_TODO_TUNING[scope];
    const magnitude = Math.min(1, consequence.effectScore);
    const duration = DURATION_COMPONENT_TODO_TUNING[eventType.durationPolicy];

    const significance = computeSignificance({
      magnitude,
      duration,
      populationAffected: geographicScope,
      geographicScope,
      novelty: 0,
      // Butterfly's EffectScore already captures this specific
      // intervention's causal strength along its own path -- reusing it
      // as causalImpact avoids re-deriving the same signal from `edges`
      // this function does not have.
      causalImpact: magnitude,
      contextualImportance: 0,
      baseSignificance: eventType.baseSignificance,
    });

    if (significance.total < eventType.candidateThreshold) continue;

    candidates.push({
      id: `candidate_${input.currentTick}_intervention_${sequence}`,
      factRefs: [consequence.fact.id],
      tick: input.currentTick,
      entityRefs: [consequence.fact.subject],
      regionRefs: [consequence.fact.location.regionId],
      eventType: eventType.id,
      category: eventType.category,
      significance,
      isFirstOccurrence: false,
      scope,
      durationState: eventType.durationPolicy,
      causalAnchors: [input.interventionRootFactId, consequence.fact.id],
      architectInfluence: consequence.effectScore,
      aggregationKey: undefined,
      status: "PENDING",
    });
    sequence += 1;
  }

  return candidates;
}
