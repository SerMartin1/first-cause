import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import type { WorldApi, WorldView } from "@first-cause/simulation";
import en from "../../../../../locales/en/common.json";
import pl from "../../../../../locales/pl/common.json";
import { WorldScreen } from "./WorldScreen.js";
import { useWorldStore } from "./world-store.js";
import { CHANGE_METRICS, MODE_METRICS } from "./atlas-model.js";
import {
  economyClass,
  economyClassLabels,
  formatEmploymentCompact,
  formatEmploymentFull,
  regionEmploymentFact,
  regionSalesFact,
  worldEmployment,
} from "./economy-mode.js";
import {
  ECONOMY_DEV_NAMES,
  ECONOMY_REGION as R,
  economyLowView,
  economyView,
} from "./visual-economy-fixture.js";

vi.mock("./FCLivingAtlas.js", () => ({
  FCLivingAtlas: ({ caption }: { caption?: ReactNode }) => (
    <div data-testid="atlas-mock">{caption}</div>
  ),
}));

function mount(view: WorldView = economyView(), locale: "en" | "pl" = "en") {
  const api: WorldApi = {
    getWorld: vi.fn().mockResolvedValue(view),
    setSpeed: vi.fn().mockResolvedValue(view),
    step: vi.fn().mockResolvedValue(view),
    explain: vi.fn(),
  };
  Object.defineProperty(window, "firstCauseWorld", { value: api, configurable: true });
  return render(
    <I18nextProvider
      i18n={createI18n({
        resources: {
          en: { common: { ...en, ...ECONOMY_DEV_NAMES.en } },
          pl: { common: { ...pl, ...ECONOMY_DEV_NAMES.pl } },
        },
        initialLocale: locale,
      })}
    >
      <WorldScreen />
    </I18nextProvider>,
  );
}
async function openEconomy(regionId: string, locale?: "en" | "pl") {
  useWorldStore.getState().set({ mapMode: "economy", selectedEntityId: regionId });
  mount(economyView(), locale);
  return screen.findByTestId("economy-panel");
}
const region = (id: string, view = economyView()) =>
  view.current.regions.find((r) => r.regionId === id)!;
const fact = (panel: HTMLElement, name: string) =>
  panel.querySelector<HTMLElement>(`[data-economy-fact="${name}"]`)!;

beforeEach(() => {
  useWorldStore.setState(useWorldStore.getInitialState());
});

