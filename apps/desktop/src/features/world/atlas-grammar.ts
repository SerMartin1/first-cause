import type {
  RegionVisualIndustry,
  RegionVisualProfile,
  WorldConnectionView,
  WorldSnapshot,
} from "@first-cause/simulation";
import type {
  GlyphState,
  GroundTone,
  IndustryScaleRank,
  RouteStyleFamily,
  TerrainTexture,
} from "./visual-alphabet.js";

/**
 * M21-VIS-R2 --- Visual Grammar Living Atlasu. Czysta funkcja:
 * `WorldSnapshot (Read Model + RegionVisualProfile v2) -> AtlasGrammar`,
 * bez PixiJS, locale, RNG i mutacji. Renderer (`FCLivingAtlas`) tylko
 * rysuje wynik; legenda pokazuje wyłącznie klasy obecne w wyniku.
 *
 * Warstwy (Atlas Spec v1.3 §12A, priorytet §27.2
 * `SIMULATION DATA > CIVILIZATION > GEOGRAPHY`):
 *   geography    -- pole regionu: ton gruntu, rzeźba, roślinność, woda,
 *   civilization -- trasy NA KRAWĘDZIACH (§28.6), osady (R3), znaki
 *                   `industry[]` / `extraction[]`, znane zasoby,
 *   data         -- Map Mode / flows / wydarzenia (bez zmian w R2; R4).
 *
 * Świat nie jest tu „nodes + edges”: każdy region niesie kilka
 * nakładających się systemów naraz, a połączenie -- własną infrastrukturę.
 */
export type AtlasSemanticZoom = "WORLD" | "REGION" | "LOCAL";

/**
 * Design System v1.4 §69 / Atlas Spec §13 (`WORLD → REGION → LOCAL`).
 * TODO tuning: progi zoomu i budżet czytelności liczby regionów.
 */
export const SEMANTIC_ZOOM = {
  worldBelowZoom: 0.8,
  localFromZoom: 1.6,
  worldAboveRegionCount: 40,
} as const;

/** TODO tuning: budżety znaków na region (unikanie „icon soup”, §9.4, §69). */
export const GLYPH_BUDGET: Readonly<
  Record<
    Exclude<AtlasSemanticZoom, "WORLD">,
    { industry: number; extraction: number; resources: number }
  >
> = {
  REGION: { industry: 4, extraction: 3, resources: 3 },
  LOCAL: { industry: 10, extraction: 8, resources: 8 },
};

export function semanticZoom(zoomLevel: number, regionCount: number): AtlasSemanticZoom {
  if (
    zoomLevel < SEMANTIC_ZOOM.worldBelowZoom ||
    regionCount > SEMANTIC_ZOOM.worldAboveRegionCount
  )
    return "WORLD";
  return zoomLevel >= SEMANTIC_ZOOM.localFromZoom ? "LOCAL" : "REGION";
}

export type AtlasGlyph =
  | {
      readonly cls: "industry";
      readonly key: string;
      readonly sector: string | undefined;
      readonly scale: IndustryScaleRank;
      readonly state: GlyphState;
    }
  | {
      readonly cls: "extraction";
      readonly key: string;
      readonly family: string | undefined;
      readonly state: GlyphState;
      /** Tylko LOCAL, złoża skończone: pozostała część zasobu 0..1 (§9.4 intensywność bez normalizacji). */
      readonly reserveRatio: number | undefined;
    }
  | {
      readonly cls: "resource";
      readonly key: string;
      readonly resourceDefinitionId: string;
      readonly renewable: boolean;
      readonly highlighted: boolean;
    }
  | {
      readonly cls: "aggregate";
      readonly key: string;
      readonly of: "industry" | "extraction";
      readonly count: number;
      readonly state: GlyphState;
    };

export interface RegionGrammar {
  readonly regionId: string;
  readonly terrain: TerrainTexture;
  readonly seed: number;
  /** Rząd 1: działalność gospodarcza; rząd 2: wydobycie + znane zasoby. */
  readonly rows: readonly (readonly AtlasGlyph[])[];
  /** Pozycje pominięte przez budżet (pokazywane jako „+n”, nigdy po cichu). */
  readonly overflow: number;
}

export interface EdgeStroke {
  readonly family: RouteStyleFamily;
}

export interface EdgeGrammar {
  readonly connectionId: string;
  readonly from: string;
  readonly to: string;
  readonly level: number;
  readonly strokes: readonly EdgeStroke[];
  readonly disrupted: boolean;
}

