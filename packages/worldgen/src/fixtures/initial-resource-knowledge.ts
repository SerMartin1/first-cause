import { isDepositKnownToWorld, type WorldState } from "@first-cause/entities";

/** Minimalny kształt receptury potrzebny walidacji (strukturalnie zgodny z `ProductionRecipe`). */
export interface RecipeResourceInputs {
  readonly resourceInputsPerBatch: Readonly<Record<string, number>>;
}

/**
 * D1 -- spójny stan początkowy (World Generation Spec §22, Canonical
 * Decisions TECH-010): jeżeli firma istniejąca na starcie używa metody
 * produkcji wymagającej zasobu, świat musi już znać (DISCOVERED/ASSESSED)
 * co najmniej jedno złoże tego zasobu w regionie firmy. Niespójny stan jest
 * ODRZUCANY -- nigdy cicho naprawiany w runtime ani przez „odkrycie przez
 * eksploatację” (wariant C odrzucony przez właściciela).
 *
 * Generyczne: nie zna żadnego konkretnego scenariusza ani zasobu
 * (AGENTS.md reguła 8). Zwraca listę błędów w stabilnej kolejności.
 */
export function validateInitialResourceKnowledge(
  state: WorldState,
  recipesByMethodId: Readonly<Record<string, RecipeResourceInputs>>,
): readonly string[] {
  const errors: string[] = [];
  for (const companyId of Object.keys(state.companies).sort()) {
    const company = state.companies[companyId]!;
    if (!company.status.active) continue;
    const methodId = company.production.productionMethodId;
    const recipe = methodId ? recipesByMethodId[methodId] : undefined;
    if (!recipe) continue;
    const region = state.regions[company.regionId];
    const deposits = (region?.resources.depositIds ?? [])
      .map((id) => state.resourceDeposits[id])
      .filter((deposit) => deposit !== undefined);
    for (const resourceId of Object.keys(recipe.resourceInputsPerBatch).sort()) {
      if ((recipe.resourceInputsPerBatch[resourceId] ?? 0) <= 0) continue;
      const matching = deposits.filter((d) => d.resourceDefinitionId === resourceId);
      if (matching.length === 0) {
        errors.push(
          `Company "${companyId}" uses production method "${methodId}" requiring resource "${resourceId}", but region "${company.regionId}" has no deposit of it (World Generation Spec §22)`,
        );
      } else if (!matching.some(isDepositKnownToWorld)) {
        errors.push(
          `Company "${companyId}" uses production method "${methodId}" requiring resource "${resourceId}", but no deposit of it in region "${company.regionId}" is known to the world (DISCOVERED/ASSESSED required, World Generation Spec §22, TECH-010)`,
        );
      }
    }
  }
  return errors;
}
