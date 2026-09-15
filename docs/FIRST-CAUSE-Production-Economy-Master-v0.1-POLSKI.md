# FIRST CAUSE --- Production Economy Master v0.1

**Język kanoniczny dokumentu:** polski

**Status:** wersja robocza / kanoniczna specyfikacja projektowa\
**Projekt:** FIRST CAUSE\
**Wersja dokumentu:** 0.1\
**Rola:** nadrzędna specyfikacja zasobów, dóbr, archetypów firm, metod
produkcji, popytu, logistyki, substytucji, wyczerpywania zasobów i
ewolucji gospodarczej.\
**Dokumenty bazowe:** `FIRST-CAUSE-Simulation-Model-v0.1.md`,
`FIRST-CAUSE-koncepcja-architektura-v0.6.md`.

------------------------------------------------------------------------

## 0. Cel dokumentu

Dokument definiuje docelową gospodarkę produkcyjną FIRST CAUSE. Nie jest
listą zawartości wyłącznie dla Vertical Slice. Najpierw projektujemy
pełny model gospodarki, a następnie aktywujemy jego elementy etapami
`VS / MVP / FULL`.

> **Gospodarka nie tworzy rezultatów dlatego, że skrypt tak zdecydował.
> Rezultaty powstają dlatego, że zasoby, praca, wiedza, kapitał,
> energia, infrastruktura, transport, popyt i ceny tworzą określone
> warunki.**

Kanoniczny przepływ:

`ZASÓB → WYDOBYCIE/POZYSKANIE → PRZETWÓRSTWO → DOBRO POŚREDNIE → DOBRO FINALNE/KAPITAŁOWE → TRANSPORT → RYNEK → KONSUMPCJA/INWESTYCJA`

Usługi działają równolegle i nie są fizycznym zapasem.

### 0.1 Cele projektowe

1.  Każde fizyczne dobro ma realne źródło.
2.  Każda firma produkcyjna ma sensowne wejścia i wyjścia.
3.  Każdy zasób ma zastosowanie gospodarcze lub strategiczne.
4.  Technologie odblokowują możliwości, a nie płaskie bonusy.
5.  Metody produkcji konkurują ekonomicznie.
6.  Niedobory propagują się przez łańcuchy dostaw.
7.  Transport i magazynowanie mają znaczenie.
8.  Wyczerpanie złóż zmienia historię regionów.
9.  Wzrost zamożności zmienia strukturę popytu.
10. Model jest data-driven i rozszerzalny bez przepisywania głównego
    silnika.
11. Te same reguły obsługują Vertical Slice i duży świat.
12. Fakty symulacyjne są oddzielone od narracji i prezentacji.

------------------------------------------------------------------------

# 1. Ontologia gospodarki

Typy obiektów:

-   **RESOURCE / ZASÓB** --- naturalne złoże, odnawialny zasób lub
    naturalny strumień.
-   **RAW_GOOD / DOBRO SUROWE** --- minimalnie przetworzony produkt
    rolny lub wydobywczy.
-   **INTERMEDIATE_GOOD / DOBRO POŚREDNIE** --- produkt zużywany głównie
    przez firmy.
-   **FINAL_GOOD / DOBRO FINALNE** --- produkt konsumowany głównie przez
    ludność lub instytucje.
-   **CAPITAL_GOOD / DOBRO KAPITAŁOWE** --- trwałe wyposażenie
    zwiększające lub umożliwiające produkcję.
-   **ENERGY_GOOD / NOŚNIK ENERGII** --- magazynowalne paliwo; energia
    elektryczna jest osobnym przepływem.
-   **SERVICE / USŁUGA** --- niemagazynowalna zdolność usługowa.
-   **INFRASTRUCTURE_INPUT / WKŁAD INFRASTRUKTURALNY** --- dobro silnie
    wykorzystywane w budowie infrastruktury.

Warstwy gospodarki: 1. środowisko i zasoby, 2. rolnictwo i wydobycie, 3.
przetwórstwo, 4. produkcja przemysłowa, 5. dystrybucja i usługi, 6.
konsumpcja i inwestycje.

### 1.1 Zakaz logiki hardcoded

Silnik nie powinien zawierać wyjątków typu `if company == steelworks`.
Powinien interpretować dane: receptury, wymagania pracy, energii,
umiejętności, infrastruktury, wiedzy, zdolności produkcyjnej, cen, marż
i dostępu do rynku.

------------------------------------------------------------------------

# 2. Fazy wdrożenia

-   **VS** --- konieczne dla pierwszego Vertical Slice i testu Black
    Mountain.
-   **MVP** --- konieczne dla pierwszej szeroko grywalnej gospodarki.
-   **FULL** --- docelowa pełna zawartość.

Faza określa moment aktywacji, a nie przynależność do modelu.

------------------------------------------------------------------------

# 3. Model zasobu

Każdy zasób powinien obsługiwać:

