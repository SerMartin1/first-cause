import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CoreStatus } from "@first-cause/shared";
import { WorldScreen } from "./features/world/WorldScreen.js";
import {
  FCAppShell,
  FCSimulationBar,
  FCTopNavigation,
  type WorkerConnectionState,
} from "./shell/index.js";

/** World composition over the existing FC shell and worker boundary. */
export function App() {
  const { t, i18n } = useTranslation();
  const [workerState, setWorkerState] = useState<WorkerConnectionState>("connecting");
  const [coreStatus, setCoreStatus] = useState<CoreStatus | null>(null);

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
          <details className="fc-world-diagnostics">
            <summary>{t("world.diagnostics")}</summary>
            <FCSimulationBar
              workerState={workerState}
              workerStatusLabel={workerStatusLabel}
              {...(coreStatus ? { engineVersion: coreStatus.engineVersion } : {})}
            />
          </details>
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
      simulationBar={null}
    >
      <WorldScreen />
    </FCAppShell>
  );
}
