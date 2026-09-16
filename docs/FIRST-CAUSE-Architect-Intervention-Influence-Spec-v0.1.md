# FIRST CAUSE --- Architect Intervention & Influence Spec v0.1

**Status:** wersja robocza / kanoniczna specyfikacja interwencji
Architekta i propagacji jego wpływu\
**Projekt:** FIRST CAUSE\
**Wersja dokumentu:** 0.1\
**Rola:** zdefiniowanie tego, w jaki sposób gracz jako Architekt może
zmieniać warunki świata, ile kosztują interwencje, jakie mają
ograniczenia, jak stają się przyczynami w Causality Engine oraz jak ich
wpływ słabnie, miesza się z autonomicznymi procesami i tworzy
niezamierzone konsekwencje.

**Dokumenty powiązane:** -
`FIRST-CAUSE-koncepcja-architektura-v0.6.md` -
`FIRST-CAUSE-Simulation-Model-v0.1.md` -
`FIRST-CAUSE-Production-Economy-Master-v0.1-PL.md` -
`FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` (brak w repo; zob. Canonical Decisions §199) -
`FIRST-CAUSE-Entity-Data-Model-v0.1.md` -
`FIRST-CAUSE-Vertical-Slice-Spec-v0.1.md` -
`FIRST-CAUSE-Causality-Engine-Spec-v0.1.md` -
`FIRST-CAUSE-AI-Decision-Model-v0.1.md` -
`FIRST-CAUSE-Simulation-Test-Spec-v0.1.md` -
`FIRST-CAUSE-Chronicle-Historical-Significance-Spec-v0.1.md`

------------------------------------------------------------------------

# 0. Cel dokumentu

FIRST CAUSE nie jest grą, w której gracz bezpośrednio steruje firmami,
mieszkańcami, cenami, technologią lub produkcją.

Gracz jest **Architektem warunków**.

Może zmieniać przyczyny, ale nie wybiera bezpośrednio skutków.

Fundamentalny model:

``` text
ARCHITECT INTERVENTION
        ↓
ROOT FACT
        ↓
SIMULATION SYSTEMS
        ↓
AUTONOMOUS DECISIONS
        ↓
CAUSAL CHAIN
        ↓
CONSEQUENCES
        ↓
HISTORICAL LEGACY
```

Główna zasada:

> **Architekt tworzy przyczynę. Świat decyduje, co z niej wyniknie.**

------------------------------------------------------------------------

# 1. Rola Architekta

Architekt: - nie jest państwem, - nie jest firmą, - nie jest
burmistrzem, - nie jest dowódcą, - nie jest bogiem wydającym
bezpośrednie rozkazy każdej encji.

Architekt może: - zmienić warunki środowiska, - ujawnić lub zmienić
dostępność zasobów, - zmodyfikować warunki populacyjne, - zwiększyć
dostęp do wiedzy, - zmienić określone warunki ekonomiczne, - uruchomić
kontrolowane eksperymenty.

------------------------------------------------------------------------

# 2. Czego Architekt nie robi

Domyślnie Architekt nie może:

-   nakazać firmie powstania,
-   nakazać firmie zatrudnienia X osób,
-   ustawić ceny konkretnego dobra,
-   teleportować dóbr,
-   wymusić migracji do regionu,
-   bezpośrednio awansować osady do miasta,
-   nadać firmie technologii bez mechanizmu dostępności,
-   zagwarantować odkrycia,
-   wymusić prosperity,
-   wymusić kryzysu przez wpis Chronicle.

------------------------------------------------------------------------

# 3. Warunek zamiast rezultatu

Interwencja powinna zmieniać **input systemu**, nie finalny output.

Poprawnie:

``` text
increase soil fertility
→ agricultural productivity opportunity
```

Niepoprawnie:

``` text
increase food production by 50%
```

Poprawnie:

``` text
reveal iron deposit
→ opportunity becomes visible
```

Niepoprawnie:

``` text
create profitable iron mine
```

------------------------------------------------------------------------

# 4. Architect Influence

Kanoniczna skala:

`0–100`

To ograniczony zasób gracza reprezentujący zdolność do ingerowania w
naturalny bieg symulacji.

W Vertical Slice rekomendowany maksymalny stan:

`100`

------------------------------------------------------------------------

# 5. Influence nie jest walutą świata

Influence: - nie istnieje w gospodarce, - nie jest podatkiem, - nie jest
pieniądzem, - nie może być używany przez AI.

To meta-zasób gracza.

------------------------------------------------------------------------

# 6. Influence Balance

``` text
CurrentInfluence
MaxInfluence
ReservedInfluence
AvailableInfluence
```

Zależność:

`AvailableInfluence = CurrentInfluence - ReservedInfluence`

------------------------------------------------------------------------

# 7. Dwa modele kosztu

Interwencje mogą być:

### Instant

Koszt płacony przy wykonaniu.

### Sustained

Część Influence może być: - płacona z góry, - zarezerwowana przez czas
działania, - zużywana okresowo.

Dla VS preferować prostszy model.

------------------------------------------------------------------------

# 8. Kanoniczny koszt interwencji

Koszt powinien zależeć od:

``` text
BaseCost
× MagnitudeModifier
× DurationModifier
× ScopeModifier
× NaturalnessModifier
```

Konceptualnie:

`InfluenceCost = Base × Magnitude × Duration × Scope × Naturalness`

Implementacja może używać modelu addytywno-multiplikatywnego dla
łatwiejszego tuningu.

------------------------------------------------------------------------

# 9. Base Cost

Każda `ArchitectInterventionDefinition` ma `baseInfluenceCost`.

Przykład: - niewielka zmiana lokalna --- niski koszt, - duża zmiana
regionalna --- wysoki, - kontynentalna ingerencja --- bardzo wysoki.

------------------------------------------------------------------------

# 10. Magnitude

Magnitude określa intensywność zmiany.

Przykład: - +5% fertility, - +20% fertility, - +50% fertility

nie mogą kosztować tyle samo.

------------------------------------------------------------------------

# 11. Duration

Interwencja: - jednorazowa, - czasowa, - długotrwała, - permanentna.

Im dłużej sztucznie utrzymuje warunek, tym wyższy koszt.

------------------------------------------------------------------------

# 12. Scope

Zakres: - Point/Entity, - Settlement, - Region, - Multi-Region, -
Continental, - World.

VS powinien skupiać się głównie na Region i pojedynczych encjach.

------------------------------------------------------------------------

# 13. Naturalness

`NaturalnessModifier` mierzy, jak bardzo interwencja odbiega od zmian
możliwych naturalnie w świecie.

Przykład: - niewielkie zwiększenie fertility --- relatywnie naturalne, -
natychmiastowe stworzenie ogromnego złoża w geologicznie niepasującym
regionie --- bardzo nienaturalne.

------------------------------------------------------------------------

# 14. Naturalness ≠ realizm historyczny

Nie chodzi o odtwarzanie naszej historii.

Chodzi o spójność z regułami świata FIRST CAUSE.

------------------------------------------------------------------------

