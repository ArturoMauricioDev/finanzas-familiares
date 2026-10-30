import { api, ApiError } from "../lib/api";

jest.mock("../lib/session", () => ({
  getAccessToken: jest.fn(() => "test-token"),
}));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

describe("api client", () => {
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
      message: "Revisa los datos ingresados e inténtalo de nuevo.",
    });
  });

  it("throws ApiError on unauthorized responses", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Missing authentication token" }, 401));

    await expect(api.getFamily()).rejects.toBeInstanceOf(ApiError);
  });

  it("calls the family and invitation endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ family: {}, members: [], member_count: 0 }))
      .mockResolvedValueOnce(jsonResponse({ invitation_id: "i", token: "t", link: "l" }))
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
    await api.joinInvitation({ token: "t", parentesco: "hija" });

    expect(fetchMock.mock.calls[0][0]).toContain("/families/me");
    expect(fetchMock.mock.calls[1][0]).toContain("/families/me/invitations");
    expect(fetchMock.mock.calls[2][0]).toContain("/invitations/join");
  });
});
