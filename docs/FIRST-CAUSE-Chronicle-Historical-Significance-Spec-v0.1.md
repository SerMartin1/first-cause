# FIRST CAUSE --- Chronicle & Historical Significance Spec v0.1

**Status:** wersja robocza / kanoniczna specyfikacja Kroniki i znaczenia
historycznego\
**Projekt:** FIRST CAUSE\
**Wersja dokumentu:** 0.1\
**Rola:** zdefiniowanie sposobu, w jaki symulacja rozpoznaje wydarzenia
historycznie istotne, agreguje je, zachowuje jako trwałą pamięć świata
oraz prezentuje graczowi jako Dynamic Chronicle bez wymyślania faktów.

**Dokumenty powiązane:** -
`FIRST-CAUSE-Koncepcja-i-Architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Production-Economy-Master-v0.1.md` -
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` -
`FIRST-CAUSE-Entity-Data-Model-v0.1.md` -
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` -
`FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` -
`FIRST-CAUSE-AI-Decision-Model-v0.1.md` -
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md`

------------------------------------------------------------------------

# 0. Cel dokumentu

FIRST CAUSE może generować ogromną liczbę zmian:

-   ceny,
-   produkcję,
-   migrację,
-   powstawanie firm,
-   upadki firm,
-   odkrycia,
-   rozwój osad,
-   handel,
-   niedobory,
-   wyczerpywanie zasobów,
-   interwencje Architekta,
-   długie łańcuchy konsekwencji.

Większość z nich nie powinna trafiać do Kroniki.

Chronicle System ma odpowiedzieć na trzy pytania:

1.  **Co faktycznie się wydarzyło?**
2.  **Które wydarzenia są historycznie istotne?**
3.  **Jak opowiedzieć je graczowi bez zmiany lub wymyślania historii?**

Fundamentalny przepływ:

`Simulation Fact → Significance Evaluation → Chronicle Candidate → Aggregation → Chronicle Entry → Historical Memory`

------------------------------------------------------------------------

# 1. Fundamentalna zasada

> **Kronika nie tworzy historii. Kronika wybiera i opisuje historię,
> którą stworzyła symulacja.**

Chronicle System: - nie zmienia World State, - nie generuje przyczyn, -
nie tworzy wydarzeń dla dramaturgii, - nie naprawia „nudnej"
symulacji, - nie dodaje faktów, których nie ma w danych.

------------------------------------------------------------------------

# 2. Simulation Fact jest źródłem prawdy

Każdy Chronicle Entry musi być zakotwiczony w jednym lub wielu
istniejących `SimulationFact`.

Przykład:

``` text
resource_discovered
→ company_founded
→ employment_increased
→ migration_increased
→ settlement_stage_changed
```

Kronika może opisać cały proces, ale nie może stworzyć dodatkowego
zdarzenia typu „gorączka żelaza", jeśli nie wynika ono z danych.

------------------------------------------------------------------------

# 3. Chronicle Entry nie jest Simulation Fact

Rozdzielenie jest obowiązkowe.

``` text
SimulationFact
= prawda symulacyjna

ChronicleEntry
= prezentacja wybranej prawdy
```

Usunięcie wpisu z Kroniki nie może zmieniać historii świata.

------------------------------------------------------------------------

# 4. Historical Significance

Kanoniczna koncepcja:

`HistoricalSignificance = Magnitude × Duration × PopulationAffected × GeographicScope × Novelty × CausalImpact`

W implementacji rekomendowany jest model ważony/normalizowany zamiast
dosłownego surowego mnożenia, aby jeden zerowy lub ekstremalny składnik
nie niszczył wyniku.

------------------------------------------------------------------------

# 5. Skala Historical Significance

Rekomendowany zakres:

`0–100`

Kategorie:

-   0--9 --- Trace
-   10--24 --- Minor
-   25--44 --- Notable
-   45--64 --- Major
-   65--84 --- Historic
-   85--100 --- World-Defining

Dokładne progi są tuningiem.

------------------------------------------------------------------------

# 6. Magnitude

Magnitude mierzy wielkość zmiany względem właściwego kontekstu.

Przykłady: - zmiana populacji, - zmiana ceny, - skala bankructwa, -
wielkość migracji, - rozmiar odkrytego złoża, - wzrost produkcji.

Nie porównujemy surowych liczb bez kontekstu.

------------------------------------------------------------------------

# 7. Relative Magnitude

Preferujemy wielkość względną.

Przykład: - +500 mieszkańców w wiosce 700 osób = ogromna zmiana, - +500
mieszkańców w metropolii 5 mln = mała zmiana.

------------------------------------------------------------------------

# 8. Duration

Jednomiesięczny skok jest mniej historyczny niż zmiana utrzymująca się
przez dekadę.

Duration może być: - instantaneous, - short, - sustained, -
structural, - multi-generational.

------------------------------------------------------------------------

# 9. Population Affected

Mierzy liczbę/udział populacji dotkniętej zmianą.

Przykłady: - lokalny warsztat --- mały zasięg, - regionalny kryzys
żywnościowy --- duży, - globalna technologia --- bardzo duży.

------------------------------------------------------------------------

# 10. Geographic Scope

Poziomy: - Local, - Settlement, - Regional, - Multi-Regional, -
Continental, - World.

Scope nie powinien być sztucznie podnoszony przez odległe TRACE effects.

------------------------------------------------------------------------

# 11. Novelty

Pierwsze wystąpienie może być bardziej historyczne niż setne.

Przykłady: - pierwsza huta w regionie, - pierwsza kolej na
kontynencie, - pierwsze użycie elektryczności, - pierwszy import po
wyczerpaniu lokalnego surowca.

------------------------------------------------------------------------

# 12. Causal Impact

Najważniejszy składnik FIRST CAUSE.

Wydarzenie jest bardziej istotne, jeśli prowadzi do wielu ważnych
konsekwencji.

Przykład: odkrycie złoża, które niczego nie zmieniło, może być Notable.

To samo odkrycie prowadzące do: - kopalń, - migracji, - miasta, -
kolei, - przemysłu

może po latach zostać ocenione jako Historic.

------------------------------------------------------------------------

# 13. Significance może rosnąć z czasem

W momencie wystąpienia pełne znaczenie zdarzenia nie musi być znane.

Dlatego rozróżniamy:

``` text
InitialSignificance
RetrospectiveSignificance
```

------------------------------------------------------------------------

# 14. Initial Significance

Obliczana przy powstaniu faktu na podstawie: - magnitude, - scope, -
novelty, - bezpośrednich skutków, - typu faktu.

------------------------------------------------------------------------

# 15. Retrospective Significance

Może wzrosnąć, gdy późniejsze ważne wydarzenia wskazują wcześniejszy
fakt jako znaczącą przyczynę.

Przykład:

``` text
Iron discovered — 31/100
50 lat później:
→ regional industrialization
→ major city
→ trade corridor
Retrospective significance = 78/100
```

------------------------------------------------------------------------

# 16. History Reassessment

Chronicle System może oznaczyć wcześniejsze wydarzenie jako: - później
uznane za punkt zwrotny, - początek procesu, - historyczny antecedent.

Nie zmienia to samego faktu.

------------------------------------------------------------------------

# 17. Chronicle Candidate

Simulation Fact staje się `ChronicleCandidate`, jeśli przekracza
minimalne kryterium lub należy do kategorii zawsze podlegającej ocenie.

------------------------------------------------------------------------

# 18. Candidate ≠ Entry

Candidate może zostać: - opublikowany, - zagregowany z innymi, -
odroczony, - odrzucony, - zachowany tylko jako historyczny anchor.

------------------------------------------------------------------------

# 19. Candidate Schema

``` yaml
ChronicleCandidate:
  id:
  factRefs:
  tick:
  entityRefs:
  regionRefs:

  eventType:
  significance:
  novelty:
  scope:
  durationState:

  causalAnchors:
  architectInfluence:

  aggregationKey:
  status:
```

------------------------------------------------------------------------

# 20. Chronicle Entry Schema

``` yaml
ChronicleEntry:
  id:
  startTick:
  endTick:

  titleKey:
  templateKey:

  primaryFactRefs:
  supportingFactRefs:
  causalAnchorRefs:

  entityRefs:
  regionRefs:

  category:
  significance:
  scope:

  architectInfluence:
  turningPoint:

  dataPayload:
  generatedText:
```

`generatedText` jest prezentacją, nie źródłem prawdy.

------------------------------------------------------------------------

# 21. Kategorie Chronicle

Rekomendowane: - Population - Settlement - Economy - Company - Trade -
Resources - Technology - Infrastructure - Society - Environment -
State - Conflict --- później - Architect - World

------------------------------------------------------------------------

# 22. Typy wydarzeń VS

Minimum: - resource discovered, - company founded, - major company
expansion, - major company closure, - shortage started/ended, - trade
route emerged, - major migration wave, - settlement stage changed, -
discovery occurred, - major PM adoption wave, - resource depletion
milestone, - regional boom, - regional bust, - major intervention
consequence.

------------------------------------------------------------------------

# 23. Event Importance Baseline

Typ faktu może posiadać bazowy priorytet.

Przykład: - miesięczna zmiana produkcji --- niski, - settlement stage
change --- wysoki, - pierwszy discovery --- wysoki.

Baseline nie może zastępować dynamicznego significance.

------------------------------------------------------------------------

# 24. Nie każda firma trafia do historii

Powstanie małego lokalnego biznesu: - zwykle brak osobnego wpisu.

Powstanie pierwszej kopalni w regionie: - może być Notable/Major.

Firma, która później zmieni gospodarkę regionu: - może otrzymać
retrospektywnie większe znaczenie.

------------------------------------------------------------------------

# 25. Aggregation

Wiele podobnych mikro-faktów powinno tworzyć jedno wydarzenie.

Przykład:

``` text
12 miesięcy:
company_hired
company_hired
company_hired
migration_increased
migration_increased
```

Kronika: \> Rozwój górnictwa zaczął przyciągać pracowników do Black
Mountain.

------------------------------------------------------------------------

# 26. Aggregation Window

Każdy typ wydarzenia może mieć: - aggregationWindow, -
aggregationScope, - aggregationKey.

Przykład: `migration_wave:black_mountain:year_32`

------------------------------------------------------------------------

# 27. Temporal Aggregation

Mikro-zmiany z kolejnych miesięcy można łączyć w: - trend, - falę, -
okres wzrostu, - kryzys, - transformację.

------------------------------------------------------------------------

# 28. Spatial Aggregation

Podobne wydarzenia w wielu regionach mogą tworzyć: - regional trend, -
continental wave, - world trend,

jeśli mają wspólny mechanizm.

------------------------------------------------------------------------

# 29. Causal Aggregation

Wydarzenia mogą być agregowane, jeśli mają wspólny causal anchor.

Przykład: wiele migracji spowodowanych tym samym boomem górniczym.

------------------------------------------------------------------------

# 30. Zakaz fałszywej agregacji

Nie łączyć wydarzeń wyłącznie dlatego, że: - nastąpiły w podobnym
czasie, - mają podobną kategorię.

Musi istnieć: - wspólny obiekt, - region, - mechanizm, - trend lub
causal relationship.

------------------------------------------------------------------------

# 31. Trend Detection

Trend wymaga: - persistence, - direction consistency, - minimal
magnitude.

Jednorazowa zmiana nie jest trendem.

------------------------------------------------------------------------

# 32. Trend Start

Nie zawsze znamy początek trendu w czasie rzeczywistym.

Po potwierdzeniu można ustawić: - `startTick` na wcześniejszy faktyczny
początek, - `confirmedTick` na moment rozpoznania.

------------------------------------------------------------------------

# 33. Trend End

Trend kończy się, gdy: - direction odwraca się, - magnitude zanika, -
warunki wracają do baseline, - następuje strukturalna zmiana.

------------------------------------------------------------------------

# 34. Event Lifecycle

Wydarzenie może mieć:

``` text
EMERGING
CONFIRMED
ONGOING
RESOLVED
HISTORICAL
```

------------------------------------------------------------------------

# 35. Crisis

Kryzys nie jest ręcznie generowanym eventem.

Jest klasyfikacją trwałego wzorca danych.

Przykład: - shortage, - high prices, - falling needs, - migration
outflow.

------------------------------------------------------------------------

# 36. Boom

Boom również jest rozpoznanym wzorcem.

Może obejmować: - production growth, - employment growth, - migration, -
investment, - settlement growth.

------------------------------------------------------------------------

# 37. Bust

Bust: - contraction, - closure, - unemployment, - outmigration, -
declining output.

Nie wymaga resource depletion, choć depletion może być przyczyną.

------------------------------------------------------------------------

# 38. Transformation

Transformacja to dłuższy proces zmieniający strukturę regionu.

Przykład: `agricultural → mining-industrial`

Kronika może rozpoznać ją retrospektywnie.

------------------------------------------------------------------------

# 39. Turning Point

Turning Point to wydarzenie, po którym trajektoria systemu wyraźnie się
zmienia.

Nie każdy Major Event jest Turning Point.

------------------------------------------------------------------------

# 40. Turning Point Score

Może bazować na: - before/after structural difference, - causal
descendants, - duration, - novelty, - scope.

------------------------------------------------------------------------

# 41. Turning Point Detection

Przykład: otwarcie kolei samo w sobie może być Major.

Jeśli po nim: - trade ×3, - nowe firmy, - migracja, - urbanizacja,

może zostać uznane za Turning Point.

------------------------------------------------------------------------

# 42. Firsts

Chronicle powinien wykrywać historyczne „pierwsze":

-   first company of type,
-   first settlement stage,
-   first discovery,
-   first technology adoption,
-   first trade connection,
-   first electricity,
-   first major industrial facility.

Zakres: - settlement, - region, - continent, - world.

------------------------------------------------------------------------

# 43. Lasts / Endings

Istotne mogą być też: - zamknięcie ostatniej kopalni, - koniec lokalnego
wydobycia, - zanik starego PM, - utrata dawnej specjalizacji.

------------------------------------------------------------------------

# 44. Milestones

Przykłady: - population threshold, - production threshold, - trade
threshold, - depletion 25/50/75/90%, - technology adoption threshold.

Nie wszystkie milestone'y muszą trafiać do publicznej Kroniki.

------------------------------------------------------------------------

# 45. Depletion Chronicle

Złoże może generować: - discovery, - first extraction, - peak
extraction, - depletion milestones, - economic exhaustion, -
closure/transition.

------------------------------------------------------------------------

# 46. Technology Chronicle

Ważne rozróżnienie:

``` text
Discovery
Availability
Adoption
Mass Adoption
```

Każde może mieć osobne znaczenie historyczne.

------------------------------------------------------------------------

# 47. Discovery Chronicle

Discovery jest ważniejsze, jeśli: - jest pierwsze, - odblokowuje wiele
PM, - szybko się rozprzestrzenia, - prowadzi do dużych konsekwencji.

------------------------------------------------------------------------

# 48. Adoption Chronicle

Sama wiedza nie zmienia świata.

Chronicle powinien więc równie mocno obserwować: - pierwsze wdrożenie, -
regionalną falę adopcji, - dominację nowej metody.

------------------------------------------------------------------------

# 49. Company Chronicle

Dla firm: - founding, - expansion, - innovation, - regional dominance, -
crisis, - closure.

Tylko przy odpowiednim significance.

------------------------------------------------------------------------

# 50. Company Historical Profile

Historycznie ważna firma może posiadać skróconą oś:

``` text
Founded
First Expansion
Major PM Adoption
Peak Scale
Crisis
Closure / Survival
```

------------------------------------------------------------------------

# 51. Settlement Chronicle

Osada może posiadać własną historię: - founding/emergence, - stage
changes, - boom, - crisis, - specialization, - transformation, -
decline.

------------------------------------------------------------------------

# 52. Region Chronicle

Region agreguje: - gospodarkę, - populację, - zasoby, - technologię, -
handel, - osady.

To jedna z głównych powierzchni UI FIRST CAUSE.

------------------------------------------------------------------------

# 53. World Chronicle

World Chronicle pokazuje tylko wydarzenia o najwyższym significance lub
dużym scope.

Nie powinien być zalewany lokalnymi zdarzeniami.

------------------------------------------------------------------------

# 54. Entity Chronicle

Każda ważna encja może mieć filtrowaną Kronikę: - region, -
settlement, - company, - discovery/technology, - state --- później.

------------------------------------------------------------------------

# 55. Chronicle Sensitivity

Kanoniczne ustawienia:

-   Concise
-   Standard
-   Detailed

Zmieniają tylko raportowanie.

Nie zmieniają symulacji.

------------------------------------------------------------------------

# 56. Concise

Pokazuje: - Historic, - World-Defining, - najważniejsze Major, - Turning
Points.

Przeznaczenie: szybka obserwacja długich okresów.

------------------------------------------------------------------------

# 57. Standard

Domyślny tryb.

Pokazuje: - Major, - Historic, - World-Defining, - wybrane Notable, -
ważne trendy.

------------------------------------------------------------------------

# 58. Detailed

Pokazuje: - Notable+, - więcej lokalnych wydarzeń, - więcej trendów, -
więcej etapów procesów.

Nadal nie pokazuje każdego mikro-faktu.

------------------------------------------------------------------------

# 59. Sensitivity Thresholds

Przykładowo:

``` text
Concise  >= 60
Standard >= 40
Detailed >= 25
```

Wartości są tuningiem.

------------------------------------------------------------------------

# 60. Contextual Promotion

Wpis poniżej globalnego progu może być pokazany w Chronicle konkretnej
encji.

Przykład: significance 28: - nie trafia do World Chronicle, - może być
ważny dla historii małej osady.

------------------------------------------------------------------------

# 61. Relative Importance

Significance powinien mieć komponent: - absolute, - contextual.

`ContextualSignificance` ocenia znaczenie dla konkretnej encji.

------------------------------------------------------------------------

# 62. Personalizacja bez zmiany prawdy

Filtry UI mogą pokazywać: - gospodarkę, - technologię, - populację, -
Architekta.

Zmieniają widok, nie historię.

------------------------------------------------------------------------

# 63. Chronicle Deduplication

Ten sam proces nie powinien generować pięciu niemal identycznych wpisów.

System używa: - fact refs, - aggregation key, - causal anchors, -
temporal proximity.

------------------------------------------------------------------------

# 64. Update Existing Entry

Długotrwały proces może aktualizować wpis:

``` text
EMERGING → ONGOING → RESOLVED
```

zamiast generować osobny wpis co miesiąc.

------------------------------------------------------------------------

# 65. Entry Revision

Wpis może otrzymać: - nowy significance, - endTick, - retrospective
context, - turningPoint=true.

Nie wolno zmieniać historycznych faktów.

------------------------------------------------------------------------

# 66. Chronicle Text Layer

Tekst powinien być generowany z: - template, - structured data, - entity
names, - measured values, - causal anchors.

------------------------------------------------------------------------

# 67. Template-first

Podstawowa wersja nie wymaga LLM.

Przykład:

``` text
{settlementName} awansowało do rangi {newStage} po okresie {mainDriver}.
```

------------------------------------------------------------------------

# 68. Data Payload

Chronicle Entry powinien przechowywać dane potrzebne do lokalizacji:

``` yaml
dataPayload:
  settlementName:
  oldStage:
  newStage:
  population:
  primaryCause:
```

------------------------------------------------------------------------

# 69. Localization

Nie przechowujemy na stałe wyłącznie polskiego zdania jako prawdy
historycznej.

Przechowujemy: - templateKey, - dane, - refs.

Pozwala to wyświetlić tę samą historię w różnych językach.

------------------------------------------------------------------------

# 70. Generated Narrative

Opcjonalna późniejsza warstwa może tworzyć bardziej naturalny tekst.

Musi: - używać tylko danych wejściowych, - nie dodawać nowych faktów, -
nie zmieniać liczb, - nie tworzyć nazw lub motywacji bez danych.

------------------------------------------------------------------------

# 71. Narration Guardrails

Generator narracji nie może pisać: - „mieszkańcy byli przerażeni", jeśli
nie ma modelu nastroju, - „rząd chciał...", jeśli decyzja nie ma takiej
przyczyny, - „firma przewidziała...", jeśli Decision Snapshot tego nie
pokazuje.

------------------------------------------------------------------------

# 72. Factuality Check

Opcjonalny validator: każde pole narracyjne musi wskazywać źródło: -
SimulationFact, - Entity State, - CausalEdge, - DecisionSnapshot.

------------------------------------------------------------------------

# 73. Chronicle i WHY?

Każdy ważny wpis powinien umożliwiać przejście:

`Chronicle Entry → WHY?`

Chronicle nie przechowuje osobnego wymyślonego explanation.

------------------------------------------------------------------------

# 74. Chronicle i Butterfly Effect

Jeśli wydarzenie ma `architectInfluence > threshold`, wpis może pokazać:

**Powiązane z Twoją interwencją**

i umożliwić otwarcie causal path.

------------------------------------------------------------------------

# 75. Architect Chronicle

Interwencje Architekta tworzą osobną oś: - intervention created, -
immediate effects, - major consequences, - unintended consequences, -
long-term legacy.

------------------------------------------------------------------------

# 76. Architect Legacy

Po dziesięcioleciach można pokazać:

``` text
Interwencja: ujawnienie złoża
Najważniejsze konsekwencje:
- 3 kopalnie
- +X populacji
- rozwój miasta
- nowy szlak handlowy
- późniejszy kryzys
```

Tylko jeśli causal paths to potwierdzają.

------------------------------------------------------------------------

# 77. Unintended Consequence

To konsekwencja: - powiązana przyczynowo z interwencją, - niebędąca jej
bezpośrednim/oczywistym skutkiem.

System nie musi znać „intencji psychologicznej" gracza.

Może klasyfikować przez odległość/typ causal path.

------------------------------------------------------------------------

# 78. Causal Distance

Chronicle może rozróżniać: - direct consequence, - secondary
consequence, - distant legacy.

Na podstawie liczby/siły krawędzi.

------------------------------------------------------------------------

# 79. Historical Anchor

Ważne fakty mogą otrzymać flagę:

`historicalAnchor = true`

Chroni je przed agresywnym pruningiem Causality Engine.

------------------------------------------------------------------------

# 80. Anchor Eligibility

Typowe: - Turning Point, - Historic+ event, - world first, - major
intervention, - settlement stage transition, - major discovery, -
structural collapse.

------------------------------------------------------------------------

# 81. Chronicle a Hierarchical Causal Memory

HOT: - świeże szczegółowe fakty.

WARM: - zagregowane procesy.

PERMANENT: - historyczne anchors i najważniejsze ścieżki.

Chronicle powinien korzystać z tej samej hierarchii, nie budować drugiej
pełnej historii.

------------------------------------------------------------------------

# 82. Historical Compression

Po wielu latach: - 120 miesięcznych wpisów nie musi pozostać jako 120
pozycji, - mogą zostać zagregowane w „dekadę wzrostu".

Źródłowe anchors muszą pozostać wystarczające do WHY?.

------------------------------------------------------------------------

# 83. Compression Safety

Nie kompresować razem wydarzeń: - o różnych głównych przyczynach, - z
przeciwnych trendów, - należących do różnych procesów historycznych.

------------------------------------------------------------------------

# 84. Era

FIRST CAUSE nie używa sztywnych epok technologicznych.

Może jednak retrospektywnie rozpoznawać **historyczne okresy regionu**.

Przykład: - okres rolniczy, - boom górniczy, - industrializacja, -
stagnacja.

To etykiety historii, nie mechaniczne ery.

------------------------------------------------------------------------

# 85. Era Detection

Okres może zostać rozpoznany na podstawie dominujących: - sectors, -
population trends, - technologies, - trade, - settlement structure.

------------------------------------------------------------------------

# 86. Era Naming

Preferować opisowe, mechaniczne nazwy: - „Okres ekspansji górniczej" -
„Dekady stagnacji" - „Wczesna industrializacja"

Nie generować fantazyjnych nazw bez podstawy.

------------------------------------------------------------------------

# 87. Era Boundaries

Granica okresu może wynikać z: - Turning Point, - structural change, -
długotrwałej zmiany trendu.

------------------------------------------------------------------------

# 88. World Periodization

Docelowo można rozpoznawać globalne okresy, ale nie jest to wymagane dla
VS.

------------------------------------------------------------------------

# 89. Historical Comparison

UI może porównywać: - wtedy vs teraz, - przed vs po Turning Point, -
przed vs po interwencji.

------------------------------------------------------------------------

# 90. Before/After Snapshot

Dla Turning Point można zachować agregaty:

``` yaml
before:
  population:
  employment:
  productionStructure:
  trade:
