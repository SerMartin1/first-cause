import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@first-cause/localization";
import type { WorldApi, WorldView } from "@first-cause/simulation";
import en from "../../../../../locales/en/common.json";
import pl from "../../../../../locales/pl/common.json";
import { WorldScreen } from "./WorldScreen.js";
import { useWorldStore } from "./world-store.js";
import {
  LONG_LIST_GOODS,
  TRADE_DEV_NAMES,
  TRADE_PERIOD_TICK,
  TRADE_REGION as R,
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
const cells = (row: HTMLElement) =>
  [...row.querySelectorAll("td")].map((td) => td.textContent);

beforeEach(() => {
  useWorldStore.setState(useWorldStore.getInitialState());
});

describe("Trade by goods table (M21-VIS-R4B)", () => {
  it("opens with the Trade tab in Trade mode: region scope, real period, one row per good", async () => {
    const panel = await openTrade(R.delta);
    expect(panel).toHaveAttribute("data-trade-status", "RECORDED");
    expect(within(panel).getByText("Regional trade")).toBeInTheDocument();
    expect(within(panel).getByTestId("trade-period")).toHaveTextContent(
      `Month 2, year 3 · tick ${TRADE_PERIOD_TICK}`,
    );
    expect(within(panel).getByText(/not per settlement/)).toBeInTheDocument();
    const headers = [...panel.querySelectorAll("thead th")].map((th) => th.textContent);
    expect(headers).toEqual(["Good", "Imports", "Exports"]);
    // Import i eksport tego samego towaru w JEDNYM wierszu; tylko przywóz / tylko wywóz = znane 0.
    expect(cells(goodRow("dev_tools"))).toEqual(["12", "20"]);
    expect(cells(goodRow("dev_coal"))).toEqual(["45", "0"]);
    expect(cells(goodRow("dev_cloth"))).toEqual(["0", "60"]);
    // Starszy okres (999) nie trafia do tabeli.
    expect(cells(goodRow("grain"))).toEqual(["120", "0"]);
    // Wszystkie towary bez przełączania; brak osobnych list przywozu/wywozu.
    expect(panel.querySelectorAll("tbody tr[data-trade-good]")).toHaveLength(6);
    expect(within(panel).queryByRole("combobox")).toBeNull();
  });

  it("expands partners directly under the good, keeps the other goods, and collapses again", async () => {
    const panel = await openTrade(R.delta);
    const button = within(goodRow("grain")).getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const details = goodRow("grain").nextElementSibling as HTMLElement;
    expect(button.getAttribute("aria-controls")).toBe(details.id);
    const partners = within(details).getByTestId("trade-partners");
    const rows = [...partners.querySelectorAll(":scope > tbody > tr")].map((tr) => [
      tr.querySelector("th")!.textContent,
      ...cells(tr as HTMLElement),
    ]);
    expect(rows).toEqual([
      ["Green Hills", "70", "0"],
      ["Salt Harbour", "50", "0"],
    ]);
    // Suma partnerów = wiersz towaru.
    expect(70 + 50).toBe(Number(cells(goodRow("grain"))[0]));
    expect(panel.querySelectorAll("tbody tr[data-trade-good]")).toHaveLength(6);
    expect(useWorldStore.getState().tradeGoodId).toBe("grain");
    // Kliknięcie wiersza (mysz) też przełącza; ponowne zwija.
    fireEvent.click(goodRow("grain"));
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(within(panel).queryByTestId("trade-partners")).toBeNull();
    expect(useWorldStore.getState().tradeGoodId).toBeUndefined();
  });

  it("shows a partner once with both directions and points the pair without changing the selection", async () => {
    await openTrade(R.delta);
    fireEvent.click(within(goodRow("dev_tools")).getByRole("button"));
    const partners = screen.getByTestId("trade-partners");
    expect(
      [...partners.querySelectorAll(":scope > tbody > tr")].map((tr) =>
        cells(tr as HTMLElement),
      ),
    ).toEqual([
      ["12", "0"],
      ["0", "20"],
    ]);
    const harbour = within(partners).getByRole("button", { name: "Salt Harbour" });
    fireEvent.click(harbour);
    expect(harbour).toHaveAttribute("aria-pressed", "true");
    expect(useWorldStore.getState()).toMatchObject({
      selectedEntityId: R.delta,
      tradeGoodId: "dev_tools",
      tradePartnerId: R.harbour,
    });
    fireEvent.click(harbour);
    expect(useWorldStore.getState().tradePartnerId).toBeUndefined();
  });

  it("clears expansion and partner on region change, mode change and leaving the tab", async () => {
    await openTrade(R.delta);
    fireEvent.click(within(goodRow("dev_tools")).getByRole("button"));
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
    // Nowy region: jego własne dane, nie wiersze poprzedniego.
    expect(await screen.findByTestId("trade-panel")).toHaveAttribute(
      "data-trade-region",
      R.harbour,
    );
    expect(cells(goodRow("dev_tools"))).toEqual(["20", "0"]);
    fireEvent.click(within(goodRow("dev_tools")).getByRole("button"));
    act(() => useWorldStore.getState().set({ mapMode: "terrain" }));
    expect(useWorldStore.getState().tradeGoodId).toBeUndefined();
    act(() => useWorldStore.getState().set({ mapMode: "trade" }));
    fireEvent.click(within(goodRow("dev_tools")).getByRole("button"));
    fireEvent.click(screen.getByRole("tab", { name: "Overview" }));
    expect(useWorldStore.getState().tradeGoodId).toBeUndefined();
    expect(screen.queryByTestId("trade-panel")).toBeNull();
  });

  it("distinguishes no trade, no data and partial data -- never a silent 0", async () => {
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
    expect(await screen.findByTestId("trade-partial")).toBeInTheDocument();
    // 14 znane + 1 zapis bez ilości → „≥ 14”, nie „14” i nie „NaN”.
    expect(cells(goodRow("dev_fish"))).toEqual(["≥ 14", "0"]);
    fireEvent.click(within(goodRow("dev_reeds")).getByRole("button"));
    expect(screen.getByTestId("trade-partners")).toHaveTextContent("Partner unknown");
    expect(document.body.textContent).not.toContain("NaN");
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

  it("refreshes after a tick without mixing periods or keeping a stale expansion", async () => {
    await openTrade(R.delta);
    fireEvent.click(within(goodRow("dev_coal")).getByRole("button"));
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
                  goods: recordedTrade.goods.filter((g) => g.goodId !== "dev_coal"),
                },
              }
            : r,
        ),
      },
    };
    vi.mocked(api.getWorld).mockResolvedValue(next);
    vi.mocked(api.setSpeed).mockResolvedValue(next);
    fireEvent.click(screen.getByRole("button", { name: "×1" }));
    await waitFor(() =>
      expect(screen.getByTestId("trade-period")).toHaveTextContent(
        `tick ${TRADE_PERIOD_TICK + 1}`,
      ),
    );
    expect(goodRow("dev_coal")).toBeNull();
    expect(screen.queryByTestId("trade-partners")).toBeNull();
    // Wyróżnienie Atlasu wyprowadzane z bieżących danych: brak towaru → brak wyróżnienia.
    const current = next.current.regions.find((r) => r.regionId === R.delta);
    expect(tradeHighlight(current, "dev_coal", R.mines)).toBeUndefined();
  });

  it("keeps a long list complete and in a stable, localized order", async () => {
    const panel = await openTrade(R.emporium);
    const ids = [...panel.querySelectorAll("tbody tr[data-trade-good]")].map((tr) =>
      tr.getAttribute("data-trade-good"),
    );
    // 30 towarów długiej listy + ryby wysyłane do Reed Marsh.
    expect(ids).toHaveLength(LONG_LIST_GOODS.length + 1);
    expect(ids).toEqual([...LONG_LIST_GOODS, "dev_fish"].sort());
    // Nagłówek przykleja się do kontenera przewijania inspektora (klasa CSS sticky).
    expect(panel.querySelector("table.fc-trade__table > thead")).not.toBeNull();
  });

  it("uses the localization system (PL labels and number format)", async () => {
    const panel = await openTrade(R.delta, undefined, "pl");
    const headers = [...panel.querySelectorAll("thead th")].map((th) => th.textContent);
    expect(headers).toEqual(["Towar", "Przywozi", "Wysyła"]);
    expect(within(panel).getByText("Handel regionu")).toBeInTheDocument();
    expect(within(goodRow("grain")).getByRole("button")).toHaveTextContent("Zboże");
    fireEvent.click(within(goodRow("grain")).getByRole("button"));
    const partners = screen.getByTestId("trade-partners");
    expect(
      [...partners.querySelectorAll("thead th")].map((th) => th.textContent),
    ).toEqual(["Partner", "Przywozi od niego", "Wysyła do niego"]);
  });
});

describe("trade-view helpers", () => {
  const q = (known: number, records: number, unknownRecords = 0) => ({
    known,
    records,
    unknownRecords,
  });
  const format = (n: number) => String(n);
  it("formats known zero, full, partial and unavailable cells distinctly", () => {
    expect(formatTradeCell(tradeCell(q(0, 0)), format)).toBe("0");
    expect(formatTradeCell(tradeCell(q(12, 2)), format)).toBe("12");
    expect(formatTradeCell(tradeCell(q(12, 3, 1)), format)).toBe("≥ 12");
    expect(formatTradeCell(tradeCell(q(0, 2, 2)), format)).toBe("—");
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
    const midY = (arc: typeof ab) => arc.arrow[1].y;
    expect(Math.sign(midY(ab))).toBe(-Math.sign(midY(ba)));
    expect(ab.arrow[1].x).toBeGreaterThan(ab.arrow[0].x);
    expect(ba.arrow[1].x).toBeLessThan(ba.arrow[0].x);
    expect(ab.dashes.length).toBeGreaterThan(4);
  });
});
