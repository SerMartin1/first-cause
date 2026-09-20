import { describe, expect, it } from "vitest";
import { createActiveProcessRegistry } from "./active-process-registry.js";

describe("ActiveProcessRegistry", () => {
  it("opens a new process as EMERGING and renews it on a later signal instead of duplicating it", () => {
    const registry = createActiveProcessRegistry();
    const opened = registry.openOrRenew("shortage:region_x:grain", "shortage", 10, "fact_10_0");
    expect(opened.state).toBe("EMERGING");
    expect(opened.startTick).toBe(10);

    const renewed = registry.openOrRenew("shortage:region_x:grain", "shortage", 14, "fact_14_0");
    expect(renewed.startTick).toBe(10); // unchanged
    expect(renewed.lastSignalTick).toBe(14);
    expect(registry.all()).toHaveLength(1);
  });

  it("starts a fresh process when the previous one for the same key was already RESOLVED", () => {
    const registry = createActiveProcessRegistry();
    registry.openOrRenew("shortage:region_x:grain", "shortage", 10, "fact_10_0");
    registry.advance("shortage:region_x:grain", "RESOLVED", 20);

    const restarted = registry.openOrRenew("shortage:region_x:grain", "shortage", 30, "fact_30_0");
    expect(restarted.startTick).toBe(30);
    expect(restarted.state).toBe("EMERGING");
  });

  it("findStale only returns still-open processes past the silence window, sorted deterministically", () => {
    const registry = createActiveProcessRegistry();
    registry.openOrRenew("shortage:b:grain", "shortage", 0, "fact_0_0");
    registry.openOrRenew("shortage:a:grain", "shortage", 0, "fact_0_1");
    registry.advance("shortage:a:grain", "RESOLVED", 0);

    const stale = registry.findStale(12, 12);
    expect(stale.map((p) => p.processKey)).toEqual(["shortage:b:grain"]);
  });

  it("linkEntry attaches an entry id without disturbing other fields", () => {
    const registry = createActiveProcessRegistry();
    registry.openOrRenew("shortage:x:grain", "shortage", 0, "fact_0_0");
    registry.linkEntry("shortage:x:grain", "chronicle_0_0");
    expect(registry.get("shortage:x:grain")?.entryId).toBe("chronicle_0_0");
  });
});
