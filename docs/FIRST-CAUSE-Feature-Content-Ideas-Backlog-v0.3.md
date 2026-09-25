# FIRST CAUSE --- Feature & Content Ideas Backlog v0.1

**Status:** PROPOSAL / NON-CANONICAL\
**Projekt:** FIRST CAUSE\
**Wersja:** 0.1\
**Data:** 2026-09-16\
**Rola:** rejestr nowych pomysłów projektowych do analizy przed
przeniesieniem do specyfikacji kanonicznych i Implementation Roadmap.

> **Ten dokument nie zmienia obecnego zakresu Vertical Slice ani
> roadmapy.** Pomysł zapisany tutaj nie jest automatycznie zatwierdzony
> do implementacji.

------------------------------------------------------------------------

# 0. Zasada używania backlogu

Nowy pomysł przechodzi ścieżkę:

`POMYSŁ → BACKLOG → ANALIZA → ACCEPT / HOLD / REJECT → SPECYFIKACJA → CANONICAL DECISION (jeśli potrzebna) → ROADMAP → IMPLEMENTACJA`

Statusy:

-   **PROPOSED** --- pomysł zapisany, jeszcze niezatwierdzony.
-   **ANALYSIS** --- wymaga zaprojektowania zależności i skutków.
-   **ACCEPTED** --- zatwierdzony kierunkowo; trzeba wskazać spec i
    milestone.
-   **HOLD** --- wartościowy, ale odkładany.
-   **REJECTED** --- świadomie niewdrażany.
-   **IMPLEMENTED** --- wdrożony i objęty testami.

Kategorie:

-   **FEATURE** --- nowa mechanika/system.
-   **CONTENT** --- nowe dane działające w istniejącej mechanice.
-   **SCENARIO / PRESET** --- zestaw warunków początkowych.
-   **INTERVENTION** --- nowe narzędzie Architekta.
-   **IMPROVEMENT** --- rozszerzenie istniejącego systemu.

------------------------------------------------------------------------

# 1. Vertical Slice --- znaczenie dla backlogu

Vertical Slice (VS) to pierwszy mały, ale kompletny przekrój gry, który
ma udowodnić działanie jej najważniejszej obietnicy od początku do
końca.

Dla FIRST CAUSE nie oznacza to „małej pełnej gry". Oznacza test:

`WARUNKI → AUTONOMICZNE DECYZJE → KONSEKWENCJE → SPRZĘŻENIA → HISTORIA → WHY?`

Referencyjny VS wykorzystuje ograniczony świat i content, a Black
Mountain jest głównym scenariuszem referencyjnym. Państwa, pełna
dyplomacja i wojna pozostają poza podstawowym VS.

Dlatego nowe pomysły z tego dokumentu nie powinny automatycznie
rozszerzać aktualnego Vertical Slice. Najpierw trzeba ustalić, czy są
potrzebne do udowodnienia core loop.

------------------------------------------------------------------------

# 2. FC-IDEA-001 --- Kreator warunków początkowych świata

**Typ:** FEATURE / SCENARIO SYSTEM\
**Status:** PROPOSED\
**Rekomendowana faza:** stopniowo VS → MVP → FULL\
**Priorytet analizy:** HIGH

## 2.1 Cel

Podstawowy kreator ma dawać graczowi niewielką liczbę decyzji, ale każda
z nich ma realnie zmieniać warunki, z których później wyłoni się
historia. Nie pokazujemy parametrów technicznych generatora.

> **Gracz ustawia przyczyny początkowe. Generator tworzy spójny Tick 0.
> Symulacja tworzy konsekwencje.**

Podstawowy kreator zawiera **6 decyzji**.

## 2.2 Provinces --- liczba prowincji

Gracz wpisuje dokładną liczbę prowincji/regionów zamiast wybierać
wyłącznie preset Small/Standard/Large.

Przykład: `620`.

-   minimum i maksimum wynikają z zakresu wspieranego przez dany build;
-   presety mogą pozostać jako skróty, ale nie blokują ręcznego wpisania
    liczby;
-   liczba prowincji nie ustala populacji ani liczby przyszłych państw;
-   UI powinno informować o przewidywanym koszcie wydajnościowym.

## 2.3 World Conditions --- warunki naturalne

Jedna decyzja zastępuje techniczne suwaki temperatury, opadów, żyzności
i dostępności wody.

Opcje:

-   **Mild** --- więcej żyznych, dobrze nawodnionych i łatwych do
    zasiedlenia obszarów; mniej ekstremalnych warunków.
-   **Balanced** --- domyślna mieszanka dobrych, przeciętnych i trudnych
    regionów.
