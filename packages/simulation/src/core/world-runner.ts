import type { WorldState } from "@first-cause/entities";
import {
  createFactStore,
  type FactStore,
  type SimulationFact,
} from "@first-cause/causality";
import { createHeadlessRunner, type HeadlessRunnerConfig } from "./runner.js";
import { runEconomyTick } from "./economy-tick.js";

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
}

export class WorldRunner {
  private readonly headless: ReturnType<typeof createHeadlessRunner>;
  private readonly factStore: FactStore;
  private state: WorldState;

  constructor(config: WorldRunnerConfig) {
    this.headless = createHeadlessRunner(config);
    this.state = config.worldState;
    this.factStore = createFactStore();
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
    const result = runEconomyTick({
      worldState: this.state,
      tick: this.headless.tick,
      demographyRng: (scopeId) => this.headless.rngStream("demography", scopeId),
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
