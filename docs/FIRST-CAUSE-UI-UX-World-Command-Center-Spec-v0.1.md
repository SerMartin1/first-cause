# FIRST CAUSE --- UI/UX & World Command Center Spec v0.1

**Status:** wersja robocza / kanoniczna specyfikacja interfejsu
użytkownika\
**Projekt:** FIRST CAUSE\
**Wersja dokumentu:** 0.1\
**Rola:** zdefiniowanie architektury informacji, głównego ekranu World
Command Center, Living Atlas / World Network, widoków encji, Chronicle,
WHY?, Butterfly Effect, Architect Panel oraz zasad prezentacji złożonej
symulacji w sposób prosty, analityczny i „anti-AI".

**Dokumenty powiązane:** -
`FIRST-CAUSE-koncepcja-architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` -
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` (brak w repo; zob. Canonical Decisions §199) -
`FIRST-CAUSE-Entity-Data-Model-v0.1.md` -
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` -
`FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` -
`FIRST-CAUSE-AI-Decision-Model-v0.1.md` -
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` -
`FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md` -
`FIRST-CAUSE-Architect-Intervention-Influence-Spec-v0.1.md`

------------------------------------------------------------------------

# 0. Cel dokumentu

FIRST CAUSE symuluje świat o znacznie większej złożoności niż gracz
powinien widzieć jednocześnie.

UI nie może być kopią World State.

Musi odpowiadać na pytania:

1.  Co dzieje się teraz?
2.  Co się zmieniło?
3.  Gdzie dzieje się coś ważnego?
4.  Dlaczego to się wydarzyło?
5.  Co może wymagać mojej uwagi?
6.  Co stanie się, jeśli zmienię warunek?
7.  Jakie były długoterminowe skutki moich interwencji?
8.  Jak przejść od świata do regionu, osady, firmy, rynku lub
    technologii bez zgubienia kontekstu?

Fundamentalna zasada:

> **UI nie pokazuje wszystkiego. UI pokazuje właściwy poziom informacji
> we właściwym momencie.**

------------------------------------------------------------------------

# 1. Główna filozofia UI

FIRST CAUSE jest: - symulatorem świata, - narzędziem obserwacji, -
laboratorium przyczynowości, - generatorem emergentnej historii.

UI powinien przypominać: - analityczne centrum obserwacji, - atlas
żywego świata, - historyczne archiwum, - laboratorium eksperymentów.

Nie powinien przypominać: - klasycznego city buildera, - dashboardu
SaaS, - mobilnej gry F2P, - „AI dashboardu" z dziesiątkami kolorowych
kart, - mapy strategicznej będącej jedynym źródłem informacji.

------------------------------------------------------------------------

# 2. Kanoniczna hierarchia informacji

``` text
WORLD
  ↓
CONTINENT
  ↓
REGION
  ↓
SETTLEMENT
  ↓
ORGANIZATION / COMPANY
```

Równolegle:

``` text
RESOURCE → PRODUCTION → GOODS → MARKET → TRADE → CONSUMPTION
```

oraz:

``` text
KNOWLEDGE → DISCOVERY → AVAILABILITY → ADOPTION → ACCESS
```

oraz:

``` text
SIMULATION FACT → CAUSAL CHAIN → HISTORICAL SIGNIFICANCE → CHRONICLE
```

------------------------------------------------------------------------

# 3. Region jako główna jednostka UI

Region jest główną jednostką obliczeniową i powinien być także
podstawową jednostką nawigacji.

Większość informacji świata powinna dać się sprowadzić do: - regionu, -
trendu między regionami, - encji znajdującej się w regionie.

------------------------------------------------------------------------

# 4. Text-first

Kanoniczna proporcja kierunkowa:

-   około 70% tekst / dane / historia / analiza,
-   około 30% abstrakcyjna wizualizacja świata i relacji.

Nie jest to sztywna reguła layoutu, lecz kierunek projektu.

------------------------------------------------------------------------

# 5. Brak klasycznej mapy jako fundamentu

Vertical Slice nie wymaga: - realistycznej mapy geograficznej, -
renderowania terenu, - jednostek chodzących po świecie, - mapy
politycznej w stylu grand strategy.

Podstawą jest **Living Atlas / World Network**.

------------------------------------------------------------------------

# 6. Living Atlas

Living Atlas jest abstrakcyjną reprezentacją regionów i ich połączeń.

Pokazuje: - regiony, - sąsiedztwo, - transport, - przepływy, -
znaczenie, - problemy, - zmiany.

Nie udaje fizycznej mapy, jeśli dane jej nie wymagają.

------------------------------------------------------------------------

# 7. World Network

Regiony mogą być przedstawione jako węzły.

Połączenia reprezentują: - dostępność transportową, - handel, -
Effective Distance, - przepustowość, - zakłócenia.

------------------------------------------------------------------------

# 8. UI nie jest źródłem prawdy

UI korzysta z Read Models.

Nie czyta i nie mutuje bezpośrednio całego World State.

------------------------------------------------------------------------

# 9. Read Models

Kanoniczne: - WorldOverviewView - RegionDetailView -
SettlementDetailView - MarketView - CompanyView - TechnologyView -
ChronicleView - WhyExplanationView - ArchitectInterventionView

Rozszerzenia: - WorldNetworkView - TradeFlowView - ButterflyEffectView -
HistoricalThreadView - SimulationStatusView

------------------------------------------------------------------------

# 10. Commands

UI może wysyłać wyłącznie kontrolowane Commands.

Przykłady: - PauseSimulationCommand - SetSimulationSpeedCommand -
CreateArchitectInterventionCommand - CancelArchitectInterventionCommand

UI nie może: `region.population = 5000`.

------------------------------------------------------------------------

# 11. Główna nawigacja

Rekomendowane główne sekcje:

1.  World
2.  Economy
3.  Technology
4.  Chronicle
5.  Architect

Nie tworzyć kilkunastu równorzędnych zakładek.

------------------------------------------------------------------------

# 12. World Command Center

World Command Center jest ekranem startowym i głównym miejscem
obserwacji.

Powinien odpowiadać przede wszystkim:

> **Co w świecie jest teraz najważniejsze?**

------------------------------------------------------------------------

# 13. World Command Center --- struktura

Rekomendowany układ desktop 1920×1080:

``` text
┌─────────────────────────────────────────────────────────────────────┐
│ WORLD / DATE / SPEED / INFLUENCE / SEED              SIM CONTROLS  │
├───────────────┬─────────────────────────────────────┬───────────────┤
│ WORLD STATUS  │                                     │ IMPORTANT NOW │
│               │        LIVING ATLAS / NETWORK       │               │
│ key metrics   │                                     │ events        │
│ trends        │                                     │ changes       │
│ warnings      │                                     │ opportunities │
├───────────────┴─────────────────────────────────────┴───────────────┤
│ RECENT HISTORY / CAUSAL THREAD / ARCHITECT LEGACY                  │
└─────────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 14. Top Bar

