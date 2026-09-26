import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import type { FirstCauseApi } from "@first-cause/shared";
import type { WorldApi } from "@first-cause/simulation";
import en from "../../../locales/en/common.json";
import pl from "../../../locales/pl/common.json";
import { App } from "../src/App.js";
import { visualWorldView } from "../src/features/world/visual-world-fixture.js";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/source-serif-4/400.css";
import "../src/index.css";

/**
 * M21-VIS-R2 harness: pełny ekran World (kompozycja R1 bez zmian) na
 * VISUAL DEVELOPMENT DATA z `visual-world-fixture.ts`. Ładowany wyłącznie
 * przez test E2E w oknie bez preloadu; API świata jest statycznym widokiem
 * fixture'u (brak symulacji, brak komend zmieniających stan).
 */
const view = visualWorldView();
const world: WorldApi = {
  getWorld: () => Promise.resolve(view),
  setSpeed: () => Promise.resolve(view),
  step: () => Promise.resolve(view),
  explain: () => Promise.reject(new Error("VISUAL DEVELOPMENT DATA: no causal history")),
};
const core: FirstCauseApi = {
  getAppInfo: () => ({
    appVersion: "visual-dev",
    engineVersion: "visual-dev",
    environment: "test",
    platform: "visual-dev",
  }),
  pingSimulation: () => Promise.reject(new Error("VISUAL DEVELOPMENT DATA")),
  getSimulationCoreStatus: () =>
    Promise.resolve({
      type: "CORE_STATUS",
      workerOnline: true,
      engineVersion: "visual-dev",
      startedAt: 0,
      uptimeMs: 0,
    }),
};
Object.defineProperty(window, "firstCauseWorld", { value: world, configurable: true });
Object.defineProperty(window, "firstCause", { value: core, configurable: true });

/** Nazwy zasobów istniejących wyłącznie w fixture (nie w contencie gry). */
const devNames = {
  "content.resource.dev_coal.name": "Coal (dev data)",
  "content.resource.dev_limestone.name": "Limestone (dev data)",
  "content.resource.dev_fish.name": "Fish (dev data)",
};
createRoot(document.getElementById("root")!).render(
  <I18nextProvider
    i18n={createI18n({
      resources: {
        en: { common: { ...en, ...devNames } },
        pl: { common: { ...pl, ...devNames } },
      },
    })}
  >
    <App />
  </I18nextProvider>,
);
