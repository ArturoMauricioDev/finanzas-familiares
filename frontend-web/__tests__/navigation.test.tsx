import { render, screen } from "@testing-library/react";

import { BottomNavigation } from "../components/navigation/BottomNavigation";
import { NavigationRail } from "../components/navigation/NavigationRail";
import { Sidebar } from "../components/navigation/Sidebar";
import { navItems, primaryNavItems } from "../components/navigation/nav-items";

let mockPathname = "/family/members";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

beforeEach(() => {
  mockPathname = "/family/members";
});

describe("web navigation", () => {
  it("defines four destinations and three primary tabs", () => {
    expect(navItems.map((item) => item.href)).toEqual([
      "/",
      "/family/members",
      "/profile",
      "/settings",
    ]);
    expect(primaryNavItems.map((item) => item.href)).toEqual([
      "/",
      "/family/members",
      "/profile",
    ]);
    expect(primaryNavItems.some((item) => item.href === "/settings")).toBe(false);
  });

  it("renders the expanded sidebar with all four destinations", () => {
    render(<Sidebar />);

    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Ajustes" })).toHaveAttribute("href", "/settings");
  });

  it("marks the current destination with aria-current", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Miembros" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });

  it("renders the medium rail with all destinations", () => {
    render(<NavigationRail />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("keeps settings out of the compact bottom tabs", () => {
    render(<BottomNavigation />);

    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.queryByRole("link", { name: "Ajustes" })).not.toBeInTheDocument();
  });
});