# 15. Intervention Categories

Kanoniczne kategorie:

1.  Environment
2.  Resources
3.  Population
4.  Knowledge
5.  Economy
6.  Experimental Events

------------------------------------------------------------------------

# 16. Environment

Interwencje mogą wpływać na: - fertility, - water access, -
environmental quality, - climate stress, - forest pressure, - local risk
factors.

Nie powinny bezpośrednio tworzyć produkcji.

------------------------------------------------------------------------

# 17. Resources

Możliwe: - reveal deposit, - increase/decrease deposit size w ramach
reguł eksperymentu, - change quality, - change accessibility, - create
plausible deposit w sandboxie.

Zmiana zasobu wpływa dopiero na ekonomiczne możliwości.

------------------------------------------------------------------------

# 18. Population

Możliwe: - dodać początkową populację w eksperymencie, - zmienić lokalny
population shock, - przesiedlić kontrolowaną populację tylko jako jawna
interwencja eksperymentalna.

Nie należy używać tej kategorii do ręcznego sterowania normalną
migracją.

------------------------------------------------------------------------

# 19. Knowledge

Możliwe: - knowledge boost w domenie, - knowledge exposure, - imported
knowledge seed, - specialist capacity boost, - reveal concept/discovery
conditions.

Nie oznacza automatycznej adopcji.

------------------------------------------------------------------------

# 20. Economy

Architekt może zmieniać warunki takie jak: - dostępność kapitału
eksperymentalnego, - transport friction, - market access, - temporary
demand/supply condition, - infrastrukturalny warunek eksperymentalny.

Nie ustawia bezpośrednio ceny końcowej.

------------------------------------------------------------------------

# 21. Experimental Events

Służą do sandboxowych testów przyczynowych.

Przykłady: - drought, - flood, - sudden resource reveal, - knowledge
shock, - temporary trade disruption.

Muszą być jawnie oznaczone jako interwencje Architekta.

------------------------------------------------------------------------

# 22. Intervention Definition

``` yaml
ArchitectInterventionDefinition:
  id:
  nameKey:
  category:
  descriptionKey:

  allowedScopes:
  targetRules:

  parameters:
  constraints:

  baseInfluenceCost:
  magnitudeCost:
  durationCost:
  scopeCost:
  naturalnessCost:

  cooldown:
  stackingPolicy:

  rootFactType:
  implementationPhase:
```

------------------------------------------------------------------------

# 23. Intervention Instance

``` yaml
ArchitectInterventionInstance:
  id:
  definitionId:

  createdTick:
  startTick:
  endTick:

  target:
    scopeType:
    entityIds:

  parameters:

  cost:
    base:
    magnitude:
    duration:
    scope:
    naturalness:
    total:

  status:

  rootFactIds:
  majorConsequenceFactIds:
```

------------------------------------------------------------------------

# 24. Status interwencji

``` text
PLANNED
ACTIVE
COMPLETED
CANCELLED
FAILED
```

`FAILED` oznacza problem wykonania interwencji, nie brak oczekiwanego
skutku.

------------------------------------------------------------------------

# 25. Brak oczekiwanego skutku ≠ Failed

Jeżeli Architekt ujawni złoże, ale nie powstaje kopalnia:

interwencja jest `COMPLETED`.

Świat po prostu nie wykorzystał okazji.

------------------------------------------------------------------------

# 26. Validation przed wykonaniem

System sprawdza: - target istnieje, - scope dozwolony, - parametry w
zakresie, - Influence wystarcza, - cooldown, - stacking, - world rule
compatibility.

------------------------------------------------------------------------

# 27. Preview

Przed zatwierdzeniem UI może pokazać: - koszt, - bezpośrednio zmieniany
parametr, - zakres, - czas, - możliwe systemy dotknięte.

Nie pokazuje gwarantowanego rezultatu.

------------------------------------------------------------------------

# 28. Preview --- zakaz prognozy jako obietnicy

Nie:

> Ta interwencja stworzy miasto.

Można:

> Może zwiększyć atrakcyjność gospodarczą regionu, jeśli zasób okaże się
> opłacalny do eksploatacji.

------------------------------------------------------------------------

# 29. Known Direct Effect

UI powinno jasno oddzielić:

**Gwarantowana zmiana warunku** od **Możliwy skutek symulacji**.

------------------------------------------------------------------------

# 30. Root Fact

Każda wykonana interwencja tworzy co najmniej jeden `SimulationFact`
typu root.

Przykład:

``` yaml
type: architect_resource_reveal
subject: deposit_iron_01
architect:
  influenced: true
  interventionId: intervention_0042
  influenceStrength: 1.0
```

------------------------------------------------------------------------

# 31. Root Fact jest punktem causalnym

Wszystkie późniejsze konsekwencje mogą wskazywać na Root Fact poprzez
Causal Edges.

------------------------------------------------------------------------

# 32. Direct Architect Influence

Bezpośredni efekt interwencji:

`ArchitectInfluence = 1.0` wewnętrznie

lub `100%` w UI.

------------------------------------------------------------------------

# 33. Propagated Architect Influence

Potomny fakt otrzymuje część wpływu.

Konceptualnie:

`ChildInfluence = ParentInfluence × CausalContribution × Decay`

------------------------------------------------------------------------

# 34. Multiple Parents

Jeśli skutek ma wiele przyczyn:

-   Architect Influence nie może ignorować naturalnych przyczyn,
-   udział Architekta powinien odpowiadać wkładowi ścieżek związanych z
    interwencją.

------------------------------------------------------------------------

# 35. Influence Attribution

Przykład:

``` text
Mine Founded:
40% discovered deposit
30% high iron price
20% available labor
10% transport access
```

Jeżeli tylko discovery pochodziło od Architekta:

wpływ gracza na founding nie jest automatycznie 100%.

------------------------------------------------------------------------

# 36. Normalized Contribution

Causal Engine powinien wykorzystywać znormalizowane contribution
factors, aby uniknąć nadmiernego przypisywania wszystkiego Architektowi.

------------------------------------------------------------------------

# 37. Influence Decay

Wpływ powinien zwykle słabnąć wraz z: - causal depth, - upływem czasu, -
pojawieniem się nowych niezależnych przyczyn, - rozgałęzieniem łańcucha.

------------------------------------------------------------------------

# 38. Decay nie może zerować ważnego legacy zbyt szybko

Jeżeli Root Fact rzeczywiście pozostaje silną przyczyną transformacji,
jego wpływ może utrzymywać się przez dekady.

------------------------------------------------------------------------

# 39. Influence Floor

Poniżej progu: - nie pokazujemy wpływu Architekta publicznie, - można
zachować TRACE w debug.

------------------------------------------------------------------------

# 40. Public Influence Levels

Rekomendacja:

-   Direct
-   Strong
-   Significant
-   Minor
-   Trace
-   None

------------------------------------------------------------------------

# 41. Przykładowe progi

Do tuningu:

``` text
Direct      80–100
Strong      50–79
Significant 25–49
Minor       10–24
Trace        1–9
None         0
```

