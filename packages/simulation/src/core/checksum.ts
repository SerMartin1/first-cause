import { canonicalStringify } from "./serialization.js";
import { fnv1a32, toHex32 } from "./hash.js";

/**
 * WorldChecksum (SAVE-010, Technology Stack Decision SS84): a
 * determinism/testing checksum, not a cryptographic one. Two
 * independently-seeded FNV-1a-32 passes over the canonical serialization
 * are concatenated into a 16 hex-character string, lowering accidental
 * collision risk versus a single 32-bit hash while staying
 * dependency-free and fast enough to run every tick. See ADR-001 SS5.
 */
export const CHECKSUM_ALGORITHM = "fnv1a32x2-v1" as const;

const SECOND_PASS_SEED = 0x9747b28c;

export function computeChecksum(value: unknown): string {
  const canonical = canonicalStringify(value);
  const first = fnv1a32(canonical);
  const second = fnv1a32(canonical, SECOND_PASS_SEED);
  return `${toHex32(first)}${toHex32(second)}`;
}
