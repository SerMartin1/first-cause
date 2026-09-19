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
 * `significance` (needs Chronicle scoring, M19) i `retention` (needs
 * HOT/WARM/PERMANENT memory management, M17+) są nadal świadomie
 * nieobecne -- to samo "no field for a system that doesn't exist yet"
 * co `packages/entities` przestrzega. `architect` (M16, Architect
 * Intervention & Influence Spec SS30/SS32) jest teraz obecne: sam Root
 * Fact znaczony `influenceStrength: 1.0` (SS32 "Direct Architect
 * Influence"). Propagacja tego wpływu do potomnych faktów
 * (`ChildInfluence = ParentInfluence x CausalContribution x Decay`,
 * SS33) wymaga realnego grafu przyczynowego -- to M17, nie tutaj.
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

/**
 * ARCH-007/SS32: obecne tylko na Root Facty, które Architekt faktycznie
 * wytworzył. `influenceStrength` to zawsze `1.0` dla Root Facta samego w
 * sobie (bezpośredni efekt interwencji) -- ułamkowe wartości powstaną
 * dopiero przy propagacji przez potomne facty w M17.
 */
export interface ArchitectFactAttribution {
  readonly interventionId: string;
  readonly influenceStrength: number;
}

/** What a producer hands to `FactStore.emit` -- everything except the store-assigned `id`. */
export interface FactInput<TValue = unknown> {
  readonly type: string;
  readonly subject: FactSubject;
  readonly location: FactLocation;
  readonly values: FactValues<TValue>;
  readonly architect?: ArchitectFactAttribution;
}

export interface SimulationFact<TValue = unknown> extends FactInput<TValue> {
  readonly id: string;
  readonly tick: number;
}
