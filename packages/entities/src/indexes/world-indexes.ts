import { groupIdsBy } from "../core/indexes.js";
import type { WorldState } from "../world-state.js";

/**
 * The runtime indexes named in the roadmap's M3 module list
 * (Technology Stack Decision SS34): O(1)-by-region lookups over
 * `WorldState`. Rebuilt from the canonical entity maps every call --
 * never stored as a second source of truth, so they are always
 * reconstructible by definition (DATA-003).
 */
export interface WorldIndexes {
  readonly companiesByRegion: ReadonlyMap<string, readonly string[]>;
  readonly cohortsByRegion: ReadonlyMap<string, readonly string[]>;
  readonly depositsByRegion: ReadonlyMap<string, readonly string[]>;
  readonly settlementsByRegion: ReadonlyMap<string, readonly string[]>;
  /** A connection is bidirectional: it appears under both of its regions. */
  readonly connectionsByRegion: ReadonlyMap<string, readonly string[]>;
}

export function buildWorldIndexes(state: WorldState): WorldIndexes {
  const companies = Object.values(state.companies);
  const cohorts = Object.values(state.populationCohorts);
  const deposits = Object.values(state.resourceDeposits);
  const settlements = Object.values(state.settlements);
  const connections = Object.values(state.connections);

  const connectionPairs: { regionId: string; connectionId: string }[] = [];
  for (const connection of connections) {
    connectionPairs.push({ regionId: connection.regionAId, connectionId: connection.id });
    connectionPairs.push({ regionId: connection.regionBId, connectionId: connection.id });
  }

  return {
    companiesByRegion: groupIdsBy(
      companies,
      (c) => c.regionId,
      (c) => c.id,
    ),
    cohortsByRegion: groupIdsBy(
      cohorts,
      (c) => c.regionId,
      (c) => c.id,
    ),
    depositsByRegion: groupIdsBy(
      deposits,
      (d) => d.regionId,
      (d) => d.id,
    ),
    settlementsByRegion: groupIdsBy(
      settlements,
      (s) => s.regionId,
      (s) => s.id,
    ),
    connectionsByRegion: groupIdsBy(
      connectionPairs,
      (pair) => pair.regionId,
      (pair) => pair.connectionId,
    ),
  };
}
