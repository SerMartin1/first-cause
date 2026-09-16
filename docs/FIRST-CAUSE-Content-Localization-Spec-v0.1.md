# FIRST CAUSE --- Content & Localization Spec v0.1

**Status:** roboczy dokument kanoniczny\
**Projekt:** FIRST CAUSE\
**Wersja:** 0.1\
**Zakres:** architektura contentu, definicje danych, katalogi,
identyfikatory, walidacja, aktywacja VS/MVP/FULL, lokalizacja UI i
treści symulacji, dynamiczne nazwy, Chronicle, WHY?, formatowanie liczb
i dat, fallbacki, testy oraz workflow produkcji contentu.

**Dokumenty powiązane:** -
`FIRST-CAUSE-koncepcja-architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` -
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` (brak w repo; zob. Canonical Decisions §199) -
`FIRST-CAUSE-Entity-Data-Model-v0.1.md` -
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` -
`FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` -
`FIRST-CAUSE-AI-Decision-Model-v0.1.md` -
`FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md` -
`FIRST-CAUSE-Architect-Intervention-Influence-Spec-v0.1.md` -
`FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1.md` -
`FIRST-CAUSE-Save-Determinism-Performance-Spec-v0.1.md`

------------------------------------------------------------------------

# 1. Cel dokumentu

FIRST CAUSE ma zawierać dużą liczbę: - zasobów, - dóbr, - firm, -
Production Methods, - Discoveries, - usług, - interwencji, - typów
wydarzeń, - nazw, - komunikatów, - wpisów Chronicle, - wyjaśnień WHY?.

Nie mogą one być zakodowane jako rozproszone wyjątki w silniku.

Fundamentalna zasada:

> **Mechanika należy do silnika. Zawartość i balans należą do danych.
> Tekst widoczny dla gracza należy do lokalizacji.**

------------------------------------------------------------------------

# 2. Trzy warstwy

``` text
ENGINE LOGIC
    ↓
CONTENT DEFINITIONS
    ↓
LOCALIZED PRESENTATION
```

Silnik interpretuje dane.

Dane opisują świat.

Lokalizacja opisuje te dane graczowi.

------------------------------------------------------------------------

# 3. Engine Logic

Kod odpowiada za: - produkcję, - ceny, - AI, - migrację, -
technologię, - causality, - Chronicle selection, - Architect Influence.

Kod nie powinien zawierać: `if good == "steel"` bez mechanicznego powodu
wymagającego ogólnej kategorii/cechy.

------------------------------------------------------------------------

# 4. Content Definitions

Definicje obejmują: - ResourceDefinition, - GoodDefinition, -
CompanyArchetypeDefinition, - ProductionMethodDefinition, -
ServiceDefinition, - KnowledgeDomainDefinition, - DiscoveryDefinition, -
TransportModeDefinition, - ArchitectInterventionDefinition, -
EventTypeDefinition, - ChronicleTemplateDefinition.

------------------------------------------------------------------------

# 5. Localization

Lokalizacja odpowiada za: - nazwy, - etykiety, - opisy, - tooltips, -
komunikaty, - szablony Chronicle, - WHY? presentation, - formatowanie
językowe.

------------------------------------------------------------------------

# 6. Brak user-facing strings w Simulation Logic

Simulation Logic nie może przechowywać: `"Cena stali wzrosła"`.

Powinien emitować: - fact type, - entity IDs, - values, - causes.

------------------------------------------------------------------------

# 7. Simulation Facts są językowo neutralne

Przykład:

``` text
type: price_increased
goodId: steel
regionId: black_mountain
before: 12.4
after: 15.2
```

------------------------------------------------------------------------

# 8. Presentation

UI wybiera odpowiedni localization key i wstawia dane.

------------------------------------------------------------------------

# 9. Bazowy język projektu

Kanonicznym językiem kluczy i identyfikatorów jest **English**.

------------------------------------------------------------------------

# 10. Język dokumentacji

Dokumentacja projektowa może pozostawać po polsku.

Nie zmienia to języka IDs.

------------------------------------------------------------------------

# 11. Języki produktu

Architektura od początku ma wspierać **14 języków**:

1.  English
2.  Polish
3.  German
4.  French
5.  Spanish
6.  Italian
7.  Portuguese (Brazil)
8.  Simplified Chinese
9.  Traditional Chinese
10. Japanese
11. Korean
12. Turkish
13. Russian
14. Ukrainian

------------------------------------------------------------------------

# 12. RTL

Arabic i inne języki RTL nie należą do zakresu v0.1.

Architektura nie musi gwarantować pełnego RTL.

------------------------------------------------------------------------

# 13. English jako source locale

`en` jest źródłem fallback.

Każdy klucz musi istnieć po angielsku przed release contentu.

------------------------------------------------------------------------

# 14. Polish

`pl` jest pierwszym pełnym dodatkowym locale i językiem roboczym autora
projektu.

------------------------------------------------------------------------

# 15. Locale IDs

Rekomendowane: - en - pl - de - fr - es - it - pt-BR - zh-Hans -
zh-Hant - ja - ko - tr - ru - uk

------------------------------------------------------------------------

# 16. Stable Content IDs

Content ID jest: - trwałe, - językowo neutralne, - lowercase, -
machine-readable.

Przykłady: `iron_ore` `steel` `steelworks` `industrial_steelmaking`
`steam_power`.

------------------------------------------------------------------------

# 17. ID ≠ display name

ID: `iron_ore`

English: `Iron Ore`

Polish: `Ruda żelaza`

------------------------------------------------------------------------

# 18. ID Stability

Po wydaniu ID nie powinno być zmieniane tylko dlatego, że zmieniono
nazwę widoczną dla gracza.

------------------------------------------------------------------------

# 19. Renaming

Zmiana: `Steel Mill` → `Steelworks`

nie musi zmieniać: `steelworks`.

------------------------------------------------------------------------

# 20. Deprecated IDs

Jeśli ID musi zostać zmienione: - alias, - migration mapping, -
deprecation period.

------------------------------------------------------------------------

# 21. ID Naming Convention

Rekomendacja: `snake_case`.

------------------------------------------------------------------------

# 22. Prefixes

Definition IDs nie wymagają technicznych prefiksów typu `good_`.

Typ wynika z katalogu.

------------------------------------------------------------------------

# 23. Collision

`steel` może być Good ID.

Nie powinien jednocześnie oznaczać Discovery ID.

Discovery: `industrial_steelmaking`.

------------------------------------------------------------------------

# 24. Localization Keys

Rekomendowany format:

``` text
content.good.steel.name
content.good.steel.description
```

------------------------------------------------------------------------

# 25. UI Keys

Przykład:

``` text
ui.world.population
ui.region.economy
ui.command.pause
```

------------------------------------------------------------------------

# 26. Chronicle Keys

``` text
chronicle.resource_discovered.title
chronicle.resource_discovered.body
```

------------------------------------------------------------------------

# 27. WHY Keys

``` text
why.price_increased.summary
why.factor.supply_fell
why.factor.transport_cost_high
```

------------------------------------------------------------------------

# 28. Architect Keys

``` text
architect.intervention.reveal_resource.name
architect.intervention.reveal_resource.description
```

------------------------------------------------------------------------

