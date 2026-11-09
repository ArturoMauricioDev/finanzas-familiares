import * as SecureStore from "expo-secure-store";

import type {
  FamilyCreateResponse,
  FamilyLifecycleResponse,
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
const PENDING_INVITE_KEY = "finanzas_familiares_pending_invite";

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

export async function savePendingInviteCode(code: string): Promise<void> {
  if (!code) return;
  await SecureStore.setItemAsync(PENDING_INVITE_KEY, code);
}

export async function getPendingInviteCode(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
}

export async function clearPendingInviteCode(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
}

export const savePendingInviteToken = savePendingInviteCode;
export const getPendingInviteToken = getPendingInviteCode;
export const clearPendingInviteToken = clearPendingInviteCode;

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

export function sessionNeedsRefresh(session: SessionState | null): boolean {
  if (!session) return false;
  if (!session.user?.id) return true;
  return (
    typeof session.needs_profile_setup !== "boolean" ||
    typeof session.needs_family_setup !== "boolean"
  );
}

export async function reconcileFamilyFlag(session: SessionState): Promise<SessionState> {
  const needsFamilySetup = !session.user?.family_id;
  if (session.needs_family_setup === needsFamilySetup) return session;

  const next = { ...session, needs_family_setup: needsFamilySetup };
  await saveSession(next);
  return next;
}

export async function clearStalePendingInvite(session: SessionState): Promise<void> {
  if (session.user?.family_id && !session.needs_family_setup) {
    await clearPendingInviteToken();
  }
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
  await clearStalePendingInvite(session);
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

export async function applyFamilyLeft(
  data?: FamilyLifecycleResponse,
): Promise<SessionState | null> {
  const current = await getSession();
  if (!current) return null;
  const next: SessionState = {
    ...current,
    access_token: data?.tokens?.access_token ?? current.access_token,
    refresh_token: data?.tokens?.refresh_token ?? current.refresh_token,
    user: {
      ...current.user,
      family_id: null,
      role: null,
    },
    needs_family_setup: true,
  };
  await saveSession(next);
  await clearPendingInviteCode();
  return next;
}
