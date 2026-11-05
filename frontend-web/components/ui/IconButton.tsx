import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  selected?: boolean;
}

export function IconButton({
  label,
  children,
  className,
  selected,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-12 min-w-12 items-center justify-center rounded-full text-on-surface-variant transition-colors",
        "hover:bg-on-surface/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-40",
        selected && "bg-secondary-container text-on-secondary-container",
        className,
      )}
    >
      {children}
    </button>
  );
}
