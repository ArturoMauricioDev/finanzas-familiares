"use client";

import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Menu } from "@/components/ui/Menu";
import { Wordmark } from "@/components/ui/Wordmark";
import { clearSession } from "@/lib/session";
import type { UserAuthInfo } from "@/lib/types";
import { navItems } from "./nav-items";

function sectionTitle(pathname: string, translate: (key: string) => string): string {
  const item = navItems.find((entry) => entry.match(pathname));
  return item ? translate(item.labelKey) : translate("app.name");
}

export function TopAppBar({ user }: { user: UserAuthInfo }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const theme = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const logout = () => {
    setConfirmLogout(false);
    clearSession();
    router.replace("/auth/login");
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-3 sm:px-6">
          <Link href="/family/members" className="rounded-sm">
            <Wordmark size="md" className="hidden sm:inline-flex" />
            <Wordmark size="sm" className="sm:hidden" />
          </Link>
          <span className="ml-1 hidden text-title-medium text-on-surface-variant min-[840px]:inline">
            {sectionTitle(pathname, t)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <IconButton
              label={t("a11y.themeToggle")}
              onClick={() => theme.setMode(theme.resolved === "dark" ? "light" : "dark")}
            >
              {theme.resolved === "dark" ? <Sun size={22} /> : <Moon size={22} />}
            </IconButton>
            <Menu
              label={t("a11y.profileMenu")}
              trigger={
                <Avatar
                  name={user.nombre_visualizacion}
                  seed={user.email || user.id}
                  src={user.foto_avatar}
                  size="md"
                />
              }
              triggerClassName="h-12 w-12"
              items={[
                {
                  id: "profile",
                  label: t("nav.profile"),
                  onSelect: () => router.push("/profile"),
                },
                {
                  id: "logout",
                  label: t("common.logout"),
                  onSelect: () => setConfirmLogout(true),
                },
              ]}
            />
          </div>
        </div>
      </header>
      <ConfirmDialog
        open={confirmLogout}
        title={t("settings.logoutConfirmTitle")}
        description={t("settings.logoutConfirmBody")}
        confirmLabel={t("common.logout")}
        cancelLabel={t("common.cancel")}
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={logout}
      />
    </>
  );
}
