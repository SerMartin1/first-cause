# FIRST CAUSE — Competitive Benchmark & Differentiation v0.2

**Status:** strategiczny dokument projektowy / benchmark konkurencyjny  
**Projekt:** FIRST CAUSE  
**Wersja dokumentu:** 0.2  
**Data:** 2026-09-16  
**Rola:** zdefiniowanie pozycji FIRST CAUSE względem innych symulatorów świata, gier obserwacyjnych, god games i głębokich symulacji gospodarczych; wskazanie obszarów wspólnych, rzeczywistych wyróżników, funkcji wymagających ochrony projektowej oraz konsekwencji dla roadmapy.

**Dokumenty powiązane:**
- `FIRST-CAUSE-Canonical-Decisions-v0.1.md`
- `FIRST-CAUSE-koncepcja-architektura-v0.6.md`
- `FIRST-CAUSE-Simulation-Model-v0.1.md`
- `FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md`
- `FIRST-CAUSE-Entity-Data-Model-v0.1.md`
- `FIRST-CAUSE-AI-Decision-Model-v0.1.md`
- `FIRST-CAUSE-Causality-Engine-Spec-v0.1.md`
- `FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md`
- `FIRST-CAUSE-Architect-Intervention-Influence-Spec-v0.1.md`
- `FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`
- `FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1.md`
- `FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md`
- `FIRST-CAUSE-Simulation-Test-Spec-v0.1.md`
- `FIRST-CAUSE-Implementation-Roadmap-v0.2.md`

---

# 0. Cel dokumentu

FIRST CAUSE nie powstaje w próżni. Istnieją już gry i projekty oferujące autonomiczne światy, proceduralną historię, tryb obserwatora, ingerowanie w warunki świata, złożoną gospodarkę albo analizę przyczyn zdarzeń.

Celem tego dokumentu nie jest stworzenie rankingu „najlepszych gier”. Celem jest odpowiedź na pięć pytań:

1. Które elementy FIRST CAUSE są już obecne u konkurencji?
2. Które elementy są koniecznym standardem gatunku, a nie wyróżnikiem?
3. Gdzie istnieje rzeczywista przestrzeń różnicowania produktu?
4. Których elementów projektu nie wolno rozmyć podczas implementacji?
5. Jak benchmark powinien wpłynąć na Vertical Slice, MVP i dalszą roadmapę?

Fundamentalna zasada:

> **FIRST CAUSE nie powinien wygrywać liczbą systemów. Powinien wygrywać tym, że gracz może obserwować, zmieniać, prześledzić i zrozumieć przyczyny emergentnej historii.**

---

# 1. Status benchmarku

Benchmark jest dokumentem strategicznym, a nie źródłem prawdy o implementacji konkurencyjnych produktów.

Informacje o projektach zewnętrznych pochodzą z publicznie dostępnych opisów produktów i materiałów projektowych sprawdzonych podczas researchu we wrześniu 2026.

Funkcje zapowiedziane lub znajdujące się na roadmapach konkurencji należy traktować inaczej niż funkcje potwierdzone w działających wersjach.

Benchmark powinien być okresowo aktualizowany, szczególnie dla projektów będących nadal w rozwoju.

---

# 2. Główne projekty referencyjne

## 2.1 Fantasy Map Simulator

Znaczenie dla FIRST CAUSE:
- obserwowanie autonomicznego świata,
- proceduralna historia,
- prostota obserwacji,
- świat jako generator wydarzeń.

Lekcja: samo „watch history unfold” nie jest wyróżnikiem.

## 2.2 Galimulator

Znaczenie:
- observer mode,
- sandbox,
- możliwość ingerencji,
- autonomiczny rozwój struktur politycznych.

Lekcja: połączenie obserwatora i ingerencji istnieje już jako znany model rozgrywki.

## 2.3 WorldBox

Znaczenie:
- god game,
- autonomiczne cywilizacje,
- proste narzędzia zmieniające warunki,
- obserwowanie skutków ingerencji.

Lekcja: „stwórz warunek i obserwuj świat” samo w sobie nie wystarcza do wyróżnienia FIRST CAUSE.

## 2.4 Another Map Simulator

Projekt wymagający szczególnego monitorowania.

Istotne obszary:
- proceduralne światy,
- autonomiczne AI państw,
- gospodarka,
- handel,
- populacja,
- God Mode,
- Observer Mode,
- Chronicle,
- history replay.

Znaczenie: potencjalnie bezpośredni konkurent w kategorii autonomous world simulation.

## 2.5 Civitas: World Simulator

Istotne obszary:
- autonomiczne państwa,
- społeczeństwa,
- kultura,
- język,
- etniczność,
- zmiany struktur politycznych,
- God Mode.

Znaczenie: ważny benchmark dla późniejszego FULL, szczególnie jeśli FIRST CAUSE rozwinie państwa, kultury i geopolitykę.

## 2.6 Vonkelveld

Najważniejszy konkurent koncepcyjny dla obecnego rdzenia FIRST CAUSE.

Deklarowane elementy obejmują:
- deterministyczną symulację,
- Chronicle,
- Ask Why,
- causal chains,
- ingerowanie w warunki zamiast bezpośredniego wydawania rozkazów,
- autonomiczne reakcje świata,
- emergentną historię.

Kluczowy wniosek:

> **WHY?, Chronicle i „conditions not commands” nie mogą być traktowane samodzielnie jako unikalne USP FIRST CAUSE.**

## 2.7 Dwarf Fortress

Benchmark dla:
- głębokości symulacji,
- proceduralnego świata,
- emergentnej historii,
- długotrwałej pamięci świata.

Lekcja: FIRST CAUSE nie powinien próbować konkurować liczbą mikrosymulowanych szczegółów. Powinien konkurować czytelnością mechanizmów i przyczyn.

## 2.8 Victoria 3

Benchmark dla:
- populacji,
- potrzeb,
- zatrudnienia,
- produkcji,
- dóbr,
- handlu,
- gospodarki systemowej.

Lekcja: głęboka gospodarka również nie jest samodzielnym wyróżnikiem.

## 2.9 Workers & Resources: Soviet Republic

