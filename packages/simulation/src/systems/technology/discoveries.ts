import type { TechnologyState } from "@first-cause/entities";
import { setDiscoveryState, setEligibleDiscoveryIds } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import type { RngStream } from "../../core/rng.js";

/**
 * Eligibility odkryć + breakthrough (`technology/discoveries`, M15,
 * AI Decision Model §62: "Discovery Engine ocenia: Knowledge,
 * prerequisites, activity, pressure, seeded breakthrough. Firma dopiero
 * decyduje o Adoption" -- ten moduł odpowiada za wszystko aż do i
 * włącznie z `KNOWN`, nigdy nie dotyka Adoption).
 * `TIER_KNOWLEDGE_THRESHOLD_TODO_TUNING`/`BREAKTHROUGH_*_TODO_TUNING`:
 * `knowledgeRequirements`/`pressureModifiers` to dziś puste placeholdery
 * na każdym ze 125 realnych odkryć (katalog §1, jawne TODO tuning) --
 * te stałe to udokumentowany, celowo prosty zamiennik, dopóki nie
 * powstaną prawdziwe dane tuningowe per odkrycie.
 */

/**
 * 3 pola `DiscoveryDefinition` (`@first-cause/content`), których ten
 * moduł faktycznie potrzebuje -- Simulation Core nigdy nie zależy od
 * `@first-cause/content` (AGENTS.md reguła 6; ten sam powód, dla którego
 * `ProductionRecipe`/`TransportModeProfile` to natywne kształty
 * symulacji, w które `worldgen` PARSUJE content, a nie typy contentu,
 * które symulacja importuje). `worldgen` buduje tę mapę z
 * `DiscoveryDefinition.primaryDomainId`/`tier`/`prerequisites`.
 */
export interface DiscoveryEligibilityRule {
  readonly primaryDomainId: string;
  readonly tier: number;
  readonly prerequisites: readonly string[];
}

/** Ten sam wzorzec co `parseProductionRecipe`/`parseTransportModeProfile` -- `worldgen` woła to per-discovery przy budowie `discoveryEligibilityRulesById`. */
export function parseDiscoveryEligibilityRule(
  primaryDomainId: string,
  tier: number,
  prerequisites: readonly string[],
): DiscoveryEligibilityRule {
  return { primaryDomainId, tier, prerequisites };
}
export const TIER_KNOWLEDGE_THRESHOLD_TODO_TUNING: readonly number[] = [
  0, 10, 20, 30, 45, 60, 80,
]; // T0..T6

export const BREAKTHROUGH_BASE_CHANCE_TODO_TUNING = 0.03;
/** Mnoży `diffusionPressureByDiscoveryId` (0..1, `technology/diffusion`). */
export const BREAKTHROUGH_PRESSURE_BOOST_TODO_TUNING = 0.05;

function knowledgeThresholdForTier(tier: number): number {
  return (
    TIER_KNOWLEDGE_THRESHOLD_TODO_TUNING[tier] ??
    TIER_KNOWLEDGE_THRESHOLD_TODO_TUNING[TIER_KNOWLEDGE_THRESHOLD_TODO_TUNING.length - 1]!
  );
}

function isEligible(
  discovery: DiscoveryEligibilityRule,
  technologyState: TechnologyState,
): boolean {
  const knowledgeLevel = technologyState.knowledge[discovery.primaryDomainId] ?? 0;
  if (knowledgeLevel < knowledgeThresholdForTier(discovery.tier)) return false;

  return discovery.prerequisites.every((prerequisiteId) => {
    const status = technologyState.discoveries[prerequisiteId]?.status ?? "UNKNOWN";
    return status !== "UNKNOWN";
  });
}

/**
 * Czysta, rekonstruowalna (Entity Data Model §27: "eligibility może być
 * cache i musi dać się odtworzyć") -- sama nie czyta ani nie zapisuje
 * `technologyState.eligibleDiscoveryIds`, tylko `knowledge`/`discoveries`.
 * Obejmuje odkrycia w KAŻDYM statusie spełniającym warunki, nie tylko
 * `UNKNOWN` -- "eligible" to własność wiedzy/prerekwizytów, niezależna od
 * tego, czy breakthrough już zaszedł; to `evaluateBreakthroughs` filtruje
 * do `UNKNOWN`.
 */
export function computeEligibleDiscoveryIds(
  technologyState: TechnologyState,
  discoveryRulesById: Readonly<Record<string, DiscoveryEligibilityRule>>,
): readonly string[] {
  const eligible: string[] = [];
  for (const id of Object.keys(discoveryRulesById).sort()) {
    if (isEligible(discoveryRulesById[id]!, technologyState)) eligible.push(id);
  }
  return eligible;
}

export interface UpdateEligibilityResult {
  readonly technologyState: TechnologyState;
  readonly facts: readonly FactInput<boolean>[];
}

/**
 * Przelicza cache eligibility i zapisuje go z powrotem
 * (`setEligibleDiscoveryIds`), emitując `discovery_became_eligible` dla
 * odkryć nowo eligible w tym ticku, wciąż `UNKNOWN` (odkrycie, które jest
 * już KNOWN/AVAILABLE/ADOPTED i ponownie wchodzi do zbioru eligible --
 * np. po cofnięciu statusu prerekwizytu, co dziś nigdy się nie zdarza,
 * ale sprawdzenie jest tanie -- nie odpala faktu ponownie).
 */
