/**
 * FNV-1a (32-bit), used as a deterministic string hash for RNG stream
 * seeding (`core/rng.ts`) and for `core/checksum.ts`. Not a
 * cryptographic hash -- chosen purely for determinism, speed and being
 * dependency-free (ADR-001 SS2/SS5).
 */
const FNV_OFFSET_BASIS_32 = 0x811c9dc5;
const FNV_PRIME_32 = 0x01000193;

export function fnv1a32(input: string, seed: number = FNV_OFFSET_BASIS_32): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME_32);
  }
  return hash >>> 0;
}

export function toHex32(value: number): string {
  return (value >>> 0).toString(16).padStart(8, "0");
}
