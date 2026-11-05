import { Home, User, Users, type LucideIcon } from "lucide-react-native";

export interface TabItem {
  name: string;
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const tabItems: TabItem[] = [
  {
    name: "index",
    href: "/",
    labelKey: "nav.home",
    icon: Home,
  },
  {
    name: "family/members",
    href: "/family/members",
    labelKey: "nav.members",
    icon: Users,
  },
  {
    name: "profile",
    href: "/profile",
    labelKey: "nav.profile",
    icon: User,
  },
];
