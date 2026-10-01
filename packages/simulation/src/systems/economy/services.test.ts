import { createInventory, createWorldState, type WorldState } from "@first-cause/entities";
import { describe, expect, it } from "vitest";
import { createWorldRunner, WorldRunner } from "../../core/world-runner.js";
import {
  buildTradeScenarioWorldState,
  TRADE_SCENARIO as T,
  TRADE_SCENARIO_RECIPES,
} from "../../verification/trade-scenario.js";
import {
  buildPmAdoptionScenarioWorldState,
  PM_ADOPTION_SCENARIO_RUNNER_CONFIG,
} from "../../verification/pm-adoption-scenario.js";
import { addConsignment } from "./consignment.js";
import { liquidationSplit, splitSurplus } from "./owner-income.js";
import {
  blendedUnitPrice,
  parseServiceProviderProfile,
  withLandedPrice,
  type ServiceProviderProfile,
} from "./services.js";

/*
 * Etap 4B (Canonical §52L): płatny transport, rezerwa inwestycyjna,
 * rozbudowa u wykonawcy i zwrot kapitału.
 */

const transportProfile: ServiceProviderProfile = parseServiceProviderProfile({
  archetypeId: "transport_company",
  serviceId: "basic_transport",
  category: "transport",
  capacityModel: { unitsPerEmployee: 20 },
  capitalRequirement: 20,
})!;
const constructionProfile: ServiceProviderProfile = parseServiceProviderProfile({
  archetypeId: "construction_company",
  serviceId: "construction",
  category: "construction",
  capacityModel: { unitsPerEmployee: 1, capacityExpansionWorkUnits: 4 },
  capitalRequirement: 20,
})!;

const cents = (v: number) => Math.round(v * 100);
const money = (w: WorldState) =>
  cents(
    Object.values(w.populationCohorts).reduce((s, c) => s + c.savings, 0) +
      Object.values(w.companies).reduce((s, c) => s + c.finance.cash, 0),
  );

function rebuild(w: WorldState): WorldState {
  return createWorldState({
    world: w.world,
    continents: Object.values(w.continents),
    regions: Object.values(w.regions),
    connections: Object.values(w.connections),
    resourceDeposits: Object.values(w.resourceDeposits),
    settlements: Object.values(w.settlements),
    populationCohorts: Object.values(w.populationCohorts),
    companies: Object.values(w.companies),
    markets: Object.values(w.markets),
    inventories: Object.values(w.inventories),
    technologyStates: Object.values(w.technologyStates),
    architectInfluence: w.architectInfluence,
    interventions: Object.values(w.interventions),
  });
}

describe("4B rules (pure)", () => {
  it("reserve: 50% of the eligible surplus while a plan is active, capped at one expansion; none without a plan", () => {
    expect(splitSurplus(30, 0, undefined)).toEqual({ payout: 30, toReserve: 0 });
    expect(splitSurplus(30, 0, 100)).toEqual({ payout: 15, toReserve: 15 });
    expect(splitSurplus(30, 95, 100)).toEqual({ payout: 25, toReserve: 5 });
    expect(splitSurplus(30, 100, 100)).toEqual({ payout: 30, toReserve: 0 });
    expect(splitSurplus(0, 0, 100)).toEqual({ payout: 0, toReserve: 0 });
  });

  it("liquidation: unpaid profit first, the rest is a capital return; nothing from negative cash", () => {
    const company = (cash: number, retainedEarnings: number) =>
      ({ finance: { cash, retainedEarnings } }) as Parameters<typeof liquidationSplit>[0];
    expect(liquidationSplit(company(120, 30))).toEqual({ profit: 30, capital: 90 });
    expect(liquidationSplit(company(120, -40))).toEqual({ profit: 0, capital: 120 });
    expect(liquidationSplit(company(20, 50))).toEqual({ profit: 20, capital: 0 });
    expect(liquidationSplit(company(-5, 10))).toEqual({ profit: 0, capital: 0 });
  });

  it("lot prices: landed price per owner, pro-rata blended purchase price", () => {
    let store = createInventory({ id: "s", ownerType: "region", ownerId: "r", locationRegionId: "r" });
    store = { ...store, items: { flour: { quantity: 20, averageCost: 0, ageBuckets: {} } } };
    store = addConsignment(store, "flour", "local_farm", 10);
    store = withLandedPrice(addConsignment(store, "flour", "far_farm", 10), "flour", "far_farm", 0, 10, 3);
    // 10 po cenie lokalnej 2 + 10 po 3 → średnio 2,5.
    expect(blendedUnitPrice(store, "flour", 2)).toBeCloseTo(2.5, 9);
    // Dokupiony lot tego samego właściciela: średnia ważona ceny wyładunku.
    const merged = withLandedPrice(store, "flour", "far_farm", 10, 10, 5);
    expect(merged.consignmentPrice?.flour?.far_farm).toBeCloseTo(4, 9);
  });
});

