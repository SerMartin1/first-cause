import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorldSnapshot } from "@first-cause/simulation";
import {
  classProgress,
  formatPopulationCompact,
  MORPHOLOGY_CLASSES,
  morphologyClass,
  morphologyExtent,
  morphologyVariant,
  settlementFootprint,
  settlementMorphology,
  type MorphologyDetail,
} from "./settlement-morphology.js";
import {
  buildAtlasGrammar,
  layoutSettlements,
  SETTLEMENT_BUDGET,
} from "./atlas-grammar.js";
import { REGION_FIELD_RADIUS, type Primitive } from "./visual-alphabet.js";
import {
  civilizationView,
  LADDER_POPULATIONS,
  morphologyLadderView,
  VARIANT_REGIONS,
} from "./visual-morphology-fixture.js";

const morph = (population: number, id = "s", detail: MorphologyDetail = "REGION") =>
  settlementMorphology({ settlementId: id, population, detail });

/** Rdzenie: pełne wielokąty `ink` (poza śladami zabudowy o 4 wierzchołkach). */
const cores = (ps: readonly Primitive[]) =>
  ps.filter((p) => p.kind === "poly" && p.fill === "ink" && p.points.length > 8).length;
const builtAreas = (ps: readonly Primitive[]) =>
  ps.filter((p) => p.kind === "poly" && p.fill === "urban").length;
const lanes = (ps: readonly Primitive[]) =>
  ps.filter((p) => p.kind === "poly" && !p.closed && p.stroke === "ink").length;
const plots = (ps: readonly Primitive[]) =>
  ps.filter((p) => p.kind === "poly" && p.fill === "ink" && p.points.length === 8).length;

afterEach(() => vi.restoreAllMocks());

describe("settlement morphology -- population → class (A, Atlas Spec §4A.1)", () => {
  it("A: class boundaries are the canonical §4A.1 category boundaries", () => {
    const cases: [number, string][] = [
      [499, "hamlet"],
      [500, "village"],
      [4_999, "village"],
      [5_000, "town"],
      [49_999, "town"],
      [50_000, "city"],
      [499_999, "city"],
      [500_000, "metropolis"],
      [4_999_999, "metropolis"],
      [5_000_000, "megacity"],
    ];
    for (const [population, cls] of cases)
      expect(morphologyClass(population), String(population)).toBe(cls);
  });

  it("A: every order of magnitude 10 → 10M+ changes structure, not just size", () => {
    const signatures = LADDER_POPULATIONS.map((p) => {
      const ps = morph(p).primitives;
      return [
        morphologyClass(p),
        cores(ps),
        builtAreas(ps) > 0,
        lanes(ps) > 0,
        plots(ps),
      ];
    });
    // Każdy rząd wielkości ma inną sygnaturę struktury (klasa, rdzenie, zabudowa, osie, ślady).
    expect(new Set(signatures.map((s) => JSON.stringify(s))).size).toBe(
      LADDER_POPULATIONS.length,
    );
    expect(signatures.map((s) => s[0])).toEqual([
      "hamlet",
      "hamlet",
      "village",
      "town",
      "city",
      "metropolis",
      "megacity",
    ]);
    // Rdzenie: brak → jeden → wiele (wielocentryczność od metropolii w górę).
    expect(signatures.map((s) => s[1])).toEqual([0, 0, 0, 1, 1, 2, 4]);
  });

  it("B: very small and invalid populations stay a readable hamlet", () => {
    for (const p of [0, -5, Number.NaN, 1, 10]) {
      const m = morph(p);
      expect(m.cls).toBe("hamlet");
      expect(m.radius).toBe(settlementFootprint(10));
      expect(m.primitives.length).toBeGreaterThan(0);
    }
    // 10 vs ~100: układ się zmienia (2 oddalone ślady → skupisko ze ścieżką).
    expect(plots(morph(12).primitives)).toBe(2);
    expect(lanes(morph(12).primitives)).toBe(0);
    expect(plots(morph(120).primitives)).toBe(4);
    expect(lanes(morph(120).primitives)).toBeGreaterThan(0);
  });

  it("C: 10M+ is a full class; the footprint is compressed and capped so it cannot swallow a region", () => {
    for (const p of [10_000_000, 25_000_000, 100_000_000, 1e9]) {
      expect(morphologyClass(p)).toBe("megacity");
      expect(cores(morph(p).primitives)).toBeGreaterThanOrEqual(4);
    }
    expect(settlementFootprint(1e9)).toBe(33);
    expect(settlementFootprint(100_000_000)).toBe(33);
    // Limit zajmuje < 1/3 powierzchni pola regionu.
    expect((33 / REGION_FIELD_RADIUS) ** 2).toBeLessThan(1 / 3);
  });

  it("footprint is monotonic over population and grows with every decade (log, not linear)", () => {
    const samples = [1, 10, 50, 100, 1e3, 5e3, 1e4, 1e5, 1e6, 3e6, 1e7, 1e8];
    const radii = samples.map(settlementFootprint);
    for (let i = 1; i < radii.length; i++)
      expect(radii[i]!).toBeGreaterThanOrEqual(radii[i - 1]!);
    const decades = [10, 100, 1e3, 1e4, 1e5, 1e6, 1e7].map(settlementFootprint);
    for (let i = 1; i < decades.length; i++)
      expect(decades[i]!).toBeGreaterThan(decades[i - 1]!);
    // 10M ma < 10× promienia osady 10-osobowej (kompresja skali).
    expect(settlementFootprint(1e7) / settlementFootprint(10)).toBeLessThan(10);
  });

  it("primitives stay inside the footprint (one plot of tolerance) for every class, variant and detail level", () => {
    for (const p of [10, 120, 1_200, 12_000, 120_000, 1_200_000, 12_000_000, 90_000_000])
      for (const id of ["a", "b", "c", "d", "e", "f"])
        for (const detail of ["WORLD", "REGION", "LOCAL"] as const) {
          const m = morph(p, id, detail);
          expect(
            morphologyExtent(m.primitives),
            `${p}/${id}/${detail}`,
          ).toBeLessThanOrEqual(m.radius * 1.12 + 3);
        }
  });

  it("classProgress is 0..1 inside every class", () => {
    for (const p of [1, 499, 500, 4_999, 12_000, 4_999_999, 5e6, 1e9]) {
      expect(classProgress(p)).toBeGreaterThanOrEqual(0);
      expect(classProgress(p)).toBeLessThanOrEqual(1);
    }
  });
});

