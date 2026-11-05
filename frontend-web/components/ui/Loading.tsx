"use client";

import { useI18n } from "@/components/providers/LocaleProvider";

export function Loading({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-8 text-on-surface-variant">
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent"
      />
      <span className="text-body-medium">{message ?? t("app.loading")}</span>
    </div>
  );
}