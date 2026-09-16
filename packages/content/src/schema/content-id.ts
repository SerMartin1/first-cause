import { z } from "zod";

/**
 * Stable, language-neutral content identifier.
 *
 * Canonical rule (CONTENT-006 / Technology Stack Decision SS23): snake_case,
 * language-neutral, stable across renames. Example: "iron_ore".
 */
export const ContentIdSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/,
    "Content ID must be snake_case and language-neutral (e.g. 'iron_ore').",
  );

export type ContentId = z.infer<typeof ContentIdSchema>;

/**
 * Content activation phase (CONTENT-008). Phase gates *when* a definition
 * is active in a running world; it does not change engine behaviour.
 */
export const ContentPhaseSchema = z.enum(["VS", "MVP", "FULL"]);

export type ContentPhase = z.infer<typeof ContentPhaseSchema>;

/**
 * Activation order (earliest first). CONTENT-009: content in an earlier
 * phase must never depend exclusively on a later-phase definition.
 */
export const CONTENT_PHASE_RANK: Readonly<Record<ContentPhase, number>> = {
  VS: 0,
  MVP: 1,
  FULL: 2,
};
