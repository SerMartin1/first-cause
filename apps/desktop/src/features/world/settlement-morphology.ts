import { fnv1a32 } from "@first-cause/simulation";
import type { Primitive } from "./visual-alphabet.js";

/*
 * M21-VIS-R3 --- morfologia osad (Atlas Spec v1.3 §4A.1, §28.2, §28.3).
 *
 * Populacja zmienia STRUKTURĘ znaku, a nie tylko jego rozmiar: od kilku
 * śladów zabudowy, przez zabudowę wzdłuż drogi, rdzeń z zabudową wokół,
 * dzielnice, aż po wielocentryczny organizm. Znak jest symboliczny (to nie
 * jest plan miasta) i złożony z małego, autorskiego zestawu prymitywów:
 *
 *   plot    -- ślad zabudowy (mały prostokąt, stały rozmiar),
 *   quarter -- zwarte skupisko kilku śladów (dzielnica / gęsta zabudowa),
 *   lane    -- oś komunikacyjna (łamana, nigdy przez środek osady),
 *   built   -- obszar zabudowy: kanciaste płaty jednym kryjącym odcieniem,
 *              z konturem tylko po zewnętrznej krawędzi sumy płatów,
 *   core    -- rdzeń (pełny kanciasty wielokąt).
 *
 * Czysta prezentacja: bez PixiJS, bez locale, bez `Math.random()`. Wariant
 * wynika ze stabilnego hasha id osady (3 autorskie układy × lustro), więc
 * ta sama osada zawsze wygląda tak samo, a wygląd nigdy nie wpływa na
 * symulację (renderer jest konsumentem Read Modelu).
 */

/** Klasy morfologii -- grupy kategorii kanonicznych §4A.1 (granice identyczne z kanonem). */
export const MORPHOLOGY_CLASSES = [
  "hamlet", // Hamlet < 500
  "village", // Village, Large Village: 500 -- 5k
  "town", // Small Town, Town, Large Town: 5k -- 50k
  "city", // Small City, City, Large City: 50k -- 500k
  "metropolis", // Major City, Metropolis, Major Metropolis: 500k -- 5M
  "megacity", // Megacity, Global Megacity: 5M+
] as const;
export type MorphologyClass = (typeof MORPHOLOGY_CLASSES)[number];

/** Dolne granice klas (Atlas Spec §4A.1). */
export const MORPHOLOGY_CLASS_FLOOR: Readonly<Record<MorphologyClass, number>> = {
  hamlet: 0,
  village: 500,
  town: 5_000,
  city: 50_000,
  metropolis: 500_000,
  megacity: 5_000_000,
};

/** Reprezentatywna populacja klasy (próbka legendy). */
export const MORPHOLOGY_CLASS_SAMPLE: Readonly<Record<MorphologyClass, number>> = {
  hamlet: 100,
  village: 1_000,
  town: 10_000,
  city: 100_000,
  metropolis: 1_000_000,
  megacity: 10_000_000,
};

/** Poziom szczegółu z semantic zoom (§13): WORLD upraszcza, LOCAL dokłada zabudowę -- klasa się nie zmienia. */
export type MorphologyDetail = "WORLD" | "REGION" | "LOCAL";

function safePopulation(population: number): number {
  return Number.isFinite(population) && population > 0 ? population : 0;
}

export function morphologyClass(population: number): MorphologyClass {
  const p = safePopulation(population);
  let cls: MorphologyClass = "hamlet";
  for (const candidate of MORPHOLOGY_CLASSES)
    if (p >= MORPHOLOGY_CLASS_FLOOR[candidate]) cls = candidate;
  return cls;
}

