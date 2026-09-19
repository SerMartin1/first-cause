import { describe, expect, it } from "vitest";
import {
  completeArchitectIntervention,
  createArchitectInterventionInstance,
  failArchitectIntervention,
  type CreateArchitectInterventionInstanceInput,
} from "./intervention.js";

const cost = { base: 15, magnitude: 0, duration: 1, scope: 1, naturalness: 1, total: 15 };

function buildInput(
  overrides?: Partial<CreateArchitectInterventionInstanceInput>,
): CreateArchitectInterventionInstanceInput {
  return {
    id: "intervention_001",
    definitionId: "reveal_resource_deposit",
    createdTick: 10,
    target: { scopeType: "entity", entityIds: ["deposit_001"] },
    parameters: {},
    cost,
    ...overrides,
  };
}

describe("createArchitectInterventionInstance", () => {
  it("starts PLANNED, with no appliedTick and no rootFactIds yet", () => {
    const instance = createArchitectInterventionInstance(buildInput());

    expect(instance.status).toBe("PLANNED");
    expect(instance.appliedTick).toBeUndefined();
    expect(instance.rootFactIds).toEqual([]);
  });

  it("rejects an empty target.entityIds", () => {
    expect(() =>
      createArchitectInterventionInstance(
        buildInput({ target: { scopeType: "entity", entityIds: [] } }),
      ),
    ).toThrow();
  });

  it("rejects a negative cost.total", () => {
    expect(() =>
      createArchitectInterventionInstance(buildInput({ cost: { ...cost, total: -1 } })),
    ).toThrow();
  });
});

describe("completeArchitectIntervention", () => {
  it("moves to COMPLETED with appliedTick and rootFactIds set (ARCH-007)", () => {
    const instance = createArchitectInterventionInstance(buildInput());
    const completed = completeArchitectIntervention(instance, 10, ["fact_10_0"]);

    expect(completed.status).toBe("COMPLETED");
    expect(completed.appliedTick).toBe(10);
    expect(completed.rootFactIds).toEqual(["fact_10_0"]);
  });

  it("refuses to complete without at least one root fact (ARCH-007: every applied intervention creates one)", () => {
    const instance = createArchitectInterventionInstance(buildInput());
    expect(() => completeArchitectIntervention(instance, 10, [])).toThrow();
  });
});

describe("failArchitectIntervention", () => {
  it("moves to FAILED with appliedTick set, no rootFactIds required (a technical failure, not ARCH-009's no-effect)", () => {
    const instance = createArchitectInterventionInstance(buildInput());
    const failed = failArchitectIntervention(instance, 10);

    expect(failed.status).toBe("FAILED");
    expect(failed.appliedTick).toBe(10);
    expect(failed.rootFactIds).toEqual([]);
  });
});
