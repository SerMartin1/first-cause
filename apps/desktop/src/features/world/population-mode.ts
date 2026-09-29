import type { WorldRegionView, WorldSnapshot } from "@first-cause/simulation";
import {
  FOOTPRINT_CONTROL_POINTS,
  settlementFootprint,
} from "./settlement-morphology.js";
import type { Primitive } from "./visual-alphabet.js";

/*
 * M21-VIS-R4 --- tryb Population Living Atlasu (Atlas Spec v1.3 §14, §28.5).
 *
 *   POPULATION RING       = skala populacji REGIONU (ilościowa warstwa trybu),
 *   SETTLEMENT MORPHOLOGY = struktura osadnictwa (R3, bez zmian).
 *
 * Pierścień nie jest nowym symbolem osady ani obrysem zaznaczenia: to neutralny
 * kontur z bardzo lekkim wypełnieniem, rysowany POD morfologią. Czysta
 * prezentacja: bez PixiJS, locale, RNG i mutacji; wynik nie zależy od poziomu
 * zoomu (semantic zoom zmienia detal, nie fakt).
 */

/**
 * Fakt populacji regionu. `0` to ZNANA wartość (region niezamieszkany),
 * `unavailable` to brak danych -- dwa różne stany, nigdy `population || 0`.
 */
export type PopulationFact =
  { readonly kind: "known"; readonly value: number } | { readonly kind: "unavailable" };

/**
 * Wartość z Read Modelu → fakt. Symulacja zawsze zna `totalPopulation`, ale
 * widok przechodzi przez granicę procesu (worker / IPC) i może pochodzić z
 * częściowego Read Modelu, więc brak pola, `null` i wartość nieskończona albo
 * ujemna to „brak danych” -- nie zero.
 */
export function populationFact(value: number | null | undefined): PopulationFact {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? { kind: "known", value }
    : { kind: "unavailable" };
}

/**
 * TODO(no-data): produkcyjny Read Model ma dziś `population: number` (symulacja
 * zawsze zna populację). Rzeczywista obsługa „brak danych” wymaga formalnego
 * poszerzenia typu Read Modelu, gdy pojawi się faktyczne źródło nieznanej
 * populacji w symulacji / rozgrywce (np. fog-of-war). Do tego czasu stan
 * `unavailable` jest kontraktem prezentacji testowanym fixture'em.
 */
export function regionPopulationFact(
  region: Pick<WorldRegionView, "population">,
): PopulationFact {
  return populationFact(region.population as number | null | undefined);
}

/** Stan prezentacji wynikający z faktu (etykiety, legenda, testy E2E). */
export type PopulationState = "populated" | "zero" | "unavailable";
export function populationState(fact: PopulationFact): PopulationState {
  return fact.kind === "unavailable"
    ? "unavailable"
    : fact.value > 0
      ? "populated"
      : "zero";
}

/**
 * TODO tuning: promień pierścienia względem śladu osady R3 o tej samej
 * populacji. Wspólna matematyka z `settlementFootprint` (odcinkowo liniowo
 * po log10 populacji) -- bez drugiej, konkurencyjnej skali. 1.4 × limit śladu
 * (33) = 46.2 jednostki diagramu, czyli ok. 80% promienia pola regionu (58):
 * największy pierścień nie dominuje nad regionem.
 */
export const POPULATION_RING = {
  scale: 1.4,
  /** Odstęp pierścienia od śladu największej osady (pierścień nigdy jej nie przecina). */
  gap: 2.5,
  /**
   * R4.1: pierścień czytany jako „ilość”, nie granica / zaznaczenie -- lżejszy
   * kontur, nieco wyraźniejsze wypełnienie (wciąż bardzo lekkie, bez gradientu).
   */
  strokeWidth: 0.9,
  strokeAlpha: 0.6,
  fillAlpha: 0.1,
  /** Znacznik stanu „0” i „brak danych” -- ten sam promień, różny kontur. */
  markerRadius: 7,
  /**
   * R4.1: minimalny promień ekranowy znaczników „0” / „brak danych” (px) i
   * grubość ich konturu na ekranie -- widoczne na WORLD, ale słabsze niż
   * pierścienie zamieszkanych regionów (bez wypełnienia). TODO tuning.
   */
  stateMinPx: 7,
  /**
   * R4.1: stały dodatek ekranowy pierścienia (px) zamiast minimum z osad R3 --
   * małe pierścienie są widoczne przy oddaleniu, a różnice między rzędami
   * wielkości zostają zachowane (minimum by je spłaszczało). TODO tuning.
   */
  ringOffsetPx: 5,
  stateStrokePx: 1.3,
  /** Łuki przerywanego konturu „brak danych” (liczba odcinków na obwodzie). */
  dashSegments: 10,
} as const;

