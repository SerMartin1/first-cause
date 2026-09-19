import type { ArchitectInterventionCost } from "@first-cause/entities";
import type { ArchitectInterventionRule } from "./definition.js";

/**
 * `architect/costs` (M16, SS8: `InfluenceCost = Base x Magnitude x
 * Duration x Scope x Naturalness`, model addytywno-multiplikatywny).
 * VS: `duration` zawsze `1` -- wszystkie VS-INT są Instant (SS7), więc
 * Duration nie uczestniczy w formule dopóki nie powstanie pierwsza
 * Sustained interwencja.
 *
 * `magnitude` liczony jako `base + magnitudePerUnit * parameters.magnitude`
 * (konwencja: definicja z ciągłym parametrem deklaruje go pod kluczem
 * dokładnie `"magnitude"` -- `parameters.magnitude ?? 0` dla interwencji
 * binarnych, gdzie `magnitudePerUnit` jest wtedy `0`).
 */
export function computeInterventionCost(
  rule: ArchitectInterventionRule,
  scopeType: string,
  parameters: Readonly<Record<string, number>>,
): ArchitectInterventionCost {
  const magnitudeValue = Math.abs(parameters.magnitude ?? 0);
  const scope = rule.costs.scopeMultiplier[scopeType] ?? 1;
  const naturalness = rule.costs.naturalnessMultiplier;
  const duration = 1;

  const magnitudeAdditive = rule.costs.base + rule.costs.magnitudePerUnit * magnitudeValue;
  const total = magnitudeAdditive * duration * scope * naturalness;

  return {
    base: rule.costs.base,
    magnitude: magnitudeAdditive - rule.costs.base,
    duration,
    scope,
    naturalness,
    total,
  };
}
