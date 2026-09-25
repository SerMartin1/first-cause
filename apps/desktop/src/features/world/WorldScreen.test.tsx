import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import {
  type WorldSnapshot,
  type WorldApi,
  type WorldView,
} from "@first-cause/simulation";
import en from "../../../../../locales/en/common.json";
import pl from "../../../../../locales/pl/common.json";
import { WorldScreen } from "./WorldScreen.js";
import { useWorldStore } from "./world-store.js";
import { MODE_METRICS, populationRadius } from "./atlas-model.js";

vi.mock("./FCLivingAtlas.js", () => ({
  FCLivingAtlas: () => <div data-testid="atlas-mock" />,
}));
const snapshot: WorldSnapshot = {
  summary: {
    worldId: "test",
    worldName: "Test World",
    currentTick: 0,
    currentDate: { year: 1, month: 1 },
    regionCount: 0,
    totalPopulation: 0,
    settlementCount: 0,
    activeCompanyCount: 0,
    settlementCountByStage: {
      CAMP: 0,
      HAMLET: 0,
      VILLAGE: 0,
      TOWN: 0,
      CITY: 0,
      METROPOLIS: 0,
    },
  },
  regions: [],
  connections: [],
  flows: [],
};
const view: WorldView = {
  type: "WORLD_VIEW",
  current: snapshot,
  baseline: undefined,
  liveTick: 0,
  availableTicks: [0],
  events: [],
  speed: 0,
};
let api: WorldApi;
beforeEach(() => {
  useWorldStore.setState(useWorldStore.getInitialState());
  api = {
    getWorld: vi.fn().mockResolvedValue(view),
    setSpeed: vi.fn().mockResolvedValue(view),
    step: vi.fn().mockResolvedValue(view),
    explain: vi.fn(),
  };
  Object.defineProperty(window, "firstCauseWorld", { value: api, configurable: true });
});
function mount() {
  return render(
    <I18nextProvider
      i18n={createI18n({ resources: { en: { common: en }, pl: { common: pl } } })}
    >
      <WorldScreen />
    </I18nextProvider>,
  );
}

describe("World UI", () => {
  it("renders honest empty states and keeps map modes separate from overlays", async () => {
    mount();
    await screen.findByTestId("world-screen");
    expect(screen.getByText("No recorded events in this period.")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Political" })).toBeDisabled();
    const overlays = [...useWorldStore.getState().overlays];
    fireEvent.click(screen.getByRole("tab", { name: "Δ Change" }));
    expect(useWorldStore.getState().overlays).toEqual(overlays);
    fireEvent.change(screen.getByLabelText("Compare"), { target: { value: "50" } });
    await waitFor(() => expect(api.getWorld).toHaveBeenCalledWith(50, undefined));
    expect(screen.getByText(/No baseline for this period yet/)).toBeInTheDocument();
  });
  it("advances simulation only through an explicit command", async () => {
    mount();
    await screen.findByTestId("world-screen");
    expect(api.step).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Advance 1 year" }));
    await waitFor(() => expect(api.step).toHaveBeenCalledWith(12));
  });
  it("shows IPC errors and permits retry", async () => {
    vi.mocked(api.getWorld).mockRejectedValueOnce(new Error("Disconnected"));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("Disconnected");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByTestId("world-screen");
  });
  it("distinguishes large settlements with a bounded non-linear radius", () => {
    expect(populationRadius(100_000)).toBeGreaterThan(populationRadius(10_000) * 2);
    expect(populationRadius(0)).toBeGreaterThan(0);
    expect(populationRadius(1e12)).toBeLessThanOrEqual(36);
    expect(populationRadius(-1)).toBe(populationRadius(0));
    expect(populationRadius(Number.NaN)).toBe(populationRadius(0));
  });
  it("never treats current state as a historical delta", () => {
    const region = {
      regionId: "r",
      population: 100,
      production: 50,
    } as WorldView["current"]["regions"][number];
    const ctx = { resourceId: "", discoveryId: "" };
    expect(MODE_METRICS.change(region, snapshot, ctx)).toBeUndefined();
    const baseline = {
      ...snapshot,
      regions: [{ ...region, population: 120, production: 30 }],
    };
    expect(MODE_METRICS.change(region, snapshot, { ...ctx, baseline })).toBe(-20);
    expect(
      MODE_METRICS.change(region, snapshot, {
        ...ctx,
        baseline,
        changeMetric: "production",
      }),
    ).toBe(20);
  });
});
