import type { ReactNode } from "react";

export interface FCMetricProps {
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string;
  readonly trend?: ReactNode;
}

/**
 * FCMetric (UI Visual Design System v1.0 SS49.4): "FCMetric nie jest
 * domyślnie kartą" -- a label/value pair, not a KPI card. Compose with
 * `FCTrend` for the trend glyph, per SS19 ("trend zamiast samej
 * liczby").
 */
export function FCMetric({ label, value, unit, trend }: FCMetricProps) {
  return (
    <div className="fc-metric">
      <span className="fc-metric__label fc-label">{label}</span>
      <span className="fc-metric__value fc-data">
        {value}
        {unit ? <span className="fc-metric__unit fc-caption"> {unit}</span> : null}
      </span>
      {trend ? <span className="fc-metric__trend">{trend}</span> : null}
    </div>
  );
}
