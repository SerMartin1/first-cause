export interface FCTab {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface FCTabsProps {
  readonly tabs: readonly FCTab[];
  readonly activeId: string;
  readonly onChange: (id: string) => void;
  readonly "aria-label": string;
}

/** FCTabs (UI Visual Design System v1.0 SS49.3): flat, text-based tab navigation. */
export function FCTabs({
  tabs,
  activeId,
  onChange,
  "aria-label": ariaLabel,
}: FCTabsProps) {
  return (
    <div className="fc-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          disabled={tab.disabled}
          className={`fc-tabs__tab fc-label${tab.id === activeId ? " fc-tabs__tab--active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
