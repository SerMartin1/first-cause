import { SimulationClock, type WorldRunnerState } from "@first-cause/simulation";

/**
 * SaveGame envelope (Save/Determinism/Performance Spec SS31-38, SAVE-007).
 *
 * SS32's "recommended model" lists `rngState`/`architectState`/
 * `historicalState` as SIBLINGS of `worldState`. This codebase's actual
 * architecture already couples them inseparably inside `WorldRunner`
 * (RNG lives on `HeadlessRunner`, Architect Influence and Causality/
 * Chronicle history all read/write together every tick, see
 * `WorldRunner.step()`) -- SS58 Canonical State itself lists "RNG" and
 * "history anchors" as part of the same canonical-state bucket as
 * entities/inventories/prices, so nesting them together under one
 * `worldState: WorldRunnerState` section (instead of inventing four
 * separate top-level fields that would just be a different view of the
 * SAME `WorldRunner.getState()` object) is a deliberate simplification,
 * not a spec violation: SS32 itself is framed as "rekomendowany model",
 * not a mandated literal shape. `worldConfiguration` (SS32) is likewise
 * folded away here -- everything it would hold (`worldSeed`/
 * `startYear`/`startMonth`) already lives inside `worldState.headless`,
 * and `WorldRunner.fromState` reads it from exactly there; a second copy
 * would just be a redundant source of truth.
 */
/**
 * v2 (SET-LIFECYCLE-001, 2026-09-29): `Settlement.status` (`ACTIVE` |
 * `ABANDONED`) + `Settlement.abandonedTick`. Zapisy v1 migruje
 * `MIGRATIONS[1]` (`migrations.ts`).
 */
/**
 * v3 (M21-VIS-R4B): fakty `trade_flow_active` z zapisów silnika < 3
 * (ilość oceniona) przechodzą na typ `trade_flow_evaluated`
 * (`MIGRATIONS[2]`); znaczenie historycznych faktów jest jawne w danych.
 */
/**
 * v4 (2026-10-01): pracownicy w całych osobach -- ułamkowe zatrudnienie z
 * zapisów silnika < 4 normalizowane przez `MIGRATIONS[3]`.
 */
/**
 * v5 (2026-10-01, etap 2 naprawy gospodarki): `PopulationCohort.savings`
 * (płynne oszczędności) i `Inventory.consignment` (komis) -- `MIGRATIONS[4]`.
 */
/**
 * v6 (2026-10-01, dochód właścicielski): `Company.finance.retainedEarnings`
 * i `operatingCostHistory` -- `MIGRATIONS[5]` (saldo 0, gotówka bez zmian).
 */
/**
 * v7 (2026-10-01, P14): `MarketGoodState.offered` / `ticksWithoutOffers` /
 * `priceSuspension` -- `MIGRATIONS[6]` (licznik 0 tylko przy śladzie oferty w
 * zapisanym ticku, bez odtwarzania historii).
 */
/**
 * v8 (2026-10-01, etap 4B): `Company.finance.investmentReserve` --
 * `MIGRATIONS[7]` (rezerwa 0); opcjonalne `Inventory.consignmentPrice`.
 */
export const SCHEMA_VERSION = 8;
/** Bumped when `@first-cause/content` definitions change in a save-relevant way (SS36) -- no such change has happened yet. */
export const CONTENT_VERSION = 1;
/** Bumped when simulation SEMANTICS change in a save-relevant way (SS37) -- distinct from `SCHEMA_VERSION` (structure) and `CONTENT_VERSION` (definitions). */
/** v2: osada z populacją 0 przechodzi ACTIVE → ABANDONED w tym samym ticku (SET-LIFECYCLE-001). */
/**
 * v3 (M21-VIS-R4B): fakt `trade_flow_active` niesie ilość faktycznie
 * przeniesioną między inventory (`settleTradeFlow`), nie ilość ocenioną;
 * bez fizycznego ruchu faktu nie ma. Fakty zapisane silnikiem < 3 niosą
 * ilość ocenioną -- migracja schematu v2 -> v3 nadaje im typ `trade_flow_evaluated`.
 */
/**
 * v4 (2026-10-01): siła robocza i zatrudnienie w całych osobach (limit
 * kohorty `ceil`, pula regionu `floor` z `ludność × 0,65`); wcześniej
 * ułamki ludzi (np. 6,5 pracownika). Ta sama wersja: zamknięta firma
 * zwalnia pracowników (N1; firma zamknięta w zapisie silnika < 4 zwalnia
 * ich w pierwszym ticku po wczytaniu) i cena przy zerowej podaży
 * uwzględnia zapas regionu (N2) -- diagnoza Black Mountain 2026-10-01; plan
 * produkcji, zatrudnienia i płac firm (etap 1: N3 + N4, Canonical §52F).
 */
/**
 * v5 (2026-10-01, etap 2: N7 + minimalne rozliczenie N6): pieniądz krąży --
 * płace trafiają do gospodarstw, gospodarstwa kupują z oszczędności (także bez
 * pracy), firmy dostają zapłatę dopiero od kupujących (komis).
 */
