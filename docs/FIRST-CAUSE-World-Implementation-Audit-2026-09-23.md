# World — implementation and acceptance audit, 2026-09-23

Status: functional integration delivered for the current reference world;
**full Golden UI #1 visual acceptance remains open**. This report does not
change the accepted design or mark M21 complete.

## Sources and repository audit

The implementation follows the accepted Golden UI #1 and the normative World
additions in UI Visual Design System v1.1 §50 and UI Implementation Spec v1.1
§31. Roadmap v0.3 identifies M21 as active. Canonical Decisions continue to
govern simulation determinism, data ownership and content-driven systems.

Existing systems reused:

- FCAppShell, FCTopNavigation, FCSimulationBar, FCSection, FCMetric, FCTabs,
  FCTextButton, design tokens and typography roles.
- RegionVisualProfile and FCRegionVignette, including their existing neutral
  asset placeholders. Existing user edits to the vignette were preserved.
- WorldRunner and the SimulationBridge worker lifecycle; the UI reads
  projections and sends explicit time commands through preload/IPC.
- Existing region, settlement, resource, technology and world read models.
- Chronicle event selection and the existing explainWhy/causal edge graph.
- The validated content loader and Black Mountain reference fixture. No
  region-specific rules were introduced into generic simulation systems.

The audit found no production World screen, atlas renderer, gameplay worker
host or monthly atlas history. Those missing integration pieces were added,
without adding a second simulation, Chronicle or causality engine.

## Files and responsibilities

| Area | Files |
| --- | --- |
| New World UI | `apps/desktop/src/features/world/WorldScreen.tsx`, `FCLivingAtlas.tsx`, `atlas-model.ts`, `world-store.ts`, `world.css` |
| New worker host | `apps/desktop/electron/main/world-session.ts`, `world-worker.ts` |
| New projections/history | `packages/simulation/src/read-models/world-view-read-model.ts` |
| Existing integration changed | App, main/preload bridge, Electron build configuration, read-model exports, content loader |
| Presentation | EN/PL locale entries, locally bundled fonts, PixiJS dependency and CSP-compatible static polyfill |
| Regression coverage | WorldScreen tests, WorldSession tests, existing App tests and Electron E2E |

## Implemented behavior and data semantics

- One atlas with nine mode entries and independent overlays. Political and
  geometry-dependent overlays explicitly remain unavailable.
- Settlement radius follows a bounded square-root population scale, with
  named min/max/reference/exponent configuration. Colour represents mode
  values, never population magnitude again. Labels have zoom/collision budgets.
- Economy uses actual monthly output and active company counts. Resources
  keep undiscovered quantities unknown. Development uses connection levels;
  Stability explicitly uses existing housing pressure, not an invented score.
- Trade arrows use recorded monthly trade facts and actual region links.
  Technology arrows use the recorded diffusion source; their width is
  availability, explicitly not an invented diffusion-rate measurement.
- Δ Change computes differences against an exact monthly snapshot for
  population, output, known resource stock, trade, infrastructure, adoption
  and settlement count. No nearby-state substitution or fabricated history.
- Session history retains up to 600 months outside canonical state/save/RNG.
  All 1/5/10/25/50-year selections are available, but show missing history
  until the exact baseline exists. Scrubbing pauses the worker and renders
  recorded atlas data; WHY? in historical views excludes future facts.
- Recent Event hover highlights its region. Click focuses/selects it and
  requests WHY?. Region processes also expose the latest change with recorded
  incoming causal edges. A causal node can be drilled into or shown on the
  atlas; a causal relation is distinguished from a transport flow.
- EN/PL switching and read queries do not modify simulation state. Technical
  worker/version information lives in expandable diagnostics.

## Open Golden acceptance dependencies

1. The current WorldState has a region graph, not cartographic coordinates,
   polygons, coastlines, rivers or railway geometry. The atlas therefore labels
   itself as a **region connection diagram**. Its grid coordinates are display
   layout only. Replacing them with invented geography would misrepresent the
   current simulation. Geographic Golden conformance is not claimed.
2. Approved pictorial region assets are absent. FCRegionVignette still uses
   its existing neutral layers. No illustrations were generated or substituted.
3. Migration facts do not expose an unambiguous paired origin/destination.
   Migration Flow Lens is disabled; no pairing is inferred from correlation.
4. Political ownership data is absent. Political remains disabled.
5. The reference world starts with 50 inhabitants. The 10k/100k marker
   distinction is tested as a scale invariant, not demonstrated by fictional
   live city populations. A representative large-city fixture and dense-world
   clustering/flow aggregation audit remain necessary for that acceptance state.
6. History is session-local and is not persisted in save files. Initial 10Y
   and longer comparisons correctly show unavailable baselines. Urbanisation
   is not invented from settlement counts; recorded settlement pressure is
   available in the region panel.
7. This is the World integration. Full Chronicle browsing, full Region Detail
   and the remaining M21 screens are not marked complete by this change.

## Verification and screenshots

Regression commands are `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`
and `pnpm test:e2e`; final results are recorded in CHANGELOG. On this Windows
host commands use `pnpm.cmd`; compiler/test subprocesses require execution
outside the restricted sandbox (otherwise `spawn EPERM`).

Electron E2E uses the actual worker, validates the event/region/WHY?/map loop,
time commands, historical navigation, locale invariance and viewport overflow.
It writes screenshots beneath
`test-results/app-World-atlas-events-WHY-65f3b-ocale-share-the-real-worker/`:
initial population, event focus, causal step, resources, trade, technology,
10Y missing-history state, historical cursor and Polish 1280px layout.
These are implementation evidence, not replacement Golden references.

Visual review confirmed atlas dominance, restrained token colours, flat
sections and progressive disclosure. It also identified the geographic and
asset gaps above; consequently the full visual acceptance gate is **OPEN**.
