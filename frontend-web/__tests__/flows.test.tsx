import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactNode } from "react";

import { api, ApiError, refreshSession } from "@/lib/api";
import * as auth from "@/lib/auth";
import * as session from "@/lib/session";
import { useFamilyDraft } from "@/lib/store/familyDraft";
import { useLastInvitation } from "@/lib/store/invitation";
import { useAuthGuard } from "@/hooks/useAuthGuard";

import LoginPage from "@/app/(auth)/auth/login/page";
import ProfileSetupPage from "@/app/(onboarding)/profile/setup/page";
import FamilySelectPage from "@/app/(onboarding)/family/select/page";
import FamilyCreatePage from "@/app/(onboarding)/family/create/page";
import InvitePage from "@/app/(onboarding)/invite/page";
import FamilyMembersPage from "@/app/(app)/family/members/page";
import HomePage from "@/app/(app)/page";
import SettingsPage from "@/app/(app)/settings/page";
import ProfilePage from "@/app/(app)/profile/page";

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
  signInWithGoogle: jest.fn(),
}));

jest.mock("@/lib/session", () => ({
  getSession: jest.fn(),
  applyTokenResponse: jest.fn(),
  applyFamilyCreated: jest.fn(),
  applyInvitationJoined: jest.fn(),
  updateSession: jest.fn(),
  clearSession: jest.fn(),
  getPendingInviteToken: jest.fn(() => null),
  savePendingInviteToken: jest.fn(),
  clearPendingInviteToken: jest.fn(),
  getPendingInviteCode: jest.fn(() => null),
  savePendingInviteCode: jest.fn(),
  clearPendingInviteCode: jest.fn(),
  capturePendingInviteFromUrl: jest.fn(() => null),
  applyFamilyLeft: jest.fn(),
}));

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  return {
    ...actual,
    refreshSession: jest.fn(),
    api: {
      signInWithGoogle: jest.fn(),
      updateProfile: jest.fn(),
      deleteAccount: jest.fn(),
      createFamily: jest.fn(),
      getFamily: jest.fn(),
      createInvitation: jest.fn(),
      getInvitation: jest.fn(),
      joinInvitation: jest.fn(),
      joinFamilyByCode: jest.fn(),
      leaveFamily: jest.fn(),
      deleteFamily: jest.fn(),
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
const mockRefreshSession = refreshSession as jest.Mock;

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
  useLastInvitation.setState({ familyId: null, invitation: null, hydrated: false });
  mockApi.getInvitation.mockResolvedValue({
    invitation_id: "invitation-default",
    codigo: "DEFAULT1",
    usado: false,
    expira_en: "2026-12-03T00:00:00Z",
  });
  mockSearchParams.delete("token");
  mockSession.getPendingInviteCode.mockReturnValue(null);
  mockSession.getPendingInviteCode.mockReturnValue(null);
  window.confirm = jest.fn(() => true);
  window.localStorage.clear();
  useFamilyDraft.setState({
    step: 1,
    nombre: "",
    moneda: "",
    rolFamiliar: "padre",
    hydrated: false,
  });
});

