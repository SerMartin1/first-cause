import path from "node:path";
import { _electron as electron, expect, test } from "@playwright/test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

test("visual development fixture: four stages and all available map modes", async () => {
  test.setTimeout(90_000);
  const server = await createServer({
    configFile: false,
    root: path.resolve("apps/desktop"),
    plugins: [react()],
    server: { host: "127.0.0.1", port: 0 },
  });
  await server.listen();
  const app = await electron.launch({
    args: [path.resolve("apps/desktop/out/main/index.js")],
  });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${server.resolvedUrls!.local[0]}visual-tests/index.html`);
    await expect(page.locator("canvas")).toBeVisible();
    for (const [i, stage] of ["EARLY", "DEVELOPING", "INDUSTRIAL", "MODERN"].entries()) {
      await page.getByLabel("Stage", { exact: true }).selectOption(String(i));
      await expect(page.getByRole("heading")).toContainText(stage);
      // Wait for the production renderer's asynchronous scene commit, not a screenshot timer.
      await expect(page.getByTestId("living-atlas")).toHaveAttribute(
        "data-rendered-tick",
        String(i * 12),
      );
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await page.screenshot({ path: test.info().outputPath(`atlas-${stage}.png`) });
    }
    for (const mode of [
      "population",
      "economy",
      "resources",
      "trade",
      "technology",
      "development",
      "stability",
      "change",
    ]) {
      await page.getByLabel("Mode", { exact: true }).selectOption(mode);
      await expect(page.getByTestId("living-atlas")).toHaveAttribute(
        "data-rendered-mode",
        mode,
      );
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await page.screenshot({ path: test.info().outputPath(`atlas-mode-${mode}.png`) });
    }
    expect(errors).toEqual([]);
  } finally {
    await app.close();
    await server.close();
  }
});
