# FIRST CAUSE --- Technology Stack Decision v0.1

**Status:** CANONICAL / APPROVED FOR VERTICAL SLICE\
**Projekt:** FIRST CAUSE\
**Wersja:** 0.1\
**Zakres:** repozytorium, runtime, UI, symulacja, dane, testy,
save/load, lokalizacja, profiling i build PC/Steam\
**Dokument nadrzędny:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md`

> **Priorytetem nie jest najbardziej „growy" silnik. Priorytetem jest
> stos technologiczny najlepiej pasujący do tekstowo-analitycznej,
> deterministycznej symulacji świata i możliwy do utrzymania przez
> mały/solo zespół wspierany przez agentów kodujących.**

------------------------------------------------------------------------

# 1. Decyzja w skrócie

Dla FIRST CAUSE v0.1 wybieramy:

  -----------------------------------------------------------------------
  Warstwa                             Decyzja
  ----------------------------------- -----------------------------------
  Główny język                        **TypeScript**

  Runtime desktop                     **Electron**

  UI                                  **React**

  Bundler/dev server                  **Vite**

  World Network / Living Atlas        **PixiJS**

  State UI                            **Zustand**

  Walidacja runtime/config            **Zod**

  Testy                               **Vitest**

  Testy UI                            **React Testing Library**

  E2E                                 **Playwright**

  Dane contentu                       **JSON + Zod schemas**

  Lokalizacja                         **i18next + react-i18next**

  Save v0.1                           **wersjonowany JSON + kompresja
                                      gzip**

  RNG                                 **własny deterministic seeded RNG z
                                      nazwanymi streamami**

  Money                               **integer/fixed-scale, bez float
                                      jako canonical money**

  Profiling                           **Node/Electron profiler + własne
                                      telemetry/tick timings**

  Logowanie                           **strukturalne logi JSON w
                                      development**

  Repo                                **Git + GitHub, jeden monorepo**

  Package manager                     **pnpm**

  CI                                  **GitHub Actions**

  Formatowanie                        **Prettier**

  Lint                                **ESLint**

  Steam                               **integracja dopiero po stabilnym
                                      VS; adapter Steamworks odseparowany
                                      od core**
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 2. Dlaczego nie wybieramy klasycznego game engine jako fundamentu

FIRST CAUSE nie jest grą opartą przede wszystkim na: - fizyce, -
animacji 3D, - scenach, - renderowaniu dużej liczby sprite'ów, -
sterowaniu postacią.

Jej rdzeń to: - miesięczna symulacja, - duża liczba tabelarycznych
danych, - wykresy i inspektory, - Chronicle, - WHY?, - World Command
Center, - Living Atlas / World Network, - rozbudowane narzędzia
debugowe.

React/HTML/CSS jest znacznie naturalniejszym środowiskiem dla takiego
interfejsu niż klasyczny scene graph silnika gier.

------------------------------------------------------------------------

# 3. Dlaczego TypeScript

TypeScript zostaje głównym językiem zarówno dla Simulation Core, jak i
UI.

Korzyści: - jeden język w całym repo, - bardzo dobre wsparcie Claude
Code, Codex i OpenCode, - szybkie prototypowanie, - silne typowanie, -
bardzo dobry ekosystem testowy, - proste modelowanie data-driven
content, - brak kosztu komunikacji między dwoma językami, - łatwe
tworzenie narzędzi developerskich.

Najważniejsza zasada:

> **TypeScript nie zwalnia nas z projektowania pod wydajność.**

Architektura musi nadal unikać O(N²), nadmiernych alokacji i globalnych
scanów.

------------------------------------------------------------------------

# 4. Dlaczego Electron

Electron jest świadomym wyborem dla PC/Steam.

Najważniejsze argumenty: - stabilny Chromium, - pełny Node.js po stronie
main/worker, - dojrzałe narzędzia, - bardzo dobre wsparcie React, -
proste worker threads, - łatwe debugowanie, - przewidywalne zachowanie
na Windows, - łatwiejsza praca dla agentów AI niż bardziej egzotyczny
stack.

Koszt: - większe zużycie RAM, - większy rozmiar builda.

Dla FIRST CAUSE jest to akceptowalne, ponieważ gra nie konkuruje o
budżet pamięci z ciężkim 3D.

------------------------------------------------------------------------

# 5. Dlaczego nie Tauri + Rust na start

Tauri/Rust może później dać: - mniejszy build, - niższy RAM, - bardzo
szybki backend.

Nie wybieramy go na Vertical Slice, ponieważ zwiększa: - liczbę
języków, - koszt debugowania, - IPC complexity, - próg wejścia, - koszt
zmian modelu danych.

Jeżeli benchmarki wykażą, że TypeScript Simulation Core jest
rzeczywistym bottleneckiem, wybrane hot paths można później przenieść do
Rust/WASM lub native module.

**Nie robimy tego przed profilingiem.**

------------------------------------------------------------------------

# 6. Dlaczego nie Godot jako główny stack

Godot pozostaje dobrym rozwiązaniem dla wielu gier, ale w FIRST CAUSE
większość UI przypomina: - analityczne panele, - tabele, - timeline, -
filtry, - wyszukiwarki, - rozbudowane tooltips, - inspektory danych.

React jest do tego naturalniejszy.

Godot nie daje wystarczającej przewagi, aby uzasadnić rezygnację z
webowego modelu UI.

------------------------------------------------------------------------

# 7. Architektura procesów

Docelowo:

``` text
ELECTRON MAIN
│
├── File System / Save / Load
├── Window lifecycle
├── Steam adapter
└── Simulation Worker management
        │
        ▼
