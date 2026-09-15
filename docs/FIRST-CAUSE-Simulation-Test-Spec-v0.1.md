# FIRST CAUSE --- Simulation Test Spec v0.1

**Status:** wersja robocza / kanoniczna specyfikacja testowania
symulacji\
**Projekt:** FIRST CAUSE\
**Wersja dokumentu:** 0.1\
**Rola:** zdefiniowanie strategii testów, scenariuszy referencyjnych,
inwariantów, testów deterministyczności, długich symulacji, kryteriów
PASS/FAIL oraz bramek jakości dla Vertical Slice i późniejszego MVP.

**Dokumenty powiązane:** -
`FIRST-CAUSE-Koncepcja-i-Architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Production-Economy-Master-v0.1.md` -
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` -
`FIRST-CAUSE-Entity-Data-Model-v0.1.md` -
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` -
`FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` -
`FIRST-CAUSE-AI-Decision-Model-v0.1.md`

------------------------------------------------------------------------

# 0. Cel dokumentu

FIRST CAUSE jest symulacją emergentną. Oznacza to, że poprawności nie
można testować wyłącznie pytaniem:

> Czy wydarzył się oczekiwany scenariusz?

W wielu przypadkach kilka różnych rezultatów może być poprawnych.

Testujemy więc przede wszystkim:

1.  czy świat przestrzega reguł,
2.  czy nie tworzy materii, dóbr, pieniędzy lub ludzi z niczego,
3.  czy aktorzy używają dostępnych informacji,
4.  czy decyzje są logicznie uzasadnione,
5.  czy systemy prawidłowo na siebie oddziałują,
6.  czy Causality Engine zapisuje rzeczywiste przyczyny,
7.  czy ten sam seed daje ten sam rezultat,
8.  czy symulacja pozostaje stabilna przez setki lat,
9.  czy różne warunki początkowe tworzą różne historie,
10. czy gracz może zrozumieć, dlaczego świat się zmienił.

------------------------------------------------------------------------

# 1. Fundamentalna zasada testowania

> **Nie testujemy jednej „poprawnej historii". Testujemy poprawność
> mechanizmów generujących historię.**

Przykład Black Mountain.

Poprawne mogą być: - boom górniczy, - umiarkowany rozwój, - brak
kopalni, - boom i późniejszy bust, - import transition, -
dywersyfikacja.

Niepoprawne: - kopalnia powstaje mimo braku odkrycia złoża, - firma
produkuje bez pracowników, - zasób ma ujemną ilość, - migracja następuje
z powodu czynnika, którego Migration System nie używał, - WHY? wymyśla
przyczynę po fakcie.

------------------------------------------------------------------------

# 2. Piramida testów

Testy dzielimy na sześć poziomów:

``` text
L1 — Unit Tests
L2 — System Tests
L3 — Integration Tests
L4 — Scenario Tests
L5 — Long-Run Simulation Tests
L6 — Player-Visible Explainability Tests
```

Każdy poziom odpowiada na inne pytanie.

------------------------------------------------------------------------

# 3. L1 --- Unit Tests

Testują pojedynczą funkcję lub mały moduł.

Przykłady: - PricePressure, - EffectiveDistance, - OpportunityScore, -
MigrationAttraction, - PMScore, - resource depletion, - contribution
normalization, - HistoricalSignificance.

Powinny być: - szybkie, - deterministyczne, - uruchamiane bardzo często.

------------------------------------------------------------------------

# 4. L2 --- System Tests

Testują cały pojedynczy system.

Przykłady: - Market System, - Production System, - Company AI, -
Migration System, - Technology Discovery, - Causality Engine.

System otrzymuje kontrolowany input i sprawdzamy jego output.

------------------------------------------------------------------------

# 5. L3 --- Integration Tests

Testują współpracę kilku systemów.

Przykład:

``` text
Production ↓
→ Supply ↓
→ Price ↑
→ Company decision
```

lub:

``` text
Employment ↑
→ Wage pressure
→ Migration ↑
→ Demand ↑
```

------------------------------------------------------------------------

# 6. L4 --- Scenario Tests

Testują mały świat przez dłuższy okres.

Najważniejsze: - Black Mountain, - Food Valley, - Trade Corridor, -
Resource Bust, - Technology Divergence, - Isolated Region, - Urban
Pressure.

------------------------------------------------------------------------

# 7. L5 --- Long-Run Simulation Tests

Testują: - 200 lat, - 500 lat, - 1000 lat.

Cel: - stabilność, - performance, - brak runaway values, - brak martwego
świata, - pamięć przyczynowa, - zachowanie różnorodności.

------------------------------------------------------------------------

# 8. L6 --- Explainability Tests

Testują to, co jest fundamentalnym USP FIRST CAUSE:

> Czy system potrafi prawidłowo odpowiedzieć „dlaczego?"

Sprawdzamy: - WHY?, - WHY NOT?, - Butterfly Effect, - Chronicle, -
causal paths.

------------------------------------------------------------------------

# 9. Typy wyników testów

Każdy test ma status:

-   PASS
-   FAIL
-   WARNING
-   INCONCLUSIVE

### PASS

Wszystkie obowiązkowe kryteria spełnione.

### FAIL

Naruszona reguła/inwariant.

### WARNING

Symulacja działa, ale wykryto potencjalnie niepożądane zachowanie.

### INCONCLUSIVE

Wynik nie pozwala rozstrzygnąć bez większej próbki.

------------------------------------------------------------------------

# 10. Test ID

Format:

`FC-[CATEGORY]-[NUMBER]`

Przykłady:

-   FC-ECO-001
-   FC-AI-014
-   FC-CAUS-007
-   FC-LONG-003
-   FC-BM-010

------------------------------------------------------------------------

# 11. Kategorie testów

-   CORE
-   DATA
-   ECO
-   MARKET
-   PROD
-   RESOURCE
-   COMPANY
-   AI
-   LABOR
-   POP
-   MIGRATION
-   SETTLEMENT
-   TECH
-   TRADE
-   CAUS
-   CHRON
-   ARCH
-   SAVE
-   DET
-   PERF
-   LONG
-   BM

------------------------------------------------------------------------

# 12. Format definicji testu

``` yaml
TestCase:
  id:
  name:
  level:
  category:
  priority:

  setup:
  seed:
  duration:

  actions:

  expected:
  forbidden:

  metrics:

  passCriteria:
  warningCriteria:
  failCriteria:

  artifacts:
```

------------------------------------------------------------------------

# 13. Priorytety

### P0

Blokuje Vertical Slice.

### P1

Musi być poprawione przed szerszym playtestem.

### P2

Może być tuningowane później.

------------------------------------------------------------------------

# 14. Inwarianty globalne

W każdym ticku:

``` text
population >= 0
resource.quantity >= 0
inventory >= 0
price > 0
company.cash finite
employment >= 0
employment <= available working population
production >= 0
exports <= available goods
imports >= 0
```

------------------------------------------------------------------------

# 15. Brak phantom goods

Nie można: - sprzedać więcej niż istnieje, - zużyć więcej inputu niż
dostępne, - eksportować tej samej jednostki dwa razy.

P0.

------------------------------------------------------------------------

# 16. Brak phantom workers

Suma zatrudnionych pracowników w regionie nie może przekroczyć dostępnej
podaży pracy zgodnie z modelem kohort.

P0.

------------------------------------------------------------------------

# 17. Brak phantom resources

Wydobycie musi zmniejszać stock zasobu nieodnawialnego.

Dla odnawialnych: - produkcja/regeneracja zgodna z definicją, - stock
nie rośnie bez mechanizmu.

------------------------------------------------------------------------

# 18. Finite Numbers

Żaden krytyczny parametr nie może być: - NaN, - Infinity, - -Infinity.

P0.

------------------------------------------------------------------------

# 19. Price Bounds

Cena: - zawsze \> 0, - respektuje miesięczne ograniczenie zmiany, -
respektuje smoothing.

Testy powinny obejmować skrajny shortage i surplus.

------------------------------------------------------------------------

# 20. Conservation Audit

Dla każdego dobra:

``` text
OpeningInventory
+ Production
+ Imports
- Consumption
- IndustrialUse
- Exports
- Waste
= ClosingInventory
```