describe("settlement morphology -- determinism and variants (D, E)", () => {
  it("D: the same settlement always yields the same shape; no Math.random", () => {
    const random = vi.spyOn(Math, "random");
    for (const p of LADDER_POPULATIONS)
      expect(morph(p, "same")).toEqual(morph(p, "same"));
    expect(random).not.toHaveBeenCalled();
  });

  it("E: the same class yields a few authored variants chosen by a stable id hash", () => {
    const hundredK = VARIANT_REGIONS.filter((r) => r.population < 1e6);
    const tenM = VARIANT_REGIONS.filter((r) => r.population >= 1e6);
    for (const trio of [hundredK, tenM]) {
      const ids = trio.map((r) => `${r.id}_settlement`);
      expect(new Set(ids.map((id) => morphologyVariant(id).index)).size).toBe(3);
      const shapes = ids.map((id) =>
        JSON.stringify(morph(trio[0]!.population, id).primitives),
      );
      expect(new Set(shapes).size).toBe(3);
      expect(new Set(ids.map((id) => morph(trio[0]!.population, id).cls)).size).toBe(1);
    }
  });

  it("the number of variants stays controlled (3 layouts × mirror)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const v = morphologyVariant(`id_${i}`);
      seen.add(`${v.index}:${String(v.mirror)}`);
    }
    expect(seen.size).toBe(6);
  });
});