Benchmark dla:
- materialności gospodarki,
- produkcji,
- transportu,
- infrastruktury,
- logistyki,
- przepływu fizycznych dóbr.

Lekcja: gospodarka FIRST CAUSE musi zachować materialną spójność, ale nie powinna próbować zostać city-builderem logistycznym.

## 2.10 Songs of Syx

Benchmark dla:
- systemowych reakcji łańcuchowych,
- gospodarki,
- populacji,
- osadnictwa,
- dużej skali.

## 2.11 RimWorld

Benchmark dla emergent storytelling.

Lekcja: historia powstająca z systemów jest już silnie rozpoznawalną wartością na rynku. FIRST CAUSE musi dołożyć do niej możliwość badania przyczyn.

## 2.12 Shadow Empire

Benchmark dla proceduralnego tworzenia świata i systemowej różnorodności warunków początkowych.

## 2.13 Rimefall

Istotny benchmark dla causal economy i reakcji łańcuchowych typu:

`shortage → production problem → housing/economic pressure → social consequence`

## 2.14 Geoplanetical

Benchmark dla świata opartego na połączonych systemach i dużej liczbie zależności.

## 2.15 Global Supremacy

Benchmark skali.

Wniosek: sama liczba regionów, państw lub miast nie jest dobrą podstawą pozycjonowania FIRST CAUSE.

## 2.16 Projekty eksperymentalne do monitorowania

### Dominus

Istotny ze względu na deklarowaną filozofię „everything has a cause” oraz analizowanie causal chains prowadzących do wydarzeń.

### Causafera

Istotna jako eksperymentalny causal simulation engine wykorzystujący m.in. deterministyczność, replay, persistent world state i provenance zdarzeń.

Wniosek:

> **Causal world simulation zaczyna być rozpoznawalnym kierunkiem projektowym. Sam fakt posiadania causal graph nie wystarczy jako trwała przewaga.**

---

# 3. Benchmark funkcjonalny

Legenda:

- `●●●` — element centralny / bardzo silny,
- `●●` — istotny,
- `●` — obecny w ograniczonym zakresie,
- `—` — brak lub marginalny,
- `?` — brak wystarczającego potwierdzenia / roadmapa.

| System | FIRST CAUSE | FMS | AMS | Civitas | Vonkelveld | DF | Victoria 3 | W&R | Songs of Syx | Rimefall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Procedural World | ●●● | ●●● | ●●● | ●● | ●●● | ●●● | — | ● | ●● | ●● |
| Autonomous World | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | ● | ●● | ●● |
| Observer Mode | ●●● | ●●● | ●●● | ●●● | ●●● | ● | — | — | — | — |
| God / Architect | ●●● | ●● | ●●● | ●● | ●●● | — | — | — | — | — |
| Conditions instead of orders | ●●● | ● | ● | ● | ●●● | — | — | — | — | — |
| Resources | ●●● | ● | ●● | ? | ●● | ●●● | ●●● | ●●● | ●●● | ●●● |
| Finite Deposits | ●●● | — | ? | ? | ? | ●●● | ● | ●●● | ●● | ●● |
| Production Chains | ●●● | — | ●● | ? | roadmap | ●●● | ●●● | ●●● | ●●● | ●●● |
| Physical Inventory | ●●● | — | ? | ? | ? | ●●● | ●● | ●●● | ●● | ●● |
| Dynamic Prices | ●●● | — | ●● | roadmap | roadmap | ●● | ●●● | ●●● | ●● | ●● |
| Trade | ●●● | ● | ●●● | roadmap | roadmap | ●● | ●●● | ●●● | ●● | ●●● |
| Transport / Logistics | ●●● | — | ● | ? | ? | ●● | ●● | ●●● | ●● | ●● |
| Population Simulation | ●●● | ● | ●● | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● |
| Migration | ●●● | ● | ●● | ●● | ●●● | ●● | ●●● | ●● | ●● | ●● |
| Needs | ●●● | — | ●● | ? | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● |
| Companies | ●●● | — | ●● | ? | roadmap | ●● | ●●● | ●●● | ●● | ? |
| Autonomous Economic AI | ●●● | — | ●●● | ? | roadmap | ●● | ●●● | — | ●● | ●● |
| Technology | ●●● | ● | planned | ? | ? | ●● | ●●● | ●● | ●● | ●●● |
| Organic Settlements | ●●● | — | ? | ● | ●●● | ●●● | ● | ●●● | ●●● | ●● |
| Emergent History | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | ●● | ● | ●●● | ●● |
| Chronicle | ●●● | ●● | ●●● | ●● | ●●● | ●● | ● | — | ● | ? |
| Explicit Causality Graph | ●●● | — | — | — | ●●● | — | — | — | — | — |
| WHY? | ●●● | — | — | — | ●●● | — | — | — | — | — |
| WHY NOT? | ●●● | — | — | — | ? | — | — | — | — | — |
| Butterfly Effect | ●●● | — | — | — | ●● | — | — | — | — | — |
| Deterministic Replay | ●●● | ? | ? | ? | ●●● | ●● | — | — | ? | ? |
| Branch A/B | ●●● | — | — | — | ? | — | — | — | — | — |
| Historical Significance | ●●● | — | — | ? | ●● | ● | — | — | — | — |

**Uwaga:** kolumna FIRST CAUSE opisuje docelową specyfikację projektu, nie aktualny stan kodu.

---

# 4. Co NIE jest unikalnym USP FIRST CAUSE

Po benchmarku nie należy budować komunikacji produktu wyłącznie na następujących hasłach:

## 4.1 „Autonomiczny świat”

Wiele istniejących symulatorów posiada autonomiczne podmioty i procesy.

## 4.2 „Obserwuj historię”

Fantasy Map Simulator, Galimulator, WorldBox, Dwarf Fortress i inne projekty realizują tę wartość na różne sposoby.

## 4.3 „God Mode / zmieniaj świat”

To istniejący wzorzec gatunku.

## 4.4 „Zmieniaj warunki zamiast wydawać rozkazy”

