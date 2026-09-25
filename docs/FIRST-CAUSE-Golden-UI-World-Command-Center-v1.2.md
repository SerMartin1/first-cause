# FIRST CAUSE --- Golden UI: World Command Center v1.2

**Status:** CANONICAL GOLDEN UI / APPROVED IMPLEMENTATION REFERENCE ---
context scope update\
**Scope:** World Command Center + contextual Region Inspector\
**Reference visual:** approved 1920×1080 light-background World Command
Center mockup supplied with v1.1\
**Parent documents:** `FIRST-CAUSE-UI-Visual-Design-System-v1.2`,
`FIRST-CAUSE-UI-Implementation-Spec-v1.2`,
`FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1`,
`FIRST-CAUSE-Canonical-Decisions-v0.1`,
`FIRST-CAUSE-Living-Atlas-Visual-Asset-Spec-v1.2`

------------------------------------------------------------------------

## 1. Purpose

This document freezes the visual and information hierarchy represented
by the approved light-background mockup. It does **not** replace
simulation, causality, entity, economy, or UI architecture
specifications. It defines how the World Command Center should present
those systems.

The screen must communicate one idea immediately:

> **FIRST CAUSE is a text/data-driven living-world simulator with a
> Living Scientific Atlas --- not a graphic-heavy god game and not a
> SaaS dashboard.**

Target balance for the World Command Center:

-   **\~80--90% information / text / tables / data structure**,
-   **\~10--20% graphical representation**, dominated by the Living
    Atlas,
-   no decorative illustration whose only role is visual attractiveness.

------------------------------------------------------------------------

## 2. Visual identity

The approved direction is a **light analytical atlas**.

The interface combines:

-   scientific atlas,
-   statistical yearbook,
-   simulation terminal,
-   historical archive,
-   cartographic workbench.

It must not resemble:

-   a glossy modern web dashboard,
-   a mobile-game UI,
-   a card-heavy SaaS application,
-   a fantasy map covered in decorative art,
-   a generative-AI showcase.

### 2.1 Anti-AI principle

The UI should look authored through **constraints**, not decorated
through abundance.

Core rule:

> **NO DECORATION WITHOUT INFORMATION.**

Every visible element should answer at least one of these questions:

1.  What exists?
2.  What changed?
3.  Where did it change?
4.  Why did it change?
5.  What may follow from it?
6.  What can the Architect do about it?

------------------------------------------------------------------------

## 3. Base palette

The approved mockup uses the existing light FIRST CAUSE palette.

``` css
--fc-bg:             #F3F1E9;
--fc-bg-elevated:    #FAF9F5;
--fc-surface:        #FFFFFF;
--fc-surface-muted:  #ECE9DF;

--fc-text:           #20231F;
--fc-text-secondary: #65675F;
--fc-text-muted:     #8A8B83;

--fc-border:         #C9C6BA;
--fc-border-strong:  #88887E;

--fc-accent:         #75683E;
--fc-accent-soft:    #E3DDC7;

--fc-positive:       #4F7153;
--fc-warning:        #9A722E;
--fc-negative:       #984F43;
--fc-info:           #536D78;
```

### 3.1 Color discipline

Color is semantic, not decorative.

-   graphite = normal information,
-   olive/ochre = selection / important context,
-   muted green = meaningful growth/improvement,
-   brick red = meaningful decline/problem,
-   steel blue = informational/system state,
-   pale paper tones = hierarchy of surfaces.

Do not use neon colors, purple-blue AI gradients, glow, glassmorphism,
or saturated rainbow overlays.

------------------------------------------------------------------------

## 4. Typography

The visualization establishes a more text-terminal character than
earlier generic dashboard concepts.

### 4.1 Recommended roles

**Primary UI / operational text --- IBM Plex Mono**

Use for:

-   navigation,
-   section labels,
-   dates and tick,
-   region names in tables,
-   values and deltas,
-   filters,
-   table headers,
-   status labels,
-   atlas labels where legibility permits.

**Long-form reading --- IBM Plex Sans**

Use for:

-   Chronicle descriptions,
-   longer causal explanations,
-   tooltips with paragraphs,
-   extended region summaries.

### 4.2 Typography rules

