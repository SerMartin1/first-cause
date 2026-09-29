import {
  isDepositKnownToWorld,
  isSettlementActive,
  type WorldState,
} from "@first-cause/entities";
import {
  explainWhy,
  type SimulationFact,
  type CausalEdge,
  type WhyExplanation,
} from "@first-cause/causality";
import { getChronicle, type ChronicleEntry } from "@first-cause/chronicle";
import type { WorldRunner } from "../core/world-runner.js";
import {
  buildWorldSummaryReadModel,
  type WorldSummaryReadModel,
} from "./world-summary-read-model.js";
import {
  buildRegionSummaryReadModel,
  type RegionSummaryReadModel,
} from "./region-summary-read-model.js";
import {
  buildConnectionVisualProfile,
  buildRegionVisualProfileReadModel,
  type BuildRegionVisualProfileOptions,
  type ConnectionVisualRoute,
  type RegionVisualProfile,
} from "./region-visual-profile-read-model.js";
import {
  buildSettlementSummaryReadModel,
  type SettlementSummaryReadModel,
} from "./settlement-summary-read-model.js";
import {
  buildResourceDepositReadModels,
  type ResourceDepositReadModel,
} from "./resource-deposit-read-model.js";
import {
  buildTechnologySummaryReadModel,
  type TechnologySummaryReadModel,
} from "./technology-summary-read-model.js";

export interface WorldRegionView extends RegionSummaryReadModel {
  readonly latestExplainedChange:
    { readonly factId: string; readonly type: string; readonly tick: number } | undefined;
  readonly profile: RegionVisualProfile;
  readonly settlements: readonly SettlementSummaryReadModel[];
  readonly deposits: readonly ResourceDepositReadModel[];
  readonly technology: TechnologySummaryReadModel | undefined;
  readonly production: number;
  readonly companies: number;
  readonly housingPressure: number;
  readonly infrastructure: number;
}
export interface WorldConnectionView {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly level: number;
  readonly modes: readonly string[];
  readonly capacity: number;
  readonly disrupted: boolean;
  /** M21-VIS-R2: infrastruktura per połączenie, pogrupowana po rodzinie trasy (Atlas Spec v1.3 §28.6). */
  readonly routes: readonly ConnectionVisualRoute[];
  readonly utilization: number;
  readonly congestion: number;
}
export interface WorldFlowView {
  readonly id: string;
  readonly family: "trade" | "technology";
  readonly from: string;
  readonly to: string;
  readonly magnitude: number;
  readonly subjectId: string;
}
export interface WorldSnapshot {
  readonly causalDrivers?: readonly WorldCauseSummary[];
  readonly summary: WorldSummaryReadModel;
  readonly regions: readonly WorldRegionView[];
  readonly connections: readonly WorldConnectionView[];
  readonly flows: readonly WorldFlowView[];
}
export type WorldAnalysisScope =
  { readonly kind: "WORLD" } | { readonly kind: "REGION"; readonly regionId: string };
export interface WorldWhyContext {
  readonly scope: WorldAnalysisScope;
  readonly itemId: string;
  readonly itemKind: "cause" | "consequence" | "event" | "region";
  readonly regionId?: string;
}
export interface WorldCauseSummary {
  readonly id: string;
  readonly factId: string;
  readonly effectFactId: string;
  readonly type: string;
  readonly regionId: string;
  readonly effectRegionId: string;
  readonly tick: number;
  readonly contribution: number;
  readonly strength: number;
}
/** Recorded mechanisms only; strength ranks explanatory contribution, not forecast probability. */
export function selectWorldAnalysis(
  snapshot: WorldSnapshot,
  scope: WorldAnalysisScope,
  years: number,
) {
  return {
    scope,
    tick: snapshot.summary.currentTick,
    causes: (snapshot.causalDrivers ?? [])
      .filter(
        (c) =>
          c.tick < snapshot.summary.currentTick &&
          c.tick >= snapshot.summary.currentTick - years * 12 &&
          (scope.kind === "WORLD" || c.effectRegionId === scope.regionId),
      )
      .sort(
        (a, b) => b.strength - a.strength || b.tick - a.tick || a.id.localeCompare(b.id),
      )
      .slice(0, 5),
    // No world/regional forecast provider exists. Observed descendants are not projections.
    projectionStatus: "UNAVAILABLE" as const,
  };
}
export interface WorldView {
  readonly type: "WORLD_VIEW";
  readonly current: WorldSnapshot;
  readonly liveTick: number;
  readonly availableTicks: readonly number[];
  readonly baseline: WorldSnapshot | undefined;
  readonly events: readonly ChronicleEntry[];
  readonly speed: number;
}
export interface WorldWhyView {
  readonly context?: WorldWhyContext;
  readonly tick?: number;
  readonly type: "WORLD_WHY";
  readonly explanation: WhyExplanation;
  readonly facts: readonly SimulationFact[];
  readonly consequences: readonly SimulationFact[];
}
export type WorldRequest =
  | { readonly type: "GET_WORLD"; readonly years: number; readonly tick?: number }
  | { readonly type: "SET_WORLD_SPEED"; readonly speed: number }
  | { readonly type: "STEP_WORLD"; readonly ticks: number }
  | {
      readonly type: "GET_WORLD_WHY";
      readonly factId: string;
      readonly tick?: number;
      readonly context?: WorldWhyContext;
    };
