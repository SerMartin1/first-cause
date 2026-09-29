# FIRST CAUSE --- Living Atlas Visual Asset Spec v1.3

**Status:** CANONICAL VISUAL ASSET PRODUCTION SPEC\
**Projekt:** FIRST CAUSE\
**Wersja:** 1.3 (2026-09-26 --- §28: wymagania czytelności cywilizacji,
Map Modes v2 i Visual Verification Gate po audycie z 2026-09-26)\
**Powiązany milestone:** M21 --- UI Vertical Slice\
**Kanoniczne referencje wizualne:**
`docs/visual-reference/FIRST-CAUSE-Raw-Simulation-Atlas-v0.1(1).png`,
`docs/golden-ui/FIRST-CAUSE-Visual-Alphabet-v1.1(1).png`,
`FIRST-CAUSE-Golden-UI-World-Command-Center-v1.3.md`

**Powiązane dokumenty:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(`UI-014`, `UI-015`), `FIRST-CAUSE-UI-Visual-Design-System-v1.4.md`,
`FIRST-CAUSE-UI-Implementation-Spec-v1.4.md`,
`docs/golden-ui/FIRST-CAUSE-Golden-UI-01-World-v1.0.png` (historyczna
referencja v1.1)

> **Identyfikatory bramek:** `VIS-01`...`VIS-10` w §23 tego dokumentu to
> bramki odbioru **assetów**. Etapy harmonogramu w Roadmapie mają
> prefiks `M21-VIS-xx` (np. `M21-VIS-01` = implementation spike). W
> dokumentach przekrojowych zawsze używać pełnego prefiksu.

> **Living Atlas nie jest ilustracją świata. Jest wizualnym zapisem
> stanu, rozwoju i zmian symulacji.**

------------------------------------------------------------------------

## 1. Cel dokumentu

Dokument definiuje produkcyjny system assetów Living Atlasu. Ustala:

-   rodziny assetów,
-   strukturę folderów i nazewnictwo,
-   sposób proceduralnego składania regionów,
-   skalowanie osad,
-   różnicowanie wydobycia i przemysłu,
-   ewolucję wizualną w czasie,
-   reguły epok, skali, intensywności i stanu,
-   zasady map modes i semantic zoom,
-   wymagania Anti-AI,
-   kolejność produkcji i kryteria odbioru.

Plansza Visual Asset Library v0.3 jest **referencją kierunku**, a nie
sprite sheetem. Nie wolno wycinać z niej elementów i traktować ich jako
finalnych assetów gry.

------------------------------------------------------------------------

## 1.1 Zmiana kierunku v1.1 --- Raw Simulation Atlas

Wersja v1.1 zastępuje wcześniejsze podejście oparte na rozbudowanej
bibliotece ilustracyjnych assetów podejściem **Raw Simulation Atlas**.

Od tej wersji Living Atlas jest budowany jako trzy rozdzielone warstwy:

1.  **Geography** --- surowa, spokojna kartografia proceduralna,
2.  **Civilization** --- prosty alfabet znaków pokazujących rozwój
    świata,
3.  **Simulation Data** --- geometryczne warstwy danych, zdarzeń, zmian
    i przyczynowości.

`Visual Asset Library v0.3` pozostaje materiałem historycznym
pokazującym zakres kategorii, ale **nie jest źródłem prawdy dla stylu
produkcyjnego**.

Źródła prawdy dla warstwy wizualnej są następujące:

-   `Raw Simulation Atlas v0.1` --- charakter i poziom surowości mapy,
-   `Visual Alphabet v1.1` --- gramatyka znaków,
-   `Golden UI #1 — World` --- kompozycja i hierarchia całego ekranu.

Zasada implementacyjna:

`SIMULATION STATE → READ MODEL → REGION VISUAL PROFILE → VISUAL ALPHABET → PIXIJS RENDERER`

Nie wolno traktować referencyjnych PNG jako gotowych teł lub sprite
sheetów.

## 2. Zasady nadrzędne

### 2.1 Information before decoration

Każdy element graficzny musi przekazywać informację o świecie lub
poprawiać jego czytelność.

### 2.2 Data-driven

Wygląd wynika z danych symulacji:

`TYPE + SPECIALIZATION + SCALE + ERA + INTENSITY + STATE`

Przykład:

`Industry / Metallurgy / Large / Industrial / High / Active`

nie może wyglądać tak samo jak:

`Industry / Textiles / Large / Industrial / High / Active`.

### 2.3 Distinctive silhouettes

Rodzaj działalności powinien być rozpoznawalny przede wszystkim po:

-   sylwetce,
-   układzie przestrzennym,
-   charakterystycznej infrastrukturze,

a dopiero później po kolorze lub etykiecie.

### 2.4 Modularność

Assety muszą współpracować ze sobą i pozwalać składać wiele regionów bez
przygotowywania osobnej ilustracji dla każdego regionu.

### 2.5 Historical evolution

Ten sam region powinien wizualnie zmieniać się wraz z rozwojem
technologii, infrastruktury, osadnictwa, gospodarki i eksploatacji
zasobów.

### 2.6 Calm default state

World pozostaje spokojny. Szczegóły pojawiają się przez zoom, selection,
Map Mode, Overlay, Event Focus i WHY?.

### 2.7 Anti-AI

Unikać:

-   przesadnej szczegółowości,
-   przypadkowej dekoracyjności,
-   identycznych „ładnych" budynków dla różnych sektorów,
-   malarskiej mapy fantasy,
-   neonów, glow, gradientów UI,
-   generowania każdej ilustracji niezależnie bez wspólnej gramatyki,
-   sztucznego „concept-artowego" dramatyzmu.

Preferować:

-   spójny rysunek kartograficzny,
-   kontrolowaną niedoskonałość,
-   ograniczoną paletę,
-   czytelne sylwetki,
-   powtarzalne reguły,
-   funkcję ponad dekoracją.

------------------------------------------------------------------------

## 3. Struktura repozytorium

``` text
assets/
└── living-atlas/
    ├── terrain/
    ├── water/
    ├── vegetation/
    ├── settlements/
    ├── transport/
    ├── extraction/
    ├── industry/
    ├── infrastructure/
    ├── special/
    ├── markers/
    └── overlays/
```

