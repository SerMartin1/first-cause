import type { CausalFactor } from "@first-cause/causality";

/**
 * DecisionSnapshot + CausalContext (AI-10, AI Decision Model SS67-70).
 * SS68 wymienia, które decyzje wymagają jednego w VS: company_founding
 * (M12), company_expansion, company_contraction, company_closure,
 * production_method_adoption -- `lifecycle-decision.ts` i
 * `pm-adoption.ts` to producenci z M11. `CausalFactor` przeniesione do
 * `@first-cause/causality` w M17 (to ta sama atomowa jednostka "dlaczego",
 * którą konsumuje rozwiązywanie `CausalEdge`) -- re-eksportowane tutaj,
 * żeby istniejące importy `CausalFactor` z tego modułu wciąż działały.
 * Doprowadzenie `causalContext.factors` do realnego grafu faktów/edges
 * to M17's `PendingCausalLink` (`core/economy-tick.ts`), wpięte w
 * każdym miejscu wywołania tego modułu (AI-11 "Debug Inspector" jest
 * spełnione przez to, że to jest realna, przeglądalna wartość zwrotna z
 * każdej funkcji decyzyjnej -- nie ma osobnego UI inspektora/read-modelu
 * w Simulation Core, które niczego nie renderuje, DATA-007).
 */
export type { CausalFactor };

export interface DecisionOption {
  readonly action: string;
  readonly hardEligible: boolean;
  readonly score: number;
}

export interface DecisionSnapshot {
  readonly actorId: string;
  readonly tick: number;
  readonly decisionType: string;
  readonly options: readonly DecisionOption[];
  readonly selectedAction: string;
  readonly selectedScore: number;
  readonly causalContext: { readonly factors: readonly CausalFactor[] };
}

export interface BuildDecisionSnapshotInput {
  readonly actorId: string;
  readonly tick: number;
  readonly decisionType: string;
  readonly options: readonly DecisionOption[];
  readonly selectedAction: string;
  readonly factors: readonly CausalFactor[];
}

export function buildDecisionSnapshot(
  input: BuildDecisionSnapshotInput,
): DecisionSnapshot {
  const selected = input.options.find((option) => option.action === input.selectedAction);
  return {
    actorId: input.actorId,
    tick: input.tick,
    decisionType: input.decisionType,
    options: input.options,
    selectedAction: input.selectedAction,
    selectedScore: selected?.score ?? 0,
    causalContext: { factors: input.factors },
  };
}
