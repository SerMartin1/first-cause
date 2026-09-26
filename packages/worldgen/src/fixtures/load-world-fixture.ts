import {
  createCompany,
  createConnection,
  createContinent,
  createInventory,
  createMarket,
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createResourceDeposit,
  createSettlement,
  createTechnologyState,
  createWorld,
  createWorldState,
  type MarketGoodState,
  type WorldState,
} from "@first-cause/entities";
import { parseWorldFixtureDocument } from "./fixture-schema.js";
import {
  validateInitialResourceKnowledge,
  type RecipeResourceInputs,
} from "./initial-resource-knowledge.js";

/**
 * Seeds one good's `MarketGoodState` from a fixture's `basePrice` -- the
 * same shape `markets/price-adjustment.initializeMarketGood` (Simulation
 * Core) builds, duplicated here rather than imported: `@first-cause/worldgen`
 * depends only on `@first-cause/entities` (Technology Stack layering --
 * Simulation Core builds *on* a loaded WorldState, not the other way
 * around), so this loader cannot reach into Simulation Core for it.
 */
function seedMarketGood(basePrice: number): MarketGoodState {
  return {
    supply: 0,
    demand: 0,
    inventory: 0,
    localPrice: basePrice,
    importDemand: 0,
    exportSupply: 0,
    shortageSeverity: 0,
    pricePressure: 0,
  };
}

export interface LoadWorldFixtureResult {
  readonly ok: boolean;
  readonly worldState?: WorldState;
  readonly errors: readonly string[];
}

/**
 * `JSON -> Zod -> entity factories -> createWorldState` for a
 * hand-written fixture (Implementation Roadmap M4, IMPL-005). Generic:
 * takes already-`JSON.parse`d data and knows nothing about any specific
 * scenario -- World Generation Spec SS16/SS36 requires the engine
 * (including this loader) to be unaware of any one reference fixture's
 * identity. Never throws.
 */
export interface LoadWorldFixtureOptions {
  /**
   * D1: receptury z contentu (`LoadEconomyContentResult.
   * productionRecipesByMethodId`). Gdy podane, stan początkowy jest
   * walidowany wg World Generation Spec §22 (`validateInitialResourceKnowledge`)
   * i niespójny fixture jest odrzucany. Loader sam nie czyta contentu.
   */
  readonly productionRecipesByMethodId?: Readonly<Record<string, RecipeResourceInputs>>;
}

