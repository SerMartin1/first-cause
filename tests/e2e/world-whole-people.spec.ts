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
 * Decyzje właściciela (2026-10-01, Canonical §52E): pracownicy to całe osoby
 * w modelu; „Przychód firm ze sprzedaży / miesiąc” w panelu w całych
 * jednostkach pieniężnych (ceny za jednostkę towaru z groszami).
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainEntry = path.resolve(__dirname, "../../apps/desktop/out/main/index.js");
const OUT = path.resolve(__dirname, "../../docs/verification/world-whole-people-2026-10-01");
/** Zestaw do akceptacji w `docs/` tylko na żądanie (`FC_WRITE_VERIFICATION=1`). */
const shot = (name: string) =>
  process.env.FC_WRITE_VERIFICATION ? path.join(OUT, name) : test.info().outputPath(name);


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

const SALES_LABEL = {
  pl: "Przychód firm ze sprzedaży / miesiąc",
  en: "Company sales revenue / month",
} as const;

async function checkPanel(page: Page, lang: "pl" | "en") {
  const panel = page.getByTestId("economy-panel");
  await expect(panel).toBeVisible();
  const employment = panel.locator('[data-economy-fact="employment"] .fc-data');
  // Całe osoby: bez części ułamkowej.
  // \s obejmuje twardą spację separatora tysięcy.
  await expect(employment).toHaveText(/^[\d\s,.]+$/);
  expect(await employment.textContent()).not.toMatch(lang === "pl" ? /,\d/ : /\.\d/);
  const sales = panel.locator('[data-economy-fact="sales"]');
  await expect(sales).toContainText(SALES_LABEL[lang]);
  const salesValue = sales.locator(".fc-economy__value .fc-data");
  if (await salesValue.count())
    expect(await salesValue.textContent()).not.toMatch(lang === "pl" ? /,\d/ : /\.\d/);
}

test("whole people in the model; company sales revenue in whole units", async () => {
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
    // 1. Prawdziwa gra (Black Mountain) po roku: Green Valley, PL/EN, 1280×800 i 1920×1080.
    const game = await app.firstWindow();
    await expect(game.getByTestId("world-screen")).toBeVisible();
    const advance = game.getByRole("button", { name: "Advance 1 year" });
    await advance.click();
    await expect(advance).toBeEnabled();
    const live = await game.evaluate(() => window.firstCauseWorld.getWorld(1));
    for (const r of live.current.regions)
      expect(Number.isInteger(r.economy.employment), r.regionId).toBe(true);
    const valley = live.current.regions.find((r) => r.regionId === "region_green_valley")!;
    // Całe osoby (dawniej 6,5). Wartość zależy od gospodarki (diagnoza Black
    // Mountain, etap 1: przy P8 farma może już nie zatrudniać) -- sprawdzamy
    // całkowitość i zgodność widoków, nie konkretną liczbę.
    expect(Number.isInteger(valley.economy.employment)).toBe(true);
    const worldTotal = live.current.regions.reduce((a, r) => a + r.economy.employment, 0);
    await game
      .getByRole("tablist", { name: "Map mode" })
      .getByRole("tab", { name: "Economy" })
      .click();
    await atlasReady(game, "economy");
    await game.locator(".fc-world__region-picker select").selectOption("region_green_valley");
    for (const [width, height] of [
      [1280, 800],
      [1920, 1080],
    ] as const)
      for (const lang of ["pl", "en"] as const) {
        await game.setViewportSize({ width, height });
        await game.getByRole("button", { name: lang.toUpperCase(), exact: true }).click();
        await checkPanel(game, lang);
        await expect(
          game.getByTestId("pulse-employment").locator("[data-pulse-value]"),
        ).toHaveText(String(worldTotal));
        await game.screenshot({
          path: shot(`game-green-valley-economy-${width}x${height}-${lang}.png`),
        });
      }
    await game.getByRole("button", { name: "EN", exact: true }).click();

    // 2. Dane deweloperskie (Great Delta): przychód 6 912,40 w modelu → „6912” / „6,912”.
    for (const lang of ["pl", "en"] as const) {
      const page = await openPage(
        app,
        server,
        `world.html?fixture=economy&mode=economy&select=econ_b_delta&lang=${lang}`,
        1280,
        800,
      );
      await atlasReady(page, "economy");
      await checkPanel(page, lang);
      await expect(
        page.locator('[data-economy-fact="sales"] .fc-economy__value .fc-data'),
      ).toHaveText(lang === "pl" ? "6912" : "6,912");
      await page.screenshot({ path: shot(`dev-economy-panel-1280x800-${lang}.png`) });
      await page.close();
    }
  } finally {
    await app.close();
    await server.close();
  }
});
