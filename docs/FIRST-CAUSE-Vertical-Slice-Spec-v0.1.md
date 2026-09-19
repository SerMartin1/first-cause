# FIRST CAUSE --- Vertical Slice Spec v0.1

**Status:** wersja robocza / kanoniczna specyfikacja pierwszego
grywalnego wycinka\
**Projekt:** FIRST CAUSE\
**Wersja dokumentu:** 0.1\
**Rola:** zamrożenie zakresu pierwszego Vertical Slice, jego systemów,
contentu, scenariuszy testowych, kryteriów akceptacji i granic
implementacji.

**Dokumenty nadrzędne:** -
`FIRST-CAUSE-koncepcja-architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` -
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` (brak w repo; zob. Canonical Decisions §199) -
`FIRST-CAUSE-Entity-Data-Model-v0.1.md`

------------------------------------------------------------------------

# 0. Cel Vertical Slice

Vertical Slice FIRST CAUSE nie ma być „małą wersją całej gry". Ma
udowodnić, że **rdzeń koncepcji działa jako autonomiczna, czytelna i
przyczynowo wyjaśnialna symulacja**.

Najważniejsze pytanie:

> **Czy z prostych warunków początkowych, bez skryptowania historii,
> potrafi powstać wiarygodny łańcuch zmian gospodarczych,
> demograficznych, osadniczych i technologicznych, który gracz może
> zrozumieć przez WHY? i Chronicle?**

Kanoniczny test:

`WARUNKI → SZANSA → DECYZJE AUTONOMICZNYCH AKTORÓW → KONSEKWENCJE → SPRZĘŻENIA → HISTORIA → WYJAŚNIENIE`

Vertical Slice jest sukcesem, jeśli gracz może obserwować świat,
ingerować w warunki i następnie zobaczyć, **jak oraz dlaczego** świat
zmienił się w odpowiedzi.

------------------------------------------------------------------------

# 1. Filary, które VS musi udowodnić

## 1.1 Autonomiczny świat

Po rozpoczęciu symulacji świat musi funkcjonować bez ciągłego sterowania
przez gracza.

Firmy: - obserwują rynek, - produkują, - zatrudniają, - reagują na
ceny, - mogą powstawać, - mogą ograniczać działalność, - mogą upadać.

Ludność: - pracuje, - otrzymuje dochód, - konsumuje, - odczuwa
niedobory, - migruje.

Osady: - rosną lub tracą znaczenie.

Technologia: - rozwija się na podstawie warunków.

## 1.2 Emergentna historia

Black Mountain nie może „urosnąć, bo scenariusz mówi, że ma urosnąć".

Ma urosnąć tylko wtedy, gdy powstaną odpowiednie warunki.

## 1.3 Przyczynowość

System musi potrafić odpowiedzieć: - dlaczego wzrosła populacja, -
dlaczego cena wzrosła, - dlaczego powstała firma, - dlaczego rozpoczęła
się migracja, - dlaczego osada się rozwinęła, - dlaczego firma upadła, -
dlaczego region wszedł w kryzys.

## 1.4 Interwencja Architekta

Gracz zmienia **przyczynę**, a nie bezpośredni rezultat.

## 1.5 Reprodukowalność

Ten sam: - seed, - stan początkowy, - wersja contentu, - zestaw
interwencji

musi prowadzić do tego samego wyniku.

------------------------------------------------------------------------

# 2. Zakres świata VS

## 2.1 Liczba regionów

**Docelowy zakres VS: 24--40 regionów.**

Rekomendowana konfiguracja referencyjna:

**32 regiony.**

To wystarcza, aby powstały: - różnice geograficzne, - lokalne
specjalizacje, - migracja, - handel, - izolowane regiony, - regiony
tranzytowe, - konkurencja o zasoby i pracę.

## 2.2 Kontynenty

VS:

**1 kontynent.**

Kontynent jest organizacyjnym korzeniem regionów, bez dodatkowej logiki
makro.

## 2.3 Populacja startowa

Zgodnie z wcześniejszym zakresem:

**około 200 jednostek populacji startowej w skali modelu VS.**

Interpretacja techniczna musi zostać zachowana jako parametr
konfiguracyjny. Symulacja nadal używa Population Cohorts.

Nie tworzymy 200 indywidualnych NPC.

## 2.4 Seed

Każdy świat VS posiada jawny seed.

Minimalny zestaw testowy: - `VS_SEED_001` - `VS_SEED_002` -
`VS_SEED_003` - `BLACK_MOUNTAIN_REFERENCE`

------------------------------------------------------------------------

# 3. Geografia VS

Każdy region posiada co najmniej:

``` text
terrain
climate
fertility
waterAccess
environment
resources
connections
```

Minimalne typy terenu: - plains, - hills, - mountains, - forest, - river
valley, - coast.

Minimalne warianty klimatu: - cool, - temperate, - warm, - dry.

Nie implementujemy jeszcze pełnego globalnego systemu klimatycznego.

------------------------------------------------------------------------

# 4. Graf regionów

Regiony są połączone grafem.

Każde połączenie posiada: - Physical Distance, - Terrain Difficulty, -
Infrastructure, - Capacity, - Security, - Border Friction, - Seasonal
Modifier.

VS musi używać:

`EffectiveDistance = PhysicalDistance × TerrainModifier × InfrastructureModifier × BorderModifier × SecurityModifier × SeasonalModifier`

W początkowym VS: - Border Friction może być neutralne, - Security może
być stabilne, - Seasonal Modifier może być uproszczony.

Sama architektura pól pozostaje pełna.

------------------------------------------------------------------------

# 5. Aktywne systemy VS

W Vertical Slice aktywne są:

1.  Environment --- uproszczony
2.  Resources
3.  Demography
4.  Production Planning
5.  Production
6.  Inventory
7.  Market Demand
8.  Price Adjustment
9.  Trade & Transport
10. Company Finances
11. Employment & Wages
12. Household Income & Consumption
13. Services --- minimalny zakres
14. Needs Satisfaction
15. Migration
16. Settlement & Urbanization
17. Technology & Knowledge
18. Architect Interventions
19. Events --- minimalny system
20. Causality
21. Chronicle
22. Validation

------------------------------------------------------------------------

# 6. Systemy wyłączone lub mocno ograniczone

W pierwszym VS nie są wymagane:

-   pełne państwa,
-   wojny,
-   dyplomacja,
-   rozbudowana polityka,
-   pełne narody,
-   rozbudowane relacje międzypaństwowe,
-   pełny system postaci historycznych,
-   globalne rynki finansowe,
-   waluty,
-   giełdy,
-   rozbudowany kredyt,
-   pełna własność udziałowa firm,
-   zaawansowana sieć energetyczna,
-   elektronika,
-   ropa i gaz jako pełny przemysł,
-   motoryzacja,
-   lotnictwo,
-   technologie współczesne.

Kultura działa w formie uproszczonej wystarczającej do migracji i
przyszłej rozbudowy.

------------------------------------------------------------------------

# 7. Kolejność ticka

VS implementuje miesięczny tick:

1.  Environment Update
2.  Resource Availability / Depletion
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
16. Settlement / Urbanization Pressure
17. State --- pominięty / neutralny adapter
18. Technology / Knowledge
19. Culture / Politics --- tylko minimalne Culture
20. Event Resolution
21. Causality Graph
22. Chronicle Significance
23. End-of-Tick Validation

Kolejność jest kanoniczna dla VS.

------------------------------------------------------------------------

# 8. Horyzont symulacji

Główny test:

**200 lat symulacji.**

Przy miesięcznym ticku:

`200 × 12 = 2400 ticków`

Dodatkowe testy: - 10 lat, - 50 lat, - 100 lat, - 200 lat.

Testy długowieczności mogą później obejmować 500+ lat.

------------------------------------------------------------------------

# 9. Zasoby VS

Rdzeń aktywny:

1.  Grain / Zboże
2.  Livestock / Zwierzęta hodowlane
3.  Fish / Ryby
4.  Timber / Drewno
5.  Cotton / Bawełna
6.  Stone / Kamień
7.  Clay / Glina
8.  Limestone / Wapień
9.  Iron Ore / Ruda żelaza
10. Coal / Węgiel

Rozszerzenie VS: 11. Sand / Piasek 12. Salt / Sól

Domyślna konfiguracja referencyjna używa **12 zasobów**, ale Black
Mountain nie musi posiadać wszystkich.

------------------------------------------------------------------------

# 10. Zasoby odnawialne i nieodnawialne

Odnawialne: - Grain jako zdolność rolnicza, - Livestock, - Fish, -
Timber, - Cotton.

Nieodnawialne: - Stone, - Clay, - Limestone, - Iron Ore, - Coal, - Sand
w uproszczeniu może być traktowany jako bardzo obfity lokalny zasób, -
Salt zależnie od depozytu.

Kluczowy test wyczerpywania dotyczy: **Iron Ore / Coal.**

------------------------------------------------------------------------

# 11. Dobra VS

Obowiązkowy rdzeń:

1.  Staple Crops / Podstawowe płody rolne
2.  Flour / Mąka
3.  Bread & Basic Food / Podstawowa żywność
4.  Meat / Mięso
5.  Fish Food / Żywność rybna
6.  Raw Textile Fiber / Surowe włókno
7.  Textiles / Tekstylia
8.  Clothing / Odzież
9.  Lumber / Tarcica
10. Cut Stone / Obrabiany kamień
11. Bricks / Cegły
12. Cement
13. Iron / Żelazo
14. Steel / Stal
15. Hand Tools / Narzędzia ręczne

Rozszerzenie rekomendowane: 16. Furniture / Meble 17. Machinery /
Maszyny 18. Biomass Fuel / Biomasa 19. Coal Fuel / Paliwo węglowe 20.
Carts / Wozy

### Decyzja VS

Implementacja powinna obsłużyć **20 dóbr**, nawet jeśli podstawowy
benchmark wykorzystuje głównie pierwsze 15.

Daje to przestrzeń do obserwacji wczesnej mechanizacji bez zmiany
architektury.

------------------------------------------------------------------------

# 12. Archetypy firm VS

Obowiązkowe:

1.  Crop Farm
2.  Livestock Farm
3.  Fishing Company
4.  Forestry Company
5.  Mine
6.  Quarry
7.  Mill & Food Processor
8.  Textile Producer
9.  Sawmill & Woodworks
10. Construction Materials Producer
11. Smelter
12. Steelworks
13. Toolmaker
14. Construction Company
15. Transport Company

Rozszerzenie: 16. Furniture Manufacturer 17. Machinery Factory

### Decyzja

VS powinien technicznie obsługiwać **17 archetypów**, ale nie każdy musi
istnieć na starcie świata.

Firmy mają powstawać emergentnie.

------------------------------------------------------------------------

# 13. Production Methods VS

Minimalne rodziny:

### Rolnictwo

-   Manual Farming
-   Organized Farming
-   Crop Rotation Farming
-   Animal-Powered Farming --- opcjonalny późny VS

### Hodowla

-   Extensive Livestock
-   Managed Livestock

### Rybołówstwo

-   Shore/River Fishing
-   Small Boat Fishing

### Leśnictwo

-   Manual Forestry
-   Organized Forestry

### Górnictwo

-   Surface Extraction
-   Manual Mine
-   Improved Mine
-   Deep Mine --- późny VS / rozszerzenie

### Kamieniołom

-   Manual Quarry
-   Organized Quarry

### Żywność

-   Manual Processing
-   Water/Wind Mill
-   Organized Food Processing

### Tekstylia

-   Craft Textile
-   Organized Textile Workshop
-   Early Mechanized Textile --- rozszerzenie

### Drewno

-   Manual Woodworking
-   Water Sawmill
-   Organized Sawmill

### Materiały budowlane

-   Manual Kiln
-   Improved Kiln
-   Early Cement Production

### Metalurgia

-   Basic Iron Smelting
-   Improved Furnace
-   Early Steelmaking

### Narzędzia

-   Craft Tools
-   Organized Tool Workshop

### Maszyny

-   Workshop Machinery --- rozszerzenie

### Transport

-   Foot/Porter
-   Pack Animal
-   Cart
-   River

------------------------------------------------------------------------

# 14. Łańcuchy gospodarcze, które muszą działać

## Żywność

`Zboże → Mąka → Podstawowa żywność → Populacja`

## Hodowla

`Livestock → Meat → Population`

## Ryby

`Fish → Fish Food → Population`

## Tekstylia

`Cotton → Raw Fiber → Textiles → Clothing → Population`

## Drewno

`Timber → Lumber → Construction / Furniture / Tools`

## Budownictwo

`Stone → Cut Stone` `Clay → Bricks` `Limestone → Cement`
`Construction Goods + Labor → Infrastructure/Settlement Capacity`

## Żelazo

`Iron Ore + Fuel → Iron`

## Stal

`Iron + Coal/Fuel → Steel`

## Narzędzia

`Iron/Steel → Hand Tools`

## Maszyny

`Steel + Tools → Machinery`

Każdy obowiązkowy łańcuch musi przejść automatyczny graph audit.

------------------------------------------------------------------------

# 15. Energia VS

Aktywne: - Biomass - Coal

W późnym VS można dopuścić: - mechanical water/wind power.

Elektryczność nie jest wymagana do zaliczenia pierwszego VS.

Architektura musi jednak pozostać kompatybilna z późniejszym Energy
system.

------------------------------------------------------------------------

# 16. Transport VS

Aktywne tryby: 1. Foot / Porter 2. Pack Animals 3. Cart 4. River
Transport

Opcjonalnie: 5. Sailing --- jeśli topologia testowa posiada wybrzeże.

Kolej nie jest wymagana w podstawowym Black Mountain, ale może być
testem rozszerzonym.

------------------------------------------------------------------------

# 17. Rynek

Każdy region posiada Market.

Dla każdego dobra: - Supply, - Demand, - Inventory, - Local Price, -
Import Demand, - Export Supply, - Shortage Severity.

Cena:

`PricePressure = Sensitivity × ((Demand - Supply) / NormalSupply)`

`NewPrice = OldPrice × (1 + PricePressure)`

Obowiązkowe zabezpieczenia: - price floor, - miesięczny limit zmiany, -
smoothing, - inventory buffer.

Dokładne wartości są tuningiem.

------------------------------------------------------------------------

# 18. Handel

Handel musi powstawać wtedy, gdy import staje się ekonomicznie sensowny.

`ImportedCost = ForeignPrice + TransportCost + Tariff + RiskCost`

W VS: - Tariff = 0, - Border Friction neutralne, - RiskCost minimalny
lub 0.

Pozwala to testować gospodarkę bez państw.

Handel nadal musi respektować: - Effective Distance, - capacity, -
congestion, - fizyczny inventory.

------------------------------------------------------------------------

# 19. Firmy i AI gospodarcze

Cykl:

`OBSERVE → FORECAST → DECIDE → ACT → EVALUATE`

Obowiązkowe decyzje: - zwiększ produkcję, - zmniejsz produkcję, -
zatrudnij, - zwolnij, - zmień wage offer, - zmień Production Method, -
rozbuduj capacity, - utwórz firmę, - zamknij firmę, - bankructwo.

Nie wymagamy jeszcze: - fuzji, - przejęć, - akcji, - złożonych
kredytów, - międzynarodowych korporacji.

------------------------------------------------------------------------

# 20. Entrepreneurship

Nowa firma może powstać na podstawie:

`OpportunityScore = DemandGap + ExpectedMargin + ResourceAccess + LaborAvailability + SkillAvailability + MarketAccess - Competition - Risk - CapitalRequirement`

VS musi udowodnić, że: - firma może powstać bez skryptu, - nie powstaje,
gdy warunki są złe, - może powstać konkurencja, - może zbankrutować.

------------------------------------------------------------------------

# 21. Populacja

Kohorty używają:

### Age

-   0--14
-   15--24
-   25--44
-   45--64
-   65+

### Economic Class

-   Poor
-   Working
-   Middle
-   Wealthy
-   Elite

### Skill

-   Unskilled
-   Skilled
-   Specialist

VS nie potrzebuje ogromnej liczby professions.

Minimalne grupy zawodowe: - agriculture, - extraction, -
manufacturing, - construction, - transport, - services, - specialist.

------------------------------------------------------------------------

# 22. Gospodarstwa domowe i potrzeby

Aktywna hierarchia:

`Survival → Basic → Services → Comfort → Prosperity`

`Modern` może istnieć w schemacie, ale praktycznie pozostanie nieaktywne
w większości VS.

Kolejność wydatków: 1. Survival 2. Basic 3. Services 4. Comfort 5.
Prosperity 6. Savings

Niedobory muszą wpływać na Needs Satisfaction.

------------------------------------------------------------------------

# 23. Płace i zatrudnienie

Płace reagują na: - popyt na pracę, - podaż pracy, - skill, -
produktywność, - koszt życia, - rentowność firmy, - mobilność.

VS musi umożliwiać: - niedobór pracowników, - konkurencję o pracę, -
wzrost płac, - bezrobocie, - migrację za pracą.

------------------------------------------------------------------------

# 24. Migracja

`MigrationAttraction = Jobs + ExpectedWage + Safety + NeedsAvailability + CulturalAffinity + FamilyConnections + Services - HousingCost - EffectiveDistance - BorderFriction - Conflict - EnvironmentalRisk`

W VS: - Conflict = 0, - Border Friction ≈ 0, - Culture działa
uproszczone.

Migracja jest probabilistyczna, ale deterministyczna dla seeda.

------------------------------------------------------------------------

# 25. Osadnictwo

Etapy: `Camp → Hamlet → Village → Town → City → Metropolis`

VS musi obsługiwać co najmniej: - Camp, - Hamlet, - Village, - Town, -
City.

Metropolis może istnieć w danych, ale nie musi być osiągalne w
benchmarku.

Settlement Pressure powinien reagować na: - populację, - miejsca
pracy, - dostęp do żywności, - handel, - infrastrukturę, - usługi, -
atrakcyjność regionu.

------------------------------------------------------------------------

# 26. Housing

Minimalny model: - Housing Capacity, - Housing Cost, - Housing Pressure.

Wzrost populacji bez wzrostu capacity: - podnosi Housing Pressure, -
zwiększa Housing Cost, - zmniejsza atrakcyjność migracyjną.

To jest kluczowy hamulec nieskończonego wzrostu osady.

------------------------------------------------------------------------

# 27. Usługi VS

Minimalne: 1. Basic Retail / Distribution 2. Construction 3. Basic
Transport 4. Basic Healthcare 5. Basic Education

Usługi mają: - capacity, - accessibility, - price/quality, - workforce.

Nie potrzebujemy pełnego sektora usługowego.

------------------------------------------------------------------------

# 28. Wiedza VS

**Zaktualizowane 2026-09-18 (patrz `FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md`,
`TECH-004` w `Canonical Decisions`) -- zastępuje pierwotny podział 5
głównych + 4 wspierające domeny opisany niżej w tej sekcji przed
aktualizacją.**

**5 Knowledge Domains, wszystkie w pełni aktywne w VS, bez rozróżnienia
"głównych"/"wspierających":** 1. Rolnictwo i Żywność (Agriculture &amp;
Food) 2. Górnictwo i Metalurgia (Mining &amp; Metallurgy) 3. Budownictwo i
Mechanika (Construction &amp; Mechanics) 4. Transport i Komunikacja
(Transportation &amp; Communication) 5. Nauka i Społeczeństwo (Science &amp;
Society).

Każda domena łączy 2--3 z pierwotnych 12 wąskich domen (np. Górnictwo i
Metalurgia = Mining + Metallurgy) -- pełne mapowanie w katalogu odkryć.
Powód zmiany: 12 wąskich domen dawało zbyt drobnoziarnisty podział
względem porównywalnych gier gatunku i utrudniało dostarczenie spójnego
zestawu Discoveries na start (M15).

------------------------------------------------------------------------

# 29. Odkrycia VS

**Zaktualizowane 2026-09-18 (`TECH-008`, zastępuje listę "20--30
odkryć" z kodami `AGR-001`/`CON-001`/`MET-001`/... opisaną niżej przed
aktualizacją -- te kody pochodziły z wersji sprzed połączenia domen i
nigdy nie zostały uzgodnione z realnymi prefiksami contentu).**

Obowiązkowy katalog aktywny: **wszystkie 125 odkryć** (5 domen × 25,
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md`), tiery T0--T6
(`TECH-007`). Content: `content/discoveries/*.json` (id: `agr_001`--
`agr_025`, `min_001`--`min_025`, `mec_001`--`mec_025`, `tra_001`--
`tra_025`, `nau_001`--`nau_025`), zweryfikowane pipeline'em M2
(`content-fixtures.integration.test.ts`, 0 błędów/ostrzeżeń).

