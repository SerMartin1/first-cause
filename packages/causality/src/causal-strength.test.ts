import { describe, expect, it } from "vitest";
import { classifyStrength } from "./causal-strength.js";

describe("classifyStrength", () => {
  it.each([
    [0.9, "PRIMARY"],
    [0.6, "PRIMARY"],
    [0.5, "SIGNIFICANT"],
    [0.3, "SIGNIFICANT"],
    [0.2, "MINOR"],
    [0.1, "MINOR"],
    [0.05, "TRACE"],
    [0, "TRACE"],
  ] as const)("classifies %s as %s", (strength, expected) => {
    expect(classifyStrength(strength)).toBe(expected);
  });
});
