import type { CohortNeeds, PopulationCohort } from "@first-cause/entities";
import type { FactInput, FactLocation } from "@first-cause/causality";
import { assertNonNegative } from "../../core/validation.js";
import type { NeedSpendingCategory, SpendingCategory } from "./consumption.js";

/**
 * Needs satisfaction (ECO-013, Entity Data Model SS11 `CohortNeeds`;
 * "pełna, nie skeleton z M6" per the roadmap -- M6 only carried the
 * struct's shape, M9 is the first milestone to actually compute it).
 *
 * Each need tier's satisfaction is how much of its full cost
 * (`consumption.ts`'s `categoryCost`, computed by the caller from real
 * goods/Market prices) actually got funded this tick
 * (`allocateSpending`'s `spent`). A tier with `categoryCost === 0` (no
 * goods are tagged for it yet -- true for every tier except `survival`
 * in the current VS content, and structurally true for `modern`/`luxury`
 * for most of the Vertical Slice per VS Spec SS22 "Modern... pozostanie
 * nieaktywne") reads as fully satisfied (1) rather than a deficiency --
 * an inactive tier is not the same thing as an unmet one.
 *
 * `CohortNeeds.modern` reads the `luxury` spending category -- see
 * `consumption.ts`'s doc comment for why the two names are the same
 * tier under ECO-013/ECO-014's slightly different vocabularies.
 */
function tierRatio(
  category: NeedSpendingCategory,
  spent: Readonly<Record<SpendingCategory, number>>,
  categoryCost: Readonly<Record<NeedSpendingCategory, number>>,
): number {
  const cost = assertNonNegative(
    categoryCost[category],
    `tierRatio().categoryCost.${category}`,
  );
  if (cost === 0) return 1;
  return Math.min(
    1,
    assertNonNegative(spent[category], `tierRatio().spent.${category}`) / cost,
  );
}

export function computeNeedsSatisfaction(
  spent: Readonly<Record<SpendingCategory, number>>,
  categoryCost: Readonly<Record<NeedSpendingCategory, number>>,
): CohortNeeds {
  const survival = tierRatio("survival", spent, categoryCost);
  const basic = tierRatio("basic", spent, categoryCost);
  const services = tierRatio("services", spent, categoryCost);
  const comfort = tierRatio("comfort", spent, categoryCost);
  const prosperity = tierRatio("prosperity", spent, categoryCost);
  const modern = tierRatio("luxury", spent, categoryCost);

  // Prosta średnia: dowolna rozsądna, monotoniczna agregacja spełnia
  // Acceptance Gate ("kohorta z pracą ma wyższą satysfakcję niż bez
  // pracy") -- ważenie priorytetu (np. Survival liczy się bardziej niż
  // Modern) to otwarty temat tuningu, nie mechanika do wymyślenia teraz.
  const totalSatisfaction =
    (survival + basic + services + comfort + prosperity + modern) / 6;

  return { survival, basic, services, comfort, prosperity, modern, totalSatisfaction };
}

function cohortLocation(cohort: PopulationCohort): FactLocation {
  return cohort.settlementId === undefined
    ? { regionId: cohort.regionId }
    : { regionId: cohort.regionId, settlementId: cohort.settlementId };
}

export interface ApplyNeedsSatisfactionInput {
  readonly cohort: PopulationCohort;
  readonly spent: Readonly<Record<SpendingCategory, number>>;
  readonly categoryCost: Readonly<Record<NeedSpendingCategory, number>>;
}

export interface ApplyNeedsSatisfactionResult {
  readonly cohort: PopulationCohort;
  readonly facts: readonly FactInput<number>[];
}

export function applyNeedsSatisfaction(
  input: ApplyNeedsSatisfactionInput,
): ApplyNeedsSatisfactionResult {
  const { cohort } = input;
  const needs = computeNeedsSatisfaction(input.spent, input.categoryCost);
  const nextCohort: PopulationCohort = { ...cohort, needs };

  const facts: FactInput<number>[] = [];
  if (needs.totalSatisfaction !== cohort.needs.totalSatisfaction) {
    facts.push({
      type: "needs_satisfaction_changed",
      subject: { entityType: "populationCohort", entityId: cohort.id },
      location: cohortLocation(cohort),
      values: {
        before: cohort.needs.totalSatisfaction,
        after: needs.totalSatisfaction,
        delta: needs.totalSatisfaction - cohort.needs.totalSatisfaction,
      },
    });
  }

  return { cohort: nextCohort, facts };
}
