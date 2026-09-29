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
const OUT = path.resolve(__dirname, "../../docs/verification/world-r4-2026-09-29");
/**
 * Zestaw do akceptacji w `docs/` tylko na żądanie (`FC_WRITE_VERIFICATION=1`);
 * zaakceptowane zestawy R1/R2/R3/R3.1 nie są nadpisywane (osobny katalog R4).
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

test("M21-VIS-R4: population atlas mode -- acceptance material", async () => {
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

    // 1. Drabina 0 → ~10 → … → ~10M+ → brak danych (1920×1080).
    const ladder = await openPage(
      app,
      server,
      "world.html?fixture=population-ladder&mode=population",
      1920,
      1080,
    );
    await atlasReady(ladder, "population");
    const ladderStates = await atlasAttr(ladder, "data-population-states");
    expect(ladderStates).toContain("r4_ladder_0_empty=zero");
    expect(ladderStates).toContain("r4_ladder_8_nodata=unavailable");
    expect(ladderStates!.match(/=populated/g)).toHaveLength(7);
    expect(await atlasAttr(ladder, "data-settlement-classes")).toBe(
      "hamlet,village,town,city,metropolis,megacity",
    );
    await expect(ladder.getByTestId("population-legend")).toBeVisible();
    await expect(ladder.locator("[data-population-step]")).toHaveCount(6);
    await ladder.screenshot({ path: shot("r4-population-ladder.png") });
    await ladder.close();

    // 2. Zero vs brak danych -- główna bramka akceptacji wizualnej.
    const zero = await openPage(
      app,
      server,
      "world.html?fixture=zero-vs-no-data&mode=population",
      1920,
      1080,
    );
    await atlasReady(zero, "population", "REGION");
    expect(await atlasAttr(zero, "data-population-facts")).toBe(
      "r4_zero_a=0,r4_zero_b=none",
    );
    expect(await atlasAttr(zero, "data-population-states")).toBe(
      "r4_zero_a=zero,r4_zero_b=unavailable",
    );
    await expect(zero.locator('[data-population-legend-state="zero"]')).toBeVisible();
    await expect(
      zero.locator('[data-population-legend-state="unavailable"]'),
    ).toBeVisible();
    await zero.screenshot({ path: shot("r4-zero-vs-no-data.png") });
    await zero.close();

    // 3. Pełny świat w trybie Population: 1920×1080 i prawdziwy viewport 1280×800.
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
      await expect(page.getByTestId("population-legend")).toBeVisible();
      await page.screenshot({ path: shot(`r4-population-${width}x${height}.png`) });
      await page.close();
    }

    // 4. Zaznaczony region (Population).
    const selected = await openPage(
      app,
      server,
      "world.html?fixture=population-civilization&mode=population&select=r3_civ_capital",
      1920,
      1080,
    );
    await atlasReady(selected, "population");
    await expect(selected.getByLabel("Selected Region Inspector")).toContainText(
      "Capital Plain",
    );
    await selected.screenshot({ path: shot("r4-population-selected-region.png") });
    await selected.close();

    // 5. Semantic zoom: ten sam fakt i ta sama osada na WORLD / REGION / LOCAL.
    const facts = new Set<string | null>();
    const classes = new Set<string | null>();
    const identities: string[] = [];
    for (const [zoom, level] of [
      ["0.6", "WORLD"],
      ["1", "REGION"],
      ["1.6", "LOCAL"],
    ] as const) {
      const page = await openPage(
        app,
        server,
        `world.html?fixture=population-civilization&mode=population&zoom=${zoom}`,
        1920,
        1080,
      );
      await atlasReady(page, "population", level);
      facts.add(await atlasAttr(page, "data-population-facts"));
      classes.add(await atlasAttr(page, "data-settlement-classes"));
      identities.push((await atlasAttr(page, "data-settlement-identity")) ?? "");
      await page.screenshot({
        path: shot(`r4-population-${level.toLowerCase()}-zoom.png`),
      });
      await page.close();
    }
    expect(facts.size).toBe(1);
    expect(classes.size).toBe(1);
    // Budżet osad rośnie z zoomem (więcej osad), ale każda osada widoczna na WORLD
    // ma na REGION i LOCAL tę samą klasę i wariant.
    const worldIds = identities[0]!.split(",");
    for (const other of identities.slice(1))
      for (const id of worldIds) expect(other.split(",")).toContain(id);

    // 6. Terrain vs Population: te same fakty i ta sama morfologia, inna warstwa informacji.
    const modes: Record<string, Record<string, string | null>> = {};
    for (const mode of ["terrain", "population"]) {
      const page = await openPage(
        app,
        server,
        `world.html?fixture=population-civilization&mode=${mode}&select=r3_civ_capital`,
        1920,
        1080,
      );
      await atlasReady(page, mode);
      modes[mode] = {
        identity: await atlasAttr(page, "data-settlement-identity"),
        classes: await atlasAttr(page, "data-settlement-classes"),
        facts: await atlasAttr(page, "data-population-facts"),
        legend: await page.getByTestId("atlas-legend").getAttribute("data-legend-mode"),
      };
      await page
        .getByTestId("atlas-legend")
        .screenshot({ path: shot(`r4-legend-${mode}.png`) });
      await page.close();
    }
    expect(modes.population!.identity).toBe(modes.terrain!.identity);
    expect(modes.population!.classes).toBe(modes.terrain!.classes);
    expect(modes.population!.facts).toBe(modes.terrain!.facts);
    expect(modes.terrain!.legend).toBe("terrain");
    expect(modes.population!.legend).toBe("population");

    const compare = await openPage(
      app,
      server,
      "compare.html?fixture=population-civilization&select=r3_civ_capital&left=terrain&right=population",
      2600,
      900,
    );
    for (const mode of ["terrain", "population"]) {
      const frame = compare.frameLocator(`iframe[data-mode="${mode}"]`);
      await expect(frame.getByTestId("living-atlas")).toHaveAttribute(
        "data-rendered-mode",
        mode,
      );
    }
    await compare.waitForTimeout(500);
    await compare.screenshot({ path: shot("r4-terrain-vs-population.png") });
    await compare.close();
  } finally {
    await app.close();
    await server.close();
  }
});