``` yaml
id:
name_key:
category:
renewable:
occurrence:
  terrain:
  climate:
  geology:
deposit:
  quantity:
  quality:
  depth:
  accessibility:
  regeneration_rate:
discovery:
  visible_from_start:
  knowledge_requirements:
  difficulty:
extraction:
  company_archetypes:
  production_methods:
depletion:
  enabled:
  quality_decline:
  marginal_cost_growth:
uses:
substitutes:
strategic_tags:
implementation_phase:
```

Dla zasobów odnawialnych `quantity` może oznaczać trwałą wydajność /
pojemność środowiska zamiast skończonego złoża.

------------------------------------------------------------------------

# 4. Kanoniczny katalog 38 zasobów

## Żywność i rolnictwo

1.  **Grain / Zboże --- VS** --- mąka, żywność, pasza; zależne od
    żyzności, wody i wiedzy rolniczej.
2.  **Rice / Ryż --- FULL** --- podstawowa żywność; wymaga odpowiedniego
    klimatu i/lub irygacji.
3.  **Maize / Kukurydza --- MVP** --- żywność, pasza, późniejsze
    zastosowania przemysłowe.
4.  **Potatoes / Ziemniaki --- FULL** --- wydajne źródło żywności w
    odpowiednich warunkach.
5.  **Fruit / Owoce --- MVP** --- świeża i przetworzona żywność; wysoka
    wrażliwość logistyczna.
6.  **Vegetables / Warzywa --- MVP** --- żywność; wysoka psujność.
7.  **Livestock / Zwierzęta hodowlane --- VS** --- mięso, skóra, wełna;
    wymagają paszy/pastwisk i wody.
8.  **Fish / Ryby --- VS** --- żywność; zasób odnawialny podatny na
    przełowienie.

## Materiały organiczne

9.  **Timber / Drewno --- VS** --- tarcica, papier, meble, budownictwo,
    wczesna energia.
10. **Cotton / Bawełna --- VS** --- włókno tekstylne.
11. **Wool / Wełna --- MVP** --- tekstylia i odzież.
12. **Flax / Len --- FULL** --- tekstylia.
13. **Rubber / Kauczuk --- FULL** --- opony i wyroby przemysłowe.
14. **Leather / Skóra --- MVP** --- odzież i wyroby użytkowe.

## Materiały budowlane

15. **Stone / Kamień --- VS** --- budownictwo; ciężki i tani w
    transporcie.
16. **Clay / Glina --- VS** --- cegły i ceramika.
17. **Sand / Piasek --- MVP** --- szkło i budownictwo.
18. **Limestone / Wapień --- VS** --- cement i zastosowania hutnicze.
19. **Marble / Marmur --- FULL** --- budownictwo prestiżowe i dobra
    luksusowe.

## Metale podstawowe

20. **Iron Ore / Ruda żelaza --- VS** --- żelazo i stal.
21. **Copper Ore / Ruda miedzi --- MVP** --- miedź, elektryfikacja,
    telekomunikacja.
22. **Tin / Cyna --- FULL** --- stopy i zastosowania przemysłowe.
23. **Lead / Ołów --- FULL** --- przemysł, chemia, elektryka.
24. **Zinc / Cynk --- FULL** --- stopy i ochrona metali.
25. **Bauxite / Boksyt --- FULL** --- aluminium; przetwarzanie
    energochłonne.

## Metale szlachetne

26. **Gold / Złoto --- MVP** --- magazyn wartości, finanse, luksus,
    później elektronika.
27. **Silver / Srebro --- FULL** --- luksus, finanse i zastosowania
    przemysłowe.

## Energia

28. **Coal / Węgiel --- VS** --- przemysł, hutnictwo, ogrzewanie,
    energetyka.
29. **Oil / Ropa naftowa --- MVP** --- paliwa i chemia.
30. **Natural Gas / Gaz ziemny --- FULL** --- energia, chemia,
    elektryczność.
31. **Uranium / Uran --- FULL** --- zaawansowana energetyka.

## Surowce przemysłowe i strategiczne

32. **Sulfur / Siarka --- FULL** --- chemikalia i nawozy.
33. **Salt / Sól --- MVP** --- żywność, konserwacja, chemia.
34. **Phosphate / Fosforyty --- MVP** --- nawozy.
35. **Nickel / Nikiel --- FULL** --- zaawansowane stopy i przemysł.
36. **Lithium / Lit --- FULL** --- zaawansowane systemy elektryczne i
    magazynowania.
37. **Rare Earths / Metale ziem rzadkich --- FULL** --- elektronika i
    urządzenia zaawansowane.
38. **Graphite / Grafit --- FULL** --- metalurgia, baterie i przemysł
    zaawansowany.

------------------------------------------------------------------------

# 5. Model dobra

``` yaml
id:
name_key:
primary_category:
tags:
inputs:
produced_by:
production_methods:
used_by:
household_need:
demand_sources:
storage:
  perishability:
  storage_cost:
transport:
  bulk:
  cargo_factor:
  security_sensitivity:
  value_density:
substitutes:
technology_requirements:
implementation_phase:
```

Źródła popytu: - gospodarstwa domowe, - zużycie pośrednie firm, -
inwestycje firm, - infrastruktura, - państwo, - usługi, - eksport.

Popyt nie może być sztucznie generowany tylko po to, aby producent miał
odbiorcę.

