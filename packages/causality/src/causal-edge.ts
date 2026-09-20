/**
 * CausalEdge (Causality Engine Spec SS11-12, CE-03 "Edges"). CausalEdge
 * to WŁASNY obiekt, nigdy pole na `SimulationFact` -- `FactStore` jest
 * append-only (SS0: fakt nigdy nie jest edytowany po wyemitowaniu), a
 * fakty z TEGO SAMEGO ticka nie mają jeszcze realnego `id` w momencie,
 * gdy system produkujący uznaje je za powiązane przyczynowo (`FactStore.
 * emit` przydziela `id` tylko wtedy, gdy batch faktycznie zostaje
 * zacommitowany). Trzymanie edges w osobnym store'ze (`causal-edge-
 * store.ts`) omija oba problemy: edge można dodać, gdy OBA końce mają
 * już realne id, niezależnie od tego, KIEDY każdy z nich powstał.
 *
 * `CausalFactor` to atomowa jednostka "dlaczego" (M11,
 * `packages/simulation`'s `decision-snapshot.ts` -- re-eksportowane
 * stamtąd dla wstecznej kompatybilności istniejących importów,
 * zdefiniowane tutaj, bo to współdzielony prymityw, na którym budują
 * zarówno `DecisionSnapshot.causalContext`, jak i rozwiązywanie
 * `CausalEdge`). Signed `contribution` (-1..1) koduje pozytywne vs.
 * negatywne przyczyny wprost (CAUS-005) -- bez osobnego pola
 * `direction`: "koszt mieszkania -0.28" (własny przykład Causality
 * Engine Spec SS25) to po prostu ujemny contribution.
 */
export interface CausalFactor {
  readonly key: string;
  readonly contribution: number;
}

/** SS12: 10 kanonicznych typów edge. */
export type CausalEdgeType =
  | "DIRECT"
  | "CONTRIBUTING"
  | "ENABLING"
  | "CONSTRAINING"
  | "AMPLIFYING"
  | "DAMPENING"
  | "TRIGGERING"
  | "SUBSTITUTING"
  | "DELAYED"
  | "STRUCTURAL";

export interface CausalEdgeInput {
  readonly sourceFactId: string;
  readonly targetFactId: string;
  readonly type: CausalEdgeType;
  /** 0..1, z konwencji `Math.abs(contribution)` -- jak silnie ta przyczyna wyjaśnia efekt (progi PRIMARY/SIGNIFICANT/MINOR/TRACE z SS13, patrz `causal-strength.ts`). */
  readonly strength: number;
  /** Signed -1..1 -- ta sama wartość, którą niósł źródłowy `CausalFactor.contribution`, zachowana na edge, żeby konsument nigdy nie musiał odtwarzać znaku tylko z `type`. */
  readonly contribution: number;
  /** Czytelny opis mechanizmu (CAUS-003: edge istnieje tylko wtedy, gdy tworzy go system, który ZNA mechanizm -- to jest ten mechanizm, nie etykieta korelacyjna). */
  readonly mechanism: string;
  /** System produkujący, np. `"migration"`, `"price-adjustment"` -- pozwala konsumentowi grupować/filtrować edges po domenie bez re-parsowania `mechanism`. */
  readonly system: string;
  /** Konkretny czynnik/zmienna, który ten edge reprezentuje, np. `"jobs"`, `"housing_cost"` -- zgodny z `CausalFactor.key`, z którego został wyprowadzony. */
  readonly variable: string;
}

export interface CausalEdge extends CausalEdgeInput {
  readonly id: string;
}
