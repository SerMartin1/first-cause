import type { ReactNode } from "react";

export interface FCAppShellProps {
  readonly topNavigation: ReactNode;
  readonly simulationBar: ReactNode;
  readonly children: ReactNode;
}

/**
 * FCAppShell (UI Visual Design System v1.0 SS49.2): the outermost
 * layout -- top navigation, simulation bar, then the active screen's
 * content. Only one screen exists so far (the technical shell); more
 * are added to `children`/`FCTopNavigation`'s tabs as they land
 * (M11+, full integration M21).
 */
export function FCAppShell({ topNavigation, simulationBar, children }: FCAppShellProps) {
  return (
    <div className="fc-app-shell">
      <header className="fc-app-shell__top-navigation">{topNavigation}</header>
      <div className="fc-app-shell__simulation-bar">{simulationBar}</div>
      <main className="fc-app-shell__content">{children}</main>
    </div>
  );
}