# 29. Key Namespace

Główne: - ui. - content. - chronicle. - why. - architect. -
validation. - system. - debug.

------------------------------------------------------------------------

# 30. Debug Strings

Debug może być English-only.

Nie wymaga pełnej lokalizacji release.

------------------------------------------------------------------------

# 31. Content Phase

Każda definicja ma:

`implementationPhase`.

Dozwolone: - VS - MVP - FULL

------------------------------------------------------------------------

# 32. Phase oznacza aktywację

FULL content może istnieć w danych przed implementacją runtime.

Nie oznacza, że jest aktywny w VS.

------------------------------------------------------------------------

# 33. Zasada projektowa

> **Projektujemy docelowy content szeroko, ale aktywujemy go etapami.**

------------------------------------------------------------------------

# 34. Engine nie może zależeć od phase

Phase służy do: - aktywacji, - walidacji, - testów, - build
configuration.

------------------------------------------------------------------------

# 35. Content Pack

Rekomendowana jednostka organizacyjna:

``` text
ContentPack
id
version
dependencies
definitions
locales
```

------------------------------------------------------------------------

# 36. Core Pack

`first_cause_core`.

------------------------------------------------------------------------

# 37. VS Pack

Może być filtrem Core Pack, niekoniecznie osobnym fizycznym pakietem.

------------------------------------------------------------------------

# 38. Content Version

Każdy build ma: `contentVersion`.

Musi być zgodny z Save Spec.

------------------------------------------------------------------------

# 39. Content Manifest

Powinien zawierać: - packId, - version, - schemaVersion, -
dependencies, - enabledPhases, - locale list.

------------------------------------------------------------------------

# 40. Definition Schema

Każdy typ contentu ma jawny schema.

------------------------------------------------------------------------

# 41. ResourceDefinition

Minimalnie: - id, - nameKey, - category, - renewable, -
occurrenceRules, - discoveryRules, - extractionMethodIds, -
useGoodIds, - substituteIds, - strategicTags, - implementationPhase.

------------------------------------------------------------------------

# 42. GoodDefinition

Minimalnie: - id, - nameKey, - category, - tags, -
producerArchetypeIds, - productionMethodIds, - downstreamGoodIds, -
householdNeed, - demandSources, - storageProperties, -
transportProperties, - substituteIds, - technologyRequirements, -
implementationPhase.

------------------------------------------------------------------------

# 43. CompanyArchetypeDefinition

-   id,
-   nameKey,
-   sector,
-   allowedInputs,
-   allowedOutputs,
-   productionMethodIds,
-   capitalRequirement,
-   workforceProfile,
-   skillProfile,
-   energyProfile,
-   infrastructureRequirements,
-   knowledgeRequirements,
-   implementationPhase.

------------------------------------------------------------------------

# 44. ProductionMethodDefinition

-   id,
-   nameKey,
-   companyArchetypeIds,
-   outputs,
-   inputs,
-   resourceRequirements,
-   laborRequirements,
-   skillRequirements,
-   energyRequirements,
-   capitalGoods,
-   knowledgeRequirements,
-   discoveries,
-   infrastructure,
-   productivity,
-   waste,
-   environment,
-   adoption/switching costs,
-   implementationPhase.

------------------------------------------------------------------------

# 45. DiscoveryDefinition

-   id,
-   nameKey,
-   primaryDomainId,
-   secondaryDomainIds,
-   tier,
-   prerequisites,
-   knowledgeRequirements,
-   conditions,
-   pressureModifiers,
-   unlocks,
-   diffusion,
-   adoption,
-   causalityTags,
-   chronicleSignificance,
-   implementationPhase.

------------------------------------------------------------------------

# 46. ServiceDefinition

-   id,
-   nameKey,
-   category,
-   workforce,
-   skills,
-   infrastructure,
-   goodInputs,
-   capacityModel,
-   needTier,
-   implementationPhase.

------------------------------------------------------------------------

# 47. TransportModeDefinition

-   id,
-   nameKey,
-   discoveries,
-   infrastructure,
-   capitalGoods,
-   cost,
-   capacity,
-   terrainCompatibility,
-   cargoCompatibility,
-   energy,
-   implementationPhase.

------------------------------------------------------------------------

# 48. InterventionDefinition

-   id,
-   nameKey,
-   category,
-   allowedScopes,
-   parameters,
-   constraints,
-   costs,
-   cooldown,
-   stacking,
-   rootFactType,
-   implementationPhase.

------------------------------------------------------------------------

# 49. EventTypeDefinition

Event Type opisuje mechanizm zdarzenia, nie gotową narrację.

------------------------------------------------------------------------

# 50. ChronicleTemplateDefinition

Powinien określać: - fact/event type, - titleKey, - bodyKey, - required
data, - optional variants.

------------------------------------------------------------------------

# 51. Data Files

Rekomendowana struktura:

``` text
data/
  resources/
  goods/
  companies/
  production-methods/
  services/
  technology/
  transport/
  architect/
  events/
  chronicle/
```

------------------------------------------------------------------------

# 52. Localization Files

``` text
locales/
  en/
  pl/
  de/
  ...
```

------------------------------------------------------------------------

# 53. Locale Domain Split

Można rozdzielić: - ui, - content, - chronicle, - why, - architect.

------------------------------------------------------------------------

# 54. Jeden gigantyczny plik

Nie zalecany.

------------------------------------------------------------------------

# 55. Format danych

JSON/YAML/TOML lub inny format zależnie od stacku.

Najważniejsze: - schema validation, - deterministic load, -
diff-friendly.

------------------------------------------------------------------------

# 56. Format lokalizacji

Musi wspierać: - variables, - pluralization, - select/gender jeśli
potrzebne, - locale formatting.

------------------------------------------------------------------------

# 57. ICU MessageFormat

Warto rozważyć standard o możliwościach podobnych do ICU MessageFormat.

Nie implementować własnego prostego systemu `{0}` jeśli blokuje
pluralizację.

------------------------------------------------------------------------

# 58. Interpolacja

Przykład koncepcyjny:

``` text
"{region} discovered {resource}."
```

------------------------------------------------------------------------

# 59. Bez składania zdań z fragmentów

Nie budować: `prefix + region + middle + resource + suffix`.

W różnych językach szyk jest inny.

------------------------------------------------------------------------

# 60. Pełne szablony

Każdy komunikat powinien być pełnym tłumaczalnym template.

------------------------------------------------------------------------

# 61. Pluralization

Przykład: - 1 company, - 2 companies.

Polski wymaga bardziej złożonych reguł.

System lokalizacji musi to wspierać.

------------------------------------------------------------------------

# 62. Grammatical Cases

Polski, rosyjski i ukraiński mogą wymagać odmiany nazw.

------------------------------------------------------------------------

# 63. Dynamic Proper Names

Nazwy własne najlepiej traktować jako nieodmienne, jeśli pełna
morfologia byłaby zbyt kosztowna.

------------------------------------------------------------------------

# 64. Sentence Design

Szablony należy pisać tak, aby ograniczać konieczność odmiany
dynamicznych nazw.

------------------------------------------------------------------------

# 65. Przykład po polsku

Zamiast: `Rozwój Black Mountainu...`

preferować: `Region Black Mountain zanotował...`

