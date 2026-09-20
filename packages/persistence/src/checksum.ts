import { computeChecksum } from "@first-cause/simulation";
import type { SaveGame } from "./envelope.js";

/**
 * World + Layer Checksums (SS86-88, SAVE-010). Reuses
 * `@first-cause/simulation`'s `computeChecksum` (canonical serialization
 * + double FNV-1a-32, same algorithm `WorldRunner`/`HeadlessRunner`
 * already use for their own determinism tests) -- never a second hash
 * implementation.
 *
 * World Checksum covers `saveGame.worldState` only (SS87: "nie obejmuje
 * UI state, real timestamp, machine-specific data") -- `metadata.
 * createdAt`/`savedAt`, `persistenceState` and `optionalUiState` are all
 * deliberately excluded.
 */
export function computeWorldChecksum(saveGame: SaveGame): string {
  return computeChecksum(saveGame.worldState);
}

/**
 * SS88 Layer Checksums: "pozwalają znaleźć pierwszy system divergence".
 * The 5 layers SS88 names (population/economy/technology/causality/
 * architect) plus `chronicle` -- M19 introduced a real, independent
 * layer of history state worth isolating the same way, not listed in
 * SS88 only because it predates M19.
 */
export interface LayerChecksums {
  readonly population: string;
  readonly economy: string;
  readonly technology: string;
  readonly causality: string;
  readonly architect: string;
  readonly chronicle: string;
}

export function computeLayerChecksums(saveGame: SaveGame): LayerChecksums {
  const { worldState } = saveGame;
  const world = worldState.worldState;

  return {
    population: computeChecksum(world.populationCohorts),
    economy: computeChecksum({
      companies: world.companies,
      markets: world.markets,
      inventories: world.inventories,
      resourceDeposits: world.resourceDeposits,
    }),
    technology: computeChecksum(world.technologyStates),
    causality: computeChecksum({
      factStore: worldState.factStore,
      causalEdgeStore: worldState.causalEdgeStore,
      architectInfluenceByFactId: worldState.architectInfluenceByFactId,
    }),
    architect: computeChecksum({
      architectInfluence: world.architectInfluence,
      interventions: world.interventions,
    }),
    chronicle: computeChecksum(worldState.chronicle),
  };
}

export interface SaveGameChecksums {
  readonly world: string;
  readonly layers: LayerChecksums;
}

export function computeSaveGameChecksums(saveGame: SaveGame): SaveGameChecksums {
  return {
    world: computeWorldChecksum(saveGame),
    layers: computeLayerChecksums(saveGame),
  };
}
