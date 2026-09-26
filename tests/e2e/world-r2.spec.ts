import path from "node:path";
import { fileURLToPath } from "node:url";
import { _electron as electron, expect, test, type Page } from "@playwright/test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainEntry = path.resolve(__dirname, "../../apps/desktop/out/main/index.js");

/** Czeka, aż płótno PixiJS dopasuje się do viewportu i scena zostanie narysowana. */
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

/** Rozwija / zwija klucz znaków Atlasu (przy wielu klasach domyślnie zwinięty). */
async function setSymbolKey(page: Page, open: boolean) {
  const toggle = page.locator(".fc-atlas__symbols-toggle");
  if ((await toggle.getAttribute("aria-expanded")) !== String(open)) await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", String(open));
  await atlasSettled(page);
}

function legendClasses(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[data-legend-class]")].map(
      (el) => `${el.getAttribute("data-legend-class")}:${el.textContent ?? ""}`,
    ),
  );
}

test("M21-VIS-R2: real world atlas grammar at 1920×1080 and 1280×800", async () => {
  test.setTimeout(120_000);
  const info = test.info();
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
    // Region z największą liczbą aktywności gospodarczych w prawdziwym świecie.
    const busiest = [...live.current.regions].sort(
      (a, b) =>
        (b.profile.industry?.length ?? 0) +
          b.profile.extraction.length -
          ((a.profile.industry?.length ?? 0) + a.profile.extraction.length) ||
        a.regionId.localeCompare(b.regionId),
    )[0]!;
    // Kontrakt v2 w prawdziwym świecie: trasy per połączenie z contentu (cart -> road, river -> waterway).
    expect(live.current.connections.every((c) => Array.isArray(c.routes))).toBe(true);
    expect(
      live.current.connections.some((c) => c.routes.some((r) => r.family === "waterway")),
    ).toBe(true);
    // TECH-009: złoża prawdziwego świata są UNKNOWN -- nie mogą pojawić się w warstwie wizualnej.
    for (const region of live.current.regions)
      for (const d of region.deposits.filter((d) => d.discoveryStatus === "UNKNOWN")) {
        expect(region.profile.extraction.map((e) => e.depositId)).not.toContain(
          d.depositId,
        );
        expect(region.profile.resources.map((r) => r.resourceDefinitionId)).not.toContain(
          d.resourceDefinitionId,
        );
      }
    for (const [width, height] of [
      [1920, 1080],
      [1280, 800],
    ] as const) {
      const size = `${width}x${height}`;
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.keyboard.press("Escape");
      await atlasSettled(page);
      expect(await noHorizontalScroll(page)).toBe(true);
      await expect(page.getByTestId("living-atlas")).toHaveAttribute(
        "data-semantic-zoom",
        "REGION",
      );
      const legend = await legendClasses(page);
      info.annotations.push({
        type: `legend ${size}`,
        description: JSON.stringify(legend),
      });
      expect(legend.some((l) => l.startsWith("route:"))).toBe(true);
      await page.screenshot({ path: info.outputPath(`r2-${size}-world-none.png`) });

      await page
        .locator(".fc-world__region-picker select")
        .selectOption(busiest.regionId);
      await expect(page.locator(".fc-world__region")).toContainText(busiest.name);
      await atlasSettled(page);
      expect(await noHorizontalScroll(page)).toBe(true);
      await page.screenshot({ path: info.outputPath(`r2-${size}-world-selected.png`) });
    }
    // Warstwa wizualna nie mutuje świata.
    expect(await page.evaluate(() => window.firstCauseWorld.getWorld(1))).toEqual(live);
    expect(errors).toEqual([]);
  } finally {
    await app.close();
  }
});