------------------------------------------------------------------------

# 66. Entity Type Helper

Lokalizacja może używać: - „region {name}", - „firma {name}", - „osada
{name}".

------------------------------------------------------------------------

# 67. Dynamic Naming System

FIRST CAUSE potrzebuje nazw dla: - regionów, - settlements, -
companies, - states później, - nations/cultures, - historical
characters.

------------------------------------------------------------------------

# 68. Nazwa jest World State

Po wygenerowaniu dynamiczna nazwa staje się trwałą daną świata.

------------------------------------------------------------------------

# 69. Deterministic Naming

Generator nazw musi używać seedowanego RNG stream `naming`.

------------------------------------------------------------------------

# 70. Naming nie może wpływać na gameplay RNG

Oddzielny stream.

------------------------------------------------------------------------

# 71. Naming Profiles

Profile mogą zależeć od: - culture, - language family, - geography, -
settlement type.

------------------------------------------------------------------------

# 72. Fictional Names

Domyślny content powinien generować fikcyjne nazwy.

------------------------------------------------------------------------

# 73. Real-world Names

Nie są wymagane dla core FIRST CAUSE.

------------------------------------------------------------------------

# 74. Name Pools

Powinny być data-driven.

------------------------------------------------------------------------

# 75. Name Components

Możliwe: - roots, - prefixes, - suffixes, - patterns.

------------------------------------------------------------------------

# 76. Duplicate Prevention

Generator powinien ograniczać duplikaty w jednym świecie.

------------------------------------------------------------------------

# 77. Collision Resolution

Deterministyczny.

------------------------------------------------------------------------

# 78. Company Names

Mogą wynikać z: - settlement, - founder/culture, - sector, - geography.

------------------------------------------------------------------------

# 79. Company Name nie koduje mechaniki

`Black Mountain Iron Co.` nie musi być warunkiem, że firma wydobywa
żelazo.

Archetype jest źródłem mechaniki.

------------------------------------------------------------------------

# 80. Settlement Names

Po zmianie stage nazwa nie musi się zmieniać.

------------------------------------------------------------------------

# 81. State Names

Przyszły system może generować: - geographic, - cultural, -
dynastic/institutional.

Nie jest wymagany VS.

------------------------------------------------------------------------

# 82. Historical Character Names

Później korzystają z culture naming profile.

------------------------------------------------------------------------

# 83. Content Dependencies

Każda definicja może referować tylko istniejące IDs.

------------------------------------------------------------------------

# 84. Hard Dependency

PM wymagający `steel` musi mieć poprawny GoodDefinition.

------------------------------------------------------------------------

# 85. Phase Dependency

VS definition nie może wymagać wyłącznie FULL contentu.

------------------------------------------------------------------------

# 86. Phase Validation

Jeśli: `VS PM → FULL Good`

to build validation FAIL, chyba że dependency jest jawnie optional.

------------------------------------------------------------------------

# 87. Production Graph Validation

Sprawdzać: - inputs istnieją, - outputs istnieją, - producers
istnieją, - brak niezamierzonych dead ends, - brak niemożliwych
bootstrap cycles.

------------------------------------------------------------------------

# 88. Technology Graph Validation

Sprawdzać: - prerequisites, - unlock IDs, - no invalid cycles, - phase
compatibility.

------------------------------------------------------------------------

# 89. Localization Validation

Każdy required `nameKey` musi istnieć w `en`.

------------------------------------------------------------------------

# 90. Translation Completeness

Dla locale: - translated, - fallback, - missing.

------------------------------------------------------------------------

# 91. Release Locale

Język może być oznaczony jako release-ready dopiero po osiągnięciu
wymaganej kompletności.

------------------------------------------------------------------------

# 92. Fallback

Jeśli brakuje tłumaczenia: `requested locale → en`.

------------------------------------------------------------------------

# 93. Missing Key

W debug: `[[missing:key]]`.

W release: fallback English.

------------------------------------------------------------------------

# 94. Missing Key Telemetry

Developer build powinien raportować missing keys.

------------------------------------------------------------------------

# 95. Orphan Key

Klucz lokalizacji nieużywany przez content/UI.

Nie zawsze błąd, ale warto raportować.

------------------------------------------------------------------------

# 96. Duplicate Semantic Key

Unikać wielu kluczy dla tego samego pojęcia bez powodu.

------------------------------------------------------------------------

# 97. Terminology Glossary

Projekt powinien posiadać centralny słownik terminów.

------------------------------------------------------------------------

# 98. Kanoniczne terminy English

Przykłady: - Region - Settlement - Company - Production Method -
Discovery - Knowledge - Availability - Adoption - Access - Chronicle -
Historical Significance - Architect - Influence - Butterfly Effect -
Causal Chain - Turning Point.

------------------------------------------------------------------------

# 99. Kanoniczne terminy Polish

-   Region
-   Osada
-   Firma
-   Metoda Produkcji
-   Odkrycie
-   Wiedza
-   Dostępność
-   Adopcja / Wdrożenie --- do ostatecznej decyzji terminologicznej
-   Dostęp
-   Kronika
-   Znaczenie Historyczne
-   Architekt
-   Wpływ
-   Efekt Motyla
-   Łańcuch Przyczynowy
-   Punkt Zwrotny.

------------------------------------------------------------------------

# 100. Terminology Lock

Po ustaleniu terminów przed pełnym tłumaczeniem należy je zamrozić.

------------------------------------------------------------------------

# 101. UI Tone

Ton: - rzeczowy, - analityczny, - neutralny, - konkretny.

------------------------------------------------------------------------

# 102. Anti-AI Writing

Unikać: - napompowanego języka, - nadmiernych przymiotników, - metafor
bez mechanicznego znaczenia, - „epickich" komentarzy.

------------------------------------------------------------------------

# 103. Chronicle Tone

Historyczny, ale faktograficzny.

------------------------------------------------------------------------

# 104. WHY? Tone

Wyjaśniający i mechaniczny.

------------------------------------------------------------------------

# 105. Architect Tone

Eksperymentalny/analityczny.

Nie fantasy.

------------------------------------------------------------------------

# 106. Bad Example

`A glorious new age dawned over Black Mountain.`

------------------------------------------------------------------------

# 107. Good Example

`Black Mountain became the region's largest iron producer after two mines expanded production.`

------------------------------------------------------------------------

# 108. Narrative Truth Rule

Każde stwierdzenie Chronicle musi wynikać z: - SimulationFact, -
aggregate, - Historical Significance, - causal relation.

------------------------------------------------------------------------

# 109. No Invented Motivation

Nie: `Entrepreneurs believed in the future of the region`

jeśli model tego nie przechowuje.

------------------------------------------------------------------------

# 110. Decision Language

Można: `The company expanded because expected demand remained high.`

jeśli DecisionSnapshot to potwierdza.

------------------------------------------------------------------------

# 111. Chronicle Templates

Template-first.

------------------------------------------------------------------------

# 112. Chronicle Variant

Dla jednego event type można mieć warianty: - local, - major, -
world-level, - Architect-related.

------------------------------------------------------------------------

# 113. Template Selection

Deterministyczny lub oparty na danych.

Nie może wpływać na simulation state.

------------------------------------------------------------------------

