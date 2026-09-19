import { describe, expect, it } from "vitest";
import { createTechnologyState, setDiscoveryState } from "@first-cause/entities";
import {
  computeDiffusionPressure,
  growAvailability,
  AVAILABILITY_THRESHOLD_TODO_TUNING,
} from "./diffusion.js";

describe("computeDiffusionPressure (technology diffusion test)", () => {
  const discoveryIds = ["d1"];

  it("is empty for a region with no connections", () => {
    const result = computeDiffusionPressure("r1", [], {}, discoveryIds);
    expect(result).toEqual({});
  });

  it("is 0/absent for a region connected only to regions that don't have the discovery available", () => {
    const neighborState = createTechnologyState({ id: "t2", regionId: "r2" });
    const result = computeDiffusionPressure(
      "r1",
      ["r2"],
      { r2: neighborState },
      discoveryIds,
    );
    expect(result.d1).toBeUndefined();
  });

  it("is > 0 for a region connected to a region where the discovery is AVAILABLE", () => {
    const neighborState = setDiscoveryState(
      createTechnologyState({ id: "t2", regionId: "r2" }),
      "d1",
      { status: "AVAILABLE" },
    );
    const result = computeDiffusionPressure(
      "r1",
      ["r2"],
      { r2: neighborState },
      discoveryIds,
    );
    expect(result.d1?.pressure).toBeGreaterThan(0);
    expect(result.d1?.sourceRegionId).toBe("r2");
  });

  it("also counts ADOPTED neighbors, and scales pressure by the fraction of contributing neighbors", () => {
    const withIt = setDiscoveryState(
      createTechnologyState({ id: "t2", regionId: "r2" }),
      "d1",
      { status: "ADOPTED" },
    );
    const withoutIt = createTechnologyState({ id: "t3", regionId: "r3" });
    const result = computeDiffusionPressure(
      "r1",
      ["r2", "r3"],
      { r2: withIt, r3: withoutIt },
      discoveryIds,
    );
    expect(result.d1?.pressure).toBeCloseTo(0.5);
    expect(result.d1?.sourceRegionId).toBe("r2");
  });

  it("excludes the region itself even if it appears in connectedRegionIds", () => {
    const selfState = setDiscoveryState(
      createTechnologyState({ id: "t1", regionId: "r1" }),
      "d1",
      { status: "AVAILABLE" },
    );
    const result = computeDiffusionPressure(
      "r1",
      ["r1"],
      { r1: selfState },
      discoveryIds,
    );
    expect(result).toEqual({});
  });
});

describe("growAvailability", () => {
  it("only affects KNOWN discoveries", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    technologyState = setDiscoveryState(technologyState, "unknown_d", {}); // zostaje UNKNOWN
    technologyState = setDiscoveryState(technologyState, "available_d", {
      status: "AVAILABLE",
      availability: 0.9,
    });

    const result = growAvailability(technologyState, {});

    expect(result.technologyState.discoveries.unknown_d?.availability).toBe(0);
    expect(result.technologyState.discoveries.available_d?.availability).toBe(0.9);
    expect(result.facts).toEqual([]);
  });

  it("grows availability organically with no diffusion pressure, without crossing the threshold in one tick from 0 (discovery ≠ availability)", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    technologyState = setDiscoveryState(technologyState, "d1", { status: "KNOWN" });

    const result = growAvailability(technologyState, {});

    const entry = result.technologyState.discoveries.d1!;
    expect(entry.status).toBe("KNOWN");
    expect(entry.availability).toBeGreaterThan(0);
    expect(entry.availability).toBeLessThan(AVAILABILITY_THRESHOLD_TODO_TUNING);
    expect(result.facts).toEqual([]); // brak pressure -> brak discovery_diffused; poniżej progu -> brak discovery_became_available
  });

  it("transitions to AVAILABLE and emits a fact once the threshold is crossed", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    technologyState = setDiscoveryState(technologyState, "d1", {
      status: "KNOWN",
      availability: AVAILABILITY_THRESHOLD_TODO_TUNING - 0.001,
    });

    const result = growAvailability(technologyState, {});

    expect(result.technologyState.discoveries.d1?.status).toBe("AVAILABLE");
    expect(result.facts).toEqual([
      {
        type: "discovery_became_available",
        subject: { entityType: "discovery", entityId: "d1" },
        location: { regionId: "r1" },
        values: { before: "KNOWN", after: "AVAILABLE" },
      },
    ]);
  });

  it("emits discovery_diffused when diffusion pressure contributes, and records the diffusion source", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    technologyState = setDiscoveryState(technologyState, "d1", { status: "KNOWN" });

    const result = growAvailability(technologyState, {
      d1: { pressure: 1, sourceRegionId: "r2" },
    });

    expect(result.technologyState.discoveries.d1?.diffusionSource).toBe("r2");
    expect(
      result.facts.some((f) => f.type === "discovery_diffused"),
    ).toBe(true);
  });

  it("availability ≠ adoption: crossing AVAILABLE never touches any adoption axis", () => {
    let technologyState = createTechnologyState({ id: "t1", regionId: "r1" });
    technologyState = setDiscoveryState(technologyState, "d1", {
      status: "KNOWN",
      availability: AVAILABILITY_THRESHOLD_TODO_TUNING - 0.001,
    });

    const result = growAvailability(technologyState, {});
    const entry = result.technologyState.discoveries.d1!;

    expect(entry.status).toBe("AVAILABLE");
    expect(entry.industryAdoption).toBe(0);
    expect(entry.populationAccess).toBe(0);
    expect(entry.institutionalAdoption).toBe(0);
  });
});
