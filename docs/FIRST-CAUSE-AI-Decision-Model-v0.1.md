# FIRST CAUSE --- AI Decision Model v0.1

**Status:** wersja robocza / kanoniczna specyfikacja autonomicznych
decyzji aktorów\
**Projekt:** FIRST CAUSE\
**Wersja dokumentu:** 0.1\
**Rola:** zdefiniowanie wspólnego modelu podejmowania decyzji przez
autonomicznych aktorów świata, ze szczególnym naciskiem na firmy,
przedsiębiorczość, zatrudnienie, inwestycje, Production Methods oraz
integrację z Causality Engine.

**Dokumenty nadrzędne i powiązane:** -
`FIRST-CAUSE-koncepcja-architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` -
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` (brak w repo; zob. Canonical Decisions §199) -
`FIRST-CAUSE-Entity-Data-Model-v0.1.md` -
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` -
`FIRST-CAUSE-Causality-Engine-Spec-v0.1.md`

------------------------------------------------------------------------

# 0. Cel dokumentu

FIRST CAUSE wymaga autonomicznego świata, w którym firmy, gospodarstwa
domowe, migranci, przedsiębiorcy, a później państwa i inne organizacje
reagują na warunki bez bezpośredniego sterowania przez Architekta.

AI Decision Model definiuje:

-   co aktor obserwuje,
-   jak buduje oczekiwania,
-   jakie opcje rozważa,
-   jak ocenia opcje,
-   jak uwzględnia ryzyko i niepełną informację,
-   jak podejmuje decyzję,
-   jak wykonuje działanie,
-   jak ocenia jego wynik,
-   jak zapisuje uzasadnienie decyzji dla Causality Engine.

Fundamentalna pętla:

`OBSERVE → FORECAST → GENERATE OPTIONS → SCORE → DECIDE → ACT → EVALUATE → LEARN/ADAPT`

Celem nie jest stworzenie „genialnego AI".

Celem jest stworzenie aktorów: - logicznych, - ograniczonych, -
lokalnych, - przewidywalnych w mechanizmie, - nie zawsze optymalnych, -
zdolnych do tworzenia emergentnej historii.

------------------------------------------------------------------------

# 1. Fundamentalna zasada

> **Aktor nie zna World State. Aktor zna tylko swój Perceived World
> State.**

Firma nie może podejmować decyzji na podstawie informacji, których nie
powinna posiadać.

Przykład:

Firma w Black Mountain może znać: - lokalne ceny, - własne koszty, -
lokalne płace, - dostępne złoża, - pobliskie rynki, - znane technologie.

Nie powinna automatycznie znać: - nieodkrytych złóż, - dokładnych cen w
całym świecie, - przyszłych odkryć, - przyszłych interwencji Architekta.

------------------------------------------------------------------------

# 2. Determinizm

AI musi być deterministyczne dla: - tego samego seeda, - tego samego
stanu, - tej samej wiedzy aktora, - tej samej wersji contentu.

Losowość jest dozwolona wyłącznie przez seeded RNG.

Nie używać: - systemowego czasu, - losowej kolejności iteracji, -
niedeterministycznych UUID przy decyzjach, - ukrytych globalnych
randomów.

------------------------------------------------------------------------

# 3. AI nie jest jednym globalnym mózgiem

Nie istnieje centralny „AI Director", który wybiera historię świata.

Decyzje powstają lokalnie.

Przykład:

``` text
Region A
├─ Company 1
├─ Company 2
├─ Entrepreneurs
├─ Cohorts
└─ Settlement pressures

Region B
├─ Company 3
├─ Company 4
└─ Entrepreneurs
```

Globalny rezultat jest sumą i interakcją lokalnych decyzji.

------------------------------------------------------------------------

# 4. Rodziny autonomicznych aktorów

Docelowo:

1.  Companies
2.  Entrepreneurs / Potential Entrants
3.  Population Cohorts / Households
4.  Migrants
5.  Settlements --- jako system adaptacyjny
6.  States
7.  Institutions
8.  Trade actors / logistics
9.  Historical Characters --- później

W Vertical Slice priorytet: - Company AI, - Entrepreneurship AI, - Labor
decisions, - Migration decisions, - Technology Adoption.

State AI pozostaje specyfikowane jako przyszłe rozszerzenie.

------------------------------------------------------------------------

# 5. Wspólny Decision Pipeline

Każdy aktor korzysta z logicznie podobnego procesu:

``` text
1. OBSERVE
2. UPDATE MEMORY
3. FORECAST
4. IDENTIFY PRESSURES / OPPORTUNITIES
5. GENERATE OPTIONS
6. CHECK HARD CONSTRAINTS
7. SCORE OPTIONS
8. APPLY BEHAVIORAL MODIFIERS
9. SELECT ACTION
10. ACT
11. RECORD DECISION
12. EVALUATE LATER
```

Nie każdy aktor musi wykonywać każdy etap co tick.

------------------------------------------------------------------------

# 6. OBSERVE

Aktor zbiera dostępne informacje.

Firma obserwuje m.in.: - własny cash, - inventory, - capacity, -
production, - revenue, - costs, - profit, - local prices, - input
prices, - wages, - labor availability, - demand, - shortages, -
transport cost, - nearby markets, - known technologies, -
infrastructure, - competition.

------------------------------------------------------------------------

# 7. Perceived State

Obserwacja jest zapisywana jako:

``` yaml
PerceivedState:
  actorId:
  tick:
  observations:
  confidence:
  informationAge:
```

Niektóre informacje mogą być: - dokładne, - opóźnione, - przybliżone.

VS może zaczynać od wysokiej jakości lokalnej informacji.

------------------------------------------------------------------------

# 8. Information Locality

