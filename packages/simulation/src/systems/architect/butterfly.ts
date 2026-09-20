import {
  classifyStrength,
  combineInfluences,
  computeChildInfluence,
  isAnchor,
  EDGE_STRENGTH_THRESHOLDS_TODO_TUNING,
  type CausalEdge,
  type SimulationFact,
} from "@first-cause/causality";
import type { ArchitectInterventionInstance } from "@first-cause/entities";

/**
 * Butterfly Effect Query (Causality Engine Spec SS35/40-43, Architect
 * Intervention & Influence Spec SS46-50, M18 module `architect/butterfly`).
 * `getInterventionConsequences` to dokładna nazwa ze SS47.
 *
 * Nie osobny generator wydarzeń (SS46) -- czysta analiza już-istniejącego
 * grafu (`CausalEdge[]`/`SimulationFact[]`), forward BFS od
 * `rootFactIds` interwencji, licząca WŁASNĄ ścieżkę wpływu niezależnie od
 * `WorldRunner.architectInfluence` (który scala WSZYSTKIE interwencje w
 * jedną wartość na fakt, SS39 "Multiple Interventions" -- Butterfly Query
 * dla JEDNEJ interwencji potrzebuje wpływu wyłącznie z JEJ własnych ścieżek).
 *
 * Anti-Butterfly Explosion (SS49): (1) decay -- `computeChildInfluence`
 * mnoży przez `PersistenceModifier` na każdym hopie, tak jak
 * `causal-resolution.ts` już robi dla scalonego wpływu; (2) minimum
 * contribution threshold -- ścieżka, której wpływ spadnie poniżej progu
 * MINOR, przestaje się propagować dalej (nigdy nie trafia do wyniku ani
 * nie jest rozwijana); (3) significance threshold -- `EffectScore` poniżej
 * progu TRACE jest odrzucany; (4) path pruning -- twardy limit głębokości
 * `MAX_BUTTERFLY_DEPTH_TODO_TUNING`; (5) independent-cause dilution (SS50)
 * -- wynika automatycznie z tego, że śledzimy TYLKO krawędzie osiągalne z
 * `rootFactIds`, więc inne, niezależne przyczyny tego samego faktu nigdy
 * nie zawyżają wpływu tej interwencji.
 *
 * Wymaga `facts` w kolejności emisji (ten sam porządek, który
 * `CausalEdgeStore` już wymusza -- przyczyna nigdy nie jest późniejsza niż
 * efekt), żeby jednoprzebiegowy algorytm mógł zakładać, że wpływ KAŻDEGO
 * poprzednika jest już finalny, zanim przetworzy jego krawędzie wychodzące.
 */
const MAX_BUTTERFLY_DEPTH_TODO_TUNING = 20;

export type ButterflyConsequenceTier = "MAJOR" | "SIGNIFICANT" | "MINOR";

export interface ButterflyConsequence {
  readonly factId: string;
  readonly type: string;
  readonly subjectEntityType: string;
  readonly subjectEntityId: string;
  /** SS70 Causal Depth -- root(y) = 0, bezpośredni skutek = 1, dalej rosnąco; najkrótsza ścieżka, gdy istnieje kilka. */
  readonly causalDepth: number;
  /** Wpływ TEJ interwencji wzdłuż jej najsilniejszej/scalonej ścieżki do tego faktu -- nigdy wpływ innych interwencji. */
  readonly pathInfluence: number;
  /** SS41 `EffectScore = Significance x ArchitectInfluence x CausalConfidence x Recency/DurationModifier` -- Confidence/Recency nie są tu jeszcze modelowane (brak takiego pola w grafie), więc efektywnie `Significance x ArchitectInfluence`; TODO tuning, patrz `isAnchor` jako proxy Significance. */
  readonly effectScore: number;
  readonly tier: ButterflyConsequenceTier;
}

export interface ButterflyEffectResult {
  readonly rootFactIds: readonly string[];
  /** Depth === 1 (SS40 "Direct effects"). */
  readonly directEffects: readonly ButterflyConsequence[];
  readonly majorConsequences: readonly ButterflyConsequence[];
  readonly significantConsequences: readonly ButterflyConsequence[];
  readonly minorConsequences: readonly ButterflyConsequence[];
}

export interface QueryButterflyEffectInput {
  readonly rootFactIds: readonly string[];
  readonly facts: readonly SimulationFact[];
  readonly edges: readonly CausalEdge[];
}

