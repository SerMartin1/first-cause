# FIRST CAUSE — Koncepcja gry i architektura v0.6

> **Status:** dokument koncepcyjno-architektoniczny — decyzje projektowe
> v0.6 zatwierdzone  
> **Platforma:** PC / Steam  
> **Forma:** tekstowo-danych sandbox / symulator świata  
> **Tryb:** single-player, offline  
> **Robocze hasło:** **Create the cause. Watch the consequences.**

------------------------------------------------------------------------

## 1. High Concept

**FIRST CAUSE** to tekstowa gra symulacyjna, w której gracz nie zarządza
bezpośrednio miastem, państwem ani mieszkańcami. Jest **Architektem
Świata**: tworzy warunki początkowe, uruchamia autonomiczną symulację i
może później ingerować w wybrane elementy świata.

Świat sam tworzy osady, miasta, firmy, kopalnie, drogi, gospodarkę,
migracje, kultury, państwa, konflikty i epoki historyczne. Rolą gracza
jest obserwowanie, analizowanie przyczyn oraz przeprowadzanie
eksperymentów.

Główna zasada projektowa:

> **Gracz tworzy przyczynę. Symulacja tworzy konsekwencje.**

Przykład:

`gracz dodaje złoże żelaza → mieszkańcy je odkrywają → przedsiębiorca zakłada kopalnię → powstają miejsca pracy → migracja → rośnie osada → rozwija się handel → powstaje miasto → miasto wpływa na region → po wielu latach może powstać państwo`

Gracz nie wybiera wyniku tego procesu.

------------------------------------------------------------------------

## 2. Filary projektu

### 2.1. Autonomiczny świat

Świat musi rozwijać się również wtedy, gdy gracz przez dziesiątki lat
nie wykonuje żadnej interwencji.

### 2.2. Emergentna historia

Najważniejsze historie nie są skryptowane. Powstają z interakcji
populacji, geografii, zasobów, gospodarki, technologii i polityki.

### 2.3. Czytelna przyczynowość

Gracz powinien móc zapytać **„dlaczego?”** o istotną zmianę i otrzymać
zrozumiały łańcuch przyczyn.

### 2.4. Eksperyment

Gracz może zmieniać pojedyncze warunki i sprawdzać ich długoterminowe
skutki.

### 2.5. Historia zamiast samych statystyk

Dane mają tworzyć opowieść. Miasto nie jest tylko `Population: 24 812`;
posiada historię powstania, okres prosperity, kryzysy i związane z nim
postacie.

### 2.6. Brak mikrozarządzania

Gracz nie stawia pojedynczych domów, kopalń, sklepów czy dróg i nie
wydaje mieszkańcom rozkazów zawodowych.

------------------------------------------------------------------------

## 3. Fantazja gracza

Gracz ma czuć się jak połączenie:

- architekta świata,
- obserwatora historii,
- badacza systemów,
- eksperymentatora,
- kronikarza alternatywnej cywilizacji.

Podstawowe pytanie podczas gry:

> **„Co się stanie, jeśli...?”**

------------------------------------------------------------------------

# CZĘŚĆ I — TWORZENIE ŚWIATA

## 4. Kreator świata

Kreator powinien posiadać dwa poziomy:

### Quick World

Kilka presetów i najważniejsze ustawienia. Przykłady: Balanced World,
Resource Rich, Harsh World, Fragmented Continent, Fertile Paradise,
Survival World.

### Advanced World

Pełna kontrola parametrów początkowych.

------------------------------------------------------------------------

## 5. Geografia

Gracz ustala m.in.:

- wielkość świata,
- liczbę regionów,
- udział lądu i wody,
- liczbę kontynentów,
- góry,
- równiny,
- pustynie,
- lasy,
- rzeki,
- jeziora,
- wybrzeża,
- naturalne bariery komunikacyjne,
- żyzność terenu,
- dostępność wody.

Mapa nie musi być klasyczną mapą 3D. Podstawową jednostką symulacji jest
**Region** połączony z sąsiednimi regionami.

### 5.1. Reprezentacja świata — Wariant C „Living Atlas / World Network” (zatwierdzony)

FIRST CAUSE jest grą **text-first**, w której główną reprezentacją
świata nie jest klasyczna mapa geograficzna, lecz **Living Atlas / World
Network**: hierarchia obiektów, graf relacji, dane, kronika i widoki
przyczynowości.

Geografia nadal istnieje w silniku symulacji. Regiony posiadają
sąsiedztwo, teren, klimat, wodę, bariery, zasoby, dystanse i
infrastrukturę. Gracz poznaje te zależności przede wszystkim przez sieć
połączeń, Inspector, World Pulse, Chronicle i Causality View.

Zasada UI:

> **Świat jest siecią miejsc, ludzi, gospodarek i konsekwencji — nie
> planszą do podbijania.**

Docelowy balans prezentacji: około **70% tekst / dane / kronika /
analityka** oraz **30% abstrakcyjne wizualizacje sieciowe**.

Klasyczny Map View nie jest elementem podstawowego MVP. Może zostać
rozważony później jako opcjonalna funkcja.

### 5.2. Skala świata — wariant C, zatwierdzony

- Vertical Slice: **24–40 regionów**; referencyjnie 32.
- Small World: **około 250 regionów**.
- Standard World: **około 600 regionów**.
- Large World: **około 1 200 regionów**.
- Huge World: **około 2 000 regionów**.
- Architecture Target / Maximum: **do 3 000 regionów**.

**3 000 regionów jest celem architektonicznym, a nie gwarantowanym
limitem wersji premierowej.** Finalny oficjalnie wspierany maksymalny
rozmiar świata zostanie ustalony na podstawie benchmarków wydajności,
pamięci, save/load i stabilności długiej symulacji.

Architektura nie może zakładać twardego limitu 500, 800 ani 1000
regionów. Region pozostaje podstawową jednostką obliczeniową i
polityczno-gospodarczą.

Liczba regionów nie określa liczby państw. Państwa powstają emergentnie
jako zbiory regionów; małe państwo może kontrolować kilka regionów, a
duże państwo lub imperium dziesiątki albo ponad sto.

------------------------------------------------------------------------

## 6. Klimat i środowisko

Parametry początkowe:

- średnia temperatura,
- opady,
- sezonowość,
- zmienność klimatu,
- częstotliwość susz,
- częstotliwość powodzi,
- regeneracja lasów,
- żyzność gleby,
- dostępność dzikiej żywności,
- odporność środowiska na eksploatację.

------------------------------------------------------------------------

## 7. Surowce — model docelowy (wariant B, zatwierdzony)

Docelowo świat powinien obsługiwać około **35–40 surowców**. Nie
wszystkie są użyteczne od początku: część może istnieć jako nieodkryte
złoża przez setki lat, zanim rozwój wiedzy i gospodarki nada im
znaczenie.

### Żywność i zasoby biologiczne

- zboża,
- warzywa i rośliny jadalne,
- owoce,
- ryby,
- zwierzyna,
- mięso/hodowla,
- drewno,
- bawełna,
- wełna,
- kauczuk.

### Budownictwo i surowce naturalne

- kamień,
- glina,
- piasek,
- sól,
- wapień.

### Metale podstawowe i szlachetne

- żelazo,
- miedź,
- cyna,
- ołów,
- złoto,
- srebro,
- boksyt/aluminium.

### Energia i industrializacja

- węgiel,
- ropa,
- gaz ziemny.

### Surowce przemysłowe i strategiczne

- siarka,
- fosforyty,
- nikiel,
- lit,
- uran,
- metale ziem rzadkich,
- dodatkowe minerały przemysłowe zależnie od finalnej listy dóbr.

Każde złoże posiada co najmniej: `quantity`, `quality`, `accessibility`,
`discoveryState`, `extractionDifficulty`, `renewability`,
`technologyRequirements` i `environmentalCost`.

Surowce mogą być jawne, nieodkryte, odnawialne lub nieodnawialne. Zasób
nie oznacza automatycznie produkcji. Musi zostać odkryty, istnieć
odpowiednia wiedza, praca, kapitał, transport i ekonomiczny sens
eksploatacji.

------------------------------------------------------------------------

## 8. Pierwsze społeczności

Gracz ustala:

- liczbę społeczności,
- liczebność każdej grupy,
- miejsce startowe,
- podstawową wiedzę,
- cechy kulturowe/społeczne.

Przykładowe parametry grupy:

- współpraca,
- agresywność,
- przedsiębiorczość,
- ciekawość/innowacyjność,
- mobilność/migracja,
- tolerancja obcych,
- skłonność do handlu,
- skłonność do centralizacji,
- podejście do ryzyka.

Parametry mają wpływać na prawdopodobieństwa zachowań, ale nie
determinować wyniku.

------------------------------------------------------------------------

## 9. Poziom wiedzy początkowej

Możliwe elementy:

- rolnictwo,
- hodowla,
- podstawowe narzędzia,
- budownictwo,
- metalurgia,
- pismo,
- handel,
- żegluga.

Domyślnie świat rozpoczyna się na bardzo wczesnym poziomie rozwoju.

------------------------------------------------------------------------

## 10. Prawa świata

Przed startem można ustalić m.in.:

- starzenie i śmiertelność,
- tempo przyrostu populacji,
- wyczerpywanie zasobów,
- możliwość wojen,
- epidemie,
- katastrofy naturalne,
- tempo rozprzestrzeniania wiedzy,
- tempo zmian kulturowych,
- mobilność populacji.

Docelowo możliwy jest zaawansowany **World Rules Editor**.

------------------------------------------------------------------------

# CZĘŚĆ II — AUTONOMICZNA SYMULACJA

## 11. Hierarchia świata

Proponowana hierarchia:

`WORLD → CONTINENT → REGION → SETTLEMENT/CITY → ORGANIZATION → POPULATION / CHARACTER`

Równolegle:

`CULTURE → NATION/STATE → RELATIONS`

oraz:

`RESOURCE → PRODUCTION → GOODS → TRADE → CONSUMPTION`

------------------------------------------------------------------------

## 12. Region

Region przechowuje m.in.:

- geografię,
- klimat,
- zasoby,
- populację,
- osady,
- produkcję,
- konsumpcję,
- dostępność transportową,
- bezpieczeństwo,
- przynależność polityczną,
- kulturę dominującą,
- presję migracyjną,
- stan środowiska.

Region powinien być główną jednostką obliczeniową świata.

------------------------------------------------------------------------

## 13. Populacja

Populacja jest symulowana przede wszystkim jako **Population Cohorts**,
a nie jako miliony indywidualnych osób.

### 13.1. Population Cohorts

Kohorta może być definiowana przez region, wiek, zawód, kulturę, klasę
ekonomiczną i inne cechy potrzebne do symulacji. Przechowuje co
najmniej:

- `population`,
- `averageIncome`,
- `averageWealth`,
- `employmentRate`,
- `consumptionLevel`,
- `savingsRate`,
- `housingCost`,
- `taxBurden`,
- `needsSatisfaction`.

### 13.2. Warstwy ekonomiczne

Podstawowe warstwy:

- `Poor`,
- `Working`,
- `Middle`,
- `Wealthy`,
- `Elite`.

Zmiana warstwy nie następuje po jednym dobrym lub złym miesiącu. Powinna
wynikać z długotrwałych zmian dochodu, majątku, oszczędności,
stabilności zatrudnienia i kosztów życia.

Region może posiadać **Economic Mobility Score**, zależny m.in. od
edukacji, płac, bezrobocia, kosztów mieszkań, podatków, nierówności i
stabilności.

### 13.3. Historical Characters