Stałe elementy: - World Name, - Current Date, - Current Tick opcjonalnie
debug, - simulation speed, - Pause, - Influence, - aktywna interwencja,
jeśli istnieje, - seed w trybie eksperymentalnym/debug.

------------------------------------------------------------------------

# 15. Simulation Controls

Minimum: - Pause - ×1 - ×2 - ×4 - ×10 - ×100

×100 nie pomija ticków.

Może ograniczać częstotliwość odświeżania UI.

------------------------------------------------------------------------

# 16. Speed UX

Zmiana prędkości musi być natychmiast czytelna.

Nie używać animacji utrudniających obserwację szybkiej symulacji.

------------------------------------------------------------------------

# 17. Pause UX

Pause powinien być łatwo dostępny zawsze.

Gracz często: - zauważa zmianę, - zatrzymuje czas, - analizuje WHY?, -
wykonuje interwencję.

------------------------------------------------------------------------

# 18. World Status

Lewy panel nie powinien być ścianą statystyk.

Pokazuje 5--8 kluczowych agregatów.

Przykład: - Population - Employment - Needs Satisfaction - Active
Companies - Active Trade Flows - Knowledge Progress - Active Shortages -
Settlements by Stage

------------------------------------------------------------------------

# 19. Trend zamiast samej liczby

Preferowane:

`Population 214 → +3.2% / 10y`

zamiast: `Population: 214`.

------------------------------------------------------------------------

# 20. Time Window

Dla trendów użytkownik może wybrać: - 1 rok, - 5 lat, - 10 lat, - 25
lat, - 50 lat.

VS może zacząć od 1/10/50.

------------------------------------------------------------------------

# 21. Important Now

Prawy panel pokazuje rzeczy wymagające uwagi.

Źródła: - Chronicle candidates o wysokim significance, - nowe
shortages, - major company closures, - settlement changes, -
discoveries, - resource depletion, - major migration waves, - ważne
skutki interwencji.

------------------------------------------------------------------------

# 22. Important Now ≠ Chronicle

Important Now jest operacyjnym skrótem.

Chronicle jest pamięcią historyczną.

------------------------------------------------------------------------

# 23. Priorytety Important Now

Sortowanie: 1. required attention --- jeśli w przyszłości istnieje, 2.
major change, 3. architect consequence, 4. crisis, 5. opportunity, 6.
discovery, 7. historical event.

------------------------------------------------------------------------

# 24. Bez sztucznego alarmizmu

Nie używać czerwonego alertu dla każdej zmiany.

Kolor/akcent ma kodować znaczenie, nie emocje.

------------------------------------------------------------------------

# 25. Living Atlas --- podstawowy widok

Centralny obszar: - region nodes, - connection lines, - selected
region, - optional trade overlays.

Każdy region musi być możliwy do wybrania.

------------------------------------------------------------------------

# 26. Region Node

Minimalne dane: - nazwa, - population, - settlement stage lub największa
osada, - economic specialization, - status/trend indicator.

------------------------------------------------------------------------

# 27. Node Size

Rozmiar może reprezentować: - population, - economic scale, - settlement
importance.

Musi być przełączalny lub jednoznacznie opisany.

------------------------------------------------------------------------

# 28. Node State

Akcent może oznaczać: - boom, - shortage, - migration wave, - major
discovery, - resource decline.

Nie kodować wielu znaczeń tym samym sygnałem.

------------------------------------------------------------------------

# 29. Connections

Grubość: - capacity lub flow.

Styl: - transport mode, - disruption.

Nie próbować jednocześnie kodować 5 parametrów.

------------------------------------------------------------------------

# 30. Overlay System

Living Atlas może mieć tryby: - Population - Economy - Trade -
Resources - Technology - Needs - Migration - Architect Influence

------------------------------------------------------------------------

# 31. Jeden overlay na raz

Dla czytelności domyślnie jeden główny overlay.

Opcjonalnie jeden pomocniczy.

------------------------------------------------------------------------

# 32. Population Overlay

Pokazuje: - population scale, - growth/decline, - migration direction.

------------------------------------------------------------------------

# 33. Economy Overlay

Pokazuje: - output/economic scale, - specialization, - boom/bust.

------------------------------------------------------------------------

# 34. Trade Overlay

Pokazuje: - najważniejsze przepływy, - trade hubs, - bottlenecks.

------------------------------------------------------------------------

# 35. Resource Overlay

Pokazuje: - discovered deposits, - extraction, - depletion pressure.

Nie ujawnia AI zasobów, których świat nie zna, ale gracz jako Observer
może mieć osobny tryb zależny od zasad gry.

------------------------------------------------------------------------

# 36. Technology Overlay

Pokazuje: - knowledge level, - discoveries, - adoption.

------------------------------------------------------------------------

# 37. Needs Overlay

Pokazuje: - needs satisfaction, - shortages, - service access.

------------------------------------------------------------------------

# 38. Architect Influence Overlay

Pokazuje tylko znaczące causal descendants aktywnej/wybranej
interwencji.

Nie koloruje całego świata TRACE attribution.

------------------------------------------------------------------------

# 39. Region Selection

Kliknięcie regionu: - nie musi natychmiast zmieniać całego ekranu, -
otwiera contextual inspector.

Drugi krok: `Open Region`.

------------------------------------------------------------------------

# 40. Contextual Inspector

Szybki podgląd: - population, - economy, - needs, - main settlements, -
key resources, - current events, - top causes of recent change.

------------------------------------------------------------------------

# 41. Region Detail

Pełny Region Detail powinien odpowiadać:

> Co definiuje ten region, co się w nim dzieje i dlaczego?

------------------------------------------------------------------------

# 42. Region Detail --- układ

``` text
REGION NAME / CONTEXT / CURRENT STATE

Overview
Population
Economy
Resources
Settlements
Technology
History
```

Nie wszystkie muszą być osobnymi zakładkami; mogą być sekcjami.

------------------------------------------------------------------------

# 43. Region Overview

Najważniejsze: - population + trend, - employment, - needs, - wages, -
settlement structure, - top industries, - top goods, - trade balance, -
knowledge profile, - major current process.

------------------------------------------------------------------------

# 44. „What Changed?"

Każdy Region Detail powinien mieć sekcję:

**Od ostatnich 10 lat** - population +X, - jobs +Y, - food price +Z, -
new company, - discovery, - settlement change.

------------------------------------------------------------------------

# 45. „Why?"

