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

/** Zlokalizowane etykiety komórek (`world.trade.atLeast`, `world.trade.cellNoData`). */
export interface TradeCellLabels {
  readonly atLeast: (formatted: string) => string;
  readonly noData: string;
}

/** Tekst komórki: „0” = znane zero, „co najmniej n” = część znana, „brak danych” = brak danych. */
export function formatTradeCell(
  cell: TradeCell,
  format: (n: number) => string,
  labels: TradeCellLabels,
): string {
  switch (cell.kind) {
    case "value":
      return format(cell.value);
    case "partial":
      return labels.atLeast(format(cell.value));
    case "unavailable":
      return labels.noData;
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

/** Prostokąt w jednostkach diagramu (np. etykieta regionu). */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

const inside = (p: Point, b: Box, pad: number) =>
  p.x >= b.x - pad &&
  p.x <= b.x + b.w + pad &&
  p.y >= b.y - pad &&
  p.y <= b.y + b.h + pad;

type ArcOptions = {
  readonly bend?: number;
  readonly dash?: number;
  readonly gap?: number;
  readonly trim?: number;
  readonly head?: number;
  readonly avoid?: readonly Box[];
  readonly avoidPad?: number;
};
type Arc = {
  readonly dashes: readonly (readonly [Point, Point])[];
  readonly arrow: readonly [Point, Point, Point];
  /** Kreski pominięte, bo leżałyby na etykiecie. */
  readonly hiddenDashes: number;
  /** `false`, gdy każde miejsce grota koliduje z etykietą (grot mimo to rysowany w środku). */
  readonly arrowClear: boolean;
};

/**
 * Relacja handlowa na Atlasie (nie trasa): przerywany łuk od eksportera do
 * importera, odgięty w prawo względem kierunku -- dwa kierunki tej samej
 * pary leżą więc po przeciwnych stronach i nie nakładają się na linię
 * połączenia. Łuk zaczyna się i kończy na krawędzi pierścieni (`trim`);
 * kreski i grot podawane w jednostkach diagramu (wywołujący przelicza px
 * ekranu przez skalę).
 *
 * Follow-up R4B: `avoid` (prostokąty etykiet regionów) -- kreski wchodzące
 * pod etykietę są pomijane (nazwa regionu ma pierwszeństwo), a grot
 * przesuwany wzdłuż łuku do pierwszego wolnego miejsca; gdy wolnego miejsca
 * nie ma (krótki łuk przy oddaleniu), łuk dostaje większe wygięcie
 * (`ARC_FALLBACK_BENDS`). Geometria regionów bez zmian.
 */
export function tradeRelationArc(from: Point, to: Point, options: ArcOptions = {}): Arc {
  const bends = [options.bend ?? 0.12, ...ARC_FALLBACK_BENDS]; // TODO tuning
  let arc = relationArcWithBend(from, to, { ...options, bend: bends[0]! });
  for (const bend of bends.slice(1)) {
    if (arc.arrowClear) break;
    arc = relationArcWithBend(from, to, { ...options, bend });
  }
  return arc;
}

/** TODO tuning: kolejne wygięcia łuku, gdy grot nie mieści się poza etykietami. */
const ARC_FALLBACK_BENDS = [0.2, 0.3, 0.45, 0.6] as const;

function relationArcWithBend(from: Point, to: Point, options: ArcOptions = {}): Arc {
  const bend = options.bend ?? 0.12; // TODO tuning
  const dash = options.dash ?? 6; // TODO tuning
  const gap = options.gap ?? 4; // TODO tuning
  const trim = options.trim ?? 0;
  const head = options.head ?? 9; // TODO tuning
  const avoid = options.avoid ?? [];
  const pad = options.avoidPad ?? 0;
  const blocked = (p: Point) => avoid.some((b) => inside(p, b, pad));
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
  let hiddenDashes = 0;
  let travelled = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!,
      b = points[i]!;
    if (travelled % (dash + gap) < dash) {
      if (blocked(a) || blocked(b)) hiddenDashes += 1;
      else dashes.push([a, b]);
    }
    travelled += Math.hypot(b.x - a.x, b.y - a.y);
  }
  const arrowAt = (t: number): [Point, Point, Point] => {
    const tip = at(t),
      back = at(t - 0.04);
    const angle = Math.atan2(tip.y - back.y, tip.x - back.x);
    return [
      {
        x: tip.x - head * Math.cos(angle - 0.45),
        y: tip.y - head * Math.sin(angle - 0.45),
      },
      tip,
      {
        x: tip.x - head * Math.cos(angle + 0.45),
        y: tip.y - head * Math.sin(angle + 0.45),
      },
    ];
  };
  // Grot w połowie łuku, a gdy tam stoi etykieta -- najbliższe wolne miejsce.
  const candidates = [0.54, 0.46, 0.62, 0.38, 0.7, 0.3, 0.78, 0.22];
  const clear = candidates.map(arrowAt).find((arrow) => !arrow.some(blocked));
  return {
    dashes,
    arrow: clear ?? arrowAt(0.54),
    hiddenDashes,
    arrowClear: clear !== undefined,
  };
}
