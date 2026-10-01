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

# 52A. SET-LIFECYCLE-001 --- populacja 0 = koniec aktywnej osady

**Status:** CANONICAL --- ACCEPTED (decyzja właściciela, implementacja
zaakceptowana 2026-09-29)

-   Settlement ma jawny stan cyklu życia `SettlementStatus`: `ACTIVE`
    | `ABANDONED`; status jest jedynym źródłem prawdy o aktywności osady.
-   Settlement population = 0 → osada przechodzi `ACTIVE → ABANDONED`
    **w tym samym ticku symulacji** (reguła: znana populacja `=== 0`;
    bez okresu oczekiwania i bez progów typu „< 10”). Przejście
    następuje dokładnie raz i emituje fakt `settlement_abandoned`.
-   ABANDONED settlement pozostaje encją historyczną (id, nazwa, region,
    historia) dla Chronicle, WHY? i Causality Engine; nie jest usuwana z
    World State.
-   ABANDONED nie jest aktywną osadą: nie jest liczona w SETTLEMENTS,
    nie ma aktywnej morfologii na Atlasie, nie jest celem migracji i nie
    przyjmuje nowych firm.
-   Ponowne zasiedlenie **nie reaktywuje** tej samej osady: powstaje
    nowa Settlement z nowym id i statusem `ACTIVE`.
-   REGION ≠ SETTLEMENT: region może poprawnie istnieć bez aktywnej osady;
    w Population Mode region z populacją 0 = „0 · niezamieszkany”.
-   Firmy: firma z historycznym `settlementId` opuszczonej osady działa
    dalej jako firma regionu; brak automatycznej relokacji ani
    zamykania (reagują istniejące mechanizmy ekonomii).

------------------------------------------------------------------------

# 52B. M21-VIS-R4B --- Handel: tabela według towarów

**Status:** CANONICAL --- ACCEPTED (kierunek i implementacja Handlu
zaakceptowane przez właściciela, HUMAN VISUAL ACCEPTED 2026-09-30).
Dotyczy wyłącznie trybu Handel; pozostałe tryby R4B otwarte.

-   Handel: jedna tabela według towarów z kolumnami Przywozi/Wysyła
    oraz rozwijanymi szczegółami partnerów. Atlas pełni funkcję
    pomocniczą.
-   Przywóz i wywóz tego samego towaru są w jednym wierszu; kliknięcie
    towaru rozwija pod nim partnerów (jeden wiersz na partnera, także
    przy wymianie w obu kierunkach). Bez osobnych list przywozu i
    wywozu, bez widoku według partnerów i bez macierzy towar × partner.
-   Atlas domyślnie nie nakłada strzałek przepływów; po rozwinięciu
    towaru wyróżnia jego partnerów, a kierunek wymiany pokazuje dopiero
    po wskazaniu partnera. Relacja handlowa jest rysowana odrębnie od
    fizycznej trasy.
-   **Zakres danych = REGION.** Symulacja rejestruje handel między
    rynkami/magazynami regionów wzdłuż bezpośredniego Connection; osada
    nie ma własnego handlu. Widok nazywa się „Handel regionu” i nie
    rozdziela danych regionu między osady.
-   Różnych towarów się nie sumuje (także w Top Regions i Δ Change ---
    tam Handel jest oznaczony jako „brak wspólnej miary”). Zero ≠ brak
    handlu ≠ brak danych.

**Ustalenia implementacyjne (zaakceptowane przez właściciela razem z
akceptacją wizualną, 2026-09-30):**

-   Ilość = towar faktycznie dostarczony w ostatnim zakończonym miesiącu:
    fakt `trade_flow_active`, `values.after` = ilość przeniesiona przez
    `settleTradeFlow`, fakt tylko przy fizycznym ruchu (ENGINE_VERSION
    3). Jednostki: abstrakcyjne jednostki danego towaru.
-   Starsze zapisy (silnik < 3): istniejąca polityka sekwencyjnych
    migracji schematu (Save Spec §39--40) --- migracja v2 → v3 nadaje
    ich faktom handlu typ `trade_flow_evaluated` (ta sama tożsamość i
    wartości); Read Model pokazuje je jako „brak danych” o dostawie z
    ostrzeżeniem, nigdy jako dostawę.
-   Flow Lens „Handel” jest nieaktywny (brak wspólnej miary: grubość
    i Top N porównywałyby ilości różnych towarów); kierunek wymiany
    pokazuje wskazanie partnera z tabeli.
-   Chronicle `trade_route`: otwarty proces ze starszego silnika
    (migracja: `magnitudeBasis: "evaluated"`) jest zamykany i oceniany
    istniejącą regułą na własnej sumie przy pierwszym fakcie z ilością
    dostarczoną; nowy epizod liczy tylko ilości dostarczone. Próg nigdy
    nie jest liczony z sumy mieszanej.

------------------------------------------------------------------------

# 52C. M21-VIS-R4B --- Economy: zatrudnienie w przedsiębiorstwach

**Status:** CANONICAL --- ACCEPTED (kierunek zdecydowany przez
właściciela 2026-09-30, decyzje D1--D5 po audycie danych; implementacja z
poprawkami z 2026-10-01 **DONE / HUMAN VISUAL ACCEPTED** 2026-10-01).
Dotyczy wyłącznie trybu Economy.

Diagnoza, która doprowadziła do decyzji: dawna metryka Economy
(`WorldRegionView.production` = suma `outputLastTick` aktywnych firm)
sumowała ilości różnych towarów (w tym półprodukty) bez wspólnej
jednostki; ta sama suma zasilała World Pulse i Δ Change.

-   **D1 --- miara trybu:** zatrudnieni w przedsiębiorstwach regionu
    (suma `Company.workforce.employees` aktywnych firm; osoby; stan na
    koniec ostatniego ticka; całe osoby --- §52E). Region bez firm =
    znane 0. Przychód firm ze sprzedaży (dawniej „Sprzedaż firm”)
    (suma `finance.revenue`, jednostka pieniężna modelu / miesiąc, ceny
    lokalne, tylko region z Market i regionalnym Inventory --- poza
    modelem rynku „brak danych”) jest informacją dodatkową inspektora,
    nie kodowaniem mapy. Nie nazywa się jej PKB, bogactwem ani
    dobrobytem (brak rachunku wartości dodanej).
-   **D2 --- World Pulse:** suma zatrudnienia w firmach zamiast
    „Produkcji / miesiąc”; to stan, więc bez „/ miesiąc”.
-   **D3 --- Δ Change:** zmiana zatrudnienia względem snapshotu bazowego
    (`WorldViewHistory` przechowuje pełne przeszłe snapshoty, więc dane
    historyczne są poprawne); brak bazy albo brak wartości = brak
    zmiany, nie 0. Opcja „produkcja” usunięta.
-   **D4 --- skala:** stałe, absolutne klasy 10 / 100 / 1000 / 10 000
    (TODO tuning); zero i brak danych oznaczone osobno. Region pierwszy w
    rankingu nie dostaje najwyższej klasy tylko dlatego, że jest pierwszy.
-   **D5 --- produkcja w inspektorze:** tabela Towar · Wytworzono · Cena
    lokalna, bez sumy różnych towarów; ilość i cena z jednostką danego
    towaru (abstrakcyjna „jedn.” --- content nie definiuje jednostek,
    Entity Data Model §66 p. 2 OPEN); brak ceny = „—”.
-   Kodowanie Atlasu: kwadrat „Economic Output” (Visual Alphabet v1.1
    §8) obok niezmienionej morfologii osad; szczegóły: Atlas Spec §14
    „Economy”.

**Poprawki po przeglądzie (2026-10-01, kierunek D1--D5 bez zmian;
zaakceptowane przez właściciela razem z trybem 2026-10-01):**