Tylko wybrane osoby otrzymują pełną tożsamość: odkrywcy, przedsiębiorcy,
wynalazcy, przywódcy, generałowie, reformatorzy, założyciele miast i
inni aktorzy o znaczącym wpływie.

------------------------------------------------------------------------

## 14. Potrzeby populacji

Potrzeby tworzą popyt i presję społeczną. Proponowany model
pięciopoziomowy:

1.  **Survival** — żywność, woda, schronienie.
2.  **Basic** — ubrania, opał, podstawowe narzędzia.
3.  **Comfort** — lepsza żywność, meble, transport.
4.  **Prosperity** — dobra luksusowe, rozrywka, edukacja.
5.  **Modern** — energia, komunikacja, zaawansowane usługi.

Dochód rozporządzalny kohorty:

`Disposable Income = Wages + Transfers + Property Income - Taxes - Essential Spending`

Wydatki są priorytetyzowane mniej więcej w kolejności:

`Food → Housing → Clothing → Energy → Basic Goods → Services → Comfort Goods → Luxury → Savings`

Bogacenie się społeczeństwa zmienia strukturę popytu, co samo napędza
transformację gospodarczą.

------------------------------------------------------------------------

## 15. Osady i miasta — organiczny Settlement Pressure (zatwierdzone)

Gracz nie zakłada miast bezpośrednio. Koncentracja ludności powstaje w
wyniku **Settlement Pressure**.

`Settlement Pressure = food + jobs + trade + water + safety + accessibility + infrastructure - disease - costs - environmental risk - conflict risk`

Źródła osadnictwa: żyzna ziemia, port, skrzyżowanie szlaków, kopalnia,
strategiczne położenie, administracja, przemysł i handel.

Cykl:

`aktywność ekonomiczna → miejsca pracy → migracja → popyt → nowe aktywności → infrastruktura → koncentracja ludności → rozwój osady`

Stadia: `camp → hamlet → village → town → city → metropolis`.

Awans wymaga nie tylko populacji, ale też funkcji miejskich: rynku,
zróżnicowania branż, trwałej zabudowy, infrastruktury i połączeń
handlowych. Miasta mogą się specjalizować, transformować, stagnować lub
upadać po utracie ekonomicznej podstawy.

------------------------------------------------------------------------

## 16. Firmy, właściciele i kapitał — model docelowy

Firmy powstają autonomicznie, gdy świat generuje realną okazję
gospodarczą.

### 16.1. Company Lifecycle

`opportunity detected → entrepreneur → capital → company founded → hire workers → production → profit/loss → investment → expansion OR bankruptcy`

Potencjalna firma analizuje m.in. ceny, niedobory, zasoby, pracowników,
technologię, transport i dostęp do rynku.

### 16.2. Poziomy szczegółowości

1.  **Local Business** — agregowane małe działalności.
2.  **Company** — indywidualnie symulowana firma.
3.  **Major Company** — historycznie istotna firma śledzona szczegółowo
    i obecna w Chronicle.

Firma może przechowywać: nazwę, rok założenia, założyciela,
właścicieli/udziały, kapitał, gotówkę, dług, aktywa, zakłady,
pracowników, przychody, koszty, zysk/stratę, udział w rynku, branżę,
regiony działalności i historię własności.

### 16.3. Archetypy firm

Docelowo około 20–30 podstawowych archetypów, m.in.:

Farm, Livestock Farm, Fishing Company, Forestry Company, Mine, Quarry,
Mill, Textile Workshop, Smelter, Steelworks, Food Processor, Furniture
Workshop, Construction Company, Transport Company, Trading Company,
Machinery Factory, Chemical Plant, Fuel Refinery, Electric Equipment
Factory, Bank, Retail Company, Services Company.

### 16.4. Production Methods

Technologia nie powinna sprowadzać się do płaskiego `+15% produkcji`.
Powinna otwierać nowe **Production Methods**.

Przykład farmy:

- Manual Farming — dużo pracy, niska wydajność,
- Animal-Powered Farming — średnia praca, średnia wydajność,
- Mechanized Farming — mniej pracy, maszyny i paliwo, wysoka wydajność,
- Industrial Agriculture — maszyny, nawozy, energia, bardzo wysoka
  wydajność.

Firma sama wybiera metodę na podstawie rentowności i dostępności wejść.
Nowa metoda może być znana, ale ekonomicznie nieopłacalna.

------------------------------------------------------------------------

## 17. Gospodarka, pieniądz i dobra — model docelowy

Docelowa gospodarka ma średnią głębokość i około **50–70 dóbr**.

Łańcuch:

`RESOURCE → EXTRACTION → PROCESSING → INTERMEDIATE GOODS → FINAL GOODS → TRANSPORT → MARKET → CONSUMPTION`

### 17.1. Zasoby — lista bazowa ~38

**Żywność / rolnictwo:** Grain, Rice, Maize, Potatoes, Fruit,
Vegetables, Livestock, Fish.  
**Organiczne:** Timber, Cotton, Wool, Flax, Rubber, Leather.  
**Budowlane:** Stone, Clay, Sand, Limestone, Marble.  
**Metale podstawowe:** Iron Ore, Copper Ore, Tin, Lead, Zinc, Bauxite.  
**Wartościowe:** Gold, Silver.  
**Energetyczne:** Coal, Oil, Natural Gas, Uranium.  
**Przemysłowe/strategiczne:** Sulfur, Salt, Phosphate, Nickel, Lithium,
Rare Earths, Graphite.

Lista jest bazą do strojenia; finalnie należy zachować zakres około
35–40 zasobów.

### 17.2. Dobra

Przykładowe łańcuchy i dobra:

- Grain → Flour → Bread,
- Timber → Lumber → Furniture,
- Clay → Bricks,
- Limestone → Cement,
- Iron Ore → Iron,
- Iron + Coal → Steel,
- Tools, Clothing, Glass, Paper, Pottery, Soap,
- Steel → Machinery,
- Copper + Rubber → Electrical Equipment,
- Oil → Fuel / Chemicals,
- Chemicals → Fertilizer,
- Rubber → Tires,
- Carts, Ships, Rail Equipment, Automobiles,
- Electronics, Telecommunications Equipment, Pharmaceuticals, Advanced
  Machinery.

Nie wszystkie dobra są aktywne od początku; ich znaczenie pojawia się
wraz z wiedzą, technologią i strukturą popytu.

### 17.3. Rynki regionalne

FIRST CAUSE używa **rynków regionalnych połączonych handlem**, nie
jednego globalnego rynku.

Każdy region przechowuje dla dobra co najmniej:

`Supply`, `Demand`, `Inventory`, `LocalPrice`, `ImportDemand`,
`ExportSupply`.

Proponowany kierunek zmiany ceny:

`PriceChange = Sensitivity × ((Demand - Supply) / NormalSupply)`

`NewPrice = OldPrice × (1 + PriceChange)`

Zmiana miesięczna powinna być ograniczona, aby uniknąć nierealnych
oscylacji.

### 17.4. Koszt produkcji

`Production Cost = Inputs + Wages + Energy + Transport + Taxes + Maintenance`

Jeśli `Market Price < Production Cost` przez dłuższy okres, firma
ogranicza produkcję, zmienia metodę albo bankrutuje.

### 17.5. Handel

Import staje się opłacalny, gdy:

`Foreign Price + Transport Cost + Tariff < Local Price`

Handel powinien zmniejszać różnice cenowe, ale jednocześnie wpływać na
ceny także w regionie eksportującym.

### 17.6. Niedobory

Proponowana skala `Shortage Severity`:

- 0–10 Normal,
- 10–25 Tight Supply,
- 25–50 Shortage,
- 50–75 Severe Shortage,
- 75+ Crisis.

Wysokie poziomy niedoboru mogą generować wydarzenia Chronicle i
uruchamiać migracje, kryzysy polityczne lub zmianę inwestycji firm.

------------------------------------------------------------------------

## 18. Handel, transport i odległość bez klasycznej mapy

Transport opiera się na **grafie regionów**. Region jest węzłem, a
połączenie z innym regionem jest krawędzią.

Każda krawędź może przechowywać:

- `distance`,
- `terrainDifficulty`,
- `transportInfrastructure`,
- `borderCost`,
- `securityRisk`,
- `seasonality`,
- `capacity`.

### 18.1. Effective Distance

`Effective Distance = Physical Distance × Terrain Modifier × Infrastructure Modifier × Border Modifier × Security Modifier`

120 km przez góry bez drogi może być ekonomicznie „dalsze” niż 400 km
koleją.

### 18.2. Transport Cost

`Transport Cost = Effective Distance × Weight × TransportModeCost`

Tryby mogą ewoluować technologicznie:

`Foot / Pack Animals → Cart → River Transport → Sailing → Railway → Motor Transport → Modern Shipping`

### 18.3. Capacity i Infrastructure Pressure

Trasa może być przeciążona. Gdy `Trade Demand > Route Capacity`,
transport drożeje i rośnie presja na inwestycje.

`Trade ↑ → Route Usage ↑ → Infrastructure Pressure ↑ → Investment ↑ → Better Route → Transport Cost ↓ → Trade ↑`

Living Atlas prezentuje te relacje jako sieć; grubość połączeń może
reprezentować rzeczywisty przepływ handlowy, migracyjny lub logistyczny.

------------------------------------------------------------------------

## 19. Technologia i wiedza — Discovery Engine

FIRST CAUSE nie ma klasycznego drzewa technologii sterowanego przez
gracza.

### 19.1. Knowledge Domains

Przykładowe dziedziny:

- Agriculture,
- Construction,
- Metallurgy,
- Mining,
- Navigation,
- Medicine,
- Mathematics,
- Mechanics,
- Chemistry,
- Energy,
- Transportation,
- Communication,
- Administration.

Każda społeczność lub państwo może posiadać poziom wiedzy w domenach.

### 19.2. Odkrycia

Technologia pojawia się, gdy świat spełnia warunki. Przykładowo Steam
Engine może wymagać odpowiednich poziomów Mechanics i Metallurgy,
dostępu do węgla, jakości narzędzi i koncentracji przemysłowej.

Po spełnieniu warunków pojawia się prawdopodobieństwo odkrycia
zwiększane przez edukację, specjalistów, konkurencję gospodarczą, wojnę,
koncentrację firm i handel z bardziej rozwiniętymi ośrodkami.

Gracz nie powinien widzieć pełnej matematyki odkrycia; UI może
komunikować jedynie jakościowe sygnały typu `Conditions: promising`.

### 19.3. Dyfuzja technologii

Odkrycie jest wydarzeniem, ale adopcja to proces. Wiedza rozprzestrzenia
się przez handel, migrację, edukację, kopiowanie, szpiegostwo, wojny,
inwestycje zagraniczne i powiązania kulturowe.

Należy rozdzielać:

- `Technology Available`,
- `Technology Adoption`.

Państwo może znać elektryczność, ale tylko część gospodarki może realnie
z niej korzystać.

### 19.4. Sufit technologiczny

Technologia dochodzi maksymalnie do poziomu współczesnego. Po
osiągnięciu sufitu świat nadal zmienia się społecznie, gospodarczo,
politycznie, kulturowo i środowiskowo.

------------------------------------------------------------------------

## 19.5. Energia — system przekrojowy

Energia nie jest liniowym `wood → coal → oil → electricity`; źródła
nakładają się i konkurują.

### Etap biomasy

Wood, charcoal, animal power, human labor.

### Era węgla

Coal umożliwia steam power, mechanized mining, heavy industry, railways
i steel.

### Era ropy i gazu

