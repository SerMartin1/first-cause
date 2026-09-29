# FIRST CAUSE --- Implementation Roadmap v0.6

**Status:** dokument kanoniczny / żywy (living document)\
**Projekt:** FIRST CAUSE\
**Wersja:** 0.6 (2026-09-26 --- M21 World Screen / Living Atlas Canon
Resolution i remediation track `M21-VIS-R1`...`R6`)\
**Rola:** przełożenie istniejącej dokumentacji na wykonywalną kolejność
implementacji Vertical Slice --- od pustego repozytorium do
`VS Freeze`.\
**Dokumenty nadrzędne:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md`,
`FIRST-CAUSE-Master-Documentation-Consistency-Implementation-Readiness-Audit-v0.1.md`

**Dokumenty UI obowiązujące dla harmonogramu:**
`FIRST-CAUSE-UI-Visual-Design-System-v1.4.md`,
`FIRST-CAUSE-UI-Implementation-Spec-v1.4.md`,
`FIRST-CAUSE-Golden-UI-World-Command-Center-v1.3.md`,
`FIRST-CAUSE-Living-Atlas-Visual-Asset-Spec-v1.3.md`; stan
implementacji World/Atlas:
`FIRST-CAUSE-World-Atlas-Independent-Audit-2026-09-26.md`

> **Ten dokument nie tworzy nowej koncepcji gry. Tłumaczy istniejące,
> już zatwierdzone specyfikacje na kolejność, w jakiej powstanie kod.**

------------------------------------------------------------------------

# 0. Miejsce tego dokumentu w hierarchii

Pierwsza wersja dokumentu powstała **po** `Canonical Decisions v0.1` i
**przed** implementacją M0. Wersja v0.2 kontynuuje plan po M0/M0.1;
M1--M20 są ukończone (patrz "Wyniki wykonania" w sekcjach M1--M20).
Bieżący etap to **M21 --- UI Vertical Slice (IN PROGRESS)**. M21 jest
pełnym UI Integration Milestone: łączy istniejące Read Models,
komponenty `FC*`, Causality/WHY?, Chronicle, Architect i persistence w
docelowy UX gracza. Od 2026-09-21 M21 obejmuje również jawny **Visual
Production Track**: Golden UI → zatwierdzone assety → implementacja →
screenshot audit → korekta. Pełni rolę, którą
`Master Documentation Consistency & Implementation Readiness Audit v0.1`
nazwał ostatnim krokiem przed kodowaniem: audyt ustalił kanon i
kolejność na poziomie nazw milestone'ów (`IMPL-008`), a ten dokument
rozwija tę kolejność do poziomu modułów, danych, testów, bramek
akceptacyjnych i ryzyk, tak aby agent kodujący (Claude Code/Codex) nie
musiał niczego zgadywać ani wymyślać.

Jeżeli ten dokument jest sprzeczny z `Canonical Decisions v0.1`,
obowiązuje `Canonical Decisions v0.1`. Ten dokument nie rozstrzyga
konfliktów projektowych --- rozstrzyga **kolejność i zakres pracy**.

------------------------------------------------------------------------

# 1. Główna zasada harmonogramu

Kolejność wdrażania wynika z zależności danych i mechanik, nie z
kolejności rozdziałów w specyfikacjach:

``` text
fundament techniczny
→ determinism
→ dane
→ World State
→ minimalny działający świat (fixture)
→ gospodarka (zasoby → populacja → produkcja → rynek → praca → handel)
→ AI firm i przedsiębiorczości
→ migracja i osadnictwo
→ technologia
→ Architect
→ przyczynowość (integracja pełna)
→ WHY?
→ historia (Chronicle)
→ save/load pełna integracja
→ UI Vertical Slice
→ World Generation (proceduralny)
→ Black Mountain 200 lat
→ performance/tuning
→ VS Freeze
```

Fact infrastructure (Causality), checksum/save i lokalizacja są
**cross-cutting** --- zaczynają się wcześnie i rosną razem z każdym
systemem, zamiast czekać na własny późny milestone (patrz sekcja 9).

Od v0.2 również **UI Foundation jest cross-cutting**. `M21` pozostaje
kanonicznym milestone'em pełnej integracji UI Vertical Slice, ale nie
oznacza rozpoczęcia UI od zera. Od `M4/M5` równolegle powstają Read
Models, Design Tokens, `FC* Component Library`, AppShell i kontrakty
rendererów. W `M14/M15` rozpoczyna się Region Visual Identity, w
`M17/M18` komponenty Causality/WHY?, a w `M19` Chronicle UI. `M21` jest
więc **UI Integration Milestone**, w którym wcześniejsze fundamenty
zostają złożone w pełny UX Vertical Slice.

------------------------------------------------------------------------

# 2. Poziomy planowania

``` text
PHASE       -- grupa milestone'ów o wspólnym celu (Foundation, Economy, AI, ...)
MILESTONE   -- M0...M25 (+M26...M29 post-VS), jednostka z Definition of Done
MODULE      -- podzadanie wewnątrz milestone'u, zwykle 1:1 z sekcją
               "Kolejność implementacji" właściwej specyfikacji
               (np. AI-01...AI-12, CE-01...CE-12, CH-01...CH-14, UI-01...UI-14)
TASK        -- konkretna zmiana w kodzie/danych/testach realizująca moduł
ACCEPTANCE GATE -- warunek, po którym milestone jest uznany za DONE
```

Każdy milestone ma jednoznaczne Definition of Done (sekcja 10 poniżej)
oraz --- tam, gdzie dokumentacja to definiuje --- listę modułów
zaczerpniętą wprost z sekcji „Kolejność implementacji" właściwej
specyfikacji systemowej. Dzięki temu granulacja `MODULE`/`TASK`
odpowiada temu, czego oczekiwałby 55-punktowy harmonogram, bez mnożenia
liczby milestone'ów ponad to, co jest już kanonicznie ustalone.

------------------------------------------------------------------------

# 3. Dlaczego ten dokument NIE używa układu M0--M55 1:1

Propozycja wyjściowa (Phase A--M, M0--M55) jest trafna koncepcyjnie, ale
projekt **już ma** zatwierdzoną, kanoniczną kolejność implementacji:
`IMPL-008` w `Canonical Decisions v0.1` (26 kroków, `M0`--`M25`),
potwierdzoną też w `Master Audit` (sekcje 139--166) i w
`Technology Stack Decision` (sekcje 92--98). Zmiana numeracji
milestone'ów bez technicznego powodu złamałaby zasadę z
`Canonical Decisions` §200:

> „Jeżeli dokumentacja opisuje dwie różne wersje tej samej decyzji,
> agent nie wybiera tej, która jest łatwiejsza do implementacji. Wybiera
> decyzję z niniejszego rejestru."

Dlatego ten dokument:

1.  **Zachowuje kanoniczną numerację `M0`--`M25`** jako oś główną
    (Vertical Slice).
2.  **Nie spłaszcza granulacji** --- tam, gdzie propozycja 55-punktowa
    chciała osobnych milestone'ów (np. osobno Discovery/Adoption/Company
    Dynamics albo osobno AI Decision Core/Opportunity Scanner/Bounded
    Rationality), dokumentacja systemowa **już definiuje** tę granulację
    jako `MODULE` wewnątrz jednego milestone'u (np. `AI-01`...`AI-12`
    wewnątrz `M11`, `CE-01`...`CE-12` wewnątrz `M17`, `CH-01`...`CH-14`
    wewnątrz `M19`, `UI-01`...`UI-14` wewnątrz `M21`). Poziom
    szczegółowości jest więc identyczny --- tylko przeniesiony z poziomu
    `MILESTONE` na poziom `MODULE`, co jest zgodne z poziomami
    planowania z sekcji 2.
3.  **Dodaje cztery milestone'y poza kanonicznym VS** (`M26`--`M29`),
    których propozycja wyjściowa domagała się jako Phase K (Scale) i
    części Phase L (Save & Long-Run). Nie są one częścią `IMPL-008`,
    ponieważ Vertical Slice jest zdefiniowany jako świat **24--40
    regionów** (`WORLD-005`), a certyfikacja 250/600/1200/2000/3000
    regionów oraz testy 500/1000-letnie są jawnie opisane w
    `Save/     Determinism/Performance Spec` i `Simulation Test Spec`
    jako etap **po** Vertical Slice, na drodze do MVP. Dodanie ich jako
    `M26`-- `M29` domyka zakres z propozycji wyjściowej bez fałszowania,
    że są one wymagane do ukończenia VS.
4.  **Nie tworzy** osobnych milestone'ów dla Phase J (World Generation
    proceduralny) rozbitego na M34--M37 z propozycji --- World
    Generation Spec v0.1 (już istnieje, status READY) definiuje
    pojedynczy 31-etapowy `Generation Pipeline` (sekcja 29 tej
    specyfikacji), który odpowiada jednemu milestone'owi `M22` z
    modułami zgodnymi z tym pipeline'em.
5.  **Nie tworzy** osobnych milestone'ów World Command
    Center/Atlas/Region Detail/Economy Views/Chronicle-WHY/Architect UI
    (M38--M43 z propozycji) --- `UI/UX Spec` już definiuje 14-punktową
    `Implementation Order` (`UI-01`...`UI-14`), która staje się modułami
    `M21`.

Efekt: **zero utraty granulacji, zero nowej koncepcji gry, zero
konfliktu z kanonem.** Jedyna zmiana względem propozycji to poziom
hierarchii, na którym żyje szczegół, plus jawne wydzielenie 4
milestone'ów post-VS, które w propozycji były wymieszane z zakresem VS.

------------------------------------------------------------------------

# 4. Mapowanie faz z propozycji na kanoniczną numerację

  Faza z propozycji K                         anoniczne milestone'y U   waga
  ------------------------------------------- ------------------------- -----------------------------------------------
  A --- Foundation                            M0--M4 b                  ez zmian koncepcyjnych
  B --- Minimum Living Economy                M5--M10 R                 esources/Population rozdzielone równolegle
  C --- Living World (Population/Migration/   M6, M13, M14, M5          Resources/Infrastructure jako moduły w M5/M9,
  Settlements/Resources/Infrastructure)                                 a nie osobne milestone'y
  D --- Knowledge & Economic Evolution        M15, M12 C                ompany Dynamics = M12 (Entrepreneurship)
  E --- Autonomous Actors (AI Core/           M11 A                     I-01...AI-12 jako moduły
  Opportunity/Bounded Rationality)                                      
  F --- Causal World                          M17, M18 (start: M5+) F   act infra zaczyna się w M5 (cross-cutting)
  G --- History                               M19 C                     H-01...CH-14 jako moduły
  H --- Architect                             M16 (integracja: M17) B   utterfly wymaga M17/M18
  I --- World Generation                      M22 j                     eden 31-etapowy pipeline
  J --- Player Experience                     M21 U                     I-01...UI-14 jako moduły
  K --- Scale                                 **M26** (post-VS) 2       50/600/1200/2000/3000
  L --- Save & Long-Run                       cross-cutting od M1 + p   ełna certyfikacja w **M27** (post-VS)
                                              **M27**                   
  M --- Vertical Slice Completion             M23--M25 B                lack Mountain 200 lat → tuning → freeze

------------------------------------------------------------------------

# 5. Dependency Graph

## 5.1 Główny łańcuch (Critical Dependency Graph)

``` text
CORE (M0-M1)
 ↓
DATA (M2)
 ↓
WORLD STATE (M3)
 ↓
REFERENCE FIXTURE (M4)
 ↓
RESOURCES (M5) ──┐
                 ├─→ oba tylko zależą od M3/M4, mogą iść równolegle
POPULATION (M6) ─┘
 ↓ (oba karmią)
PRODUCTION (M7)
 ↓
MARKET (M8)
 ↓
LABOR / HOUSEHOLDS (M9)
 ↓
TRADE / TRANSPORT (M10)
 ↓
COMPANY AI (M11)
 ↓
ENTREPRENEURSHIP (M12)
 ↓
MIGRATION (M13)
 ↓
SETTLEMENTS (M14)
 ↓
TECHNOLOGY (M15)
 ↓
ARCHITECT --- pierwsza interwencja (M16)
 ↓
CAUSALITY --- pełna integracja (M17)
 ↓
WHY? (M18)
 ↓
CHRONICLE (M19)
 ↓
SAVE/LOAD --- pełna integracja (M20)
 ↓
UI VERTICAL SLICE (M21)
 ↓
WORLD GENERATION proceduralny (M22)
 ↓
BLACK MOUNTAIN 200 LAT (M23)
 ↓
PERFORMANCE & TUNING (M24)
 ↓
VS FREEZE (M25)
 ↓  (poza VS, droga do MVP)
SCALE CERTIFICATION (M26) ──→ LONG-RUN CERTIFICATION (M27) ──→ CONTENT/LOCALE EXPANSION (M28) ──→ WORLDGEN MVP SCALING (M29)
```

## 5.2 Zależności boczne (cross-cutting)

``` text
Causality Fact Infrastructure (CE-01, CE-02)
  zaczyna się w M5, rośnie z każdym kolejnym systemem (M6...M19),
  a nie dopiero w M17.

Save skeleton + WorldChecksum
  istnieje od M1, roundtrip test rośnie z każdym nowym typem encji
  od M3 dalej, pełna integracja (kompaktacja HOT/WARM/PERMANENT,
  migracje) domyka się w M20.

Localization (EN/PL)
  klucze i18n rosną z każdym nowym user-facing elementem od M2 dalej;
  brak wydzielonego "milestone'u lokalizacji" w VS.

Content authoring (JSON definitions resources/goods/companies/PM/
discoveries)
  może być tworzony równolegle przez osobny wątek pracy od M2, z
  wyprzedzeniem względem systemu, który go konsumuje (np. dane PM
  metalurgii mogą powstać przed M15, jeśli schema z M2 jest gotowa).

UI Foundation Track
  zaczyna się od M3/M4 jako surowy debug shell + fixture Read Models,
  następnie od M5 rozwija Design Tokens, typografię, spacing,
  podstawowe komponenty `FC*`, `FCAppShell`, `FCTopNavigation` i
  `FCSimulationBar`. Każdy kolejny system dostarcza UI-ready Read
  Models jako część swojego Definition of Done. W M14/M15 startuje
  `RegionVisualProfile`/`FCRegionVignette`; M17/M18 dostarcza
  komponenty Causality/WHY?, M19 Chronicle. Pełny World Command Center
  i integracja Golden UI są domykane w M21.

Validation (schema + invariants)
  towarzyszy każdej nowej encji/systemowi od M2 dalej (DATA-003,
  IMPL-013), nie jest osobnym milestone'em.

Performance profiling
  zaczyna się od M1 (tick timings), rośnie z każdym milestone'em;
  aktywna optymalizacja i benchmark ladder to M24, a certyfikacja do
  3000 regionów to M26.
```

------------------------------------------------------------------------

# 6. Critical Path do grywalnego Vertical Slice

``` text
CRITICAL PATH (sekwencyjny, blokujący):
M0 → M1 → M2 → M3 → M4 → M5/M6 → M7 → M8 → M9 → M10 → M11 → M12 →
M13 → M14 → M15 → M16 → M17 → M18 → M19 → M20 → M21 → M22 → M23 →
M24 → M25
```

Nie istnieje realna ścieżka skracająca ten łańcuch --- każdy system
gospodarczy VS zależy fizycznie od poprzedniego (populacja potrzebuje
zasobów i osad, rynek potrzebuje produkcji, AI potrzebuje rynku i pracy,
migracja potrzebuje AI/zatrudnienia, technologia wpływa na produkcję i
wymaga wiedzy zakorzenionej w populacji/osadach, Architect potrzebuje
działającego świata do zmiany warunków, przyczynowość potrzebuje
wszystkich powyższych do wyjaśniania, Chronicle potrzebuje
przyczynowości). To jest właśnie powód, dla którego `Master Audit`
odrzucił podejście „moduł po module bez pionowego testu" (§137).

``` text
PARALLEL WORK (może iść równolegle do critical path, bez blokowania):
- M5 (Resources) || wczesne prace nad M6 (Population) -- oba zależą
  tylko od M3/M4.
- Content authoring (JSON dla resources/goods/companies/PM/discoveries)
  równolegle z M5-M15, z wyprzedzeniem.
- Fact infrastructure (CE-01/CE-02) równolegle z M5-M16, zamiast
  czekać na M17.
- Save roundtrip + WorldChecksum rozbudowa równolegle z M3-M19.
- UI Foundation Track równolegle z M3-M20: debug shell i fixture
  Read Models (M3/M4), Design Tokens + podstawowe `FC*` + AppShell
  (M5-M10), data components (M11-M15), Region Visual Identity
  (M14/M15), Causality/WHY? components (M17/M18), Chronicle components
  (M19). M21 pozostaje finalnym integration gate `UI-01...UI-14`.
