import type { SettlementStage, WorldState } from "@first-cause/entities";

/**
 * WorldSummaryReadModel (Implementation Roadmap M4 UI Foundation;
 * UI/UX World Command Center Spec SS18 "World Status" left panel --
 * "5-8 kluczowych agregatów", not a wall of raw World State).
 *
 * DATA-007: the UI never reads `WorldState` directly -- it reads this.
 * Trend fields (e.g. "Population 214 -> +3.2% / 10y", SS19) are
 * intentionally absent: they need a tick-history snapshot mechanism
 * that does not exist yet (M6+); a fabricated trend would violate
 * "no invention" (AGENTS.md). Employment/Needs Satisfaction/Active
 * Trade Flows/Knowledge Progress/Active Shortages from the spec's
 * example list are likewise absent until the systems that produce them
 * exist (M8/M9/M10/M15).
 */
export interface WorldSummaryReadModel {
  readonly worldId: string;
  readonly worldName: string;
  readonly currentTick: number;
  readonly currentDate: { readonly year: number; readonly month: number };
  readonly regionCount: number;
  readonly totalPopulation: number;
  readonly settlementCount: number;
  readonly settlementCountByStage: Readonly<Record<SettlementStage, number>>;
  readonly activeCompanyCount: number;
}

export function buildWorldSummaryReadModel(state: WorldState): WorldSummaryReadModel {
  const regions = Object.values(state.regions);
  const settlements = Object.values(state.settlements);
  const companies = Object.values(state.companies);

  const settlementCountByStage: Record<SettlementStage, number> = {
    CAMP: 0,
    HAMLET: 0,
    VILLAGE: 0,
    TOWN: 0,
    CITY: 0,
    METROPOLIS: 0,
  };
  for (const settlement of settlements) {
    settlementCountByStage[settlement.stage] += 1;
  }

  return {
    worldId: state.world.id,
    worldName: state.world.name,
    currentTick: state.world.currentTick,
    currentDate: state.world.currentDate,
    regionCount: regions.length,
    totalPopulation: regions.reduce(
      (sum, region) => sum + region.population.totalPopulation,
      0,
    ),
    settlementCount: settlements.length,
    settlementCountByStage,
    activeCompanyCount: companies.filter((company) => company.status.active).length,
  };
}
