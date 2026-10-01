# Black Mountain — diagnoza zaniku gospodarki (2026-10-01)

**Status: DIAGNOZA ZAKOŃCZONA. Naprawy N1 i N2 WYKONANE (sekcja 9), etap 1
(N3 + N4) WYKONANY (sekcja 11), etap 2 (N7 + minimalne rozliczenie N6)
WYKONANY (sekcja 12, ponowna diagnoza), etap 3 (minimalny dochód
właścicielski) WYKONANY (sekcja 13, ponowna diagnoza), etap 4A (precyzja
cen, P12) WYKONANY (sekcja 14, walidacja i ponowna diagnoza — sekcja 15),
N5 (rynki i magazyny) WYKONANE (sekcja 16, ponowna diagnoza), P12b i P14
WYKONANE (sekcja 17, walidacja i ponowna diagnoza — sekcja 18), etap 4B
(płatny transport, rezerwa inwestycyjna, rozbudowa u wykonawcy, zwrot
kapitału) WYKONANY (sekcja 19, walidacja z poprawkami i ponowna diagnoza —
sekcja 20); P15, P16 i reszta N6 NOT STARTED.** Sekcje 1–8 opisują stan przed
N1/N2 (sama diagnoza nie zmieniała mechanik, balansu ani contentu; skrypt
`diagnose.mjs` tylko czyta stan).

## 1. Krótka odpowiedź

Gospodarka Black Mountain nie zanika „około ticku 240” z jednej przyczyny.
**Pierwszy spadek zatrudnienia do zera następuje w ticku 29** (zamknięcie
jedynej firmy w ticku 28) — tak samo we wszystkich badanych
konfiguracjach i seedach. „~240” to **ostatni tick z zatrudnieniem > 0**
w kodzie bazowym (`a8f0e3a`: tick 230) po kilku krótkich, przypadkowych
nawrotach, które występują tylko przy seedzie z fixture'u. Przy dwóch
innych seedach gospodarka po ticku 28–30 **nigdy się nie odradza**.

