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

/**
 * Company (Entity Data Model SS19). A pure data container in M3 -- the
 * `OBSERVE -> FORECAST -> DECIDE -> ACT -> EVALUATE` AI cycle that
 * mutates it belongs to AI Decision Model / M11 ("Entity Data Model
 * stores state; decision detail belongs to AI Decision Model"), so no
 * `ai` field is stored here yet -- M3's own scope explicitly excludes
 * AI.
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
  };
}