------------------------------------------------------------------------

# 6. Kanoniczny katalog 64 dóbr

## Żywność i potrzeby podstawowe

G01 **Staple Crops / Podstawowe płody rolne --- VS**\
G02 **Flour / Mąka --- VS**\
G03 **Bread & Basic Food / Pieczywo i podstawowa żywność --- VS**\
G04 **Meat / Mięso --- VS**\
G05 **Fish Food / Żywność rybna --- VS**\
G06 **Fresh Produce / Świeża żywność roślinna --- MVP**\
G07 **Processed Food / Żywność przetworzona --- MVP**\
G08 **Preserved Food / Żywność konserwowana --- MVP**\
G09 **Soap & Hygiene Goods / Środki higieniczne --- MVP**\
G10 **Pharmaceuticals / Farmaceutyki --- FULL**

## Tekstylia i dobra osobiste

G11 **Raw Textile Fiber / Surowe włókno tekstylne --- VS**\
G12 **Textiles / Tekstylia --- VS**\
G13 **Clothing / Odzież --- VS**\
G14 **Leather Goods / Wyroby skórzane --- MVP**

## Drewno, papier i wyposażenie

G15 **Lumber / Tarcica --- VS**\
G16 **Furniture / Meble --- VS**\
G17 **Paper / Papier --- MVP**\
G18 **Printed Materials / Materiały drukowane --- FULL**

## Budownictwo

G19 **Cut Stone / Obrabiany kamień --- VS**\
G20 **Bricks / Cegły --- VS**\
G21 **Cement / Cement --- VS**\
G22 **Glass / Szkło --- MVP**\
G23 **Pottery & Ceramics / Ceramika --- MVP**\
G24 **Construction Materials / Materiały budowlane --- VS** ---
opcjonalny koszyk agregujący; nie zastępuje fizycznych dóbr bazowych.

## Metale i materiały przemysłowe

G25 **Iron / Żelazo --- VS**\
G26 **Steel / Stal --- VS**\
G27 **Copper / Miedź --- MVP**\
G28 **Tin Metal / Cyna metaliczna --- FULL**\
G29 **Lead Metal / Ołów metaliczny --- FULL**\
G30 **Zinc Metal / Cynk metaliczny --- FULL**\
G31 **Aluminum / Aluminium --- FULL**\
G32 **Precious Metals / Metale szlachetne --- MVP**\
G33 **Industrial Alloys / Stopy przemysłowe --- FULL**

## Narzędzia i maszyny

G34 **Hand Tools / Narzędzia ręczne --- VS**\
G35 **Machinery / Maszyny --- VS**\
G36 **Advanced Machinery / Zaawansowane maszyny --- FULL**\
G37 **Mining Equipment / Sprzęt górniczy --- MVP**\
G38 **Agricultural Machinery / Maszyny rolnicze --- MVP**\
G39 **Construction Equipment / Sprzęt budowlany --- MVP**

## Energia i chemia

G40 **Biomass Fuel / Paliwo z biomasy --- VS**\
G41 **Coal Fuel / Paliwo węglowe --- VS**\
G42 **Refined Fuel / Paliwo rafinowane --- MVP**\
G43 **Industrial Gas / Gaz przemysłowy --- FULL**\
G44 **Chemicals / Chemikalia --- MVP**\
G45 **Fertilizer / Nawozy --- MVP**\
G46 **Rubber Products / Wyroby gumowe --- FULL**\
G47 **Tires / Opony --- FULL**\
G48 **Nuclear Fuel / Paliwo jądrowe --- FULL**\
G49 **Electricity / Energia elektryczna --- MVP** --- przepływ bieżącego
okresu, bez zwykłego magazynu w v0.1.

## Wyposażenie transportowe

G50 **Carts / Wozy --- VS**\
G51 **Ships / Statki --- MVP**\
G52 **Rail Equipment / Tabor i wyposażenie kolejowe --- MVP**\
G53 **Automobiles / Samochody --- FULL**

## Elektryka, komunikacja i elektronika

G54 **Electrical Equipment / Urządzenia elektryczne --- MVP**\
G55 **Telecommunications Equipment / Sprzęt telekomunikacyjny ---
FULL**\
G56 **Electronics / Elektronika --- FULL**\
G57 **Advanced Electronics / Zaawansowana elektronika --- FULL**\
G58 **Batteries & Storage Equipment / Baterie i urządzenia magazynujące
--- FULL** --- nie oznacza automatycznie magazynowania energii sieciowej
w v0.1.

## Dobra dobrobytu

G59 **Household Goods / Dobra gospodarstwa domowego --- MVP**\
G60 **Luxury Goods / Dobra luksusowe --- FULL**

## Dobra instytucjonalne

G61 **Medical Supplies / Zaopatrzenie medyczne --- MVP**\
G62 **Education Supplies / Zaopatrzenie edukacyjne --- MVP**\
G63 **Infrastructure Equipment / Wyposażenie infrastrukturalne ---
MVP**\
G64 **Communication Media / Media komunikacyjne --- FULL**

------------------------------------------------------------------------

# 7. Usługi

