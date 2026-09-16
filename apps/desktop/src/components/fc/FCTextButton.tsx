import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface FCTextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
}

/**
 * FCTextButton (UI Visual Design System v1.0 SS9, SS49.3): the
 * preferred style for secondary/navigational actions --
 * `WHY? ->`, `OPEN REGION ->`, `VIEW ALL ->`, `TRACE ->`.
 */
export function FCTextButton({
  children,
  className,
  type = "button",
  ...rest
}: FCTextButtonProps) {
  return (
    <button
      type={type}
      className={["fc-text-button", "fc-body", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
