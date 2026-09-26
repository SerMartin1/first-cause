import type { ReactNode } from "react";

export interface FCAppShellProps {
  readonly navigationRail: ReactNode;
  readonly children: ReactNode;
}

/**
 * FCAppShell: stały lewy rail nawigacyjny + obszar aktywnego ekranu
 * (Golden UI World v1.3 §26.3 A, Canonical Decisions UI-004 / UI-014).
 * Górny pasek czasu i World Pulse należy do ekranu World, bo czyta jego
 * Read Model.
 */
export function FCAppShell({ navigationRail, children }: FCAppShellProps) {
  return (
    <div className="fc-app-shell">
      <nav className="fc-app-shell__rail">{navigationRail}</nav>
      <main className="fc-app-shell__content">{children}</main>
    </div>
  );
}
