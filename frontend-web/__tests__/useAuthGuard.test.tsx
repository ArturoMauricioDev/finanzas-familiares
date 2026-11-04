import { render, screen, waitFor } from "@testing-library/react";

import { refreshSession, setUnauthorizedHandler } from "@/lib/api";
import * as session from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const mockRouter = { push: jest.fn(), replace: jest.fn() };
let mockPathname = "/family/members";

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/api", () => ({
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
  return <div data-testid="state">{ready ? current?.user.id : "loading"}</div>;
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockPathname = "/family/members";
  mockRefreshSession.mockResolvedValue(null);
});

describe("useAuthGuard", () => {
  it("redirects to login when there is no session", async () => {
    render(<Probe />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login"));
  });

  it("redirects incomplete profiles to profile setup", async () => {
    session.saveSession(buildSession({ needs_profile_setup: true, needs_family_setup: true }));

    render(<Probe />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/profile/setup"));
  });

  it("redirects users without a family to the pending invite", async () => {
    session.saveSession(buildSession({ needs_family_setup: true }));
    session.savePendingInviteToken("pending-token");

    render(<Probe />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/invite"));
  });

  it("redirects users without a family to group selection when no invite is pending", async () => {
    session.saveSession(buildSession({ needs_family_setup: true }));

    render(<Probe />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/family/select"));
  });

  it("honors the requireFamily option", async () => {
    session.saveSession(buildSession({ needs_family_setup: true }));

    render(<Probe requireFamily />);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/family/select"));
  });

  it("refreshes a session with missing onboarding flags on load", async () => {
    const stale = buildSession();
    delete (stale as Partial<session.SessionState>).needs_profile_setup;
    delete (stale as Partial<session.SessionState>).needs_family_setup;
    session.saveSession(stale);
    mockRefreshSession.mockResolvedValue(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "admin" },
        needs_profile_setup: false,
        needs_family_setup: false,
      }),
    );

    render(<Probe />);

    await waitFor(() => expect(mockRefreshSession).toHaveBeenCalled());
    expect(await screen.findByText("user-1")).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("reconciles a stale family flag when the user already has a family", async () => {
    session.saveSession(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "admin" },
        needs_family_setup: true,
      }),
    );

    render(<Probe />);

    expect(await screen.findByText("user-1")).toBeInTheDocument();
    expect(session.getSession()?.needs_family_setup).toBe(false);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("clears stale pending invites for users who already have a family", async () => {
    session.saveSession(
      buildSession({
        user: { ...buildSession().user, family_id: "family-1", role: "member" },
        needs_family_setup: false,
      }),
    );
    session.savePendingInviteToken("stale-token");

    render(<Probe />);

    await waitFor(() => expect(session.getPendingInviteToken()).toBeNull());
  });

  it("registers a handler that sends terminal 401 responses to login", () => {
    session.saveSession(buildSession());

    render(<Probe />);

    const handler = mockSetUnauthorizedHandler.mock.calls[0][0] as () => void;
    handler();
    expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login");
  });
});
