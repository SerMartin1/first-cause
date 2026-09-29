import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import en from "../../../../../locales/en/common.json";
import pl from "../../../../../locales/pl/common.json";
import { MODE_METRICS } from "./atlas-model.js";
import { buildAtlasGrammar } from "./atlas-grammar.js";
import { FCLivingAtlas } from "./FCLivingAtlas.js";
import {
  buildPopulationLayer,
  noPopulationDataPrimitives,
  populationFact,
  populationLegendSteps,
  populationMark,
  populationMarkPrimitives,
  populationRingPrimitives,
  populationRingRadius,
  populationState,
  POPULATION_RING,
  POPULATION_RING_MAX,
  zeroPopulationPrimitives,
} from "./population-mode.js";
import {
  FOOTPRINT_CONTROL_POINTS,
  morphologyExtent,
  settlementMorphology,
} from "./settlement-morphology.js";
import { REGION_FIELD_RADIUS } from "./visual-alphabet.js";
import { useWorldStore } from "./world-store.js";
import {
  NO_DATA_REGION_ID,
  POPULATION_LADDER,
  populationCivilizationView,
  populationLadderView,
  ZERO_REGION_ID,
  zeroVsNoDataView,
} from "./visual-population-fixture.js";

// Płótno PixiJS nie istnieje w jsdom -- Atlas przechodzi w stan „canvas unavailable”,
// a legenda (DOM React) renderuje się normalnie i jest przedmiotem testu.
vi.mock("pixi.js", () => {
  throw new Error("no WebGL in jsdom");
});
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    disconnect() {}
  },
);

const ctx = { resourceId: "", discoveryId: "" };

beforeEach(() => {
  useWorldStore.setState(useWorldStore.getInitialState());
});

describe("M21-VIS-R4 -- population scale", () => {
  const ladder = [
    1, 5, 10, 12, 50, 100, 120, 500, 1_000, 1_200, 5_000, 10_000, 12_000, 50_000, 100_000,
    120_000, 500_000, 1_000_000, 1_200_000, 5_000_000, 10_000_000, 12_000_000,
    100_000_000, 1e12,
  ];

  it("A: ring radius is monotonic in population (never smaller for a larger population)", () => {
    for (let i = 1; i < ladder.length; i++)
      expect(populationRingRadius(ladder[i]!)).toBeGreaterThanOrEqual(
        populationRingRadius(ladder[i - 1]!),
      );
    // Rzędy wielkości są rozróżnialne: każdy krok ×10 w zakresie 10..10M powiększa pierścień.
    for (let p = 10; p < 10_000_000; p *= 10)
      expect(populationRingRadius(p * 10) - populationRingRadius(p)).toBeGreaterThan(2);
  });

  it("A: is logarithmic, not linear -- 10M is not 1000× the ring of 10k", () => {
    expect(populationRingRadius(10_000_000) / populationRingRadius(10_000)).toBeLessThan(
      3,
    );
    expect(populationRingRadius(10_000_000) / populationRingRadius(10)).toBeLessThan(10);
  });

  it("B: 10 → 10M+ stays within the visual budget (≈1.35–1.5 × max R3 footprint, inside the region field)", () => {
    const maxFootprint =
      FOOTPRINT_CONTROL_POINTS[FOOTPRINT_CONTROL_POINTS.length - 1]![1];
    expect(POPULATION_RING_MAX / maxFootprint).toBeGreaterThanOrEqual(1.35);
    expect(POPULATION_RING_MAX / maxFootprint).toBeLessThanOrEqual(1.5);
    for (const p of ladder) {
      expect(populationRingRadius(p)).toBeLessThanOrEqual(POPULATION_RING_MAX);
      expect(populationRingRadius(p)).toBeLessThan(REGION_FIELD_RADIUS);
    }
  });

  it("the ring always clears the morphology of the largest settlement (never covers R3)", () => {
    for (const p of [12, 120, 1_200, 12_000, 120_000, 1_200_000, 12_000_000])
      for (const detail of ["WORLD", "REGION", "LOCAL"] as const) {
        const m = settlementMorphology({
          settlementId: `ring_${p}`,
          population: p,
          detail,
        });
        const mark = populationMark({
          regionId: "r",
          population: p,
          settlements: [{ settlementId: `ring_${p}`, population: p }],
        } as never);
        // Prymitywy morfologii mieszczą się w śladzie z tolerancją jednego śladu zabudowy.
        expect(mark.radius).toBeGreaterThan(morphologyExtent(m.primitives) - 1.5);
        expect(mark.radius).toBeGreaterThanOrEqual(m.radius + POPULATION_RING.gap);
      }
  });

  it("ring is a simple neutral primitive pair: no warning/negative inks, no gradients", () => {
    const ring = populationRingPrimitives(20);
    expect(ring).toHaveLength(2);
    for (const p of [
      ...ring,
      ...zeroPopulationPrimitives(),
      ...noPopulationDataPrimitives(),
    ])
      expect(["ink", "muted"]).toContain(p.fill ?? p.stroke);
  });

  it("budget: the most complex Megacity plus its ring stays within 60 primitives", () => {
    let max = 0;
    for (const id of ["a", "b", "c", "d", "e", "f"])
      for (const detail of ["WORLD", "REGION", "LOCAL"] as const)
        max = Math.max(
          max,
          settlementMorphology({ settlementId: id, population: 12_000_000, detail })
            .primitives.length,
        );
    expect(
      max + populationRingPrimitives(POPULATION_RING_MAX).length,
    ).toBeLessThanOrEqual(60);
  });
});

