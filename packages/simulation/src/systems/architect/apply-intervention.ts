import type {
  ArchitectInterventionInstance,
  ArchitectInterventionTarget,
  WorldState,
} from "@first-cause/entities";
import {
  completeArchitectIntervention,
  createArchitectInterventionInstance,
  spendInfluence,
} from "@first-cause/entities";
import type { FactStore, SimulationFact } from "@first-cause/causality";
import type { ArchitectInterventionRule } from "./definition.js";
import { computeInterventionCost } from "./cost.js";
import { validateIntervention } from "./validation.js";
import { INTERVENTION_EFFECT_HANDLERS } from "./interventions.js";

/**
 * `applyArchitectIntervention` (M16, SS173-174 "Architect Command API" --
 * `applyIntervention` jest JEDYNYM kontrolowanym sposobem zmiany świata
 * przez Architekta; UI nigdy nie edytuje encji bezpośrednio, AGENTS.md
 * reguła 5). Transakcyjnie (SS182): validate -> calculate cost -> spend
 * Influence -> mutate allowed state -> create Root Fact -> commit. Krok
 * "reserve" z SS182 pominięty celowo -- VS jest Instant-only (SS7), nie
 * ma modelu Sustained do zarezerwowania.
 *
 * W przeciwieństwie do `systems/technology/*`/`systems/economy/*` (czyste
 * kalkulacje per-tick, których `FactInput[]` emituje dopiero
 * `WorldRunner.step()`), ta funkcja SAMA emituje do `factStore` -- to
 * jest command wywoływany POMIĘDZY tickami (SS173's `applyIntervention`),
 * nie krok w `runEconomyTick`'s pętli, więc potrzebuje realnych,
 * przypisanych `SimulationFact.id` do `ArchitectInterventionInstance.
 * rootFactIds` od razu, nie dopiero po następnym ticku.
 */
export interface ApplyArchitectInterventionInput {
  readonly instanceId: string;
  readonly tick: number;
  readonly target: ArchitectInterventionTarget;
  readonly parameters: Readonly<Record<string, number>>;
  /** Kanoniczna lista 5 Knowledge Domains z contentu -- patrz `ValidateInterventionInput`. */
  readonly knowledgeDomainIds?: readonly string[];
}

export type ApplyArchitectInterventionResult =
  | {
      readonly outcome: "COMPLETED";
      readonly worldState: WorldState;
      readonly facts: readonly SimulationFact[];
      readonly intervention: ArchitectInterventionInstance;
    }
  | {
      readonly outcome: "REJECTED";
      readonly errors: readonly string[];
    };

export function applyArchitectIntervention(
  state: WorldState,
  rule: ArchitectInterventionRule,
  input: ApplyArchitectInterventionInput,
  factStore: FactStore,
): ApplyArchitectInterventionResult {
  const validation = validateIntervention(state, rule, {
    instanceId: input.instanceId,
    target: input.target,
    parameters: input.parameters,
    tick: input.tick,
    knowledgeDomainIds: input.knowledgeDomainIds ?? [],
  });
  if (!validation.ok) return { outcome: "REJECTED", errors: validation.errors };

  const cost = computeInterventionCost(rule, input.target.scopeType, input.parameters);
  const handler = INTERVENTION_EFFECT_HANDLERS[rule.id]!; // `validateIntervention` już potwierdziła istnienie

  let plannedInstance = createArchitectInterventionInstance({
    id: input.instanceId,
    definitionId: rule.id,
    createdTick: input.tick,
    target: input.target,
    parameters: input.parameters,
    cost,
  });

  // SS182 krok 4-5 ("mutate allowed state, validate state") + SS183
  // atomicity: dopóki handler nie zwróci wyniku z sukcesem, nic
  // (Influence, WorldState) nie zostało jeszcze zmienione -- awaria tutaj
  // nigdy nie zostawia częściowo wydanego Influence bez efektu.
  try {
    const effectResult = handler.apply({
      state,
      target: input.target,
      parameters: input.parameters,
      tick: input.tick,
    });

    // Audytowe P1 (2026-09-19): `rule.rootFactType` pochodzi z contentu i
    // musi faktycznie odpowiadać temu, co handler wyemitował -- inaczej
    // kontrakt jest tylko parsowany, nigdy sprawdzony (przypadkowa
    // zgodność dzisiejszych 5 handlerów nie jest gwarancją).
    if (!effectResult.facts.some((fact) => fact.type === rule.rootFactType)) {
      throw new Error(
        `intervention "${rule.id}" did not emit a fact of its declared rootFactType "${rule.rootFactType}"`,
      );
    }

    const nextInfluence = spendInfluence(state.architectInfluence, cost.total);
    const emittedFacts = factStore.emitAll(
      input.tick,
      effectResult.facts.map((fact) => ({
        ...fact,
        architect: { interventionId: input.instanceId, influenceStrength: 1 },
      })),
    );

    plannedInstance = completeArchitectIntervention(
      plannedInstance,
      input.tick,
      emittedFacts.map((fact) => fact.id),
    );

    return {
      outcome: "COMPLETED",
      worldState: {
        ...effectResult.worldState,
        architectInfluence: nextInfluence,
        interventions: {
          ...effectResult.worldState.interventions,
          [plannedInstance.id]: plannedInstance,
        },
      },
      facts: emittedFacts,
      intervention: plannedInstance,
    };
  } catch (error) {
    // SS24: FAILED = problem TECHNICZNY wykonania (post-validation), nie
    // brak oczekiwanego downstream skutku (ARCH-009, patrz "no-effect"
    // testy w interventions.ts) -- ten catch istnieje jako strażnik
    // atomiczności (SS183): nic (Influence, WorldState, instancja) nie
    // zostało jeszcze zacommitowane, więc REJECTED tutaj nie zostawia
    // "instancji bez Root Facta" -- po prostu nic nie powstaje.
    return {
      outcome: "REJECTED",
      errors: [
        `intervention "${rule.id}" failed during execution: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}