Referencje wizualne:

``` text
docs/
└── visual-reference/
    └── FIRST-CAUSE-Living-Atlas-Visual-Asset-Library-v0.3.png
```

Golden UI pozostaje osobno:

``` text
docs/
└── golden-ui/
    └── FIRST-CAUSE-Golden-UI-01-World-v1.0.png
```

------------------------------------------------------------------------

## 4. Konwencja nazw

Format:

``` text
fc_<family>_<type>_<variant>_<era>_<state>_<scale>.png
```

Nie wszystkie pola są obowiązkowe.

Przykłady:

``` text
fc_settlement_city_industrial_active_large.png
fc_extraction_coal_shaft_industrial_active_large.png
fc_extraction_iron_openpit_modern_declining_large.png
fc_industry_metallurgy_steelmill_industrial_active_large.png
fc_transport_rail_electrified_modern_active.png
```

Nazwy plików:

-   lowercase,
-   ASCII,
-   kebab lub underscore konsekwentnie w całej bibliotece,
-   bez numerów wersji w nazwach produkcyjnych assetów.

------------------------------------------------------------------------

# 4A. Visual Alphabet v1.1 --- reguły kanoniczne

Visual Alphabet jest systemem znaków, a nie kolekcją ilustracji.

## 4A.1 Settlements

Kanoniczne kategorie semantyczne:

-   Hamlet \<500
-   Village 500--2k
-   Large Village 2--5k
-   Small Town 5--10k
-   Town 10--25k
-   Large Town 25--50k
-   Small City 50--100k
-   City 100--250k
-   Large City 250--500k
-   Major City 500k--1M
-   Metropolis 1--2.5M
-   Major Metropolis 2.5--5M
-   Megacity 5--10M
-   Global Megacity 10M+

Rozmiar reprezentacji na World skaluje się płynnie z populacją.
Kategorie wpływają na strukturę znaku i poziom informacji.

**Capital / Regional Capital / State Capital są modifierami funkcji, a
nie kategoriami populacyjnymi.**

### Morfologia osad (`M21-VIS-R3` / `R3.1`, HUMAN VISUAL ACCEPTED 2026-09-27)

Populacja zmienia **strukturę** znaku osady, nie tylko jego rozmiar
(§28.2). Znak jest symboliczny --- nie jest planem miasta ani
budynkami 1:1.

**Prymitywy** (jedyne dozwolone elementy znaku osady):

-   **ślad osady (footprint)** --- promień znaku z log10 populacji z
    górnym limitem (§28.3); wszystkie elementy znaku mieszczą się w
    nim;
-   **ślad zabudowy** --- mały prostokąt o stałym rozmiarze (skala osady
    rośnie liczbą śladów, nie ich wielkością);
-   **skupisko** --- kilka śladów zabudowy razem (zwarta zabudowa
    dzielnicy);
-   **oś** --- łamana linia wewnątrz osady (ramię wzrostu, połączenie
    rdzenia z dzielnicą lub płatów ze sobą); nigdy nie przechodzi przez
    środek jako szprycha i kończy się w punkcie struktury osady;
-   **obszar zabudowy** --- kanciasty płat (lub kilka płatów) jednym
    kryjącym odcieniem `--fc-atlas-urban`, z konturem
    `--fc-atlas-urban-edge` tylko po zewnętrznej krawędzi sumy płatów;
-   **rdzeń** --- pełny, kanciasty wielokąt (centrum osady);
-   **osada satelitarna** --- skupisko przy krawędzi śladu megacity.

**Klasy morfologii** grupują kategorie powyżej bez zmiany ich granic:

| Klasa | Kategorie | Struktura |
|---|---|---|
| Hamlet | < 500 | 2 oddalone ślady zabudowy albo skupisko 4 śladów ze ścieżką |
| Village | 500--5k | zabudowa wzdłuż jednej drogi, przy większej wsi odgałęzienie |
| Town | 5k--50k | jeden zwarty obszar zabudowy, jeden rdzeń, 3--4 krótkie ramiona wzrostu |
| City | 50k--500k | jeden dominujący rdzeń w głównym obszarze + 2--3 dzielnice jako osobne płaty różnej wielkości (największa może być zrośnięta przewężeniem, pozostałe za niewielką przerwą), połączone z rdzeniem osiami; bez efektu gwiazdy |
| Metropolis | 500k--5M | wielopłatowa struktura (dwa zrośnięte płaty), co najmniej dwa rdzenie, dzielnice |
| Megacity | 5M+ | policentryczna: 4--5 płatów z własnymi rdzeniami połączonymi osiami, osady satelitarne; osie zewnętrzne kończą się na satelitach, nie w pustej przestrzeni |

**Wariacja:** 3 autorskie układy × lustro, wybierane deterministycznie
stabilnym hashem id osady (bez RNG, bez `Math.random()`); ta sama
osada przy tej samej populacji i zoomie wygląda zawsze tak samo.
Wygląd nie wpływa na symulację.

**Semantic zoom (WORLD / REGION / LOCAL, §13):** poziom zoomu dokłada
wyłącznie ślady / skupiska zabudowy --- **nie zmienia klasy osady ani
jej podstawowej morfologii** (obszar, rdzenie, osie). Różnica
Town → City istnieje już na WORLD. Najmniejsze osady mają minimalny
rozmiar ekranowy bez zmiany kolejności rozmiarów (§28.3).

**Osie osady ≠ trasy między regionami:** osie są częścią znaku osady;
infrastruktura między regionami jest rysowana na krawędziach (§28.6) i
nie jest zmieniana przez morfologię.

**Budżet:** ≤ 60 prymitywów na osadę (UI Implementation Spec, Living
Atlas); wiele osad na region zgodnie z §28.4 i Design System §69.4.

## 4A.2 Resource classes

Nie używać jednej kategorii `resource deposit` dla wszystkich zasobów.

Rozdzielić:

-   **Geological / finite** --- złoża geologiczne i wyczerpywalne,
-   **Renewable / natural** --- np. timber/fish, jeśli istnieją w
    modelu,
-   **Agricultural / production potential** --- produkcja/potencjał
    rolniczy, jeśli istnieje w modelu.

