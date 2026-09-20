import type { ChronicleEntry } from "./types.js";

/** SS55 Chronicle Sensitivity -- "zmieniają tylko raportowanie", never the simulation or stored entries. */
export const CHRONICLE_SENSITIVITIES = ["CONCISE", "STANDARD", "DETAILED"] as const;
export type ChronicleSensitivity = (typeof CHRONICLE_SENSITIVITIES)[number];

/** SS59 example thresholds ("wartości są tuningiem"). */
export const SENSITIVITY_THRESHOLDS_TODO_TUNING: Readonly<Record<ChronicleSensitivity, number>> = {
  CONCISE: 60,
  STANDARD: 40,
  DETAILED: 25,
};

/**
 * SS56 "Concise: Historic, World-Defining, najważniejsze Major, Turning
 * Points" -- a flagged Turning Point always clears every sensitivity
 * level regardless of its raw score, the other bands are a plain
 * threshold on `significance.total`.
 */
export function passesSensitivity(entry: ChronicleEntry, sensitivity: ChronicleSensitivity): boolean {
  if (entry.turningPoint) return true;
  return entry.significance.total >= SENSITIVITY_THRESHOLDS_TODO_TUNING[sensitivity];
}

/**
 * Pure filter -- never clones or mutates an entry (SS133 test: World
 * State/entry identity must stay unaffected by which sensitivity the
 * player picked). Stable order: `startTick` then `id`.
 */
export function filterBySensitivity(
  entries: readonly ChronicleEntry[],
  sensitivity: ChronicleSensitivity,
): readonly ChronicleEntry[] {
  return entries
    .filter((entry) => passesSensitivity(entry, sensitivity))
    .sort((a, b) => a.startTick - b.startTick || a.id.localeCompare(b.id));
}
