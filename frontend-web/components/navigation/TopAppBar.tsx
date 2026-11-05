"use client";

import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/providers/LocaleProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { Wordmark } from "@/components/ui/Wordmark";
import type { UserAuthInfo } from "@/lib/types";
import { navItems } from "./nav-items";

function sectionTitle(pathname: string, translate: (key: string) => string): string {
  const item = navItems.find((entry) => entry.match(pathname));
  return item ? translate(item.labelKey) : translate("app.name");
}

export function TopAppBar({ user }: { user: UserAuthInfo }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-3 sm:px-6">
        <Link href="/family/members" aria-label={t("a11y.wordmark")} className="rounded-sm">
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
          <Link
            href="/profile"
            aria-label={t("nav.profile")}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Avatar
              name={user.nombre_visualizacion}
              seed={user.email || user.id}
              src={user.foto_avatar}
              size="md"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