Visual Alphabet nie dodaje nowych zasobów do Simulation Model.

## 4A.3 Extraction

Na World dopuszczalny jest znak zagregowany. Na Region/Local, gdy dane
to wspierają, rozróżniać sylwetką m.in.:

-   shaft mine,
-   open pit,
-   quarry,
-   oil field,
-   gas field,
-   logging,
-   fishing,
-   salt works,
-   clay/sand/gravel pit.

Zakaz: „ta sama kopalnia + inny kolor".

## 4A.4 Industry

Stosować:

`BASE INDUSTRY SYMBOL + SPECIALIZATION MODIFIER + SCALE + STATE`

Nie produkować niezależnego, ilustracyjnego piktogramu dla każdego
sektora, jeżeli wspólny system znaków zachowuje znaczenie.

## 4A.5 State Modifiers

Wspierane stany wizualne, gdy istnieją w danych:

-   New,
-   Growing,
-   Active,
-   Stressed,
-   Declining,
-   Depleted / Closed.

Stan modyfikuje znak bazowy; nie tworzy osobnego stylu artystycznego.

## 4A.6 Events

Preferować geometryczny język klas wydarzeń zamiast zestawu dosłownych
ikon typu czaszka/miecz/korona.

Marker wydarzenia koduje przede wszystkim:

-   klasę,
-   Historical Significance,
-   aktywność/historyczność.

Pełne znaczenie jest dostępne przez tooltip, Recent Events, Chronicle
lub WHY?.

## 4A.7 Causality Language

Causality jest częścią Visual Alphabet, ale nie jest stale widoczna.

Obsługiwane relacje:

-   Cause → Effect,
-   Contributing Factor,
-   Primary Cause,
-   Indirect Effect,
-   Feedback Loop,
-   Spatial Spillover,
-   Causal Chain.

Causal links pojawiają się kontekstowo w WHY?/Focus Mode. Domyślny World
nie może zamieniać się w „causal spaghetti".

# 5. Terrain & Environment

## 5.1 Rodziny bazowe

Minimum docelowe:

-   plains,
-   hills,
-   mountains,
-   high mountains,
-   plateau,
-   desert,
-   steppe,
-   dense forest,
-   sparse forest,
-   jungle,
-   savanna,
-   tundra,
-   farmland,
-   grassland,
-   marsh,
-   snow/ice,
-   rough terrain,
-   canyon,
-   wetland.

## 5.2 Water

-   coast,
-   shallow sea,
-   deep sea,
-   lake,
-   river,
-   delta,
-   wetland.

## 5.3 Zasada renderowania

Terrain jest tłem. Nie może konkurować z:

-   osadami,
-   wydarzeniami,
-   markerami,
-   przepływami,
-   Map Mode.

Na szerokim zoomie preferować teksturę, kolor i uproszczony kontur
zamiast ilustracyjnych drzew i gór.

------------------------------------------------------------------------

# 6. Settlements --- pełna skala

## 6.1 Kategorie semantyczne

  Typ                   Populacja
  ------------------ ------------
  Hamlet                   \< 500
  Village                 500--2k
  Large Village            2k--5k
  Small Town              5k--10k
  Town                   10k--25k
  Large Town             25k--50k
  Small City            50k--100k
  City                 100k--250k
  Large City           250k--500k
  Major City             500k--1M
  Metropolis             1M--2.5M
  Major Metropolis       2.5M--5M
  Megacity                5M--10M
  Global Megacity            10M+

Kategorie służą do doboru reprezentacji wizualnej. Marker na mapie World
skaluje się płynnie na podstawie populacji i nie wykonuje skoków
wyłącznie na progach kategorii.

## 6.2 Marker population scaling

Rozmiar markera = populacja.

Stosować skalowanie pierwiastkowe/logarytmiczne z minimalnym i
maksymalnym promieniem.

Kolor markera = aktywny Map Mode, nie populacja.

## 6.3 Proceduralna reprezentacja osady

Wygląd osady powinien zależeć co najmniej od:

-   population,
-   density,
-   urbanization,
-   era,
-   dominant economic sectors,
-   infrastructure,
-   prosperity/development,
-   active/declining state.

Przykład:

`1.2M / 1800 / industrial`

nie może wyglądać tak samo jak:

`1.2M / 2000 / services/high-tech`.

------------------------------------------------------------------------

# 7. Era Visual Layer

Minimalne warstwy wizualne:

1.  Early / pre-urban
2.  Ancient / early organized
3.  Medieval / agrarian
4.  Early modern / proto-industrial
5.  Industrial
6.  Modern industrial
7.  Contemporary / advanced

Dokładne granice czasowe nie są zakodowane w grafice. Era jest
wyprowadzana z faktycznego poziomu technologicznego świata/regionu.

Assety nie mogą zakładać, że konkretny rok automatycznie oznacza
konkretną epokę.

------------------------------------------------------------------------

# 8. Transport Infrastructure

## 8.1 Roads

-   path/trail,
-   dirt road,
-   road,
-   paved road,
-   major road,
-   highway.

## 8.2 Rail

-   early track,
-   railway,
-   double track,
-   electrified,
-   high-capacity/high-speed.

## 8.3 Crossings

-   wooden bridge,
-   stone bridge,
-   steel bridge,
-   modern bridge,
-   tunnel.

## 8.4 Ports / aviation

-   river port,
-   coastal port,
-   industrial harbor,
-   early airport,
-   modern airport.

Infrastruktura musi ewoluować wraz z technologią.

------------------------------------------------------------------------

# 9. Resource Extraction

## 9.1 Zasada

Nie wolno stosować modelu „ta sama kopalnia + inny kolor".

Rodzaj wydobycia musi być rozpoznawalny po strukturze.

## 9.2 Rodziny wizualne

### Open-pit

Dla zasobów i warunków, które uzasadniają odkrywkę, np.:

-   iron,
-   copper,
-   bauxite,
-   uranium,
-   phosphate.

### Shaft mine

-   coal,
-   iron,
-   gold,
-   silver,
-   salt,
-   inne złoża głębinowe.

### Quarry / pit

-   limestone,
-   stone,
-   clay,
-   sand/gravel.

### Oil

-   onshore oil field,
-   offshore platform.

