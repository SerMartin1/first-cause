# World Context Scope + Living Atlas — raport 2026-09-25

Sesja rozpoczęta 2026-09-25, raport domknięty 2026-09-26.

> **Adnotacja statusu (2026-09-26, dokument historyczny):** niezależny
> audyt `FIRST-CAUSE-World-Atlas-Independent-Audit-2026-09-26.md`
> potwierdził PASS dla Context Scope (`M21-VIS-03A`), ale nie potwierdził
> części wizualnej: `M21-VIS-01` i `M21-VIS-02` = FAIL (reopened),
> `M21-VIS-03` = PARTIAL. Twierdzenie „cztery etapy różnią się strukturą
> osady” oraz „funkcjonalny stress test przechodzi” nie obowiązuje jako
> status odbioru. Aktualne statusy: Roadmap v0.6, sekcja „M21 Visual
> Track update --- 2026-09-26”. Treść raportu poniżej pozostaje bez
> zmian jako zapis historyczny.

## AUDIT SUMMARY

Audyt poprzedził implementację. Sprawdzono strukturę monorepo, pakiety,
kontrakty World State/Read Models, renderer React/PixiJS, worker i preload IPC,
Causality/Chronicle, lokalizację, dotychczasowy audyt World oraz testy.
Szczegółowy przegląd kodu dotyczył ścieżek wymaganych przez prompt; nie jest to
deklaracja przeglądu linia po linii wszystkich systemów ekonomicznych.
Początkowy working tree był czysty.

Źródła: Canonical Decisions v0.1; Roadmap v0.5 (M21 i M21-VIS-03A);
Golden UI World Command Center v1.2 §25; UI Implementation Spec v1.3;
UI Visual Design System v1.3; Living Atlas Visual Asset Spec v1.2.
Obejrzano również Raw Simulation Atlas v0.1, Visual Alphabet v1.1 oraz
Golden UI 01 World v1.0 PNG znajdujące się w repozytorium.

| Obszar | Istniało przed zmianą | Wynik audytu / wykorzystanie |
| --- | --- | --- |
| UI-03 | WorldScreen, shell FC*, inspektor, timeline, ranking, WHY? | Rozszerzono istniejący ekran |
| UI-04 | FCLivingAtlas/PixiJS, tryby, overlaye, flow lens, wybór/focus, budżet etykiet | Jeden renderer; dodano mapowanie alfabetu |
| Read Models | WorldSnapshot, WorldViewHistory, RegionVisualProfile, regiony/osady/zasoby/technologia | Rozszerzono projekcję i istniejącą historię |
| Causality | Fakty, krawędzie, explainWhy, aktualne i historyczne WHY? | Bez nowego silnika przyczynowości |
| Chronicle | Istotne wydarzenia z identyfikatorami faktów i regionów | Zachowano lokalizację wydarzenia i handoff |
| Prognozy World/Region | Brak dostawcy projekcji dla tego ekranu | Jawne UNAVAILABLE; zaobserwowanych skutków nie nazwano prognozami |
| M21-VIS | Dotychczasowy audyt pozostawiał otwartą akceptację wizualną | Dodano izolowany fixture czterech stanów i test ekranowy |
| Geografia | Graf regionów; brak polygonów/rzek/współrzędnych geograficznych | Zachowano jawnie opisany diagram połączeń |

## IMPLEMENTATION PLAN

Wykonane kroki:

1. Oddzielić `analysisScope` od `selectedEntityId` w istniejącym store UI.
2. Udostępnić zapisane przyczyny przez WorldSnapshot i deterministyczny selector.
3. Dodać wspólny przełącznik oraz trzy moduły dolnego paska w EN/PL.
4. Przekazać kontekst elementu przez istniejące WHY API/preload/worker.
5. Rozszerzyć aktualny renderer o symbole profilu i struktury osad.
6. Przetestować zachowanie zakresu, historię, brak mutacji, renderowanie i screenshoty.

## FILES CHANGED

Ścieżki względem katalogu repozytorium:

| Pliki | Zmiana |
| --- | --- |
| `packages/simulation/src/read-models/world-view-read-model.ts` | DTO przyczyn, selector zakresu/czasu, metadane WHY |
| `apps/desktop/electron/main/world-session.ts` | Przekazanie kontekstu do istniejącego explainWhy |
| `apps/desktop/electron/preload/index.ts` | Kontekst w typed IPC |
| `apps/desktop/src/features/world/world-store.ts` | Oddzielny WORLD/REGION i reguła resetu |
| `apps/desktop/src/features/world/WorldScreen.tsx` | Wspólny scope, trzy moduły, akcje, handoff, odrzucanie spóźnionych odpowiedzi |
| `apps/desktop/src/features/world/world.css` | Zwarty pasek z separatorami, kontrolka scope, układ przy 1920/1280 px |
| `apps/desktop/src/features/world/FCLivingAtlas.tsx` | Alfabet osad i profilu, ostrość etykiet przy zoomie, zgodna legenda i znacznik ukończenia renderu |
| `apps/desktop/src/features/world/visual-alphabet.ts` | Proste, deterministyczne symbole bloków, przemysłu, transportu i reliefu |
| `apps/desktop/src/features/world/visual-stress-fixture.ts` | Jawny fixture zgodny z produkcyjnymi typami; nie importowany przez aplikację |
| `apps/desktop/visual-tests/index.html`, `main.tsx` | Osobny ekran testowy renderera, poza production entrypoint |
| `apps/desktop/src/features/world/WorldScreen.test.tsx` | Testy scope, dostępności akcji, WHY, braku danych, powrotu do World, spóźnionej odpowiedzi i trybów |
| `apps/desktop/electron/main/world-session.test.ts` | Pochodzenie z krawędzi, historyczna powtarzalność i brak zmian World State |
| `tests/e2e/app.spec.ts` | Scope i screenshoty w rzeczywistej aplikacji |
| `tests/e2e/atlas-stress.spec.ts` | Cztery etapy i osiem trybów na produkcyjnym rendererze |
| `locales/en/common.json`, `locales/pl/common.json` | Etykiety i uczciwy komunikat braku prognoz |
| `CHANGELOG.md` | Wpis zmian i wyników weryfikacji |
| Ten raport i `verification/world-context-2026-09-25/` | Raport oraz zachowane screenshoty |

## DATA FLOW

```text
WorldRunner / WorldState + SimulationFacts + CausalEdges
  → buildWorldSnapshot (worker)
  → WorldViewHistory (istniejące snapshoty miesięczne)
  → WorldView przez istniejące IPC
  → selectWorldAnalysis(snapshot, scope, comparisonWindow)
  → Causes + Consequences availability w React

wybrany element + scope + tick
  → WorldApi.explain → preload → WorldSession → buildWorldWhyView
  → istniejący explainWhy → WorldWhyView z zachowanym kontekstem

WorldState → RegionVisualProfile + settlement Read Models
  → visual-alphabet → istniejący FCLivingAtlas/PixiJS
```

`causalDrivers` zawiera identyfikatory krawędzi, faktu źródłowego i skutku,
region źródła i skutku, tick skutku oraz zapisaną siłę i signed contribution.
Wymagane są oba istniejące fakty sprzed granicy snapshotu. Projekcja ogranicza
materiał do ostatnich 600 miesięcy, zgodnie z najdłuższym istniejącym oknem UI.
Selector filtruje po okresie i regionie skutku, sortuje według siły, czasu,
a następnie stabilnego ID, i wybiera maksymalnie pięć pozycji.
Siła oznacza wkład wyjaśniający, nie prawdopodobieństwo prognozy ani nową
miarę znaczenia historycznego. Zewnętrzna przyczyna może pozostać w regionalnej
analizie, jeżeli zapisany skutek dotyczy tego regionu.

Scope/overlay/zoom to stan prezentacji. Nie trafiają do komend mutujących
World State, RNG ani zapisu gry. Historia pozostaje sesyjna, jak przed zmianą.

## CONTEXT SCOPE

| Interakcja | Zachowanie |
| --- | --- |
| Wejście do World | WORLD, również po ponownym zamontowaniu ekranu |
| Wybór regionu w WORLD | Inspektor się zmienia; analiza pozostaje WORLD |
| Jawne kliknięcie regionu w przełączniku | REGION(regionId), oba moduły razem |
| Brak wybranego regionu | Regionalny przycisk disabled |
| Zmiana/wyczyszczenie wyboru | Powrót do WORLD; przyjęta reguła z addendum v1.3 |
| Wybrany region znika z aktualnego snapshotu | Powrót do WORLD |
| Zmiana map mode/overlay | Nie zmienia scope |
| Zmiana czasu | Podsumowanie liczone z tego samego historycznego snapshotu |
| Brak przyczyn | Istniejący jawny empty state |
| Brak prognoz | Jawny komunikat w obu zakresach; bez sfabrykowanych pozycji |

Quick Actions mają jeden zestaw wynikający z aktualnego wyboru: widok świata,
focus na mapie, rozwinięcie istniejących szczegółów regionu i WHY? dla ostatniej
wyjaśnialnej zmiany. Akcje regionalne są disabled bez regionu; WHY? jest
disabled bez `latestExplainedChange`. „Śledź”, priorytety i notatki nie mają
działającego systemu w tym ekranie, więc nie dodano pozornych przycisków.
Szczegóły rozwijają istniejący inspektor; pełny Region Dossier pozostaje osobnym
zadaniem M21.

