import type { TechnologyState } from "@first-cause/entities";
import { setDiscoveryState } from "@first-cause/entities";
import type { FactInput } from "@first-cause/causality";
import { clamp } from "../economy/company-ai/decision-framework.js";

/**
 * Dyfuzja Dostępności między połączonymi regionami (`technology/diffusion`,
 * M15, Acceptance Gate roadmapy: "dyfuzja wiedzy jest widoczna między
 * połączonymi regionami"). Czyta stabilny snapshot `TechnologyState`
 * każdego regionu sprzed ticka (ten sam idiom "czytaj `worldState.X`,
 * pisz do świeżej kopii", którego krok Handlu w `economy-tick.ts` już
 * używa dla `worldState.regions`, mutując własną kopię `regions`) --
 * nigdy własnych, dopiero powstających zmian tego ticka, więc kolejność
 * regionów w dyfuzji w obrębie jednego ticka nie zmienia wyniku.
 */
export const AVAILABILITY_ORGANIC_RATE_TODO_TUNING = 0.05;
/** Mnoży `DiffusionSignal.pressure` (0..1). */
export const AVAILABILITY_DIFFUSION_RATE_TODO_TUNING = 0.08;
export const AVAILABILITY_THRESHOLD_TODO_TUNING = 0.5;

export interface DiffusionSignal {
  /** 0..1: udział połączonych regionów, w których to odkrycie jest AVAILABLE/ADOPTED. */
  readonly pressure: number;
  /** Pierwszy (posortowany) połączony region przyczyniający się do `pressure` -- deterministyczna proweniencja. */
  readonly sourceRegionId: string;
}

/**
 * Czysta funkcja. W wyniku (rzadka mapa) pojawiają się tylko odkrycia
 * z co najmniej jednym przyczyniającym się sąsiadem -- wywołujący
 * traktują brakujący wpis jako `pressure: 0`. Zasila zarówno
 * `technology/discoveries::evaluateBreakthroughs` (podbija szansę
 * breakthrough dla wciąż-`UNKNOWN` odkryć), jak i `growAvailability`
 * niżej (zwiększa `availability` dla `KNOWN`) -- ten sam sygnał, dwóch
 * różnych konsumentów, zgodnie z wejściem "pressure" do Discovery Engine
 * z AI Decision Model §62.
 */
export function computeDiffusionPressure(
  regionId: string,
  connectedRegionIds: readonly string[],
  technologyStatesByRegionId: Readonly<Record<string, TechnologyState>>,
  discoveryIds: readonly string[],
): Readonly<Record<string, DiffusionSignal>> {
  const neighbors = [...new Set(connectedRegionIds)]
    .filter((id) => id !== regionId)
    .sort();
  if (neighbors.length === 0) return {};

  const signals: Record<string, DiffusionSignal> = {};
  for (const discoveryId of [...discoveryIds].sort()) {
    const contributing = neighbors.filter((neighborRegionId) => {
      const status =
        technologyStatesByRegionId[neighborRegionId]?.discoveries[discoveryId]?.status;
      return status === "AVAILABLE" || status === "ADOPTED";
    });
    if (contributing.length === 0) continue;
    signals[discoveryId] = {
      pressure: clamp(contributing.length / neighbors.length, 0, 1),
      sourceRegionId: contributing[0]!,
    };
  }
  return signals;
}

export interface GrowAvailabilityResult {
  readonly technologyState: TechnologyState;
  readonly facts: readonly FactInput[];
}

/**
 * Dla każdego `KNOWN` odkrycia w `technologyState`: zwiększa
 * `availability` o stawkę organiczną plus boost skalowany presją dyfuzji,
 * clamp do `[0, 1]`. Przekroczenie `AVAILABILITY_THRESHOLD_TODO_TUNING`
 * przenosi odkrycie do `AVAILABLE` (discovery ≠ availability: to nigdy
 * nie może zdarzyć się w TYM SAMYM ticku, w którym odkrycie staje się
 * `KNOWN`, bo ta funkcja czyta tylko odkrycia, które WESZŁY jako już
 * `KNOWN` -- `evaluateBreakthroughs` i `growAvailability` biegną raz na
 * tick każde, ale świeżo-`KNOWN` odkrycie zaczyna z `availability` = 0).
 */
export function growAvailability(
  technologyState: TechnologyState,
  diffusionSignalByDiscoveryId: Readonly<Record<string, DiffusionSignal>>,
): GrowAvailabilityResult {
  let state = technologyState;
  const facts: FactInput[] = [];

  for (const discoveryId of Object.keys(state.discoveries).sort()) {
    const entry = state.discoveries[discoveryId]!;
    if (entry.status !== "KNOWN") continue;

    const signal = diffusionSignalByDiscoveryId[discoveryId];
    const pressure = signal?.pressure ?? 0;
    const before = entry.availability;
    const after = clamp(
      before +
        AVAILABILITY_ORGANIC_RATE_TODO_TUNING +
        AVAILABILITY_DIFFUSION_RATE_TODO_TUNING * pressure,
      0,
      1,
    );
    const becomesAvailable = after >= AVAILABILITY_THRESHOLD_TODO_TUNING;

    if (after === before && !becomesAvailable) continue;

    state = setDiscoveryState(state, discoveryId, {
      availability: after,
      status: becomesAvailable ? "AVAILABLE" : entry.status,
      diffusionSource: signal ? signal.sourceRegionId : entry.diffusionSource,
    });

    if (becomesAvailable) {
      facts.push({
        type: "discovery_became_available",
        subject: { entityType: "discovery", entityId: discoveryId },
        location: { regionId: state.regionId },
        values: { before: "KNOWN", after: "AVAILABLE" },
      });
    }
    if (pressure > 0) {
      facts.push({
        type: "discovery_diffused",
        subject: { entityType: "discovery", entityId: discoveryId },
        location: { regionId: state.regionId },
        values: { before, after },
      });
    }
  }

  return { technologyState: state, facts };
}