z dopuszczalną tolerancją numeryczną.

To jeden z najważniejszych testów gospodarki.

------------------------------------------------------------------------

# 21. Resource Conservation Audit

Dla zasobu nieodnawialnego:

``` text
OpeningStock
- Extracted
= ClosingStock
```

z uwzględnieniem ewentualnych korekt danych.

------------------------------------------------------------------------

# 22. Population Accounting

``` text
OpeningPopulation
+ Births
- Deaths
+ InMigration
- OutMigration
= ClosingPopulation
```

------------------------------------------------------------------------

# 23. Employment Accounting

Sprawdzamy: - employed, - unemployed, - non-participating, - working-age
population.

Nie może dochodzić do podwójnego zatrudnienia tej samej zagregowanej
podaży pracy.

------------------------------------------------------------------------

# 24. Company Cash Accounting

``` text
OpeningCash
+ Revenue
+ Financing
- Wages
- Inputs
- Energy
- Transport
- Investment
- Taxes
= ClosingCash
```

W VS pola nieaktywne mogą być zerowe.

------------------------------------------------------------------------

# 25. Test Effective Distance

FC-CORE-001

Zmiana infrastruktury powinna: - zmniejszyć EffectiveDistance, - obniżyć
odpowiedni transport cost.

Gorsze bezpieczeństwo/border friction: - zwiększyć EffectiveDistance.

------------------------------------------------------------------------

# 26. Test Tick Pipeline

FC-CORE-002

Sprawdzić, czy fazy wykonują się w kanonicznej kolejności.

Przykład: produkcja bieżącego ticka nie może używać pracowników, którzy
pojawią się dopiero w późniejszej fazie migracji tego samego ticka,
jeśli pipeline tego nie przewiduje.

------------------------------------------------------------------------

# 27. Test Data Referential Integrity

FC-DATA-001

Każde: - resource ID, - good ID, - company type, - recipe, - PM, -
discovery

musi wskazywać istniejące definicje.

------------------------------------------------------------------------

# 28. Test Production Graph Completeness

FC-DATA-002

Automatyczny audyt wykrywa: - good without producer, - good without
use, - resource without economic role, - PM without recipe, - recipe
with nonexistent input, - company without output, - technology
requirement without discovery path.

------------------------------------------------------------------------

# 29. Test Circular Production Dependency

FC-DATA-003

Wykrywa niemożliwe cykle typu:

``` text
A requires B
B requires A
```

jeśli nie istnieje starter/input zewnętrzny pozwalający uruchomić
łańcuch.

------------------------------------------------------------------------

# 30. Test Market --- shortage

FC-MARKET-001

Setup: - demand \> supply.

Expected: - shortage severity \> 0, - price pressure dodatnia.

------------------------------------------------------------------------

# 31. Test Market --- surplus

FC-MARKET-002

Setup: - supply \> demand, - inventory rośnie.

Expected: - price pressure ujemna lub ograniczenie produkcji w kolejnych
tickach.

------------------------------------------------------------------------

# 32. Test Market Smoothing

FC-MARKET-003

Nagły duży szok nie może powodować nieograniczonej zmiany ceny w jednym
miesiącu.

------------------------------------------------------------------------

# 33. Test Import Cost

FC-TRADE-001

`ImportedCost = ForeignPrice + TransportCost + Tariff + RiskCost`

Zmiana transportu musi wpływać na import economics.

------------------------------------------------------------------------

# 34. Test Trade Feasibility

FC-TRADE-002

Trade flow nie powstaje, jeśli całkowity koszt importu jest trwale
wyższy od ekonomicznej alternatywy i nie istnieje krytyczny shortage
uzasadniający zakup.

------------------------------------------------------------------------

# 35. Test Route Capacity

FC-TRADE-003

Eksport/import nie może przekroczyć capacity połączenia.

------------------------------------------------------------------------

# 36. Test Congestion

FC-TRADE-004

Przekroczenie normalnego wykorzystania powinno zwiększać congestion
modifier zgodnie z konfiguracją.

------------------------------------------------------------------------

# 37. Test Production Inputs

FC-PROD-001

Brak wymaganego inputu: - ogranicza produkcję, - tworzy bottleneck
INPUT.

------------------------------------------------------------------------

# 38. Test Production Labor

FC-PROD-002

Brak wymaganej pracy: - ogranicza output, - bottleneck LABOR.

------------------------------------------------------------------------

# 39. Test Production Energy

FC-PROD-003

Brak energii dla PM: - ogranicza lub zatrzymuje produkcję.

------------------------------------------------------------------------

# 40. Test Production Capacity

FC-PROD-004

Produkcja nie przekracza capacity.

------------------------------------------------------------------------

# 41. Test Recipe Conservation

FC-PROD-005

Recipe nie może wytworzyć outputu bez odpowiedniego zużycia inputów.

------------------------------------------------------------------------

# 42. Test Resource Discovery Boundary

FC-RESOURCE-001

Nieodkryte złoże: - nie może być używane przez firmy, - nie może wpływać
na OpportunityScore.

------------------------------------------------------------------------

# 43. Test Resource Depletion

FC-RESOURCE-002

Ciągłe wydobycie: - stock ↓, - dostępność nie może pozostać
nieskończona.

------------------------------------------------------------------------

# 44. Test Economic Depletion

FC-RESOURCE-003

Złoże może stać się ekonomicznie nieopłacalne przed fizycznym
wyczerpaniem, jeśli: - quality ↓, - accessibility ↓, - marginal cost ↑.

------------------------------------------------------------------------

# 45. Test Renewable Resource

FC-RESOURCE-004

Zasób odnawialny: - może się regenerować/odtwarzać, - nadmierna
eksploatacja może przekroczyć regenerację.

------------------------------------------------------------------------

# 46. Test Company Production Reaction

FC-COMPANY-001

Trwały wzrost popytu + niski inventory + dodatnia marża: -
TargetProduction ↑.

------------------------------------------------------------------------

# 47. Test No Overreaction

FC-AI-001

Jednomiesięczny skok: - nie powoduje natychmiastowej wielkiej expansion.

------------------------------------------------------------------------

# 48. Test Hysteresis

FC-AI-002

Warunki oscylują blisko progu.

Firma nie powinna: `expand → contract → expand` co tick.

------------------------------------------------------------------------

# 49. Test Cooldown

FC-AI-003

Po dużej strategicznej decyzji firma respektuje cooldown.

------------------------------------------------------------------------

# 50. Test Hard Constraint

FC-AI-004

Opcja bez wymaganej technologii: - `hardEligible = false`, - nie może
zostać wybrana.

------------------------------------------------------------------------

# 51. Test Perceived State

FC-AI-005

Firma nie może używać danych spoza swojego zakresu informacji.

------------------------------------------------------------------------

# 52. Test No Perfect Foresight

FC-AI-006

Firma nie może podejmować decyzji na podstawie przyszłej ceny lub
przyszłego discovery.

------------------------------------------------------------------------

# 53. Test Opportunity Founding

FC-AI-007

Trwały: - demand gap, - expected margin, - dostępne inputy, - labor, -
capital

powinien umożliwić founding.

------------------------------------------------------------------------

# 54. Test No Opportunity

FC-AI-008

Brak ekonomicznej okazji: - brak masowego founding.

------------------------------------------------------------------------

# 55. Test Competition Saturation

FC-AI-009

Kolejne wejścia zwiększają supply i competition.

Expected: - OpportunityScore kolejnych entrantów spada.

------------------------------------------------------------------------

# 56. Test Financial Survival

FC-COMPANY-002

Firma ze stratami: - najpierw próbuje ograniczać działalność, - nie
inwestuje agresywnie bez uzasadnienia.

------------------------------------------------------------------------

# 57. Test Closure

FC-COMPANY-003

Długotrwała strukturalna nierentowność może prowadzić do closure.

Jedna słaba obserwacja nie wystarcza.

------------------------------------------------------------------------

# 58. Test Bankruptcy

FC-COMPANY-004

Brak płynności: - może wymusić bankruptcy zgodnie z uproszczonym modelem
VS.

------------------------------------------------------------------------

