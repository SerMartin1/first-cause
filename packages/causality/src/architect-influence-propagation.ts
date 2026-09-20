/**
 * Propagacja Architect Influence (Causality Engine Spec SS36-39,
 * Architect Intervention & Influence Spec SS33). Root Fact niesie
 * `influenceStrength: 1.0` wprost (M16, `FactInput.architect`, ustawione
 * w momencie interwencji -- nietknięte przez M17). Wszystko poniżej
 * (hop 1+) jest WYPROWADZONE, nigdy nie zapisywane z powrotem na
 * niemutowalny fakt -- `WorldRunner` trzyma to w osobnej mapie
 * `architectInfluenceByFactId`, aktualizowanej przy każdym rozwiązaniu
 * nowych `CausalEdge` w danym ticku.
 */

/**
 * SS37 Natural Decay na hop. Własny przykład ze specu
 * (1.00 -> 0.85 -> 0.70 -> 0.48 -> 0.31 -> 0.17) jest explicite
 * ilustracyjny ("wartości są przykładowe"), nie kanoniczną stałą --
 * configurable placeholder (reguła AGENTS.md "nierozstrzygnięta wartość
 * tuningowa").
 */
export const PERSISTENCE_MODIFIER_TODO_TUNING = 0.7;

/** SS36: `ChildArchitectInfluence = ParentArchitectInfluence x EdgeStrength x PersistenceModifier`. `edgeStrength` oczekiwane w `[0, 1]` (`Math.abs(contribution)`, nigdy signed -- czynnik hamujący wciąż PRZENOSI wpływ dalej, tylko zmniejsza magnitude efektu, co jest osobną sprawą od tego, czyj wpływ się propaguje). */
export function computeChildInfluence(
  parentInfluence: number,
  edgeStrength: number,
  persistenceModifier: number = PERSISTENCE_MODIFIER_TODO_TUNING,
): number {
  return parentInfluence * edgeStrength * persistenceModifier;
}

/**
 * SS36 scalanie wielu ścieżek: `Combined = 1 - Product(1 - pathInfluence_i)`
 * -- probabilistyczne OR, nigdy zwykła suma (co mogłoby przekroczyć 1.0
 * przy więcej niż jednej przyczyniającej się ścieżce). Puste `paths`
 * (żaden wpływ Architekta nie dociera do tego faktu) scala się do `0`.
 */
export function combineInfluences(paths: readonly number[]): number {
  let productOfComplements = 1;
  for (const path of paths) {
    productOfComplements *= 1 - path;
  }
  return 1 - productOfComplements;
}
