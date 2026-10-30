import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { api } from "@/lib/api";
import * as auth from "@/lib/auth";
import * as session from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

import LoginPage from "@/app/auth/login/page";
import ProfileSetupPage from "@/app/profile/setup/page";
import FamilySelectPage from "@/app/family/select/page";
import FamilyCreatePage from "@/app/family/create/page";
import InvitePage from "@/app/invite/page";
import FamilyMembersPage from "@/app/family/members/page";

const mockRouter = { push: jest.fn(), replace: jest.fn() };
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/test",
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: ReactNode }) => children,
  GoogleLogin: ({ onSuccess }: { onSuccess: (response: { credential: string }) => void }) => (
    <button type="button" onClick={() => onSuccess({ credential: "google-token" })}>
      Google login
    </button>
  ),
}));

jest.mock("@/lib/auth", () => ({
  GOOGLE_CLIENT_ID: "test-client",
  signInWithGoogle: jest.fn(),
}));

jest.mock("@/lib/session", () => ({
  getSession: jest.fn(),
  applyTokenResponse: jest.fn(),
  applyFamilyCreated: jest.fn(),
  applyInvitationJoined: jest.fn(),
  updateSession: jest.fn(),
  clearSession: jest.fn(),
}));

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  return {
    ...actual,
    api: {
      signInWithGoogle: jest.fn(),
      updateProfile: jest.fn(),
      createFamily: jest.fn(),
      getFamily: jest.fn(),
      createInvitation: jest.fn(),
      joinInvitation: jest.fn(),
      promoteMember: jest.fn(),
      removeMember: jest.fn(),
    },
  };
});

