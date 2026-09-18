import { InvariantViolationError, assertPositive } from "../../../core/validation.js";

/**
 * Transport Mode profiles (Simulation Model SS28 `TransportCost =
 * EffectiveDistance x CargoFactor x TransportModeCost x
 * CongestionModifier`). `TransportModeDefinition.cost`/`capacity` (M2)
 * are `OpenRecordSchema` placeholder bags -- "the exact shape belongs to
 * the system milestone that consumes it" (`common.ts`'s own doc comment)
 * -- so `TransportModeProfile` is the simulation-layer type that gives
 * `TransportModeCost` a concrete shape, the same way `ProductionRecipe`
 * (M7) did for `ProductionMethodDefinition.inputs/outputs`, without
 * changing the M2 schema.
 */
export interface TransportModeProfile {
  readonly transportModeId: string;
  /** Cost per unit of EffectiveDistance for one unit of cargo -- a tuning parameter, not a physical constant. */
  readonly costPerUnitDistance: number;
}

/**
 * VS Spec SS16's four active modes, ordered the same way Simulation
 * Model SS28 lists their historical progression (`Foot/Pack Animals ->
 * Cart -> River Transport -> ...`): cost per unit distance decreases
 * accordingly. TODO tuning -- exact values are placeholders, like
 * `DEFAULT_PRODUCTION_RECIPES` (M7) and `DEFAULT_DEMOGRAPHY_RATES` (M6).
 */
export const DEFAULT_TRANSPORT_MODE_PROFILES: Readonly<
  Record<string, TransportModeProfile>
> = {
  foot_porter: { transportModeId: "foot_porter", costPerUnitDistance: 1.0 },
  pack_animal: { transportModeId: "pack_animal", costPerUnitDistance: 0.6 },
  cart: { transportModeId: "cart", costPerUnitDistance: 0.35 },
  river: { transportModeId: "river", costPerUnitDistance: 0.15 },
};

/**
 * Audytowe P0-06: `TransportModeDefinition.cost` (M2 `OpenRecordSchema`)
 * parsowane na konkretny, walidowany `TransportModeProfile` -- ten sam
 * fail-loud wzorzec co `production.ts::parseProductionRecipe` (M7) wobec
 * `productivity`. Przyjmuje surowy bag, nie typ `TransportModeDefinition`
 * z `@first-cause/content` -- Simulation Core celowo nie zależy od pakietu
 * content.
 */
export function parseTransportModeProfile(
  transportModeId: string,
  cost: Readonly<Record<string, unknown>>,
): TransportModeProfile {
  const label = `transportModes/${transportModeId}.cost.costPerUnitDistance`;
  const raw = cost.costPerUnitDistance;
  if (typeof raw !== "number") {
    throw new InvariantViolationError(
      `${label} must be a number, got ${raw === null ? "null" : typeof raw}`,
    );
  }
  return { transportModeId, costPerUnitDistance: assertPositive(raw, label) };
}
