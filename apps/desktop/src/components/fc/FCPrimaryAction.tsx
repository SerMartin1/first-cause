import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface FCPrimaryActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
}

/**
 * FCPrimaryAction (UI Visual Design System v1.0 SS9, SS49.3): rectangular,
 * flat, accent-filled -- `[ APPLY INTERVENTION ]`. No gradients, no glow.
 * There should be at most one obvious primary action per context.
 */
export function FCPrimaryAction({
  children,
  className,
  type = "button",
  ...rest
}: FCPrimaryActionProps) {
  return (
    <button
      type={type}
      className={["fc-primary-action", "fc-body", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
