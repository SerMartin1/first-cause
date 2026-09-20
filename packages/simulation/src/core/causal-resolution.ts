import {
  combineInfluences,
  computeChildInfluence,
  type CausalEdgeStore,
  type SimulationFact,
} from "@first-cause/causality";
import type { PendingCausalLink } from "./causal-links.js";

export interface ResolveTickCausalityInput {
  /** Fakty tego ticka, w TEJ SAMEJ kolejności co `targetIndex`/`sameBatch.index` w `causalLinks` -- realna, przydzielona przez store tablica `SimulationFact[]`, którą zwróciło `FactStore.emitAll`. */
  readonly emittedFacts: readonly SimulationFact[];
  readonly causalLinks: readonly PendingCausalLink[];
  /** Każdy fakt wyemitowany przed tym tickiem, po id -- rozwiązuje źródła `{kind: "priorFact"}`. */
  readonly priorFactsById: ReadonlyMap<string, SimulationFact>;
  /** Wpływ Architekta zaakumulowany do końca POPRZEDNIEGO ticka. */
  readonly architectInfluenceByFactId: ReadonlyMap<string, number>;
  /** Mutowany w miejscu: każdy rozwiązany link to jedno wywołanie `CausalEdge.add`. */
  readonly edgeStore: CausalEdgeStore;
}

export interface ResolveTickCausalityResult {
  /** NOWA mapa (wejście nigdy nie jest mutowane) -- fakty tego ticka wmergowane. */
  readonly architectInfluenceByFactId: ReadonlyMap<string, number>;
}

/**
 * Zamienia `PendingCausalLink[]` tego ticka na realne `CausalEdge`
 * (CE-03) i propaguje Architect Influence jeden hop dalej (Causality
 * Engine Spec SS36: `ChildInfluence = ParentInfluence x EdgeStrength x
 * PersistenceModifier`, wiele wchodzących ścieżek scalonych przez `1 -
 * Product(1 - path_i)`, nigdy zwykłą sumą). Źródło `{kind: "external"}`
 * nie ma drugiego faktu, do którego można się podlinkować (CAUS-003:
 * edge potrzebuje realnego mechanizmu między dwoma zidentyfikowanymi
 * faktami) -- jego czynnik po prostu nie staje się edge, celowo (patrz
 * doc comment w `causal-links.ts`). Działa raz na tick, po tym jak
 * `FactStore.emitAll` przydzieliło realne id -- `WorldRunner.step()` jest
 * jedynym wywołującym.
 */
export function resolveTickCausality(
  input: ResolveTickCausalityInput,
): ResolveTickCausalityResult {
  const linksByTarget = new Map<number, PendingCausalLink[]>();
  for (const link of input.causalLinks) {
    const list = linksByTarget.get(link.targetIndex) ?? [];
    list.push(link);
    linksByTarget.set(link.targetIndex, list);
  }

  const nextInfluence = new Map(input.architectInfluenceByFactId);

  for (const [targetIndex, links] of linksByTarget) {
    const targetFact = input.emittedFacts[targetIndex];
    if (!targetFact) continue; // defensywnie: index poza zakresem nigdy się nie zdarza, jeśli wywołujący przesuwają wyłącznie przez `offsetCausalLinks`, ale ciche no-op jest bezpieczniejsze niż throw w środku ticka.

    const incomingPaths: number[] = [];
    for (const link of links) {
      const sourceFact =
        link.source.kind === "sameBatch"
          ? input.emittedFacts[link.source.index]
          : link.source.kind === "priorFact"
            ? input.priorFactsById.get(link.source.factId)
            : undefined;
      if (!sourceFact) continue; // źródło "external", albo id "priorFact", które już nie istnieje (przycięte) -- czynnik wciąż realny, tylko dziś nie da się z niego zrobić edge.

      const strength = Math.abs(link.factor.contribution);
      input.edgeStore.add(
        {
          sourceFactId: sourceFact.id,
          targetFactId: targetFact.id,
          type: link.type,
          strength,
          contribution: link.factor.contribution,
          mechanism: link.mechanism,
          system: link.system,
          variable: link.factor.key,
        },
        sourceFact,
        targetFact,
      );

      const parentInfluence = nextInfluence.get(sourceFact.id) ?? 0;
      if (parentInfluence > 0 && strength > 0) {
        incomingPaths.push(computeChildInfluence(parentInfluence, strength));
      }
    }

    if (incomingPaths.length > 0) {
      const existing = nextInfluence.get(targetFact.id);
      const combined =
        existing !== undefined
          ? combineInfluences([...incomingPaths, existing])
          : combineInfluences(incomingPaths);
      nextInfluence.set(targetFact.id, combined);
    }
  }

  return { architectInfluenceByFactId: nextInfluence };
}