# 114. Narrative Variety

Można mieć kilka równoważnych templates.

Jeśli losowane, używać presentation RNG niezależnego od simulation RNG
albo deterministycznego wyboru z fact ID.

------------------------------------------------------------------------

# 115. Presentation RNG

Nigdy nie może wpływać na gameplay RNG.

------------------------------------------------------------------------

# 116. Chronicle Data Payload

Powinien zawierać konkretne dane do lokalizacji: - regionName, -
resourceName, - before, - after, - duration, - etc.

------------------------------------------------------------------------

# 117. WHY? Structured Data

Causality Engine zwraca: - target, - primary causes, - limiting
factors, - deeper paths, - architect connections.

Localization renderuje.

------------------------------------------------------------------------

# 118. WHY? nie jest generowanym esejem

Domyślnie 2--5 przyczyn.

------------------------------------------------------------------------

# 119. WHY? Factor Keys

Mechaniczne czynniki mają własne keys: - supply_fell, -
demand_increased, - labor_shortage, - transport_cost_high, -
resource_access, - housing_pressure.

------------------------------------------------------------------------

# 120. Contribution Presentation

W UI: - Primary, - Significant, - Minor.

Lokalizowane.

------------------------------------------------------------------------

# 121. WHY NOT?

Musi mieć templates dla: - hard constraint, - low score, - missing
resource, - missing technology, - capital shortage, - labor shortage, -
transport.

------------------------------------------------------------------------

# 122. Technology Localization

Rozróżniać: - Knowledge, - Discovery, - Availability, - Adoption, -
Access.

Nie tłumaczyć ich jako jednego „Technology".

------------------------------------------------------------------------

# 123. Production Method Names

Nazwy PM powinny opisywać sposób produkcji, nie epokę.

------------------------------------------------------------------------

# 124. Tier Names

T0--T5 są wewnętrznym complexity band.

Nie muszą być eksponowane jako „era".

------------------------------------------------------------------------

# 125. Resource Names

38 resource definitions mają komplet: - name, - optional short
description, - category.

------------------------------------------------------------------------

# 126. Goods Names

64 goods mają komplet: - name, - optional description, - category.

------------------------------------------------------------------------

# 127. Company Archetypes

28 archetypes: - name, - sector label, - optional description.

------------------------------------------------------------------------

# 128. Discoveries

Każde Discovery: - name, - concise description, - effects/unlocks
presentation.

------------------------------------------------------------------------

# 129. Effects

Nie hardcodować efektu w description, jeśli może zmienić się przez
balans.

------------------------------------------------------------------------

# 130. Dynamic Effect Rendering

Jeśli wartość jest parametrem: `+{value}%`

powinna pochodzić z danych.

------------------------------------------------------------------------

# 131. Tooltip Source of Truth

Tooltip mechaniczny pobiera aktualne definition values.

------------------------------------------------------------------------

# 132. Descriptive Text

Może wyjaśniać koncepcję, ale nie duplikować zmiennych liczb.

------------------------------------------------------------------------

# 133. Content Balance Data

Weights, thresholds, costs i coefficients są content/config data, nie
localization.

------------------------------------------------------------------------

# 134. Localization nie wpływa na balans

Zmiana języka nie może zmienić symulacji.

------------------------------------------------------------------------

# 135. Locale Independence Test

Run `en` i `pl`: identyczny World checksum.

------------------------------------------------------------------------

# 136. Content Load Determinism

Kolejność plików na dysku nie może zmieniać świata.

------------------------------------------------------------------------

# 137. Stable Content Load

Definitions są po load indeksowane stabilnie po ID.

------------------------------------------------------------------------

# 138. Duplicate ID

Build validation FAIL.

------------------------------------------------------------------------

# 139. Missing Reference

FAIL.

------------------------------------------------------------------------

# 140. Invalid Numeric Range

FAIL lub warning zależnie od schema.

------------------------------------------------------------------------

# 141. NaN / Infinity

FAIL.

------------------------------------------------------------------------

# 142. Invalid Phase

FAIL.

------------------------------------------------------------------------

# 143. Missing English Key

FAIL dla release content.

------------------------------------------------------------------------

# 144. Missing Secondary Locale

Warning/fallback, dopóki locale nie jest release-ready.

------------------------------------------------------------------------

# 145. Content Validator

Powinien działać bez uruchamiania pełnej gry.

------------------------------------------------------------------------

# 146. Validator Output

-   errors,
-   warnings,
-   stats,
-   dependency graph,
-   localization coverage.

------------------------------------------------------------------------

# 147. Content Statistics

Raport: - resources, - goods, - companies, - PMs, - discoveries, -
services, - interventions, - Chronicle templates, - keys.

------------------------------------------------------------------------

# 148. VS Content Gate

Raportuje tylko aktywne VS dependencies.

------------------------------------------------------------------------

# 149. MVP Content Gate

Analogicznie MVP.

------------------------------------------------------------------------

# 150. FULL Gate

Pełny graph.

------------------------------------------------------------------------

# 151. Dead Content

Definition, do której nic nie prowadzi.

Może być celowa, ale raportować.

------------------------------------------------------------------------

# 152. Unproducible Good

Good bez źródła produkcji/importu/start stock: warning/error zależnie od
roli.

------------------------------------------------------------------------

# 153. Unusable Resource

Resource bez downstream use: warning.

------------------------------------------------------------------------

# 154. Unreachable Discovery

Discovery z niemożliwymi prerequisites: FAIL.

------------------------------------------------------------------------

# 155. PM Without Actor

Production Method bez CompanyArchetype: FAIL/warning.

------------------------------------------------------------------------

# 156. Localization Coverage Report

Np.:

``` text
en 100%
pl 100%
de 82%
fr 79%
```

------------------------------------------------------------------------

# 157. Coverage Categories

Osobno: - UI, - core content, - Chronicle, - WHY?, - Architect.

------------------------------------------------------------------------

# 158. Release Blocking Keys

UI core i gameplay-critical muszą być pełne.

------------------------------------------------------------------------

# 159. Optional Flavor

Może fallbackować.

------------------------------------------------------------------------

# 160. Machine Translation

Może być używana jako draft, ale nie powinna automatycznie stawać się
release-ready bez kontroli jakości.

------------------------------------------------------------------------

# 161. Translation Context

Translator potrzebuje: - key, - English source, - screenshot/context, -
variables, - description.

------------------------------------------------------------------------

# 162. Variable Documentation

Przykład:

``` text
{region} = dynamic region name
{value} = percentage change
```

------------------------------------------------------------------------

# 163. Placeholder Integrity

Tłumaczenie musi zachować wymagane placeholders.

------------------------------------------------------------------------

# 164. Placeholder Validation

Brak/dodatkowy placeholder = FAIL.

------------------------------------------------------------------------

# 165. Markup

Jeśli UI wspiera markup: - ograniczony whitelist, - walidowany.

------------------------------------------------------------------------

# 166. Rich Text

Nie pozwalać tłumaczeniu wstrzykiwać logiki.

------------------------------------------------------------------------

# 167. Number Formatting

Centralny formatter.

------------------------------------------------------------------------

# 168. Decimal Separator

Locale-dependent.

------------------------------------------------------------------------

# 169. Thousands Separator

