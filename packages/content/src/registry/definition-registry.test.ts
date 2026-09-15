import { describe, expect, it } from "vitest";
import { DefinitionRegistry } from "./definition-registry.js";

interface Fixture {
  readonly id: string;
  readonly value: number;
}

describe("DefinitionRegistry", () => {
  it("looks up definitions by id", () => {
    const registry = DefinitionRegistry.fromDefinitions<Fixture>([
      { id: "b", value: 2 },
      { id: "a", value: 1 },
    ]);

    expect(registry.get("a")?.value).toBe(1);
    expect(registry.has("b")).toBe(true);
    expect(registry.has("missing")).toBe(false);
  });

  it("returns all definitions in stable, canonical (sorted) order", () => {
    const registry = DefinitionRegistry.fromDefinitions<Fixture>([
      { id: "zebra", value: 3 },
      { id: "apple", value: 1 },
      { id: "mango", value: 2 },
    ]);

    expect(registry.all().map((definition) => definition.id)).toEqual([
      "apple",
      "mango",
      "zebra",
    ]);
  });

  it("throws on duplicate IDs instead of silently overwriting", () => {
    expect(() =>
      DefinitionRegistry.fromDefinitions<Fixture>([
        { id: "a", value: 1 },
        { id: "a", value: 2 },
      ]),
    ).toThrow(/Duplicate content ID/);
  });
});
