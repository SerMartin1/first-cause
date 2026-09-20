/**
 * Publiczne progi siły (Causality Engine Spec SS13, CAUS-008
 * CANONICAL: "4 poziomy publiczne: Primary/Significant/Minor/Trace").
 * "Progi są tuningiem, nie absolutnym prawem v0.1" (SS13) -- to
 * configurable placeholder (reguła AGENTS.md "nierozstrzygnięta wartość
 * tuningowa"), nie finalna decyzja balansu.
 */
export const EDGE_STRENGTH_THRESHOLDS_TODO_TUNING = {
  PRIMARY: 0.6,
  SIGNIFICANT: 0.3,
  MINOR: 0.1,
} as const;

export type CausalStrengthBand = "PRIMARY" | "SIGNIFICANT" | "MINOR" | "TRACE";

/** `strength` oczekiwane w `[0, 1]` -- przekaż `Math.abs(contribution)`, nigdy signed wartość. */
export function classifyStrength(strength: number): CausalStrengthBand {
  if (strength >= EDGE_STRENGTH_THRESHOLDS_TODO_TUNING.PRIMARY) return "PRIMARY";
  if (strength >= EDGE_STRENGTH_THRESHOLDS_TODO_TUNING.SIGNIFICANT) return "SIGNIFICANT";
  if (strength >= EDGE_STRENGTH_THRESHOLDS_TODO_TUNING.MINOR) return "MINOR";
  return "TRACE";
}
