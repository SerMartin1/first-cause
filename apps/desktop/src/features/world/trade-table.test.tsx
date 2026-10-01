import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import {
  runTradeScenario,
  TRADE_SCENARIO,
  tradeScenarioEvaluatedQuantity,
  type WorldApi,
  type WorldView,
} from "@first-cause/simulation";
import en from "../../../../../locales/en/common.json";
import pl from "../../../../../locales/pl/common.json";
import { WorldScreen } from "./WorldScreen.js";
import { useWorldStore } from "./world-store.js";
import {
  effectiveFlowLens,
  MODE_METRICS,
  NON_COMPARABLE_METRICS,
} from "./atlas-model.js";
import {
  LONG_LIST_GOODS,
  TRADE_DEV_NAMES,
  TRADE_PERIOD_TICK,
  TRADE_REGION as R,
  tradeLegacySaveView,
  tradeSimulationView,
  tradeView,
} from "./visual-trade-fixture.js";
import {
  formatTradeCell,
  sortTradeGoods,
  tradeCell,
  tradeHighlight,
  tradeRelationArc,
} from "./trade-view.js";

vi.mock("./FCLivingAtlas.js", () => ({
  FCLivingAtlas: ({ caption }: { caption?: ReactNode }) => (
    <div data-testid="atlas-mock">{caption}</div>
  ),
}));

let api: WorldApi;
function mount(view: WorldView = tradeView(), locale: "en" | "pl" = "en") {
  api = {
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
          en: { common: { ...en, ...TRADE_DEV_NAMES.en } },
          pl: { common: { ...pl, ...TRADE_DEV_NAMES.pl } },
        },
        initialLocale: locale,
      })}
    >
      <WorldScreen />
    </I18nextProvider>,
  );
}
async function openTrade(regionId: string, view?: WorldView, locale?: "en" | "pl") {
  useWorldStore.getState().set({ mapMode: "trade", selectedEntityId: regionId });
  mount(view, locale);
  return screen.findByTestId("trade-panel");
}
const goodRow = (goodId: string) =>
  document.querySelector<HTMLTableRowElement>(`tr[data-trade-good="${goodId}"]`)!;
const cells = (row: Element) =>
  [...row.querySelectorAll(":scope > td")].map((td) => td.textContent);
const columnHeaders = (table: Element) =>
  [...table.querySelectorAll(":scope > thead > tr:last-child > th")].map(
    (th) => th.textContent,
  );
const partnerRows = () =>
  [...screen.getByTestId("trade-partners").querySelectorAll(":scope > tbody > tr")].map(
    (tr) => [tr.querySelector("th")!.textContent, ...cells(tr)],
  );

beforeEach(() => {
  useWorldStore.setState(useWorldStore.getInitialState());
});

