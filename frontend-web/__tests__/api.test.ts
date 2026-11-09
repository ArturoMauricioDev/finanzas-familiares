import { api, ApiError, getApiBaseUrl } from "../lib/api";
import * as sessionModule from "../lib/session";

jest.mock("../lib/session", () => ({
  getAccessToken: jest.fn(() => "test-token"),
  getSession: jest.fn(() => null),
  applyTokenResponse: jest.fn(),
  clearSession: jest.fn(),
}));

const fetchMock = jest.fn();
const mockSession = sessionModule as jest.Mocked<typeof sessionModule>;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  mockSession.getSession.mockReturnValue(null);
  mockSession.applyTokenResponse.mockReset();
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
    await api.createInvitation();
    await api.joinFamilyByCode({ codigo: "ABCD", parentesco: "hija" });

    expect(fetchMock.mock.calls[0][0]).toContain("/families/me");
    expect(fetchMock.mock.calls[1][0]).toContain("/families/me/invitations");
    expect(fetchMock.mock.calls[2][0]).toContain("/invitations/join");
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify({ expira_en_horas: 168 }));
    expect(fetchMock.mock.calls[2][1].body).toBe(
      JSON.stringify({ codigo: "ABCD", parentesco: "hija" }),
    );
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
});