# 59. Test Wage Response

FC-LABOR-001

Trwałe vacancies + labor shortage: - wage offer ↑ w dozwolonym tempie.

------------------------------------------------------------------------

# 60. Test Layoff

FC-LABOR-002

Trwały spadek target production: - zatrudnienie może spadać, - bez
natychmiastowego rehiring przy minimalnej zmianie.

------------------------------------------------------------------------

# 61. Test Labor Competition

FC-LABOR-003

Nowa duża firma: - zmniejsza lokalną dostępność pracy, - może zwiększyć
wage pressure innych firm.

------------------------------------------------------------------------

# 62. Test Consumption Priority

FC-POP-001

Przy ograniczonym budżecie wydatki respektują:

`Survival → Basic → Services → Comfort → Prosperity → Luxury → Savings`

------------------------------------------------------------------------

# 63. Test No Money, No Purchase

FC-POP-002

Niezaspokojona potrzeba nie może automatycznie tworzyć konsumpcji bez
budżetu.

------------------------------------------------------------------------

# 64. Test Substitution

FC-POP-003

Jeżeli dobro A niedostępne, a B jest zdefiniowanym substytutem: - część
popytu może przejść na B.

Brak definicji substytutu: - brak magicznego substitution.

------------------------------------------------------------------------

# 65. Test Migration Attraction

FC-MIGRATION-001

Jobs i wages ↑ przy pozostałych warunkach stabilnych: - attraction ↑.

------------------------------------------------------------------------

# 66. Test Migration Friction

FC-MIGRATION-002

Większy EffectiveDistance: - zmniejsza migrację.

------------------------------------------------------------------------

# 67. Test Housing Constraint

FC-MIGRATION-003

Wysoki HousingCost: - powinien hamować attraction.

------------------------------------------------------------------------

# 68. Test Candidate Set

FC-MIGRATION-004

Kohorta nie porównuje arbitralnie wszystkich regionów świata (docelowo nawet 3 000), jeśli nie ma
do nich dostępu/informacji.

------------------------------------------------------------------------

# 69. Test Migration Accounting

FC-MIGRATION-005

OutMigration regionu źródłowego musi odpowiadać InMigration regionu
docelowego, z wyjątkiem jawnie zdefiniowanych przypadków.

------------------------------------------------------------------------

# 70. Test Settlement Pressure

FC-SETTLEMENT-001

Wzrost: - population, - jobs, - trade

powinien zwiększać SettlementPressure, jeśli constraints nie dominują.

------------------------------------------------------------------------

# 71. Test Settlement Stage

FC-SETTLEMENT-002

Zmiana Camp → Hamlet itd. wymaga: - threshold, - persistence, -
odpowiednich warunków.

Nie może zależeć wyłącznie od jednego przypadkowego ticka.

------------------------------------------------------------------------

# 72. Test Urban Crisis

FC-SETTLEMENT-003

Szybki wzrost populacji bez housing/services: - housing pressure ↑, -
needs satisfaction może spaść, - migracja może zostać później
ograniczona.

------------------------------------------------------------------------

# 73. Test Discovery Eligibility

FC-TECH-001

Discovery nie może wystąpić bez wymaganych prerequisites.

------------------------------------------------------------------------

# 74. Test Discovery ≠ Availability

FC-TECH-002

Discovery może istnieć, ale region/firma nie musi jeszcze móc go
wykorzystać.

------------------------------------------------------------------------

# 75. Test Availability ≠ Adoption

FC-TECH-003

Dostępna technologia nie zmienia automatycznie PM firmy.

------------------------------------------------------------------------

# 76. Test PM Adoption

FC-TECH-004

Ekonomicznie korzystny PM + wymagane skills/capital/energy: - może
zostać przyjęty.

------------------------------------------------------------------------

# 77. Test PM Rejection

FC-TECH-005

Lepszy technologicznie PM może zostać odrzucony, jeśli: - conversion
cost za wysoki, - brak skills, - energia za droga, - obecna metoda nadal
ekonomiczna.

------------------------------------------------------------------------

# 78. Test Technology Diffusion

FC-TECH-006

Po discovery technologia może rozprzestrzeniać się stopniowo, a nie
natychmiast globalnie.

------------------------------------------------------------------------

# 79. Test Causal Edge Integrity

FC-CAUS-001

Każdy edge: - ma istniejący source, - ma istniejący target, - nie jest
self-edge, - respektuje temporal ordering.

------------------------------------------------------------------------

# 80. Test No False Causality

FC-CAUS-002

Dwa równoczesne, niezależne zdarzenia: - nie mogą zostać połączone bez
mechanizmu.

------------------------------------------------------------------------

# 81. Test Multi-causality

FC-CAUS-003

Skutek z wieloma inputami: - zachowuje kilka głównych przyczyn.

------------------------------------------------------------------------

# 82. Test Negative Cause

FC-CAUS-004

Czynnik hamujący: - ma ujemny contribution, - WHY? prezentuje go jako
constraint/limiting factor.

------------------------------------------------------------------------

# 83. Test WHY? Immediate

FC-CAUS-005

Dla faktu: - zwracane są bezpośrednie mechaniczne przyczyny.

------------------------------------------------------------------------

# 84. Test WHY? Chain

FC-CAUS-006

Dla settlement growth w Black Mountain: - ścieżka może dojść przez
jobs/mine do resource discovery.

------------------------------------------------------------------------

# 85. Test WHY NOT?

FC-CAUS-007

Jeżeli kopalnia nie powstaje: - Decision Snapshot wskazuje główne
bariery, - system nie wymyśla przyczyn.

------------------------------------------------------------------------

# 86. Test Architect Influence

FC-ARCH-001

Interwencja: - tworzy Root Fact, - jej wpływ może propagować się do
potomków.

------------------------------------------------------------------------

# 87. Test Influence Decay

FC-ARCH-002

Odległe konsekwencje zwykle mają niższy Architect Influence niż
bezpośrednie.

------------------------------------------------------------------------

# 88. Test Unrelated Architect Influence

FC-ARCH-003

Zdarzenie niezwiązane z interwencją: - influence = 0 / brak powiązania.

------------------------------------------------------------------------

# 89. Test Multiple Interventions

FC-ARCH-004

Jeden skutek może zachować wpływ kilku interwencji bez nadpisania
poprzedniej.

------------------------------------------------------------------------

# 90. Test Chronicle Candidate

FC-CHRON-001

Istotny Simulation Fact: - może zostać Chronicle Candidate.

Nieistotny mikro-fakt: - nie powinien zaśmiecać Chronicle.

------------------------------------------------------------------------

# 91. Test Chronicle Source Integrity

FC-CHRON-002

Chronicle Entry: - wskazuje istniejące fakty/anchors, - nie staje się
samodzielnym źródłem prawdy.

------------------------------------------------------------------------

# 92. Test Historical Significance

FC-CHRON-003

Większe: - magnitude, - duration, - population affected, - scope, -
novelty, - causal impact

powinny zwiększać significance zgodnie z modelem.

------------------------------------------------------------------------

# 93. Determinism Test

FC-DET-001

Uruchom: - ten sam seed, - ten sam config, - tę samą wersję contentu, -
N ticków.

Porównaj: - World State hash, - ważne Fact IDs, - Decision Snapshots, -
Chronicle anchors.

Muszą być identyczne.

------------------------------------------------------------------------

# 94. Determinism --- different speed

FC-DET-002

Symulacja ×1 i ×100: - powinna dać ten sam rezultat, jeśli speed nie
zmienia logiki ticka.

------------------------------------------------------------------------

# 95. Determinism --- save/load

FC-DET-003

World A: - 1200 ticków ciągiem.

World B: - 600 ticków, - save, - load, - kolejne 600.

Finalny stan powinien być identyczny.

------------------------------------------------------------------------

# 96. Save Integrity

FC-SAVE-001

Save musi zachować: - seed, - tick, - entities, - markets, -
companies, - resources, - technologies, - causal memory, - intervention
state, - RNG state.

------------------------------------------------------------------------

# 97. Causal Save Integrity

FC-SAVE-002

Po load: - WHY? nadal działa, - causal paths nie są zerwane, - Chronicle
anchors istnieją.

