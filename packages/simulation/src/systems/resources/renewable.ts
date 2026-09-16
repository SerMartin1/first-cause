import type { ResourceDeposit } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";

/**
 * Renewable regeneration (World Generation Spec SS14, roadmap M5
 * module list: "renewable (sustainableYield, regeneration,
 * carryingCapacity)").
 *
 * Growth model: logistic growth toward `carryingCapacity` --
 * `growth = regenerationRate * quantity * (1 - quantity / carryingCapacity)`.
 * This is the standard sustainable-yield model (the same shape used for
 * fisheries/renewable-resource economics that the `sustainableYield`
 * field name itself references), not an invented formula: at
 * equilibrium it reproduces exactly the "stabilizes around sustainable
 * yield under constant demand" behaviour the M5 Acceptance Gate
 * requires, and it needs only the three fields the spec already names.
 *
 * A no-op for a non-renewable deposit (or one without `renewableState`)
 * -- safe to call uniformly across every deposit without checking
 * `renewable` first. Regeneration is a state update, not a Fact (SS5
 * "Fakty vs stany": no fact type for it exists in the CE-01 vocabulary
 * -- it is not itself a notable event the way discovery/extraction/
 * depletion are).
 */
export interface RegenerateDepositResult {
  readonly deposit: ResourceDeposit;
  readonly facts: readonly FactInput<number>[];
}

export function regenerateDeposit(deposit: ResourceDeposit): RegenerateDepositResult {
  if (!deposit.renewable || !deposit.renewableState) {
    return { deposit, facts: [] };
  }

  const { regenerationRate, carryingCapacity } = deposit.renewableState;
  const quantity = deposit.stock.quantity;

  if (carryingCapacity <= 0) {
    return { deposit, facts: [] };
  }

  const growth = regenerationRate * quantity * (1 - quantity / carryingCapacity);
  const newQuantity = Math.min(carryingCapacity, Math.max(0, quantity + growth));

  if (newQuantity === quantity) {
    return { deposit, facts: [] };
  }

  return {
    deposit: { ...deposit, stock: { ...deposit.stock, quantity: newQuantity } },
    facts: [],
  };
}
