import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  setDiscoveryState,
  type DepositDiscoveryStatus,
  type WorldState,
} from "@first-cause/entities";
import { createFactStore } from "@first-cause/causality";
import {
  applyArchitectIntervention,
  buildRegionSummaryReadModel,
  buildRegionVisualProfileReadModel,
  buildResourceDepositReadModels,
  buildWorldSnapshot,
  buildWorldWhyView,
  createWorldRunner,
  discoverDeposit,
  UNDISCLOSED_DEPOSIT_ID,
  WorldRunner,
} from "@first-cause/simulation";
import { loadWorldFixture } from "./load-world-fixture.js";
import { loadEconomyContent } from "../content/load-economy-content.js";

/**
 * D3 -- naturalne odkrywanie złóż, model A + a (decyzja właściciela
 * 2026-09-27, Canonical Decisions TECH-012) na PRAWDZIWYM fixture i
 * contencie: MIN-001 odsłania jawnie płytkie złoże żelaza Black Mountain
 * (VS §31), bramki są data-driven (`iron_ore.json` `discoveryRules`),
 * a Read Models ujawniają tylko to, na co pozwala status.
 */
const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);
const content = loadEconomyContent(REPO_ROOT);
const IRON = "deposit_black_mountain_iron_ore";
const GRAIN = "deposit_green_valley_grain";
const TIMBER = "deposit_timberland_timber";
const RESOURCE_FACTS = ["resource_suspected", "resource_discovered", "resource_assessed"];

function referenceState(): WorldState {
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
  return loaded.worldState!;
}

function runner(worldState: WorldState, overrides: Partial<typeof content> = {}) {
  return createWorldRunner({
    ...content,
    ...overrides,
    worldState,
    worldSeed: worldState.world.seed,
    startYear: worldState.world.currentDate.year,
    startMonth: worldState.world.currentDate.month,
  });
}

function withDeposit(
  state: WorldState,
  depositId: string,
  patch: { status?: DepositDiscoveryStatus; depth?: number | undefined },
): WorldState {
  const deposit = state.resourceDeposits[depositId]!;
  const status = patch.status ?? deposit.discovery.status;
  return {
    ...state,
    resourceDeposits: {
      ...state.resourceDeposits,
      [depositId]: {
        ...deposit,
        discovery: {
          status,
          discoveredTick:
            status === "DISCOVERED" || status === "ASSESSED" ? 0 : undefined,
          discoveredByEntityId: undefined,
          confidence: status === "UNKNOWN" ? 0 : 1,
        },
        stock: {
          ...deposit.stock,
          depth: "depth" in patch ? patch.depth : deposit.stock.depth,
        },
      },
    },
  };
}

function min001Status(state: WorldState): string | undefined {
  const id = state.regions.region_black_mountain!.knowledge.technologyStateId!;
  return state.technologyStates[id]!.discoveries.min_001?.status;
}

