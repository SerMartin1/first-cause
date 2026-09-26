import type { LegendEntry } from "./atlas-grammar.js";
import {
  INK_TOKEN,
  extractionGlyph,
  industryGlyph,
  resourceGlyph,
  routePrimitives,
  routeStyle,
  type Ink,
  type Primitive,
} from "./visual-alphabet.js";

/** Te same prymitywy co renderer PixiJS -- legenda pokazuje dokładnie znak z mapy (Atlas Spec v1.3 §4A). */
function primitivesFor(entry: LegendEntry): Primitive[] {
  switch (entry.cls) {
    case "industry":
      return industryGlyph(entry.sector, 3, "active");
    case "extraction":
      return extractionGlyph(entry.family, "active");
    case "resource":
      return resourceGlyph(entry.renewable, false);
    case "state":
      return entry.state === "depleted" || entry.state === "idle"
        ? extractionGlyph(undefined, entry.state)
        : industryGlyph(undefined, 3, entry.state);
    case "route": {
      const style = routeStyle(entry.family, 2);
      const ink = style.ink === "border" ? "muted" : style.ink;
      return routePrimitives(
        { x: -9, y: 0 },
        { x: 9, y: 0 },
        { ...style, offset: 0 },
        ink,
      );
    }
  }
}

const color = (ink: Ink | undefined) => (ink ? `var(${INK_TOKEN[ink]})` : "none");

export function FCAtlasGlyph({ entry }: { readonly entry: LegendEntry }) {
  return (
    <svg
      className="fc-atlas-glyph"
      viewBox="-10 -10 20 20"
      width={20}
      height={20}
      aria-hidden="true"
    >
      {primitivesFor(entry).map((p, i) =>
        p.kind === "circle" ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={color(p.fill)}
            stroke={color(p.stroke)}
            strokeWidth={p.width ?? 1}
            opacity={p.alpha ?? 1}
          />
        ) : p.closed ? (
          <polygon
            key={i}
            points={p.points.join(" ")}
            fill={color(p.fill)}
            stroke={color(p.stroke)}
            strokeWidth={p.width ?? 1}
            opacity={p.alpha ?? 1}
          />
        ) : (
          <polyline
            key={i}
            points={p.points.join(" ")}
            fill="none"
            stroke={color(p.stroke)}
            strokeWidth={p.width ?? 1}
            opacity={p.alpha ?? 1}
          />
        ),
      )}
    </svg>
  );
}

/** Klucz i18n etykiety pozycji legendy (nieznany sektor / rodzina -> identyfikator z contentu jako fallback). */
export function legendLabel(entry: LegendEntry): { key: string; fallback: string } {
  switch (entry.cls) {
    case "industry":
      return entry.sector
        ? { key: `world.atlas.sector.${entry.sector}`, fallback: entry.sector }
        : { key: "world.atlas.industry", fallback: "industry" };
    case "extraction":
      return entry.family
        ? { key: `world.atlas.extraction.${entry.family}`, fallback: entry.family }
        : { key: "world.atlas.extraction.aggregate", fallback: "extraction" };
    case "resource":
      return {
        key: entry.renewable
          ? "world.atlas.resource.renewable"
          : "world.atlas.resource.finite",
        fallback: "resource",
      };
    case "route":
      return { key: `world.atlas.route.${entry.family}`, fallback: entry.family };
    case "state":
      return { key: `world.atlas.state.${entry.state}`, fallback: entry.state };
  }
}
