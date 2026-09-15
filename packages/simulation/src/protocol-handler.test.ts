import { describe, expect, it } from "vitest";
import { createSimulationRequestHandler } from "./protocol-handler.js";
import { ENGINE_VERSION } from "./constants.js";

describe("createSimulationRequestHandler", () => {
  it("responds to PING with PONG", () => {
    const handle = createSimulationRequestHandler(Date.now());

    const response = handle({ type: "PING" });

    expect(response.type).toBe("PONG");
  });

  it("responds to GET_CORE_STATUS with a well-formed CoreStatus", () => {
    const startedAt = Date.now() - 1000;
    const handle = createSimulationRequestHandler(startedAt);

    const response = handle({ type: "GET_CORE_STATUS" });

    expect(response).toMatchObject({
      type: "CORE_STATUS",
      workerOnline: true,
      engineVersion: ENGINE_VERSION,
      startedAt,
    });
    if (response.type !== "CORE_STATUS") {
      throw new Error("expected CORE_STATUS response");
    }
    expect(response.uptimeMs).toBeGreaterThanOrEqual(1000);
  });
});
