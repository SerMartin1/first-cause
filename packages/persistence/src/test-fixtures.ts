import {
  createArchitectInfluenceState,
  createRegion,
  createRegionGeography,
  createResourceDeposit,
  createWorld,
  createWorldState,
  type WorldState,
} from "@first-cause/entities";
import { DefinitionRegistry, type EventTypeDefinition } from "@first-cause/content";
import { createWorldRunner, type WorldRunner } from "@first-cause/simulation";

/**
 * Shared fixture for `packages/persistence`'s own tests -- NOT exported
 * from `index.ts` (test-only, same "helper module, not part of the
 * public package surface" pattern `economy-tick.test.ts`'s
 * `buildWorldState` already uses in `packages/simulation`).
 */
export function buildFixtureWorldState(worldSeed: string): WorldState {
  const world = createWorld({
    id: "world_001",
    seed: worldSeed,
    name: "W",
    configuration: { regionCount: 1, worldSizePreset: "test" },
  });
  const region = createRegion({
    id: "region_a",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region A",
    geography: createRegionGeography({
      terrain: "plains",
      climate: "temperate",
      area: 10,
      fertility: 0.2,
      waterAccess: false,
      coastal: false,
      elevationClass: "lowland",
    }),
  });
  const deposit = createResourceDeposit({
    id: "deposit_001",
    resourceDefinitionId: "iron_ore",
    regionId: "region_a",
    initialQuantity: 100,
    renewable: false,
  });

  return createWorldState({
    world,
    continents: [{ id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] }],
    regions: [region],
    resourceDeposits: [deposit],
    architectInfluence: createArchitectInfluenceState(100),
  });
}

export function buildFixtureEventTypes(): DefinitionRegistry<EventTypeDefinition> {
  const resourceDiscovered: EventTypeDefinition = {
    id: "resource_discovered",
    nameKey: "content.eventType.resource_discovered.name",
    category: "resources",
    baseSignificance: 30,
    candidateThreshold: 5,
    aggregationPolicy: { windowTicks: 1, scope: "entity" },
    noveltyPolicy: { tracksFirst: true, scope: "region" },
    durationPolicy: "INSTANTANEOUS",
    anchorPolicy: { alwaysAnchor: true },
    implementationPhase: "VS",
  };
  return DefinitionRegistry.fromDefinitions<EventTypeDefinition>([resourceDiscovered]);
}

export function buildFixtureRunner(worldSeed: string): WorldRunner {
  return createWorldRunner({
    worldSeed,
    startYear: 1200,
    worldState: buildFixtureWorldState(worldSeed),
    chronicleEventTypes: buildFixtureEventTypes(),
  });
}