-   Avoid oversized marketing headings.
-   Prefer compact uppercase section headers.
-   Numeric columns use tabular/monospaced alignment.
-   Important values are distinguished primarily by weight and
    placement, not by huge font size.
-   Small fonts must not be used to hide information density problems.
-   Maximum practical font-family count in the base UI: **2**.

------------------------------------------------------------------------

## 5. Global screen structure

Reference desktop target: **1920×1080**.

The screen consists of five persistent structural zones:

``` text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR — FIRST CAUSE / DATE / TICK / SPEED / WORLD PULSE / TIME CONTROLS   │
├──────────────┬──────────────────────────────────────────┬────────────────────┤
│              │ WORLD OVERVIEW                           │ REGION CONTEXT     │
│ LEFT NAV     │ compact metrics + important events      │ selected region    │
│              ├──────────────────────────────────────────┤ data + resources   │
│              │                                          │                    │
│              │              LIVING ATLAS                │                    │
│              │                                          │                    │
│              ├────────────────┬──────────────┬───────────┴────────────────────┤
│              │ REGIONS        │ ECONOMY      │ EVENTS       │ POPULATION     │
└──────────────┴────────────────┴──────────────┴──────────────┴────────────────┘
```

The Atlas remains the largest single information surface.

------------------------------------------------------------------------

## 6. Top bar

The top bar is one compact horizontal strip.

### 6.1 Left side

Display:

-   FIRST CAUSE wordmark,
-   optional short subtitle `A LIVING WORLD`,
-   current year,
-   month,
-   tick.

Example:

``` text
FIRST CAUSE   Rok 0187   Miesiąc 5   Tick 2 248
```

### 6.2 Center/right

Display compact World Pulse values, for example:

``` text
Population 48 291 +1.8% | Trade 8 421 +12.4% | Production 5 320 +2.0%
```

These are **not KPI cards**. They are one continuous information strip.

### 6.3 Time controls

At the far right:

``` text
PAUSE | x1 | x5 | x20 | x100
```

Icon-only controls are acceptable for universally recognizable playback
actions, but tooltips are mandatory.

------------------------------------------------------------------------

## 7. Left navigation rail

The navigation rail is narrow and stable.

Canonical high-level entries:

``` text
WORLD
REGIONS
ECONOMY
POPULATION
FIRMS
TECHNOLOGY
CHRONICLE
WHY? / TRACE CAUSE
ARCHITECT
```

Secondary/system actions appear below a separator:

``` text
SAVE
LOAD
SETTINGS
EXIT
```

Below that, when relevant to World view:

-   simulation speed,
-   atlas filters,
-   overlay selection.

### 7.1 Icon rule

Icons are secondary navigation aids. The label remains the primary
identifier.

Do not assign decorative icons to every number, row, trend, or event.

------------------------------------------------------------------------

## 8. World Overview header

The upper central strip contains a compact overview rather than large
cards.

Canonical metrics:

-   Population,
-   Settlements,
-   Active Firms,
-   Trade Volume,
-   Known Regions.

Presentation:

``` text
POPULATION       SETTLEMENTS      ACTIVE FIRMS      TRADE VOLUME      KNOWN REGIONS
48 291           34               71                8 421             128
+1.8% / year     +2               +5                +12.4% / year     +0
```

Metrics are separated by rules/whitespace, not rounded cards.

Beside or immediately below them, show a short **Important / Recent
World Events** list. This is not the Chronicle; it is an operational
summary of current changes.

------------------------------------------------------------------------

## 9. Living Atlas

The Living Atlas is the visual centerpiece, but it remains an
information system rather than an illustration.

### 9.1 Visual ratio

Target language:

-   approximately **60% atlas/cartographic context**,
-   approximately **40% simulation graph/data overlay**.

The atlas may show:

-   coastline,
-   rivers,
-   mountains,
-   forests,
-   broad terrain,
-   region nodes,
-   settlements/cities according to semantic zoom,
-   connections,
-   major flows,
-   resource/problem markers.

### 9.2 Map graphics

The map should be visually richer than a pure node graph, but still
restrained.

Use:

-   flat or lightly textured terrain,
-   atlas-like linework,
-   muted earth colors,
-   simple repeated terrain symbols,
-   thin transport/network connections,
-   controlled cartographic imperfection.

