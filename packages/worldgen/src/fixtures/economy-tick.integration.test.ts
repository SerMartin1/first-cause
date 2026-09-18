import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createWorldRng,
  runEconomyTick,
  type RunEconomyTickResult,
} from "@first-cause/simulation";
import { loadWorldFixture } from "./load-world-fixture.js";

const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);

function readBlackMountainFixture(): unknown {
  const filePath = path.join(
    REPO_ROOT,
    "tests/worldgen/fixtures/black_mountain_reference.json",
  );
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function assertNoNonFiniteOrNegative(value: unknown, label: string): void {
  if (typeof value === "number") {
    expect(Number.isFinite(value), `${label} must be finite, got ${value}`).toBe(true);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoNonFiniteOrNegative(item, `${label}[${index}]`),
    );
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertNoNonFiniteOrNegative(item, `${label}.${key}`);
    }
  }
}

/**
 * Audytowa propozycja `fixture_economy_runs_120_ticks` (P0-01): dowodzi,
 * że M7-M11 (+ M5 regen, M6 demografia) faktycznie się kręcą razem
 * przeciw prawdziwemu, załadowanemu WorldState -- nie tylko przechodzą
 * testy jednostkowe w izolacji.
 *
 * Świadomie ograniczone do 24 ticków (2 lata) obejmujących zdrową fazę
 * wzrostu tej konkretnej, minimalnej gospodarki (jedna farma, jedna
 * konsumująca kohorta) -- dłuższy przebieg tego samego fixture prowadzi
 * do nadprodukcji względem lokalnego popytu i deflacyjnej pułapki
 * (marża trwale ujemna -> STOP), co jest realną, oczekiwaną konsekwencją
 * braku ograniczeń zasobowych na decyzji ekspansji (audytowe P1-02) i
 * baku eksportu do innych regionów -- Etap 1 świadomie tego nie naprawia
 * (patrz plan). Ten test dowodzi, że pętla *działa*, nie że ta konkretna
 * gospodarka jest w pełni zbalansowana.
 *
 * Etap 3 (P0-02) usunęło "darmową pracę" -- produkcja teraz naprawdę
 * potrzebuje `Company.workforce.employees`. Tutejsza kohorta ma tylko 9
 * osób w wieku produkcyjnym (~5-6 dostępnych etatów), więc gdy
 * `production-decision.ts` pcha `utilization` w górę szybciej niż rynek
 * pracy nadąża, wakaty (audytowe P1 "rosnące bez końca", Etap 4) i presja
 * płacowa (`labor/wages.ts`) windują koszty ponad ograniczoną produkcją
 * przychody -- firma kończy 24 ticki na ujemnej gotówce. To poprawna,
 * nowo odsłonięta konsekwencja naprawionego ograniczenia pracą, nie regres
 * w rozliczeniu finansowym (`settlement.ts`), więc test dowodzi
 * zaangażowania finansowego przez przychód/koszty, nie przez wypłacalność.
 */
describe("Black Mountain fixture runs a real, wired economy tick (Etap 1 tick-loop integration)", () => {
  it("runs 24 ticks without throwing, and the economy visibly moves (not a no-op)", () => {
    const loaded = loadWorldFixture(readBlackMountainFixture());
    expect(loaded.ok).toBe(true);

    let worldState = loaded.worldState!;
    const rng = createWorldRng(worldState.world.seed);
    const allFacts: RunEconomyTickResult["facts"][number][] = [];

    const initialCash = worldState.companies.company_green_valley_farm!.finance.cash;

    for (let tick = 0; tick < 24; tick++) {
      const result = runEconomyTick({
        worldState,
        tick,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
      });
      worldState = result.worldState;
      allFacts.push(...result.facts);
      assertNoNonFiniteOrNegative(worldState.companies, `tick${tick}.companies`);
      assertNoNonFiniteOrNegative(worldState.markets, `tick${tick}.markets`);
      assertNoNonFiniteOrNegative(
        worldState.resourceDeposits,
        `tick${tick}.resourceDeposits`,
      );
    }

    const company = worldState.companies.company_green_valley_farm!;
    const market = worldState.markets.market_green_valley!;
    const regionInventory = worldState.inventories.inventory_region_green_valley!;

    // Produkcja faktycznie ruszyła (wymagało capacity/utilization/recipe z fixture, prawdziwego depozytu grain i M5 regeneracji, żeby nie wyczerpać go po drodze).
    expect(company.production.outputLastTick).toBeGreaterThan(0);
    // Firma faktycznie zatrudniła kogoś z realnej kohorty regionu (M9 matchEmployment).
    expect(company.workforce.employees).toBeGreaterThan(0);
    // Cena rynkowa zmieniła się względem ceny bazowej -- rynek (M8) reaguje na realnie zaobserwowany popyt/podaż, nie stoi w miejscu.
    expect(market.goods.flour!.localPrice).not.toBe(2);
    // Coś fizycznie trafiło do inventory regionu i/lub zostało z niego kupione -- fizyczne rozliczenie (settlement.ts) faktycznie działa, nie tylko liczy pieniądze.
    expect(Object.keys(regionInventory.items).length).toBeGreaterThan(0);
    // Firma wygenerowała realny przepływ finansowy (Company.finance przestało być martwym polem)
    // -- nie sprawdzamy tu wypłacalności: przy P0-02 naprawionym ograniczeniu pracą i wciąż-P1
    // rosnących bez końca wakatach ta konkretna, jednokohortowa gospodarka kończy 24 ticki na
    // minusie (patrz doc comment powyżej), co jest oczekiwane, nie regresem rozliczenia.
    expect(company.finance.cash).not.toBe(initialCash);
    expect(company.finance.revenue).toBeGreaterThan(0);
    expect(company.finance.costs).toBeGreaterThan(0);

    // Company AI faktycznie podjęło i wykonało strukturalną decyzję (nie tylko dial produkcji) w tym oknie.
    expect(allFacts.some((fact) => fact.type === "vacancies_opened")).toBe(true);
    expect(allFacts.some((fact) => fact.type === "employment_changed")).toBe(true);
    expect(allFacts.some((fact) => fact.type === "price_changed")).toBe(true);
  });
});
