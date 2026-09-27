import type { Graphics } from "pixi.js";
import { fnv1a32 } from "@first-cause/simulation";

/*
 * M21-VIS-R2 --- Visual Alphabet Atlasu jako dane (Atlas Spec v1.3 §4A,
 * §9, §10, §27.3). Każdy znak to lista prymitywów geometrycznych w
 * układzie 12×12 jednostek wokół (0,0); ten sam opis rysuje renderer
 * PixiJS (`drawPrimitives`) i legenda SVG (`FCAtlasGlyph`), więc legenda
 * zawsze pokazuje dokładnie ten znak, który jest na mapie. Kolor to
 * wyłącznie nazwa atramentu mapowana na token Design Systemu -- żadnych
 * literałów kolorów poza `tokens.css`.
 */
export type Ink =
  | "ink"
  | "muted"
  | "warning"
  | "negative"
  | "water"
  | "waterFill"
  | "vegetation"
  | "relief"
  | "groundPlain"
  | "groundFertile"
  | "groundDry"
  | "groundCold"
  | "groundWet"
  | "urban"
  | "urbanEdge";

export const INK_TOKEN: Readonly<Record<Ink, string>> = {
  ink: "--fc-text-secondary",
  muted: "--fc-text-muted",
  warning: "--fc-warning",
  negative: "--fc-negative",
  water: "--fc-atlas-water",
  waterFill: "--fc-atlas-water-fill",
  vegetation: "--fc-atlas-vegetation",
  relief: "--fc-atlas-relief",
  groundPlain: "--fc-atlas-ground",
  groundFertile: "--fc-atlas-ground-fertile",
  groundDry: "--fc-atlas-ground-dry",
  groundCold: "--fc-atlas-ground-cold",
  groundWet: "--fc-atlas-ground-wet",
  urban: "--fc-atlas-urban",
  urbanEdge: "--fc-atlas-urban-edge",
};

export type Primitive =
  | {
      readonly kind: "poly";
      readonly points: readonly number[];
      readonly closed?: boolean;
      readonly fill?: Ink;
      readonly stroke?: Ink;
      readonly width?: number;
      readonly alpha?: number;
      readonly dash?: readonly [number, number];
    }
  | {
      readonly kind: "circle";
      readonly x: number;
      readonly y: number;
      readonly r: number;
      readonly fill?: Ink;
      readonly stroke?: Ink;
      readonly width?: number;
      readonly alpha?: number;
    };

/** Wspólny modyfikator stanu (Atlas Spec §4A.5): stan zmienia znak bazowy, nie tworzy osobnego stylu. */
export type GlyphState = "active" | "idle" | "stressed" | "closed" | "depleted" | "known";

const line = (points: number[], stroke: Ink = "ink", width = 1.2): Primitive => ({
  kind: "poly",
  points,
  stroke,
  width,
});

/** Znak bazowy przemysłu: hala o dachu szedowym (§4A.4 BASE INDUSTRY SYMBOL). */
const INDUSTRY_BASE = [-6, 6, -6, -1, -3, -4, -3, -1, 0, -4, 0, -1, 3, -4, 3, 6];

/**
 * Modyfikator specjalizacji per sektor contentu (§4A.4 SPECIALIZATION
 * MODIFIER, sylwetki §10.2). Tabela prezentacyjna rozszerzalna o nowe
 * sektory; nieznany sektor dostaje znak bazowy bez modyfikatora --
 * nigdy gałąź per firmę/region (AGENTS.md reguła 8).
 */
