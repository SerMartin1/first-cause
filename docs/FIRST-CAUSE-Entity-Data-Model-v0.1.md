# FIRST CAUSE --- Entity Data Model v0.1

**Status:** wersja robocza / kanoniczna specyfikacja modelu danych\
**Projekt:** FIRST CAUSE\
**Wersja dokumentu:** 0.1\
**Rola:** nadrzędna definicja encji symulacji, ich identyfikatorów, pól,
relacji, stanów, własności danych, serializacji i reguł walidacji.\
**Dokumenty nadrzędne:**\
- `FIRST-CAUSE-Koncepcja-i-Architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Production-Economy-Master-v0.1.md` -
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md`

------------------------------------------------------------------------

# 0. Cel dokumentu

Entity Data Model definiuje **co istnieje w stanie symulacji FIRST CAUSE
i jak obiekty są ze sobą powiązane**.

Nie opisuje szczegółowo algorytmów symulacji. Te należą do odpowiednich
systemów, przede wszystkim Simulation Model, Causality Engine i AI
Decision Model.

Dokument ma umożliwić implementację świata bez sytuacji, w której różne
moduły przechowują własne, sprzeczne wersje tych samych danych.

> **Jedna informacja ma jednego właściciela. Pozostałe systemy odwołują
> się do niej przez ID albo korzystają z jawnie oznaczonego
> cache/derived state.**

------------------------------------------------------------------------

# 1. Główne zasady modelu danych

1.  Wszystkie trwałe encje posiadają stabilne `id`.
2.  Relacje między encjami używają ID zamiast kopiowania całych
    obiektów.
3.  Dane konfiguracyjne są oddzielone od danych instancji świata.
4.  Dane kanoniczne są oddzielone od danych pochodnych.
5.  UI nie jest właścicielem danych symulacyjnych.
6.  Chronicle nie jest źródłem prawdy o historii --- zapisuje
    reprezentację faktów.
7.  Causality Graph odwołuje się do faktów i encji przez stabilne
    identyfikatory.
8.  Wszystkie liczby używane w symulacji muszą mieć określoną jednostkę
    lub skalę.
9.  Brak `NaN`, `Infinity`, ujemnych zapasów i wiszących referencji.
10. Dane losowe muszą być odtwarzalne przez seed.
11. Zapis gry zawiera stan potrzebny do deterministycznej kontynuacji.
12. Definicje contentu są data-driven.
13. Usunięcie/wyłączenie contentu nie może po cichu niszczyć
    istniejącego save.
14. Schemat musi działać dla Vertical Slice i świata docelowego do
    ustalonego limitu regionów.
15. Region pozostaje główną jednostką obliczeniową.
16. Populacja jest agregowana w kohorty, nie pełne NPC.
17. Postać historyczna jest promocją istotnej jednostki/roli, a nie
    podstawowym sposobem symulowania ludności.

------------------------------------------------------------------------

# 2. Warstwy danych

FIRST CAUSE powinien rozdzielać cztery warstwy.

## 2.1 Definition Data

Niezmienne lub wersjonowane definicje contentu:

``` text
ResourceDefinition
GoodDefinition
CompanyArchetypeDefinition
ProductionMethodDefinition
KnowledgeDomainDefinition
DiscoveryDefinition
ServiceDefinition
TransportModeDefinition
InterventionDefinition
```

Przykład: definicja `steel` mówi, czym jest stal i gdzie może być
używana. Nie przechowuje ilości stali w Krakowie konkretnego świata.

## 2.2 World State

Instancje istniejące w konkretnej symulacji:

``` text
World
Continent
Region
Connection
ResourceDeposit
Settlement
PopulationCohort
Company
Market
Inventory
State
Culture
Nation
Infrastructure
TechnologyState
ServiceCapacity
```

## 2.3 Derived State

Dane możliwe do ponownego obliczenia:

``` text
EffectiveDistance
MarketPressure
MigrationAttraction
SettlementPressure
UrbanizationPressure
OpportunityScore
HistoricalSignificance
RegionalStatistics
TechnologyEligibility
```

Nie powinny być źródłem prawdy.

## 2.4 Historical / Causal State

``` text
SimulationFact
CausalEdge
ChronicleEntry
ArchitectInterventionInstance
HistoricalCharacter
```

Ta warstwa umożliwia WHY?, Butterfly Effect i Chronicle.

------------------------------------------------------------------------

# 3. Konwencje identyfikatorów

Rekomendowane prefiksy:

``` text
world_
continent_
region_
connection_
settlement_
cohort_
company_
market_
inventory_
state_
culture_
nation_
deposit_
infra_
service_
character_
fact_
causal_
chronicle_
intervention_
```

Definicje contentu używają stabilnych slugów:

``` text
iron_ore
steel
steelworks
industrial_steelmaking
mechanics
steam_power
railway
```

ID instancji nie powinno zależeć od nazwy wyświetlanej.

------------------------------------------------------------------------

# 4. WORLD

World jest korzeniem całej symulacji.

``` yaml
World:
  id:
  schemaVersion:
  contentVersion:
  seed:
  name:
  createdAt:
  currentTick:
  currentDate:
  tickLength: month

  simulation:
    speed:
    paused:
    rngState:

  configuration:
    regionCount:
    worldSizePreset:
    chronicleSensitivity:
    enabledSystems:
    implementationPhase:

  continents: []
  regions: []
  states: []
  cultures: []
  nations: []
  activeInterventions: []

  globalState:
    population:
    economicIndicators:
    knowledgeIndicators:
    environmentalIndicators:

  history:
    lastFactId:
    lastChronicleId:
```

### Reguły

-   `seed` jest niezmienny.
-   `currentTick >= 0`.
-   `tickLength = month` w v0.1.
-   `regionCount` odpowiada realnej liczbie regionów.
-   globalne wskaźniki są głównie derived/cache.

------------------------------------------------------------------------

# 5. CONTINENT

Kontynent jest warstwą organizacyjną/geograficzną.

``` yaml
Continent:
  id:
  worldId:
  name:
  regionIds: []
  tags: []
```

Nie powinien prowadzić własnej pełnej symulacji gospodarczej. Agreguje
regiony.

------------------------------------------------------------------------

# 6. REGION

Region jest **główną jednostką obliczeniową świata**.

``` yaml
Region:
  id:
  worldId:
  continentId:
  name:

  geography:
    terrain:
    climate:
    area:
    fertility:
    waterAccess:
    coastal:
    elevationClass:

  environment:
    quality:
    pollution:
    waterStress:
    soilCondition:
    forestPressure:
    riskFactors: {}

  population:
    cohortIds: []
    totalPopulation:

  resources:
    depositIds: []

  settlements:
    settlementIds: []

  economy:
    companyIds: []
    marketId:
    regionalInventoryId:
    employment:
    wages:
    output:
    income:
    wealth:

  services:
    serviceCapacityIds: []

  knowledge:
    technologyStateId:

  society:
    dominantCultureId:
    cultureShares: {}
    nationShares: {}

  politics:
    stateId:
    influence:
    stability:

  infrastructure:
    infrastructureIds: []

  connections:
    connectionIds: []

  cached:
    migrationAttraction:
    settlementPressure:
    urbanizationPressure:
    marketAccess:
```

### Własność danych

Region agreguje odwołania. Nie powinien kopiować pełnych obiektów firm,
kohort czy złóż.

------------------------------------------------------------------------

# 7. CONNECTION

Połączenie reprezentuje relację transportową między regionami.

``` yaml
Connection:
  id:
  regionAId:
  regionBId:

  geography:
    physicalDistance:
    terrainDifficulty:
    seasonalModifier:

  infrastructure:
    level:
    transportModes: []
    capacity:

  friction:
    security:
    borderFriction:

  currentState:
    utilization:
    congestion:
    disrupted:

  cached:
    effectiveDistance:
    transportCostModifiers:
```

Kanonicznie:

`EffectiveDistance = PhysicalDistance × TerrainModifier × InfrastructureModifier × BorderModifier × SecurityModifier × SeasonalModifier`

### Reguły

-   A i B muszą istnieć.
-   A != B.
-   `capacity >= 0`.
-   `utilization >= 0`.
-   połączenia są jawne; brak teleportacji dóbr.

------------------------------------------------------------------------

# 8. RESOURCE DEFINITION

Definicja zasobu pochodzi z Production Economy Master.

``` yaml
ResourceDefinition:
  id:
  nameKey:
  category:
  renewable:
  occurrenceRules:
  discoveryRules:
  extractionMethodIds: []
  useGoodIds: []
  substituteIds: []
  strategicTags: []
  implementationPhase:
```

38 zasobów jest contentem, nie 38 specjalnymi klasami kodu.

------------------------------------------------------------------------

# 9. RESOURCE DEPOSIT

Złoże/zasób w konkretnym regionie.

``` yaml
ResourceDeposit:
  id:
  resourceDefinitionId:
  regionId:

  discovery:
    status:
    discoveredTick:
    discoveredByEntityId:
    confidence:

  stock:
    quantity:
    initialQuantity:
    quality:
    depth:
    accessibility:

  renewable:
    regenerationRate:
    sustainableYield:

  extraction:
    currentExtraction:
    cumulativeExtraction:
    marginalCostModifier:

  state:
    depleted:
    economicallyExhausted:
```

### Status odkrycia

``` text
UNKNOWN
SUSPECTED
DISCOVERED
ASSESSED
```

### Reguły

-   dla nieodnawialnych `quantity >= 0`;
-   wydobycie nie może tworzyć zasobu;
-   `cumulativeExtraction >= 0`;
-   złoże może być fizycznie niewyczerpane, ale ekonomicznie
    nieopłacalne.

------------------------------------------------------------------------

# 10. SETTLEMENT

Osady powstają i rozwijają się organicznie.

``` yaml
Settlement:
  id:
  regionId:
  name:
  foundedTick:

  stage:
    CAMP
    HAMLET
    VILLAGE
    TOWN
    CITY
    METROPOLIS

  population:
    cohortIds: []
    totalPopulation:

  economy:
    companyIds: []
    employment:
    localIncome:
    localWealth:

  housing:
    capacity:
    cost:
    pressure:

  services:
    serviceCapacityIds: []

  infrastructure:
    infrastructureIds: []

  society:
    cultureShares: {}

  state:
    attractiveness:
    urbanizationPressure:
    declinePressure:
```

Settlement nie powinien duplikować regionalnego rynku, jeśli v0.1 używa
rynku regionalnego.

------------------------------------------------------------------------

# 11. POPULATION COHORT

Podstawowa jednostka ludności.

``` yaml
PopulationCohort:
  id:
  regionId:
  settlementId:

  demographics:
    ageGroup:
    population:

  socioeconomic:
    economicClass:
    profession:
    skillLevel:
    employment:
    averageIncome:
    averageWealth:

  identity:
    cultureId:
    nationId:

  education:
    level:
    literacy:

  householdEconomy:
    consumptionBudget:
    savingsRate:
    taxBurden:
    housingCost:

  needs:
    survival:
    basic:
    services:
    comfort:
    prosperity:
    modern:
    totalSatisfaction:

  mobility:
    migrationPropensity:
```

### Age groups

-   `AGE_0_14`
-   `AGE_15_24`
-   `AGE_25_44`
-   `AGE_45_64`
-   `AGE_65_PLUS`

### Economic classes

-   `POOR`
-   `WORKING`
-   `MIDDLE`
-   `WEALTHY`
-   `ELITE`

### Skills

-   `UNSKILLED`
-   `SKILLED`
-   `SPECIALIST`

### Reguły

-   `population >= 0`;
-   employment nie może przekraczać zdolnej do pracy populacji;
-   kohorta może być dzielona/scalana dla wydajności.

------------------------------------------------------------------------

# 12. CULTURE

``` yaml
Culture:
  id:
  name:
  originRegionId:
  createdTick:

  traits: {}
  values: {}
  languageGroup:
  openness:
  cohesion:

  relations:
    affinityByCultureId: {}

  population:
    globalShare:
```

Kultura jest dynamiczna. Nie powinna być wyłącznie statycznym tagiem.

Dokładny model cech kulturowych pozostaje poza zakresem Entity Data
Model v0.1.

------------------------------------------------------------------------

# 13. NATION

Nation reprezentuje wspólną tożsamość polityczno-kulturową, która może
istnieć bez państwa.

``` yaml
Nation:
  id:
  name:
  createdTick:
  cultureIds: []
  coreRegionIds: []
  population:
  identityStrength:
  politicalMobilization:
  stateIds: []
```

------------------------------------------------------------------------

# 14. STATE

Państwo jest autonomicznym aktorem politycznym.

``` yaml
State:
  id:
  name:
  foundedTick:
  dissolvedTick:

  territory:
    controlledRegionIds: []
    claimedRegionIds: []

  population:
    totalPopulation:

  government:
    institutionalCapacity:
    stability:
    legitimacy:

  finance:
    treasury:
    revenue:
    expenditure:
    debt:
    taxPolicy:

  economy:
    policySettings:
    infrastructureBudget:
    educationBudget:
    healthcareBudget:

  knowledge:
    institutionalSupport:

  relations:
    relationIds: []

  ai:
    priorities:
    expectations:
    lastDecisionTick:
```

Państwa mogą być wyłączone w początkowym VS.

------------------------------------------------------------------------

# 15. MARKET

Rynek jest regionalny.

``` yaml
Market:
  id:
  regionId:

  goods:
    goodId:
      supply:
      demand:
      inventory:
      localPrice:
      importDemand:
      exportSupply:
      shortageSeverity:
      pricePressure:

  services:
    serviceId:
      supplyCapacity:
      demand:
      price:
      accessibility:

  history:
    rollingPriceData:
    rollingSupplyData:
    rollingDemandData:
```

### Reguły

-   `price > 0`;
-   `inventory >= 0`;
-   eksport nie może przekraczać fizycznej podaży;
-   rynek nie jest właścicielem definicji dóbr.

------------------------------------------------------------------------

# 16. INVENTORY

Inventory jest fizycznym zapasem.

``` yaml
Inventory:
  id:
  ownerType:
  ownerId:
  locationRegionId:

  items:
    goodId:
      quantity:
      averageCost:
      ageBuckets:

  capacity:
    general:
    refrigerated:
    secure:
    hazardous:
```

### Właściciele

-   region/market buffer,
-   company,
-   state,
-   settlement/institution --- jeśli potrzebne.

### Wyjątek

`Electricity` w v0.1 nie jest zwykłym magazynowalnym dobrem.

------------------------------------------------------------------------

# 17. GOOD DEFINITION

``` yaml
GoodDefinition:
  id:
  nameKey:
  primaryCategory:
  tags: []
  inputLinks: []
  producerArchetypeIds: []
  productionMethodIds: []
  downstreamGoodIds: []
  householdNeed:
  demandSources: []
  storageProperties:
  transportProperties:
  substituteIds: []
  technologyRequirements: []
  implementationPhase:
```

64 dobra z Production Economy Master są definicjami contentu.

------------------------------------------------------------------------

# 18. COMPANY ARCHETYPE DEFINITION

``` yaml
CompanyArchetypeDefinition:
  id:
  nameKey:
  sector:
  allowedInputIds: []
  allowedOutputIds: []
  productionMethodIds: []
  capitalRequirement:
  facilityRequirement:
  workforceProfile:
  skillProfile:
  energyProfile:
  infrastructureRequirements:
  knowledgeRequirements:
  minimumScale:
  marketBehavior:
  implementationPhase:
```

------------------------------------------------------------------------

# 19. COMPANY

``` yaml
Company:
  id:
  archetypeId:
  name:
  foundedTick:
  closedTick:

  location:
    regionId:
    settlementId:

  ownership:
    ownerType:
    ownerEntityId:

  finance:
    cash:
    debt:
    revenue:
    costs:
    profit:
    taxes:
    financingCost:

  production:
    productionMethodId:
    capacity:
    utilization:
    outputLastTick:
    inputRequirements:
    energyDemand:

  workforce:
    employees:
    vacancies:
    wageOffer:
    skillDemand:

  inventoryId:

  facilities:
    facilityIds: []

  market:
    marketShare:
    expectedPrices:
    expectedDemand:

  ai:
    state:
    expectations:
    lastDecision:
    lastEvaluation:

  status:
    active:
    distressed:
    bankrupt:
```

### Cykl AI

`OBSERVE → FORECAST → DECIDE → ACT → EVALUATE`

Entity Data Model przechowuje stan; szczegóły decyzji należą do AI
Decision Model.

------------------------------------------------------------------------

# 20. PRODUCTION METHOD DEFINITION

``` yaml
ProductionMethodDefinition:
  id:
  nameKey:
  companyArchetypeIds: []
  outputs: {}
  inputs: {}
  resourceRequirements: {}
  laborRequirements: {}
  skillRequirements: {}
  energyRequirements: {}
  capitalGoodRequirements: {}
  knowledgeRequirements: {}
  discoveryRequirements: []
  infrastructureRequirements: {}
  baseProductivity:
  capacityModifier:
  waste:
  environmentalEffects:
  minimumScale:
  adoptionCost:
  switchingCost:
  maintenanceCost:
  implementationPhase:
```

Production Method jest definicją, nie osobną instancją na każdy tick.
Firma przechowuje `productionMethodId`.

------------------------------------------------------------------------

# 21. SERVICE DEFINITION

``` yaml
ServiceDefinition:
  id:
  nameKey:
  category:
  workforceRequirements:
  skillRequirements:
  infrastructureRequirements:
  goodInputs:
  capacityModel:
  needTier:
  implementationPhase:
```

------------------------------------------------------------------------

# 22. SERVICE CAPACITY

``` yaml
ServiceCapacity:
  id:
  serviceDefinitionId:
  regionId:
  settlementId:
  providerType:
  providerId:

  capacity:
  utilization:
  accessibility:
  quality:
  price:

  workforce:
  employees:
  skillMix:

  inputAvailability:
```

Usługa nie trafia do magazynu.

------------------------------------------------------------------------

# 23. INFRASTRUCTURE

``` yaml
Infrastructure:
  id:
  type:
  regionId:
  settlementId:
  connectionId:

  level:
  capacity:
  condition:
  utilization:

  requirements:
    maintenanceGoods:
    maintenanceLabor:

  effects:
    transport:
    energy:
    services:
    marketAccess:
```

Przykładowe typy: - road, - port, - railway, - power_generation, -
power_grid, - irrigation, - water_system, - education_facility, -
healthcare_facility.

------------------------------------------------------------------------

# 24. TRANSPORT MODE DEFINITION

``` yaml
TransportModeDefinition:
  id:
  nameKey:
  requiredDiscoveries: []
  requiredInfrastructure:
  requiredCapitalGoods: []
  modeCost:
  capacityModifier:
  terrainCompatibility:
  cargoCompatibility:
  energyRequirements:
  implementationPhase:
```

Kanoniczne tryby: - pieszy/tragarze, - zwierzęta juczne, - wozy, -
rzeka, - żagiel, - kolej, - transport motorowy, - nowoczesna żegluga.

------------------------------------------------------------------------

# 25. TRADE FLOW

Nie każdy przepływ musi być trwałą encją historyczną, ale bieżący
transfer powinien mieć strukturę:

``` yaml
TradeFlow:
  tick:
  originRegionId:
  destinationRegionId:
  goodId:
  quantity:
  sourcePrice:
  transportCost:
  tariff:
  riskCost:
  deliveredCost:
  routeConnectionIds: []
```

`ImportedCost = ForeignPrice + TransportCost + Tariff + RiskCost`

Po zakończeniu ticka można agregować przepływy do historii/statystyk.

------------------------------------------------------------------------

# 26. KNOWLEDGE DOMAIN DEFINITION

``` yaml
KnowledgeDomainDefinition:
  id:
  nameKey:
  spilloverTargets: {}
  implementationPhase:
```

12 domen: Agriculture, Construction, Metallurgy, Mining, Navigation,
Medicine, Mathematics, Mechanics, Chemistry, Energy, Transportation,
Communication.

------------------------------------------------------------------------

# 27. DISCOVERY DEFINITION

``` yaml
DiscoveryDefinition:
  id:
  nameKey:
  primaryDomainId:
  secondaryDomainIds: []
  tier:
  implementationPhase:

  prerequisiteDiscoveryIds: []
  knowledgeRequirements: {}
  materialConditions: {}
  economicConditions: {}
  institutionalConditions: {}
  pressureModifiers: {}
  industryModifiers: {}

  unlocks:
    productionMethodIds: []
    goodIds: []
    infrastructureTypes: []
    transportModeIds: []
    resourceDetectionIds: []
    serviceEffects: []

  diffusion:
    difficulty:
    channels: []

  adoption:
    capitalRequirement:
    skillRequirement:
    infrastructureRequirement:
    profitabilitySensitive:

  causalityTags: []
  chronicleSignificance:
```

------------------------------------------------------------------------

# 28. TECHNOLOGY STATE

Stan technologiczny regionu.

``` yaml
TechnologyState:
  id:
  regionId:

  knowledge:
    domainId: 0..100

  discoveries:
    discoveryId:
      status:
      discoveredTick:
      sourceRegionId:
      diffusionSource:
      availability:
      industryAdoption:
      populationAccess:
      institutionalAdoption:

  eligibility:
    eligibleDiscoveryIds: []

  specialists:
    domainId:
      capacity:
```

Status: - UNKNOWN - KNOWN - AVAILABLE - ADOPTED

`eligibility` może być cache i musi dać się odtworzyć.

------------------------------------------------------------------------

# 29. HISTORICAL CHARACTER

Postać historyczna powstaje tylko, gdy symulacja uzna jednostkę/rolę za
istotną.

``` yaml
HistoricalCharacter:
  id:
  name:
  bornTick:
  diedTick:

  origin:
    regionId:
    settlementId:
    cohortSourceId:

  identity:
    cultureId:
    nationId:

  role:
    type:
    organizationId:

  significance:
    score:
    reasons: []

  linkedFactIds: []
```

Nie należy symulować całego świata jako milionów Character.

------------------------------------------------------------------------

# 30. ARCHITECT INTERVENTION DEFINITION

``` yaml
ArchitectInterventionDefinition:
  id:
  nameKey:
  category:
  allowedScopes:
  parameters:
  baseInfluenceCost:
  magnitudeCost:
  durationCost:
  scopeCost:
  naturalnessCost:
  implementationPhase:
```

Kategorie: - Environment, - Resources, - Population, - Knowledge, -
Economy, - Experimental Events.

------------------------------------------------------------------------

# 31. ARCHITECT INTERVENTION INSTANCE

``` yaml
ArchitectInterventionInstance:
  id:
  definitionId:
  createdTick:
  startTick:
  endTick:

  target:
    scopeType:
    entityIds: []

  parameters: {}

  influence:
    cost:
    architectInfluenceStrength:

  status:
    planned:
    active:
    completed:

  linkedFactIds: []
```

To kluczowy punkt wejścia dla Butterfly Effect.

------------------------------------------------------------------------

# 32. SIMULATION FACT

Najważniejsza jednostka historii przyczynowej.

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
```

Przykłady typów: - resource_discovered, - company_founded, -
production_changed, - price_changed, - shortage_started, -
migration_changed, - settlement_stage_changed, - discovery_occurred, -
production_method_adopted.

------------------------------------------------------------------------

# 33. CAUSAL EDGE

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
  architectInfluence:
```

Poziomy publiczne: - PRIMARY, - SIGNIFICANT, - MINOR, - TRACE.

CausalEdge nie zastępuje SimulationFact. Łączy fakty.

------------------------------------------------------------------------

# 34. CHRONICLE ENTRY

``` yaml
ChronicleEntry:
  id:
  tick:
  category:
  headlineKey:
  bodyTemplateKey:

  subjectEntityIds: []
  regionIds: []
  sourceFactIds: []
  causalEdgeIds: []

  significance:
    score:
    level:

  architectConnection:
    interventionId:
    strength:

  presentation:
    importance:
    tags: []
```

Chronicle nie powinno zapisywać wymyślonych faktów. Wszystkie wpisy
muszą wskazywać `sourceFactIds`.

------------------------------------------------------------------------

# 35. RELATION / RELACJE POLITYCZNE

``` yaml
StateRelation:
  id:
  stateAId:
  stateBId:
  trust:
  hostility:
  tradeOpenness:
  borderFriction:
  agreements: []
  conflictState:
```

W początkowym VS może być wyłączone.

------------------------------------------------------------------------

# 36. EVENT INSTANCE

Event jest mechanizmem symulacyjnym, nie tekstem narracyjnym.

``` yaml
EventInstance:
  id:
  type:
  createdTick:
  startTick:
  endTick:
  regionIds: []
  stateIds: []
  parameters: {}
  status:
  generatedFactIds: []
```

Narracja wydarzenia należy do presentation layer.

------------------------------------------------------------------------

# 37. ENVIRONMENTAL STATE

Może pozostać częścią Region, ale jego struktura powinna być jawna:

``` yaml
EnvironmentalState:
  quality:
  pollution:
  waterStress:
  soilCondition:
  forestPressure:
  climateStress:
  disasterRisk:
  recoveryCapacity:
```

Wartości są skalami zdefiniowanymi w konfiguracji.

------------------------------------------------------------------------

# 38. FINANCE --- minimalny model v0.1

### CompanyFinance

-   cash
-   debt
-   revenue
-   inputCosts
-   wageCosts
-   energyCosts
-   transportCosts
-   taxes
-   maintenance
-   financingCosts
-   profit

### StateFinance

-   treasury
-   revenue
-   expenditure
-   debt

### HouseholdEconomy

-   averageIncome
-   averageWealth
-   consumptionBudget
-   savingsRate
-   taxBurden
-   housingCost

Nie wprowadzamy osobnej pełnej encji pojedynczego gospodarstwa domowego.

------------------------------------------------------------------------

# 39. OWNERSHIP

Rekomendowany generyczny model:

``` yaml
OwnershipRef:
  ownerType:
    PRIVATE
    STATE
    INSTITUTION
    MIXED
  ownerEntityId:
```

Pełna struktura akcjonariatu nie jest wymagana w v0.1.

------------------------------------------------------------------------

# 40. Jednostki i skale

Każde pole numeryczne powinno mieć zdefiniowaną semantykę.

Przykładowo: - Population --- liczba osób, - Money --- wewnętrzna
jednostka walutowa modelu, - Quantity --- jednostka abstrakcyjna dobra,
spójna w recepturze, - Distance --- jednostka dystansu świata, -
Capacity --- jednostka zależna od systemu, - Knowledge --- 0--100, -
Satisfaction --- 0--100, - Influence --- 0--100, - Adoption ---
0--100%, - Quality --- znormalizowana skala konfiguracyjna.

Nie mieszać procentów `0..1` i `0..100` bez jawnej konwencji.

**Rekomendacja:** wewnętrznie udziały jako `0.0..1.0`, UI jako
`0..100%`.

------------------------------------------------------------------------

# 41. Nullability i wartości domyślne

Zasada: - brak wartości ≠ zero, - `null` oznacza „nie dotyczy /
nieznane" tylko tam, gdzie jest to jawnie dopuszczone, - kolekcje
powinny domyślnie być puste, - brak referencji opcjonalnej używa
`null`, - wymagane referencje muszą istnieć.

Przykład: `settlementId = null` jest poprawne dla kohorty żyjącej poza
osadą, jeśli model to dopuszcza.

------------------------------------------------------------------------

# 42. Definition vs Instance --- przykład

### Definition

``` yaml
GoodDefinition:
  id: steel
  category: intermediate_good
```

### Instance/state

``` yaml
Inventory:
  ownerId: company_184
  items:
    steel:
      quantity: 142.5
