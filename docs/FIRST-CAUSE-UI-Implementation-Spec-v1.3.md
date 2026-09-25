# FIRST CAUSE --- UI Implementation Spec v1.3

**Status:** CANONICAL IMPLEMENTATION SPEC\
**Projekt:** FIRST CAUSE\
**Wersja:** 1.3\
**Rola:** techniczny kontrakt implementacyjny warstwy UI dla Codexa,
Claude Code i człowieka.\
**Nadrzędny dokument wizualny:**
`FIRST-CAUSE-UI-Visual-Design-System-v1.3.md`\
**Powiązany milestone:** M21 --- UI Vertical Slice\
**Zasada nadrzędna:** implementacja ma odtwarzać intencję, hierarchię i
zachowanie Design Systemu, a nie mechanicznie kopiować pojedyncze
mockupy.

> **Codex implementuje system UI FIRST CAUSE. Nie projektuje go od
> nowa.**

------------------------------------------------------------------------

## 1. Cel dokumentu

Ten dokument przekłada kanoniczny Visual Design System v1.0 na plan
implementacji.

Ma zapewnić, że:

-   UI pozostaje spójne między ekranami,
-   Codex nie tworzy lokalnych wzorców wizualnych,
-   UI nie przejmuje logiki Simulation Core,
-   Living Atlas skaluje się od Vertical Slice do dużych światów,
-   komponenty `FC*` powstają przed ekranami, które ich używają,
-   każdy etap ma jawne kryteria PASS/FAIL,
-   screenshot „wygląda podobnie" nie jest wystarczającym kryterium
    ukończenia,
-   implementacja jest testowalna, dostępna i gotowa do dalszego
    skalowania.

------------------------------------------------------------------------

# 2. Źródła prawdy i pierwszeństwo

W przypadku konfliktu obowiązuje kolejność:

1.  `FIRST-CAUSE-Canonical-Decisions-v0.1`
2.  `FIRST-CAUSE-Technology-Stack-Decision-v0.1`
3.  `FIRST-CAUSE-UI-Visual-Design-System-v1.0`
4.  `FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1`
5.  niniejszy `FIRST-CAUSE-UI-Implementation-Spec-v1.0`
6.  Golden UI / mockupy jako referencje wizualne
7.  lokalne decyzje implementacyjne

Mockup **nie może nadpisywać** tekstowej reguły Design Systemu.

Jeżeli mockup pokazuje więcej kart, ikon lub dekoracji niż dopuszcza
v1.0, implementacja stosuje v1.0.

------------------------------------------------------------------------

# 3. Kanoniczny stack UI

Implementacja korzysta z decyzji Technology Stack:

-   **TypeScript** --- język,
-   **React** --- DOM UI,
-   **Vite** --- renderer/dev server,
-   **Zustand** --- wyłącznie presentation/UI state,
-   **PixiJS** --- Living Atlas / World Network,
-   **CSS Modules lub uporządkowany plain CSS**,
-   **CSS Variables** --- Design Tokens,
-   **Vitest** --- testy,
-   **React Testing Library** --- testy komponentów i renderowania Read
    Models,
-   **Playwright** --- E2E.

### MUST NOT

-   Material UI jako fundament,
-   Bootstrap jako fundament,
-   Tailwind jako alternatywny design system bez osobnej decyzji
    architektonicznej,
-   logika Simulation Core w komponentach React,
-   bezpośrednia mutacja World State z UI,
-   `Math.random()` dla wizualnej tożsamości regionów,
-   pełny World State kopiowany do React po każdym ticku.

------------------------------------------------------------------------

# 4. Granica Simulation ↔ UI

## 4.1 Zasada

> **React renderuje stan. Nie symuluje świata.**

UI otrzymuje:

-   Read Models,
-   deltas,
-   summaries,
-   query responses.

UI wysyła:

-   Commands,
-   query requests,
-   presentation actions.

## 4.2 Zustand

Zustand przechowuje wyłącznie:

-   selected entity,
-   active overlay,
-   filters,
-   open/closed panels,
-   zoom/viewport presentation state,
-   cached Read Models,
-   presentation preferences.

Zustand **nie jest canonical World State**.

## 4.3 Komponenty domenowe

Komponent może formatować dane prezentacyjne, ale nie może samodzielnie
wyliczać reguł ekonomii, migracji, technologii, AI ani przyczynowości.

Jeżeli komponent potrzebuje nowej informacji domenowej, należy:

1.  sprawdzić istniejący Read Model,
2.  rozszerzyć Read Model/query po stronie właściwej warstwy,
3.  dopiero potem renderować wynik.

Nie odtwarzamy reguł Simulation Core w UI.

------------------------------------------------------------------------

# 5. Struktura katalogów

Rekomendowana struktura:

``` text
apps/desktop/src/renderer/
├── app/
│   ├── FCAppShell/
│   ├── routes/
│   └── providers/
├── design-system/
│   ├── tokens/
│   ├── typography/
│   ├── primitives/
│   ├── components/
│   └── index.ts
├── features/
│   ├── world-command-center/
│   ├── living-atlas/
│   ├── region-detail/
│   ├── economy/
│   ├── technology/
│   ├── why/
│   ├── chronicle/
│   ├── architect/
│   └── butterfly/
├── state/
├── read-models/
├── commands/
└── styles/
```

