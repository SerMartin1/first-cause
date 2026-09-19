import type { WorldState } from "@first-cause/entities";
import {
  createFactStore,
  type FactStore,
  type SimulationFact,
} from "@first-cause/causality";
import { createHeadlessRunner, type HeadlessRunnerConfig } from "./runner.js";
import { runEconomyTick, type RunEconomyTickInput } from "./economy-tick.js";

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
}

export class WorldRunner {
  private readonly headless: ReturnType<typeof createHeadlessRunner>;
  private readonly factStore: FactStore;
  private readonly config: WorldRunnerConfig;
  private state: WorldState;

  constructor(config: WorldRunnerConfig) {
    this.headless = createHeadlessRunner(config);
    this.state = config.worldState;
    this.factStore = createFactStore();
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
    this.factStore.emitAll(this.headless.tick, result.facts);
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
