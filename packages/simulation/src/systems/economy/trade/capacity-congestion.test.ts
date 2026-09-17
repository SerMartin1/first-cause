import { createConnection, type Connection } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { InvariantViolationError } from "../../../core/validation.js";
import { evaluateCapacityCongestion } from "./capacity-congestion.js";

function connection(capacity: number): Connection {
  return createConnection({
    id: "connection_001",
    regionAId: "region_001",
    regionBId: "region_002",
    geography: { physicalDistance: 10, terrainDifficulty: 0, seasonalModifier: 1 },
    infrastructure: { level: 1, transportModes: ["cart"], capacity },
  });
}

describe("evaluateCapacityCongestion", () => {
  it("FC-TRADE-003: never lets flow exceed the connection's capacity", () => {
    const result = evaluateCapacityCongestion({
      connection: connection(50),
      desiredFlow: 1000,
    });
    expect(result.cappedFlow).toBe(50);
  });

  it("passes desiredFlow through untouched when it is within capacity", () => {
    const result = evaluateCapacityCongestion({
      connection: connection(50),
      desiredFlow: 20,
    });
    expect(result.cappedFlow).toBe(20);
  });

  it("a route with 0 capacity is impassable, not infinite/NaN utilization", () => {
    const result = evaluateCapacityCongestion({
      connection: connection(0),
      desiredFlow: 10,
    });
    expect(result.cappedFlow).toBe(0);
    expect(Number.isFinite(result.connection.currentState.utilization)).toBe(true);
    expect(Number.isFinite(result.congestionModifier)).toBe(true);
  });

  it("no congestion below the normal utilization threshold", () => {
    const result = evaluateCapacityCongestion({
      connection: connection(100),
      desiredFlow: 50,
    }); // 50% utilization
    expect(result.connection.currentState.congestion).toBe(0);
    expect(result.congestionModifier).toBe(1);
  });

  it("FC-TRADE-004: exceeding normal utilization increases the congestion modifier", () => {
    const result = evaluateCapacityCongestion({
      connection: connection(100),
      desiredFlow: 100,
    }); // 100% utilization
    expect(result.connection.currentState.congestion).toBeGreaterThan(0);
    expect(result.congestionModifier).toBeGreaterThan(1);
  });

  it("more overload produces more congestion", () => {
    const mild = evaluateCapacityCongestion({
      connection: connection(100),
      desiredFlow: 80,
    });
    const severe = evaluateCapacityCongestion({
      connection: connection(100),
      desiredFlow: 300,
    });
    expect(severe.congestionModifier).toBeGreaterThan(mild.congestionModifier);
  });

  it("emits a congestion_started fact only on the crossing from 0", () => {
    const started = evaluateCapacityCongestion({
      connection: connection(100),
      desiredFlow: 100,
    });
    expect(started.facts.some((fact) => fact.type === "congestion_started")).toBe(true);

    const stillCongested = evaluateCapacityCongestion({
      connection: started.connection,
      desiredFlow: 100,
    });
    expect(stillCongested.facts).toEqual([]);
  });

  it("fails loud on a negative desiredFlow", () => {
    expect(() =>
      evaluateCapacityCongestion({ connection: connection(100), desiredFlow: -1 }),
    ).toThrow(InvariantViolationError);
  });
});