------------------------------------------------------------------------

# 42. Causal Depth

UI może pokazywać:

``` text
Direct consequence
2nd-order consequence
3rd-order consequence
Long-term legacy
```

Nie musi pokazywać surowej liczby edge'ów.

------------------------------------------------------------------------

# 43. Time Distance

Oprócz causal depth rejestrować: - ticksSinceIntervention, -
yearsSinceIntervention.

------------------------------------------------------------------------

# 44. Unintended Consequence

Konsekwencja może zostać oznaczona jako niezamierzona, jeśli: - jest
pośrednia, - należy do innego systemu niż bezpośredni target, - pojawia
się po dłuższym łańcuchu.

Nie zakładamy psychologicznej intencji gracza.

------------------------------------------------------------------------

# 45. Positive/Negative/Mixed

Opcjonalna klasyfikacja skutku: - positive, - negative, - mixed, -
neutral.

Musi wynikać z metryk.

Nie jest oceną moralną.

------------------------------------------------------------------------

# 46. Butterfly Effect

Butterfly Effect to widok/analiza długiego łańcucha konsekwencji jednej
interwencji.

Nie osobny generator wydarzeń.

------------------------------------------------------------------------

# 47. Butterfly Query

``` text
getInterventionConsequences(interventionId)
```

Powinno zwrócić: - direct effects, - major descendants, - unintended
descendants, - historical legacy, - causal paths.

------------------------------------------------------------------------

# 48. Butterfly Ranking

Nie pokazujemy wszystkich potomków.

Ranking uwzględnia: - Architect Influence, - Historical Significance, -
causal strength, - scope, - novelty.

------------------------------------------------------------------------

# 49. Anti-Butterfly Explosion

Interwencja po 500 latach nie może zostać uznana za przyczynę
wszystkiego.

Stosować: - decay, - minimum contribution, - significance threshold, -
path pruning, - independent-cause dilution.

------------------------------------------------------------------------

# 50. Independent Cause Dilution

Im więcej nowych niezależnych przyczyn dominuje późniejszy skutek, tym
mniejszy udział pierwotnej interwencji.

------------------------------------------------------------------------

# 51. Converging Interventions

Kilka interwencji może prowadzić do jednego skutku.

Każda zachowuje osobny attribution.

------------------------------------------------------------------------

# 52. Competing Interventions

Interwencje mogą działać w przeciwnych kierunkach.

Przykład: - zwiększenie fertility, - późniejsza susza.

Causal model powinien zachować oba wpływy.

------------------------------------------------------------------------

# 53. Intervention Stacking

Każda definicja określa: - allowed, - limited, - forbidden.

------------------------------------------------------------------------

# 54. Stacking Example

Nie powinno być możliwe bez końca: `+10 fertility` × 20.

Możliwe rozwiązania: - cap, - diminishing returns, - cooldown, - rising
cost.

------------------------------------------------------------------------

# 55. Diminishing Returns

Kolejna ingerencja w ten sam parametr może kosztować więcej.

Konceptualnie:

`RepeatedInterventionModifier > 1`

------------------------------------------------------------------------

# 56. Intervention Fatigue

Opcjonalny system: częste ingerencje w ten sam region zwiększają koszt.

Nie jest obowiązkowy dla VS.

------------------------------------------------------------------------

# 57. Cooldown

Cooldown ogranicza: - spam, - mikrozarządzanie, - resetowanie wyniku co
tick.

------------------------------------------------------------------------

# 58. Cooldown Types

-   per definition,
-   per target,
-   per category,
-   global.

VS preferuje: - per definition + target.

------------------------------------------------------------------------

# 59. Minimum Duration

Niektóre sustained interventions mogą wymagać minimalnego czasu.

------------------------------------------------------------------------

# 60. Cancellation

Jeżeli sustained intervention można anulować: - zatrzymuje dalsze
utrzymywanie efektu, - nie cofa automatycznie konsekwencji, które już
powstały.

------------------------------------------------------------------------

# 61. Irreversibility

Niektóre efekty są nieodwracalne: - ujawnione złoże pozostaje znane, -
powstała firma nie znika po anulowaniu interwencji, - migranci nie
teleportują się z powrotem.

------------------------------------------------------------------------

# 62. Reversal

Odwrócenie warunku wymaga nowej interwencji lub naturalnego procesu.

------------------------------------------------------------------------

# 63. Influence Regeneration

Do decyzji tuningowej.

Możliwe modele: 1. stała regeneracja, 2. powolna regeneracja miesięczna,
3. regeneracja zależna od czasu bez ingerencji, 4. scenariuszowy limit
bez regeneracji.

------------------------------------------------------------------------

# 64. Rekomendacja VS

Dla pierwszego Vertical Slice:

-   MaxInfluence = 100,
-   powolna regeneracja,
-   niewielka liczba interwencji,
-   koszt ma wymuszać wybór.

Dokładna liczba punktów/tick pozostaje tuningiem.

------------------------------------------------------------------------

# 65. Influence jako tempo eksperymentowania

Cel: gracz nie powinien klikać kilkudziesięciu zmian miesięcznie.

Powinien: - wprowadzić przyczynę, - obserwować, - analizować, -
zdecydować, czy ingerować ponownie.

------------------------------------------------------------------------

# 66. Core Loop Architekta

``` text
OBSERVE
→ ASK WHY?
→ FORM HYPOTHESIS
→ INTERVENE
→ SIMULATE
→ OBSERVE CONSEQUENCES
→ ANALYZE BUTTERFLY EFFECT
→ INTERVENE AGAIN
```

------------------------------------------------------------------------

# 67. Interwencja jako eksperyment

FIRST CAUSE powinien wspierać myślenie:

> „Co się stanie, jeśli...?"

Nie: \> „Klikam bonus +20% do produkcji."

------------------------------------------------------------------------

# 68. Hypothesis Note

Opcjonalnie gracz może dodać własną notatkę: - „Spodziewam się rozwoju
górnictwa".

Nie wpływa na symulację.

Może później pomóc porównać oczekiwanie z wynikiem.

------------------------------------------------------------------------

# 69. Outcome Review

Po określonym czasie UI może pokazać: - direct effect, - major
consequences, - unexpected consequences, - no-effect reasons.

------------------------------------------------------------------------

# 70. No Effect

Interwencja może mieć minimalny wpływ.

Przykład: knowledge boost w regionie bez: - kapitału, -
infrastruktury, - odpowiednich firm.

To legalny rezultat.

------------------------------------------------------------------------

# 71. WHY NOT? po interwencji

System powinien umieć odpowiedzieć:

> Dlaczego interwencja nie doprowadziła do oczekiwanego rozwoju?

Na podstawie: - AI Decision Snapshots, - constraints, - market
conditions, - technology availability.

------------------------------------------------------------------------

# 72. Intervention Outcome Classification

Opcjonalne:

-   NO_MEANINGFUL_EFFECT
-   LOCAL_EFFECT
-   STRUCTURAL_EFFECT
-   UNINTENDED_EFFECT
-   TRANSFORMATIVE_EFFECT