Oil wspiera paliwa, transport motorowy, chemię, tworzywa i mechanizację
rolnictwa. Natural Gas zasila ogrzewanie, przemysł i energetykę.

### Elektryczność

Elektryczność jest dobrem wytwarzanym przez infrastrukturę, np.:

`Coal / Gas / Hydro / Oil / Nuclear → Power Plant → Electricity`

Region przechowuje co najmniej:

`Electricity Supply`, `Electricity Demand`, `Grid Capacity`,
`Generation Mix`.

Niedobór energii wpływa na produkcję przemysłową, usługi i jakość życia.
Rozwój wiedzy może wyprzedzać rozwój sieci i realną adopcję technologii.

------------------------------------------------------------------------

## 19.6. Podatki i budżet państwa

Państwa posiadają uproszczony, ale realny budżet.

Główne dochody:

- Income Tax,
- Business Tax,
- Trade Tariffs,
- Resource Revenue.

Główne wydatki:

- Administration,
- Infrastructure,
- Military,
- Education,
- Health,
- Public Order,
- Social Support,
- Debt Service.

`State Balance = Revenue - Expenses`

Deficyt może prowadzić do długu, a dług do rosnących kosztów obsługi i
presji na podatki lub ograniczenie wydatków.

Gracz nie ustawia podatków bezpośrednio. Politykę fiskalną wybiera AI
państwa na podstawie sytuacji gospodarczej, wojny, ustroju, kryzysów i
potrzeb infrastrukturalnych.

------------------------------------------------------------------------

## 20. Kultury, państwa i granice — zatwierdzone

### 20.1. Kultura

Kultura nie jest statyczną etykietą. Każda kultura posiada zmienne cechy
(Traits), np. mercantile, agrarian, militaristic, maritime, traditional,
innovative, communal, individualistic, expansionist czy tolerant.

Cechy zmieniają się pod wpływem faktycznej historii. Wielowiekowy handel
morski może zwiększać `Maritime` i `Mercantile`, a długie okresy
konfliktów — `Militaristic`. Kultury mogą się dzielić, mieszać,
asymilować, tworzyć kultury hybrydowe i zanikać.

### 20.2. Powstawanie państw

Państwo powstaje emergentnie, gdy kilka osad/regionów tworzy trwałą
wspólną strukturę władzy. Może to wynikać z federacji, podboju,
dominacji największego miasta, wspólnego zagrożenia, dynastii, silnej
sieci handlowej lub wspólnej tożsamości kulturowej.

### 20.3. Granice — Influence Territory

Granice wynikają z konkurujących pól wpływu politycznego. Ośrodki
państwa generują `Political Influence`, który słabnie wraz z odległością
i barierami. Na siłę wpływu oddziałują populacja, administracja, wojsko,
drogi, handel, kultura, geografia i odległość od centrum.

Region może zmienić kontrolę, jeżeli wpływ konkurenta trwale przewyższa
wpływ dotychczasowego państwa albo nastąpi podbój, secesja, unia czy
rozpad. Dzięki temu granice są skutkiem procesów, a nie ręcznie
wyznaczoną planszą.

### 20.4. Wojny — strategiczna symulacja regionowa (wariant B, zatwierdzony)

FIRST CAUSE symuluje wojny, ale nie staje się grą wojenną. Armie są
agregowane, a działania rozgrywają się na poziomie regionów/frontów.

Kluczowe parametry: manpower, equipment, morale, logistics, technology,
terrain, leadership, supply oraz war exhaustion. Wyniki bitew wpływają
na kontrolę regionów, populację, gospodarkę, migrację, infrastrukturę i
politykę. Chronicle zapisuje jedynie istotne starcia i kampanie.

------------------------------------------------------------------------

# CZĘŚĆ III — INTERWENCJE GRACZA

## 21. Influence — model hybrydowy (wariant C, zatwierdzony)

Interwencje kosztują ograniczony zasób **Influence**. Prototypowy cap:
**100**.

Regeneracja:

1.  powolna regeneracja czasowa — roboczo `+1 Influence / rok`,
2.  bonusy za Causal Discoveries, wejście w nową epokę, pierwsze
    wydarzenia danego typu, ukończone eksperymenty i kamienie milowe
    obserwacji.

System nie nagradza wywołania katastrofy jako takiej, tylko poznanie i
eksperyment. Koszt rośnie wraz ze skalą i stopniem nienaturalności
interwencji.

### 21.1. Robocze koszty do strojenia

- Reveal Deposit — 8,
- Improve Fertility — 12,
- Migration Pull — 15,
- Knowledge Spark — 20,
- Create Deposit — 30,
- Climate Shift — 45,
- Major Disaster — 60.

------------------------------------------------------------------------

## 22. Kategorie interwencji

Docelowo pełna gra może mieć około 25–35 interwencji, ale Vertical Slice
powinien zacząć od 5–8.

### 22.1. Environment

- **Improve Fertility** — zwiększa żyzność regionu,
- **Create Forest** — tworzy/odbudowuje zasób leśny,
- **Water Source** — poprawia dostęp do wody,
- **Climate Shift** — zmienia temperaturę/opady; kosztowna interwencja.

### 22.2. Resources

- **Reveal Deposit** — ujawnia istniejące złoże,
- **Create Deposit** — tworzy nowe złoże; droższe,
- **Enrich Deposit** — zwiększa złoże,
- **Deplete Deposit** — zmniejsza złoże.

### 22.3. Population

- **Founding Community** — dodaje społeczność,
- **Migration Pull** — czasowo zwiększa atrakcyjność regionu bez
  teleportowania ludności,
- **Population Resilience** — zmniejsza śmiertelność podczas kryzysu.

### 22.4. Knowledge

- **Knowledge Spark** — zwiększa szansę na przełom w domenie wiedzy, nie
  daje konkretnej technologii,
- **Knowledge Transfer** — pomaga przenieść wiedzę między
  społecznościami.

### 22.5. Economy

- **Trade Opportunity** — czasowo obniża koszt handlu między regionami,
- **Resource Awareness** — zwiększa zdolność gospodarki do dostrzeżenia
  potencjału sektora.

### 22.6. Events

Rzadkie narzędzia eksperymentalne: Drought, Flood, Earthquake, Great
Harvest, Disease Outbreak i podobne. Powinny być drogie i nie stanowić
podstawowej pętli gry.

Gracz wywołuje warunek, ale nie wybiera wszystkich konsekwencji.

## 22.7. Rola gracza — Architect / Observer (zatwierdzone)

Interwencje są przedstawiane jako **abstrakcyjne narzędzia
eksperymentatora/Architekta**, a nie boskie moce. Mieszkańcy świata nie
wiedzą o istnieniu gracza i nie tworzą religii wokół jego działań tylko
dlatego, że były interwencją. UI używa terminów `Intervention`,
`Architect`, `Experiment`, `Observation` i `Causal Impact`, a nie
`Divine Power`.

------------------------------------------------------------------------

# CZĘŚĆ IV — SYSTEMY WYRÓŻNIAJĄCE GRĘ

## 23. Causality Engine

Najważniejszy system FIRST CAUSE.

Silnik zapisuje zależności pomiędzy istotnymi zdarzeniami.

Przykład:

`Iron Deposit Discovered`  
`→ Blackhill Mine Founded`  
`→ +240 Jobs`  
`→ Migration Increase`  
`→ Settlement Growth`  
`→ Food Demand`  
`→ Agricultural Expansion`  
`→ Trade Route`  
`→ Blackhill becomes City`

Gracz może kliknąć **WHY?** przy ważnym wydarzeniu/statystyce.

System powinien rozróżniać:

- przyczynę bezpośrednią,
- czynniki wspierające,
- przyczyny pośrednie,
- wydarzenia wyzwalające,
- konsekwencje.

------------------------------------------------------------------------

## 24. Butterfly Effect

Każda interwencja gracza otrzymuje własny identyfikator przyczynowy.

Gra śledzi jej wpływ po 1, 10, 50, 100+ latach.

Przykładowy raport:

**Iron Deposit — Year 37**

Bezpośrednio:

- 4 kopalnie,
- 840 miejsc pracy.

Pośrednio:

- 2 miasta,
- 18 firm,
- 34 000 migracji.

Długoterminowo:

- powstanie państwa,
- zmiana głównego szlaku handlowego,
- 2 konflikty.

------------------------------------------------------------------------

## 25. Parallel Worlds — system opcjonalny / rozszerzający

Gracz może opcjonalnie stworzyć **branch** aktualnego świata. Mechanika
pozostaje ważnym kierunkiem i USP, ale nie jest warunkiem pierwszej
wersji UI/MVP.

Przykład:

`YEAR 105 → BRANCH`

- World A — brak interwencji,
- World B — nowe złoże złota,
- World C — wcześniejsza technologia.

Po symulacji można porównać:

- populację,
- gospodarkę,
- liczbę miast,
- państwa,
- konflikty,
- migrację,
- technologie,
- środowisko,
- kluczowe wydarzenia.

System powinien wskazać największe punkty rozbieżności historii.

------------------------------------------------------------------------

## 26. Experiment Mode

Tryb pozwalający szybko odpowiedzieć na pytanie:

> **What happens if...?**

Przykłady:

- jedna cywilizacja otrzymuje żelazo 200 lat wcześniej,
- cały kontynent posiada jedno złoże węgla,
- pięć kultur rozpoczyna na małym obszarze,
- pustynia otrzymuje ogromne zasoby ropy,
- dwa identyczne światy różnią się jedną rzeką.

Po zakończeniu generowany jest **Experiment Report** z najważniejszymi
różnicami, przyczynami i nieoczekiwanymi skutkami.

------------------------------------------------------------------------

## 27. World Chronicle

Kronika jest główną narracyjną reprezentacją symulacji.

Kategorie wpisów:

- powstanie osady/miasta,
- odkrycie zasobu,
- założenie ważnej firmy,
- przełom technologiczny,
- migracja,
- katastrofa,
- wojna,
- powstanie/upadek państwa,
- życie postaci historycznej,
- kryzys gospodarczy,
- zmiana epoki.

Kronika musi filtrować szum i wybierać wydarzenia istotne historycznie.

------------------------------------------------------------------------

## 28. Dynamiczne epoki

Epoki nie mają sztywnych dat.

Silnik analizuje historię i wykrywa okresy dominujących zmian.

Przykład:

- Age of Settlement,
- Iron Expansion,
- Age of Kingdoms,
- Long Stagnation,
- Great Migration,
- Industrial Expansion,
- Modern Era.

Nazwy i granice epok wynikają z faktycznych wydarzeń świata.

## 28.1. Warstwy historii w czasie — zatwierdzone

Gra powinna zmieniać rodzaj generowanych historii wraz z dojrzewaniem
świata:

- **World Year 0–100:** narodziny świata — pierwsze farmy, kopalnie,
  firmy, osady, drogi, odkrycia i lokalne postacie.
- **World Year 100–500:** narodziny cywilizacji — miasta, państwa,
  kultury, handel międzyregionalny, wojny, migracje i duże organizacje.
- **World Year 500–1000:** historie systemowe — industrializacja,
  globalizacja handlu, kryzysy, urbanizacja, wyczerpywanie zasobów,
  transformacje polityczne i wielkie konflikty.
- **World Year 1000+:** bez science-fiction; świat pozostaje na
  maksymalnie współczesnym poziomie technologii, ale nadal przechodzi
  zmiany gospodarcze, demograficzne, kulturowe, polityczne i
  środowiskowe.

Celem jest, aby późna gra nie polegała wyłącznie na większych liczbach.
Nowe historie mają wynikać ze zmiany skali zależności: od jednostek i
osad, przez państwa, po system światowy i długoterminowe konsekwencje
wcześniejszych decyzji.

