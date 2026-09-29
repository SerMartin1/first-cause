import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFactStore, pruneCausalMemory, type SimulationFact } from "@first-cause/causality";
import {
  loadContentPack,
  type ChronicleTemplateDefinition,
  type DefinitionRegistry,
  type EventTypeDefinition,
} from "@first-cause/content";
import { aggregateCandidates } from "./aggregation.js";
import { buildChronicleCandidates } from "./candidate-pipeline.js";
import { createChronicleEntryStore } from "./chronicle-entry-store.js";
import { collectHistoricalAnchorFactIds, shouldBeHistoricalAnchor } from "./historical-anchor.js";
import { createNoveltyRegistry } from "./novelty-registry.js";
import { createActiveProcessRegistry } from "./active-process-registry.js";
import { findTemplateForEventType } from "./chronicle-api.js";

/**
 * End-to-end proof of the M19 P0 pipeline against the real repository
 * content (`content/eventTypes`, `content/chronicleTemplates`,
 * `locales/en|pl/common.json`) -- the same fixtures `WorldRunner` will
 * load in production, not inline test doubles. Covers the Chronicle
 * spec's P0 test list (SS129-144) that needs more than one module in
 * isolation: source integrity, no forced drama, determinism, and a
 * Historical Anchor surviving `@first-cause/causality` pruning.
 */
const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");

function readJsonDir(relativeDir: string): unknown[] {
  const dir = path.join(REPO_ROOT, relativeDir);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), "utf-8")) as unknown);
}

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(REPO_ROOT, relativePath), "utf-8")) as Record<string, unknown>;
}

function loadRealChronicleContent() {
  const result = loadContentPack({
    definitions: {
      eventType: readJsonDir("content/eventTypes"),
      chronicleTemplate: readJsonDir("content/chronicleTemplates"),
    },
    locales: {
      en: readJson("locales/en/common.json"),
      pl: readJson("locales/pl/common.json"),
    },
  });
  if (!result.ok) {
    throw new Error(`Real Chronicle content failed to load: ${result.errors.join("; ")}`);
  }
  return {
    eventTypes: result.registries.eventType as DefinitionRegistry<EventTypeDefinition>,
    templates: result.registries.chronicleTemplate as DefinitionRegistry<ChronicleTemplateDefinition>,
  };
}

function runPipeline(
  facts: readonly SimulationFact[],
  eventTypes: DefinitionRegistry<EventTypeDefinition>,
  templates: DefinitionRegistry<ChronicleTemplateDefinition>,
) {
  const noveltyRegistry = createNoveltyRegistry();
  const activeProcessRegistry = createActiveProcessRegistry();
  const store = createChronicleEntryStore();

  const byTick = new Map<number, SimulationFact[]>();
  for (const fact of facts) {
    const list = byTick.get(fact.tick) ?? [];
    list.push(fact);
    byTick.set(fact.tick, list);
  }

  for (const tick of [...byTick.keys()].sort((a, b) => a - b)) {
    const candidates = buildChronicleCandidates({
      facts: byTick.get(tick)!,
      edges: [],
      architectInfluenceByFactId: new Map(),
      eventTypes,
      currentTick: tick,
      noveltyRegistry,
      activeProcessRegistry,
    });
    const { published } = aggregateCandidates(candidates);
    for (const candidate of published) {
      const template = findTemplateForEventType(templates, candidate.eventType);
      const entry = store.upsert(candidate, {
        titleKey: template?.titleKey ?? "unknown",
        templateKey: template?.id ?? "unknown",
        dataPayload: {},
      });
      const eventType = eventTypes.get(candidate.eventType);
      const anchor = shouldBeHistoricalAnchor(entry, eventType?.anchorPolicy.alwaysAnchor ?? false);
      store.markHistoricalAnchor(entry.id, anchor);
    }
  }

  return store.all();
}