Nowy podział nie rozróżnia już "obowiązkowego rdzenia" i pozostałych --
każda z 5 domen ma pełny, aktywny zestaw 25 Discoveries od startu M15.

------------------------------------------------------------------------

# 30. Discovery flow

VS musi przeprowadzić pełny cykl:

`Knowledge → Eligibility → Discovery Pressure → Discovery → Known → Available → Adoption → Production Method`

Odkrycie nie może automatycznie zmienić wszystkich firm.

------------------------------------------------------------------------

# 31. Resource Discovery

Część złóż jest ukryta.

Black Mountain: - Iron Ore istnieje od początku w seedzie, - status może
być `UNKNOWN`, - MIN-001 + warunki regionu umożliwiają odkrycie, -
odkrycie tworzy fakt, - dopiero potem firmy mogą ocenić opportunity.

To jest jeden z najważniejszych testów całej filozofii FIRST CAUSE.

------------------------------------------------------------------------

# 32. Kultura VS

Uproszczony model: - `cultureId`, - regional culture shares, - cultural
affinity.

Kultura wpływa umiarkowanie na migrację.

Nie implementujemy jeszcze: - pełnej ewolucji norm, - konfliktów
kulturowych, - nacjonalizmu, - asymilacji wielopokoleniowej w pełnej
skali.

