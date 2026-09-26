import {
  createWorldRunner,
  buildWorldSnapshot,
  WorldViewHistory,
  buildWorldWhyView,
  type WorldRequest,
  type WorldResponse,
  type WorldRunner,
} from "@first-cause/simulation";
import { loadWorldFixture, type LoadEconomyContentResult } from "@first-cause/worldgen";

/** Worker-owned host. All mutations are explicit commands between complete ticks. */
export class WorldSession {
  readonly runner: WorldRunner;
  private readonly history = new WorldViewHistory();
  private speed = 0;
  constructor(
    rawFixture: unknown,
    private readonly content: LoadEconomyContentResult,
  ) {
    const loaded = loadWorldFixture(rawFixture);
    if (!loaded.ok || !loaded.worldState || !content.ok)
      throw new Error([...loaded.errors, ...content.errors].join("; "));
    const worldState = loaded.worldState;
    this.runner = createWorldRunner({
      ...content,
      worldState,
      worldSeed: worldState.world.seed,
      startYear: worldState.world.currentDate.year,
      startMonth: worldState.world.currentDate.month,
    });
    this.record();
  }
  private record(): void {
    this.history.record(
      buildWorldSnapshot(
        this.runner.worldState,
        this.runner.facts,
        this.content.sectorByCompanyArchetypeId,
        this.runner.causalEdges,
      ),
    );
  }
  advance(): void {
    for (let i = 0; i < this.speed; i++) {
      this.runner.step();
      this.record();
    }
  }
  handle(request: WorldRequest): WorldResponse {
    if (!request || typeof request !== "object") throw new Error("Invalid world command");
    if (
      "tick" in request &&
      request.tick !== undefined &&
      (!Number.isInteger(request.tick) ||
        request.tick < 0 ||
        request.tick > this.runner.tick)
    )
      throw new Error("Invalid historical tick");
    switch (request.type) {
      case "GET_WORLD":
        if (![1, 5, 10, 25, 50].includes(request.years))
          throw new Error("Invalid comparison window");
        return this.history.view(
          this.runner.tick,
          request.years,
          this.runner.chronicleEntries,
          this.speed,
          request.tick,
        );
      case "SET_WORLD_SPEED":
        if (![0, 1, 2, 4, 10, 100].includes(request.speed))
          throw new Error("Invalid speed");
        this.speed = request.speed;
        break;
      case "STEP_WORLD":
        if (!Number.isInteger(request.ticks) || request.ticks < 1 || request.ticks > 120)
          throw new Error("Invalid tick count");
        this.speed = 0;
        for (let i = 0; i < request.ticks; i++) {
          this.runner.step();
          this.record();
        }
        break;
      case "GET_WORLD_WHY":
        return buildWorldWhyView(
          this.runner,
          request.factId,
          request.tick,
          request.context,
        );
      default:
        throw new Error("Unknown world command");
    }
    return this.history.view(
      this.runner.tick,
      1,
      this.runner.chronicleEntries,
      this.speed,
    );
  }
}