jest.mock("@/hooks/useAuthGuard", () => ({
  useAuthGuard: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockUseAuthGuard = useAuthGuard as jest.Mock;
const mockSession = session as jest.Mocked<typeof session>;
const mockAuth = auth as jest.Mocked<typeof auth>;

function buildSession(overrides: Partial<session.SessionState> = {}): session.SessionState {
  return {
    access_token: "access",
    refresh_token: "refresh",
    user: {
      id: "user-1",
      email: "ana@example.com",
      nombre_visualizacion: "Ana",
      foto_avatar: "https://example.com/ana.png",
      family_id: null,
      role: null,
    },
    needs_profile_setup: false,
    needs_family_setup: false,
    ...overrides,
  };
}

function useSession(current: session.SessionState) {
  mockUseAuthGuard.mockReturnValue({ session: current, ready: true });
}

const family = {
  id: "family-1",
  nombre: "Familia Pérez",
  moneda_local: "MXN",
  creado_por: "user-1",
  fecha_creacion: "2026-10-29T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams.delete("token");
  window.confirm = jest.fn(() => true);
});

describe("web onboarding flows", () => {
  it("signs in with Google and redirects to profile setup", async () => {
    const nextSession = buildSession({ needs_profile_setup: true, needs_family_setup: true });
    mockAuth.signInWithGoogle.mockResolvedValue({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "bearer",
      user: nextSession.user,
      needs_profile_setup: true,
      needs_family_setup: true,
    });
    mockSession.applyTokenResponse.mockReturnValue(nextSession);

    render(<LoginPage />);
    fireEvent.click(screen.getByText("Google login"));

    await waitFor(() => expect(mockAuth.signInWithGoogle).toHaveBeenCalledWith("google-token"));
    expect(mockSession.applyTokenResponse).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith("/profile/setup");
  });

  it("saves the profile and redirects to family selection", async () => {
    useSession(buildSession({ needs_profile_setup: true, needs_family_setup: true }));
    mockApi.updateProfile.mockResolvedValue({
      id: "user-1",
      nombre_visualizacion: "Ana",
      foto_avatar: "https://example.com/ana.png",
      family_id: null,
      role: null,
    });

    render(<ProfileSetupPage />);
    fireEvent.change(screen.getByLabelText("Nombre de visualización"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("URL de la foto de avatar"), {
      target: { value: "https://example.com/ana.png" },
    });
    fireEvent.click(screen.getByText("Guardar y continuar"));

    await waitFor(() =>
      expect(mockApi.updateProfile).toHaveBeenCalledWith({
        nombre_visualizacion: "Ana",
        foto_avatar: "https://example.com/ana.png",
      }),
    );
    expect(mockSession.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({ needs_profile_setup: false }),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith("/family/select");
  });

  it("offers both group selection options", () => {
    useSession(buildSession({ needs_family_setup: true }));

    render(<FamilySelectPage />);

    expect(screen.getByRole("link", { name: "Crear nuevo grupo familiar" })).toHaveAttribute(
      "href",
      "/family/create",
    );
    expect(screen.getByRole("link", { name: "Unirme mediante enlace" })).toHaveAttribute(
      "href",
      "/invite",
    );
  });

  it("creates a family and stores the refreshed tokens", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.createFamily.mockResolvedValue({
      family,
      membership: { role: "admin", estado: "activo" },
      tokens: { access_token: "new-access", refresh_token: "new-refresh", token_type: "bearer" },
    });

    render(<FamilyCreatePage />);
    fireEvent.change(screen.getByLabelText("Nombre de la familia"), {
      target: { value: "Familia Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/Moneda local/), {
      target: { value: "MXN" },
    });
    fireEvent.click(screen.getByText("Crear grupo"));

    await waitFor(() =>
      expect(mockApi.createFamily).toHaveBeenCalledWith({
        nombre: "Familia Pérez",
        moneda_local: "MXN",
      }),
    );
    expect(mockSession.applyFamilyCreated).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/family/members");
  });

  it("joins a family from an invitation link", async () => {
    mockSearchParams.set("token", "invite-token");
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.joinInvitation.mockResolvedValue({
      family_id: "family-1",
      role: "member",
      estado: "activo",
      tokens: { access_token: "join-access", refresh_token: "join-refresh", token_type: "bearer" },
    });

    render(<InvitePage />);
    expect(screen.getByLabelText("Token de invitación")).toHaveValue("invite-token");
    fireEvent.change(screen.getByLabelText("Parentesco (opcional)"), {
      target: { value: "hija" },
    });
    fireEvent.click(screen.getByText("Unirme al grupo"));

    await waitFor(() =>
      expect(mockApi.joinInvitation).toHaveBeenCalledWith({
        token: "invite-token",
        parentesco: "hija",
      }),
    );
    expect(mockSession.applyInvitationJoined).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/family/members");
  });

  it("lets an admin invite, promote and expel members", async () => {
    useSession(buildSession({ user: { ...buildSession().user, role: "admin" } }));
    mockApi.getFamily.mockResolvedValue({
      family,
      members: [
        {
          user_id: "user-1",
          nombre_visualizacion: "Ana",
          foto_avatar: null,
          role: "admin",
          parentesco: null,
          estado: "activo",
        },
        {
          user_id: "user-2",
          nombre_visualizacion: "Luis",
          foto_avatar: null,
          role: "member",
          parentesco: "hijo",
          estado: "activo",
        },
      ],
      member_count: 2,
    });
    mockApi.createInvitation.mockResolvedValue({
      invitation_id: "invitation-1",
      token: "invite-token",
      link: "http://localhost:3000/invite?token=invite-token",
      expira_en: "2026-11-02T00:00:00Z",
    });
    mockApi.promoteMember.mockResolvedValue({ success: true, role: "admin" });
    mockApi.removeMember.mockResolvedValue({ success: true });

    render(<FamilyMembersPage />);

    await screen.findByText("Familia Pérez");
    fireEvent.click(screen.getByText("Generar invitación"));
    await waitFor(() => expect(mockApi.createInvitation).toHaveBeenCalled());
    expect(screen.getByText("http://localhost:3000/invite?token=invite-token")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Promover"));
    await waitFor(() => expect(mockApi.promoteMember).toHaveBeenCalledWith("user-2"));

    fireEvent.click(screen.getByText("Expulsar"));
    await waitFor(() => expect(mockApi.removeMember).toHaveBeenCalledWith("user-2"));
    expect(window.confirm).toHaveBeenCalled();
  });
});
