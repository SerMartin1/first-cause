import type { WorldState } from "@first-cause/entities";
import {
  createCausalEdgeStore,
  createFactStore,
  pruneCausalMemory,
  type CausalEdge,
  type CausalEdgeStore,
  type FactStore,
  type SimulationFact,
} from "@first-cause/causality";
import {
  aggregateCandidates,
  buildChronicleCandidates,
  collectHistoricalAnchorFactIds,
  createActiveProcessRegistry,
  createChronicleEntryStore,
  createNoveltyRegistry,
  findTemplateForEventType,
  shouldBeHistoricalAnchor,
  type ActiveProcessRegistry,
  type ChronicleEntry,
  type ChronicleEntryStore,
  type NoveltyRegistry,
} from "@first-cause/chronicle";
import type { ChronicleTemplateDefinition, DefinitionRegistry, EventTypeDefinition } from "@first-cause/content";
import { createHeadlessRunner, type HeadlessRunnerConfig } from "./runner.js";
import { runEconomyTick, type RunEconomyTickInput } from "./economy-tick.js";
import { resolveTickCausality } from "./causal-resolution.js";
import type { PendingCausalLink } from "./causal-links.js";
import {
  applyArchitectIntervention,
  type ApplyArchitectInterventionInput,
  type ApplyArchitectInterventionResult,
} from "../systems/architect/apply-intervention.js";
import type { ArchitectInterventionRule } from "../systems/architect/definition.js";

/**
 * Composes `HeadlessRunner` (M1: deterministic clock/RNG/command
 * boundary) with a real `WorldState` and `runEconomyTick` (Etap 1
 * tick-loop integration) into the runnable economy the audit's P0-01
 * found missing. `HeadlessRunner` itself stays untouched -- its own doc
 * comment ("no gameplay logic lives here") is a real M1 boundary, not
 * something Etap 1 should erode.
 */
export interface WorldRunnerConfig extends HeadlessRunnerConfig {
  readonly worldState: WorldState;
  /** Audytowe P0-06: przekazane 1:1 do `runEconomyTick` -- domyślne, jeśli pominięte (patrz `economy-tick.ts`). */
  readonly productionRecipesByMethodId?: RunEconomyTickInput["productionRecipesByMethodId"];
  readonly transportModeProfilesByModeId?: RunEconomyTickInput["transportModeProfilesByModeId"];
  readonly pmCandidatesByCurrentMethodId?: RunEconomyTickInput["pmCandidatesByCurrentMethodId"];
  /** M12: przekazane 1:1 do `runEconomyTick` -- domyślnie brak kandydatów (patrz `economy-tick.ts`). */
  readonly entrepreneurshipCandidatesByArchetypeId?: RunEconomyTickInput["entrepreneurshipCandidatesByArchetypeId"];
  /** M15: przekazane 1:1 do `runEconomyTick` -- domyślnie brak treści Technology (patrz `economy-tick.ts`). */
  readonly discoveryEligibilityRulesById?: RunEconomyTickInput["discoveryEligibilityRulesById"];
  readonly knowledgeDomainIds?: RunEconomyTickInput["knowledgeDomainIds"];
  readonly requiredDiscoveryIdsByMethodId?: RunEconomyTickInput["requiredDiscoveryIdsByMethodId"];
  /**
   * M17 (CE-09): jeśli ustawione, `step()` wywołuje `pruneCausalMemory`
   * co N ticków na WŁASNYM `causalEdgeStore`/mapie wpływu tego runnera
   * -- nigdy na `WorldState`/`FactStore` (te nigdy nie są przycinane;
   * `SimulationFact` nigdy nie jest usuwany po wyemitowaniu, własny
   * kontrakt `fact-store.ts`). Undefined (domyślnie) = nigdy nie
   * auto-przycinaj, więc zachowanie żadnego istniejącego wywołującego
   * się nie zmienia bez jawnej zgody. Wartość placeholder (reguła
   * AGENTS.md "nierozstrzygnięta wartość tuningowa") -- właściwa
   * częstotliwość zależy od benchmarków, których ten milestone jeszcze
   * nie ma.
   */
  readonly causalPruneIntervalTicks?: number;
  /**
   * M19 (CH-14): if set, `step()` runs the Chronicle Candidate Pipeline
   * (`@first-cause/chronicle`) after Causality resolves each tick's facts
   * (Chronicle & Historical Significance Spec SS123-124 "Chronicle jest
   * warstwą po Causality Engine"). Undefined (default) = Chronicle stays
   * fully inert, same "undefined = no behavior change" contract as every
   * other optional content registry on this config (see
   * `discoveryEligibilityRulesById` above).
   */
  readonly chronicleEventTypes?: DefinitionRegistry<EventTypeDefinition>;
  /** Optional: resolves `titleKey`/`templateKey` from real `ChronicleTemplateDefinition` content instead of falling back to the bare event type id. */
  readonly chronicleTemplates?: DefinitionRegistry<ChronicleTemplateDefinition>;
  /** TODO tuning override for `candidate-pipeline.ts`'s shortage-resolution silence window -- see that file. */
  readonly chronicleShortageResolutionSilenceTicks?: number;
}