Przy kluczowych zmianach: `WHY?`

To centralny wzorzec interakcji FIRST CAUSE.

------------------------------------------------------------------------

# 46. Region Population

Pokazywać: - age groups, - economic classes, - skills, - employment, -
income, - wealth, - needs, - migration.

Nie prezentować każdego cohortu jako osobnego rekordu domyślnie.

------------------------------------------------------------------------

# 47. Cohort Drill-down

Dostępny w zaawansowanym widoku/debug.

------------------------------------------------------------------------

# 48. Region Economy

Pokazuje: - company count by sector, - output, - employment, - wages, -
major inputs, - major outputs, - shortages, - imports/exports, - prices.

------------------------------------------------------------------------

# 49. Production Chain View

Dla wybranego dobra:

``` text
Iron Ore
  ↓
Iron
  ↓
Steel
  ↓
Tools / Machinery
```

Każdy krok pokazuje: - local supply, - demand, - bottleneck, - price, -
producer count.

------------------------------------------------------------------------

# 50. Bottleneck-first

W ekonomii szczególnie eksponować: - brak inputu, - brak labor, -
transport cost, - capacity, - technology, - energy.

------------------------------------------------------------------------

# 51. Market Detail

Dla dobra: - Supply - Demand - Inventory - Local Price - Import Demand -
Export Supply - Shortage Severity - history chart.

------------------------------------------------------------------------

# 52. Price WHY?

Kliknięcie ceny: \> Dlaczego cena wzrosła?

Causality Engine zwraca główne przyczyny.

------------------------------------------------------------------------

# 53. Trade Flow Detail

Pokazuje: - origin, - destination, - good, - quantity, - source price, -
transport cost, - risk/tariff, - delivered cost, - route.

------------------------------------------------------------------------

# 54. Effective Distance UI

Nie trzeba pokazywać pełnego wzoru domyślnie.

Tooltip: - physical distance, - terrain, - infrastructure, -
congestion, - friction.

------------------------------------------------------------------------

# 55. Resource Detail

Pokazuje: - status discovery, - quantity, - initial quantity, -
quality, - accessibility, - extraction, - depletion, - companies using
it.

------------------------------------------------------------------------

# 56. Unknown Resource

Jeśli gracz w danym trybie nie powinien znać zasobu: - nie pokazujemy
ukrytych wartości.

W trybie pełnego Observera może istnieć przełącznik wiedzy meta.

------------------------------------------------------------------------

# 57. Depletion View

Powinien pokazywać: - current stock, - extraction rate, - peak
extraction, - estimated pressure.

Nie obiecywać dokładnej daty wyczerpania, jeśli produkcja może się
zmienić.

------------------------------------------------------------------------

# 58. Settlement Detail

Pokazuje: - stage, - population, - housing, - employment, - services, -
companies, - needs, - history.

------------------------------------------------------------------------

# 59. Settlement Growth

Wyjaśnienie awansu: - population pressure, - housing, - jobs, -
services, - infrastructure.

------------------------------------------------------------------------

# 60. Settlement Decline

Pokazuje: - outmigration, - company closures, - needs, - housing, -
resource decline.

------------------------------------------------------------------------

# 61. Company Detail

Company View powinien odpowiadać:

> Co firma robi, czy jest zdrowa i dlaczego podjęła ostatnią decyzję?

------------------------------------------------------------------------

# 62. Company Header

-   name,
-   archetype,
-   region,
-   status,
-   current PM,
-   scale/capacity.

------------------------------------------------------------------------

# 63. Company Finance

-   revenue,
-   input costs,
-   wages,
-   energy,
-   transport,
-   taxes,
-   maintenance,
-   profit,
-   cash,
-   debt.

------------------------------------------------------------------------

# 64. Company Production

-   inputs,
-   output,
-   capacity,
-   utilization,
-   inventory,
-   PM.

------------------------------------------------------------------------

# 65. Company Workforce

-   employees,
-   vacancies,
-   wage offer,
-   skill demand.

------------------------------------------------------------------------

# 66. Company AI Decision

Sekcja: **Ostatnia decyzja**

Pokazuje: - decision, - top factors, - rejected alternatives, - expected
outcome.

------------------------------------------------------------------------

# 67. Company WHY?

Przykład: \> Dlaczego firma nie zwiększa produkcji?

Odpowiedź z AI Decision Model + constraints.

------------------------------------------------------------------------

# 68. Decision Transparency

Nie pokazywać surowych wewnętrznych wag jako głównego UX.

Preferować: - „stal jest droga", - „brakuje pracowników", - „transport
ogranicza marżę".

Debug może pokazać liczby.

------------------------------------------------------------------------

# 69. Technology View

Powinien pokazywać rozwój jako sieć wiedzy, nie klasyczne drzewko
technologiczne sterowane przez gracza.

------------------------------------------------------------------------

# 70. Technology Domains

12 domen może być pokazanych jako lista/profil.

Dla VS 5 głównych aktywnych domen eksponowanych najmocniej.

------------------------------------------------------------------------

# 71. Knowledge Profile

Dla regionu: - Agriculture 42 - Construction 31 - Metallurgy 58 - Mining
66 - Mechanics 37

z trendem.

------------------------------------------------------------------------

# 72. Discovery State

Rozróżniać: - Unknown - Known - Available - Adopted

oraz: - Industry Adoption, - Population Access, - Institutional
Adoption.

------------------------------------------------------------------------

# 73. Discovery Detail

Pokazuje: - prerequisites, - knowledge requirements, - material
conditions, - economic pressure, - diffusion, - unlocks.

------------------------------------------------------------------------

# 74. Discovery WHY?

> Dlaczego odkrycie nastąpiło tutaj?

Pokazuje: - knowledge, - industry, - specialists, - need/pressure, -
trade exposure.

------------------------------------------------------------------------

# 75. Adoption WHY NOT?

> Dlaczego znana technologia nie jest stosowana?

Pokazuje: - capital cost, - skills, - energy, - infrastructure, -
switching cost.

------------------------------------------------------------------------

# 76. No Progress Bar Illusion

Nie przedstawiać discovery jako: `87% researched` jeśli model nie jest
liniowym research bar.

------------------------------------------------------------------------

# 77. Chronicle View

Chronicle jest główną historią świata.

Musi wspierać: - chronologię, - filtry, - significance, - Historical
Threads, - WHY?, - Architect Legacy.

------------------------------------------------------------------------

# 78. Chronicle Layout

``` text
FILTERS | TIMELINE / ENTRIES | CONTEXT / WHY
```

------------------------------------------------------------------------

# 79. Chronicle Filters

-   World / Region / Entity
-   Category
-   Concise / Standard / Detailed
-   Architect-related
-   Turning Points
-   Time range

