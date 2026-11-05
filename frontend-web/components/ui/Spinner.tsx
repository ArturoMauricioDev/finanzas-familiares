"use client";

import { useI18n } from "@/components/providers/LocaleProvider";

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  const text = label ?? t("a11y.loading");
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-r-transparent"
      />
      <span className="sr-only">{text}</span>
    </span>
  );
}