export type LegendEntry =
  | { readonly cls: "industry"; readonly sector: string | undefined }
  | { readonly cls: "extraction"; readonly family: string | undefined }
  | { readonly cls: "resource"; readonly renewable: boolean }
  | { readonly cls: "route"; readonly family: RouteStyleFamily }
  | { readonly cls: "state"; readonly state: GlyphState };

export interface AtlasGrammar {
  readonly zoom: AtlasSemanticZoom;
  readonly regions: readonly RegionGrammar[];
  readonly edges: readonly EdgeGrammar[];
  readonly legend: readonly LegendEntry[];
}

export interface AtlasGrammarOptions {
  readonly zoomLevel: number;
  /** Overlay `resources` lub tryb Resources (§15: złoża to overlay, nie stała warstwa). */
  readonly showResources: boolean;
  readonly highlightResourceId?: string;
}

const SCALE_RANK: Readonly<
  Record<NonNullable<RegionVisualIndustry["scale"]>, IndustryScaleRank>
> = {
  workshop: 1,
  manufactory: 2,
  factory: 3,
  large_plant: 4,
  industrial_complex: 5,
};

/** Priorytet stanu przy budżecie: bieżąca działalność przed historyczną. */
const STATE_PRIORITY: Readonly<Record<GlyphState, number>> = {
  stressed: 0,
  active: 1,
  idle: 2,
  known: 3,
  closed: 4,
  depleted: 5,
};

const ROUTE_ORDER: readonly RouteStyleFamily[] = [
  "rail",
  "road",
  "path",
  "waterway",
  "sea_lane",
  "unclassified",
];
const KNOWN_ROUTE_FAMILIES: ReadonlySet<string> = new Set(ROUTE_ORDER);

export function terrainTexture(profile: RegionVisualProfile): TerrainTexture {
  const ground: GroundTone =
    profile.terrain === "desert" || profile.climate === "arid"
      ? "dry"
      : profile.climate === "cold"
        ? "cold"
        : profile.terrain === "wetland"
          ? "wet"
          : profile.fertility === "fertile"
            ? "fertile"
            : "plain";
  return {
    ground,
    relief:
      profile.terrain === "mountains"
        ? "mountains"
        : profile.terrain === "hills"
          ? "hills"
          : "none",
    vegetation: profile.vegetation,
    water: profile.water,
    marsh: profile.terrain === "wetland",
    desert: profile.terrain === "desert",
  };
}

function worstFirst(states: readonly GlyphState[]): GlyphState {
  return [...states].sort((a, b) => STATE_PRIORITY[a] - STATE_PRIORITY[b])[0] ?? "known";
}

function regionGrammar(
  profile: RegionVisualProfile,
  zoom: AtlasSemanticZoom,
  options: AtlasGrammarOptions,
): RegionGrammar {
  const industry = [...(profile.industry ?? [])].sort(
    (a, b) =>
      STATE_PRIORITY[a.state] - STATE_PRIORITY[b.state] ||
      b.employees - a.employees ||
      a.sector.localeCompare(b.sector),
  );
  const extraction = [...profile.extraction].sort(
    (a, b) =>
      STATE_PRIORITY[a.state] - STATE_PRIORITY[b.state] ||
      b.rate - a.rate ||
      a.depositId.localeCompare(b.depositId),
  );
  const resources = options.showResources
    ? profile.resources.filter((r) => !r.extracted)
    : [];
  const resourceGlyphs: AtlasGlyph[] = resources.map((r) => ({
    cls: "resource",
    key: `resource:${r.resourceDefinitionId}`,
    resourceDefinitionId: r.resourceDefinitionId,
    renewable: r.renewable,
    highlighted: r.resourceDefinitionId === options.highlightResourceId,
  }));
  const base = {
    regionId: profile.regionId,
    terrain: terrainTexture(profile),
    seed: profile.vignetteSeed,
  };

  if (zoom === "WORLD") {
    // §28.4 / §4A.3: na WORLD jeden znak zagregowany na klasę -- obecność
    // przemysłu i wydobycia czytelna bez zbliżenia, bez rozbicia na sektory.
    const activeIndustry = industry.filter((i) => i.activeCompanies > 0);
    const liveExtraction = extraction.filter((e) => e.state !== "depleted");
    const row: AtlasGlyph[] = [];
    if (industry.length)
      row.push({
        cls: "aggregate",
        key: "aggregate:industry",
        of: "industry",
        count: activeIndustry.length || industry.length,
        state: worstFirst(industry.map((i) => i.state)),
      });
    if (extraction.length)
      row.push({
        cls: "aggregate",
        key: "aggregate:extraction",
        of: "extraction",
        count: liveExtraction.length || extraction.length,
        state: worstFirst(extraction.map((e) => e.state)),
      });
    return { ...base, rows: row.length ? [row] : [], overflow: 0 };
  }

  const budget = GLYPH_BUDGET[zoom];
  const industryRow: AtlasGlyph[] = industry.slice(0, budget.industry).map((i) => ({
    cls: "industry",
    key: `industry:${i.sector}`,
    sector: i.sector,
    scale: i.scale ? SCALE_RANK[i.scale] : 3,
    state: i.state,
  }));
  const extractionRow: AtlasGlyph[] = [
    ...extraction.slice(0, budget.extraction).map((e): AtlasGlyph => ({
      cls: "extraction",
      key: `extraction:${e.depositId}`,
      family: e.family,
      state: e.state,
      reserveRatio: zoom === "LOCAL" ? e.reserveRatio : undefined,
    })),
    ...resourceGlyphs.slice(0, budget.resources),
  ];
  const overflow =
    Math.max(0, industry.length - budget.industry) +
    Math.max(0, extraction.length - budget.extraction) +
    Math.max(0, resourceGlyphs.length - budget.resources);
  return {
    ...base,
    rows: [industryRow, extractionRow].filter((row) => row.length > 0),
    overflow,
  };
}

