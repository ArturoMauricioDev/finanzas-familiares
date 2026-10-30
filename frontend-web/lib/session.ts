import type {
  FamilyCreateResponse,
  JoinInvitationResponse,
  TokenResponse,
  UserAuthInfo,
} from "./types";

export interface SessionState {
  access_token: string;
  refresh_token: string;
  user: UserAuthInfo;
  needs_profile_setup: boolean;
  needs_family_setup: boolean;
}

const SESSION_KEY = "finanzas_familiares_session";

export function getSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function updateSession(patch: Partial<SessionState>): SessionState | null {
  const current = getSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveSession(next);
  return next;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getAccessToken(): string | null {
  return getSession()?.access_token ?? null;
}

export function applyTokenResponse(data: TokenResponse): SessionState {
  const session: SessionState = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    needs_profile_setup: data.needs_profile_setup,
    needs_family_setup: data.needs_family_setup,
  };
  saveSession(session);
  return session;
}

export function applyFamilyCreated(data: FamilyCreateResponse): SessionState | null {
  const current = getSession();
  if (!current) return null;
  const next: SessionState = {
    ...current,
    access_token: data.tokens.access_token,
    refresh_token: data.tokens.refresh_token,
    user: {
      ...current.user,
      family_id: data.family.id,
      role: data.membership.role,
    },
    needs_family_setup: false,
  };
  saveSession(next);
  return next;
}

export function applyInvitationJoined(data: JoinInvitationResponse): SessionState | null {
  const current = getSession();
  if (!current) return null;
  const next: SessionState = {
    ...current,
    access_token: data.tokens.access_token,
    refresh_token: data.tokens.refresh_token,
    user: {
      ...current.user,
      family_id: data.family_id,
      role: data.role,
    },
    needs_family_setup: false,
  };
  saveSession(next);
  return next;
}