To bardzo ważny element FIRST CAUSE, ale Vonkelveld pokazuje, że również ten kierunek nie jest już unikalny.

## 4.5 „WHY?”

Samo Ask Why / causal chain również nie może być traktowane jako wystarczający wyróżnik.

## 4.6 „Głęboka gospodarka”

Victoria 3, Workers & Resources, Dwarf Fortress, Songs of Syx i inne projekty posiadają rozbudowane gospodarki.

## 4.7 „Ogromny świat”

Liczba regionów nie powinna być podstawowym polem konkurencji.

---

# 5. Rzeczywisty obszar różnicowania

Najsilniejsza potencjalna tożsamość FIRST CAUSE powstaje nie z pojedynczej funkcji, ale z ich połączenia:

`AUTONOMOUS WORLD`

`+ MATERIAL ECONOMY`

`+ LOCAL ACTOR DECISIONS`

`+ CAUSAL MEMORY`

`+ WHY?`

`+ WHY NOT?`

`+ BUTTERFLY EFFECT`

`+ ARCHITECT INTERVENTIONS`

`+ DETERMINISTIC REPLAY`

`+ COUNTERFACTUAL BRANCHING`

`+ EMERGENT CHRONICLE`

To połączenie powinno być chronione jako rdzeń strategiczny produktu.

---

# 6. Material Causality

FIRST CAUSE powinien zachować zasadę, że konsekwencje gospodarcze mają materialne źródła.

Kanoniczny przepływ gospodarki:

`ZASÓB → WYDOBYCIE/POZYSKANIE → PRZETWÓRSTWO → DOBRO POŚREDNIE → DOBRO FINALNE/KAPITAŁOWE → TRANSPORT → RYNEK → KONSUMPCJA/INWESTYCJA`

Przykład:

```text
Iron deposit depleted
        ↓
local iron extraction ↓
        ↓
iron supply ↓
        ↓
iron price ↑
        ↓
tool production cost ↑
        ↓
farm mechanization slows
        ↓
agricultural productivity pressure
        ↓
food price ↑
        ↓
needs satisfaction ↓
        ↓
migration pressure ↑
```

Causal Engine powinien umożliwiać prześledzenie tego procesu bez wymyślania przyczyn po fakcie.

---

# 7. WHY? jako fundament, nie końcowy wyróżnik

WHY? pozostaje obowiązkowym filarem FIRST CAUSE.

Gracz powinien móc zapytać m.in.:

- Dlaczego wzrosła cena żelaza?
- Dlaczego Black Mountain zaczęło rosnąć?
- Dlaczego pojawiła się migracja?
- Dlaczego firma powstała?
- Dlaczego firma upadła?
- Dlaczego osada awansowała do miasta?
- Dlaczego dana technologia zaczęła się rozpowszechniać?

Jednak WHY? powinno być traktowane jako baza dla głębszych funkcji, a nie jako samodzielne USP.

---

# 8. WHY NOT? — strategiczny wyróżnik

WHY NOT? powinno zostać podniesione do rangi pełnoprawnego filaru explainability.

WHY? analizuje istniejący rezultat.

WHY NOT? analizuje **brak rezultatu, który był możliwy, ale nie nastąpił**.

Przykład:

```text
QUESTION
Why wasn't an iron mine founded in Black Mountain?

KNOWN OPPORTUNITY
Iron deposit discovered

DECISION EVALUATION
Expected profitability: 4.2%
Required profitability: 8.0%

BLOCKERS
1. Transport cost — HIGH
2. Labor availability — LOW
3. Coal input price — +34%

RESULT
Found Mine option rejected

PRIMARY BLOCKER
Transport cost
```

WHY NOT? wymaga przechowywania informacji o:
- rozważanych opcjach,
- hard constraints,
- soft constraints,
- scoringu,
- progach decyzyjnych,
- głównych blockerach,
- decyzjach odrzuconych.

Nie oznacza to konieczności przechowywania każdego pełnego scoringu każdego aktora przez całą historię. Potrzebna jest kontrolowana polityka retencji danych explainability.

---

# 9. Butterfly Effect

Butterfly Effect powinien odpowiadać na odwrotne pytanie niż WHY?.

WHY?:

> Co doprowadziło do tego wydarzenia?

Butterfly Effect:

> Do czego doprowadziło to wydarzenie?

Przykład:

```text
Architect reveals iron deposit — Year 42

+1 year
→ first mining opportunity
→ mine founded

+10 years
→ employment ↑
→ migration ↑
→ local tool production ↑

+50 years
→ settlement becomes city
→ regional trade corridor emerges

+100 years
→ industrial cluster
→ technology diffusion
→ demographic shift in neighboring regions
```

Rekomendowane okna prezentacyjne:
- Immediate,
- 1 year,
- 10 years,
- 50 years,
- 100 years,
- Current Date.

---

# 10. Counterfactual Branching / World A-B

Jednym z najmocniejszych potencjalnych wyróżników jest wykorzystanie deterministyczności do eksperymentów kontrfaktycznych.

Model:

```text
COMMON WORLD STATE — Year 183
             │
      ┌──────┴──────┐
      │             │
   WORLD A       WORLD B
   no change     Architect Intervention
      │             │
      └──────┬──────┘
             ↓
       COMPARE RESULTS
```

Przykład:

| Metric | World A | World B | Divergence |
|---|---:|---:|---:|
| Population | 18,420 | 47,830 | +29,410 |
| Cities | 1 | 3 | +2 |
| Iron Output | 0 | 18,240 | +18,240 |
| Net Migration | -1,204 | +8,721 | +9,925 |
| Trade Flows | 23 | 61 | +38 |

System powinien następnie wskazać najważniejsze causal divergence points.

### Status implementacyjny

Counterfactual Branching **nie jest wymaganiem obecnego Vertical Slice**.

Architektura save/determinism nie powinna jednak blokować późniejszej implementacji tej funkcji.

Rekomendowany przyszły dokument:

`FIRST-CAUSE-Counterfactual-Branching-Spec-v0.1.md`

---

# 11. Retrospective Historical Significance

Chronicle powinno zachować możliwość ponownej oceny znaczenia dawnych wydarzeń.

