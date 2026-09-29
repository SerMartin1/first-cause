# FIRST CAUSE --- Simulation Model v0.1

**Status:** robocza specyfikacja implementacyjna  
**Dokument nadrzędny:** FIRST CAUSE --- Koncepcja i architektura v0.6  
**Cel:** zdefiniowanie sposobu działania i obliczania autonomicznej
symulacji świata.  
**Zasada rozdziału dokumentacji:** Architecture opisuje *co istnieje i
dlaczego*; Simulation Model opisuje *jak system jest liczony, w jakiej
kolejności i według jakich reguł*.

------------------------------------------------------------------------

## 1. Simulation Principles

FIRST CAUSE jest symulacją systemową. Zmiany świata powinny wynikać
przede wszystkim ze stanu świata, lokalnych warunków oraz interakcji
między systemami, a nie ze skryptowanych rezultatów.

### Zasady nadrzędne

1.  **Emergence over scripting** --- rezultaty mają wynikać z warunków i
    zależności.
2.  **Cause before effect** --- każda istotna zmiana musi mieć możliwą
    do zapisania przyczynę.
3.  **Local before global** --- gospodarka, populacja, handel i rozwój
    zaczynają się lokalnie.
4.  **Feedback loops** --- systemy oddziałują na siebie w obie strony.
5.  **Gradual change** --- większość zmian jest procesem, nie
    natychmiastowym skokiem.
6.  **Explainability** --- ważne decyzje AI i wydarzenia muszą być
    możliwe do wyjaśnienia przez Causality / WHY?.
7.  **No free creation** --- ludność, dobra, zasoby, pieniądze i
    zdolności produkcyjne nie mogą pojawiać się bez źródła.
8.  **Simulation first, presentation second** --- UI i Chronicle
    prezentują stan symulacji, ale go nie definiują.

------------------------------------------------------------------------

## 2. Simulation Clock

### 2.1. Tick

**1 tick = 1 miesiąc świata.**

Demografia jest liczona **miesięcznie**, nie wyłącznie w bilansie
rocznym.

### 2.2. Podstawowa kolejność miesięcznego ticka

1.  Environment update
2.  Resource availability / depletion
3.  Demography
4.  Production planning
5.  Production
6.  Inventory update
7.  Market demand
8.  Price adjustment
9.  Trade and transport
10. Company finances
11. Employment and wages
12. Household income and consumption
13. Services consumption / availability
14. Needs satisfaction
15. Migration
16. Settlement and urbanization pressure
17. State finances and policies
18. Technology / knowledge processes
19. Culture and politics processes
20. Event resolution
21. Causality graph update
22. Chronicle significance evaluation
23. End-of-tick validation

Nie wszystkie ciężkie procesy muszą wykonywać pełny audyt w każdym
ticku. Można stosować rozłożone aktualizacje, jeżeli nie zmienia to
wyniku modelu.

### 2.3. Prędkości

Interfejs docelowo: - Pause - ×1 - ×5 - ×20 - ×100 - Simulate 1 year -
Simulate 5 years - Simulate 10 years - Simulate 50 years - Simulate
until next important event

Przy wysokiej prędkości renderer nie musi wizualizować każdego ticka.

------------------------------------------------------------------------

## 3. World Graph Model

FIRST CAUSE w wariancie C nie wymaga klasycznej mapy jako podstawowego
interfejsu. Geografia istnieje jednak w pełni w modelu symulacji.

### 3.1. Region

Każdy region posiada m.in.:

``` text
Region
├ id
├ name
├ terrain
├ climate
├ fertility
├ waterAccess
├ environment
├ population
├ resources
├ settlements
├ companies
├ market
├ services
├ culture
├ state
├ infrastructure
└ connections[]
```

### 3.2. Connection

``` text
Connection
├ regionA
├ regionB
├ physicalDistance
├ terrainDifficulty
├ infrastructure
├ capacity
├ security
├ borderFriction
└ seasonalModifier
```

### 3.3. Effective Distance

Odległość ekonomiczna nie jest równa samej odległości fizycznej.

``` text
EffectiveDistance =
PhysicalDistance
× TerrainModifier
× InfrastructureModifier
× BorderModifier
× SecurityModifier
× SeasonalModifier
```

