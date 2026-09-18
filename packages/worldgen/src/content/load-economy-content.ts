import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  loadContentPack,
  type DefinitionRegistry,
  type LocaleBundle,
  type ProductionMethodDefinition,
  type TransportModeDefinition,
} from "@first-cause/content";
import {
  parseProductionRecipe,
  parseTransportModeProfile,
  type ProductionRecipe,
  type TransportModeProfile,
} from "@first-cause/simulation";

/**
 * Audytowe P0-06 ("receptury produkcji i koszty transportu hardcoded w TS
 * zamiast sterowane walidowanym JSON/Definition Registry"): most między
 * realnym contentem na dysku (`content/productionMethods/*.json`,
 * `content/transportModes/*.json`) a `RunEconomyTickInput.
 * productionRecipesByMethodId`/`transportModeProfilesByModeId`
 * (`@first-cause/simulation`). Żyje w `worldgen`, nie w `simulation` --
 * ten sam podział co `run-economy-demo.ts` już ustanowił: Simulation Core
 * nie czyta z dysku i nie zależy od `@first-cause/content`, `worldgen` zna
 * OBA (jak wczytać content i jak go podać silnikowi).
 *
 * Przechodzi przez ten sam pełny M2 pipeline (`loadContentPack`) co
 * `content-fixtures.integration.test.ts` -- referencje, kolizje ID i
 * pokrycie lokalizacji są tu walidowane tak samo, zanim `productivity`/
 * `cost` w ogóle trafi do M7/M10-owych parserów.
 */
export interface LoadEconomyContentResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly productionRecipesByMethodId: Readonly<Record<string, ProductionRecipe>>;
  readonly transportModeProfilesByModeId: Readonly<Record<string, TransportModeProfile>>;
}

function readJsonDir(dir: string): unknown[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), "utf-8")) as unknown);
}

function readJsonLocale(filePath: string): LocaleBundle {
  return JSON.parse(readFileSync(filePath, "utf-8")) as LocaleBundle;
}

/**
 * `repoRoot` musi zawierać `content/{resources,goods,companyArchetypes,
 * productionMethods,transportModes}/*.json` i `locales/{en,pl}/common.json`
 * -- dokładnie ten sam układ co realne repo (patrz `content-fixtures.
 * integration.test.ts`), przekazany jawnie zamiast domyślnie odgadywany z
 * `import.meta.url`, żeby ten moduł nie zakładał własnego położenia na dysku
 * po zbudowaniu do `dist/`.
 */
export function loadEconomyContent(repoRoot: string): LoadEconomyContentResult {
  const contentDir = path.join(repoRoot, "content");
  const localesDir = path.join(repoRoot, "locales");

  const result = loadContentPack({
    definitions: {
      resource: readJsonDir(path.join(contentDir, "resources")),
      good: readJsonDir(path.join(contentDir, "goods")),
      companyArchetype: readJsonDir(path.join(contentDir, "companyArchetypes")),
      productionMethod: readJsonDir(path.join(contentDir, "productionMethods")),
      transportMode: readJsonDir(path.join(contentDir, "transportModes")),
    },
    locales: {
      en: readJsonLocale(path.join(localesDir, "en", "common.json")),
      pl: readJsonLocale(path.join(localesDir, "pl", "common.json")),
    },
  });

  if (!result.ok) {
    return {
      ok: false,
      errors: result.errors,
      productionRecipesByMethodId: {},
      transportModeProfilesByModeId: {},
    };
  }

  // `ContentPackResult.registries` is type-erased to `{ id: string }`
  // (content-pack.ts's own `AnyDefinition`) -- each registry is cast back
  // to the concrete definition type CONTENT_TYPE_SPECS already validated
  // it against via that type's own Zod schema.
  const productionMethodRegistry = result.registries.productionMethod as
    DefinitionRegistry<ProductionMethodDefinition> | undefined;
  const transportModeRegistry = result.registries.transportMode as
    DefinitionRegistry<TransportModeDefinition> | undefined;

  const productionRecipesByMethodId: Record<string, ProductionRecipe> = {};
  for (const definition of productionMethodRegistry?.all() ?? []) {
    productionRecipesByMethodId[definition.id] = parseProductionRecipe(
      definition.id,
      definition.productivity,
      definition.companyArchetypeIds,
    );
  }

  const transportModeProfilesByModeId: Record<string, TransportModeProfile> = {};
  for (const definition of transportModeRegistry?.all() ?? []) {
    transportModeProfilesByModeId[definition.id] = parseTransportModeProfile(
      definition.id,
      definition.cost,
    );
  }

  return {
    ok: true,
    errors: [],
    productionRecipesByMethodId,
    transportModeProfilesByModeId,
  };
}