Przykład:

```text
Year 241
Small coal deposit discovered in North Valley
Initial Significance: 32 / Notable

Year 417
The deposit is now causally connected with:
→ regional industrialization
→ railway corridor
→ two major cities
→ long-term migration

Retrospective Significance: 81 / Historic
```

To pozwala światu rozpoznawać własne punkty zwrotne bez zmiany faktów historycznych.

---

# 12. Architect Legacy

Historia interwencji Architekta nie powinna być tylko listą wykonanych akcji.

Docelowo UI powinno odpowiadać:

> **Co naprawdę spowodowałem?**

Przykładowy widok:

```text
YOUR LEGACY

Interventions: 7
Direct consequences: 19
Major consequences: 47
Historic consequences: 8
World-defining consequences: 1

Largest butterfly effect:
Iron Reveal — Black Mountain, Year 42

Affected:
14 regions
127 companies
3 settlements
84,000 population

Consequences still detectable:
173 years later
```

Architect Legacy powinno korzystać z Causal Graph i Historical Significance, a nie generować niezależną narrację.

---

# 13. MUST HAVE — funkcje fundamentalne

Następujące elementy są wymagane dla zachowania tożsamości FIRST CAUSE:

1. Autonomiczny świat.
2. Procedural World Generation.
3. Region jako podstawowa jednostka obliczeniowa.
4. Materialna gospodarka produkcyjna.
5. Autonomiczne firmy i przedsiębiorczość.
6. Population Cohorts.
7. Potrzeby i konsumpcja.
8. Migracja.
9. Organic Settlements.
10. Technologia i wiedza wynikające z warunków.
11. Architect Mode.
12. Interwencje zmieniające przyczyny, nie gwarantujące rezultatów.
13. Simulation Facts.
14. Causal Graph.
15. Chronicle.
16. WHY?.
17. Determinizm.
18. Seeded RNG.
19. Długoterminowa symulacja.
20. Explainability Tests.

---

# 14. DIFFERENTIATORS — obszary wymagające szczególnej ochrony

## D1 — WHY NOT?

Wyjaśnianie niezrealizowanych możliwości i blockerów decyzji.

## D2 — Material Causality

Możliwość prześledzenia realnego łańcucha zasób → produkcja → rynek → ludność → historia.

## D3 — Butterfly Effect

Śledzenie potomnych konsekwencji jednego faktu lub interwencji.

## D4 — Counterfactual Branching

Porównanie dwóch deterministycznych wariantów tego samego świata.

## D5 — Retrospective Historical Significance

Znaczenie wydarzeń może rosnąć, gdy ujawniają się ich długoterminowe skutki.

## D6 — Architect Legacy

Ocena rzeczywistego długoterminowego wpływu gracza na świat.

## D7 — Explainable Autonomous Actors

Firma nie tylko podejmuje decyzję. System może wskazać obserwowane warunki, opcje, ograniczenia i powody wyboru lub odrzucenia działania.

## D8 — Causal Chronicle

Kronika jest prezentacją rzeczywistych Simulation Facts i ich relacji, a nie niezależnym generatorem fabuły.

---

# 15. DON'T COPY

## 15.1 Nie ścigać Dwarf Fortress mikrosymulacją

Population Cohorts pozostają właściwym modelem FIRST CAUSE.

Pełna populacja jako indywidualne NPC zwiększyłaby koszt symulacji i rozmyła główną wartość produktu.

## 15.2 Nie robić drugiej Victorii

Architekt nie jest państwem ani rządem.

Gracz nie powinien przejąć standardowego gameplayu grand strategy.

## 15.3 Nie robić city-buildera logistycznego

Transport i infrastruktura mają wpływać na przyczynowość gospodarki, ale FIRST CAUSE nie powinien wymagać ręcznego projektowania każdej trasy i fabryki.

## 15.4 Nie budować produktu wokół klasycznej mapy geograficznej

Living Atlas / World Network i text-first UI pozostają właściwym kierunkiem.

## 15.5 Nie zamieniać Architect Mode w cheat menu

Interwencje mają zmieniać warunki.

Nie powinny bezpośrednio tworzyć prosperity, firm, miast ani gwarantowanych wyników.

## 15.6 Nie dodawać geopolityki przed udowodnieniem rdzenia

Państwa, wojny i dyplomacja mogą być późniejszym rozszerzeniem, ale nie powinny opóźniać Black Mountain i Vertical Slice.

## 15.7 Nie konkurować liczbą regionów

Architecture Target do 3 000 regionów jest celem technicznym, nie marketingowym USP.

---

# 16. SCOPE RISKS

## R1 — „Symuluj wszystko”

Największe ryzyko projektu.

Dodawanie kolejnych systemów przed udowodnieniem obecnego rdzenia zwiększa ryzyko stworzenia szerokiej, ale płytkiej symulacji.

## R2 — Causality storage explosion

Zapisywanie każdej mikro-zależności przez setki lat może eksplodować pamięciowo.

Wymagane:
- significance thresholds,
- aggregation,
- causal compression,
- retention policy,
- archival layers.

## R3 — Explainability storage explosion

WHY NOT? może skłaniać do przechowywania każdego odrzuconego wariantu każdej decyzji.

Należy zachować tylko dane potrzebne do wyjaśnienia istotnych decyzji albo rekonstruować część uzasadnień deterministycznie.

## R4 — UI overload

Głębokość symulacji nie może oznaczać prezentowania całego World State.

Read Models pozostają obowiązkowe.

## R5 — False causality

Największe ryzyko jakościowe.

System nie może prezentować korelacji jako przyczyny ani dopisywać przyczyn po fakcie.

## R6 — Performance versus depth

Każdy nowy system musi być oceniany również pod kątem kosztu dla światów 250 / 600 / 1 200 / 2 000+ regionów.

## R7 — Competitor convergence

Konkurencyjne projekty mogą implementować kolejne elementy causal simulation.

Dlatego przewaga FIRST CAUSE powinna wynikać z integracji systemów, a nie jednej funkcji.

---

# 17. Konsekwencje dla Vertical Slice

