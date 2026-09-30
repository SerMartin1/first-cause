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
const OUT = path.resolve(__dirname, "../../docs/verification/world-r4b-trade-2026-09-30");
/**
 * Zestaw do akceptacji w `docs/` tylko na żądanie (`FC_WRITE_VERIFICATION=1`);
 * zestawy R1--R4 i lifecycle nie są nadpisywane (osobny katalog R4B Handel).
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
            .hasAttribute("data-trade-good"),
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

/** Tabela mieści się w inspektorze (brak obcinania), strona bez poziomego przewijania. */
async function tableFits(page: Page) {
  expect(
    await page.evaluate(() => {
      const aside = document.querySelector<HTMLElement>(".fc-world__region")!;
      const table = document.querySelector<HTMLElement>('[data-testid="trade-table"]');
      return (
        (!table || table.scrollWidth <= aside.clientWidth) &&
        document.documentElement.scrollWidth <= window.innerWidth
      );
    }),
  ).toBe(true);
}

const mapModeTab = (page: Page, name: string) =>
  page.getByRole("tablist", { name: "Map mode" }).getByRole("tab", { name });
const goodButton = (page: Page, goodId: string) =>
  page.locator(`tr[data-trade-good="${goodId}"] button`);

test("M21-VIS-R4B: trade by goods table with partner details -- acceptance material", async () => {
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

    // 1. Tabela domyślna: 1920×1080, 1280×800 (EN) i 1280×800 (PL).
    for (const [width, height, lang] of [
      [1920, 1080, "en"],
      [1280, 800, "en"],
      [1280, 800, "pl"],
    ] as const) {
      const page = await openPage(
        app,
        server,
        `world.html?fixture=trade&mode=trade&select=trade_b_delta&lang=${lang}`,
        width,
        height,
      );
      await atlasReady(page, "trade");
      const panel = page.getByTestId("trade-panel");
      await expect(panel).toHaveAttribute("data-trade-status", "RECORDED");
      await expect(panel.locator("tbody tr[data-trade-good]")).toHaveCount(6);
      // Domyślnie Atlas bez wyróżnień handlu i bez strzałek przepływów.
      expect(await atlasAttr(page, "data-trade-good")).toBe("");
      expect(await atlasAttr(page, "data-trade-pair")).toBe("");
      await expect(page.getByTestId("trade-legend")).toBeVisible();
      await tableFits(page);
      await page.screenshot({
        path: shot(
          `r4b-trade-default-${width}x${height}${lang === "pl" ? "-pl" : ""}.png`,
        ),
      });
      await page.close();
    }

    // 2. Rozwinięcie klawiaturą: partnerzy pod towarem, pozostałe towary zostają; Atlas
    //    podświetla rzeczywistych partnerów; ponowne naciśnięcie zwija.
    const page = await openPage(
      app,
      server,
      "world.html?fixture=trade&mode=trade&select=trade_b_delta",
      1920,
      1080,
    );
    await atlasReady(page, "trade");
    const identityTrade = await atlasAttr(page, "data-settlement-identity");
    await goodButton(page, "grain").focus();
    await page.keyboard.press("Enter");
    await expect(goodButton(page, "grain")).toHaveAttribute("aria-expanded", "true");
    const partners = page.getByTestId("trade-partners");
    await expect(partners.locator(":scope > tbody > tr")).toHaveCount(2);
    await expect(page.locator("tbody tr[data-trade-good]")).toHaveCount(6);
    await expect(page.getByTestId("living-atlas")).toHaveAttribute(
      "data-trade-partners",
      "trade_a_hills,trade_c_harbour",
    );
    expect(await atlasAttr(page, "data-trade-pair")).toBe("");
    await page.screenshot({ path: shot("r4b-trade-expanded-partners.png") });
    await page.keyboard.press("Space");
    await expect(goodButton(page, "grain")).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("living-atlas")).toHaveAttribute("data-trade-good", "");

    // 3. Wskazany partner: kierunek wymiany na Atlasie, główny wybór bez zmian.
    await goodButton(page, "dev_tools").click();
    await partners.getByRole("button", { name: "Salt Harbour" }).click();
    await expect(page.getByTestId("living-atlas")).toHaveAttribute(
      "data-trade-pair",
      "trade_b_delta|trade_c_harbour|export",
    );
    await expect(page.locator(".fc-world__region-picker select")).toHaveValue(
      "trade_b_delta",
    );
    await page.screenshot({ path: shot("r4b-trade-partner-atlas.png") });
    await partners.getByRole("button", { name: "Green Hills" }).click();
    await expect(page.getByTestId("living-atlas")).toHaveAttribute(
      "data-trade-pair",
      "trade_b_delta|trade_a_hills|import",
    );

    // 4. Zmiana trybu usuwa wyróżnienia; morfologia osad identyczna w Handlu i poza nim.
    await mapModeTab(page, "Population").click();
    await atlasReady(page, "population");
    expect(await atlasAttr(page, "data-trade-good")).toBe("");
    expect(await atlasAttr(page, "data-trade-pair")).toBe("");
    expect(await atlasAttr(page, "data-settlement-identity")).toBe(identityTrade);
    await mapModeTab(page, "Terrain").click();
    await atlasReady(page, "terrain");
    expect(await atlasAttr(page, "data-trade-partners")).toBe("");
    expect(await atlasAttr(page, "data-settlement-identity")).toBe(identityTrade);

    // 5. Zmiana wybranego regionu usuwa szczegóły poprzedniego.
    await mapModeTab(page, "Trade").click();
    await atlasReady(page, "trade");
    await goodButton(page, "dev_tools").click();
    await page
      .getByTestId("trade-partners")
      .getByRole("button", { name: "Salt Harbour" })
      .click();
    await expect(page.getByTestId("living-atlas")).toHaveAttribute(
      "data-trade-pair",
      "trade_b_delta|trade_c_harbour|export",
    );
    await page.locator(".fc-world__region-picker select").selectOption("trade_c_harbour");
    await expect(page.getByTestId("trade-panel")).toHaveAttribute(
      "data-trade-region",
      "trade_c_harbour",
    );
    await expect(page.getByTestId("living-atlas")).toHaveAttribute("data-trade-pair", "");
    await expect(page.getByTestId("trade-partners")).toHaveCount(0);
    await page.close();

    // 6. Brak handlu / brak danych / dane częściowe.
    for (const [region, name, testId] of [
      ["trade_e_quiet", "r4b-trade-no-trade.png", "trade-no-trade"],
      ["trade_g_frontier", "r4b-trade-no-data.png", "trade-no-data"],
      ["trade_h_marsh", "r4b-trade-partial.png", "trade-partial"],
    ] as const) {
      const state = await openPage(
        app,
        server,
        `world.html?fixture=trade&mode=trade&select=${region}`,
        1920,
        1080,
      );
      await atlasReady(state, "trade");
      await expect(state.getByTestId(testId)).toBeVisible();
      await expect(state.getByTestId("trade-panel")).not.toContainText("NaN");
      await state.screenshot({ path: shot(name) });
      await state.close();
    }

    // 7. Długa lista przy 1280×800: przewinięty inspektor, nagłówek tabeli widoczny.
    const long = await openPage(
      app,
      server,
      "world.html?fixture=trade&mode=trade&select=trade_d_emporium",
      1280,
      800,
    );
    await atlasReady(long, "trade");
    await expect(long.locator("tbody tr[data-trade-good]")).toHaveCount(31);
    await tableFits(long);
    // Ostatni towar przewinięty do dołu inspektora: początek tabeli jest nad krawędzią
    // obszaru przewijania, a przyklejony nagłówek zostaje u jego góry.
    await long
      .locator("tr[data-trade-good='dev_wool']")
      .evaluate((row) => row.scrollIntoView({ block: "end" }));
    const aside = await long.locator(".fc-world__region").boundingBox();
    const table = await long.getByTestId("trade-table").boundingBox();
    const header = await long
      .locator(".fc-trade__table > thead th")
      .first()
      .boundingBox();
    expect(aside && table && header).toBeTruthy();
    expect(table!.y).toBeLessThan(aside!.y);
    expect(header!.y).toBeGreaterThanOrEqual(aside!.y - 1);
    expect(header!.y + header!.height).toBeLessThanOrEqual(aside!.y + 60);
    await expect(long.locator("tr[data-trade-good='dev_wool']")).toBeInViewport();
    await long.screenshot({ path: shot("r4b-trade-long-list-1280x800.png") });
    await long.close();
  } finally {
    await app.close();
    await server.close();
  }
});
