import { describe, expect, it } from "vitest";
import {
  createRegion,
  createRegionGeography,
  createResourceDeposit,
  createWorld,
  createWorldState,
} from "@first-cause/entities";
import { discoverDeposit } from "../systems/resources/deposit-lifecycle.js";
import { buildResourceDepositReadModels } from "./resource-deposit-read-model.js";

function buildFixtureState(deposits: Parameters<typeof createResourceDeposit>[0][]) {
  const geography = createRegionGeography({
    terrain: "mountains",
    climate: "continental",
    area: 10,
    fertility: 0.1,
    waterAccess: false,
    coastal: false,
    elevationClass: "highland",
  });
  const world = createWorld({
    id: "world_001",
    seed: 1,
    name: "W",
    configuration: { regionCount: 1, worldSizePreset: "test" },
  });
  const region = createRegion({
    id: "region_001",
    worldId: world.id,
    continentId: "continent_001",
    name: "Region",
    geography,
  });

  return createWorldState({
    world,
    continents: [
      { id: "continent_001", worldId: world.id, name: "Main", regionIds: [], tags: [] },
    ],
    regions: [region],
    resourceDeposits: deposits.map((input) => createResourceDeposit(input)),
  });
}

function discovered(state: ReturnType<typeof buildFixtureState>): typeof state {
  return {
    ...state,
    resourceDeposits: Object.fromEntries(
      Object.entries(state.resourceDeposits).map(([id, deposit]) => [
        id,
        discoverDeposit(deposit, { tick: 1, targetStatus: "DISCOVERED", confidence: 1 })
          .deposit,
      ]),
    ),
  };
}

describe("buildResourceDepositReadModels -- respects TECH-009/TECH-010 discovery boundary", () => {
  it("A/J: an UNKNOWN deposit exists physically but reveals nothing to the player -- not even its resource type", () => {
    const state = buildFixtureState([
      {
        id: "deposit_001",
        resourceDefinitionId: "iron_ore",
        regionId: "region_001",
        initialQuantity: 5000,
        renewable: false,
      },
    ]);

    expect(state.resourceDeposits.deposit_001!.stock.quantity).toBe(5000);
    expect(buildResourceDepositReadModels(state, "region_001")).toEqual([]);
  });

  it("J: a SUSPECTED deposit is still not revealed (only DISCOVERED/ASSESSED are world knowledge)", () => {
    const state = buildFixtureState([
      {
        id: "deposit_001",
        resourceDefinitionId: "iron_ore",
        regionId: "region_001",
        initialQuantity: 5000,
        renewable: false,
      },
    ]);
    const suspected = {
      ...state,
      resourceDeposits: {
        deposit_001: discoverDeposit(state.resourceDeposits.deposit_001!, {
          tick: 1,
          targetStatus: "SUSPECTED",
          confidence: 0.3,
        }).deposit,
      },
    };
    expect(buildResourceDepositReadModels(suspected, "region_001")).toEqual([]);
  });

  it("reveals quantity once a deposit is DISCOVERED", () => {
    const state = buildFixtureState([
      {
        id: "deposit_001",
        resourceDefinitionId: "iron_ore",
        regionId: "region_001",
        initialQuantity: 5000,
        renewable: false,
      },
    ]);

    const deposit = state.resourceDeposits.deposit_001!;
    const discovered = discoverDeposit(deposit, {
      tick: 1,
      targetStatus: "DISCOVERED",
      confidence: 0.9,
    }).deposit;
    const revealedState = {
      ...state,
      resourceDeposits: { ...state.resourceDeposits, deposit_001: discovered },
    };

    const [model] = buildResourceDepositReadModels(revealedState, "region_001");
    expect(model?.discoveryStatus).toBe("DISCOVERED");
    expect(model?.quantity).toBe(5000);
  });

  it("returns [] for an unknown region", () => {
    const state = buildFixtureState([]);
    expect(buildResourceDepositReadModels(state, "nope")).toEqual([]);
  });

  it("returns entries sorted by deposit ID regardless of region insertion order", () => {
    const state = buildFixtureState([
      {
        id: "deposit_b",
        resourceDefinitionId: "grain",
        regionId: "region_001",
        initialQuantity: 100,
        renewable: true,
        renewableState: {
          regenerationRate: 0.1,
          sustainableYield: 10,
          carryingCapacity: 200,
        },
      },
      {
        id: "deposit_a",
        resourceDefinitionId: "timber",
        regionId: "region_001",
        initialQuantity: 100,
        renewable: true,
        renewableState: {
          regenerationRate: 0.1,
          sustainableYield: 10,
          carryingCapacity: 200,
        },
      },
    ]);

    const models = buildResourceDepositReadModels(discovered(state), "region_001");
    expect(models.map((m) => m.depositId)).toEqual(["deposit_a", "deposit_b"]);
  });
});
