import { z } from "zod";
import { ContentIdSchema } from "./content-id.js";

/**
 * Shared field-level building blocks for content definition schemas
 * (Technology Stack Decision SS21: "each content type has a Zod schema").
 * Keeping these in one place means every definition type validates
 * references, tags and phases identically instead of re-deriving the
 * rules per type.
 */

/** A single ID reference to another content definition. */
export const IdRefSchema = ContentIdSchema;

/** Zero or more ID references to other content definitions. */
export const IdRefArraySchema = z.array(ContentIdSchema).default([]);

/** Free-form descriptive tags (not IDs, not cross-referenced). */
export const TagArraySchema = z.array(z.string().min(1)).default([]);

/** A key into the localization bundles (checked against `en`/other locales by the content validator, not by Zod). */
export const LocalizationKeySchema = z.string().min(1);

/**
 * A structurally-present but not-yet-mechanically-specified data bag
 * (AGENTS.md "configurable placeholder + TODO tuning"): the field exists
 * per Content-Localization-Spec's minimal field list, but its exact
 * shape belongs to the system milestone that consumes it (e.g. M5
 * Resources, M7 Production, M11 Company AI), not to M2 Data Foundation.
 */
export const OpenRecordSchema = z.record(z.string(), z.unknown()).default({});

export const NonNegativeNumberSchema = z.number().finite().nonnegative();
export const NonNegativeIntSchema = z.number().int().nonnegative();
