import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  runTradeScenario,
  TRADE_SCENARIO as S,
  TRADE_SCENARIO_RECIPES,
} from "@first-cause/simulation";
import { buildSaveGame } from "./envelope.js";
import { writeSaveFile } from "./atomic-write.js";
import { migrateV3ToV4, migrateV4ToV5 } from "./migrations.js";
import { loadGame } from "./save-load.js";

/*
 * Decyzja właściciela (2026-10-01), ENGINE_VERSION 4: pracownicy to całe
 * osoby. Zapis silnika 3 z ułamkowym zatrudnieniem (np. 6,5) jest przy
 * wczytaniu doprowadzany do całych osób (migracja schematu v3 → v4);
 * kolejne ticki pozostają całkowite.
 */

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
const metadata = {
  saveId: "s",
  saveName: "S",
  createdAt: "2026-01-01T00:00:00.000Z",
  savedAt: "2026-01-01T00:00:00.000Z",
  playtimeSeconds: 0,
  worldName: "W",
};
const FARM = "scenario_company_farm";
const WORKER = "scenario_cohort_farm_worker";

describe("whole-people workforce across an engine-3 save", () => {
  it("engine-3 fractional employment → load → whole people, invariant kept, next ticks stay whole", async () => {
    const runner = runTradeScenario(1);
    const state = runner.getState();
    // Stan w kształcie silnika 3: 1,3 pracownika (2 osoby × 0,65), wakaty 0,7.
    const legacy = {
      ...state,
      worldState: {
        ...state.worldState,
        companies: {
          ...state.worldState.companies,
          [FARM]: {
            ...state.worldState.companies[FARM]!,
            workforce: {
              ...state.worldState.companies[FARM]!.workforce,
              employees: 1.3,
              vacancies: 0.7,
            },
          },
        },
        populationCohorts: {
          ...state.worldState.populationCohorts,
          [WORKER]: { ...state.worldState.populationCohorts[WORKER]!, employment: 1.3 },
        },
      },
    };
    const dir = await mkdtemp(path.join(tmpdir(), "first-cause-whole-workforce-"));
    tempDirs.push(dir);
    const file = path.join(dir, "save.json");
    const envelope = buildSaveGame({ ...metadata, state: legacy });
    await writeSaveFile(file, {
      ...envelope,
      versions: { ...envelope.versions, schemaVersion: 3, engineVersion: 3 },
    });

    const { runner: loaded, saveGame: data } = await loadGame(file, {
      productionRecipesByMethodId: TRADE_SCENARIO_RECIPES,
    });
    expect(data.versions.schemaVersion).toBe(8);
    const farm = loaded.worldState.companies[FARM]!;
    expect(farm.workforce.employees).toBe(1);
    expect(farm.workforce.vacancies).toBe(0);
    expect(loaded.worldState.populationCohorts[WORKER]!.employment).toBe(1);
    // Ludność bez zmian (migracja dotyczy tylko zatrudnienia).
    expect(loaded.worldState.populationCohorts[WORKER]!.population).toBe(
      state.worldState.populationCohorts[WORKER]!.population,
    );

    loaded.runTicks(6);
    for (const company of Object.values(loaded.worldState.companies)) {
      expect(Number.isInteger(company.workforce.employees)).toBe(true);
      expect(Number.isInteger(company.workforce.vacancies)).toBe(true);
    }
    for (const cohort of Object.values(loaded.worldState.populationCohorts))
      expect(Number.isInteger(cohort.employment)).toBe(true);
    expect(loaded.worldState.regions[S.exporterRegionId]).toBeDefined();
  });

  it("migrateV3ToV4 is pure and leaves already-whole saves unchanged", () => {
    const state = runTradeScenario(1).getState();
    const raw = {
      versions: { schemaVersion: 3, contentVersion: 1, engineVersion: 3 },
      worldState: state,
    };
    const frozen = JSON.stringify(raw);
    const migrated = migrateV3ToV4(raw) as typeof raw;
    expect(migrated.versions.schemaVersion).toBe(4);
    expect(migrated.worldState.worldState).toEqual(state.worldState);
    expect(JSON.stringify(raw)).toBe(frozen);
    expect(migrateV3ToV4(raw)).toEqual(migrated);
  });
});

describe("household savings across a schema-4 save (etap 2, N7)", () => {
  it("migrateV4ToV5 gives cohorts 3 months of the survival basket at the saved local price; existing savings untouched; pure", () => {
    const state = runTradeScenario(1).getState();
    const withoutSavings = {
      ...state.worldState,
      populationCohorts: Object.fromEntries(
        Object.entries(state.worldState.populationCohorts).map(([id, c]) => {
          const { savings: _drop, ...rest } = c;
          return [id, rest];
        }),
      ),
    };
    const raw = {
      versions: { schemaVersion: 4, contentVersion: 1, engineVersion: 4 },
      worldState: { ...state, worldState: withoutSavings },
    };
    const frozen = JSON.stringify(raw);
    const migrated = migrateV4ToV5(raw) as typeof raw & {
      worldState: { worldState: typeof state.worldState };
    };
    expect(migrated.versions.schemaVersion).toBe(5);
    const w = migrated.worldState.worldState;
    const consumers = w.populationCohorts.scenario_cohort_coast_consumers!;
    const price = w.markets.scenario_market_coast!.goods.flour!.localPrice;
    expect(consumers.savings).toBeCloseTo(consumers.population * 3 * price * 3, 2);
    expect(JSON.stringify(raw)).toBe(frozen);
    // Kohorta z już ustawionym saldem zostaje bez zmian.
    expect(
      (migrateV4ToV5({ ...raw, worldState: state }) as typeof migrated).worldState.worldState
        .populationCohorts.scenario_cohort_coast_consumers!.savings,
    ).toBe(state.worldState.populationCohorts.scenario_cohort_coast_consumers!.savings);
  });
});