describe("Trade by goods table (M21-VIS-R4B)", () => {
  it("shows region → Regional trade → last completed month → units → table; long notes in help", async () => {
    const panel = await openTrade(R.delta);
    expect(panel).toHaveAttribute("data-trade-status", "RECORDED");
    // Nazwa regionu = tytuł sekcji inspektora, nad panelem Handlu.
    expect(screen.getByRole("heading", { name: "Great Delta" })).toBeInTheDocument();
    expect(
      within(panel).getByRole("heading", { name: "Regional trade" }),
    ).toBeInTheDocument();
    // Data świata tylko w górnym pasku: panel nie pokazuje daty okresu ani ticka.
    expect(within(panel).queryByTestId("trade-period")).toBeNull();
    expect(panel).not.toHaveTextContent(/year \d+, month \d+|tick/i);
    expect(within(panel).getByTestId("trade-units")).toHaveTextContent(
      "Delivered quantities, in each good's own units.",
    );
    const help = within(panel).getByTestId("trade-help");
    expect(help.tagName).toBe("DETAILS");
    expect(help).not.toHaveAttribute("open");
    expect(within(help).getByText(/not per settlement/)).toBeInTheDocument();
    expect(within(help).getByText(/comparison window/)).toBeInTheDocument();
    expect(within(help).queryByTestId("trade-diagnostic-tick")).toBeNull();
    const table = within(panel).getByTestId("trade-table");
    expect(columnHeaders(table)).toEqual(["Good", "Imports", "Exports"]);
    // Kontekst w przyklejanym nagłówku: czyje dane, okres względnie (bez daty).
    expect(within(table).getByTestId("trade-context")).toHaveTextContent(
      "Great Delta · last month",
    );
    expect(cells(goodRow("flour"))).toEqual(["20", "25"]);
    expect(cells(goodRow("timber"))).toEqual(["45", "0"]);
    expect(cells(goodRow("bread"))).toEqual(["0", "60"]);
    // Starszy okres (999) nie trafia do tabeli.
    expect(cells(goodRow("grain"))).toEqual(["120", "0"]);
    expect(panel.querySelectorAll("tbody tr[data-trade-good]")).toHaveLength(5);
    expect(within(panel).queryByRole("combobox")).toBeNull();
  });

  it("G: expanded partners sit under the good and add up to its row; clicking again collapses", async () => {
    const panel = await openTrade(R.delta);
    const button = within(goodRow("flour")).getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const details = goodRow("flour").nextElementSibling as HTMLElement;
    expect(button.getAttribute("aria-controls")).toBe(details.id);
    expect(partnerRows()).toEqual([
      ["Coal Hollow", "8", "5"],
      ["Green Hills", "12", "0"],
      ["Salt Harbour", "0", "20"],
    ]);
    expect(8 + 12 + 0).toBe(Number(cells(goodRow("flour"))[0]));
    expect(5 + 0 + 20).toBe(Number(cells(goodRow("flour"))[1]));
    expect(panel.querySelectorAll("tbody tr[data-trade-good]")).toHaveLength(5);
    fireEvent.click(goodRow("flour"));
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(within(panel).queryByTestId("trade-partners")).toBeNull();
  });

  it("points a pair without changing the selection; another product clears the pointed partner", async () => {
    await openTrade(R.delta);
    fireEvent.click(within(goodRow("flour")).getByRole("button"));
    const mines = within(screen.getByTestId("trade-partners")).getByRole("button", {
      name: "Coal Hollow",
    });
    fireEvent.click(mines);
    expect(mines).toHaveAttribute("aria-pressed", "true");
    expect(useWorldStore.getState()).toMatchObject({
      selectedEntityId: R.delta,
      tradeGoodId: "flour",
      tradePartnerId: R.mines,
    });
    // Oba kierunki tego samego towaru z tym samym partnerem (przypadek graniczny fixture'u).
    const region = tradeView().current.regions.find((r) => r.regionId === R.delta);
    expect(tradeHighlight(region, "flour", R.mines)?.pair).toEqual({
      partnerRegionId: R.mines,
      imports: true,
      exports: true,
    });
    fireEvent.click(within(goodRow("grain")).getByRole("button"));
    expect(useWorldStore.getState()).toMatchObject({
      tradeGoodId: "grain",
      tradePartnerId: undefined,
    });
  });

  it("J: clears expansion and partner on region change, mode change and leaving the tab", async () => {
    await openTrade(R.delta);
    fireEvent.click(within(goodRow("flour")).getByRole("button"));
    fireEvent.click(
      within(screen.getByTestId("trade-partners")).getByRole("button", {
        name: "Salt Harbour",
      }),
    );
    fireEvent.change(screen.getByLabelText("Select region"), {
      target: { value: R.harbour },
    });
    expect(useWorldStore.getState()).toMatchObject({
      tradeGoodId: undefined,
      tradePartnerId: undefined,
    });
    expect(await screen.findByTestId("trade-panel")).toHaveAttribute(
      "data-trade-region",
      R.harbour,
    );
    expect(cells(goodRow("flour"))).toEqual(["20", "0"]);
    fireEvent.click(within(goodRow("flour")).getByRole("button"));
    act(() => useWorldStore.getState().set({ mapMode: "terrain" }));
    expect(useWorldStore.getState().tradeGoodId).toBeUndefined();
    act(() => useWorldStore.getState().set({ mapMode: "trade" }));
    fireEvent.click(within(goodRow("flour")).getByRole("button"));
    fireEvent.click(screen.getByRole("tab", { name: "Overview" }));
    expect(useWorldStore.getState().tradeGoodId).toBeUndefined();
    expect(screen.queryByTestId("trade-panel")).toBeNull();
  });

  it("distinguishes 0, no trade, no data, 'at least n' and a known quantity with an unknown partner", async () => {
    await openTrade(R.quiet);
    expect(screen.getByTestId("trade-no-trade")).toHaveTextContent(
      "No trade in this period.",
    );
    fireEvent.change(screen.getByLabelText("Select region"), {
      target: { value: R.frontier },
    });
    const noData = await screen.findByTestId("trade-no-data");
    expect(noData).toHaveTextContent("No data");
    expect(noData).toHaveTextContent(/no market or regional storage/);
    expect(screen.queryByTestId("trade-table")).toBeNull();
    fireEvent.change(screen.getByLabelText("Select region"), {
      target: { value: R.marsh },
    });
    const warnings = await screen.findByTestId("trade-partial");
    expect(warnings.querySelector('[data-trade-warning="quantity"]')).not.toBeNull();
    expect(warnings.querySelector('[data-trade-warning="partner"]')).not.toBeNull();
    expect(warnings.querySelector('[data-trade-warning="legacy"]')).toBeNull();
    // 14 znane + 1 zapis bez ilości → „at least 14” (słowami, czytelne po przewinięciu).
    expect(cells(goodRow("grain"))).toEqual(["at least 14", "0"]);
    // Ilość znana, brak tylko partnera → zwykła liczba, nie dolne ograniczenie.
    expect(cells(goodRow("timber"))).toEqual(["9", "0"]);
    fireEvent.click(within(goodRow("timber")).getByRole("button"));
    expect(partnerRows()).toEqual([["Partner unknown", "9", "0"]]);
    expect(document.body.textContent).not.toContain("NaN");
    expect(document.body.textContent).not.toContain("≥");
  });

  it("shows no data before the first completed month", async () => {
    const start = tradeView();
    const atStart: WorldView = {
      ...start,
      current: {
        ...start.current,
        regions: start.current.regions.map((r) => ({
          ...r,
          trade: { status: "NO_DATA", reason: "NO_COMPLETED_PERIOD" } as const,
        })),
      },
    };
    await openTrade(R.delta, atStart);
    expect(screen.getByTestId("trade-no-data")).toHaveTextContent(
      "The world has no completed month yet.",
    );
  });

  it("J: refreshes after a tick without mixing periods or keeping a stale expansion", async () => {
    await openTrade(R.delta);
    fireEvent.click(within(goodRow("timber")).getByRole("button"));
    const before = tradeView();
    const delta = before.current.regions.find((r) => r.regionId === R.delta)!;
    const recordedTrade = delta.trade;
    if (recordedTrade.status !== "RECORDED") throw new Error("fixture");
    const next: WorldView = {
      ...before,
      current: {
        ...before.current,
        summary: { ...before.current.summary, currentTick: TRADE_PERIOD_TICK + 2 },
        regions: before.current.regions.map((r) =>
          r.regionId === R.delta
            ? {
                ...r,
                trade: {
                  ...recordedTrade,
                  period: { tick: TRADE_PERIOD_TICK + 1, year: 3, month: 3 },
                  goods: recordedTrade.goods.filter((g) => g.goodId !== "timber"),
                },
              }
            : r,
        ),
      },
    };
    vi.mocked(api.getWorld).mockResolvedValue(next);
    vi.mocked(api.setSpeed).mockResolvedValue(next);
    fireEvent.click(screen.getByRole("button", { name: "×1" }));
    // Nowy okres zastępuje stary (bez mieszania): drewna nie ma już w tabeli.
    await waitFor(() => expect(goodRow("timber")).toBeNull());
    expect(screen.queryByTestId("trade-partners")).toBeNull();
    const current = next.current.regions.find((r) => r.regionId === R.delta);
    expect(tradeHighlight(current, "timber", R.mines)).toBeUndefined();
  });

  it("H: long list keeps every good in a stable order; region and month travel with the sticky header", async () => {
    const panel = await openTrade(R.emporium);
    const ids = [...panel.querySelectorAll("tbody tr[data-trade-good]")].map((tr) =>
      tr.getAttribute("data-trade-good"),
    );
    // 30 towarów testowych + zboże i drewno wysyłane do Reed Marsh.
    expect(ids).toHaveLength(LONG_LIST_GOODS.length + 1);
    const thead = panel.querySelector("table.fc-trade__table > thead")!;
    expect(within(thead as HTMLElement).getByTestId("trade-context")).toHaveTextContent(
      "Emporium · last month",
    );
  });

  it("I: uses the localization system (PL labels, product names, 'co najmniej')", async () => {
    const panel = await openTrade(R.delta, undefined, "pl");
    expect(columnHeaders(within(panel).getByTestId("trade-table"))).toEqual([
      "Towar",
      "Przywozi",
      "Wysyła",
    ]);
    expect(
      within(panel).getByRole("heading", { name: "Handel regionu" }),
    ).toBeInTheDocument();
    expect(within(panel).getByTestId("trade-context")).toHaveTextContent(
      "Great Delta · ostatni miesiąc",
    );
    const names = [...panel.querySelectorAll("tbody tr[data-trade-good] button")].map(
      (b) => b.textContent?.replace(/^[▸▾]/, ""),
    );
    expect(names).toEqual(["Chleb", "Drewno", "Mąka", "Ruda żelaza", "Zboże"]);
    fireEvent.click(within(goodRow("flour")).getByRole("button"));
    expect(columnHeaders(screen.getByTestId("trade-partners"))).toEqual([
      "Partner",
      "Przywozi od niego",
      "Wysyła do niego",
    ]);
    fireEvent.change(screen.getByLabelText("Wybierz region"), {
      target: { value: R.marsh },
    });
    await screen.findByTestId("trade-partial");
    expect(cells(goodRow("grain"))).toEqual(["co najmniej 14", "0"]);
  });
});