const SECTOR_MODIFIER: Readonly<Record<string, (ink: Ink) => Primitive[]>> = {
  // Silos (§10.2 Food / farm: silosy, magazyny).
  agriculture: (ink) => [
    {
      kind: "poly",
      points: [3.5, 6, 3.5, -5, 6, -5, 6, 6],
      closed: true,
      stroke: ink,
      width: 1.1,
    },
    { kind: "circle", x: 4.75, y: -5, r: 1.25, stroke: ink, width: 1.1 },
  ],
  // Koło młyńskie (§10.2 Food Processing).
  food_processing: (ink) => [
    { kind: "circle", x: 4.7, y: -3.5, r: 2.2, stroke: ink, width: 1.1 },
  ],
  // Wysoki komin (§10.2 Metallurgy: piece, kominy).
  metallurgy: (ink) => [
    { kind: "poly", points: [3.6, 6, 3.6, -8, 5.6, -8, 5.6, 6], closed: true, fill: ink },
  ],
  // Wieża szybowa (górnictwo jako sektor gospodarczy).
  mining: (ink) => [line([3.2, 6, 4.8, -6, 6.4, 6], ink, 1.1)],
  quarrying: (ink) => [line([3.2, -1, 3.2, -4, 5, -4, 5, -6, 6.6, -6], ink, 1.1)],
  // Hala montażowa z suwnicą (§10.2 Machinery).
  manufacturing: (ink) => [line([3, -6, 7, -6, 7, 6], ink, 1.1)],
  construction: (ink) => [line([4.5, 6, 4.5, -8, 8, -8], ink, 1.1)],
  // Zygzak energii (§11 Power Generation).
  energy: (ink) => [line([6, -8, 4, -4, 6.5, -4, 4.5, 0], ink, 1.1)],
  // Nabrzeże i suwnica (§10.2 Shipyard).
  shipbuilding: (ink) => [
    line([4.5, 6, 4.5, -7, 8, -7], ink, 1.1),
    line([3, 7.5, 8, 7.5], "water", 1.1),
  ],
  // Stos drewna (§10.2 Wood Processing).
  wood_processing: (ink) => [
    { kind: "circle", x: 4.5, y: 4.5, r: 1.3, stroke: ink, width: 1 },
    { kind: "circle", x: 7, y: 4.5, r: 1.3, stroke: ink, width: 1 },
    { kind: "circle", x: 5.75, y: 2.3, r: 1.3, stroke: ink, width: 1 },
  ],
  // Zbiornik i kolumna (§10.2 Chemicals).
  chemicals: (ink) => [
    { kind: "circle", x: 5, y: 3, r: 2.2, stroke: ink, width: 1.1 },
    line([6.5, 1, 6.5, -7], ink, 1.1),
  ],
  // Długa hala (§10.2 Textiles).
  textiles: (ink) => [
    {
      kind: "poly",
      points: [3, 6, 3, 1, 9, 1, 9, 6],
      closed: true,
      stroke: ink,
      width: 1.1,
    },
  ],
};

export type IndustryScaleRank = 1 | 2 | 3 | 4 | 5;
const SCALE_FACTOR: Readonly<Record<IndustryScaleRank, number>> = {
  1: 0.78,
  2: 0.9,
  3: 1,
  4: 1.14,
  5: 1.28,
};

function scalePrimitive(p: Primitive, k: number, dx = 0, dy = 0): Primitive {
  return p.kind === "circle"
    ? { ...p, x: p.x * k + dx, y: p.y * k + dy, r: p.r * k }
    : { ...p, points: p.points.map((v, i) => v * k + (i % 2 === 0 ? dx : dy)) };
}

/** Wypełnienie zamienione na kontur w atramencie `muted` (znak „wygaszony”, ten sam kształt). */
function outlined(p: Primitive, width: number, alpha?: number): Primitive {
  const { fill, ...rest } = p;
  const stroke: Ink | undefined =
    fill || (p.stroke && p.stroke !== "water") ? "muted" : p.stroke;
  return {
    ...rest,
    ...(stroke ? { stroke } : {}),
    ...(fill ? { width } : {}),
    ...(alpha !== undefined ? { alpha } : {}),
  } as Primitive;
}

/** Modyfikator stanu wspólny dla przemysłu i wydobycia (§4A.5). */
function withState(body: readonly Primitive[], state: GlyphState): Primitive[] {
  if (state === "active" || state === "known") return [...body];
  if (state === "stressed") return [...body, line([-6, 8.5, 6, 8.5], "warning", 1.6)];
  if (state === "idle") return body.map((p) => outlined(p, 1.1));
  // closed / depleted: wygaszony znak + ukośne przekreślenie.
  return [...body.map((p) => outlined(p, 1, 0.6)), line([-7, 7, 7, -7], "muted", 1.2)];
}

