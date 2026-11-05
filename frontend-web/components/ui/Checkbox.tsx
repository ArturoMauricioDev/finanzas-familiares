"use client";

import { useId, type InputHTMLAttributes } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
}

export function Checkbox({ label, hint, id, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="flex items-start gap-3">
      <input
        {...props}
        id={inputId}
        type="checkbox"
        className={[
          "mt-0.5 h-5 w-5 rounded-xs border-outline text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className ?? "",
        ].join(" ")}
      />
      <label htmlFor={inputId} className="text-body-medium text-on-surface">
        {label}
        {hint ? <span className="mt-1 block text-body-small text-on-surface-variant">{hint}</span> : null}
      </label>
    </div>
  );
}
