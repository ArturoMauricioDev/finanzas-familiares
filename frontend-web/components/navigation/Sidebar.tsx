"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/cn";
import { navItems } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label={t("nav.primary")}
      className="hidden w-64 shrink-0 border-r border-outline-variant bg-surface-container-low p-3 min-[840px]:block"
    >
      <ul className="sticky top-20 space-y-1">
        {navItems.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 items-center gap-4 rounded-full px-4 text-label-large transition-colors",
                  active
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-on-surface/8 hover:text-on-surface",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
              >
                <Icon size={24} aria-hidden="true" />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
