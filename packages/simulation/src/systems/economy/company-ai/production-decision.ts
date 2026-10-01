import type { Company } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { sortedEntries } from "../../../core/determinism.js";
import { assertFinite, assertNonNegative } from "../../../core/validation.js";
import type { ProductionRecipe } from "../production.js";
import { clamp } from "./decision-framework.js";
import type { CompanyFinancialHealth } from "./financial-health.js";

/**
 * Production Decision (AI-03, AI Decision Model SS25-28) -- plan produkcji
 * (etap 1 naprawy po diagnozie Black Mountain 2026-10-01, decyzja właściciela
 * N3). Poprzednia wersja reagowała na marżę bez płac i na WŁASNY bufor firmy
 * (zawsze „na poziomie docelowym”), więc zwiększała produkcję mimo rosnącego
 * zapasu regionu i strat (diagnoza P2--P4).
 *
 * Teraz firma ocenia kilka poziomów produkcji w całych partiach (bieżący i o
 * jeden krok w dół / w górę -- SS26 „nie skacze”) i dla każdego liczy:
 *
 *   oczekiwany wynik = przychód z możliwej sprzedaży − koszty wejść − płace
 *
 * - możliwa sprzedaż per towar = udział firmy × wolumen, który rynek regionu
 *   może przyjąć w tym miesiącu: prognoza popytu + uzupełnienie zapasu do
 *   celu (`TARGET_STOCK_MONTHS`), bez ujemnych wartości. Niesprzedana
 *   produkcja zwiększa zapas, ale NIE jest przychodem;
 * - koszty wejść = towary wejściowe po cenie lokalnej. Wydobycie zasobu z
 *   własnego złoża nie ma w modelu kosztu pieniężnego (finanse firmy liczą
 *   wyłącznie płace), więc nie jest tu doliczane -- inaczej plan karałby
 *   farmę zasianą w fixture ceną zboża, której nikt nie płaci (diagnoza P10);
 * - płace = planowani pracownicy (partie × pracownicy na partię) × obecna
 *   oferta płacowa.
 *
 * Pokrycie zapasem (miesiące prognozowanego popytu, per towar): zwiększanie
 * tylko poniżej `INCREASE_BELOW_MONTHS`; powyżej `REDUCE_ABOVE_MONTHS` i w
 * paśmie pomiędzy -- tylko utrzymanie albo zmniejszenie. Zerowy popyt z
 * dodatnim zapasem = nadwyżka (bez podstawiania małej liczby). Brak historii
 * popytu = brak danych (np. tick 0): plan nie powstaje, firma utrzymuje
 * poziom zamiast planować sprzedaż zero.
 *
 * SS23 „Priorytet przetrwania”: firma w kryzysie finansowym, która traci
 * pieniądze, nie zwiększa produkcji.
 */
export const DEMAND_SMOOTHING_MONTHS = 3; // TODO tuning
export const TARGET_STOCK_MONTHS = 2; // TODO tuning
export const REDUCE_ABOVE_MONTHS = 3; // TODO tuning
export const INCREASE_BELOW_MONTHS = 1; // TODO tuning
/** Krok planu na tick jako ułamek mocy (dawne 0,15 × 0,5 -- SS26); zawsze co najmniej 1 partia. */
export const PLAN_UTILIZATION_STEP = 0.075; // TODO tuning
const RESULT_EPSILON = 1e-9;

export type ProductionAction = "STOP" | "REDUCE" | "MAINTAIN" | "INCREASE";
export type ProductionBottleneck = "INPUT" | "DEMAND" | "NONE";

/** Pokrycie zapasem jednego towaru. */
export type StockCoverage =
  | { readonly kind: "MONTHS"; readonly months: number }
  | { readonly kind: "SURPLUS_NO_DEMAND" }
  | { readonly kind: "NO_STOCK_NO_DEMAND" }
  | { readonly kind: "NO_DATA" };

