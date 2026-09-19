import {
  InvariantViolationError,
  assertNonNegative,
  assertPositive,
} from "../core/validation.js";

/**
 * ArchitectInfluenceState (Architect Intervention & Influence Spec SS4/
 * SS6, ARCH-003 "Influence ma skalę 0--100"). Świat ma dokładnie jeden
 * balans Influence (gracz jako Architekt, nie encja per-region) --
 * `WorldState.architectInfluence`, nie osobna kolekcja keyowana po id.
 *
 * SS6 definiuje też `ReservedInfluence`/`AvailableInfluence` dla modelu
 * Sustained (Influence zarezerwowane na czas trwania interwencji), ale
 * SS7 rekomenduje "dla VS preferować prostszy model" -- Instant, płacony
 * w całości przy wykonaniu. VS-INT-01..05 (M16) są wszystkie Instant, więc
 * `reserved`/`available` są świadomie pominięte (nie fabrykowane pola
 * zawsze równe 0) -- TODO: dodać, gdy pierwsza Sustained interwencja
 * naprawdę tego potrzebuje.
 */
export interface ArchitectInfluenceState {
  readonly current: number;
  readonly max: number;
}

const DEFAULT_MAX_INFLUENCE = 100;

function assertInRange(value: number, min: number, max: number, label: string): number {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new InvariantViolationError(
      `${label} must be a finite number in [${min}, ${max}], got ${String(value)}`,
    );
  }
  return value;
}

/** VS zaczyna z pełnym balansem (SS4: "rekomendowany maksymalny stan: 100") -- TODO tuning, jeśli playtesty każą zaczynać niżej. */
export function createArchitectInfluenceState(
  max: number = DEFAULT_MAX_INFLUENCE,
): ArchitectInfluenceState {
  assertPositive(max, "ArchitectInfluenceState.max");
  return { current: max, max };
}

/**
 * Wydaje `amount` Influence. Wywołujący (`architect/validation`)
 * odpowiada za sprawdzenie `amount <= state.current` PRZED wywołaniem --
 * ten strażnik tylko odrzuca niemożliwy stan (ujemny balans), nie jest
 * substytutem walidacji przed wykonaniem (ARCH's "Validation przed
 * wykonaniem", SS26).
 */
export function spendInfluence(
  state: ArchitectInfluenceState,
  amount: number,
): ArchitectInfluenceState {
  assertInRange(amount, 0, state.current, "spendInfluence.amount");
  return { ...state, current: state.current - amount };
}

/** Regeneracja per-tick, clamped do `max` (SS164/OPEN-002: tempo do tuningu po playtestach). */
export function regenerateInfluence(
  state: ArchitectInfluenceState,
  amountPerTick: number,
): ArchitectInfluenceState {
  assertNonNegative(amountPerTick, "regenerateInfluence.amountPerTick");
  return { ...state, current: Math.min(state.max, state.current + amountPerTick) };
}
