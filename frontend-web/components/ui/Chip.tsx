import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Chip({
  selected = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-sm border px-3 text-label-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-secondary-container bg-secondary-container text-on-secondary-container"
          : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-high",
        className,
      )}
    >
      {children}
    </button>
  );
}