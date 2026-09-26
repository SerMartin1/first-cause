import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createWorldRunner, WorldRunner } from "@first-cause/simulation";
import { loadWorldFixture } from "./load-world-fixture.js";
import { loadEconomyContent } from "../content/load-economy-content.js";

/**
 * Regresja naprawy linku Region ↔ TechnologyState (2026-09-26): na
 * PRAWDZIWYM fixture Black Mountain system technologii M15 faktycznie
 * działa, a przebieg jest deterministyczny także po zapisie i odczycie.
 * Test nie oczekuje konkretnej liczby odkryć -- tylko tego, że pipeline
 * Knowledge → Eligibility → Discovery → Availability w ogóle się toczy
 * (przed naprawą: 0 odkryć przez 600 ticków).
 */
const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);
const content = loadEconomyContent(REPO_ROOT);

function referenceRunner() {
  const raw = JSON.parse(
    readFileSync(
      path.join(REPO_ROOT, "tests/worldgen/fixtures/black_mountain_reference.json"),
      "utf-8",
    ),
  );
  const loaded = loadWorldFixture(raw, {
    productionRecipesByMethodId: content.productionRecipesByMethodId,
  });
  if (!loaded.ok) throw new Error(loaded.errors.join("; "));
  const worldState = loaded.worldState!;
  return createWorldRunner({
    ...content,
    worldState,
    worldSeed: worldState.world.seed,
    startYear: worldState.world.currentDate.year,
    startMonth: worldState.world.currentDate.month,
  });
}

describe("Black Mountain reference world -- regional technology (M15 live)", () => {
  it("links every fixture TechnologyState to its region", () => {
    const state = referenceRunner().worldState;
    const linked = Object.values(state.technologyStates).map((t) => [
      t.regionId,
      state.regions[t.regionId]!.knowledge.technologyStateId,
    ]);
    expect(linked.length).toBeGreaterThan(0);
    for (const [regionId, technologyStateId] of linked)
      expect(state.technologyStates[technologyStateId!]!.regionId).toBe(regionId);
  });

  it("runs the technology pipeline: discoveries occur and knowledge accumulates", () => {
    const runner = referenceRunner();
    for (let i = 0; i < 12; i++) runner.step();
    // T0 (próg 0) jest do wzięcia od startu w regionach zamieszkanych.
    expect(new Set(runner.facts.map((f) => f.type))).toContain("discovery_occurred");
    const known = Object.values(runner.worldState.technologyStates).flatMap((t) =>
      Object.values(t.discoveries).filter((d) => d.status !== "UNKNOWN"),
    );
    expect(known.length).toBeGreaterThan(0);
    // Osady po 10--30 osób zdobywają wiedzę bardzo wolno (pasmo: ≤ T2 po 200 latach),
    // ale ją zdobywają -- sprawdzane w horyzoncie 100 lat.
    for (let i = 12; i < 1200; i++) runner.step();
    const knowledge = Object.values(runner.worldState.technologyStates).flatMap((t) =>
      Object.values(t.knowledge),
    );
    expect(knowledge.some((level) => level > 0)).toBe(true);
  });

  it("is deterministic: same seed + fixture + ticks gives an identical state", () => {
    const a = referenceRunner();
    const b = referenceRunner();
    for (let i = 0; i < 60; i++) {
      a.step();
      b.step();
    }
    expect(b.getState()).toEqual(a.getState());
  });

  it("save -> load -> continue equals an uninterrupted run, with technology progress intact", () => {
    const straight = referenceRunner();
    const saved = referenceRunner();
    for (let i = 0; i < 30; i++) {
      straight.step();
      saved.step();
    }
    const restored = WorldRunner.fromState(structuredClone(saved.getState()), content);
    for (const region of Object.values(restored.worldState.regions))
      expect(region.knowledge).toEqual(straight.worldState.regions[region.id]!.knowledge);
    for (let i = 0; i < 30; i++) {
      straight.step();
      restored.step();
    }
    expect(restored.getState()).toEqual(straight.getState());
  });
});
