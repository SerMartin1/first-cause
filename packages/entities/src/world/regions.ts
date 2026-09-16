import { assertNonEmpty, assertNonNegative } from "../core/validation.js";
import { type RegionGeography } from "./geography.js";
import { createDefaultRegionEnvironment, type RegionEnvironment } from "./environment.js";

/**
 * Region (Entity Data Model SS6): "the main computational unit of the
 * world" (PERF-004/SS5). A pure data holder in M3 -- economic,
 * demographic and AI logic are out of scope until M5+.
 *
 * Only references entity types that exist as of M3 (Population,
 * ResourceDeposit, Settlement, Company, Market, Inventory,
 * TechnologyState, Connection). `society`/`politics` (Culture/Nation/
 * State) and `services`/`infrastructure` (ServiceCapacity/
 * Infrastructure) sub-objects from the full spec are intentionally
 * omitted -- those entity types are not part of M3's scope, and a
 * field referencing a type that cannot exist yet would be exactly the
 * "dangling reference" rule 9 forbids.
 */
export interface RegionPopulationState {
  readonly cohortIds: readonly string[];
  /**
   * Cache (Canonical Decisions DATA-004): canonical population lives on
   * `PopulationCohort`. Recompute with `recomputeRegionTotalPopulation`,
   * never treat this as a second source of truth.
   */
  readonly totalPopulation: number;
}

export interface RegionEconomyState {
  readonly companyIds: readonly string[];
  readonly marketId: string | undefined;
  readonly regionalInventoryId: string | undefined;
  readonly employment: number;
  readonly wages: number;
  readonly output: number;
  readonly income: number;
  readonly wealth: number;
}

export interface RegionCachedState {
  readonly migrationAttraction: number;
  readonly settlementPressure: number;
  readonly urbanizationPressure: number;
  readonly marketAccess: number;
}

export interface Region {
  readonly id: string;
  readonly worldId: string;
  readonly continentId: string;
  readonly name: string;

  readonly geography: RegionGeography;
  readonly environment: RegionEnvironment;

  readonly population: RegionPopulationState;
  readonly resources: { readonly depositIds: readonly string[] };
  readonly settlements: { readonly settlementIds: readonly string[] };
  readonly economy: RegionEconomyState;
  readonly knowledge: { readonly technologyStateId: string | undefined };
  readonly connections: { readonly connectionIds: readonly string[] };
  readonly cached: RegionCachedState;
}

export interface CreateRegionInput {
  readonly id: string;
  readonly worldId: string;
  readonly continentId: string;
  readonly name: string;
  readonly geography: RegionGeography;
  readonly environment?: RegionEnvironment;
}

export function createRegion(input: CreateRegionInput): Region {
  assertNonEmpty(input.id, "Region.id");
  assertNonEmpty(input.worldId, "Region.worldId");
  assertNonEmpty(input.continentId, "Region.continentId");
  assertNonEmpty(input.name, "Region.name");

  return {
    id: input.id,
    worldId: input.worldId,
    continentId: input.continentId,
    name: input.name,
    geography: input.geography,
    environment: input.environment ?? createDefaultRegionEnvironment(),
    population: { cohortIds: [], totalPopulation: 0 },
    resources: { depositIds: [] },
    settlements: { settlementIds: [] },
    economy: {
      companyIds: [],
      marketId: undefined,
      regionalInventoryId: undefined,
      employment: 0,
      wages: 0,
      output: 0,
      income: 0,
      wealth: 0,
    },
    knowledge: { technologyStateId: undefined },
    connections: { connectionIds: [] },
    cached: {
      migrationAttraction: 0,
      settlementPressure: 0,
      urbanizationPressure: 0,
      marketAccess: 0,
    },
  };
}

/**
 * Recomputes the `population.totalPopulation` cache from the canonical
 * source (`PopulationCohort.demographics.population`) -- proves DATA-004
 * ("Region.totalPopulation may be cache/aggregate; canonical population
 * belongs to PopulationCohort") is honored, not just asserted.
 */
export function recomputeRegionTotalPopulation(
  cohortPopulations: readonly number[],
): number {
  return cohortPopulations.reduce((sum, population) => {
    assertNonNegative(population, "cohort population");
    return sum + population;
  }, 0);
}
