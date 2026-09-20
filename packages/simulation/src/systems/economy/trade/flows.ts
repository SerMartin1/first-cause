import type { Connection, MarketGoodState } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { assertFinite, assertNonNegative } from "../../../core/validation.js";
import { offsetCausalLinks, type PendingCausalLink } from "../../../core/causal-links.js";
import type { TransportModeProfile } from "../transport/modes.js";
import { updateEffectiveDistance } from "./effective-distance.js";
import { evaluateCapacityCongestion } from "./capacity-congestion.js";

/**
 * Trade flow evaluation (VS Spec SS18 "Handel", Simulation Model SS28,
 * Simulation Test Spec SS33-36). `ImportedCost = ForeignPrice +
 * TransportCost + Tariff + RiskCost` -- in VS, `Tariff = 0` (no states
 * yet) and RiskCost is minimal (VS SS18), scaled off `friction.security`
 * so it is not simply hardcoded to nothing.
 *
 * A flow only happens when it is economically justified (delivered cost
 * beats the importing region's own price) OR the importing region has a
 * critical shortage (FC-TRADE-002: "nie istnieje krytyczny shortage
 * uzasadniający zakup" is the *only* thing that can override an
 * otherwise-too-expensive import). Even then, the actual quantity is
 * capped by both the connection's physical capacity
 * (`capacity-congestion.ts`) and the exporting region's real surplus
 * (`supply - demand` this tick) -- "eksport nie może przekraczać
 * fizycznej podaży" (Entity Data Model SS15).
 */
const CRITICAL_SHORTAGE_THRESHOLD = 0.8; // TODO tuning -- FC-TRADE-002's "krytyczny shortage"
const RISK_COST_WEIGHT = 0.1; // TODO tuning -- VS SS18 "RiskCost minimalny lub 0"
const TARIFF = 0; // VS SS18: explicitly 0 in Vertical Slice (no states yet), not "not yet computed"

export interface EvaluateTradeFlowInput {
  readonly connection: Connection;
  /** The exporting region's Market state for this good this tick. */
  readonly exportingGood: MarketGoodState;
  /** The importing region's Market state for this good this tick. */
  readonly importingGood: MarketGoodState;
  readonly transportMode: TransportModeProfile;
  /** How much the importing region would like to bring in this tick (e.g. derived from its own shortage). */
  readonly desiredImportQuantity: number;
  /** Bulk/value density of this specific good (Production-Economy-Master SS5 "cargo_factor") -- TODO tuning placeholder, defaults to 1 until `GoodDefinition.transportProperties` is formalized. */
  readonly cargoFactor?: number;
}

export interface EvaluateTradeFlowResult {
  readonly connection: Connection;
  /** Actual physical quantity moved this tick (0 when infeasible). */
  readonly importedQuantity: number;
  /** Per-unit delivered cost (`ImportedCost`). */
  readonly importedCost: number;
  readonly feasible: boolean;
  readonly facts: readonly FactInput<number>[];
  /** M17 (CE-04): `targetIndex`/`sameBatch.index` względne do WŁASNEJ tablicy `facts` -- patrz `offsetCausalLinks`. */
  readonly causalLinks: readonly PendingCausalLink[];
}

export function evaluateTradeFlow(
  input: EvaluateTradeFlowInput,
): EvaluateTradeFlowResult {
  const desiredImportQuantity = assertNonNegative(
    input.desiredImportQuantity,
    "evaluateTradeFlow().desiredImportQuantity",
  );
  const cargoFactor = assertNonNegative(
    input.cargoFactor ?? 1,
    "evaluateTradeFlow().cargoFactor",
  );

  const distance = updateEffectiveDistance(input.connection);
  const congestion = evaluateCapacityCongestion({
    connection: distance.connection,
    desiredFlow: desiredImportQuantity,
  });

  const transportCost =
    distance.connection.cached.effectiveDistance *
    cargoFactor *
    input.transportMode.costPerUnitDistance *
    congestion.congestionModifier;
  const riskCost =
    assertNonNegative(
      input.connection.friction.security,
      "evaluateTradeFlow().connection.friction.security",
    ) * RISK_COST_WEIGHT;
  const importedCost = assertFinite(
    input.exportingGood.localPrice + transportCost + TARIFF + riskCost,
    "evaluateTradeFlow().importedCost",
  );

  const economicallyFeasible = importedCost < input.importingGood.localPrice;
  const criticalShortage =
    input.importingGood.shortageSeverity >= CRITICAL_SHORTAGE_THRESHOLD;
  const feasible = economicallyFeasible || criticalShortage;

  const exportableSurplus = Math.max(
    0,
    input.exportingGood.supply - input.exportingGood.demand,
  );
  const importedQuantity = feasible
    ? Math.min(desiredImportQuantity, congestion.cappedFlow, exportableSurplus)
    : 0;

  const facts = [...distance.facts, ...congestion.facts];
  const causalLinks = [
    ...distance.causalLinks,
    ...offsetCausalLinks(congestion.causalLinks, distance.facts.length),
  ];

  return {
    connection: congestion.connection,
    importedQuantity,
    importedCost,
    feasible,
    facts,
    causalLinks,
  };
}
