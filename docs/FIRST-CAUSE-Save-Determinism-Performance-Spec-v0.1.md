# FIRST CAUSE --- Save, Determinism & Performance Spec v0.1

**Status:** roboczy dokument kanoniczny\
**Projekt:** FIRST CAUSE\
**Wersja:** 0.1\
**Zakres:** zapis/odczyt, wersjonowanie, migracje, deterministyczność,
RNG, checksumy, replay/branching, cache i indeksy, pamięć historyczna,
wydajność ticka, skalowanie świata, profiling, testy oraz Performance
Gates.

**Dokumenty nadrzędne i powiązane:** -
`FIRST-CAUSE-koncepcja-architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Entity-Data-Model-v0.1.md` -
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` -
`FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` -
`FIRST-CAUSE-AI-Decision-Model-v0.1.md` -
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` -
`FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md` -
`FIRST-CAUSE-Architect-Intervention-Influence-Spec-v0.1.md` -
`FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1.md`

------------------------------------------------------------------------

# 1. Cel dokumentu

FIRST CAUSE ma symulować światy od kilkudziesięciu do docelowo tysięcy
regionów przez setki lub tysiące lat.

System techniczny musi zagwarantować cztery rzeczy:

1.  świat można bezpiecznie zapisać i odtworzyć,
2.  ten sam stan wejściowy daje ten sam wynik,
3.  zapis pozostaje możliwy do migracji między wersjami,
4.  koszt symulacji rośnie w sposób kontrolowany wraz ze skalą świata.

Fundamentalna zasada:

> **Stan świata musi być wystarczający do deterministycznego
> kontynuowania symulacji, ale zapis nie powinien przechowywać danych,
> które można bezpiecznie i jednoznacznie odbudować.**

------------------------------------------------------------------------

# 2. Główne cele techniczne

System ma wspierać: - Vertical Slice 24--40 regionów, - Small \~250, -
Standard \~600, - Large \~1 200, - Huge \~2 000, - Architecture Target
do 3 000 regionów, - symulacje 200 lat jako obowiązkowy benchmark VS, -
500 i 1000 lat jako testy długoterminowe, - Pause, ×1, ×2, ×4, ×10,
×100, - manual save, - autosave, - deterministic save/load, -
eksperymentalne branche A/B, - długą pamięć Chronicle i Causality, -
migracje zapisów.

------------------------------------------------------------------------

# 3. 3 000 regionów --- status kanoniczny

**3 000 regionów jest Architecture Target, nie gwarantowanym limitem
wersji premierowej.**

Architektura: - nie może posiadać twardego założenia
`maxRegions = 800`, - nie może opierać algorytmów na globalnym
skanowaniu wszystkich encji przez każdą encję, - musi być projektowana
pod indeksowanie, lokalność, agregację i incremental updates.

Finalny wspierany limit zostanie ustalony na podstawie benchmarków: -
CPU, - RAM, - ms/tick, - save size, - save/load time, - stabilności
200/500/1000 lat, - liczby firm, - kohort, - trade flows, - Simulation
Facts, - Causal Edges.

------------------------------------------------------------------------

# 4. Presety skalowania

  Preset                   Regiony Rola
  --------------------- ---------- -----------------------------
  Vertical Slice            24--40 implementacja i testy
  Reference VS                  32 Golden Run
  Small                      \~250 szybki świat
  Standard                   \~600 docelowy typowy świat
  Large                    \~1 200 duży świat
  Huge                     \~2 000 bardzo duży świat
  Architecture Target     do 3 000 stress / granica projektowa

Presety nie definiują liczby państw.

------------------------------------------------------------------------

# 5. Region pozostaje jednostką obliczeniową

Region jest głównym spatial compute unit.

Nie oznacza to, że każdy system wykonuje pełny update każdego regionu w
identycznym koszcie co tick.

Możliwe są: - dirty flags, - incremental calculations, - staggered
strategic reviews, - cached aggregates, - event-driven invalidation, -
lokalne candidate sets.

------------------------------------------------------------------------

# 6. Determinizm --- definicja

Dla tej samej: - wersji silnika, - wersji danych, - konfiguracji, -
World Seed, - kolejności Commands, - czasu Commands, - stanu RNG,

symulacja musi wygenerować ten sam wynik.

------------------------------------------------------------------------

# 7. Kanoniczna reguła deterministyczności

> **Same Seed + Same Initial State + Same Commands at Same Ticks + Same
> Engine/Content Semantics = Same World.**

------------------------------------------------------------------------

# 8. Determinizm nie oznacza braku losowości

Losowość jest dozwolona.

Musi być: - pseudolosowa, - seedowana, - kontrolowana, - powtarzalna.

------------------------------------------------------------------------

# 9. Zakaz losowości systemowej

Simulation Logic nie może używać: - systemowego czasu, -
niekontrolowanego `Math.random()`, - losowego UUID bez
deterministycznego źródła, - kolejności wynikającej z hash-map
implementation, - niejawnej kolejności wątków.

------------------------------------------------------------------------

# 10. World Seed

Każdy świat ma: `seed`.

Seed jest częścią trwałego World State.

------------------------------------------------------------------------

# 11. RNG State

Sam seed nie zawsze wystarcza do kontynuacji zapisu.

Save musi przechowywać: - seed, - bieżący RNG state lub deterministyczny
model streamów, - wersję algorytmu RNG.

------------------------------------------------------------------------

# 12. RNG Version

Przykład:

``` text
rngAlgorithm: PCG32
rngVersion: 1
```

Zmiana RNG może zmienić całą przyszłą historię.

Dlatego jest zmianą compatibility-sensitive.

------------------------------------------------------------------------

# 13. RNG Streams

Rekomendowane oddzielne deterministyczne streamy:

-   world_generation,
-   demography,
-   company_ai,
-   entrepreneurship,
-   migration,
-   discovery,
-   events,
-   naming.

------------------------------------------------------------------------

# 14. Dlaczego oddzielne streamy

Dodanie jednego losowego checku do Technology nie powinno przesunąć
całej sekwencji losowej Demography.

------------------------------------------------------------------------

# 15. Stream Seed

Może być wyprowadzany deterministycznie:

``` text
StreamSeed = Hash(WorldSeed, StreamName, OptionalScopeId)
```

------------------------------------------------------------------------

# 16. Scoped RNG

Dla dużej skali warto rozważyć RNG: - per system, - per region, - per
actor, - per tick.

Nie wolno jednak tworzyć rozwiązania, którego wynik zależy od
przypadkowej kolejności iteracji.

------------------------------------------------------------------------

# 17. Stable Iteration Order

Przed deterministyczną operacją na zbiorze encji: - użyć stabilnego
indeksu, - albo sortować po stable ID, - albo użyć struktury
gwarantującej kolejność.

------------------------------------------------------------------------

# 18. Deterministic IDs

Persistent entities wymagają stabilnych ID.

Rekomendowane: - deterministic sequence, - albo hash z kontrolowanych
komponentów.

Przykład: `company_004281`.

------------------------------------------------------------------------

# 19. Fact IDs

Rekomendowane:

``` text
fact_<tick>_<phase>_<sequence>
```

Sequence jest deterministyczny w obrębie fazy.

------------------------------------------------------------------------

# 20. Floating Point

Floating-point może być źródłem rozbieżności między platformami.

Należy: - ograniczać liczbę operacji zależnych od kolejności, - stosować
jawne rounding rules, - nie porównywać floatów przez ścisłe `==` tam,
gdzie nie jest to wymagane, - ustalić tolerancje invariantów.

------------------------------------------------------------------------

# 21. Fixed Point --- gdzie rozważyć

Dla: - pieniędzy, - cen, - ilości wymagających ścisłej księgowości

warto rozważyć integer/fixed-point.

Nie jest to obowiązek dla całego silnika.

------------------------------------------------------------------------

# 22. Money

Rekomendacja: wewnętrzna jednostka całkowita lub fixed-point.

Eliminuje część błędów księgowych.

------------------------------------------------------------------------

# 23. Quantity

Goods quantities mogą używać fixed precision, jeśli conservation audit
tego wymaga.

------------------------------------------------------------------------

# 24. Deterministic Tick Pipeline

Kanoniczna kolejność 23 etapów z Simulation Model pozostaje niezmienna.