Usługi są niemagazynowalną zdolnością: 1. handel detaliczny, 2. handel
hurtowy, 3. transport lądowy, 4. transport wodny, 5. kolej, 6. transport
motorowy, 7. finanse, 8. budownictwo, 9. edukacja, 10. ochrona zdrowia,
11. administracja, 12. usługi profesjonalne, 13. komunikacja, 14.
dystrybucja mediów/energii.

Każda usługa ma: workforce, skill mix, infrastructure, capacity,
accessibility, price/quality oraz fizyczne wejścia, jeśli są potrzebne.

------------------------------------------------------------------------

# 8. Potrzeby gospodarstw domowych

Hierarchia:
`Survival → Basic → Services → Comfort → Prosperity → Luxury → Savings`

### Survival

podstawowa żywność, minimalne ogrzewanie/energia, podstawowe warunki
mieszkaniowe.

### Basic

odzież, zróżnicowana żywność, higiena, podstawowa opieka zdrowotna.

### Comfort

meble, dobra domowe, lepsza żywność, wyższa jakość usług.

### Prosperity

transport, komunikacja, dobra trwałe, lepsze usługi.

### Modern

elektronika, nowoczesna komunikacja, farmaceutyki, mobilność i
zaawansowane dobra trwałe.

Klasa ekonomiczna zmienia budżet, jakość preferowaną, skłonność do
substytucji, oszczędności, mobilność i udział usług --- nie tworzy
osobnego systemu gospodarki.

------------------------------------------------------------------------

# 9. Kanoniczne 28 archetypów firm

### Wydobycie i rolnictwo

C01 **Crop Farm / Gospodarstwo uprawne --- VS**\
C02 **Livestock Farm / Gospodarstwo hodowlane --- VS**\
C03 **Fishing Company / Firma rybacka --- VS**\
C04 **Forestry Company / Firma leśna --- VS**\
C05 **Mine / Kopalnia --- VS**\
C06 **Quarry / Kamieniołom --- VS**

### Przetwórstwo podstawowe

C07 **Mill & Food Processor / Młyn i przetwórnia żywności --- VS**\
C08 **Textile Producer / Producent tekstyliów --- VS**\
C09 **Sawmill & Woodworks / Tartak i zakład drzewny --- VS**\
C10 **Construction Materials Producer / Producent materiałów budowlanych
--- VS**\
C11 **Smelter / Huta metali --- VS**\
C12 **Steelworks / Huta stali --- VS**

### Produkcja

C13 **Toolmaker / Producent narzędzi --- VS**\
C14 **Furniture Manufacturer / Producent mebli --- MVP**\
C15 **Machinery Factory / Fabryka maszyn --- MVP**\
C16 **Chemical Plant / Zakład chemiczny --- MVP**\
C17 **Refinery / Rafineria --- MVP**\
C18 **Electrical Equipment Factory / Fabryka urządzeń elektrycznych ---
MVP**\
C19 **Vehicle & Transport Equipment Factory / Fabryka sprzętu
transportowego --- MVP**\
C20 **Shipyard / Stocznia --- MVP**\
C21 **Electronics Manufacturer / Producent elektroniki --- FULL**\
C22 **Pharmaceutical Manufacturer / Producent farmaceutyków --- FULL**

### Budownictwo, logistyka i dystrybucja

C23 **Construction Company / Firma budowlana --- VS**\
C24 **Transport Company / Firma transportowa --- VS**\
C25 **Trading Company / Firma handlowa --- MVP**\
C26 **Retail Company / Firma detaliczna --- MVP**

### Kapitał i usługi

C27 **Bank / Financial Institution / Instytucja finansowa --- MVP**\
C28 **Service Company / Firma usługowa --- MVP**

Edukacja, zdrowie i administracja mogą być publiczne, prywatne lub
mieszane i nie muszą zachowywać się jak zwykłe firmy maksymalizujące
zysk.

------------------------------------------------------------------------

# 10. Schemat archetypu firmy

``` yaml
id:
name_key:
sector:
allowed_outputs:
allowed_inputs:
production_methods:
capital_requirement:
facility_requirement:
workforce_profile:
skill_profile:
energy_profile:
infrastructure_requirements:
knowledge_requirements:
minimum_scale:
market_behavior:
startup_conditions:
expansion_conditions:
contraction_conditions:
shutdown_conditions:
bankruptcy_behavior:
regional_expansion:
implementation_phase:
```

Instancja firmy przechowuje dodatkowo: cash, debt, facilities,
workforce, productionMethod, inventory, revenue, costs, profit,
expectations, region, ownerType, marketShare.

------------------------------------------------------------------------

# 11. Production Methods / Metody produkcji

Technologia nie daje automatycznie `+20% produkcji`. Odblokowuje nową
metodę, a firma ocenia jej opłacalność.

Metoda może zmieniać: - wejścia i proporcje, - produkcję, - liczbę
pracowników, - strukturę umiejętności, - energię, - maszyny, -
kapitał, - minimalną skalę, - zależność od infrastruktury, - odpady i
środowisko, - koszt wdrożenia i zmiany.

