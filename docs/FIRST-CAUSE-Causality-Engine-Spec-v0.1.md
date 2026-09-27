# FIRST CAUSE --- Causality Engine Spec v0.1

**Status:** wersja robocza / kanoniczna specyfikacja silnika
przyczynowości\
**Projekt:** FIRST CAUSE\
**Wersja dokumentu:** 0.1\
**Rola:** definicja sposobu rejestrowania faktów, budowania relacji
przyczynowych, odpowiadania na pytanie WHY?, śledzenia Butterfly Effect
oraz kompresji wielowiekowej pamięci przyczynowej.

**Dokumenty powiązane:** -
`FIRST-CAUSE-koncepcja-architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` -
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` (brak w repo; zob. Canonical Decisions §199) -
`FIRST-CAUSE-Entity-Data-Model-v0.1.md` -
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md`

------------------------------------------------------------------------

# 0. Cel dokumentu

Causality Engine jest jednym z najważniejszych systemów FIRST CAUSE.

Jego zadaniem nie jest jedynie zapisanie, **co się wydarzyło**, lecz
utrzymanie wystarczającej informacji, aby system potrafił odpowiedzieć:

-   dlaczego to się wydarzyło,
-   jakie czynniki były najważniejsze,
-   jak długo działały,
-   które wcześniejsze zdarzenia stworzyły warunki,
-   czy Architekt miał wpływ,
-   jakie dalsze konsekwencje wynikły z danej zmiany.

Fundamentalna zasada:

> **Symulacja najpierw oblicza rzeczywistą zmianę stanu. Dopiero potem
> Causality Engine zapisuje jej przyczyny.**

Silnik przyczynowości nie może wymyślać historii po fakcie.

------------------------------------------------------------------------

# 1. Rola Causality Engine w FIRST CAUSE

Causality Engine obsługuje cztery główne funkcje:

1.  **Simulation Facts** --- zapis istotnych zmian stanu.
2.  **Causal Graph** --- powiązanie skutków z ich przyczynami.
3.  **WHY?** --- zrozumiała odpowiedź dla gracza.
4.  **Butterfly Effect** --- śledzenie długoterminowego wpływu
    interwencji Architekta.

Dodatkowo dostarcza dane dla: - Chronicle, - Experiment Mode, - porównań
światów, - debugowania symulacji, - Historical Significance, -
przyszłych postaci historycznych i wydarzeń.

------------------------------------------------------------------------

# 2. Czego Causality Engine NIE robi

Nie: - podejmuje decyzji za firmy, - oblicza ceny, - steruje migracją, -
generuje technologie, - tworzy narracji bez danych, - zmienia stanu
świata, - zastępuje Simulation Model, - zastępuje Chronicle.

Causality Engine jest warstwą **obserwacji i zapisu przyczyn zmian**, a
nie dodatkowym systemem gameplayowym zmieniającym wynik.

------------------------------------------------------------------------

# 3. Fundamentalny model

Podstawowy model:

``` text
STATE A
  ↓
CAUSES / CONDITIONS / DECISIONS
  ↓
STATE MUTATION
  ↓
SIMULATION FACT
  ↓
CAUSAL EDGES
  ↓
FUTURE FACTS
```

Przykład:

``` text
wysoki popyt na żelazo
+ dostępne złoże
+ dostępna siła robocza
+ opłacalny transport
        ↓
wysoki OpportunityScore
        ↓
firma zakłada kopalnię
        ↓
FACT: company_founded
        ↓
nowe miejsca pracy
        ↓
FACT: employment_increased
        ↓
migracja
```

------------------------------------------------------------------------

# 4. Jednostka podstawowa --- Simulation Fact

Simulation Fact opisuje **rzeczywistą, zakończoną zmianę lub istotny
stan**, który został potwierdzony przez symulację.

Minimalny model:

``` yaml
SimulationFact:
  id:
  tick:
  type:

  subject:
    entityType:
    entityId:

  location:
    regionId:
    settlementId:

  values:
    before:
    after:
    delta:

  causes:
    sourceFactIds: []

  context:
    relatedEntityIds: []

  architect:
    influenced:
    interventionId:
    influenceStrength:

  significance:
    magnitude:
    populationAffected:
    geographicScope:
    durationEstimate:

  retention:
    level:
    expiresAfterTick:
```

------------------------------------------------------------------------

# 5. Fakty vs stany

Nie każda wartość stanu jest faktem.

Stan:

``` text
Iron Ore price = 18.4
```

Fakt:

``` text
Cena Iron Ore wzrosła z 14.2 do 18.4 w ciągu 3 miesięcy.
```

Stan:

``` text
Population = 410
```

Fakt:

``` text
Populacja Black Mountain wzrosła o 18% w ciągu 24 miesięcy.
```

Causality Engine powinien koncentrować się na **zmianach**, a nie
kopiować cały World State.

------------------------------------------------------------------------

# 6. Typy Simulation Facts

Minimalne rodziny:

## 6.1 Resources

-   resource_suspected
-   resource_discovered
-   resource_assessed
-   extraction_started
-   extraction_increased
-   extraction_decreased
-   resource_economically_exhausted
-   resource_depleted

Fakty odkrycia złoża powstają tylko przy rzeczywistej zmianie statusu
(jeden fakt na zmianę); przejście spod DISCOVERED do ASSESSED w jednym
ticku daje `resource_discovered` → `resource_assessed` z krawędzią
między nimi (Canonical Decisions `TECH-012`).

## 6.2 Companies

-   company_founded
-   company_expanded
-   company_contracted
-   company_closed
-   company_bankrupt
-   production_method_adopted

## 6.3 Production

-   production_increased
-   production_decreased
-   production_stopped
-   input_shortage_started
-   input_shortage_ended

## 6.4 Market

-   price_increased
-   price_decreased
-   shortage_started
-   shortage_worsened
-   shortage_ended
-   surplus_started

## 6.5 Trade

-   trade_flow_started
-   trade_flow_expanded
-   trade_flow_declined
-   trade_flow_ended
-   transport_cost_changed
-   congestion_started

## 6.6 Labor

-   employment_increased
-   employment_decreased
-   unemployment_increased
-   wage_increased
-   wage_decreased
-   labor_shortage_started

