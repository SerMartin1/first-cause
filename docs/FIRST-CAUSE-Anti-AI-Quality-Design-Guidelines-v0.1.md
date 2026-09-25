# FIRST CAUSE — Anti-AI Quality & Design Guidelines v0.1

**Status:** roboczy dokument projektowy / Quality Gate  
**Projekt:** FIRST CAUSE  
**Wersja:** 0.1  
**Rola:** ustanowienie zasad wykorzystania AI w produkcji FIRST CAUSE oraz zabezpieczenie gry przed generycznym „AI feel”, pozorną głębią systemów, niespójnym UI, niezweryfikowanym contentem i niekontrolowanym wzrostem scope.

## 0. Cel dokumentu

FIRST CAUSE może wykorzystywać AI jako narzędzie produkcyjne, ale AI nie może definiować tożsamości produktu.

Zasada nadrzędna:

> **AI może przyspieszać produkcję FIRST CAUSE, ale nie może zastępować intencji projektowej, obniżać integralności symulacji ani pozostawiać rozpoznawalnych artefaktów AI w finalnym produkcie.**

Kanoniczny workflow:

`HUMAN INTENT → SPECIFICATION → AI ASSISTANCE → VALIDATION → HUMAN ACCEPTANCE`

Zakazany workflow:

`PROMPT → FEATURE → SHIP`

---

# 1. Zakres

Dokument obejmuje:

1. Product Philosophy
2. Gameplay & Simulation Integrity
3. UI/UX
4. Writing & Chronicle
5. Visual Identity
6. AI-Assisted Coding
7. Content & Data Generation
8. Scope Control
9. QA / AI Smell Audit
10. Public Communication & Disclosure
11. Quality Gates
12. Reguły kanoniczne AA-001–AA-020

Dokument dotyczy zarówno pracy wykonywanej przez człowieka, jak i przez Codex, Claude Code lub inne narzędzia AI.

---

# 2. Anti-AI Product Philosophy

## 2.1 Human ownership

Człowiek pozostaje właścicielem:

- wizji produktu,
- core loop,
- game designu,
- decyzji architektonicznych,
- UX,
- kierunku wizualnego,
- scope,
- priorytetów,
- finalnej akceptacji.

AI może wspierać:

- implementację,
- refactoring,
- testy,
- debugging,
- analizę,
- generowanie danych według zatwierdzonych schematów,
- lokalizację,
- przygotowanie wariantów roboczych.

## 2.2 AI is leverage, not authorship

FIRST CAUSE nie jest projektowane jako „AI game”.

AI jest mnożnikiem zdolności produkcyjnych autora.

## 2.3 Intent before implementation

Żaden większy system nie powinien powstać tylko na podstawie pojedynczego prompta implementacyjnego.

Przed implementacją musi istnieć co najmniej:

`INTENT → SCOPE → CONTRACT → ACCEPTANCE CRITERIA`

Dla systemów krytycznych również:

`TEST PLAN`

---

# 3. Anti-AI Gameplay & Simulation Rules

## 3.1 No Decorative Simulation

UI nie może sugerować zależności, która nie istnieje w modelu.

Jeżeli gra pokazuje:

`Iron shortage → Tool price +23%`

musi istnieć rzeczywisty przepływ danych lub causal path uzasadniający zależność.

Zakazane:

- dekoracyjne statystyki,
- fałszywe zależności narracyjne,
- „symulowanie” przez losowe modyfikatory bez źródła,
- Chronicle wymyślający przyczynę po fakcie.

## 3.2 Systems must interact

Dodanie wielu osobnych systemów nie jest równoznaczne z głębią.

Preferowane:

`RESOURCE → PRODUCTION → INVENTORY → PRICE → CONSUMPTION → NEEDS → MIGRATION`

zamiast zestawu niezależnych paneli.

## 3.3 State before story

Najpierw zmienia się stan świata.

Następnie powstają:

`Simulation Facts → Causal Relations → Historical Significance → Chronicle`

Nigdy odwrotnie.

## 3.4 No hardcoded history

Historia nie może powstać dlatego, że scenariusz wymaga konkretnego wyniku, poza jawnie oznaczonymi scenariuszami testowymi.

