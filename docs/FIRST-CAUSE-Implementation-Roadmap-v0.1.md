# FIRST CAUSE --- Implementation Roadmap v0.1

**Status:** dokument kanoniczny / żywy (living document)\
**Projekt:** FIRST CAUSE\
**Wersja:** 0.1\
**Rola:** przełożenie istniejącej dokumentacji na wykonywalną kolejność
implementacji Vertical Slice --- od pustego repozytorium do
`VS Freeze`.\
**Dokumenty nadrzędne:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md`,
`FIRST-CAUSE-Master-Documentation-Consistency-Implementation-Readiness-Audit-v0.1.md`

> **Ten dokument nie tworzy nowej koncepcji gry. Tłumaczy istniejące,
> już zatwierdzone specyfikacje na kolejność, w jakiej powstanie kod.**

------------------------------------------------------------------------

# 0. Miejsce tego dokumentu w hierarchii

Ten dokument powstaje **po** `Canonical Decisions v0.1` i **przed**
rozpoczęciem implementacji `M0 --- Repository Foundation`. Pełni rolę,
którą `Master Documentation Consistency & Implementation Readiness
Audit v0.1` nazwał ostatnim krokiem przed kodowaniem: audyt ustalił
kanon i kolejność na poziomie nazw milestone'ów (`IMPL-008`), a ten
dokument rozwija tę kolejność do poziomu modułów, danych, testów,
bramek akceptacyjnych i ryzyk, tak aby agent kodujący (Claude
Code/Codex) nie musiał niczego zgadywać ani wymyślać.

Jeżeli ten dokument jest sprzeczny z `Canonical Decisions v0.1`,
obowiązuje `Canonical Decisions v0.1`. Ten dokument nie rozstrzyga
konfliktów projektowych --- rozstrzyga **kolejność i zakres pracy**.

------------------------------------------------------------------------

# 1. Główna zasada harmonogramu

Kolejność wdrażania wynika z zależności danych i mechanik, nie z
kolejności rozdziałów w specyfikacjach:

```text
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

------------------------------------------------------------------------

# 2. Poziomy planowania

```text
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
odpowiada temu, czego oczekiwałby 55-punktowy harmonogram, bez
mnożenia liczby milestone'ów ponad to, co jest już kanonicznie
ustalone.

------------------------------------------------------------------------

# 3. Dlaczego ten dokument NIE używa układu M0--M55 1:1

Propozycja wyjściowa (Phase A--M, M0--M55) jest trafna koncepcyjnie,
ale projekt **już ma** zatwierdzoną, kanoniczną kolejność
implementacji: `IMPL-008` w `Canonical Decisions v0.1` (26 kroków,
`M0`--`M25`), potwierdzoną też w `Master Audit` (sekcje 139--166) i w
`Technology Stack Decision` (sekcje 92--98). Zmiana numeracji
milestone'ów bez technicznego powodu złamałaby zasadę z `Canonical
Decisions` §200:

> „Jeżeli dokumentacja opisuje dwie różne wersje tej samej decyzji,
> agent nie wybiera tej, która jest łatwiejsza do implementacji.
> Wybiera decyzję z niniejszego rejestru."

Dlatego ten dokument:

1.  **Zachowuje kanoniczną numerację `M0`--`M25`** jako oś główną
    (Vertical Slice).
2.  **Nie spłaszcza granulacji** --- tam, gdzie propozycja 55-punktowa
    chciała osobnych milestone'ów (np. osobno Discovery/Adoption/Company
    Dynamics albo osobno AI Decision Core/Opportunity
    Scanner/Bounded Rationality), dokumentacja systemowa **już
    definiuje** tę granulację jako `MODULE` wewnątrz jednego
    milestone'u (np. `AI-01`...`AI-12` wewnątrz `M11`, `CE-01`...`CE-12`
    wewnątrz `M17`, `CH-01`...`CH-14` wewnątrz `M19`, `UI-01`...`UI-14`
    wewnątrz `M21`). Poziom szczegółowości jest więc identyczny ---
    tylko przeniesiony z poziomu `MILESTONE` na poziom `MODULE`, co
    jest zgodne z poziomami planowania z sekcji 2.
3.  **Dodaje cztery milestone'y poza kanonicznym VS** (`M26`--`M29`),
    których propozycja wyjściowa domagała się jako Phase K (Scale) i
    części Phase L (Save & Long-Run). Nie są one częścią `IMPL-008`,
    ponieważ Vertical Slice jest zdefiniowany jako świat **24--40
    regionów** (`WORLD-005`), a certyfikacja 250/600/1200/2000/3000
    regionów oraz testy 500/1000-letnie są jawnie opisane w `Save/
    Determinism/Performance Spec` i `Simulation Test Spec` jako etap
    **po** Vertical Slice, na drodze do MVP. Dodanie ich jako `M26`--
    `M29` domyka zakres z propozycji wyjściowej bez fałszowania, że są
    one wymagane do ukończenia VS.
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

  Faza z propozycji                          Kanoniczne milestone'y   Uwaga
  ------------------------------------------- ------------------------ ---------------------------------------------
  A --- Foundation                            M0--M4                  bez zmian koncepcyjnych
  B --- Minimum Living Economy                M5--M10                 Resources/Population rozdzielone równolegle
  C --- Living World (Population/Migration/   M6, M13, M14, M5         Resources/Infrastructure jako moduły w M5/M9,
  Settlements/Resources/Infrastructure)                                a nie osobne milestone'y
  D --- Knowledge & Economic Evolution        M15, M12                Company Dynamics = M12 (Entrepreneurship)
  E --- Autonomous Actors (AI Core/           M11                     AI-01...AI-12 jako moduły
  Opportunity/Bounded Rationality)
  F --- Causal World                          M17, M18 (start: M5+)   Fact infra zaczyna się w M5 (cross-cutting)
  G --- History                               M19                     CH-01...CH-14 jako moduły
  H --- Architect                             M16 (integracja: M17)   Butterfly wymaga M17/M18
  I --- World Generation                      M22                     jeden 31-etapowy pipeline
  J --- Player Experience                     M21                     UI-01...UI-14 jako moduły
  K --- Scale                                 **M26** (post-VS)       250/600/1200/2000/3000
  L --- Save & Long-Run                       cross-cutting od M1 +   pełna certyfikacja w **M27** (post-VS)
                                               **M27**
  M --- Vertical Slice Completion             M23--M25                Black Mountain 200 lat → tuning → freeze

------------------------------------------------------------------------

# 5. Dependency Graph

## 5.1 Główny łańcuch (Critical Dependency Graph)

```text
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

```text
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

UI debug shell
  może istnieć od M3 (surowe inspektory World State), rośnie
  równolegle z backendem; pełny World Command Center powstaje w M21,
  gdy read models są stabilne.

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

```text
CRITICAL PATH (sekwencyjny, blokujący):
M0 → M1 → M2 → M3 → M4 → M5/M6 → M7 → M8 → M9 → M10 → M11 → M12 →
M13 → M14 → M15 → M16 → M17 → M18 → M19 → M20 → M21 → M22 → M23 →
M24 → M25
```

Nie istnieje realna ścieżka skracająca ten łańcuch --- każdy system
gospodarczy VS zależy fizycznie od poprzedniego (populacja potrzebuje
zasobów i osad, rynek potrzebuje produkcji, AI potrzebuje rynku i
pracy, migracja potrzebuje AI/zatrudnienia, technologia wpływa na
produkcję i wymaga wiedzy zakorzenionej w populacji/osadach,
Architect potrzebuje działającego świata do zmiany warunków,
przyczynowość potrzebuje wszystkich powyższych do wyjaśniania,
Chronicle potrzebuje przyczynowości). To jest właśnie powód, dla
którego `Master Audit` odrzucił podejście „moduł po module bez
pionowego testu" (§137).

```text
PARALLEL WORK (może iść równolegle do critical path, bez blokowania):
- M5 (Resources) || wczesne prace nad M6 (Population) -- oba zależą
  tylko od M3/M4.