Avoid:

-   painterly AI landscapes,
-   cinematic lighting,
-   3D buildings,
-   excessive procedural decoration,
-   dense fantasy ornament,
-   animated visual noise.

### 9.3 Nodes

A region node communicates state. It is not just a decorative dot.

At minimum, selection/hover can expose:

-   region name,
-   population/scale,
-   current dominant state,
-   main resource/activity,
-   trend/problem marker.

### 9.4 Connections

Connections should communicate actual simulation relationships.

Possible visual variables:

-   solid/dashed = stronger/weaker relation,
-   thickness = relative importance,
-   subtle directional cue = flow,
-   semantic color = selected overlay state.

Do not render all possible flows simultaneously.

### 9.5 Overlays

Canonical overlay modes:

``` text
DEFAULT | POPULATION | ECONOMY | TRADE | MIGRATION | RESOURCES | TECHNOLOGY
```

Only one primary overlay at a time.

------------------------------------------------------------------------

## 10. Selected Region Context --- right panel

Selecting a region does not immediately leave the World view.

The right panel becomes a contextual dossier for the selected region.

Header example:

``` text
BLACK MOUNTAIN [r.042]
```

Tabs may include:

``` text
OVERVIEW | ECONOMY | POPULATION | FIRMS | RESOURCES | HISTORY
```

The compact context view should include:

-   Population,
-   Settlements,
-   Active Firms,
-   Total Production,
-   Food Balance / self-sufficiency,
-   Strategic Value,
-   Stability,
-   Terrain,
-   Climate,
-   Water Access,
-   Resource Access,
-   Main Resources,
-   Connections.

The panel also contains the most important trends, e.g.:

``` text
↑ Iron extraction       +18%
↑ Employment            +12%
↑ Migration              +8%
↓ Tool prices             -6%
```

A single explicit action opens the full Region Dossier:

``` text
OPEN FULL REGION VIEW →
```

------------------------------------------------------------------------

## 11. Region resources and firms

The selected-region panel may split its upper content into two narrow
columns where screen width permits.

### Resources

Use a compact table:

``` text
RESOURCE     AMOUNT/STATE     TREND
Iron         420              ↑
Coal         310              →
Stone        180              →
Timber        90              ↓
Water         OK              →
```

### Firms

Use a list/table, not company cards:

``` text
FIRM / TYPE          COUNT      EMPLOYMENT/TREND
Iron Mine              2              ↑
Sawmill                1              →
Quarry                 1              →
Workshop               2              ↑
Smelter                1              ↑
```

Show only the most useful rows in context; full data belongs in the
Region/Firms deep view.

------------------------------------------------------------------------

## 12. Bottom information strip

The bottom strip contains compact analytical modules. They are separated
by rules and headers, not floating cards.

Recommended modules:

### 12.1 Regions

Columns:

``` text
# | REGION | POPULATION | Δ/YEAR | MAIN RESOURCE | STATUS
```

Default: 6--8 visible rows plus `VIEW ALL REGIONS`.

### 12.2 Economy

Show top goods / flows rather than a miniature copy of the entire
economy screen.

Columns:

``` text
# | GOOD | VOLUME | Δ/YEAR | MAIN REGIONS
```

### 12.3 Recent Events

Chronological compact list with date, scope and event.

### 12.4 Population trend

One small line chart is acceptable because it communicates change over
time efficiently.

Rules:

-   no decorative area gradients,
-   no chart chrome unless needed,
-   thin axes/grid,
-   exact values on hover,
-   chart must answer a clear question.

------------------------------------------------------------------------

## 13. Context-first navigation

World Command Center follows:

> **First orient in the world, then inspect the entity, then enter Deep
> Dive.**

Interaction depth:

``` text
WORLD
  ↓ select
REGION CONTEXT
  ↓ OPEN FULL REGION VIEW
REGION DOSSIER
  ↓ domain tab
DEEP DIVE
```

`ESC/BACK` reduces context depth rather than unexpectedly resetting the
whole screen.

------------------------------------------------------------------------

## 14. WHY? / causality integration

Significant changes should expose `WHY? / TRACE CAUSE` where the
Causality Engine has supporting data.

