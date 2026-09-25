import type { WorldRegionView, WorldSnapshot } from "@first-cause/simulation";

export const MAP_MODES = [
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
export const MARKER_SCALE = {
  minRadius: 5,
  maxRadius: 36,
  referencePopulation: 100_000,
  exponent: 0.5,
};
export function populationRadius(population: number, config = MARKER_SCALE): number {
  const scaled = Math.pow(
    Math.max(0, Number.isFinite(population) ? population : 0) /
      config.referencePopulation,
    config.exponent,
  );
  return Math.min(
    config.maxRadius,
    config.minRadius + (config.maxRadius - config.minRadius) * scaled,
  );
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
      return MODE_METRICS.trade(r, world, ctx);
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
  political: () => undefined,
  population: (r, _w, ctx) => {
    const before = ctx.baseline?.regions.find(
      (b) => b.regionId === r.regionId,
    )?.population;
    return before === undefined ? undefined : r.population - before;
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
  trade: (r, world) =>
    world.flows
      .filter(
        (f) => f.family === "trade" && (f.from === r.regionId || f.to === r.regionId),
      )
      .reduce((sum, f) => sum + f.magnitude, 0),
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
