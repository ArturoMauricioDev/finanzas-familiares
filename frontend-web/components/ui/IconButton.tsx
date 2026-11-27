import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "default" | "primary" | "danger";

const tones: Record<Tone, string> = {
  default: "text-on-surface-variant hover:bg-on-surface/8",
  primary: "text-primary hover:bg-primary/8",
  danger: "text-error hover:bg-error/8",
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  selected?: boolean;
  tone?: Tone;
  loading?: boolean;
}

export function IconButton({
  label,
  children,
  className,
  selected,
  tone = "default",
  loading = false,
  disabled,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      aria-pressed={selected}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        "inline-flex min-h-12 min-w-12 items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-40",
        tones[tone],
        selected && "bg-secondary-container text-on-secondary-container",
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        children
      )}
    </button>
  );
}
