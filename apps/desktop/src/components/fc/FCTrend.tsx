export interface FCTrendProps {
  /** Percentage change, e.g. 6.2 for "+6.2%". */
  readonly percent: number;
}

/**
 * FCTrend (UI Visual Design System v1.0 SS49.4): "Kolor nigdy nie jest
 * jedynym nośnikiem trendu" -- always paired with a directional glyph,
 * never color alone. `▲ +6.2%` / `▼ -3.1%` / `— 0.0%`.
 */
export function FCTrend({ percent }: FCTrendProps) {
  const direction = percent > 0 ? "up" : percent < 0 ? "down" : "flat";
  const glyph = direction === "up" ? "▲" : direction === "down" ? "▼" : "—";
  const sign = percent > 0 ? "+" : "";
  const toneClass =
    direction === "up"
      ? "fc-trend--positive"
      : direction === "down"
        ? "fc-trend--negative"
        : "fc-trend--flat";

  return (
    <span className={`fc-trend fc-data ${toneClass}`}>
      {glyph} {sign}
      {percent.toFixed(1)}%
    </span>
  );
}
