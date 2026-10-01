import type { Company } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { roundWageRate } from "../../../core/rounding.js";
import { assertNonNegative, assertPositive } from "../../../core/validation.js";
import { directionalEdgeType, type PendingCausalLink } from "../../../core/causal-links.js";
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

/**
 * N4 (etap 1 naprawy po diagnozie Black Mountain 2026-10-01, decyzja
 * właściciela): granice oferty płacowej.
 * - `ceiling` -- budżet płac planu produkcji podzielony przez planowanych
 *   pracowników: `(przychód − koszty pozapłacowe − WAGE_SAFETY_BUFFER ×
 *   przychód) / pracownicy`; undefined = brak planu (brak danych o popycie).
 * - `floor` -- lokalny miesięczny koszt koszyka przetrwania jednej osoby
 *   (wygładzona cena); `MIN_WAGE` zostaje tylko zabezpieczeniem numerycznym.
 * Zmiana płacy pozostaje stopniowa (najwyżej ±`MAX_TICK_WAGE_CHANGE ×
 * WAGE_SMOOTHING_FACTOR` na tick): oferta powyżej sufitu schodzi ku niemu,
 * poniżej podłogi -- rośnie ku niej. Gdy sufit < podłogi, firma zmniejsza plan
 * zatrudnienia (`affordableEmployees`), a nie łamie podłogi.
 */
export const WAGE_SAFETY_BUFFER = 0.1; // TODO tuning
export interface WageBounds {
  readonly floor: number;
  readonly ceiling: number | undefined;
}
export interface WagePlan {
  readonly plannedEmployees: number;
  readonly expectedRevenue: number;
  readonly inputCosts: number;
}
export function wageBudget(plan: WagePlan): number {
  return Math.max(
    0,
    plan.expectedRevenue - plan.inputCosts - WAGE_SAFETY_BUFFER * plan.expectedRevenue,
  );
}
export function planWageBounds(
  plan: WagePlan | undefined,
  survivalBasketCost: number,
): WageBounds {
  return {
    floor: Math.max(MIN_WAGE, assertNonNegative(survivalBasketCost, "planWageBounds().survivalBasketCost")),
    ceiling:
      plan && plan.plannedEmployees > 0 ? wageBudget(plan) / plan.plannedEmployees : undefined,
  };
}
/** Ilu pracowników budżet płac planu utrzyma przy danej płacy (całe osoby). */
export function affordableEmployees(plan: WagePlan, wage: number): number {
  return wage > 0 ? Math.floor(wageBudget(plan) / wage + 1e-9) : plan.plannedEmployees;
}

export interface AdjustWageOfferInput {
  readonly company: Company;
  /** N4: granice oferty (podłoga = koszyk przetrwania, sufit = budżet płac planu). */
  readonly bounds?: WageBounds;
  /** Unemployed, labor-force-eligible workers of this company's demanded skill(s), observed by the caller (e.g. summed `availableWorkers` across matching cohorts) -- Company never owns this, same "observed not owned" rule Market applies to Inventory. */
  readonly availableLabor: number;
}

export interface AdjustWageOfferResult {
  readonly company: Company;
  /** In [0, 1] -- 0 whenever available labor already covers vacancies. */
  readonly laborShortageSeverity: number;
  readonly facts: readonly FactInput<number>[];
  /** M17 (CE-04): `targetIndex`/`sameBatch.index` względne do WŁASNEJ tablicy `facts` -- patrz `offsetCausalLinks`. */
  readonly causalLinks: readonly PendingCausalLink[];
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

  let rawWageOffer = wageOffer * (1 + wagePressure);
  if (input.bounds) {
    const maxStep = MAX_TICK_WAGE_CHANGE * WAGE_SMOOTHING_FACTOR;
    const { floor, ceiling } = input.bounds;
    if (ceiling !== undefined && rawWageOffer > ceiling)
      rawWageOffer = Math.max(ceiling, wageOffer * (1 - maxStep));
    if (rawWageOffer < floor) rawWageOffer = Math.min(floor, wageOffer * (1 + maxStep));
  }
  // P12b (2026-10-01): stawka z precyzją 6 miejsc (`roundWageRate`), nie do
  // grosza -- inaczej przy płacy ≤ 0,16 cały miesięczny ruch (≤ 3%) był
  // kasowany przez zaokrąglenie. Limit zmiany, wygładzanie, podłoga i sufit
  // bez zmian; wypłata w groszach dopiero przy rozliczeniu (`transactionValue`).
  const nextWageOffer = roundWageRate(Math.max(MIN_WAGE, rawWageOffer));

  const nextCompany: Company = {
    ...company,
    workforce: { ...company.workforce, wageOffer: nextWageOffer },
  };

  const facts: FactInput<number>[] = [];
  const causalLinks: PendingCausalLink[] = [];
  if (nextWageOffer !== wageOffer) {
    facts.push({
      type: "wage_offer_changed",
      subject: { entityType: "company", entityId: company.id },
      location: { regionId: company.regionId },
      values: {
        before: wageOffer,
        after: nextWageOffer,
        delta: roundWageRate(nextWageOffer - wageOffer),
      },
    });
    // CE-04 (M17): ten sam demand/supply rozkład co `price-adjustment.ts`
    // -- wakaty (demand) i dostępna praca (supply) -- płaca reaguje na
    // ten sam mechanizm niedoboru/nadwyżki (`classifyShortageSurplus`,
    // reużyte z M8), więc te dwa czynniki są dokładnym labor-market
    // odpowiednikiem demand/supply przy cenach dóbr.
    const targetIndex = facts.length - 1;
    const vacancyContribution = clamp((vacancies - reference) / reference, -1, 1);
    causalLinks.push({
      targetIndex,
      source: { kind: "external", key: `company:${company.id}:vacancies` },
      type: directionalEdgeType(vacancyContribution),
      factor: { key: "vacancies", contribution: vacancyContribution },
      mechanism: "wakaty względem dostępnej siły roboczej tego poziomu umiejętności",
      system: "wages",
    });
    const availableLaborContribution = clamp(
      -(availableLabor - reference) / reference,
      -1,
      1,
    );
    causalLinks.push({
      targetIndex,
      source: { kind: "external", key: `company:${company.id}:available_labor` },
      type: directionalEdgeType(availableLaborContribution),
      factor: { key: "available_labor", contribution: availableLaborContribution },
      mechanism: "dostępna, bezrobotna siła robocza względem wakatów",
      system: "wages",
    });
  }

  return { company: nextCompany, laborShortageSeverity, facts, causalLinks };
}
