import { assertNonEmpty, assertNonNegative } from "../core/validation.js";

/**
 * ArchitectInterventionInstance (Architect Intervention & Influence Spec
 * SS23/SS24). `PLANNED`/`ACTIVE`/`CANCELLED` istnieją w typie bo są
 * częścią kanonicznego status-lifecycle (SS24), ale VS-INT-01..05 (M16)
 * są wszystkie Instant (SS7) -- `applyArchitectIntervention` produkuje
 * instancje, które przechodzą prosto do `COMPLETED`/`FAILED` w tym samym
 * wywołaniu. Scheduling (`PLANNED` -> `ACTIVE` po realnym opóźnieniu) i
 * `cancelIntervention` są explicite przyszłością (SS186) -- nie
 * zaimplementowane w M16.
 */
export type ArchitectInterventionStatus =
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

/**
 * SS23's `target`. `entityIds`' znaczenie zależy od definicji (np.
 * Reveal Resource Deposit: jeden `ResourceDeposit.id`; Knowledge
 * Injection: `[regionId, domainId]`) -- interpretowane przez efekt
 * handler tej konkretnej definicji (`systems/architect/interventions.ts`),
 * nie generycznie tutaj.
 */
export interface ArchitectInterventionTarget {
  readonly scopeType: string;
  readonly entityIds: readonly string[];
}

/** SS8: `Base × Magnitude × Duration × Scope × Naturalness`. VS: `duration` zawsze `1` (Instant-only, SS7) -- pole istnieje dla zgodności z kanonicznym kształtem kosztu, nie jako martwy placeholder: przyszła Sustained interwencja go faktycznie policzy. */
export interface ArchitectInterventionCost {
  readonly base: number;
  readonly magnitude: number;
  readonly duration: number;
  readonly scope: number;
  readonly naturalness: number;
  readonly total: number;
}

export interface ArchitectInterventionInstance {
  readonly id: string;
  readonly definitionId: string;
  readonly createdTick: number;
  /** `undefined` dopóki instancja nie osiągnie `COMPLETED`/`FAILED` -- SS185's `appliedTick`. VS: ten sam tick co `createdTick` (Instant). */
  readonly appliedTick: number | undefined;
  readonly target: ArchitectInterventionTarget;
  readonly parameters: Readonly<Record<string, number>>;
  readonly cost: ArchitectInterventionCost;
  readonly status: ArchitectInterventionStatus;
  /** SS23: `rootFactIds` -- puste, dopóki `COMPLETED` (ARCH-007: root fact powstaje dopiero po realnym wykonaniu). */
  readonly rootFactIds: readonly string[];
}

export interface CreateArchitectInterventionInstanceInput {
  readonly id: string;
  readonly definitionId: string;
  readonly createdTick: number;
  readonly target: ArchitectInterventionTarget;
  readonly parameters: Readonly<Record<string, number>>;
  readonly cost: ArchitectInterventionCost;
}

/** Zawsze tworzy w statusie `PLANNED` -- `systems/architect/apply-intervention.ts` przenosi ją do `COMPLETED`/`FAILED` w tym samym wywołaniu (VS: Instant, brak realnej fazy `ACTIVE`). */
export function createArchitectInterventionInstance(
  input: CreateArchitectInterventionInstanceInput,
): ArchitectInterventionInstance {
  assertNonEmpty(input.id, "ArchitectInterventionInstance.id");
  assertNonEmpty(input.definitionId, "ArchitectInterventionInstance.definitionId");
  assertNonEmpty(input.target.scopeType, "ArchitectInterventionInstance.target.scopeType");
  if (input.target.entityIds.length === 0) {
    throw new RangeError(
      `ArchitectInterventionInstance "${input.id}": target.entityIds must not be empty`,
    );
  }
  assertNonNegative(input.createdTick, "ArchitectInterventionInstance.createdTick");
  assertNonNegative(input.cost.total, "ArchitectInterventionInstance.cost.total");

  return {
    id: input.id,
    definitionId: input.definitionId,
    createdTick: input.createdTick,
    appliedTick: undefined,
    target: input.target,
    parameters: input.parameters,
    cost: input.cost,
    status: "PLANNED",
    rootFactIds: [],
  };
}

/** Przenosi do `COMPLETED`, zapisując `appliedTick`/`rootFactIds` (ARCH-007/ARCH-009: brak oczekiwanego downstream skutku nie zmienia tego statusu -- ten sam status niezależnie od tego, co świat zrobi z warunkiem później). */
export function completeArchitectIntervention(
  instance: ArchitectInterventionInstance,
  appliedTick: number,
  rootFactIds: readonly string[],
): ArchitectInterventionInstance {
  assertNonNegative(appliedTick, "completeArchitectIntervention.appliedTick");
  if (rootFactIds.length === 0) {
    throw new RangeError(
      `completeArchitectIntervention "${instance.id}": rootFactIds must not be empty (ARCH-007)`,
    );
  }
  return { ...instance, status: "COMPLETED", appliedTick, rootFactIds };
}

/** Przenosi do `FAILED` -- problem TECHNICZNY wykonania (SS24: nie brak oczekiwanego skutku downstream, to zawsze `COMPLETED`). */
export function failArchitectIntervention(
  instance: ArchitectInterventionInstance,
  appliedTick: number,
): ArchitectInterventionInstance {
  assertNonNegative(appliedTick, "failArchitectIntervention.appliedTick");
  return { ...instance, status: "FAILED", appliedTick };
}
