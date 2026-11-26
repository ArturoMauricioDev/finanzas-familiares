import {
  applyFamilyCreated,
  applyFamilyLeft,
  applyInvitationJoined,
  applySessionInfo,
  applyTokenResponse,
  clearSession,
  getSession,
  getTokenExpiry,
  sessionNeedsRefresh,
  updateSession,
  type SessionState,
} from "../lib/session";

const tokenResponse = {
  access_token: "access",
  refresh_token: "refresh",
  token_type: "bearer",
  user: {
    id: "user-1",
    email: "ana@example.com",
    nombre_visualizacion: null,
    foto_avatar: null,
    family_id: null,
    role: null,
  },
  needs_profile_setup: true,
  needs_family_setup: true,
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("session state", () => {
  it("persists the onboarding flags from the auth response", () => {
    const session = applyTokenResponse(tokenResponse);

    expect(session.needs_profile_setup).toBe(true);
    expect(getSession()?.access_token).toBe("access");
  });

  it("clears the profile flag after profile completion", () => {
    applyTokenResponse(tokenResponse);
    updateSession({ needs_profile_setup: false });

    expect(getSession()?.needs_profile_setup).toBe(false);
  });

  it("updates family and role after creating a family", () => {
    applyTokenResponse(tokenResponse);
    const session = applyFamilyCreated({
      family: {
        id: "family-1",
        nombre: "Familia",
        moneda_local: "MXN",
        creado_por: "user-1",
        fecha_creacion: "2026-10-29T00:00:00Z",
      },
      membership: { role: "admin", estado: "activo" },
      tokens: { access_token: "new-access", refresh_token: "new-refresh", token_type: "bearer" },
    });

    expect(session?.user.family_id).toBe("family-1");
    expect(session?.user.role).toBe("admin");
    expect(session?.needs_family_setup).toBe(false);
  });

  it("updates family and role after joining an invitation", () => {
    applyTokenResponse(tokenResponse);
    const session = applyInvitationJoined({
      family_id: "family-2",
      role: "member",
      estado: "activo",
      tokens: { access_token: "join-access", refresh_token: "join-refresh", token_type: "bearer" },
    });

    expect(session?.user.family_id).toBe("family-2");
    expect(session?.user.role).toBe("member");
    expect(getSession()?.access_token).toBe("join-access");
  });

  it("clears family claims after leaving the family", () => {
    applyTokenResponse({
      ...tokenResponse,
      user: { ...tokenResponse.user, family_id: "family-1", role: "admin" },
      needs_family_setup: false,
    });

    const session = applyFamilyLeft({
      success: true,
      family_id: null,
      tokens: { access_token: "left-access", refresh_token: "left-refresh", token_type: "bearer" },
    });

    expect(session?.user.family_id).toBeNull();
    expect(session?.user.role).toBeNull();
    expect(session?.needs_family_setup).toBe(true);
    expect(session?.access_token).toBe("left-access");
    expect(getSession()?.refresh_token).toBe("left-refresh");
  });

  it("clears the session", () => {
    applyTokenResponse(tokenResponse);
    clearSession();
    expect(getSession()).toBeNull();
  });

  it("reconciles onboarding flags from a validated session without rotating tokens", () => {
    applyTokenResponse({
      ...tokenResponse,
      user: { ...tokenResponse.user, family_id: "family-1", role: "admin" },
      needs_family_setup: false,
    });

    const session = applySessionInfo({
      user: {
        id: "user-1",
        email: "ana@example.com",
        nombre_visualizacion: null,
        foto_avatar: null,
        family_id: null,
        role: null,
      },
      needs_profile_setup: true,
      needs_family_setup: true,
    });

    expect(session?.access_token).toBe("access");
    expect(session?.refresh_token).toBe("refresh");
    expect(session?.user.family_id).toBeNull();
    expect(session?.needs_family_setup).toBe(true);
    expect(getSession()?.needs_family_setup).toBe(true);
  });

  it("ignores session info when there is no stored session", () => {
    expect(
      applySessionInfo({
        user: tokenResponse.user,
        needs_profile_setup: true,
        needs_family_setup: true,
      }),
    ).toBeNull();
  });
});

function buildSession(accessToken: string): SessionState {
  return {
    access_token: accessToken,
    refresh_token: "refresh",
    user: tokenResponse.user,
    needs_profile_setup: false,
    needs_family_setup: true,
  };
}

function buildToken(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  return `header.${payload}.signature`;
}

describe("web session expiry", () => {
  it("reads the expiry from the access token", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    expect(getTokenExpiry(buildToken(exp))).toBe(exp * 1000);
  });

  it("requests a refresh when the access token has expired", () => {
    const session = buildSession(buildToken(Math.floor(Date.now() / 1000) - 60));
    expect(sessionNeedsRefresh(session)).toBe(true);
  });

  it("keeps a session whose access token is still valid", () => {
    const session = buildSession(buildToken(Math.floor(Date.now() / 1000) + 3600));
    expect(sessionNeedsRefresh(session)).toBe(false);
  });

  it("does not force a refresh for tokens without a readable expiry", () => {
    expect(sessionNeedsRefresh(buildSession("access"))).toBe(false);
  });
});
