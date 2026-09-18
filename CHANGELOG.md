# Changelog

All notable changes to this repository are recorded here, newest first.

Format: one entry per change/session, dated `YYYY-MM-DD`. This file
tracks *what changed in the repo* (docs, roadmap, code); it is not a
replacement for `docs/FIRST-CAUSE-Implementation-Roadmap-v0.2.md`
(milestone plan/status) or `docs/FIRST-CAUSE-Canonical-Decisions-v0.1.md`
(design decisions) -- see those for the "why".

## 2026-09-18

- **docs: Etap 12 (ostatni) -- naprawa audytu M12-M14, korekta
  dokumentacji i dwie decyzje rozstrzygające.** Reaguje na
  `docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`
  §12 "Documentation Drift" -- ostatni etap planu naprawy, po zamknięciu
  Etapów 5-11 (kod + testy). Kod jest gotowy od Etapu 11; ten etap tylko
  zgadza dokumentację ze stanem faktycznym.

  Dwie decyzje podjęte wspólnie z użytkownikiem (audyt wymagał "jawnego
  uzgodnienia", nie milczącego wyboru):
  1. **UI-F1 (Procedural Region Visual Identity)** jawnie odroczone z
     M14 do M15 -- roadmapa wcześniej dopuszczała niejednoznaczne
     "M14/M15"; M14's implementacja nigdy renderingu nie objęła.
  2. **M15's Technology Discovery Catalog** pozostaje wymagany --
     świadomie NIE zastępujemy go skrótowo walidowanymi definicjami
     contentu VS (roadmapa: "brak katalogu nie upoważnia do wymyślania
     20-30 odkryć"). M15 zostaje formalnie BLOCKED (tabela §12), dopóki
     `FIRST-CAUSE-Technology-Discovery-Catalog-v0.1.md` nie zostanie
     dostarczony osobno.

  Poprawki w `FIRST-CAUSE-Implementation-Roadmap-v0.2.md`: M14's sekcja
  dostaje nowy akapit "Audyt post-implementacyjny" (FAIL → pełna
  naprawa, Etapy 5-11, lista commitów); M15's "Warunek rozpoczęcia"
  i "Implementowane systemy" odzwierciedlają obie decyzje powyżej;
  §12's przestarzała proza ("M15 gotowy do rozpoczęcia") i tabela
  (M15: BACKLOG → BLOCKED) skorygowane; §14's "Zasada końcowa" była
  zamrożona od granicy M6/M7 ("Następny krok: M7") mimo reguły "dokument
  żywy" z §13 -- zaktualizowana na M15; §15's item 5 ("M14/M15")
  rozstrzygnięty na M15.

  `README.md`: "Current milestone" był zamrożony na M7 ("M8 = READY, not
  started") mimo że M8-M14 są od dawna gotowe -- dopisano zwięzłe
  podsumowanie M8-M14 (real economy loop = `economy-tick.ts::
  runEconomyTick`/`WorldRunner`, wcześniej błędnie sugerowane jako
  brakujące), nowy akapit o audycie M12-M14 i naprawie, i skorygowany
  "Next: M15" z warunkiem blokującym. "Headless simulation" section
  poprawiona -- `pnpm sim:run`'s 12-tickowe demo rzeczywiście nadal
  używa tylko gołego `HeadlessRunner` (nigdy nie zaktualizowane), ale
  zdanie sugerujące że pełnej pętli tickowej "jeszcze nie ma" było
  fałszywe od M7.

  Skorygowano też dwa konkretne błędy faktyczne we **wcześniejszym**
  wpisie CHANGELOG M14 (bez przepisywania historii -- poprawki oznaczone
  wprost jako korekty z datą): "32 nowe testy" → 24 (21 housing/
  settlements + 3 tick-loop, audyt policzył to samo); fałszywe
  twierdzenie "UI-F0 jeszcze nie istnieje" (istnieje od M5) zastąpione
  prawdziwym powodem odroczenia UI-F1.

  Świadomie NIE zrobione w tym etapie: sam Technology Discovery Catalog
  (decyzja użytkownika: czekamy na osobno dostarczony dokument, nie
  wymyślam go teraz) i sama implementacja UI-F1 (odroczona do M15,
  nie ten etap).

- **test: Etap 11 -- naprawa audytu M12-M14, wielotickowy monitor
  inwariantów (`m12_m14_multiseed_120_ticks_with_invariant_monitor`).**
  Reaguje na `docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`.
  Audyt sam uruchamiał 120 ticków Black Mountain z prawdziwym contentem
  ręcznie, poza repo, żeby złapać naruszenia zatrudnienia mimo
  "PASS bez wyjątku" ("Nie jest to PASS inwariantów", audyt §4). Nowy
  `packages/worldgen/src/fixtures/m12-m14-invariant-monitor.test.ts`
  odtwarza to jako commitowany test: prawdziwy content
  (`loadEconomyContent`, entrepreneurship candidates włączone -- M12
  aktywne), prawdziwe 8-regionowe Black Mountain fixture (M13 migracja
  i M14 osady mają się o co realnie kłócić), 120 ticków, 3 niezależne
  seedy RNG. Po każdym ticku sprawdza: `cohort.employment <=
  eligibleLaborForce` (P0-05a), suma headcountu aktywnych firm regionu
  <= suma eligibleLaborForce regionu (P0-05b), `World.currentTick`
  idzie dokładnie o 1 do przodu (P1-04), `housing.capacity` nigdy nie
  maleje, `Settlement.stage` przesuwa się co najwyżej o jeden szczebel
  na tick. Świadomie NIE sprawdza `population <= housing.capacity` jako
  twardego globalnego niezmiennika -- przeludnienie ponad capacity jest
  legalnym, zamierzonym stanem (Urban Crisis, FC-SETTLEMENT-003);
  migracja (P0-04) blokuje tylko nowy napływ do pełnej osady, demografia
  (urodzenia) może wciąż stopniowo przekroczyć capacity organicznie --
  mylenie tych dwóch rzeczy byłoby dokładnie błędem, przed którym
  ostrzega audyt. Wszystkie 3 seedy przechodzą 120 ticków bez naruszenia
  żadnego z powyższych.

- **fix: Etap 10 -- naprawa audytu M12-M14, P1-05/P1-06/P1-08 (walidacja
  commitów, cechy migrantów, Read Models osad).** Reaguje na
  `docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`.
  `createWorldState` nie chroniło nowych stanów (P1-05): `toById`
  (`packages/entities/src/core/indexes.ts`) po cichu nadpisywało
  zduplikowane ID -- teraz odrzuca duplikaty, z nazwą typu encji w
  komunikacie błędu. Nowa `core/validation.ts::assertFiniteDeep`
  rekurencyjnie odrzuca NaN/Infinity w dowolnie zagnieżdżonym polu
  liczbowym każdej encji przed commitem (reprodukcja audytu:
  `tradeUtilization = NaN` → `urbanizationPressure = NaN` przechodziło
  bez błędu, bo stan budowany przez spread -- jak
  `evaluateSettlementGrowth` -- nigdy nie wraca przez konstruktor
  `create*`). Sprawdzenie istnienia settlementu dla kohorty/firmy
  potwierdza teraz też zgodność jego regionu; `Company.ownerEntityId`
  musi wskazywać istniejącą kohortę; `Inventory.ownerId` musi wskazywać
  istniejącą encję zgodną z `ownerType`.

  Migracja resetowała `averageWealth`/`educationLevel`/`literacy`
  migranta do 0 (P1-06) -- w przeciwieństwie do zatrudnienia (świadomie
  zostawionego, bo przywiązanego do konkretnej pracy) to cechy osobiste;
  `migration.ts::applyMigrationFlow` liczy je teraz jako ważoną
  (populacją) średnią migrantów i miejsca docelowego, tym samym wzorcem
  co `matchEmployment`'s `averageIncome`.

  Brakowało typed Read Modelu dla housing/pressure osady (P1-08): nowy
  `settlement-summary-read-model.ts` (`housing.capacity/cost/pressure`,
  `urbanizationPressure`/`declinePressure`, `employment`) -- ten sam
  wzorzec co `company-summary-read-model.ts`. `RegionSummaryReadModel`
  zyskuje `migrationAttraction`/`settlementPressure` (dotąd widoczne
  tylko w surowym `WorldState`).

  16 nowych/zaktualizowanych testów, w tym dokładnie nazwane w audycie
  `world_commit_rejects_nan_duplicate_ids_and_invalid_ownership` i
  `migration_preserves_weighted_wealth_and_education`. Musiałem przy
  okazji dodać brakujące kohorty-właścicieli do dwóch istniejących test
  fixture'ów (`economy-tick.test.ts`, `company-summary-read-model.test.ts`),
  które dotąd polegały na niewalidowanym `ownerEntityId`.

- **fix: Etap 9 -- naprawa audytu M12-M14, P0-03/P1-01/P1-02 (kapitał
  foundingu, twarda eligibility, zachowanie DecisionSnapshot).** Reaguje
  na `docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`.
  Founding tworzył `initialCash` bez obciążenia jakiejkolwiek puli
  kapitału (P0-03) -- `Region.economy.wealth` (dotąd zupełnie martwe
  pole) jest teraz jedynym, minimalnym źródłem: `capitalRequirement <=
  region.economy.wealth` to nowy twardy warunek, a founding faktycznie
  obciąża tę pulę. Dopóki żaden system nie zasila `wealth` (przyszła
  praca), founding z niezerowym `capitalRequirement` będzie poprawnie
  zablokowany -- oba obecne archetypy JSON mają `capitalRequirement=0`,
  więc dzisiejszy content zachowuje się identycznie. Twarda eligibility
  (P1-01) rozszerzona o: dostępność pracy (`availableLabor >=
  laborTarget`, wcześniej tylko miękki 0,1-wagowy składnik wyniku),
  dostępność dóbr pośrednich (`goodInputsPerBatch`, wcześniej w ogóle
  niesprawdzane, nowe pole `goodStockByGoodId` z regionalnego inventory)
  i zgodność archetypu z PM (`recipe.eligibleCompanyArchetypeIds`, ten
  sam wzorzec co M7-M11's PM Adoption). `economy-tick.ts` przestaje też
  ujawniać scannerowi fizyczny stock zasobów niezależnie od
  `discovery.status` -- tylko DISCOVERED/ASSESSED depozyty wnoszą swój
  stock (World Generation Spec §16: Black Mountain's Iron Ore może
  zaczynać jako hidden, region "nie ma automatycznie rozwiniętego
  przemysłu żelaza" -- founding nie może omijać tej granicy). `evaluateFounding`
  budowany `DecisionSnapshot` ginął przed zapisem faktu (P1-02) --
  `company_founded` niesie teraz cały snapshot (options/selectedAction/
  causalContext.factors) zamiast tylko istnienia 0->1. 6 nowych/
  zaktualizowanych testów, w tym dokładnie nazwany w audycie
  `founding_debits_capital_and_rejects_insufficient_funds`. Świadomie
  poza zakresem: export opportunity i location scoring (LocationScore,
  wybór osady/regionu dla foundingu) -- pozostają nowymi, nie
  zaimplementowanymi zdolnościami, nie brakującymi bramkami eligibility;
  audyt flagował je jako odrębny, większy brak M12, nie jako część
  "hard eligibility" tego etapu.

- **fix: Etap 8 -- naprawa audytu M12-M14, P0-06/P1-04 (kanoniczna
  kolejność faz ticka, jeden zegar).** Reaguje na
  `docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`.
  `economy-tick.ts`'s rzeczywista kolejność faz łamała CD SIM-003:
  Regeneracja zasobów i Demografia (kanoniczne fazy #2/#3) wykonywały się
  PO Production/Trade/Migration (dawne kroki 7-10), więc produkcja,
  founding i migracja tego ticka operowały na populacji/zasobach sprzed
  tegomiesięcznej demografii/regeneracji. Regeneracja i demografia są
  teraz krokami 1-2, PRZED pętlą regionów; reszta pipeline'u zachowała
  swoją WEWNĘTRZNĄ względną kolejność, tylko przenumerowaną (dawne 1-7.5
  -> 3-9.5, dawne 7/8/9/10/10.5/11 -> 10/11/1/2/11.5/12). To nie jest
  pełne 23-fazowe SIM-003 (Production Planning/Production/Inventory/itd.
  pozostają zespolone w jeden krok "Company AI" -- audyt świadomie
  dopuszcza to jako "nie chodzi o brak frameworka z 23 klasami").
  `World.currentTick`/`currentDate` nigdy nie były aktualizowane przez
  `runEconomyTick` mimo że `WorldRunner.tick` szedł do przodu -- dwa
  niespójne źródła czasu, jedno z nich czytane przez
  `WorldSummaryReadModel`. VALIDATE -> COMMIT przesuwa teraz
  `currentDate` o jeden miesiąc (nowa `core/time.ts::advanceCalendarDate`,
  SIM-001) i `currentTick` na `tick + 1`. 6 nowych testów regresyjnych, w
  tym dokładnie nazwany w audycie `canonical_phase_order_and_world_clock`
  (weryfikuje zarówno kolejność demografia-przed-migracją po indeksach
  faktów, jak i przesunięcie zegara) i osobny test regeneracja-przed-
  -produkcją (prawie pusty odnawialny depozyt, który regeneruje się
  ponad próg batcha DOKŁADNIE w tym samym ticku). Oba zweryfikowane przez
  tymczasowe cofnięcie zmiany (`git stash`) -- rzeczywiście łapią
  regresję. Świadomie poza zakresem: pełne rozbicie na 23 kanoniczne
  fazy, osobne fazy Services/Needs Satisfaction (niezamodelowane).

- **fix: Etap 7 -- naprawa audytu M12-M14, P0-05/P1-07 (fantomowi
  pracownicy i integracja firm z osadami).** Reaguje na
  `docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`.
  `migration.ts::applyMigrationFlow` i `demography.ts::applyMonthlyDemography`
  przycinały `cohort.employment` do samej (nowej) populacji kohorty, nie
  do `eligibleLaborForce` (65% working-age) -- kohorta mogła mieć więcej
  "zatrudnionych" niż strukturalnie dostępnej siły roboczej mimo mieszczenia
  się w populacji (P0-05, reprodukcja: populacja 100→90, employment 65
  niezmienione, eligibleLaborForce spada do 58,5). Obie funkcje przycinają
  teraz do `eligibleLaborForce`; `demography.ts`'s doc comment
  udokumentowanej wcześniej (M7-M11 audyt) granicy modułów zaktualizowany
  -- M12-M14 audyt uznał czystość granicy za niewystarczającą wobec
  fantomowych pracowników. `Company.workforce.employees` samo nigdy nie
  było korygowane po takim spadku (M7-M11 audyt zakładał, że kolejny
  tick's `decideLabor` sam to nadgoni zwykłym LAYOFF -- w praktyce firma z
  dodatnią marżą nigdy dobrowolnie nie zwalnia, więc fantomowi pracownicy
  przetrwaliby w nieskończoność). Nowy krok 10.5 w `economy-tick.ts`
  wymusza deterministyczny, przymusowy layoff nadwyżki firm regionu ponad
  `eligibleLaborForce`, tym samym mechanizmem (`layoffWorkers`, firmy i
  kohorty sortowane po id) co zwykła decyzja LAYOFF. Founding (M12) nie
  przypisywał nowej firmie `settlementId` mimo że M14 czyta stamtąd jobs
  do `Settlement.economy.employment` -- teraz przypisuje pierwszy (po
  sortowaniu id) settlement regionu (P1-07a); samo `Settlement.economy.
  employment` było liczone tylko na potrzeby presji osady i nigdy nie
  zapisywane z powrotem -- krok 11 teraz je zapisuje (P1-07b). 5 nowych
  testów regresyjnych (2 zaktualizowane pod nowy, poprawny sufit
  `eligibleLaborForce`, 2 nowe w `economy-tick.test.ts` w tym
  `migration_demography_reconcile_company_and_cohort_labor` z audytu, 1
  nowy w `demography.test.ts`). Świadomie poza zakresem: LocationScore/
  wybór osady dla foundingu (P1-01, osobny etap) -- placeholder "pierwszy
  po sortowaniu" to ten sam wzorzec co istniejący placeholder właściciela.

- **fix: Etap 6 -- naprawa audytu M12-M14, P0-04/P1-03/P2#1 (housing jako
  twardy limit i źródło capacity).** Reaguje na
  `docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`.
  `population/migration.ts::selectDestinationSettlement` zwracała
  `remainingCapacity: Infinity` zarówno gdy region docelowy nie ma
  settlementów (poprawnie, rural), jak i gdy MA settlementy, ale wszystkie
  są pełne (błędnie -- to obejście twardego limitu migracji z RM M13);
  drugi przypadek zwraca teraz `0`, nie `Infinity` (P0-04). Zmieniony też
  istniejący test, który wprost oczekiwał starego (niezgodnego z RM M13)
  zachowania. `society/housing.ts::growHousingCapacity` zyskuje wymagany
  parametr `availableConstructionLabor` -- capacity nigdy nie rośnie
  szybciej niż liczba bezrobotnych, zdolnych do pracy mieszkańców
  settlementu na ten tick (`labor/employment.ts::availableWorkers`,
  zsumowane per settlement w `economy-tick.ts` kroku 11), więc nie
  powstaje już z samej liczby mieszkańców bez żadnego zaangażowanego
  zasobu (AI Decision Model §53, P1-03). `runMigrationPass` zwalnia teraz
  też `settlementPopulationById` przy odpływie, nie tylko zwiększa go przy
  napływie -- w tym samym passie osada, która traci mieszkańców, od razu
  widzi zwolnione miejsce dla kolejnych przepływów (P2#1). 6 nowych testów
  regresyjnych (housing.test.ts ×2, settlements.test.ts ×2,
  migration.test.ts ×2, w tym `full_destination_housing_blocks_inflow`,
  `housing_growth_requires_accounted_source` i
  `migration_outflow_releases_housing_capacity` z audytu). Świadomie poza
  zakresem: pełne Construction Company AI (§53's pressure/materiały/ceny)
  -- audyt tego teraz nie wymaga; P0-05/P0-06/P0-03 i pozostałe P1 --
  kolejne etapy 7-12.

- **fix: Etap 5 -- naprawa audytu M12-M14, P0-01/P0-02 (tożsamość i ID
  migrantów).** Reaguje na
  `docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`.
  `population/cohorts.ts` dostaje nową `cohortSingleIdentityKey`
  (tożsamość rodziny + `ageGroup`) obok istniejącej `cohortIdentityKey`
  (tożsamość samej rodziny, celowo bez `ageGroup`). `population/
  migration.ts::runMigrationPass` indeksował dotąd odbiorców migracji po
  tożsamości rodziny -- dwie grupy wieku tej samej rodziny migrujące do
  tego samego miejsca w jednym ticku nadpisywały się nawzajem w indeksie,
  cichcem zmieniając wiek drugiej grupy migrantów (P0-01); teraz używa
  `cohortSingleIdentityKey`. Szablon ID nowo tworzonej kohorty migrantów w
  `applyMigrationFlow` pomijał `profession` -- dwie profesje migrujące w
  tym samym ticku do tego samego miejsca mogły otrzymać identyczne ID i
  nadpisać się w mapie kohort mimo poprawnie wyglądającego bilansu faktów
  (P0-02); szablon dostaje brakujący segment profesji. 4 nowe testy
  regresyjne odtwarzające dokładne reprodukcje z audytu:
  `cohortSingleIdentityKey` rozróżnia grupy wieku tej samej rodziny
  (`cohorts.test.ts`), permutacja kolejności rekordów wejściowych nie
  zmienia wyniku migracji (`migration_preserves_age_under_record_
  permutation`), dwie profesje migrujące jednocześnie nie tracą populacji
  (`migration_profession_ids_are_unique_and_population_conserved`).
  Świadomie poza zakresem tego etapu: P0-03..P0-06 i wszystkie P1/P2/P3 z
  audytu -- kolejne etapy 6-12, patrz plan w audycie sekcja 14.

- Zapisano raport audytu post-implementation M12–M14 w
  `docs/FIRST-CAUSE-Post-Implementation-Audit-M12-M14-2026-09-18.md`,
  aby utrwalić porównanie implementacji ze specyfikacjami, wyniki kontroli,
  reprodukcje błędów i warunki rozpoczęcia M15. Wynik audytu: FAIL,
  gotowość do M15: NOT READY. Bez zmian kodu i bez wdrażania napraw.

- Wdrożono **M14 -- Settlements** (SET-001/002/003, `society/settlements`
  + `society/housing`). Nowy folder systemów `packages/simulation/src/
  systems/society/`: `housing.ts` (`growHousingCapacity` -- pojemność
  goni `population * margines` z ograniczoną prędkością budowy, nigdy
  natychmiastowo i nigdy w dół; `computeHousingPressure` -- nadwyżka
  ponad capacity, nie samo zapełnienie; `adjustHousingCost` -- scarcity
  pricing wygładzone EMA, ten sam kształt co `markets/price-adjustment.
  ts`) i `settlements.ts` (`computeSettlementPressure` -- kanoniczna
  `SettlementPressure` §61, rozdzielona na `urbanizationPressure`/
  `declinePressure`, ważona suma PopulationScore/JobsScore/TradeScore/
  InfrastructureScore/HousingDemandScore minus Constraints (overcrowding);
  `evaluateSettlementGrowth` -- automat progowy z persistence+cooldown
  (ten sam kształt co M12's opportunity-scanner, ale bez DecisionSnapshot/
  options -- "Settlement nie jest klasycznym aktorem decyzyjnym", §61)
  i twardym hard-eligibility gate na `housing.capacity >= population`
  (trzeci warunek z §61 "threshold, persistence, capacity"), nigdy
  więcej niż jeden szczebel drabiny `Camp→Hamlet→Village→Town→City→
  Metropolis` na tick. `Settlement` (`packages/entities`) zyskuje nowe
  pole `growth` (`SettlementGrowthState`: urbanizationStreak/
  declineStreak/lastStageChangeTick, ten sam kształt co M12's
  `RegionEntrepreneurshipState`). `economy-tick.ts` dostaje krok 11
  (ostatni przed commitem -- widzi populację w pełni rozliczoną tego
  ticka, po migracji I demografii; `settlements` dołącza do mutowalnych
  map, dotąd jedyny top-level rekord WorldState przepuszczany bez zmian)
  i wypełnia dwa wcześniej martwe pola: `Settlement.economy.employment`
  (liczone z aktywnych firm settlementu) i `Region.cached.
  settlementPressure` (średnia `urbanizationPressure` osad regionu).
  Housing constraint integration z M13 -- `population/migration.
  ts::selectDestinationSettlement` już czytało `housing.capacity` jako
  twardy limit; M14 jest pierwszym systemem, który realnie je zapełnia
  (dotąd zawsze 0), więc ten limit zaczyna coś znaczyć w praktyce, bez
  żadnej zmiany po stronie M13 samego. **24 nowe testy** (skorygowano
  2026-09-18 -- audyt post-implementacyjny M12-M14 wykazał, że oryginalny
  wpis błędnie liczył 32; rzeczywiście: 21 testów housing/settlements +
  3 tick-loop end-to-end): FC-SETTLEMENT-001
  (Settlement Pressure -- population/jobs/trade w górę podnosi
  pressure), FC-SETTLEMENT-002 (Stage Transition -- nie w jednym
  przypadkowym ticku, dokładnie na progu persistence, nigdy więcej niż
  jeden szczebel, cooldown), FC-SETTLEMENT-003 (Urban Crisis -- nagły
  skok populacji bez nadążającej budowy realnie podnosi `housing.
  pressure` tego samego ticka i tłumi urbanizationPressure), plus
  housing capacity/cost/pressure w izolacji, capacity gate, regresja
  etapu, i pełny end-to-end test w `economy-tick.test.ts` (osada
  awansuje CAMP→HAMLET napędzana wyłącznie prawdziwą pętlą ticków, bez
  ręcznego wołania `evaluateSettlementGrowth`) plus determinism. Etykieta
  `app.milestone` zaktualizowana na "M14 -- Settlements"/"M14 -- Osady".
  Świadomie poza zakresem: `UI-F1 -- Procedural Region Visual Identity`
  (roadmapa wymienia go jako start dla M14, ale to część "Parallel UI
  Foundation Track" -- jawnie nie tworzy nowego milestone'u ani nie
  blokuje M14's własnej Acceptance Gate, sekcja 6A; **skorygowano
  2026-09-18** -- oryginalny wpis błędnie twierdził, że w repo nie
  istnieje jeszcze nawet wcześniejszy `UI-F0` -- w rzeczywistości UI-F0
  istnieje od M5 (Design Tokens, FC primitives, AppShell). Prawdziwy
  powód odroczenia: UI-F1 to sam w sobie spory, osobny kawałek pracy
  renderingowej, nie "kolejny mały krok" -- decyzją z 2026-09-18 startuje
  jawnie razem z M15, nie M14, patrz roadmapa i CHANGELOG "Etap 12"
  wyżej), pełna infrastruktura miejska/`Connection.
  infrastructure.level` jako inwestycja gracza/AI (M14's własna sekcja
  wymienia tylko `SettlementPressure`/stage/housing jako
  "Implementowane systemy" -- infrastructure investment pozostaje dług
  techniczny odziedziczony po M10, nierozwiązany też tutaj), pełne
  miasta-państwa (DEFERRED wprost w spec).

- Wdrożono **M13 -- Migration** (AI-09, Migration Decision Integration).
  Nowy moduł `packages/simulation/src/systems/population/migration.ts`:
  `computeMigrationAttraction` (region-level `Jobs + ExpectedWage -
  HousingCost`, cache'owane w `Region.cached.migrationAttraction` --
  martwe od M3 pole), `computeDistanceFriction`/`computeMigrationPullSignal`
  (§58-60, oparte na `Connection.cached.effectiveDistance` z M10),
  `updateMigrationPropensity` (EMA, zapisywane w `PopulationCohort.
  migrationPropensity` -- też martwe od M3 pole), `evaluateMigrationOutflow`
  (§60 "household inertia" + "seeded probability", bezstronne
  zaokrąglanie tym samym `stochasticRound` co demografia M6),
  `selectDestinationSettlement` (SET-003, twardy housing cap -- puste,
  jeszcze nieosiedlone regiony są bez ograniczenia, bo nie mają
  Settlementu do przekroczenia) i `applyMigrationFlow` (fizyczne
  przeniesienie, scalenie z istniejącą kohortą tej samej tożsamości albo
  założenie nowej, z parą faktów `population_migrated_out`/`_in` o
  identycznej wielkości -- OutMigration === InMigration z konstrukcji,
  FC-MIGRATION-005). Kandydaci migracji (POP-007, FC-MIGRATION-004) to
  wyłącznie regiony bezpośrednio połączone Connection -- nie całe 3000-
  regionowe świat; "znane centra"/cultural-family links pozostają
  niezamodelowane (brak systemu Culture, poza zakresem M13, tak samo
  jak M12's SkillAvailability/Risk). `economy-tick.ts` dostaje krok 7.5
  (liczy świeże `migrationAttraction` per region, wewnątrz istniejącej
  pętli regionów, post-entrepreneurship) i krok 8 (`runMigrationPass`
  po pętli regionów i handlu, żeby KAŻDY region miał już świeży
  `migrationAttraction` tego ticka, nie tylko wcześniej przetworzone w
  sortowanej kolejności) -- z nowym, wymaganym strumieniem RNG
  "migration" (wcześniej zarezerwowanym w SAVE-003, nieużywanym od M1),
  analogicznie do `demographyRng`. `cohorts.ts`'s prywatna `identityKey`
  wyeksportowana jako `cohortIdentityKey` (współdzielona z migracją --
  rozpoznanie "czy w miejscu docelowym już istnieje kohorta tej samej
  tożsamości" musi użyć dokładnie tej samej definicji tożsamości co
  `buildCohortFamily`/`groupCohortsIntoFamilies`, nie osobnej,
  potencjalnie rozjeżdżającej się kopii); `demography.ts`'s prywatna
  `stochasticRound` wyeksportowana z tego samego powodu współdzielenia.
  23 nowe testy (`migration.test.ts`): Migration Attraction Test
  (FC-MIGRATION-001), Migration Friction Test (FC-MIGRATION-002),
  Housing Constraint Test (FC-MIGRATION-003, zarówno miękkie
  tłumienie w `computeMigrationAttraction` jak i twardy cap w
  `selectDestinationSettlement`), Candidate Set Test (FC-MIGRATION-004,
  na trójregionowym łańcuchu A--B--C bez bezpośredniego A-C -- populacja
  nigdy nie ląduje w C), Migration Accounting Test (FC-MIGRATION-005,
  conservation całego świata + równość sum faktów out/in) i determinism
  test (dwa niezależne przebiegi tym samym ziarnem -> identyczny wynik).
  Etykieta `app.milestone` zaktualizowana na "M13 -- Migration"/
  "M13 -- Migracja". Świadomie poza zakresem: pełny Culture Model i
  granice/państwa jako modyfikator migracji (oba DEFERRED wprost w
  roadmapie), wzrost/kurczenie się osad jako reakcja na napływ migrantów
  (`SettlementPressure`, to M14) -- M13 tylko *respektuje* istniejącą
  (dziś zwykle zerową, bo nic jeszcze jej nie ustawia) pojemność
  mieszkaniową, nie hoduje jej.

- Wdrożono **M12 -- Entrepreneurship** (AI-07, Opportunity Scanner).
  Nowy moduł `packages/simulation/src/systems/economy/company-ai/
  opportunity-scanner.ts` (`evaluateFounding`): kanoniczny
  `OpportunityScore = DemandGap + ExpectedMargin + ResourceAccess +
  LaborAvailability + SkillAvailability + MarketAccess - Competition -
  Risk - CapitalRequirement` (AI-008), ważony i clampowany do `[0,1]`
  tym samym wzorcem co `lifecycle-decision.ts`'s expansion/contraction
  score, z pełnym hysteresis+cooldown+persistence (AI-01, §84
  Anti-Explosion Rules -- brak natychmiastowego wejścia). Aktor
  oceniający okazję to *region*, nie istniejąca firma (Entrepreneurship
  AI działa, zanim jakakolwiek firma istnieje) -- `Region`
  (`packages/entities`) zyskuje nowe pole `entrepreneurship`
  (`RegionEntrepreneurshipState`: activeStates/opportunityStreak/
  lastDecision, keyed by `archetypeId`), ten sam kształt co
  `Company.ai` z M11, ale bez `memory` (OpportunityScore liczony na
  świeżo co scan, nie z trendu). Minimum Economic Scale (§85) i
  hard-eligibility (populacja > 0, wymagane zasoby faktycznie dostępne
  w regionie) blokują założenie firmy niezależnie od wyniku. Capital
  Formation (§46) świadomie uproszczone -- spec sam mówi "dokładny
  system finansowania zostanie rozwinięty później", a `Region.economy.
  wealth`/`PopulationCohort.averageWealth` są martwymi, niepodłączonymi
  polami nigdzie w silniku -- nowa firma startuje z gotówką dokładnie
  równą `capitalRequirement` (realna, content-owned liczba, nie
  wymyślony zastrzyk). `economy-tick.ts` dostaje krok 7: dla regionu z
  kandydatami (`entrepreneurshipCandidatesByArchetypeId`, domyślnie `{}`
  -- pełna wsteczna zgodność) liczy `evaluateFounding` per archetyp i,
  jeśli firma się zakłada, tworzy realny `Company`+`Inventory`
  (`createCompany`/`createInventory`) z deterministycznym ID
  (`company_<archetypeId>_<regionId>_t<tick>`) i emituje fakt
  `company_founded`; back-referencje (`Region.economy.companyIds`)
  odtwarzają się same przez istniejący `createWorldState`. `worldgen`'s
  `loadEconomyContent` buduje kandydatów z `content/companyArchetypes/
  *.json` (jeden kandydat na archetyp, pierwsza `productionMethodIds`
  pozycja). 14 nowych testów (494 łącznie): Opportunity Founding Test,
  No Opportunity Test, Competition Saturation Test (z realnym
  zastrzeżeniem AI Decision Model §47 -- wysoka konkurencja nie
  blokuje wejścia absolutnie, tylko przesuwa margines), Minimum
  Economic Scale, hard-eligibility (brak zasobu/populacji), cooldown,
  determinism (jednostkowy i pełny tick-loop), oraz pełny
  end-to-end test zakładający drugą farmę w regionie przez realny,
  już podłączony mechanizm popytu gospodarstw domowych (nie
  sztucznie wstrzyknięty `demand`). Etykieta `app.milestone`
  (`locales/en|pl/common.json`) zaktualizowana na "M12 --
  Entrepreneurship"/"M12 -- Przedsiębiorczość". Świadomie poza
  zakresem: Local Business Layer/Major Company Promotion (§86-87,
  nie wymienione w Acceptance Gate tego milestone'u), Transport/
  Construction Company AI (§52-53, nie są częścią "Implementowane
  systemy" M12 w roadmapie), pełny model Capital Formation z realną
  pulą bogactwa regionu/gospodarstw (§46, jawnie odłożone w samym
  spec), Company Explosion Detector jako osobny system monitoringu
  (§133, poza tym co Acceptance Gate wymaga).

## 2026-09-17

- Wdrożono **M11 -- Company AI** (największy dotąd milestone, L
  złożoność, HIGH ryzyko). Nowe moduły
  `packages/simulation/src/systems/economy/company-ai`:
  `decision-framework.ts` (AI-01 -- hysteresis, cooldown, persistence,
  memory, expectations -- wspólna infrastruktura anty-oscylacyjna dla
  wszystkich poniższych decyzji), `financial-health.ts` (AI-05 --
  profitMargin/cashRunway/distressed), `production-decision.ts` (AI-03
  -- domyka dług M7: `Company.production.utilization` jest teraz
  sterowane przez AI, tym samym wzorcem capped+smoothed pressure co
  Market/Wages), `labor-decision.ts` (AI-04 -- decyduje cel zatrudnienia,
  wykonanie zostaje `matchEmployment`/nowej `layoffWorkers`),
  `lifecycle-decision.ts` (AI-06 -- Expansion/Contraction/Closure z
  pełnym hysteresis+cooldown+persistence; closure przy zerowej gotówce
  ustawia też `status.bankrupt`), `pm-adoption.ts` (AI-08 -- PMScore z
  `ProductionRecipe`, M7), `decision-snapshot.ts` (AI-10 --
  DecisionSnapshot/CausalContext jako czyste dane). `Company`
  (`packages/entities`) zyskuje pole `ai` (Entity Data Model SS19 --
  dokładnie to, czego M3 świadomie nie dotknęło); `expectations` pisze
  do już istniejącego `market.expectedPrices/expectedDemand`, nie do
  duplikatu. 68 nowych testów (430 łącznie): production reaction/no
  overreaction, hysteresis, cooldown, financial survival, closure,
  bankruptcy, PM adoption/rejection, determinism. Etykieta
  `app.milestone` zaktualizowana na "M11 -- Company AI"/"M11 -- AI
  Firm". Świadomie poza zakresem: entrepreneurship (M12), pełna
  migracja jako input (M13), State AI (DEFERRED), pełne wpięcie
  CausalContext w graf Causality Engine (M17), realna pętla ticków
  (przyszły milestone).

- Wdrożono **M10 -- Trade & Transport**. Nowe moduły
  `packages/simulation/src/systems/economy/trade`:
  `effective-distance.ts` (`updateEffectiveDistance` -- pierwsza
  implementacja pełnego `EffectiveDistance = PhysicalDistance x
  TerrainModifier x InfrastructureModifier x BorderModifier x
  SecurityModifier x SeasonalModifier`, ECO-016; infrastruktura=0 to
  neutralny modyfikator, nie kara), `capacity-congestion.ts`
  (`evaluateCapacityCongestion` -- trasa bez capacity jest
  nieprzejezdna, nie NaN/Infinity) i `flows.ts` (`evaluateTradeFlow` --
  `ImportedCost = ForeignPrice + TransportCost + Tariff(0) + RiskCost`,
  VS §18; handel powstaje tylko gdy ekonomicznie uzasadniony lub przy
  krytycznym shortage, FC-TRADE-002; ilość ograniczona przez capacity
  I fizyczną nadwyżkę eksportera). Nowy moduł
  `economy/transport/modes.ts` (`DEFAULT_TRANSPORT_MODE_PROFILES` --
  4 aktywne tryby VS: Foot/Porter, Pack Animal, Cart, River). `Connection`
  (`packages/entities`) zyskuje opcjonalne `infrastructure`/`friction`
  w `createConnection`; fixture Black Mountain dostaje realne dane
  infrastruktury na wszystkich 7 połączeniach (bez tego handel byłby
  fizycznie niemożliwy przez domyślne `capacity=0`). Nowy content
  `content/transportModes/*.json` (4 pliki). 25 nowych testów (372
  łącznie), w tym FC-CORE-001, FC-TRADE-001/002/003/004 i Acceptance
  Gate (region z niedoborem importuje z sąsiada z nadwyżką po realnym
  koszcie transportu; wąskie gardło widocznie ogranicza przepływ).
  Etykieta `app.milestone` zaktualizowana na "M10 -- Trade & Transport"/
  "M10 -- Handel i Transport". **Checkpoint CP1 -- First Living Economy
  osiągnięty.** Świadomie poza zakresem: infrastruktura jako inwestycja
  (M14/M22), państwa/granice (BorderModifier neutralny w VS), realna
  pętla ticków (przyszły milestone).

- Wdrożono **M9 -- Labor & Households**. Nowe moduły
  `packages/simulation/src/systems/economy/labor`: `employment.ts`
  (`matchEmployment` -- zatrudnienie reaktywne, nie strategiczne;
  ogranicza się do min(vacancies, skillDemand, dostępni pracownicy) --
  `employment <= eligible working population` zachodzi konstrukcyjnie)
  i `wages.ts` (`adjustWageOffer` -- ponownie wykorzystuje M8
  `classifyShortageSurplus` i dokładnie ten sam kształt capped+smoothed
  pressure co `price-adjustment.ts`, żeby rynek pracy dostał te same
  zabezpieczenia przed oscylacją od pierwszej wersji). Nowe moduły
  `packages/simulation/src/systems/population`: `consumption.ts`
  (`allocateSpending` -- ECO-014 spending order Survival->Basic->
  Services->Comfort->Prosperity->Luxury->Savings, ściśle w kolejności,
  "no money no purchase") i `needs-satisfaction.ts`
  (`computeNeedsSatisfaction` -- pełna implementacja `CohortNeeds`,
  skeleton z M6). `Company` (`packages/entities`) zyskuje opcjonalne
  `initialWageOffer` w `createCompany`, seedujące `workforce.wageOffer`
  (ten sam kontrakt co M8 `initializeMarketGood`). 38 nowych testów (347
  łącznie), w tym FC-LABOR-001/003, FC-POP-001/002, Acceptance Gate
  (zatrudniona kohorta ma wyższą satysfakcję potrzeb) i
  `labor-wage-price-feedback.test.ts` -- 100-tickowy test regresyjny
  łączący M9 z M8, dowodzący, że sprzężenie płace<->dochód<->popyt<->cena
  nie reintrodukuje oscylacji (ryzyko M9 zmitygowane). Etykieta
  `app.milestone` zaktualizowana na "M9 -- Labor & Households"/"M9 --
  Praca i Gospodarstwa Domowe". Świadomie poza zakresem: migracja jako
  reakcja na warunki pracy (M13), AI decyzje firm o zatrudnieniu (M11),
  rzeczywista wypłata wynagrodzeń nie rusza `Company.finance.cash`
  (wymaga okablowania firma<->gospodarstwo, którego żaden milestone
  jeszcze nie ma), usługi (ECO-012) jako osobna kategoria nie istnieją.

- Wdrożono **M8 -- Market**. Nowe moduły
  `packages/simulation/src/systems/economy/markets`:
  `demand-aggregation.ts` (`aggregateDemand` -- suma nazwanych źródeł
  popytu, source-agnostic, bo M8 ma dziś tylko jedno realne źródło:
  zużycie pośrednie firm z M7), `shortage-surplus.ts`
  (`classifyShortageSurplus` -- inventory buffer dampuje, nie maskuje,
  surowy niedobór podaży) i `price-adjustment.ts`
  (`initializeMarketGood`/`updateMarketGood` -- `PricePressure =
  Sensitivity * ((Demand - EffectiveSupply) / NormalSupply)`, VS §17,
  ze wszystkimi czterema obowiązkowymi zabezpieczeniami -- price floor,
  miesięczny limit zmiany, smoothing, inventory buffer -- od pierwszej
  wersji, zgodnie z mitygacją ryzyka R1 "gospodarka oscyluje" (VS §73)).
  `Market` (`packages/entities`) zyskuje pole `history` (rolling
  supply/demand/price per dobro) jako referencję dla `NormalSupply`.
  Nowe opcjonalne pole `basePrice` (BaseContentPrice) w
  `ResourceDefinition`/`GoodDefinition` (M2 schema) i w
  `content/resources/{grain,iron_ore,timber}.json`/
  `content/goods/{flour,bread}.json` seeduje pierwszy `localPrice`.
  31 nowych testów (309 łącznie), w tym FC-MARKET-001/002/003, price
  bounds i dwa 100-tickowe testy stresowe (zbalansowany i trwale
  niedoborowy rynek -- brak nieskończonej pętli oscylacji). Etykieta
  `app.milestone` zaktualizowana na "M8 -- Market"/"M8 -- Rynek".
  Świadomie poza zakresem: `Company.finance.revenue/costs` (wymaga
  strony popytowej z M9 i AI firm z M11), handel międzyregionalny (M10),
  realna pętla ticków (przyszły milestone).

- Wdrożono **M7 -- Production**. Nowe moduły
  `packages/simulation/src/systems/economy`: `inventory.ts`
  (`addToInventory`/`removeFromInventory` -- fizyczny rejestr dóbr,
  DATA-005, fail-loud przy usunięciu więcej niż jest dostępne, ten sam
  standard co `buildCohortFamily` z M6 i `extractFromDeposit` z M5),
  `companies.ts` (`applyProductionToCompany` -- czysta aktualizacja
  `Company.production` po jednym ticku) i `production.ts`
  (`runProduction` -- jedna firma awansuje o jeden tick, licząc tyle
  batchy Production Method, na ile pozwalają jednocześnie capacity/
  utilization, zasób wydobywany na żywo z `ResourceDeposit` (M5) i
  dobra z własnego Inventory). `ProductionRecipe` (ile dokładnie na
  batch) to osobny typ warstwy symulacji, analogicznie do
  `DemographyRates` z M6 -- `ProductionMethodDefinition.inputs/
  outputs/resourceRequirements` (M2) to tylko topologia grafu, a
  "productivity" to pole jawnie oznaczone w M2 jako należące do M7.

  Dodano realne dane contentu: `content/companyArchetypes/{grain_farm,
  bakery}.json`, `content/productionMethods/{manual_farming,
  manual_food_processing}.json`, plus wzajemne referencje w
  `content/resources/grain.json` i `content/goods/{flour,bread}.json`
  -- dowodzą łańcucha Zboże->Mąka->Żywność (Production-Economy-Master
  §13) na dwóch archetypach. `grain_farm` w fixture'cie M4 pełni rolę
  połączonych farmy i młyna (jedna Production Method), bo fixture ma
  tylko jedną firmę; osobny "Mill" zostaje do rozszerzenia, gdy
  faktycznie pojawi się w świecie. Dodano klucze `en`/`pl` w
  `locales/*/common.json` i zaktualizowano etykietę
  `app.milestone` na "M7 -- Production"/"M7 -- Produkcja".

  Dodano 19 nowych testów (278 łącznie), w tym Acceptance Gate na
  realnych wartościach z `tests/worldgen/fixtures/
  black_mountain_reference.json` (Green Valley Grain Farm produkuje
  mąkę z prawdziwego zboża przez 12 ticków, zapas nigdy ujemny) i test
  łańcucha dwóch firm przez ręczne przeniesienie Inventory (Market to
  M8, więc na razie brak automatycznego handlu). `pnpm typecheck`,
  `pnpm lint` (ten sam 1 warning z M2/M5, bez zmian), `pnpm
  format:check`, `pnpm test` (278/278) i `pnpm build` przechodzą.
  Zaktualizowano roadmapę (M7 = DONE, M8 = READY, sekcja "Wyniki
  wykonania") oraz README.

- Przegląd naprawczy M1-M6 (przed M7): naprawiono cztery usterki, żadna
  niewykryta przez wcześniej zielony `pnpm test`.

  1. **P1** -- `RngStream.nextInt` (`packages/simulation/src/core/rng.ts`)
     przyjmował `maxExclusive` do 2**32 włącznie; `maxExclusive >>> 0`
     zawija 2**32 do 0, więc `nextInt(4294967296)` zwracał `NaN`
     zamiast rzucić. Dodano górną granicę `0xffffffff` do walidacji.
  2. **P1** -- `applyMonthlyDemography`
     (`packages/simulation/src/systems/population/demography.ts`)
     zaokrąglał deterministycznie (`round-half-even`), co dla małych
     populacji (np. 5 kohort po 10 osób) trwale zerowało miesięczne
     urodziny/zgony/aging -- oczekiwana wartość nigdy nie osiągała progu
     0.5, więc po 2400 miesiącach populacja zostawała dokładnie taka
     sama jak na starcie. Zastąpiono losowym zaokrąglaniem (`floor` +
     rzut monetą ważony częścią ułamkową, bezstronne w oczekiwaniu)
     przez dotąd zarezerwowany a nieużywany strumień RNG "demography"
     (SAVE-003) -- `applyMonthlyDemography` przyjmuje teraz wymagany
     parametr `rng: RngStream`.
  3. **P2** -- `agingSpanYears` mogło przyjąć wpis dla terminalnej
     grupy `AGE_65_PLUS`, która nie ma następnej grupy do zestarzenia
     się -- taki wpis po cichu usuwał populację bez żadnego adresata.
     Dodano typ `NonTerminalAgeGroup`
     (`packages/simulation/src/systems/population/cohorts.ts`,
     wyklucza `AGE_65_PLUS` na poziomie typów) oraz sprawdzenie
     strukturalne w pętli aging (`NEXT_AGE_GROUP[ageGroup] ===
     undefined`, niezależne od tego, co akurat ustawia config).
  4. **P1** -- M6 nie dało się podać fixture'owi M4
     (`tests/worldgen/fixtures/black_mountain_reference.json`) bez
     ręcznego przygotowania: `buildCohortFamily` wymaga dokładnie
     pięciu kohort tej samej tożsamości, a fixture ma po jednej kohorcie
     na inną tożsamość (różne `economicClass`/`skillLevel`) na region --
     wywołanie rzucało "expected exactly 5 cohorts, got 2". Dodano
     `groupCohortsIntoFamilies` (`cohorts.ts`): grupuje dowolną listę
     kohort po tożsamości i dopełnia brakujące grupy wieku syntetyczną
     kohortą o populacji 0, nie naruszając sumy populacji;
     `buildCohortFamily` zostaje przy tym równie rygorystyczne
     (fail-loud) dla wywołujących, którzy mają już kompletną rodzinę.

  Dodatkowo zaktualizowano `docs/FIRST-CAUSE-Canonical-Decisions-v0.1.md`
  (sekcje 162 "IMPL-001" i 201 "Następny krok"), które od M1 błędnie
  wskazywały M1 jako kolejny krok mimo ukończonych commitów M1-M6.

  Dodano 2 nowe testy regresyjne w `demography.test.ts` (zamrożenie
  małych populacji, misconfiguration `agingSpanYears.AGE_65_PLUS`), 3
  w `cohorts.test.ts` (`groupCohortsIntoFamilies` na kształcie
  fixture'u M4, zachowanie sumy populacji, brak zmian dla już
  kompletnej rodziny) i 1 w `rng.test.ts`. `pnpm typecheck`, `pnpm
  lint` (ten sam 1 warning sprzed zmian, bez związku), `pnpm test`
  (259/259) i `pnpm build` przechodzą.

- Wdrożono **M6 -- Minimal Population**. Nowe moduły
  `packages/simulation/src/systems/population`: `cohorts.ts`
  (`buildCohortFamily` -- waliduje i indeksuje dokładnie pięć
  `PopulationCohort`, jedną na `AgeGroup`, dzielących tę samą tożsamość
  lokalizacyjno-socjoekonomiczną; rzuca fail-loud przy niekompletnym
  lub niespójnym zestawie) i `demography.ts` (`applyMonthlyDemography`
  -- miesięczne urodzenia/zgony/aging transfer między kohortami, 1 tick
  = 1 miesiąc zgodnie z SIM-001). Współczynniki roczne konwertowane na
  miesięczne przez składanie (`1 - (1-roczny)^(1/12)`), nie dzielenie
  przez 12. Domyślne stawki dobrane tak, by zbliżać się do
  zastępowalności pokoleń -- zweryfikowano numerycznie przed napisaniem
  testu (ta sama dyscyplina co przy M5 sustainable yield), że przebieg
  200-letni/2400-tickowy zostaje w granicach ok. ±10% populacji
  startowej. Emitowane fakty CE-01: `population_increased`/
  `population_declined`.

  Needs skeleton bez nowego kodu -- `CohortNeeds` z M3 zostaje
  wyzerowane i nietknięte przez demografię, gotowe pod M9. Profesje VS
  (POP-005) pozostają dokumentacyjne -- `profession` wciąż
  nieprzypisywane, bo zatrudnienie to M9/M11.

  Dodano 13 nowych testów (253 łącznie): kompletność/spójność
  `buildCohortFamily`, ręcznie zweryfikowany dokładny transfer aging,
  terminalność `AGE_65_PLUS`, izolacja urodzeń do `AGE_0_14`, brak
  ujemnej populacji nawet przy 100% rocznej śmiertelności, conservation
  audit (suma zmian populacji === suma delt faktów na każdym z 50
  ticków) oraz test smoke 200-letni. `pnpm typecheck`, `pnpm lint`
  (ten sam 1 warning z M2/M5, bez zmian), `pnpm format:check`, `pnpm
  test` (253/253), `pnpm build` i `pnpm test:e2e` przechodzą.
  Zaktualizowano roadmapę (M6 = DONE, M7 = READY, sekcja "Wyniki
  wykonania") oraz README.

## 2026-09-16

- Wdrożono **M5 -- Resources** (pierwszy milestone z realną logiką
  gospodarczą). Nowy pakiet `packages/causality` (CE-01 "Fact
  Infrastructure": `SimulationFact`, `FactStore` z deterministycznymi
  ID `fact_<tick>_<sequence>`, indeksy po ticku/typie/encji/regionie,
  emission API) -- bez zależności od żadnego innego pakietu, więc
  `packages/simulation` mógł dodać na niego zależność produkcyjną bez
  ryzyka cyklu. `packages/simulation/src/systems/resources`: cykl
  odkrycia złoża `UNKNOWN -> SUSPECTED -> DISCOVERED -> ASSESSED`
  (nigdy się nie cofa, nie wymusza wydobycia), ekstrakcja respektująca
  fizyczną zasadę "wydobycie nie może stworzyć zasobu" (`extracted =
  min(amount, dostępna ilość)`) z emisją faktów trendu
  (`extraction_started/_increased/_decreased`) i `resource_depleted`,
  oraz regeneracja zasobów odnawialnych modelem wzrostu logistycznego
  do `carryingCapacity` (dodano to pole do `DepositRenewableState` w
  `packages/entities`, świadomie zostawione niekompletne w M3). Nowy
  `ResourceDepositReadModel` respektuje TECH-009 -- dokładna ilość
  złoża jest ukryta, dopóki nie zostanie odkryte.

  Start UI-F0: design tokens (`apps/desktop/src/design/tokens.css`,
  dokładne wartości z `UI Visual Design System v1.0`), siedem
  komponentów `FC*` (`FCSection`, `FCPanel`, `FCTextButton`,
  `FCPrimaryAction`, `FCTabs`, `FCMetric`, `FCTrend`) oraz
  `FCAppShell`/`FCTopNavigation`/`FCSimulationBar`, które zastąpiły
  surowy shell z M0 w `apps/desktop/src/App.tsx`. `FCSimulationBar`
  pokazuje tylko realne dane (status workera, wersja silnika) --
  świadomie bez kontrolek tick/prędkości, bo żadna pętla ticków
  jeszcze nie działa w aplikacji desktopowej.

  Dodano 55 nowych testów (240 łącznie), w tym test stabilizacji
  zasobu odnawialnego wokół sustainable yield (500 ticków stałego
  popytu, zweryfikowany numerycznie przed napisaniem testu, żeby
  uniknąć niestabilnej równowagi przy zbyt wysokim popycie) oraz test
  conservation audit (`cumulativeExtraction + quantity ===
  initialQuantity` na każdym kroku). `pnpm typecheck`, `pnpm lint`,
  `pnpm format:check`, `pnpm test` (240/240), `pnpm build` i `pnpm
  test:e2e` przechodzą. Zaktualizowano roadmapę (M5 = DONE, M6 =
  READY, sekcja "Wyniki wykonania") oraz README. Weryfikacja wizualna
  nowego UI w przeglądarce nie była możliwa (rozszerzenie Claude in
  Chrome niepodłączone w tym środowisku) -- poprawność potwierdzają
  testy RTL (`App.test.tsx`) i e2e Playwright, które przechodzą bez
  zmian w asercjach poza zaktualizowanym tekstem milestone'u.
- Implemented **M4 -- Black Mountain Reference Fixture** (new
  `packages/worldgen` package): a generic
  `JSON -> Zod -> entity factories -> createWorldState` fixture loader
  (`fixtures/fixture-schema.ts` + `fixtures/load-world-fixture.ts`)
  that knows nothing about any specific reference scenario (World
  Generation Spec SS16/SS36), and the hand-written
  `tests/worldgen/fixtures/black_mountain_reference.json`: 8 regions, 1
  continent, ~50 population, 4 settlements, 3 resource deposits
  (Black Mountain's Iron Ore starts hidden/UNKNOWN with no forced
  mine, per SS16), 7 connections forming a route from Black Mountain to
  an external market, 1 company + inventory, 1 market, 4
  TechnologyStates -- matching World Generation Spec SS64's "first
  prototype" scale. Added the first 4 typed UI Read Models
  (`packages/simulation/src/read-models`): `WorldSummaryReadModel`,
  `RegionSummaryReadModel`, `AtlasRegionReadModel`,
  `ImportantNowReadModel` (the last always returns `[]` today, with a
  documented reason -- none of its data sources, e.g. Chronicle or
  shortages, exist yet).

  **Correction to M3:** giving `packages/simulation` a production
  dependency on `packages/entities` (for Read Models) exposed that
  `packages/entities`' M3-era `devDependency` on `@first-cause/simulation`
  (used only by one checksum-roundtrip test) made pnpm report a real
  cyclic workspace dependency. Fixed by dropping that devDependency and
  rewriting the test as a plain `JSON.stringify`/`JSON.parse` roundtrip
  (`WorldState` never uses `Map`/`Set`, so it needed none of M1's
  `canonicalStringify` Map/Set handling to prove the same property).
  `packages/entities` now has zero dependency, dev or production, on
  `packages/simulation`.

  Added 21 new tests: structural fixture-rejection tests, 7 tests
  against the real Black Mountain fixture (region/population counts,
  hidden Iron Ore + no forced mine, BFS route-to-market, food-producing
  region, alternative economic region, non-trivial transport cost), a
  grep-based test that no non-test `.ts` source file under
  `worldgen`/`entities`/`simulation` mentions the fixture's identity, a
  single-empty-tick integration test (M1's `HeadlessRunner.step()`
  alongside a real `WorldState`, proving the M4 Acceptance Gate's
  "runs one empty tick without error, as a no-op"), and 9 Read Model
  contract tests. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`,
  `pnpm test` (208/208), `pnpm build` and `pnpm test:e2e` all pass.
  Widened the ESLint Simulation-Core React/Electron import boundary to
  include `packages/worldgen/**`. Updated the roadmap (M4 = DONE, M5 =
  READY, "Wyniki wykonania" recorded, including the M3 correction),
  README and AGENTS.md accordingly. No economic/demographic/AI logic or
  procedural generation exists yet (M5/M22+), as scoped.
- Implemented **M3 -- World State Foundation** (new `packages/entities`
  package): typed runtime entity shapes + `create*()` factories for all
  11 in-scope entities (`World`, `Continent`, `Region` incl.
  `geography`/`environment`, `Connection`, `ResourceDeposit`,
  `Settlement`, `PopulationCohort`, `Company`, `Market`, `Inventory`,
  `TechnologyState`), each enforcing Entity Data Model rule 9 ("no
  negative stocks/NaN/dangling refs") at construction. Fields
  referencing out-of-M3-scope entity types (Culture, Nation, State,
  Infrastructure, ServiceCapacity) are intentionally omitted rather
  than left dangling. `world-state.ts` (`createWorldState`) assembles
  all 11 into one `WorldState`, validates every forward reference, and
  *reconstructs* every back-reference cache (`Region.resources.depositIds`,
  `World.regionIds`, `Region.population.totalPopulation`, ...) from
  canonical entity data instead of trusting hand-maintained arrays
  (DATA-003/DATA-004). `core/indexes.ts` + `indexes/world-indexes.ts`
  add the 5 named runtime indexes from the roadmap's M3 module list
  (`companiesByRegion`, `cohortsByRegion`, `depositsByRegion`,
  `settlementsByRegion`, `connectionsByRegion`), rebuilt from canonical
  state on every call. `packages/entities` deliberately has no
  *production* dependency on `packages/simulation` (only a test-only
  one, used solely for the checksum-roundtrip test) to avoid a future
  import cycle once M5+ systems in `packages/simulation` need to
  operate on entity types; `core/validation.ts` is accordingly a small
  local copy, not a shared import -- see the doc comment there. Added
  42 tests (188 total): per-entity invariant tests, referential-
  integrity tests for 3 different dangling-reference cases,
  input-order-independence, and a canonical-serialize/re-checksum
  roundtrip via `@first-cause/simulation` (devDependency only). Widened
  the ESLint Simulation-Core React/Electron import boundary to include
  `packages/entities/**`. `pnpm typecheck`, `pnpm lint`, `pnpm
  format:check`, `pnpm test` (188/188), `pnpm build` and `pnpm
  test:e2e` all pass. Updated the roadmap (M3 = DONE, M4 = READY,
  "Wyniki wykonania" recorded), README and AGENTS.md accordingly. No
  economic/demographic/AI logic exists yet (M5+), as scoped.
- Implemented **M2 -- Data Foundation** (`packages/content/src`): Zod
  schemas for all 10 in-scope content types (Resource, Good,
  CompanyArchetype, ProductionMethod, Discovery, Service, TransportMode,
  Intervention, EventType, ChronicleTemplate), built from
  Content-Localization-Spec SS41-50's minimal field lists (deeper
  economic modeling stays M5/M7 scope, not invented early).
  `schema/reference-field.ts` declares each type's reference fields
  declaratively, powering generic (not per-type) validators:
  `validators/reference-validation.ts` (missing references, DFS
  dependency-cycle detection, CONTENT-009 phase violations) and
  `validators/localization-coverage.ts` (missing `en` key = error,
  missing secondary-locale key = warning). `loaders/content-pack.ts`
  (`loadContentPack`) ties everything together: per-type
  `JSON -> Zod -> duplicate-ID check -> DefinitionRegistry`
  (`create-definition-loader.ts`, generalized from M0's
  `loadResourceDefinitions`, now a thin wrapper over it) plus cross-type
  ID-collision checking and Content Statistics (SS147). Renamed the M0
  placeholder field `phase` -> `implementationPhase` and
  `finite` -> `renewable` on `ResourceDefinition` to match the canonical
  spec (CONTENT-008), updating the existing fixture/tests accordingly.
  Added real VS-subset content
  (`content/resources/{iron_ore,grain,timber}.json`,
  `content/goods/{flour,bread}.json`) with full EN/PL localization
  keys. Added 62 new tests: one per CONTENT-010 checklist item
  (duplicate ID, cross-type ID collision, missing ref, invalid range,
  dependency cycle, phase violation, missing EN key, missing
  secondary-locale warning), a content-load-determinism test, 40
  schema-level structural tests across all 10 types, and an integration
  test reading the real files from `content/`/`locales/` off disk.
  `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`
  (146/146), `pnpm build` and `pnpm test:e2e` all pass. Updated the
  roadmap (M2 = DONE, M3 = READY, "Wyniki wykonania" recorded) and
  README accordingly. No World State or gameplay systems exist yet
  (M3+), as scoped.
- Implemented **M1 -- Deterministic Core** (`packages/simulation/src/core`):
  `core/time` (tick-derived `SimulationClock`/`tickToDate`, 1 tick = 1
  month), `core/rng` (from-scratch `xoshiro128**` seeded via
  `splitmix32`, 8 SAVE-003 named streams derived via `fnv1a32`, unbiased
  `nextInt` via Lemire rejection sampling), `core/ids` (deterministic
  per-prefix `IdGenerator`), `core/validation`
  (finite/non-negative/safe-integer assertions), `core/rounding`
  (resolves OPEN-008: integer minor-unit money, `MONEY_SCALE = 100`,
  round-half-to-even), `core/serialization` (`canonicalStringify` --
  sorted object keys/Map entries/Set values), `core/checksum`
  (`computeChecksum`, `fnv1a32x2-v1`), `core/commands`
  (`CommandBoundary` with deterministic same-tick ordering, SAVE-006),
  and `core/runner` (`HeadlessRunner` tying them together: `step`,
  `runTicks`, `getState`/`fromState`, `checksum`). Added
  `docs/adr/ADR-001-m1-deterministic-core.md` recording the numeric/
  algorithm decisions `Canonical Decisions` SS201/OPEN-008 left open for
  M1. Added an ESLint rule forbidding `Math.random`/`Date.now`/
  `new Date()`/`crypto.randomUUID` under `packages/simulation/src/core`
  (SAVE-004), verified with a probe file that it actually fires. Updated
  `pnpm sim:run` to also run a 12-tick `HeadlessRunner` demo. Added 62
  new Vitest tests, including the M1 Acceptance Gate itself (Technology
  Stack Decision SS98): 10 000 empty ticks reproducible, RNG golden
  vectors, x1-vs-batch checksum equality, and mid-run save/restore
  roundtrip. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm
  test` (94/94), `pnpm build` and `pnpm test:e2e` all pass. Updated the
  roadmap (M1 = DONE, M2 = READY, "Wyniki wykonania" recorded) and
  README accordingly. No World State or gameplay systems exist yet
  (M3+), as scoped.
- Reconciled documentation after M0/M0.1: current roadmap links now point
  to v0.2 and the next milestone is M1. Synchronized canonical stack,
  World Generation, VS save, money and UI decisions with existing specs;
  retained genuinely open implementation choices for an M1 ADR.
- Consolidated identical economy specs into the canonical `-PL` file,
  retaining `-POLSKI` as a compatibility link. Removed stale UI version
  metadata, clarified UI track timing and marked the master audit as
  historical. Recorded missing Golden UI references and the unavailable
  technology catalog; M15 documentation readiness is now PARTIAL.
  Fixed obsolete architecture/economy source filenames and updated
  completed next-document recommendations in the VS/UI specs.
  No gameplay code or milestone completion status was changed.

## 2026-09-15

- Completed **M0.1 Audit Fixes** (M0-01–M0-05): bounded IPC request and
  shutdown lifecycle with controlled-worker tests; Ubuntu Electron E2E
  runs under Xvfb; detached, deeply frozen content definitions and
  locale-independent ID ordering with regression tests. Synchronized
  README/roadmap status, package creation policy, semantic validation
  scope and audited dev results. M1 remains unimplemented; remote CI
  is not claimed as verified by local gates.

- Configured `origin` (`https://github.com/SerMartin1/first-cause`,
  private repo created via `gh repo create`) and pushed `main`
  (required refreshing the `gh` auth token with the `workflow` scope
  so `.github/workflows/ci.yml` could be pushed).

- Created `docs/FIRST-CAUSE-Implementation-Roadmap-v0.1.md`: translated
  the existing canonical documentation (`Canonical Decisions`,
  `Master Audit`, `Technology Stack Decision`, `World Generation Spec`,
  and all system specs) into an executable milestone sequence
  (`M0`-`M25` Vertical Slice + `M26`-`M29` post-VS), with dependency
  graph, critical path, checkpoints `CP0`-`CP7`, and per-milestone
  Definition of Done.
- Implemented **M0 -- Repository Foundation**: pnpm monorepo
  (`apps/desktop`, `packages/{shared,content,localization,simulation}`),
  TypeScript strict, Electron (`electron-vite`) + React + Vite shell,
  a real `worker_threads` Simulation Worker with typed IPC
  (`PING`/`PONG`, `GET_CORE_STATUS`), content foundation (Zod schema +
  `DefinitionRegistry` + loader + one real definition, `iron_ore`),
  EN/PL localization foundation (`i18next`/`react-i18next`), Vitest +
  React Testing Library + Playwright (Electron E2E smoke test),
  ESLint (with an architecture-boundary rule keeping Simulation Core
  free of React/Electron imports) + Prettier, and GitHub Actions CI.
- Fixed a real bug found during M0 verification: `electron-vite`'s
  default `externalizeDepsPlugin()` left `@first-cause/shared` (an ESM
  package) as a runtime `require()` in the CJS main/preload bundle,
  causing `ERR_REQUIRE_ESM` and preventing the app from starting at
  all. Fixed by excluding that package from externalization in
  `apps/desktop/electron.vite.config.ts` so esbuild inlines it instead.
- Updated the roadmap after M0: `M0 = DONE`, `M1 = READY`, with a
  "Wyniki wykonania" note recording what was built, the bug above, and
  remaining technical debt (P1: `pnpm dev`/HMR not interactively
  verified in this environment; P2: `packages/entities`/`worldgen` not
  yet scaffolded, no installer yet).
- Initial commit: `475ffd8` -- "feat: establish FIRST CAUSE roadmap and
  M0 foundation". No remote configured yet, so nothing has been pushed.
- Added this `CHANGELOG.md` and the accompanying rule in `AGENTS.md` to
  record every future change here with its date.