SIMULATION WORKER
│
├── Deterministic Core
├── World State
├── Systems
├── AI
├── Causality
├── Chronicle
├── Save snapshot preparation
└── Read Model generation
        │
        ▼
REACT RENDERER
│
├── World Command Center
├── Living Atlas
├── Economy
├── Technology
├── Chronicle
├── WHY?
└── Architect
```

------------------------------------------------------------------------

# 8. Simulation nie działa w React Renderer

**CANONICAL**

Simulation Engine nie wykonuje ticków w głównym wątku UI.

Działa w dedicated worker.

UI otrzymuje: - read models, - deltas, - summaries, - query responses.

Dzięki temu ×100 nie powinno zamrażać interfejsu.

------------------------------------------------------------------------

# 9. Granica Simulation ↔ UI

UI nie otrzymuje prawa do bezpośredniej mutacji World State.

Przepływ:

``` text
UI Command
→ Simulation Worker
→ validate
→ apply at defined boundary
→ simulate
→ emit Read Model / Result
→ UI
```

------------------------------------------------------------------------

# 10. Monorepo

Rekomendowana struktura:

``` text
first-cause/
├── apps/
│   └── desktop/
├── packages/
│   ├── simulation/
│   ├── worldgen/
│   ├── entities/
│   ├── content/
│   ├── causality/
│   ├── chronicle/
│   ├── persistence/
│   ├── localization/
│   ├── shared/
│   └── ui/
├── content/
│   ├── resources/
│   ├── goods/
│   ├── companies/
│   ├── production-methods/
│   ├── discoveries/
│   ├── terrain/
│   └── world-presets/
├── locales/
│   ├── en/
│   └── pl/
├── tests/
├── benchmarks/
├── docs/
└── tools/
```

------------------------------------------------------------------------

# 11. Package manager

**pnpm**.

Powody: - szybki, - dobry dla monorepo, - workspace support, - oszczędza
miejsce, - dobrze współpracuje z TypeScript/Vite.

------------------------------------------------------------------------

# 12. Build system

Na początku: - pnpm workspaces, - TypeScript project references tam,
gdzie potrzebne, - Vite dla renderer.

Nie dodajemy Turborepo/Nx bez realnej potrzeby.

------------------------------------------------------------------------

# 13. UI --- React

React odpowiada za warstwę prezentacji.

Reguła:

> **React renderuje stan. Nie symuluje świata.**

Komponenty UI nie implementują reguł ekonomii, migracji, technologii ani
AI.

------------------------------------------------------------------------

# 14. UI state --- Zustand

Zustand służy wyłącznie do: - UI state, - selected entity, - filters, -
panels, - overlays, - cached read models, - presentation preferences.

Nie jest canonical World State.

------------------------------------------------------------------------

# 15. Living Atlas --- PixiJS

World Network będzie renderowany przez PixiJS osadzony w React.

Powody: - tysiące węzłów są naturalniejsze dla canvas/WebGL niż DOM, -
łatwe zoom/pan, - clustering/LOD, - custom edges, - overlays.

------------------------------------------------------------------------

# 16. DOM vs PixiJS

DOM/React: - tabele, - tekst, - Chronicle, - WHY?, - inspektory, -
formularze.

PixiJS: - World Network, - duża liczba nodes/edges, - spatial overlays.

Nie renderujemy całej aplikacji w canvas.

------------------------------------------------------------------------

# 17. Styling

Preferencja: - CSS Modules albo dobrze uporządkowany plain CSS, - CSS
variables dla Design Tokens.

Nie wprowadzamy ciężkiego UI frameworka typu Material UI jako
fundamentu.

FIRST CAUSE ma posiadać własny, anti-SaaS design language.

------------------------------------------------------------------------

# 18. Design Tokens

Centralnie definiujemy: - spacing, - typography, - border widths, -
panel backgrounds, - semantic colors, - focus states, - z-index layers.

Bez losowych wartości w komponentach.

------------------------------------------------------------------------

# 19. Content Data

Content przechowujemy początkowo w **JSON**.

Przykłady: - resources, - goods, - company archetypes, - PMs, -
discoveries, - terrain definitions, - presets.

------------------------------------------------------------------------

# 20. Dlaczego JSON

-   prosty,
-   łatwy do generowania i audytu przez AI,
-   łatwy do diffowania,
-   bezpieczny,
-   bez executable content,
-   naturalny dla TypeScript.

------------------------------------------------------------------------

# 21. Zod

Każdy typ contentu ma Zod schema.

Pipeline:

``` text
JSON
→ parse
→ Zod validation
→ semantic validation
→ immutable Definition Registry
```

------------------------------------------------------------------------

# 22. Semantic validation

Zod sprawdza strukturę.

Osobny validator sprawdza: - missing refs, - duplicate IDs, - dependency
cycles, - phase violations, - invalid production chains, - missing
localization keys.

------------------------------------------------------------------------

# 23. Stable Content IDs

Format: - snake_case, - language-neutral, - immutable po publikacji
save-compatible content.

Przykłady: `iron_ore`, `steel`, `crop_farm`, `basic_smelting`.

------------------------------------------------------------------------

# 24. TypeScript strict mode

`strict: true` jest obowiązkowe.

Dodatkowo preferowane: - `noUncheckedIndexedAccess`, -
`exactOptionalPropertyTypes` po sprawdzeniu ergonomii, - brak `any` w
Simulation Core bez jawnego uzasadnienia.

------------------------------------------------------------------------

# 25. Entity representation

Nie budujemy głębokiej hierarchii klas OOP.

Preferowane: - typed data objects, - registries, - IDs, - pure/system
functions.

------------------------------------------------------------------------

# 26. ECS

Nie wprowadzamy pełnego ECS.

FIRST CAUSE nie potrzebuje klasycznego game ECS.

Można stosować data-oriented patterns lokalnie bez narzucania ECS całemu
modelowi.

------------------------------------------------------------------------

# 27. Money

Canonical money: **integer/fixed-scale**.

Nie używamy zwykłego floating point jako source of truth dla pieniędzy.

------------------------------------------------------------------------

# 28. Inne wartości liczbowe

Wartości ciągłe mogą używać `number`, ale: - muszą być finite, - mają
jawne zakresy, - determinism tests kontrolują wyniki, - rounding policy
jest centralna.

------------------------------------------------------------------------

# 29. RNG

Tworzymy własny moduł deterministic RNG.

API koncepcyjne:

``` text
rng.stream("migration")
rng.stream("company_ai")
rng.stream("discovery")
```

------------------------------------------------------------------------

# 30. RNG requirements

-   seedowany,
-   wersjonowany,
-   testowany golden vectors,
-   bez `Math.random()` w Simulation Core,
-   osobne streamy,
-   stan streamów zapisywalny, jeśli wymaga tego continuation model.

------------------------------------------------------------------------

# 31. Tick

Tick używa integer: `tick = 0, 1, 2...`

Data świata jest wyprowadzana z ticka, a nie systemowego zegara.

------------------------------------------------------------------------

# 32. Simulation Systems

Każdy system powinien posiadać czytelny kontrakt:

``` text
read
→ calculate intentions/results
→ validate
→ commit
→ emit facts
```

------------------------------------------------------------------------

# 33. Pure calculation

Tam, gdzie praktyczne, calculation phase powinna być pure i testowalna
bez całej aplikacji.

------------------------------------------------------------------------

# 34. Runtime indexes

World State utrzymuje jawne indeksy/cache: - companiesByRegion, -
cohortsByRegion, - depositsByRegion, - settlementsByRegion, -
connectionsByRegion, - companiesByInput/output, - discoveriesByDomain.

Cache musi być reconstructible.

------------------------------------------------------------------------

# 35. Performance rule

Każdy PR dodający globalny scan w miesięcznym ticku powinien być
traktowany jako performance-sensitive.

Nie znaczy to, że każdy scan jest zakazany; musi być świadomy.

------------------------------------------------------------------------

# 36. Save format v0.1

Vertical Slice używa: - wersjonowanego JSON snapshot, - gzip
compression, - atomic write.

------------------------------------------------------------------------

# 37. Dlaczego JSON save na początku

Najważniejsze na tym etapie: - debugowalność, - możliwość diffowania, -
migracje, - łatwy inspection, - szybka iteracja.

Binary format można wprowadzić po benchmarkach.

------------------------------------------------------------------------

# 38. Save envelope

Minimum:

``` text
schemaVersion
contentVersion
engineVersion
generatorVersion
worldSeed
tick
rngState
worldState
architectState
causalState
chronicleState
metadata
checksum
```

------------------------------------------------------------------------

# 39. Atomic Save

Zapis: 1. serialize, 2. validate, 3. write temp, 4. flush, 5.
rename/replace.

Uszkodzony zapis nie powinien nadpisywać ostatniego poprawnego pliku.

------------------------------------------------------------------------

# 40. Save migrations

Migracje są jawne:

``` text
v1 → v2
v2 → v3
```

Nie piszemy „magicznego" loadera próbującego zgadnąć wersję.

------------------------------------------------------------------------

# 41. Save performance trigger

Jeżeli JSON+gzip nie spełnia benchmarków: - mierzymy, - identyfikujemy
ciężkie warstwy, - dopiero wtedy rozważamy MessagePack/binary/chunked
persistence.

------------------------------------------------------------------------

# 42. Causal history storage

Największe ryzyko save size to: - SimulationFacts, - CausalEdges, -
DecisionSnapshots.

Dlatego HOT/WARM/PERMANENT compaction musi być częścią persistence.

------------------------------------------------------------------------

# 43. Test framework

**Vitest** jest głównym frameworkiem testowym.

Kategorie: - unit, - system, - integration, - scenario, - determinism, -
long-run, - property/invariant, - benchmark smoke.

------------------------------------------------------------------------

# 44. UI tests

React Testing Library: - komponenty, - read model rendering, -
interaction behavior.

Nie testujemy implementacyjnych detali Reacta.

------------------------------------------------------------------------

# 45. E2E

Playwright: - start gry, - new world, - run simulation, - save, -
load, - WHY?, - Architect intervention, - basic navigation.

------------------------------------------------------------------------

# 46. Determinism tests

P0.

Testy: - same seed = same checksum, - save/load continuation, - ×1 =
×100 po tej samej liczbie ticków, - locale independence, -
iteration-order robustness tam, gdzie możliwe.

------------------------------------------------------------------------

# 47. Golden fixtures

Utrzymujemy: - BLACK_MOUNTAIN_REFERENCE, - FOOD_VALLEY, -
TRADE_CORRIDOR, - ISOLATED_REGION, - TECHNOLOGY_DIVERGENCE, -
URBAN_PRESSURE.

------------------------------------------------------------------------

# 48. Long-run tests

Reference: - 200 lat P0, - 500 lat P1, - 1000 lat target.

Testy mogą działać headless bez Electron UI.

------------------------------------------------------------------------

# 49. Headless simulation

`packages/simulation` musi być możliwe do uruchomienia bez aplikacji
desktopowej.

Przykład:

``` text
pnpm sim:run --fixture black_mountain --years 200
```

------------------------------------------------------------------------

# 50. Benchmark CLI

Powinien istnieć CLI:

``` text
pnpm bench:sim
pnpm bench:worldgen
```

z presetami: 32 / 250 / 600 / 1200 / 2000 / 3000.

------------------------------------------------------------------------

# 51. Profiling

Mierzymy minimum: - ms/tick, - ms/system/tick, - memory, -
allocations/GC pressure, - entity counts, - fact/edge growth, - save
size, - save/load time, - worldgen time.

------------------------------------------------------------------------

# 52. Performance budgets

Nie zamrażamy jeszcze finalnych liczb sprzętowych.

Najpierw zbieramy baseline dla Reference VS.

Dopiero potem certyfikujemy większe presety.

------------------------------------------------------------------------

# 53. Worker communication

Nie wysyłamy pełnego World State do React po każdym ticku.

Worker publikuje: - deltas, - summaries, - requested entity details, -
read models.

------------------------------------------------------------------------

# 54. ×100

×100: - nadal liczy każdy miesięczny tick, - ogranicza render/update
UI, - może batchować read-model notifications, - nie pomija Simulation
Systems.

------------------------------------------------------------------------

# 55. Localization

**i18next + react-i18next**.

Source locale: `en`.

P0: `en`, `pl`.

------------------------------------------------------------------------

# 56. Localization structure

Przykład:

``` text
locales/
  en/
    common.json
    economy.json
    technology.json
    chronicle.json
    architect.json
  pl/
    ...
