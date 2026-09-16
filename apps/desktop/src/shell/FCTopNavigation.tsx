import type { ReactNode } from "react";
import { FCTabs, type FCTab } from "../components/fc/FCTabs.js";

export interface FCTopNavigationProps {
  readonly title: string;
  readonly tabs: readonly FCTab[];
  readonly activeTabId: string;
  readonly onTabChange: (id: string) => void;
  /** Trailing controls -- e.g. the language switcher. */
  readonly children?: ReactNode;
}

/** FCTopNavigation (UI Visual Design System v1.0 SS49.2): brand + tabs + trailing controls. */
export function FCTopNavigation({
  title,
  tabs,
  activeTabId,
  onTabChange,
  children,
}: FCTopNavigationProps) {
  return (
    <div className="fc-top-navigation">
      <span className="fc-top-navigation__title fc-page-title">{title}</span>
      <FCTabs
        tabs={tabs}
        activeId={activeTabId}
        onChange={onTabChange}
        aria-label={title}
      />
      {children ? <div className="fc-top-navigation__controls">{children}</div> : null}
    </div>
  );
}
