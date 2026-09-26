import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import {
  type WorldSnapshot,
  type WorldApi,
  type WorldView,
  type WorldWhyView,
} from "@first-cause/simulation";
import en from "../../../../../locales/en/common.json";
import pl from "../../../../../locales/pl/common.json";
import { WorldScreen } from "./WorldScreen.js";
import { useWorldStore } from "./world-store.js";
import { fitAtlas, MODE_METRICS, populationRadius } from "./atlas-model.js";
import { visualStressView } from "./visual-stress-fixture.js";
import { settlementBlocks } from "./visual-alphabet.js";

vi.mock("./FCLivingAtlas.js", () => ({
  FCLivingAtlas: ({ caption }: { caption?: ReactNode }) => (
    <div data-testid="atlas-mock">{caption}</div>
  ),
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
  it("shares explicit scope, resets on replacement, preserves WHY context and disables unsupported actions", async () => {
    const sample = visualStressView(2);
    const region = sample.current.regions[0]!;
    const current = {
      ...sample.current,
      regions: [
        {
          ...region,
          latestExplainedChange: { factId: "effect", type: "company_founded", tick: 23 },
        },
        { ...region, regionId: "other", name: "Other region" },
      ],
      causalDrivers: [
        {
          id: "edge",
          factId: "source",
          effectFactId: "effect",
          type: "company_founded",
          regionId: "visual_region",
          effectRegionId: "visual_region",
          tick: 23,
          contribution: 0.8,
          strength: 0.8,
        },
        {
          id: "other-edge",
          factId: "other-source",
          effectFactId: "other-effect",
          type: "resource_depleted",
          regionId: "other",
          effectRegionId: "other",
          tick: 23,
          contribution: 0.9,
          strength: 0.9,
        },
      ],
    };
    vi.mocked(api.getWorld).mockResolvedValue({ ...sample, current });
    const frozen = JSON.stringify(current);
    mount();
    await screen.findByTestId("world-screen");
    const scope = within(screen.getByRole("group", { name: "Analysis scope" }));
    const actions = within(screen.getByTestId("quick-actions"));
    expect(scope.getByRole("button", { name: "Selected Region" })).toBeDisabled();
    expect(actions.getByRole("button", { name: "Show on Map" })).toBeDisabled();
    expect(actions.getByRole("button", { name: "WHY?" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Select region"), {
      target: { value: "visual_region" },
    });
    expect(scope.getByRole("button", { name: "WORLD" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(screen.getByTestId("analysis-causes")).getAllByRole("button"),
    ).toHaveLength(2);
    expect(actions.getByRole("button", { name: "Show on Map" })).toBeEnabled();
    fireEvent.click(scope.getByRole("button", { name: "Reference region" }));
    for (const id of ["analysis-causes", "analysis-consequences"])
      expect(screen.getByTestId(id)).toHaveAttribute("data-scope", "REGION");
    expect(
      within(screen.getByTestId("analysis-causes")).getAllByRole("button"),
    ).toHaveLength(1);
    expect(screen.getByTestId("analysis-consequences")).toHaveTextContent(
      "No model-derived projections",
    );
    fireEvent.click(within(screen.getByTestId("analysis-causes")).getByRole("button"));
    expect(api.explain).toHaveBeenCalledWith("effect", 24, {
      scope: { kind: "REGION", regionId: "visual_region" },
      itemId: "edge",
      itemKind: "cause",
      regionId: "visual_region",
    });
    fireEvent.click(actions.getByRole("button", { name: "Open region details" }));
    expect(document.querySelector(".fc-world__detail")).toBeInTheDocument();
    fireEvent.click(scope.getByRole("button", { name: "WORLD" }));
    for (const id of ["analysis-causes", "analysis-consequences"])
      expect(screen.getByTestId(id)).toHaveAttribute("data-scope", "WORLD");
    fireEvent.click(scope.getByRole("button", { name: "Reference region" }));
    fireEvent.change(screen.getByLabelText("Select region"), {
      target: { value: "other" },
    });
    expect(useWorldStore.getState().analysisScope).toEqual({ kind: "WORLD" });
    fireEvent.click(scope.getByRole("button", { name: "Other region" }));
    fireEvent.change(screen.getByLabelText("Select region"), { target: { value: "" } });
    expect(useWorldStore.getState().analysisScope).toEqual({ kind: "WORLD" });
    fireEvent.click(screen.getByLabelText("Names"));
    expect(useWorldStore.getState().overlays).not.toContain("names");
    expect(useWorldStore.getState().analysisScope).toEqual({ kind: "WORLD" });
    expect(api.step).not.toHaveBeenCalled();
    expect(api.setSpeed).not.toHaveBeenCalled();
    expect(JSON.stringify(current)).toBe(frozen);
  });
  it("starts each World visit in WORLD", async () => {
    const sample = visualStressView(2);
    vi.mocked(api.getWorld).mockResolvedValue(sample);
    useWorldStore.setState({
      analysisScope: { kind: "REGION", regionId: "visual_region" },
      selectedEntityId: "visual_region",
    });
    const first = mount();
    await screen.findByTestId("world-screen");
    expect(useWorldStore.getState().analysisScope).toEqual({ kind: "WORLD" });
    act(() =>
      useWorldStore
        .getState()
        .set({ analysisScope: { kind: "REGION", regionId: "visual_region" } }),
    );
    first.unmount();
    mount();
    await screen.findByTestId("world-screen");
    expect(useWorldStore.getState().analysisScope).toEqual({ kind: "WORLD" });
  });
  it("ignores a pending WHY response after scope changes", async () => {
    const sample = visualStressView(2);
    const region = sample.current.regions[0]!;
    vi.mocked(api.getWorld).mockResolvedValue({
      ...sample,
      current: {
        ...sample.current,
        regions: [
          {
            ...region,
            latestExplainedChange: {
              factId: "effect",
              type: "company_founded",
              tick: 23,
            },
          },
        ],
      },
    });
    let resolve!: (value: WorldWhyView) => void;
    vi.mocked(api.explain).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    mount();
    await screen.findByTestId("world-screen");
    fireEvent.change(screen.getByLabelText("Select region"), {
      target: { value: region.regionId },
    });
    fireEvent.click(
      within(screen.getByTestId("quick-actions")).getByRole("button", { name: "WHY?" }),
    );
    fireEvent.click(
      within(screen.getByRole("group", { name: "Analysis scope" })).getByRole("button", {
        name: region.name,
      }),
    );
    // A stale response would attempt to dereference this deliberately empty explanation.
    await act(async () => resolve({ type: "WORLD_WHY" } as WorldWhyView));
    expect(document.querySelector(".fc-world__why")).toHaveTextContent(
      en["world.whyPrompt"],
    );
  });
  it("stress tests deterministic population grammar across four fixture stages and all modes", () => {
    const counts = [0, 1, 2, 3].map((i) => {
      const v = visualStressView(i),
        r = v.current.regions[0]!;
      const before = JSON.stringify(v);
      for (const metric of Object.values(MODE_METRICS)) {
        const ctx = {
          resourceId: "iron_ore",
          discoveryId: "visual_discovery",
          ...(v.baseline ? { baseline: v.baseline } : {}),
        };
        expect(metric(r, v.current, ctx)).toEqual(
          metric(r, structuredClone(v.current), ctx),
        );
      }
      expect(JSON.stringify(v)).toBe(before);
      expect(r.profile.terrain).toBe("mountains");
      return settlementBlocks(r.population).length;
    });
    expect(counts).toEqual([1, 9, 16, 25]);
  });
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
  it("composes the R1 World layout: Terrain base view, World Pulse, inspector and collapsed support modules", async () => {
    const sample = visualStressView(2);
    vi.mocked(api.getWorld).mockResolvedValue(sample);
    mount();
    await screen.findByTestId("world-screen");
    expect(screen.getByRole("tab", { name: "Terrain" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByRole("tab", { name: /default/i })).toBeNull();
    const pulse = screen.getByLabelText("World Pulse");
    expect(within(pulse).getAllByRole("term")).toHaveLength(4);
    expect(pulse).toHaveTextContent(
      new Intl.NumberFormat("en").format(sample.current.summary.totalPopulation),
    );
    const bar = screen.getByLabelText("World time");
    expect(within(bar).getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(bar).toHaveTextContent(`Tick ${sample.current.summary.currentTick}`);
    const inspector = screen.getByLabelText("Selected Region Inspector");
    expect(inspector).toHaveTextContent(
      "Select a region on the atlas to explore its changes.",
    );
    for (const module of document.querySelectorAll(".fc-world__module"))
      expect(module).not.toHaveAttribute("open");
    fireEvent.change(screen.getByLabelText("Select region"), {
      target: { value: "visual_region" },
    });
    expect(inspector).toHaveTextContent("Reference region");
    expect(inspector.querySelector(".fc-region-vignette")).toBeInTheDocument();
    expect(useWorldStore.getState().analysisScope).toEqual({ kind: "WORLD" });
  });
  it("opens the WHY? module when an explanation arrives", async () => {
    const sample = visualStressView(2);
    const region = sample.current.regions[0]!;
    vi.mocked(api.getWorld).mockResolvedValue({
      ...sample,
      current: {
        ...sample.current,
        regions: [
          {
            ...region,
            latestExplainedChange: {
              factId: "effect",
              type: "company_founded",
              tick: 23,
            },
          },
        ],
      },
    });
    vi.mocked(api.explain).mockResolvedValue({
      type: "WORLD_WHY",
      tick: 24,
      explanation: {
        target: "effect",
        primaryCauses: [],
        significantCauses: [],
        limitingFactors: [],
      },
      facts: [],
      consequences: [],
    } as unknown as WorldWhyView);
    mount();
    await screen.findByTestId("world-screen");
    fireEvent.change(screen.getByLabelText("Select region"), {
      target: { value: region.regionId },
    });
    expect(document.querySelector(".fc-world__why")).not.toHaveAttribute("open");
    fireEvent.click(
      within(screen.getByTestId("quick-actions")).getByRole("button", { name: "WHY?" }),
    );
    await waitFor(() =>
      expect(document.querySelector(".fc-world__why")).toHaveAttribute("open"),
    );
  });
  it("fits the diagram into the free canvas rectangle", () => {
    const bounds = { minX: 100, minY: 100, maxX: 500, maxY: 300 };
    const insets = { top: 40, right: 140, bottom: 48, left: 24 };
    const wide = fitAtlas(bounds, { width: 1364, height: 788 }, insets, 10);
    expect(wide.scale).toBeCloseTo(Math.min((1364 - 164) / 400, (788 - 88) / 200));
    expect(wide.centerX).toBe(24 + (1364 - 164) / 2);
    expect(wide.centerY).toBe(40 + (788 - 88) / 2);
    expect(fitAtlas(bounds, { width: 1364, height: 788 }, insets, 1.5).scale).toBe(1.5);
    expect(fitAtlas(bounds, { width: 10, height: 10 }, insets, 10).scale).toBeGreaterThan(
      0,
    );
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
