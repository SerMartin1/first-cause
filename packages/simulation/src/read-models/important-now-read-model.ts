import type { WorldState } from "@first-cause/entities";

/**
 * ImportantNowReadModel (Implementation Roadmap M4 UI Foundation;
 * UI/UX World Command Center Spec SS21-24 "Important Now" right panel).
 *
 * Priority order per SS23: required attention, major change, architect
 * consequence, crisis, opportunity, discovery, historical event.
 * `summaryKey` is a localization key, never a literal string
 * (CONTENT-007: no user-facing strings in Simulation Core).
 *
 * Every source SS21 lists (Chronicle candidates, shortages, company
 * closures, settlement changes, discoveries, resource depletion,
 * migration waves, intervention consequences) belongs to a system that
 * does not exist yet (M8/M10/M13/M15/M16/M19). `buildImportantNowReadModel`
 * therefore always returns an empty list today -- the contract exists
 * (DoD point 2: "typed Read Model ... or an explicitly documented
 * absence of user-facing data") so the Important Now panel can be built
 * against it now; real items start appearing as each producing system
 * lands.
 */
export type ImportantNowCategory =
  | "required_attention"
  | "major_change"
  | "architect_consequence"
  | "crisis"
  | "opportunity"
  | "discovery"
  | "historical_event";

export interface ImportantNowItem {
  readonly id: string;
  readonly category: ImportantNowCategory;
  readonly tick: number;
  readonly regionId: string | undefined;
  readonly summaryKey: string;
}

/** `_state` is the future input surface; unused until a real source exists. */
export function buildImportantNowReadModel(
  _state: WorldState,
): readonly ImportantNowItem[] {
  return [];
}