### Natural gas

-   gas field,
-   wells,
-   processing/collection infrastructure.

### Evaporation / brine

-   salt evaporation,
-   inne zasoby pozyskiwane powierzchniowo.

### Renewable biological extraction

-   timber logging,
-   fisheries,
-   agriculture/plantation.

## 9.3 Stany wydobycia

Każdy typ wspiera, gdzie ma to sens:

1.  Prospected
2.  Small Extraction
3.  Developed
4.  Industrial
5.  Declining
6.  Depleted / Abandoned

Stan powinien być czytelny wizualnie.

Przykład:

**Industrial** = rozbudowana infrastruktura i aktywność.\
**Declining** = mniej aktywności, częściowo wygaszona infrastruktura.\
**Depleted** = pozostałości/wyrobisko/opuszczona infrastruktura.

## 9.4 Intensywność

Jeżeli model posiada intensywność/throughput, wpływa ona na:

-   skalę infrastruktury,
-   liczbę elementów,
-   powierzchnię zajmowaną przez działalność,

ale nie może prowadzić do niekontrolowanego wizualnego chaosu.

------------------------------------------------------------------------

# 10. Industry --- sektory muszą być rozpoznawalne

## 10.1 Minimalne rodziny wizualne

-   metallurgy / smelting,
-   steel,
-   textiles,
-   chemicals,
-   food processing,
-   machinery,
-   wood processing,
-   cement,
-   glassworks,
-   refinery,
-   automotive,
-   electronics,
-   shipyard,
-   paper,
-   pharmaceutical,
-   fertilizer,
-   power generation,
-   research,
-   logistics,
-   data infrastructure.

Lista jest rozszerzalna zgodnie z Production Economy.

## 10.2 Distinct silhouette rule

Przykłady:

**Metallurgy**\
piece, kominy, składy materiałów, ciężka infrastruktura.

**Textiles**\
długie hale/manufaktury, regularny układ zabudowy.

**Chemicals**\
zbiorniki, kolumny, rurociągi.

**Food Processing**\
hale, silosy, magazyny.

**Machinery / Automotive**\
duże hale montażowe i place logistyczne.

**Wood Processing**\
tartak, składy drewna.

**Cement**\
piece, silosy, ciężka instalacja procesowa.

**Refinery**\
zbiorniki, kolumny destylacyjne, rurociągi.

**Electronics / Data**\
bardziej zwarta i nowoczesna infrastruktura, bez kopiowania ciężkiego
przemysłu.

**Shipyard**\
dok, suwnice, kadłuby/obszar nabrzeżny.

## 10.3 Skala przemysłu

Przykładowa wspólna hierarchia:

1.  Workshop / Early
2.  Manufactory
3.  Factory
4.  Large Plant
5.  Industrial Complex

Nie każdy sektor musi używać identycznych nazw, ale musi posiadać
równoważną progresję skali.

## 10.4 Stan

-   new,
-   active,
-   expanding,
-   mature,
-   stressed/overcapacity,
-   declining,
-   closed,
-   abandoned.

Stan ma zmieniać wygląd bez zmiany tożsamości sektora.

------------------------------------------------------------------------

# 11. Power Generation

Energetyka jest osobną podrodziną przemysłu/infrastruktury.

W zależności od systemów gry biblioteka może zawierać:

-   hydroelectric,
-   coal,
-   gas,
-   oil,
-   nuclear,
-   wind,
-   solar,
-   inne technologie zgodne z Technology Catalog.

Nie tworzyć assetu technologii, której gra jeszcze nie obsługuje,
wyłącznie „na przyszłość", poza style guide.

------------------------------------------------------------------------

# 12. Special Facilities

Minimalne rodziny, jeśli są wspierane przez model:

-   farm,
-   ranch,
-   warehouse,
-   logistics hub,
-   market,
-   university,
-   research center,
-   administrative site,
-   military site,
-   religious site,
-   port,
-   station.

Ich obecność na Atlasie zależy od zoomu i znaczenia.

------------------------------------------------------------------------

# 12A. Trzy warstwy renderera

## Geography Layer

-   terrain,
-   water,
-   rivers,
-   coastline,
-   vegetation,
-   relief,
-   borders.

Warstwa spokojna, niskokontrastowa i podporządkowana danym.

## Civilization Layer

-   settlements,
-   roads,
-   rail,
-   ports,
-   extraction,
-   industry,
-   infrastructure.

Pokazuje materialny rozwój świata.

## Simulation Data Layer

-   Population,
-   Economy,
-   Resources,
-   Trade,
-   Technology,
-   Development,
-   Stability,
-   Δ Change,
-   Events,
-   Causality Focus.

Warstwa danych ma mieć większą czytelność niż baza geograficzna.

# 13. Semantic Zoom

Living Atlas stosuje:

`WORLD → REGION → LOCAL`

## WORLD

Pokazuje:

-   duże osady,
-   klastry,
-   najważniejsze połączenia,
-   największe anomalie i zmiany.

Nie pokazuje pełnych assetów lokalnych.

## REGION

Pokazuje:

-   osady,
-   główną infrastrukturę,
-   dominujące działalności,
-   ważne wydobycie,
-   wybrane obiekty specjalne.

## LOCAL

Pokazuje pełniejsze moduły:

-   zabudowę,
-   zakłady,
-   kopalnie,
-   transport,
-   lokalne cechy środowiska.

Im większy zoom-out, tym bardziej asset staje się symbolem/informacją
zamiast ilustracją.

------------------------------------------------------------------------

# 14. Map Modes

Ta sama geografia obsługuje:

-   Political,
-   Population,
-   Economy,
-   Resources,
-   Trade,
-   Technology,
-   Development,
-   Stability,
-   Δ Change.

Asset bazowy nie może wymuszać konkretnego Map Mode.

## Population

Marker size = population.

## Economy

Kolor/intensywność = gospodarka/produkcja zgodnie z Read Model.

## Resources

Pokazuje wybrany zasób, eksploatację i wyczerpanie.

## Trade

Podkreśla połączenia i przepływy.

## Technology

Pokazuje adopcję/dyfuzję.

## Development

Podkreśla urbanizację/infrastrukturę.

## Stability

