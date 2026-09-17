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
  type WorldState,
} from "@first-cause/entities";
import { parseWorldFixtureDocument } from "./fixture-schema.js";

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
export function loadWorldFixture(raw: unknown): LoadWorldFixtureResult {
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

    const resourceDeposits = doc.resourceDeposits.map((d) =>
      createResourceDeposit({
        id: d.id,
        resourceDefinitionId: d.resourceDefinitionId,
        regionId: d.regionId,
        initialQuantity: d.initialQuantity,
        renewable: d.renewable,
        ...(d.quality !== undefined ? { quality: d.quality } : {}),
        ...(d.depth !== undefined ? { depth: d.depth } : {}),
        ...(d.accessibility !== undefined ? { accessibility: d.accessibility } : {}),
        ...(d.renewableState ? { renewableState: d.renewableState } : {}),
      }),
    );

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

    const companies = doc.companies.map((c) =>
      createCompany({
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
      }),
    );

    const markets = doc.markets.map((m) =>
      createMarket({ id: m.id, regionId: m.regionId }),
    );

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

    return { ok: true, worldState, errors: [] };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