### 3.4. Wielkość świata

Gracz może sam wybrać **liczbę regionów** przy tworzeniu świata, aż do
limitu wspieranego przez daną konfigurację i wersję silnika.

Zalecane presety projektowe:

- Vertical Slice: **24–40 regionów**; referencyjnie 32.
- Small: około **250 regionów**.
- Standard: około **600 regionów**.
- Large: około **1 200 regionów**.
- Huge: około **2 000 regionów**.
- Architecture Target / Maximum: **do 3 000 regionów**.

Preset nie blokuje ręcznego wyboru liczby regionów w zakresie wspieranym
przez build.

**3 000 regionów jest celem architektonicznym silnika, a nie obietnicą
wydajności dla wersji premierowej.** Finalny oficjalnie wspierany limit
zostanie ustalony na podstawie benchmarków CPU, pamięci, save/load oraz
stabilności symulacji długoterminowej.

Region pozostaje podstawową jednostką obliczeniową. Liczba regionów nie
jest powiązana sztywną proporcją z liczbą państw. Państwa są emergentnymi
zbiorami regionów i mogą obejmować od kilku do bardzo wielu regionów.

------------------------------------------------------------------------

## 4. Population Model

Populacja jest symulowana głównie poprzez **Population Cohorts**, nie
indywidualnych NPC.

### 4.1. Cohort

``` text
Cohort
├ ageGroup
├ economicClass
├ profession
├ skillLevel
├ culture
├ population
├ income
├ wealth
├ employment
├ education
├ needs
└ location
```

### 4.2. Grupy wiekowe

1.  0--14 --- Children
2.  15--24 --- Young
3.  25--44 --- Adults
4.  45--64 --- Mature
5.  65+ --- Elderly

### 4.3. Klasy ekonomiczne

1.  Poor
2.  Working
3.  Middle
4.  Wealthy
5.  Elite

### 4.4. Kwalifikacje

1.  Unskilled
2.  Skilled
3.  Specialist

### 4.5. Demografia miesięczna

Każdego miesiąca system oblicza m.in.: - births, - natural deaths, -
crisis mortality, - aging transfer between cohorts, - migration
inflow/outflow.

Płodność i śmiertelność zależą m.in. od: - wieku, - zaspokojenia
potrzeb, - dostępności żywności, - opieki zdrowotnej, - poziomu wiedzy
medycznej, - bezpieczeństwa, - wojny, - epidemii, - warunków
środowiskowych.

Współczynniki pozostają parametrami tuningowymi.

### 4.6. Historical Characters

Nie każdy człowiek jest indywidualnym agentem. System może promować
osoby z agregatu do Historical Characters, gdy ich znaczenie przekroczy
odpowiedni próg.

------------------------------------------------------------------------

## 5. Needs & Services Model

### 5.1. Hierarchia potrzeb

**Survival** - food - water - shelter

**Basic** - clothing - heating / basic energy - basic household goods

**Comfort** - better food - furniture - transport - consumer goods

**Prosperity** - education - healthcare - advanced services - leisure -
luxury consumption

**Modern** - electricity - communications - modern transport - advanced
healthcare - advanced services

### 5.2. Services są osobną kategorią

Services nie są zwykłymi magazynowalnymi Goods.

Przykłady: - Housing - Education - Healthcare - Transport Services -
Administration - Retail / Commercial Services - Communication Services

Usługi mają własną: - capacity, - accessibility, - price/cost, -
quality, - workforce requirement, - infrastructure requirement.

------------------------------------------------------------------------

## 6. Resources Model

Docelowo około **38 zasobów naturalnych**.

### 6.1. Proponowany katalog

**Food / Agriculture** 1. Grain 2. Rice 3. Maize 4. Potatoes 5. Fruit 6.
Vegetables 7. Livestock 8. Fish

**Organic** 9. Timber 10. Cotton 11. Wool 12. Flax 13. Rubber 14.
Leather

**Construction** 15. Stone 16. Clay 17. Sand 18. Limestone 19. Marble

**Basic Metals** 20. Iron Ore 21. Copper Ore 22. Tin 23. Lead 24. Zinc
25. Bauxite

