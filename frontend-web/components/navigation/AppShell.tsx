"use client";

import type { ReactNode } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import type { UserAuthInfo } from "@/lib/types";
import { BottomNavigation } from "./BottomNavigation";
import { NavigationRail } from "./NavigationRail";
import { Sidebar } from "./Sidebar";
import { TopAppBar } from "./TopAppBar";

export function AppShell({ user, children }: { user: UserAuthInfo; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-surface">
      <a href="#main-content" className="skip-link">
        {t("a11y.skipToContent")}
      </a>
      <TopAppBar user={user} />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar />
        <NavigationRail />
        <div className="min-w-0 flex-1 pb-20 min-[600px]:pb-0">{children}</div>
      </div>
      <BottomNavigation />
    </div>
  );
}