WHY otrzymuje `scope`, `itemKind`, `itemId`, opcjonalny `regionId`, `factId`
i tick. Dla przyczyny `itemId` jest ID wybranej krawędzi, a `factId` wskazuje
wyjaśniany skutek. Wydarzenia przekazują ID Chronicle, akcja regionalna ID regionu.
Odpowiedzi dla nieaktualnego zakresu/cursora nie nadpisują aktualnego widoku.
Konsekwencje istniejącego WHY pozostają zaobserwowanymi faktami.

## ATLAS STRESS TEST

Fixture jest stale oznaczony **VISUAL DEVELOPMENT DATA**, ma produkcyjne typy
Read Models i używa tego samego FCLivingAtlas. Nie zmienia świata gracza,
nie jest wynikiem 200-letniej symulacji i nie jest prognozą rozwoju regionu.

| Etap | Populacja osady | Struktura | Przemysł | Transport |
| --- | ---: | --- | --- | --- |
| EARLY | 350 | Hamlet / 1 blok | Brak | Trail |
| DEVELOPING | 12 000 | Town / 9 bloków | Workshop | Road |
| INDUSTRIAL | 120 000 | City / 16 bloków | Factory | Railway |
| MODERN | 1 200 000 | Metropolis / 25 bloków | Industrial complex | Highway |

Stałe pozostają ID regionu/osady, teren mountains, vegetation i pozycja
w diagramie. Zmieniają się tylko jawne pola fixture. „MODERN” jest etykietą
testu kontraktu wizualnego, nie aktywacją nowej ery/mechaniki gry.

Wykonano renderowanie Population, Economy, Resources, Trade, Technology,
Development, Stability i Δ Change. Trade na jedno-regionowym fixture ma zero
przepływu; to poprawny stan pusty. Rzeczywiste przepływy i wieloregionowy focus
sprawdza dodatkowo istniejący test aplikacji na Black Mountain. Political
pozostaje niedostępny. W Population marker zachowuje kołowe kodowanie populacji;
w pozostałych trybach rozmiar i liczba bloków reprezentują osadę. Symbol profilu
jest ograniczony do wyboru/zbliżenia, żeby nie zaśmiecał widoku świata.

Wynik: funkcjonalny stress test dostępnego kontraktu przechodzi. Pełnego
geograficznego M21-VIS-01 ani skali 250–3000 regionów nie uznano za zaliczone.
Nie wykonano certyfikacji FPS/pamięci — brak podstaw do deklaracji takich wyników.

## TEST RESULTS

Na Windows użyto `pnpm.cmd`:

| Polecenie | Wynik rzeczywisty |
| --- | --- |
| `pnpm typecheck` | PASS; po ostatniej zmianie tekstur etykiet także PASS `pnpm --filter @first-cause/desktop typecheck` |
| `pnpm lint` | PASS, 0 errors; 1 wcześniejsze ostrzeżenie `no-explicit-any` w `packages/content/src/schema/reference-field.ts:11` |
| `pnpm test` | PASS, 129 plików / 905 testów |
| Końcowa regresja WorldScreen + WorldSession | PASS, 13 testów, w tym jawne przełączenie overlayu bez komend symulacji |
| `pnpm build` | PASS; ponownie wykonywany i zaliczony przez końcowe test:e2e |
| `pnpm test:e2e` | PASS, 3 testy; końcowy przebieg 18,2 s |
| `git diff --check` | PASS |

Pokrycie promptu: wybór regionu ≠ zmiana scope; wspólny WORLD/REGION;
disabled bez wyboru; Quick Actions; WHY handoff i stale-response guard;
empty states; identyczne podsumowanie po powrocie do historycznego ticka;
niezależność od kolejności krawędzi; brak mutacji danych przez selektory;
niezmieniony wynik odczytu realnego workera po przełączaniu scope;
tryby/overlaye jako UI state; EN/PL oraz brak poziomego overflow dokumentu
przy 1280 px.

Początkowe uruchomienia typecheck/test/build wewnątrz sandboxa kończyły się
`spawn EPERM`; właściwe przebiegi wykonano po eskalacji. Pierwszy pełny test
ujawnił błędną wielkość liter w nowym selektorze testowym (903 PASS, 1 FAIL),
a pierwszy stress E2E nie znajdował dokładnej etykiety Stage (2 PASS, 1 FAIL).
Obie usterki poprawiono i ponowiono odpowiednie zestawy. Nie traktowano tych
nieudanych uruchomień jako PASS.

## SCREENSHOTS