Locale-dependent.

------------------------------------------------------------------------

# 170. Percent

Locale-dependent.

------------------------------------------------------------------------

# 171. Currency

FIRST CAUSE może używać wewnętrznej jednostki ekonomicznej.

Jeśli pojawią się waluty państwowe, format musi być data-driven.

------------------------------------------------------------------------

# 172. Compact Numbers

Np.: - 1.2k, - 1,2 tys.

Powinny być lokalizowane.

------------------------------------------------------------------------

# 173. Full Number Tooltip

Compact UI może pokazywać pełną wartość w tooltipie.

------------------------------------------------------------------------

# 174. Date Formatting

Centralny WorldDateFormatter.

------------------------------------------------------------------------

# 175. Simulation Calendar

Nie opierać tekstów na systemowej dacie komputera.

------------------------------------------------------------------------

# 176. Relative Time

`10 years ago`

musi korzystać z czasu świata.

------------------------------------------------------------------------

# 177. Units

Centralny UnitFormatter.

------------------------------------------------------------------------

# 178. Distance

Jeśli abstrakcyjna world unit nie jest kilometrem, nie lokalizować jej
jako km.

------------------------------------------------------------------------

# 179. Quantities

Jeśli goods używają abstract quantity, UI powinien to prezentować
konsekwentnie.

------------------------------------------------------------------------

# 180. Temperature / Climate

Jeśli później wystąpią realne jednostki, locale może wybierać format,
ale simulation canonical unit pozostaje jeden.

------------------------------------------------------------------------

# 181. Sorting

Sortowanie nazw powinno być locale-aware w UI.

------------------------------------------------------------------------

# 182. Simulation Sorting

Nie może zależeć od lokalizowanych nazw.

------------------------------------------------------------------------

# 183. Search

Powinno wyszukiwać po localized display name i dynamic proper names.

------------------------------------------------------------------------

# 184. Search ID

Debug może wyszukiwać po ID.

------------------------------------------------------------------------

# 185. CJK

UI musi tolerować: - brak spacji, - inne szerokości znaków, - line
breaking.

------------------------------------------------------------------------

# 186. Japanese/Chinese/Korean

Nie projektować layoutu wyłącznie pod alfabet łaciński.

------------------------------------------------------------------------

# 187. Cyrillic

Font musi zawierać: - Russian, - Ukrainian.

------------------------------------------------------------------------

# 188. Polish Characters

Pełne: ą ć ę ł ń ó ś ź ż.

------------------------------------------------------------------------

# 189. Turkish Characters

Pełne: ç ğ ı İ ö ş ü.

------------------------------------------------------------------------

# 190. Font Coverage

Wybrany font UI musi wspierać wszystkie 14 locale lub posiadać spójny
fallback stack.

------------------------------------------------------------------------

# 191. Font Fallback

Fallback nie może powodować dramatycznie innej wysokości linii.

------------------------------------------------------------------------

# 192. Uppercase

Unikać wymuszania uppercase dla języków, gdzie wygląda źle.

------------------------------------------------------------------------

# 193. Text Expansion

Layout testować co najmniej z: - German, - Polish, - Russian.

------------------------------------------------------------------------

# 194. Expansion Budget

Przyciski/labels nie mogą być projektowane „na styk".

------------------------------------------------------------------------

# 195. Truncation

Długie nazwy: - ellipsis, - tooltip, - wrap zależnie od komponentu.

------------------------------------------------------------------------

# 196. Dynamic Name Length

Generator nazw powinien mieć rozsądne limity długości.

------------------------------------------------------------------------

# 197. Accessibility

Localization nie może być przekazywana wyłącznie przez kolor/ikonę.

------------------------------------------------------------------------

# 198. Screen Reader Future

Nie jest P0, ale semantic labels warto projektować poprawnie.

------------------------------------------------------------------------

# 199. Content Authoring Workflow

``` text
DESIGN
→ ADD/EDIT DEFINITION
→ VALIDATE SCHEMA
→ VALIDATE REFERENCES
→ VALIDATE PHASE
→ ADD EN KEYS
→ ADD PL KEYS
→ RUN CONTENT TESTS
→ SIMULATION TEST
→ REVIEW
→ COMMIT
```

------------------------------------------------------------------------

# 200. New Good Workflow

Dodanie dobra powinno wymagać przede wszystkim: - GoodDefinition, -
producer/PM refs, - downstream demand, - localization, - tests.

Nie nowego kodu engine.

------------------------------------------------------------------------

# 201. New Company Workflow

-   CompanyArchetypeDefinition,
-   PMs,
-   workforce/capital requirements,
-   localization,
-   validation.

------------------------------------------------------------------------

# 202. New Discovery Workflow

-   DiscoveryDefinition,
-   prerequisites,
-   unlocks,
-   localization,
-   technology graph test.

------------------------------------------------------------------------

# 203. New Intervention Workflow

-   InterventionDefinition,
-   whitelisted effect handler/mechanism,
-   costs,
-   root fact,
-   localization,
-   tests.

Tu może być wymagany kod tylko dla nowego ogólnego typu mechanicznego
efektu.

------------------------------------------------------------------------

# 204. New Chronicle Event Workflow

-   istniejący SimulationFact,
-   significance rules,
-   Chronicle template,
-   localization.

Chronicle nie może tworzyć nowej mechaniki.

------------------------------------------------------------------------

# 205. Content Review Checklist

Czy: - ID jest stabilne? - phase poprawna? - refs istnieją? - mechanika
jest ogólna? - nie ma hardcoded exception? - localization istnieje? -
tooltip nie kłamie? - causality hooks istnieją? - test istnieje?

------------------------------------------------------------------------

# 206. Balance Review

Oddzielny od linguistic review.

------------------------------------------------------------------------

# 207. Localization Review

Sprawdza: - sens, - terminologię, - placeholders, - długość, - ton.

------------------------------------------------------------------------

# 208. Content Diff

Zmiana danych powinna być łatwa do code review.

------------------------------------------------------------------------

# 209. Generated Content

Jeśli narzędzia generują definitions: wynik powinien być
materializowany/wersjonowany albo deterministycznie generowany.

------------------------------------------------------------------------

# 210. Runtime Procedural Content

Dynamiczne nazwy i historie są runtime content, ale wynikają z danych i
facts.

------------------------------------------------------------------------

# 211. AI/LLM Generated Text

Nie jest wymagane dla core.

------------------------------------------------------------------------

# 212. LLM Optional Future

Jeśli później użyty: - tylko presentation, - nigdy source of truth, -
grounding w facts, - fallback template, - możliwość wyłączenia.

------------------------------------------------------------------------

# 213. Offline Requirement

Core localization i Chronicle muszą działać offline.

------------------------------------------------------------------------

# 214. Steam Release

Brak połączenia z zewnętrzną usługą nie może blokować podstawowego
tekstu gry.

------------------------------------------------------------------------

# 215. Content Hot Reload

Przydatny w development.

------------------------------------------------------------------------

# 216. Hot Reload Constraints

Nie zmieniać aktywnego World State w sposób niekontrolowany.

------------------------------------------------------------------------

# 217. Safe Hot Reload

Najbezpieczniejsze: - localization, - presentation metadata.

