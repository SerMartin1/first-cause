import type { WorldState } from "@first-cause/entities";
import type { SimulationFact } from "@first-cause/causality";

/**
 * M21-VIS-R4B -- Handel regionu (tabela według towarów, szczegóły
 * partnerów). Czysta projekcja istniejących faktów `trade_flow_active`
 * (`economy-tick.ts`, `tradeOneDirection`): bez nowej mechaniki, bez
 * drugiego źródła prawdy.
 *
 * Semantyka (audyt R4B):
 * - zakres = REGION: handel symulacji odbywa się między Market/Inventory
 *   regionów wzdłuż bezpośredniego Connection; osada nie ma własnego
 *   handlu, więc nic nie jest rozdzielane między osady;
 * - ilość = fizycznie przeniesiona w danym ticku (`values.after` =
 *   `settleTradeFlow(...).quantityMoved`, ENGINE_VERSION 3), w
 *   abstrakcyjnych jednostkach towaru (content nie definiuje jednostek);
 * - okres = jeden miesiąc: ostatni zakończony tick (`currentTick - 1`),
 *   ten sam co warstwa przepływów widoku świata;
 * - partner = drugi koniec Connection; jeden fakt = jedna wymiana na
 *   jednym odcinku, więc nic nie jest liczone wielokrotnie;
 * - zero ≠ brak danych: zapis bez prawidłowej ilości (null / NaN /
 *   ujemna) albo bez ustalonego partnera jest liczony jako brakująca
 *   część, nigdy jako 0;
 * - fakt `trade_flow_evaluated` (zapis starszego silnika po migracji
 *   schematu v2 -> v3) niesie ilość OCENIONĄ -- liczony jako zapis bez
 *   znanej ilości dostarczonej (partner i kierunek zostają), nigdy jako dostawa.
 */

/** Fakt handlu z ilością faktycznie przeniesioną (ENGINE_VERSION >= 3). */
export const TRADE_FLOW_FACT_TYPE = "trade_flow_active" as const;
/** Fakt handlu starszego silnika: ilość oceniona, nie dostarczona (migracja v2 -> v3). */
export const LEGACY_TRADE_FLOW_FACT_TYPE = "trade_flow_evaluated" as const;

/** Ilość w jednym kierunku: suma znanych wartości + liczba zapisów bez ilości. */
export interface TradeQuantity {
  /** Suma znanych ilości (abstrakcyjne jednostki towaru). */
  readonly known: number;
  /** Liczba zapisów przepływu w tym kierunku (z ilością lub bez). */
  readonly records: number;
  /** Zapisy bez prawidłowej ilości -- brakująca część, nie zero. */
  readonly unknownRecords: number;
}

export interface RegionTradePartnerRow {
  /** `undefined` = zapis bez ustalonego partnera (Connection nieznane). */
  readonly partnerRegionId: string | undefined;
  readonly imported: TradeQuantity;
  readonly exported: TradeQuantity;
}

export interface RegionTradeGoodRow {
  readonly goodId: string;
  readonly imported: TradeQuantity;
  readonly exported: TradeQuantity;
  readonly partners: readonly RegionTradePartnerRow[];
}

export interface TradePeriod {
  /** Tick, którego przepływy są pokazane (1 tick = 1 miesiąc). */
  readonly tick: number;
  readonly year: number;
  readonly month: number;
}

export type RegionTradeView =
  | {
      readonly status: "NO_DATA";
      /**
       * `NO_COMPLETED_PERIOD` -- świat nie ma jeszcze zakończonego ticka;
       * `OUTSIDE_TRADE_MODEL` -- region bez Market albo regionalnego
       * Inventory, więc system handlu go nie rejestruje.
       */
      readonly reason: "NO_COMPLETED_PERIOD" | "OUTSIDE_TRADE_MODEL";
    }
  | {
      readonly status: "RECORDED";
      readonly scope: "REGION";
      readonly period: TradePeriod;
      /** Pusta lista = potwierdzony brak handlu w tym okresie. */
      readonly goods: readonly RegionTradeGoodRow[];
      /** Zapisy bez prawidłowej ilości (null / NaN / ujemna) -- bez zapisów starszego silnika. */
      readonly missingQuantityRecords: number;
      /** Zapisy bez ustalonego partnera (ilość może być znana). */
      readonly missingPartnerRecords: number;
      /** Zapisy starszego silnika: znana tylko ilość oceniona, nie dostarczona. */
      readonly legacyRecords: number;
    };

const EMPTY: TradeQuantity = { known: 0, records: 0, unknownRecords: 0 };

function add(q: TradeQuantity, value: number | undefined): TradeQuantity {
  return value === undefined
    ? { known: q.known, records: q.records + 1, unknownRecords: q.unknownRecords + 1 }
    : {
        known: q.known + value,
        records: q.records + 1,
        unknownRecords: q.unknownRecords,
      };
}

