/* global process, console, URL -- skrypt Node uruchamiany poza aplikacją */
// Diagnoza zaniku gospodarki Black Mountain (2026-10-01).
//
// Odtwarza konfigurację gry 1:1 z `apps/desktop/electron/main/world-session.ts`
// (fixture `tests/worldgen/fixtures/black_mountain_reference.json`,
// `loadEconomyContent(root)`, `createWorldRunner({ ...content, worldState,
// worldSeed: worldState.world.seed, startYear, startMonth })`) i tylko CZYTA
// stan po każdym `runner.step()` -- bez zmian w silniku, contencie i RNG.
//
// Użycie (po `pnpm build:packages`):
//   node docs/verification/black-mountain-economy-diagnosis-2026-10-01/diagnose.mjs [--ticks 360] [--seed <worldSeed>] [--mode game|bare] [--out <plik.json>]
// Bez `--seed` używany jest seed z fixture'u (jak w grze).
// `--close-at <tick>` (kryterium etapu 2): przed tym tickiem wszystkie aktywne
// firmy zostają zamknięte (kontrolowane zamknięcie, stan odtworzony przez
// `WorldRunner.fromState`) -- sprawdza, czy może powstać nowa firma.
// `--mode bare` (porównawczy): sam `runEconomyTick` jak w teście
// `m12-m14-invariant-monitor.test.ts` -- tylko receptury, transport i
// kandydaci przedsiębiorczości; bez technologii, PM adoption, odkryć złóż,
// Chronicle i przyczynowości (NIE jest to konfiguracja gry).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const req = createRequire(join(root, "packages/worldgen/package.json"));
const load = (name) => import(pathToFileURL(req.resolve(name)).href);
const { loadEconomyContent, loadWorldFixture } = await load("@first-cause/worldgen");
const sim = await load("@first-cause/simulation");
const { createWorldRunner, runEconomyTick, createWorldRng, WorldRunner } = sim;
// Silnik < 4 (commit bazowy) nie ma `regionLaborForce` -- wtedy ułamkowo, jak liczył.
const regionLaborForce =
  sim.regionLaborForce ??
  ((cohorts) =>
    cohorts
      .filter((c) => ["AGE_15_24", "AGE_25_44", "AGE_45_64"].includes(c.ageGroup))
      .reduce((a, c) => a + c.population * 0.65, 0));

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const TICKS = Number(arg("ticks", "360"));
const MODE = arg("mode", "game");
const CLOSE_AT = arg("close-at", undefined) === undefined ? undefined : Number(arg("close-at"));

const content = loadEconomyContent(root);
if (!content.ok) throw new Error(content.errors.join("; "));
const raw = JSON.parse(
  readFileSync(join(root, "tests/worldgen/fixtures/black_mountain_reference.json"), "utf8"),
);
const loaded = loadWorldFixture(raw, {
  productionRecipesByMethodId: content.productionRecipesByMethodId,
});
if (!loaded.ok) throw new Error(loaded.errors.join("; "));
const worldState = loaded.worldState;
const seed = arg("seed", worldState.world.seed);
let runner;
if (MODE === "game") {
  runner = createWorldRunner({
    ...content,
    worldState,
    worldSeed: seed,
    startYear: worldState.world.currentDate.year,
    startMonth: worldState.world.currentDate.month,
  });
} else {
  // Tryb porównawczy „bare” -- minimalny adapter o tym samym kształcie co runner.
  const rng = createWorldRng(seed);
  let state = worldState;
  let tickNo = 0;
  const facts = [];
  runner = {
    get worldState() {
      return state;
    },
    get tick() {
      return tickNo;
    },
    facts,
    step() {
      const result = runEconomyTick({
        worldState: state,
        tick: tickNo,
        demographyRng: (scopeId) => rng.stream("demography", scopeId),
        migrationRng: (scopeId) => rng.stream("migration", scopeId),
        productionRecipesByMethodId: content.productionRecipesByMethodId,
        transportModeProfilesByModeId: content.transportModeProfilesByModeId,
        entrepreneurshipCandidatesByArchetypeId: content.entrepreneurshipCandidatesByArchetypeId,
      });
      for (const f of result.facts) facts.push({ ...f, tick: tickNo });
      state = result.worldState;
      tickNo += 1;
    },
  };
}

