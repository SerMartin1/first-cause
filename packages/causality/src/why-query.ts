import type { CausalEdge, CausalEdgeType } from "./causal-edge.js";
import type { SimulationFact } from "./fact.js";
import { classifyStrength, type CausalStrengthBand } from "./causal-strength.js";

/**
 * WHY? (Causality Engine Spec SS29-34/70-75, CE-08, CAUS-006 CANONICAL:
 * "WHY? pokazuje: efekt, 2-5 głównych przyczyn, limiting factors, głębszy
 * chain na żądanie, Architect influence jeśli istnieje"). Czysta funkcja
 * nad już-istniejącym grafem (`CausalEdge[]`/`SimulationFact[]`) --
 * Causality Engine "explains already-known data, never computes/infers"
 * (SS0) -- żadnego nowego stanu, żadnej symulacji kontrfaktycznej.
 *
 * `summary`/`WhyCause.type`/`variable`/`mechanism` to stabilne, surowe id
 * (SS75 "Lokalizacja WHY?": silnik nie generuje zdań na stałe, zwraca
 * klucze + dane -- warstwa UI/lokalizacji tworzy tekst, M21).
 *
 * `MAX_WHY_CAUSES_TODO_TUNING` = 5 (CAUS-006 "2-5 głównych przyczyn") i
 * odcięcie TRACE-band pozytywnych przyczyn to razem "WHY? noise test" --
 * trywialne/prawie-zerowe pozytywne wkłady nigdy nie trafiają do
 * odpowiedzi, niezależnie od tego, ile ich jest w surowym grafie.
 */
const MAX_WHY_CAUSES_TODO_TUNING = 5;

export interface WhyCause {
  readonly factId: string;
  readonly edgeId: string;
  readonly type: string;
  readonly variable: string;
  readonly mechanism: string;
  readonly system: string;
  readonly edgeType: CausalEdgeType;
  /** Signed -1..1, z `CausalEdge.contribution`. */
  readonly contribution: number;
  /** 0..1, `Math.abs(contribution)`. */
  readonly strength: number;
  readonly band: CausalStrengthBand;
}

/** SS71 Causal Path -- jedna zidentyfikowana ścieżka od `rootFactId` do `targetFactId` (tu: Level 2, jeden hop poza Level 1). */
export interface CausalPath {
  readonly rootFactId: string;
  readonly targetFactId: string;
  readonly edgeIds: readonly string[];
  readonly totalStrength: number;
  readonly totalDelay: number;
  readonly architectInfluence: number;
}

export interface ArchitectConnection {
  readonly factId: string;
  /** Obecne tylko gdy ten fakt jest bezpośrednio Root Factem (SS32) -- dla propagowanego (nie-bezpośredniego) wpływu, `undefined`. */
  readonly interventionId: string | undefined;
  readonly influenceStrength: number;
}

/** SS74 WHY? Presentation Contract -- struktura danych, nie gotowy tekst. */
export interface WhyExplanation {
  readonly target: string;
  readonly summary: string;
  readonly primaryCauses: readonly WhyCause[];
  readonly significantCauses: readonly WhyCause[];
  readonly limitingFactors: readonly WhyCause[];
  readonly deeperPaths: readonly CausalPath[];
  readonly architectConnections: readonly ArchitectConnection[];
  /**
   * Uproszczony proxy: średnia `strength` pokazanych primary/significant
   * przyczyn. SS15's pełny model "Confidence" (epistemic, nie tylko sama
   * siła edge) nie jest jeszcze nigdzie w tym kodzie liczony -- ten sam
   * rodzaj świadomego uproszczenia co `fact.ts`'s odłożone `significance`/
   * `retention` pola (TODO tuning, nie ostateczny model).
   */
  readonly confidence: number;
}

export interface ExplainWhyInput {
  readonly targetFactId: string;
  /** Musi być w kolejności emisji (np. `WorldRunner.facts`/`FactStore.all()`) -- to ten sam porządek, który `CausalEdgeStore` już wymusza (przyczyna nigdy nie jest późniejsza niż efekt). */
  readonly facts: readonly SimulationFact[];
  readonly edges: readonly CausalEdge[];
  /** Opcjonalne: `WorldRunner.architectInfluence` -- gdy pominięte, `architectConnections` widzi tylko bezpośrednie Root Facty (`fact.architect`), nie propagowany wpływ. */
  readonly architectInfluenceByFactId?: ReadonlyMap<string, number>;
}

function buildIncomingIndex(edges: readonly CausalEdge[]): Map<string, CausalEdge[]> {
  const incoming = new Map<string, CausalEdge[]>();
  for (const edge of edges) {
    const list = incoming.get(edge.targetFactId) ?? [];
    list.push(edge);
    incoming.set(edge.targetFactId, list);
  }
  return incoming;
}

function toWhyCause(edge: CausalEdge, sourceFact: SimulationFact): WhyCause {
  const strength = Math.abs(edge.strength);
  return {
    factId: sourceFact.id,
    edgeId: edge.id,
    type: sourceFact.type,
    variable: edge.variable,
    mechanism: edge.mechanism,
    system: edge.system,
    edgeType: edge.type,
    contribution: edge.contribution,
    strength,
    band: classifyStrength(strength),
  };
}

