import { describe, expect, it } from "vitest";
import { classifyVersionCompatibility, migrateSchema } from "./migrations.js";

describe("classifyVersionCompatibility", () => {
  it("classifies a matching schemaVersion as compatible", () => {
    expect(classifyVersionCompatibility(1, 1)).toBe("compatible");
  });

  it("classifies a newer-than-supported schemaVersion as unsupported-newer", () => {
    expect(classifyVersionCompatibility(2, 1)).toBe("unsupported-newer");
  });

  it("classifies an older schemaVersion with no registered migration path as unsupported-legacy", () => {
    expect(classifyVersionCompatibility(0, 1)).toBe("unsupported-legacy");
  });

  it("classifies a missing/malformed schemaVersion as corrupted", () => {
    expect(classifyVersionCompatibility(undefined, 1)).toBe("corrupted");
    expect(classifyVersionCompatibility("1", 1)).toBe("corrupted");
    expect(classifyVersionCompatibility(-1, 1)).toBe("corrupted");
    expect(classifyVersionCompatibility(1.5, 1)).toBe("corrupted");
  });
});

describe("migrateSchema", () => {
  it("is an identity pass-through when sourceVersion already matches the target (SCHEMA_VERSION has never changed)", () => {
    const envelope = { versions: { schemaVersion: 1, contentVersion: 1, engineVersion: 1 }, worldState: { tick: 5 } };
    const result = migrateSchema(envelope, 1);
    expect(result.raw).toBe(envelope); // no migrator ran, so no new object was even constructed
    expect(result.steps).toEqual([]);
    expect(result.sourceVersion).toBe(1);
    expect(result.targetVersion).toBe(1);
  });

  it("running migrateSchema twice on the same input is deterministic (SAVE-008)", () => {
    const envelope = { versions: { schemaVersion: 1 }, worldState: {} };
    const first = migrateSchema(envelope, 1);
    const second = migrateSchema(envelope, 1);
    expect(first).toEqual(second);
  });

  it("throws for an unsupported-newer schemaVersion instead of silently truncating it", () => {
    const envelope = { versions: { schemaVersion: 2 }, worldState: {} };
    expect(() => migrateSchema(envelope, 1)).toThrow(/newer/);
  });

  it("throws for a corrupted/missing schemaVersion", () => {
    const envelope = { versions: {}, worldState: {} };
    expect(() => migrateSchema(envelope, 1)).toThrow(/schemaVersion/);
  });
});
