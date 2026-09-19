import type { DiscoveryAdoptionState, WorldState } from "@first-cause/entities";

/**
 * TechnologySummaryReadModel (M15, wzorzec z `region-summary-read-model.ts`):
 * płaski DTO nad `TechnologyState` regionu -- `knowledge` per domena,
 * `discoveries` (status + osie adopcji) i `eligibleDiscoveryIds`.
 * `undefined`, gdy region nie istnieje ALBO nie ma jeszcze podpiętego
 * `TechnologyState` (`Region.knowledge.technologyStateId === undefined`,
 * region świadomie bez Technology -- ten sam "brak danych = undefined"
 * wzorzec co inne Read Modele tego pliku).
 */
export interface TechnologySummaryReadModel {
  readonly regionId: string;
  /** domainId -> 0..100 poziom wiedzy. */
  readonly knowledge: Readonly<Record<string, number>>;
  /** discoveryId -> pełny stan adopcji (status + availability + trzy osie adopcji). */
  readonly discoveries: Readonly<Record<string, DiscoveryAdoptionState>>;
  readonly eligibleDiscoveryIds: readonly string[];
}

export function buildTechnologySummaryReadModel(
  state: WorldState,
  regionId: string,
): TechnologySummaryReadModel | undefined {
  const region = state.regions[regionId];
  if (!region) return undefined;

  const technologyStateId = region.knowledge.technologyStateId;
  if (!technologyStateId) return undefined;

  const technologyState = state.technologyStates[technologyStateId];
  if (!technologyState) return undefined;

  return {
    regionId,
    knowledge: technologyState.knowledge,
    discoveries: technologyState.discoveries,
    eligibleDiscoveryIds: technologyState.eligibleDiscoveryIds,
  };
}
