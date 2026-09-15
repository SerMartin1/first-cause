# FIRST CAUSE --- Canonical Decisions v0.1

**Status:** dokument kanoniczny / obowiązujący\
**Projekt:** FIRST CAUSE\
**Wersja:** 0.1\
**Rola:** pojedynczy rejestr aktualnych decyzji projektowych, który
rozstrzyga konflikty pomiędzy starszymi i nowszymi dokumentami.

> **Jeżeli starszy dokument FIRST CAUSE jest sprzeczny z decyzją
> zapisaną tutaj, obowiązuje niniejszy dokument.**

------------------------------------------------------------------------

# 1. Jak używać tego dokumentu

Ten plik nie zastępuje szczegółowych specyfikacji.

Służy do szybkiego ustalenia: - która decyzja jest aktualna, - który
dokument ją rozwija, - co zostało zastąpione, - co należy implementować
w Vertical Slice, - czego nie należy jeszcze implementować.

Przy pracy z Claude Code, Codex lub innym agentem kodującym ten dokument
powinien być traktowany jako **pierwsze źródło rozstrzygające konflikty
dokumentacji**.

------------------------------------------------------------------------

# 2. Hierarchia źródeł

W przypadku braku decyzji w tym pliku:

1.  użyj najnowszej specjalistycznej specyfikacji danego systemu,
2.  następnie `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` dla zakresu VS,
3.  następnie `FIRST-CAUSE-Entity-Data-Model-v0.1.md`,
4.  następnie `FIRST-CAUSE-Simulation-Model-v0.1.md`,
5.  następnie ogólnej architektury.

Jeżeli nadal istnieje konflikt --- **nie zgaduj**. Oznacz go jako
wymagający decyzji.

------------------------------------------------------------------------

# 3. Statusy

-   **CANONICAL** --- obowiązująca decyzja.
-   **VS** --- obowiązuje w Vertical Slice.
-   **TARGET** --- docelowa architektura.
-   **DEFERRED** --- świadomie poza VS.
-   **OPEN** --- jeszcze nie rozstrzygnięto.

------------------------------------------------------------------------

# 4. WORLD-001 --- filozofia gry

**Status:** CANONICAL

> **Gracz tworzy przyczynę. Symulacja tworzy konsekwencje.**

Gracz jest Architektem / Obserwatorem, a nie bezpośrednim władcą,
trenerem, burmistrzem ani zarządcą wszystkich aktorów.

------------------------------------------------------------------------

# 5. WORLD-002 --- autonomia świata

**Status:** CANONICAL

Świat działa autonomicznie.

Firmy, populacja, migracja, technologia, gospodarka i późniejsze państwa
reagują na warunki systemowe, a nie na ukryty scenariusz.

------------------------------------------------------------------------

# 6. WORLD-003 --- Region

**Status:** CANONICAL

**Region jest podstawową jednostką obliczeniową i przestrzenną
symulacji.**

------------------------------------------------------------------------

# 7. WORLD-004 --- hierarchia świata

**Status:** TARGET

``` text
WORLD
→ CONTINENT
→ REGION
→ SETTLEMENT / CITY
→ ORGANIZATION
→ POPULATION / HISTORICAL CHARACTER
```

Równolegle:

``` text
CULTURE → NATION → STATE
RESOURCE → PRODUCTION → GOODS → TRADE → CONSUMPTION
```

------------------------------------------------------------------------

# 8. WORLD-005 --- liczba regionów

**Status:** CANONICAL

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

# 9. WORLD-006 --- 3 000 regionów

**Status:** TARGET

3 000 regionów jest **Architecture Target**, a nie gwarantowanym limitem
wersji premierowej.

Finalny `officialMaxRegions` zostanie ustalony na podstawie benchmarków
CPU, RAM, save/load, stabilności i UX.

**Supersedes:** wcześniejsze limity 500, 800, 1000 regionów.

------------------------------------------------------------------------

# 10. WORLD-007 --- regiony a państwa

**Status:** CANONICAL

Nie istnieje stała proporcja typu: `10 regionów = 1 państwo`.

Państwa są emergentnymi zbiorami regionów.

Małe państwo może obejmować kilka regionów, a duże państwo lub imperium
dziesiątki albo ponad sto.

------------------------------------------------------------------------

# 11. WORLD-008 --- państwa

**Status:** DEFERRED dla VS

State/Nation pozostają w architekturze danych, ale: - full states, -
nations, - diplomacy, - warfare

są wyłączone w początkowym Vertical Slice.

------------------------------------------------------------------------

# 12. SIM-001 --- długość ticka

**Status:** CANONICAL

**1 tick = 1 miesiąc.**

------------------------------------------------------------------------

# 13. SIM-002 --- demografia

**Status:** CANONICAL

Demografia aktualizowana jest miesięcznie.

Roczne dane są agregatami/reportingiem, nie głównym krokiem symulacji.

**Supersedes:** starsze koncepcje kwartalnej aktualizacji populacji.

------------------------------------------------------------------------

# 14. SIM-003 --- tick pipeline

**Status:** CANONICAL

Kanoniczne 23 fazy:

1.  Environment
2.  Resources
3.  Demography
4.  Production Planning
5.  Production
6.  Inventory
7.  Market Demand
8.  Price Adjustment
9.  Trade / Transport
10. Company Finances
11. Employment / Wages
12. Household Income / Consumption
13. Services
14. Needs Satisfaction
15. Migration
16. Settlement / Urbanization
17. State
18. Technology / Knowledge
19. Culture / Politics
20. Events
21. Causality
22. Chronicle
23. Validation

W VS fazy wyłączonych systemów mogą działać jako neutral adapter/no-op.

------------------------------------------------------------------------

# 15. SIM-004 --- mutacja

**Status:** CANONICAL

Każdy etap stosuje:

``` text
READ
→ CALCULATE
→ VALIDATE
→ COMMIT
→ EMIT FACTS
```

------------------------------------------------------------------------

# 16. SIM-005 --- brak iteration-order dependence

**Status:** CANONICAL

Wynik nie może zależeć od przypadkowej kolejności iteracji po mapach,
obiektach ani wątkach.