export class WorldRunner {
  private readonly headless: ReturnType<typeof createHeadlessRunner>;
  private readonly factStore: FactStore;
  private readonly config: WorldRunnerConfig;
  private state: WorldState;
  private causalEdgeStore: CausalEdgeStore;
  /** Każdy fakt wyemitowany przez tego runnera, po id -- utrzymywane przyrostowo (nigdy nie przebudowywane z `factStore.all()`), żeby `priorFact` lookupy w `causal-resolution.ts` zostały O(1) zamiast O(n) na tick. */
  private readonly factsById = new Map<string, SimulationFact>();
  /** Architect Influence zaakumulowany do teraz (M16's Root Fact hop 0 jest zasilany przez `applyIntervention` poniżej; każdy kolejny hop pochodzi z `resolveTickCausality`). */
  private architectInfluenceByFactId = new Map<string, number>();
  /**
   * `"${entityType}:${entityId}:${type}" -> najnowszy fact id` --
   * przekazywane jako `RunEconomyTickInput.priorFactIndex` do KOLEJNEGO
   * ticka (CE-07), żeby systemy mogły cytować realny, cross-tickowy fakt
   * (np. Root Fact interwencji, `discovery_became_available`) jako
   * `priorFact`. Klucz MUSI zawierać `type` -- bez niego, jeśli ta sama
   * encja dostaje potem inny typ faktu (np. `discovery_became_available`
   * -> kilka ticków później `technology_adoption_increased` dla tego
   * samego discoveryId), "najnowszy fakt" po cichu podmienia wskaźnik na
   * ZUPEŁNIE INNY typ faktu, nie ten, który wywołujący faktycznie chciał
   * zacytować.
   */
  private readonly latestFactIdByEntityAndType = new Map<string, string>();
  /** M19: always constructed (cheap, empty when unused) -- only actually fed facts when `config.chronicleEventTypes` is set, see `runChronicle`. */
  private readonly chronicleNoveltyRegistry: NoveltyRegistry = createNoveltyRegistry();
  private readonly chronicleActiveProcessRegistry: ActiveProcessRegistry = createActiveProcessRegistry();
  private readonly chronicleEntryStore: ChronicleEntryStore = createChronicleEntryStore();

  constructor(config: WorldRunnerConfig) {
    this.headless = createHeadlessRunner(config);
    this.state = config.worldState;
    this.factStore = createFactStore();
    this.causalEdgeStore = createCausalEdgeStore();
    this.config = config;
  }

  get tick(): number {
    return this.headless.tick;
  }

  get worldState(): WorldState {
    return this.state;
  }

  get facts(): readonly SimulationFact[] {
    return this.factStore.all();
  }

  get causalEdges(): readonly CausalEdge[] {
    return this.causalEdgeStore.all();
  }

  /** Kopia -- wywołujący nigdy nie mogą przez to mutować wewnętrznej księgowości tego runnera. */
  get architectInfluence(): ReadonlyMap<string, number> {
    return new Map(this.architectInfluenceByFactId);
  }

  /** M19: empty for the lifetime of a runner constructed without `config.chronicleEventTypes`. */
  get chronicleEntries(): readonly ChronicleEntry[] {
    return this.chronicleEntryStore.all();
  }

  private recordFacts(emitted: readonly SimulationFact[]): void {
    for (const fact of emitted) {
      this.factsById.set(fact.id, fact);
      this.latestFactIdByEntityAndType.set(
        `${fact.subject.entityType}:${fact.subject.entityId}:${fact.type}`,
        fact.id,
      );
    }
  }

  private resolveCausality(
    emittedFacts: readonly SimulationFact[],
    causalLinks: readonly PendingCausalLink[],
  ): void {
    const result = resolveTickCausality({
      emittedFacts,
      causalLinks,
      priorFactsById: this.factsById,
      architectInfluenceByFactId: this.architectInfluenceByFactId,
      edgeStore: this.causalEdgeStore,
    });
    this.architectInfluenceByFactId = new Map(result.architectInfluenceByFactId);
  }

