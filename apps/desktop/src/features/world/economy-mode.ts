import type { WorldRegionView } from "@first-cause/simulation";

/**
 * M21-VIS-R4B Economy (Canonical Decisions §52C): tryb pokazuje JEDNĄ miarę
 * o wspólnej jednostce -- zatrudnionych w przedsiębiorstwach regionu (osoby,
 * stan na koniec ostatniego ticka). Sprzedaż firm jest informacją dodatkową
 * inspektora, nie kodowaniem mapy. Kodowanie = Visual Alphabet v1.1 §8
 * „Economic Output”: kwadrat rosnący i nasycający się klasami. Klasy są
 * STAŁE i absolutne -- region pierwszy w rankingu nie dostaje „pełnego”
 * koloru tylko dlatego, że jest pierwszy.
 */
export type EconomyFact =
  | { readonly kind: "known"; readonly value: number }
  | {
      readonly kind: "unavailable";
      readonly reason: "NO_COMPLETED_PERIOD" | "OUTSIDE_MARKET_MODEL" | "MISSING";
    };

/**
 * Zatrudnienie regionu. Symulacja zawsze je zna (region bez firm = 0), więc
 * „brak danych” to kontrakt prezentacji dla Read Modelu bez wartości
 * (np. fixture), jak w Population -- nigdy „NaN” ani „0”.
 */
export function regionEmploymentFact(r: WorldRegionView): EconomyFact {
  const employment = (r.economy as WorldRegionView["economy"] | undefined)?.employment;
  return typeof employment === "number" && Number.isFinite(employment) && employment >= 0
    ? { kind: "known", value: employment }
    : { kind: "unavailable", reason: "MISSING" };
}

/** Sprzedaż firm w ostatnim zakończonym miesiącu (informacja dodatkowa inspektora). */
export function regionSalesFact(r: WorldRegionView): EconomyFact {
  const sales = (r.economy as WorldRegionView["economy"] | undefined)?.sales;
  if (!sales) return { kind: "unavailable", reason: "MISSING" };
  return sales.status === "RECORDED" && Number.isFinite(sales.value)
    ? { kind: "known", value: sales.value }
    : { kind: "unavailable", reason: sales.status === "NO_DATA" ? sales.reason : "MISSING" };
}

/** TODO tuning: dolne granice klas 2..5 (klasa 1 = (0, 10)); decyzja D4 (§52C). */
export const ECONOMY_CLASS_BOUNDS = [10, 100, 1_000, 10_000] as const;
export type EconomyClass = 0 | 1 | 2 | 3 | 4 | 5;
export function economyClass(value: number): EconomyClass {
  if (!(value > 0)) return 0;
  let cls = 1;
  for (const bound of ECONOMY_CLASS_BOUNDS) if (value >= bound) cls++;
  return cls as EconomyClass;
}
/**
 * TODO tuning: bok kwadratu (px ekranu, stały przy zoomie -- klasa to fakt,
 * nie detal) i krycie wypełnienia `--fc-info` per klasa. Indeks 0 = znacznik
 * „0” / „brak danych” (sam kontur).
 */
export const ECONOMY_SQUARE = {
  side: [9, 8, 10, 12, 14, 16],
  alpha: [0, 0.3, 0.45, 0.62, 0.8, 1],
  stroke: 1.3,
} as const;

/**
 * Etykiety klas legendy (od najniższej), rozłączne dla danych ciągłych --
 * dokładnie zakresy `economyClass`: „>0–<10”, „10–<100”, „100–<1000”,
 * „1000–<10 000”, „≥10 000” (z notacją zwartą: „1 tys.–<10 tys.”, „≥10 tys.”).
 * „>0” odróżnia pierwszą dodatnią klasę od osobno pokazanego zera.
 */
export function economyClassLabels(locale: string): string[] {
  const f = (n: number) =>
    new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 0 }).format(
      n,
    );
  const b = ECONOMY_CLASS_BOUNDS;
  return [
    `>${f(0)}–<${f(b[0])}`,
    `${f(b[0])}–<${f(b[1])}`,
    `${f(b[1])}–<${f(b[2])}`,
    `${f(b[2])}–<${f(b[3])}`,
    `≥${f(b[3])}`,
  ];
}