- Worldgen module skeleton (RNG streams, topology szkic) można
  prototypować równolegle z M15-M19, ale PEŁNA implementacja M22
  (spawn firm/knowledge/inventories) musi czekać na stabilne
  evaluatory z M7/M11/M15 (World Generation Spec §25: "Shared
  viability rules").
- Localization key coverage równolegle z każdym milestone'em od M2.

DEFERRED WORK (świadomie poza obecnym zakresem, patrz sekcja 8):
- M26 Scale Certification (250-3000 regionów) -- po VS Freeze.
- M27 Long-Run Certification (500/1000 lat) -- po VS Freeze.
- M28 Content/Locale Expansion (28/38/64 katalog, 14 języków) -- po VS
  Freeze.
- M29 World Generation MVP scaling (multi-continent, Small/Standard) --
  po VS Freeze.
- Warfare, Diplomacy, full States/Nations, advanced Politics --
  DEFERRED bez daty, wymaga osobnej specyfikacji przed aktywacją.
- Advanced Banking/Credit, Currencies, pełny Ownership -- DEFERRED.
- Pełny Culture Model, Historical Characters -- DEFERRED.
- Power Grid Topology, Multiplayer, Modding UI -- DEFERRED.
- Steamworks integration -- po ustabilizowaniu lokalnego save/load i VS
  (Technology Stack Decision §76).
- RTL, języki poza EN/PL -- DEFERRED do MVP/FULL.
```

------------------------------------------------------------------------

# 6A. Parallel UI Foundation Track (v0.2)

Ten tor **nie zmienia numeracji M0--M25** i nie tworzy nowych
milestone'ów gameplayowych. Określa, które elementy nowego
`UI Visual Design System v1.0` i `UI Implementation Spec v1.0` powstają
wcześniej, aby M21 nie stał się monolitycznym wdrożeniem.

``` text
M3/M4  → debug shell + fixture Read Models
M5-M10 → UI-F0: tokens, typography, spacing, FC primitives,
          FCAppShell, FCTopNavigation, FCSimulationBar
M11-M15→ data components + domenowe Read Models
M14/M15→ UI-F1: RegionVisualProfile + FCRegionVignette renderer
M16    → Architect presentation primitives
M17    → FCCausal* component foundation
M18    → funkcjonalny WHY? na prawdziwych danych
M19    → Chronicle components + funkcjonalny World Chronicle
M20    → save/load UI presentation context, jeśli wspierany przez save spec
M21    → pełna integracja Golden UI i UX Vertical Slice
M22    → World Generation → RegionVisualProfile jako pochodna stanu
M23    → 200-letni SIM+UI soak
M24    → UI performance gate
M25    → Golden UI / Anti-Drift conformance gate
```

## Read Model Definition of Done

Od `M5` każdy system, który ma dane widoczne dla gracza, ma w swoim DoD:

1.  domenowa logika pozostaje w Simulation Core;
2.  istnieje typed Read Model/query albo jawnie udokumentowany brak
    user-facing danych;
3.  UI nie musi rekonstruować reguł domenowych z surowego World State;
4.  fixture Read Model istnieje tam, gdzie ekran/komponent może być
    rozwijany przed pełną integracją systemu;
5.  zmiana Read Modelu ma test kontraktu.

## Dostępność referencji UI

Golden UI są opisane tekstowo, ale ich pliki/odnośniki nie są dostępne w
repo (stan 2026-09-16). Należy je udostępnić przed review zgodności
wizualnej ekranów oraz gate M25. Nie blokuje to M1 ani implementacji
tekstowych kontraktów UI Foundation; odbiór wizualny pozostaje otwarty.

## Anti-AI / Anti-Drift

Wszystkie prace UI od pierwszego komponentu podlegają
`FIRST-CAUSE-UI-Visual-Design-System-v1.0.md`:

-   whitespace przed panelami/kartami,
-   ograniczona ikonografia,
-   brak lokalnych HEX/font-size poza tokenami,
-   brak nowych wzorców wizualnych bez uzasadnienia,
-   `React` renderuje Read Models, `PixiJS` Living Atlas,
-   świat może się poruszać; UI pozostaje spokojne.

# 7. Checkpointy

  Checkpoint   Nazwa                  Po milestone   Definicja
  ------------ ---------------------- -------------- --------------------------------------------------------------
  CP0          Technical Foundation   M3             Deterministyczny pusty świat z encjami, bez gospodarki.
  CP1          First Living Economy   M10            Świat produkuje, konsumuje, handluje, reaguje na ceny.
  CP2          Emergent Economy       M12            Firmy autonomicznie zakładają się, rosną, upadają.
  CP3          Explainable World      M18            WHY? wyjaśnia dowolną istotną konsekwencję.
  CP4          Historical World       M19            Chronicle wybiera i zapisuje znaczące procesy.
  CP5          Architect Playable     M16+M17+M18    Interwencje gracza działają przez realny graf przyczynowy
                                                     (wymaga interwencji z M16, propagacji z M17 i WHY z M18).
  CP6          Procedural World       M22            Można wygenerować nowy 32-regionowy świat z dowolnego seeda.
  CP7          Vertical Slice         M25            Black Mountain end-to-end, determinizm, save/load, 200 lat.

------------------------------------------------------------------------

# 8. Systemy i decyzje poza obecnym zakresem

Zgodnie z `Canonical Decisions` (`DEFER-001`...`DEFER-012`) oraz
`Master Audit` §127, następujące pozycje **nie powstają** w ramach
`M0`--`M29`:

``` text
Warfare Master Spec
Diplomacy Master Spec
Full Politics / State Formation Spec
Full Historical Character Simulation
Full Banking / Credit System
Currencies
Advanced Ownership
Power Grid Topology
Multiplayer
Modding UI
RTL / języki poza EN, PL (do MVP)
LLM-generated content (opcjonalne, presentation-only, nigdy P0)
```

Nowy duży dokument projektowy powstaje **tylko wtedy, gdy usuwa
konkretny blocker implementacyjny** (`Canonical Decisions IMPL-002`).
Ten harmonogram sam w sobie nie jest zaproszeniem do projektowania
kolejnych systemów.

------------------------------------------------------------------------

# 9. Cross-cutting concerns --- zasady dla każdego milestone'u

Poniższe reguły obowiązują **każdy** milestone od `M0` do `M29` i nie są
powtarzane w każdej sekcji milestone'u osobno:

1.  **Determinism (`IMPL-012`, `SAVE-001`--`SAVE-005`):** każda nowa
    mutacja World State przechodzi
    `READ → CALCULATE → VALIDATE →     COMMIT → EMIT FACTS`; brak
    `Math.random()`, brak systemowego czasu, brak nondeterministic UUID.
2.  **Causal hooks (`IMPL-012`):** każda znacząca mutacja od `M5` w górę
    powinna przewidywać emisję `SimulationFact`/`CausalContext`, nawet
    jeśli pełna integracja Causality Engine następuje dopiero w `M17`.
3.  **Persistence audit (`IMPL-013`):** każde nowe pole runtime ma jawny
    status: canonical persistent / derived reconstructible / transient.
4.  **Performance audit (`IMPL-014`, `PERF-003`):** żaden nowy system
    nie wprowadza wzorca `O(allActors × allRegions)` bez uzasadnienia.
5.  **Localization (`CONTENT-007`, `IMPL-010`):** brak user-facing
    stringów w Simulation Logic; nowe klucze EN + PL od razu.
6.  **No invention (`IMPL-011`):** jeśli wartość tuningowa nie jest
    ustalona w dokumentacji, używamy configurable placeholder + TODO
    tuning --- nie wymyślamy nowej mechaniki.
7.  **No scope creep (`IMPL-010`):** nie implementujemy FULL systemu
    tylko dlatego, że opisuje go dokumentacja, jeśli nie należy do
    bieżącego milestone'u/VS.
8.  **No hardcoding (`ECO-009`, `TEST-003`):** żadna logika specyficzna
    dla `black_mountain` ani innego konkretnego ID w generic engine.
9.  **Tests first (`IMPL-... / TEST-001`):** każdy mechanizm ma test
    jednostkowy/systemowy i invariant zanim zostanie uznany za
    ukończony.

------------------------------------------------------------------------

# 10. Milestone'y --- Vertical Slice (M0--M25)

Format każdego wpisu: Priorytet / Złożoność / Ryzyko / Documentation
Readiness, następnie Cel, Zależności, Implementowane systemy, Moduły,
Dane, Testy, Acceptance Gate, Ryzyka, Poza zakresem, Źródła.

------------------------------------------------------------------------

## M0 --- Repository Foundation

**Faza:** A --- Foundation · **Priorytet:** P0 · **Złożoność:** S ·
**Ryzyko:** LOW · **Documentation Readiness:** READY

**Cel:** działające, testowalne, lintowane repozytorium monorepo z
pustym Electron/React/Vite shellem i workerem, bez żadnej logiki
symulacji.

**Zależności:** brak (punkt startowy).

**Implementowane systemy:** brak systemów gry --- wyłącznie fundament
narzędziowy.

**Moduły:**

``` text
pnpm workspace + packages/{simulation,worldgen,entities,content,
  causality,chronicle,persistence,localization,shared,ui}
apps/desktop (Electron main + preload + renderer)
TypeScript strict (noUncheckedIndexedAccess) w całym repo
Vite dev server dla renderer
Vitest + React Testing Library + Playwright skeleton
ESLint + Prettier
CI (GitHub Actions): install → lint → typecheck → unit tests → build
typed IPC (preload z minimalnym API, contextIsolation:true,
  nodeIntegration:false)
docs/ z istniejącymi kanonicznymi .md (w tym ten dokument)
AGENTS.md / instrukcje dla agentów (Technology Stack Decision §91)
```

**Dane:** brak contentu produkcyjnego; ewentualny placeholder JSON do
potwierdzenia, że loader działa.

**Testy:** smoke test buildu, smoke test testrunnera, lint/typecheck w
CI zielone.

**Acceptance Gate (Technology Stack Decision §97):** desktop app
startuje; React renderuje shell; worker odpowiada na ping; test runner
działa; typecheck/lint zielone; CI zielony; production build powstaje;
renderer bez Node integration.

**Ryzyka:** niskie --- głównie ryzyko niedopasowania wersji
Node/Electron/pnpm (mitygacja: pinowanie wersji, §71 Technology Stack
Decision).

**Poza zakresem:** jakakolwiek logika symulacji, World State, RNG,
content.

**Źródła:** `FIRST-CAUSE-Technology-Stack-Decision-v0.1.md` (całość,
zwłaszcza §1, §10--13, §65--75, §92, §97).

### M0 --- Wyniki wykonania (2026-09-15)

**Status: DONE.**

**Co faktycznie wdrożono:**

-   Git repo (`main`), pnpm monorepo (`apps/*`, `packages/*`),
    TypeScript `strict` + `noUncheckedIndexedAccess` +
    `exactOptionalPropertyTypes` w całym repo.
-   `packages/shared` -- typed IPC contract
    (`SimulationRequest/   Response`, `FirstCauseApi`, `AppInfo`),
    współdzielony przez main, preload i renderer.
-   `packages/content` -- Zod schema (`ResourceDefinitionSchema`),
    `DefinitionRegistry`, loader z pełną walidacją strukturalną i
    semantyczną (duplicate ID), jedna realna definicja
    (`content/resources/iron_ore.json`), testy poprawnej i błędnej
    definicji.
-   `packages/localization` -- `createI18n()` (i18next + react-i18next),
    `locales/en/common.json` + `locales/pl/common.json`, test
    lokalizacji niezależnej od reszty aplikacji.
-   `packages/simulation` -- czysty, testowalny `protocol-handler`
    (PING/PONG, GET_CORE_STATUS), `worker.ts` na `worker_threads`, CLI
    `pnpm sim:run` (headless, zweryfikowane realnym uruchomieniem).
-   `apps/desktop` -- Electron (`electron-vite`) + React + Vite; main
    process z `SimulationBridge` (request/response correlation po
    `requestId`), preload z wąskim `contextBridge` API
    (`getAppInfo`/`pingSimulation`/`getSimulationCoreStatus`), React
    shell (status workera, przełącznik PL/EN, Zustand tylko dla
    `isDeveloperOverlayOpen`).
-   Testy: Vitest (15 testów: schema/registry/i18n/protocol-handler/UI),
    Playwright Electron E2E (pełna ścieżka: start apki → okno → "FIRST
    CAUSE" widoczne → Simulation Worker ONLINE).
-   ESLint (flat config) z regułą architektoniczną blokującą import
    `react`/`react-dom`/`electron`/desktop w `packages/simulation`,
    `packages/content`, `packages/shared`; Prettier; GitHub Actions CI
    (`typecheck → lint → format:check → test → build`, osobny job E2E).
-   `README.md`, `AGENTS.md`.

**Znalezione i naprawione problemy:**

-   **Realny bug, nie problem środowiska:** domyślna konfiguracja
    `electron-vite`'owego `externalizeDepsPlugin()` zostawiała
    `@first-cause/shared` (pakiet ESM: `"type": "module"`) jako
    `require("@first-cause/shared")` w CJS-owym bundlu main/preload, co
    powodowało `ERR_REQUIRE_ESM` i uniemożliwiało odpaleniu się
    aplikacji (a w efekcie -- pierwszy przebieg E2E kończył się
    timeoutem, bo okno nigdy się nie pokazywało). Naprawione przez
    `exclude:   ["@first-cause/shared"]` w `electron.vite.config.ts`,
    dzięki czemu esbuild inline'uje ten pakiet w bundlu zamiast
    requirować go w runtime. Zweryfikowane bezpośrednim uruchomieniem
    `electron   out/main/index.js` przed i po poprawce.
-   Domyślny root-level `pnpm -r run typecheck` failował dla pakietów
    zależnych od innych workspace'owych pakietów, bo `--noEmit` nie
    generuje `dist/*.d.ts` dla zależności. Naprawione: `typecheck`
    najpierw uruchamia `build:packages`.
-   RTL nie czyściło DOM między testami w tym samym pliku (Vitest nie ma
    automatycznego `afterEach(cleanup)` bez `globals: true`) --
    naprawione jawnym `afterEach(cleanup)` w `vitest.setup.ts`.

**Dług techniczny (świadomie pozostawiony, nieblokujący M1):**

-   P1: `pnpm dev` (HMR) nie został zweryfikowany w tym środowisku (brak
    możliwości interaktywnego zostawienia procesu deweloperskiego) --
    zweryfikowano wyłącznie `pnpm build` + uruchomienie zbudowanej
    aplikacji. Import lokalizacji (`../../../locales/...json` z
    `apps/desktop/src`) może teoretycznie wymagać jawnego
    `server.fs.allow` w trybie dev, jeśli Vite nie wykryje automatycznie
    workspace roota -- do zweryfikowania przy pierwszym realnym
    `pnpm dev`.
-   P2: `packages/entities` i `packages/worldgen` świadomie nie zostały
    utworzone w M0 (patrz sekcja 3 tego dokumentu) -- powstaną na
    starcie odpowiednio M3 i M4/M22.
-   P2: brak jeszcze `electron-builder`/instalatora -- `pnpm build`
    produkuje uruchamialny `out/`, nie installer. Nie było to wymagane w
    M0.

**Czy M1 jest odblokowane:** TAK. `pnpm typecheck`, `pnpm lint`,
`pnpm format:check`, `pnpm test`, `pnpm build` i `pnpm test:e2e`
przechodzą w czystym przebiegu.

------------------------------------------------------------------------

## M1 --- Deterministic Core

**Faza:** A --- Foundation · **Priorytet:** P0 · **Złożoność:** M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** deterministyczny szkielet czasu, losowości i identyfikatorów,
na którym każdy późniejszy system będzie mógł polegać bez wyjątków.

**Zależności:** M0.

**Decyzje na początku M1:** krótki ADR obejmujący RNG/version/stream
seeding, deterministic IDs, skalę pieniędzy i rounding/overflow,
canonical serialization/checksum, kolejność Commands na ticku i zakres
gwarancji między platformami (Canonical Decisions §201).

**Implementowane systemy:** SimulationClock/Tick, Seed, deterministic
RNG z nazwanymi streamami, deterministic IDs, canonical ordering,
rounding policy, WorldChecksum, command boundary, minimalny headless
runner.

**Moduły (`packages/simulation/src/core`):**

``` text
core/time    -- tick = integer (0,1,2...), data = f(startYear/Month, tick)
core/rng     -- seeded RNG, rng.stream("migration"), rng.stream("company_ai")...
core/ids     -- deterministic stable IDs (world-local numeric lub deterministic string)
core/validation -- assertion helpers (no NaN/Infinity, bounds)
core/serialization -- canonical serialization (sorted map/set, stable entity order)
core/checksum -- WorldChecksum (wersjonowany algorytm hashujący)
```

**Dane:** brak contentu; wyłącznie konfiguracja RNG streams (§SAVE-003:
`world_generation, demography, company_ai, entrepreneurship, migration, discovery, events, naming`).

**Testy:** RNG golden vectors, determinism smoke
(`same seed = same checksum`), ×1 vs headless batch equality, stable
iteration order test, brak `Math.random()` w Simulation Core (lint rule
/ grep check).

**Acceptance Gate (Technology Stack Decision §98):** 10 000 pustych
ticków reprodukowalnych; RNG golden tests przechodzą; ×1 i headless
batch dają ten sam checksum; minimalny core state save/restore daje
identyczny wynik.

**Ryzyka:** floating-point divergence między platformami (mitygacja:
centralna rounding policy, integer/fixed-point dla money od razu ---
`Canonical Decisions` OPEN-008/§27 Technology Stack Decision); pokusa
odłożenia determinizmu „na później" (świadomie odrzucona ---
`Canonical Decisions` SAVE/§75 Master Audit: „Determinism P0 od
pierwszego dnia").

**Poza zakresem:** World State, encje domenowe, content.

**Źródła:** `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
(§6--30), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (SAVE-001--006,
PERF-\*), `FIRST-CAUSE-Technology-Stack-Decision-v0.1.md` (§29--35,
§82--88, §93, §98).

### M1 --- Wyniki wykonania (2026-09-16)

**Status: DONE.**

**ADR:** `docs/adr/ADR-001-m1-deterministic-core.md` zapisuje decyzje
otwarte przez `Canonical Decisions` §201/OPEN-008 (algorytm i wersja
RNG, wyprowadzanie streamów, strategia ID, rounding/overflow, canonical
serialization/checksum, kolejność Commands na ticku, gwarancje
platformowe) -- zgodnie z wymogiem, że są to decyzje do podjęcia *w* M1,
nie założenia sprzed niego.

**Co faktycznie wdrożono (`packages/simulation/src/core`):**

-   `core/time` -- `SimulationClock`/`tickToDate`: tick jako integer,
    data = f(startYear/startMonth, tick), 1 tick = 1 miesiąc (SIM-001).
-   `core/rng` -- własny `xoshiro128**` (128-bit state, wyłącznie 32-bit
    `Math.imul`/bitwise, bez BigInt/floatów w rdzeniu), seedowany przez
    `splitmix32`; `WorldRng.stream(name, scopeId?)` z ośmioma
    kanonicznymi streamami SAVE-003, deterministycznie wyprowadzanymi
    (`fnv1a32(worldSeed:streamName:scopeId)`);
    `nextUint32/nextFloat/nextInt` (ten ostatni przez unbiased Lemire
    rejection sampling, nie `% n`).
-   `core/ids` -- `IdGenerator`: monotoniczny licznik per-prefix
    (`company_004281`-style), nigdy hash ani `crypto.randomUUID`.
-   `core/validation` --
    `assertFinite/assertNonNegative/     assertSafeInteger/assertInteger` +
    `InvariantViolationError`.
-   `core/rounding` -- rozstrzyga OPEN-008: pieniądze jako integer minor
    units (`MONEY_SCALE = 100`), `roundHalfEven` (banker's rounding,
    uzasadnienie w ADR-001), overflow-guard przez
    `Number.MAX_SAFE_INTEGER`.
-   `core/serialization` -- `canonicalStringify`: sortowane klucze
    obiektów, posortowane wpisy `Map`/wartości `Set`, pominięte pola
    `undefined`, odrzucone NaN/Infinity zamiast cichej koercji do
    `null`.
-   `core/checksum` -- `computeChecksum` (`fnv1a32x2-v1`, dwa
    niezależnie zaseedowane przebiegi FNV-1a-32 nad canonical
    serialization) -- WorldChecksum do testów determinizmu (SAVE-010).
-   `core/commands` -- `CommandBoundary`:
    `enqueue(scheduledForTick,     command)` z monotonicznym `sequence`,
    `drain(tick)` zwraca tylko komendy na dany tick, posortowane po
    `sequence`; brak mid-tick application (SAVE-006). Generyczny
    mechanizm -- bez konkretnych typów Command (te powstają z systemami,
    które ich potrzebują, M3+).
-   `core/runner` -- `HeadlessRunner`: minimalny headless runner
    spinający zegar/RNG/command boundary; `step()`/`runTicks(n)`,
    `getState()`/`HeadlessRunner.fromState()` (save/restore roundtrip),
    `checksum()`. Brak World State/systemów gospodarczych (poza zakresem
    M1) -- `step()` drenuje kolejkę komend i przesuwa zegar, dowodząc
    kontraktu przed istnieniem realnych komend.
-   ESLint: nowa reguła (`packages/simulation/src/core/**`) blokująca
    `Math.random`, `Date.now`, `new Date()`, `crypto.randomUUID` (
    SAVE-004), zweryfikowana pozytywnym testem wykrycia naruszenia.
-   `pnpm sim:run` zaktualizowany: po statusie workera uruchamia
    12-tickowe demo `HeadlessRunner` i drukuje tick/datę/checksum.
-   62 nowe testy Vitest (RNG golden vectors, determinism/state
    roundtrip, canonical serialization, checksum, command ordering,
    rounding bias, oraz akceptacyjne testy runnera: 10 000 pustych
    ticków reprodukowalnych, ×1 vs `runTicks` batch equality,
    save/restore roundtrip mid-run).

**Acceptance Gate (Technology Stack Decision §98) -- zweryfikowane:** 10
000 pustych ticków reprodukowalnych (`runner.test.ts`); RNG golden tests
przechodzą; ×1 (stepwise) i `runTicks` batch dają ten sam checksum;
save/restore mid-run (w tym z dotkniętym streamem RNG) daje identyczny
checksum jak nieprzerwany bieg.

**Bramki jakości (2026-09-16):** `pnpm typecheck`, `pnpm lint`,
`pnpm format:check`, `pnpm test` (94/94 testów), `pnpm build` i
`pnpm test:e2e` -- wszystkie zielone w czystym przebiegu.

**Dług techniczny / świadomie poza zakresem:** brak konkretnych typów
Command (M3+); `core/rounding` ustala politykę wyłącznie dla pieniędzy
-- zaokrąglanie ilości dóbr/populacji należy do ich własnych domen, gdy
powstaną; `RngStream.nextInt` i `canonicalStringify` nie mają jeszcze
żadnego rzeczywistego konsumenta domenowego (M1 dowodzi mechanizmu, nie
zużywa go jeszcze) -- to nie jest brakujący zakres M1.

**Czy M2 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M2 --- Data Foundation

**Faza:** A --- Foundation · **Priorytet:** P0 · **Złożoność:** M ·
**Ryzyko:** LOW-MEDIUM · **Documentation Readiness:** READY

**Cel:** pipeline
`JSON → Zod → semantic validation → immutable Definition Registry`,
gotowy na przyjęcie pierwszych definicji contentu i kluczy
lokalizacyjnych.

**Zależności:** M1 (deterministic IDs/loading order).

**Implementowane systemy:** Content Definitions, Zod schemas, Definition
Registry, semantic validation (missing refs, duplicate IDs, cycles,
phase violations), stable content IDs, localization key skeleton
(i18next), Content Phase (`VS/MVP/FULL`).

**Moduły (`packages/content`, `packages/localization`):**

``` text
content/definitions -- schema Zod per typ (Resource, Good, CompanyArchetype,
  ProductionMethod, Discovery, Service, TransportMode, Intervention,
  EventType, ChronicleTemplate)
content/loaders     -- JSON → parse → Zod → registry
content/validators  -- semantic validation (refs, duplicates, cycles, phase deps)
localization/       -- locales/en, locales/pl, ładowanie i18next, brak
                        hardcoded stringów w Simulation Core
```

**Dane:** pierwsze definicje Vertical Slice --- wystarczy niewielki
podzbiór (np. 2--3 resources, 2--3 goods) do przetestowania pipeline'u;
pełny katalog VS (12 resources/20 goods/17 archetypów) rośnie
przyrostowo w kolejnych milestone'ach.

**Testy:** duplicate ID, missing ref, invalid range, dependency cycle,
phase violation, missing EN/PL key --- każdy jako osobny test
walidatora; content load determinism (ten sam zestaw plików = ten sam
registry).

**Acceptance Gate:** loader odrzuca celowo błędny JSON z czytelnym
błędem; poprawny JSON tworzy immutable registry; EN i PL nie zmieniają
`contentVersion`/checksum; CI uruchamia walidator przy każdym PR.

**Ryzyka:** niedoszacowanie liczby reguł walidacji na starcie
(mitygacja: `Content-Localization Spec` §139--148 zawiera gotową listę
kontroli --- nie trzeba jej wymyślać).

**Poza zakresem:** World State (instancje), pełny katalog 38/64/28,
języki poza EN/PL.

**Źródła:** `FIRST-CAUSE-Content-Localization-Spec-v0.1.md` (§27--60,
§130--165), `FIRST-CAUSE-Technology-Stack-Decision-v0.1.md` (§19--25,
§94), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (DATA-*, CONTENT-*).

### M2 --- Wyniki wykonania (2026-09-16)

**Status: DONE.**

**Co faktycznie wdrożono (`packages/content/src`):**

-   `schema/` --- Zod schema dla wszystkich 10 typów z modułu M2
    (`Resource, Good, CompanyArchetype, ProductionMethod, Discovery,     Service, TransportMode, Intervention, EventType,     ChronicleTemplate`),
    oparte wprost na polach "Minimalnie" z `Content-Localization-Spec`
    §41--50, nie na głębszym modelu z `Production-Economy-Master` (ten
    należy do M5/M7). Pola bez ustalonej jeszcze mechaniki
    (`occurrenceRules`, `productivity`, `workforceProfile`, ...) są
    otwartymi bagami danych ("configurable placeholder + TODO tuning",
    `AGENTS.md`), nie wymyśloną strukturą. `KnowledgeDomainDefinition`
    (§4) świadomie pominięty --- to zakres M15; pola odwołujące się do
    domen wiedzy (`primaryDomainId`) są poprawnymi `ContentId`ami, ale
    nie są jeszcze walidowane krzyżowo.
-   Ujednolicono nazwę pola fazy na `implementationPhase` (zgodnie z
    CONTENT-008/§31) w miejsce placeholderowego `phase` z M0; naprawiono
    też `ResourceDefinition.finite` -\> `renewable` (§41).
    Zaktualizowano istniejącą fixture `content/resources/iron_ore.json`
    i test M0 pod nową nazwę pól -- świadoma, w zakresie M2 zmiana (M2
    jest milestone'em odpowiedzialnym za realne schematy, M0 był jawnie
    "M0 scope only" placeholderem).
-   `schema/reference-field.ts` --- deklaratywny opis pól-referencji
    (`ReferenceFieldSpec`/`ContentTypeSpec`) per typ: który target type,
    czy self-referencyjne pole jest sprawdzane pod kątem cykli. Napędza
    generyczne walidatory zamiast pisania osobnej logiki per typ.
-   `loaders/create-definition-loader.ts` --- generyczny
    `JSON -> Zod -> duplicate ID -> DefinitionRegistry` (zastępuje
    bespoke `loadResourceDefinitions` z M0, który stał się cienkim
    wrapperem nad nim, z zachowanym publicznym API/testami).
-   `loaders/content-pack.ts` --- `loadContentPack`: ładuje wszystkie 10
    typów naraz, agreguje `registries`/`errors`/`warnings`/`stats`
    (Content Statistics, §147), uruchamia walidację krzyżową.
-   `validators/reference-validation.ts` --- missing reference,
    dependency cycles (DFS three-color, deterministyczny start po
    posortowanych ID), phase violations (CONTENT-009: wcześniejsza faza
    nie może zależeć wyłącznie od późniejszej).
-   `validators/localization-coverage.ts` --- brak klucza w `en` = FAIL
    (§143), brak w innym locale = warning z fallbackiem (§144), nie
    blokuje `ok`.
-   Realne dane VS: `content/resources/{iron_ore,grain,timber}.json`,
    `content/goods/{flour,bread}.json` (niewielki podzbiór, zgodnie z
    "Dane" w tym dokumencie), z kompletnymi kluczami `content.*` w
    `locales/en|pl/common.json`.
-   62 nowe testy Vitest: po jednym osobnym teście na każdą pozycję z
    CONTENT-010 (duplicate ID, cross-type ID collision, missing ref,
    invalid range, dependency cycle, phase violation, missing EN key,
    missing secondary-locale warning), test determinizmu ładowania
    (shuffle kolejności plików -\> identyczny wynik), 40 testów
    schema-poziomu (walidacja struktury każdego z 10 typów) i
    integracyjny test czytający prawdziwe pliki z `content/`/`locales/`
    z dysku przez `node:fs`.

**Acceptance Gate -- zweryfikowane:** loader odrzuca błędny JSON z
czytelnym błędem
(`[typeName] Definition at index N failed schema validation: ...`);
poprawny JSON tworzy immutable registry (`DefinitionRegistry`,
deep-frozen, jak w M0); EN/PL nigdy nie wpływają na `registries`/`stats`
(locale wpływa wyłącznie na `errors`/`warnings` walidatora lokalizacji)
-- pełne rozstrzygnięcie `contentVersion`/checksum jako osobnego,
wersjonowanego pola zostaje w M20 (SAVE-007), zgodnie z notatką z M0.

**Bramki jakości (2026-09-16):** `pnpm typecheck`, `pnpm lint` (1
warning na `any` w celowo poluzowanym typie Zod Input, patrz komentarz w
`schema/reference-field.ts` -- nie error), `pnpm format:check`,
`pnpm test` (146/146 testów), `pnpm build` i `pnpm test:e2e` --
wszystkie zielone w czystym przebiegu.

**Dług techniczny / świadomie poza zakresem:** brak
`KnowledgeDomainDefinition` (M15); pola polimorficzne
(`Discovery.unlocks`) nie są walidowane krzyżowo, dopóki nie istnieją
ich konsumenci (M7+); "invalid production chains" z Technology Stack
Decision §22 pozostaje zakresem M7 (Production) -- nie da się sensownie
zwalidować łańcuchów produkcji bez logiki produkcji; pełny katalog 12
resources/20 goods/17 archetypów rośnie przyrostowo od M5 dalej, zgodnie
z pierwotnym planem tego dokumentu.

**Czy M3 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M3 --- World State Foundation

**Faza:** A --- Foundation · **Priorytet:** P0 · **Złożoność:** M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** minimalny, ale kompletny model runtime World State zgodny z
Entity Data Model, z jawną własnością danych (canonical vs derived) i
podstawowymi indeksami.

**Zależności:** M1, M2.

**Implementowane systemy:** World, Continent, Region, Connection,
ResourceDeposit (struktura, bez pełnej logiki M5), PopulationCohort
(struktura, bez demografii M6), Settlement, Company (struktura),
Inventory, Market (struktura), TechnologyState (struktura), runtime
indexes.

**Moduły (`packages/entities`, `src/world`):**

``` text
world/world, world/geography, world/regions, world/connections,
  world/environment
population/cohorts (struktura)
economy/resources, economy/markets, economy/inventory, economy/companies
  (struktury, bez systemowej logiki)
technology/knowledge (struktura TechnologyState)
society/settlements (struktura)
core/ indexes: companiesByRegion, cohortsByRegion, depositsByRegion,
  settlementsByRegion, connectionsByRegion
```

**Dane:** brak nowego contentu poza tym, co przygotowano w M2; schematy
instancji (nie definicji) dla każdej encji.

**Testy:** referential integrity (brak dangling refs), invariants
globalne (`population >= 0`, `deposit >= 0`, `inventory >= 0`,
`price > 0`, brak NaN/Infinity), save/load roundtrip pustego świata z
encjami, stable iteration order przy iteracji po encjach.

**Acceptance Gate:** można utworzyć świat z N regionami i podstawowymi
encjami, zapisać i wczytać go z identycznym checksumem; indeksy są
rekonstruowalne z canonical state.

**Ryzyka:** przedwczesne zamrożenie kształtu encji przed poznaniem
realnych potrzeb systemów gospodarczych (mitygacja: Entity Data Model
jest już wystarczająco szczegółowy --- ryzyko niskie, ale trzeba
pilnować `DATA-003`/`IMPL-013` przy każdym nowym polu).

**Poza zakresem:** jakakolwiek logika ekonomiczna, demograficzna, AI;
Black Mountain fixture (to M4).

**Źródła:** `FIRST-CAUSE-Entity-Data-Model-v0.1.md` (§4--43, §59--68),
`FIRST-CAUSE-Technology-Stack-Decision-v0.1.md` (§34, §95).

**Checkpoint:** **CP0 --- Technical Foundation** osiągnięty po tym
milestone.

### M3 --- Wyniki wykonania (2026-09-16)

**Status: DONE.**

**Nowy pakiet:** `packages/entities` (utworzony przy pierwszym realnym
konsumencie, zgodnie z notatką z M0). Celowo **bez zależności
produkcyjnej** od `packages/simulation` (tylko `devDependency` do testu
roundtrip checksum) -- inaczej M5+, gdy systemy w `packages/simulation`
zaczną operować na typach encji, powstałby cykl importów. Uzasadnienie w
komentarzu `packages/entities/src/core/validation.ts`. Z tego samego
powodu `core/validation.ts` w `entities` jest małą, samodzielną kopią
odpowiednika z `packages/simulation` -- nie re-eksportem.

**Co faktycznie wdrożono:**

-   11 typów encji z listy "Implementowane systemy" M3 --- `World`,
    `Continent`, `Region` (+ `geography`/`environment` jako osobne
    moduły, zgodnie z listą "Moduły"), `Connection`, `ResourceDeposit`,
    `Settlement`, `PopulationCohort`, `Company`, `Market`, `Inventory`,
    `TechnologyState` --- każdy jako typowany interfejs + `create*()`
    factory z asercjami niezmienników (`core/validation.ts`: brak
    ujemnych zapasów/populacji, brak self-loop connection, itd. --
    reguła 9 Entity Data Model).
-   Świadomie **pominięto** pola odwołujące się do typów encji spoza
    zakresu M3 (`Culture`, `Nation`, `State`, `Infrastructure`,
    `ServiceCapacity`, `HistoricalCharacter`, Architect/SimulationFact/
    Chronicle) -- `Region.society`/`Region.politics`,
    `PopulationCohort.identity`, `Company.ai`,
    `Settlement.services`/`.infrastructure`/`.society` nie istnieją w
    M3, żeby nie tworzyć "wiszących referencji" do typów, których
    jeszcze nie ma (reguła 9). Udokumentowane w komentarzach przy każdym
    typie.
-   `world-state.ts` (`createWorldState`): scala 11 typów encji w jeden
    `WorldState`, waliduje **każdą referencję w przód** (Region -\>
    Continent, Connection -\> Region x2, Company -\> Inventory, itd.,
    rzuca `InvariantViolationError` przy wiszącej referencji), a
    następnie **odtwarza** każdy cache odwołań-wstecz
    (`World.regionIds`, `Continent.regionIds`,
    `Region.resources.depositIds`, `Region.population.totalPopulation`
    itd.) z encji kanonicznych -- referencje w przód (dziecko -\>
    rodzic) są jedynym źródłem prawdy; back-referencje nigdy nie są
    ręcznie utrzymywane przez wywołującego. Bezpośrednio realizuje
    DATA-003/DATA-004.
-   `core/indexes.ts` (`groupIdsBy`, `toById`) +
    `indexes/world-indexes.ts` (`buildWorldIndexes`) --- dokładnie 5
    indeksów z listy modułów M3: `companiesByRegion`, `cohortsByRegion`,
    `depositsByRegion`, `settlementsByRegion`, `connectionsByRegion`
    (ten ostatni dwukierunkowy -- connection należy do list obu swoich
    regionów). Budowane od nowa z map kanonicznych przy każdym
    wywołaniu, nigdy cache'owane -- rekonstruowalność jest własnością z
    definicji, nie czymś testowanym osobno.
-   `recomputeRegionTotalPopulation` -- jawna funkcja odtwarzająca
    `Region.population.totalPopulation`/`Settlement.population.totalPopulation`
    z sumy `PopulationCohort.population`, dowodząca DATA-004
    ("`Region.totalPopulation` może być cache; canoniczna populacja
    należy do `PopulationCohort`") działaniem, nie tylko deklaracją.
-   42 nowe testy Vitest: po jednym module na typ encji (walidacja
    happy-path + odrzucenie niezmiennika), `world-state.test.ts`
    (referential integrity na 3 różne wiszące referencje, odtwarzanie
    back-referencji niezależne od kolejności inputu -- SIM-005, checksum
    roundtrip), `indexes/world-indexes.test.ts` (rekonstruowalność,
    dwukierunkowość connections).

**Save/load roundtrip (Testy M3):** zrealizowany przez
`canonicalStringify`/`computeChecksum` z `packages/simulation`
(`@first-cause/simulation` jako `devDependency`, użyty wyłącznie w
`world-state.test.ts`): `computeChecksum(state)` ==
`computeChecksum(JSON.parse(canonicalStringify(state)))`. To dowodzi
struktury kanonicznej serializacji na `WorldState`; pełny plikowy
save/load z `schemaVersion`/`contentVersion` pozostaje M20 (SAVE-007),
zgodnie z notatką z M0/M1.

**Acceptance Gate -- zweryfikowane:** można utworzyć świat z N regionami
i podstawowymi encjami (fixture w `world-state.test.ts`: 2 regiony,
connection, deposit, settlement, 2 kohorty, company, market, technology
state); zapis/odczyt (canonical roundtrip) daje identyczny checksum;
indeksy (`WorldIndexes` i denormalizowane pola na encjach) są
rekonstruowalne z canonical state.

**Bramki jakości (2026-09-16):** `pnpm typecheck`, `pnpm lint` (ten sam
1 warning z M2, bez zmian), `pnpm format:check`, `pnpm test` (188/188
testów), `pnpm build` i `pnpm test:e2e` -- wszystkie zielone w czystym
przebiegu. Reguła ESLint blokująca import React/Electron (SS6 AGENTS.md)
rozszerzona o `packages/entities/**`.

**Dług techniczny / świadomie poza zakresem:** ID encji są w M3
dostarczane przez wywołującego (proste, niepuste stringi) --
deterministyczne generowanie ID (`core/ids.ts` z M1) i faktyczne
podłączenie `SimulationClock`/`WorldRng` do `World.currentTick`/`seed`
zostaje dla M4 (fixture) i systemów, które realnie tickują świat (M5+);
`World`/`Region` nie przechowują jeszcze `rngState`/`history`
(facts/Chronicle) ani `schemaVersion`/`contentVersion` -- pola systemów,
które jeszcze nie istnieją (M17/M19/M20). `Market`/`TechnologyState`
zaczynają puste -- inwarianty `price > 0` stosują się dopiero, gdy M8
zacznie wypełniać `goods`.

**Czy M4 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M4 --- Black Mountain Reference Fixture

**Faza:** A --- Foundation · **Priorytet:** P0 · **Złożoność:** S/M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** ręcznie zdefiniowany, deterministyczny, kontrolowany mini-świat
(8--12 regionów), zawierający Black Mountain i jego ekosystem, na którym
rozwijane będą systemy gospodarcze --- zanim istnieje proceduralny
generator.

**Zależności:** M3.

**Implementowane systemy:** brak nowych systemów --- wyłącznie dane
fixture + loader fixture (osobny od proceduralnego World Generation).

**UI Foundation (v0.2):** na bazie fixture powstają pierwsze typed
fixture Read Models, co najmniej `WorldSummaryReadModel`,
`RegionSummaryReadModel`, `ImportantNowReadModel` i
`AtlasRegionReadModel`. Są to kontrakty prezentacyjne, nie kopie pełnego
World State.

**Moduły:**

``` text
tests/worldgen/fixtures/black_mountain_reference.json (lub równoważny)
worldgen/fixtures loader -- generic, nie zna pojęcia "blackMountain"
```

**Dane:** Black Mountain (hidden/unknown Iron Ore), food-producing
region, trade-connected settlement, potencjalne źródło labor/migration,
alternatywny region gospodarczy, realny transport cost/bottleneck (World
Generation Spec §16, §35).

**Testy:** fixture ładuje się bez błędów walidacji; hidden Iron Ore
istnieje fizycznie, ale mine nie jest wymuszone na starcie; istnieje
route do zewnętrznego rynku; generic simulation modules nie zawierają
żadnego ID specyficznego dla `black_mountain` (grep-based test).

**Acceptance Gate:** fixture przechodzi walidację World State (M3);
świat da się uruchomić przez pojedynczy pusty tick bez błędu (nawet
jeśli systemy gospodarcze jeszcze nie istnieją, powinien to być no-op
przechodzący walidację).

**Ryzyka:** pokusa „podrasowania" fixture pod z góry założony wynik
(zakazane przez `TEST-003`/`ECO-009` --- Black Mountain nie jest
skryptem); mitygacja: fixture opisuje wyłącznie warunki początkowe,
wynik ma być emergentny.

**Poza zakresem:** proceduralny generator (M22); pełny 32-regionowy
Reference VS (World Generation Spec §64: najpierw mały prototyp).

**Źródła:** `FIRST-CAUSE-World-Generation-Spec-v0.1.md` (§16, §35--36,
§53, §64), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (IMPL-005).

### M4 --- Wyniki wykonania (2026-09-16)

**Status: DONE.**

**Poprawka odkryta przy okazji M4 (koryguje M3, `Canonical Decisions`
§200 "zasada końcowa" -- to *odkryty błąd*, nie retrospektywna zmiana
zakresu):** M3 dodało `packages/entities` z `devDependency` na
`@first-cause/simulation` (dla testu roundtrip checksum). M4 wymagało,
żeby `packages/simulation` (Read Models) zależało *produkcyjnie* od
`packages/entities` -- co razem tworzyło realny cykl w grafie pnpm
workspace (`pnpm install` ostrzegał: "cyclic workspace dependencies").
Naprawione: usunięto `devDependency` z `packages/entities`, a test
roundtrip w `world-state.test.ts` przepisano na zwykły
`JSON.stringify`/`JSON.parse` (WorldState nie używa nigdzie `Map`/`Set`,
więc nie potrzebuje `canonicalStringify` z M1, żeby udowodnić tę samą
własność). `packages/entities` pozostaje bez żadnej zależności
produkcyjnej od `packages/simulation`; kierunek `simulation -> entities`
(Read Models) jest teraz jedyny i bezpieczny.

**Nowe pakiety:**

-   `packages/worldgen` (utworzony przy pierwszym realnym konsumencie,
    zgodnie z notatką z M0 -- "worldgen powstanie na starcie M4/M22").
    `fixtures/fixture-schema.ts` (Zod, lustrzane odbicie pól
    `Create*Input` z `@first-cause/entities`) +
    `fixtures/load-world-fixture.ts`
    (`JSON -> Zod -> entity factories -> createWorldState`, generyczny
    -- nie zna pojęcia żadnego konkretnego scenariusza referencyjnego).
-   `packages/simulation/src/read-models/` -- pierwsza produkcyjna
    zależność `simulation -> entities`. Cztery kontrakty z modułu UI
    Foundation M4: `WorldSummaryReadModel`, `RegionSummaryReadModel`,
    `AtlasRegionReadModel`, `ImportantNowReadModel`. Pola wymagające
    jeszcze nieistniejącego systemu (trend/historia ticków -- M6+;
    Important Now źródła -- Chronicle/shortages/discoveries/migration/
    interventions, M8/M10/M13/M15/M16/M19) są świadomie pominięte
    zamiast wymyślone; `buildImportantNowReadModel` zwraca `[]` z
    udokumentowanym powodem (Read Model DoD §6A pkt 2: "typed Read Model
    albo jawnie udokumentowany brak danych").

**Dane fixture:**
`tests/worldgen/fixtures/black_mountain_reference.json` -- 8 regionów, 1
kontynent, \~50 populacji, 4 osady, 3 złoża (iron_ore w Black Mountain
jako hidden/UNKNOWN, grain w Green Valley, timber w Timberland --
wszystkie odwołują się do prawdziwych definicji contentu z M2), 7
połączeń (drzewo łączące wszystkie regiony), 1 firma (grain farm w Green
Valley) + inventory, 1 market (Riverside -- "route do zewnętrznego
rynku" dla Black Mountain), 4 TechnologyState. Zgodne z World Generation
Spec §64 "Pierwszy prototyp" (8--12 regionów, \~50 populacji, 3--5
osad).

*Aktualizacja 2026-09-27 (decyzja właściciela 2A+3C, wariant C):* każda
z 8 rodzin kohort ma pełną strukturę wieku (33 kohorty, sumy rodzin i
regionów bez zmian, nadal 50), więc żadna rodzina nie jest z góry
bezpłodna. Obok powstał wariant
`tests/worldgen/fixtures/black_mountain_vs_scale.json` -- ten sam świat
(te same regiony, osady, złoża, firmy, połączenia i seed), ale 198
populacji w skali Reference VS (VS Spec §2.3, World Generation Spec
§17), do długich przebiegów demografii i tempa technologii. Prototyp
zostaje przy §64.

**Testy:** 21 nowych testów Vitest -- strukturalne odrzucenie złego JSON
(`loadWorldFixture`), 7 testów na konkretnym fixture Black Mountain
(liczba regionów/populacja, hidden Iron Ore + brak wymuszonej kopalni,
route do rynku przez BFS po grafie połączeń, food-producing region,
alternatywny region gospodarczy, realny transport cost), grep-based test
że `packages/worldgen`/`packages/entities`/ `packages/simulation` (poza
plikami `.test.ts`) nie zawierają żadnego identyfikatora specyficznego
dla Black Mountain, test pojedynczego pustego ticka (M1
`HeadlessRunner.step()` obok prawdziwego `WorldState`, bez błędu,
`WorldState` niezmieniony), 9 testów kontraktowych Read Modeli.

**Acceptance Gate -- zweryfikowane:** fixture przechodzi walidację World
State (M3 `createWorldState`, w tym referencyjną integralność); świat
przechodzi pojedynczy pusty tick bez błędu jako no-op.

**Bramki jakości (2026-09-16):** `pnpm typecheck`, `pnpm lint` (ten sam
1 warning z M2, bez zmian), `pnpm format:check`, `pnpm test` (208/208
testów), `pnpm build` i `pnpm test:e2e` -- wszystkie zielone w czystym
przebiegu. Reguła ESLint blokująca import React/Electron rozszerzona o
`packages/worldgen/**`.

**Dług techniczny / świadomie poza zakresem:** proceduralny generator
(M22); pełny 32-regionowy Reference VS z 12 resources/20 goods (World
Generation Spec §64 -- najpierw mały prototyp, zrobione tutaj);
`resourceDefinitionId`/`archetypeId` w fixture nie są jeszcze walidowane
krzyżowo względem rejestrów contentu z M2 (np. `grain_farm` jako
`archetypeId` nie ma jeszcze odpowiadającej
`CompanyArchetypeDefinition`) -- cross-package walidacja
content\<-\>worldgen nie jest wymagana przez M4 i zostaje otwarta do
momentu, gdy realny konsument (M7+) tego zapotrzebuje.

**Czy M5 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M5 --- Resources

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** S · **Ryzyko:** LOW · **Documentation Readiness:** READY

**Cel:** fizyczne złoża istnieją, mogą być odkrywane, wydobywane i
wyczerpywane; system zaczyna emitować podstawowe Simulation Facts
(cross-cutting start Causality, patrz sekcja 9).

**Zależności:** M4. *(Może iść równolegle z M6.)*

**Implementowane systemy:** ResourceDeposit lifecycle (hidden → partial
→ known), extraction, depletion, renewable resources (sustainable
yield), resource invariants, pierwsze `SimulationFact` (np.
`RESOURCE_DISCOVERED`, `DEPOSIT_DEPLETED`).

**UI Foundation Track:** start `UI-F0`: Design Tokens, role
typograficzne, spacing scale oraz podstawowe `FC*` (`FCSection`,
`FCPanel`, `FCTextButton`, `FCPrimaryAction`, `FCTabs`, `FCMetric`,
`FCTrend`), następnie `FCAppShell`, `FCTopNavigation`,
`FCSimulationBar`. System Resources wystawia UI-ready Read Model zamiast
wymagać od Reacta interpretacji surowych depositów.

**Moduły (`economy/resources`):**

``` text
resources/deposit-lifecycle
resources/extraction
resources/depletion
resources/renewable (sustainableYield, regeneration, carryingCapacity)
causality/facts (CE-01 start: minimalny emission API)
```

**Dane:** 12 VS resources (Grain, Livestock, Fish, Timber, Cotton,
Stone, Clay, Limestone, Iron Ore, Coal, Sand, Salt) --- `ECO-004`.

**Testy:** brak ujemnych stocków, finite deposits nie regenerują się,
renewable resources respektują carrying capacity, discovery boundary
(deposit istnieje przed discovery), conservation audit dla zasobów.

**Acceptance Gate:** złoże można odkryć, wydobyć, wyczerpać;
niewyczerpywalne (renewable) zasoby stabilizują się wokół sustainable
yield przy stałym popycie; wszystkie invariants zielone.

**Ryzyka:** niskie; główne ryzyko to przedwczesne sprzężenie z Market
(M8), którego jeszcze nie ma --- mitygacja: M5 testuje wydobycie
izolowanie, bez cen.

**Poza zakresem:** ceny, handel, AI decydujące o wydobyciu (to M7/M11).

**Źródła:** `FIRST-CAUSE-World-Generation-Spec-v0.1.md` (§13--15),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (ECO-004, ECO-010, TECH-009),
`FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` (§3--4, §19).

### M5 --- Wyniki wykonania (2026-09-16)

**Status: DONE.**

**Nowy pakiet `packages/causality`** (CE-01 "Fact Infrastructure": IDs,
Fact store, indices, emission API) -- pierwszy realny konsument fact
infrastructure, zgodnie z notatką z M0 ("causality zaczyna się z
pierwszym konsumentem, nie czeka na M17"). Bez żadnej zależności od
innych pakietów (`SimulationFact`/`FactSubject` są generyczne --
`entityType` to zwykły string, nie odwołanie do konkretnego typu z
`packages/entities`), więc `packages/simulation` mógł dodać na niego
zależność produkcyjną bez ryzyka cyklu. `SimulationFact` celowo nie ma
jeszcze pól `causes`/`architect`/`significance`/`retention` -- należą do
systemów, które jeszcze nie istnieją (CE-02/CE-03 to M17, Architect to
M16, Chronicle scoring to M19) -- ta sama zasada "brak pola dla systemu,
którego jeszcze nie ma", co w `packages/entities`.

**Logika ekonomiczna (`packages/simulation/src/systems/resources`):**

-   `deposit-lifecycle.ts` (`discoverDeposit`) -- cykl odkrycia
    `UNKNOWN -> SUSPECTED -> DISCOVERED -> ASSESSED` (Entity Data Model
    §9), nigdy nie cofa statusu, emituje `resource_discovered`/
    `resource_assessed` tylko przy realnych przejściach. Odkrycie samo w
    sobie nigdy nie wymusza wydobycia (test wprost sprawdza, że
    `extraction.currentExtraction` zostaje 0 po odkryciu).
-   `extraction.ts` (`extractFromDeposit`) --
    `extracted = min(amount,     dostępna ilość)`: wydobycie fizycznie
    nie może stworzyć zasobu (reguła 9 / ECO-010). Emituje
    `extraction_started`/`_increased`/ `_decreased` przez porównanie
    tempa wydobycia przed/po oraz `resource_depleted` przy wyczerpaniu
    złoża nieodnawialnego.
-   `renewable.ts` (`regenerateDeposit`) -- wzrost logistyczny do
    `carryingCapacity`
    (`growth = regenerationRate * quantity * (1 -     quantity/carryingCapacity)`)
    -- standardowy model sustainable-yield dla tych trzech pól, a nie
    wymyślona formuła. Dodano pole `carryingCapacity` do
    `DepositRenewableState` w `packages/entities` (M3 świadomie
    zostawiło ten typ niekompletny -- "struktura, bez pełnej logiki
    M5").
-   Wszystkie funkcje są czyste (Technology Stack Decision §33):
    zwracają `{deposit, facts}` (listę *fact input* do emisji), nie
    wywołują `FactStore` same -- rozdzielenie CALCULATE od EMIT FACTS
    (SIM-004).

**Read Model:** `ResourceDepositReadModel`
(`packages/simulation/src/read-models`) respektuje TECH-009 -- dokładna
`quantity` jest ukryta, dopóki złoże nie osiągnie
`DISCOVERED`/`ASSESSED`; `discoveryStatus` jest widoczny zawsze (sam
stan częściowej wiedzy jest informacyjny).

**UI Foundation -- start UI-F0:** design tokens
(`apps/desktop/src/design/tokens.css`, dokładne wartości z
`UI Visual Design System v1.0` §3.2/§53-55: paleta kolorów, role
typograficzne `FC_DISPLAY...FC_MICRO`, spacing 4/8px), siedem
komponentów `FC*` (`FCSection`, `FCPanel`, `FCTextButton`,
`FCPrimaryAction`, `FCTabs`, `FCMetric`, `FCTrend`) oraz
`FCAppShell`/`FCTopNavigation`/`FCSimulationBar`, które zastąpiły surowy
shell z M0 w `App.tsx`. `FCSimulationBar` pokazuje wyłącznie realne dane
(status workera, wersja silnika) -- świadomie bez kontrolek
tick/data/prędkości, bo żadna pętla ticków jeszcze nie działa w
aplikacji desktopowej (M1's `HeadlessRunner` pozostaje headless/pod
testami) -- dodanie takich kontrolek teraz wyglądałoby funkcjonalnie,
nie będąc funkcjonalnym (SS2.1 "Information before decoration").
Ładowanie fontów (IBM Plex Sans/Mono, Source Serif 4) pozostaje otwarte
-- istniejące CSP (`style-src 'self'`, brak `font-src`) świadomie nie
zostało poluzowane tylko po to, by wczytać zdalne fonty; strona spada na
deklarowane stacki systemowe.

**Testy:** 55 nowych testów Vitest -- CE-01 (`FactStore`/indices), cykl
odkrycia (w tym "discovery boundary" i "nie wymusza wydobycia"),
inwarianty ekstrakcji (brak ujemnych zapasów, "wydobycie nie tworzy
zasobu", conservation audit:
`cumulativeExtraction + quantity === initialQuantity` na każdym kroku),
fakty trendu wydobycia, carrying capacity dla zasobów odnawialnych, oraz
test stabilizacji wokół sustainable yield (500 ticków stałego popytu
poniżej maksymalnego sustainable yield -- powyżej niego równowaga
logistycznego wzrostu jest niestabilna, co zweryfikowano numerycznie
przed napisaniem testu). Read Model i shell UI mają własne testy
kontraktowe/RTL.

**Acceptance Gate -- zweryfikowane:** złoże można odkryć
(`discoverDeposit`), wydobyć (`extractFromDeposit`) i wyczerpać
(`resource_depleted` + `depleted: true`); zasoby odnawialne stabilizują
się wokół sustainable yield przy stałym popycie (test 500-tickowy);
wszystkie inwarianty (brak ujemnych zapasów, conservation) zielone.

**Bramki jakości (2026-09-16):** `pnpm typecheck`, `pnpm lint` (ten sam
1 warning z M2, bez zmian), `pnpm format:check`, `pnpm test` (240/240
testów), `pnpm build` i `pnpm test:e2e` -- wszystkie zielone w czystym
przebiegu. Reguła ESLint blokująca import React/Electron rozszerzona o
`packages/causality/**`.

**Dług techniczny / świadomie poza zakresem:** ceny, handel, AI
decydujące o wydobyciu (M7/M11 -- M5 testuje wydobycie izolowanie, bez
cen, zgodnie z ryzykiem opisanym wyżej); `economicallyExhausted`
pozostaje polem strukturalnym bez automatycznego obliczania (wymaga
cen/rynku, M7/M8); brak jeszcze realnej pętli ticków łączącej
`HeadlessRunner` z `WorldState`/systemami zasobów (to zadanie przyszłych
milestone'ów, które faktycznie tickują świat); self-hosted fonty IBM
Plex/Source Serif pozostają otwarte.

**Czy M6 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M6 --- Minimal Population

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM · **Documentation Readiness:**
READY

**Cel:** kohorty ludności z miesięczną demografią, podstawowym
szkieletem potrzeb i twardą zasadą zachowania populacji (conservation).

**Zależności:** M4. *(Może iść równolegle z M5.)*

**Implementowane systemy:** PopulationCohort (ageGroup × economicClass ×
skill × profession × culture × location), miesięczna demografia
(births/deaths), needs skeleton (bez pełnej satysfakcji --- to M9),
population conservation.

**Moduły (`population/cohorts`, `population/needs`):**

``` text
population/cohorts -- age groups (0-14,15-24,25-44,45-64,65+),
  economic classes (Poor/Working/Middle/Wealthy/Elite),
  skills (Unskilled/Skilled/Specialist)
population/demography -- monthly births/deaths
population/needs -- skeleton hierarchii Survival→Basic→Services→
  Comfort→Prosperity→Modern (bez satysfakcji, to M9)
```

**Dane:** minimalne profesje VS (agriculture, extraction, manufacturing,
construction, transport, services, specialist) --- `POP-005`.

**Testy:** population conservation audit (żadna osoba nie znika/nie
pojawia się bez rejestrowanej przyczyny), age group transitions są
spójne, brak ujemnych kohort, demografia jest miesięczna (nie kwartalna
--- `SIM-002`).

**Acceptance Gate:** kohorta przechodzi przez N ticków z realistyczną
dynamiką urodzeń/zgonów, bez naruszenia invariants; total population
świata jest zawsze sumą kohort (Region.totalPopulation to cache, nie
canonical --- `DATA-004`).

**Ryzyka:** demografia jest wrażliwa na błędy akumulujące się przez
setki ticków (mitygacja: conservation test od pierwszego commita,
długoterminowy test 200 lat pojawia się już w M6 jako smoke, pełny
dopiero w M23).

**Poza zakresem:** migracja (M13), pełna satysfakcja potrzeb (M9),
zatrudnienie (M9/M11).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (POP-001--007,
SIM-002), `FIRST-CAUSE-Entity-Data-Model-v0.1.md` (§11),
`FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` (§8).

### M6 --- Wyniki wykonania (2026-09-17)

**Status: DONE.**

**Nowe moduły (`packages/simulation/src/systems/population`):**

-   `cohorts.ts` (`buildCohortFamily`) -- wprowadza pojęcie "cohort
    family": dokładnie pięć `PopulationCohort` (jeden na `AgeGroup`),
    dzielących tę samą tożsamość lokalizacyjno-socjoekonomiczną
    (`regionId`, `settlementId`, `economicClass`, `skillLevel`,
    `profession`). M6 nigdy nie zmienia tych pól tożsamości -- mobilność
    społeczna (M9) i zmiana kwalifikacji (M15) jeszcze nie istnieją --
    więc pięć rekordów rodziny jest kompletną, stabilną jednostką, po
    której miesięczna demografia redystrybuuje populację. Waliduje
    fail-loud (rzuca `InvariantViolationError`, nie ucina/naprawia po
    cichu): dokładnie 5 kohort, brak duplikatu `ageGroup`, spójna
    tożsamość -- każde naruszenie oznaczałoby populację znikającą lub
    pojawiającą się bez zarejestrowanej przyczyny.
-   `demography.ts` (`applyMonthlyDemography`) -- awansuje jedną cohort
    family o dokładnie jeden miesiąc (1 tick = 1 miesiąc, SIM-001, więc
    nie ma osobnego sprawdzania granicy miesiąca). Zgony i aging-out
    liczone są z populacji na początek miesiąca; urodzenia trafiają
    wyłącznie do `AGE_0_14`, liczone z populacji `AGE_25_44` sprzed tego
    miesiąca (kolejność "zgony przed czy po urodzeniach" nie ma
    kanonicznej odpowiedzi na tym poziomie abstrakcji, więc funkcja jest
    celowo order-independent). Wszystkie współczynniki są roczne
    (SIM-002: "współczynniki pozostają parametrami tuningowymi") i
    konwertowane na miesięczne przez składanie
    (`1 - (1-roczny)^(1/12)`), nie dzielenie przez 12 -- ten sam
    standard co model wzrostu logistycznego z M5.
    `DEFAULT_     DEMOGRAPHY_RATES` (śmiertelność per `AgeGroup`, jeden
    `birthRate` dla `AGE_25_44` jako modelowanej głównej kohorty
    rozrodczej, rozpiętość w latach każdego nieterminalnego przedziału
    wieku) została dobrana tak, by zbliżać się do zastępowalności
    pokoleń -- zweryfikowano numerycznie *przed* napisaniem testu (ta
    sama dyscyplina co przy M5 sustainable yield), że przebieg
    200-letni/2400-tickowy zostaje w granicach około ±10% populacji
    startowej dla kilku różnych rozkładów startowych. Populacja nie ma
    odpowiednika `carryingCapacity` tak jak zasoby odnawialne z M5 --
    `birthRate` względem stawek zgonów/aging jest jedyną dostępną
    dźwignią. Funkcja jest czysta (zwraca `{cohorts, facts}`, nie woła
    `FactStore`), emituje `population_increased`/`population_declined`
    (jedyne fakty CE-01 dotyczące populacji w tym zakresie) tylko przy
    realnej zmianie netto per kohorta.

**Needs skeleton:** bez nowego kodu -- `CohortNeeds` (struktura z
sześcioma poziomami hierarchii, `totalSatisfaction`) dostarczyła już M3
z myślą właśnie o M6/M9; demografia w M6 nigdy nie dotyka pola `needs`,
więc zostaje wyzerowane i gotowe pod realne obliczanie satysfakcji w M9
-- ta sama zasada "brak logiki dla systemu, którego jeszcze nie ma", co
w `packages/causality` przy M5.

**Profesje VS (POP-005):** świadomie bez nowej infrastruktury
contentowej w M6 -- `PopulationCohort.profession` pozostaje
`string | undefined`, nieprzypisywane (tak jak ustawił M3), bo
przypisanie zawodu wymaga zatrudnienia, które jest poza zakresem M6
(M9/M11). Lista siedmiu profesji VS z POP-005 zostaje więc
dokumentacyjna, do czasu M9/M11.

**Testy:** 13 nowych testów Vitest (253 łącznie) -- kompletność i
spójność tożsamości `buildCohortFamily`, dokładny (ręcznie
zweryfikowany) transfer aging między kohortami przy zerowej
śmiertelności/urodzeniach, terminalność `AGE_65_PLUS` (nigdy nie
starzeje się dalej), izolacja urodzeń (trafiają wyłącznie do `AGE_0_14`,
żadna inna kohorta -- w tym sama płodna -- się nie zmienia), brak
ujemnej populacji nawet przy 100% rocznej śmiertelności, conservation
audit (`suma(after) - suma(before) === suma(delta faktów)` na każdym z
50 kolejnych ticków) i test smoke 200-letni/2400-tickowy (bez ujemnych
kohort, całkowita populacja w granicach 0.5x--2x startu).

**Acceptance Gate -- zweryfikowane:** kohorta przechodzi przez N ticków
z realistyczną dynamiką urodzeń/zgonów bez naruszenia invariants (test
200-letni); `Region.totalPopulation` pozostaje cache -- M6 nie zmienia
`packages/entities`, sumowanie po `cohortIds` istnieje od M3 (DATA-004).

**Bramki jakości (2026-09-17):** `pnpm typecheck`, `pnpm lint` (ten sam
1 warning z M2/M5, bez zmian), `pnpm format:check`, `pnpm test`
(253/253), `pnpm build` i `pnpm test:e2e` -- wszystkie zielone w czystym
przebiegu.

**Dług techniczny / świadomie poza zakresem:** migracja (M13), pełna
satysfakcja potrzeb (M9), zatrudnienie i przypisanie profesji (M9/M11);
brak jeszcze realnej pętli ticków łączącej `HeadlessRunner`/`WorldState`
z systemami populacji -- ten sam stan co M5's "resources" (przyszłe
milestone'y, które faktycznie tickują świat); `crisis mortality`
(wojna/epidemie) pozostaje niezaimplementowane, bo te systemy jeszcze
nie istnieją.

**Czy M7 jest odblokowane:** TAK.

**Poprawki naprawcze przed M7 (przegląd, 2026-09-17):** zielone testy
powyżej nie wykryły czterech usterek -- małe populacje (np. 5 kohort po
10 osób) zamrażały się na stałe przez zaokrąglanie round-half-even
(zastąpione losowym zaokrąglaniem przez strumień RNG "demography"),
`agingSpanYears.AGE_65_PLUS` mogło po cichu usuwać populację bez grupy
docelowej (zablokowane typem `NonTerminalAgeGroup`),
`applyMonthlyDemography` nie dało się podać fixture'owi M4 bez ręcznego
przygotowania (dodano `groupCohortsIntoFamilies`), a `RngStream.nextInt`
zwracał `NaN` dla `maxExclusive` powyżej 2\*\*32 - 1. Szczegóły:
CHANGELOG 2026-09-17. `applyMonthlyDemography` przyjmuje teraz wymagany
parametr `rng: RngStream` -- każdy przyszły wywołujący (M7+) musi go
przekazać.

------------------------------------------------------------------------

## M7 --- Production

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM · **Documentation Readiness:**
READY

**Cel:** firmy fizycznie produkują i konsumują inputs/labor zgodnie z
Production Methods; pierwsze działające łańcuchy gospodarcze.

**Zależności:** M5, M6.

**Implementowane systemy:** Company (production state), Production
Method (input→output, capacity, productivity), Inventory jako źródło
prawdy fizycznych dóbr, pierwsze łańcuchy (Zboże→Mąka→Żywność,
Livestock→Meat, Fish→Fish Food, Cotton→Fiber→Textiles→Clothing).

**Moduły (`economy/companies`, `economy/production`,
`economy/inventory`):**

``` text
economy/production -- PM evaluation (bez AI decision jeszcze -- fixed
  initial PM per company z fixture), input consumption, output creation
economy/inventory -- Inventory jako owner fizycznych goods (DATA-005)
economy/companies -- Company struktura finansowa (minimalna: cash)
```

**Dane:** pierwszy podzbiór 20 VS goods i minimalny zestaw archetypów z
M4 fixture (np. Crop Farm, Mill, Fishing Company) + odpowiadające
Production Methods (Manual Farming, Manual Processing...).

**Testy:** recipe conservation (input skonsumowany = zgodny z output),
production capacity respektuje labor/inputs, brak produkcji z niczego
(`no phantom goods`), production graph completeness dla aktywnego
podzbioru.

**Acceptance Gate:** firma z fixture produkuje dobro z prawdziwych
inputs i widocznej pracy; inventory rośnie/maleje zgodnie z produkcją i
konsumpcją; brak ujemnych zapasów.

**Ryzyka:** ryzyko przedwczesnego hardcodowania konkretnych firm
(zakazane przez `ECO-009`) --- mitygacja: production musi czytać z
Definition Registry, nie z `if company == X`.

**Poza zakresem:** ceny/rynek (M8), AI decyzje produkcyjne (M11), pełne
17 archetypów (rosną przyrostowo do M12).

**Źródła:** `FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` (§5--16),
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§11--14),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (ECO-007--009, ECO-011--012).

### M7 --- Wyniki wykonania (2026-09-17)

**Status: DONE.**

**Nowe moduły (`packages/simulation/src/systems/economy`):**

-   `inventory.ts` (`addToInventory`/`removeFromInventory`) -- fizyczny
    rejestr dóbr (DATA-005): czyste, fail-loud operacje na
    `Inventory.items` -- usunięcie więcej niż jest dostępne rzuca
    `InvariantViolationError`, ten sam standard co `buildCohortFamily`
    (M6) i `extractFromDeposit` (M5), zamiast po cichu ściąć do zera.
-   `companies.ts` (`applyProductionToCompany`) -- czysta aktualizacja
    `Company.production` (`productionMethodId`, `outputLastTick`,
    `inputRequirements`) po jednym ticku produkcji; finanse (M8 ceny) i
    AI (M11) pozostają nietknięte, bo jeszcze nie istnieją.
-   `production.ts` (`runProduction`) -- awansuje jedną firmę o
    dokładnie jeden tick: liczba batchy Production Method to minimum z
    `capacity * utilization` (przydzielone poza M7 -- AI produkcyjne to
    M11) i dostępności każdego wejścia -- zasobu wydobywanego na żywo z
    `ResourceDeposit` przez `extractFromDeposit` (M5, ta sama fizyczna
    zasada "wydobycie nie może stworzyć zasobu") oraz dobra z własnego
    Inventory firmy. `ProductionRecipe` (ile dokładnie na batch) to
    osobny typ warstwy symulacji -- jak `DemographyRates` w M6 -- nie
    część schematu contentu:
    `ProductionMethodDefinition.inputs/     outputs/resourceRequirements`
    (M2) to tylko topologia grafu (które dobra/zasoby, do walidacji
    referencji), a "productivity" to pole jawnie oznaczone w M2 jako
    otwarte i należące do M7, więc M7 nadaje mu konkretny kształt bez
    zmiany schematu M2. Brak depozytu, którego przepis wymaga, rzuca
    głośno (pomyłka wywołującego), w przeciwieństwie do depozytu
    obecnego, ale pustego (0 batchy, legalny stan wyczerpania --
    ECO-010).

**Nowe definicje contentu** (`content/companyArchetypes/`,
`content/productionMethods/`, plus aktualizacja
`content/resources/ grain.json` i `content/goods/{flour,bread}.json` o
wzajemne referencje): `grain_farm` + `manual_farming` (zboże, zasób,
wydobywane na żywo -\> mąka, dobro) i `bakery` +
`manual_food_processing` (mąka -\> chleb), dowodząc łańcucha
Zboże-\>Mąka-\>Żywność (Production-Economy-Master §13) na dwóch
archetypach. `grain_farm` w fixture'cie M4 pełni rolę połączonych farmy
i młyna (jedna Production Method) -- fixture ma tylko jedną firmę, więc
osobny archetyp "Mill" zostaje do rozszerzenia, gdy faktycznie pojawi
się w świecie, zamiast dodawać go teraz bez uzasadnienia w danych.
Dodano odpowiednie klucze `en`/`pl` w `locales/*/common.json` i
rozszerzono `content-fixtures.integration.test.ts` o te dwa typy
contentu.

**Testy:** 19 nowych (278 łącznie): `inventory.ts` (dodawanie/ usuwanie,
tworzenie i kasowanie pozycji przy zejściu do zera, fail-loud przy
niewystarczającym zapasie), `companies.ts` (aktualizacja stanu
produkcji, reszta pól nietknięta), `production.ts` (batch capacity-
limited, floor(capacity\*utilization), ograniczenie przez dostępność
zasobu i dobra wejściowego, zero batchy przy capacity=0, fail-loud przy
brakującym depozycie, łańcuch dwóch firm przez ręczne przeniesienie
Inventory -- Market to M8 -- oraz Acceptance Gate na realnych
wartościach z fixture'u M4:
`company_green_valley_farm`/`deposit_green_valley_grain`/
`inventory_green_valley_farm`, 12 ticków, zapas nigdy ujemny).

**Acceptance Gate -- zweryfikowane:** firma z fixture'u (Green Valley
Grain Farm) produkuje mąkę z prawdziwego zboża wydobywanego z jej
prawdziwego depozytu; inventory rośnie zgodnie z produkcją, depozyt
maleje zgodnie z ekstrakcją; zapas nigdy nie schodzi poniżej zera.

**Bramki jakości (2026-09-17):** `pnpm typecheck`, `pnpm lint` (ten sam
1 warning z M2/M5, bez zmian), `pnpm format:check`, `pnpm test`
(278/278) i `pnpm build` -- wszystkie zielone w czystym przebiegu.

**Dług techniczny / świadomie poza zakresem:** brak Market (M8) -- dobra
przenoszą się między firmami wyłącznie ręcznie (test/przyszły
orkiestrator), nie automatycznie; brak cen/finansów
(`finance.revenue/ costs` nietknięte -- to M8); brak AI decydującego o
`capacity`/ `utilization`/wyborze Production Method (M11) --
`runProduction` przyjmuje je jako gotowy stan; brak realnej pętli ticków
łączącej `HeadlessRunner`/`WorldState` z systemami gospodarki -- ten sam
stan co M5 (resources) i M6 (population); tylko 2 z 17 archetypów VS i 2
z 20 dóbr VS mają realne dane contentu -- reszta łańcuchów
(Livestock-\>Meat, Fish-\>Fish Food,
Cotton-\>Fiber-\>Textiles-\>Clothing z pierwotnego zakresu M7) rośnie
przyrostowo, gdy pojawią się archetypy/firmy, które ich faktycznie
potrzebują.

**Czy M8 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M8 --- Market

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** HIGH · **Documentation Readiness:** READY

**Cel:** jeden regionalny Market per region, z popytem, cenami,
niedoborami/nadwyżkami i wolniejszą reakcją cen (smoothing) --- bez
oscylacji.

**Zależności:** M7.

**Implementowane systemy:** regionalny Market (nie per-settlement ---
`DATA-006`), price adjustment z smoothing, shortages/surpluses, demand
aggregation.

**Moduły (`economy/markets`):**

``` text
markets/price-adjustment -- smoothing, hysteresis-ready (pełna
  hysteresis AI dopiero w M11, ale market-level smoothing jest tu)
markets/demand-aggregation
markets/shortage-surplus
```

**Dane:** BaseContentPrice per good/resource (część Definition Data z
M2); brak nowych encji.

**Testy:** shortage test, surplus test, market smoothing test (brak
gwałtownych oscylacji przy stałym popycie/podaży), price bounds
(`price > 0`, finite), import cost placeholder (pełny handel to M10).

**Acceptance Gate:** przy sztucznie wywołanym niedoborze cena rośnie
płynnie i stabilizuje się; przy nadwyżce cena spada i stabilizuje się;
brak nieskończonej pętli oscylacji w 100-tickowym teście stresowym.

**Ryzyka:** **HIGH** --- to jest ryzyko R1 z `Vertical Slice Spec` §73
(„gospodarka oscyluje"); mitygacja: smoothing/hysteresis od pierwszej
wersji (nie „dodane później"), dedykowany test stresowy w tym milestone,
nie odkładany do M23.

**Poza zakresem:** handel międzyregionalny (M10), AI firm reagujące na
ceny (M11), needs satisfaction pełne (M9).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (DATA-006,
AI-005), `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§17--18, §73 R1),
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§30--33).

