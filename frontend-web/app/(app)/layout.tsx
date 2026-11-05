"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/navigation/AppShell";
import { useI18n } from "@/components/providers/LocaleProvider";
import { Loading } from "@/components/ui";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { session, ready } = useAuthGuard(true);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading message={t("app.loading")} />
      </div>
    );
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