Benchmark **nie uzasadnia rozszerzania obecnego zakresu VS o kolejne wielkie systemy**.

Vertical Slice nadal powinien przede wszystkim udowodnić:

```text
WARUNKI
   ↓
SZANSA / PRESJA
   ↓
AUTONOMICZNA DECYZJA
   ↓
MATERIALNA KONSEKWENCJA
   ↓
SPRZĘŻENIA
   ↓
HISTORIA
   ↓
WHY?
```

Black Mountain pozostaje właściwym scenariuszem referencyjnym.

### Dodatkowy wymóg strategiczny

Podczas implementacji VS należy pilnować, aby struktury danych decyzji AI i Causality Engine **nie zamknęły drogi do pełnego WHY NOT?**.

Nie oznacza to konieczności ukończenia całego docelowego interfejsu WHY NOT? przed pierwszym VS.

---

# 18. Konsekwencje dla MVP

MVP powinno wzmocnić przede wszystkim:

1. WHY? dla większej liczby typów zdarzeń.
2. WHY NOT? dla kluczowych decyzji aktorów.
3. Butterfly Effect dla ważnych Simulation Facts.
4. Chronicle z retrospective significance.
5. Architect Legacy w podstawowej formie.
6. Material causality dla bardziej rozbudowanych łańcuchów gospodarczych.
7. Czytelne porównywanie regionów i procesów.

Nie należy automatycznie dodawać państw, wojny lub pełnej polityki tylko dlatego, że występują u konkurencji.

---

# 19. Konsekwencje dla FULL

Potencjalne rozszerzenia po udowodnieniu rdzenia:

- państwa,
- instytucje,
- bardziej złożone kultury i narody,
- dyplomacja,
- konflikty,
- rozbudowane finanse,
- globalne technologie,
- bardziej zaawansowane historyczne postacie,
- Counterfactual Branching,
- Compare Worlds,
- rozwinięte Architect Legacy.

Każde rozszerzenie powinno odpowiadać na pytanie:

> Czy zwiększa ono liczbę interesujących i wyjaśnialnych zależności przyczynowych?

Jeżeli system jedynie zwiększa liczbę parametrów bez tworzenia nowych znaczących procesów, jego priorytet powinien być niski.

---

# 20. Pozycjonowanie produktu

Nie rekomenduje się pozycjonowania FIRST CAUSE jako:

- „najgłębszego symulatora świata”,
- „największego świata”,
- „god game z ewoluującymi cywilizacjami”,
- „gry, w której obserwujesz historię”,
- „jedynej gry z WHY?”.

Te obszary są już zajęte lub trudne do obrony.

Lepszym kierunkiem jest podkreślenie związku między przyczyną, autonomiczną reakcją świata i możliwością jej prześledzenia.

Robocze kierunki komunikacyjne:

> **Create a cause. Watch history answer.**

> **Every world has a history. Every history has a cause.**

> **Change the conditions. Trace the consequences.**

Nie są to jeszcze zatwierdzone slogany marketingowe.

---

# 21. Docelowa pętla doświadczenia gracza

Strategiczny loop FIRST CAUSE:

```text
CREATE CONDITIONS
       ↓
SIMULATE
       ↓
OBSERVE
       ↓
QUESTION
       ↓
UNDERSTAND
       ↓
INTERVENE
       ↓
TRACE CONSEQUENCES
       ↓
COMPARE
       ↺
```

W Vertical Slice `COMPARE` może oznaczać porównanie okresów, regionów i zmian.

W późniejszej wersji może oznaczać pełne World A/B Counterfactual Branching.

---

# 22. Priorytety strategiczne

## P0 — chronić podczas obecnej implementacji

- autonomiczność świata,
- materialną gospodarkę,
- Simulation Facts,
- prawdziwy Causal Graph,
- deterministyczność,
- WHY?,
- możliwość przyszłego WHY NOT?,
- Architect = conditions, not outcomes,
- Chronicle = presentation of facts, not story generator.

## P1 — rozwijać po stabilnym rdzeniu VS

- pełniejsze WHY NOT?,
- Butterfly Effect,
- retrospective significance,
- Architect Legacy,
- rozszerzone causal exploration UI.

## P2 — rozwijać po potwierdzeniu MVP

- Counterfactual Branching,
- Compare Worlds,
- rozbudowane historyczne porównania eksperymentów.

---

# 23. Watchlist konkurencyjny

Projekty wymagające okresowego monitorowania:

### Tier A — bezpośrednie znaczenie koncepcyjne
- Vonkelveld
- Another Map Simulator
- Civitas: World Simulator
- Fantasy Map Simulator

### Tier B — benchmark systemowy
- Dwarf Fortress
- Victoria 3
- Workers & Resources: Soviet Republic
- Songs of Syx
- RimWorld
- Rimefall

### Tier C — emerging / experimental
- Dominus
- Causafera
- nowe projekty causal world simulation

Rekomendowany przegląd benchmarku:
- przed zamrożeniem MVP,
- przed utworzeniem strony Steam,
- przed większą zmianą pozycjonowania produktu,
- co około 6 miesięcy podczas aktywnego developmentu.

---

# 24. Kryterium oceny nowych pomysłów

Każdy większy nowy system powinien zostać oceniony przez pięć pytań:

1. Czy zwiększa emergencję?
2. Czy tworzy nowe rzeczywiste zależności przyczynowe?
3. Czy gracz może je zrozumieć przez WHY?/WHY NOT?/Butterfly Effect?
4. Czy działa bez bezpośredniego sterowania wynikiem przez gracza?
5. Czy wartość gameplayowa uzasadnia koszt symulacyjny i UI?

Jeżeli większość odpowiedzi brzmi „nie”, system prawdopodobnie nie powinien być obecnie priorytetem.

---

# 25. Decyzje wynikające z benchmarku

## CB-001

**Nie traktować WHY? jako samodzielnego unikalnego USP.**

WHY? pozostaje fundamentalnym systemem FIRST CAUSE.

## CB-002

**WHY NOT? zostaje uznane za strategiczny differentiator.**

Implementacja AI i Causality nie może blokować jego późniejszego rozwinięcia.

