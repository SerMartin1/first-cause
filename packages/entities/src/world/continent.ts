import { assertNonEmpty } from "../core/validation.js";

/** Continent (Entity Data Model SS5): an organizational/geographic layer. Aggregates regions, never runs its own economy. */
export interface Continent {
  readonly id: string;
  readonly worldId: string;
  readonly name: string;
  readonly regionIds: readonly string[];
  readonly tags: readonly string[];
}

export interface CreateContinentInput {
  readonly id: string;
  readonly worldId: string;
  readonly name: string;
  readonly tags?: readonly string[];
}

export function createContinent(input: CreateContinentInput): Continent {
  assertNonEmpty(input.id, "Continent.id");
  assertNonEmpty(input.worldId, "Continent.worldId");
  assertNonEmpty(input.name, "Continent.name");

  return {
    id: input.id,
    worldId: input.worldId,
    name: input.name,
    regionIds: [],
    tags: input.tags ?? [],
  };
}