Pokazuje rzeczywiste dane stabilności/presji dostępne w modelu.

## Δ Change

Pokazuje zmianę w wybranym okresie, a nie stan bieżący.

------------------------------------------------------------------------

# 15. Overlays

Niezależne od Map Modes:

-   settlements,
-   roads,
-   railways,
-   rivers,
-   region borders,
-   names,
-   resource deposits,
-   events,
-   trade flows,
-   migration,
-   technology diffusion.

Domyślnie nie pokazujemy wszystkich dynamicznych przepływów.

------------------------------------------------------------------------

# 16. Flow rendering

Normalny World:

**bez flow spaghetti.**

Przepływy pojawiają się kontekstowo.

Flow Lens:

-   Top 3 --- default,
-   Top 5,
-   All.

Grubość linii = wolumen.

Kierunek = subtelny marker/chevron.

Przy dużym zoom-out przepływy są agregowane.

------------------------------------------------------------------------

# 17. Region Vignette Composition

Region Vignette jest składany proceduralnie.

Przykład:

``` text
RegionVisualProfile:
terrain = mountains
vegetation = sparse_forest

settlement:
population = 124300
urbanization = 0.224

resources:
iron = present
coal = present

extraction:
iron = developed
coal = small

industry:
metallurgy = developed

infrastructure:
road = true
rail = true

processes:
industrialization = strong
migration = inflow
```

Renderer dobiera:

-   terrain,
-   settlement scale,
-   era,
-   extraction assets,
-   industry assets,
-   infrastructure,
-   stan/intensywność.

Nie tworzymy `Ironridge.png`.

------------------------------------------------------------------------

# 18. Zasada zmian w czasie

Ten sam region powinien móc wyglądać np.:

### Rok A

``` text
village
dirt road
small iron extraction
forest dominant
```

### Rok B

``` text
town
road
developed mine
workshop/manufactory
```

### Rok C

``` text
city
rail
industrial mine
large metallurgy plant
```

### Rok D

``` text
metropolis
modern transport
mine declining/depleted
advanced industry/services
```

Celem jest możliwość rozpoznania transformacji bez czytania tabel.

------------------------------------------------------------------------

# 19. Wymagania techniczne assetów

Finalne wartości powinny zostać zweryfikowane w rendererze, ale
obowiązują zasady:

-   transparent background dla obiektów nakładanych,
-   brak baked UI text,
-   brak baked labels,
-   brak baked shadows, które kolidują z terenem,
-   spójny kierunek światła,
-   spójna perspektywa,
-   spójna grubość konturu,
-   ograniczona paleta,
-   czytelność po zmniejszeniu,
-   asset nie może zależeć od konkretnego regionu.

Preferować źródła master w większej rozdzielczości niż runtime asset.

Eksport runtime może być przygotowany w kilku skalach, jeśli renderer
tego wymaga.

------------------------------------------------------------------------

# 20. Produkcja assetów --- kolejność

## Pack 01 --- Terrain & Environment

Cel: stworzenie rzeczywistej podstawy Atlasu.

## Pack 02 --- Settlements

Cel: pełna progresja Hamlet → Global Megacity.

## Pack 03 --- Transport

Cel: historyczna ewolucja dróg, kolei, mostów, portów.

## Pack 04 --- Resource Extraction

Cel: różne sylwetki typów wydobycia + stany.

## Pack 05 --- Industry

Cel: sektory rozpoznawalne po sylwetce + skala/era/state.

## Pack 06 --- Infrastructure & Special

Cel: obiekty pomocnicze i specjalne.

## Pack 07 --- Markers & Overlays

Cel: symbole mapowe, focus, eventy i dane kontekstowe.

------------------------------------------------------------------------

# 21. Production Pack workflow

Dla każdej rodziny:

1.  przygotowanie Style Anchor,
2.  review zgodności z v0.3,
3.  korekta,
4.  zatwierdzenie,
5.  generacja wariantów,
6.  cleanup,
7.  eksport,
8.  integracja w rendererze,
9.  screenshot test,
10. final acceptance.

Nie generować całej rodziny przed zatwierdzeniem pierwszych
reprezentatywnych anchorów.

------------------------------------------------------------------------

# 22. Test region

Pierwszym obowiązkowym testem składania jest region o profilu zbliżonym
do:

``` text
terrain = mountains
vegetation = sparse_forest
population = ~100k+
resources = iron + coal
extraction = developed
industry = metallurgy
infrastructure = road + rail
state = industrializing
```

Testujemy minimum trzy momenty rozwoju tego samego regionu.

PASS, jeżeli bez czytania szczegółowych statystyk widać:

-   wzrost osady,
-   rozwój infrastruktury,
-   wzrost przemysłu,
-   rozwój wydobycia,
-   późniejszy schyłek/zmianę tam, gdzie model to przewiduje.

------------------------------------------------------------------------

# 23. Acceptance Gates

## VIS-01 --- Style consistency

Wszystkie assety wyglądają jak część jednej biblioteki.

## VIS-02 --- Distinctiveness

Extraction i Industry nie są serią niemal identycznych budynków.

## VIS-03 --- Scale readability

Hamlet, City, Metropolis i Megacity są czytelnie różne.

## VIS-04 --- Era readability

Zmiana technologiczna jest widoczna.

## VIS-05 --- State readability

Active / declining / depleted lub closed można odróżnić.

## VIS-06 --- Semantic zoom

Assety pozostają czytelne na właściwym poziomie zoomu.

## VIS-07 --- World compatibility

Assety nie konkurują z Map Modes, markerami i WHY?.

## VIS-08 --- Anti-AI

Brak losowej dekoracyjności, niespójnych detali i „concept-art drift".

## VIS-09 --- Data integrity

Grafika nie sugeruje stanu, którego nie ma w danych.

## VIS-10 --- Historical transformation

Ten sam region w różnych okresach wizualnie pokazuje realną zmianę
symulacji.

------------------------------------------------------------------------

# 24. Zakres Vertical Slice

Nie trzeba produkować kompletnej biblioteki dla wszystkich możliwych
przyszłych technologii i produktów przed VS.

Do VS produkować:

-   wszystkie rodziny terenu występujące w VS,
-   wszystkie poziomy osad potrzebne do testów skali,
-   transport dostępny w okresie VS,
-   extraction faktycznie używane przez Production Economy VS,
-   industry faktycznie używane przez Production Economy VS,
-   markery i overlays potrzebne Golden UI #1.

Architektura pozostaje rozszerzalna.

------------------------------------------------------------------------

# 25. Relacja z Golden UI #1 --- World

Golden UI #1 określa:

-   kompozycję,
-   hierarchię,
-   zachowanie mapy,
-   Map Modes,
-   Overlays,
-   population marker scaling,
-   Recent Events,
-   WHY?,
-   Timeline.

Visual Asset Library określa:

-   jak wygląda świat znajdujący się wewnątrz Living Atlasu.

Żaden asset nie może zmienić hierarchii Golden UI.

------------------------------------------------------------------------

# 26. Następny krok po zatwierdzeniu dokumentu

Po przyjęciu v1.0:

1.  zachować Visual Asset Library v0.3 jako referencję,
2.  rozpocząć **Production Pack 01 --- Terrain & Environment**,
3.  przygotować reprezentatywne terrain anchors,
4.  zatwierdzić je przed produkcją całego packa,
5.  zintegrować z Living Atlas,
6.  wykonać screenshot audit w Golden UI #1,
7.  przejść do Pack 02 --- Settlements.

------------------------------------------------------------------------

## Definition of Done --- Visual Asset System

System można uznać za gotowy dla Vertical Slice, gdy:

-   Living Atlas korzysta z prawdziwych produkcyjnych assetów,
-   osady wizualnie skalują się od małych do 10M+,
-   wielkość markera World wynika z populacji,
-   extraction ma rozpoznawalne typy i stany,
-   industry ma rozpoznawalne sektory, skale i epoki,
-   infrastruktura wizualnie ewoluuje,
-   Region Vignette składa się proceduralnie,
-   zmiany świata są widoczne bez czytania tabel,
-   Golden UI #1 pozostaje czytelne,
-   assety spełniają zasady Anti-AI,
-   wszystkie użyte elementy wynikają z rzeczywistych danych symulacji.

> **A changing world leaves traces.**

------------------------------------------------------------------------

# 27. v1.2 --- canonical Raw Simulation Atlas integration

## 27.1 Production direction

The earlier illustrated Visual Asset Library is no longer a
production-style authority. It may be retained as an archive of
categories and exploration only.

The production Atlas is based on:

`SIMULATION STATE → READ MODEL → VISUAL PROFILE → VISUAL ALPHABET → PIXIJS RENDERER`

The renderer must not use the reference PNGs as baked map backgrounds.

## 27.2 Visual hierarchy

Canonical priority:

`SIMULATION DATA > CIVILIZATION > GEOGRAPHY > DECORATION`

Decoration without information has zero production priority.

## 27.3 Geography

Geography uses restrained cartographic primitives:

-   flat/muted fills,
-   thin coastline and river linework,
-   controlled hatching/relief,
-   sparse repeated vegetation marks,
-   quiet plains and low-information areas,
-   no fantasy-map ornament.

## 27.4 Civilization

Civilization is encoded by authored symbols and procedural combinations.
Settlement size must visibly scale with population. Extraction and
industry must preserve distinctive structural silhouettes at
Region/Local zoom while remaining abstract at World zoom.

## 27.5 Events and causality

Events are localized when simulation data supplies a location. Causality
is shown only in contextual focus. Canonical interaction:

`EVENT → SHOW ON MAP → SELECT/FOLLOW → WHY?`

No inferred location and no invented causal edge is permitted.

## 27.6 Stress-test gate

Before expanding the production alphabet, implement one representative
region in four states:

`EARLY → DEVELOPING → INDUSTRIAL → MODERN`

Then render the same geography under available:

`POPULATION | ECONOMY | RESOURCES | TRADE | TECHNOLOGY | Δ CHANGE`

PASS requires that the base map remains subordinate to the selected data
layer and that the same region remains recognizable across time.

> **v1.3:** kryterium PASS rozszerza §28.7 (Visual Verification Gate).
> Rozróżnialność etapów i trybów wyłącznie przez etykietę, liczbę w
> etykiecie lub liczbę identycznych bloków nie spełnia bramki.

------------------------------------------------------------------------

# 28. v1.3 --- wymagania po niezależnym audycie 2026-09-26

**Status:** CANONICAL --- wymagania (Canonical Decisions `UI-015`).
Sekcja nie implementuje niczego i nie projektuje nowego Entity Data
Model. Opisuje, co kontrakt Read Model → wizualizacja musi docelowo
umożliwiać. Źródło stanu faktycznego:
`FIRST-CAUSE-World-Atlas-Independent-Audit-2026-09-26.md`.

## 28.1 Wiele elementów regionu naraz (RegionVisualProfile v2)

Region może jednocześnie posiadać np. kopalnię, hutę, tartak, drogę,
kolej i wydobycie żelaza. Atlas musi móc przedstawić je **równocześnie**.
Pojedyncza wartość typu `industry = mine` nie jest docelowym
ograniczeniem reprezentacji.

Docelowo kontrakt wizualny regionu powinien móc niezależnie wyrażać co
najmniej:

``` text
industry[]      — rodzina sektora + skala + stan, wiele pozycji
extraction[]    — rodzina metody wydobycia + stan, wiele pozycji
transport / infrastructure per connection — poziom na krawędzi, nie na węźle
```

lub równoważny model zgodny z istniejącą architekturą Read Models.
Wymagania:

-   wszystkie pola wynikają z istniejących danych (`NO DECORATION
    WITHOUT INFORMATION`, VIS-09); brak danych = brak pola, nie
    domysł,
-   rodzina metody wydobycia i rodzina sektora wynikają z danych
    contentu (JSON + Zod), nie z gałęzi kodu per zasób / firmę / region
    (AGENTS.md reguły 7--8),
-   progi skali/stanu są konfigurowalne i oznaczone `TODO tuning`,
-   rozszerzenie nie zmienia Simulation Model, determinizmu, RNG ani
    formatu zapisu.

## 28.2 Morfologia osad