/**
 * Populacja → promień śladu osady w jednostkach diagramu (§28.3): odcinkowo
 * liniowo po log10 populacji, z górnym limitem. Punkty kontrolne dobrane pod
 * czytelność (TODO tuning), nie pod elegancję wzoru:
 *
 *   10 → 3.5 · 100 → 5.5 · 1k → 8.5 · 10k → 12.5 · 100k → 17.5 · 1M → 23 ·
 *   10M → 30 · ≥100M → 33 (limit)
 *
 * Kompresja: 10M to ×8.6 promienia względem 10, nie ×1000. 10M zajmuje ~27%,
 * a limit (33) ~32% powierzchni pola regionu (`REGION_FIELD_RADIUS` = 58), więc
 * megacity nie zasłania regionu, przemysłu ani wydobycia. Rozróżnienie klas
 * niesie przede wszystkim morfologia, nie rozmiar.
 */
export const FOOTPRINT_CONTROL_POINTS: readonly (readonly [number, number])[] = [
  [1, 3.5],
  [2, 5.5],
  [3, 8.5],
  [4, 12.5],
  [5, 17.5],
  [6, 23],
  [7, 30],
  [8, 33],
];

export function settlementFootprint(population: number): number {
  const points = FOOTPRINT_CONTROL_POINTS;
  const log = Math.log10(Math.max(1, safePopulation(population)));
  if (log <= points[0]![0]) return points[0]![1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    const [x0, y0] = points[i - 1]!;
    if (log <= x1) return y0 + ((y1 - y0) * (log - x0)) / (x1 - x0);
  }
  return points[points.length - 1]![1];
}

/** Położenie populacji wewnątrz klasy na skali log (0..1) -- „klasowo-ciągła” morfologia. */
export function classProgress(population: number): number {
  const p = Math.max(1, safePopulation(population));
  const cls = morphologyClass(p);
  const index = MORPHOLOGY_CLASSES.indexOf(cls);
  const floor = Math.max(10, MORPHOLOGY_CLASS_FLOOR[cls]);
  const next = MORPHOLOGY_CLASSES[index + 1];
  const ceiling = next ? MORPHOLOGY_CLASS_FLOOR[next] : 100_000_000;
  return Math.max(
    0,
    Math.min(
      1,
      (Math.log10(p) - Math.log10(floor)) / (Math.log10(ceiling) - Math.log10(floor)),
    ),
  );
}

export interface MorphologyVariant {
  /** 0..2 -- jeden z trzech autorskich układów klasy. */
  readonly index: 0 | 1 | 2;
  readonly mirror: boolean;
}

/** Stabilny wariant z id osady (hash, nie RNG) -- ta sama osada zawsze ma ten sam układ. */
export function morphologyVariant(settlementId: string): MorphologyVariant {
  const h = fnv1a32(`settlement-morphology:${settlementId}`);
  return { index: (h % 3) as 0 | 1 | 2, mirror: ((h >>> 8) & 1) === 1 };
}

/* --- Autorskie tabele (ręcznie ustalone, nie szum) ---------------------- */

/** Obrót bazowy wariantu (rad) -- układ nigdy nie jest „wyprostowany” do osi. */
const VARIANT_ROTATION = [0.35, -0.55, 1.2] as const;

/** Kanciaste obrysy (9 wierzchołków, promień względny) -- asymetryczne. */
const OUTLINES: readonly (readonly number[])[] = [
  [1, 0.78, 0.93, 0.66, 0.88, 1.04, 0.74, 0.86, 0.95],
  [0.92, 1.02, 0.7, 0.84, 0.97, 0.72, 0.9, 1.05, 0.8],
  [0.85, 0.96, 1.03, 0.76, 0.69, 0.92, 1, 0.81, 0.9],
];

/** Kierunki osi komunikacyjnych (rad) -- nieregularne odstępy kątowe. */
const LANE_ANGLES: readonly (readonly number[])[] = [
  [0.2, 2.35, 4.05, 5.3, 1.25],
  [0.9, 2.8, 4.6, 5.75, 3.7],
  [-0.4, 1.7, 3.3, 4.85, 2.55],
];
/** Długość osi (względem R) i załamanie (rad) -- żadne dwie osie nie są takie same. */
const LANE_REACH = [1, 0.78, 0.9, 0.7, 0.85] as const;
const LANE_BEND = [0.22, -0.3, 0.14, -0.18, 0.26] as const;