Zmiana kolejności systemów jest zmianą semantyki silnika.

------------------------------------------------------------------------

# 25. Tick Phase

Fact może przechowywać: `tickPhase`.

Pomaga deterministycznie rozstrzygać causal order w jednym ticku.

------------------------------------------------------------------------

# 26. Mutation Contract

Każdy etap:

1.  read,
2.  calculate,
3.  validate,
4.  commit,
5.  emit facts.

------------------------------------------------------------------------

# 27. Zakaz iteration-order mutation

Nie wolno: - iterować firm, - natychmiast modyfikować rynku, - pozwalać
następnej firmie widzieć częściowo zaktualizowany stan,

jeżeli model zakłada wspólny snapshot wejściowy.

------------------------------------------------------------------------

# 28. Intent Buffers

Dla systemów wymagających wspólnego snapshotu używać: - intentions, -
pending mutations, - commit phase.

------------------------------------------------------------------------

# 29. Deterministic Parallelism

Wielowątkowość jest dopuszczalna tylko wtedy, gdy: - niezależne
obliczenia mają izolowane inputy, - merge jest deterministyczny, - wynik
nie zależy od scheduler order.

------------------------------------------------------------------------

# 30. Parallelism Rule

> **Parallelize calculation, serialize deterministic commitment.**

------------------------------------------------------------------------

# 31. SaveGame --- rola

SaveGame jest kompletnym punktem kontynuacji świata.

Nie jest: - screenshotem, - Chronicle exportem, - debug dumpem.

------------------------------------------------------------------------

# 32. SaveGame --- top-level

Rekomendowany model:

``` text
SaveGame
  metadata
  versions
  worldConfiguration
  worldState
  rngState
  architectState
  historicalState
  persistenceState
  optionalUiState
```

------------------------------------------------------------------------

# 33. Metadata

-   saveId,
-   saveName,
-   createdAt,
-   savedAt,
-   playtime,
-   worldName,
-   currentDate,
-   currentTick,
-   seed,
-   worldSize,
-   regionCount.

`createdAt/savedAt` nie wpływają na symulację.

------------------------------------------------------------------------

# 34. Trzy wersje obowiązkowe

``` text
schemaVersion
contentVersion
engineVersion
```

------------------------------------------------------------------------

# 35. Schema Version

Opisuje strukturę zapisu.

Przykład: v1 nie ma pola `economicClass`. v2 je posiada.

------------------------------------------------------------------------

# 36. Content Version

Opisuje definicje: - resources, - goods, - companies, - PM, -
discoveries, - interventions.

------------------------------------------------------------------------

# 37. Engine Version

Opisuje semantykę działania symulacji.

------------------------------------------------------------------------

# 38. Save Format Version

Opcjonalnie osobno: `saveFormatVersion`.

Dotyczy kontenera/kompresji, nie modelu świata.

------------------------------------------------------------------------

# 39. Version Compatibility Matrix

Loader powinien określać: - compatible, - migratable, -
unsupported-newer, - unsupported-legacy, - corrupted.

**Stan implementacji (2026-09-30):** klasyfikacja działa na
`schemaVersion` (`classifyVersionCompatibility`); `engineVersion` sam
nie blokuje wczytania. Zmiana semantyki silnika, która zmienia
znaczenie zapisanych danych, dostaje własny krok migracji schematu
(precedensy: v1 → v2 SET-LIFECYCLE-001; v2 → v3 M21-VIS-R4B --- fakty
`trade_flow_active` zapisane silnikiem < 3 niosą ilość ocenioną i
otrzymują typ `trade_flow_evaluated`, bez zerowania, usuwania ani
przeliczania). Sam numer wersji nie jest migracją.

**Historia schematu (stan 2026-10-01):** v1 → v2 SET-LIFECYCLE-001
(status osad); v2 → v3 M21-VIS-R4B (fakty handlu); v3 → v4 pracownicy w
całych osobach (`normalizeWholeWorkforce`); v4 → v5 oszczędności
gospodarstw `PopulationCohort.savings` (3 mies. koszyka) i komis
`Inventory.consignment`; **v5 → v6 dochód właścicielski** (Canonical
§52H): `Company.finance.retainedEarnings = 0` (zapis sprzed v6 nie pozwala
wiarygodnie oddzielić zysku od kapitału początkowego, strat i rozbudów,
więc niewypłacony wynik sprzed zapisu zostaje w firmie --- jawne
ograniczenie migracji), `operatingCostHistory = [finance.costs]` (jedna
obserwacja z ostatniego ticka). Gotówka firm i oszczędności gospodarstw
bez zmian; migracja i wczytanie niczego nie wypłacają. ENGINE_VERSION 7
(etap 4A, Canonical §52I): cena jednostkowa z 6 miejscami zamiast groszy
--- bez zmiany struktury, więc bez kroku migracji schematu. **v6 → v7**
(P14, Canonical §52K): dobra rynku dostają `offered`,
`ticksWithoutOffers`, `priceSuspension`; migracja ustawia
`ticksWithoutOffers = 0` tylko przy śladzie oferty w zapisanym ticku
(zapas regionu > 0 albo zakupy gospodarstw > 0), bez odtwarzania
historii transakcji. ENGINE_VERSION 8 (P12b: stawka płacy 6 miejsc; P14:
presja cenowa i zamówienia importu). **v7 → v8** (etap 4B, Canonical
§52L): `Company.finance.investmentReserve = 0`; opcjonalne
`Inventory.consignmentPrice` (lot bez ceny = cena lokalna). ENGINE_VERSION
9 (płatny przewóz, rozbudowa u wykonawcy, rezerwa P13, zwrot kapitału,
handel przed finansami). Aktualnie SCHEMA_VERSION 8 / ENGINE_VERSION 9.

------------------------------------------------------------------------

# 40. Save Migration

Migracja: `vN → vN+1`.

Nie tworzyć setek bezpośrednich migratorów: `v1 → v7`.

------------------------------------------------------------------------

# 41. Migration Pipeline

``` text
Load Raw
→ Validate Container
→ Read Versions
→ Migrate Schema
→ Migrate Content References
→ Rebuild Derived State
→ Validate World
→ Resume
```

------------------------------------------------------------------------

# 42. Migration Determinism

Migracja musi być deterministyczna.

Ten sam save migrowany dwa razy daje identyczny wynik.

------------------------------------------------------------------------

# 43. Migration Log

Zapisać: - sourceVersion, - targetVersion, - steps, - warnings, -
repairs.

------------------------------------------------------------------------

# 44. No Silent Data Loss

Migracja nie może bez ostrzeżenia usuwać: - regionów, - firm, -
Chronicle anchors, - Architect interventions, - major facts.

------------------------------------------------------------------------

# 45. Removed Content

Jeśli definition zostało usunięte: - migration map, - deprecated
definition, - fallback definition, - controlled failure.

Nie pozostawiać dangling ID.

------------------------------------------------------------------------

# 46. Content Aliases

Można utrzymywać: `old_id → new_id`.

------------------------------------------------------------------------

# 47. Save Atomicity

Save nie może pozostawić częściowo zapisanego pliku jako poprawnego.

Rekomendowane: 1. write temp, 2. flush, 3. checksum, 4. validate, 5.
atomic replace.

------------------------------------------------------------------------

# 48. Save Corruption Protection

Kontener powinien mieć: - magic/version, - section checksums, - global
checksum, - size metadata.

------------------------------------------------------------------------

# 49. Backup Save

Przed nadpisaniem manual save można zachować: `.bak`.

Autosave powinien używać rotacji.

------------------------------------------------------------------------

# 50. Autosave

Rekomendowane: - konfigurowalne, - np. co N lat/ticków czasu świata, -
lub co N minut realnego czasu.

Dokładna wartość = decyzja UX/tuning.

------------------------------------------------------------------------

# 51. Autosave Rotation

Np. 3--5 slotów.

Nie nadpisywać jedynego autosave bez rotacji.

------------------------------------------------------------------------

# 52. Manual Save

Powinien działać na Pause i podczas bezpiecznego tick boundary.

------------------------------------------------------------------------

# 53. Safe Save Boundary

Kanonicznie zapisujemy po pełnym zakończeniu ticka.

Nie w połowie pipeline.

