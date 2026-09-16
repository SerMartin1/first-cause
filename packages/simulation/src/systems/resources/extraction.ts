import { assertNonNegative, type ResourceDeposit } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";

/**
 * Extraction (World Generation Spec SS14, ECO-010, Entity Data Model
 * SS9): `amount` is this tick's extraction *rate*, never a delta.
 * "Wydobycie nie może tworzyć zasobu" -- `extracted` is always
 * `min(amount, availableQuantity)`, so the deposit can never go
 * negative and extraction can never manufacture stock.
 *
 * Pure: returns the next deposit, the quantity actually extracted, and
 * the fact inputs to emit. Whether that rate is economically sound
 * (price, labor, AI decision) is M7/M11 -- this module only enforces
 * the physical invariant.
 */
export interface ExtractFromDepositInput {
  readonly tick: number;
  readonly amount: number;
}

export interface ExtractFromDepositResult {
  readonly deposit: ResourceDeposit;
  readonly extracted: number;
  readonly facts: readonly FactInput<number>[];
}

function extractionTrendFact(
  deposit: ResourceDeposit,
  after: number,
): FactInput<number> | undefined {
  const before = deposit.extraction.currentExtraction;
  if (after === before) return undefined;

  const type =
    before === 0 && after > 0
      ? "extraction_started"
      : after > before
        ? "extraction_increased"
        : "extraction_decreased";

  return {
    type,
    subject: { entityType: "resourceDeposit", entityId: deposit.id },
    location: { regionId: deposit.regionId },
    values: { before, after, delta: after - before },
  };
}

export function extractFromDeposit(
  deposit: ResourceDeposit,
  input: ExtractFromDepositInput,
): ExtractFromDepositResult {
  assertNonNegative(input.amount, "extractFromDeposit(amount)");

  if (deposit.depleted) {
    const trendFact = extractionTrendFact(deposit, 0);
    if (!trendFact) {
      return { deposit, extracted: 0, facts: [] };
    }
    return {
      deposit: {
        ...deposit,
        extraction: { ...deposit.extraction, currentExtraction: 0 },
      },
      extracted: 0,
      facts: [trendFact],
    };
  }

  const availableQuantity = deposit.stock.quantity;
  const extracted = Math.min(input.amount, availableQuantity);
  const newQuantity = availableQuantity - extracted;
  const newlyDepleted = !deposit.renewable && newQuantity === 0 && extracted > 0;

  const trendFact = extractionTrendFact(deposit, extracted);
  const facts: FactInput<number>[] = trendFact ? [trendFact] : [];

  if (newlyDepleted) {
    facts.push({
      type: "resource_depleted",
      subject: { entityType: "resourceDeposit", entityId: deposit.id },
      location: { regionId: deposit.regionId },
      values: { before: availableQuantity, after: 0 },
    });
  }

  const nextDeposit: ResourceDeposit = {
    ...deposit,
    stock: { ...deposit.stock, quantity: newQuantity },
    extraction: {
      ...deposit.extraction,
      currentExtraction: extracted,
      cumulativeExtraction: deposit.extraction.cumulativeExtraction + extracted,
    },
    depleted: deposit.depleted || newlyDepleted,
  };

  return { deposit: nextDeposit, extracted, facts };
}
