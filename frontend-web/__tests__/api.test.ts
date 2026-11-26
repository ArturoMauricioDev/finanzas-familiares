import { api, ApiError, getApiBaseUrl, validateSession } from "../lib/api";
import * as sessionModule from "../lib/session";

jest.mock("../lib/session", () => ({
  getAccessToken: jest.fn(() => "test-token"),
  getSession: jest.fn(() => null),
  applyTokenResponse: jest.fn(),
  applySessionInfo: jest.fn(),
  clearSession: jest.fn(),
}));

const fetchMock = jest.fn();
const mockSession = sessionModule as jest.Mocked<typeof sessionModule>;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  mockSession.getSession.mockReturnValue(null);
  mockSession.applyTokenResponse.mockReset();
  mockSession.applySessionInfo.mockReset();
  mockSession.clearSession.mockReset();
});

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

describe("api client", () => {
  it("requires a configured API URL", () => {
    const original = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    try {
      expect(() => getApiBaseUrl()).toThrow("errors.details.missingWebApiUrl");
    } finally {
      if (original === undefined) {
        delete process.env.NEXT_PUBLIC_API_URL;
      } else {
        process.env.NEXT_PUBLIC_API_URL = original;
      }
    }
  });

  it("translates transport failures to a readable ApiError", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));

    await expect(api.getFamily()).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      messageKey: "errors.status.0",
    });
  });

  it("exchanges a Google token without an Authorization header", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: "a",
        refresh_token: "r",
        token_type: "bearer",
        user: { id: "u", email: "a@example.com" },
        needs_profile_setup: true,
        needs_family_setup: true,
      }),
    );

    const result = await api.signInWithGoogle("google-token");

    expect(result.access_token).toBe("a");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/google"),
      expect.objectContaining({ method: "POST" }),
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  it("sends the access token on authenticated calls", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await api.removeMember("user-1");

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("maps validation errors to a readable ApiError", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: ["moneda_local: debe ser ISO 4217"] }, 422));

    await expect(
      api.createFamily({ nombre: "Familia", moneda_local: "MXNX" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      messageKey: "errors.status.422",
      fallbackDetail: "",
    });
  });

  it("keeps an unknown detail as fallback and a status key", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Something exploded" }, 500));

    await expect(api.getFamily()).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      messageKey: "errors.status.500",
      fallbackDetail: "Something exploded",
    });
  });

  it("throws ApiError on unauthorized responses", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Missing authentication token" }, 401));

    await expect(api.getFamily()).rejects.toBeInstanceOf(ApiError);
  });

  it("calls the family and invitation endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ family: {}, members: [], member_count: 0 }))
      .mockResolvedValueOnce(
        jsonResponse({
          invitation_id: "i",
          codigo: "ABCD",
          expira_en: "2026-11-02T00:00:00Z",
          usado: false,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          family_id: "f",
          role: "member",
          estado: "activo",
          tokens: { access_token: "a", refresh_token: "r", token_type: "bearer" },
        }),
      );

    await api.getFamily();
    await api.createInvitation({ rolFamiliar: "hija", parentesco: "hija" });
    await api.joinFamilyByCode({ codigo: "ABCD" });

    expect(fetchMock.mock.calls[0][0]).toContain("/families/me");
    expect(fetchMock.mock.calls[1][0]).toContain("/families/me/invitations");
    expect(fetchMock.mock.calls[2][0]).toContain("/invitations/join");
    expect(fetchMock.mock.calls[1][1].body).toBe(
      JSON.stringify({ rol_familiar: "hija", parentesco: "hija" }),
    );
    expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ codigo: "ABCD" }));
  });

  it("deletes the account through the users endpoint", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204, text: async () => "" });

    await api.deleteAccount();

    expect(fetchMock.mock.calls[0][0]).toContain("/users/me");
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });

  it("refreshes the session and retries once after a 401", async () => {
    mockSession.getSession.mockReturnValue({
      access_token: "old-access",
      refresh_token: "refresh-token",
      user: {
        id: "user-1",
        email: "ana@example.com",
        nombre_visualizacion: "Ana",
        foto_avatar: "https://example.com/ana.png",
        family_id: "family-1",
        role: "admin",
      },
      needs_profile_setup: false,
      needs_family_setup: false,
    });
    mockSession.applyTokenResponse.mockReturnValue({
      access_token: "new-access",
      refresh_token: "new-refresh",
      user: {
        id: "user-1",
        email: "ana@example.com",
        nombre_visualizacion: "Ana",
        foto_avatar: "https://example.com/ana.png",
        family_id: "family-1",
        role: "admin",
      },
      needs_profile_setup: false,
      needs_family_setup: false,
    });

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: "Invalid or expired token" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "new-access",
          refresh_token: "new-refresh",
          token_type: "bearer",
          user: { id: "user-1", email: "ana@example.com" },
          needs_profile_setup: false,
          needs_family_setup: false,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ family: {}, members: [], member_count: 0 }));

    await api.getFamily();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    expect(fetchMock.mock.calls[2][0]).toContain("/families/me");
    expect(mockSession.applyTokenResponse).toHaveBeenCalled();
  });

  it("can refresh after an earlier 401 without a refresh token", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Missing authentication token" }, 401));

    await expect(api.getFamily()).rejects.toBeInstanceOf(ApiError);

    const refreshedSession = {
      access_token: "new-access",
      refresh_token: "new-refresh",
      user: {
        id: "user-1",
        email: "ana@example.com",
        nombre_visualizacion: "Ana",
        foto_avatar: "https://example.com/ana.png",
        family_id: "family-1",
        role: "admin",
      },
      needs_profile_setup: false,
      needs_family_setup: false,
    };

    mockSession.getSession.mockReturnValue({
      ...refreshedSession,
      access_token: "old-access",
      refresh_token: "refresh-token",
    });
    mockSession.applyTokenResponse.mockReturnValue(refreshedSession);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: "Invalid or expired token" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "new-access",
          refresh_token: "new-refresh",
          token_type: "bearer",
          user: { id: "user-1", email: "ana@example.com" },
          needs_profile_setup: false,
          needs_family_setup: false,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ family: {}, members: [], member_count: 0 }));

    await api.getFamily();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[2][0]).toContain("/auth/refresh");
    expect(fetchMock.mock.calls[3][0]).toContain("/families/me");
    expect(mockSession.applyTokenResponse).toHaveBeenCalled();
  });

  it("validates the session against the backend", async () => {
    const current = {
      access_token: "validate-token-a",
      refresh_token: "refresh-a",
      user: {
        id: "user-1",
        email: "ana@example.com",
        nombre_visualizacion: "Ana",
        foto_avatar: null,
        family_id: null,
        role: null,
      },
      needs_profile_setup: false,
      needs_family_setup: true,
    };
    const reconciled = { ...current, needs_family_setup: false };
    mockSession.getSession.mockReturnValue(current);
    mockSession.applySessionInfo.mockReturnValue(reconciled);
    fetchMock.mockResolvedValue(
      jsonResponse({
        user: { ...current.user, family_id: "family-1", role: "admin" },
        needs_profile_setup: false,
        needs_family_setup: false,
      }),
    );

    const result = await validateSession();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/auth/session");
    expect(mockSession.applySessionInfo).toHaveBeenCalled();
    expect(result).toBe(reconciled);
  });

  it("validates only once per access token", async () => {
    const current = {
      access_token: "validate-token-b",
      refresh_token: "refresh-b",
      user: {
        id: "user-1",
        email: "ana@example.com",
        nombre_visualizacion: "Ana",
        foto_avatar: null,
        family_id: "family-1",
        role: "admin",
      },
      needs_profile_setup: false,
      needs_family_setup: false,
    };
    mockSession.getSession.mockReturnValue(current);
    mockSession.applySessionInfo.mockReturnValue(current);
    fetchMock.mockResolvedValue(
      jsonResponse({
        user: current.user,
        needs_profile_setup: false,
        needs_family_setup: false,
      }),
    );

    await validateSession();
    await validateSession();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the session when validation fails on the network", async () => {
    mockSession.getSession.mockReturnValue({
      access_token: "validate-token-c",
      refresh_token: "refresh-c",
      user: {
        id: "user-1",
        email: "ana@example.com",
        nombre_visualizacion: "Ana",
        foto_avatar: null,
        family_id: "family-1",
        role: "admin",
      },
      needs_profile_setup: false,
      needs_family_setup: false,
    });
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));

    await expect(validateSession()).rejects.toMatchObject({ status: 0 });
    expect(mockSession.clearSession).not.toHaveBeenCalled();
  });

  it("clears the session when the backend rejects it with 401", async () => {
    mockSession.getSession.mockReturnValue({
      access_token: "validate-token-d",
      refresh_token: "refresh-d",
      user: {
        id: "user-1",
        email: "ana@example.com",
        nombre_visualizacion: "Ana",
        foto_avatar: null,
        family_id: "family-1",
        role: "admin",
      },
      needs_profile_setup: false,
      needs_family_setup: false,
    });
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: "User no longer exists" }, 401))
      .mockResolvedValueOnce(jsonResponse({ detail: "Invalid refresh token" }, 401));

    await expect(validateSession()).rejects.toMatchObject({ status: 401 });
    expect(mockSession.clearSession).toHaveBeenCalled();
  });
});
