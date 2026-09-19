import { InvariantViolationError } from "@first-cause/entities";

/**
 * ArchitectInterventionRule: kształt simulation-natywny dla
 * `ArchitectInterventionDefinition` (`@first-cause/content`'s
 * `InterventionDefinition`, `parameters`/`costs` to dziś
 * `OpenRecordSchema` placeholdery -- "exact shape belongs to the system
 * milestone that consumes it", `common.ts`'s własny komentarz). Ten sam
 * fail-loud parse-z-surowego-baga wzorzec co
 * `transport/modes.ts::parseTransportModeProfile` (M7/audytowe P0-06) --
 * Simulation Core nigdy nie zależy od `@first-cause/content` (AGENTS.md
 * reguła 6), `worldgen` parsuje content JSON na to poniżej.
 */
export interface ArchitectInterventionParameterSpec {
  readonly min: number;
  readonly max: number;
}

/** SS8: `InfluenceCost = Base x Magnitude x Duration x Scope x Naturalness`, addytywno-multiplikatywnie (SS8: "implementacja może używać modelu addytywno-multiplikatywnego"). VS: brak Duration (Instant-only, SS7) -- `durationCost` zawsze pomijany w formule, nie tylko w danych. */
export interface ArchitectInterventionCostConfig {
  readonly base: number;
  /** Mnożnik dla parametru `"magnitude"` (jeśli definicja go deklaruje) -- `0`, gdy interwencja jest binarna (np. Reveal Resource Deposit). */
  readonly magnitudePerUnit: number;
  /** `scopeType -> mnożnik`. Brak wpisu dla danego scope = `1` (neutralny). */
  readonly scopeMultiplier: Readonly<Record<string, number>>;
  readonly naturalnessMultiplier: number;
}

export interface ArchitectInterventionRule {
  readonly id: string;
  readonly category: string;
  readonly allowedScopes: readonly string[];
  /** `paramName -> [min, max]`. Puste = interwencja binarna, bez ciągłego parametru magnitude. */
  readonly parameters: Readonly<Record<string, ArchitectInterventionParameterSpec>>;
  readonly costs: ArchitectInterventionCostConfig;
  /** Ticki między dwoma zastosowaniami tej samej definicji na ten sam target (SS57/SS58). */
  readonly cooldownTicks: number;
  readonly rootFactType: string;
}

function label(definitionId: string, field: string): string {
  return `interventions/${definitionId}.${field}`;
}

function expectNumber(value: unknown, fieldLabel: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new InvariantViolationError(
      `${fieldLabel} must be a finite number, got ${value === null ? "null" : typeof value}`,
    );
  }
  return value;
}

function parseCostConfig(
  definitionId: string,
  costs: Readonly<Record<string, unknown>>,
): ArchitectInterventionCostConfig {
  const base = expectNumber(costs.base, label(definitionId, "costs.base"));
  const magnitudePerUnit =
    costs.magnitudePerUnit === undefined
      ? 0
      : expectNumber(costs.magnitudePerUnit, label(definitionId, "costs.magnitudePerUnit"));
  const naturalnessMultiplier =
    costs.naturalnessMultiplier === undefined
      ? 1
      : expectNumber(
          costs.naturalnessMultiplier,
          label(definitionId, "costs.naturalnessMultiplier"),
        );

  const rawScopeMultiplier = costs.scopeMultiplier;
  const scopeMultiplier: Record<string, number> = {};
  if (rawScopeMultiplier !== undefined) {
    if (typeof rawScopeMultiplier !== "object" || rawScopeMultiplier === null) {
      throw new InvariantViolationError(
        `${label(definitionId, "costs.scopeMultiplier")} must be an object, got ${typeof rawScopeMultiplier}`,
      );
    }
    for (const [scope, value] of Object.entries(rawScopeMultiplier)) {
      scopeMultiplier[scope] = expectNumber(
        value,
        label(definitionId, `costs.scopeMultiplier.${scope}`),
      );
    }
  }

  return { base, magnitudePerUnit, scopeMultiplier, naturalnessMultiplier };
}

function parseParameterSpecs(
  definitionId: string,
  parameters: Readonly<Record<string, unknown>>,
): Readonly<Record<string, ArchitectInterventionParameterSpec>> {
  const parsed: Record<string, ArchitectInterventionParameterSpec> = {};
  for (const [paramName, raw] of Object.entries(parameters)) {
    if (typeof raw !== "object" || raw === null) {
      throw new InvariantViolationError(
        `${label(definitionId, `parameters.${paramName}`)} must be an object with min/max, got ${typeof raw}`,
      );
    }
    const bag = raw as Record<string, unknown>;
    const min = expectNumber(bag.min, label(definitionId, `parameters.${paramName}.min`));
    const max = expectNumber(bag.max, label(definitionId, `parameters.${paramName}.max`));
    if (min > max) {
      throw new InvariantViolationError(
        `${label(definitionId, `parameters.${paramName}`)}: min (${min}) must be <= max (${max})`,
      );
    }
    parsed[paramName] = { min, max };
  }
  return parsed;
}

export function parseArchitectInterventionRule(
  id: string,
  category: string,
  allowedScopes: readonly string[],
  parameters: Readonly<Record<string, unknown>>,
  costs: Readonly<Record<string, unknown>>,
  cooldown: number,
  rootFactType: string,
): ArchitectInterventionRule {
  return {
    id,
    category,
    allowedScopes,
    parameters: parseParameterSpecs(id, parameters),
    costs: parseCostConfig(id, costs),
    cooldownTicks: cooldown,
    rootFactType,
  };
}
