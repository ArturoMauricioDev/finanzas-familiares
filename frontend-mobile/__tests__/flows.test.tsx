import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { api, ApiError, refreshSession } from "../lib/api";
import * as auth from "../lib/auth";
import * as session from "../lib/session";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";

import LoginScreen from "../app/(auth)/auth/login";
import ProfileSetupScreen from "../app/(onboarding)/profile/setup";
import FamilySelectScreen from "../app/(onboarding)/family/select";
import FamilyCreateScreen from "../app/(onboarding)/family/create";
import InviteScreen from "../app/(onboarding)/invite/index";
import FamilyMembersScreen from "../app/(app)/(tabs)/family/members";

const mockRouter = { push: jest.fn(), replace: jest.fn() };
const mockParams: { token?: string } = {};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/test",
  useLocalSearchParams: () => mockParams,
}));

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: () => "finanzasfamiliares://auth/login",
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useIdTokenAuthRequest: jest.fn(),
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock("../lib/auth", () => ({
  GOOGLE_WEB_CLIENT_ID: "test-web-client",
  GOOGLE_ANDROID_CLIENT_ID: "test-android-client",
  GOOGLE_IOS_CLIENT_ID: "test-ios-client",
  signInWithGoogle: jest.fn(),
}));

jest.mock("../lib/session", () => ({
  getSession: jest.fn(),
  applyTokenResponse: jest.fn(),
  applyFamilyCreated: jest.fn(),
  applyInvitationJoined: jest.fn(),
  updateSession: jest.fn(),
  clearSession: jest.fn(),
  getPendingInviteToken: jest.fn(async () => null),
  savePendingInviteToken: jest.fn(async () => {}),
  clearPendingInviteToken: jest.fn(async () => {}),
}));

