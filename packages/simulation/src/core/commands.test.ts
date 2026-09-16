import { describe, expect, it } from "vitest";
import { CommandBoundary, createCommandBoundary } from "./commands.js";

describe("CommandBoundary", () => {
  it("drain(tick) only returns commands scheduled for that exact tick", () => {
    const boundary = createCommandBoundary<string>();
    boundary.enqueue(5, "for-tick-5");
    boundary.enqueue(6, "for-tick-6");

    expect(boundary.drain(5)).toEqual([
      { scheduledForTick: 5, sequence: 0, command: "for-tick-5" },
    ]);
    expect(boundary.drain(5)).toEqual([]);
    expect(boundary.drain(6)).toEqual([
      { scheduledForTick: 6, sequence: 1, command: "for-tick-6" },
    ]);
  });

  it("orders same-tick commands by enqueue sequence, not enqueue call order text", () => {
    const boundary = createCommandBoundary<string>();
    boundary.enqueue(10, "first");
    boundary.enqueue(10, "second");
    boundary.enqueue(10, "third");

    const due = boundary.drain(10);
    expect(due.map((entry) => entry.command)).toEqual(["first", "second", "third"]);
    expect(due.map((entry) => entry.sequence)).toEqual([0, 1, 2]);
  });

  it("rejects a negative or non-integer scheduledForTick", () => {
    const boundary = createCommandBoundary<string>();
    expect(() => boundary.enqueue(-1, "x")).toThrow(RangeError);
    expect(() => boundary.enqueue(1.5, "x")).toThrow(RangeError);
  });

  it("pendingCount reflects the queue and drops after drain", () => {
    const boundary = createCommandBoundary<string>();
    boundary.enqueue(1, "a");
    boundary.enqueue(2, "b");
    expect(boundary.pendingCount).toBe(2);
    boundary.drain(1);
    expect(boundary.pendingCount).toBe(1);
  });

  it("state roundtrips through the constructor", () => {
    const boundary = createCommandBoundary<string>();
    boundary.enqueue(3, "a");
    boundary.enqueue(3, "b");
    const state = boundary.getState();

    const restored = new CommandBoundary<string>(state);
    expect(restored.drain(3)).toEqual(boundary.drain(3));
  });
});
