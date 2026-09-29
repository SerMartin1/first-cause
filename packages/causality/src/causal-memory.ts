import type { SimulationFact } from "./fact.js";

/**
 * Hierarchical Causal Memory (Causality Engine Spec SS47-49, CAUS-009
 * CANONICAL: "Historia używa HOT/WARM/PERMANENT"). HOT trzyma pełny
 * detal (dokładne ticki, pełne źródła); WARM to miejsce, gdzie
 * `causal-pruning.ts` kompresuje ciągi drobnych faktów; PERMANENT nigdy
 * nie jest przycinane (CAUS-010).
 */
export type CausalMemoryTier = "HOT" | "WARM" | "PERMANENT";

/**
 * SS47: "ostatnie 5-20 lat, dokładny limit zależy od benchmarków" --
 * configurable placeholder (reguła AGENTS.md "nierozstrzygnięta wartość
 * tuningowa"). Ticki VS są miesięczne (Time & Determinism Spec), więc
 * 120 ticków = 10 lat, środek ilustracyjnego zakresu ze specu.
 */
export const HOT_WINDOW_TICKS_TODO_TUNING = 120;

/**
 * SS49 kandydaci PERMANENT ("wielkie odkrycia, narodziny/upadki dużych
 * firm/branż... interwencje Architekta..."). Placeholder allow-lista
 * typów faktów (reguła AGENTS.md "nierozstrzygnięta wartość tuningowa")
 * plus każdy fakt, który Architekt wyprodukował wprost (`fact.architect`
 * jest zawsze istotny niezależnie od typu) -- rozszerzaj tę listę, gdy
 * powstają nowe systemy emitujące fakty, nigdy nie dopisuj tu
 * specyficznego id encji (reguła AGENTS.md 8).
 */
const PERMANENT_FACT_TYPES_TODO_TUNING: ReadonlySet<string> = new Set([
  "discovery_occurred",
  "company_founded",
  "settlement_stage_changed",
  "settlement_abandoned",
  "resource_depleted",
]);

export function isAnchor(fact: SimulationFact): boolean {
  return fact.architect !== undefined || PERMANENT_FACT_TYPES_TODO_TUNING.has(fact.type);
}

/**
 * `mustKeep` jest decydowane przez wywołującego (`causal-pruning.ts`'s
 * backward reachability od anchors, CAUS-010) -- ta funkcja stosuje
 * tylko regułę HOT-window/PERMANENT-po-typie, która nie potrzebuje
 * kontekstu grafu.
 */
export function classifyTier(
  fact: SimulationFact,
  currentTick: number,
  mustKeep: boolean,
  hotWindowTicks: number = HOT_WINDOW_TICKS_TODO_TUNING,
): CausalMemoryTier {
  if (currentTick - fact.tick <= hotWindowTicks) return "HOT";
  if (mustKeep || isAnchor(fact)) return "PERMANENT";
  return "WARM";
}
