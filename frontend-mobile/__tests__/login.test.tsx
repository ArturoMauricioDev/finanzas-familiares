import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";

import LoginScreen from "../app/(auth)/auth/login";
import * as auth from "../lib/auth";
import { ApiError } from "../lib/errors";
import * as googleSignIn from "../lib/google-signin";
import * as session from "../lib/session";

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/test",
  useLocalSearchParams: () => ({}),
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

jest.mock("../lib/google-signin", () => ({
  requestGoogleIdToken: jest.fn(),
}));

jest.mock("../lib/session", () => ({
  getSession: jest.fn(),
  applyTokenResponse: jest.fn(),
  getPendingInviteCode: jest.fn(),
}));

const mockAuth = auth as jest.Mocked<typeof auth>;
const mockGoogleSignIn = googleSignIn as jest.Mocked<typeof googleSignIn>;
const mockSession = session as jest.Mocked<typeof session>;
const mockUseIdTokenAuthRequest = useIdTokenAuthRequest as jest.Mock;

function buildSession(overrides: Partial<session.SessionState> = {}): session.SessionState {
  return {
    access_token: "access",
    refresh_token: "refresh",
    user: {
      id: "user-1",
      email: "ana@example.com",
      nombre_visualizacion: "Ana",
      foto_avatar: null,
      family_id: null,
      role: null,
    },
    needs_profile_setup: false,
    needs_family_setup: false,
    ...overrides,
  };
}

function pressGoogleButton() {
  fireEvent.press(screen.getByRole("button", { name: "Continuar con Google" }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseIdTokenAuthRequest.mockReturnValue([{}, null, jest.fn()]);
  mockSession.getSession.mockResolvedValue(null);
  mockSession.getPendingInviteCode.mockResolvedValue(null);
  mockGoogleSignIn.requestGoogleIdToken.mockResolvedValue({ status: "cancelled" });
});

describe("native Google sign-in login", () => {
  it("explains the promise and what comes later before asking for an account", async () => {
    await render(<LoginScreen />);

    expect(screen.getByText(/El lugar de tu familia para organizarse/)).toBeTruthy();
    expect(screen.getAllByText(/en camino/).length).toBeGreaterThan(0);
    expect(screen.getByText(/No publicamos nada en tu nombre/)).toBeTruthy();
  });

  it.each([
    {
      name: "profile setup",
      overrides: { needs_profile_setup: true, needs_family_setup: true },
      pendingInvite: null,
      expectedPath: "/profile/setup",
    },
    {
      name: "family selection",
      overrides: { needs_profile_setup: false, needs_family_setup: true },
      pendingInvite: null,
      expectedPath: "/family/select",
    },
    {
      name: "pending invite",
      overrides: { needs_profile_setup: false, needs_family_setup: true },
      pendingInvite: "invite-code",
      expectedPath: "/invite",
    },
    {
      name: "family hub",
      overrides: { needs_profile_setup: false, needs_family_setup: false },
      pendingInvite: null,
      expectedPath: "/",
    },
  ])(
    "navigates to $expectedPath after native success for $name",
    async ({ overrides, pendingInvite, expectedPath }) => {
      mockGoogleSignIn.requestGoogleIdToken.mockResolvedValue({
        status: "success",
        idToken: "native-token",
      });
      const nextSession = buildSession(overrides);
      mockAuth.signInWithGoogle.mockResolvedValue({
        access_token: "access",
        refresh_token: "refresh",
        token_type: "bearer",
        user: nextSession.user,
        needs_profile_setup: nextSession.needs_profile_setup,
        needs_family_setup: nextSession.needs_family_setup,
      });
      mockSession.applyTokenResponse.mockResolvedValue(nextSession);
      mockSession.getPendingInviteCode.mockResolvedValue(pendingInvite);

      await render(<LoginScreen />);
      pressGoogleButton();

      await waitFor(() =>
        expect(mockAuth.signInWithGoogle).toHaveBeenCalledWith("native-token"),
      );
      expect(mockRouter.replace).toHaveBeenCalledWith(expectedPath);
    },
  );

  it("stays silent when the user cancels the native sheet", async () => {
    mockGoogleSignIn.requestGoogleIdToken.mockResolvedValue({ status: "cancelled" });

    await render(<LoginScreen />);
    pressGoogleButton();

    await waitFor(() => expect(mockGoogleSignIn.requestGoogleIdToken).toHaveBeenCalled());
    expect(mockAuth.signInWithGoogle).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a translated error when Play Services are unavailable", async () => {
    mockGoogleSignIn.requestGoogleIdToken.mockResolvedValue({
      status: "error",
      code: "PLAY_SERVICES_NOT_AVAILABLE",
    });

    await render(<LoginScreen />);
    pressGoogleButton();

    await waitFor(() =>
      expect(
        screen.getByText(
          "Los servicios de Google Play no están disponibles o están desactualizados en este dispositivo.",
        ),
      ).toBeTruthy(),
    );
    expect(mockAuth.signInWithGoogle).not.toHaveBeenCalled();
  });

  it("shows a translated error when Google returns no id token", async () => {
    mockGoogleSignIn.requestGoogleIdToken.mockResolvedValue({
      status: "error",
      code: "MISSING_ID_TOKEN",
    });

    await render(<LoginScreen />);
    pressGoogleButton();

    await waitFor(() =>
      expect(
        screen.getByText("Google no devolvió un token válido. Inténtalo de nuevo."),
      ).toBeTruthy(),
    );
  });

  it("shows the backend error when token exchange fails", async () => {
    mockGoogleSignIn.requestGoogleIdToken.mockResolvedValue({
      status: "success",
      idToken: "native-token",
    });
    mockAuth.signInWithGoogle.mockRejectedValue(
      new ApiError(400, "errors.details.invalidGoogleToken", "Invalid Google token"),
    );

    await render(<LoginScreen />);
    pressGoogleButton();

    await waitFor(() =>
      expect(screen.getByText("El inicio de sesión con Google no es válido.")).toBeTruthy(),
    );
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
