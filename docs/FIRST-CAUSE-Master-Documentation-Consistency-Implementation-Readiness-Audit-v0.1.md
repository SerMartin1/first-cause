# FIRST CAUSE --- Master Documentation Consistency & Implementation Readiness Audit v0.1

**Status:** historyczny audyt przedimplementacyjny\
**Projekt:** FIRST CAUSE\
**Wersja:** 0.1\
**Cel:** ustalenie jednego kanonu projektu, wykrycie sprzeczności między
dokumentami, wskazanie decyzji superseded, luk implementacyjnych, ryzyk
architektonicznych oraz przygotowanie kolejności wdrożenia Vertical
Slice.

------------------------------------------------------------------------

# Aktualność audytu — 2026-09-16

Poniższe wnioski i statusy są historycznym zapisem audytu, nie bieżącą
listą blockerów. World Generation Spec i Technology Stack Decision już
istnieją, M0/M0.1 są ukończone, a następnym etapem jest M1. Aktualne
decyzje określa Canonical Decisions v0.1, a stan prac roadmapa v0.2.
Przywołany w historycznej liście Technology Discovery Catalog oraz
angielska wersja Economy Master nie są dostępne w repo. Kanonicznym
źródłem ekonomii jest plik `-PL`; dostępność katalogu technologii
wymaga domknięcia przed M15 (Canonical Decisions §199).

# 1. Zakres audytu

Audyt obejmuje następujące dokumenty:

1.  `FIRST-CAUSE-koncepcja-architektura-v0.6.md`
2.  `FIRST-CAUSE-Simulation-Model-v0.1.md`
3.  `FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md`
4.  `FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md`
5.  `FIRST-CAUSE-Entity-Data-Model-v0.1.md`
6.  `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md`
7.  `FIRST-CAUSE-Causality-Engine-Spec-v0.1.md`
8.  `FIRST-CAUSE-AI-Decision-Model-v0.1.md`
9.  `FIRST-CAUSE-Simulation-Test-Spec-v0.1.md`
10. `FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md`
11. `FIRST-CAUSE-Architect-Intervention-Influence-Spec-v0.1.md`
12. `FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1.md`
13. `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
14. `FIRST-CAUSE-Content-Localization-Spec-v0.1.md`

Angielska wersja `FIRST-CAUSE-Production-Economy-Master-v0.1.md` jest
traktowana jako dokument pomocniczy. Kanoniczna dla bieżącego projektu
jest wersja polska `-PL`.

------------------------------------------------------------------------

# 2. Ocena ogólna

**Status projektu dokumentacyjnego: CONDITIONAL GO.**

FIRST CAUSE posiada już wystarczająco kompletną architekturę, aby
rozpocząć implementację technicznego fundamentu Vertical Slice.

Nie zaleca się jednak rozpoczynania pełnego kodowania systemów
gospodarki, AI i UI przed wykonaniem krótkiego **Canonical Cleanup**,
ponieważ w aktualnym zestawie plików istnieje kilka rzeczywistych
sprzeczności.

Najważniejsze z nich dotyczą: - skali świata, - zestawu interwencji
VS, - starszych założeń UI/mapy, - terminologii Adoption/Wdrożenie, -
niepełnej specyfikacji World Generation, - nieustalonych konkretnych
formatów runtime data, - braku formalnego publicznego kontraktu między
systemami.

------------------------------------------------------------------------

# 3. Najważniejszy wniosek

Projekt nie potrzebuje kolejnych dużych systemów gameplayowych przed
Vertical Slice.

Potrzebuje teraz:

> **ujednolicenia kanonu → zamrożenia kontraktów → implementacji
> fundamentu → Black Mountain.**

------------------------------------------------------------------------

# 4. Status kompletności

  Obszar                                 Status
  -------------------------------------- ------------------
  Wizja gry                              READY
  Model symulacji                        READY
  Ekonomia                               READY
  Technologia                            READY
  Entity Model                           READY
  AI aktorów                             READY
  Causality                              READY
  Chronicle                              READY
  Architect                              READY
  Vertical Slice scope                   READY po cleanup
  Save/Determinism                       READY
  Performance architecture               READY
  Content architecture                   READY
  Localization architecture              READY
  UI/UX                                  READY po cleanup
  Testing                                READY po cleanup
  World Generation                       PARTIAL
  Konkretne runtime schemas/interfaces   MISSING
  State formation / geopolitics          DEFERRED
  Warfare                                DEFERRED
  Modding                                DEFERRED

------------------------------------------------------------------------

# 5. Hierarchia kanoniczności dokumentów

W przypadku konfliktu należy stosować następującą zasadę.

## Poziom A --- zakres i wizja

1.  `koncepcja-architektura`
2.  późniejsze jawnie zatwierdzone decyzje w dokumentach
    specjalistycznych.

## Poziom B --- model systemu

-   Simulation Model
-   Entity Data Model
-   Production Economy Master
-   Technology Catalog
-   AI Decision Model
-   Causality Engine
-   Chronicle
-   Architect

## Poziom C --- zakres implementacji

`Vertical-Slice-Spec`

określa **co implementujemy teraz**, ale nie może nadpisywać późniejszej
kanonicznej decyzji specjalistycznej.

## Poziom D --- technika

-   Save/Determinism/Performance
-   Content/Localization
-   Simulation Test
-   UI/UX

------------------------------------------------------------------------

# 6. Reguła supersession

Jeżeli późniejszy dokument specjalistyczny jawnie zmienia wcześniejszą
decyzję z dokumentu ogólnego, późniejsza decyzja staje się kanoniczna.

Starszy tekst powinien zostać: - zaktualizowany, - albo oznaczony
`SUPERSEDED`.

Nie wolno utrzymywać dwóch pozornie równorzędnych wersji decyzji.

------------------------------------------------------------------------

# 7. Konflikt P0 --- skala świata

W aktualnych głównych plikach nadal występują stare wartości:

Simulation Model: - Small \~150, - Standard \~350, - Large do 800, -
maksymalnie 800.

Architecture v0.6: - Small 100--150, - Standard \~300, - Large \~500, -
eksperymentalnie 750--1000.

Simulation Test: - benchmarki 32 / 150 / 350 / 800.

UI/UX: - skalowanie do 800.

Jednocześnie nowszy `Save-Determinism-Performance-Spec` przyjmuje: - VS
24--40, - Small \~250, - Standard \~600, - Large \~1 200, - Huge \~2
000, - Architecture Target do 3 000.

------------------------------------------------------------------------

# 8. Rozstrzygnięcie skali świata

**KANON:**

  Preset                   Regiony
  --------------------- ----------
  Vertical Slice            24--40
  Reference VS                  32
  Small                      \~250
  Standard                   \~600
  Large                    \~1 200
  Huge                     \~2 000
  Architecture Target     do 3 000

------------------------------------------------------------------------

# 9. Znaczenie 3 000

3 000 jest: - celem architektonicznym, - stress targetem, -
zabezpieczeniem przed hardcoded limitem.

Nie jest: - gwarantowanym limitem premierowym, - wymaganiem dla każdego
sprzętu.

------------------------------------------------------------------------

# 10. Akcja P0-SCALE

Przed implementacją należy zaktualizować cztery główne pliki: -
Architecture, - Simulation Model, - Simulation Test, - UI/UX.

W repo nie powinien pozostać aktywny kanoniczny tekst mówiący `max 800`.

------------------------------------------------------------------------

# 11. Państwa a regiony

Należy formalnie dodać:

> **Liczba regionów nie wyznacza liczby państw. Państwo jest emergentnym
> zbiorem regionów.**

Nie stosować założenia: `10 regionów = 1 państwo`.

------------------------------------------------------------------------

# 12. Konflikt P0 --- zestaw interwencji Vertical Slice

`Vertical-Slice-Spec` zawiera starszy zestaw: - Resource Reveal, -
Fertility Shift, - Population Seed / Migration Impulse, - Knowledge
Impulse, - Infrastructure Opportunity.

Nowszy `Architect-Intervention-Influence-Spec` definiuje: - Reveal
Resource Deposit, - Fertility Shift, - Knowledge Injection, - Trade
Friction Shift, - Environmental Shock, - Population Seed opcjonalnie
tylko jako narzędzie eksperymentalne.

------------------------------------------------------------------------

# 13. Rozstrzygnięcie interwencji VS

**KANON = Architect Spec.**

P0: 1. Reveal Resource Deposit 2. Fertility Shift 3. Knowledge Injection
4. Trade Friction Shift 5. Environmental Shock

Opcjonalne: 6. Population Seed --- tylko Experiment Mode / setup.

------------------------------------------------------------------------

# 14. Infrastructure Opportunity

Nie jest już podstawową interwencją VS.

Infrastruktura nadal istnieje jako system świata.

Może powstać później nowa jawna interwencja infrastrukturalna, ale nie
należy jej teraz traktować jako zatwierdzonego VS-INT-05.

------------------------------------------------------------------------

# 15. Akcja P0-ARCHITECT

Zaktualizować `Vertical-Slice-Spec` i scenariusze testowe do nowszego
zestawu.

------------------------------------------------------------------------

# 16. Konflikt P1 --- UI: mapa kontra Living Atlas

Starsza architektura zawiera wcześniejsze koncepcje centralnej
mapy/Living World Map.

Nowszy kierunek UI jest: - text-first, - Living Atlas / World Network, -
brak klasycznej mapy geograficznej jako fundamentu MVP.

------------------------------------------------------------------------

# 17. Rozstrzygnięcie UI

**KANON:**

> **FIRST CAUSE nie wymaga klasycznej mapy geograficznej jako głównego
> interfejsu Vertical Slice/MVP.**

Podstawą jest: - World Command Center, - Living Atlas / World Network, -
Region Detail, - Chronicle, - WHY?, - Architect.

------------------------------------------------------------------------

# 18. World Network

Jest wizualizacją zależności i nawigacji.

Nie jest source of truth.

------------------------------------------------------------------------

# 19. Akcja P1-UI

Starsze fragmenty o centralnej mapie oznaczyć
`SUPERSEDED BY UI/UX SPEC v0.1`.

------------------------------------------------------------------------

# 20. Konflikt P1 --- Adoption / Wdrożenie

W dokumentach systemowych powszechnie używane jest: `Adoption`.

Content/Localization pozostawia otwartą decyzję: `Adopcja / Wdrożenie`.

------------------------------------------------------------------------

# 21. Rozstrzygnięcie terminologiczne

Rekomendacja kanoniczna dla polskiego UI:

**Wdrożenie**

Przykłady: - Industry Adoption → Wdrożenie w przemyśle - Technology
Adoption → Wdrożenie technologii - PM Adoption → Wdrożenie Metody
Produkcji

W kodzie i IDs pozostaje: `adoption`.

------------------------------------------------------------------------

# 22. Dlaczego „Wdrożenie"

Jest bardziej naturalne dla gracza niż techniczne „adopcja".

Nie zmienia terminologii wewnętrznej engine.

------------------------------------------------------------------------

# 23. Discovery / Availability / Adoption / Access

Polski UI:

-   Knowledge → Wiedza
-   Discovery → Odkrycie
-   Availability → Dostępność
-   Adoption → Wdrożenie
-   Access → Dostęp

------------------------------------------------------------------------

# 24. Kwartalna vs miesięczna demografia

Starsze koncepcje architektury mogły zakładać rzadszą aktualizację
populacji.

Simulation Model i Vertical Slice używają miesięcznego ticka i
miesięcznej demografii.

------------------------------------------------------------------------

# 25. Rozstrzygnięcie demografii

**KANON: miesięczna aktualizacja demografii.**

Agregaty roczne mogą istnieć wyłącznie jako reporting/history.

------------------------------------------------------------------------

# 26. Tick

**KANON: 1 tick = 1 miesiąc.**

------------------------------------------------------------------------

# 27. Tick Pipeline

Kanoniczne 23 fazy z Simulation Model pozostają podstawą.

------------------------------------------------------------------------

# 28. Państwa w Vertical Slice

Entity Model posiada State/Nation.

Vertical Slice ogranicza/wyłącza państwa.

------------------------------------------------------------------------

# 29. Rozstrzygnięcie

VS: - State = disabled lub neutral adapter, - Nation = disabled, -
diplomacy = disabled, - war = disabled.

Schema pozostaje future-compatible.

------------------------------------------------------------------------

# 30. Wojna

Nie jest brakującym P0 systemem.

Jest świadomie deferred.

------------------------------------------------------------------------

# 31. Geopolityka

Analogicznie.

Nie blokuje VS.

------------------------------------------------------------------------

# 32. Ekonomia --- spójność

Production Economy Master jest spójny z: - Entity Model, - Simulation
Model, - AI Model, - Vertical Slice.

------------------------------------------------------------------------

# 33. Katalog gospodarczy

KANON target: - 38 resources, - 64 goods, - 28 company archetypes.

------------------------------------------------------------------------

# 34. VS Economy

KANON: - 12 resources, - 20 goods, - do 17 company archetypes.

------------------------------------------------------------------------

# 35. Ważna zasada

Docelowy katalog jest projektowany teraz.

Runtime VS aktywuje tylko podzbiór.

------------------------------------------------------------------------

# 36. Production Method

Production Method jest głównym mechanizmem postępu produkcyjnego.

Nie stosować płaskiego: `technology gives +20% output`.

------------------------------------------------------------------------

# 37. Electricity

KANON: - current-period flow, - brak ordinary inventory v0.1.

------------------------------------------------------------------------

# 38. Services

KANON: - oddzielone od zwykłych goods, -
capacity/accessibility/quality, - non-storable.

------------------------------------------------------------------------

# 39. Rynek

KANON: - jeden regionalny Market v0.1, - nie market per settlement.

------------------------------------------------------------------------

# 40. Transport

KANON: - physical region graph, - EffectiveDistance, - capacity, -
congestion, - transport cost.

------------------------------------------------------------------------

# 41. Technologia --- spójność

Technology Catalog jest spójny z pozostałymi dokumentami.

------------------------------------------------------------------------

# 42. 12 Knowledge Domains

KANON: 1 Agriculture 2 Construction 3 Metallurgy 4 Mining 5 Navigation 6
Medicine 7 Mathematics 8 Mechanics 9 Chemistry 10 Energy 11
Transportation 12 Communication

------------------------------------------------------------------------

# 43. Administration

Nie jest trzynastym Knowledge Domain v0.1.

To institutional capacity.

------------------------------------------------------------------------

# 44. Brak klasycznego tech tree

KANON.

Technologia jest emergentna.

------------------------------------------------------------------------

# 45. Stany technologii

KANON: `Unknown → Known → Available → Adopted`

plus: - Industry Adoption, - Population Access, - Institutional
Adoption.

------------------------------------------------------------------------

# 46. Polski UI technologii

`Nieznane → Znane → Dostępne → Wdrożone`.

------------------------------------------------------------------------

# 47. T0--T5

To complexity bands.

Nie epoki historyczne.

------------------------------------------------------------------------

# 48. AI --- spójność

AI Decision Model jest wystarczająco kompletny do VS.

------------------------------------------------------------------------

# 49. Perceived World State

KANON:

> **Aktor nie zna World State. Zna Perceived World State.**

------------------------------------------------------------------------

# 50. Brak globalnego AI Director

KANON.

Historia ma wynikać z lokalnych aktorów.

------------------------------------------------------------------------

# 51. AI Pipeline

KANON:
`OBSERVE → FORECAST → GENERATE OPTIONS → SCORE → DECIDE → ACT → EVALUATE`.

------------------------------------------------------------------------

# 52. Hysteresis i cooldown

P0.

Bez nich istnieje wysokie ryzyko oscylacji.

------------------------------------------------------------------------

# 53. Company AI

VS musi obejmować: - production, - inventory, - hiring, - wages, -
expansion, - contraction, - closure, - PM adoption, - financial
survival.

------------------------------------------------------------------------

# 54. Entrepreneurship

Regional Opportunity Scanner jest właściwym rozwiązaniem.

Nie tworzyć pełnego NPC przedsiębiorcy dla każdej możliwości.

------------------------------------------------------------------------

# 55. Causality --- spójność

Causality Engine jest jednym z najmocniej określonych systemów.

------------------------------------------------------------------------

# 56. Kluczowa reguła

> **Przyczynę rejestrujemy podczas decyzji/mutacji, nie rekonstruujemy
> jej później z gotowego świata.**

P0.

------------------------------------------------------------------------

# 57. SimulationFact

Jest kanoniczną jednostką historii przyczynowej.

------------------------------------------------------------------------

# 58. CausalEdge

Łączy fakty.

Nie łączy korelacji.

------------------------------------------------------------------------

# 59. WHY?

Musi być structured query.

Nie generowanym post-hoc opowiadaniem.

------------------------------------------------------------------------

# 60. DecisionSnapshot

P0 dla: - founding, - expansion, - contraction, - closure, - PM
adoption.

------------------------------------------------------------------------

# 61. CausalContext

P0 dla znaczących mutacji.

------------------------------------------------------------------------

# 62. Architect Influence

Propaguje po realnych Causal Edges.

Nie po podobieństwie wydarzeń.

------------------------------------------------------------------------

# 63. Chronicle --- spójność

Chronicle jest poprawnie oddzielony od Causality.

------------------------------------------------------------------------

# 64. Kanoniczne rozróżnienie

**WHY DID THIS HAPPEN?** → Causality.

**WHY DID THIS MATTER?** → Historical Significance.

------------------------------------------------------------------------

# 65. Chronicle nie jest truth source

P0.

------------------------------------------------------------------------

# 66. Retrospective Significance

Ważny element, ale może zostać wdrożony po podstawowym Chronicle
Candidate Pipeline.

------------------------------------------------------------------------

# 67. Historical Threads

P1 VS / wczesne MVP.

Nie blokują pierwszego działającego świata.

------------------------------------------------------------------------

# 68. Architect --- spójność

Nowszy Architect Spec powinien być nadrzędny wobec wcześniejszych
fragmentów VS.

------------------------------------------------------------------------

# 69. Architect Role

Gracz zmienia warunki.

Nie steruje aktorami.

------------------------------------------------------------------------

# 70. Influence

KANON: 0--100.

------------------------------------------------------------------------

# 71. Interwencja nie gwarantuje rezultatu

P0.

------------------------------------------------------------------------

# 72. No-effect ≠ failed

P0.

------------------------------------------------------------------------

# 73. Butterfly Effect

Jest analizą causal descendants.

Nie osobnym event generatorem.

------------------------------------------------------------------------

# 74. Save/Determinism --- spójność

Dokument jest zgodny z Entity Model i Test Spec poza starymi wartościami
skali w Test Spec.

------------------------------------------------------------------------

# 75. Determinism

P0 od pierwszego dnia implementacji.

Nie funkcja dodawana pod koniec.

------------------------------------------------------------------------

# 76. RNG

Wymagane: - seed, - version, - state/streams.

------------------------------------------------------------------------

# 77. RNG Streams

Rekomendowane: - world_generation, - demography, - company_ai, -
entrepreneurship, - migration, - discovery, - events, - naming.

------------------------------------------------------------------------

# 78. Stable Iteration

P0.

------------------------------------------------------------------------

# 79. Save Boundary

P0: save tylko po pełnym ticku.

------------------------------------------------------------------------

# 80. Mid-tick save

Nie wspierać v0.1.

------------------------------------------------------------------------

# 81. Versioning

P0: - schemaVersion, - contentVersion, - engineVersion.

------------------------------------------------------------------------

# 82. Cache

Derived state.

Musi być odbudowywalny.

------------------------------------------------------------------------

# 83. Content/Localization --- spójność

Dokument prawidłowo rozdziela: Engine → Content → Localization.

------------------------------------------------------------------------

# 84. English source locale

KANON.

------------------------------------------------------------------------

# 85. Polish

Pierwszy pełny dodatkowy locale.

------------------------------------------------------------------------

# 86. 14 języków

Architektura wspiera: EN, PL, DE, FR, ES, IT, pt-BR, zh-Hans, zh-Hant,
JA, KO, TR, RU, UK.

------------------------------------------------------------------------

# 87. VS localization

P0: - EN, - PL.

Pozostałe nie blokują VS.

------------------------------------------------------------------------

# 88. RTL

Nie jest wymagane v0.1.

------------------------------------------------------------------------

# 89. Content IDs

KANON: - stable, - English-like, - snake_case, - language-neutral.

------------------------------------------------------------------------

# 90. User-facing strings

Zakazane w Simulation Logic.

------------------------------------------------------------------------

# 91. Content Validation

P0 przed większym katalogiem.

------------------------------------------------------------------------

# 92. UI/UX --- spójność funkcjonalna

Poza starym limitem 800 i starszymi odniesieniami mapowymi dokument jest
zgodny z systemami.

------------------------------------------------------------------------

# 93. Command Center

Powinien być centrum obserwacji świata, nie dashboardem z każdą możliwą
liczbą.

------------------------------------------------------------------------

# 94. Główna pętla UX

``` text
OBSERVE
→ NOTICE CHANGE
→ ASK WHY?
→ FORM HYPOTHESIS
→ INTERVENE
→ RUN TIME
→ OBSERVE CONSEQUENCES
→ TRACE BUTTERFLY EFFECT
```

------------------------------------------------------------------------

# 95. UI nie jest source of truth

P0.

------------------------------------------------------------------------

# 96. UI Commands

Player actions powinny przechodzić przez Commands.

Nie bezpośrednie mutation entity.

------------------------------------------------------------------------

# 97. Simulation Test --- spójność

Test Spec jest bardzo kompletny, ale wymaga aktualizacji skali świata i
nowszego zestawu Architect interventions.

------------------------------------------------------------------------

# 98. Test Philosophy

KANON:

> **Nie testujemy jednej poprawnej historii. Testujemy mechanizmy
> generujące historię.**

------------------------------------------------------------------------

# 99. Black Mountain

Pozostaje głównym referencyjnym scenariuszem integracyjnym.

------------------------------------------------------------------------

# 100. Black Mountain nie jest tutorial script

P0.

------------------------------------------------------------------------

# 101. Dopuszczalne wyniki Black Mountain

-   no development,
-   resource boom,
-   industrialization,
-   resource bust,
-   diversification,
-   import transition,
-   technological extension,
-   ghost settlement.

------------------------------------------------------------------------

# 102. Największa luka P0 --- formalne runtime schemas

Entity Data Model definiuje pola koncepcyjnie.

Brakuje jeszcze zatwierdzonego zestawu konkretnych: - TypeScript
interfaces / structs, - JSON Schemas, - enums, - serialized DTOs.

------------------------------------------------------------------------

# 103. Czy tworzyć osobny wielki dokument schemas?

Nie.

Powinny powstać bezpośrednio przy implementacji jako: -
`/src/.../types` - `/data/schemas/...`

z krótkim `Schema Conventions.md`.

------------------------------------------------------------------------

# 104. Dlaczego

Poziom szczegółowości zależy od wybranego stacku.

Dokumentowanie ich drugi raz przed kodem zwiększyłoby ryzyko driftu.

------------------------------------------------------------------------

# 105. Luka P0 --- konkretny stack technologiczny

Dokumentacja nie ustala jednoznacznie: - języka, - frameworka, - silnika
UI, - persistence library.

------------------------------------------------------------------------

# 106. Wniosek

Przed wygenerowaniem repo należy podjąć **Technology Stack Decision**.

To nie wymaga dużej specyfikacji gameplayowej.

------------------------------------------------------------------------

# 107. Minimalna Technology Stack Decision

Powinna ustalić: 1. język, 2. runtime, 3. UI framework, 4. build
tooling, 5. test framework, 6. serialization approach VS, 7. data
format, 8. localization library, 9. profiling tools.

------------------------------------------------------------------------

# 108. Luka P0 --- World Generation

Dokumentacja opisuje World State, seed i regiony, ale nie ma pełnego
algorytmu tworzenia świata.

------------------------------------------------------------------------

# 109. Brakujące elementy World Generation

Należy ustalić: - tworzenie grafu regionów, - kontynenty, -
terrain/climate distribution, - fertility/water, - resource deposits, -
początkową populację, - początkowe settlements, - początkową
infrastrukturę, - initial knowledge, - initial firms, - start
inventories, - starting prices, - cultural seeds, - connectivity.

------------------------------------------------------------------------

# 110. Czy World Generation blokuje kodowanie?

Nie blokuje: - core, - RNG, - Entity Model, - data loader, - tick
pipeline.

Blokuje pełny automatycznie generowany Vertical Slice.

------------------------------------------------------------------------

# 111. Rekomendacja World Generation

Stworzyć **`FIRST-CAUSE-World-Generation-Spec-v0.1.md`** jako ostatni
brakujący dokument gameplayowo-techniczny przed pełnym VS.

------------------------------------------------------------------------

# 112. Priorytet World Generation

P0 przed etapem, w którym świat ma powstawać automatycznie.

------------------------------------------------------------------------

# 113. Reference World

Black Mountain może początkowo używać deterministycznego ręcznie
przygotowanego fixture.

To pozwala rozwijać systemy zanim generator będzie kompletny.

------------------------------------------------------------------------

# 114. Luka P1 --- Profession Catalog

Entity Model określa minimalne profesje VS, ale nie pełny katalog
docelowy.

------------------------------------------------------------------------

# 115. Rozstrzygnięcie

Nie blokuje VS.

Minimalne: - agriculture, - extraction, - manufacturing, -
construction, - transport, - services, - specialist.

------------------------------------------------------------------------

# 116. Luka P1 --- Culture traits

Culture schema istnieje, ale pełne traits/values nie są zdefiniowane.

------------------------------------------------------------------------

# 117. Rozstrzygnięcie

VS używa uproszczonej Culture: - cultureId, - shares, - affinity.

Pełny Culture Model deferred.

------------------------------------------------------------------------

# 118. Luka P1 --- Finance

Bank istnieje w target company archetypes, ale pełny credit system nie
jest gotowy.

------------------------------------------------------------------------

# 119. Rozstrzygnięcie

VS: - cash, - simplified debt jeśli potrzebny, - brak rozbudowanego
banking/credit.

------------------------------------------------------------------------

# 120. Luka P1 --- Facilities

Entity Model pozostawia otwarte: facility jako osobna entity czy część
Company.

------------------------------------------------------------------------

# 121. Rekomendacja VS

Nie tworzyć pełnej Facility entity, jeśli nie jest wymagana przez
mechanikę.

Capacity/infrastructure można trzymać w Company/Infrastructure.

------------------------------------------------------------------------

# 122. Luka P1 --- power grid topology

Nie jest wymagana VS.

------------------------------------------------------------------------

# 123. Luka P1 --- currencies

Nie jest wymagana VS.

------------------------------------------------------------------------

# 124. Luka P1 --- ownership

VS: generic OwnerRef wystarczy.

------------------------------------------------------------------------

# 125. Luka P1 --- Historical Characters

Nie są wymagani jako pełny system VS.

------------------------------------------------------------------------

# 126. Luka P1 --- State Formation

Nie blokuje VS.

Ale przed aktywacją państw wymaga osobnej specyfikacji.

------------------------------------------------------------------------

# 127. Dokumenty, których NIE tworzyć teraz

Nie tworzyć przed VS: - Warfare Master Spec, - Diplomacy Master Spec, -
Full Politics Spec, - Full Character Simulation Spec, - Full Banking
Spec, - Multiplayer Spec, - Modding UI Spec.

------------------------------------------------------------------------

# 128. Ryzyko overdesign

Dokumentacja jest już bardzo rozbudowana.

Dalsze projektowanie bez działającego Vertical Slice zwiększa ryzyko: -
sprzeczności, - driftu, - projektowania problemów, których runtime nie
potwierdzi.

------------------------------------------------------------------------

# 129. Zasada od teraz

> **Nowy dokument powstaje tylko wtedy, gdy usuwa konkretny blocker
> implementacyjny.**

------------------------------------------------------------------------

# 130. P0 Blockers przed właściwym VS

1.  Canonical Cleanup.
2.  Technology Stack Decision.
3.  deterministic core conventions.
4.  runtime schemas dla pierwszych encji.
5.  content loader/schema.
6.  reference fixture Black Mountain.
7.  World Generation Spec przed proceduralnym generatorem.

------------------------------------------------------------------------

# 131. Canonical Cleanup --- lista zmian

Należy ujednolicić: - region scale, - Architect VS interventions, -
map/UI terminology, - Adoption/Wdrożenie, - demography monthly, -
English/Polish localization P0.

------------------------------------------------------------------------

# 132. Zalecany plik Canonical Decisions

Utworzyć mały: `FIRST-CAUSE-Canonical-Decisions-v0.1.md`.

Nie kolejny 300-sekcyjny dokument.

------------------------------------------------------------------------

# 133. Rola Canonical Decisions

Jedna tabela: - Decision ID, - current decision, - source, -
supersedes, - date/version.

------------------------------------------------------------------------

# 134. Przykład

``` text
WORLD-001
Architecture Target = 3000 regions
Supersedes max 800
Source: Save/Determinism/Performance v0.1
```

------------------------------------------------------------------------

# 135. Zaleta

Claude Code/Codex nie musi rozstrzygać sprzeczności między 14
dokumentami.

------------------------------------------------------------------------

# 136. Documentation Authority

Do promptów implementacyjnych należy załączać: 1. Canonical Decisions,
2. dokument systemu, 3. Entity Model, 4. VS Spec, 5. Test Spec.

Nie wszystkie dokumenty naraz, jeśli nie są potrzebne.

------------------------------------------------------------------------

# 137. Implementacja --- zasada

Nie wdrażać całej gry moduł po module bez pionowego testu.

------------------------------------------------------------------------

# 138. Pierwszy cel techniczny

**Deterministic Empty World.**

------------------------------------------------------------------------

# 139. Milestone M0 --- Repository Foundation

-   repo,
-   build,
-   tests,
-   lint,
-   directory structure,
-   CI basic.

------------------------------------------------------------------------

# 140. M1 --- Deterministic Core

-   time,
-   tick,
-   seed,
-   RNG streams,
-   stable IDs,
-   stable iteration,
-   checksum.

------------------------------------------------------------------------

# 141. M2 --- Data Foundation

-   schemas,
-   content loader,
-   definition registries,
-   phase activation,
-   validation,
-   EN/PL keys.

------------------------------------------------------------------------

# 142. M3 --- World State Foundation

Implementować: - World, - Region, - Connection, - Settlement, -
Cohort, - Deposit, - Market, - Inventory, - Company, - TechnologyState.

------------------------------------------------------------------------

# 143. M4 --- Reference World Fixture

Ręcznie zdefiniowany 8--12-region mini-world.

Zawiera Black Mountain.

------------------------------------------------------------------------

# 144. Dlaczego mini fixture przed 32 regionami

Szybszy debug.

------------------------------------------------------------------------

# 145. M5 --- Resources

-   deposits,
-   discovery status,
-   extraction,
-   depletion,
-   resource invariants.

------------------------------------------------------------------------

# 146. M6 --- Minimal Population

-   cohorts,
-   monthly demographics,
-   needs skeleton,
-   population conservation.

------------------------------------------------------------------------

# 147. M7 --- Production

-   company,
-   PM,
-   inputs,
-   outputs,
-   labor,
-   inventory.

------------------------------------------------------------------------

# 148. M8 --- Market

-   supply,
-   demand,
-   price,
-   shortages,
-   smoothing.

------------------------------------------------------------------------

# 149. M9 --- Labor & Households

-   employment,
-   wages,
-   income,
-   consumption,
-   needs.

------------------------------------------------------------------------

# 150. M10 --- Trade & Transport

-   connection graph,
-   EffectiveDistance,
-   delivered cost,
-   capacity,
-   basic flows.

------------------------------------------------------------------------

# 151. M11 --- Company AI

-   observe,
-   forecast,
-   production,
-   hiring,
-   survival.

------------------------------------------------------------------------

# 152. M12 --- Entrepreneurship

-   Opportunity Scanner,
-   founding,
-   competition.

------------------------------------------------------------------------

# 153. M13 --- Migration

-   attraction,
-   candidate destinations,
-   friction,
-   housing constraint.

------------------------------------------------------------------------

# 154. M14 --- Settlements

-   SettlementPressure,
-   stages,
-   housing,
-   growth/decline.

------------------------------------------------------------------------

# 155. M15 --- Technology

-   Knowledge,
-   eligibility,
-   Discovery,
-   Availability,
-   PM adoption.

------------------------------------------------------------------------

# 156. M16 --- Architect

Pierwsza interwencja: `Reveal Resource Deposit`.

------------------------------------------------------------------------

# 157. M17 --- Causality

Nie odkładać do końca.

Minimalny Fact infrastructure powinien istnieć wcześniej.

Pełny WHY? można rozbudować tutaj.

------------------------------------------------------------------------

# 158. Causality Bootstrap

Już od M5 systemy powinny emitować podstawowe facts.

------------------------------------------------------------------------

# 159. M18 --- WHY?

Najpierw: - resource discovery, - company founding, - price, -
migration, - settlement growth.

------------------------------------------------------------------------

# 160. M19 --- Chronicle

-   significance,
-   candidates,
-   entries,
-   EN/PL templates.

------------------------------------------------------------------------

# 161. M20 --- Save/Load

Basic save powinien istnieć wcześniej niż M20, ale tutaj przechodzi
pełną integrację.

------------------------------------------------------------------------

# 162. M21 --- UI Shell

UI shell może powstać wcześniej.

Pełny World Command Center dopiero gdy istnieją prawdziwe read models.

------------------------------------------------------------------------

# 163. M22 --- World Generation

Generator tworzy 32-region Reference VS.

------------------------------------------------------------------------

# 164. M23 --- Black Mountain 200 Years

Pierwszy pełny gate.

------------------------------------------------------------------------

# 165. M24 --- Performance & Tuning

Po poprawności.

------------------------------------------------------------------------

# 166. M25 --- VS Freeze

Po przejściu Gates A--J.

------------------------------------------------------------------------

# 167. Kolejność a oryginalne VS-01--VS-14

Nie jest sprzeczna.

Nowa lista jest bardziej implementacyjna.

VS Spec pozostaje listą systemów.

Ten audyt dodaje dependency order.

------------------------------------------------------------------------

# 168. Critical Dependency Graph

``` text
CORE
 ↓