-   **Produkcja w ticku adopcji metody (D5).** W ticku, w którym AI-08
    przyjmuje metodę, `economy-tick.ts` produkuje jeszcze recepturą
    sprzed decyzji (zatwierdzony moment adopcji --- bez zmian), a
    `productionMethodId` wskazuje już nową metodę. Read Model nie
    rozdziela wtedy `outputLastTick` według nowej metody: firma
    z `ai.lastDecision.production_method_adoption` równym ostatniemu
    tickowi i produkcją > 0 trafia do `methodChangedCompanies`, a
    inspektor pokazuje tabelę jako częściową (podpis „Dane częściowe”
    przy nagłówku tabeli + uwaga pod tabelą: „firma zmieniła metodę
    … produkcja nie jest rozdzielona na towary”); pusta tabela z takimi
    firmami to „brak danych o produkcji według towarów”, nigdy „nic nie
    wytworzono”. Od kolejnego ticka przypisanie jest pełne. Stan nie
    zapisuje poprzedniej metody ani wyjść per towar, więc pełna
    rekonstrukcja ticka adopcji wymaga **osobnej zmiany kontraktu**
    (np. `Company.production.outputByGoodLastTick` zapisywane przez
    `runProduction` + migracja zapisu) --- OPEN, decyzja właściciela.
-   **Legenda (D4).** Rozłączne zakresy dla danych ciągłych, dokładnie
    jak `economyClass`: `>0–<10`, `10–<100`, `100–<1000`,
    `1000–<10 000`, `≥10 000` (w UI notacja zwarta, np. „1 tys.–<10
    tys.” / „1K–<10K”). Klasa liczona z surowej wartości; liczby
    zatrudnienia na ekranie są obcinane (nie zaokrąglane w górę), więc
    nigdy nie przeskakują do wyższej klasy (99,5 → „99,5”, nie „100”).
-   **World Pulse (D2/D3).** Suma zatrudnienia ma jawne pokrycie:
    kompletna (wszystkie regiony znane; znane 0 = 0), częściowa (suma
    znanych regionów + oznaczenie „częśc. k/n”) albo niedostępna („—”,
    nigdy 0). Δ Pulse liczona wyłącznie między dwiema kompletnymi sumami
    o tym samym zbiorze regionów; w pozostałych przypadkach „Δ —” z
    krótkim wyjaśnieniem (brak historii / niepełne dane / inne regiony).
    Regionalne Δ Change bez zmian: liczone, gdy zatrudnienie regionu
    jest znane w obu stanach.
-   **Data:** panel „Gospodarka regionu” nie pokazuje własnej daty
    okresu --- zasada ogólna §52D.
-   **Poza zakresem:** zanik gospodarki Black Mountain pozostaje osobnym,
    otwartym zadaniem diagnostycznym (nie jest udowodnionym problemem
    contentu); balans, rynki, magazyny i algorytmy gospodarki bez zmian.

------------------------------------------------------------------------

# 52D. UI świata --- data świata tylko w górnym pasku

**Status:** CANONICAL --- decyzja właściciela 2026-10-01 (dotyczy całego
ekranu świata).

-   Bieżąca data świata (rok · miesiąc · tick) jest pokazywana
    **wyłącznie w górnym pasku**. Panele i paski nie powtarzają jej ani
    nie pokazują innej daty „bieżącego okresu”, bo dwie różne daty obok
    siebie wyglądają na sprzeczność.
-   Dane przepływowe (produkcja, sprzedaż, handel) dotyczą ostatniego
    zakończonego ticka i są opisane **względnie**: „ostatni miesiąc” /
    „last month” (np. „Produkcja według towarów · ostatni miesiąc”,
    nagłówek tabeli Handlu „Great Delta · ostatni miesiąc”). Usunięte:
    wiersze „Ostatni zakończony miesiąc: rok R, miesiąc M” w panelach
    Gospodarki i Handlu oraz diagnostyczny „tick danych” w pomocy Handlu.
-   Pasek zakresu analizy pod mapą pokazuje tylko zakres (ŚWIAT |
    region); okno porównania jest w kontrolce „Porównaj” przy Atlasie.
    Oś czasu pokazuje tylko „Teraz” / „Widok historyczny”.
-   Znaczniki czasu **zdarzeń i faktów** (Ostatnie wydarzenia, WHY?) nie
    są datą świata --- zostają, ale w tej samej jednostce co górny pasek
    („Tick N”; wcześniej mylące „Miesiąc N” z numerem ticka).
-   Dane Read Modelu (np. `RegionTradeView.period`, `sales.tick`) bez
    zmian --- zmiana dotyczy wyłącznie prezentacji.

------------------------------------------------------------------------

# 52E. Pracownicy w całych osobach; przychód firm w panelu

**Status:** CANONICAL --- decyzje właściciela 2026-10-01 (ENGINE_VERSION
4, SCHEMA_VERSION 4).

-   **Pracownicy to zawsze całe osoby w modelu.** Wcześniej siła robocza
    kohorty = ludność × 0,65 bez zaokrąglenia, więc firmy zatrudniały
    ułamki ludzi (Black Mountain, Green Valley: 0,65 + 2,6 + … = 6,5
    pracownika). Teraz (`labor/employment.ts`): limit zatrudnienia
    kohorty = `ceil(ludność × 65 / 100)`, a łączna pula regionu =
    `floor(Σ ludności w wieku produkcyjnym × 65 / 100)` (`regionLaborForce`);
    zatrudnianie jest ograniczone pulą regionu, wszystkie sumy regionu
    (płace, przedsiębiorczość, migracja, uzgodnienie zatrudnienia P0-05)
    liczą się z niej. Arytmetyka całkowita (bez błędów typu 20 × 0,65 =
    13,000000000000002). Green Valley: **6** pracowników. Współczynnik
    0,65 bez zmian (TODO tuning). Region z 1 osobą w wieku produkcyjnym
    ma 0 pracowników.
-   **Zapisy:** zapis silnika < 4 z ułamkowym zatrudnieniem jest przy
    wczytaniu doprowadzany do całych osób (migracja schematu v3 → v4,
    `normalizeWholeWorkforce`: firmy w dół, kohorty metodą największych
    reszt, suma kohort = pracownicy firm tam, gdzie ta równość była;
    ludność, fakty i historia bez zmian).
-   **Przychód firm w panelu (wariant C):** etykieta „Przychód firm ze
    sprzedaży / miesiąc” (EN „Company sales revenue / month”) = ilość
    sprzedana na rynek regionu × lokalna cena, w umownych jednostkach
    pieniężnych, wyświetlana w **całych jednostkach**. Model nadal liczy
    pieniądze z dokładnością 0,01 (ADR-001 §4); ceny za jednostkę towaru
    zostają z 2 miejscami po przecinku.

------------------------------------------------------------------------

# 52F. Plan produkcji, zatrudnienia i płac firm (etap 1 naprawy gospodarki)

**Status:** CANONICAL --- decyzja właściciela 2026-10-01 (N3 + N4 po
diagnozie Black Mountain, `docs/verification/black-mountain-economy-diagnosis-2026-10-01/`);
wdrożone. Wartości liczbowe: TODO tuning.

-   **Plan produkcji (AI-03):** firma ocenia poziomy produkcji w całych
    partiach (bieżący, ± krok ≥ 1 partia) i wybiera najlepszy wynik:
    `możliwa sprzedaż − towary wejściowe − płace`. Możliwa sprzedaż =
    udział firmy × (prognoza popytu + uzupełnienie zapasu do celu);
    niesprzedana produkcja zwiększa zapas, nie jest przychodem.
-   **Prognoza i pokrycie (per towar):** prognoza = średnia popytu z 3
    mies. (historia rynku); pokrycie = (zapas regionu + bufory firm) /
    prognoza; cel 2 mies.; zwiększanie tylko przy pokryciu < 1 mies.,
    powyżej 1 mies. tylko utrzymanie/zmniejszenie (sygnał ograniczania > 3
    mies.). Zerowy popyt przy zapasie = nadwyżka; brak historii = brak
    danych (poziom utrzymany, bez planowania na zerze). Historia popytu
    obejmuje zamówienia importerów (ilość oceniona przez handel), także
    niezrealizowane z braku zapasu.
-   **Udział w popycie:** sprzedaż z poprzedniego miesiąca wśród
    producentów towaru; firma bez sprzedaży --- według potencjału mocy.
-   **Zatrudnienie (N4):** wynika z planu i nie przekracza `obecni
    pracownicy + dostępni bezrobotni regionu` (aktualizowani po każdym
    zatrudnieniu); plan nie liczy partii, do których brakuje ludzi.
    Opłacalne zapotrzebowanie ponad dostępnych jest sygnałem „są miejsca
    pracy” dla migracji, nie wakatem podnoszącym płace.