/**
 * v6 (2026-10-01, dochód właścicielski, Canonical §52H): po rozliczeniu ticka
 * firma wypłaca właścicielowi min(wynik zatrzymany, gotówka − bufor 2 mies.).
 */
/**
 * v7 (2026-10-01, etap 4A, P12): cena jednostkowa `localPrice` z precyzją 6
 * miejsc (`roundPrice`), nie do grosza; pieniądze bez zmian (grosze). Bez
 * zmiany struktury -- SCHEMA_VERSION zostaje 6, migracja niepotrzebna: cena
 * zapisana do grosza jest poprawną ceną 6-miejscową, a kolejne ticki liczą ją
 * już precyzyjnie.
 */
/**
 * v8 (2026-10-01, P12b + P14): stawka płacy z precyzją 6 miejsc (wypłata w
 * groszach przy rozliczeniu); trwały brak ofert zatrzymuje presję cenową
 * (cena orientacyjna); zamówienia importu wg niezaspokojonych potrzeb i
 * środków kupujących po koszcie dostawy, bez podwójnego liczenia.
 */
/**
 * v9 (2026-10-01, etap 4B): płatny przewóz (przewoźnik, opłata właściciela
 * towaru, cena wyładunku lotu), rozbudowa wykonywana i opłacana u firmy
 * budowlanej, rezerwa inwestycyjna P13, zwrot kapitału przy likwidacji, handel
 * przed rozliczeniem finansów.
 */
export const ENGINE_VERSION = 9;

export interface SaveGameVersions {
  readonly schemaVersion: number;
  readonly contentVersion: number;
  readonly engineVersion: number;
}

/**
 * SS33 Metadata. `createdAt`/`savedAt` are ISO-8601 wall-clock strings
 * the CALLER supplies (SAVE-004: Simulation Logic itself never reads
 * system time -- `buildSaveGame` doesn't call `Date.now()`, so this
 * module stays a pure function of its inputs) -- SS33 explicitly notes
 * they "nie wpływają na symulację", and `checksum.ts` excludes them from
 * `worldChecksum` for exactly that reason.
 */
export interface SaveGameMetadata {
  readonly saveId: string;
  readonly saveName: string;
  readonly createdAt: string;
  readonly savedAt: string;
  readonly playtimeSeconds: number;
  readonly worldName: string;
  readonly currentYear: number;
  readonly currentMonth: number;
  readonly currentTick: number;
  readonly seed: string;
  readonly worldSize: string;
  readonly regionCount: number;
}

/**
 * SS32 `persistenceState`: bookkeeping ABOUT the save file/history
 * management, not canonical simulation content. Minimal for VS -- SS77
 * Compaction Boundary just needs to know when compaction last ran so a
 * caller can decide whether to run it again, not a full compaction log
 * (TODO tuning: the exact scheduling policy is a caller/UI decision, see
 * `compaction.ts`).
 */
export interface SaveGamePersistenceState {
  readonly lastCompactedAtTick: number | undefined;
}

export interface SaveGame {
  readonly metadata: SaveGameMetadata;
  readonly versions: SaveGameVersions;
  readonly worldState: WorldRunnerState;
  readonly persistenceState: SaveGamePersistenceState;
  /** SS273 UI integration note: presentation state (selected region, viewport, filters, ...), carried opaquely -- `packages/persistence` never reads or validates its shape, only stores/returns it. `undefined` when the caller has none. */
  readonly optionalUiState: Readonly<Record<string, unknown>> | undefined;
}

export interface BuildSaveGameInput {
  /** Already-compacted `WorldRunner.getState()` output, e.g. from `compaction.ts`'s `compactWorldRunnerState` -- `buildSaveGame` itself never compacts, so a caller who skips that step gets exactly what it passed in. */
  readonly state: WorldRunnerState;
  readonly saveId: string;
  readonly saveName: string;
  readonly createdAt: string;
  readonly savedAt: string;
  readonly playtimeSeconds: number;
  readonly worldName: string;
  readonly lastCompactedAtTick?: number;
  readonly optionalUiState?: Readonly<Record<string, unknown>>;
}

/** Pure: never touches wall-clock time or the filesystem itself (see `atomic-write.ts` for that). */
export function buildSaveGame(input: BuildSaveGameInput): SaveGame {
  const state = input.state;
  const date = SimulationClock.fromState(state.headless.clock).date;

  return {
    metadata: {
      saveId: input.saveId,
      saveName: input.saveName,
      createdAt: input.createdAt,
      savedAt: input.savedAt,
      playtimeSeconds: input.playtimeSeconds,
      worldName: input.worldName,
      currentYear: date.year,
      currentMonth: date.month,
      currentTick: state.headless.clock.tick,
      seed: String(state.headless.worldSeed),
      worldSize: state.worldState.world.configuration.worldSizePreset,
      regionCount: Object.keys(state.worldState.regions).length,
    },
    versions: {
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      engineVersion: ENGINE_VERSION,
    },
    worldState: state,
    persistenceState: {
      lastCompactedAtTick: input.lastCompactedAtTick,
    },
    optionalUiState: input.optionalUiState,
  };
}
