import { describe, expect, it } from "vitest";
import { loadContentPack } from "./content-pack.js";

const ironOre = {
  id: "iron_ore",
  nameKey: "content.resource.iron_ore.name",
  category: "mineral",
  renewable: false,
  implementationPhase: "VS",
};

const flour = {
  id: "flour",
  nameKey: "content.good.flour.name",
  category: "food_intermediate",
  downstreamGoodIds: ["bread"],
  implementationPhase: "VS",
};

const bread = {
  id: "bread",
  nameKey: "content.good.bread.name",
  category: "food_final",
  implementationPhase: "VS",
};

const metallurgy = {
  id: "metallurgy",
  nameKey: "content.knowledgeDomain.metallurgy.name",
  implementationPhase: "VS",
};

const basicSmelting = {
  id: "basic_smelting",
  nameKey: "content.discovery.basic_smelting.name",
  primaryDomainId: "metallurgy",
  tier: 1,
  implementationPhase: "VS",
};

const advancedSmelting = {
  id: "advanced_smelting",
  nameKey: "content.discovery.advanced_smelting.name",
  primaryDomainId: "metallurgy",
  tier: 2,
  prerequisites: ["basic_smelting"],
  implementationPhase: "MVP",
};

const FULL_EN_LOCALE = {
  "content.resource.iron_ore.name": "Iron Ore",
  "content.good.flour.name": "Flour",
  "content.good.bread.name": "Bread",
  "content.discovery.basic_smelting.name": "Basic Smelting",
  "content.discovery.advanced_smelting.name": "Advanced Smelting",
  "content.knowledgeDomain.metallurgy.name": "Metallurgy",
};

const FULL_PL_LOCALE = {
  "content.resource.iron_ore.name": "Ruda żelaza",
  "content.good.flour.name": "Mąka",
  "content.good.bread.name": "Chleb",
  "content.discovery.basic_smelting.name": "Podstawowe hutnictwo",
  "content.discovery.advanced_smelting.name": "Zaawansowane hutnictwo",
  "content.knowledgeDomain.metallurgy.name": "Metalurgia",
};

describe("loadContentPack -- happy path", () => {
  it("loads multiple content types, cross-references cleanly, full EN+PL coverage", () => {
    const result = loadContentPack({
      definitions: {
        resource: [ironOre],
        good: [flour, bread],
        discovery: [basicSmelting, advancedSmelting],
        knowledgeDomain: [metallurgy],
      },
      locales: { en: FULL_EN_LOCALE, pl: FULL_PL_LOCALE },
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.stats).toEqual({
      resource: 1,
      good: 2,
      discovery: 2,
      companyArchetype: 0,
      productionMethod: 0,
      service: 0,
      transportMode: 0,
      intervention: 0,
      eventType: 0,
      chronicleTemplate: 0,
      knowledgeDomain: 1,
    });
    const loadedFlour = result.registries.good?.get("flour") as
      { downstreamGoodIds?: readonly string[] } | undefined;
    expect(loadedFlour?.downstreamGoodIds).toEqual(["bread"]);
  });

  it("content load determinism: shuffled input order yields identical stats and registries", () => {
    const a = loadContentPack({
      definitions: { good: [flour, bread], resource: [ironOre] },
      locales: { en: FULL_EN_LOCALE },
    });
    const b = loadContentPack({
      definitions: { good: [bread, flour], resource: [ironOre] },
      locales: { en: FULL_EN_LOCALE },
    });

    expect(a.stats).toEqual(b.stats);
    expect(a.registries.good?.all()).toEqual(b.registries.good?.all());
  });
});

describe("loadContentPack -- CONTENT-010 semantic validation", () => {
  it("detects a duplicate content ID within one type", () => {
    const result = loadContentPack({
      definitions: { resource: [ironOre, ironOre] },
      locales: { en: FULL_EN_LOCALE },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("Duplicate content ID"))).toBe(
      true,
    );
  });

  it("detects a content ID collision across two different types", () => {
    const conflictingGood = { ...flour, id: "iron_ore" };
    const result = loadContentPack({
      definitions: { resource: [ironOre], good: [conflictingGood] },
      locales: { en: FULL_EN_LOCALE },
    });

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((error) => error.includes("Content ID collision across types")),
    ).toBe(true);
  });

  it("detects a missing reference", () => {
    const brokenGood = { ...flour, downstreamGoodIds: ["nonexistent_good"] };
    const result = loadContentPack({
      definitions: { good: [brokenGood] },
      locales: { en: FULL_EN_LOCALE },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("Missing reference"))).toBe(true);
  });

  it("rejects an invalid numeric range via Zod (structural check)", () => {
    const invalidDiscovery = { ...basicSmelting, tier: -1 };
    const result = loadContentPack({
      definitions: { discovery: [invalidDiscovery] },
      locales: { en: FULL_EN_LOCALE },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("[discovery]"))).toBe(true);
    expect(result.stats.discovery).toBeUndefined();
  });

  it("detects a dependency cycle", () => {
    const a = { ...basicSmelting, id: "cycle_a", prerequisites: ["cycle_b"] };
    const b = { ...basicSmelting, id: "cycle_b", prerequisites: ["cycle_a"] };
    const result = loadContentPack({
      definitions: { discovery: [a, b] },
      locales: {
        en: {
          ...FULL_EN_LOCALE,
          "content.discovery.cycle_a.name": "A",
          "content.discovery.cycle_b.name": "B",
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("Dependency cycle"))).toBe(true);
  });

  it("detects a phase violation (VS depending on an MVP-only prerequisite)", () => {
    const vsDiscoveryDependingOnMvp = {
      ...basicSmelting,
      id: "early_smelting",
      prerequisites: ["advanced_smelting"],
    };
    const result = loadContentPack({
      definitions: { discovery: [vsDiscoveryDependingOnMvp, advancedSmelting] },
      locales: {
        en: {
          ...FULL_EN_LOCALE,
          "content.discovery.early_smelting.name": "Early Smelting",
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("Phase violation"))).toBe(true);
  });

  it("reports a missing English localization key as an error", () => {
    const { "content.resource.iron_ore.name": _omit, ...enWithoutIronOre } =
      FULL_EN_LOCALE;
    const result = loadContentPack({
      definitions: { resource: [ironOre] },
      locales: { en: enWithoutIronOre },
    });

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((error) => error.includes("Missing en localization key")),
    ).toBe(true);
  });

  it("reports a missing secondary-locale key as a warning, not a failure", () => {
    const { "content.resource.iron_ore.name": _omit, ...plWithoutIronOre } =
      FULL_PL_LOCALE;
    const result = loadContentPack({
      definitions: { resource: [ironOre] },
      locales: { en: FULL_EN_LOCALE, pl: plWithoutIronOre },
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(
      result.warnings.some((warning) => warning.includes("Missing pl localization key")),
    ).toBe(true);
  });
});
