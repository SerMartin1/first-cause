import { assertNonEmpty, assertNonNegative } from "../core/validation.js";

/**
 * Connection (Entity Data Model SS7): explicit transport relation
 * between two regions. "No teleportation of goods" -- every inter-
 * region flow must go through a real Connection (rule from SS7).
 */
export interface ConnectionGeography {
  readonly physicalDistance: number;
  readonly terrainDifficulty: number;
  readonly seasonalModifier: number;
}

export interface ConnectionInfrastructure {
  readonly level: number;
  readonly transportModes: readonly string[];
  readonly capacity: number;
}

export interface ConnectionFriction {
  readonly security: number;
  readonly borderFriction: number;
}

export interface ConnectionCurrentState {
  readonly utilization: number;
  readonly congestion: number;
  readonly disrupted: boolean;
}

export interface ConnectionCachedState {
  /**
   * `EffectiveDistance = PhysicalDistance x TerrainModifier x
   * InfrastructureModifier x BorderModifier x SecurityModifier x
   * SeasonalModifier` (SS7). Not computed in M3 -- the modifiers it
   * depends on belong to systems introduced from M5+ (transport,
   * security, ...). Defaults to `physicalDistance` until then.
   */
  readonly effectiveDistance: number;
  readonly transportCostModifiers: Readonly<Record<string, number>>;
}

export interface Connection {
  readonly id: string;
  readonly regionAId: string;
  readonly regionBId: string;
  readonly geography: ConnectionGeography;
  readonly infrastructure: ConnectionInfrastructure;
  readonly friction: ConnectionFriction;
  readonly currentState: ConnectionCurrentState;
  readonly cached: ConnectionCachedState;
}

export interface CreateConnectionInput {
  readonly id: string;
  readonly regionAId: string;
  readonly regionBId: string;
  readonly geography: ConnectionGeography;
  /** Defaults to no infrastructure (level 0, no capacity) when omitted, same as before M10. */
  readonly infrastructure?: ConnectionInfrastructure;
  /** Defaults to frictionless (0, 0) when omitted -- VS keeps both near-neutral anyway (WORLD-008, VS Spec SS18). */
  readonly friction?: ConnectionFriction;
}

export function createConnection(input: CreateConnectionInput): Connection {
  assertNonEmpty(input.id, "Connection.id");
  assertNonEmpty(input.regionAId, "Connection.regionAId");
  assertNonEmpty(input.regionBId, "Connection.regionBId");
  if (input.regionAId === input.regionBId) {
    throw new RangeError(
      `Connection "${input.id}": regionAId must differ from regionBId`,
    );
  }
  assertNonNegative(
    input.geography.physicalDistance,
    "Connection.geography.physicalDistance",
  );
  if (input.infrastructure) {
    assertNonNegative(input.infrastructure.level, "Connection.infrastructure.level");
    assertNonNegative(
      input.infrastructure.capacity,
      "Connection.infrastructure.capacity",
    );
  }

  return {
    id: input.id,
    regionAId: input.regionAId,
    regionBId: input.regionBId,
    geography: input.geography,
    infrastructure: input.infrastructure ?? { level: 0, transportModes: [], capacity: 0 },
    friction: input.friction ?? { security: 0, borderFriction: 0 },
    currentState: { utilization: 0, congestion: 0, disrupted: false },
    cached: {
      effectiveDistance: input.geography.physicalDistance,
      transportCostModifiers: {},
    },
  };
}