Gameplay definitions wymagają restartu/reload świata lub debug-only
migration.

------------------------------------------------------------------------

# 218. Content Hash

Build może obliczać hash aktywnych definitions.

------------------------------------------------------------------------

# 219. Save Compatibility

Save przechowuje contentVersion/hash zgodnie z Save Spec.

------------------------------------------------------------------------

# 220. Balance Patch

Zmiana values może zmienić przyszłość świata po load.

To jest engine/content compatibility decision i musi być jawna.

------------------------------------------------------------------------

# 221. Historical Values

Nie przeliczać wstecz: - historycznych kosztów Architect, -
historycznych cen, - dawnych decisions

na podstawie nowych definitions.

------------------------------------------------------------------------

# 222. Definition Snapshot

Jeśli historyczne wyjaśnienie wymaga dawnej wartości,
Fact/DecisionSnapshot musi zachować potrzebną wartość.

------------------------------------------------------------------------

# 223. Chronicle Historical Text

Powinien renderować historyczne dane z payload/facts, nie aktualny stan.

------------------------------------------------------------------------

# 224. WHY Historical

Analogicznie.

------------------------------------------------------------------------

# 225. VS Content Scope

VS aktywuje ograniczony content z pełnych katalogów.

------------------------------------------------------------------------

# 226. VS Resources

Referencyjnie 12: - Grain - Livestock - Fish - Timber - Cotton - Stone -
Clay - Limestone - Iron Ore - Coal - Sand - Salt.

------------------------------------------------------------------------

# 227. VS Goods

Referencyjnie 20: - Staple Crops - Flour - Bread & Basic Food - Meat -
Fish Food - Raw Textile Fiber - Textiles - Clothing - Lumber - Cut
Stone - Bricks - Cement - Iron - Steel - Hand Tools - Furniture -
Machinery - Biomass Fuel - Coal Fuel - Carts.

------------------------------------------------------------------------

# 228. VS Company Archetypes

Do 17 zgodnie z Vertical Slice Spec.

------------------------------------------------------------------------

# 229. VS Technology

20--30 aktywnych Discoveries.

------------------------------------------------------------------------

# 230. VS Architect

Kanoniczny aktualny zestaw: - Reveal Resource Deposit - Fertility
Shift - Knowledge Injection - Trade Friction Shift - Environmental
Shock - Population Seed opcjonalnie tylko eksperymentalnie.

------------------------------------------------------------------------

# 231. VS Chronicle

Minimum 15 event types.

------------------------------------------------------------------------

# 232. VS Localization

P0: - English, - Polish.

Pozostałe locale mogą zostać przygotowane później, ale architektura musi
je obsługiwać.

------------------------------------------------------------------------

# 233. MVP Localization

Przed deklaracją danego języka jako wspieranego: - pełny core UI, -
gameplay content, - WHY?, - Architect, - Chronicle core.

------------------------------------------------------------------------

# 234. FULL Content Target

Docelowe katalogi obecnie obejmują: - 38 resources, - 64 goods, - 28
company archetypes, - 12 Knowledge Domains, - szeroki Discovery Catalog.

------------------------------------------------------------------------

# 235. Content Expansion Rule

Dodanie kolejnych elementów ma być głównie aktywacją danych.

------------------------------------------------------------------------

# 236. Hardcoded Exception Audit

Automatyczny/static audit powinien szukać wzorców: - IDs contentu w
engine conditionals, - localized strings w simulation code.

------------------------------------------------------------------------

# 237. Dozwolony wyjątek

Silnik może znać ogólne mechaniczne klasy: - storable/non-storable, -
renewable/non-renewable, - energy flow, - service.

Nie konkretny produkt bez potrzeby.

------------------------------------------------------------------------

# 238. Electricity

Może mieć mechaniczny tag: `non_storable_current_period_flow`.

Silnik reaguje na tag, nie ID `electricity`.

------------------------------------------------------------------------

# 239. Services

Mechaniczny typ: `service`.

------------------------------------------------------------------------

# 240. Tags

Tags powinny być jawnie zdefiniowane.

------------------------------------------------------------------------

# 241. Tag Explosion

Nie zastępować schema setkami przypadkowych string tags.

Częste ważne właściwości powinny mieć jawne pola/enums.

------------------------------------------------------------------------

# 242. Enum Localization

Enum ma stable code + localization key.

------------------------------------------------------------------------

# 243. Category Localization

Kategorie: - Resource Category, - Good Category, - Company Sector, -
Discovery Domain

lokalizowane osobno.

------------------------------------------------------------------------

# 244. Content Ordering

UI order może być: - explicit displayOrder, - category, - localized
alphabetical.

Simulation order nie korzysta z display order.

------------------------------------------------------------------------

# 245. Default Sort

Powinien być semantyczny, nie przypadkowy file order.

------------------------------------------------------------------------

# 246. Data Comments

Jeśli format wspiera komentarze, mogą wyjaśniać balans.

Nie są lokalizacją.

------------------------------------------------------------------------

# 247. Design Notes

Nie powinny trafiać do runtime build, jeśli niepotrzebne.

------------------------------------------------------------------------

# 248. Source References

Definitions mogą mieć dev-only: `designSource`.

Pomaga utrzymać zgodność dokumentacji.

------------------------------------------------------------------------

# 249. Documentation Sync

Przy dużej zmianie katalogu należy aktualizować: - Production Economy
Master, - Technology Catalog, - VS Spec, - odpowiedni content data.

------------------------------------------------------------------------

# 250. Canonical Source after Implementation

Po implementacji trzeba jasno ustalić: - dokumentacja opisuje
intencję, - validated content files są runtime source of truth dla
konkretnych wartości.

------------------------------------------------------------------------

# 251. Generated Documentation

W przyszłości katalog resources/goods/discoveries może być generowany z
content data do Markdown.

------------------------------------------------------------------------

# 252. Zaleta

Ogranicza drift dokumentacja ↔ runtime.

------------------------------------------------------------------------

# 253. Localization Source Control

Wszystkie locale files wersjonowane.

------------------------------------------------------------------------

# 254. External Translation Tool

Można eksportować/importować, ale repo zachowuje canonical files.

------------------------------------------------------------------------

# 255. Translator Safety

Translator nie edytuje: - IDs, - mechanics, - numeric values.

------------------------------------------------------------------------

# 256. Placeholder Lock

Narzędzie powinno chronić placeholders.

------------------------------------------------------------------------

# 257. Translation Memory

Przy 14 językach warto użyć TM/glossary.

Nie jest wymagane dla VS.

------------------------------------------------------------------------

# 258. Terminology QA

Automatycznie wykrywać zakazane/stare terminy, jeśli możliwe.

------------------------------------------------------------------------

# 259. Screenshot QA

Dla każdego locale: - Command Center, - Region, - Company, -
Technology, - Chronicle, - WHY?, - Architect.

------------------------------------------------------------------------

# 260. Pseudo-localization

Bardzo zalecana.

------------------------------------------------------------------------

# 261. Pseudo Locale

Np. `en-XA`.

Rozszerza tekst i dodaje znaki.

------------------------------------------------------------------------

# 262. Cel pseudo-localization

Wykrywa: - clipping, - hardcoded strings, - layout na styk, - brak
Unicode.