------------------------------------------------------------------------

# 54. Mid-Tick Save

Nie wspierać w v0.1.

Znacznie komplikuje deterministyczność.

------------------------------------------------------------------------

# 55. Async Save

Możliwe: - snapshot immutable state, - serialize w tle.

Ale snapshot musi odpowiadać konkretnemu zakończonemu tickowi.

------------------------------------------------------------------------

# 56. Save Snapshot

Podczas serializacji świat może dalej działać tylko jeśli snapshot jest
izolowany.

VS może po prostu chwilowo zatrzymać symulację.

------------------------------------------------------------------------

# 57. Load

Load musi: 1. zatrzymać aktywną symulację, 2. zweryfikować plik, 3.
zmigrować, 4. odtworzyć canonical state, 5. odtworzyć RNG, 6. odbudować
cache/indexes, 7. uruchomić invariants, 8. dopiero potem udostępnić
świat.

------------------------------------------------------------------------

# 58. Canonical State

Do save trafia stan, którego nie można bezpiecznie odtworzyć.

Przykłady: - entities, - inventories, - prices, - company finances, -
population cohorts, - discoveries, - current interventions, - RNG, -
history anchors.

------------------------------------------------------------------------

# 59. Derived State

Nie musi trafiać do save, jeśli jest jednoznacznie odbudowywalny.

Przykłady: - companiesByRegion, - factsByEntity, - eligibleDiscoveries
cache, - EffectiveDistance cache, - UI sorting.

------------------------------------------------------------------------

# 60. Cache Rule

> **Save nie może zależeć od cache, którego brak zmienia wynik
> symulacji.**

------------------------------------------------------------------------

# 61. Cache Rebuild

Po load: `rebuildDerivedState()`.

------------------------------------------------------------------------

# 62. Cache Validation

Debug build może porównywać: - saved optional cache, - rebuilt cache

dla wykrycia błędów.

------------------------------------------------------------------------

# 63. Runtime Indexes

Rekomendowane: - regionsById, - companiesByRegion, -
companiesByArchetype, - companiesByGoodInput, - companiesByGoodOutput, -
cohortsByRegion, - settlementsByRegion, - depositsByRegion, -
connectionsByRegion, - discoveriesByRegion, - factsByEntity, -
factsByTick, - factsByIntervention.

------------------------------------------------------------------------

# 64. Index Ownership

Index jest Derived State.

Nie jest canonical truth.

------------------------------------------------------------------------

# 65. Save Sections

Dla dużych zapisów warto rozdzielić logiczne sekcje: - WORLD, -
REGIONS, - POPULATION, - ECONOMY, - TECHNOLOGY, - ARCHITECT, -
CAUSALITY, - CHRONICLE, - RNG.

------------------------------------------------------------------------

# 66. Serialization Format

v0.1 może rozpocząć od czytelnego formatu developerskiego.

Docelowo należy rozważyć: - binary serialization, - kompresję, -
sectioned container.

Format nie może blokować migracji.

------------------------------------------------------------------------

# 67. JSON

Zalety: - debug, - łatwe diffy, - prostota.

Wady: - duży rozmiar, - wolniejszy parse, - float/string overhead.

------------------------------------------------------------------------

# 68. Binary

Zalety: - mniejszy save, - szybszy load.

Wady: - trudniejszy debug, - bardziej rygorystyczne wersjonowanie.

------------------------------------------------------------------------

# 69. Rekomendacja etapowa

VS: - format prosty i debugowalny.

MVP: - pomiar.

Dopiero potem decyzja, czy binary daje realną korzyść.

------------------------------------------------------------------------

# 70. Compression

Chronicle/history i powtarzalne struktury mogą dobrze się kompresować.

Kompresja powinna być mierzona, nie zakładana.

------------------------------------------------------------------------

# 71. Save Size Budget

Nie ustalać arbitralnego limitu przed benchmarkami.

Należy mierzyć: - 32 regiony / 200 lat, - 600 / 200, - 1 200 / 200, - 2
000 / 200, - 3 000 / 200, - 600 / 1000 lat.

------------------------------------------------------------------------

# 72. History jest głównym ryzykiem save size

Regiony same nie muszą dominować.

Największy wzrost może pochodzić z: - Simulation Facts, - Causal
Edges, - Decision Snapshots, - Chronicle, - rolling histories.

------------------------------------------------------------------------

# 73. Hierarchical Causal Memory

Obowiązkowe poziomy: - HOT, - WARM, - PERMANENT.

------------------------------------------------------------------------

# 74. HOT

Przechowuje: - szczegółowe facts, - contributions, - Decision
Snapshots, - exact causal edges.

------------------------------------------------------------------------

# 75. WARM

Starsze dane: - agregowane trends, - skompresowane chains, - ograniczone
micro-facts.

------------------------------------------------------------------------

# 76. PERMANENT

Przechowuje: - major discoveries, - settlement transformations, - state
births/collapses później, - major companies/industries, - depletion, -
Architect interventions, - Chronicle anchors, - major Butterfly paths.

------------------------------------------------------------------------

# 77. History Compaction

Powinna działać deterministycznie.

------------------------------------------------------------------------

# 78. Compaction Boundary

Nie kompaktować aktywnej HOT historii w losowych momentach.

Ustalić deterministyczny schedule.

------------------------------------------------------------------------

# 79. Compaction Safety

Po kompresji: - Chronicle source refs muszą działać, - WHY Historical
musi działać, - Architect Legacy musi działać, - brak dangling edges.

------------------------------------------------------------------------

# 80. DecisionSnapshot Retention

Nie zachowywać wiecznie każdego mikro-decydowania firmy.

Permanent: - founding, - major expansion, - PM transition, - closure, -
historically significant decisions.

------------------------------------------------------------------------

# 81. Rolling Time Series

Nie przechowywać miesięcznej wartości każdej metryki przez 1000 lat,
jeśli nie jest potrzebna.

------------------------------------------------------------------------

# 82. Time Series Downsampling

Przykład: - ostatnie 10 lat: monthly, - 10--50 lat: yearly, - starsze:
5-year/10-year aggregate.

Dokładne okna do benchmarków.

------------------------------------------------------------------------

# 83. Historical Fidelity

Downsampling nie może niszczyć: - major peaks, - crises, - turning
points.

Event markers przechowujemy osobno.

------------------------------------------------------------------------

# 84. Save/Load Determinism Test

Procedura: 1. world seed S, 2. run 600 ticks, 3. save, 4. continue to
1200, 5. record checksum A, 6. load save, 7. continue to 1200, 8.
checksum B, 9. `A == B`.

------------------------------------------------------------------------

# 85. Golden Save

Dla każdej stabilnej wersji testowej warto posiadać referencyjne saves.

------------------------------------------------------------------------

# 86. Checksum --- cel

Checksum służy do szybkiego wykrywania divergence.

------------------------------------------------------------------------

# 87. World Checksum

Powinien obejmować canonical simulation state.

Nie obejmuje: - UI state, - real timestamp, - machine-specific data.

------------------------------------------------------------------------

# 88. Layer Checksums

Przydatne: - population checksum, - economy checksum, - technology
checksum, - causality checksum, - architect checksum.

Pozwalają znaleźć pierwszy system divergence.

------------------------------------------------------------------------

# 89. Tick Checksum

Debug/test: checksum po każdym ticku lub co N ticków.

------------------------------------------------------------------------

# 90. Divergence Search

Jeżeli run A i B różnią się po 1200 tickach: binary search po tick
checksums może znaleźć pierwszy rozbieżny tick.

------------------------------------------------------------------------

# 91. Replay Log

W Experiment/Test Mode warto zapisywać: - seed, - commands, - tick
command applied, - intervention parameters.

------------------------------------------------------------------------

# 92. Replay

Replay nie musi odtwarzać grafiki.

Ma odtworzyć Simulation State.

------------------------------------------------------------------------

# 93. Command Log

Przykład:

``` text
tick 0 CreateWorld
tick 216 ApplyIntervention(...)
tick 480 SetSimulationSpeed(...)
```

Zmiana speed nie powinna zmieniać wyniku symulacji.

------------------------------------------------------------------------

# 94. Speed Determinism

×1 i ×100 po tej samej liczbie ticków muszą dać identyczny World State.

------------------------------------------------------------------------

