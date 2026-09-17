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