**Precious Metals** 26. Gold 27. Silver

**Energy** 28. Coal 29. Oil 30. Natural Gas 31. Uranium

**Industrial / Strategic** 32. Sulfur 33. Salt 34. Phosphate 35. Nickel
36. Lithium 37. Rare Earths 38. Graphite

Lista podlega jeszcze finalnemu audytowi podczas tworzenia Resource →
Goods Matrix.

### 6.2. Deposit

``` text
Deposit
├ resourceType
├ quantity
├ quality
├ accessibility
├ discoveryState
├ extractionDifficulty
├ technologyRequirements
├ environmentalCost
└ renewability
```

### 6.3. Wyczerpywanie złóż

Złoża nieodnawialne są **realnie wyczerpywane** przez wydobycie.

Wraz ze spadkiem ilości dostępnego zasobu mogą: - spadać łatwo dostępne
rezerwy, - rosnąć koszt wydobycia, - spadać produktywność, - rosnąć cena
zasobu, - wzrastać presja na import, - wzrastać presja technologiczna na
wydobycie trudniejszych rezerw, - wzrastać atrakcyjność substytutów.

### 6.4. Co dzieje się po wyczerpaniu złoża?

Wyczerpanie nie oznacza automatycznego zniknięcia miasta.

System uruchamia **Post-Depletion Transition**:

``` text
Deposit depletion
→ Extraction cost ↑
→ Mine profitability ↓
→ Production ↓
→ Layoffs
→ Local income ↓
→ Migration pressure ↑
```

Następnie możliwe są różne ścieżki:

**A. Resource Bust**  
Region nie znajduje alternatywy → zamykanie firm → bezrobocie →
emigracja → stagnacja lub upadek miasta.

**B. Economic Diversification**  
Miasto wcześniej rozwinęło handel, usługi lub przemysł → przechodzi do
nowych sektorów.

**C. Import Transition**  
Lokalny przemysł przetwórczy pozostaje, ale zaczyna importować surowiec.

**D. Technological Extension**  
Nowa technologia pozwala wykorzystać wcześniej niedostępne, głębsze lub
gorszej jakości rezerwy.

**E. Substitution**  
Gospodarka zastępuje wyczerpany surowiec innym materiałem lub
technologią.

**F. Ghost Settlement**  
Przy skrajnej zależności od jednego zasobu osada może znacząco się
skurczyć lub zostać opuszczona.

To ma być ważne źródło emergentnych historii i Chronicle.

------------------------------------------------------------------------

## 7. Goods & Production Model

Docelowo około **50--70 dóbr**.

### 7.1. Łańcuch

``` text
RESOURCE
→ EXTRACTION
→ PROCESSING
→ INTERMEDIATE GOODS
→ FINAL GOODS
→ TRANSPORT
→ MARKET
→ CONSUMPTION
```

### 7.2. Przykłady

``` text
Grain → Flour → Bread
Timber → Lumber → Furniture
Iron Ore → Iron → Tools
Iron + Coal → Steel → Machinery
Cotton → Textile → Clothing
Oil → Fuel / Chemicals
Chemicals → Fertilizer
```

### 7.3. Production Recipe

Każdy proces produkcyjny definiuje:

``` text
inputs
resourceRequirements
laborRequirements
skillRequirements
energyRequirements
technologyRequirements
infrastructureRequirements
outputs
waste/environmentalEffects
```

Pełna Resource → Goods → Company → Production Method Matrix zostanie
przygotowana jako aneks / kolejna część Simulation Model.

------------------------------------------------------------------------

## 8. Market & Price Model

### 8.1. Rynki regionalne

Każdy region ma własny rynek:

``` text
Supply
Demand
Inventory
LocalPrice
ImportDemand
ExportSupply
ShortageSeverity
```

### 8.2. Cena

Ceny reagują **stopniowo**, a nie poprzez natychmiastowe equilibrium.

Model bazowy:

``` text
PricePressure =
Sensitivity × ((Demand - Supply) / NormalSupply)

NewPrice =
OldPrice × (1 + PricePressure)
```

Należy stosować: - price floors, - miesięczne limity zmian, -
wygładzanie, - inventory buffers, - reakcję na oczekiwania firm.

