import { ApiError, ConfigurationError, resolveError } from "./errors";
import {
  applySessionInfo,
  applyTokenResponse,
  clearSession,
  getAccessToken,
  getSession,
  type SessionState,
} from "./session";
import type {
  FamilyCreateResponse,
  FamilyDetail,
  FamilyLifecycleResponse,
  FamilyRole,
  Invitation,
  JoinInvitationResponse,
  SessionResponse,
  TokenResponse,
  UserResponse,
} from "./types";

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) {
    throw new ConfigurationError("errors.details.missingWebApiUrl");
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
    const token = getAccessToken();
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
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? (data as { detail: unknown }).detail
        : undefined;
    const descriptor = resolveError(response.status, detail);

    if (response.status === 401 && authenticated && allowRefresh) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return request<T>(path, options, authenticated, false);
      }
      // `refreshSession` solo limpia la sesión ante un 401 definitivo; ante un
      // fallo de red transitorio la conserva, así que no la descartamos aquí.
      if (!getSession()) {
        notifyUnauthorized();
      }
      throw new ApiError(response.status, descriptor.key, descriptor.fallback);
    }

    if (response.status === 401 && authenticated) {
      clearSession();
      notifyUnauthorized();
    }

    throw new ApiError(response.status, descriptor.key, descriptor.fallback);
  }

  return data as T;
}

let refreshPromise: Promise<SessionState | null> | null = null;

export function refreshSession(): Promise<SessionState | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const session = getSession();
        if (!session?.refresh_token) {
          clearSession();
          return null;
        }

        const data = await request<TokenResponse>(
          "/auth/refresh",
          { method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }) },
          false,
          false,
        );
        return applyTokenResponse(data);
      } catch (error) {
        // Un 401 significa que el refresh token ya no es válido: la sesión
        // persistida quedó obsoleta y se limpia. Un fallo de red o 5xx es
        // transitorio y conserva la sesión para poder reintentar.
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
        }
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

let sessionValidationPromise: Promise<SessionState | null> | null = null;
let lastValidatedToken: string | null = null;

/**
 * Valida la sesión vigente contra `GET /auth/session` una vez por access token.
 *
 * Detecta usuarios o membresías que ya no existen aunque el JWT siga vigente,
 * reconcilia los flags de onboarding y conserva la sesión ante fallos de red
 * transitorios (el llamador decide si usa el estado local como respaldo).
 */
export function validateSession(): Promise<SessionState | null> {
  const current = getSession();
  if (!current?.access_token) {
    return Promise.resolve(null);
  }

  if (lastValidatedToken === current.access_token) {
    return Promise.resolve(current);
  }

  if (!sessionValidationPromise) {
    const token = current.access_token;
    sessionValidationPromise = (async () => {
      const data = await request<SessionResponse>("/auth/session", { method: "GET" });
      lastValidatedToken = token;
      return applySessionInfo(data);
    })().finally(() => {
      sessionValidationPromise = null;
    });
  }

  return sessionValidationPromise;
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

  createFamily(payload: {
    nombre: string;
    moneda_local: string;
    rol_familiar?: string;
  }): Promise<FamilyCreateResponse> {
    return request<FamilyCreateResponse>("/families", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getFamily(): Promise<FamilyDetail> {
    return request<FamilyDetail>("/families/me");
  },

  createInvitation(payload: {
    rolFamiliar: FamilyRole;
    parentesco?: string;
  }): Promise<Invitation> {
    return request<Invitation>("/families/me/invitations", {
      method: "POST",
      body: JSON.stringify({
        rol_familiar: payload.rolFamiliar,
        parentesco: payload.parentesco,
      }),
    });
  },

  joinFamilyByCode(payload: { codigo: string }): Promise<JoinInvitationResponse> {
    return request<JoinInvitationResponse>("/invitations/join", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  joinInvitation(payload: { token: string }): Promise<JoinInvitationResponse> {
    return api.joinFamilyByCode({ codigo: payload.token });
  },

  leaveFamily(): Promise<FamilyLifecycleResponse> {
    return request<FamilyLifecycleResponse>("/families/me/leave", {
      method: "POST",
    });
  },

  deleteFamily(): Promise<FamilyLifecycleResponse> {
    return request<FamilyLifecycleResponse>("/families/me", {
      method: "DELETE",
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