describe("web onboarding flows", () => {
  it("explains the promise and what comes later before asking for an account", () => {
    render(<LoginPage />);

    expect(
      screen.getByText("El lugar de tu familia para organizarse. Finanzas y presupuestos, en camino."),
    ).toBeInTheDocument();
    expect(screen.getByText("Finanzas y presupuestos, en camino")).toBeInTheDocument();
    expect(screen.getAllByText(/en camino/).length).toBeGreaterThan(0);
    expect(
      screen.getByText("Entras con tu cuenta de Google. No publicamos nada en tu nombre."),
    ).toBeInTheDocument();
  });

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

  it("sends invited users to the invite flow after signing in", async () => {
    const nextSession = buildSession({ needs_family_setup: true });
    mockAuth.signInWithGoogle.mockResolvedValue({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "bearer",
      user: nextSession.user,
      needs_profile_setup: false,
      needs_family_setup: true,
    });
    mockSession.applyTokenResponse.mockReturnValue(nextSession);
    mockSession.getPendingInviteCode.mockReturnValue("invite-token");

    render(<LoginPage />);
    fireEvent.click(screen.getByText("Google login"));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/invite"));
  });

  it("keeps the first-run order and never lands on Home before there is a family", async () => {
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

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/profile/setup"));
    expect(mockRouter.push).not.toHaveBeenCalledWith("/");
    expect(mockRouter.push).not.toHaveBeenCalledWith("/family/select");
  });

  it("preserves the pending invitation code through login and skips family selection", async () => {
    const nextSession = buildSession({ needs_family_setup: true });
    mockAuth.signInWithGoogle.mockResolvedValue({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "bearer",
      user: nextSession.user,
      needs_profile_setup: false,
      needs_family_setup: true,
    });
    mockSession.applyTokenResponse.mockReturnValue(nextSession);
    mockSession.getPendingInviteCode.mockReturnValue("invite-code");

    render(<LoginPage />);
    fireEvent.click(screen.getByText("Google login"));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/invite"));
    expect(mockSession.getPendingInviteCode).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalledWith("/family/select");
  });

  it("sends users who already have a family to Home", async () => {
    const nextSession = buildSession();
    mockAuth.signInWithGoogle.mockResolvedValue({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "bearer",
      user: nextSession.user,
      needs_profile_setup: false,
      needs_family_setup: false,
    });
    mockSession.applyTokenResponse.mockReturnValue(nextSession);

    render(<LoginPage />);
    fireEvent.click(screen.getByText("Google login"));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/"));
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
    fireEvent.click(screen.getByText("Guardar y continuar"));

    await waitFor(() =>
      expect(mockApi.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre_visualizacion: "Ana",
          foto_avatar: expect.stringMatching(/^data:image\/svg\+xml,/),
        }),
      ),
    );
    expect(mockSession.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({ needs_profile_setup: false }),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith("/family/select");
  });

  it("sends users with a pending invite to the invite flow after profile setup", async () => {
    useSession(buildSession({ needs_profile_setup: true, needs_family_setup: true }));
    mockSession.getPendingInviteCode.mockReturnValue("invite-token");
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
    fireEvent.click(screen.getByText("Guardar y continuar"));

    await waitFor(() => expect(mockApi.updateProfile).toHaveBeenCalled());
    expect(mockRouter.replace).toHaveBeenCalledWith("/invite");
  });

  it("offers create as the primary action when there is no pending code", () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockSession.getPendingInviteCode.mockReturnValue(null);

    render(<FamilySelectPage />);

    const create = screen.getByRole("link", { name: "Crear familia" });
    const invited = screen.getByRole("link", { name: "Tengo un código" });
    expect(create).toHaveAttribute("href", "/family/create");
    expect(invited).toHaveAttribute("href", "/invite");
    expect(create.className).toContain("bg-primary");
    expect(invited.className).toContain("border-outline");
  });

  it("offers join as the primary action when an invitation code is pending", () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockSession.getPendingInviteCode.mockReturnValue("ABCD1234");

    render(<FamilySelectPage />);

    const join = screen.getByRole("link", { name: "Unirme con mi código" });
    const create = screen.getByRole("link", { name: "Crear familia" });
    expect(join).toHaveAttribute("href", "/invite");
    expect(create).toHaveAttribute("href", "/family/create");
    expect(join.className).toContain("bg-primary");
    expect(create.className).toContain("border-outline");
  });

  it("creates a family stepping through the wizard and stores the refreshed tokens", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.createFamily.mockResolvedValue({
      family,
      membership: { role: "admin", estado: "activo" },
      tokens: { access_token: "new-access", refresh_token: "new-refresh", token_type: "bearer" },
    });

    render(<FamilyCreatePage />);

    const nameField = await screen.findByLabelText("Nombre de la familia");
    fireEvent.change(nameField, { target: { value: "Familia Pérez" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fireEvent.change(await screen.findByLabelText(/Moneda local/), {
      target: { value: "EUR" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Revisa antes de crear")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Crear familia" }));

    await waitFor(() =>
      expect(mockApi.createFamily).toHaveBeenCalledWith({
        nombre: "Familia Pérez",
        moneda_local: "EUR",
        rol_familiar: "padre",
      }),
    );
    expect(mockSession.applyFamilyCreated).toHaveBeenCalled();
    expect(mockSession.clearPendingInviteCode).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });

  it("blocks the wizard step until the name is valid and keeps values when going back", async () => {
    useSession(buildSession({ needs_family_setup: true }));

    render(<FamilyCreatePage />);

    const nameField = await screen.findByLabelText("Nombre de la familia");
    const continueButton = screen.getByRole("button", { name: "Continuar" });
    expect(continueButton).toBeDisabled();

    fireEvent.change(nameField, { target: { value: "Familia Pérez" } });
    expect(continueButton).toBeEnabled();
    fireEvent.click(continueButton);

    fireEvent.change(await screen.findByLabelText(/Moneda local/), {
      target: { value: "EUR" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Revisa antes de crear")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    expect(screen.getByLabelText(/Moneda local/)).toHaveValue("EUR");
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    expect(screen.getByLabelText("Nombre de la familia")).toHaveValue("Familia Pérez");
  });

  it("has no detectable accessibility violations across the wizard steps", async () => {
    useSession(buildSession({ needs_family_setup: true }));

    const { container } = render(<FamilyCreatePage />);
    await screen.findByLabelText("Nombre de la familia");

    let results = await axe(container);
    expect(results.violations).toHaveLength(0);

    fireEvent.change(screen.getByLabelText("Nombre de la familia"), {
      target: { value: "Familia Pérez" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByLabelText(/Moneda local/);

    results = await axe(container);
    expect(results.violations).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/Moneda local/), { target: { value: "EUR" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByText("Revisa antes de crear");

    results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("joins a family with an invitation code", async () => {
    mockSession.getPendingInviteCode.mockReturnValue("ABCD1234");
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.joinFamilyByCode.mockResolvedValue({
      family_id: "family-1",
      role: "member",
      estado: "activo",
      tokens: { access_token: "join-access", refresh_token: "join-refresh", token_type: "bearer" },
    });

    render(<InvitePage />);
    expect(screen.getByLabelText("Código de invitación")).toHaveValue("ABCD1234");
    fireEvent.change(screen.getByLabelText("Código de invitación"), {
      target: { value: "abcd-1234" },
    });
    expect(mockSession.savePendingInviteCode).toHaveBeenCalledWith("ABCD1234");
    fireEvent.click(screen.getByText("Unirme a la familia"));

    await waitFor(() =>
      expect(mockApi.joinFamilyByCode).toHaveBeenCalledWith({
        codigo: "ABCD1234",
      }),
    );
    expect(mockSession.applyInvitationJoined).toHaveBeenCalled();
    expect(mockSession.clearPendingInviteCode).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });

  it("shows an inline translated error for an expired invitation code", async () => {
    mockSession.getPendingInviteCode.mockReturnValue("ABCD1234");
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.joinFamilyByCode.mockRejectedValue(
      new ApiError(400, "errors.details.invitationCodeExpired"),
    );

    render(<InvitePage />);
    fireEvent.click(screen.getByText("Unirme a la familia"));

    await waitFor(() =>
      expect(screen.getByLabelText("Código de invitación")).toHaveAttribute("aria-invalid", "true"),
    );
    expect(screen.getByText("Este código de invitación ha caducado.")).toBeInTheDocument();
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
      codigo: "ABCD1234",
      rol_familiar: "madre",
      usado: false,
      expira_en: "2026-11-02T00:00:00Z",
    });
    mockApi.promoteMember.mockResolvedValue({ success: true });
    mockApi.removeMember.mockResolvedValue({ success: true });

    render(<FamilyMembersPage />);

    await screen.findByText("Familia Pérez");
    const roleSelect = screen.getByLabelText("Rol de la persona que invitas");
    expect(roleSelect).toHaveValue("hijo");
    fireEvent.change(roleSelect, { target: { value: "madre" } });
    expect(screen.getAllByRole("button", { name: "Generar invitación" })).toHaveLength(1);

    fireEvent.click(screen.getByText("Generar invitación"));
    await waitFor(() =>
      expect(mockApi.createInvitation).toHaveBeenCalledWith({
        rolFamiliar: "madre",
        parentesco: undefined,
      }),
    );
    expect(screen.getByText("ABCD-1234")).toBeInTheDocument();
    expect(await screen.findByText("Invitación para: Madre")).toBeInTheDocument();
    expect(screen.queryByText(/invite\?token=/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Promover"));
    await waitFor(() => expect(mockApi.promoteMember).toHaveBeenCalledWith("user-2"));
    expect(await screen.findByText("Miembro promovido a administrador.")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Expulsar"));
    expect(screen.getByText("¿Dar de baja a Luis del grupo?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(mockApi.removeMember).toHaveBeenCalledWith("user-2"));
  });

  it("hides an invitation code once it has been accepted", async () => {
    useSession(buildSession({ user: { ...buildSession().user, role: "admin" } }));
    useLastInvitation.setState({
      familyId: "family-1",
      invitation: {
        invitation_id: "invitation-1",
        codigo: "ABCD1234",
        rol_familiar: "hijo",
        usado: false,
        expira_en: "2026-12-03T00:00:00Z",
      },
      hydrated: true,
    });
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
      ],
      member_count: 1,
    });
    mockApi.getInvitation.mockResolvedValue({
      invitation_id: "invitation-1",
      codigo: "ABCD1234",
      rol_familiar: "hijo",
      usado: true,
      expira_en: "2026-12-03T00:00:00Z",
    });

    render(<FamilyMembersPage />);

    await waitFor(() => expect(mockApi.getInvitation).toHaveBeenCalledWith("invitation-1"));
    expect(
      await screen.findByText("No hay una invitación activa. Genera un código para invitar."),
    ).toBeInTheDocument();
    expect(screen.queryByText("ABCD-1234")).not.toBeInTheDocument();
  });

  it("keeps the invitation visible when the status check fails", async () => {
    useSession(buildSession({ user: { ...buildSession().user, role: "admin" } }));
    useLastInvitation.setState({
      familyId: "family-1",
      invitation: {
        invitation_id: "invitation-1",
        codigo: "ABCD1234",
        rol_familiar: "hijo",
        usado: false,
        expira_en: "2026-12-03T00:00:00Z",
      },
      hydrated: true,
    });
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
      ],
      member_count: 1,
    });
    mockApi.getInvitation.mockRejectedValue(new ApiError(500, "errors.details.serverError"));

    render(<FamilyMembersPage />);

    await waitFor(() => expect(mockApi.getInvitation).toHaveBeenCalledWith("invitation-1"));
    expect(screen.getByText("ABCD-1234")).toBeInTheDocument();
  });

  it("shows the kinship field only for the Other role and requires it", async () => {
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
      ],
      member_count: 1,
    });
    mockApi.createInvitation.mockResolvedValue({
      invitation_id: "invitation-1",
      codigo: "ABCD1234",
      rol_familiar: "otro",
      parentesco: "Cuñada",
      usado: false,
      expira_en: "2026-11-02T00:00:00Z",
    });

    render(<FamilyMembersPage />);
    await screen.findByText("Familia Pérez");

    const roleSelect = screen.getByLabelText("Rol de la persona que invitas");
    expect(screen.getByRole("option", { name: "Tío" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Abuelo" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Vínculo familiar")).not.toBeInTheDocument();

    fireEvent.change(roleSelect, { target: { value: "otro" } });
    const kinshipField = screen.getByLabelText("Vínculo familiar");

    fireEvent.click(screen.getByText("Generar invitación"));
    await waitFor(() => expect(mockApi.createInvitation).not.toHaveBeenCalled());
    expect(
      screen.getByText("Indica el vínculo familiar para continuar."),
    ).toBeInTheDocument();

    fireEvent.change(kinshipField, { target: { value: "Cuñada" } });
    fireEvent.click(screen.getByText("Generar invitación"));
    await waitFor(() =>
      expect(mockApi.createInvitation).toHaveBeenCalledWith({
        rolFamiliar: "otro",
        parentesco: "Cuñada",
      }),
    );

    fireEvent.change(roleSelect, { target: { value: "hijo" } });
    expect(screen.queryByLabelText("Vínculo familiar")).not.toBeInTheDocument();
  });

  it("explains why a member cannot invite", async () => {
    useSession(buildSession({ user: { ...buildSession().user, role: "member" } }));
    mockApi.getFamily.mockResolvedValue({
      family,
      members: [
        {
          user_id: "user-1",
          nombre_visualizacion: "Ana",
          foto_avatar: null,
          role: "member",
          parentesco: null,
          estado: "activo",
        },
      ],
      member_count: 1,
    });

    render(<FamilyMembersPage />);
    await screen.findByText("Familia Pérez");

    expect(
      screen.getByText(
        "Solo quien administra puede invitar. Pídeselo a un administrador de tu familia.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Generar invitación")).not.toBeInTheDocument();
  });

  it("has no detectable accessibility violations on family selection", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockSession.getPendingInviteCode.mockReturnValue("ABCD1234");

    const { container } = render(<FamilySelectPage />);

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("has no detectable accessibility violations on the invitation screen", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockSession.getPendingInviteCode.mockReturnValue("ABCD1234");

    const { container } = render(<InvitePage />);

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("has no detectable accessibility violations on members for an admin", async () => {
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
      ],
      member_count: 1,
    });

    const { container } = render(<FamilyMembersPage />);
    await screen.findByText("Familia Pérez");

    fireEvent.change(screen.getByLabelText("Rol de la persona que invitas"), {
      target: { value: "otro" },
    });
    expect(screen.getByLabelText("Vínculo familiar")).toBeInTheDocument();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("shows legacy members without family role as members", async () => {
    useSession(buildSession({ user: { ...buildSession().user, role: "admin" } }));
    mockApi.getFamily.mockResolvedValue({
      family,
      members: [
        {
          user_id: "user-1",
          nombre_visualizacion: "Ana",
          foto_avatar: null,
          role: "admin",
          rol_familiar: "padre",
          parentesco: null,
          estado: "activo",
        },
        {
          user_id: "user-2",
          nombre_visualizacion: "Luis",
          foto_avatar: null,
          role: "member",
          parentesco: "hija",
          estado: "activo",
        },
      ],
      member_count: 2,
    });

    render(<FamilyMembersPage />);
    await screen.findByText("Familia Pérez");

    expect(screen.getByText("Miembro")).toBeInTheDocument();
    expect(screen.queryByText("hija")).not.toBeInTheDocument();
  });

  it("deletes the family when it has one member", async () => {
    useSession(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "admin" },
      }),
    );
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
      ],
      member_count: 1,
    });
    mockApi.deleteFamily.mockResolvedValue({
      success: true,
      family_id: null,
      tokens: { access_token: "left-access", refresh_token: "left-refresh", token_type: "bearer" },
    });

    render(<FamilyMembersPage />);
    await screen.findByText("Familia Pérez");

    fireEvent.click(screen.getAllByRole("button", { name: "Eliminar familia" })[0]);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Eliminar familia" })).toHaveLength(2),
    );
    const confirmButtons = screen.getAllByRole("button", { name: "Eliminar familia" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockApi.deleteFamily).toHaveBeenCalledTimes(1));
    expect(mockSession.applyFamilyLeft).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        tokens: expect.objectContaining({ access_token: "left-access" }),
      }),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith("/family/select");
  });

  it("leaves the family when it has more than one member", async () => {
    useSession(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "admin" },
      }),
    );
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
    mockApi.leaveFamily.mockResolvedValue({
      success: true,
      family_id: null,
      tokens: { access_token: "left-access", refresh_token: "left-refresh", token_type: "bearer" },
    });

    render(<FamilyMembersPage />);
    await screen.findByText("Familia Pérez");

    fireEvent.click(screen.getAllByRole("button", { name: "Abandonar familia" })[0]);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Abandonar familia" })).toHaveLength(2),
    );
    const confirmButtons = screen.getAllByRole("button", { name: "Abandonar familia" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockApi.leaveFamily).toHaveBeenCalledTimes(1));
    expect(mockSession.applyFamilyLeft).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        tokens: expect.objectContaining({ access_token: "left-access" }),
      }),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith("/family/select");
  });

  it("reconciles the session when the active membership is gone", async () => {
    useSession(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "member" },
      }),
    );
    mockApi.getFamily.mockRejectedValue(
      new ApiError("Aún no perteneces a ningún grupo familiar.", 403),
    );
    mockRefreshSession.mockResolvedValue(
      buildSession({
        user: { ...buildSession().user, family_id: null, role: null },
        needs_family_setup: true,
      }),
    );

    render(<FamilyMembersPage />);

    await waitFor(() => expect(mockRefreshSession).toHaveBeenCalled());
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/family/select"));
  });
});

