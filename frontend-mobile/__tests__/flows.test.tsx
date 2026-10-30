import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { api } from "../lib/api";
import * as auth from "../lib/auth";
import * as session from "../lib/session";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";

import LoginScreen from "../app/auth/login";
import ProfileSetupScreen from "../app/profile/setup";
import FamilySelectScreen from "../app/family/select";
import FamilyCreateScreen from "../app/family/create";
import InviteScreen from "../app/invite/index";
import FamilyMembersScreen from "../app/family/members";

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
}));

jest.mock("../lib/api", () => {
  const actual = jest.requireActual("../lib/api");
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

jest.mock("../hooks/useAuthGuard", () => ({
  useAuthGuard: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockAuth = auth as jest.Mocked<typeof auth>;
const mockSession = session as jest.Mocked<typeof session>;
const mockUseAuthGuard = useAuthGuard as jest.Mock;
const mockUseIdTokenAuthRequest = useIdTokenAuthRequest as jest.Mock;

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
    fireEvent.changeText(
      screen.getByPlaceholderText("https://..."),
      "https://example.com/ana.png",
    );
    fireEvent.press(screen.getByText("Guardar y continuar"));

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
    fireEvent.changeText(screen.getByPlaceholderText("Ej. hija, hijo, madre"), "hija");
    fireEvent.press(screen.getByText("Unirme al grupo"));

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
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.style === "destructive")?.onPress?.();
    });

    render(<FamilyMembersScreen />);

    await screen.findByText("Familia Pérez");
    fireEvent.press(screen.getByText("Generar invitación"));
    await waitFor(() => expect(mockApi.createInvitation).toHaveBeenCalled());
    expect(screen.getByText("http://localhost:3000/invite?token=invite-token")).toBeTruthy();

    fireEvent.press(screen.getByText("Promover"));
    await waitFor(() => expect(mockApi.promoteMember).toHaveBeenCalledWith("user-2"));

    fireEvent.press(screen.getByText("Expulsar"));
    await waitFor(() => expect(mockApi.removeMember).toHaveBeenCalledWith("user-2"));
    expect(Alert.alert).toHaveBeenCalled();
  });
});