/** Rozrzut śladów przysiółka (jednostki diagramu). */
const HAMLET_MARKS: readonly (readonly (readonly [number, number])[])[] = [
  [
    [0, 0],
    [2.9, 1.2],
    [-2.4, 2],
    [1.1, -2.7],
  ],
  [
    [0, 0],
    [-2.8, 0.9],
    [1.9, 2.4],
    [2.5, -1.8],
  ],
  [
    [0, 0],
    [2.7, -1],
    [-1.4, 2.6],
    [-2.6, -1.7],
  ],
];

/** Układ skupiska (dzielnicy): przesunięcia śladów względem środka i ich obrót. */
const QUARTER: readonly (readonly [number, number, number])[] = [
  [0, 0, 0.1],
  [2.3, 0.4, -0.2],
  [0.6, 2.1, 0.3],
  [-1.9, 1, 0],
  [-0.8, -2, 0.25],
];

/** Rozmiar śladu zabudowy -- stały (skala osady rośnie liczbą śladów, nie ich wielkością). */
const PLOT = 2.1;
/** Ślad w przysiółku / wsi: nieco większy, żeby najmniejsze osady nie ginęły na WORLD (TODO tuning). */
const RURAL_PLOT = 2.5;

/* --- Prymitywy ---------------------------------------------------------- */

interface Frame {
  readonly rotation: number;
  readonly mirror: boolean;
}

function place(frame: Frame, x: number, y: number): [number, number] {
  const mx = frame.mirror ? -x : x;
  const c = Math.cos(frame.rotation),
    s = Math.sin(frame.rotation);
  return [mx * c - y * s, mx * s + y * c];
}

const polar = (angle: number, distance: number): [number, number] => [
  Math.cos(angle) * distance,
  Math.sin(angle) * distance,
];

function plot(frame: Frame, x: number, y: number, angle: number, size = PLOT): Primitive {
  const [cx, cy] = place(frame, x, y);
  const a = angle + frame.rotation;
  const c = Math.cos(a),
    s = Math.sin(a);
  const w = size / 2,
    h = (size * 0.68) / 2;
  const corner = (dx: number, dy: number) => [cx + dx * c - dy * s, cy + dx * s + dy * c];
  return {
    kind: "poly",
    points: [...corner(-w, -h), ...corner(w, -h), ...corner(w, h), ...corner(-w, h)],
    closed: true,
    fill: "ink",
  };
}

function quarter(
  frame: Frame,
  x: number,
  y: number,
  count: number,
  angle: number,
): Primitive[] {
  return QUARTER.slice(0, count).map(([dx, dy, a]) =>
    plot(frame, x + dx, y + dy, angle + a, PLOT * 0.9),
  );
}

function outline(
  frame: Frame,
  cx: number,
  cy: number,
  radius: number,
  table: readonly number[],
  twist: number,
): number[] {
  const points: number[] = [];
  table.forEach((k, i) => {
    const a = twist + (i / table.length) * Math.PI * 2;
    points.push(
      ...place(frame, cx + Math.cos(a) * radius * k, cy + Math.sin(a) * radius * k),
    );
  });
  return points;
}

interface Lobe {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly table: readonly number[];
  readonly twist: number;
}

/**
 * Obszar zabudowy z kilku płatów: najpierw kontur każdego płata, potem
 * kryjące wypełnienia -- wnętrza konturów zostają przykryte, więc widać
 * wyłącznie zewnętrzną krawędź sumy (jedna czytelna sylwetka, bez
 * nakładających się półprzezroczystych warstw).
 */
function builtArea(frame: Frame, lobes: readonly Lobe[]): Primitive[] {
  const polys = lobes.map((l) => outline(frame, l.x, l.y, l.r, l.table, l.twist));
  return [
    ...polys.map((points): Primitive => ({
      kind: "poly",
      points,
      closed: true,
      stroke: "urbanEdge",
      width: 1.1,
    })),
    ...polys.map((points): Primitive => ({
      kind: "poly",
      points,
      closed: true,
      fill: "urban",
    })),
  ];
}

