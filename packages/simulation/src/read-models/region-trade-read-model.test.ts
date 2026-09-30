import { describe, expect, it } from "vitest";
import {
  createConnection,
  createInventory,
  createMarket,
  createRegion,
  createRegionGeography,
  createSettlement,
  createWorld,
  createWorldState,
  type WorldState,
} from "@first-cause/entities";
import type { SimulationFact } from "@first-cause/causality";
import {
  buildRegionTradeReadModels,
  LEGACY_TRADE_FLOW_FACT_TYPE,
  type RegionTradeView,
} from "./region-trade-read-model.js";
import { buildWorldSnapshot } from "./world-view-read-model.js";

const geography = createRegionGeography({
  terrain: "plains",
  climate: "temperate",
  area: 10,
  fertility: 0.5,
  waterAccess: true,
  coastal: false,
  elevationClass: "lowland",
});

/**
 * Cztery regiony: delta, harbour, hills (wszystkie w modelu handlu) oraz
 * wild -- bez Market i Inventory (poza modelem handlu). Połączenia:
 * delta–harbour, delta–hills, oraz DRUGIE połączenie delta–harbour (rzeka),
 * żeby sprawdzić, że partner pojawia się w jednym wierszu.
 */
function tradeState(
  tick = 5,
  date = { year: 3, month: 6 },
  options: { abandonedDeltaSettlement?: boolean } = {},
): WorldState {
  const base = createWorld({
    id: "world_trade_rm",
    seed: "trade-rm",
    name: "Trade RM",
    configuration: { regionCount: 4, worldSizePreset: "test" },
  });
  const world = { ...base, currentTick: tick, currentDate: date };
  const region = (id: string) =>
    createRegion({ id, worldId: world.id, continentId: "c", name: id, geography });
  const traded = ["delta", "harbour", "hills"];
  const connection = (id: string, a: string, b: string) =>
    createConnection({
      id,
      regionAId: a,
      regionBId: b,
      geography: { physicalDistance: 10, terrainDifficulty: 0, seasonalModifier: 1 },
      infrastructure: { level: 1, transportModes: [], capacity: 100 },
    });
  const settlements = options.abandonedDeltaSettlement
    ? [
        {
          ...createSettlement({
            id: "delta_old_town",
            regionId: "delta",
            name: "Old Town",
            foundedTick: 0,
            stage: "CAMP",
          }),
          status: "ABANDONED" as const,
          abandonedTick: 2,
        },
      ]
    : [];
  return createWorldState({
    world,
    continents: [{ id: "c", worldId: world.id, name: "C", regionIds: [], tags: [] }],
    regions: [...traded, "wild"].map(region),
    settlements,
    connections: [
      connection("conn_delta_harbour", "delta", "harbour"),
      connection("conn_delta_hills", "delta", "hills"),
      connection("conn_delta_harbour_river", "harbour", "delta"),
      connection("conn_hills_wild", "hills", "wild"),
    ],
    markets: traded.map((id) => createMarket({ id: `market_${id}`, regionId: id })),
    inventories: traded.map((id) =>
      createInventory({
        id: `inventory_${id}`,
        ownerType: "region",
        ownerId: id,
        locationRegionId: id,
      }),
    ),
  });
}

let nextId = 0;
/** Fakt handlu w kształcie `tradeOneDirection`: `<connectionId>:<goodId>`, lokalizacja = importer. */
function flow(
  connectionId: string,
  goodId: string,
  importer: string,
  after: unknown,
  tick = 4,
): SimulationFact {
  return {
    id: `fact_${nextId++}`,
    tick,
    type: "trade_flow_active",
    subject: { entityType: "connectionGood", entityId: `${connectionId}:${goodId}` },
    location: { regionId: importer },
    values: { before: 0, after },
  };
}

function recorded(view: RegionTradeView | undefined) {
  if (view?.status !== "RECORDED")
    throw new Error(`expected RECORDED, got ${view?.status}`);
  return view;
}
const q = (known: number, records: number, unknownRecords = 0) => ({
  known,
  records,
  unknownRecords,
});