------------------------------------------------------------------------

# 80. Chronicle Entry

Minimalnie: - date, - title, - concise body, - category, -
significance, - affected entities, - WHY?, - „Why this mattered".

------------------------------------------------------------------------

# 81. Dwa pytania

### WHY DID THIS HAPPEN?

Causality Engine.

### WHY DID THIS MATTER?

Historical Significance.

UI musi je wyraźnie rozdzielać.

------------------------------------------------------------------------

# 82. Historical Thread View

Przykład:

**Black Mountain Iron Boom**

Etapy: - discovery, - first mine, - migration wave, - city growth, -
peak extraction, - depletion, - transition.

------------------------------------------------------------------------

# 83. Thread Navigation

Kliknięcie etapu: - otwiera Chronicle Entry, - region, - WHY?, - causal
path.

------------------------------------------------------------------------

# 84. Turning Point

Wpis oznaczony: `TURNING POINT`

Powinien mieć: - before/after, - main descendants, - historical
significance.

------------------------------------------------------------------------

# 85. WHY? Panel

WHY? jest jednym z najważniejszych elementów całej gry.

Powinien być dostępny kontekstowo niemal wszędzie.

------------------------------------------------------------------------

# 86. WHY? --- podstawowy układ

``` text
WHY DID THIS HAPPEN?

Result:
Food price increased 24%

Primary causes
1. Local grain supply fell
2. Inventory buffer declined
3. Imports remained expensive

Secondary context
- drought reduced fertility
- transport capacity was constrained

[Open causal chain]
```

------------------------------------------------------------------------

# 87. 2--5 głównych przyczyn

Domyślny widok nie pokazuje całego grafu.

Pokazuje 2--5 najważniejszych przyczyn.

------------------------------------------------------------------------

# 88. Causal Strength

Może być prezentowana: - Primary - Significant - Minor

zamiast 0.437.

------------------------------------------------------------------------

# 89. Full Causal Chain

Zaawansowany widok: - root, - intermediate facts, - target fact, -
timestamps, - delays.

------------------------------------------------------------------------

# 90. WHY? Confidence

Jeżeli causal confidence jest niższe: język UI powinien być
ostrożniejszy.

------------------------------------------------------------------------

# 91. WHY NOT?

Równie ważne:

> Dlaczego kopalnia nie powstała?

Może pokazywać: - expected margin too low, - transport too expensive, -
insufficient labor, - missing technology.

------------------------------------------------------------------------

# 92. WHY NOT? źródła

-   AI Decision Snapshots,
-   constraints,
-   opportunity evaluation,
-   adoption eligibility.

------------------------------------------------------------------------

# 93. Architect Panel

Architect Panel jest miejscem wykonywania interwencji.

Nie powinien dominować nad obserwacją świata.

------------------------------------------------------------------------

# 94. Architect Overview

Pokazuje: - Influence, - regeneration, - active interventions, - recent
consequences, - legacy.

------------------------------------------------------------------------

# 95. Intervention Catalog

Kategorie: - Environment - Resources - Population - Knowledge -
Economy - Experimental Events

------------------------------------------------------------------------

# 96. Intervention Detail

Pokazuje: - target, - direct effect, - magnitude, - duration, - scope, -
naturalness, - cost, - possible affected systems.

------------------------------------------------------------------------

# 97. Guaranteed vs Possible

Obowiązkowe rozdzielenie:

**Direct change** `Iron deposit becomes discovered.`

**Possible consequences** `May increase mining opportunities.`

------------------------------------------------------------------------

# 98. No Outcome Promise

UI nigdy: \> „Stworzy boom."

------------------------------------------------------------------------

# 99. Influence Cost

Koszt powinien być czytelny.

Szczegółowe komponenty dostępne w tooltipie/expand.

------------------------------------------------------------------------

# 100. Intervention Confirmation

Przed wykonaniem: - target, - direct change, - total cost, - duration, -
Influence after action.

------------------------------------------------------------------------

# 101. Architect History

Lista wszystkich interwencji: - date, - target, - cost, - direct
effect, - current legacy.

------------------------------------------------------------------------

# 102. Butterfly Effect View

Odpowiada:

> Co wynikło z tej interwencji?

------------------------------------------------------------------------

# 103. Butterfly Layout

``` text
INTERVENTION ROOT
      ↓
DIRECT EFFECTS
      ↓
MAJOR CONSEQUENCES
      ↓
TURNING POINTS
      ↓
CURRENT LEGACY
```

------------------------------------------------------------------------

# 104. Butterfly nie pokazuje wszystkiego

Tylko: - significant descendants, - causal paths, - unintended
consequences.

------------------------------------------------------------------------

# 105. Architect Attribution

Przy konsekwencji: - Direct - Strong - Significant - Minor

Nie: „100% twoja wina".

------------------------------------------------------------------------

# 106. Butterfly Network

Opcjonalny abstrakcyjny graf.

Powinien być czytelny i ograniczony do wybranej interwencji.

------------------------------------------------------------------------

# 107. Causal Path on World Network

Można opcjonalnie zaznaczyć, jak wpływ interwencji rozprzestrzenił się
między regionami.

------------------------------------------------------------------------

# 108. Experiment Mode UI

Powinien wspierać: - seed, - start state, - intervention, - simulation
horizon, - branch A/B, - comparison.

------------------------------------------------------------------------

# 109. Comparison View

Dla dwóch światów: - population, - economy, - settlements, -
discoveries, - Chronicle differences, - intervention consequences.

------------------------------------------------------------------------

# 110. Counterfactual Language

Jeśli rzeczywiście istnieją dwa branche, UI może mówić: - „W świecie B
to wydarzenie nie wystąpiło."

Bez brancha nie twierdzi kontrfaktycznie.

------------------------------------------------------------------------

# 111. Alerts

Alert jest używany tylko wtedy, gdy: - ważna zmiana zaszła, - gracz może
chcieć ją zbadać, - nie jest to zwykły mikro-fakt.

------------------------------------------------------------------------

# 112. Alert Types

-   Major Event
-   Crisis
-   Discovery
-   Settlement Change
-   Architect Consequence
-   Resource Milestone

------------------------------------------------------------------------

# 113. Alert Inbox

Nie jest wymagany w VS, jeśli Important Now wystarcza.

------------------------------------------------------------------------

# 114. Opportunity

UI może pokazać **Opportunity detected**, ale nie powinno mówić
graczowi, że musi działać.

FIRST CAUSE nie jest quest systemem.

------------------------------------------------------------------------

# 115. Tooltips

Tooltips powinny: - wyjaśniać znaczenie metryki, - pokazywać
komponenty, - nie być esejem.

------------------------------------------------------------------------