``` yaml
id:
company_archetype:
outputs:
inputs:
resource_requirements:
labor:
skills:
energy:
capital_goods:
knowledge_requirements:
infrastructure_requirements:
base_productivity:
capacity_modifier:
waste:
environmental_effects:
minimum_scale:
adoption_cost:
switching_cost:
maintenance_cost:
implementation_phase:
```

------------------------------------------------------------------------

# 12. Rodziny metod produkcji

-   **Rolnictwo:** ręczne → zorganizowane → zwierzęce → intensywne z
    nawozami → zmechanizowane → przemysłowe.
-   **Hodowla:** ekstensywna → zarządzane pastwiska → żywienie paszowe →
    intensywna.
-   **Rybołówstwo:** brzegowe/rzeczne → małe łodzie → flota żaglowa →
    flota motorowa.
-   **Leśnictwo:** ręczne → zorganizowane → mechaniczne → zrównoważone.
-   **Górnictwo:** powierzchniowe → ręczna kopalnia → głęboka →
    mechaniczna → zaawansowane wydobycie.
-   **Kamieniołomy:** ręczne → zorganizowane → mechaniczne.
-   **Żywność:** ręczne przetwarzanie → młyn wodny/wiatrowy →
    mechaniczny → przemysłowy → nowoczesny.
-   **Tekstylia:** warsztat → zorganizowany warsztat → mechaniczna
    fabryka → elektryczna fabryka.
-   **Drewno:** ręczne → tartak wodny → mechaniczny → przemysłowy.
-   **Materiały budowlane:** piec ręczny → ulepszony → przemysłowy
    węglowy → nowoczesny.
-   **Metalurgia:** podstawowy wytop → ulepszony piec → wielki piec →
    przemysłowa stal → nowoczesne stopy.
-   **Narzędzia:** rzemiosło → warsztat → produkcja maszynowa →
    precyzyjna.
-   **Maszyny:** warsztatowe → standaryzowane → zelektryfikowane →
    precyzyjne.
-   **Chemia:** podstawowa → przemysłowa → petrochemia → zaawansowana
    synteza.
-   **Rafinacja:** podstawowa → przemysłowa → zintegrowana petrochemia.
-   **Energia:** lokalna węglowa → sieciowa węglowa → ropa/gaz → hydro →
    atom.
-   **Transport:** pieszy → zwierzęta juczne → wozy → rzeka → żagiel →
    kolej → motor → nowoczesna żegluga.
-   **Elektryka:** warsztat → fabryka → produkcja masowa.
-   **Elektronika:** wczesna → masowa → zaawansowana.

Dokładne odkrycia odblokowujące te metody należą do
`Technology-Discovery-Catalog`.

------------------------------------------------------------------------

# 13. Główne łańcuchy produkcyjne

### Żywność

`Zboże → Młyn → Mąka → Żywność podstawowa → Ludność`\
`Zwierzęta → Mięso → Ludność`\
`Ryby → Żywność → Ludność`\
`Owoce/warzywa → Świeża/przetworzona żywność`

### Tekstylia

`Bawełna/Wełna/Len → Włókno → Tekstylia → Odzież`

### Drewno

`Drewno → Tarcica → Budownictwo/Meble/Statki/Wozy`\
`Drewno → Papier → Druk/Edukacja/Administracja`\
`Drewno → Biomasa → Energia`

### Budownictwo

`Kamień → Obrabiany kamień`\
`Glina → Cegły/Ceramika`\
`Wapień → Cement`\
`Piasek → Szkło`\
`Materiały + praca + sprzęt → budynki/infrastruktura`

### Żelazo i stal

`Ruda żelaza + energia → Żelazo`\
`Żelazo + węgiel/energia → Stal`\
`Stal → Narzędzia/Maszyny/Kolej/Budownictwo`

### Maszyny

`Stal + Narzędzia → Maszyny → mechanizacja innych sektorów`

### Węgiel i elektryczność

`Węgiel → paliwo → przemysł/ogrzewanie`\
`Węgiel + elektrownia → Elektryczność → zelektryfikowane PM`

### Ropa

`Ropa → Rafineria → Paliwo + wsad chemiczny → transport/chemia`

### Miedź i elektryka

`Ruda miedzi → Miedź → Urządzenia elektryczne → elektryfikacja`

### Elektronika

`Miedź + urządzenia elektryczne + surowce strategiczne → Elektronika → zaawansowana elektronika`

------------------------------------------------------------------------

