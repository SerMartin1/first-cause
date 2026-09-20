import type { Connection } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { assertNonNegative } from "../../../core/validation.js";
import type { PendingCausalLink } from "../../../core/causal-links.js";

/**
 * Route capacity & congestion (Simulation Model SS28 `TradeDemand >
 * RouteCapacity -> Congestion -> TransportCost up`; Simulation Test Spec
 * SS35-36 FC-TRADE-003/004). `desiredFlow` is how much a trade route
 * would like to move this tick (`trade/flows.ts` supplies it, observed
 * not owned -- the same "Market doesn't own Inventory" pattern M8
 * applies to physical stock); this module never invents that number.
 *
 * A connection with no capacity at all (`infrastructure.level` never
 * invested in) is impassable -- `cappedFlow` is 0, not an undefined/
 * infinite utilization ratio (Finite Numbers, Simulation Test Spec SS18).
 */
const NORMAL_UTILIZATION = 0.7; // TODO tuning -- FC-TRADE-004 "przekroczenie normalnego wykorzystania"
const CONGESTION_WEIGHT = 1.0; // TODO tuning

export interface EvaluateCapacityCongestionInput {
  readonly connection: Connection;
  readonly desiredFlow: number;
}

export interface EvaluateCapacityCongestionResult {
  readonly connection: Connection;
  /** `min(desiredFlow, capacity)` -- physically, a route can never move more than this in one tick. */
  readonly cappedFlow: number;
  /** >= 1: the multiplier `trade/flows.ts` applies to TransportCost. */
  readonly congestionModifier: number;
  readonly facts: readonly FactInput<number>[];
  /** M17 (CE-04): `targetIndex`/`sameBatch.index` względne do WŁASNEJ tablicy `facts` -- patrz `offsetCausalLinks`. */
  readonly causalLinks: readonly PendingCausalLink[];
}

export function evaluateCapacityCongestion(
  input: EvaluateCapacityCongestionInput,
): EvaluateCapacityCongestionResult {
  const { connection } = input;
  const capacity = assertNonNegative(
    connection.infrastructure.capacity,
    `evaluateCapacityCongestion(${connection.id}).infrastructure.capacity`,
  );
  const desiredFlow = assertNonNegative(
    input.desiredFlow,
    `evaluateCapacityCongestion(${connection.id}).desiredFlow`,
  );

  const cappedFlow = capacity > 0 ? Math.min(desiredFlow, capacity) : 0;
  const utilization = capacity > 0 ? desiredFlow / capacity : desiredFlow > 0 ? 1 : 0;
  const congestion = Math.max(0, utilization - NORMAL_UTILIZATION);
  const congestionModifier = 1 + congestion * CONGESTION_WEIGHT;

  const beforeCongestion = connection.currentState.congestion;
  const nextConnection: Connection = {
    ...connection,
    currentState: { ...connection.currentState, utilization, congestion },
  };

  const facts: FactInput<number>[] = [];
  const causalLinks: PendingCausalLink[] = [];
  if (congestion > 0 && beforeCongestion === 0) {
    facts.push({
      type: "congestion_started",
      subject: { entityType: "connection", entityId: connection.id },
      location: { regionId: connection.regionAId },
      values: { before: beforeCongestion, after: congestion, delta: congestion },
    });
    // CE-04 (M17): jedna, jasna przyczyna -- desiredFlow przekroczył
    // NORMAL_UTILIZATION udziału capacity (formuła to jeden ratio, nie
    // wymyślam tu wieloprzyczynowości, której nie ma, CAUS-003).
    causalLinks.push({
      targetIndex: facts.length - 1,
      source: { kind: "external", key: `connection:${connection.id}:utilization` },
      type: "TRIGGERING",
      factor: { key: "utilization_exceeds_normal", contribution: 1 },
      mechanism: "desiredFlow przekroczył normalne wykorzystanie capacity połączenia",
      system: "capacity-congestion",
    });
  }

  return { connection: nextConnection, cappedFlow, congestionModifier, facts, causalLinks };
}
