/* global process, console -- skrypt Node uruchamiany poza aplikacją */
// Podsumowanie przebiegów `diagnose.mjs --out` (etap 3: dochód właścicielski,
// 2026-10-01). Metryki zgodne z `runs-summary-stage2.json` (zaspokojenie
// potrzeb = Σ zakupów / Σ potrzeb Green Valley w okresie) plus bilans
// pieniądza, wypłaty właścicielskie, wynik zatrzymany i rodziny gospodarstw.
//
// Użycie: node summarize.mjs <wyjście.json> <nazwa>=<run.json> [...]
import { readFileSync, writeFileSync } from "node:fs";

const [out, ...pairs] = process.argv.slice(2);
const GV = "region_green_valley";
const BUFFER = 5; // TARGET_FINISHED_GOOD_BUFFER -- zapas firm ponad bufor jest „dostępny”
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

function summarize(name, file) {
  const { series, keyFacts } = JSON.parse(readFileSync(file, "utf8"));
  const gv = (p) => p.regions[GV];
  const flour = (p) => gv(p).market?.flour;
  const sat = (a, b) => {
    let need = 0;
    let bought = 0;
    for (const p of series)
      if (p.tick >= a && p.tick <= b && flour(p)?.need != null) {
        need += flour(p).need;
        bought += flour(p).purchased;
      }
    return need > 0 ? r3(bought / need) : null;
  };
  const householdMoney = (p) =>
    Object.values(p.regions).reduce((a, r) => a + (r.savings ?? 0), 0);
  const firmCash = (p) => Object.values(p.companies).reduce((a, c) => a + c.cash, 0);
  const worldMoney = (p) => householdMoney(p) + firmCash(p);
  let cumExpansions = 0;
  let maxBalanceError = 0;
  const m0 = worldMoney(series[0]);
  for (const p of series) {
    cumExpansions += p.expansions ?? 0;
    maxBalanceError = Math.max(
      maxBalanceError,
      Math.abs(worldMoney(p) + 100 * cumExpansions - m0),
    );
  }
  const employment = (p) =>
    Object.values(p.companies).reduce((a, c) => a + (c.active ? c.employees : 0), 0);
  const output = (p) =>
    Object.values(p.companies).reduce((a, c) => a + (c.active ? c.output : 0), 0);
  const avg = (f, a, b) => {
    const xs = series.filter((p) => p.tick >= a && p.tick <= b).map(f);
    return xs.length ? r2(xs.reduce((x, y) => x + y, 0) / xs.length) : null;
  };
  const availableStock = (p) =>
    (gv(p).regionalInventory?.flour ?? 0) +
    Object.values(p.companies)
      .filter((c) => c.region === GV)
      .reduce((a, c) => a + Math.max(0, (c.stock.flour ?? 0) - BUFFER), 0);
  const payouts = series.flatMap((p) => p.ownerPayouts ?? []);
  const byRecipient = {};
  for (const x of payouts) byRecipient[x.recipient] = r2((byRecipient[x.recipient] ?? 0) + x.amount);
  const payoutSum = (a, b) =>
    r2(
      series
        .filter((p) => p.tick >= a && p.tick <= b)
        .flatMap((p) => p.ownerPayouts ?? [])
        .reduce((s, x) => s + x.amount, 0),
    );
  const at = (t) => series.find((p) => p.tick === t) ?? series.at(-1);
  const families = (t) => {
    const p = at(t);
    const price = flour(p)?.price ?? 0;
    return Object.fromEntries(
      Object.entries(gv(p).families ?? {}).map(([k, f]) => [
        k,
        {
          population: f.population,
          savings: r2(f.savings),
          // Ile miesięcy koszyka przetrwania rodziny pokrywają jej oszczędności.
          basketMonths: price > 0 && f.population > 0 ? r2(f.savings / (f.population * 3 * price)) : null,
        },
      ]),
    );
  };
  const emp = series.map(employment);
  const lastPos = emp.reduce((last, e, i) => (e > 0 ? i : last), -1);
  const firstZero = emp.findIndex((e, i) => i > 0 && e === 0);
  const end = series.at(-1);
  // N5 (2026-10-01): wszystkie regiony z rynkiem mąki -- cena, zaspokojenie
  // potrzeb, oszczędności i handel (fakty `trade_flow_active`).
  const regionIds = Object.keys(series[0].regions).filter(
    (id) => series[0].regions[id].market?.flour !== undefined,
  );
  const regionSat = (id, a, b) => {
    let need = 0;
    let bought = 0;
    for (const p of series) {
      const f = p.regions[id].market?.flour;
      if (p.tick >= a && p.tick <= b && f?.need != null) {
        need += f.need;
        bought += f.purchased;
      }
    }
    return need > 0 ? r3(bought / need) : null;
  };
  const trades = keyFacts.filter((f) => f.type === "trade_flow_active");
  const tradeByConnection = {};
  for (const f of trades) {
    const k = f.subject;
    tradeByConnection[k] ??= { flows: 0, quantity: 0, firstTick: f.tick, lastTick: f.tick };
    tradeByConnection[k].flows += 1;
    tradeByConnection[k].quantity = r2(tradeByConnection[k].quantity + Number(f.values.after));
    tradeByConnection[k].lastTick = f.tick;
  }
  const regions = Object.fromEntries(
    regionIds.map((id) => [
      id,
      {
        price: Object.fromEntries(
          [0, 12, 60, 120, 240, 360].map((t) => [`t${t}`, at(t).regions[id].market.flour.price]),
        ),
        needsSat_t1_12: regionSat(id, 1, 12),
        needsSat_t13_120: regionSat(id, 13, 120),
        needsSat_t121_360: regionSat(id, 121, 360),
        savings: Object.fromEntries(
          [0, 12, 60, 360].map((t) => [`t${t}`, r2(at(t).regions[id].savings)]),
        ),
        population_t0: series[0].regions[id].population,
        population_t360: end.regions[id].population,
        stockEnd: r2(end.regions[id].regionalInventory?.flour ?? 0),
      },
    ]),
  );
  return {
    run: name,
    regions,
    tradeByConnection,
    firstZero,
    lastPos,
    founded: keyFacts.filter((f) => f.type === "company_founded").map((f) => f.tick),
    closed: keyFacts.filter((f) => f.type === "company_closed").map((f) => f.tick),
    trade: keyFacts.filter((f) => f.type === "trade_flow_active").length,
    needsSat_t1_12: sat(1, 12),
    needsSat_t13_24: sat(13, 24),
    needsSat_t25_120: sat(25, 120),
    needsSat_t121_360: sat(121, 360),
    needsSat_t13_360: sat(13, 360),
    employmentAvg_t1_12: avg(employment, 1, 12),
    employmentAvg_t13_24: avg(employment, 13, 24),
    employmentAvg_t25_360: avg(employment, 25, 360),
    outputAvg_t1_12: avg(output, 1, 12),
    outputAvg_t13_24: avg(output, 13, 24),
    outputAvg_t25_360: avg(output, 25, 360),
    gvSavings: Object.fromEntries([0, 12, 24, 60, 120, 360].map((t) => [`t${t}`, r2(gv(at(t)).savings)])),
    gvFamilies_t24: families(24),
    gvFamilies_t360: families(360),
    firmCash_t0: r2(firmCash(series[0])),
    firmCashEnd: r2(firmCash(end)),
    retainedEarningsEnd: Object.fromEntries(
      Object.entries(end.companies).map(([id, c]) => [id, c.retainedEarnings]),
    ),
    ownerPayouts_total: r2(payouts.reduce((s, x) => s + x.amount, 0)),
    ownerPayouts_t1_12: payoutSum(0, 12),
    ownerPayouts_t13_24: payoutSum(13, 24),
    ownerPayouts_t25_360: payoutSum(25, 360),
    ownerPayoutsByRecipient: byRecipient,
    owners: Object.fromEntries(Object.entries(end.companies).map(([id, c]) => [id, c.owner])),
    worldMoney_t0: r2(m0),
    worldMoneyEnd: r2(worldMoney(end)),
    expansionOutflow: 100 * cumExpansions,
    maxBalanceError: r2(maxBalanceError),
    availableStock_t12: r2(availableStock(at(12))),
    availableStock_t24: r2(availableStock(at(24))),
    availableStockEnd: r2(availableStock(end)),
    finalPrice: flour(end)?.price ?? null,
    finalWages: Object.fromEntries(
      Object.entries(end.companies)
        .filter(([, c]) => c.active)
        .map(([id, c]) => [id, c.wage]),
    ),
    employmentByTick: emp,
    greenValleyMonthly: series
      .filter((p) => p.tick <= 36 || p.tick % 12 === 0)
      .map((p) => ({
        t: p.tick,
        need: flour(p)?.need ?? null,
        payable: flour(p)?.demand ?? null,
        purchased: flour(p)?.purchased ?? null,
        price: flour(p)?.price ?? null,
        savings: r2(gv(p).savings),
        firmCash: r2(
          Object.values(p.companies)
            .filter((c) => c.region === GV)
            .reduce((a, c) => a + c.cash, 0),
        ),
        ownerPayout: r2((p.ownerPayouts ?? []).reduce((s, x) => s + x.amount, 0)),
        employment: employment(p),
      })),
  };
}

