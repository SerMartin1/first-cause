import { describe, expect, it } from "vitest";
import { createI18n } from "@first-cause/localization";
import type { WorldSnapshot } from "@first-cause/simulation";
import en from "../../../../../locales/en/common.json";
import pl from "../../../../../locales/pl/common.json";
import {
  buildAtlasGrammar,
  GLYPH_BUDGET,
  semanticZoom,
  terrainTexture,
} from "./atlas-grammar.js";
import { visualWorldView } from "./visual-world-fixture.js";
import { visualStressView } from "./visual-stress-fixture.js";
import { extractionGlyph, industryGlyph, routeStyle } from "./visual-alphabet.js";
import { legendLabel } from "./FCAtlasGlyph.js";

const world = () => visualWorldView().current;
const region = (grammar: ReturnType<typeof buildAtlasGrammar>, id: string) =>
  grammar.regions.find((r) => r.regionId === id)!;

describe("Atlas visual grammar (M21-VIS-R2)", () => {
  it("maps zoom to WORLD / REGION / LOCAL and falls back to WORLD above the region budget", () => {
    expect(semanticZoom(0.6, 8)).toBe("WORLD");
    expect(semanticZoom(1, 8)).toBe("REGION");
    expect(semanticZoom(1.75, 8)).toBe("LOCAL");
    expect(semanticZoom(1.75, 500)).toBe("WORLD");
  });

  it("the fixture is derived by the production Read Model: several industries and extraction families in one region", () => {
    const ironridge = world().regions.find(
      (r) => r.regionId === "dev_ironridge",
    )!.profile;
    expect(ironridge.industry!.map((i) => i.sector)).toEqual([
      "metallurgy",
      "mining",
      "manufacturing",
    ]);
    expect(ironridge.industry!.find((i) => i.sector === "mining")!.activeCompanies).toBe(
      2,
    );
    expect(ironridge.extraction.map((e) => e.family)).toEqual(["open_pit", "shaft_mine"]);
  });

  it("REGION: draws every industry[] and extraction[] entry (within budget) -- no single dominant icon", () => {
    const grammar = buildAtlasGrammar(world(), { zoomLevel: 1, showResources: false });
    const rows = region(grammar, "dev_ironridge").rows;
    // Hierarchia: stan (aktywne przed bezczynnymi), potem zatrudnienie.
    expect(rows[0]!.map((g) => g.cls === "industry" && [g.sector, g.state])).toEqual([
      ["metallurgy", "active"],
      ["mining", "active"],
      ["manufacturing", "idle"],
    ]);
    expect(rows[1]!.map((g) => g.cls === "extraction" && g.family)).toEqual([
      "open_pit",
      "shaft_mine",
    ]);
  });

  it("WORLD: aggregates per class but never hides the civilization layer (§28.4)", () => {
    const grammar = buildAtlasGrammar(world(), { zoomLevel: 0.6, showResources: true });
    expect(grammar.zoom).toBe("WORLD");
    const rows = region(grammar, "dev_ironridge").rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.map((g) => g.cls === "aggregate" && [g.of, g.count])).toEqual([
      ["industry", 3],
      ["extraction", 2],
    ]);
    // Każdy region z działalnością ma znak już na WORLD.
    for (const r of world().regions)
      if ((r.profile.industry?.length ?? 0) + r.profile.extraction.length > 0)
        expect(region(grammar, r.regionId).rows.length).toBe(1);
  });

  it("budgets overflow explicitly as +n instead of dropping entries silently", () => {
    const snapshot = world();
    const ironridge = snapshot.regions.find((r) => r.regionId === "dev_ironridge")!;
    const many = Array.from({ length: GLYPH_BUDGET.REGION.industry + 2 }, (_, i) => ({
      ...ironridge.profile.industry![0]!,
      sector: `sector_${i}`,
    }));
    const crowded: WorldSnapshot = {
      ...snapshot,
      regions: snapshot.regions.map((r) =>
        r === ironridge ? { ...r, profile: { ...r.profile, industry: many } } : r,
      ),
    };
    const grammar = buildAtlasGrammar(crowded, { zoomLevel: 1, showResources: false });
    expect(region(grammar, "dev_ironridge").rows[0]).toHaveLength(
      GLYPH_BUDGET.REGION.industry,
    );
    expect(region(grammar, "dev_ironridge").overflow).toBe(2);
  });

  it("draws infrastructure on edges: every route family of a connection, primary only on WORLD, 'none' without infrastructure", () => {
    const region1 = buildAtlasGrammar(world(), { zoomLevel: 1, showResources: false });
    const edge = (g: typeof region1, a: string, b: string) =>
      g.edges.find((e) => e.from === a && e.to === b)!.strokes.map((s) => s.family);
    expect(edge(region1, "dev_ironridge", "dev_green_plain")).toEqual(["rail", "road"]);
    expect(edge(region1, "dev_green_plain", "dev_harbour")).toEqual(["road", "waterway"]);
    expect(edge(region1, "dev_timber_reach", "dev_north_tundra")).toEqual(["none"]);
    expect(edge(region1, "dev_marsh", "dev_green_plain")).toEqual(["unclassified"]);
    const worldZoom = buildAtlasGrammar(world(), {
      zoomLevel: 0.6,
      showResources: false,
    });
    expect(edge(worldZoom, "dev_ironridge", "dev_green_plain")).toEqual(["rail"]);
    expect(
      region1.edges.find((e) => e.from === "dev_harbour" && e.to === "dev_greyhills")!
        .disrupted,
    ).toBe(true);
  });

  it("an UNKNOWN deposit under extraction produces no glyph and no legend entry (TECH-009)", () => {
    const grammar = buildAtlasGrammar(world(), { zoomLevel: 1.75, showResources: true });
    expect(region(grammar, "dev_dry_basin").rows).toEqual([]);
    expect(JSON.stringify(grammar)).not.toContain("dev_dry_basin_dev_coal");
  });

  it("known, unworked deposits are a separate class shown only with the resources overlay", () => {
    const off = buildAtlasGrammar(world(), { zoomLevel: 1, showResources: false });
    const on = buildAtlasGrammar(world(), {
      zoomLevel: 1,
      showResources: true,
      highlightResourceId: "iron_ore",
    });
    const glyphs = (g: typeof on) => region(g, "dev_greyhills").rows.flat();
    expect(glyphs(off).some((g) => g.cls === "resource")).toBe(false);
    expect(glyphs(on).filter((g) => g.cls === "resource")).toEqual([
      {
        cls: "resource",
        key: "resource:iron_ore",
        resourceDefinitionId: "iron_ore",
        renewable: false,
        highlighted: true,
      },
    ]);
  });

  it("the legend lists only classes actually drawn", () => {
    const real: WorldSnapshot = {
      ...world(),
      regions: world().regions.filter((r) => r.regionId === "dev_green_plain"),
      connections: [],
    };
    const legend = buildAtlasGrammar(real, { zoomLevel: 1, showResources: false }).legend;
    expect(legend).toEqual([
      { cls: "industry", sector: "agriculture" },
      { cls: "industry", sector: "food_processing" },
      { cls: "extraction", family: "cultivation" },
    ]);
  });

  it("J: switching the UI language does not change the Atlas data or grammar", async () => {
    const i18n = createI18n({ resources: { en: { common: en }, pl: { common: pl } } });
    await i18n.changeLanguage("en");
    const before = JSON.stringify(
      buildAtlasGrammar(world(), { zoomLevel: 1, showResources: true }),
    );
    const snapshotBefore = JSON.stringify(visualWorldView());
    await i18n.changeLanguage("pl");
    expect(
      JSON.stringify(buildAtlasGrammar(world(), { zoomLevel: 1, showResources: true })),
    ).toBe(before);
    expect(JSON.stringify(visualWorldView())).toBe(snapshotBefore);
    // Etykiety legendy istnieją w obu językach (klucze, nie teksty w danych).
    for (const entry of buildAtlasGrammar(world(), { zoomLevel: 1, showResources: true })
      .legend) {
      const { key } = legendLabel(entry);
      expect(en).toHaveProperty([key]);
      expect(pl).toHaveProperty([key]);
    }
  });

  it("derives ground tone only from stored terrain / climate / fertility", () => {
    const tones = Object.fromEntries(
      world().regions.map((r) => [r.regionId, terrainTexture(r.profile).ground]),
    );
    expect(tones).toMatchObject({
      dev_dry_basin: "dry",
      dev_north_tundra: "cold",
      dev_marsh: "wet",
      dev_green_plain: "fertile",
      dev_ironridge: "plain",
    });
  });

  it("stage fixture: each development stage adds structure to industry[] (not only a larger marker)", () => {
    const counts = [0, 1, 2, 3].map(
      (i) =>
        buildAtlasGrammar(visualStressView(i).current, {
          zoomLevel: 1,
          showResources: false,
        }).regions[0]!.rows.flat().length,
    );
    expect(counts).toEqual([0, 2, 3, 4]);
  });
});

