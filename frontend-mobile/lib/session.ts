import * as SecureStore from "expo-secure-store";

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

export async function getSession(): Promise<SessionState | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: SessionState): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function updateSession(patch: Partial<SessionState>): Promise<SessionState | null> {
  const current = await getSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  await saveSession(next);
  return next;
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

export async function applyTokenResponse(data: TokenResponse): Promise<SessionState> {
  const session: SessionState = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    needs_profile_setup: data.needs_profile_setup,
    needs_family_setup: data.needs_family_setup,
  };
  await saveSession(session);
  return session;
}

export async function applyFamilyCreated(data: FamilyCreateResponse): Promise<SessionState | null> {
  const current = await getSession();
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
  await saveSession(next);
  return next;
}

export async function applyInvitationJoined(
  data: JoinInvitationResponse,
): Promise<SessionState | null> {
  const current = await getSession();
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
  await saveSession(next);
  return next;
}