------------------------------------------------------------------------

# 33. Architect Influence

Prototype cap:

**0--100 Influence**

Interwencje kosztują Influence zależnie od: - magnitude, - duration, -
scope, - naturalness.

Dokładne koszty pozostają tuningiem.

------------------------------------------------------------------------

# 34. Interwencje Architekta VS

Minimalnie około **5 typów**.

## INT-01 Resource Reveal / Resource Opportunity

Architekt zwiększa możliwość ujawnienia lub dostępności wskazanego
zasobu, bez tworzenia gotowej kopalni.

## INT-02 Fertility Shift

Zmiana żyzności wybranego regionu.

## INT-03 Population Seed / Migration Impulse

Zmiana warunków demograficznych lub początkowej presji migracyjnej.

## INT-04 Knowledge Impulse

Zwiększenie warunków rozwoju wybranej domeny wiedzy.

## INT-05 Infrastructure Opportunity

Poprawa warunków umożliwiających rozwój połączenia/infrastruktury, bez
bezpośredniego tworzenia całej gospodarki.

Opcjonalny: \## INT-06 Environmental Shock Susza, pogorszenie warunków
lub inny kontrolowany eksperyment.

### Zasada

Interwencja powinna zmieniać warunki wejściowe, nie pisać wyniku.

------------------------------------------------------------------------

