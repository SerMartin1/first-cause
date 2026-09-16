import { describe, expect, it } from "vitest";
import { buildFactIndices, createFactStore } from "./fact-store.js";

const RESOURCE_DISCOVERED = {
  type: "resource_discovered",
  subject: { entityType: "resourceDeposit", entityId: "deposit_001" },
  location: { regionId: "region_001" },
  values: { before: "UNKNOWN", after: "DISCOVERED" },
} as const;

describe("FactStore.emit", () => {
  it("assigns deterministic fact_<tick>_<sequence> IDs", () => {
    const store = createFactStore();
    const a = store.emit(5, RESOURCE_DISCOVERED);
    const b = store.emit(5, RESOURCE_DISCOVERED);
    const c = store.emit(6, RESOURCE_DISCOVERED);

    expect(a.id).toBe("fact_5_0");
    expect(b.id).toBe("fact_5_1");
    expect(c.id).toBe("fact_6_2");
  });

  it("rejects a negative or non-integer tick", () => {
    const store = createFactStore();
    expect(() => store.emit(-1, RESOURCE_DISCOVERED)).toThrow(RangeError);
    expect(() => store.emit(1.5, RESOURCE_DISCOVERED)).toThrow(RangeError);
  });

  it("emitAll records every input under the same tick, in order", () => {
    const store = createFactStore();
    const facts = store.emitAll(3, [
      RESOURCE_DISCOVERED,
      { ...RESOURCE_DISCOVERED, type: "resource_assessed" },
    ]);

    expect(facts.map((f) => f.type)).toEqual([
      "resource_discovered",
      "resource_assessed",
    ]);
    expect(facts.every((f) => f.tick === 3)).toBe(true);
    expect(store.size).toBe(2);
  });

  it("is append-only: all() reflects every emitted fact", () => {
    const store = createFactStore();
    store.emit(0, RESOURCE_DISCOVERED);
    store.emit(1, RESOURCE_DISCOVERED);
    expect(store.all()).toHaveLength(2);
  });
});

describe("buildFactIndices", () => {
  it("groups facts by tick, type, entity and region", () => {
    const store = createFactStore();
    store.emit(0, RESOURCE_DISCOVERED);
    store.emit(0, {
      ...RESOURCE_DISCOVERED,
      subject: { entityType: "resourceDeposit", entityId: "deposit_002" },
      location: { regionId: "region_002" },
    });
    store.emit(1, { ...RESOURCE_DISCOVERED, type: "resource_depleted" });

    const indices = buildFactIndices(store.all());

    expect(indices.byTick.get(0)).toHaveLength(2);
    expect(indices.byTick.get(1)).toHaveLength(1);
    expect(indices.byType.get("resource_discovered")).toHaveLength(2);
    expect(indices.byType.get("resource_depleted")).toHaveLength(1);
    expect(indices.byEntityId.get("deposit_001")).toHaveLength(2);
    expect(indices.byRegionId.get("region_002")).toHaveLength(1);
  });

  it("is reconstructible: rebuilding from the same fact list is idempotent", () => {
    const store = createFactStore();
    store.emit(0, RESOURCE_DISCOVERED);
    const facts = store.all();

    const first = buildFactIndices(facts);
    const second = buildFactIndices(facts);
    expect([...first.byType.entries()]).toEqual([...second.byType.entries()]);
  });
});