after:
  ...
```

Nie pełny World State.

------------------------------------------------------------------------

# 91. Peak Detection

Chronicle może rozpoznawać: - peak population, - peak production, - peak
extraction, - peak employment.

Najlepiej retrospektywnie po potwierdzeniu spadku.

------------------------------------------------------------------------

# 92. Recovery

Kryzys może mieć etap: - start, - bottom, - recovery, - resolved.

------------------------------------------------------------------------

# 93. Recurrence

Powtarzający się kryzys nie powinien zawsze być traktowany jako równie
nowatorski.

Novelty może spadać.

------------------------------------------------------------------------

# 94. Escalation

Powtarzające się wydarzenie może jednak stać się bardziej istotne, jeśli
kolejna fala ma większą skalę.

------------------------------------------------------------------------

# 95. Event Relationships

Chronicle Entries mogą posiadać:

``` text
caused_by
part_of
followed_by
resolved_by
reversed_by
related_to
```

Relacje są prezentacyjne i muszą bazować na faktach/causal graph.

------------------------------------------------------------------------

# 96. Historical Thread

Powiązane entries mogą tworzyć Thread.

Przykład:

**Historia Black Mountain Iron Boom**

-   odkrycie rudy,
-   pierwsza kopalnia,
-   fala migracji,
-   rozwój miasta,
-   peak extraction,
-   depletion,
-   transformacja.

------------------------------------------------------------------------

# 97. Thread Schema

``` yaml
HistoricalThread:
  id:
  titleKey:
  entityRefs:
  entryRefs:
  rootFactRefs:
  startTick:
  endTick:
  significance:
  status:
```

------------------------------------------------------------------------

# 98. Thread Creation

Thread powstaje, jeśli: - wiele znaczących entries, - wspólny causal
root lub proces, - odpowiednia długość/significance.

------------------------------------------------------------------------

# 99. Thread nie steruje symulacją

To tylko struktura historyczna.

------------------------------------------------------------------------

# 100. Black Mountain Chronicle --- przykład

Możliwa historia:

``` text
Rok 18 — Odkryto złoża żelaza w Black Mountain.
Rok 21 — Powstała pierwsza kopalnia.
Rok 27 — Rosnące zatrudnienie rozpoczęło falę migracji.
Rok 39 — Black Mountain rozwinęło się do miasta.
Rok 61 — Wydobycie osiągnęło szczyt.
Rok 84 — Rosnące koszty wydobycia rozpoczęły kryzys sektora.
Rok 93 — Ostatnia duża kopalnia została zamknięta.
Rok 108 — Region utrzymał przemysł dzięki importowanej rudzie.
```

Każdy wpis musi wynikać z symulacji.

------------------------------------------------------------------------

# 101. Alternatywna historia Black Mountain

Równie poprawna:

``` text
Rok 18 — Odkryto złoże żelaza.
...
Brak dalszego dużego wydarzenia.
```

Jeśli transport uniemożliwia ekonomiczne wydobycie, Kronika nie może
wymuszać boomu.

------------------------------------------------------------------------

# 102. „Niewykorzystana szansa"

Chronicle może opcjonalnie odnotować znaczący kontrast:

> Odkryte złoże przez dziesięciolecia pozostało niewykorzystane.

Tylko jeśli: - discovery było istotne, - trwały brak exploitation jest
mierzalny, - WHY NOT? ma dane.

------------------------------------------------------------------------

# 103. Silence is valid

Brak wpisu jest poprawnym wynikiem.

Chronicle nie ma minimalnej liczby wydarzeń na rok.

------------------------------------------------------------------------

# 104. Chronicle Density

Mierzyć: - entries / 10 lat, - entries / region / 100 lat, - entries by
category, - percentage aggregated.

Nie ustalać sztucznej kwoty wydarzeń.

------------------------------------------------------------------------

# 105. Spam Detection

WARNING: - dziesiątki podobnych wpisów o tej samej zmianie, - ciągłe
„cena wzrosła/spadła", - powtarzające się founding małych firm.

------------------------------------------------------------------------

# 106. Silence Detection

WARNING, nie FAIL: - brak znaczących entries przez bardzo długi czas w
całym świecie.

Wymaga sprawdzenia, czy: - świat faktycznie jest stabilny, - czy progi
są za wysokie.

------------------------------------------------------------------------

# 107. Category Balance

Chronicle nie powinien sztucznie wyrównywać kategorii.

Jeśli historia świata jest gospodarcza, Economy może dominować.

------------------------------------------------------------------------

# 108. Event Ranking

Przy wielu wydarzeniach w tym samym okresie:

sortowanie może uwzględniać: 1. significance, 2. scope, 3. causal
impact, 4. recency.

------------------------------------------------------------------------

# 109. Top Events

UI może oferować: - najważniejsze wydarzenia roku, - dekady, -
stulecia, - całej historii.

------------------------------------------------------------------------

# 110. Event of the Year

To ranking istniejących entries.

Nie specjalny event.

------------------------------------------------------------------------

# 111. Historical Summary

Dla okresu można wygenerować summary z Top Events i Threads.

Nie czytamy wszystkich mikro-faktów.

------------------------------------------------------------------------

# 112. Century Summary

Przykładowa struktura:

``` text
Najważniejsze przemiany
Najważniejsze regiony
Najważniejsze odkrycia
Największe kryzysy
Najważniejsze konsekwencje Architekta
```

------------------------------------------------------------------------

# 113. Summary Factuality

Każde stwierdzenie summary musi wskazywać: - entry, - metric, - causal
path.

------------------------------------------------------------------------

# 114. Historical Significance Update Frequency

Initial: - przy utworzeniu candidate.

Retrospective: - okresowo, - przy dużym descendant event, - przy
zamknięciu Thread, - przed kompresją historyczną.

------------------------------------------------------------------------

# 115. Causal Impact Computation

Nie skanujemy całego grafu dla każdego faktu co tick.

Stosować: - incremental descendant significance, - cached impact, -
propagation only for significant descendants.

------------------------------------------------------------------------

# 116. Significance Propagation

Gdy powstaje ważny descendant: część jego significance może zwiększać
retrospective significance ważnych ancestorów.

Z decay.

------------------------------------------------------------------------

# 117. Anti-Explosion

Nie propagować significance bez końca.

Stosować: - depth limit, - contribution threshold, - causal strength, -
decay, - anchor filtering.

------------------------------------------------------------------------

# 118. Architect Influence ≠ Significance

Wydarzenie może być: - bardzo ważne historycznie, - całkowicie
niezwiązane z graczem.

I odwrotnie: - bezpośredni skutek interwencji może być mało historyczny.

------------------------------------------------------------------------

# 119. Novelty Registry

System przechowuje informacje typu: - firstInSettlement, -
firstInRegion, - firstInContinent, - firstInWorld.

Nie wymaga skanowania pełnej historii za każdym razem.

------------------------------------------------------------------------

# 120. Milestone Registry

Przechowuje osiągnięte progi, aby nie emitować ich wielokrotnie.

------------------------------------------------------------------------

# 121. Active Process Registry

Śledzi: - boom, - bust, - shortage, - migration wave, -
transformation, - recovery.

------------------------------------------------------------------------

# 122. Historical Thread Registry

Śledzi aktywne i zamknięte Threads.

------------------------------------------------------------------------

# 123. Chronicle Pipeline

Rekomendowana kolejność po Causality Engine:

``` text
1. Collect eligible Simulation Facts
2. Calculate initial significance
3. Update active processes
4. Detect milestones/firsts
5. Aggregate candidates
6. Recalculate contextual significance
7. Rank/filter by sensitivity
8. Create/update Chronicle Entries
9. Update Historical Threads
10. Mark historical anchors
11. Queue retrospective significance updates
```

------------------------------------------------------------------------

# 124. Tick Pipeline Integration

Chronicle jest warstwą po faktycznej symulacji i Causality Engine.

Nie może wpływać na decyzje firm ani ceny w tym samym ticku.

------------------------------------------------------------------------

# 125. Chronicle Event Bus

Systemy nie wysyłają gotowych zdań.

Wysyłają: - Simulation Facts, - structured metrics, - CausalContext.

Chronicle interpretuje tylko znaczenie prezentacyjne.

------------------------------------------------------------------------

# 126. Event Type Definition

Data-driven:

``` yaml
eventType:
  id:
  category:
  baseSignificance:
  candidateThreshold:
  aggregationPolicy:
  noveltyPolicy:
  durationPolicy:
  templateKeys:
  anchorPolicy:
```

------------------------------------------------------------------------

# 127. Brak hardcode per region

Nie:

``` text
if region == BlackMountain:
   create "Iron Boom"