# 35. Causality Engine --- minimalny zakres VS

Każda istotna zmiana emituje `SimulationFact`.

Minimalne typy: - resource_discovered, - resource_depleted, -
company_founded, - company_closed, - production_changed, -
production_method_adopted, - employment_changed, - wage_changed, -
price_changed, - shortage_started, - shortage_ended, -
trade_flow_started, - migration_changed, - settlement_stage_changed, -
knowledge_increased, - discovery_occurred, - needs_changed, -
intervention_applied.

------------------------------------------------------------------------

# 36. Causal Edge

Każdy ważny skutek może wskazywać przyczyny.

``` text
sourceFact
→ targetFact
```

Przechowujemy: - type, - strength, - delay, - scope, - confidence, -
architectInfluence.

Poziomy: - Primary - Significant - Minor - Trace

------------------------------------------------------------------------

# 37. WHY? --- obowiązkowe pytania

VS musi odpowiedzieć przynajmniej na:

1.  Dlaczego wzrosła cena dobra?
2.  Dlaczego pojawił się niedobór?
3.  Dlaczego powstała firma?
4.  Dlaczego firma upadła?
5.  Dlaczego wzrosło zatrudnienie?
6.  Dlaczego wzrosły płace?
7.  Dlaczego ludzie migrują do regionu?
8.  Dlaczego ludzie opuszczają region?
9.  Dlaczego osada urosła?
10. Dlaczego osada podupadła?
11. Dlaczego odkryto zasób?
12. Dlaczego pojawiło się odkrycie technologiczne?
13. Dlaczego firma przyjęła nowy Production Method?
14. Dlaczego rozpoczął się handel między regionami?
15. Jak interwencja Architekta wpłynęła na obecny stan?

