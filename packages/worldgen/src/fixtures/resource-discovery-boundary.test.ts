import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { WorldState } from "@first-cause/entities";
import { createFactStore } from "@first-cause/causality";
import {
  applyArchitectIntervention,
  createWorldRunner,
  WorldRunner,
} from "@first-cause/simulation";
import { loadWorldFixture } from "./load-world-fixture.js";
import { loadEconomyContent } from "../content/load-economy-content.js";

/**
 * D1/D2 (decyzja właściciela 2026-09-26, Canonical Decisions TECH-010,
 * AI Decision Model §113): regresja na PRAWDZIWYM fixture i pełnym ticku --
 * złoże nieznane światu nie może zostać gospodarczo użyte, a jego ukryty
 * stock nie może wpływać na decyzje. Discovery poprzedza eksploatację;
 * eksploatacja nigdy sama nie odkrywa złoża (wariant C odrzucony).
 */
const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);
const content = loadEconomyContent(REPO_ROOT);
const GRAIN = "deposit_green_valley_grain";

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

/** Stan po ominięciu walidacji D1 -- symuluje świat, w którym złoże zboża jest nieznane. */
function withHiddenGrain(state: WorldState, quantity?: number): WorldState {
  const deposit = state.resourceDeposits[GRAIN]!;
  return {
    ...state,
    resourceDeposits: {
      ...state.resourceDeposits,
      [GRAIN]: {
        ...deposit,
        discovery: {
          status: "UNKNOWN",
          discoveredTick: undefined,
          discoveredByEntityId: undefined,
          confidence: 0,
        },
        stock: { ...deposit.stock, quantity: quantity ?? deposit.stock.quantity },
      },
    },
  };
}

function runner(worldState: WorldState, seed = worldState.world.seed) {
  return createWorldRunner({
    ...content,
    worldState,
    worldSeed: seed,
    startYear: worldState.world.currentDate.year,
    startMonth: worldState.world.currentDate.month,
  });
}

describe("resource discovery boundary on the reference world (D1/D2)", () => {
  it("B: a company cannot use an UNKNOWN deposit in the full tick -- no extraction, no output from it", () => {
    const run = runner(withHiddenGrain(referenceState()));
    for (let i = 0; i < 6; i++) run.step();
    const deposit = run.worldState.resourceDeposits[GRAIN]!;
    expect(deposit.extraction.cumulativeExtraction).toBe(0);
    expect(deposit.discovery.status).toBe("UNKNOWN"); // eksploatacja nie odkrywa złoża
    expect(
      run.facts.some(
        (f) => f.subject.entityId === GRAIN || f.type === "resource_discovered",
      ),
    ).toBe(false);
  });

  it("C: the hidden stock of an UNKNOWN deposit never leaks into economic decisions", () => {
    const small = runner(withHiddenGrain(referenceState(), 20));
    const large = runner(withHiddenGrain(referenceState(), 40_000));
    for (let i = 0; i < 12; i++) {
      small.step();
      large.step();
    }
    expect(large.worldState.companies).toEqual(small.worldState.companies);
    expect(large.worldState.markets).toEqual(small.worldState.markets);
    expect(large.facts.map((f) => [f.type, f.subject.entityId, f.values])).toEqual(
      small.facts.map((f) => [f.type, f.subject.entityId, f.values]),
    );
  });

  it("D: the reference world's DISCOVERED grain is used under the normal rules", () => {
    const run = runner(referenceState());
    for (let i = 0; i < 6; i++) run.step();
    expect(
      run.worldState.resourceDeposits[GRAIN]!.extraction.cumulativeExtraction,
    ).toBeGreaterThan(0);
  });

  it("H: an Architect reveal still works and makes a hidden deposit economically usable", () => {
    const hidden = withHiddenGrain(referenceState());
    const rule = content.architectInterventionRulesById.reveal_resource_deposit!;
    const result = applyArchitectIntervention(
      hidden,
      rule,
      {
        instanceId: "intervention_reveal_grain",
        tick: 0,
        target: { scopeType: "entity", entityIds: [GRAIN] },
        parameters: {},
      },
      createFactStore(),
    );
    expect(result.outcome).toBe("COMPLETED");
    if (result.outcome !== "COMPLETED") return;
    const revealed = result.worldState;
    expect(revealed.resourceDeposits[GRAIN]!.discovery.status).toBe("DISCOVERED");
    const run = runner(revealed);
    for (let i = 0; i < 6; i++) run.step();
    expect(
      run.worldState.resourceDeposits[GRAIN]!.extraction.cumulativeExtraction,
    ).toBeGreaterThan(0);
  });

  it("I: save/replay stays deterministic with the discovery gate active", () => {
    const straight = runner(withHiddenGrain(referenceState()));
    const saved = runner(withHiddenGrain(referenceState()));
    for (let i = 0; i < 6; i++) {
      straight.step();
      saved.step();
    }
    const restored = WorldRunner.fromState(structuredClone(saved.getState()), content);
    for (let i = 0; i < 6; i++) {
      straight.step();
      restored.step();
    }
    expect(restored.getState()).toEqual(straight.getState());
  });
});
