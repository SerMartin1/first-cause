import { describe, expect, it } from "vitest";
import {
  createResourceDeposit,
  createTechnologyState,
  setDiscoveryState,
  type DepositDiscoveryStatus,
  type ResourceDeposit,
  type TechnologyState,
} from "@first-cause/entities";
import {
  ResourceDiscoveryRulesSchema,
  type ResourceDiscoveryRules,
} from "@first-cause/content";
import { discoverDeposit } from "./deposit-lifecycle.js";
import { evaluateNaturalDepositDiscovery } from "./natural-discovery.js";

/**
 * D3 / model A + a (Canonical Decisions TECH-012). Reguły jak w
 * `content/resources/iron_ore.json`, ale podane tu jawnie -- test dotyczy
 * silnika, który zna tylko strukturę reguł, nie konkretny zasób.
 */
const RULES: ResourceDiscoveryRules = ResourceDiscoveryRulesSchema.parse({
  detection: [
    { discoveryId: "min_001", targetStatus: "DISCOVERED", maxDepth: 30 },
    { discoveryId: "min_001", targetStatus: "SUSPECTED", maxDepth: 150 },
    { discoveryId: "min_008", targetStatus: "SUSPECTED", maxDepth: 600 },
    {
      discoveryId: "min_011",
      targetStatus: "ASSESSED",
      minDepth: 150,
      fromStatuses: ["SUSPECTED", "DISCOVERED"],
    },
  ],
});

function deposit(id: string, depth: number | undefined): ResourceDeposit {
  return createResourceDeposit({
    id,
    resourceDefinitionId: "ore",
    regionId: "region_a",
    initialQuantity: 1000,
    renewable: false,
    ...(depth !== undefined ? { depth } : {}),
  });
}

function withStatus(d: ResourceDeposit, status: DepositDiscoveryStatus): ResourceDeposit {
  return discoverDeposit(d, { tick: 0, targetStatus: status, confidence: 1 }).deposit;
}

function technology(availableDiscoveryIds: readonly string[]): TechnologyState {
  let state = createTechnologyState({ id: "technology_a", regionId: "region_a" });
  for (const id of availableDiscoveryIds) {
    state = setDiscoveryState(state, id, { status: "AVAILABLE", availability: 1 });
  }
  return state;
}

function run(d: ResourceDeposit, available: readonly string[], rules = RULES) {
  return evaluateNaturalDepositDiscovery({
    deposit: d,
    rules,
    technologyState: technology(available),
    tick: 7,
  });
}

