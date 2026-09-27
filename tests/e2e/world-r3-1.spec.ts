import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
} from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainEntry = path.resolve(__dirname, "../../apps/desktop/out/main/index.js");
const OUT = path.resolve(__dirname, "../../docs/verification/world-r3-1-2026-09-27");
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

async function atlasReady(page: Awaited<ReturnType<typeof openPage>>) {
  await expect(page.getByTestId("world-screen")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const host = document.querySelector<HTMLElement>('[data-testid="living-atlas"]');
        return (
          !!host?.querySelector("canvas") && host.hasAttribute("data-settlement-classes")
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

test("M21-VIS-R3.1: town vs city morphology and megacity axes -- acceptance material", async () => {
  test.setTimeout(180_000);
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

    // 1. Pełny arkusz: 10 → 10M+, warianty A/B/C oraz WORLD / LOCAL.
    const sheet = await openPage(app, server, "morphology.html", 1300, 1080);
    await expect(sheet.locator("svg[data-cls]")).toHaveCount(35);
    await sheet.screenshot({ path: shot("r3-1-morphology-sheet.png"), fullPage: true });
    await sheet.close();

    // 4. Town ~10k / City ~100k / Metropolis ~1M -- ta sama skala i poziom szczegółu.
    const tiers = await openPage(
      app,
      server,
      "morphology.html?pops=12000,120000,1200000",
      1300,
      1080,
    );
    await expect(tiers.locator("svg[data-cls]")).toHaveCount(15);
    const tierClasses = await tiers
      .locator("svg[data-cls]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-cls")));
    expect([...new Set(tierClasses)]).toEqual(["town", "city", "metropolis"]);
    await tiers.screenshot({ path: shot("r3-1-town-vs-city.png"), fullPage: true });
    await tiers.close();

    // 5. Trzy warianty Megacity ~10M+ w skali pozwalającej ocenić osie.
    const mega = await openPage(
      app,
      server,
      "morphology.html?pops=12000000&cols=variants",
      800,
      400,
    );
    await expect(mega.locator('svg[data-cls="megacity"]')).toHaveCount(3);
    await mega.screenshot({ path: shot("r3-1-megacity-axis-check.png"), fullPage: true });
    await mega.close();

    // 2. Drabina na Atlasie (1920×1080).
    const ladder = await openPage(app, server, "world.html?fixture=ladder", 1920, 1080);
    await atlasReady(ladder);
    await expect(ladder.getByTestId("living-atlas")).toHaveAttribute(
      "data-settlement-classes",
      "hamlet,village,town,city,metropolis,megacity",
    );
    await ladder.screenshot({ path: shot("r3-1-fixture-ladder-10-to-10M.png") });
    await ladder.close();

    // 3. Świat z kilkoma centrami (1920×1080).
    const civ = await openPage(
      app,
      server,
      "world.html?fixture=civilization",
      1920,
      1080,
    );
    await atlasReady(civ);
    expect(
      await civ.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await civ.screenshot({ path: shot("r3-1-civilization-1920x1080.png") });
    await civ.close();
  } finally {
    await app.close();
    await server.close();
  }
});
