import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadContentPack } from "./loaders/content-pack.js";

/**
 * Proves the real M2 pipeline end-to-end against the actual repository
 * content and locale files on disk (not inline test fixtures): the same
 * `content/resources/*.json`/`content/goods/*.json` a future real content
 * loader would read, and the same `locales/en|pl/common.json` the app
 * loads (`apps/desktop/src/main.tsx`).
 */
const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");

function readJsonDir(relativeDir: string): unknown[] {
  const dir = path.join(REPO_ROOT, relativeDir);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), "utf-8")) as unknown);
}

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(REPO_ROOT, relativePath), "utf-8")) as Record<
    string,
    unknown
  >;
}

describe("content fixtures on disk (content/, locales/)", () => {
  it("load and validate cleanly through the real M2 pipeline", () => {
    const result = loadContentPack({
      definitions: {
        resource: readJsonDir("content/resources"),
        good: readJsonDir("content/goods"),
        companyArchetype: readJsonDir("content/companyArchetypes"),
        productionMethod: readJsonDir("content/productionMethods"),
        transportMode: readJsonDir("content/transportModes"),
        service: readJsonDir("content/services"),
        discovery: readJsonDir("content/discoveries"),
        knowledgeDomain: readJsonDir("content/knowledgeDomains"),
        intervention: readJsonDir("content/interventions"),
        eventType: readJsonDir("content/eventTypes"),
        chronicleTemplate: readJsonDir("content/chronicleTemplates"),
      },
      locales: {
        en: readJson("locales/en/common.json"),
        pl: readJson("locales/pl/common.json"),
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.stats.resource).toBeGreaterThanOrEqual(3);
    expect(result.stats.good).toBeGreaterThanOrEqual(2);
    expect(result.stats.companyArchetype).toBeGreaterThanOrEqual(2);
    expect(result.stats.productionMethod).toBeGreaterThanOrEqual(2);
    expect(result.stats.transportMode).toBeGreaterThanOrEqual(4);
    expect(result.stats.discovery).toBe(125);
    expect(result.stats.knowledgeDomain).toBe(5);
    expect(result.stats.intervention).toBe(5);
    expect(result.registries.resource?.has("iron_ore")).toBe(true);
    expect(result.registries.companyArchetype?.has("grain_farm")).toBe(true);
    expect(result.registries.productionMethod?.has("manual_farming")).toBe(true);
    expect(result.registries.transportMode?.has("cart")).toBe(true);
    expect(result.registries.discovery?.has("agr_001")).toBe(true);
    expect(result.registries.discovery?.has("nau_025")).toBe(true);
    expect(result.registries.knowledgeDomain?.has("agriculture_food")).toBe(true);
    expect(result.registries.knowledgeDomain?.has("science_society")).toBe(true);
    expect(result.registries.intervention?.has("reveal_resource_deposit")).toBe(true);
    expect(result.registries.intervention?.has("environmental_shock")).toBe(true);
    expect(result.stats.eventType).toBe(17);
    expect(result.stats.chronicleTemplate).toBe(17);
    expect(result.registries.eventType?.has("settlement_stage_changed")).toBe(true);
    expect(result.registries.chronicleTemplate?.has("discovery_occurred_default")).toBe(true);
  });
});