------------------------------------------------------------------------

# 98. HOT/WARM/PERMANENT Memory Test

FC-CAUS-008

Po długiej symulacji: - stare mikro-fakty są kompresowane, - ważne
historyczne fakty pozostają.

------------------------------------------------------------------------

# 99. Pruning Integrity

FC-CAUS-009

Pruning: - zmniejsza liczbę nodes, - nie tworzy dangling edges, - nie
usuwa jedynej ścieżki do ważnego zdarzenia.

------------------------------------------------------------------------

# 100. Scenario A --- Black Mountain

Najważniejszy scenariusz Vertical Slice.

Cel: sprawdzić pełny łańcuch: - resource, - company AI, - labor, -
migration, - settlement, - trade, - technology, - depletion, -
causality.

------------------------------------------------------------------------

# 101. Black Mountain --- Setup

Region: `Black Mountain`

Cechy: - początkowo nierozwinięty, - umiarkowana populacja, -
potencjalne Iron Ore, - ograniczona infrastruktura, - połączenie z
sąsiednimi regionami.

Iron Ore na początku: - nieodkryte lub odkrywane w kontrolowanym ticku
zależnie od wariantu testu.

------------------------------------------------------------------------

# 102. BM-01 --- Discovery

Oczekiwane: - discovery tylko po spełnieniu warunków, - resource becomes
known, - Opportunity Scanner może od tej chwili używać danych.

------------------------------------------------------------------------

# 103. BM-02 --- Mine Founding

Przy sprzyjających: - demand, - labor, - transport, - capital

Mine OpportunityScore przekracza próg.

Oczekiwane: - Decision Snapshot, - company founded.

------------------------------------------------------------------------

# 104. BM-03 --- No Mine

Wariant: - transport cost bardzo wysoki.

Oczekiwane: - złoże odkryte, - kopalnia nie powstaje, - WHY NOT?
wskazuje transport/margin.

PASS jest brak kopalni.

------------------------------------------------------------------------

# 105. BM-04 --- Employment

Po uruchomieniu kopalni: - labor demand ↑, - employment ↑ lub vacancies
↑.

Nie wolno stworzyć phantom workers.

------------------------------------------------------------------------

# 106. BM-05 --- Wage Pressure

Jeśli lokalna podaż pracy jest ograniczona: - wage pressure ↑.

------------------------------------------------------------------------

# 107. BM-06 --- Migration

Jobs + wages: - zwiększają attraction.

Migration nie musi nastąpić natychmiast ani w identycznej skali dla
każdego seeda.

------------------------------------------------------------------------

# 108. BM-07 --- Settlement Growth

Trwała: - populacja, - zatrudnienie, - handel

mogą podnieść settlement stage.

Nie wymuszamy konkretnego roku.

------------------------------------------------------------------------

# 109. BM-08 --- Secondary Economy

Rosnąca populacja powinna tworzyć demand opportunities dla części: -
food, - construction, - services, - transport, - local goods.

Nie wymagamy konkretnej firmy, jeśli inne mechanizmy zaspokoją popyt.

------------------------------------------------------------------------

# 110. BM-09 --- Trade

Region może: - importować żywność, - eksportować surowiec/produkty.

Trade flow musi być ekonomicznie uzasadniony.

------------------------------------------------------------------------

# 111. BM-10 --- Technology

Wzrost aktywności górniczej może zwiększać warunki dla odpowiednich
discoveries/diffusion.

Discovery nie gwarantuje adoption.

------------------------------------------------------------------------

# 112. BM-11 --- Depletion

Wieloletnie wydobycie: - stock ↓, - koszty mogą ↑, - rentowność może ↓.

------------------------------------------------------------------------

# 113. BM-12 --- Post-Depletion Transition

Dozwolone rezultaty: - Resource Bust, - Economic Diversification, -
Import Transition, - Technological Extension, - Substitution, - Ghost
Settlement.

Test nie wymusza jednego.

------------------------------------------------------------------------

# 114. BM-13 --- Causal Chain

Po 50--100 latach pytanie:

**Dlaczego Black Mountain się rozwinęło?**

Musi istnieć ścieżka do: - employment, - mine, - resource discovery,

jeśli faktycznie były przyczynami.

------------------------------------------------------------------------

# 115. BM-14 --- Architect Butterfly

Jeśli odkrycie było ułatwione interwencją Architekta: - długoterminowe
skutki mogą zachować wpływ interwencji.

------------------------------------------------------------------------

# 116. BM-15 --- No Script Detection

Test statyczny i runtime: - brak kodu wymuszającego sekwencję Black
Mountain, - scenariusz musi działać na tych samych ogólnych systemach co
inne regiony.

------------------------------------------------------------------------

# 117. Scenario B --- Food Valley

Cel: sprawdzić gospodarkę żywnościową.

Setup: - wysoka fertility, - dobre warunki rolnicze, - słabszy
przemysł, - pobliski region miejski.

------------------------------------------------------------------------

# 118. FV-01 --- Agricultural Surplus

Produkcja żywności \> lokalny popyt.

Expected: - surplus, - inventory/export opportunity.

------------------------------------------------------------------------

# 119. FV-02 --- Export

Jeśli transport opłacalny: - eksport do regionu z niedoborem.

------------------------------------------------------------------------

# 120. FV-03 --- Price Transmission

Zmiana popytu w mieście może pośrednio wpływać na ceny i produkcję Food
Valley.

------------------------------------------------------------------------

# 121. FV-04 --- Bad Harvest / Shock

Spadek produkcji: - supply ↓, - prices ↑, - exports mogą ↓, - importer
może odczuć shortage.

------------------------------------------------------------------------

# 122. FV-05 --- WHY?

Miejski wzrost cen żywności powinien móc prowadzić do: - spadku dostaw z
Food Valley, jeśli to był rzeczywisty mechanizm.

------------------------------------------------------------------------

# 123. Scenario C --- Trade Corridor

Setup: - dwa produktywne regiony, - region pośredni, - ulepszane
połączenie.

Cel: test Effective Distance i trade hub.

------------------------------------------------------------------------

# 124. TC-01 --- Infrastructure Improvement

Lepsza infrastruktura: - EffectiveDistance ↓, - TransportCost ↓.

------------------------------------------------------------------------

# 125. TC-02 --- Trade Growth

Jeśli istnieją różnice cen/opportunity: - wolumen handlu może ↑.

------------------------------------------------------------------------

# 126. TC-03 --- Trade Hub Emergence

Region pośredni może zwiększyć: - transport activity, - employment, -
local demand.

Nie jest to skryptowane.

------------------------------------------------------------------------

# 127. Scenario D --- Isolated Region

Setup: - wysoki EffectiveDistance, - mało zasobów, - niewielka
populacja.

Cel: sprawdzić, czy świat nie wymusza wzrostu wszędzie.

------------------------------------------------------------------------

# 128. IR-01 --- No Guaranteed Growth

Region może przez dekady pozostać mały.

To jest poprawny rezultat.

------------------------------------------------------------------------

# 129. IR-02 --- Expensive Imports

Transport: - zwiększa imported cost, - może powodować niższe needs
satisfaction.

------------------------------------------------------------------------

# 130. IR-03 --- Infrastructure Shock

Po poprawie połączenia: - nowe trade/migration opportunities mogą się
pojawić.

------------------------------------------------------------------------

# 131. Scenario E --- Technology Divergence

Dwa podobne regiony.

Różnica: - Knowledge / specialist capacity.

Cel: sprawdzić różne ścieżki technologiczne.

------------------------------------------------------------------------

# 132. TD-01 --- Eligibility Difference

Region A spełnia prerequisites. Region B nie.

Discovery może wystąpić tylko w A.

------------------------------------------------------------------------

# 133. TD-02 --- Adoption Difference

Oba znają technologię, ale tylko A ma: - skills, - energy, - capital.

Adoption może różnić się.

------------------------------------------------------------------------

# 134. TD-03 --- Economic Consequence

Różna adopcja może prowadzić do: - productivity divergence, - różnicy
kosztów, - różnej konkurencyjności.

------------------------------------------------------------------------

