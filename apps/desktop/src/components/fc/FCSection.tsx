import type { ReactNode } from "react";

export interface FCSectionProps {
  readonly title: string;
  readonly children: ReactNode;
}

/**
 * FCSection (UI Visual Design System v1.0 SS8, SS49.2): the *default*
 * way to group content -- "SECTION TITLE / separator / rows", not a
 * card. Reach for `FCPanel` only at a real semantic boundary.
 */
export function FCSection({ title, children }: FCSectionProps) {
  return (
    <section className="fc-section">
      <h2 className="fc-section__title fc-section-title">{title}</h2>
      <div className="fc-section__body">{children}</div>
    </section>
  );
}
