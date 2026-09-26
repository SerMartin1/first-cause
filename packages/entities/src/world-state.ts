import { InvariantViolationError, assertFiniteDeep } from "./core/validation.js";
import { groupIdsBy, toById } from "./core/indexes.js";
import type { World } from "./world/world.js";
import type { Continent } from "./world/continent.js";
import { recomputeRegionTotalPopulation, type Region } from "./world/regions.js";
import type { Connection } from "./world/connections.js";
import type { ResourceDeposit } from "./economy/resource-deposit.js";
import type { Settlement } from "./society/settlement.js";
import type { PopulationCohort } from "./population/cohort.js";
import type { Company } from "./economy/company.js";
import type { Market } from "./economy/market.js";
import type { Inventory } from "./economy/inventory.js";
import type { TechnologyState } from "./technology/technology-state.js";
import {
  createArchitectInfluenceState,
  type ArchitectInfluenceState,
} from "./architect/influence.js";
import type { ArchitectInterventionInstance } from "./architect/intervention.js";

/**
 * The full M3 World State: every entity, keyed by ID (Technology Stack
 * Decision SS25: "typed data objects, registries, IDs" -- no OOP
 * hierarchy). This is the canonical, save-relevant state; nothing else
 * in `packages/entities` is a second source of truth for it.
 */
export interface WorldState {
  readonly world: World;
  readonly continents: Readonly<Record<string, Continent>>;
  readonly regions: Readonly<Record<string, Region>>;
  readonly connections: Readonly<Record<string, Connection>>;
  readonly resourceDeposits: Readonly<Record<string, ResourceDeposit>>;
  readonly settlements: Readonly<Record<string, Settlement>>;
  readonly populationCohorts: Readonly<Record<string, PopulationCohort>>;
  readonly companies: Readonly<Record<string, Company>>;
  readonly markets: Readonly<Record<string, Market>>;
  readonly inventories: Readonly<Record<string, Inventory>>;
  readonly technologyStates: Readonly<Record<string, TechnologyState>>;
  /** M16: jeden balans na świat (gracz jako Architekt), nie kolekcja per-region (ARCH-003, SS6). */
  readonly architectInfluence: ArchitectInfluenceState;
  readonly interventions: Readonly<Record<string, ArchitectInterventionInstance>>;
}

export interface CreateWorldStateInput {
  readonly world: World;
  readonly continents?: readonly Continent[];
  readonly regions?: readonly Region[];
  readonly connections?: readonly Connection[];
  readonly resourceDeposits?: readonly ResourceDeposit[];
  readonly settlements?: readonly Settlement[];
  readonly populationCohorts?: readonly PopulationCohort[];
  readonly companies?: readonly Company[];
  readonly markets?: readonly Market[];
  readonly inventories?: readonly Inventory[];
  readonly technologyStates?: readonly TechnologyState[];
  /** Domyślnie pełny balans (`createArchitectInfluenceState()`, SS4) -- backward-compatible dla każdego istniejącego fixture'u, który jeszcze o Architekcie nie wie. */
  readonly architectInfluence?: ArchitectInfluenceState;
  readonly interventions?: readonly ArchitectInterventionInstance[];
}

function requireExists<T>(
  byId: Readonly<Record<string, T>>,
  id: string,
  label: string,
): void {
  if (!(id in byId)) {
    throw new InvariantViolationError(`${label} references unknown ID "${id}"`);
  }
}

function requireSame(actual: string, expected: string, label: string): void {
  if (actual !== expected) {
    throw new InvariantViolationError(`${label} must be "${expected}", got "${actual}"`);
  }
}

/**
 * Assembles a `WorldState` from canonical entities, validating every
 * forward reference (rule 9: "no dangling references") and
 * *reconstructing* every back-reference cache (`Region.resources.depositIds`,
 * `World.regionIds`, ...) from those forward references, rather than
 * trusting hand-maintained arrays on the input entities -- the M3
 * Acceptance Gate requirement that "indexes are reconstructible from
 * canonical state" (DATA-003/DATA-004).
 *
 * Forward references (child -> parent, e.g. `Region.continentId`,
 * `ResourceDeposit.regionId`) are the canonical source of truth;
 * back-reference ID lists on the parent are always derived here.
 */
