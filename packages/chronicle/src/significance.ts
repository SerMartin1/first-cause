import type { SignificanceBreakdown, SignificanceCategory } from "./types.js";

/**
 * SS189 Suggested Weighted Model: `S = wM*M + wD*D + wP*P + wG*G + wN*N +
 * wC*C + wX*X`, clamp 0-100. Weights are a Significance Calibration
 * Dataset placeholder (SS191, AGENTS.md "nierozstrzygnięta wartość
 * tuningowa") -- sum to 1.0 so `computeSignificance`'s dynamic 0..100
 * score before baseline blending stays in range.
 *
 * `contextualImportance` carries weight in the formula (SS188 lists it
 * as a real component) but `significance.ts` never computes a non-zero
 * value for it in M19 P0 -- SS61's `ContextualSignificance` ("znaczenie
 * dla konkretnej encji") needs per-entity context `candidate-pipeline.ts`
 * does not have yet (no world-state access by design, see that file's
 * header). Flagged here rather than guessed, per AGENTS.md's "do not
 * invent a new mechanic to fill the gap".
 */
export const SIGNIFICANCE_WEIGHTS_TODO_TUNING = {
  magnitude: 0.22,
  duration: 0.12,
  populationAffected: 0.16,
  geographicScope: 0.12,
  novelty: 0.14,
  causalImpact: 0.18,
  contextualImportance: 0.06,
} as const;

/**
 * SS23 Event Importance Baseline: seeds the score, "nie może zastępować
 * dynamicznego significance" -- so it contributes a fixed, small,
 * TODO-tuning share rather than being added unbounded.
 */
export const SIGNIFICANCE_BASELINE_SHARE_TODO_TUNING = 0.15;

/** SS5 category thresholds ("dokładne progi są tuningiem"), checked highest-first. */
export const SIGNIFICANCE_CATEGORY_THRESHOLDS_TODO_TUNING: readonly {
  readonly category: SignificanceCategory;
  readonly min: number;
}[] = [
  { category: "WORLD_DEFINING", min: 85 },
  { category: "HISTORIC", min: 65 },
  { category: "MAJOR", min: 45 },
  { category: "NOTABLE", min: 25 },
  { category: "MINOR", min: 10 },
  { category: "TRACE", min: 0 },
];

export function classifySignificance(total: number): SignificanceCategory {
  for (const { category, min } of SIGNIFICANCE_CATEGORY_THRESHOLDS_TODO_TUNING) {
    if (total >= min) return category;
  }
  return "TRACE";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/** Every component `0..1`, already normalized by the caller (`candidate-pipeline.ts`) -- this function never reads a raw fact. */
export interface SignificanceComponentInputs {
  readonly magnitude: number;
  readonly duration: number;
  readonly populationAffected: number;
  readonly geographicScope: number;
  readonly novelty: number;
  readonly causalImpact: number;
  readonly contextualImportance: number;
  /** SS23 `EventTypeDefinition.baseSignificance`, `0..100`. */
  readonly baseSignificance: number;
}

/**
 * CH-02 Initial Significance (SS14): pure function over already-computed
 * component scores. Never touches a `SimulationFact`, `CausalEdge` or
 * `WorldState` directly -- SS190 "implementation powinna używać wartości
 * normalizowanych" means every input here is already `0..1`, so this
 * function only does the weighting/blending/clamping/categorizing.
 */
export function computeSignificance(inputs: SignificanceComponentInputs): SignificanceBreakdown {
  const magnitude = clamp01(inputs.magnitude);
  const duration = clamp01(inputs.duration);
  const populationAffected = clamp01(inputs.populationAffected);
  const geographicScope = clamp01(inputs.geographicScope);
  const novelty = clamp01(inputs.novelty);
  const causalImpact = clamp01(inputs.causalImpact);
  const contextualImportance = clamp01(inputs.contextualImportance);

  const w = SIGNIFICANCE_WEIGHTS_TODO_TUNING;
  const dynamicScore =
    (w.magnitude * magnitude +
      w.duration * duration +
      w.populationAffected * populationAffected +
      w.geographicScope * geographicScope +
      w.novelty * novelty +
      w.causalImpact * causalImpact +
      w.contextualImportance * contextualImportance) *
    100;

  const baselineShare = clamp01(SIGNIFICANCE_BASELINE_SHARE_TODO_TUNING);
  const blended =
    (1 - baselineShare) * dynamicScore + baselineShare * clamp(inputs.baseSignificance, 0, 100);
  const total = Math.round(clamp(blended, 0, 100));

  return {
    magnitude,
    duration,
    populationAffected,
    geographicScope,
    novelty,
    causalImpact,
    contextualImportance,
    total,
    category: classifySignificance(total),
  };
}
