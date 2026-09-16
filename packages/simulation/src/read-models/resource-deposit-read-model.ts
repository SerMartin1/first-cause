import type { DepositDiscoveryStatus, WorldState } from "@first-cause/entities";

/**
 * ResourceDepositReadModel (roadmap M5 "System Resources wystawia
 * UI-ready Read Model zamiast wymagać od Reacta interpretacji surowych
 * depositów"). Respects TECH-009: a deposit's exact `quantity` is only
 * exposed once it has actually been `DISCOVERED`/`ASSESSED` --
 * `discoveryStatus` itself is always shown (an `UNKNOWN`/`SUSPECTED`
 * indicator is informative on its own; the hidden state is the point of
 * the mechanic, per World Generation Spec SS16).
 */
export interface ResourceDepositReadModel {
  readonly depositId: string;
  readonly regionId: string;
  readonly resourceDefinitionId: string;
  readonly discoveryStatus: DepositDiscoveryStatus;
  readonly renewable: boolean;
  /** Only present once `discoveryStatus` is DISCOVERED or ASSESSED. */
  readonly quantity: number | undefined;
  readonly extractionRate: number;
  readonly depleted: boolean;
}

const REVEALED_STATUSES: ReadonlySet<DepositDiscoveryStatus> = new Set([
  "DISCOVERED",
  "ASSESSED",
]);

function buildOne(state: WorldState, depositId: string): ResourceDepositReadModel {
  const deposit = state.resourceDeposits[depositId]!;
  const revealed = REVEALED_STATUSES.has(deposit.discovery.status);

  return {
    depositId: deposit.id,
    regionId: deposit.regionId,
    resourceDefinitionId: deposit.resourceDefinitionId,
    discoveryStatus: deposit.discovery.status,
    renewable: deposit.renewable,
    quantity: revealed ? deposit.stock.quantity : undefined,
    extractionRate: deposit.extraction.currentExtraction,
    depleted: deposit.depleted,
  };
}

/** All deposits in a region, in stable (sorted-by-ID) order (SIM-005). */
export function buildResourceDepositReadModels(
  state: WorldState,
  regionId: string,
): readonly ResourceDepositReadModel[] {
  const region = state.regions[regionId];
  if (!region) return [];
  return [...region.resources.depositIds]
    .sort()
    .map((depositId) => buildOne(state, depositId));
}
