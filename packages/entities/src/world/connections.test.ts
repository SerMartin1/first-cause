import { describe, expect, it } from "vitest";
import { createConnection } from "./connections.js";

describe("createConnection", () => {
  it("creates a connection with cached.effectiveDistance defaulting to physicalDistance", () => {
    const connection = createConnection({
      id: "connection_001",
      regionAId: "region_001",
      regionBId: "region_002",
      geography: { physicalDistance: 42, terrainDifficulty: 0.2, seasonalModifier: 1 },
    });

    expect(connection.cached.effectiveDistance).toBe(42);
    expect(connection.currentState.disrupted).toBe(false);
  });

  it("rejects a self-loop (regionAId === regionBId)", () => {
    expect(() =>
      createConnection({
        id: "connection_001",
        regionAId: "region_001",
        regionBId: "region_001",
        geography: { physicalDistance: 1, terrainDifficulty: 0, seasonalModifier: 1 },
      }),
    ).toThrow(RangeError);
  });

  it("rejects a negative physical distance", () => {
    expect(() =>
      createConnection({
        id: "connection_001",
        regionAId: "region_001",
        regionBId: "region_002",
        geography: { physicalDistance: -1, terrainDifficulty: 0, seasonalModifier: 1 },
      }),
    ).toThrow();
  });

  it("accepts optional infrastructure/friction, overriding the zero defaults (M10)", () => {
    const connection = createConnection({
      id: "connection_001",
      regionAId: "region_001",
      regionBId: "region_002",
      geography: { physicalDistance: 42, terrainDifficulty: 0.2, seasonalModifier: 1 },
      infrastructure: { level: 2, transportModes: ["cart"], capacity: 100 },
      friction: { security: 0.1, borderFriction: 0 },
    });

    expect(connection.infrastructure).toEqual({
      level: 2,
      transportModes: ["cart"],
      capacity: 100,
    });
    expect(connection.friction).toEqual({ security: 0.1, borderFriction: 0 });
  });

  it("rejects a negative infrastructure level or capacity", () => {
    expect(() =>
      createConnection({
        id: "connection_001",
        regionAId: "region_001",
        regionBId: "region_002",
        geography: { physicalDistance: 1, terrainDifficulty: 0, seasonalModifier: 1 },
        infrastructure: { level: -1, transportModes: [], capacity: 0 },
      }),
    ).toThrow();
  });
});