/** Rynek jednego towaru oczami firmy (obserwowany, nie posiadany -- DATA-006). */
export interface PlanGoodMarket {
  readonly price: number;
  /** Średni miesięczny popyt z `DEMAND_SMOOTHING_MONTHS`; undefined = brak historii (brak danych, nie zero). */
  readonly forecastDemand: number | undefined;
  /** Zapas regionu + bufory firm, bez podwójnego liczenia. */
  readonly totalStock: number;
  /** Udział tej firmy w sprzedaży regionu (0..1). */
  readonly share: number;
}

export interface ProductionPlanOption {
  readonly utilization: number;
  readonly batches: number;
  readonly plannedEmployees: number;
  readonly expectedRevenue: number;
  readonly inputCosts: number;
  readonly wageCosts: number;
  readonly expectedResult: number;
  /** Produkcja, której rynek w tym miesiącu nie przyjmie (zwiększa zapas). */
  readonly unsoldOutput: number;
}

export interface DecideProductionInput {
  readonly company: Company;
  readonly recipe: ProductionRecipe;
  /** goodId -> rynek towaru; towar wyjściowy bez wpisu = brak rynku (brak sprzedaży). */
  readonly goods: Readonly<Record<string, PlanGoodMarket>>;
  /** 0..1: fraction of target inputs actually obtainable this tick (resource/good availability). */
  readonly inputAvailability: number;
  readonly financialHealth: CompanyFinancialHealth;
  /** Pracownicy na jednostkę mocy (most capacity × utilization → zatrudnienie). */
  readonly employeesPerCapacityUnit: number;
  /**
   * N4: ilu pracowników firma może mieć (obecni + dostępni bezrobotni
   * regionu); plan nie liczy partii, do których brakuje ludzi. Brak = bez limitu.
   */
  readonly maxEmployees?: number;
}

export interface DecideProductionResult {
  readonly company: Company;
  readonly action: ProductionAction;
  readonly bottleneck: ProductionBottleneck;
  /** Pokrycie zapasem głównego towaru wyjściowego. */
  readonly coverage: StockCoverage;
  /** Wybrany plan; undefined = brak danych o popycie (poziom utrzymany). */
  readonly plan: ProductionPlanOption | undefined;
  readonly options: readonly ProductionPlanOption[];
  /**
   * Pracownicy, których firmie brakuje do lepszego (opłacalnego) planu ponad
   * `maxEmployees` -- sygnał „są miejsca pracy” (migracja), nie zatrudnienie.
   */
  readonly unmetLaborNeed: number;
  readonly facts: readonly FactInput<number>[];
}

/** Średnia z ostatnich `DEMAND_SMOOTHING_MONTHS` punktów historii; pusta historia = brak danych. */
export function forecastDemand(history: readonly number[] | undefined): number | undefined {
  if (!history || history.length === 0) return undefined;
  const window = history.slice(-DEMAND_SMOOTHING_MONTHS);
  return window.reduce((sum, value) => sum + value, 0) / window.length;
}

export function stockCoverage(
  totalStock: number,
  forecast: number | undefined,
): StockCoverage {
  if (forecast === undefined) return { kind: "NO_DATA" };
  if (forecast > 0) return { kind: "MONTHS", months: totalStock / forecast };
  return totalStock > 0 ? { kind: "SURPLUS_NO_DEMAND" } : { kind: "NO_STOCK_NO_DEMAND" };
}

/** Ile rynek regionu może przyjąć od producentów w tym miesiącu: popyt + uzupełnienie zapasu do celu. */
export function sellableVolume(good: PlanGoodMarket): number {
  const forecast = good.forecastDemand ?? 0;
  if (forecast <= 0) return 0;
  return clamp(
    forecast + TARGET_STOCK_MONTHS * forecast - good.totalStock,
    0,
    forecast * (1 + TARGET_STOCK_MONTHS),
  );
}

/**
 * Marża operacyjna jednej partii przy danej płacy: sprzedaż wyjść − towary
 * wejściowe − płace (zasoby z własnego złoża bez kosztu pieniężnego, patrz
 * doc modułu). Wspólna dla planu produkcji i przedsiębiorczości (AI-07).
 */