WHY? powinno pokazywać 2--5 najważniejszych przyczyn, a nie surowy graf.

------------------------------------------------------------------------

# 38. Butterfly Effect --- minimalny zakres

Dla interwencji Architekta system przechowuje łańcuch wpływu.

Przykład:

`Interwencja` → `większa szansa odkrycia rudy` → `odkrycie` → `kopalnia`
→ `miejsca pracy` → `migracja` → `wzrost osady` →
`wzrost popytu na żywność` → `handel` → `wyższe ceny gruntów/mieszkań`

Gracz powinien móc przejść od późnego skutku do pierwotnej interwencji.

------------------------------------------------------------------------

# 39. Chronicle

Chronicle pokazuje tylko istotne wydarzenia.

W VS: - Concise, - Standard, - Detailed.

Zmienia się tylko raportowanie, nie symulacja.

Przykładowe wpisy: - odkrycie ważnego złoża, - powstanie dużej firmy, -
rozwój osady do Town, - poważny niedobór, - przełom technologiczny, -
początek ważnej trasy handlowej, - wyczerpanie kluczowego złoża, -
załamanie regionalnej gospodarki.

------------------------------------------------------------------------

# 40. Historical Significance

Koncepcyjnie:

`HistoricalSignificance = Magnitude × Duration × PopulationAffected × GeographicScope × Novelty × CausalImpact`

Dokładne progi nie są zamrożone w VS v0.1.

------------------------------------------------------------------------

# 41. Minimalny UI Vertical Slice

UI ma przede wszystkim umożliwiać obserwację i zrozumienie symulacji.

Obowiązkowe widoki:

1.  **World Command Center**
2.  **Living Atlas / World Network**
3.  **Region Detail**
4.  **Settlement Detail**
5.  **Economy / Market Detail**
6.  **Technology Detail**
7.  **Chronicle**
8.  **WHY? Explanation**
9.  **Architect Intervention Panel**
10. **Simulation Controls**

Nie implementujemy klasycznej mapy geograficznej jako fundamentu MVP.

------------------------------------------------------------------------

# 42. World Command Center

Powinien pokazywać: - aktualną datę, - prędkość, - populację, -
najważniejsze zmiany, - aktywne niedobory, - ważne migracje, - nowe
odkrycia, - ważne firmy, - Chronicle highlights, - skutki ostatniej
interwencji.

To pulpit obserwatora/Architekta, nie panel mikrozarządzania.

------------------------------------------------------------------------

# 43. Living Atlas / World Network

Tekstowo-sieciowy widok świata.

Pokazuje: - regiony, - połączenia, - wielkość osad, - populację, -
kluczowe zasoby, - handel, - presje, - wybrane relacje.

Nie musi odwzorowywać realnej geografii w skali 1:1.

------------------------------------------------------------------------

# 44. Region Detail

Minimalnie: - populacja, - kohorty, - potrzeby, - zasoby, - firmy, -
produkcja, - rynek, - ceny, - import/eksport, - zatrudnienie, - płace, -
osady, - infrastruktura, - wiedza, - odkrycia, - najważniejsze fakty, -
WHY?.

------------------------------------------------------------------------

# 45. Kontrola czasu

Wymagane: - Pause - ×1 - ×2 - ×4 - ×10 - ×100

×100 jest celem symulacyjnym i może ograniczać częstotliwość
renderowania UI, ale nie pomija ticków.

------------------------------------------------------------------------

# 46. Black Mountain --- scenariusz referencyjny

## 46.1 Cel

Udowodnić najważniejszy emergentny łańcuch gry.

## 46.2 Warunki początkowe

Region: **Black Mountain**

Charakterystyka: - teren górzysty, - umiarkowana dostępność, - mała
populacja, - mała osada, - ograniczona lokalna gospodarka, - ukryte
złoże Iron Ore, - możliwy dostęp do Coal lokalnie lub handlowo, -
połączenie z co najmniej jednym regionem żywnościowym, - ograniczona
infrastruktura.

## 46.3 Oczekiwany możliwy łańcuch

`Iron revealed` → `OpportunityScore rośnie` → `Mine founded` →
`Employment rośnie` → `Wages mogą rosnąć` →
`Migration attraction rośnie` → `Population rośnie` →
`Settlement rośnie` → `Food demand rośnie` → `Imports/trade rosną` →
`Construction demand rośnie` → `Urbanization rośnie`

Po czasie:

`Deposit quality/quantity spada` → `Extraction cost rośnie` →
`Profitability spada`

Następnie świat powinien móc wybrać emergentnie: - Economic
Diversification, - Import Transition, - Technological Extension, -
Substitution, - Resource Bust, - Ghost Settlement.

Nie wolno skryptować wyboru.

------------------------------------------------------------------------

# 47. Black Mountain --- warianty wyników

## A. Boom → Bust

Region uzależnia się od kopalni i załamuje po wyczerpaniu.

## B. Boom → Diversification

Kapitał, ludność i infrastruktura umożliwiają nowe branże.

## C. Boom → Import Transition

Huta/przemysł pozostają, ale ruda jest importowana.

## D. Technological Extension

Nowe Mining PM przedłużają ekonomiczną żywotność złoża.

## E. Weak Boom

Złoże istnieje, ale transport/praca/popyt są zbyt słabe.

## F. No Boom

Złoże zostaje odkryte, lecz firma nigdy nie powstaje.

Każdy wariant jest poprawny, jeśli wynika z danych.

------------------------------------------------------------------------

# 48. Scenariusz Food Valley

Cel: sprawdzić żywność, wzrost populacji i popyt.

Warunki: - wysoka fertility, - dobre waterAccess, - duża produkcja
Grain, - początkowo słaby dostęp do odległych rynków.