## 6.7 Population

-   population_increased
-   population_declined
-   migration_increased
-   migration_outflow_increased
-   needs_satisfaction_changed

## 6.8 Settlements

-   settlement_founded
-   settlement_stage_changed
-   housing_pressure_increased
-   settlement_decline_started

## 6.9 Technology

-   knowledge_increased
-   discovery_became_eligible
-   discovery_occurred
-   discovery_diffused
-   discovery_became_available
-   technology_adoption_increased (adopcja przemysłowa --- zmiana metody
    produkcji)
-   technology_population_access_reached (2026-09-26: próg dostępu
    populacji, osobna oś TECH-006)
-   technology_tier_reached (2026-09-26: region wchodzi w nowy tier)

> **2026-09-26 (decyzja właściciela, zgodnie z §7):** fakty technologii
> powstają przy zdarzeniach, nie przy przyrostach --- `knowledge_increased`
> tylko przy przekroczeniu progu tieru, `discovery_diffused` raz (gdy
> dyfuzja zaczyna działać), dostęp populacji tylko przy progach.

## 6.10 Environment

-   fertility_changed
-   pollution_increased
-   environmental_quality_changed
-   environmental_shock

## 6.11 Architect

-   intervention_started
-   intervention_modified_conditions
-   intervention_ended

## 6.12 System / historical

-   regional_economic_boom
-   regional_recession
-   structural_transition
-   major_historical_turning_point

------------------------------------------------------------------------

# 7. Fact Granularity

Nie zapisujemy faktu dla każdej minimalnej zmiany.

Przykład:

Cena: `14.20 → 14.21`

nie musi tworzyć publicznego faktu.

System używa progów: - absolute threshold, - relative threshold, -
duration threshold, - significance threshold.

Może istnieć wewnętrzny mikro-fakt lub agregacja, ale historia publiczna
powinna unikać szumu.

------------------------------------------------------------------------

# 8. Fact Aggregation

Seria podobnych zmian może zostać scalona.

Zamiast:

``` text
price +1%
price +2%
price +1%
price +3%
```

tworzymy:

``` text
FACT:
iron_price_sustained_increase
startTick: 410
endTick: 416
change: +18%
```

Agregacja jest szczególnie ważna przy 1000+ latach symulacji.

------------------------------------------------------------------------

# 9. Root Facts

Nie wszystkie fakty mają wcześniejszą przyczynę wewnątrz symulacji.

Root Fact może pochodzić z: - warunków początkowych, - seeda, -
interwencji Architekta, - zewnętrznego zdarzenia, - probabilistycznego
breakthrough wynikającego z kwalifikujących warunków.

Root Fact musi być jawnie oznaczony.

``` yaml
rootCause:
  type: INITIAL_CONDITION | ARCHITECT | EXOGENOUS | STOCHASTIC_TRIGGER
```

------------------------------------------------------------------------

# 10. Przyczyna ≠ korelacja

Causal Edge może powstać tylko wtedy, gdy system wykonujący mutację zna
mechanizm wpływu.

Przykład poprawny:

``` text
food shortage
→ needs satisfaction ↓
```

ponieważ Needs System użył shortage jako wejścia.

Przykład niedopuszczalny:

``` text
nowa kopalnia
→ wzrost urodzeń
```

tylko dlatego, że oba wydarzenia wystąpiły w podobnym czasie.

Jeżeli nie ma mechanizmu, nie tworzymy krawędzi.

------------------------------------------------------------------------

# 11. Causal Edge

Model:

``` yaml
CausalEdge:
  id:
  sourceFactId:
  targetFactId:

  type:
  strength:
  delay:
  scope:
  confidence:

  mechanism:
  system:
  variable:
  contribution:

  architectInfluence:
```

------------------------------------------------------------------------

# 12. Typy krawędzi

Minimalne:

-   DIRECT
-   CONTRIBUTING
-   ENABLING
-   CONSTRAINING
-   AMPLIFYING
-   DAMPENING
-   TRIGGERING
-   SUBSTITUTING
-   DELAYED
-   STRUCTURAL

### DIRECT

Bezpośrednia zmiana wejścia prowadząca do skutku.

### CONTRIBUTING

Jedna z kilku przyczyn.

### ENABLING

Warunek umożliwiający skutek, ale niewystarczający samodzielnie.

### CONSTRAINING

Czynnik ograniczający skalę skutku.

### AMPLIFYING

Zwiększa działanie innej przyczyny.

### DAMPENING

Zmniejsza efekt.

### TRIGGERING

Przekroczenie progu uruchamia decyzję/zdarzenie.

### SUBSTITUTING

Alternatywna przyczyna zastępująca brakującą.

### DELAYED

Efekt pojawia się po czasie.

### STRUCTURAL

Długotrwała cecha świata, np. położenie lub infrastruktura.

------------------------------------------------------------------------

# 13. Strength

`strength` opisuje względną wagę przyczyny dla konkretnego skutku.

Rekomendowana wewnętrzna skala:

`0.0–1.0`

Publiczne poziomy:

``` text
PRIMARY      >= 0.60
SIGNIFICANT  >= 0.30
MINOR        >= 0.10
TRACE        < 0.10
```

Progi są tuningiem, nie absolutnym prawem v0.1.

------------------------------------------------------------------------

# 14. Contribution

Jeżeli system potrafi obliczyć udział czynnika, zapisuje `contribution`.

Przykład Migration Attraction:

``` text
Jobs              +0.31
Expected Wage     +0.22
Services          +0.08
Housing Cost      -0.14
EffectiveDistance -0.09
```

To jest znacznie lepsze niż późniejsze zgadywanie WHY?.

------------------------------------------------------------------------

# 15. Confidence

`confidence` nie oznacza niepewności modelu naukowego.

Oznacza jakość informacji o związku: - 1.0 --- mechanizm bezpośrednio
znany, - niższa wartość --- przyczyna została zagregowana lub
zrekonstruowana z pamięci historycznej.

W świeżym stanie symulacji większość mechanicznych krawędzi powinna mieć
wysokie confidence.

------------------------------------------------------------------------

# 16. Delay

`delay` mierzy różnicę ticków między przyczyną a skutkiem.

Przykład:

``` text
rail connection improved
tick 100
↓
trade expansion
tick 104
↓
new factory
tick 112
↓
migration
tick 118
```

Causality Engine musi zachować takie opóźnienia.

------------------------------------------------------------------------

# 17. Scope

Scope określa zasięg: - entity, - settlement, - region, -
multi-region, - continental, - global.

W VS większość skutków będzie regionalna lub multi-region.

------------------------------------------------------------------------

# 18. Mechanism Metadata

Krawędź powinna wiedzieć, **jaki system faktycznie stworzył wpływ**.

Przykład:

``` yaml
mechanism:
  system: MigrationSystem
  variable: jobs
  contribution: 0.31
```

Pozwala to: - debugować, - budować WHY?, - unikać fałszywych wyjaśnień.

------------------------------------------------------------------------

# 19. Fact Emission Contract

Każdy system dokonujący istotnej mutacji powinien zwracać:

``` text
MutationResult
+
CausalContext
```

Przykład:

``` yaml
MutationResult:
  entityId: region_black_mountain
  variable: population
  before: 220
  after: 238

CausalContext:
  factors:
    - sourceFactId: employment_fact_14
      contribution: 0.41
    - sourceFactId: wage_fact_19
      contribution: 0.27
    - sourceFactId: housing_fact_21
      contribution: -0.11
```

Causality Engine tworzy z tego Fact + Edges.

------------------------------------------------------------------------

# 20. Causal Context bez wcześniejszego Fact

Nie każdy input musi już mieć własny fakt.

Jeśli przyczyną jest stabilny stan strukturalny:

``` text
fertility = high
river access = true
terrain = valley
```

można użyć `StateCauseRef`.

``` yaml
StateCauseRef:
  entityId:
  variable:
  value:
  observedTick:
```

Jeśli staje się historycznie istotny, może zostać wypromowany do
trwałego Root/Structural Fact.

------------------------------------------------------------------------

# 21. Causal Graph

Graf jest skierowany:

``` text
CAUSE → EFFECT
```

Powinien być zasadniczo acykliczny w wymiarze czasu, mimo że symulacja
zawiera feedback loops.

Przykład feedback:

``` text
employment ↑
→ migration ↑
→ demand ↑
→ company expansion
→ employment ↑
```

To nie jest cykl w grafie faktów, ponieważ każde zdarzenie występuje w
innym ticku.

------------------------------------------------------------------------

# 22. Temporal Ordering

Standardowo:

`source.tick <= target.tick`

Krawędź do wcześniejszego faktu jest niedozwolona.

Dla faktów w tym samym ticku decyduje kolejność etapów pipeline.

------------------------------------------------------------------------

# 23. Tick Phase

Fact powinien opcjonalnie przechowywać:

``` yaml
tickPhase:
```

np.: - PRODUCTION - MARKET - TRADE - LABOR - CONSUMPTION - MIGRATION -
TECHNOLOGY

Pozwala to zachować kolejność przyczyn w obrębie miesiąca.

------------------------------------------------------------------------

# 24. Multi-causality

FIRST CAUSE zakłada, że ważne skutki zwykle mają wiele przyczyn.

Przykład:

``` text
Black Mountain population growth
├─ employment ↑
├─ wage ↑
├─ food availability ↑
├─ housing capacity ↑
└─ transport access ↑
```

WHY? nie powinno sprowadzać tego do jednego powodu, jeśli model użył
wielu.

------------------------------------------------------------------------

# 25. Negative Causes

Przyczyna może hamować skutek.

Przykład:

``` text
jobs          +0.42
wages         +0.24
housing cost  -0.28
distance      -0.11
```

WHY? powinno móc pokazać:

> Region przyciągał nowych mieszkańców przede wszystkim dzięki miejscom
> pracy i płacom, ale wzrost był ograniczany przez wysokie koszty
> mieszkania.

------------------------------------------------------------------------

# 26. Threshold Causes

Niektóre skutki powstają dopiero po przekroczeniu progu.

Przykład: `OpportunityScore > startupThreshold`

Causal Graph powinien zapisać: - główne składniki score, - fakt
przekroczenia progu, - decyzję firmy.

------------------------------------------------------------------------

# 27. Decision Facts

Decyzja autonomicznego aktora jest ważnym ogniwem.

Przykład:

``` text
market conditions
→ company_decision_expand
→ capacity increased
```

Nie wolno pomijać decyzji, jeśli jej istnienie poprawia zrozumienie
przyczynowości.

Minimalne decision facts: - company_decision_found -
company_decision_expand - company_decision_contract -
company_decision_close - company_decision_change_pm -
migration_decision_pressure - technology_adoption_decision

Nie wszystkie muszą być widoczne w Chronicle.

------------------------------------------------------------------------

# 28. Decision Snapshot

Przy ważnej decyzji można zapisać:

``` yaml
DecisionSnapshot:
  actorId:
  tick:
  options:
  selected:
  score:
  majorFactors:
```

Przykład:

``` text
OPEN MINE       0.74
DO NOTHING      0.41
OTHER BUSINESS  0.28
```

To umożliwia WHY?:

> Dlaczego powstała kopalnia?

------------------------------------------------------------------------

# 29. WHY? --- cel

WHY? ma zamieniać graf przyczyn na krótkie, czytelne wyjaśnienie.

Nie pokazuje domyślnie całej struktury technicznej.

Odpowiedź składa się z: 1. skutku, 2. głównych przyczyn, 3. czynników
ograniczających, 4. wcześniejszego łańcucha, jeśli potrzebny, 5. wpływu
Architekta, jeśli istnieje.

------------------------------------------------------------------------

# 30. WHY? --- poziomy głębokości

### Level 1 --- Immediate

Bezpośrednie przyczyny.

### Level 2 --- Chain

Przyczyny przyczyn.

### Level 3 --- Historical

Długoterminowy łańcuch.

### Level 4 --- Architect

Ścieżka do interwencji Architekta.

UI może domyślnie pokazywać Level 1--2.

------------------------------------------------------------------------

# 31. WHY? --- przykład ceny

Pytanie:

**Dlaczego cena stali wzrosła?**

Odpowiedź danych:

``` text
Steel price +24%
Primary:
- local steel supply -18%
- iron input cost +21%

Significant:
- demand from construction +13%

Constraint:
- imports limited by transport cost
```