/** Prawidłowa ilość albo `undefined` (brak danych) -- nigdy fallback do 0. */
function knownQuantity(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function previousMonth(state: WorldState): TradePeriod {
  const { year, month } = state.world.currentDate;
  return {
    tick: state.world.currentTick - 1,
    ...(month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }),
  };
}

interface GoodAccumulator {
  imported: TradeQuantity;
  exported: TradeQuantity;
  readonly partners: Map<
    string | undefined,
    { imported: TradeQuantity; exported: TradeQuantity }
  >;
}

interface RegionAccumulator {
  readonly goods: Map<string, GoodAccumulator>;
  missingQuantityRecords: number;
  missingPartnerRecords: number;
  legacyRecords: number;
}

function record(
  ledger: Map<string, RegionAccumulator>,
  regionId: string,
  goodId: string,
  partnerRegionId: string | undefined,
  direction: "imported" | "exported",
  value: number | undefined,
  legacy: boolean,
): void {
  let region = ledger.get(regionId);
  if (!region) {
    region = {
      goods: new Map(),
      missingQuantityRecords: 0,
      missingPartnerRecords: 0,
      legacyRecords: 0,
    };
    ledger.set(regionId, region);
  }
  let good = region.goods.get(goodId);
  if (!good) {
    good = { imported: EMPTY, exported: EMPTY, partners: new Map() };
    region.goods.set(goodId, good);
  }
  const partner = good.partners.get(partnerRegionId) ?? {
    imported: EMPTY,
    exported: EMPTY,
  };
  partner[direction] = add(partner[direction], value);
  good.partners.set(partnerRegionId, partner);
  good[direction] = add(good[direction], value);
  if (legacy) region.legacyRecords += 1;
  else if (value === undefined) region.missingQuantityRecords += 1;
  if (partnerRegionId === undefined) region.missingPartnerRecords += 1;
}

/**
 * Handel wszystkich regionów w ostatnim zakończonym okresie -- jedno
 * przejście po faktach dla całego widoku świata.
 */
export function buildRegionTradeReadModels(
  state: WorldState,
  facts: readonly SimulationFact[],
): ReadonlyMap<string, RegionTradeView> {
  const result = new Map<string, RegionTradeView>();
  const regionIds = Object.keys(state.regions).sort();
  if (state.world.currentTick === 0) {
    for (const id of regionIds)
      result.set(id, { status: "NO_DATA", reason: "NO_COMPLETED_PERIOD" });
    return result;
  }
  const period = previousMonth(state);
  const ledger = new Map<string, RegionAccumulator>();
  for (const fact of facts) {
    const legacy = fact.type === LEGACY_TRADE_FLOW_FACT_TYPE;
    if (fact.tick !== period.tick || (fact.type !== TRADE_FLOW_FACT_TYPE && !legacy))
      continue;
    const separator = fact.subject.entityId.lastIndexOf(":");
    if (separator <= 0) continue;
    const connection = state.connections[fact.subject.entityId.slice(0, separator)];
    const goodId = fact.subject.entityId.slice(separator + 1);
    const importer = fact.location.regionId;
    // Ilość oceniona starszego silnika nie jest dostawą -- dostawa nieznana.
    const value = legacy
      ? undefined
      : knownQuantity((fact.values as { after?: unknown }).after);
    const exporter =
      connection &&
      (connection.regionAId === importer || connection.regionBId === importer)
        ? connection.regionAId === importer
          ? connection.regionBId
          : connection.regionAId
        : undefined;
    record(ledger, importer, goodId, exporter, "imported", value, legacy);
    // Bez ustalonego Connection strona eksportująca jest nieznana -- nie zgadujemy jej.
    if (exporter !== undefined)
      record(ledger, exporter, goodId, importer, "exported", value, legacy);
  }
  for (const id of regionIds) {
    const region = state.regions[id]!;
    if (!region.economy.marketId || !region.economy.regionalInventoryId) {
      result.set(id, { status: "NO_DATA", reason: "OUTSIDE_TRADE_MODEL" });
      continue;
    }
    const acc = ledger.get(id);
    const goods = [...(acc?.goods.entries() ?? [])]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([goodId, good]): RegionTradeGoodRow => ({
        goodId,
        imported: good.imported,
        exported: good.exported,
        partners: [...good.partners.entries()]
          .sort(([a], [b]) =>
            a === undefined ? 1 : b === undefined ? -1 : a.localeCompare(b),
          )
          .map(([partnerRegionId, q]) => ({
            partnerRegionId,
            imported: q.imported,
            exported: q.exported,
          })),
      }));
    result.set(id, {
      status: "RECORDED",
      scope: "REGION",
      period,
      goods,
      missingQuantityRecords: acc?.missingQuantityRecords ?? 0,
      missingPartnerRecords: acc?.missingPartnerRecords ?? 0,
      legacyRecords: acc?.legacyRecords ?? 0,
    });
  }
  return result;
}