Test:
`nadwyżka → spadek ceny → możliwość eksportu → rozwój transportu/handlu → wzrost dochodu lub kryzys producentów`

------------------------------------------------------------------------

# 49. Scenariusz Isolated Settlement

Cel: sprawdzić Effective Distance.

Warunki: - zasoby, - populacja, - słabe połączenia.

Test: - wysokie ceny importu, - lokalna substytucja, - ograniczona
specjalizacja, - możliwa emigracja.

Po poprawie połączenia: - nowe towary, - spadek kosztów, - zmiana
lokalnych firm, - wzrost handlu.

------------------------------------------------------------------------

# 50. Scenariusz Resource Shock

Cel: sprawdzić propagację niedoboru.

Przykład: spadek podaży Timber.

Oczekiwany możliwy łańcuch:

`Timber shortage` → `Lumber price ↑` → `Construction cost ↑` →
`Housing capacity growth ↓` → `Housing pressure ↑` →
`Migration attractiveness ↓`

WHY? musi odtworzyć ten łańcuch.

------------------------------------------------------------------------

# 51. Scenariusz Technology Divergence

Dwa podobne regiony: - podobne zasoby, - podobna populacja.

Jeden ma: - więcej specialist, - wyższą wiedzę, - lepszy kontakt
handlowy.

Test: czy z czasem powstają różne ścieżki technologiczne i gospodarcze
bez ręcznego bonusu „region technologiczny".

------------------------------------------------------------------------

# 52. Scenariusz Infrastructure Opportunity

Dwa regiony mają potencjał handlu, ale wysoki Effective Distance.

Interwencja Architekta poprawia warunki infrastrukturalne.

Test:
`transport cost ↓ → trade ↑ → specialization ↑ → firms respond → migration/settlement effects`

------------------------------------------------------------------------

# 53. Testy kontrfaktyczne

Każdy ważny scenariusz powinien mieć wersję A/B.

Przykład:

### World A

Black Mountain bez interwencji.

### World B

Ten sam seed + Resource/Knowledge intervention.

Porównujemy: - population, - firms, - wages, - prices, - settlement
stage, - trade, - technology, - Chronicle, - causal path.

To jest fundament Experiment Mode.

------------------------------------------------------------------------

# 54. Invariants VS

Po każdym ticku:

-   population \>= 0,
-   resource.quantity \>= 0,
-   inventory \>= 0,
-   price \> 0,
-   employment \<= working population,
-   exports \<= available goods,
-   cash/debt finite,
-   wszystkie hard references istnieją,
-   brak phantom workers,
-   brak phantom goods,
-   brak produkcji bez wejść,
-   brak zwykłego magazynowania Electricity,
-   udziały pozostają w zakresie,
-   brak `NaN`,
-   brak `Infinity`.

Błąd invariant w test build powinien zatrzymać benchmark i zapisać
diagnostykę.

------------------------------------------------------------------------

# 55. Determinism Test

Uruchom:

`BLACK_MOUNTAIN_REFERENCE`

dwa razy przez 2400 ticków.

Porównaj: - checksum świata, - populację regionów, - firmy, -
inventory, - ceny, - discoveries, - Chronicle, - causal history.

Wyniki muszą być identyczne.

------------------------------------------------------------------------

# 56. Performance Test

Minimalny benchmark:

### VS benchmark

-   32 regiony,
-   pełny content VS,
-   2400 ticków.

### Stress benchmark

-   40 regionów,
-   większa liczba firm,
-   2400 ticków.

Mierzyć: - czas ticka, - pamięć, - liczbę firm, - liczbę kohort, -
liczbę faktów, - rozmiar causal memory, - rozmiar save.

Nie zamrażamy jeszcze konkretnego czasu CPU jako kryterium finalne;
najpierw potrzebny jest baseline.

------------------------------------------------------------------------

# 57. Stability Test

Symulacja 200 lat nie może: - eksplodować cenowo bez przyczyny, -
sprowadzić całej populacji do zera bez logicznego szoku, - tworzyć
nieskończonego kapitału, - tworzyć nieskończonych firm, - produkować bez
zasobów, - permanentnie oscylować w nielogiczny sposób, - generować
nieograniczonej historii.

------------------------------------------------------------------------

# 58. Economy Sanity Tests

Sprawdzić:

1.  brak Grain → presja cen żywności,
2.  nadmiar Grain → presja spadkowa,
3.  drogi transport → mniej handlu,
4.  tani transport → więcej opłacalnych tras,
5.  brak pracy → ograniczenie produkcji,
6.  brak input → ograniczenie produkcji,
7.  brak popytu → ograniczenie produkcji,
8.  wysoka marża → większy OpportunityScore,
9.  wyczerpanie rudy → spadek wydobycia,
10. import może zastąpić lokalny surowiec, jeśli opłacalny.

------------------------------------------------------------------------

# 59. Population Sanity Tests

1.  miejsca pracy zwiększają atrakcyjność,
2.  wysokie Housing Cost ją zmniejsza,
3.  niedobór Survival obniża atrakcyjność,
4.  Effective Distance ogranicza migrację,
5.  populacja nie teleportuje się,
6.  kohorty zachowują sumy po split/merge.

------------------------------------------------------------------------

# 60. Technology Sanity Tests

1.  Discovery nie zachodzi bez hard prerequisites.
2.  Knowledge samo nie oznacza Adoption.
3.  Discovery może dyfundować.
4.  Firma nie adoptuje PM bez wymaganych inputów/infrastruktury.
5.  Lepszy PM może nie zostać przyjęty, jeśli jest nieopłacalny.
6.  ukryte złoże nie może być eksploatowane przed odkryciem.
7.  seeded RNG daje identyczny breakthrough timing przy identycznym
    stanie.

------------------------------------------------------------------------

# 61. Causality Sanity Tests

Każde znaczące: - price change, - migration change, - settlement
growth, - company foundation, - discovery, - shortage

musi posiadać co najmniej jedną sensowną przyczynę albo zostać oznaczone
jako exogenous/root fact.

Nie wolno generować fałszywych przyczyn tylko po to, by wypełnić WHY?.

------------------------------------------------------------------------

# 62. Chronicle Sanity Tests

