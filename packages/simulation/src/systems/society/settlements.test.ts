import { describe, expect, it } from "vitest";
import { createSettlement, type Settlement } from "@first-cause/entities";
import {
  computeSettlementPressure,
  evaluateSettlementGrowth,
  SETTLEMENT_STAGE_ORDER,
  STAGE_POPULATION_THRESHOLD,
} from "./settlements.js";

describe("computeSettlementPressure (FC-SETTLEMENT-001)", () => {
  it("increases when population, jobs and trade rise together, all else held stable", () => {
    const low = computeSettlementPressure({
      stage: "CAMP",
      population: 5,
      employment: 0,
      tradeUtilization: 0,
      infrastructureLevel: 0,
      housingCapacity: 1000, // ample -- constraints must not dominate
    });
    const high = computeSettlementPressure({
      stage: "CAMP",
      population: 45,
      employment: 30,
      tradeUtilization: 0.8,
      infrastructureLevel: 3,
      housingCapacity: 1000,
    });
    expect(high.urbanizationPressure).toBeGreaterThan(low.urbanizationPressure);
  });

  it("dampens urbanizationPressure when the same population overcrowds insufficient housing (urban crisis, FC-SETTLEMENT-003)", () => {
    const withRoom = computeSettlementPressure({
      stage: "CAMP",
      population: 100,
      employment: 50,
      tradeUtilization: 0.5,
      infrastructureLevel: 2,
      housingCapacity: 200,
    });
    const overcrowded = computeSettlementPressure({
      stage: "CAMP",
      population: 100,
      employment: 50,
      tradeUtilization: 0.5,
      infrastructureLevel: 2,
      housingCapacity: 20, // far below population
    });
    expect(overcrowded.urbanizationPressure).toBeLessThan(withRoom.urbanizationPressure);
  });

  it("gives METROPOLIS (no further stage) a defined, non-throwing result", () => {
    expect(() =>
      computeSettlementPressure({
        stage: "METROPOLIS",
        population: 50000,
        employment: 40000,
        tradeUtilization: 1,
        infrastructureLevel: 5,
        housingCapacity: 60000,
      }),
    ).not.toThrow();
  });
});

function buildSettlement(overrides: Partial<Settlement> = {}): Settlement {
  return {
    ...createSettlement({
      id: "settlement_test",
      regionId: "region_test",
      name: "Test Settlement",
      foundedTick: 0,
    }),
    ...overrides,
  };
}

