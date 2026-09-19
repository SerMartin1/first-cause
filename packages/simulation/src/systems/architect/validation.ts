import type { ArchitectInterventionTarget, WorldState } from "@first-cause/entities";
import type { ArchitectInterventionRule } from "./definition.js";
import { INTERVENTION_EFFECT_HANDLERS } from "./interventions.js";
import { computeInterventionCost } from "./cost.js";

/**
 * `architect/validation` (M16, SS26 "Validation przed wykonaniem":
 * target istnieje, scope dozwolony, parametry w zakresie, Influence
 * wystarcza, cooldown, stacking, world rule compatibility). Audytowe P0/P1
 * (M15-M16 remediation, 2026-09-19): `stacking.policy` z contentu
 * (`forbidden`/`limited`/`allowed`) egzekwowane tu jako branch na
 * cooldownie (`forbidden` = na zawsze co najwyżej raz, `limited` =
 * dzisiejszy cooldown window, `allowed` = brak restrykcji); `instanceId`
 * unikalny, `entityIds` w dokładnej liczbie, parametry finite i bez
 * nadmiarowych kluczy. "world rule compatibility" wciąż nie ma
 * generycznego systemu -- poza zakresem tej remediacji.
 */
export interface ValidateInterventionInput {
  readonly instanceId: string;
  readonly target: ArchitectInterventionTarget;
  readonly parameters: Readonly<Record<string, number>>;
  readonly tick: number;
  /** Kanoniczna lista 5 Knowledge Domains z contentu -- patrz `InterventionEffectHandler.validateTarget`. */
  readonly knowledgeDomainIds: readonly string[];
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

  if (!input.instanceId) {
    errors.push("instanceId must be a non-empty string");
  } else if (state.interventions[input.instanceId]) {
    errors.push(`intervention instance "${input.instanceId}" already exists`);
  }

  if (!Number.isInteger(input.tick) || input.tick < 0) {
    errors.push(`tick must be a non-negative integer, got ${input.tick}`);
  }

  if (!rule.allowedScopes.includes(input.target.scopeType)) {
    errors.push(
      `scope "${input.target.scopeType}" is not allowed for "${rule.id}" (allowed: ${rule.allowedScopes.join(", ")})`,
    );
  }

  const handler = INTERVENTION_EFFECT_HANDLERS[rule.id];
  if (!handler) {
    errors.push(`no effect handler registered for intervention "${rule.id}"`);
  } else if (input.target.entityIds.length !== handler.expectedEntityIdCount) {
    errors.push(
      `target expects exactly ${handler.expectedEntityIdCount} entityIds for "${rule.id}", got ${input.target.entityIds.length}`,
    );
  } else {
    errors.push(...handler.validateTarget(state, input.target, input.knowledgeDomainIds));
  }

  for (const paramName of Object.keys(input.parameters)) {
    if (!(paramName in rule.parameters)) {
      errors.push(`unexpected parameter "${paramName}" is not declared by "${rule.id}"`);
    }
  }

  for (const [paramName, spec] of Object.entries(rule.parameters)) {
    const value = input.parameters[paramName];
    if (value === undefined) {
      errors.push(`missing required parameter "${paramName}"`);
      continue;
    }
    if (!Number.isFinite(value)) {
      errors.push(`parameter "${paramName}" must be a finite number, got ${value}`);
      continue;
    }
    if (value < spec.min || value > spec.max) {
      errors.push(
        `parameter "${paramName}" (${value}) is out of range [${spec.min}, ${spec.max}]`,
      );
    }
  }

  const cost = computeInterventionCost(rule, input.target.scopeType, input.parameters);
  if (cost.total > state.architectInfluence.current) {
    errors.push(
      `insufficient Influence: need ${cost.total}, have ${state.architectInfluence.current}`,
    );
  }

  const previousTick = lastAppliedTick(state, rule.id, input.target);
  if (previousTick !== undefined) {
    if (rule.stackingPolicy === "forbidden") {
      errors.push(
        `stacking is forbidden: "${rule.id}" was already applied to this target at tick ${previousTick}`,
      );
    } else if (
      rule.stackingPolicy === "limited" &&
      input.tick - previousTick < rule.cooldownTicks
    ) {
      errors.push(
        `cooldown active: "${rule.id}" on this target can next be applied at tick ${previousTick + rule.cooldownTicks} (now: ${input.tick})`,
      );
    }
    // stackingPolicy === "allowed": brak restrykcji, cooldown pomijany.
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, costTotal: cost.total };
}
