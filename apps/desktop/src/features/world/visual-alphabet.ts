import type { Graphics } from "pixi.js";
import type { RegionVisualProfile } from "@first-cause/simulation";

/** Authored cartographic primitives. No era inference, invented facilities or RNG. */
export function settlementBlocks(
  population: number,
): readonly { x: number; y: number }[] {
  const count =
    population < 500
      ? 1
      : population < 2_000
        ? 3
        : population < 10_000
          ? 5
          : population < 50_000
            ? 9
            : population < 100_000
              ? 12
              : population < 500_000
                ? 16
                : population < 1_000_000
                  ? 20
                  : 25;
  const cols = Math.ceil(Math.sqrt(count));
  return Array.from({ length: count }, (_, i) => ({
    x: (i % cols) - (cols - 1) / 2,
    y: Math.floor(i / cols) - (Math.ceil(count / cols) - 1) / 2,
  }));
}

export function drawProfileAlphabet(
  g: Graphics,
  profile: RegionVisualProfile,
  color: string,
): void {
  // One relief mark describes terrain; it is not a claim about physical geometry.
  if (profile.terrain === "mountains" || profile.terrain === "hills")
    g.moveTo(-25, 23)
      .lineTo(-19, 14)
      .lineTo(-13, 23)
      .stroke({ color, width: 1, alpha: 0.4 });
  const industry = profile.industry;
  if (industry === "mine") {
    g.moveTo(-8, 24)
      .lineTo(4, 36)
      .moveTo(4, 24)
      .lineTo(-8, 36)
      .stroke({ color, width: 2 });
  } else if (industry === "factory" || industry === "industrial_complex") {
    g.poly([-8, 36, -8, 29, -2, 26, -2, 29, 4, 26, 4, 36]).fill(color);
    g.rect(5, 21, 3, 15).fill(color);
    if (industry === "industrial_complex") g.rect(10, 24, 3, 12).fill(color);
  } else if (industry === "workshop") {
    g.rect(-6, 26, 12, 10).stroke({ color, width: 2 });
    g.moveTo(-8, 26).lineTo(0, 21).lineTo(8, 26).stroke({ color, width: 2 });
  } else if (industry === "farm") {
    for (let i = 0; i < 3; i++)
      g.moveTo(-6 + i * 5, 25)
        .lineTo(-9 + i * 5, 35)
        .stroke({ color, width: 1 });
  }
  if (profile.transport) {
    const width = profile.transport === "highway" ? 3 : 1;
    if (profile.transport === "trail") {
      for (let x = -20; x < 20; x += 8)
        g.moveTo(x, 42)
          .lineTo(x + 4, 42)
          .stroke({ color, width });
    } else g.moveTo(-20, 42).lineTo(20, 42).stroke({ color, width });
    if (profile.transport === "railway")
      for (let x = -18; x <= 18; x += 6)
        g.moveTo(x, 39).lineTo(x, 45).stroke({ color, width: 1 });
  }
}