# 135. Scenario F --- Urban Pressure

Setup: - szybko rosnące miasto, - ograniczone housing/services.

Cel: test FL-002 Urban Crisis.

------------------------------------------------------------------------

# 136. UP-01 --- Housing Cost

Szybszy population growth niż housing: - housing cost/pressure ↑.

------------------------------------------------------------------------

# 137. UP-02 --- Needs

Braki usług i mieszkań: - mogą obniżać needs satisfaction.

------------------------------------------------------------------------

# 138. UP-03 --- Migration Dampening

Rosnące koszty życia: - zmniejszają dalszą attraction.

Powstaje naturalne sprzężenie hamujące.

------------------------------------------------------------------------

# 139. Feedback Loop Test --- Prosperity

FC-LONG-001

Sprawdzić możliwość:

``` text
jobs
→ migration
→ demand
→ business growth
→ jobs
```

System nie musi wejść w loop zawsze.

------------------------------------------------------------------------

# 140. Feedback Loop Test --- Poverty Trap

FC-LONG-002

Możliwy wzorzec:

``` text
low income
→ weak demand
→ weak investment
→ low employment
→ low income
```

Świat nie może jednak automatycznie blokować każdego biednego regionu na
zawsze.

------------------------------------------------------------------------

# 141. Feedback Loop Test --- Resource Boom/Bust

FC-LONG-003

Sprawdzić: - boom, - koszty, - labor pressure, - depletion, - możliwy
bust.

------------------------------------------------------------------------

# 142. Feedback Loop Test --- Innovation

FC-LONG-004

``` text
activity
→ knowledge
→ discovery
→ adoption
→ productivity
→ activity
```

Bez automatycznej nieskończonej eksplozji wiedzy.

------------------------------------------------------------------------

# 143. Long Run --- 200 lat

FC-LONG-010

To podstawowy benchmark VS: `2400 ticków`.

Wymagania: - zero P0 invariant violations, - zero NaN, - zero broken
references, - causal memory działa, - świat nadal posiada aktywność
gospodarczą.

------------------------------------------------------------------------

# 144. Long Run --- 500 lat

FC-LONG-011

Cel: - wykryć wolne runaway dynamics, - sprawdzić memory compression, -
obserwować różnorodność regionów.

Nie musi blokować pierwszego VS, jeśli 200 lat jest stabilne, ale jest
P1.

------------------------------------------------------------------------

# 145. Long Run --- 1000 lat

FC-LONG-012

Cel docelowy.

Sprawdzić: - stabilność liczb, - rozmiar save, - causal memory, -
performance, - brak całkowitej homogenizacji świata.

------------------------------------------------------------------------

# 146. Runaway Population Detector

WARNING jeśli populacja: - rośnie przez długi czas z nierealistycznie
wysoką stopą, - przekracza założone limity bez mechanicznego powodu.

Nie definiujemy tu finalnych historycznych wartości tuningowych.

------------------------------------------------------------------------

# 147. Runaway Price Detector

WARNING: - cena dobra rośnie wykładniczo przez wiele lat, - brak
mechanizmu przywracającego równowagę, - rynek nie reaguje.

------------------------------------------------------------------------

# 148. Dead Economy Detector

WARNING jeśli przez długi okres: - niemal brak founding, - brak zmian
production, - brak trade, - brak migration, - brak technology
progression

mimo istniejących opportunities.

------------------------------------------------------------------------

# 149. Hyperactive Economy Detector

WARNING jeśli: - ogromna część firm zmienia strategię co tick, -
founding/closure są ekstremalnie częste, - PM switching jest ciągły.

------------------------------------------------------------------------

# 150. World Homogenization Detector

WARNING jeśli po długiej symulacji wszystkie regiony stają się niemal
identyczne pod względem: - struktury produkcji, - cen, - populacji, -
technologii, - firm.

Nie jest automatycznie FAIL, ale wymaga analizy.

------------------------------------------------------------------------

# 151. Permanent Poverty Detector

WARNING jeśli regiony z niskim startem nigdy nie mają mechanicznej
możliwości poprawy niezależnie od warunków.

------------------------------------------------------------------------

# 152. Infinite Growth Detector

Firmy nie mogą rosnąć bez ograniczeń mimo: - demand, - labor, -
inputs, - capital, - capacity, - market size.

------------------------------------------------------------------------

# 153. Diversity Test

Uruchomić wiele seedów przy tym samym configu.

Oczekiwane: - różne historie, - przy zachowaniu tych samych reguł.

------------------------------------------------------------------------

# 154. Seed Sensitivity

Mała różnica seeda może zmieniać: - timing discovery, - decyzje
marginalne, - ścieżki rozwoju.

Nie powinna łamać inwariantów.

------------------------------------------------------------------------

# 155. Parameter Sensitivity

Zmienić pojedynczy parametr o np. ±10%.

Sprawdzić: - czy rezultat zmienia się stopniowo, - czy nie pojawia się
nieuzasadniony chaos.

Wyjątek: jawne thresholds mogą tworzyć zmianę jakościową.

------------------------------------------------------------------------

# 156. Extreme Condition Test

Testy skrajne: - zero resource, - zero labor, - ogromny shortage, -
bardzo wysoki transport cost, - izolacja, - bardzo bogate złoże.

System musi zachować poprawność nawet jeśli rezultat jest ekstremalny.

------------------------------------------------------------------------

# 157. Zero Population Region

Region z population = 0: - nie może generować phantom labor, - może
pozostać pusty, - może zostać zasiedlony tylko przez prawidłowy
mechanizm.

------------------------------------------------------------------------

# 158. Zero Company Region

Brak firm: - nie jest błędem, - Entrepreneurship może stworzyć firmę
tylko przy opportunity.

------------------------------------------------------------------------

# 159. Zero Trade Region

Brak opłacalnych tras: - brak handlu jest poprawny.

------------------------------------------------------------------------

# 160. Technology Stall

Region może przez długi czas nie dokonywać discovery, jeśli: -
prerequisites, - knowledge, - activity

są niewystarczające.

To nie jest automatycznie bug.

------------------------------------------------------------------------

# 161. Emergence Test

Nie testujemy „czy powstało miasto X".

Testujemy: - czy zespół warunków może prowadzić do settlement growth, -
czy brak warunków może go zatrzymać.

------------------------------------------------------------------------

# 162. No Forced Balance

FIRST CAUSE nie musi utrzymywać wszystkich regionów równie silnych.

Test nie może traktować nierówności jako błędu.

------------------------------------------------------------------------

# 163. No Forced Drama

Chronicle nie może wymuszać kryzysów tylko dlatego, że „długo nic się
nie wydarzyło".

Brak dramatycznego wydarzenia może być poprawnym stanem świata.

------------------------------------------------------------------------

# 164. Explainability Coverage

Dla VS WHY? powinno pokrywać minimum:

1.  price change,
2.  production change,
3.  shortage,
4.  trade flow,
5.  company founding,
6.  company expansion,
7.  company closure,
8.  employment,
9.  wage change,
10. migration,
11. settlement growth,
12. discovery,
13. PM adoption,
14. resource depletion,
15. regional boom/bust.

------------------------------------------------------------------------

# 165. WHY? Accuracy Audit

Losowo wybrane fakty: - porównać explanation z CausalContext systemu
źródłowego.

Każda główna przyczyna w UI musi mieć źródło w danych.

------------------------------------------------------------------------

# 166. WHY? Noise Test

Explanation nie powinno domyślnie pokazywać: - 20 drobnych TRACE
factors.

UI/API powinno rankować: - Primary, - Significant, - Limiting.

------------------------------------------------------------------------

# 167. WHY? Historical Test

Po 100+ latach: - ważne przyczyny nadal dostępne po kompresji pamięci.

------------------------------------------------------------------------

# 168. Butterfly Effect Test

Dla interwencji: - pobrać Major Consequences, - prześledzić causal
paths, - sprawdzić Architect Influence.

------------------------------------------------------------------------

# 169. Butterfly Noise Test

Interwencja nie może po setkach lat zostać przypisana do niemal całego
świata tylko dlatego, że graf jest połączony.

Wymagane: - decay, - thresholds, - significance ranking.

