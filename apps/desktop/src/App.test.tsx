import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import type { CoreStatus, FirstCauseApi, PongResponse } from "@first-cause/shared";
import { App } from "./App.js";
import en from "../../../locales/en/common.json";
import pl from "../../../locales/pl/common.json";
vi.mock("./features/world/WorldScreen.js", () => ({
  WorldScreen: () => <div>World content</div>,
}));

function createTestI18n() {
  return createI18n({ resources: { en: { common: en }, pl: { common: pl } } });
}

function installFirstCauseMock(): FirstCauseApi {
  const mock: FirstCauseApi = {
    getAppInfo: () => ({
      appVersion: "0.0.0",
      engineVersion: "0.0.0-m0",
      environment: "test",
      platform: "test-platform",
    }),
    pingSimulation: vi.fn<() => Promise<PongResponse>>(() =>
      Promise.resolve({ type: "PONG", receivedAt: Date.now() }),
    ),
    getSimulationCoreStatus: vi.fn<() => Promise<CoreStatus>>(() =>
      Promise.resolve({
        type: "CORE_STATUS",
        workerOnline: true,
        engineVersion: "0.0.0-m0",
        startedAt: Date.now(),
        uptimeMs: 0,
      }),
    ),
  };

  Object.defineProperty(window, "firstCause", {
    value: mock,
    writable: true,
    configurable: true,
  });

  return mock;
}

describe("App", () => {
  beforeEach(() => {
    installFirstCauseMock();
  });

  it("renders the FIRST CAUSE technical shell", () => {
    render(
      <I18nextProvider i18n={createTestI18n()}>
        <App />
      </I18nextProvider>,
    );

    expect(screen.getByText("FIRST CAUSE")).toBeInTheDocument();
  });

  it("renders a left navigation rail with only existing screens", () => {
    render(
      <I18nextProvider i18n={createTestI18n()}>
        <App />
      </I18nextProvider>,
    );

    const rail = screen.getByRole("list", { name: "Main navigation" });
    const entries = rail.querySelectorAll("button");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toHaveTextContent("World");
    expect(entries[0]).toHaveAttribute("aria-current", "page");
    for (const missing of ["Economy", "Technology", "Chronicle", "Architect"])
      expect(screen.queryByRole("button", { name: missing })).toBeNull();
  });

  it("shows the Simulation Worker status once the mocked IPC call resolves", async () => {
    render(
      <I18nextProvider i18n={createTestI18n()}>
        <App />
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("worker-status")).toHaveTextContent(
        "Simulation Worker: ONLINE",
      );
    });
  });

  it("switches locale via the PL/EN controls", async () => {
    render(
      <I18nextProvider i18n={createTestI18n()}>
        <App />
      </I18nextProvider>,
    );

    screen.getByRole("button", { name: "PL" }).click();

    await waitFor(() => {
      expect(screen.getByRole("group", { name: "Język" })).toBeInTheDocument();
    });
  });
});