  /**
   * M19 CH-03/CH-04/CH-05/CH-14: runs the Chronicle Candidate Pipeline
   * over exactly this tick's new facts (registries carry the cross-tick
   * state, mirroring `resolveCausality` above), then aggregates and
   * upserts. A no-op when `config.chronicleEventTypes` is unset.
   *
   * `dataPayload` stays `{}` here deliberately: real entity names
   * (`settlementName`, `companyName`, ...) need read-model lookups this
   * generic engine method must not hardcode per event type (AGENTS.md
   * "brak hardcode w generycznych systemach") -- filling them in is a
   * presentation-layer concern for whichever caller also has both
   * `WorldState` and localization content (M21), not `WorldRunner`.
   */
  private runChronicle(emittedFacts: readonly SimulationFact[], currentTick: number): void {
    const eventTypes = this.config.chronicleEventTypes;
    if (!eventTypes) return;

    const candidates = buildChronicleCandidates({
      facts: emittedFacts,
      edges: this.causalEdgeStore.all(),
      architectInfluenceByFactId: this.architectInfluenceByFactId,
      eventTypes,
      currentTick,
      noveltyRegistry: this.chronicleNoveltyRegistry,
      activeProcessRegistry: this.chronicleActiveProcessRegistry,
      ...(this.config.chronicleShortageResolutionSilenceTicks !== undefined
        ? { shortageResolutionSilenceTicks: this.config.chronicleShortageResolutionSilenceTicks }
        : {}),
    });
    const { published } = aggregateCandidates(candidates);

    for (const candidate of published) {
      const template = this.config.chronicleTemplates
        ? findTemplateForEventType(this.config.chronicleTemplates, candidate.eventType)
        : undefined;
      const entry = this.chronicleEntryStore.upsert(candidate, {
        titleKey: template?.titleKey ?? candidate.eventType,
        templateKey: template?.id ?? candidate.eventType,
        dataPayload: {},
      });
      const alwaysAnchor = eventTypes.get(candidate.eventType)?.anchorPolicy.alwaysAnchor ?? false;
      this.chronicleEntryStore.markHistoricalAnchor(entry.id, shouldBeHistoricalAnchor(entry, alwaysAnchor));
    }
  }

  private maybePruneCausalMemory(currentTick: number): void {
    const interval = this.config.causalPruneIntervalTicks;
    if (interval === undefined || interval <= 0) return;
    if (currentTick % interval !== 0) return;

    const pruned = pruneCausalMemory({
      facts: this.factStore.all(),
      edges: this.causalEdgeStore.all(),
      architectInfluenceByFactId: this.architectInfluenceByFactId,
      currentTick,
      // SS135: a Chronicle Historical Anchor's facts must survive pruning
      // even when `@first-cause/causality`'s own `isAnchor()` alone would
      // not protect them (`historical-anchor.ts`'s header explains why
      // this is a separate field, not folded into `architectInfluenceByFactId`).
      extraMustKeepFactIds: collectHistoricalAnchorFactIds(this.chronicleEntryStore.all()),
    });

    this.factsById.clear();
    for (const fact of pruned.facts) {
      this.factsById.set(fact.id, fact);
    }
    const nextEdgeStore = createCausalEdgeStore();
    const factById = new Map(pruned.facts.map((fact) => [fact.id, fact] as const));
    for (const edge of pruned.edges) {
      const source = factById.get(edge.sourceFactId);
      const target = factById.get(edge.targetFactId);
      if (!source || !target) continue; // defensywnie: `pruneCausalMemory` już gwarantuje brak dangling edges
      nextEdgeStore.add(edge, source, target);
    }
    this.causalEdgeStore = nextEdgeStore;
    this.architectInfluenceByFactId = new Map(pruned.architectInfluenceByFactId);
    // `FactStore`/`WorldState` nigdy nie są przycinane (kontrakt
    // append-only) -- tylko własna księgowość edges/influence tego
    // runnera się zmniejsza.
  }

