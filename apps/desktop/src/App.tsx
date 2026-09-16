import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CoreStatus } from "@first-cause/shared";
import { useUiStore } from "./state/ui-store.js";
import {
  FCAppShell,
  FCSimulationBar,
  FCTopNavigation,
  type WorkerConnectionState,
} from "./shell/index.js";
import { FCSection, FCTextButton } from "./components/fc/index.js";

/**
 * FCAppShell-based technical shell (M5 UI-F0 start). Still not the
 * World Command Center (that lands incrementally through M11-M21) --
 * proves the same React -> preload -> Electron main -> Simulation
 * Worker path as the M0 bare shell it replaces, now composed from the
 * FC Component Library instead of one-off markup.
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

  const workerStatusLabel =
    workerState === "online"
      ? t("worker.status.online")
      : workerState === "offline"
        ? t("worker.status.offline")
        : t("worker.status.connecting");

  return (
    <FCAppShell
      topNavigation={
        <FCTopNavigation
          title={t("app.title")}
          tabs={[{ id: "world", label: t("nav.world") }]}
          activeTabId="world"
          onTabChange={() => {
            /* only one tab exists so far */
          }}
        >
          <div role="group" aria-label={t("language.label")}>
            <button type="button" onClick={() => void i18n.changeLanguage("pl")}>
              PL
            </button>
            <button type="button" onClick={() => void i18n.changeLanguage("en")}>
              EN
            </button>
          </div>
        </FCTopNavigation>
      }
      simulationBar={
        <FCSimulationBar
          workerState={workerState}
          workerStatusLabel={workerStatusLabel}
          {...(coreStatus ? { engineVersion: coreStatus.engineVersion } : {})}
        />
      }
    >
      <FCSection title={t("app.milestone")}>
        <p className="fc-body">
          {t("environment.label", { environment: appEnvironment })}
        </p>

        <FCTextButton onClick={toggleDeveloperOverlay}>
          {isDeveloperOverlayOpen
            ? t("developer.overlay.hide")
            : t("developer.overlay.show")}
        </FCTextButton>

        {isDeveloperOverlayOpen && coreStatus && (
          <pre className="fc-data" data-testid="developer-overlay">
            {JSON.stringify(coreStatus, null, 2)}
          </pre>
        )}
      </FCSection>
    </FCAppShell>
  );
}
