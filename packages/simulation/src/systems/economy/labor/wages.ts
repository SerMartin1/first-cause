import type { Company } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import {
  assertFinite,
  assertNonNegative,
  assertPositive,
} from "../../../core/validation.js";
import { classifyShortageSurplus } from "../markets/shortage-surplus.js";

/**
 * Wage offer adjustment (Simulation Model SS11.1 `LaborDemand up +
 * LaborSupply down -> WagePressure up`; AI Decision Model SS30 "Wage
 * Offer": raises are bounded monthly, mirrors the roadmap's own risk
 * note for M9 -- "sprzężenie zwrotne płace<->ceny<->popyt może wzmacniać
 * oscylację z M8" -- by reusing the *exact* capped-and-smoothed pressure
 * shape `markets/price-adjustment.ts` (M8) uses for goods prices, so the
 * labor market gets the same R1 safeguards from its first version
 * instead of a second, differently-tuned oscillation risk.
 *
 * `classifyShortageSurplus` (M8) is reused as-is for the severity
 * readout: labor has no physical "inventory" to buffer a shortfall, so
 * `inventory: 0` is passed deliberately -- there is nothing to dampen
 * with, unlike a good sitting in a warehouse.
 */
const WAGE_SENSITIVITY = 0.5; // TODO tuning
const MAX_TICK_WAGE_CHANGE = 0.1; // TODO tuning -- AI Decision Model SS30 "zmiany ograniczone miesięcznie"
const WAGE_SMOOTHING_FACTOR = 0.3; // TODO tuning
const MIN_WAGE = 0.01; // TODO tuning -- wage must stay positive, same floor role as price-adjustment's MIN_PRICE

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface AdjustWageOfferInput {
  readonly company: Company;
  /** Unemployed, labor-force-eligible workers of this company's demanded skill(s), observed by the caller (e.g. summed `availableWorkers` across matching cohorts) -- Company never owns this, same "observed not owned" rule Market applies to Inventory. */
  readonly availableLabor: number;
}

export interface AdjustWageOfferResult {
  readonly company: Company;
  /** In [0, 1] -- 0 whenever available labor already covers vacancies. */
  readonly laborShortageSeverity: number;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Advances one company's `workforce.wageOffer` by exactly one tick.
 * Requires a positive starting wage (`createCompany`'s `initialWageOffer`)
 * -- the same fail-loud "seed before ticking" contract
 * `initializeMarketGood` enforces for `localPrice`, since a multiplicative
 * adjustment can never leave 0.
 */
export function adjustWageOffer(input: AdjustWageOfferInput): AdjustWageOfferResult {
  const { company } = input;
  const vacancies = assertNonNegative(
    company.workforce.vacancies,
    `adjustWageOffer: Company "${company.id}".workforce.vacancies`,
  );
  const availableLabor = assertNonNegative(
    input.availableLabor,
    "adjustWageOffer().availableLabor",
  );
  const wageOffer = assertPositive(
    company.workforce.wageOffer,
    `adjustWageOffer: Company "${company.id}".workforce.wageOffer must be seeded (createCompany's initialWageOffer) first`,
  );

  const { shortageSeverity: laborShortageSeverity } = classifyShortageSurplus({
    supply: availableLabor,
    demand: vacancies,
    inventory: 0,
  });

  const reference = Math.max(vacancies, 1);
  const gap = vacancies - availableLabor; // > 0: shortage (wage pressure up); < 0: surplus (wage pressure down)
  const rawPressure = WAGE_SENSITIVITY * (gap / reference);
  const cappedPressure = clamp(rawPressure, -MAX_TICK_WAGE_CHANGE, MAX_TICK_WAGE_CHANGE);
  const wagePressure = cappedPressure * WAGE_SMOOTHING_FACTOR;

  const rawWageOffer = wageOffer * (1 + wagePressure);
  const nextWageOffer = assertFinite(
    Math.max(MIN_WAGE, rawWageOffer),
    `adjustWageOffer: Company "${company.id}".workforce.wageOffer`,
  );

  const nextCompany: Company = {
    ...company,
    workforce: { ...company.workforce, wageOffer: nextWageOffer },
  };

  const facts: FactInput<number>[] = [];
  if (nextWageOffer !== wageOffer) {
    facts.push({
      type: "wage_offer_changed",
      subject: { entityType: "company", entityId: company.id },
      location: { regionId: company.regionId },
      values: {
        before: wageOffer,
        after: nextWageOffer,
        delta: nextWageOffer - wageOffer,
      },
    });
  }

  return { company: nextCompany, laborShortageSeverity, facts };
}