function core(
  frame: Frame,
  x: number,
  y: number,
  radius: number,
  table: readonly number[],
  twist: number,
): Primitive {
  return {
    kind: "poly",
    points: outline(frame, x, y, radius, table, twist),
    closed: true,
    fill: "ink",
    alpha: 0.9,
  };
}

/** Łamana oś: od `from` do `to` z autorskim załamaniem -- nigdy prosta szprycha. */
function lane(
  frame: Frame,
  from: readonly [number, number],
  to: readonly [number, number],
  bend: number,
  width = 0.75,
): Primitive {
  const mx = (from[0] + to[0]) / 2,
    my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0],
    dy = to[1] - from[1];
  const mid: [number, number] = [mx - dy * bend, my + dx * bend];
  return {
    kind: "poly",
    points: [from, mid, to].flatMap(([x, y]) => place(frame, x, y)),
    stroke: "ink",
    width,
    alpha: 0.55,
  };
}

/** Oś wychodząca od krawędzi zabudowy na zewnątrz (indeks `i` z tabel wariantu). */
function outboundLane(
  frame: Frame,
  angles: readonly number[],
  i: number,
  start: number,
  R: number,
  width?: number,
): Primitive {
  const a = angles[i % angles.length]!;
  return lane(
    frame,
    polar(a, start),
    polar(a + LANE_BEND[i % 5]! * 0.6, R * LANE_REACH[i % 5]!),
    LANE_BEND[i % 5]!,
    width,
  );
}

/* --- Klasy ---------------------------------------------------------------- */

export interface SettlementMorphologyInput {
  readonly settlementId: string;
  readonly population: number;
  readonly detail: MorphologyDetail;
}

export interface SettlementMorphology {
  readonly cls: MorphologyClass;
  readonly variant: MorphologyVariant;
  /** Promień śladu (jednostki diagramu) -- prymitywy mieszczą się w nim z tolerancją jednego śladu zabudowy. */
  readonly radius: number;
  readonly primitives: readonly Primitive[];
}

/** Dodatkowa zabudowa na poziomie szczegółu (WORLD: brak, LOCAL: najwięcej). */
const DETAIL_EXTRA: Readonly<Record<MorphologyDetail, number>> = {
  WORLD: 0,
  REGION: 1,
  LOCAL: 2,
};

