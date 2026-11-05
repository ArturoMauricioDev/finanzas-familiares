"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/cn";
import { navItems } from "./nav-items";

export function NavigationRail() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label={t("nav.primary")}
      className="hidden w-20 shrink-0 border-r border-outline-variant bg-surface-container-low px-2 py-3 min-[600px]:flex min-[840px]:hidden"
    >
      <ul className="sticky top-20 flex w-full flex-col items-center gap-2">
        {navItems.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="w-full">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg px-1 text-center transition-colors",
                  active
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-on-surface/8 hover:text-on-surface",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
              >
                <Icon size={24} aria-hidden="true" />
                <span className="text-label-small leading-tight">{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