export const POPULATION_RING_MAX =
  POPULATION_RING.scale *
  FOOTPRINT_CONTROL_POINTS[FOOTPRINT_CONTROL_POINTS.length - 1]![1];

/** Populacja > 0 → promień pierścienia (jednostki diagramu); monotoniczny, z limitem. */
export function populationRingRadius(population: number): number {
  return POPULATION_RING.scale * settlementFootprint(population);
}

/** Pierścień znanej, dodatniej populacji: lekkie neutralne wypełnienie + kontur (2 prymitywy). */
export function populationRingPrimitives(radius: number): Primitive[] {
  return [
    {
      kind: "circle",
      x: 0,
      y: 0,
      r: radius,
      fill: "ink",
      alpha: POPULATION_RING.fillAlpha,
    },
    {
      kind: "circle",
      x: 0,
      y: 0,
      r: radius,
      stroke: "ink",
      width: POPULATION_RING.strokeWidth,
      alpha: POPULATION_RING.strokeAlpha,
    },
  ];
}

/** „0 / niezamieszkany”: pełny, cienki, pusty kontur -- miejsce w świecie bez mieszkańców. */
export function zeroPopulationPrimitives(
  radius: number = POPULATION_RING.markerRadius,
  width: number = POPULATION_RING.strokeWidth,
): Primitive[] {
  return [
    {
      kind: "circle",
      x: 0,
      y: 0,
      r: radius,
      stroke: "ink",
      width,
      alpha: POPULATION_RING.strokeAlpha,
    },
  ];
}

/**
 * „Brak danych”: przerywany (niekompletny) kontur w odcieniu `muted` -- bez
 * wypełnienia i bez koloru ostrzegawczego (brak danych nie jest błędem).
 * Łuki jako łamane, więc ten sam opis rysuje PixiJS i legenda SVG.
 */