```

Wzorzec boomu musi działać dla każdego regionu.

------------------------------------------------------------------------

# 128. Brak hardcode per discovery

Nowe discovery powinno automatycznie korzystać z ogólnych zasad
significance i novelty.

------------------------------------------------------------------------

# 129. Chronicle Test --- Source Integrity

Każdy entry: - posiada istniejący primaryFactRef, - supporting refs są
poprawne, - entity refs istnieją.

P0.

------------------------------------------------------------------------

# 130. Chronicle Test --- No Fabrication

Wygenerowany tekst nie może zawierać informacji bez źródła.

P0 dla warstwy factual.

------------------------------------------------------------------------

# 131. Chronicle Test --- Aggregation

12 podobnych miesięcznych faktów: - powinno móc utworzyć jeden trend
entry.

------------------------------------------------------------------------

# 132. Chronicle Test --- No False Aggregation

Dwa niezależne shortage: - nie są łączone bez wspólnego procesu.

------------------------------------------------------------------------

# 133. Chronicle Test --- Sensitivity

Concise/Standard/Detailed: - zmieniają widoczne entries, - World State
hash pozostaje identyczny.

------------------------------------------------------------------------

# 134. Chronicle Test --- Retrospective Significance

Wczesny mały event staje się rootem dużego procesu.

Expected: - retrospective significance ↑.

------------------------------------------------------------------------

# 135. Chronicle Test --- Historical Anchor

Po causal pruning: - Historic event nadal posiada wystarczające dane do
WHY?.

------------------------------------------------------------------------

# 136. Chronicle Test --- Localization

Ten sam Entry: - może zostać wyrenderowany po polsku i angielsku, -
refs/data pozostają identyczne.

------------------------------------------------------------------------

# 137. Chronicle Test --- Save/Load

Po save/load: - entries, - threads, - anchors, - active processes

zachowują stan.

------------------------------------------------------------------------

# 138. Chronicle Test --- Determinism

Ten sam seed/config: - ten sam zestaw Chronicle Entries.

------------------------------------------------------------------------

# 139. Chronicle Test --- No Forced Drama

Stabilny świat: - może mieć mało wpisów.

System nie tworzy sztucznych wydarzeń.

------------------------------------------------------------------------

# 140. Chronicle Test --- Black Mountain

Sprawdzić: - discovery, - founding, - migration, - settlement, -
depletion, - transition

tylko jeśli faktycznie wystąpiły.

------------------------------------------------------------------------

# 141. Chronicle Test --- WHY?

Kliknięcie WHY?: - prowadzi do causal graph, - nie do tekstu
wygenerowanego przez Chronicle jako źródła.

------------------------------------------------------------------------

# 142. Chronicle Test --- Butterfly

Wpis oznaczony jako konsekwencja Architekta: - musi posiadać causal path
do intervention root.

------------------------------------------------------------------------

# 143. Chronicle Test --- 200 lat

Po 2400 tickach: - brak spam explosion, - ważne events zachowane, -
Threads działają, - Chronicle jest czytelna.

------------------------------------------------------------------------

# 144. Chronicle Test --- 1000 lat

Docelowo: - historyczna pamięć nie rośnie liniowo bez ograniczeń, -
najważniejsze wydarzenia pierwszych stuleci nadal są dostępne.

------------------------------------------------------------------------

# 145. Performance Metrics

Mierzyć: - candidates/tick, - entries/tick, - active processes, -
threads, - significance update cost, - Chronicle memory, - query
latency.

------------------------------------------------------------------------

# 146. Performance Strategy

Stosować: - incremental scoring, - aggregation windows, - active
registries, - retrospective updates tylko dla ważnych facts, -
historical compression.

------------------------------------------------------------------------

# 147. Chronicle Debug Inspector

Powinien pokazywać:

``` text
FACT
INITIAL SIGNIFICANCE
COMPONENT SCORES
CONTEXTUAL SIGNIFICANCE
RETROSPECTIVE SIGNIFICANCE
CANDIDATE STATUS
AGGREGATION KEY
ENTRY REF
THREAD REF
ANCHOR STATUS
FILTER REASON
```

------------------------------------------------------------------------

# 148. Dlaczego fakt nie trafił do Kroniki?

Debug powinien odpowiedzieć: - significance below threshold, -
aggregated into entry X, - duplicate, - insufficient duration, -
local-only, - filtered by sensitivity.

------------------------------------------------------------------------

# 149. Chronicle Data Audit

Raport: - facts evaluated, - candidates, - entries, - aggregated
facts, - rejected candidates, - anchors, - threads.

------------------------------------------------------------------------

# 150. Vertical Slice Scope

VS musi obsługiwać: - Economy, - Company, - Population, - Migration, -
Settlement, - Resource, - Technology, - Architect.

Nie wymaga: - wojny, - pełnej polityki, - zaawansowanej historii państw.

------------------------------------------------------------------------

# 151. VS Event Types

Minimum rekomendowane: 1. resource_discovered 2.
resource_depletion_milestone 3. company_founded 4.
company_major_expansion 5. company_closed 6. shortage_started 7.
shortage_resolved 8. migration_wave 9. settlement_stage_changed 10.
discovery_occurred 11. technology_adoption_wave 12. trade_route_emerged
13. regional_boom 14. regional_bust 15. intervention_major_consequence

------------------------------------------------------------------------

# 152. VS Historical Threads

Minimum: - Resource Boom/Bust, - Settlement Growth, - Technology
Transformation, - Architect Legacy.

------------------------------------------------------------------------

# 153. VS UI Requirements

Chronicle view powinien umożliwiać: - chronologiczną listę, -
filtrowanie kategorii, - Concise/Standard/Detailed, - entity filter, -
WHY?, - oznaczenie wpływu Architekta, - przejście do encji.

------------------------------------------------------------------------

# 154. VS Entry Card

Minimalnie: - data/rok, - tytuł, - 1--3 zdania, - category, -
significance indicator, - affected entity, - WHY?, - Architect marker
jeśli dotyczy.

------------------------------------------------------------------------

# 155. Anti-AI UI

Chronicle ma wyglądać jak narzędzie analityczno-historyczne, nie feed
wygenerowanych „epickich" opowieści.

Preferować: - czytelność, - konkret, - liczby, - zależności, - oszczędną
narrację.

------------------------------------------------------------------------

# 156. Ton narracji

Domyślnie: - rzeczowy, - historyczny, - neutralny, - zwięzły.

Nie: - przesadnie dramatyczny, - marketingowy, - poetycki, - „AI
storytelling".

------------------------------------------------------------------------

# 157. Przykład dobrego wpisu

> **Pierwsza kopalnia żelaza w Black Mountain**\
> Po odkryciu lokalnego złoża i kilku latach rosnącego popytu na żelazo
> powstała pierwsza kopalnia w regionie. Dostęp do złoża i oczekiwana
> rentowność przeważyły nad wysokimi kosztami transportu.

------------------------------------------------------------------------

# 158. Przykład złego wpisu

> Black Mountain wkroczyło w złotą erę przemysłu, gdy odważni
> przedsiębiorcy ruszyli ku bogactwu ukrytemu w górach.

Problem: - „złota era" może nie istnieć, - „odważni" nie wynika z
modelu, - „ruszyli ku bogactwu" jest interpretacją.

------------------------------------------------------------------------

# 159. Quantitative Context

Jeśli pomaga: - „populacja wzrosła o 34% w ciągu dekady", - „wydobycie
spadło o 61% od szczytu".

Liczby muszą pochodzić z danych.

------------------------------------------------------------------------

# 160. Precision Policy

Nie pokazywać fałszywej precyzji.

Jeżeli dane są agregowane, UI może używać: - około, - ponad, - niemal,

zgodnie z polityką prezentacji.

------------------------------------------------------------------------

# 161. Historical Significance nie jest oceną moralną

Wysoki score oznacza: - duży wpływ historyczny,

nie: - wydarzenie dobre, - wydarzenie złe.

------------------------------------------------------------------------

# 162. Positive / Negative / Mixed Outcome

Opcjonalna klasyfikacja może dotyczyć skutków: - positive, - negative, -
mixed, - neutral.

Musi być oparta na konkretnych metrykach, a nie narracyjnym osądzie.

------------------------------------------------------------------------

# 163. Mixed Consequences

FIRST CAUSE powinien szczególnie wspierać mieszane skutki.

Przykład: - kopalnia zwiększa employment, - ale podnosi housing cost i
degraduje środowisko.

Chronicle może pokazać obie strony.

------------------------------------------------------------------------

# 164. Counterfactuals

Chronicle v0.1 nie twierdzi: \> „bez tego wydarzenia miasto nigdy by nie
powstało".

To wymagałoby symulacji kontrfaktycznej.

Może powiedzieć: \> „wydarzenie było jedną z głównych przyczyn rozwoju
miasta".

------------------------------------------------------------------------

# 165. Causal Language Policy

Dozwolone: - przyczyniło się, - było główną przyczyną, - zwiększyło
presję, - umożliwiło, - ograniczyło.

Unikać: - na pewno spowodowałoby, - było jedyną możliwą przyczyną,

chyba że model rzeczywiście to potwierdza.

------------------------------------------------------------------------

# 166. Confidence

Causal Edge może posiadać confidence.

Narracja może dopasować język: - wysokie confidence → „było główną
przyczyną", - niższe → „przyczyniło się".

------------------------------------------------------------------------

# 167. Historical Ranking per Entity

Każda encja może mieć: - Top 5 events, - Top 10 events, - full
Chronicle.

------------------------------------------------------------------------

# 168. Lifetime Summary

Dla zamkniętej firmy: - founded, - peak, - major contributions, -
closure reason.

Dla zanikłej osady: - emergence, - peak, - decline.

------------------------------------------------------------------------

# 169. Legacy

Legacy to trwałe konsekwencje po zakończeniu encji/procesu.

Przykład: kopalnia zamknięta, ale: - miasto pozostaje, - infrastruktura
pozostaje, - skills pozostają.

------------------------------------------------------------------------

# 170. Legacy Score

Może bazować na: - persistent descendants, - infrastructure, -
population, - institutions, - technology, - long-lived causal effects.

------------------------------------------------------------------------

# 171. Historical Importance of Failure

Nieudane projekty/decyzje mogą być historycznie ważne, jeśli ich skutki
były duże.

Chronicle nie powinien zapisywać tylko sukcesów.

------------------------------------------------------------------------

# 172. Historical Importance of Non-Adoption

Długotrwałe odrzucenie ważnej technologii może być historyczne, jeśli
prowadzi do utraty konkurencyjności.

Wymaga Decision Snapshots / adoption data.

------------------------------------------------------------------------

# 173. Historical Importance of Absence

„Brak" jest trudniejszy do narracji.

Można go raportować tylko wtedy, gdy istnieje: - oczekiwana/realna
opportunity, - mierzalna bariera, - długi okres.

------------------------------------------------------------------------

# 174. Regional Specialization

Chronicle może wykryć, że region stał się ważnym producentem
dobra/sektora.

Wymaga udziału: - w regionalnej gospodarce, - lub szerszym rynku.

------------------------------------------------------------------------

# 175. Specialization Loss

Analogicznie: region może utracić historyczną specjalizację.

------------------------------------------------------------------------

# 176. Trade Hub Significance

Trade Hub staje się historyczny, gdy: - przepływy są trwałe, - wpływają
na wiele regionów, - tworzą lokalne konsekwencje.

------------------------------------------------------------------------

# 177. Population Milestones

Nie każdy próg liczbowy jest interesujący.

Milestones powinny zależeć od: - settlement stage, - względnej skali, -
historycznego rekordu.

------------------------------------------------------------------------

# 178. Migration Wave

Fala migracji wymaga: - ponadnormalnego przepływu, - persistence, -
wspólnego destination/source pattern.

------------------------------------------------------------------------

# 179. Migration Cause Summary

Chronicle może pokazać: - jobs, - wages, - safety, - services, - housing
constraints,

zgodnie z CausalContext.

------------------------------------------------------------------------

# 180. Shortage Chronicle

Shortage powinien mieć: - start, - peak severity, - duration, - affected
population, - resolution.

------------------------------------------------------------------------

# 181. Shortage Resolution

Resolution może wynikać z: - production increase, - import, -
substitution, - demand reduction.

Chronicle powinien wskazać rzeczywisty mechanizm.

------------------------------------------------------------------------

# 182. Environmental History

VS może ograniczyć zakres, ale struktura wspiera: - resource
depletion, - environmental degradation, - recovery, - environmental
shock.

------------------------------------------------------------------------

# 183. State History --- przyszłość

Po aktywacji państw: - founding, - territorial changes, - policy
shifts, - fiscal crises, - institutional transformation, - war.

Chronicle framework nie wymaga przebudowy.

------------------------------------------------------------------------

# 184. Conflict History --- przyszłość

Wojny powinny być procesami: - outbreak, - major phases, -
territorial/economic consequences, - resolution, - legacy.

Nie pojedynczym spamem bitew.

------------------------------------------------------------------------

# 185. Historical Characters --- przyszłość

Postać trafia do Kroniki tylko, jeśli jej decyzje mają odpowiedni causal
impact.

Nie promujemy NPC tylko dlatego, że istnieje.

------------------------------------------------------------------------

# 186. Content Expansion

Dodanie nowego event type powinno wymagać głównie: -
EventTypeDefinition, - significance policy, - aggregation policy, -
templates.

Nie nowej architektury Chronicle.

------------------------------------------------------------------------

# 187. Data-driven Thresholds

W configu: - significance weights, - thresholds, - aggregation
windows, - novelty bonuses, - decay, - anchor thresholds.

------------------------------------------------------------------------

# 188. Suggested Significance Components

``` yaml
significance:
  magnitude:
  duration:
  populationAffected:
  geographicScope:
  novelty:
  causalImpact:
  contextualImportance:
