import { parentPort, workerData } from "node:worker_threads";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEconomyContent } from "@first-cause/worldgen";
import {
  createSimulationRequestHandler,
  type WorldRequest,
} from "@first-cause/simulation";
import type { SimulationRequest } from "@first-cause/shared";
import { WorldSession } from "./world-session.js";

const port = parentPort!;
const config = workerData as { root: string; fixture: string };
const session = new WorldSession(
  JSON.parse(readFileSync(join(config.root, config.fixture), "utf8")),
  loadEconomyContent(config.root),
);
const core = createSimulationRequestHandler(Date.now());
let failure: string | undefined;
// Wall-clock schedules complete monthly ticks; it never enters simulation calculations.
setInterval(() => {
  try {
    session.advance();
  } catch (error) {
    session.handle({ type: "SET_WORLD_SPEED", speed: 0 });
    failure = error instanceof Error ? error.message : String(error);
  }
}, 1000);
port.on(
  "message",
  (envelope: { requestId: string; payload: SimulationRequest | WorldRequest }) => {
    try {
      if (failure) throw new Error(failure);
      const request = envelope.payload;
      const payload =
        request.type === "PING" || request.type === "GET_CORE_STATUS"
          ? core(request)
          : session.handle(request);
      port.postMessage({ requestId: envelope.requestId, payload });
    } catch (error) {
      port.postMessage({
        requestId: envelope.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
);