describe("Economy mode: employment in companies (M21-VIS-R4B, §52C)", () => {
  it("fixed absolute classes 10 / 100 / 1000 / 10 000; zero separate", () => {
    expect([0, 0.4, 9.9, 10, 99, 100, 999, 1_000, 9_999, 10_000, 1e6].map(economyClass)).toEqual(
      [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    );
    expect(economyClassLabels("en")).toEqual(["<10", "10–99", "100–999", "1K–10K", "10K+"]);
    // A fraction of a person is never shown as 0 (employment is continuous).
    expect(formatEmploymentFull(0.4, "en")).toBe("<1");
    expect(formatEmploymentCompact(12_400, "en")).toBe("12.4K");
    expect(formatEmploymentFull(12_400, "pl").replace(/\s/g, " ")).toBe("12 400");
  });

  it("the map metric is employment (people), not a sum of different goods; zero ≠ no data", () => {
    const view = economyView();
    const ctx = { resourceId: "", discoveryId: "" };
    const metric = (id: string) => MODE_METRICS.economy(region(id, view), view.current, ctx);
    expect(metric(R.delta)).toBe(2_320);
    expect(metric(R.emporium)).toBe(12_400);
    expect(metric(R.frontier)).toBe(0); // no companies: known zero
    expect(metric(R.quiet)).toBe(0); // company without employees: known zero
    expect(metric(R.marsh)).toBeUndefined(); // no data, never 0 / NaN
    expect(regionEmploymentFact(region(R.marsh, view))).toEqual({
      kind: "unavailable",
      reason: "MISSING",
    });
    expect(regionSalesFact(region(R.frontier, view))).toEqual({
      kind: "unavailable",
      reason: "OUTSIDE_MARKET_MODEL",
    });
    expect(regionSalesFact(region(R.quiet, view))).toEqual({ kind: "known", value: 0 });
  });

  it("top region is not automatically in the top class (absolute scale)", () => {
    const low = economyLowView();
    const values = low.current.regions.map(
      (r) => MODE_METRICS.economy(r, low.current, { resourceId: "", discoveryId: "" }) ?? 0,
    );
    expect(Math.max(...values)).toBe(3);
    expect(economyClass(Math.max(...values))).toBe(1);
  });

  it("Δ Change compares employment against the baseline (D3); the old production option is gone", () => {
    expect(CHANGE_METRICS).toContain("employment");
    expect(CHANGE_METRICS).not.toContain("production" as never);
    const view = economyView();
    const low = economyLowView();
    const ctx = { resourceId: "", discoveryId: "", changeMetric: "employment" as const };
    expect(
      MODE_METRICS.change(region(R.delta, view), view.current, {
        ...ctx,
        baseline: low.current,
      }),
    ).toBe(2_320 - 3);
    // No baseline or no data in the baseline: no change value (not 0).
    expect(MODE_METRICS.change(region(R.delta, view), view.current, ctx)).toBeUndefined();
    expect(
      MODE_METRICS.change(region(R.delta, view), view.current, {
        ...ctx,
        baseline: view.current,
      }),
    ).toBe(0);
    expect(
      MODE_METRICS.change(region(R.marsh, view), view.current, {
        ...ctx,
        baseline: low.current,
      }),
    ).toBeUndefined();
  });

  it("World Pulse shows total employment in companies (state, no '/ month'), not production", async () => {
    mount();
    await screen.findByTestId("world-screen");
    const pulse = screen.getByLabelText("World Pulse");
    expect(within(pulse).getByText("Employed in companies")).toBeInTheDocument();
    expect(within(pulse).queryByText(/Production/)).not.toBeInTheDocument();
    expect(within(pulse).queryByText(/month/i)).not.toBeInTheDocument();
    expect(worldEmployment(economyView().current.regions)).toBe(15_270);
    expect(within(pulse).getByText("15,270")).toBeInTheDocument();
  });

  it("inspector: employment first with unit and class, sales as extra info, goods with units and no sum", async () => {
    const panel = await openEconomy(R.delta);
    expect(within(panel).getByRole("heading", { name: "Regional economy" })).toBeInTheDocument();
    expect(within(panel).getByTestId("economy-period")).toHaveTextContent(
      "Last completed month: year 3, month 2",
    );
    const employment = fact(panel, "employment");
    expect(employment).toHaveTextContent("Employed in companies");
    expect(employment).toHaveTextContent("2,320");
    expect(employment).toHaveTextContent("people");
    expect(employment.querySelector("[data-economy-chip]")).toHaveAttribute(
      "data-economy-chip",
      "4",
    );
    // Sales follows employment (secondary info), in money units at local prices.
    const facts = [...panel.querySelectorAll("[data-economy-fact]")].map((f) =>
      f.getAttribute("data-economy-fact"),
    );
    expect(facts).toEqual(["employment", "sales", "companies"]);
    expect(fact(panel, "sales")).toHaveTextContent("6,912.40");
    expect(fact(panel, "sales")).toHaveTextContent("money units · local prices");
    const table = within(panel).getByTestId("economy-goods");
    const rows = [...table.querySelectorAll("tbody tr")].map((tr) =>
      [...tr.querySelectorAll("th, td")].map((c) => c.textContent),
    );
    expect(rows).toEqual([
      ["Bread", "1,100 u.", "1.32 / u."],
      ["Flour", "4,200 u.", "1.30 / u."],
    ]);
    // No total row: quantities of different goods are never summed.
    expect(table.querySelector("tfoot")).toBeNull();
    expect(within(panel).queryByText(/total/i)).not.toBeInTheDocument();
  });

  it("missing local price is '—'; region outside the market model has sales 'no data' with reason", async () => {
    const panel = await openEconomy(R.mines);
    const tools = panel.querySelector('tr[data-economy-good="dev_tools"]')!;
    expect(tools.querySelector('[data-economy-cell="price"]')!.textContent).toBe("—");
    fireEvent.click(screen.getByRole("tab", { name: "Overview" }));
    useWorldStore.getState().set({ selectedEntityId: R.frontier });
    fireEvent.click(await screen.findByRole("tab", { name: "Economy", selected: false }));
    const frontier = await screen.findByTestId("economy-panel");
    expect(fact(frontier, "employment")).toHaveAttribute("data-economy-state", "known");
    expect(fact(frontier, "employment")).toHaveTextContent("0");
    expect(fact(frontier, "sales")).toHaveAttribute(
      "data-economy-state",
      "OUTSIDE_MARKET_MODEL",
    );
    expect(fact(frontier, "sales")).toHaveTextContent("region outside the market model");
    expect(within(frontier).getByTestId("economy-no-production")).toHaveTextContent(
      "No active companies in this region.",
    );
  });

  it("employment 'no data' is '—' with a reason, never 0 or NaN", async () => {
    const panel = await openEconomy(R.marsh);
    const employment = fact(panel, "employment");
    expect(employment).toHaveAttribute("data-economy-state", "MISSING");
    expect(employment).toHaveTextContent("—");
    expect(employment).not.toHaveTextContent(/NaN|\b0\b/);
    expect(employment.querySelector("[data-economy-chip]")).toHaveAttribute(
      "data-economy-chip",
      "none",
    );
  });

  it("Top Regions ranks by employment with class and unit; no-data regions are counted, not ranked", async () => {
    useWorldStore.getState().set({ mapMode: "economy" });
    mount();
    await screen.findByTestId("world-screen");
    const ranks = [...document.querySelectorAll("[data-economy-rank]")];
    expect(ranks.map((r) => r.getAttribute("data-economy-rank"))).toEqual([
      R.emporium,
      R.delta,
      R.harbour,
      R.mines,
      R.hills,
    ]);
    expect(ranks[0]).toHaveTextContent("12,400 people");
    expect(ranks[4]!.querySelector("[data-economy-chip]")).toHaveAttribute(
      "data-economy-chip",
      "1",
    );
    expect(screen.getByTestId("economy-ranking-note")).toHaveTextContent("(1 region)");
  });

  it("PL: labels and units", async () => {
    const panel = await openEconomy(R.delta, "pl");
    expect(fact(panel, "employment")).toHaveTextContent("Zatrudnieni w przedsiębiorstwach");
    expect(fact(panel, "employment")).toHaveTextContent("os.");
    expect(within(panel).getByTestId("economy-goods")).toHaveTextContent("jedn.");
    expect(within(panel).getByTestId("economy-goods")).toHaveTextContent("/ jedn.");
    expect(pl["world.metric.economy"]).toBe(
      "Zatrudnieni w przedsiębiorstwach · osoby · klasy stałe",
    );
    expect(en["world.change.employment"]).toBe("Employment in companies");
  });
});