## 3.5 Architect changes causes

Interwencja Architekta powinna zmieniać warunki wejściowe systemu, a nie wymuszać rezultat.

Preferowane:

`Reveal Iron Deposit`

zamiast:

`Create Mining City`

---

# 4. Causal Integrity

## 4.1 WHY?

WHY? musi wskazywać faktyczne przyczyny zapisane lub możliwe do jednoznacznego odtworzenia z modelu.

## 4.2 WHY NOT?

WHY NOT? musi identyfikować rzeczywiste blockery lub niespełnione warunki.

Przykład:

`Mine not founded`

może wskazać:

- profitability below threshold,
- transport cost,
- labor shortage,
- missing technology,
- insufficient capital.

Nie wolno generować wiarygodnie brzmiącego uzasadnienia bez podstawy w danych.

## 4.3 Butterfly Effect

Butterfly Effect może pokazywać tylko konsekwencje, dla których istnieje uzasadniona ścieżka wpływu.

## 4.4 Causal confidence

Jeżeli system nie może jednoznacznie ustalić przyczyny, UI powinien pokazać ograniczenie zamiast wymyślać pewną odpowiedź.

---

# 5. Anti-AI UI/UX

## 5.1 Cel

FIRST CAUSE nie może wyglądać jak generyczny dashboard SaaS wygenerowany z prompta.

## 5.2 Unikać jako domyślnego wzorca

- card-inside-card,
- nadmiaru rounded rectangles,
- wielkich hero-number cards,
- gradientów dekoracyjnych,
- emoji jako nawigacji,
- przypadkowych ikon,
- identycznego layoutu wszystkich ekranów,
- nadmiernej symetrii,
- zbędnych badge'y,
- dekoracyjnych wykresów bez decyzji lub znaczenia,
- komponentów dodanych tylko po to, aby „wypełnić ekran”.

Elementy te nie są zakazane absolutnie. Zakazane jest ich automatyczne, generyczne stosowanie.

## 5.3 Information hierarchy

Każdy ekran musi odpowiedzieć:

1. Co się dzieje?
2. Dlaczego to jest ważne?
3. Co się zmieniło?
4. Dlaczego?
5. Co mogę zbadać lub zrobić dalej?

## 5.4 FIRST CAUSE Recognition Test

> **Po usunięciu logo screenshot powinien nadal wyglądać jak FIRST CAUSE, a nie jak losowy dashboard strategiczny.**

## 5.5 Density

Gęstość informacji jest dopuszczalna, jeśli istnieje czytelna hierarchia.

Nie upraszczamy danych wyłącznie po to, aby ekran wyglądał „nowocześnie”.

## 5.6 Living Atlas

Atlas powinien być funkcjonalną reprezentacją stanu świata.

Nie może stać się dekoracyjną mapą służącą głównie do tworzenia atrakcyjnych screenshotów.

---

# 6. Anti-AI Writing

## 6.1 Writing style

Tekst powinien być:

- konkretny,
- informacyjny,
- osadzony w stanie świata,
- oszczędny,
- różnorodny tylko tam, gdzie różnorodność poprawia czytelność.

Unikać:

- napompowanego tonu,
- generycznych metafor,
- przesadnych przymiotników,
- sztucznego dramatyzowania każdego wydarzenia,
- powtarzalnych konstrukcji LLM,
- zdań, które nie przekazują informacji.

## 6.2 Chronicle

Preferowane:

> **Black Mountain entered a food crisis after three consecutive harvest failures.**

Nie:

> **A remarkable and devastating transformation swept across Black Mountain, forever reshaping the lives of its inhabitants.**

## 6.3 Facts are authoritative

AI może redagować sposób przedstawienia faktów.

AI nie może tworzyć nowych faktów świata.

## 6.4 Localization

AI-assisted localization jest dopuszczalna, ale:

- terminologia kanoniczna musi być zachowana,
- placeholdery i wartości dynamiczne muszą pozostać poprawne,
- kluczowe teksty UI i marketingowe wymagają review,
- nie wolno lokalizować nazw technicznych w sposób łamiący schematy danych.

---

# 7. Anti-AI Visual Identity

## 7.1 Procedural-first

