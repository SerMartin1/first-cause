import type { ReactNode } from "react";

export interface FCRailEntry {
  readonly id: string;
  readonly label: string;
}

export interface FCNavigationRailProps {
  readonly title: string;
  readonly subtitle: string;
  readonly "aria-label": string;
  /** Tylko ekrany, które istnieją -- bez wpisów-atrap (Golden UI World v1.3 §26.3 A). */
  readonly entries: readonly FCRailEntry[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
  /** Funkcje systemowe pod separatorem (np. język). */
  readonly system?: ReactNode;
  /** Stopka: stan workera i wersja silnika. */
  readonly footer?: ReactNode;
}

/** FCNavigationRail: wąski, tekstowy rail; etykieta jest identyfikatorem głównym. */
export function FCNavigationRail({
  title,
  subtitle,
  "aria-label": ariaLabel,
  entries,
  activeId,
  onSelect,
  system,
  footer,
}: FCNavigationRailProps) {
  return (
    <div className="fc-rail">
      <div className="fc-rail__brand">
        <span className="fc-rail__title">{title}</span>
        <span className="fc-rail__subtitle fc-caption">{subtitle}</span>
      </div>
      <ul className="fc-rail__entries" aria-label={ariaLabel}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              className={`fc-rail__entry${entry.id === activeId ? " fc-rail__entry--active" : ""}`}
              aria-current={entry.id === activeId ? "page" : undefined}
              onClick={() => onSelect(entry.id)}
            >
              {entry.label}
            </button>
          </li>
        ))}
      </ul>
      {system ? <div className="fc-rail__system">{system}</div> : null}
      {footer ? <div className="fc-rail__footer">{footer}</div> : null}
    </div>
  );
}
