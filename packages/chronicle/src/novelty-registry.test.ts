import { describe, expect, it } from "vitest";
import { createNoveltyRegistry } from "./novelty-registry.js";

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
});