describe("settlement morphology -- semantic zoom detail and primitive budget (G, performance)", () => {
  it("G: detail adds building marks but never changes the class or its skeleton", () => {
    for (const p of LADDER_POPULATIONS) {
      const world = morph(p, "z", "WORLD");
      const region = morph(p, "z", "REGION");
      const local = morph(p, "z", "LOCAL");
      expect(new Set([world.cls, region.cls, local.cls]).size).toBe(1);
      expect(cores(world.primitives)).toBe(cores(local.primitives));
      expect(world.primitives.length).toBeLessThanOrEqual(region.primitives.length);
      expect(region.primitives.length).toBeLessThanOrEqual(local.primitives.length);
    }
  });

  it("stays a small, fixed number of primitives per settlement (no thousands of buildings)", () => {
    const budget: Record<string, number> = {};
    for (const cls of MORPHOLOGY_CLASSES) budget[cls] = 0;
    for (const p of [12, 120, 1_200, 12_000, 120_000, 1_200_000, 12_000_000, 90_000_000])
      for (const detail of ["WORLD", "REGION", "LOCAL"] as const) {
        const m = morph(p, "budget", detail);
        budget[m.cls] = Math.max(budget[m.cls]!, m.primitives.length);
      }
    for (const count of Object.values(budget)) expect(count).toBeLessThanOrEqual(60);
  });
});

describe("R3.1 -- town vs city structure and megacity axes", () => {
  const ids = ["r31_a", "r31_b", "r31_c", "r31_d", "r31_e", "r31_f"];
  const details = ["WORLD", "REGION", "LOCAL"] as const;
  /** Płaty zabudowy (kryjące wypełnienia `urban`) -- główny obszar + dzielnice. */
  const lobes = builtAreas;

  it("A/B/C: town is one compact area with one core; city adds districts but keeps exactly one core -- already on WORLD", () => {
    for (const id of ids)
      for (const detail of details) {
        const town = morph(12_000, id, detail).primitives;
        const city = morph(120_000, id, detail).primitives;
        expect(lobes(town), `${id}/${detail}`).toBe(1);
        expect(cores(town)).toBe(1);
        expect(lobes(city), `${id}/${detail}`).toBeGreaterThanOrEqual(3);
        expect(cores(city)).toBe(1);
      }
    // Większe miasto dostaje trzecią dzielnicę, nadal z jednym rdzeniem.
    expect(lobes(morph(400_000, "r31_a").primitives)).toBe(4);
    expect(cores(morph(400_000, "r31_a").primitives)).toBe(1);
  });

  it("D/E: metropolis stays more complex than city, megacity more than metropolis", () => {
    for (const id of ids) {
      const city = morph(120_000, id).primitives;
      const metro = morph(1_200_000, id).primitives;
      const mega = morph(12_000_000, id).primitives;
      expect(cores(metro)).toBeGreaterThanOrEqual(2);
      expect(cores(metro)).toBeGreaterThan(cores(city));
      expect(cores(mega)).toBeGreaterThan(cores(metro));
      expect(lobes(mega)).toBeGreaterThan(lobes(metro));
    }
  });

  it("F: city and megacity axes end inside the footprint (structural points), never in empty space", () => {
    const laneVertices = (ps: readonly Primitive[]) =>
      ps
        .filter((p) => p.kind === "poly" && !p.closed && p.stroke === "ink")
        .flatMap((p) => {
          const pts = (p as { points: readonly number[] }).points;
          return Array.from({ length: pts.length / 2 }, (_, i) =>
            Math.hypot(pts[2 * i]!, pts[2 * i + 1]!),
          );
        });
    for (const population of [120_000, 400_000, 5_000_000, 12_000_000, 90_000_000])
      for (const id of ids)
        for (const detail of details) {
          const m = morph(population, id, detail);
          const far = Math.max(...laneVertices(m.primitives));
          expect(far, `${population}/${id}/${detail}`).toBeLessThanOrEqual(
            m.radius * 1.02,
          );
        }
  });
});

describe("population labels (§16)", () => {
  it("compact format follows the locale", () => {
    expect(
      [12, 120, 1_200, 12_000, 120_000, 1_200_000, 12_000_000].map((n) =>
        formatPopulationCompact(n, "en"),
      ),
    ).toEqual(["12", "120", "1.2K", "12K", "120K", "1.2M", "12M"]);
    // PL: twarda spacja przed jednostką (Intl).
    expect(formatPopulationCompact(1_200, "pl")).toMatch(/^1,2\stys\.$/);
    expect(formatPopulationCompact(12_000_000, "pl")).toMatch(/^12\smln$/);
  });
});

