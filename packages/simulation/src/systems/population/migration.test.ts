import { describe, expect, it } from "vitest";
import {
  createConnection,
  createContinent,
  createPopulationCohort,
  createRegion,
  createSettlement,
  createWorld,
  createWorldState,
  type PopulationCohort,
  type Region,
  type WorldState,
} from "@first-cause/entities";
import { createWorldRng, type RngStream } from "../../core/rng.js";
import {
  applyMigrationFlow,
  computeDistanceFriction,
  computeMigrationAttraction,
  computeMigrationPullSignal,
  evaluateMigrationOutflow,
  runMigrationPass,
  selectDestinationSettlement,
  updateMigrationPropensity,
} from "./migration.js";

const GEOGRAPHY = {
  terrain: "plains" as const,
  climate: "temperate" as const,
  area: 100,
  fertility: 0.5,
  waterAccess: true,
  coastal: false,
  elevationClass: "lowland" as const,
};

function testRng(seed: string): (scopeId: string) => RngStream {
  const rng = createWorldRng(seed);
  return (scopeId: string) => rng.stream("migration", scopeId);
}

describe("computeMigrationAttraction (FC-MIGRATION-001)", () => {
  it("increases when vacancies (Jobs) rise, all else held stable", () => {
    const base = computeMigrationAttraction({
      vacancies: 0,
      eligibleLaborForce: 100,
      averageWageOffer: 0,
      averageHousingCost: 0,
    });
    const withJobs = computeMigrationAttraction({
      vacancies: 30,
      eligibleLaborForce: 100,
      averageWageOffer: 0,
      averageHousingCost: 0,
    });
    expect(withJobs).toBeGreaterThan(base);
  });

  it("increases when averageWageOffer (ExpectedWage) rises, all else held stable", () => {
    const base = computeMigrationAttraction({
      vacancies: 0,
      eligibleLaborForce: 100,
      averageWageOffer: 0,
      averageHousingCost: 0,
    });
    const withWage = computeMigrationAttraction({
      vacancies: 0,
      eligibleLaborForce: 100,
      averageWageOffer: 15,
      averageHousingCost: 0,
    });
    expect(withWage).toBeGreaterThan(base);
  });

  it("decreases when averageHousingCost rises, all else held stable (FC-MIGRATION-003, soft dampening)", () => {
    const cheap = computeMigrationAttraction({
      vacancies: 20,
      eligibleLaborForce: 100,
      averageWageOffer: 15,
      averageHousingCost: 0,
    });
    const expensive = computeMigrationAttraction({
      vacancies: 20,
      eligibleLaborForce: 100,
      averageWageOffer: 15,
      averageHousingCost: 100,
    });
    expect(expensive).toBeLessThan(cheap);
  });

  it("stays within [0, 1] even for extreme inputs", () => {
    expect(
      computeMigrationAttraction({
        vacancies: 1_000_000,
        eligibleLaborForce: 1,
        averageWageOffer: 1_000_000,
        averageHousingCost: 0,
      }),
    ).toBeLessThanOrEqual(1);
    expect(
      computeMigrationAttraction({
        vacancies: 0,
        eligibleLaborForce: 0,
        averageWageOffer: 0,
        averageHousingCost: 1_000_000,
      }),
    ).toBeGreaterThanOrEqual(0);
  });
});

describe("computeDistanceFriction / computeMigrationPullSignal (FC-MIGRATION-002)", () => {
  it("friction decreases monotonically as effectiveDistance grows", () => {
    const near = computeDistanceFriction(0);
    const mid = computeDistanceFriction(50);
    const far = computeDistanceFriction(500);
    expect(near).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(far);
  });

  it("a larger effectiveDistance shrinks the pull signal toward an equally attractive destination", () => {
    const near = computeMigrationPullSignal({
      sourceAttraction: 0.2,
      destinationAttraction: 0.9,
      effectiveDistance: 0,
    });
    const far = computeMigrationPullSignal({
      sourceAttraction: 0.2,
      destinationAttraction: 0.9,
      effectiveDistance: 500,
    });
    expect(far).toBeLessThan(near);
    expect(far).toBeGreaterThanOrEqual(0);
  });
});