Rozwinięcie:

``` text
Iron input cost ↑
← local ore extraction ↓
← deposit quality ↓
```

------------------------------------------------------------------------

# 32. WHY? --- przykład migracji

**Dlaczego Black Mountain przyciąga ludzi?**

``` text
Primary:
+ mining employment
+ wages above neighboring regions

Significant:
+ growing food availability
+ improving market access

Negative:
- housing costs increased
```

Dalszy łańcuch:

``` text
mining employment
← new mine
← iron deposit discovery
```

------------------------------------------------------------------------

# 33. WHY? --- przykład braku zdarzenia

System powinien docelowo umożliwiać także:

**Dlaczego nie powstała kopalnia?**

Wymaga to Decision Snapshot / Opportunity diagnostics:

``` text
Iron deposit available
BUT:
- expected margin too low
- transport cost too high
- skilled labor insufficient

OpportunityScore 0.43
Required 0.60
```

To jest ważne dla transparentności emergentnej symulacji.

------------------------------------------------------------------------

# 34. Counterfactual WHY?

W pełnej wersji:

> Co musiałoby się zmienić, aby kopalnia powstała?

System może użyć znanych składników decyzji, ale nie powinien symulować
alternatywnego świata „na oko".

W v0.1 wystarczy wskazać największe negatywne czynniki.

------------------------------------------------------------------------

# 35. Butterfly Effect

Butterfly Effect śledzi skutki wywodzące się z interwencji Architekta.

Interwencja tworzy Root Fact:

``` text
architect_intervention_started
```

Następnie jej wpływ propaguje się przez graf.

------------------------------------------------------------------------

# 36. Architect Influence Propagation

Każdy fakt może posiadać:

``` yaml
architect:
  influenced: true
  interventionId:
  influenceStrength:
```

Proponowany model:

`ChildArchitectInfluence = ParentArchitectInfluence × EdgeStrength × PersistenceModifier`

Jeśli istnieje kilka ścieżek, wpływy należy łączyć bez prostego
nieograniczonego sumowania.

Rekomendacja:

`Combined = 1 - Π(1 - pathInfluence_i)`

------------------------------------------------------------------------

# 37. Natural Decay of Influence

Wpływ Architekta powinien zwykle słabnąć wraz z kolejnymi ogniwami.

Nie oznacza to, że daleki skutek jest nieistotny.

Przykład: - interwencja: 1.00 - odkrycie: 0.85 - kopalnia: 0.70 -
migracja: 0.48 - rozwój miasta: 0.31 - późniejsza specjalizacja: 0.17

Wartości są przykładowe.

------------------------------------------------------------------------

# 38. Architect Dominance

Jeżeli skutek miałby prawie na pewno miejsce bez interwencji, wpływ
Architekta powinien być niższy.

Jeżeli interwencja była warunkiem koniecznym, wpływ jest wyższy.

Pełne kontrfaktyczne liczenie nie jest wymagane w v0.1.

W VS wystarczy contribution-based approximation.

------------------------------------------------------------------------

# 39. Multiple Interventions

Jeden fakt może wynikać z kilku interwencji.

Model powinien obsługiwać:

``` yaml
architectInfluences:
  intervention_01: 0.42
  intervention_07: 0.19
```

Nie ograniczać struktury na stałe do jednego interventionId.

W Entity Data Model v0.1 pojedyncze pole można traktować jako skrót VS;
implementacja Causality Engine powinna przygotować mapę wielu wpływów.

------------------------------------------------------------------------

# 40. Butterfly Effect Query

Dla interwencji gracz może zobaczyć:

### Direct effects

-   fertility changed
-   knowledge increased

### First-order consequences

-   production increased
-   discovery occurred

### Second-order

-   firms founded
-   employment increased

### Long-term

-   migration
-   settlement growth
-   structural specialization

------------------------------------------------------------------------

# 41. Butterfly Effect Ranking

Nie pokazujemy tysięcy potomków.

Ranking:

`EffectScore = Significance × ArchitectInfluence × CausalConfidence × Recency/DurationModifier`

Najważniejsze skutki są pokazywane jako: - Major Consequence -
Significant Consequence - Minor Consequence.

------------------------------------------------------------------------

# 42. Causal Significance

Oddzielamy: - historyczne znaczenie zdarzenia, - znaczenie w konkretnym
łańcuchu przyczynowym.

Przykład: mały wzrost ceny może być historycznie nieistotny, ale może
być ważnym ogniwem prowadzącym do bankructwa konkretnej firmy.

------------------------------------------------------------------------

# 43. Historical Significance

Pozostaje zgodne z modelem:

`HistoricalSignificance = Magnitude × Duration × PopulationAffected × GeographicScope × Novelty × CausalImpact`

CausalImpact może uwzględniać: - liczbę istotnych potomków, - ich
znaczenie, - długość oddziaływania.

------------------------------------------------------------------------

# 44. Causal Impact

Nie liczymy surowej liczby potomków, bo prowadziłoby to do eksplozji
wartości.

Rekomendacja:

``` text
CausalImpact =
weighted significant descendants
with depth decay
and duplicate-path suppression
```

------------------------------------------------------------------------

# 45. Causal Memory Problem

200 lat = 2400 ticków.

1000 lat = 12 000 ticków.

Przy tysiącach firm i kohort pełny zapis każdej zmiany może stworzyć
miliony faktów.

Dlatego Causality Engine potrzebuje **Hierarchical Causal Memory**.

------------------------------------------------------------------------

# 46. Hierarchical Causal Memory

Trzy główne poziomy:

## HOT

Szczegółowe fakty.

## WARM

Fakty zagregowane.

## PERMANENT

Najważniejsze historyczne fakty i łańcuchy.

------------------------------------------------------------------------

# 47. HOT Memory

Przechowuje: - pełne źródła, - pełne contributions, - Decision
Snapshots, - dokładne ticki.

Przykładowy okres: ostatnie 5--20 lat.

Dokładny limit zależy od benchmarków.

------------------------------------------------------------------------

# 48. WARM Memory

Starsze mikro-fakty są agregowane.

Przykład:

zamiast 36 miesięcznych price facts:

