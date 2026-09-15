import path from "node:path";
import { fileURLToPath } from "node:url";
import { _electron as electron, expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainEntry = path.resolve(__dirname, "../../apps/desktop/out/main/index.js");

/**
 * M0 smoke test: start application -> Electron window opens -> FIRST CAUSE
 * visible -> Simulation Worker ONLINE.
 *
 * Requires `pnpm build` to have produced `apps/desktop/out/` first --
 * `pnpm test:e2e` runs the build automatically.
 */
test("FIRST CAUSE window opens and Simulation Worker comes online", async () => {
  const app = await electron.launch({ args: [mainEntry] });

  try {
    const window = await app.firstWindow();
    await expect(window.getByText("FIRST CAUSE")).toBeVisible();
    await expect(window.getByTestId("worker-status")).toHaveText(
      "Simulation Worker: ONLINE",
      { timeout: 10_000 },
    );
  } finally {
    await app.close();
  }
});
