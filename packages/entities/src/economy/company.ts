import { assertNonEmpty } from "../core/validation.js";

/** Entity Data Model SS19. */
export type CompanyOwnerType = "individual" | "company" | "state";

export interface CompanyFinance {
  readonly cash: number;
  readonly debt: number;
  readonly revenue: number;
  readonly costs: number;
  readonly profit: number;
  readonly taxes: number;
  readonly financingCost: number;
  /**
   * Niewypłacony wynik zatrzymany (dochód właścicielski, 2026-10-01): +
   * rozliczony zysk, − strata, − wypłata właścicielska. Może być ujemny
   * (kolejne zyski najpierw pokrywają straty). Kapitał początkowy i wkłady
   * finansujące firmę NIE są wynikiem -- nowa firma zaczyna od 0.
   */
  readonly retainedEarnings: number;
  /** Koszty operacyjne (dziś: płace) ostatnich ≤ 3 rozliczonych ticków, najstarszy pierwszy -- bufor operacyjny wypłaty. */
  readonly operatingCostHistory: readonly number[];
  /**
   * Etap 4B (P13, 2026-10-01): rezerwa inwestycyjna -- część istniejącej
   * gotówki wydzielona na jeden aktywny plan rozbudowy (nie nowe pieniądze);
   * niedostępna do wypłaty właścicielskiej. 0 = brak rezerwy.
   */
  readonly investmentReserve: number;
}

export interface CompanyProduction {
  readonly productionMethodId: string | undefined;
  readonly capacity: number;
  readonly utilization: number;
  readonly outputLastTick: number;
  readonly inputRequirements: Readonly<Record<string, number>>;
  readonly energyDemand: number;
}

export interface CompanyWorkforce {
  readonly employees: number;
  readonly vacancies: number;
  readonly wageOffer: number;
  readonly skillDemand: Readonly<Record<string, number>>;
}

export interface CompanyMarketState {
  readonly marketShare: number;
  readonly expectedPrices: Readonly<Record<string, number>>;
  readonly expectedDemand: Readonly<Record<string, number>>;
}

export interface CompanyStatus {
  readonly active: boolean;
  readonly distressed: boolean;
  readonly bankrupt: boolean;
}

/** Short rolling trends (AI Decision Model SS9 "Memory": "krótka pamięć trendów", not full world history). */
export interface CompanyAiMemory {
  readonly profitHistory: readonly number[];
  readonly demandHistory: readonly number[];
  readonly shortageHistory: readonly number[];
}

/**
 * `ai` (Entity Data Model SS19 `ai: {state, expectations, lastDecision,
 * lastEvaluation}`, M11). `expectations` is deliberately NOT duplicated
 * here -- it already exists as `CompanyMarketState.expectedPrices/
 * expectedDemand` (M3), so M11 writes into that instead of adding a
 * second copy. `state` becomes `memory` (AI-02 Observation & Memory) +
 * `activeStates`/`opportunityStreak` (AI-01 hysteresis/persistence,
 * `company-ai/decision-framework.ts`); `lastDecision` is the cooldown
 * gate (AI-005/SS20), keyed by decision type.
 */
export interface CompanyAiState {
  readonly memory: CompanyAiMemory;
  readonly activeStates: Readonly<Record<string, boolean>>;
  readonly opportunityStreak: Readonly<Record<string, number>>;
  readonly lastDecision: Readonly<Record<string, number>>;
}

/**
 * Company (Entity Data Model SS19). A pure data container in M3 -- the
 * `OBSERVE -> FORECAST -> DECIDE -> ACT -> EVALUATE` AI cycle that
 * mutates it belongs to AI Decision Model / M11 ("Entity Data Model
 * stores state; decision detail belongs to AI Decision Model"); M11
 * adds the `ai` field this comment used to say M3 deliberately left out.
 */
export interface Company {
  readonly id: string;
  readonly archetypeId: string;
  readonly name: string;
  readonly foundedTick: number;
  readonly closedTick: number | undefined;

  readonly regionId: string;
  readonly settlementId: string | undefined;

  readonly ownerType: CompanyOwnerType;
  readonly ownerEntityId: string;

  readonly finance: CompanyFinance;
  readonly production: CompanyProduction;
  readonly workforce: CompanyWorkforce;
  readonly inventoryId: string;
  readonly market: CompanyMarketState;
  readonly status: CompanyStatus;
  readonly ai: CompanyAiState;
}

export interface CreateCompanyInput {
  readonly id: string;
  readonly archetypeId: string;
  readonly name: string;
  readonly foundedTick: number;
  readonly regionId: string;
  readonly settlementId?: string;
  readonly ownerType: CompanyOwnerType;
  readonly ownerEntityId: string;
  readonly inventoryId: string;
  readonly initialCash?: number;
  /** Seeds `workforce.wageOffer` (M9 `labor/wages.adjustWageOffer` requires a positive starting wage, the same "seed before ticking" contract `markets/price-adjustment.initializeMarketGood` uses for `localPrice`). */
  readonly initialWageOffer?: number;
}

export function createCompany(input: CreateCompanyInput): Company {
  assertNonEmpty(input.id, "Company.id");
  assertNonEmpty(input.archetypeId, "Company.archetypeId");
  assertNonEmpty(input.name, "Company.name");
  assertNonEmpty(input.regionId, "Company.regionId");
  assertNonEmpty(input.ownerEntityId, "Company.ownerEntityId");
  assertNonEmpty(input.inventoryId, "Company.inventoryId");
  if (!Number.isInteger(input.foundedTick) || input.foundedTick < 0) {
    throw new RangeError(
      `Company "${input.id}": foundedTick must be a non-negative integer, got ${String(input.foundedTick)}`,
    );
  }

  return {
    id: input.id,
    archetypeId: input.archetypeId,
    name: input.name,
    foundedTick: input.foundedTick,
    closedTick: undefined,
    regionId: input.regionId,
    settlementId: input.settlementId,
    ownerType: input.ownerType,
    ownerEntityId: input.ownerEntityId,
    finance: {
      cash: input.initialCash ?? 0,
      debt: 0,
      revenue: 0,
      costs: 0,
      profit: 0,
      taxes: 0,
      financingCost: 0,
      retainedEarnings: 0,
      operatingCostHistory: [],
      investmentReserve: 0,
    },
    production: {
      productionMethodId: undefined,
      capacity: 0,
      utilization: 0,
      outputLastTick: 0,
      inputRequirements: {},
      energyDemand: 0,
    },
    workforce: {
      employees: 0,
      vacancies: 0,
      wageOffer: input.initialWageOffer ?? 0,
      skillDemand: {},
    },
    inventoryId: input.inventoryId,
    market: { marketShare: 0, expectedPrices: {}, expectedDemand: {} },
    status: { active: true, distressed: false, bankrupt: false },
    ai: {
      memory: { profitHistory: [], demandHistory: [], shortageHistory: [] },
      activeStates: {},
      opportunityStreak: {},
      lastDecision: {},
    },
  };
}
