import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

function Banner({
  children,
  tone,
  role,
  action,
}: {
  children: ReactNode;
  tone: "error" | "success" | "info";
  role: "alert" | "status";
  action?: ReactNode;
}) {
  const tones = {
    error: "border-error/40 bg-error-container text-on-error-container",
    success: "border-success/40 bg-success-container text-on-success-container",
    info: "border-outline-variant bg-surface-container-high text-on-surface",
  };
  return (
    <div
      role={role}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-sm border px-4 py-3 text-body-medium",
        tones[tone],
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ErrorMessage({
  message,
  action,
}: {
  message?: string | null;
  action?: ReactNode;
}) {
  if (!message) return null;
  return (
    <Banner tone="error" role="alert" action={action}>
      {message}
    </Banner>
  );
}

export function SuccessMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Banner tone="success" role="status">
      {message}
    </Banner>
  );
}

export function InlineBanner({
  children,
  tone = "info",
  action,
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
  action?: ReactNode;
}) {
  return (
    <Banner tone={tone} role={tone === "error" ? "alert" : "status"} action={action}>
      {children}
    </Banner>
  );
}