-   **Harsh** --- więcej słabo żyznych, suchych, górzystych i trudnych
    do zasiedlenia regionów.
-   **Extreme** --- silne kontrasty; niewielkie obszary bardzo korzystne
    mogą sąsiadować z rozległymi obszarami trudnymi.
-   **Random** --- charakter środowiska wynika z seeda i generatora.

`World Conditions` nie określa ilości minerałów. Zasoby są osobną
decyzją.

## 2.4 Resources --- zasoby

Gracz podejmuje dwie proste decyzje.

### Abundance

-   **Scarce** --- stosunkowo mało zasobów.
-   **Normal** --- standardowa ilość.
-   **Rich** --- dużo zasobów.

### Distribution

-   **Dispersed** --- zasoby szerzej rozłożone między prowincjami.
-   **Regional** --- domyślnie; naturalne geograficzne skupiska
    sprzyjające specjalizacji i handlowi.
-   **Concentrated** --- duża część wartościowych zasobów skupiona w
    niewielkiej liczbie prowincji.

Kombinacje mają tworzyć odmienne warunki, np. `Rich + Concentrated` lub
`Scarce + Concentrated`.

## 2.5 Initial Population --- początkowa populacja

Gracz wpisuje konkretną liczbę.

Proponowany zakres projektowy: **5--10 000 jednostek populacji**, z
możliwością późniejszej korekty po testach modelu i wydajności.

Przykład: `300`.

-   populacja nie skaluje się automatycznie z liczbą prowincji;
-   gracz może świadomie tworzyć bardzo słabo lub bardzo gęsto
    zaludnione światy;
-   generator ustala strukturę kohort i rozmieszcza populację zgodnie z
    warunkami świata;
-   UI może opisywać wpisaną wartość jako Low/Medium/High, ale nie
    zastępuje nią liczby.

## 2.6 Starting Communities --- liczba społeczności początkowych

Gracz wpisuje liczbę początkowych społeczności.

Przykład:

`Initial Population: 300`\
`Starting Communities: 6`

Zakres:

-   minimum: **1**;
-   maksimum: nie więcej niż `Initial Population`;
-   UI pokazuje orientacyjną średnią wielkość społeczności, ale
    generator nie dzieli populacji idealnie po równo.

Ta decyzja pozwala eksperymentować z koncentracją społeczeństwa.
`300 ludzi / 1 społeczność` tworzy inne warunki niż
`300 ludzi / 30 społeczności`. Generator wybiera lokalizacje
społeczności na podstawie habitability, wody, żywności, dostępności i
innych warunków początkowych.

## 2.7 Natural Connections --- naturalna dostępność świata

Nazwa `Connectivity` zostaje zastąpiona przez **Natural Connections**,
aby nie sugerować poziomu zbudowanej infrastruktury. Parametr opisuje
strukturę World Graph i naturalną łatwość przemieszczania się między
prowincjami.

Opcje:

-   **Difficult** --- wiele barier, odległych odnóg, bottlenecków i
    trudno dostępnych regionów.
-   **Limited** --- sensowne połączenia lokalne, ale trudny przepływ na
    większe odległości.
-   **Regional** --- domyślne; lokalne sieci, huby, korytarze,
    bottlenecks i peryferia.
-   **Easy** --- geografia stosunkowo mało utrudnia przepływ i
    późniejszy rozwój połączeń.

`Easy` nie oznacza rozwiniętej infrastruktury na Tick 0.

## 2.8 Podstawowy ekran kreatora

``` text
CREATE WORLD

PROVINCES
620

WORLD CONDITIONS
Balanced

RESOURCES
Abundance: Normal
Distribution: Regional

INITIAL POPULATION
300

STARTING COMMUNITIES
6

NATURAL CONNECTIONS
Regional

SEED
83917452

[ SURPRISE ME ]                 [ GENERATE WORLD ]
```

## 2.9 World Preview

Kreator powinien na bieżąco tłumaczyć ustawienia na krótki opis świata,
np.:

> 620-prowincjonalny świat rozpocznie historię z 300 jednostkami
> populacji podzielonymi między 6 społeczności. Warunki naturalne będą
> zróżnicowane. Zasoby wystąpią w regionalnych skupiskach, a naturalna
> sieć połączeń będzie sprzyjać kontaktom regionalnym bez gwarantowania
> łatwego przepływu przez cały świat.

Opis nie może przewidywać przyszłego wyniku.

## 2.10 Surprise Me

`Surprise Me` losuje sześć decyzji w obsługiwanych zakresach i pokazuje
wynik przed wygenerowaniem świata. Gracz może zaakceptować konfigurację
albo losować ponownie.