export function industryGlyph(
  sector: string | undefined,
  scale: IndustryScaleRank,
  state: GlyphState,
): Primitive[] {
  const body: Primitive[] = [
    { kind: "poly", points: INDUSTRY_BASE, closed: true, fill: "ink" },
    ...(sector ? (SECTOR_MODIFIER[sector]?.("ink") ?? []) : []),
  ];
  // Duży zakład / kompleks: druga hala w tle (§10.3 progresja skali).
  const extra: Primitive[] =
    scale >= 4
      ? [
          {
            kind: "poly",
            points: INDUSTRY_BASE.map((v, i) => v * 0.7 + (i % 2 === 0 ? -5 : 1.5)),
            closed: true,
            stroke: "ink",
            width: 1,
          },
        ]
      : [];
  return withState([...extra, ...body], state).map((p) =>
    scalePrimitive(p, SCALE_FACTOR[scale]),
  );
}

/**
 * Rodziny wydobycia (§9.2 „nie ta sama kopalnia + inny kolor”): każda
 * rodzina ma własną strukturę. Brak rodziny w contencie = znak
 * zagregowany §4A.3 (skrzyżowane narzędzia).
 */
const EXTRACTION_BODY: Readonly<Record<string, Primitive[]>> = {
  shaft_mine: [
    line([-4.5, 6, 0, -4.5, 4.5, 6]),
    line([-2.4, 1, 2.4, 1]),
    { kind: "circle", x: 0, y: -4.5, r: 1.7, stroke: "ink", width: 1.2 },
    line([-6.5, 6, 6.5, 6]),
  ],
  open_pit: [
    line([-6.5, -2, -4, 2, 4, 2, 6.5, -2]),
    line([-3, 2, -1.5, 5.5, 1.5, 5.5, 3, 2]),
    line([-7, -2, 7, -2], "ink", 1),
  ],
  quarry: [
    {
      kind: "poly",
      points: [-6, 6, -6, -5, -2, -5, -2, -1, 2, -1, 2, 3, 6, 3, 6, 6],
      closed: true,
      fill: "ink",
    },
  ],
  cultivation: [
    {
      kind: "poly",
      points: [-6, -5, 6, -5, 6, 5, -6, 5],
      closed: true,
      stroke: "ink",
      width: 1.1,
    },
    line([-6, 1, -2, -5], "ink", 1),
    line([-4, 5, 2, -5], "ink", 1),
    line([0, 5, 6, -5], "ink", 1),
  ],
  logging: [
    { kind: "poly", points: [-6.5, 4, -3.5, -6, -0.5, 4], closed: true, fill: "ink" },
    { kind: "poly", points: [2.5, 4, 2.5, 1, 5, 1, 5, 4], closed: true, fill: "ink" },
    line([0.5, 6.5, 7, 6.5], "ink", 1.6),
  ],
  fishing: [
    line([-6, 0, -4, 4, 4, 4, 6, 0]),
    line([0, 2, 0, -6]),
    line([0, -6, 4, -2, 0, -2], "ink", 1),
  ],
  oil_field: [
    line([-2.5, 6, 0, -1, 2.5, 6]),
    line([-6.5, -3, 6, 1]),
    line([-6.5, -3, -6.5, 2], "ink", 1.6),
  ],
  gas_field: [
    line([0, 6, 0, -2]),
    { kind: "circle", x: 0, y: -4, r: 2, stroke: "ink", width: 1.2 },
    line([-4, 6, 4, 6]),
  ],
  evaporation: [
    {
      kind: "poly",
      points: [-6, -6, -1, -6, -1, -1, -6, -1],
      closed: true,
      stroke: "ink",
      width: 1,
    },
    {
      kind: "poly",
      points: [1, -6, 6, -6, 6, -1, 1, -1],
      closed: true,
      stroke: "ink",
      width: 1,
    },
    {
      kind: "poly",
      points: [-6, 1, -1, 1, -1, 6, -6, 6],
      closed: true,
      stroke: "ink",
      width: 1,
    },
    {
      kind: "poly",
      points: [1, 1, 6, 1, 6, 6, 1, 6],
      closed: true,
      stroke: "ink",
      width: 1,
    },
  ],
};
const EXTRACTION_AGGREGATE: Primitive[] = [
  line([-5, 5, 5, -5], "ink", 1.4),
  line([-5, -5, 5, 5], "ink", 1.4),
  line([2.5, -6.5, 6.5, -2.5], "ink", 1.4),
  line([-6.5, -2.5, -2.5, -6.5], "ink", 1.4),
];

