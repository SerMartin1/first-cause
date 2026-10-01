import path from "node:path";
import { readFileSync } from "node:fs";
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
/** Screenshoty R3 trafiają wprost do dokumentacji weryfikacji (do akceptacji właściciela). */
const OUT = path.resolve(__dirname, "../../docs/verification/world-r3-2026-09-27");
/**
 * Zatwierdzony zestaw R3 w `docs/` nadpisujemy tylko świadomie
 * (`FC_WRITE_VERIFICATION=1`); zwykły `test:e2e` pisze do test-results.
 */
const shot = (name: string) =>
  process.env.FC_WRITE_VERIFICATION ? path.join(OUT, name) : test.info().outputPath(name);
const R2_REFERENCE = path.resolve(
  __dirname,
  "../../docs/verification/world-r2-2026-09-26/r2-fixture-1920x1080-world-none.png",
);

async function atlasSettled(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const host = document.querySelector<HTMLElement>('[data-testid="living-atlas"]');
        const canvas = host?.querySelector("canvas");
        return (
          !!host &&
          !!canvas &&
          host.hasAttribute("data-semantic-zoom") &&
          host.hasAttribute("data-settlement-classes") &&
          Math.abs(canvas.clientWidth - host.clientWidth) < 2 &&
          Math.abs(canvas.clientHeight - host.clientHeight) < 2
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

function noHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

const settlementClasses = (page: Page) =>
  page.getByTestId("living-atlas").getAttribute("data-settlement-classes");

/** Elementy kompozycji R1 mieszczą się w prawdziwym viewporcie (bez fullPage). */
async function layoutInsideViewport(page: Page) {
  return page.evaluate(() => {
    const inside = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return `${selector}: missing`;
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= window.innerWidth + 1 && r.top >= 0
        ? "ok"
        : `${selector}: outside`;
    };
    return [
      inside('[data-testid="living-atlas"]'),
      inside(".fc-atlas__legend"),
      inside(".fc-world__region"),
    ];
  });
}

async function openFixture(
  app: ElectronApplication,
  server: ViteDevServer,
  fixture: string,
  width: number,
  height: number,
): Promise<Page> {
  const url = `${server.resolvedUrls!.local[0]}visual-tests/world.html?fixture=${fixture}`;
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
  await expect(page.getByTestId("world-screen")).toBeVisible();
  await atlasSettled(page);
  return page;
}

test("M21-VIS-R3: Black Mountain WORLD at 1920×1080 and 1280×800 (real viewport, EN ↔ PL)", async () => {
  test.setTimeout(120_000);
  const app = await electron.launch({ args: [mainEntry] });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByTestId("world-screen")).toBeVisible();
    await page.getByRole("button", { name: "Advance 1 year" }).click();
    await expect(page.getByRole("button", { name: "Advance 1 year" })).toBeEnabled();
    const live = await page.evaluate(() => window.firstCauseWorld.getWorld(1));
    // D3/TECH-012: po roku nic poza zbożem nie jest znane -- morfologia nie ujawnia złóż.
    expect(live.current.regions.flatMap((r) => r.resourceDefinitionIds).sort()).toEqual([
      "grain",
    ]);
    for (const [width, height] of [
      [1920, 1080],
      [1280, 800],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.keyboard.press("Escape");
      await atlasSettled(page);
      expect(await noHorizontalScroll(page)).toBe(true);
      expect(await layoutInsideViewport(page)).toEqual(["ok", "ok", "ok"]);
      // Prawdziwy świat referencyjny to małe osady: jedna klasa morfologii, legenda z danych.
      expect(await settlementClasses(page)).toBe("hamlet");
      await expect(page.locator("[data-settlement-class]")).toHaveCount(1);
      await page.screenshot({
        path: shot(`r3-${width}x${height}-black-mountain.png`),
      });
    }
    // N: zmiana języka nie zmienia morfologii (klasy liczone z danych, nie z tekstu).
    const before = await settlementClasses(page);
    // `exact`: domyślne dopasowanie podciągu łapało też wpisy wydarzeń (np. „Gr*een* Valley”).
    await page.getByRole("button", { name: "PL", exact: true }).click();
    await atlasSettled(page);
    expect(await settlementClasses(page)).toBe(before);
    await expect(page.getByTestId("settlement-scale-legend")).toContainText("Przysiółek");
    await page.screenshot({ path: shot("r3-1280x800-black-mountain-pl.png") });
    await page.getByRole("button", { name: "EN", exact: true }).click();
    // H: warstwa wizualna nie mutuje świata.
    expect(await page.evaluate(() => window.firstCauseWorld.getWorld(1))).toEqual(live);
    expect(errors).toEqual([]);
  } finally {
    await app.close();
  }
});