## 2.11 Advanced / Laboratory Mode

Szczegółowe parametry techniczne generatora nie są częścią podstawowego
kreatora. Mogą później trafić do osobnego **Laboratory Mode** dla
eksperymentów A/B.

Przykłady parametrów laboratoryjnych:

-   temperatura i opady,
-   fertility/water distributions,
-   resource clustering,
-   topology parameters,
-   szczegóły cohort generation,
-   culture seeds,
-   początkowe inventory/prices,
-   dokładne parametry infrastruktury.

## 2.12 Reguła projektowa

Każde ustawienie podstawowego kreatora musi spełniać trzy warunki:

1.  gracz rozumie je bez znajomości silnika;
2.  realnie zmienia warunki startowe i możliwe ścieżki historii;
3.  nie określa przyszłego rezultatu.

Warunek może powiedzieć: „świat ma 620 prowincji, 300 ludzi w 6
społecznościach i regionalnie skupione zasoby". Nie może powiedzieć: „w
tym świecie powstanie imperium przemysłowe".

# 3. FC-IDEA-002 --- Architect: wprowadzenie konkretnej postaci do świata

**Typ:** INTERVENTION / FEATURE\
**Status:** PROPOSED --- wymaga osobnej specyfikacji przed
implementacją\
**Rekomendowana faza:** POST-VS / MVP lub FULL\
**Priorytet analizy:** HIGH

## 3.1 Koncepcja

Architekt może wprowadzić do istniejącego świata **konkretną jednostkę o
określonym profilu**, np.:

-   lidera,
-   wynalazcę,
-   inżyniera,
-   przedsiębiorcę,
-   lekarza,
-   uczonego,
-   odkrywcę,
-   reformatora,
-   organizatora,
-   stratega / dowódcę --- dopiero po systemie wojny.

Robocza nazwa interwencji:

**Introduce Historical Character**

## 3.2 Najważniejsza zasada

Postać **nie może gwarantować rezultatu**.

Architekt tworzy przyczynę:

`pojawia się wybitny inżynier`

a symulacja rozstrzyga:

`czy znajdzie pracę → czy uzyska zasoby → czy jego wiedza zostanie wykorzystana → czy wpłynie na firmę/region → czy coś odkryje → czy jego pomysł zostanie przyjęty → czy stanie się historycznie ważny`.

## 3.3 Przykład --- inżynier

Architekt dodaje:

**Aleksander Venn** - role: Engineer, - Mechanics: 85, - Metallurgy:
72, - Entrepreneurship: 40, - Influence/Charisma: 35, - Risk Tolerance:
65.

Region posiada: - żelazo, - rosnący przemysł, - brak wysoko
wykwalifikowanych specjalistów.

Możliwy łańcuch:

`Engineer introduced` → `specialist capacity ↑` →
`technology eligibility ↑` → `new production method becomes possible` →
`company considers adoption` → `productivity ↑` → `profitability ↑` →
`employment ↑` → `migration ↑` → `settlement growth`

Ale równie możliwe:

`Engineer introduced` → `brak kapitału / brak firmy / brak materiałów` →
`brak adopcji` → `migracja postaci do innego regionu` →
`wpływ pojawia się gdzie indziej`

## 3.4 Przykład --- wynalazca

Postać może zwiększać prawdopodobieństwo Discovery lub przyspieszać
proces badawczy, ale nie powinna działać jak przycisk „odblokuj
technologię".

Możliwy model:

`DiscoveryChance = Base Conditions + Knowledge + Specialists + Material Pressure + Character Contribution`

## 3.5 Przykład --- lider

Lider staje się szczególnie interesujący dopiero po powstaniu państw,
organizacji i polityki.

Może wpływać na: - zdolność organizacyjną, - centralizację, -
stabilność, - reformy, - relacje, - mobilizację, - reakcję na kryzys, -
priorytety państwa.

Nie powinien jednak otrzymywać od Architekta gwarantowanego stanowiska
„władcy świata", jeżeli nie ma mechanicznego procesu pozwalającego mu
zdobyć władzę.

## 3.6 Proponowane parametry postaci

``` text
identity
origin
age
role/archetype
knowledgeDomains
skills
traits
ambition
riskTolerance
mobility
entrepreneurship
leadership
socialInfluence
innovation
organization
wealth/resources
relationships
currentOrganization
historicalSignificance
```

Nie wszystkie parametry muszą być jawnie ustawiane przez gracza.

## 3.7 Koszt Influence

