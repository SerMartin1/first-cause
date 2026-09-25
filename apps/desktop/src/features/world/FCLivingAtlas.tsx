import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Application } from "pixi.js";
import type { WorldView } from "@first-cause/simulation";
import { atlasPositions, MODE_METRICS, populationRadius } from "./atlas-model.js";
import { useWorldStore } from "./world-store.js";

export function FCLivingAtlas({
  view,
  resourceId,
  discoveryId,
}: {
  readonly view: WorldView;
  readonly resourceId: string;
  readonly discoveryId: string;
}) {
  const { t, i18n } = useTranslation();
  const host = useRef<HTMLDivElement>(null);
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
      const scale =
        Math.min(renderer.screen.width / 960, renderer.screen.height / 640) *
        ui.zoomLevel;
      const positions = atlasPositions(view.current);
      const focus =
        ui.focusMode && ui.selectedEntityId
          ? positions.get(ui.selectedEntityId)
          : undefined;
      scene.scale.set(scale);
      scene.position.set(
        focus ? renderer.screen.width / 2 - focus.x * scale : pan.x,
        focus ? renderer.screen.height / 2 - focus.y * scale : pan.y,
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
            const g = new Graphics()
              .circle(offset, 0, radius)
              .fill({ color: fill, alpha: intensity })
              .stroke({ color: color("--fc-bg-elevated"), width: 2 });
            node.addChild(g);
            if (selected)
              g.circle(offset, 0, radius + 5).stroke({ color: accent, width: 2 });
          });
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
          text: `${region.name}\n${ui.mapMode === "population" ? `${region.population.toLocaleString(i18n.language)} · ` : ""}${metricLabel}`,
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
    });
    return () => {
      cancelled = true;
    };
  }, [ready, view, ui, pan, size, resourceId, discoveryId, i18n.language]);
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
      <div className="fc-atlas__caption">
        {t("world.schematic")}
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
      <div className="fc-atlas__legend">
        <strong>{t("world.markerPopulation")}</strong>
        <br />
        {[1000, 10000, 100000].map((n) => (
          <span key={n}>
            <i
              style={{ width: populationRadius(n) * 2, height: populationRadius(n) * 2 }}
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