Domyślnie: - lokalny region --- wysoka jakość, - sąsiedni region ---
dobra/średnia, - odległy region --- słabsza, - nieznany region --- brak.

Rozwój komunikacji i infrastruktury może później poprawiać dostęp do
informacji.

------------------------------------------------------------------------

# 9. Memory

Aktor posiada krótką pamięć trendów.

Przykład:

``` yaml
ActorMemory:
  priceHistory:
  demandHistory:
  profitHistory:
  wageHistory:
  shortageHistory:
  decisionHistory:
```

Nie przechowujemy pełnej historii świata w każdym aktorze.

------------------------------------------------------------------------

# 10. Expectations

Aktor nie reaguje wyłącznie na bieżący miesiąc.

Tworzy oczekiwania.

Przykład:

`ExpectedPrice = weighted recent price + trend adjustment`

`ExpectedDemand = recent demand × trend modifier`

`ExpectedInputCost = recent input cost + observed pressure`

Dokładne formuły będą tuningowane.

------------------------------------------------------------------------

# 11. Wolniejsza reakcja

Zgodnie z filozofią Simulation Model reakcje gospodarcze nie powinny być
natychmiastowe.

Stosujemy: - smoothing, - decision cooldown, - persistence threshold, -
confidence threshold, - adjustment rate.

Jednomiesięczny skok ceny nie powinien automatycznie powodować budowy
fabryki.

------------------------------------------------------------------------

# 12. Opportunity

Opportunity oznacza warunki sprzyjające działaniu.

Przykłady: - niedobór dobra, - wysoka marża, - tanie inputy, - dostępny
zasób, - rosnąca populacja, - nowe połączenie handlowe, - nowa
technologia.

------------------------------------------------------------------------

# 13. Pressure

Pressure oznacza presję na zmianę.

Przykłady: - strata finansowa, - brak inputu, - brak pracowników, -
spadający popyt, - konkurencja, - rosnące koszty, - wyczerpywanie złoża.

Opportunity i Pressure mogą działać jednocześnie.

------------------------------------------------------------------------

# 14. Hard Constraints

Opcja zostaje odrzucona przed scoringiem, jeśli nie spełnia warunków
koniecznych.

Przykłady: - brak wymaganej technologii, - brak minimalnego kapitału, -
brak dostępu do zasobu, - brak infrastruktury, - brak
miejsca/capacity, - Production Method niedostępny, - firma nie może
fizycznie wykonać akcji.

AI nie powinno punktować niemożliwych działań.

------------------------------------------------------------------------

# 15. Soft Constraints

Soft constraints obniżają score, ale nie blokują decyzji.

Przykład: - droga praca, - odległy rynek, - średnia rentowność, - ryzyko
niedoboru, - słaba infrastruktura.

------------------------------------------------------------------------

# 16. Utility / Score

Każda opcja otrzymuje score.

Ogólny model:

`OptionScore = ExpectedBenefit - ExpectedCost - Risk + StrategicValue + PressureRelief`

Wartości są normalizowane.

Nie istnieje jedna uniwersalna formuła dla wszystkich decyzji.

------------------------------------------------------------------------

# 17. Behavioral Modifiers

Aktorzy mogą różnić się zachowaniem bez skomplikowanej psychologii.

Przykładowe parametry: - riskTolerance, - growthPreference, -
patience, - informationQuality, - innovationPreference, -
financialConservatism.

Zakres rekomendowany: `0.0–1.0`

------------------------------------------------------------------------

# 18. Ograniczona racjonalność

Aktor nie musi zawsze wybierać matematycznie najlepszej opcji.

Może: - nie posiadać pełnych danych, - przeceniać ostatnie trendy, -
działać z opóźnieniem, - preferować znaną technologię, - zachowywać
rezerwę gotówkową.

To tworzy naturalną różnorodność bez losowego chaosu.

------------------------------------------------------------------------

# 19. Hysteresis

Aby zapobiec oscylacji:

próg rozpoczęcia działania może być inny niż próg jego cofnięcia.

Przykład: - firma zwiększa produkcję przy score \> 0.70, - zmniejsza
dopiero przy score \< 0.40.

Zapobiega:

`expand → contract → expand → contract`

co miesiąc.

------------------------------------------------------------------------

# 20. Decision Cooldown

Duże decyzje mają cooldown.

Przykład: - zmiana produkcji --- krótki, - hiring --- krótki, - PM
adoption --- średni, - expansion --- długi, - founding ---
jednorazowy, - closure --- decyzja końcowa.

------------------------------------------------------------------------

# 21. Persistence Requirement

Duże inwestycje mogą wymagać utrzymywania się okazji przez N ticków.

Przykład:

``` text
ExpectedMargin > threshold
przez 6 miesięcy
→ expansion becomes eligible
```

------------------------------------------------------------------------

# 22. Company AI --- cykl

Kanoniczny:

`OBSERVE → FORECAST → DECIDE → ACT → EVALUATE`

Firma analizuje kolejno: 1. survival, 2. inputs, 3. labor, 4.
production, 5. market, 6. profitability, 7. capacity, 8. technology, 9.
growth.

------------------------------------------------------------------------

# 23. Priorytet przetrwania firmy

Firma najpierw próbuje przetrwać.

Jeżeli: - cash bardzo niski, - straty trwają, - brak inputów, - brak
popytu,

priorytetem jest: - ograniczenie produkcji, - redukcja kosztów, -
zwolnienia, - zmiana PM, - czasowe zatrzymanie, - closure.

Nie inwestycja w ekspansję.

------------------------------------------------------------------------

# 24. Company Financial Health

Minimalne wskaźniki:

``` text
cash
revenue
operatingCost
profit
profitMargin
cashRunway
debt — później
inventoryValue
capacityUtilization
```

