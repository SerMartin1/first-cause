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
const OUT = path.resolve(__dirname, "../../docs/verification/world-r4b-economy-2026-09-30");
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
      page.evaluate(() => !!document.querySelector('[data-testid="living-atlas"] canvas')),
    )
    .toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

/** Ta sama prezentacja co `formatEmploymentFull` (EN): obcięcie do 1 miejsca, „<1” dla ułamka osoby. */
const people = (value: number) =>
  value > 0 && value < 1
    ? "<1"
    : new Intl.NumberFormat("en", {
        maximumFractionDigits: 1,
        roundingMode: "trunc",
      } as Intl.NumberFormatOptions).format(value);

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const mapModeTab = (page: Page, name: string) =>
  page.getByRole("tablist", { name: "Map mode" }).getByRole("tab", { name });

const LEGEND = {
  en: [">0–<10", "10–<100", "100–<1K", "1K–<10K", "≥10K"],
  pl: [">0–<10", "10–<100", "100–<1 tys.", "1 tys.–<10 tys.", "≥10 tys."],
} as const;

/** Klasy z fixture'u `economy`: zatrudnienie per region; Reed Marsh = brak danych. */
const FIXTURE_CLASSES = [
  "econ_a_hills=1",
  "econ_b_delta=4",
  "econ_c_harbour=3",
  "econ_d_emporium=5",
  "econ_e_quiet=0",
  "econ_f_mines=2",
  "econ_g_frontier=0",
  "econ_h_marsh=none",
].join(",");