Interwencja powinna być droga, ponieważ pojedynczy człowiek może
wygenerować wielopokoleniowy Butterfly Effect.

Koszt może zależeć od: - poziomu zdolności, - liczby wyjątkowych cech, -
wieku, - wiedzy, - miejsca pojawienia się, - historycznej
„nienaturalności" interwencji.

## 3.8 Chronicle i WHY?

Każda taka interwencja tworzy Root Fact.

Chronicle może później pokazać:

> „Przybycie Aleksandra Venna do Iron Valley okazało się jednym z
> punktów zwrotnych lokalnej industrializacji."

Taki tekst jest dopuszczalny tylko wtedy, gdy Causality rzeczywiście
wykazuje jego znaczący wpływ.

## 3.9 Naturalne Historical Characters

System musi równolegle umożliwiać powstawanie postaci **bez udziału
gracza**.

Np. przedsiębiorca, wynalazca lub lider może zostać wyłoniony z
normalnej symulacji, a następnie promowany do Historical Character po
przekroczeniu progu znaczenia.

Interwencja Architekta jest dodatkową możliwością eksperymentalną, nie
jedynym źródłem ważnych ludzi.

------------------------------------------------------------------------

# 4. FC-IDEA-003 --- Character Seed jako warunek początkowy

**Typ:** SCENARIO / INITIAL CONDITION\
**Status:** PROPOSED\
**Faza:** POST-VS

Oprócz interwencji wykonywanej podczas trwania świata kreator może
pozwolić umieścić jedną lub kilka wyjątkowych postaci **przed Tick 0**.

Przykłady eksperymentów:

-   „Co jeśli wybitny metalurg urodził się w izolowanym regionie?"
-   „Co jeśli dwóch podobnych wynalazców zaczyna w dwóch różnych
    gospodarkach?"
-   „Czy lider jest ważniejszy od warunków strukturalnych?"
-   „Czy ten sam człowiek odniesie sukces w bogatym i biednym regionie?"

To bardzo dobrze pasuje do Experiment Mode i porównań A/B.

------------------------------------------------------------------------

# 5. FC-IDEA-004 --- Wojny jako emergentny system świata

**Typ:** MAJOR FEATURE\
**Status:** HOLD / DESIGN CANDIDATE\
**Obecny kanon:** poza podstawowym Vertical Slice\
**Rekomendowana faza:** POST-VS, po działających State/Nation/Politics\
**Priorytet analizy:** HIGH, implementacji: LATER

## 5.1 Zasada

Wojna nie powinna być osobną minigrą strategiczną ani systemem, w którym
gracz przesuwa jednostki.

Powinna być **konsekwencją świata**.

Kanoniczny kierunek:

`warunki → napięcia → decyzje państw → eskalacja → konflikt → skutki gospodarcze/demograficzne/polityczne → pokój → długotrwałe konsekwencje`

## 5.2 Warunki konieczne przed wdrożeniem wojny

Wojna wymaga co najmniej:

1.  State / Nation,
2.  granic i kontroli regionów,
3.  State AI,
4.  relacji między państwami,
5.  zasobów państwa,
6.  populacji,
7.  gospodarki,
8.  logistyki,
9.  technologii,
10. Causality,
11. Chronicle.

Dlatego nie powinna być dodawana teraz do Vertical Slice.

## 5.3 Przyczyny konfliktów

Potencjalne źródła napięcia:

-   spór terytorialny,
-   zasoby strategiczne,
-   dostęp do morza / szlaku,
-   presja demograficzna,
-   rywalizacja gospodarcza,
-   bezpieczeństwo granic,
-   konflikt polityczny,
-   konflikt kulturowy,
-   sojusze,
-   poprzednie wojny,
-   kryzys wewnętrzny,
-   ambicje lidera,
-   przewaga militarna postrzegana jako okazja.

Nie każdy wysoki poziom napięcia prowadzi do wojny.

## 5.4 Model decyzji

Przykładowo:

``` text
WarPressure =
TerritorialConflict
+ ResourcePressure
+ SecurityFear
+ Rivalry
+ LeaderModifier
+ Opportunity
+ AlliancePressure
- TradeDependence
- WarExhaustion
- DomesticRisk
- ExpectedCost
```

To jest koncepcja do późniejszego zaprojektowania, nie gotowa formuła
implementacyjna.

## 5.5 Model militarny

FIRST CAUSE nie potrzebuje symulacji każdego żołnierza.

Preferowany model agregowany:

-   military capacity,
-   manpower,
-   equipment,
-   technology,
-   logistics,
-   supply,
-   command quality,
-   morale,
-   terrain,
-   infrastructure,
-   distance,
-   war exhaustion.

