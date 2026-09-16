# FIRST CAUSE

FIRST CAUSE is a deterministic, data-driven world simulation. The player
is an **Architect / Observer** who changes conditions in a living world
economy of regions, population, production, trade, technology and
autonomous company AI -- the world reacts on its own, and every
consequence can be traced back through a real causal graph (`WHY?`),
selected into a `Chronicle`, and attributed to the intervention that
enabled it (`Butterfly Effect`).

> Full design and technical specifications live in [`docs/`](./docs),
> starting with
> [`FIRST-CAUSE-Canonical-Decisions-v0.1.md`](./docs/FIRST-CAUSE-Canonical-Decisions-v0.1.md)
> and
> [`FIRST-CAUSE-Implementation-Roadmap-v0.2.md`](./docs/FIRST-CAUSE-Implementation-Roadmap-v0.2.md).

## Current milestone

**M0 = DONE; M0.1 Audit Fixes = DONE; M1 = DONE; M2 = DONE; M3 = DONE;
M4 = DONE; M5 = READY (not started).**
M0.1 is a maintenance step, preserving the canonical M0–M29 numbering.
M1 -- Deterministic Core added a real, headless-testable deterministic
skeleton (`packages/simulation/src/core`): a tick-derived
`SimulationClock`, a from-scratch seeded `xoshiro128**` RNG with named
streams, deterministic IDs, canonical serialization + `WorldChecksum`,
money rounding policy, and a generic tick-boundary `CommandBoundary` --
see `docs/adr/ADR-001-m1-deterministic-core.md` for the numeric/algorithm
decisions and the roadmap's M1 "Wyniki wykonania" for what was verified.
M2 -- Data Foundation (`packages/content/src`) built the real
`JSON -> Zod -> semantic validation -> immutable Definition Registry`
pipeline for all 10 in-scope content types (Resource, Good,
CompanyArchetype, ProductionMethod, Discovery, Service, TransportMode,
Intervention, EventType, ChronicleTemplate), with cross-type reference,
dependency-cycle, phase-violation and localization-coverage validation
-- see the roadmap's M2 "Wyniki wykonania" for what was verified.
M3 -- World State Foundation (`packages/entities/src`) added typed
runtime entity shapes for World, Continent, Region, Connection,
ResourceDeposit, Settlement, PopulationCohort, Company, Market,
Inventory and TechnologyState, plus a `createWorldState` assembler
that validates every forward reference and *reconstructs* every
back-reference cache/index from canonical entity data (DATA-003/
DATA-004) -- see the roadmap's M3 "Wyniki wykonania" for what was
verified. M4 -- Black Mountain Reference Fixture added
`packages/worldgen` (a generic `JSON -> Zod -> entity factories ->
createWorldState` fixture loader that knows nothing about any specific
reference scenario) and the hand-written 8-region
`tests/worldgen/fixtures/black_mountain_reference.json`, plus the
first four typed UI Read Models in `packages/simulation/src/read-models`
(`WorldSummaryReadModel`, `RegionSummaryReadModel`,
`AtlasRegionReadModel`, `ImportantNowReadModel`) -- see the roadmap's
M4 "Wyniki wykonania" for what was verified, including a correction to
M3's `packages/entities` dependency that would otherwise have created a
workspace dependency cycle once `packages/simulation` needed entity
types. Next: **M5 -- Resources**. It still intentionally implements
**no gameplay systems** -- no economy, population simulation, AI,
causality, Chronicle, Architect, or a procedural World Generation
algorithm. Those begin at `M5` and onward; see the Implementation
Roadmap for the full milestone sequence.

## Requirements

- Node.js `22.x`
- pnpm `9.x` (`corepack enable` will pick up the pinned version from
  `package.json#packageManager`)

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Builds the workspace packages, then starts `electron-vite dev` (renderer
HMR + Electron main/preload watch, launching the app window).

## Headless simulation

`packages/simulation` is designed to run without Electron:

```bash
pnpm sim:run
```

This prints the same `CoreStatus` the app would fetch over IPC, then
runs a 12-tick `HeadlessRunner` demo (deterministic clock/RNG/checksum
from M1). World State entity shapes exist since M3
(`packages/entities`), but nothing wires them into a running tick loop
yet -- no economic/demographic/AI logic exists (M5 onward).

## Testing

```bash
pnpm test        # Vitest: unit + component tests
pnpm test:e2e     # Playwright: Electron smoke test (builds the app first)
```

## Build

```bash
pnpm build
```

## Other checks

```bash
pnpm typecheck
pnpm lint
pnpm format:check
```

## Repository structure

```text
first-cause/
├── apps/
│   └── desktop/          -- Electron main/preload + React renderer
├── packages/
│   ├── shared/            -- typed IPC contracts, cross-package types
│   ├── simulation/        -- Simulation Core (headless-capable, worker, Read Models)
│   ├── entities/           -- World State entity shapes (World, Region, Company, ...)
│   ├── worldgen/            -- generic JSON fixture loader -> WorldState (procedural gen: M22)
│   ├── content/            -- Zod schemas, Definition Registry, loaders, validators
│   └── localization/       -- i18next/react-i18next setup (EN source, PL P0)
├── content/                -- content definitions (JSON): resources/, goods/
├── locales/                -- en/, pl/ translation resources
├── tests/
│   ├── e2e/                 -- Playwright specs
│   └── worldgen/fixtures/    -- hand-written reference world fixtures (JSON)
├── docs/                    -- canonical design & technical specifications
└── .github/workflows/        -- CI
```

`packages/causality`, `packages/chronicle`, `packages/persistence` and
`packages/ui` are part of the target architecture (see Technology
Stack Decision SS10) but not created yet. A package is created at its
first real consumer / system implementation, as documented in the
roadmap's M0 results (`entities` was created at M3, `worldgen` at M4).
Deferral is intentional, not missing scope. In particular, `causality`
begins with its first fact infrastructure consumer; it does not wait
for full integration in M17.

`packages/entities` deliberately has no dependency (production or
dev) on `packages/simulation`, to avoid an import cycle now that
`packages/simulation` depends on `packages/entities` for Read Models
(M4+) -- see the doc comment in `packages/entities/src/core/validation.ts`.
`packages/worldgen` depends on `packages/entities` (production) and on
`packages/simulation` (dev-only, for one integration test); neither of
those creates a cycle since `packages/simulation` never depends on
`packages/worldgen`.

## Architecture boundaries

```text
SIMULATION CORE
      |
READ MODELS / EVENTS
      |
      IPC
      |
REACT UI
```

- The Simulation Core never imports React or Electron.
- The renderer never mutates Simulation State directly -- all
  interaction goes through the single typed IPC channel
  (`window.firstCause`), which the preload script exposes with
  `contextIsolation: true` and `nodeIntegration: false`.
- Changing the UI locale never touches Simulation State or the RNG.

See [`AGENTS.md`](./AGENTS.md) for the rules that apply to anyone
(human or agent) implementing a milestone in this repository.