/** Ułamek osoby > 0 (zatrudnienie jest ciągłe) nigdy nie staje się „0”. */
function belowOne(value: number, locale: string): string | undefined {
  return value > 0 && value < 1 ? `<${(1).toLocaleString(locale)}` : undefined;
}

/**
 * Zaokrąglenie W DÓŁ (obcięcie) przy wyświetlaniu: liczba na ekranie nigdy
 * nie przeskakuje do wyższej klasy niż ta, którą `economyClass` policzyło z
 * surowej wartości (99,5 os. to „99,5”, nie „100” przy klasie „10–<100”).
 * `roundingMode` (ES2023 Intl) jest w Chromium/Electron i Node 22; typy
 * projektu (lib ES2022) go jeszcze nie znają.
 */
function employmentFormat(
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const withTrunc = { ...options, roundingMode: "trunc" } as Intl.NumberFormatOptions;
  return new Intl.NumberFormat(locale, withTrunc);
}

/** Zwarta liczba zatrudnionych przy regionie. */
export function formatEmploymentCompact(value: number, locale: string): string {
  return (
    belowOne(value, locale) ??
    employmentFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value)
  );
}

/** Pełna liczba zatrudnionych (inspektor, Top Regions, World Pulse); do 1 miejsca po przecinku. */
export function formatEmploymentFull(value: number, locale: string): string {
  return (
    belowOne(value, locale) ??
    employmentFormat(locale, { maximumFractionDigits: 1 }).format(value)
  );
}

/** Pieniądz: 2 miejsca (MONEY_SCALE 100, ADR-001 §4). */
export function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Suma zatrudnienia świata (World Pulse) z jawnym pokryciem danych:
 * - `complete` -- wszystkie regiony znane (znane 0 = prawdziwe zero);
 * - `partial` -- suma TYLKO znanych regionów, z liczbą regionów znanych/wszystkich;
 * - `unavailable` -- żaden region nie ma danych (UI: „—”, nigdy 0).
 */
export type WorldEmploymentFact =
  | {
      readonly kind: "complete" | "partial";
      readonly value: number;
      readonly knownRegionIds: readonly string[];
      readonly totalRegions: number;
    }
  | { readonly kind: "unavailable"; readonly totalRegions: number };

export function worldEmployment(regions: readonly WorldRegionView[]): WorldEmploymentFact {
  let value = 0;
  const knownRegionIds: string[] = [];
  for (const r of regions) {
    const fact = regionEmploymentFact(r);
    if (fact.kind !== "known") continue;
    value += fact.value;
    knownRegionIds.push(r.regionId);
  }
  knownRegionIds.sort();
  if (knownRegionIds.length === 0) return { kind: "unavailable", totalRegions: regions.length };
  return {
    kind: knownRegionIds.length === regions.length ? "complete" : "partial",
    value,
    knownRegionIds,
    totalRegions: regions.length,
  };
}

/**
 * Δ World Pulse dla zatrudnienia. Porównuje WYŁĄCZNIE dwie kompletne sumy o
 * tym samym zbiorze regionów -- suma częściowa albo inne pokrycie dałyby
 * zmianę, która jest artefaktem braków danych, a nie zmianą świata.
 */
export type EmploymentDelta =
  | { readonly kind: "known"; readonly value: number }
  | {
      readonly kind: "unavailable";
      readonly reason: "NO_HISTORY" | "INCOMPLETE_DATA" | "COVERAGE_CHANGED";
    };

export function worldEmploymentDelta(
  current: WorldEmploymentFact,
  baseline: WorldEmploymentFact | undefined,
): EmploymentDelta {
  if (!baseline) return { kind: "unavailable", reason: "NO_HISTORY" };
  if (current.kind !== "complete" || baseline.kind !== "complete")
    return { kind: "unavailable", reason: "INCOMPLETE_DATA" };
  const same =
    current.knownRegionIds.length === baseline.knownRegionIds.length &&
    current.knownRegionIds.every((id, k) => id === baseline.knownRegionIds[k]);
  if (!same) return { kind: "unavailable", reason: "COVERAGE_CHANGED" };
  return { kind: "known", value: current.value - baseline.value };
}