``` text
steel_price_trend
tick 500–535
+31%
majorCauses:
- iron shortage
- construction boom
```

------------------------------------------------------------------------

# 49. PERMANENT Memory

Zachowuje: - wielkie odkrycia, - narodziny/upadki dużych firm lub
branż, - rozwój/załamanie miast, - resource depletion, - przełomy
technologiczne, - duże migracje, - interwencje Architekta, - ważne
Butterfly chains, - Chronicle anchors.

------------------------------------------------------------------------

# 50. Causal Compression

Kompresja nie może zerwać historii.

Przed:

``` text
A → B → C → D → E
```

Jeśli B/C/D są drobne:

``` text
A → AGGREGATE_BCD → E
```

Aggregate przechowuje: - zakres czasu, - główne mechanizmy, -
zagregowaną siłę, - listę typów zdarzeń, - referencję do ważnych encji.

------------------------------------------------------------------------

# 51. Pruning

Można usuwać: - TRACE facts bez istotnych potomków, - drobne
oscylacje, - powtarzalne mikro-zmiany, - stare decision snapshots bez
historycznego znaczenia.

Nie wolno usuwać faktu, jeśli: - jest źródłem Chronicle Entry, - jest
kluczowym ogniwem Butterfly Effect, - ma wysoki Historical
Significance, - jest jedyną zachowaną przyczyną ważnego faktu.

------------------------------------------------------------------------

# 52. Reference Preservation

Jeśli fakt jest kompresowany, wszystkie ważne referencje muszą zostać
przekierowane do agregatu lub historycznego anchor.

Nie mogą powstawać dangling causal edges.

------------------------------------------------------------------------

# 53. Chronicle Integration

Chronicle pobiera kandydatów z Simulation Facts.

Pipeline:

``` text
Simulation Fact
→ Significance Evaluation
→ Chronicle Candidate
→ Chronicle Selection
→ Chronicle Entry
```

Chronicle Entry zachowuje: - sourceFactIds, - causalEdgeIds, - architect
connection.

------------------------------------------------------------------------

# 54. Chronicle nie jest Causality Engine

Chronicle odpowiada:

> Co warto opowiedzieć?

Causality Engine:

> Co było przyczyną?

Jedno zdarzenie może być ważne przyczynowo, ale nie trafić do Chronicle.

------------------------------------------------------------------------

# 55. Feedback Loop Registry

Causality Engine powinien rozpoznawać znane typy sprzężeń:

-   FL-001 Prosperity
-   FL-002 Urban Crisis
-   FL-003 Resource Boom
-   FL-004 Resource Bust
-   FL-005 Industrialization
-   FL-006 Innovation
-   FL-007 Poverty Trap
-   FL-008 Trade Hub
-   FL-009 War Economy/Destruction
-   FL-010 Environmental Degradation

W VS aktywne przede wszystkim: - Prosperity, - Urban Crisis, - Resource
Boom, - Resource Bust, - Industrialization, - Innovation, - Poverty
Trap, - Trade Hub.

------------------------------------------------------------------------

# 56. Loop Detection

Loop Registry nie powinien tworzyć skutków.

Analizuje istniejące fakty i rozpoznaje wzorzec.

Przykład Resource Boom:

``` text
resource opportunity
→ firm growth
→ employment
→ migration
→ demand
→ investment
→ further firm growth
```

Może utworzyć meta-fakt:

`feedback_loop_resource_boom_detected`

------------------------------------------------------------------------

# 57. Structural Facts

Niektóre przyczyny trwają dziesięciolecia: - port, - położenie na
szlaku, - żyzność, - bogate złoże, - izolacja, - wysoka wiedza.

Zamiast emitować ten sam fakt co tick, tworzymy Structural Fact z
okresem aktywności.

------------------------------------------------------------------------

# 58. Condition Windows

Przyczyna może działać przez zakres:

``` yaml
activeFromTick:
activeToTick:
```

Pozwala odpowiedzieć:

> Wzrost miasta był przez trzy dekady wspierany przez dostęp do taniego
> węgla.

------------------------------------------------------------------------

# 59. Emergent Meta-Facts

Causality Engine może tworzyć agregacyjne meta-fakty tylko na podstawie
już istniejących danych.

Przykłady: - mining_boom, - industrialization_wave, -
prolonged_food_crisis, - trade_hub_emergence, - urban_crisis.

Meta-fakt nie zmienia symulacji.

------------------------------------------------------------------------

# 60. Event Integration

Event może być: - przyczyną, - skutkiem, - agregatem.

Exogenous Event:

``` text
drought
→ grain production ↓
→ food price ↑
```

Emergent Event:

``` text
food shortage + low income + duration
→ prolonged_food_crisis
```

------------------------------------------------------------------------

# 61. Technology Causality

Przykład:

``` text
Knowledge: Mining ↑
+ specialist capacity
+ mining activity
+ discovery prerequisites
→ discovery_occurred
→ improved mine PM available
→ company adoption decision
→ extraction productivity ↑
```

WHY? musi rozróżniać: - odkrycie, - dostępność, - adopcję.

------------------------------------------------------------------------

# 62. Production Causality

Produkcja może zmienić się z powodu: - input availability, - labor, -
energy, - capacity, - demand expectations, - profitability, - Production
Method, - disruption.

Każdy Production Result powinien znać dominujące ograniczenie.

------------------------------------------------------------------------

# 63. Bottleneck Fact

Jeżeli produkcja jest ograniczana przez najwęższe gardło:

``` yaml
productionBottleneck:
  type: INPUT | LABOR | ENERGY | CAPACITY | DEMAND | TRANSPORT
  entityOrGoodId:
  severity:
```

To jest bardzo wartościowe dla WHY?.

------------------------------------------------------------------------

# 64. Market Causality

Zmiana ceny powinna wskazywać: - zmianę podaży, - zmianę popytu, -
inventory, - import, - transport, - oczekiwania/smoothing.

Nie wystarczy:

> Cena wzrosła, bo popyt był większy od podaży.

WHY? powinno umożliwić rozwinięcie: **dlaczego podaż spadła albo popyt
wzrósł.**

------------------------------------------------------------------------

# 65. Migration Causality

