# Changelog

All notable changes to this repository are recorded here, newest first.

Format: one entry per change/session, dated `YYYY-MM-DD`. This file
tracks *what changed in the repo* (docs, roadmap, code); it is not a
replacement for `docs/FIRST-CAUSE-Implementation-Roadmap-v0.2.md`
(milestone plan/status) or `docs/FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(design decisions) -- see those for the "why".

## 2026-09-16

- Implemented **M2 -- Data Foundation** (`packages/content/src`): Zod
  schemas for all 10 in-scope content types (Resource, Good,
  CompanyArchetype, ProductionMethod, Discovery, Service, TransportMode,
  Intervention, EventType, ChronicleTemplate), built from
  Content-Localization-Spec SS41-50's minimal field lists (deeper
  economic modeling stays M5/M7 scope, not invented early).
  `schema/reference-field.ts` declares each type's reference fields
  declaratively, powering generic (not per-type) validators:
  `validators/reference-validation.ts` (missing references, DFS
  dependency-cycle detection, CONTENT-009 phase violations) and
  `validators/localization-coverage.ts` (missing `en` key = error,
  missing secondary-locale key = warning). `loaders/content-pack.ts`
  (`loadContentPack`) ties everything together: per-type
  `JSON -> Zod -> duplicate-ID check -> DefinitionRegistry`
  (`create-definition-loader.ts`, generalized from M0's
  `loadResourceDefinitions`, now a thin wrapper over it) plus cross-type
  ID-collision checking and Content Statistics (SS147). Renamed the M0
  placeholder field `phase` -> `implementationPhase` and
  `finite` -> `renewable` on `ResourceDefinition` to match the canonical
  spec (CONTENT-008), updating the existing fixture/tests accordingly.
  Added real VS-subset content
  (`content/resources/{iron_ore,grain,timber}.json`,
  `content/goods/{flour,bread}.json`) with full EN/PL localization
  keys. Added 62 new tests: one per CONTENT-010 checklist item
  (duplicate ID, cross-type ID collision, missing ref, invalid range,
  dependency cycle, phase violation, missing EN key, missing
  secondary-locale warning), a content-load-determinism test, 40
  schema-level structural tests across all 10 types, and an integration
  test reading the real files from `content/`/`locales/` off disk.
  `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`
  (146/146), `pnpm build` and `pnpm test:e2e` all pass. Updated the
  roadmap (M2 = DONE, M3 = READY, "Wyniki wykonania" recorded) and
  README accordingly. No World State or gameplay systems exist yet
  (M3+), as scoped.
- Implemented **M1 -- Deterministic Core** (`packages/simulation/src/core`):
  `core/time` (tick-derived `SimulationClock`/`tickToDate`, 1 tick = 1
  month), `core/rng` (from-scratch `xoshiro128**` seeded via
  `splitmix32`, 8 SAVE-003 named streams derived via `fnv1a32`, unbiased
  `nextInt` via Lemire rejection sampling), `core/ids` (deterministic
  per-prefix `IdGenerator`), `core/validation`
  (finite/non-negative/safe-integer assertions), `core/rounding`
  (resolves OPEN-008: integer minor-unit money, `MONEY_SCALE = 100`,
  round-half-to-even), `core/serialization` (`canonicalStringify` --
  sorted object keys/Map entries/Set values), `core/checksum`
  (`computeChecksum`, `fnv1a32x2-v1`), `core/commands`
  (`CommandBoundary` with deterministic same-tick ordering, SAVE-006),
  and `core/runner` (`HeadlessRunner` tying them together: `step`,
  `runTicks`, `getState`/`fromState`, `checksum`). Added
  `docs/adr/ADR-001-m1-deterministic-core.md` recording the numeric/
  algorithm decisions `Canonical Decisions` SS201/OPEN-008 left open for
  M1. Added an ESLint rule forbidding `Math.random`/`Date.now`/
  `new Date()`/`crypto.randomUUID` under `packages/simulation/src/core`
  (SAVE-004), verified with a probe file that it actually fires. Updated
  `pnpm sim:run` to also run a 12-tick `HeadlessRunner` demo. Added 62
  new Vitest tests, including the M1 Acceptance Gate itself (Technology
  Stack Decision SS98): 10 000 empty ticks reproducible, RNG golden
  vectors, x1-vs-batch checksum equality, and mid-run save/restore
  roundtrip. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm
  test` (94/94), `pnpm build` and `pnpm test:e2e` all pass. Updated the
  roadmap (M1 = DONE, M2 = READY, "Wyniki wykonania" recorded) and
  README accordingly. No World State or gameplay systems exist yet
  (M3+), as scoped.
