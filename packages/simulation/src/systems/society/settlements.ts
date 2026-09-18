import type { Settlement, SettlementStage } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { assertNonNegative } from "../../core/validation.js";
import { clamp } from "../economy/company-ai/decision-framework.js";
import { updateSettlementHousing } from "./housing.js";

/**
 * Settlements (SET-001/SET-002, AI Decision Model §61 "Settlement
 * Adaptation", `society/settlements`, M14). "Settlement nie jest
 * klasycznym aktorem decyzyjnym" (§61) -- w przeciwieństwie do M11's
 * Company AI albo M12's Opportunity Scanner, to nie jest scored decision
 * z options/DecisionSnapshot, tylko prosty automat progowy: pressure
 * sustained przez `STAGE_PERSISTENCE_TICKS` awansuje/cofa stage o jeden
 * szczebel drabiny `SET-001`.
 *
 * Kanoniczna formuła (§61):
 * `SettlementPressure = Population + Jobs + Trade + Services +
 * Infrastructure + HousingDemand - Constraints`. `Services` nie ma
 * dziś żadnego modelu (brak ServiceCapacity, poza zakresem M14 --
 * pominięte milcząco, ten sam traktament co M13's Safety/
 * CulturalAffinity/itd.). Pozostałe składniki są tu 0..1-owymi
 * podwynikami ważonej sumy, ten sam wzorzec co M12's OpportunityScore/
 * M13's MigrationAttraction:
 *
 * - `PopulationScore` = jak blisko populacja jest progu KOLEJNEGO etapu
 *   (`STAGE_POPULATION_THRESHOLD`) -- to jednocześnie "Population" i
 *   podstawowy sygnał "threshold" z §61.
 * - `JobsScore` = wskaźnik zatrudnienia (employment/population).
 * - `TradeScore` = średnie wykorzystanie (`currentState.utilization`,
 *   M10) połączeń regionu -- Settlement nie ma własnego Market/Inventory
 *   (`entities/society/settlement.ts`'s doc comment), więc handel jest
 *   z konieczności sygnałem regionalnym, dzielonym przez wszystkie osady
 *   regionu.
 * - `InfrastructureScore` = średni `infrastructure.level` połączeń
 *   regionu (M10) -- dziś zwykle 0 (nikt go jeszcze nie inwestuje,
 *   `Connection.infrastructure.level` pozostaje martwe aż do M14/M22
 *   inwestycji transportowej, poza zakresem TEGO milestone'u).
 * - `HousingDemandScore`/`Constraints` = odpowiednio zapełnienie i
 *   *nadwyżka* ponad `housing.capacity` (`housing.ts`'s
 *   `computeHousingPressure`) -- to właśnie ta para realizuje Urban
 *   Crisis (FC-SETTLEMENT-003): pełny housing to zdrowy popyt (dodatni),
 *   przepełniony housing to constraint (odejmowany), więc gwałtowny
 *   wzrost populacji bez nadążającej budowy tłumi dalszy awans zamiast
 *   go przyspieszać.
 *
 * "capacity" (trzeci warunek z §61 "threshold, persistence, capacity")
 * jest osobnym, twardym hard-eligibility gate w `evaluateSettlementStage`
 * -- osada nie awansuje, dopóki `housing.capacity` nie pomieści choćby
 * bieżącej populacji, niezależnie jak wysoki jest wynik presji.
 */
export const SETTLEMENT_STAGE_ORDER: readonly SettlementStage[] = [
  "CAMP",
  "HAMLET",
  "VILLAGE",
  "TOWN",
  "CITY",
  "METROPOLIS",
];

export const NEXT_SETTLEMENT_STAGE: Readonly<
  Partial<Record<SettlementStage, SettlementStage>>
> = {
  CAMP: "HAMLET",
  HAMLET: "VILLAGE",
  VILLAGE: "TOWN",
  TOWN: "CITY",
  CITY: "METROPOLIS",
};

export const PREVIOUS_SETTLEMENT_STAGE: Readonly<
  Partial<Record<SettlementStage, SettlementStage>>
> = {
  HAMLET: "CAMP",
  VILLAGE: "HAMLET",
  TOWN: "VILLAGE",
  CITY: "TOWN",
  METROPOLIS: "CITY",
};

/** Minimalna populacja, jaką dany etap już reprezentuje -- próg WEJŚCIA w ten etap (nie "typowa" ani "maksymalna" populacja). TODO tuning. */
export const STAGE_POPULATION_THRESHOLD: Readonly<Record<SettlementStage, number>> = {
  CAMP: 0,
  HAMLET: 50,
  VILLAGE: 200,
  TOWN: 1000,
  CITY: 5000,
  METROPOLIS: 20000,
};