DATA
 ↓
WORLD STATE
 ↓
RESOURCES + POPULATION
 ↓
PRODUCTION
 ↓
MARKET
 ↓
LABOR/CONSUMPTION
 ↓
TRADE
 ↓
AI
 ↓
MIGRATION/SETTLEMENT
 ↓
TECHNOLOGY
 ↓
ARCHITECT
 ↓
CAUSALITY/WHY
 ↓
CHRONICLE
 ↓
FULL UI
```

------------------------------------------------------------------------

# 169. Causality jako cross-cutting concern

Fact infrastructure zaczyna się wcześnie.

Nie czekamy do końca grafu.

------------------------------------------------------------------------

# 170. Save jako cross-cutting concern

Roundtrip test powinien rosnąć razem z World State.

------------------------------------------------------------------------

# 171. Validation jako cross-cutting concern

Każda nowa entity/system: - schema validation, - invariants, - tests.

------------------------------------------------------------------------

# 172. Localization jako cross-cutting concern

Każdy nowy user-facing element: - EN, - PL, - no hardcoded strings.

------------------------------------------------------------------------

# 173. Performance jako cross-cutting concern

Profiling zaczyna się wcześnie.

Optymalizacja później.

------------------------------------------------------------------------

# 174. Black Mountain --- minimalny causal spine

``` text
Hidden Iron
→ Discovery
→ Opportunity
→ Founding Decision
→ Mine
→ Employment
→ Wages
→ Migration
→ Settlement Growth
→ Trade/Construction
→ Depletion
→ Transition/Bust
```

------------------------------------------------------------------------

# 175. Pierwszy Vertical Slice nie potrzebuje całej tej ścieżki od razu

Budować kolejnymi checkpointami.

------------------------------------------------------------------------

# 176. Checkpoint BM-1

Deposit exists and can be discovered.

------------------------------------------------------------------------

# 177. BM-2

Discovery creates economic opportunity.

------------------------------------------------------------------------

# 178. BM-3

AI can found mine.

------------------------------------------------------------------------

# 179. BM-4

Mine physically produces and consumes inputs/labor.

------------------------------------------------------------------------

# 180. BM-5

Employment affects population.

------------------------------------------------------------------------

# 181. BM-6

Migration responds.

------------------------------------------------------------------------

# 182. BM-7

Settlement grows.

------------------------------------------------------------------------

# 183. BM-8

Trade supports boom.

------------------------------------------------------------------------

# 184. BM-9

Technology can alter path.

------------------------------------------------------------------------

# 185. BM-10

Depletion changes economics.

------------------------------------------------------------------------

# 186. BM-11

Post-depletion transition emerges.

------------------------------------------------------------------------

# 187. BM-12

WHY? explains entire chain.

------------------------------------------------------------------------

# 188. BM-13

Chronicle selects important history.

------------------------------------------------------------------------

# 189. BM-14

Architect Butterfly traces to intervention.

------------------------------------------------------------------------

# 190. BM-15

Save/load and ×1/×100 deterministic.

------------------------------------------------------------------------

# 191. Data ownership audit

World owns: - global time/config/state.

Region owns: - geography/environment and references to local entities.

------------------------------------------------------------------------

# 192. Population ownership

PopulationCohort owns demographic/socioeconomic cohort state.

Region/Settlement totals are derived/cached.

------------------------------------------------------------------------

# 193. Resource ownership

ResourceDeposit owns physical stock.

Market does not own resource stock.

------------------------------------------------------------------------

# 194. Goods ownership

Inventory owns physical goods.

Market owns price/supply-demand state, not physical stock truth.

------------------------------------------------------------------------

# 195. Company ownership

Company owns: - finance, - production state, - workforce demand, - AI
persistent state.

------------------------------------------------------------------------

# 196. Technology ownership

TechnologyState owns regional knowledge/discovery/adoption.

------------------------------------------------------------------------

# 197. Causal ownership

SimulationFact owns recorded historical change.

CausalEdge owns causal relation.

------------------------------------------------------------------------

# 198. Chronicle ownership

ChronicleEntry owns presentation selection/reference.

Nie owns history truth.

------------------------------------------------------------------------

# 199. Architect ownership

InterventionInstance owns intervention history.

World systems own downstream consequences.

------------------------------------------------------------------------

# 200. UI ownership

UI owns presentation state only.

------------------------------------------------------------------------

# 201. Ownership audit result

**PASS.**

Entity Model ma wystarczająco jasny model własności.

------------------------------------------------------------------------

# 202. Ryzyko duplicate derived state

Należy pilnować: - region total population, - market inventory, -
company output aggregates, - world totals.

Każdy musi mieć canonical owner + reconciliation.

------------------------------------------------------------------------

# 203. API boundary audit

Dokumentacja sugeruje Commands i Read Models, ale nie definiuje pełnego
API.

------------------------------------------------------------------------

# 204. Rekomendacja

Nie tworzyć osobnego wielkiego API Spec.

Zdefiniować interfejsy przy implementacji modułów.

------------------------------------------------------------------------

# 205. Minimalne Commands P0

-   CreateWorld
-   SetSimulationSpeed
-   Pause
-   ApplyArchitectIntervention
-   CancelIntervention
-   Save
-   Load.

------------------------------------------------------------------------

# 206. Read Models P0

-   WorldOverview
-   RegionDetail
-   SettlementDetail
-   Market
-   Company
-   Technology
-   Chronicle
-   WhyExplanation
-   Architect.

------------------------------------------------------------------------

# 207. Event/Fact boundary

Simulation event bus nie może zastąpić deterministic tick pipeline.

------------------------------------------------------------------------

# 208. Event bus

Służy do: - invalidation, - facts, - notifications.

Nie do przypadkowego async mutation order.

------------------------------------------------------------------------

# 209. Performance audit

Architektura poprawnie rozpoznaje największe ryzyka.

------------------------------------------------------------------------

# 210. Najważniejsza zasada skali

Nie: `actor × all regions`.

------------------------------------------------------------------------

# 211. 3 000 regionów

Wymaga: - locality, - graph contacts, - candidate sets, - staggered
reviews, - sparse state gdzie opłacalne, - history compaction, - UI LOD.

------------------------------------------------------------------------

# 212. Brak gwarantowanych ms/tick

To poprawne na tym etapie.

Najpierw baseline.

------------------------------------------------------------------------

# 213. ×100

Musi liczyć wszystkie ticki.

Render może być rzadszy.

------------------------------------------------------------------------

# 214. Save growth

Największe ryzyko: causal/history, nie same regiony.

------------------------------------------------------------------------

# 215. Test readiness

Test Spec jest wystarczająco dobry do TDD/system tests.

------------------------------------------------------------------------

# 216. Co testować od pierwszego commita

-   RNG repeatability,
-   stable IDs,
-   checksum,
-   content schema,
-   save roundtrip.

------------------------------------------------------------------------

# 217. Pierwszy simulation invariant

`no NaN / Infinity`.

------------------------------------------------------------------------

# 218. Następne invariants

-   population \>= 0,
-   deposit \>= 0,
-   inventory \>= 0,
-   price \> 0,
-   refs valid.

------------------------------------------------------------------------

# 219. Conservation tests

P0 przy wejściu produkcji/handlu/populacji.

------------------------------------------------------------------------

# 220. Golden Run

`BLACK_MOUNTAIN_REFERENCE`.

------------------------------------------------------------------------

# 221. Golden Run nie może oznaczać identycznego „dobrego" outcome po każdej zmianie balansu

Checksum Golden Run jest wersjonowany z engine/content version.

------------------------------------------------------------------------

# 222. Readiness --- Core

**GO.**

------------------------------------------------------------------------

# 223. Readiness --- Economy

**GO.**

------------------------------------------------------------------------

# 224. Readiness --- AI

**GO.**

------------------------------------------------------------------------

# 225. Readiness --- Technology

**GO.**

------------------------------------------------------------------------

# 226. Readiness --- Causality

**GO.**

------------------------------------------------------------------------

# 227. Readiness --- Chronicle

**GO.**

------------------------------------------------------------------------

# 228. Readiness --- Architect

**GO po aktualizacji VS intervention list.**

------------------------------------------------------------------------

# 229. Readiness --- UI

**GO po scale/map cleanup.**

------------------------------------------------------------------------

# 230. Readiness --- Save/Determinism

**GO.**

------------------------------------------------------------------------

# 231. Readiness --- Localization

**GO po terminological lock.**

------------------------------------------------------------------------

# 232. Readiness --- World Generation

**NO-GO dla proceduralnego 32-region world generatora.**

Wymaga specyfikacji.

------------------------------------------------------------------------

# 233. Readiness --- Full VS

**CONDITIONAL GO.**

------------------------------------------------------------------------

# 234. Priorytet błędów dokumentacji

P0: - scale, - Architect VS list, - stack decision, - World Generation
before generator, - runtime schema conventions.

P1: - UI superseded map language, - Adoption/Wdrożenie, -
profession/culture/facility decisions.

P2: - full state formation, - currencies, - banking, - advanced
characters.

------------------------------------------------------------------------

# 235. Zalecana akcja 1

Wykonać automatyczny **Canonical Cleanup** istniejących `.md`.

------------------------------------------------------------------------

# 236. Zalecana akcja 2

Utworzyć krótki: `FIRST-CAUSE-Canonical-Decisions-v0.1.md`.

------------------------------------------------------------------------

# 237. Zalecana akcja 3

Utworzyć: `FIRST-CAUSE-World-Generation-Spec-v0.1.md`.

------------------------------------------------------------------------

# 238. Zalecana akcja 4

Podjąć Technology Stack Decision.

------------------------------------------------------------------------

# 239. Zalecana akcja 5

Rozpocząć M0--M4.

------------------------------------------------------------------------

# 240. Czy tworzyć jeszcze Design System?

Nie jest blockerem core simulation.

Może powstać przed M21, gdy UI Shell zostanie zweryfikowany na realnych
danych.

------------------------------------------------------------------------

# 241. Czy tworzyć State Formation Spec teraz?

Nie.

------------------------------------------------------------------------

# 242. Czy tworzyć pełny Resource/Goods katalog ponownie?

Nie.

Production Economy Master już pełni tę rolę.

------------------------------------------------------------------------

# 243. Czy tworzyć osobny Technology Tree?

Nie.

Byłoby to sprzeczne z projektem.

------------------------------------------------------------------------

# 244. Czy tworzyć osobny AI Director?

Nie.

Byłoby to sprzeczne z emergence-first.

------------------------------------------------------------------------

# 245. Czy tworzyć osobny Story Generator?

Nie przed działającym Chronicle.

------------------------------------------------------------------------

# 246. Dokumentacja a kod

Po rozpoczęciu implementacji należy ograniczyć powielanie konkretnych
struktur.

------------------------------------------------------------------------

# 247. Source of Truth po implementacji

-   behavior → tested engine code,
-   numeric content → validated data files,
-   schemas → runtime schemas/types,
-   localization → locale files,
-   design intent → specs,
-   canonical decisions → Canonical Decisions file.

------------------------------------------------------------------------

# 248. Documentation Drift Check

Przed milestone release: porównać specs z runtime definitions.

------------------------------------------------------------------------

# 249. Generated docs

Warto generować z danych: - listę resources, - goods, - companies, -
discoveries, - interventions.

------------------------------------------------------------------------

# 250. Nie generować automatycznie

-   philosophy,
-   rationale,
-   architecture decisions.

------------------------------------------------------------------------

# 251. Prompting Claude Code / Codex

Każdy prompt implementacyjny powinien zawierać: - konkretny milestone, -
files to read, - canonical decisions, - acceptance tests, - zakaz
rozszerzania scope.

------------------------------------------------------------------------

# 252. Agent Rule

> **Nie implementuj systemu tylko dlatego, że istnieje w FULL spec,
> jeśli nie jest aktywny w bieżącym milestone/VS.**

------------------------------------------------------------------------

# 253. Agent Rule --- no invention

Jeśli spec nie rozstrzyga wartości tuningowej: - użyć config
placeholder/default, - oznaczyć TODO tuning, - nie tworzyć nowej
mechaniki.

------------------------------------------------------------------------

# 254. Agent Rule --- no hardcoding

Nie kodować Black Mountain specjalnie.

------------------------------------------------------------------------

# 255. Agent Rule --- tests first

Każdy mechanizm: - tests, - invariant, - deterministic behavior.

------------------------------------------------------------------------

# 256. Agent Rule --- data-driven

Nowy content przez definitions.

------------------------------------------------------------------------

# 257. Agent Rule --- causal hooks

Każda znacząca mutacja ma przewidzieć CausalContext/Fact hook.

------------------------------------------------------------------------

# 258. Agent Rule --- save

Każdy persistent state field musi odpowiedzieć: czy jest canonical czy
derived.

------------------------------------------------------------------------

# 259. Agent Rule --- performance

Nie global scan bez uzasadnienia.

------------------------------------------------------------------------

# 260. Agent Rule --- localization

No user-facing strings in simulation.

------------------------------------------------------------------------

# 261. Recommended repo documentation

``` text
/docs/
  canonical/
  architecture/
  systems/
  vertical-slice/
  audits/

