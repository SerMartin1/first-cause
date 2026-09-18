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