Example:

``` text
Iron extraction +18%    WHY? →
```

The causal view must be based on simulation facts/edges, not generated
explanatory prose pretending to know causality.

Do not use:

-   chatbot bubbles,
-   AI avatars,
-   magic sparkle icons,
-   labels such as `AI Insight`,
-   speculative explanations without causal data.

------------------------------------------------------------------------

## 15. Information density

The screen is intentionally dense, but density must remain structured.

Use this hierarchy:

1.  screen title / current context,
2.  Atlas or primary data surface,
3.  selected entity context,
4.  operational world changes,
5.  compact supporting tables,
6.  links to Deep Dive.

Avoid repeating the same number in several panels unless each occurrence
serves a different context.

------------------------------------------------------------------------

## 16. Geometry

### 16.1 Borders

-   default: 1 px neutral rule,
-   strong division: 1 px darker rule,
-   selected state: stronger outline/accent,
-   avoid thick decorative frames.

### 16.2 Radius

-   tables/sections: 0 px preferred,
-   controls: 0--2 px,
-   exceptional popovers: max 3--4 px.

### 16.3 Shadows

Default: none.

Use a subtle shadow only when needed to establish a temporary overlay
above the Atlas.

### 16.4 Spacing

Canonical priority:

> **Whitespace first → Rule second → Panel third → Card last.**

------------------------------------------------------------------------

## 17. Graphics budget

The approved direction intentionally limits graphic content.

### Allowed

-   Living Atlas terrain/context,
-   region/node symbols,
-   resource markers,
-   infrastructure lines,
-   one or two small analytical charts,
-   small deterministic region vignette in full Region Dossier where
    useful.

### Not allowed as default UI filler

-   large AI-generated illustrations,
-   decorative landscape banners,
-   portraits without gameplay function,
-   ornamental backgrounds,
-   animated particles,
-   glossy resource icons,
-   3D decorative assets.

The Atlas is the primary graphical asset. Most other screens should
remain predominantly textual.

------------------------------------------------------------------------

## 18. Region vignette policy

A region vignette is **not required in the World Command Center context
panel**.

If used in full Region Detail:

-   it is small,
-   deterministic,
-   assembled from approved SVG/2D modules,
-   derived from actual simulation state,
-   subordinate to data,
-   never a hero image.

This keeps the game visually identifiable while preserving the
text-first identity.

------------------------------------------------------------------------

## 19. Responsive / scaling priorities

When available width decreases, remove or collapse content in this
order:

1.  secondary bottom modules,
2.  less important table columns,
3.  extended event descriptions,
4.  auxiliary region-resource details,
5.  navigation labels may collapse only at very narrow width.

Never shrink the main font below comfortable readability simply to
preserve all columns.

The Atlas and selected-region context retain priority.

------------------------------------------------------------------------

## 20. Implementation components

Recommended component decomposition:

``` text
FCWorldCommandCenter
├── FCTopBar
├── FCNavigationRail
├── FCWorldOverviewStrip
├── FCImportantEvents
├── FCLivingAtlas
│   ├── FCAtlasTerrainLayer
│   ├── FCAtlasRegionLayer
│   ├── FCAtlasConnectionLayer
│   ├── FCAtlasFlowLayer
│   ├── FCAtlasMarkerLayer
│   └── FCAtlasLegend
├── FCRegionContext
│   ├── FCRegionFacts
│   ├── FCRegionResources
│   ├── FCRegionFirms
│   └── FCRegionTrends
└── FCWorldBottomStrip
    ├── FCRegionTable
    ├── FCEconomySummary
    ├── FCRecentEvents
    └── FCMiniTrendChart
```

Components must consume read models/selectors. They must not calculate
simulation truth independently.

------------------------------------------------------------------------

## 21. Anti-AI acceptance test

A World Command Center implementation is rejected if any of the
following is true:

-   Atlas is visually secondary to KPI cards.
-   The screen is composed mainly of rounded cards.
-   Large illustrations consume space without carrying simulation
    information.
-   Colors are used primarily for decoration.
-   Icons replace readable labels unnecessarily.
-   The selected region opens immediately into a new full screen without
    context inspection.
