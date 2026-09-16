# FIRST CAUSE — UI Visual Design System v1.0

**Status:** CANONICAL / FROZEN IMPLEMENTATION BASELINE
**Projekt:** FIRST CAUSE
**Wersja:** 1.0
**Rola:** kanoniczny kontrakt wizualny i implementacyjny UI FIRST CAUSE dla człowieka, Codexa, Claude Code i innych agentów. Wersja 1.0 zamraża kierunek po Golden UI Review, dwóch rundach benchmarku oraz finalnej walidacji WCC i World Economy.  
**Zakres wersji historycznych:** sekcje v0.5/v0.6 RC poniżej zachowują
historię ustaleń; bieżącą wersją dokumentu jest v1.0.

**Dostępność Golden UI (2026-09-16):** opisane referencje graficzne
nie są dołączone ani podlinkowane w repo. Należy je udostępnić przed
review zgodności wizualnej. Obowiązują tekstowe reguły v1.0; status
zamrożenia kierunku nie oznacza wykonanego odbioru implementacji.

> **Interfejs FIRST CAUSE ma wyglądać jak świadomie zaprojektowane narzędzie do obserwacji świata: atlas, terminal analityczny, archiwum historyczne i laboratorium przyczynowości — nie jak dashboard SaaS ani demonstracja możliwości AI.**


## Changelog v1.0

Wersja 1.0 zamraża kierunek po walidacji v0.6 RC. Nie wprowadza nowej filozofii UI. Dodaje ostatni brakujący kontrakt skalowania Living Atlasu, zamyka Consistency Audit i ustanawia reguły pierwszeństwa dla implementacji.

Najważniejsze zmiany względem v0.6 RC:

- dodano `Atlas Density & Semantic Zoom Rules`,
- zdefiniowano trzy tryby gęstości: `LOW / MEDIUM / HIGH`,
- zdefiniowano przejście `cluster → region → settlement/local`,
- ustalono reguły label budget, anomaly priority i flow aggregation,
- potwierdzono finalny kierunek WCC v0.6 i World Economy v0.6,
- przeprowadzono Consistency Audit v0.6 RC → v1.0,
- Design System otrzymuje status **CANONICAL / FROZEN IMPLEMENTATION BASELINE**.


## Changelog v0.6 RC

Wersja v0.6 RC zachowuje Golden UI i Component Library z v0.5, a następnie wprowadza korekty wynikające z benchmarku UI gier symulacyjnych i strategicznych. Nie zmienia filozofii produktu ani architektury informacji. Wzmacnia rozpoznawalność FIRST CAUSE jako **Living Scientific Atlas**, a nie generycznego dashboardu.

Najważniejsze zmiany:

- `Procedural Region Visual Identity` staje się filarem tożsamości wizualnej świata, a nie opcjonalną dekoracją,
- `WHY? / Trace Cause` staje się globalnym wzorcem interakcji dla istotnych trendów, zdarzeń i zmian,
- reguła `Whitespace first → Rule second → Panel third → Card last` staje się twardym wymogiem,
- dodatkowo ograniczona zostaje ikonografia dekoracyjna,
- Living Atlas otrzymuje zasadę **controlled cartographic imperfection**,
- obowiązuje reguła **The world moves; the UI stays calm**,
- World Economy zostaje przeorientowane na większy Economic Atlas i mniejszą liczbę równorzędnych wykresów,
- Architect mocniej rozdziela `Guaranteed / Direct Effects` od `Possible Propagation`,
- Golden UI v0.5 pozostają referencją kompozycyjną, ale WCC i World Economy wymagają interpretacji zgodnej z korektami v0.6 RC.

W przypadku konfliktu z v0.5 reguły w sekcji **v0.6 RC Supersession Rules** mają pierwszeństwo.

## Changelog v0.5

Wersja v0.5 zachowuje wcześniejszy kierunek wizualny i dodaje decyzje wynikające z zaakceptowanych Golden UI oraz Component Library v1.

Najważniejsze zmiany:

- zamrożenie Golden UI #1–#6 jako wzorców kierunkowych,
- Region Detail = hybryda `Overview dossier + domenowe Deep Dive`,
- Economy Deep Dive jako wzorzec zakładek analitycznych,
- WHY? = centralny causal graph + supporting causes + counter-pressure + causal timeline,
- World Chronicle oddzielone od Region History,
- Architect = laboratory workflow `Current → Proposed → Direct Effects → Potentially Affected`,
- World Economy = global metrics + Economic Atlas + markets/trade/trends,
- dodanie `FC Component Library v1`,
- wzmocnienie zasady **mniej ikon**,
- wzmocnienie zasady **mniej kart**,
- wprowadzenie reguły `Whitespace first → Rule second → Panel third → Card last`,
- agent nie może tworzyć nowego wzorca wizualnego, jeśli istniejący komponent FC może przekazać informację bez utraty znaczenia.

W przypadku konfliktu z wcześniejszym fragmentem tego dokumentu decyzje oznaczone w sekcji **v0.5 Supersession Rules** mają pierwszeństwo.

---

## 1. Relacja z istniejącą dokumentacją

Niniejszy dokument rozwija warstwę wizualną `FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1.md` i nie zmienia architektury informacji ani zasad własności danych.

Obowiązują istniejące założenia:

- UI jest **text-first**,
- Region pozostaje podstawową jednostką nawigacji,
- World Command Center jest głównym ekranem obserwacji,
- Living Atlas / World Network jest abstrakcyjną reprezentacją świata,
- UI korzysta z Read Models i Commands,
- Chronicle prezentuje fakty historii, ale ich nie tworzy,
- WHY? prezentuje rzeczywiste łańcuchy przyczynowe,
- Architect zmienia warunki, a nie gwarantowane rezultaty.

---

# 2. Nadrzędny kierunek wizualny

FIRST CAUSE powinno wizualnie łączyć:

- **70% — atlas naukowy / raport / terminal analityczny,**
- **20% — archiwum / kronika historyczna,**
- **10% — klasyczny interfejs gry strategiczno-symulacyjnej.**

Interfejs ma być spokojny, uporządkowany, informacyjny i rozpoznawalny.

Nie dążymy do „futurystycznego” wyglądu.

Nie dążymy do maksymalnej dekoracyjności.

Nie dążymy do wyglądu typowego produktu SaaS.

### 2.1 Hasło projektowe

> **INFORMATION BEFORE DECORATION.**

Każdy element wizualny powinien przekazywać informację, hierarchię, stan albo relację.

Jeżeli jego jedyną funkcją jest „żeby ekran wyglądał ciekawiej”, należy rozważyć jego usunięcie.

---

# 3. Tryb kolorystyczny

## 3.1 Domyślny motyw

**FIRST CAUSE używa jasnego interfejsu jako głównego i kanonicznego motywu.**

Podstawą jest ciepłe, lekko złamane białe tło zamiast czystej laboratoryjnej bieli.

UI powinien przypominać połączenie:

- papierowego atlasu,
- raportu statystycznego,
- dokumentu archiwalnego,
- profesjonalnego narzędzia analitycznego.

Dark Mode może zostać dodany później, ale nie jest punktem odniesienia dla projektu v0.3.

## 3.2 Paleta bazowa

Rekomendowany zestaw tokenów:

```css
--fc-bg:             #F3F1E9;
--fc-bg-elevated:    #FAF9F5;
--fc-surface:        #FFFFFF;
--fc-surface-muted:  #ECE9DF;

--fc-text:           #20231F;
--fc-text-secondary: #65675F;
--fc-text-muted:     #8A8B83;

--fc-border:         #C9C6BA;
--fc-border-strong:  #88887E;

--fc-accent:         #75683E;
--fc-accent-soft:    #E3DDC7;

--fc-positive:       #4F7153;
--fc-warning:        #9A722E;
--fc-negative:       #984F43;
--fc-info:           #536D78;
```

Dokładne wartości mogą zostać dostrojone po testach ekranów, ale charakter palety jest obowiązujący:

**ciepły biały + grafit + oliwka/ochra + stonowane kolory semantyczne.**

## 3.3 Czego nie używać

Domyślnie zabronione:

- neonowy cyan,
- neonowy fiolet,
- electric blue jako dominujący akcent,
- intensywny gradient purple-blue,
- czyste RGB red/green jako zwykłe statusy,
- wiele mocno nasyconych kolorów jednocześnie.

---

# 4. Kolor jako informacja

Kolor nie jest dekoracją.

Preferowane znaczenia:

| Znaczenie | Kierunek |
|---|---|
| neutral | grafit / szarość |
| selection | oliwkowy / ziemisty accent |
| growth / improvement | stonowana zieleń |
| warning / scarcity | ochra |
| decline / critical | ceglasty |
| informational | stalowy błękit |
| Architect influence | główny accent projektu |

Nie należy kodować dwóch niezależnych znaczeń tym samym kolorem.

Czerwony nie oznacza automatycznie każdej wartości ujemnej. Powinien być rezerwowany dla informacji rzeczywiście istotnej.

---

# 5. Typografia

Typografia jest jednym z podstawowych elementów tożsamości FIRST CAUSE.

## 5.1 Trzy role fontów

### UI / BODY — IBM Plex Sans

Użycie:

- menu,
- tekst UI,
- przyciski,
- tabele,
- tooltipy,
- opisy,
- formularze,
- nagłówki operacyjne.

### DATA — IBM Plex Mono

Użycie:

- wartości liczbowe,
- daty,
- tick,
- seed,
- identyfikatory,
- ceny,
- procenty,
- dane tabelaryczne,
- techniczne statusy.

### HISTORY — Source Serif 4

Użycie selektywne:

- Chronicle,
- duże historyczne nagłówki,
- retrospektywne opisy wydarzeń,
- cytaty / historyczne podsumowania.

Serif nie powinien dominować w zwykłym UI.

## 5.2 Hierarchia

Rekomendowana skala desktopowa:

```text
Display / Chronicle title   28–34 px
Screen title                24 px
Section title               16–18 px
Subsection                  14–16 px
Body                        13–14 px
Table / data                12–13 px
Metadata                    11–12 px
Micro label                 10–11 px
```

## 5.3 Zasady

- Nie używać wielu wag bez potrzeby.
- Preferować Regular / Medium / Semibold.
- Bold tylko dla wyraźnej hierarchii.
- Nie używać ogromnych marketingowych nagłówków.
- Dane liczbowe powinny zachowywać stabilną szerokość i wyrównanie.
- Uppercase stosować głównie w małych labelach i nazwach sekcji.

---

# 6. Grid i spacing

Podstawowa jednostka spacingu:

**4 px**

Najczęstsze wartości:

```text
4
8
12
16
24
32
48
```

Preferowane:

- 8 px między elementami silnie powiązanymi,
- 16 px między grupami,
- 24–32 px między sekcjami.

Nie zwiększać paddingu tylko po to, aby ekran wyglądał „premium”. FIRST CAUSE jest grą informacyjną i musi efektywnie wykorzystywać przestrzeń.

---

# 7. Geometria

## 7.1 Border radius

Kanonicznie:

```text
0 px — tabele, sekcje, większość paneli
2 px — drobne kontrolki
3–4 px — wyjątkowo większe elementy interaktywne
```

Nie stosować powszechnie `12px`, `16px`, `24px`.

## 7.2 Borders

Preferowane są cienkie linie:

```text
1 px neutral border
1 px strong border
2 px selection/accent — tylko tam, gdzie potrzebne
```