Zachowano **24 screenshoty, ok. 2,2 MB**, w
`docs/verification/world-context-2026-09-25/`. E2E wykonuje je przy viewport
1920×1080 (World używa fullPage); dodatkowo EN/PL sprawdzono przy 1280×800.
Test renderera czeka na commit sceny i dwa browser animation frames przed
zapisem, żeby bitmapa reprezentowała już wybrany etap/tryb.

Najważniejsze materiały:

- [WORLD przy wybranym regionie](verification/world-context-2026-09-25/context-world-selected.png)
- [Jawny REGION](verification/world-context-2026-09-25/context-region.png)
- [Pusty świat / disabled](verification/world-context-2026-09-25/world-initial.png)
- [WHY i mapa](verification/world-context-2026-09-25/world-causal-step.png)
- [Historia](verification/world-context-2026-09-25/world-historical.png)
- [PL / 1280 px](verification/world-context-2026-09-25/world-pl-1280.png)
- [EARLY](verification/world-context-2026-09-25/atlas-EARLY.png),
  [DEVELOPING](verification/world-context-2026-09-25/atlas-DEVELOPING.png),
  [INDUSTRIAL](verification/world-context-2026-09-25/atlas-INDUSTRIAL.png),
  [MODERN](verification/world-context-2026-09-25/atlas-MODERN.png)
- [Population](verification/world-context-2026-09-25/atlas-mode-population.png),
  [Economy](verification/world-context-2026-09-25/atlas-mode-economy.png),
  [Resources](verification/world-context-2026-09-25/atlas-mode-resources.png),
  [Trade](verification/world-context-2026-09-25/atlas-mode-trade.png),
  [Technology](verification/world-context-2026-09-25/atlas-mode-technology.png),
  [Development](verification/world-context-2026-09-25/atlas-mode-development.png),
  [Stability](verification/world-context-2026-09-25/atlas-mode-stability.png),
  [Δ Change](verification/world-context-2026-09-25/atlas-mode-change.png)

Przegląd wizualny: dolny scope jest jawny, wspólny i płaski; akcje są zwarte;
brak gradientów, połysku i dekoracyjnego terenu. Atlas pozostaje największą
powierzchnią graficzną. Cztery etapy różnią się strukturą osady, symbolem
przemysłu i transportem. Po przeglądzie poprawiono wysokość paska, rasteryzację
tekstu przy zoomie i synchronizację screenshotów z klatką renderera.
Panele boczne/historyczne przewijają się wewnętrznie. Są to dowody implementacji
diagramu i spike'u, nie akceptacja pełnej mapy geograficznej ani dużej gęstości.

## CONFLICTS

1. AGENTS.md odwołuje się do Roadmap v0.2, której nie ma w repozytorium.
   Zgodnie z poleceniem użytkownika i hierarchią dokumentów użyto v0.5,
   która wskazuje M21 jako bieżący etap. Stary opis statusu w Canonical
   Decisions sam odsyła do aktualnej roadmapy jako właściciela statusu.
2. Roadmap v0.5 i starsze rozdziały specyfikacji zawierają odwołania do
   Golden World v1.1 i wcześniejszego dolnego paska. Nowszy §25 Golden v1.2
   oraz addenda v1.3 definiują scope i trzy moduły; te zapisy wdrożono.
3. PNG Golden zawiera ilustracyjną geografię, natomiast nowszy kanon
   Raw Atlas/Visual Alphabet nakazuje surowe symbole. PNG służył do oceny
   kompozycji, nie został użyty jako tło ani źródło fikcyjnej geografii.
4. Dotychczasowe `WorldWhyView.consequences` to fakty potomne, a nowy pasek
   oczekuje projekcji. Zachowano rozdział tych znaczeń.

## DEFERRED

- Dostawca światowych/regionalnych prognoz z horyzontem, przedziałem i confidence.
- Geometria terenu/rzek/granic, pełny alfabet branż/wydobycia i duże skale mapy.
- Political, stolicowanie, energia i sparowane przepływy migracyjne bez danych.
- Trwała historia atlasu w save, pełny Region Dossier i pozostałe ekrany M21.
- Niezależny audyt Claude Code i human acceptance wymagane przez M21-VIS-04;
  ta sesja ich nie zastępuje i nie zamraża kierunku wizualnego.

## FINAL STATUS

**PASS — Context Scope, handoff WHY i funkcjonalny stress test dostępnych danych.**
Context Scope i rozszerzenie istniejącego atlasu zostały zaimplementowane;
wszystkie wymagane komendy weryfikacji zakończyły się powodzeniem.
Brak prognoz jest obsłużony zgodnie z promptem przez jawny empty state.
Pełny milestone M21 i pełna zgodność geograficznego Golden Atlas pozostają
otwarte; raport nie nadaje im statusu DONE.