describe("4B paid transport through the real tick", () => {
  it("no carrier blocks the import; a carrier is founded with investor capital; the owner pays the carrier; money conserved to the cent", () => {
    let w = buildTradeScenarioWorldState();
    // Konsumenci bez etatów (wolni pracownicy dla przewoźnika), odległość > 0 (opłata > 0).
    const consumers = w.populationCohorts.scenario_cohort_coast_consumers!;
    w = rebuild({
      ...w,
      populationCohorts: { ...w.populationCohorts, [consumers.id]: { ...consumers, employment: 0 } },
      connections: {
        ...w.connections,
        [T.connectionId]: {
          ...w.connections[T.connectionId]!,
          geography: { ...w.connections[T.connectionId]!.geography, physicalDistance: 10 },
        },
      },
    });
    const runner = createWorldRunner({
      worldState: w,
      worldSeed: w.world.seed,
      startYear: w.world.currentDate.year,
      startMonth: w.world.currentDate.month,
      productionRecipesByMethodId: TRADE_SCENARIO_RECIPES,
      serviceProvidersByArchetypeId: { transport_company: transportProfile },
    });
    const before = money(runner.worldState);
    let feesPaid = 0;
    for (let i = 0; i < 12; i++) {
      runner.step();
      expect(money(runner.worldState), `tick ${i}`).toBe(before);
    }
    const factsOf = (type: string) => runner.facts.filter((f) => f.type === type);
    // Tick 0: bez przewoźnika nie ma przewozu.
    expect(factsOf("trade_flow_active").filter((f) => f.tick === 0)).toEqual([]);
    // Przewoźnik powstaje tylko na zamówienia; bez środków na płacę zamyka się
    // i przy kolejnych zamówieniach może powstać następny -- każdy z kapitałem
    // inwestora (rodzina konsumentów), w regionie importera.
    const founded = factsOf("service_company_founded");
    expect(founded.length).toBeGreaterThan(0);
    expect(factsOf("founding_capital_invested")).toHaveLength(founded.length);
    const carrierIds = new Set(founded.map((f) => f.subject.entityId));
    for (const id of carrierIds) {
      const carrier = runner.worldState.companies[id]!;
      expect(carrier.regionId).toBe(T.importerRegionId);
      expect(carrier.ownerEntityId).toBe(consumers.id);
    }
    // Przewóz z opłatą: każda płatność trafia do przewoźnika w ticku przewozu.
    const paid = factsOf("transport_service_paid");
    expect(paid.length).toBeGreaterThan(0);
    for (const f of paid) {
      expect(carrierIds.has(f.subject.entityId)).toBe(true);
      expect(factsOf("trade_flow_active").some((t) => t.tick === f.tick)).toBe(true);
      feesPaid += Number(f.values.delta);
    }
    expect(feesPaid).toBeGreaterThan(0);
    // Lot farmy w magazynie importera ma cenę wyładunku > ceny lokalnej eksportera.
    const coast = Object.values(runner.worldState.inventories).find(
      (inv) => inv.ownerType === "region" && inv.locationRegionId === T.importerRegionId,
    )!;
    const landed = coast.consignmentPrice?.flour?.scenario_company_farm;
    if (landed !== undefined) {
      const basinPrice =
        runner.worldState.markets[runner.worldState.regions[T.exporterRegionId]!.economy.marketId!]!
          .goods.flour!.localPrice;
      expect(landed).toBeGreaterThan(0);
      expect(landed).not.toBe(basinPrice);
    }
  });

  it("without a transport profile (no content) trade stays free as before 4B", () => {
    const w = buildTradeScenarioWorldState();
    const runner = createWorldRunner({
      worldState: w,
      worldSeed: w.world.seed,
      startYear: w.world.currentDate.year,
      startMonth: w.world.currentDate.month,
      productionRecipesByMethodId: TRADE_SCENARIO_RECIPES,
    });
    runner.runTicks(3);
    expect(runner.facts.some((f) => f.type === "trade_flow_active")).toBe(true);
    expect(runner.facts.some((f) => f.type === "transport_service_paid")).toBe(false);
  });
});

describe("4B capacity expansion is a paid construction service", () => {
  it("every expansion pays a construction company 100 in the same tick; no money disappears", () => {
    const w = buildPmAdoptionScenarioWorldState();
    const runner = WorldRunner.fromState(
      createWorldRunner({
        worldState: w,
        worldSeed: w.world.seed,
        startYear: w.world.currentDate.year,
        startMonth: w.world.currentDate.month,
        ...PM_ADOPTION_SCENARIO_RUNNER_CONFIG,
      }).getState(),
      {
        ...PM_ADOPTION_SCENARIO_RUNNER_CONFIG,
        // Kapitał pokrywający jedno zlecenie (4 pracowników × płaca ~15) --
        // content ma 20 (rozbieżność opisana w raporcie §20).
        serviceProvidersByArchetypeId: {
          construction_company: { ...constructionProfile, capitalRequirement: 200 },
        },
      },
    );
    const before = money(runner.worldState);
    for (let i = 0; i < 48; i++) {
      runner.step();
      expect(money(runner.worldState), `tick ${i}`).toBe(before);
      const reserves = Object.values(runner.worldState.companies).map(
        (c) => c.finance.investmentReserve,
      );
      for (const r of reserves) expect(r).toBeLessThanOrEqual(100);
    }
    const expanded = runner.facts.filter((f) => f.type === "company_expanded");
    const paid = runner.facts.filter((f) => f.type === "construction_service_paid");
    expect(expanded.length).toBeGreaterThan(0);
    expect(paid.length).toBe(expanded.length);
    // Wykonawca to założona firma budowlana z kapitałem rodziny-inwestora.
    const builders = new Set(
      runner.facts.filter((f) => f.type === "service_company_founded").map((f) => f.subject.entityId),
    );
    for (const p of paid) expect(builders.has(p.subject.entityId)).toBe(true);
    for (const e of expanded)
      expect(paid.some((p) => p.tick === e.tick && Number(p.values.delta) === 100)).toBe(true);
  });
});