Separatory są ważniejszym narzędziem kompozycji niż osobne karty.

---

# 8. Panele zamiast kart

FIRST CAUSE nie powinno być zbudowane z setek niezależnych kart.

Preferowana struktura:

```text
SECTION TITLE
────────────────────────────────────
row
row
row

NEXT SECTION
────────────────────────────────────
...
```

Karta jest dozwolona, jeśli element faktycznie stanowi osobną jednostkę funkcjonalną, np. interwencję Architekta albo wpis Chronicle.

Nie tworzyć karty tylko dlatego, że dana liczba ma własny label.

---

# 9. Przyciski

Preferowany charakter:

```text
[ PAUSE ]
[ ×1 ]
[ ×4 ]
[ TRACE CAUSES ]
[ APPLY INTERVENTION ]
```

Przyciski:

- prostokątne,
- płaskie,
- bez gradientów,
- bez glow,
- z czytelnym stanem hover/focus/disabled.

Primary action może używać głównego accentu.

Secondary action powinien najczęściej być outline/text.

---

# 10. Ikony

Ikony są pomocnicze, nie dominujące.

Zasady:

- jedna spójna rodzina,
- monochromatyczne,
- proste,
- zwykle 14–20 px,
- bez pseudo-3D,
- bez kolorowych ikon dla każdej kategorii.

Tekst ma pierwszeństwo przed ikoną.

### Zakaz

Nie używać emoji jako elementów normalnego UI.

---

# 11. Tabele i listy danych

Tabele są pełnoprawnym elementem estetyki FIRST CAUSE.

Preferowane:

- mało obramowań pionowych,
- subtelne linie poziome,
- wyrównane kolumny,
- liczby wyrównane do prawej,
- wartości liczbowe w IBM Plex Mono,
- mały, jednoznaczny wskaźnik trendu.

Przykład:

```text
REGION               POPULATION     10Y       STATUS
────────────────────────────────────────────────────
Black Mountain           18,421     +4.8%     Growth
Riverland                31,805     +1.2%     Stable
Eastfield                12,109     -3.4%     Decline
```

---

# 12. Wykresy

Wykresy mają służyć analizie.

Dozwolone:

- line chart,
- area chart tylko przy rzeczywistej potrzebie,
- bar chart,
- stacked bar,
- scatter,
- proste timeline,
- sparklines.

Unikać:

- 3D,
- glow,
- gradient fill,
- decorative animation,
- donut chartów używanych do każdej wartości,
- wielokolorowych wykresów bez potrzeby.

Osie i grid powinny być subtelne.

Kolor powinien rozróżniać serie lub znaczenie danych.

---

# 13. World Command Center

World Command Center powinien przypominać **stół obserwacyjny świata**, nie stronę startową aplikacji.

Priorytet wizualny:

1. stan świata,
2. Living Atlas / World Network,
3. Important Now,
4. zmiany i trendy,
5. historia / causal thread / Architect legacy.

Nie zaczynać ekranu od rzędu dużych KPI cards.

Agregaty prezentować jako zwartą sekcję danych.

---

# 14. Living Atlas / World Network

Living Atlas jest jednym z głównych elementów tożsamości wizualnej FIRST CAUSE.

Nie powinien udawać realistycznej mapy, jeśli World State nie posiada takich danych.

## 14.1 Region node

Węzeł może pokazywać:

```text
017
BLACK MOUNTAIN
18.4k
MINING ↑
```

Nie każdy poziom zoom musi pokazywać wszystkie informacje.

## 14.2 Connections

Przykładowy język:

```text
──── normal connection
════ high capacity
┄┄┄┄ disrupted / constrained
```

Grubość może reprezentować capacity albo flow — nigdy oba bez jasnego przełącznika.

## 14.3 Overlay

Jeden główny overlay jednocześnie.

Kolor i wielkość węzłów mają znaczenie semantyczne.

Nie stosować efektów glow wokół regionów.

---

# 15. Region Detail

Region Detail powinien przypominać kartę atlasu + raport regionalny.

Układ informacji:

```text
REGION / 017
BLACK MOUNTAIN
Northern Highlands
────────────────────────────────────────

OVERVIEW
Population
Settlement
Primary production
Market access
Needs

CURRENT CONDITIONS
...

ECONOMY
...

RESOURCES
...

HISTORY
...
```

Najważniejsze trendy powinny być widoczne bez otwierania dodatkowych modalów.

---

# 16. WHY?

WHY? nie może wyglądać jak chatbot ani „AI Insight”.

Preferowany język wizualny:

**raport przyczynowy / ścieżka dowodowa.**

```text
WHY DID BLACK MOUNTAIN GROW?
────────────────────────────────────────
Population +41%

PRIMARY CAUSES
01 Mining employment       +18.4
02 Regional wages          +12.7
03 Iron demand              +9.3
04 Market access            +6.1

CAUSAL PATH
Iron discovery
      ↓
Mine founded
      ↓
Employment increased
      ↓
Migration increased
      ↓
Population growth
```

Zakazane nazwy UI:

- AI Insight,
- Smart Analysis,
- Ask AI,
- AI Explanation,
- Magic Summary.

Jeżeli analiza pochodzi z Causality Engine, UI ma przedstawiać ją jako analizę symulacji.

---

# 17. Chronicle

Chronicle może mieć bardziej archiwalny charakter niż pozostałe ekrany.

Dozwolone:

- Source Serif 4,
- większe odstępy,
- subtelne linie przypominające dokument,
- rok jako silny element kompozycji,
- historyczna oś czasu,
- pojedyncza ilustracja/mapa/diagram tylko jeśli pochodzi z systemu gry lub zatwierdzonych assetów.

Chronicle nadal pozostaje czytelne i funkcjonalne.

Przykład:

```text
YEAR 217

THE IRON AGE OF BLACK MOUNTAIN
────────────────────────────────────────
...

CAUSE
Discovery of the northern iron deposit

CONSEQUENCES
→ mining employment +218%
→ population +41%
→ new trade connection

Historical significance       72 / 100
```

---

# 18. Architect Panel

Architect Panel powinien wyglądać jak **laboratorium zmiany warunków**.

Nie jak sklep z power-upami.

Interwencja powinna pokazywać:

- target,
- parametr,
- magnitude,
- duration,
- scope,
- Influence cost,
- guaranteed direct condition change,
- possible affected systems.

Nie używać efektownych kart typu „legendary intervention”.

Nie przedstawiać możliwego rezultatu jako gwarancji.

---

# 19. Animacje

Animacja ma potwierdzać zmianę stanu albo ułatwiać orientację.

Preferowane:

```text
hover       80–120 ms
selection   100–150 ms
panel       120–180 ms
```

Unikać:

- bouncing,
- floating,
- shimmer,
- ciągłego pulsowania,
- glow animation,
- długich transition,
- animacji blokujących pracę przy ×10 / ×100.

---

# 20. Tekstury i grafika

Jasne tło może otrzymać **bardzo subtelną** fakturę papieru/atlasu, jeśli nie pogarsza czytelności.

Faktura:

- nie może być widoczna jako filtr,
- nie może utrudniać tekstu,
- nie powinna być generowana losowo przy każdym ekranie.

Ilustracje dekoracyjne powinny być rzadkie.

Nie generować automatycznie „epickiego świata”, postaci czy krajobrazu do pustych przestrzeni UI.

---

# 21. Anti-AI Rules

Poniższe zasady są obowiązujące przy generowaniu UI przez Codex, Claude Code lub inne agenty.

## 21.1 Zakazy podstawowe

1. **NO decorative gradients.**
2. **NO glassmorphism.**
3. **NO neon glow.**
4. **NO excessive rounded cards.**
5. **NO dashboard composed primarily of KPI cards.**
6. **NO decorative icon overload.**
7. **NO emoji UI.**
8. **NO generic AI-generated illustrations as filler.**
9. **NO excessive animation.**
10. **NO decoration without information.**
11. **NO arbitrary „make it more modern” redesigns.**
12. **NO purple-blue AI aesthetic.**
13. **NO fake AI assistant inside the simulation UI.**
14. **NO giant empty padding designed only to look premium.**
15. **NO inconsistent visual language between screens.**

## 21.2 Zasada implementacyjna

Agent kodujący nie może samodzielnie zmieniać Design Systemu dlatego, że inna wersja „wygląda nowocześniej”.

Jeżeli wymagany komponent nie jest opisany:

1. najpierw wykorzystaj istniejące tokeny i wzorce,
2. zaprojektuj najprostszy wariant zgodny z systemem,
3. nie dodawaj nowej estetyki,
4. oznacz nowy wzorzec do późniejszego zatwierdzenia, jeśli ma być wielokrotnie używany.

---

# 22. Anti-AI test komponentu

Przed zaakceptowaniem nowego komponentu należy odpowiedzieć:

1. Jaką informację przekazuje?
2. Czy może być prostszy?
3. Czy używa istniejących tokenów?
4. Czy wymaga osobnej karty?
5. Czy kolor ma znaczenie?
6. Czy ikona jest potrzebna?
7. Czy animacja pomaga zrozumieć zmianę?
8. Czy wygląda jak część FIRST CAUSE, czy jak generyczny dashboard?

Jeśli element nie przechodzi tego testu, należy go uprościć.

---

# 23. Responsive i docelowy desktop

Podstawowym punktem odniesienia pozostaje desktop **1920×1080**.

UI powinien skalować się do mniejszych rozdzielczości przez:

- zmianę liczby kolumn,
- zwężenie paneli,
- ukrywanie danych drugorzędnych,
- przewijanie lokalne tam, gdzie konieczne.

Nie należy skalować całego interfejsu proporcjonalnie jak obrazu.

---

# 24. Dostępność

- Nie kodować ważnego stanu wyłącznie kolorem.
- Zachować odpowiedni kontrast tekstu.
- Focus keyboard musi być widoczny.
- Małe fonty nie mogą być głównym sposobem prezentacji ważnej informacji.
- Statusy powinny mieć label lub symbol oprócz koloru.
- Wykresy powinny posiadać wartości/tooltipy dostępne bez rozpoznawania samego koloru.

---

# 25. Tożsamość ekranów

Każdy ekran może mieć własny charakter funkcjonalny, ale musi korzystać ze wspólnego systemu.

| Ekran | Charakter |
|---|---|
| World Command Center | centrum obserwacyjne |
| Living Atlas | atlas / sieć świata |
| Region Detail | raport regionalny |
| Economy | analiza gospodarcza |
| Technology | katalog wiedzy i zależności |
| WHY? | raport przyczynowy |
| Chronicle | archiwum historyczne |
| Architect | laboratorium interwencji |

Nie projektować każdego ekranu jako osobnego produktu.

---

# 26. Definicja wizualnego sukcesu

UI FIRST CAUSE jest poprawne, jeśli po zobaczeniu zrzutu ekranu użytkownik może pomyśleć:

> „To wygląda jak narzędzie do obserwowania żywego świata.”

Nie powinien przede wszystkim pomyśleć:

> „To wygląda jak dashboard.”

ani:

> „To wygląda jak interfejs wygenerowany przez AI.”

---

# 27. Skrócona reguła dla agentów kodujących

Przy każdej implementacji UI obowiązuje:

```text
FIRST CAUSE UI =
LIGHT + WARM + TEXT-FIRST + DATA-DENSE + FLAT + STRUCTURED
+ ATLAS-LIKE + ANALYTICAL + HISTORICAL

NOT =
SAAS + NEON + GLASS + GRADIENT + CARD-GRID + EMOJI
+ GENERIC AI DASHBOARD
```

Jeżeli istnieją dwie równie czytelne wersje komponentu, wybierz **prostszą, bardziej płaską i mniej dekoracyjną**.

---

# 28. Status decyzji v0.1

W v0.1 przyjmujemy jako kanoniczne:

- **jasny, ciepły motyw jako domyślny**, 
- IBM Plex Sans dla UI,
- IBM Plex Mono dla danych,
- Source Serif 4 dla wybranej warstwy Chronicle,
- płaskie kolory,
- minimalny border radius,
- cienkie separatory,
- ograniczoną liczbę kart,
- brak dekoracyjnych gradientów,
- brak neon/glow/glassmorphism,
- brak emoji UI,
- Living Atlas jako abstrakcyjny diagram świata,
- WHY? jako raport przyczynowy,
- Chronicle jako archiwum,
- Architect jako laboratorium warunków,
- `NO DECORATION WITHOUT INFORMATION` jako podstawową regułę projektową.


---

# 29. Rozwój technologiczny świata a warstwa wizualna

## 29.1 Brak globalnego „skinu epoki”

FIRST CAUSE nie zmienia podstawowego Design Systemu wraz z upływem czasu ani osiągnięciem określonego poziomu technologicznego.

**UI Architekta jest ponadczasowe i pozostaje wizualnie stabilne przez całą symulację.**

Nie stosujemy globalnych przełączeń typu:

```text
Ancient UI → Medieval UI → Industrial UI → Modern UI → Futuristic UI
```

Świat nie posiada jednej wspólnej epoki wizualnej. Różne regiony mogą rozwijać się w bardzo różnym tempie i znajdować się jednocześnie na skrajnie różnych poziomach rozwoju.

Przykładowo dopuszczalna jest sytuacja, w której jeden region wykorzystuje głównie transport zwierzęcy i prostą produkcję ręczną, podczas gdy inny posiada zaawansowaną automatykę, energetykę i technologie kosmiczne — o ile taki rezultat wynika z reguł symulacji.

## 29.2 Rozwój jest domenowy, a nie jednowymiarowy

Region nie powinien otrzymywać jednego wizualnego ani gameplayowego oznaczenia typu:

```text
Technology Level: 7
Development Era: Industrial
```

Rozwój należy traktować jako profil wielu domen, np.:

- rolnictwo,
- metalurgia,
- energia,
- transport,
- medycyna,
- komunikacja,
- produkcja,
- automatyzacja,
- infrastruktura,
- technologie zaawansowane.

Region może być wysoko rozwinięty w jednej domenie i słaby w innej.

## 29.3 Wiedza, wdrożenie, dostęp i zdolność produkcyjna są różnymi stanami

UI nie może sugerować, że samo poznanie technologii oznacza pełne jej wykorzystanie.

Należy wizualnie i semantycznie rozróżniać co najmniej:

```text
DISCOVERY / ODKRYCIE
        ↓
AVAILABILITY / DOSTĘPNOŚĆ
        ↓
ADOPTION / WDROŻENIE
        ↓
ACCESS / DOSTĘP
```

Dodatkowo UI może rozróżniać lokalną zdolność produkcyjną od dostępu przez handel/import.

Region może więc:

- wiedzieć, że technologia istnieje,
- mieć dostęp do produktów wykorzystujących tę technologię,
- używać ich dzięki importowi,
- ale nie posiadać lokalnej wiedzy, infrastruktury, przemysłu lub zasobów potrzebnych do ich produkcji.

## 29.4 Living Atlas zachowuje jeden język graficzny

Ekstremalne różnice rozwojowe między regionami **nie mogą powodować zmiany podstawowej stylistyki UI poszczególnych regionów**.

Nie stosujemy sytuacji:

```text
Region A → pergaminowy interfejs
Region B → futurystyczny/cyberpunkowy interfejs
```

Wszystkie regiony są przedstawiane przez ten sam system:

- tę samą typografię,
- tę samą paletę bazową,
- te same zasady geometrii,
- te same komponenty,
- te same rodziny symboli,
- te same zasady wizualizacji danych.

Różnica poziomu rozwoju jest pokazywana przez **zawartość świata**, nie przez zmianę Design Systemu.

## 29.5 Jak wizualizować różnice rozwojowe

Living Atlas i widoki regionów mogą komunikować rozwój poprzez:

- typ i wielkość osad,
- gęstość sieci osadniczej,
- drogi, kolej, porty, lotniska i inne rodzaje infrastruktury,
- przepustowość połączeń,
- rodzaje transportu,
- strukturę produkcji,
- dostępne metody produkcji,
- charakter przepływów handlowych,
- energetykę,
- poziom usług,
- rodzaje aktywnych technologii,
- skalę urbanizacji,
- symbole i warstwy danych właściwe dla danej domeny.

Przykład konceptualny:

```text
ISOLATED VALLEY
○ Village
─ Trail
Agriculture: dominant
Population: 4,281

          trade / knowledge flow
                   ↓

BLACK MOUNTAIN
● Metropolis
══ High-capacity transport
Advanced industry: dominant
Population: 2.8M
```

Oba regiony nadal należą do tego samego wizualnego świata FIRST CAUSE.

## 29.6 Chronicle może pokazywać kontrast świata

Chronicle jest wyjątkiem, w którym reprezentacja historyczna może silniej odzwierciedlać materialny i technologiczny charakter opisywanego miejsca.

Dwa wpisy z tego samego roku mogą przedstawiać zupełnie różne realia:

```text
YEAR 812
The First Motor Vehicle Reaches Isolated Valley
```

oraz:

```text
YEAR 812
Black Mountain Orbital Program Established
```

Nie oznacza to zmiany UI Chronicle. Zmienia się **treść i reprezentacja wydarzenia**, podczas gdy układ, typografia, nawigacja i komponenty pozostają spójne.

## 29.7 Brak sztucznego wyrównywania regionów

Warstwa UI nie może ukrywać ani wizualnie normalizować dużych różnic rozwojowych.

Jeżeli symulacja wygeneruje skrajnie nierówny świat, UI powinno go wiernie pokazać.

Jednocześnie duża i trwała różnica rozwojowa przy intensywnym kontakcie między regionami powinna być możliwa do przeanalizowania przez WHY? i system przyczynowy. Gracz powinien móc ustalić, jakie czynniki podtrzymują różnicę, np. brak kapitału, kompetencji, infrastruktury, zasobów, opłacalności wdrożenia lub wysoki Effective Distance.

## 29.8 Kanoniczna reguła Visual World Evolution

> **FIRST CAUSE nie posiada globalnych epok technologicznych ani jednego poziomu technologicznego regionu. Rozwój jest domenowy, nierównomierny i emergentny. UI Architekta pozostaje ponadczasowe i spójne, natomiast różnice rozwojowe są przedstawiane przez zawartość świata, infrastrukturę, osady, technologie, przepływy i dane — nie przez zmianę podstawowego stylu interfejsu.**

Ta zasada jest częścią `ANTI-AI` Visual Direction: zamiast generować osobne dekoracyjne „skiny epok”, interfejs wykorzystuje jeden konsekwentny język wizualny i pozwala, aby historię rozwoju opowiadały dane oraz stan symulowanego świata.

---

# 30. Docelowa tożsamość wizualna — Living Scientific Atlas

Kanonicznym określeniem warstwy UI/grafiki FIRST CAUSE jest:

> **LIVING SCIENTIFIC ATLAS — żywy atlas naukowy autonomicznego świata, który można zatrzymać, przeanalizować i zapytać „dlaczego?”.**

FIRST CAUSE nie powinno wizualnie konkurować z city builderami 3D ani pixel-artowymi god games. Jego własną tożsamość mają tworzyć: żywy atlas świata, przepływy, dane, Chronicle, Causality, WHY? i interwencje Architekta.

Inspiracje funkcjonalne są rozdzielone według problemu projektowego, a nie kopiowane stylistycznie:

- obserwacja powstającej historii — symulatory map i światów,
- przyjemność patrzenia, jak świat żyje — god games i symulatory obserwacyjne,
- eksperymentowanie z autonomicznym systemem — sandbox simulations,
- hierarchia i filtrowanie dużej ilości danych — złożone grand strategy/economic simulations,
- własny system komponentów — gry wymagające kontroli nad bardzo gęstym UI.

FIRST CAUSE ma wykorzystać te lekcje, ale zachować własny język opisany w niniejszym dokumencie.

# 31. World Command Center — atlas jako główny bohater

World Command Center nie może wyglądać przede wszystkim jak dashboard KPI. Centralnym bohaterem ekranu jest **Living Atlas**.

Dla desktopowego widoku referencyjnego 1920×1080 należy dążyć do około **55–60% użytecznej powierzchni głównej części ekranu przeznaczonej na Atlas**. Wartość jest kierunkowa, nie stanowi sztywnego wymogu pikselowego.

Rekomendowana hierarchia:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ FIRST CAUSE / WORLD / DATE / SPEED / INFLUENCE / MAIN NAVIGATION      │
├───────────────────────────────────────────────────────┬─────────────────┤
│                                                       │ IMPORTANT NOW   │
│                                                       │                 │
│                    LIVING ATLAS                       │ major changes   │
│                                                       │ shortages       │
│             region nodes / flows / context            │ discoveries     │
│                                                       │ consequences    │
│                                                       │                 │
├───────────────────────────────────────────────────────┴─────────────────┤
│ COMPACT WORLD PULSE — key values + trends                              │
├─────────────────────────────────────────────────────────────────────────┤
│ RECENT CAUSAL / HISTORICAL THREAD                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

World Status nie powinien zabierać Atlasowi dużej części powierzchni. Najważniejsze agregaty mogą działać jako zwarty `World Pulse`.

# 32. Living Atlas — hybryda atlasu i grafu symulacji

Living Atlas jest połączeniem dwóch warstw:

1. **subtelnego kontekstu geograficznego**, np. kształtów lądu, wybrzeży, rzek, gór i granic regionów,
2. **kanonicznej warstwy symulacyjnej**, czyli region nodes, connections, flows, statusów i overlayów.

Geografia pomaga orientacji, ale nie może przejąć roli source of truth. Właściwy gameplay pozostaje oparty na regionach, połączeniach i danych.

### 32.1 Region Node

Region node nie jest dekoracyjnym kółkiem. Powinien komunikować co najmniej nazwę/identyfikację, skalę lub znaczenie oraz najważniejszy bieżący stan. Dodatkowe dane są ujawniane zgodnie z poziomem zoomu i Information Density.

### 32.2 Overlay modes

Kanoniczne tryby atlasu:

`DEFAULT | POPULATION | ECONOMY | TRADE | MIGRATION | RESOURCES | TECHNOLOGY`

Możliwe rozszerzenia wynikają z UI/UX Spec, ale nie należy mnożyć trybów bez potrzeby.

Po aktywacji overlayu:

- dane nieistotne dla wybranej warstwy są wizualnie wyciszane,
- istotne przepływy/regiony otrzymują większą wagę,
- kolor nadal koduje znaczenie, a nie dekorację,
- atlas nie może zmieniać się w wielokolorową heatmapę bez czytelnej semantyki.

# 33. Context-first navigation

Kliknięcie encji w Living Atlas nie powinno natychmiast usuwać kontekstu świata.

