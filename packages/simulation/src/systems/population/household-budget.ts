/**
 * Etap 2 naprawy gospodarki (N7, decyzja właściciela 2026-10-01): budżet
 * gospodarstw w pieniądzu, który faktycznie krąży.
 *
 * - Koszyk przetrwania: `SURVIVAL_UNITS_PER_CAPITA` jednostek
 *   `SURVIVAL_GOOD_ID` na osobę na miesiąc (dotąd stałe w `economy-tick.ts`).
 * - Oszczędności startowe nowego świata (i zapisów sprzed schematu 5):
 *   `INITIAL_HOUSEHOLD_SAVINGS_MONTHS` miesięcy koszyka po lokalnej cenie --
 *   jawna konfiguracja, nieodnawiana co miesiąc.
 * - `splitMoney`: podział kwoty co do grosza (MONEY_SCALE 100, ADR-001 §4)
 *   bez tworzenia i gubienia pieniędzy -- reszta groszy trafia do udziału
 *   o największej wadze (remis: kolejność id).
 */
export const SURVIVAL_GOOD_ID = "flour"; // TODO content -- Etap 1 hardcoded most kategoria->dobro (pełne mapowanie z contentu to osobna praca)
export const SURVIVAL_UNITS_PER_CAPITA = 3; // TODO tuning -- jednostki dobra "survival" na osobę na miesiąc
export const INITIAL_HOUSEHOLD_SAVINGS_MONTHS = 3; // TODO tuning -- decyzja właściciela N7

/** Koszt koszyka przetrwania jednej osoby na miesiąc przy danej cenie. */
export function survivalBasketCost(price: number): number {
  return SURVIVAL_UNITS_PER_CAPITA * price;
}

/** Oszczędności startowe kohorty: `INITIAL_HOUSEHOLD_SAVINGS_MONTHS` miesięcy koszyka (zaokrąglone do grosza). */
export function initialHouseholdSavings(population: number, survivalPrice: number): number {
  if (!(population > 0) || !(survivalPrice > 0)) return 0;
  return (
    Math.round(
      population * survivalBasketCost(survivalPrice) * INITIAL_HOUSEHOLD_SAVINGS_MONTHS * 100,
    ) / 100
  );
}

/**
 * Dzieli `total` (jednostki pieniężne) według wag co do grosza. Suma wyniku =
 * `total` zaokrąglone do grosza. Wszystkie wagi 0 → całość do pierwszego id.
 */
export function splitMoney(
  total: number,
  weights: readonly (readonly [string, number])[],
): Record<string, number> {
  const result: Record<string, number> = {};
  if (weights.length === 0) return result;
  const cents = Math.round(total * 100);
  const sorted = [...weights].sort(([a], [b]) => a.localeCompare(b));
  const weightSum = sorted.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
  if (weightSum <= 0) {
    for (const [id] of sorted) result[id] = 0;
    result[sorted[0]![0]] = cents / 100;
    return result;
  }
  let allocated = 0;
  for (const [id, w] of sorted) {
    const share = Math.floor((cents * Math.max(0, w)) / weightSum);
    result[id] = share;
    allocated += share;
  }
  const largest = sorted.reduce((best, item) => (item[1] > best[1] ? item : best));
  result[largest[0]] = result[largest[0]]! + (cents - allocated);
  for (const id of Object.keys(result)) result[id] = result[id]! / 100;
  return result;
}
