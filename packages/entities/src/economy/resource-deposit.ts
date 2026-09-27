import { assertNonEmpty, assertNonNegative } from "../core/validation.js";

/** Entity Data Model SS9. */
export type DepositDiscoveryStatus = "UNKNOWN" | "SUSPECTED" | "DISCOVERED" | "ASSESSED";

export interface DepositDiscoveryState {
  readonly status: DepositDiscoveryStatus;
  readonly discoveredTick: number | undefined;
  readonly discoveredByEntityId: string | undefined;
  /** 0..1. */
  readonly confidence: number;
}

export interface DepositStock {
  readonly quantity: number;
  readonly initialQuantity: number;
  /** 0..1. */
  readonly quality: number;
  /**
   * Głębokość złoża w abstrakcyjnej jednostce modelu (D3, decyzja
   * właściciela 2026-09-27). `undefined` = głębokość NIE podana w danych
   * -- to NIE jest „złoże powierzchniowe”: brak danych nigdy nie jest
   * interpretowany jako geologia. Reguły naturalnego odkrywania
   * (`ResourceDefinition.discoveryRules`) działają wyłącznie na złożach z
   * jawną głębokością.
   */
  readonly depth: number | undefined;
  /** 0..1. */
  readonly accessibility: number;
}

export interface DepositRenewableState {
  readonly regenerationRate: number;
  readonly sustainableYield: number;
  /** World Generation Spec SS14: the ceiling `stock.quantity` regenerates toward. */
  readonly carryingCapacity: number;
}

export interface DepositExtractionState {
  readonly currentExtraction: number;
  readonly cumulativeExtraction: number;
  readonly marginalCostModifier: number;
}

/**
 * Granica wiedzy świata (Canonical Decisions TECH-009 / TECH-010,
 * AI Decision Model §113): złoże istnieje fizycznie od `UNKNOWN`, ale
 * gospodarka i gracz mogą z niego korzystać / widzieć je dopiero od
 * `DISCOVERED`. `SUSPECTED` to przesłanka, nie wiedza o złożu -- nie
 * odblokowuje ani użycia, ani ujawnienia zasobu. Jedno źródło prawdy dla
 * symulacji, Read Models i walidacji stanu początkowego.
 */
export function isDepositKnownToWorld(
  deposit: Pick<ResourceDeposit, "discovery">,
): boolean {
  return (
    deposit.discovery.status === "DISCOVERED" || deposit.discovery.status === "ASSESSED"
  );
}

/**
 * ResourceDeposit (Entity Data Model SS9): a resource instance physically
 * present in one region. Structure only in M3 -- lifecycle logic
 * (discover/extract/deplete) is M5.
 */
export interface ResourceDeposit {
  readonly id: string;
  readonly resourceDefinitionId: string;
  readonly regionId: string;
  readonly discovery: DepositDiscoveryState;
  readonly stock: DepositStock;
  readonly renewable: boolean;
  readonly renewableState: DepositRenewableState | undefined;
  readonly extraction: DepositExtractionState;
  readonly depleted: boolean;
  readonly economicallyExhausted: boolean;
}

export interface CreateResourceDepositInput {
  readonly id: string;
  readonly resourceDefinitionId: string;
  readonly regionId: string;
  readonly initialQuantity: number;
  readonly quality?: number;
  readonly depth?: number;
  readonly accessibility?: number;
  readonly renewable: boolean;
  readonly renewableState?: DepositRenewableState;
}

export function createResourceDeposit(
  input: CreateResourceDepositInput,
): ResourceDeposit {
  assertNonEmpty(input.id, "ResourceDeposit.id");
  assertNonEmpty(input.resourceDefinitionId, "ResourceDeposit.resourceDefinitionId");
  assertNonEmpty(input.regionId, "ResourceDeposit.regionId");
  assertNonNegative(input.initialQuantity, "ResourceDeposit.initialQuantity");
  if (input.depth !== undefined) assertNonNegative(input.depth, "ResourceDeposit.depth");

  if (input.renewable && !input.renewableState) {
    throw new RangeError(
      `ResourceDeposit "${input.id}": renewable deposits require renewableState`,
    );
  }

  return {
    id: input.id,
    resourceDefinitionId: input.resourceDefinitionId,
    regionId: input.regionId,
    discovery: {
      status: "UNKNOWN",
      discoveredTick: undefined,
      discoveredByEntityId: undefined,
      confidence: 0,
    },
    stock: {
      quantity: input.initialQuantity,
      initialQuantity: input.initialQuantity,
      quality: input.quality ?? 1,
      depth: input.depth,
      accessibility: input.accessibility ?? 1,
    },
    renewable: input.renewable,
    renewableState: input.renewableState,
    extraction: {
      currentExtraction: 0,
      cumulativeExtraction: 0,
      marginalCostModifier: 1,
    },
    depleted: false,
    economicallyExhausted: false,
  };
}