Docelowe parametry są tuningowane testami.

### 8.3. Import

``` text
ImportedCost =
ForeignPrice
+ TransportCost
+ Tariff
+ RiskCost
```

Import staje się atrakcyjny, gdy ImportedCost jest odpowiednio niższy od
lokalnej ceny.

### 8.4. Shortage Severity

Robocza skala: - 0--10 Normal - 10--25 Tight Supply - 25--50 Shortage -
50--75 Severe Shortage - 75+ Crisis

Progi podlegają tuningowi.

------------------------------------------------------------------------

## 9. Company AI

Firma działa w cyklu:

``` text
OBSERVE
→ FORECAST
→ DECIDE
→ ACT
→ EVALUATE
```

Analizuje m.in.: - prices, - demand, - costs, - labor, - skills, -
transport, - resources, - competition, - technology, - energy, - market
access.

Możliwe działania: - increase/decrease production, - hire/fire, - change
Production Method, - invest, - expand, - open facility, - close
facility, - enter another region, - exit a region, - bankrupt.

### 9.1. Wieloregionalność

- Local Business --- zasadniczo lokalny.
- Company --- może stać się wieloregionalna.
- Major Company --- może prowadzić działalność w wielu regionach i stać
  się historycznym aktorem świata.

------------------------------------------------------------------------

## 10. Entrepreneurship & Company Creation

Firmy nie powinny powstawać czysto losowo.