Klasyfikacja opisuje, nie steruje.

------------------------------------------------------------------------

# 73. Historical Legacy

Interwencja może zyskać `LegacyScore`.

To nie to samo co Architect Influence.

Legacy mierzy trwałość i znaczenie skutków.

------------------------------------------------------------------------

# 74. Legacy Components

-   descendant significance,
-   duration,
-   persistent infrastructure,
-   population shift,
-   technology shift,
-   economic restructuring,
-   geographic spread.

------------------------------------------------------------------------

# 75. High Influence, Low Legacy

Przykład: Architekt bezpośrednio zmienia lokalny parametr na miesiąc.

Wpływ bezpośredni = 100%.

Po 20 latach brak znaczących skutków.

Legacy = niskie.

------------------------------------------------------------------------

# 76. Low Remaining Influence, High Legacy

Interwencja sprzed 150 lat może mieć dziś niewielki bezpośredni
attribution, ale historycznie uruchomiła transformację regionu.

Chronicle może uznać ją za ważny historical root.

------------------------------------------------------------------------

# 77. Architect Legacy View

Powinien pokazywać:

``` text
Intervention
Immediate Change
Major Consequences
Unintended Consequences
Historical Turning Points
Current Surviving Legacy
```

------------------------------------------------------------------------

# 78. Intervention Timeline

Przykład:

``` text
Year 12 — Iron deposit revealed
Year 15 — Mine founded
Year 21 — Employment boom
Year 28 — Migration wave
Year 43 — Town → City
Year 66 — Railway connection
Year 91 — Resource decline
Year 107 — Industrial diversification
```

Tylko istniejące causal descendants.

------------------------------------------------------------------------

# 79. Natural World Autonomy

Po interwencji świat musi wrócić do normalnych systemów.

Nie tworzymy osobnej „ścieżki gracza".

------------------------------------------------------------------------

# 80. No Hidden Player Favor

AI nie może: - preferować regionu tylko dlatego, że gracz tam
ingerował, - zwiększać szans sukcesu dla satysfakcji gracza.

------------------------------------------------------------------------

# 81. No Punishment Bias

Świat nie powinien też sztucznie karać gracza.

Negatywne skutki wynikają z systemów.

------------------------------------------------------------------------

# 82. Intervention Visibility to AI

AI widzi tylko fakty świata, które powinno znać.

Nie widzi meta-informacji: `this was caused by player`.

------------------------------------------------------------------------

# 83. Example --- Resource Reveal

Architekt: `Reveal Iron Deposit`

Bezpośredni skutek: - deposit status UNKNOWN → DISCOVERED.

Potencjalne dalsze: - OpportunityScore mine ↑, - founding, -
employment, - migration, - trade.

Żaden dalszy skutek nie jest gwarantowany.

------------------------------------------------------------------------

# 84. Example --- Knowledge Boost

Architekt zwiększa Mechanics Knowledge.

Możliwe: - eligibility discovery ↑, - diffusion/adoption capacity ↑.

Nie: - automatyczne Machinery Factory.

------------------------------------------------------------------------

# 85. Example --- Fertility Increase

Bezpośrednio: - fertility ↑.

Dalsze możliwe: - agricultural output opportunity, - lower food price, -
exports, - population attraction.

------------------------------------------------------------------------

# 86. Example --- Trade Friction Reduction

Bezpośrednio: - border/transport friction ↓.

Możliwe: - EffectiveDistance ↓, - trade ↑, - specialization, -
competition, - local company closure.

Pozytywny i negatywny skutek mogą współistnieć.

------------------------------------------------------------------------

# 87. Example --- Drought

Bezpośrednio: - environmental/water/fertility shock.

Możliwe: - food production ↓, - prices ↑, - import ↑, - migration, -
technology pressure.

------------------------------------------------------------------------

# 88. Black Mountain Intervention Test

Setup: - hidden iron deposit.

Architekt: - reveal deposit.

PASS: - Root Fact powstaje, - AI otrzymuje nową informację zgodnie z
modelem, - dalszy rozwój jest autonomiczny.

------------------------------------------------------------------------

# 89. Black Mountain --- Failure Variant

Transport jest bardzo drogi.

Expected: - deposit revealed, - brak mine founding, - WHY NOT? pokazuje
transport/margin, - intervention status COMPLETED.

------------------------------------------------------------------------

# 90. Black Mountain --- Butterfly Variant

Sprzyjające warunki.

Po dekadach: - mine, - jobs, - migration, - settlement growth.

System potrafi prześledzić ścieżkę do intervention root.

------------------------------------------------------------------------

# 91. Black Mountain --- Bust Variant

Po depletion: - closure, - unemployment, - outmigration.

Kryzys może być pośrednią konsekwencją tej samej pierwotnej interwencji.

Nie oznacza, że Architekt „bezpośrednio spowodował bezrobocie".

------------------------------------------------------------------------

# 92. Attribution Language

UI powinno mówić ostrożnie.

Dobrze: \> Kryzys był odległą konsekwencją boomu rozpoczętego po
ujawnieniu złoża.

Źle: \> Twoja decyzja spowodowała bezrobocie 80 lat później.

------------------------------------------------------------------------

# 93. Counterfactual Limitation

Bez równoległej symulacji świata bez interwencji nie możemy twierdzić,
że dany skutek „na pewno by nie wystąpił".

Attribution oznacza causal contribution w rzeczywiście zasymulowanym
świecie.

------------------------------------------------------------------------

# 94. Parallel Worlds --- przyszłość

W przyszłości system może umożliwić: - fork przed interwencją, - world A
z interwencją, - world B bez interwencji.

To pozwoli na silniejszą analizę kontrfaktyczną.

Nie jest wymagane w v0.1.

------------------------------------------------------------------------

# 95. Intervention Availability

Nie wszystkie interwencje muszą być dostępne od razu.

Można zależnie od trybu gry: - udostępnić pełny sandbox, - ograniczyć
zestaw, - stopniowo odblokować kategorie.

Mechanika świata pozostaje ta sama.

------------------------------------------------------------------------

# 96. Game Modes --- zgodność architektoniczna

System powinien wspierać później:

### Observer

brak lub minimalne interwencje.

### Architect

standardowy Influence.

### Sandbox

bardzo duży/nielimitowany Influence.

### Experiment

ściśle kontrolowane testy.

------------------------------------------------------------------------

# 97. Sandbox nie wyłącza causality

Nawet przy nielimitowanym Influence: - każda interwencja tworzy Root
Fact, - skutki pozostają śledzone.

------------------------------------------------------------------------

# 98. Experiment Mode

Może pozwalać: - ustawić seed, - wybrać region, - zastosować
interwencję, - uruchomić X lat, - porównać metryki.

------------------------------------------------------------------------

# 99. Intervention Presets

UI może oferować: - Small, - Medium, - Large

dla magnitude/duration.

Wewnętrznie nadal są jawne parametry.

------------------------------------------------------------------------

# 100. Advanced Parameters

Zaawansowany gracz może opcjonalnie ustawiać dokładne parametry, jeśli
nie narusza to filozofii gry.

