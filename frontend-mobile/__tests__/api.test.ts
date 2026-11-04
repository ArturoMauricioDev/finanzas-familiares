import { api, ApiError } from "../lib/api";
import * as sessionModule from "../lib/session";

jest.mock("../lib/env", () => ({ API_URL: "http://localhost:8000" }));

jest.mock("../lib/session", () => ({
  getAccessToken: jest.fn(async () => "test-token"),
  getSession: jest.fn(async () => null),
  applyTokenResponse: jest.fn(),
  clearSession: jest.fn(async () => {}),
}));

const fetchMock = jest.fn();
const mockSession = sessionModule as jest.Mocked<typeof sessionModule>;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  mockSession.getSession.mockResolvedValue(null);
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

describe("mobile api client", () => {
  it("translates transport failures to a readable ApiError", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));

    await expect(api.getFamily()).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      message: "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
    });
  });

  it("signs in with Google without an Authorization header", async () => {
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

    await api.signInWithGoogle("google-token");

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
    expect(fetchMock.mock.calls[0][0]).toContain("/api/v1/auth/google");
  });

  it("sends the access token on authenticated calls", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await api.getFamily();

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("throws ApiError with a readable message", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: "La moneda local debe ser un código ISO 4217 válido" }, 422),
    );

    await expect(
      api.createFamily({ nombre: "Familia", moneda_local: "MXNX" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
    });
  });

  it("uses the invitation and membership endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ invitation_id: "i", token: "t", link: "l" }))
      .mockResolvedValueOnce(
        jsonResponse({
          family_id: "f",
          role: "member",
          estado: "activo",
          tokens: { access_token: "a", refresh_token: "r", token_type: "bearer" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ success: true }));

    await api.createInvitation();
    await api.joinInvitation({ token: "t" });
    await api.promoteMember("user-1");

    expect(fetchMock.mock.calls[0][0]).toContain("/families/me/invitations");
    expect(fetchMock.mock.calls[1][0]).toContain("/invitations/join");
    expect(fetchMock.mock.calls[2][0]).toContain("/members/user-1/promote");
  });

  it("refreshes the session and retries once after a 401", async () => {
    mockSession.getSession.mockResolvedValue({
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
    mockSession.applyTokenResponse.mockResolvedValue({
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

    mockSession.getSession.mockResolvedValue({
      ...refreshedSession,
      access_token: "old-access",
      refresh_token: "refresh-token",
    });
    mockSession.applyTokenResponse.mockResolvedValue(refreshedSession);

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
