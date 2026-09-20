import type { Connection } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { assertFinite, assertNonNegative } from "../../../core/validation.js";
import { directionalEdgeType, type PendingCausalLink } from "../../../core/causal-links.js";

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
  /** M17 (CE-04): `targetIndex`/`sameBatch.index` względne do WŁASNEJ tablicy `facts` -- patrz `offsetCausalLinks`. */
  readonly causalLinks: readonly PendingCausalLink[];
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
  const causalLinks: PendingCausalLink[] = [];
  if (effectiveDistance !== before) {
    facts.push({
      type: "effective_distance_changed",
      subject: { entityType: "connection", entityId: connection.id },
      location: { regionId: connection.regionAId },
      values: { before, after: effectiveDistance, delta: effectiveDistance - before },
    });
    // CE-04 (M17, FC-CORE-001): 5 niezależnych modyfikatorów, każdy z
    // WŁASNYM znakiem -- 1.0 to neutralne, odchylenie od 1.0 to
    // contribution (lepsza infrastruktura zawsze <1 -> DAMPENING
    // dystansu; gorsze bezpieczeństwo/border friction zawsze >1 ->
    // CONTRIBUTING do dystansu -- dokładnie kierunki, które FC-CORE-001
    // wymaga).
    const targetIndex = facts.length - 1;
    const modifierFactors: readonly [string, number][] = [
      ["terrain", terrain],
      ["infrastructure", infrastructure],
      ["border_friction", border],
      ["security_risk", security],
      ["seasonal", seasonal],
    ];
    for (const [key, modifier] of modifierFactors) {
      const contribution = modifier - 1;
      if (contribution === 0) continue;
      causalLinks.push({
        targetIndex,
        source: { kind: "external", key: `connection:${connection.id}:${key}` },
        type: directionalEdgeType(contribution),
        factor: { key, contribution },
        mechanism: `modyfikator "${key}" EffectiveDistance`,
        system: "effective-distance",
      });
    }
  }

  return {
    connection: nextConnection,
    modifiers: { terrain, infrastructure, border, security, seasonal },
    facts,
    causalLinks,
  };
}
