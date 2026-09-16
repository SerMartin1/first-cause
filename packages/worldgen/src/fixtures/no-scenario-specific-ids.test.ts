import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../..",
);

function listTsSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTsSourceFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * World Generation Spec SS16/SS36/SS53, Implementation Roadmap M4
 * Testy: "generic simulation modules nie zawierają żadnego ID
 * specyficznego dla black_mountain". The fixture *data*
 * (`tests/worldgen/fixtures/black_mountain_reference.json`) is exempt
 * by design -- scenario identity belongs there, never in engine code.
 */
describe("engine source contains no scenario-specific IDs (SS16/SS36/SS53)", () => {
  const scannedDirs = [
    path.join(REPO_ROOT, "packages/worldgen/src"),
    path.join(REPO_ROOT, "packages/entities/src"),
    path.join(REPO_ROOT, "packages/simulation/src"),
  ];

  it('no non-test .ts source file under worldgen/entities/simulation mentions "black_mountain" or "blackMountain"', () => {
    const offenders: string[] = [];
    for (const dir of scannedDirs) {
      for (const file of listTsSourceFiles(dir)) {
        const content = readFileSync(file, "utf-8");
        if (/black_mountain|blackMountain/i.test(content)) {
          offenders.push(path.relative(REPO_ROOT, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