# 95. Pause Determinism

Pause nie zmienia stanu symulacji.

------------------------------------------------------------------------

# 96. UI Independence

Otwarcie: - WHY?, - Region Detail, - Chronicle, - Market View

nie może wpływać na symulację.

------------------------------------------------------------------------

# 97. Experiment Branching

Branch: - zapisuje wspólny ancestor, - tworzy branch A/B, - od tego
samego ticka stosuje różne Commands.

------------------------------------------------------------------------

# 98. Branch Metadata

-   parentSaveId,
-   branchPointTick,
-   experimentId,
-   branchName.

------------------------------------------------------------------------

# 99. Copy-on-Write --- przyszłość

Dla dużych eksperymentów można później rozważyć współdzielenie immutable
history przed branch point.

Nie jest wymagane VS.

------------------------------------------------------------------------

# 100. Performance --- filozofia

> **Najpierw poprawność i deterministyczność, potem profiling, potem
> optymalizacja.**

Nie optymalizować przez zmianę mechaniki bez świadomej decyzji
projektowej.

------------------------------------------------------------------------

# 101. Performance Budget

Budżet musi obejmować: - simulation ms/tick, - render/update UI, -
memory, - save, - load, - history growth, - peak allocations.

------------------------------------------------------------------------

# 102. Simulation vs Rendering

Mierzyć osobno: - simulation CPU, - read-model generation, - UI
rendering.

------------------------------------------------------------------------

# 103. ×100

×100 oznacza szybką realizację pełnych ticków.

Nie: - pomijanie 99 ticków, - uproszczony inny model bez jawnej decyzji.

------------------------------------------------------------------------

# 104. Render Decimation

Przy ×100 UI może renderować: - co kilka ticków, - co rok, - zgodnie z
real-time budget.

Symulacja nadal liczy wszystkie ticki.

------------------------------------------------------------------------

# 105. Headless Benchmark

Najważniejszy performance benchmark powinien działać bez UI.

------------------------------------------------------------------------

# 106. Profiling per System

Mierzyć czas: 1 Environment 2 Resources 3 Demography 4 Production
Planning 5 Production 6 Inventory 7 Market Demand 8 Price 9 Trade 10
Company Finance 11 Labor 12 Consumption 13 Services 14 Needs 15
Migration 16 Settlements 17 State 18 Technology 19 Culture 20 Events 21
Causality 22 Chronicle 23 Validation.

------------------------------------------------------------------------

# 107. Top Performance Risks

Najbardziej ryzykowne: - Company AI, - Entrepreneurship scanning, -
Trade routing, - Migration destination search, - Technology diffusion, -
Causality graph, - Chronicle significance, - long history, - 3
000-region UI network.

------------------------------------------------------------------------

# 108. Complexity Budget

Unikać systemów: `O(allActors × allRegions)` per tick.

------------------------------------------------------------------------

# 109. Local Candidate Sets

Company/migrant/technology powinny pracować na: - local region, -
neighbors, - reachable markets, - known contacts, - cached candidates.

------------------------------------------------------------------------

# 110. Migration

Kohorta nie porównuje wszystkich 3 000 regionów.

Candidate destinations: - neighbors, - trade-connected regions, - known
centers, - culturally/family linked regions.

------------------------------------------------------------------------

# 111. Entrepreneurship

Nie każda firma skanuje wszystkie goods × regions.

Regional Opportunity Scanner generuje ograniczone candidates.

------------------------------------------------------------------------

# 112. Trade

Nie obliczać każdej pary regionów dla każdego dobra co miesiąc.

------------------------------------------------------------------------

# 113. Trade Graph

Używać: - region connections, - reachable routes, - cached
shortest/effective paths, - invalidation po zmianie
infrastruktury/friction.

------------------------------------------------------------------------

# 114. Effective Distance Cache

Odbudowywany, invalidowany przy: - infrastructure change, - border
friction, - security, - seasonal modifier, jeśli wpływa.

------------------------------------------------------------------------

# 115. Technology Diffusion

Nie porównywać każdego regionu z każdym regionem dla każdego discovery.

Używać istniejących kontaktów: - trade, - migration, - adjacency, -
communication.

------------------------------------------------------------------------

# 116. Company Strategic Reviews

Nie każda firma musi co miesiąc oceniać: - expansion, - closure, - PM
adoption.

------------------------------------------------------------------------

# 117. Staggered Reviews

Deterministycznie:

``` text
reviewTick = Hash(companyId, reviewType) mod interval
```

------------------------------------------------------------------------

# 118. Small Decisions

Production/inventory/labor mogą być monthly.

Strategiczne: - co kilka ticków, - lub event-driven.

------------------------------------------------------------------------

# 119. Dirty Flags

Przykłady: - market_changed, - labor_changed, - resource_discovered, -
technology_available, - transport_changed, - infrastructure_changed.

------------------------------------------------------------------------

# 120. Event-Driven + Periodic

Rekomendowany hybrid: - event invalidates, - periodic review zabezpiecza
przed pominięciem zmian.

------------------------------------------------------------------------

# 121. Incremental Aggregates

World population nie musi być sumowana od zera z każdej kohorty przy
każdym UI refresh.

------------------------------------------------------------------------

# 122. Aggregate Ownership

Agregat musi mieć: - source, - invalidation/update rule, -
reconciliation test.

------------------------------------------------------------------------

# 123. Reconciliation

Okresowo porównać cache aggregate z canonical entities.

------------------------------------------------------------------------

# 124. Cohort Scaling

Cohort model jest warunkiem skalowalności.

Nie tworzyć NPC dla całej populacji.

------------------------------------------------------------------------

# 125. Cohort Merge

Podobne cohorty mogą być scalane.

------------------------------------------------------------------------

# 126. Cohort Split

Cohort dzieli się tylko, gdy istotna cecha wymaga rozróżnienia.

------------------------------------------------------------------------

# 127. Cohort Merge Key

Przykładowo: - region, - settlement, - ageGroup, - economicClass, -
profession, - skill, - culture.

------------------------------------------------------------------------

# 128. Merge Tolerance

Jeśli average income/wealth różnią się nieznacznie, można użyć weighted
average.

Dokładne tolerancje wymagają testów.

------------------------------------------------------------------------

# 129. Cohort Explosion Detector

Test wykrywa niekontrolowany wzrost liczby cohortów.

------------------------------------------------------------------------

# 130. Company Scaling

Thousands of firms są oczekiwane.

Nie każda mikroaktywność wymaga osobnej firmy.

------------------------------------------------------------------------

# 131. Local Business Aggregation

Warstwa Local Business może reprezentować drobną działalność
zagregowaną.

------------------------------------------------------------------------

# 132. Minimum Economic Scale

Chroni przed powstawaniem tysięcy firm o zerowym znaczeniu.

------------------------------------------------------------------------

# 133. Company Explosion Detector

Mierzy: - firms/region, - births/deaths, - microfirm share, - memory
footprint.

------------------------------------------------------------------------

# 134. Market Scaling

Jeden regionalny Market, nie market per settlement w v0.1.

To istotne dla wydajności.

------------------------------------------------------------------------

# 135. Goods Scaling

Nie każdy region musi aktywnie posiadać wpisy runtime dla wszystkich 64
goods, jeśli są całkowicie nieaktywne.

Można rozważyć sparse representation.

------------------------------------------------------------------------

# 136. Sparse State

Sparse storage jest wskazane dla: - goods with zero activity, - absent
discoveries, - unused services, - inactive trade flows.

------------------------------------------------------------------------

# 137. Dense vs Sparse

Decyzja powinna wynikać z benchmarków.

Małe stałe tablice mogą być szybsze niż mapy.

------------------------------------------------------------------------

# 138. Object Allocation

Unikać milionów krótkotrwałych obiektów per tick.

------------------------------------------------------------------------

# 139. Scratch Buffers

W krytycznych systemach można reuse: - arrays, - buffers, - temporary
structs.

------------------------------------------------------------------------

# 140. GC Pressure

Mierzyć: - allocations/tick, - GC pauses, - peak heap.

------------------------------------------------------------------------

# 141. Causality Performance

Fact creation jest synchroniczne, ale ciężkie queries WHY mogą być
on-demand.

------------------------------------------------------------------------