function architectConnectionFor(
  fact: SimulationFact,
  architectInfluenceByFactId: ReadonlyMap<string, number> | undefined,
): ArchitectConnection | undefined {
  if (fact.architect !== undefined) {
    return {
      factId: fact.id,
      interventionId: fact.architect.interventionId,
      influenceStrength: fact.architect.influenceStrength,
    };
  }
  const propagated = architectInfluenceByFactId?.get(fact.id);
  if (propagated !== undefined && propagated > 0) {
    return { factId: fact.id, interventionId: undefined, influenceStrength: propagated };
  }
  return undefined;
}

/**
 * WHY? Immediate (Level 1) + Chain (Level 2, SS30). Level 3 (Historical)/
 * Level 4 (Architect) to "głębszy chain na żądanie" -- wywołujący
 * kontynuuje wołając `explainWhy` ponownie z `targetFactId` ustawionym na
 * fakt z `deeperPaths`/`architectConnections`, zamiast tej jednej funkcji
 * eagerly rekursywnie schodzącej w nieskończoność.
 */
export function explainWhy(input: ExplainWhyInput): WhyExplanation {
  const factsById = new Map(input.facts.map((fact) => [fact.id, fact] as const));
  const incoming = buildIncomingIndex(input.edges);
  const targetFact = factsById.get(input.targetFactId);

  const positiveCauses: WhyCause[] = [];
  const limitingFactors: WhyCause[] = [];
  for (const edge of incoming.get(input.targetFactId) ?? []) {
    const sourceFact = factsById.get(edge.sourceFactId);
    if (!sourceFact) continue; // przycięty/nieznany fakt -- edge realny, ale nie da się dziś pokazać jego źródła
    const cause = toWhyCause(edge, sourceFact);
    if (edge.contribution < 0) {
      limitingFactors.push(cause);
    } else if (cause.band !== "TRACE") {
      positiveCauses.push(cause);
    }
  }

  positiveCauses.sort((a, b) => b.strength - a.strength || a.factId.localeCompare(b.factId));
  limitingFactors.sort(
    (a, b) => a.contribution - b.contribution || a.factId.localeCompare(b.factId),
  );

  const rankedPositive = positiveCauses.slice(0, MAX_WHY_CAUSES_TODO_TUNING);
  const primaryCauses = rankedPositive.filter((cause) => cause.band === "PRIMARY");
  const significantCauses = rankedPositive.filter((cause) => cause.band !== "PRIMARY");
  const rankedLimiting = limitingFactors.slice(0, MAX_WHY_CAUSES_TODO_TUNING);

  // Level 2 "Chain": jeden hop dalej od każdej pokazanej Level-1 przyczyny,
  // z Duplicate Path Suppression (SS72) -- kilka ścieżek dzielących ten
  // sam root+mechanism liczy się jako JEDNA, nie kilka niezależnych powodów.
  const deeperPathsByKey = new Map<string, CausalPath>();
  for (const cause of [...primaryCauses, ...significantCauses]) {
    for (const level2Edge of incoming.get(cause.factId) ?? []) {
      const rootFact = factsById.get(level2Edge.sourceFactId);
      if (!rootFact) continue;
      const level2Strength = Math.abs(level2Edge.strength);
      const totalStrength = level2Strength * cause.strength;
      const key = `${level2Edge.sourceFactId}:${level2Edge.mechanism}`;
      const existing = deeperPathsByKey.get(key);
      if (existing && existing.totalStrength >= totalStrength) continue;
      deeperPathsByKey.set(key, {
        rootFactId: level2Edge.sourceFactId,
        targetFactId: input.targetFactId,
        edgeIds: [level2Edge.id, cause.edgeId],
        totalStrength,
        totalDelay: targetFact ? targetFact.tick - rootFact.tick : 0,
        architectInfluence: input.architectInfluenceByFactId?.get(level2Edge.sourceFactId) ?? 0,
      });
    }
  }
  const deeperPaths = [...deeperPathsByKey.values()].sort(
    (a, b) => b.totalStrength - a.totalStrength || a.rootFactId.localeCompare(b.rootFactId),
  );

  const architectConnectionsByFactId = new Map<string, ArchitectConnection>();
  const candidateFacts = [
    ...(targetFact ? [targetFact] : []),
    ...[...primaryCauses, ...significantCauses].map((cause) => factsById.get(cause.factId)),
    ...deeperPaths.map((path) => factsById.get(path.rootFactId)),
  ];
  for (const fact of candidateFacts) {
    if (!fact) continue;
    const connection = architectConnectionFor(fact, input.architectInfluenceByFactId);
    if (connection) architectConnectionsByFactId.set(connection.factId, connection);
  }

  const confidenceSample = [...primaryCauses, ...significantCauses];
  const confidence =
    confidenceSample.length > 0
      ? confidenceSample.reduce((sum, cause) => sum + cause.strength, 0) / confidenceSample.length
      : 0;

  return {
    target: input.targetFactId,
    summary: targetFact?.type ?? input.targetFactId,
    primaryCauses,
    significantCauses,
    limitingFactors: rankedLimiting,
    deeperPaths,
    architectConnections: [...architectConnectionsByFactId.values()],
    confidence,
  };
}
