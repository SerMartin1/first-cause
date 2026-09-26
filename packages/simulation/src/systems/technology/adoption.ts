import type { TechnologyState } from "@first-cause/entities";
import { setDiscoveryState } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { clamp } from "../economy/company-ai/decision-framework.js";

/**
 * Industry/Population/Institutional Adoption (`technology/adoption`, M15,
 * TECH-006). Industry to jedyna oś naprawdę podłączona do istniejącego
 * systemu decyzyjnego: AI-08 (`pm-adoption.ts`, M11) już decyduje, czy
 * firma zmienia production method; ten moduł tylko (a) gate'uje, które
 * kandydatury AI-08 w ogóle widzi (`isProductionMethodAvailable`,
 * wołane z `economy-tick.ts` przed `evaluatePmAdoptionSafely`) i (b)
 * zapisuje wynik, gdy AI-08 faktycznie przełączyło firmę
 * (`applyIndustryAdoption`, wołane po). Nigdy nie reimplementuje
 * własnego scoringu AI-08 (AI Decision Model §38) -- SS39 "Technologia
 * może być nieopłacalna" wynika już z tego, że AI-08 samo odrzuca
 * nieopłacalnego kandydata, zanim ten moduł go w ogóle zobaczy.
 *
 * `institutionalAdoption` zostaje przy 0 -- zależy od systemu
 * Administration, który nie istnieje (TECH-005: Administration to
 * institutional capacity, nie Knowledge Domain; kategoria "hook" z §2.3
 * katalogu). Nie zaimplementowane tutaj; też nie wymyślone (AGENTS.md
 * "flag it instead of guessing").
 */
export const INDUSTRY_ADOPTION_STEP_TODO_TUNING = 0.1;
export const ADOPTION_THRESHOLD_TODO_TUNING = 0.5; // przekroczenie industryAdoption -> status ADOPTED
export const POPULATION_ACCESS_RATE_TODO_TUNING = 0.02;
/**
 * Progi `populationAccess`, których przekroczenie jest zdarzeniem
 * (Causality §7; decyzja właściciela 2026-09-26: „większość populacji”
 * i „pełny dostęp”). TODO tuning.
 */
export const POPULATION_ACCESS_MILESTONES_TODO_TUNING: readonly number[] = [0.5, 1];

/**
 * Czysty gate: czy każde odkrycie, którego wymaga `productionMethodId`
 * (`requiredDiscoveryIds`, z `ProductionMethodDefinition.discoveries`,
 * M2), jest w tym regionie co najmniej `AVAILABLE`? Pusta lista jest
 * zawsze eligible -- wstecznie zgodne z każdą production method, która
 * nie deklaruje żadnych odkryć (dziś wszystkie).
 */
export function isProductionMethodAvailable(
  requiredDiscoveryIds: readonly string[],
  technologyState: TechnologyState,
): boolean {
  return requiredDiscoveryIds.every((discoveryId) => {
    const status = technologyState.discoveries[discoveryId]?.status;
    return status === "AVAILABLE" || status === "ADOPTED";
  });
}

export interface IndustryAdoptionEvent {
  readonly discoveryId: string;
}

export interface ApplyIndustryAdoptionResult {
  readonly technologyState: TechnologyState;
  readonly facts: readonly FactInput<number>[];
}

/**
 * `events`: jeden na odkrycie, którego zagate'owaną production method
 * AI-08 faktycznie przyjęło w tym ticku (budowane w `economy-tick.ts`
 * z udanych wyników `evaluatePmAdoptionSafely`, przez
 * `requiredDiscoveryIdsByMethodId`). Każde zdarzenie podbija
 * `industryAdoption` o stały krok (w stylu EMA, bez decay przy odrzuceniu
 * -- prawdziwy mechanizm decay/wygasania to przyszły tuning, nie
 * wymyślony tutaj); przekroczenie `ADOPTION_THRESHOLD_TODO_TUNING`
 * ustawia ogólny `status` odkrycia na `ADOPTED`.
 */
export function applyIndustryAdoption(
  technologyState: TechnologyState,
  events: readonly IndustryAdoptionEvent[],
): ApplyIndustryAdoptionResult {
  let state = technologyState;
  const facts: FactInput<number>[] = [];

  for (const event of events) {
    const entry = state.discoveries[event.discoveryId];
    const before = entry?.industryAdoption ?? 0;
    const after = clamp(before + INDUSTRY_ADOPTION_STEP_TODO_TUNING, 0, 1);
    if (after === before) continue;

    const crossesThreshold = after >= ADOPTION_THRESHOLD_TODO_TUNING;
    state = setDiscoveryState(state, event.discoveryId, {
      industryAdoption: after,
      status: crossesThreshold ? "ADOPTED" : (entry?.status ?? "UNKNOWN"),
    });
    facts.push({
      type: "technology_adoption_increased",
      subject: { entityType: "discovery", entityId: event.discoveryId },
      location: { regionId: state.regionId },
      values: { before, after, delta: after - before },
    });
  }

  return { technologyState: state, facts };
}

export interface ApplyPopulationAccessResult {
  readonly technologyState: TechnologyState;
  readonly facts: readonly FactInput<number>[];
}

/**
 * Prosty proxy (dziś nie istnieje lepszy sygnał populacyjny per
 * odkrycie w contencie): `populationAccess` każdego odkrycia
 * `AVAILABLE`/`ADOPTED` rośnie o stałą stawkę na tick, clamp do `[0, 1]`.
 * Fakt `technology_population_access_reached` powstaje tylko przy
 * przekroczeniu progu z `POPULATION_ACCESS_MILESTONES_TODO_TUNING` -- osobny
 * typ niż `technology_adoption_increased` (adopcja przemysłowa), bo to dwie
 * różne osie TECH-006.
 */
export function applyPopulationAccess(
  technologyState: TechnologyState,
): ApplyPopulationAccessResult {
  let state = technologyState;
  const facts: FactInput<number>[] = [];

  for (const discoveryId of Object.keys(state.discoveries).sort()) {
    const entry = state.discoveries[discoveryId]!;
    if (entry.status !== "AVAILABLE" && entry.status !== "ADOPTED") continue;

    const before = entry.populationAccess;
    const after = clamp(before + POPULATION_ACCESS_RATE_TODO_TUNING, 0, 1);
    if (after === before) continue;

    state = setDiscoveryState(state, discoveryId, { populationAccess: after });
    const milestone = POPULATION_ACCESS_MILESTONES_TODO_TUNING.find(
      (threshold) => before < threshold && after >= threshold,
    );
    if (milestone === undefined) continue;
    facts.push({
      type: "technology_population_access_reached",
      subject: { entityType: "discovery", entityId: discoveryId },
      location: { regionId: state.regionId },
      values: { before, after: milestone, delta: milestone - before },
    });
  }

  return { technologyState: state, facts };
}