describe("Trade from a production tick (TRADE_SCENARIO) -- E, F", () => {
  it("importer and exporter tables show the quantity actually moved, not the evaluated one", async () => {
    const runner = runTradeScenario(1);
    const fact = runner.facts.find((f) => f.type === "trade_flow_active")!;
    const delivered = fact.values.after as number;
    const evaluated = tradeScenarioEvaluatedQuantity(runner.worldState);
    expect(evaluated).toBeGreaterThan(delivered);
    const format = (n: number) =>
      new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(n);

    await openTrade(TRADE_SCENARIO.importerRegionId, tradeSimulationView());
    expect(cells(goodRow("flour"))).toEqual([format(delivered), "0"]);
    expect(cells(goodRow("flour"))).not.toContain(format(evaluated));
    expect(screen.getByTestId("trade-context")).toHaveTextContent("· last month");
    fireEvent.click(within(goodRow("flour")).getByRole("button"));
    expect(partnerRows()).toEqual([["Grain Basin", format(delivered), "0"]]);

    fireEvent.change(screen.getByLabelText("Select region"), {
      target: { value: TRADE_SCENARIO.exporterRegionId },
    });
    await waitFor(() =>
      expect(screen.getByTestId("trade-panel")).toHaveAttribute(
        "data-trade-region",
        TRADE_SCENARIO.exporterRegionId,
      ),
    );
    expect(cells(goodRow("flour"))).toEqual(["0", format(delivered)]);
  });

  it("B: a legacy engine record (evaluated quantity) is shown as no data with an explicit warning", async () => {
    await openTrade(TRADE_SCENARIO.importerRegionId, tradeLegacySaveView());
    expect(cells(goodRow("flour"))).toEqual(["no data", "0"]);
    expect(
      screen.getByTestId("trade-partial").querySelector('[data-trade-warning="legacy"]'),
    ).toHaveTextContent(/older engine version/);
    fireEvent.click(within(goodRow("flour")).getByRole("button"));
    expect(partnerRows()).toEqual([["Grain Basin", "no data", "0"]]);
  });
});