# 14. Macierz zależności --- rdzeń

  ---------------------------------------------------------------------------------------------
  Zasób/wejście       Przetwórca                Wynik               Główni odbiorcy
  ------------------- ------------------------- ------------------- ---------------------------
  Zboże               młyn                      mąka                żywność

  Zwierzęta           przetwórnia               mięso/skóra/wełna   ludność/tekstylia

  Ryby                rybołówstwo/przetwórnia   żywność rybna       ludność

  Drewno              tartak                    tarcica             budownictwo/meble/statki

  Bawełna/Wełna/Len   tekstylia                 tkaniny             odzież

  Kamień              kamieniołom               obrabiany kamień    budownictwo

  Glina               materiały                 cegły/ceramika      budownictwo/ludność

  Piasek              materiały                 szkło               budownictwo/elektryka

  Wapień              materiały                 cement              budownictwo

  Ruda żelaza         huta                      żelazo              stal/narzędzia

  Żelazo + węgiel     stalownia                 stal                maszyny/kolej/budownictwo

  Ruda miedzi         huta                      miedź               elektryka/telekomunikacja

  Boksyt              huta                      aluminium           transport/elektryka

  Węgiel              kopalnia/energetyka       paliwo/energia      przemysł

  Ropa                rafineria                 paliwo              transport/chemia

  Gaz                 energetyka/chemia         gaz przemysłowy     energia/chemia

  Fosforyty           chemia                    nawóz               rolnictwo

  Uran                zaaw. przetwórstwo        paliwo jądrowe      energetyka

  Lit/Grafit/Nikiel   zaaw. przemysł            baterie             urządzenia zaawansowane

  Ziemie rzadkie      elektronika               zaaw. elektronika   telekom/machinery
  ---------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 15. Dobra kapitałowe

Narzędzia, maszyny i sprzęt specjalistyczny muszą tworzyć realny popyt
inwestycyjny. Popyt wynika z: - zakładania firm, - rozbudowy, - zmiany
Production Method, - utrzymania i amortyzacji, - projektów
infrastrukturalnych.

Dokładne tempo amortyzacji jest parametrem balansowym.

------------------------------------------------------------------------

# 16. Energia

Etapy możliwości: `Biomasa → Węgiel → Ropa i gaz → Elektryczność`.

Nie są to obowiązkowe epoki.

PM może wymagać: brak dedykowanego paliwa, biomasa, węgiel, paliwo
rafinowane, gaz lub elektryczność.

Brak energii powoduje spadek wykorzystania zdolności, zmianę
opłacalności lub powrót do starszej metody, jeśli jest dostępna.

Energia elektryczna w v0.1 jest przepływem bieżącego okresu; nadwyżka
nie trafia automatycznie do magazynu.

------------------------------------------------------------------------

# 17. Transport i magazynowanie

`TransportCost = EffectiveDistance × CargoFactor × TransportModeCost × CongestionModifier`

Każde dobro ma: bulk, value_density, perishability, cargo_factor,
security_sensitivity, storage_cost.

Przykładowo: - kamień: bardzo ciężki, tani, ekstremalnie wrażliwy na
transport, - świeża żywność: wysoka psujność, - stal: ciężka, średnia
wartość, - maszyny: wyższa wartość, - złoto: mała masa, bardzo wysoka
wartość i ryzyko bezpieczeństwa, - elektronika: mała masa i wysoka
wartość.

Zapasy są fizyczne. W przyszłości można różnicować magazyny: zwykłe,
chłodnicze, niebezpieczne, zabezpieczone.

------------------------------------------------------------------------

# 18. Substytucja

Substytucja może dotyczyć: - konsumpcji, - wejść produkcyjnych, -
budownictwa, - energii, - transportu, - metod produkcji.

Substytut działa tylko wtedy, gdy: 1. istnieje wiedza, 2. istnieje
kompatybilny PM, 3. materiał jest dostępny, 4. koszt jest akceptowalny,
5. firma może ponieść koszt zmiany.

Przykłady: - różne rodzaje żywności częściowo się zastępują, - drewno
może być wypierane przez cegłę/stal/cement, - biomasa przez węgiel, -
węgiel przez elektryczność lub paliwa, - lokalna ruda przez import po
wyczerpaniu złoża.

Substytucja nie jest natychmiastowa ani uniwersalna.

------------------------------------------------------------------------

# 19. Wyczerpywanie zasobów

`NewQuantity = OldQuantity - Extraction`

Spadek dostępności może oznaczać: - gorszą jakość, - większą
głębokość, - wyższy koszt krańcowy, - konieczność nowej technologii.

Po ekonomicznym wyczerpaniu złoża możliwe są emergentne ścieżki: 1.
Resource Bust, 2. Economic Diversification, 3. Import Transition, 4.
Technological Extension, 5. Substitution, 6. Ghost Settlement.

Nie są to skrypty --- wynikają z decyzji firm, cen, handlu, migracji i
technologii.

------------------------------------------------------------------------

# 20. Powstawanie firm

Koncepcyjnie:

`OpportunityScore = DemandGap + ExpectedMargin + ResourceAccess + LaborAvailability + SkillAvailability + MarketAccess - Competition - Risk - CapitalRequirement`

Firma może powstać tylko wtedy, gdy jej model produkcji jest realnie
wykonalny.

------------------------------------------------------------------------

# 21. Planowanie produkcji

`ExpectedRevenue = ExpectedOutput × ExpectedPrice`

`ExpectedCost = Inputs + Wages + Energy + Transport + Taxes + Maintenance + Financing + Adoption/Switching`

Firma porównuje: - obecną metodę, - alternatywne metody, - rozbudowę, -
ograniczenie produkcji, - wejście/wyjście z rynku, - zamknięcie.

Prognozy są niedoskonałe.