# 142. Fact Thresholds

Nie każda mikrozmiana staje się Fact.

Granularity thresholds są także mechanizmem performance.

------------------------------------------------------------------------

# 143. Causal Edges

Nie tworzyć edge między każdym możliwym powiązaniem.

Tylko mechanicznie znane przyczyny.

------------------------------------------------------------------------

# 144. Causal Query Limits

Każde query: - maxDepth, - maxNodes, - minimumStrength, - timeRange.

------------------------------------------------------------------------

# 145. Chronicle Performance

Significance scoring może działać na candidates, nie wszystkich raw
changes.

------------------------------------------------------------------------

# 146. Chronicle Candidate Gate

Najpierw tani threshold.

Dopiero potem droższa analiza significance.

------------------------------------------------------------------------

# 147. Historical Reassessment

Nie skanować całej historii co tick.

Reassessment: - event-driven, - okresowe, - tylko dla candidate
ancestors.

------------------------------------------------------------------------

# 148. UI Performance

UI nie dostaje całego World State.

------------------------------------------------------------------------

# 149. Read Models

Generować: - paginated, - filtered, - scoped.

------------------------------------------------------------------------

# 150. World Network 3 000

Nie renderować jednocześnie: - 3 000 labels, - wszystkich trade edges, -
wszystkich migration flows.

------------------------------------------------------------------------

# 151. World Network LOD

Poziomy: - world clusters, - continent/large cluster, - region.

------------------------------------------------------------------------

# 152. UI Virtualization

Tabele/listy: - regions, - companies, - Chronicle, - goods

powinny wspierać virtualization/pagination.

------------------------------------------------------------------------

# 153. Performance Metrics

Każdy benchmark zapisuje: - engineVersion, - contentVersion, - seed, -
regionCount, - tickCount, - companyCount, - cohortCount, - factCount, -
edgeCount, - memory, - totalRuntime, - averageMsPerTick, -
p95MsPerTick, - p99MsPerTick.

------------------------------------------------------------------------

# 154. Save Metrics

-   save size,
-   serialization time,
-   compression time,
-   disk write,
-   load time,
-   migration time,
-   cache rebuild time,
-   validation time.

------------------------------------------------------------------------

# 155. Benchmark Hardware

Wynik bez specyfikacji sprzętu jest bezwartościowy.

Zapisywać: - CPU, - RAM, - OS, - build type, - runtime version.

------------------------------------------------------------------------

# 156. Debug vs Release

Benchmarki finalne wykonywać na release build.

Debug służy do diagnozy.

------------------------------------------------------------------------

# 157. Warm-up

Jeśli runtime/JIT tego wymaga: - oddzielić warm-up od pomiaru.

------------------------------------------------------------------------

# 158. Repeated Runs

Benchmark uruchamiać wielokrotnie.

Raport: - median, - p95, - variance.

------------------------------------------------------------------------

# 159. Reference Seeds

Minimum: - VS_SEED_001, - VS_SEED_002, - VS_SEED_003, -
BLACK_MOUNTAIN_REFERENCE.

------------------------------------------------------------------------

# 160. Scaling Seeds

Dla większych światów przygotować stałe: - PERF_250, - PERF_600, -
PERF_1200, - PERF_2000, - PERF_3000.

------------------------------------------------------------------------

# 161. Benchmark Horizons

-   10 lat --- smoke,
-   50 lat --- medium,
-   200 lat --- VS,
-   500 lat --- long,
-   1000 lat --- stress history.

------------------------------------------------------------------------

# 162. Benchmark Matrix

Minimum:

    Regions  50y    200y      500y      1000y
  --------- ----- -------- ---------- ----------
         32   ✓      ✓         ✓          ✓
        250   ✓      ✓         ✓       optional
        600   ✓      ✓         ✓          ✓
      1 200   ✓      ✓      optional   optional
      2 000   ✓      ✓      optional   optional
      3 000   ✓    stress   optional   optional

------------------------------------------------------------------------

# 163. Performance Gates

Nie ustalamy jeszcze sztywnych ms/tick.

Najpierw baseline.

------------------------------------------------------------------------

# 164. Gate P0 --- VS

32 regiony / 200 lat: - stabilnie, - deterministycznie, - bez memory
leak, - save/load pass, - ×100 praktycznie użyteczne.

------------------------------------------------------------------------

# 165. Gate P1 --- Standard

600 regionów / 200 lat: - stabilny benchmark, - brak architektonicznego
bottlenecku, - pamięć kontrolowana.

------------------------------------------------------------------------

# 166. Gate P2 --- Large

1 200 / 200: - akceptowalne headroom, - brak algorytmów quadratic global
scan.

------------------------------------------------------------------------

# 167. Gate P3 --- Huge

2 000 / 200: - wynik określa, czy preset Huge jest wspierany oficjalnie.

------------------------------------------------------------------------

# 168. Gate P4 --- Architecture Target

3 000: - stress benchmark, - wykrycie ukrytych limitów, - nie musi
spełniać finalnego UX targetu w pierwszym release.

------------------------------------------------------------------------

# 169. Supported Maximum

Dopiero po P0--P4 ustalamy: `officialMaxRegions`.

------------------------------------------------------------------------

# 170. officialMaxRegions

Jest konfiguracją produktu/builda.

Nie powinien być fundamentalnym limitem struktur silnika.

------------------------------------------------------------------------

# 171. Performance Degradation

Jeśli 3 000 jest za wolne: najpierw profiling.

Nie zmniejszać automatycznie głębi symulacji.

------------------------------------------------------------------------

# 172. Optimization Order

1.  znaleźć hotspot,
2.  sprawdzić complexity,
3.  zmniejszyć zbędne scans,
4.  cache/index,
5.  reduce allocations,
6.  parallelize bez utraty determinizmu,
7.  dopiero potem rozważać model approximation.

------------------------------------------------------------------------

# 173. Approximation Policy

Jeżeli używamy uproszczenia: - musi być jawne, - testowane, -
deterministyczne, - nie może łamać causality/explainability.

------------------------------------------------------------------------

# 174. No Hidden Low-Fidelity Mode

×100 nie może potajemnie zmieniać zasad świata.

------------------------------------------------------------------------

# 175. Performance and AI

AI Decision Model ma zachować tę samą semantykę niezależnie od speed.

------------------------------------------------------------------------

# 176. Performance and Chronicle

Chronicle sensitivity: Concise/Standard/Detailed

nie może zmieniać Simulation State.

Może zmieniać ilość presentation entries.

------------------------------------------------------------------------

# 177. Performance and WHY

WHY query nie powinien zatrzymywać całej symulacji na długi czas.

W razie potrzeby: - pause, - async read-only analysis, - bounded query.

------------------------------------------------------------------------

# 178. Thread Safety

Read-only UI queries nie mogą modyfikować world.

------------------------------------------------------------------------

# 179. Snapshot Read Models

Przy równoległej symulacji UI może czytać stabilny snapshot ostatniego
ukończonego ticka.

------------------------------------------------------------------------

# 180. Save Security / Robustness

Save jest lokalnym plikiem użytkownika.

Loader musi traktować dane jako potencjalnie niepoprawne.

------------------------------------------------------------------------

# 181. Validation Before Allocation

Nie ufać deklarowanym gigantycznym countom w uszkodzonym pliku.

------------------------------------------------------------------------

# 182. Bounds

Loader ma sanity limits dla: - entity count, - section size, - string
length, - recursion/depth.

Nie są to gameplay max.

------------------------------------------------------------------------

# 183. Corruption Handling

Status: - valid, - recoverable, - corrupted.

------------------------------------------------------------------------

# 184. Recovery

Możliwe: - backup, - previous autosave, - controlled repair.

Nigdy nie udawać pełnej poprawności po utracie kluczowych danych.

------------------------------------------------------------------------

# 185. Save Error UX

Pokazać: - który save, - typ błędu, - czy backup jest dostępny.

------------------------------------------------------------------------

# 186. Modding Future Compatibility

Jeśli później pojawią się mody: save musi znać: - content package IDs, -
versions, - missing content.

Nie jest wymagane VS, ale nie blokować architektury.

------------------------------------------------------------------------

# 187. Localization and Save

Save przechowuje: - IDs, - nameKeys, - dynamic proper names.

