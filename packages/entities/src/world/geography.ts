import { assertNonNegative } from "../core/validation.js";

/** Region.geography (Entity Data Model SS6). Static physical description. */
export type Terrain = "plains" | "hills" | "mountains" | "forest" | "desert" | "wetland";
export type Climate =
  "temperate" | "continental" | "arid" | "tropical" | "cold" | "mediterranean";
export type ElevationClass = "lowland" | "upland" | "highland";

export interface RegionGeography {
  readonly terrain: Terrain;
  readonly climate: Climate;
  /** Region area, in an as-yet-undefined unit (World Generation Spec, M22). */
  readonly area: number;
  /** 0..1: agricultural fertility. */
  readonly fertility: number;
  readonly waterAccess: boolean;
  readonly coastal: boolean;
  readonly elevationClass: ElevationClass;
}

export interface CreateRegionGeographyInput {
  readonly terrain: Terrain;
  readonly climate: Climate;
  readonly area: number;
  readonly fertility: number;
  readonly waterAccess: boolean;
  readonly coastal: boolean;
  readonly elevationClass: ElevationClass;
}

export function createRegionGeography(
  input: CreateRegionGeographyInput,
): RegionGeography {
  assertNonNegative(input.area, "RegionGeography.area");
  if (input.fertility < 0 || input.fertility > 1) {
    throw new RangeError(
      `RegionGeography.fertility must be within [0, 1], got ${input.fertility}`,
    );
  }
  return { ...input };
}