Konflikt może być liczony na poziomie frontów / contested regions /
kampanii.

## 5.6 Gospodarka wojny

Wojna musi być połączona z istniejącą gospodarką:

`mobilizacja` → `labor supply ↓`

`zapotrzebowanie militarne ↑` →
`metal / food / textiles / fuel demand ↑`

`szlaki przerwane` → `imports ↓` → `prices ↑` → `shortages`

`zniszczenie infrastruktury` → `Effective Distance ↑` → `trade ↓`

Dzięki temu wojna staje się częścią tej samej symulacji, a nie osobnym
modułem odłączonym od świata.

## 5.7 Demografia

Możliwe konsekwencje:

-   military casualties,
-   civilian casualties,
-   spadek urodzeń,
-   migracja,
-   uchodźcy,
-   niedobory żywności,
-   epidemie wtórne,
-   zmiana struktury wieku,
-   niedobór pracowników,
-   powojenna fala demograficzna.

## 5.8 Regiony i kontrola

Wojna może zmieniać: - kontrolę regionu, - bezpieczeństwo, - border
friction, - infrastrukturę, - production capacity, - population, - trade
routes.

Zmiana kontroli regionu nie oznacza automatycznie pełnej asymilacji
kulturowej lub narodowej.

## 5.9 Zakończenie wojny

Wojna nie powinna kończyć się wyłącznie przez „100% warscore".

Czynniki: - wyczerpanie, - brak zasobów, - straty, - utrata celów, -
presja wewnętrzna, - zmiana lidera, - interwencja innych państw, -
impas, - załamanie gospodarcze, - osiągnięcie ograniczonego celu.

## 5.10 Chronicle

Chronicle powinno umieć opisać:

-   narastanie napięcia,
-   wybuch wojny,
-   przełomowe kampanie,
-   zmianę kontroli regionów,
-   kryzysy gospodarcze,
-   migracje,
-   pokój,
-   długotrwałe konsekwencje.

WHY? powinno pozwalać pytać m.in.:

-   Dlaczego wybuchła wojna?
-   Dlaczego państwo przegrało?
-   Dlaczego region został zajęty?
-   Dlaczego ceny żywności wzrosły?
-   Dlaczego rozpoczęła się fala migracji?
-   Dlaczego zawarto pokój?

------------------------------------------------------------------------

# 6. FC-IDEA-005 --- Architect a wojna

**Typ:** INTERVENTION\
**Status:** PROPOSED / LATER

Architekt nie powinien mieć prostego przycisku:

**„Rozpocznij wojnę A z B".**

Bardziej zgodne z filozofią FIRST CAUSE są interwencje zmieniające
warunki:

-   zwiększenie / zmniejszenie Border Friction,
-   Resource Reveal w regionie spornym,
-   zmiana dostępności strategicznego zasobu,
-   Knowledge Injection,
-   Environmental Shock,
-   wprowadzenie wpływowego lidera,
-   Experimental Event wpływający na relacje.

Świat sam decyduje, czy powstałe warunki prowadzą do eskalacji.

Ewentualny **Force Conflict** powinien istnieć najwyżej jako narzędzie
Debug / Experiment Mode, wyraźnie oddzielone od standardowego gameplayu.

------------------------------------------------------------------------

# 7. FC-IDEA-006 --- Wojna jako generator długich łańcuchów przyczynowych

**Typ:** FEATURE INTEGRATION\
**Status:** PROPOSED / LATER

Wojna jest szczególnie wartościowa dla FIRST CAUSE nie dlatego, że daje
„bitwy", lecz dlatego, że może tworzyć wielodekadowe Butterfly Effects.

Przykład:

`spór o złoże` → `wojna` → `zniszczenie szlaku` → `brak węgla` →
`spadek produkcji stali` → `upadek firm` → `bezrobocie` → `migracja` →
`spadek miasta` →
`przeniesienie centrum przemysłowego do innego regionu` →
`nowy układ gospodarczy po 40 latach`

To jest docelowo jeden z systemów, które mogą najmocniej wykorzystać
Causality + Chronicle.

------------------------------------------------------------------------

# 8. FC-IDEA-007 --- Scenariusze / presety eksperymentalne

**Typ:** CONTENT / SCENARIO\
**Status:** PROPOSED

Przykładowy katalog:

### Iron Frontier

Mała populacja, słaba infrastruktura, ukryte bogate złoże żelaza.

### Fertile Valley

Wysoka żyzność, dobra woda, niewiele minerałów, rosnąca populacja.

### Isolated Highlands

