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
  "../../docs/verification/world-r4b-trade-followup-2026-09-30",
);
/** Osobny katalog follow-upu; poprzednie dowody R4B nie są nadpisywane. */
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
            .hasAttribute("data-trade-arrows-blocked"),
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

/** Żadna komórka tabel Handlu nie jest obcięta; strona bez poziomego przewijania. */
async function nothingClipped(page: Page) {
  const clipped = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        ".fc-trade__table th, .fc-trade__table td",
      ),
    ]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent),
  );
  expect(clipped).toEqual([]);
  expect(
    await page.evaluate(() => {
      const aside = document.querySelector<HTMLElement>(".fc-world__region")!;
      const table = document.querySelector<HTMLElement>('[data-testid="trade-table"]');
      return (
        (!table || table.scrollWidth <= aside.clientWidth) &&
        aside.scrollWidth <= aside.clientWidth &&
        document.documentElement.scrollWidth <= window.innerWidth
      );
    }),
  ).toBe(true);
}

/**
 * Nazwy towarów i partnerów łamią się tylko między wyrazami: każdy wyraz
 * mieści się w jednym prostokącie linii (brak „Coal Hollo|w”).
 */
async function noMidWordBreaks(page: Page) {
  const broken = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(
      ".fc-trade__table tbody th, .fc-trade__table thead th",
    )) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? "";
        for (const match of text.matchAll(/S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index!);
          range.setEnd(node, match.index! + match[0].length);
          const lines = new Set(
            [...range.getClientRects()].map((r) => Math.round(r.top)),
          );
          if (lines.size > 1) out.push(match[0]);
        }
      }
    }
    return out;
  });
  expect(broken).toEqual([]);
}

/** Rozmiar czcionki komórek tabeli nie jest zmniejszany w wąskim oknie. */
async function fontSizes(page: Page) {
  return page.evaluate(() => {
    const px = (sel: string) => getComputedStyle(document.querySelector(sel)!).fontSize;
    return {
      table: px(".fc-trade__table"),
      cell: px(".fc-trade__table tbody td"),
    };
  });
}

const mapModeTab = (page: Page, name: string) =>
  page.getByRole("tablist", { name: "Map mode" }).getByRole("tab", { name, exact: true });
const goodButton = (page: Page, goodId: string) =>
  page.locator(`tr[data-trade-good="${goodId}"] > th button`);
const cellTexts = (page: Page, goodId: string) =>
  page.locator(`tr[data-trade-good="${goodId}"] > td`).allTextContents();