```

------------------------------------------------------------------------

# 57. No strings in Simulation Core

Simulation Core zwraca: - IDs, - enums, - numeric payloads, - structured
explanations.

UI/localization tworzy zdania.

------------------------------------------------------------------------

# 58. Chronicle localization

Chronicle pozostaje template-first.

Przykład:

``` text
chronicle.resource_boom.started
```

-   structured payload.

------------------------------------------------------------------------

# 59. WHY? localization

Causality zwraca structured tree.

Nie zwraca gotowego polskiego lub angielskiego akapitu jako source of
truth.

------------------------------------------------------------------------

# 60. Locale independence

Zmiana języka nie może zmienić: - RNG, - checksum, - simulation state, -
kolejności decyzji AI.

------------------------------------------------------------------------

# 61. Logging

Development: strukturalne logi z kategoriami: - simulation, -
worldgen, - save, - causality, - ai, - validation, - performance.

Production ogranicza verbosity.

------------------------------------------------------------------------

# 62. Assertions

Development build powinien agresywnie wykrywać: - NaN, - Infinity, -
negative stock, - dangling refs, - impossible employment, - invalid IDs.

------------------------------------------------------------------------

# 63. Error boundaries

UI posiada React Error Boundaries.

Błąd panelu UI nie powinien automatycznie niszczyć save ani simulation
state.

------------------------------------------------------------------------

# 64. Crash diagnostics

Development zapisuje: - engine version, - seed, - tick, - last system, -
stack, - recent commands.

Bez niepotrzebnych danych użytkownika.

------------------------------------------------------------------------

# 65. Git

Repo używa Git/GitHub.

Branch model na start: - `main`, - krótkie feature branches opcjonalnie.

Nie komplikujemy GitFlow.

------------------------------------------------------------------------

# 66. Commits

Małe, tematyczne commity.

Każdy milestone powinien kończyć się: - tests green, - clean working
tree, - commit, - push.

------------------------------------------------------------------------

# 67. CI --- GitHub Actions

Na PR/push: 1. install, 2. lint, 3. typecheck, 4. unit/system tests, 5.
determinism smoke, 6. build.

Ciężkie long-run benchmarks nie muszą działać przy każdym commit.

------------------------------------------------------------------------

# 68. Lint i format

-   ESLint
-   Prettier

Automatyczne formatowanie eliminuje stylistyczne spory między agentami.

------------------------------------------------------------------------

# 69. Dependency policy

Preferujemy małą liczbę dojrzałych dependencies.

Nie instalujemy biblioteki do problemu, który wymaga 20 linii stabilnego
kodu.

------------------------------------------------------------------------

# 70. Lockfile

`pnpm-lock.yaml` jest commitowany.

Buildy powinny być reprodukowalne.

------------------------------------------------------------------------

# 71. Node/Electron versions

Repo pinuje: - Node version, - Electron version, - pnpm version.

Nie używamy „latest" jako trwałej specyfikacji.

------------------------------------------------------------------------

# 72. Security Electron

Obowiązkowo: - `contextIsolation: true`, - `nodeIntegration: false` w
renderer, - preload z minimalnym typed API, - brak arbitralnego dostępu
UI do filesystem.

------------------------------------------------------------------------

# 73. IPC

IPC posiada jawne typed channels/contracts.

Nie przesyłamy dowolnych obiektów bez walidacji.

------------------------------------------------------------------------

# 74. File System

Tylko Electron main/persistence layer zapisuje save'y.

React nie zapisuje plików bezpośrednio.

------------------------------------------------------------------------

# 75. Steam integration

Steam nie może przenikać do Simulation Core.

Adapter:

``` text
platform/
  steam/
  standalone/
