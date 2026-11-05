"use client";

import { useId } from "react";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export function RadioGroup({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
}) {
  const legendId = useId();
  return (
    <fieldset aria-labelledby={legendId} className="space-y-2">
      <legend id={legendId} className="text-label-large text-on-surface">
        {legend}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-3 rounded-sm border border-outline-variant p-3 hover:bg-surface-container-low"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-1 h-5 w-5 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <span>
            <span className="block text-body-large text-on-surface">{option.label}</span>
            {option.description ? (
              <span className="mt-1 block text-body-small text-on-surface-variant">{option.description}</span>
            ) : null}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