Chronicle: - nie może wymyślać faktów, - nie może raportować każdego
drobiazgu, - nie może zmieniać symulacji, - musi odwoływać się do
SimulationFact, - musi respektować Concise/Standard/Detailed.

------------------------------------------------------------------------

# 63. Debug tools

Vertical Slice powinien mieć tryb developerski:

-   inspect region,
-   inspect company,
-   inspect cohort,
-   inspect market,
-   inspect inventory,
-   inspect deposit,
-   inspect discovery eligibility,
-   inspect causal chain,
-   inspect RNG stream/seed,
-   step one tick,
-   run N ticks,
-   pause on invariant failure,
-   export snapshot,
-   compare two worlds.

Bez tego strojenie emergentnej symulacji będzie zbyt trudne.

------------------------------------------------------------------------

# 64. Telemetria developerska

Nie chodzi o telemetrię użytkownika, lecz dane diagnostyczne symulacji.

Zapisywać m.in.: - liczba firm, - births/deaths, - migration, -
production totals, - shortages, - price volatility, - trade volume, -
bankruptcies, - settlement changes, - discoveries, - causal fact
count, - Chronicle count.

------------------------------------------------------------------------

# 65. Save / Load VS

Wymagane: - zapis świata, - odczyt, - kontynuacja bez zmiany wyniku.

Test:

1.  uruchom 600 ticków,
2.  zapisz,
3.  kontynuuj do 1200,
4.  osobno wczytaj save z 600,
5.  kontynuuj do 1200,
6.  porównaj checksum.

Wynik musi być identyczny.

------------------------------------------------------------------------

# 66. Minimalny Experiment Mode

W VS wystarczy:

1.  utwórz świat z seedem,
2.  uruchom symulację,
3.  zapisz punkt eksperymentu,
4.  utwórz branch A,
5.  utwórz branch B,
6.  zastosuj inną interwencję,
7.  porównaj kluczowe wskaźniki.

Nie potrzebujemy jeszcze zaawansowanego UI wielu równoległych światów.

------------------------------------------------------------------------

# 67. Kryteria ukończenia Vertical Slice

VS jest **technicznie ukończony**, jeśli:

-   świat 24--40 regionów działa,
-   miesięczny tick działa,
-   200 lat można zasymulować,
-   gospodarka nie tworzy dóbr z niczego,
-   firmy podejmują autonomiczne decyzje,
-   ceny reagują,
-   handel działa,
-   transport ma znaczenie,
-   ludność konsumuje,
-   potrzeby działają,
-   zatrudnienie i płace działają,
-   migracja działa,
-   osady rosną/kurczą się,
-   zasoby się wyczerpują,
-   odkrycia technologiczne działają,
-   Production Methods są adoptowane ekonomicznie,
-   interwencje Architekta działają,
-   SimulationFacts powstają,
-   WHY? potrafi wyjaśnić kluczowe zmiany,
-   Chronicle pokazuje ważne wydarzenia,
-   save/load jest deterministyczny,
-   benchmark Black Mountain nie wymaga skryptowanej historii.

------------------------------------------------------------------------

# 68. Kryteria jakościowe

VS jest **projektowo udany**, jeśli obserwator może powiedzieć:

> „Rozumiem, dlaczego ten region urósł."

> „Widzę, że moja interwencja uruchomiła łańcuch konsekwencji, ale nie
> kontrolowałem jego każdego kroku."

> „Ten sam świat bez mojej interwencji potoczył się inaczej."

> „Historia wygląda jak rezultat systemu, a nie lista losowych eventów."

> „Kryzys ma przyczynę, a nie został po prostu wylosowany."

------------------------------------------------------------------------

# 69. Czego NIE robić przed ukończeniem VS

Nie rozszerzać priorytetowo: - pełnej geopolityki, - wojny, - setek
technologii, - wszystkich 38 zasobów w runtime, - wszystkich 64 dóbr w
runtime, - wszystkich 28 archetypów firm, - nowoczesnej gospodarki, -
zaawansowanej grafiki mapy, - rozbudowanych postaci, - narracji
generowanej bez faktów, - multiplayera, - modding UI.

Pełne katalogi już istnieją jako fundament danych. VS aktywuje tylko
podzbiór potrzebny do udowodnienia silnika.

------------------------------------------------------------------------

# 70. Kolejność implementacji VS

## Etap VS-01 --- Core

-   ID
-   World
-   Region
-   Connection
-   tick
-   RNG
-   validation
-   save skeleton

## VS-02 --- Resources

-   deposits
-   discovery state
-   depletion
-   environment basics

## VS-03 --- Population

-   cohorts
-   demographics
-   skills
-   classes
-   needs skeleton

## VS-04 --- Economy Core

-   goods
-   inventory
-   companies
-   production methods
-   production

## VS-05 --- Markets

-   demand
-   prices
-   consumption
-   shortages

## VS-06 --- Labor

-   employment
-   wages
-   household income

## VS-07 --- Trade & Transport

-   routes
-   Effective Distance
-   capacity
-   imported cost

## VS-08 --- Migration & Settlements

-   attraction
-   migration
-   housing
-   settlement stages

## VS-09 --- Technology

-   knowledge
-   discovery eligibility
-   breakthroughs
-   availability
-   adoption

## VS-10 --- Architect

-   Influence
-   interventions
-   experiment branches

## VS-11 --- Causality

-   facts
-   causal edges
-   WHY?
-   Butterfly Effect

## VS-12 --- Chronicle

-   significance
-   entries
-   sensitivity

## VS-13 --- UI

-   Command Center
-   Atlas
-   Region
-   Market
-   Technology
-   Chronicle
-   WHY?
-   Intervention Panel

## VS-14 --- Testing & Tuning

-   Black Mountain
-   Food Valley
-   Isolation
-   Resource Shock
-   Technology Divergence
-   determinism
-   performance
-   stability.

------------------------------------------------------------------------

# 71. Definition of Done dla pojedynczego systemu

System jest gotowy dopiero, gdy:

1.  ma Definition Data,
2.  ma World State,
3.  działa w tick pipeline,
4.  ma walidację,
5.  emituje istotne SimulationFacts,
6.  jest deterministyczny,
7.  posiada test jednostkowy/systemowy,
8.  można go podejrzeć w debug view,
9.  jego wpływ jest widoczny w co najmniej jednym scenariuszu,
10. nie wymaga ręcznej korekty świata.

