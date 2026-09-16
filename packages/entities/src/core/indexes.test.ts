import { describe, expect, it } from "vitest";
import { groupIdsBy, toById } from "./indexes.js";

interface Item {
  readonly id: string;
  readonly regionId: string | undefined;
}

describe("groupIdsBy", () => {
  it("groups items by key and sorts both keys and each group's members", () => {
    const items: Item[] = [
      { id: "c", regionId: "r2" },
      { id: "a", regionId: "r1" },
      { id: "b", regionId: "r1" },
    ];

    const grouped = groupIdsBy(
      items,
      (item) => item.regionId,
      (item) => item.id,
    );

    expect([...grouped.keys()]).toEqual(["r1", "r2"]);
    expect(grouped.get("r1")).toEqual(["a", "b"]);
    expect(grouped.get("r2")).toEqual(["c"]);
  });

  it("skips items whose key is undefined", () => {
    const items: Item[] = [{ id: "a", regionId: undefined }];
    const grouped = groupIdsBy(
      items,
      (item) => item.regionId,
      (item) => item.id,
    );
    expect(grouped.size).toBe(0);
  });

  it("gives the same result regardless of input order (SIM-005)", () => {
    const forward: Item[] = [
      { id: "a", regionId: "r1" },
      { id: "b", regionId: "r1" },
      { id: "c", regionId: "r2" },
    ];
    const reversed = [...forward].reverse();

    const a = groupIdsBy(
      forward,
      (item) => item.regionId,
      (item) => item.id,
    );
    const b = groupIdsBy(
      reversed,
      (item) => item.regionId,
      (item) => item.id,
    );

    expect([...a.entries()]).toEqual([...b.entries()]);
  });
});

describe("toById", () => {
  it("indexes items by id", () => {
    const byId = toById([{ id: "a" }, { id: "b" }]);
    expect(byId.a).toEqual({ id: "a" });
    expect(byId.b).toEqual({ id: "b" });
  });
});
