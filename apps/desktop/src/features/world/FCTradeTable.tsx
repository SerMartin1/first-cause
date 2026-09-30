import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { WorldRegionView, WorldSnapshot } from "@first-cause/simulation";
import { useWorldStore } from "./world-store.js";
import { formatTradeCell, sortTradeGoods, tradeCell } from "./trade-view.js";

/**
 * M21-VIS-R4B -- Handel według towarów: jedna tabela TOWAR | PRZYWOZI |
 * WYSYŁA; kliknięcie towaru rozwija pod nim partnerów, kliknięcie
 * partnera wskazuje parę na Atlasie. Zakres = region (tak rejestruje
 * handel symulacja); dane wyłącznie z `WorldRegionView.trade`.
 */
export function FCTradeTable({
  region,
  snapshot,
  format,
}: {
  readonly region: WorldRegionView;
  readonly snapshot: WorldSnapshot;
  readonly format: (value: number) => string;
}) {
  const { t, i18n } = useTranslation();
  const tradeGoodId = useWorldStore((s) => s.tradeGoodId);
  const tradePartnerId = useWorldStore((s) => s.tradePartnerId);
  const set = useWorldStore((s) => s.set);
  const trade = region.trade;
  const goodName = (id: string) =>
    t(`content.good.${id}.name`, {
      defaultValue: t(`content.resource.${id}.name`, { defaultValue: id }),
    });
  const regionName = (id: string | undefined) =>
    id === undefined
      ? t("world.trade.unknownPartner")
      : (snapshot.regions.find((r) => r.regionId === id)?.name ?? id);

  return (
    <section
      className="fc-trade"
      aria-labelledby="fc-trade-title"
      data-testid="trade-panel"
      data-trade-status={trade.status}
      data-trade-region={region.regionId}
    >
      <header className="fc-trade__header">
        <h3 id="fc-trade-title">{t("world.trade.title")}</h3>
        {trade.status === "RECORDED" && (
          <p className="fc-data" data-testid="trade-period">
            {t("world.trade.period", {
              month: trade.period.month,
              year: trade.period.year,
              tick: trade.period.tick,
            })}
          </p>
        )}
        <p className="fc-caption">{t("world.trade.scopeNote")}</p>
      </header>
      {trade.status === "NO_DATA" ? (
        <div className="fc-trade__state" data-testid="trade-no-data" role="status">
          <strong>{t("world.trade.noData")}</strong>
          <p className="fc-caption">{t(`world.trade.noDataReason.${trade.reason}`)}</p>
        </div>
      ) : trade.goods.length === 0 ? (
        <p className="fc-trade__state" data-testid="trade-no-trade" role="status">
          {t("world.trade.noTrade")}
        </p>
      ) : (
        <>
          <p className="fc-caption">{t("world.trade.unitNote")}</p>
          {trade.incomplete && (
            <p className="fc-caption fc-trade__partial" data-testid="trade-partial">
              {t("world.trade.partial")}
            </p>
          )}
          <table className="fc-trade__table" data-testid="trade-table">
            <thead>
              <tr>
                <th scope="col">{t("world.trade.good")}</th>
                <th scope="col" className="fc-trade__num">
                  {t("world.trade.imports")}
                </th>
                <th scope="col" className="fc-trade__num">
                  {t("world.trade.exports")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortTradeGoods(trade.goods, goodName, i18n.language).map((good) => {
                const expanded = good.goodId === tradeGoodId;
                const detailsId = `fc-trade-partners-${good.goodId}`;
                const toggle = () =>
                  set({
                    tradeGoodId: expanded ? undefined : good.goodId,
                    tradePartnerId: undefined,
                  });
                return (
                  <Fragment key={good.goodId}>
                    <tr
                      className="fc-trade__good"
                      data-trade-good={good.goodId}
                      data-expanded={expanded}
                      onClick={toggle}
                    >
                      <th scope="row">
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-controls={expanded ? detailsId : undefined}
                          onClick={(event) => {
                            // Wiersz obsługuje kliknięcie myszą; przycisk -- klawiaturę.
                            event.stopPropagation();
                            toggle();
                          }}
                        >
                          <span aria-hidden="true" className="fc-trade__chevron">
                            {expanded ? "▾" : "▸"}
                          </span>
                          {goodName(good.goodId)}
                        </button>
                      </th>
                      <td className="fc-data fc-trade__num" data-trade-cell="imports">
                        {formatTradeCell(tradeCell(good.imported), format)}
                      </td>
                      <td className="fc-data fc-trade__num" data-trade-cell="exports">
                        {formatTradeCell(tradeCell(good.exported), format)}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="fc-trade__details" id={detailsId}>
                        <td colSpan={3}>
                          <table
                            className="fc-trade__partners"
                            data-testid="trade-partners"
                            aria-label={`${goodName(good.goodId)} · ${t("world.trade.partner")}`}
                          >
                            <thead>
                              <tr>
                                <th scope="col">{t("world.trade.partner")}</th>
                                <th scope="col" className="fc-trade__num">
                                  {t("world.trade.importsFrom")}
                                </th>
                                <th scope="col" className="fc-trade__num">
                                  {t("world.trade.exportsTo")}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...good.partners]
                                .sort((a, b) =>
                                  a.partnerRegionId === undefined
                                    ? 1
                                    : b.partnerRegionId === undefined
                                      ? -1
                                      : regionName(a.partnerRegionId).localeCompare(
                                          regionName(b.partnerRegionId),
                                          i18n.language,
                                        ) ||
                                        a.partnerRegionId.localeCompare(
                                          b.partnerRegionId,
                                        ),
                                )
                                .map((partner) => {
                                  const id = partner.partnerRegionId;
                                  const pointed =
                                    id !== undefined && id === tradePartnerId;
                                  return (
                                    <tr
                                      key={id ?? "__unknown"}
                                      data-trade-partner={id ?? "unknown"}
                                    >
                                      <th scope="row">
                                        {id === undefined ? (
                                          <span className="fc-trade__unknown">
                                            {regionName(id)}
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            aria-pressed={pointed}
                                            title={t("world.trade.showPartner")}
                                            onClick={() =>
                                              set({
                                                tradePartnerId: pointed ? undefined : id,
                                              })
                                            }
                                          >
                                            {regionName(id)}
                                          </button>
                                        )}
                                      </th>
                                      <td className="fc-data fc-trade__num">
                                        {formatTradeCell(
                                          tradeCell(partner.imported),
                                          format,
                                        )}
                                      </td>
                                      <td className="fc-data fc-trade__num">
                                        {formatTradeCell(
                                          tradeCell(partner.exported),
                                          format,
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <p className="fc-caption">{t("world.trade.hint")}</p>
        </>
      )}
    </section>
  );
}