------------------------------------------------------------------------

# 17. SIM-006 --- brak klasycznego game over

**Status:** TARGET

FIRST CAUSE jest symulacją świata, nie klasyczną kampanią z jednym
warunkiem zwycięstwa/przegranej.

------------------------------------------------------------------------

# 18. SIM-007 --- horyzont czasu

**Status:** TARGET

Świat ma umożliwiać symulowanie 1000+ lat.

Vertical Slice obowiązkowo testuje 200 lat.

------------------------------------------------------------------------

# 19. SIM-008 --- poziom technologiczny

**Status:** TARGET

Technologia może dojść mniej więcej do poziomu współczesnego.

Nie projektujemy nieskończonej futurystycznej progresji w v0.1.

------------------------------------------------------------------------

# 20. DATA-001 --- definicje a instancje

**Status:** CANONICAL

Definition Data jest oddzielone od World State.

Przykład: `GoodDefinition steel` ≠ konkretne zapasy stali w regionie.

------------------------------------------------------------------------

# 21. DATA-002 --- stable IDs

**Status:** CANONICAL

Persistent entities posiadają stabilne ID.

Content definitions używają stabilnych, językowo neutralnych ID.

------------------------------------------------------------------------

# 22. DATA-003 --- canonical vs derived

**Status:** CANONICAL

Każda informacja ma jednego właściciela.

Derived/cache: - może być odbudowany, - nie jest drugim źródłem prawdy.

------------------------------------------------------------------------

# 23. DATA-004 --- Region totals

**Status:** CANONICAL

Np. `Region.totalPopulation` może być cache/aggregate.

Canonical population należy do `PopulationCohort`.

------------------------------------------------------------------------

# 24. DATA-005 --- Inventory

**Status:** CANONICAL

Inventory jest źródłem prawdy dla fizycznych goods.

Market nie jest właścicielem fizycznego zapasu.

------------------------------------------------------------------------

# 25. DATA-006 --- Market

**Status:** CANONICAL

W v0.1 obowiązuje **regionalny Market**.

Nie tworzymy osobnego pełnego marketu dla każdej osady.

------------------------------------------------------------------------

# 26. DATA-007 --- UI

**Status:** CANONICAL

UI nie jest właścicielem Simulation State.

UI używa Read Models i Commands.

------------------------------------------------------------------------

# 27. ECO-001 --- docelowe zasoby

**Status:** TARGET

Docelowy katalog ekonomiczny: **38 resources**.

------------------------------------------------------------------------

# 28. ECO-002 --- docelowe goods

**Status:** TARGET

Docelowy katalog: **64 goods**.

------------------------------------------------------------------------

# 29. ECO-003 --- docelowe company archetypes

**Status:** TARGET

Docelowy katalog: **28 company archetypes**.

------------------------------------------------------------------------

# 30. ECO-004 --- Vertical Slice resources

**Status:** VS

Referencyjne 12: - Grain - Livestock - Fish - Timber - Cotton - Stone -
Clay - Limestone - Iron Ore - Coal - Sand - Salt

------------------------------------------------------------------------

# 31. ECO-005 --- Vertical Slice goods

**Status:** VS

Referencyjne 20: - Staple Crops - Flour - Bread & Basic Food - Meat -
Fish Food - Raw Textile Fiber - Textiles - Clothing - Lumber - Cut
Stone - Bricks - Cement - Iron - Steel - Hand Tools - Furniture -
Machinery - Biomass Fuel - Coal Fuel - Carts

------------------------------------------------------------------------

# 32. ECO-006 --- Vertical Slice companies

**Status:** VS

Do 17 archetypów zgodnie z Vertical Slice Spec.

Nie wszystkie muszą istnieć na początku świata.

------------------------------------------------------------------------

# 33. ECO-007 --- Production Methods

**Status:** CANONICAL

Rozwój produkcji odbywa się przez **Production Methods**.

Nie stosować płaskich wyjątków technologicznych typu:
`steelworks +20% because technology X`.

------------------------------------------------------------------------

# 34. ECO-008 --- data-driven economy

**Status:** CANONICAL

Dodanie standardowego: - Good, - Company Archetype, - Production Method

powinno być możliwe głównie przez dane.

------------------------------------------------------------------------

# 35. ECO-009 --- brak hardcoded content cases

**Status:** CANONICAL

Nie:

``` text
if company == Steelworks
```

jeśli zachowanie można wyrazić przez: - schema, - tag, - requirements, -
PM, - category.

------------------------------------------------------------------------

# 36. ECO-010 --- wyczerpywanie złóż

**Status:** CANONICAL

Finite deposits wyczerpują się.

Po wyczerpaniu może emergentnie wystąpić: - Resource Bust, - Economic
Diversification, - Import Transition, - Technological Extension, -
Substitution, - Ghost Settlement.

------------------------------------------------------------------------

# 37. ECO-011 --- electricity

**Status:** CANONICAL

Electricity jest **current-period flow**.

Nie jest ordinary inventory w v0.1.

------------------------------------------------------------------------

# 38. ECO-012 --- services

**Status:** CANONICAL

Services są oddzielone od zwykłych goods.

Mają: - capacity, - accessibility, - quality, - workforce, -
infrastructure.

------------------------------------------------------------------------

# 39. ECO-013 --- household needs

**Status:** CANONICAL

Hierarchia:

``` text
Survival
→ Basic
→ Services
→ Comfort
→ Prosperity
→ Modern
```

------------------------------------------------------------------------

# 40. ECO-014 --- spending order

**Status:** CANONICAL

``` text
Survival
→ Basic
→ Services
→ Comfort
→ Prosperity
→ Luxury
→ Savings
```

------------------------------------------------------------------------

# 41. ECO-015 --- transport

**Status:** CANONICAL

Trade jest fizyczny i korzysta z grafu regionów.

------------------------------------------------------------------------

# 42. ECO-016 --- Effective Distance

**Status:** CANONICAL

Koncepcyjnie:

``` text
PhysicalDistance
× TerrainModifier
× InfrastructureModifier
× BorderModifier
× SecurityModifier
× SeasonalModifier
```

