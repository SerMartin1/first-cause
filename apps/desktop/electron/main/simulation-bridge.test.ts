import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Worker } from "node:worker_threads";
import { SimulationBridge } from "./simulation-bridge.js";

vi.mock("node:worker_threads", () => ({ Worker: vi.fn() }));

class ControlledWorker extends EventEmitter {
  postMessage = vi.fn();
  terminate = vi.fn(() => Promise.resolve(0));
  unref = vi.fn();
}

describe("SimulationBridge lifecycle", () => {
  let worker: ControlledWorker;
  let bridge: SimulationBridge;
  beforeEach(() => {
    vi.useFakeTimers();
    worker = new ControlledWorker();
    vi.mocked(Worker).mockImplementation(() => worker as unknown as Worker);
    bridge = new SimulationBridge("controlled-worker");
  });
  afterEach(async () => {
    await bridge.dispose().catch(() => undefined);
    vi.useRealTimers();
  });
  function expectClean() {
    expect(bridge["pending"].size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  }
  it("correlates concurrent responses by requestId in reverse order", async () => {
    const first = bridge.invoke({ type: "PING" });
    const second = bridge.invoke({ type: "PING" });
    const [a, b] = worker.postMessage.mock.calls.map((call) => call[0]);
    expect(a.requestId).not.toBe(b.requestId);
    worker.emit("message", {
      requestId: b.requestId,
      payload: { type: "PONG", receivedAt: 2 },
    });
    worker.emit("message", {
      requestId: a.requestId,
      payload: { type: "PONG", receivedAt: 1 },
    });
    await expect(first).resolves.toEqual({ type: "PONG", receivedAt: 1 });
    await expect(second).resolves.toEqual({ type: "PONG", receivedAt: 2 });
    expectClean();
  });
  it("times out, ignores late replies and remains usable", async () => {
    const result = expect(bridge.invoke({ type: "PING" })).rejects.toThrow("timed out");
    const envelope = worker.postMessage.mock.calls[0]?.[0];
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
    expectClean();
    worker.emit("message", { requestId: envelope.requestId, payload: { type: "PONG" } });
    expectClean();
    const next = bridge.invoke({ type: "PING" });
    const nextEnvelope = worker.postMessage.mock.calls[1]?.[0];
    worker.emit("message", {
      requestId: nextEnvelope.requestId,
      payload: { type: "PONG", receivedAt: 3 },
    });
    await expect(next).resolves.toEqual({ type: "PONG", receivedAt: 3 });
    expectClean();
  });
  it.each(["error", "exit"])(
    "rejects all pending requests on worker %s and refuses new requests",
    async (event) => {
      const results = [1, 2].map(() =>
        expect(bridge.invoke({ type: "PING" })).rejects.toThrow(),
      );
      worker.emit(event, event === "error" ? new Error("worker failed") : 0);
      await Promise.all(results);
      await expect(bridge.invoke({ type: "PING" })).rejects.toThrow("failed");
      expect(worker.postMessage).toHaveBeenCalledTimes(2);
      expectClean();
    },
  );
  it("rejects pending and subsequent requests on idempotent dispose", async () => {
    const result = expect(bridge.invoke({ type: "PING" })).rejects.toThrow("disposed");
    const closing = bridge.dispose();
    expect(bridge.dispose()).toBe(closing);
    worker.emit("exit", 1);
    await closing;
    await result;
    await expect(bridge.invoke({ type: "PING" })).rejects.toThrow("disposed");
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expectClean();
  });
  it("cleans up a synchronous send failure", async () => {
    worker.postMessage.mockImplementation(() => {
      throw new Error("send failed");
    });
    await expect(bridge.invoke({ type: "PING" })).rejects.toThrow("send failed");
    await expect(bridge.invoke({ type: "PING" })).rejects.toThrow("failed");
    expectClean();
  });
  it("rejects a worker error response without failing the bridge", async () => {
    const result = expect(bridge.invoke({ type: "PING" })).rejects.toThrow("bad request");
    worker.emit("message", {
      requestId: worker.postMessage.mock.calls[0]?.[0].requestId,
      error: "bad request",
    });
    await result;
    expectClean();
  });
  it("bounds shutdown when termination never settles", async () => {
    worker.terminate.mockImplementation(() => new Promise(() => undefined));
    const result = expect(bridge.dispose()).rejects.toThrow("shutdown timed out");
    await vi.advanceTimersByTimeAsync(5_000);
    await result;
    expect(worker.unref).toHaveBeenCalledOnce();
    expectClean();
  });
  it("cleans the shutdown timer when termination rejects", async () => {
    worker.terminate.mockRejectedValue(new Error("termination failed"));
    await expect(bridge.dispose()).rejects.toThrow("termination failed");
    expectClean();
  });
});
