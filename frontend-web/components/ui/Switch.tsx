"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-body-large text-on-surface">
        {label}
        {hint ? <span className="mt-1 block text-body-small text-on-surface-variant">{hint}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          checked ? "border-primary bg-primary" : "border-outline bg-surface-container-highest",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full transition-transform",
            checked ? "left-8 bg-on-primary" : "left-1 bg-outline",
          )}
        />
      </button>
    </div>
  );
}