Jeżeli repo ma już inną zgodną strukturę, **nie należy jej przebudowywać
tylko po to, aby odpowiadała temu przykładowi**. Zachować istniejące
konwencje repozytorium.

------------------------------------------------------------------------

# 6. Design Tokens --- UI-01

Design Tokens są implementowane **przed** ekranami.

## 6.1 Kategorie

MUST istnieć centralne tokeny dla:

-   canvas/surfaces,
-   text,
-   borders,
-   semantic colors,
-   typography roles,
-   spacing,
-   border widths,
-   radii,
-   motion,
-   z-index/layers,
-   focus states.

## 6.2 Kolory

Punktem wyjścia są tokeny v1.0:

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

Komponenty MUST używać tokenów. Lokalne HEX-y są niedozwolone poza
świadomie udokumentowanym wyjątkiem.

## 6.3 Typografia

Role:

``` text
FC_DISPLAY
FC_PAGE_TITLE
FC_SECTION_TITLE
FC_BODY
FC_DATA
FC_LABEL
FC_CAPTION
FC_MICRO
```

Rodziny:

-   UI/BODY --- IBM Plex Sans,
-   DATA --- IBM Plex Mono,
-   HISTORY --- Source Serif 4.

Komponent nie tworzy własnej hierarchii przez przypadkowe `font-size`.

## 6.4 Spacing

Jedna wspólna skala oparta o grid 4/8 px:

``` text
FC_SPACE_1
FC_SPACE_2
FC_SPACE_3
FC_SPACE_4
FC_SPACE_6
FC_SPACE_8
FC_SPACE_12
```

Przypadkowe wartości typu `13px`, `19px`, `27px` wymagają uzasadnienia.

------------------------------------------------------------------------

# 7. Anti-AI Implementation Rules

To są wymagania implementacyjne, nie sugestie.

## MUST

-   preferować whitespace,
-   używać cienkich separatorów,
-   utrzymywać spokojną hierarchię,
-   wykorzystywać istniejące komponenty `FC*`,
-   stosować semantyczne symbole tylko tam, gdzie przekazują znaczenie,
-   zachowywać jasny Living Scientific Atlas,
-   utrzymywać spójność typografii i rytmu.

## MUST NOT

-   tworzyć dashboardu z siatki kart,
-   dodawać dekoracyjnych ikon do każdej metryki,
-   używać gradientów jako standardowego efektu,
-   stosować glow/neon,
-   dodawać glassmorphism,
-   stosować nadmiar zaokrąglonych kapsułek,
-   dodawać ilustracji stockowych,
-   tworzyć nowych stylów przycisków per ekran,
-   tworzyć lokalnego „ładniejszego" odpowiednika komponentu FC.

### Twarda hierarchia powierzchni

> **Whitespace → Rule → Panel → Card**

Card jest ostatnią opcją.

------------------------------------------------------------------------

# 8. FC Component Library v1 --- kolejność implementacji

## 8.1 Primitives --- P0

Najpierw:

-   `FCSection`
-   `FCPanel`
-   `FCTextButton`
-   `FCPrimaryAction`
-   `FCTabs`
-   `FCSegmentedControl`
-   `FCFilter`
-   `FCSearch`
-   `FCTooltip`
-   `FCStatus`
-   `FCWarning`

## 8.2 Data --- P0

Następnie:

-   `FCMetric`
-   `FCMetricStrip`
-   `FCTrend`
-   `FCDataRow`
-   `FCDataTable`
-   `FCProgress`
-   `FCSparkline`
-   `FCMiniChart`

## 8.3 Structure --- P0

-   `FCAppShell`
-   `FCTopNavigation`
-   `FCSimulationBar`
-   `FCBreadcrumb`
-   `FCPageHeader`
-   `FCSplitView`

## 8.4 Atlas --- P0

-   `FCLivingAtlas`
-   `FCRegionArea`
-   `FCRegionNode`
-   `FCSettlementNode`
-   `FCConnection`
-   `FCFlow`
-   `FCMapOverlay`
-   `FCRegionTooltip`
-   `FCRegionContext`
-   `FCMapLegend`
-   `FCZoomControl`

## 8.5 Region Visual Identity --- P0/P1

-   `FCRegionVignette`
-   `FCTerrainLayer`
-   `FCVegetationLayer`
-   `FCSettlementLayer`
-   `FCTransportLayer`
-   `FCInfrastructureLayer`
-   `FCIndustryLayer`
-   `FCLandmarkLayer`

## 8.6 Causality --- P0

-   `FCCausalGraph`
-   `FCCausalNode`
-   `FCCausalLink`
-   `FCFactor`
-   `FCFactorList`
-   `FCCausalTimeline`
-   `FCArchitectCause`

## 8.7 Chronicle --- P0

-   `FCChronicleEntry`
-   `FCSignificance`
-   `FCHistoricalThread`
-   `FCTurningPoint`
-   `FCWorldTimeline`