------------------------------------------------------------------------

# 43. POP-001 --- populacja

**Status:** CANONICAL

Populacja jest cohort-based.

Nie symulujemy każdego mieszkańca jako osobnego NPC.

------------------------------------------------------------------------

# 44. POP-002 --- age groups

**Status:** CANONICAL

-   0--14
-   15--24
-   25--44
-   45--64
-   65+

------------------------------------------------------------------------

# 45. POP-003 --- economic classes

**Status:** CANONICAL

-   Poor
-   Working
-   Middle
-   Wealthy
-   Elite

------------------------------------------------------------------------

# 46. POP-004 --- skills

**Status:** CANONICAL

-   Unskilled
-   Skilled
-   Specialist

------------------------------------------------------------------------

# 47. POP-005 --- VS professions

**Status:** VS

Minimalnie: - agriculture - extraction - manufacturing - construction -
transport - services - specialist

Pełny katalog profesji jest DEFERRED.

------------------------------------------------------------------------

# 48. POP-006 --- migration

**Status:** CANONICAL

Migracja jest probabilistyczną reakcją na lokalne warunki.

Kohorta nie skanuje arbitralnie wszystkich regionów świata.

------------------------------------------------------------------------

# 49. POP-007 --- migration candidates

**Status:** CANONICAL

Destynacje pochodzą m.in. z: - sąsiadów, - trade-connected regions, -
znanych centrów, - cultural/family links.

------------------------------------------------------------------------

# 50. SET-001 --- etapy osad

**Status:** CANONICAL

``` text
Camp
→ Hamlet
→ Village
→ Town
→ City
→ Metropolis
```

Metropolis nie musi być wymagane jako osiągalny benchmark VS.

------------------------------------------------------------------------

# 51. SET-002 --- settlement growth

**Status:** CANONICAL

Osady rozwijają się przez warunki i `SettlementPressure`.

Nie przez bezpośredni rozkaz gracza.

------------------------------------------------------------------------

# 52. SET-003 --- housing

**Status:** VS / CANONICAL

Housing Capacity / Cost / Pressure jest obowiązkowym ograniczeniem
wzrostu.

------------------------------------------------------------------------

# 53. TECH-001 --- brak klasycznego tech tree

**Status:** CANONICAL

FIRST CAUSE nie posiada klasycznego player-controlled tech tree.

------------------------------------------------------------------------

# 54. TECH-002 --- pięć różnych pojęć

**Status:** CANONICAL

``` text
Discovery ≠ Knowledge ≠ Availability ≠ Adoption ≠ Access
```

------------------------------------------------------------------------

# 55. TECH-003 --- polska terminologia

**Status:** CANONICAL

-   Knowledge → Wiedza
-   Discovery → Odkrycie
-   Availability → Dostępność
-   Adoption → **Wdrożenie**
-   Access → Dostęp

W kodzie pozostaje termin `adoption`.

------------------------------------------------------------------------

# 56. TECH-004 --- Knowledge Domains

**Status:** CANONICAL

12 domen: 1. Agriculture 2. Construction 3. Metallurgy 4. Mining 5.
Navigation 6. Medicine 7. Mathematics 8. Mechanics 9. Chemistry 10.
Energy 11. Transportation 12. Communication

------------------------------------------------------------------------

# 57. TECH-005 --- Administration

**Status:** CANONICAL

Administration nie jest trzynastą Knowledge Domain.

Jest institutional capacity.

------------------------------------------------------------------------

# 58. TECH-006 --- technology states

**Status:** CANONICAL

``` text
UNKNOWN
→ KNOWN
→ AVAILABLE
→ ADOPTED
```

Dodatkowo: - Industry Adoption, - Population Access, - Institutional
Adoption.

------------------------------------------------------------------------

# 59. TECH-007 --- T0--T5

**Status:** CANONICAL

T0--T5 są complexity bands.

Nie są historycznymi erami.

------------------------------------------------------------------------

# 60. TECH-008 --- Vertical Slice

**Status:** VS

5 głównych aktywnych domen: - Agriculture - Construction - Metallurgy -
Mining - Mechanics

Support: - Mathematics - Transportation - Medicine - Communication

Aktywne około 20--30 Discoveries.

------------------------------------------------------------------------

# 61. TECH-009 --- deposits exist before discovery

**Status:** CANONICAL

Złoże istnieje fizycznie w World Seed przed jego odkryciem.

Technologia/informacja ujawnia je światu.

------------------------------------------------------------------------

# 62. AI-001 --- perceived world

**Status:** CANONICAL

> **Aktor nie zna World State. Aktor zna Perceived World State.**

------------------------------------------------------------------------

# 63. AI-002 --- brak AI Director

**Status:** CANONICAL

Nie istnieje centralny AI Director wybierający historię świata.

------------------------------------------------------------------------

# 64. AI-003 --- pipeline

**Status:** CANONICAL

``` text
OBSERVE
→ FORECAST
→ GENERATE OPTIONS
→ SCORE
→ DECIDE
→ ACT
→ EVALUATE
```

------------------------------------------------------------------------

# 65. AI-004 --- bounded rationality

**Status:** CANONICAL

AI: - nie ma pełnej informacji, - nie zna przyszłości, - może popełniać
logiczne błędy ex post, - reaguje z opóźnieniem.

------------------------------------------------------------------------

# 66. AI-005 --- hysteresis

**Status:** VS / CANONICAL

Hysteresis, smoothing i cooldown są obowiązkowe dla decyzji podatnych na
oscylację.

------------------------------------------------------------------------

# 67. AI-006 --- Company AI VS

**Status:** VS

Musi obejmować: - production, - inventory, - hiring, - wages, -
expansion, - contraction, - financial survival, - closure, - PM
adoption.

------------------------------------------------------------------------

# 68. AI-007 --- Entrepreneurship

**Status:** CANONICAL

Nowe firmy powstają przez regionalny Opportunity Scanner.

Nie przez losowe spawnienie.

------------------------------------------------------------------------

# 69. AI-008 --- Opportunity Score

**Status:** CANONICAL

Koncepcyjnie:

``` text
DemandGap
+ ExpectedMargin
+ ResourceAccess
+ LaborAvailability
+ SkillAvailability
+ MarketAccess
- Competition
- Risk
- CapitalRequirement
```

------------------------------------------------------------------------

# 70. AI-009 --- Discovery vs Adoption

**Status:** CANONICAL

Discovery Engine decyduje o odkryciu/dostępności.

Company AI decyduje o wdrożeniu Production Method.

------------------------------------------------------------------------

# 71. AI-010 --- DecisionSnapshot

**Status:** VS

Obowiązkowy dla: - company founding, - expansion, - contraction, -
closure, - PM adoption.

------------------------------------------------------------------------

# 72. CAUS-001 --- causality timing

**Status:** CANONICAL

> **Przyczynę rejestrujemy w momencie decyzji lub mutacji, nie
> rekonstruujemy jej później z gotowego świata.**

------------------------------------------------------------------------

# 73. CAUS-002 --- SimulationFact

**Status:** CANONICAL

SimulationFact jest podstawową jednostką zapisanej historii
przyczynowej.

------------------------------------------------------------------------

# 74. CAUS-003 --- CausalEdge

**Status:** CANONICAL

CausalEdge łączy mechanicznie znaną przyczynę z efektem.

Nie tworzymy edge wyłącznie dlatego, że dwa wydarzenia są skorelowane.

------------------------------------------------------------------------

# 75. CAUS-004 --- multi-causality

**Status:** CANONICAL

Wieloprzyczynowość jest domyślna.

------------------------------------------------------------------------

# 76. CAUS-005 --- limiting causes

**Status:** CANONICAL

System zapisuje także czynniki: - ograniczające, - tłumiące, -
negatywne.

------------------------------------------------------------------------

# 77. CAUS-006 --- WHY?

**Status:** VS / CANONICAL

WHY? pokazuje: - efekt, - 2--5 głównych przyczyn, - limiting factors, -
głębszy chain na żądanie, - Architect influence, jeśli istnieje.

------------------------------------------------------------------------

# 78. CAUS-007 --- WHY NOT?

**Status:** VS

Ważne decyzje AI powinny umożliwiać wyjaśnienie, dlaczego akcja nie
nastąpiła.

------------------------------------------------------------------------

# 79. CAUS-008 --- public causal levels

**Status:** CANONICAL

-   Primary
-   Significant
-   Minor
-   Trace

Dokładne progi są tuningiem.

------------------------------------------------------------------------

# 80. CAUS-009 --- causal memory

**Status:** CANONICAL

Historia używa: - HOT - WARM - PERMANENT

------------------------------------------------------------------------

# 81. CAUS-010 --- pruning

**Status:** CANONICAL

Pruning/aggregation nie może zniszczyć: - Chronicle anchors, - ważnych
Butterfly paths, - Historical WHY?, - jedynej zachowanej przyczyny
ważnego wydarzenia.

------------------------------------------------------------------------

# 82. CHRON-001 --- rola Chronicle

**Status:** CANONICAL

> **Chronicle nie tworzy historii. Chronicle wybiera historię stworzoną
> przez symulację.**

------------------------------------------------------------------------

# 83. CHRON-002 --- source of truth

**Status:** CANONICAL

SimulationFact jest truth source.

ChronicleEntry jest presentation/history selection.

------------------------------------------------------------------------

# 84. CHRON-003 --- WHY vs significance

**Status:** CANONICAL

-   WHY DID THIS HAPPEN? → Causality
-   WHY DID THIS MATTER? → Historical Significance

------------------------------------------------------------------------

# 85. CHRON-004 --- significance

**Status:** CANONICAL

Historical Significance ma skalę 0--100.

Koncepcyjnie zależy od: - Magnitude, - Duration, - PopulationAffected, -
GeographicScope, - Novelty, - CausalImpact.

------------------------------------------------------------------------

# 86. CHRON-005 --- silence

**Status:** CANONICAL

Chronicle nie musi generować wpisu w każdym roku.

Brak ważnego wydarzenia jest poprawnym stanem.

------------------------------------------------------------------------

# 87. CHRON-006 --- retrospective significance

**Status:** TARGET

Wydarzenie może zostać później uznane za ważniejsze na podstawie swoich
długoterminowych konsekwencji.

------------------------------------------------------------------------

# 88. CHRON-007 --- tone

**Status:** CANONICAL

Ton: - rzeczowy, - historyczny, - neutralny, - konkretny.

Bez invented drama.

------------------------------------------------------------------------

# 89. ARCH-001 --- rola Architekta

**Status:** CANONICAL

Architekt zmienia **warunki**, nie bezpośrednie wyniki.

------------------------------------------------------------------------

# 90. ARCH-002 --- zakazane bezpośrednie działania

**Status:** CANONICAL

Architekt nie: - tworzy firmy rozkazem, - ustawia cen, - zatrudnia
pracowników, - teleportuje goods, - wymusza migracji, - awansuje
settlement, - gwarantuje prosperity/crisis.

------------------------------------------------------------------------

# 91. ARCH-003 --- Influence

**Status:** CANONICAL

Influence ma skalę: **0--100**.

------------------------------------------------------------------------

# 92. ARCH-004 --- koszt

**Status:** CANONICAL

Koncepcyjnie:

``` text
Base
× Magnitude
× Duration
× Scope
× Naturalness
```

Implementacja może użyć mieszanej formuły zachowującej te komponenty.

------------------------------------------------------------------------

# 93. ARCH-005 --- intervention categories

**Status:** CANONICAL

1.  Environment
2.  Resources
3.  Population
4.  Knowledge
5.  Economy
6.  Experimental Events

------------------------------------------------------------------------

# 94. ARCH-006 --- Vertical Slice interventions

**Status:** VS / CANONICAL

1.  Reveal Resource Deposit
2.  Fertility Shift
3.  Knowledge Injection
4.  Trade Friction Shift
5.  Environmental Shock

Opcjonalnie: 6. Population Seed --- tylko Experiment Mode / setup.

**Supersedes:** starszy zestaw z Infrastructure Opportunity jako core VS
intervention.