------------------------------------------------------------------------

# 25. Production Decision

Opcje: - STOP - REDUCE - MAINTAIN - INCREASE

Score zależy od: - expected demand, - expected price, - input
availability, - input cost, - labor, - inventory, - capacity, - expected
margin.

------------------------------------------------------------------------

# 26. Target Production

Firma wyznacza:

`TargetProduction`

a następnie zbliża się do celu przez Adjustment Rate.

Nie skacze natychmiast z 10% do 100% capacity bez uzasadnienia.

------------------------------------------------------------------------

# 27. Production Bottleneck

Przed wykonaniem produkcji firma identyfikuje: - INPUT, - LABOR, -
ENERGY, - CAPACITY, - DEMAND, - TRANSPORT.

Bottleneck trafia do CausalContext.

------------------------------------------------------------------------

# 28. Inventory Decision

Firma posiada: - target inventory, - minimum buffer, - maximum
economical stock.

Niski inventory: - zwiększa produkcję/import.

Wysoki: - zmniejsza produkcję.

Towary mają różne storage properties.

------------------------------------------------------------------------

# 29. Hiring Decision

Firma zatrudnia, jeśli: - target production wymaga więcej pracy, -
oczekiwany dodatkowy przychód uzasadnia koszt, - dostępna jest
odpowiednia siła robocza.

------------------------------------------------------------------------

# 30. Wage Offer

Firma może podnieść wage offer, gdy: - vacancies utrzymują się, - labor
shortage rośnie, - utracona produkcja jest droższa niż wyższa płaca.

Może obniżyć, gdy: - nadpodaż pracy, - presja finansowa, - lokalne płace
spadają.

Zmiany są ograniczone miesięcznie.

------------------------------------------------------------------------

# 31. Layoff Decision

Zwolnienia mogą wynikać z: - spadku produkcji, - braku inputów, -
trwałego spadku popytu, - zmiany PM, - kryzysu finansowego.

Firma nie powinna zwalniać i zatrudniać tych samych pracowników co tick.

------------------------------------------------------------------------

# 32. Expansion Decision

Expansion staje się opcją, jeśli: - capacity utilization wysokie, -
demand trwały, - expected margin dodatni, - cash wystarczający, -
labor/input outlook akceptowalny.

Score:

`ExpansionScore = DemandPersistence + Margin + CapacityPressure + MarketGrowth - CapitalCost - InputRisk - LaborRisk - MarketRisk`

------------------------------------------------------------------------

# 33. Contraction

Firma może zmniejszyć capacity lub działalność, jeśli: - długotrwale
niskie wykorzystanie, - trwałe straty, - strukturalny spadek popytu.

Contraction jest mniej skrajne niż closure.

------------------------------------------------------------------------

# 34. Closure

Closure wymaga silniejszych warunków niż miesięczna strata.

Przykładowe czynniki: - bardzo niski cash runway, - trwała
nierentowność, - brak perspektywy inputu, - trwały brak popytu, -
niekonkurencyjna technologia.

------------------------------------------------------------------------

# 35. Bankruptcy

Bankruptcy jest wymuszoną konsekwencją niewypłacalności, jeśli firma nie
może pokryć zobowiązań/operacji.

W prostym VS: - brak złożonego długu, - bankructwo może wynikać z utraty
płynności.

------------------------------------------------------------------------

# 36. Production Method Adoption

Firma nie zmienia PM dlatego, że „odkryto lepszą technologię".

Cykl:

`Discovery → Availability → Firm Evaluation → Adoption`

------------------------------------------------------------------------

# 37. PM Evaluation

Firma porównuje:

``` text
Current PM
Candidate PM
```

Pod względem: - output, - labor, - skills, - energy, - inputs, - capital
conversion cost, - expected prices, - infrastructure, - risk.

------------------------------------------------------------------------

# 38. PM Adoption Score

Przykład:

`PMScore = ExpectedProductivityGain + LaborSavingValue + InputSavingValue + QualityGain - ConversionCost - SkillGap - EnergyRisk - InputRisk - Uncertainty`

Adopcja wymaga: - dodatniej przewagi, - minimalnego confidence, -
dostępnego kapitału.

------------------------------------------------------------------------

# 39. Technologia może być nieopłacalna

Nowy PM może nie zostać przyjęty, gdy: - praca jest bardzo tania, -
wymagany input jest drogi, - brakuje specjalistów, - energia jest
droga, - inwestycja ma zbyt długi zwrot.

To jest celowe.

------------------------------------------------------------------------

# 40. Early Adopters

`innovationPreference` może obniżać wymagany próg adopcji.

Konserwatywne firmy czekają na: - większą przewagę, - większą
dostępność, - dowód skuteczności.

------------------------------------------------------------------------

# 41. Learning from Adoption

Po zmianie PM firma ocenia wynik.

Jeżeli: - productivity wzrosła, - profit poprawił się,

confidence rośnie.

Może to później wpływać na dyfuzję technologii w regionie.

------------------------------------------------------------------------

# 42. Entrepreneurship AI

Nowe firmy nie są generowane losowo.

System ocenia możliwości gospodarcze.

Kanonicznie:

`OpportunityScore = DemandGap + ExpectedMargin + ResourceAccess + LaborAvailability + SkillAvailability + MarketAccess - Competition - Risk - CapitalRequirement`

------------------------------------------------------------------------

# 43. Opportunity Scanner

Nie tworzymy osobnego przedsiębiorcy-NPC dla każdej możliwości.

Region okresowo wykonuje Opportunity Scan dla: - company archetypes, -
możliwych Production Recipes, - lokalnych i dostępnych rynków.

------------------------------------------------------------------------

