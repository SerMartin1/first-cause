import type { Company, PopulationCohort } from "@first-cause/entities";
import { roundMoney } from "../../core/rounding.js";
import { cohortIdentityKey } from "../population/cohorts.js";

/**
 * Minimalny dochód właścicielski (decyzja właściciela 2026-10-01, Canonical
 * §52H): raz na miesięczny tick, po rozliczeniu wszystkich sprzedaży i
 * kosztów, firma wypłaca właścicielowi
 *
 *   wypłata = min(max(0, wynik zatrzymany), max(0, gotówka − bufor operacyjny))
 *
 * Bufor = `OWNER_PAYOUT_BUFFER_MONTHS` × większa z wartości: średnie koszty
 * operacyjne z ostatnich ≤ 3 ticków albo zobowiązania najbliższego ticka z
 * bieżącego planu. Wypłata nie jest kosztem operacyjnym i nie zmienia wyniku
 * produkcji -- zmniejsza gotówkę i wynik zatrzymany firmy, zwiększa środki
 * właściciela o tę samą kwotę (co do grosza).
 */
export const OWNER_PAYOUT_BUFFER_MONTHS = 2; // TODO tuning -- parametr wymaga walidacji (decyzja właściciela: początkowo 2 miesiące)
export const OPERATING_COST_HISTORY_MONTHS = 3; // okno średnich kosztów operacyjnych bufora

/** Dopisuje koszty operacyjne tego ticka i zostawia ostatnie `OPERATING_COST_HISTORY_MONTHS`. */
export function recordOperatingCosts(history: readonly number[], costs: number): number[] {
  return [...history, roundMoney(costs)].slice(-OPERATING_COST_HISTORY_MONTHS);
}

/** Bufor operacyjny; przy krótszej historii -- dostępne obserwacje, bez historii -- tylko zobowiązania. */
export function operatingBuffer(history: readonly number[], nextTickObligations: number): number {
  const average =
    history.length > 0 ? history.reduce((sum, cost) => sum + cost, 0) / history.length : 0;
  return roundMoney(OWNER_PAYOUT_BUFFER_MONTHS * Math.max(average, nextTickObligations, 0));
}

/**
 * Nadwyżka kwalifikująca się do wypłaty (co do grosza, nigdy ujemna):
 * `min(wynik zatrzymany, gotówka − bufor − rezerwa inwestycyjna)`. Rezerwa
 * (etap 4B) jest wydzieloną gotówką -- nie może być jednocześnie wypłacona.
 */
export function ownerPayoutAmount(company: Company, buffer: number): number {
  const { cash, retainedEarnings } = company.finance;
  const reserve = company.finance.investmentReserve ?? 0;
  const amount = Math.min(
    Math.max(0, retainedEarnings),
    Math.max(0, cash - buffer - reserve),
  );
  return amount > 0 ? roundMoney(amount) : 0;
}

/**
 * P13 (etap 4B, decyzja właściciela 2026-10-01): udział nadwyżki
 * kwalifikującej się do wypłaty, który przy aktywnym planie rozbudowy trafia
 * do rezerwy inwestycyjnej. Parametr wymaga strojenia.
 */
export const INVESTMENT_RESERVE_SHARE = 0.5; // TODO tuning -- decyzja właściciela: początkowo 50%

export interface PayoutSplit {
  /** Kwota wypłacana właścicielowi. */
  readonly payout: number;
  /** Kwota dokładana do rezerwy (gotówka zostaje w firmie). */
  readonly toReserve: number;
}

/**
 * Podział nadwyżki: bez aktywnego planu -- cała do właściciela (§52H); z
 * planem -- `INVESTMENT_RESERVE_SHARE` do rezerwy, ale rezerwa nie przekracza
 * kosztu jednej zaplanowanej rozbudowy; reszta do właściciela.
 */
export function splitSurplus(
  eligible: number,
  currentReserve: number,
  planCost: number | undefined,
): PayoutSplit {
  if (!(eligible > 0)) return { payout: 0, toReserve: 0 };
  if (planCost === undefined) return { payout: roundMoney(eligible), toReserve: 0 };
  const room = Math.max(0, roundMoney(planCost - currentReserve));
  const toReserve = Math.min(roundMoney(eligible * INVESTMENT_RESERVE_SHARE), room);
  return { payout: roundMoney(eligible - toReserve), toReserve };
}

/**
 * Likwidacja zamkniętej firmy (etap 4B): cała wolna gotówka wraca do
 * właściciela -- najpierw jako niewypłacony zysk (do wysokości dodatniego
 * wyniku zatrzymanego), reszta jako zwrot kapitału (nie zysk, nie przychód).
 * Ujemna gotówka (zobowiązanie) -- nic do zwrotu; późniejsze wpływy z komisu
 * najpierw ją pokrywają (rozliczenie finansów).
 */
export function liquidationSplit(company: Company): {
  readonly profit: number;
  readonly capital: number;
} {
  const cash = company.finance.cash;
  if (!(cash > 0)) return { profit: 0, capital: 0 };
  const profit = roundMoney(Math.min(Math.max(0, company.finance.retainedEarnings), cash));
  return { profit, capital: roundMoney(cash - profit) };
}

export type OwnerPayoutRecipient =
  | { readonly kind: "cohort"; readonly id: string }
  | { readonly kind: "company"; readonly id: string };

/**
 * Odbiorca wypłaty według rzeczywistego `ownerType`/`ownerEntityId`:
 * - `individual` = kohorta (grupa mieszkańców): pieniądze trafiają do jej
 *   gospodarstwa. Kohorta właściciela z ludnością > 0 dostaje je sama (i tak
 *   dzieli budżet z rodziną przy zakupach); gdy jej ludność spadła do 0
 *   (zgony, starzenie, wyjazd), właścicielem pozostaje gospodarstwo --
 *   najliczniejsza żyjąca kohorta tej samej rodziny (ta sama tożsamość, ten
 *   sam region; remis: id). Migranci nie zabierają udziału we własności --
 *   zostaje przy kohorcie źródłowej. Rodzina bez ludzi -- brak odbiorcy.
 * - `company` = istniejąca inna firma.
 * - `state` -- model nie ma skarbu państwa: brak odbiorcy.
 * Brak odbiorcy = brak wypłaty (wynik zostaje w firmie jako niewypłacony).
 */
export function resolveOwnerRecipient(
  company: Company,
  cohorts: Readonly<Record<string, PopulationCohort>>,
  companies: Readonly<Record<string, Company>>,
): OwnerPayoutRecipient | undefined {
  if (company.ownerType === "company") {
    const owner = companies[company.ownerEntityId];
    return owner && owner.id !== company.id ? { kind: "company", id: owner.id } : undefined;
  }
  if (company.ownerType !== "individual") return undefined;
  const owner = cohorts[company.ownerEntityId];
  if (!owner) return undefined;
  if (owner.population > 0) return { kind: "cohort", id: owner.id };
  const key = cohortIdentityKey(owner);
  const household = Object.values(cohorts)
    .filter((c) => c.population > 0 && cohortIdentityKey(c) === key)
    .sort((a, b) => b.population - a.population || a.id.localeCompare(b.id))[0];
  return household ? { kind: "cohort", id: household.id } : undefined;
}