Pierwszy poziom interakcji otwiera **Context Panel / Inspector** nad Atlasem. Powinien zawierać informacje poziomu `GLANCE`, bieżące statusy oraz akcje takie jak:

`OPEN REGION` / `WHY?` / `FOLLOW` — zależnie od kontekstu i zakresu implementacji.

Dopiero jawne wejście w `OPEN REGION` przechodzi do pełnego Deep Dive.

Zasada:

> **Najpierw orientacja w świecie, potem analiza encji.**

# 34. Region Detail jako dossier, nie dashboard

Pełny widok regionu ma przypominać analityczne **dossier regionu**.

Preferowane są:

- wyraźny nagłówek regionu,
- krótki opis bieżącego stanu generowany z faktów/read modelu,
- poziome sekcje,
- tabele i listy,
- małe wykresy w kontekście danych,
- widoczny dostęp do WHY?,
- zakładki domenowe tylko wtedy, gdy rzeczywiście redukują złożoność.

Unikać siatki wielu równorzędnych KPI cards.

Rekomendowane domeny Deep Dive:

`OVERVIEW | ECONOMY | POPULATION | RESOURCES | TRADE | TECHNOLOGY | HISTORY`

Zakres zakładek może być aktywowany etapami zgodnie z VS/MVP/FULL.

# 35. WHY? jako główne wizualne USP

WHY? powinno posiadać własny, natychmiast rozpoznawalny język wizualny.

Podstawową reprezentacją jest **causal graph / causal path**, nie generowany opis chatbota.

```text
ROOT FACT
   │
   ▼
DECISION / CHANGE
   │
   ├──────────────┐
   ▼              ▼
EFFECT A        EFFECT B
   │              │
   └──────┬───────┘
          ▼
     OBSERVED RESULT
```

Każdy widoczny node musi odpowiadać rzeczywistemu faktowi lub agregacji wspieranej przez Causality Engine. Kliknięcie node'a powinno prowadzić do szczegółu faktu/encji, jeśli zakres implementacji na to pozwala.

Jeżeli root cause stanowi interwencja gracza, powinna być jednoznacznie oznaczona jako `ARCHITECT INTERVENTION` wraz z datą/tickiem.

WHY? nie używa personifikowanego asystenta, awatara, „AI insight”, magicznych gwiazdek ani języka sugerującego generatywną interpretację.

# 36. Chronicle jako warstwa archiwalna i emocjonalna

Chronicle jest celowo bardziej narracyjne od pozostałych ekranów, ale nadal zachowuje Design System FIRST CAUSE.

Powinno przypominać **archiwum / rocznik / historyczne dossier**, nie news feed ani social timeline.

Preferowana struktura wpisu:

- rok/data,
- tytuł wydarzenia,
- krótka narracja oparta na faktach,
- opcjonalna ilustracja/diagram/mapa,
- Historical Significance,
- Root Cause,
- kluczowe Consequences,
- akcja `TRACE CAUSES` / `TRACE CONSEQUENCES`.

Chronicle jest głównym miejscem, w którym gracz ma odczuwać długą pamięć świata i konsekwencje wydarzeń sprzed dziesiątek lub setek lat.

# 37. Architect Panel jako laboratorium eksperymentalne

Architect Panel nie może wyglądać jak toolbar „god powers”.

Powinien przypominać kontrolowane **laboratorium eksperymentalne**:

1. TARGET,
2. INTERVENTION,
3. CURRENT CONDITION,
4. PROPOSED CONDITION,
5. KNOWN DIRECT EFFECT,
6. SYSTEMS POTENTIALLY AFFECTED,
7. INFLUENCE COST,
8. VALIDATION / CONSTRAINTS,
9. APPLY INTERVENTION.

UI nie może przedstawiać możliwego rezultatu jako gwarantowanego skutku. Warstwa graficzna ma wzmacniać rozdzielenie `DIRECT EFFECT` od `POSSIBLE CONSEQUENCES`.

# 38. Proceduralny język ilustracyjny świata

FIRST CAUSE nie powinno opierać Chronicle i wydarzeń na setkach niespójnych, generowanych ilustracji.

Preferowany jest **modularny, proceduralny język ilustracyjny**, zbudowany z ręcznie zaprojektowanych lub konsekwentnie przygotowanych elementów wektorowych/rastrowych.

Przykładowe rodziny elementów:

- terrain: mountains, hills, rivers, coast,
- settlement: camp, village, town, city, metropolis,
- production: farm, mine, mill, factory, steelworks,
- infrastructure: trail, road, rail, port, airport,
- energy: biomass, coal, grid, advanced energy,
- knowledge/technology: workshop, laboratory, communications, advanced systems.

Elementy mogą być składane na podstawie faktycznego World State/Read Model, tworząc małe ryciny, winiety lub diagramy odpowiadające stanowi regionu.

Zasada:

> **Ilustracja świata ma wynikać ze stanu symulacji, a nie zastępować go dekoracją.**

# 39. Proporcja źródeł grafiki

Kierunkowa proporcja warstwy wizualnej FIRST CAUSE:

- **około 70% — grafika/data visualization generowana z danych symulacji:** Atlas, nodes, connections, flows, charts, causal graphs, timelines, resource/production diagrams,
- **około 20% — statyczny system graficzny:** symbole, ikony, linie atlasu, patterny, subtelne tekstury, ornamenty Chronicle,
- **około 10% — ilustracje świata:** ważne Chronicle entries, discoveries i przełomowe wydarzenia.

Nie jest to limit assetów ani sztywna metryka implementacyjna. To zasada kierunku artystycznego.

# 40. UI ma być przyjemne do obserwowania

Text-first nie oznacza static-first.

FIRST CAUSE musi umożliwiać satysfakcjonujące obserwowanie świata bez ciągłego otwierania tabel. Living Atlas powinien komunikować zmiany poprzez subtelne, informacyjne sygnały:

- zmianę skali/znaczenia regionu,
- pojawienie się lub zanik połączenia,
- zmianę natężenia flow,
- rozwój osady,
- nową infrastrukturę,
- shortage/disruption,
- migrację,
- odkrycie,
- ważny skutek interwencji.

Zmiany nie mogą powodować ciągłego migotania. Przy wysokich prędkościach symulacji UI może agregować i rzadziej odświeżać prezentację, zachowując pełną poprawność ticków silnika.

Cel emocjonalny:

> **Gracz powinien czasem chcieć niczego nie klikać i po prostu obserwować, co zrobi świat.**

# 41. Golden UI Reference

Po zamrożeniu Design Systemu należy przygotować sześć referencyjnych ekranów 1920×1080:

1. World Command Center,
2. Living Atlas,
3. Region Detail,
4. WHY?,
5. Chronicle,
6. Architect.

Stanowią one `Golden UI Reference` dla implementacji.

Codex, Claude Code i inne narzędzia nie powinny samodzielnie reinterpretować stylu tych ekranów.

Reguła implementacyjna:

> **Nie projektuj nowego UI od zera. Składaj nowe widoki z FIRST CAUSE Design System, FC Component Library i Golden UI Reference. Jeżeli wymagany komponent lub stan nie istnieje, zgłoś brak zamiast tworzyć nowy język wizualny.**

# 42. Kanoniczne podsumowanie v0.3

Warstwa UI/grafiki FIRST CAUSE jest **Living Scientific Atlas**.

- UI Architekta pozostaje jasne, ponadczasowe i spójne.
- Living Atlas jest głównym wizualnym bohaterem świata.
- Atlas łączy subtelny kontekst geograficzny z grafem regionów, połączeń i przepływów.
- Region Detail jest dossier, nie dashboardem SaaS.
- WHY? wizualizuje rzeczywiste łańcuchy przyczynowe i jest jednym z głównych USP produktu.
- Chronicle jest archiwum emergentnej historii.
- Architect jest laboratorium zmiany warunków, nie panelem boskich mocy.
- Różnice rozwojowe wynikają z danych i stanu świata, nie ze skinów epok.
- Większość grafiki powstaje z danych symulacji i konsekwentnych komponentów, nie z dekoracyjnych ilustracji.
- Interfejs musi być równie dobry do obserwowania świata, jak do jego głębokiej analizy.


---

# 18. Region Visual Identity — Procedural Vignette System

## 18.1. Cel
Każdy region może posiadać małą, rozpoznawalną winietę krajobrazową wynikającą z jego faktycznego stanu symulacji. Winieta nie jest generowaną ilustracją AI ani globalnym skinem epoki. Jest deterministyczną kompozycją modułowych assetów SVG/2D w jednym, kanonicznym języku graficznym FIRST CAUSE.

Zasada: **simulation state → RegionVisualProfile → deterministic SVG/2D composition → region vignette**.

## 18.2. Gdzie pokazujemy winietę
- Living Atlas / widok podstawowy: bez stałych miniaturek przy każdym regionie; priorytet mają node, geografia i dane.
- Hover regionu: mała winieta orientacyjnie 120×70 px.
- Region Selected / Context Panel: większa winieta orientacyjnie 400×120 px.
- Region Detail: rozwinięta wersja tej samej kompozycji.
- Chronicle: może używać wariantu kompozycji odpowiadającego stanowi regionu w chwili zdarzenia historycznego.

## 18.3. Warstwy kompozycji
Minimalny model warstw:
1. terrain — plains / hills / mountains / coast / desert / river-lake,
2. vegetation — sparse forest / dense forest / grassland / fields / none,
3. settlement — hamlet / village / town / city / metropolis,
4. transport — trail / road / railway / highway / bridge,
5. infrastructure — port / grid / airport / utilities,
6. industry — mine / workshop / farm / factory / industrial complex / shipyard / energy,
7. landmark — charakterystyczny obiekt wynikający ze świata, np. iron mine, dam, university, spaceport.

## 18.4. Profil wizualny regionu
Renderer nie może opierać się na jednym abstrakcyjnym `developmentLevel`. Region otrzymuje domenowy profil wynikający z danych, np.:

```text
terrain       = mountains
water         = river
vegetation    = forest
settlement    = town
industry      = mining
transport     = railway
energy        = basic_grid
landmark      = iron_mine
```

Różne domeny mogą rozwijać się nierównomiernie. Nowoczesna komunikacja nie wymusza nowoczesnego przemysłu, a dostęp do importowanych dóbr nie oznacza lokalnej zdolności produkcyjnej.

## 18.5. Ewolucja zamiast skinów epok
Winieta zmienia się wyłącznie wtedy, gdy zmienia się rzeczywisty stan regionu. Przykłady:
- wzrost populacji → większa gęstość zabudowy,
- urbanizacja → zmiana struktury osadniczej,
- rozwój kolei → pojawienie/rozbudowa infrastruktury kolejowej,
- industrial employment → większa obecność przemysłu,
- forest coverage → zmiana gęstości roślinności,
- rozwój portu → rozbudowa infrastruktury nadbrzeżnej,
- spaceflight capability + lokalna infrastruktura → możliwość pojawienia się spaceportu.

Nie istnieje automatyczne `Stone Age art → Industrial art → Futuristic art`.

## 18.6. Determinizm
Ten sam stan świata musi odtwarzać tę samą kompozycję po save/load. Warianty assetów mogą być wybierane deterministycznie, np. na podstawie:

```text
vignetteSeed = hash(worldSeed + regionId + visualState)
```

