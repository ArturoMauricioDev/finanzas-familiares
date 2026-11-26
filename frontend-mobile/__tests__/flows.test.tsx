import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { api, ApiError, refreshSession } from "../lib/api";
import * as auth from "../lib/auth";
import * as session from "../lib/session";
import { useFamilyDraft } from "../lib/store/familyDraft";
import { useLastInvitation } from "../lib/store/invitation";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";

import LoginScreen from "../app/(auth)/auth/login";
import ProfileSetupScreen from "../app/(onboarding)/profile/setup";
import FamilySelectScreen from "../app/(onboarding)/family/select";
import FamilyCreateScreen from "../app/(onboarding)/family/create";
import InviteScreen from "../app/(onboarding)/invite/index";
import FamilyMembersScreen from "../app/(app)/(tabs)/family/members";
import ProfileScreen from "../app/(app)/(tabs)/profile";
import SettingsScreen from "../app/(app)/settings";

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
  GOOGLE_REDIRECT_URI: "",
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
  getPendingInviteCode: jest.fn(async () => null),
  savePendingInviteCode: jest.fn(async () => {}),
  clearPendingInviteCode: jest.fn(async () => {}),
  applyFamilyLeft: jest.fn(),
  sessionNeedsRefresh: jest.fn(() => false),
}));

