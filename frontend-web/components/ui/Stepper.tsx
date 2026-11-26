"use client";

import { cn } from "@/lib/cn";

export interface StepperProps {
  current: number;
  total: number;
  titles: string[];
  progressLabel: string;
  announce: string;
}

export function Stepper({ current, total, titles, progressLabel, announce }: StepperProps) {
  const cappedTotal = total > 0 ? total : 1;
  const percentage = Math.min(100, Math.max(0, (current / cappedTotal) * 100));

  return (
    <div className="space-y-3">
      <p className="text-label-large font-semibold text-on-surface">{progressLabel}</p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={progressLabel}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high"
      >
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ol className="flex flex-wrap gap-x-4 gap-y-1">
        {titles.map((title, index) => {
          const active = index + 1 === current;
          return (
            <li
              key={title}
              aria-current={active ? "step" : undefined}
              className={cn(
                "text-body-small",
                active ? "font-semibold text-primary" : "text-on-surface-variant",
              )}
            >
              {title}
            </li>
          );
        })}
      </ol>
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