export function extractionGlyph(
  family: string | undefined,
  state: GlyphState,
): Primitive[] {
  return withState((family && EXTRACTION_BODY[family]) || EXTRACTION_AGGREGATE, state);
}

/** Klasy zasobów §4A.2: geologiczne / skończone = trójkąt, odnawialne = okrąg. Mniejsze niż znaki aktywności. */
export function resourceGlyph(renewable: boolean, highlighted: boolean): Primitive[] {
  const fill: Ink | undefined = highlighted ? "ink" : undefined;
  return renewable
    ? [
        {
          kind: "circle",
          x: 0,
          y: 0,
          r: 3.6,
          stroke: "ink",
          width: 1.1,
          ...(fill ? { fill } : {}),
        },
      ]
    : [
        {
          kind: "poly",
          points: [-4, 3.5, 0, -4, 4, 3.5],
          closed: true,
          stroke: "ink",
          width: 1.1,
          ...(fill ? { fill } : {}),
        },
      ];
}

/** Znak zagregowany (WORLD, §28.4): bazowy znak klasy + pipsy liczby pozycji (maks. 4). */
export function aggregateGlyph(
  cls: "industry" | "extraction",
  count: number,
  state: GlyphState,
): Primitive[] {
  const base =
    cls === "industry"
      ? industryGlyph(undefined, 3, state)
      : extractionGlyph(undefined, state);
  const pips: Primitive[] = Array.from(
    { length: Math.min(4, Math.max(0, count - 1)) },
    (_, i) => ({
      kind: "circle",
      x: 8.5,
      y: 5 - i * 3.2,
      r: 1,
      fill: "ink",
    }),
  );
  return [...base, ...pips];
}

/* --- Geografia (§5, §27.3): spokojne, niskokontrastowe znaki tła. ---- */

export type GroundTone = "plain" | "fertile" | "dry" | "cold" | "wet";
export interface TerrainTexture {
  readonly ground: GroundTone;
  readonly relief: "none" | "hills" | "mountains";
  readonly vegetation: "none" | "grassland" | "fields" | "sparse_forest" | "dense_forest";
  readonly water: "none" | "river" | "coast";
  readonly marsh: boolean;
  readonly desert: boolean;
}

const GROUND_INK: Readonly<Record<GroundTone, Ink>> = {
  plain: "groundPlain",
  fertile: "groundFertile",
  dry: "groundDry",
  cold: "groundCold",
  wet: "groundWet",
};

/** Promień pola regionu w jednostkach diagramu (schemat, nie geometria fizyczna -- M22). */
export const REGION_FIELD_RADIUS = 58;

