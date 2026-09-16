import { assertNonEmpty, assertNonNegative } from "../core/validation.js";

/**
 * World (Entity Data Model SS4): the root of the simulation.
 *
 * `seed`/`currentTick`/`currentDate` mirror the shape of
 * `packages/simulation`'s `core/rng.ts` `WorldSeed` and `core/time.ts`
 * `CalendarDate` (redefined locally, not imported -- see
 * `core/validation.ts` for why `packages/entities` avoids a production
 * dependency on `packages/simulation`). Wiring an actual
 * `SimulationClock`/`WorldRng` to keep these fields in sync belongs to
 * whichever milestone drives real ticks over World State (M5+); M3
 * only establishes the shape.
 *
 * `schemaVersion`/`contentVersion`/`engineVersion` (SAVE-007) and
 * `simulation.rngState`/`history` (facts/Chronicle) are intentionally
 * absent until the systems that own them exist (M20 save/load, M17
 * Causality, M19 Chronicle) -- see Region's doc comment for the same
 * "no field for a system that doesn't exist yet" rule.
 */
export type WorldSeed = string | number;

export interface WorldDate {
  readonly year: number;
  /** 1-12. */
  readonly month: number;
}

export interface WorldConfiguration {
  readonly regionCount: number;
  readonly worldSizePreset: string;
}

export interface World {
  readonly id: string;
  readonly seed: WorldSeed;
  readonly name: string;
  readonly currentTick: number;
  readonly currentDate: WorldDate;
  /** `SIM-001`: 1 tick = 1 month, in every world. */
  readonly tickLength: "month";
  readonly configuration: WorldConfiguration;
  readonly continentIds: readonly string[];
  readonly regionIds: readonly string[];
}

export interface CreateWorldInput {
  readonly id: string;
  readonly seed: WorldSeed;
  readonly name: string;
  readonly configuration: WorldConfiguration;
  readonly startDate?: WorldDate;
}

export function createWorld(input: CreateWorldInput): World {
  assertNonEmpty(input.id, "World.id");
  assertNonEmpty(input.name, "World.name");
  assertNonNegative(input.configuration.regionCount, "World.configuration.regionCount");
  assertNonEmpty(
    input.configuration.worldSizePreset,
    "World.configuration.worldSizePreset",
  );

  const startDate = input.startDate ?? { year: 1, month: 1 };
  if (startDate.month < 1 || startDate.month > 12) {
    throw new RangeError(`World.currentDate.month must be 1-12, got ${startDate.month}`);
  }

  return {
    id: input.id,
    seed: input.seed,
    name: input.name,
    currentTick: 0,
    currentDate: startDate,
    tickLength: "month",
    configuration: input.configuration,
    continentIds: [],
    regionIds: [],
  };
}