------------------------------------------------------------------------

# 170. Chronicle Density Test

Tryby: - Concise, - Standard, - Detailed

zmieniają ilość raportowanych wydarzeń, ale nie samą symulację.

------------------------------------------------------------------------

# 171. Chronicle Determinism

Ten sam świat i ustawienia Chronicle: - ten sam zestaw entries.

------------------------------------------------------------------------

# 172. Performance Metrics

Rejestrować: - ms/tick, - ms/system/tick, - memory usage, - fact
count, - edge count, - company count, - cohort count, - save size, -
load time.

------------------------------------------------------------------------

# 173. Performance Benchmark --- VS

Referencyjny świat: - 24--40 regionów, - \~200 początkowej populacji, -
VS economy, - 200 lat.

Mierzyć: - czas całej symulacji, - peak memory, - wielkość causal graph.

Finalne budżety sprzętowe wymagają osobnego `Performance Budget`.

------------------------------------------------------------------------

# 174. Performance Scaling

Testować skalowanie etapami:

- 32 regiony — Vertical Slice,
- 250 — Small,
- 600 — Standard,
- 1 200 — Large,
- 2 000 — Huge,
- 3 000 — Architecture Target / stress benchmark.

3 000 jest celem architektonicznym. Test może wykazać niższy oficjalnie
wspierany limit dla konkretnej wersji sprzętowej/builda.

Nie wymagać pełnego contentu VS dla wszystkich testów; można używać
synthetic benchmark worlds.

------------------------------------------------------------------------

# 175. Company Scaling

Benchmark: - 100, - 1 000, - 5 000, - więcej jeśli osiągalne.

Sprawdzić: - strategic review cost, - Opportunity Scanner, - market
updates.

------------------------------------------------------------------------

# 176. Causal Scaling

Mierzyć: - facts/tick, - edges/fact, - compression ratio, - query WHY?
latency.

------------------------------------------------------------------------

# 177. Save Size Scaling

Sprawdzić rozmiar: - 50 lat, - 200 lat, - 500 lat, - 1000 lat.

Szczególnie causal memory.

------------------------------------------------------------------------

# 178. Test Artifacts

Każdy ważny scenario run powinien móc wygenerować:

-   summary JSON,
-   invariant report,
-   metric CSV,
-   major events log,
-   causal diagnostics,
-   final world snapshot,
-   optional chart data.

------------------------------------------------------------------------

# 179. Golden Run

Dla wybranej wersji builda przechowujemy referencyjny:

`Golden Seed`

Nie po to, aby każda zmiana zachowywała identyczną historię po zmianie
modelu.

Służy do wykrywania niezamierzonych zmian w obrębie tej samej wersji
reguł.

------------------------------------------------------------------------

# 180. Snapshot Testing

Dla krótkich kontrolowanych testów można porównywać snapshoty: - tick
1, - tick 12, - tick 120.

Dobre dla regresji.

------------------------------------------------------------------------

# 181. Property-Based Tests

Generować wiele poprawnych konfiguracji wejściowych.

Sprawdzać własności: - brak wartości ujemnych, - conservation, - brak
broken references, - determinism.

------------------------------------------------------------------------

# 182. Fuzz Tests

Losowo, ale seeded: - ceny, - zasoby, - firmy, - połączenia, - populacje

w dozwolonych zakresach.

Cel: znaleźć edge cases.

------------------------------------------------------------------------

# 183. Mutation Tests dla danych

Celowo: - usunąć producenta dobra, - zepsuć ID, - stworzyć circular
recipe, - usunąć tech prerequisite.

Validator powinien wykryć problem przed uruchomieniem świata.

------------------------------------------------------------------------

# 184. Regression Test Policy

Każdy znaleziony bug klasy P0/P1 powinien otrzymać test regresyjny.

Schemat: 1. odtwórz bug, 2. test FAIL, 3. napraw, 4. test PASS, 5. test
pozostaje w suite.

------------------------------------------------------------------------

# 185. Balance vs Correctness

Rozdzielamy:

### Correctness

-   czy system przestrzega reguł?

### Balance

-   czy wartości dają interesujący świat?

Nie naprawiamy problemu balance przez łamanie poprawnej architektury.

------------------------------------------------------------------------

# 186. Balance Warning Examples

Nie są automatycznie bugiem: - za mało firm, - za wolna migracja, - zbyt
częste busty, - za szybka technologia.

To tuning, jeśli mechanizmy są poprawne.

------------------------------------------------------------------------

# 187. Statistical Test Runs

Dla zachowań probabilistycznych: - uruchomić np. 50--100 seedów.

Analizować rozkład, a nie pojedynczy rezultat.

------------------------------------------------------------------------

# 188. Statistical Discovery Test

Jeżeli discovery ma prawdopodobieństwo: - sprawdzić, czy w dużej próbie
zachowanie jest zgodne z oczekiwanym zakresem.

Nie testować dokładnej liczby przy małej próbce.

------------------------------------------------------------------------

# 189. Statistical Founding Test

Przy marginalnym OpportunityScore: - różne seedy mogą dawać różne
timing/result, - ale żaden nie może naruszać hard constraints.

------------------------------------------------------------------------

# 190. Test Configurations

Rekomendowane presety:

``` text
TEST_TINY
TEST_VS
TEST_STANDARD
TEST_LARGE
TEST_STRESS
```

------------------------------------------------------------------------

# 191. TEST_TINY

-   3--5 regionów,
-   minimalna gospodarka,
-   szybkie integration tests.

------------------------------------------------------------------------

# 192. TEST_VS

-   24--40 regionów,
-   pełny zakres Vertical Slice,
-   główny benchmark funkcjonalny.

------------------------------------------------------------------------

# 193. TEST_STANDARD

-   około 600 regionów,
-   rozszerzony benchmark standardowego świata.

------------------------------------------------------------------------

# 194. TEST_LARGE

-   około 1 200 regionów,
-   test dużego świata.

Dodatkowy benchmark `TEST_HUGE`:

-   około 2 000 regionów.

------------------------------------------------------------------------

# 195. TEST_STRESS

Architecture Target:

-   do 3 000 regionów,
-   sztucznie wysoka liczba firm,
-   trade flows,
-   facts,
-   discoveries.

TEST_STRESS nie jest automatycznie wymaganiem sprzętowym wersji
premierowej. Służy do sprawdzenia, czy architektura nie posiada ukrytych
założeń limitu 800 regionów oraz do ustalenia finalnego wspieranego
maksimum.

Nie musi reprezentować realistycznego świata.

------------------------------------------------------------------------

# 196. Test Runner

Docelowy CLI:

``` text
firstcause test --suite core
firstcause test --suite economy
firstcause test --scenario black-mountain
firstcause test --long-run 200
firstcause test --determinism
firstcause test --stress
```

Nazwy są propozycją techniczną, nie wymogiem konkretnego języka.

------------------------------------------------------------------------

# 197. Seed Reporting

Każdy FAIL musi raportować: - seed, - tick, - scenario, - entity IDs, -
ostatnie istotne facts, - config version.

Bez tego emergentne bugi będą trudne do reprodukcji.

------------------------------------------------------------------------

# 198. Failure Snapshot

Przy P0: automatycznie zapisać snapshot świata tuż przed/po błędzie,
jeśli możliwe.

------------------------------------------------------------------------

# 199. Invariant Monitor

W debug/test build: - sprawdzanie inwariantów co tick.

W performance build: - możliwe rzadsze sprawdzanie.

------------------------------------------------------------------------

# 200. Warning Monitor

Monitoruje: - runaway, - dead economy, - hyperactivity, -
homogenization, - causal explosion.

Nie przerywa automatycznie symulacji.

------------------------------------------------------------------------

# 201. Causal Debug Bundle

Przy błędzie WHY? zapisać: - target fact, - incoming edges, - Decision
Snapshot, - CausalContext, - source system.

------------------------------------------------------------------------

# 202. AI Debug Bundle

Przy błędzie decyzji: - perceived state, - eligible options, - rejected
options, - scores, - thresholds, - selected action, - RNG draw jeśli
użyty.

------------------------------------------------------------------------

# 203. Economy Debug Bundle

