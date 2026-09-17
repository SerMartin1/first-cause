import {
  createConnection,
  type Connection,
  type MarketGoodState,
} from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { DEFAULT_TRANSPORT_MODE_PROFILES } from "../transport/modes.js";
import { evaluateTradeFlow } from "./flows.js";

function marketGood(overrides: Partial<MarketGoodState>): MarketGoodState {
  return {
    supply: 0,
    demand: 0,
    inventory: 0,
    localPrice: 10,
    importDemand: 0,
    exportSupply: 0,
    shortageSeverity: 0,
    pricePressure: 0,
    ...overrides,
  };
}

function connection(
  capacity: number,
  overrides: { readonly security?: number } = {},
): Connection {
  return createConnection({
    id: "connection_001",
    regionAId: "region_shortage",
    regionBId: "region_surplus",
    geography: { physicalDistance: 10, terrainDifficulty: 0, seasonalModifier: 1 },
    infrastructure: { level: 1, transportModes: ["cart"], capacity },
    friction: { security: overrides.security ?? 0, borderFriction: 0 },
  });
}

const cart = DEFAULT_TRANSPORT_MODE_PROFILES.cart!;

describe("evaluateTradeFlow", () => {
  it("Acceptance Gate: a shortage region imports from a cheaper neighbor at a real transport cost", () => {
    const result = evaluateTradeFlow({
      connection: connection(100),
      exportingGood: marketGood({ localPrice: 5, supply: 100, demand: 20 }), // 80 surplus
      importingGood: marketGood({ localPrice: 20, shortageSeverity: 0.6 }),
      transportMode: cart,
      desiredImportQuantity: 30,
    });

    expect(result.feasible).toBe(true);
    expect(result.importedQuantity).toBe(30);
    expect(result.importedCost).toBeGreaterThan(5); // ForeignPrice + real TransportCost
    expect(result.importedCost).toBeLessThan(20); // cheaper than staying domestic -- that's *why* it's feasible
  });

  it("FC-TRADE-001: import cost is ForeignPrice + TransportCost (+ Tariff=0 + RiskCost); changing transport mode changes it", () => {
    const byCart = evaluateTradeFlow({
      connection: connection(100),
      exportingGood: marketGood({ localPrice: 5, supply: 100, demand: 0 }),
      importingGood: marketGood({ localPrice: 100 }),
      transportMode: DEFAULT_TRANSPORT_MODE_PROFILES.cart!,
      desiredImportQuantity: 10,
    });
    const byFoot = evaluateTradeFlow({
      connection: connection(100),
      exportingGood: marketGood({ localPrice: 5, supply: 100, demand: 0 }),
      importingGood: marketGood({ localPrice: 100 }),
      transportMode: DEFAULT_TRANSPORT_MODE_PROFILES.foot_porter!,
      desiredImportQuantity: 10,
    });

    expect(byCart.importedCost).toBeGreaterThan(5);
    expect(byFoot.importedCost).toBeGreaterThan(byCart.importedCost);
  });

  it("FC-TRADE-002: no trade when import is permanently more expensive and there is no critical shortage", () => {
    const result = evaluateTradeFlow({
      connection: connection(100),
      exportingGood: marketGood({ localPrice: 50, supply: 100, demand: 0 }), // expensive to buy abroad
      importingGood: marketGood({ localPrice: 10, shortageSeverity: 0.1 }), // cheap at home, no real shortage
      transportMode: cart,
      desiredImportQuantity: 20,
    });

    expect(result.feasible).toBe(false);
    expect(result.importedQuantity).toBe(0);
  });

  it("FC-TRADE-002: a critical shortage overrides an otherwise-too-expensive import", () => {
    const result = evaluateTradeFlow({
      connection: connection(100),
      exportingGood: marketGood({ localPrice: 50, supply: 100, demand: 0 }),
      importingGood: marketGood({ localPrice: 10, shortageSeverity: 0.95 }), // critical
      transportMode: cart,
      desiredImportQuantity: 20,
    });

    expect(result.feasible).toBe(true);
    expect(result.importedQuantity).toBeGreaterThan(0);
  });

  it("FC-TRADE-003: a bottleneck (low route capacity) visibly limits the flow even when demand/supply would allow more", () => {
    const result = evaluateTradeFlow({
      connection: connection(5), // narrow route
      exportingGood: marketGood({ localPrice: 5, supply: 1000, demand: 0 }),
      importingGood: marketGood({ localPrice: 100, shortageSeverity: 0.9 }),
      transportMode: cart,
      desiredImportQuantity: 500,
    });

    expect(result.importedQuantity).toBe(5);
  });

  it("export can never exceed the exporting region's physical surplus (Entity Data Model SS15)", () => {
    const result = evaluateTradeFlow({
      connection: connection(1000),
      exportingGood: marketGood({ localPrice: 5, supply: 30, demand: 20 }), // only 10 surplus
      importingGood: marketGood({ localPrice: 100, shortageSeverity: 0.9 }),
      transportMode: cart,
      desiredImportQuantity: 500,
    });

    expect(result.importedQuantity).toBe(10);
  });

  it("riskier connections (higher friction.security) raise the delivered cost", () => {
    const safe = evaluateTradeFlow({
      connection: connection(100, { security: 0 }),
      exportingGood: marketGood({ localPrice: 5, supply: 100, demand: 0 }),
      importingGood: marketGood({ localPrice: 100 }),
      transportMode: cart,
      desiredImportQuantity: 10,
    });
    const risky = evaluateTradeFlow({
      connection: connection(100, { security: 2 }),
      exportingGood: marketGood({ localPrice: 5, supply: 100, demand: 0 }),
      importingGood: marketGood({ localPrice: 100 }),
      transportMode: cart,
      desiredImportQuantity: 10,
    });

    expect(risky.importedCost).toBeGreaterThan(safe.importedCost);
  });
});