describe("M21-VIS-R4 -- zero ≠ no data", () => {
  it("C: population = 0 stays a known 0", () => {
    expect(populationFact(0)).toEqual({ kind: "known", value: 0 });
    expect(populationState(populationFact(0))).toBe("zero");
  });

  it("D: unavailable population never becomes 0", () => {
    for (const missing of [undefined, null, Number.NaN, Infinity, -5])
      expect(populationFact(missing)).toEqual({ kind: "unavailable" });
    const region = { regionId: "x", population: undefined } as never;
    expect(MODE_METRICS.population(region, {} as never, ctx)).toBeUndefined();
    expect(
      MODE_METRICS.population(
        { regionId: "x", population: 0 } as never,
        {} as never,
        ctx,
      ),
    ).toBe(0);
  });

  it("E: 0 and unavailable render different primitives (solid vs dashed, ink vs muted)", () => {
    const zero = populationMarkPrimitives(populationFact(0), 5);
    const none = populationMarkPrimitives(populationFact(undefined), 5);
    expect(zero).not.toEqual(none);
    expect(zero).toEqual([expect.objectContaining({ kind: "circle", stroke: "ink" })]);
    expect(none.length).toBe(POPULATION_RING.dashSegments);
    expect(none.every((p) => p.kind === "poly" && p.stroke === "muted" && !p.fill)).toBe(
      true,
    );
    // Dodatnia populacja to trzeci, odrębny znak (pierścień z wypełnieniem).
    expect(populationMarkPrimitives(populationFact(10), 5)).toEqual(
      populationRingPrimitives(5),
    );
  });

  it("full path: fixture read model → view → Population metric → layer → legend/label keep 0 ≠ no data", async () => {
    const view = zeroVsNoDataView();
    const zero = view.current.regions.find((r) => r.regionId === ZERO_REGION_ID)!;
    const none = view.current.regions.find((r) => r.regionId === NO_DATA_REGION_ID)!;
    // Źródło: te same parametry poza stanem populacji.
    expect(zero.profile.terrain).toBe(none.profile.terrain);
    expect(zero.settlements).toEqual(none.settlements);
    expect(zero.population).toBe(0);
    expect(none.population).toBeUndefined();
    // Selektor trybu.
    expect(MODE_METRICS.population(zero, view.current, ctx)).toBe(0);
    expect(MODE_METRICS.population(none, view.current, ctx)).toBeUndefined();
    // Warstwa Atlasu.
    const layer = buildPopulationLayer(view.current);
    expect(layer.get(ZERO_REGION_ID)!.state).toBe("zero");
    expect(layer.get(NO_DATA_REGION_ID)!.state).toBe("unavailable");
    // Legenda Atlasu w trybie Population objaśnia oba stany osobno.
    useWorldStore.getState().set({ mapMode: "population" });
    renderAtlas(view);
    const legend = await screen.findByTestId("atlas-legend");
    expect(legend).toHaveAttribute("data-legend-mode", "population");
    expect(
      legend.querySelector('[data-population-legend-state="zero"]'),
    ).toHaveTextContent(en["world.population.zeroLegend"]);
    expect(
      legend.querySelector('[data-population-legend-state="unavailable"]'),
    ).toHaveTextContent(en["world.population.noDataLegend"]);
    // Etykiety nie są ani „NaN”, ani „0” dla braku danych.
    expect(en["world.population.noDataLabel"]).not.toMatch(/0|NaN/);
    expect(en["world.population.zeroLabel"]).toMatch(/^0/);
    expect(pl["world.population.noDataLabel"]).not.toMatch(/0|NaN/);
  });

  it("ladder fixture covers 0, ~10 … ~10M+ and no data in one view", () => {
    const layer = buildPopulationLayer(populationLadderView().current);
    const states = POPULATION_LADDER.map((r) => layer.get(r.id)!.state);
    expect(states[0]).toBe("zero");
    expect(states.at(-1)).toBe("unavailable");
    expect(states.slice(1, -1).every((s) => s === "populated")).toBe(true);
    const radii = POPULATION_LADDER.slice(1, -1).map((r) => layer.get(r.id)!.radius);
    expect([...radii].sort((a, b) => a - b)).toEqual(radii);
    expect(populationLegendSteps(layer)).toEqual([
      100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000,
    ]);
  });
});