function buildOutgoingIndex(edges: readonly CausalEdge[]): Map<string, CausalEdge[]> {
  const outgoing = new Map<string, CausalEdge[]>();
  for (const edge of edges) {
    const list = outgoing.get(edge.sourceFactId) ?? [];
    list.push(edge);
    outgoing.set(edge.sourceFactId, list);
  }
  return outgoing;
}

export function queryButterflyEffect(input: QueryButterflyEffectInput): ButterflyEffectResult {
  const factsById = new Map(input.facts.map((fact) => [fact.id, fact] as const));
  const outgoing = buildOutgoingIndex(input.edges);
  const rootFactIdSet = new Set(input.rootFactIds);

  const pathInfluenceByFactId = new Map<string, number>();
  const depthByFactId = new Map<string, number>();
  for (const rootFactId of input.rootFactIds) {
    pathInfluenceByFactId.set(rootFactId, 1);
    depthByFactId.set(rootFactId, 0);
  }

  // Jeden przebieg w porządku emisji: gdy docieramy do `fact`, wszystkie
  // jego krawędzie wchodzące (od wcześniej wyemitowanych faktów) już
  // zaktualizowały `pathInfluenceByFactId`/`depthByFactId` -- więc wartość
  // odczytana tutaj jest już finalna.
  for (const fact of input.facts) {
    const currentInfluence = pathInfluenceByFactId.get(fact.id);
    if (currentInfluence === undefined || currentInfluence <= 0) continue;
    const currentDepth = depthByFactId.get(fact.id) ?? 0;
    if (currentDepth >= MAX_BUTTERFLY_DEPTH_TODO_TUNING) continue;

    for (const edge of outgoing.get(fact.id) ?? []) {
      const childInfluence = computeChildInfluence(currentInfluence, Math.abs(edge.strength));
      const existing = pathInfluenceByFactId.get(edge.targetFactId);
      const combined =
        existing !== undefined ? combineInfluences([childInfluence, existing]) : childInfluence;
      if (combined < EDGE_STRENGTH_THRESHOLDS_TODO_TUNING.MINOR) continue; // anti-explosion: minimum contribution threshold

      pathInfluenceByFactId.set(edge.targetFactId, combined);
      const candidateDepth = currentDepth + 1;
      const existingDepth = depthByFactId.get(edge.targetFactId);
      depthByFactId.set(
        edge.targetFactId,
        existingDepth === undefined ? candidateDepth : Math.min(existingDepth, candidateDepth),
      );
    }
  }

  const consequences: ButterflyConsequence[] = [];
  for (const [factId, pathInfluence] of pathInfluenceByFactId) {
    if (rootFactIdSet.has(factId)) continue; // root sam w sobie nie jest swoim skutkiem
    const fact = factsById.get(factId);
    if (!fact) continue;
    const significance = isAnchor(fact) ? 1 : 0.5; // TODO tuning proxy -- prawdziwy Historical Significance (SS43) to Chronicle, M19
    const effectScore = pathInfluence * significance;
    const band = classifyStrength(effectScore);
    if (band === "TRACE") continue; // anti-explosion: significance threshold
    consequences.push({
      factId,
      type: fact.type,
      subjectEntityType: fact.subject.entityType,
      subjectEntityId: fact.subject.entityId,
      causalDepth: depthByFactId.get(factId) ?? 0,
      pathInfluence,
      effectScore,
      tier: band === "PRIMARY" ? "MAJOR" : band === "SIGNIFICANT" ? "SIGNIFICANT" : "MINOR",
    });
  }
  consequences.sort((a, b) => b.effectScore - a.effectScore || a.factId.localeCompare(b.factId));

  return {
    rootFactIds: input.rootFactIds,
    directEffects: consequences.filter((c) => c.causalDepth === 1),
    majorConsequences: consequences.filter((c) => c.tier === "MAJOR"),
    significantConsequences: consequences.filter((c) => c.tier === "SIGNIFICANT"),
    minorConsequences: consequences.filter((c) => c.tier === "MINOR"),
  };
}

/** SS47 dokładna nazwa: `getInterventionConsequences(interventionId)` -- wygodny wrapper nad `queryButterflyEffect` dla konkretnej `ArchitectInterventionInstance`. */
export function getInterventionConsequences(input: {
  readonly intervention: Pick<ArchitectInterventionInstance, "rootFactIds">;
  readonly facts: readonly SimulationFact[];
  readonly edges: readonly CausalEdge[];
}): ButterflyEffectResult {
  return queryButterflyEffect({
    rootFactIds: input.intervention.rootFactIds,
    facts: input.facts,
    edges: input.edges,
  });
}
