/**
 * SimulationFact (Causality Engine Spec SS4, CE-01 "Fact Infrastructure").
 *
 * "Simulation najpierw oblicza rzeczywistą zmianę stanu. Dopiero potem
 * Causality Engine zapisuje jej przyczyny" (SS0): a Fact records a
 * change that has already happened -- it never computes or infers one.
 *
 * M5 is the first real consumer (roadmap section 9: fact infra starts
 * at M5, grows with every later system). Only the fields a producer can
 * honestly fill in *today* are here: `causes` (needs CE-02/CE-03, M17),
 * `architect` (needs the Architect, M16), `significance` (needs
 * Chronicle scoring, M19) and `retention` (needs HOT/WARM/PERMANENT
 * memory management, M17+) are intentionally absent rather than filled
 * with placeholders -- the same "no field for a system that doesn't
 * exist yet" rule `packages/entities` follows.
 */
export interface FactSubject {
  readonly entityType: string;
  readonly entityId: string;
}

export interface FactLocation {
  readonly regionId: string;
  readonly settlementId?: string;
}

export interface FactValues<TValue = unknown> {
  readonly before: TValue;
  readonly after: TValue;
  readonly delta?: TValue;
}

/** What a producer hands to `FactStore.emit` -- everything except the store-assigned `id`. */
export interface FactInput<TValue = unknown> {
  readonly type: string;
  readonly subject: FactSubject;
  readonly location: FactLocation;
  readonly values: FactValues<TValue>;
}

export interface SimulationFact<TValue = unknown> extends FactInput<TValue> {
  readonly id: string;
  readonly tick: number;
}
