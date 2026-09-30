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
  "../../docs/verification/world-r4b-trade-flowlens-2026-09-30",
);
/** Osobny katalog (Flow Lens + Chronicle); poprzednie dowody R4B nie są nadpisywane. */
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
  await expect(page.getByTestId("living-atlas")).toHaveAttribute(
    "data-rendered-mode",
    mode,
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          !!document.querySelector('[data-testid="living-atlas"] canvas') &&
          document
            .querySelector('[data-testid="living-atlas"]')!
            .hasAttribute("data-flow-lens"),
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

const lensSelect = (page: Page) => page.getByLabel(/Flow Lens/);

test("M21-VIS-R4B: Flow Lens in Trade does not compare quantities of different goods", async () => {
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
    const base = "world.html?fixture=trade&mode=trade&select=trade_b_delta";

    // 1. Zapamiętana soczewka „trade”: nieaktywna, nic nie rysuje, brak Top N.
    const page = await openPage(app, server, `${base}&lens=trade`, 1280, 800);
    await atlasReady(page, "trade");
    await expect(page.getByTestId("living-atlas")).toHaveAttribute(
      "data-flow-lens",
      "off",
    );
    await expect(page.getByTestId("living-atlas")).toHaveAttribute(
      "data-flow-count",
      "0",
    );
    const tradeOption = lensSelect(page).locator('option[value="trade"]');
    await expect(tradeOption).toHaveJSProperty("disabled", true);
    await expect(tradeOption).toHaveText("Trade (no common measure)");
    await expect(lensSelect(page)).toHaveValue("off");
    await expect(page.getByLabel("Flow limit")).toHaveCount(0);
    await expect(page.getByTestId("trade-flow-lens-note")).toContainText(
      "different goods have no common measure",
    );
    await page.screenshot({ path: shot("01-trade-flow-lens-1280x800.png") });
    await page.close();

    // 2. Wskazanie partnera nadal działa (relacja, nie porównanie ilości).
    const pair = await openPage(
      app,
      server,
      `${base}&lens=trade&good=flour&partner=trade_c_harbour`,
      1280,
      800,
    );
    await atlasReady(pair, "trade");
    await expect(pair.getByTestId("living-atlas")).toHaveAttribute(
      "data-trade-pair",
      "trade_b_delta|trade_c_harbour|export",
    );
    await expect(pair.getByTestId("living-atlas")).toHaveAttribute(
      "data-flow-count",
      "0",
    );
    await pair.screenshot({ path: shot("02-trade-flow-lens-partner-1280x800.png") });

    // 3. Inny tryb: soczewka Technologia działa; powrót do Handlu ją wyłącza.
    await pair
      .getByRole("tablist", { name: "Map mode" })
      .getByRole("tab", { name: "Technology" })
      .click();
    await atlasReady(pair, "technology");
    await lensSelect(pair).selectOption("technology");
    await expect(pair.getByTestId("living-atlas")).toHaveAttribute(
      "data-flow-lens",
      "technology",
    );
    await expect(pair.getByLabel("Flow limit")).toBeVisible();
    await expect(pair.getByTestId("living-atlas")).toHaveAttribute("data-trade-pair", "");
    await pair
      .getByRole("tablist", { name: "Map mode" })
      .getByRole("tab", { name: "Trade", exact: true })
      .click();
    await atlasReady(pair, "trade");
    await expect(pair.getByTestId("living-atlas")).toHaveAttribute(
      "data-flow-lens",
      "off",
    );
    await pair.close();
  } finally {
    await app.close();
    await server.close();
  }
});
