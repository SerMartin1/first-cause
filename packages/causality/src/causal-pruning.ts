import type { CausalEdge } from "./causal-edge.js";
import type { SimulationFact } from "./fact.js";
import { HOT_WINDOW_TICKS_TODO_TUNING, isAnchor } from "./causal-memory.js";

/** Syntetyczny fakt, który `causal-pruning.ts` zapisuje w miejsce skompresowanego ciągu drobnych faktów (Causality Engine Spec SS50 "Causal Compression"). */
export interface CausalAggregateValue {
  readonly aggregated: true;
  readonly fromTick: number;
  readonly toTick: number;
  readonly count: number;
  readonly compressedTypes: readonly string[];
}

export interface PruneCausalMemoryInput {
  readonly facts: readonly SimulationFact[];
  readonly edges: readonly CausalEdge[];
  readonly architectInfluenceByFactId: ReadonlyMap<string, number>;
  readonly currentTick: number;
  readonly hotWindowTicks?: number;
}

export interface PruneCausalMemoryResult {
  readonly facts: readonly SimulationFact[];
  readonly edges: readonly CausalEdge[];
  readonly architectInfluenceByFactId: ReadonlyMap<string, number>;
}

function groupKey(fact: SimulationFact): string {
  return `${fact.subject.entityId}::${fact.type}`;
}

/**
 * CAUS-010 CANONICAL ("pruning nie może zniszczyć: Chronicle anchors,
 * ważne Butterfly paths, Historical WHY?, jedyną zachowaną przyczynę
 * ważnego wydarzenia"): backward reachability od każdego anchora (i
 * każdego faktu niosącego dziś niezerowy wpływ Architekta) wzdłuż
 * WCHODZĄCYCH edges oznacza każdego przodka jako must-keep.
 * Nadmierne zachowanie zbędnej ścieżki jest bezpieczne; zbyt małe
 * zachowanie jedynej ocalałej przyczyny ważnego wydarzenia jest
 * dokładnie tym, czego to nigdy nie może zrobić -- więc ta funkcja
 * celuje w zachowanie za dużo, nigdy za mało.
 */
function computeMustKeepIds(
  facts: readonly SimulationFact[],
  edges: readonly CausalEdge[],
  architectInfluenceByFactId: ReadonlyMap<string, number>,
): Set<string> {
  const incomingBySource = new Map<string, string[]>();
  for (const edge of edges) {
    const list = incomingBySource.get(edge.targetFactId) ?? [];
    list.push(edge.sourceFactId);
    incomingBySource.set(edge.targetFactId, list);
  }

  const mustKeep = new Set<string>();
  const queue: string[] = [];
  for (const fact of facts) {
    if (isAnchor(fact) || (architectInfluenceByFactId.get(fact.id) ?? 0) > 0) {
      if (!mustKeep.has(fact.id)) {
        mustKeep.add(fact.id);
        queue.push(fact.id);
      }
    }
  }
  while (queue.length > 0) {
    const factId = queue.pop()!;
    for (const sourceId of incomingBySource.get(factId) ?? []) {
      if (!mustKeep.has(sourceId)) {
        mustKeep.add(sourceId);
        queue.push(sourceId);
      }
    }
  }
  return mustKeep;
}

/**
 * Czysta funkcja (SS50-52): nigdy nie mutuje swoich wejść, zwraca NOWĄ
 * skompresowaną trójkę `(facts, edges, architectInfluenceByFactId)`.
 * Wywołujący (`WorldRunner`) decydują, kiedy ją wywołać i co zrobić z
 * wynikiem -- ta funkcja nie ma opinii o częstotliwości.
 */
export function pruneCausalMemory(input: PruneCausalMemoryInput): PruneCausalMemoryResult {
  const hotWindowTicks = input.hotWindowTicks ?? HOT_WINDOW_TICKS_TODO_TUNING;
  const mustKeep = computeMustKeepIds(input.facts, input.edges, input.architectInfluenceByFactId);

  const groups = new Map<string, SimulationFact[]>();
  const survivors: SimulationFact[] = [];
  for (const fact of input.facts) {
    const isWarmCandidate = input.currentTick - fact.tick > hotWindowTicks && !mustKeep.has(fact.id);
    if (!isWarmCandidate) {
      survivors.push(fact);
      continue;
    }
    const key = groupKey(fact);
    const group = groups.get(key);
    if (group) {
      group.push(fact);
    } else {
      groups.set(key, [fact]);
    }
  }

  const redirect = new Map<string, string>();
  const aggregates: SimulationFact[] = [];
  for (const key of [...groups.keys()].sort()) {
    const members = groups.get(key)!.sort((a, b) => a.tick - b.tick);
    if (members.length < 2) {
      // Samotny kandydat WARM nie jest "ciągiem" do skompresowania -- pozostaje na miejscu.
      survivors.push(...members);
      continue;
    }
    const first = members[0]!;
    const last = members[members.length - 1]!;
    const aggregateId = `agg_${last.tick}_${first.subject.entityId}_${first.type}`;
    const aggregateValue: CausalAggregateValue = {
      aggregated: true,
      fromTick: first.tick,
      toTick: last.tick,
      count: members.length,
      compressedTypes: [...new Set(members.map((m) => m.type))].sort(),
    };
    aggregates.push({
      id: aggregateId,
      tick: last.tick,
      type: "causal_aggregate",
      subject: first.subject,
      location: first.location,
      values: { before: first.values.before, after: aggregateValue },
    });
    for (const member of members) {
      redirect.set(member.id, aggregateId);
    }
  }

  const seenEdgeKeys = new Set<string>();
  const nextEdges: CausalEdge[] = [];
  for (const edge of input.edges) {
    const sourceFactId = redirect.get(edge.sourceFactId) ?? edge.sourceFactId;
    const targetFactId = redirect.get(edge.targetFactId) ?? edge.targetFactId;
    if (sourceFactId === targetFactId) continue; // wchłonięte całkowicie w jeden agregat
    const dedupeKey = `${sourceFactId}|${targetFactId}|${edge.type}|${edge.variable}`;
    if (seenEdgeKeys.has(dedupeKey)) continue;
    seenEdgeKeys.add(dedupeKey);
    nextEdges.push({ ...edge, sourceFactId, targetFactId });
  }

  const nextInfluence = new Map<string, number>();
  for (const [factId, influence] of input.architectInfluenceByFactId) {
    if (redirect.has(factId)) continue; // gwarantowane 0 (mustKeep już go wykluczyło), odrzucone defensywnie
    nextInfluence.set(factId, influence);
  }

  return {
    facts: [...survivors, ...aggregates],
    edges: nextEdges,
    architectInfluenceByFactId: nextInfluence,
  };
}
