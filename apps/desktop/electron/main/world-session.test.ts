import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadEconomyContent } from "@first-cause/worldgen";
import { WorldViewHistory, type WorldView } from "@first-cause/simulation";
import { WorldSession } from "./world-session.js";

// Root Vitest configuration runs desktop host tests from the repository root.
const root = process.cwd();
const raw = JSON.parse(
  readFileSync(
    join(root, "tests/worldgen/fixtures/black_mountain_reference.json"),
    "utf8",
  ),
);
const content = loadEconomyContent(root);

describe("World session read-model boundary", () => {
  it("runs real content, produces exact monthly baselines, Chronicle and causal drilldown", () => {
    expect(content.errors).toEqual([]);
    const session = new WorldSession(raw, content);
    const initial = session.handle({ type: "GET_WORLD", years: 1 }) as WorldView;
    expect(initial.baseline).toBeUndefined();
    session.handle({ type: "STEP_WORLD", ticks: 12 });
    const view = session.handle({ type: "GET_WORLD", years: 1 }) as WorldView;
    expect(view.current.summary.currentTick).toBe(12);
    expect(view.baseline).toEqual(initial.current);
    expect(view.availableTicks).toEqual(Array.from({ length: 13 }, (_, i) => i));
    expect(view.events.length).toBeGreaterThan(0);
    const factId = view.events[0]!.primaryFactRefs[0]!;
    const why = session.handle({ type: "GET_WORLD_WHY", factId });
    expect(why.type).toBe("WORLD_WHY");
    if (why.type === "WORLD_WHY")
      expect(why.facts.some((f) => f.id === factId)).toBe(true);
    expect(() => session.handle({ type: "GET_WORLD_WHY", factId, tick: 0 })).toThrow(
      "Unknown fact",
    );
    expect(
      (session.handle({ type: "GET_WORLD", years: 5 }) as WorldView).baseline,
    ).toBeUndefined();
    expect(
      (session.handle({ type: "GET_WORLD", years: 1, tick: 0 }) as WorldView).current,
    ).toEqual(initial.current);
  });
  it("keeps queries and locale-independent projections outside canonical state", () => {
    const session = new WorldSession(raw, content);
    const before = JSON.stringify(session.runner.worldState);
    for (const years of [1, 5, 10, 25, 50]) session.handle({ type: "GET_WORLD", years });
    session.handle({ type: "SET_WORLD_SPEED", speed: 0 });
    session.advance();
    expect(JSON.stringify(session.runner.worldState)).toBe(before);
    expect(() => session.handle({ type: "STEP_WORLD", ticks: -1 })).toThrow();
    expect(() => session.handle({ type: "GET_WORLD", years: 2 })).toThrow();
    expect(() => session.handle({ type: "GET_WORLD", years: 1, tick: 0.5 })).toThrow();
    expect(() => session.handle({ type: "SET_WORLD_SPEED", speed: 999 })).toThrow();
  });
  it("retains bounded immutable snapshots without substituting a nearby baseline", () => {
    const session = new WorldSession(raw, content);
    const snapshot = (session.handle({ type: "GET_WORLD", years: 1 }) as WorldView)
      .current;
    const history = new WorldViewHistory(12);
    for (const tick of [0, 1, 12, 13, 14])
      history.record({
        ...snapshot,
        summary: { ...snapshot.summary, currentTick: tick },
      });
    expect(history.view(14, 1, [], 0).availableTicks).toEqual([12, 13, 14]);
    expect(history.view(14, 1, [], 0).baseline).toBeUndefined();
    expect(() => history.view(14, 1, [], 0, 0)).toThrow("unavailable");
  });
});
