import type { ArchitectInterventionTarget, WorldState } from "@first-cause/entities";
import type { ArchitectInterventionRule } from "./definition.js";
import { INTERVENTION_EFFECT_HANDLERS } from "./interventions.js";
import { computeInterventionCost } from "./cost.js";

/**
 * `architect/validation` (M16, SS26 "Validation przed wykonaniem":
 * target istnieje, scope dozwolony, parametry w zakresie, Influence
 * wystarcza, cooldown, stacking, world rule compatibility). VS scope:
 * `stacking`/"world rule compatibility" nie mają dziś generycznego
 * systemu do sprawdzenia poza tym, co cooldown + parameter range już
 * pokrywają (SS53's "stacking example" -- nieskończone `+10 fertility`
 * -- jest wprost adresowane przez cooldown per (definitionId, target)).
 */
export interface ValidateInterventionInput {
  readonly target: ArchitectInterventionTarget;
  readonly parameters: Readonly<Record<string, number>>;
  readonly tick: number;
}

export type ValidateInterventionResult =
  | { readonly ok: true; readonly costTotal: number }
  | { readonly ok: false; readonly errors: readonly string[] };

function targetKey(target: ArchitectInterventionTarget): string {
  return [target.scopeType, ...target.entityIds].join(":");
}

/** Ostatni tick, w którym TA SAMA definicja została zastosowana do TEGO SAMEGO targetu i osiągnęła `COMPLETED` -- `undefined`, jeśli nigdy. */
function lastAppliedTick(
  state: WorldState,
  definitionId: string,
  target: ArchitectInterventionTarget,
): number | undefined {
  let last: number | undefined;
  const key = targetKey(target);
  for (const instance of Object.values(state.interventions)) {
    if (instance.definitionId !== definitionId) continue;
    if (instance.status !== "COMPLETED") continue;
    if (targetKey(instance.target) !== key) continue;
    if (instance.appliedTick === undefined) continue;
    if (last === undefined || instance.appliedTick > last) last = instance.appliedTick;
  }
  return last;
}

export function validateIntervention(
  state: WorldState,
  rule: ArchitectInterventionRule,
  input: ValidateInterventionInput,
): ValidateInterventionResult {
  const errors: string[] = [];

  if (!rule.allowedScopes.includes(input.target.scopeType)) {
    errors.push(
      `scope "${input.target.scopeType}" is not allowed for "${rule.id}" (allowed: ${rule.allowedScopes.join(", ")})`,
    );
  }

  for (const [paramName, spec] of Object.entries(rule.parameters)) {
    const value = input.parameters[paramName];
    if (value === undefined) {
      errors.push(`missing required parameter "${paramName}"`);
      continue;
    }
    if (value < spec.min || value > spec.max) {
      errors.push(
        `parameter "${paramName}" (${value}) is out of range [${spec.min}, ${spec.max}]`,
      );
    }
  }

  const handler = INTERVENTION_EFFECT_HANDLERS[rule.id];
  if (!handler) {
    errors.push(`no effect handler registered for intervention "${rule.id}"`);
  } else {
    errors.push(...handler.validateTarget(state, input.target));
  }

  const cost = computeInterventionCost(rule, input.target.scopeType, input.parameters);
  if (cost.total > state.architectInfluence.current) {
    errors.push(
      `insufficient Influence: need ${cost.total}, have ${state.architectInfluence.current}`,
    );
  }

  const previousTick = lastAppliedTick(state, rule.id, input.target);
  if (previousTick !== undefined && input.tick - previousTick < rule.cooldownTicks) {
    errors.push(
      `cooldown active: "${rule.id}" on this target can next be applied at tick ${previousTick + rule.cooldownTicks} (now: ${input.tick})`,
    );
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, costTotal: cost.total };
}