jest.mock("../lib/api", () => {
  const actual = jest.requireActual("../lib/api");
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

beforeEach(async () => {
  jest.clearAllMocks();
  useLastInvitation.setState({ familyId: null, invitation: null, hydrated: false });
  mockApi.getInvitation.mockResolvedValue({
    invitation_id: "invitation-default",
    codigo: "DEFAULT1",
    usado: false,
    expira_en: "2026-12-03T00:00:00Z",
  });
  delete mockParams.token;
  mockSession.getSession.mockResolvedValue(null);
  mockSession.getPendingInviteCode.mockResolvedValue(null);
  mockSession.getPendingInviteCode.mockResolvedValue(null);
  mockUseIdTokenAuthRequest.mockReturnValue([{}, null, jest.fn()]);
  await useFamilyDraft.persist.clearStorage();
  useFamilyDraft.setState({
    step: 1,
    nombre: "",
    moneda: "",
    rolFamiliar: "padre",
    hydrated: false,
  });
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

    await render(<LoginScreen />);

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
    mockSession.getPendingInviteCode.mockResolvedValue("invite-token");

    await render(<LoginScreen />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/invite"));
  });

  it("keeps the first-run order and never lands on Home before there is a family", async () => {
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

    await render(<LoginScreen />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/profile/setup"));
    expect(mockRouter.replace).not.toHaveBeenCalledWith("/");
    expect(mockRouter.replace).not.toHaveBeenCalledWith("/family/select");
  });

  it("preserves the pending invitation code through login and skips family selection", async () => {
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
    mockSession.getPendingInviteCode.mockResolvedValue("invite-code");

    await render(<LoginScreen />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/invite"));
    expect(mockSession.getPendingInviteCode).toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalledWith("/family/select");
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

    await render(<ProfileSetupScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText("Ej. Ana Pérez"), "Ana");
    await fireEvent.press(screen.getByText("Guardar y continuar"));

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
    mockSession.getPendingInviteCode.mockResolvedValue("invite-token");
    mockApi.updateProfile.mockResolvedValue({
      id: "user-1",
      nombre_visualizacion: "Ana",
      foto_avatar: "https://example.com/ana.png",
      family_id: null,
      role: null,
    });

    await render(<ProfileSetupScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText("Ej. Ana Pérez"), "Ana");
    await fireEvent.press(screen.getByText("Guardar y continuar"));

    await waitFor(() => expect(mockApi.updateProfile).toHaveBeenCalled());
    expect(mockRouter.replace).toHaveBeenCalledWith("/invite");
  });

  it("offers create as the primary action when there is no pending code", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockSession.getPendingInviteCode.mockResolvedValue(null);

    await render(<FamilySelectScreen />);
    await waitFor(() => expect(screen.getByText("Crear familia")).toBeTruthy());
    await fireEvent.press(screen.getByText("Crear familia"));
    await fireEvent.press(screen.getByRole("button", { name: "Tengo un código" }));

    expect(mockRouter.push).toHaveBeenCalledWith("/family/create");
    expect(mockRouter.push).toHaveBeenCalledWith("/invite");
  });

  it("offers join as the primary action when an invitation code is pending", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockSession.getPendingInviteCode.mockResolvedValue("ABCD1234");

    await render(<FamilySelectScreen />);
    await waitFor(() => expect(screen.getByText("Ya tenemos tu código")).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Unirme con mi código" }));

    expect(mockRouter.push).toHaveBeenCalledWith("/invite");
  });

  it("creates a family stepping through the wizard and stores the refreshed tokens", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.createFamily.mockResolvedValue({
      family,
      membership: { role: "admin", estado: "activo" },
      tokens: { access_token: "new-access", refresh_token: "new-refresh", token_type: "bearer" },
    });

    await render(<FamilyCreateScreen />);

    const name = await screen.findByPlaceholderText("Ej. Familia Pérez");
    await fireEvent.changeText(name, "Familia Pérez");
    await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => expect(screen.getByText("Moneda local (ISO 4217)")).toBeTruthy());
    await waitFor(() => expect(useFamilyDraft.getState().moneda).not.toBe(""));
    await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => expect(screen.getByText("Revisa antes de crear")).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Crear familia" }));

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

  it("keeps the wizard values when going back", async () => {
    useSession(buildSession({ needs_family_setup: true }));

    await render(<FamilyCreateScreen />);

    const name = await screen.findByPlaceholderText("Ej. Familia Pérez");
    await fireEvent.changeText(name, "Familia Pérez");
    await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(screen.getByText("Moneda local (ISO 4217)")).toBeTruthy());
    await waitFor(() => expect(useFamilyDraft.getState().moneda).not.toBe(""));
    await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(screen.getByText("Revisa antes de crear")).toBeTruthy());

    await fireEvent.press(screen.getByRole("button", { name: "Atrás" }));
    await waitFor(() => expect(screen.getByText("Moneda local (ISO 4217)")).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Atrás" }));
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Ej. Familia Pérez").props.value).toBe("Familia Pérez"),
    );
  });

  it("joins a family with an invitation code", async () => {
    mockSession.getPendingInviteCode.mockResolvedValue("ABCD1234");
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.joinFamilyByCode.mockResolvedValue({
      family_id: "family-1",
      role: "member",
      estado: "activo",
      tokens: { access_token: "join-access", refresh_token: "join-refresh", token_type: "bearer" },
    });

    await render(<InviteScreen />);
    expect(screen.getByPlaceholderText("Ej. ABCD-1234").props.value).toBe("ABCD1234");
    await fireEvent.changeText(screen.getByPlaceholderText("Ej. ABCD-1234"), "abcd-1234");
    expect(mockSession.savePendingInviteCode).toHaveBeenCalledWith("ABCD1234");
    await fireEvent.press(screen.getByText("Unirme a la familia"));

    await waitFor(() =>
      expect(mockApi.joinFamilyByCode).toHaveBeenCalledWith({
        codigo: "ABCD1234",
      }),
    );
    expect(mockSession.applyInvitationJoined).toHaveBeenCalled();
    expect(mockSession.clearPendingInviteCode).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });

  it("prefills a saved invitation code", async () => {
    useSession(buildSession({ needs_family_setup: true }));
    mockSession.getPendingInviteCode.mockResolvedValue("SAVED123");

    await render(<InviteScreen />);

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Ej. ABCD-1234").props.value).toBe("SAVED123"),
    );
  });

  it("shows an inline translated error for an expired invitation code", async () => {
    mockSession.getPendingInviteCode.mockResolvedValue("ABCD1234");
    useSession(buildSession({ needs_family_setup: true }));
    mockApi.joinFamilyByCode.mockRejectedValue(
      new ApiError(400, "errors.details.invitationCodeExpired"),
    );

    await render(<InviteScreen />);
    await fireEvent.press(screen.getByText("Unirme a la familia"));

    await waitFor(() =>
      expect(screen.getByText("Este código de invitación ha caducado.")).toBeTruthy(),
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
      codigo: "ABCD1234",
      rol_familiar: "madre",
      usado: false,
      expira_en: "2026-11-02T00:00:00Z",
    });
    mockApi.promoteMember.mockResolvedValue({ success: true });
    mockApi.removeMember.mockResolvedValue({ success: true });
    await render(<FamilyMembersScreen />);

    await screen.findByText("Familia Pérez");
    await fireEvent.press(screen.getByRole("button", { name: "Rol de la persona que invitas: Hijo" }));
    const hijoSelf = screen.getByRole("button", { name: "Hijo" });
    expect(hijoSelf.props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(screen.getByRole("button", { name: "Madre" }));
    await fireEvent.press(screen.getByText("Generar invitación"));
    await waitFor(() =>
      expect(mockApi.createInvitation).toHaveBeenCalledWith({
        rolFamiliar: "madre",
        parentesco: undefined,
      }),
    );
    expect(screen.getByText("ABCD-1234")).toBeTruthy();
    expect(await screen.findByText("Invitación para: Madre")).toBeTruthy();
    expect(
      screen.getByText("Invitación generada. Comparte el código con tu familia.").props
        .accessibilityLiveRegion,
    ).toBe("polite");
    expect(screen.queryByText(/invite\?token=/)).toBeNull();

    await fireEvent.press(screen.getByText("Promover"));
    await waitFor(() => expect(mockApi.promoteMember).toHaveBeenCalledWith("user-2"));
    expect(await screen.findByText("Miembro promovido a administrador.")).toBeTruthy();

    await fireEvent.press(screen.getByText("Expulsar"));
    expect(screen.getByText("¿Dar de baja a Luis del grupo?")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Dar de baja" }));
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

    await render(<FamilyMembersScreen />);

    await waitFor(() => expect(mockApi.getInvitation).toHaveBeenCalledWith("invitation-1"));
    expect(
      await screen.findByText("No hay una invitación activa. Genera un código para invitar."),
    ).toBeTruthy();
    expect(screen.queryByText("ABCD-1234")).toBeNull();
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

    await render(<FamilyMembersScreen />);

    await waitFor(() => expect(mockApi.getInvitation).toHaveBeenCalledWith("invitation-1"));
    expect(screen.getByText("ABCD-1234")).toBeTruthy();
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

    await render(<FamilyMembersScreen />);
    await screen.findByText("Familia Pérez");

    expect(screen.queryByLabelText("Vínculo familiar")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Rol de la persona que invitas: Hijo" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Otro" }));

    const kinshipField = screen.getByLabelText("Vínculo familiar");
    await fireEvent.press(screen.getByText("Generar invitación"));
    await waitFor(() => expect(mockApi.createInvitation).not.toHaveBeenCalled());
    expect(screen.getByText("Indica el vínculo familiar para continuar.")).toBeTruthy();

    await fireEvent.changeText(kinshipField, "Cuñada");
    await fireEvent.press(screen.getByText("Generar invitación"));
    await waitFor(() =>
      expect(mockApi.createInvitation).toHaveBeenCalledWith({
        rolFamiliar: "otro",
        parentesco: "Cuñada",
      }),
    );
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

    await render(<FamilyMembersScreen />);
    await screen.findByText("Familia Pérez");

    expect(
      screen.getByText(
        "Solo quien administra puede invitar. Pídeselo a un administrador de tu familia.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Generar invitación")).toBeNull();
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

    await render(<FamilyMembersScreen />);
    await screen.findByText("Familia Pérez");

    expect(await screen.findByText("Miembro")).toBeTruthy();
    expect(screen.queryByText("hija")).toBeNull();
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

    await render(<FamilyMembersScreen />);
    await screen.findByText("Familia Pérez");

    await fireEvent.press(screen.getByRole("button", { name: "Eliminar familia" }));
    const buttons = screen.getAllByRole("button", { name: "Eliminar familia" });
    await fireEvent.press(buttons[buttons.length - 1]);

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

    await render(<FamilyMembersScreen />);
    await screen.findByText("Familia Pérez");

    await fireEvent.press(screen.getByRole("button", { name: "Abandonar familia" }));
    const buttons = screen.getAllByRole("button", { name: "Abandonar familia" });
    await fireEvent.press(buttons[buttons.length - 1]);

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

    await render(<FamilyMembersScreen />);

    await waitFor(() => expect(mockRefreshSession).toHaveBeenCalled());
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/family/select"));
  });

  it("offers logout from the profile with confirmation", async () => {
    useSession(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "admin" },
      }),
    );

    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByText("Cerrar sesión"));
    expect(screen.getByText("¿Quieres cerrar sesión en este dispositivo?")).toBeTruthy();
    expect(mockSession.clearSession).not.toHaveBeenCalled();

    const confirmButtons = screen.getAllByRole("button", { name: "Cerrar sesión" });
    await fireEvent.press(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockSession.clearSession).toHaveBeenCalledTimes(1));
    expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login");
  });
});