```

Nie tworzymy osobnej encji `SteelInstance` dla każdej partii.

------------------------------------------------------------------------

# 43. Derived State i cache

Można cache'ować: - EffectiveDistance, - regionalne agregaty, -
MigrationAttraction, - SettlementPressure, - OpportunityScore, -
eligible discoveries, - rolling market averages.

Każdy cache powinien mieć: - jasne źródła, - możliwość invalidacji, -
możliwość pełnego przeliczenia.

Save nie może zależeć od cache, którego nie da się odtworzyć.

------------------------------------------------------------------------

# 44. Tick ownership

Rekomendowane przypisanie głównych zapisów w ticku:

1.  Environment → Region.environment
2.  Resources → ResourceDeposit
3.  Demography → PopulationCohort 4--5. Production → Company + Inventory
4.  Inventory → Inventory 7--8. Market → Market
5.  Trade → Inventory/Market/Connection utilization
6.  Company finance → Company.finance
7.  Employment/wages → Company.workforce + Cohort
8.  Consumption → Cohort + Inventory/Market
9.  Services → ServiceCapacity
10. Needs → Cohort.needs
11. Migration → Cohort location/population distribution
12. Settlement → Settlement
13. State → State
14. Technology → TechnologyState
15. Culture/politics → Culture/Nation/State
16. Events → EventInstance + affected entities
17. Causality → SimulationFact/CausalEdge
18. Chronicle → ChronicleEntry
19. Validation → no gameplay mutation except controlled repair/fail
    policy

------------------------------------------------------------------------

# 45. Transaction / mutation rule

W obrębie etapu ticka preferowany model:

1.  odczytaj stan wejściowy,
2.  oblicz intencje/zmiany,
3.  waliduj,
4.  zatwierdź zmianę,
5.  emituj SimulationFact.

Ogranicza to zależność wyniku od przypadkowej kolejności iteracji po
tablicach.

------------------------------------------------------------------------

# 46. Determinizm danych

Deterministyczny wynik wymaga: - stabilnego sortowania ID, - jawnego
RNG, - braku zależności od kolejności hash map, - jawnych zasad
zaokrągleń, - tej samej wersji contentu lub migracji save, - braku
systemowego czasu w logice symulacji.

Każdy moduł losujący otrzymuje kontrolowany strumień RNG lub
deterministycznie wyprowadzony seed.

------------------------------------------------------------------------

# 47. Serializacja save

Minimalny zapis:

``` yaml
SaveGame:
  schemaVersion:
  contentVersion:
  engineVersion:
  world:
  entities:
    continents:
    regions:
    connections:
    deposits:
    settlements:
    cohorts:
    companies:
    inventories:
    markets:
    states:
    cultures:
    nations:
    infrastructures:
    services:
    technologyStates:
    historicalCharacters:
    interventions:
    activeEvents:
  history:
    retainedFacts:
    causalMemory:
    chronicle:
  rng:
    state:
```

Definicje contentu mogą być ładowane z wersjonowanych danych gry, ale
save musi wiedzieć, z jaką wersją powstał.

------------------------------------------------------------------------

# 48. Versioning

Trzy niezależne wersje:

-   `schemaVersion` --- struktura danych,
-   `contentVersion` --- zasoby/dobra/technologie/receptury,
-   `engineVersion` --- logika symulacji.

Przykład:

``` yaml
schemaVersion: 1
contentVersion: "0.1"
engineVersion: "0.1.0"
```

------------------------------------------------------------------------

# 49. Migracje save

Każda niekompatybilna zmiana schematu wymaga migratora:

``` text
v1 → v2
v2 → v3
```

Migracja: - nie może usuwać danych bez jawnej reguły, - powinna być
deterministyczna, - musi logować ostrzeżenia, - musi przejść validation
po zakończeniu.

------------------------------------------------------------------------

# 50. Retencja historii

Przy symulacji 1000+ lat nie można bez ograniczeń przechowywać każdego
drobnego faktu.

Proponowane poziomy:

### Hot history

Szczegółowe fakty z ostatniego okresu.

### Warm history

Zagregowane fakty średniego znaczenia.

### Permanent history

-   Chronicle,
-   ważne odkrycia,
-   narodziny/upadki państw,
-   kluczowe migracje,
-   przełomy gospodarcze,
-   znaczące interwencje Architekta,
-   główne łańcuchy Butterfly Effect.

Hierarchical Causal Memory decyduje, co zachować.

------------------------------------------------------------------------

# 51. Indeksy runtime

Dla wydajności utrzymywać indeksy:

``` text
companiesByRegion
cohortsByRegion
settlementsByRegion
depositsByRegion
connectionsByRegion
companiesByArchetype
companiesByGoodOutput
companiesByGoodInput
discoveriesByDomain
eligibleDiscoveriesByRegion
factsByEntity
factsByTick
```

Indeksy są derived/cache, nie osobnym źródłem prawdy.

------------------------------------------------------------------------

# 52. Event bus / fakty systemowe

Systemy mogą komunikować istotne zmiany przez zdarzenia/fakty zamiast
bezpośrednio znać wszystkie inne moduły.

Przykład:

``` text
CompanySystem
→ emits company_founded
→ Employment system sees new vacancies
→ Migration system later sees employment change
→ Causality links effects
```

Nie oznacza to asynchronicznej niedeterministycznej symulacji. Kolejność
ticka pozostaje kontrolowana.

------------------------------------------------------------------------

# 53. Reguły referencyjne

### Hard reference

Obiekt nie ma sensu bez celu: - Company.regionId, - Deposit.regionId, -
Cohort.regionId, - Market.regionId.

Brak celu = błąd.

### Soft/historical reference

Cel może przestać istnieć: - HistoricalCharacter.organizationId, -
Chronicle subject, - dissolved State.

Historia powinna zachować ID i snapshot nazwy/prezentacji, jeśli
potrzebne.

------------------------------------------------------------------------

# 54. Usuwanie encji

Nie należy fizycznie usuwać ważnych historycznych encji natychmiast.

Przykłady: - firma: `active=false`, `closedTick`, - państwo:
`dissolvedTick`, - postać: `diedTick`.

Pozwala to zachować poprawne odwołania historii.

Drobne techniczne obiekty mogą być kompaktowane po agregacji.

------------------------------------------------------------------------

# 55. Localization

Symulacja przechowuje: - `nameKey`, - ID, - fakty i liczby.

Nie przechowuje na stałe pełnych tekstów UI w logice.

Definicje:

``` yaml
nameKey: good.steel.name
descriptionKey: good.steel.description
```

Dynamiczne nazwy własne mogą być zapisane jako seed/generatedName i
wyświetlane zgodnie z lokalizacją.

------------------------------------------------------------------------

# 56. Invariants globalne

Po każdym ticku:

``` text
population >= 0
resource.quantity >= 0
inventory.quantity >= 0
price > 0
company.cash is finite
company.debt is finite
employment <= eligible working population
exports <= available goods
all hard references resolve
all entity IDs unique
no goods created without source
no workers created from nothing
no ordinary inventory for electricity v0.1
all shares remain in valid range
all cached totals reconcile within tolerance
```

------------------------------------------------------------------------

# 57. Walidacja Definition Data

Przy uruchomieniu: - unikalne ID, - poprawne phases, - brak brakujących
referencji, - receptury kompletne, - Discovery prerequisites istnieją, -
brak niedozwolonych cykli, - każdy VS element ma VS-kompatybilne
zależności, - lokalizacja posiada wymagane klucze, - wszystkie
Production Methods wskazują istniejące firmy/dobra/odkrycia.

------------------------------------------------------------------------

# 58. Walidacja World State

Sprawdzać: - region należy do świata, - połączenia wskazują istniejące
regiony, - firma ma region i archetyp, - kohorta ma region, - złoże ma
region i ResourceDefinition, - market ma jeden region, - inventory owner
istnieje, - state controlled regions istnieją, - TechnologyState ma
poprawne Discovery IDs, - facts nie wskazują niemożliwych ticków
przyszłych.

------------------------------------------------------------------------

# 59. Vertical Slice --- minimalny model encji

VS powinien faktycznie wdrożyć:

``` text
World
Continent
Region
Connection
ResourceDefinition
ResourceDeposit
Settlement
PopulationCohort
GoodDefinition
Inventory
Market
CompanyArchetypeDefinition
Company
ProductionMethodDefinition
Infrastructure
TransportModeDefinition
KnowledgeDomainDefinition
DiscoveryDefinition
TechnologyState
ArchitectInterventionDefinition
ArchitectInterventionInstance
SimulationFact
CausalEdge
ChronicleEntry
```

Można początkowo ograniczyć/wyłączyć: - State, - Nation, - pełne
Relations, - HistoricalCharacter, - rozbudowane finance, - zaawansowane
Service providers, - warfare.

Schemat powinien jednak przewidywać ich późniejsze dodanie bez
przebudowy fundamentów.

------------------------------------------------------------------------

# 60. Black Mountain --- przykładowy przepływ danych

### Stan początkowy

`region_black_mountain` zawiera ukryty `deposit_iron_01`.

### Odkrycie

Technology/Mining system zmienia:

``` text
deposit.discovery.status:
UNKNOWN → DISCOVERED
```

Powstaje:

``` text
fact_resource_discovered
```

### Gospodarka

Opportunity system widzi: - Iron Ore, - popyt, - pracę, - dostęp do
rynku.

Powstaje `company_mine_01`.

Emitowany: `fact_company_founded`.

### Produkcja

Company: - zatrudnia kohorty, - wydobywa zasób, - zmniejsza
deposit.quantity, - zwiększa inventory iron_ore.

### Rynek

Market aktualizuje supply/price/export.

### Migracja

Cohorts reagują na employment/wages.

### Osada

SettlementPressure rośnie i zmienia stage.

### Historia

SimulationFacts zostają połączone CausalEdges.

WHY? może odpowiedzieć: `Dlaczego Black Mountain urosło?`

### Po latach

Deposit staje się `economicallyExhausted=true`.

Firmy reagują: - zamknięcie, - import, - nowa technologia, -
dywersyfikacja.

Ten sam model danych obsługuje pełny cykl bez specjalnego skryptu Black
Mountain.

------------------------------------------------------------------------

# 61. Granice odpowiedzialności

### Entity Data Model

Definiuje strukturę i własność danych.

### Simulation Model

Definiuje kolejność i zasady aktualizacji.

### Production Economy Master

Definiuje content gospodarczy i zależności.

### Technology & Discovery Catalog

Definiuje wiedzę, odkrycia i unlocki.

### AI Decision Model

Zdefiniuje sposób podejmowania decyzji.

### Causality Engine

Zdefiniuje budowę i redukcję grafu przyczyn.

### Chronicle Engine

Zdefiniuje selekcję i prezentację historii.

UI tylko odczytuje/żąda działań poprzez publiczne API systemów.

------------------------------------------------------------------------

# 62. Rekomendowany układ modułów kodu

Schemat logiczny:

``` text
src/
  core/
    ids/
    rng/
    time/
    validation/
    serialization/

  data/
    definitions/
    loaders/
    validators/

  world/
    world/
    geography/
    regions/
    connections/
    environment/

  population/
    cohorts/
    migration/
    needs/

  economy/
    resources/
    markets/
    inventory/
    companies/
    production/
    trade/
    transport/
    services/

  technology/
    knowledge/
    discoveries/
    diffusion/
    adoption/

  society/
    settlements/
    cultures/
    nations/
    states/

  architect/
    interventions/
    influence/

  causality/
    facts/
    graph/
    memory/

  chronicle/
    significance/
    entries/

  simulation/
    tick/
    pipeline/