const WORKING = new Set(["AGE_15_24", "AGE_25_44", "AGE_45_64"]);
const round = (v, d = 3) => (typeof v === "number" ? Math.round(v * 10 ** d) / 10 ** d : v);

function snapshot(tick, factsOfTick) {
  const s = runner.worldState;
  const regions = {};
  for (const region of Object.values(s.regions).sort((a, b) => a.id.localeCompare(b.id))) {
    const cohorts = Object.values(s.populationCohorts).filter((c) => c.regionId === region.id);
    const market = region.economy.marketId ? s.markets[region.economy.marketId] : undefined;
    const inv = region.economy.regionalInventoryId
      ? s.inventories[region.economy.regionalInventoryId]
      : undefined;
    regions[region.id] = {
      population: cohorts.reduce((a, c) => a + c.population, 0),
      workingAge: cohorts.filter((c) => WORKING.has(c.ageGroup)).reduce((a, c) => a + c.population, 0),
      laborForce: regionLaborForce(cohorts),
      cohortEmployment: cohorts.reduce((a, c) => a + c.employment, 0),
      avgIncome: round(
        cohorts.reduce((a, c) => a + c.averageIncome * c.population, 0) /
          Math.max(1, cohorts.reduce((a, c) => a + c.population, 0)),
      ),
      savings: round(cohorts.reduce((a, c) => a + (c.savings ?? 0), 0)),
      // Etap 3 (dochód właścicielski): oszczędności i ludność według rodzin
      // (klasa/umiejętności -- tożsamość rodziny w regionie).
      families: Object.fromEntries(
        [...new Set(cohorts.map((c) => `${c.economicClass}/${c.skillLevel}`))].sort().map((k) => {
          const fam = cohorts.filter((c) => `${c.economicClass}/${c.skillLevel}` === k);
          return [
            k,
            {
              population: fam.reduce((a, c) => a + c.population, 0),
              savings: round(fam.reduce((a, c) => a + (c.savings ?? 0), 0)),
            },
          ];
        }),
      ),
      market: market
        ? Object.fromEntries(
            Object.entries(market.goods).map(([g, m]) => [
              g,
              {
                price: round(m.localPrice),
                supply: round(m.supply),
                demand: round(m.demand),
                inventory: round(m.inventory),
                shortage: round(m.shortageSeverity),
                // Etap 2 (N7): potrzeby i faktyczne zakupy gospodarstw (brak = brak danych).
                need: m.householdNeed === undefined ? null : round(m.householdNeed),
                purchased: m.householdPurchased === undefined ? null : round(m.householdPurchased),
              },
            ]),
          )
        : null,
      consignment: inv?.consignment ?? null,
      regionalInventory: inv
        ? Object.fromEntries(Object.entries(inv.items).map(([g, i]) => [g, round(i.quantity)]))
        : null,
    };
  }
  const companies = {};
  for (const c of Object.values(s.companies).sort((a, b) => a.id.localeCompare(b.id))) {
    const inv = s.inventories[c.inventoryId];
    companies[c.id] = {
      region: c.regionId,
      archetype: c.archetypeId,
      method: c.production.productionMethodId,
      active: c.status.active,
      distressed: c.status.distressed,
      bankrupt: c.status.bankrupt,
      employees: c.workforce.employees,
      vacancies: c.workforce.vacancies,
      wage: round(c.workforce.wageOffer),
      capacity: c.production.capacity,
      utilization: round(c.production.utilization),
      output: round(c.production.outputLastTick),
      inputs: c.production.inputRequirements,
      revenue: round(c.finance.revenue),
      costs: round(c.finance.costs),
      profit: round(c.finance.profit),
      cash: round(c.finance.cash),
      owner: `${c.ownerType}:${c.ownerEntityId}`,
      retainedEarnings: c.finance.retainedEarnings === undefined ? null : round(c.finance.retainedEarnings),
      stock: inv ? Object.fromEntries(Object.entries(inv.items).map(([g, i]) => [g, round(i.quantity)])) : {},
      lastDecision: c.ai.lastDecision,
      activeStates: c.ai.activeStates,
    };
  }
  const deposits = {};
  for (const d of Object.values(s.resourceDeposits))
    deposits[d.id] = { quantity: round(d.quantity), status: d.discovery.status };
  const factCounts = {};
  for (const f of factsOfTick) factCounts[f.type] = (factCounts[f.type] ?? 0) + 1;
  // Etap 3: wypłaty właścicielskie tego ticka (fakty) i jawny odpływ -- rozbudowy.
  const ownerPayouts = factsOfTick
    .filter((f) => f.type === "owner_income_received")
    .map((f) => ({ recipient: f.subject.entityId, amount: round(Number(f.values.delta), 2) }));
  const payoutsByCompany = Object.fromEntries(
    factsOfTick
      .filter((f) => f.type === "company_owner_payout")
      .map((f) => [f.subject.entityId, round(-Number(f.values.delta), 2)]),
  );
  const expansions = factsOfTick.filter((f) => f.type === "company_expanded").length;
  return {
    tick,
    date: s.world.currentDate,
    regions,
    companies,
    deposits,
    factCounts,
    ownerPayouts,
    payoutsByCompany,
    expansions,
  };
}

