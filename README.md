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
> [`FIRST-CAUSE-Implementation-Roadmap-v0.6.md`](./docs/FIRST-CAUSE-Implementation-Roadmap-v0.6.md).

## Current milestone

**M0 through M14 = DONE. M15 = READY (formal starting condition met as
of 2026-09-18 -- see below); system implementation not started yet.**
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
types. M5 -- Resources is the first milestone with real gameplay logic:
`packages/simulation/src/systems/resources` (deposit discovery
lifecycle, physically-conserving extraction, logistic-growth renewable
regeneration) and the first real consumer of the new
`packages/causality` fact infrastructure (CE-01: `FactStore`,
deterministic `fact_<tick>_<sequence>` IDs, indices). UI-F0 also
started: Design Tokens, 7 `FC*` primitives and
`FCAppShell`/`FCTopNavigation`/`FCSimulationBar` now compose the
desktop shell (see the roadmap's M5 "Wyniki wykonania" for what was
verified). M6 -- Minimal Population added
`packages/simulation/src/systems/population` (`buildCohortFamily`: a
validated "cohort family" of one `PopulationCohort` per age group
sharing the same location/socioeconomic identity; `applyMonthlyDemography`:
monthly births/deaths/aging-transfer, annual rates compounded to a
monthly probability, tuned so a 200-year/2400-tick run stays within
roughly +-10% of its start) and the second real `population_increased`/
`population_declined` facts -- see the roadmap's M6 "Wyniki wykonania"
for what was verified. A follow-up review before M7 fixed four bugs in
M1-M6 that green tests alone had not caught (small populations frozen
forever by deterministic rounding, `RngStream.nextInt` returning `NaN`
above 2**32 - 1, a terminal-age-bracket population leak, and M6 not
running against the M4 fixture without manual prep) -- see the
2026-09-17 CHANGELOG entry. M7 -- Production added
`packages/simulation/src/systems/economy` (`runProduction`: one
company advances one tick, running as many Production Method "batches"
as its capacity/utilization and the availability of both live-extracted
resources (M5 `ResourceDeposit`) and its own `Inventory` goods allow;
`addToInventory`/`removeFromInventory`: the fail-loud physical ledger;
`applyProductionToCompany`: the resulting `Company.production` state
update) plus two real content definitions
(`content/companyArchetypes`, `content/productionMethods`) proving the
Zboże->Mąka->Żywność chain end to end -- see the roadmap's M7 "Wyniki
wykonania" for what was verified, including what is deliberately still
missing (no Market yet, so goods move between companies only by a
test/caller hand-carrying them).

M8 -- Market added price/shortage adjustment reacting to observed
supply/demand. M9 -- Labor & Households wired employment matching,
wages and household consumption. M10 -- Trade & Transport moved goods
between regions along `Connection`s with real transport cost/friction.
M11 -- Company AI gave companies OBSERVE -> DECIDE cycles (production,
labor, PM adoption, lifecycle) with `DecisionSnapshot`/hysteresis/
cooldown. **`packages/simulation/src/core/economy-tick.ts::runEconomyTick`**
(driven by `world-runner.ts::WorldRunner`) is the real orchestrator
wiring all of this into one deterministic monthly tick against a live
`WorldState` -- this is the live economy loop; it is not missing.
M12 -- Entrepreneurship added the regional Opportunity Scanner (new
companies found themselves, no random spawn). M13 -- Migration added
probabilistic push/pull migration between connected regions, with
housing as a hard capacity limit. M14 -- Settlements added
`SettlementPressure` and stage transitions (`Camp -> ... -> Metropolis`)
plus the housing capacity/cost/pressure system M13 depends on.

M12-M14 went through a post-implementation audit
(`docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`,
result: FAIL) and a full remediation across 7 follow-up commits fixing
migrant identity/determinism, the housing hard-limit bypass, founding's
missing capital source, phantom employment exceeding the real labor
force, a non-canonical tick phase order, commit-time validation gaps,
and lost migrant traits -- see the 2026-09-18 CHANGELOG entries for the
full list. DONE for M12-M14 is now backed by that audit, not just the
original implementation commits.

Next: **M15 -- Technology**, READY as of 2026-09-18 -- the
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` (125 discoveries,
5 domains) is delivered and `content/discoveries/*.json` (125 files) is
written and passing the real M2 pipeline; system implementation
(knowledge accumulation, Discovery Engine, Adoption) has not started
yet -- see the roadmap's M15 section. UI-F1 (Procedural Region Visual
Identity) starts alongside it, deferred from M14.
Causality/Chronicle/Architect and a procedural World Generation
algorithm still do not exist as *systems* yet -- see the Implementation
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
from M1 only -- this specific CLI demo predates the full economy and was
never updated to drive it). The real, full tick loop -- resources,
population, production, market, labor, trade, company AI,
entrepreneurship, migration, settlements, all of it -- exists and is
wired together in `packages/simulation/src/core/economy-tick.ts::runEconomyTick`
/ `world-runner.ts::WorldRunner` (M7-M14, see "Current milestone" above)
and is exercised end to end by
`packages/worldgen/src/fixtures/economy-tick.integration.test.ts` and
`m12-m14-invariant-monitor.test.ts` against the real Black Mountain
fixture, not by this CLI.

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
│   ├── simulation/        -- Simulation Core (headless-capable, worker, systems, Read Models)
│   ├── entities/           -- World State entity shapes (World, Region, Company, ...)
│   ├── worldgen/            -- generic JSON fixture loader -> WorldState (procedural gen: M22)
│   ├── causality/           -- SimulationFact, FactStore, indices (CE-01)
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

`packages/chronicle`, `packages/persistence` and `packages/ui` are
part of the target architecture (see Technology Stack Decision SS10)
but not created yet. A package is created at its first real consumer /
system implementation, as documented in the roadmap's M0 results
(`entities` was created at M3, `worldgen` at M4, `causality` at M5 --
its first fact infrastructure consumer, per the plan, not waiting for
full integration in M17). Deferral is intentional, not missing scope.
`packages/causality` has zero dependencies on any other workspace
package (`SimulationFact` is generic), so `packages/simulation`
depending on it carries no cycle risk.

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
