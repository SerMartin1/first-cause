import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Application } from "pixi.js";
import type { WorldView } from "@first-cause/simulation";
import {
  atlasPositions,
  fitAtlas,
  MODE_METRICS,
  effectiveFlowLens,
  type AtlasInsets,
} from "./atlas-model.js";
import { useWorldStore } from "./world-store.js";
import { tradeHighlight, tradeRelationArc } from "./trade-view.js";
import {
  aggregateGlyph,
  drawPrimitives,
  extractionGlyph,
  industryGlyph,
  INK_TOKEN,
  REGION_FIELD_RADIUS,
  resourceGlyph,
  routePrimitives,
  routeStyle,
  terrainPrimitives,
  type Ink,
  type Primitive,
} from "./visual-alphabet.js";
import {
  buildAtlasGrammar,
  type AtlasGlyph,
  type RegionGrammar,
} from "./atlas-grammar.js";
import {
  FCAtlasGlyph,
  FCPopulationSample,
  FCSettlementSample,
  legendLabel,
} from "./FCAtlasGlyph.js";
import {
  formatPopulationCompact,
  MORPHOLOGY_CLASSES,
  MORPHOLOGY_CLASS_SAMPLE,
  morphologyClass,
  settlementMorphology,
} from "./settlement-morphology.js";
import {
  buildPopulationLayer,
  noPopulationDataPrimitives,
  populationLegendSteps,
  populationMarkPrimitives,
  populationRingPrimitives,
  populationRingRadius,
  populationMarkRadius,
  populationStateStrokeWidth,
  selectionBracketPolylines,
  POPULATION_EMPHASIS,
  POPULATION_RING,
  zeroPopulationPrimitives,
  type PopulationMark,
} from "./population-mode.js";

/** Skala znaków aktywności względem układu 12×12 i odstępy w rzędzie (jednostki diagramu). */
const GLYPH_K = 1.45;
const GLYPH_STEP = 22;
const GLYPH_ROW_STEP = 23;
/** TODO tuning: maksymalna liczba pozycji klucza znaków rozwiniętego domyślnie. */
const SYMBOL_KEY_OPEN_MAX = 8;

/**
 * TODO tuning: minimalny promień śladu osady na ekranie (px) i maksymalne
 * powiększenie z tego powodu. Najmniejsze osady nie znikają przy oddaleniu
 * (§13: im dalej, tym bardziej znak zamiast ilustracji); duże osady nie są
 * powiększane, a kolejność rozmiarów pozostaje monotoniczna.
 */
const MIN_SETTLEMENT_PX = 7;
const MAX_SETTLEMENT_BOOST = 1.6;
function settlementBoost(radius: number, scale: number): number {
  return Math.max(
    1,
    Math.min(MAX_SETTLEMENT_BOOST, MIN_SETTLEMENT_PX / (radius * scale)),
  );
}

/** Największy rząd wielkości legendy pierścieni („10M+”). */
const POPULATION_LEGEND_MAX = 10_000_000;
/**
 * TODO tuning: skala próbek legendy Population (px na jednostkę diagramu; mapa
 * 1920×1080 ≈ 1.3). Mniejsza niż na mapie, żeby legenda przy 1280×800 nie
 * odbierała Atlasowi miejsca; proporcje między rzędami wielkości zachowane.
 */
const POPULATION_LEGEND_PX = 0.45;
/** Skala próbek stanów „0” i „brak danych” (mały znacznik -- czytelny kontur). */
const POPULATION_STATE_PX = 1.2;

/** R4B, TODO tuning: promień pierścienia partnera handlowego (jednostki diagramu). */
const TRADE_RING = 30;

/** TODO tuning: maksymalna liczba kropek osad zagregowanych (reszta jako „+n”). */
const MINOR_SETTLEMENT_DOTS = 5;

/** Zasięg układu osad regionu względem węzła (R3): lewa/prawa krawędź i dół śladów. */
function settlementExtent(region: RegionGrammar | undefined): {
  left: number;
  right: number;
  bottom: number;
} {
  const placed = region?.settlements ?? [];
  if (!placed.length) return { left: 0, right: 0, bottom: 0 };
  const minor = region?.minorSettlements ?? 0;
  const right = Math.max(...placed.map((p) => p.x + p.radius));
  return {
    left: Math.min(...placed.map((p) => p.x - p.radius)),
    // Kropki osad zagregowanych stoją za prawą krawędzią ostatniego śladu.
    right: right + (minor > 0 ? 6 + Math.min(minor, MINOR_SETTLEMENT_DOTS) * 3.2 + 8 : 0),
    bottom: Math.max(...placed.map((p) => p.y + p.radius)),
  };
}

/** Szerokość miejsca znaku w rzędzie: duży zakład / kompleks ma drugą halę (§10.3), więc szerszy krok. */
function glyphSlot(glyph: AtlasGlyph): number {
  return glyph.cls === "industry" && glyph.scale >= 4 ? GLYPH_STEP + 10 : GLYPH_STEP;
}

/** Środki znaków w rzędzie (pierwszy znak w x = 0, pod osadą) i łączna szerokość rzędu. */
function rowLayout(row: readonly AtlasGlyph[]): { xs: number[]; width: number } {
  const xs: number[] = [];
  let edge = -GLYPH_STEP / 2;
  for (const glyph of row) {
    const slot = glyphSlot(glyph);
    // Druga hala dużego zakładu leży po lewej stronie znaku -- środek lekko w prawo.
    xs.push(edge + slot / 2 + (slot > GLYPH_STEP ? 3 : 0));
    edge += slot;
  }
  return { xs, width: edge + GLYPH_STEP / 2 };
}