test("M21-VIS-R2: visual development fixture -- industry[], extraction[], routes per connection", async () => {
  test.setTimeout(120_000);
  const info = test.info();
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
    // Osobne okno bez preloadu: harness podstawia statyczny widok fixture'u zamiast workera symulacji.
    const url = `${server.resolvedUrls!.local[0]}visual-tests/world.html`;
    const [page] = await Promise.all([
      app.waitForEvent("window"),
      app.evaluate(({ BrowserWindow }, target) => {
        const window = new BrowserWindow({ width: 1920, height: 1080, show: true });
        void window.loadURL(target);
      }, url),
    ]);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByTestId("world-screen")).toBeVisible();
    await atlasSettled(page);
    expect(await noHorizontalScroll(page)).toBe(true);
    // Wiele klas: klucz znaków domyślnie zwinięty, Atlas pozostaje dominujący.
    await expect(page.locator(".fc-atlas__symbols-toggle")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await page.screenshot({
      path: info.outputPath("r2-fixture-1920x1080-world-none.png"),
    });
    await setSymbolKey(page, true);
    const legend = await legendClasses(page);
    info.annotations.push({
      type: "fixture legend",
      description: JSON.stringify(legend),
    });
    // Wiele sektorów, rodzin wydobycia, tras i stanów obecnych jednocześnie.
    for (const expected of [
      "industry:Mining company",
      "industry:Metallurgy",
      "industry:Agriculture",
      "extraction:Shaft mine",
      "extraction:Open-pit mine",
      "extraction:Cultivated fields",
      "route:Road",
      "route:Railway",
      "route:Waterway",
      "route:Path / trail",
      "route:Connection without infrastructure",
      "state:Depleted",
      "state:Closed",
      "state:Distressed",
    ])
      expect(legend).toContain(expected);
    await page.screenshot({
      path: info.outputPath("r2-fixture-1920x1080-symbol-key.png"),
    });

    await page.locator(".fc-world__region-picker select").selectOption("dev_ironridge");
    await expect(page.locator(".fc-world__region")).toContainText("Ironridge");
    await atlasSettled(page);
    await page.screenshot({
      path: info.outputPath("r2-fixture-1920x1080-multi-activity-selected.png"),
    });

    // Semantic zoom: WORLD agreguje (znaki nadal obecne), LOCAL rozwija.
    await page.getByRole("button", { name: "Zoom out" }).click();
    await page.getByRole("button", { name: "Zoom out" }).click();
    await expect(page.getByTestId("living-atlas")).toHaveAttribute(
      "data-semantic-zoom",
      "WORLD",
    );
    await atlasSettled(page);
    expect(await legendClasses(page)).toContain("industry:Economic activity (count)");
    await page.screenshot({
      path: info.outputPath("r2-fixture-1920x1080-zoom-world.png"),
    });
    await page.getByRole("button", { name: "Reset view" }).click();
    // LOCAL wycentrowany na zaznaczonym regionie (Quick Action „Show on Map” = focus).
    await page.getByRole("button", { name: "Show on Map" }).click();
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "Zoom in" }).click();
    await expect(page.getByTestId("living-atlas")).toHaveAttribute(
      "data-semantic-zoom",
      "LOCAL",
    );
    await atlasSettled(page);
    await page.screenshot({
      path: info.outputPath("r2-fixture-1920x1080-zoom-local.png"),
    });
    await page.getByRole("button", { name: "Reset view" }).click();

    await page.setViewportSize({ width: 1280, height: 800 });
    await setSymbolKey(page, false);
    expect(await noHorizontalScroll(page)).toBe(true);
    await page.screenshot({
      path: info.outputPath("r2-fixture-1280x800-multi-activity-selected.png"),
    });

    // Zmiana języka nie zmienia gramatyki Atlasu (te same klasy i liczba znaków).
    await setSymbolKey(page, true);
    const before = (await legendClasses(page)).map((l) => l.split(":")[0]);
    expect(before.length).toBeGreaterThan(8);
    await page.getByRole("button", { name: "PL", exact: true }).click();
    await expect(page.getByTestId("world-screen")).toBeVisible();
    await atlasSettled(page);
    expect((await legendClasses(page)).map((l) => l.split(":")[0])).toEqual(before);
    await setSymbolKey(page, false);
    await page.screenshot({ path: info.outputPath("r2-fixture-1280x800-pl-locale.png") });
    expect(errors).toEqual([]);
  } finally {
    await app.close();
    await server.close();
  }
});