describe("updateMigrationPropensity / evaluateMigrationOutflow", () => {
  it("smooths toward the best pull signal instead of jumping to it in one tick", () => {
    const next = updateMigrationPropensity(0, 1);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it("produces no outflow below the propensity trigger", () => {
    const rng = createWorldRng("outflow-noise").stream("migration");
    expect(evaluateMigrationOutflow({ population: 1000, propensity: 0.01, rng })).toBe(0);
  });

  it("produces no outflow for a non-positive (content) propensity", () => {
    const rng = createWorldRng("outflow-content").stream("migration");
    expect(evaluateMigrationOutflow({ population: 1000, propensity: -0.5, rng })).toBe(0);
  });

  it("scales outflow with population * propensity * household inertia (exact, no fractional remainder)", () => {
    const rng = createWorldRng("outflow-exact").stream("migration");
    // 1000 * 0.3 * 0.05 = 15 exactly -- no stochastic rounding ambiguity.
    expect(evaluateMigrationOutflow({ population: 1000, propensity: 0.3, rng })).toBe(15);
  });
});

describe("selectDestinationSettlement (SET-003, FC-MIGRATION-003 hard cap)", () => {
  const destinationRegion: Region = createRegion({
    id: "region_dest",
    worldId: "world_test",
    continentId: "continent_test",
    name: "Destination",
    geography: GEOGRAPHY,
  });

  it("returns unconstrained (rural) when the destination region has no settlements", () => {
    const choice = selectDestinationSettlement({
      destinationRegion: { ...destinationRegion, settlements: { settlementIds: [] } },
      settlementsById: {},
      settlementPopulationById: new Map(),
    });
    expect(choice.settlementId).toBeUndefined();
    expect(choice.remainingCapacity).toBe(Number.POSITIVE_INFINITY);
  });

  it("picks the settlement with the most remaining capacity and never exceeds it", () => {
    const small = {
      ...createSettlement({
        id: "settlement_small",
        regionId: "region_dest",
        name: "Small",
        foundedTick: 0,
      }),
      housing: { capacity: 10, cost: 0, pressure: 0 },
    };
    const big = {
      ...createSettlement({
        id: "settlement_big",
        regionId: "region_dest",
        name: "Big",
        foundedTick: 0,
      }),
      housing: { capacity: 100, cost: 0, pressure: 0 },
    };

    const choice = selectDestinationSettlement({
      destinationRegion: {
        ...destinationRegion,
        settlements: { settlementIds: [small.id, big.id] },
      },
      settlementsById: { [small.id]: small, [big.id]: big },
      settlementPopulationById: new Map([
        [small.id, 0],
        [big.id, 40],
      ]),
    });

    expect(choice.settlementId).toBe(big.id); // 100 - 40 = 60 remaining > small's 10
    expect(choice.remainingCapacity).toBe(60);
  });

  it("falls back to unconstrained rural when every settlement is already at capacity", () => {
    const full = {
      ...createSettlement({
        id: "settlement_full",
        regionId: "region_dest",
        name: "Full",
        foundedTick: 0,
      }),
      housing: { capacity: 10, cost: 0, pressure: 0 },
    };

    const choice = selectDestinationSettlement({
      destinationRegion: {
        ...destinationRegion,
        settlements: { settlementIds: [full.id] },
      },
      settlementsById: { [full.id]: full },
      settlementPopulationById: new Map([[full.id, 10]]),
    });

    expect(choice.settlementId).toBeUndefined();
    expect(choice.remainingCapacity).toBe(Number.POSITIVE_INFINITY);
  });
});

function buildCohort(overrides: Partial<PopulationCohort> = {}): PopulationCohort {
  return {
    ...createPopulationCohort({
      id: "cohort_source",
      regionId: "region_a",
      ageGroup: "AGE_25_44",
      population: 100,
      economicClass: "WORKING",
      skillLevel: "UNSKILLED",
    }),
    ...overrides,
  };
}

describe("applyMigrationFlow (FC-MIGRATION-005 accounting)", () => {
  it("moves population out of the source and into a newly created destination cohort, with matching-magnitude facts", () => {
    const sourceCohort = buildCohort({ population: 100, employment: 20 });

    const result = applyMigrationFlow({
      sourceCohort,
      migrantCount: 10,
      destinationRegionId: "region_b",
      destinationSettlementId: undefined,
      tick: 5,
      existingDestinationCohort: undefined,
    });

    expect(result.sourceCohort.population).toBe(90);
    expect(result.destinationCohort.population).toBe(10);
    expect(result.destinationCohort.regionId).toBe("region_b");

    const outFact = result.facts.find((f) => f.type === "population_migrated_out")!;
    const inFact = result.facts.find((f) => f.type === "population_migrated_in")!;
    expect(outFact.values.delta).toBe(-10);
    expect(inFact.values.delta).toBe(10);
    expect(-outFact.values.delta!).toBe(inFact.values.delta); // OutMigration === InMigration
  });

  it("merges into an existing destination cohort of the same identity instead of creating a duplicate", () => {
    const sourceCohort = buildCohort({ population: 100, employment: 0 });
    const existingDestinationCohort = buildCohort({
      id: "cohort_dest_existing",
      regionId: "region_b",
      population: 50,
    });

    const result = applyMigrationFlow({
      sourceCohort,
      migrantCount: 10,
      destinationRegionId: "region_b",
      destinationSettlementId: undefined,
      tick: 5,
      existingDestinationCohort,
    });

    expect(result.destinationCohort.id).toBe("cohort_dest_existing");
    expect(result.destinationCohort.population).toBe(60);
  });

  it("caps source employment at the surviving population (audit pattern P0-04, phantom employment)", () => {
    const sourceCohort = buildCohort({ population: 100, employment: 95 });

    const result = applyMigrationFlow({
      sourceCohort,
      migrantCount: 50,
      destinationRegionId: "region_b",
      destinationSettlementId: undefined,
      tick: 5,
      existingDestinationCohort: undefined,
    });

    expect(result.sourceCohort.population).toBe(50);
    expect(result.sourceCohort.employment).toBe(50); // was 95, capped down
  });

  it("throws when migrantCount exceeds the source cohort's population (programmer error, fail loud)", () => {
    const sourceCohort = buildCohort({ population: 10 });
    expect(() =>
      applyMigrationFlow({
        sourceCohort,
        migrantCount: 11,
        destinationRegionId: "region_b",
        destinationSettlementId: undefined,
        tick: 0,
        existingDestinationCohort: undefined,
      }),
    ).toThrow(/exceeds source cohort/);
  });

  it("emits no facts and leaves both cohorts unchanged for a zero migrantCount", () => {
    const sourceCohort = buildCohort({ population: 100 });
    const result = applyMigrationFlow({
      sourceCohort,
      migrantCount: 0,
      destinationRegionId: "region_b",
      destinationSettlementId: undefined,
      tick: 0,
      existingDestinationCohort: undefined,
    });
    expect(result.facts).toEqual([]);
    expect(result.sourceCohort.population).toBe(100);
  });
});

/**
 * `runMigrationPass` integration fixture: three regions on a chain
 * `A -- B -- C` (only A<->B and B<->C are Connections; A and C are NOT
 * directly connected). `Region.cached.migrationAttraction` is seeded
 * directly on the built `WorldState` (bypassing `computeMigrationAttraction`,
 * already covered above) so each test controls push/pull precisely.
 */
function buildChainWorld(input: {
  readonly attractionByRegion: Readonly<
    Record<"region_a" | "region_b" | "region_c", number>
  >;
  readonly physicalDistanceAB?: number;
  readonly physicalDistanceBC?: number;
  readonly cohortPopulationInA?: number;
  readonly connectAC?: boolean;
}): WorldState {
  const world = createWorld({
    id: "world_migration_test",
    seed: "migration-chain-test",
    name: "Migration Test World",
    configuration: { regionCount: 3, worldSizePreset: "prototype-8-12" },
  });
  const continent = createContinent({
    id: "continent_test",
    worldId: world.id,
    name: "Test Continent",
  });
  const regionA = createRegion({
    id: "region_a",
    worldId: world.id,
    continentId: continent.id,
    name: "Region A",
    geography: GEOGRAPHY,
  });
  const regionB = createRegion({
    id: "region_b",
    worldId: world.id,
    continentId: continent.id,
    name: "Region B",
    geography: GEOGRAPHY,
  });
  const regionC = createRegion({
    id: "region_c",
    worldId: world.id,
    continentId: continent.id,
    name: "Region C",
    geography: GEOGRAPHY,
  });

  const connections = [
    createConnection({
      id: "connection_ab",
      regionAId: "region_a",
      regionBId: "region_b",
      geography: {
        physicalDistance: input.physicalDistanceAB ?? 0,
        terrainDifficulty: 0,
        seasonalModifier: 1,
      },
    }),
    createConnection({
      id: "connection_bc",
      regionAId: "region_b",
      regionBId: "region_c",
      geography: {
        physicalDistance: input.physicalDistanceBC ?? 0,
        terrainDifficulty: 0,
        seasonalModifier: 1,
      },
    }),
    ...(input.connectAC
      ? [
          createConnection({
            id: "connection_ac",
            regionAId: "region_a",
            regionBId: "region_c",
            geography: { physicalDistance: 0, terrainDifficulty: 0, seasonalModifier: 1 },
          }),
        ]
      : []),
  ];

  const cohortA = createPopulationCohort({
    id: "cohort_a_workers",
    regionId: "region_a",
    ageGroup: "AGE_25_44",
    population: input.cohortPopulationInA ?? 1000,
    economicClass: "WORKING",
    skillLevel: "UNSKILLED",
  });

  const worldState = createWorldState({
    world,
    continents: [continent],
    regions: [regionA, regionB, regionC],
    connections,
    populationCohorts: [cohortA],
  });

  const withAttraction: WorldState = {
    ...worldState,
    regions: {
      region_a: {
        ...worldState.regions.region_a!,
        cached: {
          ...worldState.regions.region_a!.cached,
          migrationAttraction: input.attractionByRegion.region_a,
        },
      },
      region_b: {
        ...worldState.regions.region_b!,
        cached: {
          ...worldState.regions.region_b!.cached,
          migrationAttraction: input.attractionByRegion.region_b,
        },
      },
      region_c: {
        ...worldState.regions.region_c!,
        cached: {
          ...worldState.regions.region_c!.cached,
          migrationAttraction: input.attractionByRegion.region_c,
        },
      },
    },
  };

  return withAttraction;
}

function sumPopulation(cohorts: Readonly<Record<string, PopulationCohort>>): number {
  return Object.values(cohorts).reduce((sum, c) => sum + c.population, 0);
}

describe("runMigrationPass -- candidate set (POP-007, FC-MIGRATION-004)", () => {
  it("never moves population directly from A to C when they are not connected, even if C is far more attractive than the actual neighbor B", () => {
    const worldState = buildChainWorld({
      attractionByRegion: { region_a: 0, region_b: 0.1, region_c: 1 },
      connectAC: false,
    });

    const result = runMigrationPass({
      regions: worldState.regions,
      connections: worldState.connections,
      settlements: worldState.settlements,
      populationCohorts: worldState.populationCohorts,
      tick: 0,
      rng: testRng("candidate-set"),
    });

    for (const cohort of Object.values(result.populationCohorts)) {
      expect(cohort.regionId).not.toBe("region_c");
    }
  });

  it("does move population toward the only actual neighbor when it is more attractive", () => {
    const worldState = buildChainWorld({
      attractionByRegion: { region_a: 0, region_b: 1, region_c: 1 },
      connectAC: false,
    });

    const result = runMigrationPass({
      regions: worldState.regions,
      connections: worldState.connections,
      settlements: worldState.settlements,
      populationCohorts: worldState.populationCohorts,
      tick: 0,
      rng: testRng("candidate-set-neighbor"),
    });

    const inB = Object.values(result.populationCohorts).some(
      (c) => c.regionId === "region_b" && c.population > 0,
    );
    expect(inB).toBe(true);
  });
});

describe("runMigrationPass -- conservation (FC-MIGRATION-005)", () => {
  it("never changes total population across a tick, regardless of how many regions/cohorts migrate", () => {
    const worldState = buildChainWorld({
      attractionByRegion: { region_a: 0, region_b: 0.8, region_c: 1 },
      connectAC: false,
      cohortPopulationInA: 5000,
    });

    const before = sumPopulation(worldState.populationCohorts);
    const result = runMigrationPass({
      regions: worldState.regions,
      connections: worldState.connections,
      settlements: worldState.settlements,
      populationCohorts: worldState.populationCohorts,
      tick: 0,
      rng: testRng("conservation"),
    });
    const after = sumPopulation(result.populationCohorts);

    expect(after).toBe(before);
  });

  it("keeps OutMigration and InMigration fact totals equal in magnitude", () => {
    const worldState = buildChainWorld({
      attractionByRegion: { region_a: 0, region_b: 0.8, region_c: 1 },
      connectAC: false,
    });

    const result = runMigrationPass({
      regions: worldState.regions,
      connections: worldState.connections,
      settlements: worldState.settlements,
      populationCohorts: worldState.populationCohorts,
      tick: 0,
      rng: testRng("accounting"),
    });

    const outTotal = result.facts
      .filter((f) => f.type === "population_migrated_out")
      .reduce((sum, f) => sum + (f.values.delta ?? 0), 0);
    const inTotal = result.facts
      .filter((f) => f.type === "population_migrated_in")
      .reduce((sum, f) => sum + (f.values.delta ?? 0), 0);

    expect(inTotal).toBe(-outTotal);
  });
});

describe("runMigrationPass -- determinism", () => {
  it("produces an identical result for two independent runs given the same seed", () => {
    const worldState = buildChainWorld({
      attractionByRegion: { region_a: 0, region_b: 0.8, region_c: 1 },
      connectAC: false,
    });

    const runOnce = () =>
      runMigrationPass({
        regions: worldState.regions,
        connections: worldState.connections,
        settlements: worldState.settlements,
        populationCohorts: worldState.populationCohorts,
        tick: 0,
        rng: testRng("determinism-seed"),
      });

    const first = runOnce();
    const second = runOnce();

    expect(first.populationCohorts).toEqual(second.populationCohorts);
    expect(first.facts).toEqual(second.facts);
  });
});
