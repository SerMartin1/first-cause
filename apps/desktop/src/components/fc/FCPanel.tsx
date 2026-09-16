import type { ReactNode } from "react";

export interface FCPanelProps {
  readonly title?: string;
  readonly children: ReactNode;
}

/**
 * FCPanel (UI Visual Design System v1.0 SS8, SS51 "Anti-Card Rule"):
 * only for content that is genuinely its own functional unit (e.g. one
 * Architect intervention, one Chronicle entry) -- never used just
 * because a number happens to have a label. Default to `FCSection`.
 */
export function FCPanel({ title, children }: FCPanelProps) {
  return (
    <div className="fc-panel">
      {title && <h3 className="fc-panel__title fc-subsection">{title}</h3>}
      <div className="fc-panel__body">{children}</div>
    </div>
  );
}
