import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  computeChecksum,
  createPmAdoptionScenarioRunner,
  PM_ADOPTION_SCENARIO as S,
  PM_ADOPTION_SCENARIO_RUNNER_CONFIG,
  type WorldRunner,
} from "@first-cause/simulation";
import type { WorldState } from "@first-cause/entities";
import { buildSaveGame, ENGINE_VERSION, SCHEMA_VERSION } from "./envelope.js";
import { writeSaveFile } from "./atomic-write.js";
import { migrateV5ToV6 } from "./migrations.js";
import { loadGame, saveGame } from "./save-load.js";

/*
 * Dochód właścicielski (decyzja właściciela 2026-10-01, SCHEMA 6 / ENGINE 6):
 * zapis v5 nie ma wyniku zatrzymanego -- migracja przyjmuje 0, zostawia
 * gotówkę i oszczędności bez zmian, niczego nie wypłaca; save/load nie
 * nalicza wypłat ponownie, a kontynuacja jest deterministyczna.
 */

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
async function tempFile(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "first-cause-owner-income-"));
  tempDirs.push(dir);
  return path.join(dir, "save.json");
}
const metadata = {
  saveId: "s",
  saveName: "S",
  createdAt: "2026-01-01T00:00:00.000Z",
  savedAt: "2026-01-01T00:00:00.000Z",
  playtimeSeconds: 0,
  worldName: "W",
};
const money = (w: WorldState) =>
  Math.round(
    100 *
      (Object.values(w.populationCohorts).reduce((s, c) => s + c.savings, 0) +
        Object.values(w.companies).reduce((s, c) => s + c.finance.cash, 0)),
  );
const payouts = (runner: WorldRunner) =>
  runner.facts.filter((f) => f.type === "company_owner_payout").length;

describe("owner income across save / load", () => {
  it("schema 5 save → load: retained result 0, cash and savings kept, nothing paid at load", async () => {
    expect(SCHEMA_VERSION).toBe(8);
    expect(ENGINE_VERSION).toBe(9);
    const runner = createPmAdoptionScenarioRunner();
    for (let i = 0; i < 6; i++) runner.step();
    const state = runner.getState();
    const company = state.worldState.companies[S.companyId]!;
    // Kształt zapisu v5: bez nowych pól finansów.
    const { retainedEarnings: _re, operatingCostHistory: _h, ...legacyFinance } = company.finance;
    const legacy = {
      ...state,
      worldState: {
        ...state.worldState,
        companies: { [S.companyId]: { ...company, finance: legacyFinance } },
      },
    };
    const raw = {
      versions: { schemaVersion: 5, contentVersion: 1, engineVersion: 5 },
      worldState: legacy,
    };
    const frozen = JSON.stringify(raw);
    const migrated = migrateV5ToV6(raw) as unknown as { worldState: typeof state };
    expect(JSON.stringify(raw)).toBe(frozen); // czysta funkcja
    expect(migrateV5ToV6(raw)).toEqual(migrated); // deterministyczna

    const file = await tempFile();
    const envelope = buildSaveGame({ ...metadata, state: legacy as unknown as typeof state });
    await writeSaveFile(file, {
      ...envelope,
      versions: { ...envelope.versions, schemaVersion: 5, engineVersion: 5 },
    });
    const { runner: loaded, saveGame: data } = await loadGame(file, PM_ADOPTION_SCENARIO_RUNNER_CONFIG);
    expect(data.versions.schemaVersion).toBe(8);
    const after = loaded.worldState.companies[S.companyId]!;
    expect(after.finance.retainedEarnings).toBe(0);
    expect(after.finance.operatingCostHistory).toEqual([company.finance.costs]);
    expect(after.finance.cash).toBe(company.finance.cash);
    expect(money(loaded.worldState)).toBe(money(state.worldState));
    expect(loaded.worldState.populationCohorts).toEqual(state.worldState.populationCohorts);
    expect(payouts(loaded)).toBe(payouts(runner));

    // Pierwszy tick po wczytaniu: wypłata najwyżej z zysku tego ticka.
    const tick = loaded.tick;
    loaded.step();
    const profit = loaded.facts
      .filter((f) => f.tick === tick && f.type === "company_finances_settled")
      .reduce((s, f) => s + Number(f.values.delta), 0);
    const paid = loaded.facts
      .filter((f) => f.tick === tick && f.type === "company_owner_payout")
      .reduce((s, f) => s - Number(f.values.delta), 0);
    expect(Math.round(paid * 100)).toBeLessThanOrEqual(Math.max(0, Math.round(profit * 100)));

    // Ten sam zapis v5 wczytany drugi raz → identyczna kontynuacja.
    const { runner: again } = await loadGame(file, PM_ADOPTION_SCENARIO_RUNNER_CONFIG);
    again.step();
    for (let i = 0; i < 11; i++) {
      loaded.step();
      again.step();
    }
    expect(computeChecksum(again.getState())).toBe(computeChecksum(loaded.getState()));
  });

  it("schema 6 save mid-run → load → continue equals the uninterrupted run (no extra payouts)", async () => {
    const control = createPmAdoptionScenarioRunner();
    for (let i = 0; i < 24; i++) control.step();

    const runner = createPmAdoptionScenarioRunner();
    for (let i = 0; i < 12; i++) runner.step();
    const file = await tempFile();
    await saveGame(file, { runner, ...metadata, compact: false });
    const { runner: loaded } = await loadGame(file, PM_ADOPTION_SCENARIO_RUNNER_CONFIG);
    expect(money(loaded.worldState)).toBe(money(runner.worldState));
    for (let i = 0; i < 12; i++) loaded.step();
    expect(payouts(loaded)).toBe(payouts(control));
    expect(payouts(control)).toBeGreaterThan(0);
    expect(computeChecksum(loaded.getState())).toBe(computeChecksum(control.getState()));
  });
});