# 44. Candidate Opportunities

Nie oceniamy każdej kombinacji świata.

Kandydaci powstają na podstawie: - lokalnego niedoboru, - zasobu, -
importu, - eksportowej przewagi, - rosnącej populacji, - nowej
technologii, - nowej infrastruktury.

------------------------------------------------------------------------

# 45. Founding Decision

Nowa firma powstaje dopiero, jeśli: - hard requirements spełnione, -
OpportunityScore \> threshold, - opportunity trwa wystarczająco długo, -
dostępny jest kapitał/entrepreneurial capacity.

------------------------------------------------------------------------

# 46. Capital Formation

W VS kapitał przedsiębiorczy może pochodzić z uproszczonej puli: - local
wealth, - retained economic surplus, - existing entrepreneurial
capacity.

Nie tworzymy pieniędzy z niczego.

Dokładny system finansowania zostanie rozwinięty później.

------------------------------------------------------------------------

# 47. Competition

OpportunityScore spada wraz z: - liczbą konkurentów, - niewykorzystaną
capacity konkurencji, - niską marżą sektora.

Ale wysoka konkurencja nie blokuje wejścia absolutnie.

------------------------------------------------------------------------

# 48. Resource-based Entrepreneurship

Przykład Black Mountain:

``` text
Iron discovered
+ iron demand high
+ transport acceptable
+ labor available
→ Mine OpportunityScore rises
```

Dopiero po przekroczeniu progu: `company_founded`.

------------------------------------------------------------------------

# 49. Market-gap Entrepreneurship

Firma może powstać bez lokalnego surowca.

Przykład: - rośnie populacja, - brak lokalnej piekarni, - Grain/Flour
można importować.

Powstaje lokalny Food Processor.

------------------------------------------------------------------------

# 50. Export Entrepreneurship

Region może tworzyć firmę nastawioną na eksport, jeśli: - posiada
przewagę kosztową, - istnieje dostępny zewnętrzny popyt, - transport
jest opłacalny.

------------------------------------------------------------------------

# 51. Company Location Decision

Jeżeli archetyp może powstać w kilku regionach:

`LocationScore = ResourceAccess + MarketAccess + Labor + Skills + Infrastructure + Transport + LocalDemand - Costs - Risk`

W VS można ograniczyć skan do regionu i jego otoczenia.

------------------------------------------------------------------------

# 52. Transport Company AI

Transport Company reaguje na: - niewykorzystany trade opportunity, -
wysokie transport costs, - congestion, - wolumen przepływów.

Może: - zwiększać capacity, - wejść na trasę, - wycofać się.

W pierwszym VS część transport capacity może być systemowa, ale
interfejs AI powinien być zgodny z późniejszym autonomicznym operatorem.

------------------------------------------------------------------------

# 53. Construction Company AI

Construction reaguje na: - housing pressure, - infrastructure demand, -
settlement growth, - dostępność materiałów, - ceny.

Nie buduje automatycznie tylko dlatego, że osada rośnie.

------------------------------------------------------------------------

# 54. Household Decision Model

Gospodarstwa nie wymagają złożonego strategicznego AI.

Ich główne decyzje: - consumption allocation, - savings, - labor
participation, - migration pressure.

------------------------------------------------------------------------

# 55. Consumption

Kolejność:

`Survival → Basic → Services → Comfort → Prosperity → Luxury → Savings`

Budżet jest ograniczony dochodem i majątkiem.

Brak pieniędzy oznacza niezaspokojony popyt, a nie magiczny zakup.

------------------------------------------------------------------------

# 56. Substitution

Jeżeli preferowane dobro jest: - zbyt drogie, - niedostępne,

gospodarstwo może użyć substytutu, jeśli istnieje w Production Economy
Master.

Substitution nie może powstać bez definicji danych.

------------------------------------------------------------------------

# 57. Labor Participation

Kohorta może zwiększać podaż pracy zależnie od: - wieku, - klasy, -
potrzeb, - dostępności pracy, - płac.

VS może stosować uproszczone współczynniki.

------------------------------------------------------------------------

# 58. Migration Decision Model

Migracja nie jest jednym globalnym ruchem.

Kohorta ocenia dostępne destinations.

`MigrationAttraction = Jobs + ExpectedWage + Safety + NeedsAvailability + CulturalAffinity + FamilyConnections + Services - HousingCost - EffectiveDistance - BorderFriction - Conflict - EnvironmentalRisk`

------------------------------------------------------------------------

# 59. Migration Candidate Set

Nie porównujemy każdego regionu z każdym.

Kandydaci: - regiony sąsiednie, - regiony osiągalne przez aktywne
szlaki, - ważne znane centra.

To ogranicza koszt obliczeń i wspiera lokalność.

------------------------------------------------------------------------

# 60. Migration Friction

Nawet atrakcyjny region nie przyciąga całej populacji natychmiast.

Stosujemy: - migration propensity, - distance friction, - household
inertia, - capacity, - seeded probability.

------------------------------------------------------------------------

# 61. Settlement Adaptation

Settlement nie jest klasycznym aktorem decyzyjnym.

Jego rozwój wynika z presji:

`SettlementPressure = Population + Jobs + Trade + Services + Infrastructure + HousingDemand - Constraints`

Stage change wymaga: - threshold, - persistence, - capacity.

------------------------------------------------------------------------

# 62. Knowledge / Discovery Decision Boundary

Discovery nie jest decyzją firmy.

Discovery Engine ocenia: - Knowledge, - prerequisites, - activity, -
pressure, - seeded breakthrough.

Firma dopiero decyduje o Adoption.

To rozdzielenie jest kanoniczne.

------------------------------------------------------------------------

# 63. State AI --- architektura docelowa

