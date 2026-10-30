import {
  applyFamilyCreated,
  applyInvitationJoined,
  applyTokenResponse,
  clearSession,
  getSession,
  updateSession,
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

  it("clears the session", () => {
    applyTokenResponse(tokenResponse);
    clearSession();
    expect(getSession()).toBeNull();
  });
});