## CB-003

**Material Causality zostaje uznana za strategiczny differentiator.**

Ekonomia nie może zostać sprowadzona do abstrakcyjnych bonusów i skryptowanych rezultatów.

## CB-004

**Butterfly Effect pozostaje kluczowym kierunkiem eksploracji causal graph.**

## CB-005

**Counterfactual Branching zostaje wpisane jako kierunek post-MVP, nie jako wymaganie Vertical Slice.**

## CB-006

**Architect Legacy zostaje uznane za docelowy element prezentacji wpływu gracza.**

## CB-007

**Nie rozszerzać Vertical Slice o państwa, wojny i pełną geopolitykę na podstawie benchmarku konkurencji.**

## CB-008

**Nie konkurować marketingowo samą skalą świata.**

## CB-009

**Nie zmieniać Population Cohorts na pełną symulację indywidualnych NPC tylko w celu zwiększenia „głębi”.**

## CB-010

**Konkurencyjność FIRST CAUSE ma wynikać z integracji systemów, a nie pojedynczej funkcji.**

---

# 26. Najważniejszy wniosek

FIRST CAUSE nie posiada bezpiecznej przewagi dlatego, że ma autonomiczny świat, Chronicle, god mode, gospodarkę lub nawet WHY?. Każdy z tych elementów występuje już w innych projektach albo zaczyna się pojawiać.

Największy potencjał projektu leży w ich integracji:

> **Architekt zmienia rzeczywistą przyczynę → autonomiczni aktorzy reagują lokalnie → materialna gospodarka propaguje konsekwencje → Causal Graph zachowuje ich pochodzenie → Chronicle wybiera historycznie istotne rezultaty → gracz może zapytać WHY?, WHY NOT?, prześledzić Butterfly Effect, a docelowo porównać alternatywne wersje tego samego świata.**

To powinno być traktowane jako strategiczny rdzeń FIRST CAUSE.

---

# 27. Rekomendacja implementacyjna

Benchmark nie zmienia głównego kierunku aktualnej roadmapy:

`KANON → KONTRAKTY → FUNDAMENT SILNIKA → BLACK MOUNTAIN → EXPLAINABILITY → STABILIZACJA VS`

Nie należy obecnie otwierać nowych dużych systemów gameplayowych.

Najważniejszym zadaniem jest udowodnienie, że istniejący projekt potrafi wygenerować **jedną naprawdę dobrą, materialną, autonomiczną i w pełni wyjaśnialną historię**.

Jeżeli Black Mountain potrafi odpowiedzieć nie tylko:

> „Co się wydarzyło?”

ale również:

> „Dlaczego?”, „Dlaczego nie wydarzyło się coś innego?” oraz „Do czego ta przyczyna doprowadziła?”

— wtedy FIRST CAUSE udowodni swój najważniejszy wyróżnik projektowy.


---

# 28. AI-Assisted Development Benchmark

## 28.1 Cel

Ten rozdział rozszerza benchmark konkurencyjny o **model produkcji gry**. Nie dotyczy AI sterującego aktorami wewnątrz symulacji, lecz użycia generatywnego AI podczas developmentu: programowania, review kodu, tworzenia assetów, tekstów, audio, lokalizacji, researchu, przygotowania danych i marketingu.

Dla FIRST CAUSE jest to istotne, ponieważ projekt jest rozwijany w modelu, w którym człowiek pozostaje właścicielem koncepcji, architektury i decyzji projektowych, a narzędzia AI mogą zwiększać przepustowość implementacji, audytu, testów i produkcji contentu.

**Zasada interpretacji benchmarku:** publiczne AI Content Disclosure potwierdza deklarowany sposób użycia AI, ale nie pozwala automatycznie określić procentu kodu lub całej gry stworzonego przez AI. Nie należy więc utożsamiać „AI-assisted coding” z „gra napisana w całości przez AI”, jeśli twórca tego wprost nie deklaruje.

## 28.2 Projekty referencyjne

| Projekt | Model produkcji | Coding AI | Art / visuals | Audio | Text / localization / data | Znaczenie dla FIRST CAUSE |
|---|---|---:|---:|---:|---:|---|
| NODWAR | szerokie AI-assisted development | wysoki / deklarowany | wysoki | wysoki | częściowo | strategiczno-symulacyjny przykład szerokiego użycia AI |
| Deepclaim | solo developer + Claude | wysoki / deklarowany | proceduralne, kodowane runtime | proceduralne, kodowane runtime | częściowo | bardzo czysty model „human-directed AI coding” |
| Rifts of Cozmos | solo + wiele modeli | wysoki / deklarowany | wysoki | własna produkcja | nieustalone | przykład rozdzielenia generowania i review kodu między modele |
| Meet Claude | AI jako centralna metoda produkcji | bardzo wysoki | bardzo wysoki | bardzo wysoki | bardzo wysoki | eksperymentalny skrajny model, nie wzorzec scope dla FIRST CAUSE |
| Geoplanetical | solo + AI do skali contentu | brak publicznego potwierdzenia | ok. 60 000 portretów AI | brak deklaracji | lokalizacja, research, formatowanie danych, marketing | szczególnie ważny przykład zwiększania skali contentu |

### NODWAR

Oficjalne Steam AI Content Disclosure deklaruje użycie AI do **coding, game assets, music oraz promotional art**. Jest to ważny benchmark, ponieważ projekt znajduje się w obszarze strategii/symulacji i pokazuje, że generatywne AI może być używane nie tylko do assetów, ale również bezpośrednio w implementacji.

Źródło: https://store.steampowered.com/app/4463890/Nodwar/

### Deepclaim

Twórca deklaruje model **solo developer + Anthropic Claude jako AI coding assistant**. AI pomagało pisać kod; sam kod generuje grafikę proceduralnie w runtime oraz syntetyzuje audio. AI wspierało również część tekstów i materiałów marketingowych, a twórca deklaruje ręczne kierowanie, review i edycję wyników.

Źródło: https://store.steampowered.com/app/5013330/Deepclaim/

Dla FIRST CAUSE jest to szczególnie interesujące, ponieważ pokazuje model:

`HUMAN DESIGN → AI-ASSISTED IMPLEMENTATION → PROCEDURAL OUTPUT → HUMAN REVIEW`

### Rifts of Cozmos

Solo developer deklaruje intensywne użycie **Gemini, Claude i Qwen** do tworzenia fragmentów kodu oraz ich review. AI jest również wykorzystywane w warstwie wizualnej, przy czym część materiałów jest ręcznie szkicowana lub edytowana.

Źródło: https://store.steampowered.com/app/5021850/Rifts_of_Cozmos/

Najważniejsza lekcja dla FIRST CAUSE nie dotyczy assetów, lecz **multi-model workflow**: implementacja i kontrola jakości nie muszą być wykonywane przez ten sam model.

### Meet Claude

Twórca deklaruje, że gra została wykonana z generatywnym AI obejmującym **writing, code, art, music i deployment**, głównie przy użyciu Claude. Jest to skrajny przypadek i celowy eksperyment związany z tematyką samej gry.

Źródło: https://store.steampowered.com/app/4437280/Meet_Claude/

Dla FIRST CAUSE nie jest to rekomendowany model produkcyjny. Pokazuje natomiast techniczną granicę tego, jak szeroko AI może uczestniczyć w pipeline jednej małej produkcji.

### Geoplanetical

Geoplanetical jest projektem solo. Twórca deklaruje użycie generatywnego AI do lokalizacji, researchu i formatowania real-world starting data, materiałów promocyjnych oraz około **60 000 portretów postaci**. Jednocześnie wyraźnie zaznacza, że pozostała część gry nie używa generatywnego AI i generatywne AI nie działa podczas gameplayu.

Źródło: https://store.steampowered.com/app/940230/Geoplanetical/

To szczególnie ważny benchmark dla FIRST CAUSE, ponieważ pokazuje AI jako **content-scale multiplier**, a nie koniecznie jako autora silnika.

---

# 29. Trzy modele AI-assisted game development

## Model A — AI jako producent większości warstw

```text
HUMAN DIRECTION
      ↓
AI CODE + AI ART + AI TEXT + AI AUDIO
      ↓
GAME
```

Zaletą jest bardzo wysoka przepustowość. Ryzykiem jest utrata spójności, trudność audytu, generyczna warstwa wizualna i powstawanie systemów, których właściciel projektu nie rozumie wystarczająco dobrze.

**FIRST CAUSE nie przyjmuje tego modelu jako docelowego.**

## Model B — AI jako zespół implementacyjny pod kontrolą człowieka

```text
                    HUMAN
             Product / Game Architect
                       ↓
        SPECIFICATION + ACCEPTANCE CRITERIA
                       ↓
       ┌───────────────┼───────────────┐
       ↓               ↓               ↓
 IMPLEMENTATION      REVIEW         TEST/AUDIT
   AI Agent          AI Agent         AI Agent
       └───────────────┼───────────────┘
                       ↓
                 HUMAN REVIEW
                       ↓
                 VERIFIED CODE
```

To jest **rekomendowany model dla FIRST CAUSE**.

Człowiek zachowuje kontrolę nad:
- koncepcją,
- kanonem,
- architekturą,
- granicami scope,
- priorytetami,
- kryteriami akceptacji,
- ostatecznym zatwierdzaniem zmian.

AI może przyspieszać:
- implementację,
- refactoring,
- generowanie testów,
- code review,
- wyszukiwanie niespójności,
- przygotowanie danych,
- dokumentację techniczną,
- lokalizację.

## Model C — AI jako content-scale multiplier

```text
HUMAN SYSTEM DESIGN
        ↓
DATA SCHEMAS + VALIDATORS
        ↓
AI-ASSISTED CONTENT PRODUCTION
        ↓
AUTOMATED VALIDATION
        ↓
HUMAN SAMPLING / REVIEW
        ↓
LARGE CONTENT CATALOG
```

Ten model jest szczególnie atrakcyjny dla FIRST CAUSE w przyszłości przy:
- nazwach,
- wariantach lokalizacyjnych,
- danych definicyjnych,
- opisach Chronicle,
- test fixtures,
- katalogach contentu,
- materiałach pomocniczych.

AI nie może jednak omijać schematów, validatorów ani zasad kanonicznych.

---

# 30. AI Development Principles dla FIRST CAUSE

## AI-DEV-001 — Human-owned architecture

AI nie jest właścicielem architektury FIRST CAUSE. Implementacja ma wynikać z zatwierdzonych dokumentów, kontraktów i decyzji kanonicznych.

## AI-DEV-002 — Specification before generation

Dla systemów symulacyjnych preferowana kolejność to:

`SPEC → CONTRACT → TEST/INVARIANT → IMPLEMENTATION → REVIEW → BENCHMARK`

Nie należy rozpoczynać dużego systemu od swobodnego polecenia „zaprojektuj i zaimplementuj”.

## AI-DEV-003 — Independent review

Jeżeli jest to praktyczne, agent/model implementujący nie powinien być jedynym agentem zatwierdzającym własne rozwiązanie.

Rekomendowany wzorzec:

`Agent A: implementation → Agent B: audit/review → tests → human acceptance`

## AI-DEV-004 — Determinism over cleverness

Kod wygenerowany przez AI nie może osłabiać deterministyczności, stable iteration order, kontrolowanego RNG, tick pipeline ani mutation contracts.

## AI-DEV-005 — Tests are the trust boundary

W projekcie o skali FIRST CAUSE nie można polegać na tym, że kod „wygląda poprawnie”. Granicą zaufania są testy, invariants, conservation audits, Golden Runs, determinism tests i performance gates.

## AI-DEV-006 — No invisible scope expansion

AI nie może samodzielnie dodawać nowych systemów, pól, abstrakcji lub zależności „na przyszłość”, jeżeli nie wynikają z aktualnego zakresu implementacji.

## AI-DEV-007 — Data generation requires validation

AI może pomagać tworzyć Definition Data tylko wtedy, gdy dane przechodzą:

`schema validation → semantic validation → cross-reference validation → simulation tests`

## AI-DEV-008 — Anti-AI visual identity