export function loadWorldFixture(
  raw: unknown,
  options: LoadWorldFixtureOptions = {},
): LoadWorldFixtureResult {
  const parsed = parseWorldFixtureDocument(raw);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }
  const doc = parsed.document;

  try {
    const world = createWorld({
      id: doc.world.id,
      seed: doc.world.seed,
      name: doc.world.name,
      configuration: doc.world.configuration,
      ...(doc.world.startDate ? { startDate: doc.world.startDate } : {}),
    });

    const continents = doc.continents.map((c) =>
      createContinent({
        id: c.id,
        worldId: world.id,
        name: c.name,
        ...(c.tags ? { tags: c.tags } : {}),
      }),
    );

    const regions = doc.regions.map((r) =>
      createRegion({
        id: r.id,
        worldId: world.id,
        continentId: r.continentId,
        name: r.name,
        geography: createRegionGeography(r.geography),
      }),
    );

    const connections = doc.connections.map((c) =>
      createConnection({
        id: c.id,
        regionAId: c.regionAId,
        regionBId: c.regionBId,
        geography: c.geography,
        ...(c.infrastructure !== undefined ? { infrastructure: c.infrastructure } : {}),
        ...(c.friction !== undefined ? { friction: c.friction } : {}),
      }),
    );

    const resourceDeposits = doc.resourceDeposits.map((d) => {
      const deposit = createResourceDeposit({
        id: d.id,
        resourceDefinitionId: d.resourceDefinitionId,
        regionId: d.regionId,
        initialQuantity: d.initialQuantity,
        renewable: d.renewable,
        ...(d.quality !== undefined ? { quality: d.quality } : {}),
        ...(d.depth !== undefined ? { depth: d.depth } : {}),
        ...(d.accessibility !== undefined ? { accessibility: d.accessibility } : {}),
        ...(d.renewableState ? { renewableState: d.renewableState } : {}),
      });
      // Wiedza świata na starcie: odkryta „przed pierwszym tickiem”, bez
      // przypisanego odkrywcy i bez faktu `resource_discovered` (to nie jest
      // zdarzenie historyczne symulacji, tylko warunek początkowy).
      return d.discovery === undefined || d.discovery.status === "UNKNOWN"
        ? deposit
        : {
            ...deposit,
            discovery: {
              status: d.discovery.status,
              discoveredTick:
                d.discovery.status === "SUSPECTED" ? undefined : world.currentTick,
              discoveredByEntityId: undefined,
              confidence: d.discovery.confidence,
            },
          };
    });

    const settlements = doc.settlements.map((s) =>
      createSettlement({
        id: s.id,
        regionId: s.regionId,
        name: s.name,
        foundedTick: s.foundedTick,
        ...(s.stage ? { stage: s.stage } : {}),
      }),
    );

    const populationCohorts = doc.populationCohorts.map((c) =>
      createPopulationCohort({
        id: c.id,
        regionId: c.regionId,
        ageGroup: c.ageGroup,
        population: c.population,
        economicClass: c.economicClass,
        skillLevel: c.skillLevel,
        ...(c.settlementId !== undefined ? { settlementId: c.settlementId } : {}),
      }),
    );

    const inventories = doc.inventories.map((i) =>
      createInventory({
        id: i.id,
        ownerType: i.ownerType,
        ownerId: i.ownerId,
        locationRegionId: i.locationRegionId,
        ...(i.capacity ? { capacity: i.capacity } : {}),
      }),
    );

    const companies = doc.companies.map((c) => {
      const company = createCompany({
        id: c.id,
        archetypeId: c.archetypeId,
        name: c.name,
        foundedTick: c.foundedTick,
        regionId: c.regionId,
        ownerType: c.ownerType,
        ownerEntityId: c.ownerEntityId,
        inventoryId: c.inventoryId,
        ...(c.settlementId !== undefined ? { settlementId: c.settlementId } : {}),
        ...(c.initialCash !== undefined ? { initialCash: c.initialCash } : {}),
        ...(c.initialWageOffer !== undefined
          ? { initialWageOffer: c.initialWageOffer }
          : {}),
      });
      return c.production === undefined
        ? company
        : { ...company, production: { ...company.production, ...c.production } };
    });

    const markets = doc.markets.map((m) => {
      const market = createMarket({ id: m.id, regionId: m.regionId });
      if (m.goods === undefined) return market;
      const goods = Object.fromEntries(
        Object.entries(m.goods).map(([goodId, basePrice]) => [
          goodId,
          seedMarketGood(basePrice),
        ]),
      );
      return { ...market, goods };
    });

    const technologyStates = doc.technologyStates.map((t) =>
      createTechnologyState({ id: t.id, regionId: t.regionId }),
    );

    const worldState = createWorldState({
      world,
      continents,
      regions,
      connections,
      resourceDeposits,
      settlements,
      populationCohorts,
      companies,
      markets,
      inventories,
      technologyStates,
    });

    // Decyzja właściciela 2026-09-26: każdy region ma dokładnie jeden
    // TechnologyState (duplikat odrzuca już `createWorldState`). Brak stanu to
    // niespójny świat -- odrzucany, nigdy nie dotwarzany po cichu.
    const regionsWithoutTechnology = Object.values(worldState.regions)
      .filter((region) => region.knowledge.technologyStateId === undefined)
      .map((region) => region.id)
      .sort();
    if (regionsWithoutTechnology.length > 0)
      return {
        ok: false,
        errors: regionsWithoutTechnology.map(
          (regionId) =>
            `Region "${regionId}" has no TechnologyState -- every region must have exactly one (owner decision 2026-09-26)`,
        ),
      };

    const knowledgeErrors = options.productionRecipesByMethodId
      ? validateInitialResourceKnowledge(worldState, options.productionRecipesByMethodId)
      : [];
    if (knowledgeErrors.length > 0) return { ok: false, errors: knowledgeErrors };

    return { ok: true, worldState, errors: [] };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
