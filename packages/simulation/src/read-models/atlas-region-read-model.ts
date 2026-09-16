import type { SettlementStage, WorldState } from "@first-cause/entities";

/**
 * AtlasRegionReadModel (Implementation Roadmap M4 UI Foundation;
 * UI/UX World Command Center Spec SS26-29 Living Atlas "Region Node" +
 * "Connections"). One entry per region, cheap enough to build for every
 * region at once (unlike `RegionSummaryReadModel`, which is for one
 * selected region's detail panel).
 *
 * `connections[].capacity` lets the Atlas encode edge thickness by
 * capacity (SS29); it is `0` until infrastructure exists (M5+/M9), which
 * renders as a thin/undeveloped route rather than a fabricated value.
 */
export interface AtlasRegionConnection {
  readonly connectionId: string;
  readonly toRegionId: string;
  readonly capacity: number;
  readonly disrupted: boolean;
}

export interface AtlasRegionReadModel {
  readonly regionId: string;
  readonly name: string;
  readonly population: number;
  readonly largestSettlementStage: SettlementStage | undefined;
  readonly connections: readonly AtlasRegionConnection[];
}

const SETTLEMENT_STAGE_RANK: Readonly<Record<SettlementStage, number>> = {
  CAMP: 0,
  HAMLET: 1,
  VILLAGE: 2,
  TOWN: 3,
  CITY: 4,
  METROPOLIS: 5,
};

function buildOneAtlasRegion(state: WorldState, regionId: string): AtlasRegionReadModel {
  const region = state.regions[regionId]!;

  const settlements = region.settlements.settlementIds
    .map((id) => state.settlements[id])
    .filter((settlement) => settlement !== undefined);
  const largestSettlementStage = settlements.reduce<SettlementStage | undefined>(
    (largest, settlement) =>
      !largest || SETTLEMENT_STAGE_RANK[settlement.stage] > SETTLEMENT_STAGE_RANK[largest]
        ? settlement.stage
        : largest,
    undefined,
  );

  const connections: AtlasRegionConnection[] = region.connections.connectionIds
    .map((id) => state.connections[id])
    .filter((connection) => connection !== undefined)
    .map((connection) => ({
      connectionId: connection.id,
      toRegionId:
        connection.regionAId === regionId ? connection.regionBId : connection.regionAId,
      capacity: connection.infrastructure.capacity,
      disrupted: connection.currentState.disrupted,
    }));

  return {
    regionId: region.id,
    name: region.name,
    population: region.population.totalPopulation,
    largestSettlementStage,
    connections,
  };
}

/** All regions, in stable (sorted-by-ID) order (SIM-005). */
export function buildAtlasRegionReadModels(
  state: WorldState,
): readonly AtlasRegionReadModel[] {
  return Object.keys(state.regions)
    .sort()
    .map((regionId) => buildOneAtlasRegion(state, regionId));
}