------------------------------------------------------------------------

## 29. Historical Characters

Znaczące osoby stają się trwałymi elementami historii.

Dane postaci:

- imię,
- daty życia,
- pochodzenie,
- zawód/rola,
- organizacje,
- miejsca związane,
- najważniejsze decyzje,
- wpływ historyczny,
- łańcuch konsekwencji.

Postacie mają nadawać ludzką skalę wielkim procesom gospodarczym i
politycznym.

## 29.1. World Mysteries / Causal Discoveries (zatwierdzone)

Nie wszystkie zależności są od początku w pełni widoczne. Gracz może
zauważyć symptom — np. spadek populacji — zanim pozna kompletną
przyczynę. Causality View może początkowo pokazywać luki `???`.

Poprzez obserwację, porównywanie danych i analizę kolejnych zdarzeń
gracz odkrywa zależności, np.:

`Copper shortage → tool prices ↑ → farm productivity ↓ → food prices ↑ → migration`

Odkrycie nowej zależności może tworzyć **Causal Discovery**, wpis do
wiedzy gracza i bonus Influence. System ma zmienić obserwowanie świata w
aktywne poznawanie jego mechanizmów, a nie bierne czytanie raportów.

------------------------------------------------------------------------

## 30. World Rules Editor — kierunek docelowy

Zaawansowany system pozwalający zmieniać reguły symulacji.

Przykłady:

- technologia rozprzestrzenia się tylko poprzez handel,
- zasoby wyczerpują się dwukrotnie szybciej,
- migracja reaguje silniej na różnice płac,
- duże miasta szybciej degradują środowisko.

Po zmianie reguły można obserwować jej konsekwencje lub stworzyć
równoległy świat.

To potencjalnie jeden z najważniejszych systemów długoterminowej
regrywalności.

------------------------------------------------------------------------

# CZĘŚĆ V — CZAS I ZAKOŃCZENIE

## 31. Kalendarz i tick

Gra używa własnego kalendarza: **World Year 0, World Year 1...** i nie
odwzorowuje bezpośrednio historii Ziemi.

**Bazowy tick symulacji = 1 miesiąc świata.**

- 1 rok = 12 ticków,
- 100 lat = 1200 ticków,
- 500 lat = 6000 ticków,
- 1000 lat = 12 000 ticków.

Nie każdy system wykonuje pełne obliczenia co miesiąc.

Roboczy harmonogram:

- produkcja — co miesiąc,
- ceny — co miesiąc,
- zatrudnienie — co miesiąc,
- handel — co miesiąc,
- migracja — co miesiąc,
- firmy — co miesiąc,
- populacja — kwartalnie + bilans roczny,
- osady/miasta — co 6 miesięcy,
- technologia — raz w roku + event-driven,
- kultura — raz w roku,
- polityka — raz w roku + event-driven,
- Chronicle/Causality — event-driven.

------------------------------------------------------------------------

## 32. Kontrola czasu

Podstawowe sterowanie:

`PAUSE | ×1 | ×5 | ×20 | ×100`

Przy `×1` roboczo jeden miesiąc może trwać około 1–2 sekundy. Przy
wysokich prędkościach silnik nadal liczy miesiące, ale UI może odświeżać
stan rzadziej.

Dodatkowo funkcja **SIMULATE**:

- 1 rok,
- 5 lat,
- 10 lat,
- 50 lat,
- do następnego ważnego wydarzenia,
- do spełnienia określonego warunku.

Długie symulacje mogą używać batchingu i adaptacyjnej częstotliwości
prezentacji, bez zmiany logicznego wyniku świata.

## 33. Brak klasycznego Game Over

Świat może istnieć dowolnie długo po osiągnięciu współczesnego sufitu
technologicznego.

Gracz sam wybiera moment:

**CLOSE WORLD CHRONICLE**

------------------------------------------------------------------------

## 34. Podsumowanie świata

Po zamknięciu kroniki gra generuje raport historii:

- długość historii,
- końcowa populacja,
- liczba powstałych i upadłych państw,
- miasta,
- najstarsze miasto,
- największe miasto,
- najdłużej istniejące państwo,
- największe firmy,
- najważniejsze postacie,
- największe migracje,
- wojny,
- katastrofy,
- przełomy technologiczne,
- epoki.

------------------------------------------------------------------------

## 35. Architect's Legacy

Osobne podsumowanie wpływu gracza:

- liczba interwencji,
- najbardziej wpływowa interwencja,
- najbardziej destrukcyjna,
- najbardziej korzystna,
- najbardziej nieprzewidywalna,
- wydarzenia powiązane przyczynowo z interwencjami,
- udział historii zmieniony przez gracza.

Nie ma jednej klasycznej punktacji zwycięstwa.

Opcjonalne wskaźniki świata:

- Prosperity,
- Stability,
- Knowledge,
- Environment,
- Cultural Diversity,
- Quality of Life,
- Historical Complexity.

------------------------------------------------------------------------

# CZĘŚĆ VI — GAMEPLAY LOOP

## 36. Główna pętla

### 1. OBSERVE

Gracz sprawdza najważniejsze wydarzenia i trendy.

### 2. UNDERSTAND

Otwiera Causality Engine i analizuje, dlaczego zaszły zmiany.

### 3. DECIDE

Decyduje, czy pozostawić świat bez ingerencji czy przeprowadzić
eksperyment.

### 4. INTERVENE

Wydaje Influence i zmienia jeden z warunków.

### 5. SIMULATE

Przesuwa czas.

### 6. DISCOVER

Poznaje bezpośrednie i nieoczekiwane konsekwencje.

### 7. COMPARE / CONTINUE

Kontynuuje historię albo tworzy branch i porównuje alternatywne światy.

Pętla wraca do OBSERVE.

------------------------------------------------------------------------

# CZĘŚĆ VII — UI / UX

## 37. Główne zakładki

Wstępna propozycja:

1.  **WORLD** — Command Center świata
2.  **REGIONS**
3.  **CITIES**
4.  **PEOPLE**
5.  **ECONOMY**
6.  **RESOURCES**
7.  **NATIONS**
8.  **CHRONICLE**
9.  **EXPERIMENTS**

Nie każda zakładka musi istnieć w MVP.

------------------------------------------------------------------------

## 38. World Command Center

Główny ekran powinien odpowiadać na pięć pytań:

1.  **Co właśnie się wydarzyło?**
2.  **Co zmienia się najszybciej?**
3.  **Dlaczego?**
4.  **Co wymaga uwagi?**
5.  **Co zrobiłeś wcześniej i jakie były skutki?**

Proponowane sekcje:

- World Snapshot,
- Major Events,
- Emerging Trends,
- Your Last Intervention,
- Butterfly Effects,
- Rising Cities / Declining Cities,
- Nations to Watch,
- Resource Alerts,
- Chronicle Highlights,
- Time Controls.

------------------------------------------------------------------------

## 39. Filozofia wizualna

Gra może być przede wszystkim tekstowo-danych, ale nie powinna wyglądać
jak arkusz kalkulacyjny.

Priorytety:

- mocna hierarchia typografii,
- karty informacji,
- miniwykresy,
- oszczędne diagramy zależności,
- timeline,
- centralna abstrakcyjna mapa nieregularnych regionów/poligonów z
  przełączanymi warstwami,
- wyraźne trendy ↑ ↓,
- minimalna liczba ikon,
- brak „AI-looking UI”,
- spójny styl kroniki/atlasu świata.

------------------------------------------------------------------------

# CZĘŚĆ VIII — WSTĘPNA ARCHITEKTURA TECHNICZNA

## 40. Warstwy systemu

``` text
WORLD STATE
│
├── Geography System
├── Climate & Environment System
├── Resource System
├── Population System
├── Settlement System
├── Economy System
├── Organization/Company System
├── Trade & Transport System
├── Knowledge/Technology System
├── Culture System
├── Nation/Politics System
├── Conflict System
│
├── Event Bus
│   ├── simulation events
│   ├── historical events
│   └── player interventions
│
├── Causality Engine
├── Chronicle Engine
├── Era Detection Engine
├── Historical Character Engine
├── Experiment / Branch Engine
│
└── Presentation Layer
    ├── Command Center
    ├── Entity Views
    ├── Chronicle
    ├── Causality View
    └── Comparison View
```

------------------------------------------------------------------------

## 41. Tick symulacji i kolejność systemów

Bazowy tick to **1 miesiąc**. Pipeline powinien być deterministyczny i
możliwy do testowania.

Proponowana kolejność P0:

1.  aktualizacja środowiska i dostępności zasobów,
2.  produkcja i zużycie energii,
3.  produkcja dóbr,
4.  aktualizacja zapasów,
5.  popyt konsumencki,
6.  ceny regionalne,
7.  handel i przepływy transportowe,
8.  wynik finansowy firm,
9.  zatrudnienie / zwolnienia / płace,
10. potrzeby kohort i oszczędności,
11. migracja,
12. Settlement Pressure i miasta,
13. inwestycje firm i infrastruktury,
14. wydarzenia polityczne/technologiczne zależnie od harmonogramu,
15. Causality / Chronicle / Importance Scoring,
16. snapshoty zgodnie z polityką historii.

Kolejność musi zostać zweryfikowana testami, aby uniknąć błędnych pętli
zależności w jednym ticku.

## 42. Event Bus

Systemy nie powinny być silnie połączone bezpośrednio.

Przykładowe eventy:

``` text
RESOURCE_DISCOVERED
COMPANY_FOUNDED
COMPANY_CLOSED
SETTLEMENT_FOUNDED
CITY_STATUS_REACHED
MIGRATION_WAVE
TRADE_ROUTE_CREATED
TECH_DISCOVERED
STATE_FOUNDED
STATE_COLLAPSED
WAR_STARTED
WAR_ENDED
DISASTER_OCCURRED
PLAYER_INTERVENTION
```

Każdy event może zawierać:

``` text
id
time
type
sourceEntityId
targetEntityIds
regionId
magnitude
causes[]
effects[]
historicalImportance
playerInterventionId?
```

To stanowi fundament Causality Engine i Chronicle.

------------------------------------------------------------------------

## 43. Causality Graph — ważenie wpływu i pamięć hierarchiczna (zatwierdzone)

Zamiast przechowywać tylko log wydarzeń, system utrzymuje graf
zależności. Każda krawędź posiada typ zależności, siłę wpływu,
opóźnienie oraz confidence/importance. Wpływ konkretnej interwencji jest
propagowany przez graf z **wygaszaniem** na kolejnych poziomach.

UI nie pokazuje fałszywie precyzyjnych wartości typu „37,43% historii”.
Dla odległych skutków stosuje kategorie: **Primary / Significant / Minor
/ Trace** oraz ewentualnie wewnętrzny score używany tylko przez silnik.

### Hierarchical Causal Memory

Aby graf działał przez setki i tysiące lat, szczegółowość jest
kompresowana:

- ostatnie ~25 lat: pełna szczegółowość ważnych eventów i lokalnych
  zależności,
- ~25–100 lat: agregacja powtarzalnych zdarzeń i słabych krawędzi,
- 100+ lat: trwałe węzły tylko dla Historical Events, epok, dużych
  migracji, przełomów, państw, miast, firm, technologii i interwencji
  Architekta.

Przykładowo tysiące pojedynczych migracji mogą zostać skompresowane do
jednego wydarzenia `Great Northern Migration 341–357`, zachowującego
najważniejsze przyczyny i skutki. Progi czasowe są parametrami
technicznymi do benchmarkowania, a nie niezmiennymi zasadami gameplayu.

