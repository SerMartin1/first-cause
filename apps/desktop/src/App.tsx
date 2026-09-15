import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CoreStatus } from "@first-cause/shared";
import { useUiStore } from "./state/ui-store.js";

type WorkerConnectionState = "connecting" | "online" | "offline";

/**
 * Technical shell only (M0 SS45) -- not the World Command Center. Proves
 * the full path React -> preload -> Electron main -> Simulation Worker
 * -> back, plus EN/PL localization, without any gameplay UI.
 */
export function App() {
  const { t, i18n } = useTranslation();
  const [appEnvironment] = useState(() => window.firstCause.getAppInfo().environment);
  const [workerState, setWorkerState] = useState<WorkerConnectionState>("connecting");
  const [coreStatus, setCoreStatus] = useState<CoreStatus | null>(null);
  const isDeveloperOverlayOpen = useUiStore((state) => state.isDeveloperOverlayOpen);
  const toggleDeveloperOverlay = useUiStore((state) => state.toggleDeveloperOverlay);

  useEffect(() => {
    let cancelled = false;

    window.firstCause
      .getSimulationCoreStatus()
      .then((status) => {
        if (cancelled) return;
        setCoreStatus(status);
        setWorkerState("online");
      })
      .catch(() => {
        if (cancelled) return;
        setWorkerState("offline");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app-shell">
      <h1>{t("app.title")}</h1>
      <p>{t("app.milestone")}</p>

      <p data-testid="worker-status">
        {workerState === "online" && t("worker.status.online")}
        {workerState === "offline" && t("worker.status.offline")}
        {workerState === "connecting" && t("worker.status.connecting")}
      </p>

      <p>{t("environment.label", { environment: appEnvironment })}</p>

      <div role="group" aria-label={t("language.label")}>
        <button type="button" onClick={() => void i18n.changeLanguage("pl")}>
          PL
        </button>
        <button type="button" onClick={() => void i18n.changeLanguage("en")}>
          EN
        </button>
      </div>

      <button type="button" onClick={toggleDeveloperOverlay}>
        {isDeveloperOverlayOpen ? "Hide" : "Show"} developer overlay
      </button>

      {isDeveloperOverlayOpen && coreStatus && (
        <pre data-testid="developer-overlay">{JSON.stringify(coreStatus, null, 2)}</pre>
      )}
    </main>
  );
}
