import { api } from "../lib/api";

jest.mock("../lib/session", () => ({
  getAccessToken: jest.fn(async () => "test-token"),
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

describe("mobile api client", () => {
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
      .mockResolvedValueOnce(jsonResponse({ success: true, role: "admin" }));

    await api.createInvitation();
    await api.joinInvitation({ token: "t" });
    await api.promoteMember("user-1");

    expect(fetchMock.mock.calls[0][0]).toContain("/families/me/invitations");
    expect(fetchMock.mock.calls[1][0]).toContain("/invitations/join");
    expect(fetchMock.mock.calls[2][0]).toContain("/members/user-1/promote");
  });
});