describe("Visual alphabet (M21-VIS-R2)", () => {
  const signature = (prims: ReturnType<typeof extractionGlyph>) =>
    JSON.stringify(
      prims.map((p) => (p.kind === "circle" ? ["c", p.x, p.y, p.r] : ["p", p.points])),
    );

  it("extraction families differ by structure, not by colour (§9.1)", () => {
    const families = [
      "shaft_mine",
      "open_pit",
      "quarry",
      "cultivation",
      "logging",
      "fishing",
      "oil_field",
      "gas_field",
      "evaporation",
      undefined,
    ];
    const shapes = new Set(families.map((f) => signature(extractionGlyph(f, "active"))));
    expect(shapes.size).toBe(families.length);
  });

  it("state modifies the base sign without changing its identity (§4A.5)", () => {
    const active = industryGlyph("metallurgy", 3, "active");
    const closed = industryGlyph("metallurgy", 3, "closed");
    expect(closed.slice(0, active.length).map((p) => p.kind)).toEqual(
      active.map((p) => p.kind),
    );
    expect(closed.length).toBe(active.length + 1); // + przekreślenie
    expect(active.some((p) => p.fill)).toBe(true);
    expect(closed.some((p) => p.fill)).toBe(false);
  });

  it("route styles follow the family; roads widen with the connection level", () => {
    expect(routeStyle("path", 1).dash).toBeDefined();
    expect(routeStyle("rail", 1).ties).toBe(true);
    expect(routeStyle("waterway", 1).ink).toBe("water");
    expect(routeStyle("road", 4).width).toBeGreaterThan(routeStyle("road", 1).width);
  });
});
