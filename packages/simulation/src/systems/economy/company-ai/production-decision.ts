import type { Company } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { assertFinite, assertNonNegative } from "../../../core/validation.js";
import { clamp } from "./decision-framework.js";
import type { CompanyFinancialHealth } from "./financial-health.js";

/**
 * Production Decision (AI-03, AI Decision Model SS25-28). Every tick's
 * adjustment is small and bounded (SS26 "nie skacze natychmiast z 10% do
 * 100% capacity") via the same capped-then-smoothed pressure shape
 * `markets/price-adjustment.ts` (M8) and `labor/wages.ts` (M9) already
 * use for their own per-tick dials -- a continuous quantity moving every
 * tick gets that treatment; the heavier hysteresis+cooldown apparatus in
 * `decision-framework.ts` is reserved for the big, infrequent structural
 * decisions (expansion/contraction/closure/PM adoption, SS20's own
 * "expansion -- długi [cooldown]" vs "zmiana produkcji -- krótki").
 *
 * SS23 "Priorytet przetrwania firmy": a distressed company can still
 * reduce output, but a positive margin never pushes it to increase --
 * survival first, growth later.
 */
const UTILIZATION_SENSITIVITY = 0.5; // TODO tuning
const MAX_TICK_UTILIZATION_CHANGE = 0.15; // TODO tuning -- SS26
const UTILIZATION_SMOOTHING_FACTOR = 0.5; // TODO tuning
const TARGET_INVENTORY_RATIO = 1.0; // TODO tuning -- SS28 "target inventory"; 1 = at target buffer
const MAINTAIN_BAND = 0.01; // TODO tuning -- |pressure| below this reads as MAINTAIN, not action-label noise

export type ProductionAction = "STOP" | "REDUCE" | "MAINTAIN" | "INCREASE";
export type ProductionBottleneck = "INPUT" | "DEMAND" | "NONE"; // SS27: LABOR/ENERGY/CAPACITY/TRANSPORT bottlenecks need signals this function does not take yet

export interface DecideProductionInput {
  readonly company: Company;
  /** Caller-observed expected margin this tick (Market prices - input costs) -- Company AI never has its own price authority (DATA-006). */
  readonly expectedMargin: number;
  /** 0..1: fraction of target inputs actually obtainable this tick (resource/good availability). */
  readonly inputAvailability: number;
  /** Finished-good inventory relative to the target buffer (1 = at target, >1 = oversupplied, 0 = empty). */
  readonly inventoryLevel: number;
  readonly financialHealth: CompanyFinancialHealth;
}

export interface DecideProductionResult {
  readonly company: Company;
  readonly action: ProductionAction;
  readonly bottleneck: ProductionBottleneck;
  readonly facts: readonly FactInput<number>[];
}

export function decideProduction(input: DecideProductionInput): DecideProductionResult {
  const { company } = input;
  const expectedMargin = assertFinite(
    input.expectedMargin,
    "decideProduction().expectedMargin",
  );
  const inputAvailability = clamp(
    assertNonNegative(input.inputAvailability, "decideProduction().inputAvailability"),
    0,
    1,
  );
  const inventoryLevel = assertNonNegative(
    input.inventoryLevel,
    "decideProduction().inventoryLevel",
  );

  const marginPressureSource = input.financialHealth.distressed
    ? Math.min(0, expectedMargin) // SS23: distressed companies never get an INCREASE signal from margin
    : expectedMargin;

  const rawPressure =
    UTILIZATION_SENSITIVITY * marginPressureSource -
    UTILIZATION_SENSITIVITY * (inventoryLevel - TARGET_INVENTORY_RATIO);
  const cappedPressure = clamp(
    rawPressure,
    -MAX_TICK_UTILIZATION_CHANGE,
    MAX_TICK_UTILIZATION_CHANGE,
  );
  const pressure = cappedPressure * UTILIZATION_SMOOTHING_FACTOR;

  const desiredUtilization = clamp(company.production.utilization + pressure, 0, 1);
  const nextUtilization = Math.min(desiredUtilization, inputAvailability);

  const bottleneck: ProductionBottleneck =
    nextUtilization < desiredUtilization ? "INPUT" : pressure < 0 ? "DEMAND" : "NONE";

  let action: ProductionAction;
  if (nextUtilization <= 0) action = "STOP";
  else if (pressure > MAINTAIN_BAND) action = "INCREASE";
  else if (pressure < -MAINTAIN_BAND) action = "REDUCE";
  else action = "MAINTAIN";

  const before = company.production.utilization;
  const nextCompany: Company = {
    ...company,
    production: { ...company.production, utilization: nextUtilization },
  };

  const facts: FactInput<number>[] = [];
  if (nextUtilization !== before) {
    facts.push({
      type: "production_utilization_changed",
      subject: { entityType: "company", entityId: company.id },
      location: { regionId: company.regionId },
      values: { before, after: nextUtilization, delta: nextUtilization - before },
    });
  }

  return { company: nextCompany, action, bottleneck, facts };
}
