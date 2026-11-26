import * as SecureStore from "expo-secure-store";

import {
  applyFamilyCreated,
  applyFamilyLeft,
  applyInvitationJoined,
  applyTokenResponse,
  capturePendingInviteFromUrl,
  clearSession,
  getPendingInviteCode,
  getSession,
  getTokenExpiry,
  parseInviteCodeFromUrl,
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
  (SecureStore as unknown as { __clear: () => void }).__clear();
});

describe("mobile session state", () => {
  it("persists onboarding flags", async () => {
    const session = await applyTokenResponse(tokenResponse);

    expect(session.needs_profile_setup).toBe(true);
    expect((await getSession())?.access_token).toBe("access");
  });

  it("clears the profile flag", async () => {
    await applyTokenResponse(tokenResponse);
    await updateSession({ needs_profile_setup: false });

    expect((await getSession())?.needs_profile_setup).toBe(false);
  });

  it("updates family after creation", async () => {
    await applyTokenResponse(tokenResponse);
    const session = await applyFamilyCreated({
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

  it("updates family after joining an invitation", async () => {
    await applyTokenResponse(tokenResponse);
    const session = await applyInvitationJoined({
      family_id: "family-2",
      role: "member",
      estado: "activo",
      tokens: { access_token: "join-access", refresh_token: "join-refresh", token_type: "bearer" },
    });

    expect(session?.user.family_id).toBe("family-2");
    expect(session?.user.role).toBe("member");
  });

  it("clears family claims after leaving the family", async () => {
    await applyTokenResponse({
      ...tokenResponse,
      user: { ...tokenResponse.user, family_id: "family-1", role: "admin" },
      needs_family_setup: false,
    });

    const session = await applyFamilyLeft({
      success: true,
      family_id: null,
      tokens: { access_token: "left-access", refresh_token: "left-refresh", token_type: "bearer" },
    });

    expect(session?.user.family_id).toBeNull();
    expect(session?.user.role).toBeNull();
    expect(session?.needs_family_setup).toBe(true);
    expect(session?.access_token).toBe("left-access");
    expect((await getSession())?.refresh_token).toBe("left-refresh");
  });

  it("clears the session", async () => {
    await applyTokenResponse(tokenResponse);
    await clearSession();
    expect(await getSession()).toBeNull();
  });
});

describe("mobile pending invite from link", () => {
  it("captures and normalizes the code from a deep link", async () => {
    const code = await capturePendingInviteFromUrl(
      "finanzasfamiliares://invite?codigo=ab-cd%2012",
    );

    expect(code).toBe("ABCD12");
    expect(await getPendingInviteCode()).toBe("ABCD12");
  });

  it("reads the code from http links and aliases", () => {
    expect(parseInviteCodeFromUrl("https://kitho.app/invite?code=xyz789")).toBe("XYZ789");
    expect(parseInviteCodeFromUrl("finanzasfamiliares://invite?token=q1w2e3#frag")).toBe(
      "Q1W2E3",
    );
    expect(parseInviteCodeFromUrl("finanzasfamiliares://invite")).toBeNull();
    expect(parseInviteCodeFromUrl(null)).toBeNull();
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

describe("mobile session expiry", () => {
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
