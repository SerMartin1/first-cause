import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createPmAdoptionScenarioRunner,
  PM_ADOPTION_SCENARIO as S,
  PM_ADOPTION_SCENARIO_RUNNER_CONFIG,
  pmAdoptionScenarioEconomy,
  pmAdoptionScenarioProducedInTick,
  stepPmAdoptionScenarioUntilAdoption,
} from "@first-cause/simulation";
import { loadGame, saveGame } from "./save-load.js";

/*
 * M21-VIS-R4B Economy: produkcja według towarów w ticku adopcji metody
 * przeżywa zapis i odczyt jako JAWNIE częściowa (tick adopcji jest w
 * `Company.ai.lastDecision`, częścią zapisu) -- bez zgadywania towarów z
 * nowej metody; kolejny tick po wczytaniu przypisuje produkcję poprawnie.
 */

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
async function tempFile(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "first-cause-pm-adoption-"));
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

describe("economy goods across a production-method adoption, save / load", () => {
  it("save in the adoption tick → load keeps partial data; next tick after load attributes per good", async () => {
    const runner = createPmAdoptionScenarioRunner();
    stepPmAdoptionScenarioUntilAdoption(runner);
    const before = pmAdoptionScenarioEconomy(runner);
    expect(before.methodChangedCompanies).toBe(1);
    expect(before.goods).toEqual([]);

    // Domyślny zapis produkcyjny (z kompakcją historii).
    const file = await tempFile();
    await saveGame(file, { runner, ...metadata });
    const { runner: loaded } = await loadGame(file, PM_ADOPTION_SCENARIO_RUNNER_CONFIG);

    // Bezpośrednio po wczytaniu: ten sam widok, nadal częściowy (nie „brak produkcji”).
    const afterLoad = pmAdoptionScenarioEconomy(loaded);
    expect(afterLoad).toEqual(before);
    expect(loaded.worldState.companies[S.companyId]!.production.productionMethodId).toBe(
      S.toMethodId,
    );

    // Kolejny tick po wczytaniu: nowa receptura, przypisanie zgodne z faktyczną produkcją.
    const nextTick = loaded.tick;
    loaded.step();
    const produced = pmAdoptionScenarioProducedInTick(loaded, nextTick);
    expect(Object.keys(produced).sort()).toEqual(["bread", "flour"]);
    const next = pmAdoptionScenarioEconomy(loaded);
    expect(next.methodChangedCompanies).toBe(0);
    expect(Object.fromEntries(next.goods.map((g) => [g.goodId, g.produced]))).toEqual(produced);

    // Ten sam przebieg bez zapisu daje identyczny wynik (determinizm przez save/load).
    const control = createPmAdoptionScenarioRunner();
    stepPmAdoptionScenarioUntilAdoption(control);
    control.step();
    expect(pmAdoptionScenarioEconomy(control)).toEqual(next);
  });
});