Nie powinien przechowywać lokalizowanych opisów jako canonical data.

------------------------------------------------------------------------

# 188. Dynamic Generated Names

Wygenerowana nazwa własna może być trwałym world data.

------------------------------------------------------------------------

# 189. Chronicle Templates

Save przechowuje: - templateKey, - data, - source refs.

Nie musi utrwalać finalnego tekstu w każdym języku.

------------------------------------------------------------------------

# 190. Engine Update and Chronicle

Zmiana template nie zmienia historii.

------------------------------------------------------------------------

# 191. Save and Architect

Save musi zachować: - CurrentInfluence, - ReservedInfluence, - ledger, -
intervention instances, - root facts, - attribution anchors, -
cooldowns.

------------------------------------------------------------------------

# 192. Save and AI

Save musi zachować to, czego AI potrzebuje do identycznej kontynuacji: -
actor memory, - expectations, - cooldowns, - strategic review
schedule/state, - ważne persistent profiles.

------------------------------------------------------------------------

# 193. AI Cache

Perceived State bieżącego ticka może być odbudowany, jeśli nie jest
wymagany po load.

------------------------------------------------------------------------

# 194. Save and Technology

Zachować: - Knowledge, - Discovery states, - adoption/access, -
discovery dates, - source/diffusion history w wymaganym zakresie.

------------------------------------------------------------------------

# 195. Save and Markets

Zachować: - current prices, - inventory, - rolling history potrzebną do
expectations/smoothing.

------------------------------------------------------------------------

# 196. Save and Price Smoothing

Jeśli przyszła cena zależy od historii: odpowiedni rolling state jest
canonical.

------------------------------------------------------------------------

# 197. Save and Demography

Zachować cohort state oraz rolling values potrzebne do miesięcznych
update'ów.

------------------------------------------------------------------------

# 198. Save and Trade

Aktywne persistent trade relationships/flows zachować, jeśli wpływają na
następny tick.

Transient routing cache odbudować.

------------------------------------------------------------------------

# 199. Save and Settlements

Zachować: - stage, - housing, - pressure state wymagany do persistence
thresholds, - history milestones.

------------------------------------------------------------------------

# 200. Persistence Counters

Jeżeli mechanika mówi: „warunek musi trwać 12 miesięcy",

save musi przechować licznik/persistent condition state.

------------------------------------------------------------------------

# 201. Hidden State Audit

Każdy system musi odpowiedzieć: \> Jakie dane z poprzednich ticków
wpływają na następny tick?

Wszystkie takie dane muszą być: - canonical save state, - albo
jednoznacznie rekonstruowalne.

------------------------------------------------------------------------

# 202. Save Completeness Test

Test: - serialize, - destroy runtime, - load, - compare canonical
checksum przed i po load.

------------------------------------------------------------------------

# 203. Save Roundtrip

`State → Save → Load → State'`

`checksum(State) == checksum(State')`.

------------------------------------------------------------------------

# 204. Migration Roundtrip

Stary save: - migrate, - save nową wersją, - reload, - checksum
stabilny.

------------------------------------------------------------------------

# 205. Determinism Test Suite

Minimum: - same seed, - different seed, - same seed different speed, -
save/load, - branch replay, - reordered internal container insertion, -
parallel vs single-thread, jeśli parallel istnieje.

------------------------------------------------------------------------

# 206. Container Order Test

Celowo zmienić kolejność insertion w mapach.

Wynik świata nie może się zmienić.

------------------------------------------------------------------------

# 207. RNG Isolation Test

Dodanie losowego calla w naming stream nie może zmienić Demography.

------------------------------------------------------------------------

# 208. System Isolation Test

Wyłączenie UI/Chronicle presentation nie zmienia World State.

------------------------------------------------------------------------

# 209. First Divergence Report

Przy determinism fail raport: - first tick, - first phase, - first
entity, - first differing field, - relevant RNG stream, - recent
commands.

------------------------------------------------------------------------

# 210. Performance Regression Tests

Każdy release: porównać z baseline.

------------------------------------------------------------------------

# 211. Regression Threshold

Dokładny procent alarmu ustalić po zebraniu baseline.

------------------------------------------------------------------------

# 212. Performance History

Przechowywać wyniki benchmarków w repo.

------------------------------------------------------------------------

# 213. Benchmark Artifact

Np.:

``` text
/perf-results/
  engine-version/
    PERF_600_200Y.json
```

------------------------------------------------------------------------

# 214. Benchmark JSON

Powinien zawierać wszystkie metadane potrzebne do reprodukcji.

------------------------------------------------------------------------

# 215. Flamegraphs / Profiles

Dla dużych regresji przechowywać profile jako artefakty CI/dev, jeśli
tooling pozwala.

------------------------------------------------------------------------

# 216. CI

Szybkie testy: - unit, - determinism short, - save roundtrip.

Ciężkie: - nightly/local scheduled, - 200y, - scaling.

------------------------------------------------------------------------

# 217. Long-Run CI

Nie musi działać przy każdym commit.

------------------------------------------------------------------------

# 218. Performance Test Presets

Kanoniczne: - TEST_TINY, - TEST_VS, - TEST_SMALL, - TEST_STANDARD, -
TEST_LARGE, - TEST_HUGE, - TEST_STRESS.

------------------------------------------------------------------------

# 219. TEST_TINY

4--8 regionów.

Do szybkich testów systemowych.

------------------------------------------------------------------------

# 220. TEST_VS

32 regiony.

Główny Golden Run.

------------------------------------------------------------------------

# 221. TEST_SMALL

250 regionów.

------------------------------------------------------------------------

# 222. TEST_STANDARD

600 regionów.

------------------------------------------------------------------------

# 223. TEST_LARGE

1 200 regionów.

------------------------------------------------------------------------

# 224. TEST_HUGE

2 000 regionów.

------------------------------------------------------------------------

# 225. TEST_STRESS

Do 3 000 regionów.

Architecture Target.

------------------------------------------------------------------------

# 226. Performance Telemetry

Developer-only: - current ms/tick, - rolling p95, - memory, -
companies, - cohorts, - facts, - edges, - trade flows, - dirty
regions, - cache hit/miss.

------------------------------------------------------------------------

# 227. Telemetry and Determinism

Pomiar nie może zmieniać logiki.

------------------------------------------------------------------------

# 228. Slow Tick Detector

Jeżeli tick przekracza threshold: zapisz: - phase times, - entity
counts, - allocations.

------------------------------------------------------------------------

# 229. Memory Leak Detector

Long run powinien sprawdzać, czy memory po compaction stabilizuje się
względem wielkości świata/history.

------------------------------------------------------------------------

# 230. Expected Memory Growth

Pewien wzrost jest legalny: - nowe settlements, - firms, - permanent
history.

Nielegalny: - nieograniczony wzrost cache, - orphan facts, - stale
indexes.

------------------------------------------------------------------------

# 231. Orphan Audit

Wykrywa: - zamknięte encje bez potrzebnych history refs, - edges do
nieistniejących facts, - indexes do usuniętych runtime objects.

------------------------------------------------------------------------

# 232. Compaction Metrics

Mierzyć: - facts before, - facts after, - edges before/after, - bytes
saved, - Chronicle anchors preserved, - WHY paths preserved.

------------------------------------------------------------------------

# 233. Save Compaction

Może być osobnym procesem: - podczas save, - okresowo, - przy
przekroczeniu threshold.

Schedule musi być deterministyczny, jeśli wpływa na retained causal
data.

------------------------------------------------------------------------

# 234. Save Frequency vs Performance

Autosave nie może powodować ciągłych freeze.

Benchmarkować: - 32, - 600, - 1 200, - 2 000.

------------------------------------------------------------------------

# 235. Save Progress

Dla dużego świata UI może pokazywać: `Saving world...`

------------------------------------------------------------------------

# 236. Quick Save

Jeśli save jest szybki --- normalny snapshot.

Nie tworzyć osobnej mniej kompletnej wersji zapisu.

------------------------------------------------------------------------

# 237. Crash Recovery

Opcjonalny recovery autosave może być częstszy niż manual autosave,
jeśli koszt pozwala.

Nie jest P0 VS.

------------------------------------------------------------------------

# 238. Save Naming

Domyślnie: - world name, - date, - optional branch.

