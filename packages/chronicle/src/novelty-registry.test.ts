import { describe, expect, it } from "vitest";
import { createNoveltyRegistry, NoveltyRegistry } from "./novelty-registry.js";

describe("NoveltyRegistry", () => {
  it("reports the first occurrence of a (category, scope, scopeId) triple as first, later ones as not", () => {
    const registry = createNoveltyRegistry();
    expect(registry.recordAndCheckFirst("resources", "region", "black_mountain")).toBe(true);
    expect(registry.recordAndCheckFirst("resources", "region", "black_mountain")).toBe(false);
    expect(registry.has("resources", "region", "black_mountain")).toBe(true);
  });

  it("keeps scopes and scope IDs independent -- a first in one settlement is still a first in another", () => {
    const registry = createNoveltyRegistry();
    expect(registry.recordAndCheckFirst("company", "settlement", "riverside")).toBe(true);
    expect(registry.recordAndCheckFirst("company", "settlement", "lakeview")).toBe(true);
    expect(registry.recordAndCheckFirst("company", "region", "riverside")).toBe(true);
  });

  it("does not confuse category boundaries -- the same scope ID under a different category is still novel", () => {
    const registry = createNoveltyRegistry();
    expect(registry.recordAndCheckFirst("technology", "world", "world")).toBe(true);
    expect(registry.recordAndCheckFirst("resources", "world", "world")).toBe(true);
  });

  it("getState/fromState round-trips: a restored registry still reports the same keys as already-seen (M20)", () => {
    const registry = createNoveltyRegistry();
    registry.recordAndCheckFirst("resources", "region", "black_mountain");
    registry.recordAndCheckFirst("company", "settlement", "riverside");

    const restored = NoveltyRegistry.fromState(registry.getState());
    expect(restored.has("resources", "region", "black_mountain")).toBe(true);
    expect(restored.has("company", "settlement", "riverside")).toBe(true);
    expect(restored.recordAndCheckFirst("resources", "region", "black_mountain")).toBe(false);
    expect(restored.size).toBe(registry.size);
  });
});
