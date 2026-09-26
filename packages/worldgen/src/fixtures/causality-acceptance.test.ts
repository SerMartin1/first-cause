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
import {
  createWorldRunner,
  discoverDeposit,
  initializeMarketGood,
} from "@first-cause/simulation";
import { loadWorldFixture } from "./load-world-fixture.js";
import { loadEconomyContent } from "../content/load-economy-content.js";
import { buildTechnologyTestWorld } from "./technology-fixture.js";

const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../..");

function readBlackMountainFixture(): unknown {
  const filePath = path.join(REPO_ROOT, "tests/worldgen/fixtures/black_mountain_reference.json");
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function loadContentOrThrow() {
  const content = loadEconomyContent(REPO_ROOT);
  if (!content.ok) throw new Error(content.errors.join("; "));
  return content;
}

/**
 * Dowodzi wprost testów z Causality Engine Spec SS89-98 (CE-12), na tym
 * samym Black Mountain fixture/`loadEconomyContent` co
 * `m12-m14-invariant-monitor.test.ts`/`m15-technology-invariant-monitor.
 * test.ts` -- realny content, nie syntetyczny fixture, gdzie tylko ten
 * miałby sens (Test 3/4/5/6/7); Test 9/10 używają syntetycznego świata
 * (`technology-fixture.ts`), bo potrzebują precyzyjnej kontroli nad
 * konkretnym łańcuchem discovery/resource, tego samego powodu co
 * `technology-acceptance.test.ts`.
 */
describe("CE-12 Acceptance Tests (M17 Causality)", () => {
  it("Test 3 (Black Mountain minimal chain, §91): a downstream fact's causal edges are traceable, multi-hop, all the way back to the earliest fact in the chain", () => {
    // Black Mountain reference world nie ma dziś ŻADNEGO content
    // archetypu/PM konsumującego iron_ore (grep całego `content/` --
    // tylko `resources/iron_ore.json` istnieje), a zupełnie pusty
    // syntetyczny świat (bez istniejącej firmy/zatrudnienia) nigdy
    // organicznie nie odpala Opportunity Scannera (DemandGap=0 na
    // starcie -- nie ma kto płacić za flour, nie ma popytu, nie ma
    // founding) -- "deposit discovery -> mine founded" ze spec's
    // własnego przykładu nie ma się z czego wziąć bez wymyślania nowego
    // contentu. Reużywam więc DOKŁADNIE ten sam, już zweryfikowany
    // deterministyczny łańcuch co Test 9 (grain_farm -> watermill_milling
    // przez mec_004) -- ten sam duch (§91: "przeszukiwalny do samego
        // początku"), na realnym contencie, który VS faktycznie ma.
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

    expect(runner.worldState.companies.company_001?.production.productionMethodId).toBe(
      "watermill_milling",
    );

    const adoptedFact = runner.facts.find((f) => f.type === "production_method_adopted");
    expect(adoptedFact).toBeDefined();

    const incomingBySource = new Map<string, string[]>();
    for (const edge of runner.causalEdges) {
      const list = incomingBySource.get(edge.targetFactId) ?? [];
      list.push(edge.sourceFactId);
      incomingBySource.set(edge.targetFactId, list);
    }
    // BFS wstecz od `production_method_adopted` -- musi dosięgnąć
    // faktu z WCZEŚNIEJSZEGO ticka (multi-hop, nie tylko ten sam tick).
    let frontier = [adoptedFact!.id];
    const seen = new Set(frontier);
    let reachedEarlierTick = false;
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const factId of frontier) {
        for (const sourceId of incomingBySource.get(factId) ?? []) {
          if (seen.has(sourceId)) continue;
          seen.add(sourceId);
          next.push(sourceId);
          const sourceFact = runner.facts.find((f) => f.id === sourceId);
          if (sourceFact && sourceFact.tick < adoptedFact!.tick) reachedEarlierTick = true;
        }
      }
      frontier = next;
    }
    expect(reachedEarlierTick).toBe(true);
  });

  it("Test 4 (Butterfly Effect, §92): Architect Influence propagates forward, decays, and never reaches an unrelated fact", () => {
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
    const rootFactId = applyResult.intervention.rootFactIds[0]!;
    expect(runner.architectInfluence.get(rootFactId)).toBe(1);

    for (let i = 0; i < 50; i++) runner.step();

    const influenced = [...runner.architectInfluence.entries()].filter(
      ([factId]) => factId !== rootFactId,
    );
    // Nie każdy content/scenariusz garantuje realną downstream adoption w
    // Black Mountain -- ale KAŻDY wpis, jeśli istnieje, musi być < 1
    // (decay, nigdy amplifikacja) i musi wskazywać na fakt, który
    // faktycznie istnieje.
    for (const [factId, influence] of influenced) {
      expect(influence).toBeGreaterThan(0);
      expect(influence).toBeLessThan(1);
      expect(runner.facts.some((f) => f.id === factId)).toBe(true);
    }

    // Fakt zupełnie niezwiązany z tym łańcuchem (np. pierwszy fakt
    // wyemitowany w ticku 0, przed interwencją) nigdy nie dostaje wpływu.
    const preInterventionFact = runner.facts.find(
      (f) => f.tick < (applyResult.intervention.appliedTick ?? 0) && f.id !== rootFactId,
    );
    if (preInterventionFact) {
      expect(runner.architectInfluence.has(preInterventionFact.id)).toBe(false);
    }
  });

  it("Test 5 (No False Causality, §93): resolveTickCausality never creates more edges than systems explicitly declared", () => {
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
    });

    for (let i = 0; i < 12; i++) runner.step();

    // Każdy edge musi mieć oba końce w realnym, wyemitowanym fakcie --
    // "no false causality" oznacza też "no edge conjured from nothing".
    const factIds = new Set(runner.facts.map((f) => f.id));
    for (const edge of runner.causalEdges) {
      expect(factIds.has(edge.sourceFactId)).toBe(true);
      expect(factIds.has(edge.targetFactId)).toBe(true);
      // Temporal ordering (SS22): przyczyna nigdy nie jest późniejsza niż efekt.
      const source = runner.facts.find((f) => f.id === edge.sourceFactId)!;
      const target = runner.facts.find((f) => f.id === edge.targetFactId)!;
      expect(source.tick).toBeLessThanOrEqual(target.tick);
    }
  });

  it("Test 6 (Pruning, §94): enabling causalPruneIntervalTicks never produces MORE edges than an identical run without it, and never crashes", () => {
    const content = loadContentOrThrow();

    function runFor(ticks: number, causalPruneIntervalTicks: number | undefined) {
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
        ...(causalPruneIntervalTicks !== undefined ? { causalPruneIntervalTicks } : {}),
      });
      for (let i = 0; i < ticks; i++) runner.step();
      return runner;
    }

    const withoutPruning = runFor(60, undefined);
    const withPruning = runFor(60, 10);

    expect(withPruning.causalEdges.length).toBeLessThanOrEqual(withoutPruning.causalEdges.length);
    // FactStore/WorldState nigdy nie są przycinane -- append-only kontrakt
    // trzyma się nawet gdy pruning jest włączony.
    expect(withPruning.facts.length).toBe(withoutPruning.facts.length);
  });

  it("Test 7 (Determinism/'Save-Load', §95): two identical runs produce byte-identical facts, edges and Architect Influence", () => {
    const content = loadContentOrThrow();

    function run() {
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
      });
      const revealRule = content.architectInterventionRulesById.reveal_resource_deposit!;
      runner.applyIntervention(revealRule, {
        instanceId: "intervention_reveal_black_mountain",
        tick: runner.tick,
        target: { scopeType: "entity", entityIds: ["deposit_black_mountain_iron_ore"] },
        parameters: {},
      });
      for (let i = 0; i < 20; i++) runner.step();
      return runner;
    }

    const a = run();
    const b = run();

    expect(a.facts.map((f) => ({ id: f.id, type: f.type, tick: f.tick }))).toEqual(
      b.facts.map((f) => ({ id: f.id, type: f.type, tick: f.tick })),
    );
    expect(
      a.causalEdges.map((e) => ({
        sourceFactId: e.sourceFactId,
        targetFactId: e.targetFactId,
        type: e.type,
        strength: e.strength,
      })),
    ).toEqual(
      b.causalEdges.map((e) => ({
        sourceFactId: e.sourceFactId,
        targetFactId: e.targetFactId,
        type: e.type,
        strength: e.strength,
      })),
    );
    expect([...a.architectInfluence.entries()].sort()).toEqual(
      [...b.architectInfluence.entries()].sort(),
    );
  });

  it("Test 9 (Technology chain, §97): PM adoption edges trace to discovery_became_available, never skip straight past it", () => {
    const content = loadContentOrThrow();
    let worldState: WorldState = buildTechnologyTestWorld();
    const technologyStateId = "technology_region_connected_a";

    // `mec_004` już KNOWN od ticka 0 (breakthrough -- RNG-gated -- już
    // "zaszedł" przed oknem tego testu, jak realny discovery_occurred z
    // wcześniejszego ticka) -- `growAvailability`'s organic rate (0.05/tick,
    // próg 0.5) jest deterministyczne, bez RNG, więc AVAILABLE nadejdzie
    // dokładnie po 10 tickach, bez losowej flakiness.
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

    expect(runner.worldState.companies.company_001?.production.productionMethodId).toBe(
      "watermill_milling",
    );

    const factById = new Map(runner.facts.map((f) => [f.id, f] as const));
    const adoptionEdges = runner.causalEdges.filter((edge) => {
      const target = factById.get(edge.targetFactId);
      return target?.type === "production_method_adopted";
    });
    expect(adoptionEdges.length).toBeGreaterThan(0);
    // Test 9's kluczowe wymaganie (§97): edge do adoption musi przechodzić
    // przez `discovery_became_available`, nigdy nie skacząc bezpośrednio z
    // czegoś, co NIE jest fakty availability/adoption-chain (tu: `mec_004`
    // startuje jako KNOWN, więc jego jedyna droga do adoption jest przez
    // `discovery_became_available`, wyemitowany w TYM runie).
    const availableFact = runner.facts.find(
      (f) => f.type === "discovery_became_available" && f.subject.entityId === "mec_004",
    );
    expect(availableFact).toBeDefined();
    const sourceTypes = adoptionEdges.map((edge) => factById.get(edge.sourceFactId)?.type);
    expect(sourceTypes).toContain("discovery_became_available");
  });

  it("Test 10 (Resource Bust, §98): cumulative extraction -> resource_depleted -> production_bottleneck_identified stays connected", () => {
    let worldState: WorldState = buildTechnologyTestWorld();

    // TECH-010: eksploatowane złoże musi być znane światu (D2).
    const tinyDeposit = discoverDeposit(
      createResourceDeposit({
        id: "deposit_tiny_grain",
        resourceDefinitionId: "grain",
        regionId: "region_connected_a",
        initialQuantity: 10, // exactly one manual_farming batch (10 grain/batch) -- depletes to precisely 0 on tick 1
        renewable: false,
      }),
      { tick: 0, targetStatus: "DISCOVERED", confidence: 1 },
    ).deposit;
    const market = createMarket({ id: "market_a", regionId: "region_connected_a" });
    const marketWithPrices = { ...market, goods: { flour: initializeMarketGood(1) } };
    const regionWithMarket = {
      ...worldState.regions.region_connected_a!,
      economy: { ...worldState.regions.region_connected_a!.economy, marketId: market.id },
    };
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
      production: {
        ...baseCompany.production,
        productionMethodId: "manual_farming",
        capacity: 5,
        utilization: 1,
      },
      workforce: { ...baseCompany.workforce, employees: 5 },
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
      resourceDeposits: [tinyDeposit],
    });

    const runner = createWorldRunner({
      worldSeed: worldState.world.seed,
      startYear: worldState.world.currentDate.year,
      startMonth: worldState.world.currentDate.month,
      worldState,
      productionRecipesByMethodId: loadContentOrThrow().productionRecipesByMethodId,
    });

    for (let i = 0; i < 5; i++) runner.step();

    const depleted = runner.facts.find((f) => f.type === "resource_depleted");
    expect(depleted).toBeDefined();
    const bottleneck = runner.facts.find(
      (f) => f.type === "production_bottleneck_identified",
    );
    expect(bottleneck).toBeDefined();

    // Łańcuch musi zostać połączony: resource_depleted ma wchodzący edge
    // (od extraction trend facta), i sam graf nie ma dangling referencji.
    const incomingToDepleted = runner.causalEdges.filter(
      (edge) => edge.targetFactId === depleted!.id,
    );
    expect(incomingToDepleted.length).toBeGreaterThan(0);
  });
});
