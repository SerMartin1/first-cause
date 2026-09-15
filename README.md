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
> [`FIRST-CAUSE-Implementation-Roadmap-v0.1.md`](./docs/FIRST-CAUSE-Implementation-Roadmap-v0.1.md).

## Current milestone

**M0 -- Repository Foundation.** This milestone establishes the
monorepo, build tooling, Electron/React/Vite shell, a minimal typed IPC
path to a real Simulation Worker, and the content/localization
foundations. It intentionally implements **no gameplay systems** --
no economy, population simulation, AI, causality, Chronicle, Architect,
or World Generation. Those begin at `M1` and onward; see the
Implementation Roadmap for the full milestone sequence.

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

M0 scope: this only proves the headless path exists and prints the same
`CoreStatus` the app would fetch over IPC. No world/tick simulation
exists yet.

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
│   ├── simulation/        -- Simulation Core (headless-capable, worker)
│   ├── content/            -- Zod schemas, Definition Registry, loaders
│   └── localization/       -- i18next/react-i18next setup (EN source, PL P0)
├── content/                -- content definitions (JSON), e.g. resources/
├── locales/                -- en/, pl/ translation resources
├── tests/e2e/               -- Playwright specs
├── docs/                    -- canonical design & technical specifications
└── .github/workflows/        -- CI
```

`packages/entities`, `packages/worldgen`, `packages/causality`,
`packages/chronicle`, `packages/persistence` and `packages/ui` are part
of the target architecture (see Technology Stack Decision SS10) but are
not scaffolded yet -- each is created when its milestone begins (`M3`,
`M22`, `M17`, `M19`, `M20`, `M21` respectively), per the "no
placeholders" rule in the Implementation Roadmap.

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
