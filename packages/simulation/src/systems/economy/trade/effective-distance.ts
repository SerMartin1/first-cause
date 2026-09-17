import type { Connection } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { assertFinite, assertNonNegative } from "../../../core/validation.js";

/**
 * Effective Distance (ECO-016, Simulation Model SS3.3, VS Spec SS16-18):
 * `EffectiveDistance = PhysicalDistance x TerrainModifier x
 * InfrastructureModifier x BorderModifier x SecurityModifier x
 * SeasonalModifier`. Simulation Test Spec SS25 (FC-CORE-001) pins each
 * modifier's direction: better infrastructure must lower
 * EffectiveDistance; worse security/border friction must raise it.
 *
 * `Connection.cached.effectiveDistance` defaulted to `physicalDistance`
 * since M3 ("the modifiers it depends on belong to systems introduced
 * from M5+" -- `connections.ts`'s own doc comment); M10 is the first
 * milestone to actually compute the other five modifiers.
 */
const INFRASTRUCTURE_BENEFIT_WEIGHT = 0.5; // TODO tuning -- level 0 (no investment) is neutral (modifier 1), higher levels shrink EffectiveDistance
const BORDER_FRICTION_WEIGHT = 1.0; // TODO tuning -- neutral in VS (borderFriction stays 0, WORLD-008)
const SECURITY_RISK_WEIGHT = 1.0; // TODO tuning -- minimal in VS (VS Spec SS18 "RiskCost minimalny lub 0")

export interface EffectiveDistanceModifiers {
  readonly terrain: number;
  readonly infrastructure: number;
  readonly border: number;
  readonly security: number;
  readonly seasonal: number;
}

export interface UpdateEffectiveDistanceResult {
  readonly connection: Connection;
  readonly modifiers: EffectiveDistanceModifiers;
  readonly facts: readonly FactInput<number>[];
}

export function updateEffectiveDistance(
  connection: Connection,
): UpdateEffectiveDistanceResult {
  const physicalDistance = assertNonNegative(
    connection.geography.physicalDistance,
    `updateEffectiveDistance(${connection.id}).geography.physicalDistance`,
  );
  const terrain =
    1 +
    assertNonNegative(
      connection.geography.terrainDifficulty,
      `updateEffectiveDistance(${connection.id}).geography.terrainDifficulty`,
    );
  const infrastructure =
    1 /
    (1 +
      assertNonNegative(
        connection.infrastructure.level,
        `updateEffectiveDistance(${connection.id}).infrastructure.level`,
      ) *
        INFRASTRUCTURE_BENEFIT_WEIGHT);
  const border =
    1 +
    assertNonNegative(
      connection.friction.borderFriction,
      `updateEffectiveDistance(${connection.id}).friction.borderFriction`,
    ) *
      BORDER_FRICTION_WEIGHT;
  const security =
    1 +
    assertNonNegative(
      connection.friction.security,
      `updateEffectiveDistance(${connection.id}).friction.security`,
    ) *
      SECURITY_RISK_WEIGHT;
  const seasonal = assertNonNegative(
    connection.geography.seasonalModifier,
    `updateEffectiveDistance(${connection.id}).geography.seasonalModifier`,
  );

  const effectiveDistance = assertFinite(
    physicalDistance * terrain * infrastructure * border * security * seasonal,
    `updateEffectiveDistance(${connection.id}).effectiveDistance`,
  );

  const before = connection.cached.effectiveDistance;
  const nextConnection: Connection = {
    ...connection,
    cached: { ...connection.cached, effectiveDistance },
  };

  const facts: FactInput<number>[] = [];
  if (effectiveDistance !== before) {
    facts.push({
      type: "effective_distance_changed",
      subject: { entityType: "connection", entityId: connection.id },
      location: { regionId: connection.regionAId },
      values: { before, after: effectiveDistance, delta: effectiveDistance - before },
    });
  }

  return {
    connection: nextConnection,
    modifiers: { terrain, infrastructure, border, security, seasonal },
    facts,
  };
}