------------------------------------------------------------------------

# 239. Save List Metadata

Lista zapisów nie powinna wymagać pełnego load każdego świata.

Metadata header czytany osobno.

------------------------------------------------------------------------

# 240. Thumbnail

Nie jest wymagany.

FIRST CAUSE jest text/data-first.

------------------------------------------------------------------------

# 241. Cloud Saves

Nie jest częścią v0.1.

Architektura plików nie powinna jednak wymagać absolutnych machine
paths.

------------------------------------------------------------------------

# 242. Portable Save

Save powinien być przenośny między kompatybilnymi
instalacjami/platformami, o ile deterministyczność platformowa zostanie
potwierdzona.

------------------------------------------------------------------------

# 243. Cross-Platform Determinism

To osobny test.

Nie zakładać automatycznie identycznych float results na wszystkich
runtime/platformach.

------------------------------------------------------------------------

# 244. Platform Compatibility Strategy

Jeśli pełny cross-platform bitwise determinism jest trudny: - jasno
zdefiniować supported guarantees, - preferować fixed-point dla
krytycznych finansów, - testować target platforms.

------------------------------------------------------------------------

# 245. Bitwise vs Semantic Determinism

Preferowany cel: canonical state identyczny.

Jeżeli pewne derived float cache różni się poniżej tolerancji, nie
powinien należeć do checksum canonical state.

------------------------------------------------------------------------

# 246. Deterministic Serialization

Ta sama state może serializować pola/collections w stabilnej kolejności.

Pomaga: - diff, - checksum, - regression.

------------------------------------------------------------------------

# 247. Canonical Serialization

Do checksum używać jednoznacznej reprezentacji: - stable field order, -
stable entity order, - normalized numbers.

------------------------------------------------------------------------

# 248. Corruption Checksum vs World Checksum

To dwa różne cele.

File checksum: czy bytes są nieuszkodzone.

World checksum: czy simulation state jest identyczny.

------------------------------------------------------------------------

# 249. Performance vs Explainability

Nie wolno dla wydajności usuwać CausalContext zanim Fact/Edge zostanie
prawidłowo utworzony.

------------------------------------------------------------------------

# 250. Performance vs Emergence

Nie wolno zastępować autonomicznych decyzji globalnym skryptem „dla
optymalizacji".

------------------------------------------------------------------------

# 251. Performance vs Locality

Optymalizacja ma wynikać z naturalnej lokalności świata: - region, -
connection, - trade, - migration, - knowledge contact.

To jest zgodne z projektem.

------------------------------------------------------------------------

# 252. Black Mountain --- Save Test

1.  run do przed-discovery,
2.  save,
3.  discovery,
4.  mine opportunity,
5.  continue,
6.  reload pre-discovery,
7.  continue bez zmian,
8.  historia musi być identyczna.

------------------------------------------------------------------------

# 253. Black Mountain --- Branch Test

Branch A: Reveal Iron Deposit.

Branch B: brak interwencji.

Oba startują z identycznego save.

Pierwsza divergence powinna być związana z intervention Root Fact lub
jego bezpośrednią mutacją.

------------------------------------------------------------------------

# 254. Black Mountain --- Speed Test

A: ×1. B: ×100.

Po 2400 tickach: identyczny canonical checksum.

------------------------------------------------------------------------

# 255. Black Mountain --- History Compression

Po 200 latach: - causal chain
discovery→mine→employment→migration→settlement pozostaje dostępny, -
nawet jeśli część micro-facts została skompaktowana.

------------------------------------------------------------------------

# 256. Failure Modes --- Save

S1 Missing hidden state. S2 RNG not restored. S3 cache treated as truth.
S4 migration loses references. S5 partial file overwrite. S6 history
pruning breaks Chronicle. S7 content update invalidates IDs. S8 save
depends on UI.

------------------------------------------------------------------------

# 257. Failure Modes --- Determinism

D1 unordered iteration. D2 system time. D3 global RNG coupling. D4 float
instability. D5 thread scheduling. D6 IDs created nondeterministically.
D7 speed changes logic. D8 read query mutates state.

------------------------------------------------------------------------

# 258. Failure Modes --- Performance

P1 all-to-all region scan. P2 company explosion. P3 cohort explosion. P4
causal memory explosion. P5 trade route recomputation. P6 technology
all-to-all diffusion. P7 UI renders all nodes/edges. P8 excessive
allocations. P9 autosave freezes. P10 premature micro-optimization hides
design flaw.

------------------------------------------------------------------------

# 259. Global Invariants

Oprócz gameplay invariants: - save references resolve, - RNG state
valid, - versions present, - IDs unique, - canonical state finite, -
indexes reconstructible, - Chronicle anchors valid, - no dangling
CausalEdge, - no future fact tick, - no save mid-tick.

------------------------------------------------------------------------

# 260. Performance Invariants

Nie są absolutnymi liczbami, ale architektonicznymi zasadami: - no
mandatory actor×allRegions scan, - no unbounded micro-fact retention, -
no full causal graph render, - no full history rescan every tick, - no
full save parse for save-list metadata.

------------------------------------------------------------------------

# 261. Save API

Proponowane:

``` text
createSaveSnapshot()
serializeSave(snapshot)
writeSave(path)
loadSave(path)
validateSave(raw)
migrateSave(raw)
rebuildDerivedState(world)
verifyWorld(world)
```

------------------------------------------------------------------------

# 262. Determinism API

``` text
getWorldChecksum()
getLayerChecksum(layer)
getTickChecksum()
getRngDiagnostics()
compareWorldStates(a, b)
findFirstDivergence(runA, runB)
```

------------------------------------------------------------------------

# 263. Performance API

``` text
beginTickProfile()
endTickProfile()
recordSystemTiming()
getPerformanceSnapshot()
exportBenchmarkReport()
```

------------------------------------------------------------------------

# 264. History API

``` text
compactCausalMemory()
validateHistoricalAnchors()
downsampleTimeSeries()
```

------------------------------------------------------------------------

# 265. Module Layout

``` text
src/persistence/
  save/
  load/
  serialization/
  migrations/
  checksums/
  recovery/

src/core/
  rng/
  determinism/
  ids/
  time/

src/performance/
  profiling/
  benchmarks/
  telemetry/
  budgets/

src/history/
  compaction/
```

------------------------------------------------------------------------

# 266. Data Layout

``` text
data/
  migrations/
  compatibility/
  performance-presets/
```

------------------------------------------------------------------------

# 267. Tests Layout

``` text
tests/
  determinism/
  save-load/
  migrations/
  performance/
  long-run/
  history-compaction/
```

------------------------------------------------------------------------

# 268. Implementation Stage SDP-01

**Deterministic Core** - seed, - RNG, - streams, - stable iteration, -
deterministic IDs.

------------------------------------------------------------------------

# 269. SDP-02

**World Checksums** - canonical serialization, - layer checksums, -
divergence diagnostics.

------------------------------------------------------------------------

# 270. SDP-03

**Basic Save/Load** - complete VS state, - tick-boundary save, -
roundtrip.

------------------------------------------------------------------------

# 271. SDP-04

**Versioning** - schema/content/engine versions, - compatibility checks.

------------------------------------------------------------------------

# 272. SDP-05

**Migrations** - migration pipeline, - logs, - validation.

------------------------------------------------------------------------

# 273. SDP-06

**Derived State Rebuild** - indexes, - caches, - validation.

------------------------------------------------------------------------

# 274. SDP-07

**Historical Compaction** - HOT/WARM/PERMANENT, - time-series
downsampling, - anchor protection.

------------------------------------------------------------------------

# 275. SDP-08

**Profiling** - per-system timing, - allocations, - memory.

------------------------------------------------------------------------

# 276. SDP-09

**Scaling** - 250, - 600, - 1 200, - 2 000, - 3 000.

------------------------------------------------------------------------

# 277. SDP-10

**Optimization** - only measured hotspots, - locality/index/cache first.

------------------------------------------------------------------------

# 278. SDP-11

**Experiment Branching** - parent save, - command logs, - A/B.

------------------------------------------------------------------------

# 279. SDP-12

**Regression Gates** - determinism, - save, - performance baselines.

------------------------------------------------------------------------

# 280. Definition of Done --- Determinism VS

