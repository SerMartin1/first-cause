import type { ArchitectInfluenceState } from "@first-cause/entities";
import { regenerateInfluence } from "@first-cause/entities";

/**
 * Regeneracja Influence per-tick (`architect/influence`, M16, Architect
 * Intervention & Influence Spec SS164/OPEN-002: "wystarczająco wolna, aby
 * czas był zasobem eksperymentu... dokładna wartość do tuningu po
 * playtestach"). `ARCHITECT_INFLUENCE_REGEN_PER_TICK_TODO_TUNING`: jedyny
 * kanonicznie dostępny sygnał dziś to stały procent `max` -- ten sam
 * "configurable placeholder + TODO tuning" wzorzec co
 * `technology/knowledge.ts`'s `KNOWLEDGE_GAIN_TODO_TUNING`.
 */
export const ARCHITECT_INFLUENCE_REGEN_PER_TICK_TODO_TUNING = 1;

export function tickArchitectInfluence(
  state: ArchitectInfluenceState,
): ArchitectInfluenceState {
  return regenerateInfluence(state, ARCHITECT_INFLUENCE_REGEN_PER_TICK_TODO_TUNING);
}

export function hasSufficientInfluence(
  state: ArchitectInfluenceState,
  cost: number,
): boolean {
  return state.current >= cost;
}
