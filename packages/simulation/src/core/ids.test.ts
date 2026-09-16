import { describe, expect, it } from "vitest";
import { IdGenerator, createIdGenerator } from "./ids.js";

describe("IdGenerator", () => {
  it("produces deterministic, zero-padded, monotonically increasing IDs", () => {
    const generator = createIdGenerator("company");
    expect(generator.next()).toBe("company_000000");
    expect(generator.next()).toBe("company_000001");
    expect(generator.next()).toBe("company_000002");
  });

  it("two generators for the same prefix from a fresh start produce the same sequence", () => {
    const a = createIdGenerator("region");
    const b = createIdGenerator("region");
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());
  });

  it("different prefixes never collide even at the same counter value", () => {
    const companies = createIdGenerator("company");
    const regions = createIdGenerator("region");
    expect(companies.next()).not.toBe(regions.next());
  });

  it("state roundtrips: fromState(getState()) continues the exact same sequence", () => {
    const generator = createIdGenerator("fact");
    generator.next();
    generator.next();
    const state = generator.getState();

    const restored = IdGenerator.fromState(state);
    expect(restored.next()).toBe(generator.next());
    expect(restored.next()).toBe(generator.next());
  });
});