describe("M21-VIS-R4 -- modes, zoom and data", () => {
  const view = populationCivilizationView();

  it("F/G: Terrain and Population share the same settlement class and deterministic morphology", () => {
    // Opcje gramatyki, które Atlas liczy dla obu trybów (zasoby tylko w trybie Resources / overlay).
    const terrain = buildAtlasGrammar(view.current, {
      zoomLevel: 1,
      showResources: false,
    });
    const population = buildAtlasGrammar(view.current, {
      zoomLevel: 1,
      showResources: false,
    });
    expect(population.regions.map((r) => r.settlements)).toEqual(
      terrain.regions.map((r) => r.settlements),
    );
    for (const region of terrain.regions)
      for (const s of region.settlements)
        expect(settlementMorphology({ ...s, detail: terrain.zoom }).primitives).toEqual(
          settlementMorphology({ ...s, detail: population.zoom }).primitives,
        );
  });

  it("H/I: WORLD / REGION / LOCAL change detail, never the population fact or settlement identity", () => {
    const grammars = [0.6, 1, 2].map((zoomLevel) =>
      buildAtlasGrammar(view.current, { zoomLevel, showResources: false }),
    );
    expect(grammars.map((g) => g.zoom)).toEqual(["WORLD", "REGION", "LOCAL"]);
    const identity = (g: (typeof grammars)[number]) =>
      g.regions.map((r) =>
        r.settlements
          .slice(0, 3)
          .map((s) => `${s.settlementId}:${s.cls}:${s.variant.index}`),
      );
    expect(identity(grammars[1]!)).toEqual(identity(grammars[0]!));
    expect(identity(grammars[2]!)).toEqual(identity(grammars[0]!));
    // Warstwa Population nie ma wejścia zoomu -- ten sam fakt i promień bazowy.
    expect(buildPopulationLayer(view.current)).toEqual(
      buildPopulationLayer(view.current),
    );
  });

  it("M: Population mode and its layer never mutate the read model", () => {
    const before = JSON.stringify(view);
    buildPopulationLayer(view.current);
    for (const r of view.current.regions) MODE_METRICS.population(r, view.current, ctx);
    expect(JSON.stringify(view)).toBe(before);
  });

  it("J/K/L: legend follows the single active mode; Terrain legend is not reused for Population", async () => {
    renderAtlas(view);
    const legend = await screen.findByTestId("atlas-legend");
    expect(legend).toHaveAttribute("data-legend-mode", "terrain");
    expect(screen.getByTestId("settlement-scale-legend")).toBeInTheDocument();
    expect(screen.queryByTestId("population-legend")).toBeNull();
    act(() => useWorldStore.getState().set({ mapMode: "population" }));
    expect(legend).toHaveAttribute("data-legend-mode", "population");
    expect(screen.getByTestId("population-legend")).toBeInTheDocument();
    expect(screen.queryByTestId("settlement-scale-legend")).toBeNull();
    expect(useWorldStore.getState().mapMode).toBe("population");
    // Klucz znaków aktywności jest w Population domyślnie zwinięty, ale dostępny.
    const toggle = screen.getByRole("button", { name: /atlas symbols/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    act(() => useWorldStore.getState().set({ mapMode: "terrain" }));
    expect(legend).toHaveAttribute("data-legend-mode", "terrain");
    expect(screen.queryByTestId("population-legend")).toBeNull();
  });

  it("N: population presentation modules never use Math.random()", () => {
    for (const file of [
      "population-mode.ts",
      "visual-population-fixture.ts",
      "FCLivingAtlas.tsx",
    ])
      expect(
        readFileSync(path.resolve("apps/desktop/src/features/world", file), "utf8"),
      ).not.toMatch(/Math\.random\s*\(/);
  });
});

function renderAtlas(view: ReturnType<typeof zeroVsNoDataView>) {
  return render(
    <I18nextProvider
      i18n={createI18n({ resources: { en: { common: en }, pl: { common: pl } } })}
    >
      <FCLivingAtlas view={view} resourceId="" discoveryId="" />
    </I18nextProvider>,
  );
}
