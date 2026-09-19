import { assertNonEmpty, InvariantViolationError } from "../core/validation.js";

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

const DEFAULT_DISCOVERY_ADOPTION_STATE: DiscoveryAdoptionState = {
  status: "UNKNOWN",
  discoveredTick: undefined,
  sourceRegionId: undefined,
  diffusionSource: undefined,
  availability: 0,
  industryAdoption: 0,
  populationAccess: 0,
  institutionalAdoption: 0,
};

function assertInRange(value: number, min: number, max: number, label: string): number {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new InvariantViolationError(
      `${label} must be a finite number in [${min}, ${max}], got ${String(value)}`,
    );
  }
  return value;
}

/**
 * M15: ustawia poziom wiedzy regionu dla jednej domeny (0..100, Entity
 * Data Model SS28). Niemutowalne -- zwraca nowy `TechnologyState`, nigdy
 * nie mutuje `state`. Wywołujący (`technology/knowledge`) odpowiadają za
 * clamp/zaokrąglenie przed wywołaniem tej funkcji; to strażnik
 * niezmienników warstwy encji, nie logika tuningowa.
 */
export function setDomainKnowledge(
  state: TechnologyState,
  domainId: string,
  level: number,
): TechnologyState {
  assertNonEmpty(domainId, "domainId");
  assertInRange(level, 0, 100, `TechnologyState.knowledge[${domainId}]`);

  return {
    ...state,
    knowledge: { ...state.knowledge, [domainId]: level },
  };
}

/**
 * M15: merguje `patch` do stanu adopcji odkrycia, tworząc go (z
 * `DEFAULT_DISCOVERY_ADOPTION_STATE`, czyli `UNKNOWN`), jeśli jeszcze
 * nie istnieje. Niemutowalne. Clamp zakresu osi `0..1`
 * (availability/industryAdoption/populationAccess/institutionalAdoption)
 * to odpowiedzialność wywołującego (`technology/discoveries`,
 * `technology/diffusion`, `technology/adoption`).
 */
export function setDiscoveryState(
  state: TechnologyState,
  discoveryId: string,
  patch: Partial<DiscoveryAdoptionState>,
): TechnologyState {
  assertNonEmpty(discoveryId, "discoveryId");
  const current = state.discoveries[discoveryId] ?? DEFAULT_DISCOVERY_ADOPTION_STATE;
  const next: DiscoveryAdoptionState = { ...current, ...patch };

  return {
    ...state,
    discoveries: { ...state.discoveries, [discoveryId]: next },
  };
}

/**
 * M15: zastępuje cache `eligibleDiscoveryIds`. Entity Data Model SS27:
 * "eligibility może być cache i musi dać się odtworzyć" -- wywołujący
 * (`technology/discoveries::computeEligibleDiscoveryIds`) przeliczają go
 * od zera co tick, zamiast akumulować przyrostowo.
 */
export function setEligibleDiscoveryIds(
  state: TechnologyState,
  eligibleDiscoveryIds: readonly string[],
): TechnologyState {
  return { ...state, eligibleDiscoveryIds };
}