## 8.8 Architect --- P0

-   `FCInterventionCatalog`
-   `FCInterventionWorkspace`
-   `FCConditionComparison`
-   `FCDirectEffects`
-   `FCPotentialSystems`
-   `FCInfluenceCost`
-   `FCInterventionHistory`

------------------------------------------------------------------------

# 9. Reguła nowych komponentów

Obowiązuje literalnie:

> **Do not create a new visual component if an existing FC component can
> represent the information without loss of meaning.**

Jeżeli istniejący komponent nie wystarcza:

1.  opisać brakujący przypadek,
2.  wskazać dlaczego composition istniejących `FC*` nie wystarcza,
3.  zaproponować minimalne rozszerzenie,
4.  nie implementować nowego wzorca wizualnego „przy okazji".

------------------------------------------------------------------------

# 10. AppShell --- pierwszy działający milestone UI

`FCAppShell` jest pierwszym ekranem integracyjnym.

MUST zawierać:

-   `FCTopNavigation`,
-   `FCSimulationBar`,
-   główny content outlet,
-   podstawowe focus/keyboard states,
-   skalowanie layoutu,
-   Error Boundary zgodny z architekturą projektu.

### Top Navigation

Kanoniczne sekcje:

``` text
WORLD
ECONOMY
TECHNOLOGY
CHRONICLE
ARCHITECT
```

Active = tekst + cienka linia.

Bez pills i dużych ikon.

### Simulation Bar

Musi obsługiwać kanoniczne prędkości projektu, w tym ×100, jeśli backend
udostępnia je w danym etapie.

------------------------------------------------------------------------

# 11. World Command Center --- UI-03

Golden UI #1 jest pierwszym pełnym ekranem gracza.

## MUST

-   Atlas jest dominantą wizualną,
-   `Important Now` pokazuje preferowane 3, maksymalnie 4 wpisy,
-   World Metrics nie są siatką kart,
-   Recent History pokazuje causal thread,
-   wybranie regionu zastępuje `Important Now` przez `Region Context`,
-   overlay zmienia perspektywę świata, nie architekturę ekranu,
-   `WHY?` jest dostępne dla znaczących zmian,
-   powrót zachowuje kontekst viewport/selection tam, gdzie to możliwe.

## Stany referencyjne

MUST zaimplementować i testować:

1.  Default World,
2.  Region Hover,
3.  Region Selected,
4.  Trade Overlay,
5.  Trade Overlay + Selected Region.

------------------------------------------------------------------------

# 12. Living Atlas --- UI-04

Living Atlas jest renderowany przez PixiJS osadzony w React.

## 12.1 DOM vs PixiJS

**PixiJS:**

-   region geometry,
-   nodes,
-   settlements,
-   connections,
-   spatial overlays,
-   flows,
-   clustering/LOD,
-   pan/zoom.

**React/DOM:**

-   toolbar,
-   filters,
-   tooltip content,
-   context panels,
-   accessibility fallback/summary,
-   tekstowe dane.

Nie renderować całej aplikacji w canvas.

## 12.2 Semantic Zoom

> **Zoom changes meaning, not only scale.**

Kanoniczne przejście:

``` text
cluster → region → settlement/local
```

### World / high density

Pokazuj:

-   klastry,
-   major regions,
-   anomalie,
-   zagregowane przepływy.

### Region / medium density

Pokazuj:

-   regiony,
-   ważniejsze osady,
-   główne połączenia,
-   wybrany overlay.

### Local / low density

Pokazuj:

-   settlements,
-   drogi/kolej,
-   zasoby,
-   lokalną infrastrukturę,
-   bardziej szczegółowe przepływy.

## 12.3 Density modes

### LOW

Node + nazwa + status + najważniejsza infrastruktura.

### MEDIUM

Nazwy tylko dla:

-   selected,
-   hovered,
-   important/anomalous,
-   major regions.

Pozostałe regiony mogą być node-only.

### HIGH

-   clustering,
-   agregacja flow,
-   label budget,
-   priorytet anomalii,
-   bez prób wyświetlania wszystkich nazw.

## 12.4 Label priority

Kolejność:

1.  selected,
2.  hovered,
3.  critical/important anomaly,
4.  major region,
5.  viewport-relevant context,
6.  pozostałe.

Kolizje etykiet rozwiązujemy przez ukrywanie niższego priorytetu, nie
przez nakładanie tekstu.

## 12.5 Flow aggregation

Przy dużej gęstości wiele podobnych przepływów agreguje się do
reprezentacji zbiorczej.

Domyślnie `MAJOR FLOWS ONLY`.

`ALL` jest świadomym trybem analitycznym użytkownika.

------------------------------------------------------------------------

# 13. Procedural Region Visual Identity

`FCRegionVignette` jest **CORE**, nie opcjonalną dekoracją.

## 13.1 Pipeline

``` text
Region Read Model
→ RegionVisualProfile
→ deterministic composition rules
→ SVG/2D layers
→ FCRegionVignette
```

Warstwy:

``` text
terrain
vegetation
settlement
transport
infrastructure
industry
landmark
```