export function updateEligibility(
  technologyState: TechnologyState,
  discoveryRulesById: Readonly<Record<string, DiscoveryEligibilityRule>>,
): UpdateEligibilityResult {
  const previouslyEligible = new Set(technologyState.eligibleDiscoveryIds);
  const nextEligible = computeEligibleDiscoveryIds(technologyState, discoveryRulesById);

  const facts: FactInput<boolean>[] = [];
  for (const discoveryId of nextEligible) {
    if (previouslyEligible.has(discoveryId)) continue;
    const status = technologyState.discoveries[discoveryId]?.status ?? "UNKNOWN";
    if (status !== "UNKNOWN") continue;
    facts.push({
      type: "discovery_became_eligible",
      subject: { entityType: "discovery", entityId: discoveryId },
      location: { regionId: technologyState.regionId },
      values: { before: false, after: true },
    });
  }

  return {
    technologyState: setEligibleDiscoveryIds(technologyState, nextEligible),
    facts,
  };
}

export interface EvaluateBreakthroughsInput {
  readonly technologyState: TechnologyState;
  readonly regionId: string;
  readonly tick: number;
  readonly rng: RngStream;
  /** 0..1 per discoveryId, z `technology/diffusion::computeDiffusionPressure`. Domyślnie 0 (brak presji sąsiadów). */
  readonly diffusionPressureByDiscoveryId?: Readonly<Record<string, number>>;
}

export interface EvaluateBreakthroughsResult {
  readonly technologyState: TechnologyState;
  readonly facts: readonly FactInput<string>[];
}

/**
 * Dla każdego `UNKNOWN` odkrycia w `technologyState.eligibleDiscoveryIds`
 * (posortowane, jeden rzut `rng` każde -- deterministyczna kolejność):
 * rzut `BASE + BOOST * pressure`; sukces przenosi odkrycie do `KNOWN`
 * i emituje `discovery_occurred`. Musi iść PO `updateEligibility` w tym
 * samym ticku, żeby `eligibleDiscoveryIds` było aktualne.
 */
export function evaluateBreakthroughs(
  input: EvaluateBreakthroughsInput,
): EvaluateBreakthroughsResult {
  const { regionId, tick, rng } = input;
  const diffusionPressureByDiscoveryId = input.diffusionPressureByDiscoveryId ?? {};
  let technologyState = input.technologyState;
  const facts: FactInput<string>[] = [];

  for (const discoveryId of [...technologyState.eligibleDiscoveryIds].sort()) {
    if ((technologyState.discoveries[discoveryId]?.status ?? "UNKNOWN") !== "UNKNOWN") {
      continue;
    }

    const pressure = diffusionPressureByDiscoveryId[discoveryId] ?? 0;
    const chance =
      BREAKTHROUGH_BASE_CHANCE_TODO_TUNING + BREAKTHROUGH_PRESSURE_BOOST_TODO_TUNING * pressure;
    if (rng.nextFloat() >= chance) continue;

    technologyState = setDiscoveryState(technologyState, discoveryId, {
      status: "KNOWN",
      discoveredTick: tick,
      sourceRegionId: regionId,
    });
    facts.push({
      type: "discovery_occurred",
      subject: { entityType: "discovery", entityId: discoveryId },
      location: { regionId },
      values: { before: "UNKNOWN", after: "KNOWN" },
    });
  }

  return { technologyState, facts };
}

/**
 * Tier technologiczny regionu = najwyższy tier wśród jego odkryć
 * `AVAILABLE`/`ADOPTED` (technologia użyteczna, nie tylko znana); `-1` gdy
 * brak. Czysta funkcja nad `TechnologyState` + regułami contentu.
 */
export function availableTechnologyTier(
  technologyState: TechnologyState,
  discoveryRulesById: Readonly<Record<string, DiscoveryEligibilityRule>>,
): number {
  let tier = -1;
  for (const [discoveryId, entry] of Object.entries(technologyState.discoveries)) {
    if (entry.status !== "AVAILABLE" && entry.status !== "ADOPTED") continue;
    tier = Math.max(tier, discoveryRulesById[discoveryId]?.tier ?? -1);
  }
  return tier;
}

/**
 * „Region wchodzi w nowy tier” (decyzja właściciela 2026-09-26, nowe
 * zdarzenie Chronicle `technology_tier_reached`). Fakt tylko przy wzroście
 * tieru regionu do co najmniej T1 (T0 to punkt wyjścia, nie zdarzenie).
 * Podmiot to tier (`technology_tier:tier_N`), więc nowość w skali świata
 * w Chronicle oznacza „świat wchodzi w tier N” (pierwszy region).
 */
export function detectTierReached(
  before: TechnologyState,
  after: TechnologyState,
  discoveryRulesById: Readonly<Record<string, DiscoveryEligibilityRule>>,
): FactInput<number> | undefined {
  const tierBefore = availableTechnologyTier(before, discoveryRulesById);
  const tierAfter = availableTechnologyTier(after, discoveryRulesById);
  if (tierAfter <= tierBefore || tierAfter < 1) return undefined;
  return {
    type: "technology_tier_reached",
    subject: { entityType: "technology_tier", entityId: `tier_${tierAfter}` },
    location: { regionId: after.regionId },
    values: { before: Math.max(0, tierBefore), after: tierAfter, delta: tierAfter - Math.max(0, tierBefore) },
  };
}