Po Vertical Slice państwo używa:

`OBSERVE → PRIORITIZE → BUDGET → POLICY → EVALUATE`

State AI nie jest aktywnym elementem podstawowego VS.

------------------------------------------------------------------------

# 64. State Priorities

Docelowe presje: - food security, - employment, - fiscal health, -
infrastructure, - defense, - social stability, - trade, - technology, -
resource security.

------------------------------------------------------------------------

# 65. State Budget

Państwo nie może finansować wszystkiego.

Budżet tworzy trade-offs między: - infrastructure, - administration, -
defense, - services, - development.

System pozostaje poza VS v0.1 runtime.

------------------------------------------------------------------------

# 66. State Policy Decisions

Docelowo: - taxes, - tariffs, - infrastructure investment, -
education, - resource policy, - trade policy, - development programs.

Nie implementować na zapas poza interfejsami danych wymaganymi przez
architekturę.

------------------------------------------------------------------------

# 67. Decision Snapshot

Każda istotna decyzja autonomiczna może wygenerować:

``` yaml
DecisionSnapshot:
  id:
  actorId:
  tick:
  decisionType:

  perceivedStateRef:

  options:
    - action:
      hardEligible:
      score:
      expectedBenefit:
      expectedCost:
      risk:
      majorFactors:

  selectedAction:
  selectedScore:

  thresholds:
  cooldown:

  causalContext:
```

------------------------------------------------------------------------

# 68. Które decyzje wymagają Snapshot

Obowiązkowo w VS: - company_founding, - company_expansion, -
company_contraction, - company_closure, - production_method_adoption.

Opcjonalnie/agregowane: - production adjustment, - hiring, - wage
adjustment.

Nie zapisujemy ogromnego Snapshot dla każdej drobnej konsumpcji
gospodarstwa.

------------------------------------------------------------------------

# 69. CausalContext

Decyzja przekazuje do Causality Engine rzeczywiste czynniki.

Przykład:

``` yaml
causalContext:
  factors:
    - key: expected_margin
      contribution: 0.34
    - key: iron_resource_access
      contribution: 0.25
    - key: labor_availability
      contribution: 0.16
    - key: transport_cost
      contribution: -0.12
```

------------------------------------------------------------------------

# 70. Decision Fact

Po wyborze istotnej akcji może powstać:

`company_decision_found`

Następnie:

`company_decision_found → company_founded`

Pozwala rozdzielić: - warunki, - decyzję, - rezultat.

------------------------------------------------------------------------

# 71. Nieudana decyzja

Aktor może podjąć działanie, które okaże się błędne.

Przykład: - firma inwestuje, - popyt później spada, - inwestycja
generuje straty.

AI nie może znać przyszłości.

To ważne dla emergentnej historii.

------------------------------------------------------------------------

# 72. Expected vs Actual

Dla dużych decyzji zapisujemy:

``` text
expectedOutcome
actualOutcome
```

Po czasie EVALUATE może utworzyć: - decision_success, -
decision_underperformed, - decision_failed.

Nie musi być publicznym Chronicle eventem.

------------------------------------------------------------------------

# 73. Adaptation

Firma może dostosować parametry reakcji na podstawie wyników.

W v0.1 adaptacja powinna być ograniczona.

Przykład: - seria udanych inwestycji → niewielki wzrost confidence, -
seria strat → większa ostrożność.

Nie implementujemy uczenia maszynowego.

------------------------------------------------------------------------

# 74. Brak ML/LLM w logice decyzji

Core simulation AI jest: - regułowe, - scoringowe, - deterministyczne, -
data-driven.

LLM nie może być wymagany do działania świata.

Narracja może być osobną warstwą, ale nie źródłem decyzji.

------------------------------------------------------------------------

# 75. Actor Archetype Parameters

Definicja firmy może zawierać domyślne:

``` yaml
decisionProfile:
  riskTolerance:
  growthPreference:
  patience:
  innovationPreference:
  inventoryPreference:
  cashReservePreference:
```

Instancja może mieć niewielkie odchylenia seeded.

------------------------------------------------------------------------

# 76. Heterogeniczność firm

Dwie podobne firmy nie muszą reagować identycznie.

Różnice mogą wynikać z: - cash, - capacity, - PM, - workforce, -
lokalizacji, - memory, - decision profile.

Nie potrzebujemy losowych „osobowości" bez mechanicznego znaczenia.

------------------------------------------------------------------------

# 77. Decision Frequency

Nie wszystkie decyzje co miesiąc.

Przykładowo:

### co tick

-   production,
-   inventory,
-   basic hiring.

### co kilka ticków

-   wage strategy,
-   market expansion.

### rzadziej

-   capacity expansion,
-   PM adoption,
-   closure review.

Częstotliwości są tuningiem.

------------------------------------------------------------------------

# 78. Staggered Evaluation

Aby uniknąć skoku CPU, strategiczne decyzje firm mogą być
deterministycznie rozłożone między tickami.

Przykład: `hash(companyId) % reviewInterval`

Nie zmienia to deterministyczności.

------------------------------------------------------------------------

# 79. Globalne fale bez globalnego skryptu

Jeśli wiele firm widzi podobne warunki, mogą równolegle reagować.

Przykład: - Coal drożeje, - wiele hut ocenia alternatywy, - część
zmniejsza produkcję, - część podnosi ceny, - część adoptuje lepszy PM.

Powstaje globalna fala emergentnie.

------------------------------------------------------------------------

# 80. Competition Feedback

Ekspansja jednej firmy zmienia warunki innych:

``` text
Firm A expands
→ supply ↑
→ price pressure ↓
→ expected margin of Firm B ↓
→ Firm B cancels expansion
```