function edgeGrammar(
  connection: WorldConnectionView,
  zoom: AtlasSemanticZoom,
): EdgeGrammar {
  const families = connection.routes.map((route): RouteStyleFamily =>
    route.family && KNOWN_ROUTE_FAMILIES.has(route.family)
      ? (route.family as RouteStyleFamily)
      : "unclassified",
  );
  const ordered = [...new Set(families)].sort(
    (a, b) => ROUTE_ORDER.indexOf(a) - ROUTE_ORDER.indexOf(b),
  );
  // WORLD: tylko główna trasa połączenia (drugorzędne ukryte, §69.4).
  const strokes: EdgeStroke[] = (
    ordered.length === 0
      ? (["none"] as const)
      : zoom === "WORLD"
        ? ordered.slice(0, 1)
        : ordered
  ).map((family) => ({ family }));
  return {
    connectionId: connection.id,
    from: connection.from,
    to: connection.to,
    level: connection.level,
    strokes,
    disrupted: connection.disrupted,
  };
}

function legendKey(entry: LegendEntry): string {
  switch (entry.cls) {
    case "industry":
      return `i:${entry.sector ?? ""}`;
    case "extraction":
      return `e:${entry.family ?? ""}`;
    case "resource":
      return `r:${String(entry.renewable)}`;
    case "route":
      return `t:${entry.family}`;
    case "state":
      return `s:${entry.state}`;
  }
}

export function buildAtlasGrammar(
  snapshot: WorldSnapshot,
  options: AtlasGrammarOptions,
): AtlasGrammar {
  const zoom = semanticZoom(options.zoomLevel, snapshot.regions.length);
  const regions = snapshot.regions.map((r) => regionGrammar(r.profile, zoom, options));
  const edges = snapshot.connections.map((c) => edgeGrammar(c, zoom));
  const legend = new Map<string, LegendEntry>();
  const add = (entry: LegendEntry) => legend.set(legendKey(entry), entry);
  for (const region of regions)
    for (const glyph of region.rows.flat()) {
      if (glyph.cls === "industry") add({ cls: "industry", sector: glyph.sector });
      if (glyph.cls === "extraction") add({ cls: "extraction", family: glyph.family });
      if (glyph.cls === "aggregate")
        add(
          glyph.of === "industry"
            ? { cls: "industry", sector: undefined }
            : { cls: "extraction", family: undefined },
        );
      if (glyph.cls === "resource") add({ cls: "resource", renewable: glyph.renewable });
      if (glyph.cls !== "resource" && glyph.state !== "active")
        add({ cls: "state", state: glyph.state });
    }
  for (const edge of edges)
    for (const stroke of edge.strokes) add({ cls: "route", family: stroke.family });
  const order = ["industry", "extraction", "resource", "route", "state"];
  return {
    zoom,
    regions,
    edges,
    legend: [...legend.entries()]
      .sort(
        (a, b) =>
          order.indexOf(a[1].cls) - order.indexOf(b[1].cls) || a[0].localeCompare(b[0]),
      )
      .map(([, entry]) => entry),
  };
}