------------------------------------------------------------------------

# 95. ARCH-007 --- Root Fact

**Status:** CANONICAL

Każda zastosowana interwencja tworzy Architect Root SimulationFact.

------------------------------------------------------------------------

# 96. ARCH-008 --- brak gwarancji rezultatu

**Status:** CANONICAL

Interwencja zmienia warunek.

Downstream outcome nie jest gwarantowany.

------------------------------------------------------------------------

# 97. ARCH-009 --- no-effect

**Status:** CANONICAL

Brak oczekiwanego efektu downstream nie oznacza: - failed
intervention, - refund.

------------------------------------------------------------------------

# 98. ARCH-010 --- Butterfly Effect

**Status:** CANONICAL

Butterfly Effect jest analizą realnych causal descendants interwencji.

Nie osobnym generatorem wydarzeń.

------------------------------------------------------------------------

# 99. ARCH-011 --- attribution

**Status:** CANONICAL

Architect Influence: - propaguje, - słabnie, - jest rozcieńczane przez
naturalne przyczyny, - może pochodzić z wielu interwencji.

------------------------------------------------------------------------

# 100. UI-001 --- główny kierunek UI

**Status:** CANONICAL

FIRST CAUSE jest: - text-first, - data-first, - analytical, - Living
Atlas / World Network.

------------------------------------------------------------------------

# 101. UI-002 --- klasyczna mapa

**Status:** CANONICAL

Klasyczna geograficzna mapa **nie jest fundamentem Vertical Slice/MVP**.

Starsze fragmenty sugerujące centralną klasyczną mapę są superseded.

------------------------------------------------------------------------

# 102. UI-003 --- proporcja kierunkowa

**Status:** TARGET

Około: - 70% text/data/history/analytics, - 30% abstract network
visualization.

Nie jest to sztywny pixel budget.

------------------------------------------------------------------------

# 103. UI-004 --- główna nawigacja

**Status:** CANONICAL

1.  World
2.  Economy
3.  Technology
4.  Chronicle
5.  Architect

------------------------------------------------------------------------

# 104. UI-005 --- World Command Center

**Status:** VS

Jest głównym ekranem obserwacji świata.

------------------------------------------------------------------------

# 105. UI-006 --- Living Atlas / World Network

**Status:** VS

Podstawowa wizualna nawigacja po regionach i powiązaniach.

------------------------------------------------------------------------

# 106. UI-007 --- Important Now

**Status:** CANONICAL

`Important Now` ≠ Chronicle.

Important Now pokazuje bieżące istotne zmiany/problem/opportunity.

Chronicle jest historią.

------------------------------------------------------------------------

# 107. UI-008 --- WHY?

**Status:** VS

WHY? jest globalnym interaction pattern, dostępnym przy istotnych
zmianach.

------------------------------------------------------------------------

# 108. UI-009 --- Architect preview

**Status:** CANONICAL

UI musi rozdzielać:

**Direct change**

od:

**Possible consequences**

------------------------------------------------------------------------

# 109. UI-010 --- design language

**Status:** CANONICAL

-   spokojny,
-   analityczny,
-   anti-AI,
-   bez dekoracyjnego card spam,
-   ograniczone ikony,
-   czytelne separatory,
-   konkretne etykiety.

------------------------------------------------------------------------

# 110. UI-011 --- reference resolution

**Status:** TARGET

1920×1080 jako referencyjny layout PC/Steam.

------------------------------------------------------------------------

# 111. UI-012 --- 3 000 regions

**Status:** TARGET

World Network musi architektonicznie wspierać: - clustering, -
level-of-detail, - search, - filters, - virtualization.

Nie renderuje wszystkich informacji naraz.

------------------------------------------------------------------------

# 112. UI-013 --- simulation speeds

**Status:** VS

-   Pause
-   ×1
-   ×2
-   ×4
-   ×10
-   ×100

------------------------------------------------------------------------

# 113. SAVE-001 --- determinism

**Status:** CANONICAL

``` text
Same Seed
+ Same Initial State
+ Same Commands at Same Ticks
+ Same Engine/Content Semantics
= Same World
```

------------------------------------------------------------------------

# 114. SAVE-002 --- RNG

**Status:** CANONICAL

Losowość musi być: - seedowana, - kontrolowana, - powtarzalna.

------------------------------------------------------------------------

# 115. SAVE-003 --- RNG streams

**Status:** TARGET

Preferowane osobne streamy: - world_generation - demography -
company_ai - entrepreneurship - migration - discovery - events - naming

------------------------------------------------------------------------

# 116. SAVE-004 --- system time/random

**Status:** CANONICAL

Simulation Logic nie używa: - systemowego czasu, - niekontrolowanego
random, - nondeterministic UUID.

------------------------------------------------------------------------

# 117. SAVE-005 --- speed independence

**Status:** CANONICAL

×1 i ×100 po tej samej liczbie ticków dają identyczny canonical World
State.

------------------------------------------------------------------------

# 118. SAVE-006 --- save boundary

**Status:** CANONICAL

Save odbywa się po pełnym zakończeniu ticka.

Mid-tick save nie jest wspierany w v0.1.

------------------------------------------------------------------------

# 119. SAVE-007 --- versions

**Status:** CANONICAL

Save posiada: - schemaVersion - contentVersion - engineVersion

------------------------------------------------------------------------

# 120. SAVE-008 --- migrations

**Status:** CANONICAL

Migracje: `vN → vN+1`.

Muszą być deterministyczne i walidowane.

------------------------------------------------------------------------

# 121. SAVE-009 --- cache

**Status:** CANONICAL

Save nie może zależeć od unreconstructible cache.

------------------------------------------------------------------------

# 122. SAVE-010 --- checksums

**Status:** VS / CANONICAL

World checksum i layer checksums służą do testowania determinism.

------------------------------------------------------------------------

# 123. SAVE-011 --- Experiment Branching

**Status:** TARGET / wczesny MVP

Branch A/B startuje z tego samego ancestor state i różni się
Commands/interventions.

Minimalne wsparcie może pojawić się w późnym VS.

------------------------------------------------------------------------

# 124. PERF-001 --- architecture target