Nie potrzeba bezpośredniego „AI kontra AI".

Rynek jest medium interakcji.

------------------------------------------------------------------------

# 81. Labor Competition

Podobnie:

``` text
Mine hires
→ local labor availability ↓
→ wages ↑
→ other companies' costs ↑
→ hiring/production decisions change
```

To ważny feedback Black Mountain.

------------------------------------------------------------------------

# 82. Resource Competition

Wiele firm może konkurować o: - ten sam deposit, - dostępne extraction
capacity, - lokalny resource flow.

Nie wolno podwójnie wydobywać tej samej fizycznej ilości zasobu.

------------------------------------------------------------------------

# 83. Trade Opportunity Feedback

Nowa trasa może: - otworzyć import, - obniżyć lokalne ceny, - zaszkodzić
lokalnym producentom, - umożliwić eksport innym.

AI reaguje na zmieniony rynek, nie na abstrakcyjny event „globalizacja".

------------------------------------------------------------------------

# 84. Anti-Exploit / Anti-Explosion Rules

System musi zapobiegać: - tworzeniu setek mikrofirm przy minimalnym
niedoborze, - natychmiastowym wejściom/wyjściom, - inwestowaniu całego
cash, - nieskończonemu podbijaniu płac, - ciągłej zmianie PM, - perfect
foresight.

------------------------------------------------------------------------

# 85. Minimum Economic Scale

Nowa firma wymaga minimalnej ekonomicznej skali.

Jeśli popyt wystarcza na 0.1 jednostki produkcji, nie tworzymy pełnej
firmy.

Może pozostać niezaspokojony popyt lub działalność lokalna/agregowana.

------------------------------------------------------------------------

# 86. Local Business Layer

Małe potrzeby mogą być obsługiwane przez `Local Business` jako bardziej
zagregowany archetyp.

Pozwala uniknąć eksplozji liczby encji.

------------------------------------------------------------------------

# 87. Major Company Promotion

Firma może przejść: `Local Business → Company → Major Company`

na podstawie: - scale, - workforce, - market reach, - historical
significance.

To nie zmienia podstawowego modelu decyzji.

------------------------------------------------------------------------

# 88. Firm Death and Replacement

Upadek firmy nie oznacza permanentnego braku branży.

Jeśli warunki później ponownie staną się korzystne, Opportunity Scanner
może stworzyć nowego entrant.

------------------------------------------------------------------------

# 89. Path Dependence

Decyzje zmieniają przyszłe możliwości.

Przykład:

``` text
Mine founded
→ migration
→ skills accumulate
→ infrastructure improves
→ steelworks becomes viable
```

AI nie potrzebuje osobnej reguły „industrializuj region".

------------------------------------------------------------------------

# 90. Black Mountain --- AI flow

## Faza 1

Iron Ore jest nieznane.

Mine opportunity: `ineligible`.

## Faza 2

Złoże zostaje odkryte.

Opportunity Scanner tworzy candidate: `Mine`.

## Faza 3

Ocena: - resource access + - iron demand + - expected margin + -
labor + - transport - - capital cost -

## Faza 4

Jeśli score przekracza threshold przez wymagany czas:
`company_decision_found`.

## Faza 5

Mine powstaje.

## Faza 6

Mine ustala TargetProduction i hiring.

## Faza 7

Nowe jobs wpływają na migration.

## Faza 8

Wyczerpywanie złoża podnosi koszt.

## Faza 9

Mine może: - adoptować Improved Mine, - ograniczyć production, -
importować brakujące inputy pomocnicze, - zamknąć się.

Historia nie jest skryptowana.

------------------------------------------------------------------------

# 91. Black Mountain --- możliwy błąd AI

Jeżeli transport jest zbyt drogi:

``` text
OpportunityScore < threshold
```

kopalnia nie powstaje.

To jest poprawny rezultat.

WHY?: \> Złoże było dostępne, ale oczekiwana marża pozostawała zbyt
niska z powodu kosztów transportu.

------------------------------------------------------------------------

# 92. Black Mountain --- konkurencja

Jeśli pierwsza kopalnia odnosi sukces: - druga może wejść, - zwiększona
podaż może obniżyć ceny, - labor shortage może podnieść wages, -
OpportunityScore kolejnych entrantów spada.

To tworzy naturalny limit boomu.

------------------------------------------------------------------------

# 93. Resource Bust AI

W miarę wyczerpywania:

``` text
extraction cost ↑
profit margin ↓
cash runway ↓
```

Firma ocenia: 1. lepszy PM, 2. contraction, 3. closure.

Nie ma skryptu `if resource < 10% → close`.

------------------------------------------------------------------------

# 94. Diversification

Dywersyfikacja Black Mountain nie jest decyzją regionu.

Powstaje, jeśli: - populacja, - skills, - infrastructure, - popyt, -
kapitał

tworzą OpportunityScore dla nowych branż.

------------------------------------------------------------------------

# 95. Import Transition

Huta może pozostać po wyczerpaniu lokalnej rudy, jeśli:

`Imported Iron/Ore Cost + Processing Cost`

nadal daje akceptowalną marżę.

AI porównuje lokalny i importowany input.

------------------------------------------------------------------------

# 96. Decision Explainability

Każda strategiczna decyzja musi odpowiadać na:

-   jakie opcje istniały,
-   które były niemożliwe,
-   jaki był score,
-   jakie były 3--5 głównych czynników,
-   co wybrano,
-   jaki był próg.

------------------------------------------------------------------------

# 97. WHY? --- firma

Pytanie: **Dlaczego firma zwiększyła produkcję?**

Odpowiedź strukturalna: - expected demand +, - inventory below target
+, - expected margin +, - labor availability +, - input cost -.

------------------------------------------------------------------------