-   **Płace (N4):** zmiana najwyżej ±3%/mies.; sufit = (przychód −
    koszty pozapłacowe − 10% przychodu) / planowani pracownicy; podłoga =
    lokalny miesięczny koszt koszyka przetrwania jednej osoby (3 jedn. ×
    wygładzona cena żywności); `0,01` tylko zabezpieczeniem numerycznym.
    Gdy budżetu nie starcza na podłogę, firma zmniejsza plan zatrudnienia.
    Płace nie rosną z powodu planu większego niż dostępni pracownicy.
    Osobna decyzja kryzysowa płac (z powodem w Chronicle) --- NOT STARTED.
-   **Rozbudowa:** wymaga pokrycia < 1 mies. (trwały popyt), dodatniego
    wyniku po płacach, kapitału i wolnych pracowników. **Zakładanie firm:**
    marża partii z płacą nowej firmy.
-   **Doprecyzowania:** wydobycie zasobu z własnego złoża nie ma kosztu
    pieniężnego w planie (jak w finansach firmy); kryzys SS23 blokuje wzrost
    firmie ze stratą (nie nowej firmie z gotówką 0 bez strat).
-   **Wynik ponownej diagnozy:** załamanie firm (P2--P5) usunięte, ale
    gospodarka Black Mountain wygasa w ticku 5 z powodu P8 (popyt tylko od
    zatrudnionych) --- następny etap: N7 + minimalne rozliczenie N6.

------------------------------------------------------------------------

# 52G. Pieniądz gospodarstw i rozliczenie sprzedaży (etap 2 naprawy gospodarki)

**Status:** CANONICAL --- decyzja właściciela 2026-10-01 (N7 + minimalne
rozliczenie N6); wdrożone (SCHEMA_VERSION 5, ENGINE_VERSION 5). Wartości:
TODO tuning.

-   **Oszczędności:** każda kohorta ma płynne saldo `savings`: poprzednie +
    faktycznie otrzymane dochody − faktycznie opłacone zakupy. Nowy świat:
    3 miesiące koszyka przetrwania po cenie z rynku regionu (jawna
    konfiguracja wczytywania świata, nieodnawiana); zapis sprzed schematu 5
    --- ta sama reguła przy migracji; `averageWealth` nie jest zamieniane na
    gotówkę. Migranci zabierają swoją część oszczędności.
-   **Gospodarstwo:** rodzina kohort (te same co w demografii) łączy salda;
    dochody pracujących utrzymują dzieci, starszych i niepracujących; podział
    wewnątrz rodziny nie tworzy pieniędzy (co do grosza).
-   **Popyt na przetrwanie:** całej ludności; popyt opłacalny = min(potrzeby,
    oszczędności / cena), także bez pracy; zakup ograniczony zapasem; przy
    braku towaru pieniądze zostają na koncie. Rynek zapisuje potrzeby, popyt
    opłacalny i zakupy osobno; niezaspokojone potrzeby same nie są sygnałem
    rentowności.
-   **Rozliczenie (minimalne N6):** płace wypłacone przez firmę trafiają do
    kohort regionu proporcjonalnie do zatrudnienia; towar oddany do magazynu
    regionu jest w komisie --- firma dostaje zapłatę od kupujących, pro rata
    do swojej części zapasu, także po zamknięciu i po wywozie (własność
    przechodzi z towarem). Magazyn regionu nie płaci za niesprzedane. Zapas
    bez właściciela (opłacony w starym modelu) nie przynosi pieniędzy.
-   **Planowanie:** pokrycie zapasem liczy tylko zapas dostępny do sprzedaży
    (magazyn regionu + zapas firm ponad ich bufor).
-   **Poza zakresem (NOT STARTED):** transfery, zakupy firm (wejścia),
    pozostałe kategorie potrzeb. Dochód właścicielski --- wdrożony w §52H.
    Wynik ponownej diagnozy etapu 2: zysk firm był końcowym odpływem
    pieniędzy gospodarstw.

------------------------------------------------------------------------

# 52H. Minimalny dochód właścicielski (etap 3 naprawy gospodarki)

**Status:** CANONICAL --- decyzja właściciela 2026-10-01; wdrożone
(SCHEMA_VERSION 6, ENGINE_VERSION 6). Wartości: TODO tuning.

-   **Reguła:** raz na miesięczny tick, po rozliczeniu wszystkich
    sprzedaży i kosztów (także wpłat za towar zamkniętych firm z komisu),
    firma wypłaca właścicielowi całą kwotę
    `min(max(0, wynik zatrzymany), max(0, gotówka − bufor))`.
-   **Bufor operacyjny:** `OWNER_PAYOUT_BUFFER_MONTHS` (= 2, parametr
    wymagający walidacji) × większa z wartości: średnie koszty operacyjne
    z ostatnich 3 ticków (przy krótszej historii --- dostępne obserwacje)
    albo zobowiązania najbliższego ticka z bieżącego planu (płaca ×
    pracownicy po decyzji o zatrudnieniu). Koszty operacyjne = płace
    (płatnych wejść model jeszcze nie ma; zasób z własnego złoża bez kosztu
    pieniężnego, §52F). Bez rezerw na hipotetyczne inwestycje.
-   **Wynik zatrzymany vs kapitał:** `Company.finance.retainedEarnings` ---
    + zysk, − strata, − wypłata; może być ujemny, kolejne zyski najpierw
    pokrywają straty. Kapitał początkowy i wkłady finansujące (np. 500
    gotówki farmy, kapitał założycielski) nie są wynikiem i nie są
    wypłacane. Wypłata nie jest kosztem operacyjnym i nie zmienia wyniku
    produkcji: gotówka firmy − kwota, środki właściciela + ta sama kwota.
-   **Odbiorca:** rzeczywisty `ownerType` / `ownerEntityId`. `individual` =
    kohorta: pieniądze trafiają do jej `savings` (budżet wspólny rodziny,
    §52G); gdy kohorta właściciela nie ma już ludzi (zgony, starzenie,
    wyjazd), wypłatę dostaje najliczniejsza żyjąca kohorta tej samej
    rodziny (ta sama tożsamość w regionie). Migranci zakładający nową
    kohortę nie zabierają udziału we własności; scalenie migrantów z
    istniejącą kohortą nie zmienia właściciela. Rodzina bez ludzi albo
    `state` (brak skarbu) --- brak wypłaty, wynik zostaje w firmie.
    `company` --- gotówka i wynik zatrzymany firmy-właściciela (wypłaci je
    dalej w kolejnym ticku). Bez automatycznego podziału między wszystkich
    mieszkańców regionu.
-   **Kolejność:** wypłaty liczone ze stanu po rozliczeniu finansów, przed
    handlem i migracją; handel przenosi tylko towar i własność w komisie,
    więc drugiego naliczenia nie ma. Gospodarstwa wydają środki od
    następnego ticka. Fakty `company_owner_payout` (firma) i
    `owner_income_received` (odbiorca) z krawędziami przyczynowymi.
-   **Zapisy:** migracja v5 → v6 --- wynik zatrzymany 0 (nie da się
    wiarygodnie oddzielić zysku od kapitału w starszym zapisie; zyski sprzed
    zapisu zostają w firmie), historia kosztów = `[finance.costs]`;
    gotówka i oszczędności bez zmian, bez wypłat przy migracji i wczytaniu.
-   **Likwidacja (bez zmian, luka):** zamknięta firma nadal dostaje zapłatę
    z komisu i wypłaca ją jako zysk, ale jej kapitał (gotówka ponad wynik)
    zostaje w firmie na zawsze --- zwrotu kapitału przy likwidacji nie ma
    (np. 500 jedn. zamkniętej farmy w scenariuszu kontrolowanego
    zamknięcia). Osobna decyzja.
-   **Wynik ponownej diagnozy (raport §13):** popyt utrzymuje się po
    wyczerpaniu oszczędności startowych (pieniądz gospodarstw krąży, nie
    znika w firmach); zatrudnienie do t360 w 5/5 seedów; zaspokojenie
    potrzeb 72--90% w t13--360 (etap 2: 0,7--7%). Otwarte: oszczędności
    gromadzą się u rodziny właściciela, której potrzeby są już
    zaspokojone, a niezaspokojone potrzeby dotyczą rodzin bez udziałów
    (płaca = koszyk 1 osoby); firmy bez kapitału startowego nie osiągają
    kosztu rozbudowy 100 (wypłaty zostawiają gotówkę na poziomie bufora);
    rozbudowa jest jedynym odpływem pieniądza i finansuje się z kapitału.