describe("evaluateSettlementGrowth -- stage transitions (FC-SETTLEMENT-002)", () => {
  it("does not advance on a single (even overwhelmingly favorable) tick -- requires sustained persistence", () => {
    const settlement = buildSettlement({
      housing: { capacity: 2000, cost: 1, pressure: 0 }, // ample capacity so the capacity gate never blocks this test
    });

    const result = evaluateSettlementGrowth({
      settlement,
      tick: 0,
      signals: {
        stage: settlement.stage,
        population: 1000,
        employment: 900,
        tradeUtilization: 1,
        infrastructureLevel: 5,
        housingCapacity: settlement.housing.capacity,
      },
    });

    expect(result.settlement.stage).toBe("CAMP"); // unchanged after just one tick
    expect(result.settlement.growth.urbanizationStreak).toBe(1);
  });

  it("advances exactly on the tick persistence is satisfied, never earlier, and moves only one stage", () => {
    let settlement = buildSettlement({
      housing: { capacity: 2000, cost: 1, pressure: 0 },
    });
    const signals = {
      population: 1000,
      employment: 900,
      tradeUtilization: 1,
      infrastructureLevel: 5,
      housingCapacity: 2000,
    };

    let changedAtTick = -1;
    for (let tick = 0; tick < 10; tick++) {
      const result = evaluateSettlementGrowth({
        settlement,
        tick,
        signals: { stage: settlement.stage, ...signals },
      });
      if (result.settlement.stage !== settlement.stage) {
        changedAtTick = tick;
        settlement = result.settlement;
        break;
      }
      settlement = result.settlement;
    }

    expect(changedAtTick).toBe(5); // 0-indexed: the 6th consecutive tick (STAGE_PERSISTENCE_TICKS = 6)
    expect(settlement.stage).toBe("HAMLET"); // exactly one rung up from CAMP, never skipping to VILLAGE+
    expect(
      SETTLEMENT_STAGE_ORDER.indexOf(settlement.stage) -
        SETTLEMENT_STAGE_ORDER.indexOf("CAMP"),
    ).toBe(1);
  });

  it("blocks advance when housing capacity has not caught up, even once pressure has persisted long enough (§61 'capacity' gate)", () => {
    // growth.urbanizationStreak zasiane tuż pod progiem -- to wywołanie
    // dokłada ostatni tick persistence, ale housing.capacity startuje od
    // zera i przy tak dużej populacji nie nadąży w jednym ticku.
    const settlement = buildSettlement({
      growth: { urbanizationStreak: 5, declineStreak: 0, lastStageChangeTick: undefined },
    });

    const result = evaluateSettlementGrowth({
      settlement,
      tick: 5,
      signals: {
        stage: settlement.stage,
        population: 1000,
        employment: 900,
        tradeUtilization: 1,
        infrastructureLevel: 5,
        housingCapacity: settlement.housing.capacity,
      },
    });

    expect(result.settlement.stage).toBe("CAMP"); // still blocked -- capacity gate, not persistence
  });

  it("regresses a stage after sustained population/job collapse (decline pressure)", () => {
    let settlement = buildSettlement({
      stage: "TOWN",
      housing: { capacity: 1200, cost: 1, pressure: 0 },
    });
    const signals = {
      population: 0,
      employment: 0,
      tradeUtilization: 0,
      infrastructureLevel: 0,
      housingCapacity: 1200,
    };

    let changedAtTick = -1;
    for (let tick = 0; tick < 10; tick++) {
      const result = evaluateSettlementGrowth({
        settlement,
        tick,
        signals: { stage: settlement.stage, ...signals },
      });
      settlement = result.settlement;
      if (settlement.stage !== "TOWN") {
        changedAtTick = tick;
        break;
      }
    }

    expect(changedAtTick).toBe(5);
    expect(settlement.stage).toBe("VILLAGE"); // one rung down, never straight to CAMP
  });

  it("does not change stage again within the cooldown window right after a change", () => {
    let settlement = buildSettlement({
      housing: { capacity: 2000, cost: 1, pressure: 0 },
      growth: { urbanizationStreak: 5, declineStreak: 0, lastStageChangeTick: undefined },
    });
    const signals = {
      population: 1000,
      employment: 900,
      tradeUtilization: 1,
      infrastructureLevel: 5,
      housingCapacity: 2000,
    };

    const advance = evaluateSettlementGrowth({
      settlement,
      tick: 5,
      signals: { stage: settlement.stage, ...signals },
    });
    expect(advance.settlement.stage).toBe("HAMLET");
    settlement = advance.settlement;

    // Populacja teraz wystarcza nawet dla kolejnego progu (VILLAGE), a
    // capacity jest ample -- gdyby nie cooldown, awansowałaby dalej od razu.
    const immediatelyAfter = evaluateSettlementGrowth({
      settlement,
      tick: 6,
      signals: {
        stage: settlement.stage,
        population: 5000,
        employment: 4500,
        tradeUtilization: 1,
        infrastructureLevel: 5,
        housingCapacity: 6000,
      },
    });
    expect(immediatelyAfter.settlement.stage).toBe("HAMLET"); // still on cooldown
  });

  it("emits settlement_stage_changed with the correct before/after stage indices exactly when the stage changes", () => {
    const settlement = buildSettlement({
      housing: { capacity: 2000, cost: 1, pressure: 0 },
      growth: { urbanizationStreak: 5, declineStreak: 0, lastStageChangeTick: undefined },
    });

    const result = evaluateSettlementGrowth({
      settlement,
      tick: 5,
      signals: {
        stage: settlement.stage,
        population: 1000,
        employment: 900,
        tradeUtilization: 1,
        infrastructureLevel: 5,
        housingCapacity: 2000,
      },
    });

    const stageFact = result.facts.find((f) => f.type === "settlement_stage_changed");
    expect(stageFact).toBeDefined();
    expect(stageFact!.values).toEqual({
      before: SETTLEMENT_STAGE_ORDER.indexOf("CAMP"),
      after: SETTLEMENT_STAGE_ORDER.indexOf("HAMLET"),
      delta: 1,
    });
  });

  it("Metropolis is not required to be reachable -- a settlement can stay indefinitely below it without error", () => {
    expect(STAGE_POPULATION_THRESHOLD.METROPOLIS).toBeGreaterThan(0);
    const settlement = buildSettlement();
    expect(() =>
      evaluateSettlementGrowth({
        settlement,
        tick: 0,
        signals: {
          stage: settlement.stage,
          population: 1,
          employment: 0,
          tradeUtilization: 0,
          infrastructureLevel: 0,
          housingCapacity: 0,
        },
      }),
    ).not.toThrow();
  });
});