Rozwój osady nie może być przedstawiany wyłącznie jako „więcej
identycznych kwadratów w większej siatce”. Reprezentacja komunikuje
zmianę **struktury**. Semantyka kierunkowa (zasada wizualna, nie
specyfikacja renderera):

``` text
Hamlet      → małe skupisko
Village     → rozwój wzdłuż lokalnego układu komunikacyjnego
Town        → wyraźniejszy rdzeń
City        → rdzeń + dzielnice / struktura gospodarcza
Metropolis  → złożona, wielocentryczna struktura
```

Układ jest deterministyczny (np. z `vignetteSeed`), mieści się w
znaczniku selekcji i nie sugeruje funkcji, których nie ma w danych.
Kategorie §4A.1 / §6.1 pozostają źródłem klas.

**Implementacja `M21-VIS-R3` (2026-09-27, HUMAN VISUAL ACCEPTED ---
reguły kanoniczne: §4A.1 „Morfologia osad”):** sześć klas morfologii grupuje kategorie §4A.1
bez zmiany ich granic (Hamlet < 500; Village 500--5k; Town 5k--50k;
City 50k--500k; Metropolis 500k--5M; Megacity 5M+). Znak składa się z
pięciu autorskich prymitywów: ślad zabudowy (stały rozmiar), skupisko
śladów (dzielnica), łamana oś komunikacyjna (nigdy przez środek osady),
obszar zabudowy (kryjący odcień z konturem sumy płatów) i rdzeń.
Struktura według klasy: przysiółek --- 2 oddalone ślady albo skupisko
4 śladów ze ścieżką; wieś --- zabudowa wzdłuż drogi; miasteczko ---
rdzeń w zwartej zabudowie z osiami wzrostu; miasto --- rdzeń +
dzielnice; metropolia --- dwa zrośnięte płaty, rdzeń główny i wtórny;
megacity --- 4--5 płatów z własnymi rdzeniami połączonymi w łańcuch i
osady satelitarne. *R3.1 (2026-09-27):* miasto = jeden główny rdzeń w
głównym obszarze zabudowy + 2--3 dzielnice jako osobne płaty o różnej
wielkości (pierwsza zrośnięta przewężeniem, kolejne za wąską przerwą),
połączone z rdzeniem łamanymi osiami kończącymi się w środku dzielnicy
--- różnica Town → City widoczna już na WORLD; osie zewnętrzne megacity
kończą się na osadach satelitarnych (w obrębie śladu), nie w pustej
przestrzeni. Wariant: 3 autorskie układy × lustro, wybierane
stabilnym hashem id osady (bez RNG). Semantic zoom zmienia tylko ilość
zabudowy, nie klasę ani szkielet. Region ≠ osada: pole regionu to
teren, osady są elementami wewnątrz; wiele osad w regionie układanych
jest bez nakładania (budżet WORLD / REGION / LOCAL = 3 / 6 / 12,
nadmiar agregowany jako kropki „+n”). Kod:
`apps/desktop/src/features/world/settlement-morphology.ts`,
`atlas-grammar.ts` (`layoutSettlements`). Prymitywy dopisane do §4A.1
po akceptacji wizualnej (2026-09-27).

## 28.3 Skalowanie populacji

Wizualny rozwój osady nie kończy się przy ok. 100 000 mieszkańców.
System musi rozróżniać szeroki zakres, np.:

``` text
100 · 1 000 · 10 000 · 100 000 · 1 000 000 · 10 000 000+
```

Skalowanie nie jest liniowe: logarytmiczne / semantyczne, połączone ze
zmianą morfologii (§28.2). Ograniczenie maksymalnego rozmiaru znacznika
jest dozwolone (§6.2), ale górna granica nie może zrównywać klas
City / Metropolis / Megacity --- rozróżnienie niesie wtedy morfologia.
Legenda skali wynika z faktycznego zakresu danych, nie ze stałych
wartości.

**Implementacja `M21-VIS-R3` (2026-09-27):** promień śladu osady to
odcinkowo liniowa funkcja log10 populacji (`TODO tuning`): 10 → 3.5 ·
100 → 5.5 · 1k → 8.5 · 10k → 12.5 · 100k → 17.5 · 1M → 23 · 10M → 30 ·
≥ 100M → 33 (limit; jednostki diagramu, pole regionu ma promień 58).
10M zajmuje ~27% pola regionu. Najmniejsze osady mają minimalny
promień ekranowy 7 px (powiększenie ≤ ×1.6, tylko gdy ślad byłby
mniejszy), więc nie znikają przy oddaleniu, a kolejność rozmiarów
pozostaje monotoniczna. Legenda „Skala osadnictwa” pokazuje próbki klas
od najmniejszej do największej obecnej w danych. Tryb Population:
`M21-VIS-R4` (§28.5) --- morfologia pozostaje, pierścień skali dochodzi
jako warstwa trybu.

## 28.4 Semantic Zoom --- poziom WORLD

Uzupełnia §13 i Design System v1.4 §69:

-   poziom WORLD nie może być niemal pustym diagramem kropek i linii,
-   już na WORLD gracz odczytuje podstawową strukturę cywilizacji:
    klasę osady, obecność przemysłu / wydobycia, poziom połączeń,
-   na HIGH DENSITY warstwa osad jest **agregowana**, nigdy całkowicie
    ukryta,
-   zoom dodaje szczegóły; nie ujawnia dopiero istnienia podstawowych
    elementów świata,
-   symbole profilu nie są dostępne wyłącznie po selekcji lub zbliżeniu.

## 28.5 Map Modes v2 --- rozróżnialność semantyczna

Uzupełnia §14:

-   każdy Map Mode ma **własne kodowanie** (kolor/rampa, kształt,
    grubość krawędzi, przygaszenie warstw) --- dwa tryby nie mogą
    różnić się wyłącznie liczbą w etykiecie,
-   warstwa cywilizacji pozostaje widoczna i przygaszona; tryb nie
    zamienia gramatyki symbolu osady na inną (np. bloki → koło),
-   każdy tryb ma legendę opisującą aktywne kodowanie, kierunek skali
    (np. czy wyższa presja = gorzej) i jednostkę,
-   **„zero” ≠ „brak danych”**: oba stany mają różne, jawne
    oznaczenie,
-   normalizacja intensywności nie może ukrywać skali absolutnej
    (np. jeden region zawsze „100%”),