export function createWorldState(input: CreateWorldStateInput): WorldState {
  const continents = input.continents ?? [];
  const regions = input.regions ?? [];
  const connections = input.connections ?? [];
  const resourceDeposits = input.resourceDeposits ?? [];
  const settlements = input.settlements ?? [];
  const populationCohorts = input.populationCohorts ?? [];
  const companies = input.companies ?? [];
  const markets = input.markets ?? [];
  const inventories = input.inventories ?? [];
  const technologyStates = input.technologyStates ?? [];
  const interventions = input.interventions ?? [];

  const continentsById = toById(continents, "Continent");
  const regionsById = toById(regions, "Region");
  const settlementsById = toById(settlements, "Settlement");
  const cohortsById = toById(populationCohorts, "PopulationCohort");
  const inventoriesById = toById(inventories, "Inventory");
  const companiesById = toById(companies, "Company");
  const interventionsById = toById(interventions, "ArchitectInterventionInstance");

  for (const continent of continents) {
    requireSame(continent.worldId, input.world.id, `Continent "${continent.id}".worldId`);
  }
  for (const region of regions) {
    requireSame(region.worldId, input.world.id, `Region "${region.id}".worldId`);
    requireExists(
      continentsById,
      region.continentId,
      `Region "${region.id}".continentId`,
    );
  }
  for (const connection of connections) {
    requireExists(
      regionsById,
      connection.regionAId,
      `Connection "${connection.id}".regionAId`,
    );
    requireExists(
      regionsById,
      connection.regionBId,
      `Connection "${connection.id}".regionBId`,
    );
  }
  for (const deposit of resourceDeposits) {
    requireExists(
      regionsById,
      deposit.regionId,
      `ResourceDeposit "${deposit.id}".regionId`,
    );
  }
  for (const settlement of settlements) {
    requireExists(
      regionsById,
      settlement.regionId,
      `Settlement "${settlement.id}".regionId`,
    );
  }
  for (const cohort of populationCohorts) {
    requireExists(
      regionsById,
      cohort.regionId,
      `PopulationCohort "${cohort.id}".regionId`,
    );
    if (cohort.settlementId !== undefined) {
      requireExists(
        settlementsById,
        cohort.settlementId,
        `PopulationCohort "${cohort.id}".settlementId`,
      );
      // Audytowe P1-05: samo istnienie settlementu nie potwierdza, że
      // leży w TYM SAMYM regionie co kohorta -- bez tego wpis mógłby po
      // cichu wskazywać osadę zupełnie gdzie indziej.
      requireSame(
        settlementsById[cohort.settlementId]!.regionId,
        cohort.regionId,
        `PopulationCohort "${cohort.id}".settlementId's region`,
      );
    }
  }
  for (const company of companies) {
    requireExists(regionsById, company.regionId, `Company "${company.id}".regionId`);
    if (company.settlementId !== undefined) {
      requireExists(
        settlementsById,
        company.settlementId,
        `Company "${company.id}".settlementId`,
      );
      requireSame(
        settlementsById[company.settlementId]!.regionId,
        company.regionId,
        `Company "${company.id}".settlementId's region`,
      );
    }
    requireExists(
      inventoriesById,
      company.inventoryId,
      `Company "${company.id}".inventoryId`,
    );
    // Audytowe P1-05: "właściciele nie są kompleksowo walidowani" --
    // ownerEntityId wcześniej mógł wskazywać nieistniejącą kohortę bez
    // żadnego błędu (np. po jej usunięciu w przyszłym systemie).
    requireExists(
      cohortsById,
      company.ownerEntityId,
      `Company "${company.id}".ownerEntityId`,
    );
  }
  const marketIdByRegion = new Map<string, string>();
  for (const market of markets) {
    requireExists(regionsById, market.regionId, `Market "${market.id}".regionId`);
    // DATA-006 "one Market per region, never per settlement": a second
    // market for the same region would make `Region.economy.marketId`
    // ambiguous, so it is rejected here rather than silently keeping
    // whichever one happened to appear last in the input array.
    if (marketIdByRegion.has(market.regionId)) {
      throw new InvariantViolationError(
        `Region "${market.regionId}" has more than one Market ("${marketIdByRegion.get(market.regionId)}" and "${market.id}") -- DATA-006 allows exactly one`,
      );
    }
    marketIdByRegion.set(market.regionId, market.id);
  }
  const regionInventoryIdByRegion = new Map<string, string>();
  for (const inventory of inventories) {
    requireExists(
      regionsById,
      inventory.locationRegionId,
      `Inventory "${inventory.id}".locationRegionId`,
    );
    // Audytowe P1-05: "właściciele inventory... nie są kompleksowo
    // walidowani" -- `ownerId` wcześniej nie był w ogóle sprawdzany
    // przeciw encji, którą `ownerType` deklaruje.
    const ownerById: Readonly<Record<string, unknown>> =
      inventory.ownerType === "region"
        ? regionsById
        : inventory.ownerType === "company"
          ? companiesById
          : settlementsById;
    requireExists(
      ownerById,
      inventory.ownerId,
      `Inventory "${inventory.id}".ownerId (ownerType "${inventory.ownerType}")`,
    );
    if (inventory.ownerType !== "region") continue;
    // Same one-per-region rule as Market above, for the same reason: a
    // region's own (non-company, non-settlement) Inventory is what M8/M9
    // settlement (Etap 1) sells into and buys from -- a second one would
    // make `Region.economy.regionalInventoryId` ambiguous.
    if (regionInventoryIdByRegion.has(inventory.locationRegionId)) {
      throw new InvariantViolationError(
        `Region "${inventory.locationRegionId}" has more than one region-owned Inventory ("${regionInventoryIdByRegion.get(inventory.locationRegionId)}" and "${inventory.id}")`,
      );
    }
    regionInventoryIdByRegion.set(inventory.locationRegionId, inventory.id);
  }
  // Entity Data Model §6/§28/§67: TechnologyState jest regionalny --
  // `Region.knowledge.technologyStateId` to back-reference wyprowadzany z
  // `TechnologyState.regionId`, tak jak `marketId`/`regionalInventoryId`.
  // Wcześniej nigdy nie był ustawiany, więc system technologii (M15) nie
  // działał dla żadnego świata budowanego przez `createWorldState` (np.
  // fixture JSON). Drugi stan dla tego samego regionu albo sprzeczny,
  // ręcznie podany link są odrzucane -- nie nadpisywane po cichu.
  const technologyStateIdByRegion = new Map<string, string>();
  for (const technologyState of technologyStates) {
    requireExists(
      regionsById,
      technologyState.regionId,
      `TechnologyState "${technologyState.id}".regionId`,
    );
    if (technologyStateIdByRegion.has(technologyState.regionId)) {
      throw new InvariantViolationError(
        `Region "${technologyState.regionId}" has more than one TechnologyState ("${technologyStateIdByRegion.get(technologyState.regionId)}" and "${technologyState.id}") -- TechnologyState is regional (Entity Data Model §28)`,
      );
    }
    technologyStateIdByRegion.set(technologyState.regionId, technologyState.id);
  }
  for (const region of regions) {
    const declared = region.knowledge.technologyStateId;
    if (declared !== undefined && declared !== technologyStateIdByRegion.get(region.id)) {
      throw new InvariantViolationError(
        `Region "${region.id}".knowledge.technologyStateId "${declared}" does not match a TechnologyState whose regionId is "${region.id}"`,
      );
    }
  }

  const regionIdsByContinent = groupIdsBy(
    regions,
    (r) => r.continentId,
    (r) => r.id,
  );
  const cohortsByRegionId = groupIdsBy(
    populationCohorts,
    (c) => c.regionId,
    (c) => c.id,
  );
  const cohortsBySettlementId = groupIdsBy(
    populationCohorts,
    (c) => c.settlementId,
    (c) => c.id,
  );
  const depositsByRegionId = groupIdsBy(
    resourceDeposits,
    (d) => d.regionId,
    (d) => d.id,
  );
  const settlementsByRegionId = groupIdsBy(
    settlements,
    (s) => s.regionId,
    (s) => s.id,
  );
  const companiesByRegionId = groupIdsBy(
    companies,
    (c) => c.regionId,
    (c) => c.id,
  );
  const companiesBySettlementId = groupIdsBy(
    companies,
    (c) => c.settlementId,
    (c) => c.id,
  );
  const connectionsByRegionId = buildConnectionsByRegionIndex(connections);

  const totalPopulationOf = (cohortIds: readonly string[]): number =>
    recomputeRegionTotalPopulation(cohortIds.map((id) => cohortsById[id]!.population));

  const resolvedRegions: Record<string, Region> = {};
  for (const region of regions) {
    const cohortIds = cohortsByRegionId.get(region.id) ?? [];
    resolvedRegions[region.id] = {
      ...region,
      population: { cohortIds, totalPopulation: totalPopulationOf(cohortIds) },
      resources: { depositIds: depositsByRegionId.get(region.id) ?? [] },
      settlements: { settlementIds: settlementsByRegionId.get(region.id) ?? [] },
      economy: {
        ...region.economy,
        companyIds: companiesByRegionId.get(region.id) ?? [],
        marketId: marketIdByRegion.get(region.id),
        regionalInventoryId: regionInventoryIdByRegion.get(region.id),
      },
      connections: { connectionIds: connectionsByRegionId.get(region.id) ?? [] },
      knowledge: {
        ...region.knowledge,
        technologyStateId: technologyStateIdByRegion.get(region.id),
      },
    };
  }

  const resolvedContinents: Record<string, Continent> = {};
  for (const continent of continents) {
    resolvedContinents[continent.id] = {
      ...continent,
      regionIds: regionIdsByContinent.get(continent.id) ?? [],
    };
  }

  const resolvedSettlements: Record<string, Settlement> = {};
  for (const settlement of settlements) {
    const cohortIds = cohortsBySettlementId.get(settlement.id) ?? [];
    resolvedSettlements[settlement.id] = {
      ...settlement,
      population: { cohortIds, totalPopulation: totalPopulationOf(cohortIds) },
      economy: {
        ...settlement.economy,
        companyIds: companiesBySettlementId.get(settlement.id) ?? [],
      },
    };
  }

  const resolvedWorld: World = {
    ...input.world,
    continentIds: Object.keys(continentsById).sort(),
    regionIds: Object.keys(regionsById).sort(),
  };
  const resolvedConnections = toById(connections, "Connection");
  const resolvedResourceDeposits = toById(resourceDeposits, "ResourceDeposit");
  const resolvedMarkets = toById(markets, "Market");
  const resolvedTechnologyStates = toById(technologyStates, "TechnologyState");
  const resolvedArchitectInfluence =
    input.architectInfluence ?? createArchitectInfluenceState();

  // Audytowe P1-05: NaN/Infinity odrzucane dopiero przy (de)serializacji
  // nie chroni tego, co WorldState zaraz przyjmie jako swój bieżący stan
  // -- ta walidacja biegnie PRZED zwróceniem, na finalnych, w pełni
  // przeliczonych obiektach (nie na surowym wejściu), więc łapie też
  // NaN wprowadzone przez samo przeliczenie (np. `totalPopulationOf`).
  assertFiniteDeep(resolvedWorld, "World");
  for (const [id, entity] of Object.entries(resolvedContinents))
    assertFiniteDeep(entity, `Continent "${id}"`);
  for (const [id, entity] of Object.entries(resolvedRegions))
    assertFiniteDeep(entity, `Region "${id}"`);
  for (const [id, entity] of Object.entries(resolvedConnections))
    assertFiniteDeep(entity, `Connection "${id}"`);
  for (const [id, entity] of Object.entries(resolvedResourceDeposits))
    assertFiniteDeep(entity, `ResourceDeposit "${id}"`);
  for (const [id, entity] of Object.entries(resolvedSettlements))
    assertFiniteDeep(entity, `Settlement "${id}"`);
  for (const [id, entity] of Object.entries(cohortsById))
    assertFiniteDeep(entity, `PopulationCohort "${id}"`);
  for (const [id, entity] of Object.entries(companiesById))
    assertFiniteDeep(entity, `Company "${id}"`);
  for (const [id, entity] of Object.entries(resolvedMarkets))
    assertFiniteDeep(entity, `Market "${id}"`);
  for (const [id, entity] of Object.entries(inventoriesById))
    assertFiniteDeep(entity, `Inventory "${id}"`);
  for (const [id, entity] of Object.entries(resolvedTechnologyStates))
    assertFiniteDeep(entity, `TechnologyState "${id}"`);
  assertFiniteDeep(resolvedArchitectInfluence, "ArchitectInfluenceState");
  for (const [id, entity] of Object.entries(interventionsById))
    assertFiniteDeep(entity, `ArchitectInterventionInstance "${id}"`);

  return {
    world: resolvedWorld,
    continents: resolvedContinents,
    regions: resolvedRegions,
    connections: resolvedConnections,
    resourceDeposits: resolvedResourceDeposits,
    settlements: resolvedSettlements,
    populationCohorts: cohortsById,
    companies: companiesById,
    markets: resolvedMarkets,
    inventories: inventoriesById,
    technologyStates: resolvedTechnologyStates,
    architectInfluence: resolvedArchitectInfluence,
    interventions: interventionsById,
  };
}

/** A Connection is bidirectional: it belongs to both region A's and region B's connection list. */
function buildConnectionsByRegionIndex(
  connections: readonly Connection[],
): ReadonlyMap<string, readonly string[]> {
  const pairs: { regionId: string; connectionId: string }[] = [];
  for (const connection of connections) {
    pairs.push({ regionId: connection.regionAId, connectionId: connection.id });
    pairs.push({ regionId: connection.regionBId, connectionId: connection.id });
  }
  return groupIdsBy(
    pairs,
    (pair) => pair.regionId,
    (pair) => pair.connectionId,
  );
}