Graf zasila WHY?, Butterfly Effect, Architect's Legacy, Chronicle, World
Mysteries i porównania branchy.

------------------------------------------------------------------------

## 44. Determinizm i seed

Każdy świat posiada **World Seed**.

Wymagane jest kontrolowane użycie RNG, aby branch świata mógł być
porównywany z oryginałem.

Idealnie:

`identyczny stan + identyczny seed + brak interwencji = identyczna historia`

Pozwala to mierzyć rzeczywisty wpływ pojedynczej zmiany.

------------------------------------------------------------------------

## 45. Snapshot / Branch System

Branch nie powinien kopiować całej historii w nieefektywny sposób.

Model koncepcyjny:

``` text
BASE WORLD
   │
   ├── Snapshot Year 100
   │      ├── Branch A
   │      ├── Branch B
   │      └── Branch C
   │
   └── Main Timeline
```

Do dalszej analizy technicznej: snapshoty stanu + delta zmian /
copy-on-write.

------------------------------------------------------------------------

## 46. Importance Scoring

Nie każde zdarzenie trafia do kroniki.

Przykładowa funkcja:

``` text
Importance =
PopulationAffected
+ EconomicImpact
+ GeographicReach
+ Duration
+ PoliticalImpact
+ Novelty
+ PlayerCausalConnection
```

Na tej podstawie event może być:

- background,
- local,
- regional,
- major,
- historic.

------------------------------------------------------------------------

## 47. Dane a narracja

Silnik symulacji powinien generować **fakty**, a warstwa narracyjna
zamieniać fakty na tekst.

Nigdy odwrotnie.

Przykład faktów:

``` text
migration: +4,231
source: South Valley
target: Blackhill
mainCause: employmentGap
period: 8 years
```

Chronicle Engine może z tego stworzyć:

> **The Blackhill Migration** — Over eight years more than 4,000 people
> left South Valley for the rapidly industrializing Blackhill region.

Narracja nie może wymyślać danych, których nie ma w World State/Event
Log.

------------------------------------------------------------------------

# CZĘŚĆ IX — MVP

## 48. Cel MVP

MVP ma odpowiedzieć na jedno pytanie:

> **Czy obserwowanie autonomicznego świata i odkrywanie łańcuchów
> przyczyn jest wystarczająco ciekawe, aby gracz chciał przeprowadzić
> kolejny eksperyment?**

Nie próbujemy od razu symulować całej historii ludzkości.

------------------------------------------------------------------------

## 49. Pierwszy grywalny Vertical Slice — zatwierdzony

Celem Vertical Slice jest udowodnienie jednego kompletnego łańcucha
emergentnej historii.

### Zakres

- **24–40 regionów**,
- około **200 mieszkańców na starcie** w kohortach,
- **10–12 surowców**,
- około **15 dóbr**,
- rolnictwo,
- górnictwo,
- rzemiosło/przetwarzanie,
- handel i podstawowy transport,
- migracja,
- firmy z podstawowym kapitałem/właścicielem,
- organiczne osady i miasta,
- około **5 technologii/odkryć**,
- Chronicle v1,
- Causality Engine v1 + WHY?,
- około **5 interwencji Architekta**,
- Influence v1,
- World Mysteries/Causal Discovery w podstawowej formie.

### Test kluczowy

`gracz dodaje/ujawnia żelazo → powstaje kopalnia → miejsca pracy → migracja → osada → handel → miasto → WHY? pokazuje łańcuch przyczyn`

Jeżeli ten cykl jest interesujący bez rozbudowanych państw i wojen,
fundament gry działa. Parallel Worlds może zostać dodany po
potwierdzeniu tego rdzenia.

## 49.1. Scenariusze uczące zasad — zatwierdzone

Tutorial powinien być serią krótkich scenariuszy, nie długą instrukcją:

1.  **First Settlement** — 50 ludzi, rzeka, las i żyzna ziemia;
    obserwacja powstania pierwszej osady.
2.  **Black Mountain** — pojawia się żelazo; nauka Resource → Economy →
    Migration → Settlement oraz WHY?.
3.  **Two Valleys** — dwie podobne społeczności z różnymi warunkami;
    nauka porównywania trendów.
4.  **Gold Rush** — złoto uruchamia firmy, migrację i urbanizację.
5.  **Butterfly** — opcjonalnie branch przed Gold Rush: Gold vs No Gold
    i porównanie po 100 latach.

------------------------------------------------------------------------

## 50. Poza MVP

Na później:

- rozbudowane państwa,
- dyplomacja,
- pełny system wojen,
- religie,
- rozbudowane kultury,
- epidemie,
- zaawansowana polityka,
- bankowość,
- rozbudowany rynek finansowy,
- pełny XX/XXI-wieczny przemysł,
- zaawansowany World Rules Editor,
- rozbudowane biografie postaci.

------------------------------------------------------------------------

# CZĘŚĆ X — RYZYKA PROJEKTOWE

## 51. „Excel Simulator”

Największe ryzyko: świat jest matematycznie ciekawy, ale gracz widzi
tylko tabelki.

**Odpowiedź:** Chronicle + WHY? + postacie + historia miast + causal
graph.

------------------------------------------------------------------------

## 52. Pozorna symulacja

Jeżeli zdarzenia są tylko losowymi komunikatami, gracz szybko zauważy
brak głębi.

**Odpowiedź:** każde ważne wydarzenie musi wynikać ze stanu systemu i
pozostawiać trwałe konsekwencje.

------------------------------------------------------------------------

## 53. Chaos przyczynowy

Po kilkuset latach jedno wydarzenie może mieć tysiące przodków.

**Odpowiedź:** importance scoring, wygaszanie słabych zależności,
grupowanie przyczyn i prezentowanie 3–5 najważniejszych.

------------------------------------------------------------------------

## 54. Wydajność

Pełna symulacja milionów ludzi i firm może być niepraktyczna.

**Odpowiedź:** kohorty populacji, abstrakcja małych podmiotów,
dynamiczny poziom szczegółowości i historical characters tylko dla
ważnych osób.

------------------------------------------------------------------------

## 55. Brak celu gracza

Sandbox bez celu może szybko się znudzić.

**Odpowiedź:** eksperymenty, scenariusze, World Challenges, odkrywanie
zależności, branchowanie oraz kolekcja historii świata.

------------------------------------------------------------------------

# CZĘŚĆ XI — POTENCJALNE TRYBY

## 56. Sandbox

Pełna swoboda tworzenia i ingerowania.

## 57. Experiment

Jedna hipoteza, określony czas i raport porównawczy.

## 58. Scenario / Challenge

Przykłady:

- doprowadź cywilizację pustynną do 1 mln mieszkańców bez bezpośredniego
  dodawania żywności,
- stwórz świat utrzymujący 5 kultur przez 500 lat,
- sprawdź, czy cywilizacja przetrwa przy minimalnych zasobach,
- osiągnij industrializację bez węgla.

Warunek: gracz nadal manipuluje **warunkami**, a nie bezpośrednio
jednostkami.

------------------------------------------------------------------------

# CZĘŚĆ XII — USP I POZYCJONOWANIE

## 59. Główne USP

### 1. Causality Engine

**Każda historia ma przyczynę.**

### 2. Butterfly Effect

**Gra pokazuje długoterminowe konsekwencje Twoich działań.**

### 3. Parallel Worlds

**Zmień jedną rzecz i porównaj dwie historie.**

### 4. Dynamic Chronicle

**Świat sam pisze własną historię.**

### 5. Emergent Cities & Nations

**Nie budujesz cywilizacji — tworzysz warunki, w których ona powstaje.**

### 6. Experiment Mode

**„What happens if...?” staje się właściwym gameplayem.**

------------------------------------------------------------------------

## 60. Potencjalny komunikat Steam

> **You don't build the city. You create the reason for it to exist.**
>
> Place resources. Shape the land. Introduce people and knowledge. Then
> let civilization decide what happens next.
>
> Every city, company, migration, war and collapse emerges from the
> simulation — and FIRST CAUSE lets you trace the chain of causes that
> created it.
>
> Change one thing. Branch the timeline. Run another 200 years. Compare
> the histories.

------------------------------------------------------------------------

# CZĘŚĆ XIII — REJESTR DECYZJI v0.6

## 61. Zatwierdzone decyzje projektowe

1.  Surowce: około **35–40**; bazowa lista ~38 została zdefiniowana.
2.  Reprezentacja świata: **Wariant C — text-first Living Atlas / World
    Network**, bez klasycznej mapy jako fundamentu MVP.
3.  Skala: standard około 300 regionów, Large około 500; Vertical Slice
    24–40.
4.  Gospodarka: około **50–70 dóbr**, aktywowanych wraz z rozwojem
    świata.
5.  Rynek: **regionalne rynki połączone handlem**.
6.  Populacja: zagregowane Population Cohorts + indywidualni Historical
    Characters.
7.  Warstwy ekonomiczne: Poor / Working / Middle / Wealthy / Elite.
8.  Potrzeby: model wielopoziomowy od Survival do Modern.
9.  Firmy: trzy poziomy szczegółowości + Company Lifecycle + około 20–30
    archetypów.
10. Produkcja: Production Methods zamiast prostych bonusów
    technologicznych.
11. Transport: graf regionów z Effective Distance, kosztami i capacity.
12. Miasta: organiczny Settlement Pressure i funkcjonalne stadia
    rozwoju.
13. Państwa: emergentne powstawanie + Influence Territory.
14. Budżety państw: uproszczone podatki, wydatki, deficyt i dług;
    decyzje fiskalne podejmuje AI państwa.
15. Wojny: strategiczna symulacja regionowa.
16. Kultury: dynamiczne Traits, mieszanie, podziały, asymilacja i
    ewolucja.
17. Technologie: Discovery Engine oparty o Knowledge Domains, bez
    klasycznego tech tree.
18. Dyfuzja technologii: osobno Technology Available i Technology
    Adoption.
19. Energia: nakładające się epoki biomasy, węgla, ropy/gazu oraz
    elektryczności jako produkowanego dobra.
20. Influence: regeneracja hybrydowa, cap roboczo 100; konkretne
    interwencje i koszty do strojenia.
21. Tick: **1 miesiąc świata**; systemy aktualizowane z różną
    częstotliwością.
22. Kontrola czasu: Pause, ×1, ×5, ×20, ×100 i Simulate to...
23. Causality Graph: wpływ ważony z kategoriami
    Primary/Significant/Minor/Trace.
24. Hierarchical Causal Memory: kompresja starszej historii.
25. Parallel Worlds: opcjonalny system późniejszy.
26. Vertical Slice: pełny łańcuch zasób → firma → praca → migracja →
    osada/miasto → WHY?.
27. World Mysteries / Causal Discoveries: zatwierdzone.
28. Lokalizacja: angielski bazowy + 13 dalszych języków; bez arabskiego
    i bez RTL.

## 61.1. Zasada projektowa sprzężeń zwrotnych

Systemy nie mogą działać jako jednokierunkowe skrypty. FIRST CAUSE
powinien celowo generować pętle wzmacniające i stabilizujące.

Kluczowe wzorce:

- **Prosperity Loop:** Jobs → Migration → Population → Demand → New
  Businesses → Jobs.
- **Urban Crisis:** Population ↑ → Housing Demand ↑ → Costs ↑ →
  Attractiveness ↓.
- **Resource Boom/Bust:** discovery → mine → jobs → city growth →
  depletion → costs ↑ → layoffs → migration out.
- **Industrialization:** industry → machinery demand → productivity →
  cheaper goods → demand → industry.