-   tryb bez danych w Read Models jest disabled, nie fabrykowany.

Kierunkowe kodowania (do potwierdzenia w implementacji, w granicach
Visual Alphabet v1.1 §8): Economy --- rampa wartości; Resources ---
kształt klasy zasobu + wielkość złoża; Trade --- grubość i kierunek
krawędzi; Technology --- znaki poziomu; Development --- infrastruktura
krawędzi; Stability --- rampa presji z jawnym kierunkiem; Δ Change ---
skala rozbieżna; Population --- rozmiar + zmiana.

**Implementacja `M21-VIS-R4` --- Population (2026-09-29, PENDING HUMAN
VISUAL ACCEPTANCE):** Terrain odpowiada „co jest w regionie”,
Population „gdzie żyją ludzie i ilu ich jest”, morfologia R3 „jak ta
ludność jest osadzona”. **Pierścień populacji = skala populacji
regionu; morfologia osad = struktura osadnictwa** --- pierścień nie jest
symbolem osady ani obrysem zaznaczenia.

-   Pierścień: neutralny kontur (`ink`, 0.9, krycie 0.6; R4.1) z
    lekkim wypełnieniem (10%) --- czytany jako ilość, nie granica ---
    rysowany pod morfologią; bez gradientu, glow, rampy
    kolorów i semantyki dobry / zły. Promień = 1.4 × ślad osady §28.3
    dla populacji regionu (log, monotoniczny, limit 46.2 j. ≈ 1.4 ×
    limit śladu, ≈ 80% pola regionu), zawsze z odstępem od śladu
    największej osady (nie przecina morfologii). Na ekranie: promień +
    stały dodatek 5 px (R4.1), więc małe rzędy wielkości pozostają
    rozróżnialne przy oddaleniu. `TODO tuning`.
-   Morfologia w trybie Population: ta sama klasa, wariant i prymitywy
    co w Terrain, neutralny atrament (bez kodowania kolorem).
-   Priorytet: pierścień + wartość; morfologia czytelna, lekko wtórna;
    nazwa, trasy i woda do orientacji; rzeźba, roślinność, przemysł i
    wydobycie przygaszone. Etykieta regionu stoi poza pierścieniem.
-   Zaznaczenie regionu w trybie Population: cztery narożniki w
    kolorze akcentu zaznaczenia (2 px) --- kształt inny niż okrąg, więc
    nie myli się z pierścieniem (R4.1).
-   `0` (znana wartość): pełny cienki pusty kontur + „0 ·
    niezamieszkany”. Brak danych: przerywany kontur `muted` + „— ·
    brak danych”, bez koloru ostrzegawczego. Nigdy `population || 0`.
    Minimalny rozmiar ekranowy obu znaczników 7 px (R4.1).
-   Wartość przy regionie w zapisie zwartym (`1.2K`, `12M`; locale);
    pełna liczba w inspektorze.
-   Legenda trybu (te same prymitywy co mapa): rzędy wielkości
    pierścieni z zakresu danych (~100 … ~10M+), „0 = niezamieszkany”,
    „— = brak danych o populacji”. Podpis trybu: „Populacja regionu ·
    skala logarytmiczna”.
-   Brak danych jest dziś kontraktem prezentacji (symulacja zawsze zna
    populację); rzeczywista obsługa wymaga formalnego poszerzenia typu
    Read Modelu, gdy pojawi się źródło nieznanej populacji.
-   Poza zakresem: gęstość (do M22), heatmapa, migracja, struktura
    demograficzna.

**Opuszczona osada (SET-LIFECYCLE-001, 2026-09-29):** osada ABANDONED
nie ma aktywnej morfologii (Hamlet … Megacity) i nie trafia do listy
osad widoku regionu; region pozostaje. Region z populacją 0 w trybie
Population jest pokazywany zgodnie z §28.5 (pełny pusty znacznik +
„0 · niezamieszkany”). Grafika ruin / opuszczonych miast nie jest
częścią tego etapu.

## 28.6 Transport na połączeniach

Infrastruktura transportowa (trail / road / railway / highway i ich
odpowiedniki z §8) jest rysowana **na krawędziach między regionami**
zgodnie z poziomem połączenia, a nie jako znacznik pod osadą.

## 28.7 Visual Verification Gate

Odbiór Atlasu (Roadmap v0.6 `M21-VIS-R6`) wymaga zestawu dowodów:

1.  **1920×1080** --- ekran World,
2.  **prawdziwy viewport 1280×800** --- screenshot viewportu, nie
    `fullPage`; `fullPage` nie jest substytutem tego testu,
3.  WORLD bez zaznaczonego regionu i WORLD z zaznaczonym regionem,
4.  macierz **4 etapy rozwoju × 8 Map Modes** (`EARLY / DEVELOPING /
    INDUSTRIAL / MODERN` × `Population / Economy / Resources / Trade /
    Technology / Development / Stability / Δ Change`),
5.  stany **wzrostu, stagnacji oraz decline / depleted** (VIS-05),
6.  region testowy zgodny z §22 (iron + coal, metallurgy, road + rail),
7.  prawdziwy świat (nie tylko fixture) na domyślnym poziomie zoomu.

PASS wymaga, aby bez czytania etykiet etapu i liczb:

-   etapy różniły się strukturą osady, przemysłu, wydobycia i połączeń,
-   każdy Map Mode był rozpoznawalny wizualnie,
-   stan decline / depleted był odróżnialny od active,
-   Atlas pozostał dominującą powierzchnią ekranu (Golden UI World v1.3
    §26.2).

Fixture wizualny musi być zgodny z produkcyjnymi typami Read Models i
jawnie oznaczony jako dane deweloperskie (UI Implementation Spec v1.4).

## 28.8 Status

-   **Spec:** READY.
-   **Implementacja:** NIE SPEŁNIA --- audyt 2026-09-26 (BLOCKER B1, B2;
    HIGH H2, H3). Kontynuacja: Roadmap v0.6 `M21-VIS-R2`...`R6`.
    §28.2--§28.4: `M21-VIS-R3` / `R3.1` --- DONE, HUMAN VISUAL
    ACCEPTED (2026-09-27).