# 116. Progressive Disclosure

Poziom 1: najważniejszy wynik.

Poziom 2: komponenty.

Poziom 3: pełne dane/debug.

------------------------------------------------------------------------

# 117. Charts

Wykresy używać tylko tam, gdzie trend jest ważniejszy niż snapshot.

Przykłady: - population, - price, - production, - extraction, -
adoption.

------------------------------------------------------------------------

# 118. Chart Defaults

-   czytelna oś czasu,
-   niewiele serii,
-   hover details,
-   event markers.

------------------------------------------------------------------------

# 119. Chronicle Markers on Charts

Ważne wydarzenia mogą być oznaczone na osi: - discovery, -
intervention, - crisis, - settlement stage change.

------------------------------------------------------------------------

# 120. Avoid Chart Wall

Nie umieszczać 12 miniwykresów obok siebie tylko dlatego, że dane
istnieją.

------------------------------------------------------------------------

# 121. Tables

Tabele są właściwe dla: - goods, - companies, - regions, -
discoveries, - trade flows.

------------------------------------------------------------------------

# 122. Table Sorting

Powinno działać: - significance, - population, - price, - shortage, -
profit, - growth.

------------------------------------------------------------------------

# 123. Search

Docelowo globalne wyszukiwanie: - region, - settlement, - company, -
good, - discovery.

VS może ograniczyć do regionów/settlements/companies.

------------------------------------------------------------------------

# 124. Breadcrumbs

Przykład:

`World > North Continent > Black Mountain > Ironworks`

Zachowuje orientację.

------------------------------------------------------------------------

# 125. Back Navigation

Powrót powinien zachować: - overlay, - time window, - selected entity, -
scroll/context.

------------------------------------------------------------------------

# 126. Deep Links

Każda encja powinna mieć stabilny route oparty na ID.

------------------------------------------------------------------------

# 127. UI State ≠ Save State

Większość: - otwartego panelu, - scroll, - filter

to presentation state.

Może być zachowywany osobno, ale nie jest Simulation State.

------------------------------------------------------------------------

# 128. Information Density

Desktopowa gra może mieć wysoką gęstość danych, ale musi posiadać
hierarchię.

Nie używać ogromnych pustych kart z jedną liczbą.

------------------------------------------------------------------------

# 129. Anti-SaaS

Unikać: - gridu 12 identycznych rounded cards, - wielkich gradientów, -
przypadkowych ikon, - kolorowych KPI bez kontekstu.

------------------------------------------------------------------------

# 130. Anti-AI

Preferować: - prostokątne panele, - linie/separatory, - typograficzną
hierarchię, - tabelaryczne dane, - konkretne etykiety, - ograniczoną
paletę, - spójne odstępy.

------------------------------------------------------------------------

# 131. Icons

Ikony tylko gdy: - mają jednoznaczne znaczenie, - przyspieszają
skanowanie.

Nie jako dekoracja.

------------------------------------------------------------------------

# 132. Typography

Preferować 2--3 poziomy typograficzne: - section/title, - body/data, -
secondary/meta.

Nie używać wielu fontów.

------------------------------------------------------------------------

# 133. Numeric Typography

Liczby powinny być łatwe do porównania.

Warto rozważyć tabular numerals.

------------------------------------------------------------------------

# 134. Color

Kolor jest semantyczny.

Przykład: - warning, - positive trend, - negative trend, - selection, -
Architect attribution.

Nie kolorować każdej kategorii losowo.

------------------------------------------------------------------------

# 135. Accessibility

Nie opierać znaczenia tylko na kolorze.

Dodawać: - tekst, - symbol, - pattern/label.

------------------------------------------------------------------------

# 136. Motion

Minimalny.

Animacja może pokazywać: - przepływ, - zmianę, - selection.

Nie może przeszkadzać przy ×100.

------------------------------------------------------------------------

# 137. Fast Simulation Mode

Przy ×100: - UI może aktualizować snapshot np. co kilka ticków, -
Chronicle/Simulation nadal liczone co wymagany tick.

------------------------------------------------------------------------

# 138. Loading / Calculation

Przy dłuższym przeliczeniu: - progress, - simulated years/ticks, -
możliwość pause/cancel, jeśli bezpieczne.

------------------------------------------------------------------------

# 139. Error State

Jeżeli invariant fail: w buildzie developerskim: - zatrzymać
symulację, - pokazać diagnostykę.

W release: - kontrolowana obsługa zgodnie z polityką engine.

------------------------------------------------------------------------

# 140. Empty States

Brak danych jest informacją.

Przykład: - „No trade flows" - „No discovered deposits" - „No major
historical events"

Nie wypełniać sztuczną treścią.

------------------------------------------------------------------------

# 141. Unknown State

Od Empty odróżniać: - Unknown, - Not Available, - Not Yet Discovered.

------------------------------------------------------------------------

# 142. Data Freshness

Przy wysokich prędkościach UI może pokazać:
`Data updated: Year 32, Month 4`.

------------------------------------------------------------------------

# 143. World Command Center --- dolny panel

Rekomendowane przełączalne moduły: - Recent History - Selected Causal
Thread - Architect Legacy - Current Trends

Nie wszystkie naraz.

------------------------------------------------------------------------

# 144. Recent History

3--6 najważniejszych ostatnich Chronicle Entries.

------------------------------------------------------------------------

# 145. Current Trends

Przykłady: - migration toward north, - rising food prices, - mining
expansion, - declining timber stock.

Trend musi być systemowo wykryty.

------------------------------------------------------------------------

# 146. Selected Causal Thread

Jeżeli gracz analizuje wydarzenie: dolny panel może pokazać ścieżkę
przyczyn.

------------------------------------------------------------------------

# 147. Architect Legacy

Jeżeli wybrano interwencję: dolny panel przełącza się na jej skutki.

------------------------------------------------------------------------

# 148. Context Persistence

Wybranie regionu nie powinno resetować całej analizy.

------------------------------------------------------------------------

# 149. Side-by-side Analysis

Docelowo możliwość przypięcia dwóch regionów/dóbr.

Nie jest obowiązkowa dla VS.

------------------------------------------------------------------------

# 150. Economy Global View

Powinien umożliwiać: - goods overview, - shortages, - price
dispersion, - major producers, - trade.

------------------------------------------------------------------------

# 151. Goods Overview

Tabela: - Good - Total Supply - Total Demand - Regions in Shortage -
Price Range - Major Producer

------------------------------------------------------------------------

# 152. Economy Drill-down

Good → Region Market → Companies → Production Method → Inputs.

------------------------------------------------------------------------

# 153. Technology Global View

-   domain profiles by region,
-   discoveries,
-   diffusion,
-   adoption gaps.

------------------------------------------------------------------------