# 98. WHY? --- PM

**Dlaczego huta przyjęła nowy piec?**

-   expected fuel saving,
-   higher output,
-   technology available,
-   sufficient capital,
-   conversion cost acceptable.

------------------------------------------------------------------------

# 99. WHY NOT? --- PM

**Dlaczego nie przyjęła?**

-   skill gap,
-   high conversion cost,
-   cheap labor reduced benefit,
-   energy unavailable.

To jest równie ważne jak WHY?.

------------------------------------------------------------------------

# 100. AI Debug Inspector

Dla aktora:

``` text
CURRENT STATE
OBSERVATIONS
EXPECTATIONS
PRESSURES
OPPORTUNITIES
ELIGIBLE OPTIONS
REJECTED OPTIONS
SCORES
SELECTED ACTION
COOLDOWNS
MEMORY
LAST OUTCOME
```

------------------------------------------------------------------------

# 101. Decision Log

Debug build może zapisywać pełny log.

Release build: - tylko ważne snapshots, - agregowane decyzje, - fakty
przyczynowe.

------------------------------------------------------------------------

# 102. AI Invariants

-   AI nie używa nieodkrytych zasobów.
-   AI nie używa niedostępnych technologii.
-   AI nie wydaje nieistniejącego kapitału.
-   AI nie zatrudnia phantom workers.
-   AI nie produkuje bez inputów.
-   score nie jest NaN/Infinity.
-   hard-ineligible option nie może zostać wybrana.
-   cooldown jest respektowany.
-   RNG jest seeded.
-   DecisionSnapshot odpowiada faktycznie użytym danym.

------------------------------------------------------------------------

# 103. Test --- Production Reaction

Warunki: - trwały wzrost demand, - inventory niski, - input/labor
dostępne.

Oczekiwane: - TargetProduction ↑, - produkcja rośnie stopniowo, - WHY?
wskazuje demand/inventory.

------------------------------------------------------------------------

# 104. Test --- No Overreaction

Jednomiesięczny spike demand.

Oczekiwane: - brak natychmiastowej dużej expansion, - możliwa mała
korekta production, - smoothing działa.

------------------------------------------------------------------------

# 105. Test --- Labor Shortage

Firma chce produkować więcej, ale brak pracy.

Oczekiwane: - vacancy, - wage offer ↑, - production bottleneck =
LABOR, - możliwa migracja później.

------------------------------------------------------------------------

# 106. Test --- PM Adoption

Candidate PM: - lepsza produktywność, - wymagany skill dostępny, -
dodatni zwrot.

Oczekiwane: - adoption po spełnieniu threshold/persistence.

------------------------------------------------------------------------

# 107. Test --- PM Rejection

Ta sama technologia, ale: - brak energii lub specjalistów.

Oczekiwane: - hard/soft rejection, - brak adoption, - WHY NOT? poprawne.

------------------------------------------------------------------------

# 108. Test --- Entrepreneurship

Lokalny shortage + wysoka marża.

Oczekiwane: - candidate opportunity, - founding po persistence, - supply
później rośnie.

------------------------------------------------------------------------

# 109. Test --- Competition Saturation

Po wejściu kilku firm: - supply ↑, - margin ↓.

Oczekiwane: - kolejne OpportunityScore spada, - eksplozja liczby firm
zatrzymuje się.

------------------------------------------------------------------------

# 110. Test --- Closure

Trwała nierentowność.

Oczekiwane: - contraction przed closure, jeśli możliwe, - closure po
spełnieniu warunków, - causal chain zachowany.

------------------------------------------------------------------------

# 111. Test --- Determinism

Ten sam seed: - te same Decision Snapshots, - te same selected
actions, - te same strategiczne ticki decyzji.

------------------------------------------------------------------------

# 112. Test --- Different Firms

Dwie firmy: - podobny rynek, - różny cash / riskTolerance.

Oczekiwane: - mogą podjąć różne decyzje, - różnica jest wyjaśnialna.

------------------------------------------------------------------------

# 113. Test --- Information Boundary

Złoże nieodkryte.

Oczekiwane: - żadna firma nie używa jego danych w OpportunityScore.

Po discovery: - opportunity może się pojawić.

------------------------------------------------------------------------

# 114. Test --- Black Mountain 200 lat

Sprawdzić: - founding, - production, - labor, - wages, - expansion, -
competition, - PM adoption, - depletion response, -
closure/diversification/import transition.

Nie wymagamy konkretnego wyniku --- wymagamy logicznej ścieżki.

------------------------------------------------------------------------

# 115. Performance

Nie można wykonywać pełnego globalnego search dla każdej firmy co tick.

Stosować: - local candidate sets, - cached observations, - staggered
strategic reviews, - dirty flags, - incremental market signals, -
regional Opportunity Scanner.

------------------------------------------------------------------------

# 116. Dirty Signals

System może oznaczać:

``` text
market_changed
labor_changed
technology_available
resource_discovered
transport_changed
```

Aktor może wtedy wcześniej uruchomić odpowiedni review.

------------------------------------------------------------------------

# 117. Event-driven + periodic

Najlepszy model:

-   małe decyzje --- periodic,
-   duże zmiany --- event-triggered review,
-   strategiczne sanity review --- okresowo.

Unika zarówno opóźnienia, jak i kosztu ciągłego pełnego AI.

------------------------------------------------------------------------

# 118. Data-driven Rules

Progi i wagi powinny być w definicjach/configu.

Nie:

``` text
if company.type == "Mine":
   threshold = ...
```

Lepiej:

``` yaml
Mine:
  decisionProfile:
    startupThreshold:
    expansionThreshold:
    depletionSensitivity:
```

------------------------------------------------------------------------

# 119. Rozszerzalność contentu

