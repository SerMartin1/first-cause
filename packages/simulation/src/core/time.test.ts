import { describe, expect, it } from "vitest";
import { SimulationClock, advanceCalendarDate, tickToDate } from "./time.js";

describe("tickToDate (1 tick = 1 month, SIM-001)", () => {
  it("tick 0 is the start date", () => {
    expect(tickToDate(1200, 1, 0)).toEqual({ year: 1200, month: 1 });
  });

  it("advances month by month within a year", () => {
    expect(tickToDate(1200, 1, 11)).toEqual({ year: 1200, month: 12 });
    expect(tickToDate(1200, 1, 12)).toEqual({ year: 1201, month: 1 });
  });

  it("rolls over multiple years", () => {
    expect(tickToDate(1200, 1, 24)).toEqual({ year: 1202, month: 1 });
    expect(tickToDate(1200, 3, 10)).toEqual({ year: 1201, month: 1 });
  });

  it("rejects an out-of-range startMonth", () => {
    expect(() => tickToDate(1200, 0, 0)).toThrow(RangeError);
    expect(() => tickToDate(1200, 13, 0)).toThrow(RangeError);
  });

  it("rejects a negative tick", () => {
    expect(() => tickToDate(1200, 1, -1)).toThrow(RangeError);
  });
});

describe("advanceCalendarDate (audit P1-04, World.currentDate advancement)", () => {
  it("advances by one month within a year", () => {
    expect(advanceCalendarDate({ year: 1, month: 1 })).toEqual({ year: 1, month: 2 });
  });

  it("rolls over into the next year after December", () => {
    expect(advanceCalendarDate({ year: 1, month: 12 })).toEqual({ year: 2, month: 1 });
  });

  it("matches tickToDate's own month-by-month progression, without needing startYear/startMonth", () => {
    let date = tickToDate(1200, 3, 0);
    for (let tick = 1; tick <= 25; tick++) {
      date = advanceCalendarDate(date);
      expect(date).toEqual(tickToDate(1200, 3, tick));
    }
  });

  it("rejects an out-of-range month", () => {
    expect(() => advanceCalendarDate({ year: 1, month: 0 })).toThrow(RangeError);
    expect(() => advanceCalendarDate({ year: 1, month: 13 })).toThrow(RangeError);
  });
});

describe("SimulationClock", () => {
  it("starts at tick 0 with the configured start date", () => {
    const clock = new SimulationClock({ startYear: 1200 });
    expect(clock.tick).toBe(0);
    expect(clock.date).toEqual({ year: 1200, month: 1 });
  });

  it("advance() moves tick and derived date forward deterministically", () => {
    const clock = new SimulationClock({ startYear: 1200, startMonth: 11 });
    clock.advance();
    expect(clock.tick).toBe(1);
    expect(clock.date).toEqual({ year: 1200, month: 12 });
    clock.advance();
    expect(clock.date).toEqual({ year: 1201, month: 1 });
  });

  it("advance(count) jumps multiple ticks at once", () => {
    const clock = new SimulationClock({ startYear: 1200 });
    clock.advance(24);
    expect(clock.tick).toBe(24);
    expect(clock.date).toEqual({ year: 1202, month: 1 });
  });

  it("state roundtrips through fromState", () => {
    const clock = new SimulationClock({ startYear: 1200, startMonth: 6 });
    clock.advance(30);
    const state = clock.getState();

    const restored = SimulationClock.fromState(state);
    expect(restored.tick).toBe(clock.tick);
    expect(restored.date).toEqual(clock.date);

    restored.advance();
    clock.advance();
    expect(restored.date).toEqual(clock.date);
  });
});