Renderer wizualny nie może wpływać na stan symulacji i nie może używać niedeterministycznego losowania wpływającego na zapis świata.

## 18.7. Anti-AI rule
Codex/agent implementujący UI nie projektuje samodzielnie stylu winiet. Jego rolą jest:
- implementacja `RegionVisualProfile`,
- implementacja `RegionVignetteRenderer`,
- mapowanie danych symulacji na warstwy,
- deterministyczna kompozycja,
- skalowanie i warianty widoku,
- podłączenie gotowych assetów.

Styl, stroke, paleta, perspektywa, poziom szczegółowości i biblioteka assetów są częścią Design Systemu i muszą być przygotowane/zaakceptowane niezależnie.

## 18.8. Struktura biblioteki referencyjnej
Rekomendowana struktura:

```text
/assets/region-vignette/
  terrain/
  vegetation/
  settlements/
  transport/
  infrastructure/
  industry/
  landmarks/
```

Na pierwszy prototyp wystarczy ok. 25–40 modułów. System powinien osiągać różnorodność przez kompozycję, nie przez setki ręcznie przygotowanych pełnych ilustracji.

## 18.9. Zasada prawdziwości wizualnej
**NO DECORATION WITHOUT INFORMATION** obowiązuje także winiety. Element nie może pojawić się tylko dlatego, że poprawia kompozycję. Kopalnia, kolej, port, fabryka, duże miasto lub spaceport muszą mieć podstawę w danych symulacji. Dopuszczalne są neutralne warianty kompozycyjne (np. pozycja drzewa lub kształt zabudowy), jeśli nie sugerują nieistniejącej funkcji świata.

---

# 19. Golden UI #1 — World Command Center: decyzje zamrożone

- Jasny, neutralny interfejs; Living Scientific Atlas zamiast dekoracyjnej mapy fantasy.
- WCC jest Atlas-first.
- Living Atlas: ok. 60% atlas / 40% graph jako język wizualny; w layoucie zajmuje dominującą część workspace.
- Podstawową jednostką Atlasu jest region; osady pojawiają się wraz z semantic zoom.
- Semantic Zoom v1: WORLD / REGION / LOCAL.
- Important Now jest stałym prawym panelem.
- Po wyborze regionu Important Now zostaje zastąpione przez Region Context bez zmiany geometrii ekranu.
- Recent History jest stale widoczne i pokazuje causal thread; dla zaznaczonego regionu staje się kontekstowe.
- Pięć World Metrics jest prezentowanych jako jeden ciągły pasek, bez KPI cards.
- Jeden główny overlay jednocześnie.
- Default / Hover / Selected / Trade są kanonicznymi stanami referencyjnymi WCC.
- Overlay zmienia perspektywę danych, nie architekturę UI.
- Trade Overlay domyślnie pokazuje major flows only.
- ESC/Back redukuje głębokość kontekstu: overlay+selection → overlay → default lub selection → default.
- Atlas pokazuje fizyczne skutki rozwoju: osady, miasta, drogi, kolej, porty, przemysł i infrastruktura wynikają z symulacji.
- Subtelne animacje przepływów i zmian są dozwolone przy niskich prędkościach; przy wysokich prędkościach są ograniczane dla czytelności.


---

# 43. v0.5 Supersession Rules

Poniższe reguły mają pierwszeństwo przed starszymi przykładami lub kierunkami w tym dokumencie, jeśli występuje między nimi konflikt.

1. **Golden UI set v0.5:** World Command Center, Region Detail + Economy Deep Dive, WHY? / Causal Explorer, World Chronicle, Architect, World Economy / Market.
2. Living Atlas nie jest osobnym pełnoekranowym Golden UI; jego kanonicznym środowiskiem jest World Command Center i kontekstowe mapy innych ekranów.
3. Region Detail jest **hybrydą**: `Overview` jako dossier + domenowe zakładki Deep Dive.
4. World Chronicle i Region History są odrębnymi zakresami tego samego systemu historii.
5. `Important Now` i Chronicle nie mogą być traktowane jako ten sam feed.
6. Ikony są rzadsze niż sugerują niektóre wczesne mockupy.
7. Panele/karty są rzadsze niż sugerują niektóre wczesne mockupy.
8. Proceduralne winiety regionów są składane z zatwierdzonych modułów SVG/2D i danych symulacji; nie są generowane ad hoc przez model obrazowy.
9. UI pozostaje jednym językiem wizualnym niezależnie od technologicznego poziomu regionu.
10. Golden UI są wzorcem **hierarchii, kompozycji i języka**, a nie źródłem fikcyjnych danych ani literalnym pixel-perfect assetem produkcyjnym.

---

# 44. Golden UI #2 — Region Detail / Region Dossier

## 44.1 Model hybrydowy

Region Detail jest kanonicznie hybrydą:

```text
OVERVIEW | ECONOMY | POPULATION | RESOURCES | TRADE | TECHNOLOGY | HISTORY
```

`OVERVIEW` jest krótkim dossier regionu i powinien przekazywać esencję bez konieczności przewijania referencyjnego widoku 1920×1080.

Zakładki domenowe są `Deep Dive` i służą analizie szczegółowej.

## 44.2 Stały nagłówek regionu

Niezależnie od zakładki zachowujemy:

- breadcrumb `WORLD / REGION`,
- nazwę i identyfikację regionu,
- proceduralną `FCRegionVignette`,
- zwarty pasek kluczowych faktów/trendów,
- domenową nawigację zakładek.

## 44.3 Overview

Overview powinien zawierać przede wszystkim:

- Current Condition,
- Key Structure,
- Economy summary,
- Current Pressures,
- Infrastructure / Development summary,
- widoczny punkt wejścia do `WHY?`.

Nie jest siatką KPI cards.

## 44.4 Economy Deep Dive

Economy Deep Dive jest wzorcem dla analitycznych zakładek Region Detail. Powinien odpowiadać na pięć pytań:

1. Co region produkuje?
2. Kto produkuje?
3. Czy gospodarka zaspokaja potrzeby?
4. Od czego region zależy?
5. Dlaczego gospodarka się zmienia?

Preferowane reprezentacje:

- zwarte tabele,
- ranked lists,
- małe wykresy trendów,
- dependency rows,
- shortage/pressure indicators,
- `WHY?` przy istotnych zmianach.

## 44.5 Powrót do Atlasu

Powrót `WORLD` zachowuje, o ile technicznie możliwe:

- położenie Atlasu,
- zoom,
- aktywny overlay,
- zaznaczony region.

Nawigacja ma zachowywać ciągłość `Atlas → Region → Atlas`.

---

# 45. Golden UI #3 — WHY? / Causal Explorer

WHY? jest jednym z głównych wizualnych USP FIRST CAUSE.

## 45.1 Struktura

Kanoniczny ekran składa się z:

- pytania `WHY DID ...?`,
- zakresu czasu i obserwowanego rezultatu,
- centralnego `FCCausalGraph`,
- panelu explanation/factors,
- `FCCausalTimeline`.

## 45.2 Nie tylko liniowy łańcuch

Graf musi móc pokazać:

- root causes,
- mechanisms,
- supporting causes,
- intermediate effects,
- observed result,
- counter-pressure / limiting factors,
- Architect interventions, jeśli są rzeczywistym elementem grafu.

Nie redukujemy złożonego wyniku do fałszywego `A → B → C`, jeśli Causality Engine wspiera wiele istotnych przyczyn.

## 45.3 Interaktywność

Każdy sensowny node może stać się nowym kontekstem pytania `WHY?`.

Przykład:

```text
WHY DID POPULATION GROW?
        ↓ click Employment
WHY DID EMPLOYMENT GROW?
```

## 45.4 Architect attribution

Interwencja Architekta może być wyróżniona jako root lub contributing cause, ale UI nie może sugerować 100% sprawstwa, jeśli wynik ma także przyczyny naturalne.

## 45.5 Timeline

Causal Timeline pozostaje widoczna, aby gracz rozumiał opóźnienie pomiędzy przyczyną a skutkiem.

---

# 46. Golden UI #4 — World Chronicle

## 46.1 Zakres

Główna zakładka `CHRONICLE` jest **World Chronicle**.

Pokazuje wydarzenia z całego świata i może filtrować m.in.:

```text
WORLD | REGION | COMPANY | TECHNOLOGY | ARCHITECT
```

## 46.2 World Chronicle ≠ Region History

`Region History` jest zakładką w Region Detail i ogranicza zakres do jednego regionu.

Oba widoki używają tego samego systemu Historical Significance i Causality, ale nie są tym samym ekranem.

## 46.3 Chronicle nie jest event logiem

Priorytetem są wydarzenia o rzeczywistym znaczeniu historycznym. Preferowane są 3–5 najważniejszych narracji/zdarzeń w bieżącym kontekście zamiast niekończącego się feedu drobnych eventów.

Wpis może zawierać:

- datę/rok,
- tytuł,
- Historical Significance,
- proceduralną winietę,
- key facts,
- root cause,
- key events in chain,
- consequences,
- related events,
- `TRACE CAUSES`,
- `OPEN REGION`.

## 46.4 World Timeline

World Chronicle posiada długą oś czasu jako stały element orientacyjny.

---

# 47. Golden UI #5 — Architect

## 47.1 Laboratory, not God Powers

Architect jest laboratorium zmiany warunków świata.

Kanoniczny workflow:

```text
SELECT INTERVENTION
→ SELECT TARGET
→ CONFIGURE PARAMETERS
→ CURRENT → PROPOSED CONDITIONS
→ DIRECT EFFECTS
→ SYSTEMS POTENTIALLY AFFECTED
→ INFLUENCE COST
→ APPLY INTERVENTION
```

## 47.2 Direct vs Possible

UI musi wizualnie i językowo oddzielać:

**DIRECT EFFECTS / deterministic condition changes**

od:

**SYSTEMS POTENTIALLY AFFECTED / emergent downstream response**.

Zakazane jest prezentowanie downstream outcome jako obietnicy.

## 47.3 Region Context

Prawy panel może używać mini Living Atlas / Region Context dopasowanego do rodzaju interwencji.

## 47.4 Your Interventions

Architect zawiera historię działań gracza z możliwością `TRACE CONSEQUENCES`.

Dzięki temu ekran jest również pamięcią eksperymentów Architekta, a nie wyłącznie formularzem wykonania nowej interwencji.

---

# 48. Golden UI #6 — World Economy / Market

World Economy jest globalnym ekranem gospodarczym i odpowiada na pytanie:

> **Co dzieje się w gospodarce całego świata, gdzie i dlaczego?**

## 48.1 Hierarchia

Preferowana kolejność:

1. Global Overview,
2. Economic Living Atlas,
3. Commodity Markets,
4. Regional Output / Trade Flows,
5. Global Trends,
6. Important Economic Changes,
7. Economic Insights oparte na danych/read modelach.

## 48.2 Atlas pozostaje częścią Economy

World Economy nie może zmieniać FIRST CAUSE w arkusz kalkulacyjny. Economic Atlas utrzymuje przestrzenny kontekst produkcji, specjalizacji i przepływów.

## 48.3 Rozróżnienie zakresów

```text
WCC            → co dzieje się ze światem?
Region Economy → jak działa gospodarka tego regionu?
World Economy  → jak działa gospodarka świata i jak regiony są powiązane?
```

---

# 49. FC Component Library v1

## 49.1 Cel

