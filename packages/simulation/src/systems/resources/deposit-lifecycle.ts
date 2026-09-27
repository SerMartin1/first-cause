import {
  isDepositKnownToWorld,
  type DepositDiscoveryStatus,
  type ResourceDeposit,
} from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import type { PendingCausalLink } from "../../core/causal-links.js";

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
  /**
   * D3: `resource_assessed` ← `resource_discovered` (`sameBatch`), gdy jedno
   * wywołanie przeprowadza złoże przez oba etapy -- indeksy względne do
   * własnej tablicy `facts` (patrz `offsetCausalLinks`).
   */
  readonly causalLinks: readonly PendingCausalLink[];
}

function statusFact(
  deposit: ResourceDeposit,
  type: "resource_suspected" | "resource_discovered" | "resource_assessed",
  before: DepositDiscoveryStatus,
  after: DepositDiscoveryStatus,
): FactInput<DepositDiscoveryStatus> {
  return {
    type,
    subject: { entityType: "resourceDeposit", entityId: deposit.id },
    location: { regionId: deposit.regionId },
    values: { before, after },
  };
}

/**
 * Advances `deposit.discovery` toward `targetStatus`. A no-op (same
 * deposit, no facts) if the deposit has already reached that status or
 * further -- discovery never regresses.
 *
 * D3 (Canonical Decisions TECH-012): każda rzeczywista zmiana statusu
 * daje dokładnie jeden fakt -- `resource_suspected` / `resource_discovered`
 * / `resource_assessed`. ASSESSED semantycznie wymaga potwierdzonego
 * istnienia (Entity Data Model §9: „znane światu od DISCOVERED”), więc
 * skok spod DISCOVERED prosto do ASSESSED przechodzi logicznie przez
 * DISCOVERED w tym samym ticku: dwa fakty (discovered, potem assessed) z
 * krawędzią przyczynową między nimi. Bezpośrednie potwierdzenie
 * (UNKNOWN → DISCOVERED) nie udaje przejścia przez SUSPECTED.
 * `discoveredTick`/`discoveredByEntityId` opisują potwierdzenie istnienia,
 * więc ustawia je dopiero osiągnięcie DISCOVERED (albo wyżej).
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

  const currentStatus = deposit.discovery.status;
  const currentRank = DISCOVERY_RANK[currentStatus];
  const targetRank = DISCOVERY_RANK[input.targetStatus];

  if (targetRank <= currentRank) {
    return { deposit, facts: [], causalLinks: [] };
  }

  const confirmsExistence = targetRank >= DISCOVERY_RANK.DISCOVERED;
  const nextDeposit: ResourceDeposit = {
    ...deposit,
    discovery: {
      status: input.targetStatus,
      discoveredTick: confirmsExistence
        ? (deposit.discovery.discoveredTick ?? input.tick)
        : deposit.discovery.discoveredTick,
      discoveredByEntityId: confirmsExistence
        ? (deposit.discovery.discoveredByEntityId ?? input.discoveredByEntityId)
        : deposit.discovery.discoveredByEntityId,
      confidence: Math.max(deposit.discovery.confidence, input.confidence),
    },
  };

  const facts: FactInput<DepositDiscoveryStatus>[] = [];
  const causalLinks: PendingCausalLink[] = [];
  if (input.targetStatus === "SUSPECTED") {
    facts.push(statusFact(deposit, "resource_suspected", currentStatus, "SUSPECTED"));
  } else if (input.targetStatus === "DISCOVERED") {
    facts.push(statusFact(deposit, "resource_discovered", currentStatus, "DISCOVERED"));
  } else {
    let assessedFrom: DepositDiscoveryStatus = currentStatus;
    if (currentRank < DISCOVERY_RANK.DISCOVERED) {
      facts.push(statusFact(deposit, "resource_discovered", currentStatus, "DISCOVERED"));
      assessedFrom = "DISCOVERED";
    }
    facts.push(statusFact(deposit, "resource_assessed", assessedFrom, "ASSESSED"));
    if (facts.length === 2) {
      causalLinks.push({
        targetIndex: 1,
        source: { kind: "sameBatch", index: 0 },
        type: "ENABLING",
        factor: { key: "deposit_confirmed", contribution: 1 },
        mechanism: "ocena złoża wymaga potwierdzenia jego istnienia",
        system: "resource-discovery",
      });
    }
  }

  return { deposit: nextDeposit, facts, causalLinks };
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
