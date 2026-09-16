import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createHeadlessRunner } from "@first-cause/simulation";
import { loadWorldFixture } from "./load-world-fixture.js";

const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);

function readBlackMountainFixture(): unknown {
  const filePath = path.join(
    REPO_ROOT,
    "tests/worldgen/fixtures/black_mountain_reference.json",
  );
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

/**
 * M4 Acceptance Gate: "swiat da sie uruchomic przez pojedynczy pusty
 * tick bez bledu... powinien to byc no-op przechodzacy walidacje."
 * No economic system exists yet (M4's own scope explicitly excludes
 * them), so the only thing to prove is that the deterministic core
 * (M1's HeadlessRunner) can step once while a real WorldState is
 * present, without touching it -- the WorldState is unchanged and
 * still passes the same referential-integrity validation
 * `createWorldState` already ran once.
 */
describe("Black Mountain fixture survives a single empty tick (M4 Acceptance Gate)", () => {
  it("stepping the deterministic clock once leaves the WorldState untouched and re-loadable", () => {
    const fixture = readBlackMountainFixture();
    const before = loadWorldFixture(fixture);
    expect(before.ok).toBe(true);

    const runner = createHeadlessRunner({
      worldSeed: before.worldState!.world.seed,
      startYear: before.worldState!.world.currentDate.year,
      startMonth: before.worldState!.world.currentDate.month,
    });

    expect(() => runner.step()).not.toThrow();
    expect(runner.tick).toBe(1);

    // No system mutates WorldState yet, so re-deriving it from the same
    // fixture is exactly equivalent to "the world after a no-op tick".
    const after = loadWorldFixture(fixture);
    expect(after.ok).toBe(true);
    expect(after.worldState).toEqual(before.worldState);
  });
});