Migration Result powinien przechowywać contributions dla: - jobs, -
wages, - safety, - needs, - cultural affinity, - family, - services, -
housing, - effective distance, - border friction, - conflict, -
environment.

Dzięki temu WHY? jest generowane bez zgadywania.

------------------------------------------------------------------------

# 66. Company Causality

Każda strategiczna decyzja firmy przechowuje: - obserwowane warunki, -
prognozę, - score opcji, - wybraną akcję.

To jest szczególnie ważne dla: - founding, - expansion, - closure, - PM
adoption.

------------------------------------------------------------------------

# 67. Settlement Causality

Settlement Stage Change powinien mieć: - population pressure, - jobs, -
housing, - trade, - infrastructure, - services, - persistence/duration.

Zmiana etapu nie może wynikać wyłącznie z przekroczenia liczby ludności,
jeśli model używa więcej warunków.

------------------------------------------------------------------------

# 68. Resource Depletion Causality

Łańcuch:

``` text
cumulative extraction
→ remaining stock ↓
→ quality/accessibility ↓
→ marginal extraction cost ↑
→ profitability ↓
→ production response
```

Pozwala wyjaśnić Resource Bust bez skryptu.

------------------------------------------------------------------------

# 69. Cross-region Causality

Krawędzie mogą łączyć fakty z różnych regionów.

Przykład:

``` text
Food Valley grain surplus
→ exports to Black Mountain
→ food availability ↑
→ migration attraction ↑
```

To jest niezbędne dla globalnej historii.

------------------------------------------------------------------------

# 70. Causal Distance

Oprócz Effective Distance geograficznego istnieje logiczna głębokość:

``` text
causalDepth
```

Interwencja: depth 0.

Bezpośredni skutek: depth 1.

Dalszy: depth 2+.

Używane do: - Butterfly ranking, - pruning, - UI.

------------------------------------------------------------------------

# 71. Causal Path

Struktura odpowiedzi:

``` yaml
CausalPath:
  rootFactId:
  targetFactId:
  edgeIds: []
  totalStrength:
  totalDelay:
  architectInfluence:
```

Może istnieć wiele ścieżek między tymi samymi faktami.

------------------------------------------------------------------------

# 72. Duplicate Path Suppression

Jeśli kilka ścieżek dzieli prawie te same ogniwa, UI nie powinno
pokazywać ich jako niezależnych powodów.

Silnik powinien grupować podobne ścieżki według wspólnego
mechanizmu/root.

------------------------------------------------------------------------

# 73. WHY? Ranking

Dla bezpośrednich przyczyn:

`WhyScore = |Contribution| × Confidence × Relevance × Persistence`

Dla głębszych:

`PathScore = Product/Decay(EdgeStrengths) × RootSignificance × Confidence`

Dokładna formuła będzie tuningowana.

------------------------------------------------------------------------

# 74. WHY? Presentation Contract

Causality Engine zwraca strukturalne dane:

``` yaml
WhyExplanation:
  target:
  summary:
  primaryCauses: []
  significantCauses: []
  limitingFactors: []
  deeperPaths: []
  architectConnections: []
  confidence:
```

Warstwa UI/lokalizacji tworzy tekst.

------------------------------------------------------------------------

# 75. Lokalizacja WHY?

Silnik nie generuje na stałe polskich/angielskich zdań.

Zwraca:

``` text
reason.market.supply_drop
reason.migration.jobs
reason.company.expected_margin
```

plus dane.

Pozwala zachować wielojęzyczność.

------------------------------------------------------------------------

# 76. Debug WHY?

Tryb developerski może pokazywać pełne:

``` text
source fact
edge type
strength
contribution
confidence
tick
system
variable
```

Gracz widzi uproszczoną wersję.

------------------------------------------------------------------------

# 77. Experiment Mode Integration

Dwa światy z tego samego seeda:

``` text
World A — no intervention
World B — intervention
```

Causality Engine umożliwia porównanie: - różniących się faktów, -
pierwszego divergence point, - późniejszych konsekwencji.

------------------------------------------------------------------------

# 78. Divergence Point

Pierwszy istotny stan/fakt, w którym światy się różnią.

Przykład:

``` text
Tick 84:
World A: deposit remains unknown
World B: iron deposit discovered
```

Następnie:

``` text
Tick 97:
B: mine founded
A: no mine
```

------------------------------------------------------------------------

# 79. Counterfactual Attribution

W Experiment Mode możemy mieć silniejsze przypisanie wpływu niż w
pojedynczym świecie.

Jeżeli jedyną różnicą jest interwencja, różnice po divergence point mogą
być śledzone jako kontrfaktyczny Butterfly Effect.

To jest funkcja późniejsza niż podstawowy VS, ale architektura powinna
ją wspierać.

------------------------------------------------------------------------

# 80. Determinism

Causality Engine musi być deterministyczny.

Ten sam świat: - te same Fact IDs w tej samej kolejności lub
deterministyczne ID, - te same edges, - te same scores, - ten sam
pruning przy tych samych progach.

Nie używać systemowego czasu ani niedeterministycznej kolejności
kolekcji.

------------------------------------------------------------------------

# 81. Fact ID

Rekomendacja:

``` text
fact_<tick>_<phase>_<sequence>
```

lub deterministyczny UUID/hash.

ID musi być: - unikalne, - stabilne w danym przebiegu, - łatwe do
debugowania.

------------------------------------------------------------------------

# 82. Storage

Logiczne kolekcje:

``` text
factsById
factsByTick
factsByEntity
factsByRegion
outgoingEdgesByFact
incomingEdgesByFact
factsByIntervention
chronicleAnchors
permanentFacts
```

To są indeksy runtime.

------------------------------------------------------------------------

# 83. Query API

Minimalne operacje:

``` text
getFact(factId)
getFactsForEntity(entityId, range)
getImmediateCauses(factId)
getImmediateEffects(factId)
getWhy(factId, depth)
getArchitectEffects(interventionId)
getCausalPaths(sourceId, targetId)
getMajorHistoricalCauses(entityId)
getMajorHistoricalEffects(factId)
```

------------------------------------------------------------------------

# 84. Causal Query Limits

Każde zapytanie musi mieć: - maxDepth, - maxNodes, - minimumStrength, -
timeRange.