describe("mobile account settings", () => {
  it("deletes the account from settings after confirmation", async () => {
    useSession(buildSession({ user: { ...buildSession().user, family_id: "family-1", role: "admin" } }));
    mockApi.deleteAccount.mockResolvedValue(undefined);

    await render(<SettingsScreen />);

    expect(screen.queryByText("Cerrar sesión")).toBeNull();

    await fireEvent.press(screen.getByText("Eliminar cuenta"));
    expect(
      screen.getByText(
        "¿Quieres eliminar tu cuenta? Perderás el acceso de inmediato y no podrás deshacerlo.",
      ),
    ).toBeTruthy();
    expect(mockSession.clearSession).not.toHaveBeenCalled();

    const confirmButtons = screen.getAllByRole("button", { name: "Eliminar cuenta" });
    await fireEvent.press(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockApi.deleteAccount).toHaveBeenCalledTimes(1));
    expect(mockSession.clearSession).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login");
  });

  it("keeps the session and shows an error when deleting fails", async () => {
    useSession(buildSession({ user: { ...buildSession().user, family_id: "family-1", role: "admin" } }));
    mockApi.deleteAccount.mockRejectedValue(new ApiError("boom", 500));

    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByText("Eliminar cuenta"));
    const confirmButtons = screen.getAllByRole("button", { name: "Eliminar cuenta" });
    await fireEvent.press(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(screen.getByText("No pudimos eliminar tu cuenta. Inténtalo de nuevo.")).toBeTruthy(),
    );
    expect(mockSession.clearSession).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
