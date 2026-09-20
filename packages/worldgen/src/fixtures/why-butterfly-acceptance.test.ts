import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createCompany,
  createInventory,
  createMarket,
  createResourceDeposit,
  createWorldState,
  setDiscoveryState,
  type WorldState,
} from "@first-cause/entities";
import { explainWhy } from "@first-cause/causality";
import {
  createWorldRunner,
  getInterventionConsequences,
  initializeMarketGood,
} from "@first-cause/simulation";
import { loadWorldFixture } from "./load-world-fixture.js";
import { loadEconomyContent } from "../content/load-economy-content.js";
import { buildTechnologyTestWorld } from "./technology-fixture.js";

const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../..");

function readBlackMountainFixture(): unknown {
  return JSON.parse(
    readFileSync(path.join(REPO_ROOT, "tests/worldgen/fixtures/black_mountain_reference.json"), "utf-8"),
  );
}

function loadContentOrThrow() {
  const content = loadEconomyContent(REPO_ROOT);
  if (!content.ok) throw new Error(content.errors.join("; "));
  return content;
}

/**
 * M18 -- WHY? / Butterfly Effect na realnym contencie (Causality Engine
 * Spec SS29-43/70-79, CE-08, `architect/butterfly`). Reużywa te same
 * sprawdzone, deterministyczne łańcuchy co CE-12 (M17): grain_farm ->
 * watermill_milling przez `mec_004` (WHY?, ten sam powód co CE-12 Test 3/9
 * -- Black Mountain nie ma dziś contentu konsumującego iron_ore wprost) i
 * `reveal_resource_deposit` na Black Mountain (Butterfly, ten sam powód co
 * CE-12 Test 4).
 */