- **Education/Innovation:** wealth → education → knowledge → innovation
  → productivity → wealth.
- **Poverty Trap:** low productivity → low wages → low education → low
  innovation → low productivity.
- **Trade Hub:** location → trade → infrastructure → lower transport
  cost → more trade.
- **War:** war → destruction → shortages → prices → instability →
  migration/rebellion.
- **Culture:** migration → mixing → new practices / tension → effects on
  trade, innovation and stability.
- **Environment:** population → agriculture/extraction → degradation →
  productivity ↓ → prices ↑.

### Główna zasada

> **Nie projektować pojedynczych efektów w izolacji. Każda ważna
> mechanika powinna mieć przynajmniej jedną drogę wpływu zwrotnego do
> systemów, które ją wywołały.**

## 61.2. Nadal otwarte do strojenia / uszczegółowienia

- finalna lista wszystkich 50–70 dóbr i ich receptur,
- dokładne parametry cen i tempo korekt cenowych,
- wzory płac, oszczędności, konsumpcji i mobilności społecznej,
- parametry Settlement Pressure,
- dokładne reguły inwestycji i bankructwa firm,
- modele własności i dziedziczenia kapitału,
- parametry Effective Distance i przepustowości tras,
- dokładne polityki AI dotyczące podatków, wydatków i długu,
- algorytm Political Influence i secesji,
- dokładna reprezentacja frontów i logistyki,
- zestaw Culture Traits i ich ewolucja,
- pełny katalog Knowledge Domains / Discoveries i warunki przełomów,
- koszty i regeneracja Influence po testach gry,
- progi kompresji causal graph,
- finalny zakres Parallel Worlds po teście Vertical Slice.

# 62. Proponowany następny etap

Przed rozpoczęciem pełnej implementacji należy przygotować kolejno:

1.  **Simulation Model v0.1** — dokładne zmienne i zależności Region →
    Population → Resource → Economy → Settlement.
2.  **Causality Engine Spec v0.1** — format eventów, graf zależności i
    algorytm WHY?.
3.  **MVP Scope v1** — twarda lista systemów w pierwszym prototypie.
4.  **World Command Center Wireframe** — główny ekran 1920×1080.
5.  **Entity Data Model** — World, Region, Settlement, Population
    Cohort, Company, Resource Deposit, Culture, Nation, Character,
    Event.
6.  **Simulation Tick Pipeline** — kolejność aktualizacji systemów w
    jednym kroku czasu.
7.  **Prototype Test Scenario** — Vertical Slice 24–40 regionów, a
    następnie benchmark świata 300 regionów symulowanego przez 300–500
    lat.

------------------------------------------------------------------------

# 63. Esencja projektu

FIRST CAUSE nie powinien próbować być klasycznym city-builderem,
strategią 4X ani symulatorem boga opartym na niszczeniu świata.

Jego własna przestrzeń projektowa to:

> **AUTONOMOUS WORLD + CAUSALITY + EXPERIMENTATION + HISTORY**

Najważniejszy moment gameplayowy nie brzmi:

> „Udało mi się zbudować miasto.”

Tylko:

> **„Ja tylko umieściłem tutaj żelazo 200 lat temu. Nie spodziewałem
> się, że przez to powstanie imperium.”**

Jeżeli gra będzie regularnie generowała takie momenty, koncepcja działa.

------------------------------------------------------------------------

# 20. UI / UX — FIRST CAUSE DESIGN DIRECTION v0.1

## 20.1. Główne założenie wizualne

FIRST CAUSE wykorzystuje jasny, funkcjonalny interfejs inspirowany
atlasem świata, raportem analitycznym i narzędziem do obserwacji
symulacji. UI ma być celowo „anti-AI”: uporządkowane, oszczędne,
konsekwentne i pozbawione nadmiaru dekoracyjnych kart, gradientów,
efektów glow oraz przypadkowych ikon.

Podstawowa paleta interfejsu:

- białe i bardzo jasnoszare tło,
- ciemna typografia,
- subtelne linie podziału,
- stonowane kolory funkcjonalne,
- kolory mapy wynikające z terenu, państw i aktywnej warstwy danych.

Mapa ma wyglądać bardziej jak funkcjonalny atlas/kartografia ekonomiczna
niż malowana mapa fantasy. Priorytetem jest czytelność regionów, granic,
rzek, miast, szlaków, zasobów i warstw analitycznych.

Zasada nadrzędna:

> Mapa odpowiada na pytanie „co i gdzie?”, a warstwa tekstowa i
> analityczna odpowiada na pytanie „dlaczego?”.

## 20.2. Trzy poziomy obserwacji świata

Interfejs wykorzystuje trzy podstawowe poziomy skali: MACRO → MESO →
MICRO.

### Poziom 1 — Living World Map / World Map

Domyślny i główny ekran gry.

Mapa zajmuje większość przestrzeni roboczej. Pokazuje przestrzenny
rozwój świata oraz umożliwia przechodzenie od świata do państwa, regionu
i miasta.

Główne elementy:

- mapa świata z abstrakcyjnymi regionami/poligonami,
- ukształtowanie terenu w uproszczonej formie,
- rzeki i akweny,
- granice państw,
- miasta i ważne osady,
- zasoby zależnie od aktywnej warstwy,
- drogi i główne szlaki handlowe,
- konflikty i migracje w odpowiednich trybach mapy,
- panel ostatnich istotnych wydarzeń,
- panel wybranego regionu/obiektu,
- stały pasek czasu i sterowania symulacją.

Mapa posiada przełączalne warstwy, m.in.:

- Terrain,
- Population,
- Nations,
- Resources,
- Economy,
- Migration,
- Trade,
- Culture,
- Conflict,
- Technology,
- Architect Impact.

Główny loop UI:

obserwuj świat → zauważ zmianę → wybierz region/obiekt → sprawdź
przyczyny → opcjonalnie ingeruj → uruchom czas → obserwuj konsekwencje.

### Poziom 2 — Inspector

Widok szczegółowy wybranego obiektu. Nie jest osobnym stylem UI, lecz
logicznym zejściem z mapy do konkretnego elementu świata.

Obsługiwane poziomy:

Region → City → Company → Historical Character/Person.

Inspector regionu powinien zawierać co najmniej:

- populację i jej trend,
- powierzchnię,
- państwo,
- główne miasta,
- kulturę/kultury,
- stabilność,
- zasoby,
- produkcję,
- główne dobra,
- firmy,
- zatrudnienie,
- handel,
- ostatnie wydarzenia,
- historię regionu,
- powiązania przyczynowe.

Inspector miasta rozszerza informacje o:

- genezę osady/miasta,
- Settlement Pressure,
- funkcje miejskie,
- branże,
- migrację,
- strukturę zatrudnienia,
- ważne firmy i postacie,
- najważniejsze momenty historii miasta.

Inspector firmy pokazuje m.in.:

- właściciela/założyciela,
- kapitał,
- aktywa,
- pracowników,
- zakłady,
- produkcję,
- przychody/koszty/dług,
- udział w rynku,
- wpływ na region i miasta.

### Poziom 3 — World Observatory

Globalny ekran analityczny odpowiadający na pytanie: „Co dzieje się z
całym moim światem?”.

Pokazuje m.in.:

- populację świata,
- liczbę państw,
- liczbę miast,
- liczbę znaczących firm,
- poziom rozwoju technologicznego,
- aktywne wojny,
- liczbę kultur,
- stabilność świata,
- stan środowiska,
- produkcję i handel,
- migrację,
- długookresowe wykresy trendów,
- najważniejsze wydarzenia bieżącej epoki.

Observatory służy przede wszystkim do analizy trendów i systemowych
konsekwencji, podczas gdy World Map służy do lokalizacji wydarzeń w
przestrzeni.

## 20.3. Causality View — kluczowy ekran USP

Causality View jest jednym z najważniejszych ekranów FIRST CAUSE i
wizualną reprezentacją Causality Engine.

Dla istotnego wydarzenia gracz może wybrać akcję typu „Why?” /
„Dlaczego?”.

System pokazuje czytelny graf przyczynowo-skutkowy, np.:

Interwencja Architekta: złoże żelaza → odkrycie żelaza → powstanie
kopalni → nowe miejsca pracy → migracja → wzrost budownictwa i handlu →
rozwój osady → powstanie/rozwój miasta.

Graf powinien rozróżniać:

- przyczyny główne,
- przyczyny wspierające,
- konsekwencje bezpośrednie,
- konsekwencje pośrednie,
- odległe skutki historyczne.

Wpływ konkretnej interwencji prezentowany jest jakościowo:

- Primary,
- Significant,
- Minor,
- Trace,

zamiast pozornie precyzyjnych procentów.

Causality View powinien umożliwiać przechodzenie z węzła grafu
bezpośrednio do odpowiedniego regionu, miasta, firmy, osoby lub
wydarzenia.

## 20.4. World Chronicle

World Chronicle jest osobnym, bardziej tekstowym ekranem przypominającym
kronikę historyczną lub encyklopedię wygenerowanego świata.

Powinien prezentować:

- wydarzenia roczne,
- najważniejsze wydarzenia epok,
- powstawanie i upadki państw,
- narodziny miast,
- wielkie migracje,
- wojny,
- kryzysy,
- odkrycia technologiczne,
- powstawanie znaczących firm,
- Historical Characters,
- dynamicznie nazwane epoki.

Kronika nie jest zwykłym logiem wszystkich eventów. Chronicle Engine
agreguje drobne zdarzenia w większe procesy historyczne i wybiera
wydarzenia posiadające realne znaczenie dla świata.

Przykład agregacji:

10 000 pojedynczych zmian miejsca zamieszkania → „Great Northern
Migration, years 341–357”.

## 20.5. Stały górny pasek gry

Niezależnie od głównego widoku użytkownik powinien mieć dostęp do
podstawowego stanu świata.

Rekomendowane elementy:

- FIRST CAUSE / nazwa świata,
- rok świata,
- aktualna dynamiczna epoka,
- populacja,
- Influence,
- sterowanie czasem,
- przycisk Intervene.

Sterowanie czasem:

- pauza,
- normalna prędkość,
- przyspieszenie,
- szybka symulacja dłuższego okresu.

## 20.6. Nawigacja główna

Rekomendowane główne sekcje:

- World Map,
- World,
- Regions,
- Nations,
- Cities,
- People,
- Economy,
- Technology,
- Culture,
- Events / Chronicle,
- My Interventions,
- Experiments.

Nie wszystkie pozycje muszą być dostępne w Vertical Slice. Nawigacja
powinna rosnąć wraz z zakresem implementowanych systemów.

## 20.7. Parallel Worlds — UI opcjonalne

Parallel Worlds pozostaje funkcją opcjonalną zgodnie z wcześniejszą
decyzją projektową.

Jeżeli system zostanie wdrożony, równoległe światy nie powinny być
pokazywane jednocześnie jako wiele pełnych map.

Rekomendowany model:

- jeden aktywny świat na ekranie,
- zakładki/selektor branchy: Original / Branch B / Branch C,
- osobny Compare Mode,
- porównanie kluczowych wskaźników,
- Divergence Map pokazująca regiony o największej różnicy między
  historiami,
- lista najważniejszych punktów rozbieżności.

## 20.8. Zasady anti-AI UI

Interfejs powinien unikać charakterystycznego wyglądu przypadkowo
generowanych dashboardów.

Zasady:

- ograniczona liczba typów kart,
- spójny grid,
- wyraźna hierarchia typograficzna,
- mało zaokrągleń,
- brak zbędnych gradientów,
- brak efektów glow,
- brak dekoracyjnych ikon bez funkcji,
- jeden system odstępów,
- jeden system obramowań,
- liczby prezentowane tylko wtedy, gdy pomagają podjąć decyzję lub
  zrozumieć świat,
- wykresy tylko dla istotnych trendów,
- tekst i zależności ważniejsze od ozdobników,
- mapa jako narzędzie analityczne, a nie ilustracja fantasy.

UI powinno sprawiać wrażenie zaprojektowanego narzędzia do obserwowania
żywego świata: atlas + kronika + laboratorium symulacji.

## 20.9. Docelowa hierarchia doświadczenia

FIRST CAUSE powinien pozwalać płynnie przechodzić pomiędzy trzema
skalami:

MACRO — cały świat, państwa, gospodarka, wielkie procesy.

MESO — regiony, miasta, firmy, migracje i lokalne gospodarki.

MICRO — ważni ludzie, założyciele, wynalazcy, historyczne postacie i
konkretne wydarzenia.

Najważniejsze jest zachowanie ciągłości historii: gracz powinien móc
rozpocząć od globalnego trendu, znaleźć region odpowiedzialny za zmianę,
zejść do miasta, firmy lub osoby, a następnie przejść do Causality View
i zobaczyć, jak lokalne wydarzenie wpłynęło na cały świat.

## 20.10. Docelowe filary UI

1.  **Living World Map** — gdzie dzieje się historia.
2.  **Inspector** — kto i co tworzy historię.
3.  **World Observatory** — jak zmienia się cały system.
4.  **Causality View** — dlaczego wydarzenie nastąpiło.
5.  **World Chronicle** — jaka historia powstała z symulacji.

Te pięć elementów stanowi zaakceptowany kierunek UI/UX FIRST CAUSE i
powinno być traktowane jako część głównej architektury produktu, a nie
wyłącznie warstwa wizualna.

------------------------------------------------------------------------

# Aktualizacja v0.4 — docelowa reprezentacja świata: Wariant C „Living Atlas / World Network”

## Decyzja projektowa

Przyjęto **Wariant C: tekstowy Living World + abstrakcyjny World Network
/ Living Atlas** jako docelowy podstawowy sposób prezentacji świata.

FIRST CAUSE **nie będzie opierał głównej rozgrywki na klasycznej
geograficznej mapie świata**. Geografia nadal istnieje w modelu
symulacji (regiony, sąsiedztwo, teren, klimat, rzeki, dostęp do morza,
zasoby, odległości i szlaki), lecz gracz poznaje ją przede wszystkim
poprzez hierarchię świata, graf zależności, dane, kronikę i ekrany
inspekcji.

Klasyczny Map View może zostać rozważony w przyszłości jako funkcja
opcjonalna, ale nie jest fundamentem MVP ani podstawowego UX.

## Główna zasada prezentacji

> **Świat jest siecią miejsc, ludzi, gospodarek i konsekwencji — nie
> planszą do podbijania.**

Interfejs ma odpowiadać przede wszystkim na cztery pytania:

1.  **Co dzieje się w świecie?**
2.  **Gdzie / między jakimi elementami to się dzieje?**
3.  **Dlaczego to się wydarzyło?**
4.  **Co zmieniła interwencja Architekta?**

## Proporcja UI

Docelowy kierunek: około **70% tekst / dane / kronika / analityka** oraz
**30% abstrakcyjne wizualizacje sieciowe**.

Styl pozostaje jasny, minimalistyczny, „anti-AI”, inspirowany atlasem,
raportem badawczym i narzędziem analitycznym. Unikać ozdobnych
fantasy-map, nadmiernych gradientów, efektów szkła, dużych dekoracyjnych
ikon i typowego „AI dashboard look”.

## Główny ekran — World Network

Centralnym elementem ekranu głównego jest **interaktywny graf świata**.

Domyślny poziom może prezentować państwa jako główne węzły oraz wybrane
regiony jako węzły podrzędne. Gracz może zmieniać tryb grafu:

- Polityka,
- Handel,
- Migracje,
- Kultury,
- Zasoby,
- Technologie,
- Konflikty,
- wpływ interwencji Architekta.

Wielkość węzła, grubość połączenia, obrys, etykieta i subtelne kodowanie
kolorem przekazują informacje zależne od wybranego trybu. Graf nie może
próbować przedstawiać wszystkich elementów jednocześnie; ma
priorytetyzować najważniejsze relacje.

## Stały górny pasek

Górny pasek zawiera co najmniej:

- rok świata,
- aktualną epokę,
- sterowanie czasem,
- populację świata,
- wybrany wskaźnik gospodarczy,
- liczbę / poziom znanych technologii,
- Influence,
- dostęp do Interventions.

## Lewa nawigacja

Podstawowe sekcje:

- Świat,
- Kontynenty,
- Państwa,
- Regiony,
- Miasta,
- Gospodarka,
- Ludzie,
- Technologia,
- Kultura,
- Wojny,
- Środowisko,
- Wydarzenia,
- Kronika,
- Moje interwencje,
- Scenariusze / Eksperymenty.

## Prawa kolumna — World Pulse

Prawa część głównego widoku ma odpowiadać za szybki monitoring świata:

### Najważniejsze wydarzenia

Pokazuje kilka najistotniejszych wydarzeń ostatniego okresu, np.:

- odkrycie surowca,
- wielką migrację,
- początek wojny,
- kryzys żywnościowy,
- awans osady do miasta,
- przełom technologiczny,
- upadek firmy lub państwa.

### Globalne statystyki

Krótkie trendy m.in.:

- populacja,
- liczba państw,
- liczba regionów,
- miasta,
- firmy,
- technologie,
- konflikty,
- stabilność,
- środowisko.

## Inspector — poziomy świata

FIRST CAUSE wykorzystuje hierarchiczny model eksploracji:

**WORLD → CONTINENT → STATE → REGION → CITY → COMPANY → PERSON**

Każdy poziom posiada własny profil i umożliwia przechodzenie do obiektów
powiązanych.

Przykład:

**Aeron → Northern Continent → Valmoria → Greenford → Riverford → North
Iron Company → Elias Harven**

Inspector ma umożliwiać przejście od makrohistorii świata do historii
konkretnego człowieka bez potrzeby klasycznej mapy.

## Region View

Profil regionu pokazuje co najmniej:

- populację i trend,
- powierzchnię,
- teren i klimat,
- zasoby,
- produkcję,
- główne miasta,
- państwo kontrolujące,
- kulturę,
- stabilność,
- firmy,
- wydarzenia,
- sąsiednie regiony,
- główne połączenia handlowe i migracyjne,
- historię regionu.

## Causality View jako filar UI

Widok **„Dlaczego to się wydarzyło?”** jest jednym z najważniejszych
ekranów gry.

Przykład:

**Odkrycie żelaza → budowa kopalni → miejsca pracy → migracja → rozwój
handlu + infrastruktury → wzrost Riverford**.

Węzły mogą być rozwijane, aby pokazać bardziej szczegółowe przyczyny i
skutki. Interwencje Architekta są wyróżniane, a ich wpływ przedstawiany
jakościowo:

- PRIMARY,
- SIGNIFICANT,
- MINOR,
- TRACE.

Nie prezentować fałszywie precyzyjnych procentów, jeśli model nie daje
wiarygodnej interpretacji przyczynowej.

## World Chronicle

Kronika pozostaje tekstowym zapisem historii świata. Musi być
filtrowalna według:

- czasu,
- państwa,
- regionu,
- miasta,
- firmy,
- osoby,
- typu wydarzenia,
- epoki,
- interwencji Architekta.

Chronicle i Causality View są ze sobą bezpośrednio połączone: wydarzenie
z kroniki można otworzyć w grafie przyczynowym, a węzeł grafu można
otworzyć w kronice.

## Geografia bez klasycznej mapy

Brak klasycznej mapy nie oznacza braku przestrzeni w symulacji.

Każdy region nadal posiada m.in.:

- identyfikator,
- kontynent,
- sąsiadów,
- powierzchnię,
- typ terenu,
- wysokość,
- klimat,
- dostęp do wody / morza,
- rzeki,
- żyzność,
- zasoby,
- odległości / koszty podróży do sąsiadów,
- infrastrukturę transportową.

Relacje przestrzenne są prezentowane poprzez grafy sąsiedztwa i połączeń
zamiast dokładnych współrzędnych geograficznych.

## Ewolucja świata w Living Atlas

Rozwój świata jest widoczny poprzez zmiany struktury sieci:

- pojawiają się nowe osady i miasta,
- miasta rosną i tracą znaczenie,
- regiony zmieniają właścicieli,
- państwa powstają, dzielą się i upadają,
- pojawiają się nowe połączenia handlowe,
- stare szlaki tracą znaczenie,
- zmieniają się kierunki migracji,
- kultury rozszerzają lub tracą wpływ,
- firmy tworzą sieci zakładów i rynków,
- technologie rozchodzą się pomiędzy ośrodkami.

Dzięki temu graf świata w roku 50 powinien wyglądać zasadniczo inaczej
niż w roku 500 czy 1000.

## History / Time View

Należy zachować możliwość badania historii sieci świata. Gracz powinien
móc wybrać wcześniejszy rok lub ważne wydarzenie i zobaczyć historyczny
stan kluczowych relacji.

Nie wymaga to pełnej rekonstrukcji klasycznej mapy. History View może
rekonstruować:

- istniejące państwa,
- miasta,
- populacje,
- połączenia,
- handel,
- migracje,
- konflikty,
- kultury,
- technologie.

System powinien korzystać ze snapshotów i zdarzeń historycznych zamiast
przechowywania pełnej kopii świata dla każdego roku.

## Parallel Worlds

Parallel Worlds pozostaje systemem opcjonalnym. Jeśli zostanie wdrożony,
porównanie światów ma koncentrować się na różnicach danych i sieci, nie
na wyświetlaniu wielu pełnych map jednocześnie.

Preferowane elementy Compare Mode:

- A/B world switcher,
- największe rozbieżności,
- zmiany populacji i gospodarki,
- różnice w państwach i miastach,
- divergence graph,
- różnice w Causality,
- porównanie Chronicle.

## Konsekwencje dla architektury technicznej

Silnik symulacji musi pozostać całkowicie oddzielony od prezentacji.

Zalecany podział:

``` text
simulation/
  world/
  regions/
  population/
  economy/
  companies/
  settlements/
  politics/
  culture/
  technology/
  warfare/

relationships/
  adjacency-graph/
  trade-network/
  migration-network/
  political-network/
  cultural-network/
  technology-network/

causality/
  causal-graph/
  causal-memory/
  architect-impact/

history/
  events/
  chronicle/
  snapshots/
  eras/

ui/
  world-network/
  inspectors/
  world-pulse/
  causality-view/
  chronicle/
  interventions/
  compare-mode/
```

UI odczytuje stan i relacje świata, ale nie zawiera logiki decydującej o
wyniku symulacji.

## Konsekwencje dla Vertical Slice

Vertical Slice **nie wymaga klasycznej mapy**.

Powinien udowodnić następujący loop:

**świat tekstowy / graf → zasób → firma → miejsca pracy → migracja →
osada / miasto → wydarzenie → WHY? → Causality View → interwencja → nowe
konsekwencje.**

Minimalny World Network powinien obsługiwać 24–40 regionów i czytelnie
pokazywać:

- sąsiedztwo,
- państwa (jeśli występują w slice),
- główne miasta,
- handel,
- migrację,
- najważniejsze wydarzenia.

## Status decyzji

