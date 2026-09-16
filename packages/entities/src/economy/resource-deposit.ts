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
  readonly depth: number;
  /** 0..1. */
  readonly accessibility: number;
}

export interface DepositRenewableState {
  readonly regenerationRate: number;
  readonly sustainableYield: number;
}

export interface DepositExtractionState {
  readonly currentExtraction: number;
  readonly cumulativeExtraction: number;
  readonly marginalCostModifier: number;
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
      depth: input.depth ?? 0,
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