export type WorldResponse = WorldView | WorldWhyView;
export interface WorldApi {
  getWorld(years: number, tick?: number): Promise<WorldView>;
  setSpeed(speed: number): Promise<WorldView>;
  step(ticks: number): Promise<WorldView>;
  explain(
    factId: string,
    tick?: number,
    context?: WorldWhyContext,
  ): Promise<WorldWhyView>;
}

/** Presentation projection only. No fictional geometry, urbanisation ratio or political state. */
export function buildWorldSnapshot(
  state: WorldState,
  facts: readonly SimulationFact[],
  /** Mapy z contentu dla profilu wizualnego (sektory, rodziny wydobycia, rodziny tras). */
  visualContent: BuildRegionVisualProfileOptions = {},
  edges: readonly CausalEdge[] = [],
): WorldSnapshot {
  const explainedIds = new Set(edges.map((e) => e.targetFactId));
  const latestChanges = new Map<string, SimulationFact>();
  for (const fact of facts)
    if (fact.tick < state.world.currentTick && explainedIds.has(fact.id))
      latestChanges.set(fact.location.regionId, fact);
  const regions = Object.keys(state.regions)
    .sort()
    .map((id): WorldRegionView => {
      const region = state.regions[id]!;
      const change = latestChanges.get(id);
      // SET-LIFECYCLE-001: Atlas i widok regionu pokazują tylko aktywne osady;
      // ABANDONED zostaje w WorldState jako historia (brak aktywnej morfologii).
      const settlements = [...region.settlements.settlementIds]
        .sort()
        .filter((sid) => {
          const settlement = state.settlements[sid];
          return settlement !== undefined && isSettlementActive(settlement);
        })
        .map((sid) => buildSettlementSummaryReadModel(state, sid)!);
      const companies = region.economy.companyIds
        .map((cid) => state.companies[cid]!)
        .filter((c) => c.status.active);
      return {
        ...buildRegionSummaryReadModel(state, id)!,
        latestExplainedChange: change
          ? { factId: change.id, type: change.type, tick: change.tick }
          : undefined,
        profile: buildRegionVisualProfileReadModel(state, id, visualContent)!,
        settlements,
        deposits: buildResourceDepositReadModels(state, id),
        technology: buildTechnologySummaryReadModel(state, id),
        production: companies.reduce((sum, c) => sum + c.production.outputLastTick, 0),
        companies: companies.length,
        housingPressure: settlements.reduce(
          (max, s) => Math.max(max, s.housing.pressure),
          0,
        ),
        infrastructure: region.connections.connectionIds.reduce(
          (sum, cid) => sum + state.connections[cid]!.infrastructure.level,
          0,
        ),
      };
    });
  const connections = Object.keys(state.connections)
    .sort()
    .map((id): WorldConnectionView => {
      const c = state.connections[id]!;
      const visual = buildConnectionVisualProfile(state, id, visualContent)!;
      return {
        id,
        from: c.regionAId,
        to: c.regionBId,
        level: c.infrastructure.level,
        modes: c.infrastructure.transportModes,
        capacity: c.infrastructure.capacity,
        disrupted: c.currentState.disrupted,
        routes: visual.routes,
        utilization: visual.utilization,
        congestion: visual.congestion,
      };
    });
  const flows: WorldFlowView[] = [];
  // Facts are emitted at the start-of-month tick; snapshot is the committed end of month.
  for (const fact of facts) {
    if (fact.tick !== state.world.currentTick - 1 || fact.type !== "trade_flow_active")
      continue;
    const c = connections.find((link) => fact.subject.entityId.startsWith(`${link.id}:`));
    if (!c || typeof fact.values.after !== "number") continue;
    const to = fact.location.regionId;
    if (to !== c.from && to !== c.to) continue;
    flows.push({
      id: fact.id,
      family: "trade",
      from: to === c.to ? c.from : c.to,
      to,
      magnitude: fact.values.after,
      subjectId: fact.subject.entityId.slice(c.id.length + 1),
    });
  }
  for (const region of regions) {
    for (const [id, discovery] of Object.entries(region.technology?.discoveries ?? {})) {
      if (!discovery.diffusionSource || !state.regions[discovery.diffusionSource])
        continue;
      flows.push({
        id: `${region.regionId}:${id}`,
        family: "technology",
        from: discovery.diffusionSource,
        to: region.regionId,
        magnitude: discovery.availability,
        subjectId: id,
      });
    }
  }
  const visibleFacts = new Map(
    facts.filter((f) => f.tick < state.world.currentTick).map((f) => [f.id, f]),
  );
  const causalDrivers = edges.flatMap((edge): WorldCauseSummary[] => {
    const source = visibleFacts.get(edge.sourceFactId),
      effect = visibleFacts.get(edge.targetFactId);
    if (!source || !effect || effect.tick < state.world.currentTick - 600) return [];
    return [
      {
        id: edge.id,
        factId: source.id,
        effectFactId: effect.id,
        type: source.type,
        regionId: source.location.regionId,
        effectRegionId: effect.location.regionId,
        tick: effect.tick,
        contribution: edge.contribution,
        strength: edge.strength,
      },
    ];
  });
  return {
    summary: buildWorldSummaryReadModel(state),
    regions,
    connections,
    flows,
    causalDrivers,
  };
}