-   Data is repeated excessively.
-   The Atlas resembles a fantasy illustration more than an analytical
    world representation.
-   The interface depends on gradients, glow, glass, or glossy surfaces.
-   WHY? resembles an AI assistant.
-   Region visuals show buildings/resources/infrastructure unsupported
    by simulation state.
-   The UI changes visual language based on the world's technological
    era.

------------------------------------------------------------------------

## 22. Golden screenshot acceptance criteria

At 1920×1080, the reference implementation should allow the player to
answer without leaving the screen:

1.  What is the current date and simulation speed?
2.  What is the overall condition of the world?
3.  Which major events just occurred?
4.  Where is the selected region?
5.  What are its main characteristics and trends?
6.  What resources and firms matter there?
7.  Which regions are currently growing/declining?
8.  Which goods dominate trade/economy?
9.  How is population changing?
10. Where can the player go to understand **why** a change occurred?

If these questions require decorative panels, modal chains, or multiple
screen transitions, the implementation has drifted from the Golden UI.

------------------------------------------------------------------------

## 23. Canonical decision

The approved World Command Center direction is:

> **LIGHT LIVING SCIENTIFIC ATLAS + TEXT-FIRST SIMULATION TERMINAL.**

The Living Atlas is the primary graphical surface. Everything around it
should become progressively more textual, tabular, causal and archival.

The goal is not to eliminate graphics completely. The goal is to make
every graphic **earn its place by representing the simulated world**.

------------------------------------------------------------------------

## 24. v1.1 integration decisions --- Raw Simulation Atlas

This revision keeps the approved screen hierarchy intact and freezes the
relationship between the World Command Center and the newer Raw
Simulation Atlas / Visual Alphabet direction.

### 24.1 Source-of-truth split

-   **Golden UI World Command Center v1.2** defines screen composition,
    information hierarchy, navigation depth, contextual Region
    Inspector, bottom analytical strip and placement of the Living
    Atlas.
-   **Raw Simulation Atlas v0.1** defines the visual character of the
    map itself: restrained, raw, analytical and deliberately
    non-painterly.
-   **Visual Alphabet v1.1** defines map symbols, settlement language,
    infrastructure, extraction, industry, event classes, state modifiers
    and causality notation.
-   **Living Atlas Visual Asset Spec v1.2** defines how simulation data
    becomes renderable visual state.

The World Command Center mockup must therefore not be copied
pixel-for-pixel where its map texture conflicts with the Raw Simulation
Atlas. The layout is canonical; the Atlas rendering language is supplied
by the newer Atlas references.

### 24.2 Atlas layer model

The Living Atlas inside this screen is rendered as three conceptual
layers:

1.  **Geography** --- terrain, water, rivers, coastline, relief,
    vegetation and borders.
2.  **Civilization** --- settlements, roads, rail, ports, extraction,
    industry and infrastructure.
3.  **Simulation Data** --- map modes, deltas, events, flows and
    contextual causality.

The Geography layer is deliberately quiet. Civilization shows material
development. Simulation Data receives the strongest contextual emphasis.

### 24.3 Population and settlement representation

Settlement population is not encoded only by discrete icon classes.
Marker scale changes continuously with population, while semantic
settlement classes influence internal structure and the amount of detail
exposed at the current zoom.

Population classes extend from **Hamlet \<500** to **Global Megacity
10M+**.

Capital status is a separate functional modifier and never replaces the
population class.

### 24.4 Map modes

The World view must support the architecture for:

`POLITICAL | POPULATION | ECONOMY | RESOURCES | TRADE | TECHNOLOGY | DEVELOPMENT | STABILITY | Δ CHANGE`

Only modes backed by current Read Models may be exposed as
production-ready. One primary map mode is active at a time.

Dynamic overlays such as flows, events or causality are contextual and
must not create permanent visual spaghetti.

### 24.5 Recent events → map localization → WHY?

A recent/significant event should be able to expose:

-   its affected region/entity,
-   `SHOW ON MAP` / focus behavior,
-   the relevant marker or temporary spatial highlight,
-   `WHY? / TRACE CAUSE` when causal edges exist.

This creates the canonical path:

`EVENT → LOCATE → INSPECT → WHY?`

