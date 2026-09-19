import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  loadContentPack,
  type CompanyArchetypeDefinition,
  type DefinitionRegistry,
  type DiscoveryDefinition,
  type InterventionDefinition,
  type KnowledgeDomainDefinition,
  type LocaleBundle,
  type ProductionMethodDefinition,
  type TransportModeDefinition,
} from "@first-cause/content";
import {
  parseArchitectInterventionRule,
  parseDiscoveryEligibilityRule,
  parseProductionRecipe,
  parseTransportModeProfile,
  type ArchitectInterventionRule,
  type DiscoveryEligibilityRule,
  type EntrepreneurshipCandidate,
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
  /** M12: one candidate per `companyArchetype` (its first `productionMethodIds` entry -- VS scope never lists more than one). */
  readonly entrepreneurshipCandidatesByArchetypeId: Readonly<
    Record<string, EntrepreneurshipCandidate>
  >;
  /** M15: `content/discoveries/*.json`, kluczowane po id -- wejście Discovery Engine. */
  readonly discoveryDefinitionsById: Readonly<Record<string, DiscoveryDefinition>>;
  /** M15: `content/knowledgeDomains/*.json`, kluczowane po id. */
  readonly knowledgeDomainDefinitionsById: Readonly<Record<string, KnowledgeDomainDefinition>>;
  /** M15: sparsowane z `discoveryDefinitionsById` -- gotowe do `RunEconomyTickInput.discoveryEligibilityRulesById`. */
  readonly discoveryEligibilityRulesById: Readonly<Record<string, DiscoveryEligibilityRule>>;
  /** M15: `Object.keys(knowledgeDomainDefinitionsById)` -- gotowe do `RunEconomyTickInput.knowledgeDomainIds`. */
  readonly knowledgeDomainIds: readonly string[];
  /**
   * M15: `productionMethodId` -> id `DiscoveryDefinition`, których wymaga
   * jej własne pole `discoveries` (`ProductionMethodDefinition.discoveries`,
   * już referencyjnie zwalidowane przez M2 -- właściwy kierunek dla
   * gate'owania AI-08, nie `DiscoveryDefinition.unlocks`, które jest
   * polimorficzne i wskazuje w drugą stronę). Pusta tablica = brak
   * gate'owania (wstecznie zgodne).
   */
  readonly requiredDiscoveryIdsByMethodId: Readonly<Record<string, readonly string[]>>;
  /**
   * UI-F1 (`RegionVisualProfile`): `companyArchetype.id -> sector`,
   * pochodzi z contentu. `packages/simulation` nigdy nie czyta contentu
   * samodzielnie (AGENTS.md reguła 6) -- podawane do opcji
   * `sectorByCompanyArchetypeId` w `buildRegionVisualProfileReadModel`,
   * ten sam wzorzec co `discoveryEligibilityRulesById` już ustanowił dla
   * M15.
   */
  readonly sectorByCompanyArchetypeId: Readonly<Record<string, string>>;
  /** M16: `content/interventions/*.json`, sparsowane na `ArchitectInterventionRule` -- gotowe dla `applyArchitectIntervention`. */
  readonly architectInterventionRulesById: Readonly<Record<string, ArchitectInterventionRule>>;
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
      discovery: readJsonDir(path.join(contentDir, "discoveries")),
      knowledgeDomain: readJsonDir(path.join(contentDir, "knowledgeDomains")),
      intervention: readJsonDir(path.join(contentDir, "interventions")),
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
      entrepreneurshipCandidatesByArchetypeId: {},
      discoveryDefinitionsById: {},
      knowledgeDomainDefinitionsById: {},
      discoveryEligibilityRulesById: {},
      knowledgeDomainIds: [],
      requiredDiscoveryIdsByMethodId: {},
      sectorByCompanyArchetypeId: {},
      architectInterventionRulesById: {},
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
  const companyArchetypeRegistry = result.registries.companyArchetype as
    DefinitionRegistry<CompanyArchetypeDefinition> | undefined;
  const discoveryRegistry = result.registries.discovery as
    DefinitionRegistry<DiscoveryDefinition> | undefined;
  const knowledgeDomainRegistry = result.registries.knowledgeDomain as
    DefinitionRegistry<KnowledgeDomainDefinition> | undefined;
  const interventionRegistry = result.registries.intervention as
    DefinitionRegistry<InterventionDefinition> | undefined;

  const productionRecipesByMethodId: Record<string, ProductionRecipe> = {};
  const requiredDiscoveryIdsByMethodId: Record<string, readonly string[]> = {};
  for (const definition of productionMethodRegistry?.all() ?? []) {
    productionRecipesByMethodId[definition.id] = parseProductionRecipe(
      definition.id,
      definition.productivity,
      definition.companyArchetypeIds,
    );
    requiredDiscoveryIdsByMethodId[definition.id] = definition.discoveries;
  }

  const transportModeProfilesByModeId: Record<string, TransportModeProfile> = {};
  for (const definition of transportModeRegistry?.all() ?? []) {
    transportModeProfilesByModeId[definition.id] = parseTransportModeProfile(
      definition.id,
      definition.cost,
    );
  }

  const entrepreneurshipCandidatesByArchetypeId: Record<
    string,
    EntrepreneurshipCandidate
  > = {};
  const sectorByCompanyArchetypeId: Record<string, string> = {};
  for (const definition of companyArchetypeRegistry?.all() ?? []) {
    sectorByCompanyArchetypeId[definition.id] = definition.sector;
    const productionMethodId = definition.productionMethodIds[0];
    if (!productionMethodId) continue; // an archetype with no production method yet can't be founded
    entrepreneurshipCandidatesByArchetypeId[definition.id] = {
      archetypeId: definition.id,
      productionMethodId,
      capitalRequirement: definition.capitalRequirement,
    };
  }

  const discoveryDefinitionsById: Record<string, DiscoveryDefinition> = {};
  const discoveryEligibilityRulesById: Record<string, DiscoveryEligibilityRule> = {};
  for (const definition of discoveryRegistry?.all() ?? []) {
    discoveryDefinitionsById[definition.id] = definition;
    discoveryEligibilityRulesById[definition.id] = parseDiscoveryEligibilityRule(
      definition.primaryDomainId,
      definition.tier,
      definition.prerequisites,
    );
  }

  const knowledgeDomainDefinitionsById: Record<string, KnowledgeDomainDefinition> = {};
  for (const definition of knowledgeDomainRegistry?.all() ?? []) {
    knowledgeDomainDefinitionsById[definition.id] = definition;
  }

  const architectInterventionRulesById: Record<string, ArchitectInterventionRule> = {};
  for (const definition of interventionRegistry?.all() ?? []) {
    architectInterventionRulesById[definition.id] = parseArchitectInterventionRule(
      definition.id,
      definition.category,
      definition.allowedScopes,
      definition.parameters,
      definition.costs,
      definition.cooldown,
      definition.rootFactType,
    );
  }

  return {
    ok: true,
    errors: [],
    productionRecipesByMethodId,
    transportModeProfilesByModeId,
    entrepreneurshipCandidatesByArchetypeId,
    discoveryDefinitionsById,
    knowledgeDomainDefinitionsById,
    discoveryEligibilityRulesById,
    knowledgeDomainIds: Object.keys(knowledgeDomainDefinitionsById).sort(),
    requiredDiscoveryIdsByMethodId,
    sectorByCompanyArchetypeId,
    architectInterventionRulesById,
  };
}