## 13.2 Determinizm

Ten sam:

``` text
worldSeed + regionId + visualState
```

musi dawać ten sam wariant kompozycji.

Nie używać `Math.random()`.

## 13.3 Styl (zaktualizowano 2026-09-20, decyzja użytkownika -- patrz

`UI-Visual-Design-System-v1.0.md` SS18.7)

Agent (Codex, Claude Code lub inny) implementuje:

-   renderer,
-   composition rules,
-   deterministic variants,
-   scaling,
-   mapping danych na VisualProfile.

Agent **nadal nie wymyśla samodzielnie stylu assetów** i nie generuje
obrazów bez udziału użytkownika.

Assety mogą powstawać z pomocą generatora obrazów AI, ale trafiają do
jednej biblioteki wizualnej dopiero po jawnym zatwierdzeniu przez
użytkownika -- niezaakceptowany wygenerowany plik nie jest częścią
biblioteki.

------------------------------------------------------------------------

# 14. Region Detail --- UI-05

Region Detail jest hybrydą:

> **Overview dossier + domenowe Deep Dive tabs**

## Header

MUST zachować:

-   breadcrumb,
-   region name,
-   region identity,
-   procedural vignette,
-   kilka syntetycznych metryk.

## Overview

Musi odpowiadać:

-   co to za region,
-   co się w nim dzieje,
-   jakie są jego najważniejsze struktury,
-   jakie ma aktualne presje,
-   dlaczego zmienia się w obecny sposób.

Overview nie jest pełnym dumpem danych.

## Deep Dive

Kanoniczne zakładki:

``` text
OVERVIEW
ECONOMY
POPULATION
RESOURCES
TRADE
TECHNOLOGY
HISTORY
```

Economy Deep Dive jest wzorcem strukturalnym dla pozostałych domen, ale
nie oznacza identycznego układu danych.

------------------------------------------------------------------------

# 15. World Economy / Market --- UI-06

World Economy v0.6 jest Atlas-first.

Docelowa hierarchia:

1.  Economic Living Atlas,
2.  global state,
3.  anomalies / Important Now,
4.  goods/flows/regions,
5.  deep trends.

Nie implementować jako klasycznego BI dashboardu.

Orientacyjnie około **40% kluczowej przestrzeni roboczej** powinien
zajmować Economic Atlas, zależnie od rozdzielczości.

MUST wspierać:

-   economy overlays,
-   trade flows,
-   output,
-   supply/demand,
-   price pressure,
-   region selection,
-   przejście do Region Economy,
-   `WHY?` dla istotnych zmian.

------------------------------------------------------------------------

# 16. Technology --- UI-07

UI nie może redukować technologii do jednego `Technology Level`.

MUST zachować rozróżnienie domenowe:

``` text
Discovery
Availability
Adoption
Access
```

Widok ma jasno pokazywać, na którym etapie znajduje się technologia i
dlaczego.

------------------------------------------------------------------------

# 17. WHY? / Causal Explorer --- UI-08

WHY? jest globalnym językiem wyjaśniania znaczących zmian.

## MUST

-   centralny causal graph,
-   wiele przyczyn,
-   supporting causes,
-   counter-pressure,
-   causal timeline,
-   interaktywne nodes,
-   Architect interventions jako prawdziwe elementy grafu,
-   brak fałszywej pojedynczej przyczyny,
-   możliwość pogłębienia pytania.

### Reguła

> **Every significant change should be explainable.**

Nie oznacza to widocznego przycisku `WHY?` przy każdej liczbie.

Może być udostępnione przez contextual action.

------------------------------------------------------------------------

# 18. Chronicle --- UI-09

World Chronicle nie jest event logiem.

Ma odpowiadać:

> **Co z perspektywy historii świata naprawdę miało znaczenie?**

MUST korzystać z:

-   Historical Significance,
-   causal threads,
-   turning points,
-   procedural regional visuals tam, gdzie wspierają pamięć miejsca,
-   filtrów World / Region / Company / Technology / Architect,
-   przejść do WHY? i Region Detail.

`Region History` pozostaje zakładką Region Detail i nie jest tym samym
ekranem co `World Chronicle`.

------------------------------------------------------------------------

# 19. Architect --- UI-10

Architect jest laboratorium warunków, nie panelem cheatów.

Kanoniczny workflow:

``` text
CURRENT
→ PROPOSED
→ GUARANTEED / DIRECT EFFECTS
→ POSSIBLE PROPAGATION
→ APPLY
```

## MUST

-   jasno oddzielić gwarantowane efekty bezpośrednie od możliwych
    konsekwencji,
-   nie obiecywać emergentnego wyniku,
-   pokazywać Influence Cost,
-   pokazywać Systems Potentially Affected,
-   zapewniać mini Living Atlas/context,
-   przechowywać historię interwencji,
-   umożliwiać `TRACE CONSEQUENCES`.

------------------------------------------------------------------------

# 20. Butterfly Effect --- UI-11

Butterfly Effect korzysta z istniejącej infrastruktury
Causality/Chronicle.

Nie tworzyć osobnego, niespójnego języka grafu.

