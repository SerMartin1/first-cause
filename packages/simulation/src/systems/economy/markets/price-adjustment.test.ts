import { createMarket, type Market } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { InvariantViolationError } from "../../../core/validation.js";
import { initializeMarketGood, updateMarketGood } from "./price-adjustment.js";

function seedMarket(goodId: string, basePrice: number): Market {
  const market = createMarket({ id: "market_region_001", regionId: "region_001" });
  return { ...market, goods: { [goodId]: initializeMarketGood(basePrice) } };
}

describe("initializeMarketGood", () => {
  it("seeds localPrice from BaseContentPrice, everything else at rest", () => {
    const state = initializeMarketGood(10);
    expect(state.localPrice).toBe(10);
    expect(state.supply).toBe(0);
    expect(state.demand).toBe(0);
    expect(state.inventory).toBe(0);
    expect(state.shortageSeverity).toBe(0);
    expect(state.pricePressure).toBe(0);
  });

  it("rejects a zero or negative basePrice (price > 0 invariant, Entity Data Model SS15)", () => {
    expect(() => initializeMarketGood(0)).toThrow(InvariantViolationError);
    expect(() => initializeMarketGood(-5)).toThrow(InvariantViolationError);
  });
});

describe("updateMarketGood", () => {
  it("fails loud when the good has no MarketGoodState yet, instead of fabricating one", () => {
    const market = createMarket({ id: "market_region_001", regionId: "region_001" });
    expect(() =>
      updateMarketGood({
        market,
        goodId: "grain",
        supply: 5,
        demandSources: {},
        inventory: 0,
      }),
    ).toThrow(InvariantViolationError);
  });

  it("FC-MARKET-001 shortage: demand > supply gives positive shortage severity and positive price pressure", () => {
    const market = seedMarket("grain", 10);
    const { market: next } = updateMarketGood({
      market,
      goodId: "grain",
      supply: 5,
      demandSources: { households: 10 },
      inventory: 0,
    });

    expect(next.goods.grain!.shortageSeverity).toBeGreaterThan(0);
    expect(next.goods.grain!.pricePressure).toBeGreaterThan(0);
    expect(next.goods.grain!.localPrice).toBeGreaterThan(10);
  });

  it("FC-MARKET-002 surplus: supply > demand gives zero shortage severity and non-positive price pressure", () => {
    const market = seedMarket("grain", 10);
    const { market: next } = updateMarketGood({
      market,
      goodId: "grain",
      supply: 20,
      demandSources: { households: 5 },
      inventory: 30,
    });

    expect(next.goods.grain!.shortageSeverity).toBe(0);
    expect(next.goods.grain!.pricePressure).toBeLessThanOrEqual(0);
    expect(next.goods.grain!.localPrice).toBeLessThanOrEqual(10);
  });

  it("FC-MARKET-003 smoothing: an extreme shock is still capped to a bounded single-tick price change", () => {
    const market = seedMarket("grain", 10);
    const { market: next } = updateMarketGood({
      market,
      goodId: "grain",
      supply: 1,
      demandSources: { households: 1_000_000 },
      inventory: 0,
    });

    const relativeChange = Math.abs(next.goods.grain!.localPrice - 10) / 10;
    expect(relativeChange).toBeLessThanOrEqual(0.1); // MAX_TICK_PRICE_CHANGE * PRICE_SMOOTHING_FACTOR upper bound
    expect(Number.isFinite(next.goods.grain!.localPrice)).toBe(true);
  });

  it("price bounds: localPrice always stays finite and > 0, even under a sustained extreme surplus", () => {
    let market = seedMarket("grain", 10);
    for (let tick = 0; tick < 50; tick++) {
      const result = updateMarketGood({
        market,
        goodId: "grain",
        supply: 1000,
        demandSources: {},
        inventory: 1000,
      });
      market = result.market;
      expect(Number.isFinite(market.goods.grain!.localPrice)).toBe(true);
      expect(market.goods.grain!.localPrice).toBeGreaterThan(0);
    }
  });

  it("import cost placeholder: importDemand/exportSupply stay untouched (trade is M10 scope)", () => {
    const market = seedMarket("grain", 10);
    const { market: next } = updateMarketGood({
      market,
      goodId: "grain",
      supply: 5,
      demandSources: { households: 10 },
      inventory: 0,
    });

    expect(next.goods.grain!.importDemand).toBe(0);
    expect(next.goods.grain!.exportSupply).toBe(0);
  });

  it("emits price_changed and shortage_started facts on the shortage-triggering tick", () => {
    const market = seedMarket("grain", 10);
    const { facts } = updateMarketGood({
      market,
      goodId: "grain",
      supply: 5,
      demandSources: { households: 10 },
      inventory: 0,
    });

    expect(facts.some((fact) => fact.type === "price_changed")).toBe(true);
    expect(facts.some((fact) => fact.type === "shortage_started")).toBe(true);
  });

  it("emits no facts on a tick where nothing changes (balanced market)", () => {
    const market = seedMarket("grain", 10);
    const { facts } = updateMarketGood({
      market,
      goodId: "grain",
      supply: 10,
      demandSources: { households: 10 },
      inventory: 0,
    });

    expect(facts).toEqual([]);
  });

  it("100-tick stress test: constant balanced supply/demand never moves the price (no oscillation)", () => {
    let market = seedMarket("grain", 10);
    for (let tick = 0; tick < 100; tick++) {
      const result = updateMarketGood({
        market,
        goodId: "grain",
        supply: 100,
        demandSources: { households: 100 },
        inventory: 0,
      });
      market = result.market;
      expect(market.goods.grain!.localPrice).toBe(10);
      expect(market.goods.grain!.pricePressure).toBe(0);
    }
  });

  it("100-tick stress test: a persistent shortage drifts the price monotonically, never reversing direction (no oscillation loop)", () => {
    let market = seedMarket("grain", 10);
    let previousPrice = 10;
    for (let tick = 0; tick < 100; tick++) {
      const result = updateMarketGood({
        market,
        goodId: "grain",
        supply: 5,
        demandSources: { households: 10 },
        inventory: 0,
      });
      market = result.market;
      const price = market.goods.grain!.localPrice;
      expect(price).toBeGreaterThanOrEqual(previousPrice); // never reverses -- monotonic, not oscillating
      expect(price / previousPrice - 1).toBeLessThanOrEqual(0.1); // each tick still individually bounded
      previousPrice = price;
    }
  });

  it("Acceptance Gate: a one-time shortage shock raises price smoothly, then it stabilizes once balance returns", () => {
    let market = seedMarket("grain", 10);

    const shock = updateMarketGood({
      market,
      goodId: "grain",
      supply: 5,
      demandSources: { households: 20 },
      inventory: 0,
    });
    market = shock.market;
    const priceAfterShock = market.goods.grain!.localPrice;
    expect(priceAfterShock).toBeGreaterThan(10);

    for (let tick = 0; tick < 20; tick++) {
      const result = updateMarketGood({
        market,
        goodId: "grain",
        supply: 10,
        demandSources: { households: 10 },
        inventory: 0,
      });
      market = result.market;
    }

    expect(market.goods.grain!.shortageSeverity).toBe(0);
    expect(market.goods.grain!.pricePressure).toBe(0);
    expect(market.goods.grain!.localPrice).toBe(priceAfterShock);
  });

  it("Acceptance Gate: a one-time surplus shock lowers price smoothly, then it stabilizes once balance returns", () => {
    let market = seedMarket("grain", 10);

    const shock = updateMarketGood({
      market,
      goodId: "grain",
      supply: 30,
      demandSources: { households: 5 },
      inventory: 20,
    });
    market = shock.market;
    const priceAfterShock = market.goods.grain!.localPrice;
    expect(priceAfterShock).toBeLessThan(10);

    for (let tick = 0; tick < 20; tick++) {
      const result = updateMarketGood({
        market,
        goodId: "grain",
        supply: 10,
        demandSources: { households: 10 },
        inventory: 0,
      });
      market = result.market;
    }

    expect(market.goods.grain!.pricePressure).toBe(0);
    expect(market.goods.grain!.localPrice).toBe(priceAfterShock);
  });

  it("keeps a bounded rolling history window instead of growing it forever", () => {
    let market = seedMarket("grain", 10);
    for (let tick = 0; tick < 20; tick++) {
      const result = updateMarketGood({
        market,
        goodId: "grain",
        supply: 10,
        demandSources: { households: 10 },
        inventory: 0,
      });
      market = result.market;
    }
    expect(market.history.rollingSupply.grain!.length).toBeLessThanOrEqual(6);
    expect(market.history.rollingDemand.grain!.length).toBeLessThanOrEqual(6);
    expect(market.history.rollingPrice.grain!.length).toBeLessThanOrEqual(6);
  });
});