const POPULATION_WEIGHT = 0.35; // TODO tuning
const JOBS_WEIGHT = 0.15; // TODO tuning
const TRADE_WEIGHT = 0.15; // TODO tuning
const INFRASTRUCTURE_WEIGHT = 0.1; // TODO tuning
const HOUSING_DEMAND_WEIGHT = 0.25; // TODO tuning -- tyle samo co populacja: pełny housing bez popytu na miejsce to osada, która nie ma po co rosnąć
const CONSTRAINTS_WEIGHT = 0.3; // TODO tuning -- na tyle duże, żeby realny Urban Crisis mógł faktycznie stłumić presję
const INFRASTRUCTURE_NORMALIZATION = 5; // TODO tuning -- ten sam styl co migration.ts's WAGE_NORMALIZATION

export interface SettlementSignals {
  readonly stage: SettlementStage;
  readonly population: number;
  readonly employment: number;
  /** 0..1+: średnie `Connection.currentState.utilization` połączeń regionu (M10). */
  readonly tradeUtilization: number;
  /** Średni `Connection.infrastructure.level` połączeń regionu (M10). */
  readonly infrastructureLevel: number;
  readonly housingCapacity: number;
}

export interface SettlementPressure {
  readonly urbanizationPressure: number;
  readonly declinePressure: number;
}

/** `SettlementPressure` (§61), rozdzielona na osobny sygnał "awansuj" i "cofnij" -- `Settlement.condition`'s dwa dedykowane pola. */
export function computeSettlementPressure(input: SettlementSignals): SettlementPressure {
  const population = assertNonNegative(
    input.population,
    "computeSettlementPressure().population",
  );
  const employment = assertNonNegative(
    input.employment,
    "computeSettlementPressure().employment",
  );
  const housingCapacity = assertNonNegative(
    input.housingCapacity,
    "computeSettlementPressure().housingCapacity",
  );

  const nextStage = NEXT_SETTLEMENT_STAGE[input.stage];
  const advanceTarget = nextStage ? STAGE_POPULATION_THRESHOLD[nextStage] : undefined;
  const populationScore =
    advanceTarget === undefined
      ? 1 // METROPOLIS: brak kolejnego etapu -- wynik odczytu bez znaczenia, i tak nic dalej nie odblokuje
      : advanceTarget > 0
        ? clamp(population / advanceTarget, 0, 1)
        : population > 0
          ? 1
          : 0;

  const jobsScore = population > 0 ? clamp(employment / population, 0, 1) : 0;
  const tradeScore = clamp(input.tradeUtilization, 0, 1);
  const infrastructureScore = clamp(
    input.infrastructureLevel / INFRASTRUCTURE_NORMALIZATION,
    0,
    1,
  );

  const occupancyRatio =
    housingCapacity > 0 ? population / housingCapacity : population > 0 ? 2 : 0;
  const housingDemandScore = clamp(occupancyRatio, 0, 1);
  const constraintsScore = clamp(occupancyRatio - 1, 0, 1);

  const urbanizationPressure = clamp(
    POPULATION_WEIGHT * populationScore +
      JOBS_WEIGHT * jobsScore +
      TRADE_WEIGHT * tradeScore +
      INFRASTRUCTURE_WEIGHT * infrastructureScore +
      HOUSING_DEMAND_WEIGHT * housingDemandScore -
      CONSTRAINTS_WEIGHT * constraintsScore,
    0,
    1,
  );

  const currentStageThreshold = STAGE_POPULATION_THRESHOLD[input.stage];
  const declinePopulationDeficit =
    currentStageThreshold > 0 ? clamp(1 - population / currentStageThreshold, 0, 1) : 0; // CAMP (próg 0) nigdy nie "spada" poniżej własnego minimum
  const declinePressure = clamp(
    0.6 * declinePopulationDeficit + 0.4 * (1 - jobsScore),
    0,
    1,
  );

  return { urbanizationPressure, declinePressure };
}

const STAGE_ADVANCE_THRESHOLD = 0.6; // TODO tuning
const STAGE_DECLINE_THRESHOLD = 0.6; // TODO tuning
const STAGE_PERSISTENCE_TICKS = 6; // TODO tuning -- FC-SETTLEMENT-002 "nie może zależeć wyłącznie od jednego przypadkowego ticka"
const STAGE_COOLDOWN_TICKS = 12; // TODO tuning -- ta sama skala co M12's FOUNDING_COOLDOWN_TICKS/M13-adjacent "duża, trudno odwracalna decyzja"

