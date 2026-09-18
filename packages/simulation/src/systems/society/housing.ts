import type { Settlement, SettlementHousing } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { assertNonNegative } from "../../core/validation.js";

/**
 * Housing (SET-003, World Generation Spec §20, `society/housing`, M14).
 * `Settlement.housing` istniało od M3 jako martwe pole (`{ capacity: 0,
 * cost: 0, pressure: 0 }` na zawsze -- nic go dotąd nie aktualizowało);
 * M13 (Migration) już czyta `housing.capacity` jako twardy limit
 * (`population/migration.ts::selectDestinationSettlement`), ale sama
 * pojemność nie rosła. Ten moduł jest tym brakującym producentem.
 *
 * Wzrost jest jednokierunkowy i stopniowy (nie natychmiastowy skok do
 * targetu) -- ten sam styl wygładzania co `markets/price-adjustment.ts`'s
 * `pricePressure`: `capacity` goni `population * HOUSING_MARGIN` z
 * ograniczoną prędkością na tick. To właśnie ta prędkość jest mechanizmem
 * "Urban Crisis" (FC-SETTLEMENT-003, Simulation Test Spec §72) -- gdy
 * populacja rośnie szybciej niż budowa nadąża, `pressure` rośnie, zanim
 * `capacity` dogoni.
 */
const HOUSING_MARGIN = 1.2; // TODO tuning -- SET-003/World-Gen §20 "rozsądny margines" ponad bieżącą populację
const HOUSING_CONSTRUCTION_RATE = 0.05; // TODO tuning -- ułamek pozostałego dystansu do targetu odbudowywany w jednym ticku

/**
 * `capacity` nigdy nie maleje samoistnie -- nikt w tym silniku nie
 * "rozbiera domów", gdy populacja spada (to byłby osobny, dziś
 * niezamodelowany system decline/abandonment). Rośnie tylko w stronę
 * `population * HOUSING_MARGIN`, ograniczona `HOUSING_CONSTRUCTION_RATE`
 * na tick -- ta sama "goniący cel" logika co `HousingConstructionRate`
 * w World Generation Spec §20's ducha, tylko rozłożona w czasie zamiast
 * jednorazowego seeda na Tick 0 (ten jest zadaniem worldgena, nie M14).
 */
export function growHousingCapacity(input: {
  readonly currentCapacity: number;
  readonly population: number;
}): number {
  const currentCapacity = assertNonNegative(
    input.currentCapacity,
    "growHousingCapacity().currentCapacity",
  );
  const population = assertNonNegative(
    input.population,
    "growHousingCapacity().population",
  );

  const target = population * HOUSING_MARGIN;
  if (target <= currentCapacity) return currentCapacity;
  return currentCapacity + (target - currentCapacity) * HOUSING_CONSTRUCTION_RATE;
}

/**
 * Overcrowding -- jedynie *nadwyżka* populacji ponad `capacity` (0, gdy
 * mieści się w granicach, choćby "na styk"). Osobna od "ile brakuje do
 * pełna" -- ta funkcja mierzy realny kryzys, nie samo zapełnienie.
 * `capacity === 0` (osada bez zbudowanego housingu -- albo jeszcze nie
 * istnieje realnie, albo dopiero powstała) i dodatnia populacja to
 * maksymalny możliwy sygnał kryzysu, nie dzielenie przez zero.
 */
export function computeHousingPressure(input: {
  readonly population: number;
  readonly capacity: number;
}): number {
  const population = assertNonNegative(
    input.population,
    "computeHousingPressure().population",
  );
  const capacity = assertNonNegative(input.capacity, "computeHousingPressure().capacity");

  if (capacity <= 0) return population > 0 ? 1 : 0;
  return Math.max(0, (population - capacity) / capacity);
}

const HOUSING_COST_BASELINE = 1; // TODO tuning
const HOUSING_COST_PRESSURE_WEIGHT = 20; // TODO tuning -- pełny kryzys (pressure=1, populacja 2x capacity) podwaja koszt bazowy o tyle
const HOUSING_COST_TREND_WEIGHT = 0.3; // TODO tuning -- EMA, ten sam kształt co decision-framework.ts's updateExpectations

/** Koszt mieszkaniowy reaguje na overcrowding (scarcity pricing), wygładzony EMA -- jeden zły tick nie przestawia go od razu na docelową wartość. */
export function adjustHousingCost(input: {
  readonly currentCost: number;
  readonly pressure: number;
}): number {
  const currentCost = assertNonNegative(
    input.currentCost,
    "adjustHousingCost().currentCost",
  );
  const pressure = assertNonNegative(input.pressure, "adjustHousingCost().pressure");

  const target = HOUSING_COST_BASELINE + pressure * HOUSING_COST_PRESSURE_WEIGHT;
  return (
    currentCost * (1 - HOUSING_COST_TREND_WEIGHT) + target * HOUSING_COST_TREND_WEIGHT
  );
}

export interface UpdateSettlementHousingInput {
  readonly settlement: Settlement;
  /** Bieżąca (ten tick, po migracji/demografii) fizyczna populacja settlementu -- obserwowana przez wywołującego, nie liczona tutaj (ten sam wzorzec co markets/price-adjustment.ts's `supply`/`demand`). */
  readonly population: number;
}

export interface UpdateSettlementHousingResult {
  readonly housing: SettlementHousing;
  readonly facts: readonly FactInput<number>[];
}

/** Spina wzrost capacity + pressure + cost w jedno wywołanie na settlement na tick. */
export function updateSettlementHousing(
  input: UpdateSettlementHousingInput,
): UpdateSettlementHousingResult {
  const { settlement } = input;
  const population = assertNonNegative(
    input.population,
    "updateSettlementHousing().population",
  );

  const capacity = growHousingCapacity({
    currentCapacity: settlement.housing.capacity,
    population,
  });
  const pressure = computeHousingPressure({ population, capacity });
  const cost = adjustHousingCost({ currentCost: settlement.housing.cost, pressure });

  const facts: FactInput<number>[] = [];
  if (pressure > 0 && settlement.housing.pressure === 0) {
    facts.push({
      type: "housing_pressure_started",
      subject: { entityType: "settlement", entityId: settlement.id },
      location: { regionId: settlement.regionId, settlementId: settlement.id },
      values: { before: settlement.housing.pressure, after: pressure, delta: pressure },
    });
  }

  return { housing: { capacity, cost, pressure }, facts };
}