describe("natural deposit discovery -- technology gates (D3, A + a)", () => {
  it("A: UNKNOWN without MIN-001 stays UNKNOWN, no facts", () => {
    const result = run(deposit("d", 10), []);
    expect(result.deposit.discovery.status).toBe("UNKNOWN");
    expect(result.facts).toEqual([]);
  });

  it("B: UNKNOWN + MIN-001 -> SUSPECTED for a deeper deposit", () => {
    const result = run(deposit("d", 100), ["min_001"]);
    expect(result.deposit.discovery.status).toBe("SUSPECTED");
    expect(result.facts.map((f) => f.type)).toEqual(["resource_suspected"]);
  });

  it("B/U: UNKNOWN + MIN-001 -> DISCOVERED directly for an explicit surface depth (VS §31), without a fake SUSPECTED step", () => {
    const result = run(deposit("d", 10), ["min_001"]);
    expect(result.deposit.discovery.status).toBe("DISCOVERED");
    expect(result.facts.map((f) => [f.type, f.values.before])).toEqual([
      ["resource_discovered", "UNKNOWN"],
    ]);
    expect(result.enablingDiscoveryIds).toEqual(["min_001"]);
  });

  it("U: explicit depth 0 is a real surface deposit and qualifies", () => {
    expect(run(deposit("d", 0), ["min_001"]).deposit.discovery.status).toBe("DISCOVERED");
  });

  it("T: missing depth is NOT interpreted as a surface deposit -- no natural transition at all", () => {
    const result = run(deposit("d", undefined), ["min_001", "min_008", "min_011"]);
    expect(result.deposit.discovery.status).toBe("UNKNOWN");
    expect(result.facts).toEqual([]);
  });

  it("C: SUSPECTED without the next gate stays SUSPECTED (MIN-001 alone never confirms a deep deposit)", () => {
    const suspected = withStatus(deposit("d", 100), "SUSPECTED");
    const result = run(suspected, ["min_001"]);
    expect(result.deposit).toBe(suspected);
    expect(result.facts).toEqual([]);
  });

  it("W: MIN-008 keeps its catalog meaning -- extends UNKNOWN -> SUSPECTED deeper, never SUSPECTED -> DISCOVERED", () => {
    const deep = run(deposit("d", 400), ["min_001"]);
    expect(deep.deposit.discovery.status).toBe("UNKNOWN"); // poza zasięgiem MIN-001
    const withProspecting = run(deposit("d", 400), ["min_001", "min_008"]);
    expect(withProspecting.deposit.discovery.status).toBe("SUSPECTED");

    const suspected = withStatus(deposit("d", 100), "SUSPECTED");
    const result = run(suspected, ["min_001", "min_008"]);
    expect(result.deposit.discovery.status).toBe("SUSPECTED");
    expect(result.facts).toEqual([]);
  });

  it("V: a deep deposit is not DISCOVERED by MIN-001 (at most SUSPECTED, and only within MIN-001 reach)", () => {
    expect(run(deposit("d", 31), ["min_001"]).deposit.discovery.status).toBe("SUSPECTED");
    expect(run(deposit("d", 1000), ["min_001"]).deposit.discovery.status).toBe("UNKNOWN");
  });

  it("D: SUSPECTED + MIN-011 (deep) -> DISCOVERED -> ASSESSED in one tick, keeping the real causal chain", () => {
    const suspected = withStatus(deposit("d", 400), "SUSPECTED");
    const result = run(suspected, ["min_001", "min_008", "min_011"]);
    expect(result.deposit.discovery.status).toBe("ASSESSED");
    expect(result.facts.map((f) => [f.type, f.values.before, f.values.after])).toEqual([
      ["resource_discovered", "SUSPECTED", "DISCOVERED"],
      ["resource_assessed", "DISCOVERED", "ASSESSED"],
    ]);
    expect(result.causalLinks).toContainEqual(
      expect.objectContaining({
        targetIndex: 1,
        source: { kind: "sameBatch", index: 0 },
      }),
    );
  });

  it("E: DISCOVERED without MIN-011 stays DISCOVERED", () => {
    const discovered = withStatus(deposit("d", 200), "DISCOVERED");
    const result = run(discovered, ["min_001", "min_008"]);
    expect(result.deposit).toBe(discovered);
    expect(result.facts).toEqual([]);
  });

  it("F: DISCOVERED (deep) + MIN-011 -> ASSESSED with a single fact", () => {
    const discovered = withStatus(deposit("d", 200), "DISCOVERED");
    const result = run(discovered, ["min_011"]);
    expect(result.deposit.discovery.status).toBe("ASSESSED");
    expect(result.facts.map((f) => f.type)).toEqual(["resource_assessed"]);
  });

  it("F: MIN-011 does not assess a shallow deposit, and never reaches an UNKNOWN one directly", () => {
    const shallow = withStatus(deposit("d", 10), "DISCOVERED");
    expect(run(shallow, ["min_011"]).deposit.discovery.status).toBe("DISCOVERED");
    expect(run(deposit("d", 1000), ["min_011"]).deposit.discovery.status).toBe("UNKNOWN");
  });

  it("chains within one tick: UNKNOWN deep deposit + MIN-001 + MIN-011 -> SUSPECTED -> DISCOVERED -> ASSESSED", () => {
    const result = run(deposit("d", 150), ["min_001", "min_011"]);
    expect(result.facts.map((f) => f.type)).toEqual([
      "resource_suspected",
      "resource_discovered",
      "resource_assessed",
    ]);
    expect(result.enablingDiscoveryIds).toEqual(["min_001", "min_011", "min_011"]);
  });

  it("G: status never regresses and repeating the evaluation emits nothing (O)", () => {
    const first = run(deposit("d", 10), ["min_001"]);
    const again = run(first.deposit, ["min_001", "min_008", "min_011"]);
    expect(again.deposit).toBe(first.deposit);
    expect(again.facts).toEqual([]);
    const assessed = withStatus(deposit("d", 10), "ASSESSED");
    expect(run(assessed, ["min_001"]).deposit.discovery.status).toBe("ASSESSED");
  });

  it("X: every qualifying deposit reacts identically and deterministically to the same gate", () => {
    const deposits = [
      deposit("d1", 5),
      deposit("d2", 25),
      deposit("d3", 90),
      deposit("d4", 900),
    ];
    const outcome = () =>
      deposits.map((d) => {
        const r = run(d, ["min_001"]);
        return [r.deposit.discovery.status, r.facts.map((f) => f.type)];
      });
    expect(outcome()).toEqual([
      ["DISCOVERED", ["resource_discovered"]],
      ["DISCOVERED", ["resource_discovered"]],
      ["SUSPECTED", ["resource_suspected"]],
      ["UNKNOWN", []],
    ]);
    expect(outcome()).toEqual(outcome());
  });

  it("a resource without discoveryRules is never naturally discovered", () => {
    const result = evaluateNaturalDepositDiscovery({
      deposit: deposit("d", 0),
      rules: undefined,
      technologyState: technology(["min_001"]),
      tick: 1,
    });
    expect(result.deposit.discovery.status).toBe("UNKNOWN");
  });

  it("a KNOWN-but-not-yet-AVAILABLE discovery does not open the gate", () => {
    const state = setDiscoveryState(technology([]), "min_001", { status: "KNOWN" });
    const result = evaluateNaturalDepositDiscovery({
      deposit: deposit("d", 0),
      rules: RULES,
      technologyState: state,
      tick: 1,
    });
    expect(result.deposit.discovery.status).toBe("UNKNOWN");
  });
});

describe("ResourceDiscoveryRulesSchema (content contract)", () => {
  it("rejects minDepth > maxDepth and fromStatuses that would regress", () => {
    expect(
      ResourceDiscoveryRulesSchema.safeParse({
        detection: [
          { discoveryId: "x", targetStatus: "SUSPECTED", minDepth: 10, maxDepth: 5 },
        ],
      }).success,
    ).toBe(false);
    expect(
      ResourceDiscoveryRulesSchema.safeParse({
        detection: [
          { discoveryId: "x", targetStatus: "SUSPECTED", fromStatuses: ["DISCOVERED"] },
        ],
      }).success,
    ).toBe(false);
  });

  it("defaults to no detection rules", () => {
    expect(ResourceDiscoveryRulesSchema.parse(undefined)).toEqual({ detection: [] });
  });
});
