import { describe, expect, it } from "vitest";
import { HeadlessRunner, createHeadlessRunner } from "./runner.js";

const CONFIG = { worldSeed: "vs-golden-run", startYear: 1200 } as const;

describe("HeadlessRunner determinism (M1 Acceptance Gate, Technology Stack Decision SS98)", () => {
  it("10 000 empty ticks are reproducible: same seed -> same final checksum", () => {
    const runA = createHeadlessRunner(CONFIG);
    runA.runTicks(10_000);

    const runB = createHeadlessRunner(CONFIG);
    runB.runTicks(10_000);

    expect(runA.tick).toBe(10_000);
    expect(runA.checksum()).toBe(runB.checksum());
  });

  it("advances the calendar consistently with 1 tick = 1 month over a long run", () => {
    const runner = createHeadlessRunner(CONFIG);
    runner.runTicks(10_000);
    // 10 000 months = 833 years and 4 months.
    expect(runner.date).toEqual({ year: 1200 + 833, month: 5 });
  });

  it("SAVE-005: x1 (stepwise) and a single batched runTicks(N) reach the same checksum", () => {
    const stepwise = createHeadlessRunner(CONFIG);
    for (let i = 0; i < 500; i++) {
      stepwise.step();
    }

    const batched = createHeadlessRunner(CONFIG);
    batched.runTicks(500);

    expect(stepwise.tick).toBe(batched.tick);
    expect(stepwise.checksum()).toBe(batched.checksum());
  });

  it("save/restore roundtrip: pausing mid-run and resuming matches an uninterrupted run", () => {
    const uninterrupted = createHeadlessRunner(CONFIG);
    uninterrupted.runTicks(200);
    const referenceChecksum = uninterrupted.checksum();

    const paused = createHeadlessRunner(CONFIG);
    paused.runTicks(80);
    const savedState = paused.getState();

    const resumed = HeadlessRunner.fromState(savedState);
    resumed.runTicks(120);

    expect(resumed.tick).toBe(200);
    expect(resumed.checksum()).toBe(referenceChecksum);
  });

  it("touching an RNG stream before pausing still resumes identically after restore", () => {
    const uninterrupted = createHeadlessRunner(CONFIG);
    uninterrupted.rngStream("company_ai").nextUint32();
    uninterrupted.runTicks(50);
    const nextValueUninterrupted = uninterrupted.rngStream("company_ai").nextUint32();

    const paused = createHeadlessRunner(CONFIG);
    paused.rngStream("company_ai").nextUint32();
    paused.runTicks(50);
    const restored = HeadlessRunner.fromState(paused.getState());
    const nextValueRestored = restored.rngStream("company_ai").nextUint32();

    expect(nextValueRestored).toBe(nextValueUninterrupted);
  });

  it("different world seeds diverge in checksum", () => {
    const a = createHeadlessRunner({ ...CONFIG, worldSeed: "seed-a" });
    const b = createHeadlessRunner({ ...CONFIG, worldSeed: "seed-b" });
    a.runTicks(10);
    b.runTicks(10);
    expect(a.checksum()).not.toBe(b.checksum());
  });
});

describe("HeadlessRunner command boundary (SAVE-006)", () => {
  it("a command scheduled for a future tick is not drained early", () => {
    // step() drains whatever is due at the *current* tick, then advances --
    // so a command scheduled for tick 3 is only drained by the step() call
    // that runs while clock.tick === 3 (the 4th call, tick 0->1->2->3->4).
    const runner = createHeadlessRunner(CONFIG);
    runner.enqueueCommand(3, { kind: "noop" });
    expect(runner.pendingCommandCount).toBe(1);

    runner.step(); // drains tick 0, then -> tick 1
    runner.step(); // drains tick 1, then -> tick 2
    runner.step(); // drains tick 2, then -> tick 3
    expect(runner.pendingCommandCount).toBe(1);

    runner.step(); // drains tick 3 (our command), then -> tick 4
    expect(runner.pendingCommandCount).toBe(0);
  });
});