test("M21-VIS-R4B follow-up: trade readability, no goods sum, real simulation trade, legacy save", async () => {
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
    const base = "world.html?fixture=trade&mode=trade&select=trade_b_delta";

    // 1, 2, 4. Widok domyślny: EN 1280×800, PL 1280×800, EN 1920×1080.
    let referenceFont: { table: string; cell: string } | undefined;
    for (const [width, height, lang, name] of [
      [1920, 1080, "en", "01-default-en-1920x1080.png"],
      [1280, 800, "en", "02-default-en-1280x800.png"],
      [1280, 800, "pl", "03-default-pl-1280x800.png"],
    ] as const) {
      const page = await openPage(app, server, `${base}&lang=${lang}`, width, height);
      await atlasReady(page, "trade");
      await expect(page.getByTestId("trade-period")).toBeVisible();
      await expect(page.getByTestId("trade-units")).toBeVisible();
      await expect(page.getByTestId("trade-help")).not.toHaveAttribute("open");
      await nothingClipped(page);
      await noMidWordBreaks(page);
      const font = await fontSizes(page);
      if (!referenceFont) referenceFont = font;
      expect(font).toEqual(referenceFont);
      await page.screenshot({ path: shot(name) });
      await page.close();
    }

    // 3. PL 1280×800: rozwinięci partnerzy (długie nagłówki zawinięte, nie ucięte).
    const pl = await openPage(app, server, `${base}&lang=pl`, 1280, 800);
    await atlasReady(pl, "trade");
    await goodButton(pl, "flour").click();
    const partners = pl.getByTestId("trade-partners");
    await expect(partners.locator(":scope > thead th")).toHaveText([
      "Partner",
      "Przywozi od niego",
      "Wysyła do niego",
    ]);
    await expect(partners.locator(":scope > tbody > tr")).toHaveCount(3);
    await nothingClipped(pl);
    await noMidWordBreaks(pl);
    expect(await fontSizes(pl)).toEqual(referenceFont);
    await partners.scrollIntoViewIfNeeded();
    await pl.screenshot({ path: shot("04-partners-pl-1280x800.png") });
    // Pomoc otwierana z klawiatury.
    await pl.getByTestId("trade-help").locator("summary").focus();
    await pl.keyboard.press("Enter");
    await expect(pl.getByTestId("trade-help")).toHaveAttribute("open", "");
    await pl.close();

    // 5. Długa lista po przewinięciu: kontekst regionu i miesiąca + nagłówki widoczne.
    const long = await openPage(
      app,
      server,
      "world.html?fixture=trade&mode=trade&select=trade_d_emporium",
      1280,
      800,
    );
    await atlasReady(long, "trade");
    await long
      .locator("tr[data-trade-good='dev_wool']")
      .evaluate((row) => row.scrollIntoView({ block: "end" }));
    const aside = (await long.locator(".fc-world__region").boundingBox())!;
    const table = (await long.getByTestId("trade-table").boundingBox())!;
    const context = (await long.getByTestId("trade-context").boundingBox())!;
    const header = (await long
      .locator(".fc-trade__table > thead > tr:last-child > th")
      .first()
      .boundingBox())!;
    expect(table.y).toBeLessThan(aside.y); // początek tabeli wyjechał ponad inspektor
    expect(context.y).toBeGreaterThanOrEqual(aside.y - 1);
    expect(header.y).toBeGreaterThanOrEqual(context.y + context.height - 1);
    expect(header.y + header.height).toBeLessThanOrEqual(aside.y + 90);
    await expect(long.getByTestId("trade-context")).toHaveText(
      "Emporium · year 3, month 2",
    );
    await nothingClipped(long);
    await noMidWordBreaks(long);
    await long.screenshot({ path: shot("05-long-list-scrolled-1280x800.png") });
    await long.close();

    // 6. Dane częściowe: „at least 14” i znana ilość przy nieznanym partnerze.
    const partial = await openPage(
      app,
      server,
      "world.html?fixture=trade&mode=trade&select=trade_h_marsh",
      1280,
      800,
    );
    await atlasReady(partial, "trade");
    expect(await cellTexts(partial, "grain")).toEqual(["at least 14", "0"]);
    expect(await cellTexts(partial, "timber")).toEqual(["9", "0"]);
    await goodButton(partial, "timber").click();
    await expect(partial.getByTestId("trade-partners")).toContainText("Partner unknown");
    await expect(partial.getByTestId("trade-panel")).not.toContainText("≥");
    await nothingClipped(partial);
    await noMidWordBreaks(partial);
    await partial.screenshot({ path: shot("06-partial-data-1280x800.png") });
    await partial.close();

    // 7. Wskazany partner: przywóz, wywóz, oba kierunki; 1280/1920 i poziomy zoomu --
    //    grot nigdy nie stoi na etykiecie regionu.
    for (const [partner, good, pair, width, height, zoom, name] of [
      [
        "trade_c_harbour",
        "flour",
        "export",
        1920,
        1080,
        1,
        "07-pair-export-1920x1080.png",
      ],
      ["trade_a_hills", "flour", "import", 1280, 800, 1, "08-pair-import-1280x800.png"],
      [
        "trade_f_mines",
        "flour",
        "import+export",
        1920,
        1080,
        1,
        "09-pair-both-1920x1080.png",
      ],
      [
        "trade_f_mines",
        "flour",
        "import+export",
        1280,
        800,
        1.6,
        "10-pair-both-zoom-1280x800.png",
      ],
      ["trade_c_harbour", "flour", "export", 1280, 800, 0.6, null],
      ["trade_a_hills", "flour", "import", 1920, 1080, 2.2, null],
    ] as const) {
      const page = await openPage(
        app,
        server,
        `${base}&good=${good}&partner=${partner}&zoom=${zoom}`,
        width,
        height,
      );
      await atlasReady(page, "trade");
      await expect(page.getByTestId("living-atlas")).toHaveAttribute(
        "data-trade-pair",
        `trade_b_delta|${partner}|${pair}`,
      );
      await page.screenshot({
        path: name
          ? shot(name)
          : test.info().outputPath(`pair-${partner}-${width}-zoom-${zoom}.png`),
      });
      expect(await atlasAttr(page, "data-trade-arrows-blocked")).toBe("0");
      await page.close();
    }

    // 8. Top Regions / Δ Change po poprawce: brak sumy różnych towarów.
    const ranking = await openPage(app, server, base, 1920, 1080);
    await atlasReady(ranking, "trade");
    await ranking.locator(".fc-world__ranking > summary").click();
    await expect(ranking.getByTestId("ranking-empty")).toHaveText(
      "Different goods cannot be summed into one number — regional trade is in the table in the region panel.",
    );
    await expect(ranking.locator(".fc-world__ranking ol li")).toHaveCount(0);
    await ranking.locator(".fc-world__ranking").scrollIntoViewIfNeeded();
    await ranking.screenshot({
      path: shot("11-top-regions-trade-1920x1080.png"),
      fullPage: true,
    });
    await mapModeTab(ranking, "Δ Change").click();
    await atlasReady(ranking, "change");
    const tradeOption = ranking
      .getByLabel("Change in", { exact: true })
      .locator('option[value="trade"]');
    await expect(tradeOption).toHaveJSProperty("disabled", true);
    await expect(tradeOption).toHaveText("Trade (no common measure)");
    await ranking.close();

    // 9. Handel z produkcyjnego ticka scenariusza: importer i eksporter.
    for (const [region, cells, name] of [
      ["scenario_market_coast", "import", "12-simulation-importer-1920x1080.png"],
      ["scenario_grain_basin", "export", "13-simulation-exporter-1920x1080.png"],
    ] as const) {
      const sim = await openPage(
        app,
        server,
        `world.html?fixture=trade-sim&mode=trade&select=${region}&good=flour`,
        1920,
        1080,
      );
      await atlasReady(sim, "trade");
      await expect(sim.getByTestId("trade-period")).toHaveText(
        "Last completed month: year 1, month 1",
      );
      const [imports, exports] = await cellTexts(sim, "flour");
      expect(cells === "import" ? exports : imports).toBe("0");
      expect(Number(cells === "import" ? imports : exports)).toBeGreaterThan(0);
      await expect(sim.getByTestId("trade-partners")).toBeVisible();
      await sim.screenshot({ path: shot(name) });
      await sim.close();
    }

    // 10. Starszy zapis (po migracji v2 → v3): brak danych + ostrzeżenie, nie ilość oceniona.
    const legacy = await openPage(
      app,
      server,
      "world.html?fixture=trade-legacy&mode=trade&select=scenario_market_coast&good=flour",
      1920,
      1080,
    );
    await atlasReady(legacy, "trade");
    expect(await cellTexts(legacy, "flour")).toEqual(["no data", "0"]);
    await expect(legacy.locator('[data-trade-warning="legacy"]')).toBeVisible();
    await legacy.screenshot({ path: shot("14-legacy-save-1920x1080.png") });
    await legacy.close();
  } finally {
    await app.close();
    await server.close();
  }
});
