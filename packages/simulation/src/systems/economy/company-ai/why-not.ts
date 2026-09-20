import type { CausalFactor } from "@first-cause/causality";
import type { DecisionSnapshot } from "./decision-snapshot.js";

/**
 * WHY NOT? (Causality Engine Spec SS33/CAUS-007, Architect Intervention &
 * Influence Spec SS71 -- "dlaczego oczekiwany rozwój nie nastąpił"). Czysta
 * funkcja nad już zbudowanym `DecisionSnapshot` -- w przeciwieństwie do
 * `explainWhy`/`queryButterflyEffect` (które operują na grafie faktów),
 * WHY NOT? opisuje decyzję AI, której NIE podjęto, więc nie ma faktu do
 * przeszukania -- `causalContext.factors` samego snapshotu jest jedynym
 * dostępnym śladem (SS33's przykład: `OpportunityScore 0.43, Required
 * 0.60`, dokładnie kształt, który `DecisionSnapshot.options`/
 * `causalContext` już niesie).
 */
export interface WhyNotExplanation {
  readonly actorId: string;
  readonly decisionType: string;
  readonly expectedAction: string;
  readonly actualAction: string;
  /** `false` = to właśnie odpowiada na "dlaczego NIE" -- oczekiwana akcja się nie zdarzyła. */
  readonly occurred: boolean;
  readonly expectedActionScore: number | undefined;
  readonly requiredScore: number | undefined;
  /** Posortowane od najbardziej ujemnego wkładu -- SS33's "BUT: expected margin too low, transport cost too high, ...". */
  readonly limitingFactors: readonly CausalFactor[];
}

export interface ExplainWhyNotInput {
  readonly snapshot: DecisionSnapshot;
  readonly expectedAction: string;
  /** Np. `FOUNDING_ACTIVATE_SCORE` -- caller zna próg aktywacji swojej domeny, `DecisionSnapshot` sam go nie niesie. */
  readonly requiredScore?: number;
}

export function explainWhyNot(input: ExplainWhyNotInput): WhyNotExplanation {
  const { snapshot, expectedAction } = input;
  const expectedOption = snapshot.options.find((option) => option.action === expectedAction);
  const limitingFactors = [...snapshot.causalContext.factors]
    .filter((factor) => factor.contribution < 0)
    .sort((a, b) => a.contribution - b.contribution);

  return {
    actorId: snapshot.actorId,
    decisionType: snapshot.decisionType,
    expectedAction,
    actualAction: snapshot.selectedAction,
    occurred: snapshot.selectedAction === expectedAction,
    expectedActionScore: expectedOption?.score,
    requiredScore: input.requiredScore,
    limitingFactors,
  };
}