export function operatingMarginPerBatch(
  recipe: ProductionRecipe,
  prices: Readonly<Record<string, number>>,
  wagePerWorker: number,
): number {
  let margin = 0;
  for (const [goodId, quantity] of sortedEntries(recipe.goodOutputsPerBatch))
    margin += quantity * (prices[goodId] ?? 0);
  for (const [goodId, quantity] of sortedEntries(recipe.goodInputsPerBatch))
    margin -= quantity * (prices[goodId] ?? 0);
  return margin - wagePerWorker * recipe.employeesPerBatch;
}

/** Pracownicy potrzebni na `batches` partii (całe osoby). */
function employeesForBatches(input: DecideProductionInput, batches: number): number {
  return input.recipe.employeesPerBatch > 0
    ? batches * input.recipe.employeesPerBatch
    : Math.ceil(batches * input.employeesPerCapacityUnit - RESULT_EPSILON);
}

function evaluateOption(
  input: DecideProductionInput,
  utilization: number,
  batches: number,
): ProductionPlanOption {
  const { company, recipe } = input;
  const plannedEmployees = employeesForBatches(input, batches);
  let expectedRevenue = 0;
  let unsoldOutput = 0;
  for (const [goodId, perBatch] of sortedEntries(recipe.goodOutputsPerBatch)) {
    const output = perBatch * batches;
    const good = input.goods[goodId];
    const sold = good ? Math.min(output, good.share * sellableVolume(good)) : 0;
    expectedRevenue += sold * (good?.price ?? 0);
    unsoldOutput += output - sold;
  }
  let inputCosts = 0;
  for (const [goodId, perBatch] of sortedEntries(recipe.goodInputsPerBatch))
    inputCosts += perBatch * batches * (input.goods[goodId]?.price ?? 0);
  const wageCosts = plannedEmployees * company.workforce.wageOffer;
  return {
    utilization,
    batches,
    plannedEmployees,
    expectedRevenue,
    inputCosts,
    wageCosts,
    expectedResult: expectedRevenue - inputCosts - wageCosts,
    unsoldOutput,
  };
}

/** Całe partie przy danym wykorzystaniu (`runProduction`: floor(capacity × utilization)). */
function batchesAt(capacity: number, utilization: number): number {
  return Math.max(0, Math.floor(capacity * utilization + RESULT_EPSILON));
}