/** Session-local monthly read-model history, explicitly outside canonical state/save/RNG.
 * TODO tuning: retain 50 years, the longest accepted comparison window. */
export class WorldViewHistory {
  private readonly snapshots = new Map<number, WorldSnapshot>();
  constructor(private readonly maxMonths = 600) {}
  record(snapshot: WorldSnapshot): void {
    const tick = snapshot.summary.currentTick;
    this.snapshots.set(tick, structuredClone(snapshot));
    for (const oldTick of this.snapshots.keys())
      if (oldTick < tick - this.maxMonths) this.snapshots.delete(oldTick);
  }
  view(
    liveTick: number,
    years: number,
    entries: readonly ChronicleEntry[],
    speed: number,
    tick = liveTick,
  ): WorldView {
    const current = this.snapshots.get(tick);
    if (!current) throw new Error("Historical snapshot unavailable");
    return {
      type: "WORLD_VIEW",
      current,
      liveTick,
      speed,
      availableTicks: [...this.snapshots.keys()].sort((a, b) => a - b),
      baseline: this.snapshots.get(tick - years * 12),
      events: getChronicle(entries, "STANDARD")
        .filter((e) => e.endTick < tick)
        .sort(
          (a, b) =>
            b.endTick - a.endTick ||
            b.significance.total - a.significance.total ||
            a.id.localeCompare(b.id),
        ),
    };
  }
}

/**
 * D3 (TECH-012, macierz ujawniania): fakt o złożu nieznanym światu
 * (UNKNOWN / SUSPECTED w bieżącym stanie) nie może zdradzić ID złoża --
 * ID contentu/fixture'a zwykle zawiera typ zasobu. Typ faktu i region
 * pozostają (odpowiadają temu, co SUSPECTED ujawnia: „w regionie mogą
 * występować zasoby”).
 */
export const UNDISCLOSED_DEPOSIT_ID = "undisclosed";

function discloseFact(state: WorldState, fact: SimulationFact): SimulationFact {
  if (fact.subject.entityType !== "resourceDeposit") return fact;
  const deposit = state.resourceDeposits[fact.subject.entityId];
  if (deposit && isDepositKnownToWorld(deposit)) return fact;
  return { ...fact, subject: { ...fact.subject, entityId: UNDISCLOSED_DEPOSIT_ID } };
}

export function buildWorldWhyView(
  runner: WorldRunner,
  factId: string,
  tick = runner.tick,
  context?: WorldWhyContext,
): WorldWhyView {
  const facts = runner.facts.filter((f) => f.tick < tick);
  if (!facts.some((f) => f.id === factId)) throw new Error("Unknown fact at this time");
  const visible = new Set(facts.map((f) => f.id));
  const edges = runner.causalEdges.filter(
    (e) => visible.has(e.sourceFactId) && visible.has(e.targetFactId),
  );
  const explanation = explainWhy({
    targetFactId: factId,
    facts,
    edges,
    architectInfluenceByFactId: runner.architectInfluence,
  });
  const ids = new Set([
    factId,
    ...explanation.primaryCauses.map((c) => c.factId),
    ...explanation.significantCauses.map((c) => c.factId),
    ...explanation.limitingFactors.map((c) => c.factId),
  ]);
  const descendants = new Set(
    edges.filter((e) => e.sourceFactId === factId).map((e) => e.targetFactId),
  );
  return {
    type: "WORLD_WHY",
    ...(context ? { context } : {}),
    tick,
    explanation,
    facts: facts
      .filter((f) => ids.has(f.id))
      .map((f) => discloseFact(runner.worldState, f)),
    consequences: facts
      .filter((f) => descendants.has(f.id))
      .slice(0, 5)
      .map((f) => discloseFact(runner.worldState, f)),
  };
}
