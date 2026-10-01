import { useTranslation } from "react-i18next";
import type { WorldRegionView, WorldSnapshot } from "@first-cause/simulation";
import {
  economyClass,
  formatEmploymentFull,
  formatMoney,
  regionEmploymentFact,
  regionSalesFact,
  ECONOMY_SQUARE,
  type EconomyClass,
} from "./economy-mode.js";

/**
 * M21-VIS-R4B Economy (Canonical Decisions §52C) -- zakładka „Gospodarka”
 * inspektora regionu. Hierarchia: Gospodarka regionu → okres → zatrudnieni w
 * przedsiębiorstwach (miara trybu, z klasą) → sprzedaż firm (informacja
 * dodatkowa) → aktywne firmy → produkcja według towarów (bez sumy różnych
 * towarów; ilość i cena z jednostką towaru). Style tabeli i pomocy:
 * istniejące klasy panelu Handlu (`fc-trade__*`).
 */
export function FCEconomyPanel({
  region,
  snapshot,
  format,
}: {
  readonly region: WorldRegionView;
  readonly snapshot: WorldSnapshot;
  readonly format: (value: number) => string;
}) {
  const { t, i18n } = useTranslation();
  const economy = region.economy;
  // Ten sam okres co Handel: ostatni zakończony miesiąc (1 tick = 1 miesiąc).
  const now = snapshot.summary.currentDate;
  const period =
    now.month === 1 ? { year: now.year - 1, month: 12 } : { year: now.year, month: now.month - 1 };
  const goodName = (id: string) =>
    t(`content.good.${id}.name`, {
      defaultValue: t(`content.resource.${id}.name`, { defaultValue: id }),
    });
  const employment = regionEmploymentFact(region);
  const sales = regionSalesFact(region);
  // Produkcja, której nie da się rozdzielić na towary (nieznana receptura albo
  // adopcja metody w ostatnim ticku): tabela jest częściowa, a pusta tabela
  // to „brak danych”, nigdy „nic nie wytworzono”.
  const methodChanged = economy.methodChangedCompanies;
  const goodsIncomplete = economy.unattributedCompanies + methodChanged > 0;
  return (
    <section
      className="fc-trade fc-economy"
      aria-labelledby="fc-economy-title"
      data-testid="economy-panel"
      data-economy-region={region.regionId}
    >
      <header className="fc-trade__header">
        <h3 id="fc-economy-title">{t("world.economy.title")}</h3>
        <p data-testid="economy-period">
          <span className="fc-label">{t("world.trade.lastMonth")}</span>{" "}
          <span className="fc-trade__period">
            {t("world.trade.lastMonthValue", { year: period.year, month: period.month })}
          </span>
        </p>
      </header>
      <div
        className="fc-economy__fact fc-economy__fact--primary"
        data-economy-fact="employment"
        data-economy-state={employment.kind === "known" ? "known" : employment.reason}
      >
        <span className="fc-label">{t("world.economy.employment")}</span>
        <span className="fc-economy__value">
          <FCEconomyChip
            cls={employment.kind === "known" ? economyClass(employment.value) : "none"}
          />
          <span className="fc-data">
            {employment.kind === "known"
              ? formatEmploymentFull(employment.value, i18n.language)
              : t("world.economy.noDataLabel")}
          </span>
          {employment.kind === "known" && (
            <span className="fc-caption">{t("world.economy.employmentUnit")}</span>
          )}
        </span>
        <span className="fc-caption fc-economy__reason">
          {employment.kind === "known"
            ? t("world.economy.employmentNote")
            : t("world.economy.reason.MISSING")}
        </span>
      </div>
      <div
        className="fc-economy__fact"
        data-economy-fact="sales"
        data-economy-state={sales.kind === "known" ? "known" : sales.reason}
      >
        <span className="fc-label">{t("world.economy.sales")}</span>
        <span className="fc-economy__value">
          <span className="fc-data">
            {sales.kind === "known"
              ? formatMoney(sales.value, i18n.language)
              : t("world.economy.noDataLabel")}
          </span>
          {sales.kind === "known" && (
            <span className="fc-caption">{t("world.economy.salesUnit")}</span>
          )}
        </span>
        {sales.kind === "unavailable" && (
          <span className="fc-caption fc-economy__reason">
            {t(`world.economy.reason.${sales.reason}`)}
          </span>
        )}
      </div>
      <div className="fc-economy__fact" data-economy-fact="companies">
        <span className="fc-label">{t("world.activeCompanies")}</span>
        <span className="fc-data">{format(economy.activeCompanies)}</span>
      </div>
      <h4 className="fc-economy__subtitle">{t("world.economy.goodsTitle")}</h4>
      {economy.goods.length === 0 && goodsIncomplete ? (
        <p className="fc-trade__state" data-testid="economy-goods-unavailable" role="status">
          {t("world.economy.goodsUnavailable")}
        </p>
      ) : economy.goods.length === 0 ? (
        <p className="fc-trade__state" data-testid="economy-no-production" role="status">
          {t(
            economy.activeCompanies === 0
              ? "world.economy.noCompanies"
              : "world.economy.noProduction",
          )}
        </p>
      ) : (
        <>
          <p className="fc-caption" data-testid="economy-units">
            {t("world.economy.units")}
          </p>
          <table
            className="fc-trade__table"
            data-testid="economy-goods"
            data-economy-goods-coverage={goodsIncomplete ? "partial" : "complete"}
          >
            <colgroup>
              <col />
              <col className="fc-trade__num-col" />
              <col className="fc-economy__price-col" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{t("world.trade.good")}</th>
                <th scope="col" className="fc-trade__num">
                  {t("world.economy.produced")}
                </th>
                <th scope="col" className="fc-trade__num">
                  {t("world.economy.localPrice")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...economy.goods]
                .sort((a, b) =>
                  goodName(a.goodId).localeCompare(goodName(b.goodId), i18n.language),
                )
                .map((g) => (
                  <tr key={g.goodId} data-economy-good={g.goodId}>
                    <th scope="row">{goodName(g.goodId)}</th>
                    <td className="fc-data fc-trade__num" data-economy-cell="produced">
                      {format(g.produced)}{" "}
                      <span className="fc-caption">{t("world.economy.goodUnit")}</span>
                    </td>
                    <td className="fc-data fc-trade__num" data-economy-cell="price">
                      {g.localPrice === undefined ? (
                        <span title={t("world.economy.noPrice")}>—</span>
                      ) : (
                        <>
                          {formatMoney(g.localPrice, i18n.language)}{" "}
                          <span className="fc-caption">{t("world.economy.perGoodUnit")}</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
      {economy.unattributedCompanies > 0 && (
        <p className="fc-trade__warnings" data-testid="economy-unattributed" role="status">
          {t("world.economy.unattributed", { count: economy.unattributedCompanies })}
        </p>
      )}
      {methodChanged > 0 && (
        <p className="fc-trade__warnings" data-testid="economy-method-changed" role="status">
          {t("world.economy.methodChanged", { count: methodChanged })}
        </p>
      )}
      <details className="fc-trade__help">
        <summary>{t("world.economy.help.title")}</summary>
        <ul>
          <li>{t("world.economy.help.employment")}</li>
          <li>{t("world.economy.help.sales")}</li>
          <li>{t("world.economy.help.goods")}</li>
          <li>{t("world.economy.help.notGdp")}</li>
        </ul>
      </details>
    </section>
  );
}

/** Kwadrat klasy -- ten sam znak co na Atlasie i w legendzie. */
export function FCEconomyChip({ cls }: { readonly cls: EconomyClass | "none" }) {
  const side = ECONOMY_SQUARE.side[cls === "none" ? 0 : cls];
  const box = ECONOMY_SQUARE.side[5] + 2;
  const o = (box - side) / 2;
  const empty = cls === "none" || cls === 0;
  return (
    <svg
      className="fc-economy__chip"
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden="true"
      data-economy-chip={cls}
    >
      <rect
        x={o}
        y={o}
        width={side}
        height={side}
        fill={empty ? "none" : "var(--fc-info)"}
        fillOpacity={empty ? 0 : ECONOMY_SQUARE.alpha[cls]}
        stroke={
          cls === "none"
            ? "var(--fc-text-muted)"
            : cls === 0
              ? "var(--fc-text-secondary)"
              : "var(--fc-info)"
        }
        strokeWidth={ECONOMY_SQUARE.stroke}
        strokeDasharray={cls === "none" ? "2.2 2.2" : undefined}
      />
    </svg>
  );
}
