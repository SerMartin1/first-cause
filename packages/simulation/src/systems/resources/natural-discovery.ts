import type {
  DepositDiscoveryStatus,
  ResourceDeposit,
  TechnologyState,
} from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import type { DepositDetectionRule, ResourceDiscoveryRules } from "@first-cause/content";
import type { PendingCausalLink } from "../../core/causal-links.js";
import { discoverDeposit } from "./deposit-lifecycle.js";

/**
 * Naturalne odkrywanie złóż -- D3, model A + a (decyzja właściciela
 * 2026-09-27, Canonical Decisions TECH-012).
 *
 * Wynik wynika WYŁĄCZNIE z danych: `TechnologyState` regionu (czy
 * odkrycie z reguły jest co najmniej AVAILABLE), `ResourceDefinition.
 * discoveryRules` (content) i właściwości złoża (jawna `stock.depth`,
 * bieżący status). Bez RNG i bez „szansy na tick”: gdy bramka jest
 * spełniona, KAŻDE kwalifikujące się złoże regionu przechodzi do statusu
 * docelowego w tym samym ticku. Silnik nie zna żadnego konkretnego
 * zasobu ani odkrycia -- pyta tylko dane „czy to złoże spełnia regułę?”.
 *
 * Czego ta funkcja celowo NIE robi (zakres wywołującego,
 * `economy-tick.ts`): nie sprawdza populacji regionu (TECH-011: pusty
 * region sam nie odkrywa) i nie buduje krawędzi do faktów technologii.
 */

const DISCOVERY_RANK: Readonly<Record<DepositDiscoveryStatus, number>> = {
  UNKNOWN: 0,
  SUSPECTED: 1,
  DISCOVERED: 2,
  ASSESSED: 3,
};

/**
 * Pewność wiedzy o złożu po naturalnym przejściu (`DepositDiscoveryState.
 * confidence`, 0..1). TODO tuning -- dokumentacja nie podaje wartości;
 * SUSPECTED to przesłanka, nie pewność, DISCOVERED/ASSESSED to
 * potwierdzenie (ta sama 1 co interwencja Architekta).
 */
export const NATURAL_DISCOVERY_CONFIDENCE_TODO_TUNING: Readonly<
  Record<Exclude<DepositDiscoveryStatus, "UNKNOWN">, number>
> = {
  SUSPECTED: 0.5,
  DISCOVERED: 1,
  ASSESSED: 1,
};

/** Czy odkrycie jest w regionie co najmniej AVAILABLE (ta sama granica co bramka PM, AI-08). */
export function isDiscoveryAvailableInRegion(
  discoveryId: string,
  technologyState: TechnologyState,
): boolean {
  const status = technologyState.discoveries[discoveryId]?.status;
  return status === "AVAILABLE" || status === "ADOPTED";
}

/**
 * Czy reguła obejmuje złoże o danej głębokości i statusie. Złoże bez
 * jawnej głębokości (`depth === undefined`) NIGDY nie spełnia reguły --
 * brak danych nie jest geologią (decyzja właściciela 2026-09-27).
 */
export function depositMatchesDetectionRule(
  rule: DepositDetectionRule,
  depth: number | undefined,
  status: DepositDiscoveryStatus,
): boolean {
  if (depth === undefined) return false;
  if (rule.minDepth !== undefined && depth < rule.minDepth) return false;
  if (rule.maxDepth !== undefined && depth > rule.maxDepth) return false;
  if (rule.fromStatuses !== undefined) {
    return (rule.fromStatuses as readonly DepositDiscoveryStatus[]).includes(status);
  }
  return DISCOVERY_RANK[status] < DISCOVERY_RANK[rule.targetStatus];
}

export interface NaturalDepositDiscoveryInput {
  readonly deposit: ResourceDeposit;
  readonly rules: ResourceDiscoveryRules | undefined;
  readonly technologyState: TechnologyState;
  readonly tick: number;
}

export interface NaturalDepositDiscoveryResult {
  readonly deposit: ResourceDeposit;
  readonly facts: readonly FactInput<DepositDiscoveryStatus>[];
  /** Względne do własnej tablicy `facts` (patrz `offsetCausalLinks`). */
  readonly causalLinks: readonly PendingCausalLink[];
  /** Dla każdego faktu (ten sam indeks): odkrycie, którego reguła spowodowała przejście. */
  readonly enablingDiscoveryIds: readonly string[];
}

/**
 * Przeprowadza złoże przez wszystkie przejścia, na które pozwalają reguły
 * w bieżącym stanie wiedzy regionu. Punkt stały: po każdym przejściu
 * reguły są sprawdzane ponownie (np. MIN-001 → SUSPECTED, a potem MIN-011
 * → ASSESSED dla głębokiego złoża w tym samym ticku). Status nigdy się
 * nie cofa, a brak zmiany = brak faktów.
 */
export function evaluateNaturalDepositDiscovery(
  input: NaturalDepositDiscoveryInput,
): NaturalDepositDiscoveryResult {
  const detection = input.rules?.detection ?? [];
  let deposit = input.deposit;
  const facts: FactInput<DepositDiscoveryStatus>[] = [];
  const causalLinks: PendingCausalLink[] = [];
  const enablingDiscoveryIds: string[] = [];

  // Najwyżej 3 przejścia (UNKNOWN → ... → ASSESSED); pętla kończy się,
  // gdy żadna reguła nie podnosi statusu.
  for (;;) {
    const status = deposit.discovery.status;
    let best: DepositDetectionRule | undefined;
    for (const rule of detection) {
      if (!isDiscoveryAvailableInRegion(rule.discoveryId, input.technologyState))
        continue;
      if (!depositMatchesDetectionRule(rule, deposit.stock.depth, status)) continue;
      if (
        !best ||
        DISCOVERY_RANK[rule.targetStatus] > DISCOVERY_RANK[best.targetStatus]
      ) {
        best = rule;
      }
    }
    if (!best) break;

    const result = discoverDeposit(deposit, {
      tick: input.tick,
      targetStatus: best.targetStatus,
      discoveredByEntityId: input.technologyState.id,
      confidence: NATURAL_DISCOVERY_CONFIDENCE_TODO_TUNING[best.targetStatus],
    });
    if (result.facts.length === 0) break;

    const baseIndex = facts.length;
    // Przejście wewnątrz tego samego wywołania łączy się z poprzednim
    // faktem tego złoża (np. SUSPECTED → potem DISCOVERED/ASSESSED).
    if (baseIndex > 0) {
      causalLinks.push({
        targetIndex: baseIndex,
        source: { kind: "sameBatch", index: baseIndex - 1 },
        type: "ENABLING",
        factor: { key: "prior_deposit_knowledge", contribution: 1 },
        mechanism:
          "wcześniejszy poziom wiedzy o złożu umożliwił dokładniejsze rozpoznanie",
        system: "resource-discovery",
      });
    }
    for (const link of result.causalLinks) {
      causalLinks.push({
        ...link,
        targetIndex: link.targetIndex + baseIndex,
        source:
          link.source.kind === "sameBatch"
            ? { kind: "sameBatch", index: link.source.index + baseIndex }
            : link.source,
      });
    }
    for (const fact of result.facts) {
      facts.push(fact);
      enablingDiscoveryIds.push(best.discoveryId);
    }
    deposit = result.deposit;
  }

  return { deposit, facts, causalLinks, enablingDiscoveryIds };
}