**Status:** CANONICAL

Silnik projektowany jest tak, aby nie blokować świata do 3 000 regionów.

------------------------------------------------------------------------

# 125. PERF-002 --- official maximum

**Status:** OPEN

`officialMaxRegions` zostanie ustalony po benchmarkach.

------------------------------------------------------------------------

# 126. PERF-003 --- no actor × all regions

**Status:** CANONICAL

Nie używać jako standardowego wzorca: `O(allActors × allRegions)` per
tick.

------------------------------------------------------------------------

# 127. PERF-004 --- locality

**Status:** CANONICAL

Skalowanie opiera się na: - lokalności, - grafie regionów, - candidate
sets, - caches/indexes, - dirty flags, - staggered reviews.

------------------------------------------------------------------------

# 128. PERF-005 --- ×100

**Status:** CANONICAL

×100 liczy wszystkie ticki.

Może ograniczać częstotliwość renderowania, nie fidelity symulacji.

------------------------------------------------------------------------

# 129. PERF-006 --- profiling

**Status:** CANONICAL

Najpierw: - correctness, - determinism, - profiling.

Dopiero potem optymalizacja.

------------------------------------------------------------------------

# 130. PERF-007 --- history

**Status:** CANONICAL

Największym potencjalnym źródłem wzrostu pamięci/save jest: - facts, -
edges, - decision snapshots, - history.

Dlatego causal compaction jest częścią architektury.

------------------------------------------------------------------------

# 131. CONTENT-001 --- trzy warstwy

**Status:** CANONICAL

``` text
ENGINE LOGIC
→ CONTENT DEFINITIONS
→ LOCALIZED PRESENTATION
```

------------------------------------------------------------------------

# 132. CONTENT-002 --- source locale

**Status:** CANONICAL

English (`en`) jest source locale.

------------------------------------------------------------------------

# 133. CONTENT-003 --- Polish

**Status:** VS / CANONICAL

Polish (`pl`) jest pierwszym pełnym dodatkowym locale.

EN + PL są P0 dla Vertical Slice.

------------------------------------------------------------------------

# 134. CONTENT-004 --- target locales

**Status:** TARGET

Architektura wspiera: - en - pl - de - fr - es - it - pt-BR - zh-Hans -
zh-Hant - ja - ko - tr - ru - uk

------------------------------------------------------------------------

# 135. CONTENT-005 --- RTL

**Status:** DEFERRED

Pełne RTL nie jest wymagane v0.1.

------------------------------------------------------------------------

# 136. CONTENT-006 --- IDs

**Status:** CANONICAL

Content IDs: - stable, - language-neutral, - English-like, - snake_case.

------------------------------------------------------------------------

# 137. CONTENT-007 --- localization strings

**Status:** CANONICAL

User-facing strings nie znajdują się w Simulation Logic.

------------------------------------------------------------------------

# 138. CONTENT-008 --- phases

**Status:** CANONICAL

Każda definicja może posiadać: - VS - MVP - FULL

Phase oznacza aktywację contentu, nie inną mechanikę silnika.

------------------------------------------------------------------------

# 139. CONTENT-009 --- phase dependencies

**Status:** CANONICAL

VS content nie może wymagać wyłącznie FULL-only dependency.

------------------------------------------------------------------------

# 140. CONTENT-010 --- validation

**Status:** CANONICAL

Content validation sprawdza: - duplicate IDs, - missing refs, - invalid
ranges, - graph cycles, - phase dependencies, - localization keys.

------------------------------------------------------------------------

# 141. CONTENT-011 --- dynamic names

**Status:** CANONICAL

Wygenerowane nazwy własne stają się trwałym World State.

------------------------------------------------------------------------

# 142. CONTENT-012 --- naming RNG

**Status:** CANONICAL

Naming używa osobnego deterministic RNG stream i nie wpływa na gameplay
RNG.

------------------------------------------------------------------------

# 143. CONTENT-013 --- Chronicle localization

**Status:** CANONICAL

Chronicle jest template-first.

Template korzysta z faktów i payloadu.

------------------------------------------------------------------------

# 144. CONTENT-014 --- WHY localization

**Status:** CANONICAL

Causality zwraca structured explanation.

Localization renderuje język.

------------------------------------------------------------------------

# 145. CONTENT-015 --- locale independence

**Status:** CANONICAL

Zmiana języka nie zmienia World checksum.

------------------------------------------------------------------------

# 146. CONTENT-016 --- LLM

**Status:** DEFERRED / OPTIONAL

LLM nie jest wymagany do core simulation ani Chronicle.

Jeśli kiedyś zostanie użyty: - presentation only, - grounded in facts, -
fallback templates, - offline core nadal działa.

------------------------------------------------------------------------

# 147. TEST-001 --- filozofia testów

**Status:** CANONICAL

> **Nie testujemy jednej poprawnej historii. Testujemy poprawność
> mechanizmów generujących historię.**

------------------------------------------------------------------------

# 148. TEST-002 --- Black Mountain

**Status:** VS / CANONICAL

`BLACK_MOUNTAIN_REFERENCE` jest głównym scenariuszem integracyjnym.

------------------------------------------------------------------------

# 149. TEST-003 --- Black Mountain nie jest skryptem

**Status:** CANONICAL

Nie wolno implementować specjalnej logiki:
`if region == black_mountain`.

------------------------------------------------------------------------

# 150. TEST-004 --- dopuszczalne rezultaty

**Status:** CANONICAL

Black Mountain może skończyć jako: - NO_DEVELOPMENT - RESOURCE_BOOM -
INDUSTRIALIZATION - RESOURCE_BUST - DIVERSIFICATION -
IMPORT_TRANSITION - TECHNOLOGICAL_EXTENSION - GHOST_SETTLEMENT

jeżeli wynik wynika z danych i mechaniki.

------------------------------------------------------------------------

# 151. TEST-005 --- 200 years

**Status:** VS

2400 miesięcznych ticków jest obowiązkowym benchmarkiem Vertical Slice.

------------------------------------------------------------------------

# 152. TEST-006 --- determinism

**Status:** VS

