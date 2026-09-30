import type {
  RegionTradeGoodRow,
  RegionTradeView,
  TradeQuantity,
  WorldRegionView,
} from "@first-cause/simulation";

/**
 * M21-VIS-R4B -- Handel według towarów (prezentacja). Czyste funkcje nad
 * `WorldRegionView.trade`; bez własnego stanu danych i bez fallbacków do 0.
 */

/** Stan komórki ilości: znane 0 ≠ brak danych ≠ dane częściowe. */
export type TradeCell =
  | { readonly kind: "value"; readonly value: number }
  | { readonly kind: "partial"; readonly value: number }
  | { readonly kind: "unavailable" };

export function tradeCell(q: TradeQuantity): TradeCell {
  if (q.records === 0) return { kind: "value", value: 0 };
  if (q.unknownRecords === q.records) return { kind: "unavailable" };
  return q.unknownRecords > 0
    ? { kind: "partial", value: q.known }
    : { kind: "value", value: q.known };
}

/** Tekst komórki: „0” dla znanego zera, „≥ n” dla części znanej, „—” dla braku danych. */
export function formatTradeCell(cell: TradeCell, format: (n: number) => string): string {
  switch (cell.kind) {
    case "value":
      return format(cell.value);
    case "partial":
      return `≥ ${format(cell.value)}`;
    case "unavailable":
      return "—";
  }
}

/** Stabilna kolejność towarów: nazwa w bieżącym języku, potem id (rozstrzyga remisy). */
export function sortTradeGoods(
  goods: readonly RegionTradeGoodRow[],
  name: (goodId: string) => string,
  locale: string,
): RegionTradeGoodRow[] {
  const collator = new Intl.Collator(locale);
  return [...goods].sort(
    (a, b) =>
      collator.compare(name(a.goodId), name(b.goodId)) ||
      a.goodId.localeCompare(b.goodId),
  );
}

export interface TradeHighlight {
  readonly goodId: string;
  /** Partnerzy rozwiniętego towaru (znani -- bez „partnera nieustalonego”). */
  readonly partnerRegionIds: readonly string[];
  /** Wskazana para: kierunki wymiany TEGO towaru z TYM partnerem. */
  readonly pair:
    | {
        readonly partnerRegionId: string;
        readonly imports: boolean;
        readonly exports: boolean;
      }
    | undefined;
}

/**
 * Wyróżnienia Atlasu wyprowadzone z BIEŻĄCYCH danych: towar lub partner,
 * którego nie ma w obecnym okresie / regionie, nie daje wyróżnienia
 * (brak nieaktualnych zaznaczeń po ticku lub zmianie wyboru).
 */
export function tradeHighlight(
  region: WorldRegionView | undefined,
  goodId: string | undefined,
  partnerId: string | undefined,
): TradeHighlight | undefined {
  if (!region || !goodId || region.trade.status !== "RECORDED") return undefined;
  const good = region.trade.goods.find((g) => g.goodId === goodId);
  if (!good) return undefined;
  const partnerRegionIds = good.partners.flatMap((p) =>
    p.partnerRegionId === undefined ? [] : [p.partnerRegionId],
  );
  const partner = good.partners.find(
    (p) => p.partnerRegionId !== undefined && p.partnerRegionId === partnerId,
  );
  return {
    goodId,
    partnerRegionIds,
    pair: partner
      ? {
          partnerRegionId: partner.partnerRegionId!,
          imports: partner.imported.records > 0,
          exports: partner.exported.records > 0,
        }
      : undefined,
  };
}

export function isTradeRecorded(
  trade: RegionTradeView,
): trade is Extract<RegionTradeView, { status: "RECORDED" }> {
  return trade.status === "RECORDED";
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Relacja handlowa na Atlasie (nie trasa): przerywany łuk od eksportera do
 * importera, odgięty w prawo względem kierunku -- dwa kierunki tej samej
 * pary leżą więc po przeciwnych stronach i nie nakładają się na linię
 * połączenia. Łuk zaczyna się i kończy na krawędzi pierścieni (`trim`);
 * kreski i grot podawane w jednostkach diagramu (wywołujący przelicza px
 * ekranu przez skalę). Zwraca odcinki kresek oraz grot w połowie łuku.
 */
export function tradeRelationArc(
  from: Point,
  to: Point,
  options: {
    readonly bend?: number;
    readonly dash?: number;
    readonly gap?: number;
    readonly trim?: number;
    readonly head?: number;
  } = {},
): {
  readonly dashes: readonly (readonly [Point, Point])[];
  readonly arrow: readonly [Point, Point, Point];
} {
  const bend = options.bend ?? 0.12; // TODO tuning
  const dash = options.dash ?? 6; // TODO tuning
  const gap = options.gap ?? 4; // TODO tuning
  const trim = options.trim ?? 0;
  const head = options.head ?? 9; // TODO tuning
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const control = {
    x: (from.x + to.x) / 2 - dy * bend,
    y: (from.y + to.y) / 2 + dx * bend,
  };
  const at = (t: number): Point => ({
    x: (1 - t) ** 2 * from.x + 2 * (1 - t) * t * control.x + t ** 2 * to.x,
    y: (1 - t) ** 2 * from.y + 2 * (1 - t) * t * control.y + t ** 2 * to.y,
  });
  // Gęste próbkowanie (krok ≤ połowa krótszego z kreski/przerwy), żeby kreski
  // miały zadaną długość niezależnie od długości łuku.
  const rough = Math.hypot(dx, dy) * (1 + bend);
  const samples = Math.min(
    4000,
    Math.max(16, Math.ceil(rough / (Math.min(dash, gap) / 2))),
  );
  const points = Array.from({ length: samples + 1 }, (_, i) => at(i / samples)).filter(
    (p) =>
      Math.hypot(p.x - from.x, p.y - from.y) >= trim &&
      Math.hypot(p.x - to.x, p.y - to.y) >= trim,
  );
  const dashes: [Point, Point][] = [];
  let travelled = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!,
      b = points[i]!;
    if (travelled % (dash + gap) < dash) dashes.push([a, b]);
    travelled += Math.hypot(b.x - a.x, b.y - a.y);
  }
  const tip = at(0.54),
    back = at(0.5);
  const angle = Math.atan2(tip.y - back.y, tip.x - back.x);
  return {
    dashes,
    arrow: [
      {
        x: tip.x - head * Math.cos(angle - 0.45),
        y: tip.y - head * Math.sin(angle - 0.45),
      },
      tip,
      {
        x: tip.x - head * Math.cos(angle + 0.45),
        y: tip.y - head * Math.sin(angle + 0.45),
      },
    ],
  };
}