describe("settlement grammar -- multiple settlements, zoom budget, invariants (F, G, H, I, J, K, P)", () => {
  const civ = () => civilizationView().current;
  const regionOf = (grammar: ReturnType<typeof buildAtlasGrammar>, id: string) =>
    grammar.regions.find((r) => r.regionId === id)!;

  it("F: a region with many settlements is not reduced to its largest one; footprints never overlap", () => {
    const farmland = civ().regions.find((r) => r.regionId === "r3_civ_farmland")!;
    expect(farmland.settlements).toHaveLength(6);
    const local = layoutSettlements(farmland.settlements, "LOCAL");
    expect(local.placed).toHaveLength(6);
    expect(local.minor).toBe(0);
    expect(local.placed[0]).toMatchObject({ x: 0, y: 0 });
    expect(local.placed[0]!.population).toBe(
      Math.max(...farmland.settlements.map((s) => s.population)),
    );
    for (let i = 0; i < local.placed.length; i++)
      for (let j = i + 1; j < local.placed.length; j++) {
        const a = local.placed[i]!,
          b = local.placed[j]!;
        expect(
          Math.abs(a.x - b.x),
          `${a.settlementId}/${b.settlementId}`,
        ).toBeGreaterThanOrEqual(a.radius + b.radius);
      }
  });

  it("G: WORLD aggregates settlements above its budget (never hides them); zoom-in reveals them", () => {
    const farmland = civ().regions.find((r) => r.regionId === "r3_civ_farmland")!;
    const world = layoutSettlements(farmland.settlements, "WORLD");
    expect(world.placed).toHaveLength(SETTLEMENT_BUDGET.WORLD);
    expect(world.placed.length + world.minor).toBe(farmland.settlements.length);
    const grammar = buildAtlasGrammar(civ(), { zoomLevel: 0.6, showResources: false });
    expect(grammar.zoom).toBe("WORLD");
    expect(regionOf(grammar, "r3_civ_farmland").minorSettlements).toBe(3);
  });

  it("H: building the grammar does not mutate the Read Model (renderer is a consumer)", () => {
    const snapshot = civ();
    const before = JSON.stringify(snapshot);
    for (const zoomLevel of [0.6, 1, 1.75])
      buildAtlasGrammar(snapshot, { zoomLevel, showResources: true });
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it("I/J/K: industry[], extraction[] and connections survive alongside settlement morphology", () => {
    const snapshot = civ();
    const grammar = buildAtlasGrammar(snapshot, { zoomLevel: 1, showResources: false });
    const basin = regionOf(grammar, "r3_civ_basin");
    expect(basin.settlements.map((s) => s.cls)).toEqual(["city", "town", "village"]);
    const glyphs = basin.rows.flat();
    expect(glyphs.filter((g) => g.cls === "industry").length).toBeGreaterThanOrEqual(2);
    expect(glyphs.filter((g) => g.cls === "extraction").length).toBe(2);
    expect(grammar.edges).toHaveLength(snapshot.connections.length);
    expect(
      grammar.edges.find((e) => e.from === "r3_civ_capital" && e.to === "r3_civ_basin")!
        .strokes,
    ).toEqual([{ family: "rail" }]);
  });

  it("P: settlement morphology never depends on UNKNOWN / SUSPECTED deposits", () => {
    const snapshot = civ();
    const withSuspected: WorldSnapshot = {
      ...snapshot,
      regions: snapshot.regions.map((r) =>
        r.regionId === "r3_civ_highlands" ? { ...r, suspectedDepositCount: 3 } : r,
      ),
    };
    const options = { zoomLevel: 1, showResources: true };
    expect(buildAtlasGrammar(withSuspected, options)).toEqual(
      buildAtlasGrammar(snapshot, options),
    );
    const highlands = regionOf(
      buildAtlasGrammar(withSuspected, options),
      "r3_civ_highlands",
    );
    expect(highlands.rows.flat().filter((g) => g.cls === "resource")).toEqual([]);
  });

  it("the ladder fixture covers every morphology class exactly once per decade band", () => {
    const grammar = buildAtlasGrammar(morphologyLadderView().current, {
      zoomLevel: 1,
      showResources: false,
    });
    expect(grammar.regions.map((r) => r.settlements[0]!.cls)).toEqual([
      "hamlet",
      "hamlet",
      "village",
      "town",
      "city",
      "metropolis",
      "megacity",
    ]);
  });
});