------------------------------------------------------------------------

# 52I. Precyzja ceny jednostkowej oddzielona od pieniędzy (etap 4A, P12)

**Status:** CANONICAL --- decyzja właściciela 2026-10-01; wdrożone
(ENGINE_VERSION 7, SCHEMA_VERSION bez zmian = 6). Nie zweryfikowane nowym
przebiegiem (walidacji i diagnozy w tym etapie nie uruchamiano).

-   **Przyczyna P12:** `updateMarketGood` zapisywał nową cenę przez
    `roundMoney` (grosze). Największa miesięczna zmiana to 3%
    (`MAX_TICK_PRICE_CHANGE` 0,1 × `PRICE_SMOOTHING_FACTOR` 0,3); przy
    cenie ≤ 0,16 to mniej niż pół grosza, więc zaokrąglenie kasowało cały
    ruch --- w górę mimo niedoboru i w dół mimo nadwyżki. Powyżej 0,16
    zmiany były skwantowane do pełnych groszy (np. przy 0,48 krok 3% =
    0,0144 → 0,01).
-   **Reguła:** cena jednostkowa `MarketGoodState.localPrice` ma 6 miejsc
    po przecinku (`roundPrice`, round-half-even, `PRICE_DECIMALS = 6`) ---
    przy inicjalizacji i w każdej aktualizacji; historia cen rynku zapisuje
    tę samą wartość. Salda, przelewy, płace, wypłaty i końcowe wartości
    transakcji nadal w groszach. Wartość transakcji = `transactionValue
    (ilość, cena)` --- jedno zaokrąglenie do grosza; identyczna kwota
    schodzi kupującemu i trafia do sprzedawcy.
-   **Bez zmian:** limit miesięcznej zmiany, wygładzanie, `MIN_PRICE`
    (0,01), wpływ popytu, podaży i zapasu. Minimalnej ceny ani tempa zmian
    nie podniesiono.
-   **Jedna cena modelowa:** rynek, plan produkcji (`buildPlanGoodMarkets`),
    handel (`evaluateTradeFlow`), koszyk przetrwania / podłoga płac
    (`smoothedPrice` z historii cen), oszczędności startowe i zakupy
    gospodarstw używają tego samego `localPrice`. Formatowanie UI nie
    wpływa na obliczenia: panel Gospodarki nadal pokazuje 2 miejsca
    (`formatUnitPrice`), a dodatnia cena poniżej pół grosza jest pokazywana
    jako „<0,01”, nigdy „0,00”.
-   **Zapisy:** struktura bez zmian, więc bez migracji schematu; cena
    zapisana do grosza jest poprawną ceną 6-miejscową. ENGINE_VERSION 7 ---
    zmiana semantyki aktualizacji ceny.
-   **Płace (ustalenie, bez zmiany):** `adjustWageOffer` ma ten sam
    mechanizm --- krok ≤ 3%/mies. i `roundMoney`, więc płaca ≤ 0,16 nie
    może się zmienić, a wyżej zmiany są kwantowane do groszy (podłoga =
    3 × wygładzona cena nie jest śledzona dokładniej niż do grosza). Płaca
    jest kwotą wypłacaną, więc grosze są tu uzasadnione; ewentualna zmiana
    --- osobna decyzja.
-   **Poza zakresem (etap 4B):** P13 (rezerwa inwestycyjna), środki
    zamkniętej firmy, odbiorca kosztu rozbudowy, N5.
-   **Uzupełnienie po walidacji (2026-10-01):** `roundPrice` nie ma
    asercji „safe integer” (tylko skończoność). Przy 6 miejscach taki
    limit wypadał przy cenie ~9·10⁹ i wywracał długie przebiegi z rynkiem
    bez podaży (P14, §52J). Zmierzone po 4A (raport §15): cena reaguje w obie
    strony; płace zamarzają na 0,16 tym samym mechanizmem (P12b, decyzja
    otwarta).

------------------------------------------------------------------------

# 52J. N5 --- rynki i magazyny w zamieszkanych regionach Black Mountain

**Status:** CANONICAL --- polecenie właściciela 2026-10-01; wdrożone jako
dane fixture'u (bez nowego kodu mechaniki) + poprawka błędu etapu 2.

-   **Dane (World Generation §27: każdy aktywny region ma rynek):**
    `tests/worldgen/fixtures/black_mountain_reference.json` --- rynki z
    mąką w Riverside (wcześniej rynek bez towarów), Black Mountain i
    Coastal Reach oraz magazyny regionów (`inventory_region_*`) we
    wszystkich trzech. Cena startowa mąki = `basePrice` z contentu (4,00)
    w regionach bez własnej produkcji; Green Valley bez zmian (2,00,
    lokalna produkcja). Oszczędności startowe gospodarstw liczone tą samą
    regułą §52G (3 mies. koszyka po cenie regionu) --- pieniądz świata 770
    → 2030. Regiony niezamieszkane bez rynku.
-   **Poprawka błędu (etap 2, ujawniony przez N5):** zakupy gospodarstw
    (krok 7b) grupują rodziny kohort z bieżącej mapy kohort regionu (po
    demografii), nie z listy kohort sprzed ticka. Dla niepełnych rodzin
    demografia i krok 7b tworzyły syntetyczne kohorty o różnych id (inny
    „pierwszy” członek), a zapis salda tworzył rekord bez `id` (wyjątek
    `Duplicate PopulationCohort id "undefined"`). W Green Valley kolejność
    była zgodna, więc wcześniej błąd się nie ujawniał.
-   **Wynik diagnozy (raport §16):** pierwszy handel w tym świecie
    (Green Valley → Riverside, 11--29 przepływów mąki), ale wygasa, gdy
    gospodarstwa Riverside wydadzą oszczędności (brak źródła dochodu w
    regionie). Black Mountain i Coastal Reach nie mają żadnej podaży (brak
    połączenia z rynkiem z nadwyżką; handel tylko między sąsiadami, bez
    reeksportu) --- cena rośnie 3%/mies. bez górnej granicy (4 → 167 286 w
    t360).
-   **Otwarte (decyzje właściciela):** P14 --- brak górnej granicy ceny /
    reguły popytu bez podaży; P15 --- regiony bez pracodawcy tracą cały
    pieniądz przez import (brak dochodu); P16 --- brak handlu
    tranzytowego (Coastal Reach za Riverside, Black Mountain za
    niezamieszkanym Highland Pass).

------------------------------------------------------------------------

# 52K. P12b i P14 --- precyzja płac i cena przy braku dostępnych ofert

**Status:** CANONICAL --- decyzja właściciela 2026-10-01; wdrożone
(SCHEMA_VERSION 7, ENGINE_VERSION 8). Zwalidowane i zmierzone po
wdrożeniu (raport §18): ceny regionów bez ofert zostają orientacyjne (BM i
Coastal Reach 4,00 zamiast 167 286 w t360), płace schodzą do podłogi
(0,03), handel do Riverside działa jak w N5.

-   **P12b --- stawka płacy:** `CompanyWorkforce.wageOffer` ma 6 miejsc po
    przecinku (`roundWageRate`, ta sama precyzja co cena jednostkowa
    §52I). Limit ±3%/mies., wygładzanie, podłoga (koszyk przetrwania z
    wygładzonej ceny) i sufit (budżet płac planu) bez zmian. Wypłata w
    groszach dopiero przy rozliczeniu: `transactionValue(opłaceni
    pracownicy, stawka)` --- ta sama kwota jest kosztem firmy i (przez
    `splitMoney`) sumą wpływów gospodarstw regionu. Plan produkcji (koszt
    płac), budżet płac i zobowiązania najbliższego ticka w buforze wypłat
    właścicielskich (§52H) liczą się z tej samej stawki modelowej.
-   **P14 --- cztery wielkości rynku (dobro przetrwania):** potrzeby
    (`householdNeed`), zamówienia z pokryciem (`demand` = popyt opłacalny),
    dostępne oferty (`offered` --- towar wystawiony w magazynie regionu
    przed zakupami: produkcja oddana w komis, zapas, import przywieziony w
    poprzednim ticku; bez buforów firm i przyszłej produkcji) oraz zakupy
    (`householdPurchased`).