------------------------------------------------------------------------

# 101. Cost Preview

UI:

``` text
Base                 6
Magnitude            ×1.4
Duration             ×1.0
Scope                ×1.2
Naturalness          ×1.1
Estimated Cost       11
```

Szczegóły można ukryć w tooltipie.

------------------------------------------------------------------------

# 102. Cost Transparency

Gracz powinien rozumieć, dlaczego interwencja kosztuje więcej.

------------------------------------------------------------------------

# 103. Naturalness Preview

Może używać kategorii: - Natural - Plausible - Unusual - Extreme

zamiast surowego mnożnika w głównym UI.

------------------------------------------------------------------------

# 104. Scope Cost Scaling

Koszt nie powinien rosnąć wyłącznie liniowo z liczbą regionów.

Interwencja obejmująca 100 regionów powinna być bardzo droga.

------------------------------------------------------------------------

# 105. Magnitude Cost Scaling

Duże magnitude może mieć koszt superliniowy, aby uniknąć opłacalności
jednej ekstremalnej ingerencji.

------------------------------------------------------------------------

# 106. Duration Cost Scaling

Permanentna zmiana powinna kosztować znacząco więcej niż krótki shock.

------------------------------------------------------------------------

# 107. Cost Cap/Floor

Każda interwencja: - minimalny koszt \> 0, jeśli wpływa na świat, -
maksymalny koszt może blokować wykonanie przy standardowym Influence.

------------------------------------------------------------------------

# 108. Free Actions

Darmowe: - obserwacja, - WHY?, - filtrowanie, - analiza, - Chronicle, -
porównywanie danych, - własne notatki.

Influence płaci się za zmianę świata, nie za wiedzę UI.

------------------------------------------------------------------------

# 109. Information Intervention

Jeśli Architekt ujawnia **sobie** informacje bez zmiany wiedzy świata:
to nie musi być Simulation Fact.

Jeśli ujawnia złoże **światu/aktorom**: musi być interwencją causalną.

------------------------------------------------------------------------

# 110. Meta Observation vs World Knowledge

To rozróżnienie jest kanoniczne.

Gracz może znać dane symulacji jako obserwator, ale AI używa tylko
danych dostępnych w świecie.

------------------------------------------------------------------------

# 111. Intervention Confirmation

Przed kosztowną interwencją: - target, - parametr, - koszt, -
duration, - direct effect

muszą być jasne.

------------------------------------------------------------------------

# 112. Undo

Nie ma klasycznego Undo po wykonaniu interwencji w aktywnym świecie.

Możliwe: - wcześniejszy save, - przyszły Parallel World fork.

------------------------------------------------------------------------

# 113. Intervention History

Każda interwencja jest trwale zapisana: - data, - koszt, - target, -
parametry, - skutki.

------------------------------------------------------------------------

# 114. Influence Ledger

Rejestr:

``` yaml
InfluenceTransaction:
  tick:
  interventionId:
  type:
  amount:
  balanceAfter:
```

Typy: - SPEND - RESERVE - RELEASE - REGENERATE - REFUND --- tylko przy
technicznym niewykonaniu.

------------------------------------------------------------------------

# 115. Refund Policy

Brak oczekiwanego efektu nie daje refund.

Refund tylko gdy: - interwencja nie została zastosowana z powodu
błędu/validacji.

------------------------------------------------------------------------

# 116. Influence Regeneration Fact

Regeneracja Influence jest meta-systemem i nie musi tworzyć Simulation
Fact.

------------------------------------------------------------------------

# 117. Intervention Fact Types

Minimum: - architect_intervention_started -
architect_parameter_changed - architect_resource_revealed -
architect_knowledge_boosted - architect_environment_changed -
architect_experiment_triggered - architect_intervention_ended

------------------------------------------------------------------------

# 118. Causal Edge Policy

Root Fact → bezpośredni skutek: - typ `architect_direct`.

Dalsze: - zwykłe mechaniczne edge types systemów.

Nie oznaczamy każdego edge jako „architect".

------------------------------------------------------------------------

# 119. Architect Attribution jest metadanym ścieżki

Każdy potomny fact może posiadać: - intervention attribution map, -
influence strength.

------------------------------------------------------------------------

# 120. Attribution Map

``` yaml
architectAttribution:
  intervention_001: 0.42
  intervention_017: 0.11
```

Przy dużej liczbie interwencji przechowywać tylko wartości powyżej
progu.

------------------------------------------------------------------------

# 121. Attribution Normalization

Suma attribution nie musi wynosić 1, jeśli reszta wpływu pochodzi z
naturalnych przyczyn.

Nie wolno sztucznie normalizować wszystkich skutków do „100% gracza".

------------------------------------------------------------------------

# 122. Attribution Compression

Po długim czasie: - Trace attribution może zostać usunięte, - ważne
legacy zachowane przez anchors/threads.

------------------------------------------------------------------------

# 123. Historical Anchor

Interwencja o dużym legacy może stać się permanent historical anchor.

------------------------------------------------------------------------

# 124. Chronicle Integration

Chronicle może raportować: - interwencję, - bezpośredni efekt, - major
consequence, - unintended consequence, - turning point, - legacy.

------------------------------------------------------------------------

# 125. Chronicle Sensitivity

Interwencja sama może być zapisana zawsze w osobistej osi Architekta,
nawet jeśli jej Historical Significance jest małe.

World Chronicle nadal stosuje significance thresholds.

------------------------------------------------------------------------

# 126. Architect Journal

Osobny widok może zawierać wszystkie interwencje: - nawet małe, - wraz z
kosztami i rezultatami.

To nie jest to samo co World Chronicle.

------------------------------------------------------------------------

# 127. Intervention Evaluation Window

UI może proponować przegląd: - po 1 roku, - 5 latach, - 20 latach,

zależnie od typu interwencji.

Nie zatrzymuje automatycznie symulacji.

------------------------------------------------------------------------

# 128. Dynamic Evaluation

System może oznaczyć: **Nowa znacząca konsekwencja Twojej interwencji**

jeśli descendant przekroczy significance threshold.

------------------------------------------------------------------------

# 129. Notification Spam Control

Nie powiadamiać o każdym potomku.

Tylko: - Major+, - Turning Point, - unexpected high-significance
consequence.

------------------------------------------------------------------------

# 130. Intervention Metrics

Mierzyć: - count, - Influence spent, - direct facts, - significant
descendants, - average causal depth, - legacy score, - geographic
spread.

------------------------------------------------------------------------

# 131. Player Score

FIRST CAUSE nie wymaga klasycznego wyniku za „dobre" interwencje.

Nie nagradzamy automatycznie prosperity.

Celem jest obserwacja i eksperyment.

------------------------------------------------------------------------

# 132. No Optimal Build Requirement

System Influence powinien tworzyć ograniczenia i wybory, ale nie
wymuszać jednego „meta builda".

------------------------------------------------------------------------

# 133. Intervention Balance