------------------------------------------------------------------------

# 22. Ewolucja gospodarki bez sztywnych epok

`Wiedza + Zasoby + Kapitał + Popyt + Infrastruktura + Dostęp do rynku + Instytucje → Możliwości gospodarcze`

Światy mogą rozwijać się odmiennie. Jedne staną się centrami handlu,
inne hutnictwa, rolnictwa, chemii czy zaawansowanej produkcji. Pułap
technologiczny pozostaje na poziomie współczesnym.

------------------------------------------------------------------------

# 23. Pętle sprzężeń

Dokument wspiera rejestr Simulation Model: - FL-001 Prosperity, - FL-002
Urban Crisis, - FL-003 Resource Boom, - FL-004 Resource Bust, - FL-005
Industrialization, - FL-006 Innovation, - FL-007 Poverty Trap, - FL-008
Trade Hub, - FL-009 War Economy/Destruction, - FL-010 Environmental
Degradation.

------------------------------------------------------------------------

# 24. Proponowany podzbiór Vertical Slice

### Zasoby

Zboże, zwierzęta, ryby, drewno, bawełna, kamień, glina, wapień, ruda
żelaza, węgiel; opcjonalnie piasek i sól.

### Dobra --- rdzeń

Podstawowe płody rolne, mąka, podstawowa żywność, mięso, ryby, włókno,
tekstylia, odzież, tarcica, kamień/materiały budowlane, cegły, cement,
żelazo, stal, narzędzia.

Rozszerzenie: meble, maszyny, biomasa, paliwo węglowe, wozy.

### Black Mountain

`odkrycie rudy → szansa ekonomiczna → kopalnia → zatrudnienie → migracja → wzrost osady → handel → urbanizacja → wyczerpanie → dywersyfikacja/import/technologia/kryzys/ghost settlement`

Sekwencja musi być emergentna.

------------------------------------------------------------------------

# 25. MVP i FULL

**MVP** powinno umożliwiać mechanizację, kolej, elektryfikację, chemię,
ropę, nawozy, bogatszą konsumpcję i specjalizację regionalną.

**FULL** dodaje strategiczne minerały, zaawansowane stopy, samochody,
telekomunikację, elektronikę, baterie, farmaceutyki i zaawansowane
maszyny.

Nie wszystkie regiony korzystają z wszystkich gałęzi.

------------------------------------------------------------------------

# 26. Walidacja danych

### Błędy krytyczne

-   dobro bez producenta,
-   receptura odwołująca się do nieistniejącego obiektu,
-   firma bez produktu,
-   ujemny współczynnik,
-   produkcja bez wejść,
-   elektryczność w zwykłym magazynie v0.1,
-   wydobycie tworzące zasób nieodnawialny,
-   eksport większy od zapasu.

### Ostrzeżenia

-   zasób bez zastosowania,
-   dobro bez odbiorcy,
-   firma bez wykonalnej receptury,
-   martwa metoda produkcji,
-   pętla bez wejścia zewnętrznego,
-   dobro kapitałowe bez popytu odtworzeniowego,
-   przeciek zależności FULL → VS,
-   brak klucza lokalizacji.

------------------------------------------------------------------------

# 27. Automatyczny audyt grafu gospodarki

Generator powinien budować graf:

`Zasób → Receptura → Dobro → Firma/Gospodarstwo/Państwo → Kolejne dobro/Potrzeba`

Audyt wykrywa: 1. dobra nieosiągalne, 2. ślepe końce, 3. osierocone
zasoby, 4. niemożliwe łańcuchy, 5. przecieki faz, 6. pętle, 7. krytyczne
pojedyncze zależności, 8. brak pełnego łańcucha Survival, 9. brak
ścieżki energetycznej, 10. brak ścieżki transportowej.

------------------------------------------------------------------------

# 28. Parametry balansowe

Nie zamrażać w v0.1: - wielkości złóż, - wydajności odnawialnej, -
współczynników receptur, - produktywności PM, - pracy i umiejętności, -
energii, - psucia, - kosztów magazynowania, - cargo factors, -
elastyczności cen, - buforów zapasów, - kapitału startowego, - progów
bankructwa, - amortyzacji, - substytucji, - wag popytu, - kosztów
infrastruktury.

To dane konfiguracyjne.

------------------------------------------------------------------------

# 29. Haki przyczynowości

Operacje gospodarcze emitują fakty m.in.: `resource_discovered`,
`extraction_changed`, `deposit_quality_declined`, `capacity_added`,
`production_method_adopted`, `input_shortage`, `price_changed`,
`trade_route_viable`, `company_founded`, `company_closed`,
`employment_changed`, `wages_changed`, `needs_changed`,
`migration_attraction_changed`.

WHY? korzysta z faktów, a warstwa narracyjna jedynie je formatuje.

------------------------------------------------------------------------

# 30. Haki technologiczne i środowiskowe

Production Economy Master określa, **co technologia ma odblokowywać**,
ale nie pełne drzewo odkryć. Obowiązuje:
`Discovery ≠ Availability ≠ Adoption`.

