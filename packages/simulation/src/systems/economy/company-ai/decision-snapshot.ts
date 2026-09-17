/**
 * DecisionSnapshot + CausalContext (AI-10, AI Decision Model SS67-70).
 * SS68 lists which decisions require one in VS: company_founding (M12),
 * company_expansion, company_contraction, company_closure,
 * production_method_adoption -- `lifecycle-decision.ts` and
 * `pm-adoption.ts` are the M11 producers. This module only shapes the
 * data; feeding it into the Causality Engine's real fact/edge graph is
 * M17 "Causality (pełna integracja)" -- SS69's `causalContext.factors`
 * are recorded here as plain data a future consumer can turn into
 * `CausalEdge`s, not wired into one yet (AI-11 "Debug Inspector" is
 * satisfied by this being a real, inspectable return value from every
 * decision function -- there is no separate inspector UI/read-model in
 * Simulation Core, which never renders anything, DATA-007).
 */
export interface DecisionOption {
  readonly action: string;
  readonly hardEligible: boolean;
  readonly score: number;
}

export interface CausalFactor {
  readonly key: string;
  readonly contribution: number;
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
