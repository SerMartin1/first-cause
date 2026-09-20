import { assertNonNegative, type ResourceDeposit } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import type { PendingCausalLink } from "../../core/causal-links.js";

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
  /** M17 (CE-06): `targetIndex`/`sameBatch.index` względne do WŁASNEJ tablicy `facts` -- patrz `offsetCausalLinks`. */
  readonly causalLinks: readonly PendingCausalLink[];
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
      return { deposit, extracted: 0, facts: [], causalLinks: [] };
    }
    return {
      deposit: {
        ...deposit,
        extraction: { ...deposit.extraction, currentExtraction: 0 },
      },
      extracted: 0,
      facts: [trendFact],
      causalLinks: [],
    };
  }

  const availableQuantity = deposit.stock.quantity;
  const extracted = Math.min(input.amount, availableQuantity);
  const newQuantity = availableQuantity - extracted;
  const newlyDepleted = !deposit.renewable && newQuantity === 0 && extracted > 0;

  const trendFact = extractionTrendFact(deposit, extracted);
  const facts: FactInput<number>[] = trendFact ? [trendFact] : [];
  const causalLinks: PendingCausalLink[] = [];

  if (newlyDepleted) {
    facts.push({
      type: "resource_depleted",
      subject: { entityType: "resourceDeposit", entityId: deposit.id },
      location: { regionId: deposit.regionId },
      values: { before: availableQuantity, after: 0 },
    });
    // CE-06 (M17, Resource Bust §68/Test 10): wyczerpanie to bezpośredni
    // skutek KUMULATYWNEGO wydobycia -- jeśli ten sam batch wywołania
    // wygenerował trend fact (zwykły przypadek), link do niego przez
    // sameBatch; inaczej (rzadkie: depozyt padał od zera bez trendu do
    // zaraportowania) external.
    const trendFactIndex = trendFact ? facts.indexOf(trendFact) : -1;
    causalLinks.push({
      targetIndex: facts.length - 1,
      source:
        trendFactIndex >= 0
          ? { kind: "sameBatch", index: trendFactIndex }
          : { kind: "external", key: `resourceDeposit:${deposit.id}:cumulative_extraction` },
      type: "TRIGGERING",
      factor: { key: "cumulative_extraction", contribution: 1 },
      mechanism: "kumulatywne wydobycie sprowadziło stock do zera",
      system: "extraction",
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

  return { deposit: nextDeposit, extracted, facts, causalLinks };
}
