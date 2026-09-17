# Changelog

All notable changes to this repository are recorded here, newest first.

Format: one entry per change/session, dated `YYYY-MM-DD`. This file
tracks *what changed in the repo* (docs, roadmap, code); it is not a
replacement for `docs/FIRST-CAUSE-Implementation-Roadmap-v0.2.md`
(milestone plan/status) or `docs/FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(design decisions) -- see those for the "why".

## 2026-09-17

- Wdrożono **M9 -- Labor & Households**. Nowe moduły
  `packages/simulation/src/systems/economy/labor`: `employment.ts`
  (`matchEmployment` -- zatrudnienie reaktywne, nie strategiczne;
  ogranicza się do min(vacancies, skillDemand, dostępni pracownicy) --
  `employment <= eligible working population` zachodzi konstrukcyjnie)
  i `wages.ts` (`adjustWageOffer` -- ponownie wykorzystuje M8
  `classifyShortageSurplus` i dokładnie ten sam kształt capped+smoothed
  pressure co `price-adjustment.ts`, żeby rynek pracy dostał te same
  zabezpieczenia przed oscylacją od pierwszej wersji). Nowe moduły
  `packages/simulation/src/systems/population`: `consumption.ts`
  (`allocateSpending` -- ECO-014 spending order Survival->Basic->
  Services->Comfort->Prosperity->Luxury->Savings, ściśle w kolejności,
  "no money no purchase") i `needs-satisfaction.ts`
  (`computeNeedsSatisfaction` -- pełna implementacja `CohortNeeds`,
  skeleton z M6). `Company` (`packages/entities`) zyskuje opcjonalne
  `initialWageOffer` w `createCompany`, seedujące `workforce.wageOffer`
  (ten sam kontrakt co M8 `initializeMarketGood`). 38 nowych testów (347
  łącznie), w tym FC-LABOR-001/003, FC-POP-001/002, Acceptance Gate
  (zatrudniona kohorta ma wyższą satysfakcję potrzeb) i
  `labor-wage-price-feedback.test.ts` -- 100-tickowy test regresyjny
  łączący M9 z M8, dowodzący, że sprzężenie płace<->dochód<->popyt<->cena
  nie reintrodukuje oscylacji (ryzyko M9 zmitygowane). Etykieta
  `app.milestone` zaktualizowana na "M9 -- Labor & Households"/"M9 --
  Praca i Gospodarstwa Domowe". Świadomie poza zakresem: migracja jako
  reakcja na warunki pracy (M13), AI decyzje firm o zatrudnieniu (M11),
  rzeczywista wypłata wynagrodzeń nie rusza `Company.finance.cash`
  (wymaga okablowania firma<->gospodarstwo, którego żaden milestone
  jeszcze nie ma), usługi (ECO-012) jako osobna kategoria nie istnieją.

- Wdrożono **M8 -- Market**. Nowe moduły
  `packages/simulation/src/systems/economy/markets`:
  `demand-aggregation.ts` (`aggregateDemand` -- suma nazwanych źródeł
  popytu, source-agnostic, bo M8 ma dziś tylko jedno realne źródło:
  zużycie pośrednie firm z M7), `shortage-surplus.ts`
  (`classifyShortageSurplus` -- inventory buffer dampuje, nie maskuje,
  surowy niedobór podaży) i `price-adjustment.ts`
  (`initializeMarketGood`/`updateMarketGood` -- `PricePressure =
  Sensitivity * ((Demand - EffectiveSupply) / NormalSupply)`, VS §17,
  ze wszystkimi czterema obowiązkowymi zabezpieczeniami -- price floor,
  miesięczny limit zmiany, smoothing, inventory buffer -- od pierwszej
  wersji, zgodnie z mitygacją ryzyka R1 "gospodarka oscyluje" (VS §73)).
  `Market` (`packages/entities`) zyskuje pole `history` (rolling
  supply/demand/price per dobro) jako referencję dla `NormalSupply`.
  Nowe opcjonalne pole `basePrice` (BaseContentPrice) w
  `ResourceDefinition`/`GoodDefinition` (M2 schema) i w
  `content/resources/{grain,iron_ore,timber}.json`/
  `content/goods/{flour,bread}.json` seeduje pierwszy `localPrice`.
  31 nowych testów (309 łącznie), w tym FC-MARKET-001/002/003, price
  bounds i dwa 100-tickowe testy stresowe (zbalansowany i trwale
  niedoborowy rynek -- brak nieskończonej pętli oscylacji). Etykieta
  `app.milestone` zaktualizowana na "M8 -- Market"/"M8 -- Rynek".
  Świadomie poza zakresem: `Company.finance.revenue/costs` (wymaga
  strony popytowej z M9 i AI firm z M11), handel międzyregionalny (M10),
  realna pętla ticków (przyszły milestone).

- Wdrożono **M7 -- Production**. Nowe moduły
  `packages/simulation/src/systems/economy`: `inventory.ts`
  (`addToInventory`/`removeFromInventory` -- fizyczny rejestr dóbr,
  DATA-005, fail-loud przy usunięciu więcej niż jest dostępne, ten sam
  standard co `buildCohortFamily` z M6 i `extractFromDeposit` z M5),
  `companies.ts` (`applyProductionToCompany` -- czysta aktualizacja
  `Company.production` po jednym ticku) i `production.ts`
  (`runProduction` -- jedna firma awansuje o jeden tick, licząc tyle
  batchy Production Method, na ile pozwalają jednocześnie capacity/
  utilization, zasób wydobywany na żywo z `ResourceDeposit` (M5) i
  dobra z własnego Inventory). `ProductionRecipe` (ile dokładnie na
  batch) to osobny typ warstwy symulacji, analogicznie do
  `DemographyRates` z M6 -- `ProductionMethodDefinition.inputs/
  outputs/resourceRequirements` (M2) to tylko topologia grafu, a
  "productivity" to pole jawnie oznaczone w M2 jako należące do M7.

  Dodano realne dane contentu: `content/companyArchetypes/{grain_farm,
  bakery}.json`, `content/productionMethods/{manual_farming,
  manual_food_processing}.json`, plus wzajemne referencje w
  `content/resources/grain.json` i `content/goods/{flour,bread}.json`
  -- dowodzą łańcucha Zboże->Mąka->Żywność (Production-Economy-Master
  §13) na dwóch archetypach. `grain_farm` w fixture'cie M4 pełni rolę
  połączonych farmy i młyna (jedna Production Method), bo fixture ma
  tylko jedną firmę; osobny "Mill" zostaje do rozszerzenia, gdy
  faktycznie pojawi się w świecie. Dodano klucze `en`/`pl` w
  `locales/*/common.json` i zaktualizowano etykietę
  `app.milestone` na "M7 -- Production"/"M7 -- Produkcja".

  Dodano 19 nowych testów (278 łącznie), w tym Acceptance Gate na
  realnych wartościach z `tests/worldgen/fixtures/
  black_mountain_reference.json` (Green Valley Grain Farm produkuje
  mąkę z prawdziwego zboża przez 12 ticków, zapas nigdy ujemny) i test
  łańcucha dwóch firm przez ręczne przeniesienie Inventory (Market to
  M8, więc na razie brak automatycznego handlu). `pnpm typecheck`,
  `pnpm lint` (ten sam 1 warning z M2/M5, bez zmian), `pnpm
  format:check`, `pnpm test` (278/278) i `pnpm build` przechodzą.
  Zaktualizowano roadmapę (M7 = DONE, M8 = READY, sekcja "Wyniki
  wykonania") oraz README.

- Przegląd naprawczy M1-M6 (przed M7): naprawiono cztery usterki, żadna
  niewykryta przez wcześniej zielony `pnpm test`.

  1. **P1** -- `RngStream.nextInt` (`packages/simulation/src/core/rng.ts`)
     przyjmował `maxExclusive` do 2**32 włącznie; `maxExclusive >>> 0`
     zawija 2**32 do 0, więc `nextInt(4294967296)` zwracał `NaN`
     zamiast rzucić. Dodano górną granicę `0xffffffff` do walidacji.
  2. **P1** -- `applyMonthlyDemography`
     (`packages/simulation/src/systems/population/demography.ts`)
     zaokrąglał deterministycznie (`round-half-even`), co dla małych
     populacji (np. 5 kohort po 10 osób) trwale zerowało miesięczne
     urodziny/zgony/aging -- oczekiwana wartość nigdy nie osiągała progu
     0.5, więc po 2400 miesiącach populacja zostawała dokładnie taka
     sama jak na starcie. Zastąpiono losowym zaokrąglaniem (`floor` +
     rzut monetą ważony częścią ułamkową, bezstronne w oczekiwaniu)
     przez dotąd zarezerwowany a nieużywany strumień RNG "demography"
     (SAVE-003) -- `applyMonthlyDemography` przyjmuje teraz wymagany
     parametr `rng: RngStream`.
  3. **P2** -- `agingSpanYears` mogło przyjąć wpis dla terminalnej
     grupy `AGE_65_PLUS`, która nie ma następnej grupy do zestarzenia
     się -- taki wpis po cichu usuwał populację bez żadnego adresata.
     Dodano typ `NonTerminalAgeGroup`
     (`packages/simulation/src/systems/population/cohorts.ts`,
     wyklucza `AGE_65_PLUS` na poziomie typów) oraz sprawdzenie
     strukturalne w pętli aging (`NEXT_AGE_GROUP[ageGroup] ===
     undefined`, niezależne od tego, co akurat ustawia config).
  4. **P1** -- M6 nie dało się podać fixture'owi M4
     (`tests/worldgen/fixtures/black_mountain_reference.json`) bez
     ręcznego przygotowania: `buildCohortFamily` wymaga dokładnie
     pięciu kohort tej samej tożsamości, a fixture ma po jednej kohorcie
     na inną tożsamość (różne `economicClass`/`skillLevel`) na region --
     wywołanie rzucało "expected exactly 5 cohorts, got 2". Dodano
     `groupCohortsIntoFamilies` (`cohorts.ts`): grupuje dowolną listę
     kohort po tożsamości i dopełnia brakujące grupy wieku syntetyczną
     kohortą o populacji 0, nie naruszając sumy populacji;
     `buildCohortFamily` zostaje przy tym równie rygorystyczne
     (fail-loud) dla wywołujących, którzy mają już kompletną rodzinę.

  Dodatkowo zaktualizowano `docs/FIRST-CAUSE-Canonical-Decisions-v0.1.md`
  (sekcje 162 "IMPL-001" i 201 "Następny krok"), które od M1 błędnie
  wskazywały M1 jako kolejny krok mimo ukończonych commitów M1-M6.

  Dodano 2 nowe testy regresyjne w `demography.test.ts` (zamrożenie
  małych populacji, misconfiguration `agingSpanYears.AGE_65_PLUS`), 3
  w `cohorts.test.ts` (`groupCohortsIntoFamilies` na kształcie
  fixture'u M4, zachowanie sumy populacji, brak zmian dla już
  kompletnej rodziny) i 1 w `rng.test.ts`. `pnpm typecheck`, `pnpm
  lint` (ten sam 1 warning sprzed zmian, bez związku), `pnpm test`
  (259/259) i `pnpm build` przechodzą.

- Wdrożono **M6 -- Minimal Population**. Nowe moduły
  `packages/simulation/src/systems/population`: `cohorts.ts`
  (`buildCohortFamily` -- waliduje i indeksuje dokładnie pięć
  `PopulationCohort`, jedną na `AgeGroup`, dzielących tę samą tożsamość
  lokalizacyjno-socjoekonomiczną; rzuca fail-loud przy niekompletnym
  lub niespójnym zestawie) i `demography.ts` (`applyMonthlyDemography`
  -- miesięczne urodzenia/zgony/aging transfer między kohortami, 1 tick
  = 1 miesiąc zgodnie z SIM-001). Współczynniki roczne konwertowane na
  miesięczne przez składanie (`1 - (1-roczny)^(1/12)`), nie dzielenie
  przez 12. Domyślne stawki dobrane tak, by zbliżać się do
  zastępowalności pokoleń -- zweryfikowano numerycznie przed napisaniem
  testu (ta sama dyscyplina co przy M5 sustainable yield), że przebieg
  200-letni/2400-tickowy zostaje w granicach ok. ±10% populacji
  startowej. Emitowane fakty CE-01: `population_increased`/
  `population_declined`.

  Needs skeleton bez nowego kodu -- `CohortNeeds` z M3 zostaje
  wyzerowane i nietknięte przez demografię, gotowe pod M9. Profesje VS
  (POP-005) pozostają dokumentacyjne -- `profession` wciąż
  nieprzypisywane, bo zatrudnienie to M9/M11.

  Dodano 13 nowych testów (253 łącznie): kompletność/spójność
  `buildCohortFamily`, ręcznie zweryfikowany dokładny transfer aging,
  terminalność `AGE_65_PLUS`, izolacja urodzeń do `AGE_0_14`, brak
  ujemnej populacji nawet przy 100% rocznej śmiertelności, conservation
  audit (suma zmian populacji === suma delt faktów na każdym z 50
  ticków) oraz test smoke 200-letni. `pnpm typecheck`, `pnpm lint`
  (ten sam 1 warning z M2/M5, bez zmian), `pnpm format:check`, `pnpm
  test` (253/253), `pnpm build` i `pnpm test:e2e` przechodzą.
  Zaktualizowano roadmapę (M6 = DONE, M7 = READY, sekcja "Wyniki
  wykonania") oraz README.

## 2026-09-16

- Wdrożono **M5 -- Resources** (pierwszy milestone z realną logiką
  gospodarczą). Nowy pakiet `packages/causality` (CE-01 "Fact
  Infrastructure": `SimulationFact`, `FactStore` z deterministycznymi
  ID `fact_<tick>_<sequence>`, indeksy po ticku/typie/encji/regionie,
  emission API) -- bez zależności od żadnego innego pakietu, więc
  `packages/simulation` mógł dodać na niego zależność produkcyjną bez
  ryzyka cyklu. `packages/simulation/src/systems/resources`: cykl
  odkrycia złoża `UNKNOWN -> SUSPECTED -> DISCOVERED -> ASSESSED`
  (nigdy się nie cofa, nie wymusza wydobycia), ekstrakcja respektująca
  fizyczną zasadę "wydobycie nie może stworzyć zasobu" (`extracted =
  min(amount, dostępna ilość)`) z emisją faktów trendu
  (`extraction_started/_increased/_decreased`) i `resource_depleted`,
  oraz regeneracja zasobów odnawialnych modelem wzrostu logistycznego
  do `carryingCapacity` (dodano to pole do `DepositRenewableState` w
  `packages/entities`, świadomie zostawione niekompletne w M3). Nowy
  `ResourceDepositReadModel` respektuje TECH-009 -- dokładna ilość
  złoża jest ukryta, dopóki nie zostanie odkryte.

  Start UI-F0: design tokens (`apps/desktop/src/design/tokens.css`,
  dokładne wartości z `UI Visual Design System v1.0`), siedem
  komponentów `FC*` (`FCSection`, `FCPanel`, `FCTextButton`,
  `FCPrimaryAction`, `FCTabs`, `FCMetric`, `FCTrend`) oraz
  `FCAppShell`/`FCTopNavigation`/`FCSimulationBar`, które zastąpiły
  surowy shell z M0 w `apps/desktop/src/App.tsx`. `FCSimulationBar`
  pokazuje tylko realne dane (status workera, wersja silnika) --
  świadomie bez kontrolek tick/prędkości, bo żadna pętla ticków
  jeszcze nie działa w aplikacji desktopowej.

  Dodano 55 nowych testów (240 łącznie), w tym test stabilizacji
  zasobu odnawialnego wokół sustainable yield (500 ticków stałego
  popytu, zweryfikowany numerycznie przed napisaniem testu, żeby
  uniknąć niestabilnej równowagi przy zbyt wysokim popycie) oraz test
  conservation audit (`cumulativeExtraction + quantity ===
  initialQuantity` na każdym kroku). `pnpm typecheck`, `pnpm lint`,
  `pnpm format:check`, `pnpm test` (240/240), `pnpm build` i `pnpm
  test:e2e` przechodzą. Zaktualizowano roadmapę (M5 = DONE, M6 =
  READY, sekcja "Wyniki wykonania") oraz README. Weryfikacja wizualna
  nowego UI w przeglądarce nie była możliwa (rozszerzenie Claude in
  Chrome niepodłączone w tym środowisku) -- poprawność potwierdzają
  testy RTL (`App.test.tsx`) i e2e Playwright, które przechodzą bez
  zmian w asercjach poza zaktualizowanym tekstem milestone'u.
- Implemented **M4 -- Black Mountain Reference Fixture** (new
  `packages/worldgen` package): a generic
  `JSON -> Zod -> entity factories -> createWorldState` fixture loader
  (`fixtures/fixture-schema.ts` + `fixtures/load-world-fixture.ts`)
  that knows nothing about any specific reference scenario (World
  Generation Spec SS16/SS36), and the hand-written
  `tests/worldgen/fixtures/black_mountain_reference.json`: 8 regions, 1
  continent, ~50 population, 4 settlements, 3 resource deposits
  (Black Mountain's Iron Ore starts hidden/UNKNOWN with no forced
  mine, per SS16), 7 connections forming a route from Black Mountain to
  an external market, 1 company + inventory, 1 market, 4
  TechnologyStates -- matching World Generation Spec SS64's "first
  prototype" scale. Added the first 4 typed UI Read Models
  (`packages/simulation/src/read-models`): `WorldSummaryReadModel`,
  `RegionSummaryReadModel`, `AtlasRegionReadModel`,
  `ImportantNowReadModel` (the last always returns `[]` today, with a
  documented reason -- none of its data sources, e.g. Chronicle or
  shortages, exist yet).

  **Correction to M3:** giving `packages/simulation` a production
  dependency on `packages/entities` (for Read Models) exposed that
  `packages/entities`' M3-era `devDependency` on `@first-cause/simulation`
  (used only by one checksum-roundtrip test) made pnpm report a real
  cyclic workspace dependency. Fixed by dropping that devDependency and
  rewriting the test as a plain `JSON.stringify`/`JSON.parse` roundtrip
  (`WorldState` never uses `Map`/`Set`, so it needed none of M1's
  `canonicalStringify` Map/Set handling to prove the same property).
  `packages/entities` now has zero dependency, dev or production, on
  `packages/simulation`.

  Added 21 new tests: structural fixture-rejection tests, 7 tests
  against the real Black Mountain fixture (region/population counts,
  hidden Iron Ore + no forced mine, BFS route-to-market, food-producing
  region, alternative economic region, non-trivial transport cost), a
  grep-based test that no non-test `.ts` source file under
  `worldgen`/`entities`/`simulation` mentions the fixture's identity, a
  single-empty-tick integration test (M1's `HeadlessRunner.step()`
  alongside a real `WorldState`, proving the M4 Acceptance Gate's
  "runs one empty tick without error, as a no-op"), and 9 Read Model
  contract tests. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`,
  `pnpm test` (208/208), `pnpm build` and `pnpm test:e2e` all pass.
  Widened the ESLint Simulation-Core React/Electron import boundary to
  include `packages/worldgen/**`. Updated the roadmap (M4 = DONE, M5 =
  READY, "Wyniki wykonania" recorded, including the M3 correction),
  README and AGENTS.md accordingly. No economic/demographic/AI logic or
  procedural generation exists yet (M5/M22+), as scoped.
- Implemented **M3 -- World State Foundation** (new `packages/entities`
  package): typed runtime entity shapes + `create*()` factories for all
  11 in-scope entities (`World`, `Continent`, `Region` incl.
  `geography`/`environment`, `Connection`, `ResourceDeposit`,
  `Settlement`, `PopulationCohort`, `Company`, `Market`, `Inventory`,
  `TechnologyState`), each enforcing Entity Data Model rule 9 ("no
  negative stocks/NaN/dangling refs") at construction. Fields
  referencing out-of-M3-scope entity types (Culture, Nation, State,
  Infrastructure, ServiceCapacity) are intentionally omitted rather
  than left dangling. `world-state.ts` (`createWorldState`) assembles
  all 11 into one `WorldState`, validates every forward reference, and
  *reconstructs* every back-reference cache (`Region.resources.depositIds`,
  `World.regionIds`, `Region.population.totalPopulation`, ...) from
  canonical entity data instead of trusting hand-maintained arrays
  (DATA-003/DATA-004). `core/indexes.ts` + `indexes/world-indexes.ts`
  add the 5 named runtime indexes from the roadmap's M3 module list
  (`companiesByRegion`, `cohortsByRegion`, `depositsByRegion`,
  `settlementsByRegion`, `connectionsByRegion`), rebuilt from canonical
  state on every call. `packages/entities` deliberately has no
  *production* dependency on `packages/simulation` (only a test-only
  one, used solely for the checksum-roundtrip test) to avoid a future
  import cycle once M5+ systems in `packages/simulation` need to
  operate on entity types; `core/validation.ts` is accordingly a small
  local copy, not a shared import -- see the doc comment there. Added
  42 tests (188 total): per-entity invariant tests, referential-
  integrity tests for 3 different dangling-reference cases,
  input-order-independence, and a canonical-serialize/re-checksum
  roundtrip via `@first-cause/simulation` (devDependency only). Widened
  the ESLint Simulation-Core React/Electron import boundary to include
  `packages/entities/**`. `pnpm typecheck`, `pnpm lint`, `pnpm
  format:check`, `pnpm test` (188/188), `pnpm build` and `pnpm
  test:e2e` all pass. Updated the roadmap (M3 = DONE, M4 = READY,
  "Wyniki wykonania" recorded), README and AGENTS.md accordingly. No
  economic/demographic/AI logic exists yet (M5+), as scoped.
- Implemented **M2 -- Data Foundation** (`packages/content/src`): Zod
  schemas for all 10 in-scope content types (Resource, Good,
  CompanyArchetype, ProductionMethod, Discovery, Service, TransportMode,
  Intervention, EventType, ChronicleTemplate), built from
  Content-Localization-Spec SS41-50's minimal field lists (deeper
  economic modeling stays M5/M7 scope, not invented early).
  `schema/reference-field.ts` declares each type's reference fields
  declaratively, powering generic (not per-type) validators:
  `validators/reference-validation.ts` (missing references, DFS
  dependency-cycle detection, CONTENT-009 phase violations) and
  `validators/localization-coverage.ts` (missing `en` key = error,
  missing secondary-locale key = warning). `loaders/content-pack.ts`
  (`loadContentPack`) ties everything together: per-type
  `JSON -> Zod -> duplicate-ID check -> DefinitionRegistry`
  (`create-definition-loader.ts`, generalized from M0's
  `loadResourceDefinitions`, now a thin wrapper over it) plus cross-type
  ID-collision checking and Content Statistics (SS147). Renamed the M0
  placeholder field `phase` -> `implementationPhase` and
  `finite` -> `renewable` on `ResourceDefinition` to match the canonical
  spec (CONTENT-008), updating the existing fixture/tests accordingly.
  Added real VS-subset content
  (`content/resources/{iron_ore,grain,timber}.json`,
  `content/goods/{flour,bread}.json`) with full EN/PL localization
  keys. Added 62 new tests: one per CONTENT-010 checklist item
  (duplicate ID, cross-type ID collision, missing ref, invalid range,
  dependency cycle, phase violation, missing EN key, missing
  secondary-locale warning), a content-load-determinism test, 40
  schema-level structural tests across all 10 types, and an integration
  test reading the real files from `content/`/`locales/` off disk.
  `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`
  (146/146), `pnpm build` and `pnpm test:e2e` all pass. Updated the
  roadmap (M2 = DONE, M3 = READY, "Wyniki wykonania" recorded) and
  README accordingly. No World State or gameplay systems exist yet
  (M3+), as scoped.
- Implemented **M1 -- Deterministic Core** (`packages/simulation/src/core`):
  `core/time` (tick-derived `SimulationClock`/`tickToDate`, 1 tick = 1
  month), `core/rng` (from-scratch `xoshiro128**` seeded via
  `splitmix32`, 8 SAVE-003 named streams derived via `fnv1a32`, unbiased
  `nextInt` via Lemire rejection sampling), `core/ids` (deterministic
  per-prefix `IdGenerator`), `core/validation`
  (finite/non-negative/safe-integer assertions), `core/rounding`
  (resolves OPEN-008: integer minor-unit money, `MONEY_SCALE = 100`,
  round-half-to-even), `core/serialization` (`canonicalStringify` --
  sorted object keys/Map entries/Set values), `core/checksum`
  (`computeChecksum`, `fnv1a32x2-v1`), `core/commands`
  (`CommandBoundary` with deterministic same-tick ordering, SAVE-006),
  and `core/runner` (`HeadlessRunner` tying them together: `step`,
  `runTicks`, `getState`/`fromState`, `checksum`). Added
  `docs/adr/ADR-001-m1-deterministic-core.md` recording the numeric/
  algorithm decisions `Canonical Decisions` SS201/OPEN-008 left open for
  M1. Added an ESLint rule forbidding `Math.random`/`Date.now`/
  `new Date()`/`crypto.randomUUID` under `packages/simulation/src/core`
  (SAVE-004), verified with a probe file that it actually fires. Updated
  `pnpm sim:run` to also run a 12-tick `HeadlessRunner` demo. Added 62
  new Vitest tests, including the M1 Acceptance Gate itself (Technology
  Stack Decision SS98): 10 000 empty ticks reproducible, RNG golden
  vectors, x1-vs-batch checksum equality, and mid-run save/restore
  roundtrip. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm
  test` (94/94), `pnpm build` and `pnpm test:e2e` all pass. Updated the
  roadmap (M1 = DONE, M2 = READY, "Wyniki wykonania" recorded) and
  README accordingly. No World State or gameplay systems exist yet
  (M3+), as scoped.
- Reconciled documentation after M0/M0.1: current roadmap links now point
  to v0.2 and the next milestone is M1. Synchronized canonical stack,
  World Generation, VS save, money and UI decisions with existing specs;
  retained genuinely open implementation choices for an M1 ADR.
- Consolidated identical economy specs into the canonical `-PL` file,
  retaining `-POLSKI` as a compatibility link. Removed stale UI version
  metadata, clarified UI track timing and marked the master audit as
  historical. Recorded missing Golden UI references and the unavailable
  technology catalog; M15 documentation readiness is now PARTIAL.
  Fixed obsolete architecture/economy source filenames and updated
  completed next-document recommendations in the VS/UI specs.
  No gameplay code or milestone completion status was changed.

## 2026-09-15

- Completed **M0.1 Audit Fixes** (M0-01–M0-05): bounded IPC request and
  shutdown lifecycle with controlled-worker tests; Ubuntu Electron E2E
  runs under Xvfb; detached, deeply frozen content definitions and
  locale-independent ID ordering with regression tests. Synchronized
  README/roadmap status, package creation policy, semantic validation
  scope and audited dev results. M1 remains unimplemented; remote CI
  is not claimed as verified by local gates.

- Configured `origin` (`https://github.com/SerMartin1/first-cause`,
  private repo created via `gh repo create`) and pushed `main`
  (required refreshing the `gh` auth token with the `workflow` scope
  so `.github/workflows/ci.yml` could be pushed).

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