PM mogą generować degradację ziemi, presję wodną, wycinkę,
zanieczyszczenia i odpady, które wracają do gospodarki przez plony,
zdrowie, atrakcyjność i koszty.

------------------------------------------------------------------------

# 31. Państwo i infrastruktura

Infrastruktura może generować realny popyt na stal, cement, maszyny,
pracę i wyposażenie.

Docelowa zasada:
`Budżet + materiały + maszyny + praca + wiedza + zdolność wykonawcza → infrastruktura`

Pieniądz sam nie tworzy fizycznej kolei, portu czy elektrowni.

------------------------------------------------------------------------

# 32. Handel i specjalizacja

`ImportedCost = ForeignPrice + TransportCost + Tariff + RiskCost`

Handel wpływa na transport, kongestię, ceny, specjalizację i powstawanie
firm.

Specjalizacja regionu wynika z zasobów, wiedzy, umiejętności,
infrastruktury, energii, kapitału, dostępu do rynku i historii. Etykiety
typu „zagłębie stalowe" czy „hub handlowy" są opisem emergentnego stanu,
a nie klasą regionu.

------------------------------------------------------------------------

# 33. Path dependence i kryzysy

Historia inwestycji ma znaczenie: kompetencje, infrastruktura, kapitał i
sieci handlowe pozostają po dawnych gałęziach.

Przykładowe propagacje: - nieurodzaj → droższa żywność → mniej wydatków
dyskrecjonalnych → kryzys firm konsumpcyjnych, - brak węgla → droższa
stal/energia → droższe maszyny/budownictwo → słabsze inwestycje, -
zatłoczona trasa → droższy import → niedobory → ceny →
substytucja/lokalne inwestycje, - odkrycie złoża → inwestycje → praca →
migracja → urbanizacja → presja mieszkaniowa.

------------------------------------------------------------------------

# 34. Determinizm i wydajność

Wszystkie losowe decyzje używają seeded RNG. Ten sam seed, świat,
konfiguracja i interwencje Architekta mają dawać tę samą historię.

Dla wydajności: - popyt gospodarstw agregowany przez kohorty/klasy, -
regionalne rynki, - rzadkie/sensowne kandydatury handlowe, - cache
danych receptur, - brak symulacji pojedynczych zakupów, - agregacja mało
istotnych faktów przyczynowych.

------------------------------------------------------------------------

# 35. Proponowana struktura danych

``` text
/data/economy/
  resources/
  goods/
  companies/
  production_methods/
  substitutions/
  balance/
```

Logika silnika pozostaje oddzielona od danych.

------------------------------------------------------------------------

# 36. Otwarte decyzje po v0.1

Nie zamrażamy jeszcze: 1. dokładnych ilości receptur, 2. finalnej liczby
dóbr, jeśli audyt wykaże lukę, 3. amortyzacji, 4. wag popytu, 5. wymagań
kapitałowych, 6. współczynników środowiskowych, 7. elastyczności
substytucji, 8. dokładnych odkryć technologicznych, 9. reguł własności,
10. pełnego kredytu, 11. topologii sieci elektrycznej, 12. głębokości
systemu magazynów, 13. stopnia agregacji surowych płodów w UI.

------------------------------------------------------------------------

# 37. Ustalenia kanoniczne v0.1

-   38 zasobów.
-   Docelowo ok. 50--70 dóbr; v0.1 proponuje 64.
-   Docelowo ok. 20--30 archetypów firm; v0.1 proponuje 28.
-   Production Methods zamiast płaskich bonusów.
-   Regionalne rynki i fizyczny transport.
-   Usługi poza zwykłym inventory.
-   Wyczerpywanie złóż i post-depletion transition.
-   Model data-driven.
-   Hierarchia potrzeb gospodarstw.
-   Energia od biomasy do elektryczności bez sztywnych epok.
-   Elektryczność bez zwykłego magazynowania w v0.1.
-   Determinizm seeded RNG.
-   Pełna gospodarka projektowana przed pełnym wdrożeniem.
-   Tagi VS/MVP/FULL.
-   Brak hardcoded wyjątków dla konkretnych firm i dóbr.

------------------------------------------------------------------------

# 38. Kryteria akceptacji

-   [x] 38 zasobów
-   [x] 64 dobra
-   [x] 28 archetypów firm
-   [x] rodziny Production Methods
-   [x] główne łańcuchy
-   [x] potrzeby gospodarstw
-   [x] energia
-   [x] transport i magazynowanie
-   [x] substytucja
-   [x] wyczerpywanie złóż
-   [x] VS/MVP/FULL
-   [x] walidacja
-   [x] haki Causality/Technology
-   [ ] kalibracja liczb
-   [ ] pełny Technology & Discovery Catalog
-   [ ] Entity Data Model
-   [ ] automatyczny walidator grafu
-   [ ] test Vertical Slice

> **Projektujemy pełną gospodarkę. Aktywujemy ją etapami. Dodanie nowego
> zasobu, dobra, firmy lub metody produkcji powinno być przede wszystkim
> zmianą danych, a nie przebudową silnika.**

**KONIEC --- FIRST CAUSE Production Economy Master v0.1**
