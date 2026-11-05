import { Home, Settings, User, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

export const navItems: NavItem[] = [
  {
    href: "/",
    labelKey: "nav.home",
    icon: Home,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/family/members",
    labelKey: "nav.members",
    icon: Users,
    match: (pathname) => pathname.startsWith("/family/members"),
  },
  {
    href: "/profile",
    labelKey: "nav.profile",
    icon: User,
    match: (pathname) => pathname.startsWith("/profile"),
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    icon: Settings,
    match: (pathname) => pathname.startsWith("/settings"),
  },
];

export const primaryNavItems = navItems.slice(0, 3);
export const webNavItems = navItems;
