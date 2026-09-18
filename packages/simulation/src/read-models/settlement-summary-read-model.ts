import type { SettlementStage, WorldState } from "@first-cause/entities";

/**
 * SettlementSummaryReadModel (audytowe P1-08, M12-M14 audyt): M14's
 * `society/housing.ts`/`society/settlements.ts` liczą `housing.capacity/
 * cost/pressure` i `condition.urbanizationPressure/declinePressure`
 * każdy tick, ale dotąd nic w `read-models/` ich nie ujawniało --
 * roadmapa §6A wymaga typed query/Read Model dla danych user-facing,
 * ten sam wzorzec co `company-summary-read-model.ts`/
 * `market-summary-read-model.ts` (jedna encja po id, `undefined` gdy
 * nieznana).
 */
export interface SettlementSummaryReadModel {
  readonly settlementId: string;
  readonly regionId: string;
  readonly name: string;
  readonly stage: SettlementStage;
  readonly population: number;
  readonly housing: {
    readonly capacity: number;
    readonly cost: number;
    readonly pressure: number;
  };
  readonly urbanizationPressure: number;
  readonly declinePressure: number;
  readonly employment: number;
}

export function buildSettlementSummaryReadModel(
  state: WorldState,
  settlementId: string,
): SettlementSummaryReadModel | undefined {
  const settlement = state.settlements[settlementId];
  if (!settlement) return undefined;

  return {
    settlementId: settlement.id,
    regionId: settlement.regionId,
    name: settlement.name,
    stage: settlement.stage,
    population: settlement.population.totalPopulation,
    housing: {
      capacity: settlement.housing.capacity,
      cost: settlement.housing.cost,
      pressure: settlement.housing.pressure,
    },
    urbanizationPressure: settlement.condition.urbanizationPressure,
    declinePressure: settlement.condition.declinePressure,
    employment: settlement.economy.employment,
  };
}