`FC Component Library` jest kontraktem wizualnym dla implementacji. Nowe ekrany powinny być składane z istniejących komponentów i tokenów zamiast projektowania stylu od zera.

Nadrzędna reguła:

> **Do not create a new visual component if an existing FC component can represent the information without loss of meaning.**

Jeżeli nie może:

> **Stop and document the missing UI requirement before introducing a new reusable visual pattern.**

## 49.2 Structure

- `FCAppShell`
- `FCTopNavigation`
- `FCSimulationBar`
- `FCBreadcrumb`
- `FCPageHeader`
- `FCSection`
- `FCPanel`
- `FCSplitView`

`FCSection` jest domyślnym sposobem grupowania treści. `FCPanel` stosujemy tylko przy rzeczywistej granicy semantycznej.

## 49.3 Navigation / Controls

- `FCTabs`
- `FCSegmentedControl`
- `FCTextButton`
- `FCPrimaryAction`
- `FCFilter`
- `FCSearch`
- `FCZoomControl`

`FCTextButton` jest preferowany dla akcji takich jak:

```text
WHY? →
OPEN REGION →
VIEW ALL →
TRACE →
```

## 49.4 Data

- `FCMetric`
- `FCMetricStrip`
- `FCTrend`
- `FCDataRow`
- `FCDataTable`
- `FCProgress`
- `FCSparkline`
- `FCMiniChart`

`FCMetric` nie jest domyślnie kartą.

Kolor nigdy nie jest jedynym nośnikiem trendu. Preferowane:

```text
▲ +6.2%
▼ −3.1%
— 0.0%
```

## 49.5 Living Atlas

- `FCLivingAtlas`
- `FCRegionArea`
- `FCRegionNode`
- `FCSettlementNode`
- `FCConnection`
- `FCFlow`
- `FCMapOverlay`
- `FCRegionTooltip`
- `FCRegionContext`
- `FCMapLegend`

Kanoniczne overlaye v1:

```text
Population | Economy | Trade | Migration | Resources | Technology
```

Jeden główny overlay jednocześnie.

## 49.6 Region Visual Identity

- `FCRegionVignette`
- `FCTerrainLayer`
- `FCVegetationLayer`
- `FCSettlementLayer`
- `FCTransportLayer`
- `FCInfrastructureLayer`
- `FCIndustryLayer`
- `FCLandmarkLayer`

Komponenty te renderują zatwierdzony język SVG/2D na podstawie `RegionVisualProfile`.

## 49.7 Causality

- `FCCausalGraph`
- `FCCausalNode`
- `FCCausalLink`
- `FCFactor`
- `FCFactorList`
- `FCCausalTimeline`
- `FCArchitectCause`

Semantyczne typy node mogą obejmować:

```text
root | mechanism | intermediate | effect | result | architect | counterPressure
```

## 49.8 Chronicle

- `FCChronicleEntry`
- `FCSignificance`
- `FCHistoricalThread`
- `FCTurningPoint`
- `FCWorldTimeline`

## 49.9 Architect

- `FCInterventionCatalog`
- `FCInterventionWorkspace`
- `FCConditionComparison`
- `FCDirectEffects`
- `FCPotentialSystems`
- `FCInfluenceCost`
- `FCInterventionHistory`

## 49.10 Feedback / State

- `FCStatus`
- `FCWarning`
- `FCImportantNow`
- `FCEmptyState`
- `FCTooltip`

`FCImportantNow`: maksimum 4 elementy, preferowane 3.

---

# 50. Component State Contract

Interaktywne komponenty wykorzystują tylko potrzebne stany interakcji:

```text
default
hover
focus
selected
disabled
```

Stan interakcji jest oddzielony od stanu symulacji.

Przykładowe stany semantyczne symulacji:

```text
positive
negative
warning
important
stable
disrupted
propagating
```

Nie należy mieszać `selected` z `warning`, ani `hover` z `growth`.

---

# 51. v0.5 Anti-Card Rule

Golden UI review ujawnił tendencję narzędzi generatywnych do zamykania zbyt wielu informacji w prostokątnych kartach.

Kanoniczna kolejność wyboru sposobu grupowania:

> **WHITESPACE FIRST → RULE SECOND → PANEL THIRD → CARD LAST**

Przykład preferowany:

```text
ECONOMY
────────────────────────
Output        128M
Employment    21,480
Companies     34
```

Karta jest uzasadniona, gdy element:

- ma własny lifecycle lub interakcję,
- stanowi niezależną jednostkę semantyczną,
- wymaga wyraźnego oddzielenia od sąsiedniej treści.

Nie jest uzasadniona tylko dlatego, że posiada label i value.

---

# 52. v0.5 Icon Discipline

Golden UI review ujawnił także ryzyko icon overload.

Kanoniczna zasada:

> **Ikona występuje wtedy, gdy przyspiesza identyfikację typu informacji lub stanu. Nie występuje jako dekoracja.**

Dobre zastosowania:

```text
■ Shortage
◆ Discovery
▲ Growth
! Disruption
```

Nie ma obowiązku dodawania osobnej ikony do każdego:

```text
Population
GDP
Employment
Companies
Trade
Output
```

jeżeli etykieta tekstowa jest szybsza i czytelniejsza.

---

# 53. Design Tokens Contract

Komponent nie może definiować własnej palety poza tokenami Design Systemu.

Minimalny kontrakt semantyczny:

```text
--fc-bg
--fc-surface
--fc-surface-muted
--fc-text-primary
--fc-text-secondary
--fc-text-muted
--fc-border
--fc-border-strong
--fc-accent
--fc-selection
--fc-positive
--fc-negative
--fc-warning
--fc-info
```

Jeżeli wcześniejsza implementacja używa `--fc-text`, może być mapowana na `--fc-text-primary` w warstwie tokenów bez zmiany znaczenia wizualnego.

---

# 54. Typography Role Contract

Implementacja nie powinna wprowadzać przypadkowych rozmiarów fontu per komponent.

Role:

```text
FC_DISPLAY
FC_PAGE_TITLE
FC_SECTION_TITLE
FC_SUBSECTION
FC_BODY
FC_DATA
FC_LABEL
FC_CAPTION
FC_MICRO
```

Font families pozostają:

- IBM Plex Sans — UI/body,
- IBM Plex Mono — dane,
- Source Serif 4 — selektywna warstwa historyczna Chronicle.

---

# 55. Spacing Contract

Bazowa siatka pozostaje 4/8 px.

Preferowane tokeny:

```text
FC_SPACE_1
FC_SPACE_2
FC_SPACE_3
FC_SPACE_4
FC_SPACE_6
FC_SPACE_8
FC_SPACE_12
```

Implementacja nie powinna używać arbitralnych wartości typu `13px` lub `27px`, jeśli istniejący token może spełnić tę samą rolę.

---

# 56. Golden UI Reference v0.5

Za zaakceptowane wzorce kierunkowe uznaje się:

1. **Golden UI #1 — World Command Center**
   - Default World,
   - Region Hover,
   - Region Selected,
   - Trade Overlay,
   - Overlay + Selected jako stan kombinowany.
2. **Golden UI #2 — Region Detail**
   - Overview,
   - Economy Deep Dive jako wzorzec Deep Dive.
3. **Golden UI #3 — WHY? / Causal Explorer.**
4. **Golden UI #4 — World Chronicle.**
5. **Golden UI #5 — Architect.**
6. **Golden UI #6 — World Economy / Market.**

Golden UI nie są zezwoleniem na kopiowanie błędów typograficznych, nadmiarowych ikon, przypadkowych danych ani dekoracyjnych elementów wygenerowanych przez mockup. W razie konfliktu obowiązują reguły tekstowe Design Systemu v0.5.

---

# 57. Agent Implementation Contract v0.5

Codex, Claude Code i inne agenty implementujące UI muszą przestrzegać następującej kolejności:

```text
1. Read canonical UI decisions.
2. Read UI Visual Design System v0.5.
3. Identify relevant Golden UI reference.
4. Reuse FC Component Library.
5. Use design tokens only.
6. Bind presentation to Read Models / UI state.
7. Do not implement simulation logic in UI.
8. If a reusable pattern is missing, document the gap.
9. Do not invent a new visual language.
10. Verify anti-card and icon-discipline rules before completion.
```

Agent nie może uzasadniać odejścia od systemu stwierdzeniem typu `more modern`, `more polished`, `premium`, `AI-inspired` lub `industry standard`, jeśli nie wynika to z zatwierdzonej zmiany Design Systemu.

---

# 58. Definition of Done — UI component / screen

Nowy ekran lub komponent jest zgodny z v0.5, jeśli:

1. używa istniejących tokenów,
2. używa istniejących komponentów FC, gdzie to możliwe,
3. zachowuje hierarchię `Glance → Analysis → Deep Dive`,
4. nie implementuje logiki symulacji,
5. nie używa koloru jako jedynego nośnika informacji,
6. nie dodaje zbędnych ikon,
7. nie dodaje zbędnych kart,
8. nie tworzy dekoracyjnych gradientów/glow/glassmorphism,
9. zachowuje kontekst świata podczas drill-down, gdzie jest to właściwe,
10. posiada poprawne stany hover/focus/selected/disabled, jeśli jest interaktywny,
11. toleruje lokalizację i dłuższe etykiety,
12. jest zgodny z odpowiednim Golden UI Reference,
13. przechodzi Anti-AI Test komponentu,
14. nie sugeruje danych lub skutków, których Read Model / Causality / Simulation nie wspiera.

---

# 59. Kanoniczne podsumowanie v0.5

FIRST CAUSE UI jest **Living Scientific Atlas**.

Jego sześć głównych wzorców tworzy jeden spójny język:

```text
WORLD COMMAND CENTER → OBSERVE
REGION DETAIL        → UNDERSTAND PLACE
WHY?                 → TRACE CAUSE
WORLD CHRONICLE      → REMEMBER HISTORY
ARCHITECT            → CHANGE CONDITIONS
WORLD ECONOMY        → UNDERSTAND SYSTEM
```

Wspólny rdzeń:

- jasne, ciepłe tło,
- typografia i dane przed dekoracją,
- Living Atlas jako przestrzenny kontekst świata,
- płaska geometria,
- cienkie separatory,
- ograniczone ikony,
- ograniczone karty,
- proceduralne winiety wynikające z danych,
- causal graph zamiast chatbotowej interpretacji,
- Chronicle jako archiwum, nie feed,
- Architect jako laboratorium, nie god powers,
- Component Library jako kontrakt implementacyjny,
- `NO DECORATION WITHOUT INFORMATION`,
- `WHITESPACE FIRST → RULE SECOND → PANEL THIRD → CARD LAST`.



# 57. Benchmark Validation — kierunek po benchmarku

Benchmark potwierdza podstawowy kierunek FIRST CAUSE: jasny `Living Scientific Atlas`, progressive disclosure, region jako podstawową jednostkę obserwacji, Chronicle jako historię znaczących zmian oraz WHY? jako narzędzie przyczynowości. Benchmark nie ustanawia nowego stylu wizualnego i nie jest zezwoleniem na kopiowanie UI innych gier.

Kanoniczna synteza kierunku po benchmarku:

> **FIRST CAUSE ma łączyć watchability żyjącego świata z analityczną czytelnością, ale jego przewagą nie jest liczba danych na ekranie. Przewagą jest możliwość zobaczenia zmiany, zlokalizowania jej, zrozumienia jej przyczyn i prześledzenia konsekwencji.**