------------------------------------------------------------------------

# 263. CJK Pseudo Test

Nie zastępuje prawdziwego testu CJK.

------------------------------------------------------------------------

# 264. Font Test Matrix

Test: Latin Extended, Cyrillic, CJK, Turkish.

------------------------------------------------------------------------

# 265. Localization Performance

Nie parsować ogromnych locale files przy każdym renderze.

------------------------------------------------------------------------

# 266. Key Lookup

Cache/index.

------------------------------------------------------------------------

# 267. Language Switch

Może działać runtime.

Nie powinien wymagać restartu symulacji.

------------------------------------------------------------------------

# 268. Language Switch Determinism

World checksum przed/po zmianie języka identyczny.

------------------------------------------------------------------------

# 269. Chronicle Re-render

Starsze entries mogą być renderowane w nowym języku z templateKey +
payload.

------------------------------------------------------------------------

# 270. Dynamic Names after Language Switch

Nazwy własne pozostają takie same.

------------------------------------------------------------------------

# 271. Content Test --- Add Good

Dodaj testowe dobro wyłącznie przez data files.

Engine powinien je załadować bez zmiany kodu, jeśli korzysta z
istniejących mechanik.

------------------------------------------------------------------------

# 272. Content Test --- Add Company

Analogicznie.

------------------------------------------------------------------------

# 273. Content Test --- Add PM

Nowy PM ma być możliwy bez engine exception.

------------------------------------------------------------------------

# 274. Content Test --- Phase

VS build nie ładuje FULL-only aktywacji.

------------------------------------------------------------------------

# 275. Content Test --- Missing Dependency

Build FAIL.

------------------------------------------------------------------------

# 276. Content Test --- Cycle

Nielegalny technology/production dependency cycle FAIL.

------------------------------------------------------------------------

# 277. Localization Test --- Missing English

FAIL.

------------------------------------------------------------------------

# 278. Localization Test --- Missing Polish

Dla VS P0: FAIL.

------------------------------------------------------------------------

# 279. Localization Test --- Placeholder

FAIL.

------------------------------------------------------------------------

# 280. Localization Test --- Locale Independence

World checksum identical.

------------------------------------------------------------------------

# 281. Localization Test --- Chronicle

Ten sam ChronicleEntry renderuje poprawnie EN i PL z tych samych source
facts.

------------------------------------------------------------------------

# 282. Localization Test --- WHY

To samo WhyExplanation ma identyczne causes i różny tylko presentation
text.

------------------------------------------------------------------------

# 283. Localization Test --- Dynamic Names

Nazwy zachowują się poprawnie w EN/PL bez łamania gramatyki szablonu.

------------------------------------------------------------------------

# 284. Localization Test --- Numbers

Locale formatting nie zmienia canonical numeric value.

------------------------------------------------------------------------

# 285. Localization Test --- Save

Save wykonany w PL ładuje się w EN bez zmiany świata.

------------------------------------------------------------------------

# 286. Content Performance Test

Load time definitions + localization.

------------------------------------------------------------------------

# 287. Large Catalog Test

Testować docelowe: - 38 resources, - 64 goods, - 28 companies, - full
discovery catalog

nawet jeśli część nieaktywna.

------------------------------------------------------------------------

# 288. Localization Large Test

Tysiące keys × 14 locale nie mogą powodować problemów runtime.

------------------------------------------------------------------------

# 289. Content Build Pipeline

``` text
LOAD SCHEMAS
→ LOAD DEFINITIONS
→ VALIDATE IDs
→ VALIDATE REFERENCES
→ VALIDATE PHASES
→ BUILD DEPENDENCY GRAPHS
→ LOAD SOURCE LOCALE
→ VALIDATE KEYS
→ LOAD SECONDARY LOCALES
→ VALIDATE PLACEHOLDERS
→ GENERATE REPORT
→ BUILD CONTENT INDEX
```

------------------------------------------------------------------------

# 290. Fail Fast

Critical content error powinien zatrzymać dev build/start world
creation.

------------------------------------------------------------------------

# 291. Release Build

Nie powinien startować z uszkodzonym core contentem.

------------------------------------------------------------------------

# 292. Content Hash Determinism

Hash definitions liczony w stabilnej kolejności.

------------------------------------------------------------------------

# 293. Content Diagnostics

Debug screen: - contentVersion, - active phase, - counts, - locale, -
missing keys, - content hash.

------------------------------------------------------------------------

# 294. Localization Diagnostics

Możliwość pokazania localization key zamiast tekstu.

------------------------------------------------------------------------

# 295. Implementation Stages --- CL-01

**Content Schema Foundation** - IDs, - schemas, - loader, - phase.

------------------------------------------------------------------------

# 296. CL-02

**Core Definition Catalogs** - resources, - goods, - companies, - PM.

------------------------------------------------------------------------

# 297. CL-03

**Technology/Services/Transport** - domains, - discoveries, -
services, - transport.

------------------------------------------------------------------------

# 298. CL-04

**Architect/Event/Chronicle Definitions**

------------------------------------------------------------------------

# 299. CL-05

**Localization Core** - locale loader, - fallback, - variables, -
pluralization.

------------------------------------------------------------------------

# 300. CL-06

**English Source Locale**

------------------------------------------------------------------------

# 301. CL-07

**Polish Locale**

------------------------------------------------------------------------

# 302. CL-08

**Dynamic Naming**

------------------------------------------------------------------------

# 303. CL-09

**Chronicle/WHY Localization**

------------------------------------------------------------------------

# 304. CL-10

**Validation & Coverage**

------------------------------------------------------------------------

# 305. CL-11

**Pseudo-localization & Font QA**

------------------------------------------------------------------------

# 306. CL-12

**Additional 12 Locales**

------------------------------------------------------------------------

# 307. Definition of Done --- Content Foundation

PASS jeśli: - wszystkie definition types mają schema, - stable IDs, -
references validation, - phase validation, - deterministic load, -
contentVersion/hash.

------------------------------------------------------------------------

# 308. Definition of Done --- VS Content

PASS jeśli: - VS resources/goods/companies/PM/discoveries/interventions
działają, - nie wymagają per-ID engine exceptions, - graph validation
PASS, - Black Mountain korzysta z normalnego content pipeline.

------------------------------------------------------------------------

# 309. Definition of Done --- Localization Foundation

PASS jeśli: - EN + PL, - fallback, - pluralization, - placeholders, -
number/date formatters, - language switch, - no world checksum change.

------------------------------------------------------------------------

# 310. Definition of Done --- Chronicle/WHY

PASS jeśli: - Chronicle templates renderują z facts, - WHY renderuje
structured causes, - brak invented facts, - historical entries mogą być
re-renderowane po zmianie języka.

------------------------------------------------------------------------

# 311. Definition of Done --- Dynamic Naming

PASS jeśli: - deterministic, - separate RNG stream, - duplicate
handling, - persisted in save, - works with EN/PL templates.

------------------------------------------------------------------------

# 312. Definition of Done --- 14-language Architecture

Nie wymaga, aby wszystkie tłumaczenia były gotowe w VS.

Wymaga: - Unicode, - font strategy, - locale IDs, - CJK-compatible
layout, - Cyrillic/Turkish support, - no assumptions blocking 14
locales.

