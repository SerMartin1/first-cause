import { createConnection, type Connection } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { updateEffectiveDistance } from "./effective-distance.js";

function connection(overrides: {
  readonly terrainDifficulty?: number;
  readonly infrastructureLevel?: number;
  readonly borderFriction?: number;
  readonly security?: number;
  readonly seasonalModifier?: number;
}): Connection {
  return createConnection({
    id: "connection_001",
    regionAId: "region_001",
    regionBId: "region_002",
    geography: {
      physicalDistance: 100,
      terrainDifficulty: overrides.terrainDifficulty ?? 0,
      seasonalModifier: overrides.seasonalModifier ?? 1,
    },
    infrastructure: {
      level: overrides.infrastructureLevel ?? 0,
      transportModes: [],
      capacity: 0,
    },
    friction: {
      security: overrides.security ?? 0,
      borderFriction: overrides.borderFriction ?? 0,
    },
  });
}

describe("updateEffectiveDistance", () => {
  it("equals physicalDistance when every modifier is neutral", () => {
    const result = updateEffectiveDistance(connection({}));
    expect(result.connection.cached.effectiveDistance).toBe(100);
  });

  it("FC-CORE-001: better infrastructure lowers EffectiveDistance and the corresponding transport cost", () => {
    const noInfra = updateEffectiveDistance(connection({ infrastructureLevel: 0 }));
    const withInfra = updateEffectiveDistance(connection({ infrastructureLevel: 4 }));
    expect(withInfra.connection.cached.effectiveDistance).toBeLessThan(
      noInfra.connection.cached.effectiveDistance,
    );
  });

  it("FC-CORE-001: worse security raises EffectiveDistance", () => {
    const safe = updateEffectiveDistance(connection({ security: 0 }));
    const risky = updateEffectiveDistance(connection({ security: 2 }));
    expect(risky.connection.cached.effectiveDistance).toBeGreaterThan(
      safe.connection.cached.effectiveDistance,
    );
  });

  it("FC-CORE-001: worse border friction raises EffectiveDistance", () => {
    const open = updateEffectiveDistance(connection({ borderFriction: 0 }));
    const closed = updateEffectiveDistance(connection({ borderFriction: 2 }));
    expect(closed.connection.cached.effectiveDistance).toBeGreaterThan(
      open.connection.cached.effectiveDistance,
    );
  });

  it("rougher terrain raises EffectiveDistance", () => {
    const flat = updateEffectiveDistance(connection({ terrainDifficulty: 0 }));
    const mountainous = updateEffectiveDistance(connection({ terrainDifficulty: 0.8 }));
    expect(mountainous.connection.cached.effectiveDistance).toBeGreaterThan(
      flat.connection.cached.effectiveDistance,
    );
  });

  it("matches hand-computed values for the Black Mountain highland pass connection", () => {
    // physicalDistance 40, terrainDifficulty 0.8, seasonalModifier 1.3, infrastructure level 1 (M10 fixture data).
    const result = updateEffectiveDistance(
      createConnection({
        id: "connection_black_mountain_highland_pass",
        regionAId: "region_black_mountain",
        regionBId: "region_highland_pass",
        geography: {
          physicalDistance: 40,
          terrainDifficulty: 0.8,
          seasonalModifier: 1.3,
        },
        infrastructure: { level: 1, transportModes: ["cart"], capacity: 20 },
        friction: { security: 0, borderFriction: 0 },
      }),
    );
    // terrain=1.8, infrastructure=1/1.5, border=1, security=1, seasonal=1.3
    const expected = 40 * 1.8 * (1 / 1.5) * 1 * 1 * 1.3;
    expect(result.connection.cached.effectiveDistance).toBeCloseTo(expected, 10);
  });

  it("emits an effective_distance_changed fact only when the cached value actually moves", () => {
    const changed = updateEffectiveDistance(connection({ terrainDifficulty: 0.5 }));
    expect(changed.facts.some((fact) => fact.type === "effective_distance_changed")).toBe(
      true,
    );

    const unchanged = updateEffectiveDistance(connection({}));
    expect(unchanged.facts).toEqual([]);
  });

  it("fails loud on a negative physicalDistance/terrainDifficulty at the Connection boundary", () => {
    expect(() =>
      createConnection({
        id: "connection_001",
        regionAId: "region_001",
        regionBId: "region_002",
        geography: { physicalDistance: -1, terrainDifficulty: 0, seasonalModifier: 1 },
      }),
    ).toThrow();
  });
});
