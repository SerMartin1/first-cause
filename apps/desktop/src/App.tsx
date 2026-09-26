import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CoreStatus } from "@first-cause/shared";
import { WorldScreen } from "./features/world/WorldScreen.js";
import {
  FCAppShell,
  FCNavigationRail,
  FCSimulationBar,
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
      navigationRail={
        <FCNavigationRail
          title={t("app.title")}
          subtitle={t("app.subtitle")}
          aria-label={t("nav.main")}
          // UI-004: Economy / Technology / Chronicle / Architect nie mają jeszcze ekranów,
          // więc nie są pokazywane jako atrapy (Golden UI World v1.3 §26.3 A).
          entries={[{ id: "world", label: t("nav.world") }]}
          activeId="world"
          onSelect={() => {
            /* jedyny istniejący ekran jest aktywny */
          }}
          system={
            <div role="group" aria-label={t("language.label")}>
              {(["pl", "en"] as const).map((lng) => (
                <button
                  key={lng}
                  type="button"
                  aria-pressed={i18n.resolvedLanguage === lng}
                  onClick={() => void i18n.changeLanguage(lng)}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
          }
          footer={
            <FCSimulationBar
              workerState={workerState}
              workerStatusLabel={workerStatusLabel}
              {...(coreStatus ? { engineVersion: coreStatus.engineVersion } : {})}
            />
          }
        />
      }
    >
      <WorldScreen />
    </FCAppShell>
  );
}