```

To jest rekomendacja architektoniczna, nie wymóg konkretnego
języka/frameworka.

------------------------------------------------------------------------

# 63. Publiczne read models dla UI

UI nie powinno dostawać surowego całego World State.

Przykładowe read models:

``` text
WorldOverviewView
RegionDetailView
SettlementDetailView
MarketView
CompanyView
TechnologyView
ChronicleView
WhyExplanationView
ArchitectInterventionView
```

Pozwala to zmieniać storage bez przepisywania całego UI.

------------------------------------------------------------------------

# 64. Commands / działania

Zmiany z UI powinny przechodzić przez jawne komendy:

``` text
CreateWorldCommand
SetSimulationSpeedCommand
PauseSimulationCommand
CreateArchitectInterventionCommand
CancelArchitectInterventionCommand
```

Gracz nie edytuje bezpośrednio `Region.population` czy `Company.cash`.

------------------------------------------------------------------------

# 65. Snapshoty do analityki

Długoterminowe wykresy nie muszą korzystać z pełnej historii encji.

Można zapisywać okresowe agregaty:

``` yaml
RegionalSnapshot:
  tick:
  regionId:
  population:
  gdpProxy:
  employment:
  averageWage:
  needsSatisfaction:
  urbanization:
  keyPrices: {}
  knowledge: {}
```

Częstotliwość snapshotów powinna być konfigurowalna.

------------------------------------------------------------------------

# 66. Otwarte decyzje po v0.1

Do późniejszego ustalenia:

1.  konkretna jednostka pieniądza,
2.  dokładne jednostki ilości dóbr,
3.  pełna struktura professions,
4.  pełna struktura Culture traits,
5.  Nation vs Culture identity mechanics,
6.  ownership bardziej złożony niż prosty OwnerRef,
7.  model banków/kredytu,
8.  dokładna topologia sieci elektrycznej,
9.  osobne facilities jako pełne encje czy część Company,
10. poziom szczegółowości magazynów,
11. jak agresywnie scalać kohorty,
12. retencja SimulationFacts w liczbach,
13. format binarny/JSON save,
14. exact API/read-model layer,
15. state relations i warfare,
16. waluta regionalna/państwowa, jeśli zostanie dodana,
17. dokładny model organizacji innych niż firmy i państwa.

------------------------------------------------------------------------

# 67. Ustalenia kanoniczne v0.1

-   Region jest główną jednostką obliczeniową.
-   Populacja jest kohortowa.
-   Definicje contentu są oddzielone od instancji.
-   Relacje używają stabilnych ID.
-   Market jest regionalny.
-   Inventory jest fizyczny.
-   Electricity nie używa zwykłego inventory w v0.1.
-   Company korzysta z CompanyArchetype + ProductionMethod.
-   TechnologyState jest regionalny.
-   Discovery Definition jest contentem.
-   SimulationFact jest podstawową jednostką historii przyczynowej.
-   CausalEdge łączy fakty.
-   ChronicleEntry musi wskazywać fakty źródłowe.
-   Architect Intervention jest jawnie śledzona.
-   Derived State można odtworzyć.
-   Save jest wersjonowany.
-   Historyczne encje nie są natychmiast kasowane.
-   UI korzysta z read models/commands zamiast bezpośrednio mutować
    stan.
-   Determinizm jest wymaganiem architektonicznym.

------------------------------------------------------------------------

# 68. Kryteria akceptacji

-   [x] World
-   [x] Continent
-   [x] Region
-   [x] Connection
-   [x] ResourceDefinition / ResourceDeposit
-   [x] Settlement
-   [x] PopulationCohort
-   [x] Culture / Nation / State
-   [x] Market / Inventory
-   [x] GoodDefinition
-   [x] CompanyArchetype / Company
-   [x] ProductionMethod
-   [x] Services
-   [x] Infrastructure / Transport
-   [x] KnowledgeDomain / Discovery / TechnologyState
-   [x] Architect Intervention
-   [x] SimulationFact / CausalEdge / ChronicleEntry
-   [x] serializacja i wersjonowanie
-   [x] invariants i walidacja
-   [x] ownership danych
-   [x] derived/cache rules
-   [x] VS subset
-   [x] Black Mountain data flow
-   [ ] konkretne JSON Schema / TypeScript interfaces
-   [ ] migratory save tests
-   [ ] performance benchmarks
-   [ ] pełny AI Decision Model
-   [ ] pełny Causality Engine Spec

------------------------------------------------------------------------

# 69. Następny dokument

Po zatwierdzeniu Entity Data Model najbardziej logiczny następny krok
to:

**`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md`**

Mamy już: 1. zasady całej symulacji, 2. pełny model gospodarki, 3.
katalog wiedzy i odkryć, 4. strukturę encji i relacji.

Możemy więc dokładnie zamrozić **co rzeczywiście implementujemy w
pierwszym grywalnym wycinku**, jakie systemy są aktywne, jakie dane
wykorzystujemy, jakie scenariusze mają przejść oraz jakie są kryteria
„Vertical Slice działa".

> **Entity Data Model nie powinien opisywać świata tak, jak wygląda na
> ekranie. Powinien opisywać świat tak, aby wszystkie systemy mogły
> jednoznacznie ustalić, co w nim istnieje, gdzie się znajduje, do kogo
> należy, co się zmieniło i dlaczego.**

**KONIEC --- FIRST CAUSE Entity Data Model v0.1**