function glyphPrimitives(glyph: AtlasGlyph): Primitive[] {
  switch (glyph.cls) {
    case "industry":
      return industryGlyph(glyph.sector, glyph.scale, glyph.state);
    case "extraction":
      return extractionGlyph(glyph.family, glyph.state);
    case "resource":
      return resourceGlyph(glyph.renewable, glyph.highlighted);
    case "aggregate":
      return aggregateGlyph(glyph.of, glyph.count, glyph.state);
  }
}

export function FCLivingAtlas({
  view,
  resourceId,
  discoveryId,
  caption,
}: {
  readonly view: WorldView;
  readonly resourceId: string;
  readonly discoveryId: string;
  /** Opis aktywnego trybu mapy jako nakładka Atlasu, nie osobny wiersz nad płótnem. */
  readonly caption?: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const host = useRef<HTMLDivElement>(null);
  const captionBox = useRef<HTMLDivElement>(null);
  const legendBox = useRef<HTMLDivElement>(null);
  const app = useRef<Application>();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState(0);
  const ui = useWorldStore();
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number }>();
  // Gramatyka wizualna (czysta funkcja Read Modelu) -- wspólna dla sceny i legendy.
  const grammar = useMemo(
    () =>
      buildAtlasGrammar(view.current, {
        zoomLevel: ui.zoomLevel,
        showResources: ui.overlays.includes("resources") || ui.mapMode === "resources",
        ...(ui.mapMode === "resources" && resourceId
          ? { highlightResourceId: resourceId }
          : {}),
      }),
    [view, ui.zoomLevel, ui.overlays, ui.mapMode, resourceId],
  );
  // R4: warstwa Population (fakt populacji + pierścień) -- niezależna od zoomu.
  const populationLayer = useMemo(() => buildPopulationLayer(view.current), [view]);
  const populationMode = ui.mapMode === "population";
  // R4B: tryb Handel -- tabela w inspektorze jest źródłem; Atlas pokazuje wybrany region,
  // partnerów rozwiniętego towaru i (po wskazaniu partnera) kierunki wymiany.
  const tradeMode = ui.mapMode === "trade";
  const trade = useMemo(
    () =>
      tradeHighlight(
        view.current.regions.find((r) => r.regionId === ui.selectedEntityId),
        ui.tradeGoodId,
        ui.tradePartnerId,
      ),
    [view, ui.selectedEntityId, ui.tradeGoodId, ui.tradePartnerId],
  );
  // Klucz znaków rozwinięty domyślnie tylko, gdy jest krótki -- przy wielu klasach nie może
  // zasłaniać Atlasu (dominacja Atlasu, Golden v1.3 §26.2); rozwinięcie na żądanie.
  const [symbolsChoice, setSymbolsChoice] = useState<boolean>();
  // W trybie Population znaki aktywności są drugorzędne -- ich klucz domyślnie zwinięty.
  const symbolsOpen =
    symbolsChoice ?? (!populationMode && grammar.legend.length <= SYMBOL_KEY_OPEN_MAX);
  useEffect(() => {
    let disposed = false;
    let instance: Application | undefined;
    void (async () => {
      const { Application } = await import("pixi.js");
      // Static shader/uniform sync polyfills preserve the app's no-eval CSP.
      await import("pixi.js/unsafe-eval");
      instance = new Application();
      await instance.init({
        resizeTo: host.current!,
        backgroundAlpha: 0,
        antialias: true,
        autoStart: false,
      });
      if (disposed) {
        instance.destroy(true, { children: true });
        return;
      }
      host.current!.appendChild(instance.canvas);
      app.current = instance;
      setReady(true);
    })().catch(() => {
      if (!disposed) setFailed(true);
    });
    return () => {
      disposed = true;
      if (app.current === instance && instance) {
        instance.destroy(true, { children: true });
        app.current = undefined;
      }
    };
  }, []);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(() => {
      app.current?.resize();
      setSize((n) => n + 1);
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!ready || !app.current) return;
    const renderer = app.current;
    let cancelled = false;
    void import("pixi.js").then(({ Container, Graphics, Text, Circle }) => {
      if (cancelled) return;
      const old = renderer.stage.removeChildren();
      old.forEach((child) => child.destroy({ children: true }));
      const scene = new Container();
      const positions = atlasPositions(view.current);
      // Auto-fit: zasięg diagramu (węzły + rzędy osad + znaki profilu) wpisany w wolny
      // obszar płótna; legenda rezerwuje pas dolny albo prawy -- wybierany jest ten,
      // który daje większą skalę, więc legenda nie zasłania węzłów.
      const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
      for (const region of view.current.regions) {
        const p = positions.get(region.regionId)!;
        const rg = grammar.regions.find((r) => r.regionId === region.regionId);
        const extent = settlementExtent(rg);
        bounds.minX = Math.min(bounds.minX, p.x - REGION_FIELD_RADIUS, p.x + extent.left);
        bounds.maxX = Math.max(
          bounds.maxX,
          p.x + Math.max(REGION_FIELD_RADIUS, extent.right),
        );
        bounds.minY = Math.min(bounds.minY, p.y - REGION_FIELD_RADIUS);
        const glyphRows = rg?.rows.length ?? 0;
        bounds.maxY = Math.max(
          bounds.maxY,
          p.y + REGION_FIELD_RADIUS + 12,
          p.y + Math.max(8, extent.bottom) + GLYPH_ROW_STEP * (0.8 + glyphRows),
        );
      }
      if (!Number.isFinite(bounds.minX))
        Object.assign(bounds, { minX: 0, minY: 0, maxX: 960, maxY: 640 });
      const viewport = { width: renderer.screen.width, height: renderer.screen.height };
      const top = (captionBox.current?.offsetHeight ?? 0) + 16;
      const legend = {
        width: (legendBox.current?.offsetWidth ?? 0) + 16,
        height: (legendBox.current?.offsetHeight ?? 0) + 16,
      };
      // Etykiety regionów stoją po prawej stronie węzła w stałym rozmiarze ekranowym.
      const labelSpace = 140;
      const maxScale = Math.min(viewport.width / 960, viewport.height / 640) * 1.8;
      const fits = (
        [
          { top, right: labelSpace, bottom: Math.max(48, legend.height), left: 24 },
          { top, right: labelSpace + legend.width, bottom: 48, left: 24 },
        ] satisfies AtlasInsets[]
      ).map((insets) => fitAtlas(bounds, viewport, insets, maxScale));
      const fit = fits[0]!.scale >= fits[1]!.scale ? fits[0]! : fits[1]!;
      const scale = fit.scale * ui.zoomLevel;
      const focus =
        ui.focusMode && ui.selectedEntityId
          ? positions.get(ui.selectedEntityId)
          : undefined;
      scene.scale.set(scale);
      scene.position.set(
        focus
          ? fit.centerX - focus.x * scale
          : fit.centerX - ((bounds.minX + bounds.maxX) / 2) * scale + pan.x,
        focus
          ? fit.centerY - focus.y * scale
          : fit.centerY - ((bounds.minY + bounds.maxY) / 2) * scale + pan.y,
      );
      renderer.stage.addChild(scene);
      const styles = getComputedStyle(host.current!);
      const color = (token: string) => styles.getPropertyValue(token).trim();
      const neutral = color("--fc-text-secondary"),
        accent = color("--fc-accent");
      const inkColor = (ink: Ink) => color(INK_TOKEN[ink]);
      /**
       * Znak warstwy Population regionu (środek = węzeł, gdzie stoi największa osada).
       * Minimalny rozmiar ekranowy jak dla osad (`settlementBoost`), a pierścień zawsze
       * obejmuje powiększony ślad największej osady z odstępem -- nigdy go nie przecina.
       */
      const populationRadius = (
        mark: PopulationMark,
        rg: RegionGrammar | undefined,
        k: number,
      ) => {
        const largest = rg?.settlements[0];
        const inner = largest ? largest.radius * settlementBoost(largest.radius, k) : 0;
        return populationMarkRadius(mark, inner, k);
      };
      const populationGraphics = (mark: PopulationMark, radius: number, k: number) => {
        const g = new Graphics();
        drawPrimitives(
          g,
          populationMarkPrimitives(mark.fact, radius, populationStateStrokeWidth(k)),
          inkColor,
        );
        return g;
      };
      /** Zwarta wartość przy regionie (pełna liczba zostaje w inspektorze). */
      const populationValueLabel = (mark: PopulationMark | undefined) =>
        !mark || mark.fact.kind === "unavailable"
          ? t("world.population.noDataLabel")
          : mark.fact.value === 0
            ? t("world.population.zeroLabel")
            : formatPopulationCompact(mark.fact.value, i18n.language);
      // Hierarchia warstw §27.2: przy aktywnym Map Mode dane nad cywilizacją nad geografią.
      const dataMode = ui.mapMode !== "terrain";
      // R4 Population: pierwszy plan = pierścień + morfologia + wartość; nazwa, trasy i
      // woda do orientacji; rzeźba, roślinność, przemysł i wydobycie przygaszone.
      const deEmphasis = populationMode
        ? POPULATION_EMPHASIS.activity
        : dataMode
          ? 0.6
          : 1;
      const regionGrammar = new Map(grammar.regions.map((r) => [r.regionId, r]));
      const outOfFocus = (regionId: string) =>
        ui.focusMode && !!ui.selectedEntityId && regionId !== ui.selectedEntityId;
      // GEOGRAPHY: pole regionu (ton gruntu, rzeźba, roślinność, woda) -- tło, nie konkuruje z danymi.
      const geography = new Graphics();
      geography.alpha = populationMode
        ? POPULATION_EMPHASIS.geography
        : dataMode
          ? 0.45
          : 1;
      scene.addChild(geography);
      for (const region of grammar.regions) {
        const p = positions.get(region.regionId);
        if (!p) continue;
        drawPrimitives(
          geography,
          terrainPrimitives(region.terrain, region.seed),
          inkColor,
          {
            dx: p.x,
            dy: p.y,
            alpha: outOfFocus(region.regionId) ? 0.35 : 1,
          },
        );
      }
      // CIVILIZATION / trasy: infrastruktura rysowana NA KRAWĘDZI (§28.6), styl z rodziny trasy w contencie.
      const routes = new Graphics();
      routes.alpha = populationMode ? POPULATION_EMPHASIS.routes : dataMode ? 0.7 : 1;
      scene.addChild(routes);
      const borderColor = color("--fc-border-strong");
      if (ui.overlays.includes("connections"))
        for (const edge of grammar.edges) {
          const a = positions.get(edge.from),
            b = positions.get(edge.to);
          if (!a || !b) continue;
          if (
            ui.focusMode &&
            edge.from !== ui.selectedEntityId &&
            edge.to !== ui.selectedEntityId
          )
            continue;
          for (const stroke of edge.strokes) {
            const style = routeStyle(stroke.family, edge.level);
            drawPrimitives(
              routes,
              routePrimitives(a, b, style, style.ink === "border" ? "muted" : style.ink),
              (ink) => (style.ink === "border" ? borderColor : inkColor(ink)),
            );
          }
          if (edge.disrupted) {
            const x = (a.x + b.x) / 2,
              y = (a.y + b.y) / 2;
            routes
              .moveTo(x - 5, y - 5)
              .lineTo(x + 5, y + 5)
              .moveTo(x + 5, y - 5)
              .lineTo(x - 5, y + 5)
              .stroke({ color: color("--fc-negative"), width: 2 });
          }
        }
      const lines = new Graphics();
      scene.addChild(lines);
      if (ui.causalLink) {
        const a = positions.get(ui.causalLink.from),
          b = positions.get(ui.causalLink.to);
        if (a && b) {
          if (ui.causalLink.from === ui.causalLink.to)
            lines.circle(a.x, a.y, 26).stroke({ color: accent, width: 3 });
          else {
            lines.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: accent, width: 3 });
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            lines
              .moveTo(b.x - 14 * Math.cos(angle - 0.5), b.y - 14 * Math.sin(angle - 0.5))
              .lineTo(b.x, b.y)
              .lineTo(b.x - 14 * Math.cos(angle + 0.5), b.y - 14 * Math.sin(angle + 0.5))
              .stroke({ color: accent, width: 3 });
          }
        }
      }
      const relevantFlows = view.current.flows
        .filter(
          (f) =>
            // R4B: soczewka niedostępna (Handel) nie rysuje nic -- bez porównania towarów.
            f.family === effectiveFlowLens(ui.flowLens) &&
            (!ui.selectedEntityId ||
              f.from === ui.selectedEntityId ||
              f.to === ui.selectedEntityId) &&
            (f.family !== "technology" || !discoveryId || f.subjectId === discoveryId),
        )
        .sort((a, b) => b.magnitude - a.magnitude || a.id.localeCompare(b.id))
        .slice(0, ui.flowLimit);
      const maxFlow = Math.max(1, ...relevantFlows.map((f) => f.magnitude));
      for (const flow of relevantFlows) {
        const a = positions.get(flow.from),
          b = positions.get(flow.to);
        if (!a || !b) continue;
        const c = color("--fc-info"),
          angle = Math.atan2(b.y - a.y, b.x - a.x);
        lines
          .moveTo(a.x, a.y)
          .lineTo(b.x, b.y)
          .stroke({ color: c, width: 1 + 4 * Math.sqrt(flow.magnitude / maxFlow) });
        const x = (a.x + b.x) / 2,
          y = (a.y + b.y) / 2;
        lines
          .moveTo(x - 7 * Math.cos(angle - 0.5), y - 7 * Math.sin(angle - 0.5))
          .lineTo(x, y)
          .lineTo(x - 7 * Math.cos(angle + 0.5), y - 7 * Math.sin(angle + 0.5))
          .stroke({ color: c, width: 2 });
      }
      // R4B: partnerzy rozwiniętego towaru (pierścień info) i -- dla wskazanej pary --
      // przerywane łuki relacji handlowej z grotem. Łuk ≠ trasa: odgięty od linii
      // połączenia, bez grubości wg ilości i bez liczb na mapie.
      const tradeLayer = new Graphics();
      scene.addChild(tradeLayer);
      const info = color("--fc-info");
      // Grubości i kreski w px ekranu (scena jest skalowana).
      const px = (n: number) => n / Math.max(0.05, scale);
      if (trade) {
        for (const partnerId of trade.partnerRegionIds) {
          const p = positions.get(partnerId);
          if (!p) continue;
          // Wskazany partner wyraźniejszy; pozostali przygaszeni, ale widoczni.
          const pointed = trade.pair?.partnerRegionId === partnerId;
          tradeLayer.circle(p.x, p.y, TRADE_RING).stroke({
            color: info,
            width: px(pointed ? 3 : 2),
            alpha: trade.pair && !pointed ? 0.45 : 1,
          });
        }
      }
      const labelBoxes: { x: number; y: number; w: number; h: number }[] = [];
      const context = {
        ...(view.baseline ? { baseline: view.baseline } : {}),
        resourceId,
        discoveryId,
        changeMetric: ui.changeMetric,
      };
      const values = new Map(
        view.current.regions.map((r) => [
          r.regionId,
          MODE_METRICS[ui.mapMode](r, view.current, context),
        ]),
      );
      const maxValue = Math.max(
        1,
        ...Array.from(values.values(), (v) => Math.abs(v ?? 0)),
      );
      // Sortowanie etykiet: brak danych na końcu (nie jako zero, nie jako NaN).
      const knownPopulation = (regionId: string) => {
        const fact = populationLayer.get(regionId)?.fact;
        return fact?.kind === "known" ? fact.value : -1;
      };
      const regions = [...view.current.regions].sort(
        (a, b) =>
          Number(
            b.regionId === ui.selectedEntityId || b.regionId === ui.hoveredRegionId,
          ) -
            Number(
              a.regionId === ui.selectedEntityId || a.regionId === ui.hoveredRegionId,
            ) || knownPopulation(b.regionId) - knownPopulation(a.regionId),
      );
      let budget = ui.zoomLevel < 0.8 ? 5 : ui.zoomLevel < 1.6 ? 12 : 32;
      for (const region of regions) {
        const point = positions.get(region.regionId)!;
        const selected = ui.selectedEntityId === region.regionId;
        const value = values.get(region.regionId);
        // Population nie normalizuje intensywności do najliczniejszego regionu (§28.5):
        // skala absolutna jest w promieniu pierścienia, a morfologia zostaje neutralna.
        const intensity = populationMode
          ? POPULATION_EMPHASIS.morphology
          : tradeMode || value === undefined || value === 0
            ? 1
            : 0.3 + 0.7 * Math.sqrt(Math.abs(value) / maxValue);
        const signed = ui.mapMode === "change";
        // R4B: Handel nie koloruje regionów sumą ilości różnych towarów.
        const fill =
          populationMode || tradeMode || value === undefined || value === 0
            ? neutral
            : color(
                signed
                  ? value > 0
                    ? "--fc-positive"
                    : "--fc-negative"
                  : ui.mapMode === "stability"
                    ? "--fc-warning"
                    : "--fc-info",
              );
        const node = new Container();
        node.position.set(point.x, point.y);
        node.alpha = ui.focusMode && !selected ? 0.28 : 1;
        scene.addChild(node);
        // Punkt węzła tylko dla regionu bez widocznych osad -- inaczej zasłaniałby
        // drobne ślady przysiółka (R3); osada sama niesie kolor trybu.
        const hasSettlements =
          ui.overlays.includes("settlements") && region.settlements.length > 0;
        const rg = regionGrammar.get(region.regionId);
        const extent = settlementExtent(rg);
        const mark = populationLayer.get(region.regionId);
        // R4: warstwa Population POD morfologią -- pierścień skali, „0” albo „brak danych”.
        const ringRadius = populationMode && mark ? populationRadius(mark, rg, scale) : 0;
        if (populationMode && mark)
          node.addChild(populationGraphics(mark, ringRadius, scale));
        const marker = new Graphics();
        // Region bez osad w widoku bazowym: pusty pierścień (miejsce w świecie, nie osada).
        if (populationMode) {
          // Stan regionu bez osad niesie już znak warstwy Population.
        } else if (!hasSettlements && ui.mapMode === "terrain")
          marker.circle(0, 0, 3.5).stroke({ color: neutral, width: 1, alpha: 0.7 });
        else if (!hasSettlements)
          marker.circle(0, 0, 4).fill({ color: fill, alpha: intensity });
        node.addChild(marker);
        if (ui.overlays.includes("settlements") && rg) {
          // R3: jeden obiekt Graphics na region (batching); osada = morfologia z klasy
          // populacji, nie powiększony znacznik. R4: w trybie Population TA SAMA
          // morfologia (neutralny atrament) -- tryb zmienia warstwę informacji, nie osadę.
          const g = new Graphics();
          for (const placed of rg.settlements) {
            const boost = settlementBoost(placed.radius, scale);
            drawPrimitives(
              g,
              settlementMorphology({
                settlementId: placed.settlementId,
                population: placed.population,
                detail: grammar.zoom,
              }).primitives,
              // Zabudowa i jej krawędź mają stały odcień Atlasu; ślady i rdzenie niosą kolor trybu.
              (ink) => (ink === "ink" ? fill : inkColor(ink)),
              { dx: placed.x, dy: placed.y, k: boost, alpha: intensity },
            );
          }
          // Zaznaczenie: jeden obrys całej grupy osad regionu (nie pierścień na każdej osadzie).
          // R4.1: w trybie Population zaznaczenie rysują narożniki (niżej), nie elipsa.
          if (selected && rg.settlements.length && !populationMode) {
            const reach = Math.max(
              ...rg.settlements.map(
                (p) => Math.abs(p.y) + p.radius * settlementBoost(p.radius, scale),
              ),
            );
            g.ellipse(
              (extent.left + extent.right) / 2,
              0,
              (extent.right - extent.left) / 2 + 5,
              reach + 5,
            ).stroke({ color: accent, width: 1.5 });
          }
          // Osady ponad budżet zoomu: zagregowane kropki (+n), nigdy ukryte (§28.4).
          const lastRight = Math.max(0, ...rg.settlements.map((p) => p.x + p.radius));
          for (let i = 0; i < Math.min(rg.minorSettlements, MINOR_SETTLEMENT_DOTS); i++)
            g.circle(lastRight + 6 + i * 3.2, (i % 2) * 2 - 1, 1.1).fill({
              color: fill,
              alpha: intensity,
            });
          node.addChild(g);
          if (rg.minorSettlements > MINOR_SETTLEMENT_DOTS) {
            const more = new Text({
              resolution: Math.max(1, scale * window.devicePixelRatio),
              text: `+${rg.minorSettlements - MINOR_SETTLEMENT_DOTS}`,
              style: {
                fontFamily: "IBM Plex Sans",
                fontSize: 9 / Math.max(0.5, scale),
                fill: neutral,
              },
            });
            more.position.set(lastRight + 6 + MINOR_SETTLEMENT_DOTS * 3.2, -5);
            node.addChild(more);
          }
        }
        // CIVILIZATION / aktywność: `industry[]` (rząd 1) oraz `extraction[]` + znane zasoby (rząd 2),
        // obecne na każdym poziomie zoomu (§28.4); semantic zoom zmienia agregację, nie obecność.
        const rows = regionGrammar.get(region.regionId)?.rows ?? [];
        if (ui.overlays.includes("settlements") && rows.length) {
          const marks = new Graphics();
          marks.alpha = deEmphasis;
          const top = Math.max(8, extent.bottom) + GLYPH_ROW_STEP * 0.8;
          // Kartograficzne „halo” papieru pod rzędem znaków: znaki nie giną pod liniami tras.
          const paper = color("--fc-bg");
          const layouts = rows.map(rowLayout);
          rows.forEach((_, r) =>
            marks
              .rect(
                -GLYPH_STEP / 2,
                top + r * GLYPH_ROW_STEP - GLYPH_ROW_STEP / 2,
                layouts[r]!.width,
                GLYPH_ROW_STEP,
              )
              .fill({ color: paper, alpha: 0.82 }),
          );
          rows.forEach((row, r) =>
            row.forEach((glyph, i) => {
              const gx = layouts[r]!.xs[i]!,
                gy = top + r * GLYPH_ROW_STEP;
              drawPrimitives(marks, glyphPrimitives(glyph), inkColor, {
                dx: gx,
                dy: gy,
                k: glyph.cls === "resource" ? 1 : GLYPH_K,
              });
              // LOCAL: pozostała część złoża skończonego (wartość absolutna 0..1, bez normalizacji).
              if (glyph.cls === "extraction" && glyph.reserveRatio !== undefined) {
                marks
                  .moveTo(gx - 7, gy + 10)
                  .lineTo(gx + 7, gy + 10)
                  .stroke({ color: neutral, width: 1, alpha: 0.35 });
                marks
                  .moveTo(gx - 7, gy + 10)
                  .lineTo(
                    gx - 7 + 14 * Math.max(0, Math.min(1, glyph.reserveRatio)),
                    gy + 10,
                  )
                  .stroke({ color: neutral, width: 2 });
              }
            }),
          );
          node.addChild(marks);
          const overflow = regionGrammar.get(region.regionId)?.overflow ?? 0;
          if (overflow > 0) {
            const lastRow = layouts[layouts.length - 1]!;
            const more = new Text({
              resolution: Math.max(1, scale * window.devicePixelRatio),
              text: `+${overflow}`,
              style: {
                fontFamily: "IBM Plex Sans",
                fontSize: 10 / Math.max(0.5, scale),
                fill: neutral,
              },
            });
            more.position.set(
              lastRow.width - GLYPH_STEP / 2 + 2,
              top + (rows.length - 1) * GLYPH_ROW_STEP - 6,
            );
            node.addChild(more);
          }
        }
        if (selected && populationMode) {
          // Zaznaczenie ≠ pierścień populacji: narożniki w kolorze akcentu (2 px, Design System).
          const brackets = new Graphics();
          for (const line of selectionBracketPolylines(ringRadius))
            brackets
              .moveTo(line[0]!, line[1]!)
              .lineTo(line[2]!, line[3]!)
              .lineTo(line[4]!, line[5]!);
          brackets.stroke({ color: accent, width: 2 / Math.max(0.5, scale) });
          node.addChild(brackets);
        } else if (selected && !region.settlements.length)
          marker.circle(0, 0, 12).stroke({ color: accent, width: 2 });
        if (ui.hoveredRegionId === region.regionId)
          marker.circle(0, 0, 44).stroke({ color: accent, width: 1 });
        if (
          ui.overlays.includes("events") &&
          view.events.some((e) => e.regionRefs.includes(region.regionId))
        ) {
          marker.circle(-22, -20, 4).fill(color("--fc-warning"));
        }
        node.eventMode = "static";
        node.cursor = "pointer";
        node.hitArea = new Circle(0, 0, Math.max(24 / scale, 40));
        node.on("pointertap", () =>
          ui.set({
            selectedEntityId: region.regionId,
            selectedEventId: undefined,
            focusMode: false,
          }),
        );
        const metricLabel = populationMode
          ? populationValueLabel(mark)
          : value === undefined
            ? "—"
            : `${signed ? "Δ " : ""}${signed && value > 0 ? "+" : ""}${value.toLocaleString(i18n.language, { maximumFractionDigits: 1 })}`;
        const label = new Text({
          resolution: Math.max(1, scale * window.devicePixelRatio),
          text:
            ui.mapMode === "terrain" || tradeMode
              ? region.name
              : `${region.name}\n${metricLabel}`,
          style: {
            fontFamily: "IBM Plex Sans",
            fontSize: 13 / Math.max(0.5, scale),
            fill: color("--fc-text-primary"),
          },
        });
        // Etykieta obok śladu osad (duże osady nie wchodzą pod napis).
        // R4.1: w trybie Population etykieta stoi też poza pierścieniem (bez interferencji).
        label.position.set(
          point.x + Math.max(44, extent.right + 8, ringRadius + 6),
          point.y - 12,
        );
        const box = { x: label.x, y: label.y, w: label.width, h: label.height };
        const collides = labelBoxes.some(
          (b) =>
            box.x < b.x + b.w &&
            box.x + box.w > b.x &&
            box.y < b.y + b.h &&
            box.y + box.h > b.y,
        );
        if (
          ui.overlays.includes("names") &&
          budget > 0 &&
          !collides &&
          (!ui.focusMode || selected)
        ) {
          scene.addChild(label);
          labelBoxes.push(box);
          budget--;
        } else {
          label.destroy();
          // Population: wartość jest informacją pierwszego planu -- gdy budżet nazw się
          // wyczerpie, zostaje sama zwarta wartość (bez nazwy), o ile nie koliduje.
          if (populationMode && ui.overlays.includes("names") && !ui.focusMode) {
            const valueOnly = new Text({
              resolution: Math.max(1, scale * window.devicePixelRatio),
              text: metricLabel,
              style: {
                fontFamily: "IBM Plex Sans",
                fontSize: 11 / Math.max(0.5, scale),
                fill: color("--fc-text-primary"),
              },
            });
            valueOnly.position.set(box.x, point.y - 6);
            const small = {
              x: valueOnly.x,
              y: valueOnly.y,
              w: valueOnly.width,
              h: valueOnly.height,
            };
            if (
              !labelBoxes.some(
                (b) =>
                  small.x < b.x + b.w &&
                  small.x + small.w > b.x &&
                  small.y < b.y + b.h &&
                  small.y + small.h > b.y,
              )
            ) {
              scene.addChild(valueOnly);
              labelBoxes.push(small);
            } else valueOnly.destroy();
          }
        }
      }
      // R4B follow-up: łuki relacji PO etykietach -- omijają faktycznie narysowane
      // nazwy regionów (nazwa > morfologia > kierunek wymiany).
      let hiddenDashes = 0;
      let arrowsBlocked = 0;
      const self = ui.selectedEntityId ? positions.get(ui.selectedEntityId) : undefined;
      const other = trade?.pair ? positions.get(trade.pair.partnerRegionId) : undefined;
      if (trade?.pair && self && other) {
        const arcs = new Graphics();
        scene.addChild(arcs);
        const directions = [
          ...(trade.pair.imports ? [[other, self] as const] : []),
          ...(trade.pair.exports ? [[self, other] as const] : []),
        ];
        for (const [from, to] of directions) {
          const arc = tradeRelationArc(from, to, {
            dash: px(7),
            gap: px(5),
            head: px(10),
            trim: TRADE_RING + px(4),
            avoid: labelBoxes,
            avoidPad: px(3),
          });
          hiddenDashes += arc.hiddenDashes;
          if (!arc.arrowClear) arrowsBlocked += 1;
          for (const [a, b] of arc.dashes) arcs.moveTo(a.x, a.y).lineTo(b.x, b.y);
          arcs.stroke({ color: info, width: px(2.5) });
          const [l, tip, r] = arc.arrow;
          arcs
            .moveTo(l.x, l.y)
            .lineTo(tip.x, tip.y)
            .lineTo(r.x, r.y)
            .stroke({ color: info, width: px(2.5) });
        }
      }
      // Testy E2E: grot nigdy nie stoi na etykiecie; liczba kresek ustępujących nazwom.
      host.current?.setAttribute("data-trade-arrows-blocked", String(arrowsBlocked));
      host.current?.setAttribute("data-trade-hidden-dashes", String(hiddenDashes));
      renderer.render();
      host.current?.setAttribute(
        "data-rendered-tick",
        String(view.current.summary.currentTick),
      );
      host.current?.setAttribute("data-rendered-mode", ui.mapMode);
      // R4B (testy E2E): soczewka faktycznie użyta i liczba narysowanych przepływów.
      host.current?.setAttribute("data-flow-lens", effectiveFlowLens(ui.flowLens));
      host.current?.setAttribute("data-flow-count", String(relevantFlows.length));
      // R4B (testy E2E): wyróżnienia handlu faktycznie narysowane.
      host.current?.setAttribute("data-trade-good", trade?.goodId ?? "");
      host.current?.setAttribute(
        "data-trade-partners",
        trade ? [...trade.partnerRegionIds].sort().join(",") : "",
      );
      host.current?.setAttribute(
        "data-trade-pair",
        trade?.pair && ui.selectedEntityId
          ? [
              ui.selectedEntityId,
              trade.pair.partnerRegionId,
              [
                ...(trade.pair.imports ? ["import"] : []),
                ...(trade.pair.exports ? ["export"] : []),
              ].join("+"),
            ].join("|")
          : "",
      );
      host.current?.setAttribute("data-semantic-zoom", grammar.zoom);
      // R3 (testy E2E): klasy morfologii faktycznie narysowane -- niezależne od locale.
      // R4: także w trybie Population (ta sama morfologia co w Terrain).
      host.current?.setAttribute(
        "data-settlement-classes",
        ui.overlays.includes("settlements")
          ? [...new Set(grammar.regions.flatMap((r) => r.settlements.map((p) => p.cls)))]
              .sort(
                (a, b) => MORPHOLOGY_CLASSES.indexOf(a) - MORPHOLOGY_CLASSES.indexOf(b),
              )
              .join(",")
          : "",
      );
      // R4 (testy E2E): fakty populacji użyte przez warstwę -- `id=wartość`, `id=none`
      // dla braku danych; niezależne od locale i poziomu zoomu.
      host.current?.setAttribute(
        "data-population-facts",
        [...populationLayer.values()]
          .map((m) => `${m.regionId}=${m.fact.kind === "known" ? m.fact.value : "none"}`)
          .sort()
          .join(","),
      );
      host.current?.setAttribute(
        "data-population-states",
        populationMode
          ? [...populationLayer.values()]
              .map((m) => `${m.regionId}=${m.state}`)
              .sort()
              .join(",")
          : "",
      );
      // R4.1 (testy E2E): kształt znacznika zaznaczenia -- w Population narożniki, nie okrąg.
      host.current?.setAttribute(
        "data-selection-marker",
        ui.selectedEntityId ? (populationMode ? "brackets" : "outline") : "",
      );
      // Tożsamość morfologii (osada:klasa:wariant[m]) -- dowód, że tryb nie zmienia osady.
      host.current?.setAttribute(
        "data-settlement-identity",
        ui.overlays.includes("settlements")
          ? grammar.regions
              .flatMap((r) =>
                r.settlements.map(
                  (p) =>
                    `${p.settlementId}:${p.cls}:${p.variant.index}${p.variant.mirror ? "m" : ""}`,
                ),
              )
              .sort()
              .join(",")
          : "",
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    ready,
    view,
    ui,
    pan,
    size,
    resourceId,
    discoveryId,
    i18n.language,
    t,
    grammar,
    symbolsOpen,
    populationLayer,
    populationMode,
    tradeMode,
    trade,
  ]);
  // Legenda obejmuje tylko zakres istniejących osad (§28.3: z danych, nie ze stałych progów),
  // więc nie zajmuje więcej miejsca niż kodowane elementy (UI Impl Spec v1.4 §L.8).
  const populations = view.current.regions.flatMap((r) =>
    r.settlements.map((s) => s.population),
  );
  const largest = Math.max(0, ...populations);
  // R4: rzędy wielkości pierścieni z zakresu danych (znane populacje > 0).
  const ringSteps = populationLegendSteps(populationLayer);
  // R3: próbki klas morfologii od najmniejszej do największej obecnej klasy.
  const classRange = populations.length
    ? MORPHOLOGY_CLASSES.slice(
        MORPHOLOGY_CLASSES.indexOf(morphologyClass(Math.min(...populations))),
        MORPHOLOGY_CLASSES.indexOf(morphologyClass(largest)) + 1,
      )
    : [];
  return (
    <div
      className="fc-atlas"
      onWheel={(event) =>
        ui.set({
          zoomLevel: Math.max(
            0.6,
            Math.min(3, ui.zoomLevel + (event.deltaY < 0 ? 0.1 : -0.1)),
          ),
        })
      }
      onPointerDown={(event) => {
        drag.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={() => {
        drag.current = undefined;
      }}
      onPointerLeave={() => {
        drag.current = undefined;
      }}
      onPointerMove={(event) => {
        if (!drag.current || event.buttons !== 1) return;
        const dx = event.clientX - drag.current.x,
          dy = event.clientY - drag.current.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) {
          setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
          ui.set({ focusMode: false });
        }
        drag.current = { x: event.clientX, y: event.clientY };
      }}
    >
      <div
        ref={host}
        className="fc-atlas__canvas"
        data-testid="living-atlas"
        aria-label={t("world.atlas")}
      />
      {failed && <p role="status">{t("world.canvasUnavailable")}</p>}
      <div className="fc-atlas__caption" ref={captionBox}>
        {caption}
        <p>{t("world.schematic")}</p>
        {ui.causalLink && (
          <p>
            {t(
              ui.causalLink.from === ui.causalLink.to
                ? "world.causalLocal"
                : "world.causalRelation",
            )}
          </p>
        )}
      </div>
      <div
        className="fc-atlas__legend"
        ref={legendBox}
        data-testid="atlas-legend"
        data-legend-mode={populationMode ? "population" : ui.mapMode}
      >
        {populationMode ? (
          // R4: legenda aktywnego trybu -- te same prymitywy co warstwa na mapie.
          <>
            <div className="fc-atlas__legend-row" data-testid="population-legend">
              <strong>{t("world.population.legendTitle")}</strong>
              {ringSteps.map((n) => (
                <span key={n} data-population-step={n}>
                  <FCPopulationSample
                    primitives={populationRingPrimitives(populationRingRadius(n))}
                    radius={populationRingRadius(n)}
                    pxPerUnit={POPULATION_LEGEND_PX}
                  />
                  ~{formatPopulationCompact(n, i18n.language)}
                  {n === POPULATION_LEGEND_MAX ? "+" : ""}
                </span>
              ))}
            </div>
            <div className="fc-atlas__legend-row">
              <span data-population-legend-state="zero">
                <FCPopulationSample
                  primitives={zeroPopulationPrimitives()}
                  radius={POPULATION_RING.markerRadius}
                  pxPerUnit={POPULATION_STATE_PX}
                />
                {t("world.population.zeroLegend")}
              </span>
              <span data-population-legend-state="unavailable">
                <FCPopulationSample
                  primitives={noPopulationDataPrimitives()}
                  radius={POPULATION_RING.markerRadius}
                  pxPerUnit={POPULATION_STATE_PX}
                />
                {t("world.population.noDataLegend")}
              </span>
            </div>
          </>
        ) : (
          <>
            {tradeMode && (
              // R4B: legenda Handlu -- te same znaki co warstwa wyróżnień na mapie.
              <div className="fc-atlas__legend-row" data-testid="trade-legend">
                <strong>{t("world.trade.legend.title")}</strong>
                <span data-trade-legend="selected">
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="none"
                      stroke="var(--fc-accent)"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {t("world.trade.legend.selected")}
                </span>
                <span data-trade-legend="partner">
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="none"
                      stroke="var(--fc-info)"
                      strokeWidth="2"
                    />
                  </svg>
                  {t("world.trade.legend.partner")}
                </span>
                <span data-trade-legend="relation">
                  <svg width="28" height="16" viewBox="0 0 28 16" aria-hidden="true">
                    <path
                      d="M2 13 Q14 1 26 13"
                      fill="none"
                      stroke="var(--fc-info)"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    <path
                      d="M11 4.5 L15 7 L11 9.5"
                      fill="none"
                      stroke="var(--fc-info)"
                      strokeWidth="2"
                    />
                  </svg>
                  {t("world.trade.legend.relation")}
                </span>
                {!trade && <small>{t("world.trade.legend.hint")}</small>}
                <small data-testid="trade-flow-lens-note">
                  {t("world.flow.tradeUnavailableHint")}
                </small>
              </div>
            )}
            {classRange.length > 0 && (
              <div
                className="fc-atlas__legend-row"
                data-testid="settlement-scale-legend"
                data-legend-mode="terrain"
              >
                <strong>{t("world.atlas.settlementScale")}</strong>
                {classRange.map((cls) => (
                  <span key={cls} data-settlement-class={cls}>
                    <FCSettlementSample population={MORPHOLOGY_CLASS_SAMPLE[cls]} />
                    {t(`world.atlas.settlementClass.${cls}`, { defaultValue: cls })}{" "}
                    <small>
                      ~
                      {formatPopulationCompact(
                        MORPHOLOGY_CLASS_SAMPLE[cls],
                        i18n.language,
                      )}
                    </small>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
        {grammar.legend.length > 0 && (
          <button
            type="button"
            className="fc-atlas__symbols-toggle"
            aria-expanded={symbolsOpen}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setSymbolsChoice(!symbolsOpen)}
          >
            {symbolsOpen ? "▾" : "▸"} {t("world.atlas.symbols")} ({grammar.legend.length})
          </button>
        )}
        {grammar.legend.length > 0 && symbolsOpen && (
          // Klucz znaków: wyłącznie klasy faktycznie narysowane w bieżącym widoku.
          <ul className="fc-atlas__symbols" aria-label={t("world.atlas.symbols")}>
            {grammar.legend.map((entry) => {
              const label = legendLabel(entry);
              return (
                <li key={`${entry.cls}:${label.key}`} data-legend-class={entry.cls}>
                  <FCAtlasGlyph entry={entry} />
                  {t(label.key, { defaultValue: label.fallback })}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="fc-atlas__zoom">
        <button
          onClick={() => ui.set({ zoomLevel: Math.min(3, ui.zoomLevel + 0.25) })}
          aria-label={t("world.zoomIn")}
        >
          +
        </button>
        <button
          onClick={() => ui.set({ zoomLevel: Math.max(0.6, ui.zoomLevel - 0.25) })}
          aria-label={t("world.zoomOut")}
        >
          −
        </button>
        <button
          onClick={() => {
            setPan({ x: 0, y: 0 });
            ui.set({ zoomLevel: 1, focusMode: false });
          }}
        >
          {t("world.resetView")}
        </button>
      </div>
    </div>
  );
}