Ten sam seed/run: - identyczne checksums, - save/load continuation, -
×1/×100 equality.

------------------------------------------------------------------------

# 153. TEST-007 --- invariants

**Status:** VS

Minimum: - population \>= 0 - resource quantity \>= 0 - inventory \>=
0 - price \> 0 - employment \<= eligible working population - exports
\<= physical goods - finite finances - valid refs - no NaN / Infinity -
no phantom goods/workers

------------------------------------------------------------------------

# 154. TEST-008 --- conservation

**Status:** VS

Obowiązkowe audyty: - goods/inventory, - resources, - population, -
employment, - company cash.

------------------------------------------------------------------------

# 155. TEST-009 --- scale presets

**Status:** CANONICAL

Benchmarki docelowo: - 32 - 250 - 600 - 1 200 - 2 000 - 3 000

------------------------------------------------------------------------

# 156. VS-001 --- Reference Vertical Slice

**Status:** CANONICAL

Reference world: **32 regiony**.

------------------------------------------------------------------------

# 157. VS-002 --- systems active

**Status:** VS

Aktywne: - Environment simplified - Resources - Demography -
Production - Inventory - Markets - Trade/Transport - Company Finance -
Labor/Wages - Consumption - Services minimal - Needs - Migration -
Settlements - Technology - Architect - Events minimal - Causality -
Chronicle - Validation

------------------------------------------------------------------------

# 158. VS-003 --- systems disabled/limited

**Status:** VS

Wyłączone lub silnie ograniczone: - full states - nations - diplomacy -
warfare - advanced politics - currencies - stock market - advanced
banking/credit - advanced ownership - full historical character
simulation - aviation - modern advanced economy - multiplayer

------------------------------------------------------------------------

# 159. VS-004 --- minimal UI screens

**Status:** VS

1.  World Command Center
2.  Living Atlas / World Network
3.  Region Detail
4.  Settlement Detail
5.  Market / Economy Detail
6.  Company Detail
7.  Technology Detail
8.  Chronicle
9.  WHY? Explanation
10. Architect Panel
11. Butterfly Effect
12. Simulation Controls

------------------------------------------------------------------------

# 160. VS-005 --- main UX loop

**Status:** VS

``` text
OBSERVE
→ NOTICE CHANGE
→ OPEN CONTEXT
→ ASK WHY?
→ FORM HYPOTHESIS
→ INTERVENE
→ RUN TIME
→ REVIEW CONSEQUENCES
→ OPEN CHRONICLE
```

------------------------------------------------------------------------

# 161. VS-006 --- Definition of success

**Status:** CANONICAL

Vertical Slice ma udowodnić:

> **Tworzę świat. Zmieniam jeden warunek. Uruchamiam czas. Świat sam
> reaguje. Po dekadach widzę konsekwencje, których nie wybierałem
> ręcznie, i mogę prześledzić ich rzeczywiste przyczyny.**

------------------------------------------------------------------------

# 162. IMPL-001 --- obecny status projektu

**Status:** CANONICAL

Dokumentacja jest wystarczająco kompletna, aby rozpocząć implementację
fundamentu.

------------------------------------------------------------------------

# 163. IMPL-002 --- brak kolejnej fali dużych specyfikacji

**Status:** CANONICAL

Nie projektować teraz kolejnych dużych systemów bez konkretnego blockera
implementacyjnego.

------------------------------------------------------------------------

# 164. IMPL-003 --- World Generation

**Status:** P0 NEXT SPEC

Brakuje pełnej specyfikacji proceduralnego generowania świata.

Następny rekomendowany duży dokument:

`FIRST-CAUSE-World-Generation-Spec-v0.1.md`

------------------------------------------------------------------------

# 165. IMPL-004 --- World Generation scope

**Status:** OPEN do następnej specyfikacji

Musi ustalić: - graph regions, - continents, - terrain, - climate, -
fertility, - water, - resources, - deposits, - initial population, -
settlements, - infrastructure, - knowledge, - companies, -
inventories, - prices, - cultures, - connectivity.

------------------------------------------------------------------------

# 166. IMPL-005 --- Black Mountain fixture

**Status:** CANONICAL

Przed pełnym proceduralnym generatorem można użyć deterministycznego
ręcznie przygotowanego fixture do implementacji i testów.

------------------------------------------------------------------------

# 167. IMPL-006 --- Technology Stack

**Status:** OPEN / P0 przed repo implementation

Należy osobno ustalić: - language/runtime, - UI framework, - test
framework, - serialization approach, - data format, - localization
library, - profiling tooling.

------------------------------------------------------------------------

# 168. IMPL-007 --- runtime schemas

**Status:** P0 przy implementacji

Nie tworzyć kolejnego ogromnego dokumentu schema.

Konkretne: - interfaces, - enums, - JSON schemas, - DTOs

powinny powstawać w repo i być testowane.

------------------------------------------------------------------------

# 169. IMPL-008 --- implementation order

**Status:** CANONICAL

Rekomendowana kolejność:

``` text
M0 Repository Foundation
M1 Deterministic Core
M2 Data Foundation
M3 World State Foundation
M4 Black Mountain Fixture
M5 Resources
M6 Population
M7 Production
M8 Market
M9 Labor / Households
M10 Trade / Transport
M11 Company AI
M12 Entrepreneurship
M13 Migration
M14 Settlements
M15 Technology
M16 Architect
M17 Causality integration
M18 WHY?
M19 Chronicle
M20 Save/Load full integration
M21 UI
M22 World Generation
M23 Black Mountain 200 Years
M24 Performance / Tuning
M25 VS Freeze
```

Fact infrastructure i basic save/checksum rozwijane są cross-cutting
wcześniej niż ich pełne milestone'y.

------------------------------------------------------------------------

# 170. IMPL-009 --- source of truth po implementacji

**Status:** CANONICAL

Po powstaniu kodu: - behavior → tested engine code, - numeric content →
validated data files, - schemas → runtime schemas/types, - localization
→ locale files, - design intent → specs, - decyzje → ten dokument.

------------------------------------------------------------------------

# 171. IMPL-010 --- agent coding rule

**Status:** CANONICAL