Góry, wysoki Effective Distance, mała społeczność, lokalne zasoby.

### Trade Crossroads

Niewiele zasobów własnych, ale doskonałe położenie między kilkoma
gospodarkami.

### Resource Trap

Bogate złoża, słaba wiedza, niski poziom infrastruktury i mało
specjalistów.

### Twin Regions

Dwa prawie identyczne regiony; jedna celowa różnica do eksperymentu A/B.

### The Inventor

Dwa identyczne światy; w jednym Architekt wprowadza wybitnego wynalazcę.

### The Engineer

Region z potencjałem przemysłowym otrzymuje jednego wysokiej klasy
specjalistę.

### Broken Route

Silnie zależny od handlu region traci kluczowe połączenie.

### Post-Depletion

Bogaty region zaczyna blisko wyczerpania najważniejszego złoża.

### Powder Keg --- przyszłość

Kilka państw, silne zależności handlowe, spory graniczne i strategiczne
zasoby. Scenariusz dopiero po wdrożeniu państw i wojny.

------------------------------------------------------------------------

# 9. FC-IDEA-008 --- Biblioteka eksperymentów

**Typ:** FEATURE / CONTENT ORGANIZATION\
**Status:** PROPOSED

Gra może docelowo posiadać katalog gotowych eksperymentów:

> „Czy zasoby tworzą potęgę?"

> „Czy infrastruktura jest ważniejsza od zasobów?"

> „Czy jeden człowiek może zmienić historię?"

> „Co dzieje się po wyczerpaniu złoża?"

> „Czy izolacja chroni czy hamuje rozwój?"

> „Czy handel zapobiega wojnie?" --- dopiero po systemie geopolityki.

Każdy eksperyment określa: - seed/preset, - initial conditions, -
sugerowaną interwencję, - metryki obserwacyjne, - ale **nie określa
oczekiwanego zwycięzcy ani wyniku historii**.

------------------------------------------------------------------------

------------------------------------------------------------------------

# 10. Nowe zaakceptowane kierunki contentu i systemów

Poniższe pomysły zostały zaakceptowane jako **DESIGN DIRECTION**. Nie
oznacza to jeszcze automatycznego dodania ich do bieżącej roadmapy ani
Vertical Slice. Każdy z nich przed implementacją wymaga przypisania do
właściwej fazy, specyfikacji zależności oraz Acceptance Gate.

## FC-IDEA-009 --- Natural Disasters

**Typ:** FEATURE / CONTENT\
**Status:** ACCEPTED --- DESIGN DIRECTION\
**Wstępna faza:** MVP candidate

Świat może generować naturalne zaburzenia wynikające z warunków
środowiskowych, m.in.:

-   drought,
-   flood,
-   wildfire,
-   earthquake,
-   severe winter,
-   heat wave,
-   storm,
-   crop disease.

Katastrofa nie może działać wyłącznie jako abstrakcyjny modyfikator typu
`-20% production`. Powinna zmieniać canonical state, a jej skutki mają
przechodzić przez normalne systemy świata.

Przykład:

`Drought → agricultural output ↓ → food supply ↓ → prices ↑ → needs satisfaction ↓ → migration ↑ → company failures / settlement pressure`

Causality Engine i WHY? powinny pozwalać prześledzić zarówno przyczyny
katastrofy, jeśli są modelowalne, jak i jej dalsze konsekwencje.

## FC-IDEA-010 --- Disease & Epidemics

**Typ:** FEATURE\
**Status:** ACCEPTED --- DESIGN DIRECTION\
**Wstępna faza:** MVP / FULL candidate

Epidemie powinny wynikać z kombinacji warunków świata, a nie pojawiać
się jako całkowicie oderwane losowe karty.

Potencjalne czynniki:

-   population density,
-   nutrition,
-   sanitation / service capacity,
-   mobility,
-   connectivity,
-   medical knowledge,
-   local environmental conditions.

System powinien tworzyć sprzężenia z demografią, gospodarką, migracją,
wiedzą i Chronicle.

Przykład:

`high connectivity → disease spread ↑ → mortality ↑ → labor shortage → wages ↑ / production ↓ → migration → pressure for medical knowledge`

Dobre połączenie świata może więc jednocześnie pomagać handlowi i
zwiększać ryzyko szybkiego rozprzestrzeniania chorób.

## FC-IDEA-011 --- Emergent Historical Characters

**Typ:** FEATURE / CHARACTER SYSTEM\
**Status:** ACCEPTED --- DESIGN DIRECTION\
**Wstępna faza:** MVP / FULL candidate