Powinien wykorzystywać:

-   `FCCausalGraph`,
-   `FCCausalNode`,
-   `FCCausalLink`,
-   `FCCausalTimeline`,
-   `FCArchitectCause`,
-   Chronicle/Region navigation.

------------------------------------------------------------------------

# 21. Localization --- UI-12

UI musi być przygotowane do EN/PL zgodnie z istniejącą specyfikacją
lokalizacji.

MUST:

-   nie hardcodować zdań domenowych w komponentach,
-   nie zakładać stałej długości labeli,
-   testować overflow dla polskich tłumaczeń,
-   zachować liczby/daty zgodnie z formatowaniem projektu,
-   nie budować znaczenia tylko przez tekst w assetach SVG.

------------------------------------------------------------------------

# 22. Performance / Large World --- UI-13

Vertical Slice testuje 32 regiony, ale architektura UI nie może blokować
późniejszej skali.

## Living Atlas

MUST mieć:

-   clustering,
-   LOD,
-   semantic zoom,
-   label budget,
-   flow aggregation,
-   viewport culling tam, gdzie uzasadnione,
-   batch updates,
-   brak pełnego React rerender dla każdego node.

## React

MUST:

-   renderować Read Models,
-   ograniczać niepotrzebne rerendery,
-   nie kopiować całego World State,
-   nie wykonywać ticków symulacji.

Optymalizacja ma wynikać z pomiarów, ale podstawowa granica React/PixiJS
jest obowiązkowa od początku.

------------------------------------------------------------------------

# 23. Motion

Zasada:

> **The world moves; the UI stays calm.**

Można animować:

-   trade flows,
-   migration,
-   pojawienie się infrastruktury,
-   zmianę settlement stage,
-   nowe połączenia,
-   subtelne state transitions Atlasu.

Nie animować dekoracyjnie:

-   kart,
-   nagłówków,
-   każdej liczby,
-   każdej zmiany focusu.

Przy wysokich prędkościach symulacji animacje świata są
redukowane/agregowane.

------------------------------------------------------------------------

# 24. Controlled Cartographic Imperfection

Atlas nie może wyglądać jak idealny diagram SaaS.

Dozwolone są kontrolowane różnice:

-   subtelnie nieregularne linie terenu,
-   warianty SVG,
-   organiczne rozmieszczenie osad,
-   niewielkie różnice kształtów infrastruktury,
-   deterministyczna różnorodność.

MUST pozostać:

-   czytelność,
-   spójna hierarchia,
-   deterministyczność,
-   brak wizualnego szumu.

------------------------------------------------------------------------

# 25. Accessibility / Interaction

Każdy interaktywny komponent MUST posiadać, jeśli ma zastosowanie:

``` text
default
hover
focus
selected
disabled
```

Kolor nie może być jedynym nośnikiem znaczenia.

MUST istnieć widoczny focus keyboard.

Canvas/PixiJS nie może całkowicie odcinać informacji od użytkownika
korzystającego z DOM/klawiatury; kluczowe dane wybranego/hoverowanego
regionu powinny być dostępne przez odpowiadający im DOM context/summary.

------------------------------------------------------------------------

# 26. Testing Contract

## 26.1 Vitest

Testować:

-   helpers,
-   token mappings,
-   deterministic visual profile selection,
-   formatting,
-   selectors,
-   presentation adapters.

## 26.2 React Testing Library

Testować:

-   rendering Read Models,
-   states komponentów,
-   navigation intent,
-   overlay/filter state,
-   selected region context,
-   WHY? entry points,
-   Architect Guaranteed vs Possible separation.

Nie testować szczegółów implementacyjnych Reacta.

## 26.3 Playwright

Minimalny UI E2E zgodny z roadmapą:

``` text
start gry
→ new world
→ run simulation
→ navigate World
→ select region
→ open Region Detail
→ open WHY?
→ return
→ Architect intervention
→ run time
→ review consequences
→ Chronicle
→ save
→ load
```

## 26.4 Visual Regression

Dla Golden UI rekomendowane są screenshot tests przynajmniej dla:

-   WCC Default,
-   WCC Selected,
-   WCC Trade Overlay,
-   Region Detail Overview,
-   Region Economy,
-   WHY?,
-   World Chronicle,
-   Architect,
-   World Economy.

Screenshot test nie zastępuje testu zachowania.

------------------------------------------------------------------------

# 27. Golden UI Conformance Checklist

Każdy ekran przed akceptacją przechodzi checklistę.

## Visual

-   [ ] jasny Living Scientific Atlas language,
-   [ ] brak przypadkowych HEX,
-   [ ] brak lokalnych font sizes poza tokenami,
-   [ ] whitespace użyte przed kartami,
-   [ ] ikony mają funkcję semantyczną,
-   [ ] brak glow/gradient/glassmorphism,
-   [ ] nie wygląda jak SaaS/fintech dashboard.

## Architecture

-   [ ] renderuje Read Model,
-   [ ] nie mutuje World State,
-   [ ] brak logiki symulacji w React,
-   [ ] używa istniejących FC components,
-   [ ] nowy component pattern jest uzasadniony.