FIRST CAUSE nie powinien uzależniać swojej tożsamości wizualnej od masowo generowanych ilustracji o łatwo rozpoznawalnej estetyce generatywnej. Preferowane są: systemowy UI, Living Atlas, proceduralne kompozycje, spójne reguły typografii, layoutu i ikonografii.

## AI-DEV-009 — AI is production infrastructure, not product promise

Marketing FIRST CAUSE powinien koncentrować się na świecie, przyczynowości, emergentnej historii i eksperymentowaniu. Sam fakt używania AI podczas developmentu nie jest głównym USP gry.

## AI-DEV-010 — Human comprehension requirement

Żaden krytyczny system nie powinien zostać uznany za ukończony, jeżeli właściciel projektu nie potrafi określić:
- jego odpowiedzialności,
- inputów,
- outputów,
- invariantów,
- miejsca w tick pipeline,
- sposobu testowania,
- głównych failure modes.

---

# 31. Rekomendowany workflow AI dla FIRST CAUSE

Dla implementacji kolejnego modułu:

```text
1. READ CANON
      ↓
2. DEFINE SCOPE
      ↓
3. DEFINE CONTRACTS
      ↓
4. DEFINE TESTS / INVARIANTS
      ↓
5. IMPLEMENT
      ↓
6. INDEPENDENT AUDIT
      ↓
7. RUN TESTS
      ↓
8. DETERMINISM CHECK
      ↓
9. PERFORMANCE CHECK — gdy dotyczy
      ↓
10. HUMAN ACCEPTANCE
      ↓
11. COMMIT
```

Dla dużych zmian zalecany jest dodatkowy krok **Consistency Audit** względem dokumentacji kanonicznej przed mergem.

---

# 32. Ryzyka AI-assisted development

## 32.1 Scope inflation

Największym ryzykiem nie jest samo generowanie błędnego kodu, lecz fakt, że AI dramatycznie obniża koszt *rozpoczęcia* nowej funkcji. Może to prowadzić do dodawania systemów szybciej, niż projekt jest w stanie je ustabilizować.

**Mitigacja:** roadmapa i Vertical Slice pozostają nadrzędne wobec łatwości generowania kodu.

## 32.2 Local correctness / global inconsistency

Agent może stworzyć poprawnie wyglądający moduł, który narusza założenia innego systemu.

**Mitigacja:** kontrakty, Entity Data Model, kanoniczny tick pipeline, integration tests i Consistency Audit.

## 32.3 Hidden non-determinism

Typowe skróty implementacyjne mogą wprowadzać niekontrolowane RNG, zależność od kolejności iteracji lub mutation during iteration.

**Mitigacja:** determinism tests i zasady Save/Determinism/Performance Spec.

## 32.4 AI-generated technical debt

Szybkość generowania może prowadzić do duplikacji helperów, niepotrzebnych abstrakcji, martwego kodu i niespójnego nazewnictwa.

**Mitigacja:** okresowe architecture/code audits oraz zakaz implementowania „na zapas”.

## 32.5 AI visual stigma

Część odbiorców może negatywnie reagować na łatwo rozpoznawalne generatywne assety niezależnie od jakości symulacji.

**Mitigacja:** FIRST CAUSE powinien budować własny system wizualny i traktować generatywne assety — jeśli w ogóle będą używane — jako podporządkowane spójnej art direction.

---

# 33. Konsekwencje dla roadmapy

Benchmark AI **nie uzasadnia zwiększenia zakresu Vertical Slice**.

Przeciwnie: większa przepustowość implementacji powinna zostać wykorzystana przede wszystkim do:

1. szybszego zamykania istniejących kontraktów,
2. zwiększenia pokrycia testami,
3. automatycznych audytów deterministyczności i conservation,
4. profilowania,
5. refaktoryzacji po zakończonych etapach,
6. generowania kontrolowanych fixtures i test worlds,
7. utrzymywania dokumentacji zgodnej z implementacją.

AI nie zmienia kanonicznej kolejności:

`KANON → KONTRAKTY → FUNDAMENT SILNIKA → BLACK MOUNTAIN → EXPLAINABILITY → STABILIZACJA VS`

---

# 34. Dodatkowe decyzje benchmarkowe

## CB-011

**FIRST CAUSE przyjmuje model Human Architect + AI-assisted implementation jako preferowany model produkcyjny.**

## CB-012

**AI-assisted coding nie jest samodzielnym wyróżnikiem marketingowym gry.**

## CB-013

**Wielomodelowy review/audit jest preferowany dla zmian krytycznych dla symulacji, jeśli koszt procesu jest uzasadniony.**

## CB-014

**AI-generated Definition Data wymaga automatycznej walidacji przed wejściem do kanonicznego contentu.**

## CB-015

**Wzrost produktywności dzięki AI nie może automatycznie zwiększać scope Vertical Slice.**

## CB-016

**NODWAR, Deepclaim, Rifts of Cozmos i Geoplanetical zostają dodane do watchlisty produkcyjnej AI-assisted development. Meet Claude pozostaje benchmarkiem skrajnego modelu AI-first, a nie wzorcem dla architektury FIRST CAUSE.**

---

# 35. Wniosek AI benchmarku

Publiczne przykłady ze Steam potwierdzają, że w 2026 roku generatywne AI jest już wykorzystywane przez solo developerów zarówno do kodowania, jak i do skalowania produkcji assetów, lokalizacji i danych. Jednocześnie dostępne dane nie uzasadniają założenia, że samo szerokie użycie AI zapewnia jakość lub sukces komercyjny.

Dla FIRST CAUSE właściwą przewagą AI nie powinno być **„możemy wygenerować więcej funkcji”**, lecz:

> **jedna osoba może utrzymywać bardziej rygorystyczny pipeline specyfikacji, implementacji, testów, audytu i content production, niż byłoby to praktyczne bez narzędzi AI.**

Najważniejsza zasada pozostaje więc taka sama jak w samej symulacji FIRST CAUSE:

> **szybkość nie zastępuje przyczynowości, kontroli i możliwości wyjaśnienia, dlaczego system działa tak, jak działa.**