Interwencja jest podejrzana, jeśli: - zawsze opłaca się ją używać, -
zawsze prowadzi do tego samego efektu, - jest bez ryzyka/alternatywy, -
omija autonomiczne systemy.

------------------------------------------------------------------------

# 134. Balance Audit

Dla każdej interwencji testować: - różne regiony, - różne seedy, - różne
warunki, - brak efektu, - pozytywne, - negatywne/mieszane konsekwencje.

------------------------------------------------------------------------

# 135. Test --- Influence Cost

FC-ARCH-010

Większe: - magnitude, - duration, - scope, - unnaturalness

nie może kosztować mniej niż odpowiednia mniejsza wersja bez jawnego
wyjątku.

------------------------------------------------------------------------

# 136. Test --- Insufficient Influence

FC-ARCH-011

Brak Influence: - interwencja nie jest wykonywana, - World State bez
zmian, - brak Root Fact.

------------------------------------------------------------------------

# 137. Test --- Root Fact

FC-ARCH-012

Wykonana interwencja: - tworzy prawidłowy Root Fact, - posiada
interventionId.

------------------------------------------------------------------------

# 138. Test --- Direct Influence

FC-ARCH-013

Bezpośrednio zmieniony parametr: - attribution do interwencji = Direct.

------------------------------------------------------------------------

# 139. Test --- Propagation

FC-ARCH-014

Potomny skutek: - dziedziczy część wpływu zgodnie z Causal Contribution.

------------------------------------------------------------------------

# 140. Test --- Decay

FC-ARCH-015

Przy równych warunkach dalsza causal depth: - nie zwiększa automatycznie
attribution.

------------------------------------------------------------------------

# 141. Test --- Independent Dilution

FC-ARCH-016

Nowe dominujące naturalne przyczyny: - zmniejszają względny udział
starej interwencji.

------------------------------------------------------------------------

# 142. Test --- No Global Contamination

FC-ARCH-017

Po długiej symulacji: - niezależne wydarzenia nie mają attribution do
interwencji.

P0 dla causal integrity.

------------------------------------------------------------------------

# 143. Test --- Multiple Interventions

FC-ARCH-018

Skutek może zachować attribution map dla kilku interwencji.

------------------------------------------------------------------------

# 144. Test --- Cancellation

FC-ARCH-019

Anulowanie sustained intervention: - kończy dalszy direct effect, - nie
cofa już zaszłych konsekwencji.

------------------------------------------------------------------------

# 145. Test --- Cooldown

FC-ARCH-020

Powtórzenie interwencji w cooldown: - zablokowane lub odpowiednio
obsłużone.

------------------------------------------------------------------------

# 146. Test --- Stacking

FC-ARCH-021

Nie można przekroczyć zdefiniowanych capów przez spam.

------------------------------------------------------------------------

# 147. Test --- AI Independence

FC-ARCH-022

AI nie otrzymuje meta-flag „player wants this outcome".

------------------------------------------------------------------------

# 148. Test --- No Guaranteed Outcome

FC-ARCH-023

Ta sama interwencja w różnych warunkach może prowadzić do różnych
rezultatów.

------------------------------------------------------------------------

# 149. Test --- WHY NOT?

FC-ARCH-024

Brak spodziewanego skutku: - możliwy do wyjaśnienia realnymi
constraints.

------------------------------------------------------------------------

# 150. Test --- Butterfly Query

FC-ARCH-025

Zwraca tylko causal descendants powiązanych z intervention root.

------------------------------------------------------------------------

# 151. Test --- Legacy

FC-ARCH-026

Po zamknięciu pierwotnego procesu trwałe skutki mogą pozostać jako
legacy.

------------------------------------------------------------------------

# 152. Test --- Save/Load

FC-ARCH-027

Po load zachowane: - Influence, - ledger, - interventions, -
attribution, - cooldown, - causal roots.

------------------------------------------------------------------------

# 153. Test --- Determinism

FC-ARCH-028

Ten sam seed + te same interwencje w tych samych tickach: - identyczny
wynik.

------------------------------------------------------------------------

# 154. Test --- Chronicle

FC-ARCH-029

Wpis oznaczony jako konsekwencja gracza: - posiada causal path do
interwencji.

------------------------------------------------------------------------

# 155. Test --- 200 Years

FC-ARCH-030

Po 200 latach: - brak attribution explosion, - historyczne legacy
dostępne, - niezależne regiony pozostają autonomiczne.

------------------------------------------------------------------------

# 156. Vertical Slice --- zestaw interwencji

Rekomendowane około 5 aktywnych interwencji.

------------------------------------------------------------------------

# 157. VS-INT-01 --- Reveal Resource Deposit

Kategoria: Resources.

Target: ResourceDeposit/Region.

Direct: status → DISCOVERED.

Cel testowy: Black Mountain.

------------------------------------------------------------------------

# 158. VS-INT-02 --- Fertility Shift

Kategoria: Environment.

Target: Region.

Parametr: kontrolowana zmiana fertility.

Cel: Food Valley / agricultural economy.

------------------------------------------------------------------------

# 159. VS-INT-03 --- Knowledge Injection

Kategoria: Knowledge.

Target: Region + Knowledge Domain.

Direct: Knowledge +X.

Nie gwarantuje discovery.

------------------------------------------------------------------------

# 160. VS-INT-04 --- Trade Friction Shift

Kategoria: Economy.

Target: Connection.

Direct: border/transport friction modifier.

Cel: Trade Corridor.

------------------------------------------------------------------------

# 161. VS-INT-05 --- Environmental Shock

Kategoria: Experimental Events.

Target: Region.

Przykład: temporary drought.

Cel: sprawdzenie shortage/adaptation/causality.

------------------------------------------------------------------------

# 162. Opcjonalna VS-INT-06 --- Population Seed

Tylko dla eksperymentalnego setupu.

Nie jako normalne narzędzie do sterowania migracją.

------------------------------------------------------------------------

# 163. VS Cost Philosophy

Koszty powinny umożliwiać: - kilka znaczących interwencji, - nie ciągły
spam.

Gracz ma obserwować konsekwencje między ingerencjami.

------------------------------------------------------------------------

# 164. VS Influence Regeneration

Powinna być wystarczająco wolna, aby czas był zasobem eksperymentu.

Dokładna wartość do tuningu po playtestach.

------------------------------------------------------------------------

# 165. VS UI --- Architect Panel

Minimalnie:

``` text
Influence: 74 / 100

Selected Region: Black Mountain

Available Interventions
- Reveal Resource
- Fertility Shift
- Knowledge Injection
- Trade Friction
- Environmental Shock
```

------------------------------------------------------------------------

# 166. VS UI --- Intervention Detail

Pokazuje: - co zmienia, - target, - magnitude, - duration, - cost, -
naturalness, - direct guaranteed effect, - possible affected systems.

------------------------------------------------------------------------

# 167. VS UI --- Confirmation

Przycisk: `APPLY INTERVENTION`

Nie: `CREATE MINING BOOM`.

------------------------------------------------------------------------

# 168. VS UI --- Outcome Panel

Po czasie:

``` text
INTERVENTION
Reveal Iron Deposit

DIRECT EFFECT
Iron deposit discovered

MAJOR CONSEQUENCES
Mine founded
Employment +...
Migration +...

UNEXPECTED CONSEQUENCES
Housing pressure +...

CURRENT LEGACY
...
```

------------------------------------------------------------------------

# 169. VS UI --- No Effect

Jeżeli brak większych skutków:

``` text
No major downstream consequence detected.

Main limiting factors:
- transport cost
- low expected margin
```

------------------------------------------------------------------------

# 170. Anti-AI UI

Intervention Panel powinien być: - analityczny, - konkretny, - bez
magicznych ikon, - bez „boskich mocy" w stylistyce fantasy.

------------------------------------------------------------------------

# 171. Naming

Preferować nazwy funkcjonalne: - Reveal Deposit - Increase Fertility -
Knowledge Injection - Reduce Trade Friction - Trigger Drought

Nie: - Bless the Land - Divine Inspiration - Hand of Prosperity.

------------------------------------------------------------------------

# 172. Tooltips

Powinny wyjaśniać mechanikę: \> Zwiększa wiedzę regionalną w wybranej
domenie. Może zwiększyć szanse odkryć i zdolność absorpcji technologii,
ale nie gwarantuje wdrożenia.

------------------------------------------------------------------------

# 173. Architect Command API

Przykładowo:

``` text
previewIntervention(definitionId, target, parameters)
applyIntervention(...)
cancelIntervention(interventionId)
getInterventionHistory()
getInterventionConsequences(interventionId)
getInfluenceLedger()
```

------------------------------------------------------------------------

# 174. Command Validation

`applyIntervention` jest jedynym kontrolowanym sposobem zmiany świata
przez Architekta.

UI nie edytuje bezpośrednio encji.

------------------------------------------------------------------------

# 175. Read Models

-   ArchitectOverviewView
-   InterventionCatalogView
-   InterventionPreviewView
-   InterventionHistoryView
-   ArchitectLegacyView
-   ButterflyEffectView

------------------------------------------------------------------------

# 176. Separation of Concerns

``` text
Architect System
= definiuje i wykonuje zmianę warunku

Simulation Systems
= reagują na nowy stan

AI Decision Model
= podejmuje autonomiczne decyzje

Causality Engine
= zapisuje przyczyny

Historical Significance
= ocenia wagę

Chronicle
= pokazuje historię
```

------------------------------------------------------------------------

# 177. Module Layout

Rekomendacja:

``` text
src/architect/
  influence/
  interventions/
  validation/
  costs/
  commands/
  attribution/
  legacy/
  read-models/
```

------------------------------------------------------------------------

# 178. Config Data

``` text
data/architect/
  intervention-definitions.*
  influence-balance.*
  cost-modifiers.*
  scope-rules.*
```

------------------------------------------------------------------------

# 179. Brak wyjątków scenariuszowych

Black Mountain używa tych samych interwencji co dowolny region.

------------------------------------------------------------------------

# 180. Content Extension

Nowa interwencja powinna być możliwa głównie przez: - definition, -
parameter effect handler, - validation, - cost config, - causal fact
mapping.

Nie przez przebudowę systemu Influence.

------------------------------------------------------------------------

# 181. Effect Handler

Każdy typ interwencji ma jawny handler zmieniający tylko dozwolone pola.

------------------------------------------------------------------------

# 182. Transactional Application

Interwencja:

1.  validate,
2.  calculate cost,
3.  reserve/spend Influence,
4.  mutate allowed state,
5.  validate state,
6.  create Root Fact,
7.  commit.

Jeśli krok technicznie się nie powiedzie: - rollback.

------------------------------------------------------------------------

# 183. Atomicity

Nie może wystąpić stan: - Influence wydane, - parametr niezmieniony, -
brak Root Fact.

------------------------------------------------------------------------

# 184. Deterministic Ordering

Jeżeli kilka interwencji wykonano w tym samym ticku: - mają jawny
deterministic order.

------------------------------------------------------------------------

# 185. Intervention Timestamp

Przechowywać: - createdTick, - appliedTick, - completedTick.

------------------------------------------------------------------------

# 186. Scheduled Intervention --- przyszłość

Możliwe później: - start za X miesięcy.

Nie wymagane VS.

------------------------------------------------------------------------

# 187. Repeated Experiments

W trybie eksperymentalnym można używać: - tego samego seeda, - różnych
interwencji.

Ułatwia analizę przyczynową.

------------------------------------------------------------------------

# 188. Experimental Metadata

Opcjonalnie:

``` yaml
experiment:
  experimentId:
  hypothesis:
  branchId:
```

Nie wpływa na symulację.

------------------------------------------------------------------------

# 189. Analytics

Dla balansu mierzyć: - które interwencje wybierane, - średni koszt, -
średni legacy, - częstotliwość no-effect, - różnorodność konsekwencji.

W single-player offline telemetry nie jest wymagana do działania.

------------------------------------------------------------------------

# 190. No Hidden Intervention

Każda zmiana świata pochodząca od gracza musi być identyfikowalna.

------------------------------------------------------------------------

# 191. System Events ≠ Architect Interventions

Naturalna susza generowana przez symulację: - nie ma architect
attribution.

Susza wywołana przez gracza: - ma.

Mechaniczny efekt może być podobny.

------------------------------------------------------------------------

# 192. Intervention vs Scenario Setup

Warunki ustawione **przed startem świata** mogą być traktowane jako: -
initial world configuration, - niekoniecznie intervention.

Jeżeli chcemy analizować je jako „First Cause", można tworzyć
`origin facts`.

------------------------------------------------------------------------

# 193. Origin Facts

Opcjonalna koncepcja: kluczowe ustawienia świata mogą mieć causal roots
typu: - world_seed_condition, - architect_initial_condition.

Przydatne później dla analizy „dlaczego ten świat rozwinął się tak".

------------------------------------------------------------------------

# 194. VS Recommendation for Initial Conditions

Nie przeciążać Causality Engine wszystkimi parametrami world generation
jako Root Facts.

Tworzyć origin facts tylko dla warunków istotnych dla wyjaśnialności.

------------------------------------------------------------------------

# 195. Security of State

Intervention command nie może przyjąć dowolnego path typu:
`world.regions[3].companies[7].cash = 999999`.

Tylko zdefiniowane efekty.

------------------------------------------------------------------------

# 196. Modding --- przyszłość

Jeśli interwencje będą moddable: - schema validation, - whitelisted
effect types, - deterministic handlers.

------------------------------------------------------------------------

# 197. Debug Intervention

Dev build może mieć: - darmowe interwencje, - direct state tools.

Muszą być oznaczone jako debug i nie mylone z gameplay Architect System.

------------------------------------------------------------------------

# 198. Cheats

Cheaty nie powinny zanieczyszczać standardowego balansu Influence.

------------------------------------------------------------------------

# 199. Save Compatibility

Usunięcie definicji interwencji z contentu nie może psuć starego save.