Ważne postacie nie mogą pochodzić wyłącznie z interwencji Architekta.
Symulacja powinna móc naturalnie wyłaniać jednostki o ponadprzeciętnym
wpływie, np.:

-   inventors,
-   engineers,
-   entrepreneurs,
-   doctors,
-   scientists,
-   explorers,
-   organizers,
-   political leaders --- po wdrożeniu polityki,
-   military leaders --- po wdrożeniu wojny.

Postać powinna zostać uznana za historyczną na podstawie rzeczywistego
**causal footprint**, a nie samej wysokiej wartości cechy.

Chronicle może później pokazywać jej wpływ, a WHY? powinno odpowiadać na
pytanie:

> **„Dlaczego ta osoba była historycznie ważna?"**

System musi współistnieć z wcześniej proponowaną interwencją
`Introduce Historical Character`.

## FC-IDEA-012 --- Great Transformations / Emergent Eras

**Typ:** FEATURE / CHRONICLE ANALYSIS\
**Status:** ACCEPTED --- DESIGN DIRECTION\
**Wstępna faza:** MVP candidate\
**Priorytet projektowy:** HIGH

Epoki i wielkie przemiany nie powinny być uruchamiane skryptem ani
arbitralnym numerem roku.

Symulacja najpierw tworzy realną zmianę strukturalną, a Chronicle może
później rozpoznać okres jako historyczną transformację.

Potencjalne przykłady:

-   Agricultural Transformation,
-   Urbanization Wave,
-   Iron Age,
-   Commercial Revolution,
-   Industrial Transformation,
-   Mass Migration Era,
-   Age of Coal,
-   Age of Electricity.

Przykład:

`production methods change + energy structure changes + urban employment rises + transport expands`

→ po odpowiednio długim okresie Chronicle może rozpoznać **Industrial
Transformation**.

Nazwa epoki jest interpretacją historii na podstawie faktów. Nie jest
triggerem tworzącym historię.

## FC-IDEA-013 --- Knowledge Loss & Rediscovery

**Typ:** FEATURE\
**Status:** ACCEPTED --- DESIGN DIRECTION\
**Wstępna faza:** FULL candidate

Rozwój wiedzy nie powinien być wyłącznie jednokierunkowy.

Świat może znać Discovery, ale utracić praktyczną zdolność jego
wykorzystania wskutek:

-   śmierci lub migracji specjalistów,
-   zaniku firm,
-   przerwania transmisji wiedzy,
-   izolacji,
-   upadku infrastruktury,
-   utraty wymaganych narzędzi lub materiałów.

Potencjalny model stanu praktycznej dostępności:

`ACTIVE → RARE → DORMANT → LOST PRACTICE → REDISCOVERED`

Nie oznacza to magicznego usuwania faktu historycznego, że odkrycie
kiedyś istniało.

Chronicle powinno zachować pamięć o wcześniejszym okresie używania
wiedzy.

## FC-IDEA-014 --- Strategic Geography / Natural Bottlenecks

**Typ:** FEATURE INTEGRATION / WORLD GENERATION\
**Status:** ACCEPTED --- DESIGN DIRECTION\
**Wstępna faza:** MVP candidate\
**Priorytet projektowy:** HIGH

Geografia Tick 0 powinna móc tworzyć miejsca o dużym znaczeniu
strategicznym bez ręcznego oznaczania ich jako „ważne".

Przykłady:

-   mountain pass,
-   river crossing,
-   natural harbor,
-   desert corridor,
-   fertile basin,
-   strategic strait,
-   narrow land connection,
-   transport hub created by topology.

Znaczenie wynika z normalnych mechanizmów:

`topology / terrain → Effective Distance → route attractiveness → trade concentration → settlement growth → economic importance → political interest`

Region nie otrzymuje arbitralnego bonusu „Strategic +20%".

Causality Engine powinien umożliwić po setkach lat wskazanie warunku
geograficznego z Tick 0 jako jednej z głębokich przyczyn późniejszego
rozwoju.

## FC-IDEA-015 --- Civilizational Decline & Abandoned Settlements

**Typ:** FEATURE INTEGRATION\
**Status:** ACCEPTED --- DESIGN DIRECTION\
**Wstępna faza:** MVP candidate\
**Priorytet projektowy:** HIGH

Rozwój osad i gospodarek nie może być jednokierunkowy.

Możliwy jest ciąg:

`Village → Town → City → Major Center`

ale również:

`Major Center → resource depletion / trade loss / company failures / war / disaster → unemployment → migration → population decline → infrastructure decay → abandoned settlement`

Opuszczone miejsce powinno pozostać częścią historii świata.

W przyszłości może dojść do:

-   ponownego zasiedlenia,
-   wykorzystania pozostałej infrastruktury,
-   odkrycia dawnych zasobów lub wiedzy,
-   powstania nowej społeczności w tym samym miejscu.

Chronicle powinno rozróżniać pierwsze powstanie osady, jej upadek oraz
ewentualne ponowne zasiedlenie.

------------------------------------------------------------------------

# 11. Priorytety nowych zaakceptowanych kierunków

Wstępne uporządkowanie nie jest jeszcze roadmapą implementacyjną.

  -----------------------------------------------------------------------------
  ID             Kierunek          Status         Wstępna faza   Priorytet
                                                                 projektowy
  -------------- ----------------- -------------- -------------- --------------
  FC-IDEA-009    Natural Disasters ACCEPTED       MVP candidate  MEDIUM

  FC-IDEA-010    Disease &         ACCEPTED       MVP/FULL       MEDIUM
                 Epidemics                        candidate      

  FC-IDEA-011    Emergent          ACCEPTED       MVP/FULL       HIGH
                 Historical                       candidate      
                 Characters                                      

  FC-IDEA-012    Great             ACCEPTED       MVP candidate  HIGH
                 Transformations /                               
                 Emergent Eras                                   

  FC-IDEA-013    Knowledge Loss &  ACCEPTED       FULL candidate MEDIUM
                 Rediscovery                                     

  FC-IDEA-014    Strategic         ACCEPTED       MVP candidate  HIGH
                 Geography /                                     
                 Natural                                         
                 Bottlenecks                                     

  FC-IDEA-015    Civilizational    ACCEPTED       MVP candidate  HIGH
                 Decline &                                       
                 Abandoned                                       
                 Settlements                                     
  -----------------------------------------------------------------------------

**World Volatility nie zostało zaakceptowane i nie jest dodawane jako
nowe ustawienie kreatora świata.**

# 12. Decyzje wymagane przed ewentualnym zatwierdzeniem

## Historical Characters

Do rozstrzygnięcia: 1. Czy gracz tworzy postać ręcznie, czy wybiera
archetyp? 2. Czy postać pojawia się „znikąd", czy jest promowana z
istniejącej kohorty? 3. Jak duża może być maksymalna zdolność postaci?
4. Jak działa starzenie, śmierć i dziedzictwo? 5. Czy postać może
migrować? 6. Czy może zakładać organizacje/firmy? 7. Czy może zdobyć
władzę polityczną? 8. Jak Character AI różni się od Company/State AI? 9.
Jak mierzyć jej rzeczywisty causal contribution?

## Warfare

Do rozstrzygnięcia: 1. Jaka jest minimalna reprezentacja armii? 2.
Region-based fronts czy bardziej abstrakcyjne kampanie? 3. Jak działa
kontrola/okupacja? 4. Jak powstaje manpower? 5. Jak powstaje
wyposażenie? 6. Jak działa logistyka? 7. Jak niszczona i odbudowywana
jest infrastruktura? 8. Jak działa pokój? 9. Jak powstają sojusze? 10.
Jak głęboko modelować politykę wewnętrzną? 11. Jak Historical Characters
wpływają na państwo i wojnę?

------------------------------------------------------------------------

# 13. Rekomendacja dla obecnej implementacji

1.  **Nie rozszerzać obecnego Vertical Slice o wojnę.**
2.  **Nie implementować jeszcze pełnego Character System.**
3.  Zachować istniejący `HistoricalCharacter` jako punkt rozszerzenia.
4.  Zapisać `Introduce Historical Character` jako kandydacką interwencję
    POST-VS.
5.  Podczas projektowania Population, Technology, Company AI, Causality
    i Chronicle nie zamykać architektury na późniejsze Historical
    Characters.
6.  Wojny projektować dopiero po sprawdzeniu autonomicznej gospodarki,
    migracji, technologii, State/Nation i Causality.
7.  Rozbudowane Initial Conditions można rozwijać wcześniej, ponieważ są
    naturalnym rozszerzeniem istniejącego World Generation i Experiment
    Mode.
8.  Każdy zaakceptowany pomysł z tego dokumentu musi zostać przeniesiony
    do właściwej specyfikacji przed implementacją.

------------------------------------------------------------------------

# 14. Najważniejsza zasada nowych funkcji

> **Nowa funkcja jest dobra dla FIRST CAUSE wtedy, gdy tworzy nowe
> przyczyny, nowe autonomiczne decyzje albo nowe możliwe konsekwencje
> --- a nie wtedy, gdy daje graczowi bezpośrednią kontrolę nad
> wynikiem.**