Chroni przed eksplozją grafu.

------------------------------------------------------------------------

# 85. Performance Budget --- zasada

Causality Engine nie może wymagać przeszukiwania całej historii świata
co tick.

Budowa grafu: - lokalna, - inkrementalna, - oparta na znanych
CausalContext.

Cięższe zapytania są wykonywane na żądanie lub na skompresowanych
indeksach.

------------------------------------------------------------------------

# 86. Asynchroniczna prezentacja

Symulacja może zapisać fakty synchronicznie, ale: - budowa rozbudowanego
tekstu WHY?, - historyczne wyszukiwanie, - wizualizacja Butterfly Effect

nie muszą blokować ticka.

------------------------------------------------------------------------

# 87. Failure Modes

## F1 --- Post-hoc storytelling

System zgaduje przyczynę po fakcie.

**Zakazane.**

## F2 --- Correlation edges

Łączenie zdarzeń tylko dlatego, że wystąpiły razem.

**Zakazane.**

## F3 --- Everything causes everything

Zbyt wiele słabych krawędzi.

Mitigacja: - thresholds, - contribution, - pruning.

## F4 --- Single-cause simplification

Ignorowanie multi-causality.

## F5 --- Memory explosion

Brak agregacji.

## F6 --- Architect gets credit for everything

Brak decay/contribution.

## F7 --- Causal chain disappears

Zbyt agresywny pruning.

## F8 --- Chronicle rewrites history

Narracja staje się źródłem prawdy.

**Zakazane.**

------------------------------------------------------------------------

# 88. Invariants Causality Engine

Po każdym ticku:

-   każdy CausalEdge ma istniejący source i target,
-   source nie jest czasowo późniejszy od target,
-   strength jest w poprawnym zakresie,
-   confidence jest w poprawnym zakresie,
-   Fact subject istnieje lub jest poprawną historyczną referencją,
-   Chronicle anchors nie wskazują usuniętych faktów,
-   brak dangling edges,
-   brak nieskończonych wartości,
-   brak causal self-edge,
-   Architect Influence jest w zakresie,
-   pruning zachowuje referencje.

------------------------------------------------------------------------

# 89. Test 1 --- Price WHY?

Wymuś: - spadek podaży Iron, - stabilny popyt.

Oczekiwane: - Iron price ↑, - fact price_increased, - główny edge ze
spadku supply, - WHY? pokazuje podaż jako Primary.

------------------------------------------------------------------------

# 90. Test 2 --- Multi-causal Migration

Warunki: - jobs ↑, - wages ↑, - housing cost ↑.

Oczekiwane: - dodatnia migracja, - jobs/wages jako positive, - housing
jako negative, - ranking zgodny z contributions.

------------------------------------------------------------------------

# 91. Test 3 --- Black Mountain

Minimalny łańcuch:

``` text
deposit discovery
→ mine decision
→ mine founded
→ employment
→ migration
→ settlement growth
```

WHY? dla settlement growth musi móc dojść do deposit discovery.

------------------------------------------------------------------------

# 92. Test 4 --- Butterfly Effect

Interwencja zwiększa szansę odkrycia Iron Ore.

Po 50+ latach: - sprawdzić listę skutków, - wpływ powinien maleć, -
ważne dalsze skutki nadal widoczne, - unrelated facts nie mogą dostać
influence.

------------------------------------------------------------------------

# 93. Test 5 --- No False Causality

Dwa niezależne zdarzenia w tym samym ticku: - odkrycie rudy w A, -
wzrost ceny żywności w B.

Jeśli brak mechanizmu handlowego/przyczynowego: **brak edge.**

------------------------------------------------------------------------

# 94. Test 6 --- Pruning

Wygeneruj wiele lat drobnych price facts.

Po kompresji: - liczba nodes maleje, - trend pozostaje, - ważny
downstream bankruptcy nadal ma ścieżkę do głównej przyczyny.

------------------------------------------------------------------------

# 95. Test 7 --- Save/Load

Po save/load: - Fact IDs, - edges, - causal memory, - Architect
Influence

muszą kontynuować deterministycznie.

------------------------------------------------------------------------

# 96. Test 8 --- WHY? Negative Factor

Region rośnie mimo wysokiego Housing Cost.

WHY? musi pokazać: - główne dodatnie przyczyny, - Housing Cost jako
czynnik hamujący, - nie może stwierdzić, że housing wspierał wzrost.

------------------------------------------------------------------------

# 97. Test 9 --- Technology

Discovery: - Knowledge, - prerequisites, - specialist activity.

Adoption: - osobna decyzja firmy.

WHY? dla wzrostu produktywności musi prowadzić:
`productivity → PM adoption → discovery/availability`, a nie
bezpośrednio `discovery → productivity`.

------------------------------------------------------------------------

# 98. Test 10 --- Resource Bust

``` text
deposit depletion
→ extraction cost ↑
→ mine profitability ↓
→ contraction/closure
→ employment ↓
→ migration outflow
```

System musi zachować ten łańcuch przez wiele lat.

------------------------------------------------------------------------

# 99. Minimalny zakres implementacji VS

W pierwszym Vertical Slice wymagane:

-   SimulationFact,
-   CausalEdge,
-   StateCauseRef,
-   CausalContext,
-   Fact emission,
-   multi-causality,
-   positive/negative contributions,
-   WHY? Immediate,
-   WHY? Chain,
-   Architect Influence,
-   Butterfly Effect basic,
-   HOT/WARM/PERMANENT memory,
-   podstawowa agregacja,
-   pruning,
-   Chronicle integration,
-   debug causal inspector.

------------------------------------------------------------------------

# 100. Zakres późniejszy

Po VS: - pełne counterfactual attribution, - zaawansowane divergence
analysis, - państwa/wojny/dyplomacja, - causal history postaci, -
globalne wielowiekowe meta-patterns, - bardziej zaawansowane loop
detection, - causal comparison wielu światów, - automatyczne historyczne
epoki, - bardziej złożone probabilistyczne confidence models.

------------------------------------------------------------------------

# 101. Kolejność implementacji

## CE-01 --- Fact Infrastructure

-   IDs
-   Fact store
-   indices
-   emission API

## CE-02 --- Causal Context