export function settlementMorphology(
  input: SettlementMorphologyInput,
): SettlementMorphology {
  const population = safePopulation(input.population);
  const cls = morphologyClass(population);
  const variant = morphologyVariant(input.settlementId);
  const R = settlementFootprint(population);
  const t = classProgress(population);
  const v = variant.index;
  const frame: Frame = { rotation: VARIANT_ROTATION[v], mirror: variant.mirror };
  const angles = LANE_ANGLES[v]!;
  const shapeA = OUTLINES[v]!;
  const shapeB = OUTLINES[(v + 1) % 3]!;
  const shapeC = OUTLINES[(v + 2) % 3]!;
  const extra = DETAIL_EXTRA[input.detail];
  const out: Primitive[] = [];

  switch (cls) {
    case "hamlet": {
      // < 40 osób: dwa oddalone ślady (pojedyncze zagrody); większy przysiółek:
      // zwarte skupisko czterech śladów ze ścieżką -- zmiana układu, nie rozmiaru.
      if (population < 40) {
        const [a, b] = [HAMLET_MARKS[v]![1]!, HAMLET_MARKS[v]![3]!];
        out.push(plot(frame, a[0] * 1.2, a[1] * 1.2, 0.3, RURAL_PLOT));
        out.push(plot(frame, b[0] * 1.2, b[1] * 1.2, 1.1, RURAL_PLOT));
        break;
      }
      const spots = HAMLET_MARKS[v]!;
      out.push(lane(frame, spots[1]!, spots[2]!, 0.25, 0.6));
      if (population >= 250) out.push(lane(frame, spots[0]!, spots[3]!, -0.3, 0.55));
      spots.forEach(([x, y], i) =>
        out.push(plot(frame, x * 0.8, y * 0.8, (i * 0.7 + v) % 1.4, RURAL_PLOT)),
      );
      break;
    }
    case "village": {
      // Zabudowa wzdłuż lokalnej drogi (§28.2); większa wieś dostaje odgałęzienie.
      const a = angles[0]!;
      out.push(lane(frame, polar(a + Math.PI, R), polar(a, R), 0.12));
      if (t > 0.45)
        out.push(
          lane(frame, polar(a + 0.4, R * 0.2), polar(angles[1]!, R * 0.85), -0.2, 0.6),
        );
      const count = 5 + Math.round(t * 3) + extra;
      for (let i = 0; i < count; i++) {
        const along = -R * 0.85 + ((R * 1.7) / Math.max(1, count - 1)) * i;
        const side = (i % 2 === 0 ? 1 : -1) * (1.6 + (i % 3) * 0.3);
        const [x, y] = polar(a, along);
        out.push(
          plot(frame, x - Math.sin(a) * side, y + Math.cos(a) * side, a, RURAL_PLOT),
        );
      }
      break;
    }
    case "town": {
      // Wyraźny rdzeń w zwartej zabudowie + kilka kierunków wzrostu.
      const c = polar(angles[2]!, R * 0.1);
      out.push(
        ...builtArea(frame, [
          { x: c[0], y: c[1], r: R * 0.55, table: shapeB, twist: 0.4 },
        ]),
      );
      const arms = 3 + (t > 0.55 ? 1 : 0);
      for (let i = 0; i < arms; i++)
        out.push(outboundLane(frame, angles, i, R * 0.45, R));
      out.push(core(frame, c[0] + R * 0.08, c[1] - R * 0.05, R * 0.2, shapeA, 0.9));
      for (let i = 0; i < arms; i++) {
        const [x, y] = polar(angles[i]! + 0.12, R * (0.7 + (i % 2) * 0.12));
        out.push(plot(frame, x, y, angles[i]!));
        if (extra > 0 || t > 0.5) {
          const [x2, y2] = polar(angles[i]! - 0.1, R * 0.88);
          out.push(plot(frame, x2, y2, angles[i]! + 0.3));
        }
      }
      break;
    }
    case "city": {
      // Rdzeń + dzielnice (zwarte skupiska) + główne osie.
      out.push(
        ...builtArea(frame, [{ x: 0, y: 0, r: R * 0.8, table: shapeA, twist: 0.2 }]),
      );
      const districts = 2 + (t > 0.5 ? 1 : 0) + (extra > 1 ? 1 : 0);
      for (let i = 0; i < districts; i++) {
        const [x, y] = polar(angles[i + 1]! + 0.35, R * 0.48);
        out.push(...quarter(frame, x, y, extra === 0 ? 3 : 4, angles[i + 1]!));
      }
      for (let i = 0; i < 3; i++)
        out.push(outboundLane(frame, angles, i, R * 0.62, R * 1.05));
      const k = polar(angles[3]!, R * 0.12);
      out.push(core(frame, k[0], k[1], R * 0.24, shapeB, 0.6));
      for (let i = 0; i < 1 + extra; i++) {
        const [x, y] = polar(angles[(i + 3) % 5]! + 0.5, R * 0.95);
        out.push(plot(frame, x, y, angles[i]!));
      }
      break;
    }
    case "metropolis": {
      // Rozległy, nieregularny organizm: dwa zrośnięte płaty, rdzeń główny i wtórny.
      const lobe = polar(angles[1]!, R * 0.48);
      out.push(
        ...builtArea(frame, [
          {
            x: -lobe[0] * 0.3,
            y: -lobe[1] * 0.3,
            r: R * 0.72,
            table: shapeA,
            twist: 0.1,
          },
          { x: lobe[0], y: lobe[1], r: R * 0.5, table: shapeB, twist: 1.3 },
        ]),
      );
      const districts = 3 + (extra > 0 ? 1 : 0);
      for (let i = 0; i < districts; i++) {
        const [x, y] = polar(angles[(i + 2) % 5]! + 0.2, R * 0.42);
        out.push(...quarter(frame, x, y, extra === 0 ? 3 : 5, angles[i]!));
      }
      for (let i = 0; i < 4; i++)
        out.push(outboundLane(frame, angles, i + 1, R * 0.7, R * 1.05, 0.85));
      out.push(lane(frame, [-lobe[0] * 0.3, -lobe[1] * 0.3], lobe, 0.18, 0.85));
      out.push(core(frame, -lobe[0] * 0.3, -lobe[1] * 0.3, R * 0.19, shapeC, 0.3));
      out.push(core(frame, lobe[0], lobe[1], R * (0.1 + t * 0.04), shapeA, 1.1));
      if (t > 0.5) {
        const [x, y] = polar(angles[3]!, R * 0.5);
        out.push(core(frame, x, y, R * 0.08, shapeB, 0.5));
      }
      for (let i = 0; i < 2 + extra; i++) {
        const [x, y] = polar(angles[(i + 2) % 5]! - 0.4, R * 0.97);
        out.push(plot(frame, x, y, angles[i]!));
      }
      break;
    }
    case "megacity": {
      // Wielocentryczna struktura: kilka zrośniętych płatów, każdy z własnym rdzeniem,
      // osie łączą rdzenie w łańcuch (nie gwiazda do jednego centrum); osady satelitarne.
      const centers: [number, number][] = [
        polar(angles[0]!, R * 0.12),
        polar(angles[1]!, R * 0.5),
        polar(angles[2]!, R * 0.47),
        polar(angles[3]!, R * 0.52),
        polar(angles[4]!, R * 0.44),
      ].slice(0, 4 + (t > 0.35 ? 1 : 0));
      out.push(
        ...builtArea(
          frame,
          centers.map(([x, y], i) => ({
            x,
            y,
            r: R * (i === 0 ? 0.5 : 0.4),
            table: OUTLINES[(v + i) % 3]!,
            twist: i * 0.9,
          })),
        ),
      );
      for (let i = 1; i < centers.length; i++) {
        const [x, y] = centers[i]!;
        out.push(...quarter(frame, x * 0.55, y * 0.55, extra === 0 ? 2 : 4, angles[i]!));
      }
      for (let i = 1; i < centers.length; i++)
        out.push(lane(frame, centers[i - 1]!, centers[i]!, LANE_BEND[i % 5]!, 0.95));
      out.push(lane(frame, centers[1]!, polar(angles[1]! + 0.3, R * 1.08), 0.2, 0.85));
      out.push(
        lane(
          frame,
          centers[centers.length - 1]!,
          polar(angles[4]! - 0.25, R * 1.05),
          -0.2,
          0.85,
        ),
      );
      centers.forEach(([x, y], i) =>
        out.push(
          core(frame, x, y, R * (i === 0 ? 0.13 : 0.1), OUTLINES[(v + i + 1) % 3]!, i),
        ),
      );
      // Przyległe skupiska na obrzeżach (satelity), 2 śladów każde.
      for (let i = 0; i < 3; i++) {
        const [x, y] = polar(angles[(i + 2) % 5]! + 0.55, R * 0.98);
        out.push(...quarter(frame, x, y, 2 + (extra > 1 ? 1 : 0), angles[i]!));
      }
      break;
    }
  }
  return { cls, variant, radius: R, primitives: out };
}

/** Promień obrysu znaku liczony z prymitywów (test mieszczenia się w śladzie). */
export function morphologyExtent(primitives: readonly Primitive[]): number {
  let max = 0;
  for (const p of primitives) {
    if (p.kind === "circle") max = Math.max(max, Math.hypot(p.x, p.y) + p.r);
    else
      for (let i = 0; i < p.points.length; i += 2)
        max = Math.max(max, Math.hypot(p.points[i]!, p.points[i + 1]!));
  }
  return max;
}

/**
 * Kompaktowy zapis populacji zgodny z locale (np. EN `1.2K`, `12M`;
 * PL `1,2 tys.`, `12 mln`) -- dla legendy / tooltipów, nie zastępuje kształtu.
 */
export function formatPopulationCompact(population: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.round(safePopulation(population)));
}