``` text
OpportunityScore =
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

Wysoki Opportunity Score zwiększa prawdopodobieństwo powstania firmy.

Przedsiębiorca nie musi być od początku indywidualnym Historical
Character. System może promować założyciela do postaci historycznej
dopiero po osiągnięciu znaczenia.

------------------------------------------------------------------------

## 11. Employment & Wages

### 11.1. Rynek pracy

``` text
LaborDemand ↑ + LaborSupply ↓ → WagePressure ↑
LaborDemand ↓ + LaborSupply ↑ → WagePressure ↓
```

Wpływają również: - skill level, - productivity, - cost of living, -
company profitability, - technology, - labor mobility.

### 11.2. Skill mismatch

Może istnieć jednocześnie: - wysokie bezrobocie, - brak pracowników
określonej kwalifikacji.

Poziomy: - Unskilled - Skilled - Specialist

------------------------------------------------------------------------

## 12. Migration Model

``` text
MigrationAttraction =
Jobs
+ ExpectedWage
+ Safety
+ NeedsAvailability
+ CulturalAffinity
+ FamilyConnections
+ Services
- HousingCost
- EffectiveDistance
- BorderFriction
- Conflict
- EnvironmentalRisk
```

Migracja jest **probabilistyczna**, nie deterministyczna.

### Vertical Slice

W Vertical Slice implementowana jest przede wszystkim **migracja
regionalna region ↔ region**. Pełna migracja międzypaństwowa może zostać
rozszerzona później.

------------------------------------------------------------------------

## 13. Settlement & City Model

### 13.1. Settlement Pressure

Określa atrakcyjność miejsca dla trwałego osadnictwa.

Czynniki: - food, - water, - jobs, - trade, - safety, - accessibility, -
resources, - infrastructure, - disease, - conflict, - environmental
risk.

### 13.2. Urbanization Pressure

``` text
UrbanizationPressure =
Jobs
+ Trade
+ PopulationDensity
+ Infrastructure
+ Services
+ Administration
- HousingPressure
- Disease
- Conflict
- EnvironmentalStress
```

### 13.3. Etapy

Camp → Hamlet → Village → Town → City → Metropolis

Awans nie jest oparty wyłącznie na populacji. Wymaga funkcji miejskich,
takich jak: - market, - diversified economy, - infrastructure, -
services, - permanent built environment, - regional importance.

Miasto może awansować, stagnować, zmienić specjalizację, podupaść lub
zostać częściowo opuszczone.

### 13.4. Koniec osady (SET-LIFECYCLE-001)

W kroku Settlement Growth ticka (po migracji i demografii) aktywna
osada, której populacja wynosi dokładnie 0, przechodzi `ACTIVE →
ABANDONED` w tym samym ticku i emituje fakt `settlement_abandoned`
(subject = osada, location = region + osada). Przyczynami faktu są
fakty tego ticka, które zmniejszyły populację osady
(`population_declined`, `population_migrated_out`). Opuszczona osada:

-   pozostaje w World State jako encja historyczna,
-   nie uczestniczy we wzroście, housingu ani presji osadniczej,
-   nie jest celem migracji (region bez aktywnej osady zachowuje się
    jak region bez osad --- migranci osiadają jako kohorta regionalna),
-   nie przyjmuje nowych firm; istniejące firmy zachowują swoje
    `settlementId` jako historyczne powiązanie i działają dalej przez
    regionalny rynek i siłę roboczą (istniejące mechanizmy ekonomii).

Ponowne zasiedlenie tworzy nową osadę (nowe id); stara nie jest
reaktywowana.

------------------------------------------------------------------------

## 14. Technology & Knowledge Model

Przyjęto **12 Knowledge Domains**:

1.  Agriculture
2.  Construction
3.  Metallurgy
4.  Mining
5.  Navigation
6.  Medicine
7.  Mathematics
8.  Mechanics
9.  Chemistry
10. Energy
11. Transportation
12. Communication

Administration może być reprezentowane jako zdolność
instytucjonalna/polityczna, a nie osobna domena technologiczna w v0.1.

### 14.1. Discovery Engine

Odkrycie zależy od: - knowledge levels, - existing discoveries, -
resources, - needs, - industry concentration, - education, -
specialists, - trade contacts, - culture, - shortages, - conflicts, -
tools and Production Methods.

### 14.2. Trzy oddzielne stany

**Discovery ≠ Availability ≠ Adoption**

Przykład:

``` text
Electricity discovered: YES
Known in Greenford: YES
Commercially available: YES
Population access: 23%
Industry adoption: 41%
```

### 14.3. Diffusion

Technologie rozprzestrzeniają się przez: - trade, - migration, -
education, - espionage, - war, - foreign investment, - cultural
proximity.

------------------------------------------------------------------------

## 15. State AI & State Finances

Państwo działa w cyklu:

``` text
OBSERVE
→ PRIORITIZE
→ BUDGET
→ POLICY
→ EVALUATE
```

### 15.1. Priorytety

- Growth
- Security
- Stability
- Infrastructure
- Education
- Military
- Trade

Polityka w v0.1 pozostaje relatywnie płytka. Państwo jest przede
wszystkim aktorem ekonomiczno-strategicznym.

### 15.2. Dochody

- Income Tax
- Business Tax
- Trade Tariffs
- Resource Revenue

### 15.3. Wydatki

- Administration
- Infrastructure
- Military
- Education
- Healthcare
- Public Order
- Social Support
- Debt Service

``` text
BudgetBalance = Revenue - Expenses
```

Deficyt może prowadzić do długu i kosztów obsługi.

------------------------------------------------------------------------

## 16. Energy Model

Energia nie jest liniowym upgradem. Źródła nakładają się na siebie.

### 16.1. Fazy

**Biomass** - wood - charcoal - human labor - animal power

**Coal** - steam - heavy industry - rail - steel

**Oil & Gas** - fuel - chemicals - motor transport - industrial heat

**Electricity** - jest produkowanym dobrem/systemem energii, nie
surowcem naturalnym.

### 16.2. Model

``` text
Primary Energy
→ Conversion
→ Distribution
→ Consumption
```

Przykład:

``` text
Coal
→ Power Plant
→ Electricity
→ Grid
→ Industry / Households
```

Region przechowuje m.in.:

``` text
ElectricitySupply
ElectricityDemand
GridCapacity
GenerationMix
AccessRate
```

W v0.1 elektryczność nie wymaga magazynowania między tickami;
bilansowana jest w bieżącym okresie.

------------------------------------------------------------------------

## 17. Causality Model

Każda istotna zmiana może generować relację:

``` text
Cause → Effect
```

### 17.1. Causal Edge

``` text
source
target
type
strength
delay
scope
confidence
architectInfluence
```

### 17.2. Publiczne poziomy

- Primary
- Significant
- Minor
- Trace

UI nie pokazuje fałszywej precyzji procentowej.

### 17.3. Hierarchical Causal Memory

- ostatnie ~25 lat --- szczegółowo,
- ~25--100 lat --- agregacja powtarzalnych zdarzeń,
- 100+ lat --- zachowywane głównie historycznie istotne procesy i węzły.

Progi są tuningowane.

------------------------------------------------------------------------

## 18. Chronicle & Historical Significance

Roboczy model:

``` text
HistoricalSignificance =
Magnitude
× Duration
× PopulationAffected
× GeographicScope
× Novelty
× CausalImpact
```

Klasy robocze: - 0--20 noise - 20--50 local - 50--75 national - 75--90
world - 90+ era-defining

Wartości nie są kontraktem balansu i podlegają testom.

### 18.1. Czułość Chronicle

Gracz może wybrać: - **Concise** - **Standard** - **Detailed**

Zmienia to prezentację i próg raportowania, ale **nie wynik symulacji**.

------------------------------------------------------------------------

## 19. Feedback Loop Registry

Simulation Model utrzymuje jawny rejestr oczekiwanych sprzężeń
zwrotnych.

### FL-001 Prosperity Loop

Jobs → Migration → Population → Demand → Businesses → Jobs

### FL-002 Urban Crisis

Population → Housing Demand → Housing Cost → Cost of Living → Lower
Attraction

### FL-003 Resource Boom

Discovery → Extraction → Jobs → Migration → City Growth → Infrastructure
→ Higher Extraction

### FL-004 Resource Bust

Extraction → Depletion → Costs → Lower Profit → Layoffs → Out-Migration
→ Decline

### FL-005 Industrialization

Industry → Machinery Demand → Machinery Industry → Productivity → Lower
Costs → Demand → Industry

### FL-006 Innovation Loop

Wealth → Education → Knowledge → Innovation → Productivity → Wealth

### FL-007 Poverty Trap

Low Productivity → Low Wages → Low Education → Low Innovation → Low
Productivity

### FL-008 Trade Hub

Good Access → Trade → Infrastructure → Lower Transport Cost → More Trade

### FL-009 War Economy / Destruction

War → Destruction → Lower Production → Shortages → Prices → Instability
→ Migration/Rebellion

### FL-010 Environmental Degradation

Population/Industry → Resource Use → Environmental Stress → Lower
Productivity/Health → Economic Pressure

Każda pętla powinna być możliwa do testowania przez Codex i testy
symulacyjne.

------------------------------------------------------------------------

## 20. Simulation Invariants

Twarde prawa silnika:

``` text
population >= 0
resource.quantity >= 0
inventory >= 0
price > 0
employment <= availableWorkingPopulation
exports <= availableGoods
company.cash is finite
```

Dodatkowo:

- Towar nie może pojawić się bez źródła.
- Firma nie może zatrudnić nieistniejącej siły roboczej.
- Region nie może wyeksportować więcej niż posiada.
- Zasób nie może zostać wydobyty bez dostępnego złoża.
- Produkcja nie może zużyć więcej inputów niż jest dostępne.
- Technologia nie może zostać zastosowana przed uzyskaniem odpowiedniej
  wiedzy/dostępności.
- Wyczerpane złoże nie może generować dalszej standardowej produkcji bez
  alternatywnej rezerwy/technologii.
- Każda zmiana stanu musi pozostawić świat w stanie numerycznie
  poprawnym.

Do tych reguł powinny istnieć testy automatyczne.

------------------------------------------------------------------------

## 21. Determinism & World Seed

Symulacja jest **seeded deterministic**.

Przy tej samej: - wersji Simulation Model, - World Seed, - konfiguracji
startowej, - kolejności interwencji Architekta,

wynik powinien być powtarzalny.

Randomness musi korzystać z kontrolowanego seeded RNG. Niedozwolone jest
używanie niekontrolowanego źródła losowości w logice symulacji.

To jest fundament dla: - debugowania, - testów, - Experiment Mode, -
reprodukcji błędów, - przyszłych Parallel Worlds.

------------------------------------------------------------------------

## 22. Performance Budget

Cel architektoniczny świata: **do 3 000 regionów**.

Nie jest to gwarantowany limit wersji premierowej. Performance Budget ma
ustalić, jaki maksymalny preset zostanie oficjalnie wsparty. Silnik,
struktury danych, indeksy, zapis i UI nie mogą jednak zakładać twardego
limitu 800 regionów.

Standardowa symulacja powinna być projektowana tak, aby obsługiwać: -
setki regionów, - setki/tysiące osad, - tysiące firm, - bardzo dużą
populację reprezentowaną kohortami, - długą historię, - tysiące
znaczących zdarzeń, - ×100 bez konieczności renderowania każdego ticka.

Nie symulujemy milionów indywidualnych NPC.

Optymalizacja nie może łamać determinizmu ani Simulation Invariants.

------------------------------------------------------------------------

## 23. Vertical Slice --- VS-001

### Konfiguracja

``` text
Regions: 24–40 (domyślny test: 32)
Starting Population: ~200
Resources: 10–12
Goods: ~15
Company Types: ~8
Knowledge Domains: 5 aktywnych w VS
Architect Interventions: ~5
Migration: regional only
States: disabled initially / optional late VS
War: disabled
Culture: simplified
Target Simulation: 200 years
Tick: 1 month
```

### Black Mountain Test

Główny test dowodzący działania rdzenia:

``` text
Iron revealed
→ Economic Opportunity
→ Mine Founded
→ Employment
→ Migration
→ Settlement Growth
→ Trade
→ Urbanization
→ Resource Depletion
→ Diversification OR Import Transition OR Resource Bust
```

Causality / WHY? musi umieć wyjaśnić najważniejsze elementy tego
przebiegu.

Test nie może być skryptowaną sekwencją. Ma wynikać z modelu.

------------------------------------------------------------------------

## 24. Architect Interventions v0.1

### Environment

- Improve Fertility
- Create Forest
- Water Source
- Climate Shift

### Resources

- Reveal Deposit
- Create Deposit
- Enrich Deposit
- Deplete Deposit

### Population

- Founding Community
- Migration Pull
- Population Resilience

### Knowledge

- Knowledge Spark
- Knowledge Transfer

### Economy

- Trade Opportunity
- Resource Awareness

### Experimental Events

- Drought
- Flood
- Earthquake
- Great Harvest
- Disease Outbreak

Interwencje mają koszt Influence zależny od: - magnitude, - duration, -
geographic scope, - naturalness / degree of direct interference.

Vertical Slice używa ograniczonego podzbioru.

------------------------------------------------------------------------

## 25. Influence v0.1

Maksymalny poziom roboczy: **100**.

Źródła regeneracji: 1. powolna regeneracja czasowa, 2. Causal
Discoveries, 3. wejście świata w nową erę, 4. first-of-kind historical
events, 5. ukończone eksperymenty, 6. ważne milestones obserwacyjne.

Nie nagradzamy katastrof samych w sobie; nagradzamy wiedzę, obserwację i
eksperyment.

Dokładne koszty pozostają parametrami balansu.

------------------------------------------------------------------------

## 26. Household Economy

Każda kohorta ekonomiczna posiada:

``` text
averageIncome
averageWealth
employmentRate
consumptionBudget
savingsRate
taxBurden
housingCost
needsSatisfaction
```

Przepływ:

``` text
Wages
+ Transfers
+ Property Income
- Taxes
= Disposable Income
```

Kolejność wydatków:

``` text
Survival
→ Basic
→ Services
→ Comfort
→ Prosperity
→ Luxury
→ Savings
```

Klasy ekonomiczne zmieniają się stopniowo na podstawie długotrwałych
dochodów, majątku i bezpieczeństwa ekonomicznego.

Region może posiadać **Economic Mobility Score**.

------------------------------------------------------------------------

## 27. Company Types & Production Methods

Docelowo około **20--30 archetypów firm**.

Przykładowe archetypy: - Farm - Livestock Farm - Fishing Company -
Forestry Company - Mine - Quarry - Mill - Textile Workshop - Smelter -
Steelworks - Food Processor - Furniture Workshop - Construction
Company - Transport Company - Trading Company - Machinery Factory -
Chemical Plant - Fuel Refinery - Electric Equipment Factory - Bank -
Retail Company - Services Company

### Production Method

Technologia przede wszystkim odblokowuje **nowe sposoby produkcji**, a
nie tylko procentowe bonusy.

Przykład:

``` text
Wheat Farm