jest.mock("../lib/api", () => {
  const actual = jest.requireActual("../lib/api");
  return {
    ...actual,
    refreshSession: jest.fn(),
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

jest.mock("../hooks/useAuthGuard", () => ({
  useAuthGuard: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockAuth = auth as jest.Mocked<typeof auth>;
const mockSession = session as jest.Mocked<typeof session>;
const mockUseAuthGuard = useAuthGuard as jest.Mock;
const mockUseIdTokenAuthRequest = useIdTokenAuthRequest as jest.Mock;
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
  delete mockParams.token;
  mockSession.getSession.mockResolvedValue(null);
  mockSession.getPendingInviteToken.mockResolvedValue(null);
  mockUseIdTokenAuthRequest.mockReturnValue([{}, null, jest.fn()]);
});

describe("mobile onboarding flows", () => {
  it("signs in with Google and redirects to profile setup", async () => {
    const nextSession = buildSession({ needs_profile_setup: true, needs_family_setup: true });
    mockUseIdTokenAuthRequest.mockReturnValue([
      {},
      { type: "success", params: { id_token: "mobile-token" } },
      jest.fn(),
    ]);
    mockAuth.signInWithGoogle.mockResolvedValue({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "bearer",
      user: nextSession.user,
      needs_profile_setup: true,
      needs_family_setup: true,
    });
    mockSession.applyTokenResponse.mockResolvedValue(nextSession);

    render(<LoginScreen />);

    await waitFor(() => expect(mockAuth.signInWithGoogle).toHaveBeenCalledWith("mobile-token"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/profile/setup");
  });

  it("sends invited users to the invite flow after signing in", async () => {
    const nextSession = buildSession({ needs_family_setup: true });
    mockUseIdTokenAuthRequest.mockReturnValue([
      {},
      { type: "success", params: { id_token: "mobile-token" } },
      jest.fn(),
    ]);
    mockAuth.signInWithGoogle.mockResolvedValue({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "bearer",
      user: nextSession.user,
      needs_profile_setup: false,
      needs_family_setup: true,
    });
    mockSession.applyTokenResponse.mockResolvedValue(nextSession);
    mockSession.getPendingInviteToken.mockResolvedValue("invite-token");

    render(<LoginScreen />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/invite"));
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

    render(<ProfileSetupScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Ej. Ana Pérez"), "Ana");
    fireEvent.press(screen.getByText("Guardar y continuar"));

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
    mockSession.getPendingInviteToken.mockResolvedValue("invite-token");
    mockApi.updateProfile.mockResolvedValue({
      id: "user-1",
      nombre_visualizacion: "Ana",
      foto_avatar: "https://example.com/ana.png",
      family_id: null,
      role: null,
    });

    render(<ProfileSetupScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Ej. Ana Pérez"), "Ana");
    fireEvent.press(screen.getByText("Guardar y continuar"));

    await waitFor(() => expect(mockApi.updateProfile).toHaveBeenCalled());
    expect(mockRouter.replace).toHaveBeenCalledWith("/invite");
  });

  it("offers both group selection options", () => {
    useSession(buildSession({ needs_family_setup: true }));

    render(<FamilySelectScreen />);
    fireEvent.press(screen.getByText("Crear nuevo grupo familiar"));
    fireEvent.press(screen.getByRole("button", { name: "Unirme mediante enlace" }));

    expect(mockRouter.push).toHaveBeenCalledWith("/family/create");
    expect(mockRouter.push).toHaveBeenCalledWith("/invite");
  });

  it("creates a family and stores the refreshed tokens", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.createFamily.mockResolvedValue({
      family,
      membership: { role: "admin", estado: "activo" },
      tokens: { access_token: "new-access", refresh_token: "new-refresh", token_type: "bearer" },
    });

    render(<FamilyCreateScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Ej. Familia Pérez"), "Familia Pérez");
    fireEvent.changeText(screen.getByPlaceholderText("MXN"), "MXN");
    fireEvent.press(screen.getByText("Crear grupo"));

    await waitFor(() =>
      expect(mockApi.createFamily).toHaveBeenCalledWith({
        nombre: "Familia Pérez",
        moneda_local: "MXN",
      }),
    );
    expect(mockSession.applyFamilyCreated).toHaveBeenCalled();
    expect(mockSession.clearPendingInviteToken).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/family/members");
  });

  it("joins a family from an invitation token", async () => {
    mockParams.token = "invite-token";
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.joinInvitation.mockResolvedValue({
      family_id: "family-1",
      role: "member",
      estado: "activo",
      tokens: { access_token: "join-access", refresh_token: "join-refresh", token_type: "bearer" },
    });

    render(<InviteScreen />);
    expect(screen.getByPlaceholderText("Token del enlace").props.value).toBe("invite-token");
    expect(mockSession.savePendingInviteToken).toHaveBeenCalledWith("invite-token");
    fireEvent.changeText(screen.getByPlaceholderText("Ej. hija, hijo, madre"), "hija");
    fireEvent.press(screen.getByText("Unirme al grupo"));

    await waitFor(() =>
      expect(mockApi.joinInvitation).toHaveBeenCalledWith({
        token: "invite-token",
        parentesco: "hija",
      }),
    );
    expect(mockSession.applyInvitationJoined).toHaveBeenCalled();
    expect(mockSession.clearPendingInviteToken).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/family/members");
  });

  it("prefills a saved invitation token", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockSession.getPendingInviteToken.mockResolvedValue("saved-token");

    render(<InviteScreen />);

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Token del enlace").props.value).toBe("saved-token"),
    );
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
    mockApi.promoteMember.mockResolvedValue({ success: true });
    mockApi.removeMember.mockResolvedValue({ success: true });
    render(<FamilyMembersScreen />);

    await screen.findByText("Familia Pérez");
    fireEvent.press(screen.getByText("Generar invitación"));
    await waitFor(() => expect(mockApi.createInvitation).toHaveBeenCalled());
    expect(screen.getByText("http://localhost:3000/invite?token=invite-token")).toBeTruthy();

    fireEvent.press(screen.getByText("Promover"));
    await waitFor(() => expect(mockApi.promoteMember).toHaveBeenCalledWith("user-2"));

    fireEvent.press(screen.getByText("Expulsar"));
    fireEvent.press(screen.getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(mockApi.removeMember).toHaveBeenCalledWith("user-2"));
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

    render(<FamilyMembersScreen />);

    await waitFor(() => expect(mockRefreshSession).toHaveBeenCalled());
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/family/select"));
  });
});
