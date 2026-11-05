import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

function Banner({
  children,
  tone,
  role,
}: {
  children: ReactNode;
  tone: "error" | "success" | "info";
  role: "alert" | "status";
}) {
  const tones = {
    error: "border-error/40 bg-error-container text-on-error-container",
    success: "border-success/40 bg-success-container text-on-success-container",
    info: "border-outline-variant bg-surface-container-high text-on-surface",
  };
  return (
    <div role={role} className={cn("rounded-sm border px-4 py-3 text-body-medium", tones[tone])}>
      {children}
    </div>
  );
}

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Banner tone="error" role="alert">{message}</Banner>;
}

export function SuccessMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Banner tone="success" role="status">{message}</Banner>;
}

export function InlineBanner({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
}) {
  return <Banner tone={tone} role={tone === "error" ? "alert" : "status"}>{children}</Banner>;
}