## UX

-   [ ] użytkownik rozumie najważniejszy stan w kilka sekund,
-   [ ] istnieje droga Glance → Analysis → Deep Dive,
-   [ ] istotne zmiany mają Explain/WHY?,
-   [ ] zachowany jest kontekst przy powrocie,
-   [ ] ekran nie pokazuje więcej informacji niż potrzebuje jego poziom.

------------------------------------------------------------------------

# 28. Definition of Done --- komponent

Komponent `FC*` jest DONE, gdy:

-   ma typed props,
-   używa design tokens,
-   ma wymagane interaction states,
-   posiada testy,
-   nie zawiera domenowej logiki symulacji,
-   działa z długimi labelami EN/PL,
-   ma poprawny focus/keyboard behavior, jeśli jest interaktywny,
-   nie wprowadza nowego wzorca wizualnego poza Design Systemem.

------------------------------------------------------------------------

# 29. Definition of Done --- ekran

Ekran jest DONE, gdy:

-   używa kanonicznych `FC*`,
-   działa na prawdziwym Read Modelu lub jawnie oznaczonym fixture tego
    samego kontraktu,
-   posiada loading/empty/error state, jeśli ma zastosowanie,
-   podstawowe ścieżki mają RTL/E2E,
-   spełnia Golden UI Conformance Checklist,
-   screenshot review nie wykazuje driftu anti-AI,
-   lint/typecheck/tests/build są green.

------------------------------------------------------------------------

# 30. Implementation Order --- zgodność z M21

Kanoniczna kolejność pozostaje:

``` text
UI-01 Design tokens + layout shell
UI-02 Simulation controls + top bar
UI-03 World Command Center
UI-04 Living Atlas / World Network (PixiJS)
UI-05 Region Detail
UI-06 Economy / Market / Company
UI-07 Technology
UI-08 WHY?
UI-09 Chronicle
UI-10 Architect Panel
UI-11 Butterfly Effect
UI-12 Polish/localization pass
UI-13 Performance/large-world pass
UI-14 UX testing and iteration
```

Nie zmieniać kolejności bez konkretnej zależności technicznej.

------------------------------------------------------------------------

# 31. Zalecany podział pracy Codexa

## Implementation Prompt #1 --- Foundation

Zakres:

-   audyt aktualnego repo,
-   design tokens,
-   typography roles,
-   spacing,
-   primitive FC components,
-   AppShell,
-   TopNavigation,
-   SimulationBar,
-   podstawowy route/content shell,
-   testy.

**Nie implementować jeszcze pełnego Living Atlasu ani wszystkich
ekranów.**

## Implementation Prompt #2 --- WCC Skeleton

-   WCC layout,
-   Important Now,
-   World Metrics,
-   Recent History,
-   placeholder/adapter pod Atlas,
-   selection state,
-   prawdziwe Read Models tam, gdzie są dostępne.

## Implementation Prompt #3 --- Living Atlas

-   PixiJS renderer,
-   pan/zoom,
-   regions,
-   semantic zoom,
-   density modes,
-   labels,
-   selection,
-   overlays,
-   flows,
-   performance baseline.

## Implementation Prompt #4 --- Region

-   Region Detail,
-   Region Vignette renderer,
-   Overview,
-   Economy Deep Dive.

## Implementation Prompt #5 --- Explanation

-   WHY?,
-   Causal Graph,
-   Timeline,
-   global Explain entry points.

## Implementation Prompt #6 --- History & Intervention

-   Chronicle,
-   Architect,
-   consequence tracing,
-   Butterfly Effect.

## Implementation Prompt #7 --- Economy & Polish

-   World Economy final,
-   Technology,
-   localization,
-   large-world pass,
-   UX iteration.

------------------------------------------------------------------------

# 32. Implementation Prompt #1 --- Acceptance Gate

Pierwszy etap można uznać za PASS wyłącznie gdy:

-   [ ] repo zostało najpierw przeanalizowane, a istniejące komponenty
    nie zostały bez potrzeby zdublowane,
-   [ ] centralne CSS variables/tokens istnieją,
-   [ ] role typograficzne istnieją,
-   [ ] spacing scale istnieje,
-   [ ] `FCSection`, `FCPanel`, `FCTextButton`, `FCPrimaryAction`,
    `FCTabs`, `FCMetric`, `FCTrend` są zaimplementowane,
-   [ ] `FCAppShell`, `FCTopNavigation`, `FCSimulationBar` działają,
-   [ ] brak Material UI/Bootstrap/nowego design frameworka,
-   [ ] komponenty nie zawierają logiki Simulation Core,
-   [ ] RTL testuje najważniejsze komponenty,
-   [ ] lint jest green,
-   [ ] typecheck jest green,
-   [ ] testy są green,
-   [ ] production build jest green,
-   [ ] screenshot AppShell jest zgodny z kierunkiem v1.0,
-   [ ] brak nieuzasadnionych nowych kart, ikon i efektów.

------------------------------------------------------------------------

# 33. STOP CONDITIONS dla Codexa