------------------------------------------------------------------------

# 72. Konfiguracja referencyjna VS

``` yaml
verticalSlice:
  regions: 32
  continents: 1
  startingPopulationScale: 200
  tick: MONTH
  targetYears: 200

  content:
    resources: 12
    goods: 20
    companyArchetypes: 17
    discoveries: 20-30
    coreKnowledgeDomains: 5

  systems:
    states: false
    warfare: false
    diplomacy: false
    advancedFinance: false
    advancedCharacters: false

    resources: true
    economy: true
    trade: true
    population: true
    migration: true
    settlements: true
    technology: true
    architect: true
    causality: true
    chronicle: true

  simulationSpeeds:
    - 1
    - 2
    - 4
    - 10
    - 100
```

------------------------------------------------------------------------

# 73. Ryzyka Vertical Slice

## R1 --- gospodarka oscyluje

Mitigacja: - smoothing, - inventory buffers, - capped price change, -
wolniejsze oczekiwania firm.

## R2 --- wszystkie regiony rozwijają się podobnie

Mitigacja: - geografia, - zasoby, - Effective Distance, - wiedza, - path
dependence.

## R3 --- zbyt szybka migracja

Mitigacja: - koszty dystansu, - housing, - probabilistyczna migracja, -
opóźnienie reakcji.

## R4 --- eksplozja liczby firm

Mitigacja: - capital requirement, - competition, - minimum scale, -
startup threshold.

## R5 --- Chronicle zalewa gracza

Mitigacja: - Historical Significance, - hierarchical memory, -
sensitivity.

## R6 --- WHY? pokazuje przypadkowe korelacje

Mitigacja: - fakty emitowane w momencie mutacji, - jawne source facts, -
confidence, - causal pruning.

## R7 --- symulacja jest poprawna, ale nudna

Mitigacja: - scenariusze z napięciami, - różnorodne zasoby, -
ograniczenia, - trade-offs, - Chronicle i Butterfly Effect.

------------------------------------------------------------------------

# 74. Zakres contentu vs zakres silnika

Kluczowa zasada:

> **Silnik VS ma być zdolny obsłużyć pełny model, ale aktywny content VS
> pozostaje ograniczony.**

Przykład: - Resource system nie powinien być napisany tylko dla Iron Ore
i Coal. - Good system nie powinien znać tylko 20 dóbr. - Company system
nie powinien mieć `if Mine`. - Technology system nie powinien być
napisany tylko pod 25 odkryć.

Dzięki temu późniejsze dodanie pozostałych dóbr, zasobów, firm i
technologii jest rozszerzeniem danych.

------------------------------------------------------------------------

# 75. Bramka do MVP

Nie przechodzimy do szerokiego MVP, dopóki:

1.  Black Mountain nie działa emergentnie,
2.  WHY? nie daje sensownych odpowiedzi,
3.  determinism test nie przechodzi,
4.  save/load nie przechodzi,
5.  200-letni benchmark jest stabilny,
6.  gospodarka nie generuje phantom goods/money/workers,
7.  migracja i osadnictwo reagują logicznie,
8.  co najmniej trzy różne seedy generują wyraźnie odmienne historie,
9.  interwencja Architekta tworzy mierzalny Butterfly Effect,
10. debug tools pozwalają znaleźć przyczynę błędu.

------------------------------------------------------------------------

# 76. Następne dokumenty po Vertical Slice Spec

Aktualizacja 2026-09-16: rekomendowane specyfikacje już istnieją:

1. `FIRST-CAUSE-Causality-Engine-Spec-v0.1.md`
2. `FIRST-CAUSE-AI-Decision-Model-v0.1.md`
3. `FIRST-CAUSE-Simulation-Test-Spec-v0.1.md`
4. `FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1.md`
5. `FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md`
6. `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md` (łącznie z wydajnością).

Następnym etapem jest M1 według roadmapy v0.2. Budżety wydajności
pozostają do ustalenia pomiarami; aktualne braki źródeł rejestruje
Canonical Decisions §199. Causal hooks powstają wraz z systemami,
bez czekania na pełną integrację Causality w M17.


------------------------------------------------------------------------

# 77. Ustalenia kanoniczne v0.1

-   VS = 24--40 regionów; referencyjnie 32.
-   1 kontynent.
-   miesięczny tick.
-   około 200 jednostek populacji startowej w konfiguracji VS.
-   200 lat / 2400 ticków jako główny benchmark.
-   12 zasobów w konfiguracji referencyjnej.
-   20 dóbr obsługiwanych w VS.
-   do 17 aktywnych archetypów firm.
-   około 20--30 odkryć.
-   5 głównych aktywnych Knowledge Domains.
-   około 5 podstawowych interwencji Architekta.
-   regionalne rynki.
-   fizyczny inventory.
-   Effective Distance.
-   autonomiczne firmy.
-   kohortowa populacja.
-   migracja.
-   organiczne osady.
-   resource depletion.
-   Discovery → Availability → Adoption.
-   Simulation Facts.
-   Causal Edges.
-   WHY?.
-   Butterfly Effect.
-   Chronicle.
-   seeded deterministic RNG.
-   save/load determinism.
-   państwa i wojna poza podstawowym VS.
-   Black Mountain jest głównym scenariuszem referencyjnym.
-   historia Black Mountain nie może być skryptowana.

------------------------------------------------------------------------

# 78. Kryterium końcowe

Vertical Slice FIRST CAUSE jest gotowy nie wtedy, gdy posiada dużo
contentu, lecz wtedy, gdy potrafi wiarygodnie wykonać następujący
eksperyment:

> **Tworzę świat. Zmieniam jeden warunek. Uruchamiam czas. Świat sam
> reaguje. Po dziesięcioleciach widzę konsekwencje, których nie
> wybierałem ręcznie. Mogę prześledzić ich przyczyny aż do pierwotnych
> warunków i własnej interwencji.**

Jeśli to działa, działa fundamentalna obietnica FIRST CAUSE:

> **Gracz tworzy przyczynę. Symulacja tworzy konsekwencje.**

**KONIEC --- FIRST CAUSE Vertical Slice Spec v0.1**