/** Deterministyczne rozrzucenie znaków w górnej/lewej części pola regionu (dół i prawo zajmują osady i znaki aktywności). */
function slots(seed: number, salt: string, count: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const h = fnv1a32(`${salt}:${i}`, seed >>> 0);
    const angle = Math.PI * (0.95 + 1.05 * ((i + (h % 97) / 97) / Math.max(1, count)));
    const radius = REGION_FIELD_RADIUS * (0.42 + ((h >>> 8) % 40) / 100);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

export function terrainPrimitives(texture: TerrainTexture, seed: number): Primitive[] {
  const r = REGION_FIELD_RADIUS;
  const out: Primitive[] = [
    { kind: "circle", x: 0, y: 0, r, fill: GROUND_INK[texture.ground], alpha: 0.75 },
  ];
  if (texture.water === "coast") {
    // Wycinek morza po prawej stronie pola, zamknięty falistą linią brzegową.
    const arc: number[] = [];
    for (let a = -55; a <= 55; a += 11) {
      const t = (a * Math.PI) / 180;
      arc.push(Math.cos(t) * r, Math.sin(t) * r);
    }
    const x0 = Math.cos((55 * Math.PI) / 180) * r,
      y0 = Math.sin((55 * Math.PI) / 180) * r;
    const shore: number[] = [];
    for (let y = y0; y >= -y0; y -= 6)
      shore.push(x0 - 3 + Math.sin(y / 7 + (seed % 5)) * 2.5, y);
    out.push({
      kind: "poly",
      points: [...arc, ...shore],
      closed: true,
      fill: "waterFill",
      alpha: 0.9,
    });
    out.push({ kind: "poly", points: shore, stroke: "water", width: 1.1 });
  }
  if (texture.water === "river") {
    const pts: number[] = [];
    for (let x = -r * 0.92; x <= r * 0.92; x += 8)
      pts.push(x, r * 0.55 + Math.sin(x / 9 + (seed % 7)) * 3);
    out.push({ kind: "poly", points: pts, stroke: "water", width: 1.5 });
  }
  if (texture.relief === "mountains")
    for (const p of slots(seed, "relief", 5))
      out.push({
        kind: "poly",
        points: [p.x - 6, p.y + 4, p.x, p.y - 5, p.x + 6, p.y + 4],
        stroke: "relief",
        width: 1.2,
      });
  if (texture.relief === "hills")
    for (const p of slots(seed, "relief", 4))
      out.push({
        kind: "poly",
        points: [
          p.x - 6,
          p.y + 2,
          p.x - 3,
          p.y - 1.5,
          p.x,
          p.y - 2.5,
          p.x + 3,
          p.y - 1.5,
          p.x + 6,
          p.y + 2,
        ],
        stroke: "relief",
        width: 1.1,
      });
  const trees =
    texture.vegetation === "dense_forest"
      ? 12
      : texture.vegetation === "sparse_forest"
        ? 6
        : 0;
  for (const p of slots(seed, "trees", trees))
    out.push({
      kind: "poly",
      points: [p.x - 2.6, p.y + 2.6, p.x, p.y - 3.4, p.x + 2.6, p.y + 2.6],
      closed: true,
      fill: "vegetation",
      alpha: 0.85,
    });
  if (texture.vegetation === "fields")
    for (const p of slots(seed, "fields", 3))
      for (let k = -1; k <= 1; k++)
        out.push({
          kind: "poly",
          points: [p.x - 5, p.y + k * 2.6, p.x + 5, p.y + k * 2.6],
          stroke: "vegetation",
          width: 0.9,
        });
  if (texture.vegetation === "grassland")
    for (const p of slots(seed, "grass", 5))
      out.push({
        kind: "poly",
        points: [p.x - 1.5, p.y + 1.5, p.x, p.y - 1.5, p.x + 1.5, p.y + 1.5],
        stroke: "vegetation",
        width: 0.9,
      });
  if (texture.marsh)
    for (const p of slots(seed, "marsh", 5))
      out.push({
        kind: "poly",
        points: [p.x - 4, p.y, p.x + 4, p.y],
        stroke: "water",
        width: 1,
      });
  if (texture.desert)
    for (const p of slots(seed, "dunes", 5))
      out.push({
        kind: "poly",
        points: [p.x - 5, p.y + 1, p.x - 1, p.y - 1.5, p.x + 5, p.y + 1],
        stroke: "relief",
        width: 0.9,
      });
  return out;
}

/* --- Trasy na krawędziach (§8, §28.6) --------------------------------- */

export type RouteStyleFamily =
  "path" | "road" | "rail" | "waterway" | "sea_lane" | "unclassified" | "none";
export interface RouteStyle {
  readonly ink: Ink | "border";
  readonly width: number;
  readonly dash?: readonly [number, number];
  /** Przesunięcie równoległe względem osi połączenia (trasy wodne obok lądowych). */
  readonly offset: number;
  readonly ties?: boolean;
  readonly alpha?: number;
}

/** `level` = `Connection.infrastructure.level` -- grubość dróg rośnie z poziomem (TODO tuning: 0.35/poziom, maks. 3). */
export function routeStyle(family: RouteStyleFamily, level: number): RouteStyle {
  const roadWidth = Math.min(3, 1 + 0.35 * Math.max(0, level - 1));
  switch (family) {
    case "path":
      return { ink: "ink", width: 1, dash: [4, 3], offset: 0 };
    case "road":
      return { ink: "ink", width: roadWidth, offset: 0 };
    case "rail":
      return { ink: "ink", width: 1.2, offset: -4, ties: true };
    case "waterway":
      return { ink: "water", width: 1.6, offset: 4 };
    case "sea_lane":
      return { ink: "water", width: 1.2, dash: [2, 4], offset: 4 };
    case "unclassified":
      return { ink: "border", width: 0.9, offset: 0 };
    case "none":
      return { ink: "border", width: 0.8, dash: [1.5, 4.5], offset: 0, alpha: 0.8 };
  }
}

/** Odcinek (a→b) przesunięty równolegle, z przerywaniem i podkładami toru -- jako prymitywy. */
export function routePrimitives(
  a: { x: number; y: number },
  b: { x: number; y: number },
  style: RouteStyle,
  ink: Ink,
): Primitive[] {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length,
    ny = dx / length;
  const ax = a.x + nx * style.offset,
    ay = a.y + ny * style.offset;
  const ux = dx / length,
    uy = dy / length;
  const base = {
    stroke: ink,
    width: style.width,
    ...(style.alpha ? { alpha: style.alpha } : {}),
  };
  const out: Primitive[] = [];
  if (!style.dash)
    out.push({ kind: "poly", points: [ax, ay, ax + dx, ay + dy], ...base });
  else {
    const [on, off] = style.dash;
    for (let t = 0; t < length; t += on + off) {
      const e = Math.min(length, t + on);
      out.push({
        kind: "poly",
        points: [ax + ux * t, ay + uy * t, ax + ux * e, ay + uy * e],
        ...base,
      });
    }
  }
  if (style.ties)
    for (let t = 6; t < length - 3; t += 9)
      out.push({
        kind: "poly",
        points: [
          ax + ux * t - nx * 2.6,
          ay + uy * t - ny * 2.6,
          ax + ux * t + nx * 2.6,
          ay + uy * t + ny * 2.6,
        ],
        stroke: ink,
        width: 1,
      });
  return out;
}

/* --- Renderery prymitywów -------------------------------------------- */

export function drawPrimitives(
  g: Graphics,
  primitives: readonly Primitive[],
  color: (ink: Ink) => string,
  opts: {
    readonly dx?: number;
    readonly dy?: number;
    readonly k?: number;
    readonly alpha?: number;
  } = {},
): void {
  const k = opts.k ?? 1,
    dx = opts.dx ?? 0,
    dy = opts.dy ?? 0,
    alpha = opts.alpha ?? 1;
  for (const p of primitives) {
    const a = (p.alpha ?? 1) * alpha;
    if (p.kind === "circle") g.circle(dx + p.x * k, dy + p.y * k, p.r * k);
    else {
      const pts = p.points.map((v, i) => (i % 2 === 0 ? dx : dy) + v * k);
      if (p.closed) g.poly(pts, true);
      else {
        g.moveTo(pts[0]!, pts[1]!);
        for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]!, pts[i + 1]!);
      }
    }
    if (p.fill) g.fill({ color: color(p.fill), alpha: a });
    if (p.stroke && (p.width ?? 1) > 0)
      g.stroke({ color: color(p.stroke), width: (p.width ?? 1) * k, alpha: a });
  }
}
