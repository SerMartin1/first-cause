# FIRST CAUSE — Niezależny audyt World Screen + Living Atlas (2026-09-26)

**Status:** zapis audytu `M21-VIS-04` (Claude Code, bez zmian w kodzie).
Źródło prawdy o stanie implementacji World/Atlas dla Roadmap v0.6.
Stan audytowany: working tree po zadaniu World Context Scope (na `main`
po `fecf662`), screenshoty `docs/verification/world-context-2026-09-25/`.

**Wynik:** Context Scope (`M21-VIS-03A`) — PASS. Living Atlas —
`M21-VIS-01` FAIL, `M21-VIS-02` FAIL. World Screen — `M21-VIS-03` PARTIAL.
Status „PASS” części wizualnej w raporcie Scope z 2026-09-25 nie jest
potwierdzony.

Przeczytane: Golden UI World v1.2 (§5–25), Living Atlas Visual Asset
Spec v1.2, UI Implementation Spec v1.3, UI Visual Design System v1.3,
Anti-AI Guidelines v0.1, Roadmap v0.5 (M21-VIS), raport Scope
2026-09-25, referencje PNG (Golden 01 World, Visual Alphabet v1.1, Raw
Simulation Atlas v0.1). Numery wersji i sekcji podane wg stanu z dnia
audytu; kolejne wersje dokumentów: Golden v1.3, Atlas Spec v1.3, UI
Impl v1.4, Design System v1.4, Roadmap v0.6.

## BLOCKER

**B1. Rozwój regionu to skala markera i liczba bloków, nie zmiana struktury.**
Atlas Spec §2.5, §6.3, §18, §22, VIS-03, VIS-10, §27.6; Visual Alphabet §1, §2, §5, §6.
- `apps/desktop/src/features/world/visual-alphabet.ts:5-28` — osada to
  regularna siatka N×N; 14 klas Alphabetu zredukowano do 8 liczebności.
- `apps/desktop/src/features/world/atlas-model.ts:30-48` — `populationRadius`
  osiąga `maxRadius=36` przy ~100 000 mieszkańców.
- `visual-alphabet.ts:36-73` — przemysł to jeden glif; transport to
  kreska pod markerem.
- `packages/simulation/src/read-models/region-visual-profile-read-model.ts:48,149`
  — `industry` jednowartościowe („pierwszy pasujący sektor”); wydobycie
  i przemysł wzajemnie się wykluczają.
- Dowód: `atlas-INDUSTRIAL.png` i `atlas-MODERN.png` mają ten sam rozmiar
  osady (120 tys. vs 1,2 mln); wydobycie (fixture: rosnące
  `extractionRate`) niewidoczne; bloki wychodzą poza pierścień selekcji.

**B2. Map Modes wizualnie nierozróżnialne.** Atlas Spec §14, §27.2, §27.6; Roadmap M21-VIS-02.
- `FCLivingAtlas.tsx:195-207` — Economy/Resources/Technology/Development
  w jednym kolorze `--fc-info`; intensywność normalizowana do maksimum;
  0 i `undefined` wyglądają tak samo.
- Dowód: `atlas-mode-economy.png` ma identyczny MD5 jak `atlas-MODERN.png`;
  pozostałe tryby różnią się liczbą w etykiecie.

## HIGH

| # | Problem | Miejsce | Dowód |
| --- | --- | --- | --- |
| H1 | Atlas nie dominuje; płótno ~260 px wysokości przy 1080 p; diagram bez auto-fit | `world.css:5,177`; `atlas-model.ts:120-137` | `context-world-selected.png`: diagram ~400×180 px, legenda ~290×110 px |
| H2 | Warstwa cywilizacji niewidoczna w prawdziwym świecie (symbole tylko przy selekcji / zoom ≥ 1.6) | `FCLivingAtlas.tsx:238` | `world-initial.png`: identyczne kropki |
| H3 | Legenda stała 1k/10k/100k, niezgodna z danymi i trybem; brak legendy symboli | `FCLivingAtlas.tsx:372-387` | `world-pl-1280.png`: legenda zasłania etykietę |
| H4 | Key Causes pokazują przyczynę bez skutku | `world-view-read-model.ts:257`; `WorldScreen.tsx:668-673` | „Population declined · Green Valley” |
| H5 | Cztery „WHY?” z różnymi celami; nagłówek WHY „WORLD” przy elemencie regionalnym | `WorldScreen.tsx:556-567, 604, 659-666, 699-712, 764-776` | `world-causal-step.png` |
| H6 | Kompozycja niezgodna z Golden (brak railu, World Pulse); konflikt §12/VIS-03 vs §25 | `WorldScreen.tsx` | wszystkie screenshoty World |
| H7 | 1280×800 niezweryfikowane (`fullPage` 1263×1036); nakładanie legendy, ucięte listy | `world.css` media query | `world-pl-1280.png` |

## MEDIUM / LOW

| # | Waga | Problem |
| --- | --- | --- |
| M1 | MEDIUM | Screenshoty WORLD vs REGION nie dowodzą filtrowania (jedna przyczyna w świecie) |
| M2 | MEDIUM | Population mode zmienia gramatykę symbolu (bloki → koło) |
| M3 | MEDIUM | Wartości na mapie bez jednostek |
| M4 | MEDIUM | Stability = housing pressure bez kierunku skali |
| M5 | MEDIUM | Generyczne znaki wydarzeń i zasobów (poza Visual Alphabet §4, §9) |
| M6 | MEDIUM | Połączenia jednolite, niezależnie od infrastruktury |
| M7 | MEDIUM | Possible Consequences zajmuje ⅓ pasa statycznym tekstem |
| M8 | MEDIUM | Niejednoznaczne Quick Actions |
| M9 | MEDIUM | Winieta w inspektorze niesie mało informacji |
| M10 | MEDIUM | Zagnieżdżone obszary przewijania |
| M11 | MEDIUM | Panel Atlasu jako stos formularzy (Anti-AI §5.4) |
| M12 | MEDIUM | WHY pokazuje listę zamiast łańcucha |
| L1–L6 | LOW | pluralizacja/interpunkcja i18n; format daty „2 / 1”; niespójny format czasu; ranking zer; caption Economy; tryby testowane tylko w stanie MODERN |

## Co działa poprawnie

Rozdział `selectedEntityId` / `analysisScope`; domyślny WORLD i reset;
regionalny scope disabled bez regionu; wspólne przełączanie Causes /
Consequences; guard nieaktualnych odpowiedzi WHY; brak mutacji stanu;
deterministyczne sortowanie; uczciwy komunikat UNAVAILABLE; płaski
przełącznik scope; brak gradientów, glow i ilustracji.

## Werdykty

- **World Screen:** PARTIAL — funkcjonalnie poprawny, komunikacyjnie słaby; Atlas wizualnie podrzędny.
- **Living Atlas:** FAIL dla `M21-VIS-01/02`.
- **Anti-AI:** PASS w zakresie dekoracji; dryf w stronę panelu administracyjnego (Recognition Test).

Kontynuacja: Roadmap v0.6, `M21-VIS-R1`...`R6`. Pełna wersja robocza
audytu była udostępniona właścicielowi jako dokument Claude Docs
„Audyt World Screen + Living Atlas 2026-09-26”.