-   **P14 --- presja cenowa:** `ticksWithoutOffers` liczy kolejne ticki bez
    ofert (brak pola = rynek nie miał jeszcze oferty). Przy ofertach cena
    reaguje jak dotąd (popyt finansowany, podaż, zapas, niedobór; te same
    limity i wygładzanie). Krótki brak ofert (< okno historii podaży, 6
    ticków) zachowuje reakcję na niedobór. Brak ofert przez całe okno
    (`NO_OFFERS_IN_WINDOW`) albo rynek bez żadnej oferty (`NEVER_OFFERED`,
    cena bazowa jako punkt odniesienia) --- presja = 0, cena zostaje jako
    **orientacyjna** (`priceSuspension`), bez comiesięcznych podwyżek i bez
    resetu do ceny bazowej. Brak globalnej ceny maksymalnej. Niedobór
    (`shortageSeverity`), potrzeby i popyt finansowany liczone dalej
    normalnie --- przedsiębiorczość i handel nadal je widzą. Fakty
    `price_pressure_suspended` / `price_pressure_resumed` z krawędzią
    przyczynową (powód: `never_offered` / `no_offers_in_window` /
    `offers_available`). UI (panel Gospodarki): cena orientacyjna
    oznaczona „≈” z opisem.
-   **P14 --- import:** zamówienie importu = niezaspokojone potrzeby
    (potrzeby − zakupy) minus towar już leżący w magazynie importera;
    ilość ograniczona środkami kupujących po rzeczywistym koszcie dostawy
    (`środki / importedCost`, częściowe zakupy), przepustowością połączenia
    i nadwyżką eksportera; settlement dalej ogranicza do fizycznego zapasu.
    Importer bez lokalnych ofert nie musi czekać na wzrost ceny ponad koszt
    dostawy (`importerHasNoOffers`). Zrealizowany przepływ zmniejsza
    zamówienia (ilość i środki) i nadwyżkę eksportera w tym ticku --- to
    samo zamówienie i ta sama oferta nie są liczone przez kilka połączeń.
    Import jest ofertą importera od ticka, w którym towar leży w jego
    magazynie. Gospodarstwa płacą przy zakupie cenę lokalną; koszt
    transportu nadal nie ma odbiorcy (bez zmian).
-   **Zapisy:** migracja v6 → v7 --- `ticksWithoutOffers = 0` tylko przy
    śladzie oferty w zapisanym ticku (`inventory > 0` albo
    `householdPurchased > 0`); bez śladu pole puste (rynek traktowany jak
    bez ofert do pierwszej prawdziwej oferty). Historia transakcji nie jest
    odtwarzana. Ceny, płace i salda bez zmian.
-   **Poza zakresem:** P13, P15 (źródła dochodu regionów), P16 (handel
    wieloodcinkowy), likwidacja firm, odbiorca kosztu rozbudowy, nowe
    firmy, zasoby i transfery.

------------------------------------------------------------------------

# 52L. Etap 4B --- płatny transport, finansowanie rozbudowy i zwrot kapitału

**Status:** CANONICAL --- decyzja właściciela 2026-10-01; wdrożone
(SCHEMA_VERSION 8, ENGINE_VERSION 9). Zwalidowane i zmierzone po
wdrożeniu z poprawkami (raport §20): pieniądz zachowany bez odpływu,
przewoźnicy i firmy budowlane powstają na zamówienia; rozbieżności
parametrów (kapitał budowy, cena rozbudowy, wydajność transportu) --- do
decyzji.

-   **Usługodawcy (VS C23/C24, Production-Economy Master §7):** content
    `content/services/basic_transport.json` (kategoria `transport`,
    `capacityModel.unitsPerEmployee = 20` jedn. ładunku / pracownik /
    mies.) i `content/services/construction.json` (kategoria
    `construction`, 1 jedn. pracy / pracownik / mies., rozbudowa mocy = 4
    jedn. pracy); archetypy `transport_company` i `construction_company`
    (`serviceIds`, kapitał startowy 20). Wszystkie liczby: TODO tuning.
    Zdolność usługi w ticku = pracownicy po decyzji o zatrudnieniu w tym
    ticku × wydajność (usługodawcy przetwarzani przed klientami; zatrudnieni
    pracują w miesiącu, za który dostają płacę); pracownik jest zatrudniony
    tylko w jednej firmie. Usługodawca planuje
    zatrudnienie według popytu na usługę zgłoszonego w poprzednim ticku
    (`Company.market.expectedDemand.service`); bez zamówień --- bez
    pracowników. Content nie zawiera materiałów budowlanych (G24), więc
    usługa budowlana nie ma wejść towarowych --- jawna luka contentu.
-   **Założenie usługodawcy:** wyłącznie na sygnał zamówienia --- transport:
    zamówienia importu niezrealizowane z braku przewoźnika w poprzednim
    ticku (`MarketGoodState.importDemand` regionu importera); budowa: plan
    rozbudowy gotowy do opłacenia bez firmy budowlanej w regionie --- przy
    co najmniej jednym wolnym pracowniku i bez istniejącej firmy tego typu w
    regionie, a kapitał startowy musi opłacić miesiąc pracy ludzi
    potrzebnych do jednego zlecenia po płacy minimalnej regionu (transport:
    1 pracownik; budowa: praca rozbudowy / wydajność). Usługodawca zatrudnia
    najwyżej tylu ludzi, ilu opłaci z gotówki (bez debetu); bez pracowników
    i bez środków na jednego pracownika zamyka działalność (likwidacja).
    Kapitał startowy pochodzi z oszczędności inwestora: rodziny
    kohort regionu z największymi oszczędnościami (musi pokryć kapitał);
    kwota schodzi z jej sald (co do grosza) i pojawia się jako gotówka
    firmy; właściciel = najliczniejsza żyjąca kohorta tej rodziny
    (`ownerType: individual`). Fakty `service_company_founded`,
    `founding_capital_invested`.
-   **Transport --- jedna oferta:** cena oferty dla kupującego = cena towaru
    u eksportera (cena lotu, a dla towaru regionu --- cena lokalna) +
    opłata za przewóz (koszt transportu wg trybu i odległości efektywnej +
    ryzyko; cło 0 w VS). Ta sama cena ogranicza ilość finansowaną przez
    kupujących, jest ceną wyładunku lotu w magazynie importera
    (`Inventory.consignmentPrice`) i ceną płaconą przez gospodarstwa przy
    zakupie (pro rata z lotów po ich cenach). Przewoźnik: aktywna firma
    transportowa w regionie importera albo eksportera (najpierw
    importera) z wolną zdolnością. Właściciel towaru (producent w komisie)
    finansuje przewóz przed sprzedażą: opłata (grosze, `transactionValue`)
    jest jego kosztem operacyjnym w ticku przewozu, a przychodem
    przewoźnika w tym samym rozliczeniu --- za faktycznie przewiezioną
    ilość. Ilość ogranicza też gotówka właściciela na opłatę, zapas,
    przepustowość, nadwyżka eksportera i zdolność przewoźników.
    Niesprzedany zapas nie daje właścicielowi przychodu. Handel jest
    rozliczany przed finansami i wypłatami (krok 10 przed 9.9). Fakty
    `transport_service_paid`. Bez profilu transportu w konfiguracji
    (scenariusze testowe bez contentu) przewóz jest bezpłatny jak przed 4B,
    a cena oferty = cena towaru.
-   **P13 --- rezerwa inwestycyjna:** jeden aktywny plan rozbudowy
    (`ai.activeStates.expansion_plan`), uzasadniony przez istniejące
    sygnały AI (trwały popyt, dodatni wynik planu, dostępne wejścia, wolni
    pracownicy, brak kryzysu), oceniany co tick --- anulowanie zwalnia
    rezerwę. Po zabezpieczeniu bufora operacyjnego `INVESTMENT_RESERVE_SHARE`
    (= 0,5, TODO tuning) nadwyżki kwalifikującej się do wypłaty trafia do
    `Company.finance.investmentReserve` (gotówka zostaje w firmie,
    niedostępna do wypłaty), reszta do właściciela; rezerwa ≤ koszt jednej
    rozbudowy. Bez planu --- reguła §52H bez zmian.