/data/
  definitions/
  schemas/
  locales/

/src/
/tests/
/benchmarks/
```

------------------------------------------------------------------------

# 262. Canonical folder

Powinien zawierać: - Canonical Decisions, - Architecture, - Simulation
Model, - Entity Model, - Vertical Slice.

------------------------------------------------------------------------

# 263. System specs

Pozostałe dokumenty w `/docs/systems`.

------------------------------------------------------------------------

# 264. Audit archive

Ten dokument w `/docs/audits`.

------------------------------------------------------------------------

# 265. Version naming

Nie zmieniać numeru spec tylko przy poprawce literówki.

Przy zmianie decyzji kanonicznej: - v0.2, - albo changelog +
supersession.

------------------------------------------------------------------------

# 266. Changelog

Każdy główny spec powinien docelowo mieć krótki changelog.

------------------------------------------------------------------------

# 267. Decision IDs

Rekomendowane: - WORLD- - SIM- - ECO- - TECH- - AI- - CAUS- - CHRON- -
ARCH- - UI- - SAVE- - CONTENT-.

------------------------------------------------------------------------

# 268. Najważniejsze decyzje do Canonical Decisions

WORLD-001 Region target 3000. SIM-001 Tick monthly. SIM-002 Region
compute unit. ECO-001 Regional market. ECO-002 PM data-driven. TECH-001
no classic tech tree. AI-001 Perceived State. CAUS-001 cause recorded at
mutation. CHRON-001 Chronicle not truth. ARCH-001 conditions not
outcomes. UI-001 text-first Living Atlas. SAVE-001 deterministic world.
CONTENT-001 Engine/Data/Localization separation.

------------------------------------------------------------------------

# 269. Architecture readiness score

Ocena jakościowa:

-   Vision: 9/10
-   Simulation decomposition: 9/10
-   Data ownership: 9/10
-   Economy: 9/10
-   Technology: 9/10
-   AI: 9/10
-   Causality: 10/10
-   Chronicle: 9/10
-   Architect: 9/10
-   Testing: 9/10
-   Save/Determinism: 9/10
-   UI: 8/10
-   Content/Localization: 9/10
-   World Generation: 5/10
-   Implementation contracts: 7/10

------------------------------------------------------------------------

# 270. Największa przewaga projektu

Causality nie jest dekoracją.

Jest zaprojektowana jako część mutation pipeline.

To powinno zostać zachowane podczas implementacji.

------------------------------------------------------------------------

# 271. Największe ryzyko projektu

Nie liczba systemów sama w sobie.

Największe ryzyko to:

> **interakcja wielu poprawnych systemów prowadząca do niestabilnej lub
> nieczytelnej symulacji.**

------------------------------------------------------------------------

# 272. Mitigacja

-   Vertical Slice,
-   Black Mountain,
-   invariants,
-   deterministic replay,
-   WHY?,
-   debug inspectors,
-   long-run tests.

------------------------------------------------------------------------

# 273. Drugie największe ryzyko

Performance przy: - 3 000 regionów, - tysiącach firm, - długiej causal
history.

------------------------------------------------------------------------

# 274. Mitigacja

-   region locality,
-   cohorts,
-   candidate sets,
-   staggered reviews,
-   causal compaction,
-   benchmark before promises.

------------------------------------------------------------------------

# 275. Trzecie największe ryzyko

Overdesign przed runtime feedback.

------------------------------------------------------------------------

# 276. Mitigacja

Po World Generation Spec: **stop dużym dokumentom i zacząć
implementację.**

------------------------------------------------------------------------

# 277. Finalna rekomendacja audytu

Nie rozpoczynać kolejnego szerokiego systemu projektowego.

Wykonać:

1.  Canonical Cleanup.
2.  Canonical Decisions v0.1.
3.  World Generation Spec v0.1.
4.  Technology Stack Decision.
5.  Repo foundation.
6.  Deterministic Core.
7.  Data/Entity foundation.
8.  Black Mountain fixture.
9.  Vertical Slice system po systemie.

------------------------------------------------------------------------

# 278. Implementation Readiness Gate

FIRST CAUSE może wejść do implementacji fundamentu **natychmiast po
Canonical Cleanup**.

Proceduralny World Generation powinien poczekać na jego specyfikację.

------------------------------------------------------------------------

# 279. GO / NO-GO

**GO:** M0--M4.

**CONDITIONAL GO:** pełny Vertical Slice.

**NO-GO:** proceduralny generator świata bez World Generation Spec.

**NO-GO:** rozszerzanie teraz projektu o war, diplomacy, full politics i
inne FULL systems.

------------------------------------------------------------------------

# 280. Ostateczny kanon Vertical Slice

-   32 reference regions,
-   monthly tick,
-   cohort population,
-   regional markets,
-   physical inventories,
-   physical trade graph,
-   12 resources,
-   20 goods,
-   do 17 company archetypes,
-   PM-based production,
-   5 core Knowledge Domains + support,
-   20--30 discoveries,
-   autonomous Company AI,
-   entrepreneurship,
-   wages/employment,
-   consumption/needs,
-   migration,
-   settlement growth,
-   5 core Architect interventions,
-   Simulation Facts,
-   Causal Edges,
-   WHY?,
-   Chronicle,
-   save/load,
-   deterministic replay,
-   EN/PL,
-   200-year benchmark,
-   Black Mountain.

------------------------------------------------------------------------

# 281. Systems wyłączone w VS

-   warfare,
-   diplomacy,
-   full states,
-   nations,
-   advanced politics,
-   currencies,
-   stock market,
-   advanced banking,
-   advanced ownership,
-   full character simulation,
-   aviation,
-   modern advanced economy,
-   multiplayer.

------------------------------------------------------------------------

# 282. Success Condition

Vertical Slice jest sukcesem, jeśli:

> **gracz zmienia jeden warunek, świat sam reaguje, powstają
> nieplanowane konsekwencje, a po dekadach można mechanicznie
> prześledzić dlaczego do nich doszło.**

------------------------------------------------------------------------

# 283. Documentation Success Condition

Dokumentacja jest gotowa do implementacji, gdy agent programistyczny nie
musi sam rozstrzygać: - który limit regionów jest aktualny, - który
zestaw interwencji jest aktualny, - czy mapa jest obowiązkowa, - co jest
canonical state, - co jest derived, - które systemy należą do VS.

Po wykonaniu wskazanego cleanupu ten warunek będzie spełniony.

------------------------------------------------------------------------

# 284. Następny dokument

Jedyny rekomendowany duży dokument przed pełną implementacją:

**`FIRST-CAUSE-World-Generation-Spec-v0.1.md`**

Przed nim lub równolegle warto utworzyć krótki:

**`FIRST-CAUSE-Canonical-Decisions-v0.1.md`**

------------------------------------------------------------------------

# 285. Final Verdict

**FIRST CAUSE jest projektowo gotowy do rozpoczęcia implementacji
fundamentu.**

Nie jest potrzebna kolejna fala projektowania systemów.

Potrzebne jest teraz przejście od: **specification completeness**

do: **executable correctness**.

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE Master Documentation Consistency &
Implementation Readiness Audit v0.1**
