"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
}

export function TextField({
  label,
  hint,
  error,
  leading,
  className,
  id,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-label-large text-on-surface">
        {label}
      </label>
      <div
        className={cn(
          "flex min-h-12 items-center gap-2 rounded-sm border bg-surface px-3 transition-colors",
          "focus-within:ring-2 focus-within:ring-primary",
          error ? "border-error" : "border-outline",
        )}
      >
        {leading ? <span className="text-on-surface-variant">{leading}</span> : null}
        <input
          {...props}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            "min-h-11 w-full bg-transparent py-2 text-body-large text-on-surface outline-none",
            "placeholder:text-on-surface-variant/70",
            className,
          )}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-body-small text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-body-small text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <TextField label={label} hint={hint} {...props} />;
}