-   **Rozbudowa = opłacona usługa:** wymaga firmy budowlanej regionu z wolną
    zdolnością ≥ pracy rozbudowy; wtedy klient płaci koszt rozbudowy
    (`EXPANSION_CAPITAL_COST` = 100, bez zmiany) z gotówki (rezerwa
    zwalniana), kwota jest przychodem wykonawcy w tym ticku, jego płace
    trafiają do jego pracowników, moc rośnie. Bez wykonawcy plan zostaje
    niezrealizowany (gotówka nie zwiększa mocy). Fakt
    `construction_service_paid`. **Rozbieżność:** koszt 100 nie wynika z
    definicji usługi (4 jedn. pracy × płaca to dziś ułamek tej kwoty) ---
    propozycja: cena zlecenia = praca × płaca wykonawcy × (1 + marża)
    albo jawny parametr ceny usługi w contencie; decyzja właściciela.
-   **Likwidacja:** zamknięta firma (pracownicy zwolnieni, N1) po
    rozliczeniu zobowiązań ticka oddaje właścicielowi całą wolną gotówkę:
    najpierw niewypłacony zysk (do dodatniego wyniku zatrzymanego), reszta
    jako zwrot kapitału (fakt `company_capital_returned` /
    `capital_return_received`; nie zysk, nie przychód). Gotówka spada do
    0, więc nic nie wraca drugi raz; późniejsza sprzedaż komisowa najpierw
    pokrywa ewentualną ujemną gotówkę, potem jest zwykłym zyskiem
    wypłacanym tak samo. Odbiorca wg istniejącego modelu właściciela
    (§52H); brak odbiorcy --- gotówka zostaje, fakt
    `capital_return_unclaimed` raz.
-   **Zapisy:** v7 → v8 --- `investmentReserve = 0`; `consignmentPrice`
    opcjonalne (lot bez ceny = cena lokalna).
-   **Poza zakresem:** P15, P16, dodatkowe kategorie potrzeb, stałe
    transfery, obowiązkowy podział własności, nowe ekrany.

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

**Status:** CANONICAL (zaktualizowane 2026-09-18, patrz
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md`; zastępuje
pierwotny podział na 12 wąskich domen)

5 domen: 1. Rolnictwo i Żywność 2. Górnictwo i Metalurgia 3.
Budownictwo i Mechanika 4. Transport i Komunikacja 5. Nauka i
Społeczeństwo

Każda domena łączy 2--3 z pierwotnych 12 wąskich domen (np. Górnictwo
i Metalurgia = Mining + Metallurgy) -- pełne mapowanie w katalogu
odkryć. Powód zmiany: 12 wąskich domen dawało zbyt drobnoziarnisty
podział względem porównywalnych gier gatunku (RimWorld, Oxygen Not
Included, Dwarf Fortress) i utrudniało dostarczenie spójnego zestawu
Discoveries na start (M15).

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

# 59. TECH-007 --- T0--T6

**Status:** CANONICAL (zaktualizowane 2026-09-18, rozszerzone o jeden
stopień względem pierwotnego T0--T5, patrz
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md`)

T0--T6 są complexity bands.

Nie są historycznymi erami.

T6 = szczyt katalogu odkryć: zorganizowane społeczeństwo przemysłowe
(huty, medycyna zapobiegawcza, uniwersytety, zintegrowany transport).
Nie sięga lotu kosmicznego ani epoki elektrycznej -- świadomie poza
zakresem.

------------------------------------------------------------------------

# 60. TECH-008 --- Vertical Slice

