import { assertNonNegative } from "../core/validation.js";

/**
 * Region.environment (Entity Data Model SS6). A data holder only -- no
 * environmental simulation logic exists yet (that belongs to systems
 * introduced from M5 onward: pollution from production, water stress
 * from extraction, etc.).
 */
export interface RegionEnvironment {
  /** 0..1: overall environmental quality. */
  readonly quality: number;
  /** 0..1: accumulated pollution. */
  readonly pollution: number;
  /** 0..1: water stress. */
  readonly waterStress: number;
  /** 0..1: soil condition. */
  readonly soilCondition: number;
  /** 0..1: forest pressure. */
  readonly forestPressure: number;
  readonly riskFactors: Readonly<Record<string, number>>;
}

function assertUnitInterval(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be within [0, 1], got ${String(value)}`);
  }
  return value;
}

/** A pristine, untouched region: full quality, zero pressure. */
export function createDefaultRegionEnvironment(): RegionEnvironment {
  return {
    quality: 1,
    pollution: 0,
    waterStress: 0,
    soilCondition: 1,
    forestPressure: 0,
    riskFactors: {},
  };
}

export function createRegionEnvironment(
  input: Partial<RegionEnvironment>,
): RegionEnvironment {
  const defaults = createDefaultRegionEnvironment();
  const merged: RegionEnvironment = { ...defaults, ...input };
  assertUnitInterval(merged.quality, "RegionEnvironment.quality");
  assertUnitInterval(merged.pollution, "RegionEnvironment.pollution");
  assertUnitInterval(merged.waterStress, "RegionEnvironment.waterStress");
  assertUnitInterval(merged.soilCondition, "RegionEnvironment.soilCondition");
  assertUnitInterval(merged.forestPressure, "RegionEnvironment.forestPressure");
  for (const [key, value] of Object.entries(merged.riskFactors)) {
    assertNonNegative(value, `RegionEnvironment.riskFactors.${key}`);
  }
  return merged;
}