  /**
   * M17 (CE-07): most, który nie istniał przed tym milestone'em --
   * `applyArchitectIntervention` (M16) emituje do WŁASNEGO `FactStore`,
   * gdy wołane wprost (każdy istniejący test robi dokładnie to); ta
   * metoda kieruje to przez TEN SAM `factStore`/
   * `architectInfluenceByFactId`, który czyta `step()` tego runnera,
   * więc Root Fact stworzony tutaj może realnie propagować się w
   * kolejnych tickach (CE-12 Test 4, Butterfly Effect), zamiast żyć w
   * izolowanym store, którego nic innego nigdy nie widzi.
   */
  applyIntervention(
    rule: ArchitectInterventionRule,
    input: ApplyArchitectInterventionInput,
  ): ApplyArchitectInterventionResult {
    const result = applyArchitectIntervention(this.state, rule, input, this.factStore);
    if (result.outcome === "COMPLETED") {
      this.state = result.worldState;
      this.recordFacts(result.facts);
      for (const fact of result.facts) {
        if (fact.architect) {
          this.architectInfluenceByFactId.set(fact.id, fact.architect.influenceStrength);
        }
      }
      // M19: an intervention's Root Fact (e.g. `resource_discovered` from
      // `reveal_resource_deposit`) is Chronicle-eligible the same as any
      // ordinary tick fact -- it must not silently bypass the pipeline
      // just because it arrived outside `step()`.
      this.runChronicle(result.facts, this.headless.tick);
    }
    return result;
  }

  /** Advances exactly one tick: runs the economy, commits the result, then advances the clock (mirrors `HeadlessRunner.step`'s own "drain, then advance" order). */
  step(): void {
    // `exactOptionalPropertyTypes`: only forward each optional field when
    // the caller actually set it, instead of writing an explicit
    // `undefined` that the type system treats as different from "absent".
    const result = runEconomyTick({
      worldState: this.state,
      tick: this.headless.tick,
      demographyRng: (scopeId) => this.headless.rngStream("demography", scopeId),
      migrationRng: (scopeId) => this.headless.rngStream("migration", scopeId),
      // M15: zawsze podłączone (ten sam wzorzec co demography/migration
      // wyżej) -- zarezerwowany strumień RNG "discovery" (`core/rng.ts`)
      // to realna sprawa runtime'owa samego WorldRunner, nie coś, w co
      // caller się opcjonalnie włącza. Wsteczna-zgodność
      // `runEconomyTick`'s własnej ścieżki `discoveryRng === undefined`
      // ma znaczenie tylko dla bezpośrednich callerów sprzed M15 (głównie
      // testów jednostkowych), nie dla tego produkcyjnego runtime'u.
      discoveryRng: (scopeId) => this.headless.rngStream("discovery", scopeId),
      // M17 (CE-07): tak samo bezwarunkowe jak `discoveryRng` powyżej --
      // to jest realna księgowość samego WorldRunnera (narastająca z
      // każdego wcześniejszego ticka), nie opcjonalna konfiguracja
      // caller'a.
      priorFactIndex: Object.fromEntries(this.latestFactIdByEntityAndType),
      ...(this.config.discoveryEligibilityRulesById !== undefined
        ? { discoveryEligibilityRulesById: this.config.discoveryEligibilityRulesById }
        : {}),
      ...(this.config.knowledgeDomainIds !== undefined
        ? { knowledgeDomainIds: this.config.knowledgeDomainIds }
        : {}),
      ...(this.config.requiredDiscoveryIdsByMethodId !== undefined
        ? { requiredDiscoveryIdsByMethodId: this.config.requiredDiscoveryIdsByMethodId }
        : {}),
      ...(this.config.pmCandidatesByCurrentMethodId !== undefined
        ? { pmCandidatesByCurrentMethodId: this.config.pmCandidatesByCurrentMethodId }
        : {}),
      ...(this.config.productionRecipesByMethodId !== undefined
        ? { productionRecipesByMethodId: this.config.productionRecipesByMethodId }
        : {}),
      ...(this.config.transportModeProfilesByModeId !== undefined
        ? { transportModeProfilesByModeId: this.config.transportModeProfilesByModeId }
        : {}),
      ...(this.config.entrepreneurshipCandidatesByArchetypeId !== undefined
        ? {
            entrepreneurshipCandidatesByArchetypeId:
              this.config.entrepreneurshipCandidatesByArchetypeId,
          }
        : {}),
    });
    this.state = result.worldState;
    const emittedFacts = this.factStore.emitAll(this.headless.tick, result.facts);
    this.recordFacts(emittedFacts);
    this.resolveCausality(emittedFacts, result.causalLinks);
    this.runChronicle(emittedFacts, this.headless.tick);
    this.maybePruneCausalMemory(this.headless.tick);
    this.headless.step();
  }

  runTicks(count: number): void {
    for (let i = 0; i < count; i++) {
      this.step();
    }
  }
}

export function createWorldRunner(config: WorldRunnerConfig): WorldRunner {
  return new WorldRunner(config);
}