const runs = pairs.map((pair) => {
  const [name, file] = pair.split("=");
  return summarize(name, file);
});
writeFileSync(
  out,
  JSON.stringify(
    {
      note:
        "Etap 3 (dochód właścicielski), 2026-10-01. worldMoney = oszczędności gospodarstw + gotówka firm; jawny odpływ: rozbudowa mocy (100 za krok, expansionOutflow); maxBalanceError = max |worldMoney(t) + odpływ(t) − worldMoney(0)|.",
      runs,
    },
    null,
    1,
  ),
);
for (const r of runs)
  console.log(
    JSON.stringify({
      run: r.run,
      lastPos: r.lastPos,
      sat: [r.needsSat_t1_12, r.needsSat_t13_24, r.needsSat_t25_120, r.needsSat_t121_360],
      emp: [r.employmentAvg_t1_12, r.employmentAvg_t13_24, r.employmentAvg_t25_360],
      out: [r.outputAvg_t1_12, r.outputAvg_t13_24, r.outputAvg_t25_360],
      sav: r.gvSavings,
      firm: [r.firmCash_t0, r.firmCashEnd],
      pay: [r.ownerPayouts_t1_12, r.ownerPayouts_t13_24, r.ownerPayouts_t25_360],
      rcpt: r.ownerPayoutsByRecipient,
      money: [r.worldMoney_t0, r.worldMoneyEnd, r.expansionOutflow, r.maxBalanceError],
      stock: [r.availableStock_t12, r.availableStock_t24, r.availableStockEnd],
      founded: r.founded.length,
      regions: Object.fromEntries(
        Object.entries(r.regions).map(([id, x]) => [
          id.replace("region_", ""),
          [x.price.t360, x.needsSat_t1_12, x.needsSat_t13_120, x.needsSat_t121_360, x.savings.t360],
        ]),
      ),
      trade: r.tradeByConnection,
      closed: r.closed.length,
      price: r.finalPrice,
      wages: r.finalWages,
    }),
  );