### M8 --- Wyniki wykonania (2026-09-17)

**Status: DONE.**

**Rozszerzenie encji (`packages/entities/src/economy/market.ts`):**
`Market` zyskuje pole `history` (`MarketHistory`:
`rollingSupply`/`rollingDemand`/`rollingPrice`, per-good, okno
przycinane przez `price-adjustment.ts`) -- pole było celowo pominięte w
M3 ("omitted until M8 needs it"), bo wymagało realnego okna tickowego,
którego M3 jeszcze nie miało. `createMarket` inicjalizuje je pustymi
mapami; jedyne miejsce budujące `Market` ręcznie poza `createMarket`
(`world-state.test.ts`) już korzystało z fabryki, więc zmiana nie
wymagała dotykania żadnego innego fixture'u.

**Nowe moduły (`packages/simulation/src/systems/economy/markets`):**

-   `demand-aggregation.ts` (`aggregateDemand`) -- czysta suma nazwanych
    źródeł popytu (Production-Economy-Master §5: gospodarstwa domowe,
    zużycie pośrednie firm, eksport, ...). M8 ma dokładnie jedno realne,
    podłączone źródło (zużycie pośrednie firm z M7 `production.ts`) --
    reszta (M9 gospodarstwa domowe, M10 eksport) jeszcze nie istnieje,
    więc funkcja została source-agnostic: później milestone'y dodają
    nowy klucz do `demandSources`, nie zmieniają tego modułu.

-   `shortage-surplus.ts` (`classifyShortageSurplus`) -- realizuje
    zabezpieczenie "inventory buffer" z Vertical Slice Spec §17:
    fizyczny zapas (obserwowany, nie posiadany przez Market --
    DATA-005/DATA-006) dampuje surowy niedobór podaży zamiast go
    maskować, `shortageSeverity` w \[0, 1\] to 0 dla każdej nadwyżki.

-   ## `price-adjustment.ts` (`initializeMarketGood`, `updateMarketGood`)

    `PricePressure = Sensitivity * ((Demand - EffectiveSupply) /     NormalSupply)`
    (VS §17), gdzie `NormalSupply` to średnia krocząca z
    `Market.history.rollingSupply` (poprzednich, nie bieżącego ticka --
    żeby jeden tick nie przesuwał własnego punktu odniesienia).
    Wszystkie cztery obowiązkowe zabezpieczenia z VS §17 (price floor,
    miesięczny limit zmiany, smoothing, inventory buffer) działają od
    pierwszej wersji, zgodnie z mitygacją ryzyka R1 z VS §73 -- nie
    zostały odłożone. `initializeMarketGood` zamyka pętlę z
    `BaseContentPrice` (nowe opcjonalne pole `basePrice` w
    `ResourceDefinition`/ `GoodDefinition`, M2 schema): seeduje pierwszy
    `localPrice` z contentu. `updateMarketGood` rzuca głośno, jeśli
    dobro nie ma jeszcze `MarketGoodState` (wywołujący zapomniał
    zainicjalizować) -- ten sam standard fail-loud co brakujący
    `ResourceDeposit` w M7. Emituje `price_changed` (gdy cena faktycznie
    się zmienia) i `shortage_started` (edge-triggered 0 -\> dodatnia)
    fakty (Entity Data Model §32 przykładowe typy faktów).

**Nowe dane contentu:** opcjonalne pole `basePrice` (BaseContentPrice)
dodane do `content/resources/{grain,iron_ore,timber}.json` i
`content/goods/{flour,bread}.json` -- opcjonalne w schemacie Zod (nie
wymagane), bo większość testów loadera (mechanika ładowania,
integralność referencyjna, wykrywanie cykli) buduje minimalne fixture'y
niezwiązane z Market i musiały dalej się parsować bez zmian. `price > 0`
nadal obowiązuje dla każdej podanej wartości (test w
`definitions.test.ts`).

**Testy:** 31 nowych (309 łącznie) -- `demand-aggregation.test.ts`
(suma, pusty zbiór, fail-loud na ujemnym źródle),
`shortage-surplus.test.ts` (FC-MARKET-001/002 setupy, tłumienie przez
bufor magazynowy, cap na 1, fail-loud), `price-adjustment.test.ts`
(FC-MARKET-001 shortage, FC-MARKET-002 surplus, FC-MARKET-003
smoothing/cap na ekstremalnym szoku, price bounds pod trwałą ekstremalną
nadwyżką, import cost placeholder -- `importDemand`/`exportSupply`
nietknięte, emisja/brak faktów, 100- tickowy stress test dla
zbalansowanego i trwale niedoborowego rynku -- "brak nieskończonej pętli
oscylacji" zweryfikowane jako monotoniczny, ograniczony na tick dryf,
nie cykliczne odbicia -- oraz Acceptance Gate na jednorazowym szoku
niedoboru/nadwyżki, który stabilizuje się po powrocie równowagi), plus
`assertPositive` w `validation.test.ts` i rozszerzenie
`market.test.ts`/`definitions.test.ts`.

**Acceptance Gate -- zweryfikowane:** przy sztucznie wywołanym
niedoborze cena rośnie płynnie (ograniczona miesięcznym capem i
smoothingiem) i stabilizuje się, gdy podaż/popyt wracają do równowagi;
przy nadwyżce cena spada płynnie i tak samo się stabilizuje; 100-tickowy
test stresowy nie wykazuje nieskończonej pętli oscylacji ani przy stałym
zbalansowanym, ani przy stałym niedoborowym popycie/podaży.