Przy conservation failure: - opening inventory, - production, -
imports, - consumption, - industrial use, - exports, - waste, - closing
inventory.

------------------------------------------------------------------------

# 204. Testowanie po zmianie contentu

Dodanie: - resource, - good, - company, - recipe, - PM, - discovery

automatycznie uruchamia: - referential integrity, - production graph
audit, - localization key audit, - minimal viability tests.

------------------------------------------------------------------------

# 205. Testowanie po zmianie AI

Zmiana scoringu: - Company AI suite, - Black Mountain, - determinism, -
200-year long run.

------------------------------------------------------------------------

# 206. Testowanie po zmianie Market

Zmiana cen: - market suite, - trade, - company AI, - consumption, -
Black Mountain, - long run.

------------------------------------------------------------------------

# 207. Testowanie po zmianie Causality

Uruchomić: - causal integrity, - WHY?, - Butterfly, - pruning, -
save/load, - Black Mountain.

------------------------------------------------------------------------

# 208. Testowanie po zmianie Tick Pipeline

Wymaga pełnego regression suite.

To zmiana wysokiego ryzyka.

------------------------------------------------------------------------

# 209. CI --- minimalny zestaw na każdy commit

Rekomendacja: - Unit Tests, - Data Validators, - Tiny Integration, -
Determinism short, - core invariants.

------------------------------------------------------------------------

# 210. CI --- przed merge dużej funkcji

Dodatkowo: - TEST_VS, - Black Mountain, - economy suite, - AI suite, -
causality suite, - save/load.

------------------------------------------------------------------------

# 211. Nightly / ręczny długi zestaw

-   200-year multiple seeds,
-   500-year selected seeds,
-   performance,
-   statistical runs,
-   stress.

------------------------------------------------------------------------

# 212. Bramka jakości VS --- Gate A: Data

PASS wymagane: - brak broken IDs, - brak dead production chains, -
wszystkie aktywne VS goods mają producer/use, - wszystkie aktywne PM
mają requirements.

------------------------------------------------------------------------

# 213. Gate B: Core Simulation

PASS: - tick pipeline, - conservation, - population accounting, - labor
accounting, - resource accounting, - brak NaN/Infinity.

------------------------------------------------------------------------

# 214. Gate C: Economy

PASS: - production, - market, - trade, - companies, - consumption, -
labor

działają wspólnie.

------------------------------------------------------------------------

# 215. Gate D: Autonomous AI

PASS: - founding, - production response, - hiring, - expansion, -
contraction, - closure, - PM adoption, - no perfect information.

------------------------------------------------------------------------

# 216. Gate E: Population & Settlement

PASS: - consumption, - migration, - settlement pressure, - stage
transitions.

------------------------------------------------------------------------

# 217. Gate F: Technology

PASS: - Discovery, - Availability, - Adoption

są rozdzielone i działają.

------------------------------------------------------------------------

# 218. Gate G: Causality

PASS: - Fact, - Edge, - WHY?, - WHY NOT?, - Architect Influence, -
memory compression.

------------------------------------------------------------------------

# 219. Gate H: Black Mountain

PASS nie oznacza „powstała metropolia".

PASS oznacza: - wynik jest mechanicznie spójny, - żadna faza nie jest
skryptowana, - WHY? wyjaśnia wynik.

------------------------------------------------------------------------

# 220. Gate I: Determinism & Save

PASS: - deterministic rerun, - speed independence, - save/load
continuation.

------------------------------------------------------------------------

# 221. Gate J: 200-Year Stability

Minimum: - 2400 ticków, - zero P0, - brak corruption, - brak causal
graph failure, - świat pozostaje symulowalny.

------------------------------------------------------------------------

# 222. Vertical Slice Definition of Tested

VS można uznać za przetestowany, jeśli wszystkie Gate A--J mają PASS.

P1 warnings: - mogą pozostać tylko jeśli są jawnie udokumentowane i nie
podważają głównego loopu.

------------------------------------------------------------------------

# 223. Kryterium przejścia VS → MVP

Przejście do rozszerzania contentu dopiero gdy:

1.  Black Mountain działa na wielu seedach,
2.  Food Valley działa,
3.  gospodarka zachowuje conservation,
4.  AI nie wymaga wyjątków per firma,
5.  Technology działa data-driven,
6.  WHY? jest wiarygodne,
7.  200 lat jest stabilne,
8.  save/load jest deterministyczny,
9.  performance ma zapas,
10. dodanie nowego dobra/firmy nie wymaga przebudowy silnika.

------------------------------------------------------------------------

# 224. Czego NIE robić przed przejściem do MVP

Nie zwiększać masowo: - liczby dóbr, - firm, - discoveries, -
regionów, - eventów

jeśli fundamentalne Gate nie przechodzą.

Więcej contentu utrudni diagnozę.

------------------------------------------------------------------------

# 225. Test Acceptance Philosophy

FIRST CAUSE nie ma jednego oczekiwanego świata.

Dlatego testy powinny pytać:

> Czy ten rezultat jest konsekwencją reguł?

a nie:

> Czy świat zrobił dokładnie to, co zaplanował projektant?

------------------------------------------------------------------------

# 226. Kanoniczne P0 FAIL

Natychmiastowy FAIL: - ujemna populacja, - ujemny stock zasobu, -
phantom goods, - phantom workers, - NaN/Infinity, - broken IDs, - firma
używa nieodkrytego zasobu, - firma używa niedostępnej technologii, -
nondeterministic rerun, - save/load zmienia wynik, - Causal Edge bez
mechanicznej podstawy, - dangling causal references.

------------------------------------------------------------------------

# 227. Kanoniczne WARNING

Wymagają analizy: - bardzo szybki wzrost populacji, - permanentny brak
firm, - nadmierna liczba firm, - ciągłe PM switching, - bardzo duża
migracja, - world homogenization, - zbyt gęsty Chronicle, - causal
memory rośnie zbyt szybko, - jeden sektor dominuje większość seedów.

------------------------------------------------------------------------

# 228. Raport testu

Każdy większy run powinien kończyć się:

``` text
BUILD
CONFIG
SEED
DURATION
FINAL TICK

P0 FAILURES
P1 FAILURES
WARNINGS

INVARIANTS
ECONOMY METRICS
POPULATION METRICS
COMPANY METRICS
TECH METRICS
CAUSAL METRICS
PERFORMANCE

MAJOR HISTORICAL EVENTS
BLACK MOUNTAIN RESULT
```

------------------------------------------------------------------------

# 229. Black Mountain Result Classification

Automatycznie sklasyfikować wynik jako jeden lub kilka:

-   NO_DEVELOPMENT
-   RESOURCE_BOOM
-   INDUSTRIALIZATION
-   RESOURCE_BUST
-   DIVERSIFICATION
-   IMPORT_TRANSITION
-   TECHNOLOGICAL_EXTENSION
-   GHOST_SETTLEMENT

Klasyfikacja opisuje wynik.

Nie steruje nim.

------------------------------------------------------------------------

# 230. Emergence Comparison Report

Dla wielu seedów:

``` text
Seed | Mine Founded | Peak Population | Bust | Diversified | Import Transition | Major Discovery
```

Pozwala oceniać różnorodność bez wymuszania jednej historii.

------------------------------------------------------------------------

# 231. Causal Coverage Report

Dla ważnych faktów:

``` text
Fact Type | Count | Has Causes | WHY? Valid | Chronicle Eligible
```

Cel: wykryć systemy, które zmieniają świat, ale nie przekazują
CausalContext.

------------------------------------------------------------------------

# 232. AI Explainability Report

Dla strategicznych decyzji:

``` text
Decision Type | Count | Snapshot Present | Major Factors Present | WHY NOT Supported
```

------------------------------------------------------------------------

# 233. Content Coverage Report

``` text
Resource | Used?
Good | Producer? Consumer?
Company | Viable Recipe?
PM | Technology Path?
Discovery | Unlock?
```

------------------------------------------------------------------------

# 234. Performance Regression

Nowy build nie powinien znacząco pogarszać: - ms/tick, - memory, - save
size

bez uzasadnionej funkcji.

Próg regresji zostanie ustalony w Performance Budget.