describe("web home", () => {
  const detail = {
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
    ],
    member_count: 1,
  };

  it("shows the family summary and the setup checklist instead of redirecting", async () => {
    useSession(buildSession());
    mockApi.getFamily.mockResolvedValue(detail);

    render(<HomePage />);

    expect(await screen.findByText("Familia Pérez")).toBeInTheDocument();
    expect(screen.getByText("Hola, Ana.")).toBeInTheDocument();
    expect(screen.getByText("2 de 3 pasos completados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invitar a alguien" })).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("retries loading when the family request fails", async () => {
    useSession(buildSession());
    mockApi.getFamily
      .mockRejectedValueOnce(new ApiError("boom", 500))
      .mockResolvedValueOnce(detail);

    render(<HomePage />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Familia Pérez")).toBeInTheDocument();
    expect(mockApi.getFamily).toHaveBeenCalledTimes(2);
  });
});

describe("web account settings", () => {
  it("deletes the account from settings after confirmation", async () => {
    useSession(buildSession());
    mockApi.deleteAccount.mockResolvedValue(undefined);

    render(<SettingsPage />);

    expect(screen.queryByText("Cerrar sesión")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar cuenta" }));
    expect(
      screen.getByText(
        "¿Quieres eliminar tu cuenta? Perderás el acceso de inmediato y no podrás deshacerlo.",
      ),
    ).toBeInTheDocument();
    expect(mockSession.clearSession).not.toHaveBeenCalled();

    const buttons = screen.getAllByRole("button", { name: "Eliminar cuenta" });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(mockApi.deleteAccount).toHaveBeenCalledTimes(1));
    expect(mockSession.clearSession).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login");
  });

  it("keeps the session and shows an error when deleting fails", async () => {
    useSession(buildSession());
    mockApi.deleteAccount.mockRejectedValue(new ApiError("boom", 500));

    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar cuenta" }));
    const buttons = screen.getAllByRole("button", { name: "Eliminar cuenta" });
    fireEvent.click(buttons[buttons.length - 1]);

    expect(await screen.findByText("No pudimos eliminar tu cuenta. Inténtalo de nuevo.")).toBeInTheDocument();
    expect(mockSession.clearSession).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("offers logout from the profile with confirmation", async () => {
    useSession(buildSession());

    render(<ProfilePage />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(screen.getByText("¿Quieres cerrar sesión en este dispositivo?")).toBeInTheDocument();
    expect(mockSession.clearSession).not.toHaveBeenCalled();

    const buttons = screen.getAllByRole("button", { name: "Cerrar sesión" });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(mockSession.clearSession).toHaveBeenCalledTimes(1));
    expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login");
  });
});
