import { useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import en from "../../../locales/en/common.json";
import { FCLivingAtlas } from "../src/features/world/FCLivingAtlas.js";
import { MAP_MODES, type MapMode } from "../src/features/world/atlas-model.js";
import { useWorldStore } from "../src/features/world/world-store.js";
import {
  VISUAL_STAGES,
  visualStressView,
} from "../src/features/world/visual-stress-fixture.js";
import "../src/index.css";
import "../src/features/world/world.css";
import "@fontsource/ibm-plex-sans/400.css";

useWorldStore.getState().set({
  selectedEntityId: "visual_region",
  focusMode: true,
  zoomLevel: 2,
  mapMode: "economy",
});
function Harness() {
  const [stage, setStage] = useState(0);
  const [mode, setMode] = useState<MapMode>("economy");
  return (
    <main style={{ padding: 24 }}>
      <h1>VISUAL DEVELOPMENT DATA — {VISUAL_STAGES[stage]}</h1>
      <p>
        Contract fixture, not simulated history. Constant region, terrain and IDs. No
        political / energy / capital data.
      </p>
      <label>
        Stage{" "}
        <select
          aria-label="Stage"
          value={stage}
          onChange={(e) => setStage(Number(e.target.value))}
        >
          {VISUAL_STAGES.map((s, i) => (
            <option key={s} value={i}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mode{" "}
        <select
          aria-label="Mode"
          value={mode}
          onChange={(e) => {
            const m = e.target.value as MapMode;
            setMode(m);
            useWorldStore.getState().set({ mapMode: m });
          }}
        >
          {MAP_MODES.map((m) => (
            <option key={m} disabled={m === "political"}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: "flex", height: 820 }}>
        <FCLivingAtlas
          view={visualStressView(stage)}
          resourceId="iron_ore"
          discoveryId="visual_discovery"
        />
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={createI18n({ resources: { en: { common: en } } })}>
    <Harness />
  </I18nextProvider>,
);
