# ADR-001 -- M1 Deterministic Core numeric and identity decisions

**Status:** ACCEPTED
**Date:** 2026-09-16
**Scope:** `packages/simulation/src/core`. Resolves the M1 decisions
flagged as OPEN by `Canonical Decisions v0.1` SS201 (RNG algorithm/version,
stream derivation, ID strategy, rounding/overflow, canonical
serialization/checksum, Command ordering on tick, platform guarantees)
and OPEN-008 (money representation numeric details).

This is a short technical record per Technology Stack Decision SS90. It
does not restate the whole document and does not reopen anything already
CANONICAL in `Canonical Decisions v0.1` -- only the numeric/algorithmic
details that document explicitly left to M1.

---

## 1. RNG algorithm and version

**Decision:** custom `xoshiro128**` (Blackman & Vigna), 128-bit state as
four `uint32` words, seeded via `splitmix32`. Implemented from scratch in
`core/rng.ts` (Technology Stack Decision SS29: "Tworzymy własny moduł
deterministic RNG" -- not a third-party dependency).

- `RNG_ALGORITHM = "xoshiro128**"`, `RNG_VERSION = 1`, recorded next to
  the implementation and asserted by golden-vector tests.
- All arithmetic uses `Math.imul` / `>>> 0` (32-bit integer ops), which
  the ECMAScript spec defines exactly -- no floating-point divergence
  between platforms is possible in the core generator.
- Changing the algorithm or the constants is a `rngVersion` bump
  (Save/Determinism Spec SS12): a compatibility-sensitive change, not a
  patch.
- "Golden tests" here means regression tests: a fixed seed's first N
  outputs are captured once and hard-coded as the expected sequence, not
  conformance to an external published vector set. This satisfies
  SAVE-002 (repeatable) without requiring bit-exact parity with a
  third-party xoshiro128** implementation we cannot verify offline.

## 2. RNG streams and stream-seed derivation

**Decision:** `StreamSeed = fnv1a32(\`${worldSeed}:${streamName}:${scopeId ?? ""}\`)`,
per Save/Determinism Spec SS15, expanded to the 4-word xoshiro state via
`splitmix32`. Stream names fixed at the SAVE-003 list: `world_generation`,
`demography`, `company_ai`, `entrepreneurship`, `migration`, `discovery`,
`events`, `naming`. `worldSeed` is `string | number`, normalized to a
string before hashing so a numeric and an equal-looking string seed are
treated identically and both remain human-typeable/copyable (World
Generation Spec SS50).

`fnv1a32` (FNV-1a, 32-bit, offset basis `0x811c9dc5`, prime
`0x01000193`) is used only as a deterministic string hash for stream
seeding and for `core/checksum`, never as a security primitive.

## 3. Deterministic IDs

**Decision:** `createIdGenerator(prefix)` in `core/ids.ts` hands out
`` `${prefix}_${counter}` `` (zero-padded to 6 digits, e.g.
`company_004281`, matching the Save/Determinism Spec SS18 example) from a
monotonic per-prefix counter that is part of serializable core state --
not a hash and not `crypto.randomUUID`. Each domain (companies, regions,
facts, ...) gets its own generator/prefix when that domain is introduced
(M3+); M1 only ships the generic, reusable mechanism.

## 4. Rounding and money representation (resolves OPEN-008)

**Decision:**

- Money is represented internally as an **integer number of minor units**
  (`MONEY_SCALE = 100`, i.e. 1 major unit = 100 minor units -- "cents").
  Floats are never the source of truth for money (Technology Stack
  Decision SS85).
- Conversion from a fractional major-unit amount to minor units rounds
  with **round-half-to-even ("banker's rounding")**, implemented in
  `core/rounding.ts::roundHalfEven`. Chosen over round-half-away-from-zero
  because Vertical Slice runs hundreds of simulated years of repeated
  aggregation (wages, prices, taxes per tick); round-half-to-even does
  not accumulate a systematic upward bias the way round-half-up does
  over that many operations.
- Overflow: all money/quantity values are asserted to stay within
  `Number.MAX_SAFE_INTEGER` via `core/validation.ts::assertSafeInteger`.
  Exceeding it throws an `InvariantViolationError` rather than silently
  losing precision -- this is far below any Vertical Slice economy's
  actual scale (24-40 regions), so it is a bug detector, not a real
  ceiling.
- Non-money quantities (goods, population) stay plain integers/floats per
  their own domain rules once those domains exist (M3+); `core/rounding`
  only fixes the *money* policy now, as OPEN-008 required.

## 5. Canonical serialization and WorldChecksum

**Decision:**

- `core/serialization.ts::canonicalStringify` recursively converts a
  value into a stable JSON string: object keys sorted lexicographically,
  `Map` entries sorted by (stringified) key, `Set` values sorted, arrays
  keep index order (already stable), `undefined` fields omitted the same
  way `JSON.stringify` omits them. This directly implements Technology
  Stack Decision SS83.
- `core/checksum.ts::computeChecksum` hashes the canonical string with
  two independently-seeded FNV-1a-32 passes and concatenates them as a
  16 hex-character string, to lower accidental collision risk versus a
  single 32-bit hash while staying dependency-free and fast enough for a
  per-tick check. `CHECKSUM_ALGORITHM = "fnv1a32x2-v1"` is recorded and
  versioned (Technology Stack Decision SS84); this is a determinism/testing
  checksum (SAVE-010), not a cryptographic one.

## 6. Command ordering on a tick (command boundary)

**Decision:** `core/commands.ts::CommandBoundary` queues commands as
`{ scheduledForTick, sequence, command }`. `sequence` is a monotonic
counter assigned at `enqueue()` time (not derived from wall-clock or
random), so two commands enqueued for the same tick always have a
well-defined, stable relative order. `drain(tick)` returns every queued
command whose `scheduledForTick === tick`, sorted by `sequence` ascending,
and removes them from the queue. Per SAVE-006, commands are only ever
drained and applied at a tick boundary -- there is no mid-tick command
application in M1 or later within Vertical Slice.

M1 ships the generic boundary only; no concrete Command types exist yet
(those arrive with the systems that need them, M3+). The headless runner
(`core/runner.ts`) drains the boundary once per tick as a no-op integration
point, proving the contract before any real command exists.

## 7. Platform guarantees

**Decision:** determinism is guaranteed across all Vertical Slice target
platforms (Windows/Linux, the two covered by CI) under a fixed Node.js
major version (`22.x`, per `package.json#engines`). This is achieved by
construction: the RNG, ID generator, canonical serialization and checksum
use only 32-bit integer bitwise/`Math.imul` operations and integer
arithmetic bounded by `Number.MAX_SAFE_INTEGER` -- no operations whose
result is left underspecified by the ECMAScript spec. No cross-platform
compiled/native code is introduced in M1. Revisit if/when Rust/WASM hot
paths are introduced (Technology Stack Decision SS88, explicitly a later
optimization step, not M1 scope).

## 8. Consequences

- `packages/simulation/src/core` has no runtime dependency beyond
  `@first-cause/shared` types; the ESLint config additionally forbids
  `Math.random`, `Date.now`, `new Date()` and `crypto.randomUUID` inside
  `packages/simulation/src/core/**` (SAVE-004), enforced at lint time in
  addition to the golden-vector/regression tests.
- Every later milestone that needs money must go through
  `core/rounding.ts` rather than inventing its own rounding; every later
  milestone that needs a stable entity ID must go through
  `core/ids.ts::createIdGenerator` rather than `crypto.randomUUID` or a
  counter of its own.
- If a future milestone needs a different `MONEY_SCALE` (e.g. sub-cent
  precision for some good), that is a new ADR, not a silent change here.