The Atlas must not invent spatial or causal relations that are absent
from simulation data.

### 24.6 Anti-AI refinement

The approved World screen remains text/data dominant. The Atlas must
avoid:

-   painterly fantasy geography,
-   miniature diorama cities,
-   glossy resource icons,
-   decorative procedural clutter,
-   perfectly filled terrain with no quiet space,
-   AI-style pseudo-detail.

Prefer repeated authored rules, simple geometry, linework, hatching,
restrained color and visible information hierarchy.

### 24.7 Implementation validation

Before the World screen is accepted as implemented, the Atlas must pass:

1.  one-region historical stress test:
    `EARLY → DEVELOPING → INDUSTRIAL → MODERN`,
2.  map-mode stress test for available data,
3.  screenshot review at 1920×1080,
4.  Anti-AI drift review,
5.  confirmation that visual state is derived from Read Models /
    simulation truth.

------------------------------------------------------------------------

## 25. v1.2 --- Context Scope for Causes, Consequences and Quick Actions

### 25.1 Bottom decision strip

The bottom strip contains three persistent modules:

1.  `NAJWAŻNIEJSZE PRZYCZYNY`
2.  `MOŻLIWE KONSEKWENCJE`
3.  `SZYBKIE AKCJE`

These modules are not separate dashboards. They are a compact
interpretation/action layer attached to the current World context.

### 25.2 Context switch

`NAJWAŻNIEJSZE PRZYCZYNY` and `MOŻLIWE KONSEKWENCJE` share one explicit
scope selector:

`ŚWIAT | [SELECTED REGION]`

Example:

`ŚWIAT | BLACK MOUNTAIN`

Rules:

-   default on entering World: `ŚWIAT`,
-   selecting a region does **not** silently switch scope,
-   the user may explicitly switch to the selected region,
-   if no region is selected, the regional option is disabled/hidden,
-   switching scope updates both Causes and Consequences together,
-   scope persists while the user remains on World unless the selected
    region becomes invalid,
-   the active scope must be visually obvious but compact.

This prevents ambiguity over whether the bottom analysis describes the
whole world or the currently selected region.

### 25.3 World scope

In `ŚWIAT`:

**Najważniejsze przyczyny** ranks the most important grounded drivers of
current world change.

**Możliwe konsekwencje** shows short-horizon model-derived consequences
relevant to the world.

Entries may refer to specific regions where those regions materially
contribute to the world-level signal.

### 25.4 Region scope

In `[SELECTED REGION]`:

**Najważniejsze przyczyny** ranks grounded causes of the selected
region's current state/change.

**Możliwe konsekwencje** shows short-horizon consequences for that
region, including external spillovers when supported by the model.

Region scope does not turn the World screen into Region Detail. It
remains a compact contextual analysis.

### 25.5 Consequence semantics

`MOŻLIWE KONSEKWENCJE` must never visually imply certainty.

Each item should expose, where supported:

-   direction,
-   expected magnitude/range,
-   confidence/strength class,
-   horizon,
-   principal affected entity/region.

Use terms such as `projekcja`, `możliwy`, `ryzyko`, `scenariusz` rather
than deterministic future-tense claims when the model is uncertain.

### 25.6 Quick Actions scope

`SZYBKIE AKCJE` is context-aware but does not require the same binary
scope switch.

Actions are divided logically into:

**Global / navigation actions** - global map/focus operations, -
notes, - broader analysis entry points.

**Selected-region actions** - `Pokaż na mapie`, - `Śledź region`, -
`Ustaw priorytet` where supported, - `Otwórz Region Detail`, -
`Analizuj WHY?`.

Unavailable actions must be disabled or omitted rather than faked.

### 25.7 WHY? handoff

From either scope:

`CAUSE / CONSEQUENCE → WHY?`

must carry the current context:

-   world or region scope,
-   selected causal/consequence item,
-   selected region when applicable,
-   current time/timeline cursor.

WHY? then expands the compact bottom summary into the full causal
explanation.

### 25.8 Anti-AI rule

The scope selector must look like a compact analytical control, not a
glossy segmented mobile control.

Prefer: - text, - underline/rule, - subtle selected background, - square
geometry.

Avoid: - pills, - gradients, - glow, - oversized badges.
