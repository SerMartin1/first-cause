import { describe, expect, it } from "vitest";
import { classifyTier, isAnchor } from "./causal-memory.js";
import { createFactStore } from "./fact-store.js";

const PRICE_CHANGED = {
  type: "price_changed",
  subject: { entityType: "good", entityId: "iron_ore" },
  location: { regionId: "region_001" },
  values: { before: 1, after: 1.1 },
} as const;

const DISCOVERY_OCCURRED = { ...PRICE_CHANGED, type: "discovery_occurred" } as const;

describe("isAnchor", () => {
  it("treats architect-attributed facts as anchors regardless of type", () => {
    const store = createFactStore();
    const fact = store.emit(0, {
      ...PRICE_CHANGED,
      architect: { interventionId: "intervention_001", influenceStrength: 1 },
    });
    expect(isAnchor(fact)).toBe(true);
  });

  it("treats a placeholder allow-listed type as an anchor", () => {
    const store = createFactStore();
    expect(isAnchor(store.emit(0, DISCOVERY_OCCURRED))).toBe(true);
  });

  it("does not treat an ordinary fact as an anchor", () => {
    const store = createFactStore();
    expect(isAnchor(store.emit(0, PRICE_CHANGED))).toBe(false);
  });
});

describe("classifyTier", () => {
  it("keeps recent facts HOT regardless of mustKeep/anchor status", () => {
    const store = createFactStore();
    const fact = store.emit(100, PRICE_CHANGED);
    expect(classifyTier(fact, 110, false, 120)).toBe("HOT");
  });

  it("classifies an old, must-keep fact as PERMANENT", () => {
    const store = createFactStore();
    const fact = store.emit(0, PRICE_CHANGED);
    expect(classifyTier(fact, 500, true, 120)).toBe("PERMANENT");
  });

  it("classifies an old, non-anchor, non-must-keep fact as WARM", () => {
    const store = createFactStore();
    const fact = store.emit(0, PRICE_CHANGED);
    expect(classifyTier(fact, 500, false, 120)).toBe("WARM");
  });
});