**Bramki jakości (2026-09-17):** `pnpm typecheck`, `pnpm lint` (ten sam
1 warning z M2/M5/M7, bez zmian), `pnpm format:check`, `pnpm test`
(309/309) i `pnpm build` -- wszystkie zielone w czystym przebiegu.
Etykieta `app.milestone` zaktualizowana na "M8 -- Market"/"M8 -- Rynek"
w `locales/*/common.json` (i odpowiadający test w `App.test.tsx`).

**Dług techniczny / świadomie poza zakresem:**
`Company.finance.revenue/ costs` nietknięte -- rzeczywista transakcja
(firma sprzedaje po cenie rynkowej, gospodarstwo domowe kupuje) wymaga
strony popytowej, która jeszcze nie istnieje (M9 households) i AI firm
decydujących o sprzedaży (M11) -- M8 dostarcza silnik cenowy, nie
portfel transakcji; handel międzyregionalny
(`importDemand`/`exportSupply`) to M10; `demand- aggregation` ma dziś
tylko jedno realne źródło (zużycie pośrednie firm), bo gospodarstwa
domowe (M9) i eksport (M10) jeszcze nie istnieją; brak realnej pętli
ticków łączącej `HeadlessRunner`/`WorldState` z systemami gospodarki --
ten sam stan co M5/M6/M7, `updateMarketGood` jest czystą, testowaną w
izolacji funkcją, nie jest jeszcze wołana per-tick dla każdego
dobra/regionu przez orkiestrator (przyszły milestone).

**Czy M9 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M9 --- Labor & Households

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM · **Documentation Readiness:**
READY

**Cel:** zatrudnienie, płace, dochód gospodarstw domowych i pełna
satysfakcja potrzeb (spending order Survival→...→Savings).

**Zależności:** M8.

**Implementowane systemy:** employment, wage offer, household income,
consumption, needs satisfaction (pełna, nie skeleton z M6).

**Moduły (`population/needs`, `economy/labor`):**

``` text
labor/employment
labor/wages
population/consumption -- spending order (ECO-014)
population/needs-satisfaction
```

**Dane:** brak nowego contentu poza tym, co istnieje.

**Testy:** employment \<= eligible working population, no money no
purchase, consumption priority (spending order respektowany), wage
response test, labor competition test szkielet (pełny w M11).

**Acceptance Gate:** kohorta z pracą ma wyższą satysfakcję potrzeb niż
bez pracy; brak zatrudnienia powyżej dostępnej siły roboczej; wydatki
podążają za
`Survival → Basic → Services → Comfort → Prosperity → Luxury → Savings`.

**Ryzyka:** sprzężenie zwrotne płace↔ceny↔popyt może wzmacniać oscylację
z M8 (mitygacja: ten sam test stresowy z M8 uruchamiany ponownie po M9).

**Poza zakresem:** migracja jako reakcja na warunki pracy (M13), AI
decyzje firm o zatrudnieniu (M11 --- tu zatrudnienie jest reaktywne, nie
strategiczne).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (ECO-013--014),
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§22--23),
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§59--64).

### M9 --- Wyniki wykonania (2026-09-17)

**Status: DONE.**

**Rozszerzenie encji (`packages/entities/src/economy/company.ts`):**
`CreateCompanyInput` zyskuje opcjonalne `initialWageOffer` (domyślnie 0,
jak dotychczas), które seeduje `workforce.wageOffer` -- ten sam kontrakt
"seed przed tickowaniem", co `initializeMarketGood(basePrice)` w M8 dla
`localPrice`: mnożnikowa korekta nigdy nie ruszy się z zera.

**Nowe moduły (`packages/simulation/src/systems/economy/labor`):**

-   `employment.ts` (`eligibleLaborForce`, `availableWorkers`,
    `matchEmployment`) -- zatrudnienie jest reaktywne, nie strategiczne
    (roadmap: "AI decyzje firm o zatrudnieniu to M11"): `vacancies`/
    `skillDemand` firmy są przyjmowane jako gotowy stan, ten sam wzorzec
    co `capacity`/`utilization` w `production.ts` (M7).
    `LABOR_FORCE_PARTICIPATION_RATE` (TODO tuning) oddziela
    "non-participating" od "unemployed" (Simulation Test Spec §23).
    `matchEmployment` zatrudnia z dokładnie jednej kohorty do dokładnie
    jednej firmy, ograniczone minimum z (vacancies, skillDemand danego
    skilla, dostępni pracownicy) --
    `employment <= eligible working     population` zachodzi
    konstrukcyjnie. Zmienia tylko `workforce.     employees`/`vacancies`
    (firma) i `employment`/`averageIncome` (kohorta, ważona średnia
    stawek) -- `skillDemand` jest czytany jako pułap, nigdy
    dekrementowany (to pożądany miks umiejętności, własność AI z M11,
    nie licznik wolnych miejsc).
-   `wages.ts` (`adjustWageOffer`) -- ponownie wykorzystuje
    `classifyShortageSurplus` z M8 (`inventory: 0`, bo praca nie ma
    bufora magazynowego) i dokładnie ten sam kształt "capped + smoothed
    pressure" co `markets/price-adjustment.ts`, żeby rynek pracy dostał
    te same zabezpieczenia przed oscylacją od pierwszej wersji (roadmap:
    "sprzężenie zwrotne płace\<-\>ceny\<-\>popyt może wzmacniać
    oscylację z M8").

**Nowe moduły (`packages/simulation/src/systems/population`):**

-   `consumption.ts` (`SPENDING_ORDER`, `allocateSpending`,
    `computeHouseholdIncome`, `applyHouseholdConsumption`) --
    `computeHouseholdIncome` to Wages (`employment * averageIncome`);
    Transfers/Property Income (State, M17+) i Taxes (`taxBurden`
    nietknięty, brak systemu podatkowego) zostają strukturalnie 0, ten
    sam standard co `Company.finance.taxes` w M7. `allocateSpending`
    przechodzi `SPENDING_ORDER` (ECO-014: Survival-\>Basic-\>Services-\>
    Comfort-\>Prosperity-\>Luxury-\>Savings) w ścisłej kolejności,
    finansując każdą kategorię tylko do wysokości pozostałego budżetu --
    FC-POP-001/ FC-POP-002.
-   `needs-satisfaction.ts` (`computeNeedsSatisfaction`,
    `applyNeedsSatisfaction`) -- każdy poziom potrzeb to `spent/cost` z
    `consumption.ts`, ograniczone do 1; poziom z `cost === 0` (żadne
    dobro nie jest jeszcze do niego przypisane w contencie) czyta się
    jako w pełni zaspokojony, nie jako niedobór -- zgodnie z VS Spec §22
    ("Modern... pozostanie nieaktywne"). `CohortNeeds.modern` czyta
    kategorię wydatków `luxury`: ECO-013 (hierarchia potrzeb, kończy się
    na "Modern") i ECO-014 (kolejność wydatków, kończy się na "Luxury
    -\> Savings") zgadzają się co do każdego wcześniejszego kroku i
    różnią się dokładnie jedną etykietą po "Prosperity" -- ta sama
    pozycja w obu hierarchiach, inna nazwa w każdym dokumencie.

**Testy:** 38 nowych (347 łącznie), w tym: `employment.test.ts`
(eligibility/participation rate, dopasowanie min z trzech ograniczeń,
fail-loud na brak wageOffer i na zatrudnianie między regionami,
FC-LABOR-003 szkielet -- dwie firmy konkurujące o tę samą kohortę nigdy
nie zatrudniają tego samego pracownika dwa razy), `wages.test.ts`
(FC-LABOR-001 wage response, spadek przy nadwyżce, price floor, 100-
tickowy stress test bez oscylacji), `consumption.test.ts` (FC-POP-001/
002), `needs-satisfaction.test.ts` (w tym Acceptance Gate: kohorta z
pracą ma wyższą `totalSatisfaction`), oraz
`labor-wage-price-feedback.test.ts` -- 100-tickowy test regresyjny
łączący M9 (płace/zatrudnienie/konsumpcja) z M8 (rynek): trwały niedobór
pracy podbija płace -\> dochód -\> popyt -\> cenę bez utraty
ograniczenia zmiany na tick po żadnej stronie, zgodnie z mitygacją
ryzyka z sekcji M9 powyżej.

**Acceptance Gate -- zweryfikowane:** kohorta z zatrudnieniem ma wyższą
`needs.totalSatisfaction` niż analogiczna kohorta bez pracy;
zatrudnienie nigdy nie przekracza dostępnej siły roboczej; wydatki
podążają za
`Survival → Basic → Services → Comfort → Prosperity → Luxury → Savings`.

**Bramki jakości (2026-09-17):** `pnpm typecheck`, `pnpm lint` (ten sam
1 warning z M2/M5/M7/M8, bez zmian), `pnpm format:check`, `pnpm test`
(347/347) i `pnpm build` -- wszystkie zielone w czystym przebiegu.
Etykieta `app.milestone` zaktualizowana na "M9 -- Labor & Households"/
"M9 -- Praca i Gospodarstwa Domowe" w `locales/*/common.json`.

**Dług techniczny / świadomie poza zakresem:** migracja jako reakcja na
warunki pracy (M13); AI decyzje firm o zatrudnieniu/`skillDemand`/
wielkości `vacancies` (M11 -- M9 przyjmuje je jako dany stan); płatność
wynagrodzeń nie zmienia `Company.finance.cash` -- "Company Cash
Accounting" (`- Wages`) to test już opisany w Simulation Test Spec §24,
ale jego wykonanie wymaga rzeczywistego przepływu gotówki firma\<-\>
gospodarstwo, którego żaden dotychczasowy milestone jeszcze nie
okablował (ten sam stan co `Company.finance.revenue/costs` nietknięte w
M7/M8); usługi (ECO-012 Service jako osobna kategoria z capacity/
accessibility/quality) nie istnieją jako encja ani content, więc
kategoria wydatków `services` w praktyce zostaje przy `cost === 0` (w
pełni "zaspokojona") dopóki jakiś przyszły milestone nie doda
prawdziwych usług; brak realnej pętli ticków łączącej `HeadlessRunner`/
`WorldState` z systemami gospodarki/populacji -- ten sam stan co M5-M8,
każda funkcja tu jest czysta i testowana w izolacji (lub w kombinacji,
jak `labor-wage-price-feedback.test.ts`), nie wołana per-tick przez
orkiestrator.

**Czy M10 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M10 --- Trade & Transport

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM · **Documentation Readiness:**
READY

**Cel:** fizyczny handel między regionami przez graf Connection, z
Effective Distance, capacity i kosztem transportu.

**Zależności:** M9.

**Implementowane systemy:** trade flows, Effective Distance
(`PhysicalDistance × TerrainModifier × InfrastructureModifier × BorderModifier × SecurityModifier × SeasonalModifier`),
route capacity, congestion, delivered cost.

**Moduły (`economy/trade`, `economy/transport`):**

``` text
trade/flows
trade/effective-distance
trade/capacity-congestion
transport/modes (Foot/Porter, Pack Animal, Cart, River -- VS subset)
```

**Dane:** Transport Mode definitions (subset VS).

**Testy:** effective distance test, route capacity test, congestion
test, trade feasibility test, import cost test.

**Acceptance Gate:** region z niedoborem dobra może je zaimportować z
sąsiedniego regionu z nadwyżką, po realnym koszcie transportu;
bottleneck (ograniczona capacity) widocznie ogranicza przepływ.

**Ryzyka:** średnie --- złożoność grafu regionów przy większej liczbie
połączeń; w VS (32 regiony, 2--5 sąsiadów) ryzyko jest ograniczone.

**Poza zakresem:** pełna infrastruktura jako inwestycja (rozwijana
przyrostowo w M14/M22), państwa/granice (`BorderModifier` neutralny w VS
--- `WORLD-008`).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (ECO-015--016),
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§16, §18),
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§25, §34--36).

**Checkpoint:** **CP1 --- First Living Economy** osiągnięty po tym
milestone (świat produkuje, konsumuje, handluje i reaguje na ceny).

### M10 --- Wyniki wykonania (2026-09-17)

**Status: DONE.**

**Rozszerzenie encji (`packages/entities/src/world/connections.ts`):**
`CreateConnectionInput` zyskuje opcjonalne `infrastructure`/`friction`
(domyślnie zero jak dotychczas) -- ten sam "seed przed tickowaniem"
wzorzec co `initialWageOffer` (M9)/`initializeMarketGood` (M8), tyle że
tu seed jest opcjonalny (brak infrastruktury to legalny, trwały stan
"trasa nieprzejezdna", nie błąd wywołującego). `fixture-schema.ts`
(`packages/worldgen`) i `load-world-fixture.ts` przekazują te pola
dalej; fixture Black Mountain
(`tests/worldgen/fixtures/ black_mountain_reference.json`) dostaje
realne `infrastructure.level/ capacity/transportModes` i `friction`
(security/borderFriction = 0, zgodnie z VS §18) na wszystkich 7
połączeniach -- bez tego handel byłby fizycznie niemożliwy (capacity=0
domyślnie), ten sam powód, dla którego M7 wzbogaciło fixture M4 o realne
dane Production Method.

**Nowe moduły (`packages/simulation/src/systems/economy/trade`,
`packages/simulation/src/systems/economy/transport`):**

-   `transport/modes.ts` (`TransportModeProfile`,
    `DEFAULT_TRANSPORT_MODE_PROFILES`) -- nadaje konkretny kształt
    `TransportModeDefinition.cost` (M2 "open bag"), ten sam wzorzec co
    `ProductionRecipe` (M7) dla
    `ProductionMethodDefinition.inputs/     outputs`. 4 aktywne tryby VS
    §16 (Foot/Porter, Pack Animal, Cart, River), malejący koszt na
    jednostkę EffectiveDistance zgodnie z kolejnością rozwoju z
    Simulation Model §28.
-   `trade/effective-distance.ts` (`updateEffectiveDistance`) --
    `EffectiveDistance = PhysicalDistance x TerrainModifier x     InfrastructureModifier x BorderModifier x SecurityModifier x     SeasonalModifier`
    (ECO-016). Pierwsza implementacja modyfikatorów poza
    `terrainDifficulty`/`seasonalModifier` --
    `Connection.cached.     effectiveDistance` domyślnie równał się
    `physicalDistance` od M3 właśnie dlatego, że tych modyfikatorów
    jeszcze nie było. Infrastruktura=0 to neutralny modyfikator (1), nie
    kara -- rośnie tylko realna inwestycja; brak infrastruktury i tak
    blokuje handel przez `capacity=0` w `capacity-congestion.ts`, więc
    nie trzeba tego duplikować karą w samym dystansie.
-   `trade/capacity-congestion.ts` (`evaluateCapacityCongestion`) --
    `TradeDemand > RouteCapacity -> Congestion -> TransportCost up`
    (Simulation Model §28). Trasa z `capacity=0` jest nieprzejezdna
    (`cappedFlow=0`), nie ma nieskończonego/NaN wykorzystania (Finite
    Numbers, Simulation Test Spec §18) -- ten sam standard co dzielenie
    przez zero w `markets/price-adjustment.ts` (M8).
-   `trade/flows.ts` (`evaluateTradeFlow`) --
    `ImportedCost =     ForeignPrice + TransportCost + Tariff(=0 w VS) + RiskCost`
    (VS §18). Handel powstaje tylko, gdy jest ekonomicznie uzasadniony
    (`importedCost     < importingGood.localPrice`) LUB istnieje
    krytyczny shortage
    (`shortageSeverity >= CRITICAL_SHORTAGE_THRESHOLD`) -- dokładnie
    warunek z FC-TRADE-002. Faktyczna ilość jest ograniczona
    jednocześnie przez capacity połączenia i fizyczną nadwyżkę
    eksportera (`supply - demand`, Entity Data Model §15 "eksport nie
    może przekraczać fizycznej podaży") -- Market nadal nie jest
    właścicielem fizycznego zapasu (DATA-005/DATA-006), więc `flows.ts`
    czyta `MarketGoodState` obserwacyjnie, tak jak
    `markets/price-adjustment.ts` czyta Inventory.

**Nowa treść:**
`content/transportModes/{foot_porter,pack_animal,cart, river}.json` (4
pliki, subset VS §16) + klucze `en`/`pl` w `locales/*/common.json`;
`content-fixtures.integration.test.ts` rozszerzony o `transportMode`.

**Testy:** 25 nowych (372 łącznie): `effective-distance.test.ts`
(FC-CORE- 001 kierunek każdego modyfikatora, dopasowanie ręcznie
policzonej wartości dla prawdziwego połączenia Black Mountain "highland
pass"), `capacity-congestion.test.ts` (FC-TRADE-003/004, trasa o
capacity=0 nie daje NaN/Infinity), `flows.test.ts` (Acceptance Gate,
FC-TRADE-001/002/ 003, eksport nigdy nie przekracza fizycznej nadwyżki),
plus rozszerzenie `connections.test.ts` o opcjonalne
`infrastructure`/`friction`.

**Acceptance Gate -- zweryfikowane:** region z niedoborem dobra
importuje je z sąsiedniego regionu z nadwyżką po realnym koszcie
transportu (`ForeignPrice + TransportCost`, tańszym niż cena domowa --
stąd ekonomiczne uzasadnienie); wąskie gardło (niska capacity
połączenia) widocznie ogranicza przepływ poniżej tego, na co pozwoliłyby
same podaż/popyt.

**Bramki jakości (2026-09-17):** `pnpm typecheck`, `pnpm lint` (ten sam
1 warning z M2/M5/M7/M8/M9, bez zmian), `pnpm format:check`, `pnpm test`
(372/372) i `pnpm build` -- wszystkie zielone w czystym przebiegu.
Etykieta `app.milestone` zaktualizowana na "M10 -- Trade & Transport"/
"M10 -- Handel i Transport".

**Dług techniczny / świadomie poza zakresem:** pełna infrastruktura jako
inwestycja gracza/AI (M14/M22 -- M10 tylko czyta `infrastructure.level`,
nikt jeszcze go nie podnosi); państwa/granice (`BorderModifier`
strukturalnie neutralny w VS, WORLD-008); `cargoFactor` to placeholder
(domyślnie 1) zamiast realnego `GoodDefinition.transportProperties`,
który pozostaje otwartym `OpenRecordSchema` -- formalizacja tego pola to
przyszły milestone, gdy faktycznie go potrzebuje; brak realnej pętli
ticków łączącej `HeadlessRunner`/`WorldState` z systemami gospodarki --
ten sam stan co M5-M9, `evaluateTradeFlow` jest czystą, testowaną w
izolacji funkcją, nie wołaną per-tick przez orkiestrator.

**Czy M11 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M11 --- Company AI

**Faza:** E --- Autonomous Actors · **Priorytet:** P0 · **Złożoność:** L
· **Ryzyko:** HIGH · **Documentation Readiness:** READY

**Cel:** firmy autonomicznie planują produkcję, reagują na inventory,
zatrudniają, ustalają wage offer, przechodzą przez
expansion/contraction/closure i finansowe przetrwanie, zgodnie z
`OBSERVE → FORECAST → GENERATE OPTIONS → SCORE → DECIDE → ACT → EVALUATE`.

**Zależności:** M10.

**Implementowane systemy:** wspólny Decision Pipeline, Perceived World
State (`AI-001`), bounded rationality, hysteresis + cooldown (`AI-005`),
Company Financial Health, DecisionSnapshot + CausalContext dla decyzji
firm.

**Moduły (`AI-01`...`AI-11` z AI Decision Model §121, plus Black
Mountain tuning w M23):**

``` text
AI-01 Common Decision Framework
AI-02 Company Observation & Memory (Perceived State, nie World State)
AI-03 Production decisions
AI-04 Labor & wage decisions
AI-05 Financial survival
AI-06 Expansion / contraction / closure
AI-08 Production Method adoption
AI-10 DecisionSnapshot + CausalContext
AI-11 Debug Inspector
```

*(`AI-07` Entrepreneurship i `AI-09` Migration integration przenoszą się
do M12/M13, gdzie żyją koncepcyjnie; `AI-12` Black Mountain tuning
przenosi się do M23, gdy cały świat działa end-to-end.)*

**Dane:** brak nowego contentu; wykorzystuje istniejące PM i archetypy.

**Testy:** production reaction test, no overreaction test, hysteresis
test, cooldown test, financial survival test, closure test, bankruptcy
test, PM adoption/rejection test, determinism test (te same warunki = te
same decyzje), perceived state test (brak perfect foresight).

**Acceptance Gate (AI Decision Model §122):** firma potrafi
autonomicznie planować produkcję, reagować na inventory, zatrudniać,
zmieniać wage offer, przechodzić przez expansion/contraction/closure i
unikać oscylacji dzięki hysteresis/cooldown.

**Ryzyka:** **HIGH** --- to największe ryzyko projektu wg `Master Audit`
§271: „interakcja wielu poprawnych systemów prowadząca do niestabilnej
lub nieczytelnej symulacji". Mitygacja: hysteresis i cooldown są P0 (nie
opcjonalne), staggered evaluation od początku, dedykowane testy
no-overreaction.

**Poza zakresem:** entrepreneurship/nowe firmy (M12), pełna migracja
jako input do decyzji (M13), State AI (`DEFERRED`).

**Źródła:** `FIRST-CAUSE-AI-Decision-Model-v0.1.md` (całość, zwłaszcza
§5--41, §121--124), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (AI-\*).

### M11 --- Wyniki wykonania (2026-09-17)

**Status: DONE.**

**Rozszerzenie encji (`packages/entities/src/economy/company.ts`):**
`Company` zyskuje pole `ai` (Entity Data Model SS19
`ai: {state, expectations, lastDecision, lastEvaluation}` -- dokładnie
to, czego M3 świadomie nie dotknęło). `expectations` NIE jest zdublowane
-- M11 zapisuje je do już istniejącego
`CompanyMarketState.expectedPrices/ expectedDemand` (M3), pierwszy raz
od jego wprowadzenia. `state` staje się `memory` (AI-02: krótka pamięć
trendów, bounded rolling window jak `Market.history` z M8) +
`activeStates`/`opportunityStreak` (AI-01 hysteresis/persistence);
`lastDecision` to bramka cooldownu, kluczowana per typ decyzji.

**Nowe moduły (`packages/simulation/src/systems/economy/company-ai`):**