- Content authoring (JSON dla resources/goods/companies/PM/discoveries)
  równolegle z M5-M15, z wyprzedzeniem.
- Fact infrastructure (CE-01/CE-02) równolegle z M5-M16, zamiast
  czekać na M17.
- Save roundtrip + WorldChecksum rozbudowa równolegle z M3-M19.
- UI debug shell (surowe widoki World State, bez stylizacji)
  równolegle z M3-M20, poprzedzające właściwy UI-01...UI-14 z M21.
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

# 7. Checkpointy

  Checkpoint   Nazwa                     Po milestone   Definicja
  ------------ ------------------------- -------------- ------------------------------------------------------------
  CP0          Technical Foundation      M3             Deterministyczny pusty świat z encjami, bez gospodarki.
  CP1          First Living Economy      M10            Świat produkuje, konsumuje, handluje, reaguje na ceny.
  CP2          Emergent Economy          M12            Firmy autonomicznie zakładają się, rosną, upadają.
  CP3          Explainable World         M18            WHY? wyjaśnia dowolną istotną konsekwencję.
  CP4          Historical World          M19            Chronicle wybiera i zapisuje znaczące procesy.
  CP5          Architect Playable        M16+M17+M18    Interwencje gracza działają przez realny graf przyczynowy
                                                          (wymaga interwencji z M16, propagacji z M17 i WHY z M18).
  CP6          Procedural World          M22            Można wygenerować nowy 32-regionowy świat z dowolnego seeda.
  CP7          Vertical Slice            M25            Black Mountain end-to-end, determinizm, save/load, 200 lat.

------------------------------------------------------------------------

# 8. Systemy i decyzje poza obecnym zakresem

Zgodnie z `Canonical Decisions` (`DEFER-001`...`DEFER-012`) oraz `Master
Audit` §127, następujące pozycje **nie powstają** w ramach `M0`--`M29`:

```text
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
    mutacja World State przechodzi `READ → CALCULATE → VALIDATE →
    COMMIT → EMIT FACTS`; brak `Math.random()`, brak systemowego
    czasu, brak nondeterministic UUID.
2.  **Causal hooks (`IMPL-012`):** każda znacząca mutacja od `M5` w
    górę powinna przewidywać emisję `SimulationFact`/`CausalContext`,
    nawet jeśli pełna integracja Causality Engine następuje dopiero w
    `M17`.
3.  **Persistence audit (`IMPL-013`):** każde nowe pole runtime ma
    jawny status: canonical persistent / derived reconstructible /
    transient.
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

```text
pnpm workspace + packages/{simulation,content,localization,shared}
pozostałe pakiety architektury docelowej przy pierwszym rzeczywistym użyciu
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

