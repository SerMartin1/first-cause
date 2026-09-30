import type { WorldRegionView, WorldSnapshot } from "@first-cause/simulation";
import { regionPopulationFact } from "./population-mode.js";

export const MAP_MODES = [
  // Widok bazowy (dawniej DEFAULT): osadnictwo i połączenia bez warstwy danych.
  "terrain",
  "political",
  "population",
  "economy",
  "resources",
  "trade",
  "technology",
  "development",
  "stability",
  "change",
] as const;
export type MapMode = (typeof MAP_MODES)[number];
export const OVERLAYS = [
  "settlements",
  "names",
  "connections",
  "resources",
  "events",
  "borders",
  "rivers",
  "railways",
] as const;
export type Overlay = (typeof OVERLAYS)[number];
export type FlowLens = "off" | "trade" | "migration" | "technology";
/**
 * R4B: soczewki, które porównywałyby grubością linii i Top N ilości różnych
 * towarów (zboże vs węgiel) -- bez wspólnej miary, więc niedostępne. Handel
 * czyta się z tabeli; kierunek wymiany pokazuje wskazanie partnera. Migracja
 * była nieaktywna już wcześniej (brak par źródło–cel w Read Modelu).
 */
export const UNAVAILABLE_FLOW_LENSES: ReadonlySet<FlowLens> = new Set([
  "trade",
  "migration",
] as const);
/** Soczewka faktycznie użyta: niedostępna (np. zapamiętany stan „trade”) = wyłączona. */
export function effectiveFlowLens(lens: FlowLens): FlowLens {
  return UNAVAILABLE_FLOW_LENSES.has(lens) ? "off" : lens;
}
export const CHANGE_METRICS = [
  "population",
  "production",
  "resources",
  "trade",
  "infrastructure",
  "technology",
  "settlements",
] as const;
export type ChangeMetric = (typeof CHANGE_METRICS)[number];
/**
 * R4B: miary bez wspólnej jednostki -- ilości różnych towarów (zboże, węgiel,
 * narzędzia) nie sumują się w jedną liczbę. Dla nich ranking i Δ Change są
 * niedostępne (nie 0, nie indeks, nie wartość pieniężna); handel czyta się
 * z tabeli towarów w inspektorze.
 */
export const NON_COMPARABLE_METRICS: ReadonlySet<MapMode | ChangeMetric> = new Set([
  "trade",
] as const);
export interface ModeContext {
  readonly baseline?: WorldSnapshot;
  readonly resourceId: string;
  readonly discoveryId: string;
  readonly changeMetric?: ChangeMetric;
}
function changeValue(
  r: WorldRegionView,
  world: WorldSnapshot,
  ctx: ModeContext,
): number | undefined {
  switch (ctx.changeMetric ?? "population") {
    case "population":
      return r.population;
    case "production":
      return r.production;
    case "resources":
      return MODE_METRICS.resources(r, world, ctx);
    case "trade":
      return undefined; // brak wspólnej miary dla różnych towarów (R4B)
    case "infrastructure":
      return r.infrastructure;
    case "technology":
      return MODE_METRICS.technology(r, world, ctx);
    case "settlements":
      return r.settlements.length;
  }
}
/** Presentation-only selectors over read models; each mode declares its actual metric. */
export const MODE_METRICS: Record<
  MapMode,
  (r: WorldRegionView, world: WorldSnapshot, ctx: ModeContext) => number | undefined
> = {
  terrain: () => undefined,
  political: () => undefined,
  // R4: skala populacji regionu (nie zmiana -- ta należy do trybu Δ Change);
  // brak danych → undefined, znane zero → 0 (zero ≠ brak danych, §28.5).
  population: (r) => {
    const fact = regionPopulationFact(r);
    return fact.kind === "known" ? fact.value : undefined;
  },
  economy: (r) => r.production,
  resources: (r, _w, ctx) => {
    const deposits = r.deposits.filter(
      (d) => d.resourceDefinitionId === ctx.resourceId && d.quantity !== undefined,
    );
    return deposits.length
      ? deposits.reduce((sum, d) => sum + d.quantity!, 0)
      : undefined;
  },
  // R4B: brak wspólnej miary -- suma ilości różnych towarów nie jest pokazywana.
  trade: () => undefined,
  technology: (r, _w, ctx) =>
    r.technology?.discoveries[ctx.discoveryId]?.industryAdoption,
  development: (r) => r.infrastructure,
  stability: (r) => (r.settlements.length ? r.housingPressure : undefined),
  change: (r, w, ctx) => {
    const baseline = ctx.baseline;
    const before = baseline?.regions.find((b) => b.regionId === r.regionId);
    if (!before || !baseline) return undefined;
    const a = changeValue(before, baseline, ctx),
      b = changeValue(r, w, ctx);
    return a === undefined || b === undefined ? undefined : b - a;
  },
};

/** Stable diagram coordinates, never physical geography/distances. M22 supplies geometry later. */
export function atlasPositions(
  world: WorldSnapshot,
): ReadonlyMap<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const regions = [...world.regions].sort((a, b) => a.regionId.localeCompare(b.regionId));
  const cols = Math.ceil(Math.sqrt(regions.length * 1.5));
  regions.forEach((r, i) =>
    positions.set(r.regionId, {
      x: 130 + (i % cols) * (680 / Math.max(1, cols - 1)),
      y:
        145 +
        Math.floor(i / cols) * (320 / Math.max(1, Math.ceil(regions.length / cols) - 1)) +
        (i % 2) * 35,
    }),
  );
  return positions;
}

export interface AtlasBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}
export interface AtlasInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}
/**
 * Auto-fit diagramu (UI Impl Spec v1.4 §L.3): skala i środek wolnego prostokąta
 * płótna po odjęciu obszarów zajętych przez nakładki (podpis, legenda, zoom).
 * Czysta prezentacja -- nie zmienia pozycji regionów ani danych.
 */
export function fitAtlas(
  bounds: AtlasBounds,
  size: { readonly width: number; readonly height: number },
  insets: AtlasInsets,
  maxScale: number,
): { scale: number; centerX: number; centerY: number } {
  const width = Math.max(1, size.width - insets.left - insets.right);
  const height = Math.max(1, size.height - insets.top - insets.bottom);
  return {
    scale: Math.max(
      0.05,
      Math.min(
        maxScale,
        width / Math.max(1, bounds.maxX - bounds.minX),
        height / Math.max(1, bounds.maxY - bounds.minY),
      ),
    ),
    centerX: insets.left + width / 2,
    centerY: insets.top + height / 2,
  };
}
