import * as SecureStore from "expo-secure-store";

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

  it("clears the session", async () => {
    await applyTokenResponse(tokenResponse);
    await clearSession();
    expect(await getSession()).toBeNull();
  });
});
