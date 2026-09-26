import path from "node:path";
import { fileURLToPath } from "node:url";
import { _electron as electron, expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainEntry = path.resolve(__dirname, "../../apps/desktop/out/main/index.js");

/**
 * M0 smoke test: start application -> Electron window opens -> FIRST CAUSE
 * visible -> Simulation Worker ONLINE.
 *
 * Requires `pnpm build` to have produced `apps/desktop/out/` first --
 * `pnpm test:e2e` runs the build automatically.
 */
test("FIRST CAUSE window opens and Simulation Worker comes online", async () => {
  const app = await electron.launch({ args: [mainEntry] });

  try {
    const window = await app.firstWindow();
    await expect(window.getByText("FIRST CAUSE")).toBeVisible();
    await expect(window.getByTestId("worker-status")).toHaveText(
      "Simulation Worker: ONLINE",
      { timeout: 10_000 },
    );
  } finally {
    await app.close();
  }
});

test("World atlas: events, WHY, history, map modes and locale share the real worker", async () => {
  const testInfo = test.info();
  test.setTimeout(90_000);
  const app = await electron.launch({ args: [mainEntry] });
  try {
    const window = await app.firstWindow();
    const errors: string[] = [];
    window.on("pageerror", (error) => errors.push(error.message));
    await window.setViewportSize({ width: 1920, height: 1080 });
    await expect(window.getByTestId("world-screen")).toBeVisible();
    await expect(window.getByTestId("living-atlas").locator("canvas")).toBeVisible();
    await expect(
      window.getByText("The atlas renderer is unavailable.", { exact: false }),
    ).toHaveCount(0);
    await expect(window.getByRole("tab", { name: "Political" })).toBeDisabled();
    await window.screenshot({
      path: testInfo.outputPath("world-initial.png"),
      fullPage: true,
    });
    await window.getByRole("button", { name: "Advance 1 year" }).click();
    await expect(window.getByRole("button", { name: "Advance 1 year" })).toBeEnabled();
    const live = await window.evaluate(() => window.firstCauseWorld.getWorld(1));
    expect(live.current.summary.currentTick).toBe(12);
    expect(live.baseline?.summary.currentTick).toBe(0);
    // Moduły wspierające startują zwinięte (Golden UI World v1.3 §26.3 G).
    await window.locator(".fc-world__recent > summary").click();
    await expect(window.locator(".fc-world__events button").first()).toBeVisible();
    await window.locator(".fc-world__events button").first().click();
    await expect(window.locator(".fc-world__region .fc-region-vignette")).toBeVisible();
    await expect(window.locator(".fc-world__why")).toContainText("Consequences");
    await window.screenshot({
      path: testInfo.outputPath("world-event-focus.png"),
      fullPage: true,
    });
    const explainedRegion = live.current.regions.find(
      (region) => region.latestExplainedChange,
    );
    expect(explainedRegion).toBeTruthy();
    await window
      .locator(".fc-world__region-picker select")
      .selectOption(explainedRegion!.regionId);
    const scope = window.getByRole("group", { name: "Analysis scope" });
    await expect(
      scope.getByRole("button", { name: "WORLD", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await window.screenshot({
      path: testInfo.outputPath("context-world-selected.png"),
      fullPage: true,
    });
    await scope.getByRole("button", { name: explainedRegion!.name, exact: true }).click();
    await expect(window.getByTestId("analysis-causes")).toHaveAttribute(
      "data-scope",
      "REGION",
    );
    await expect(window.getByTestId("analysis-consequences")).toHaveAttribute(
      "data-scope",
      "REGION",
    );
    await window.screenshot({
      path: testInfo.outputPath("context-region.png"),
      fullPage: true,
    });
    await scope.getByRole("button", { name: "WORLD", exact: true }).click();
    expect(await window.evaluate(() => window.firstCauseWorld.getWorld(1))).toEqual(live);
    await window.locator(".fc-world__latest-change button").click();
    await expect(window.locator(".fc-world__causes > div").first()).toBeVisible();
    await window
      .locator(".fc-world__causes")
      .getByRole("button", { name: "Show on Map" })
      .first()
      .click();
    await window.screenshot({
      path: testInfo.outputPath("world-causal-step.png"),
      fullPage: true,
    });
    await window.getByRole("tab", { name: "Δ Change" }).click();
    await window.getByLabel("Change in", { exact: true }).selectOption("production");
    await window.screenshot({
      path: testInfo.outputPath("world-event-why.png"),
      fullPage: true,
    });
    await window.getByRole("tab", { name: "Resources", exact: true }).first().click();
    // TECH-010: lista zasobów zawiera tylko złoża znane światu -- ukryta ruda
    // żelaza Black Mountain (World Generation Spec §16) nie może się tu pojawić.
    const resourcePicker = window.getByLabel("Resource", { exact: true });
    await expect(resourcePicker.locator("option")).toHaveText(["Grain"]);
    await resourcePicker.selectOption("grain");
    await window.screenshot({
      path: testInfo.outputPath("world-resources.png"),
      fullPage: true,
    });
    await window.getByRole("tab", { name: "Trade", exact: true }).click();
    await window.screenshot({
      path: testInfo.outputPath("world-trade.png"),
      fullPage: true,
    });
    await window.getByRole("tab", { name: "Technology", exact: true }).click();
    await window.screenshot({
      path: testInfo.outputPath("world-technology.png"),
      fullPage: true,
    });
    await window.getByRole("tab", { name: "Δ Change" }).click();
    await window.locator(".fc-world__atlas-tools select").first().selectOption("10");
    await expect(window.locator(".fc-world__mode-caption")).toContainText(
      "No baseline for this period yet",
    );
    await window.screenshot({
      path: testInfo.outputPath("world-change-10y.png"),
      fullPage: true,
    });
    await window.locator(".fc-world__timeline > summary").click();
    await window.getByRole("slider", { name: "World Timeline" }).fill("0");
    await expect(window.getByRole("button", { name: "Advance 1 year" })).toBeDisabled();
    await expect(window.locator(".fc-world__timeline")).toContainText("Historical view");
    await window.screenshot({
      path: testInfo.outputPath("world-historical.png"),
      fullPage: true,
    });
    await window.getByRole("button", { name: "Return to present" }).click();
    await expect(window.getByRole("button", { name: "Advance 1 year" })).toBeEnabled();
    const beforeLocale = await window.evaluate(() => window.firstCauseWorld.getWorld(1));
    await window.getByRole("button", { name: "PL", exact: true }).click();
    await expect(
      window.getByRole("heading", { name: "NAJWAŻNIEJSZE PRZYCZYNY" }),
    ).toBeVisible();
    expect(await window.evaluate(() => window.firstCauseWorld.getWorld(1))).toEqual(
      beforeLocale,
    );
    await window.setViewportSize({ width: 1280, height: 800 });
    await window.evaluate(() => window.scrollTo(0, 0));
    await window.screenshot({ path: testInfo.outputPath("world-pl-1280.png") });
    expect(
      await window.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await app.close();
  }
});
