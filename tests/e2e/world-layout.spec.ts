import path from "node:path";
import { fileURLToPath } from "node:url";
import { _electron as electron, expect, test, type Page } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainEntry = path.resolve(__dirname, "../../apps/desktop/out/main/index.js");

/** Czeka, aż płótno PixiJS dopasuje się do nowego viewportu i scena zostanie narysowana. */
async function atlasSettled(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const host = document.querySelector<HTMLElement>('[data-testid="living-atlas"]');
        const canvas = host?.querySelector("canvas");
        return (
          !!host &&
          !!canvas &&
          host.hasAttribute("data-rendered-tick") &&
          Math.abs(canvas.clientWidth - host.clientWidth) < 2 &&
          Math.abs(canvas.clientHeight - host.clientHeight) < 2
        );
      }),
    )
    .toBe(true);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

/** Geometria kompozycji w prawdziwym viewporcie (bez fullPage). */
function layout(page: Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const r = document.querySelector(selector)!.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom };
    };
    const rail = rect(".fc-app-shell__rail");
    const bar = rect(".fc-world__bar");
    const atlas = rect(".fc-world__atlas");
    const canvas = rect(".fc-atlas");
    const region = rect(".fc-world__region");
    const analysis = rect(".fc-world__analysis");
    const speed = rect(".fc-world__speed");
    const legend = rect(".fc-atlas__legend");
    // Obszar roboczy: między railem, górnym paskiem a dolną krawędzią viewportu.
    const work = (window.innerWidth - rail.width) * (window.innerHeight - bar.bottom);
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      rail,
      atlas,
      canvas,
      region,
      analysis,
      speed,
      legend,
      atlasShare: (atlas.width * atlas.height) / work,
      horizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}

test("M21-VIS-R1: World composition at 1920×1080 and 1280×800 (real viewport)", async () => {
  test.setTimeout(120_000);
  const testInfo = test.info();
  const app = await electron.launch({ args: [mainEntry] });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByTestId("world-screen")).toBeVisible();
    await page.getByRole("button", { name: "Advance 1 year" }).click();
    await expect(page.getByRole("button", { name: "Advance 1 year" })).toBeEnabled();
    const live = await page.evaluate(() => window.firstCauseWorld.getWorld(1));
    const explained =
      live.current.regions.find((r) => r.latestExplainedChange) ??
      live.current.regions[0]!;
    const rail = page.getByRole("list", { name: "Main navigation" });
    await expect(rail.getByRole("button")).toHaveCount(1);
    await expect(rail.getByRole("button", { name: "World" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("tab", { name: "Terrain" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    for (const [width, height] of [
      [1920, 1080],
      [1280, 800],
    ] as const) {
      const size = `${width}x${height}`;
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.keyboard.press("Escape");
      await expect(page.locator(".fc-world__region")).toContainText(
        "Select a region on the atlas",
      );
      await atlasSettled(page);
      const empty = await layout(page);
      testInfo.annotations.push({
        type: `layout ${size}`,
        description: JSON.stringify(empty),
      });
      // Atlas w pierwszym ekranie, dominujący, bez poziomego przewijania strony.
      expect(empty.horizontalScroll).toBe(false);
      expect(empty.atlas.bottom).toBeLessThanOrEqual(height);
      expect(empty.analysis.bottom).toBeLessThanOrEqual(height);
      expect(empty.speed.bottom).toBeLessThanOrEqual(height);
      expect(empty.atlasShare).toBeGreaterThan(width === 1920 ? 0.5 : 0.42);
      expect(empty.atlas.width).toBeGreaterThan(empty.region.width * 2);
      expect(empty.rail.width).toBeLessThanOrEqual(180);
      expect(empty.canvas.height).toBeGreaterThan(width === 1920 ? 600 : 380);
      expect(empty.region.width).toBeGreaterThanOrEqual(280);
      await page.screenshot({ path: testInfo.outputPath(`r1-${size}-world-none.png`) });

      await page
        .locator(".fc-world__region-picker select")
        .selectOption(explained.regionId);
      await expect(page.locator(".fc-world__region")).toContainText(explained.name);
      const scope = page.getByRole("group", { name: "Analysis scope" });
      await expect(
        scope.getByRole("button", { name: "WORLD", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("analysis-causes")).toHaveAttribute(
        "data-scope",
        "WORLD",
      );
      await atlasSettled(page);
      const selected = await layout(page);
      expect(selected.atlas.bottom).toBeLessThanOrEqual(height);
      expect(selected.horizontalScroll).toBe(false);
      await page.screenshot({
        path: testInfo.outputPath(`r1-${size}-world-selected.png`),
      });

      await scope.getByRole("button", { name: explained.name, exact: true }).click();
      await expect(page.getByTestId("analysis-causes")).toHaveAttribute(
        "data-scope",
        "REGION",
      );
      await expect(page.getByTestId("analysis-consequences")).toHaveAttribute(
        "data-scope",
        "REGION",
      );
      await atlasSettled(page);
      await page.screenshot({ path: testInfo.outputPath(`r1-${size}-region-scope.png`) });
      await scope.getByRole("button", { name: "WORLD", exact: true }).click();
    }
    // Moduły G rozwijają się pod pierwszym ekranem i nie zmniejszają Atlasu.
    const before = await layout(page);
    await page.locator(".fc-world__recent > summary").click();
    await page.locator(".fc-world__ranking > summary").click();
    await expect(page.locator(".fc-world__events button").first()).toBeVisible();
    const expanded = await layout(page);
    expect(expanded.atlas.height).toBe(before.atlas.height);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({
      path: testInfo.outputPath("r1-1280x800-support-expanded.png"),
    });
    // Scope i układ nie mutują stanu świata.
    expect(await page.evaluate(() => window.firstCauseWorld.getWorld(1))).toEqual(live);
    expect(errors).toEqual([]);
  } finally {
    await app.close();
  }
});
