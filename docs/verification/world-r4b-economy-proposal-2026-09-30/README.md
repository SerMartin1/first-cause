# M21-VIS-R4B Economy — propozycja do oceny (2026-09-30)

**Status: PROPOZYCJA / PROTOTYP — nie wdrożenie.** Economy NIE jest DONE ani
HUMAN VISUAL ACCEPTED. Kod produkcyjny w `main` bez zmian; prototyp żyje
wyłącznie w łatce `economy-prototype.patch` (baza: `57e5533`).

## Zawartość

| Plik | Co pokazuje |
|---|---|
| `before-economy-1280x800-pl.png` | Stan obecny (HEAD): liczba = suma ilości różnych towarów, bez jednostki; legenda nie opisuje trybu; 0 wygląda jak brak danych. |
| `econ-A-{none,selected}-{1920x1080,1280x800}-{pl,en}.png` | **Wariant A (rekomendowany)** — Zatrudnieni w przedsiębiorstwach. |
| `econ-A-selected-*-ranking.png` | Ten sam stan z rozwiniętym „Porównanie regionów”. |
| `econ-B-{none,selected}-{1920x1080,1280x800}-pl.png` | Wariant B — Sprzedaż firm / miesiąc (materiał porównawczy, PL). |
| `econ-A-selected-zero-1280x800-pl.png` | Zaznaczony region ze znanym 0 (brak firm). |
| `econ-B-selected-nodata-1280x800-pl.png` | Zaznaczony region bez danych (poza modelem rynku). |
| `econ-A-zoom-out-1280x800-pl.png`, `econ-A-zoom-in-selected-1920x1080-pl.png` | Zachowanie przy zoomie. |
| `econ-{A,B}-low-economy-1280x800-pl.png` | Rząd wielkości zmierzony w realnym świecie Black Mountain: region pierwszy w rankingu ma jasny, mały kwadrat (klasy absolutne). |

Dane na zrzutach: **VISUAL DEVELOPMENT DATA** (`visual-economy-fixture.ts` w
łatce) — wyłącznie pola, które symulacja już zapisuje (`workforce.employees`,
`production.outputLastTick`, `productionMethodId`, `finance.revenue`,
`Market.goods.localPrice`); widok liczy produkcyjny `buildWorldSnapshot`.

## Jak obejrzeć prototyp

```sh
git worktree add --detach ../fc-econ-proto 57e5533
cd ../fc-econ-proto && git apply <ścieżka>/economy-prototype.patch
pnpm install && pnpm dev
# harness: /visual-tests/world.html?fixture=economy&mode=economy&econ=employment|sales&lang=pl&select=econ_b_delta
```

Usunięcie: `git worktree remove ../fc-econ-proto`. Pełna diagnoza, warianty i
decyzje do podjęcia: raport sesji 2026-09-30.
