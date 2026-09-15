import { describe, expect, it, vi } from "vitest";
import { DefinitionRegistry } from "./definition-registry.js";

interface Fixture {
  readonly id: string;
  readonly value: number;
}

describe("DefinitionRegistry", () => {
  it("detaches input and deeply freezes references from get and all", () => {
    const input = { id: "iron_ore", nested: { tags: ["mineral"] } };
    const registry = DefinitionRegistry.fromDefinitions([input]);
    input.id = "changed";
    input.nested.tags.push("changed");
    const stored = registry.get("iron_ore")!;
    expect(() => {
      stored.id = "changed";
    }).toThrow();
    expect(() => {
      stored.nested.tags.push("changed");
    }).toThrow();
    expect(() => {
      registry.all()[0]!.nested.tags[0] = "changed";
    }).toThrow();
    expect(registry.get("iron_ore")).toEqual({
      id: "iron_ore",
      nested: { tags: ["mineral"] },
    });
    expect(registry.has("changed")).toBe(false);
  });
  it("orders technical IDs independently of locale and input order", () => {
    const localeCompare = vi
      .spyOn(String.prototype, "localeCompare")
      .mockImplementation(() => {
        throw new Error("Locale collation must not be used");
      });
    try {
      for (const ids of [
        ["aa", "ab", "a_a"],
        ["ab", "a_a", "aa"],
        ["a_a", "aa", "ab"],
      ]) {
        expect(
          DefinitionRegistry.fromDefinitions(ids.map((id) => ({ id })))
            .all()
            .map((item) => item.id),
        ).toEqual(["a_a", "aa", "ab"]);
      }
    } finally {
      localeCompare.mockRestore();
    }
  });
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
