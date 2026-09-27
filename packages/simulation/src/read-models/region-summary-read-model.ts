import {
  isDepositKnownToWorld,
  type SettlementStage,
  type WorldState,
} from "@first-cause/entities";

/**
 * RegionSummaryReadModel (Implementation Roadmap M4 UI Foundation;
 * UI/UX World Command Center Spec SS26 "Region Node" minimal data:
 * name, population, settlement stage or largest settlement, economic
 * specialization, status/trend indicator).
 *
 * "Economic specialization" is approximated honestly from what M3/M4
 * structurally know -- which resource types are physically present and
 * which company archetypes operate here -- rather than a fabricated
 * category label; real specialization scoring needs Production (M7+).
 * A status/trend indicator needs the same tick-history mechanism noted
 * in `world-summary-read-model.ts` and is likewise omitted for now.
 */
export interface RegionSummaryReadModel {
  readonly regionId: string;
  readonly name: string;
  readonly population: number;
  readonly largestSettlement:
    | { readonly id: string; readonly name: string; readonly stage: SettlementStage }
    | undefined;
  readonly resourceDefinitionIds: readonly string[];
  /**
   * D3 (TECH-012, macierz ujawniania): liczba złóż SUSPECTED w regionie --
   * „w regionie mogą występować zasoby”. Celowo bez typu zasobu, ilości,
   * jakości, głębokości i ID złoża (minimal disclosure).
   */
  readonly suspectedDepositCount: number;
  readonly companyArchetypeIds: readonly string[];
  readonly connectedRegionIds: readonly string[];
  /** M13's push/pull signal (`Region.cached.migrationAttraction`, `population/migration.ts`), freshly computed each tick -- audytowe P1-08, dotąd nieujawnione żadnym Read Modelem. */
  readonly migrationAttraction: number;
  /** M14's SettlementPressure (`Region.cached.settlementPressure`, `society/settlements.ts`), średnia urbanizationPressure po settlementach regionu -- audytowe P1-08. */
  readonly settlementPressure: number;
}

const SETTLEMENT_STAGE_RANK: Readonly<Record<SettlementStage, number>> = {
  CAMP: 0,
  HAMLET: 1,
  VILLAGE: 2,
  TOWN: 3,
  CITY: 4,
  METROPOLIS: 5,
};

export function buildRegionSummaryReadModel(
  state: WorldState,
  regionId: string,
): RegionSummaryReadModel | undefined {
  const region = state.regions[regionId];
  if (!region) return undefined;

  const settlements = region.settlements.settlementIds
    .map((id) => state.settlements[id])
    .filter((settlement) => settlement !== undefined);
  const largestSettlement = settlements.reduce<(typeof settlements)[number] | undefined>(
    (largest, settlement) =>
      !largest ||
      SETTLEMENT_STAGE_RANK[settlement.stage] > SETTLEMENT_STAGE_RANK[largest.stage]
        ? settlement
        : largest,
    undefined,
  );

  // TECH-010: gracz poznaje typ zasobu dopiero, gdy złoże jest znane światu.
  const resourceDefinitionIds = [
    ...new Set(
      region.resources.depositIds
        .map((id) => state.resourceDeposits[id])
        .filter((deposit) => deposit !== undefined && isDepositKnownToWorld(deposit))
        .map((deposit) => deposit!.resourceDefinitionId),
    ),
  ].sort();

  const suspectedDepositCount = region.resources.depositIds.filter(
    (id) => state.resourceDeposits[id]?.discovery.status === "SUSPECTED",
  ).length;

  const companyArchetypeIds = [
    ...new Set(
      region.economy.companyIds
        .map((id) => state.companies[id]?.archetypeId)
        .filter((id): id is string => id !== undefined),
    ),
  ].sort();

  const connectedRegionIds = [
    ...new Set(
      region.connections.connectionIds
        .map((id) => state.connections[id])
        .filter((connection) => connection !== undefined)
        .map((connection) =>
          connection.regionAId === regionId ? connection.regionBId : connection.regionAId,
        ),
    ),
  ].sort();

  return {
    regionId: region.id,
    name: region.name,
    population: region.population.totalPopulation,
    largestSettlement: largestSettlement
      ? {
          id: largestSettlement.id,
          name: largestSettlement.name,
          stage: largestSettlement.stage,
        }
      : undefined,
    resourceDefinitionIds,
    suspectedDepositCount,
    companyArchetypeIds,
    connectedRegionIds,
    migrationAttraction: region.cached.migrationAttraction,
    settlementPressure: region.cached.settlementPressure,
  };
}