Agent kodujący nie może implementować FULL systemu tylko dlatego, że
jest opisany w dokumentacji, jeśli nie należy do bieżącego milestone/VS.

------------------------------------------------------------------------

# 172. IMPL-011 --- no invention

**Status:** CANONICAL

Jeśli wartość tuningowa nie jest ustalona: - użyć configurable
placeholder/default, - oznaczyć tuning TODO, - nie wymyślać nowej
mechaniki.

------------------------------------------------------------------------

# 173. IMPL-012 --- causal hooks from start

**Status:** CANONICAL

Systemy od wczesnych milestone'ów powinny być projektowane tak, aby
znaczące mutacje mogły emitować SimulationFact/CausalContext.

------------------------------------------------------------------------

# 174. IMPL-013 --- persistence audit

**Status:** CANONICAL

Każde pole runtime powinno mieć jasny status: - canonical persistent, -
derived reconstructible, - transient.

------------------------------------------------------------------------

# 175. IMPL-014 --- performance audit

**Status:** CANONICAL

Każdy globalny scan musi mieć uzasadnienie.

Nie wprowadzać przypadkowo algorytmów blokujących 1 200--3 000 regionów.

------------------------------------------------------------------------

# 176. DEFER-001 --- State Formation

**Status:** DEFERRED

Pełna specyfikacja przed aktywacją states, nie przed VS.

------------------------------------------------------------------------

# 177. DEFER-002 --- Warfare

**Status:** DEFERRED

Nie projektować/implementować teraz.

------------------------------------------------------------------------

# 178. DEFER-003 --- Diplomacy

**Status:** DEFERRED

Nie blokuje VS.

------------------------------------------------------------------------

# 179. DEFER-004 --- Full Culture Model

**Status:** DEFERRED

VS: - cultureId, - shares, - affinity.

------------------------------------------------------------------------

# 180. DEFER-005 --- Advanced Banking

**Status:** DEFERRED

VS nie potrzebuje pełnego systemu bankowego.

------------------------------------------------------------------------

# 181. DEFER-006 --- Full Ownership

**Status:** DEFERRED

Generic OwnerRef wystarcza na obecnym etapie.

------------------------------------------------------------------------

# 182. DEFER-007 --- Historical Characters

**Status:** DEFERRED / LIMITED

Schema istnieje.

Pełny system nie jest wymagany do VS.

------------------------------------------------------------------------

# 183. DEFER-008 --- Facility Entity

**Status:** OPEN / DEFERRED

Nie tworzyć pełnej osobnej Facility entity w VS, jeśli nie jest
potrzebna mechanicznie.

------------------------------------------------------------------------

# 184. DEFER-009 --- Power Grid Topology

**Status:** DEFERRED

Nie jest wymagane VS.

------------------------------------------------------------------------

# 185. DEFER-010 --- Currencies

**Status:** DEFERRED

Nie jest wymagane VS.

------------------------------------------------------------------------

# 186. DEFER-011 --- Multiplayer

**Status:** DEFERRED

Poza zakresem.

------------------------------------------------------------------------

# 187. DEFER-012 --- Modding UI

**Status:** DEFERRED

Architektura data-driven powinna nie blokować modding future, ale UI
modów nie jest obecnym celem.

------------------------------------------------------------------------

# 188. OPEN-001 --- officialMaxRegions

**Status:** OPEN

Decyzja po benchmarkach.

------------------------------------------------------------------------

# 189. OPEN-002 --- Influence regeneration

**Status:** OPEN

VS ma mieć wolną regenerację / ograniczoną liczbę znaczących
interwencji, ale dokładne tempo jest tuningiem.

------------------------------------------------------------------------

# 190. OPEN-003 --- exact Influence costs

**Status:** OPEN

Do tuningu.

------------------------------------------------------------------------

# 191. OPEN-004 --- exact Knowledge thresholds

**Status:** OPEN

Do tuningu.

------------------------------------------------------------------------

# 192. OPEN-005 --- exact price sensitivity

**Status:** OPEN

Do tuningu.

------------------------------------------------------------------------

# 193. OPEN-006 --- HOT/WARM windows

**Status:** OPEN

Do benchmarków pamięci i explainability.

------------------------------------------------------------------------

# 194. OPEN-007 --- serialization format

**Status:** OPEN

VS może rozpocząć od formatu prostego/debugowalnego.

Finalna decyzja po benchmarkach.

------------------------------------------------------------------------

# 195. OPEN-008 --- money representation

**Status:** OPEN

Rozważyć integer/fixed-point.

------------------------------------------------------------------------

# 196. OPEN-009 --- font stack

**Status:** OPEN

Musi obsłużyć docelowe locale.

------------------------------------------------------------------------

# 197. OPEN-010 --- exact World Network visual style

**Status:** OPEN

Do prototypowania UI.

Nie wpływa na Simulation Model.

------------------------------------------------------------------------

# 198. OPEN-011 --- World Generation algorithm

**Status:** OPEN / NEXT

Do rozstrzygnięcia w World Generation Spec.

------------------------------------------------------------------------

# 199. Dokumenty nadrzędne dla implementacji VS

Przy implementacji systemu agent powinien czytać przede wszystkim:

1.  `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
2.  odpowiedni system spec
3.  `FIRST-CAUSE-Entity-Data-Model-v0.1.md`
4.  `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md`
5.  `FIRST-CAUSE-Simulation-Test-Spec-v0.1.md`

Dodatkowe dokumenty tylko, jeśli system ich dotyczy.

------------------------------------------------------------------------

# 200. Reguła końcowa

> **Jeżeli dokumentacja opisuje dwie różne wersje tej samej decyzji,
> agent nie wybiera tej, która jest łatwiejsza do implementacji. Wybiera
> decyzję z niniejszego rejestru.**

------------------------------------------------------------------------

# 201. Następny krok

Po utworzeniu tego rejestru rekomendowany następny duży dokument:

**`FIRST-CAUSE-World-Generation-Spec-v0.1.md`**

Po nim: - Technology Stack Decision, - repo foundation, - implementacja
Vertical Slice.

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE Canonical Decisions v0.1**