describe("D3 natural resource discovery on the Black Mountain reference world", () => {
  it("the fixture carries explicit depth only where the scenario needs it (iron ore), never a silent default", () => {
    const state = referenceState();
    expect(state.resourceDeposits[IRON]!.stock.depth).toBe(10);
    expect(state.resourceDeposits[TIMBER]!.stock.depth).toBeUndefined();
    expect(state.resourceDeposits[IRON]!.discovery.status).toBe("UNKNOWN");
  });

  it("VS §31: iron stays UNKNOWN until MIN-001 is AVAILABLE in Black Mountain, then becomes DISCOVERED in that same tick (one fact, one Chronicle entry)", () => {
    const run = runner(referenceState());
    let discoveredAtTick: number | undefined;
    for (let i = 0; i < 600 && discoveredAtTick === undefined; i++) {
      run.step();
      const status = run.worldState.resourceDeposits[IRON]!.discovery.status;
      const gate = min001Status(run.worldState);
      if (status === "UNKNOWN") {
        expect(gate === "AVAILABLE" || gate === "ADOPTED").toBe(false);
      } else {
        expect(status).toBe("DISCOVERED");
        expect(gate === "AVAILABLE" || gate === "ADOPTED").toBe(true);
        discoveredAtTick = run.tick - 1;
      }
    }
    expect(discoveredAtTick).toBeDefined();
    const ironFacts = run.facts.filter(
      (f) => f.subject.entityId === IRON && RESOURCE_FACTS.includes(f.type),
    );
    expect(ironFacts.map((f) => [f.type, f.tick])).toEqual([
      ["resource_discovered", discoveredAtTick],
    ]);
    // Przyczyna: dostępność MIN-001 w regionie (ENABLING), nie przypadek.
    const edge = run.causalEdges.find((e) => e.targetFactId === ironFacts[0]!.id);
    expect(edge?.type).toBe("ENABLING");
    const chronicle = run.chronicleEntries.filter(
      (e) => e.eventType === "resource_discovered",
    );
    expect(chronicle).toHaveLength(1);
  });

  it("N/O: over 600 ticks every deposit gets at most one fact per status, and nothing is emitted while the status is unchanged", () => {
    const run = runner(referenceState());
    for (let i = 0; i < 600; i++) run.step();
    const seen = new Map<string, number>();
    for (const fact of run.facts) {
      if (!RESOURCE_FACTS.includes(fact.type)) continue;
      const key = `${fact.subject.entityId}:${fact.type}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    for (const [key, count] of seen) expect(count, key).toBe(1);
    // D3 nie ujawnia złóż bez reguł / bez głębokości (grain już DISCOVERED od startu, timber bez reguł).
    expect(run.worldState.resourceDeposits[TIMBER]!.discovery.status).toBe("UNKNOWN");
  });

  it("H: a SUSPECTED deposit is not used economically (no extraction, no output from it)", () => {
    const run = runner(withDeposit(referenceState(), GRAIN, { status: "SUSPECTED" }));
    for (let i = 0; i < 6; i++) run.step();
    const grain = run.worldState.resourceDeposits[GRAIN]!;
    expect(grain.discovery.status).toBe("SUSPECTED"); // grain nie ma reguł -- nic go nie awansuje
    expect(grain.extraction.cumulativeExtraction).toBe(0);
  });

  it("I: a DISCOVERED deposit is used under the normal rules", () => {
    const run = runner(referenceState());
    for (let i = 0; i < 6; i++) run.step();
    expect(
      run.worldState.resourceDeposits[GRAIN]!.extraction.cumulativeExtraction,
    ).toBeGreaterThan(0);
  });

  it("P: the Architect reveal still takes an UNKNOWN deposit straight to DISCOVERED (Architect Spec §83/§157)", () => {
    const state = referenceState();
    const rule = content.architectInterventionRulesById.reveal_resource_deposit!;
    const result = applyArchitectIntervention(
      state,
      rule,
      {
        instanceId: "intervention_reveal_iron",
        tick: 0,
        target: { scopeType: "entity", entityIds: [IRON] },
        parameters: {},
      },
      createFactStore(),
    );
    expect(result.outcome).toBe("COMPLETED");
    if (result.outcome !== "COMPLETED") return;
    expect(result.worldState.resourceDeposits[IRON]!.discovery.status).toBe("DISCOVERED");
  });

  it("Q: a region without population does not discover deposits on its own, even with the gate and a qualifying deposit", () => {
    let state = withDeposit(referenceState(), TIMBER, { depth: 0 });
    const technologyStateId =
      state.regions.region_timberland!.knowledge.technologyStateId!;
    state = {
      ...state,
      technologyStates: {
        ...state.technologyStates,
        [technologyStateId]: setDiscoveryState(
          state.technologyStates[technologyStateId]!,
          "min_001",
          { status: "AVAILABLE", availability: 1 },
        ),
      },
    };
    expect(state.regions.region_timberland!.population.totalPopulation).toBe(0);
    const rules = {
      ...content.resourceDiscoveryRulesByResourceId,
      timber: {
        detection: [
          { discoveryId: "min_001", targetStatus: "DISCOVERED" as const, maxDepth: 30 },
        ],
      },
    };
    const run = runner(state, { resourceDiscoveryRulesByResourceId: rules });
    for (let i = 0; i < 3; i++) run.step();
    expect(run.worldState.resourceDeposits[TIMBER]!.discovery.status).toBe("UNKNOWN");
  });

  it("S: two identical runs give identical discovery states, facts and Chronicle", () => {
    const a = runner(referenceState());
    const b = runner(referenceState());
    for (let i = 0; i < 120; i++) {
      a.step();
      b.step();
    }
    expect(b.getState()).toEqual(a.getState());
    expect(b.facts).toEqual(a.facts);
    expect(b.chronicleEntries).toEqual(a.chronicleEntries);
  });

  it("R: save -> load -> continue across the discovery tick equals an uninterrupted run", () => {
    const straight = runner(referenceState());
    const saved = runner(referenceState());
    for (let i = 0; i < 60; i++) {
      straight.step();
      saved.step();
    }
    expect(saved.worldState.resourceDeposits[IRON]!.discovery.status).toBe("UNKNOWN");
    const restored = WorldRunner.fromState(structuredClone(saved.getState()), content);
    for (let i = 0; i < 60; i++) {
      straight.step();
      restored.step();
    }
    expect(straight.worldState.resourceDeposits[IRON]!.discovery.status).toBe(
      "DISCOVERED",
    );
    expect(restored.getState()).toEqual(straight.getState());
  });
});

describe("D3 information disclosure matrix (Read Models)", () => {
  const BM = "region_black_mountain";

  function ironAt(status: DepositDiscoveryStatus): WorldState {
    return withDeposit(referenceState(), IRON, { status });
  }

  it("J: UNKNOWN leaks nothing -- no deposit, no type, no suspicion signal, not in the snapshot", () => {
    const state = ironAt("UNKNOWN");
    expect(buildResourceDepositReadModels(state, BM)).toEqual([]);
    const summary = buildRegionSummaryReadModel(state, BM)!;
    expect(summary.resourceDefinitionIds).toEqual([]);
    expect(summary.suspectedDepositCount).toBe(0);
    expect(JSON.stringify(buildWorldSnapshot(state, []))).not.toContain(IRON);
  });

  it("K: SUSPECTED shows only 'a resource may exist in this region' -- no type, id, quantity, quality or depth", () => {
    const state = ironAt("SUSPECTED");
    expect(buildResourceDepositReadModels(state, BM)).toEqual([]);
    const summary = buildRegionSummaryReadModel(state, BM)!;
    expect(summary.suspectedDepositCount).toBe(1);
    expect(summary.resourceDefinitionIds).toEqual([]);
    expect(buildRegionVisualProfileReadModel(state, BM)!.extraction).toEqual([]);
    const snapshot = JSON.stringify(buildWorldSnapshot(state, []));
    expect(snapshot).not.toContain(IRON);
    expect(snapshot).not.toContain("iron_ore");
  });

  it("L: DISCOVERED shows type, region, quantity and extraction state -- but not depth/quality/accessibility", () => {
    const [deposit] = buildResourceDepositReadModels(ironAt("DISCOVERED"), BM);
    expect(deposit).toMatchObject({
      depositId: IRON,
      resourceDefinitionId: "iron_ore",
      discoveryStatus: "DISCOVERED",
      quantity: 5000,
      extractionRate: 0,
      depleted: false,
      depth: undefined,
      quality: undefined,
      accessibility: undefined,
    });
  });

  it("M: ASSESSED adds the fuller assessment the model already has (depth, quality, accessibility)", () => {
    const [deposit] = buildResourceDepositReadModels(ironAt("ASSESSED"), BM);
    expect(deposit).toMatchObject({
      discoveryStatus: "ASSESSED",
      depth: 10,
      quality: 1,
      accessibility: 1,
    });
  });

  it("K (WHY): a resource_suspected fact never reveals the deposit id in the WHY view", () => {
    // Głębsze żelazo: MIN-001 daje tylko SUSPECTED.
    const run = runner(withDeposit(referenceState(), IRON, { depth: 100 }));
    let suspectedFactId: string | undefined;
    for (let i = 0; i < 600 && !suspectedFactId; i++) {
      run.step();
      suspectedFactId = run.facts.find((f) => f.type === "resource_suspected")?.id;
    }
    expect(suspectedFactId).toBeDefined();
    expect(run.worldState.resourceDeposits[IRON]!.discovery.status).toBe("SUSPECTED");
    const why = buildWorldWhyView(run, suspectedFactId!, run.tick);
    const target = why.facts.find((f) => f.id === suspectedFactId)!;
    expect(target.subject.entityId).toBe(UNDISCLOSED_DEPOSIT_ID);
    expect(JSON.stringify(why.facts)).not.toContain(IRON);
    expect(
      JSON.stringify(buildWorldSnapshot(run.worldState, run.facts, {}, run.causalEdges)),
    ).not.toContain(IRON);
  });

  it("the shared lifecycle keeps DISCOVERED facts disclosed once the world knows the deposit", () => {
    const state = referenceState();
    const discovered = discoverDeposit(state.resourceDeposits[IRON]!, {
      tick: 0,
      targetStatus: "DISCOVERED",
      confidence: 1,
    });
    expect(discovered.facts[0]!.subject.entityId).toBe(IRON);
  });
});