## 57.1 Priorytety

1. World / Atlas first.
2. Significant change before exhaustive data.
3. Explanation before dashboard density.
4. Progressive disclosure before simultaneous visibility.
5. Visual identity of places before decorative illustration.
6. Calm UI around a moving simulation.

---

# 58. Procedural Region Visual Identity — status filaru

`FCRegionVignette` i proceduralna reprezentacja rozwoju regionu są od v0.6 RC **elementem rdzeniowym** warstwy wizualnej.

Winieta nie służy wyłącznie do ozdabiania Region Detail. Ma budować pamięć wizualną miejsca i umożliwiać rozpoznanie rozwoju regionu bez odczytywania samych liczb.

Obowiązują cztery poziomy ekspozycji:

- **Living Atlas / world zoom:** syntetyczne cechy rozwoju przekazywane przez node, osady, infrastrukturę i charakter terenu; bez stałej miniatury przy każdym regionie,
- **Hover:** mała winieta tylko wtedy, gdy przestrzeń i zoom na to pozwalają; informacja tekstowa pozostaje nadrzędna,
- **Selected Region / Context:** wyraźna kompaktowa winieta regionu,
- **Region Detail / Chronicle:** pełna proceduralna winieta jako element tożsamości miejsca i historii.

Zmiany wizualne muszą wynikać ze stanu symulacji, np.:

`settlement growth → denser settlement`  
`rail access → rail layer`  
`industrialization → industrial structures`  
`port development → port infrastructure`  
`resource exploitation → relevant extraction structures`

Nie istnieje globalny skin epoki. Regiony mogą prezentować bardzo różne poziomy rozwoju jednocześnie.

---

# 59. Global WHY? Interaction Pattern

WHY? nie jest wyłącznie osobnym ekranem ani przyciskiem w kilku panelach. Od v0.6 RC jest **globalnym językiem interakcji**.

Dla znaczących danych, trendów i zdarzeń UI powinno — tam, gdzie istnieją dane Causality Engine — umożliwiać przejście do `Explain / WHY? / Trace Cause`.

Przykładowe cele:

- Population trend,
- Migration change,
- Price movement,
- Shortage,
- Company creation/failure,
- Trade disruption,
- Technology adoption change,
- Settlement growth,
- Chronicle event,
- consequence of Architect intervention.

Nie oznacza to dodawania widocznego przycisku `WHY?` przy każdej liczbie. Dostęp może być realizowany przez `FCTextButton`, kontekstowy action, hover action lub menu obiektu.

Reguła:

> **If a meaningful simulation change is explainable by stored causal evidence, the UI should provide a discoverable path to that explanation without forcing the player through unrelated screens.**

---

# 60. Anti-Dashboard Hard Rule

Reguła z v0.5 zostaje podniesiona do wymogu produkcyjnego:

> **Whitespace first → Rule second → Panel third → Card last.**

Nowy ekran nie może być projektowany jako siatka równorzędnych kart.

Preferowana hierarchia struktury:

1. whitespace / alignment,
2. typography,
3. thin rule / separator,
4. shared surface,
5. bounded panel,
6. card — tylko gdy obiekt rzeczywiście wymaga odrębnej powierzchni i zachowania.

Dla typowego ekranu 1920×1080 należy dążyć do **1–3 głównych powierzchni semantycznych**, zamiast kilkunastu kart. Liczba ta jest wskazówką kompozycyjną, nie mechanicznym limitem dla zagnieżdżonych struktur technicznych.

KPI cards jako domyślny wzorzec są zabronione. `FCMetricStrip`, `FCDataRow`, `FCSection` i typografia mają pierwszeństwo.

---

# 61. Icon Discipline v0.6

Ikona występuje wtedy, gdy skraca czas identyfikacji **typu semantycznego**, a nie dlatego, że pole ma miejsce na ikonę.

Preferowane symbole semantyczne:

- `▲` growth / increase,
- `▼` decline / decrease,
- `■` shortage / constrained state,
- `◆` discovery / breakthrough,
- `!` disruption / attention,
- `→` flow / direction.

Nie dodawać automatycznie osobnej ikony do każdego `Population`, `GDP`, `Companies`, `Employment`, `Trade`, `Output` lub nagłówka sekcji.

Jeżeli label tekstowy jest równie szybki do odczytania, tekst ma pierwszeństwo.

---

# 62. Controlled Cartographic Imperfection

Living Atlas nie może wyglądać jak idealnie geometryczny diagram z Figmy ani jak ręcznie malowana mapa fantasy. Powinien przypominać współczesny, stale aktualizowany atlas świata symulacji.

Dozwolone są kontrolowane różnice:

- lekko nieregularne linie brzegowe i granice naturalne,
- nieidealnie powtarzalne kształty lasów i reliefu,
- kilka ręcznie zaprojektowanych wariantów tego samego assetu SVG,
- nieregularny rytm zabudowy,
- organiczne przebiegi dróg i kolei wynikające z geografii,
- subtelne patterny kartograficzne.

Niedozwolone:

- losowy noise niezwiązany z informacją,
- distressed/grunge texture,
- parchment fantasy styling,
- deformowanie tekstu, danych lub geometrii interakcyjnej,
- losowość zmieniająca wygląd po reloadzie.

Imperfection musi być **deterministyczne** dla world seed + region + visual state.

---

# 63. Motion Principle — The World Moves; The UI Stays Calm

Animacja ma reprezentować zmianę świata, a nie dekorować interfejs.

Dozwolone przykłady:

- przepływ trade/migration/knowledge,
- pojawienie się osady,
- rozbudowa infrastruktury,
- zmiana intensywności aktywności,
- subtelne wejście znaczącego event marker,
- aktualizacja proceduralnej winiety.

Stałe elementy UI — nagłówki, tabele, panele, przyciski, KPI — nie powinny pulsować, przesuwać się ani animować bez powodu.

Przy wysokich prędkościach symulacji animacje świata są redukowane/agregowane. Czytelność ma pierwszeństwo przed liczbą animowanych zmian.

---

# 64. Golden UI #1 — World Command Center v0.6 RC correction

WCC pozostaje głównym ekranem obserwacji, ale po benchmarku jego interpretacja zostaje zaostrzona.

## 64.1 Kompozycja

- Living Atlas pozostaje wizualnie dominujący.
- `Important Now` pozostaje stałym panelem z preferowanymi 3 i maksymalnie 4 znaczącymi sprawami.
- `Region Context` zastępuje `Important Now` po selekcji regionu; nie tworzy dodatkowej kolumny.
- World Metrics pozostają jednym liniowym `FCMetricStrip`, nie zestawem kart.
- Recent History ma preferować causal thread nad zwykłym event logiem.

## 64.2 Korekta względem mockupów

W produkcji nie należy kopiować:

- nadmiernej liczby ikon kategorii,
- dużego bocznego menu overlayów, jeśli odbiera przestrzeń Atlasowi,
- ilustracyjności przypominającej mapę fantasy,
- wielu obramowanych powierzchni.

Overlay controls powinny być zwarte i związane bezpośrednio z Atlasem.

## 64.3 Region identity

Selected Region może pokazywać proceduralną winietę w Context Panel, ale Atlas nadal pozostaje głównym nośnikiem kontekstu przestrzennego.

---

# 65. Golden UI #6 — World Economy v0.6 RC correction

World Economy wymaga największej korekty po benchmarku.

Nie może wyglądać jak klasyczny dashboard BI. Jego rdzeniem jest **Economic Living Atlas**.

Docelowa hierarchia powierzchni ekranu:

- około **40% — Economic Living Atlas**,
- około **35% — najważniejsze dane rynkowe / produkcyjne / handlowe**,
- około **25% — trendy, wydarzenia i Deep Dive entry points**.

Proporcje są wskazówką kompozycyjną, nie sztywnym constraintem pikselowym.

## 65.1 Above the fold

Po wejściu do Economy użytkownik powinien w kilka sekund zobaczyć:

1. globalny stan gospodarki,
2. gdzie występują najważniejsze koncentracje i problemy,
3. które towary/rynki są obecnie istotne,
4. co znacząco się zmieniło,
5. jak przejść do WHY? lub Deep Dive.

## 65.2 Ograniczenie wykresów

Na poziomie Overview nie pokazywać wielu równorzędnych wykresów jednocześnie. Preferować jeden główny trend kontekstowy, a pozostałe analizy przenieść do Deep Dive.

## 65.3 Economic Atlas

Mapa powinna obsługiwać co najmniej:

- dominant production / specialization,
- shortages,
- trade flows,
- market access,
- selected commodity context.

Atlas pozostaje kontekstem geograficznym nawet podczas analizy tabelarycznej.

---

# 66. Architect — Guaranteed vs Possible reinforcement

Architect musi wizualnie i semantycznie oddzielać dwie klasy informacji.

### GUARANTEED / DIRECT

Zmiany wynikające bezpośrednio z wykonania interwencji i gwarantowane przez jej mechanikę.

### POSSIBLE PROPAGATION

Systemy, które mogą zareagować w kolejnych tickach, bez obietnicy konkretnego wyniku.

Nie należy przedstawiać wartości emergentnych jako pewnego `after state`. Jeśli system pokazuje estymację, musi ona być wyraźnie oznaczona jako estimate/model projection i nie może wizualnie konkurować z Direct Effects.

---

# 67. v0.6 RC Supersession Rules

W przypadku konfliktu z wcześniejszymi sekcjami obowiązuje następująca kolejność:

1. Reguły v0.6 RC mają pierwszeństwo przed v0.5.
2. `Procedural Region Visual Identity` jest obowiązkowym filarem produktu; szczegółowość zależy od kontekstu i zoomu.
3. WHY? jest globalnym wzorcem interakcji, nie tylko osobnym ekranem.
4. Anti-card i icon-discipline są wymogami implementacyjnymi.
5. Living Atlas stosuje controlled cartographic imperfection, ale zachowuje jasny scientific-atlas character.
6. Animujemy stan świata, nie chrome interfejsu.
7. World Economy jest Atlas-first i nie może być implementowane jako dashboard BI.
8. Architect musi rozdzielać guaranteed/direct od possible propagation.
9. Golden UI mockupy są referencją hierarchii i intencji; elementy sprzeczne z regułami tekstowymi v0.6 RC nie są kanoniczne.
10. Jasny motyw pozostaje kanonicznym punktem odniesienia.

---

# 68. Gate przed Design System v1.0

Przed oznaczeniem Design System jako v1.0 należy wykonać dwa końcowe testy referencyjne:

1. **World Command Center v0.6** — sprawdzić Atlas-first, ograniczenie ikon/kart, procedural Region Identity, Important Now i Recent History.
2. **World Economy v0.6** — sprawdzić większy Economic Atlas, ograniczenie dashboard density oraz ścieżki `change → WHY? → Deep Dive`.

Jeżeli oba widoki zachowują wspólny język FIRST CAUSE, można zamrozić Design System v1.0 i przekazać go jako kontrakt implementacyjny dla Codexa.

---

# 69. Atlas Density & Semantic Zoom Rules — CANONICAL v1.0

Living Atlas musi zachować czytelność zarówno w małym świecie, jak i przy setkach regionów. Gęstość nie może być rozwiązana przez mechaniczne zmniejszanie node'ów, fontów i etykiet. System ma redukować szczegółowość semantycznie.

## 69.1 Zasada nadrzędna

> **Zoom changes meaning, not only scale.**

