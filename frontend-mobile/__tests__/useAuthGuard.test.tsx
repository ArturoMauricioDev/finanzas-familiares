import { render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { refreshSession, setUnauthorizedHandler } from "../lib/api";
import * as session from "../lib/session";
import { useAuthGuard } from "../hooks/useAuthGuard";

const mockRouter = { push: jest.fn(), replace: jest.fn() };
let mockPathname = "/family/members";

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
  useLocalSearchParams: () => ({}),
}));

jest.mock("../lib/api", () => ({
  refreshSession: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
  clearUnauthorizedHandler: jest.fn(),
}));

const mockRefreshSession = refreshSession as jest.Mock;
const mockSetUnauthorizedHandler = setUnauthorizedHandler as jest.Mock;

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

function Probe({ requireFamily = false }: { requireFamily?: boolean }) {
  const { session: current, ready } = useAuthGuard(requireFamily);
  return <Text testID="state">{ready ? current?.user.id : "loading"}</Text>;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await session.clearSession();
  await session.clearPendingInviteToken();
  mockPathname = "/family/members";
  mockRefreshSession.mockResolvedValue(null);
});

describe("mobile useAuthGuard", () => {
  it("redirects to login when there is no session", async () => {
    render(<Probe />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login"));
  });

  it("redirects incomplete profiles to profile setup", async () => {
    await session.saveSession(
      buildSession({ needs_profile_setup: true, needs_family_setup: true }),
    );

    render(<Probe />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/profile/setup"));
  });

  it("redirects users without a family to the pending invite", async () => {
    await session.saveSession(buildSession({ needs_family_setup: true }));
    await session.savePendingInviteToken("pending-token");

    render(<Probe />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/invite"));
  });

  it("redirects users without a family to group selection when no invite is pending", async () => {
    await session.saveSession(buildSession({ needs_family_setup: true }));

    render(<Probe />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/family/select"));
  });

  it("honors the requireFamily option", async () => {
    await session.saveSession(buildSession({ needs_family_setup: true }));

    render(<Probe requireFamily />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/family/select"));
  });

  it("refreshes a session with missing onboarding flags on load", async () => {
    const stale = buildSession();
    delete (stale as Partial<session.SessionState>).needs_profile_setup;
    delete (stale as Partial<session.SessionState>).needs_family_setup;
    await session.saveSession(stale);
    mockRefreshSession.mockResolvedValue(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "admin" },
        needs_profile_setup: false,
        needs_family_setup: false,
      }),
    );

    render(<Probe />);

    await waitFor(() => expect(mockRefreshSession).toHaveBeenCalled());
    expect(await screen.findByText("user-1")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("reconciles a stale family flag when the user already has a family", async () => {
    await session.saveSession(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "admin" },
        needs_family_setup: true,
      }),
    );

    render(<Probe />);

    expect(await screen.findByText("user-1")).toBeTruthy();
    expect((await session.getSession())?.needs_family_setup).toBe(false);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("clears stale pending invites for users who already have a family", async () => {
    await session.saveSession(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "member" },
        needs_family_setup: false,
      }),
    );
    await session.savePendingInviteToken("stale-token");

    render(<Probe />);

    await waitFor(async () => {
      expect(await session.getPendingInviteToken()).toBeNull();
    });
  });

  it("registers a handler that sends terminal 401 responses to login", async () => {
    await session.saveSession(buildSession());

    render(<Probe />);

    await waitFor(() => expect(mockSetUnauthorizedHandler).toHaveBeenCalled());
    const handler = mockSetUnauthorizedHandler.mock.calls[0][0] as () => void;
    handler();
    expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login");
  });
});
