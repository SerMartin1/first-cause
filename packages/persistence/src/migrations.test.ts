import { describe, expect, it } from "vitest";
import { classifyVersionCompatibility, migrateSchema, migrateV6ToV7, migrateV7ToV8 } from "./migrations.js";

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

describe("P14: migrateV6ToV7", () => {
  it("sets ticksWithoutOffers = 0 only with a trace of an offer in the saved tick; purely, no history reconstruction", () => {
    const good = (extra: Record<string, unknown>) => ({
      supply: 0,
      demand: 5,
      inventory: 0,
      localPrice: 4,
      importDemand: 0,
      exportSupply: 0,
      shortageSeverity: 1,
      pricePressure: 0,
      ...extra,
    });
    const raw = {
      versions: { schemaVersion: 6, contentVersion: 1, engineVersion: 7 },
      worldState: {
        worldState: {
          markets: {
            m: {
              id: "m",
              regionId: "r",
              goods: {
                stocked: good({ inventory: 3 }),
                bought: good({ householdPurchased: 2 }),
                none: good({}),
              },
            },
          },
        },
      },
    };
    const frozen = JSON.stringify(raw);
    const migrated = migrateV6ToV7(raw) as typeof raw;
    expect(JSON.stringify(raw)).toBe(frozen);
    expect(migrated.versions.schemaVersion).toBe(7);
    const goods = migrated.worldState.worldState.markets.m.goods as Record<string, Record<string, unknown>>;
    expect(goods.stocked!.ticksWithoutOffers).toBe(0);
    expect(goods.bought!.ticksWithoutOffers).toBe(0);
    expect("ticksWithoutOffers" in goods.none!).toBe(false);
    expect(goods.none!.localPrice).toBe(4);
  });
});

describe("etap 4B: migrateV7ToV8", () => {
  it("adds investmentReserve = 0, keeps cash and an existing reserve, purely", () => {
    const raw = {
      versions: { schemaVersion: 7, contentVersion: 1, engineVersion: 8 },
      worldState: {
        worldState: {
          companies: {
            a: { id: "a", finance: { cash: 120, retainedEarnings: 5 } },
            b: { id: "b", finance: { cash: 40, retainedEarnings: 0, investmentReserve: 30 } },
          },
        },
      },
    };
    const frozen = JSON.stringify(raw);
    const migrated = migrateV7ToV8(raw) as typeof raw;
    expect(JSON.stringify(raw)).toBe(frozen);
    expect(migrated.versions.schemaVersion).toBe(8);
    const companies = migrated.worldState.worldState.companies as Record<
      string,
      { finance: Record<string, number> }
    >;
    expect(companies.a!.finance).toEqual({ cash: 120, retainedEarnings: 5, investmentReserve: 0 });
    expect(companies.b!.finance.investmentReserve).toBe(30);
  });
});
