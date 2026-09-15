/**
 * Engine version reported via GET_CORE_STATUS.
 *
 * M0 scope: a fixed placeholder. Real engine/schema/content versioning
 * (SAVE-007, Canonical Decisions) is introduced with save/load in M20.
 */
export const ENGINE_VERSION = "0.0.0-m0" as const;
