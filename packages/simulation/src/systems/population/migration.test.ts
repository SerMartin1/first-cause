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
  type Settlement,
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

  it("blocks (does NOT fall back to unconstrained rural) when every settlement is already at capacity (audit P0-04)", () => {
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

    // Audytowa reprodukcja: region MA settlement, ale jest pełny -- to
    // twardy limit (0), nie rural fallback (Infinity). Poprzednio oba
    // przypadki (brak settlementu / pełny settlement) zwracały to samo
    // Infinity, znosząc housing jako ograniczenie migracji.
    expect(choice.settlementId).toBeUndefined();
    expect(choice.remainingCapacity).toBe(0);
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
  /** Nadpisuje domyślną pojedynczą kohortę regionu A -- kilka rekordów naraz, dla testów P0-01/P0-02. */
  readonly cohortsInA?: readonly PopulationCohort[];
  readonly connectAC?: boolean;
  /** Settlementy regionu B (jedynego bezpośredniego sąsiada A), dla testów P0-04 pełnego housingu. */
  readonly settlementsInB?: readonly Settlement[];
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
    populationCohorts: input.cohortsInA ? [...input.cohortsInA] : [cohortA],
    settlements: input.settlementsInB ? [...input.settlementsInB] : [],
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

function sumPopulationByAgeGroup(
  cohorts: Readonly<Record<string, PopulationCohort>>,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const cohort of Object.values(cohorts)) {
    totals[cohort.ageGroup] = (totals[cohort.ageGroup] ?? 0) + cohort.population;
  }
  return totals;
}

function sumPopulationByProfession(
  cohorts: Readonly<Record<string, PopulationCohort>>,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const cohort of Object.values(cohorts)) {
    const key = cohort.profession ?? "none";
    totals[key] = (totals[key] ?? 0) + cohort.population;
  }
  return totals;
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

describe("runMigrationPass -- cohort identity across age groups (audit P0-01)", () => {
  it("migration_preserves_age_under_record_permutation: each age group lands as itself, regardless of source record order", () => {
    const adults = buildCohort({
      id: "cohort_a_adults",
      regionId: "region_a",
      ageGroup: "AGE_25_44",
      population: 1000,
    });
    const seniors = buildCohort({
      id: "cohort_a_seniors",
      regionId: "region_a",
      ageGroup: "AGE_65_PLUS",
      population: 1000,
    });

    const runWithOrder = (cohortsInA: readonly PopulationCohort[]) => {
      const worldState = buildChainWorld({
        attractionByRegion: { region_a: 0, region_b: 1, region_c: 1 },
        connectAC: false,
        cohortsInA,
      });
      return runMigrationPass({
        regions: worldState.regions,
        connections: worldState.connections,
        settlements: worldState.settlements,
        populationCohorts: worldState.populationCohorts,
        tick: 0,
        rng: testRng("age-permutation"),
      });
    };

    const adultsFirst = runWithOrder([adults, seniors]);
    const seniorsFirst = runWithOrder([seniors, adults]);

    for (const result of [adultsFirst, seniorsFirst]) {
      const totals = sumPopulationByAgeGroup(result.populationCohorts);
      // Żadna grupa wieku nie może "pożyczyć" populacji drugiej --
      // audytowa reprodukcja: kolejność rekordów zmieniała, KTÓRA grupa
      // wieku odziedziczyła migrantów drugiej.
      expect(totals["AGE_25_44"]).toBe(1000);
      expect(totals["AGE_65_PLUS"]).toBe(1000);
    }

    // Wynik przebiegu nie może zależeć od kolejności wejściowych rekordów
    // (SIM-005) -- oba przebiegi startują z tego samego zbioru kohort,
    // różni je tylko kolejność w rekordzie wejściowym.
    expect(adultsFirst.populationCohorts).toEqual(seniorsFirst.populationCohorts);
    expect(adultsFirst.facts).toEqual(seniorsFirst.facts);
  });
});

describe("runMigrationPass -- concurrent professions to the same destination (audit P0-02)", () => {
  it("migration_profession_ids_are_unique_and_population_conserved: two professions migrating in the same tick don't overwrite each other's destination cohort", () => {
    const agriculture = buildCohort({
      id: "cohort_a_agriculture",
      regionId: "region_a",
      population: 1000,
      profession: "agriculture",
    });
    const manufacturing = buildCohort({
      id: "cohort_a_manufacturing",
      regionId: "region_a",
      population: 1000,
      profession: "manufacturing",
    });

    const worldState = buildChainWorld({
      attractionByRegion: { region_a: 0, region_b: 1, region_c: 1 },
      connectAC: false,
      cohortsInA: [agriculture, manufacturing],
    });

    const before = sumPopulation(worldState.populationCohorts);
    const result = runMigrationPass({
      regions: worldState.regions,
      connections: worldState.connections,
      settlements: worldState.settlements,
      populationCohorts: worldState.populationCohorts,
      tick: 0,
      rng: testRng("profession-collision"),
    });
    const after = sumPopulation(result.populationCohorts);

    // Audytowa reprodukcja: 2000 przed, 1985 po -- kolizja ID kasowała
    // pierwszych 15 migrantów mimo poprawnie wyglądającego bilansu faktów.
    expect(after).toBe(before);

    const byProfession = sumPopulationByProfession(result.populationCohorts);
    expect(byProfession["agriculture"]).toBe(1000);
    expect(byProfession["manufacturing"]).toBe(1000);

    const outTotal = result.facts
      .filter((f) => f.type === "population_migrated_out")
      .reduce((sum, f) => sum + (f.values.delta ?? 0), 0);
    const inTotal = result.facts
      .filter((f) => f.type === "population_migrated_in")
      .reduce((sum, f) => sum + (f.values.delta ?? 0), 0);
    expect(inTotal).toBe(-outTotal);
  });
});

describe("runMigrationPass -- full destination housing blocks inflow (audit P0-04)", () => {
  it("full_destination_housing_blocks_inflow: migrants do not spill into an unconstrained rural cohort when the only destination settlement is full", () => {
    const fullSettlement = {
      ...createSettlement({
        id: "settlement_b_full",
        regionId: "region_b",
        name: "Full",
        foundedTick: 0,
      }),
      housing: { capacity: 0, cost: 0, pressure: 0 }, // pełne od zera -- każda dodatnia populacja by je przekroczyła
    };

    const worldState = buildChainWorld({
      attractionByRegion: { region_a: 0, region_b: 1, region_c: 1 },
      connectAC: false,
      settlementsInB: [fullSettlement],
    });

    const before = sumPopulation(worldState.populationCohorts);
    const result = runMigrationPass({
      regions: worldState.regions,
      connections: worldState.connections,
      settlements: worldState.settlements,
      populationCohorts: worldState.populationCohorts,
      tick: 0,
      rng: testRng("full-housing-block"),
    });

    // Zero migrantów fizycznie się przeniosło -- populacja regionu A
    // niezmieniona, brak nowej kohorty w regionie B (audytowa
    // reprodukcja: przed fixem `settlementId: undefined, remainingCapacity:
    // Infinity` puszczał migrantów jako nieograniczoną kohortę regionalną).
    expect(sumPopulation(result.populationCohorts)).toBe(before);
    for (const cohort of Object.values(result.populationCohorts)) {
      if (cohort.regionId === "region_b") {
        expect(cohort.population).toBe(0);
      }
    }
    expect(result.facts).toEqual([]);
  });
});

describe("runMigrationPass -- outflow releases housing capacity within the same pass (audit P2#1)", () => {
  it("migration_outflow_releases_housing_capacity: a settlement that loses residents this tick frees room for a later inflow in the SAME pass", () => {
    // Chain: region_away -- region_hub -- region_incoming (region_away and
    // region_incoming NOT directly connected). Sortowanie regionów po id
    // (SIM-005) daje kolejność away, hub, incoming -- hub jest więc
    // przetwarzany jako ŹRÓDŁO (resident wyjeżdża, zwalniając miejsce)
    // ZANIM region_incoming jest przetwarzany jako źródło napływu DO hub.
    // To dokładnie ta kolejność, w której bug P2#1 (settlementPopulationById
    // aktualizowany tylko dla napływu, nie odpływu) blokowałby napływ mimo
    // realnie zwolnionego miejsca.
    const world = createWorld({
      id: "world_release_test",
      seed: "release-test",
      name: "Release Test World",
      configuration: { regionCount: 3, worldSizePreset: "prototype-8-12" },
    });
    const continent = createContinent({
      id: "continent_test",
      worldId: world.id,
      name: "Test Continent",
    });
    const regionAway = createRegion({
      id: "region_away",
      worldId: world.id,
      continentId: continent.id,
      name: "Away",
      geography: GEOGRAPHY,
    });
    const regionHub = createRegion({
      id: "region_hub",
      worldId: world.id,
      continentId: continent.id,
      name: "Hub",
      geography: GEOGRAPHY,
    });
    const regionIncoming = createRegion({
      id: "region_incoming",
      worldId: world.id,
      continentId: continent.id,
      name: "Incoming",
      geography: GEOGRAPHY,
    });

    const connections = [
      createConnection({
        id: "connection_hub_away",
        regionAId: "region_hub",
        regionBId: "region_away",
        geography: { physicalDistance: 0, terrainDifficulty: 0, seasonalModifier: 1 },
      }),
      createConnection({
        id: "connection_incoming_hub",
        regionAId: "region_incoming",
        regionBId: "region_hub",
        geography: { physicalDistance: 0, terrainDifficulty: 0, seasonalModifier: 1 },
      }),
    ];

    const hubSettlement = {
      ...createSettlement({
        id: "settlement_hub",
        regionId: "region_hub",
        name: "Hub Settlement",
        foundedTick: 0,
      }),
      housing: { capacity: 1000, cost: 0, pressure: 0 }, // dokładnie tyle, ile resident zajmuje na starcie -- pełne
    };

    const resident = buildCohort({
      id: "cohort_hub_resident",
      regionId: "region_hub",
      settlementId: "settlement_hub",
      population: 1000,
    });
    // skillLevel "SKILLED" (resident jest "UNSKILLED"): świadomie inna
    // tożsamość niż resident, żeby napływ NIE scalił się w jeden rekord z
    // resident's własną kohortą -- test musi umieć odróżnić "ile zostało z
    // resident" od "ile przybyło z incoming" jako dwa osobne rekordy.
    const incoming = buildCohort({
      id: "cohort_incoming",
      regionId: "region_incoming",
      population: 1000,
      skillLevel: "SKILLED",
    });

    const worldState = createWorldState({
      world,
      continents: [continent],
      regions: [regionAway, regionHub, regionIncoming],
      connections,
      populationCohorts: [resident, incoming],
      settlements: [hubSettlement],
    });

    const withAttraction: WorldState = {
      ...worldState,
      regions: {
        region_away: {
          ...worldState.regions.region_away!,
          cached: { ...worldState.regions.region_away!.cached, migrationAttraction: 1 },
        },
        region_hub: {
          ...worldState.regions.region_hub!,
          cached: { ...worldState.regions.region_hub!.cached, migrationAttraction: 0.5 },
        },
        region_incoming: {
          ...worldState.regions.region_incoming!,
          cached: {
            ...worldState.regions.region_incoming!.cached,
            migrationAttraction: 0,
          },
        },
      },
    };

    const result = runMigrationPass({
      regions: withAttraction.regions,
      connections: withAttraction.connections,
      settlements: withAttraction.settlements,
      populationCohorts: withAttraction.populationCohorts,
      tick: 0,
      rng: testRng("release-within-pass"),
    });

    const residentAfter = result.populationCohorts[resident.id]!;
    expect(residentAfter.population).toBeLessThan(1000); // odpływ do region_away faktycznie nastąpił

    const totalHubSettlementPopulation = Object.values(result.populationCohorts)
      .filter((c) => c.settlementId === "settlement_hub")
      .reduce((sum, c) => sum + c.population, 0);

    // Bez fixu P2#1: settlementPopulationById zostałby na 1000 (odpływ nigdy
    // nie zwolniony), więc napływ z region_incoming byłby zablokowany
    // (remainingCapacity=0) i totalHubSettlementPopulation === residentAfter.
    // Z fixem: napływ zajął dokładnie tyle miejsca, ile odpływ zwolnił.
    expect(totalHubSettlementPopulation).toBeGreaterThan(residentAfter.population);
    expect(totalHubSettlementPopulation).toBeLessThanOrEqual(1000); // twardy limit wciąż respektowany
  });
});
