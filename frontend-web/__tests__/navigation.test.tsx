import { fireEvent, render, screen } from "@testing-library/react";

import { BottomNavigation } from "../components/navigation/BottomNavigation";
import { NavigationRail } from "../components/navigation/NavigationRail";
import { Sidebar } from "../components/navigation/Sidebar";
import { TopAppBar } from "../components/navigation/TopAppBar";
import { navItems, primaryNavItems } from "../components/navigation/nav-items";
import { clearSession } from "../lib/session";
import type { UserAuthInfo } from "../lib/types";

let mockPathname = "/family/members";
const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => mockRouter,
}));

jest.mock("../lib/session", () => ({
  clearSession: jest.fn(),
}));

const mockClearSession = clearSession as jest.MockedFunction<typeof clearSession>;

const user: UserAuthInfo = {
  id: "user-1",
  email: "ana@example.com",
  nombre_visualizacion: "Ana",
  foto_avatar: null,
  family_id: "family-1",
  role: "admin",
};

beforeEach(() => {
  jest.clearAllMocks();
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

    expect(screen.getByRole("link", { name: "Familia" })).toHaveAttribute("aria-current", "page");
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

describe("web profile menu", () => {
  it("opens the avatar menu with Perfil and Cerrar sesión", () => {
    render(<TopAppBar user={user} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú de perfil" }));

    expect(screen.getByRole("menuitem", { name: "Perfil" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("navigates to the profile from the avatar menu", () => {
    render(<TopAppBar user={user} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú de perfil" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Perfil" }));

    expect(mockRouter.push).toHaveBeenCalledWith("/profile");
  });

  it("asks for confirmation before logging out from the avatar menu", () => {
    render(<TopAppBar user={user} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú de perfil" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));

    expect(screen.getByText("¿Quieres cerrar sesión en este dispositivo?")).toBeInTheDocument();
    expect(mockClearSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login");
  });
});