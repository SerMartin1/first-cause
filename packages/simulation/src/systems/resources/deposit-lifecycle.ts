import {
  isDepositKnownToWorld,
  type DepositDiscoveryStatus,
  type ResourceDeposit,
} from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";

/**
 * Discovery lifecycle (World Generation Spec SS13, Entity Data Model
 * SS9): `UNKNOWN -> SUSPECTED -> DISCOVERED -> ASSESSED`. TECH-009: the
 * deposit already exists physically at `UNKNOWN` -- `createResourceDeposit`
 * (M3) already guarantees that; this module only ever moves `discovery`
 * forward, never invents stock.
 *
 * A pure function: returns the next deposit value plus the fact
 * *inputs* to emit (SIM-004 "commit, then emit facts") -- it does not
 * call `FactStore` itself, so it stays testable in isolation
 * (Technology Stack Decision SS33 "pure calculation").
 */
const DISCOVERY_RANK: Readonly<Record<DepositDiscoveryStatus, number>> = {
  UNKNOWN: 0,
  SUSPECTED: 1,
  DISCOVERED: 2,
  ASSESSED: 3,
};

export interface DiscoverDepositInput {
  readonly tick: number;
  readonly targetStatus: DepositDiscoveryStatus;
  readonly discoveredByEntityId?: string;
  readonly confidence: number;
}

export interface DiscoverDepositResult {
  readonly deposit: ResourceDeposit;
  readonly facts: readonly FactInput<DepositDiscoveryStatus>[];
}

/**
 * Advances `deposit.discovery` toward `targetStatus`. A no-op (same
 * deposit, no facts) if the deposit has already reached that status or
 * further -- discovery never regresses.
 */
export function discoverDeposit(
  deposit: ResourceDeposit,
  input: DiscoverDepositInput,
): DiscoverDepositResult {
  if (input.confidence < 0 || input.confidence > 1) {
    throw new RangeError(
      `discoverDeposit: confidence must be within [0, 1], got ${input.confidence}`,
    );
  }

  const currentRank = DISCOVERY_RANK[deposit.discovery.status];
  const targetRank = DISCOVERY_RANK[input.targetStatus];

  if (targetRank <= currentRank) {
    return { deposit, facts: [] };
  }

  const nextDeposit: ResourceDeposit = {
    ...deposit,
    discovery: {
      status: input.targetStatus,
      discoveredTick: deposit.discovery.discoveredTick ?? input.tick,
      discoveredByEntityId:
        deposit.discovery.discoveredByEntityId ?? input.discoveredByEntityId,
      confidence: Math.max(deposit.discovery.confidence, input.confidence),
    },
  };

  const facts: FactInput<DepositDiscoveryStatus>[] = [];
  if (input.targetStatus === "DISCOVERED") {
    facts.push({
      type: "resource_discovered",
      subject: { entityType: "resourceDeposit", entityId: deposit.id },
      location: { regionId: deposit.regionId },
      values: { before: deposit.discovery.status, after: "DISCOVERED" },
    });
  } else if (input.targetStatus === "ASSESSED") {
    facts.push({
      type: "resource_assessed",
      subject: { entityType: "resourceDeposit", entityId: deposit.id },
      location: { regionId: deposit.regionId },
      values: { before: deposit.discovery.status, after: "ASSESSED" },
    });
  }

  return { deposit: nextDeposit, facts };
}

/**
 * Bramka odkrycia (D2, Canonical Decisions TECH-010, AI Decision Model
 * §113): ilość złoża dostępna dla KAŻDEGO gospodarczego użycia --
 * dostępności wejść, decyzji produkcji, liczby batchy, bottlenecku,
 * zakładania firm. Dla złoża nieznanego światu zawsze 0, a `stock` nie jest
 * wtedy w ogóle czytany (brak wycieku informacji do decyzji).
 */
export function usableDepositQuantity(deposit: ResourceDeposit | undefined): number {
  if (!deposit || !isDepositKnownToWorld(deposit)) return 0;
  return deposit.stock.quantity;
}