PASS jeśli: - same seed → same world, - ×1 = ×100 after equal ticks, -
save/load continuation identical, - no unseeded RNG, - stable IDs, -
stable iteration, - Black Mountain deterministic.

------------------------------------------------------------------------

# 281. Definition of Done --- Save VS

PASS jeśli: - manual save/load, - autosave basic, - roundtrip
checksum, - RNG restored, - AI memory restored, -
markets/technology/Architect/history restored, - no dangling refs, -
corruption detected, - version metadata present.

------------------------------------------------------------------------

# 282. Definition of Done --- Performance VS

PASS jeśli: - 32 regions / 2400 ticks stable, - ×100 useful, - no memory
leak, - per-system profiler, - benchmark artifact generated, - no known
all-to-all critical loop.

------------------------------------------------------------------------

# 283. Definition of Done --- Standard Architecture

PASS jeśli: - 600-region benchmark exists, - indexes/local candidates
work, - save/load measured, - history growth controlled, - no engine
rewrite required vs VS.

------------------------------------------------------------------------

# 284. Definition of Done --- Architecture Target

Nie wymaga premierowej płynności.

Wymaga: - możliwość wygenerowania/testowania do 3 000 regionów, - brak
twardych limitów 800/1000, - brak fundamentalnej awarii struktur
danych, - stress report identyfikujący realne bottlenecks.

------------------------------------------------------------------------

# 285. Performance Acceptance Philosophy

Nie deklarujemy dziś: „3 000 regionów działa dobrze".

Deklarujemy: \> **Silnik jest projektowany tak, aby 3 000 regionów było
możliwym celem technicznym, a rzeczywisty wspierany limit zostanie
wyznaczony pomiarem.**

------------------------------------------------------------------------

# 286. Open Decisions

Do ustalenia przez implementację i benchmarki: 1. konkretny RNG, 2.
integer/fixed-point money, 3. serialization format, 4. compression
algorithm, 5. autosave cadence, 6. autosave slots, 7. HOT/WARM time
windows, 8. time-series downsampling windows, 9. save-size budgets, 10.
target ms/tick, 11. target save/load seconds, 12. target RAM, 13. thread
model, 14. cross-platform determinism guarantee, 15. cohort merge
tolerances, 16. sparse vs dense markets, 17. officialMaxRegions, 18.
exact performance hardware tiers.

------------------------------------------------------------------------

# 287. Decyzje kanoniczne v0.1

-   Architecture Target = do 3 000 regionów.
-   3 000 nie jest obietnicą premierową.
-   VS reference = 32 regiony.
-   Standard design preset = \~600.
-   Region jest główną jednostką obliczeniową.
-   Determinizm jest wymaganiem architektury.
-   Seeded RNG jest obowiązkowy.
-   RNG state/version musi być trwały.
-   Preferowane oddzielne RNG streams.
-   Stable iteration order jest obowiązkowy.
-   Save powstaje na tick boundary.
-   Mid-tick save nie jest wspierany v0.1.
-   `schemaVersion`, `contentVersion`, `engineVersion` są obowiązkowe.
-   Migracje są sekwencyjne i deterministyczne.
-   Derived caches są odbudowywalne.
-   Save nie może zależeć od UI.
-   World checksum obejmuje canonical state.
-   ×1 i ×100 muszą dawać ten sam wynik po tej samej liczbie ticków.
-   UI/render frequency nie zmienia simulation semantics.
-   HOT/WARM/PERMANENT są obowiązkowe dla causal memory.
-   Chronicle anchors są chronione przed pruning.
-   Performance mierzymy headless i per-system.
-   Najpierw profiling, potem optymalizacja.
-   Nie dopuszczamy globalnego actor×allRegions jako standardowego
    wzorca.
-   Local candidate sets są podstawą skalowania.
-   Company strategic reviews mogą być staggered deterministycznie.
-   Trade/Technology/Migration używają grafu kontaktów zamiast pełnego
    all-to-all.
-   3 000-region World Network wymaga LOD/clustering/filtering.
-   officialMaxRegions jest decyzją po benchmarkach.
-   Black Mountain jest referencyjnym testem save/determinism/branching.

------------------------------------------------------------------------

# 288. Relacja z Simulation Test Spec

Ten dokument definiuje wymagania techniczne.

`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` definiuje procedury
PASS/FAIL.

W przypadku rozbieżności: - gameplay invariants → Simulation Test Spec /
Simulation Model, - persistence semantics → ten dokument, - causal
retention → Causality Engine + ten dokument, - entity ownership → Entity
Data Model.

------------------------------------------------------------------------

# 289. Relacja z Entity Data Model

Entity Data Model określa: **co istnieje**.

Ten dokument określa: **co musi zostać zapisane, co można odbudować i
jak zapewnić identyczną kontynuację**.

------------------------------------------------------------------------

# 290. Relacja z Causality Engine

Causality Engine określa znaczenie HOT/WARM/PERMANENT.

Ten dokument narzuca: - bounded storage, - deterministic compaction, -
save compatibility, - anchor integrity.

------------------------------------------------------------------------

# 291. Relacja z AI Decision Model

AI może korzystać z pamięci i expectations.

Jeżeli wpływają one na następną decyzję, są częścią canonical
persistence state.

------------------------------------------------------------------------

# 292. Relacja z Architect System

Interwencja jest historycznym faktem świata.

Nie wolno po zmianie kosztów w nowej wersji gry przeliczać historycznie
wydanego Influence.

------------------------------------------------------------------------

# 293. Relacja z UI/UX

UI może: - pokazać save metadata, - progress, - performance diagnostics
w debug, - branch.

UI nie może: - zmieniać tick semantics, - decydować o canonical save
state.

------------------------------------------------------------------------

# 294. Gate przed Vertical Slice implementation freeze

Przed intensywnym kodowaniem systemów VS powinny istnieć: -
deterministic RNG abstraction, - stable ID strategy, - version fields, -
save boundary rule, - checksum design.

Ich późniejsza zmiana jest kosztowna.

------------------------------------------------------------------------

# 295. Gate przed MVP

Przed rozszerzeniem do MVP: - 600-region benchmark, - 200-year save
growth report, - causal compaction, - migration test, - save/load
determinism, - performance baseline.

------------------------------------------------------------------------

# 296. Gate przed Large/Huge

Przed reklamowaniem Large/Huge: - release build benchmarks, - minimum
hardware, - save/load UX, - 200-year stability, - 500-year spot tests.

------------------------------------------------------------------------

# 297. Gate przed 3 000 jako oficjalną opcją

3 000 można pokazać jako normalny preset dopiero, gdy: - performance
jest akceptowalne, - memory jest akceptowalne, - save/load jest
akceptowalne, - UI jest nawigowalne, - 200-year test przechodzi, - nie
wymaga ukrytego low-fidelity modelu.

------------------------------------------------------------------------

# 298. Najważniejsza zasada implementacyjna

> **Nie optymalizuj FIRST CAUSE przez usuwanie przyczynowości.
> Optymalizuj przez lokalność, indeksy, agregację, kontrolę
> częstotliwości i kompresję historii.**

------------------------------------------------------------------------

# 299. Kryterium końcowe

System Save / Determinism / Performance jest gotowy, gdy można:

1.  utworzyć świat z seedem,
2.  symulować go,
3.  zapisać w dowolnym bezpiecznym tick boundary,
4.  wczytać,
5.  kontynuować,
6.  uzyskać identyczną przyszłość,
7.  rozgałęzić świat w eksperymencie,
8.  prześledzić historyczne przyczyny po setkach lat,
9.  zwiększać skalę bez fundamentalnej zmiany architektury,
10. zmierzyć, a nie zgadywać, jaki maksymalny świat jest praktycznie
    wspierany.

> **FIRST CAUSE ma generować niepowtarzalne historie dla różnych seedów,
> ale tę samą historię dla tego samego seedu i tych samych decyzji.**

------------------------------------------------------------------------

# 300. Następny dokument

Po tej specyfikacji kolejnym głównym dokumentem powinien być:

**`FIRST-CAUSE-Content-Localization-Spec-v0.1.md`**

Po nim zalecany jest: **Master Documentation Consistency &
Implementation Readiness Audit v0.1**.

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE Save, Determinism & Performance Spec v0.1**