test("M21-VIS-R3: population morphology fixtures -- ladder 10 → 10M+, variants, civilization centers", async () => {
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

    // Arkusz morfologii w dużej skali: klasy × warianty × poziomy szczegółu (ocena kształtu).
    const sheetUrl = `${server.resolvedUrls!.local[0]}visual-tests/morphology.html`;
    const [sheet] = await Promise.all([
      app.waitForEvent("window"),
      app.evaluate(({ BrowserWindow }, target) => {
        const window = new BrowserWindow({ width: 1300, height: 1080, show: true });
        void window.loadURL(target);
      }, sheetUrl),
    ]);
    await sheet.setViewportSize({ width: 1300, height: 1080 });
    await expect(sheet.locator("svg[data-cls]")).toHaveCount(35);
    await sheet.screenshot({
      path: shot("r3-morphology-sheet.png"),
      fullPage: true,
    });
    await sheet.close();

    // C: pełna drabina skali -- sześć klas morfologii w jednym widoku.
    const ladder = await openFixture(app, server, "ladder", 1920, 1080);
    expect(await settlementClasses(ladder)).toBe(
      "hamlet,village,town,city,metropolis,megacity",
    );
    await expect(ladder.locator("[data-settlement-class]")).toHaveCount(6);
    expect(await noHorizontalScroll(ladder)).toBe(true);
    await ladder.screenshot({ path: shot("r3-fixture-ladder-10-to-10M.png") });
    await ladder.close();

    // Warianty tej samej klasy (~100k ×3, ~10M ×3).
    const variants = await openFixture(app, server, "variants", 1920, 1080);
    expect(await settlementClasses(variants)).toBe("city,megacity");
    await variants.screenshot({ path: shot("r3-fixture-variants.png") });
    await variants.close();

    // D / L / M: WORLD z kilkoma dużymi centrami, oba viewporty.
    const civ = await openFixture(app, server, "civilization", 1920, 1080);
    expect(await settlementClasses(civ)).toBe(
      "hamlet,village,town,city,metropolis,megacity",
    );
    for (const [width, height] of [
      [1920, 1080],
      [1280, 800],
    ] as const) {
      await civ.setViewportSize({ width, height });
      await atlasSettled(civ);
      expect(await noHorizontalScroll(civ)).toBe(true);
      expect(await layoutInsideViewport(civ)).toEqual(["ok", "ok", "ok"]);
      await civ.screenshot({
        path: shot(`r3-civilization-${width}x${height}.png`),
      });
    }

    // G: osada + przemysł + wydobycie + trasy w zaznaczonym regionie przemysłowym.
    await civ.setViewportSize({ width: 1920, height: 1080 });
    await civ.locator(".fc-world__region-picker select").selectOption("r3_civ_basin");
    await expect(civ.locator(".fc-world__region")).toContainText("Coal Basin");
    await atlasSettled(civ);
    await civ.screenshot({
      path: shot("r3-civilization-coexistence-selected.png"),
    });

    // E: zbliżenie -- semantic zoom LOCAL pokazuje więcej osad i szczegółów morfologii.
    for (let i = 0; i < 3; i++)
      await civ.getByRole("button", { name: "Zoom in" }).click();
    // „Show on Map” centruje zbliżenie na zaznaczonym regionie (focus), bez zmiany danych.
    await civ.getByRole("button", { name: "Show on Map" }).first().click();
    await atlasSettled(civ);
    await expect(civ.getByTestId("living-atlas")).toHaveAttribute(
      "data-semantic-zoom",
      "LOCAL",
    );
    await civ.screenshot({ path: shot("r3-civilization-zoom-local.png") });
    await civ.close();

    // F: R2 → R3 na tym samym fixture R2 (obraz R2 z archiwum weryfikacji).
    const r2world = await openFixture(app, server, "r2", 1920, 1080);
    const r3Path = shot("r3-fixture-r2-world.png");
    await r2world.screenshot({ path: r3Path });
    const toData = (file: string) =>
      `data:image/png;base64,${readFileSync(file).toString("base64")}`;
    await r2world.setViewportSize({ width: 1920, height: 560 });
    await r2world.setContent(
      `<body style="margin:0;display:flex;gap:8px;background:#ddd;font:14px sans-serif">
        <figure style="margin:0;width:956px"><figcaption>R2 (2026-09-26)</figcaption>
          <img style="width:956px" src="${toData(R2_REFERENCE)}"></figure>
        <figure style="margin:0;width:956px"><figcaption>R3 (2026-09-27)</figcaption>
          <img style="width:956px" src="${toData(r3Path)}"></figure></body>`,
    );
    await r2world.screenshot({ path: shot("r3-comparison-r2-vs-r3.png") });
  } finally {
    await app.close();
    await server.close();
  }
});