test("M21-VIS-R4B: Economy -- employment in companies, acceptance material", async () => {
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

    // 1. 1920×1080 i 1280×800, PL i EN, bez zaznaczenia i z zaznaczonym regionem.
    for (const [width, height] of [
      [1920, 1080],
      [1280, 800],
    ] as const)
      for (const lang of ["pl", "en"] as const)
        for (const selected of [false, true]) {
          const page = await openPage(
            app,
            server,
            `world.html?fixture=economy&mode=economy&lang=${lang}${selected ? "&select=econ_b_delta" : ""}`,
            width,
            height,
          );
          await atlasReady(page, "economy");
          expect(await atlasAttr(page, "data-economy-classes")).toBe(FIXTURE_CLASSES);
          await expect(page.getByTestId("economy-legend")).toBeVisible();
          const legendClasses = page.locator(
            '[data-testid="economy-legend"] [data-economy-class]',
          );
          await expect(legendClasses).toHaveCount(5);
          // Rozłączne zakresy = dokładnie klasy `economyClass` (bez „10–99”, „10K+”).
          expect(
            (await legendClasses.allTextContents()).map((l) => l.replace(/\s/g, " ")),
          ).toEqual(LEGEND[lang]);
          await expect(page.locator('[data-economy-legend-state="zero"]')).toBeVisible();
          await expect(
            page.locator('[data-economy-legend-state="unavailable"]'),
          ).toBeVisible();
          if (selected) {
            await expect(page.getByTestId("economy-panel")).toBeVisible();
            expect(await atlasAttr(page, "data-selection-marker")).toBe("brackets");
          }
          expect(await noHorizontalScroll(page)).toBe(true);
          const name = `r4b-economy-${selected ? "selected" : "default"}-${width}x${height}-${lang}.png`;
          await page.screenshot({ path: shot(name) });
          if (selected) {
            await page.locator(".fc-world__ranking summary").click();
            await page.locator(".fc-world__ranking").scrollIntoViewIfNeeded();
            await expect(page.locator("[data-economy-rank]")).toHaveCount(5);
            await page.screenshot({ path: shot(name.replace(".png", "-ranking.png")) });
          }
          await page.close();
        }

    // 2. Zero i brak danych w zaznaczonym regionie; brak ceny = „—”.
    for (const [region, name] of [
      ["econ_g_frontier", "r4b-economy-zero-1280x800-pl.png"],
      ["econ_h_marsh", "r4b-economy-no-data-1280x800-pl.png"],
      ["econ_f_mines", "r4b-economy-no-price-1280x800-pl.png"],
    ] as const) {
      const page = await openPage(
        app,
        server,
        `world.html?fixture=economy&mode=economy&lang=pl&select=${region}`,
        1280,
        800,
      );
      await atlasReady(page, "economy");
      await expect(page.getByTestId("economy-panel")).toBeVisible();
      await page.screenshot({ path: shot(name) });
      await page.close();
    }

    // 3. Zoom: klasa nie zależy od zoomu (fakt, nie detal); etykiety wg budżetu.
    for (const zoom of [0.6, 2]) {
      const page = await openPage(
        app,
        server,
        `world.html?fixture=economy&mode=economy&lang=pl&zoom=${zoom}${zoom === 2 ? "&select=econ_d_emporium" : ""}`,
        zoom === 2 ? 1920 : 1280,
        zoom === 2 ? 1080 : 800,
      );
      await atlasReady(page, "economy");
      expect(await atlasAttr(page, "data-economy-classes")).toBe(FIXTURE_CLASSES);
      await page.screenshot({
        path: shot(`r4b-economy-zoom-${zoom === 2 ? "in-selected-1920x1080" : "out-1280x800"}-pl.png`),
      });
      await page.close();
    }

    // 4. Słaba gospodarka (rząd wielkości Black Mountain): lider rankingu w klasie 1.
    {
      const page = await openPage(
        app,
        server,
        "world.html?fixture=economy-low&mode=economy&lang=pl&select=econ_b_delta",
        1280,
        800,
      );
      await atlasReady(page, "economy");
      expect(await atlasAttr(page, "data-economy-classes")).toContain("econ_b_delta=1");
      await page.screenshot({ path: shot("r4b-economy-low-1280x800-pl.png") });
      await page.close();
    }

    // 5. Tryb zmienia warstwę informacji, nie osadę: morfologia identyczna w Terrain i Economy.
    {
      const page = await openPage(
        app,
        server,
        "world.html?fixture=economy&mode=terrain&select=econ_b_delta",
        1920,
        1080,
      );
      await atlasReady(page, "terrain");
      const identity = await atlasAttr(page, "data-settlement-identity");
      expect(await atlasAttr(page, "data-economy-classes")).toBe("");
      await mapModeTab(page, "Economy").click();
      await atlasReady(page, "economy");
      expect(await atlasAttr(page, "data-settlement-identity")).toBe(identity);
      // Wejście w tryb otwiera zakładkę Gospodarka.
      await expect(page.getByTestId("economy-panel")).toBeVisible();
      // Δ Change: opcja „Employment in companies” zamiast dawnej produkcji.
      await mapModeTab(page, "Δ Change").click();
      await atlasReady(page, "change");
      const changeIn = page.getByLabel("Change in", { exact: true });
      await expect(changeIn.locator('option[value="employment"]')).toHaveText(
        "Employment in companies",
      );
      await expect(changeIn.locator('option[value="production"]')).toHaveCount(0);
      await page.close();
    }

    // 5b. World Pulse: dane kompletne, częściowe (bez i z historią) i niedostępne;
    // tabela produkcji częściowa po zmianie metody (Salt Harbour). Dane deweloperskie.
    for (const [width, height] of [
      [1920, 1080],
      [1280, 800],
    ] as const)
      for (const lang of ["pl", "en"] as const) {
        for (const [variant, coverage, delta] of [
          ["complete", "complete", "known"],
          ["partial", "partial", "NO_HISTORY"],
          ["partial-history", "partial", "INCOMPLETE_DATA"],
          ["none", "unavailable", "NO_HISTORY"],
        ] as const) {
          const page = await openPage(
            app,
            server,
            `world.html?fixture=economy&pulse=${variant}&mode=economy&lang=${lang}`,
            width,
            height,
          );
          await atlasReady(page, "economy");
          const employment = page.getByTestId("pulse-employment");
          await expect(employment).toHaveAttribute("data-pulse-coverage", coverage);
          await expect(employment).toHaveAttribute("data-pulse-delta", delta);
          if (variant === "none")
            await expect(employment.locator("[data-pulse-value]")).toHaveText("—");
          if (coverage === "partial")
            await expect(employment.locator("[data-pulse-partial]")).toBeVisible();
          // Pulse mieści się w pasku (bez przewijania i przycięcia).
          expect(await noHorizontalScroll(page)).toBe(true);
          expect(
            await employment.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          ).toBe(true);
          // Ostatnia wartość Pulse kończy się przed przyciskami prędkości (bez nachodzenia).
          expect(
            await page.evaluate(() => {
              const items = [...document.querySelectorAll(".fc-world__pulse > div")];
              const right = Math.max(...items.map((el) => el.getBoundingClientRect().right));
              return right <= document.querySelector(".fc-world__speed")!.getBoundingClientRect().left;
            }),
          ).toBe(true);
          await page.screenshot({
            path: shot(`r4b-economy-pulse-${variant}-${width}x${height}-${lang}.png`),
          });
          await page.locator(".fc-world__bar").screenshot({
            path: shot(`r4b-economy-pulse-${variant}-bar-${width}x${height}-${lang}.png`),
          });
          await page.close();
        }
        const page = await openPage(
          app,
          server,
          `world.html?fixture=economy&mode=economy&lang=${lang}&select=econ_c_harbour`,
          width,
          height,
        );
        await atlasReady(page, "economy");
        await expect(page.getByTestId("economy-goods")).toHaveAttribute(
          "data-economy-goods-coverage",
          "partial",
        );
        await expect(page.getByTestId("economy-method-changed")).toBeVisible();
        await page.screenshot({
          path: shot(`r4b-economy-method-changed-${width}x${height}-${lang}.png`),
        });
        await page.close();
      }

    // 6. Prawdziwa gra (Black Mountain przez standardowy worker symulacji).
    const game = await app.firstWindow();
    await game.setViewportSize({ width: 1280, height: 800 });
    await expect(game.getByTestId("world-screen")).toBeVisible();
    const pulse = game.getByLabel("World Pulse");
    await expect(pulse.getByText("Employed in companies")).toBeVisible();
    await expect(pulse.getByText(/Production/)).toHaveCount(0);
    await mapModeTab(game, "Economy").click();
    await atlasReady(game, "economy");
    expect(await atlasAttr(game, "data-economy-classes")).not.toContain("none");
    await game.screenshot({ path: shot("r4b-economy-game-black-mountain-1280x800.png") });

    // 7. Rzeczywista aktualizacja świata: krok standardowym sterowaniem gry, nowy
    // snapshot workera, zgodność Read Model ↔ World Pulse ↔ inspektor.
    const readView = (years = 1) =>
      game.evaluate((y) => window.firstCauseWorld.getWorld(y), years);
    type Snapshot = Awaited<ReturnType<typeof readView>>["current"];
    const employmentSum = (world: Snapshot) =>
      world.regions.reduce((sum, r) => sum + r.economy.employment, 0);
    const employment = game.getByTestId("pulse-employment");
    const before = await readView();
    const t0 = before.current.summary.currentTick;
    expect(before.liveTick).toBe(t0);
    // Symulacja zna zatrudnienie każdego regionu: suma kompletna.
    for (const r of before.current.regions)
      expect(Number.isFinite(r.economy.employment), r.regionId).toBe(true);
    await expect(employment).toHaveAttribute("data-pulse-coverage", "complete");
    await expect(employment.locator("[data-pulse-value]")).toHaveText(
      people(employmentSum(before.current)),
    );
    // Start sesji: brak historii dla okna 1 roku → Δ niedostępna (nie 0).
    expect(before.baseline).toBeUndefined();
    await expect(employment).toHaveAttribute("data-pulse-delta", "NO_HISTORY");
    await expect(employment.locator("[data-pulse-delta-value]")).toHaveText("Δ —");

    // Historia = snapshot co tick, punkt odniesienia okna 1 roku = tick − 12:
    // „Advance 1 year” (12 ticków) jest najkrótszym krokiem, po którym istnieje.
    const advance = game.getByRole("button", { name: "Advance 1 year" });
    await advance.click();
    await expect(advance).toBeEnabled();
    await expect(game.locator(".fc-world__clock")).toContainText(`Tick ${t0 + 12}`);
    const after = await readView();
    expect(after.current.summary.currentTick).toBe(t0 + 12);
    expect(after.liveTick).toBe(t0 + 12);
    // Rzeczywisty historyczny punkt odniesienia: snapshot sprzed kroku.
    expect(after.baseline?.summary.currentTick).toBe(t0);
    expect(employmentSum(after.baseline!)).toBe(employmentSum(before.current));
    const now = employmentSum(after.current);
    const delta = now - employmentSum(after.baseline!);
    await expect(employment).toHaveAttribute("data-pulse-coverage", "complete");
    await expect(employment.locator("[data-pulse-value]")).toHaveText(people(now));
    await expect(employment).toHaveAttribute("data-pulse-delta", "known");
    await expect(employment.locator("[data-pulse-delta-value]")).toHaveText(
      `${delta > 0 ? "+" : delta < 0 ? "-" : ""}${people(Math.abs(delta))}`,
    );

    // Inspektor: region z największą liczbą aktywnych firm (lub pierwszy).
    const region = [...after.current.regions].sort(
      (a, b) =>
        b.economy.activeCompanies - a.economy.activeCompanies ||
        a.regionId.localeCompare(b.regionId),
    )[0]!;
    await game.locator(".fc-world__region-picker select").selectOption(region.regionId);
    const panel = game.getByTestId("economy-panel");
    await expect(panel).toHaveAttribute("data-economy-region", region.regionId);
    const employmentFact = panel.locator('[data-economy-fact="employment"]');
    await expect(employmentFact).toHaveAttribute("data-economy-state", "known");
    await expect(employmentFact.locator(".fc-data")).toHaveText(
      people(region.economy.employment),
    );
    // Okres produkcji i sprzedaży = ostatni zakończony miesiąc (tick − 1).
    const date = after.current.summary.currentDate;
    const period =
      date.month === 1 ? { year: date.year - 1, month: 12 } : { ...date, month: date.month - 1 };
    await expect(panel.getByTestId("economy-period")).toContainText(
      `year ${period.year}, month ${period.month}`,
    );
    if (region.economy.sales.status === "RECORDED")
      expect(region.economy.sales.tick).toBe(after.current.summary.currentTick - 1);
    const salesState = await panel
      .locator('[data-economy-fact="sales"]')
      .getAttribute("data-economy-state");
    expect(salesState).toBe(
      region.economy.sales.status === "RECORDED" ? "known" : region.economy.sales.reason,
    );
    // Produkcja według towarów: te same towary co Read Model, bez wiersza sumy.
    if (region.economy.goods.length > 0)
      await expect(panel.locator("[data-economy-good]")).toHaveCount(
        region.economy.goods.length,
      );
    await game.screenshot({ path: shot("r4b-economy-game-after-year-1280x800.png") });

    // Okno 5 lat po roku gry: historia niedostępna → Δ „—”, nie 0 ani fałszywa zmiana.
    const compare = game.getByLabel("Compare");
    await compare.selectOption("5");
    expect((await readView(5)).baseline).toBeUndefined();
    await expect(employment).toHaveAttribute("data-pulse-delta", "NO_HISTORY");
    await expect(employment.locator("[data-pulse-delta-value]")).toHaveText("Δ —");
    await compare.selectOption("1");
    await expect(employment).toHaveAttribute("data-pulse-delta", "known");
  } finally {
    await app.close();
    await server.close();
  }
});