Preferowane:

- proceduralne wizualizacje,
- data visualization,
- Living Atlas,
- systemowa typografia,
- własne komponenty,
- generowane z danych winiety regionów,
- ograniczona, spójna ikonografia.

## 7.2 AI imagery

Nie używamy obrazów tylko dlatego, że łatwo można je wygenerować.

AI imagery może służyć jako:

- moodboard,
- concept exploration,
- materiał tymczasowy,

jeżeli nie narusza innych zasad projektu.

Finalne assety muszą spełniać Visual Design System i wymogi platformy dotyczące disclosure.

## 7.3 Consistency over quantity

Mniejsza liczba charakterystycznych elementów wizualnych jest lepsza niż duża biblioteka niespójnych assetów.

---

# 8. AI-Assisted Coding Rules

## 8.1 Kanoniczny pipeline

`SPEC → CONTRACT → TEST → IMPLEMENT → REVIEW → TEST → BENCHMARK → ACCEPT`

## 8.2 AI nie może samodzielnie zmieniać kanonu

Jeżeli implementacja wymaga zmiany specyfikacji:

`STOP → REPORT CONFLICT → HUMAN DECISION`

Nie należy „naprawiać” dokumentacji pod wygenerowany kod.

## 8.3 Zakazane praktyki

AI nie powinno bez jawnej potrzeby:

- duplikować istniejących systemów,
- tworzyć równoległych modeli tego samego stanu,
- dodawać dependencies,
- dodawać niezatwierdzonych mechanik,
- tworzyć abstrakcji „na przyszłość”,
- obchodzić failing tests,
- usuwać walidacji, aby test przeszedł,
- hardcodować oczekiwanych wyników symulacji,
- ukrywać błędów fallbackami,
- tworzyć monolitycznych komponentów robiących wiele niezależnych rzeczy.

## 8.4 Determinism

AI-generated code musi respektować:

- seedowane RNG,
- stable iteration order,
- deterministyczne IDs,
- kontrolowany mutation order,
- deterministic tick pipeline,
- brak niekontrolowanego czasu systemowego w Simulation Logic.

## 8.5 Review separation

Preferowane:

`AI A → implementation`

`AI B / human → review`

AI, które stworzyło rozwiązanie, nie powinno być jedynym źródłem jego oceny.

## 8.6 Small diffs

Preferujemy małe, możliwe do audytu zmiany zamiast ogromnych automatycznych refactorów.

---

# 9. Content & Data Generation

## 9.1 Schema-first

AI może generować content dopiero po zdefiniowaniu schematu.

`SCHEMA → CONSTRAINTS → GENERATION → VALIDATION → REVIEW`

## 9.2 Validation

Dane generowane przez AI muszą przechodzić automatyczną walidację tam, gdzie jest to możliwe.

Przykłady:

- unique IDs,
- referential integrity,
- min/max,
- poprawne recipe inputs/outputs,
- wymagania technologiczne,
- lokalizacja,
- conservation constraints.

## 9.3 No silent invention

Jeżeli brakuje informacji potrzebnej do stworzenia rekordu, AI nie powinno arbitralnie ustanawiać nowego kanonu.

---

# 10. AI Scope Control

## 10.1 Fundamental rule

> **AI productivity must reduce development time, not automatically increase game scope.**

## 10.2 Feature Gate

Każda nowa funkcja odpowiada kolejno na pytania:

### A. Does it strengthen the core loop?

NIE → odrzucić.

TAK → dalej.

### B. Is it required for the current milestone?

NIE → backlog.

TAK → dalej.

### C. Is it specified?

NIE → specification first.

TAK → dalej.

### D. Can it be tested?

NIE → zdefiniować acceptance criteria/test.

TAK → implementacja.

## 10.3 AI opportunity is not design justification

Argument:

> „Codex może to zrobić szybko”

nie jest uzasadnieniem dodania mechaniki.

## 10.4 Vertical Slice protection

Vertical Slice nie zwiększa scope tylko dlatego, że implementacja przyspieszyła.

Nadwyżka produktywności powinna najpierw zostać wykorzystana na:

1. stabilność,
2. testy,
3. performance,
4. UX,
5. polish,
6. debugging.

