import { describe, expect, it } from "vitest";
import {
  createPopulationCohort,
  createRegion,
  createRegionGeography,
  createSettlement,
  createWorld,
  createWorldState,
  type Settlement,
  type WorldState,
} from "@first-cause/entities";
import { runEconomyTick } from "../../core/economy-tick.js";
import { createWorldRng, type RngStream } from "../../core/rng.js";
import { buildWorldSummaryReadModel } from "../../read-models/world-summary-read-model.js";
import { buildWorldSnapshot } from "../../read-models/world-view-read-model.js";
import { selectDestinationSettlement } from "../population/migration.js";
import { evaluateSettlementAbandonment } from "./settlements.js";

/*
 * SET-LIFECYCLE-001 (decyzja właściciela 2026-09-29): populacja osady = 0
 * → ACTIVE → ABANDONED w tym samym ticku; ABANDONED zostaje historią i nie
 * jest reaktywowana. Testy idą PRODUKCYJNĄ ścieżką `runEconomyTick`
 * (demografia → krok 12); jedyną kontrolowaną rzeczą jest źródło losowości,
 * które kontrakt `demographyRng` jawnie dopuszcza („dowolne inne źródło o
 * tym samym kształcie”): `nextFloat() = 0` sprawia, że ułamkowa liczba
 * zgonów zawsze się zaokrągla w górę, więc ostatni mieszkaniec (65+) umiera
 * w ticku 0 -- bez mockowania mechaniki osad.
 */
const ALWAYS_ROUND_UP = { nextFloat: () => 0 } as unknown as RngStream;