describe("D: no sum of different goods is shown to the player", () => {
  it("Trade has no common measure: map metric, Top Regions and Δ Change are unavailable, not a sum", async () => {
    const view = tradeView();
    for (const region of view.current.regions)
      expect(
        MODE_METRICS.trade(region, view.current, { resourceId: "", discoveryId: "" }),
      ).toBeUndefined();
    expect(NON_COMPARABLE_METRICS.has("trade")).toBe(true);
    const baseline = view.current;
    for (const region of view.current.regions)
      expect(
        MODE_METRICS.change(region, view.current, {
          resourceId: "",
          discoveryId: "",
          changeMetric: "trade",
          baseline,
        }),
      ).toBeUndefined();

    await openTrade(R.delta, view);
    expect(screen.getByTestId("ranking-empty")).toHaveTextContent(
      "Different goods cannot be summed into one number",
    );
    act(() => useWorldStore.getState().set({ mapMode: "change" }));
    const option = screen
      .getByLabelText("Change in", { exact: true })
      .querySelector('option[value="trade"]') as HTMLOptionElement;
    expect(option.disabled).toBe(true);
    expect(option.textContent).toBe("Trade (no common measure)");
    // Pozostałe metryki bez zmian.
    const population = screen
      .getByLabelText("Change in", { exact: true })
      .querySelector('option[value="population"]') as HTMLOptionElement;
    expect(population.disabled).toBe(false);
  });
});

