import { createMarket, type Market } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { InvariantViolationError } from "../../../core/validation.js";
import { initializeMarketGood, OFFER_WINDOW_TICKS, updateMarketGood } from "./price-adjustment.js";

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

  it("audit regression (P1, floor/monthly-cap konflikt): floors a basePrice under MIN_PRICE instead of letting rounding zero it out", () => {
    // roundMoney(0.001) rounds to 0.00 (banker's rounding to the nearest
    // cent) -- before the fix this silently produced localPrice: 0,
    // violating both MIN_PRICE and the "price > 0" invariant this same
    // file's own doc comment claims to guarantee.
    const state = initializeMarketGood(0.001);
    expect(state.localPrice).toBeGreaterThanOrEqual(0.01); // MIN_PRICE
    expect(state.localPrice).toBeGreaterThan(0);
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

  it("audit regression (P1, rynek nie reaguje na zerową podaż): a good with zero supply and no history still generates upward price pressure when demand is real", () => {
    const market = seedMarket("grain", 10);
    const { market: next } = updateMarketGood({
      market,
      goodId: "grain",
      supply: 0, // never produced, no rolling history yet either
      demandSources: { households: 10 },
      inventory: 0,
    });

    expect(next.goods.grain!.shortageSeverity).toBeGreaterThan(0);
    expect(next.goods.grain!.pricePressure).toBeGreaterThan(0);
    expect(next.goods.grain!.localPrice).toBeGreaterThan(10);
  });

  it("audit regression (P1): a sustained zero-supply stockout keeps pushing price up tick after tick, not just once", () => {
    let market = seedMarket("grain", 10);
    let previousPrice = 10;
    for (let tick = 0; tick < 10; tick++) {
      const result = updateMarketGood({
        market,
        goodId: "grain",
        supply: 0,
        demandSources: { households: 10 },
        inventory: 0,
      });
      market = result.market;
      const price = market.goods.grain!.localPrice;
      expect(price).toBeGreaterThan(previousPrice); // before the fix this stayed frozen at 10 forever
      previousPrice = price;
    }
  });

  it("N2 (Black Mountain diagnosis P7): with zero recent supply, regional inventory that covers demand does not push the price up; a glut pushes it down", () => {
    // Zapas 184 jedn. przy popycie 0,5/tick i zerowej podaży (stan z
    // diagnozy, seed-alpha): wcześniej +3%/tick bez końca (0,80 → 10 915).
    let market = seedMarket("flour", 0.8);
    for (let tick = 0; tick < 12; tick++) {
      market = updateMarketGood({
        market,
        goodId: "flour",
        supply: 0,
        demandSources: { households: 0.5 },
        inventory: 184,
      }).market;
    }
    expect(market.goods.flour!.localPrice).toBeLessThan(0.8);
    expect(market.goods.flour!.shortageSeverity).toBe(0);

    // Zapas dokładnie pokrywający popyt (bufor 0,5 × 20 = 10): cena stoi.
    const covered = updateMarketGood({
      market: seedMarket("flour", 2),
      goodId: "flour",
      supply: 0,
      demandSources: { households: 10 },
      inventory: 20,
    }).market;
    expect(covered.goods.flour!.localPrice).toBe(2);

    // Bez zapasu zachowanie bez zmian: pełny wzrost przy niedoborze.
    const stockout = updateMarketGood({
      market: seedMarket("flour", 2),
      goodId: "flour",
      supply: 0,
      demandSources: { households: 10 },
      inventory: 0,
    }).market;
    expect(stockout.goods.flour!.localPrice).toBe(2.06);
  });

  it("does not manufacture price pressure for a good with neither supply nor demand (no signal to react to)", () => {
    const market = seedMarket("grain", 10);
    const { market: next } = updateMarketGood({
      market,
      goodId: "grain",
      supply: 0,
      demandSources: {},
      inventory: 0,
    });

    expect(next.goods.grain!.pricePressure).toBe(0);
    expect(next.goods.grain!.localPrice).toBe(10);
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

  it("CE-12 Test 1 (Price WHY?, §89): a supply drop with stable demand produces a price_changed fact whose dominant causal factor is supply, not demand", () => {
    let market = seedMarket("iron_ore", 10);
    // Ustala baseline (reference) na supply=20 przez kilka balansowanych ticków.
    for (let tick = 0; tick < 3; tick++) {
      const result = updateMarketGood({
        market,
        goodId: "iron_ore",
        supply: 20,
        demandSources: { companies: 20 },
        inventory: 0,
      });
      market = result.market;
    }

    // Wymuszony spadek supply, demand bez zmian.
    const { causalLinks } = updateMarketGood({
      market,
      goodId: "iron_ore",
      supply: 5,
      demandSources: { companies: 20 },
      inventory: 0,
    });

    const supplyLink = causalLinks.find((link) => link.factor.key === "supply");
    const demandLink = causalLinks.find((link) => link.factor.key === "demand");
    expect(supplyLink).toBeDefined();
    expect(supplyLink!.type).toBe("CONTRIBUTING"); // spadek supply podnosi cenę
    expect(Math.abs(supplyLink!.factor.contribution)).toBeGreaterThan(
      Math.abs(demandLink?.factor.contribution ?? 0),
    );
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

describe("etap 4A (P12): precyzja ceny jednostkowej oddzielona od groszy", () => {
  it("cena 0,16 rośnie przy trwałym niedoborze i spada przy nadwyżce (dawniej zaokrąglenie do grosza kasowało ruch)", () => {
    let up = seedMarket("flour", 0.16);
    let down = seedMarket("flour", 0.16);
    for (let tick = 0; tick < 12; tick++) {
      up = updateMarketGood({
        market: up,
        goodId: "flour",
        supply: 0,
        demandSources: { households: 66 },
        inventory: 0,
      }).market;
      down = updateMarketGood({
        market: down,
        goodId: "flour",
        supply: 60,
        demandSources: { households: 20 },
        inventory: 200,
      }).market;
    }
    const upPrice = up.goods.flour!.localPrice;
    const downPrice = down.goods.flour!.localPrice;
    // 12 × maks. +3% ≈ 0,228; spadek ograniczony podłogą MIN_PRICE 0,01.
    expect(upPrice).toBeGreaterThan(0.2);
    expect(upPrice).toBeLessThanOrEqual(0.16 * 1.03 ** 12 + 1e-6);
    expect(downPrice).toBeLessThan(0.12);
    expect(downPrice).toBeGreaterThanOrEqual(0.01);
    // 6 miejsc po przecinku, nie grosze.
    expect(Math.round(upPrice * 1e6) / 1e6).toBe(upPrice);
    expect(Math.round(upPrice * 100) / 100).not.toBe(upPrice);
  });

  it("pierwszy krok z 0,16 to dokładnie +3% (limit i wygładzanie bez zmian)", () => {
    const next = updateMarketGood({
      market: seedMarket("flour", 0.16),
      goodId: "flour",
      supply: 0,
      demandSources: { households: 10 },
      inventory: 0,
    }).market;
    expect(next.goods.flour!.localPrice).toBe(0.1648);
  });
});

describe("P14: cena przy braku dostępnych ofert", () => {
  const step = (market: Market, offered: number, inventory = 0) =>
    updateMarketGood({
      market,
      goodId: "flour",
      supply: 0,
      demandSources: { households: 30 },
      inventory,
      offered,
    });

  it("rynek bez żadnej oferty: cena bazowa zostaje (orientacyjna), niedobór dalej 1, fakt z powodem", () => {
    let market = seedMarket("flour", 4);
    const first = step(market, 0);
    expect(first.facts.map((f) => f.type)).toContain("price_pressure_suspended");
    expect(first.causalLinks.some((l) => l.factor.key === "never_offered")).toBe(true);
    market = first.market;
    for (let tick = 0; tick < 24; tick++) market = step(market, 0).market;
    const good = market.goods.flour!;
    expect(good.localPrice).toBe(4);
    expect(good.priceSuspension).toBe("NEVER_OFFERED");
    expect(good.shortageSeverity).toBe(1);
    expect(good.demand).toBe(30);
  });

  it("krótki brak ofert po podaży nadal podnosi cenę; po całym oknie podwyżki stają; oferty je wznawiają", () => {
    let market = step(seedMarket("flour", 4), 10, 10).market; // oferty
    expect(market.goods.flour!.ticksWithoutOffers).toBe(0);
    const prices: number[] = [];
    for (let tick = 0; tick < OFFER_WINDOW_TICKS + 4; tick++) {
      market = step(market, 0).market;
      prices.push(market.goods.flour!.localPrice);
    }
    // Ticki 1..okno−1: wzrost; od okna: cena stoi.
    expect(prices[0]!).toBeGreaterThan(4);
    expect(prices[OFFER_WINDOW_TICKS - 2]!).toBeGreaterThan(prices[0]!);
    expect(prices.at(-1)).toBe(prices[OFFER_WINDOW_TICKS - 2]);
    expect(market.goods.flour!.priceSuspension).toBe("NO_OFFERS_IN_WINDOW");
    const resumed = step(market, 5, 0);
    expect(resumed.facts.map((f) => f.type)).toContain("price_pressure_resumed");
    expect(resumed.market.goods.flour!.priceSuspension).toBeUndefined();
    expect(resumed.market.goods.flour!.localPrice).toBeGreaterThan(prices.at(-1)!);
  });

  it("bez `offered` (wywołujący nie śledzi ofert) zachowanie sprzed P14", () => {
    const next = updateMarketGood({
      market: seedMarket("flour", 4),
      goodId: "flour",
      supply: 0,
      demandSources: { households: 30 },
      inventory: 0,
    }).market.goods.flour!;
    expect(next.localPrice).toBe(4.12);
    expect(next.ticksWithoutOffers).toBeUndefined();
  });
});
