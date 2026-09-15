# Changelog

All notable changes to this repository are recorded here, newest first.

Format: one entry per change/session, dated `YYYY-MM-DD`. This file
tracks *what changed in the repo* (docs, roadmap, code); it is not a
replacement for `docs/FIRST-CAUSE-Implementation-Roadmap-v0.1.md`
(milestone plan/status) or `docs/FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(design decisions) -- see those for the "why".

## 2026-09-15

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