Codex ma zatrzymać implementację i zgłosić problem, jeśli:

1.  Design System i aktualny kod wymagają sprzecznych wzorców.
2.  Potrzebny Read Model nie istnieje.
3.  Implementacja wymaga skopiowania logiki Simulation Core do UI.
4.  Brakuje kanonicznej decyzji dla nowego wzorca wizualnego.
5.  Istniejący komponent `FC*` nie może obsłużyć wymaganego przypadku
    bez utraty znaczenia.
6.  Wymagana zmiana łamie determinism/save architecture.
7.  Wymagana biblioteka zmieniałaby zatwierdzony Technology Stack.

Codex nie powinien samodzielnie „rozstrzygać" takich konfliktów przez
stworzenie alternatywnego rozwiązania.

------------------------------------------------------------------------

# 34. Anti-Drift Review

Po każdym większym ekranie wykonać review:

### A. Cards

Czy ekran nie zamienił się w siatkę kart?

### B. Icons

Czy ikony przekazują semantykę, czy tylko dekorują?

### C. Atlas

Czy świat pozostaje głównym obiektem tam, gdzie powinien?

### D. WHY?

Czy istotne zmiany są wyjaśnialne?

### E. Hierarchy

Czy użytkownik wie, co zobaczyć najpierw?

### F. Simulation boundary

Czy UI nadal tylko prezentuje stan i wysyła Commands?

### G. Reuse

Czy nowy kod używa Component Library zamiast lokalnych wzorców?

Jeżeli odpowiedź na którykolwiek z punktów jest „nie", etap nie jest
zamknięty.

------------------------------------------------------------------------

# 35. Finalny kontrakt

Implementacja FIRST CAUSE UI ma prowadzić do interfejsu, który jest:

-   **Atlas-first,**
-   **information-first,**
-   **causality-aware,**
-   **history-aware,**
-   **progressively disclosed,**
-   **deterministic where visual identity depends on world state,**
-   **spójny między ekranami,**
-   **wolny od generycznego AI-dashboard look.**

Najważniejsza zasada dla agentów implementujących:

> **Nie optymalizuj ekranu pod to, żeby wyglądał efektownie w izolacji.
> Optymalizuj go pod to, żeby należał do FIRST CAUSE.**

------------------------------------------------------------------------

## 36. Status v1.0

`FIRST-CAUSE-UI-Implementation-Spec-v1.0.md` jest technicznym kontraktem
wykonawczym dla `FIRST-CAUSE-UI-Visual-Design-System-v1.3.md`.

Zmiany wymagające nowego wzorca wizualnego, zmiany stacku, zmiany
granicy Simulation ↔ UI albo zmiany kanonicznego UX loopu nie są
lokalnym refaktorem. Wymagają jawnej aktualizacji dokumentacji projektu.

**Następny krok w torze UI:**
`Implementation Prompt #1 — UI Foundation`, wyłącznie w zakresie
aktywnym w roadmapie v0.2 (debug shell/Read Models od M3/M4, tokens i
komponenty od M5). Bieżącym etapem projektu jest M1, nie pełna
implementacja UI. Golden UI wymagają udostępnienia plików lub trwałych
odnośników przed review zgodności wizualnej (Canonical Decisions §199).

# 31. UI-03 World --- Accepted Golden UI #1 implementation delta (2026-09-21)

**Player-facing title:** `World`. Do not render `World Command Center`
in the UI.

## 31.1 Required read-model capabilities

The World view must be able to request/read:

-   world pulse metrics with selected comparison window,
-   significant/recent events with location/entity references and
    significance,
-   settlement/region population for marker scaling,
-   Map Mode-specific values for Political, Population, Economy,
    Resources, Trade, Technology, Development, Stability and Δ Change,
-   infrastructure geometry/links available in World State,
-   contextual flows for selected entity/event,
-   selected-region summary and key active processes,
-   compact causal chain and map-projectable causal nodes,
-   timeline events and historical snapshots/state references when
    available,
-   contextual ranking for current Map Mode.

No UI component may invent missing simulation data.

## 31.2 Marker scaling

Population markers use a bounded non-linear radius function.
Implementation should expose tokens/config for `minRadius`, `maxRadius`,
reference population and scale exponent/log mapping. Acceptance test:
\~100k settlement is unmistakably larger than \~10k while both remain
legible and selectable.

## 31.3 Atlas state model

State must include at minimum:

`mapMode`, `comparisonWindow`, `overlays`, `zoomLevel`,
`selectedEntityId`, `selectedEventId`, `flowLens`, `flowLimit`,
`timelineCursor`, `focusMode`.

Map Mode and Overlay are independent concerns.

## 31.4 Flow rendering budget

Default: dynamic flows OFF unless required by current focused context.
Selected region/event defaults to Top 3 relevant flows; Top 5/All are
explicit user choices. WORLD zoom aggregates flows. Do not render
simultaneous migration+trade+resource+technology flow families by
default.

## 31.5 Recent Events interaction

Hover → atlas highlight.\
Click → select event + centre/focus map + select affected entity +
expose compact WHY?.\
`Focus on event` → suppress unrelated labels/flows.\
`Show on map` from WHY? → project selected causal relation onto Atlas.

