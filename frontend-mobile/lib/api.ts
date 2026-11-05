import { API_URL } from "./env";
import { ApiError, ConfigurationError, resolveError } from "./errors";
import {
  applyTokenResponse,
  clearSession,
  getAccessToken,
  getSession,
  type SessionState,
} from "./session";
import type {
  FamilyCreateResponse,
  FamilyDetail,
  Invitation,
  JoinInvitationResponse,
  TokenResponse,
  UserResponse,
} from "./types";

export function getApiBaseUrl(): string {
  const configured = API_URL?.trim();
  if (!configured) {
    throw new ConfigurationError("errors.details.missingMobileApiUrl");
  }
  return configured.replace(/\/$/, "");
}

export type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export function clearUnauthorizedHandler(handler: UnauthorizedHandler): void {
  if (unauthorizedHandler === handler) {
    unauthorizedHandler = null;
  }
}

function notifyUnauthorized(): void {
  unauthorizedHandler?.();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
  allowRefresh = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (authenticated) {
    const token = await getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const baseUrl = getApiBaseUrl();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1${path}`, {
      ...options,
      headers,
    });
  } catch {
    const descriptor = resolveError(0);
    throw new ApiError(0, descriptor.key, descriptor.fallback);
  }

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
    if (response.status === 401 && authenticated && allowRefresh) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return request<T>(path, options, authenticated, false);
      }
    }

    if (response.status === 401 && authenticated) {
      await clearSession();
      notifyUnauthorized();
    }

    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? (data as { detail: unknown }).detail
        : undefined;
    const descriptor = resolveError(response.status, detail);
    throw new ApiError(response.status, descriptor.key, descriptor.fallback);
  }

  return data as T;
}

let refreshPromise: Promise<SessionState | null> | null = null;

export function refreshSession(): Promise<SessionState | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const session = await getSession();
        if (!session?.refresh_token) {
          await clearSession();
          return null;
        }

        const data = await request<TokenResponse>(
          "/auth/refresh",
          { method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }) },
          false,
          false,
        );
        return applyTokenResponse(data);
      } catch {
        await clearSession();
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export const api = {
  signInWithGoogle(idToken: string): Promise<TokenResponse> {
    return request<TokenResponse>(
      "/auth/google",
      { method: "POST", body: JSON.stringify({ id_token: idToken }) },
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

  promoteMember(userId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/families/me/members/${userId}/promote`, {
      method: "POST",
    });
  },

  removeMember(userId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/families/me/members/${userId}`, {
      method: "DELETE",
    });
  },
};

export { ApiError, ConfigurationError };

export const signInWithGoogle = api.signInWithGoogle;
