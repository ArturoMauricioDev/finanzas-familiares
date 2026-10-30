import { translateApiError } from "./errors";
import { getAccessToken } from "./session";
import type {
  FamilyCreateResponse,
  FamilyDetail,
  Invitation,
  JoinInvitationResponse,
  TokenResponse,
  UserResponse,
} from "./types";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (authenticated) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? (data as { detail: unknown }).detail
        : undefined;
    const message = translateApiError(response.status, detail);
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  signInWithGoogle(idToken: string): Promise<TokenResponse> {
    return request<TokenResponse>(
      "/auth/google",
      { method: "POST", body: JSON.stringify({ id_token: idToken }) },
      false,
    );
  },

  refresh(refreshToken: string): Promise<TokenResponse> {
    return request<TokenResponse>(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
      false,
    );
  },

  updateProfile(payload: {
    nombre_visualizacion: string;
    foto_avatar: string;
  }): Promise<UserResponse> {
    return request<UserResponse>("/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  createFamily(payload: { nombre: string; moneda_local: string }): Promise<FamilyCreateResponse> {
    return request<FamilyCreateResponse>("/families", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getFamily(): Promise<FamilyDetail> {
    return request<FamilyDetail>("/families/me");
  },

  createInvitation(expiraEnHoras = 72): Promise<Invitation> {
    return request<Invitation>("/families/me/invitations", {
      method: "POST",
      body: JSON.stringify({ expira_en_horas: expiraEnHoras }),
    });
  },

  joinInvitation(payload: { token: string; parentesco?: string }): Promise<JoinInvitationResponse> {
    return request<JoinInvitationResponse>("/invitations/join", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  promoteMember(userId: string): Promise<{ success: boolean; role: string }> {
    return request<{ success: boolean; role: string }>(`/families/me/members/${userId}/promote`, {
      method: "POST",
    });
  },

  removeMember(userId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/families/me/members/${userId}`, {
      method: "DELETE",
    });
  },
};

export const signInWithGoogle = api.signInWithGoogle;
