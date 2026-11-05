"use client";

import { useId, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({
  label,
  hint,
  error,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;

  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="block text-label-large text-on-surface">
        {label}
      </label>
      <select
        {...props}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(
          "min-h-12 w-full rounded-sm border bg-surface px-3 text-body-large text-on-surface",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          error ? "border-error" : "border-outline",
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error || hint ? (
        <p id={messageId} className={cn("text-body-small", error ? "text-error" : "text-on-surface-variant")}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}