function buildWorld(options: {
  readonly lastResident: number;
  readonly thriving?: boolean;
}): WorldState {
  const world = createWorld({
    id: "world_lifecycle",
    seed: "settlement-lifecycle",
    name: "Lifecycle",
    configuration: { regionCount: 1, worldSizePreset: "test" },
  });
  const region = createRegion({
    id: "region_haven",
    worldId: world.id,
    continentId: "continent_1",
    name: "Haven Coast",
    geography: createRegionGeography({
      terrain: "plains",
      climate: "temperate",
      area: 10,
      fertility: 0.5,
      waterAccess: true,
      coastal: true,
      elevationClass: "lowland",
    }),
  });
  const oldHaven = createSettlement({
    id: "settlement_old_haven",
    regionId: region.id,
    name: "Old Haven",
    foundedTick: 0,
    stage: "HAMLET",
  });
  const settlements: Settlement[] = [oldHaven];
  const cohorts = [
    createPopulationCohort({
      id: "cohort_old_haven_elders",
      regionId: region.id,
      settlementId: oldHaven.id,
      ageGroup: "AGE_65_PLUS",
      population: options.lastResident,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
  ];
  if (options.thriving) {
    const town = createSettlement({
      id: "settlement_market_town",
      regionId: region.id,
      name: "Market Town",
      foundedTick: 0,
      stage: "VILLAGE",
    });
    settlements.push(town);
    cohorts.push(
      createPopulationCohort({
        id: "cohort_market_town_adults",
        regionId: region.id,
        settlementId: town.id,
        ageGroup: "AGE_25_44",
        population: 400,
        economicClass: "WORKING",
        skillLevel: "UNSKILLED",
      }),
    );
  }
  return createWorldState({
    world,
    continents: [
      { id: "continent_1", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [region],
    settlements,
    populationCohorts: cohorts,
  });
}

function tick(state: WorldState, t: number, rng: (scope: string) => RngStream) {
  return runEconomyTick({
    worldState: state,
    tick: t,
    demographyRng: rng,
    migrationRng: rng,
  });
}

const roundUp = () => ALWAYS_ROUND_UP;

describe("SET-LIFECYCLE-001 -- settlement abandonment (unit)", () => {
  const settlement = createSettlement({
    id: "s",
    regionId: "r",
    name: "S",
    foundedTick: 0,
  });

  it("A: an ACTIVE settlement with population > 0 stays ACTIVE (no fact)", () => {
    expect(
      evaluateSettlementAbandonment({
        settlement,
        tick: 3,
        population: 1,
        populationLossFactIndices: [],
      }),
    ).toBeUndefined();
  });

  it("B: population exactly 0 → ABANDONED in the same tick, recording the tick", () => {
    const result = evaluateSettlementAbandonment({
      settlement,
      tick: 7,
      population: 0,
      populationLossFactIndices: [],
    })!;
    expect(result.settlement.status).toBe("ABANDONED");
    expect(result.settlement.abandonedTick).toBe(7);
    expect(result.settlement.id).toBe("s");
    expect(result.settlement.name).toBe("S");
    expect(result.facts.map((f) => f.type)).toEqual(["settlement_abandoned"]);
  });

  it("D/J: an ABANDONED settlement never abandons again and has no path back to ACTIVE", () => {
    const abandoned = evaluateSettlementAbandonment({
      settlement,
      tick: 1,
      population: 0,
      populationLossFactIndices: [],
    })!.settlement;
    for (const population of [0, 5, 1_000])
      expect(
        evaluateSettlementAbandonment({
          settlement: abandoned,
          tick: 2,
          population,
          populationLossFactIndices: [],
        }),
      ).toBeUndefined();
  });

  it("negative population is an invariant violation, never a silent abandonment", () => {
    expect(() =>
      evaluateSettlementAbandonment({
        settlement,
        tick: 1,
        population: -1,
        populationLossFactIndices: [],
      }),
    ).toThrow(/>= 0/);
  });
});

describe("SET-LIFECYCLE-001 -- production tick path", () => {
  it("B/C: the last resident dies → ABANDONED in that tick with exactly one fact, caused by the death", () => {
    const start = buildWorld({ lastResident: 1 });
    const { worldState, facts, causalLinks } = tick(start, 0, roundUp);
    const oldHaven = worldState.settlements.settlement_old_haven!;
    expect(oldHaven.status).toBe("ABANDONED");
    expect(oldHaven.abandonedTick).toBe(0);
    expect(oldHaven.population.totalPopulation).toBe(0);

    const abandonedFacts = facts.filter((f) => f.type === "settlement_abandoned");
    expect(abandonedFacts).toHaveLength(1);
    expect(abandonedFacts[0]).toMatchObject({
      subject: { entityType: "settlement", entityId: "settlement_old_haven" },
      location: { regionId: "region_haven", settlementId: "settlement_old_haven" },
      values: { before: 1, after: 0, delta: -1 },
    });
    // WHY? później: przyczyną jest fakt zgonu tego samego ticka (sameBatch), nie wymyślony powód.
    const target = facts.indexOf(abandonedFacts[0]!);
    const links = causalLinks.filter((l) => l.targetIndex === target);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.source.kind).toBe("sameBatch");
      if (link.source.kind === "sameBatch")
        expect(facts[link.source.index]!.type).toBe("population_declined");
    }
  });

  it("A/D: next ticks keep ABANDONED without a second fact; the thriving settlement stays ACTIVE", () => {
    let state = buildWorld({ lastResident: 1, thriving: true });
    let abandonments = 0;
    for (let t = 0; t < 4; t++) {
      const result = tick(state, t, roundUp);
      abandonments += result.facts.filter(
        (f) => f.type === "settlement_abandoned",
      ).length;
      state = result.worldState;
    }
    expect(abandonments).toBe(1);
    expect(state.settlements.settlement_old_haven!.status).toBe("ABANDONED");
    expect(state.settlements.settlement_old_haven!.abandonedTick).toBe(0);
    expect(state.settlements.settlement_market_town!.status).toBe("ACTIVE");
  });

  it("E/H: SETTLEMENTS counts only ACTIVE; the region and the historical entity remain", () => {
    const before = buildWorld({ lastResident: 1, thriving: true });
    expect(buildWorldSummaryReadModel(before).settlementCount).toBe(2);
    const { worldState } = tick(before, 0, roundUp);
    const summary = buildWorldSummaryReadModel(worldState);
    expect(summary.settlementCount).toBe(1);
    expect(summary.settlementCountByStage.HAMLET).toBe(0);
    // REGION ≠ SETTLEMENT: region istnieje, osada zostaje w WorldState jako historia.
    expect(worldState.regions.region_haven).toBeDefined();
    expect(worldState.regions.region_haven!.settlements.settlementIds).toContain(
      "settlement_old_haven",
    );
    expect(worldState.settlements.settlement_old_haven!.name).toBe("Old Haven");
  });

  it("F: the world view (Atlas input) no longer lists the abandoned settlement", () => {
    const { worldState, facts } = tick(
      buildWorld({ lastResident: 1, thriving: true }),
      0,
      roundUp,
    );
    const snapshot = buildWorldSnapshot(
      worldState,
      facts.map((f, i) => ({ ...f, id: `f${i}`, tick: 0 })),
    );
    const region = snapshot.regions.find((r) => r.regionId === "region_haven")!;
    expect(region.settlements.map((s) => s.settlementId)).toEqual([
      "settlement_market_town",
    ]);
    expect(region.largestSettlement?.id).toBe("settlement_market_town");
  });

  it("region whose only settlement is abandoned reads as a region without settlements", () => {
    const { worldState, facts } = tick(buildWorld({ lastResident: 1 }), 0, roundUp);
    const snapshot = buildWorldSnapshot(
      worldState,
      facts.map((f, i) => ({ ...f, id: `f${i}`, tick: 0 })),
    );
    const region = snapshot.regions[0]!;
    expect(region.population).toBe(0);
    expect(region.settlements).toEqual([]);
    expect(region.largestSettlement).toBeUndefined();
    expect(region.settlementPressure).toBe(0);
  });

  it("M: the lifecycle is deterministic -- same seed, same world, byte-identical state", () => {
    const run = () => {
      const rng = createWorldRng("settlement-lifecycle-determinism");
      const streams = (scope: string) => rng.stream("demography", scope);
      let state = buildWorld({ lastResident: 2, thriving: true });
      const factTypes: string[] = [];
      for (let t = 0; t < 36; t++) {
        const result = tick(state, t, streams);
        factTypes.push(...result.facts.map((f) => f.type));
        state = result.worldState;
      }
      return { state: JSON.stringify(state), factTypes: JSON.stringify(factTypes) };
    };
    expect(run()).toEqual(run());
  });
});

describe("SET-LIFECYCLE-001 -- migration and reactivation", () => {
  it("I: migration never targets an ABANDONED settlement; an all-abandoned region reads as unsettled land", () => {
    const { worldState } = tick(
      buildWorld({ lastResident: 1, thriving: true }),
      0,
      roundUp,
    );
    const region = worldState.regions.region_haven!;
    // Opuszczona osada ma teraz największą wolną pojemność (0 mieszkańców) -- i tak nie jest wybierana.
    const choice = selectDestinationSettlement({
      destinationRegion: region,
      settlementsById: worldState.settlements,
      settlementPopulationById: new Map([["settlement_market_town", 10_000]]),
    });
    expect(choice.settlementId).not.toBe("settlement_old_haven");

    const lone = tick(buildWorld({ lastResident: 1 }), 0, roundUp).worldState;
    expect(
      selectDestinationSettlement({
        destinationRegion: lone.regions.region_haven!,
        settlementsById: lone.settlements,
        settlementPopulationById: new Map(),
      }),
    ).toEqual({ settlementId: undefined, remainingCapacity: Number.POSITIVE_INFINITY });
  });

  it("J/K: an ABANDONED settlement cannot hold residents -- repopulation needs a NEW settlement id", () => {
    const { worldState } = tick(buildWorld({ lastResident: 1 }), 0, roundUp);
    const oldHaven = worldState.settlements.settlement_old_haven!;
    // Brak mechanizmu zakładania osad w symulacji -- testujemy niezmiennik:
    // przypisanie mieszkańców do opuszczonej osady jest błędem stanu, nie reaktywacją.
    expect(() =>
      createWorldState({
        world: worldState.world,
        continents: Object.values(worldState.continents),
        regions: Object.values(worldState.regions),
        settlements: Object.values(worldState.settlements),
        populationCohorts: [
          ...Object.values(worldState.populationCohorts),
          createPopulationCohort({
            id: "cohort_returnees",
            regionId: "region_haven",
            settlementId: oldHaven.id,
            ageGroup: "AGE_25_44",
            population: 30,
            economicClass: "WORKING",
            skillLevel: "UNSKILLED",
          }),
        ],
      }),
    ).toThrow(/ABANDONED settlement must have totalPopulation 0/);
    // Nowa osada w tym samym regionie jest poprawna -- nowe id, ACTIVE, stara zostaje historią.
    const newHaven = createSettlement({
      id: "settlement_new_haven",
      regionId: "region_haven",
      name: "New Haven",
      foundedTick: 12,
    });
    expect(newHaven.status).toBe("ACTIVE");
    expect(newHaven.id).not.toBe(oldHaven.id);
    const resettled = createWorldState({
      world: worldState.world,
      continents: Object.values(worldState.continents),
      regions: Object.values(worldState.regions),
      settlements: [...Object.values(worldState.settlements), newHaven],
      populationCohorts: Object.values(worldState.populationCohorts),
    });
    expect(resettled.settlements.settlement_old_haven!.status).toBe("ABANDONED");
    expect(resettled.settlements.settlement_new_haven!.status).toBe("ACTIVE");
  });

  it("world generation: every newly created settlement is ACTIVE", () => {
    expect(
      createSettlement({ id: "x", regionId: "r", name: "X", foundedTick: 0 }).status,
    ).toBe("ACTIVE");
  });
});