Historyczne instance muszą zachować wystarczające dane/snapshot
definicji.

------------------------------------------------------------------------

# 200. Versioning

Intervention Instance powinien znać: - definition version lub
contentVersion.

------------------------------------------------------------------------

# 201. Migration

Zmiana costu w nowej wersji: - nie przelicza historycznie już wydanego
Influence.

------------------------------------------------------------------------

# 202. Influence Invariants

``` text
0 <= CurrentInfluence <= MaxInfluence
ReservedInfluence >= 0
AvailableInfluence >= 0
spent cost >= 0
```

------------------------------------------------------------------------

# 203. Intervention Invariants

-   valid definition,
-   valid target,
-   valid parameters,
-   root fact dla wykonanej interwencji,
-   brak duplicated application,
-   deterministic status transitions.

------------------------------------------------------------------------

# 204. Attribution Invariants

-   influence \>= 0,
-   brak attribution do nieistniejącej interwencji,
-   Direct tylko dla faktycznego direct effect,
-   brak samoczynnego wzrostu attribution bez nowej causal evidence.

------------------------------------------------------------------------

# 205. Performance

Nie liczyć Butterfly Effect dla wszystkich interwencji co tick.

Aktualizować: - incremental attribution, - znaczące descendants, -
cached legacy.

------------------------------------------------------------------------

# 206. Attribution Storage

Dla mikro-faktów: - mała mapa attribution, - threshold pruning.

Dla historical anchors: - trwała informacja.

------------------------------------------------------------------------

# 207. Butterfly Query Performance

Długie zapytanie może używać: - cached major descendants, - Historical
Threads, - causal graph traversal tylko dla potrzebnych fragmentów.

------------------------------------------------------------------------

# 208. Definition of Done --- Influence

Gotowe dla VS, jeśli: - Influence 0--100 działa, - koszt jest
transparentny, - wydawanie/regeneracja działa, - cooldown/stacking
działa, - save/load zachowuje ledger.

------------------------------------------------------------------------

# 209. Definition of Done --- Intervention

Gotowe dla VS, jeśli: - 5 podstawowych interwencji działa, - zmieniają
tylko warunki, - każda tworzy Root Fact, - AI reaguje autonomicznie, -
brak gwarantowanych rezultatów.

------------------------------------------------------------------------

# 210. Definition of Done --- Attribution

Gotowe, jeśli: - direct attribution, - propagation, - dilution, -
decay, - multiple interventions, - pruning

działają deterministycznie.

------------------------------------------------------------------------

# 211. Definition of Done --- Butterfly Effect

Gotowe, jeśli dla interwencji można zobaczyć: - direct effect, -
najważniejsze dalsze skutki, - causal paths, - historical legacy, - brak
false attribution.

------------------------------------------------------------------------

# 212. Definition of Done --- Black Mountain

PASS: 1. Reveal Resource kosztuje Influence. 2. Tworzy Root Fact. 3.
Deposit staje się discovered. 4. Mine nie jest tworzona bezpośrednio. 5.
Company AI samodzielnie ocenia opportunity. 6. Możliwy jest brak
kopalni. 7. Możliwy jest boom. 8. Możliwy jest późniejszy bust. 9. WHY?
i WHY NOT? działają. 10. Butterfly Effect potrafi prześledzić
rzeczywiste konsekwencje. 11. Chronicle może oznaczyć ważne legacy. 12.
Brak specjalnego kodu Black Mountain.

------------------------------------------------------------------------

# 213. Kanoniczne ustalenia v0.1

-   Gracz jest Architektem warunków.
-   Architekt nie steruje bezpośrednio aktorami.
-   Influence ma zakres 0--100.
-   Interwencje kosztują Influence.
-   Koszt zależy od Base, Magnitude, Duration, Scope i Naturalness.
-   Kategorie: Environment, Resources, Population, Knowledge, Economy,
    Experimental Events.
-   Interwencja zmienia input, nie gwarantuje outputu.
-   Każda wykonana interwencja tworzy Root Fact.
-   Direct effect ma najwyższy Architect Influence.
-   Influence propaguje się przez Causal Engine.
-   Influence słabnie przez decay i independent-cause dilution.
-   Kilka interwencji może wpływać na jeden skutek.
-   Architect Influence ≠ Historical Significance.
-   Legacy jest osobnym wymiarem.
-   Brak oczekiwanego rezultatu nie oznacza Failed.
-   Brak rezultatu nie daje refund.
-   Anulowanie nie cofa historii.
-   AI nie zna meta-intencji gracza.
-   Butterfly Effect jest analizą causal descendants.
-   Chronicle nie tworzy skutków.
-   Sandbox nadal zachowuje causal tracking.
-   Black Mountain nie ma skryptowanego sukcesu.
-   Obserwacja i WHY? nie kosztują Influence.

------------------------------------------------------------------------

# 214. Otwarte decyzje do tuningu

Do ustalenia po pierwszym działającym VS: - dokładna regeneracja
Influence, - dokładne base costs, - funkcja Magnitude Cost, - funkcja
Duration Cost, - funkcja Scope Cost, - Naturalness thresholds, -
cooldown lengths, - repeated intervention modifier, - stacking caps, -
attribution decay, - public influence thresholds, - Legacy Score
weights, - notification thresholds, - czy sustained interventions
rezerwują Influence, - czy Population Seed pozostaje tylko narzędziem
eksperymentalnym.

------------------------------------------------------------------------

# 215. Następny dokument

Po Architect Intervention & Influence Spec kolejnym dokumentem w
ustalonej kolejności powinien być:

**`FIRST-CAUSE-UI-UX-World-Command-Center-Spec-v0.1.md`**

Powinien zdefiniować: - główny ekran Living Atlas / World Command
Center, - hierarchię informacji, - region/settlement/company detail, -
Chronicle, - WHY?, - Butterfly Effect, - Architect Panel, - symulację
czasu, - alerty, - sposób prezentacji danych bez klasycznej mapy jako
fundamentu, - anti-AI design language, - public read models i commands.

------------------------------------------------------------------------

# 216. Kryterium końcowe

Architect System spełnia swoją rolę, jeśli gracz może spojrzeć na Black
Mountain i powiedzieć:

> „Co się stanie, jeśli ujawnię światu to złoże?"

następnie zapłacić Influence i zmienić **jeden warunek**.

Od tej chwili gra nie realizuje polecenia gracza.

Gra symuluje świat.

Może powstać kopalnia.

Może nie powstać.

Może pojawić się miasto.

Może dojść do boomu i kryzysu.

Może region po stu latach żyć już z czegoś zupełnie innego.

A gracz może prześledzić:

``` text
moja interwencja
→ bezpośrednia zmiana
→ decyzje autonomicznych aktorów
→ kolejne konsekwencje
→ punkt zwrotny
→ historyczne dziedzictwo
```

To właśnie realizuje główną obietnicę FIRST CAUSE:

> **Gracz tworzy przyczynę. Symulacja tworzy konsekwencje.**

**KONIEC --- FIRST CAUSE Architect Intervention & Influence Spec v0.1**
