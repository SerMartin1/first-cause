import { createRoot } from "react-dom/client";
import {
  settlementMorphology,
  type MorphologyDetail,
} from "../src/features/world/settlement-morphology.js";
import {
  INK_TOKEN,
  type Ink,
  type Primitive,
} from "../src/features/world/visual-alphabet.js";
import "@fontsource/ibm-plex-sans/400.css";
import "../src/index.css";

/**
 * M21-VIS-R3 harness: arkusz morfologii osad w dużej skali (VISUAL
 * DEVELOPMENT DATA). Wiersze: populacje 10 → 10M+; kolumny: trzy autorskie
 * warianty (różne id) na poziomie REGION oraz ta sama osada na WORLD i
 * LOCAL. Wszystkie znaki w tej samej skali px/jednostkę -- rozmiar jest
 * porównywalny między wierszami, jak na mapie.
 */
const POPULATIONS = [12, 120, 1_200, 12_000, 120_000, 1_200_000, 12_000_000];
const LABELS = ["~10", "~100", "~1k", "~10k", "~100k", "~1M", "~10M+"];
const COLUMNS: readonly { id: string; detail: MorphologyDetail; title: string }[] = [
  { id: "sheet_a", detail: "REGION", title: "variant · id A" },
  { id: "sheet_b", detail: "REGION", title: "variant · id B" },
  { id: "sheet_c", detail: "REGION", title: "variant · id C" },
  { id: "sheet_a", detail: "WORLD", title: "id A · WORLD" },
  { id: "sheet_a", detail: "LOCAL", title: "id A · LOCAL" },
];
/** px na jednostkę diagramu (mapa przy 1920×1080 ma ~1.3; tu powiększenie dla oceny kształtu). */
const SCALE = 4;
const CELL = 30 * 2 * SCALE;

const color = (ink: Ink | undefined) => (ink ? `var(${INK_TOKEN[ink]})` : "none");

function Shapes({ primitives }: { readonly primitives: readonly Primitive[] }) {
  return (
    <>
      {primitives.map((p, i) =>
        p.kind === "circle" ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={color(p.fill)}
            opacity={p.alpha ?? 1}
          />
        ) : (
          <polyline
            key={i}
            points={[...p.points, ...(p.closed ? p.points.slice(0, 2) : [])].join(" ")}
            fill={p.closed ? color(p.fill) : "none"}
            stroke={color(p.stroke)}
            strokeWidth={p.width ?? 1}
            opacity={p.alpha ?? 1}
          />
        ),
      )}
    </>
  );
}

function Sheet() {
  return (
    <table
      style={{
        borderCollapse: "collapse",
        font: "12px IBM Plex Sans",
        background: "var(--fc-bg)",
      }}
    >
      <thead>
        <tr>
          <th />
          {COLUMNS.map((c) => (
            <th key={c.title} style={{ padding: 4 }}>
              {c.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {POPULATIONS.map((population, row) => (
          <tr key={population}>
            <th style={{ padding: 4, textAlign: "right" }}>{LABELS[row]}</th>
            {COLUMNS.map((c) => {
              const m = settlementMorphology({
                settlementId: `${c.id}_${row}`,
                population,
                detail: c.detail,
              });
              return (
                <td
                  key={c.title}
                  style={{ border: "1px solid var(--fc-border)", padding: 0 }}
                >
                  <svg
                    width={CELL}
                    height={CELL}
                    viewBox="-30 -30 60 60"
                    data-cls={m.cls}
                    data-primitives={m.primitives.length}
                  >
                    <circle r={30} fill="var(--fc-atlas-ground)" opacity={0.75} />
                    <g style={{ color: "var(--fc-text-secondary)" }}>
                      <Shapes primitives={m.primitives} />
                    </g>
                  </svg>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

createRoot(document.getElementById("root")!).render(<Sheet />);