```

------------------------------------------------------------------------

# 189. Suggested Weighted Model

Konceptualnie:

`S = wM*M + wD*D + wP*P + wG*G + wN*N + wC*C + wX*X`

Następnie: - clamp 0--100, - event baseline, - contextual modifiers.

Wagi są tuningiem.

------------------------------------------------------------------------

# 190. Dlaczego nie czyste mnożenie?

Czyste mnożenie może: - wyzerować ważny event przez jeden niski
komponent, - eksplodować przez duże wartości.

Dlatego oryginalna formuła pozostaje modelem konceptualnym, a
implementacja powinna używać wartości normalizowanych.

------------------------------------------------------------------------

# 191. Significance Calibration Dataset

Podczas tuningu stworzyć ręcznie oceniony zestaw np. 50--100 wydarzeń: -
oczekiwane Trace/Minor/Notable/Major/Historic.

Porównać z wynikiem algorytmu.

------------------------------------------------------------------------

# 192. Chronicle Golden Scenarios

Utrzymywać: - Black Mountain, - Food Valley, - Trade Corridor, -
Technology Divergence, - Urban Pressure.

Nie jako dokładne tekstowe snapshoty całej historii, lecz jako
oczekiwane własności.

------------------------------------------------------------------------

# 193. Chronicle Regression

Każdy bug typu: - spam, - brak ważnego wpisu, - false cause, -
duplicate, - broken thread

otrzymuje regression test.

------------------------------------------------------------------------

# 194. Save Data

Save powinien przechowywać: - Chronicle Entries, - Historical Threads, -
Novelty Registry, - Milestone Registry, - Active Process Registry, -
historical anchors, - significance state.

------------------------------------------------------------------------

# 195. Rebuildability

Część danych prezentacyjnych może być odbudowywalna z permanent history.

Nie zakładać jednak, że pełną Kronikę zawsze można tanio przeliczyć od
początku 1000-letniego świata.

------------------------------------------------------------------------

# 196. Versioning

Chronicle Entry powinien znać: - schema version, - template version lub
dane pozwalające na migrację.

------------------------------------------------------------------------

# 197. Localization Versioning

Zmiana tłumaczenia nie zmienia Simulation Fact ani significance.

------------------------------------------------------------------------

# 198. UI --- Timeline

Podstawowy widok: - pionowa lub pozioma chronologia, - grupowanie
lat/dekad, - filtrowanie.

Nie wymaga klasycznej mapy.

------------------------------------------------------------------------

# 199. UI --- Historical Threads

Gracz może otworzyć: **Boom żelazny Black Mountain**

i zobaczyć kluczowe etapy procesu.

------------------------------------------------------------------------

# 200. UI --- Why this mattered

Opcjonalna sekcja:

**Dlaczego to było ważne?**

Pokazuje: - magnitude, - affected population, - descendants, - turning
point status.

Nie mylić z: **Dlaczego to się wydarzyło?**

------------------------------------------------------------------------

# 201. Dwa różne pytania

### WHY DID THIS HAPPEN?

Causality Engine.

### WHY DID THIS MATTER?

Historical Significance.

To rozróżnienie jest kanoniczne.

------------------------------------------------------------------------

# 202. UI --- Architect Legacy

Osobny filtr może pokazywać: - wszystkie major consequences
interwencji, - ich odległość przyczynową, - significance.

------------------------------------------------------------------------

# 203. UI --- Comparison

Przy Turning Point: - „5 lat przed" - „5 lat po"

dla kluczowych metryk.

------------------------------------------------------------------------

# 204. UI --- No fake newspaper requirement

Chronicle nie musi udawać gazety.

Dla FIRST CAUSE lepiej pasuje: - analityczna kronika, - historyczny
rejestr, - timeline, - causal links.

------------------------------------------------------------------------

# 205. Chronicle API

Przykładowe zapytania:

``` text
getChronicle(scope, filters, sensitivity)
getEntityHistory(entityId)
getTopEvents(period, scope)
getHistoricalThread(threadId)
getTurningPoints(entityId)
getArchitectLegacy(interventionId)
getWhyItMattered(entryId)
```

------------------------------------------------------------------------

# 206. Separation of Concerns

``` text
Simulation
= co się wydarzyło

