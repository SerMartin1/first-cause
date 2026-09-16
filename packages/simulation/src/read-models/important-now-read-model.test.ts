import { describe, expect, it } from "vitest";
import { createWorld, createWorldState } from "@first-cause/entities";
import { buildImportantNowReadModel } from "./important-now-read-model.js";

describe("buildImportantNowReadModel", () => {
  it("returns an empty list: no producing system (Chronicle/shortages/discoveries/migration/interventions) exists yet", () => {
    const world = createWorld({
      id: "world_001",
      seed: 1,
      name: "W",
      configuration: { regionCount: 0, worldSizePreset: "test" },
    });
    const state = createWorldState({ world });

    expect(buildImportantNowReadModel(state)).toEqual([]);
  });
});
