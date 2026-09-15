import { describe, expect, it } from "vitest";
import { loadResourceDefinitions } from "./load-resource-definitions.js";

const validDefinition = {
  id: "iron_ore",
  nameKey: "resource.iron_ore.name",
  category: "mineral",
  finite: true,
  phase: "VS",
};

describe("loadResourceDefinitions", () => {
  it("accepts a valid definition and builds a registry", () => {
    const result = loadResourceDefinitions([validDefinition]);

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.registry?.size).toBe(1);
    expect(result.registry?.get("iron_ore")?.category).toBe("mineral");
  });

  it("rejects a definition with an invalid content ID", () => {
    const invalidDefinition = { ...validDefinition, id: "Iron Ore" };

    const result = loadResourceDefinitions([invalidDefinition]);

    expect(result.ok).toBe(false);
    expect(result.registry).toBeUndefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/snake_case/);
  });

  it("rejects a definition missing required fields", () => {
    const result = loadResourceDefinitions([{ id: "coal" }]);

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects duplicate content IDs across otherwise-valid definitions", () => {
    const result = loadResourceDefinitions([validDefinition, validDefinition]);

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("Duplicate"))).toBe(true);
  });
});
