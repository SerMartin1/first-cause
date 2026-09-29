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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainEntry = path.resolve(__dirname, "../../apps/desktop/out/main/index.js");
const OUT = path.resolve(__dirname, "../../docs/verification/world-r4-1-2026-09-29");
/**
 * Zestaw do akceptacji w `docs/` tylko na żądanie (`FC_WRITE_VERIFICATION=1`);
 * zestawy R1--R4 nie są nadpisywane (osobny katalog R4.1).
 */
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

const atlasAttr = (page: Page, name: string) =>
  page.getByTestId("living-atlas").getAttribute(name);

/** Atlas narysowany w oczekiwanym trybie i poziomie semantic zoom. */
async function atlasReady(page: Page, mode: string, zoom?: string) {
  await expect(page.getByTestId("world-screen")).toBeVisible();
  await expect(page.getByTestId("living-atlas")).toHaveAttribute(
    "data-rendered-mode",
    mode,
  );
  if (zoom)
    await expect(page.getByTestId("living-atlas")).toHaveAttribute(
      "data-semantic-zoom",
      zoom,
    );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          !!document.querySelector('[data-testid="living-atlas"] canvas') &&
          document
            .querySelector('[data-testid="living-atlas"]')!
            .hasAttribute("data-population-facts"),
      ),
    )
    .toBe(true);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

/** Legenda mieści się w płótnie Atlasu i nie wychodzi poza viewport. */
async function legendInsideAtlas(page: Page) {
  const legend = await page.getByTestId("atlas-legend").boundingBox();
  const atlas = await page.getByTestId("living-atlas").boundingBox();
  expect(legend && atlas).toBeTruthy();
  expect(legend!.x).toBeGreaterThanOrEqual(atlas!.x - 1);
  expect(legend!.y + legend!.height).toBeLessThanOrEqual(atlas!.y + atlas!.height + 1);
  expect(legend!.x + legend!.width).toBeLessThanOrEqual(atlas!.x + atlas!.width + 1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
}

test("M21-VIS-R4.1: population readability refinement -- acceptance material", async () => {
  test.setTimeout(300_000);
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

    // 1. Pełny świat w trybie Population: 1920×1080 i prawdziwy viewport 1280×800.
    for (const [width, height] of [
      [1920, 1080],
      [1280, 800],
    ] as const) {
      const page = await openPage(
        app,
        server,
        "world.html?fixture=population-civilization&mode=population",
        width,
        height,
      );
      await atlasReady(page, "population");
      await legendInsideAtlas(page);
      // Finalny tekst trybu, bez objaśnień deweloperskich.
      await expect(page.locator(".fc-world__mode-caption")).toHaveText(
        "Regional population · logarithmic scale",
      );
      await expect(page.getByTestId("atlas-legend")).not.toContainText(/morpholog/i);
      await page.screenshot({ path: shot(`r4-1-population-${width}x${height}.png`) });
      if (width === 1920)
        await page
          .getByTestId("atlas-legend")
          .screenshot({ path: shot("r4-1-legend-population.png") });
      await page.close();
    }

    // 2. Drabina 0 → ~10M+ → brak danych.
    const ladder = await openPage(
      app,
      server,
      "world.html?fixture=population-ladder&mode=population",
      1920,
      1080,
    );
    await atlasReady(ladder, "population");
    await ladder.screenshot({ path: shot("r4-1-population-ladder.png") });
    await ladder.close();

    // 3. Zero vs brak danych -- także na WORLD (oddalenie), gdzie znaczniki były za małe.
    const zero = await openPage(
      app,
      server,
      "world.html?fixture=zero-vs-no-data&mode=population",
      1920,
      1080,
    );
    await atlasReady(zero, "population");
    expect(await atlasAttr(zero, "data-population-states")).toBe(
      "r4_zero_a=zero,r4_zero_b=unavailable",
    );
    await zero.screenshot({ path: shot("r4-1-zero-vs-no-data.png") });
    await zero.close();

    // 4. Zaznaczony region: narożniki zaznaczenia ≠ pierścień populacji.
    const selected = await openPage(
      app,
      server,
      "world.html?fixture=population-civilization&mode=population&select=r3_civ_capital",
      1920,
      1080,
    );
    await atlasReady(selected, "population");
    expect(await atlasAttr(selected, "data-selection-marker")).toBe("brackets");
    await selected.screenshot({ path: shot("r4-1-selected-region.png") });
    await selected.close();

    // 5. Terrain vs Population: ta sama tożsamość osad; Terrain zachowuje dotychczasowe zaznaczenie.
    const identity: Record<string, string | null> = {};
    for (const mode of ["terrain", "population"]) {
      const page = await openPage(
        app,
        server,
        `world.html?fixture=population-civilization&mode=${mode}&select=r3_civ_capital`,
        1920,
        1080,
      );
      await atlasReady(page, mode);
      identity[mode] = await atlasAttr(page, "data-settlement-identity");
      expect(await atlasAttr(page, "data-selection-marker")).toBe(
        mode === "population" ? "brackets" : "outline",
      );
      await page.close();
    }
    expect(identity.population).toBe(identity.terrain);
    const compare = await openPage(
      app,
      server,
      "compare.html?fixture=population-civilization&select=r3_civ_capital&left=terrain&right=population",
      2600,
      900,
    );
    for (const mode of ["terrain", "population"])
      await expect(
        compare.frameLocator(`iframe[data-mode="${mode}"]`).getByTestId("living-atlas"),
      ).toHaveAttribute("data-rendered-mode", mode);
    await compare.waitForTimeout(500);
    await compare.screenshot({ path: shot("r4-1-terrain-vs-population.png") });
    await compare.close();
  } finally {
    await app.close();
    await server.close();
  }
});
