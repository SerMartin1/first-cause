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
const OUT = path.resolve(
  __dirname,
  "../../docs/verification/settlement-lifecycle-2026-09-29",
);
/**
 * Zestaw do akceptacji w `docs/` tylko na żądanie (`FC_WRITE_VERIFICATION=1`);
 * zestawy R1--R4.1 nie są nadpisywane (osobny katalog SET-LIFECYCLE-001).
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

test("SET-LIFECYCLE-001: settlement extinction on the Atlas -- real tick path", async () => {
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
    const pulseSettlements = (page: Page) =>
      page
        .getByLabel("World Pulse")
        .locator("div, dl > *")
        .filter({ hasText: /^Settlements/ })
        .first()
        .textContent();
    const results: Record<string, Record<string, string | null>> = {};
    for (const phase of ["before", "after"] as const) {
      const page = await openPage(
        app,
        server,
        `world.html?fixture=extinction-${phase}&mode=population`,
        1920,
        1080,
      );
      await atlasReady(page, "population");
      results[phase] = {
        classes: await atlasAttr(page, "data-settlement-classes"),
        identity: await atlasAttr(page, "data-settlement-identity"),
        states: await atlasAttr(page, "data-population-states"),
        facts: await atlasAttr(page, "data-population-facts"),
        pulse: await pulseSettlements(page),
      };
      await page.screenshot({ path: shot(`settlement-extinction-${phase}.png`) });
      await page.close();
    }
    const before = results.before!,
      after = results.after!;
    // Przed: Old Haven (1 mieszkaniec) jest aktywną osadą z morfologią.
    expect(before.identity).toContain("lifecycle_old_haven:");
    expect(before.states).toContain("lifecycle_old_haven_coast=populated");
    // Po: aktywna morfologia znika, region zostaje i pokazuje 0 · uninhabited.
    expect(after.identity).not.toContain("lifecycle_old_haven:");
    expect(after.states).toContain("lifecycle_old_haven_coast=zero");
    expect(after.facts).toContain("lifecycle_old_haven_coast=0");
    expect(after.classes).not.toContain("hamlet");
    // SETTLEMENTS spada o jedną osadę.
    expect(before.pulse).toMatch(/Settlements\s*2/);
    expect(after.pulse).toMatch(/Settlements\s*1/);
  } finally {
    await app.close();
    await server.close();
  }
});
