"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/cn";
import { primaryNavItems } from "./nav-items";

export function BottomNavigation() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label={t("nav.primary")}
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container min-[600px]:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {primaryNavItems.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1",
                  active ? "text-on-secondary-container" : "text-on-surface-variant",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-16 items-center justify-center rounded-full",
                    active && "bg-secondary-container",
                  )}
                >
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className="text-label-medium">{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