```

------------------------------------------------------------------------

# 76. Steamworks timing

Integrację: - achievements, - cloud saves, - overlay, - stats

dodajemy po ustabilizowaniu lokalnego save/load i VS.

------------------------------------------------------------------------

# 77. Offline-first

Core FIRST CAUSE działa offline.

Internet nie jest wymagany do: - symulacji, - save/load, - Chronicle, -
WHY?, - world generation.

------------------------------------------------------------------------

# 78. Database

**Nie używamy SQLite jako canonical runtime World State w VS.**

World State jest strukturą in-memory.

SQLite można później rozważyć dla: - dużych archiwów, - narzędzi, -
telemetry/history index, jeśli benchmarki to uzasadnią.

------------------------------------------------------------------------

# 79. Redux

Nie wybieramy Redux jako fundamentu.

Zustand wystarcza dla presentation state; canonical simulation pozostaje
poza React.

------------------------------------------------------------------------

# 80. Graph library

Nie wybieramy ciężkiej gotowej biblioteki graph-editor jako fundamentu
Living Atlas.

PixiJS + własny layout/data adapter daje większą kontrolę nad LOD i
stylistyką.

------------------------------------------------------------------------

# 81. Charts

Na początku preferujemy lekkie rozwiązanie zgodne z potrzebami.

Nie zamrażamy biblioteki chartów przed prototypem Command Center.

Chart library jest decyzją lokalną UI, nie architekturą core.

------------------------------------------------------------------------

# 82. Dates

Simulation date jest funkcją: `startYear/startMonth + tick`.

Nie używamy JS `Date` jako canonical simulation clock.

------------------------------------------------------------------------

# 83. Serialization order

Checksum i determinism wymagają canonical serialization: - stable field
semantics, - sorted map/set entries, - stable entity ordering.

Nie polegamy na przypadkowej kolejności obiektów.

------------------------------------------------------------------------

# 84. Checksum

Wprowadzamy centralny `WorldChecksum`.

Na początku może używać stabilnego hash funkcji nad canonical
serialization.

Algorytm jest wersjonowany.

------------------------------------------------------------------------

# 85. Floating point determinism

JS `number` jest dopuszczalny dla wielu wskaźników, ale: - nie dla
canonical money, - centralizujemy rounding, - unikamy chaotycznie
niestabilnych obliczeń, - golden determinism tests są obowiązkowe.

------------------------------------------------------------------------

# 86. Parallelism

Vertical Slice: - jeden Simulation Worker, - deterministic sequential
tick pipeline.

Nie wprowadzamy wielowątkowej równoległości wewnątrz jednego ticka przed
profilingiem.

------------------------------------------------------------------------

# 87. Dlaczego sequential na start

Najważniejsze są: - correctness, - determinism, - explainability, -
debugability.

Wczesny parallelism utrudni wszystkie cztery.

------------------------------------------------------------------------

# 88. Future optimization path

Jeśli potrzebne: 1. profiling, 2. indexes/caches, 3. fewer allocations,
4. staggered AI, 5. data-oriented arrays w hot paths, 6. worker/task
parallelism z deterministic commit, 7. Rust/WASM tylko dla
potwierdzonych hot paths.

------------------------------------------------------------------------

# 89. Documentation in repo

`docs/` zawiera wszystkie kanoniczne `.md`.

`FIRST-CAUSE-Canonical-Decisions-v0.1.md` jest pierwszym dokumentem
rozstrzygającym konflikty.

------------------------------------------------------------------------

# 90. ADR

Duże późniejsze decyzje techniczne zapisujemy jako krótkie Architecture
Decision Records:

``` text
docs/adr/ADR-001-...
```

Nie przepisujemy za każdym razem całego Technology Stack Decision.

------------------------------------------------------------------------

# 91. Agent instructions

Repo powinno posiadać plik instrukcji dla agentów, który mówi: - czytaj
Canonical Decisions, - nie implementuj FULL poza milestone, - nie używaj
Math.random, - nie mutuj World State z UI, - testuj determinism, - nie
hardcoduj content IDs.

------------------------------------------------------------------------

# 92. M0 --- Repository Foundation

Pierwszy milestone tworzy: - pnpm workspace, - Electron, - React, -
Vite, - TypeScript strict, - Vitest, - ESLint, - Prettier, - podstawowe
packages, - CI, - pusty worker, - typed IPC, - docs.

------------------------------------------------------------------------

# 93. M1 --- Deterministic Core

Tworzymy: - Tick, - SimulationClock, - Seed, - RNG streams, -
deterministic IDs, - rounding, - checksum, - command boundary, - minimal
simulation runner.

------------------------------------------------------------------------

# 94. M2 --- Data Foundation

Tworzymy: - Zod schemas, - content loader, - Definition Registries, -
semantic validation, - EN/PL localization skeleton.

------------------------------------------------------------------------

# 95. M3 --- World State

Tworzymy minimalne: - World, - Region, - Connection, -
ResourceDeposit, - Cohort, - Settlement, - Company, - Inventory, -
Market, - indexes.

------------------------------------------------------------------------

# 96. M4 --- Black Mountain Fixture

Dopiero po M0--M3 tworzymy kontrolowany fixture i zaczynamy pierwsze
realne systemy gospodarcze.

------------------------------------------------------------------------

# 97. Minimalny Definition of Done M0

M0 jest ukończone, gdy: - desktop app startuje, - React renderuje
shell, - worker odpowiada, - test runner działa, - typecheck/lint są
green, - CI działa, - production build powstaje, - renderer nie ma Node
integration.

------------------------------------------------------------------------

# 98. Minimalny Definition of Done M1

M1 jest ukończone, gdy: - 10 000 pustych ticków jest reprodukowalnych, -
RNG golden tests przechodzą, - ×1 i headless batch dają ten sam
checksum, - save minimalnego core state może być odtworzony identycznie.

------------------------------------------------------------------------

# 99. Technology risks

Najważniejsze: 1. Electron RAM. 2. JS GC przy bardzo dużej liczbie
obiektów. 3. historia causal rosnąca szybciej niż world state. 4. zbyt
częste worker↔UI transfers. 5. niekontrolowane floating-point
divergence. 6. zbyt wczesne renderowanie tysięcy DOM nodes.

Każde ryzyko ma mierzalną ścieżkę mitigacji.

------------------------------------------------------------------------

# 100. Kill criteria dla TypeScript Simulation Core

Nie migrujemy core „na wszelki wypadek".

Rozważamy Rust/WASM/native tylko, jeśli po: - poprawnych indeksach, -
ograniczeniu alokacji, - profilowaniu, - batching, - staggered decisions

Simulation Core nadal nie spełnia zaakceptowanych performance budgets.

------------------------------------------------------------------------

# 101. Co pozostaje otwarte

Nie blokuje M0: - konkretna biblioteka chartów, - dokładny graph layout
algorithm, - finalny save binary format, - Steamworks wrapper, - final
font stack, - installer branding, - officialMaxRegions.

------------------------------------------------------------------------

# 102. Decyzje zamknięte przez ten dokument

Od v0.1 uznajemy za kanoniczne: - TypeScript, - Electron, - React, -
Vite, - PixiJS dla Living Atlas, - Zustand dla UI state, - Zod dla
content/config, - Vitest, - Playwright, - JSON content, - JSON+gzip save
dla VS, - i18next, - pnpm monorepo, - simulation w workerze, -
offline-first, - sequential deterministic tick pipeline.

------------------------------------------------------------------------

# 103. Final Recommendation

Ten stack daje FIRST CAUSE najlepszy kompromis między: - szybkością
developmentu, - jakością UI, - testowalnością, - determinism, -
wsparciem agentów AI, - możliwością profilowania, - przyszłą
optymalizacją.

Najważniejsze jest teraz, aby **nie zmieniać stacku podczas pierwszych
milestone'ów bez danych z benchmarków**.

------------------------------------------------------------------------

# 104. Następny krok

Po zatwierdzeniu dokumentu należy przejść do implementacji:

``` text
M0 Repository Foundation
→ M1 Deterministic Core
→ M2 Data Foundation
→ M3 World State Foundation
→ M4 Black Mountain Fixture
```

Pierwszym praktycznym artefaktem powinien być prompt dla Claude
Code/Codex tworzący **M0 Repository Foundation** dokładnie według tej
specyfikacji i Canonical Decisions.

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE Technology Stack Decision v0.1**