function stageDelta(before: SettlementStage, after: SettlementStage): number {
  return SETTLEMENT_STAGE_ORDER.indexOf(after) - SETTLEMENT_STAGE_ORDER.indexOf(before);
}

export interface EvaluateSettlementGrowthInput {
  readonly settlement: Settlement;
  readonly tick: number;
  readonly signals: SettlementSignals;
}

export interface EvaluateSettlementGrowthResult {
  readonly settlement: Settlement;
  readonly pressure: SettlementPressure;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Jeden tick jednej osady: aktualizuje housing (`housing.ts`), liczy
 * `SettlementPressure`, zapisuje oba wyniki w `Settlement.condition`,
 * i -- jeśli próg + persistence + capacity (§61) są spełnione, a osada
 * nie jest na cooldownie -- przesuwa `stage` o jeden szczebel drabiny
 * `SET-001` w górę lub w dół. Nigdy więcej niż jeden szczebel na tick
 * (żadna osada nie przeskakuje Camp→Town w jednym ticku, nawet przy
 * ogromnej presji) -- to samo ograniczenie co demografii "jeden bracket
 * na miesiąc" (POP-002).
 */
export function evaluateSettlementGrowth(
  input: EvaluateSettlementGrowthInput,
): EvaluateSettlementGrowthResult {
  const { tick, signals } = input;
  let settlement = input.settlement;

  const housingResult = updateSettlementHousing({
    settlement,
    population: signals.population,
  });
  settlement = { ...settlement, housing: housingResult.housing };
  const facts: FactInput<number>[] = [...housingResult.facts];

  const pressure = computeSettlementPressure({
    ...signals,
    housingCapacity: settlement.housing.capacity,
  });
  settlement = {
    ...settlement,
    condition: {
      ...settlement.condition,
      urbanizationPressure: pressure.urbanizationPressure,
      declinePressure: pressure.declinePressure,
    },
  };

  const nextStageUp = NEXT_SETTLEMENT_STAGE[settlement.stage];
  const nextStageDown = PREVIOUS_SETTLEMENT_STAGE[settlement.stage];
  const meetsAdvanceThreshold = pressure.urbanizationPressure >= STAGE_ADVANCE_THRESHOLD;
  const meetsDeclineThreshold = pressure.declinePressure >= STAGE_DECLINE_THRESHOLD;

  const urbanizationStreak =
    nextStageUp && meetsAdvanceThreshold ? settlement.growth.urbanizationStreak + 1 : 0;
  const declineStreak =
    nextStageDown && meetsDeclineThreshold ? settlement.growth.declineStreak + 1 : 0;

  const onCooldown =
    settlement.growth.lastStageChangeTick !== undefined &&
    tick - settlement.growth.lastStageChangeTick < STAGE_COOLDOWN_TICKS;
  // "capacity" (§61's trzeci warunek): osada nie awansuje, dopóki housing
  // nie mieści choćby bieżącej populacji -- bez tego presja sama by
  // wystarczyła, mimo że mieszkańcy dosłownie nie mają gdzie mieszkać.
  const hasAdequateCapacity = settlement.housing.capacity >= signals.population;

  let nextStage = settlement.stage;
  let stageChanged = false;
  if (
    !onCooldown &&
    nextStageUp &&
    urbanizationStreak >= STAGE_PERSISTENCE_TICKS &&
    hasAdequateCapacity
  ) {
    nextStage = nextStageUp;
    stageChanged = true;
  } else if (!onCooldown && nextStageDown && declineStreak >= STAGE_PERSISTENCE_TICKS) {
    nextStage = nextStageDown;
    stageChanged = true;
  }

  settlement = {
    ...settlement,
    stage: nextStage,
    growth: {
      urbanizationStreak: stageChanged ? 0 : urbanizationStreak,
      declineStreak: stageChanged ? 0 : declineStreak,
      lastStageChangeTick: stageChanged ? tick : settlement.growth.lastStageChangeTick,
    },
  };

  if (stageChanged) {
    facts.push({
      type: "settlement_stage_changed",
      subject: { entityType: "settlement", entityId: settlement.id },
      location: { regionId: settlement.regionId, settlementId: settlement.id },
      values: {
        before: SETTLEMENT_STAGE_ORDER.indexOf(input.settlement.stage),
        after: SETTLEMENT_STAGE_ORDER.indexOf(nextStage),
        delta: stageDelta(input.settlement.stage, nextStage),
      },
    });
  }

  return { settlement, pressure, facts };
}