-   factors
-   contribution
-   StateCauseRef
-   mechanism metadata

## CE-03 --- Edges

-   creation
-   validation
-   incoming/outgoing indices

## CE-04 --- Economy Integration

-   market
-   production
-   company
-   labor

## CE-05 --- Population Integration

-   needs
-   migration
-   settlement

## CE-06 --- Technology Integration

-   discovery
-   availability
-   adoption

## CE-07 --- Architect

-   root facts
-   influence propagation

## CE-08 --- WHY?

-   ranking
-   path traversal
-   explanation model

## CE-09 --- Memory

-   aggregation
-   pruning
-   permanent anchors

## CE-10 --- Chronicle

-   significance
-   candidate handoff

## CE-11 --- Experiment Support

-   divergence metadata

## CE-12 --- Tests

-   Black Mountain
-   resource bust
-   migration
-   technology
-   determinism
-   pruning.

------------------------------------------------------------------------

# 102. Definition of Done --- Fact-producing system

Każdy system FIRST CAUSE produkujący istotne zmiany jest poprawnie
zintegrowany z Causality Engine, jeśli:

1.  identyfikuje zmianę,
2.  zna wejściowe czynniki,
3.  przekazuje contribution tam, gdzie jest dostępne,
4.  emituje SimulationFact,
5.  tworzy sensowne edges,
6.  rozróżnia positive/negative factors,
7.  nie tworzy korelacyjnych edges,
8.  przechodzi WHY? test,
9.  przechodzi determinism test,
10. zachowuje działanie po save/load.

------------------------------------------------------------------------

# 103. Definition of Done --- Causality Engine VS

Causality Engine v0.1 jest gotowy, jeśli:

-   Black Mountain posiada kompletny łańcuch przyczynowy,
-   WHY? wyjaśnia minimum 15 klas zmian wymaganych przez VS,
-   wieloprzyczynowość działa,
-   negatywne czynniki działają,
-   decyzje firm są wyjaśnialne,
-   Technology Discovery i Adoption są rozdzielone,
-   Architect Influence propaguje się,
-   Butterfly Effect pokazuje istotne konsekwencje,
-   unrelated events nie są łączone,
-   200-letnia historia może być kompresowana,
-   Chronicle korzysta z faktów,
-   determinism jest zachowany,
-   save/load nie zrywa grafu,
-   debug inspector pozwala prześledzić pełną ścieżkę.

------------------------------------------------------------------------

# 104. Kluczowa zasada implementacyjna

Najważniejsza reguła całego dokumentu:

> **Nie próbuj odtwarzać przyczyn na podstawie gotowego świata.
> Rejestruj przyczynę w momencie, w którym system podejmuje decyzję lub
> dokonuje mutacji.**

Jeżeli Market System wie, że cena wzrosła przez: - spadek supply, -
wzrost demand, - niski inventory,

to właśnie wtedy powinien przekazać te dane do Causality Engine.

Nie kilka lat później.

------------------------------------------------------------------------

# 105. Ustalenia kanoniczne v0.1

-   Simulation Fact jest podstawową jednostką historii przyczynowej.
-   Causal Edge łączy fakty mechanicznie, nie korelacyjnie.
-   Multi-causality jest domyślna.
-   Przyczyny mogą być dodatnie i ujemne.
-   Każda krawędź może przechowywać strength, contribution, confidence,
    delay i mechanism.
-   Root Facts są jawne.
-   Decision Facts mogą być ogniwem grafu.
-   WHY? ma poziomy głębokości.
-   Butterfly Effect rozpoczyna się od interwencji Architekta.
-   Architect Influence propaguje się i zwykle słabnie.
-   Możliwe są wpływy wielu interwencji.
-   Chronicle nie jest źródłem prawdy.
-   Causal Graph musi działać między regionami.
-   Feedback loops są rozpoznawane w czasie, nie jako cykle tego samego
    ticka.
-   Hierarchical Causal Memory jest obowiązkowe.
-   HOT/WARM/PERMANENT ogranicza wzrost historii.
-   Pruning nie może zerwać ważnych łańcuchów.
-   Causality Engine nie zmienia World State.
-   Ten sam seed i stan dają ten sam graf.
-   Black Mountain jest podstawowym benchmarkiem.

------------------------------------------------------------------------

# 106. Następny dokument

Po Causality Engine Spec najbardziej logiczny jest:

**`FIRST-CAUSE-AI-Decision-Model-v0.1.md`**

Powinien szczegółowo zdefiniować: - Company AI, - Entrepreneurship, -
oczekiwania, - scoring decyzji, - inwestycje, - zatrudnienie, -
zamykanie firm, - zmianę Production Methods, - reakcję na rynek, -
później State AI, - oraz sposób przekazywania `DecisionSnapshot` i
`CausalContext` do Causality Engine.

Dzięki temu trzy najważniejsze warstwy będą spięte:

``` text
SIMULATION
→ AUTONOMOUS DECISIONS
→ CAUSAL MEMORY
```

------------------------------------------------------------------------

# 107. Kryterium końcowe

Causality Engine spełnia swoją rolę, jeżeli po 100 latach gracz może
kliknąć rozwinięte miasto i zapytać:

> **Dlaczego to miasto istnieje?**

A system potrafi odpowiedzieć na podstawie rzeczywistych danych:

``` text
Miasto rozwinęło się przede wszystkim dzięki wieloletniemu wzrostowi zatrudnienia
w górnictwie i hutnictwie.

Rozwój tych branż rozpoczął się po odkryciu lokalnego złoża rudy żelaza.

Rosnąca populacja zwiększyła popyt na żywność i budownictwo, co uruchomiło handel
z sąsiednimi regionami i dalszy rozwój lokalnych firm.

Wzrost był częściowo ograniczany przez wysokie koszty mieszkań.

Odkrycie złoża było pośrednio związane z interwencją Architekta sprzed 83 lat.
```

I każde zdanie tej odpowiedzi musi dać się prześledzić do konkretnych
faktów, decyzji i zmian stanu symulacji.

> **FIRST CAUSE nie tylko symuluje historię. FIRST CAUSE pamięta,
> dlaczego ta historia się wydarzyła.**

**KONIEC --- FIRST CAUSE Causality Engine Spec v0.1**