describe("trade-view helpers", () => {
  const q = (known: number, records: number, unknownRecords = 0) => ({
    known,
    records,
    unknownRecords,
  });
  const format = (n: number) => String(n);
  const labels = { atLeast: (v: string) => `at least ${v}`, noData: "no data" };
  it("formats known zero, full, partial and unavailable cells distinctly", () => {
    expect(formatTradeCell(tradeCell(q(0, 0)), format, labels)).toBe("0");
    expect(formatTradeCell(tradeCell(q(12, 2)), format, labels)).toBe("12");
    expect(formatTradeCell(tradeCell(q(12, 3, 1)), format, labels)).toBe("at least 12");
    expect(formatTradeCell(tradeCell(q(0, 2, 2)), format, labels)).toBe("no data");
  });
  it("sorts goods by localized name with a stable id tie-break", () => {
    const row = (goodId: string) => ({
      goodId,
      imported: q(0, 0),
      exported: q(0, 0),
      partners: [],
    });
    const names: Record<string, string> = { b: "Alpha", a: "Alpha", c: "Beta" };
    expect(
      sortTradeGoods([row("c"), row("b"), row("a")], (id) => names[id]!, "en").map(
        (g) => g.goodId,
      ),
    ).toEqual(["a", "b", "c"]);
  });
  it("draws the two directions of a pair on opposite sides, arrow pointing to the importer", () => {
    const a = { x: 0, y: 0 },
      b = { x: 100, y: 0 };
    const ab = tradeRelationArc(a, b),
      ba = tradeRelationArc(b, a);
    expect(Math.sign(ab.arrow[1].y)).toBe(-Math.sign(ba.arrow[1].y));
    expect(ab.arrow[1].x).toBeGreaterThan(ab.arrow[0].x);
    expect(ba.arrow[1].x).toBeLessThan(ba.arrow[0].x);
    expect(ab.dashes.length).toBeGreaterThan(4);
  });
  it("leaves room for a region label: no dash and no arrow inside the avoided box", () => {
    const a = { x: 0, y: 0 },
      b = { x: 200, y: 0 };
    const free = tradeRelationArc(a, b);
    // Etykieta dokładnie tam, gdzie wypadłby grot.
    const tip = free.arrow[1];
    const label = { x: tip.x - 20, y: tip.y - 8, w: 40, h: 16 };
    const arc = tradeRelationArc(a, b, { avoid: [label] });
    const inBox = (p: { x: number; y: number }) =>
      p.x >= label.x &&
      p.x <= label.x + label.w &&
      p.y >= label.y &&
      p.y <= label.y + label.h;
    expect(arc.hiddenDashes).toBeGreaterThan(0);
    expect(arc.dashes.some(([p, r]) => inBox(p) || inBox(r))).toBe(false);
    expect(arc.arrowClear).toBe(true);
    expect(arc.arrow.some(inBox)).toBe(false);
  });
});

describe("Flow Lens in Trade (no quantity comparison of different goods)", () => {
  it("Trade lens is visible but disabled with an explanation; a stored 'trade' lens is inert", async () => {
    useWorldStore.getState().set({ flowLens: "trade" });
    await openTrade(R.delta);
    const lens = screen.getByLabelText(/Flow Lens/) as HTMLSelectElement;
    const trade = lens.querySelector('option[value="trade"]') as HTMLOptionElement;
    expect(trade.disabled).toBe(true);
    expect(trade.textContent).toBe("Trade (no common measure)");
    expect(lens.closest("label")).toHaveAttribute(
      "title",
      expect.stringContaining("different goods have no common measure"),
    );
    // Zapamiętany stan „trade” działa jak „wyłączone”: brak Top N, brak podpisu wielkości.
    expect(lens.value).toBe("off");
    expect(screen.queryByLabelText("Flow limit")).toBeNull();
    expect(screen.getByTestId("atlas-mock")).not.toHaveTextContent(
      "width: monthly volume",
    );
    expect(effectiveFlowLens("trade")).toBe("off");
    // Wskazanie partnera z tabeli nadal działa (relacja, nie porównanie ilości).
    fireEvent.click(within(goodRow("flour")).getByRole("button"));
    fireEvent.click(
      within(screen.getByTestId("trade-partners")).getByRole("button", {
        name: "Coal Hollow",
      }),
    );
    expect(useWorldStore.getState()).toMatchObject({
      tradeGoodId: "flour",
      tradePartnerId: R.mines,
    });
  });

  it("other lenses keep working after switching the Atlas mode", async () => {
    await openTrade(R.delta);
    act(() => useWorldStore.getState().set({ mapMode: "technology" }));
    const lens = screen.getByLabelText(/Flow Lens/) as HTMLSelectElement;
    fireEvent.change(lens, { target: { value: "technology" } });
    expect(useWorldStore.getState().flowLens).toBe("technology");
    expect(effectiveFlowLens("technology")).toBe("technology");
    expect(lens.value).toBe("technology");
    expect(screen.getByLabelText("Flow limit")).toBeInTheDocument();
    expect(screen.getByTestId("atlas-mock")).toHaveTextContent("Source → recipient");
  });
});
