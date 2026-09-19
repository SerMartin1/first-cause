import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRODUCTION_RECIPES,
  DEFAULT_TRANSPORT_MODE_PROFILES,
  createWorldRng,
  runEconomyTick,
} from "@first-cause/simulation";
import { readFileSync } from "node:fs";
import { loadWorldFixture } from "../fixtures/load-world-fixture.js";
import { loadEconomyContent } from "./load-economy-content.js";

const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);

function readBlackMountainFixture(): unknown {
  const filePath = path.join(
    REPO_ROOT,
    "tests/worldgen/fixtures/black_mountain_reference.json",
  );
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

/**
 * Audytowe P0-06: dowodzi, że `content/productionMethods|transportModes/
 * *.json` na dysku -- przepuszczone przez pełny M2 pipeline
 * (`loadContentPack`) i M7/M10-owe parsery (`parseProductionRecipe`/
 * `parseTransportModeProfile`) -- naprawdę zasila `runEconomyTick`, nie
 * jest martwym plikiem obok silnika. Wartości w contencie są celowo
 * numerycznie identyczne z `DEFAULT_PRODUCTION_RECIPES`/
 * `DEFAULT_TRANSPORT_MODE_PROFILES` (Etap 1/2 baseline), więc ten test
 * może porównać obie ścieżki 1:1 zamiast zgadywać nowe oczekiwane liczby.
 */
describe("loadEconomyContent (audit regression P0-06, content-driven production recipes / transport costs)", () => {
  it("loads content/productionMethods and content/transportModes into validated recipe/profile maps", () => {
    const result = loadEconomyContent(REPO_ROOT);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.productionRecipesByMethodId.manual_farming).toEqual(
      DEFAULT_PRODUCTION_RECIPES.manual_farming,
    );
    expect(result.productionRecipesByMethodId.manual_food_processing).toEqual(
      DEFAULT_PRODUCTION_RECIPES.manual_food_processing,
    );
    expect(result.transportModeProfilesByModeId.cart).toEqual(
      DEFAULT_TRANSPORT_MODE_PROFILES.cart,
    );
    expect(result.transportModeProfilesByModeId.river).toEqual(
      DEFAULT_TRANSPORT_MODE_PROFILES.river,
    );
    expect(result.transportModeProfilesByModeId.foot_porter).toEqual(
      DEFAULT_TRANSPORT_MODE_PROFILES.foot_porter,
    );
    expect(result.transportModeProfilesByModeId.pack_animal).toEqual(
      DEFAULT_TRANSPORT_MODE_PROFILES.pack_animal,
    );
  });

  it("M12: builds one entrepreneurship candidate per content companyArchetype, pointing at its production recipe", () => {
    const result = loadEconomyContent(REPO_ROOT);

    expect(result.entrepreneurshipCandidatesByArchetypeId.grain_farm).toEqual({
      archetypeId: "grain_farm",
      productionMethodId: "manual_farming",
      capitalRequirement: 0,
    });
    expect(result.entrepreneurshipCandidatesByArchetypeId.bakery).toEqual({
      archetypeId: "bakery",
      productionMethodId: "manual_food_processing",
      capitalRequirement: 0,
    });
  });

  it("UI-F1: maps every content companyArchetype to its declared sector", () => {
    const result = loadEconomyContent(REPO_ROOT);

    expect(result.sectorByCompanyArchetypeId.grain_farm).toBe("agriculture");
    expect(result.sectorByCompanyArchetypeId.bakery).toBe("food_processing");
  });

  it("M15: loads content/discoveries and content/knowledgeDomains into validated maps, and production methods' `discoveries` into a gating map", () => {
    const result = loadEconomyContent(REPO_ROOT);

    expect(Object.keys(result.discoveryDefinitionsById)).toHaveLength(125);
    expect(result.discoveryDefinitionsById.agr_001?.id).toBe("agr_001");
    expect(Object.keys(result.knowledgeDomainDefinitionsById)).toHaveLength(5);
    expect(result.knowledgeDomainDefinitionsById.agriculture_food?.id).toBe(
      "agriculture_food",
    );
    // Dzisiejsze 2 realne production methods nie deklarują jeszcze
    // `discoveries` (M15's "poza zakresem": nowy content PM za `unlocks`
    // to osobny krok) -- mapa istnieje i jest kluczowana, ale każda
    // wartość jest pusta.
    expect(result.requiredDiscoveryIdsByMethodId.manual_farming).toEqual([]);
    expect(result.requiredDiscoveryIdsByMethodId.manual_food_processing).toEqual([]);
    expect(Object.keys(result.discoveryEligibilityRulesById)).toHaveLength(125);
    expect(result.discoveryEligibilityRulesById.agr_001).toEqual({
      primaryDomainId: "agriculture_food",
      tier: result.discoveryDefinitionsById.agr_001?.tier,
      prerequisites: result.discoveryDefinitionsById.agr_001?.prerequisites,
    });
    expect(result.knowledgeDomainIds).toEqual([
      "agriculture_food",
      "construction_mechanics",
      "mining_metallurgy",
      "science_society",
      "transport_communication",
    ]);
  });

  it("drives an identical 12-tick economy run to the hardcoded DEFAULT_* maps (real content is a genuine drop-in, not a parallel unused path)", () => {
    const content = loadEconomyContent(REPO_ROOT);
    expect(content.ok).toBe(true);

    function runTicks(
      productionRecipesByMethodId: typeof content.productionRecipesByMethodId,
      transportModeProfilesByModeId: typeof content.transportModeProfilesByModeId,
    ) {
      const loaded = loadWorldFixture(readBlackMountainFixture());
      let worldState = loaded.worldState!;
      const rng = createWorldRng(worldState.world.seed);
      for (let tick = 0; tick < 12; tick++) {
        const result = runEconomyTick({
          worldState,
          tick,
          demographyRng: (scopeId) => rng.stream("demography", scopeId),
          migrationRng: (scopeId) => rng.stream("migration", scopeId),
          productionRecipesByMethodId,
          transportModeProfilesByModeId,
        });
        worldState = result.worldState;
      }
      return worldState;
    }

    const viaDefaults = runTicks(
      DEFAULT_PRODUCTION_RECIPES,
      DEFAULT_TRANSPORT_MODE_PROFILES,
    );
    const viaContent = runTicks(
      content.productionRecipesByMethodId,
      content.transportModeProfilesByModeId,
    );

    expect(viaContent).toEqual(viaDefaults);
  });
});