-   `decision-framework.ts` (AI-01) -- `evaluateHysteresisGate` (próg
    aktywacji wyższy niż dezaktywacji, SS19), `isOnCooldown`/
    `recordDecision` (SS20), `updateOpportunityStreak`/
    `persistenceSatisfied` (SS21), `updateMemory` (AI-02),
    `updateExpectations` (SS10 EMA -- do
    `Company.market.     expectedPrices/expectedDemand`). Wspólna
    infrastruktura, z której korzystają wszystkie poniższe moduły --
    roadmapowe ryzyko HIGH ("interakcja wielu poprawnych systemów
    prowadząca do niestabilnej symulacji", Master Audit §271) jest
    mitygowane raz, nie osobno w każdej decyzji.
-   `financial-health.ts` (AI-05) -- `assessFinancialHealth`
    (profitMargin, cashRunwayMonths, `distressed`). Każdy inny moduł
    decyzyjny sprawdza `distressed` przed wzrostem (SS23 "Priorytet
    przetrwania firmy").
-   `production-decision.ts` (AI-03, SS25-28) -- domyka dług z M7:
    `Company.production.utilization` jest teraz naprawdę sterowane przez
    AI, tym samym wzorcem capped+smoothed pressure co
    `markets/     price-adjustment.ts` (M8) i `labor/wages.ts` (M9) --
    SS26 "nie skacze natychmiast z 10% do 100%". Zdystresowana firma
    nigdy nie dostaje sygnału INCREASE z marginesu (SS23), ale wciąż
    może REDUCE przy realnej stracie.
-   `labor-decision.ts` (AI-04, SS29/31) -- decyduje tylko *cel*
    zatrudnienia (`vacancies` albo `layoffTarget`); wykonanie na
    konkretnej kohorcie zostaje `matchEmployment`/`layoffWorkers`
    (`labor/employment.ts`, M9+M11) -- `Company` przechowuje tylko
    zagregowany `employees`, nie rozbicie per-kohorta. Wspólny cooldown
    dla HIRE/LAYOFF wymusza SS31 ("nie powinna zwalniać i zatrudniać
    tych samych pracowników co tick") silniej niż dosłowne brzmienie --
    nie mogą się przełączać nawet w oknie cooldownu.
-   `lifecycle-decision.ts` (AI-06, SS32-35) -- Expansion/Contraction/
    Closure, jedyne miejsce, gdzie hysteresis+cooldown+persistence
    działają razem (długie okna, SS20 "expansion -- długi").
    `ExpansionScore` liczy realne sygnały, które M11 ma
    (DemandPersistence, Margin, CapacityPressure, CapitalCost) i
    świadomie zeruje resztę
    (MarketGrowth/InputRisk/LaborRisk/MarketRisk) zamiast zgadywać --
    strukturalnie wierne, nie w pełni wypełnione, ten sam standard co
    `Tariff` w M10. Closure z zerową/ujemną gotówką w momencie
    zamknięcia ustawia też `status.bankrupt` (SS35: "w prostym VS
    bankructwo może wynikać z utraty płynności") -- bez osobnego systemu
    długu.
-   `pm-adoption.ts` (AI-08, SS36-41) -- `PMScore` jako delta marginesu
    na batch między `ProductionRecipe` (M7) obecnym a kandydatem,
    cenione z Perceived World State wywołującego (brakująca cena = 0,
    nie rzut wyjątku -- AI-004 ograniczona racjonalność).
    `innovationPreference` obniża wymaganą przewagę (SS40 Early
    Adopters).
-   `decision-snapshot.ts` (AI-10) -- `DecisionSnapshot`/`CausalContext`
    jako czyste dane; realne wpięcie w graf Causality Engine to M17.
    AI-11 Debug Inspector jest spełnione przez to, że `DecisionSnapshot`
    jest prawdziwą, inspekcjonowalną wartością zwracaną przez
    `lifecycle-decision.ts`/`pm-adoption.ts` -- Simulation Core nic nie
    renderuje (DATA-007), więc nie ma tu osobnego UI/read-modelu.

**Rozszerzenie M9 (`labor/employment.ts`):** nowa `layoffWorkers` --
mechaniczne lustrzane odbicie `matchEmployment`, fail-loud jak reszta
modułu.

**Dane:** brak nowego contentu -- `pm-adoption.ts` testowany na
syntetycznych `ProductionRecipe` w testach, zgodnie z "wykorzystuje
istniejące PM i archetypy".

**Testy:** 68 nowych (430 łącznie): production reaction/no overreaction,
hysteresis (aktywacja/dezaktywacja niezależne progi), cooldown (blokuje,
potem zwalnia), financial survival, closure (z DecisionSnapshot),
bankruptcy (zero cash przy zamknięciu), PM adoption/rejection (w tym
"technologia może być nieopłacalna" i Early Adopters), determinism
(identyczne wejście -\> identyczny wynik, dwa moduły).

**Acceptance Gate -- zweryfikowane:** firma autonomicznie planuje
produkcję (utilization reaguje na margines/inventory/input), reaguje na
inventory (wysoki inventory -\> REDUCE), zatrudnia (HIRE otwiera
vacancies), zmienia wage offer (M9, ponownie użyte), przechodzi przez
expansion/contraction/closure (hysteresis+cooldown+persistence), unika
oscylacji (100-tickowe testy stresowe w `production-decision.test.ts`
nie wykazują odbić).

**Bramki jakości (2026-09-17):** `pnpm typecheck`, `pnpm lint` (ten sam
1 warning z M2/M5/M7/M8/M9/M10, bez zmian), `pnpm format:check`,
`pnpm test` (430/430) i `pnpm build` -- wszystkie zielone w czystym
przebiegu. Etykieta `app.milestone` zaktualizowana na "M11 -- Company
AI"/"M11 -- AI Firm".

**Dług techniczny / świadomie poza zakresem:** entrepreneurship/nowe
firmy (M12), pełna migracja jako input do decyzji (M13), State AI
(`DEFERRED`); `DecisionSnapshot.causalContext` nie jest jeszcze wpięty w
realny graf `CausalEdge` (M17); `ExpansionScore` pomija
MarketGrowth/InputRisk/LaborRisk/MarketRisk (brak jeszcze realnych
sygnałów -- kolejne milestone'y je dodadzą, nie trzeba zmieniać
`lifecycle-decision.ts`, tylko rozszerzyć wejście); brak realnej pętli
ticków łączącej `HeadlessRunner`/`WorldState` z systemami gospodarki --
ten sam stan co M5-M10, każda funkcja decyzyjna jest czysta i testowana
w izolacji, nie wołana per-tick przez orkiestrator.

**Czy M12 jest odblokowane:** TAK.

------------------------------------------------------------------------

## M12 --- Entrepreneurship

**Faza:** D --- Knowledge & Economic Evolution (Company Dynamics) ·
**Priorytet:** P0 · **Złożoność:** M · **Ryzyko:** MEDIUM-HIGH ·
**Documentation Readiness:** READY

**Cel:** nowe firmy powstają przez regionalny Opportunity Scanner, nie
przez losowe spawnienie; konkurencja i nasycenie rynku są modelowane.

**Zależności:** M11.

**Implementowane systemy:** Regional Opportunity Scanner, Opportunity
Score
(`DemandGap + ExpectedMargin + ResourceAccess + LaborAvailability + SkillAvailability + MarketAccess - Competition - Risk - CapitalRequirement`),
Founding Decision, Capital Formation, Competition,
resource-based/market-gap/export entrepreneurship, company location
decision.

**Moduły (`AI-07` z AI Decision Model):**

``` text
AI-07 Entrepreneurship / founding
economy/opportunity-scanner
economy/competition
```

**Dane:** brak nowego contentu; wykorzystuje pełny podzbiór 17
archetypów zdefiniowany do tej pory.

**Testy:** opportunity founding test, no opportunity test (firma nie
powstaje bez uzasadnienia ekonomicznego), competition saturation test,
determinism test dla różnych firm.

**Acceptance Gate:** w regionie z niezaspokojonym popytem i dostępnymi
zasobami/pracą powstaje nowa firma w rozsądnym czasie; w regionie bez
uzasadnienia ekonomicznego firma nie powstaje; nasycenie rynku ogranicza
dalsze zakładanie firm tego samego typu.

**Ryzyka:** ryzyko „eksplozji firm" lub odwrotnie --- świata bez żadnej
nowej firmy (mitygacja: `Anti-Explosion Rules`,
`Minimum Economic Scale`, `Company Explosion Detector` z AI Decision
Model §84--88 i Save/Determinism/Performance §129--134).

**Poza zakresem:** pełna 28-archetypowa gospodarka (to M28, post-VS).

**Źródła:** `FIRST-CAUSE-AI-Decision-Model-v0.1.md` (§42--53, §84--89,
§123), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (AI-007--008).

**Checkpoint:** **CP2 --- Emergent Economy** osiągnięty po tym milestone
(firmy samodzielnie podejmują decyzje).

------------------------------------------------------------------------

## M13 --- Migration

**Faza:** C --- Living World · **Priorytet:** P0 · **Złożoność:** M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** migracja jako probabilistyczna reakcja na lokalne warunki
(push/pull), nie skanowanie całego świata przez każdą kohortę.

**Zależności:** M12 (potrzebuje działającego zatrudnienia/płac jako
sygnałów pull/push).

**Implementowane systemy:** migration attraction, migration candidate
set (sąsiedzi, trade-connected regions, znane centra, cultural/family
links --- `POP-007`), migration friction, housing constraint jako twardy
limit.

**Moduły (`AI-09` z AI Decision Model, `population/migration`):**

``` text
AI-09 Migration decision integration
population/migration -- candidate set, friction, attraction/push-pull
```

**Dane:** brak nowego contentu.

**Testy:** migration attraction test, migration friction test, housing
constraint test, candidate set test (nie cały świat), migration
accounting (conservation --- populacja nie znika/nie duplikuje się w
migracji).

**Acceptance Gate:** kohorta migruje do regionu o lepszych warunkach z
prawdopodobieństwem zależnym od odległości/friction/housing, nigdy
przekraczając housing capacity celu; brak migracji „donikąd" i brak
duplikacji populacji.

**Ryzyka:** średnie --- ryzyko nierealistycznych masowych migracji bez
friction (mitygacja: `Housing Capacity` jako twardy constraint od
początku, zgodnie z `SET-003`).

**Poza zakresem:** pełny Culture Model (DEFERRED), państwa/granice
migracyjne (DEFERRED).

**Źródła:** `FIRST-CAUSE-AI-Decision-Model-v0.1.md` (§58--61),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (POP-006--007, SET-003),
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§65--69).

------------------------------------------------------------------------

## M14 --- Settlements

**Faza:** C --- Living World · **Priorytet:** P0 · **Złożoność:** S/M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** osady rosną/kurczą się przez `SettlementPressure` i warunki
lokalne, przechodząc przez etapy
`Camp → Hamlet → Village → Town → City → Metropolis`, nie przez rozkaz
gracza.

**Zależności:** M13.

**Implementowane systemy:** SettlementPressure, settlement stages,
housing (capacity/cost/pressure).

**UI Foundation Track:** **UI-F1 --- Procedural Region Visual Identity**
jawnie odroczone do M15 (decyzja z 2026-09-18, w ramach naprawy audytu
post-implementacyjnego M12-M14 -- poprzednia wersja tej sekcji mówiła o
starcie UI-F1 tutaj, ale M14's rzeczywista implementacja renderingu nie
objęła; §15's "M14/M15" pozostawało niejednoznaczne, teraz
rozstrzygnięte na M15). M14 sam w sobie nie jest przez to zablokowany --
UI-F1 był zawsze częścią równoległego "Parallel UI Foundation Track",
nie Acceptance Gate tego milestone'u (sekcja 6A). Docelowo:
`RegionVisualProfile` oraz deterministyczny renderer `FCRegionVignette`
z warstwami terrain → vegetation → settlement → transport →
infrastructure → industry → landmark. Renderer jest pochodną stanu
symulacji; nie istnieje globalny skin epoki i nie używa `Math.random()`.

**Moduły (`society/settlements`):**

``` text
society/settlements -- stage transitions, pressure calculation
society/housing -- capacity, cost, pressure
```

**Dane:** brak nowego contentu.

**Testy:** settlement pressure test, settlement stage transition test,
urban crisis test (przeciążenie housing/needs), housing constraint
integration z M13.

**Acceptance Gate:** osada z rosnącą populacją i dobrymi warunkami
przechodzi przez kolejne etapy zgodnie z pressure; osada bez
uzasadnienia ekonomicznego nie awansuje sztucznie; Metropolis nie jest
wymagane jako osiągalny wynik VS (`SET-001`).

**Ryzyka:** niskie-średnie; głównie tuning progów (jawnie oznaczony
`OPEN`/tuning, nie blokuje implementacji).

**Poza zakresem:** pełna infrastruktura miejska (rozwijana dalej w World
Generation/economy), pełne miasta-państwa (DEFERRED).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (SET-001--003),
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§70--72),
`FIRST-CAUSE-World-Generation-Spec-v0.1.md` (§19--20).

**Audyt post-implementacyjny (2026-09-18):** M12-M14 zostały wdrożone
(commity `c05d27f`/`26ef121`/`a70ba4c`) i oznaczone DONE, ale audyt
post-implementacyjny
(`docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`)
wykazał FAIL -- 6 blokerów P0 (tożsamość/ID migrantów, obejście twardego
limitu housing, brak źródła kapitału foundingu, fantomowi pracownicy,
niekanoniczna kolejność faz ticka) i 8 P1. Pełna naprawa (Etapy 5-11,
commity `86198a4`/`12d62c9`/`5b7f391`/`6c372bf`/
`31b1f59`/`221c8ee`/`7ac2bc7`) domyka wszystkie znalezione problemy,
łącznie z wielotickowym (120 ticków × 3 seedy) monitorem inwariantów na
prawdziwym contencie. DONE dla M12-M14 jest teraz uzasadnione tym
audytem, nie tylko commitami wdrożenia.

------------------------------------------------------------------------

## M15 --- Technology

**Faza:** D --- Knowledge & Economic Evolution · **Priorytet:** P0 ·
**Złożoność:** L · **Ryzyko:** MEDIUM-HIGH · **Documentation
Readiness:** READY (od 2026-09-18)

**Warunek rozpoczęcia -- SPEŁNIONY (2026-09-18).** Wymagany katalog
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` (5 domen × 25 odkryć
= 125, T0--T6) został dostarczony i domeny/tier są CANONICAL
(TECH-004/007/008 w `Canonical Decisions` zaktualizowane w tym samym
kroku). Techniczny krok z sekcji 5 tego katalogu --
`content/discoveries/*.json` -- jest teraz również zrobiony: 125 plików
zgodnych z `DiscoveryDefinitionSchema`, zweryfikowanych przez realny
pipeline M2 (`content-fixtures.integration.test.ts`: 0 błędów, 0
ostrzeżeń, referencje/cykle/duplikaty/faza/lokalizacja PL+EN -- czyste).
Pola tuningowe (`knowledgeRequirements`, `conditions`,
`pressureModifiers`, `diffusion`, `adoption`, `unlocks`,
`chronicleSignificance`) są świadomie puste (`{}`/`[]`) -- to
"configurable placeholder + TODO tuning" (`AGENTS.md`), nie brakujący
zakres tego kroku: ich rzeczywisty kształt zależy od tego, jak M15's kod
(Discovery Engine, Adoption) faktycznie je konsumuje, co dokument
katalogu explicite odkłada do implementacji (sekcja 1/5). `unlocks` nie
wskazuje jeszcze na nowy content PM/Good (23/125 pozycji katalogu je
wymaga) -- to jest odrębny, jeszcze niezrobiony krok z katalogu's sekcji
5 pkt 3, poza zakresem samego `content/discoveries/*.json`.

**Niezgodność w katalogu rozwiązana (2026-09-19):** `MEC-009` (T2) miał
prerekwizyt `MIN-019` (T4) -- tier wyższy o 2 poziomy niż zależna
pozycja, poza wzorcem reszty katalogu. Prerekwizyt `MIN-019` (cement)
usunięty z `MEC-009` (fortyfikacje wymagają murarstwa kamiennego,
`MEC-006` T1, nie cementu); `content/discoveries/mec_009.json` i katalog
zaktualizowane w tym samym kroku.

**Decyzja z 2026-09-18** (przy zamykaniu audytu post-implementacyjnego
M12-M14), zachowana: **UI-F1 --- Procedural Region Visual Identity**
(`RegionVisualProfile` + renderer `FCRegionVignette`, jawnie odroczone z
M14, patrz M14's sekcja) startuje razem z M15, równoległym torem, bez
blokowania M15's własnej Acceptance Gate.

**Cel:** wiedza regionalna, stany technologii
(`Unknown → Known → Available → Adopted`), Discovery Engine oddzielony
od decyzji Company AI o wdrożeniu (Adoption), 125 aktywnych Discoveries
w 5 domenach (`TECH-004`/`TECH-008`, zaktualizowane 2026-09-18 --
zastępuje pierwotny zapis "20--30 aktywnych w 5 głównych + 4
wspierających domenach" widoczny niżej w tej sekcji przed korektą; patrz
też `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` §28--29, zaktualizowane
tym samym dniem).

**Zależności:** M14 (populacja/osady jako baza wiedzy regionalnej).

**Implementowane systemy:** Knowledge accumulation, Discovery
eligibility, breakthroughs, Availability, PM Adoption (decyzja Company
AI, integrowana z M11's `AI-08`), Industry/Population/Institutional
Adoption. Równolegle (UI Foundation Track, nie część tej Acceptance
Gate): `RegionVisualProfile`/`FCRegionVignette` (UI-F1, odroczone z
M14).

**Moduły (`technology/knowledge`, `technology/discoveries`,
`technology/diffusion`, `technology/adoption`):**

``` text
technology/knowledge -- regional knowledge accumulation
technology/discoveries -- eligibility, breakthrough triggers
technology/diffusion -- Availability spread
technology/adoption -- Industry/Population/Institutional (AI-08 hook)
```

**Dane:** 5 domen VS (Rolnictwo i Żywność, Górnictwo i Metalurgia,
Budownictwo i Mechanika, Transport i Komunikacja, Nauka i Społeczeństwo
-- `TECH-004`); 125 Discoveries, 25 na domenę (`TECH-008`).

**Testy:** discovery eligibility test, discovery ≠ availability test,
availability ≠ adoption test, PM adoption/rejection test, technology
diffusion test.

**Acceptance Gate:** region bez wymaganej wiedzy nie może odkryć
zaawansowanej technologii; odkrycie nie oznacza automatycznego wdrożenia
(firma może odrzucić nieopłacalną technologię ---
`AI Decision Model §39`); dyfuzja wiedzy jest widoczna między
połączonymi regionami.

**Ryzyka:** złożoność stanu 4-poziomowego
(`Unknown/Known/ Available/Adopted` × Industry/Population/Institutional)
przy 125 discoveries --- mitygacja: brak klasycznego tech tree
(`TECH-001`) upraszcza strukturę względem alternatyw; T0--T6 to
complexity bands, nie epoki (`TECH-007`), co unika sztywnej progresji
czasowej.

**Poza zakresem:** pierwotny podział na 12 wąskich domen (zastąpiony
przez `TECH-004`'s 5 szerokich domen), Administration jako 6. domena
(nie jest domeną --- `TECH-005`).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (TECH-001--009),
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§28--31),
`FIRST-CAUSE-AI-Decision-Model-v0.1.md` (§36--41, §62).

### M15 --- Wyniki wykonania (2026-09-19)

**Status: DONE.**

**Nowe moduły (`packages/simulation/src/systems/technology`):**
`knowledge.ts` (regionalna akumulacja wiedzy,
`accumulateRegionalKnowledge`), `discoveries.ts`
(`computeEligibleDiscoveryIds`/`updateEligibility`/
`evaluateBreakthroughs` -- eligibility i breakthrough oddzielone od
Adoption, §62), `diffusion.ts` (`computeDiffusionPressure`/
`growAvailability` -- Availability między połączonymi regionami),
`adoption.ts` (`isProductionMethodAvailable` gate'uje kandydatów AI-08,
`applyIndustryAdoption`/`applyPopulationAccess`; `institutionalAdoption`
świadomie 0, zależy od nieistniejącego systemu Administration).

**Wpięcie w tick loop:** nowy krok "2.5" w `core/economy-tick.ts`
(Knowledge -\> Eligibility -\> Diffusion pressure -\> Breakthroughs -\>
Availability -\> Population access), zaraz po Demografii i przed Company
AI (krok 3, który gate'uje kandydatów PM świeżym stanem Technology tego
ticka). Wszystkie nowe pola `RunEconomyTickInput` opcjonalne --
`discoveryRng === undefined` wyłącza całą fazę Technology (pełna
wsteczna zgodność, zero zmian w testach sprzed M15).
`core/world-runner.ts` podłącza `discoveryRng` bezwarunkowo (ten sam
wzorzec co demography/ migration -- realny runtime, nie opcjonalna
funkcja contentu).

**Content:** nowy schemat `KnowledgeDomainDefinition` (11. typ
contentu) + 5 plików `content/knowledgeDomains/*.json`;
`DiscoveryDefinition. primaryDomainId`/`secondaryDomainIds` teraz
faktycznie cross-referencują `knowledgeDomain` (wcześniej gołe stringi,
patrz katalogu §5 pkt 1 -- domknięte). `worldgen`'s
`load-economy-content.ts` ładuje `discovery`/`knowledgeDomain`
(wcześniej pomijane) i buduje simulation-natywne
`discoveryEligibilityRulesById`/`requiredDiscoveryIdsByMethodId` (z
`ProductionMethodDefinition.discoveries`, nie z polimorficznego
`unlocks` -- właściwy kierunek referencji dla gate'owania AI-08).

**Naprawiony po drodze (audytowy, wykryty pierwszym pełnym
wieloticzkowym testem `pmCandidatesByCurrentMethodId` przez
`runEconomyTick`):** `runProduction` (M7) bezwarunkowo "odbijał"
`recipe.productionMethodId` z powrotem do
`company.production.productionMethodId`, cofając AI-08's adopcję
dokonaną chwilę wcześniej w tym samym ticku -- nieszkodliwe, dopóki nikt
nie zmienił metody w danym ticku (echo = no-op), ale realny błąd raz na
adopcję, niewidoczny do dziś bo nic wcześniej nie prowadziło
`pmCandidatesByCurrentMethodId` przez realną, wieloticzkową pętlę.
Naprawione w `economy-tick.ts`'s kroku 5.

**Testy:** \~43 nowe testy jednostkowe (`systems/technology/*.test.ts`),
rozszerzenia `technology-state.test.ts`/`economy-tick.test.ts`/
`load-economy-content.test.ts`;
`m15-technology-invariant-monitor.test.ts` (3 seedy × 120 ticków
przeciwko realnemu katalogowi 125 odkryć, na syntetycznym świecie --
`technology-fixture.ts`, bo istniejące World Fixture Documenty mają
`technologyStates`, ale żaden region się do nich nie linkuje ---
**naprawione 2026-09-26**, patrz „Regional Technology State Repair”
przy M21);
`technology-acceptance.test.ts` (3 testy, jeden na jedno zdanie
Acceptance Gate wyżej). `pnpm typecheck`/`lint`/`test`/`build`/
`test:e2e`: wszystkie PASS.

### UI-F1 --- Wyniki wykonania (2026-09-19)

**Status: DONE** (dogonione przed startem M16, na wyraźną prośbę
użytkownika -- równoległy tor UI-F1 był przypisany do startu razem z
M15, ale M15's własna implementacja go nie objęła).

**`RegionVisualProfile`
(`packages/simulation/src/read-models/ region-visual-profile-read-model.ts`,
`buildRegionVisualProfileReadModel`):** pierwsza połowa SS18.1's
pipeline'u (`WorldState -> RegionVisualProfile`). Każde pole wywiedzione
z realnych danych (SS18.9 "NO DECORATION WITHOUT INFORMATION"):
`terrain`/`water` z `Region.geography`, `vegetation` heurystycznie z
`terrain`/`environment.forestPressure`/`geography. fertility`/sektora
rolnego, `settlement` z największego niebędącego CAMP-em settlementu,
`transport` z maksymalnego `Connection.infrastructure. level` w
regionie, `landmarkResourceDefinitionId` z jedynego wyraźnie
dominującego, odkrytego (`DISCOVERED`/`ASSESSED`), nie wyczerpanego
złoża. `industry`/część `vegetation` wymaga `sector` z contentu, którego
`packages/simulation` nie czyta (AGENTS.md reguła 6) -- przyjmuje
opcjonalny `sectorByCompanyArchetypeId`, budowany przez
`packages/worldgen`'s `loadEconomyContent` (nowe pole
`LoadEconomyContentResult. sectorByCompanyArchetypeId`), ten sam wzorzec
co M15's `discoveryEligibilityRulesById`. `infrastructure`/`energy`
świadomie zawsze `undefined` -- brak systemu inwestycji
infrastrukturalnej/energii (ten sam znany brak co M12-M14 audytu:
`Connection.infrastructure.level` martwe,
`Settlement.condition.attractiveness` martwe).
`vignetteSeed = hash(worldSeed + regionId + visualState)` (`fnv1a32`,
SS18.6/SS13.2) -- deterministyczny, zero `Math.random()`.

**`FCRegionVignette`
(`apps/desktop/src/components/fc/FCRegionVignette.tsx`) + 7 komponentów
warstw z katalogu Implementation Spec SS8.5**
(`FCTerrainLayer`/`FCVegetationLayer`/`FCSettlementLayer`/
`FCTransportLayer`/`FCInfrastructureLayer`/`FCIndustryLayer`/
`FCLandmarkLayer`): druga połowa pipeline'u. **Świadomie placeholder
geometrii, nie stylu** -- SS18.7/SS13.3 explicite zabraniają Codexowi
projektowania stylu/biblioteki assetów samodzielnie, a żadna
zatwierdzona biblioteka (SS18.8's `/assets/region-vignette/`) nie
istnieje. Każda warstwa renderuje neutralne, zgodne wyłącznie z Design
Tokens (SS53) znaczniki (linie/prostokąty/romb), nigdy pikturalną
sylwetkę góry/drzewa/ domu -- podmiana na docelowe assety, gdy Design
System je dostarczy, nie dotyka logiki mapowania/kompozycji/determinizmu
powyżej. `FCInfrastructureLayer` renderuje zawsze `null` (ten sam brak
danych co profil). Rozmiary SS18.2: `small` 120x70 (hover), `large`
400x120 (Selected/Detail). Wariant kompozycji per warstwa
deterministycznie z `vignetteSeed` (`fnv1a32`, nigdy `Math.random()`).
Nie podłączone jeszcze do żadnego realnego ekranu (Region Detail/Atlas
-- UI-05/UI-04 -- same nie istnieją póki co w `apps/desktop`, patrz
sekcja 6A) -- to gotowy, przetestowany fundament do podłączenia, kiedy
te ekrany faktycznie powstaną.

**Testy:** 9 nowych testów read-modelu (determinizm, honest-"undefined"
gdy brak danych, dominance/tie-breaking landmarku), 5 nowych testów
komponentu (`@testing-library/react` -- wymiary SS18.2, accessible
label, "no decoration without information", skalowanie settlementu,
determinizm identycznego markupu), 1 nowy test w
`load-economy-content.test.ts` (`sectorByCompanyArchetypeId`).
`pnpm typecheck`/`lint`/`test`/`build`/ `test:e2e`: wszystkie PASS (649
testów w repo).

**Addendum -- remediacja audytu (2026-09-19):** niezależny audyt wykrył,
że powyższy "Wyniki wykonania" był technicznie prawdziwy, ale w praktyce
`unlocks: []`/brak `discoveries` na obu realnych VS Production Methods
oznaczał, że Discovery Engine nie mógł wpłynąć na ŻADNĄ realną decyzję
produkcyjną -- i, głębiej, że `pmCandidatesByCurrentMethodId` (od której
zależy cała ścieżka gate'owania AI-08) nigdy nie było budowane z
realnego contentu w `run-economy-demo.ts` (zawsze `{}`, istniało tylko w
testach). Naprawione: nowa
`content/productionMethods/watermill_milling.json`
(`discoveries: ["mec_004"]`, realizuje katalogu §5's "MEC-004 -\> nowy
content PM 'młyn'"), nowa `derivePmCandidatesByCurrentMethodId` w
`load-economy-content.ts` + wpięcie w `run-economy-demo.ts`, nowy test w
`technology-acceptance.test.ts` na realnych ID (nie syntetycznym
`gated_method`/`gated_discovery`). Status DONE potwierdzony ponownie po
naprawie, nie tylko przez pierwotną implementację.

------------------------------------------------------------------------

## M16 --- Architect (pierwsza interwencja)

**Faza:** H --- Architect · **Priorytet:** P0 · **Złożoność:** M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** gracz może zmienić **warunek** (nie wynik) świata przez
pierwszą interwencję (`Reveal Resource Deposit`), z kosztem Influence i
Root Fact jako punktem startowym dla przyszłej atrybucji.

**Zależności:** M15 (świat musi mieć pełną gospodarkę/technologię, aby
interwencje miały sens ekonomiczny).

**Implementowane systemy:** Influence (0--100), koszt interwencji
(`Base × Magnitude × Duration × Scope × Naturalness`), Intervention
Definition/Instance, validation przed wykonaniem, preview (bez obietnicy
wyniku), Root Fact.

**Moduły:**

``` text
architect/influence -- balance, regeneration (tuning OPEN --
  OPEN-002/003)
architect/interventions -- Definition/Instance, status lifecycle
architect/root-fact -- pierwszy punkt causal graph (pełna integracja w M17)
```

**Dane:** `VS-INT-01 Reveal Resource Deposit` jako pierwsza w pełni
zaimplementowana interwencja; pozostałe 4 core (`Fertility Shift`,
`Knowledge Injection`, `Trade Friction Shift`, `Environmental Shock`)
implementowane w tym samym milestone'ie, gdyż dzielą tę samą
infrastrukturę (`ARCH-006`).

**Testy:** influence cost test, insufficient influence test, root fact
test, validation-before-execution test, no-guaranteed-outcome test
(`ARCH-008`), no-effect ≠ failed test (`ARCH-009`).

**Acceptance Gate:** gracz z wystarczającym Influence może ujawnić
istniejące złoże (np. w Black Mountain); interwencja tworzy Root Fact;
brak Influence blokuje interwencję z czytelnym komunikatem; brak
gwarancji, że ujawnienie złoża wywoła boom.

**Ryzyka:** pokusa zaimplementowania interwencji jako bezpośredniej
mutacji wyniku zamiast warunku (zakazane --- `ARCH-001`/`ARCH-002`);
mitygacja: każda interwencja przechodzi przez ten sam
command/validation/effect-handler pipeline co inne mutacje świata.

**Poza zakresem:** Butterfly Effect attribution (wymaga M17), pełna
propagacja Influence przez graf (M17), `Population Seed` (opcjonalna,
tylko Experiment Mode).

**Źródła:** `FIRST-CAUSE-Architect-Intervention-Influence-Spec-v0.1.md`
(§1--41, §156--170), `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(ARCH-001--011).

### M16 --- Wyniki wykonania (2026-09-19)

**Status: DONE.**

**Encje (`packages/entities/src/architect/`):** `influence.ts`
(`ArchitectInfluenceState { current, max }`, SS6 -- `reserved`/
`available` świadomie pominięte, Sustained poza zakresem VS, SS7),
`intervention.ts` (`ArchitectInterventionInstance`, pełny status
lifecycle SS24 -- `PLANNED/ACTIVE/COMPLETED/CANCELLED/FAILED`, ale
VS-INT są Instant, więc `applyArchitectIntervention` przechodzi prosto
do `COMPLETED`/`FAILED` w tym samym wywołaniu). `WorldState` (M3)
rozszerzone o `architectInfluence`/`interventions` -- oba opcjonalne w
`CreateWorldStateInput` z bezpiecznym domyślnym
(`createArchitectInfluenceState()`/ puste), więc każdy istniejący
fixture nadal się kompiluje bez zmian. `@first-cause/causality`'s
`SimulationFact`/`FactInput` (M5) dostały opcjonalne pole
`architect: { interventionId, influenceStrength }` (SS32) -- dokładnie
ta rozbudowa, na którą `fact.ts`'s własny komentarz od M5 czekał
("architect needs the Architect, M16").

**Silnik (`packages/simulation/src/systems/architect/`):**
`influence.ts` (`tickArchitectInfluence`, regeneracja co tick, TODO
tuning tempa -- OPEN-002), `definition.ts`
(`ArchitectInterventionRule` + `parseArchitectInterventionRule`,
fail-loud parser `OpenRecordSchema` bagów `parameters`/`costs` z
contentu, ten sam wzorzec co M7's `parseProductionRecipe`), `cost.ts`
(`computeInterventionCost`, `Base + MagnitudePerUnit x |magnitude|`,
razem x `Duration(1) x Scope x Naturalness` -- addytywno-multiplikatywny
model z SS8), `interventions.ts` (5 effect handlerów VS-INT-01..05,
keyowane po `definitionId` -- zamknięta taksonomia, nie per-instancyjny
branch, AGENTS.md reguła 8; Reveal Resource Deposit reużywa M5's
`discoverDeposit` 1:1), `validation.ts` (`validateIntervention` --
scope/parametry/target/Influence/cooldown, SS26),
`apply-intervention.ts` (`applyArchitectIntervention` -- transakcyjny
pipeline SS182: validate -\> cost -\> spend Influence -\> mutate -\>
Root Fact -\> commit; JEDYNA funkcja w `systems/architect` która sama
emituje do `FactStore`, bo to command wywoływany POMIĘDZY tickami, nie
krok `runEconomyTick`'s pętli -- potrzebuje realnych `SimulationFact.id`
do `rootFactIds` od razu).

**Wpięcie w tick loop:** nowy krok "13." w `core/economy-tick.ts`
(`tickArchitectInfluence`, bezwarunkowy, bez RNG) -- oraz **naprawiony
audytowy bug znaleziony przy pisaniu tego kroku**: finalny
`createWorldState` na końcu `runEconomyTick` NIE przekazywał
`architectInfluence`/`interventions` z wejściowego `worldState`, więc
bez tej poprawki każdy tick cicho zerowałby balans Influence i kasował
wszystkie zaaplikowane interwencje z powrotem do domyślnego stanu
(dokładnie ten sam rodzaj błędu co M15's `runProduction` echo -- realny
tylko raz coś faktycznie istnieje w tym polu, niewidoczny w żadnym
teście sprzed tego dnia).

**Content:** `content/interventions/*.json` (5 plików, VS-INT-01..05 z
katalogu §156--162 -- schemat `InterventionDefinitionSchema` i jego
rejestracja w `CONTENT_TYPE_SPECS` istniały od dawna, przygotowane z
wyprzedzeniem tak jak `intervention-definition.ts`'s własny komentarz
zakładał). `packages/worldgen`'s `load-economy-content.ts` czyta ten
katalog i buduje `architectInterventionRulesById`. Koszty/progi
(`baseInfluenceCost` per definicja, `cooldownTicks`, zakresy parametrów)
są TODO tuning placeholderami (OPEN-003) -- wartości dobrane tak, żeby
VS Cost Philosophy (SS163: "kilka znaczących interwencji, nie ciągły
spam") było spełnione już dziś, nie ostateczne liczby.

**Testy:** 11 nowych plików testowych (\~74 nowe testy) w
`packages/entities/src/architect/*.test.ts`,
`packages/simulation/src/systems/architect/*.test.ts`,
`packages/worldgen/src/content/load-economy-content.test.ts`
(rozszerzony) i
`packages/worldgen/src/fixtures/architect-acceptance.test.ts` -- ten
ostatni dowodzi wprost wszystkich 4 zdań Acceptance Gate wyżej na
prawdziwym Black Mountain fixture (`deposit_black_mountain_iron_ore`,
zgodnie z katalogu §157 "Cel testowy: Black Mountain").
`pnpm typecheck`/`lint`/`test`/`build`/`test:e2e`: wszystkie PASS (710
testów w repo).

**Świadomie poza zakresem tej implementacji (osobno od "Poza zakresem"
wyżej):** UI Architect Panel (SS165--170, tor równoległy "Architect
presentation primitives" z sekcji 6A -- `apps/desktop` nie ma jeszcze
żadnego ekranu do podłączenia), `cancelIntervention` (SS173's Command
API ją wymienia, ale nie ma testu Acceptance Gate ani przypadku użycia
bez UI). ~~`stacking.policy` poza `"allowed"` egzekwowane tylko przez
cooldown~~ -- naprawione, patrz addendum poniżej.

**Addendum -- remediacja audytu (2026-09-19):** niezależny audyt przed
M17 znalazł 1xP0 + 4xP1 w tej implementacji, wszystkie zweryfikowane w
kodzie i naprawione (`packages/simulation/src/systems/architect/`):
`applyArchitectIntervention` nie sprawdzało unikalności `instanceId`
przed zapisem do `state.interventions` (P0 -- duplikat po cichu
nadpisywał istniejącą instancję, blocker dla jednoznaczności grafu M17);
`stacking. policy` z contentu było parsowane w Zod, ale nigdy nie
docierało do `ArchitectInterventionRule` -- `forbidden`/`limited` były
czysto opisowe (naprawione: `definition.ts` parsuje `stackingPolicy`,
`validation.ts` branch'uje po nim zamiast bezwarunkowego cooldownu);
Knowledge Injection przyjmowało dowolny niepusty `domainId`, nie tylko
jedną z 5 kanonicznych Knowledge Domains; walidacja parametrów nie
odrzucała nieznanych kluczy/`NaN`/`Infinity`/złego `tick`/złej liczby
`entityIds`; `rootFactType` było parsowane z contentu, ale nigdy
sprawdzone względem faktycznie emitowanych faktów (przypadkowa zgodność
5 dzisiejszych handlerów nie była gwarancją dla przyszłego contentu).
`pnpm typecheck`/`lint`/`test`/`build`/`test:e2e`: wszystkie PASS (723
testy w repo) po naprawie.

------------------------------------------------------------------------

## M17 --- Causality (pełna integracja)

**UI Foundation Track (v0.2):** równolegle z finalizacją Causality
powstaje biblioteka `FCCausalGraph`, `FCCausalNode`, `FCCausalLink`,
`FCFactor`, `FCFactorList`, `FCCausalTimeline`, `FCArchitectCause`.
Komponenty konsumują Causality Read Models; nie rekonstruują grafu z
surowych factów po stronie Reacta.

**Faza:** F --- Causal World · **Priorytet:** P0 · **Złożoność:** L ·
**Ryzyko:** HIGH · **Documentation Readiness:** READY

**Cel:** wszystkie systemy z M5--M16 są w pełni zintegrowane z Causality
Engine --- każda znacząca mutacja tworzy `SimulationFact` z poprawnymi
`CausalEdge`, multi-causality i negative/limiting factors są
rejestrowane, Architect Influence propaguje po realnych krawędziach.

**Zależności:** M16. *(Fact infrastructure --- `CE-01`/`CE-02` --- już
istnieje od M5 jako cross-cutting; ten milestone domyka integrację ze
**wszystkimi** systemami naraz.)*

**Implementowane systemy:** pełny Causal Graph, Decision Facts +
DecisionSnapshot (już częściowo z M11), Historical/Architect Influence
Propagation, Natural Decay, Hierarchical Causal Memory
(HOT/WARM/PERMANENT), pruning z zachowaniem anchors.

**Moduły (`CE-03`...`CE-09`, `CE-11`, `CE-12` z Causality Engine
§101):**

``` text
CE-03 Edges -- creation, validation, incoming/outgoing indices
CE-04 Economy Integration -- market, production, company, labor
CE-05 Population Integration -- needs, migration, settlement
CE-06 Technology Integration -- discovery, availability, adoption
CE-07 Architect -- root facts, influence propagation
CE-09 Memory -- aggregation, pruning, permanent anchors
CE-11 Experiment Support -- divergence metadata
CE-12 Tests -- Black Mountain, resource bust, migration, technology,
  determinism, pruning
```

*(`CE-01`/`CE-02` Fact Infrastructure i Causal Context już istnieją z
M5; `CE-08` WHY? przenosi się do M18; `CE-10` Chronicle handoff przenosi
się do M19.)*

**Dane:** brak nowego contentu.

**Testy:** no false causality test, multi-causality test, negative cause
test, pruning integrity test, HOT/WARM/PERMANENT memory test, influence
decay test, independent cause dilution test, save/load causal integrity.

**Acceptance Gate (Causality Engine §102--103):** każdy fact-producing
system identyfikuje zmianę, zna wejściowe czynniki, przekazuje
contribution, emituje SimulationFact, tworzy sensowne edges, rozróżnia
positive/negative factors, nie tworzy korelacyjnych edges; Architect
Influence poprawnie zanika i rozcieńcza się przy niezależnych
przyczynach.

**Ryzyka:** **HIGH** --- integracja wsteczna z 12 wcześniejszymi
milestone'ami jest z definicji ryzykowna; mitygacja: `IMPL-012` wymagał,
by każdy milestone od M5 **już** przewidywał punkty emisji faktów, więc
M17 głównie **domyka i weryfikuje** istniejące hooki, zamiast doszywać
je retrospektywnie od zera.

**Poza zakresem:** WHY? UI/API (M18), Chronicle integration (M19), pełna
Experiment Branching (post-VS, `SAVE-011` TARGET).

**Źródła:** `FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` (całość,
zwłaszcza §1--60, §101--104), `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(CAUS-001--010).

### M17 --- Wyniki wykonania (2026-09-20)

**Status: DONE.**

**Fundament (`packages/causality/src/`):** `causal-edge.ts`
(`CausalEdge`/`CausalEdgeType`/`CausalFactor`), `causal-edge-store.ts`
(`CausalEdgeStore` -- indeksy incoming/outgoing, CE-03),
`causal-strength.ts` (progi PRIMARY/SIGNIFICANT/MINOR/TRACE z
contribution factorów), `architect-influence-propagation.ts`
(`computeChildInfluence`/ `combineInfluences` -- decay + dilution przy
niezależnych przyczynach, CE-07), `causal-memory.ts` (klasyfikacja
HOT/WARM/PERMANENT, `isAnchor`), `causal-pruning.ts`
(`pruneCausalMemory` -- backward reachability od anchors, CAUS-010,
CE-09) -- każdy moduł z własnymi testami jednostkowymi.

**Plumbing (`packages/simulation/src/core/`):** `causal-links.ts`
(`PendingCausalLink`, `offsetCausalLinks`, `directionalEdgeType`),
`causal-resolution.ts` (`resolveTickCausality` -- zamienia
`PendingCausalLink[]` zebrane w trakcie ticku na realne `CausalEdge` w
`CausalEdgeStore` i propaguje Architect Influence po realnym grafie).
`economy-tick.ts` dostał nowe pole wyniku `causalLinks` i nowy input
`priorFactIndex?: Record<string, string>` (klucz
`"${entityType}:${entityId}:${type}"` -- **musi** zawierać `type`, bo
bez niego "najnowszy fakt tej encji" po cichu podmienia się na
niezwiązany fakt tej samej encji przy resolutcji edge'y wstecznych).
`world-runner.ts` utrzymuje teraz
`causalEdgeStore`/`architectInfluenceByFactId`/
`factsById`/`latestFactIdByEntityAndType` między tickami i dostał nową
metodę `applyIntervention()` -- most między Architect (M16) a tym samym
grafem przyczynowym, którym przechodzi `step()`; opcjonalny
`causalPruneIntervalTicks` istnieje i jest przetestowany, ale wyłączony
domyślnie (`undefined`) -- częstotliwość pruningu to TODO tuning, brak
benchmarków na razie.

**Integracja przez wszystkie 11 grup systemów (CE-04--CE-07):**
Market/Price, Production + bottleneck, Labor, Company AI decisions
(naprawiony most `DecisionSnapshot.causalContext.factors`, dotąd
odrzucany), Population, Migration (refaktor
`computeMigrationAttractionBreakdown` na multi-factor breakdown),
Settlement (refaktor `computeSettlementPressureBreakdown`), Resources,
Technology (pełny łańcuch knowledge → eligible → occurred →
available/diffused → adoption), Architect (Root Fact +
`WorldRunner. applyIntervention` most), Trade. Każda grupa zweryfikowana
`pnpm build:packages` + `pnpm test` PASS przed przejściem do kolejnej --
zero regresji przez cały rollout. Nie każdy z \~27 typów faktów ma
bogaty multi-factor breakdown -- część (np. `housing_pressure_started`,
`congestion_started`, demografia) ma jeden jasny czynnik
`STRUCTURAL`/`TRIGGERING`, świadomie (CAUS-003: nie wymyślamy
wieloprzyczynowości, której formuła nie ma).

**Testy (CE-12, Acceptance Gate):** 10/10 testów akceptacyjnych --
`packages/worldgen/src/fixtures/causality-acceptance.test.ts` (Testy 3,
4, 5, 6, 7, 9, 10), Test 1 w `price-adjustment.test.ts`, Test 2 w
`migration.test.ts`, Test 8 w `settlements.test.ts`. Testy 3 i 9
przeprojektowane w trakcie implementacji: Black Mountain nie ma contentu
konsumującego `iron_ore` wprost, a RNG-gated breakthrough discovery nie
da się przetestować deterministycznie bez ustawienia stanu z góry --
ostateczne testy startują discovery jako `KNOWN` i sprawdzają
deterministyczny, organiczny łańcuch availability→adoption zamiast
samego RNG rolla. `pnpm typecheck`/`lint`/`test`/`build`/`test:e2e`:
wszystkie PASS (767 testów w repo).

**Świadomie poza zakresem tej implementacji:**
`causalPruneIntervalTicks` zaimplementowany i przetestowany, ale żaden
istniejący caller go nie włącza -- częstotliwość to TODO tuning.
`priorFactIndex`/ `latestFactIdByEntityAndType` śledzi tylko NAJNOWSZY
fakt per (entityType, entityId, type), nie pełną historię -- wystarcza
dla dzisiejszych łańcuchów (Discovery→PM adoption,
resource_discovered→resource_access), ale rozszerzenie będzie potrzebne,
gdyby przyszły system musiał cytować starszy, nie najnowszy fakt tego
samego typu tej samej encji. CE-08 WHY? → M18, CE-10 Chronicle handoff →
M19, pełne Experiment Branching → post-VS (zgodnie z zakresem
zaplanowanym wyżej).

------------------------------------------------------------------------

## M18 --- WHY?

**UI Foundation Track (v0.2):** ten milestone dostarcza również pierwszy
funkcjonalny Golden UI `WHY? / Causal Explorer` na prawdziwych danych.
M21 nadal odpowiada za pełną integrację nawigacji, layoutu i pozostałych
ekranów. Każda znacząca zmiana musi mieć ścieżkę `Explain/WHY?`, choć
nie każda liczba wymaga widocznego przycisku.

**Faza:** F --- Causal World · **Priorytet:** P0 · **Złożoność:** M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** gracz może wskazać stan/wydarzenie i otrzymać 2--5 głównych
przyczyn jako structured query (nie generowany post-hoc esej); WHY NOT?
wyjaśnia, dlaczego oczekiwane wydarzenie nie nastąpiło; Butterfly Effect
pokazuje realnych causal descendants interwencji Architekta.

**Zależności:** M17.

**Implementowane systemy:** WHY? ranking i path traversal, WHY NOT?,
Butterfly Query + Ranking, Anti-Butterfly Explosion, Counterfactual WHY
(ograniczony).

**Moduły (`CE-08` z Causality Engine):**

``` text
CE-08 WHY? -- ranking, path traversal, explanation model
architect/butterfly -- query, ranking, anti-explosion
```

**Dane:** brak nowego contentu; WHY? zwraca structured data
(IDs/enums/payload), lokalizacja renderuje język (`CONTENT-014`).

**Testy:** WHY? immediate test, WHY? chain test, WHY NOT? test,
butterfly query test, WHY? noise test (brak szumu trywialnych przyczyn),
determinism (te same dane = te same przyczyny w tej samej kolejności).

**Acceptance Gate:** dla dowolnej istotnej zmiany w Black Mountain (np.
wzrost ceny żelaza) WHY? zwraca 2--5 głównych przyczyn z poprawną
siłą/confidence; dla interwencji Architekta Butterfly Query zwraca
realną listę downstream consequences, nie wszystkie possible events.

**Ryzyka:** średnie --- ryzyko nadmiaru szumu w wynikach przy gęstym
grafie przyczynowym (mitygacja: `WHY? Ranking`,
`Duplicate Path Suppression`, `Causal Query Limits` już zdefiniowane w
spec).

**Poza zakresem:** pełne UI (widoki WHY?/Butterfly to `M21`), Chronicle
(M19).

**Źródła:** `FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` (§29--43,
§70--79), `FIRST-CAUSE-Architect-Intervention-Influence-Spec-v0.1.md`
(§46--53, §70--72), `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(CAUS-006--008).

**Checkpoint:** **CP3 --- Explainable World** i **CP5 --- Architect
Playable** (wraz z M16+M17) osiągnięte po tym milestone.

### M18 --- Wyniki wykonania (2026-09-20)

**Status: DONE.**

**CE-08 WHY? (`packages/causality/src/why-query.ts`):** `explainWhy` --
czysta funkcja nad już-istniejącym grafem (`CausalEdge[]`/
`SimulationFact[]`), zero nowego stanu/symulacji kontrfaktycznej (SS0).
Level 1 (Immediate): przyczyny dzielone na `primaryCauses`/
`significantCauses` (pozytywne, band z `causal-strength.ts`) i
`limitingFactors` (negatywne, CAUS-006) -- trywialne (TRACE-band)
pozytywne przyczyny są odrzucane wprost ("WHY? noise test"), a łączna
lista primary+significant jest ograniczona do 5
(`MAX_WHY_CAUSES_TODO_TUNING`, CAUS-006 "2--5 głównych przyczyn"). Level
2 (Chain): `deeperPaths`, jeden hop dalej od każdej pokazanej Level-1
przyczyny, z Duplicate Path Suppression (SS72 -- ścieżki dzielące ten
sam root+mechanism kolapsują do jednej, najsilniejszej). Level 3/4
(Historical/Architect) to "na żądanie" (CAUS-006) -- wywołujący po
prostu woła `explainWhy` ponownie z nowym `targetFactId`, zamiast tej
samej funkcji rekurencyjnie schodzącej w nieskończoność.
`architectConnections` zbiera bezpośrednie Root Facty (`fact.architect`)
napotkane w obliczonym oknie. `confidence` to świadomy uproszczony proxy
(średnia `strength` pokazanych przyczyn) -- SS15's pełny epistemiczny
model Confidence nie jest jeszcze nigdzie w tym kodzie liczony (ten sam
rodzaj odłożenia co `fact.ts`'s `significance`/`retention`).

**Butterfly Effect
(`packages/simulation/src/systems/architect/butterfly.ts`, moduł
`architect/butterfly`):** `queryButterflyEffect` +
`getInterventionConsequences` (SS47's dokładna nazwa) -- forward BFS od
`rootFactIds` interwencji w JEDNYM przebiegu po `facts` w kolejności
emisji (ten sam porządek, który `CausalEdgeStore` już wymusza), więc
wpływ każdego poprzednika jest finalny, zanim przetworzymy jego
krawędzie wychodzące. Liczy WŁASNĄ ścieżkę wpływu tej jednej interwencji
(reużywa `computeChildInfluence`/ `combineInfluences` z M17),
niezależnie od `WorldRunner.architectInfluence` (który scala WSZYSTKIE
interwencje naraz, SS39). Anti-Butterfly Explosion (SS49): decay per-hop
(`PersistenceModifier`), minimum contribution threshold (ścieżka poniżej
progu MINOR przestaje się propagować), significance threshold
(`EffectScore` poniżej TRACE odrzucany -- `isAnchor` jako TODO tuning
proxy Significance), twardy limit głębokości
(`MAX_BUTTERFLY_DEPTH_TODO_TUNING`), independent-cause dilution (SS50 --
wynika automatycznie z tego, że śledzimy tylko krawędzie osiągalne z
roota). Wynik: `directEffects` (depth 1) + `majorConsequences`/
`significantConsequences`/`minorConsequences` (SS41 ranking).

**WHY NOT?
(`packages/simulation/src/systems/economy/company-ai/why-not.ts`,
CAUS-007):** `explainWhyNot` -- czysta funkcja nad `DecisionSnapshot`
(nie nad grafem faktów, bo odrzucona decyzja nie tworzy faktu do
przeszukania). Wymagało jednej celowej, minimalnej zmiany w
`opportunity-scanner.ts`: `evaluateFounding` budował `DecisionSnapshot`
tylko na ścieżce `founded === true` -- ścieżka HOLD zwracała
`snapshot: undefined`, więc WHY NOT? nie miał z czego zbudować
odpowiedzi na SS33's własny przykład ("Dlaczego nie powstała kopalnia?
OpportunityScore 0.43, Required 0.60"). Teraz `snapshot` jest
BEZWARUNKOWY (typ `DecisionSnapshot`, nie `| undefined`) -- ten sam
kształt danych na obu ścieżkach, `selectedAction: "FOUND" | "HOLD"`.
`FOUNDING_ACTIVATE_SCORE` wyeksportowany jako "Required" threshold, z
którym caller porównuje `expectedActionScore`. Zero regresji -- żaden
istniejący test nie zakładał `snapshot === undefined` na ścieżce HOLD.

**Testy:** `why-query.test.ts` (6, syntetyczny kontrolowany graf --
Immediate/noise/Chain z Duplicate Path Suppression/architectConnections/
determinism/unknown-target), `butterfly.test.ts` (6, syntetyczny graf --
direct effects/decay/anti-explosion x2/`getInterventionConsequences`/
determinism), `why-not.test.ts` (2, realny `evaluateFounding` --
SS33-style przykład z realnym score gap i
`opportunity-scanner.test.ts`'s nowy test "rejected decision still
returns a real DecisionSnapshot"), `why-butterfly-acceptance.test.ts`
(2, `packages/worldgen` -- WHY? na realnym
grain_farm-\>watermill_milling łańcuchu z CE-12 Test 3/9, Butterfly na
realnej `reveal_resource_deposit` interwencji na Black Mountain z CE-12
Test 4, oba z assercją determinizmu).
`pnpm typecheck/lint/test/build/ test:e2e`: wszystkie PASS (784 testy w
repo).

**Świadomie poza zakresem tej implementacji:** pełne UI WHY?/Butterfly
(widoki -- M21, roadmapa's własne "Poza zakresem"), Chronicle
integration (M19), Experiment Mode/Divergence Point (SS77--79 --
post-VS, ten sam zakres co M17's "pełne Experiment Branching"), pełny
epistemiczny model Confidence (SS15) i Recency/DurationModifier (SS41)
-- oba zwinięte w uproszczone proxy (strength/hop-decay), udokumentowane
wprost jako TODO tuning w kodzie, nie ostateczny model balansu.

------------------------------------------------------------------------

## M19 --- Chronicle

**UI Foundation Track (v0.2):** powstają `FCChronicleEntry`,
`FCSignificance`, `FCHistoricalThread`, `FCTurningPoint`,
`FCWorldTimeline` oraz funkcjonalny World Chronicle na prawdziwych
Chronicle Read Models. `Region History` pozostaje zakładką Region Detail
i nie jest osobnym World Chronicle.

**Faza:** G --- History · **Priorytet:** P0 · **Złożoność:** M/L ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** system wybiera i zapisuje historycznie istotne wydarzenia z
oceną Historical Significance (0--100), bez tworzenia własnej historii
--- Chronicle wybiera to, co stworzyła symulacja.

**Zależności:** M18.

**Implementowane systemy:** Chronicle Candidate Pipeline, Historical
Significance (Magnitude, Duration, PopulationAffected, GeographicScope,
Novelty, CausalImpact), Aggregation, sensitivity filters
(Concise/Standard/Detailed), Chronicle Entry storage,
Entity/Region/World Chronicle, template-first localization.

**Moduły (`CH-01`...`CH-07`, `CH-13`, `CH-14` z Chronicle Spec §207;
`CH-08`--`CH-12` jako P1 rozszerzenie w tym samym milestone, jeśli czas
pozwala, ale nie blokują):**

``` text
CH-01 Event Type Definitions
CH-02 Initial Significance
CH-03 Candidate Pipeline
CH-04 Aggregation
CH-05 Chronicle Entry storage
CH-06 Sensitivity filters
CH-07 Entity/Region Chronicle
CH-13 Localization/templates
CH-14 UI/API integration (dane dla M21, nie UI samo)

-- P1, nie blokuje VS (Master Audit §67):
CH-08 Historical Threads
CH-09 Retrospective Significance
CH-10 Turning Points
CH-11 Architect Legacy
CH-12 Historical compression
```

**Dane:** Chronicle Templates (EN/PL) dla VS event types.

**Testy:** source integrity test (brak fabrykacji), no false aggregation
test, sensitivity test, localization test, determinism test, Black
Mountain chronicle test.

**Acceptance Gate (Chronicle Spec §208):** każdy candidate ma score
wynikający z danych; lokalny kontekst jest uwzględniony; novelty i
causal impact działają; Black Mountain generuje spójną, zrozumiałą
kronikę bez wymuszonego dramatyzmu.

**Ryzyka:** średnie --- ryzyko „spamu" nieistotnych wpisów lub odwrotnie
ciszy tam, gdzie powinno być wydarzenie (mitygacja: `Spam Detection`,
`Silence Detection`, `Category Balance` już zdefiniowane w spec;
„silence is valid" jest jawnie dopuszczalnym stanem --- `CHRON-005`).

**Poza zakresem:** Historical Threads/Retrospective Significance/Turning
Points jako pełne P0 (P1, mogą wejść później bez blokowania VS Freeze),
Era Detection (TARGET, nie VS).

**Źródła:** `FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md`
(całość, zwłaszcza §1--30, §150--159, §207--210),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (CHRON-001--007).

**Checkpoint:** **CP4 --- Historical World** osiągnięty po tym
milestone.

### M19 --- Wyniki wykonania (2026-09-20)

**Status: DONE (P0 -- CH-01...CH-07, CH-13, CH-14).**

**Nowy pakiet `packages/chronicle`** (wzorzec 1:1 z
`packages/causality`: moduł-na-plik, `X_TODO_TUNING` stałe, czyste
funkcje nad już-istniejącymi danymi). Zależy tylko od
`@first-cause/causality` (typy faktu/edge) i `@first-cause/content`
(rejestry `EventTypeDefinition`/ `ChronicleTemplateDefinition`) --
świadomie BEZ `@first-cause/entities`, żeby `significance.ts` pozostał
czystą funkcją testowalną bez uruchomionej symulacji (kontekst względnej
wielkości/populacji wchodzi przez opcjonalny hook `ChronicleContext`,
wypełniany przez wywołującego).

**CH-01/CH-13 (`packages/content`):** `event-type-definition.ts` i
`chronicle-template-definition.ts` (istniejące od M2 jako placeholdery)
dostały realne pola ze spec SS126 (`baseSignificance`,
`candidateThreshold`, `aggregationPolicy`, `noveltyPolicy`,
`durationPolicy`, `anchorPolicy`) oraz zamknięty enum 15 kategorii
Chronicle (SS21). 15 typów zdarzeń VS (SS151) + 15 szablonów + klucze
EN/PL w `locales/*/common.json` w `content/eventTypes/`,
`content/chronicleTemplates/`.

**CH-02 Initial Significance (`significance.ts`):** ważony model SS189
(`S = wM*M + ... + wX*X`, NIE czyste mnożenie -- SS190), znormalizowane
składniki 0..1, baseline (SS23) jako mały stały udział, progi kategorii
Trace/.../World-Defining jako
`SIGNIFICANCE_CATEGORY_THRESHOLDS_TODO_TUNING`.

**CH-03 Candidate Pipeline (`candidate-pipeline.ts`):** wszystkie
**15/15 event types VS mają pełny detektor end-to-end** (stan po
follow-upach tego samego dnia, patrz `CHANGELOG.md`) na realnych typach
faktów już emitowanych przez `packages/simulation`:
`resource_discovered`, `company_founded`, `company_major_expansion` \<-
`company_expanded`, `company_closed`, `settlement_stage_changed`,
`discovery_occurred`, `shortage_started`, `shortage_resolved` (przez
`ActiveProcessRegistry` silence-detection, SS33),
`resource_depletion_milestone` (nowy fakt `resource_reserve_milestone` z
`extraction.ts`, przekroczenie 75/50/25/10% rezerw),
`technology_adoption_wave` (1:1 + CH-04 aggregation po `discoveryId`),
`migration_wave` (`ActiveProcessRegistry.accumulatedMagnitude`,
znormalizowane przez `region.population.totalPopulation`),
`intervention_major_consequence` (nowy `intervention-legacy.ts`, reużywa
`queryButterflyEffect`/M18 zamiast własnej logiki grafowej, okresowy
`WorldRunner. maybeRunInterventionLegacy`, domyślnie wyłączony),
`trade_route_emerged` (nowy fakt `trade_flow_active` z
`economy-tick.ts`, akumulator ze STABILNYM `aggregationKey` bez
komponentu okna -- szlak handlowy to jeden trwały wpis aktualizowany w
miejscu, nie seria epizodów), `regional_boom`/`regional_bust`
(najbardziej niepewny kalibracyjnie z całej piętnastki -- kompozytowy
"regional pulse" sumujący znormalizowane delty
`employment_changed`/`population_migrated_in`/`_out`/
`production_utilization_changed` per region per tick; znak skumulowanej
sumy przy rozwiązaniu procesu decyduje boom vs. bust; KAŻDA stała wagowa
jawnie `_TODO_TUNING`, brak Significance Calibration Dataset SS191 -- to
jedyny detektor bez jakiejkolwiek walidacji na realnych danych
symulacji). `causalImpact` dla fact-driven detektorów liczony jako
bounded 1-hop suma `|contribution|` wychodzących krawędzi (SS115/117
anti-explosion), nie pełny propagation graph -- to CH-09 (P1).

**CH-04 Aggregation (`aggregation.ts`) + CH-05 Entry Storage
(`chronicle-entry-store.ts`):** within-batch grouping po
`aggregationKey` (już koduje event type + scope + window, SS26) w
`aggregation.ts`; cross-tick "Update Existing Entry" (SS64) w
`ChronicleEntryStore.upsert` przez lookup po tym samym kluczu. "Zakaz
fałszywej agregacji" (SS30) jest strukturalny -- nigdy osobny check.

**Historical Anchor (`historical-anchor.ts`):**
`shouldBeHistoricalAnchor` łączy content-driven
`anchorPolicy.alwaysAnchor` z dynamicznymi regułami (Historic+/Turning
Point/silny wpływ Architekta). Integracja z `@first-cause/causality`:
`pruneCausalMemory` (`causal-pruning.ts`) dostał nowe opcjonalne pole
`extraMustKeepFactIds` (Causality zostaje nieświadomy Chronicle --
adapter żyje w `WorldRunner`), świadomie NIE złączone z
`architectInfluenceByFactId` (zepsułoby `why-query.ts`'s
`architectConnections`).

**CH-06 Sensitivity (`sensitivity.ts`) + CH-07/CH-14 API
(`chronicle-api.ts`):** Concise/Standard/Detailed progi;
`getEntityHistory` celowo POMIJA sensitivity -- to jest realny mechanizm
SS60 "Contextual Promotion", nie osobny `contextualImportance` score
(ten komponent zostaje `0` w P0, udokumentowane wprost w
`significance.ts`).
`getTopEvents`/`getHistoricalThread`/`getTurningPoints`/
`getArchitectLegacy` (SS205) świadomie nieobecne -- potrzebują
CH-08/10/11.

**Integracja z `WorldRunner`
(`packages/simulation/src/core/world-runner.ts`):** nowy krok
`runChronicle` między `resolveCausality` a `maybePruneCausalMemory`
(SS123-124), wołany zarówno z `step()` (zwykłe fakty), jak i z
`applyIntervention()` (Root Fact interwencji Architekta -- inaczej
ominąłby Chronicle całkowicie). Cała konfiguracja opcjonalna
(`chronicleEventTypes`/`chronicleTemplates`/undefined = zero zmiany
zachowania, ten sam kontrakt co `causalPruneIntervalTicks`).
`dataPayload` zostaje `{}` na tym poziomie -- realne nazwy encji
(`settlementName` itp.) wymagają lookupów `WorldState`, które
`WorldRunner` celowo nie robi tu per-typ (byłby to dokładnie zakazany
hardcode w generycznym silniku); to zadanie warstwy prezentacji (M21).

**Testy:** 48 testów w `packages/chronicle` (jednostkowe per moduł +
`pipeline.integration.test.ts` na realnym contencie z dysku: source
integrity, no forced drama, determinizm, historical anchor przeżywa
pruning mimo że `causality`'s własny `isAnchor()` by tego nie ochronił,
mini-scenariusz w stylu Black Mountain). Nowy test w
`causal-pruning.test.ts` dla `extraMustKeepFactIds`. Nowy
`world-runner.chronicle.test.ts` (3 testy) dowodzi realnego podłączenia
w `WorldRunner` (`step()` i `applyIntervention()`, przeżycie pruningu po
130 tickach). `pnpm typecheck/lint/test/build`: wszystkie PASS (836
testów w repo).

**Świadomie poza zakresem tej implementacji:** CH-08 Historical Threads,
CH-09 Retrospective Significance, CH-10 Turning Points, CH-12 Historical
Compression (P1, roadmapa's własne "nie blokują VS"); CH-11 Architect
Legacy jest częściowo wdrożone (patrz follow-up tego samego dnia niżej
-- `intervention_major_consequence` działa, ale pełna retrospektywna
"legacy po dekadach" pozostaje uproszczona do okresowego re-checku, nie
prawdziwej historycznej narracji). Era Detection (TARGET), Generated
Narrative/LLM layer (SS70-72 -- template-first wystarcza), UI Chronicle
(`FCChronicleEntry` itd. -- M21).

------------------------------------------------------------------------

## M20 --- Save/Load (pełna integracja)

**UI integration (v0.2):** jeżeli `Save/Determinism/Performance Spec`
dopuszcza zapis presentation state, save/load zachowuje go w osobnej
warstwie (np. selected region, overlay, viewport/zoom, filtry), bez
mieszania go z canonical World State. Brak wsparcia w specyfikacji nie
może być uzupełniany lokalnym formatem zapisu bez decyzji
dokumentacyjnej.

**Faza:** L --- Save & Long-Run (cross-cutting) · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM-HIGH · **Documentation
Readiness:** READY

**Cel:** save/load obejmuje **cały** World State ze wszystkich
milestone'ów M0--M19, z pełnymi wersjami, migracjami i kompaktacją
historii przyczynowej --- podstawowy roundtrip istniał od M3, tu
następuje pełna integracja i certyfikacja.

**Zależności:** M19 (musi obejmować Chronicle/Causality state, nie tylko
World State).

**Implementowane systemy:** SaveGame envelope
(`schemaVersion/contentVersion/engineVersion/generatorVersion/ worldSeed/tick/rngState/worldState/architectState/causalState/ chronicleState/metadata/checksum`),
atomic save, save migrations (`vN → vN+1`), HOT/WARM/PERMANENT
compaction, layer checksums.

**Moduły (`packages/persistence`):**

``` text
persistence/envelope
persistence/atomic-write -- serialize→validate→temp→flush→rename
persistence/migrations
persistence/compaction -- causal history HOT/WARM/PERMANENT
persistence/checksum -- world + layer checksums
```

**Dane:** brak nowego contentu.

**Testy:** save roundtrip (pełny World State), migration roundtrip,
determinism test suite (save/load, speed independence ×1=×100, container
order, RNG isolation), causal save integrity, HOT/WARM/ PERMANENT memory
test.

**Acceptance Gate:** zapisany i wczytany świat ma identyczny checksum;
×1 i ×100 po tej samej liczbie ticków dają identyczny stan; uszkodzony
zapis nie nadpisuje ostatniego poprawnego pliku; migracja `v1→v2` (jeśli
wystąpi w trakcie developmentu) jest deterministyczna.

**Ryzyka:** największe ryzyko rozmiaru save to historia przyczynowa, nie
same regiony (`PERF-007`) --- mitygacja: compaction jest częścią
architektury od tego milestone'u, nie dodatkiem post-hoc.

**Poza zakresem:** Experiment Branching pełne (TARGET/wczesny MVP),
cloud saves (post-Steamworks), binary serialization (dopiero po
benchmarkach, jeśli JSON+gzip nie wystarcza).

**Źródła:** `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
(§31--99, §200--213), `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(SAVE-001--011).

### M20 --- Wyniki wykonania (2026-09-20)

**Status: DONE.**

**Kluczowe odkrycie:** "podstawowy roundtrip istniał od M3" (ten
dokument) to `HeadlessRunner.getState()/fromState()` (M1) i
`WorldRng.getState()` -- działają od dawna. Realna luka M20 to
`WorldRunner` (M17+): kompozyt
`HeadlessRunner + WorldState + FactStore + CausalEdgeStore + architectInfluenceByFactId + 4 rejestry Chronicle`
nie miał wcześniej ŻADNEGO `getState()`/`fromState()` -- ani sam, ani
jego części składowe. `WorldRunner` nadal nie jest podłączony do
`apps/desktop` (to M21) -- M20 jest czysto logiką backendową.

**1. `packages/causality`/`packages/chronicle` -- brakujące
`getState()`/`fromState()`:** `FactStore`/`CausalEdgeStore`
(`{items, nextSequence}`, bezpośrednie przywrócenie, nie replay przez
`.emit()`/`.add()` -- `nextSequence` musi być jawnie zachowany, żeby
kolejne wywołania nie kolidowały z przywróconymi id) oraz
`NoveltyRegistry`/`MilestoneRegistry`/`ActiveProcessRegistry`/
`ChronicleEntryStore` (SS200 Persistence Counters --
`ActiveProcess. accumulatedMagnitude`/`lastSignalTick` to dokładnie ten
rodzaj stanu, który save musi przechowywać, nie da się go tanio
odbudować bez replayu całej historii Chronicle od ticka 0).

**2. `WorldRunner.getState()/static fromState()`
(`packages/simulation`):** kompozytowa metoda wzorem `HeadlessRunner`.
`latestFactIdByEntityAndType` świadomie NIE jest zapisywane (Derived
State, SAVE-009) -- `fromState` odtwarza je tą samą pętlą co
`recordFacts()` nad przywróconym `factStore.all()`. `config` (rejestry
event types itp.) to Definition Data (DATA-001), podawane na nowo przez
wywołującego (`WorldRunnerRestoreConfig`), nie część zapisu. Pola
`headless`/`factStore`/`causalEdgeStore`/4 rejestry Chronicle przestały
być `readonly`, żeby `fromState` mogło podmienić świeżo skonstruowaną
instancję na właściwie przywróconą (ten sam powód, dla którego
`HeadlessRunner`'s własne `clock`/`rng`/`commandBoundary` nigdy nie były
`readonly`).

**3. Nowy pakiet `packages/persistence`** (wzorzec
`packages/chronicle`): - `envelope.ts` -- `SaveGame` (SS32), świadomie
SKONSOLIDOWANY: `rngState`/`architectState`/`historicalState` (SS32's
"rekomendowany model") żyją razem wewnątrz
`worldState: WorldRunnerState` zamiast jako 4 osobne pola-duplikaty tego
samego `WorldRunner.getState()` -- SS58 Canonical State samo już
traktuje RNG i history anchors jako część tego samego kanonicznego stanu
co encje. `worldConfiguration` pominięte z tego samego powodu (już
wewnątrz `worldState.headless`). - `checksum.ts` -- World Checksum
(reużycie `computeChecksum` z `@first-cause/simulation`, bez
`metadata.createdAt/savedAt`, SS87) + Layer Checksums
(population/economy/technology/causality/architect, SS88, plus
`chronicle` -- M19 wprowadziło realną, niezależną warstwę historii wartą
osobnego trackowania). - `compaction.ts` -- cienki wrapper na
już-istniejący `pruneCausalMemory` + `collectHistoricalAnchorFactIds`
(ten sam most SS135, który `WorldRunner.maybePruneCausalMemory` już
ustanowił) -- kompaktacja HISTORII CHRONICLE (CH-12) świadomie NIE jest
tu robiona, bo CH-12 nie istnieje (P1). - `migrations.ts` -- pełny
framework (Version Compatibility Matrix SS39, pipeline SS41, Migration
Log SS43, SAVE-008 determinizm) z pustą tabelą `MIGRATIONS` --
`SCHEMA_VERSION` nigdy się nie zmieniło od M3, więc nie ma jeszcze czego
migrować; mechanizm dowiedziony identity-migration testem. -
`atomic-write.ts` -- `.tmp` → `fsync` → `.bak` poprzedniego pliku →
atomic rename (SS47-49); `readSaveFile` rekalkuluje checksumę zamiast
ufać zapisanej wartości. - `save-load.ts` -- `saveGame()`/`loadGame()`,
kompaktacja domyślnie włączona przy save (SS72/PERF-007: historia to
dominujące ryzyko rozmiaru, nie coś opt-in).

**Testy (68 nowych w całym repo):** roundtrip per warstwa (causality, 4
rejestry chronicle), `WorldRunner` roundtrip przez realną checksumę (nie
tylko `toEqual`), **Save/Load Determinism Test dokładnie wg SS84**
(seed, N ticków, save, kontynuacja do M, checksum A; load, kontynuacja
do M, checksum B; `A === B`) -- główny Acceptance Gate, przechodzi.
Container Order Test (SS206), speed independence SAVE-005
(`runTicks(100)` vs. 100×`step()`), atomic write corruption protection
(przerwany zapis -- porzucony `.tmp` -- nigdy nie psuje ostatniego
dobrego pliku; zmanipulowana zawartość bez przeliczonej checksumy jest
wykrywana), `.bak` przy nadpisaniu.
`pnpm typecheck/lint/test/build/ test:e2e`: wszystkie PASS (892 testy w
repo + 1 e2e).

**Świadomie poza zakresem:** Electron IPC / UI zapisu-wczytywania (M21
-- `WorldRunner` nadal niepodłączony do `apps/desktop`), kompaktacja
historii Chronicle (CH-12, P1), binary serialization (decyzja dopiero po
benchmarkach), Experiment Branching (TARGET), autosave
scheduling/rotation jako polityka UX (prymityw `saveGame` gotowy,
harmonogram to decyzja UI/M21), realna migracja `v1→v2` (nie ma jeszcze
czego migrować -- zgodnie z warunkowym "jeśli wystąpi" tego dokumentu).

------------------------------------------------------------------------

## M21 --- UI Vertical Slice

**Faza:** J --- Player Experience · **Priorytet:** P0 · **Złożoność:** L
· **Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** pełny, spójny UI Vertical Slice na stabilnych Read Models ---
World Command Center, Living Atlas, Region Detail, Economy/Market/
Company, Technology, WHY?, Chronicle, Architect Panel, Butterfly Effect
--- zbudowany na tym, co realnie istnieje w silniku (surowy UI debug
shell mógł istnieć od M3 równolegle, ale to tutaj powstaje docelowy
interfejs gracza).

**Zależności:** M20 (musi renderować stabilne, zapisane read models, nie
tylko live state).

**Implementowane systemy:** wszystkie 12 minimalnych ekranów VS
(`VS-004`), main UX loop
(`OBSERVE → NOTICE CHANGE → ASK WHY? → INTERVENE → RUN TIME → REVIEW CONSEQUENCES`).

**Stan wejściowy M21:** UI-01/UI-02 oraz część komponentów UI-05--UI-10
mają już istnieć z Parallel UI Foundation Track. W M21 są audytowane,
uzupełniane i integrowane, a nie bezwarunkowo przepisywane.

### M21 Visual Production Track --- 2026-09-21

Warstwa wizualna M21 jest realizowana iteracyjnie i **przed** finalnym
zamknięciem poszczególnych ekranów. Codex/Claude Code implementują
zatwierdzony język wizualny; nie projektują go od nowa.

Kolejność produkcyjna:

``` text
VP-01  Golden UI #1 — World Command Center 1920×1080
VP-02  Golden UI #2 — Living Atlas / canonical atlas states
VP-03  Golden UI #3 — Region Detail
VP-04  Region Vignette Style Anchor Set (8 modułów)
VP-05  Implementacja WCC + Atlas + Region Detail
VP-06  Screenshot / Visual Conformance Audit
VP-07  Pełna Region Vignette Library (docelowo ok. 29 modułów)
VP-08  Golden UI — WHY? / Chronicle / Architect
VP-09  Implementacja pozostałych ekranów M21
VP-10  Full M21 UI Conformance Audit
```

**Reguła akceptacji Golden UI:** każdy ekran referencyjny musi zostać
jawnie zatwierdzony przez właściciela projektu przed użyciem jako
wzorzec implementacyjny. Golden UI nie nadpisuje tekstowych reguł
`UI Visual Design System v1.0`; w razie konfliktu obowiązuje dokument.

**Reguła assetów:** grafiki mogą być przygotowywane z pomocą generatora
obrazów AI, ale każdy moduł Region Vignette musi zostać jawnie
zatwierdzony przed dodaniem do biblioteki. Asset nie może sugerować
obiektu lub funkcji, których nie ma w danych symulacji
(`NO DECORATION WITHOUT INFORMATION`).

**Style Anchor Gate:** przed produkcją całej biblioteki Region Vignette
należy zatwierdzić reprezentatywny zestaw 8 modułów: `plains`,
`mountains`, `dense_forest`, `village`, `city`, `road`, `mine`,
`factory`. Zestaw zamraża perspektywę, stroke, poziom detalu, proporcje
i sposób użycia kanonicznej palety.

**Kolejność ekranów M21:** pierwsza fala implementacyjna to
`World Command Center → Living Atlas → Region Detail`; dopiero po ich
wspólnym Visual Conformance Audit przechodzimy do WHY?, Chronicle,
Architect i pozostałych ekranów.

**Moduły (`UI-01`...`UI-14`, zsynchronizowane z UI Implementation Spec
v1.0):**

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
UI-13 Performance/large-world pass (32 regiony -- pełna skala w M24/M26)
UI-14 UX testing and iteration
```

**Dane:** brak nowego contentu domenowego; ikonografia/design tokens.

**Testy:** React Testing Library dla komponentów i read model rendering;
Playwright E2E
(`start gry → new world → run simulation → save → load → WHY? → Architect intervention → nawigacja`);
UX testy jakościowe z Simulation Test Spec §198--206 (World Awareness,
Region Understanding, WHY?, Intervention, Chronicle, Butterfly).

**Acceptance Gate (UI/UX Spec §212--217, per ekran):** Command Center
pokazuje stan świata bez wymogu klasycznej mapy; Living Atlas nawiguje
po 32 regionach z overlayami; WHY?/Chronicle/Architect działają
end-to-end na prawdziwych danych z Black Mountain.

**Ryzyka:** średnie --- duża powierzchnia UI (12 ekranów); mitygacja:
kolejność `UI-01`...`UI-14` jest już ustalona i priorytetyzuje Command
Center/Atlas/Region przed Butterfly/polish.

**Poza zakresem:** pełna 3000-regionowa wirtualizacja (M26), pełny
Design System jako osobny dokument (`Master Audit` §240 --- nie jest
blockerem).

**Źródła:** `FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1.md`
(całość, zwłaszcza §1--50, §180--221),
`FIRST-CAUSE-Canonical- Decisions-v0.1.md` (UI-001--013),
`FIRST-CAUSE-Vertical-Slice-Spec- v0.1.md` (§41--45),
`FIRST-CAUSE-UI-Visual-Design-System-v1.4.md`,
`FIRST-CAUSE-UI-Implementation-Spec-v1.4.md`,
`FIRST-CAUSE-Golden-UI-World-Command-Center-v1.3.md` (kompozycja
World: §26),
`FIRST-CAUSE-Living-Atlas-Visual-Asset-Spec-v1.3.md`.

------------------------------------------------------------------------

## M22 --- World Generation (proceduralny)

**Faza:** I --- World Generation · **Priorytet:** P0 · **Złożoność:** L
· **Ryzyko:** HIGH · **Documentation Readiness:** READY

**Cel:** proceduralny generator tworzy 32-regionowy Reference VS z
dowolnego seeda, deterministycznie, przy użyciu tych samych evaluatorów
co runtime (nie osobnej logiki „balansowania" świata).

**Zależności:** M21. *(Silnik i wszystkie evaluatory --- production
viability, PM eligibility, settlement placement --- muszą być stabilne,
bo generator ich używa --- World Generation Spec §25.)*

**UI/Visual dependency (v0.2):** po utworzeniu kanonicznego Tick 0
generator dostarcza dane, z których deterministycznie wyprowadzany jest
`RegionVisualProfile`. VisualProfile nie jest osobną losową dekoracją:
`visual truth = simulation truth`.

**Implementowane systemy:** pełny 31-etapowy Generation Pipeline (config
→ seed/RNG → World → continents → topology → terrain → climate → water →
fertility → connections → EffectiveDistance → deposits → habitability →
population → cohorts → settlements → cultures → knowledge →
infrastructure → companies → inventories → services/ housing →
markets/prices → indexes → invariants → viability → deterministic repair
→ checksum → freeze Tick 0), GenerationReport, deterministic repair,
World Quality Metrics, Validation Gates `WG-A`...`WG-K`.

**Moduły (`packages/worldgen`):**

``` text
worldgen/config, worldgen/rng, worldgen/topology, worldgen/geography,
worldgen/climate, worldgen/water, worldgen/resources,
worldgen/habitability, worldgen/population, worldgen/settlements,
worldgen/culture, worldgen/knowledge, worldgen/infrastructure,
worldgen/economy, worldgen/markets, worldgen/validation,
worldgen/repair, worldgen/report, worldgen/checksum
```

**Dane:** `WorldGenerationConfig` dla presetu `vertical_slice_reference`
(32 regiony, 1 kontynent, \~200 populacji --- World Generation Spec
§34). Najpierw prototyp 8--12 regionów (§64), potem pełny 32-regionowy
VS.

**Testy:** unit/stage/invariant/property-based/seed-sweep/scenario/
determinism/performance testy z §51; layer checksums (topology,
geography, resources, population, settlements, knowledge,
infrastructure, economy, full world); Black Mountain generator test
(§53): hidden Iron Ore istnieje, mine nie jest wymuszone, route do rynku
istnieje.

**Acceptance Gate (World Generation Spec §67, VS-scoped):** ten sam seed
daje ten sam świat; powstaje 32-regionowy graf zróżnicowany
geograficznie/surowcowo; hidden deposits istnieją przed discovery;
population/cohorts/settlements/kultury są spójne; GenerationReport i
checksum działają; Tick 1 startuje bez ukrytej korekty; Black Mountain
generuje się bez specjalnej logiki; można uruchomić test 200-letni.

**Ryzyka:** **HIGH** --- generator musi współdzielić evaluatory z całym
silnikiem (12+ wcześniejszych milestone'ów) bez tworzenia drugiej,
sprzecznej definicji „viable"; mitygacja: `World Generation Spec §25`
explicite tego wymaga, a seed-sweep testy (setki/tysiące seedów)
wykrywają pathological cases przed uznaniem generatora za gotowy.

**Poza zakresem:** multi-continent, Small/Standard/Large/Huge presety
(M29, post-VS), realistic Earth/history presets (DEFERRED).

**Źródła:** `FIRST-CAUSE-World-Generation-Spec-v0.1.md` (całość),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (WORLD-005--006).

**Checkpoint:** **CP6 --- Procedural World** osiągnięty po tym
milestone.

------------------------------------------------------------------------

## M23 --- Black Mountain 200 Years

**Faza:** M --- Vertical Slice Completion · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** HIGH · **Documentation Readiness:** READY

**Cel:** pierwszy pełny integracyjny gate --- 2400 miesięcznych ticków
(200 lat) na Black Mountain (fixture z M4 **oraz** proceduralnie
wygenerowany odpowiednik z M22), bez naruszenia invariants, z sensownym,
nie wymuszonym wynikiem.

**Zależności:** M22.

**Implementowane systemy:** brak nowych systemów --- integracja i tuning
wszystkich poprzednich (`AI-12 Black Mountain tuning` z AI Decision
Model wraca tutaj).

**UI Soak Gate (v0.2):** 200-letni przebieg jest równocześnie testem
Living Atlas evolution, Region Vignette evolution, Important Now, World
Economy, WHY? chains, Chronicle oraz konsekwencji interwencji
Architecta. UI ma pozostać czytelne także podczas ×100 i długiego
przebiegu.

**Moduły:**

``` text
AI-12 Black Mountain tuning
tests/scenarios/black_mountain -- BM-01...BM-15 z Simulation Test Spec
```

**Dane:** brak nowego contentu; tuning parametrów configu (nie nowa
mechanika --- `IMPL-011`).

**Testy (Simulation Test Spec §100--116, BM-01...BM-15):** Discovery →
Mine Founding/No Mine → Employment → Wage Pressure → Migration →
Settlement Growth → Secondary Economy → Trade → Technology → Depletion →
Post-Depletion Transition → Causal Chain (WHY? wyjaśnia cały łańcuch) →
Architect Butterfly → No-Script Detection (brak
`if region == black_mountain` w generic modules).

**Acceptance Gate (`Canonical Decisions TEST-004/005`):** Black Mountain
kończy jako jeden z dopuszczalnych wyników
(`NO_DEVELOPMENT, RESOURCE_BOOM, INDUSTRIALIZATION, RESOURCE_BUST, DIVERSIFICATION, IMPORT_TRANSITION, TECHNOLOGICAL_EXTENSION, GHOST_SETTLEMENT`)
wynikający z danych i mechaniki; 2400 ticków przechodzi bez naruszenia
invariants; WHY? potrafi wyjaśnić cały łańcuch przyczynowy; Chronicle
wybiera istotne wydarzenia z tego przebiegu.

**Ryzyka:** **HIGH** --- to pierwszy test, w którym wszystkie systemy
działają jednocześnie przez długi czas; najbardziej prawdopodobne
miejsce ujawnienia emergentnych błędów/oscylacji nagromadzonych z
poprzednich milestone'ów. Mitygacja: to świadomy, wydzielony gate (§137
Master Audit: „nie wdrażać całej gry moduł po module bez pionowego
testu" --- tu następuje pełny pionowy test).

**Poza zakresem:** 500/1000-letnie testy (M27, post-VS), inne
scenariusze referencyjne (Food Valley itd. --- mogą być uruchamiane
równolegle jako dodatkowe sanity, ale nie blokują tego gate'u).

**Źródła:** `FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§100--116,
§219--220), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (TEST-002--005).

------------------------------------------------------------------------

## M24 --- Performance & Tuning

**Faza:** M --- Vertical Slice Completion · **Priorytet:** P0 ·
**Złożoność:** M/L · **Ryzyko:** MEDIUM-HIGH · **Documentation
Readiness:** READY

**Cel:** Reference VS (32 regiony) spełnia baseline performance budget;
profiling ujawnia hot paths; poprawność i determinizm są już
potwierdzone (M23) --- teraz następuje optymalizacja, nie odwrotnie
(`PERF-006`).

**Zależności:** M23.

**Implementowane systemy:** brak nowych systemów gry --- profiling,
indexes/caches tuning, dirty flags, staggered reviews tam, gdzie
profiling wykaże potrzebę.

**UI Performance Gate (v0.2):** osobno profilowane są PixiJS Living
Atlas, clustering/semantic zoom, label budget, flow aggregation,
viewport culling, częstotliwość aktualizacji Read Models oraz React
rerenders. Przy ×100 UI agreguje/redukuje animacje zamiast próbować
wizualizować każdy tick.

**Moduły:**

``` text
benchmarks/ -- pnpm bench:sim, pnpm bench:worldgen (preset 32 jako
  baseline; 250-3000 to M26)
profiling/ -- ms/tick, ms/system/tick, memory, GC pressure
```

**Dane:** brak nowego contentu.

**Testy:** headless benchmark
(`pnpm sim:run --fixture black_mountain --years 200`), performance
regression tests, slow tick detector, memory leak detector.

**Acceptance Gate (`Save/Determinism/Performance Gate P0 --- VS`):**
Reference VS (32 regiony) mieści się w uzgodnionym baseline ms/tick i
pamięci (dokładne liczby --- `officialMaxRegions`/budgety --- pozostają
`OPEN` do czasu zebrania pierwszych realnych pomiarów, zgodnie z
`IMPL-011`: nie wymyślamy liczb, dopóki nie mamy danych).

**Ryzyka:** średnie-wysokie --- ryzyko przedwczesnej mikro-
optymalizacji kosztem czytelności (mitygacja: `PERF-006` wymaga najpierw
correctness/determinism/profiling, dopiero potem optymalizacji --- ten
porządek jest już zachowany, bo M24 następuje po M23).

**Poza zakresem:** benchmark ladder 250--3000 regionów (M26), Rust/ WASM
migration (tylko jeśli profiling **po** tym milestone wykaże realny
bottleneck --- `Technology Stack Decision §100 Kill criteria`).

**Źródła:** `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
(§100--163, §401--168 Gate P0),
`FIRST-CAUSE-Canonical-Decisions- v0.1.md` (PERF-001--007).

------------------------------------------------------------------------

## M25 --- VS Freeze

**Faza:** M --- Vertical Slice Completion · **Priorytet:** P0 ·
**Złożoność:** S · **Ryzyko:** LOW · **Documentation Readiness:** READY

**Cel:** formalne zamknięcie Vertical Slice --- wszystkie Gates A--J z
Simulation Test Spec przechodzą, dokumentacja i kod są zsynchronizowane,
zakres jest zamrożony przed przejściem do MVP.

**Zależności:** M24.

**Implementowane systemy:** brak nowych --- weryfikacja i zamrożenie.

**Moduły:** brak nowych modułów kodu; aktualizacja tego dokumentu
(sekcja 12) i `Canonical Decisions` jeśli coś wymagało korekty w trakcie
implementacji.

**UI Design Conformance Gate (v0.2):** obowiązkowy Golden UI /
Anti-Drift review dla WCC, Region Detail, Economy, WHY?, Chronicle,
Architect i World Economy. Każdy ekran jest porównywany z intencją
Golden UI oraz tekstowymi regułami `UI Visual Design System v1.0`;
tekstowy Design System ma pierwszeństwo nad obrazem referencyjnym.

**Dane:** brak nowego contentu.

**Testy:** pełny przebieg wszystkich bramek `Gate A: Data` ...
`Gate J: 200-Year Stability` z Simulation Test Spec §212--221.

**Acceptance Gate (Simulation Test Spec §222--223, „Kryterium przejścia
VS → MVP"):** wszystkie Gates A--J zielone; Vertical Slice Definition of
Tested spełniony; `Success Condition` z `Canonical Decisions VS-006`
zademonstrowany: „Tworzę świat. Zmieniam jeden warunek. Uruchamiam czas.
Świat sam reaguje. Po dekadach widzę konsekwencje, których nie
wybierałem ręcznie, i mogę prześledzić ich rzeczywiste przyczyny."

**Ryzyka:** niskie --- to gate administracyjny, zakładający że M0--M24
zostały rzetelnie ukończone.

**Poza zakresem:** wszystko, co jest w sekcji 8 (DEFERRED) oraz M26--
M29 (post-VS).

**Źródła:** `FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§212--226),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (VS-006).

**Checkpoint:** **CP7 --- Vertical Slice** osiągnięty.

------------------------------------------------------------------------

# 11. Milestone'y post-VS (droga do MVP) --- M26--M29

Poniższe milestone'y **nie są wymagane do VS Freeze**. Odpowiadają Phase
K (Scale) i części Phase L (Save & Long-Run) z propozycji wyjściowej
oraz części Phase M dotyczącej rozszerzenia contentu. Wymieniono je dla
kompletności harmonogramu, ale zgodnie z `IMPL-002` nie powinny się
rozpoczynać przed `M25`.

## M26 --- Scale Certification (250 → 3 000 regionów)

**Priorytet:** P1 (poza VS) · **Złożoność:** L · **Ryzyko:** HIGH ·
**Documentation Readiness:** READY

**Cel:** certyfikacja presetów
`Small (~250) → Standard (~600) → Large (~1200) → Huge (~2000) → Architecture Target (do 3000)`
względem Gates P1--P4.

**Zależności:** M25.

**Testy/Acceptance Gate:** `Save/Determinism/Performance Spec` Gates
P1--P4 (§164--169), benchmark matrix `TEST_SMALL...TEST_STRESS`
(§219--225 Simulation Test Spec).

**Ryzyka:** `officialMaxRegions` jest jawnie `OPEN` --- ustalany dopiero
po tych benchmarkach (`OPEN-001`), nie zakładać z góry liczby.

**Źródła:** `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
(§163--169, §198--225).

## M27 --- Long-Run Certification (500 i 1000 lat)

**Priorytet:** P1 (500 lat) / P2 (1000 lat, target) · **Złożoność:** M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** rozszerzenie testu z M23 do 500 lat (P1) i docelowo 1000 lat
(target), z monitoringiem runaway population/price detectors.

**Zależności:** M26 (współdzielą infrastrukturę benchmarkową).

**Źródła:** `FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§143--150),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (SIM-007).

## M28 --- Content/Locale Expansion (droga do pełnego katalogu)

**Priorytet:** P1/P2 · **Złożoność:** L · **Ryzyko:** MEDIUM ·
**Documentation Readiness:** PARTIAL (docelowy katalog jest `TARGET`,
nie w pełni rozpisany co do treści poszczególnych pozycji poza VS)

**Cel:** rozszerzenie z 12/20/17 (VS) do docelowego 38 resources/64
goods/28 company archetypes (`ECO-001--003`), oraz z EN/PL do docelowych
14 języków (`CONTENT-004`).

**Zależności:** M25.

**Ryzyka:** to jest praca głównie content-authoring, niskiego ryzyka
technicznego, ale dużej objętości; nie wymaga nowej mechaniki silnika
(`ECO-008` data-driven economy już to zapewnia).

**Źródła:** `FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` (§4, §6,
§9), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (ECO-001--003,
CONTENT-004).

## M29 --- World Generation MVP Scaling

**Priorytet:** P2 · **Złożoność:** M · **Ryzyko:** MEDIUM ·
**Documentation Readiness:** READY

**Cel:** generator obsługuje multi-continent, bogatszy setup/kultury,
Small/Standard presety (World Generation Spec §55 MVP scope).

**Zależności:** M26, M28.

**Źródła:** `FIRST-CAUSE-World-Generation-Spec-v0.1.md` (§55).

------------------------------------------------------------------------

# 12. Implementation Status

Stan na 2026-09-20: M0, M0.1 Audit Fixes oraz M1--M20 ukończone (M12-M14
dodatkowo przeszły pełny audyt post-implementacyjny i naprawę -- patrz
M14's sekcja "Audyt post-implementacyjny"; M15's sekcja "Wyniki
wykonania" opisuje implementację Discovery Engine/Diffusion/Adoption;
M19's sekcja "Wyniki wykonania" opisuje Chronicle -- wszystkie 15/15
event types VS mają dziś detektor po follow-upach tego samego dnia;
M20's sekcja "Wyniki wykonania" opisuje pełny
`WorldRunner.getState()/ fromState()` roundtrip i nowy pakiet
`packages/persistence`). M21 odblokowany. **Ten dokument jest żywy ---
po ukończeniu każdego milestone'u aktualizujemy Status, a w razie
potrzeby także Ryzyka i Dependencies poniższych wierszy, nie zmieniając
historii już ukończonych pozycji bez wyraźnego powodu (patrz sekcja
13).**

  Milestone   Status       Priorytet   Złożoność   Ryzyko        Zależności
  ----------- ------------ ----------- ----------- ------------- ------------
  M0          DONE         P0          S           LOW           ---
  M1          DONE         P0          M           MEDIUM        M0
  M2          DONE         P0          M           LOW-MEDIUM    M1
  M3          DONE         P0          M           MEDIUM        M1, M2
  M4          DONE         P0          S/M         MEDIUM        M3
  M5          DONE         P0          S           LOW           M4
  M6          DONE         P0          M           MEDIUM        M4
  M7          DONE         P0          M           MEDIUM        M5, M6
  M8          DONE         P0          M           HIGH          M7
  M9          DONE         P0          M           MEDIUM        M8
  M10         DONE         P0          M           MEDIUM        M9
  M11         DONE         P0          L           HIGH          M10
  M12         DONE         P0          M           MEDIUM-HIGH   M11
  M13         DONE         P0          M           MEDIUM        M12
  M14         DONE         P0          S/M         MEDIUM        M13
  M15         DONE         P0          L           MEDIUM-HIGH   M14
  M16         DONE         P0          M           MEDIUM        M15
  M17         DONE         P0          L           HIGH          M16
  M18         DONE         P0          M           MEDIUM        M17
  M19         DONE         P0          M/L         MEDIUM        M18
  M20         DONE         P0          M           MEDIUM-HIGH   M19
  M21         IN PROGRES   S P0        L           MEDIUM        M20
  M22         BACKLOG      P0          L           HIGH          M21
  M23         BACKLOG      P0          M           HIGH          M22
  M24         BACKLOG      P0          M/L         MEDIUM-HIGH   M23
  M25         BACKLOG      P0          S           LOW           M24
  M26         BACKLOG      P1          L           HIGH          M25
  M27         BACKLOG      P1/P2       M           MEDIUM        M26
  M28         BACKLOG      P1/P2       L           MEDIUM        M25
  M29         BACKLOG      P2          M           MEDIUM        M26, M28

Statusy: `BACKLOG` / `READY` / `IN PROGRESS` / `BLOCKED` / `DONE`.

------------------------------------------------------------------------

# 13. Dokument żywy --- zasady aktualizacji

Po zakończeniu każdego milestone'u aktualizujemy w tym pliku:

1.  `Status` w tabeli z sekcji 12 (`READY` dla kolejnego odblokowanego
    milestone'u, `DONE` dla ukończonego).
2.  Sekcję danego milestone'u w sekcji 10/11, jeśli implementacja
    ujawniła nową zależność, ryzyko lub dług techniczny, którego nie
    było widać na etapie planowania.
3.  `Dependency Graph` (sekcja 5), jeśli odkryto zależność boczną, o
    której dokumentacja nie wspominała wprost.

Nie zmieniamy retrospektywnie opisu **już ukończonych** milestone'ów bez
wyraźnego powodu (np. odkrytego błędu w tym dokumencie) --- historia
decyzji ma pozostać czytelna. Jeśli w trakcie implementacji milestone'u
okaże się, że dokumentacja systemowa nie rozstrzyga jakiejś wartości
tuningowej, stosujemy `IMPL-011` (configurable placeholder + TODO
tuning), a nie modyfikujemy zakresu tego dokumentu w locie.

------------------------------------------------------------------------

# 14. Zasada końcowa

> **Ten harmonogram odpowiada na pytanie: co dokładnie implementujemy
> następne, dlaczego właśnie teraz, od czego to zależy i po czym
> poznamy, że możemy przejść dalej.**

**Aktualizacja v0.6 (2026-09-26):** następnym krokiem jest
**`M21-VIS-R1` --- World Screen Layout / Composition Implementation
Pass** (sekcja „M21 Visual Track update --- 2026-09-26”). Poniższy
akapit opisuje stan z v0.2 i jest historyczny.

Następny krok (v0.2): **M21 --- UI Vertical Slice**, IN PROGRESS --
rozpoczynamy od Visual Production Track i **Golden UI #1 --- World
Command Center 1920×1080**, a następnie przechodzimy do Living Atlas,
Region Detail i pierwszego Visual Conformance Audit. M21 dostarcza
pełny, spójny UI na stabilnych Read Models (World Command Center, Living
Atlas, Region Detail, Economy/Market/Company, Technology, WHY?,
Chronicle, Architect Panel, Butterfly Effect), pierwszy milestone
podłączający `WorldRunner` do `apps/desktop`. M0, M0.1 oraz M1--M20 są
DONE (M12-M14 dodatkowo przeszły pełną naprawę audytu
post-implementacyjnego, patrz M14's sekcja; M15's implementacja
Discovery Engine/Diffusion/Adoption, M16's implementacja Architect,
M17's pełna integracja Causality Engine, M18's WHY?/Butterfly/WHY NOT?,
M19's Chronicle (wszystkie 15/15 event types) i M20's
`WorldRunner.getState()/fromState()` + `packages/persistence` opisane w
ich sekcjach "Wyniki wykonania", M15-M16 dodatkowo z dopisanym addendum
po remediacji niezależnego audytu M15-M16 z 2026-09-19 -- patrz też
`CHANGELOG.md`). Kolejne milestone'y rozpoczynają się po odbiorze ich
zależności.

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE Implementation Roadmap v0.2**

------------------------------------------------------------------------

# 15. Changelog v0.2

Zmiany względem v0.1 wynikające z zamrożenia warstwy UI/grafiki:

1.  dodano `FIRST-CAUSE-UI-Visual-Design-System-v1.0.md` i
    `FIRST-CAUSE-UI-Implementation-Spec-v1.0.md` do obowiązującej
    dokumentacji harmonogramu;
2.  UI Foundation stał się cross-cutting track od M3/M4;
3.  typed Read Models są częścią Definition of Done systemów user-facing
    od M5;
4.  Design Tokens, FC primitives i AppShell rozpoczynają się w M5-M10;
5.  Region Visual Identity (UI-F1) rozpoczyna się w M15 (pierwotnie
    dopuszczone jako M14/M15, rozstrzygnięte na M15 decyzją z 2026-09-18
    -- M14's rzeczywista implementacja renderingu nie objęła, patrz
    M14's sekcja "Audyt post-implementacyjny");
6.  komponenty Causality/WHY? rozpoczynają się w M17/M18;
7.  Chronicle UI rozpoczyna się w M19;
8.  M21 zreinterpretowano jako pełny **UI Integration Milestone**;
9.  M22 wyprowadza `RegionVisualProfile` z prawdziwego stanu świata;
10. M23 obejmuje 200-letni SIM+UI soak;
11. M24 obejmuje UI Performance Gate;
12. M25 obejmuje Golden UI / Anti-Drift Conformance Gate.

Numeracja M0--M25 oraz M26--M29 pozostaje bez zmian.

### M21 Visual Production Track update --- 2026-09-21 / Golden UI #1 accepted

`VP-01 Golden UI #1 — World` is **DONE / ACCEPTED**.

Canonical reference: `FIRST-CAUSE-Golden-UI-01-World-v1.0.png` plus the
normative rules in `FIRST-CAUSE-UI-Visual-Design-System-v1.1.md` and
`FIRST-CAUSE-UI-Implementation-Spec-v1.1.md`.

The accepted screen freezes: Living Atlas dominance; Map Modes and
independent Overlays; population-scaled settlement markers; contextual
rather than global flows; Recent Events → Map → WHY? → Consequences;
selected-region progressive disclosure; historical World Timeline;
contextual ranking; and Anti-AI calm-information-first rules.

**Next M21 execution order:**

1.  implement/audit UI-03 World shell against Golden UI #1,
2.  implement Living Atlas map-mode/overlay state contract,
3.  implement population marker scaling and semantic zoom,
4.  wire Recent Events → map focus → compact WHY?,
5.  wire contextual Flow Lens Top 3/5/All,
6.  wire Δ Change comparison windows,
7.  screenshot audit of the 10 canonical states,
8.  proceed to Golden UI #2 --- Region Detail / Region Dossier.

Asset production for the Atlas must prioritise restrained cartographic
primitives and data-driven region identity; decorative terrain assets
are secondary.

------------------------------------------------------------------------

# M21 Visual Track update --- 2026-09-25

## Approved inputs

The World visual direction is now sufficiently specified for
implementation:

-   Golden UI World Command Center v1.2 --- approved layout/information
    hierarchy,
-   Raw Simulation Atlas v0.1 --- approved map character,
-   Visual Alphabet v1.1 --- approved symbol-system direction,
-   Living Atlas Visual Asset Spec v1.2 --- production contract.

The project must stop broad visual exploration at this point. New style
variants are justified only by a concrete implementation/stress-test
failure.

## M21-VIS-01 --- Living Atlas implementation spike

**Priority:** P0\
**Owner:** implementation agent (Codex recommended)\
**Goal:** prove that the visual language works with production
contracts.

Deliver:

-   audit of existing UI-03/UI-04,
-   renderer primitives,
-   Geography/Civilization/Simulation Data separation,
-   deterministic RegionVisualProfile mapping,
-   one region in four historical states,
-   screenshots,
-   tests.

## M21-VIS-02 --- Map Mode Stress Test

On the same geography, validate available:

-   Population,
-   Economy,
-   Resources,
-   Trade,
-   Technology,
-   Δ Change.

Check information density, label collisions, selection, overlays and
performance.

## M21-VIS-03 --- Golden UI integration

> **v0.6 (2026-09-26):** kryteria poniżej zastąpiono kanonem Golden UI
> World v1.3 §26 (`UI-014`). Wymóg „bottom Regions/Economy/Events/
> Population strip” i osobnego „compact World Overview” jest
> SUPERSEDED. Historyczny tekst v0.5 zachowano niżej.

Integrate the validated Atlas into the World screen defined by Golden UI
World v1.3 §26.

The final screenshot must show:

-   stable left navigation rail (`UI-004` scope),
-   top bar with world time, time controls and World Pulse,
-   Living Atlas as the central, dominant and largest surface,
-   right-column Selected Region Inspector with explicit empty state,
-   analytical layer under the Atlas (Key Causes / Possible
    Consequences / Quick Actions, M21-VIS-03A),
-   supporting modules (Recent Events, Timeline, ranking) subordinate
    to the Atlas,
-   context-first navigation.

Historical v0.5 criteria (superseded): top-bar world pulse; stable left
navigation; compact World Overview; Atlas as largest graphical surface;
contextual Region Inspector; bottom Regions/Economy/Events/Population
strip; context-first navigation.

## M21-VIS-04 --- Independent audit

After implementation:

`Codex implementation → Claude Code audit → Codex corrections → tests → human acceptance`

Audit scope:

-   documentation conformance,
-   Anti-AI drift,
-   simulation truth → Read Model → visual mapping,
-   accidental scope expansion,
-   screenshot comparison,
-   determinism/performance where relevant.

## M21-VIS-05 --- Freeze and next screen

Only after M21-VIS-01 through M21-VIS-04 PASS (v0.6: including the
remediation track `M21-VIS-R1`...`R6` below and a repeated independent
audit after `M21-VIS-R6`):

1.  freeze `FIRST CAUSE Visual Direction v1.0`,
2.  proceed to Golden UI #2 --- Region Detail,
3.  reuse the same Visual Alphabet and Atlas rules rather than creating
    a new visual language.

------------------------------------------------------------------------

# M21-VIS-03A --- World analytical context scope

**Priority:** P0 within Golden UI integration.

Implement the bottom analytical strip:

`NAJWAŻNIEJSZE PRZYCZYNY | MOŻLIWE KONSEKWENCJE | SZYBKIE AKCJE`

with shared explicit scope for the first two modules:

`ŚWIAT | [SELECTED REGION]`

Acceptance: - WORLD is default, - region selection alone does not
silently change scope, - both analytical modules switch together, -
quick actions are context-derived, - WHY? receives the active scope and
selected analytical item, - projections are visually identified as
projections, - no unsupported cause/consequence is synthesized by UI, -
screenshot review confirms compact Anti-AI styling.

This task is completed as part of M21-VIS-03 before independent audit.

------------------------------------------------------------------------

# M21 Visual Track update --- 2026-09-26 (Canon Resolution + audit)

## Wejście

1.  Niezależny audyt `M21-VIS-04` wykonany 2026-09-26:
    `FIRST-CAUSE-World-Atlas-Independent-Audit-2026-09-26.md`
    (2 × BLOCKER, 7 × HIGH, 12 × MEDIUM, 6 × LOW).
2.  Decyzja właściciela projektu 2026-09-26: kompozycja World wg
    mockupu „FIRST CAUSE --- A LIVING WORLD”; Living Atlas centralny i
    dominujący --- Canonical Decisions `UI-014`, `UI-015`; Golden UI
    World v1.3 §26 jako jedyny kanon kompozycji.
3.  Status `PASS` części wizualnej w
    `FIRST-CAUSE-World-Context-Scope-Report-2026-09-25.md` nie
    obowiązuje (zob. adnotację w tym raporcie).

## Status etapów M21-VIS

| Etap | Spec status | Implementation status | Uzasadnienie |
| --- | --- | --- | --- |
| `M21-VIS-01` Living Atlas spike | READY (Atlas Spec v1.3 §28) | **FAIL --- REOPENED** | rozwój = skala + liczba bloków; cap skali przy ~100k; brak wydobycia; `industry` jednowartościowe; WORLD bez warstwy cywilizacji (audyt B1, H2) |
| `M21-VIS-02` Map Mode Stress Test | READY (Atlas Spec v1.3 §28.5, §28.7) | **FAIL --- REOPENED** | 4 tryby w tym samym kolorze; legenda stała; „zero” = „brak danych” (audyt B2, H3) |
| `M21-VIS-03` Golden UI integration | RESOLVED (Golden v1.3 §26) | **PARTIAL** | Context Scope zgodny; brak railu i World Pulse; Atlas nie dominuje; 1280×800 niezweryfikowane (audyt H1, H6, H7) |
| `M21-VIS-03A` Context Scope | DONE | **PASS** | potwierdzone audytem; uwagi komunikacyjne przeniesione do `M21-VIS-R5` |
| `M21-VIS-04` Independent audit | DONE (2026-09-26) | --- | ponowny audyt wymagany po `M21-VIS-R6` |
| `M21-VIS-05` Freeze | BLOCKED | --- | wymaga PASS `M21-VIS-01`...`04` |

Status nie jest nadawany na podstawie samego istnienia implementacji.

## Remediation track (kolejność obowiązująca)

Passy są realizowane sekwencyjnie; każdy kończy się raportem, wynikami
`pnpm typecheck / lint / test / build` (i `test:e2e`, gdy dotyczy) oraz
wpisem w `CHANGELOG.md`. Kolejny pass startuje dopiero po poleceniu
właściciela.

| Pass | Etap | Zakres | Zamyka |
| --- | --- | --- | --- |
| 1 | `M21-VIS-R1` World Screen Layout / Composition | kontrakt UI Impl Spec v1.4 §L: lewy rail, górny pasek z World Pulse, Atlas dominujący z auto-fit i zwartym paskiem narzędzi, prawa kolumna = inspektor, warstwa analityczna pod Atlasem, moduły wspierające zwijane, 1280×800 | audyt H1, H6, H7, M7--M11 (część layoutowa) |
| 2 | `M21-VIS-R2` RegionVisualProfile v2 + Visual Grammar | `industry[]`, `extraction[]`, infrastruktura per połączenie z danych i contentu (Atlas Spec v1.3 §28.1, §28.6); bez zmian Simulation Model | audyt B1 (kontrakt), M6 |
| 3 | `M21-VIS-R3` Settlement Morphology + Population Scaling + Civilization Readability | §28.2--28.4; WORLD z zagregowaną strukturą cywilizacji | audyt B1 (rendering), H2 |
| 4 | `M21-VIS-R4` Map Modes v2 + legends + zero/no-data | §28.5; legenda per tryb | audyt B2, H3, M2--M5 |
| 4A | `M21-VIS-R4A` Population Mode (pierścień skali, zero ≠ brak danych, legenda trybu) + `SET-LIFECYCLE-001` | §14, §28.5 | **DONE / HUMAN VISUAL ACCEPTED** (2026-09-29): audyt H3, M2; B2 dla Population |
| 4B | `M21-VIS-R4B` Remaining Map Modes: własne kodowanie i legendy Economy / Resources / Trade / Technology / Development / Stability / Political / Δ Change | §28.5 | **NOT STARTED**: audyt B2 (pozostałe tryby), M3--M5 |
| 5 | `M21-VIS-R5` Causality / WHY? UX | UI Impl Spec v1.4 §W: WHY? kontekstowe, `PRZYCZYNA → SKUTEK`, jednoznaczne etykiety | audyt H4, H5, M12 |
| 6 | `M21-VIS-R6` Visual Verification Gate | UI Impl Spec v1.4 §V + Atlas Spec v1.3 §28.7; potem ponowny `M21-VIS-04` i human acceptance | audyt M1, L6; bramka `M21-VIS-05` |

Poza zakresem track: nowe mechaniki symulacji, geometria geograficzna
(M22), zmiany ekonomii, determinizmu i formatu zapisu.

## Wynik `M21-VIS-R1` (2026-09-26) --- PASS

Kompozycja World wg Golden UI World v1.3 §26.3--26.4 i UI Impl Spec
v1.4 §L. Decyzje właściciela dla tego passu: rail pokazuje tylko
istniejące ekrany (dziś wyłącznie World; Economy / Technology /
Chronicle / Architect ukryte do czasu powstania ekranów, bez atrap);
`Terrain` jest nazwą widoku bazowego (dawniej `DEFAULT`); mockup
`docs/golden-ui/FIRST-CAUSE-Golden-UI-World-v1.3-reference.png` jest
referencją kompozycyjną.

-   **A** `FCNavigationRail` zamiast `FCTopNavigation` (176 px; 144 px
    poniżej 1440 px): World + język PL/EN + stan workera w stopce.
-   **B** górny pasek: świat, rok / miesiąc / tick, World Pulse (4
    wskaźniki z Read Modelu, wartość + Δ w oknie porównania), sterowanie
    czasem `UI-013` + „Przesuń o rok”.
-   **C/D** Atlas wypełnia pierwszy ekran; zwarty pasek narzędzi (tryby
    + jeden wiersz kontrolek, w tym wybór regionu); podpis trybu jako
    nakładka; auto-fit diagramu z rezerwacją miejsca na legendę; tryb
    bazowy `Terrain` (bez warstwy danych). Renderer, symbole i semantyka
    trybów bez zmian.
-   **E** prawa kolumna = Selected Region Inspector z jawnym stanem
    pustym; `selectedEntityId` ≠ `analysisScope` zachowane.
-   **F** Key Causes / Possible Consequences / Quick Actions pod
    Atlasem, bez wewnętrznego przewijania.
-   **G** Recent Events, World Timeline, WHY?, ranking: zwijane moduły
    pod pierwszym ekranem (domyślnie zwinięte; WHY? rozwija się przy
    nowym wyjaśnieniu).

Pomiar (Playwright, prawdziwy viewport, `tests/e2e/world-layout.spec.ts`):
Atlas 62,7% obszaru roboczego przy 1920×1080 (płótno 1314×790) i 52,3%
przy 1280×800 (płótno 798×492); brak poziomego przewijania; Atlas,
pas F i sterowanie czasem w pierwszym ekranie. Screenshoty:
`docs/verification/world-r1-2026-09-26/`.

Statusy po R1: `M21-VIS-01` FAIL (reopened), `M21-VIS-02` FAIL
(reopened), `M21-VIS-03` PARTIAL (kompozycja zgodna; czytelność Atlasu
R2--R4, WHY? R5, bramka R6), `M21-VIS-03A` PASS, `M21-VIS-04` ponowny
audyt po R6, `M21-VIS-05` BLOCKED. Następny pass: `M21-VIS-R2` (po
poleceniu właściciela).

## Wynik `M21-VIS-R2` (2026-09-26) --- IMPLEMENTATION PASS, HUMAN VISUAL ACCEPTANCE PASS

**Akceptacja właściciela (2026-09-26):** zaakceptowano *visual grammar
/ renderer foundation* --- RegionVisualProfile v2, Visual Grammar,
`industry[]`, `extraction[]`, infrastrukturę per połączenie i transport
rysowany na krawędziach, fundament semantic zoom, legendę z danych,
słownik terenu i architekturę umożliwiającą dalszy rozwój Atlasu.
**Nie** zaakceptowano obecnego wyglądu Living Atlasu jako finalnego:
Atlas nadal czyta się jako „nodes + edges + symbols”, a docelowo ma
przypominać żyjący świat przestrzenny. Morfologia osad, geometryczne
kwadraty osad, rozmiar znaków INDUSTRIAL/MODERN, czytelność
cywilizacji, relacja osada ↔ przemysł i skalowanie populacji należą do
`M21-VIS-R3`; ciągła geografia (odejście od wyspowych pól regionów)
wymaga geometrii i pozostaje w M22.

RegionVisualProfile v2 + Visual Grammar wg Atlas Spec v1.3 §28.1, §28.4
(obecność na WORLD), §28.6. Kontrakt: `industry[]` (sektor, skala §10.3,
stan z `Company.status`), `extraction[]` (znane eksploatowane złoża,
active/idle/depleted), `resources[]` (znane złoża bez wydobycia),
klimat / wysokość / żyzność; infrastruktura per połączenie
(`WorldConnectionView.routes`, rodziny tras z contentu). Rodziny
wizualne: opcjonalne pola contentu `extractionFamily` (zasób) i
`routeFamily` (tryb transportu). Czysta warstwa gramatyki
(`atlas-grammar.ts`) i alfabet jako dane (`visual-alphabet.ts`); renderer
rysuje geografię, trasy na krawędziach, osady i znaki aktywności z
klucza znaków pochodzącego z danych. Bez zmian Simulation Model, RNG,
zapisu, Map Modes, morfologii osad i kompozycji R1. Screenshoty:
`docs/verification/world-r2-2026-09-26/`; E2E `tests/e2e/world-r2.spec.ts`.

Luki danych (nie blokery R2): w prawdziwym świecie złoża pozostają
UNKNOWN (jedyną ścieżką odkrycia jest interwencja Architekta), więc
`extraction[]` / `resources[]` są puste; firmy eksploatują złoża UNKNOWN
(`economy-tick` bramkuje odkryciem tylko zakładanie firm) --- decyzja
właściciela; content nie ma kolei ani żeglugi morskiej; brak geometrii
(M22).

Statusy po R2: `M21-VIS-01` FAIL
(reopened; kontrakt i gramatyka gotowe, morfologia / skala R3),
`M21-VIS-02` FAIL (reopened; R4), `M21-VIS-03` PARTIAL, `M21-VIS-03A`
PASS, `M21-VIS-04` ponowny audyt po R6, `M21-VIS-05` BLOCKED. Następny
pass: `M21-VIS-R3` (na osobne polecenie właściciela). Przed R3 otwarta
decyzja właściciela: niespójność „firma eksploatuje złoże UNKNOWN”
(analiza przyczynowa 2026-09-26, bez zmian w symulacji).

## Resource Discovery Boundary (2026-09-26) --- D1 + D2 DONE, D3 DONE (2026-09-27)

Decyzja właściciela: wariant D (Canonical Decisions `TECH-010`).

-   **D1** spójny stan początkowy: fixture deklaruje
    `resourceDeposits[].discovery`; `loadWorldFixture(raw,
    { productionRecipesByMethodId })` odrzuca stan, w którym startowa
    firma używa nieznanego złoża (World Generation Spec §22). Black
    Mountain: znane jest tylko zboże Green Valley (wymagane przez
    startową farmę); ruda żelaza i drewno pozostają `UNKNOWN` (§16).
-   **D2** bramka odkrycia we wszystkich ścieżkach gospodarczych
    (`usableDepositQuantity`, twardy inwariant przed wydobyciem w
    `runProduction`); eksploatacja nie odkrywa złoża.
-   **UI:** `ResourceDepositReadModel` i
    `RegionSummaryReadModel.resourceDefinitionIds` zawierają tylko złoża
    znane światu (koniec „Grain --- Unknown” w inspektorze).
-   **D3 (pierwotnie OPEN, zamknięte 2026-09-27 --- sekcja „Natural
    Resource Discovery D3” niżej):** trigger naturalnego odkrywania był
    nieokreślony w dokumentacji --- warianty przedstawione właścicielowi. Przy analizie
    wykryto blokadę: `Region.knowledge.technologyStateId` nie był
    linkowany, więc M15 nie działał w świecie z JSON --- naprawione
    (sekcja niżej).
-   **Odłożone:** ACTOR-SPECIFIC / LOCAL KNOWLEDGE MODEL.

## Regional Technology State Repair (2026-09-26) --- DONE (pre-D3)

Przyczyna: `createWorldState` wyprowadzał wszystkie back-references
regionu (kohorty, złoża, osady, firmy, `marketId`,
`regionalInventoryId`, połączenia) poza
`Region.knowledge.technologyStateId`. Każdy świat budowany z danych
(fixture JSON; proceduralny worldgen jeszcze nie istnieje) miał więc
wyłączony system technologii (`economy-tick`: brak linku = pominięcie
regionu). Naprawa w `createWorldState` wzorem `Market` (Entity Data
Model §6/§28/§67 --- TechnologyState jest regionalny): link wyprowadzany
z `TechnologyState.regionId`; drugi stan dla regionu albo sprzeczny,
jawnie podany link = `InvariantViolationError`. Region bez
TechnologyState pozostaje bez technologii --- kanon nie wymaga stanu w
każdym regionie (Black Mountain: 4 z 8 regionów, te z osadami);
rozstrzygnięcie to otwarta decyzja właściciela.

Przebieg referencyjny Black Mountain po naprawie (bez zmian
parametrów): po 12 tickach 2--4 odkrycia KNOWN na region, po 120 ---
53--68 AVAILABLE, po 600 --- wszystkie 125 odkryć AVAILABLE w każdym z
4 regionów (populacja 14--29 osób), wiedza domen 100/100; 2 adopcje
PM (`manual_farming` → `watermill_milling`, MEC-004), 0 statusów
ADOPTED. Fakty po 600 tickach: 34 640 (przed naprawą 5 416), w tym
25 002 `technology_adoption_increased`; Chronicle: 738 wpisów (przed:
48), w tym 690 `technology_adoption_wave`. Zgłoszone jako osobne
problemy do decyzji (bez automatycznego tuningu): lawina
technologiczna niezależna od skali populacji, zalew faktów
`populationAccess` i wpisów Chronicle. Testy:
`reference-technology.test.ts` (link, działanie pipeline'u,
determinizm, zapis → odczyt), `world-state.test.ts` (inwarianty
linku). D3 nadal OPEN.

## Technology pacing (2026-09-26) --- decyzje właściciela 1--3, 4, 5

-   **Fakty i Chronicle (krok 1, `086cff6`):** fakty technologii przy
    zdarzeniach (Causality §7), osobny typ dostępu populacji, nowe
    zdarzenie `technology_tier_reached`, nowość per technologia.
-   **Tempo (krok 2):** `gain = 0.0283 · √(p/20 000) · (1 − K/100)` na
    domenę na tick (0 dla pustego regionu); progi tierów
    `[0, 4, 10, 18, 30, 46, 80]`. Pasma docelowe (OPEN-004) sprawdzane
    testem `technology-pacing.test.ts`: ≤ 100 osób → T0--T2 po 200 latach;
    2 000 → T3--T4; 20 000 → T5; 200 000 → T6 w 100--180 lat (benchmark:
    112--131). Regiony Black Mountain (10--30 osób) pozostają na T0--T1.
-   **TechnologyState w każdym regionie (krok 3, `TECH-011`):** loader
    odrzuca region bez stanu; Black Mountain ma 8 stanów (4 puste
    regiony nieaktywne); region bez populacji nie tworzy wiedzy ani
    odkryć.
-   **Dalej:** ponowny przebieg referencyjny (krok 4), potem D3 (N2) i R3.

## Demografia małych populacji (2026-09-27) --- decyzje właściciela 2A+3C (C), 2B (B4)

-   **Ułamkowa populacja naprawiona:** wolne miejsca mieszkaniowe liczone
    w pełnych osobach; migracja i demografia wymagają całkowitej
    populacji (fail-loud).
-   **Diagnoza:** demografia bez sprzężenia stabilizującego to losowy
    dryf wokół zastępowalności; przy \~12 osobach na region prototypu
    (§64) region może wymrzeć zależnie od seeda. Przy 198 osobach
    (`black_mountain_vs_scale.json`) żaden region nie wymarł w 7 seedach
    × 200 lat, a pierwsza adopcja technologii (`watermill_milling`,
    wymaga `mec_004`) pojawiła się w 3/7 przebiegów.
-   **Odłożone (B4):** sprzężenie płodności/śmiertelności z żywnością
    i przeludnieniem (Simulation Model §4.5). Blokery: `needs.survival`
    liczone tylko dla zatrudnionych kohort (brak modelu
    samozaopatrzenia), `housing.pressure` w praktyce stale 0. Wymaga
    osobnej decyzji projektowej przed implementacją.

## Natural Resource Discovery D3 (2026-09-27) --- DONE, model A + a (TECH-012)

-   **Kanon:** Canonical Decisions `TECH-012` (bramki MIN-001/MIN-008/
    MIN-011 zgodne z katalogiem, deterministyczny wybór złóż, jawna
    głębokość, macierz ujawniania).
-   **Dane:** `ResourceDefinition.discoveryRules.detection[]` (Zod,
    walidacja referencji `discoveryId` przez ścieżkę
    `discoveryRules.detection[].discoveryId`); `iron_ore.json`: MIN-001
    DISCOVERED do głębokości 30, SUSPECTED do 150; MIN-008 SUSPECTED do
    600; MIN-011 ASSESSED od 150 (z SUSPECTED/DISCOVERED) --- progi
    `TODO tuning`. `ResourceDeposit.stock.depth` może być `undefined`
    (nie podano); Black Mountain: jawne `depth: 10` tylko dla rudy
    żelaza (oba fixture'y).
-   **Silnik:** `systems/resources/natural-discovery.ts` (czysta
    funkcja, punkt stały, bez RNG); krok 2.6 ticku po technologii, przed
    Company AI; pusty region pomijany (TECH-011). `discoverDeposit`:
    fakt `resource_suspected`, łańcuch discovered → assessed,
    `discoveredTick` dopiero od DISCOVERED.
-   **Read Models:** `RegionSummaryReadModel.suspectedDepositCount`,
    `ResourceDepositReadModel.depth/quality/accessibility` tylko dla
    ASSESSED, redakcja ID złoża nieznanego światu w widoku WHY.
-   **Przebieg referencyjny (600 ticków):** MIN-001 AVAILABLE w Black
    Mountain w ticku 80 → ruda żelaza DISCOVERED w tym samym ticku
    (1 fakt, 1 wpis Chronicle); MIN-008/MIN-011 nie pojawiają się w 200
    lat; tempo technologii identyczne jak bez D3.
-   **Odłożone:** eksploracja pustych regionów; wizualna reprezentacja
    SUSPECTED w Atlasie (DEFERRED TO VISUAL PASS --- Visual Alphabet nie
    ma symbolu); brak contentu wydobycia rudy żelaza (archetyp/PM) ---
    łańcuch VS §31 kończy się na „gospodarka może ocenić opportunity”.

## Wynik `M21-VIS-R3` (2026-09-27) --- DONE, HUMAN VISUAL ACCEPTED

Settlement Morphology + Population Scaling + Civilization Readability wg
Atlas Spec v1.3 §28.2--§28.4 (szczegóły modelu: tam). Populacja zmienia
strukturę znaku osady (6 klas z kategorii §4A.1, 5 autorskich
prymitywów, 3 warianty × lustro z hasha id), nie tylko rozmiar; ślad
skaluje się logarytmicznie z limitem; wiele osad na region z budżetem
semantic zoom i agregacją „+n”; region bez osad = pusty pierścień
(region ≠ osada); legenda skali z zakresu danych. Stara siatka bloków
(`settlementBlocks`) usunięta. Bez zmian: Simulation Model, RNG,
zapis, Map Modes (R4), WHY? (R5), geometria (M22), D3/TECH-012.
Fixture'y wizualne: `visual-morphology-fixture.ts` (drabina 10 → 10M+,
warianty, świat z kilkoma centrami), harness
`visual-tests/world.html?fixture=...` i arkusz `morphology.html`.
Screenshoty: `docs/verification/world-r3-2026-09-27/`; E2E
`tests/e2e/world-r3.spec.ts`. Statusy: `M21-VIS-01` pozostaje FAIL
(reopened) do akceptacji wizualnej R3 i R4; następny pass `M21-VIS-R4`
dopiero po akceptacji wyglądu R3.

## Backlog: CONTENT-IRON-01 --- Iron Ore Extraction Vertical Chain (2026-09-27)

**Status:** BACKLOG --- zapisane, niezaimplementowane; nie blokuje
`M21-VIS-R3`.

D3 (TECH-012) potwierdził, że ruda żelaza Black Mountain jest
naturalnie odkrywana (MIN-001 → DISCOVERED w ticku 80), ale content
nie ma archetypu firmy ani metody produkcji wydobywającej rudę żelaza,
więc łańcuch VS §31 kończy się na „resource discovery → economic
opportunity”. Zakres przyszłego zadania:

``` text
discovered iron ore deposit → economic opportunity → decyzja AI o
rozpoczęciu działalności → firma / archetyp wydobywczy → metoda
produkcji wydobycia rudy żelaza → extraction → regional inventory /
market → dalsze wykorzystanie rudy przez gospodarkę
```

Cel: pełne przejście scenariusza VS §31 (technology → resource
discovery → economic opportunity → extraction → economic
consequences). Szczegółowa mechanika --- do zaprojektowania przy
starcie zadania, na polecenie właściciela.

## Wynik `M21-VIS-R3.1` (2026-09-27) --- refinement R3, DONE, HUMAN VISUAL ACCEPTED

Wąska poprawka R3 (bez zmian klas, footprintu, semantic zoom, budżetów,
wariantów, UI i symulacji): City dostało strukturalne dzielnice (osobne
płaty zabudowy z jednym głównym rdzeniem), żeby Town ~10k i City ~100k
różniły się strukturą, nie tylko skalą; osie zewnętrzne Megacity kończą
się na osadach satelitarnych w obrębie śladu. 10 vs 100 pozostaje
świadomie PARTIAL (zaakceptowane przez właściciela dla R3). Materiały:
`docs/verification/world-r3-1-2026-09-27/`; E2E
`tests/e2e/world-r3-1.spec.ts` (zapis do `docs/` tylko z
`FC_WRITE_VERIFICATION=1`, tak samo spec R3 --- zatwierdzony zestaw R3
nie jest nadpisywany zwykłym `test:e2e`). Prymitywy R3/R3.1 nadal poza
Visual Alphabet §4A do akceptacji całego R3.

## Zamknięcie `M21-VIS-R3` (2026-09-27) --- CLOSED / HUMAN VISUAL ACCEPTED

Akceptacja właściciela na podstawie materiałów
`docs/verification/world-r3-1-2026-09-27/` (town-vs-city,
megacity-axis-check, ladder 10 → 10M+, civilization 1920×1080,
morphology sheet). R3 i refinement R3.1 wykonane.

| Porównanie | Wynik |
| --- | --- |
| 10 vs 100 | PARTIAL --- zaakceptowane przez właściciela dla R3 |
| 100 vs 1k | PASS |
| 1k vs 10k | PASS |
| 10k vs 100k | PASS |
| 100k vs 1M | PASS |
| 1M vs 10M+ | PASS |
| Osie Megacity | PASS |

Regresje: Black Mountain PASS, industry / extraction PASS, connections
PASS, D3 (TECH-012) PASS. Zaakceptowane prymitywy i reguły morfologii
dopisane do Atlas Spec §4A.1 („Morfologia osad”). Obserwacja na
później (nie zadanie): ewentualne strojenie minimalnego ekranowego
śladu osad na WORLD przy dużych światach. Następny etap:
`M21-VIS-R4` --- wynik poniżej.

## Wynik `M21-VIS-R4` (2026-09-29) --- R4A POPULATION DONE / HUMAN VISUAL ACCEPTED; R4B NOT STARTED

**Status (closeout 2026-09-29):** `M21-VIS-R4` NIE jest zamknięty w
całości. Podział:

-   **R4A --- Population Mode (R4 + R4.1):** DONE / HUMAN VISUAL
    ACCEPTED przez właściciela (commity `b5cd343`, `98cc09f`).
-   **SET-LIFECYCLE-001 --- koniec aktywnej osady:** DONE / OWNER
    ACCEPTED (commit `eac714d`; Canonical Decisions §52A).
-   **R4B --- Remaining Map Modes:** NOT STARTED (niżej, „Pozostały
    zakres”).

Population Mode Living Atlasu wg Atlas Spec v1.3 §14 / §28.5
(szczegóły modelu: tam, akapit „Implementacja `M21-VIS-R4`”). Zakres
passu zawężony przez polecenie właściciela do trybu Population:
**POPULATION RING = skala populacji regionu, SETTLEMENT MORPHOLOGY
(R3) = struktura osadnictwa**.

-   Tryb Population jest trybem danych: neutralny pierścień (kontur +
    lekkie wypełnienie, bez gradientu / glow / koloru statusu) POD
    niezmienioną morfologią R3; promień = 1.4 × `settlementFootprint`
    (wspólna, logarytmiczna matematyka R3, monotoniczna, limit 46.2 j.
    ≈ 80% pola regionu). Koło zamiast bloków (audyt M2) usunięte;
    kolor Δ populacji usunięty z trybu (zmiana należy do Δ Change).
-   **Zero ≠ brak danych:** `0` = znana wartość (pełny cienki kontur,
    „0 · niezamieszkany”); brak danych = przerywany kontur `muted`,
    „— · brak danych”; w inspektorze pełna liczba albo „—”, nigdy
    „NaN” / „0”. Symulacja zawsze zna populację, więc „brak danych”
    to kontrakt prezentacji dla Read Modelu bez wartości (fixture);
    typy symulacji bez zmian.
-   Legenda zależna od trybu (ten sam mechanizm, te same prymitywy co
    mapa): Population = rzędy wielkości pierścieni z zakresu danych +
    „0” + „brak danych” + notka o morfologii; Terrain bez zmian.
-   Wartość zwarta przy regionie (`Intl` compact, locale-safe); przy
    wyczerpanym budżecie nazw zostaje sama wartość.
-   Semantic zoom zmienia detal, nie fakt (warstwa Population nie ma
    wejścia zoomu).

Walidacja: typecheck 0, lint 0 błędów / 1 znane ostrzeżenie, test
137 plików / 1057 testów, build PASS, E2E 10/10 (w tym regresje
R1--R3.1). Megacity + pierścień: 46 + 2 = 48 ≤ 60 prymitywów.
Screenshoty: `docs/verification/world-r4-2026-09-29/`; E2E
`tests/e2e/world-r4.spec.ts`; fixture
`visual-population-fixture.ts`.

Poza zakresem (otwarte w R4 wg tabeli passów): własne kodowanie
Economy / Resources / Trade / Technology / Development / Stability /
Δ Change oraz ich legendy (audyt B2 dla pozostałych trybów, M3--M5)
--- przeniesione do R4B (NOT STARTED).

### `M21-VIS-R4.1` (2026-09-29) --- refinement czytelności Population

Po przeglądzie wizualnym właściciela (kierunek R4 zaakceptowany:
pierścień, skala log, morfologia R3, 0 ≠ brak danych). Zmiany wyłącznie
prezentacyjne w trybie Population:

-   hierarchia: pierścień czytany jako ilość (kontur 0.9 / krycie 0.6,
    wypełnienie 10%), morfologia lekko wtórna (0.85), teren / trasy /
    znaki aktywności mocniej przygaszone;
-   pierścień na ekranie = promień bazowy + stały dodatek 5 px zamiast
    minimum 7 px z osad R3 (minimum spłaszczało ~10 / ~100 / ~1k przy
    oddaleniu); znaczniki „0” / „brak danych” min. 7 px, kontur 1.3 px;
-   zaznaczenie w trybie Population = narożniki w kolorze akcentu
    (2 px) zamiast okręgu --- nie myli się z pierścieniem; Terrain bez
    zmian;
-   etykieta regionu stoi poza pierścieniem;
-   finalny tekst: „Populacja regionu · skala logarytmiczna”; z
    legendy usunięta notka deweloperska o morfologii.

Walidacja: typecheck 0, lint 0 / 1 znane ostrzeżenie, test 137 /
1061, build PASS, E2E 11/11. Screenshoty:
`docs/verification/world-r4-1-2026-09-29/`; E2E
`tests/e2e/world-r4-1.spec.ts`. Status: R4A DONE / HUMAN VISUAL
ACCEPTED (2026-09-29).

**BLOCKER (R4.1) --- cykl życia osady przy populacji 0 --- RESOLVED
przez `SET-LIFECYCLE-001` (niżej), OWNER ACCEPTED 2026-09-29.** Stan z audytu R4.1: Decyzja właściciela: osada, której populacja spada
do 0, przestaje istnieć jako aktywna osada. Obecna symulacja tego nie
realizuje: `Settlement` nie ma statusu aktywności, najniższy etap
`CAMP` ma próg 0 (`STAGE_POPULATION_THRESHOLD`), żaden system nie
usuwa osady z `WorldState.settlements` ani z
`Region.settlements.settlementIds`, a zgony i migracja mogą
wyzerować kohorty osady. Skutek: osada z populacją 0 jest liczona w
`settlementCount`, pojawia się w Read Modelu i jest rysowana
morfologią (klasa Hamlet). Wymaga decyzji właściciela i osobnego
etapu symulacji --- warianty w raporcie R4.1.

### `SET-LIFECYCLE-001` (2026-09-29) --- etap naprawczy: koniec aktywnej osady

Decyzja właściciela (wariant A, bez okresu oczekiwania): Canonical
Decisions §52A. Status: **DONE / OWNER ACCEPTED** (2026-09-29, commit
`eac714d`). Zachowanie firm potwierdzone bez zmian: firma z
historycznym `settlementId` działa dalej jako firma regionu; bez
automatycznej relokacji ani zamykania.

-   Model: `Settlement.status` (`ACTIVE` | `ABANDONED`) +
    `abandonedTick`, `isSettlementActive` jako jedyna definicja
    aktywności; invarianty w `createWorldState` (ABANDONED ⇒ populacja
    0 i `abandonedTick`).
-   Tick (krok 12 Settlement Growth, po migracji i demografii): populacja
    `=== 0` → ABANDONED w tym samym ticku, fakt `settlement_abandoned`
    raz, przyczyny = fakty `population_declined` /
    `population_migrated_out` tego ticka (`sameBatch`); ujemna populacja
    = naruszenie niezmiennika.
-   Filtry ACTIVE: cel migracji, osada nowej firmy, koszt mieszkania w
    atrakcyjności migracji, presja osadnicza, Read Modele (SETTLEMENTS,
    liczba osad per etap, największa osada, etap wizualny, lista osad
    widoku / Atlas).
-   Firmy: bez nowej reguły --- firma należy do regionu, pracę i rynek ma
    regionalne, zamyka ją istniejący Company AI; `settlementId` zostaje
    jako historyczne powiązanie.
-   Chronicle: `EventTypeDefinition` + szablon `settlement_abandoned`,
    wpis w pipeline, kotwica PERMANENT w Causal Memory.
-   Zapis: `SCHEMA_VERSION` 2, `ENGINE_VERSION` 2, pierwszy realny
    migrator v1 → v2 (`status: ACTIVE`).

Walidacja: typecheck 0, lint 0 / 1 znane ostrzeżenie, test 139 / 1077,
build PASS, E2E 12/12. Screenshoty:
`docs/verification/settlement-lifecycle-2026-09-29/`; E2E
`tests/e2e/settlement-lifecycle.spec.ts` (prawdziwy tick).

**Pozostały zakres R4 = `M21-VIS-R4B` --- NOT STARTED:** własne
kodowanie i legendy Economy / Resources / Trade / Technology /
Development / Stability / Political / Δ Change (audyt B2 dla
pozostałych trybów, M3--M5). Start tylko na polecenie właściciela.

Otwarte poza R4: `M21-VIS-R5` (WHY?), `M22` (geometria świata),
reprezentacja złóż SUSPECTED, CONTENT-IRON-01, przyszły system
zakładania nowych osad / ponownego zasiedlenia, grafika ruin, Lifetime
Summary zanikłej osady (Chronicle §168).