**Wariant C — Living Atlas / World Network: ZATWIERDZONY jako podstawowy
kierunek FIRST CAUSE.**

Klasyczna mapa geograficzna: **poza zakresem podstawowego MVP;
opcjonalna funkcja przyszłości.**

------------------------------------------------------------------------

# 24. Internationalization & Localization Architecture

FIRST CAUSE od początku projektu musi być przygotowany jako gra
wielojęzyczna. Lokalizacja nie jest warstwą dodawaną po zakończeniu
developmentu, lecz częścią architektury prezentacji świata, szczególnie
ze względu na World Chronicle, Causality View, World Mysteries, nazwy
epok, wydarzenia oraz opisy zależności historycznych.

## 24.1. Język bazowy

Językiem kanonicznym projektu jest:

- `en` — English

Angielski pełni rolę:

- języka bazowego,
- języka fallback,
- języka referencyjnego dla kluczy lokalizacyjnych,
- języka dokumentacji tekstów użytkowych w kodzie.

## 24.2. Docelowo obsługiwane języki

FIRST CAUSE ma docelowo obsługiwać 14 języków:

| Kod     | Język              | Status docelowy   |
|---------|--------------------|-------------------|
| `en`    | English            | bazowy / fallback |
| `pl`    | Polski             | pełna lokalizacja |
| `es`    | Español            | pełna lokalizacja |
| `pt-BR` | Português (Brasil) | pełna lokalizacja |
| `de`    | Deutsch            | pełna lokalizacja |
| `fr`    | Français           | pełna lokalizacja |
| `it`    | Italiano           | pełna lokalizacja |
| `tr`    | Türkçe             | pełna lokalizacja |
| `ro`    | Română             | pełna lokalizacja |
| `nl`    | Nederlands         | pełna lokalizacja |
| `ko`    | 한국어             | pełna lokalizacja |
| `ja`    | 日本語             | pełna lokalizacja |
| `zh-CN` | 简体中文           | pełna lokalizacja |
| `id`    | Bahasa Indonesia   | pełna lokalizacja |

Arabski nie jest częścią zakresu projektu. Architektura UI nie musi więc
obsługiwać RTL.

## 24.3. Zasada nadrzędna: brak tekstów użytkowych w logice symulacji

Simulation Engine nie przechowuje gotowych zdań przeznaczonych do
wyświetlenia graczowi.

Niepoprawne:

``` js
event.text = "Iron deposits were discovered in Greenford.";
```

Poprawne:

``` js
event = {
  type: "RESOURCE_DISCOVERED",
  regionId: "greenford",
  resource: "iron",
  size: "large",
  year: 347
};
```

Warstwa prezentacji pobiera dane wydarzenia i generuje komunikat w
aktywnym języku.

Przykład:

EN:

> Large iron deposits were discovered in Greenford.

PL:

> W Greenford odkryto duże złoża żelaza.

DE:

> In Greenford wurden große Eisenvorkommen entdeckt.

Dzięki temu zapis gry pozostaje niezależny od języka interfejsu.

## 24.4. Trzy warstwy lokalizacji

System lokalizacji jest podzielony na trzy logiczne poziomy.

### A. UI Localization

Obejmuje:

- przyciski,
- zakładki,
- nagłówki,
- tooltipy,
- filtry,
- etykiety wykresów,
- komunikaty systemowe,
- ustawienia,
- opisy ekranów.

### B. Simulation Localization

Obejmuje:

- zasoby,
- dobra,
- technologie,
- zawody,
- ustroje,
- typy osad,
- statusy firm,
- typy wydarzeń,
- cechy kultur,
- typy konfliktów,
- typy interwencji Architekta.

### C. Narrative Localization

Obejmuje:

- World Chronicle,
- Causality View,
- World Mysteries,
- opisy epok,
- narracje historyczne,
- komunikaty o przełomach technologicznych,
- opisy wojen,
- opisy migracji,
- opisy wzrostu i upadku miast,
- podsumowania eksperymentów i światów równoległych.

Ta warstwa powinna korzystać z szablonów narracyjnych, a nie z jednego
sztywnego zdania na typ wydarzenia.

## 24.5. Struktura danych lokalizacyjnych

Rekomendowana struktura katalogów:

``` text
/locales
  /en
    ui.json
    simulation.json
    narrative.json
  /pl
    ui.json
    simulation.json
    narrative.json
  /es
  /pt-BR
  /de
  /fr
  /it
  /tr
  /ro
  /nl
  /ko
  /ja
  /zh-CN
  /id
```

Przykładowe klucze:

``` json
{
  "ui.world": "World",
  "ui.region": "Region",
  "resource.iron": "Iron",
  "event.resource_discovered.title": "Resource discovered",
  "event.resource_discovered.large": "Large {resource} deposits were discovered in {region}."
}
```

## 24.6. Nazwy własne świata

Nazwy generowanych obiektów nie powinny być tłumaczone jako zwykłe
stringi.

Przykłady nazw własnych:

- Riverford,
- Valmere,
- Elias Harven,
- North Iron Company.

Te nazwy pozostają stałe między językami.

Elementy opisowe powinny być przechowywane osobno.

Zamiast:

``` text
Kingdom of Valmere
```

przechowujemy:

``` text
name = Valmere
government = kingdom
```

Renderer może wtedy wyświetlić:

- EN: Kingdom of Valmere
- PL: Królestwo Valmere
- ES: Reino de Valmere
- DE: Königreich Valmere

To samo dotyczy:

- republik,
- federacji,
- imperiów,
- unii,
- typów firm,
- tytułów politycznych,
- nazw epok generowanych na podstawie strukturalnych danych.

## 24.7. Chronicle Engine a lokalizacja

World Chronicle nie zapisuje gotowych zdań jako głównego źródła
historii.

Przechowuje strukturę faktów:

``` js
{
  type: "CITY_MILESTONE",
  cityId: "riverford",
  milestone: "population_threshold",
  population: 50000,
  year: 336,
  causes: ["migration_wave_18", "iron_mine_04"]
}
```

Narrative Renderer zamienia te dane na tekst w aktualnym języku.

Dzięki temu:

- zmiana języka działa także dla starego zapisu gry,
- można ulepszać styl narracji bez migracji save'ów,
- łatwiej kontrolować powtarzalność komunikatów,
- łatwiej audytować spójność tekstów.

## 24.8. Wielowariantowa narracja anti-AI

Dla najczęstszych wydarzeń należy przygotować kilka wariantów
stylistycznych.

Przykład typu `RESOURCE_DISCOVERED` może mieć:

- wariant neutralny,
- wariant kronikarski,
- wariant skrócony,
- wariant analityczny.

Chronicle Engine wybiera wariant zależnie od kontekstu ekranu.

Nie należy generować całej narracji wyłącznie za pomocą LLM w runtime.
Podstawą mają być deterministyczne szablony i dane symulacyjne.

## 24.9. Wymagania dla UI

Interfejs musi być odporny na różne długości tekstu.

W szczególności:

- przyciski nie mogą mieć szerokości dobranej pod jeden angielski napis,
- layout powinien korzystać z elastycznych kontenerów,
- należy unikać tekstów „wrysowanych” w grafikę,
- niemiecki należy traktować jako ważny test długości etykiet,
- chiński, japoński i koreański wymagają prawidłowego Unicode,
  line-height i łamania tekstu,
- wszystkie fonty użyte w grze muszą obsługiwać wymagane zestawy znaków
  lub posiadać poprawnie skonfigurowany fallback.

## 24.10. Formatowanie liczb, dat i jednostek

Formatowanie nie może być hardkodowane.

System powinien lokalizować:

- separator dziesiętny,
- separator tysięcy,
- procenty,
- skróty liczebności,
- waluty, jeżeli pojawią się w UI,
- jednostki,
- kolejność elementów daty.

Przykład:

``` text
EN: 1.2 million
PL: 1,2 mln
DE: 1,2 Mio.
```

## 24.11. Fallback

Jeżeli dla danego klucza brak tłumaczenia:

1.  system próbuje aktywnego języka,
2.  następnie `en`,
3.  w trybie developerskim zapisuje ostrzeżenie o brakującym kluczu.

Brak tłumaczenia nie może powodować błędu symulacji ani braku możliwości
wczytania zapisu.

## 24.12. Walidacja lokalizacji

CI / testy projektu powinny wykrywać:

- brakujące klucze względem `en`,
- nieużywane klucze,
- hardcoded user-facing strings,
- uszkodzone placeholdery,
- brakujące parametry szablonów,
- problemy z Unicode,
- zbyt długie teksty w kluczowych komponentach UI.

Przykład błędu:

``` text
Missing key: narrative.city_growth.major
Locale: de
```

## 24.13. Kolejność wdrożenia

### Vertical Slice

Pełna infrastruktura i18n od pierwszej wersji.

Aktywne tłumaczenia:

- English — 100%
- Polski — 100%

Celem jest przetestowanie, czy cała symulacja, Chronicle i Causality są
niezależne od języka.

### Alpha / Demo

Stopniowe dodawanie kolejnych lokalizacji, ze szczególnym priorytetem
dla:

- Spanish,
- Portuguese (Brazil),
- German,
- French,
- Simplified Chinese.

### Release

Docelowo wszystkie 14 języków wymienionych w sekcji 24.2.

## 24.14. Zasady implementacyjne dla Claude Code

Podczas implementacji Claude Code musi przestrzegać następujących reguł:

1.  Brak hardcoded user-facing strings w komponentach produkcyjnych.
2.  Angielski jest fallbackiem, ale nie może być zaszyty bezpośrednio w
    logice domenowej.
3.  Simulation Engine przechowuje dane strukturalne, nie zdania.
4.  Chronicle, Causality i World Mysteries korzystają z Narrative
    Localization.
5.  Save game nie przechowuje lokalizowanych opisów jako źródła prawdy.
6.  Każda nowa mechanika zawierająca tekst wymaga odpowiednich kluczy
    lokalizacyjnych.
7.  Testy muszą obejmować co najmniej `en` i `pl`.
8.  Komponenty UI muszą tolerować dłuższe etykiety i znaki CJK.

## 24.15. Rola Codex w audycie lokalizacji

Podczas audytów Codex powinien kontrolować:

- obecność hardcoded strings,
- kompletność kluczy,
- zgodność eventów z Narrative Rendererem,
- poprawność placeholderów,
- niezależność save game od języka,
- zgodność dokumentacji z implementacją,
- problemy layoutu wynikające z różnych długości tekstów.

## 24.16. Decyzja projektowa

FIRST CAUSE jest projektowane jako gra wielojęzyczna od początku.

Język bazowy:

**English**

Pełna lista docelowa:

**English, Polish, Spanish, Portuguese (Brazil), German, French,
Italian, Turkish, Romanian, Dutch, Korean, Japanese, Simplified Chinese,
Indonesian.**

Arabski nie jest częścią zakresu projektu i obsługa RTL nie jest
wymagana.

------------------------------------------------------------------------

# Aktualizacja v0.6 — Economic & Population Core

Wersja v0.6 konsoliduje ustalenia z rozmów dotyczących Simulation Model
v0.1: miesięczny tick, populację kohortową, klasy ekonomiczne, potrzeby,
regionalne rynki, ceny, handel, transport grafowy, firmy i Production
Methods, energię, budżety państw, Knowledge Domains, katalog interwencji
Architekta oraz obowiązkowe sprzężenia zwrotne.

Ta wersja zastępuje wcześniejsze nieprecyzyjne zapisy sugerujące
klasyczną mapę jako główną reprezentację świata. Obowiązujący kierunek
UI to Wariant C — **text-first Living Atlas / World Network**.