**Status:** VS (zaktualizowane 2026-09-18 -- pierwotny podział 5
głównych + 4 wspierające domeny zastąpiony przez TECH-004's 5 nowych
szerokich domen, patrz
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md`)

Wszystkie 5 domen (TECH-004) są aktywne w VS -- nowy podział nie
rozróżnia już "głównych" i "wspierających", każda z 5 domen ma pełny
zestaw 25 Discoveries.

125 Discoveries łącznie (5 × 25), zamiast pierwotnego ~20--30.

------------------------------------------------------------------------

# 61. TECH-009 --- deposits exist before discovery

**Status:** CANONICAL

Złoże istnieje fizycznie w World Seed przed jego odkryciem.

Technologia/informacja ujawnia je światu.

------------------------------------------------------------------------

# 61A. TECH-010 --- granica odkrycia zasobów (2026-09-26)

**Status:** CANONICAL --- decyzja właściciela po analizie przyczynowej
zamknięcia `M21-VIS-R2` (wariant D: D1 + D2 + D3)

Kanoniczna zależność:

``` text
PHYSICAL EXISTENCE → UNKNOWN → DISCOVERY POSSIBILITY
→ DISCOVERED / ASSESSED → EXTRACTION / ECONOMIC USE
```

-   Złoże istnieje fizycznie niezależnie od wiedzy świata (TECH-009).
-   Firma / AI nie wykorzystuje `stock.quantity`, rezerwy, jakości ani
    dostępności ekonomicznej złoża, dopóki nie jest ono `DISCOVERED` lub
    `ASSESSED`. `SUSPECTED` nie wystarcza. Dotyczy wszystkich ścieżek
    gospodarczego użycia (zakładanie firm, dostępność wejść, decyzja
    produkcji, liczba batchy, wydobycie) --- AI Decision Model §113.
-   **Eksploatacja nie powoduje odkrycia.** Extraction → Discovery jest
    odrzucone (wariant C); discovery poprzedza świadome użycie.
-   **D1 --- spójny stan początkowy** (World Generation Spec §22): jeżeli
    firma istniejąca na starcie używa metody wymagającej zasobu, świat
    musi znać złoże tego zasobu w jej regionie. Niespójny fixture /
    stan świata jest odrzucany przez walidację, nie naprawiany w runtime.
-   **Wiedza gracza = globalny stan odkrycia.** UI i Read Models nie
    ujawniają istnienia, typu, ilości, jakości ani rezerwy złoża
    nieznanego światu. Jedyny wyjątek to sygnał „w regionie może
    występować złoże” dla SUSPECTED (bez typu, ID i danych) --- pełna
    macierz ujawniania: TECH-012.
-   **D3 --- naturalne odkrywanie:** świat musi móc odkrywać złoża bez
    gracza; interwencja Architekta `reveal_resource_deposit` może
    przyspieszyć odkrycie, ale nie jest jedyną drogą. Trigger
    naturalnego odkrycia: **rozstrzygnięty w TECH-012** (model A + a,
    2026-09-27).
-   **Zależność od TECH-011:** naturalne odkrywanie (D3) działa w każdym
    zamieszkanym regionie, bo każdy region ma `TechnologyState`.
-   **Odłożone:** ACTOR-SPECIFIC / LOCAL KNOWLEDGE MODEL (wiedza per
    aktor / region, PerceivedState z zapisem, dyfuzja wiedzy, wiedza
    gracza jako osobny byt) --- osobny przyszły problem projektowy, bez
    implementacji „na zapas”.

------------------------------------------------------------------------

# 61B. TECH-011 --- TechnologyState w każdym regionie (2026-09-26)

**Status:** CANONICAL --- decyzja właściciela

-   Każdy Region ma **dokładnie jeden** `TechnologyState`
    (`Region.knowledge.technologyStateId` ↔ `TechnologyState.regionId`).
    Brak stanu albo drugi stan to niespójny świat, odrzucany przez
    walidację (nie dotwarzany w runtime).
-   Region bez populacji ma stan **nieaktywny**: nie tworzy wiedzy i nie
    dokonuje odkryć (także T0). Stan wraca do gry, gdy region zostanie
    zasiedlony.
-   Tempo: przyrost wiedzy rośnie z pierwiastkiem populacji i maleje z
    poziomem wiedzy; pasma docelowe --- OPEN-004.

------------------------------------------------------------------------

# 61C. TECH-012 --- naturalne odkrywanie złóż, model A + a (2026-09-27)

**Status:** CANONICAL --- decyzja właściciela (zamyka OPEN triggera D3
z TECH-010)

``` text
PHYSICAL EXISTENCE → UNKNOWN → SUSPECTED → DISCOVERED → ASSESSED
→ ECONOMIC USE
```

-   **Status = poziom wiedzy o konkretnym złożu.** Technologia nie musi
    przesuwać złoża dokładnie o jeden status. Status nigdy się nie cofa.
-   **Bramki (znaczenie z Technology Discovery Catalog, bez
    reinterpretacji):**
    -   **MIN-001** --- złoże płytkie / łatwo wykrywalne: UNKNOWN →
        DISCOVERED (VS §31); głębsze w zasięgu MIN-001: UNKNOWN →
        SUSPECTED.
    -   **MIN-008** --- rozszerza wykrywanie w regionie: UNKNOWN →
        SUSPECTED dla złóż poza zasięgiem MIN-001. **Nie** przeprowadza
        SUSPECTED → DISCOVERED.
    -   **MIN-011** --- głębokie złoża: SUSPECTED lub DISCOVERED →
        ASSESSED. ASSESSED wymaga potwierdzonego istnienia, więc z
        SUSPECTED przejście biegnie logicznie przez DISCOVERED w tym
        samym ticku (dwa fakty, krawędź przyczynowa między nimi).
-   **Wybór złoża (wariant a):** deterministycznie, bez RNG. Gdy
    odkrycie z reguły jest w regionie co najmniej `AVAILABLE`, **każde**
    złoże regionu spełniające regułę przechodzi do statusu docelowego w
    tym samym ticku.
-   **Reguły należą do contentu:** `ResourceDefinition.discoveryRules.
    detection[]` = `{discoveryId, targetStatus, minDepth?, maxDepth?,
    fromStatuses?}` (granice głębokości włącznie). Silnik nie zna
    konkretnych zasobów ani odkryć. Zasób bez reguł nie jest odkrywany
    naturalnie. Progi głębokości są `TODO tuning`.
-   **Głębokość jest jawną właściwością danych złoża.** `stock.depth`
    niepodane (`undefined`) ≠ jawne `0`; złoże bez podanej głębokości
    nie spełnia żadnej reguły --- brak danych nie jest geologią.
-   **SUSPECTED** = „w regionie mogą występować zasoby”; nie daje użycia
    gospodarczego (TECH-010) ani danych ekonomicznych.
-   **Pusty region** sam nie odkrywa złóż (TECH-011); eksploracja
    pustych regionów bez kontaktu --- DEFERRED. Architekt działa według
    swojej specyfikacji (`reveal_resource_deposit`: UNKNOWN →
    DISCOVERED).
-   **Fakty:** każda rzeczywista zmiana statusu = jeden fakt
    (`resource_suspected` / `resource_discovered` / `resource_assessed`),
    brak zmiany = brak faktu. Chronicle bez zmian: istniejący typ
    zdarzenia `resource_discovered`; podejrzenia i oceny nie są
    zdarzeniami historycznymi.
-   **Macierz ujawniania (Read Models / UI, minimal disclosure):**

| Informacja | UNKNOWN | SUSPECTED | DISCOVERED | ASSESSED |
|---|---|---|---|---|
| istnienie | nie | tylko „możliwe złoże w regionie” (liczba) | tak | tak |
| typ zasobu | nie | nie | tak | tak |
| lokalizacja | nie | region (bez ID złoża) | region | region |
| głębokość | nie | nie | nie | tak (jeśli podana w danych) |
| ilość / rezerwa | nie | nie | tak | tak |
| jakość, dostępność | nie | nie | nie | tak |
| stan wydobycia | nie | nie | tak | tak |

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

**Status:** SUPERSEDED (2026-09-26) przez `UI-014`

Historycznie: około 70% text/data/history/analytics, 30% abstract
network visualization.

Dla ekranu World obowiązuje `UI-014`: Living Atlas jest centralnym i
dominującym wizualnie elementem. Pozostałe ekrany zachowują charakter
text-first (`UI-001`).

------------------------------------------------------------------------

# 103. UI-004 --- główna nawigacja

**Status:** CANONICAL

1.  World
2.  Economy
3.  Technology
4.  Chronicle
5.  Architect

Forma (od 2026-09-26, `UI-014`): stały lewy navigation rail + funkcje
systemowe. Dodanie kolejnych wpisów wymaga decyzji właściciela.

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

# 112A. UI-014 --- kompozycja World Screen (2026-09-26)

**Status:** CANONICAL --- decyzja właściciela projektu

World Screen jest projektowany według hierarchii kompozycyjnej
zaakceptowanego mockupu „FIRST CAUSE --- A LIVING WORLD” (referencja
kompozycyjna i funkcjonalna, nie pixel-perfect).

-   **Living Atlas jest centralnym i dominującym wizualnie elementem.**
-   Stały lewy navigation rail (zakres `UI-004`).
-   Górny pasek: czas świata, sterowanie czasem, World Pulse.
-   Prawa kolumna: Selected Region Inspector z jawnym stanem pustym;
    `selectedEntityId` ≠ `analysisScope`.
-   Pod Atlasem: Key Causes / Possible Consequences / Quick Actions
    (wspólny zakres `ŚWIAT | [REGION]`).
-   Ranking, gospodarka, Recent Events, Timeline, Chronicle: moduły
    wspierające, nie dominują Atlasu.

Jedyny normatywny opis: `FIRST-CAUSE-Golden-UI-World-Command-Center-v1.3.md`
§26. Supersedes `UI-003` oraz sprzeczne układy wymienione w §26.5 tego
dokumentu.

------------------------------------------------------------------------

# 112B. UI-015 --- czytelność cywilizacji w Living Atlas (2026-09-26)

**Status:** CANONICAL --- wymaganie; implementacja w Roadmap v0.6
M21-VIS-R2...R4

-   Atlas musi móc jednocześnie reprezentować wiele elementów
    gospodarczych i infrastrukturalnych regionu (np. kopalnia + huta +
    tartak + droga + kolej + wydobycie żelaza). Pojedyncza wartość
    `industry` nie jest docelowym ograniczeniem reprezentacji.
-   Rozwój osady komunikuje zmianę morfologii, nie wyłącznie „więcej
    identycznych kwadratów w większej siatce”.
-   Wizualny rozwój osady nie kończy się przy ok. 100 000 mieszkańców;
    skala jest logarytmiczna / semantyczna i rozróżnia zakres od ok. 100
    do 10 000 000+.
-   Poziom WORLD nie jest niemal pustym diagramem; zoom dodaje
    szczegóły, nie ujawnia istnienia podstawowych elementów świata.
-   Każdy Map Mode przekazuje wizualnie inną informację; „zero” ≠
    „brak danych”.

Szczegóły: `FIRST-CAUSE-Living-Atlas-Visual-Asset-Spec-v1.3.md` §28.
Nie zmienia Simulation Model ani Entity Data Model; dotyczy kontraktu
Read Model → wizualizacja.

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

Stan na 2026-09-17: **M0 = DONE; M0.1 Audit Fixes = DONE; M1–M6 =
DONE; M7 = READY (not started)**. Bieżący zakres i statusy określa
`FIRST-CAUSE-Implementation-Roadmap-v0.6.md` (sekcje "Wyniki
wykonania" per milestone) -- ten wpis nie był aktualizowany od M1 i
przez to błędnie wskazywał M1 jako kolejny krok mimo ukończonych
commitów M1–M6; poprawiono przy okazji przeglądu naprawczego M6 (RNG
`nextInt` boundary, `applyMonthlyDemography` stochastic rounding,
`groupCohortsIntoFamilies` -- patrz CHANGELOG 2026-09-17).

------------------------------------------------------------------------

# 163. IMPL-002 --- brak kolejnej fali dużych specyfikacji

**Status:** CANONICAL

Nie projektować teraz kolejnych dużych systemów bez konkretnego blockera
implementacyjnego.

------------------------------------------------------------------------

# 164. IMPL-003 --- World Generation

**Status:** CANONICAL

Specyfikacja istnieje: `FIRST-CAUSE-World-Generation-Spec-v0.1.md`.
Określa kontrakt generowania świata; pełna implementacja należy do M22,
a ręczny fixture do M4. Specyfikacja nie oznacza ukończenia generatora.

------------------------------------------------------------------------

# 165. IMPL-004 --- World Generation scope

**Status:** CANONICAL

Zakres i pipeline określa World Generation Spec v0.1: graf regionów,
kontynenty, teren, klimat, woda, zasoby, populacja, osady, kultura/wiedza,
infrastruktura i początkowa gospodarka. Szczegóły algorytmów pozostawione
do prototypowania są nadal otwarte (OPEN-011).

------------------------------------------------------------------------

# 166. IMPL-005 --- Black Mountain fixture

**Status:** CANONICAL

Przed pełnym proceduralnym generatorem można użyć deterministycznego
ręcznie przygotowanego fixture do implementacji i testów.

------------------------------------------------------------------------

# 167. IMPL-006 --- Technology Stack

**Status:** CANONICAL

Obowiązuje `FIRST-CAUSE-Technology-Stack-Decision-v0.1.md`: TypeScript,
Electron, React/Vite, Simulation Worker, pnpm monorepo, JSON + Zod,
i18next, Vitest/Playwright, Zustand dla UI state i PixiJS dla Living Atlas.
VS save: wersjonowany JSON + gzip. Tick pipeline jest sekwencyjny
i deterministyczny. Narzędzia profilowania określa §51 tego dokumentu.

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
wcześniej niż ich pełne milestone'y. UI Foundation także rozwija się
przyrostowo zgodnie z roadmapą v0.2: debug shell/Read Models od M3/M4,
tokens i komponenty od M5. M21 domyka integrację UI.

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

> **2026-09-26 (decyzja właściciela):** zaakceptowano model tempa
> (przyrost wiedzy ∝ √populacji z malejącym przyrostem, rosnące odstępy
> progów tierów) i **pasma docelowe** jako kryteria testu: izolowana osada
> ≤ 100 osób --- T0--T2 po 200 latach; ~2 000 --- T3--T4; ~20 000 --- T5;
> ≥ 200 000 --- T6 po ok. 100--180 latach. Konkretne liczby pozostają
> tuningiem, ale muszą utrzymać test pasm (`technology-pacing.test.ts`).

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

**Status:** VS / CANONICAL; format docelowy OPEN

VS używa wersjonowanego JSON + gzip (Technology Stack Decision §36–41).
Format binarny/chunked pozostaje decyzją po benchmarkach. M1 implementuje
minimalny core save/restore, M20 pełną integrację zapisu.

------------------------------------------------------------------------

# 195. OPEN-008 --- money representation

**Status:** CANONICAL; szczegóły numeryczne OPEN dla M1

Pieniądze mają reprezentację integer/fixed-scale (Technology Stack
Decision §27), bez float jako źródła prawdy. Skalę, zaokrąglanie
i obsługę przepełnienia należy zapisać w krótkim ADR w M1.

------------------------------------------------------------------------

# 196. OPEN-009 --- font stack

**Status:** VS / CANONICAL; rozszerzenia locale TARGET

UI Visual Design System v1.0 ustala IBM Plex Sans dla UI/body, IBM Plex
Mono dla danych i Source Serif 4 dla wybranej warstwy historycznej.
Pokrycie EN/PL należy zweryfikować przy wdrożeniu fontów; fallbacki dla
pozostałych locale wymagają weryfikacji przy ich aktywacji.

------------------------------------------------------------------------

# 197. OPEN-010 --- exact World Network visual style

**Status:** VS / CANONICAL

Kierunek Living Scientific Atlas i reguły gęstości/semantic zoom określa
`FIRST-CAUSE-UI-Visual-Design-System-v1.4.md`; kontrakty wykonawcze określa
`FIRST-CAUSE-UI-Implementation-Spec-v1.4.md`; kontrakt Read Model →
Atlas określa `FIRST-CAUSE-Living-Atlas-Visual-Asset-Spec-v1.3.md`.
Kompozycja ekranu World jest zamrożona w `UI-014` (Golden UI World v1.3
§26); szczegóły layoutu podlegają prototypowaniu w tych granicach. Nie
wpływa to na Simulation Model.

------------------------------------------------------------------------

# 198. OPEN-011 --- World Generation algorithm

**Status:** OPEN — szczegóły implementacyjne M22

World Generation Spec v0.1 istnieje i definiuje pipeline. Jego §63
pozostawia konkretny topology algorithm, spatial representation
i naming algorithm do prototypowania. Nie jest to brak całej specyfikacji
ani blocker M1; officialMaxRegions pozostaje zależny od benchmarków.

------------------------------------------------------------------------

# 199. Dokumenty nadrzędne dla implementacji VS

Przy implementacji systemu agent powinien czytać przede wszystkim:

1.  `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
2.  odpowiedni system spec
3.  `FIRST-CAUSE-Entity-Data-Model-v0.1.md`
4.  `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md`
5.  `FIRST-CAUSE-Simulation-Test-Spec-v0.1.md`

Dodatkowe dokumenty tylko, jeśli system ich dotyczy.

Kanoniczna specyfikacja ekonomii to
`FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md`; plik `-POLSKI` jest
wyłącznie odsyłaczem. UI stosuje Design System v1.4, Implementation
Spec v1.4, Golden UI World v1.3 i Living Atlas Visual Asset Spec v1.3,
z pierwszeństwem niniejszego rejestru.

**Dostępność źródeł (2026-09-16):**

- `FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md`, przywoływany
  przez starsze specyfikacje, nie jest dostępny w repo. Odwołania nie
  stanowią dowodu dostępności katalogu. Przed implementacją M15 należy
  dostarczyć i zweryfikować katalog VS albo jawnie uzgodnić jego
  zastąpienie walidowanymi definicjami contentu. Nie odtwarzać brakującej
  treści przez zgadywanie. M2 może rozwijać schema/pipeline na minimalnych
  danych zgodnie ze swoim zakresem; brak katalogu nie blokuje M1.
- Dokumenty UI opisują zaakceptowane Golden UI, ale pliki referencyjne
  lub trwałe odnośniki nie są dostępne w repo. Przed odbiorem zgodności
  wizualnej trzeba je udostępnić. Do tego czasu można wdrażać tekstowe
  kontrakty, lecz nie deklarować zgodności z nieobejrzanymi mockupami.
  **Stan 2026-09-26:** w repo są `docs/golden-ui/FIRST-CAUSE-Golden-UI-01-World-v1.0.png`,
  `docs/golden-ui/FIRST-CAUSE-Visual-Alphabet-v1.1(1).png` i
  `docs/visual-reference/FIRST-CAUSE-Raw-Simulation-Atlas-v0.1(1).png`.
  Mockup kompozycyjny „FIRST CAUSE --- A LIVING WORLD” (`UI-014`) nie
  jest jeszcze dołączony; do tego czasu normatywny jest tekst Golden UI
  World v1.3 §26.

------------------------------------------------------------------------

# 200. Reguła końcowa

> **Jeżeli dokumentacja opisuje dwie różne wersje tej samej decyzji,
> agent nie wybiera tej, która jest łatwiejsza do implementacji. Wybiera
> decyzję z niniejszego rejestru.**

------------------------------------------------------------------------

# 201. Następny krok

**Status na 2026-09-17 (zaktualizowano przy przeglądzie naprawczym
M6):** M1 — Deterministic Core jest ukończone (ADR-001 rozstrzyga
algorytm/wersję RNG, wyprowadzanie streamów, strategię ID,
rounding/overflow, canonical serialization i checksum, kolejność
Commands na ticku oraz gwarancje platformowe -- patrz ta decyzja
poniżej dla treści, która pierwotnie tu stała jako "do podjęcia w M1").
Po odbiorze M1 → M2 → M3 → M4 → M5 → M6, wszystkie DONE (roadmapa v0.2,
sekcje "Wyniki wykonania"). Następny etap: **M7 — Production**.

Przed rozpoczęciem M7 poprawiono w ramach przeglądu M6 (patrz
CHANGELOG 2026-09-17): `RngStream.nextInt` przyjmował `maxExclusive`
do 2**32 włącznie, co przez zawijanie `>>> 0` dawało `NaN` zamiast
rzucić; `applyMonthlyDemography` zaokrąglał deterministycznie
(round-half-even), co dla małych populacji trwale zerowało
urodziny/zgony/aging (nigdy nie osiągały progu 0.5) -- zastąpiono
losowym zaokrąglaniem przez dotąd nieużywany strumień RNG
"demography" (SAVE-003); `agingSpanYears` mogło przyjąć wpis dla
terminalnej `AGE_65_PLUS`, usuwając populację bez grupy docelowej --
zablokowano to typem `NonTerminalAgeGroup` i sprawdzeniem
strukturalnym; dodano `groupCohortsIntoFamilies`, żeby ręcznie
przygotowany fixture świata (M4, z jedną kohortą na tożsamość) dało
się podać demografii (M6) bez osobnego przygotowania. Zielone testy
same w sobie nie wystarczały do wykrycia tych usterek -- żaden z nich
nie uruchamiał wystarczająco długiego przebiegu na małych populacjach
ani nie testował błędnej konfiguracji `agingSpanYears`.

Nie rozpoczynać kolejnej dużej specyfikacji bez konkretnego blockera
implementacyjnego.

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE Canonical Decisions v0.1**