export function decideProduction(input: DecideProductionInput): DecideProductionResult {
  const { company, recipe } = input;
  const inputAvailability = clamp(
    assertNonNegative(input.inputAvailability, "decideProduction().inputAvailability"),
    0,
    1,
  );
  for (const [goodId, good] of Object.entries(input.goods)) {
    assertFinite(good.price, `decideProduction(${goodId}).price`);
    assertNonNegative(good.totalStock, `decideProduction(${goodId}).totalStock`);
    if (good.forecastDemand !== undefined)
      assertNonNegative(good.forecastDemand, `decideProduction(${goodId}).forecastDemand`);
  }
  const current = company.production.utilization;
  const primaryGoodId = Object.keys(recipe.goodOutputsPerBatch)[0];
  const primary = primaryGoodId ? input.goods[primaryGoodId] : undefined;
  const coverage = primary
    ? stockCoverage(primary.totalStock, primary.forecastDemand)
    : ({ kind: "NO_DATA" } as const);

  let plan: ProductionPlanOption | undefined;
  let options: ProductionPlanOption[] = [];
  let unreachable: ProductionPlanOption[] = [];
  let desired = current;
  if (coverage.kind !== "NO_DATA") {
    // SS23: firma w kryzysie, która traci pieniądze, nie zwiększa produkcji.
    // Nowa firma bez kapitału (gotówka 0, bez straty) nie jest w kryzysie
    // strat -- inaczej nigdy nie uruchomiłaby pierwszej partii.
    const losingInDistress =
      input.financialHealth.distressed && company.finance.profit < 0;
    const increaseAllowed =
      !losingInDistress &&
      coverage.kind === "MONTHS" &&
      coverage.months < INCREASE_BELOW_MONTHS;
    // Opcje w CAŁYCH partiach: bieżąca i o krok w dół / w górę, krok =
    // max(1 partia, PLAN_UTILIZATION_STEP × capacity) -- mała firma (moc 1)
    // też może dojść do pierwszej partii, duża nie skacze (SS26).
    const capacity = company.production.capacity;
    const maxBatches = batchesAt(capacity, 1);
    const laborBatchCap =
      input.maxEmployees !== undefined && recipe.employeesPerBatch > 0
        ? Math.floor(input.maxEmployees / recipe.employeesPerBatch + RESULT_EPSILON)
        : Number.POSITIVE_INFINITY;
    const rawCurrentBatches = batchesAt(capacity, current);
    const currentBatches = Math.min(rawCurrentBatches, laborBatchCap);
    const step = Math.max(1, Math.round(capacity * PLAN_UTILIZATION_STEP));
    const candidates: { utilization: number; batches: number }[] = [
      {
        utilization:
          currentBatches < rawCurrentBatches && capacity > 0 ? currentBatches / capacity : current,
        batches: currentBatches,
      },
    ];
    for (const b of [currentBatches - step, currentBatches + step]) {
      const batches = Math.min(maxBatches, Math.max(0, b));
      if (batches === currentBatches || capacity <= 0) continue;
      if (batches > currentBatches && !increaseAllowed) continue;
      candidates.push({ utilization: clamp(batches / capacity, 0, 1), batches });
    }
    const evaluated = candidates.map((c) => evaluateOption(input, c.utilization, c.batches));
    // Opcje osiągalne pracą; lepsza, ale nieosiągalna -- tylko sygnał potrzeby.
    options = evaluated.filter((o) => o.batches <= laborBatchCap);
    unreachable = evaluated.filter((o) => o.batches > laborBatchCap);
    // Najlepszy wynik; przy remisie -- bieżący poziom, potem niższy (stabilność).
    plan = options.reduce((best, option) => {
      const diff = option.expectedResult - best.expectedResult;
      if (diff > RESULT_EPSILON) return option;
      if (diff < -RESULT_EPSILON) return best;
      if (best.utilization === current) return best;
      if (option.utilization === current) return option;
      return option.utilization < best.utilization ? option : best;
    });
    desired = plan.utilization;
  }
  const chosen = plan;
  const betterUnreachable = chosen
    ? unreachable
        .filter((o) => o.expectedResult > chosen.expectedResult + RESULT_EPSILON)
        .reduce((max, o) => Math.max(max, o.plannedEmployees), 0)
    : 0;
  const unmetLaborNeed = chosen ? Math.max(0, betterUnreachable - chosen.plannedEmployees) : 0;

  const nextUtilization = Math.min(desired, inputAvailability);
  if (plan && nextUtilization !== plan.utilization)
    plan = evaluateOption(
      input,
      nextUtilization,
      batchesAt(company.production.capacity, nextUtilization),
    );

  const bottleneck: ProductionBottleneck =
    nextUtilization < desired ? "INPUT" : desired < current ? "DEMAND" : "NONE";
  let action: ProductionAction;
  if (nextUtilization <= 0) action = "STOP";
  else if (nextUtilization > current + RESULT_EPSILON) action = "INCREASE";
  else if (nextUtilization < current - RESULT_EPSILON) action = "REDUCE";
  else action = "MAINTAIN";

  const nextCompany: Company = {
    ...company,
    production: { ...company.production, utilization: nextUtilization },
  };
  const facts: FactInput<number>[] = [];
  if (nextUtilization !== current) {
    facts.push({
      type: "production_utilization_changed",
      subject: { entityType: "company", entityId: company.id },
      location: { regionId: company.regionId },
      values: { before: current, after: nextUtilization, delta: nextUtilization - current },
    });
  }
  return {
    company: nextCompany,
    action,
    bottleneck,
    coverage,
    plan,
    options,
    unmetLaborNeed,
    facts,
  };
}
