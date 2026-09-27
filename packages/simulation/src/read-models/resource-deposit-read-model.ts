import {
  isDepositKnownToWorld,
  type DepositDiscoveryStatus,
  type WorldState,
} from "@first-cause/entities";

/**
 * ResourceDepositReadModel (roadmap M5 "System Resources wystawia
 * UI-ready Read Model zamiast wymagać od Reacta interpretacji surowych
 * depositów").
 *
 * Granica wiedzy gracza (Canonical Decisions TECH-010, decyzja właściciela
 * 2026-09-26): model zawiera WYŁĄCZNIE złoża znane światu (DISCOVERED /
 * ASSESSED). Złoże UNKNOWN / SUSPECTED nie ujawnia ani swojego istnienia,
 * ani typu zasobu, ilości, jakości czy wydobycia -- wcześniej model
 * wystawiał `resourceDefinitionId` każdego złoża („Grain — Unknown” w
 * inspektorze), co było wyciekiem. Wiedza per aktor / gracz jako osobny byt
 * jest odłożona (ACTOR-SPECIFIC / LOCAL KNOWLEDGE MODEL).
 */
export interface ResourceDepositReadModel {
  readonly depositId: string;
  readonly regionId: string;
  readonly resourceDefinitionId: string;
  readonly discoveryStatus: DepositDiscoveryStatus;
  readonly renewable: boolean;
  /** Obecne dla każdego złoża w modelu (model zawiera tylko złoża znane światu). */
  readonly quantity: number | undefined;
  readonly extractionRate: number;
  readonly depleted: boolean;
  /**
   * D3 (TECH-012, macierz ujawniania): parametry dokładniejszego
   * rozpoznania -- tylko dla ASSESSED; dla DISCOVERED zawsze `undefined`
   * (minimal disclosure). `depth` bywa `undefined` także w ASSESSED, gdy
   * dane złoża jej nie podają (brak danych ≠ geologia).
   */
  readonly depth: number | undefined;
  readonly quality: number | undefined;
  readonly accessibility: number | undefined;
}

function assessedDetails(
  deposit: WorldState["resourceDeposits"][string],
): Pick<ResourceDepositReadModel, "depth" | "quality" | "accessibility"> {
  if (deposit.discovery.status !== "ASSESSED") {
    return { depth: undefined, quality: undefined, accessibility: undefined };
  }
  return {
    depth: deposit.stock.depth,
    quality: deposit.stock.quality,
    accessibility: deposit.stock.accessibility,
  };
}

function buildOne(state: WorldState, depositId: string): ResourceDepositReadModel {
  const deposit = state.resourceDeposits[depositId]!;
  return {
    depositId: deposit.id,
    regionId: deposit.regionId,
    resourceDefinitionId: deposit.resourceDefinitionId,
    discoveryStatus: deposit.discovery.status,
    renewable: deposit.renewable,
    quantity: deposit.stock.quantity,
    extractionRate: deposit.extraction.currentExtraction,
    depleted: deposit.depleted,
    ...assessedDetails(deposit),
  };
}

/** Złoża regionu znane światu, w stabilnej kolejności (SIM-005). */
export function buildResourceDepositReadModels(
  state: WorldState,
  regionId: string,
): readonly ResourceDepositReadModel[] {
  const region = state.regions[regionId];
  if (!region) return [];
  return [...region.resources.depositIds]
    .sort()
    .filter((depositId) => {
      const deposit = state.resourceDeposits[depositId];
      return deposit !== undefined && isDepositKnownToWorld(deposit);
    })
    .map((depositId) => buildOne(state, depositId));
}