# 154. Technology Comparison

Może pokazywać dwa regiony: - Knowledge, - Known, - Available, -
Adopted.

------------------------------------------------------------------------

# 155. World History Summary

Chronicle może mieć: - Top Events of decade, - Turning Points, -
Historical Threads.

------------------------------------------------------------------------

# 156. Historical Period Navigation

Przy 1000-letnim świecie: - century, - decade, - year.

------------------------------------------------------------------------

# 157. Long Timeline Performance

Nie renderować wszystkich entries naraz.

Virtualization/pagination.

------------------------------------------------------------------------

# 158. Causal Graph Performance

Nie renderować pełnego world causal graph.

Tylko query-scoped subgraph.

------------------------------------------------------------------------

# 159. World Network Performance

Do docelowych 3 000 regionów: - clustering, - level-of-detail, - filtered labels, - virtualization.

------------------------------------------------------------------------

# 160. Large World Navigation

Przy 1 200–3 000 regionach: - search, - filters, - top events, -
zoom/clustering.

------------------------------------------------------------------------

# 161. Region Clustering

Przy oddaleniu: - continent/cluster nodes.

Przy zbliżeniu: - regions.

Nie musi odpowiadać geograficznemu zoomowi mapy.

------------------------------------------------------------------------

# 162. Selected Region Priority

Wybrany region zawsze: - czytelny, - opisany, - na pierwszym planie.

------------------------------------------------------------------------

# 163. World Size Adaptation

Ten sam UI powinien działać dla: - 32 VS regions, - 150 Small, - 350
Standard, - 800 Large.

------------------------------------------------------------------------

# 164. No UI Logic in Simulation

UI nie może implementować: - cen, - migration, - significance, - AI
decisions.

Tylko prezentuje wyniki.

------------------------------------------------------------------------

# 165. Presentation Calculations

Dozwolone: - formatowanie, - procentowa zmiana, - sortowanie, -
grouping.

Nie mogą zmieniać mechaniki.

------------------------------------------------------------------------

# 166. View Model Aggregation

Cięższe agregaty powinny być przygotowane przez read-model/service
layer, nie przeliczane losowo przez komponenty UI.

------------------------------------------------------------------------

# 167. Localization

Cały UI: - keys, - dynamic data, - pluralization, - number/date
formatting.

Bazowy język: English. Polish oraz pozostałe wspierane języki przez
warstwę lokalizacji.

------------------------------------------------------------------------

# 168. Dynamic Names

Nazwy: - regionów, - osad, - firm

mogą być przechowywane jako dynamiczne proper names.

------------------------------------------------------------------------

# 169. String Length

Layout powinien tolerować dłuższe tłumaczenia.

Nie projektować przycisków „na styk".

------------------------------------------------------------------------

# 170. Number Formatting

UI: - 1 250, - 1.2k / 1,2 tys. zależnie od locale, - pełna wartość w
tooltipie.

------------------------------------------------------------------------

# 171. Dates

Świat może mieć własny kalendarz/rok.

Formatowanie musi być centralne.

------------------------------------------------------------------------

# 172. Tooltips and Localization

Nie hardcodować zdań w komponentach.

------------------------------------------------------------------------

# 173. Keyboard

Desktop: - Space = Pause/Resume, - 1/2/3... opcjonalnie speed, - Esc =
close contextual panel, - F = search/focus --- do decyzji.

------------------------------------------------------------------------

# 174. Mouse

Hover: - secondary data.

Click: - select.

Double click lub Open: - detail.

Nie ukrywać kluczowych działań tylko pod hover.

------------------------------------------------------------------------

# 175. Resolution

Referencyjna: 1920×1080.

UI powinien skalować do niższych desktopowych rozdzielczości.

------------------------------------------------------------------------

# 176. Minimum Width

Do ustalenia podczas prototypu.

Priorytetem jest PC/Steam, nie mobile.

------------------------------------------------------------------------

# 177. Modal Policy

Unikać modalów.

Modal tylko: - confirmation, - critical action, - intervention apply.

------------------------------------------------------------------------

# 178. Drawer / Inspector

Preferowany dla kontekstu.

------------------------------------------------------------------------

# 179. Notification Policy

Toast: - tylko krótkie potwierdzenia, - nie jako główny nośnik historii.

------------------------------------------------------------------------

# 180. World Command Center --- reference wireframe

``` text
┌────────────────────────────────────────────────────────────────────────────┐
│ FIRST CAUSE | Year 32 M04 | ×10 | Influence 74/100       [Pause] [×100]   │
├─────────────────┬───────────────────────────────────────┬──────────────────┤
│ WORLD STATUS    │ LIVING ATLAS                          │ IMPORTANT NOW    │
│ Population 214  │                                       │ Iron discovered  │
│ +4.2% / 10y     │       [REGION]────[REGION]            │ Black Mountain   │
│ Employment 83%  │          │           │                │ [Open] [Why?]    │
│ Needs 71        │       [REGION]────[REGION]            │                  │
│ Companies 18    │                                       │ Food shortage    │
│ Shortages 2     │ Overlay: Economy                      │ River Valley     │
│                 │ Selected: Black Mountain              │ [Open] [Why?]    │
├─────────────────┴───────────────────────────────────────┴──────────────────┤
│ RECENT HISTORY                                                             │
│ Y31  First iron deposit discovered in Black Mountain              [Why?]  │
│ Y30  River Valley food shortage entered its third year             [Why?]  │
└────────────────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 181. Region Detail --- reference wireframe

``` text
WORLD > NORTH > BLACK MOUNTAIN

BLACK MOUNTAIN
Population 34  ↑18% / 10y
Employment 91%
Needs 68
Main settlement: Black Mountain Town
Specialization: Mining / Iron

[Overview] [Economy] [Population] [Resources] [Technology] [History]

WHAT CHANGED — 10 YEARS
+12 population
+1 mine
Iron output +64%
Food price +18%
Housing pressure increased

WHY IS THE REGION GROWING?
1. Mining employment increased
2. Wages exceed neighboring regions
3. Trade connection improved

[Open full causal chain]
```

------------------------------------------------------------------------

# 182. Company Detail --- reference wireframe

``` text
BLACK MOUNTAIN IRON CO.
Mine | Active | Region: Black Mountain

Production
Iron Ore: 42 / month
Capacity utilization: 84%

Finance
Revenue  120
Costs     94
Profit    26

Workforce
Employees 18
Vacancies 3
Wage offer 6.4

LAST DECISION
Expand hiring

Main reasons
+ Expected iron price remains high
+ Current mine capacity underused
- Skilled labor is limited

[Why this decision?]
```

------------------------------------------------------------------------

# 183. WHY? --- reference wireframe

``` text
WHY DID FOOD PRICE RISE?

