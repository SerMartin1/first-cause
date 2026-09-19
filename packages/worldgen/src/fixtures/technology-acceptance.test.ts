import { describe, expect, it } from "vitest";
import {
  createCompany,
  createInventory,
  createMarket,
  createWorldState,
  setDiscoveryState,
  type WorldState,
} from "@first-cause/entities";
import {
  createWorldRng,
  initializeMarketGood,
  runEconomyTick,
  type ProductionRecipe,
} from "@first-cause/simulation";
import { buildTechnologyTestWorld } from "./technology-fixture.js";

/**
 * Dowodzi wprost 3 zdań z M15's Acceptance Gate (Implementation Roadmap
 * v0.2): każdy `it` odpowiada jednemu zdaniu, na małym syntetycznym
 * świecie (`technology-fixture.ts`), nie Black Mountain (patrz tamtego
 * pliku doc comment -- Black Mountain nie linkuje regionów do
 * TechnologyState).
 */
describe("M15 Acceptance Gate", () => {
  it("region bez wymaganej wiedzy nie może odkryć zaawansowanej technologii", () => {
    // T6 (tier 6) wymaga knowledge >= 80 (TIER_KNOWLEDGE_THRESHOLD_TODO_TUNING).
    // populationPerRegion=20_000 daje ~1.5 wiedzy/tick -- po 20 tickach
    // knowledge jest wciąż daleko poniżej 80, więc discovery MUSI zostać UNKNOWN.
    let worldState: WorldState = buildTechnologyTestWorld();
    const rng = createWorldRng("acceptance-eligibility");
    const discoveryEligibilityRulesById = {
      advanced_tech: { primaryDomainId: "agriculture_food", tier: 6, prerequisites: [] },
    };

    for (let tick = 0; tick < 20; tick++) {
      const result = runEconomyTick({
        worldState,
        tick,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
        discoveryRng: (scopeId) => rng.stream("discovery", scopeId),
        discoveryEligibilityRulesById,
        knowledgeDomainIds: ["agriculture_food"],
      });
      worldState = result.worldState;
    }

    const technologyState = worldState.technologyStates.technology_region_isolated!;
    expect(technologyState.knowledge.agriculture_food ?? 0).toBeLessThan(80);
    expect(technologyState.eligibleDiscoveryIds).toEqual([]);
    expect(technologyState.discoveries.advanced_tech?.status ?? "UNKNOWN").toBe("UNKNOWN");
  });

  it("odkrycie nie oznacza automatycznego wdrożenia -- firma odrzuca nieopłacalną, ale dostępną technologię", () => {
    let worldState: WorldState = buildTechnologyTestWorld();
    // Ręcznie ustaw discovery na AVAILABLE w regionie -- ten test dowodzi
    // TYLKO drugiej połowy cyklu (Adoption), nie całej ścieżki eligibility.
    const technologyStateId = "technology_region_connected_a";
    worldState = {
      ...worldState,
      technologyStates: {
        ...worldState.technologyStates,
        [technologyStateId]: setDiscoveryState(
          worldState.technologyStates[technologyStateId]!,
          "gated_discovery",
          { status: "AVAILABLE" },
        ),
      },
    };

    const market = createMarket({ id: "market_a", regionId: "region_connected_a" });
    const marketWithPrices = {
      ...market,
      goods: { output: initializeMarketGood(1) },
    };
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
      archetypeId: "test_archetype",
      name: "Test Co",
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
      production: { ...baseCompany.production, productionMethodId: "current_method" },
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
    });

    const currentRecipe: ProductionRecipe = {
      productionMethodId: "current_method",
      employeesPerBatch: 1,
      resourceInputsPerBatch: {},
      goodInputsPerBatch: {},
      goodOutputsPerBatch: { output: 10 }, // marża wysoka
      eligibleCompanyArchetypeIds: [],
    };
    const unprofitableCandidateRecipe: ProductionRecipe = {
      productionMethodId: "gated_method",
      employeesPerBatch: 1,
      resourceInputsPerBatch: {},
      goodInputsPerBatch: {},
      goodOutputsPerBatch: { output: 1 }, // marża dużo gorsza -- AI-08 MUSI odrzucić
      eligibleCompanyArchetypeIds: [],
    };
    const rng = createWorldRng("acceptance-adoption");

    for (let tick = 0; tick < 10; tick++) {
      const result = runEconomyTick({
        worldState,
        tick,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
        pmCandidatesByCurrentMethodId: { current_method: "gated_method" },
        productionRecipesByMethodId: {
          current_method: currentRecipe,
          gated_method: unprofitableCandidateRecipe,
        },
        requiredDiscoveryIdsByMethodId: { gated_method: ["gated_discovery"] },
      });
      worldState = result.worldState;
    }

    expect(worldState.companies.company_001?.production.productionMethodId).toBe(
      "current_method", // AVAILABLE, ale nieopłacalna -- AI-08 nigdy nie przyjmuje
    );
    expect(
      worldState.technologyStates[technologyStateId]?.discoveries.gated_discovery
        ?.industryAdoption,
    ).toBe(0);
  });

  it("dyfuzja wiedzy jest widoczna między połączonymi regionami", () => {
    let worldState: WorldState = buildTechnologyTestWorld();
    // region_connected_a ma discovery już AVAILABLE (source sygnału
    // dyfuzji); region_connected_b jest z nim połączony (Connection z
    // fixture'a), region_isolated -- nie jest połączony z niczym.
    // Obie strony startują z tym samym KNOWN discovery i tym samym
    // availability (0) -- jedyna różnica to połączenie.
    for (const regionId of ["region_connected_b", "region_isolated"]) {
      const technologyStateId = `technology_${regionId}`;
      worldState = {
        ...worldState,
        technologyStates: {
          ...worldState.technologyStates,
          [technologyStateId]: setDiscoveryState(
            worldState.technologyStates[technologyStateId]!,
            "diffusing_discovery",
            { status: "KNOWN" },
          ),
        },
      };
    }
    worldState = {
      ...worldState,
      technologyStates: {
        ...worldState.technologyStates,
        technology_region_connected_a: setDiscoveryState(
          worldState.technologyStates.technology_region_connected_a!,
          "diffusing_discovery",
          { status: "AVAILABLE" },
        ),
      },
    };

    const discoveryEligibilityRulesById = {
      diffusing_discovery: {
        primaryDomainId: "agriculture_food",
        tier: 0,
        prerequisites: [],
      },
    };
    const rng = createWorldRng("acceptance-diffusion");

    const result = runEconomyTick({
      worldState,
      tick: 0,
      demographyRng: (scopeId) => rng.stream("demography", scopeId),
      migrationRng: (scopeId) => rng.stream("migration", scopeId),
      discoveryRng: (scopeId) => rng.stream("discovery", scopeId),
      discoveryEligibilityRulesById,
      knowledgeDomainIds: ["agriculture_food"],
    });

    const connectedAvailability =
      result.worldState.technologyStates.technology_region_connected_b?.discoveries
        .diffusing_discovery?.availability ?? 0;
    const isolatedAvailability =
      result.worldState.technologyStates.technology_region_isolated?.discoveries
        .diffusing_discovery?.availability ?? 0;

    expect(connectedAvailability).toBeGreaterThan(isolatedAvailability);
  });
});