describe("Chronicle pipeline (real content fixtures)", () => {
  it("loads the real 17 VS event types + templates cleanly (15 + technology_tier_reached + settlement_abandoned)", () => {
    const { eventTypes, templates } = loadRealChronicleContent();
    expect(eventTypes.size).toBe(17);
    expect(templates.size).toBe(17);
  });

  it("source integrity (SS129): every entry's fact refs come from facts actually fed into the pipeline", () => {
    const { eventTypes, templates } = loadRealChronicleContent();
    const factStore = createFactStore();
    const discovered = factStore.emit(0, {
      type: "resource_discovered",
      subject: { entityType: "resourceDeposit", entityId: "deposit_1" },
      location: { regionId: "black_mountain" },
      values: { before: 0, after: 500 },
    });
    const founded = factStore.emit(6, {
      type: "company_founded",
      subject: { entityType: "company", entityId: "co_1" },
      location: { regionId: "black_mountain", settlementId: "riverside" },
      values: { before: 0, after: 1 },
    });
    const facts = factStore.all();
    const validFactIds = new Set(facts.map((f) => f.id));

    const entries = runPipeline(facts, eventTypes, templates);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      for (const ref of [...entry.primaryFactRefs, ...entry.supportingFactRefs, ...entry.causalAnchorRefs]) {
        expect(validFactIds.has(ref)).toBe(true);
      }
    }
    expect(discovered.id).toBeDefined();
    expect(founded.id).toBeDefined();
  });

  it("no forced drama (SS139): a stable world with no clearing event produces zero entries", () => {
    const { eventTypes, templates } = loadRealChronicleContent();
    const factStore = createFactStore();
    // company_expanded with before === after: zero magnitude, not tracked for novelty, no edges -- stays below candidateThreshold.
    factStore.emit(0, {
      type: "company_expanded",
      subject: { entityType: "company", entityId: "co_1" },
      location: { regionId: "region_1" },
      values: { before: 10, after: 10 },
    });
    const entries = runPipeline(factStore.all(), eventTypes, templates);
    expect(entries).toEqual([]);
  });

  it("determinism (SS138): the same facts through a fresh pipeline twice produce identical entries", () => {
    const { eventTypes, templates } = loadRealChronicleContent();
    const factStore = createFactStore();
    factStore.emit(0, {
      type: "discovery_occurred",
      subject: { entityType: "discovery", entityId: "iron_working" },
      location: { regionId: "region_1" },
      values: { before: 0, after: 1 },
    });
    const facts = factStore.all();

    const runA = runPipeline(facts, eventTypes, templates);
    const runB = runPipeline(facts, eventTypes, templates);
    expect(runA).toEqual(runB);
  });

  it("a small Black-Mountain-shaped sequence (discovery -> founding -> settlement stage change) produces a plausible, non-noisy chronicle", () => {
    const { eventTypes, templates } = loadRealChronicleContent();
    const factStore = createFactStore();
    factStore.emit(0, {
      type: "resource_discovered",
      subject: { entityType: "resourceDeposit", entityId: "deposit_1" },
      location: { regionId: "black_mountain" },
      values: { before: 0, after: 800 },
    });
    factStore.emit(24, {
      type: "company_founded",
      subject: { entityType: "company", entityId: "co_iron" },
      location: { regionId: "black_mountain", settlementId: "riverside" },
      values: { before: 0, after: 1 },
    });
    factStore.emit(140, {
      type: "settlement_stage_changed",
      subject: { entityType: "settlement", entityId: "riverside" },
      location: { regionId: "black_mountain", settlementId: "riverside" },
      values: { before: "hamlet", after: "town" },
    });

    const entries = runPipeline(factStore.all(), eventTypes, templates);
    const eventTypesSeen = entries.map((e) => e.eventType);
    expect(eventTypesSeen).toContain("resource_discovered");
    expect(eventTypesSeen).toContain("settlement_stage_changed");
    // settlement_stage_changed is content-flagged anchorPolicy.alwaysAnchor -- must survive as a historical anchor.
    const stageChange = entries.find((e) => e.eventType === "settlement_stage_changed")!;
    expect(stageChange.historicalAnchor).toBe(true);
  });

  it("SS135: a Chronicle historical anchor survives Causal Memory pruning even though causality's own isAnchor() alone would not protect it", () => {
    const { eventTypes, templates } = loadRealChronicleContent();
    const factStore = createFactStore();
    // Two "resource_discovered" facts on the SAME entity: causality's own
    // isAnchor() does not list this type (see causal-memory.ts), so a
    // run of 2+ old same-entity-type facts compresses into one aggregate
    // by default.
    const first = factStore.emit(0, {
      type: "resource_discovered",
      subject: { entityType: "resourceDeposit", entityId: "deposit_1" },
      location: { regionId: "black_mountain" },
      values: { before: 0, after: 500 },
    });
    const second = factStore.emit(1, {
      type: "resource_discovered",
      subject: { entityType: "resourceDeposit", entityId: "deposit_1" },
      location: { regionId: "black_mountain" },
      values: { before: 0, after: 500 },
    });
    const facts = factStore.all();

    const baseline = pruneCausalMemory({
      facts,
      edges: [],
      architectInfluenceByFactId: new Map(),
      currentTick: 1000,
      hotWindowTicks: 120,
    });
    expect(baseline.facts.map((f) => f.id)).not.toContain(first.id);
    expect(baseline.facts.map((f) => f.id)).not.toContain(second.id);

    const entries = runPipeline(facts, eventTypes, templates);
    // resource_discovered has anchorPolicy.alwaysAnchor: true in real content.
    expect(entries.every((e) => e.historicalAnchor)).toBe(true);
    const anchorFactIds = collectHistoricalAnchorFactIds(entries);
    expect(anchorFactIds.size).toBeGreaterThan(0);

    const protectedResult = pruneCausalMemory({
      facts,
      edges: [],
      architectInfluenceByFactId: new Map(),
      currentTick: 1000,
      hotWindowTicks: 120,
      extraMustKeepFactIds: anchorFactIds,
    });
    for (const id of anchorFactIds) {
      expect(protectedResult.facts.map((f) => f.id)).toContain(id);
    }
  });
});