Food price: +24% over 18 months

PRIMARY
01  Grain supply fell                 STRONG
02  Inventory buffer was depleted     STRONG
03  Imports remained expensive        SIGNIFICANT

CONTEXT
Drought reduced regional fertility.
Road congestion increased delivered import cost.

ROOT
Architect Environmental Shock — Minor remaining influence

[Open causal chain]
```

------------------------------------------------------------------------

# 184. Butterfly --- reference wireframe

``` text
INTERVENTION
Reveal Iron Deposit — Year 18
Cost: 12 Influence

DIRECT
Iron deposit discovered

MAJOR CONSEQUENCES
Y21  First mine founded                  STRONG
Y27  Migration wave                      SIGNIFICANT
Y39  Settlement became a city            SIGNIFICANT
Y61  Mining output peaked                MINOR
Y84  Resource bust began                 MINOR

CURRENT LEGACY
Population +...
Industrial employment +...
Road infrastructure remains
Mining sector declining

[Open historical thread]
```

------------------------------------------------------------------------

# 185. Visual Design Direction

Kierunek: - jasny lub neutralny analityczny interfejs, - wyraźne
separatory, - niewielka liczba akcentów, - bez neonowego sci-fi, - bez
fantasy, - bez przesadnego retro.

FIRST CAUSE ma wyglądać jak poważne narzędzie do obserwowania
alternatywnego świata.

------------------------------------------------------------------------

# 186. Branding vs Simulation UI

Logo/ekran startowy mogą mieć silniejszy charakter.

Warstwa robocza gry powinna być spokojniejsza i funkcjonalna.

------------------------------------------------------------------------

# 187. Design Tokens

Przyszły Design System powinien definiować: - spacing, - typography, -
border, - panel, - semantic states, - chart rules, - interaction states.

------------------------------------------------------------------------

# 188. Selection State

Musi być jednoznaczny i spójny: - selected region, - selected event, -
selected intervention.

------------------------------------------------------------------------

# 189. Hover State

Subtelny.

Nie powinien wyglądać jak nowy semantic status.

------------------------------------------------------------------------

# 190. Warning State

Używać tylko do realnego problemu: - shortage, - severe decline, -
invariant/debug.

------------------------------------------------------------------------

# 191. Positive State

Nie zakładać, że wzrost zawsze jest „dobry".

Można używać neutralnych: - up, - down, - improving, - worsening

w kontekście konkretnej metryki.

------------------------------------------------------------------------

# 192. Mixed Outcome UI

Przy interwencji: - Employment ↑ - Housing Pressure ↑ - Environment ↓

bez sprowadzania do jednego zielonego/czerwonego wyniku.

------------------------------------------------------------------------

# 193. World Storytelling

Historia ma wynikać z: - zmian, - danych, - Chronicle, - causal links.

Nie z dekoracyjnych opisów.

------------------------------------------------------------------------

# 194. No Generated Fluff

Nie dodawać automatycznie: \> „Nowa era świta nad regionem..."

jeżeli system nie wykrył historycznego okresu/Turning Point.

------------------------------------------------------------------------

# 195. Data Explainability

Każda ważna liczba powinna mieć: - definicję, - źródło, - trend, - WHY?
jeśli sensowne.

------------------------------------------------------------------------

# 196. Debug Mode

Może pokazywać: - entity IDs, - raw values, - causal scores, - RNG, -
cache, - invariants.

Nie jest częścią normalnego UX.

------------------------------------------------------------------------

# 197. Developer Overlay

Przydatne: - tick time, - facts/tick, - companies, - cohorts, - causal
memory, - Chronicle candidates.

------------------------------------------------------------------------

# 198. UX Test --- World Awareness

Po 30 sekundach na Command Center tester powinien umieć powiedzieć: -
który region rośnie, - gdzie jest problem, - jakie było ostatnie ważne
wydarzenie.

------------------------------------------------------------------------

# 199. UX Test --- Region Understanding

Po 60 sekundach Region Detail: tester powinien umieć powiedzieć: - z
czego region żyje, - czy rośnie, - co go ogranicza.

------------------------------------------------------------------------

# 200. UX Test --- WHY?

Tester: - znajduje WHY? bez instrukcji, - rozumie 2--5 głównych
przyczyn.

------------------------------------------------------------------------

# 201. UX Test --- Intervention

Tester powinien przed kliknięciem rozumieć: - co zmienia bezpośrednio, -
ile kosztuje, - że dalszy rezultat nie jest gwarantowany.

------------------------------------------------------------------------

# 202. UX Test --- Chronicle

Tester powinien odróżnić: - „dlaczego się wydarzyło" od - „dlaczego było
ważne".

------------------------------------------------------------------------

# 203. UX Test --- Butterfly

Tester powinien rozumieć, że: - odległe konsekwencje mają mniejszy
attribution, - nie wszystkie są bezpośrednio „spowodowane przez gracza".

------------------------------------------------------------------------

# 204. UX Test --- Fast Simulation

Przy ×100: - UI nie staje się nieczytelne, - Important Now nie
spamuje, - po Pause można zrozumieć, co zaszło.

------------------------------------------------------------------------

# 205. UX Test --- 200 Years

Po 200 latach: - World Command Center nadal jest użyteczny, - Chronicle
można przeglądać, - regiony można znaleźć, - historia nie jest ścianą
danych.

------------------------------------------------------------------------

# 206. UX Test --- 3 000 Regions

Docelowo: - search, - clustering, - filters, - top events

pozwalają nawigować bez ręcznego przeglądania do 3 000 węzłów.

------------------------------------------------------------------------

# 207. VS Required Screens

Vertical Slice wymaga:

1.  World Command Center
2.  Living Atlas / World Network
3.  Region Detail
4.  Settlement Detail
5.  Market/Economy Detail
6.  Company Detail
7.  Technology Detail
8.  Chronicle
9.  WHY? Explanation
10. Architect Panel
11. Butterfly Effect
12. Simulation Controls

------------------------------------------------------------------------

# 208. VS Optional Screens

-   global Economy,
-   global Technology comparison,
-   Historical Thread dedicated screen,
-   Experiment comparison.

Mogą być prostsze/panelowe.

------------------------------------------------------------------------

# 209. VS Navigation Flow

Podstawowy:

``` text
World Command Center
→ select Region
→ Region Detail
→ Market / Company / Settlement / Technology
→ WHY?
→ Chronicle / causal chain
```

oraz:

``` text
World Command Center
→ Architect
→ Intervention Preview
→ Apply
→ Simulate
→ Important Now
→ Butterfly Effect
```

------------------------------------------------------------------------

# 210. VS Main Loop UX

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

UI powinien wspierać ten loop bez zbędnych ekranów.

------------------------------------------------------------------------

# 211. Implementation Order

## UI-01

Design tokens + layout shell.

## UI-02

Simulation controls + top bar.

## UI-03

World Command Center.

## UI-04

Living Atlas / World Network.

## UI-05

Region Detail.

## UI-06

Economy / Market / Company.

## UI-07

Technology.

## UI-08

WHY?.

## UI-09

Chronicle.

## UI-10

Architect Panel.

## UI-11

Butterfly Effect.

## UI-12

Polish/localization pass.

## UI-13

Performance/large-world pass.

## UI-14

UX testing and iteration.

------------------------------------------------------------------------

# 212. Definition of Done --- Command Center

Gotowy dla VS, jeśli: - pokazuje stan świata, - pokazuje najważniejsze
zmiany, - umożliwia wybór regionu, - daje dostęp do czasu, - daje dostęp
do Chronicle/Architect, - nie wymaga klasycznej mapy.

------------------------------------------------------------------------

# 213. Definition of Done --- Living Atlas

Gotowy, jeśli: - 32 regiony są czytelne, - połączenia są widoczne, -
overlay działa, - region można znaleźć/wybrać, - trade/migration można
zrozumieć.

------------------------------------------------------------------------

# 214. Definition of Done --- Region Detail

Gotowy, jeśli: - gracz rozumie populację, - gospodarkę, - zasoby, -
osady, - technologię, - ostatnie zmiany, - może użyć WHY?.

------------------------------------------------------------------------

# 215. Definition of Done --- WHY?

Gotowy, jeśli: - działa dla kluczowych pytań VS, - pokazuje 2--5
głównych przyczyn, - pozwala otworzyć pełną ścieżkę, - nie wymyśla
przyczyn.

------------------------------------------------------------------------

# 216. Definition of Done --- Chronicle

Gotowy, jeśli: - działa timeline, - filtry, - sensitivity, - WHY?, - Why
this mattered, - Architect marker.

------------------------------------------------------------------------

# 217. Definition of Done --- Architect

Gotowy, jeśli: - Influence jest widoczne, - interwencja ma preview, -
direct vs possible jest rozdzielone, - koszt jest jasny, - Butterfly
pokazuje konsekwencje.

------------------------------------------------------------------------

# 218. Kanoniczne ustalenia v0.1

-   World Command Center jest głównym ekranem.
-   Region jest podstawową jednostką nawigacji.
-   Living Atlas / World Network zastępuje klasyczną mapę jako fundament
    MVP.
-   UI jest text-first/data-first.
-   Około 70/30 tekst-dane vs abstrakcyjna wizualizacja jest kierunkiem,
    nie sztywnym layoutem.
-   UI korzysta z Read Models i Commands.
-   UI nie jest źródłem prawdy.
-   Główne sekcje: World, Economy, Technology, Chronicle, Architect.
-   Important Now i Chronicle są różnymi warstwami.
-   WHY? jest globalnym wzorcem interakcji.
-   WHY NOT? jest wymagane dla ważnych niezrealizowanych możliwości.
-   „Why did this happen?" i „Why did this matter?" są oddzielne.
-   Architect Panel pokazuje direct effect vs possible consequences.
-   Butterfly Effect pokazuje wybrane znaczące descendants.
-   Brak klasycznej mapy nie oznacza braku wizualizacji przestrzeni.
-   Overlays są kontekstowe i ograniczone.
-   Progressive Disclosure jest obowiązkowe.
-   Nie pokazujemy wszystkich cohortów/facts/causal edges domyślnie.
-   Chronicle nie jest gazetą.
-   UI ma być analityczne, spokojne i anti-AI.
-   Brak dekoracyjnych ikon i kart bez funkcji.
-   Wzrost nie jest automatycznie „dobry".
-   Mixed outcomes są prezentowane jawnie.
-   ×100 nie pomija ticków.
-   UI może rzadziej renderować przy wysokiej prędkości.
-   1920×1080 jest rozdzielczością referencyjną.
-   Architektura UI musi skalować się od 32 do docelowych 3 000 regionów; finalny oficjalnie wspierany limit zależy od benchmarków silnika.
-   Localization jest częścią architektury od początku.

------------------------------------------------------------------------

# 219. Otwarte decyzje do prototypowania

Do rozstrzygnięcia na mockupach i pierwszym grywalnym buildzie: -
dokładny layout World Command Center, - pionowy vs poziomy Chronicle
timeline, - wygląd World Network, - czy Region Inspector jest prawym
drawerem czy dolnym panelem, - domyślna metryka rozmiaru region node, -
liczba jednoczesnych Important Now, - exact color system, - font
family, - density presets, - dokładne skróty klawiszowe, - czy
Economy/Technology są głównymi zakładkami czy globalnymi trybami
World, - czy Butterfly używa grafu, osi czasu czy obu, - sposób
clusterowania 250–3 000 regionów.

Te decyzje wymagają prototypów UI, nie zmian modelu symulacji.

------------------------------------------------------------------------

# 220. Następne dokumenty

Aktualizacja 2026-09-16: Save/Determinism/Performance Spec oraz
Content/Localization Spec już istnieją. Warstwę wizualną i Living Atlas
rozwijają `FIRST-CAUSE-UI-Visual-Design-System-v1.0.md` oraz
`FIRST-CAUSE-UI-Implementation-Spec-v1.0.md`. Zastępują dawną propozycję
osobnych dokumentów Design System i World Network Visualization.
Ustalone tam kolory, typografia i reguły gęstości zamykają odpowiednie
historyczne pytania z §219. Bieżący etap projektu to M1; tor UI podlega
roadmapie v0.2.


------------------------------------------------------------------------

# 221. Kryterium końcowe

Interfejs FIRST CAUSE spełnia swoją rolę, jeśli gracz po uruchomieniu
symulacji nie musi rozumieć tysięcy rekordów World State.

Powinien zobaczyć:

> **Co się dzieje?**

następnie:

> **Gdzie?**

potem:

> **Dlaczego?**

a jeśli chce eksperymentować:

> **Co się stanie, jeśli zmienię ten warunek?**

Po kilkudziesięciu latach powinien móc wrócić i zobaczyć:

> **Co z tego wynikło?**

oraz:

> **Dlaczego było to historycznie ważne?**

UI nie powinien konkurować z symulacją.

Powinien uczynić ją zrozumiałą.

> **World Command Center pokazuje świat. WHY? odsłania przyczyny.
> Architect zmienia warunki. Butterfly Effect pokazuje konsekwencje.
> Chronicle zachowuje historię.**

**KONIEC --- FIRST CAUSE UI/UX & World Command Center Spec v0.1**
