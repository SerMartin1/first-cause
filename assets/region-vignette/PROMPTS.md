# Region Vignette — prompty do generatora obrazów AI

Zgodnie z `docs/FIRST-CAUSE-UI-Visual-Design-System-v1.0.md` §18.7/§18.8
(zaktualizowane 2026-09-20): moduły tej biblioteki mogą powstać przy
pomocy generatora obrazów AI (np. ChatGPT), ale **każdy plik musisz
jawnie zatwierdzić** przed wrzuceniem go do folderu docelowego —
niezaakceptowany plik nie jest częścią biblioteki.

Docelowa struktura (SS18.8):

```
assets/region-vignette/
  terrain/
  vegetation/
  settlements/
  transport/
  industry/
  landmarks/
```

`infrastructure/` pominięte celowo — ta warstwa w silniku dziś zawsze
zwraca `null` (brak danych z symulacji), więc asset by się nie wyświetlił.

## Jak używać tego pliku

1. Skopiuj CAŁY prompt (jeden blok w ``` poniżej) dla danego assetu i
   wklej do ChatGPT (lub innego generatora obrazów).
2. Obejrzyj wynik. Jeśli pasuje stylistycznie do reszty (patrz "Style
   brief" niżej) — zapisz, przytnij tło jeśli trzeba, zapisz do
   właściwego podfolderu pod nazwą podaną w nagłówku sekcji.
3. Jeśli NIE pasuje (inna perspektywa, inny grubość linii, inny nastrój)
   — popraw prompt albo wygeneruj ponownie. Spójność między plikami z
   osobnych sesji to Twoja odpowiedzialność jako zatwierdzającego
   (SS18.7).
4. Format docelowy: SVG jeśli generator/edytor na to pozwala (skaluje
   się bez utraty jakości, małe pliki). Jeśli generator daje tylko
   PNG/JPG — zapisz jako PNG z przezroczystym tłem.
5. Wymiary: winiety renderują się w 120×70 px (hover) i 400×120 px
   (detail) — asset powinien być czytelny nawet w małej skali, więc
   unikaj drobnych detali, które znikną przy zmniejszeniu.

## Style brief (dołączony do każdego promptu poniżej)

Żeby wszystkie 29 plików wyglądały jak jedna spójna biblioteka, a nie
zbiór przypadkowych obrazków, każdy prompt zaczyna się od tego samego
opisu stylu:

```
Flat, minimal vector icon in a muted historical-cartography color
palette: background #F3F1E9, accent #75683E and #E3DDC7, ink/outline
#20231F, nature/positive #4F7153, industry/warning #9A722E, water/info
#536D78. Clean simple geometric shapes, thin uniform stroke weight, no
gradients, no text, no drop shadows, no photorealism. Consistent
top-down or gentle 3/4 oblique perspective across the whole set.
Subject alone, centered, isolated on a transparent background, simple
enough to stay legible at 60x40 px. This is one reusable module in a
modular icon set for a historical economic simulation game — think
scientific-atlas / field-guide illustration, not fantasy or cartoon
art.
```

Jeśli po kilku assetach czujesz, że styl "dryfuje" (ChatGPT stopniowo
zmienia charakter), wróć do tego bloku i zacznij nową sesję/wątek od
niego zamiast kontynuować w tym samym.

---

## terrain/ (6 plików + 2 nakładki wody)

### terrain/plains.svg

```
[Style brief powyżej] Subject: a flat, open grassy plain — a simple
horizontal ground line with a few short marks suggesting low grass, no
elevation.
```

### terrain/hills.svg

```
[Style brief powyżej] Subject: rolling hills — 2-3 overlapping smooth
rounded hill silhouettes of moderate height.
```

### terrain/mountains.svg

```
[Style brief powyżej] Subject: a small mountain range — 2-3 jagged
angular peaks, tallest terrain silhouette in this set, optional simple
snow-cap accents on the highest peak.
```

### terrain/forest.svg

```
[Style brief powyżej] Subject: a terrain silhouette implying a wooded
upland ridge — a gently uneven ground line with a subtle raised
texture, distinct from the dedicated vegetation-density icons (this
one is a base TERRAIN shape, not a tree cluster).
```

### terrain/desert.svg

```
[Style brief powyżej] Subject: flat arid terrain — a ground line with
a few simple wavy dune ridges, no vegetation, no water.
```

### terrain/wetland.svg

```
[Style brief powyżej] Subject: flat marshy terrain — a ground line with
two or three small irregular still-water patches breaking the surface.
```

### terrain/water-river.svg

```
[Style brief powyżej] Subject: a single winding river line crossing the
scene from one edge to another, moderate consistent width, meant to be
overlaid on top of a terrain icon.
```

### terrain/water-coast.svg

```
[Style brief powyżej] Subject: a coastline edge — land silhouette on
one side, open water fill on the other, one gentle shoreline curve,
meant to be overlaid along one edge of a terrain icon.
```

---

## vegetation/ (4 plików)

### vegetation/dense_forest.svg

```
[Style brief powyżej] Subject: a dense, tightly packed cluster of small
simplified tree silhouettes (rounded or conical canopy shapes), almost
no empty space between them.
```

### vegetation/sparse_forest.svg

```
[Style brief powyżej] Subject: a few scattered small simplified tree
silhouettes with plenty of open space between them — clearly sparser
than dense_forest.
```

### vegetation/grassland.svg

```
[Style brief powyżej] Subject: short simple tufted grass marks
scattered lightly and evenly across the lower part of the frame, no
trees.
```

### vegetation/fields.svg

```
[Style brief powyżej] Subject: neat parallel cultivated field furrow
lines suggesting farmland, evenly spaced, no buildings.
```

---

## settlements/ (5 plików, rosnąca skala)

### settlements/hamlet.svg

```
[Style brief powyżej] Subject: one or two very small simple house
silhouettes (triangular roof over a rectangle), smallest settlement
icon in this set.
```

### settlements/village.svg

```
[Style brief powyżej] Subject: a small cluster of four or five simple
house silhouettes loosely arranged along a short path, visibly bigger
than hamlet but still low and small-scale.
```

### settlements/town.svg

```
[Style brief powyżej] Subject: a denser cluster of six to eight simple
building silhouettes of varied small heights, suggesting a town
center — no skyscraper-scale shapes yet.
```

### settlements/city.svg

```
[Style brief powyżej] Subject: a skyline of several taller, denser
simple rectangular building silhouettes of varied height, clearly
larger-scale than town.
```

### settlements/metropolis.svg

```
[Style brief powyżej] Subject: a dense skyline of many tall simple
rectangular building silhouettes, the tallest and densest icon in this
settlement set.
```

---

## transport/ (4 plików)

### transport/trail.svg

```
[Style brief powyżej] Subject: a single thin dotted or dashed line
crossing the frame, suggesting an informal footpath — the lightest-
weight line in this transport set.
```

### transport/road.svg

```
[Style brief powyżej] Subject: a single solid line crossing the frame,
slightly heavier weight than trail, suggesting a plain road.
```

### transport/railway.svg

```
[Style brief powyżej] Subject: a straight line crossing the frame with
short, evenly-spaced perpendicular tick marks along it (railway
sleepers).
```

### transport/highway.svg

```
[Style brief powyżej] Subject: a wider double parallel-line road
crossing the frame, the heaviest/widest line in this transport set.
```

---

## industry/ (7 plików)

### industry/mine.svg

```
[Style brief powyżej] Subject: a simple mine entrance — a dark arched
opening set into a small slope, with a minimal headframe/winch
structure above it.
```

### industry/workshop.svg

```
[Style brief powyżej] Subject: one small simple workshop building
silhouette with a single chimney, smallest/simplest icon in this
industry set.
```

### industry/farm.svg

```
[Style brief powyżej] Subject: a simple barn or farmhouse silhouette
next to a small silo or a fenced field patch.
```

### industry/factory.svg

```
[Style brief powyżej] Subject: a simple rectangular factory building
silhouette with one or two chimneys.
```

### industry/industrial_complex.svg

```
[Style brief powyżej] Subject: several simple factory-style building
silhouettes clustered together with multiple chimneys and a connecting
pipe or two — visibly larger/denser than the single factory icon.
```

### industry/shipyard.svg

```
[Style brief powyżej] Subject: a simple dockside crane silhouette
beside a schematic ship-hull outline resting at a short dock/pier line.
```

### industry/energy.svg

```
[Style brief powyżej] Subject: a simple stylized energy icon — either a
minimal windmill with a few blades on a short tower, or a simple
electricity pylon/tower silhouette (pick one and stay consistent if you
regenerate it later).
```

---

## landmarks/ (3 plików + 1 fallback)

Dziś w treści gry istnieją tylko 3 surowce (`content/resources/*.json`),
więc na start wystarczą te trzy plus jeden generyczny placeholder na
przyszłe surowce, które nie mają jeszcze własnej ikony.

### landmarks/iron_ore.svg

```
[Style brief powyżej] Subject: a small stylized iron-mine headframe /
winding-tower icon — more distinct and slightly more detailed than the
generic industry/mine.svg icon, since this marks a specific named
historic landmark, not a generic industry marker.
```

### landmarks/grain.svg

```
[Style brief powyżej] Subject: a small stylized grain silo or windmill
icon marking a historic agricultural landmark.
```

### landmarks/timber.svg

```
[Style brief powyżej] Subject: a small stylized sawmill building or a
stacked-logs icon marking a historic timber landmark.
```

### landmarks/landmark-generic.svg

```
[Style brief powyżej] Subject: a small neutral diamond/star-shaped
marker with no specific subject — a generic placeholder landmark icon
usable for a resource that does not have its own dedicated icon yet.
```

---

## Checklista (29 plików razem)

- [ ] terrain/plains
- [ ] terrain/hills
- [ ] terrain/mountains
- [ ] terrain/forest
- [ ] terrain/desert
- [ ] terrain/wetland
- [ ] terrain/water-river
- [ ] terrain/water-coast
- [ ] vegetation/dense_forest
- [ ] vegetation/sparse_forest
- [ ] vegetation/grassland
- [ ] vegetation/fields
- [ ] settlements/hamlet
- [ ] settlements/village
- [ ] settlements/town
- [ ] settlements/city
- [ ] settlements/metropolis
- [ ] transport/trail
- [ ] transport/road
- [ ] transport/railway
- [ ] transport/highway
- [ ] industry/mine
- [ ] industry/workshop
- [ ] industry/farm
- [ ] industry/factory
- [ ] industry/industrial_complex
- [ ] industry/shipyard
- [ ] industry/energy
- [ ] landmarks/iron_ore
- [ ] landmarks/grain
- [ ] landmarks/timber
- [ ] landmarks/landmark-generic

Jak skończysz i zatwierdzisz komplet (albo część), daj mi znać — podłączę
je do `FCRegionVignette.tsx` w miejsce dzisiejszych placeholderowych
znaczników, bez zmiany logiki mapowania danych.
