import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Application } from "pixi.js";
import type { WorldView } from "@first-cause/simulation";
import {
  atlasPositions,
  fitAtlas,
  MODE_METRICS,
  populationRadius,
  type AtlasInsets,
} from "./atlas-model.js";
import { useWorldStore } from "./world-store.js";
import { drawProfileAlphabet, settlementBlocks } from "./visual-alphabet.js";

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
        const row = region.settlements.reduce(
          (sum, s) => sum + populationRadius(s.population) * 2 + 12,
          0,
        );
        bounds.minX = Math.min(bounds.minX, p.x - 30);
        bounds.maxX = Math.max(bounds.maxX, p.x + Math.max(44, row));
        bounds.minY = Math.min(bounds.minY, p.y - 40);
        bounds.maxY = Math.max(bounds.maxY, p.y + 60);
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
      if (ui.overlays.includes("connections"))
        for (const link of view.current.connections) {
          const a = positions.get(link.from),
            b = positions.get(link.to);
          if (!a || !b) continue;
          if (
            ui.focusMode &&
            link.from !== ui.selectedEntityId &&
            link.to !== ui.selectedEntityId
          )
            continue;
          lines
            .moveTo(a.x, a.y)
            .lineTo(b.x, b.y)
            .stroke({ color: color("--fc-border-strong"), width: 1 });
        }
      const relevantFlows = view.current.flows
        .filter(
          (f) =>
            f.family === ui.flowLens &&
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
      const regions = [...view.current.regions].sort(
        (a, b) =>
          Number(
            b.regionId === ui.selectedEntityId || b.regionId === ui.hoveredRegionId,
          ) -
            Number(
              a.regionId === ui.selectedEntityId || a.regionId === ui.hoveredRegionId,
            ) || b.population - a.population,
      );
      let budget = ui.zoomLevel < 0.8 ? 5 : ui.zoomLevel < 1.6 ? 12 : 32;
      for (const region of regions) {
        const point = positions.get(region.regionId)!;
        const selected = ui.selectedEntityId === region.regionId;
        const value = values.get(region.regionId);
        const intensity =
          value === undefined || value === 0
            ? 1
            : 0.3 + 0.7 * Math.sqrt(Math.abs(value) / maxValue);
        const signed = ui.mapMode === "population" || ui.mapMode === "change";
        const fill =
          value === undefined || value === 0
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
        const marker = new Graphics()
          .circle(0, 0, 4)
          .fill({ color: fill, alpha: intensity });
        node.addChild(marker);
        if (ui.overlays.includes("settlements"))
          region.settlements.forEach((settlement, index) => {
            const radius = populationRadius(settlement.population);
            const offset = index * (radius * 2 + 12);
            const g = new Graphics();
            if (ui.mapMode === "population")
              g.circle(offset, 0, radius).fill({ color: fill, alpha: intensity });
            else {
              const blocks = settlementBlocks(settlement.population);
              const unit = (radius * 2) / Math.ceil(Math.sqrt(blocks.length));
              for (const b of blocks)
                g.rect(
                  offset + b.x * unit - unit * 0.4,
                  b.y * unit - unit * 0.4,
                  unit * 0.8,
                  unit * 0.8,
                ).fill({ color: fill, alpha: intensity });
            }
            node.addChild(g);
            if (selected)
              g.circle(offset, 0, radius + 5).stroke({ color: accent, width: 2 });
          });
        if (ui.overlays.includes("settlements") && (selected || ui.zoomLevel >= 1.6)) {
          const profileMarks = new Graphics();
          profileMarks.y =
            Math.max(
              0,
              ...region.settlements.map((s) => populationRadius(s.population)),
            ) + 4;
          drawProfileAlphabet(profileMarks, region.profile, neutral);
          node.addChild(profileMarks);
        }
        if (selected && !region.settlements.length)
          marker.circle(0, 0, 12).stroke({ color: accent, width: 2 });
        if (ui.hoveredRegionId === region.regionId)
          marker.circle(0, 0, 44).stroke({ color: accent, width: 1 });
        if (
          (ui.overlays.includes("resources") || ui.mapMode === "resources") &&
          region.deposits.some(
            (d) =>
              d.quantity !== undefined &&
              (!resourceId || d.resourceDefinitionId === resourceId),
          )
        ) {
          marker.rect(-5, 18, 10, 10).fill(color("--fc-warning"));
        }
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
        const metricLabel =
          value === undefined
            ? "—"
            : `${signed ? "Δ " : ""}${signed && value > 0 ? "+" : ""}${value.toLocaleString(i18n.language, { maximumFractionDigits: 1 })}`;
        const label = new Text({
          resolution: Math.max(1, scale * window.devicePixelRatio),
          text:
            ui.mapMode === "terrain"
              ? region.name
              : `${region.name}\n${ui.mapMode === "population" ? `${region.population.toLocaleString(i18n.language)} · ` : ""}${metricLabel}`,
          style: {
            fontFamily: "IBM Plex Sans",
            fontSize: 13 / Math.max(0.5, scale),
            fill: color("--fc-text-primary"),
          },
        });
        label.position.set(point.x + 44, point.y - 12);
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
        } else label.destroy();
      }
      renderer.render();
      host.current?.setAttribute(
        "data-rendered-tick",
        String(view.current.summary.currentTick),
      );
      host.current?.setAttribute("data-rendered-mode", ui.mapMode);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, view, ui, pan, size, resourceId, discoveryId, i18n.language]);
  // Legenda obejmuje tylko zakres istniejących osad (do pierwszego progu >= największej),
  // więc nie zajmuje więcej miejsca niż kodowane elementy (UI Impl Spec v1.4 §L.8).
  const largest = Math.max(
    0,
    ...view.current.regions.flatMap((r) => r.settlements.map((s) => s.population)),
  );
  const legendSteps = [1000, 10000, 100000].filter(
    (_, i, all) => i === 0 || all[i - 1]! < largest,
  );
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
      <div className="fc-atlas__legend" ref={legendBox}>
        <strong>{t("world.markerPopulation")}</strong>
        <br />
        {legendSteps.map((n) => (
          <span key={n}>
            <i
              style={{
                width: populationRadius(n) * 2,
                height: populationRadius(n) * 2,
                borderRadius: ui.mapMode === "population" ? "50%" : 0,
              }}
            />
            {n.toLocaleString(i18n.language)}
          </span>
        ))}
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
