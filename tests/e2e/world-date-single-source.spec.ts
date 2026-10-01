import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

/*
 * Zasada właściciela (2026-10-01): data świata jest wyłącznie w górnym pasku.
 * Panele Gospodarki i Handlu opisują okres względnie („ostatni miesiąc”),
 * pasek zakresu analizy pod mapą i oś czasu nie powtarzają daty / ticka.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainEntry = path.resolve(__dirname, "../../apps/desktop/out/main/index.js");
const OUT = path.resolve(__dirname, "../../docs/verification/world-date-single-source-2026-10-01");
/** Zestaw do akceptacji w `docs/` tylko na żądanie (`FC_WRITE_VERIFICATION=1`). */
const shot = (name: string) =>
  process.env.FC_WRITE_VERIFICATION ? path.join(OUT, name) : test.info().outputPath(name);

/** Data/tick w dowolnym zapisie PL/EN używanym przez UI. */
const DATE_TEXT = /\b(year|rok|month|miesiąc|tick) +\d+/i;

async function openPage(
  app: ElectronApplication,
  server: ViteDevServer,
  query: string,
  width: number,
  height: number,
) {
  const url = `${server.resolvedUrls!.local[0]}visual-tests/${query}`;
  const [page] = await Promise.all([
    app.waitForEvent("window"),
    app.evaluate(
      ({ BrowserWindow }, target) => {
        const window = new BrowserWindow({
          width: target.width,
          height: target.height,
          show: true,
        });
        void window.loadURL(target.url);
      },
      { url, width, height },
    ),
  ]);
  await page.setViewportSize({ width, height });
  return page;
}

async function atlasReady(page: Page, mode: string) {
  await expect(page.getByTestId("world-screen")).toBeVisible();
  await expect(page.getByTestId("living-atlas")).toHaveAttribute("data-rendered-mode", mode);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

/** Data świata jest w górnym pasku; panel regionu i pasek zakresu jej nie powtarzają. */
async function dateOnlyInTopBar(page: Page) {
  await expect(page.locator(".fc-world__clock")).toContainText(DATE_TEXT);
  await expect(page.locator(".fc-world__scope")).not.toContainText(DATE_TEXT);
  const panel = page.locator('[data-testid="economy-panel"], [data-testid="trade-panel"]');
  if (await panel.count()) await expect(panel.first()).not.toContainText(DATE_TEXT);
}

test("date only in the top bar: Economy, Trade, analysis strip, timeline", async () => {
  test.setTimeout(600_000);
  const server = await createServer({
    configFile: false,
    root: path.resolve("apps/desktop"),
    plugins: [react()],
    server: { host: "127.0.0.1", port: 0 },
  });
  await server.listen();
  const app = await electron.launch({ args: [mainEntry] });
  try {
    await app.firstWindow();

    // 1. Panele Gospodarki i Handlu (dane deweloperskie), PL/EN, 1280×800 i 1920×1080.
    for (const [width, height] of [
      [1280, 800],
      [1920, 1080],
    ] as const)
      for (const lang of ["pl", "en"] as const)
        for (const [mode, query, testId] of [
          ["economy", "fixture=economy&mode=economy&select=econ_b_delta", "economy-panel"],
          ["trade", "fixture=trade&mode=trade&select=trade_b_delta", "trade-panel"],
        ] as const) {
          const page = await openPage(
            app,
            server,
            `world.html?${query}&lang=${lang}`,
            width,
            height,
          );
          await atlasReady(page, mode);
          await expect(page.getByTestId(testId)).toBeVisible();
          await expect(page.getByTestId("economy-period")).toHaveCount(0);
          await expect(page.getByTestId("trade-period")).toHaveCount(0);
          await dateOnlyInTopBar(page);
          if (mode === "trade")
            await expect(page.getByTestId("trade-context")).toContainText(
              lang === "pl" ? "ostatni miesiąc" : "last month",
            );
          await page.screenshot({ path: shot(`${mode}-panel-${width}x${height}-${lang}.png`) });
          await page.close();
        }

    // 2. Prawdziwa gra po roku: pasek zakresu pod mapą i oś czasu bez daty, PL i EN.
    const game = await app.firstWindow();
    await game.setViewportSize({ width: 1280, height: 800 });
    await expect(game.getByTestId("world-screen")).toBeVisible();
    const advance = game.getByRole("button", { name: "Advance 1 year" });
    await advance.click();
    await expect(advance).toBeEnabled();
    await game.getByRole("tablist", { name: "Map mode" }).getByRole("tab", { name: "Economy" }).click();
    await atlasReady(game, "economy");
    const live = await game.evaluate(() => window.firstCauseWorld.getWorld(1));
    const region = [...live.current.regions].sort(
      (a, b) => b.economy.activeCompanies - a.economy.activeCompanies,
    )[0]!;
    await game.locator(".fc-world__region-picker select").selectOption(region.regionId);
    await expect(game.getByTestId("economy-panel")).toBeVisible();
    for (const lang of ["en", "pl"] as const) {
      await game.getByRole("button", { name: lang.toUpperCase(), exact: true }).click();
      await expect(game.locator(".fc-world__clock")).toContainText("Tick 12");
      await dateOnlyInTopBar(game);
      // Oś czasu: tylko „Teraz / Live” (data w górnym pasku).
      await game.locator(".fc-world__timeline > summary").click();
      await expect(game.locator(".fc-world__timeline label").first()).not.toContainText(
        DATE_TEXT,
      );
      await game.screenshot({ path: shot(`game-economy-strip-timeline-1280x800-${lang}.png`) });
      await game.locator(".fc-world__analysis").screenshot({
        path: shot(`game-analysis-strip-1280x800-${lang}.png`),
      });
      await game.locator(".fc-world__timeline > summary").click();
    }
    await game.getByRole("button", { name: "EN", exact: true }).click();
  } finally {
    await app.close();
    await server.close();
  }
});
