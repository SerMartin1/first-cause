import { assertNonEmpty } from "../core/validation.js";

/** Entity Data Model SS28. */
export type DiscoveryAdoptionStatus = "UNKNOWN" | "KNOWN" | "AVAILABLE" | "ADOPTED";

export interface DiscoveryAdoptionState {
  readonly status: DiscoveryAdoptionStatus;
  readonly discoveredTick: number | undefined;
  readonly sourceRegionId: string | undefined;
  readonly diffusionSource: string | undefined;
  /** 0..1. */
  readonly availability: number;
  /** 0..1. */
  readonly industryAdoption: number;
  /** 0..1. */
  readonly populationAccess: number;
  /** 0..1. */
  readonly institutionalAdoption: number;
}

export interface SpecialistCapacity {
  readonly capacity: number;
}

/**
 * TechnologyState (Entity Data Model SS28): a region's technological
 * state. A pure data holder in M3 -- Discovery adoption and diffusion
 * logic is M15.
 *
 * `eligibility.eligibleDiscoveryIds` is a cache (must be
 * reconstructible, per the doc's own note); M3 leaves it empty since
 * nothing computes eligibility yet.
 */
export interface TechnologyState {
  readonly id: string;
  readonly regionId: string;
  /** domainId -> 0..100 knowledge level. */
  readonly knowledge: Readonly<Record<string, number>>;
  /** discoveryId -> adoption state. */
  readonly discoveries: Readonly<Record<string, DiscoveryAdoptionState>>;
  readonly eligibleDiscoveryIds: readonly string[];
  /** domainId -> specialist capacity. */
  readonly specialists: Readonly<Record<string, SpecialistCapacity>>;
}

export interface CreateTechnologyStateInput {
  readonly id: string;
  readonly regionId: string;
}

export function createTechnologyState(
  input: CreateTechnologyStateInput,
): TechnologyState {
  assertNonEmpty(input.id, "TechnologyState.id");
  assertNonEmpty(input.regionId, "TechnologyState.regionId");

  return {
    id: input.id,
    regionId: input.regionId,
    knowledge: {},
    discoveries: {},
    eligibleDiscoveryIds: [],
    specialists: {},
  };
}