Dopiero później na dodatkowy scope.

---

# 11. AI Smell Audit

Audyt jest wykonywany przed każdym ważnym publicznym milestone.

## 11.1 UI

- [ ] Czy screenshot bez logo jest rozpoznawalny jako FIRST CAUSE?
- [ ] Czy UI nie wygląda jak generyczny dashboard SaaS?
- [ ] Czy nie ma nadmiaru kart?
- [ ] Czy hierarchia informacji jest czytelna?
- [ ] Czy ikony i dekoracje mają funkcję?
- [ ] Czy wszystkie główne ekrany nie wyglądają identycznie?

## 11.2 Writing

- [ ] Czy tekst brzmi naturalnie?
- [ ] Czy unika generycznych sformułowań LLM?
- [ ] Czy Chronicle opisuje fakty?
- [ ] Czy dramatyzacja odpowiada znaczeniu wydarzenia?
- [ ] Czy terminologia jest spójna?

## 11.3 Simulation

- [ ] Czy systemy naprawdę wpływają na siebie?
- [ ] Czy kluczowe liczby mają źródło?
- [ ] Czy nie istnieją dekoracyjne statystyki?
- [ ] Czy WHY? pokazuje prawdziwe przyczyny?
- [ ] Czy WHY NOT? pokazuje prawdziwe blockery?
- [ ] Czy Butterfly Effect opiera się na causal data?
- [ ] Czy wynik nie został hardcodowany?

## 11.4 Code

- [ ] Czy nie powstał drugi model tego samego stanu?
- [ ] Czy kod respektuje determinism?
- [ ] Czy nie dodano niepotrzebnych dependencies?
- [ ] Czy testy nie zostały osłabione?
- [ ] Czy zmiana jest możliwa do audytu?
- [ ] Czy nie ma nieuzasadnionego future-proofingu?

## 11.5 Scope

- [ ] Czy każda nowa funkcja wspiera core loop?
- [ ] Czy należy do aktualnego milestone?
- [ ] Czy AI nie zwiększyło scope tylko dlatego, że mogło?
- [ ] Czy polish istniejących systemów nie został poświęcony dla nowych funkcji?

---

# 12. Quality Gate

Wynik audytu:

## PASS

Brak problemów blokujących.

Build może przejść do następnego etapu.

## PASS WITH ISSUES

Nie ma problemu krytycznego, ale istnieją elementy wymagające poprawy przed kolejnym publicznym milestone.

## FAIL

Występuje co najmniej jeden problem naruszający:

- simulation integrity,
- determinism,
- causal integrity,
- core UX,
- visual identity,
- content truthfulness,
- milestone scope.

Build nie powinien zostać publicznie wydany przed poprawą.

---

# 13. Milestones wymagające AI Smell Audit

Obowiązkowo przed:

1. pierwszym publicznym screenshotem reprezentującym finalny kierunek,
2. trailerem,
3. publicznym demo,
4. playtestem,
5. Steam Next Fest,
6. Early Access,
7. dużą aktualizacją EA,
8. wersją 1.0.

---

# 14. Public Communication & Disclosure

## 14.1 Product positioning

Nie pozycjonujemy FIRST CAUSE jako:

- AI game,
- AI-built simulator,
- game made by ChatGPT/Claude/Codex.

Marketing opisuje produkt i jego doświadczenie.

## 14.2 Recommended product identity

Przykładowy kierunek:

> **Create a cause. Watch history answer.**

AI jest metodą produkcji, nie core value proposition.

## 14.3 Disclosure

Wykorzystanie AI musi być ujawniane wszędzie tam, gdzie wymagają tego:

- platforma,
- licencja,
- prawo,
- zasady dystrybucji.

Disclosure musi być zgodne z rzeczywistym wykorzystaniem AI.

## 14.4 No deceptive claims

Nie wolno:

- sugerować braku AI, jeśli było używane i disclosure jest wymagane,
- przypisywać człowiekowi ręcznego wykonania assetu wygenerowanego przez AI,
- przedstawiać AI-generated research jako zweryfikowanego źródła.

---

# 15. Reguły kanoniczne