Oddalenie kamery nie jest miniaturyzacją tego samego widoku. Każdy poziom zoomu pokazuje inną warstwę informacji.

Kanoniczne przejście:

```text
HIGH DENSITY / WORLD
cluster + major regions + anomalies
          ↓ zoom in
MEDIUM DENSITY / REGIONAL
regions + major connections + selected settlements
          ↓ zoom in
LOW DENSITY / LOCAL
region + settlements + infrastructure + local features
```

## 69.2 LOW DENSITY

Stosowany, gdy viewport obejmuje ograniczoną liczbę regionów lub użytkownik znajduje się na lokalnym poziomie zoomu.

Można pokazać:

- nazwę większości widocznych regionów,
- region node i jego podstawowy trend/status,
- główne osady,
- drogi, kolej, porty i inne istotne elementy infrastruktury,
- zasoby istotne dla aktywnego overlayu,
- lokalne anomalie i znaczące zdarzenia,
- wybrane elementy proceduralnej Visual Identity.

To jest najbardziej szczegółowy poziom Atlasu, ale nadal nie zastępuje Region Detail.

## 69.3 MEDIUM DENSITY

Domyślny tryb obserwacji większej części świata.

Pokazywać:

- wszystkie region nodes lub ich czytelne reprezentacje,
- nazwy major regions, selected region, hovered region i regionów z istotną anomalią,
- główne połączenia infrastrukturalne,
- tylko najważniejsze przepływy aktywnego overlayu,
- uproszczone osady wyłącznie tam, gdzie pomagają zrozumieć strukturę regionu,
- geography jako spokojny kontekst.

Nie pokazywać jednocześnie nazw wszystkich osad, wszystkich przepływów ani pełnej infrastruktury.

## 69.4 HIGH DENSITY

Stosowany na poziomie całego dużego świata lub gdy liczba widocznych regionów przekracza budżet czytelności.

Priorytet:

1. selected / hovered,
2. significant anomaly / Important Now,
3. major region / hub,
4. cluster,
5. pozostałe regiony jako kontekst.

W tym trybie:

- regiony mogą być agregowane w `FCAtlasCluster`,
- etykiety otrzymują wyłącznie major regions, selection, hover i znaczące anomalie,
- settlement layer jest domyślnie ukryty lub agregowany,
- połączenia drugorzędne są ukrywane,
- flows są agregowane w korytarze,
- proceduralna winieta nie jest renderowana jako osobna miniatura przy każdym regionie.

## 69.5 FCAtlasCluster

`FCAtlasCluster` jest komponentem agregacyjnym, a nie nowym typem encji symulacji. Nie może tworzyć własnych faktów.

Może reprezentować wizualnie grupę regionów i pokazywać wyłącznie dane wyliczone z Read Model, np.:

```text
NORTHERN HIGHLANDS
12 regions
Population 418k
■ 2 significant shortages
▲ strong migration pressure
```

Kliknięcie klastra zoomuje / rozwija jego regiony. Nie otwiera sztucznego `Cluster Detail`, jeśli taki obiekt nie istnieje w modelu domenowym.

## 69.6 Label Budget

Atlas posiada ograniczony budżet etykiet. System ma unikać nakładania tekstu i nie może próbować wyświetlać wszystkich nazw naraz.

Kolejność priorytetu labeli:

```text
selected
hovered
significant anomaly
major hub / major region
contextually relevant to overlay
other visible region
settlement
```

Etykieta o wyższym priorytecie może wyprzeć etykietę o niższym. Ukrycie labela nie ukrywa node'a ani danych dostępnych przez hover/selection.

## 69.7 Anomaly Priority

Znaczące zdarzenie może czasowo przebić zwykłą hierarchię gęstości.

Przykład: w HIGH DENSITY mały region dotknięty kryzysem żywnościowym może otrzymać label i marker mimo że normalnie byłby tylko częścią klastra.

Zasada:

> **Importance may override size; decoration may not.**

## 69.8 Flow Aggregation

Przy wysokiej gęstości nie renderować wszystkich trade/migration/knowledge edges.

Domyślnie:

- LOW: local significant flows,
- MEDIUM: major flows in viewport,
- HIGH: aggregated corridors / top flows only.

`ALL FLOWS` może istnieć jako świadomie wybrany tryb analityczny, ale nie jest domyślnym stanem Atlasu.

Grubość = magnitude. Kierunek = arrow / motion cue. Kolor = typ lub semantyczny status zgodny z tokenami. Żaden z tych kanałów nie powinien samodzielnie przenosić całego znaczenia.

## 69.9 Semantic Zoom transitions

Przejścia mają być spokojne i deterministyczne.

Dozwolone:

- fade labels,
- merge/split cluster nodes,
- stopniowe ujawnianie infrastruktury,
- ujawnianie settlement layer,
- agregacja/deagregacja flows.

Niedozwolone:

- gwałtowne przeskakiwanie layoutu UI,
- losowe rozmieszczenie po każdym zoomie,
- animacje dekoracyjne,
- zmiana stylu kartograficznego wraz z zoomem.

## 69.10 Scale independence

Reguły muszą działać dla Small / Standard / Large bez tworzenia osobnych skinów Atlasu. Świat o większej liczbie regionów ma być bardziej agregowany, nie bardziej zatłoczony.

---

# 70. Consistency Audit v0.6 RC → v1.0

Audit wykonany po finalnych testach WCC v0.6 i World Economy v0.6.

## 70.1 PASS — wspólny język ekranów

WCC, Region Detail, Economy Deep Dive, WHY?, World Chronicle, Architect i World Economy korzystają z tego samego modelu wizualnego:

- jasny `Living Scientific Atlas`,
- granatowa hierarchia tekstowa,
- płaskie powierzchnie i cienkie separatory,
- ograniczona ikonografia,
- `Glance → Analysis → Deep Dive`,
- Region jako podstawowy kontekst miejsca,
- WHY? jako ścieżka wyjaśnienia,
- Chronicle jako ścieżka historii,
- Architect jako zmiana warunków.

**Wynik: PASS.**

## 70.2 PASS — WCC vs World Economy

Oba ekrany pozostają Atlas-first, ale mają różne pytania użytkownika:

- WCC: `What is happening in the world?`,
- World Economy: `How is the world economy connected and changing?`.

Economic Atlas jest specjalizacją Living Atlasu, nie osobnym językiem mapy.

**Wynik: PASS.**

## 70.3 PASS — Region Detail vs World screens

Region Detail zwiększa gęstość informacji dopiero po świadomym drill-down. Procedural Region Vignette buduje tożsamość miejsca, ale nie zastępuje danych.

**Wynik: PASS.**

## 70.4 PASS — WHY? i Chronicle

Chronicle odpowiada `what mattered / what happened`, a WHY? odpowiada `why did it happen`. Nie są duplikatami. Oba korzystają z tych samych faktów i Causality/Historical Significance, ale prezentują inne pytanie.

**Wynik: PASS.**

## 70.5 PASS — Architect

Architect zachowuje filozofię `change conditions, not outcomes` dzięki rozdzieleniu `Guaranteed / Direct` od `Possible Propagation`.

**Wynik: PASS.**

## 70.6 PASS WITH IMPLEMENTATION WATCH — dashboard density

Mockupy wygenerowane podczas projektowania czasami zawierają więcej ramek i ikon niż dopuszcza finalny system tekstowy. Nie jest to konflikt Design Systemu: tekstowe reguły v1.0 mają pierwszeństwo przed detalami mockupów.

Podczas implementacji wymagany jest screenshot review dla:

- liczby bounded panels,
- liczby dekoracyjnych ikon,
- wielkości Atlasu,
- liczby jednoczesnych wykresów,
- czytelności WHY? entry points.

**Wynik: PASS WITH WATCH.**

## 70.7 PASS — skalowanie Atlasu

Brakująca reguła skalowania została zamknięta przez sekcję 69. Nie ma potrzeby projektowania osobnego UI dla Small / Standard / Large.

**Wynik: PASS.**

## 70.8 Audit conclusion

Nie wykryto konfliktu wymagającego przebudowy zaakceptowanych Golden UI. Pozostałe ryzyka są implementacyjne, nie koncepcyjne. Design System może zostać zamrożony jako v1.0.

---

# 71. v1.0 Canonical Supersession & Freeze Rules

Poniższa kolejność rozstrzyga konflikty **wewnątrz tego dokumentu**.
Nie nadpisuje Canonical Decisions ani Technology Stack Decision.

1. `v1.0 Canonical Supersession & Freeze Rules`,
2. `Atlas Density & Semantic Zoom Rules`,
3. reguły v0.6 RC,
4. Component Library / kontrakty komponentów,
5. wcześniejsze sekcje v0.5 i starsze,
6. Golden UI mockupy jako referencja intencji i hierarchii, nie pixel-perfect source of truth.

Od v1.0:

- `Living Scientific Atlas` jest zamrożonym kierunkiem wizualnym,
- jasny motyw jest kanoniczny,
- Procedural Region Visual Identity jest CORE,
- WHY? jest globalnym wzorcem wyjaśniania znaczących zmian,
- Chronicle i WHY? pozostają rozdzielone funkcjonalnie,
- Architect = conditions, not guaranteed outcomes,
- World Economy = Atlas-first,
- `Whitespace → Rule → Panel → Card` jest obowiązkowe,
- dekoracyjna ikonografia jest zabroniona,
- `The world moves; the UI stays calm`,
- nowe wzorce wizualne wymagają jawnej aktualizacji Design Systemu; agent implementujący nie może ich ustanawiać samodzielnie.

## 71.1 Implementation baseline

Implementacja powinna rozpocząć się od:

```text
Design Tokens
→ Typography / Spacing
→ FC primitives
→ FC Component Library
→ FCAppShell
→ World Command Center
→ Living Atlas
→ Region Detail
→ WHY?
→ Chronicle
→ Architect
→ World Economy
```

Każdy duży ekran przechodzi `screenshot → Golden UI intent → v1.0 rules` review przed uznaniem go za ukończony.

## 71.2 Change control

Zmiana po v1.0 jest dozwolona, jeśli wynika z:

- testu użyteczności,
- problemu accessibility,
- ograniczenia technicznego potwierdzonego w implementacji,
- realnego problemu czytelności danych,
- nowej funkcji domenowej wymagającej nowego wzorca.

Nie jest wystarczającym powodem:

- `looks more modern`,
- `more premium`,
- `more game-like`,
- `AI suggested`,
- `common dashboard pattern`.

---

# 72. Final v1.0 Statement

FIRST CAUSE UI jest **Living Scientific Atlas** — spokojnym, jasnym interfejsem do obserwowania świata, rozumienia miejsc, śledzenia przyczyn, zapamiętywania historii i zmieniania warunków bez gwarantowania wyników.

Kanoniczny loop poznawczy UI:

```text
OBSERVE
World Command Center / Living Atlas
        ↓
NOTICE
Important Now / anomaly / trend
        ↓
LOCATE
Region / market / entity
        ↓
UNDERSTAND
Region Detail / Deep Dive
        ↓
TRACE
WHY? / Causal Explorer
        ↓
REMEMBER
Chronicle
        ↓
INTERVENE
Architect
        ↓
OBSERVE CONSEQUENCES
```

**Status dokumentu: CANONICAL / FROZEN IMPLEMENTATION BASELINE.**

**KONIEC — FIRST CAUSE UI Visual Design System v1.0**
