# FIRST CAUSE --- TECHNOLOGY DISCOVERY CATALOG v0.1

**Status:** DRAFT (treść odkryć), ale **domeny/tier już CANONICAL** --
TECH-004/007/008 w `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
zaktualizowane 2026-09-18 zgodnie z tym dokumentem. Rozstrzyga formalny
"Warunek rozpoczęcia" M15 w `FIRST-CAUSE-Implementation-Roadmap-v0.2.md`
-- **techniczny krok z sekcji 5 zrobiony (2026-09-18):**
`content/discoveries/*.json` (125 plików) napisane wg
`DiscoveryDefinitionSchema` i zweryfikowane realnym pipeline'em M2
(`content-fixtures.integration.test.ts`, 0 błędów/ostrzeżeń), lokalizacja
EN+PL dodana. M15 formalnie READY. Pola tuningowe (`unlocks` na nowy
content PM/Good, `knowledgeRequirements`, `pressureModifiers`,
`diffusion`, `adoption`) pozostają puste -- to odrębny krok z sekcji 5,
konsumowany przez M15's kod, nie przez samo istnienie plików JSON.

**Niezgodność treści rozwiązana (2026-09-19):** `MEC-009` (T2) miał
jako prerekwizyt `MIN-019` (T4) -- wyższy tier o 2 poziomy niż sama
pozycja, poza wzorcem reszty katalogu (gdzie różnica prerekwizyt/pozycja
to co najwyżej 1 tier). Prerekwizyt `MIN-019` (cement) usunięty --
fortyfikacje/budowle publiczne wymagają murarstwa kamiennego (`MEC-006`,
T1, już prerekwizyt), nie cementu, który jest odrębnym, późniejszym
materiałem PM (`housing.capacity` powyżej progu, `AGR-020`/`MEC-013`/
`MEC-017`/`TRA-016`). `MEC-009` prerekwizyty: `MEC-006` (T1) --
zgodne z resztą katalogu. Zaktualizowano też
`content/discoveries/mec_009.json`.

**Data:** 2026-09-18 (druga wersja -- zastępuje pierwszą iterację z tej
samej sesji, która miała 9 wąskich domen + osobne rozszerzenie
astronautyczne; **usunięte na wyraźną prośbę użytkownika**).

**Struktura:** **5 domen po 25 odkryć = 125 łącznie.** Bez lotu
kosmicznego -- pułap domeny to zorganizowane społeczeństwo przemysłowe
(mechanizacja, medycyna, administracja), nie era kosmiczna.

**Zależy formalnie od:** `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(TECH-001--009), `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§28--31),
`FIRST-CAUSE-AI-Decision-Model-v0.1.md` (§36--41, §62),
`packages/content/src/schema/discovery-definition.ts` (istniejący od M2
schemat, którego pola ten katalog wypełnia treścią).

------------------------------------------------------------------------

# 1. Cel i zakres

Ten dokument nie jest kodem ani contentem JSON -- jest źródłem prozy, z
którego content-autor (człowiek albo przyszła sesja) przepisze każdą
pozycję do `content/discoveries/*.json`, zgodnie z istniejącym
`DiscoveryDefinitionSchema`. Ustala jakie odkrycia istnieją (id, nazwa,
domena), w jakiej kolejności (tier T0--T6, prerequisites) i co
mechanicznie odblokowują.

**Świadomie NIE ustala** dokładnych wartości liczbowych
(`knowledgeRequirements`, `pressureModifiers`, `diffusion`, `adoption`)
-- to parametry tuningowe (`TODO tuning`, ten sam wzorzec co reszta
silnika), których kalibracja wymaga uruchomienia symulacji.

## 1.1 Zmiana względem pierwszej wersji (ta sama sesja)

Po analizie porównawczej gatunku (gry strukturalnie bliskie First Cause
-- Dwarf Fortress, Anno, Songs of Syx -- **w ogóle nie mają formalnego
drzewka z domenami**, dostęp do nowych rzeczy wynika ze stanu symulacji)
i po audycie pierwszej wersji (9 domen × 8 + 5 domen × 24 = 192 pozycje),
gdzie **spora część odkryć nie robiła niczego konkretnego** -- zwłaszcza
w rozszerzeniu astronautycznym, gdzie ~85% pozycji istniało wyłącznie
jako ogniwo łańcucha prowadzącego do jednego efektownego zakończenia --
przechodzę na **5 szerokich domen, 25 odkryć każda, bez lotu kosmicznego**.
Dążę tu do **wyraźnie wyższego odsetka odkryć z konkretnym, samodzielnym
efektem** niż w pierwszej wersji (tam ~72% w Części 1, ~15% w Części 2).
**Po dodatkowym przycięciu (na prośbę użytkownika, sekcja 6) -- 111/125
(89%) ma realny efekt już dziś, 14/125 (11%) to jawnie oznaczone czyste
prerequisites, zero hooków do nieistniejących systemów zostało.**

------------------------------------------------------------------------

# 2. Metodologia

## 2.1 Domeny (nowy podział, 5 zamiast 9+5)

| Domena | Prefiks | Łączy (z pierwotnego podziału VS) |
|---|---|---|
| Rolnictwo i Żywność | `AGR` | Agriculture + żywnościowa część Medicine |
| Górnictwo i Metalurgia | `MIN` | Mining + Metallurgy |
| Budownictwo i Mechanika | `MEC` | Construction + Mechanics |
| Transport i Komunikacja | `TRA` | Transportation + Communication |
| Nauka i Społeczeństwo | `NAU` | Mathematics + reszta Medicine + administracja |

To formalnie proponuje **zmianę TECH-004** (12 kanonicznych domen →
5 szerokich, zamiast dotychczasowego podziału) -- zaznaczam to jawnie,
nie przemycam cicho. TECH-007 (T0--T5) rozszerzam do **T0--T6** (jeden
dodatkowy stopień, nie dziesięć jak w usuniętej wersji astronautycznej).

## 2.2 Tier

T0 = odkrycia startowe. T1--T5 = rosnąca złożoność. T6 = szczyt domeny w
tym katalogu -- zorganizowane społeczeństwo przemysłowe (huty, medycyna
zapobiegawcza, uniwersytety, zintegrowany transport), nie dalej.

## 2.3 "Odblokowuje" -- trzy kategorie, jawnie oznaczone

- **Realne od razu** -- wiąże się z mechanizmem, który JUŻ ISTNIEJE w
  silniku (produkcja, `employeesPerBatch` w `production.ts`,
  `TransportMode`, `deposit-lifecycle.ts`, `deathRateByAgeGroup`,
  `effectiveDistance`, `HOUSING_CONSTRUCTION_RATE`, `SettlementStage`,
  `Connection.infrastructure.level`, `Settlement.condition.
  declinePressure`/`urbanizationPressure` (`computeSettlementPressure`,
  M14), `Region.entrepreneurship` (Opportunity Scanner, M12),
  `TechnologyState.knowledge[domainId]` (0--100 akumulator per region,
  już istnieje jako typ w `packages/entities/src/technology/
  technology-state.ts` od M3, czeka na to, żeby M15 go zaczął
  zapisywać)) -- działa, gdy tylko powstanie odpowiedni content JSON.
- **(nowy content PM)** -- wymaga nowej receptury/archetypu w
  `content/productionMethods`/`content/companyArchetypes` (dziś tylko 2+2
  istnieją) -- mechanizm produkcji już istnieje, tylko dana receptura
  jeszcze nie.
- **hook** -- wskazuje na system, którego dziś W OGÓLE NIE MA w kodzie
  (Administration, Events/kryzysy, State AI) i którego dodania nie da się
  sprowadzić do "jeszcze jeden modifier na istniejącym polu" -- jawnie
  oznaczone, żeby nie sugerować gotowości, której nie ma.

**Weryfikacja (2026-09-18):** wszystkie pola/mechanizmy wymienione wyżej
jako "Realne" sprawdzone bezpośrednio w kodzie (`Grep`), nie tylko z
pamięci -- w tym przejściu przekwalifikowałem 19 pozycji z "hook" na
"Realne"/"(nowy content PM)" TYLKO tam, gdzie znalazłem faktyczne,
istniejące pole/mechanizm do podczepienia (np. `declinePressure` jest
liczone co tick i steruje `SettlementStage` -- prawdziwe; odrzuciłem
natomiast pomysł podczepienia pod "wzrost `Region.economy.wealth`" albo
"tempo wzrostu `PopulationCohort.educationLevel`" -- oba pola ISTNIEJĄ,
ale żaden kod nigdzie ich dziś organicznie nie zwiększa, więc byłby to
ten sam błąd co poprzednio, tylko przemianowany).

------------------------------------------------------------------------

# 3. Tabela zbiorcza

| Domena | Odkryć | Zakres tier | Z tego "realne od razu" lub "(nowy content PM)" | Z tego czysty prerequisite (bez hooków -- patrz niżej) |
|---|---|---|---|---|
| Rolnictwo i Żywność | 25 | T0--T6 | 23 | 2 |
| Górnictwo i Metalurgia | 25 | T0--T6 | 25 | 0 |
| Budownictwo i Mechanika | 25 | T0--T6 | 22 | 3 |
| Transport i Komunikacja | 25 | T0--T6 | 21 | 4 |
| Nauka i Społeczeństwo | 25 | T0--T6 | 20 | 5 |
| **Razem** | **125** | T0--T6 | **111 (89%)** | **14 (11%)** |

**Zmiana po przycięciu hookow (2026-09-18, na wyraźną prośbę
użytkownika):** wszystkie 19 pozycji wcześniej oznaczonych **hook**
(wskazujące na systemy, których dziś w ogóle nie ma w kodzie --
Administration, Events, State AI, rozszerzone Read Models) zostały
przeprojektowane tak, żeby wiązały się z polem/mechanizmem, który już
faktycznie ISTNIEJE i jest żywy w kodzie -- zweryfikowane bezpośrednio
`Grep`em, nie z pamięci (patrz sekcja 2.3). **Zero hooków zostało** --
pozostałe 14/125 (11%) to WYŁĄCZNIE czyste, jawnie oznaczone
prerequisites bez własnego efektu (np. "Pismo i zapis", "Proste
maszyny") -- strukturalnie konieczne ogniwa łańcucha, nie fałszywe
obietnice.

------------------------------------------------------------------------

# 4. Katalog per domena

## 4.1 Rolnictwo i Żywność (AGR)

| ID | Nazwa | Tier | Prerekwizyty | Odblokowuje |
|---|---|---|---|---|
| AGR-001 | Selekcja i planowanie upraw | T0 | brak | Realne: `manual_farming` (istniejąca receptura) |
| AGR-002 | Udomowienie zwierząt gospodarskich | T0 | brak | Nowy Good "inwentarz żywy" -- prerequisite |
| AGR-003 | Płodozmian | T1 | AGR-001 | Realne: mniejsza degradacja `fertility` (World Gen) |
| AGR-004 | Rolnictwo z siłą zwierząt | T1 | AGR-001, AGR-002 | Realne: wyższa capacity/batch `manual_farming` |
| AGR-005 | Nawadnianie i melioracja | T1 | AGR-001 | Realne: uprawa w regionach o niskim `waterAccess` |
| AGR-006 | Narzędzia rolnicze | T1 | AGR-001 | Realne: +capacity batch `manual_farming` |
| AGR-007 | Hodowla trzody i drobiu | T1 | AGR-002 | **(nowy content PM)** -- Good mięso |
| AGR-008 | Nawożenie organiczne | T2 | AGR-003 | **(nowy content PM)** "intensywne rolnictwo" |
| AGR-009 | Sadownictwo i uprawy trwałe | T2 | AGR-001 | **(nowy content PM+archetyp)** "sad" -- Good owoce |
| AGR-010 | Selektywna hodowla zwierząt | T2 | AGR-007 | Realne: wyższa jakość/output receptury hodowli |
| AGR-011 | Przechowywanie i konserwacja żywności | T2 | AGR-006 | **(nowy content PM)** receptura "przetwórstwo konserwujące" -- zamienia świeżą żywność na trwalszy Good "żywność konserwowana" (osobny Good, osobna cena na Market, M8) |
| AGR-012 | Pszczelarstwo | T2 | AGR-009 | **(nowy content PM)** Good miód + modyfikator plonu sadów |
| AGR-013 | Uprawa roślin oleistych i włóknistych | T3 | AGR-008 | Nowy Good "len/konopie" -- surowiec dla przyszłego PM tekstylnego |
| AGR-014 | Winiarstwo i piwowarstwo | T3 | AGR-009, AGR-011 | **(nowy content PM+archetyp)** Good alkohol |
| AGR-015 | Agronomia systemowa | T3 | AGR-005, AGR-008 | **(nowy content PM)** "rolnictwo przemysłowe" -- najwyższy plon |
| AGR-016 | Chów rybny i akwakultura | T3 | AGR-002 | **(nowy content PM+archetyp)**, tylko w regionach `coastal`/`waterAccess` |
| AGR-017 | Mechanizacja rolnictwa | T4 | AGR-006, MEC-012 | Realne: dalszy wzrost capacity `manual_farming` |
| AGR-018 | Chłodnictwo pierwotne (piwnice lodowe) | T4 | AGR-011 | **(nowy content PM)** wariant AGR-011's receptury o wyższej wydajności konwersji (mniej wsadu na batch "żywności konserwowanej") |
| AGR-019 | Systemy nawadniające ciśnieniowe | T4 | AGR-015 | Realne: dalszy, stackujący się próg `waterAccess` (rozszerza AGR-005/MEC-016) |
| AGR-020 | Silosy i magazynowanie zboża na skalę | T4 | AGR-011, MIN-019 | Realne: wyższa capacity receptur AGR-011/AGR-014 (scentralizowany magazyn = więcej batchy/tick) |
| AGR-021 | Genetyka selekcyjna roślin | T5 | AGR-015, NAU-010 | Realne: dalszy wzrost plonu (mnożnik do AGR-015) |
| AGR-022 | Przemysłowe przetwórstwo spożywcze | T5 | AGR-015, AGR-014 | **(nowy content PM)** -- wyższy tier Good "żywność przetworzona" |
| AGR-023 | Rolnictwo precyzyjne | T5 | AGR-017, NAU-010 | Realne: dalszy wzrost plonu (mnożnik) |
| AGR-024 | Bioinżynieria roślin użytkowych | T6 | AGR-021, AGR-022 | Realne: najwyższy tier plonu w domenie |
| AGR-025 | Zrównoważone rolnictwo regeneracyjne | T6 | AGR-024, AGR-003 | Realne: eliminuje degradację `fertility` |

## 4.2 Górnictwo i Metalurgia (MIN)

> **D3 rozstrzygnięte 2026-09-27 (Canonical Decisions `TECH-012`,
> model A + a):** MIN-001, MIN-008 i MIN-011 działają przez dane ---
> `ResourceDefinition.discoveryRules.detection[]` (content) i jawną
> `stock.depth` złoża; deterministycznie, każde kwalifikujące się złoże
> regionu w tym samym ticku. Znaczenie pozycji poniżej jest bez zmian;
> „powierzchniowe” i „głębokie” to progi głębokości z reguł zasobu.

| ID | Nazwa | Tier | Prerekwizyty | Odblokowuje |
|---|---|---|---|---|
| MIN-001 | Rozpoznawanie złóż powierzchniowych | T0 | brak | **Realne**: przesuwa `discovery.status` UNKNOWN→DISCOVERED (złoża płytkie) albo UNKNOWN→SUSPECTED (głębsze w zasięgu MIN-001) --- TECH-012 (`natural-discovery.ts`) |
| MIN-002 | Obróbka kamienia | T0 | brak | **(nowy content PM)** materiał "kamień ciosany" |
| MIN-003 | Organizacja kopalni | T1 | MIN-001 | **(nowy content PM)** wyższa capacity ekstrakcji |
| MIN-004 | Podstawowy wytop żelaza | T1 | MIN-001 | **(nowy content PM)** z Iron Ore -- Black Mountain scenario |
| MIN-005 | Stopy miedzi (brąz) | T1 | MIN-001 | **(nowy content PM)** tańsza wczesna alternatywa metalu |
| MIN-006 | Kontrola temperatury pieca | T1 | MIN-004 | Realne: wyższa jakość/wydajność wytopu |
| MIN-007 | Odwadnianie kopalń | T1 | MIN-003 | Realne: wydobycie przy wysokim `waterAccess`/nisko położonych złożach |
| MIN-008 | Prospekcja geologiczna | T2 | MIN-001 | Realne: przyspiesza UNKNOWN→SUSPECTED w całym regionie (rozszerza wykrywanie na złoża poza zasięgiem MIN-001; nie potwierdza SUSPECTED→DISCOVERED --- TECH-012) |
| MIN-009 | Wentylacja podziemna | T2 | MIN-003 | Realne: warunek konieczny dla MIN-011 |
| MIN-010 | Ulepszony piec hutniczy | T2 | MIN-006 | Realne: wyższa capacity wytopu |
| MIN-011 | Głębokie górnictwo | T2 | MIN-007, MIN-009 | Realne: przesuwa `discovery.status` na ASSESSED dla głębokich złóż (z SUSPECTED przez DISCOVERED w tym samym ticku --- TECH-012) |
| MIN-012 | Kruszenie i wzbogacanie rudy | T2 | MIN-003 | Realne: podnosi `quality` wydobywanej rudy |
| MIN-013 | Odlewnictwo | T3 | MIN-006 | **(nowy content PM)** alternatywna ścieżka narzędzi |
| MIN-014 | Produkcja stali | T3 | MIN-010 | **(nowy content PM)** najwyższy tier metalu |
| MIN-015 | Kucie i obróbka precyzyjna metalu | T3 | MIN-004, MEC-005 | Realne: wyższy tier narzędzi dla receptur wymagających "narzędzi" |
| MIN-016 | Zaprawy wapienne | T3 | MIN-002 | **(nowy content PM)** materiał "zaprawa" |
| MIN-017 | Wydobycie soli i minerałów przemysłowych | T4 | MIN-001 | **(nowy content PM)** Good "sól" -- surowiec dla AGR-011 |
| MIN-018 | Górnictwo mechaniczne | T4 | MIN-011, MEC-021 | Realne: najwyższa capacity ekstrakcji |
| MIN-019 | Produkcja cementu | T4 | MIN-016, MIN-010 | **(nowy content PM)** materiał "cement" -- wymagany dla `housing.capacity` powyżej progu |
| MIN-020 | Metalurgia stopów specjalnych | T4 | MIN-014 | Realne: mnożnik jakości narzędzi/maszyn |
| MIN-021 | Rafinacja metali szlachetnych | T5 | MIN-012 | **(nowy content PM)** Good "metale szlachetne" -- handel prestiżowy |
| MIN-022 | Systemy podnośnikowe (winda szybowa) | T5 | MIN-008, NAU-005 | Realne: dalszy wzrost capacity głębokiego wydobycia (rozszerza MIN-011/MIN-018) |
| MIN-023 | Zaawansowane techniki wybuchowe | T5 | MIN-011 | Realne: dalszy wzrost capacity/quality ekstrakcji (rozszerza MIN-012) |
| MIN-024 | Metalurgia przemysłowa (wielki piec) | T6 | MIN-014, MEC-012 | **(nowy content PM)** "produkcja masowa metalu" -- szczyt domeny |
| MIN-025 | Recykling i odzysk metali | T6 | MIN-024 | Realne: zmniejsza zużycie surowca na batch najwyższego tieru |

## 4.3 Budownictwo i Mechanika (MEC)

| ID | Nazwa | Tier | Prerekwizyty | Odblokowuje |
|---|---|---|---|---|
| MEC-001 | Proste maszyny | T0 | brak | Prerequisite bazowy dla większości pozostałych MEC |
| MEC-002 | Konstrukcje szkieletowe (drewniane) | T0 | brak | Realne: szybszy `HOUSING_CONSTRUCTION_RATE` we wczesnych osadach |
| MEC-003 | Koło i przekładnie | T1 | MEC-001 | Realne: prerequisite dla `TransportMode` "wóz" (TRA), narzędzi |
| MEC-004 | Energia wodna i wiatrowa | T1 | MEC-003 | **(nowy content PM)** "młyn" |
| MEC-005 | Precyzyjne narzędzia | T1 | MEC-003 | Realne: wyższa jakość narzędzi (mnożnik dla MIN-015) |
| MEC-006 | Sklepienia i łuki kamienne | T1 | MIN-002, NAU-003 | Realne: podnosi maksymalny osiągalny `SettlementStage` |
| MEC-007 | Systemy przekładni złożonych | T1 | MEC-003 | Prerequisite dla wyższych tierów MEC |
| MEC-008 | Zegary i mechanizmy pomiaru czasu | T2 | MEC-003, NAU-001 | Prerequisite dla TRA-013 (brak własnego efektu) |
| MEC-009 | Fortyfikacje i budowle publiczne | T2 | MEC-006 | Realne: zdolność wymagana dla CITY/METROPOLIS |
| MEC-010 | Mosty i przeprawy | T2 | MEC-002, MIN-002 | Realne: usuwa karę `effectiveDistance` za przeszkody wodne |
| MEC-011 | Wieże i budowle wysokościowe | T2 | MEC-006 | Realne: dalszy wzrost maksymalnego `SettlementStage` |
| MEC-012 | Mechanizacja produkcji | T2 | MEC-004, MEC-005 | Realne: ogólny mnożnik capacity dla "mechanizowalnych" receptur |
| MEC-013 | Kanalizacja i wodociągi | T3 | MIN-019, MEC-010 | Realne: zmniejsza Urban Crisis (FC-SETTLEMENT-003) przy wysokim zagęszczeniu |
| MEC-014 | Silniki cieplne (para) | T3 | MEC-012, MIN-014 | Realne: wyższa capacity dla "mechanizowalnych" receptur |
| MEC-015 | Architektura monumentalna | T3 | MEC-009, MEC-011 | Realne: dalszy wzrost `SettlementStage` |
| MEC-016 | Systemy irygacyjne wielkoskalowe | T3 | MEC-010, AGR-005 | Realne: rozszerza AGR-005's efekt na cały region |
| MEC-017 | Prefabrykacja elementów budowlanych | T4 | MEC-003, MIN-019 | Realne: szybszy `HOUSING_CONSTRUCTION_RATE` |
| MEC-018 | Standaryzowane części zamienne | T4 | MEC-005, NAU-014 | Realne: mnożnik jakości dla "mechanizowalnych" receptur |
| MEC-019 | Dźwigi i urządzenia dźwigowe | T4 | MEC-004 | Realne: dalszy wzrost `HOUSING_CONSTRUCTION_RATE` |
| MEC-020 | Wentylacja i klimatyzacja budynków | T4 | MEC-013 | Realne: dalsze zmniejszenie Urban Crisis |
| MEC-021 | Napędy mechaniczne do maszyn górniczych | T5 | MEC-012 | Realne: prerequisite dla MIN-018 |
| MEC-022 | Konstrukcje stalowe | T5 | MIN-014, MEC-015 | Realne: najwyższy tier budowli (`SettlementStage`, capacity) |
| MEC-023 | Produkcja masowa (linie montażowe) | T5 | MEC-012, MEC-018 | Realne: najwyższy ogólny mnożnik capacity produkcji |
| MEC-024 | Automatyzacja podstawowa | T6 | MEC-023, NAU-014 | **(nowy content PM)** wariant najwyższego tieru MEC-owych receptur z niskim/zerowym `employeesPerBatch` -- pole i mechanizm ("w pełni zautomatyzowane" = `employeesPerBatch: 0`) już istnieją i są przetestowane w `production.ts` |
| MEC-025 | Inżynieria systemowa | T6 | MEC-022, MEC-023 | Realne: szczyt domeny -- odblokowuje METROPOLIS bez ograniczeń infrastrukturalnych |

## 4.4 Transport i Komunikacja (TRA)

| ID | Nazwa | Tier | Prerekwizyty | Odblokowuje |
|---|---|---|---|---|
| TRA-001 | Transport juczny | T0 | brak | Realne: bazowy `TransportMode` (istnieje, podobny do `pack_animal`) |
| TRA-002 | Pismo i zapis | T0 | brak | Prerequisite instytucjonalny dla wielu innych domen |
| TRA-003 | Wozy kołowe | T1 | TRA-001, MEC-003 | Realne: nowy `TransportMode` "wóz" |
| TRA-004 | Transport rzeczny | T1 | TRA-001 | Realne: nowy `TransportMode` "rzeczny" (istnieje jako `river`) |
| TRA-005 | Nawigacja przybrzeżna | T1 | TRA-004 | Prerequisite dla żeglugi |
| TRA-006 | Kompas magnetyczny | T1 | MIN-001 | Prerequisite dla nawigacji morskiej |
| TRA-007 | Organizacja dróg | T1 | TRA-003 | Realne: podnosi `Connection.infrastructure.level` szybciej (audyt M12-M14 P2#6) |
| TRA-008 | Archiwizacja i biblioteki | T1 | TRA-002 | Prerequisite dla druku/administracji |
| TRA-009 | Żegluga przybrzeżna | T2 | TRA-005 | Realne: nowy `TransportMode` "morski", niska friction na długich dystansach |
| TRA-010 | Kartografia morska | T2 | TRA-006, NAU-003 | Realne: dokładniejsze `effectiveDistance` |
| TRA-011 | Sieć posłańców | T2 | TRA-002, TRA-001 | Realne: szybszy przepływ Knowledge między regionami (Diffusion) |
| TRA-012 | Stajnie przekaźnikowe (wymiana koni) | T2 | TRA-002, NAU-001 | Realne: zmniejsza friction/czas podróży na długich trasach lądowych (transport cost, M10) |
| TRA-013 | Chronometr (pomiar czasu podróży) | T3 | MEC-008 | Realne: dokładniejsze `effectiveDistance` dla żeglugi |
| TRA-014 | Sekstant i nawigacja gwiezdna | T3 | TRA-005, NAU-007 | Realne: dalsze zmniejszenie friction na trasach morskich |
| TRA-015 | Żegluga oceaniczna | T3 | TRA-009, TRA-014 | Realne: najniższa friction na bardzo długich trasach |
| TRA-016 | Kanały żeglowne | T3 | TRA-009, MIN-019 | Realne: nowy `Connection` sztuczny (kanał) |
| TRA-017 | Sygnalizacja dalekosiężna (ognie, semafory) | T4 | TRA-002 | Realne: natychmiastowy sygnał między sąsiadującymi regionami |
| TRA-018 | Systemy przekaźnikowe (stacje pocztowe) | T4 | TRA-007, TRA-017 | Realne: przyspiesza akumulację `TechnologyState.knowledge` między połączonymi regionami (rozszerza TRA-011) |
| TRA-019 | Druk (wczesny, odbitki) | T4 | TRA-008 | Realne: przyspiesza Diffusion globalnie (mnożnik `diffusion`) |
| TRA-020 | Kodeks prawny i administracja pisemna | T4 | TRA-008 | Realne: zmniejsza `Settlement.condition.declinePressure` (istniejące pole, `computeSettlementPressure`, M14) |
| TRA-021 | Regularne linie pocztowo-pasażerskie | T5 | TRA-017, MIN-014 | Realne: dalszy wzrost `Connection.infrastructure.level` |
| TRA-022 | Systemy pocztowe zorganizowane | T5 | TRA-018, TRA-019 | Realne: łączy mnożniki TRA-018+TRA-019 we wspólny wyższy mnożnik Diffusion/Knowledge |
| TRA-023 | Kartografia globalna | T5 | TRA-015, TRA-010 | Realne: najdokładniejsze `effectiveDistance` w całej domenie |
| TRA-024 | Standaryzacja infrastruktury transportowej | T6 | TRA-007, MEC-022 | Realne: dalszy wzrost `Connection.infrastructure.level` |
| TRA-025 | Zintegrowana sieć handlowo-transportowa | T6 | TRA-022, TRA-023, TRA-024 | Realne: szczyt domeny -- maksymalna capacity/minimalna friction na wszystkich `Connection` regionu |

## 4.5 Nauka i Społeczeństwo (NAU)

| ID | Nazwa | Tier | Prerekwizyty | Odblokowuje |
|---|---|---|---|---|
| NAU-001 | Systematyczny pomiar | T0 | brak | Prerequisite wspierający -- sam nie ma bezpośredniego efektu |
| NAU-002 | Podstawowa higiena | T0 | brak | **Realne**: zmniejsza `deathRateByAgeGroup` (demografia, M6) |
| NAU-003 | Geometria praktyczna | T1 | NAU-001 | Prerequisite dla MEC-006, TRA-010 |
| NAU-004 | Zielarstwo i farmakologia ludowa | T1 | NAU-002 | Realne: dalsze zmniejszenie `deathRateByAgeGroup`, nowy Good "leki ziołowe" |
| NAU-005 | Arytmetyka handlowa i rachunkowość | T1 | NAU-001 | Realne: zwiększa tempo akumulacji `TechnologyState.knowledge` dla domeny Nauka i Społeczeństwo (pierwsze ilościowe rozumowanie napędza dalsze odkrycia tej domeny) |
| NAU-006 | Chirurgia polowa | T1 | NAU-002 | Realne: dalsze zmniejszenie `deathRateByAgeGroup` (rozszerza NAU-002/NAU-004) |
| NAU-007 | Trygonometria i triangulacja | T1 | NAU-003 | Prerequisite dla TRA-014 |
| NAU-008 | Kwarantanna i kontrola epidemii | T2 | NAU-002 | Realne: dalsze zmniejszenie `deathRateByAgeGroup` (rozszerza NAU-004/NAU-006) |
| NAU-009 | Algebra podstawowa | T2 | NAU-003 | Prerequisite dla NAU-014 |
| NAU-010 | Statystyka opisowa i szacowanie zapasów | T2 | NAU-005 | Realne: dalszy wzrost tempa akumulacji `TechnologyState.knowledge` regionu (rozszerza NAU-005) |
| NAU-011 | Anatomia systematyczna | T2 | NAU-006 | Prerequisite dla NAU-015 |
| NAU-012 | Kartografia matematyczna | T2 | NAU-007 | Realne: dokładniejsze `effectiveDistance` na `Connection` |
| NAU-013 | Sanitacja miejska (wodociągi/kanalizacja) | T3 | NAU-008, MEC-013 | Realne: dalsze zmniejszenie Urban Crisis |
| NAU-014 | Mechanika teoretyczna | T3 | NAU-009, MEC-005 | Realne: mnożnik jakości dla "mechanizowalnych" receptur MEC |
| NAU-015 | Szpitalnictwo zorganizowane | T3 | NAU-011, NAU-013 | Realne: zdolność wymagana dla najwyższych `SettlementStage` |
| NAU-016 | Edukacja formalna (szkoły) | T3 | NAU-005, TRA-008 | **Realne**: przyspiesza akumulację Knowledge regionu -- bezpośredni hook do Discovery Engine samego M15 |
| NAU-017 | Prawo i sądownictwo lokalne | T4 | TRA-020 | Realne: dalsze zmniejszenie `Settlement.condition.declinePressure` (rozszerza TRA-020) |
| NAU-018 | Szczepienia wczesne | T4 | NAU-011, NAU-004 | Realne: dalsze zmniejszenie `deathRateByAgeGroup` |
| NAU-019 | Demografia i spisy ludności | T4 | NAU-010, NAU-005 | Realne: zmniejsza `Settlement.condition.urbanizationPressure` (lepsze planowanie osadnicze) |
| NAU-020 | Administracja regionalna | T4 | NAU-017, TRA-020 | Realne: mnożnik do `Region.entrepreneurship` (Opportunity Scanner, M12) |
| NAU-021 | Filozofia przyrody (wczesna nauka empiryczna) | T5 | NAU-009, NAU-014 | Realne: przyspiesza Diffusion Knowledge między regionami |
| NAU-022 | Medycyna zapobiegawcza | T5 | NAU-018, NAU-013 | Realne: dalsze zmniejszenie `deathRateByAgeGroup` (najniższy w domenie) |
| NAU-023 | Statystyka gospodarcza i planowanie | T5 | NAU-010, NAU-019 | Realne: dalszy wzrost tempa akumulacji `TechnologyState.knowledge` (rozszerza NAU-010, bezpośredni prerequisite dla NAU-024/NAU-025) |
| NAU-024 | Uniwersytety i ośrodki wiedzy | T6 | NAU-016, NAU-021 | Realne: najwyższy mnożnik akumulacji Knowledge regionu |
| NAU-025 | Nauka systemowa (metoda naukowa) | T6 | NAU-021, NAU-024 | Realne: szczyt domeny -- globalny mnożnik Diffusion+Knowledge dla WSZYSTKICH odkryć |

------------------------------------------------------------------------

# 5. Co dalej (poza zakresem tego dokumentu)

Bez zmian względem pierwszej wersji -- patrz też sekcja 2.3 dla
rozróżnienia "realne"/"(nowy content PM)"/"hook":

1. **Schemat `KnowledgeDomainDefinition`** -- te 5 domen nie ma dziś
   żadnego typu contentu w `packages/content/src/schema/`.
2. **`content/discoveries/*.json`** -- 125 plików zgodnych z istniejącym
   `DiscoveryDefinitionSchema`.
3. **Nowe `ProductionMethod`/`CompanyArchetype`** -- każde "(nowy content
   PM)" w tabelach wyżej (23 z 125) to osobna pozycja do dopisania (dziś
   tylko 2+2 istnieją).
4. **Wywołanie `deposit-lifecycle.ts` z tick loopa** -- funkcje już
   istnieją (M5), nic ich dziś nie woła.
5. **`TechnologyState.knowledge`/`discoveries` faktyczne zapisywanie** --
   encja istnieje od M3 (`packages/entities/src/technology/
   technology-state.ts`), ale nic dziś jej nie aktualizuje w
   `economy-tick.ts` -- 8 pozycji w katalogu (TRA-011/018/019/022,
   NAU-005/010/021/023/024/025) zakłada, że M15 to podłączy.
6. **`computeSettlementPressure` rozszerzenie o modyfikatory z odkryć** --
   funkcja istnieje i liczy `declinePressure`/`urbanizationPressure` co
   tick (M14), ale dziś nie czyta żadnych danych z Technology/Discovery --
   4 pozycje (TRA-020, NAU-017/019) zakładają, że M15 doda tam wejście.

------------------------------------------------------------------------

# 6. Decyzje z 2026-09-18 (rozstrzygnięte)

1. **Canonical Decisions zaktualizowane od razu** -- TECH-004 (5 domen
   zamiast 12), TECH-007 (T0--T6 zamiast T0--T5) i TECH-008 (VS = pełne
   125, nie ~20--30) zmienione w
   `FIRST-CAUSE-Canonical-Decisions-v0.1.md` w tym samym kroku.
2. **Hooki przycięte do zera** -- wszystkie 19 pozycji zreklasyfikowane
   na realne/PM (sekcja 3, 2.3). Zostało 14/125 (11%) czystych
   prerequisites bez hooków.
3. **VS Spec §29 -- korekta założenia, nie mapowanie.** Sprawdziłem
   `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` (§29 "Resource Discovery",
   VS-09) wprost -- **nie zawiera nazwanej listy 29 kanonicznych
   odkryć**, tylko cel liczbowy `discoveries: 20-30` bez nazw. "29 już
   kanonicznych" z pierwszej iteracji tej samej sesji odnosiło się do
   MOICH WŁASNYCH wcześniej wymyślonych pozycji, które akurat pasowały
   tematycznie do starego 9-domenowego podziału -- nie do istniejącego
   kanonu. Mapowanie 1:1 nie istnieje, bo nie ma czego mapować; ta nowa
   lista 125 nie odrzuca niczego kanonicznego, bo nic wcześniej nie było
   nazwane kanonicznie.

## Pozostałe pytanie otwarte

- Czy 125 (5×25) to ostateczna liczba, czy dalej chcesz iterować?

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE Technology Discovery Catalog v0.1 (wersja 3 --
domeny/tier CANONICAL, treść odkryć DRAFT, zero hooków)**
