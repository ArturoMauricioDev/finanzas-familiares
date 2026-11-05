import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Page({
  title,
  subtitle,
  children,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn("mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12", className)}
    >
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-headline-medium font-bold text-on-surface sm:text-headline-large">
            {title}
          </h1>
          {subtitle ? <p className="mt-2 text-body-large text-on-surface-variant">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </main>
  );
}
