import type { Company } from "@first-cause/entities";
import { sortedEntries } from "../../../core/determinism.js";
import { roundMoney } from "../../../core/rounding.js";
import { assertFinite, assertNonNegative } from "../../../core/validation.js";
import type { ProductionRecipe } from "../production.js";
import {
  clamp,
  isOnCooldown,
  persistenceSatisfied,
  recordDecision,
  updateOpportunityStreak,
} from "./decision-framework.js";
import { buildDecisionSnapshot, type DecisionSnapshot } from "./decision-snapshot.js";

/**
 * Production Method Adoption (AI-08, AI Decision Model SS36-41).
 * `PMScore = ExpectedProductivityGain + LaborSavingValue +
 * InputSavingValue + QualityGain - ConversionCost - SkillGap -
 * EnergyRisk - InputRisk - Uncertainty` in the full model; M11 evaluates
 * the productivity/saving terms as a single per-batch margin delta
 * (`ProductionRecipe`, M7, priced from caller-observed Market/Resource
 * prices -- AI-001 "actor knows only its Perceived World State", a
 * missing price for a good/resource this recipe touches defaults to 0
 * rather than throwing, the same bounded-rationality allowance AI-004
 * gives every actor) and leaves SkillGap/EnergyRisk/Uncertainty at 0 --
 * structurally faithful, not fully populated, same treatment
 * `lifecycle-decision.ts` gives `ExpansionScore`.
 *
 * SS39 "Technologia może być nieopłacalna" is not a special case here --
 * it falls out naturally: a candidate recipe with a worse per-batch
 * margin than the current one simply never clears `requiredAdvantage`.
 */
const PM_ADOPTION_COOLDOWN_TICKS = 6; // TODO tuning -- SS20 "PM adoption -- średni"
const PM_ADOPTION_PERSISTENCE_TICKS = 3; // TODO tuning -- SS40/SS41 confidence-building persistence
const PM_ADOPTION_MIN_ADVANTAGE = 0.05; // TODO tuning -- SS38 "wymaga dodatniej przewagi"
/**
 * Klucz `Company.ai.lastDecision` dla adopcji metody: tick adopcji jest
 * jedynym zapisanym w stanie śladem, że `productionMethodId` zmienił się
 * PO produkcji tego ticka (R4B Economy, Read Model produkcji według towarów).
 */
export const PM_ADOPTION_DECISION_TYPE = "production_method_adoption";
const PM_DECISION_TYPE = PM_ADOPTION_DECISION_TYPE;

/** Reused by `opportunity-scanner.ts` (M12) for candidate ExpectedMargin -- same per-batch margin, same "missing price defaults to 0" bounded-rationality allowance. */
export function marginPerBatch(
  recipe: ProductionRecipe,
  prices: Readonly<Record<string, number>>,
): number {
  let margin = 0;
  for (const [goodId, quantity] of sortedEntries(recipe.goodOutputsPerBatch)) {
    margin += quantity * (prices[goodId] ?? 0);
  }
  for (const [resourceId, quantity] of sortedEntries(recipe.resourceInputsPerBatch)) {
    margin -= quantity * (prices[resourceId] ?? 0);
  }
  for (const [goodId, quantity] of sortedEntries(recipe.goodInputsPerBatch)) {
    margin -= quantity * (prices[goodId] ?? 0);
  }
  return margin;
}

export interface EvaluatePmAdoptionInput {
  readonly company: Company;
  readonly tick: number;
  readonly currentRecipe: ProductionRecipe;
  readonly candidateRecipe: ProductionRecipe;
  /** Good/resource id -> observed price, from Market (M8) / Resource content -- this company's Perceived World State, not the full world's. */
  readonly prices: Readonly<Record<string, number>>;
  readonly conversionCost: number;
  /** 0..1 (SS40 "Early Adopters"): higher preference lowers the required advantage. */
  readonly innovationPreference?: number;
}

export interface EvaluatePmAdoptionResult {
  readonly company: Company;
  readonly adopted: boolean;
  readonly pmScore: number;
  readonly snapshot: DecisionSnapshot | undefined;
}

export function evaluatePmAdoption(
  input: EvaluatePmAdoptionInput,
): EvaluatePmAdoptionResult {
  const { company, tick } = input;
  const conversionCost = assertNonNegative(
    input.conversionCost,
    "evaluatePmAdoption().conversionCost",
  );

  if (isOnCooldown(company, PM_DECISION_TYPE, tick, PM_ADOPTION_COOLDOWN_TICKS)) {
    return { company, adopted: false, pmScore: 0, snapshot: undefined };
  }

  const currentMargin = marginPerBatch(input.currentRecipe, input.prices);
  const candidateMargin = marginPerBatch(input.candidateRecipe, input.prices);
  const pmScore = assertFinite(
    candidateMargin - currentMargin - conversionCost,
    "evaluatePmAdoption().pmScore",
  );

  const innovationPreference = clamp(input.innovationPreference ?? 0, 0, 1);
  const requiredAdvantage = PM_ADOPTION_MIN_ADVANTAGE * (1 - innovationPreference);
  const advantageous = pmScore > requiredAdvantage;

  const nextCompany = updateOpportunityStreak(company, PM_DECISION_TYPE, advantageous);
  const capitalAvailable = nextCompany.finance.cash >= conversionCost;
  // Audytowe P1 "PM adoption bez hard eligibility": do dziś jedyną twardą
  // bramką był kapitał na konwersję -- firma dowolnego archetypu mogła
  // "przyjąć" dowolną Production Method, dopóki matematyka marży wyglądała
  // dobrze (np. piekarnia przyjmująca manual_farming). Pusta
  // `eligibleCompanyArchetypeIds` = brak ograniczenia (recepturom bez tego
  // pola -- np. ręcznie budowanym w testach -- nic się nie zmienia).
  const archetypeEligible =
    input.candidateRecipe.eligibleCompanyArchetypeIds.length === 0 ||
    input.candidateRecipe.eligibleCompanyArchetypeIds.includes(company.archetypeId);
  const hardEligible = capitalAvailable && archetypeEligible;

  if (
    advantageous &&
    hardEligible &&
    persistenceSatisfied(nextCompany, PM_DECISION_TYPE, PM_ADOPTION_PERSISTENCE_TICKS)
  ) {
    const adopted: Company = {
      ...recordDecision(nextCompany, PM_DECISION_TYPE, tick),
      production: {
        ...nextCompany.production,
        productionMethodId: input.candidateRecipe.productionMethodId,
      },
      finance: {
        ...nextCompany.finance,
        cash: roundMoney(nextCompany.finance.cash - conversionCost),
      },
    };
    return {
      company: adopted,
      adopted: true,
      pmScore,
      snapshot: buildDecisionSnapshot({
        actorId: company.id,
        tick,
        decisionType: PM_DECISION_TYPE,
        options: [
          { action: "KEEP", hardEligible: true, score: 0 },
          {
            action: "ADOPT",
            hardEligible,
            score: pmScore,
          },
        ],
        selectedAction: "ADOPT",
        factors: [
          { key: "candidate_margin", contribution: candidateMargin },
          { key: "current_margin", contribution: -currentMargin },
          { key: "conversion_cost", contribution: -conversionCost },
        ],
      }),
    };
  }

  return { company: nextCompany, adopted: false, pmScore, snapshot: undefined };
}