------------------------------------------------------------------------

# 235. Test Versioning

Raport musi przechowywać: - simulationVersion, - contentVersion, -
testSpecVersion, - seed.

Nie porównywać bezpośrednio golden results z różnych modeli bez
oznaczenia zmiany.

------------------------------------------------------------------------

# 236. Reproducibility

Każdy zgłoszony bug symulacji powinien być możliwy do odtworzenia
komendą zawierającą co najmniej: - build/version, - config, - seed, -
tick lub duration.

------------------------------------------------------------------------

# 237. Manual Simulation Review

Automatyczne testy nie wystarczą.

Okresowo projektant powinien przejrzeć: - Chronicle, - kilka regionów, -
WHY?, - firmy, - ceny, - migrację, - technologie

w 200-letnim świecie.

Cel: wyłapać zachowania formalnie poprawne, ale nieczytelne lub
nieinteresujące.

------------------------------------------------------------------------

# 238. Manual Review Checklist

Pytania: - Czy regiony mają własną historię? - Czy widać przyczynę
rozwoju/upadku? - Czy firmy reagują sensownie? - Czy ceny mają
znaczenie? - Czy transport zmienia gospodarkę? - Czy technologia zmienia
możliwości? - Czy świat adaptuje się do wyczerpania? - Czy WHY? jest
przekonujące? - Czy Chronicle opowiada najważniejsze rzeczy? - Czy
Architekt widzi konsekwencje swojej ingerencji?

------------------------------------------------------------------------

# 239. Test „Czy świat potrafi powiedzieć NIE?"

Bardzo ważny test filozoficzny.

System powinien czasem odmówić oczekiwanego rozwoju.

Przykład: - odkryto złoże, - ale brak transportu, - brak kapitału, -
brak popytu.

Rezultat: **nic większego się nie wydarza.**

To jest cecha, nie wada.

------------------------------------------------------------------------

# 240. Test „Czy świat potrafi się dostosować?"

Po szoku: - depletion, - shortage, - price increase, - technology change

świat powinien mieć mechanizmy: - substitution, - import, - migration, -
founding, - closure, - PM adoption.

Nie gwarantujemy sukcesu adaptacji.

------------------------------------------------------------------------

# 241. Test „Czy świat pamięta?"

Po 100 latach: - klikamy ważne miasto, - WHY? powinno wskazać
historyczne przyczyny.

Po kompresji: - ścieżka nadal istnieje.

------------------------------------------------------------------------

# 242. Test „Czy świat może być inny?"

Ten sam setup, różne seedy: - nie powinien zawsze tworzyć identycznej
historii, - jeśli istnieją probabilistyczne punkty rozgałęzienia.

------------------------------------------------------------------------

# 243. Test „Czy gracz nie jest centrum świata?"

Regiony nieobjęte interwencją: - nadal rozwijają się autonomicznie, -
tworzą własne firmy, - migrują, - odkrywają, - handlują.

------------------------------------------------------------------------

# 244. Test „Czy interwencja nie gwarantuje sukcesu?"

Architekt może poprawić warunek, ale: - AI, - rynek, - zasoby, -
transport

mogą sprawić, że oczekiwany skutek nie nastąpi.

Butterfly Effect opisuje konsekwencje, nie obiecuje ich.

------------------------------------------------------------------------

# 245. Test „Czy system nie oszukuje?"

Zakazane ukryte mechanizmy: - spawning brakujących dóbr, - sztuczne
tworzenie firm dla balansu, - gwarantowane discoveries, - darmowy
kapitał bez źródła, - teleport trade, - narracyjne eventy zmieniające
świat poza Simulation Model.

------------------------------------------------------------------------

# 246. Implementacja testów --- zasada

Test harness powinien być częścią projektu od początku.

Nie odkładać go do momentu „kiedy symulacja będzie gotowa".

Każdy nowy system: 1. implementacja, 2. unit tests, 3. integration test,
4. causal test, 5. scenario regression.

------------------------------------------------------------------------

# 247. Kolejność budowy test suite

## ST-01

Global invariants.

## ST-02

Data validators.

## ST-03

Economy conservation.

## ST-04

Market/Production.

## ST-05

Company AI.

## ST-06

Labor/Population/Migration.

## ST-07

Technology.

## ST-08

Causality.

## ST-09

Black Mountain.

## ST-10

Save/Determinism.

## ST-11

Long-run.

## ST-12

Performance/Statistical.

------------------------------------------------------------------------

# 248. Definition of Done --- pojedynczy system

System można uznać za gotowy do integracji, gdy: - ma unit tests, - ma
invariant checks, - ma przynajmniej jeden integration test, - przekazuje
CausalContext, - działa deterministycznie, - nie wymaga specjalnego
wyjątku w Black Mountain.

------------------------------------------------------------------------

# 249. Definition of Done --- Simulation Test Suite v0.1

Specyfikacja jest wdrożona dla Vertical Slice, jeśli:

-   istnieje automatyczny invariant monitor,
-   istnieje data validator,
-   działa conservation audit,
-   istnieją testy Market/Production/Trade,
-   istnieją testy Company AI,
-   istnieją testy Migration/Settlement,
-   istnieją testy Technology,
-   istnieją testy Causality,
-   Black Mountain ma pełny scenario suite,
-   działa determinism test,
-   działa save/load test,
-   działa 200-year test,
-   raportuje performance,
-   błędy są reprodukowalne przez seed.

------------------------------------------------------------------------

# 250. Ustalenia kanoniczne v0.1

-   Testujemy mechanizmy, nie jedną historię.
-   P0 invariants są bezwzględne.
-   Conservation audits są obowiązkowe.
-   Determinizm jest obowiązkowy.
-   Save/load nie może zmieniać przyszłości świata.
-   WHY? musi wynikać z CausalContext.
-   Black Mountain jest głównym scenariuszem integracyjnym.
-   Food Valley testuje gospodarkę żywnościową.
-   Trade Corridor testuje transport i handel.
-   Technology Divergence testuje Discovery/Availability/Adoption.
-   Urban Pressure testuje sprzężenia hamujące.
-   200 lat jest obowiązkowym benchmarkiem VS.
-   500 i 1000 lat są kolejnymi poziomami stabilności.
-   Wiele rezultatów scenariusza może być poprawnych.
-   Brak rozwoju może być poprawnym wynikiem.
-   Każdy P0/P1 bug otrzymuje regression test.
-   Content validators uruchamiają się automatycznie.
-   Test harness powstaje równolegle z silnikiem.

------------------------------------------------------------------------

# 251. Następny dokument

Po Simulation Test Spec kolejnym dokumentem w ustalonej kolejności
powinien być:

**`FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md`**

Powinien zdefiniować: - co staje się wydarzeniem historycznym, -
Historical Significance, - Chronicle Candidate, - Concise / Standard /
Detailed, - agregację wydarzeń, - epoki i turning points, - historię
regionu/firmy/technologii, - integrację z Causality Engine, - zasady
generowania tekstu bez wymyślania faktów.

------------------------------------------------------------------------

# 252. Kryterium końcowe

Simulation Test Spec spełnia swoją rolę, jeśli zespół może uruchomić
200-letni świat i nie pytać wyłącznie:

> „Czy gra się nie wywaliła?"

lecz otrzymać odpowiedź:

``` text
Czy gospodarka zachowała bilans?        PASS
Czy firmy używały legalnych danych?     PASS
Czy migracja zachowała populację?       PASS
Czy technologie miały prerequisites?    PASS
Czy AI było deterministyczne?           PASS
Czy save/load zachował przyszłość?      PASS
Czy WHY? wskazuje realne przyczyny?      PASS
Czy causal memory przetrwała 200 lat?   PASS
Czy Black Mountain był emergentny?      PASS
Czy świat pozostał aktywny i różnorodny? PASS/WARNING
```

Dopiero wtedy można bezpiecznie rozszerzać FIRST CAUSE o dziesiątki
kolejnych dóbr, firm, technologii i setki regionów.

> **Najpierw udowadniamy, że świat działa. Dopiero potem czynimy go
> większym.**

**KONIEC --- FIRST CAUSE Simulation Test Spec v0.1**