Dodanie nowej firmy powinno wymagać głównie: - CompanyDefinition, -
ProductionRecipe, - PM definitions, - decision profile.

Nie nowego AI engine.

------------------------------------------------------------------------

# 120. Separation of Concerns

``` text
Simulation Systems
= obliczają świat

AI Decision Model
= wybiera działania aktorów

Causality Engine
= pamięta dlaczego

Chronicle
= wybiera co opowiedzieć

UI
= pokazuje to graczowi
```

Nie mieszać tych warstw.

------------------------------------------------------------------------

# 121. Kolejność implementacji

## AI-01

Common Decision Framework.

## AI-02

Company Observation & Memory.

## AI-03

Production decisions.

## AI-04

Labor & wage decisions.

## AI-05

Financial survival.

## AI-06

Expansion / contraction / closure.

## AI-07

Entrepreneurship / founding.

## AI-08

Production Method adoption.

## AI-09

Migration decision integration.

## AI-10

DecisionSnapshot + CausalContext.

## AI-11

Debug Inspector.

## AI-12

Black Mountain tuning.

------------------------------------------------------------------------

# 122. Definition of Done --- Company AI

Company AI jest gotowe dla VS, jeśli firma potrafi autonomicznie:

-   planować production,
-   reagować na inventory,
-   zatrudniać,
-   zmieniać wage offer,
-   ograniczać działalność,
-   rozszerzać działalność,
-   reagować na brak inputów,
-   reagować na popyt,
-   reagować na rentowność,
-   adoptować PM,
-   zamknąć się,
-   wygenerować poprawny DecisionSnapshot.

------------------------------------------------------------------------

# 123. Definition of Done --- Entrepreneurship

Gotowe, jeśli: - nowa firma może powstać bez skryptu, - nie powstaje bez
opportunity, - zasób może stworzyć opportunity, - shortage może stworzyć
opportunity, - eksport może stworzyć opportunity, - konkurencja
ogranicza wejścia, - brak kapitału może zablokować wejście, - WHY?
wyjaśnia founding i no-founding.

------------------------------------------------------------------------

# 124. Definition of Done --- AI Decision Model VS

System jest gotowy, jeśli:

1.  świat działa bez decyzji gracza,
2.  firmy reagują logicznie,
3.  firmy nie mają perfect information,
4.  decyzje nie oscylują co tick,
5.  różne firmy mogą reagować różnie z mechanicznych powodów,
6.  firmy mogą popełniać racjonalne ex ante, ale złe ex post decyzje,
7.  nowe firmy powstają emergentnie,
8.  niepotrzebne firmy upadają,
9.  technologia wymaga Adoption,
10. AI respektuje zasoby, pracę, kapitał i transport,
11. DecisionSnapshot zasila Causality Engine,
12. WHY? i WHY NOT? są możliwe,
13. determinism działa,
14. Black Mountain działa bez skryptowanej sekwencji.

------------------------------------------------------------------------

# 125. Ustalenia kanoniczne v0.1

-   AI jest lokalne, nie globalne.
-   Aktor używa Perceived State, nie pełnego World State.
-   Podstawowa pętla to OBSERVE → FORECAST → DECIDE → ACT → EVALUATE.
-   Duże decyzje używają options + scoring.
-   Hard constraints blokują niemożliwe opcje.
-   Soft constraints wpływają na score.
-   Reakcje są wygładzane.
-   Hysteresis i cooldown są obowiązkowe dla strategicznych decyzji.
-   Firmy nie mają perfect foresight.
-   Company AI priorytetyzuje survival przed growth.
-   Entrepreneurship korzysta z OpportunityScore.
-   Powstawanie firm jest emergentne.
-   Competition ogranicza kolejne wejścia.
-   Discovery ≠ Adoption.
-   Production Method jest decyzją ekonomiczną.
-   Migration korzysta z ograniczonego candidate set.
-   State AI jest późniejszym rozszerzeniem.
-   DecisionSnapshot zapisuje istotne decyzje.
-   CausalContext zawiera rzeczywiście użyte czynniki.
-   Core AI nie używa ML/LLM.
-   AI jest data-driven.
-   Black Mountain jest głównym benchmarkiem.

------------------------------------------------------------------------

# 126. Następny dokument

Po AI Decision Model najbardziej logiczny jest:

**`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md`**

Powinien zebrać w jednym miejscu: - testy jednostkowe, - testy
integracyjne, - invariants, - determinism, - save/load, - Black
Mountain, - Food Valley, - Resource Shock, - Technology Divergence, -
testy gospodarki, - testy AI, - testy Causality, - długie benchmarki
200/500/1000 lat, - kryteria przejścia z VS do MVP.

------------------------------------------------------------------------

# 127. Kryterium końcowe

AI Decision Model spełnia swoją rolę, jeśli gracz może obserwować świat
i zobaczyć:

> Złoże zostało odkryte, ale żadna kopalnia nie powstała, ponieważ
> transport był zbyt drogi.

Albo:

> Jedna firma zaryzykowała wejście na rynek. Zarobiła, rozbudowała
> produkcję i przyciągnęła pracowników. Rosnące płace zwiększyły jednak
> koszty konkurentów, a późniejsze wyczerpywanie złoża sprawiło, że
> część firm upadła. Inne przeszły na nową technologię lub zaczęły
> importować surowiec.

Żaden z tych rezultatów nie powinien być zapisany jako scenariusz.

Powinien powstać z decyzji aktorów reagujących na świat.

> **Architekt ustala warunki. Aktorzy podejmują decyzje. Symulacja
> tworzy historię. Causality Engine pamięta dlaczego.**

**KONIEC --- FIRST CAUSE AI Decision Model v0.1**
