import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createArchitectInfluenceState, type WorldState } from "@first-cause/entities";
import { createFactStore } from "@first-cause/causality";
import { applyArchitectIntervention, parseArchitectInterventionRule } from "@first-cause/simulation";
import { loadWorldFixture } from "./load-world-fixture.js";

const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../..");

function readBlackMountainFixture(): unknown {
  const filePath = path.join(
    REPO_ROOT,
    "tests/worldgen/fixtures/black_mountain_reference.json",
  );
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

const revealRule = parseArchitectInterventionRule(
  "reveal_resource_deposit",
  "resources",
  ["entity"],
  {},
  { base: 15 },
  12,
  "resource_discovered",
);

/**
 * Dowodzi wprost 4 zdań z M16's Acceptance Gate (Implementation Roadmap
 * v0.2), na tym samym Black Mountain fixture co `load-economy-content.
 * test.ts`'s 12-tick regression (roadmapa §157 "Cel testowy: Black
 * Mountain" dla `Reveal Resource Deposit`).
 */
describe("M16 Acceptance Gate", () => {
  it("gracz z wystarczającym Influence może ujawnić istniejące złoże w Black Mountain", () => {
    const worldState = loadWorldFixture(readBlackMountainFixture()).worldState!;
    expect(worldState.resourceDeposits.deposit_black_mountain_iron_ore!.discovery.status).toBe(
      "UNKNOWN",
    );

    const result = applyArchitectIntervention(
      worldState,
      revealRule,
      {
        instanceId: "intervention_reveal_black_mountain",
        tick: 0,
        target: { scopeType: "entity", entityIds: ["deposit_black_mountain_iron_ore"] },
        parameters: {},
      },
      createFactStore(),
    );

    expect(result.outcome).toBe("COMPLETED");
    if (result.outcome !== "COMPLETED") return;
    expect(
      result.worldState.resourceDeposits.deposit_black_mountain_iron_ore!.discovery.status,
    ).toBe("DISCOVERED");
  });

  it("interwencja tworzy Root Fact (ARCH-007)", () => {
    const worldState = loadWorldFixture(readBlackMountainFixture()).worldState!;
    const factStore = createFactStore();

    const result = applyArchitectIntervention(
      worldState,
      revealRule,
      {
        instanceId: "intervention_reveal_black_mountain",
        tick: 0,
        target: { scopeType: "entity", entityIds: ["deposit_black_mountain_iron_ore"] },
        parameters: {},
      },
      factStore,
    );

    expect(result.outcome).toBe("COMPLETED");
    if (result.outcome !== "COMPLETED") return;
    expect(result.intervention.rootFactIds).toHaveLength(1);
    const rootFact = factStore
      .all()
      .find((fact) => fact.id === result.intervention.rootFactIds[0]);
    expect(rootFact?.architect).toEqual({
      interventionId: "intervention_reveal_black_mountain",
      influenceStrength: 1,
    });
  });

  it("brak Influence blokuje interwencję z czytelnym komunikatem", () => {
    const base = loadWorldFixture(readBlackMountainFixture()).worldState!;
    const worldState: WorldState = {
      ...base,
      architectInfluence: createArchitectInfluenceState(1), // za mało na koszt bazowy 15
    };

    const result = applyArchitectIntervention(
      worldState,
      revealRule,
      {
        instanceId: "intervention_reveal_black_mountain",
        tick: 0,
        target: { scopeType: "entity", entityIds: ["deposit_black_mountain_iron_ore"] },
        parameters: {},
      },
      createFactStore(),
    );

    expect(result.outcome).toBe("REJECTED");
    if (result.outcome !== "REJECTED") return;
    expect(result.errors.join(" ")).toMatch(/insufficient Influence/i);
    // Nic nie ujawnione -- interwencja faktycznie zablokowana, nie tylko zgłoszona jako błąd.
    expect(worldState.resourceDeposits.deposit_black_mountain_iron_ore!.discovery.status).toBe(
      "UNKNOWN",
    );
  });

  it("brak gwarancji, że ujawnienie złoża wywoła boom (ARCH-008): interwencja nie zakłada firmy ani nie zmienia niczego poza samym złożem", () => {
    const worldState = loadWorldFixture(readBlackMountainFixture()).worldState!;
    const companyCountBefore = Object.keys(worldState.companies).length;

    const result = applyArchitectIntervention(
      worldState,
      revealRule,
      {
        instanceId: "intervention_reveal_black_mountain",
        tick: 0,
        target: { scopeType: "entity", entityIds: ["deposit_black_mountain_iron_ore"] },
        parameters: {},
      },
      createFactStore(),
    );

    expect(result.outcome).toBe("COMPLETED");
    if (result.outcome !== "COMPLETED") return;
    // Sam efekt bezpośredni jest gwarantowany (status -> DISCOVERED), ale
    // NIC downstream (firma, zatrudnienie, produkcja) nie jest -- to samo
    // WorldState poza `resourceDeposits`/`architectInfluence`/
    // `interventions` pozostaje nietknięte w tym samym wywołaniu.
    expect(Object.keys(result.worldState.companies)).toHaveLength(companyCountBefore);
    expect(result.worldState.regions).toEqual(worldState.regions);
    expect(result.worldState.settlements).toEqual(worldState.settlements);
  });
});
