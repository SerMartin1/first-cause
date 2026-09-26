import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadEconomyContent } from "@first-cause/worldgen";
import {
  selectWorldAnalysis,
  WorldViewHistory,
  type WorldView,
} from "@first-cause/simulation";
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
  it("derives scope summaries only from causal edges, freezes timeline results and preserves WHY handoff", () => {
    const session = new WorldSession(raw, content);
    session.handle({ type: "STEP_WORLD", ticks: 12 });
    const view = session.handle({ type: "GET_WORLD", years: 1 }) as WorldView;
    const before = JSON.stringify(session.runner.worldState);
    const world = selectWorldAnalysis(view.current, { kind: "WORLD" }, 1);
    expect(world.causes.length).toBeGreaterThan(0);
    expect(world.projectionStatus).toBe("UNAVAILABLE");
    for (const cause of world.causes) {
      const edge = session.runner.causalEdges.find((e) => e.id === cause.id)!;
      expect(edge.sourceFactId).toBe(cause.factId);
      expect(edge.targetFactId).toBe(cause.effectFactId);
      expect(edge.contribution).toBe(cause.contribution);
    }
    const item = world.causes[0]!;
    const scope = { kind: "REGION" as const, regionId: item.effectRegionId };
    const regional = selectWorldAnalysis(view.current, scope, 1);
    expect(regional.causes.every((c) => c.effectRegionId === scope.regionId)).toBe(true);
    const context = {
      scope,
      itemId: item.id,
      itemKind: "cause" as const,
      regionId: scope.regionId,
    };
    const why = session.handle({
      type: "GET_WORLD_WHY",
      factId: item.effectFactId,
      tick: 12,
      context,
    });
    expect(why).toMatchObject({ context, tick: 12 });
    expect(JSON.stringify(session.runner.worldState)).toBe(before);
    session.handle({ type: "STEP_WORLD", ticks: 12 });
    const historical = session.handle({
      type: "GET_WORLD",
      years: 1,
      tick: 12,
    }) as WorldView;
    expect(selectWorldAnalysis(historical.current, scope, 1)).toEqual(regional);
    expect(
      selectWorldAnalysis(
        {
          ...historical.current,
          causalDrivers: [...historical.current.causalDrivers!].reverse(),
        },
        scope,
        1,
      ),
    ).toEqual(regional);
    const empty = session.handle({ type: "GET_WORLD", years: 1, tick: 0 }) as WorldView;
    expect(selectWorldAnalysis(empty.current, { kind: "WORLD" }, 1).causes).toEqual([]);
  });
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
