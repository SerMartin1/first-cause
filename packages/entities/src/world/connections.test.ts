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
});