- Reconciled documentation after M0/M0.1: current roadmap links now point
  to v0.2 and the next milestone is M1. Synchronized canonical stack,
  World Generation, VS save, money and UI decisions with existing specs;
  retained genuinely open implementation choices for an M1 ADR.
- Consolidated identical economy specs into the canonical `-PL` file,
  retaining `-POLSKI` as a compatibility link. Removed stale UI version
  metadata, clarified UI track timing and marked the master audit as
  historical. Recorded missing Golden UI references and the unavailable
  technology catalog; M15 documentation readiness is now PARTIAL.
  Fixed obsolete architecture/economy source filenames and updated
  completed next-document recommendations in the VS/UI specs.
  No gameplay code or milestone completion status was changed.

## 2026-09-15

- Completed **M0.1 Audit Fixes** (M0-01–M0-05): bounded IPC request and
  shutdown lifecycle with controlled-worker tests; Ubuntu Electron E2E
  runs under Xvfb; detached, deeply frozen content definitions and
  locale-independent ID ordering with regression tests. Synchronized
  README/roadmap status, package creation policy, semantic validation
  scope and audited dev results. M1 remains unimplemented; remote CI
  is not claimed as verified by local gates.

- Configured `origin` (`https://github.com/SerMartin1/first-cause`,
  private repo created via `gh repo create`) and pushed `main`
  (required refreshing the `gh` auth token with the `workflow` scope
  so `.github/workflows/ci.yml` could be pushed).

- Created `docs/FIRST-CAUSE-Implementation-Roadmap-v0.1.md`: translated
  the existing canonical documentation (`Canonical Decisions`,
  `Master Audit`, `Technology Stack Decision`, `World Generation Spec`,
  and all system specs) into an executable milestone sequence
  (`M0`-`M25` Vertical Slice + `M26`-`M29` post-VS), with dependency
  graph, critical path, checkpoints `CP0`-`CP7`, and per-milestone
  Definition of Done.
- Implemented **M0 -- Repository Foundation**: pnpm monorepo
  (`apps/desktop`, `packages/{shared,content,localization,simulation}`),
  TypeScript strict, Electron (`electron-vite`) + React + Vite shell,
  a real `worker_threads` Simulation Worker with typed IPC
  (`PING`/`PONG`, `GET_CORE_STATUS`), content foundation (Zod schema +
  `DefinitionRegistry` + loader + one real definition, `iron_ore`),
  EN/PL localization foundation (`i18next`/`react-i18next`), Vitest +
  React Testing Library + Playwright (Electron E2E smoke test),
  ESLint (with an architecture-boundary rule keeping Simulation Core
  free of React/Electron imports) + Prettier, and GitHub Actions CI.
- Fixed a real bug found during M0 verification: `electron-vite`'s
  default `externalizeDepsPlugin()` left `@first-cause/shared` (an ESM
  package) as a runtime `require()` in the CJS main/preload bundle,
  causing `ERR_REQUIRE_ESM` and preventing the app from starting at
  all. Fixed by excluding that package from externalization in
  `apps/desktop/electron.vite.config.ts` so esbuild inlines it instead.
- Updated the roadmap after M0: `M0 = DONE`, `M1 = READY`, with a
  "Wyniki wykonania" note recording what was built, the bug above, and
  remaining technical debt (P1: `pnpm dev`/HMR not interactively
  verified in this environment; P2: `packages/entities`/`worldgen` not
  yet scaffolded, no installer yet).
- Initial commit: `475ffd8` -- "feat: establish FIRST CAUSE roadmap and
  M0 foundation". No remote configured yet, so nothing has been pushed.
- Added this `CHANGELOG.md` and the accompanying rule in `AGENTS.md` to
  record every future change here with its date.