- Git repo (`main`), pnpm monorepo (`apps/*`, `packages/*`), TypeScript
  `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
  w całym repo.
- `packages/shared` -- typed IPC contract (`SimulationRequest/
  Response`, `FirstCauseApi`, `AppInfo`), współdzielony przez main,
  preload i renderer.
- `packages/content` -- Zod schema (`ResourceDefinitionSchema`),
  `DefinitionRegistry`, loader z walidacją strukturalną Zod i
  kontrolą duplicate IDs (obecny zakres walidacji semantycznej), jedna realna definicja
  (`content/resources/iron_ore.json`), testy poprawnej i błędnej
  definicji.
- `packages/localization` -- `createI18n()` (i18next + react-i18next),
  `locales/en/common.json` + `locales/pl/common.json`, test lokalizacji
  niezależnej od reszty aplikacji.
- `packages/simulation` -- czysty, testowalny `protocol-handler`
  (PING/PONG, GET_CORE_STATUS), `worker.ts` na `worker_threads`, CLI
  `pnpm sim:run` (headless, zweryfikowane realnym uruchomieniem).
- `apps/desktop` -- Electron (`electron-vite`) + React + Vite; main
  process z `SimulationBridge` (request/response correlation po
  `requestId`), preload z wąskim `contextBridge` API
  (`getAppInfo`/`pingSimulation`/`getSimulationCoreStatus`), React
  shell (status workera, przełącznik PL/EN, Zustand tylko dla
  `isDeveloperOverlayOpen`).
- Testy: Vitest (15 testów: schema/registry/i18n/protocol-handler/UI),
  Playwright Electron E2E (pełna ścieżka: start apki → okno →
  "FIRST CAUSE" widoczne → Simulation Worker ONLINE).
- ESLint (flat config) z regułą architektoniczną blokującą import
  `react`/`react-dom`/`electron`/desktop w `packages/simulation`,
  `packages/content`, `packages/shared`; Prettier; GitHub Actions CI
  (`typecheck → lint → format:check → test → build`, osobny job E2E).
- `README.md`, `AGENTS.md`.

**Znalezione i naprawione problemy:**

- **Realny bug, nie problem środowiska:** domyślna konfiguracja
  `electron-vite`'owego `externalizeDepsPlugin()` zostawiała
  `@first-cause/shared` (pakiet ESM: `"type": "module"`) jako
  `require("@first-cause/shared")` w CJS-owym bundlu main/preload, co
  powodowało `ERR_REQUIRE_ESM` i uniemożliwiało odpaleniu się aplikacji
  (a w efekcie -- pierwszy przebieg E2E kończył się timeoutem, bo okno
  nigdy się nie pokazywało). Naprawione przez `exclude:
  ["@first-cause/shared"]` w `electron.vite.config.ts`, dzięki czemu
  esbuild inline'uje ten pakiet w bundlu zamiast requirować go w
  runtime. Zweryfikowane bezpośrednim uruchomieniem `electron
  out/main/index.js` przed i po poprawce.
- Domyślny root-level `pnpm -r run typecheck` failował dla pakietów
  zależnych od innych workspace'owych pakietów, bo `--noEmit` nie
  generuje `dist/*.d.ts` dla zależności. Naprawione: `typecheck`
  najpierw uruchamia `build:packages`.
- RTL nie czyściło DOM między testami w tym samym pliku (Vitest nie ma
  automatycznego `afterEach(cleanup)` bez `globals: true`) --
  naprawione jawnym `afterEach(cleanup)` w `vitest.setup.ts`.

**Dług techniczny (świadomie pozostawiony, nieblokujący M1):**

- Audyt M0 potwierdził działanie `pnpm dev`; problem `server.fs.allow`
  nie został odtworzony. Nie jest to aktywny dług P1.
- **Zasada tworzenia pakietów:** pakiet powstaje przy pierwszym
  rzeczywistym konsumencie / implementacji odpowiedniego systemu.
  `entities`, `worldgen`, `causality`, `chronicle`, `persistence`, `ui`
  są świadomie odroczone, a nie brakujące w M0. Nie tworzymy pustych
  pakietów dla zgodności z diagramem. `causality` powstaje przy pierwszym
  użyciu fact infrastructure (cross-cutting od M5), nie arbitralnie w M17;
  kanoniczna architektura Causality Engine pozostaje bez zmian.
- P2: brak jeszcze `electron-builder`/instalatora -- `pnpm build`
  produkuje uruchamialny `out/`, nie installer. Nie było to wymagane w
  M0.

**Czy M1 jest odblokowane:** TAK. `pnpm typecheck`, `pnpm lint`,
`pnpm format:check`, `pnpm test`, `pnpm build` i `pnpm test:e2e`
przechodzą lokalnie po M0.1. Zdalny GitHub Actions po tej zmianie nie
został uruchomiony; lokalne wyniki nie są deklaracją PASS zdalnego CI.

### M0.1 --- Audit Fixes (maintenance, 2026-09-15)

**Status: DONE / audit fixes completed.** Nie jest nowym kanonicznym
milestone'em; numeracja M0–M29 pozostaje bez zmian. **M1 = READY**,
implementacja M1 nie została rozpoczęta.

- M0-01: lifecycle bridge `running/failed/disposed`, timeout IPC 10 s,
  reject i cleanup pending przy error/exit/dispose, idempotentny dispose,
  oczekiwanie aplikacji na worker z limitem shutdown 5 s.
- M0-02: Electron E2E na Ubuntu przez `xvfb-run --auto-servernum`.
- M0-03: zsynchronizowane statusy, następny krok, zasada pakietów,
  walidacja semantyczna i wyniki audytu dev w README/Roadmapie.
- M0-04/M0-05: sklonowane i głęboko zamrożone definicje JSON,
  jawny porządek ID niezależny od locale i kolejności wejścia.
- Testy: 26 unit/component, w tym 9 lifecycle z kontrolowanym workerem
  i fake timers; registry sprawdza referencje wejściowe/wyjściowe,
  struktury zagnieżdżone oraz `a_a`, `aa`, `ab`.
- Pozostałe P2: M0-06 runtime IPC validation przy rozszerzaniu protokołu,
  M0-07 drobna lokalizacja; brak instalatora pozostaje poza M0.

------------------------------------------------------------------------

## M1 --- Deterministic Core

**Faza:** A --- Foundation · **Priorytet:** P0 · **Złożoność:** M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** deterministyczny szkielet czasu, losowości i identyfikatorów,
na którym każdy późniejszy system będzie mógł polegać bez wyjątków.

**Zależności:** M0.

**Implementowane systemy:** SimulationClock/Tick, Seed, deterministic
RNG z nazwanymi streamami, deterministic IDs, canonical ordering,
rounding policy, WorldChecksum, command boundary, minimalny headless
runner.

**Moduły (`packages/simulation/src/core`):**

```text
core/time    -- tick = integer (0,1,2...), data = f(startYear/Month, tick)
core/rng     -- seeded RNG, rng.stream("migration"), rng.stream("company_ai")...
core/ids     -- deterministic stable IDs (world-local numeric lub deterministic string)
core/validation -- assertion helpers (no NaN/Infinity, bounds)
core/serialization -- canonical serialization (sorted map/set, stable entity order)
core/checksum -- WorldChecksum (wersjonowany algorytm hashujący)
```

**Dane:** brak contentu; wyłącznie konfiguracja RNG streams (§SAVE-003:
`world_generation, demography, company_ai, entrepreneurship, migration,
discovery, events, naming`).

**Testy:** RNG golden vectors, determinism smoke (`same seed = same
checksum`), ×1 vs headless batch equality, stable iteration order test,
brak `Math.random()` w Simulation Core (lint rule / grep check).

**Acceptance Gate (Technology Stack Decision §98):** 10 000 pustych
ticków reprodukowalnych; RNG golden tests przechodzą; ×1 i headless
batch dają ten sam checksum; minimalny core state save/restore daje
identyczny wynik.

**Ryzyka:** floating-point divergence między platformami (mitygacja:
centralna rounding policy, integer/fixed-point dla money od razu ---
`Canonical Decisions` OPEN-008/§27 Technology Stack Decision); pokusa
odłożenia determinizmu „na później" (świadomie odrzucona --- `Canonical
Decisions` SAVE/§75 Master Audit: „Determinism P0 od pierwszego dnia").

**Poza zakresem:** World State, encje domenowe, content.

**Źródła:** `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
(§6--30), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (SAVE-001--006,
PERF-*), `FIRST-CAUSE-Technology-Stack-Decision-v0.1.md` (§29--35,
§82--88, §93, §98).

------------------------------------------------------------------------

## M2 --- Data Foundation

**Faza:** A --- Foundation · **Priorytet:** P0 · **Złożoność:** M ·
**Ryzyko:** LOW-MEDIUM · **Documentation Readiness:** READY

**Cel:** pipeline `JSON → Zod → semantic validation → immutable
Definition Registry`, gotowy na przyjęcie pierwszych definicji contentu
i kluczy lokalizacyjnych.

**Zależności:** M1 (deterministic IDs/loading order).

**Implementowane systemy:** Content Definitions, Zod schemas,
Definition Registry, semantic validation (missing refs, duplicate IDs,
cycles, phase violations), stable content IDs, localization key
skeleton (i18next), Content Phase (`VS/MVP/FULL`).

**Moduły (`packages/content`, `packages/localization`):**

```text
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
phase violation, missing EN/PL key --- każdy jako osobny test walidatora;
content load determinism (ten sam zestaw plików = ten sam registry).

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

```text
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
globalne (`population >= 0`, `deposit >= 0`, `inventory >= 0`, `price >
0`, brak NaN/Infinity), save/load roundtrip pustego świata z encjami,
stable iteration order przy iteracji po encjach.

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

------------------------------------------------------------------------

## M4 --- Black Mountain Reference Fixture

**Faza:** A --- Foundation · **Priorytet:** P0 · **Złożoność:** S/M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** ręcznie zdefiniowany, deterministyczny, kontrolowany mini-świat
(8--12 regionów), zawierający Black Mountain i jego ekosystem, na
którym rozwijane będą systemy gospodarcze --- zanim istnieje
proceduralny generator.

**Zależności:** M3.

**Implementowane systemy:** brak nowych systemów --- wyłącznie dane
fixture + loader fixture (osobny od proceduralnego World Generation).

**Moduły:**

```text
tests/worldgen/fixtures/black_mountain_reference.json (lub równoważny)
worldgen/fixtures loader -- generic, nie zna pojęcia "blackMountain"
```

**Dane:** Black Mountain (hidden/unknown Iron Ore), food-producing
region, trade-connected settlement, potencjalne źródło labor/migration,
alternatywny region gospodarczy, realny transport cost/bottleneck
(World Generation Spec §16, §35).

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

**Moduły (`economy/resources`):**

```text
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
niewyczerpywalne (renewable) zasoby stabilizują się wokół
sustainable yield przy stałym popycie; wszystkie invariants zielone.

**Ryzyka:** niskie; główne ryzyko to przedwczesne sprzężenie z Market
(M8), którego jeszcze nie ma --- mitygacja: M5 testuje wydobycie
izolowanie, bez cen.

**Poza zakresem:** ceny, handel, AI decydujące o wydobyciu (to M7/M11).

**Źródła:** `FIRST-CAUSE-World-Generation-Spec-v0.1.md` (§13--15),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (ECO-004, ECO-010,
TECH-009), `FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` (§3--4,
§19).

------------------------------------------------------------------------

## M6 --- Minimal Population

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** kohorty ludności z miesięczną demografią, podstawowym
szkieletem potrzeb i twardą zasadą zachowania populacji (conservation).

**Zależności:** M4. *(Może iść równolegle z M5.)*

**Implementowane systemy:** PopulationCohort (ageGroup ×
economicClass × skill × profession × culture × location), miesięczna
demografia (births/deaths), needs skeleton (bez pełnej satysfakcji ---
to M9), population conservation.

**Moduły (`population/cohorts`, `population/needs`):**

```text
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
spójne, brak ujemnych kohort, demografia jest miesięczna (nie
kwartalna --- `SIM-002`).

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

------------------------------------------------------------------------

## M7 --- Production

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** firmy fizycznie produkują i konsumują inputs/labor zgodnie z
Production Methods; pierwsze działające łańcuchy gospodarcze.

**Zależności:** M5, M6.

**Implementowane systemy:** Company (production state), Production
Method (input→output, capacity, productivity), Inventory jako źródło
prawdy fizycznych dóbr, pierwsze łańcuchy (Zboże→Mąka→Żywność,
Livestock→Meat, Fish→Fish Food, Cotton→Fiber→Textiles→Clothing).

**Moduły (`economy/companies`, `economy/production`, `economy/inventory`):**

```text
economy/production -- PM evaluation (bez AI decision jeszcze -- fixed
  initial PM per company z fixture), input consumption, output creation
economy/inventory -- Inventory jako owner fizycznych goods (DATA-005)
economy/companies -- Company struktura finansowa (minimalna: cash)
```

**Dane:** pierwszy podzbiór 20 VS goods i minimalny zestaw archetypów
z M4 fixture (np. Crop Farm, Mill, Fishing Company) + odpowiadające
Production Methods (Manual Farming, Manual Processing...).

**Testy:** recipe conservation (input skonsumowany = zgodny z output),
production capacity respektuje labor/inputs, brak produkcji z
niczego (`no phantom goods`), production graph completeness dla
aktywnego podzbioru.

**Acceptance Gate:** firma z fixture produkuje dobro z prawdziwych
inputs i widocznej pracy; inventory rośnie/maleje zgodnie z produkcją
i konsumpcją; brak ujemnych zapasów.

**Ryzyka:** ryzyko przedwczesnego hardcodowania konkretnych firm
(zakazane przez `ECO-009`) --- mitygacja: production musi czytać z
Definition Registry, nie z `if company == X`.

**Poza zakresem:** ceny/rynek (M8), AI decyzje produkcyjne (M11), pełne
17 archetypów (rosną przyrostowo do M12).

**Źródła:** `FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md`
(§5--16), `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§11--14),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (ECO-007--009, ECO-011--012).

------------------------------------------------------------------------

## M8 --- Market

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** HIGH · **Documentation Readiness:** READY

**Cel:** jeden regionalny Market per region, z popytem, cenami,
niedoborami/nadwyżkami i wolniejszą reakcją cen (smoothing) --- bez
oscylacji.

**Zależności:** M7.

**Implementowane systemy:** regionalny Market (nie per-settlement ---
`DATA-006`), price adjustment z smoothing, shortages/surpluses,
demand aggregation.

**Moduły (`economy/markets`):**

```text
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

**Ryzyka:** **HIGH** --- to jest ryzyko R1 z `Vertical Slice Spec`
§73 („gospodarka oscyluje"); mitygacja: smoothing/hysteresis od
pierwszej wersji (nie „dodane później"), dedykowany test stresowy w
tym milestone, nie odkładany do M23.

**Poza zakresem:** handel międzyregionalny (M10), AI firm reagujące na
ceny (M11), needs satisfaction pełne (M9).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (DATA-006,
AI-005), `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§17--18, §73 R1),
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§30--33).

------------------------------------------------------------------------

## M9 --- Labor & Households

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** zatrudnienie, płace, dochód gospodarstw domowych i pełna
satysfakcja potrzeb (spending order Survival→...→Savings).

**Zależności:** M8.

**Implementowane systemy:** employment, wage offer, household income,
consumption, needs satisfaction (pełna, nie skeleton z M6).

**Moduły (`population/needs`, `economy/labor`):**

```text
labor/employment
labor/wages
population/consumption -- spending order (ECO-014)
population/needs-satisfaction
```

**Dane:** brak nowego contentu poza tym, co istnieje.

**Testy:** employment <= eligible working population, no money no
purchase, consumption priority (spending order respektowany),
wage response test, labor competition test szkielet (pełny w M11).

**Acceptance Gate:** kohorta z pracą ma wyższą satysfakcję potrzeb niż
bez pracy; brak zatrudnienia powyżej dostępnej siły roboczej; wydatki
podążają za `Survival → Basic → Services → Comfort → Prosperity →
Luxury → Savings`.

**Ryzyka:** sprzężenie zwrotne płace↔ceny↔popyt może wzmacniać
oscylację z M8 (mitygacja: ten sam test stresowy z M8 uruchamiany
ponownie po M9).

**Poza zakresem:** migracja jako reakcja na warunki pracy (M13), AI
decyzje firm o zatrudnieniu (M11 --- tu zatrudnienie jest reaktywne,
nie strategiczne).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (ECO-013--014),
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§22--23),
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§59--64).

------------------------------------------------------------------------

## M10 --- Trade & Transport

**Faza:** B --- Minimum Living Economy · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** fizyczny handel między regionami przez graf Connection, z
Effective Distance, capacity i kosztem transportu.

**Zależności:** M9.

**Implementowane systemy:** trade flows, Effective Distance
(`PhysicalDistance × TerrainModifier × InfrastructureModifier ×
BorderModifier × SecurityModifier × SeasonalModifier`), route capacity,
congestion, delivered cost.

**Moduły (`economy/trade`, `economy/transport`):**

```text
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
przyrostowo w M14/M22), państwa/granice (`BorderModifier` neutralny w
VS --- `WORLD-008`).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (ECO-015--016),
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§16, §18),
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§25, §34--36).

**Checkpoint:** **CP1 --- First Living Economy** osiągnięty po tym
milestone (świat produkuje, konsumuje, handluje i reaguje na ceny).

------------------------------------------------------------------------

## M11 --- Company AI

**Faza:** E --- Autonomous Actors · **Priorytet:** P0 · **Złożoność:**
L · **Ryzyko:** HIGH · **Documentation Readiness:** READY

**Cel:** firmy autonomicznie planują produkcję, reagują na inventory,
zatrudniają, ustalają wage offer, przechodzą przez
expansion/contraction/closure i finansowe przetrwanie, zgodnie z
`OBSERVE → FORECAST → GENERATE OPTIONS → SCORE → DECIDE → ACT →
EVALUATE`.

**Zależności:** M10.

**Implementowane systemy:** wspólny Decision Pipeline, Perceived World
State (`AI-001`), bounded rationality, hysteresis + cooldown
(`AI-005`), Company Financial Health, DecisionSnapshot + CausalContext
dla decyzji firm.

**Moduły (`AI-01`...`AI-11` z AI Decision Model §121, plus Black
Mountain tuning w M23):**

```text
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

*(`AI-07` Entrepreneurship i `AI-09` Migration integration przenoszą
się do M12/M13, gdzie żyją koncepcyjnie; `AI-12` Black Mountain tuning
przenosi się do M23, gdy cały świat działa end-to-end.)*

**Dane:** brak nowego contentu; wykorzystuje istniejące PM i archetypy.

**Testy:** production reaction test, no overreaction test, hysteresis
test, cooldown test, financial survival test, closure test,
bankruptcy test, PM adoption/rejection test, determinism test
(te same warunki = te same decyzje), perceived state test (brak
perfect foresight).

**Acceptance Gate (AI Decision Model §122):** firma potrafi autonomicznie
planować produkcję, reagować na inventory, zatrudniać, zmieniać wage
offer, przechodzić przez expansion/contraction/closure i unikać
oscylacji dzięki hysteresis/cooldown.

**Ryzyka:** **HIGH** --- to największe ryzyko projektu wg `Master
Audit` §271: „interakcja wielu poprawnych systemów prowadząca do
niestabilnej lub nieczytelnej symulacji". Mitygacja: hysteresis i
cooldown są P0 (nie opcjonalne), staggered evaluation od początku,
dedykowane testy no-overreaction.

**Poza zakresem:** entrepreneurship/nowe firmy (M12), pełna migracja
jako input do decyzji (M13), State AI (`DEFERRED`).

**Źródła:** `FIRST-CAUSE-AI-Decision-Model-v0.1.md` (całość, zwłaszcza
§5--41, §121--124), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (AI-*).

------------------------------------------------------------------------

## M12 --- Entrepreneurship

**Faza:** D --- Knowledge & Economic Evolution (Company Dynamics) ·
**Priorytet:** P0 · **Złożoność:** M · **Ryzyko:** MEDIUM-HIGH ·
**Documentation Readiness:** READY

**Cel:** nowe firmy powstają przez regionalny Opportunity Scanner, nie
przez losowe spawnienie; konkurencja i nasycenie rynku są modelowane.

**Zależności:** M11.

**Implementowane systemy:** Regional Opportunity Scanner, Opportunity
Score (`DemandGap + ExpectedMargin + ResourceAccess +
LaborAvailability + SkillAvailability + MarketAccess - Competition -
Risk - CapitalRequirement`), Founding Decision, Capital Formation,
Competition, resource-based/market-gap/export entrepreneurship,
company location decision.

**Moduły (`AI-07` z AI Decision Model):**

```text
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
uzasadnienia ekonomicznego firma nie powstaje; nasycenie rynku
ogranicza dalsze zakładanie firm tego samego typu.

**Ryzyka:** ryzyko „eksplozji firm" lub odwrotnie --- świata bez
żadnej nowej firmy (mitygacja: `Anti-Explosion Rules`, `Minimum
Economic Scale`, `Company Explosion Detector` z AI Decision Model
§84--88 i Save/Determinism/Performance §129--134).

**Poza zakresem:** pełna 28-archetypowa gospodarka (to M28, post-VS).

**Źródła:** `FIRST-CAUSE-AI-Decision-Model-v0.1.md` (§42--53, §84--89,
§123), `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (AI-007--008).

**Checkpoint:** **CP2 --- Emergent Economy** osiągnięty po tym
milestone (firmy samodzielnie podejmują decyzje).

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
links --- `POP-007`), migration friction, housing constraint jako
twardy limit.

**Moduły (`AI-09` z AI Decision Model, `population/migration`):**

```text
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
lokalne, przechodząc przez etapy `Camp → Hamlet → Village → Town →
City → Metropolis`, nie przez rozkaz gracza.

**Zależności:** M13.

**Implementowane systemy:** SettlementPressure, settlement stages,
housing (capacity/cost/pressure).

**Moduły (`society/settlements`):**

```text
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

**Poza zakresem:** pełna infrastruktura miejska (rozwijana dalej w
World Generation/economy), pełne miasta-państwa (DEFERRED).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (SET-001--003),
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§70--72),
`FIRST-CAUSE-World-Generation-Spec-v0.1.md` (§19--20).

------------------------------------------------------------------------

## M15 --- Technology

**Faza:** D --- Knowledge & Economic Evolution · **Priorytet:** P0 ·
**Złożoność:** L · **Ryzyko:** MEDIUM-HIGH · **Documentation
Readiness:** READY

**Cel:** wiedza regionalna, stany technologii (`Unknown → Known →
Available → Adopted`), Discovery Engine oddzielony od decyzji Company
AI o wdrożeniu (Adoption), 20--30 aktywnych Discoveries w 5 głównych +
4 wspierających domenach.

**Zależności:** M14 (populacja/osady jako baza wiedzy regionalnej).

**Implementowane systemy:** Knowledge accumulation, Discovery
eligibility, breakthroughs, Availability, PM Adoption (decyzja Company
AI, integrowana z M11's `AI-08`), Industry/Population/Institutional
Adoption.

**Moduły (`technology/knowledge`, `technology/discoveries`,
`technology/diffusion`, `technology/adoption`):**

```text
technology/knowledge -- regional knowledge accumulation
technology/discoveries -- eligibility, breakthrough triggers
technology/diffusion -- Availability spread
technology/adoption -- Industry/Population/Institutional (AI-08 hook)
```

**Dane:** 5 głównych domen VS (Agriculture, Construction, Metallurgy,
Mining, Mechanics) + wspierające (Mathematics, Transportation,
Medicine, Communication); 20--30 Discoveries (`TECH-008`).

**Testy:** discovery eligibility test, discovery ≠ availability test,
availability ≠ adoption test, PM adoption/rejection test, technology
diffusion test.

**Acceptance Gate:** region bez wymaganej wiedzy nie może odkryć
zaawansowanej technologii; odkrycie nie oznacza automatycznego
wdrożenia (firma może odrzucić nieopłacalną technologię --- `AI Decision
Model §39`); dyfuzja wiedzy jest widoczna między połączonymi regionami.

**Ryzyka:** złożoność stanu 4-poziomowego (`Unknown/Known/
Available/Adopted` × Industry/Population/Institutional) przy 20--30
discoveries --- mitygacja: brak klasycznego tech tree (`TECH-001`)
upraszcza strukturę względem alternatyw; T0--T5 to complexity bands,
nie epoki (`TECH-007`), co unika sztywnej progresji czasowej.

**Poza zakresem:** pełne 12 domen jednocześnie aktywne (VS aktywuje 5
głównych + wsparcie), Administration jako 13. domena (nie jest domeną
--- `TECH-005`).

**Źródła:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md` (TECH-001--009),
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§28--31),
`FIRST-CAUSE-AI-Decision-Model-v0.1.md` (§36--41, §62).

------------------------------------------------------------------------

## M16 --- Architect (pierwsza interwencja)

**Faza:** H --- Architect · **Priorytet:** P0 · **Złożoność:** M ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** gracz może zmienić **warunek** (nie wynik) świata przez
pierwszą interwencję (`Reveal Resource Deposit`), z kosztem Influence
i Root Fact jako punktem startowym dla przyszłej atrybucji.

**Zależności:** M15 (świat musi mieć pełną gospodarkę/technologię, aby
interwencje miały sens ekonomiczny).

**Implementowane systemy:** Influence (0--100), koszt interwencji
(`Base × Magnitude × Duration × Scope × Naturalness`), Intervention
Definition/Instance, validation przed wykonaniem, preview (bez obietnicy
wyniku), Root Fact.

**Moduły:**

```text
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

------------------------------------------------------------------------

## M17 --- Causality (pełna integracja)

**Faza:** F --- Causal World · **Priorytet:** P0 · **Złożoność:** L ·
**Ryzyko:** HIGH · **Documentation Readiness:** READY

**Cel:** wszystkie systemy z M5--M16 są w pełni zintegrowane z
Causality Engine --- każda znacząca mutacja tworzy `SimulationFact` z
poprawnymi `CausalEdge`, multi-causality i negative/limiting factors są
rejestrowane, Architect Influence propaguje po realnych krawędziach.

**Zależności:** M16. *(Fact infrastructure --- `CE-01`/`CE-02` --- już
istnieje od M5 jako cross-cutting; ten milestone domyka integrację ze
**wszystkimi** systemami naraz.)*

**Implementowane systemy:** pełny Causal Graph, Decision Facts +
DecisionSnapshot (już częściowo z M11), Historical/Architect Influence
Propagation, Natural Decay, Hierarchical Causal Memory
(HOT/WARM/PERMANENT), pruning z zachowaniem anchors.

**Moduły (`CE-03`...`CE-09`, `CE-11`, `CE-12` z Causality Engine §101):**

```text
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
M5; `CE-08` WHY? przenosi się do M18; `CE-10` Chronicle handoff
przenosi się do M19.)*

**Dane:** brak nowego contentu.

**Testy:** no false causality test, multi-causality test, negative
cause test, pruning integrity test, HOT/WARM/PERMANENT memory test,
influence decay test, independent cause dilution test, save/load
causal integrity.

**Acceptance Gate (Causality Engine §102--103):** każdy fact-producing
system identyfikuje zmianę, zna wejściowe czynniki, przekazuje
contribution, emituje SimulationFact, tworzy sensowne edges, rozróżnia
positive/negative factors, nie tworzy korelacyjnych edges; Architect
Influence poprawnie zanika i rozcieńcza się przy niezależnych
przyczynach.

**Ryzyka:** **HIGH** --- integracja wsteczna z 12 wcześniejszymi
milestone'ami jest z definicji ryzykowna; mitygacja: `IMPL-012`
wymagał, by każdy milestone od M5 **już** przewidywał punkty emisji
faktów, więc M17 głównie **domyka i weryfikuje** istniejące hooki,
zamiast doszywać je retrospektywnie od zera.

**Poza zakresem:** WHY? UI/API (M18), Chronicle integration (M19),
pełna Experiment Branching (post-VS, `SAVE-011` TARGET).

**Źródła:** `FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` (całość,
zwłaszcza §1--60, §101--104), `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(CAUS-001--010).

------------------------------------------------------------------------

## M18 --- WHY?

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

```text
CE-08 WHY? -- ranking, path traversal, explanation model
architect/butterfly -- query, ranking, anti-explosion
```

**Dane:** brak nowego contentu; WHY? zwraca structured data
(IDs/enums/payload), lokalizacja renderuje język (`CONTENT-014`).

**Testy:** WHY? immediate test, WHY? chain test, WHY NOT? test,
butterfly query test, WHY? noise test (brak szumu trywialnych
przyczyn), determinism (te same dane = te same przyczyny w tej samej
kolejności).

**Acceptance Gate:** dla dowolnej istotnej zmiany w Black Mountain
(np. wzrost ceny żelaza) WHY? zwraca 2--5 głównych przyczyn z
poprawną siłą/confidence; dla interwencji Architekta Butterfly Query
zwraca realną listę downstream consequences, nie wszystkie possible
events.

**Ryzyka:** średnie --- ryzyko nadmiaru szumu w wynikach przy gęstym
grafie przyczynowym (mitygacja: `WHY? Ranking`, `Duplicate Path
Suppression`, `Causal Query Limits` już zdefiniowane w spec).

**Poza zakresem:** pełne UI (widoki WHY?/Butterfly to `M21`), Chronicle
(M19).

**Źródła:** `FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` (§29--43,
§70--79), `FIRST-CAUSE-Architect-Intervention-Influence-Spec-v0.1.md`
(§46--53, §70--72), `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(CAUS-006--008).

**Checkpoint:** **CP3 --- Explainable World** i **CP5 --- Architect
Playable** (wraz z M16+M17) osiągnięte po tym milestone.

------------------------------------------------------------------------

## M19 --- Chronicle

**Faza:** G --- History · **Priorytet:** P0 · **Złożoność:** M/L ·
**Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** system wybiera i zapisuje historycznie istotne wydarzenia z
oceną Historical Significance (0--100), bez tworzenia własnej historii
--- Chronicle wybiera to, co stworzyła symulacja.

**Zależności:** M18.

**Implementowane systemy:** Chronicle Candidate Pipeline, Historical
Significance (Magnitude, Duration, PopulationAffected,
GeographicScope, Novelty, CausalImpact), Aggregation, sensitivity
filters (Concise/Standard/Detailed), Chronicle Entry storage,
Entity/Region/World Chronicle, template-first localization.

**Moduły (`CH-01`...`CH-07`, `CH-13`, `CH-14` z Chronicle Spec §207;
`CH-08`--`CH-12` jako P1 rozszerzenie w tym samym milestone, jeśli czas
pozwala, ale nie blokują):**

```text
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

**Testy:** source integrity test (brak fabrykacji), no false
aggregation test, sensitivity test, localization test, determinism
test, Black Mountain chronicle test.

**Acceptance Gate (Chronicle Spec §208):** każdy candidate ma score
wynikający z danych; lokalny kontekst jest uwzględniony; novelty i
causal impact działają; Black Mountain generuje spójną, zrozumiałą
kronikę bez wymuszonego dramatyzmu.

**Ryzyka:** średnie --- ryzyko „spamu" nieistotnych wpisów lub
odwrotnie ciszy tam, gdzie powinno być wydarzenie (mitygacja: `Spam
Detection`, `Silence Detection`, `Category Balance` już zdefiniowane w
spec; „silence is valid" jest jawnie dopuszczalnym stanem ---
`CHRON-005`).

**Poza zakresem:** Historical Threads/Retrospective
Significance/Turning Points jako pełne P0 (P1, mogą wejść później bez
blokowania VS Freeze), Era Detection (TARGET, nie VS).

**Źródła:** `FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md`
(całość, zwłaszcza §1--30, §150--159, §207--210),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (CHRON-001--007).

**Checkpoint:** **CP4 --- Historical World** osiągnięty po tym
milestone.

------------------------------------------------------------------------

## M20 --- Save/Load (pełna integracja)

**Faza:** L --- Save & Long-Run (cross-cutting) · **Priorytet:** P0 ·
**Złożoność:** M · **Ryzyko:** MEDIUM-HIGH · **Documentation
Readiness:** READY

**Cel:** save/load obejmuje **cały** World State ze wszystkich
milestone'ów M0--M19, z pełnymi wersjami, migracjami i kompaktacją
historii przyczynowej --- podstawowy roundtrip istniał od M3, tu
następuje pełna integracja i certyfikacja.

**Zależności:** M19 (musi obejmować Chronicle/Causality state, nie
tylko World State).

**Implementowane systemy:** SaveGame envelope
(`schemaVersion/contentVersion/engineVersion/generatorVersion/
worldSeed/tick/rngState/worldState/architectState/causalState/
chronicleState/metadata/checksum`), atomic save, save migrations
(`vN → vN+1`), HOT/WARM/PERMANENT compaction, layer checksums.

**Moduły (`packages/persistence`):**

```text
persistence/envelope
persistence/atomic-write -- serialize→validate→temp→flush→rename
persistence/migrations
persistence/compaction -- causal history HOT/WARM/PERMANENT
persistence/checksum -- world + layer checksums
```

**Dane:** brak nowego contentu.

**Testy:** save roundtrip (pełny World State), migration roundtrip,
determinism test suite (save/load, speed independence ×1=×100,
container order, RNG isolation), causal save integrity, HOT/WARM/
PERMANENT memory test.

**Acceptance Gate:** zapisany i wczytany świat ma identyczny
checksum; ×1 i ×100 po tej samej liczbie ticków dają identyczny stan;
uszkodzony zapis nie nadpisuje ostatniego poprawnego pliku; migracja
`v1→v2` (jeśli wystąpi w trakcie developmentu) jest deterministyczna.

**Ryzyka:** największe ryzyko rozmiaru save to historia przyczynowa,
nie same regiony (`PERF-007`) --- mitygacja: compaction jest częścią
architektury od tego milestone'u, nie dodatkiem post-hoc.

**Poza zakresem:** Experiment Branching pełne (TARGET/wczesny MVP),
cloud saves (post-Steamworks), binary serialization (dopiero po
benchmarkach, jeśli JSON+gzip nie wystarcza).

**Źródła:** `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
(§31--99, §200--213), `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(SAVE-001--011).

------------------------------------------------------------------------

## M21 --- UI Vertical Slice

**Faza:** J --- Player Experience · **Priorytet:** P0 · **Złożoność:**
L · **Ryzyko:** MEDIUM · **Documentation Readiness:** READY

**Cel:** pełny, spójny UI Vertical Slice na stabilnych Read Models ---
World Command Center, Living Atlas, Region Detail, Economy/Market/
Company, Technology, WHY?, Chronicle, Architect Panel, Butterfly
Effect --- zbudowany na tym, co realnie istnieje w silniku (surowy UI
debug shell mógł istnieć od M3 równolegle, ale to tutaj powstaje
docelowy interfejs gracza).

**Zależności:** M20 (musi renderować stabilne, zapisane read models,
nie tylko live state).

**Implementowane systemy:** wszystkie 12 minimalnych ekranów VS
(`VS-004`), main UX loop (`OBSERVE → NOTICE CHANGE → ASK WHY? →
INTERVENE → RUN TIME → REVIEW CONSEQUENCES`).

**Moduły (`UI-01`...`UI-14` z UI/UX Spec §211):**

```text
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

**Testy:** React Testing Library dla komponentów i read model
rendering; Playwright E2E (`start gry → new world → run simulation →
save → load → WHY? → Architect intervention → nawigacja`); UX testy
jakościowe z Simulation Test Spec §198--206 (World Awareness, Region
Understanding, WHY?, Intervention, Chronicle, Butterfly).

**Acceptance Gate (UI/UX Spec §212--217, per ekran):** Command Center
pokazuje stan świata bez wymogu klasycznej mapy; Living Atlas
nawiguje po 32 regionach z overlayami; WHY?/Chronicle/Architect
działają end-to-end na prawdziwych danych z Black Mountain.

**Ryzyka:** średnie --- duża powierzchnia UI (12 ekranów); mitygacja:
kolejność `UI-01`...`UI-14` jest już ustalona i priorytetyzuje
Command Center/Atlas/Region przed Butterfly/polish.

**Poza zakresem:** pełna 3000-regionowa wirtualizacja (M26), pełny
Design System jako osobny dokument (`Master Audit` §240 --- nie jest
blockerem).

**Źródła:** `FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1.md`
(całość, zwłaszcza §1--50, §180--221), `FIRST-CAUSE-Canonical-
Decisions-v0.1.md` (UI-001--013), `FIRST-CAUSE-Vertical-Slice-Spec-
v0.1.md` (§41--45).

------------------------------------------------------------------------

## M22 --- World Generation (proceduralny)

**Faza:** I --- World Generation · **Priorytet:** P0 · **Złożoność:**
L · **Ryzyko:** HIGH · **Documentation Readiness:** READY

**Cel:** proceduralny generator tworzy 32-regionowy Reference VS z
dowolnego seeda, deterministycznie, przy użyciu tych samych evaluatorów
co runtime (nie osobnej logiki „balansowania" świata).

**Zależności:** M21. *(Silnik i wszystkie evaluatory --- production
viability, PM eligibility, settlement placement --- muszą być stabilne,
bo generator ich używa --- World Generation Spec §25.)*

**Implementowane systemy:** pełny 31-etapowy Generation Pipeline
(config → seed/RNG → World → continents → topology → terrain → climate
→ water → fertility → connections → EffectiveDistance → deposits →
habitability → population → cohorts → settlements → cultures →
knowledge → infrastructure → companies → inventories → services/
housing → markets/prices → indexes → invariants → viability →
deterministic repair → checksum → freeze Tick 0), GenerationReport,
deterministic repair, World Quality Metrics, Validation Gates
`WG-A`...`WG-K`.

**Moduły (`packages/worldgen`):**

```text
worldgen/config, worldgen/rng, worldgen/topology, worldgen/geography,
worldgen/climate, worldgen/water, worldgen/resources,
worldgen/habitability, worldgen/population, worldgen/settlements,
worldgen/culture, worldgen/knowledge, worldgen/infrastructure,
worldgen/economy, worldgen/markets, worldgen/validation,
worldgen/repair, worldgen/report, worldgen/checksum
```

**Dane:** `WorldGenerationConfig` dla presetu `vertical_slice_reference`
(32 regiony, 1 kontynent, ~200 populacji --- World Generation Spec §34).
Najpierw prototyp 8--12 regionów (§64), potem pełny 32-regionowy VS.

**Testy:** unit/stage/invariant/property-based/seed-sweep/scenario/
determinism/performance testy z §51; layer checksums (topology,
geography, resources, population, settlements, knowledge,
infrastructure, economy, full world); Black Mountain generator test
(§53): hidden Iron Ore istnieje, mine nie jest wymuszone, route do
rynku istnieje.

**Acceptance Gate (World Generation Spec §67, VS-scoped):** ten sam
seed daje ten sam świat; powstaje 32-regionowy graf zróżnicowany
geograficznie/surowcowo; hidden deposits istnieją przed discovery;
population/cohorts/settlements/kultury są spójne; GenerationReport i
checksum działają; Tick 1 startuje bez ukrytej korekty; Black Mountain
generuje się bez specjalnej logiki; można uruchomić test 200-letni.

**Ryzyka:** **HIGH** --- generator musi współdzielić evaluatory z
całym silnikiem (12+ wcześniejszych milestone'ów) bez tworzenia
drugiej, sprzecznej definicji „viable"; mitygacja: `World Generation
Spec §25` explicite tego wymaga, a seed-sweep testy (setki/tysiące
seedów) wykrywają pathological cases przed uznaniem generatora za
gotowy.

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
wygenerowany odpowiednik z M22), bez naruszenia invariants, z
sensownym, nie wymuszonym wynikiem.

**Zależności:** M22.

**Implementowane systemy:** brak nowych systemów --- integracja i
tuning wszystkich poprzednich (`AI-12 Black Mountain tuning` z AI
Decision Model wraca tutaj).

**Moduły:**

```text
AI-12 Black Mountain tuning
tests/scenarios/black_mountain -- BM-01...BM-15 z Simulation Test Spec
```

**Dane:** brak nowego contentu; tuning parametrów configu (nie nowa
mechanika --- `IMPL-011`).

**Testy (Simulation Test Spec §100--116, BM-01...BM-15):** Discovery →
Mine Founding/No Mine → Employment → Wage Pressure → Migration →
Settlement Growth → Secondary Economy → Trade → Technology →
Depletion → Post-Depletion Transition → Causal Chain (WHY? wyjaśnia
cały łańcuch) → Architect Butterfly → No-Script Detection (brak `if
region == black_mountain` w generic modules).

**Acceptance Gate (`Canonical Decisions TEST-004/005`):** Black
Mountain kończy jako jeden z dopuszczalnych wyników (`NO_DEVELOPMENT,
RESOURCE_BOOM, INDUSTRIALIZATION, RESOURCE_BUST, DIVERSIFICATION,
IMPORT_TRANSITION, TECHNOLOGICAL_EXTENSION, GHOST_SETTLEMENT`)
wynikający z danych i mechaniki; 2400 ticków przechodzi bez naruszenia
invariants; WHY? potrafi wyjaśnić cały łańcuch przyczynowy; Chronicle
wybiera istotne wydarzenia z tego przebiegu.

**Ryzyka:** **HIGH** --- to pierwszy test, w którym wszystkie systemy
działają jednocześnie przez długi czas; najbardziej prawdopodobne
miejsce ujawnienia emergentnych błędów/oscylacji nagromadzonych z
poprzednich milestone'ów. Mitygacja: to świadomy, wydzielony gate
(§137 Master Audit: „nie wdrażać całej gry moduł po module bez
pionowego testu" --- tu następuje pełny pionowy test).

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

**Moduły:**

```text
benchmarks/ -- pnpm bench:sim, pnpm bench:worldgen (preset 32 jako
  baseline; 250-3000 to M26)
profiling/ -- ms/tick, ms/system/tick, memory, GC pressure
```

**Dane:** brak nowego contentu.

**Testy:** headless benchmark (`pnpm sim:run --fixture black_mountain
--years 200`), performance regression tests, slow tick detector,
memory leak detector.

**Acceptance Gate (`Save/Determinism/Performance Gate P0 --- VS`):**
Reference VS (32 regiony) mieści się w uzgodnionym baseline
ms/tick i pamięci (dokładne liczby --- `officialMaxRegions`/budgety ---
pozostają `OPEN` do czasu zebrania pierwszych realnych pomiarów, zgodnie
z `IMPL-011`: nie wymyślamy liczb, dopóki nie mamy danych).

**Ryzyka:** średnie-wysokie --- ryzyko przedwczesnej mikro-
optymalizacji kosztem czytelności (mitygacja: `PERF-006` wymaga
najpierw correctness/determinism/profiling, dopiero potem
optymalizacji --- ten porządek jest już zachowany, bo M24 następuje po
M23).

**Poza zakresem:** benchmark ladder 250--3000 regionów (M26), Rust/
WASM migration (tylko jeśli profiling **po** tym milestone wykaże
realny bottleneck --- `Technology Stack Decision §100 Kill criteria`).

**Źródła:** `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
(§100--163, §401--168 Gate P0), `FIRST-CAUSE-Canonical-Decisions-
v0.1.md` (PERF-001--007).

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
(sekcja 12) i `Canonical Decisions` jeśli coś wymagało korekty w
trakcie implementacji.

**Dane:** brak nowego contentu.

**Testy:** pełny przebieg wszystkich bramek `Gate A: Data` ... `Gate J:
200-Year Stability` z Simulation Test Spec §212--221.

**Acceptance Gate (Simulation Test Spec §222--223, „Kryterium
przejścia VS → MVP"):** wszystkie Gates A--J zielone; Vertical Slice
Definition of Tested spełniony; `Success Condition` z `Canonical
Decisions VS-006` zademonstrowany: „Tworzę świat. Zmieniam jeden
warunek. Uruchamiam czas. Świat sam reaguje. Po dekadach widzę
konsekwencje, których nie wybierałem ręcznie, i mogę prześledzić ich
rzeczywiste przyczyny."

**Ryzyka:** niskie --- to gate administracyjny, zakładający że M0--M24
zostały rzetelnie ukończone.

**Poza zakresem:** wszystko, co jest w sekcji 8 (DEFERRED) oraz M26--
M29 (post-VS).

**Źródła:** `FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` (§212--226),
`FIRST-CAUSE-Canonical-Decisions-v0.1.md` (VS-006).

**Checkpoint:** **CP7 --- Vertical Slice** osiągnięty.

------------------------------------------------------------------------

# 11. Milestone'y post-VS (droga do MVP) --- M26--M29

Poniższe milestone'y **nie są wymagane do VS Freeze**. Odpowiadają
Phase K (Scale) i części Phase L (Save & Long-Run) z propozycji
wyjściowej oraz części Phase M dotyczącej rozszerzenia contentu.
Wymieniono je dla kompletności harmonogramu, ale zgodnie z `IMPL-002`
nie powinny się rozpoczynać przed `M25`.

## M26 --- Scale Certification (250 → 3 000 regionów)

**Priorytet:** P1 (poza VS) · **Złożoność:** L · **Ryzyko:** HIGH ·
**Documentation Readiness:** READY

**Cel:** certyfikacja presetów `Small (~250) → Standard (~600) → Large
(~1200) → Huge (~2000) → Architecture Target (do 3000)` względem Gates
P1--P4.

**Zależności:** M25.

**Testy/Acceptance Gate:** `Save/Determinism/Performance Spec` Gates
P1--P4 (§164--169), benchmark matrix `TEST_SMALL...TEST_STRESS`
(§219--225 Simulation Test Spec).

**Ryzyka:** `officialMaxRegions` jest jawnie `OPEN` --- ustalany dopiero
po tych benchmarkach (`OPEN-001`), nie zakładać z góry liczby.

**Źródła:** `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
(§163--169, §198--225).

## M27 --- Long-Run Certification (500 i 1000 lat)

**Priorytet:** P1 (500 lat) / P2 (1000 lat, target) · **Złożoność:** M
· **Ryzyko:** MEDIUM · **Documentation Readiness:** READY

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
goods/28 company archetypes (`ECO-001--003`), oraz z EN/PL do
docelowych 14 języków (`CONTENT-004`).

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

Aktualny stan po M0.1 (2026-09-15): M0 = DONE, maintenance M0.1 = DONE,
M1 = READY (nierozpoczęte). **Ten dokument jest żywy --- po ukończeniu każdego
milestone'u aktualizujemy Status, a w razie potrzeby także Ryzyka i
Dependencies poniższych wierszy, nie zmieniając historii już
ukończonych pozycji bez wyraźnego powodu (patrz sekcja 13).**

  Milestone   Status    Priorytet   Złożoność   Ryzyko        Zależności
  ----------- --------- ----------- ----------- ------------- ------------
  M0          DONE      P0          S           LOW           ---
  M1          READY     P0          M           MEDIUM        M0
  M2          BACKLOG   P0          M           LOW-MEDIUM    M1
  M3          BACKLOG   P0          M           MEDIUM        M1, M2
  M4          BACKLOG   P0          S/M         MEDIUM        M3
  M5          BACKLOG   P0          S           LOW           M4
  M6          BACKLOG   P0          M           MEDIUM        M4
  M7          BACKLOG   P0          M           MEDIUM        M5, M6
  M8          BACKLOG   P0          M           HIGH          M7
  M9          BACKLOG   P0          M           MEDIUM        M8
  M10         BACKLOG   P0          M           MEDIUM        M9
  M11         BACKLOG   P0          L           HIGH          M10
  M12         BACKLOG   P0          M           MEDIUM-HIGH   M11
  M13         BACKLOG   P0          M           MEDIUM        M12
  M14         BACKLOG   P0          S/M         MEDIUM        M13
  M15         BACKLOG   P0          L           MEDIUM-HIGH   M14
  M16         BACKLOG   P0          M           MEDIUM        M15
  M17         BACKLOG   P0          L           HIGH          M16
  M18         BACKLOG   P0          M           MEDIUM        M17
  M19         BACKLOG   P0          M/L         MEDIUM        M18
  M20         BACKLOG   P0          M           MEDIUM-HIGH   M19
  M21         BACKLOG   P0          L           MEDIUM        M20
  M22         BACKLOG   P0          L           HIGH          M21
  M23         BACKLOG   P0          M           HIGH          M22
  M24         BACKLOG   P0          M/L         MEDIUM-HIGH   M23
  M25         BACKLOG   P0          S           LOW           M24
  M26         BACKLOG   P1          L           HIGH          M25
  M27         BACKLOG   P1/P2       M           MEDIUM        M26
  M28         BACKLOG   P1/P2       L           MEDIUM        M25
  M29         BACKLOG   P2          M           MEDIUM        M26, M28

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

Nie zmieniamy retrospektywnie opisu **już ukończonych** milestone'ów
bez wyraźnego powodu (np. odkrytego błędu w tym dokumencie) --- historia
decyzji ma pozostać czytelna. Jeśli w trakcie implementacji milestone'u
okaże się, że dokumentacja systemowa nie rozstrzyga jakiejś wartości
tuningowej, stosujemy `IMPL-011` (configurable placeholder + TODO
tuning), a nie modyfikujemy zakresu tego dokumentu w locie.

------------------------------------------------------------------------

# 14. Zasada końcowa

> **Ten harmonogram odpowiada na pytanie: co dokładnie implementujemy
> następne, dlaczego właśnie teraz, od czego to zależy i po czym
> poznamy, że możemy przejść dalej.**

Następny krok: **`M1 --- Deterministic Core`**, zgodnie z jego zakresem
i Documentation Readiness w sekcji 10. M0.1 kończy się na poprawkach
audytowych; M1 wymaga osobnego zadania implementacyjnego.

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE Implementation Roadmap v0.1**
