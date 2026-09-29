import { assertNonEmpty } from "../core/validation.js";

/** Entity Data Model SS10. */
export type SettlementStage =
  "CAMP" | "HAMLET" | "VILLAGE" | "TOWN" | "CITY" | "METROPOLIS";

/**
 * Cykl życia osady (Canonical Decisions: SET-LIFECYCLE-001). `ACTIVE` =
 * żyjąca osada; `ABANDONED` = osada, której populacja spadła do 0 --
 * pozostaje encją HISTORYCZNĄ (Chronicle, WHY?, przyczynowość), ale nie
 * jest aktywną osadą. Przejście jest jednokierunkowe: ponowne zasiedlenie
 * regionu tworzy NOWĄ osadę z nowym id, nigdy nie reaktywuje starej.
 * `status` jest jedynym źródłem prawdy o aktywności osady.
 */
export type SettlementStatus = "ACTIVE" | "ABANDONED";

export const SETTLEMENT_STATUSES: readonly SettlementStatus[] = ["ACTIVE", "ABANDONED"];

export interface SettlementPopulationState {
  readonly cohortIds: readonly string[];
  /** Cache, same DATA-004 pattern as `Region.population.totalPopulation`. */
  readonly totalPopulation: number;
}

export interface SettlementEconomyState {
  readonly companyIds: readonly string[];
  readonly employment: number;
  readonly localIncome: number;
  readonly localWealth: number;
}

export interface SettlementHousing {
  readonly capacity: number;
  readonly cost: number;
  readonly pressure: number;
}

export interface SettlementCondition {
  readonly attractiveness: number;
  readonly urbanizationPressure: number;
  readonly declinePressure: number;
}

/**
 * Bookkeeping dla stage transitions (M14, `society/settlements.ts`):
 * ten sam kształt (streak + cooldown) co M12's `RegionEntrepreneurshipState`,
 * tylko bez `activeStates` -- stage to sama `Settlement.stage` (drabina o
 * jednym aktywnym szczeblu naraz), nie osobny per-kandydat flag.
 * `urbanizationStreak`/`declineStreak` liczą kolejne ticki, w których
 * warunek awansu/regresji trzymał się nieprzerwanie (FC-SETTLEMENT-002:
 * "nie może zależeć wyłącznie od jednego przypadkowego ticka").
 */
export interface SettlementGrowthState {
  readonly urbanizationStreak: number;
  readonly declineStreak: number;
  readonly lastStageChangeTick: number | undefined;
}

/**
 * Settlement (Entity Data Model SS10): "settlements arise and develop
 * organically". A pure data holder in M3 -- growth/urbanization logic
 * is M14. Uses the regional Market (DATA-006), not its own.
 *
 * `services`/`infrastructure` (ServiceCapacity/Infrastructure) and
 * `society` (Culture shares) sub-objects are omitted, same reasoning as
 * `Region` -- those entity types are not part of M3.
 */
export interface Settlement {
  readonly id: string;
  readonly regionId: string;
  readonly name: string;
  readonly foundedTick: number;
  readonly status: SettlementStatus;
  /** Tick przejścia ACTIVE → ABANDONED; `undefined` dla osady aktywnej. */
  readonly abandonedTick: number | undefined;
  readonly stage: SettlementStage;
  readonly population: SettlementPopulationState;
  readonly economy: SettlementEconomyState;
  readonly housing: SettlementHousing;
  readonly condition: SettlementCondition;
  readonly growth: SettlementGrowthState;
}

export interface CreateSettlementInput {
  readonly id: string;
  readonly regionId: string;
  readonly name: string;
  readonly foundedTick: number;
  readonly stage?: SettlementStage;
}

export function createSettlement(input: CreateSettlementInput): Settlement {
  assertNonEmpty(input.id, "Settlement.id");
  assertNonEmpty(input.regionId, "Settlement.regionId");
  assertNonEmpty(input.name, "Settlement.name");
  if (!Number.isInteger(input.foundedTick) || input.foundedTick < 0) {
    throw new RangeError(
      `Settlement "${input.id}": foundedTick must be a non-negative integer, got ${String(input.foundedTick)}`,
    );
  }

  return {
    id: input.id,
    regionId: input.regionId,
    name: input.name,
    foundedTick: input.foundedTick,
    // Nowa osada (world generation, przyszłe zakładanie osad) jest zawsze aktywna.
    status: "ACTIVE",
    abandonedTick: undefined,
    stage: input.stage ?? "CAMP",
    population: { cohortIds: [], totalPopulation: 0 },
    economy: { companyIds: [], employment: 0, localIncome: 0, localWealth: 0 },
    housing: { capacity: 0, cost: 0, pressure: 0 },
    condition: { attractiveness: 0, urbanizationPressure: 0, declinePressure: 0 },
    growth: { urbanizationStreak: 0, declineStreak: 0, lastStageChangeTick: undefined },
  };
}

/** Jedyna definicja aktywności osady -- nigdy `population > 0` jako zamiennik statusu. */
export function isSettlementActive(settlement: Pick<Settlement, "status">): boolean {
  return settlement.status === "ACTIVE";
}