**AA-001 — Human Intent First**  
Każda istotna funkcja zaczyna się od ludzkiej intencji projektowej.

**AA-002 — No Prompt-to-Ship**  
Wygenerowana implementacja nie trafia bezpośrednio do publicznego buildu bez walidacji.

**AA-003 — No Decorative Simulation**  
Prezentowana zależność systemowa musi istnieć w modelu.

**AA-004 — State Before Story**  
Narracja wynika ze stanu świata.

**AA-005 — Causal Truth**  
WHY?, WHY NOT? i Butterfly Effect nie mogą wymyślać przyczyn.

**AA-006 — Human Canon Authority**  
AI nie ustanawia samodzielnie nowych decyzji kanonicznych.

**AA-007 — FIRST CAUSE Visual Identity**  
Finalne UI musi posiadać własny, rozpoznawalny język wizualny.

**AA-008 — No Generic AI Dashboard**  
Generyczne wzorce dashboardowe nie są domyślnym językiem UI.

**AA-009 — Concrete Writing**  
Tekst gry preferuje konkret, fakt i znaczenie nad generowanym dramatyzmem.

**AA-010 — Schema Before Content**  
Masowy content AI powstaje wyłącznie według zatwierdzonych schematów.

**AA-011 — Validate Generated Data**  
Content i dane generowane automatycznie podlegają walidacji.

**AA-012 — Determinism Is Non-Negotiable**  
AI-generated code nie może osłabiać deterministyczności symulacji.

**AA-013 — Tests Cannot Be Weakened to Fit Code**  
Naprawiamy implementację, nie test tylko dlatego, że wygenerowany kod go nie przechodzi.

**AA-014 — Review Separation**  
Preferowane jest niezależne review kodu wygenerowanego przez AI.

**AA-015 — Small Auditable Changes**  
Preferowane są małe, kontrolowane zmiany.

**AA-016 — AI Productivity ≠ Scope Growth**  
Wzrost produktywności nie oznacza automatycznego zwiększenia zakresu.

**AA-017 — Polish Before Expansion**  
Nadwyżka czasu w pierwszej kolejności poprawia istniejący produkt.

**AA-018 — AI Smell Audit Required**  
Każdy ważny publiczny milestone przechodzi Anti-AI Quality Gate.

**AA-019 — Honest Disclosure**  
Publiczne informacje o wykorzystaniu AI muszą być prawdziwe i zgodne z wymaganiami platform.

**AA-020 — Sell the Game, Not the Toolchain**  
FIRST CAUSE jest komunikowane przez gameplay i tożsamość produktu, nie przez fakt używania AI.

---

# 16. Definition of Done — Anti-AI

Funkcja wspierana przez AI jest uznana za ukończoną dopiero wtedy, gdy:

1. odpowiada zatwierdzonej specyfikacji,
2. przechodzi acceptance criteria,
3. nie łamie determinism,
4. nie tworzy dekoracyjnej symulacji,
5. integruje się z istniejącymi systemami,
6. UI spełnia hierarchię i Visual Design System,
7. tekst jest oparty na faktach świata,
8. testy przechodzą bez osłabiania ich wymagań,
9. zmiana przeszła review,
10. nie zwiększyła niejawnie scope projektu.

---

# 17. Zalecany fragment do promptów implementacyjnych

Do promptów dla Codex / Claude Code można dodawać:

> **ANTI-AI QUALITY CONTRACT:** Implementacja musi być zgodna z `FIRST-CAUSE-Anti-AI-Quality-Design-Guidelines-v0.1.md`. Nie dodawaj niezatwierdzonych funkcji, nie zmieniaj kanonu, nie twórz dekoracyjnej symulacji, nie osłabiaj testów, zachowaj deterministyczność i istniejący język UI. Jeżeli specyfikacja jest niewystarczająca lub sprzeczna, zatrzymaj implementację w tym miejscu i zgłoś konflikt zamiast samodzielnie ustanawiać nową decyzję projektową.

---

# 18. Zasada końcowa

> **FIRST CAUSE powinno wyglądać, działać i brzmieć jak celowo zaprojektowana gra jednej spójnej wizji — niezależnie od tego, ile pracy implementacyjnej zostało przyspieszone przez AI.**