------------------------------------------------------------------------

# 313. Content Gate przed MVP

Przed rozszerzeniem: - VS data-driven audit, - no hardcoded content
exceptions, - dependency graphs, - localization glossary, - content
versioning, - save compatibility.

------------------------------------------------------------------------

# 314. Gate przed FULL Catalog

-   38 resources validated,
-   64 goods validated,
-   28 company archetypes validated,
-   full discovery graph validated,
-   no dead critical chains,
-   performance load test.

------------------------------------------------------------------------

# 315. Gate przed deklaracją nowego języka

-   core coverage,
-   Chronicle coverage,
-   WHY coverage,
-   Architect coverage,
-   font QA,
-   screenshot QA,
-   terminology review,
-   placeholder PASS.

------------------------------------------------------------------------

# 316. Open Decisions

Do rozstrzygnięcia: 1. konkretny format definition files, 2.
localization library/format, 3. „Adoption" vs „Wdrożenie" w polskim UI,
4. pełny glossary EN/PL, 5. font/fallback stack, 6. naming grammar
complexity, 7. dynamic culture naming profiles, 8. translation
workflow/tool, 9. release order pozostałych 12 języków, 10. dokładny
próg localization coverage, 11. czy descriptions są obowiązkowe dla
wszystkich goods/resources, 12. sposób generowania documentation from
data, 13. modding/content packs po MVP.

------------------------------------------------------------------------

# 317. Decyzje kanoniczne v0.1

-   Engine logic, content data i localization są rozdzielone.
-   English jest source locale.
-   Polish jest pierwszym pełnym dodatkowym locale.
-   Architektura wspiera 14 języków.
-   RTL nie jest wymagane v0.1.
-   IDs są English-like, stable, snake_case i językowo neutralne.
-   Display name nigdy nie jest ID.
-   User-facing strings nie należą do Simulation Logic.
-   SimulationFact jest językowo neutralny.
-   Chronicle jest template-first.
-   WHY? korzysta ze structured data.
-   Localization nie może zmieniać World State.
-   Language switch nie zmienia checksum.
-   Dynamic names są trwałym World State.
-   Naming korzysta z osobnego deterministic RNG stream.
-   VS/MVP/FULL są content activation phases.
-   VS dependency nie może wymagać FULL-only content.
-   Content jest schema-validated.
-   References są walidowane.
-   Duplicate IDs są błędem.
-   Missing English core key jest błędem.
-   EN i PL są P0 dla Vertical Slice.
-   Fallback secondary locale → English.
-   Placeholders są walidowane.
-   Pełne zdania są tłumaczone jako templates; nie sklejamy ich z
    fragmentów.
-   Terminologia jest centralizowana.
-   Mechaniczne liczby pochodzą z definitions, nie z opisów.
-   UI formatowanie liczb/dat/jednostek jest centralne.
-   Simulation sorting nie zależy od localized names.
-   CJK/Cyrillic/Turkish muszą być uwzględnione w font/layout
    architecture.
-   Pseudo-localization jest zalecanym testem.
-   Core działa offline bez LLM.
-   LLM może być kiedyś wyłącznie warstwą presentation z groundingiem.
-   ContentVersion jest częścią save compatibility.
-   Historyczne fakty nie są przeliczane według nowych definicji.
-   Dodanie zwykłego Good/Company/PM/Discovery nie powinno wymagać zmian
    engine.
-   Validated content files stają się runtime source of truth dla
    konkretnych wartości po implementacji.

------------------------------------------------------------------------

# 318. Relacja z Save Spec

Save przechowuje: - IDs, - contentVersion, - dynamic names, - historical
payload.

Localization text nie jest canonical simulation state.

------------------------------------------------------------------------

# 319. Relacja z Entity Data Model

Entity instances referują Definition IDs.

Nie kopiują pełnych definicji do każdej instancji.

------------------------------------------------------------------------

# 320. Relacja z Production Economy Master

Production Economy Master definiuje docelowy katalog i zależności
ekonomiczne.

Ten dokument definiuje sposób ich przechowywania, walidacji i
prezentacji językowej.

------------------------------------------------------------------------

# 321. Relacja z Technology Catalog

Technology Catalog definiuje Discoveries.

Ten dokument określa ich data schema, localization i graph validation.

------------------------------------------------------------------------

# 322. Relacja z Chronicle

Chronicle Engine wybiera wydarzenia.

Localization renderuje ich opis.

------------------------------------------------------------------------

# 323. Relacja z Causality

Causality Engine zwraca fakty i structured causes.

Nie generuje lokalizowanego eseju.

------------------------------------------------------------------------

# 324. Relacja z Architect

Intervention Definition posiada mechaniczne parametry i localization
keys.

UI wyraźnie oddziela direct effect od possible consequences.

------------------------------------------------------------------------

# 325. Relacja z UI

UI otrzymuje: - display strings, - localized values, - read models.

Nie zna logiki tłumaczeń rozproszonej po komponentach.

------------------------------------------------------------------------

# 326. Master Content Principle

> **Jeżeli nowy element świata korzysta z istniejących mechanik,
> powinien być możliwy do dodania głównie przez dane, nie przez nowy
> warunek w kodzie.**

------------------------------------------------------------------------

# 327. Master Localization Principle

> **Jeżeli świat może opisać zdarzenie strukturalnie, powinien móc
> przedstawić je w dowolnym wspieranym języku bez zmiany samej
> historii.**

------------------------------------------------------------------------

# 328. Kryterium końcowe

Content & Localization System jest gotowy, gdy można:

1.  dodać nowe dobro przez definition data,
2.  połączyć je z PM i firmami,
3.  zwalidować graph,
4.  uruchomić świat,
5.  wygenerować Simulation Facts,
6.  pokazać nazwę i opis po angielsku i polsku,
7.  opisać Chronicle event,
8.  wyjaśnić WHY?,
9.  zmienić język bez zmiany World State,
10. zapisać i wczytać świat niezależnie od wybranego locale.

FIRST CAUSE nie powinien posiadać czternastu wersji świata dla
czternastu języków.

Powinien posiadać:

> **jeden deterministyczny świat, jeden zestaw faktów i wiele sposobów
> jego poprawnego językowego przedstawienia.**

------------------------------------------------------------------------

# 329. Następny krok dokumentacyjny

**Aktualizacja 2026-09-16:** poniższa rekomendacja została wykonana —
Master Audit już istnieje i jest zapisem historycznym. Bieżący etap to
M1 według roadmapy v0.2; aktualne decyzje i dostępność źródeł określa
Canonical Decisions.

Historyczna rekomendacja: po tym dokumencie podstawowa seria specyfikacji FIRST CAUSE jest
wystarczająco kompletna, aby wykonać:

**`FIRST-CAUSE-Master-Documentation-Consistency-Implementation-Readiness-Audit-v0.1.md`**

Audyt powinien: - wykryć sprzeczności, - wskazać superseded decisions, -
znaleźć brakujące systemy, - sprawdzić ownership danych, - sprawdzić VS
scope, - sprawdzić gotowość do implementacji, - stworzyć ostateczną
kolejność wdrożenia.

------------------------------------------------------------------------

**KONIEC --- FIRST CAUSE Content & Localization Spec v0.1**
