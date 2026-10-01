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
  /**
   * P14 (2026-10-01): środki kupujących importera na niezrealizowane
   * zamówienia -- ilość ograniczona do `buyerFunds / importedCost`
   * (rzeczywisty koszt dostawy, częściowe zakupy). Brak = bez ograniczenia
   * (zachowanie sprzed P14).
   */
  readonly buyerFunds?: number;
  /**
   * P14: importer nie ma lokalnych ofert -- jego cena jest orientacyjna, więc
   * import nie może czekać, aż urośnie ponad koszt dostawy; wystarczą
   * finansowane zamówienia (`buyerFunds`).
   */
  readonly importerHasNoOffers?: boolean;
  /**
   * Etap 4B: czy przewóz jest płatną usługą (przewoźnik z contentu). Wtedy
   * cena oferty dla kupującego = cena towaru + opłata za przewóz (koszt
   * transportu + ryzyko, cło 0 w VS); bez usługi -- sama cena towaru (jak
   * przed 4B). Ta sama cena ogranicza ilość finansowaną (`buyerFunds`).
   */
  readonly chargeTransport?: boolean;
  /** P14: pozostała oferta eksportera w tym ticku (po wcześniejszych przepływach) -- ta sama nadwyżka nie jest liczona dwa razy. */
  readonly exportableLimit?: number;
  /** Bulk/value density of this specific good (Production-Economy-Master SS5 "cargo_factor") -- TODO tuning placeholder, defaults to 1 until `GoodDefinition.transportProperties` is formalized. */
  readonly cargoFactor?: number;
}

export interface EvaluateTradeFlowResult {
  readonly connection: Connection;
  /** Actual physical quantity moved this tick (0 when infeasible). */
  readonly importedQuantity: number;
  /** Per-unit delivered cost (`ImportedCost`). */
  readonly importedCost: number;
  /** Etap 4B: opłata za przewóz jednej jednostki (transport + ryzyko; 0 bez płatnej usługi). */
  readonly transportFeePerUnit: number;
  /** Etap 4B: cena oferty dla kupującego za jednostkę (cena towaru + opłata). */
  readonly offerUnitPrice: number;
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
  const feasible =
    economicallyFeasible || criticalShortage || input.importerHasNoOffers === true;

  const exportableSurplus = Math.min(
    Math.max(0, input.exportingGood.supply - input.exportingGood.demand),
    input.exportableLimit ?? Number.POSITIVE_INFINITY,
  );
  const transportFeePerUnit = input.chargeTransport === true ? transportCost + riskCost + TARIFF : 0;
  const offerUnitPrice = input.exportingGood.localPrice + transportFeePerUnit;
  const fundedQuantity =
    input.buyerFunds === undefined
      ? Number.POSITIVE_INFINITY
      : offerUnitPrice > 0
        ? Math.max(0, input.buyerFunds) / offerUnitPrice
        : 0;
  const importedQuantity = feasible
    ? Math.max(
        0,
        Math.min(desiredImportQuantity, fundedQuantity, congestion.cappedFlow, exportableSurplus),
      )
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
    transportFeePerUnit,
    offerUnitPrice,
    feasible,
    facts,
    causalLinks,
  };
}
