import { describe, expect, it } from "vitest";
import { buildWorldSnapshot } from "../read-models/world-view-read-model.js";
import {
  runTradeScenario,
  TRADE_SCENARIO as S,
  tradeScenarioEvaluatedQuantity,
} from "./trade-scenario.js";

/**
 * M21-VIS-R4B follow-up: dowód pełnej ścieżki STAN POCZĄTKOWY → produkcyjny
 * tick → `trade_flow_active` → Read Model → handel eksportera i importera.
 * Faktów handlu nikt tu nie wpisuje -- powstają w `runEconomyTick`.
 */
describe("trade verification scenario (production tick → Read Model)", () => {
  it("really trades: delivered quantity < evaluated, both sides of the table agree", () => {
    const runner = runTradeScenario(1);
    const facts = runner.facts;
    const trade = facts.filter((f) => f.type === "trade_flow_active");
    expect(trade).toHaveLength(1);
    const fact = trade[0]!;
    expect(fact.subject.entityId).toBe(`${S.connectionId}:${S.goodId}`);
    expect(fact.location.regionId).toBe(S.importerRegionId);
    const delivered = (fact.values as { after: number }).after;

    // Rozliczenie: fakty inventory bezpośrednio po fakcie handlu (ten przepływ).
    const i = facts.indexOf(fact);
    expect(facts[i + 1]).toMatchObject({
      type: "inventory_decreased",
      subject: { entityId: "scenario_inventory_basin:flour" },
      values: { after: 0, delta: -delivered },
    });
    expect(facts[i + 2]).toMatchObject({
      type: "inventory_increased",
      subject: { entityId: "scenario_inventory_coast:flour" },
      values: { delta: delivered },
    });
    // Ocena przekraczała realny stock eksportera (stock wyczerpany do 0).
    const evaluated = tradeScenarioEvaluatedQuantity(runner.worldState);
    expect(evaluated).toBeGreaterThan(delivered);

    // Inne zmiany magazynu eksportera w tym ticku (np. konsumpcja) nie są handlem.
    const otherBasinChanges = facts.filter(
      (f, j) =>
        j !== i + 1 &&
        f.tick === fact.tick &&
        f.subject.entityId === "scenario_inventory_basin:flour",
    );
    expect(otherBasinChanges.length).toBeGreaterThan(0);

    const snapshot = buildWorldSnapshot(runner.worldState, facts);
    const view = (id: string) => snapshot.regions.find((r) => r.regionId === id)!.trade;
    const importer = view(S.importerRegionId);
    const exporter = view(S.exporterRegionId);
    if (importer.status !== "RECORDED" || exporter.status !== "RECORDED")
      throw new Error("expected RECORDED");
    expect(importer.period).toEqual({ tick: 0, year: 1, month: 1 });
    expect(importer.goods).toEqual([
      {
        goodId: S.goodId,
        imported: { known: delivered, records: 1, unknownRecords: 0 },
        exported: { known: 0, records: 0, unknownRecords: 0 },
        partners: [
          {
            partnerRegionId: S.exporterRegionId,
            imported: { known: delivered, records: 1, unknownRecords: 0 },
            exported: { known: 0, records: 0, unknownRecords: 0 },
          },
        ],
      },
    ]);
    expect(exporter.goods[0]).toMatchObject({
      goodId: S.goodId,
      imported: { known: 0, records: 0 },
      exported: { known: delivered, records: 1, unknownRecords: 0 },
      partners: [{ partnerRegionId: S.importerRegionId }],
    });
  });

  it("is deterministic: the same seed and initial state give the same trade", () => {
    const a = runTradeScenario(3);
    const b = runTradeScenario(3);
    const pick = (r: typeof a) =>
      r.facts
        .filter((f) => f.type === "trade_flow_active")
        .map((f) => [f.tick, f.subject.entityId, f.values.after]);
    expect(pick(a)).toEqual(pick(b));
    expect(pick(a).length).toBeGreaterThan(0);
  });
});
