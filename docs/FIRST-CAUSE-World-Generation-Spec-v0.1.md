# FIRST CAUSE --- World Generation Spec v0.1

**Status:** kanoniczna specyfikacja generowania świata\
**Projekt:** FIRST CAUSE\
**Wersja:** 0.1\
**Zakres:** Vertical Slice / MVP / FULL\
**Dokument nadrzędny:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md`

> **Generator nie tworzy historii. Generator tworzy warunki początkowe,
> z których historia może się wyłonić.**

------------------------------------------------------------------------

# 1. Cel i zasada nadrzędna

World Generation tworzy **warunki początkowe**, nie historię. Generator
może stworzyć żyzną dolinę, ukryte złoże żelaza, izolowany płaskowyż,
szlak rzeczny, skupisko ludności czy początkową wiedzę, ale nie może
tworzyć „przyszłej stolicy", „regionu przeznaczonego do boomu" ani
gwarantować kryzysu czy industrializacji.

> **Generator tworzy przyczyny początkowe. Simulation Engine tworzy
> konsekwencje.**

Generator działa przed `tick = 0`, tworzy canonical initial state i
kończy pracę przed uruchomieniem miesięcznego tick pipeline.

------------------------------------------------------------------------

# 2. Cele projektowe

Generator musi być: deterministyczny, data-driven, skalowalny,
modularny, walidowalny i niezależny od UI. Ma tworzyć świat, który jest
fizycznie i ekonomicznie możliwy, ale nie idealnie zbalansowany.
Nierówności geograficzne, surowcowe, demograficzne i technologiczne są
pożądanym źródłem emergencji.

------------------------------------------------------------------------

# 3. Relacja z systemami

Kanoniczny przepływ:

`WORLD CONFIG → SEED → TOPOLOGY → GEOGRAPHY → RESOURCES → HABITABILITY → POPULATION → SETTLEMENTS → CULTURE/KNOWLEDGE → INFRASTRUCTURE → INITIAL ECONOMY → MARKETS → VALIDATION → TICK 0 → SIMULATION`

Generator korzysta z tych samych Content Definitions i runtime entities
co reszta gry. Nie posiada osobnego katalogu zasobów, goods, firm ani
technologii.

------------------------------------------------------------------------

# 4. Determinism Contract

Dla
`same worldSeed + same generatorVersion + same contentVersion + same WorldGenerationConfig`
wynikowy canonical Tick 0 musi być identyczny. Świat zapisuje
`worldSeed`, `generatorVersion`, `generationPreset`,
`generationConfigHash` i `contentVersion`.

Zmiana algorytmu generatora może zmienić świat dla tego samego seeda,
dlatego `generatorVersion` jest obowiązkowe.

------------------------------------------------------------------------

# 5. RNG Streams

World Generation używa izolowanych deterministic streams:
`world_topology`, `continents`, `terrain`, `climate`, `water`,
`resources`, `population`, `settlements`, `culture`, `knowledge`,
`infrastructure`, `companies`, `inventories`, `prices`, `naming`.

Zmiana generatora nazw nie może zmienić geografii lub ekonomii. Iteracja
zawsze odbywa się po stabilnie uporządkowanych ID; zabronione są
systemowy czas, niekontrolowany random i nondeterministic UUID.

------------------------------------------------------------------------

# 6. Skala świata

Kanoniczne presety:

  Preset                   Regiony
  --------------------- ----------
  Vertical Slice            24--40
  Reference VS                  32
  Small                      \~250
  Standard                   \~600
  Large                    \~1 200
  Huge                     \~2 000
  Architecture Target     do 3 000

3 000 to architecture/stress target, nie gwarantowany limit premierowy.
`officialMaxRegions` zostanie ustalony benchmarkami. Liczba regionów nie
wyznacza liczby przyszłych państw.

------------------------------------------------------------------------

# 7. World Graph

Świat jest przede wszystkim grafem `Region Nodes + Connection Edges`, a
nie klasyczną mapą geograficzną. Domyślnie istnieje jeden główny
połączony komponent; wyspy są dozwolone tylko przez config. Graf jest
sparse, lokalny i posiada centra, peryferia, bottlenecks, alternatywne
trasy oraz regiony tranzytowe.

Dla Reference VS większość regionów powinna mieć około 2--5 podstawowych
sąsiadów, z możliwością kilku hubów. To tuning, nie invariant.

------------------------------------------------------------------------

# 8. Kontynenty i pozycja

Vertical Slice używa 1 kontynentu. MVP/FULL może mieć wiele. Kontynent
służy agregacji i LOD, nie determinuje kultur ani państw.

Region może posiadać abstrakcyjne `centroid`, `area` i relative
position. Pozycja wizualna UI nie jest automatycznie source of truth dla
`physicalDistance`.

------------------------------------------------------------------------

# 9. Terrain

Minimalny target terrain: Plains, Hills, Mountains, Plateau, Forest,
Wetlands, Desert, Coastal, River Valley. Preferowany model to
`primaryTerrain + terrainTraits[]`, np.
`hills + forested + river_access`.

Terrain wpływa na fertility, transport, koszt infrastruktury,
mining/forestry potential, wodę i settlement suitability.

------------------------------------------------------------------------

# 10. Climate

Climate jest osobną warstwą: temperatura, opady, sezonowość. Sąsiednie
regiony powinny być statystycznie podobniejsze klimatycznie niż losowe
regiony. Generator używa spatial correlation/gradientów zamiast
niezależnego losowania każdego regionu.

------------------------------------------------------------------------

# 11. Water i rzeki

Water Access może obejmować river, lake, coast, groundwater i poor
access. W VS rzeka nie wymaga pełnej hydrologii, ale jeśli przebiega
przez wiele regionów, musi tworzyć logiczny korytarz. Coast daje
potencjał fishing/maritime transport, ale nie automatyczny port ani
bogactwo.

------------------------------------------------------------------------

# 12. Fertility i Habitability

Fertility wynika z terrain, climate, water, soil proxy i lokalnych
modifierów. Generator oblicza `HabitabilityScore`, koncepcyjnie:

`FoodPotential + WaterAccess + ClimateSuitability + TerrainAccessibility + ResourceOpportunity - EnvironmentalRisk - IsolationPenalty`.

Habitability wpływa na populację, ale jej nie determinuje.

------------------------------------------------------------------------

# 13. Resource Deposits

Zasoby występują jako fizyczne `ResourceDeposit`. Deposit istnieje przed
Discovery i może być `hidden`, `partially known` lub `known`.
ResourceDefinition może definiować `terrainAffinity`, `climateAffinity`,
`geologyAffinity`, `coastalAffinity`, `waterAffinity`, `rarity`,
`depositSizeRange`, `clusterTendency`.

Zasoby geologiczne powinny tworzyć logiczne klastry. Regionalne braki są
pożądane, bo tworzą handel i specjalizację.

------------------------------------------------------------------------

# 14. Finite i renewable resources

Zwykłe złoża mineralne mają skończony stock i nie mogą być nieskończone.
Zasoby odnawialne mogą używać `sustainableYield`, `regeneration` i
`carryingCapacity`. `resourceAbundance` może zmieniać ilość/rozmiar
złóż, ale nie reguły gospodarki.

------------------------------------------------------------------------

# 15. VS Resources

Reference VS aktywuje 12 resources: Grain, Livestock, Fish, Timber,
Cotton, Stone, Clay, Limestone, Iron Ore, Coal, Sand, Salt. Świat
powinien zawierać food-surplus candidates, forestry candidate,
construction-material regions, istotny iron opportunity, coal
opportunity oraz regiony bez ważnych złóż.

------------------------------------------------------------------------

# 16. Black Mountain initial condition

`BLACK_MOUNTAIN_REFERENCE` posiada fizyczne Iron Ore, które może
zaczynać jako hidden/unknown. Region nie ma automatycznie rozwiniętego
przemysłu żelaza. To fixture danych testowych, nie specjalna gałąź
engine. Proceduralny generator nie zna pojęcia `blackMountain`.

------------------------------------------------------------------------

# 17. Initial Population

Populacja powstaje po geografii i resources. Reference VS używa około
200 początkowej populacji w abstrakcyjnej skali modelu. Jeżeli jednostka
population nie oznacza literalnie jednej osoby, skala musi być jawnie
określona.

Allocation wykorzystuje m.in. Habitability, FoodPotential, WaterAccess,
Accessibility i deterministic variation. Powinny istnieć regiony puste,
słabo zaludnione, średnie oraz kilka centrów.

------------------------------------------------------------------------

# 18. Population Cohorts

Initial population jest dzielona na Cohorts według ageGroup,
economicClass, profession, skill, culture i location. Nie tworzymy
pustych kombinacji. Age groups pozostają 0--14, 15--24, 25--44, 45--64,
65+. Większość startowej populacji VS należy do Poor/Working; profesje
muszą wynikać z lokalnej gospodarki.

------------------------------------------------------------------------

# 19. Settlements

Settlements są generowane z koncentracji ludności i warunków lokalnych.
`SettlementPlacementScore` może uwzględniać PopulationConcentration,
WaterAccess, FoodPotential, TradeAccessibility, ResourceOpportunity i
EnvironmentalRisk.

VS preferuje Camp/Hamlet/Village, z ograniczoną liczbą Town. Nie
generuje bazowego Metropolis.

------------------------------------------------------------------------

# 20. Housing

Każda zamieszkana osada otrzymuje Housing Capacity. Na Tick 0 musi
pomieścić startową populację z rozsądnym marginesem, ale generator nie
może usuwać całej przyszłej housing pressure.

------------------------------------------------------------------------

# 21. Culture Seeds

VS używa uproszczonego Culture Seed Model. Generator tworzy niewielką
liczbę culture seeds, a udziały populacji rozchodzą się zgodnie z
proximity, connectivity i regional continuity. Region może zawierać
kilka kultur. VS wymaga głównie `cultureId`, shares i affinity.
Nations/States nie są generowane.

------------------------------------------------------------------------

# 22. Initial Knowledge

Knowledge jest generowane po populacji i settlements. Nie ma sztywnej
historycznej epoki. Regiony zaczynają z nierównym Knowledge zależnym
m.in. od settlement size, density, specialists, trade connectivity i
industries.

Discovery może zaczynać jako Unknown/Known/Available/Adopted. Jeśli
istniejąca firma używa PM X, wszystkie wymagania
knowledge/discovery/adoption muszą być spójne.

------------------------------------------------------------------------

# 23. Infrastructure

Initial Infrastructure powstaje po settlements i knowledge.
Odzwierciedla istniejącą koncentrację ludności, connectivity, terrain i
gospodarkę. Generator nie buduje infrastruktury pod ukryte złoże tylko
dlatego, że sam zna jego pozycję.

Connection może posiadać infrastructureLevel, capacity, security i
seasonal baseline. Bez państw BorderModifier w VS jest neutralny.

------------------------------------------------------------------------

# 24. Initial Companies

Firmy powstają po populacji, knowledge i infrastructure. Każda initial
company musi mieć ekonomiczne uzasadnienie: input access, workforce,
knowledge, infrastructure, minimal demand i startup capital.

Generator może stworzyć minimalny subsistence bootstrap potrzebny do
działania świata, ale nie pełną dojrzałą gospodarkę.
Mine/Smelter/Steelworks mogą być nieobecne na początku Black Mountain.

------------------------------------------------------------------------

# 25. Shared viability rules

Generator powinien używać tych samych definicji i, gdzie semantyka jest
identyczna, shared evaluators co Simulation Engine. Nie utrzymujemy
dwóch sprzecznych definicji „viable company". Generator-specific logic
jest dozwolone dla allocation/bootstrapu.

------------------------------------------------------------------------

# 26. Inventories

Initial inventories powstają po firmach. Tick 0 nie może zaczynać od
natychmiastowego globalnego głodu tylko dlatego, że wszystkie stocks
wynoszą zero, ani od ogromnych losowych nadwyżek. Start buffer powinien
być konfigurowany względem oczekiwanej konsumpcji/produkcji.

------------------------------------------------------------------------

# 27. Markets i ceny

Każdy aktywny region ma regionalny Market. Initial prices są
wyprowadzane z BaseContentPrice, lokalnej dostępności, accessibility,
scarcity i niewielkiego seeded variation. Cena musi być dodatnia i
skończona.

Initial supply/demand wynika z inventory, expected production, needs i
industrial inputs. Preferowany jest analityczny warm start zamiast
ukrytej wieloletniej pre-symulacji.

------------------------------------------------------------------------

# 28. Services i Needs

VS tworzy minimalne Service Capacity zależne od settlement/population.
Po utworzeniu inventories i services obliczany jest initial Needs
Satisfaction. Generator nie może naprawiać błędnego świata niewidzialnym
dopompowywaniem goods w pierwszych tickach.

------------------------------------------------------------------------

# 29. Kanoniczny Generation Pipeline

1.  Validate config\
2.  Initialize seed/RNG\
3.  Create World\
4.  Continents\
5.  Region topology\
6.  Coordinates/area\
7.  Terrain\
8.  Climate\
9.  Water\
10. Fertility/environment\
11. Connections\
12. EffectiveDistance baselines\
13. Resource deposits\
14. Habitability\
15. Population allocation\
16. Cohorts\
17. Settlements\
18. Cultures\
19. Knowledge/discoveries\
20. Infrastructure\
21. Initial companies\
22. Inventories\
23. Services/housing\
24. Markets/prices\
25. Runtime indexes\
26. Invariants\
27. Viability checks\
28. Deterministic repairs if permitted\
29. Checksum\
30. Freeze Tick 0\
31. Start Simulation.

------------------------------------------------------------------------

# 30. Deterministic Repair

Jeżeli wygenerowany stan łamie wymagania presetu, repair musi być jawny,
deterministyczny i zapisany w GenerationReport. Dozwolone: naprawa
odciętego connection, relokacja niewykonalnej startowej populacji, wybór
alternatywnego food bootstrap region.

Niedozwolone: dodanie steelworks „dla ciekawszej historii", zwiększenie
iron stock, aby wymusić boom, albo stworzenie przyszłego miasta.

------------------------------------------------------------------------

# 31. Generation Report

Każdy świat tworzy debug `GenerationReport` z co najmniej: seed,
generatorVersion, preset, regionCount, continentCount, connectionCount,
inhabitedRegionCount, populationTotal, settlementCount, companyCount,
resourceDepositCounts, hiddenDepositCounts, cultureCount, knowledge
summary, repairActions, validationWarnings i checksum.

------------------------------------------------------------------------

# 32. WorldGenerationConfig

Minimalny koncept:

`preset, regionCount, continentCount, worldSeed, populationTarget, resourceAbundance, climateVariation, terrainVariation, connectivity, settlementDensity, knowledgeBaseline, economicBootstrapLevel, cultureSeedCount, allowIslands, enabledContentPhase`.

Config zmienia warunki początkowe; nie może zawierać
„make_world_successful" ani gwarantowanych wyników.

------------------------------------------------------------------------

# 33. Player-facing setup

MVP/FULL może pokazywać: World Size, Seed, Population Density, Resource
Abundance, Climate Variation/Harshness, Connectivity, Starting
Knowledge, Settlement Density. Advanced: continents, culture diversity,
terrain ruggedness, water abundance, economic bootstrap. Parametry
techniczne nie muszą być eksponowane.

------------------------------------------------------------------------

# 34. Reference VS Config

Rekomendacja: `vertical_slice_reference`, 32 regiony, 1 kontynent, \~200
population, normal resources/connectivity, niski/rozwijający się
knowledge baseline, minimal economic bootstrap, mała liczba culture
seeds, bez wysp. Dokładne wartości trafiają do config/data.

------------------------------------------------------------------------

# 35. Black Mountain ecosystem

Reference fixture powinien posiadać wokół Black Mountain: food-producing
region, trade-connected settlement, potencjalne źródło labor/migration,
alternatywny region gospodarczy i realny transport cost/bottleneck.
Dzięki temu boom wymaga współpracy resources, AI, labor, migration,
trade i settlement systems.

------------------------------------------------------------------------

# 36. Scenario Fixtures

Test suite utrzymuje kontrolowane światy: `BLACK_MOUNTAIN_REFERENCE`,
`FOOD_VALLEY`, `TRADE_CORRIDOR`, `ISOLATED_REGION`,
`TECHNOLOGY_DIVERGENCE`, `URBAN_PRESSURE`. Fixture i proceduralny świat
używają tych samych runtime entities. Engine nie może wiedzieć, że
działa na fixture.

------------------------------------------------------------------------

# 37. World Quality Metrics

Generator oblicza metryki: connectivity, resource diversity/scarcity,
population distribution, economic viability, knowledge coherence,
settlement coherence i diversity. Hard failure oznacza stan technicznie
niemożliwy; soft warning może oznaczać nietypowy, ale ciekawy świat.

------------------------------------------------------------------------

# 38. Hard failures

Przykłady: negative deposit, invalid/dangling ref, niepołączony świat
przy `allowIslands=false`, population bez location, firma bez archetypu,
impossible PM, NaN price, duplicate ID. Takiego świata nie wolno
uruchomić.

------------------------------------------------------------------------

# 39. Soft warnings

Przykłady: bardzo mało żelaza, silna koncentracja ludności, dominujący
hub, trudny transport, ubogi świat. Seed nie powinien być odrzucany
tylko dlatego, że świat nie jest „optymalny".

------------------------------------------------------------------------

# 40. Retry policy

Retry używa deterministic derived seed zależnego od
`worldSeed + stage + attempt`, ma ograniczony retry budget i po
wyczerpaniu zwraca reprodukowalny
`GenerationFailure(stage, reason, seed, configHash, retryCount)`.

------------------------------------------------------------------------

# 41. Stable runtime IDs

Region, Connection, Deposit, Settlement, Cohort, Culture, Company,
Inventory i Market otrzymują deterministic stable IDs. Preferowane
world-local numeric IDs albo deterministic strings; dokładny format
zależy od stacku.

------------------------------------------------------------------------

# 42. Naming

Naming ma własny RNG stream. Nazwy powinny być krótkie, czytelne,
różnorodne i bez przesadnej fantasy/AI stylistyki. Po wygenerowaniu
proper name staje się World State. Locale nie regeneruje nazw; duplikaty
są rozwiązywane deterministycznie.

------------------------------------------------------------------------

# 43. Performance

Generator ma unikać globalnych O(N²), jeśli problem można rozwiązać
spatial indexem, nearest candidates, graph generation lub clustering.
Topology dla dużych światów powinno być lokalne / około O(N log N),
jeśli pozwala algorytm. Population korzysta z precomputed weights, a
company bootstrap z lokalnych viable archetypes.

------------------------------------------------------------------------

# 44. Benchmark ladder

Benchmarki World Generation: 32, 250, 600, 1 200, 2 000, 3 000 regionów.
Mierzymy total time, czas per stage, peak RAM, output/save size, entity
counts, validation time, checksum time i repair frequency. 3 000
pozostaje architecture stress target.

------------------------------------------------------------------------

# 45. Generation UI

MVP może prezentować etapy: Building World, Shaping Terrain, Placing
Resources, Seeding Population, Creating Settlements, Initializing
Economy, Validating World. UI nie steruje kolejnością engine. Anulowanie
nie może zostawić częściowego świata jako valid save.

------------------------------------------------------------------------

# 46. Tick 0 i Save

Po poprawnej generacji Tick 0 jest normalnym canonical World State i
może zostać zapisany. Save/load Tick 0 zachowuje checksum. Generator
oblicza checksum przed uruchomieniem symulacji.

------------------------------------------------------------------------

# 47. Locale independence

EN i PL dla tego samego seeda/config tworzą identyczny canonical
checksum. Proper names są generowane locale-independent; UI lokalizuje
definicje, nie mechanikę.

------------------------------------------------------------------------

# 48. Causality i Initial Conditions

Generator nie musi emitować SimulationFact dla każdego losowania.
Istotne warunki są dostępne dla Causality jako `INITIAL_CONDITION`:
Geography, Climate, Water, Resource, Population, Settlement, Knowledge,
Infrastructure, Economy, Culture.

Po setkach lat WHY? może wskazać np. natural river access lub złoże jako
historical enabling condition.

------------------------------------------------------------------------

# 49. Architect boundary

World Setup ustala initial conditions przed Tick 0. Architect
Intervention zmienia istniejący świat po jego utworzeniu. Reveal
Resource Deposit nie tworzy złoża; ujawnia istniejące. Fertility Shift,
Knowledge Injection, Trade Friction Shift i Environmental Shock nie są
skrótami generatora.

------------------------------------------------------------------------

# 50. Seed sharing

MVP powinien umożliwić wpisanie i skopiowanie seeda. Identyczny świat
wymaga tego samego generatorVersion/contentVersion/config. Opcjonalny
World Fingerprint może zawierać seed, generator version, config hash i
initial checksum.

------------------------------------------------------------------------

# 51. Test categories

Worldgen testy: Unit, Stage, Invariant, Property-based, Seed Sweep,
Scenario, Determinism i Performance. Seed sweep powinien analizować
setki/tysiące seedów w celu wykrycia uniformity, pathological scarcity,
nadmiernych hubów, wysokiego repair rate i ukrytych hardcoded patterns.

------------------------------------------------------------------------

# 52. Layer checksums

Rekomendowane checksums: topology, geography, resources, population,
settlements, knowledge, infrastructure, economy i full world. RNG
isolation test powinien np. potwierdzić, że zmiana naming content nie
zmienia economic/geographic checksum.

------------------------------------------------------------------------

# 53. Black Mountain generator tests

Reference world musi potwierdzić: hidden Iron Ore istnieje, mine nie
jest wymuszone na Tick 0, istnieje route do zewnętrznego marketu,
istnieje potencjalne źródło labor/migration i mining może stać się
viable przy odpowiednich warunkach. Generic simulation modules nie mogą
zawierać scenario-specific ID.

------------------------------------------------------------------------

# 54. Vertical Slice P0

P0: deterministic seed, 32-region graph, terrain, simplified climate,
water/fertility, 12 resources/deposits, population/cohorts, settlements,
simple cultures, initial knowledge, basic infrastructure, initial firms,
inventories, markets/prices, validation, GenerationReport i Black
Mountain fixture.

------------------------------------------------------------------------

# 55. VS optional / MVP / FULL

VS optional: advanced continents/islands/rivers/culture/naming/setup
sliders. MVP: Small/Standard worlds, multiple continents, richer
setup/culture, more resource chains i world preview. FULL: Large/Huge,
pełne 38 resources/content catalog i bogatsza environmental topology.
Real Earth/history presets są deferred.

------------------------------------------------------------------------

# 56. Debug tooling

Development build powinien umożliwiać World Inspector/eksport dla region
IDs, connections, terrain, climate, fertility, deposits, population,
settlements, companies i knowledge oraz overlays
topology/resources/habitability/population/knowledge/connectivity.
GenerationReport warto eksportować jako JSON/tekst.

------------------------------------------------------------------------

# 57. Repair telemetry

Benchmark raportuje repair frequency/type/attempts. Wysoki repair rate
oznacza wadę generatora; repair nie może stać się głównym algorytmem
tworzenia świata.

------------------------------------------------------------------------

# 58. API contract

Koncepcyjnie:
`generateWorld(config, seed) -> GenerationResult | GenerationFailure`.
Result zawiera `worldState`, `report`, `checksum`, `warnings`. Stage
posiada `id`, dependencies, execute i validate. Generator nie importuje
UI ani Chronicle.

------------------------------------------------------------------------

# 59. Anti-patterns

Zakazane: generator jako storyteller, guaranteed balance, guaranteed
history, hidden free goods/cash/workers/knowledge, locale-driven
gameplay generation, UI-driven physical distance, content-specific
`if iron_ore` jeśli można użyć data tags, oraz scenariuszowe wyjątki w
generic engine.

------------------------------------------------------------------------

# 60. Validation Gates

**WG-A Config:** config/content/seed valid.\
**WG-B Topology:** count/graph/connectivity valid.\
**WG-C Geography:** terrain/climate/water/fertility valid.\
**WG-D Resources:** deposits valid i scenario minima spełnione.\
**WG-E Population:** target/cohorts/locations valid.\
**WG-F Settlements/Culture:** housing i culture valid.\
**WG-G Knowledge/Infrastructure:** PM prerequisites i connections
coherent.\
**WG-H Economy:** firms/inventories/markets/prices viable.\
**WG-I Determinism:** repeated generation = same checksum.\
**WG-J Handoff:** Tick 1 startuje bez hidden correction.\
**WG-K Long-run:** reference world przechodzi testy Simulation Test
Spec.

------------------------------------------------------------------------

# 61. Acceptance Criteria VS

Gotowe, gdy: ten sam seed daje ten sam świat; powstają 32 regiony;
graph/geography/resources są zróżnicowane; hidden deposits istnieją
przed Discovery; population/cohorts/settlements/cultures są spójne;
knowledge jest nierównomierne; infrastructure i firms są viable;
inventories/prices są poprawne; GenerationReport/checksum działają;
Black Mountain nie wymaga specjalnej logiki; Tick 1 działa; EN/PL nie
zmienia state; można uruchomić 200-year reference test.

------------------------------------------------------------------------

# 62. Architecture Target Acceptance

Pipeline nie wymaga domyślnego O(N²), jest modularny i profilowalny,
runtime entities są te same niezależnie od preset size, indexes/IDs
skalują się, a benchmark ladder do 3 000 można uruchamiać automatycznie.

------------------------------------------------------------------------

# 63. Tuning vs open decisions

Tuning: terrain weights, climate distributions, deposit rarity,
population variance, settlement thresholds, inventory buffer, initial
price variation, repair thresholds --- wszystko w data/config.

Otwarte do stacku/prototypu: konkretny topology algorithm, spatial
representation, money representation, final serialization, naming
algorithm i officialMaxRegions.

------------------------------------------------------------------------

# 64. Pierwszy prototyp

Najpierw 8--12 regionów, 1 continent, 3--4 terrain patterns, kilka
resources, \~50 population, 3--5 settlements, basic food economy i Black
Mountain test region. Dopiero potem 32-region Reference VS z 12
resources, 20 goods i pełnym bootstrapem.

------------------------------------------------------------------------

# 65. Moduły implementacyjne

Proponowany podział: `worldgen/config`, `rng`, `topology`, `geography`,
`climate`, `water`, `resources`, `habitability`, `population`,
`settlements`, `culture`, `knowledge`, `infrastructure`, `economy`,
`markets`, `validation`, `repair`, `report`, `checksum`.

Testy:
`tests/worldgen/{unit,stages,properties,fixtures,seed-sweeps,determinism,performance}`.

------------------------------------------------------------------------

# 66. Granica odpowiedzialności

**World Generator tworzy świat w Tick 0.**\
**Simulation Engine tworzy historię od Tick 1.**\
**Causality Engine wyjaśnia historię.**\
**Chronicle wybiera to, co historycznie istotne.**\
**Architect zmienia warunki istniejącego świata.**\
**UI pozwala człowiekowi to zrozumieć.**

------------------------------------------------------------------------

# 67. Definition of Done

Implementacja World Generation v0.1 jest ukończona, gdy można podać
seed, wygenerować 32-region world, zapisać GenerationReport, otrzymać
deterministic checksum, uruchomić Tick 1, symulować dalej bez
generatora, powtórzyć Tick 0 identycznie, uruchomić Black Mountain bez
specjalnej logiki, rozpocząć 200-letni test i skalować ten sam pipeline
na większe presety.

------------------------------------------------------------------------

# 68. Status po tej specyfikacji

Po zatwierdzeniu tego dokumentu nie ma już dużego gameplayowego blockera
dokumentacyjnego dla Vertical Slice. Następną decyzją powinien być
krótki **FIRST CAUSE Technology Stack Decision**, a następnie
implementacja:
`M0 Repository Foundation → M1 Deterministic Core → M2 Data Foundation → M3 World State → M4 Black Mountain Fixture`.

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE World Generation Spec v0.1**