PM1 Manual Farming
PM2 Animal-Powered Farming
PM3 Mechanized Farming
PM4 Industrial Agriculture
```

Firma sama ocenia, czy nowy Production Method jest ekonomicznie
opłacalny.

Dostępność technologii nie oznacza automatycznej adopcji.

------------------------------------------------------------------------

## 28. Transport Model

Tryby transportu pojawiają się wraz z rozwojem:

``` text
Foot / Pack Animals
→ Cart
→ River Transport
→ Sailing
→ Railway
→ Motor Transport
→ Modern Shipping
```

Koszt:

``` text
TransportCost =
EffectiveDistance
× CargoFactor
× TransportModeCost
× CongestionModifier
```

Połączenia mają capacity.

Przeciążenie:

``` text
TradeDemand > RouteCapacity
→ Congestion
→ TransportCost ↑
→ InfrastructurePressure ↑
```

Może to prowadzić do inwestycji infrastrukturalnych i powstania Trade
Hub.

------------------------------------------------------------------------

## 29. Open Design Item --- Resource → Goods → Company → Production Method Matrix

Najważniejszym niezakończonym elementem Simulation Model v0.1 jest pełna
macierz produkcyjna.

Należy przygotować dla każdego elementu:

### Resource

- availability,
- terrain/climate,
- discovery requirements,
- renewability,
- depletion,
- extraction methods.

### Good

- inputs,
- output quantity,
- use cases,
- consumer/industrial demand,
- storage,
- transport characteristics.

### Company

- company archetype,
- required capital,
- workforce,
- skill profile,
- facilities,
- market behavior.

### Production Method

- technology requirements,
- inputs,
- energy,
- labor,
- productivity,
- environmental impact,
- adoption economics.

Docelowy zakres: **~38 Resources → ~50--70 Goods → ~20--30 Company Types
→ Production Methods.**

To jest kolejny główny etap projektowania.

------------------------------------------------------------------------

## 30. Status decyzji v0.1

### Przyjęte

- tick miesięczny,
- demografia miesięczna,
- architecture target do 3 000 regionów; finalny wspierany limit po benchmarkach,
- ręczny wybór liczby regionów,
- 5 grup wiekowych,
- 5 klas ekonomicznych,
- 3 poziomy kwalifikacji,
- Services jako osobna kategoria,
- realne wyczerpywanie złóż,
- Post-Depletion Transition,
- regionalne rynki,
- stopniowa reakcja cen,
- Company AI,
- firmy wieloregionalne,
- probabilistyczna migracja,
- migracja regionalna w Vertical Slice,
- organiczne miasta,
- 12 Knowledge Domains,
- State AI w relatywnie płytkiej wersji początkowej,
- energia bez magazynowania elektryczności w v0.1,
- Causality: Primary / Significant / Minor / Trace,
- Chronicle: Concise / Standard / Detailed,
- Feedback Loop Registry,
- Simulation Invariants,
- seeded deterministic simulation,
- performance architecture target do 3 000 regionów; finalny certyfikowany limit po benchmarkach,
- Vertical Slice / Black Mountain Test.

### Otwarte

1.  Pełna Resource → Goods → Company → Production Method Matrix.
2.  Dokładne wartości parametrów tuningowych.
3.  Finalne progi Chronicle / Historical Significance.
4.  Finalne koszty Influence.
5.  Benchmarki wydajności dla Small / Standard / Large.
6.  Szczegółowe zestawy technologicznych Discoveries przypisanych do 12
    Knowledge Domains.

------------------------------------------------------------------------

# Zasada implementacyjna

Simulation Model jest specyfikacją zachowania silnika, ale wartości
balansowe powinny być przechowywane jako **konfigurowalne dane**, a nie
hardkodowane w logice.

Claude Code powinien rozdzielać: - simulation logic, - simulation
configuration, - content definitions, - localization, - rendering/UI.

Codex powinien móc audytować implementację względem: - Simulation
Invariants, - Feedback Loop Registry, - determinism, - Black Mountain
Test, - Causality explainability, - zgodności danych z
Resource/Production Matrix.