Łańcuch przyczyn pierwszego załamania (seed z fixture'u, ticki 1–28):

1. Farma produkuje 40–56 jedn. mąki/mies., a gospodarstwa kupują ok. 22–27.
   Nadwyżka trafia do **magazynu regionu**, który przyjmuje każdą ilość i
   płaci za nią cenę lokalną — firma ma przychód także za mąkę, której nikt
   nie kupił (magazyn rośnie 13 → 567 jedn.).
2. Zapas obniża cenę mąki o ~3%/mies. (2,00 → 0,85).
3. AI produkcji **nie widzi tego zapasu** (patrzy tylko na własny bufor
   5 jedn., który zawsze jest „na poziomie docelowym”) i liczy marżę **bez
   płac** — więc zwiększa wykorzystanie do 100% i w ticku 6 rozbudowuje
   moce (10 → 12,5).
4. Docelowe zatrudnienie (13) przekracza siłę roboczą regionu (6–7 osób),
   wakaty nie znikają, więc **płaca rośnie o 3%/mies. bez limitu** (10 → 18),
   niezależnie od tego, czy firmę na nią stać.
5. Od ticku 10 koszty płac > przychód; gotówka 547 → −49 (tick 24);
   kryzys finansowy od ticku 22 (zwolnienia), zamknięcie w ticku 28.
6. Zamknięta firma **zatrzymuje pracowników** (3 os.) — kohorty dalej są
   „zatrudnione”, mają dochód i kupują z magazynu, a siła robocza jest
   pomniejszona. To, czy zapas kiedyś się wyczerpie (i powstanie nowa
   firma), zależy od losowej demografii tych 2–3 osób.

Brak handlu ma osobną przyczynę: **jedyna para połączonych regionów z
rynkami (Green Valley–Riverside) nie ma wspólnego towaru** — rynek
Riverside ma pustą listę towarów i brak magazynu regionu — więc pętla
handlu nie ocenia żadnego towaru (`economy-tick.ts:1509-1517`).

## 2. Konfiguracja i reprodukcja

| Element | Wartość |
|---|---|
| Commit bazowy | `a8f0e3a` |
| Lokalne zmiany wpływające na badany kod | tak: „pracownicy w całych osobach” (ENGINE_VERSION 4, `labor/employment.ts`, `economy-tick.ts`, §52E) — dlatego badano oba stany |
| Fixture | `tests/worldgen/fixtures/black_mountain_reference.json` |
| Seed świata | `black-mountain-reference-v1` (z fixture'u, jak w grze); dodatkowo `seed-alpha`, `seed-beta` |
| Konfiguracja runnera | 1:1 jak `apps/desktop/electron/main/world-session.ts`: `createWorldRunner({ ...loadEconomyContent(root), worldState, worldSeed, startYear, startMonth })` |
| Receptury | `manual_farming`, `manual_food_processing`, `watermill_milling` |
| Kandydat PM | `manual_farming → watermill_milling` (wymaga odkrycia `mec_004`) |
| Kandydaci przedsiębiorczości | `grain_farm` (`manual_farming`), `bakery` (`manual_food_processing`), kapitał 0 |
| Aktywne systemy (gra) | demografia, technologia (wiedza/odkrycia/dyfuzja/adopcja), odkrywanie złóż, Company AI (produkcja, praca, cykl życia, PM adoption), rynek, gospodarstwa, przedsiębiorczość, handel, migracja, uzgodnienie zatrudnienia, osady, Architect Influence, przyczynowość, Chronicle |
| Tryb porównawczy „bare” | sam `runEconomyTick` jak w `m12-m14-invariant-monitor.test.ts` (bez technologii, PM adoption, odkryć złóż) |
| Ticki | 360 (30 lat) |

Reprodukcja (z katalogu repozytorium):

```
pnpm build:packages
node docs/verification/black-mountain-economy-diagnosis-2026-10-01/diagnose.mjs --out run.json
node docs/verification/black-mountain-economy-diagnosis-2026-10-01/diagnose.mjs --seed seed-alpha
node docs/verification/black-mountain-economy-diagnosis-2026-10-01/diagnose.mjs --mode bare
```

Kod bazowy uruchomiono w osobnym `git worktree` na `a8f0e3a` (bez zmian w
bieżącym drzewie roboczym). Wyniki: `runs-summary.json` (zatrudnienie per
tick dla każdego przebiegu, hash serii), `chronology-reference-seed.csv`
(Green Valley i firmy, ticki 0–360, bieżący kod, seed z fixture'u).

### Stan początkowy (tick 0)

- 8 regionów, **50 osób** łącznie (Black Mountain 10, Green Valley 15,
  Riverside 15, Coastal Reach 10; pozostałe 4 regiony bez ludności);
  w wieku produkcyjnym: 8 / 10 / 9 / 8.
- **Rynek z towarami i magazynem regionu: tylko Green Valley** (zboże 1,
  mąka 2). Riverside: rynek bez towarów, bez magazynu. Pozostałe 6
  regionów: bez rynku.
- Jedna firma: `company_green_valley_farm` (grain_farm, `manual_farming`,
  capacity 10, utilization 0,5, gotówka 500, płaca 10).
- Złoża: zboże Green Valley (odkryte, 50 000), ruda żelaza Black Mountain
  (ukryta, 5000), drewno Timberland (ukryte).

## 3. Porównanie przebiegów

| Przebieg | Kod | Tryb | Seed | Maks. zatrudnienie | Pierwsze 0 | Ostatnie > 0 | Założone firmy (tick) | Zamknięcia | `trade_flow_active` |
|---|---|---|---|---|---|---|---|---|---|
| cur-game | a8f0e3a + lokalne (ENGINE 4) | gra | fixture | 7 | **29** | 273 | 67, 177, 198 | 28, 273 | 0 |
| cur-game-repeat | j.w. | gra | fixture | 7 | 29 | 273 | j.w. | j.w. | 0 |
| cur-bare | j.w. | bare | fixture | 7 | 29 | 273 | 67, 177, 198 | 28, 273 | 0 |
| base-game | a8f0e3a (ENGINE 3) | gra | fixture | 7,15 | **29** | **230** | 55, 67, 139, 156 | 28, 230 | 0 |
| base-bare | a8f0e3a | bare | fixture | 7,15 | 29 | 230 | j.w. | j.w. | 0 |
| cur-seed-alpha | lokalne | gra | seed-alpha | 7 | 29 | 28 | — | 28 | 0 |
| cur-seed-beta | lokalne | gra | seed-beta | 6 | 30 | 29 | — | 29 | 0 |
| base-seed-alpha | a8f0e3a | gra | seed-alpha | 7,15 | 29 | 28 | — | 28 | 0 |
| base-seed-beta | a8f0e3a | gra | seed-beta | 6,5 | 31 | 30 | — | 30 | 0 |

- **Determinizm:** powtórka `cur-game` daje identyczny hash całej serii
  (`ed22bf9d0287`).
- **Gra vs „bare”:** identyczne zatrudnienie w każdym ticku — technologia,
  PM adoption i odkrycia złóż nie wpływają na zanik (ruda żelaza zostaje
  odkryta w ticku 79, ale nie ma contentu, który by ją wydobywał;
  `watermill_milling` nigdy nie zostaje przyjęta).
- **Całe osoby (lokalne zmiany) vs kod bazowy:** pierwszy spadek bez zmian
  (29); różni się tylko przebieg nawrotów (ostatnie > 0: 273 vs 230). Źródło
  „~240” z wcześniejszego audytu to najpewniej koniec ostatniego nawrotu
  w kodzie bazowym (230). Dokładna konfiguracja tamtego przebiegu nie
  została zapisana — **brakujący dowód**: nie da się potwierdzić, że
  używał dokładnie tych ustawień.
- **Seedy:** przy `seed-alpha` i `seed-beta` po zamknięciu nie powstaje
  żadna firma. Nawroty przy seedzie z fixture'u są efektem losowej
  demografii, nie mechanizmu odbudowy.

## 4. Chronologia (bieżący kod, seed z fixture'u)

Zatrudnienie = pracownicy aktywnych firm; marża AI = 8 × cena mąki −
10 × cena zboża (bez płac, tak jak liczy ją AI).

| Tick | Zatr. | Wakaty | Płaca | Cap × util | Prod. | Przychód | Koszty | Wynik | Gotówka | Cena mąki | Popyt | Zapas regionu | Marża AI | Zdarzenie |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 0 | 10,00 | 10 × 0,575 | 40 | 70,00 | 60,00 | +10,00 | 510 | 1,94 | 22 | 13 | +5,52 | start produkcji |
| 3 | 6 | 2 | 10,30 | 10 × 0,725 | 48 | 90,24 | 61,80 | +28,44 | 572 | 1,82 | 22,6 | 64 | +4,56 | wakaty > siła robocza → płaca rośnie |
| 6 | 6 | 3 | 11,26 | **12,5** × 0,95 | 48 | 82,56 | 67,56 | +15,00 | 530 | 1,67 | 23,6 | 138 | +3,36 | **rozbudowa** (−100 gotówki) |
| 10 | 6 | 7 | 12,68 | 12,5 × 1 | 48 | 72,96 | 76,08 | **−3,12** | 545 | 1,47 | 24 | 234 | +1,76 | płace > przychód |
| 17 | 7 | 5 | 15,59 | 12,5 × 0,96 | 56 | 68,88 | 109,13 | −40,25 | 392 | 1,19 | 27 | 404 | −0,48 | |
| 22 | 7 | 2 | 18,08 | 12,5 × 0,585 | 56 | 59,36 | 126,56 | −67,20 | 109 | 1,03 | 27 | 549 | −1,76 | kryzys (runway < 3 mies.) |
| 24 | 6 | 0 | 17,54 | 10 × 0,435 | 32 | 32,00 | 105,24 | −73,24 | **−49** | 0,97 | 27 | 567 | −2,24 | zwolnienia, redukcja mocy |
| 28 | 3 | 0 | 15,52 | 10 × 0,135 | 8 | 7,04 | 46,56 | −39,52 | −268 | 0,85 | 18 | 547 | −3,20 | **zamknięcie** (runway < 1 przez 6 ticków) |
| 29 | **0** | — | — | — | 0 | — | — | — | — | 0,82 | 18 | 529 | | firma nieaktywna, ale nadal ma 3 pracowników |
| 66 | 0 | | | | 0 | | | | | 1,83 | 12 | **0** | | zapas wyczerpany → niedobór 1,0 |
| 67 | 1 | | | | | | | | | | | | | założenie nowej farmy (demand_gap 1, marża 5,52) |
| 100 | 2 | | 3,78 | | 8 | 29,12 | | | 194 | 3,67 | 8,4 | 0 | | nadwyżka siły roboczej → płace spadają |
| 160 | 1 | | 0,62 | | 0 | 0 | | | 1209 | 0,92 | 7,4 | 260 | | ponowna nadprodukcja i spadek ceny |
| 262 | 0 | | 0,16 | | 0 | | | | 1215 | 0,98 | **0** | 166 | −2,16 | zero zatrudnionych kohort → zero popytu |
| 274–360 | 0 | | | | 0 | | | | | **1,04 (stała)** | 0 | 162 | −1,68 | trwały stan: 2 aktywne firmy z gotówką, zero produkcji |

Przy `seed-alpha` po zamknięciu w magazynie zostaje 723 jedn., a jedynymi
kupującymi są 2 „zatrudnione” osoby zamkniętej firmy. Podaż = 0, więc cena
rośnie maksymalnie co tick mimo zapasu: 0,80 (t30) → 9,06 (t120) → 314 (t240)
→ **10 915 (t360)**. Popyt (budżet / cena) maleje do 0,001, zapas nigdy się
nie wyczerpuje, niedobór = 0, więc nikt nie zakłada firmy.

## 5. Przyczyny z odwołaniami do kodu i klasyfikacją

| # | Przyczyna | Dowód | Miejsce w kodzie | Klasyfikacja |
|---|---|---|---|---|
| P1 | Sprzedaż do magazynu regionu bez kupującego: firma dostaje przychód za całą produkcję ponad bufor 5 jedn., także niesprzedaną | zapas 13 → 567 przy przychodzie 70 → 59/mies. | `economy-tick.ts` krok 6, `settleProductionSale` (`systems/economy/settlement.ts:47-80`) | niewdrożony zakres modelu (sprzedaż nieograniczona popytem) |
| P2 | AI produkcji nie widzi zapasu regionu — `inventoryLevel` liczony z własnego bufora firmy (zawsze 5/5 = 1) | utylizacja ↑ do 1,0 przy zapasie 300+ | `economy-tick.ts:792-801`, `production-decision.ts` | błąd kodu (zły sygnał wejściowy) |
| P3 | Marża w decyzjach AI bez płac (`recipeRevenuePerBatch − recipeCost`, tylko towary i zasoby) | marża +1,76 w ticku 10 przy wyniku −3,12 | `economy-tick.ts:782-784`, `production-decision.ts`, `lifecycle-decision.ts`, `opportunity-scanner.ts` | błąd kodu / luka modelu |
| P4 | Wynik rozbudowy saturuje się: `0,3 × max(0, expectedMargin)` dla marży w jednostkach pieniężnych (5,52 → 1,66 > 1) | rozbudowa w ticku 6 przy niedoborze 0 | `lifecycle-decision.ts` (`expansionScore`) | błąd kodu (brak normalizacji) |
| P5 | Płaca rośnie 3%/mies. dopóki wakaty > dostępni, bez ograniczenia zdolnością płatniczą; docelowe zatrudnienie (13) > siła robocza (6–7) | płaca 10 → 18,08 | `labor/wages.ts` (`adjustWageOffer`), `economy-tick.ts` (`targetEmployment`, `EMPLOYEES_PER_CAPACITY_UNIT`) | balans + luka modelu |
| P6 ✅ N1 | Zamknięta firma nie zwalnia pracowników: zachowuje `employees`, kohorty zachowują `employment` i dochód | po t28: firma nieaktywna z 3 os. na zawsze; w t29–t66 jedyne „zatrudnienie” kohort Green Valley (3 os.) pochodzi od zamkniętej firmy | `lifecycle-decision.ts` (CLOSE), `economy-tick.ts:754` i `:987` (`continue` dla nieaktywnych), krok 11.5 liczy tylko aktywne | **błąd kodu** |
| P7 ✅ N2 | Cena przy braku podaży ignoruje zapas: `reference = 0 && demand > 0 → +MAX_TICK_PRICE_CHANGE` | cena 0,80 → 10 915 przy zapasie 184 (seed-alpha) | `markets/price-adjustment.ts:171-176` | **błąd kodu** (nadmiarowa poprawka audytowa P1) |
| P8 | Popyt gospodarstw tylko od zatrudnionych kohort; bezrobotni nic nie kupują | t262+: 0 zatrudnionych → popyt 0 → cena zamrożona 1,04 | `economy-tick.ts:1162` (krok 7: `cohort.employment <= 0 → continue`) | niewdrożony zakres (brak konsumpcji z oszczędności/transferów) |
| P9 | Płaca spada bez dolnego limitu przy nadwyżce siły roboczej (MIN_WAGE 0,01) → dochód i popyt zbliżają się do 0 | płaca 9,41 (t70) → 0,16 (t214+) | `labor/wages.ts` | balans |
| P10 | Koszt zboża w marży = cena rynkowa zboża (1,00, zasiana w fixture, nigdy niezmieniana), choć farma wydobywa je z własnego złoża | próg rentowności mąki 1,25; przy 1,04 utylizacja 0 mimo gotówki 1213 | `economy-tick.ts:782-784`, fixture `market_green_valley.goods.grain = 1` | content (fixture) + balans |
| P11 | Mała skala świata: 50 osób, siła robocza 6–7 w jedynym regionie z rynkiem | — | fixture | content / balans (zgodne z VS §46.2 „mała populacja”, ale bez zapasu odporności) |

Rozróżnienie stanów (seed z fixture'u, tick 360):

- **zatrudnienie = 0** — tak (od ticku 274);
- **produkcja = 0** — tak (utylizacja 0, marża ujemna);
- **brak firm** — nie: 2 aktywne firmy (`…_t67` z gotówką 1213,71 i `…_t177`),
  obie z 0 pracowników; zamknięte: 2;
- **brak handlu** — tak, ale z osobnej przyczyny (sekcja 6);
- **brak danych w widoku** — nie: Read Model i UI pokazują znane 0
  (tryb Economy liczy tylko aktywne firmy, więc 3 „fantomowych”
  pracowników zamkniętej firmy z P6 nie jest wliczanych).

## 6. Brak handlu — gdzie zatrzymuje się ścieżka

Krok 10 (`economy-tick.ts:1501-1546`) iteruje po połączeniach:

1. `if (!marketAId || !marketBId …) continue;` — z 7 połączeń tylko
   **Green Valley–Riverside** ma rynki po obu stronach (pozostałe regiony
   nie mają rynku). ✔ warunek spełniony dla tej jednej pary.
2. `goodIds = towary rynku A ∩ towary rynku B` — rynek Riverside ma
   `goods = {}` przez cały przebieg (żaden system nie dodaje towaru do
   rynku), więc **część wspólna jest pusta i pętla nie wywołuje
   `tradeOneDirection` ani razu**. ✘ **tu zatrzymuje się rzeczywista ścieżka.**

Kolejne warunki, które zablokowałyby handel nawet z towarem w Riverside
(wykazane z danych, bez eksperymentu):

3. `settleTradeFlow` wymaga magazynu regionu po obu stronach — Riverside
   nie ma `regionalInventoryId`.
4. Ilość do importu = popyt − podaż importera. Popyt Riverside powstaje
   wyłącznie z zatrudnionych kohort (P8), a w Riverside nikt nigdy nie był
   zatrudniony (zatrudnienie kohort 0 w każdym ticku) → popyt 0.

Wnioski: przyczyną nie jest koszt transportu, ceny ani błąd przepływu
danych; nie zostały nawet ocenione. Pierwszym warunkiem blokującym jest
brak towarów w rynku Riverside (fixture), drugim brak jego magazynu, a
trzecim brak popytu bez zatrudnienia (P8). Samo dodanie rynków i
magazynów **nie** wystarczy, dopóki P8 zeruje popyt w regionach bez
pracodawców.

## 7. Wpływ na dalszą weryfikację

- **Economy (zaakceptowany):** akceptacja dotyczyła prezentacji na danych
  deweloperskich i prawdziwej grze; diagnoza jej nie zmienia. Prawdziwy
  świat pokazuje głównie zera — to poprawny obraz obecnego stanu modelu,
  a nie błąd widoku. P6 nie wpływa na widok (liczy tylko aktywne firmy),
  ale zawyża „zatrudnienie” kohort w danych populacji.
- **Resources (następny tryb):** ruda żelaza zostaje odkryta (t79), ale
  nie ma contentu, który ją wydobywa (brak archetypu kopalni i metody
  produkcji z `iron_ore`); jedyne zmienne złoże to zboże Green Valley.
  Weryfikacja trybu na Black Mountain pokaże prawie statyczne dane.
- **Vertical Slice:** łańcuch VS §46.3 (`Iron revealed → Mine founded → …
  → Imports/trade rosną`) jest niewykonalny w obecnym stanie: brak contentu
  wydobycia rudy, brak rynku w Black Mountain (przedsiębiorczość działa
  tylko w regionach z rynkiem), rynki tylko w 2/8 regionów (World
  Generation Spec §27: „każdy aktywny region ma regionalny Market”),
  a gospodarka Green Valley załamuje się w ticku 28 z przyczyn P1–P6.

## 8. Minimalne warianty naprawy i rekomendowana kolejność

| Krok | Zakres | Co zmienia | Skutki / ryzyko | Klasa |
|---|---|---|---|---|
| **N1** | P6 | CLOSE zwalnia wszystkich pracowników (zwrot do kohort jak przy `layoffWorkers`) | usuwa fantomowe zatrudnienie i dochód; zmienia przebiegi po zamknięciach (testy deterministyczne do aktualizacji) | błąd kodu |
| **N2** | P7 | gałąź `reference = 0` uwzględnia zapas (`effectiveSupply`) — brak presji w górę, gdy zapas pokrywa popyt | usuwa eksplozję cen; mała, lokalna zmiana | błąd kodu |
| **N3** | P2, P3, P4 | AI produkcji widzi zapas regionu (pokrycie popytu) i marżę z kosztem pracy; normalizacja marży w wyniku rozbudowy | firmy przestają rozbudowywać się przy nadwyżce; wymaga decyzji projektowej (AI Decision Model §25–28, §19) i nowych testów | błąd kodu / luka modelu |
| **N4** | P5, P9 | płaca ograniczona zdolnością płatniczą (np. przychód na pracownika) i docelowe zatrudnienie nie większe niż siła robocza regionu; dolny limit płacy | zatrzymuje spiralę płac i ich zapaść; parametry TODO tuning — decyzja balansu | balans + model |
| **N5** | sekcja 6, P10, P11 | fixture/content Black Mountain zgodny z WG §27: rynki (z towarami) i magazyny w zamieszkanych regionach; przegląd zasianej ceny zboża | umożliwia ocenę handlu; **decyzja contentu** właściciela | content |
| **N6** | P1, P8, VS | sprzedaż ograniczona popytem/zakupami, konsumpcja bezrobotnych (oszczędności/transfery), content kopalni rudy | otwiera łańcuch VS §46.3; największy zakres — osobne zadania w Roadmapie | niewdrożony zakres |

**Rekomendowana kolejność:** N1 → N2 (czyste błędy, małe, niezależne od
decyzji projektowych) → ponowne uruchomienie tej diagnozy → N3 + N4
razem (sygnały AI i płace; bez nich N1–N2 tylko łagodzą objawy) →
ponowna diagnoza → N5 (decyzja contentu) → N6 (zakres VS). Dopiero po N5
ma sens weryfikacja handlu na Black Mountain; do tego czasu tryb Resources
warto weryfikować także na danych deweloperskich.

Każdy krok: bez wyjątków dla Black Mountain w silniku, z testami
regresyjnymi przez prawdziwy pipeline ticku i ponownym przebiegiem
`diagnose.mjs` (gra + 2 seedy).

## 9. Ponowna diagnoza po N1 i N2 (2026-10-01)

### Co zmieniono

- **N1 (P6):** zamknięta firma zwalnia wszystkich pracowników tym samym
  mechanizmem co zwykły layoff (`layoffWorkers`, kohorty regionu w kolejności
  id), `employees` i `vacancies` = 0 (`economy-tick.ts`,
  `releaseClosedCompanyWorkers`). Firma zamknięta wcześniej, która nadal ma
  pracowników (stan sprzed N1, np. stary zapis), zwalnia ich w najbliższym
  ticku.
- **N2 (P7):** przy zerowej podaży w historii punktem odniesienia ceny jest
  popyt, a podaż to `effectiveSupply` z buforem zapasu
  (`price-adjustment.ts`): bez zapasu zachowanie bez zmian (pełny wzrost przy
  niedoborze), zapas pokrywający popyt nie podnosi ceny, nadmiar ją obniża.
- Testy: `economy-tick.test.ts` (N1: zamknięcie w ticku i stan sprzed N1),
  `price-adjustment.test.ts` (N2: zapas, pokrycie, brak zapasu).

### Wyniki (`runs-summary-after-n1-n2.json`)

| Przebieg | Seed | Maks. zatr. | Pierwsze 0 | Ostatnie > 0 | Nowe firmy | Zamknięcia | Maks. cena mąki | Handel |
|---|---|---|---|---|---|---|---|---|
| gra | fixture | 7 | 29 | 28 | — | 28 | 2,00 | 0 |
| gra (powtórka) | fixture | 7 | 29 | 28 | — | 28 | 2,00 | 0 |
| bare | fixture | 7 | 29 | 28 | — | 28 | 2,00 | 0 |
| gra | seed-alpha | 7 | 29 | 28 | — | 28 | 2,00 | 0 |
| gra | seed-beta | 6 | 30 | 29 | — | 29 | 2,00 | 0 |
| gra | seed-gamma | 6 | 30 | 29 | — | 29 | 2,00 | 0 |
| gra | seed-delta | 6 | 30 | 29 | — | 29 | 2,00 | 0 |

- Determinizm: powtórka identyczna (hash `502252c34eee`).
- **Ticki 0–28 są identyczne jak przed N1/N2** — te poprawki nie dotykają
  przyczyn samego załamania (P1–P5), tylko jego skutków.
- Artefakty zniknęły: brak fantomowego zatrudnienia po zamknięciu, brak
  eksplozji ceny (maks. 2,00 zamiast 10 915).
- **Nawroty przy seedzie z fixture'u znikają we wszystkich przebiegach.**
  Wcześniejsze „odrodzenie” (ticki 67–273) było napędzane wyłącznie przez
  3 fantomowych pracowników zamkniętej firmy, którzy kupowali z magazynu,
  aż zapas się wyczerpał i pojawił się niedobór. Teraz wynik jest spójny dla
  5 seedów: gospodarka kończy się w ticku 28–29 i nie wraca.

### Nowy obraz: stan pochłaniający po zamknięciu

Seed z fixture'u, Green Valley:

| Tick | Farma | Zatrudnieni w kohortach | Cena mąki | Popyt | Zapas regionu | Niedobór |
|---|---|---|---|---|---|---|
| 28 | aktywna, 3 os. | 3 | 0,85 | 18 | 547 | 0 |
| 29 | zamknięta, 0 os. | **0** | 0,82 | **0** | 547 | 0 |
| 40 | zamknięta | 0 | 0,72 | 0 | 547 | 0 |
| 360 | zamknięta | 0 | 0,72 | 0 | 547 | 0 |

Po zamknięciu nikt nie jest zatrudniony → gospodarstwa nie kupują nic
(P8: popyt tylko od zatrudnionych) → zapas 547 jedn. stoi → cena po krótkim
spadku stoi (brak popytu i podaży) → niedobór 0 i niezaspokojony popyt 0 →
przedsiębiorczość nie ma sygnału (`demand_gap` 0) → nikt nie zakłada firmy.
Ludność rośnie (16 → 22) i ma siłę roboczą (7–8 os.), ale bez popytu nie
powstaje żadna praca. **P8 jest teraz przyczyną braku odbudowy**, a P1–P5
przyczyną samego załamania.

P8 to niewdrożony zakres, nie błąd: Simulation Model §26 definiuje dochód
gospodarstw jako `Wages + Transfers + Property Income` i majątek
(`averageWealth`), a w kodzie istnieją tylko płace — bezrobotna kohorta nie
ma z czego kupować żywności.

## 10. Plan naprawy (po N1/N2)

| Krok | Przyczyny | Zakres | Decyzja potrzebna? | Oczekiwany efekt w Black Mountain |
|---|---|---|---|---|
| **N3** | P2, P3, P4 | AI produkcji: sygnał zapasu regionu (pokrycie popytu w miesiącach) zamiast własnego bufora; marża z kosztem pracy (płaca × pracownicy na partię); marża znormalizowana w wyniku rozbudowy | tak — kształt sygnałów (AI Decision Model §19, §25–28); wartości TODO tuning | farma nie zwiększa produkcji ponad popyt ani nie rozbudowuje się przy nadwyżce; brak strat od ticku 10 |
| **N4** | P5, P9 | płace: wzrost ograniczony zdolnością płatniczą (przychód na pracownika), docelowe zatrudnienie nie większe niż dostępna siła robocza regionu, dolny limit płacy | tak — reguła i progi (AI Decision Model §30) | brak spirali 10 → 18; brak zapaści płac do ~0 |
| **N7** (nowy) | P8 | popyt na przetrwanie od całej ludności, z rzeczywistym źródłem dochodu: majątek/oszczędności kohorty albo transfery (Simulation Model §26) | **tak — decyzja projektowa** (wariant: majątek vs transfery vs „potrzeba bez siły nabywczej” tylko jako sygnał przedsiębiorczości) | po ewentualnym zamknięciu zapas schodzi, pojawia się niedobór i nowa firma; regiony bez pracodawców mają popyt (warunek handlu) |
| **N5** | handel, P10, P11 | fixture/content: rynki z towarami i magazyny w zamieszkanych regionach (World Generation §27), przegląd zasianej ceny zboża | tak — content | handel Green Valley → Riverside/Coastal może zostać oceniony |
| **N6** | P1, VS | sprzedaż ograniczona zakupami (magazyn regionu nie jest nieograniczonym kupcem), content kopalni rudy dla łańcucha VS §46.3 | tak — zakres VS | łańcuch „ruda odkryta → kopalnia → wzrost” staje się możliwy |

**Rekomendowana kolejność:** N3 + N4 razem (usuwają przyczynę załamania;
osobno każde tylko przesuwa moment zamknięcia) → ponowna diagnoza →
N7 (bez niego każde przyszłe zamknięcie lub region bez pracodawcy pozostaje
martwy, a handel nie ma popytu) → ponowna diagnoza → N5 → N6.
Kryterium sukcesu ponownej diagnozy po N3+N4: farma w Green Valley
działa 360 ticków na wszystkich 5 seedach, produkcja zbliża się do popytu,
zapas regionu nie rośnie bez końca, płaca pozostaje w granicach
przychodu na pracownika. Przed N3/N4/N7 potrzebne są decyzje właściciela
co do reguł (kolumna „Decyzja”).

## 11. Etap 1: N3 + N4 — wdrożenie i ponowna diagnoza (2026-10-01)

Decyzje właściciela (plan produkcji, sprzedaży i zatrudnienia) wdrożone
zgodnie z zaakceptowanym planem; reguły zapisane w Canonical Decisions §52F.

### Co zmieniono

- **AI-03 plan produkcji** (`company-ai/production-decision.ts`): prognoza
  popytu = średnia 3 mies. z historii rynku; pokrycie = (zapas regionu +
  bufory firm) / prognoza, per towar; zerowy popyt przy zapasie = nadwyżka;
  brak historii = brak danych (firma utrzymuje poziom). Opcje w **całych
  partiach** (bieżąca, ± krok ≥ 1 partia) z wynikiem = możliwa sprzedaż −
  towary wejściowe − płace; możliwa sprzedaż = udział firmy × (prognoza +
  uzupełnienie zapasu do 2 mies.); niesprzedana produkcja nie jest
  przychodem. Zwiększanie tylko przy pokryciu < 1 mies.; ≥ 1 mies. —
  utrzymanie lub zmniejszenie. Udział: sprzedaż z poprzedniego miesiąca,
  firma bez sprzedaży — według mocy.
- **N4** (`labor/wages.ts`, `economy-tick.ts`): plan nie liczy partii, do
  których brakuje ludzi (obecni + dostępni bezrobotni regionu,
  aktualizowani po każdym zatrudnieniu); płaca ±3%/mies., sufit = (przychód −
  koszty pozapłacowe − 10% przychodu) / planowani pracownicy, podłoga =
  koszyk przetrwania (3 jedn. × wygładzona cena żywności); poniżej podłogi
  firma zmniejsza plan zatrudnienia.
- **Rozbudowa** (`lifecycle-decision.ts`): wymaga pokrycia < 1 mies.,
  dodatniego wyniku po płacach (znormalizowanego do przychodu), kapitału i
  wolnych pracowników. **Przedsiębiorczość** (`opportunity-scanner.ts`):
  marża partii z płacą nowej firmy.
- **Doprecyzowania wykryte przy wdrażaniu** (opisane w §52F):
  1. koszt zasobu wydobywanego z własnego złoża = 0 w planie (finanse firmy
     nie liczą go w ogóle; inaczej zasiana w fixture cena zboża — P10 —
     czyniłaby farmę z góry nierentowną);
  2. kryzys SS23 blokuje wzrost tylko firmie ze stratą (nowa firma z
     gotówką 0 nie może inaczej uruchomić pierwszej partii);
  3. zapotrzebowanie na pracę ponad dostępnych nie podnosi płac ani nie jest
     zatrudniane, ale zostaje sygnałem „są miejsca pracy” dla migracji
     (wcześniej robiły to nieograniczone wakaty);
  4. zamówienie importera (ilość oceniona przez handel, rozliczalna) jest
     doliczane do historii popytu rynku eksportera — inaczej eksporter
     wygaszał produkcję do popytu lokalnego i handel znikał (scenariusz
     weryfikacyjny handlu).
- Testy: nowy zestaw AI-03 (`production-decision.test.ts`), granice płac
  (`wages.test.ts`); test integracyjny Black Mountain
  (`economy-tick.integration.test.ts`) sprawdza teraz przebieg 24 ticków, nie
  stan końcowy (stan końcowy = skutek P8, opisany niżej); E2E
  `world-whole-people.spec.ts` bez zakodowanej liczby pracowników.

### Wyniki (`runs-summary-stage1.json`, 7 przebiegów)

| Przebieg | Seed | Maks. zatr. | Pierwsze 0 | Zamknięcia | Min. gotówka | Maks. płaca | Zaspokojenie potrzeb t1–12 | Opłacalny popyt / potrzeby t1–12 | Przychód zaksięgowany / opłacony przez kupujących | Handel |
|---|---|---|---|---|---|---|---|---|---|---|
| gra | fixture | 5 | **5** | — | 500 | 10,00 | 10,8% | 10,8% | 206,32 / 113,07 | 0 |
| gra (powtórka) | fixture | 5 | 5 | — | 500 | 10,00 | 10,8% | 10,8% | j.w. | 0 |
| bare | fixture | 5 | 5 | — | 500 | 10,00 | 10,8% | 10,8% | j.w. | 0 |
| gra | alpha / beta / gamma / delta | 5 | 5 | — | 500 | 10,00 | 10,7–11,3% | 10,7–11,3% | j.w. | 0 |
| *po N1+N2 (porównanie)* | fixture | 7 | 29 | t28 | **−268** | **18,08** | 50,1% | 50,1% | 1725,20 / 897,55 | 0 |

Determinizm: powtórka identyczna (hash `2972cffba975`).

Green Valley, seed z fixture'u (`need` = 3 jedn. × ludność):

| Tick | Potrzeby | Popyt opłacalny | Zakupy | Cena | Zapas (mies.) | Przychód zaksięgowany | Opłacony | Pracownicy farmy |
|---|---|---|---|---|---|---|---|---|
| 1 | 45 | 16,85 | 16,85 | 1,94 | 1,08 | 70,00 | 32,69 | 5 |
| 2 | 45 | 17,00 | 17,00 | 1,88 | 1,96 | 62,08 | 31,96 | 5 |
| 3 | 45 | 13,32 | 13,32 | 1,82 | 2,79 | 45,12 | 24,24 | 3 |
| 4 | 45 | 13,66 | 13,66 | 1,77 | 3,15 | 29,12 | 24,18 | 3 |
| 5 | 45 | **0** | 0 | 1,72 | 5,13 | 0 | 0 | **0** |
| 6–360 | 45–48 | 0 | 0 | 1,67 → 1,47 | — | 0 | 0 | 0 (firma aktywna, gotówka 512,77) |

### Ocena wobec kryterium

**Cele lokalne etapu 1 — osiągnięte:**
- brak nadprodukcji ponad popyt: plan zmniejsza produkcję, gdy zapas
  przekracza cel (t1–t5), zamiast rozbudowywać moce;
- brak spirali płac (maks. 10,00 zamiast 18,08); płaca schodzi ku podłodze
  koszyka przetrwania (4,41 = 3 × 1,47) przy nadwyżce pracy;
- brak niewypłacalności i bankructwa (gotówka nigdy < 500; wcześniej −268);
- scenariusz handlu: eksporter rośnie wraz z zamówieniami importera i
  napływem pracowników (test zapisu/odczytu handlu przechodzi).

**Kryterium systemowe — NIEspełnione (zgodnie z ryzykiem wskazanym przed
startem):** gospodarka Black Mountain wygasa w ticku **5** na wszystkich 5
seedach (wcześniej 28–29). Przyczyna to **P8**: popyt mają tylko kohorty z
pracującymi. Plan dopasowuje produkcję do tego popytu → zwolnienia → kohorty
bez pracy przestają kupować → popyt spada → kolejne zmniejszenie → 0. Już przy
pełnym zatrudnieniu opłacalny popyt pokrywał tylko 37% potrzeb (16,85 / 45),
bo dochód kohort jest stawką z dnia zatrudnienia, a niepracujący nie mają
żadnych środków. Firma przeżywa (gotówka 512,77), ale nie ma komu sprzedawać.
Brak niedoboru (zapas 46 jedn. bez kupujących) = brak sygnału dla nowych
firm. Kryterium „nowa firma po kontrolowanym zamknięciu” nie było do
sprawdzenia: nie doszło do zamknięcia.

Dodatkowo potwierdzone **P1**: w t1–t4 45% zaksięgowanego przychodu
(93,25 z 206,32) to sprzedaż do magazynu regionu, której nikt nie kupił.

### Wniosek i następny krok

Etap 1 usunął przyczyny **załamania firmy** (P2–P5); przyczyną **zaniku
gospodarki** jest teraz wyłącznie brak popytu poza zatrudnionymi (P8) wraz z
niezachowaniem pieniądza (P1, płace nie trafiają do gospodarstw, wydatki
znikają). To dokładnie zakres **etapu 2: N7 (płynne oszczędności gospodarstw,
popyt całej ludności, potrzeby / popyt opłacalny / zakupy) + minimalne
rozliczenie N6** (kupujący płaci sprzedawcy, firma płaci pracownikom tyle,
ile wypłaca, magazyn regionu nie płaci za niesprzedane). Bez etapu 2 każdy
plan dopasowany do popytu prowadzi w tym świecie do zera; dalsze strojenie
N3/N4 nie ma sensu.

## 12. Etap 2: N7 + minimalne rozliczenie N6 — wdrożenie i ponowna diagnoza (2026-10-01)

Reguły zapisane w Canonical Decisions §52G.

### Co zmieniono

- **Oszczędności gospodarstw (N7):** nowe pole `PopulationCohort.savings`
  (schemat zapisu 5). Saldo = poprzednie + faktycznie otrzymane płace −
  faktycznie opłacone zakupy. Start nowego świata: 3 miesiące koszyka
  przetrwania po cenie z rynku regionu (opcja `householdSavings` ładowacza,
  domyślnie 3 mies.; region bez ceny — 0; fixture może podać `savings`).
  Migracja zapisu v4 → v5 tą samą regułą; `averageWealth` nie jest
  zamieniane na gotówkę. Migranci zabierają swoją część oszczędności.
- **Gospodarstwo = rodzina kohort** (`groupCohortsIntoFamilies`): dochody
  pracujących utrzymują dzieci, starszych i niepracujących; saldo rodziny
  dzielone z powrotem według liczby osób, co do grosza (`splitMoney`).
- **Popyt na przetrwanie całej ludności:** popyt opłacalny = min(potrzeby,
  oszczędności / cena) — także bez pracy; zakup ograniczony zapasem; przy
  braku towaru pieniądze zostają. Rynek zapisuje **potrzeby**
  (`householdNeed`), **popyt opłacalny** (`demand`) i **zakupy**
  (`householdPurchased`).
- **Minimalne rozliczenie N6:** płace wypłacone przez firmy trafiają do
  kohort regionu (proporcjonalnie do zatrudnienia); firma oddaje nadwyżkę
  do magazynu regionu **w komis** (`Inventory.consignment`) i dostaje
  pieniądze dopiero od kupujących, pro rata do swojej części zapasu (także
  zamknięta firma i firma, której towar wywieziono — własność przechodzi z
  towarem w handlu). Zapas bez właściciela (opłacony jeszcze w starym
  modelu) nie przynosi nikomu pieniędzy. Finanse firm rozliczane po pętli
  regionów.
- **Wersje:** SCHEMA 5, ENGINE 5. Testy: `money-circulation.test.ts`
  (zachowanie pieniądza co do grosza przez prawdziwy tick, zakupy
  bezrobotnych z oszczędności, pieniądze zostają przy braku towaru, zapłata
  dla zamkniętej firmy), migracja oszczędności przy przeprowadzce, ładowacz
  (3 mies. koszyka, zgodność stałych z Simulation Core), migracja zapisu
  v4 → v5; scenariusze weryfikacyjne i testowe dostały realne oszczędności
  zamiast „dochodu bez pracodawcy”.
- **Poprawka wykryta w ponownej diagnozie:** pokrycie zapasem liczyło cały
  stan firm, łącznie z ich buforem (5 jedn.), którego firma nie wystawia na
  sprzedaż — bufory bezczynnych firm udawały zapas i blokowały wzrost przy
  pustym magazynie (seed-delta: cena 10 089, płace 28 445). Teraz liczy się
  tylko zapas dostępny do sprzedaży (zgodnie z regułą „dostępne zapasy
  firm”).

### Wyniki (`runs-summary-stage2.json`, 8 przebiegów)

| Przebieg | Seed | Ostatnie zatr. > 0 | Nowe firmy | Zaspokojenie potrzeb t1–12 / t13–360 | Oszczędności gospodarstw t0 → t12 → t24 | Gotówka firm t0 → koniec | Pieniądz świata t0 → koniec |
|---|---|---|---|---|---|---|---|
| gra | fixture | 19 | — | 73,6% / 0,7% | 270 → 59 → 0 | 500 → 770 | 770 → 770 |
| gra (powtórka) | fixture | 19 | — | j.w. | j.w. | j.w. | j.w. |
| bare | fixture | 19 | — | j.w. | j.w. | j.w. | j.w. |
| gra | alpha | **360** | 17 (od t63) | 78,4% / 5,1% | 270 → 52 → 0 | 500 → 550 | 770 → 570* |
| gra | beta | **360** | 15 (od t58) | 71,9% / 7,1% | 270 → 93 → 0 | 500 → 570 | 770 → 570* |
| gra | gamma | 18 | — | 76,8% / 1,0% | 270 → 49 → 0 | 500 → 770 | 770 → 770 |
| gra | delta | **360** | 18 (od t55) | 72,0% / 4,3% | 270 → 105 → 0 | 500 → 570 | 770 → 570* |
| kontrolowane zamknięcie t6 | fixture | 21 | **t11** | 47,6% / 0,2% | 270 → 55 → 0 | 500 → 770 | 770 → 770 |

\* jedyny odpływ pieniądza: 2 rozbudowy mocy po 100 (zakup środków trwałych
spoza modelu — istniejący, jawny mechanizm). Poza tym **pieniądz świata jest
zachowany co do grosza w każdym przebiegu**. Determinizm: powtórka
identyczna (hash `e2c0c69fb1d5`). Handel: 0 we wszystkich (bez zmian —
przyczyny z sekcji 6, N5).

Green Valley, seed z fixture'u:

| Tick | Potrzeby | Popyt opłacalny | Zakupy | Cena | Oszczędności gospodarstw | Gotówka farmy |
|---|---|---|---|---|---|---|
| 1 | 45 | 45 | 35 | 2,04 | 248,50 | 521,50 |
| 3 | 45 | 45 | **45** | 2,04 | 176,81 | 593,19 |
| 5 | 45 | 41,7 | 41,7 | 1,94 | 114,48 | 655,52 |
| 6 | 48 | 27,7 | 27,7 | 1,88 | 117,20 | 652,80 |
| 12 | 48 | 28,3 | 28,3 | 1,57 | 59,15 | 710,85 |
| 24 | 48 | 0 | 0 | 1,09 | **0** | **770,00** |

### Ocena wobec kryterium

**Osiągnięte:**
- pieniądz krąży bez tworzenia i gubienia (poza jawnym kosztem rozbudowy);
- firmy dostają pieniądze tylko za faktycznie kupiony towar (P1 usunięte;
  wcześniej 45% przychodu było nieopłacone);
- gospodarstwa kupują także bez pracy, z oszczędności; pierwsze miesiące
  pokrywają 72–80% potrzeb (wcześniej 11%);
- **nowa firma po kontrolowanym zamknięciu powstaje** (zamknięcie w t6 →
  założenie w t11);
- w 3 z 5 seedów zatrudnienie trwa do ticku 360 (nowe firmy powstają
  regularnie), wcześniej we wszystkich kończyło się w t5.

**Nieosiągnięte — nowa, dominująca przyczyna („pompa pieniądza”):** we
wszystkich przebiegach oszczędności gospodarstw spadają do zera ok. ticku 24,
a ich pieniądze lądują w **gotówce firm** (seed z fixture'u: dokładnie 270
jedn. przechodzi z gospodarstw do farmy: 500 → 770). Przyczyna: firma płaci
płace bliskie podłodze (koszyk 1 osoby), a sprzedaje żywność całej ludności;
różnica (zysk) zostaje w firmie i **nie wraca do gospodarstw** — model nie ma
dochodu właścicielskiego (właściciel farmy to kohorta `cohort_green_valley_farmers`,
ale zysk nie jest wypłacany). Gdy gospodarstwom kończą się pieniądze, popyt
spada do zera; w 2 seedach gospodarka zatrzymuje się (farma z 770 jedn.
gotówki, magazyn 38 jedn., zero kupujących), w 3 przeżywa na minimalnym
poziomie (zaspokojenie potrzeb 4–7% po ticku 12), napędzana kolejnymi
małymi firmami. Do tego jeden pracownik utrzymuje ~2,5 osoby (15 ludzi / 6
pracujących), więc nawet pełne wydawanie płac nie pokrywa potrzeb przy
płacy równej koszykowi jednej osoby.

### Wniosek i następny krok

Etap 2 domknął obieg pieniądza między firmami a gospodarstwami w jedną
stronę (zakupy → firmy → płace), ale **zysk firm jest dziś końcowym
odpływem z kieszeni gospodarstw**. Następny krok (decyzja właściciela,
zapowiedziany w propozycji N7 jako „później”): **dochód właścicielski** —
wypłata zysku (np. ponad bufor gotówki) właścicielowi firmy (`ownerType` /
`ownerEntityId` już istnieją; dla firm należących do kohort — ich
oszczędności). Dopiero po nim ma sens ocena, czy pozostała niedopłata
potrzeb wynika z płac, cen czy skali świata.

## 13. Etap 3: minimalny dochód właścicielski — wdrożenie i ponowna diagnoza (2026-10-01)

Reguły zapisane w Canonical Decisions §52H.

### Co zmieniono

- **Wypłata zysku** (`packages/simulation/src/systems/economy/owner-income.ts`,
  krok 9.9 w `economy-tick.ts`): raz na tick, po rozliczeniu wszystkich
  sprzedaży i kosztów (także wpłat z komisu dla zamkniętych firm), przed
  handlem i migracją, firma wypłaca
  `min(max(0, wynik zatrzymany), max(0, gotówka − bufor))`. Bufor =
  2 × max(średnie płace z ostatnich ≤ 3 ticków, płaca × pracownicy po
  decyzji o zatrudnieniu) — `OWNER_PAYOUT_BUFFER_MONTHS = 2`, TODO tuning.
- **Wynik zatrzymany** `Company.finance.retainedEarnings` (zysk +, strata −,
  wypłata −; może być ujemny) i `operatingCostHistory` (≤ 3 obserwacje).
  Kapitał początkowy (500 farmy) i kapitał założycielski nie są wynikiem.
- **Odbiorca:** `individual` → `savings` kohorty właściciela (budżet
  rodziny); kohorta bez ludzi → najliczniejsza żyjąca kohorta tej samej
  rodziny; rodzina bez ludzi lub `state` → brak wypłaty (wynik zostaje).
  `company` → gotówka i wynik firmy-właściciela. Fakty
  `company_owner_payout` i `owner_income_received` z krawędziami
  przyczynowymi (system `owner-income`).
- **Zapis:** SCHEMA 6 / ENGINE 6; migracja v5 → v6: wynik zatrzymany 0,
  historia kosztów `[finance.costs]`, gotówka i oszczędności bez zmian,
  bez wypłat przy migracji i wczytaniu. Ograniczenie: zysk niewypłacony
  przed zapisem v5 zostaje w firmie (nie da się go oddzielić od kapitału).
- **Testy (prawdziwy tick):** `owner-income.test.ts` (gospodarstwo
  właściciela, nie cały region; ograniczenie buforem i gotówką; pokrycie
  wcześniejszych strat; kapitał nie jest wypłacany; jedna wypłata na tick,
  także z handlem; komis zamkniętej firmy; kohorta właściciela bez ludzi i
  rodzina bez ludzi; pieniądz co do grosza) oraz `owner-income-save.test.ts`
  (migracja v5 → v6, wczytanie bez wypłat, deterministyczna kontynuacja
  save/load, równość z przebiegiem bez zapisu).
- **Diagnostyka:** `diagnose.mjs` zapisuje wynik zatrzymany, właściciela,
  wypłaty i odbiorców, rozbudowy oraz oszczędności według rodzin;
  `summarize.mjs` buduje `runs-summary-stage3.json`.

Reprodukcja (z katalogu repozytorium, po `pnpm build:packages`):

```
node docs/verification/black-mountain-economy-diagnosis-2026-10-01/diagnose.mjs --out game.json
node docs/verification/black-mountain-economy-diagnosis-2026-10-01/diagnose.mjs --seed seed-alpha --out alpha.json   # także beta, gamma, delta
node docs/verification/black-mountain-economy-diagnosis-2026-10-01/diagnose.mjs --mode bare --out bare.json
node docs/verification/black-mountain-economy-diagnosis-2026-10-01/diagnose.mjs --close-at 6 --out close6.json
node docs/verification/black-mountain-economy-diagnosis-2026-10-01/summarize.mjs runs-summary-stage3.json s3-game=game.json s3-seed-alpha=alpha.json ...
```

### Wyniki (`runs-summary-stage3.json`, 8 przebiegów, 360 ticków)

Zaspokojenie potrzeb (Green Valley, Σ zakupów / Σ potrzeb), etap 2 → etap 3:

| Przebieg | t1–12 | t13–24 | t13–360 (e2) | t25–120 (e3) | t121–360 (e3) | Ostatnie zatr. > 0 (e2 → e3) |
|---|---|---|---|---|---|---|
| gra, seed fixture | 73,6% → 97,3% | 26,4% → 90,5% | 0,7% | 76,4% | 79,1% | 19 → **360** |
| gra, alpha | 78,4% → 97,2% | 31,8% → 100% | 5,1% | 91,0% | 85,1% | 360 → 360 |
| gra, beta | 71,9% → 97,2% | 29,9% → 100% | 7,1% | 94,1% | 67,5% | 360 → 360 |
| gra, gamma | 76,8% → 97,4% | 25,4% → 100% | 1,0% | 82,2% | 67,1% | 18 → **360** |
| gra, delta | 72,0% → 97,2% | 38,3% → 100% | 4,3% | 100% | 84,7% | 360 → 360 |
| zamknięcie t6 | 47,6% → 47,6% | 9,8% → 15,8% | 0,2% | 38,3% | 36,8% | 21 → **360** |

Powtórka seeda z fixture'u identyczna (to samo wyjście, `sha1 bc09b79572`);
tryb „bare” daje ten sam wynik co gra (jak w etapie 2).

Zatrudnienie (średnio, osoby) i produkcja (jedn./mies.), t1–12 / t13–24 / t25–360:

| Przebieg | Zatrudnienie e2 | Zatrudnienie e3 | Produkcja e3 | Dostępny zapas e3 t12 / t24 / t360 | Nowe firmy e2 → e3 |
|---|---|---|---|---|---|
| gra, seed fixture | 4,9 / 1,6 / 0,0 | 5,8 / 6,6 / 5,8 | 46,7 / 52,0 / 48,3 | 9 / 112 / 29 | 0 → 1 (t42) |
| alpha | 5,2 / 2,2 / 1,1 | 5,9 / 5,7 / 5,5 | 49,3 / 45,3 / 47,2 | 62 / 42 / 29 | 17 → 0 |
| beta | 4,8 / 1,5 / 1,1 | 5,8 / 4,8 / 3,6 | 49,3 / 40,7 / 29,9 | 62 / 37 / 52 | 15 → 0 |
| gamma | 5,3 / 1,5 / 0,0 | 5,8 / 6,0 / 5,3 | 46,7 / 48,0 / 41,1 | 3 / 3 / 18 | 0 → 0 |
| delta | 4,8 / 2,2 / 1,1 | 5,8 / 5,4 / 5,1 | 49,3 / 46,7 / 33,1 | 62 / 82 / 32 | 18 → 0 |
| zamknięcie t6 | 2,8 / 0,8 / 0,0 | 2,8 / 1,0 / 3,1 | 22,7 / 8,0 / 23,7 | 0 / 0 / 0 | 1 → 6 |

W etapie 2 „nowe firmy” w alpha/beta/delta to kolejne drobne firmy
zakładane po wygaśnięciu farmy; w etapie 3 farma działa cały czas.
Dostępny zapas = magazyn regionu + zapas firm ponad bufor.

Pieniądz (oszczędności gospodarstw + gotówka firm) i wypłaty:

| Przebieg | Gospodarstwa t0 → t12 → t24 → t360 | Gotówka firm t0 → t360 | Wypłaty t1–12 / t13–24 / t25–360 | Odpływ: rozbudowa | Błąd bilansu |
|---|---|---|---|---|---|
| gra, seed fixture | 270 → 270 → 327 → 270 | 500 → 100 | 392 / 132 / 3797 | 400 (4 kroki) | 0,00 |
| alpha | 270 → 270 → 270 → 270 | 500 → 100 | 303 / 214 / 2351 | 400 (4 kroki) | 0,00 |
| beta | 270 → 270 → 270 → 270 | 500 → 500 | 332 / 233 / 988 | 0 | 0,00 |
| gamma | 270 → 270 → 270 → 270 | 500 → 500 | 449 / 414 / 1667 | 0 | 0,00 |
| delta | 270 → 270 → 270 → 270 | 500 → 500 | 316 / 179 / 982 | 0 | 0,00 |
| zamknięcie t6 | 270 → 270 → 252 → 267 | 500 → 503 | 216 / 125 / 5162 | 0 | 0,00 |

Etap 2 dla porównania: gospodarstwa 270 → 49–105 (t12) → 0 (t24) we
wszystkich przebiegach, gotówka firm 500 → 550–770. Błąd bilansu = maks.
|pieniądz(t) + skumulowany odpływ(t) − pieniądz(0)| — **pieniądz zachowany
co do grosza w każdym ticku każdego przebiegu**; jedyny jawny odpływ to
koszt rozbudowy (100 za krok, bez odbiorcy), finansowany z kapitału farmy
(500 → 100). Wynik zatrzymany na końcu: 0 we wszystkich firmach z zyskiem
(cały zysk wypłacony; 0,96 w trzech małych firmach w zamknięciu t6 —
gotówka poniżej bufora).

### Ocena wobec kryterium

**Czy popyt utrzymuje się po wykorzystaniu oszczędności początkowych —
tak.** W etapie 2 oszczędności gospodarstw spadały do 0 ok. t24, bo zysk
zostawał w firmie. Teraz pieniądz w rękach gospodarstw jest stały (270, z
przejściowymi wahaniami), bo zysk wraca co miesiąc: gotówka farmy stoi na
poziomie kapitału (500 — kapitał nie jest wypłacany), a wszystko ponad nią
wraca do właściciela. Zatrudnienie trwa do t360 we wszystkich 5 seedach,
zaspokojenie potrzeb w t13–360 wynosi 67–100% (etap 2: 0,2–7%). Spadek w
seedzie z fixture'u w t25–30 (zatrudnienie 0 przez 4 ticki) to cykl
zapasu, nie zanik: nadprodukcja t16–20 (7 pracowników) → 112 jedn. zapasu →
plan zatrzymuje produkcję przy pokryciu > 3 mies. → gospodarstwa kupują z
zapasu → produkcja wraca od t31.

**Dokąd trafiają pieniądze — do jednej grupy właścicielskiej.** Farma
należy do rodziny `cohort_green_valley_farmers` (WORKING/SKILLED) i 99–100%
wypłat trafia do niej. Na końcu przebiegów cała nadwyżka pieniądza
gospodarstw (270) leży u tej rodziny (35–188 miesięcy koszyka), a rodzina
`cohort_green_valley_children` (POOR/UNSKILLED) ma 0 i żyje wyłącznie z
płacy. Rodzina właściciela nie wyda więcej niż swój koszyk, więc jej
oszczędności nie zamieniają się w popyt; **niezaspokojone potrzeby (10–33%
po t120) to potrzeby rodzin bez udziałów**, którym płaca równa koszykowi
jednej osoby nie wystarcza na utrzymanie rodziny (≈ 2,5 osoby na
pracującego). W zamknięciu t6 nowe firmy należą do pierwszej kohorty
regionu (dziś `cohort_green_valley_children` — placeholder właściciela z
M12), więc tam pieniądze gromadzą się u rodziny POOR (201 jedn. na końcu).
Wypłata trafiała też do innych kohort rodziny po opróżnieniu kohorty
właściciela (delta: `farmers_45_64`, `farmers_65_plus` i in.; zamknięcie
t6: syntetyczna kohorta 65+ rodziny „children”) — zgodnie z regułą
odbiorcy.

**Co nadal ogranicza gospodarkę (przyczyny z przepływów i decyzji):**

- **P12 — cena zamarza na 0,16 (zaokrąglenie do grosza).** Po t72 nadwyżka
  podaży (moc farmy po rozbudowach 6,4 → 10) nad popytem opłacalnym obniża
  cenę 1,48 → 0,16 (t156), a płaca idzie za nią do podłogi 0,48 (koszyk 1
  osoby). Przy cenie ≤ 0,16 największa możliwa zmiana (3%/mies. =
  `MAX_TICK_PRICE_CHANGE` 0,1 × `PRICE_SMOOTHING_FACTOR` 0,3) jest mniejsza
  niż pół grosza, więc `roundMoney` zostawia cenę bez zmian — **także przy
  niedoborze** (zamknięcie t6, t360: niedobór 0,64 przy cenie 0,16). To
  istniejący wcześniej mechanizm (nie skutek wypłat), ujawniony dopiero
  dłuższym przeżyciem gospodarki; poziom nominalny nie zmienia wyników
  realnych (płaca = koszyk), ale cena przestaje być sygnałem. Do decyzji
  właściciela (np. cena w mniejszej jednostce niż grosz albo minimalny
  krok zmiany).
- **P13 — firmy bez kapitału nie rosną.** Rozbudowa wymaga gotówki ≥ 100
  (`EXPANSION_CAPITAL_COST`), a wypłata zostawia firmie tylko bufor (2 ×
  płace ≈ 1–25). Nowe firmy (kapitał założycielski 0) zostają przy mocy 1
  na zawsze (zamknięcie t6: 6 firm po 8 jedn./mies. przy potrzebach 66,
  zaspokojenie 37%), a farma rozbudowuje się wyłącznie z kapitału
  początkowego (500 → 100). Zgodne z regułą „nie blokuj wypłat na rzecz
  hipotetycznych inwestycji”, ale model nie ma dziś źródła finansowania
  inwestycji z zysków. Do decyzji właściciela (np. zatrzymanie części zysku,
  gdy rozbudowa spełnia warunki trwałego popytu, albo wkład właściciela z
  jego oszczędności).
- **Rozbudowa jako odpływ pieniądza** (100/krok bez odbiorcy): w alpha i w
  seedzie z fixture'u 400 z 770 jedn. (52%) zniknęło z obiegu w 30 lat. Bez
  zmian w tym etapie (zakup środków trwałych spoza modelu).
- **Likwidacja:** zamknięta firma wypłaca zysk z komisu, ale jej kapitał
  (gotówka ponad wynik) zostaje w niej na zawsze — w zamknięciu t6 500 jedn.
  zamkniętej farmy (65% pieniądza świata) jest wyłączone z obiegu do końca.
  Zwrotu kapitału przy likwidacji nie ma — osobna decyzja.
- **Podział dochodu między rodzinami:** płaca dzielona proporcjonalnie do
  zatrudnienia, wypłata do jednej rodziny, brak transferów — o tym, kto je,
  decydują wysokość płacy (podłoga = koszyk 1 osoby) i struktura własności.
- **Handel:** nadal 0 we wszystkich przebiegach (przyczyny z sekcji 6 —
  brak rynków i magazynów w pozostałych regionach, N5).
- Drobne: firma założona w t42 (seed z fixture'u) miała chwilowo ujemną
  gotówkę i wynik (−16,55 w t60), potem jej moc zanikła do ~0 — istniejące
  zachowanie cyklu życia, bez zmian w tym etapie.

### Wniosek i następny krok

Dochód właścicielski zamknął obieg pieniądza: **gospodarka Black Mountain
już nie wygasa** — w 5/5 seedach zatrudnienie i produkcja trwają 30 lat,
zaspokojenie potrzeb jest wysokie, pieniądz jest zachowany co do grosza.
Pozostałe ograniczenia (P12 zamarzanie ceny, P13 brak finansowania
inwestycji z zysku, podział dochodu między rodzinami, odpływ przez
rozbudowę, kapitał zlikwidowanych firm) dotyczą jakości i wzrostu, nie
przetrwania; każde wymaga decyzji właściciela.

**Czy można przejść do N5 (rynki i magazyny w pozostałych zamieszkanych
regionach)?** Tak — warunek „gospodarka regionu z rynkiem utrzymuje się
sama” jest spełniony, a brak handlu wynika wprost z braku rynków i
magazynów (sekcja 6). Zastrzeżenie: N5 otworzy handel oparty na różnicach
cen, a przy P12 cena w Green Valley po ok. 13 latach stoi na 0,16 i nie
reaguje na niedobór, więc sygnał handlu w długich przebiegach będzie
zniekształcony. Rekomendacja: N5 teraz; P12 rozstrzygnąć przed oceną handlu
w długich przebiegach; P13 i likwidacja — osobne decyzje.

## 14. Etap 4A: naprawa precyzji cen P12 (2026-10-01) — bez ponownej diagnozy

Reguły zapisane w Canonical Decisions §52I. **Na polecenie właściciela w
tym etapie nie uruchamiano testów, typecheck, lint, build, E2E ani
przebiegów diagnostycznych.** Wyniki z sekcji 13 (cena 0,16 od ok. t156)
dotyczą kodu sprzed tej poprawki i pozostają bez zmian; poniżej nie ma
zmierzonych wyników po poprawce.

### Przyczyna

`updateMarketGood` (`markets/price-adjustment.ts`) liczył nową cenę jako
`cena × (1 + presja)` z presją ograniczoną do ±3% (`MAX_TICK_PRICE_CHANGE`
0,1 × `PRICE_SMOOTHING_FACTOR` 0,3) i zapisywał ją przez `roundMoney`, czyli
do grosza. Przy cenie p zmiana wynosi najwyżej 0,03 · p; gdy 0,03 · p < 0,005
(p ≤ 0,16), zaokrąglenie przywraca starą cenę — **w obie strony**: 0,16 ·
1,03 = 0,1648 → 0,16 i 0,16 · 0,97 = 0,1552 → 0,16. Powyżej tej granicy
ruch był kwantowany do pełnych groszy, więc małe spadki i wzrosty
zaokrąglały się do 0 albo do 1 grosza (np. 0,48 · 3% = 0,0144 → 0,01).

### Poprawka

- `core/rounding.ts`: `PRICE_DECIMALS = 6`, `roundPrice` (round-half-even do
  6 miejsc) i `transactionValue(ilość, cena)` — wartość transakcji
  zaokrąglana do grosza dokładnie w tym jednym miejscu.
- `markets/price-adjustment.ts`: `initializeMarketGood` i
  `updateMarketGood` używają `roundPrice` zamiast `roundMoney`; `delta` faktu
  `price_changed` również. Limit zmiany, wygładzanie, `MIN_PRICE` 0,01 i
  wpływ popytu, podaży i zapasu bez zmian.
- `core/economy-tick.ts` (zakupy gospodarstw, krok 7b): zapłata każdemu
  właścicielowi towaru w komisie = `transactionValue(ilość, cena)`; ta sama
  kwota schodzi z salda rodziny i trafia do `salesRevenueByCompanyId`
  sprzedawcy (jak dotąd, teraz przez jedną funkcję).
- `economy/settlement.ts`: `settleProductionSale().revenue` liczone przez
  `transactionValue` (wartość dziś nieużywana w ticku, ale nie może być
  ułamkiem grosza).
- UI: `formatUnitPrice` (`economy-mode.ts`) w kolumnie „Cena lokalna”
  panelu Gospodarki — 2 miejsca jak dotąd, dodatnia cena < 0,005 jako
  „<0,01” zamiast „0,00”. Bez nowych ekranów i dodatkowych miejsc.

Przegląd spójności: rynek, plan produkcji (`buildPlanGoodMarkets`), handel
(`evaluateTradeFlow` — porównanie cen, bez przelewu), koszyk przetrwania i
podłoga płac (`smoothedPrice` = średnia historii `localPrice`), oszczędności
startowe (`initialHouseholdSavings`, wynik zaokrąglany do grosza) i zakupy
gospodarstw czytają ten sam `localPrice`. Ładowacz fixture'ów zasiewa
cenę wprost z danych (`basePrice`) — bez zmian.

### Zapis i wersjonowanie

ENGINE_VERSION 6 → **7** (semantyka aktualizacji ceny). SCHEMA_VERSION
zostaje **6** — struktura danych się nie zmienia, migracja niepotrzebna:
cena zapisana do grosza jest poprawną ceną 6-miejscową. Trzy istniejące
asercje numeru wersji silnika w testach persistence zaktualizowane do 7
(bez uruchamiania). Do sprawdzenia przy najbliższej walidacji: testy
porównujące dokładne ceny lub sumy kontrolne przebiegów
(`price-adjustment.test.ts`, `labor-wage-price-feedback.test.ts`,
`economy-tick.integration.test.ts`, `flows.test.ts`, read modele rynku i
gospodarki, `whole-workforce-save.test.ts`) — ceny po kilku tickach mogą
mieć teraz więcej niż 2 miejsca.

### Płace — ustalenie (bez zmiany)

`adjustWageOffer` (`labor/wages.ts`) ma ten sam mechanizm: krok ≤ 3%/mies.
(`MAX_TICK_WAGE_CHANGE` 0,1 × `WAGE_SMOOTHING_FACTOR` 0,3) i zapis przez
`roundMoney`. Płaca ≤ 0,16 nie może się zmienić, a wyżej zmiany są
kwantowane do groszy; podłoga płacy (3 × wygładzona cena, teraz z cen
6-miejscowych) jest śledzona z dokładnością do grosza. W sekcji 13 płaca
stała na 0,48 (powyżej granicy zamarzania), więc tam nie blokowała. Płaca
jest kwotą wypłacaną pracownikom, więc grosze są tu uzasadnione — zmiana
wymaga osobnej decyzji.

Znana luka rozliczenia (bez zmian, etap 2): zakup towaru **bez
właściciela** w komisie (zapas sprzed modelu komisowego) obciąża
gospodarstwo, ale kwota nie trafia do nikogo — jedyne miejsce, gdzie
kupujący płaci bez sprzedawcy. W świecie Black Mountain taki zapas nie
występuje (bilans sekcji 13 = 0,00).

### Ustalenia do etapu 4B

- **Rezerwa inwestycyjna a wypłaty:** decyzja o rozbudowie zapada w kroku 3
  (`decideLifecycle`, `canAffordExpansion = cash ≥ EXPANSION_CAPITAL_COST`),
  na gotówce po wypłacie z poprzedniego ticka; wypłata liczona jest w kroku
  9.9 (`owner-income.ts`: `operatingBuffer` + `ownerPayoutAmount`).
  Naturalne miejsce rezerwy to składnik bufora wypłaty w kroku 9.9, liczony
  z sygnałów rozbudowy, które `economy-tick.ts` ma już w kroku 3
  (`demandPersistenceScore`, wynik planu, wolni pracownicy) — przekazany
  tak jak dziś `nextTickObligationsByCompanyId`. Rezerwa nie może
  zmniejszać wyniku zatrzymanego (to nie koszt), tylko odkładać wypłatę.
- **Środki zamkniętej firmy dziś:** `CLOSE` (`lifecycle-decision.ts`)
  ustawia `active: false` i `closedTick`, gotówka zostaje w firmie;
  pracownicy są zwalniani (N1). Zamknięta firma dalej dostaje zapłatę z
  komisu (krok finansów) i wypłaca ją właścicielowi jako zysk (bufor 0 po
  wygaśnięciu historii kosztów). Kapitał (gotówka ponad wynik zatrzymany)
  nie jest nigdy zwracany ani przenoszony — brak zdarzenia likwidacji;
  ujemna gotówka zamkniętej firmy też zostaje bez rozliczenia.
- **Wykonawca rozbudowy:** nie istnieje. Koszt rozbudowy (100) jest
  odejmowany od gotówki w `decideLifecycle` bez odbiorcy; content ma tylko
  archetypy `grain_farm` i `bakery`, brak firmy budowlanej; wzrost
  mieszkań w osadach używa „pracy budowlanej” bezrobotnych, ale bez
  pieniędzy. Odbiorca kosztu rozbudowy wymagałby nowej decyzji (np.
  płace dla pracy budowlanej w regionie albo archetyp wykonawcy).

## 15. Walidacja i ponowna diagnoza po etapie 4A (2026-10-01)

**Walidacja (kod z etapu 4A + 3 nowe testy regresji P12):** typecheck PASS,
lint 0 błędów (1 znane ostrzeżenie), testy 154 pliki / 1189 PASS, build PASS,
E2E 18/18 PASS. Nowe testy P12 (`price-adjustment.test.ts`: cena 0,16 rośnie
przy trwałym niedoborze i spada przy nadwyżce, pierwszy krok = dokładnie
+3% → 0,1648; `rounding.test.ts`: `roundPrice`, `transactionValue`) —
uruchomione osobno, PASS.

**Diagnoza:** te same 8 przebiegów co w sekcji 13 (`runs-summary-stage4a.json`,
`diagnose.mjs` + `summarize.mjs` bez zmian). Powtórka seeda z fixture'u
identyczna (`sha1 04276098`), „bare” = gra.

Zaspokojenie potrzeb Green Valley, etap 3 → 4A (t1–12 / t13–24 / t25–120 / t121–360):

| Przebieg | Etap 3 | Etap 4A | Cena mąki t360 (e3 → 4A) | Płace t360 (4A) |
|---|---|---|---|---|
| gra, seed fixture | 97,3 / 90,5 / 76,4 / 79,1% | 97,3 / 90,6 / 78,6 / **86,5%** | 0,16 → 0,020 | 0,16 |
| alpha | 97,2 / 100 / 91,0 / 85,1% | 97,2 / 100 / 92,3 / **88,5%** | 0,16 → 0,023 | 0,16 (farma) |
| beta | 97,2 / 100 / 94,1 / 67,5% | 97,2 / 100 / 92,9 / **73,0%** | 0,16 → 0,021 | 0,16 |
| gamma | 97,4 / 100 / 82,2 / 67,1% | 97,4 / 100 / 82,1 / **61,4%** | 0,16 → 0,021 | 0,16 |
| delta | 97,2 / 100 / 100 / 84,7% | 97,2 / 100 / 100 / **86,4%** | 0,16 → 0,020 | 0,16 |
| zamknięcie t6 | 47,6 / 15,8 / 38,3 / 36,8% | bez zmian | 0,16 → **3,557** | 10,90 |

Zatrudnienie do t360 we wszystkich przebiegach (bez zmian). Pieniądz
zachowany co do grosza w każdym ticku (błąd bilansu 0,00); jawny odpływ —
rozbudowa: seed z fixture'u i alpha 300 (było 400), gamma 200, beta i delta
0. Każdy seed ma teraz 2 późne nowe firmy (t164–t263), zamknięcie t6 — 8.

**Co zmieniła poprawka (zmierzone):**

- **Cena znów reaguje w obie strony.** W zamknięciu t6, przy trwałym
  niedoborze, cena rośnie 1,92 → 4,65 (t36; maks. 5,47), spada przy odbudowie podaży i
  znów rośnie pod koniec (0,15 → 3,56) — wcześniej stała na 0,16 mimo
  niedoboru 0,64. W pozostałych przebiegach nadwyżka podaży (moc 8–10,
  zapas do 107 jedn.) obniża cenę dalej niż 0,16: 0,65 (t96) → 0,15 (t144) →
  ok. 0,02 od t216 (minimum 0,017; `MIN_PRICE` 0,01 nie został osiągnięty). Popyt
  gospodarstw jest sztywny (ograniczony potrzebą), więc przy stałej
  nadwyżce nic nie zatrzymuje spadku ceny poza podłogą.
- **P12b — płace zamarzają na 0,16 (zmierzone, przewidziane w §14).**
  Podłoga płacy = 3 × cena ≈ 0,06–0,09, ale `adjustWageOffer` ma ten sam
  krok 3% i `roundMoney`, więc płaca ≤ 0,16 nie spada. Skutki: płaca jest
  2–3 × wyższa niż koszyk, rodziny żyjące z płacy kupują więcej (wyższe
  zaspokojenie w t121–360 w 4 z 5 seedów), ale farma w końcówce ma płace
  ≥ przychód (seed z fixture'u, t360: przychód 1,35, płace 1,44) —
  wynik zatrzymany ujemny (−0,15 … −28,39 w beta/gamma/delta), wypłaty w
  t25–360 spadają (seed z fixture'u 3797 → 2039, delta 982 → 378), a farma
  pokrywa straty z kapitału. Gamma jako jedyna pogorszyła zaspokojenie
  (67,1 → 61,4%).
- Stała nadwyżka podaży i deflacja do ok. 0,02 pokazują, że rynek z
  popytem ograniczonym potrzebą nie ma ceny równowagi — dopóki plan
  produkcji utrzymuje zapas w pasie 1–3 mies., cena spada aż do podłogi.

**Wniosek:** P12 dla cen naprawione i zmierzone. Ujawniło się P12b (płace) —
ten sam mechanizm zaokrąglenia, teraz wiążący. Decyzja właściciela: płace z
precyzją jak ceny (stawka 6 miejsc, wypłata w groszach przez
`transactionValue`) albo pozostawienie płac w groszach. Długi spadek ceny do
~0,02 wymaga osobnej oceny (planowanie zapasu / sztywny popyt), ale nie
blokuje N5.

## 16. N5: rynki i magazyny w zamieszkanych regionach — wdrożenie i ponowna diagnoza (2026-10-01)

Reguły zapisane w Canonical Decisions §52J.

### Co zmieniono

- **Dane** (`tests/worldgen/fixtures/black_mountain_reference.json`, bez
  nowego kodu mechaniki): rynek z mąką w Riverside (dotąd rynek bez
  towarów), nowe rynki z mąką w Black Mountain i Coastal Reach, magazyny
  regionów we wszystkich trzech. Cena startowa mąki 4,00 = `basePrice` z
  contentu (regiony bez produkcji); Green Valley bez zmian (2,00).
  Oszczędności startowe — ta sama reguła §52G (3 mies. koszyka po cenie
  regionu): Riverside 540, Black Mountain 360, Coastal Reach 360; pieniądz
  świata 770 → **2030**.
- **Poprawka błędu etapu 2** (`economy-tick.ts`, krok 7b): rodziny kohort do
  zakupów grupowane z bieżącej mapy kohort regionu. Dla niepełnych rodzin
  (Black Mountain: „workers” bez 65+, „youth” bez 45–64 i 65+) demografia i
  krok 7b nadawały syntetycznym kohortom różne id, a zapis salda tworzył
  rekord bez `id` — 30 testów fixture'u kończyło się wyjątkiem
  `Duplicate PopulationCohort id "undefined"`.
- **Poprawka regresji etapu 4A:** `roundPrice` bez asercji „safe integer”
  (przy 6 miejscach wywracała przebiegi > ~700 ticków z rynkiem bez podaży;
  test technologii, 600+ ticków).
- **Testy dostosowane do nowego świata:** oszczędności startowe Black
  Mountain = 36,00/os. (przypadek „0 bez ceny” na kopii fixture'u bez
  rynku); test integracyjny 24 ticków — towar w dowolnym magazynie regionu
  i fakty rozliczenia / wypłaty zamiast „gotówka ≠ 500” (zysk wraca do
  właściciela, §52H).
- **Diagnostyka:** `summarize.mjs` raportuje wszystkie regiony z rynkiem
  (cena, zaspokojenie potrzeb, oszczędności, ludność) i handel per
  połączenie → `runs-summary-n5.json`.

**Walidacja (stan końcowy):** typecheck PASS, lint 0 błędów (1 znane
ostrzeżenie), testy 154 pliki / **1192** PASS, build PASS, E2E **18/18**
PASS. Diagnoza: 8 przebiegów, powtórka identyczna (`sha1 06db54ec`), „bare”
= gra, błąd bilansu pieniądza 0,00 we wszystkich (odpływ: rozbudowa 0–200).

### Wyniki (`runs-summary-n5.json`, 360 ticków)

Handel i regiony importujące:

| Przebieg | Handel GV → Riverside: przepływy / jedn. / ticki | Riverside: potrzeby t1–12 / t13–120 | Oszczędności Riverside t0 → t360 | Cena Riverside t360 | BM i Coastal: cena t360, zakupy |
|---|---|---|---|---|---|
| gra, seed fixture | 13 / 86 / t2–24 | 1,7% / 1,5% | 540 → 0 | 8,38 | 167 286, 0 |
| alpha | 14 / 109 / t2–15 | 8,2% / 1,3% | 540 → 0 | 6,42 | 167 286, 0 |
| beta | 15 / 99 / t2–16 | 11,3% / 1,0% | 540 → 0 | 6,81 | 167 286, 0 |
| gamma | 29 / 43 / t2–56 | 0,6% / 0,8% | 540 → 0 | 20,31 | 167 286, 0 |
| delta | 18 / 99 / t2–22 | 10,0% / 0,6% | 540 → 0 | 7,43 | 167 286, 0 |
| zamknięcie t6 | 11 / 47 / t2–49 | 1,7% / 0,7% | 540 → 0 | 16,51 | 167 286, 0 |

Green Valley (zaspokojenie t1–12 / t13–120 / t121–360, etap 4A → N5) i
ludność t0 → t360:

| Przebieg | Etap 4A | N5 | Oszczędności GV t360 | Ludność GV / Riverside / Coastal / BM |
|---|---|---|---|---|
| gra, seed fixture | 97,3 / 79,7 / 86,5% | 97,3 / 94,1 / **74,9%** | 812 | 15→25 / 15→15 / 10→25 / 10→13 |
| alpha | 97,2 / 93,1 / 88,5% | 97,2 / 100 / **73,6%** | 811 | 15→19 / 15→9 / 10→11 / 10→12 |
| beta | 97,2 / 93,7 / 73,0% | 97,2 / 96,7 / 75,2% | 814 | 15→16 / 15→6 / 10→10 / 10→10 |
| gamma | 97,4 / 83,8 / 61,4% | 97,4 / 83,5 / 63,4% | 814 | 15→15 / 15→18 / 10→18 / 10→6 |
| delta | 97,2 / 100 / 86,4% | 97,2 / 99,7 / 88,1% | 816 | 15→7 / 15→14 / 10→17 / 10→14 |
| zamknięcie t6 | 47,6 / 36,2 / 36,8% | 46,0 / 34,6 / 33,6% | 687 | 15→28 / 15→8 / 10→25 / 10→13 |

Zatrudnienie trwa do t360 we wszystkich przebiegach.

### Ocena

- **Handel po raz pierwszy działa w tym świecie.** Ścieżka z sekcji 6 jest
  odblokowana: Green Valley eksportuje mąkę do Riverside od t2 (cena GV ~2,
  Riverside 4 → 5,7; import opłacalny), własność w komisie przechodzi z
  towarem, a gospodarstwa Riverside płacą farmie Green Valley — 540 jedn.
  przechodzi z Riverside do Green Valley (oszczędności GV 270 → ~810).
- **P15 — region bez pracodawcy traci cały pieniądz przez import.**
  Riverside nie ma firmy ani zasobu, z którego mogłaby powstać (jedyne
  złoże zboża jest w Green Valley; archetypy to farma i piekarnia), więc
  nie ma dochodu. Po wydaniu oszczędności (t15–56) popyt opłacalny spada do
  0, handel ustaje, a cena stoi (brak popytu i podaży). Zaspokojenie potrzeb
  Riverside: 0,6–11% w pierwszym roku, ~1% potem, 0% po t120.
- **P16 — brak handlu tranzytowego.** Coastal Reach jest połączone tylko z
  Riverside (i niezamieszkanym Windward Hills); Riverside importuje dokładnie
  tyle, ile wynosi jej własny niedobór, więc nigdy nie ma nadwyżki do
  reeksportu. Black Mountain łączy się z resztą świata wyłącznie przez
  niezamieszkany Highland Pass (bez rynku). Handel działa tylko między
  bezpośrednimi sąsiadami z rynkami — oba regiony mają zero podaży.
- **P14 — cena bez górnej granicy.** W Black Mountain i Coastal Reach popyt
  opłacalny (oszczędności 360) trwa przy zerowej podaży i zerowym zapasie,
  więc cena rośnie co miesiąc o maksymalne 3%: 4,00 → 23,57 (t60) → 138,8
  (t120) → 167 286 (t360) — identycznie we wszystkich seedach (4 · 1,03³⁶⁰).
  Oszczędności nie są wydawane (brak towaru), ludzie głodują w modelu
  (zaspokojenie 0%). Specyfikacja (VS §17) wymaga dolnej granicy, limitu
  zmiany, wygładzania i bufora — górnej granicy nie przewiduje; nie
  dodawałem jej (nowa mechanika = decyzja). Bez poprawki regresji 4A takie
  przebiegi kończyły się wyjątkiem po ~700 tickach.
- **Green Valley:** zaspokojenie w t121–360 spadło w seedzie z fixture'u
  (86,5 → 74,9%) i w alpha (88,5 → 73,6%), w pozostałych podobne lub wyższe.
  Ludność GV rośnie przez migrację (do 25–28 osób), a przybysze z innych
  regionów przychodzą bez oszczędności (rodziny MIDDLE/SKILLED i
  WORKING/UNSKILLED z saldem 0 w t360), podczas gdy pieniądz GV (~810) leży
  u jednej rodziny. Migracja kieruje też ludzi do Coastal Reach (10 → 25 w
  seedzie z fixture'u) mimo braku żywności — sygnał przyciągania migracji nie
  uwzględnia dostępności dóbr (obserwacja, bez zmian).

### Wniosek i następne kroki

N5 jest wdrożone i spełnia warunek z sekcji 6: rynki i magazyny istnieją,
a handel między sąsiadami z nadwyżką i popytem działa. Wynik pokazuje
jednak, że sam content rynków nie wystarcza do żywej gospodarki
wieloregionalnej. Decyzje właściciela, w kolejności rekomendowanej:

1. **P14** (blokuje sensowne ceny w każdym regionie bez podaży): np. górna
   granica ceny względem ceny bazowej, albo popyt bez szans na zakup (zero
   podaży i zapasu, brak importu) nie podnosi ceny powyżej poziomu importu.
2. **P15 / P16** (content i mechanika handlu): źródło dochodu w regionach
   bez złóż (np. zasoby / archetypy w contencie Riverside i Coastal Reach,
   eksport z tych regionów) oraz handel tranzytowy albo rynek w Highland
   Pass.
3. **P12b** (płace zamarzają na 0,16) i **etap 4B** (rezerwa inwestycyjna,
   środki zamkniętej firmy, odbiorca kosztu rozbudowy).

## 17. P12b i P14: precyzja płac i cena przy braku ofert (2026-10-01) — bez ponownej diagnozy

Reguły w Canonical Decisions §52K. **Na polecenie właściciela po tych
poprawkach nie uruchamiano testów, typecheck, lint, build, E2E ani
przebiegów diagnostycznych.** Wyniki z sekcji 15 i 16 dotyczą kodu sprzed
tych zmian i pozostają bez zmian; poniżej nie ma zmierzonych skutków.

### P12b — stawka płacy

- **Przyczyna (sekcja 15):** `adjustWageOffer` zapisywał stawkę przez
  `roundMoney`; krok ≤ 3%/mies. przy płacy ≤ 0,16 to < pół grosza, więc
  płaca nie spadała do podłogi (3 × cena ≈ 0,06).
- **Poprawka:** `roundWageRate` (6 miejsc, `core/rounding.ts`) w
  `labor/wages.ts` (stawka i `delta` faktu `wage_changed`); limit,
  wygładzanie, podłoga i sufit bez zmian. Wypłata w groszach:
  `economy-tick.ts` liczy koszt pracy i zobowiązania najbliższego ticka
  przez `transactionValue(pracownicy, stawka)`; suma kosztów firm regionu
  jest dzielona między kohorty przez `splitMoney` (co do grosza), więc
  koszt firmy = wpływy gospodarstw. Plan produkcji (`plannedEmployees ×
  wageOffer`), sufit płac (budżet / pracownicy) i bufor wypłat
  właścicielskich korzystają z tej samej stawki.

### P14 — cena przy braku dostępnych ofert

- **Przyczyna (sekcja 16):** przy popycie finansowanym i zerowej podaży
  oraz zapasie `updateMarketGood` dawał co miesiąc maksymalną presję +3%,
  bez końca (Black Mountain, Coastal Reach: 4 → 167 286 w t360) — potrzeby
  bez oferty działały jak niedobór, który da się „wylicytować”.
- **Rozróżnienie:** potrzeby (`householdNeed`), zamówienia z pokryciem
  (`demand`), dostępne oferty (`offered`, nowe — towar w magazynie regionu
  przed zakupami; bez buforów firm i przyszłej produkcji) i zakupy
  (`householdPurchased`).
- **Reguła ceny** (`markets/price-adjustment.ts`): `ticksWithoutOffers`
  (nowe) liczy kolejne ticki bez ofert. Oferty → zwykła reakcja ceny.
  Brak ofert krócej niż okno historii podaży (6 ticków) → zwykła reakcja
  na niedobór. Brak ofert przez całe okno albo rynek bez żadnej oferty →
  presja 0, ostatnia (albo bazowa) cena zostaje jako orientacyjna
  (`priceSuspension`), fakt `price_pressure_suspended` z powodem;
  powrót ofert → `price_pressure_resumed`. Bez globalnej ceny maksymalnej
  i bez resetu do ceny bazowej. `shortageSeverity`, potrzeby i popyt
  finansowany bez zmian — przedsiębiorczość (niedobór, `demand − supply`)
  i krytyczny niedobór w handlu dalej je widzą.
- **Import** (`economy-tick.ts`, `trade/flows.ts`): zamówienie =
  niezaspokojone potrzeby − towar już w magazynie importera, ilość ≤
  środki kupujących / koszt dostawy (częściowe zakupy), ≤ przepustowość, ≤
  nadwyżka eksportera; importer bez ofert nie potrzebuje wyższej ceny
  lokalnej. Zamówienia i nadwyżka są zmniejszane po każdym przepływie (bez
  podwójnego liczenia przez kilka połączeń). Import staje się ofertą
  importera, gdy towar leży w jego magazynie (kolejny tick).
- **UI:** panel Gospodarki oznacza cenę orientacyjną „≈” z opisem
  (`world.economy.indicativePrice`); bez nowego ekranu.

### Zapis

SCHEMA_VERSION 6 → **7** (nowe pola `offered`, `ticksWithoutOffers`,
`priceSuspension`), migracja v6 → v7: licznik 0 tylko przy śladzie oferty
w zapisanym ticku (zapas regionu > 0 albo zakupy > 0); bez śladu — rynek
bez ofert do pierwszej oferty. ENGINE_VERSION 7 → **8**. Istniejące
asercje numerów wersji w testach persistence zaktualizowane (bez
uruchamiania).

### Czego oczekiwać przy najbliższej walidacji (przewidywania, nie pomiary)

- W Black Mountain i Coastal Reach cena mąki powinna zostać na 4,00
  (orientacyjna) zamiast rosnąć; niedobór 1 i potrzeby bez zmian.
- Riverside: cena 4,00 do pierwszej dostawy; import ograniczony środkami
  po koszcie dostawy.
- Płace w Green Valley powinny schodzić poniżej 0,16 za podłogą koszyka.
- Testy, które mogą wymagać aktualizacji: oczekujące wzrostu ceny przy
  zerowej podaży przez pełny tick (rynek bez ofert), dokładnych płac lub
  liczby faktów rynku (nowe fakty `price_pressure_*`), oraz testy
  persistence porównujące stan rynku po migracji.

### Pozostałe ograniczenia

- P15 (regiony bez dochodu tracą pieniądz przez import) i P16 (brak handlu
  wieloodcinkowego) — bez zmian; Black Mountain i Coastal Reach nadal nie
  dostaną towaru.
- Gospodarstwa płacą za import cenę lokalną importera; koszt transportu
  nie ma odbiorcy.
- Cena orientacyjna rynku bez ofert to ostatnia cena sprzed zatrzymania
  (do 5 ticków wzrostu po zniknięciu ofert, maks. ≈ +16%).
- Etap 4B (rezerwa inwestycyjna, zamknięta firma, odbiorca kosztu
  rozbudowy) — bez zmian.

## 18. Walidacja i ponowna diagnoza po P12b i P14 (2026-10-01)

**Walidacja:** `pnpm build:packages` — pierwszy przebieg wykazał 1 błąd
typu w funkcji pomocniczej P14 (`withOptional`, `price-adjustment.ts`),
poprawiony (rzutowanie, bez zmiany działania). Następnie: typecheck PASS,
lint 0 błędów (1 znane ostrzeżenie), testy 154 pliki / 1192 PASS bez
żadnej zmiany oczekiwań (żaden istniejący test nie zależał od wzrostu ceny
bez ofert). Dodane testy regresji (PASS): P14 w `price-adjustment.test.ts`
(rynek bez oferty trzyma cenę 4,00 przy niedoborze 1 i popycie 30; krótki
brak ofert podnosi cenę, po oknie 6 ticków podwyżki stają, oferta je
wznawia; bez `offered` zachowanie sprzed P14), P12b w `wages.test.ts` (0,16
→ 0,1552 → … ku podłodze 0,06, 6 miejsc), migracja v6 → v7 w
`migrations.test.ts`. Stan końcowy: testy 154 pliki / **1197** PASS, build
PASS, E2E **18/18** PASS.

**Diagnoza** (`runs-summary-p12b-p14.json`, 8 przebiegów, 360 ticków):
powtórka identyczna (`sha1 0dac993c`), „bare” = gra, błąd bilansu pieniądza
0,00 we wszystkich (odpływ: rozbudowa tylko w gamma, 200).

| Przebieg | Cena BM / Coastal t360 (N5 → teraz) | Riverside: cena t12 / t60 / t360 | Handel GV → Riverside | GV: zaspokojenie t121–360 (N5 → teraz) | GV: cena / płaca t360 |
|---|---|---|---|---|---|
| gra, seed fixture | 167 286 → **4,00** | 5,07 / 7,01 / 7,01 | 14 przepł. / 97 jedn. / t2–25 | 74,9 → **90,3%** | 0,01 / 0,03 |
| alpha | 167 286 → **4,00** | 5,22 / 6,05 / 6,05 | 14 / 107 / t2–15 | 73,6 → **80,1%** | 0,01 / 0,03 |
| beta | 167 286 → **4,00** | 5,22 / 7,01 / 7,01 | 17 / 106 / t2–20 | 75,2 → **82,6%** | 0,01 / 0,031 |
| gamma | 167 286 → **4,00** | 4,78 / 13,44 / 13,44 | 31 / 59 / t2–58 | 63,4 → **47,3%** | 0,01 / 0,03 |
| delta | 167 286 → **4,00** | 5,22 / 7,44 / 7,44 | 18 / 105 / t2–22 | 88,1 → **100%** | 0,01 / 0,03 |
| zamknięcie t6 | 167 286 → **4,00** | 5,07 / 7,89 / 7,89 | 18 / 84 / t2–56 | 33,6 → 33,6% | 3,93 / 12,54 |

### Ocena

- **P14 działa zgodnie z regułą.** W Black Mountain i Coastal Reach (bez
  żadnej oferty) cena zostaje na 4,00 jako orientacyjna przez 360 ticków —
  zamiast 167 286; niedobór i potrzeby dalej widoczne (zaspokojenie 0%,
  oszczędności 360 nietknięte — P15/P16 bez zmian). W Riverside cena stoi
  na 4,00 do pierwszej dostawy, rośnie, dopóki import trwa i popyt z
  pokryciem przewyższa oferty (5,1 → 7,0), a po zaniku ofert (środki
  Riverside wydane) zatrzymuje się — 6,05–13,44 zostaje jako orientacyjna.
- **Handel bez sztucznego wzrostu ceny:** import do Riverside od t2 (jak w
  N5), w zbliżonej skali (59–107 jedn.); kończy się, gdy gospodarstwa
  Riverside wydadzą oszczędności (P15).
- **P12b działa:** płace w Green Valley schodzą za podłogą koszyka do
  0,03 (było 0,16 zamrożone). Cena mąki w GV, już nie zamrożona przez
  płace ani zaokrąglenie, spada do `MIN_PRICE` 0,01 (seed z fixture'u od
  t193) — stała nadwyżka podaży przy popycie ograniczonym potrzebą.
- **Green Valley:** zaspokojenie w t121–360 wyższe w 4 z 5 seedów; spadek
  w gamma (63,4 → 47,3%) nie wynika z P14: farma produkuje tylko tyle, ile
  wynosi popyt z pokryciem (21–30 jedn. przy potrzebach 51–72), bo cały
  pieniądz gospodarstw GV (810, w tym środki przejęte od Riverside) leży u
  rodziny właściciela (WORKING/SKILLED), która wydaje tylko na swój
  koszyk; migranci i pozostałe rodziny (MIDDLE/SKILLED, WORKING/UNSKILLED,
  POOR) mają 0 i żyją z płacy 0,03 przy cenie 0,01.
- **Zamknięcie t6:** bez zmian względem N5 (P13 — małe firmy bez kapitału
  nie rosną; cena reaguje na niedobór, płace 12,54).

### Co dalej ogranicza gospodarkę (decyzje właściciela)

1. **Koncentracja pieniądza** — wypłaty właścicielskie gromadzą się u jednej
   rodziny, która nie wydaje ponad koszyk; reszta regionu żyje z płacy na
   podłodze. Bez transferów, innych kategorii potrzeb (pozostałe kategorie
   §52G NOT STARTED) albo podziału własności popyt z pokryciem nie rośnie.
2. **P15 / P16** — regiony bez dochodu i bez handlu tranzytowego (bez zmian).
3. **Deflacja do `MIN_PRICE`** — przy stałej nadwyżce cena GV osiąga podłogę
   0,01; płace podążają do 0,03. Wynik realny bez zmian, ale wartości
   nominalne tracą rozdzielczość (wypłaty płac w groszach przy 0,03 ×
   pracownicy).
4. **Etap 4B** (P13, zamknięta firma, odbiorca kosztu rozbudowy).

## 19. Etap 4B: płatny transport, finansowanie rozbudowy i zwrot kapitału (2026-10-01) — bez ponownej diagnozy

Reguły w Canonical Decisions §52L. **Na polecenie właściciela po tych
zmianach nie uruchamiano testów, typecheck, lint, build, E2E ani przebiegów
diagnostycznych.** Wyniki sekcji 18 dotyczą kodu sprzed 4B; poniżej nie ma
zmierzonych skutków.

### Analiza modelu sprzed 4B

- **Zamówienie importu** (P14): niezaspokojone potrzeby − zapas importera,
  ograniczone środkami kupujących po `importedCost` (cena eksportera +
  transport + ryzyko).
- **Przewóz i komis:** towar i jego własność przechodziły do magazynu
  importera bez żadnej płatności; koszt transportu nie miał płatnika ani
  odbiorcy.
- **Zakup gospodarstwa:** po cenie lokalnej importera — inna niż cena, którą
  planował handel (niespójność, którą 4B usuwa).
- **Wpływ producenta:** zapłata kupującego za jego część zapasu.
- **Rozbudowa:** `decideLifecycle` odejmował 100 od gotówki firmy, kwota
  znikała z obiegu; moc rosła bez wykonawcy i bez pracy.
- **Zamknięcie:** pracownicy zwalniani (N1), gotówka zostawała w firmie na
  zawsze; sprzedaż komisowa zapasu dawała zysk wypłacany właścicielowi.

### Co zmieniono

- **Content** (jawne uzupełnienia): `content/services/basic_transport.json`
  i `content/services/construction.json` (istniejący schemat
  `ServiceDefinition`, Content-Localization Spec §46),
  `content/companyArchetypes/transport_company.json` i
  `construction_company.json` (VS C23/C24, nowe pole schematu archetypu
  `serviceIds` z walidacją referencji), klucze lokalizacji EN/PL. Wydajność:
  transport 20 jedn./pracownik/mies., budowa 1 jedn. pracy/pracownik/mies.,
  rozbudowa = 4 jedn. pracy, kapitał startowy 20 — wszystko TODO tuning.
  Brak materiałów budowlanych w contencie — usługa budowlana bez wejść
  towarowych (luka).
- **Simulation Core:** `systems/economy/services.ts` (profil usługodawcy,
  zdolność, plan zatrudnienia, ceny lotów), `owner-income.ts`
  (`splitSurplus`, `liquidationSplit`, rezerwa w nadwyżce do wypłaty),
  `trade/flows.ts` (opłata za przewóz i cena oferty), `economy-tick.ts`
  (usługodawcy w pętli firm, plan rozbudowy i wykonawca, krok 9.2
  zakładania usługodawców, zakupy z cen lotów, płatny przewóz, handel przed
  finansami, koszty = płace + opłaty, rezerwa i likwidacja w kroku
  wypłat), encje `Company.finance.investmentReserve`,
  `Inventory.consignmentPrice`, `world-runner.ts` i `load-economy-content.ts`
  (przekazanie profili z contentu).
- **Zapis:** SCHEMA 8 (migracja v7 → v8: rezerwa 0), ENGINE 9; asercje
  numerów wersji w testach persistence zaktualizowane (bez uruchamiania).

### Przykładowe przebiegi pieniężne (wyliczone z reguł, nie z przebiegu)

**Transport** (założenia przykładu: cena mąki w Green Valley 2,00; opłata
za przewóz 0,70/jedn.; farma GV jest właścicielem całego zapasu w komisie;
firma transportowa w Riverside ma 1 pracownika — zdolność 20 jedn.):

| Moment | Płatnik | Kwota | Odbiorca |
|---|---|---|---|
| tick t, krok 10 (handel) | — | 10 jedn. z magazynu GV do Riverside; lot farmy w Riverside z ceną wyładunku 2,70 | — |
| tick t, rozliczenie finansów | farma GV (koszt operacyjny) | 10 × 0,70 = 7,00 | firma transportowa (przychód) |
| tick t, pętla regionu | firma transportowa (koszt płac) | płaca × 1 | jej pracownik (gospodarstwo w Riverside) |
| tick t+1, zakupy gospodarstw Riverside | gospodarstwa Riverside | 10 × 2,70 = 27,00 | farma GV (przychód) |

Netto farma: 27,00 − 7,00 = 20,00 = 10 × 2,00 — cena towaru; opłata
przechodzi przez farmę do przewoźnika. Gdyby towar się nie sprzedał,
farma poniosłaby 7,00 kosztu bez przychodu.

**Rozbudowa** (aktywny plan, koszt 100, nadwyżka do wypłaty 30/mies.):

| Moment | Płatnik | Kwota | Odbiorca |
|---|---|---|---|
| tick t, krok wypłat | — (wydzielenie gotówki) | 15 do rezerwy | rezerwa firmy (gotówka zostaje) |
| tick t, krok wypłat | firma | 15 | właściciel (gospodarstwo) |
| tick t+k, decyzja rozbudowy (wykonawca z ≥ 4 jedn. pracy) | firma (gotówka, rezerwa zwolniona) | 100 | firma budowlana (przychód w rozliczeniu tego ticka) |
| tick t+k, pętla regionu | firma budowlana | 4 × płaca | jej pracownicy |
| tick t+k, krok wypłat | firma budowlana | nadwyżka ponad bufor | jej właściciel (rodzina-inwestor) |

**Likwidacja** (firma zamknięta w ticku t z gotówką 120 i wynikiem
zatrzymanym 30; w t+3 sprzedaż komisowa 12):

| Moment | Płatnik | Kwota | Odbiorca |
|---|---|---|---|
| tick t, krok wypłat | firma zamknięta | 30 (zysk niewypłacony) | właściciel |
| tick t, krok wypłat | firma zamknięta | 90 (zwrot kapitału, nie zysk) | właściciel |
| tick t+3, zakupy | kupujący | 12 | firma zamknięta (przychód → wynik 12) |
| tick t+3, krok wypłat | firma zamknięta | 12 (zysk) | właściciel |

### Czego oczekiwać przy walidacji (przewidywania, nie pomiary)

- Testy, które prawdopodobnie wymagają aktualizacji oczekiwań:
  `owner-income.test.ts` („zamknięta firma wypłaca wpływy z komisu” — teraz
  gotówka zamkniętej firmy wraca do właściciela, więc nie zostaje równa
  kapitałowi), testy fixture'u Black Mountain z pełnym contentem (nowe
  firmy usługowe, płatny przewóz, inny przebieg handlu i rozbudowy), test
  integracyjny contentu (nowe archetypy i usługi), E2E zależne od liczby
  firm. Scenariusze bez contentu (trade-scenario, pm-adoption) zachowują
  bezpłatny przewóz i dawną rozbudowę.
- W świecie Black Mountain handel do Riverside zatrzyma się do czasu
  założenia firmy transportowej w Riverside (wymaga zamówień, wolnego
  pracownika i inwestora z 20 jedn. oszczędności); rozbudowy farmy będą
  wymagały firmy budowlanej w Green Valley.

### Pozostałe ograniczenia

- Koszt rozbudowy 100 nie wynika z definicji usługi (rozbieżność opisana w
  §52L; decyzja: cena zlecenia z pracy × płaca × marża albo parametr
  contentu).
- Przychód z usług wchodzi do „przychodu firm” w panelu Gospodarki (etykieta
  „ze sprzedaży” obejmuje teraz sprzedaż usług).
- Część zapasu bez właściciela (sprzed komisu) jest przewożona bez opłaty.
- Wybór inwestora (rodzina z największymi oszczędnościami) to minimalna
  reguła zgodna z modelem właściciela; brak rynku kapitału, udziałów i
  banków.
- P15, P16, koncentracja pieniądza u rodziny właściciela — bez zmian.

## 20. Walidacja i ponowna diagnoza po etapie 4B (2026-10-01)

### Błędy wykryte w walidacji i poprawione

Kod z sekcji 19 kompilował się i przechodził testy (1 test zmieniony
świadomie: zamknięta firma oddaje teraz całą gotówkę), ale nowe testy
regresji i próbny przebieg Black Mountain ujawniły cztery błędy modelu:

1. **Tworzenie pieniądza przez usługodawcę.** Przewoźnik zatrudniał i
   płacił płace przy ujemnej gotówce (brak limitu wypłacalności; reguła
   zamknięcia nie działa przy zerowym zysku). Płaca minimalna rosła z ceną
   mąki w Riverside, płace zasilały popyt i cenę — spirala: gotówka
   przewoźnika −620 307, oszczędności Riverside +621 483 (t360). **Poprawka:**
   usługodawca zatrudnia najwyżej tylu ludzi, ilu opłaci z gotówki; bez
   pracowników i bez środków na jednego pracownika zamyka działalność
   (likwidacja).
2. **Zakładanie i zamykanie bez działalności** (85 przewoźników w 360
   tickach): kapitał 20 nie pokrywał płacy minimalnej w Riverside (3 × cena ≈
   42). **Poprawka:** firma usługowa powstaje tylko, gdy kapitał opłaci
   miesiąc pracy ludzi potrzebnych do jednego zlecenia (transport: 1
   pracownik, budowa: praca rozbudowy / wydajność).
3. **Zamówienia budowy bez realnej decyzji.** Zamówienie powstawało przy
   każdym uzasadnionym planie, choć AI nie decydowało o rozbudowie
   (trwałość, cooldown) — wykonawca trzymał pracowników bez zleceń.
   **Poprawka:** zamówienie tylko wtedy, gdy AI faktycznie rozbudowuje
   firmę, a nie ma wolnego wykonawcy; do planu zatrudnienia wykonawcy liczą
   się tylko zamówienia niezrealizowane.
4. **Blokada rozbudowy przez „nieosiągalny koszt”** zerowała wynik decyzji
   AI, wyłączała histerezę i resetowała licznik trwałości — przy braku
   wykonawcy AI nigdy nie dojrzewało do rozbudowy, więc firma budowlana
   nigdy nie powstawała. **Poprawka:** decyzja zapada z prawdziwym kosztem;
   rozbudowa bez wykonawcy jest cofana (moc, gotówka, cooldown bez zmian),
   ale stan trwałości sygnału zostaje. Do tego usługodawcy są
   przetwarzani przed klientami, a ich zdolność liczy się z pracowników po
   decyzji o zatrudnieniu w tym ticku (zatrudnieni pracują w miesiącu, za
   który dostają płacę).

**Nowe testy regresji (PASS):** `services.test.ts` — rezerwa (50%, limit
kosztu rozbudowy), likwidacja (zysk + kapitał, ujemna gotówka), ceny lotów;
przez prawdziwy tick: brak przewoźnika blokuje import → przewoźnik z
kapitałem rodziny-inwestora → opłaty przewoźnikowi przy każdym przewozie,
pieniądz co do grosza; bez profilu transportu — przewóz bezpłatny jak przed
4B; rozbudowa: każda opłacona 100 założonej firmie budowlanej, rezerwa ≤ 100,
pieniądz co do grosza (scenariusz z kapitałem firmy budowlanej 200 — patrz
rozbieżność niżej). `owner-income.test.ts` — zamknięta firma: wpływy z
komisu jako zysk, reszta jako zwrot kapitału, nic drugi raz.
`migrations.test.ts` — v7 → v8.

**Walidacja końcowa:** typecheck PASS, lint 0 błędów (1 znane ostrzeżenie),
testy 155 plików / **1204** PASS, build PASS, E2E **18/18** PASS.

### Diagnoza (`runs-summary-4b.json`, 8 przebiegów, 360 ticków)

Powtórka identyczna (`sha1 06318a9a`). **„Bare” ≠ gra** — tryb porównawczy
nie ładuje contentu, więc działa bez usług (przewóz bezpłatny, rozbudowa z
odpływem 100), jak przed 4B.

| Przebieg | Pieniądz t0 → t360 | Handel GV → Riverside | Usługodawcy (założeni / aktywni t360) | Rozbudowy | GV: zaspokojenie t13–120 / t121–360 (P14 → 4B) |
|---|---|---|---|---|---|
| gra, seed fixture | 2030 → 2030 | 33 przepł. / 497 jedn. / t4–48 | transport 2 / 0 | 0 | 93,1 / 90,3 → 85,0 / 84,8% |
| alpha | 2030 → 2030 | 28 / 285 / t4–34 | transport 2 / 0, budowa 6 / 0 | 0 | 100 / 80,1 → 71,2 / 65,4% |
| beta | 2030 → 2030 | 14 / 99 / t4–22 | transport 2 / 0 | 0 | 91,0 / 82,6 → 96,1 / 92,2% |
| gamma | 2030 → 2030 | 16 / 58 / t51–71 | transport 4 / 0, budowa 2 / 1 | **1** | 79,5 / 47,3 → 89,3 / 64,1% |
| delta | 2030 → 2030 | 14 / 90 / t4–24 | transport 3 / 0, budowa 1 / 1 | 0 | 99,7 / 100 → 99,4 / 99,5% |
| zamknięcie t6 | 2030 → 2030 | 9 / 89 / t4–58 | transport 3 / 0 | 0 | 34,3 / 33,6 → 29,5 / 20,8% |
| bare (bez usług) | 2030 → 1930 (odpływ 100) | 43 / 524 / t2–54 | — | 1 | — |

- **Pieniądz zachowany co do grosza we wszystkich przebiegach z contentem —
  bez żadnego odpływu** (koszt rozbudowy trafia teraz do wykonawcy).
- **Transport:** handel do Riverside rusza od t4 (przewoźnik zakładany w t1–3
  na zamówienia), zamiast t2. Opłaty płaci farma GV; przewoźnik płaci
  pensje mieszkańcom Riverside, a jego zysk trafia do rodziny-inwestora z
  Riverside (`cohort_riverside_traders`: 68–407 jedn. wypłat). Oszczędności
  Riverside w t360: 24–416 (przed 4B: 0 we wszystkich seedach) — część
  pieniędzy z importu wraca do regionu przez pracę przy przewozie.
  Zaspokojenie potrzeb Riverside nadal niskie (0–10% w pierwszym roku).
  Przewoźnicy zamykają się, gdy zamówień brakuje albo nie stać ich na
  płacę (opłata za 20 jedn. ≈ 8,7 przy płacy ≈ 12 — nierentowni przy
  obecnych parametrach).
- **Rozbudowa:** firmy budowlane powstają na realne zamówienia (alpha,
  gamma, delta); w gamma jedna rozbudowa wykonana i opłacona. W pozostałych
  plan rozbudowy jest rzadko uzasadniony (w seedzie z fixture'u 2 ticki na
  120 — brak wolnych pracowników w GV).
- **Green Valley:** zaspokojenie w t121–360 wyższe w beta i gamma, niższe w
  seedzie z fixture'u, alpha i zamknięciu t6. W alpha farma skurczyła moc
  (10 → 4,1) w okresie niskiego popytu i nie odbudowała jej — przy niedoborze
  cena rosła do 11,0 (t201), a firmy budowlane powstawały i zamykały się (6) bez
  wykonania rozbudowy farmy. Wyniki zmieniły się w obie strony; nie ma
  podstaw, by uznać 4B za poprawę zaspokojenia potrzeb.
- **Ujemna gotówka** zostaje w zamkniętych firmach (suma −9 … −84 na
  przebieg): ostatnia płaca przy zwolnieniu (płacona za miesiąc pracy)
  przekracza gotówkę. Bilans pieniądza ją uwzględnia (zobowiązanie bez
  wierzyciela) — luka do rozstrzygnięcia przy rozliczaniu zobowiązań.

### Rozbieżności parametrów (decyzje właściciela)

1. **Kapitał firmy budowlanej (20) a praca rozbudowy (4 pracowników × płaca
   minimalna).** Przy płacy ≥ 5 kapitał nie pokrywa zlecenia — firma nie
   powstaje i rozbudowa jest niemożliwa. Propozycja: kapitał ≥ 4 × płaca
   minimalna (np. parametr względny w contencie) albo zaliczka klienta.
2. **Koszt rozbudowy 100 a koszt pracy wykonawcy** (4 × płaca) — cena nie
   wynika z usługi; propozycja: praca × płaca × (1 + marża) albo parametr
   ceny usługi w contencie.
3. **Wydajność przewoźnika (20 jedn./pracownik) a opłata** (koszt trybu ×
   odległość) — przewóz nierentowny przy płacy ≈ 12; propozycja: wyższa
   wydajność (np. 40–60) albo przegląd kosztu trybu `cart`.