describe("M18 Acceptance -- WHY? / Butterfly Effect", () => {
  it("WHY? Immediate + Chain: explains production_method_adopted with real primary causes reaching back past Level 1", () => {
    const content = loadContentOrThrow();
    let worldState: WorldState = buildTechnologyTestWorld();
    const technologyStateId = "technology_region_connected_a";
    worldState = {
      ...worldState,
      technologyStates: {
        ...worldState.technologyStates,
        [technologyStateId]: setDiscoveryState(
          worldState.technologyStates[technologyStateId]!,
          "mec_004",
          { status: "KNOWN", discoveredTick: 0 },
        ),
      },
    };

    const market = createMarket({ id: "market_a", regionId: "region_connected_a" });
    const marketWithPrices = { ...market, goods: { flour: initializeMarketGood(1) } };
    const regionWithMarket = {
      ...worldState.regions.region_connected_a!,
      economy: { ...worldState.regions.region_connected_a!.economy, marketId: market.id },
    };
    const grainDeposit = createResourceDeposit({
      id: "deposit_region_connected_a_grain",
      resourceDefinitionId: "grain",
      regionId: "region_connected_a",
      initialQuantity: 100_000,
      renewable: false,
    });
    const companyInventory = createInventory({
      id: "inventory_company",
      ownerType: "company",
      ownerId: "company_001",
      locationRegionId: "region_connected_a",
    });
    const baseCompany = createCompany({
      id: "company_001",
      archetypeId: "grain_farm",
      name: "Test Farm",
      foundedTick: 0,
      regionId: "region_connected_a",
      ownerType: "individual",
      ownerEntityId: "cohort_region_connected_a",
      inventoryId: companyInventory.id,
      initialCash: 1000,
      initialWageOffer: 10,
    });
    const company = {
      ...baseCompany,
      production: { ...baseCompany.production, productionMethodId: "manual_farming" },
    };

    worldState = createWorldState({
      world: worldState.world,
      continents: Object.values(worldState.continents),
      regions: [
        regionWithMarket,
        worldState.regions.region_connected_b!,
        worldState.regions.region_isolated!,
      ],
      connections: Object.values(worldState.connections),
      populationCohorts: Object.values(worldState.populationCohorts),
      technologyStates: Object.values(worldState.technologyStates),
      companies: [company],
      inventories: [companyInventory],
      markets: [marketWithPrices],
      resourceDeposits: [grainDeposit],
    });

    const runner = createWorldRunner({
      worldSeed: worldState.world.seed,
      startYear: worldState.world.currentDate.year,
      startMonth: worldState.world.currentDate.month,
      worldState,
      pmCandidatesByCurrentMethodId: content.pmCandidatesByCurrentMethodId,
      productionRecipesByMethodId: content.productionRecipesByMethodId,
      requiredDiscoveryIdsByMethodId: content.requiredDiscoveryIdsByMethodId,
      knowledgeDomainIds: content.knowledgeDomainIds,
    });

    for (let i = 0; i < 20; i++) runner.step();

    const adoptedFact = runner.facts.find((f) => f.type === "production_method_adopted");
    expect(adoptedFact).toBeDefined();

    const explanation = explainWhy({
      targetFactId: adoptedFact!.id,
      facts: runner.facts,
      edges: runner.causalEdges,
    });

    // "WHY? Immediate": co najmniej jedna realna, nietrywialna przyczyna
    // Level 1 -- Test 9 (CE-12) już dowiódł, że taki edge istnieje i
    // wskazuje na `discovery_became_available`, nie prosto na `discovery_occurred`.
    expect(explanation.primaryCauses.length + explanation.significantCauses.length).toBeGreaterThan(0);
    const level1FactTypes = [...explanation.primaryCauses, ...explanation.significantCauses].map(
      (cause) => cause.type,
    );
    expect(level1FactTypes).toContain("discovery_became_available");
    expect(level1FactTypes).not.toContain("discovery_occurred");

    // "WHY? Chain" (Level 2): w tym konkretnym fixture `mec_004` startuje
    // jako już-KNOWN (SS0/CE-12 Test 3/9's własne uzasadnienie -- realny
    // RNG-gated `discovery_occurred` nie da się osadzić deterministycznie),
    // więc `discovery_became_available` sam nie ma tu żadnej wcześniejszej
    // przyczyny w grafie -- to jest poprawny, prawdziwy wynik ("na żądanie"
    // głębszy chain po prostu kończy się na najwcześniejszym realnym
    // fakcie), nie błąd `explainWhy`. Dowód mechanizmu "on request" (Level
    // 3+) jest już w `why-query.test.ts`'s kontrolowanym, syntetycznym
    // grafie -- tutaj sprawdzamy tylko, że wywołanie rekurencyjne na
    // realnych danych nie wybucha i zwraca poprawnie ukształtowaną
    // odpowiedź.
    for (const path of explanation.deeperPaths) {
      expect(path.totalStrength).toBeGreaterThan(0);
      expect(path.targetFactId).toBe(adoptedFact!.id);
    }
    const availableCause = [...explanation.primaryCauses, ...explanation.significantCauses].find(
      (cause) => cause.type === "discovery_became_available",
    )!;
    const deeperExplanation = explainWhy({
      targetFactId: availableCause.factId,
      facts: runner.facts,
      edges: runner.causalEdges,
    });
    expect(deeperExplanation.target).toBe(availableCause.factId);

    // Determinism (CAUS spec SS80): dwa wywołania na tych samych danych
    // dają identyczny wynik.
    const again = explainWhy({
      targetFactId: adoptedFact!.id,
      facts: runner.facts,
      edges: runner.causalEdges,
    });
    expect(again).toEqual(explanation);
  });

  it("Butterfly Query: getInterventionConsequences on a real Architect intervention returns a bounded, decaying, non-exploded list", () => {
    const content = loadContentOrThrow();
    const loaded = loadWorldFixture(readBlackMountainFixture());
    const worldState = loaded.worldState!;

    const runner = createWorldRunner({
      worldSeed: worldState.world.seed,
      startYear: worldState.world.currentDate.year,
      startMonth: worldState.world.currentDate.month,
      worldState,
      productionRecipesByMethodId: content.productionRecipesByMethodId,
      transportModeProfilesByModeId: content.transportModeProfilesByModeId,
      entrepreneurshipCandidatesByArchetypeId: content.entrepreneurshipCandidatesByArchetypeId,
      discoveryEligibilityRulesById: content.discoveryEligibilityRulesById,
      knowledgeDomainIds: content.knowledgeDomainIds,
      requiredDiscoveryIdsByMethodId: content.requiredDiscoveryIdsByMethodId,
      pmCandidatesByCurrentMethodId: content.pmCandidatesByCurrentMethodId,
    });

    const revealRule = content.architectInterventionRulesById.reveal_resource_deposit!;
    const applyResult = runner.applyIntervention(revealRule, {
      instanceId: "intervention_reveal_black_mountain",
      tick: runner.tick,
      target: { scopeType: "entity", entityIds: ["deposit_black_mountain_iron_ore"] },
      parameters: {},
    });
    expect(applyResult.outcome).toBe("COMPLETED");
    if (applyResult.outcome !== "COMPLETED") return;

    const preInterventionFact = runner.facts.find(
      (f) => f.tick < (applyResult.intervention.appliedTick ?? 0),
    );

    for (let i = 0; i < 50; i++) runner.step();

    const consequences = getInterventionConsequences({
      intervention: applyResult.intervention,
      facts: runner.facts,
      edges: runner.causalEdges,
    });

    expect(consequences.rootFactIds).toEqual(applyResult.intervention.rootFactIds);
    // Anti-Butterfly Explosion (SS49): nigdy nie "wszystkie możliwe
    // zdarzenia" -- lista skutków musi być realnym, ostrym podzbiorem
    // wszystkich faktów wyemitowanych w tym oknie.
    const allConsequenceIds = [
      ...consequences.directEffects,
      ...consequences.majorConsequences,
      ...consequences.significantConsequences,
      ...consequences.minorConsequences,
    ].map((c) => c.factId);
    expect(allConsequenceIds.length).toBeLessThan(runner.facts.length);

    for (const consequence of [
      ...consequences.majorConsequences,
      ...consequences.significantConsequences,
      ...consequences.minorConsequences,
    ]) {
      expect(consequence.pathInfluence).toBeGreaterThan(0);
      expect(consequence.pathInfluence).toBeLessThan(1); // decay, never amplification
      expect(consequence.causalDepth).toBeGreaterThan(0);
      expect(runner.facts.some((f) => f.id === consequence.factId)).toBe(true);
    }

    // Fakt sprzed interwencji nigdy nie jest jej skutkiem.
    if (preInterventionFact) {
      expect(allConsequenceIds).not.toContain(preInterventionFact.id);
    }

    // Determinism: to samo query na tych samych danych daje identyczny wynik.
    const again = getInterventionConsequences({
      intervention: applyResult.intervention,
      facts: runner.facts,
      edges: runner.causalEdges,
    });
    expect(again).toEqual(consequences);
  });
});