## 31.6 Progressive disclosure

World screen is summary-first. Detailed
economy/population/resources/connections live behind region tabs and
Region Detail. Chronicle owns full historical browsing. WHY? owns full
causal exploration.

## 31.7 Screenshot / interaction acceptance states

At minimum capture/test:

1.  World / Population / no dynamic flows,
2.  World / Population / selected 100k+ city versus \~10k settlement,
3.  Recent Event focused on map,
4.  selected region + Top 3 Migration Flow Lens,
5.  Resources + selected resource,
6.  Trade + Top 3 trade flows,
7.  Technology diffusion focus,
8.  Δ Change / 10Y,
9.  WHY? causal node → Show on map,
10. Timeline historical cursor state.

All states must pass Anti-AI/Anti-Drift review against Visual Design
System v1.1 and Golden UI #1.

------------------------------------------------------------------------

# Addendum v1.2 --- Living Atlas implementation contract

## UI-03 / UI-04 source split

-   World layout: `FIRST-CAUSE-Golden-UI-World-Command-Center-v1.1.md`
-   Atlas style: `FIRST-CAUSE-Raw-Simulation-Atlas-v0.1.png`
-   Symbol grammar: `FIRST-CAUSE-Visual-Alphabet-v1.1.png`
-   Atlas rules: `FIRST-CAUSE-Living-Atlas-Visual-Asset-Spec-v1.2.md`

Reference PNGs are not production backgrounds.

## Renderer contract

Preferred data flow:

`Simulation State → Read Model/Selectors → RegionVisualProfile → Visual Alphabet mapping → PixiJS layers`

PixiJS owns high-volume map rendering. React owns shell, controls,
tables, tabs and textual/context UI.

Required Atlas layers:

-   `FCAtlasGeographyLayer`
-   `FCAtlasCivilizationLayer`
-   `FCAtlasSimulationDataLayer`
-   contextual selection/focus/causality layer

Existing components may be retained where they already satisfy this
responsibility; do not duplicate them solely to match names.

## Required implementation spike

Before broad Atlas expansion:

1.  implement one representative region fixture,
2.  render it as EARLY / DEVELOPING / INDUSTRIAL / MODERN,
3.  keep geography recognizably constant,
4.  switch available map modes on the same region,
5.  capture screenshots,
6.  run Anti-AI and density review.

A fixture may be used only if it conforms to production Read Model
contracts and is clearly marked as visual-development data.

## World interaction contract

Selected region remains in World context first. Full Region Detail is a
deliberate deeper action.

Significant event interaction:

`Recent Event → Show on Map → region/entity focus → WHY?`

Only expose `WHY?` when causal data exists.

## Acceptance additions

UI-03/UI-04 cannot receive PASS until:

-   historical region stress test passes,
-   map-mode stress test passes,
-   settlement population scaling is deterministic,
-   capital modifier is independent of population tier,
-   map-mode switching does not mutate Simulation State,
-   event localization uses grounded IDs/coordinates,
-   screenshot at 1920×1080 conforms to Golden UI,
-   Anti-AI review finds no decorative drift.

------------------------------------------------------------------------

# Addendum v1.3 --- World Context Scope implementation

## State

Add/confirm a World analytical scope state:

``` text
analysisScope = WORLD | REGION(regionId)
```

Do not infer `REGION` merely because a region is selected.

Selection and analytical scope are separate states:

``` text
selectedEntityId
analysisScope
```

## Read Models

Provide separate selectors/read models for:

``` text
WorldCauseSummary
RegionCauseSummary(regionId)
WorldConsequenceProjection
RegionConsequenceProjection(regionId)
QuickActionAvailability(context)
```

Reuse existing Causality/Chronicle/forecast data where available. Do not
generate missing causes or consequences in the UI.

## Interaction

-   World opens with `analysisScope = WORLD`.
-   Selecting a region updates Region Inspector but leaves analytical
    scope unchanged.
-   User can switch `ŚWIAT ↔ selected region`.
-   Changing selected region while region scope is active updates scope
    to the newly selected valid region only if the interaction
    explicitly represents replacement of the focused region; otherwise
    fall back to WORLD. Choose one deterministic behavior and cover it
    with tests.
-   WHY? receives scope + entity/event/cause/consequence identifiers.
-   Timeline changes recompute both summaries against the active cursor
    when historical data supports it.

## Consequence contract

Projection items should carry, when available:

``` text
id
scope
targetEntityId
horizon
direction
magnitudeRange
confidenceClass
sourceFactIds
causalEdgeIds
```

UI must distinguish observed facts from projected consequences.

## Tests

Add at minimum:

1.  selecting region does not silently change WORLD scope,
2.  WORLD → REGION switch updates both Causes and Consequences,
3.  no selected region disables regional scope,
4.  quick actions reflect selection/context,
5.  WHY? handoff preserves scope and selected item,
6.  missing causal/projection data yields empty/disabled state, not
    invented copy,
7.  scope switching does not mutate Simulation State,
8.  timeline cursor produces deterministic summary for the same state.
