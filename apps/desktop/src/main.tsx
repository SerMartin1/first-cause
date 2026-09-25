import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import en from "../../../locales/en/common.json";
import pl from "../../../locales/pl/common.json";
import { App } from "./App.js";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/source-serif-4/400.css";
import "./index.css";

const i18n = createI18n({
  resources: {
    en: { common: en },
    pl: { common: pl },
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element (#root) not found in index.html.");
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
);
