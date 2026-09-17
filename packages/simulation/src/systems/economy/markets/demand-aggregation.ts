import { assertNonNegative } from "../../../core/validation.js";

/**
 * Demand aggregation (Vertical Slice Spec SS17 "Rynek"; Production-Economy-
 * Master SS5 "źródła popytu": gospodarstwa domowe, zużycie pośrednie firm,
 * inwestycje, infrastruktura, państwo, usługi, eksport). M8 has exactly one
 * real, wired demand source -- `production.ts` (M7) `goodInputsPerBatch`,
 * i.e. companies consuming intermediate goods -- household demand (M9),
 * export demand (M10) and the rest do not exist yet. This function stays
 * source-agnostic on purpose: it sums whatever named sources a caller
 * passes in, so M9/M10/M11 plug in a new source key each without touching
 * this module again, the same way `ProductionRecipe` (M7) stayed shaped so
 * later milestones only add recipes, not rewrite `runProduction`.
 *
 * Nie generuje popytu sztucznie (Production-Economy-Master SS5: "Popyt nie
 * może być sztucznie generowany tylko po to, aby producent miał odbiorcę")
 * -- to czysta suma tego, co wywołujący faktycznie zaobserwował.
 */
export function aggregateDemand(sources: Readonly<Record<string, number>>): number {
  let total = 0;
  for (const [sourceId, quantity] of Object.entries(sources)) {
    total += assertNonNegative(quantity, `aggregateDemand().sources.${sourceId}`);
  }
  return total;
}