export function noPopulationDataPrimitives(
  radius: number = POPULATION_RING.markerRadius,
  width: number = POPULATION_RING.strokeWidth,
): Primitive[] {
  const n = POPULATION_RING.dashSegments;
  const step = (Math.PI * 2) / n;
  const out: Primitive[] = [];
  for (let i = 0; i < n; i++) {
    const points: number[] = [];
    // Łuk zajmuje 55% odcinka; 4 punkty na łuk wystarczają przy tych promieniach.
    for (let j = 0; j <= 3; j++) {
      const a = i * step + (j / 3) * step * 0.55;
      points.push(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    out.push({
      kind: "poly",
      points,
      stroke: "muted",
      width,
    });
  }
  return out;
}

/** Znak warstwy Population dla faktu (ten sam dla mapy i legendy). */
export function populationMarkPrimitives(
  fact: PopulationFact,
  radius: number,
  stateWidth: number = POPULATION_RING.strokeWidth,
): Primitive[] {
  switch (populationState(fact)) {
    case "populated":
      return populationRingPrimitives(radius);
    case "zero":
      return zeroPopulationPrimitives(radius, stateWidth);
    case "unavailable":
      return noPopulationDataPrimitives(radius, stateWidth);
  }
}

/**
 * R4.1: promień znaku warstwy Population w jednostkach diagramu przy skali
 * ekranu `scale` (px na jednostkę). Pierścień = promień bazowy + stały
 * dodatek ekranowy (monotoniczny, rzędy wielkości rozróżnialne na każdym
 * zoomie); zawsze obejmuje `inner` (ekranowy ślad największej osady R3) z
 * odstępem. Znaczniki „0” / „brak danych” mają własne minimum ekranowe.
 */
export function populationMarkRadius(
  mark: PopulationMark,
  inner: number,
  scale: number,
): number {
  const k = Math.max(scale, 0.01);
  const clearance = inner > 0 ? inner + POPULATION_RING.gap : 0;
  if (mark.state !== "populated")
    return Math.max(mark.radius, clearance, POPULATION_RING.stateMinPx / k);
  return Math.max(mark.radius + POPULATION_RING.ringOffsetPx / k, clearance);
}

/** Grubość konturu znaczników stanu w jednostkach diagramu (stała na ekranie). */
export function populationStateStrokeWidth(scale: number): number {
  return Math.max(
    POPULATION_RING.strokeWidth,
    POPULATION_RING.stateStrokePx / Math.max(scale, 0.01),
  );
}

/**
 * R4.1: w trybie Population zaznaczenie regionu = cztery narożniki (kolor i
 * grubość akcentu zaznaczenia z Design Systemu) wokół znaku populacji --
 * kształt inny niż okrąg, więc nie myli się z pierścieniem skali. Zwraca
 * łamane (x0,y0,x1,y1,x2,y2) w jednostkach diagramu.
 */
export const SELECTION_BRACKET = { margin: 5, arm: 0.35 } as const;
export function selectionBracketPolylines(radius: number): number[][] {
  const d = radius + SELECTION_BRACKET.margin;
  const a = Math.max(4, d * SELECTION_BRACKET.arm);
  return [
    [-d, -d + a, -d, -d, -d + a, -d],
    [d - a, -d, d, -d, d, -d + a],
    [d, d - a, d, d, d - a, d],
    [-d + a, d, -d, d, -d, d - a],
  ];
}

/**
 * R4.1: hierarchia trybu Population -- przezroczystość warstw drugorzędnych
 * (TODO tuning). Pierścień + wartość na pierwszym planie; morfologia czytelna,
 * ale lekko wtórna; teren, trasy i znaki aktywności jako kontekst.
 */
export const POPULATION_EMPHASIS = {
  geography: 0.32,
  routes: 0.55,
  activity: 0.24,
  morphology: 0.85,
} as const;

/** Warstwa Population jednego regionu -- niezależna od zoomu (fakt, nie detal). */
export interface PopulationMark {
  readonly regionId: string;
  readonly fact: PopulationFact;
  readonly state: PopulationState;
  /** Promień bazowy (jednostki diagramu), przed minimalnym rozmiarem ekranowym. */
  readonly radius: number;
}

/**
 * Promień bazowy: dla populacji > 0 pierścień z log10; dla „0” i „brak danych”
 * mały znacznik stanu. Pierścień / znacznik obejmuje ślad największej osady
 * regionu z odstępem -- nigdy nie przecina jej morfologii.
 */
export function populationMark(region: WorldRegionView): PopulationMark {
  const fact = regionPopulationFact(region);
  const state = populationState(fact);
  const largest = Math.max(
    0,
    ...region.settlements.map((s) => settlementFootprint(s.population)),
  );
  const base =
    state === "populated" && fact.kind === "known"
      ? populationRingRadius(fact.value)
      : POPULATION_RING.markerRadius;
  return {
    regionId: region.regionId,
    fact,
    state,
    radius: largest > 0 ? Math.max(base, largest + POPULATION_RING.gap) : base,
  };
}

export function buildPopulationLayer(
  snapshot: WorldSnapshot,
): ReadonlyMap<string, PopulationMark> {
  return new Map(snapshot.regions.map((r) => [r.regionId, populationMark(r)]));
}

/** Rzędy wielkości legendy pierścieni (§28.3: z zakresu danych, nie ze stałych). */
export const POPULATION_LEGEND_STEPS = [
  100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000,
] as const;

export function populationLegendSteps(
  layer: ReadonlyMap<string, PopulationMark>,
): number[] {
  const values = [...layer.values()].flatMap((m) =>
    m.fact.kind === "known" && m.fact.value > 0 ? [m.fact.value] : [],
  );
  if (!values.length) return [];
  const min = Math.min(...values),
    max = Math.max(...values);
  const steps = POPULATION_LEGEND_STEPS.filter(
    (step) => step >= min / 3.2 && step <= max * 3.2,
  );
  // Zawsze co najmniej jedna próbka: najbliższy rząd wielkości.
  return steps.length
    ? steps
    : [
        POPULATION_LEGEND_STEPS.reduce((best, step) =>
          Math.abs(Math.log10(step / max)) < Math.abs(Math.log10(best / max))
            ? step
            : best,
        ),
      ];
}