const series = [snapshot(0, [])];
const keyFacts = [];
const KEY_TYPES = new Set([
  "company_founded",
  "company_closed",
  "company_bankrupt",
  "company_distressed",
  "trade_flow_active",
  "production_method_adopted",
  "resource_discovered",
  "deposit_discovered",
  "settlement_abandoned",
  "migration_occurred",
]);
for (let i = 0; i < TICKS; i++) {
  if (CLOSE_AT !== undefined && runner.tick === CLOSE_AT && MODE === "game") {
    const state = runner.getState();
    const companies = Object.fromEntries(
      Object.entries(state.worldState.companies).map(([id, c]) => [
        id,
        c.status.active
          ? { ...c, status: { ...c.status, active: false }, closedTick: runner.tick }
          : c,
      ]),
    );
    runner = WorldRunner.fromState(
      { ...state, worldState: { ...state.worldState, companies } },
      content,
    );
  }
  const before = runner.facts.length;
  const tick = runner.tick;
  runner.step();
  const fresh = runner.facts.slice(before);
  for (const f of fresh)
    if (KEY_TYPES.has(f.type) || /found|clos|bankrupt|trade|discover|abandon/.test(f.type))
      keyFacts.push({ tick: f.tick, type: f.type, subject: f.subject.entityId, values: f.values });
  series.push(snapshot(tick + 1, fresh));
}

const out = arg("out", undefined);
const result = {
  config: {
    fixture: "tests/worldgen/fixtures/black_mountain_reference.json",
    worldSeed: seed,
    mode: MODE,
    closeAt: CLOSE_AT ?? null,
    fixtureSeed: worldState.world.seed,
    ticks: TICKS,
    runnerConfigKeys: Object.keys(content).filter((k) => content[k] !== undefined).sort(),
    productionMethods: Object.keys(content.productionRecipesByMethodId ?? {}).sort(),
    pmCandidates: content.pmCandidatesByCurrentMethodId,
    entrepreneurshipCandidates: content.entrepreneurshipCandidatesByArchetypeId,
  },
  keyFacts,
  series,
};
if (out) writeFileSync(out, JSON.stringify(result));
// Krótkie podsumowanie na stdout.
const emp = series.map((p) =>
  Object.values(p.companies).reduce((a, c) => a + (c.active ? c.employees : 0), 0),
);
const firstZero = emp.findIndex((e, i) => i > 0 && e === 0);
const recovered = firstZero >= 0 ? emp.slice(firstZero).some((e) => e > 0) : null;
const fp = (x) => JSON.stringify(x);
console.log(
  fp({
    seed,
    mode: MODE,
    ticks: TICKS,
    maxEmployment: Math.max(...emp),
    firstZeroEmploymentTick: firstZero,
    recoveredAfterZero: recovered,
    finalEmployment: emp.at(-1),
    activeCompaniesFinal: Object.values(series.at(-1).companies).filter((c) => c.active).length,
    companiesEver: Object.keys(series.at(-1).companies).length,
    tradeFlowActive: keyFacts.filter((f) => f.type === "trade_flow_active").length,
    checksum: emp.join(","),
  }),
);