AI
= dlaczego aktor wybrał działanie

Causality
= dlaczego wystąpił skutek

Historical Significance
= jak ważny był skutek

Chronicle
= co i jak pokazujemy graczowi
```

------------------------------------------------------------------------

# 207. Kolejność implementacji

## CH-01

Event Type Definitions.

## CH-02

Initial Significance.

## CH-03

Candidate Pipeline.

## CH-04

Aggregation.

## CH-05

Chronicle Entry storage.

## CH-06

Sensitivity filters.

## CH-07

Entity/Region Chronicle.

## CH-08

Historical Threads.

## CH-09

Retrospective Significance.

## CH-10

Turning Points.

## CH-11

Architect Legacy.

## CH-12

Historical compression.

## CH-13

Localization/templates.

## CH-14

UI/API integration.

------------------------------------------------------------------------

# 208. Definition of Done --- Significance

Gotowe dla VS, jeśli: - każdy candidate ma score, - score wynika z
danych, - lokalny kontekst jest uwzględniony, - novelty działa, - causal
impact działa, - retrospective update działa, - Turning Point może
zostać wykryty.

------------------------------------------------------------------------

# 209. Definition of Done --- Chronicle

Gotowe dla VS, jeśli: - entries powstają wyłącznie z facts, -
aggregation ogranicza spam, - Concise/Standard/Detailed działają, -
entity history działa, - WHY? działa z wpisu, - Architect marker jest
causal, - templates są lokalizowalne, - save/load zachowuje historię, -
200-letnia Kronika pozostaje czytelna.

------------------------------------------------------------------------

# 210. Definition of Done --- Historical Memory

Gotowe, jeśli: - Historic anchors przetrwają pruning, - Threads
zachowują najważniejsze procesy, - stare mikro-zdarzenia mogą być
kompresowane, - WHY? dla ważnych dawnych wydarzeń nadal działa.

------------------------------------------------------------------------

# 211. Kanoniczne ustalenia v0.1

-   Chronicle nie tworzy Simulation Facts.
-   Chronicle nie wpływa na World State.
-   Simulation Fact jest źródłem prawdy.
-   Chronicle Entry jest warstwą prezentacji.
-   Historical Significance ma skalę 0--100.
-   Znaczenie jest kontekstowe i może rosnąć retrospektywnie.
-   Causal Impact jest kluczowym składnikiem.
-   Candidate nie musi zostać Entry.
-   Agregacja jest obowiązkowa dla powtarzalnych mikro-zdarzeń.
-   Nie ma minimalnej liczby wydarzeń.
-   Brak wydarzeń jest legalny.
-   Concise/Standard/Detailed zmieniają tylko prezentację.
-   WHY? pochodzi z Causality Engine.
-   WHY DID THIS MATTER? pochodzi z Historical Significance.
-   Turning Points są wykrywane, nie skryptowane.
-   Historyczne okresy są retrospektywnymi etykietami, nie erami
    mechanicznymi.
-   Chronicle korzysta z Hierarchical Causal Memory.
-   Historic events mogą stać się permanent anchors.
-   Architect Influence i Historical Significance są osobnymi wymiarami.
-   Template-first jest podstawą.
-   LLM nie jest wymagany.
-   Narracja nie może wymyślać faktów.
-   Black Mountain nie ma zaprogramowanej historii.

------------------------------------------------------------------------

# 212. Otwarte decyzje do tuningu

Do ustalenia po pierwszych działających symulacjach: - dokładne wagi
Historical Significance, - progi kategorii, - progi
Concise/Standard/Detailed, - długości aggregation windows, - definicje
boom/bust, - threshold Turning Point, - retrospective propagation
decay, - anchor threshold, - liczba widocznych wydarzeń w UI, - poziom
ilościowych danych w tekście, - zasady rozpoznawania okresów
historycznych.

Nie powinny blokować implementacji architektury.

------------------------------------------------------------------------

# 213. Następny dokument

Po Chronicle & Historical Significance Spec kolejnym dokumentem w
ustalonej kolejności powinien być:

**`FIRST-CAUSE-Architect-Intervention-Influence-Spec-v0.1.md`**

Powinien dokładnie zdefiniować: - Influence 0--100, - kategorie
interwencji, - koszt interwencji, - magnitude, - duration, - scope, -
naturalness, - cooldown/ograniczenia, - Root Facts, - propagation
Architect Influence, - direct/indirect/unintended consequences, -
eksperymenty, - zasady niedeterminowania rezultatu przez Architekta.

------------------------------------------------------------------------

# 214. Kryterium końcowe

Chronicle System spełnia swoją rolę, jeśli po 200 latach gracz może
otworzyć historię Black Mountain i zobaczyć nie tysiące miesięcznych
zmian, lecz kilka lub kilkanaście rzeczywiście ważnych etapów.

Może następnie zadać dwa różne pytania:

> **Dlaczego to się wydarzyło?**

i otrzymać odpowiedź z Causality Engine.

Oraz:

> **Dlaczego to było historycznie ważne?**

i zobaczyć skalę, czas trwania, dotkniętą populację, zasięg oraz
późniejsze konsekwencje.

Kronika nie jest autorem świata.

Jest jego pamięcią.

> **Symulacja tworzy fakty. Causality Engine łączy przyczyny. Historical
> Significance rozpoznaje wagę. Chronicle zachowuje historię.**

**KONIEC --- FIRST CAUSE Chronicle & Historical Significance Spec v0.1**