describe("buildRegionTradeReadModels (M21-VIS-R4B)", () => {
  it("puts import and export of the same good in ONE row, with each partner once", () => {
    const facts = [
      flow("conn_delta_hills", "tools", "delta", 12), // delta przywozi od hills
      flow("conn_delta_harbour", "tools", "harbour", 20), // delta wysyła do harbour
    ];
    const delta = recorded(buildRegionTradeReadModels(tradeState(), facts).get("delta"));
    expect(delta.goods).toEqual([
      {
        goodId: "tools",
        imported: q(12, 1),
        exported: q(20, 1),
        partners: [
          { partnerRegionId: "harbour", imported: q(0, 0), exported: q(20, 1) },
          { partnerRegionId: "hills", imported: q(12, 1), exported: q(0, 0) },
        ],
      },
    ]);
    expect(delta).toMatchObject({
      missingQuantityRecords: 0,
      missingPartnerRecords: 0,
      legacyRecords: 0,
    });
  });

  it("shows import-only and export-only goods with a known zero on the other side", () => {
    const facts = [
      flow("conn_delta_hills", "grain", "delta", 120),
      flow("conn_delta_harbour", "cloth", "harbour", 60),
    ];
    const delta = recorded(buildRegionTradeReadModels(tradeState(), facts).get("delta"));
    const byGood = Object.fromEntries(delta.goods.map((g) => [g.goodId, g]));
    expect(byGood.grain!.imported).toEqual(q(120, 1));
    expect(byGood.grain!.exported).toEqual(q(0, 0));
    expect(byGood.cloth!.imported).toEqual(q(0, 0));
    expect(byGood.cloth!.exported).toEqual(q(60, 1));
    // Stabilna kolejność: według id towaru, niezależnie od kolejności faktów.
    expect(delta.goods.map((g) => g.goodId)).toEqual(["cloth", "grain"]);
  });

  it("sums many partners of one good; partner rows add up to the good row", () => {
    const facts = [
      flow("conn_delta_hills", "grain", "delta", 70),
      flow("conn_delta_harbour", "grain", "delta", 50),
    ];
    const delta = recorded(buildRegionTradeReadModels(tradeState(), facts).get("delta"));
    const grain = delta.goods[0]!;
    expect(grain.imported).toEqual(q(120, 2));
    expect(grain.partners.reduce((s, p) => s + p.imported.known, 0)).toBe(
      grain.imported.known,
    );
    expect(grain.partners.reduce((s, p) => s + p.exported.known, 0)).toBe(
      grain.exported.known,
    );
  });

  it("merges two connections to the same partner and both directions into ONE partner row", () => {
    const facts = [
      flow("conn_delta_harbour", "tools", "delta", 5),
      flow("conn_delta_harbour_river", "tools", "delta", 7),
      flow("conn_delta_harbour_river", "tools", "harbour", 3),
    ];
    const delta = recorded(buildRegionTradeReadModels(tradeState(), facts).get("delta"));
    expect(delta.goods[0]!.partners).toEqual([
      { partnerRegionId: "harbour", imported: q(12, 2), exported: q(3, 1) },
    ]);
  });

  it("counts one exchange once per side -- importer imports, exporter exports, nobody else", () => {
    const models = buildRegionTradeReadModels(tradeState(), [
      flow("conn_delta_hills", "grain", "delta", 40),
    ]);
    expect(recorded(models.get("delta")).goods[0]!.imported).toEqual(q(40, 1));
    expect(recorded(models.get("hills")).goods[0]!.exported).toEqual(q(40, 1));
    expect(recorded(models.get("hills")).goods[0]!.imported).toEqual(q(0, 0));
    // Region bez udziału w tej wymianie: potwierdzony brak handlu, nie jej kopia.
    expect(recorded(models.get("harbour")).goods).toEqual([]);
  });

  it("zero ≠ no data: invalid quantities are a missing part, never 0", () => {
    const facts = [
      flow("conn_delta_hills", "grain", "delta", 10),
      flow("conn_delta_hills", "grain", "delta", Number.NaN),
      flow("conn_delta_hills", "grain", "delta", null),
      flow("conn_delta_hills", "grain", "delta", undefined),
      flow("conn_delta_hills", "grain", "delta", -3),
    ];
    const delta = recorded(buildRegionTradeReadModels(tradeState(), facts).get("delta"));
    expect(delta.goods[0]!.imported).toEqual(q(10, 5, 4));
    expect(delta).toMatchObject({
      missingQuantityRecords: 4,
      missingPartnerRecords: 0,
      legacyRecords: 0,
    });
    expect(Number.isNaN(delta.goods[0]!.imported.known)).toBe(false);
  });

  it("distinguishes confirmed no trade, no completed period and outside the trade model", () => {
    const models = buildRegionTradeReadModels(tradeState(), []);
    expect(recorded(models.get("delta")).goods).toEqual([]);
    expect(recorded(models.get("delta"))).toMatchObject({
      missingQuantityRecords: 0,
      missingPartnerRecords: 0,
    });
    expect(models.get("wild")).toEqual({
      status: "NO_DATA",
      reason: "OUTSIDE_TRADE_MODEL",
    });
    const atStart = buildRegionTradeReadModels(tradeState(0, { year: 3, month: 6 }), [
      flow("conn_delta_hills", "grain", "delta", 10, 0),
    ]);
    expect(atStart.get("delta")).toEqual({
      status: "NO_DATA",
      reason: "NO_COMPLETED_PERIOD",
    });
  });

  it("uses exactly the last completed month (tick - 1) and never mixes periods", () => {
    const facts = [
      flow("conn_delta_hills", "grain", "delta", 1, 3), // starszy okres
      flow("conn_delta_hills", "grain", "delta", 9, 4), // ostatni zakończony
      flow("conn_delta_hills", "grain", "delta", 100, 5), // bieżący, jeszcze niezamknięty
    ];
    const delta = recorded(buildRegionTradeReadModels(tradeState(), facts).get("delta"));
    expect(delta.period).toEqual({ tick: 4, year: 3, month: 5 });
    expect(delta.goods[0]!.imported).toEqual(q(9, 1));
    const january = recorded(
      buildRegionTradeReadModels(tradeState(5, { year: 3, month: 1 }), []).get("delta"),
    );
    expect(january.period).toEqual({ tick: 4, year: 2, month: 12 });
  });

  it("keeps an import with an unresolvable connection as 'partner unknown' and never invents the exporter", () => {
    const models = buildRegionTradeReadModels(tradeState(), [
      flow("conn_missing", "grain", "delta", 8),
      flow("conn_hills_wild", "grain", "delta", 2), // delta nie jest końcem tego połączenia
    ]);
    const delta = recorded(models.get("delta"));
    expect(delta.goods[0]!.imported).toEqual(q(10, 2));
    expect(delta.goods[0]!.partners).toEqual([
      { partnerRegionId: undefined, imported: q(10, 2), exported: q(0, 0) },
    ]);
    // Ilość znana (8 + 2), nieznany tylko partner: to NIE jest dolne ograniczenie ilości.
    expect(delta.goods[0]!.imported.unknownRecords).toBe(0);
    expect(delta).toMatchObject({ missingQuantityRecords: 0, missingPartnerRecords: 2 });
    expect(recorded(models.get("hills")).goods).toEqual([]);
    expect(recorded(models.get("harbour")).goods).toEqual([]);
  });

  it("is region trade: an ABANDONED settlement does not erase or alter its region's trade", () => {
    const facts = [flow("conn_delta_hills", "grain", "delta", 30)];
    const withAbandoned = buildRegionTradeReadModels(
      tradeState(5, { year: 3, month: 6 }, { abandonedDeltaSettlement: true }),
      facts,
    );
    expect(withAbandoned.get("delta")).toEqual(
      buildRegionTradeReadModels(tradeState(), facts).get("delta"),
    );
    expect(recorded(withAbandoned.get("delta")).scope).toBe("REGION");
  });

  it("is deterministic and exposed on every WorldRegionView of the snapshot", () => {
    const facts = [
      flow("conn_delta_harbour", "tools", "harbour", 20),
      flow("conn_delta_hills", "grain", "delta", 12),
    ];
    const a = buildWorldSnapshot(tradeState(), facts);
    const b = buildWorldSnapshot(tradeState(), [...facts].reverse());
    expect(a.regions.map((r) => r.trade)).toEqual(b.regions.map((r) => r.trade));
    expect(a.regions.find((r) => r.regionId === "wild")!.trade.status).toBe("NO_DATA");
    // Warstwa przepływów widoku świata czyta ten sam fakt (jedno źródło prawdy).
    expect(
      a.flows
        .filter((f) => f.family === "trade")
        .map((f) => f.magnitude)
        .sort(),
    ).toEqual([12, 20]);
  });
  it("never turns an invalid quantity into a flow magnitude (NaN is no data, not a value)", () => {
    const snapshot = buildWorldSnapshot(tradeState(), [
      flow("conn_delta_hills", "grain", "delta", Number.NaN),
      flow("conn_delta_hills", "grain", "delta", 4),
    ]);
    expect(snapshot.flows.map((f) => f.magnitude)).toEqual([4]);
  });
  it("legacy engine facts (trade_flow_evaluated after migration v2 -> v3) are never shown as deliveries", () => {
    const legacy = {
      ...flow("conn_delta_hills", "grain", "delta", 80),
      type: LEGACY_TRADE_FLOW_FACT_TYPE,
    };
    const models = buildRegionTradeReadModels(tradeState(), [
      legacy,
      flow("conn_delta_hills", "grain", "delta", 5),
    ]);
    const delta = recorded(models.get("delta"));
    // 80 (oceniona) nie trafia do sumy; znana jest tylko dostawa 5, reszta = brak danych.
    expect(delta.goods[0]!.imported).toEqual(q(5, 2, 1));
    expect(delta.goods[0]!.partners[0]!.partnerRegionId).toBe("hills");
    expect(delta).toMatchObject({ legacyRecords: 1, missingQuantityRecords: 0 });
    expect(recorded(models.get("hills")).goods[0]!.exported).toEqual(q(5, 2, 1));
    // Warstwa przepływów Atlasu również nie używa ilości ocenionej.
    const snapshot = buildWorldSnapshot(tradeState(), [legacy]);
    expect(snapshot.flows.filter((f) => f.family === "trade")).toEqual([]);
  });
});
